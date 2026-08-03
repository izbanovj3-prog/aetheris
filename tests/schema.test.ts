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
];

const DIR = join(process.cwd(), "supabase");
const VALID = `'a valid probe title','a valid probe body long enough to pass'`;

let db: PGlite;
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
  for (const f of MIGRATIONS) {
    await db.exec(readFileSync(join(DIR, f), "utf8"));
  }
  await db.exec(`grant all on all tables in schema public to anon, authenticated, service_role;`);

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
      `insert into public.reports (anon_id,author,city,category,severity,title,body,status)
       values ('probe-device-esc','x','Almaty','air','low',${VALID},'forwarded')`,
    );
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/row-level security/);
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
    expect(r.error).toMatch(/row-level security/);
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
      `insert into public.reports (anon_id,author,city,lat,lon,category,severity,title,body)
       values ('probe-inside','x','Almaty',43.238,76.889,'air','low',${VALID})`,
    );
    expect(r.allowed, r.error).toBe(true);
  });

  it("rejects a report from outside it", async () => {
    const r = await asRole(
      "anon",
      `insert into public.reports (anon_id,author,city,lat,lon,category,severity,title,body)
       values ('probe-outside','x','Nowhere',0,0,'air','low',${VALID})`,
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
    for (const who of ["attendee-device-01", "attendee-device-02"]) {
      const r = await asRole(
        "anon",
        `insert into public.event_rsvps (event_id, anon_id) values ($1,$2)`,
        [eventId, who],
      );
      expect(r.allowed, `${who}: ${r.error}`).toBe(true);
    }
  });

  it("refuses the one past it", async () => {
    const r = await asRole(
      "anon",
      `insert into public.event_rsvps (event_id, anon_id) values ($1,'attendee-device-03')`,
      [eventId],
    );
    expect(r.allowed).toBe(false);
    expect(r.error).toMatch(/event_full/);
  });

  /* Someone re-confirming a place they already hold is not taking a
     second one, and must not be turned away by a full event. */
  it("still lets an existing attendee re-confirm a full event", async () => {
    const r = await asRole(
      "anon",
      `insert into public.event_rsvps (event_id, anon_id) values ($1,'attendee-device-01')
       on conflict do nothing`,
      [eventId],
    );
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
    for (const who of ["a-01", "a-02", "a-03", "a-04", "a-05"]) {
      const r = await asRole(
        "anon",
        `insert into public.event_rsvps (event_id, anon_id) values ($1,$2)`,
        [open, `uncapped-device-${who}`],
      );
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
