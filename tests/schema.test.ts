import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/* ─────────────────────────────────────────────────────────────
   AETHERIS · the schema, replayed and probed on a real Postgres

   PGlite is Postgres compiled to WASM, so this runs the actual migrations
   against an actual empty database — no server to install, no network, a
   couple of seconds. It answers the two questions the access-control
   audit could only reason about:

     • do the migrations apply cleanly, in order, from nothing?
     • what can each ROLE actually do once they have?

   The roles are set up the way Supabase sets them up — anon and
   authenticated hold full table grants, and RLS is the only gate.
   Reproducing that faithfully matters in both directions: making them
   stricter here would manufacture a pass that production would not honour.

   What this CANNOT test, and what still needs a real server: concurrency.
   PGlite is a single connection, so the advisory locks that close the
   rate-limit and capacity races are exercised for correctness but never
   for contention. scripts/probe-rate-limit-race.mjs is what measures that.
   ───────────────────────────────────────────────────────────── */

/** Apply order matters — several files alter what earlier ones create. */
const MIGRATIONS = [
  "reports.sql",
  "rate-limit.sql",
  "corroboration.sql",
  "community-2.sql",
  "rate-limit-concurrency.sql",
  "bounds-and-capacity.sql",
  "privacy-hardening.sql",
];

/** Applied after the Supabase-style blanket grant, as in production. */
const HARDENING = "privacy-hardening.sql";

const DIR = join(process.cwd(), "supabase");
const VALID = `'a valid probe title','a valid probe body long enough to pass'`;

let db: PGlite;

/** A device id in the private v2 format the hardened functions accept. */
const dev = (n: number) => `v2-00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let reportId: string;

/** Run `sql` as `role`, and say whether it was allowed. */
async function asRole(role: string, sql: string, params: unknown[] = []) {
  await db.exec(`set role ${role}`);
  try {
    await db.query(sql, params);
    return { allowed: true, error: "" };
  } catch (e) {
    return { allowed: false, error: String((e as Error).message).split("\n")[0] };
  } finally {
    await db.exec("reset role");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin noinherit;
    create role authenticated nologin noinherit;
    create role service_role nologin noinherit bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  `);
  for (const f of MIGRATIONS.filter((m) => m !== HARDENING)) {
    await db.exec(readFileSync(join(DIR, f), "utf8"));
  }
  // Supabase grants every table to the API roles when it is created. That
  // has to happen BEFORE the hardening file, as it does in production —
  // re-granting afterwards would quietly undo what is under test.
  await db.exec(`grant all on all tables in schema public to anon, authenticated, service_role;`);
  await db.exec(readFileSync(join(DIR, HARDENING), "utf8"));

  await db.exec(`
    insert into public.reports (anon_id, author, city, lat, lon, category, severity, title, body)
    values ('probe-device-0001','Anonymous','Almaty',43.238,76.889,'air','low',${VALID});
  `);
  reportId = (await db.query<{ id: string }>(`select id from public.reports limit 1`)).rows[0].id;
}, 60_000);

describe("migrations", () => {
  it("apply cleanly in order to an empty database", () => {
    // beforeAll would have thrown otherwise; this asserts it got that far.
    expect(reportId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("leave every table with row-level security enabled", async () => {
    const r = await db.query<{ relname: string; relrowsecurity: boolean }>(`
      select c.relname, c.relrowsecurity from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname='public' and c.relkind='r'`);
    for (const t of r.rows) expect(t.relrowsecurity, `${t.relname} has RLS off`).toBe(true);
  });

  it("grant EXECUTE on the operator-only functions to service_role only", async () => {
    const r = await db.query<{ proname: string; acl: string | null }>(`
      select p.proname, array_to_string(p.proacl,' | ') as acl
        from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public'
         and p.proname in ('mark_report_forwarded','record_org_response')`);
    expect(r.rows).toHaveLength(2);
    for (const f of r.rows) {
      expect(f.acl, `${f.proname} is callable by PUBLIC`).not.toBeNull();
      expect(f.acl, `${f.proname} grants anon`).not.toMatch(/(^|\|)\s*anon=/);
      expect(f.acl, `${f.proname} grants authenticated`).not.toMatch(/authenticated=/);
      expect(f.acl, `${f.proname} does not grant service_role`).toMatch(/service_role=/);
    }
  });

  it("gives reports no UPDATE or DELETE policy at all", async () => {
    const r = await db.query<{ cmd: string }>(
      `select cmd from pg_policies where schemaname='public' and tablename='reports'`,
    );
    const cmds = r.rows.map((x) => x.cmd);
    expect(cmds).not.toContain("UPDATE");
    expect(cmds).not.toContain("DELETE");
  });
});

/* The binary question, asked of both browser-reachable roles. */
describe.each(["anon", "authenticated"])("role %s cannot reach statuses 4 or 5", (role) => {
  it("is refused EXECUTE on mark_report_forwarded", async () => {
    const r = await asRole(role, `select public.mark_report_forwarded($1,'p','p',null)`, [reportId]);
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/permission denied for function/);
  });

  it("is refused EXECUTE on record_org_response", async () => {
    const r = await asRole(role, `select public.record_org_response($1,'p','p')`, [reportId]);
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/permission denied for function/);
  });

  it("cannot file a report already at a status it did not earn", async () => {
    const r = await asRole(
      role,
      `insert into public.reports (anon_id,city,category,severity,title,body,status)
       values ('probe-device-esc','Almaty','air','low',${VALID},'forwarded')`,
    );
    expect(r.allowed).toBe(false);
    // Denied by the column grant now, before RLS is even consulted.
    expect(r.error).toMatch(/permission denied|row-level security/);
  });

  /* Values long enough to clear their own length CHECKs, so the denial can
     only be the policy. A probe rejected for the wrong reason is a green
     test that proves nothing — this file has already made that mistake
     twice, with a too-short title and a too-short anon_id. */
  it("cannot write the forwarding log directly", async () => {
    const r = await asRole(
      role,
      `insert into public.report_forwardings (report_id,destination,actor)
       values ($1,'a valid destination','a valid actor')`,
      [reportId],
    );
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/permission denied|row-level security/);
  });

  /* RLS denial on UPDATE is silent — zero rows touched, no error — so this
     is judged on the row afterwards, never on whether the call threw. */
  it("cannot escalate an existing report by UPDATE", async () => {
    const before = (
      await db.query<{ status: string }>(`select status from public.reports where id=$1`, [reportId])
    ).rows[0].status;
    await asRole(role, `update public.reports set status='forwarded' where id=$1`, [reportId]);
    const after = (
      await db.query<{ status: string }>(`select status from public.reports where id=$1`, [reportId])
    ).rows[0].status;
    expect(after).toBe(before);
    expect(after).not.toBe("forwarded");
  });
});

describe("coverage bounds", () => {
  it("accepts a report from inside the coverage area", async () => {
    const r = await asRole(
      "anon",
      `insert into public.reports (anon_id,city,lat,lon,category,severity,title,body)
       values ('probe-inside','Almaty',43.238,76.889,'air','low',${VALID})`,
    );
    expect(r.allowed, r.error).toBe(true);
  });

  it("rejects a report from outside it", async () => {
    const r = await asRole(
      "anon",
      `insert into public.reports (anon_id,city,lat,lon,category,severity,title,body)
       values ('probe-outside','Nowhere',0,0,'air','low',${VALID})`,
    );
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/reports_within_coverage/);
  });

  it("rejects an event from outside it", async () => {
    const r = await asRole(
      "anon",
      `insert into public.events (anon_id,title,description,place,lat,lon,starts_at)
       values ('probe-device-events','a valid event title','a valid description','Nowhere',0,0, now() + interval '2 days')`,
    );
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/events_within_coverage/);
  });
});

describe("the corroboration rule", () => {
  it("flips both reports when a second device reports the same thing", async () => {
    // A city/category pair nothing else in this file has touched, so the
    // rule is observed in isolation.
    await db.exec(`
      insert into public.reports (anon_id,author,city,lat,lon,category,severity,title,body)
      values ('device-A','x','Atyrau',47.094,51.923,'water','low',${VALID});
    `);
    const before = await db.query<{ status: string }>(
      `select status from public.reports where city='Atyrau' and category='water'`,
    );
    expect(before.rows.every((r) => r.status === "submitted")).toBe(true);

    await db.exec(`
      insert into public.reports (anon_id,author,city,lat,lon,category,severity,title,body)
      values ('device-B','y','Atyrau',47.09,51.92,'water','low',${VALID});
    `);
    const after = await db.query<{ status: string }>(
      `select status from public.reports where city='Atyrau' and category='water'`,
    );
    expect(after.rows).toHaveLength(2);
    expect(after.rows.every((r) => r.status === "corroborated")).toBe(true);
  });

  it("does not corroborate one device reporting twice", async () => {
    await db.exec(`
      insert into public.reports (anon_id,author,city,lat,lon,category,severity,title,body)
      values ('device-solo','x','Aktau',43.651,51.157,'waste','low',${VALID}),
             ('device-solo','x','Aktau',43.651,51.157,'waste','low',${VALID});
    `);
    const r = await db.query<{ status: string }>(
      `select status from public.reports where city='Aktau' and category='waste'`,
    );
    expect(r.rows).toHaveLength(2);
    expect(r.rows.every((x) => x.status === "submitted")).toBe(true);
  });
});

describe("the participant cap", () => {
  /* Was a documented known limitation: setRsvp() read the count and
     compared it to the cap before writing, so the last place could go
     twice. Enforced in the database now, which is the only place it can
     be. Checked here for correctness; contention still needs a real
     server, since PGlite is one connection. */
  let eventId: string;

  beforeAll(async () => {
    await db.exec(`
      insert into public.events (anon_id,title,description,place,lat,lon,starts_at,capacity)
      values ('organiser-device-01','a valid event title','a valid description','Almaty',
              43.238,76.889, now() + interval '2 days', 2);
    `);
    eventId = (
      await db.query<{ id: string }>(`select id from public.events limit 1`)
    ).rows[0].id;
  });

  it("accepts RSVPs up to the cap", async () => {
    for (const who of [dev(1), dev(2)]) {
      const r = await asRole("anon", `select public.rsvp_event($1,$2)`, [eventId, who]);
      expect(r.allowed, `${who}: ${r.error}`).toBe(true);
    }
  });

  it("refuses the one past it", async () => {
    const r = await asRole("anon", `select public.rsvp_event($1,$2)`, [eventId, dev(3)]);
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/event_full/);
  });

  /* Someone re-confirming a place they already hold is not taking a
     second one, and must not be turned away by a full event. */
  it("still lets an existing attendee re-confirm a full event", async () => {
    const r = await asRole("anon", `select public.rsvp_event($1,$2)`, [eventId, dev(1)]);
    expect(r.allowed, r.error).toBe(true);
  });

  it("leaves an uncapped event uncapped", async () => {
    await db.exec(`
      insert into public.events (anon_id,title,description,place,lat,lon,starts_at,capacity)
      values ('organiser-device-02','an uncapped event','a valid description','Astana',
              51.169,71.449, now() + interval '3 days', null);
    `);
    const open = (
      await db.query<{ id: string }>(
        `select id from public.events where anon_id='organiser-device-02'`,
      )
    ).rows[0].id;
    for (const n of [11, 12, 13, 14, 15]) {
      const r = await asRole("anon", `select public.rsvp_event($1,$2)`, [open, dev(n)]);
      expect(r.allowed, r.error).toBe(true);
    }
  });
});

describe("service_role, the other half of the claim", () => {
  it("CAN set 4, and the transfer is logged", async () => {
    const target = (
      await db.query<{ id: string }>(
        `select id from public.reports where city='Aktau' limit 1`,
      )
    ).rows[0].id;

    const r = await asRole(
      "service_role",
      `select public.mark_report_forwarded($1,'Акимат Алматы','audit',null)`,
      [target],
    );
    expect(r.allowed, r.error).toBe(true);

    const row = (
      await db.query<{ status: string; forwarded_to: string }>(
        `select status, forwarded_to from public.reports where id=$1`,
        [target],
      )
    ).rows[0];
    expect(row.status).toBe("forwarded");
    expect(row.forwarded_to).toBe("Акимат Алматы");

    const log = await db.query<{ n: number }>(
      `select count(*)::int as n from public.report_forwardings where report_id=$1`,
      [target],
    );
    expect(log.rows[0].n).toBe(1);
  });
});

/* ─────────────────────────────────────────────────────────────
   privacy-hardening.sql — what a visitor can and cannot reach now.
   Every probe below is run as a browser role; the assertion is on what
   the database did, not on what the client would have sent.
   ───────────────────────────────────────────────────────────── */

const PUBLIC_REPORT_COLS =
  "id, created_at, author, city, lat, lon, category, severity, title, body, status, upvotes";

describe.each(["anon", "authenticated"])("role %s · personal data is not readable", (role) => {
  it("cannot read anon_id on reports", async () => {
    const r = await asRole(role, `select anon_id from public.reports limit 1`);
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/permission denied/);
  });

  it("cannot filter reports by anon_id either", async () => {
    const r = await asRole(role, `select id from public.reports where anon_id = 'probe-device-0001'`);
    expect(r.allowed).toBe(false);
  });

  it("can read the public column list", async () => {
    const r = await asRole(role, `select ${PUBLIC_REPORT_COLS} from public.reports limit 1`);
    expect(r.allowed, r.error).toBe(true);
  });

  it("cannot read anon_id on events", async () => {
    const r = await asRole(role, `select anon_id from public.events limit 1`);
    expect(r.allowed).toBe(false);
  });

  it.each(["event_rsvps", "event_checkins"])("cannot read %s at all", async (t) => {
    const r = await asRole(role, `select event_id from public.${t} limit 1`);
    expect(r.allowed).toBe(false);
  });

  it("cannot touch the private schema", async () => {
    for (const sql of [
      `select * from private.network_hits`,
      `select * from private.daily_salt`,
      `select private.client_ip_hash()`,
    ]) {
      const r = await asRole(role, sql);
      expect(r.allowed, sql).toBe(false);
    }
  });
});

describe.each(["anon", "authenticated"])("role %s · writes only what a submission needs", (role) => {
  it.each([
    ["status", "'submitted'"],
    ["upvotes", "0"],
    ["author", "'Somebody Real'"],
    ["forwarded_to", "'Akimat'"],
    ["org_response", "'We fixed it'"],
    ["org_response_org", "'Ministry'"],
  ])("cannot set %s on insert", async (col, val) => {
    const r = await asRole(
      role,
      `insert into public.reports (anon_id,city,category,severity,title,body,${col})
       values ('probe-cols-0001','Almaty','air','low',${VALID},${val})`,
    );
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/permission denied/);
  });

  it("cannot delete RSVPs directly — the old open policy is gone", async () => {
    await db.exec(`
      insert into public.events (anon_id,title,description,place,lat,lon,starts_at)
      values ('organiser-del-01','an event to attack','a valid description','Almaty',
              43.238,76.889, now() + interval '5 days');`);
    const ev = (
      await db.query<{ id: string }>(`select id from public.events where anon_id='organiser-del-01' limit 1`)
    ).rows[0].id;
    await db.query(`select public.rsvp_event($1,$2)`, [ev, dev(900)]);
    await asRole(role, `delete from public.event_rsvps where event_id = $1`, [ev]);
    const left = await db.query<{ n: number }>(
      `select count(*)::int n from public.event_rsvps where event_id=$1`, [ev]);
    expect(left.rows[0].n).toBe(1);
    await db.exec(`delete from public.events where anon_id='organiser-del-01'`);
  });
});

describe("location precision", () => {
  it("stores report coordinates rounded to ~1 km, whatever the client sends", async () => {
    await asRole(
      "anon",
      `insert into public.reports (anon_id,city,lat,lon,category,severity,title,body)
       values ('probe-precise-01','Almaty',43.238123,76.889456,'air','low',${VALID})`,
    );
    const row = (
      await db.query<{ lat: number; lon: number }>(
        `select lat, lon from public.reports where anon_id='probe-precise-01'`)
    ).rows[0];
    expect(row.lat).toBe(43.24);
    expect(row.lon).toBe(76.89);
  });

  it("keeps no coordinates for a check-in, only the distance", async () => {
    await db.exec(`
      insert into public.events (anon_id,title,description,place,lat,lon,starts_at)
      values ('organiser-ci-01','a check-in event','a valid description','Almaty',
              43.238,76.889, now());`);
    const ev = (
      await db.query<{ id: string }>(`select id from public.events where anon_id='organiser-ci-01'`)
    ).rows[0].id;
    const ok = await asRole("anon", `select public.check_in_event($1,$2,43.2385,76.8895)`, [ev, dev(500)]);
    expect(ok.allowed, ok.error).toBe(true);
    const row = (
      await db.query<{ lat: number | null; lon: number | null; distance_m: number }>(
        `select lat, lon, distance_m from public.event_checkins where event_id=$1`, [ev])
    ).rows[0];
    expect(row.lat).toBeNull();
    expect(row.lon).toBeNull();
    expect(row.distance_m).toBeGreaterThan(0);
    expect(row.distance_m).toBeLessThan(500);

    const far = await asRole("anon", `select public.check_in_event($1,$2,43.30,76.95)`, [ev, dev(501)]);
    expect(far.allowed).toBe(false);
    expect(far.error).toMatch(/checkin_too_far/);
  });
});

describe("acting as a device", () => {
  let ev: string;
  beforeAll(async () => {
    await db.exec(`
      insert into public.events (anon_id,title,description,place,lat,lon,starts_at)
      values ('${dev(700)}','an rsvp event','a valid description','Astana',
              51.169,71.449, now() + interval '1 day');`);
    ev = (
      await db.query<{ id: string }>(`select id from public.events where anon_id=$1`, [dev(700)])
    ).rows[0].id;
  });

  it("refuses a pre-hardening (once public) device id", async () => {
    const r = await asRole("anon", `select public.rsvp_event($1,'probe-device-0001')`, [ev]);
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/device_id_invalid/);
  });

  it("withdraws only the caller's own RSVP", async () => {
    await asRole("anon", `select public.rsvp_event($1,$2)`, [ev, dev(701)]);
    await asRole("anon", `select public.rsvp_event($1,$2)`, [ev, dev(702)]);
    await asRole("anon", `select public.withdraw_rsvp($1,$2)`, [ev, dev(701)]);
    const left = await db.query<{ anon_id: string }>(
      `select anon_id from public.event_rsvps where event_id=$1`, [ev]);
    expect(left.rows.map((x) => x.anon_id)).toEqual([dev(702)]);
  });

  it("reports counts and the caller's own state, never other device ids", async () => {
    await db.exec(`set role anon`);
    try {
      const att = await db.query<{ event_id: string; going: number }>(
        `select * from public.event_attendance() where event_id=$1`, [ev]);
      expect(att.rows[0].going).toBe(1);
      const mine = await db.query<{ organiser: boolean; rsvp: boolean }>(
        `select * from public.my_event_state($1) where event_id=$2`, [dev(702), ev]);
      expect(mine.rows[0]).toMatchObject({ organiser: false, rsvp: true });
      const organiser = await db.query<{ organiser: boolean }>(
        `select * from public.my_event_state($1) where event_id=$2`, [dev(700), ev]);
      expect(organiser.rows[0].organiser).toBe(true);
      const legacy = await db.query(`select * from public.my_event_state('probe-device-0001')`);
      expect(legacy.rows).toHaveLength(0);
    } finally {
      await db.exec(`reset role`);
    }
  });

  it("deletes the caller's own report, and nobody else's", async () => {
    await db.exec(`
      insert into public.reports (anon_id,city,category,severity,title,body)
      values ('${dev(800)}','Shymkent','air','low',${VALID});`);
    const id = (
      await db.query<{ id: string }>(`select id from public.reports where anon_id=$1`, [dev(800)])
    ).rows[0].id;

    await db.exec(`set role anon`);
    try {
      const other = await db.query<{ ok: boolean }>(`select public.delete_my_report($1,$2) ok`, [id, dev(801)]);
      expect(other.rows[0].ok).toBe(false);
      const own = await db.query<{ ok: boolean }>(`select public.delete_my_report($1,$2) ok`, [id, dev(800)]);
      expect(own.rows[0].ok).toBe(true);
    } finally {
      await db.exec(`reset role`);
    }
    const gone = await db.query(`select 1 from public.reports where id=$1`, [id]);
    expect(gone.rows).toHaveLength(0);
  });

  it("keeps a forwarded report (and its transfer log) out of self-deletion", async () => {
    await db.exec(`
      insert into public.reports (anon_id,city,category,severity,title,body)
      values ('${dev(810)}','Taraz','water','low',${VALID});`);
    const id = (
      await db.query<{ id: string }>(`select id from public.reports where anon_id=$1`, [dev(810)])
    ).rows[0].id;
    await db.query(`select public.mark_report_forwarded($1,'Akimat','audit',null)`, [id]);
    await db.exec(`set role anon`);
    try {
      const r = await db.query<{ ok: boolean }>(`select public.delete_my_report($1,$2) ok`, [id, dev(810)]);
      expect(r.rows[0].ok).toBe(false);
    } finally {
      await db.exec(`reset role`);
    }
  });

  it("refuses a follow-up that points at someone else's report", async () => {
    const r = await asRole(
      "anon",
      `insert into public.reports (anon_id,city,category,severity,title,body,parent_id)
       values ('probe-follow-01','Almaty','air','low',${VALID},$1)`,
      [reportId],
    );
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/parent_not_yours/);
  });

  it("exposes community signals as counts only", async () => {
    await db.exec(`set role anon`);
    try {
      const r = await db.query<Record<string, unknown>>(`select * from public.community_city_signals(30)`);
      expect(r.rows.length).toBeGreaterThan(0);
      for (const row of r.rows) expect(Object.keys(row)).not.toContain("anon_id");
    } finally {
      await db.exec(`reset role`);
    }
  });
});

describe("the network rate limit", () => {
  const withIp = async (ip: string, fn: () => Promise<void>) => {
    await db.exec(`set request.headers = '${JSON.stringify({ "cf-connecting-ip": ip })}'`);
    try {
      await fn();
    } finally {
      await db.exec(`reset request.headers`);
    }
  };
  const file = (n: number) =>
    asRole(
      "anon",
      `insert into public.reports (anon_id,city,category,severity,title,body)
       values ($1,'Pavlodar','biodiversity','low',${VALID})`,
      [`net-device-${String(n).padStart(4, "0")}`],
    );

  it("stops one network rotating device ids after 30 reports an hour", async () => {
    await withIp("203.0.113.7", async () => {
      for (let i = 0; i < 30; i++) {
        const r = await file(i);
        expect(r.allowed, `report ${i}: ${r.error}`).toBe(true);
      }
      const over = await file(30);
      expect(over.allowed).toBe(false);
      expect(over.error).toMatch(/rate_limit_hourly_network/);
    });
  });

  it("does not hold a different network to that count", async () => {
    await withIp("198.51.100.9", async () => {
      const r = await file(31);
      expect(r.allowed, r.error).toBe(true);
    });
  });

  it("stores no raw IP, and drops expired salts and hashes", async () => {
    const raw = await db.query(
      `select 1 from private.network_hits where ip_hash like '%203.0.113.7%' or ip_hash like '%198.51.100.9%'`);
    expect(raw.rows).toHaveLength(0);

    await db.exec(`
      insert into private.daily_salt (day, salt) values (current_date - 2, 'stale-salt')
        on conflict do nothing;
      insert into private.network_hits (ip_hash, kind, created_at)
        values ('stale-hash', 'report', now() - interval '25 hours');`);
    await withIp("192.0.2.1", async () => {
      await file(32);
    });
    const salts = await db.query(`select 1 from private.daily_salt where day < (now() at time zone 'utc')::date`);
    expect(salts.rows).toHaveLength(0);
    const stale = await db.query(`select 1 from private.network_hits where ip_hash = 'stale-hash'`);
    expect(stale.rows).toHaveLength(0);
  });
});

describe("function grants", () => {
  /* Supabase grants EXECUTE on every new public function to anon. This
     list is the whole of what a visitor may call; anything else that
     turns up callable is a leak to look at, not to add here by reflex. */
  const CALLABLE = [
    "check_in_event",
    "community_city_signals",
    "delete_my_report",
    "event_attendance",
    "my_event_state",
    "rsvp_event",
    "withdraw_rsvp",
  ];

  it("lets anon execute exactly the intended non-trigger functions", async () => {
    const r = await db.query<{ proname: string }>(`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.prorettype <> 'trigger'::regtype
         and has_function_privilege('anon', p.oid, 'execute')
       order by 1`);
    expect(r.rows.map((x) => x.proname)).toEqual(CALLABLE);
  });
});

describe("rollback of privacy-hardening.sql", () => {
  /* A fresh database, so the main suite above is untouched: apply all,
     roll back, and check the pre-hardening model is what is left — then
     re-apply, since a rollback that cannot be rolled forward again is a
     trap. */
  it("applies, restores the old access model, and can be re-applied", async () => {
    const fresh = new PGlite();
    await fresh.exec(`
      create role anon nologin noinherit;
      create role authenticated nologin noinherit;
      create role service_role nologin noinherit bypassrls;
      grant usage on schema public to anon, authenticated, service_role;
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    `);
    for (const f of MIGRATIONS) await fresh.exec(readFileSync(join(DIR, f), "utf8"));
    await fresh.exec(readFileSync(join(DIR, "rollback", "privacy-hardening.down.sql"), "utf8"));

    await fresh.exec(`set role anon`);
    await fresh.query(`select anon_id from public.reports limit 1`); // readable again
    await fresh.exec(`reset role`);
    const fns = await fresh.query(`select 1 from pg_proc where proname = 'delete_my_report'`);
    expect(fns.rows).toHaveLength(0);
    const schema = await fresh.query(`select 1 from pg_namespace where nspname = 'private'`);
    expect(schema.rows).toHaveLength(0);

    await fresh.exec(readFileSync(join(DIR, HARDENING), "utf8"));
    await fresh.exec(`set role anon`);
    await expect(fresh.query(`select anon_id from public.reports limit 1`)).rejects.toThrow(/permission denied/);
    await fresh.exec(`reset role`);
    await fresh.close();
  }, 60_000);

  it("re-running the hardening on a hardened database is a no-op", async () => {
    await db.exec(readFileSync(join(DIR, HARDENING), "utf8"));
    const r = await asRole("anon", `select anon_id from public.reports limit 1`);
    expect(r.allowed).toBe(false);
  });
});
