import { 
  getActiveHousehold, 
  supabase, 
  isSupabaseConfigured,
  generateUUID
} from '../services/supabase.js';

export async function mountMeals(container, navigate) {
  const household = await getActiveHousehold();
  let activeTab = 'planner'; // 'planner', 'recipes', 'pantry', 'shopping'
  
  // State
  let recipes = [];
  let pantryItems = [];
  let activePlan = null;
  let planDays = [];
  let shoppingItems = [];

  // Weekly Planner Tags Configuration
  const DAYS_OF_WEEK = [
    { index: 0, label: 'Monday', short: 'Mon' },
    { index: 1, label: 'Tuesday', short: 'Tue' },
    { index: 2, label: 'Wednesday', short: 'Wed' },
    { index: 3, label: 'Thursday', short: 'Thu' },
    { index: 4, label: 'Friday', short: 'Fri' },
    { index: 5, label: 'Saturday', short: 'Sat' },
    { index: 6, label: 'Sunday', short: 'Sun' }
  ];

  let requestedTags = {
    0: 'quick',
    1: 'healthy',
    2: 'pasta',
    3: 'quick',
    4: 'comfort',
    5: 'weekend',
    6: 'healthy'
  };

  // Starter Curated Recipes with valid UUIDs
  const STARTER_RECIPES = [
    {
      id: 'b1000000-0000-0000-0000-000000000001',
      title: 'Spaghetti Aglio, Olio e Peperoncino',
      description: 'Classic Roman garlic, chili flakes, and golden olive oil pasta.',
      instructions: 'Cook spaghetti al dente. In a pan, gently infuse olive oil with sliced garlic and red pepper flakes. Toss pasta with emulsion of pasta water. Top with parsley & parmesan.',
      prep_time_minutes: 15,
      tags: ['quick', 'pasta', 'comfort', 'vegetarian'],
      recipe_ingredients: [
        { ingredient_name: 'Spaghetti', normalized_name: 'spaghetti', quantity: 250, unit: 'g', category: 'Dry Goods' },
        { ingredient_name: 'Extra Virgin Olive Oil', normalized_name: 'extra virgin olive oil', quantity: 4, unit: 'tbsp', category: 'Pantry' },
        { ingredient_name: 'Garlic', normalized_name: 'garlic', quantity: 4, unit: 'cloves', category: 'Produce' },
        { ingredient_name: 'Red Chili Flakes', normalized_name: 'red chili flakes', quantity: 1, unit: 'tsp', category: 'Spices' },
        { ingredient_name: 'Parmesan Cheese', normalized_name: 'parmesan cheese', quantity: 40, unit: 'g', category: 'Dairy' }
      ]
    },
    {
      id: 'b1000000-0000-0000-0000-000000000002',
      title: 'Mediterranean Chickpea & Avocado Bowl',
      description: 'Crisp cucumbers, cherry tomatoes, creamy avocado, and lemon herb chickpeas.',
      instructions: 'Rinse chickpeas. Chop cucumbers, tomatoes, and avocado. Toss with olive oil, lemon juice, salt, and crumbled feta.',
      prep_time_minutes: 20,
      tags: ['quick', 'healthy', 'vegetarian', 'salad'],
      recipe_ingredients: [
        { ingredient_name: 'Canned Chickpeas', normalized_name: 'canned chickpeas', quantity: 1, unit: 'can', category: 'Canned Goods' },
        { ingredient_name: 'Avocado', normalized_name: 'avocado', quantity: 1, unit: 'whole', category: 'Produce' },
        { ingredient_name: 'Cherry Tomatoes', normalized_name: 'cherry tomatoes', quantity: 150, unit: 'g', category: 'Produce' },
        { ingredient_name: 'Cucumber', normalized_name: 'cucumber', quantity: 1, unit: 'whole', category: 'Produce' },
        { ingredient_name: 'Extra Virgin Olive Oil', normalized_name: 'extra virgin olive oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
        { ingredient_name: 'Lemon', normalized_name: 'lemon', quantity: 1, unit: 'whole', category: 'Produce' }
      ]
    },
    {
      id: 'b1000000-0000-0000-0000-000000000003',
      title: 'Sheet Pan Salmon & Roasted Greens',
      description: 'Tender honey-dijon glazed salmon fillets with broccolini and baby potatoes.',
      instructions: 'Roast halved potatoes 15 min at 200C. Add salmon fillets brushed with mustard-honey glaze and broccolini. Roast 12-14 min until tender.',
      prep_time_minutes: 30,
      tags: ['healthy', 'weekend', 'high-protein'],
      recipe_ingredients: [
        { ingredient_name: 'Salmon Fillets', normalized_name: 'salmon fillets', quantity: 2, unit: 'fillets', category: 'Meat & Seafood' },
        { ingredient_name: 'Broccolini', normalized_name: 'broccolini', quantity: 200, unit: 'g', category: 'Produce' },
        { ingredient_name: 'Baby Potatoes', normalized_name: 'baby potatoes', quantity: 300, unit: 'g', category: 'Produce' },
        { ingredient_name: 'Extra Virgin Olive Oil', normalized_name: 'extra virgin olive oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
        { ingredient_name: 'Dijon Mustard', normalized_name: 'dijon mustard', quantity: 1, unit: 'tbsp', category: 'Condiments' }
      ]
    },
    {
      id: 'b1000000-0000-0000-0000-000000000004',
      title: 'Creamy Tomato & Basil Penne',
      description: 'Rich tomato cream sauce infused with garlic, shallots, and fresh basil.',
      instructions: 'Saute garlic and shallots in butter. Pour in tomato passata and simmer. Stir in heavy cream and parmesan. Fold in boiled penne and fresh basil.',
      prep_time_minutes: 20,
      tags: ['pasta', 'comfort', 'quick', 'vegetarian'],
      recipe_ingredients: [
        { ingredient_name: 'Penne', normalized_name: 'penne', quantity: 250, unit: 'g', category: 'Dry Goods' },
        { ingredient_name: 'Tomato Passata', normalized_name: 'tomato passata', quantity: 400, unit: 'g', category: 'Canned Goods' },
        { ingredient_name: 'Heavy Cream', normalized_name: 'heavy cream', quantity: 100, unit: 'ml', category: 'Dairy' },
        { ingredient_name: 'Garlic', normalized_name: 'garlic', quantity: 3, unit: 'cloves', category: 'Produce' },
        { ingredient_name: 'Fresh Basil', normalized_name: 'fresh basil', quantity: 1, unit: 'handful', category: 'Produce' }
      ]
    }
  ];

  // Starter Pantry items with valid UUIDs
  const STARTER_PANTRY = [
    { id: 'p1000000-0000-0000-0000-000000000001', ingredient_name: 'Extra Virgin Olive Oil', normalized_name: 'extra virgin olive oil', quantity: 1, unit: 'bottle', in_stock: true, category: 'Pantry' },
    { id: 'p1000000-0000-0000-0000-000000000002', ingredient_name: 'Garlic', normalized_name: 'garlic', quantity: 4, unit: 'cloves', in_stock: true, category: 'Produce' },
    { id: 'p1000000-0000-0000-0000-000000000003', ingredient_name: 'Spaghetti', normalized_name: 'spaghetti', quantity: 500, unit: 'g', in_stock: true, category: 'Dry Goods' },
    { id: 'p1000000-0000-0000-0000-000000000004', ingredient_name: 'Red Chili Flakes', normalized_name: 'red chili flakes', quantity: 1, unit: 'jar', in_stock: true, category: 'Spices' },
    { id: 'p1000000-0000-0000-0000-000000000005', ingredient_name: 'Parmesan Cheese', normalized_name: 'parmesan cheese', quantity: 100, unit: 'g', in_stock: true, category: 'Dairy' },
    { id: 'p1000000-0000-0000-0000-000000000006', ingredient_name: 'Salmon Fillets', normalized_name: 'salmon fillets', quantity: 2, unit: 'fillets', in_stock: false, category: 'Meat & Seafood' },
    { id: 'p1000000-0000-0000-0000-000000000007', ingredient_name: 'Avocado', normalized_name: 'avocado', quantity: 2, unit: 'whole', in_stock: false, category: 'Produce' }
  ];

  // Local storage cache keys for offline/demo
  const STORAGE_RECIPES_KEY = 'andinu_cache_recipes';
  const STORAGE_PANTRY_KEY = 'andinu_cache_pantry';
  const STORAGE_PLAN_DAYS_KEY = 'andinu_cache_plan_days';
  const STORAGE_SHOPPING_KEY = 'andinu_cache_shopping';

  async function loadAllData() {
    if (isSupabaseConfigured && household?.id) {
      try {
        // 1. Load Recipes with Ingredients
        const { data: recs, error: recsErr } = await supabase
          .from('recipes')
          .select('*, recipe_ingredients(*)')
          .order('title');

        if (!recsErr && recs && recs.length > 0) {
          recipes = recs;
        } else if (!recsErr) {
          // Auto-seed starter recipes into Supabase for this household
          for (const sr of STARTER_RECIPES) {
            const recipeId = generateUUID();
            const { data: created } = await supabase
              .from('recipes')
              .insert([{
                id: recipeId,
                household_id: household.id,
                title: sr.title,
                description: sr.description,
                instructions: sr.instructions,
                prep_time_minutes: sr.prep_time_minutes,
                tags: sr.tags
              }])
              .select()
              .single();

            if (created) {
              const ingPayload = sr.recipe_ingredients.map(ing => ({
                id: generateUUID(),
                recipe_id: created.id,
                ingredient_name: ing.ingredient_name,
                normalized_name: ing.normalized_name,
                quantity: ing.quantity,
                unit: ing.unit,
                category: ing.category
              }));
              await supabase.from('recipe_ingredients').insert(ingPayload);
              created.recipe_ingredients = ingPayload;
              recipes.push(created);
            }
          }
        }

        // 2. Load Pantry Items
        const { data: pantry, error: pantryErr } = await supabase
          .from('pantry_items')
          .select('*')
          .order('ingredient_name');

        if (!pantryErr && pantry && pantry.length > 0) {
          pantryItems = pantry;
        } else if (!pantryErr) {
          // Auto-seed starter pantry items into Supabase for this household
          const pantryPayload = STARTER_PANTRY.map(p => ({
            id: generateUUID(),
            household_id: household.id,
            ingredient_name: p.ingredient_name,
            normalized_name: p.normalized_name,
            quantity: p.quantity,
            unit: p.unit,
            in_stock: p.in_stock,
            category: p.category
          }));
          const { data: createdPantry } = await supabase
            .from('pantry_items')
            .insert(pantryPayload)
            .select();
          if (createdPantry) {
            pantryItems = createdPantry;
          }
        }

        // 3. Load Current Week's Meal Plan
        const today = new Date();
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
        startOfWeek.setDate(diff);
        const weekDateStr = startOfWeek.toISOString().split('T')[0];

        let { data: plan } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('week_start_date', weekDateStr)
          .maybeSingle();

        if (!plan) {
          const { data: newPlan, error: newPlanErr } = await supabase
            .from('meal_plans')
            .insert([{ 
              id: generateUUID(),
              household_id: household.id, 
              week_start_date: weekDateStr, 
              title: 'Weekly Plan' 
            }])
            .select()
            .single();
          if (!newPlanErr) {
            plan = newPlan;
          } else {
            console.warn('Error creating weekly plan in Supabase:', newPlanErr);
          }
        }

        activePlan = plan;

        if (plan) {
          const { data: days } = await supabase
            .from('meal_plan_days')
            .select('*, recipes(*, recipe_ingredients(*))')
            .eq('meal_plan_id', plan.id)
            .order('day_of_week');

          if (days && days.length > 0) {
            planDays = days;
          }
        }

        // 4. Load Shopping Items
        const { data: shop } = await supabase
          .from('meal_shopping_items')
          .select('*')
          .order('is_checked', { ascending: true })
          .order('ingredient_name');

        if (shop) {
          shoppingItems = shop;
        }
      } catch (err) {
        console.warn('Error loading meal prep data:', err);
      }
    }

    // Fallbacks for offline/mock mode
    if (recipes.length === 0) {
      const cached = localStorage.getItem(STORAGE_RECIPES_KEY);
      recipes = cached ? JSON.parse(cached) : [...STARTER_RECIPES];
    }

    if (pantryItems.length === 0) {
      const cachedPantry = localStorage.getItem(STORAGE_PANTRY_KEY);
      pantryItems = cachedPantry ? JSON.parse(cachedPantry) : [...STARTER_PANTRY];
    }

    if (planDays.length === 0) {
      const cachedDays = localStorage.getItem(STORAGE_PLAN_DAYS_KEY);
      if (cachedDays) {
        planDays = JSON.parse(cachedDays);
      } else {
        planDays = DAYS_OF_WEEK.map((d, i) => ({
          id: generateUUID(),
          meal_plan_id: activePlan?.id || null,
          day_of_week: d.index,
          recipe_id: recipes[i % recipes.length]?.id,
          recipes: recipes[i % recipes.length],
          requested_tag: requestedTags[d.index] || 'quick',
          is_cooked: false
        }));
      }
    }
  }

  // --- ALGORITHM: PANTRY-OPTIMIZED RECIPE SCORER ---
  function scoreRecipeForPantry(recipe, requestedTag) {
    let score = 0;
    const ingList = recipe.recipe_ingredients || [];
    if (ingList.length === 0) return 0;

    // 1. Tag match bonus (+10 pts)
    if (requestedTag && recipe.tags?.includes(requestedTag)) {
      score += 10;
    }

    // 2. Pantry in-stock coverage bonus (up to 20 pts)
    let inStockCount = 0;
    ingList.forEach(ing => {
      const norm = (ing.normalized_name || ing.ingredient_name || '').toLowerCase().trim();
      const inStock = pantryItems.some(p => p.normalized_name === norm && p.in_stock);
      if (inStock) inStockCount++;
    });

    const coverageRatio = inStockCount / ingList.length;
    score += coverageRatio * 20;

    // Return composite score + stats
    return {
      score,
      inStockCount,
      totalCount: ingList.length,
      coveragePercent: Math.round(coverageRatio * 100)
    };
  }

  function render() {
    container.innerHTML = `
      <div class="meals-view-shell">
        <!-- View Header -->
        <div class="view-header">
          <div>
            <h1 class="view-title">Kitchen & Meal Prep</h1>
            <p class="view-subtitle">Pantry inventory, smart weekly planner & recipe box</p>
          </div>
          <div class="pantry-stock-pill" title="Pantry in-stock overview">
            <span>🥫</span>
            <span>${pantryItems.filter(p => p.in_stock).length} / ${pantryItems.length} In Stock</span>
          </div>
        </div>

        <!-- Sub-Nav Tabs -->
        <nav class="subnav-tabs-bar glass-panel">
          <button class="subnav-tab ${activeTab === 'planner' ? 'active' : ''}" data-tab="planner">
            📅 Weekly Planner
          </button>
          <button class="subnav-tab ${activeTab === 'shopping' ? 'active' : ''}" data-tab="shopping">
            🛒 Shopping List ${shoppingItems.filter(s => !s.is_checked).length ? `<span class="tab-badge">${shoppingItems.filter(s => !s.is_checked).length}</span>` : ''}
          </button>
          <button class="subnav-tab ${activeTab === 'pantry' ? 'active' : ''}" data-tab="pantry">
            🥫 Pantry Inventory
          </button>
          <button class="subnav-tab ${activeTab === 'recipes' ? 'active' : ''}" data-tab="recipes">
            📖 Recipe Library (${recipes.length})
          </button>
        </nav>

        <!-- Dynamic Sub-view Content -->
        <div class="tab-content-area">
          ${renderTabContent()}
        </div>
      </div>
    `;

    attachEvents();
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'planner':
        return renderPlannerView();
      case 'shopping':
        return renderShoppingView();
      case 'pantry':
        return renderPantryView();
      case 'recipes':
        return renderRecipesView();
      default:
        return '';
    }
  }

  // =========================================================================
  // 1. WEEKLY PLANNER VIEW
  // =========================================================================
  function renderPlannerView() {
    return `
      <div class="planner-view">
        <!-- Generator Controls Bar -->
        <div class="planner-hero glass-panel">
          <div class="planner-hero-text">
            <h3>Smart Pantry Meal Generator</h3>
            <p>Scores your recipes to maximize current pantry ingredients and minimize food waste.</p>
          </div>
          <div class="planner-hero-actions">
            <button id="btn-generate-plan" class="btn-primary-start" style="width: auto; padding: 10px 18px;">
              ✨ Auto-Generate Week
            </button>
            <button id="btn-sync-to-shopping" class="btn-secondary" style="padding: 10px 14px;">
              🛒 Export to Shopping List
            </button>
          </div>
        </div>

        <!-- Days Grid / Calendar View -->
        <div class="planner-calendar-grid">
          ${DAYS_OF_WEEK.map(d => {
            const planDay = planDays.find(p => p.day_of_week === d.index);
            const assignedRecipe = planDay?.recipes || recipes.find(r => r.id === planDay?.recipe_id) || null;
            const reqTag = planDay?.requested_tag || requestedTags[d.index] || 'quick';
            const stats = assignedRecipe ? scoreRecipeForPantry(assignedRecipe, reqTag) : null;
            const isToday = new Date().getDay() === (d.index === 6 ? 0 : d.index + 1);

            return `
              <div class="calendar-day-card glass-panel ${isToday ? 'is-today' : ''} ${planDay?.is_cooked ? 'is-cooked' : ''}">
                <div class="day-card-header">
                  <div class="day-info">
                    <span class="day-name">${d.label}</span>
                    ${isToday ? '<span class="today-badge">Today</span>' : ''}
                  </div>
                  <!-- Tag Preference Selector -->
                  <select class="select-day-tag" data-day-index="${d.index}" title="Requested meal style">
                    ${['quick', 'healthy', 'pasta', 'comfort', 'weekend', 'vegetarian', 'high-protein'].map(t => `
                      <option value="${t}" ${reqTag === t ? 'selected' : ''}>${t}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="day-card-body">
                  ${assignedRecipe ? `
                    <div class="assigned-recipe-box">
                      <h4 class="recipe-assigned-title">${assignedRecipe.title}</h4>
                      <div class="recipe-assigned-meta">
                        <span>⏱️ ${assignedRecipe.prep_time_minutes}m</span>
                        ${stats ? `
                          <span class="pantry-coverage-badge ${stats.coveragePercent >= 75 ? 'coverage-high' : 'coverage-mid'}">
                            🥫 ${stats.inStockCount}/${stats.totalCount} in stock (${stats.coveragePercent}%)
                          </span>
                        ` : ''}
                      </div>

                      <!-- Ingredients Preview -->
                      <div class="day-ingredients-snippet">
                        ${(assignedRecipe.recipe_ingredients || []).slice(0, 3).map(ing => {
                          const norm = (ing.normalized_name || ing.ingredient_name).toLowerCase().trim();
                          const hasStock = pantryItems.some(p => p.normalized_name === norm && p.in_stock);
                          return `
                            <span class="ing-pill ${hasStock ? 'has-stock' : 'needs-stock'}">
                              ${hasStock ? '✓' : '•'} ${ing.ingredient_name}
                            </span>
                          `;
                        }).join('')}
                        ${(assignedRecipe.recipe_ingredients?.length || 0) > 3 ? `<span class="ing-pill-more">+${assignedRecipe.recipe_ingredients.length - 3} more</span>` : ''}
                      </div>
                    </div>
                  ` : `
                    <div class="unassigned-day-box">
                      <span>No recipe scheduled</span>
                    </div>
                  `}
                </div>

                <div class="day-card-footer">
                  <select class="select-swap-recipe" data-day-index="${d.index}">
                    <option value="">-- Swap Recipe --</option>
                    ${recipes.map(r => `
                      <option value="${r.id}" ${r.id === assignedRecipe?.id ? 'selected' : ''}>
                        ${r.title} (${r.prep_time_minutes}m)
                      </option>
                    `).join('')}
                  </select>

                  <button 
                    class="btn-mark-cooked ${planDay?.is_cooked ? 'cooked' : ''}" 
                    data-day-index="${d.index}"
                    title="${planDay?.is_cooked ? 'Mark as uncooked' : 'Mark as cooked'}"
                  >
                    ${planDay?.is_cooked ? '✓ Cooked' : 'Mark Cooked'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 2. SHOPPING LIST VIEW
  // =========================================================================
  function renderShoppingView() {
    const checkedCount = shoppingItems.filter(s => s.is_checked).length;
    const totalCount = shoppingItems.length;

    // Sort pending items first, completed below
    const sortedShopping = [...shoppingItems].sort((a, b) => {
      if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1;
      return (a.ingredient_name || '').localeCompare(b.ingredient_name || '');
    });

    return `
      <div class="shopping-view">
        <div class="shopping-header glass-panel">
          <div>
            <h3 style="font-family: var(--font-heading);">Weekly Meal Shopping List</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">
              Ticking off an item automatically updates your Pantry inventory to <strong>In Stock</strong> in real time.
            </p>
          </div>
          <div class="shopping-actions-group">
            <button id="btn-auto-calc-shopping" class="btn-primary-start" style="width: auto; padding: 8px 16px; font-size: 0.84rem;">
              ⚡ Auto-Fill Missing from Plan
            </button>
            <button id="btn-clear-checked-shopping" class="btn-secondary" style="padding: 8px 12px; font-size: 0.84rem;">
              Clear Checked
            </button>
          </div>
        </div>

        <!-- Add Manual Shopping Item Form -->
        <form id="form-add-shopping-item" class="add-item-card glass-panel" style="margin-bottom: 16px;">
          <div class="add-item-row">
            <input 
              type="text" 
              id="input-shop-item-name" 
              class="text-input" 
              placeholder="Add extra grocery item (e.g. Greek yogurt, sourdough bread)..." 
              required
            />
            <input 
              type="text" 
              id="input-shop-item-qty" 
              class="text-input" 
              style="max-width: 120px;" 
              placeholder="Qty (e.g. 500g)"
            />
            <button type="submit" class="btn-primary-start" style="width: auto; padding: 0 16px;">
              Add
            </button>
          </div>
        </form>

        <!-- Shopping Items List -->
        <div class="shopping-items-stack">
          ${sortedShopping.length > 0 ? `
            <div class="items-stack">
              ${sortedShopping.map(item => `
                <div class="item-card glass-panel ${item.is_checked ? 'is-completed' : ''}" data-shop-id="${item.id}">
                  <label class="custom-checkbox-wrap">
                    <input 
                      type="checkbox" 
                      class="shop-checkbox" 
                      data-shop-check-id="${item.id}" 
                      ${item.is_checked ? 'checked' : ''}
                    />
                    <span class="checkbox-box"></span>
                  </label>

                  <div class="item-text-content">
                    <span class="item-name">${item.ingredient_name}</span>
                    ${item.quantity ? `<span class="item-note">${item.quantity} ${item.unit || ''}</span>` : ''}
                  </div>

                  <span class="shop-category-tag">${item.category || 'Groceries'}</span>

                  <button class="btn-item-delete" data-shop-delete-id="${item.id}" title="Remove item">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-list-state glass-panel text-center">
              <span class="empty-icon">🛒</span>
              <h3>Your shopping cart is clear</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
                Click "Auto-Fill Missing from Plan" above to calculate all missing ingredients across the week's dinners.
              </p>
              <button id="btn-auto-calc-shopping-empty" class="btn-primary-start" style="width: auto; padding: 10px 20px; font-size: 0.88rem; margin-top: 14px;">
                ⚡ Auto-Fill Missing from Plan
              </button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 3. PANTRY INVENTORY VIEW
  // =========================================================================
  function renderPantryView() {
    const inStock = pantryItems.filter(p => p.in_stock);
    const outOfStock = pantryItems.filter(p => !p.in_stock);

    return `
      <div class="pantry-view">
        <!-- Quick Add Pantry Form -->
        <form id="form-add-pantry" class="add-item-card glass-panel" style="margin-bottom: 20px;">
          <div class="add-item-row">
            <input 
              type="text" 
              id="input-pantry-name" 
              class="text-input" 
              placeholder="Add staple ingredient (e.g. Balsamic vinegar, jasmine rice)..." 
              required
            />
            <input 
              type="text" 
              id="input-pantry-qty" 
              class="text-input" 
              style="max-width: 130px;" 
              placeholder="Qty (e.g. 1 bottle)"
            />
            <button type="submit" class="btn-primary-start" style="width: auto; padding: 0 16px;">
              Add to Pantry
            </button>
          </div>
        </form>

        <div class="pantry-sections-grid">
          <!-- In Stock Column -->
          <div class="pantry-column glass-panel">
            <div class="column-header">
              <div class="column-title-wrap">
                <span class="column-status-dot dot-green"></span>
                <h4>Currently In Stock (${inStock.length})</h4>
              </div>
            </div>

            <div class="pantry-list">
              ${inStock.map(item => `
                <div class="pantry-item-row">
                  <div class="pantry-item-info">
                    <span class="pantry-item-name">${item.ingredient_name}</span>
                    <span class="pantry-item-meta">${item.quantity || ''} ${item.unit || ''} • ${item.category || 'Pantry'}</span>
                  </div>
                  <div class="pantry-item-controls">
                    <button class="btn-stock-toggle in-stock" data-pantry-id="${item.id}" data-to-stock="false" title="Mark Out of Stock">
                      In Stock ✓
                    </button>
                    <button class="btn-item-delete-sm" data-pantry-delete="${item.id}" title="Remove">✕</button>
                  </div>
                </div>
              `).join('')}
              ${inStock.length === 0 ? '<p class="empty-col-note">No items currently marked in stock.</p>' : ''}
            </div>
          </div>

          <!-- Out of Stock Column -->
          <div class="pantry-column glass-panel">
            <div class="column-header">
              <div class="column-title-wrap">
                <span class="column-status-dot dot-orange"></span>
                <h4>Out of Stock / Need (${outOfStock.length})</h4>
              </div>
            </div>

            <div class="pantry-list">
              ${outOfStock.map(item => `
                <div class="pantry-item-row out-of-stock-row">
                  <div class="pantry-item-info">
                    <span class="pantry-item-name">${item.ingredient_name}</span>
                    <span class="pantry-item-meta">${item.quantity || ''} ${item.unit || ''} • ${item.category || 'Pantry'}</span>
                  </div>
                  <div class="pantry-item-controls">
                    <button class="btn-stock-toggle out-stock" data-pantry-id="${item.id}" data-to-stock="true" title="Mark In Stock">
                      + Restock
                    </button>
                    <button class="btn-item-delete-sm" data-pantry-delete="${item.id}" title="Remove">✕</button>
                  </div>
                </div>
              `).join('')}
              ${outOfStock.length === 0 ? '<p class="empty-col-note">Great! Nothing currently marked out of stock.</p>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 4. RECIPES VIEW
  // =========================================================================
  function renderRecipesView() {
    return `
      <div class="recipes-view">
        <div class="recipes-header glass-panel">
          <div>
            <h3 style="font-family: var(--font-heading);">Favorite Recipes Box</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">
              Our curated dinner recipes with tagged categories and structured ingredient measurements.
            </p>
          </div>
          <button id="btn-add-recipe-modal" class="btn-primary-start" style="width: auto; padding: 8px 16px; font-size: 0.84rem;">
            ➕ Add New Recipe
          </button>
        </div>

        <div class="recipes-grid">
          ${recipes.map(recipe => {
            const ingCount = recipe.recipe_ingredients?.length || 0;
            return `
              <div class="recipe-card glass-panel" data-recipe-id="${recipe.id}">
                <div class="recipe-card-header">
                  <div class="recipe-title-wrap">
                    <h4 class="recipe-title">${recipe.title}</h4>
                    <span class="recipe-prep-pill">⏱️ ${recipe.prep_time_minutes}m</span>
                  </div>
                  <button class="btn-recipe-delete" data-recipe-delete="${recipe.id}" title="Delete recipe">✕</button>
                </div>

                <p class="recipe-desc">${recipe.description || 'No description provided.'}</p>

                <div class="recipe-tags-row">
                  ${(recipe.tags || []).map(t => `<span class="recipe-tag-pill">${t}</span>`).join('')}
                </div>

                <div class="recipe-ingredients-summary">
                  <h5>Ingredients (${ingCount}):</h5>
                  <div class="recipe-ing-tags">
                    ${(recipe.recipe_ingredients || []).map(ing => `
                      <span class="recipe-ing-item">
                        ${ing.quantity ? `${ing.quantity} ${ing.unit || ''}` : ''} ${ing.ingredient_name}
                      </span>
                    `).join('')}
                  </div>
                </div>

                ${recipe.instructions ? `
                  <details class="recipe-instructions-details">
                    <summary>View Instructions</summary>
                    <p class="recipe-instructions-text">${recipe.instructions.replace(/\n/g, '<br/>')}</p>
                  </details>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Add Recipe Modal -->
        <div id="modal-add-recipe" class="modal-backdrop" style="display: none;">
          <div class="modal-dialog glass-panel" style="max-width: 580px;">
            <div class="modal-header">
              <h3>Create New Recipe</h3>
              <button id="btn-close-recipe-modal" class="modal-close">&times;</button>
            </div>
            <form id="form-create-recipe" class="modal-body">
              <div class="form-group">
                <label>Recipe Title</label>
                <input type="text" id="recipe-in-title" class="text-input" placeholder="e.g. Creamy Tuscan Garlic Gnocchi" required />
              </div>

              <div class="form-row-2" style="display: flex; gap: 12px; margin-top: 12px;">
                <div class="form-group" style="flex: 1;">
                  <label>Prep Time (min)</label>
                  <input type="number" id="recipe-in-time" class="text-input" value="25" min="5" max="180" />
                </div>
                <div class="form-group" style="flex: 2;">
                  <label>Tags (comma separated)</label>
                  <input type="text" id="recipe-in-tags" class="text-input" placeholder="quick, pasta, vegetarian" />
                </div>
              </div>

              <div class="form-group" style="margin-top: 12px;">
                <label>Description</label>
                <input type="text" id="recipe-in-desc" class="text-input" placeholder="Short description of the dish" />
              </div>

              <div class="form-group" style="margin-top: 12px;">
                <label>Ingredients (one per line, e.g. "250g spaghetti", "2 tbsp olive oil")</label>
                <textarea id="recipe-in-ingredients" class="text-input" rows="4" placeholder="250g spaghetti&#10;4 cloves garlic&#10;2 tbsp olive oil" required></textarea>
              </div>

              <div class="form-group" style="margin-top: 12px;">
                <label>Cooking Instructions</label>
                <textarea id="recipe-in-instructions" class="text-input" rows="4" placeholder="Step-by-step instructions..."></textarea>
              </div>

              <button type="submit" class="btn-primary-start" style="margin-top: 18px;">
                Save Recipe
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // EVENT LISTENERS & LOGIC
  // =========================================================================
  function attachEvents() {
    // Subnav Tab Switching
    container.querySelectorAll('.subnav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.getAttribute('data-tab');
        render();
      });
    });

    // 1. Planner Events
    if (activeTab === 'planner') {
      // Auto-generate weekly plan
      container.querySelector('#btn-generate-plan')?.addEventListener('click', async () => {
        const btn = container.querySelector('#btn-generate-plan');
        if (btn) btn.textContent = 'Generating...';

        await generateWeeklyPlanInternal();
        render();
      });

      // Export missing plan ingredients to Shopping List
      container.querySelector('#btn-sync-to-shopping')?.addEventListener('click', async () => {
        await autoGenerateShoppingList();
        activeTab = 'shopping';
        render();
      });

      // Day Tag Selector
      container.querySelectorAll('.select-day-tag').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const dIdx = parseInt(sel.getAttribute('data-day-index'), 10);
          requestedTags[dIdx] = e.target.value;
        });
      });

      // Recipe Swap Dropdown
      container.querySelectorAll('.select-swap-recipe').forEach(sel => {
        sel.addEventListener('change', async (e) => {
          const dIdx = parseInt(sel.getAttribute('data-day-index'), 10);
          const chosenRecipeId = e.target.value;
          const chosenRecipe = recipes.find(r => r.id === chosenRecipeId);
          if (!chosenRecipe) return;

          let targetDay = planDays.find(p => p.day_of_week === dIdx);
          if (targetDay) {
            targetDay.recipe_id = chosenRecipeId;
            targetDay.recipes = chosenRecipe;
          } else {
            targetDay = {
              id: generateUUID(),
              meal_plan_id: activePlan?.id || null,
              day_of_week: dIdx,
              recipe_id: chosenRecipeId,
              recipes: chosenRecipe,
              requested_tag: requestedTags[dIdx] || 'quick',
              is_cooked: false
            };
            planDays.push(targetDay);
          }

          if (isSupabaseConfigured && activePlan?.id) {
            await supabase
              .from('meal_plan_days')
              .upsert({
                id: targetDay.id && !targetDay.id.startsWith('plan-day-') ? targetDay.id : generateUUID(),
                meal_plan_id: activePlan.id,
                day_of_week: dIdx,
                recipe_id: chosenRecipeId
              }, { onConflict: 'meal_plan_id,day_of_week' });
          } else {
            localStorage.setItem(STORAGE_PLAN_DAYS_KEY, JSON.stringify(planDays));
          }

          render();
        });
      });

      // Mark as Cooked Button
      container.querySelectorAll('.btn-mark-cooked').forEach(btn => {
        btn.addEventListener('click', async () => {
          const dIdx = parseInt(btn.getAttribute('data-day-index'), 10);
          const targetDay = planDays.find(p => p.day_of_week === dIdx);
          if (!targetDay) return;

          const nextCookedState = !targetDay.is_cooked;
          targetDay.is_cooked = nextCookedState;

          if (isSupabaseConfigured && activePlan?.id) {
            await supabase
              .from('meal_plan_days')
              .update({ is_cooked: nextCookedState, cooked_at: nextCookedState ? new Date().toISOString() : null })
              .eq('meal_plan_id', activePlan.id)
              .eq('day_of_week', dIdx);
          } else {
            localStorage.setItem(STORAGE_PLAN_DAYS_KEY, JSON.stringify(planDays));
          }

          render();
        });
      });
    }

    // 2. Shopping List Events
    if (activeTab === 'shopping') {
      // Auto-calc missing ingredients from weekly plan
      const handleAutoCalc = async () => {
        const btn = container.querySelector('#btn-auto-calc-shopping');
        const emptyBtn = container.querySelector('#btn-auto-calc-shopping-empty');
        if (btn) btn.textContent = 'Calculating...';
        if (emptyBtn) emptyBtn.textContent = 'Calculating...';
        await autoGenerateShoppingList();
      };

      container.querySelector('#btn-auto-calc-shopping')?.addEventListener('click', handleAutoCalc);
      container.querySelector('#btn-auto-calc-shopping-empty')?.addEventListener('click', handleAutoCalc);

      // Clear checked items
      container.querySelector('#btn-clear-checked-shopping')?.addEventListener('click', async () => {
        const toDeleteIds = shoppingItems.filter(s => s.is_checked).map(s => s.id);
        shoppingItems = shoppingItems.filter(s => !s.is_checked);

        if (isSupabaseConfigured && toDeleteIds.length > 0) {
          await supabase.from('meal_shopping_items').delete().in('id', toDeleteIds);
        } else {
          localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));
        }

        render();
      });

      // Add manual grocery item
      const addShopForm = container.querySelector('#form-add-shopping-item');
      addShopForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = container.querySelector('#input-shop-item-name');
        const qtyInput = container.querySelector('#input-shop-item-qty');
        const name = nameInput?.value?.trim();
        const qty = qtyInput?.value?.trim() || '';

        if (!name) return;

        const newItem = {
          id: generateUUID(),
          household_id: household.id,
          ingredient_name: name,
          normalized_name: name.toLowerCase().trim(),
          quantity: 1,
          unit: qty,
          category: 'Groceries',
          is_checked: false
        };

        if (isSupabaseConfigured) {
          const { data } = await supabase.from('meal_shopping_items').insert([newItem]).select().single();
          if (data) shoppingItems.unshift(data);
        } else {
          shoppingItems.unshift(newItem);
          localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));
        }

        render();
      });

      // Shopping Checkbox Toggle -> CRITICAL TRIGGER & IMMEDIATE PANTRY SYNC
      container.querySelectorAll('.shop-checkbox').forEach(chk => {
        chk.addEventListener('change', async (e) => {
          const id = chk.getAttribute('data-shop-check-id');
          const isChecked = e.target.checked;
          const target = shoppingItems.find(s => s.id === id);
          if (target) {
            target.is_checked = isChecked;
          }

          const norm = (target?.normalized_name || target?.ingredient_name || '').toLowerCase().trim();

          // Reflect immediately into pantry in local state
          const existingPantry = pantryItems.find(p => p.normalized_name === norm);
          if (existingPantry) {
            existingPantry.in_stock = isChecked;
          } else if (isChecked && target) {
            pantryItems.push({
              id: `pantry-sync-${Date.now()}`,
              household_id: household.id,
              ingredient_name: target.ingredient_name,
              normalized_name: norm,
              quantity: target.quantity || 1,
              unit: target.unit || '',
              in_stock: true,
              category: target.category || 'Pantry'
            });
          }

          // Supabase sync (executes the Postgres trigger handle_shopping_item_pantry_sync)
          if (isSupabaseConfigured) {
            await supabase
              .from('meal_shopping_items')
              .update({ is_checked: isChecked, updated_at: new Date().toISOString() })
              .eq('id', id);
          } else {
            localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));
            localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(pantryItems));
          }

          render();
        });
      });

      // Delete shopping item
      container.querySelectorAll('.btn-item-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-shop-delete-id');
          shoppingItems = shoppingItems.filter(s => s.id !== id);

          if (isSupabaseConfigured) {
            await supabase.from('meal_shopping_items').delete().eq('id', id);
          } else {
            localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));
          }

          render();
        });
      });
    }

    // 3. Pantry Events
    if (activeTab === 'pantry') {
      // Add Pantry Staple
      const pantryForm = container.querySelector('#form-add-pantry');
      pantryForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = container.querySelector('#input-pantry-name');
        const qtyInput = container.querySelector('#input-pantry-qty');
        const name = nameInput?.value?.trim();
        const qty = qtyInput?.value?.trim() || '';

        if (!name) return;
        const norm = name.toLowerCase().trim();

        const newItem = {
          id: generateUUID(),
          household_id: household.id,
          ingredient_name: name,
          normalized_name: norm,
          quantity: 1,
          unit: qty,
          in_stock: true,
          category: 'Pantry'
        };

        if (isSupabaseConfigured) {
          const { data } = await supabase.from('pantry_items').insert([newItem]).select().single();
          if (data) pantryItems.unshift(data);
        } else {
          pantryItems.unshift(newItem);
          localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(pantryItems));
        }

        render();
      });

      // Stock Toggle
      container.querySelectorAll('.btn-stock-toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-pantry-id');
          const toStock = btn.getAttribute('data-to-stock') === 'true';
          const target = pantryItems.find(p => p.id === id);
          if (target) {
            target.in_stock = toStock;
          }

          if (isSupabaseConfigured) {
            await supabase.from('pantry_items').update({ in_stock: toStock, updated_at: new Date().toISOString() }).eq('id', id);
          } else {
            localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(pantryItems));
          }

          render();
        });
      });

      // Delete Pantry Item
      container.querySelectorAll('.btn-item-delete-sm').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-pantry-delete');
          pantryItems = pantryItems.filter(p => p.id !== id);

          if (isSupabaseConfigured) {
            await supabase.from('pantry_items').delete().eq('id', id);
          } else {
            localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(pantryItems));
          }

          render();
        });
      });
    }

    // 4. Recipes Events
    if (activeTab === 'recipes') {
      const modalAdd = container.querySelector('#modal-add-recipe');
      const btnOpenAdd = container.querySelector('#btn-add-recipe-modal');
      const btnCloseAdd = container.querySelector('#btn-close-recipe-modal');

      btnOpenAdd?.addEventListener('click', () => {
        if (modalAdd) modalAdd.style.display = 'flex';
      });

      btnCloseAdd?.addEventListener('click', () => {
        if (modalAdd) modalAdd.style.display = 'none';
      });

      modalAdd?.addEventListener('click', (e) => {
        if (e.target === modalAdd) modalAdd.style.display = 'none';
      });

      // Form Create Recipe
      const formRecipe = container.querySelector('#form-create-recipe');
      formRecipe?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = container.querySelector('#recipe-in-title')?.value?.trim();
        const time = parseInt(container.querySelector('#recipe-in-time')?.value || '25', 10);
        const tagsRaw = container.querySelector('#recipe-in-tags')?.value || '';
        const desc = container.querySelector('#recipe-in-desc')?.value?.trim() || '';
        const ingsRaw = container.querySelector('#recipe-in-ingredients')?.value || '';
        const instructions = container.querySelector('#recipe-in-instructions')?.value?.trim() || '';

        if (!title) return;

        const tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        const parsedIngs = ingsRaw.split('\n').map(line => line.trim()).filter(Boolean).map(line => ({
          ingredient_name: line,
          normalized_name: line.toLowerCase().trim(),
          quantity: 1,
          unit: '',
          category: 'Other'
        }));

        const recipeId = generateUUID();
        const newRecipe = {
          id: recipeId,
          household_id: household.id,
          title,
          description: desc,
          instructions,
          prep_time_minutes: time,
          tags,
          recipe_ingredients: parsedIngs
        };

        if (isSupabaseConfigured) {
          const { data: created, error } = await supabase
            .from('recipes')
            .insert([{
              id: recipeId,
              household_id: household.id,
              title,
              description: desc,
              instructions,
              prep_time_minutes: time,
              tags
            }])
            .select()
            .single();

          if (!error && created) {
            if (parsedIngs.length > 0) {
              const ingPayload = parsedIngs.map(i => ({
                id: generateUUID(),
                ...i,
                recipe_id: created.id
              }));
              await supabase.from('recipe_ingredients').insert(ingPayload);
              created.recipe_ingredients = ingPayload;
            }
            recipes.unshift(created);
          }
        } else {
          recipes.unshift(newRecipe);
          localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(recipes));
        }

        if (modalAdd) modalAdd.style.display = 'none';
        render();
      });

      // Delete Recipe
      container.querySelectorAll('.btn-recipe-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-recipe-delete');
          if (!confirm('Delete this recipe?')) return;

          recipes = recipes.filter(r => r.id !== id);

          if (isSupabaseConfigured) {
            await supabase.from('recipes').delete().eq('id', id);
          } else {
            localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(recipes));
          }

          render();
        });
      });
    }
  }

  // Helper to generate and persist weekly meal assignments
  async function generateWeeklyPlanInternal() {
    if (recipes.length === 0) return [];

    const newPlanDays = DAYS_OF_WEEK.map(d => {
      const reqTag = requestedTags[d.index] || 'quick';
      const sorted = [...recipes].sort((a, b) => {
        const scoreB = scoreRecipeForPantry(b, reqTag).score;
        const scoreA = scoreRecipeForPantry(a, reqTag).score;
        return scoreB - scoreA;
      });

      const bestRecipe = sorted[d.index % sorted.length] || sorted[0];

      return {
        id: generateUUID(),
        meal_plan_id: activePlan?.id || null,
        day_of_week: d.index,
        recipe_id: bestRecipe.id,
        recipes: bestRecipe,
        requested_tag: reqTag,
        is_cooked: false
      };
    });

    planDays = newPlanDays;

    if (isSupabaseConfigured && activePlan?.id) {
      try {
        await supabase.from('meal_plan_days').delete().eq('meal_plan_id', activePlan.id);
        const { error: insErr } = await supabase.from('meal_plan_days').insert(
          newPlanDays.map(p => ({
            id: p.id,
            meal_plan_id: activePlan.id,
            day_of_week: p.day_of_week,
            recipe_id: p.recipe_id,
            requested_tag: p.requested_tag,
            is_cooked: false
          }))
        );
        if (insErr) {
          console.warn('Error saving plan days to Supabase:', insErr);
        }
      } catch (e) {
        console.warn('Error saving plan to Supabase:', e);
      }
    } else {
      localStorage.setItem(STORAGE_PLAN_DAYS_KEY, JSON.stringify(planDays));
    }

    return newPlanDays;
  }

  // Auto-generation logic for Shopping List
  async function autoGenerateShoppingList(forceAllPlanIngredients = false) {
    const needed = new Map();

    // 1. Ensure weekly dinners are assigned
    const hasActivePlannedDays = planDays.some(day => day.recipe_id || day.recipes);
    if (!hasActivePlannedDays) {
      await generateWeeklyPlanInternal();
    }

    const activePlannedDays = planDays.filter(day => day.recipe_id || day.recipes);
    if (activePlannedDays.length === 0) {
      alert('No recipes available to plan. Please add recipes to your Recipe Library first.');
      return;
    }

    // 2. Collect all required ingredients from active weekly plan
    activePlannedDays.forEach(day => {
      const rec = day.recipes || recipes.find(r => r.id === day.recipe_id);
      if (!rec) return;

      const ings = rec.recipe_ingredients || [];
      ings.forEach(ing => {
        const norm = (ing.normalized_name || ing.ingredient_name || '').toLowerCase().trim();
        if (!norm) return;

        // Check if ingredient is already in stock in pantry (bypassed if forceAllPlanIngredients)
        const hasInPantry = !forceAllPlanIngredients && pantryItems.some(p => (p.normalized_name || p.ingredient_name || '').toLowerCase().trim() === norm && p.in_stock);
        
        // Check if already on current shopping list (and not checked off)
        const alreadyInShopping = shoppingItems.some(s => (s.normalized_name || s.ingredient_name || '').toLowerCase().trim() === norm && !s.is_checked);

        if (!hasInPantry && !alreadyInShopping) {
          if (!needed.has(norm)) {
            needed.set(norm, {
              ingredient_name: ing.ingredient_name,
              normalized_name: norm,
              quantity: typeof ing.quantity === 'number' ? ing.quantity : 1,
              unit: ing.unit || '',
              category: ing.category || 'Groceries'
            });
          }
        }
      });
    });

    if (needed.size === 0) {
      const addAnyway = confirm('All ingredients for this week are currently marked "In Stock" in your pantry.\n\nWould you like to add all fresh ingredients from this week\'s planned meals to your shopping cart anyway?');
      if (addAnyway) {
        return await autoGenerateShoppingList(true);
      }
      return;
    }

    const newShoppingItems = Array.from(needed.values()).map(n => ({
      id: generateUUID(),
      household_id: household.id,
      meal_plan_id: activePlan?.id || null,
      ingredient_name: n.ingredient_name,
      normalized_name: n.normalized_name,
      quantity: typeof n.quantity === 'number' ? n.quantity : 1,
      unit: n.unit || '',
      category: n.category || 'Groceries',
      is_checked: false
    }));

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('meal_shopping_items').insert(newShoppingItems).select();
      if (error) {
        console.error('Error inserting auto-filled shopping items:', error);
        alert(`Failed to add items to shopping list: ${error.message}`);
        return;
      }
      if (data) {
        shoppingItems = [...data, ...shoppingItems];
      }
    } else {
      shoppingItems = [...newShoppingItems, ...shoppingItems];
      localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));
    }

    render();
    alert(`🛒 Added ${newShoppingItems.length} missing ingredient${newShoppingItems.length > 1 ? 's' : ''} to your shopping cart!`);
  }

  await loadAllData();
  render();
}

