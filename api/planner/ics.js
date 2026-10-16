import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

function escapeICalText(str = '') {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function toICalDateTime(dateObj, timeStr = '00:00:00') {
  const [h, m, s = 0] = timeStr.split(':').map(Number);
  const d = new Date(dateObj);
  d.setHours(h, m, s, 0);

  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function toICalDateOnly(dateStr) {
  return dateStr.replace(/-/g, '');
}

export function buildIcsString(data) {
  const now = new Date();
  const dtstamp = toICalDateTime(now);
  const settings = data?.settings || {};
  const defaults = data?.defaults || [];
  const dayPlans = data?.day_plans || [];
  const events = data?.events || [];

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AndiNu//Couples Life & Sleep Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AndiNú Couples Planner',
    'X-WR-TIMEZONE:Europe/Madrid',
    'X-WR-CALDESC:Couples weekly life, sleep & schedule planner from andinu.cc'
  ];

  // Events
  for (const ev of events) {
    const ownerPrefix = ev.owner_type === 'me' ? '[Me]' : (ev.owner_type === 'her' ? '[Her]' : '[Together]');
    const summary = `${ownerPrefix} ${ev.title}`.trim();
    const uid = `andinu-event-${ev.id}@andinu.cc`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`SUMMARY:${escapeICalText(summary)}`);

    if (ev.location) {
      lines.push(`LOCATION:${escapeICalText(ev.location)}`);
    }

    let description = '';
    if (ev.notes) description += `${ev.notes}\n\n`;
    description += `Owner: ${ev.owner_type}\nPlanner: https://andinu.cc/planner`;
    lines.push(`DESCRIPTION:${escapeICalText(description)}`);

    if (ev.is_all_day) {
      const [y, m, d] = ev.event_date.split('-').map(Number);
      const nextD = new Date(y, m - 1, d + 1);
      const nextStr = `${nextD.getFullYear()}${String(nextD.getMonth() + 1).padStart(2, '0')}${String(nextD.getDate()).padStart(2, '0')}`;
      lines.push(`DTSTART;VALUE=DATE:${toICalDateOnly(ev.event_date)}`);
      lines.push(`DTEND;VALUE=DATE:${nextStr}`);
    } else {
      const [y, m, d] = ev.event_date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      lines.push(`DTSTART:${toICalDateTime(dateObj, ev.start_time || '09:00:00')}`);
      lines.push(`DTEND:${toICalDateTime(dateObj, ev.end_time || '10:00:00')}`);
    }

    if (ev.recurrence_type === 'weekly' && Array.isArray(ev.recurrence_days) && ev.recurrence_days.length > 0) {
      const dayMap = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA', 7: 'SU' };
      const byDays = ev.recurrence_days.map(d => dayMap[d]).filter(Boolean).join(',');
      let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDays}`;
      if (ev.recurrence_end_date) {
        rrule += `;UNTIL=${toICalDateOnly(ev.recurrence_end_date)}T235959Z`;
      }
      lines.push(rrule);

      if (Array.isArray(ev.excluded_dates) && ev.excluded_dates.length > 0) {
        const exdateStr = ev.excluded_dates.map(toICalDateOnly).join(',');
        lines.push(`EXDATE;VALUE=DATE:${exdateStr}`);
      }
    }

    lines.push('END:VEVENT');
  }

  // Sleep & Morning Plans for rolling 60 days
  const sleepMeta = {
    my_place: { label: 'My Place', icon: '🏠' },
    her_place: { label: 'Her Place', icon: '🏡' },
    apart: { label: 'Apart', icon: '↔️' },
    away: { label: 'Away / Trip', icon: '✈️' }
  };

  const cur = new Date(now);
  cur.setDate(cur.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 60);

  while (cur <= end) {
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
    const jsDay = cur.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;

    const override = dayPlans.find(p => p.plan_date === dateStr);
    const def = defaults.find(d => Number(d.day_of_week) === isoDay);

    const locKey = override?.sleep_location || def?.sleep_location || 'my_place';
    const loc = sleepMeta[locKey] || sleepMeta.my_place;
    const bedtime = (override?.bedtime || def?.bedtime || '23:00').slice(0, 5);
    const wakeTime = (override?.wake_time || def?.wake_time || '07:30').slice(0, 5);

    const bedDateTime = toICalDateTime(cur, `${bedtime}:00`);
    const nextCur = new Date(cur);
    nextCur.setDate(nextCur.getDate() + 1);
    const wakeDateTime = toICalDateTime(nextCur, `${wakeTime}:00`);

    let desc = `Target Bedtime: ${bedtime}\nMorning Alarm: ${wakeTime}`;
    if (override?.my_wake_time || def?.my_wake_time) desc += `\n🌱 Andi: ${(override?.my_wake_time || def?.my_wake_time).slice(0, 5)}`;
    if (override?.her_wake_time || def?.her_wake_time) desc += `\n🌊 Núria: ${(override?.her_wake_time || def?.her_wake_time).slice(0, 5)}`;
    if (override?.location_note) desc += `\nLocation: ${override.location_note}`;
    if (override?.my_status_note) desc += `\n🌱 Andi status: ${override.my_status_note}`;
    if (override?.her_status_note) desc += `\n🌊 Núria status: ${override.her_status_note}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:andinu-sleep-${dateStr}@andinu.cc`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`SUMMARY:[Sleep] ${loc.icon} ${loc.label}`);
    lines.push(`DESCRIPTION:${escapeICalText(desc)}`);
    lines.push(`DTSTART:${bedDateTime}`);
    lines.push(`DTEND:${wakeDateTime}`);

    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Bedtime in 30 minutes (${loc.label})`);
    lines.push('TRIGGER:-PT30M');
    lines.push('END:VALARM');

    lines.push('END:VEVENT');

    cur.setDate(cur.getDate() + 1);
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function sendText(res, status, body, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  if (typeof res.status === 'function' && typeof res.send === 'function') {
    res.setHeader('Content-Type', contentType);
    for (const [k, v] of Object.entries(extraHeaders)) {
      res.setHeader(k, v);
    }
    return res.status(status).send(body);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
  res.end(body);
}

function getSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
}

export default async function handler(req, res) {
  // Support both query param `token` or url param `[token]`
  const token = req.query?.token || req.url?.split('/ics/')[1]?.split('/')[0]?.split('?')[0];
  const supabase = getSupabase();

  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return sendText(res, 400, 'Invalid calendar feed token');
  }

  if (!supabase) {
    return sendText(res, 500, 'Database not configured');
  }

  try {
    const { data, error } = await supabase.rpc('get_planner_feed_data', { p_token: token });
    if (error || !data) {
      return sendText(res, 404, 'Calendar feed not found');
    }

    const icsContent = buildIcsString(data);

    return sendText(res, 200, icsContent, 'text/calendar; charset=utf-8', {
      'Content-Disposition': 'inline; filename="andinu-planner.ics"',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate'
    });
  } catch (err) {
    console.error('iCal feed error:', err);
    return sendText(res, 500, 'Internal Server Error');
  }
}
