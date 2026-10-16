/**
 * Couples Weekly Life, Sleep & Schedule Planner - Calendar & Date Utilities
 * Strictly one-way outbound sync from AndiNú to Google Calendar / iCal.
 */

export const SLEEP_LOCATIONS = {
  my_place: { key: 'my_place', label: 'My Place', icon: '🏠', partner: 'Andino', badge: '🏠 My Place' },
  her_place: { key: 'her_place', label: 'Her Place', icon: '🏡', partner: 'Núria', badge: '🏡 Her Place' },
  apart: { key: 'apart', label: 'Apart', icon: '↔️', partner: 'Respective Homes', badge: '↔️ Apart' },
  away: { key: 'away', label: 'Away / Trip', icon: '✈️', partner: 'Traveling', badge: '✈️ Away / Trip' }
};

export const OWNER_TYPES = {
  me: {
    key: 'me',
    label: 'Me',
    tag: 'Me',
    prefix: '[Me]',
    color: '#15803D',
    bg: '#DCFCE7',
    border: '#15803D',
    text: '#14532D',
    badgeClass: 'owner-me'
  },
  her: {
    key: 'her',
    label: 'Her',
    tag: 'Her',
    prefix: '[Her]',
    color: '#1D4ED8',
    bg: '#DBEAFE',
    border: '#1D4ED8',
    text: '#1E3A8A',
    badgeClass: 'owner-her'
  },
  together: {
    key: 'together',
    label: 'Together',
    tag: 'Together',
    prefix: '[Together]',
    color: '#9F1239',
    bg: '#FFE4E6',
    border: '#9F1239',
    text: '#881337',
    badgeClass: 'owner-together'
  }
};

export const WEEKDAYS = [
  { iso: 1, key: 'mon', short: 'Mon', letter: 'M', full: 'Monday' },
  { iso: 2, key: 'tue', short: 'Tue', letter: 'T', full: 'Tuesday' },
  { iso: 3, key: 'wed', short: 'Wed', letter: 'W', full: 'Wednesday' },
  { iso: 4, key: 'thu', short: 'Thu', letter: 'T', full: 'Thursday' },
  { iso: 5, key: 'fri', short: 'Fri', letter: 'F', full: 'Friday' },
  { iso: 6, key: 'sat', short: 'Sat', letter: 'S', full: 'Saturday' },
  { iso: 7, key: 'sun', short: 'Sun', letter: 'S', full: 'Sunday' }
];

/**
 * Format Date to YYYY-MM-DD in local time
 */
export function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into local midnight Date
 */
export function parseDateISO(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Get Monday (start of ISO week) for any date
 */
export function getMondayOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sun, 1 is Mon...
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get Sunday (end of ISO week) for a given Monday
 */
export function getSundayOfWeek(monday) {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Return 7 day objects for a given Monday
 */
export function getDaysForWeek(monday) {
  const days = [];
  const todayStr = formatDateISO(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const isoDate = formatDateISO(d);
    const isoWeekday = i + 1; // 1 = Mon .. 7 = Sun
    const weekdayInfo = WEEKDAYS[i];

    days.push({
      dateObj: d,
      isoDate,
      isoWeekday,
      shortName: weekdayInfo.short,
      fullName: weekdayInfo.full,
      letter: weekdayInfo.letter,
      dayNumber: d.getDate(),
      monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: isoDate === todayStr
    });
  }

  return days;
}

/**
 * Format week label (e.g., "Oct 12 – Oct 18, 2026")
 */
export function formatWeekRangeLabel(monday) {
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);

  const monMonth = monday.toLocaleDateString('en-US', { month: 'short' });
  const sunMonth = sun.toLocaleDateString('en-US', { month: 'short' });
  const monYear = monday.getFullYear();
  const sunYear = sun.getFullYear();

  if (monYear !== sunYear) {
    return `${monMonth} ${monday.getDate()}, ${monYear} – ${sunMonth} ${sun.getDate()}, ${sunYear}`;
  }
  if (monMonth !== sunMonth) {
    return `${monMonth} ${monday.getDate()} – ${sunMonth} ${sun.getDate()}, ${monYear}`;
  }
  return `${monMonth} ${monday.getDate()} – ${sun.getDate()}, ${monYear}`;
}

/**
 * Resolve Sleep & Alarm Plan for a specific day
 */
export function resolveDaySleepPlan(isoDate, dayPlans = [], sleepDefaults = []) {
  const dateObj = parseDateISO(isoDate);
  const jsDay = dateObj.getDay();
  const isoWeekday = jsDay === 0 ? 7 : jsDay; // 1 = Mon .. 7 = Sun

  const override = dayPlans.find(p => p.plan_date === isoDate);
  const def = sleepDefaults.find(d => Number(d.day_of_week) === isoWeekday);

  const locationKey = override?.sleep_location || def?.sleep_location || 'my_place';
  const locationMeta = SLEEP_LOCATIONS[locationKey] || SLEEP_LOCATIONS.my_place;

  const bedtime = override?.bedtime || def?.bedtime || '23:00';
  const wakeTime = override?.wake_time || def?.wake_time || '07:30';

  const myWakeTime = override?.my_wake_time || def?.my_wake_time || null;
  const herWakeTime = override?.her_wake_time || def?.her_wake_time || null;
  const hasSeparateAlarms = Boolean(myWakeTime || herWakeTime);

  const myStatusNote = override?.my_status_note || '';
  const herStatusNote = override?.her_status_note || '';
  const locationNote = override?.location_note || '';

  const isCustomOverride = Boolean(
    override && (
      override.sleep_location !== undefined ||
      override.bedtime ||
      override.wake_time ||
      override.location_note ||
      override.my_status_note ||
      override.her_status_note ||
      override.my_wake_time ||
      override.her_wake_time
    )
  );

  return {
    isoDate,
    isoWeekday,
    locationKey,
    locationMeta,
    locationNote,
    bedtime: bedtime ? bedtime.slice(0, 5) : '23:00',
    wakeTime: wakeTime ? wakeTime.slice(0, 5) : '07:30',
    myWakeTime: myWakeTime ? myWakeTime.slice(0, 5) : null,
    herWakeTime: herWakeTime ? herWakeTime.slice(0, 5) : null,
    hasSeparateAlarms,
    myStatusNote,
    herStatusNote,
    isCustomOverride,
    rawOverride: override || null,
    rawDefault: def || null
  };
}

/**
 * Project one-time and weekly recurring events for a specific date
 */
export function projectEventsForDate(events = [], isoDate) {
  const dateObj = parseDateISO(isoDate);
  const jsDay = dateObj.getDay();
  const isoWeekday = jsDay === 0 ? 7 : jsDay;

  const matched = [];

  for (const ev of events) {
    if (ev.recurrence_type === 'none' || !ev.recurrence_type) {
      if (ev.event_date === isoDate) {
        matched.push({
          ...ev,
          instanceDate: isoDate,
          isProjected: false
        });
      }
    } else if (ev.recurrence_type === 'weekly') {
      // Must have started on or before this day
      if (ev.event_date > isoDate) continue;

      // Must not be after recurrence_end_date if set
      if (ev.recurrence_end_date && ev.recurrence_end_date < isoDate) continue;

      // Must not be in excluded_dates
      if (Array.isArray(ev.excluded_dates) && ev.excluded_dates.includes(isoDate)) continue;

      // Check weekdays
      const days = Array.isArray(ev.recurrence_days) && ev.recurrence_days.length > 0
        ? ev.recurrence_days.map(Number)
        : [(() => {
            const startD = parseDateISO(ev.event_date).getDay();
            return startD === 0 ? 7 : startD;
          })()];

      if (days.includes(isoWeekday)) {
        matched.push({
          ...ev,
          instanceDate: isoDate,
          isProjected: true
        });
      }
    } else if (ev.recurrence_type === 'monthly') {
      // Monthly recurrence: same day of the month
      if (ev.event_date > isoDate) continue;
      if (ev.recurrence_end_date && ev.recurrence_end_date < isoDate) continue;
      if (Array.isArray(ev.excluded_dates) && ev.excluded_dates.includes(isoDate)) continue;

      const [ey, em, ed] = ev.event_date.split('-').map(Number);
      const [cy, cm, cd] = isoDate.split('-').map(Number);

      const daysInCurrentMonth = new Date(cy, cm, 0).getDate();
      const targetDay = Math.min(ed, daysInCurrentMonth);

      if (cd === targetDay) {
        matched.push({
          ...ev,
          instanceDate: isoDate,
          isProjected: true
        });
      }
    } else if (ev.recurrence_type === 'annually') {
      // Annually recurrence: anniversaries, birthdays (same month & day)
      if (ev.event_date > isoDate) continue;
      if (ev.recurrence_end_date && ev.recurrence_end_date < isoDate) continue;
      if (Array.isArray(ev.excluded_dates) && ev.excluded_dates.includes(isoDate)) continue;

      const [ey, em, ed] = ev.event_date.split('-').map(Number);
      const [cy, cm, cd] = isoDate.split('-').map(Number);

      let isMatch = (em === cm && ed === cd);
      // Handle leap year Feb 29 anniversary on non-leap years
      if (!isMatch && em === 2 && ed === 29 && cm === 2 && cd === 28) {
        const isLeap = new Date(cy, 1, 29).getMonth() === 1;
        if (!isLeap) isMatch = true;
      }

      if (isMatch) {
        matched.push({
          ...ev,
          instanceDate: isoDate,
          isProjected: true
        });
      }
    }
  }

  // Sort: All-day first, then by start_time
  matched.sort((a, b) => {
    if (a.is_all_day && !b.is_all_day) return -1;
    if (!a.is_all_day && b.is_all_day) return 1;
    const timeA = a.start_time || '00:00';
    const timeB = b.start_time || '00:00';
    return timeA.localeCompare(timeB);
  });

  return matched;
}

/**
 * Generate Google Calendar 1-Tap Outbound Template Link
 */
export function createGoogleCalendarLink(event, instanceDate) {
  const dateStr = instanceDate || event.event_date;
  const owner = OWNER_TYPES[event.owner_type] || OWNER_TYPES.together;
  const title = `${owner.prefix} ${event.title}`.trim();

  let details = '';
  if (event.notes) details += `${event.notes}\n\n`;
  details += `Owner: ${owner.label}\nManaged via AndiNú couples planner: https://andinu.cc/planner`;

  let datesParam = '';
  if (event.is_all_day) {
    const startStr = dateStr.replace(/-/g, '');
    const d = parseDateISO(dateStr);
    d.setDate(d.getDate() + 1);
    const endStr = formatDateISO(d).replace(/-/g, '');
    datesParam = `${startStr}/${endStr}`;
  } else {
    const startTime = (event.start_time || '09:00').slice(0, 5).replace(':', '') + '00';
    let endTime = (event.end_time || '10:00').slice(0, 5).replace(':', '') + '00';
    const startIso = `${dateStr.replace(/-/g, '')}T${startTime}`;
    let endIso = `${dateStr.replace(/-/g, '')}T${endTime}`;
    if (endTime <= startTime) {
      const d = parseDateISO(dateStr);
      d.setDate(d.getDate() + 1);
      endIso = `${formatDateISO(d).replace(/-/g, '')}T${endTime}`;
    }
    datesParam = `${startIso}/${endIso}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: details
  });

  if (event.location) {
    params.set('location', event.location);
  }

  if (event.recurrence_type === 'weekly' && Array.isArray(event.recurrence_days) && event.recurrence_days.length > 0) {
    const dayMap = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA', 7: 'SU' };
    const byDays = event.recurrence_days.map(d => dayMap[d]).filter(Boolean).join(',');
    let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDays}`;
    if (event.recurrence_end_date) {
      rrule += `;UNTIL=${event.recurrence_end_date.replace(/-/g, '')}T235959Z`;
    }
    params.set('recur', rrule);
  } else if (event.recurrence_type === 'monthly') {
    let rrule = 'RRULE:FREQ=MONTHLY';
    if (event.recurrence_end_date) {
      rrule += `;UNTIL=${event.recurrence_end_date.replace(/-/g, '')}T235959Z`;
    }
    params.set('recur', rrule);
  } else if (event.recurrence_type === 'annually') {
    let rrule = 'RRULE:FREQ=YEARLY';
    if (event.recurrence_end_date) {
      rrule += `;UNTIL=${event.recurrence_end_date.replace(/-/g, '')}T235959Z`;
    }
    params.set('recur', rrule);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Format RFC 5545 timestamp for iCal (UTC)
 */
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

/**
 * Escape text for RFC 5545 iCalendar format
 */
function escapeICalText(str = '') {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generate RFC 5545 .ics Calendar Content
 * Strict one-way outbound sync:
 * - One-time & recurring events with [Together], [Me], [Her] prefixes
 * - Daily Sleep Location, Bedtime & Morning Alarm entries
 */
export function generateIcsContent({
  events = [],
  dayPlans = [],
  sleepDefaults = [],
  settings = {},
  rangeStartDaysBefore = 14,
  rangeEndDaysAfter = 60
}) {
  const now = new Date();
  const dtstamp = toICalDateTime(now);
  const calendarName = 'AndiNú Couples Planner';

  let lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AndiNu//Couples Life & Sleep Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:Europe/Madrid',
    `X-WR-CALDESC:Couples weekly life, sleep & schedule planner from andinu.cc`
  ];

  // 1. Export Planner Events
  for (const ev of events) {
    const owner = OWNER_TYPES[ev.owner_type] || OWNER_TYPES.together;
    const summary = `${owner.prefix} ${ev.title}`.trim();
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
    description += `Owner: ${owner.label}\nPlanner: https://andinu.cc/planner`;
    lines.push(`DESCRIPTION:${escapeICalText(description)}`);

    if (ev.is_all_day) {
      const startDay = toICalDateOnly(ev.event_date);
      const d = parseDateISO(ev.event_date);
      d.setDate(d.getDate() + 1);
      const nextDay = toICalDateOnly(formatDateISO(d));
      lines.push(`DTSTART;VALUE=DATE:${startDay}`);
      lines.push(`DTEND;VALUE=DATE:${nextDay}`);
    } else {
      const d = parseDateISO(ev.event_date);
      const startTime = ev.start_time || '09:00:00';
      const endTime = ev.end_time || '10:00:00';
      lines.push(`DTSTART:${toICalDateTime(d, startTime)}`);
      lines.push(`DTEND:${toICalDateTime(d, endTime)}`);
    }

    // Recurrence rules
    if (ev.recurrence_type === 'weekly' && Array.isArray(ev.recurrence_days) && ev.recurrence_days.length > 0) {
      const dayMap = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA', 7: 'SU' };
      const byDays = eventDays => eventDays.map(d => dayMap[d]).filter(Boolean).join(',');
      let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDays(ev.recurrence_days)}`;
      if (ev.recurrence_end_date) {
        rrule += `;UNTIL=${toICalDateOnly(ev.recurrence_end_date)}T235959Z`;
      }
      lines.push(rrule);

      if (Array.isArray(ev.excluded_dates) && ev.excluded_dates.length > 0) {
        const exdateStr = ev.excluded_dates.map(toICalDateOnly).join(',');
        lines.push(`EXDATE;VALUE=DATE:${exdateStr}`);
      }
    } else if (ev.recurrence_type === 'monthly') {
      let rrule = 'RRULE:FREQ=MONTHLY';
      if (ev.recurrence_end_date) {
        rrule += `;UNTIL=${toICalDateOnly(ev.recurrence_end_date)}T235959Z`;
      }
      lines.push(rrule);

      if (Array.isArray(ev.excluded_dates) && ev.excluded_dates.length > 0) {
        const exdateStr = ev.excluded_dates.map(toICalDateOnly).join(',');
        lines.push(`EXDATE;VALUE=DATE:${exdateStr}`);
      }
    } else if (ev.recurrence_type === 'annually') {
      let rrule = 'RRULE:FREQ=YEARLY';
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

  // 2. Export Daily Sleep & Alarm Entries for the rolling window
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - rangeStartDaysBefore);
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + rangeEndDaysAfter);

  const cur = new Date(windowStart);
  while (cur <= windowEnd) {
    const isoDate = formatDateISO(cur);
    const plan = resolveDaySleepPlan(isoDate, dayPlans, sleepDefaults);

    const sleepSummary = `[Sleep] ${plan.locationMeta.icon} ${plan.locationMeta.label}`;
    const sleepUid = `andinu-sleep-${isoDate}@andinu.cc`;

    // Bedtime event
    const bedDateTime = toICalDateTime(cur, `${plan.bedtime}:00`);
    const nextDay = new Date(cur);
    nextDay.setDate(nextDay.getDate() + 1);
    const wakeDateTime = toICalDateTime(nextDay, `${plan.wakeTime}:00`);

    let sleepDesc = `Target Bedtime: ${plan.bedtime}\nMorning Alarm: ${plan.wakeTime}`;
    if (plan.hasSeparateAlarms) {
      if (plan.myWakeTime) sleepDesc += `\n🌱 Andi: ${plan.myWakeTime}`;
      if (plan.herWakeTime) sleepDesc += `\n🌊 Núria: ${plan.herWakeTime}`;
    }
    if (plan.locationNote) sleepDesc += `\nLocation Note: ${plan.locationNote}`;
    if (plan.myStatusNote) sleepDesc += `\n🌱 Andi status: ${plan.myStatusNote}`;
    if (plan.herStatusNote) sleepDesc += `\n🌊 Núria status: ${plan.herStatusNote}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${sleepUid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`SUMMARY:${escapeICalText(sleepSummary)}`);
    lines.push(`DESCRIPTION:${escapeICalText(sleepDesc)}`);
    lines.push(`DTSTART:${bedDateTime}`);
    lines.push(`DTEND:${wakeDateTime}`);

    // Bedtime reminder alarm (30 minutes prior)
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Bedtime in 30 minutes (${plan.locationMeta.label})`);
    lines.push('TRIGGER:-PT30M');
    lines.push('END:VALARM');

    lines.push('END:VEVENT');

    cur.setDate(cur.getDate() + 1);
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger browser download of .ics calendar file
 */
export function downloadIcsFile(filename = 'andinu-couples-planner.ics', icsContent = '') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
