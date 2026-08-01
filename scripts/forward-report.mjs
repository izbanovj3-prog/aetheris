#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   AETHERIS · operator tool for report statuses ④ and ⑤
   ─────────────────────────────────────────────────────────────
   There is no akimat integration and no partner intake channel, so
   "Передано в акимат/эко-инспекцию" and "Ответ организации" move by hand.
   This script is that hand — the only wired trigger point for either.

   It needs the Supabase *service* key, which lives in the environment and
   never in the app bundle: the two SQL functions it calls have execute
   revoked from anon precisely so a browser cannot reach them.

     SUPABASE_SERVICE_KEY=sb_secret_…  node scripts/forward-report.mjs forward \
       --report <uuid> \
       --to "Акимат Алматы · управление экологии" \
       --actor "your-name" \
       --note "Sent by email 2026-08-01, photo attached."

     SUPABASE_SERVICE_KEY=sb_secret_…  node scripts/forward-report.mjs respond \
       --report <uuid> \
       --org "Name of the organisation that actually replied" \
       --text "Their reply, quoted as sent."

   Before using `respond`: only name an organisation that has agreed to
   appear on the platform. Publishing a body's name without its consent is
   the mistake this project has already made once.
   ───────────────────────────────────────────────────────────── */

const URL_BASE =
  process.env.SUPABASE_URL ?? "https://effxsftaolpjjlpuqwax.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_KEY;

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    out[argv[i].slice(2)] = argv[i + 1];
    i += 1;
  }
  return out;
}

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function rpc(fn, body) {
  const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    die(`${fn} failed — HTTP ${res.status}: ${await res.text()}`);
  }
}

const [command, ...rest] = process.argv.slice(2);
const a = args(rest);

if (!KEY) {
  die(
    "SUPABASE_SERVICE_KEY is not set. This tool deliberately refuses to run on " +
      "the publishable key — the functions it calls are operator-only.",
  );
}

if (command === "forward") {
  if (!a.report || !a.to || !a.actor) {
    die("forward needs --report <uuid> --to <destination> --actor <who you are>");
  }
  await rpc("mark_report_forwarded", {
    p_report_id: a.report,
    p_destination: a.to,
    p_actor: a.actor,
    p_note: a.note ?? null,
  });
  console.log(`✓ report ${a.report} marked as forwarded to "${a.to}" and logged.`);
} else if (command === "respond") {
  if (!a.report || !a.org || !a.text) {
    die("respond needs --report <uuid> --org <organisation> --text <their reply>");
  }
  await rpc("record_org_response", {
    p_report_id: a.report,
    p_org: a.org,
    p_response: a.text,
  });
  console.log(`✓ response from "${a.org}" recorded on report ${a.report}.`);
} else {
  die("usage: forward-report.mjs <forward|respond> [options] — see the header of this file.");
}
