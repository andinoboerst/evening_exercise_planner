import { 
  getCurrentUser, 
  getActiveHousehold, 
  getHouseholdMembers, 
  inviteHouseholdMember, 
  supabase, 
  isSupabaseConfigured 
} from '../services/supabase.js';

export async function mountDashboard(container, navigate) {
  const user = await getCurrentUser();
  const household = await getActiveHousehold();
  const members = await getHouseholdMembers(household?.id);

  // Get summary data: Tonight's planned meal & Recent list items
  let tonightMeal = null;
  let recentListItems = [];

  if (isSupabaseConfigured && household?.id) {
    try {
      // Fetch today's meal plan day
      const today = new Date().getDay(); // 0 is Sun, 1 is Mon...
      // Adjust to Monday = 0
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
        .order('created_at', { ascending: false })
        .limit(3);

      if (listItems) {
        recentListItems = listItems;
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
            <p class="card-desc">30-min couples mat workout: 10m strength, 15m mobility, and 5m wind-down with curated music.</p>
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
      </section>

      <!-- Quick Summary Widgets -->
      <section class="dash-widgets-grid">
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
                  <h4 class="meal-preview-title">${tonightMeal.recipes.title}</h4>
                  <div class="meal-preview-meta">
                    <span>⏱️ ${tonightMeal.recipes.prep_time_minutes || 20}m prep</span>
                    ${tonightMeal.recipes.tags?.length ? `<span>🏷️ ${tonightMeal.recipes.tags.slice(0, 2).join(', ')}</span>` : ''}
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
                    <span class="item-title ${item.is_completed ? 'completed' : ''}">${item.title}</span>
                    <span class="item-cat-badge">${item.list_categories?.name || 'List'}</span>
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
      </section>
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
                    <span class="member-email">${m.email}</span>
                    <span class="member-role">${m.role}</span>
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

