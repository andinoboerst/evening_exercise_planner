import { 
  getCurrentUser, 
  getActiveHousehold, 
  getHouseholdMembers, 
  inviteHouseholdMember, 
  signInWithGoogle,
  supabase, 
  isSupabaseConfigured 
} from '../services/supabase.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function mountDashboard(container, navigate) {
  const user = await getCurrentUser();
  const household = await getActiveHousehold();
  const members = await getHouseholdMembers(household?.id);

  // Get summary data: Tonight's planned meal, Recent list items, Latest quote & Tonight's sleep plan
  let tonightMeal = null;
  let recentListItems = [];
  let latestQuote = null;
  let tonightSleep = {
    icon: '🏠',
    label: 'My Place',
    desc: 'Sleeping together at Andi’s',
    bedtime: '23:00',
    wakeTime: '07:30'
  };
  let upcomingPlannerEvents = [
    { id: 'ev-1', title: 'Weekly Life & Meal Sync', timeLabel: '19:30', owner_type: 'together' }
  ];

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const jsDay = now.getDay();
  const isoDay = jsDay === 0 ? 7 : jsDay;

  if (isSupabaseConfigured && household?.id) {
    try {
      // Fetch today's meal plan day
      const today = new Date().getDay(); // 0 is Sun, 1 is Mon...
      const dayOfWeek = (today + 6) % 7;

      const { data: planDays } = await supabase
        .from('meal_plan_days')
        .select('*, recipes(*)')
        .eq('day_of_week', dayOfWeek)
        .limit(1);

      if (planDays && planDays.length > 0) {
        tonightMeal = planDays[0];
      }

      // Fetch recent list items
      const { data: listItems } = await supabase
        .from('list_items')
        .select('*, list_categories(name, icon)')
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(3);

      if (listItems) {
        recentListItems = listItems;
      }

      // Fetch latest quote
      const { data: quoteItems } = await supabase
        .from('household_quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (quoteItems && quoteItems.length > 0) {
        latestQuote = quoteItems[0];
      }

      // Fetch today's sleep plan & defaults
      const { data: dayPlanData } = await supabase
        .from('planner_day_plans')
        .select('*')
        .eq('household_id', household.id)
        .eq('plan_date', todayDateStr)
        .limit(1);

      const { data: defData } = await supabase
        .from('planner_sleep_defaults')
        .select('*')
        .eq('household_id', household.id)
        .eq('day_of_week', isoDay)
        .limit(1);

      const override = dayPlanData?.[0];
      const def = defData?.[0];

      const locKey = override?.sleep_location || def?.sleep_location || 'my_place';
      const locMap = {
        my_place: { icon: '🏠', label: 'My Place', desc: 'Together at Andi’s' },
        her_place: { icon: '🏡', label: 'Her Place', desc: 'Together at Núria’s' },
        apart: { icon: '↔️', label: 'Apart Tonight', desc: 'At our own homes' },
        away: { icon: '✈️', label: 'Away / Trip', desc: override?.location_note || 'Traveling' }
      };
      const locInfo = locMap[locKey] || locMap.my_place;

      tonightSleep = {
        icon: locInfo.icon,
        label: locInfo.label,
        desc: locInfo.desc,
        bedtime: (override?.bedtime || def?.bedtime || '23:00').slice(0, 5),
        wakeTime: (override?.wake_time || def?.wake_time || '07:30').slice(0, 5)
      };

      // Fetch today's planner events
      const { data: evData } = await supabase
        .from('planner_events')
        .select('*')
        .eq('household_id', household.id)
        .or(`event_date.eq.${todayDateStr},recurrence_type.eq.weekly`)
        .limit(6);

      if (evData && evData.length > 0) {
        const matches = [];
        for (const ev of evData) {
          if (ev.event_date === todayDateStr || (ev.recurrence_type === 'weekly' && Array.isArray(ev.recurrence_days) && ev.recurrence_days.includes(isoDay))) {
            let timeLabel = ev.is_all_day ? 'All day' : (ev.start_time ? ev.start_time.slice(0, 5) : '');
            matches.push({
              id: ev.id,
              title: ev.title,
              timeLabel,
              owner_type: ev.owner_type
            });
          }
        }
        if (matches.length > 0) {
          upcomingPlannerEvents = matches.slice(0, 3);
        }
      }
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    }
  } else {
    // Demo fallback data
    tonightMeal = {
      is_cooked: false,
      recipes: {
        title: 'Spaghetti Aglio, Olio e Peperoncino',
        prep_time_minutes: 15,
        tags: ['quick', 'pasta', 'comfort']
      }
    };
    recentListItems = [
      { id: 'm1', title: 'Perfect Days', is_completed: false, list_categories: { name: 'Movies', icon: '🎬' } },
      { id: 'm2', title: 'In Rainbows', is_completed: false, list_categories: { name: 'Vinyl', icon: '🎵' } },
      { id: 'm3', title: 'Kyoto & Kamakura', is_completed: false, list_categories: { name: 'Places', icon: '✈️' } }
    ];
    latestQuote = {
      id: 'q-demo',
      quote_text: "If we eat the cookies standing up by the pantry, the calories don't count.",
      author_speaker: 'Núria 💗',
      context_or_location: 'Pinned to the board',
      style_variant: 'sticky-yellow',
      magnet_icon: '📌'
    };
    tonightSleep = {
      icon: '🏠',
      label: 'My Place',
      desc: 'Together at Andi’s',
      bedtime: '23:00',
      wakeTime: '07:30'
    };
    upcomingPlannerEvents = [
      { id: 'e1', title: 'Weekly Life & Meal Sync', timeLabel: '19:30', owner_type: 'together' }
    ];
  }

  const partnerMember = members.find(m => m.email && m.email !== user?.email);

  container.innerHTML = `
    <div class="dashboard-shell">
      <!-- Top Welcome Banner -->
      <section class="dash-hero glass-panel">
        <div class="dash-hero-content">
          <div class="dash-logo-wrap">
            <img src="/AndiNu_icon.png" alt="AndiNú Logo" class="dash-logo-img" />
          </div>
          <div class="dash-hero-text">
            <div class="dash-names-pill">Andino & Núria</div>
            <h1 class="dash-title">AndiNú Hub</h1>
            <p class="dash-subtitle">Our Private Shared Space • <code>andinu.cc</code></p>
          </div>
        </div>

        <button id="btn-open-household-settings" class="btn-household-pill" title="Household & Partner Settings">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>${partnerMember ? 'Partner Linked' : 'Invite Partner'}</span>
        </button>
      </section>

      <!-- Three Core App Launch Cards -->
      <section class="dash-apps-grid">
        <!-- 1. Nighttime Routine -->
        <div class="app-launch-card card-routine glass-panel" data-nav="/routine">
          <div class="card-badge">Daily Habit</div>
          <div class="card-icon-wrap icon-routine">
            <span>🌙</span>
          </div>
          <div class="card-body">
            <h2 class="card-title">Nighttime Routine</h2>
            <p class="card-desc">A guided 30-minute mat routine for two: strength, stretching and a 5-minute wind-down, with voice and calm sound. Works on the TV too.</p>
          </div>
          <div class="card-footer">
            <span class="card-action-label">Start Tonight's Routine</span>
            <span class="card-arrow">→</span>
          </div>
        </div>

        <!-- 2. Meal Prep & Kitchen -->
        <div class="app-launch-card card-meals glass-panel" data-nav="/meals">
          <div class="card-badge">Kitchen Hub</div>
          <div class="card-icon-wrap icon-meals">
            <span>🍳</span>
          </div>
          <div class="card-body">
            <h2 class="card-title">Meal Prep & Kitchen</h2>
            <p class="card-desc">Pantry-optimized weekly meal planner, recipe library, and smart auto-sync shopping list.</p>
          </div>
          <div class="card-footer">
            <span class="card-action-label">Open Kitchen & Pantry</span>
            <span class="card-arrow">→</span>
          </div>
        </div>

        <!-- 3. Our Shared Lists -->
        <div class="app-launch-card card-lists glass-panel" data-nav="/lists">
          <div class="card-badge">Collections</div>
          <div class="card-icon-wrap icon-lists">
            <span>📝</span>
          </div>
          <div class="card-body">
            <h2 class="card-title">Our Shared Lists</h2>
            <p class="card-desc">Movies to watch, vinyl records to hunt for, travel spots, and custom checkbox wishlists.</p>
          </div>
          <div class="card-footer">
            <span class="card-action-label">View Our Lists</span>
            <span class="card-arrow">→</span>
          </div>
        </div>

        <!-- 4. Note Board -->
        <div class="app-launch-card card-quotes glass-panel" data-nav="/quotes">
          <div class="card-badge">Pinned Notes</div>
          <div class="card-icon-wrap icon-quotes">
            <span>📌</span>
          </div>
          <div class="card-body">
            <h2 class="card-title">Note Board</h2>
            <p class="card-desc">Funny phrases, sweet reminders, and things we say to each other.</p>
          </div>
          <div class="card-footer">
            <span class="card-action-label">Open Note Board</span>
            <span class="card-arrow">→</span>
          </div>
        </div>

        <!-- 5. Couples Life, Sleep & Schedule Planner -->
        <div class="app-launch-card card-planner glass-panel" data-nav="/planner">
          <div class="card-badge">Weekly Schedule</div>
          <div class="card-icon-wrap icon-planner">
            <span>📅</span>
          </div>
          <div class="card-body">
            <h2 class="card-title">Life & Sleep Planner</h2>
            <p class="card-desc">Where we sleep tonight, morning alarms, weekly shared events, and 1-way Google Calendar sync.</p>
          </div>
          <div class="card-footer">
            <span class="card-action-label">Open Weekly Planner</span>
            <span class="card-arrow">→</span>
          </div>
        </div>
      </section>

      <!-- Quick Summary Widgets -->
      <section class="dash-widgets-grid">
        <!-- Tonight's Sleep & Alarms Widget -->
        <div class="dash-widget glass-panel">
          <div class="widget-header">
            <div class="widget-title-wrap">
              <span class="widget-icon">🛏️</span>
              <h3 class="widget-title">Tonight's Sleep & Plan</h3>
            </div>
            <a href="/planner" class="widget-link" data-nav="/planner">Weekly Planner →</a>
          </div>

          <div class="widget-body">
            <div class="planner-dash-preview">
              <div class="planner-preview-sleep">
                <div class="planner-preview-loc">
                  <span class="loc-emoji">${tonightSleep.icon}</span>
                  <div>
                    <strong class="loc-name">${tonightSleep.label}</strong>
                    <span class="loc-desc">${tonightSleep.desc}</span>
                  </div>
                </div>
                <div class="planner-preview-times">
                  <span class="time-chip" title="Target Bedtime">🌙 Bed: ${tonightSleep.bedtime}</span>
                  <span class="time-chip" title="Morning Alarm">⏰ Alarm: ${tonightSleep.wakeTime}</span>
                </div>
              </div>
              ${upcomingPlannerEvents.length > 0 ? `
                <div class="planner-preview-events">
                  <span class="preview-events-header">Today's Schedule:</span>
                  ${upcomingPlannerEvents.map(e => `
                    <div class="planner-mini-event event-${e.owner_type}">
                      <span class="mini-event-dot"></span>
                      <span class="mini-event-title">${escapeHtml(e.title)}</span>
                      <span class="mini-event-time">${e.timeLabel}</span>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="planner-preview-note">
                  <span>✨ No other events today. Perfect evening to relax!</span>
                </div>
              `}
            </div>
          </div>
        </div>
        <!-- Tonight's Meal Widget -->
        <div class="dash-widget glass-panel">
          <div class="widget-header">
            <div class="widget-title-wrap">
              <span class="widget-icon">🍽️</span>
              <h3 class="widget-title">Tonight's Planned Meal</h3>
            </div>
            <a href="/meals" class="widget-link" data-nav="/meals">Meal Planner →</a>
          </div>

          <div class="widget-body">
            ${tonightMeal?.recipes ? `
              <div class="meal-preview-card">
                <div class="meal-preview-info">
                  <h4 class="meal-preview-title">${escapeHtml(tonightMeal.recipes.title)}</h4>
                  <div class="meal-preview-meta">
                    <span>⏱️ ${tonightMeal.recipes.prep_time_minutes || 20}m prep</span>
                    ${tonightMeal.recipes.tags?.length ? `<span>🏷️ ${tonightMeal.recipes.tags.slice(0, 2).map(escapeHtml).join(', ')}</span>` : ''}
                  </div>
                </div>
                <div class="meal-preview-status ${tonightMeal.is_cooked ? 'status-cooked' : 'status-planned'}">
                  ${tonightMeal.is_cooked ? '✓ Cooked' : 'Planned'}
                </div>
              </div>
            ` : `
              <div class="widget-empty">
                <p>No meal scheduled for tonight yet.</p>
                <button class="btn-secondary-sm" data-nav="/meals" style="margin-top: 8px;">Plan This Week's Dinners</button>
              </div>
            `}
          </div>
        </div>

        <!-- Recent Lists Widget -->
        <div class="dash-widget glass-panel">
          <div class="widget-header">
            <div class="widget-title-wrap">
              <span class="widget-icon">✨</span>
              <h3 class="widget-title">Recent List Items</h3>
            </div>
            <a href="/lists" class="widget-link" data-nav="/lists">All Lists →</a>
          </div>

          <div class="widget-body">
            ${recentListItems.length > 0 ? `
              <div class="recent-list-items">
                ${recentListItems.map(item => `
                  <div class="recent-item-row" data-id="${item.id}">
                    <span class="item-cat-icon">${item.list_categories?.icon || '📋'}</span>
                    <span class="item-title ${item.is_completed ? 'completed' : ''}">${escapeHtml(item.title)}</span>
                    <span class="item-cat-badge">${escapeHtml(item.list_categories?.name || 'List')}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="widget-empty">
                <p>No list items added yet.</p>
                <button class="btn-secondary-sm" data-nav="/lists" style="margin-top: 8px;">Add Items to Wishlist</button>
              </div>
            `}
          </div>
        </div>

        <!-- Note Board Widget -->
        <div class="dash-widget glass-panel">
          <div class="widget-header">
            <div class="widget-title-wrap">
              <span class="widget-icon">📌</span>
              <h3 class="widget-title">Pinned Note</h3>
            </div>
            <a href="/quotes" class="widget-link" data-nav="/quotes">Note Board →</a>
          </div>

          <div class="widget-body">
            ${latestQuote ? `
              <div class="dash-quote-preview ${latestQuote.style_variant || 'sticky-yellow'}">
                <span class="dash-quote-magnet">${latestQuote.magnet_icon || '📌'}</span>
                <p class="dash-quote-text">“${escapeHtml(latestQuote.quote_text)}”</p>
                <div class="dash-quote-meta">
                  <span class="dash-quote-author">— ${
                    (latestQuote.author_speaker || '').toLowerCase().includes('both') || ((latestQuote.author_speaker || '').toLowerCase().includes('andino') && (latestQuote.author_speaker || '').toLowerCase().includes('nuria'))
                      ? 'Both 👫'
                      : (latestQuote.author_speaker || '').toLowerCase().includes('núria') || (latestQuote.author_speaker || '').toLowerCase().includes('nuria')
                      ? 'Núria 💗'
                      : (latestQuote.author_speaker || '').toLowerCase().includes('andino') || (latestQuote.author_speaker || '').toLowerCase().includes('andi')
                      ? 'Andino 🧉'
                      : escapeHtml(latestQuote.author_speaker || 'Núria 💗')
                  }</span>
                  ${latestQuote.context_or_location ? `<span class="dash-quote-loc">📍 ${escapeHtml(latestQuote.context_or_location)}</span>` : ''}
                </div>
              </div>
            ` : `
              <div class="widget-empty">
                <p>No notes pinned yet.</p>
                <button class="btn-secondary-sm" data-nav="/quotes" style="margin-top: 8px;">Pin a Note</button>
              </div>
            `}
          </div>
        </div>
      </section>

      <!-- Dashboard Footer with Privacy Policy and Terms of Service -->
      <footer class="dash-footer">
        <div class="dash-footer-links">
          <a href="/pp" data-nav="/pp">Privacy Policy</a> • 
          <a href="/tos" data-nav="/tos">Terms of Service</a>
        </div>
        <p class="dash-footer-copy">© 2026 AndiNú (Andino & Núria) • andinu.cc</p>
      </footer>
    </div>

    <!-- Household / Partner Modal -->
    <div id="modal-household-settings" class="modal-backdrop" style="display: none;">
      <div class="modal-dialog glass-panel">
        <div class="modal-header">
          <h3>Household Settings & Partner Access</h3>
          <button id="btn-close-household-modal" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-intro">
            Connect Núria's or Andino's Google email address below. When signing in at <code>andinu.cc</code>, both of you will automatically share all weekly meal plans, pantry inventory, and wishlists.
          </p>

          <div class="household-members-box">
            <h4>Active Household Members</h4>
            <div class="members-list">
              ${members.map(m => `
                <div class="member-row">
                  <div class="member-info">
                    <span class="member-email">${escapeHtml(m.email)}</span>
                    <span class="member-role">${escapeHtml(m.role)}</span>
                  </div>
                  <span class="member-status-pill ${m.user_id ? 'status-active' : 'status-pending'}">
                    ${m.user_id ? 'Linked' : 'Invite Pending'}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <form id="form-invite-partner" class="invite-form">
            <label for="input-partner-email">Partner's Google Email</label>
            <div class="invite-input-row">
              <input 
                type="email" 
                id="input-partner-email" 
                placeholder="partner@gmail.com" 
                required 
                class="text-input"
              />
              <button type="submit" class="btn-primary-start" style="width: auto; padding: 0 16px;">
                Add Partner
              </button>
            </div>
            <p class="input-hint">Must match the Google account she signs in with.</p>
          </form>
        </div>
      </div>
    </div>
  `;

  // Attach navigation listeners
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = el.getAttribute('data-nav');
      if (path) navigate(path);
    });
  });

  // Modal open / close
  const modal = document.getElementById('modal-household-settings');
  document.getElementById('btn-open-household-settings')?.addEventListener('click', () => {
    if (modal) modal.style.display = 'flex';
  });
  document.getElementById('btn-close-household-modal')?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Handle invite form
  const inviteForm = document.getElementById('form-invite-partner');
  inviteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('input-partner-email');
    const email = emailInput?.value?.trim();
    if (!email) return;

    const { error } = await inviteHouseholdMember(household.id, email);
    if (error) {
      alert(`Could not add partner: ${error.message}`);
    } else {
      alert(`Partner ${email} successfully invited! The next time she signs in with Google, she will be automatically linked.`);
      if (modal) modal.style.display = 'none';
      mountDashboard(container, navigate);
    }
  });
}

export function mountPublicHome(container, navigate) {
  container.innerHTML = `
    <div class="public-home-shell">
      <!-- Public Hero Section -->
      <header class="public-hero glass-panel">
        <div class="public-hero-badge">
          <span class="pulse-dot"></span>
          <span>Private Household & Partner Suite</span>
        </div>
        
        <div class="public-brand-lockup">
          <div class="public-logo-wrap">
            <img src="/AndiNu_icon.png" alt="AndiNú Logo" class="public-logo-img" />
          </div>
          <div class="public-titles">
            <div class="dash-names-pill">Andino & Núria</div>
            <h1 class="public-title">AndiNú</h1>
            <p class="public-domain"><code>andinu.cc</code></p>
          </div>
        </div>

        <p class="public-tagline">
          A Private Household Suite for Daily Routines, Meal Planning & Shared Collections
        </p>

        <p class="public-lead">
          AndiNú brings our evening wellness routines, weekly dinner menus, on-hand pantry inventory, and mutual wishlists together in one unified, collaborative home space.
        </p>

        <!-- Prominent Google Sign-In Action -->
        <div class="public-cta-box">
          <button id="btn-public-google-login" class="btn-google-auth">
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          ${(!isSupabaseConfigured || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) ? `
            <div class="mock-login-badge" style="margin-top: 12px; padding: 10px; background: #FAF7F2; border: 1px dashed #E5E0D8; border-radius: 12px; text-align: center;">
              <span style="font-size: 0.78rem; color: #71717A;">Local Development & Testing:</span>
              <button id="btn-public-mock-login" class="btn-secondary-sm" style="margin-top: 6px; width: 100%; padding: 8px; font-weight: 600; cursor: pointer;">
                🔑 Preview Household
              </button>
            </div>
          ` : ''}

          <p class="public-auth-hint">
            Authorized household access only. Authentication is secured by Google Sign-In and Supabase Row Level Security.
          </p>
        </div>
      </header>

      <!-- App Overview Section (Required by Google OAuth Verification) -->
      <section class="public-features-section">
        <div class="public-section-header">
          <h2 class="public-section-title">What is AndiNú?</h2>
          <p class="public-section-subtitle">
            An overview of the integrated modules built for our shared household life.
          </p>
        </div>

        <div class="public-cards-grid">
          <!-- Feature 1: Nighttime Routine Guide -->
          <article class="public-feature-card glass-panel">
            <div class="feature-card-header">
              <div class="feature-icon-wrap icon-routine">
                <span>🌙</span>
              </div>
              <span class="feature-pill">Daily Wellness</span>
            </div>
            <h3 class="feature-title">Nighttime Routine Guide</h3>
            <p class="feature-desc">
              Personal wind-down checklists and evening habit tracking. Features a guided 30-minute couples mat routine: 10 minutes of strength, 15 minutes of stretching, and a 5-minute mindful wind-down, with voice guidance and calming background sound.
            </p>
            <ul class="feature-bullets">
              <li>Interval exercise timers with audio cues</li>
              <li>A fresh, balanced session every night</li>
              <li>Evening wind-down and relaxation tracking</li>
            </ul>
          </article>

          <!-- Feature 2: Meal Prep, Pantry & Smart Weekly Planner -->
          <article class="public-feature-card glass-panel">
            <div class="feature-card-header">
              <div class="feature-icon-wrap icon-meals">
                <span>🍳</span>
              </div>
              <span class="feature-pill">Kitchen Hub</span>
            </div>
            <h3 class="feature-title">Meal Prep & Weekly Planner</h3>
            <p class="feature-desc">
              Recipe management, pantry inventory tracking, weekly meal scheduling, and automated grocery lists. Synchronizes what's in our kitchen cabinets with what we cook each evening, minimizing food waste and simplifying grocery shopping trips.
            </p>
            <ul class="feature-bullets">
              <li>Interactive pantry inventory (in-stock vs. out)</li>
              <li>7-day dinner calendar with ingredient coverage metrics</li>
              <li>Dynamic shopping list that automatically updates pantry stock</li>
            </ul>
          </article>

          <!-- Feature 3: Shared Household Lists -->
          <article class="public-feature-card glass-panel">
            <div class="feature-card-header">
              <div class="feature-icon-wrap icon-lists">
                <span>📋</span>
              </div>
              <span class="feature-pill">Shared Collections</span>
            </div>
            <h3 class="feature-title">Shared Household Lists</h3>
            <p class="feature-desc">
              Collaborative checkbox trackers for our mutual interests. Enables us to catalog movies to watch together, rare vinyl records to add to our home sound system, and favorite travel destinations across the globe.
            </p>
            <ul class="feature-bullets">
              <li>Category tabs for Movies, Vinyl Records, and Travel Places</li>
              <li>Live completion status and progress counts</li>
              <li>Personal curation notes and acquisition years</li>
            </ul>
          </article>

          <!-- Feature 4: Note Board -->
          <article class="public-feature-card glass-panel">
            <div class="feature-card-header">
              <div class="feature-icon-wrap icon-quotes">
                <span>📌</span>
              </div>
              <span class="feature-pill">Shared Pinboard</span>
            </div>
            <h3 class="feature-title">Note Board</h3>
            <p class="feature-desc">
              A playful digital board for funny one-liners, sweet reminders, and memorable things we say to each other.
            </p>
            <ul class="feature-bullets">
              <li>Sticky notes, tiles, and frosted glass styles</li>
              <li>Filter by speaker (Núria 💗, Andino 🧉, Both 👫)</li>
              <li>Emoji sticker stamps and quick handwriting quotes</li>
            </ul>
          </article>

          <!-- Feature 5: Couples Life & Sleep Planner -->
          <article class="public-feature-card glass-panel">
            <div class="feature-card-header">
              <div class="feature-icon-wrap icon-planner">
                <span>📅</span>
              </div>
              <span class="feature-pill">Weekly Schedule</span>
            </div>
            <h3 class="feature-title">Couples Life & Sleep Planner</h3>
            <p class="feature-desc">
              A Scandinavian-inspired weekly calendar and sleep coordinator. Helps us decide where we sleep each night, set coordinated or individual morning wake-up alarms, and schedule mutual events.
            </p>
            <ul class="feature-bullets">
              <li>1-tap daily sleep locations (My Place, Her Place, Apart, Away)</li>
              <li>Bedtime targets and separate morning alarm automations</li>
              <li>Strict one-way outbound sync to Google Calendar via iCal feed</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- Transparency & Data Use Callout -->
      <section class="public-transparency-card glass-panel">
        <div class="transparency-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#C86D51" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <div class="transparency-content">
          <h3 class="transparency-title">Google Sign-In & Privacy Commitment</h3>
          <p class="transparency-text">
            AndiNú uses Google Sign-In strictly to authenticate identity and verify household group membership. We request only your basic profile information (email address, display name, and profile picture). We adhere strictly to the <strong>Google API Services User Data Policy</strong> and its Limited Use requirements. We never sell your data, use it for advertising, or feed it into generalized AI models.
          </p>
          <div class="transparency-links">
            <a href="/pp" class="text-link" data-nav="/pp">Read our full Privacy Policy →</a>
          </div>
        </div>
      </section>

      <!-- Public Footer (CRITICAL for Google Crawler) -->
      <footer class="public-footer">
        <div class="public-footer-links">
          <a href="/pp" data-nav="/pp" class="public-footer-link">Privacy Policy</a>
          <span class="footer-separator">•</span>
          <a href="/tos" data-nav="/tos" class="public-footer-link">Terms of Service</a>
          <span class="footer-separator">•</span>
          <a href="/login" data-nav="/login" class="public-footer-link">Sign In</a>
        </div>
        <p class="public-footer-copy">
          © 2026 AndiNú (Andino & Núria) • Hosted securely at <a href="https://andinu.cc">andinu.cc</a>
        </p>
      </footer>
    </div>
  `;

  // Attach login button listener
  document.getElementById('btn-public-google-login')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-public-google-login');
    if (btn) {
      btn.innerHTML = `<span class="spinner"></span> Connecting to Google...`;
      btn.disabled = true;
    }
    const { error } = await signInWithGoogle();
    if (error) {
      alert(`Sign in failed: ${error.message}`);
      if (btn) {
        btn.innerHTML = `<span>Sign in with Google</span>`;
        btn.disabled = false;
      }
    }
  });

  document.getElementById('btn-public-mock-login')?.addEventListener('click', () => {
    localStorage.setItem('andinu_mock_user', JSON.stringify({
      id: 'mock-andino',
      email: 'andino.boerst@gmail.com',
      user_metadata: { full_name: 'Andino' }
    }));
    navigate('/');
  });

  // Attach navigation listeners for internal links
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = el.getAttribute('data-nav');
      if (path) navigate(path);
    });
  });
}

