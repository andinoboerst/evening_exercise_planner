import {
  getCurrentUser,
  getActiveHousehold,
  supabase,
  isSupabaseConfigured,
  generateUUID
} from '../services/supabase.js';

import {
  SLEEP_LOCATIONS,
  OWNER_TYPES,
  WEEKDAYS,
  formatDateISO,
  parseDateISO,
  getMondayOfWeek,
  getSundayOfWeek,
  getDaysForWeek,
  formatWeekRangeLabel,
  resolveDaySleepPlan,
  projectEventsForDate,
  createGoogleCalendarLink,
  generateIcsContent,
  downloadIcsFile
} from '../utils/calendarSync.js';

export async function mountPlanner(container, navigate) {
  const user = await getCurrentUser();
  const household = await getActiveHousehold();

  // State
  let currentMonday = getMondayOfWeek(new Date());
  let settings = null;
  let sleepDefaults = [];
  let dayPlans = [];
  let events = [];

  // Modals state
  let editingEvent = null; // null for new, object for edit
  let targetDayForNewEvent = formatDateISO(new Date());
  let editingDayPlan = null;
  let statusEditTarget = { date: formatDateISO(new Date()), partner: 'me' };
  let pendingDeleteRecurring = null;

  // Cache keys
  const CACHE_SETTINGS_KEY = 'andinu_cache_planner_settings';
  const CACHE_DEFAULTS_KEY = 'andinu_cache_planner_defaults';
  const CACHE_PLANS_KEY = 'andinu_cache_planner_day_plans';
  const CACHE_EVENTS_KEY = 'andinu_cache_planner_events';

  // Starter / fallback template
  const DEFAULT_SLEEP_TEMPLATE = [
    { day_of_week: 1, sleep_location: 'her_place', bedtime: '23:00', wake_time: '07:15', my_wake_time: null, her_wake_time: null },
    { day_of_week: 2, sleep_location: 'her_place', bedtime: '23:00', wake_time: '07:15', my_wake_time: null, her_wake_time: null },
    { day_of_week: 3, sleep_location: 'apart', bedtime: '23:30', wake_time: '07:30', my_wake_time: '07:30', her_wake_time: '08:00' },
    { day_of_week: 4, sleep_location: 'my_place', bedtime: '23:30', wake_time: '07:30', my_wake_time: null, her_wake_time: null },
    { day_of_week: 5, sleep_location: 'my_place', bedtime: '00:00', wake_time: '09:00', my_wake_time: null, her_wake_time: null },
    { day_of_week: 6, sleep_location: 'my_place', bedtime: '00:30', wake_time: '09:30', my_wake_time: null, her_wake_time: null },
    { day_of_week: 7, sleep_location: 'her_place', bedtime: '23:00', wake_time: '07:15', my_wake_time: null, her_wake_time: null }
  ];

  function getStarterEvents() {
    const mondayStr = formatDateISO(currentMonday);
    const d = (offsetDays) => {
      const dt = new Date(currentMonday);
      dt.setDate(dt.getDate() + offsetDays);
      return formatDateISO(dt);
    };

    return [
      {
        id: 'ev-demo-1',
        title: 'Weekly Life & Meal Sync',
        notes: 'Review calendar, coordinate grocery run and dinner recipes',
        location: 'Kitchen table',
        owner_type: 'together',
        event_date: d(0), // Monday
        start_time: '19:30',
        end_time: '20:30',
        is_all_day: false,
        recurrence_type: 'weekly',
        recurrence_days: [1],
        excluded_dates: []
      },
      {
        id: 'ev-demo-2',
        title: 'Pilates Class',
        notes: 'At the studio near work',
        location: 'Studio Core',
        owner_type: 'her',
        event_date: d(1), // Tuesday
        start_time: '18:15',
        end_time: '19:15',
        is_all_day: false,
        recurrence_type: 'weekly',
        recurrence_days: [2],
        excluded_dates: []
      },
      {
        id: 'ev-demo-3',
        title: 'Climbing Gym Session',
        notes: 'Bouldering with friends',
        location: 'Sharma Climbing',
        owner_type: 'me',
        event_date: d(2), // Wednesday
        start_time: '19:00',
        end_time: '21:00',
        is_all_day: false,
        recurrence_type: 'weekly',
        recurrence_days: [3],
        excluded_dates: []
      },
      {
        id: 'ev-demo-4',
        title: 'Cook Homemade Pasta',
        notes: 'Making fresh pasta dough with truffle oil',
        location: 'My apartment',
        owner_type: 'together',
        event_date: d(3), // Thursday
        start_time: '20:00',
        end_time: '21:30',
        is_all_day: false,
        recurrence_type: 'none',
        recurrence_days: [],
        excluded_dates: []
      },
      {
        id: 'ev-demo-5',
        title: 'Friday Date Night & Vinyl',
        notes: 'New jazz record listening session + wine',
        location: 'Living room',
        owner_type: 'together',
        event_date: d(4), // Friday
        start_time: '20:30',
        end_time: '23:30',
        is_all_day: false,
        recurrence_type: 'weekly',
        recurrence_days: [5],
        excluded_dates: []
      },
      {
        id: 'ev-demo-6',
        title: 'Farmers Market & Coffee',
        notes: 'Grab fresh sourdough and seasonal fruits',
        location: 'Neighborhood market',
        owner_type: 'together',
        event_date: d(5), // Saturday
        start_time: '10:30',
        end_time: '12:00',
        is_all_day: false,
        recurrence_type: 'none',
        recurrence_days: [],
        excluded_dates: []
      },
      {
        id: 'ev-demo-7',
        title: 'Our Anniversary 🥂',
        notes: 'Celebrating our special day together! Candlelight dinner reservation.',
        location: 'Gourmet Bistro',
        owner_type: 'together',
        event_date: d(6), // Sunday
        start_time: null,
        end_time: null,
        is_all_day: true,
        recurrence_type: 'annually',
        recurrence_days: [],
        excluded_dates: []
      }
    ];
  }

  // Initial Data Fetching
  async function loadData() {
    // 1. Settings
    try {
      const cached = localStorage.getItem(CACHE_SETTINGS_KEY);
      if (cached) settings = JSON.parse(cached);
    } catch (_) {}

    if (isSupabaseConfigured && household?.id) {
      try {
        const { data: s } = await supabase
          .from('planner_settings')
          .select('*')
          .eq('household_id', household.id)
          .single();

        if (s) {
          settings = s;
          localStorage.setItem(CACHE_SETTINGS_KEY, JSON.stringify(s));
        } else {
          // Initialize settings for household
          const newSettings = {
            household_id: household.id,
            my_display_name: 'Andino',
            her_display_name: 'Núria',
            calendar_feed_token: generateUUID()
          };
          const { data: created } = await supabase
            .from('planner_settings')
            .insert([newSettings])
            .select()
            .single();
          if (created) {
            settings = created;
            localStorage.setItem(CACHE_SETTINGS_KEY, JSON.stringify(created));
          }
        }
      } catch (e) {
        console.warn('Planner settings load error:', e);
      }
    }

    if (!settings) {
      settings = {
        household_id: household?.id || 'demo-hh',
        my_display_name: 'Andino',
        her_display_name: 'Núria',
        calendar_feed_token: generateUUID()
      };
    }

    // 2. Sleep Defaults
    try {
      const cachedDef = localStorage.getItem(CACHE_DEFAULTS_KEY);
      if (cachedDef) sleepDefaults = JSON.parse(cachedDef);
    } catch (_) {}

    if (isSupabaseConfigured && household?.id) {
      try {
        const { data: defs } = await supabase
          .from('planner_sleep_defaults')
          .select('*')
          .eq('household_id', household.id)
          .order('day_of_week', { ascending: true });

        if (defs && defs.length > 0) {
          sleepDefaults = defs;
          localStorage.setItem(CACHE_DEFAULTS_KEY, JSON.stringify(defs));
        } else {
          // Seed initial defaults
          const inserts = DEFAULT_SLEEP_TEMPLATE.map(t => ({
            household_id: household.id,
            ...t
          }));
          const { data: createdDefs } = await supabase
            .from('planner_sleep_defaults')
            .insert(inserts)
            .select();
          if (createdDefs && createdDefs.length > 0) {
            sleepDefaults = createdDefs;
            localStorage.setItem(CACHE_DEFAULTS_KEY, JSON.stringify(createdDefs));
          }
        }
      } catch (e) {
        console.warn('Sleep defaults load error:', e);
      }
    }

    if (!sleepDefaults || sleepDefaults.length === 0) {
      sleepDefaults = DEFAULT_SLEEP_TEMPLATE.map(t => ({
        ...t,
        id: `def-${t.day_of_week}`,
        household_id: settings.household_id
      }));
    }

    // 3. Day Plans (overrides)
    try {
      const cachedPlans = localStorage.getItem(CACHE_PLANS_KEY);
      if (cachedPlans) dayPlans = JSON.parse(cachedPlans);
    } catch (_) {}

    if (isSupabaseConfigured && household?.id) {
      try {
        const { data: plans } = await supabase
          .from('planner_day_plans')
          .select('*')
          .eq('household_id', household.id);
        if (plans) {
          dayPlans = plans;
          localStorage.setItem(CACHE_PLANS_KEY, JSON.stringify(plans));
        }
      } catch (e) {
        console.warn('Day plans load error:', e);
      }
    }

    // 4. Events
    try {
      const cachedEvents = localStorage.getItem(CACHE_EVENTS_KEY);
      if (cachedEvents) events = JSON.parse(cachedEvents);
    } catch (_) {}

    if (isSupabaseConfigured && household?.id) {
      try {
        const { data: evs } = await supabase
          .from('planner_events')
          .select('*')
          .eq('household_id', household.id)
          .order('event_date', { ascending: true });
        if (evs && evs.length > 0) {
          events = evs;
          localStorage.setItem(CACHE_EVENTS_KEY, JSON.stringify(evs));
        } else if (!cachedEvents || events.length === 0) {
          // Seed starter events
          const starters = getStarterEvents().map(e => ({
            household_id: household.id,
            ...e,
            id: generateUUID()
          }));
          const { data: createdEvents } = await supabase
            .from('planner_events')
            .insert(starters)
            .select();
          if (createdEvents) {
            events = createdEvents;
            localStorage.setItem(CACHE_EVENTS_KEY, JSON.stringify(createdEvents));
          }
        }
      } catch (e) {
        console.warn('Events load error:', e);
      }
    }

    if (!events || events.length === 0) {
      events = getStarterEvents();
    }
  }

  // Database / State Helpers
  async function saveDayOverride(isoDate, overrideFields) {
    const existing = dayPlans.find(p => p.plan_date === isoDate);
    const updatedRecord = {
      ...(existing || { id: generateUUID(), household_id: settings.household_id, plan_date: isoDate }),
      ...overrideFields,
      updated_at: new Date().toISOString()
    };

    const newPlans = dayPlans.filter(p => p.plan_date !== isoDate);
    newPlans.push(updatedRecord);
    dayPlans = newPlans;
    localStorage.setItem(CACHE_PLANS_KEY, JSON.stringify(dayPlans));

    if (isSupabaseConfigured && household?.id) {
      try {
        await supabase
          .from('planner_day_plans')
          .upsert(updatedRecord, { onConflict: 'household_id, plan_date' });
      } catch (e) {
        console.error('Save day plan error:', e);
      }
    }
    render();
  }

  async function resetDayOverride(isoDate) {
    dayPlans = dayPlans.filter(p => p.plan_date !== isoDate);
    localStorage.setItem(CACHE_PLANS_KEY, JSON.stringify(dayPlans));

    if (isSupabaseConfigured && household?.id) {
      try {
        await supabase
          .from('planner_day_plans')
          .delete()
          .eq('household_id', household.id)
          .eq('plan_date', isoDate);
      } catch (e) {
        console.error('Reset day plan error:', e);
      }
    }
    render();
  }

  async function saveSleepDefaults(newDefaults) {
    sleepDefaults = newDefaults;
    localStorage.setItem(CACHE_DEFAULTS_KEY, JSON.stringify(sleepDefaults));

    if (isSupabaseConfigured && household?.id) {
      try {
        await supabase
          .from('planner_sleep_defaults')
          .upsert(newDefaults, { onConflict: 'household_id, day_of_week' });
      } catch (e) {
        console.error('Save sleep defaults error:', e);
      }
    }
    render();
  }

  async function saveEvent(eventData) {
    let savedEvent;
    if (eventData.id && events.some(e => e.id === eventData.id)) {
      savedEvent = {
        ...events.find(e => e.id === eventData.id),
        ...eventData,
        updated_at: new Date().toISOString()
      };
      events = events.map(e => e.id === savedEvent.id ? savedEvent : e);
    } else {
      savedEvent = {
        ...eventData,
        id: eventData.id || generateUUID(),
        household_id: settings.household_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      events.push(savedEvent);
    }

    localStorage.setItem(CACHE_EVENTS_KEY, JSON.stringify(events));

    if (isSupabaseConfigured && household?.id) {
      try {
        await supabase
          .from('planner_events')
          .upsert(savedEvent);
      } catch (e) {
        console.error('Save event error:', e);
      }
    }
    render();
  }

  async function deleteEvent(eventId) {
    events = events.filter(e => e.id !== eventId);
    localStorage.setItem(CACHE_EVENTS_KEY, JSON.stringify(events));

    if (isSupabaseConfigured && household?.id) {
      try {
        await supabase
          .from('planner_events')
          .delete()
          .eq('id', eventId);
      } catch (e) {
        console.error('Delete event error:', e);
      }
    }
    render();
  }

  async function excludeDateFromRecurring(eventId, isoDate) {
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    const excluded = Array.isArray(ev.excluded_dates) ? [...ev.excluded_dates] : [];
    if (!excluded.includes(isoDate)) {
      excluded.push(isoDate);
    }

    const updated = {
      ...ev,
      excluded_dates: excluded,
      updated_at: new Date().toISOString()
    };

    events = events.map(e => e.id === eventId ? updated : e);
    localStorage.setItem(CACHE_EVENTS_KEY, JSON.stringify(events));

    if (isSupabaseConfigured && household?.id) {
      try {
        await supabase
          .from('planner_events')
          .update({ excluded_dates: excluded })
          .eq('id', eventId);
      } catch (e) {
        console.error('Exclude date error:', e);
      }
    }
    render();
  }

  async function stopRecurringFuture(eventId, isoDate) {
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    // Set recurrence_end_date to the day before isoDate
    const dt = parseDateISO(isoDate);
    dt.setDate(dt.getDate() - 1);
    const endDate = formatDateISO(dt);

    const updated = {
      ...ev,
      recurrence_end_date: endDate,
      updated_at: new Date().toISOString()
    };

    events = events.map(e => e.id === eventId ? updated : e);
    localStorage.setItem(CACHE_EVENTS_KEY, JSON.stringify(events));

    if (isSupabaseConfigured && household?.id) {
      try {
        await supabase
          .from('planner_events')
          .update({ recurrence_end_date: endDate })
          .eq('id', eventId);
      } catch (e) {
        console.error('Stop recurring error:', e);
      }
    }
    render();
  }

  async function regenerateToken() {
    const newToken = generateUUID();
    settings.calendar_feed_token = newToken;
    localStorage.setItem(CACHE_SETTINGS_KEY, JSON.stringify(settings));

    if (isSupabaseConfigured && household?.id) {
      try {
        await supabase
          .from('planner_settings')
          .update({ calendar_feed_token: newToken, updated_at: new Date().toISOString() })
          .eq('household_id', household.id);
      } catch (e) {
        console.error('Regenerate token error:', e);
      }
    }
    render();
  }

  // Main Render Routine
  function render() {
    const weekDays = getDaysForWeek(currentMonday);
    const weekLabel = formatWeekRangeLabel(currentMonday);
    const thisMonday = getMondayOfWeek(new Date());
    const isThisWeek = formatDateISO(currentMonday) === formatDateISO(thisMonday);
    const todayStr = formatDateISO(new Date());

    // Resolve plans and events for all 7 days
    const dayDataList = weekDays.map(day => {
      const sleepPlan = resolveDaySleepPlan(day.isoDate, dayPlans, sleepDefaults);
      const dayEvents = projectEventsForDate(events, day.isoDate);
      return {
        ...day,
        sleepPlan,
        dayEvents
      };
    });

    const origin = window.location.origin;
    const feedToken = settings?.calendar_feed_token || '00000000-0000-0000-0000-000000000000';
    const icsFeedUrl = `${origin}/api/planner/ics/${feedToken}/andinu.ics`;
    const webcalFeedUrl = `webcal://${window.location.host}/api/planner/ics/${feedToken}/andinu.ics`;
    const gcalSubscribeUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalFeedUrl)}`;

    container.innerHTML = `
      <div class="planner-shell">
        <!-- Top Sticky Week Navigation Header -->
        <header class="planner-header">
          <div class="planner-header-content">
            <div class="planner-brand-group">
              <span class="planner-brand-badge">Couple Planner</span>
              <h1 class="planner-heading">Weekly Life & Sleep</h1>
            </div>

            <!-- Week Controls -->
            <div class="planner-week-controls">
              <button id="btn-prev-week" class="planner-nav-btn" aria-label="Previous Week" title="Previous Week">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div class="planner-week-title" id="planner-week-label">
                ${weekLabel}
              </div>

              <button id="btn-next-week" class="planner-nav-btn" aria-label="Next Week" title="Next Week">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              <button id="btn-this-week" class="planner-today-btn ${isThisWeek ? 'is-current' : ''}">
                This Week
              </button>
            </div>

            <!-- Top Action Pills -->
            <div class="planner-header-actions">
              <button id="btn-add-event" class="planner-btn-primary">
                <span class="btn-icon">+</span>
                <span>Add Event</span>
              </button>

              <button id="btn-open-defaults" class="planner-btn-subtle" title="Recurring Mon–Sun Sleep & Alarm Template">
                <span>🛏️ Routine Template</span>
              </button>

              <button id="btn-open-sync" class="planner-btn-subtle" title="Outbound 1-Way Google Calendar Feed">
                <span>🔄 Google Calendar</span>
              </button>

              <button id="btn-open-alarm-help" class="planner-btn-subtle" title="Phone Alarm Automation Helper">
                <span>⏰ Phone Alarms</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Mobile Sticky Mon-Sun Day Pill Strip (< 768px) -->
        <nav class="planner-mobile-strip-wrap" aria-label="Day selection strip">
          <div class="planner-mobile-strip">
            ${dayDataList.map(day => {
              const dots = {
                green: day.dayEvents.some(e => e.owner_type === 'me'),
                blue: day.dayEvents.some(e => e.owner_type === 'her'),
                burgundy: day.dayEvents.some(e => e.owner_type === 'together')
              };
              return `
                <button 
                  class="planner-day-pill ${day.isToday ? 'is-today' : ''}" 
                  data-jump-day="${day.isoDate}" 
                  title="${day.fullName}, ${day.monthShort} ${day.dayNumber}"
                >
                  <span class="day-pill-letter">${day.letter}</span>
                  <span class="day-pill-num">${day.dayNumber}</span>
                  <span class="day-pill-sleep-icon" title="Sleep: ${day.sleepPlan.locationMeta.label}">
                    ${day.sleepPlan.locationMeta.icon}
                  </span>
                  <div class="day-pill-dots">
                    ${dots.green ? '<span class="dot-green"></span>' : ''}
                    ${dots.blue ? '<span class="dot-blue"></span>' : ''}
                    ${dots.burgundy ? '<span class="dot-burgundy"></span>' : ''}
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </nav>

        <!-- Main Weekly Board (Desktop 7-Col Grid / Mobile Vertical Stack) -->
        <main class="planner-board-container">
          <div class="planner-days-grid">
            ${dayDataList.map(day => renderDayColumn(day, todayStr)).join('')}
          </div>
        </main>

        <!-- Dialogs & Modals -->
        ${renderEventDialog()}
        ${renderDefaultsDialog()}
        ${renderDayOverrideDialog()}
        ${renderStatusDialog()}
        ${renderSyncDialog(icsFeedUrl, webcalFeedUrl, gcalSubscribeUrl)}
        ${renderAlarmDialog(feedToken)}
        ${renderDeleteRecurringDialog()}
      </div>
    `;

    bindEvents();
  }

  // Render a Single Day Column / Card
  function renderDayColumn(day, todayStr) {
    const sleep = day.sleepPlan;
    const isToday = day.isoDate === todayStr;
    const allDayEvents = day.dayEvents.filter(e => e.is_all_day);
    const timedEvents = day.dayEvents.filter(e => !e.is_all_day);

    return `
      <section class="planner-day-card ${isToday ? 'is-today' : ''}" id="day-card-${day.isoDate}">
        <!-- Day Column Header -->
        <div class="day-card-header">
          <div class="day-header-left">
            <span class="day-name">${day.fullName}</span>
            <span class="day-date">${day.monthShort} ${day.dayNumber}</span>
            ${isToday ? '<span class="day-today-tag">Today</span>' : ''}
          </div>

          <button class="day-quick-add-btn" data-add-for-date="${day.isoDate}" title="Add event on ${day.shortName}">
            <span>+</span>
          </button>
        </div>


        <!-- Partner Heads-Up Status Note -->
        <div class="day-partner-status-box">
          <button class="partner-status-pill status-me" data-edit-status="${day.isoDate}" data-partner="me" title="Click to update Andi's status">
            <span class="status-indicator-dot dot-green"></span>
            <span class="status-owner-label">Andi:</span>
            <span class="status-text">${sleep.myStatusNote ? escapeHtml(sleep.myStatusNote) : '<span class="status-placeholder">Tap to set note…</span>'}</span>
          </button>

          <button class="partner-status-pill status-her" data-edit-status="${day.isoDate}" data-partner="her" title="Click to update Núria's status">
            <span class="status-indicator-dot dot-blue"></span>
            <span class="status-owner-label">Núria:</span>
            <span class="status-text">${sleep.herStatusNote ? escapeHtml(sleep.herStatusNote) : '<span class="status-placeholder">Tap to set note…</span>'}</span>
          </button>
        </div>

        <!-- Sleep Location & Morning Alarm Card -->
        <div class="day-sleep-card">
          <div class="sleep-card-header">
            <span class="sleep-card-title">Sleep & Alarm</span>
            ${sleep.isCustomOverride ? '<span class="sleep-override-badge" title="Custom override for this date">Override</span>' : '<span class="sleep-default-badge" title="Using recurring routine default">Default</span>'}
          </div>

          <!-- 1-Tap Sleep Location Selector -->
          <div class="sleep-location-selector" role="radiogroup" aria-label="Sleep location for ${day.shortName}">
            ${Object.values(SLEEP_LOCATIONS).map(loc => {
              const isSelected = sleep.locationKey === loc.key;
              return `
                <button 
                  type="button"
                  class="sleep-loc-pill ${isSelected ? 'selected' : ''}" 
                  data-set-sleep-loc="${loc.key}" 
                  data-for-date="${day.isoDate}"
                  title="${loc.label} (${loc.partner})"
                >
                  <span class="loc-icon">${loc.icon}</span>
                  <span class="loc-text">${loc.label.split(' ')[0]}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Bedtime & Morning Wake-Up Alarms -->
          <div class="sleep-times-row">
            <div class="sleep-time-badge bedtime-badge" title="Planned bedtime">
              <span class="time-icon">🌙</span>
              <span class="time-val">${sleep.bedtime}</span>
            </div>

            ${sleep.hasSeparateAlarms ? `
              <div class="sleep-time-badge separate-alarms-badge" title="Separate alarms">
                <span class="alarm-badge-item badge-green" title="Andi alarm">🌱 ${sleep.myWakeTime || sleep.wakeTime}</span>
                <span class="alarm-badge-item badge-blue" title="Núria alarm">🌊 ${sleep.herWakeTime || sleep.wakeTime}</span>
              </div>
            ` : `
              <div class="sleep-time-badge alarm-badge" title="Morning wake-up alarm">
                <span class="time-icon">⏰</span>
                <span class="time-val">${sleep.wakeTime}</span>
              </div>
            `}

            <button class="sleep-edit-btn" data-edit-sleep-plan="${day.isoDate}" title="Edit bedtime, alarms or location note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          ${sleep.locationNote ? `
            <div class="sleep-location-custom-note">
              📍 ${escapeHtml(sleep.locationNote)}
            </div>
          ` : ''}

          <!-- Quick Action on Today: Set Phone Alarm -->
          ${isToday ? `
            <button class="btn-set-phone-alarm" data-trigger-alarm="${day.isoDate}" title="Automate tonight's bedtime & morning alarm">
              <span>⏰ Set Phone Alarm</span>
            </button>
          ` : ''}
        </div>

        <!-- All-Day Events Strip (Compact bar below sleep card, at top of day's events) -->
        ${allDayEvents.length > 0 ? `
          <div class="day-allday-events-strip" aria-label="All-day events for ${day.shortName}">
            ${allDayEvents.map(ev => renderAllDayEventBar(ev, day.isoDate)).join('')}
          </div>
        ` : ''}

        <!-- Chronological Events List -->
        <div class="day-events-list">
          ${timedEvents.length > 0 ? timedEvents.map(ev => renderEventCard(ev, day.isoDate)).join('') : (allDayEvents.length > 0 ? '' : `
            <div class="day-events-empty">
              <span>No events scheduled</span>
              <button class="empty-add-btn" data-add-for-date="${day.isoDate}">+ Add</button>
            </div>
          `)}
        </div>
      </section>
    `;
  }

  // Render an All-Day Event Bar (Google Calendar Top Bar style)
  function renderAllDayEventBar(ev, instanceDate) {
    const owner = OWNER_TYPES[ev.owner_type] || OWNER_TYPES.together;
    const gcalUrl = createGoogleCalendarLink(ev, instanceDate);
    const isRecurring = Boolean(ev.recurrence_type && ev.recurrence_type !== 'none');

    let recurIcon = '';
    let recurTitle = '';
    if (ev.recurrence_type === 'annually') {
      recurIcon = '🎉';
      recurTitle = 'Repeats annually (Anniversary / Birthday)';
    } else if (ev.recurrence_type === 'monthly') {
      recurIcon = '📅';
      recurTitle = 'Repeats monthly';
    } else if (ev.recurrence_type === 'weekly') {
      recurIcon = '↻';
      recurTitle = 'Repeats weekly';
    }

    let tooltip = `${ev.title} (All Day • ${owner.tag})`;
    if (recurTitle) tooltip += ` — ${recurTitle}`;
    if (ev.location) tooltip += ` • 📍 ${ev.location}`;
    if (ev.notes) tooltip += ` • 💬 ${ev.notes}`;

    return `
      <div 
        class="planner-allday-bar ${owner.badgeClass}" 
        data-edit-event="${ev.id}" 
        data-event-id="${ev.id}" 
        data-instance-date="${instanceDate}"
        role="button"
        tabindex="0"
        title="${escapeHtml(tooltip)}"
      >
        <div class="allday-bar-content">
          ${recurIcon ? `<span class="allday-recur-badge" title="${recurTitle}">${recurIcon}</span>` : ''}
          <span class="allday-owner-tag">${owner.tag}</span>
          <span class="allday-bar-title">${escapeHtml(ev.title)}</span>
          ${ev.location ? `<span class="allday-location-pin" title="${escapeHtml(ev.location)}">📍</span>` : ''}
        </div>

        <div class="allday-bar-actions">
          <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="btn-allday-action btn-allday-gcal" title="Open in Google Calendar" onclick="event.stopPropagation()">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <button type="button" class="btn-allday-action btn-allday-delete" data-delete-event="${ev.id}" data-instance-date="${instanceDate}" data-is-recurring="${isRecurring}" title="Delete event" onclick="event.stopPropagation()">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  // Render an Event Card with Couple Color Coding
  function renderEventCard(ev, instanceDate) {
    const owner = OWNER_TYPES[ev.owner_type] || OWNER_TYPES.together;
    const gcalUrl = createGoogleCalendarLink(ev, instanceDate);
    const isRecurring = Boolean(ev.recurrence_type && ev.recurrence_type !== 'none');

    let recurBadge = '';
    if (ev.recurrence_type === 'weekly') {
      recurBadge = '<span class="event-recurring-badge" title="Repeats weekly">↻ Weekly</span>';
    } else if (ev.recurrence_type === 'monthly') {
      recurBadge = '<span class="event-recurring-badge" title="Repeats monthly">↻ Monthly</span>';
    } else if (ev.recurrence_type === 'annually') {
      recurBadge = '<span class="event-recurring-badge" title="Repeats annually (Anniversary / Birthday)">🎉 Annual</span>';
    }

    let timeLabel = 'All Day';
    if (!ev.is_all_day && ev.start_time) {
      timeLabel = ev.start_time.slice(0, 5);
      if (ev.end_time) timeLabel += ` – ${ev.end_time.slice(0, 5)}`;
    }

    return `
      <article class="planner-event-card ${owner.badgeClass}" data-event-id="${ev.id}" data-instance-date="${instanceDate}">
        <div class="event-card-top">
          <span class="event-owner-badge">${owner.tag}</span>
          <span class="event-time-badge">${timeLabel}</span>
          ${recurBadge}
        </div>

        <h4 class="event-title">${escapeHtml(ev.title)}</h4>

        ${ev.location ? `
          <div class="event-meta-line event-location">
            <span class="meta-icon">📍</span>
            <span>${escapeHtml(ev.location)}</span>
          </div>
        ` : ''}

        ${ev.notes ? `
          <div class="event-meta-line event-notes">
            <span class="meta-icon">💬</span>
            <span>${escapeHtml(ev.notes)}</span>
          </div>
        ` : ''}

        <!-- Card Outbound & Edit Actions -->
        <div class="event-actions-row">
          <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="btn-event-gcal" title="Open and push into Google Calendar">
            <span>GCal ↗</span>
          </a>

          <button class="btn-event-edit" data-edit-event="${ev.id}" title="Edit event">
            <span>✏️</span>
          </button>

          <button class="btn-event-delete" data-delete-event="${ev.id}" data-instance-date="${instanceDate}" data-is-recurring="${isRecurring}" title="Delete event">
            <span>🗑️</span>
          </button>
        </div>
      </article>
    `;
  }

  // Event Modal Template
  function renderEventDialog() {
    return `
      <dialog id="planner-event-dialog" class="planner-modal" closedby="any" aria-labelledby="event-dialog-title">
        <form id="form-planner-event" method="dialog" class="planner-modal-content">
          <div class="modal-header">
            <h3 id="event-dialog-title" class="modal-title">New Event</h3>
            <button type="button" class="modal-close-btn" data-close-dialog="planner-event-dialog">✕</button>
          </div>

          <div class="modal-body">
            <!-- Event Title -->
            <div class="form-group">
              <label for="event-input-title" class="form-label">Event Title *</label>
              <input type="text" id="event-input-title" class="form-input" placeholder="e.g. Work Dinner, Pilates, Date Night" required />
            </div>

            <!-- Owner Selector (Me / Her / Together) -->
            <div class="form-group">
              <label class="form-label">Who is this for? *</label>
              <div class="owner-radio-group">
                <label class="owner-radio-label owner-together">
                  <input type="radio" name="event-owner" value="together" checked />
                  <span class="owner-radio-card">
                    <span class="radio-dot dot-burgundy"></span>
                    <span>Together</span>
                  </span>
                </label>

                <label class="owner-radio-label owner-me">
                  <input type="radio" name="event-owner" value="me" />
                  <span class="owner-radio-card">
                    <span class="radio-dot dot-green"></span>
                    <span>Andino (Me)</span>
                  </span>
                </label>

                <label class="owner-radio-label owner-her">
                  <input type="radio" name="event-owner" value="her" />
                  <span class="owner-radio-card">
                    <span class="radio-dot dot-blue"></span>
                    <span>Núria (Her)</span>
                  </span>
                </label>
              </div>
            </div>

            <!-- Date & Time Row -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label for="event-input-date" class="form-label">Date *</label>
                <input type="date" id="event-input-date" class="form-input" required />
              </div>

              <div class="form-group check-group-inline">
                <label class="checkbox-label">
                  <input type="checkbox" id="event-input-allday" />
                  <span>All Day</span>
                </label>
              </div>
            </div>

            <div class="form-row" id="time-inputs-row">
              <div class="form-group flex-1">
                <label for="event-input-start" class="form-label">Start Time</label>
                <input type="time" id="event-input-start" class="form-input" value="18:30" />
              </div>

              <div class="form-group flex-1">
                <label for="event-input-end" class="form-label">End Time</label>
                <input type="time" id="event-input-end" class="form-input" value="20:00" />
              </div>
            </div>

            <!-- Location & Partner Notes -->
            <div class="form-group">
              <label for="event-input-location" class="form-label">Location (Optional)</label>
              <input type="text" id="event-input-location" class="form-input" placeholder="e.g. Restaurant, Pilates Studio, Living Room" />
            </div>

            <div class="form-group">
              <label for="event-input-notes" class="form-label">Notes for Partner (Optional)</label>
              <textarea id="event-input-notes" class="form-textarea" rows="2" placeholder="e.g. Home by 9:30 PM, don't wait for dinner"></textarea>
            </div>

            <!-- Recurrence Options -->
            <div class="form-group recurrence-section">
              <label for="event-input-recurrence" class="form-label">Recurrence</label>
              <select id="event-input-recurrence" class="form-select">
                <option value="none">One-time event (No repeat)</option>
                <option value="weekly">Repeats Every Week</option>
                <option value="monthly">Repeats Monthly (Same day of month)</option>
                <option value="annually">Repeats Annually (Anniversaries & Birthdays)</option>
              </select>

              <!-- Dynamic recurrence explanation helper -->
              <div id="recurrence-helper-hint" class="recurrence-hint-box" style="display: none;"></div>

              <div id="weekly-days-group" class="weekly-days-picker" style="display: none;">
                <span class="picker-hint">Repeat on:</span>
                <div class="day-check-buttons">
                  ${WEEKDAYS.map(w => `
                    <button type="button" class="btn-weekday-toggle" data-recur-day="${w.iso}">
                      ${w.short}
                    </button>
                  `).join('')}
                </div>
              </div>

              <div id="recurrence-end-group" class="recurrence-end-picker" style="display: none; margin-top: 10px;">
                <label for="event-input-recur-end" class="form-label">Repeat until (Optional)</label>
                <input type="date" id="event-input-recur-end" class="form-input" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" data-close-dialog="planner-event-dialog">Cancel</button>
            <button type="submit" class="btn-save">Save Event</button>
          </div>
        </form>
      </dialog>
    `;
  }

  // Weekly Routine Sleep Defaults Modal
  function renderDefaultsDialog() {
    return `
      <dialog id="planner-defaults-dialog" class="planner-modal modal-wide" closedby="any" aria-labelledby="defaults-dialog-title">
        <form id="form-planner-defaults" method="dialog" class="planner-modal-content">
          <div class="modal-header">
            <div>
              <h3 id="defaults-dialog-title" class="modal-title">Weekly Sleep & Alarm Template</h3>
              <p class="modal-subtitle">Define your standard Mon–Sun routine. Days without custom overrides automatically follow this.</p>
            </div>
            <button type="button" class="modal-close-btn" data-close-dialog="planner-defaults-dialog">✕</button>
          </div>

          <div class="modal-body defaults-table-body">
            ${WEEKDAYS.map(w => {
              const def = sleepDefaults.find(d => Number(d.day_of_week) === w.iso) || DEFAULT_SLEEP_TEMPLATE[w.iso - 1];
              const loc = def.sleep_location || 'my_place';
              const hasSep = Boolean(def.my_wake_time || def.her_wake_time);

              return `
                <div class="defaults-day-row" data-weekday="${w.iso}">
                  <div class="defaults-day-label">
                    <span class="day-full">${w.full}</span>
                  </div>

                  <div class="defaults-location-select">
                    <select class="form-select select-def-loc" data-day="${w.iso}">
                      <option value="my_place" ${loc === 'my_place' ? 'selected' : ''}>🏠 My Place</option>
                      <option value="her_place" ${loc === 'her_place' ? 'selected' : ''}>🏡 Her Place</option>
                      <option value="apart" ${loc === 'apart' ? 'selected' : ''}>↔️ Apart</option>
                      <option value="away" ${loc === 'away' ? 'selected' : ''}>✈️ Away / Trip</option>
                    </select>
                  </div>

                  <div class="defaults-time-inputs">
                    <label class="time-sublabel">
                      <span>Bedtime</span>
                      <input type="time" class="form-input input-def-bed" data-day="${w.iso}" value="${(def.bedtime || '23:00').slice(0, 5)}" />
                    </label>

                    <label class="time-sublabel">
                      <span>Alarm</span>
                      <input type="time" class="form-input input-def-wake" data-day="${w.iso}" value="${(def.wake_time || '07:30').slice(0, 5)}" />
                    </label>
                  </div>

                  <div class="defaults-separate-toggle">
                    <label class="checkbox-label">
                      <input type="checkbox" class="check-def-sep" data-day="${w.iso}" ${hasSep ? 'checked' : ''} />
                      <span>Separate Alarms</span>
                    </label>
                    <div class="sep-times-subgroup" id="sep-group-${w.iso}" style="display: ${hasSep ? 'flex' : 'none'};">
                      <label class="time-sublabel">
                        <span class="text-green">🌱 Andi</span>
                        <input type="time" class="form-input input-def-my-wake" data-day="${w.iso}" value="${(def.my_wake_time || def.wake_time || '07:30').slice(0, 5)}" />
                      </label>
                      <label class="time-sublabel">
                        <span class="text-blue">🌊 Núria</span>
                        <input type="time" class="form-input input-def-her-wake" data-day="${w.iso}" value="${(def.her_wake_time || def.wake_time || '07:30').slice(0, 5)}" />
                      </label>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" data-close-dialog="planner-defaults-dialog">Cancel</button>
            <button type="submit" class="btn-save">Save Weekly Template</button>
          </div>
        </form>
      </dialog>
    `;
  }

  // Day Sleep Override Modal
  function renderDayOverrideDialog() {
    return `
      <dialog id="planner-day-override-dialog" class="planner-modal" closedby="any" aria-labelledby="override-dialog-title">
        <form id="form-planner-day-override" method="dialog" class="planner-modal-content">
          <div class="modal-header">
            <div>
              <h3 id="override-dialog-title" class="modal-title">Sleep & Alarm Override</h3>
              <p id="override-dialog-date" class="modal-subtitle">Friday, Oct 16, 2026</p>
            </div>
            <button type="button" class="modal-close-btn" data-close-dialog="planner-day-override-dialog">✕</button>
          </div>

          <div class="modal-body">
            <!-- Sleep Location -->
            <div class="form-group">
              <label class="form-label">Where are we sleeping tonight?</label>
              <div class="sleep-override-loc-pills">
                ${Object.values(SLEEP_LOCATIONS).map(loc => `
                  <button type="button" class="btn-override-loc-pill" data-override-loc="${loc.key}">
                    <span class="loc-icon">${loc.icon}</span>
                    <span>${loc.label}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Custom Location Note -->
            <div class="form-group">
              <label for="override-input-note" class="form-label">Location Note (e.g., hotel name or traveling note)</label>
              <input type="text" id="override-input-note" class="form-input" placeholder="e.g. Hotel Arts Barcelona, Cabin retreat" />
            </div>

            <!-- Bedtime & Alarm Times -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label for="override-input-bedtime" class="form-label">Target Bedtime</label>
                <input type="time" id="override-input-bedtime" class="form-input" value="23:00" />
              </div>

              <div class="form-group flex-1" id="override-single-alarm-group">
                <label for="override-input-waketime" class="form-label">Morning Alarm</label>
                <input type="time" id="override-input-waketime" class="form-input" value="07:30" />
              </div>
            </div>

            <!-- Separate Alarms Toggle -->
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="override-check-separate-alarms" />
                <span>Separate Alarms for Andi & Núria</span>
              </label>

              <div class="form-row" id="override-separate-alarms-row" style="display: none; margin-top: 10px;">
                <div class="form-group flex-1">
                  <label for="override-input-my-alarm" class="form-label text-green">🌱 Andi Alarm</label>
                  <input type="time" id="override-input-my-alarm" class="form-input" />
                </div>

                <div class="form-group flex-1">
                  <label for="override-input-her-alarm" class="form-label text-blue">🌊 Núria Alarm</label>
                  <input type="time" id="override-input-her-alarm" class="form-input" />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" id="btn-reset-day-override" class="btn-danger-subtle">Reset to Default</button>
            <div class="footer-right-buttons">
              <button type="button" class="btn-cancel" data-close-dialog="planner-day-override-dialog">Cancel</button>
              <button type="submit" class="btn-save">Save Override</button>
            </div>
          </div>
        </form>
      </dialog>
    `;
  }

  // Partner Status Note Dialog
  function renderStatusDialog() {
    return `
      <dialog id="planner-status-dialog" class="planner-modal" closedby="any" aria-labelledby="status-dialog-title">
        <form id="form-planner-status" method="dialog" class="planner-modal-content">
          <div class="modal-header">
            <div>
              <h3 id="status-dialog-title" class="modal-title">Partner Heads-Up Note</h3>
              <p id="status-dialog-subtitle" class="modal-subtitle">Quick status update</p>
            </div>
            <button type="button" class="modal-close-btn" data-close-dialog="planner-status-dialog">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label for="status-input-text" class="form-label">Today's Heads-Up Note</label>
              <input type="text" id="status-input-text" class="form-input" placeholder="e.g. WFH today, Long day at uni, Free after 5pm" maxlength="80" required />
            </div>

            <!-- Quick Suggestions -->
            <div class="status-suggestions">
              <span class="sugg-hint">Quick tap:</span>
              <div class="sugg-pills">
                <button type="button" class="btn-sugg" data-sugg="WFH today 💻">WFH today 💻</button>
                <button type="button" class="btn-sugg" data-sugg="Office day 🏢">Office day 🏢</button>
                <button type="button" class="btn-sugg" data-sugg="Late meeting • home by 8pm">Late meeting • 8pm</button>
                <button type="button" class="btn-sugg" data-sugg="Free after 5pm ✨">Free after 5pm ✨</button>
                <button type="button" class="btn-sugg" data-sugg="Gym after work 🧗">Gym after work 🧗</button>
                <button type="button" class="btn-sugg" data-sugg="Don't wait for dinner 🍽️">Don't wait for dinner</button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" id="btn-clear-status" class="btn-danger-subtle">Clear Status</button>
            <div class="footer-right-buttons">
              <button type="button" class="btn-cancel" data-close-dialog="planner-status-dialog">Cancel</button>
              <button type="submit" class="btn-save">Save Note</button>
            </div>
          </div>
        </form>
      </dialog>
    `;
  }

  // 1-Way Google Calendar Sync Modal
  function renderSyncDialog(icsFeedUrl, webcalFeedUrl, gcalSubscribeUrl) {
    return `
      <dialog id="planner-sync-dialog" class="planner-modal" closedby="any" aria-labelledby="sync-dialog-title">
        <div class="planner-modal-content">
          <div class="modal-header">
            <div>
              <h3 id="sync-dialog-title" class="modal-title">Google Calendar 1-Way Sync</h3>
              <p class="modal-subtitle">Strict Outbound Subscription</p>
            </div>
            <button type="button" class="modal-close-btn" data-close-dialog="planner-sync-dialog">✕</button>
          </div>

          <div class="modal-body">
            <div class="sync-guardrail-banner">
              <span class="guardrail-icon">🔒</span>
              <p><strong>Strictly One-Way Outbound Sync:</strong> AndiNú publishes your couple schedule to Google Calendar. We <strong>NEVER</strong> read, pull, or access your personal calendar entries.</p>
            </div>

            <!-- 1-Click Subscribe -->
            <div class="sync-action-box">
              <a href="${gcalSubscribeUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary-sync">
                <span>📅 1-Click Subscribe in Google Calendar</span>
              </a>
              <p class="sync-box-hint">Google Calendar will automatically sync events, sleep locations, and bedtime alarms.</p>
            </div>

            <!-- Copyable Feed URLs -->
            <div class="sync-url-box">
              <label class="form-label">Live Calendar Feed URL (iCal / Webcal)</label>
              <div class="copy-url-row">
                <input type="text" id="sync-input-webcal" class="form-input readonly-input" value="${webcalFeedUrl}" readonly />
                <button type="button" class="btn-copy-url" data-copy-target="sync-input-webcal">Copy</button>
              </div>
            </div>

            <div class="sync-url-box">
              <label class="form-label">HTTPS iCal URL (Alternative)</label>
              <div class="copy-url-row">
                <input type="text" id="sync-input-https" class="form-input readonly-input" value="${icsFeedUrl}" readonly />
                <button type="button" class="btn-copy-url" data-copy-target="sync-input-https">Copy</button>
              </div>
            </div>

            <!-- Download Button -->
            <div class="sync-download-row">
              <button type="button" id="btn-download-ics-direct" class="btn-secondary-sync">
                <span>⬇️ Download .ics File Directly</span>
              </button>
            </div>

            <!-- Setup Instructions -->
            <div class="sync-instructions-accordion">
              <details>
                <summary>How to add to Google Calendar manually</summary>
                <ol>
                  <li>Open <a href="https://calendar.google.com" target="_blank" rel="noopener">Google Calendar on desktop</a>.</li>
                  <li>On the left sidebar, next to <strong>"Other calendars"</strong>, click <strong>+</strong> then <strong>"From URL"</strong>.</li>
                  <li>Paste the copied URL above and click <strong>"Add calendar"</strong>.</li>
                </ol>
              </details>

              <details>
                <summary>How to add to Apple Calendar (iPhone, Mac)</summary>
                <ol>
                  <li>On iPhone: Go to <strong>Settings</strong> > <strong>Calendar</strong> > <strong>Accounts</strong> > <strong>Add Account</strong> > <strong>Other</strong> > <strong>Add Subscribed Calendar</strong>.</li>
                  <li>Paste the copied URL and tap <strong>Next</strong>.</li>
                </ol>
              </details>
            </div>

            <div class="sync-danger-zone">
              <button type="button" id="btn-regen-token" class="btn-danger-subtle">
                <span>🔄 Regenerate Secret Feed URL</span>
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" data-close-dialog="planner-sync-dialog">Done</button>
          </div>
        </div>
      </dialog>
    `;
  }

  // Phone Alarm Helper Modal
  function renderAlarmDialog(feedToken) {
    const todayStr = formatDateISO(new Date());
    const sleep = resolveDaySleepPlan(todayStr, dayPlans, sleepDefaults);
    const origin = window.location.origin;

    const meAlarmUrl = `${origin}/api/planner/alarm?user=me&token=${feedToken}`;
    const herAlarmUrl = `${origin}/api/planner/alarm?user=her&token=${feedToken}`;

    return `
      <dialog id="planner-alarm-dialog" class="planner-modal" closedby="any" aria-labelledby="alarm-dialog-title">
        <div class="planner-modal-content">
          <div class="modal-header">
            <div>
              <h3 id="alarm-dialog-title" class="modal-title">Tonight's Alarm Automation</h3>
              <p class="modal-subtitle">Automatic alarm sync for iOS Shortcuts & Android Routines</p>
            </div>
            <button type="button" class="modal-close-btn" data-close-dialog="planner-alarm-dialog">✕</button>
          </div>

          <div class="modal-body">
            <!-- Tonight's Summary -->
            <div class="alarm-summary-card">
              <div class="summary-line">
                <span class="summary-label">Tonight's Sleep Location:</span>
                <span class="summary-val">${sleep.locationMeta.icon} ${sleep.locationMeta.label}</span>
              </div>
              <div class="summary-line">
                <span class="summary-label">Target Bedtime:</span>
                <span class="summary-val">🌙 ${sleep.bedtime}</span>
              </div>
              <div class="summary-line">
                <span class="summary-label">Morning Alarm:</span>
                <span class="summary-val">⏰ ${sleep.wakeTime}</span>
              </div>
              ${sleep.hasSeparateAlarms ? `
                <div class="summary-separate-line">
                  <span class="text-green">🌱 Andi: ${sleep.myWakeTime || sleep.wakeTime}</span>
                  <span class="text-blue">🌊 Núria: ${sleep.herWakeTime || sleep.wakeTime}</span>
                </div>
              ` : ''}
            </div>

            <!-- Shortcut API URLs -->
            <div class="form-group">
              <label class="form-label">Andino's Alarm Endpoint (JSON):</label>
              <div class="copy-url-row">
                <input type="text" id="alarm-url-me" class="form-input readonly-input" value="${meAlarmUrl}" readonly />
                <button type="button" class="btn-copy-url" data-copy-target="alarm-url-me">Copy</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Núria's Alarm Endpoint (JSON):</label>
              <div class="copy-url-row">
                <input type="text" id="alarm-url-her" class="form-input readonly-input" value="${herAlarmUrl}" readonly />
                <button type="button" class="btn-copy-url" data-copy-target="alarm-url-her">Copy</button>
              </div>
            </div>

            <!-- iOS Shortcuts Tip -->
            <div class="alarm-instructions-box">
              <h4>📱 How to automate on iPhone:</h4>
              <p>In the Apple <strong>Shortcuts</strong> app, create a personal automation triggered every night at 22:00 that runs:</p>
              <code>Get Contents of URL &gt; Parse JSON &gt; Set Alarm for wake_time</code>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" data-close-dialog="planner-alarm-dialog">Close</button>
          </div>
        </div>
      </dialog>
    `;
  }

  // Delete Recurring Event Confirmation Dialog
  function renderDeleteRecurringDialog() {
    return `
      <dialog id="planner-delete-recurring-dialog" class="planner-modal" closedby="any" aria-labelledby="del-recur-title">
        <div class="planner-modal-content">
          <div class="modal-header">
            <h3 id="del-recur-title" class="modal-title">Delete Recurring Event</h3>
            <button type="button" class="modal-close-btn" data-close-dialog="planner-delete-recurring-dialog">✕</button>
          </div>

          <div class="modal-body">
            <p>This is a recurring event. Would you like to delete only this specific day's occurrence, or stop all future occurrences?</p>
          </div>

          <div class="modal-footer flex-col">
            <button type="button" id="btn-delete-only-this-day" class="btn-modal-action">
              <span>Delete only this day</span>
            </button>
            <button type="button" id="btn-delete-all-future" class="btn-modal-action btn-danger-action">
              <span>Delete all future occurrences</span>
            </button>
            <button type="button" class="btn-cancel" data-close-dialog="planner-delete-recurring-dialog">Cancel</button>
          </div>
        </div>
      </dialog>
    `;
  }

  // Event Listeners & Interactions
  function bindEvents() {
    // 1. Week Navigation
    document.getElementById('btn-prev-week')?.addEventListener('click', () => {
      const prev = new Date(currentMonday);
      prev.setDate(prev.getDate() - 7);
      currentMonday = prev;
      render();
    });

    document.getElementById('btn-next-week')?.addEventListener('click', () => {
      const next = new Date(currentMonday);
      next.setDate(next.getDate() + 7);
      currentMonday = next;
      render();
    });

    document.getElementById('btn-this-week')?.addEventListener('click', () => {
      currentMonday = getMondayOfWeek(new Date());
      render();
    });

    // 2. Mobile Day Pill Strip Click -> Scroll smoothly to day card
    document.querySelectorAll('[data-jump-day]').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const isoDate = pill.getAttribute('data-jump-day');
        const card = document.getElementById(`day-card-${isoDate}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        document.querySelectorAll('.planner-day-pill').forEach(p => p.classList.remove('selected-pill'));
        pill.classList.add('selected-pill');
      });
    });

    // 3. 1-Tap Sleep Location Selector buttons
    document.querySelectorAll('[data-set-sleep-loc]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const locKey = btn.getAttribute('data-set-sleep-loc');
        const isoDate = btn.getAttribute('data-for-date');
        if (locKey && isoDate) {
          await saveDayOverride(isoDate, { sleep_location: locKey });
        }
      });
    });

    // 4. Quick Add Event buttons
    document.querySelectorAll('[data-add-for-date]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isoDate = btn.getAttribute('data-add-for-date');
        openEventModalForDate(isoDate);
      });
    });

    document.getElementById('btn-add-event')?.addEventListener('click', () => {
      openEventModalForDate(formatDateISO(new Date()));
    });

    // 5. Edit Event buttons
    document.querySelectorAll('[data-edit-event]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = btn.getAttribute('data-edit-event');
        const ev = events.find(item => item.id === eventId);
        if (ev) {
          openEventModalForEdit(ev);
        }
      });
    });

    // 6. Delete Event buttons
    document.querySelectorAll('[data-delete-event]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = btn.getAttribute('data-delete-event');
        const instanceDate = btn.getAttribute('data-instance-date');
        const isRecurring = btn.getAttribute('data-is-recurring') === 'true';

        if (isRecurring) {
          pendingDeleteRecurring = { eventId, instanceDate };
          openDialog('planner-delete-recurring-dialog');
        } else {
          if (confirm('Delete this event?')) {
            deleteEvent(eventId);
          }
        }
      });
    });

    // 7. Recurring Event Deletion Actions
    document.getElementById('btn-delete-only-this-day')?.addEventListener('click', () => {
      if (pendingDeleteRecurring) {
        excludeDateFromRecurring(pendingDeleteRecurring.eventId, pendingDeleteRecurring.instanceDate);
        closeDialog('planner-delete-recurring-dialog');
        pendingDeleteRecurring = null;
      }
    });

    document.getElementById('btn-delete-all-future')?.addEventListener('click', () => {
      if (pendingDeleteRecurring) {
        stopRecurringFuture(pendingDeleteRecurring.eventId, pendingDeleteRecurring.instanceDate);
        closeDialog('planner-delete-recurring-dialog');
        pendingDeleteRecurring = null;
      }
    });

    // 8. Sleep Edit button -> Day Sleep Override Modal
    document.querySelectorAll('[data-edit-sleep-plan]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isoDate = btn.getAttribute('data-edit-sleep-plan');
        openDayOverrideModal(isoDate);
      });
    });

    // 9. Partner Status Note buttons
    document.querySelectorAll('[data-edit-status]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const date = btn.getAttribute('data-edit-status');
        const partner = btn.getAttribute('data-partner');
        openStatusModal(date, partner);
      });
    });

    // 10. Alarm Dialog Openers
    document.querySelectorAll('[data-trigger-alarm]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDialog('planner-alarm-dialog');
      });
    });

    document.getElementById('btn-open-alarm-help')?.addEventListener('click', () => {
      openDialog('planner-alarm-dialog');
    });

    // 11. Routine Defaults Openers
    document.getElementById('btn-open-defaults')?.addEventListener('click', () => {
      openDialog('planner-defaults-dialog');
    });

    // 12. Google Calendar Sync Modal Opener
    document.getElementById('btn-open-sync')?.addEventListener('click', () => {
      openDialog('planner-sync-dialog');
    });

    // 13. Copy URL buttons
    document.querySelectorAll('[data-copy-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inputId = btn.getAttribute('data-copy-target');
        const input = document.getElementById(inputId);
        if (input) {
          input.select();
          navigator.clipboard.writeText(input.value);
          const origText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = origText; }, 2000);
        }
      });
    });

    // 14. Direct .ics Download Button
    document.getElementById('btn-download-ics-direct')?.addEventListener('click', () => {
      const ics = generateIcsContent({
        events,
        dayPlans,
        sleepDefaults,
        settings
      });
      downloadIcsFile('andinu-planner.ics', ics);
    });

    // 15. Regenerate Feed Token
    document.getElementById('btn-regen-token')?.addEventListener('click', () => {
      if (confirm('Regenerating your feed URL will invalidate existing subscriptions in Google Calendar. Continue?')) {
        regenerateToken();
      }
    });

    // 16. Modal Close Buttons & Backdrop Click Fallback
    document.querySelectorAll('[data-close-dialog]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dialogId = btn.getAttribute('data-close-dialog');
        closeDialog(dialogId);
      });
    });

    setupDialogBackdropFallback('planner-event-dialog');
    setupDialogBackdropFallback('planner-defaults-dialog');
    setupDialogBackdropFallback('planner-day-override-dialog');
    setupDialogBackdropFallback('planner-status-dialog');
    setupDialogBackdropFallback('planner-sync-dialog');
    setupDialogBackdropFallback('planner-alarm-dialog');
    setupDialogBackdropFallback('planner-delete-recurring-dialog');

    // 17. Form Submissions
    bindEventForm();
    bindDefaultsForm();
    bindOverrideForm();
    bindStatusForm();
  }

  // Dialog Helper Functions with Modern Native <dialog> + Safari Fallback
  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  function closeDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    }
  }

  function setupDialogBackdropFallback(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) {
          dialog.close();
        }
      });
    }
  }

  function getOrdinalSuffix(n) {
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  function updateRecurrenceUI() {
    const recurSelect = document.getElementById('event-input-recurrence');
    const weeklyGroup = document.getElementById('weekly-days-group');
    const recurEndGroup = document.getElementById('recurrence-end-group');
    const hintBox = document.getElementById('recurrence-helper-hint');
    const dateVal = document.getElementById('event-input-date')?.value;
    if (!recurSelect) return;

    const val = recurSelect.value;
    const isRecurring = val !== 'none';

    if (weeklyGroup) weeklyGroup.style.display = val === 'weekly' ? 'block' : 'none';
    if (recurEndGroup) recurEndGroup.style.display = isRecurring ? 'block' : 'none';

    if (hintBox) {
      if (val === 'none') {
        hintBox.style.display = 'none';
        hintBox.textContent = '';
      } else if (val === 'weekly') {
        hintBox.style.display = 'block';
        hintBox.innerHTML = '✨ <strong>Weekly:</strong> Repeats on the selected days every week.';
      } else if (val === 'monthly') {
        hintBox.style.display = 'block';
        let dayOfMonth = 'this day';
        if (dateVal) {
          const d = parseDateISO(dateVal);
          dayOfMonth = `the ${d.getDate()}${getOrdinalSuffix(d.getDate())}`;
        }
        hintBox.innerHTML = `📅 <strong>Monthly:</strong> Repeats on ${dayOfMonth} of every month.`;
      } else if (val === 'annually') {
        hintBox.style.display = 'block';
        let dateText = 'this date';
        if (dateVal) {
          const d = parseDateISO(dateVal);
          dateText = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        hintBox.innerHTML = `🎉 <strong>Annual / Anniversary:</strong> Repeats every year on ${dateText}. Ideal for anniversaries, birthdays & annual traditions.`;
      }
    }
  }

  // Event Modal Setup & Binding
  function openEventModalForDate(isoDate) {
    editingEvent = null;
    targetDayForNewEvent = isoDate;

    const titleEl = document.getElementById('event-dialog-title');
    if (titleEl) titleEl.textContent = 'Add Event';

    const inputTitle = document.getElementById('event-input-title');
    if (inputTitle) inputTitle.value = '';

    const inputDate = document.getElementById('event-input-date');
    if (inputDate) inputDate.value = isoDate;

    const inputAllDay = document.getElementById('event-input-allday');
    if (inputAllDay) inputAllDay.checked = false;

    const timeRow = document.getElementById('time-inputs-row');
    if (timeRow) timeRow.style.display = 'flex';

    const inputStart = document.getElementById('event-input-start');
    if (inputStart) inputStart.value = '18:30';

    const inputEnd = document.getElementById('event-input-end');
    if (inputEnd) inputEnd.value = '20:00';

    const inputLoc = document.getElementById('event-input-location');
    if (inputLoc) inputLoc.value = '';

    const inputNotes = document.getElementById('event-input-notes');
    if (inputNotes) inputNotes.value = '';

    const inputRecur = document.getElementById('event-input-recurrence');
    if (inputRecur) inputRecur.value = 'none';

    const inputRecurEnd = document.getElementById('event-input-recur-end');
    if (inputRecurEnd) inputRecurEnd.value = '';

    document.querySelectorAll('.btn-weekday-toggle').forEach(b => b.classList.remove('active'));

    const radioTogether = document.querySelector('input[name="event-owner"][value="together"]');
    if (radioTogether) radioTogether.checked = true;

    updateRecurrenceUI();
    openDialog('planner-event-dialog');
  }

  function openEventModalForEdit(ev) {
    editingEvent = ev;

    const titleEl = document.getElementById('event-dialog-title');
    if (titleEl) titleEl.textContent = 'Edit Event';

    const inputTitle = document.getElementById('event-input-title');
    if (inputTitle) inputTitle.value = ev.title || '';

    const inputDate = document.getElementById('event-input-date');
    if (inputDate) inputDate.value = ev.event_date;

    const inputAllDay = document.getElementById('event-input-allday');
    if (inputAllDay) inputAllDay.checked = Boolean(ev.is_all_day);

    const timeRow = document.getElementById('time-inputs-row');
    if (timeRow) timeRow.style.display = ev.is_all_day ? 'none' : 'flex';

    const inputStart = document.getElementById('event-input-start');
    if (inputStart) inputStart.value = (ev.start_time || '18:30').slice(0, 5);

    const inputEnd = document.getElementById('event-input-end');
    if (inputEnd) inputEnd.value = (ev.end_time || '20:00').slice(0, 5);

    const inputLoc = document.getElementById('event-input-location');
    if (inputLoc) inputLoc.value = ev.location || '';

    const inputNotes = document.getElementById('event-input-notes');
    if (inputNotes) inputNotes.value = ev.notes || '';

    const inputRecur = document.getElementById('event-input-recurrence');
    if (inputRecur) inputRecur.value = ev.recurrence_type || 'none';

    document.querySelectorAll('.btn-weekday-toggle').forEach(b => {
      const dayNum = Number(b.getAttribute('data-recur-day'));
      if (Array.isArray(ev.recurrence_days) && ev.recurrence_days.includes(dayNum)) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const inputRecurEnd = document.getElementById('event-input-recur-end');
    if (inputRecurEnd) inputRecurEnd.value = ev.recurrence_end_date || '';

    const ownerRadio = document.querySelector(`input[name="event-owner"][value="${ev.owner_type || 'together'}"]`);
    if (ownerRadio) ownerRadio.checked = true;

    updateRecurrenceUI();
    openDialog('planner-event-dialog');
  }

  function bindEventForm() {
    const form = document.getElementById('form-planner-event');
    if (!form) return;

    // Toggle all-day
    const checkAllDay = document.getElementById('event-input-allday');
    const timeRow = document.getElementById('time-inputs-row');
    checkAllDay?.addEventListener('change', () => {
      if (timeRow) timeRow.style.display = checkAllDay.checked ? 'none' : 'flex';
    });

    // Toggle recurrence select and date change
    const recurSelect = document.getElementById('event-input-recurrence');
    const dateInput = document.getElementById('event-input-date');
    recurSelect?.addEventListener('change', () => {
      updateRecurrenceUI();
      if (recurSelect.value === 'weekly') {
        const hasAny = document.querySelector('.btn-weekday-toggle.active');
        if (!hasAny) {
          const dateVal = dateInput?.value;
          if (dateVal) {
            const d = parseDateISO(dateVal).getDay();
            const isoD = d === 0 ? 7 : d;
            document.querySelector(`.btn-weekday-toggle[data-recur-day="${isoD}"]`)?.classList.add('active');
          }
        }
      }
    });

    dateInput?.addEventListener('change', () => {
      updateRecurrenceUI();
    });

    // Weekday toggle buttons
    document.querySelectorAll('.btn-weekday-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.classList.toggle('active');
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('event-input-title')?.value.trim();
      const ownerType = document.querySelector('input[name="event-owner"]:checked')?.value || 'together';
      const eventDate = document.getElementById('event-input-date')?.value;
      const isAllDay = document.getElementById('event-input-allday')?.checked || false;
      const startTime = isAllDay ? null : (document.getElementById('event-input-start')?.value || '18:30');
      const endTime = isAllDay ? null : (document.getElementById('event-input-end')?.value || '20:00');
      const location = document.getElementById('event-input-location')?.value.trim();
      const notes = document.getElementById('event-input-notes')?.value.trim();
      const recurrenceType = document.getElementById('event-input-recurrence')?.value || 'none';

      let recurrenceDays = [];
      let recurrenceEndDate = null;
      if (recurrenceType === 'weekly') {
        document.querySelectorAll('.btn-weekday-toggle.active').forEach(b => {
          recurrenceDays.push(Number(b.getAttribute('data-recur-day')));
        });
      }
      if (recurrenceType !== 'none') {
        const recurEndVal = document.getElementById('event-input-recur-end')?.value;
        if (recurEndVal) recurrenceEndDate = recurEndVal;
      }

      const eventData = {
        id: editingEvent?.id,
        title,
        owner_type: ownerType,
        event_date: eventDate,
        is_all_day: isAllDay,
        start_time: startTime,
        end_time: endTime,
        location,
        notes,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceDays,
        recurrence_end_date: recurrenceEndDate,
        excluded_dates: editingEvent?.excluded_dates || []
      };

      await saveEvent(eventData);
      closeDialog('planner-event-dialog');
    });
  }

  // Defaults Form Binding
  function bindDefaultsForm() {
    const form = document.getElementById('form-planner-defaults');
    if (!form) return;

    // Toggle separate alarms checkboxes in defaults
    document.querySelectorAll('.check-def-sep').forEach(check => {
      check.addEventListener('change', () => {
        const day = check.getAttribute('data-day');
        const sepGroup = document.getElementById(`sep-group-${day}`);
        if (sepGroup) sepGroup.style.display = check.checked ? 'flex' : 'none';
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newDefaults = WEEKDAYS.map(w => {
        const loc = document.querySelector(`.select-def-loc[data-day="${w.iso}"]`)?.value || 'my_place';
        const bedtime = document.querySelector(`.input-def-bed[data-day="${w.iso}"]`)?.value || '23:00';
        const wakeTime = document.querySelector(`.input-def-wake[data-day="${w.iso}"]`)?.value || '07:30';
        const isSep = document.querySelector(`.check-def-sep[data-day="${w.iso}"]`)?.checked || false;

        let myWake = null;
        let herWake = null;
        if (isSep) {
          myWake = document.querySelector(`.input-def-my-wake[data-day="${w.iso}"]`)?.value || wakeTime;
          herWake = document.querySelector(`.input-def-her-wake[data-day="${w.iso}"]`)?.value || wakeTime;
        }

        const existing = sleepDefaults.find(d => Number(d.day_of_week) === w.iso);
        return {
          id: existing?.id || generateUUID(),
          household_id: settings.household_id,
          day_of_week: w.iso,
          sleep_location: loc,
          bedtime: bedtime + ':00',
          wake_time: wakeTime + ':00',
          my_wake_time: myWake ? myWake + ':00' : null,
          her_wake_time: herWake ? herWake + ':00' : null,
          updated_at: new Date().toISOString()
        };
      });

      await saveSleepDefaults(newDefaults);
      closeDialog('planner-defaults-dialog');
    });
  }

  // Day Override Modal Setup & Binding
  function openDayOverrideModal(isoDate) {
    editingDayPlan = isoDate;
    const plan = resolveDaySleepPlan(isoDate, dayPlans, sleepDefaults);
    const dateObj = parseDateISO(isoDate);

    const subTitle = document.getElementById('override-dialog-date');
    if (subTitle) {
      subTitle.textContent = `${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    // Set location buttons
    document.querySelectorAll('.btn-override-loc-pill').forEach(btn => {
      const key = btn.getAttribute('data-override-loc');
      if (key === plan.locationKey) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });

    const noteInput = document.getElementById('override-input-note');
    if (noteInput) noteInput.value = plan.locationNote || '';

    const bedInput = document.getElementById('override-input-bedtime');
    if (bedInput) bedInput.value = plan.bedtime;

    const wakeInput = document.getElementById('override-input-waketime');
    if (wakeInput) wakeInput.value = plan.wakeTime;

    const checkSep = document.getElementById('override-check-separate-alarms');
    const sepRow = document.getElementById('override-separate-alarms-row');
    const singleAlarmGroup = document.getElementById('override-single-alarm-group');
    if (checkSep) {
      checkSep.checked = plan.hasSeparateAlarms;
      if (sepRow) sepRow.style.display = plan.hasSeparateAlarms ? 'flex' : 'none';
      if (singleAlarmGroup) singleAlarmGroup.style.display = plan.hasSeparateAlarms ? 'none' : 'block';
    }

    const myAlarmInput = document.getElementById('override-input-my-alarm');
    if (myAlarmInput) myAlarmInput.value = plan.myWakeTime || plan.wakeTime;

    const herAlarmInput = document.getElementById('override-input-her-alarm');
    if (herAlarmInput) herAlarmInput.value = plan.herWakeTime || plan.wakeTime;

    openDialog('planner-day-override-dialog');
  }

  function bindOverrideForm() {
    const form = document.getElementById('form-planner-day-override');
    if (!form) return;

    // Location pills
    document.querySelectorAll('.btn-override-loc-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-override-loc-pill').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Separate alarms checkbox
    const checkSep = document.getElementById('override-check-separate-alarms');
    const sepRow = document.getElementById('override-separate-alarms-row');
    const singleAlarmGroup = document.getElementById('override-single-alarm-group');
    checkSep?.addEventListener('change', () => {
      if (sepRow) sepRow.style.display = checkSep.checked ? 'flex' : 'none';
      if (singleAlarmGroup) singleAlarmGroup.style.display = checkSep.checked ? 'none' : 'block';
    });

    // Reset button
    document.getElementById('btn-reset-day-override')?.addEventListener('click', async () => {
      if (editingDayPlan) {
        await resetDayOverride(editingDayPlan);
        closeDialog('planner-day-override-dialog');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!editingDayPlan) return;

      const selectedLoc = document.querySelector('.btn-override-loc-pill.selected')?.getAttribute('data-override-loc') || 'my_place';
      const locNote = document.getElementById('override-input-note')?.value.trim();
      const bedtime = document.getElementById('override-input-bedtime')?.value || '23:00';
      const wakeTime = document.getElementById('override-input-waketime')?.value || '07:30';
      const isSep = document.getElementById('override-check-separate-alarms')?.checked || false;

      let myWake = null;
      let herWake = null;
      if (isSep) {
        myWake = document.getElementById('override-input-my-alarm')?.value || wakeTime;
        herWake = document.getElementById('override-input-her-alarm')?.value || wakeTime;
      }

      await saveDayOverride(editingDayPlan, {
        sleep_location: selectedLoc,
        location_note: locNote,
        bedtime: bedtime + ':00',
        wake_time: wakeTime + ':00',
        my_wake_time: myWake ? myWake + ':00' : null,
        her_wake_time: herWake ? herWake + ':00' : null
      });

      closeDialog('planner-day-override-dialog');
    });
  }

  // Status Note Modal Setup & Binding
  function openStatusModal(date, partner) {
    statusEditTarget = { date, partner };
    const dateObj = parseDateISO(date);
    const plan = resolveDaySleepPlan(date, dayPlans, sleepDefaults);

    const partnerLabel = partner === 'me' ? 'Andi (Me)' : 'Núria (Her)';
    const title = document.getElementById('status-dialog-title');
    if (title) title.textContent = `${partnerLabel}'s Heads-Up Note`;

    const sub = document.getElementById('status-dialog-subtitle');
    if (sub) {
      sub.textContent = `${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
    }

    const input = document.getElementById('status-input-text');
    if (input) {
      input.value = partner === 'me' ? plan.myStatusNote : plan.herStatusNote;
      setTimeout(() => input.focus(), 100);
    }

    openDialog('planner-status-dialog');
  }

  function bindStatusForm() {
    const form = document.getElementById('form-planner-status');
    if (!form) return;

    // Quick suggestion buttons
    document.querySelectorAll('.btn-sugg').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-sugg');
        const input = document.getElementById('status-input-text');
        if (input && text) {
          input.value = text;
        }
      });
    });

    // Clear status button
    document.getElementById('btn-clear-status')?.addEventListener('click', async () => {
      if (!statusEditTarget.date) return;
      const field = statusEditTarget.partner === 'me' ? 'my_status_note' : 'her_status_note';
      await saveDayOverride(statusEditTarget.date, { [field]: null });
      closeDialog('planner-status-dialog');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!statusEditTarget.date) return;

      const text = document.getElementById('status-input-text')?.value.trim();
      const field = statusEditTarget.partner === 'me' ? 'my_status_note' : 'her_status_note';
      await saveDayOverride(statusEditTarget.date, { [field]: text || null });
      closeDialog('planner-status-dialog');
    });
  }

  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Load and Render
  await loadData();
  render();

  // Return unmount cleanup if needed
  return () => {};
}
