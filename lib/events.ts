/* ─────────────────────────────────────────────────────────────
   AETHERIS · Community events
   ─────────────────────────────────────────────────────────────
   Block 4.1 of the Community 2.0 concept: the "Local eco-events" block
   stops being three static examples and becomes real rows — create,
   RSVP, and a geo-fenced check-in at the event.

   Tables and policies live in supabase/community-2.sql. If that migration
   has not been run the module reports itself unavailable and the page
   falls back to the three sample events, still marked as samples. It does
   not pretend to have an events system it cannot store anything in.

   The check-in is the only thing on this platform that asserts someone
   was physically in a place, so its rules are enforced in Postgres rather
   than in the browser: within 500 m of the event, from an hour before the
   start to four hours after it. Coordinates still come from the device,
   and someone determined can lie to their own browser — this stops the
   accidental and the casual case, not a deliberate forgery.
   ───────────────────────────────────────────────────────────── */

import { anonId } from "./reports";
import { SUPABASE_KEY, SUPABASE_URL, callRpc, isConfigured } from "./supabase";

/** Columns a visitor may read on events — anon_id is not one of them. */
const EVENT_PUBLIC_COLUMNS =
  "id,created_at,title,description,place,lat,lon,starts_at,capacity,cancelled";

/** Metres from the event within which a check-in is accepted. */
export const CHECKIN_RADIUS_M = 500;

export interface AetherisEvent {
  id: string;
  createdAt: number;
  /** True when this device created it. */
  mine: boolean;
  title: string;
  description: string;
  place: string;
  lat: number;
  lon: number;
  startsAt: number;
  /** Null means no cap. */
  capacity: number | null;
  cancelled: boolean;

  /* Derived from the RSVP / check-in tables. */
  going: number;
  iRsvpd: boolean;
  checkedIn: number;
  iCheckedIn: boolean;
}

export interface NewEventInput {
  title: string;
  description: string;
  place: string;
  lat: number;
  lon: number;
  /** Epoch ms. */
  startsAt: number;
  capacity: number | null;
}

/**
 * A refusal that the user needs to see, as opposed to an outage we absorb.
 * Same reasoning as RateLimitError on reports: telling someone their
 * check-in worked when Postgres rejected it is the failure mode to avoid.
 */
export class EventError extends Error {
  readonly reason:
    | "rate-limited"
    | "in-past"
    | "too-far"
    | "too-early"
    | "closed"
    | "cancelled"
    | "full"
    | "unavailable";
  readonly detail?: string;
  constructor(reason: EventError["reason"], detail?: string) {
    super(detail ?? reason);
    this.name = "EventError";
    this.reason = reason;
    this.detail = detail;
  }
}

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** Map a Postgres error message onto the reason the UI shows. */
function reasonFrom(msg: string): EventError["reason"] {
  if (msg.includes("rate_limit_events")) return "rate-limited";
  if (msg.includes("event_in_past")) return "in-past";
  if (msg.includes("checkin_too_far")) return "too-far";
  if (msg.includes("checkin_too_early")) return "too-early";
  if (msg.includes("checkin_closed")) return "closed";
  if (msg.includes("checkin_cancelled")) return "cancelled";
  if (msg.includes("event_full")) return "full";
  return "unavailable";
}

async function failure(res: Response): Promise<EventError> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  const msg = body?.message ?? "";
  return new EventError(reasonFrom(msg), msg || undefined);
}

interface EventRow {
  id: string;
  created_at: string;
  /** Present only on a database without privacy-hardening.sql. */
  anon_id?: string;
  title: string;
  description: string;
  place: string;
  lat: number;
  lon: number;
  starts_at: string;
  capacity: number | null;
  cancelled: boolean;
}

interface AttendeeRow {
  event_id: string;
  anon_id: string;
}

/**
 * Every event that has not already finished, soonest first, with RSVP and
 * check-in counts folded in.
 *
 * Returns null — not an empty array — when the datastore is unreachable or
 * the tables are missing. The caller has to be able to tell "no events yet"
 * apart from "we cannot tell", because only one of those should replace
 * the sample block.
 */
export async function listEvents(signal?: AbortSignal): Promise<AetherisEvent[] | null> {
  if (!isConfigured()) return null;
  const me = anonId();
  // An event stays listed until four hours after its start — the same
  // window check-in is open for, so a gathering does not vanish from the
  // page while people are still standing in it.
  const since = new Date(Date.now() - 4 * 3_600_000).toISOString();
  const eventsUrl =
    `${SUPABASE_URL}/rest/v1/events?select=${EVENT_PUBLIC_COLUMNS}&starts_at=gte.${since}` +
    `&cancelled=is.false&order=starts_at.asc&limit=50`;
  try {
    const [evRes, attRes, mineRes] = await Promise.all([
      fetch(eventsUrl, { headers: headers(), signal }),
      callRpc("event_attendance", {}, signal),
      callRpc("my_event_state", { p_anon_id: me }, signal),
    ]);
    // A database without privacy-hardening.sql has neither function.
    if (!attRes || !mineRes) return await legacyListEvents(since, me, signal);
    if (!evRes.ok || !attRes.ok || !mineRes.ok) return null;

    const rows = (await evRes.json()) as EventRow[];
    const att = new Map(
      ((await attRes.json()) as Array<{ event_id: string; going: number; checked_in: number }>).map(
        (a) => [a.event_id, a],
      ),
    );
    const mine = new Map(
      (
        (await mineRes.json()) as Array<{
          event_id: string;
          organiser: boolean;
          rsvp: boolean;
          checked_in: boolean;
        }>
      ).map((m) => [m.event_id, m]),
    );

    return rows.map((e) => ({
      ...fromRow(e),
      mine: mine.get(e.id)?.organiser ?? false,
      going: att.get(e.id)?.going ?? 0,
      iRsvpd: mine.get(e.id)?.rsvp ?? false,
      checkedIn: att.get(e.id)?.checked_in ?? 0,
      iCheckedIn: mine.get(e.id)?.checked_in ?? false,
    }));
  } catch {
    return null;
  }
}

function fromRow(e: EventRow): AetherisEvent {
  return {
    id: e.id,
    createdAt: new Date(e.created_at).getTime(),
    mine: false,
    title: e.title,
    description: e.description,
    place: e.place,
    lat: e.lat,
    lon: e.lon,
    startsAt: new Date(e.starts_at).getTime(),
    capacity: e.capacity,
    cancelled: e.cancelled,
    going: 0,
    iRsvpd: false,
    checkedIn: 0,
    iCheckedIn: false,
  };
}

/** Pre-hardening read, where attendee tables were public. Remove once
 *  supabase/privacy-hardening.sql is applied everywhere. */
async function legacyListEvents(
  since: string,
  me: string,
  signal?: AbortSignal,
): Promise<AetherisEvent[] | null> {
  const [evRes, rsvpRes, ciRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/events?select=*&starts_at=gte.${since}` +
        `&cancelled=is.false&order=starts_at.asc&limit=50`,
      { headers: headers(), signal },
    ),
    fetch(`${SUPABASE_URL}/rest/v1/event_rsvps?select=event_id,anon_id&limit=2000`, {
      headers: headers(),
      signal,
    }),
    fetch(`${SUPABASE_URL}/rest/v1/event_checkins?select=event_id,anon_id&limit=2000`, {
      headers: headers(),
      signal,
    }),
  ]);
  if (!evRes.ok || !rsvpRes.ok || !ciRes.ok) return null;

  const rows = (await evRes.json()) as EventRow[];
  const rsvps = (await rsvpRes.json()) as AttendeeRow[];
  const checkins = (await ciRes.json()) as AttendeeRow[];

  const tally = (list: AttendeeRow[]) => {
    const count = new Map<string, number>();
    const mine = new Set<string>();
    for (const a of list) {
      count.set(a.event_id, (count.get(a.event_id) ?? 0) + 1);
      if (a.anon_id === me) mine.add(a.event_id);
    }
    return { count, mine };
  };
  const r = tally(rsvps);
  const c = tally(checkins);

  return rows.map((e) => ({
    ...fromRow(e),
    mine: e.anon_id === me,
    going: r.count.get(e.id) ?? 0,
    iRsvpd: r.mine.has(e.id),
    checkedIn: c.count.get(e.id) ?? 0,
    iCheckedIn: c.mine.has(e.id),
  }));
}

/** Create an event. Throws EventError on a refusal the user must see. */
export async function createEvent(input: NewEventInput): Promise<AetherisEvent> {
  if (!isConfigured()) throw new EventError("unavailable");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/events?select=${EVENT_PUBLIC_COLUMNS}`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({
      anon_id: anonId(),
      title: input.title.trim(),
      description: input.description.trim(),
      place: input.place.trim(),
      lat: input.lat,
      lon: input.lon,
      starts_at: new Date(input.startsAt).toISOString(),
      capacity: input.capacity,
    }),
  });
  if (!res.ok) throw await failure(res);

  const row = ((await res.json()) as EventRow[])[0];
  if (!row) throw new EventError("unavailable");
  return { ...fromRow(row), mine: true };
}

/**
 * RSVP, or withdraw one. The participant cap is enforced in Postgres
 * (bounds-and-capacity.sql); a full event comes back as reason "full".
 * Withdrawal goes through withdraw_rsvp(), which removes only this
 * device's own RSVP.
 */
export async function setRsvp(eventId: string, going: boolean): Promise<void> {
  if (!isConfigured()) throw new EventError("unavailable");
  const me = anonId();

  const rpc = await callRpc(going ? "rsvp_event" : "withdraw_rsvp", {
    p_event_id: eventId,
    p_anon_id: me,
  });
  if (rpc) {
    if (!rpc.ok) throw await failure(rpc);
    return;
  }

  // Database without privacy-hardening.sql.
  if (going) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/event_rsvps`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=ignore-duplicates" }),
      body: JSON.stringify({ event_id: eventId, anon_id: me }),
    });
    if (!res.ok) throw await failure(res);
    return;
  }
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/event_rsvps?event_id=eq.${encodeURIComponent(eventId)}&anon_id=eq.${encodeURIComponent(me)}`,
    { method: "DELETE", headers: headers() },
  );
  if (!res.ok) throw await failure(res);
}

/**
 * Check in at an event. The geo-fence and the time window are enforced by
 * the trigger in Postgres, not here — this only reports what it said. The
 * position is used once for the distance and not stored.
 */
export async function checkIn(
  eventId: string,
  lat: number,
  lon: number,
): Promise<void> {
  if (!isConfigured()) throw new EventError("unavailable");
  const rpc = await callRpc("check_in_event", {
    p_event_id: eventId,
    p_anon_id: anonId(),
    p_lat: lat,
    p_lon: lon,
  });
  if (rpc) {
    if (!rpc.ok) throw await failure(rpc);
    return;
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/event_checkins`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=ignore-duplicates" }),
    body: JSON.stringify({ event_id: eventId, anon_id: anonId(), lat, lon, distance_m: 0 }),
  });
  if (!res.ok) throw await failure(res);
}

/* ── Sample events ────────────────────────────────────────────
   The three examples that have always been on the page. They stay, still
   labelled as samples under the same convention the rest of /community
   uses, and they are visibly separated from real rows. Once real events
   exist they sit beneath them; if the events tables are missing they are
   all there is, and the page says so.

   Dates are derived from the build moment rather than hardcoded: the
   original "JUN 14 / 20 / 27" had drifted into the past, which reads as a
   dead page. NEXT_PUBLIC_BUILD_TIME is inlined at build into both
   bundles, so server and client render the same string. */

const BUILD_AT = process.env.NEXT_PUBLIC_BUILD_TIME ?? "2026-07-25T00:00:00.000Z";

function sampleDate(daysAhead: number): number {
  const d = new Date(BUILD_AT);
  d.setUTCDate(d.getUTCDate() + daysAhead);
  d.setUTCHours(9, 0, 0, 0);
  return d.getTime();
}

export interface SampleEvent {
  id: string;
  title: string;
  place: string;
  startsAt: number;
  attendees: number;
}

export const SAMPLE_EVENTS: SampleEvent[] = [
  {
    id: "sample-ile-alatau",
    title: "Ile-Alatau foothills cleanup",
    place: "Almaty",
    startsAt: sampleDate(14),
    attendees: 86,
  },
  {
    id: "sample-heat-island",
    title: "Urban heat-island mapping walk",
    place: "Astana",
    startsAt: sampleDate(21),
    attendees: 41,
  },
  {
    id: "sample-balkhash",
    title: "Lake Balkhash shoreline survey",
    place: "Balkhash",
    startsAt: sampleDate(28),
    attendees: 23,
  },
];

/* ── Formatting ──────────────────────────────────────────────
   Month names come from a literal table, not toLocaleDateString, so Node's
   and the browser's locale data cannot disagree and break hydration. */

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export function eventDay(ts: number): { month: string; day: string } {
  const d = new Date(ts);
  return {
    month: MONTHS[d.getUTCMonth()],
    day: String(d.getUTCDate()).padStart(2, "0"),
  };
}

export function eventClock(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

/** Whether check-in is open — mirrors the window the trigger enforces. */
export function checkinWindow(startsAt: number): "early" | "open" | "closed" {
  const now = Date.now();
  if (now < startsAt - 3_600_000) return "early";
  if (now > startsAt + 4 * 3_600_000) return "closed";
  return "open";
}
