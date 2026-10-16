import { 
  getActiveHousehold, 
  supabase, 
  isSupabaseConfigured,
  generateUUID
} from '../services/supabase.js';

export async function mountMeals(container, navigate) {
  const household = await getActiveHousehold();
  let activeTab = 'planner'; // 'planner', 'recipes', 'pantry', 'shopping'

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let recipes = [];
  let pantryItems = [];
  let activePlan = null;
  let planDays = []; // one entry per (day_of_week, slot_type)
  let shoppingItems = [];

  // UI state
  let sheet = null; // { type: 'recipe' | 'picker', day, slot }
  let showAddRecipe = false;
  let focusedDay = null; // ISO date of highlighted mobile pill (set after helpers)
  let dayObserver = null;

  const DAYS_OF_WEEK = [
    { index: 0, label: 'Monday', short: 'Mon' },
    { index: 1, label: 'Tuesday', short: 'Tue' },
    { index: 2, label: 'Wednesday', short: 'Wed' },
    { index: 3, label: 'Thursday', short: 'Thu' },
    { index: 4, label: 'Friday', short: 'Fri' },
    { index: 5, label: 'Saturday', short: 'Sat' },
    { index: 6, label: 'Sunday', short: 'Sun' }
  ];

  const SLOT_TAGS = {
    lunch: ['quick', 'salad', 'sandwich'],
    dinner: ['quick', 'healthy', 'pasta', 'comfort']
  };

  const STARTER_RECIPES = [
    {
      id: 'b1000000-0000-0000-0000-000000000001',
      title: 'Spaghetti Aglio, Olio e Peperoncino',
      description: 'Classic Roman garlic, chili flakes, and golden olive oil pasta.',
      instructions: 'Cook spaghetti al dente.\nIn a pan, gently infuse olive oil with sliced garlic and red pepper flakes.\nToss pasta with emulsion of pasta water.\nTop with parsley & parmesan.',
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
      instructions: 'Rinse chickpeas.\nChop cucumbers, tomatoes, and avocado.\nToss with olive oil, lemon juice, salt, and crumbled feta.',
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
      instructions: 'Roast halved potatoes 15 min at 200C.\nAdd salmon fillets brushed with mustard-honey glaze and broccolini.\nRoast 12-14 min until tender.',
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
      instructions: 'Saute garlic and shallots in butter.\nPour in tomato passata and simmer.\nStir in heavy cream and parmesan.\nFold in boiled penne and fresh basil.',
      prep_time_minutes: 20,
      tags: ['pasta', 'comfort', 'quick', 'vegetarian'],
      recipe_ingredients: [
        { ingredient_name: 'Penne', normalized_name: 'penne', quantity: 250, unit: 'g', category: 'Dry Goods' },
        { ingredient_name: 'Tomato Passata', normalized_name: 'tomato passata', quantity: 400, unit: 'g', category: 'Canned Goods' },
        { ingredient_name: 'Heavy Cream', normalized_name: 'heavy cream', quantity: 100, unit: 'ml', category: 'Dairy' },
        { ingredient_name: 'Garlic', normalized_name: 'garlic', quantity: 3, unit: 'cloves', category: 'Produce' },
        { ingredient_name: 'Fresh Basil', normalized_name: 'fresh basil', quantity: 1, unit: 'handful', category: 'Produce' }
      ]
    },
    {
      id: 'b1000000-0000-0000-0000-000000000005',
      title: 'Caprese Ciabatta Sandwich',
      description: 'Mozzarella, ripe tomato and basil pressed into toasted ciabatta.',
      instructions: 'Slice ciabatta and toast lightly.\nLayer mozzarella, tomato slices and basil.\nDrizzle with olive oil and press closed.',
      prep_time_minutes: 10,
      tags: ['quick', 'sandwich', 'vegetarian'],
      recipe_ingredients: [
        { ingredient_name: 'Ciabatta Roll', normalized_name: 'ciabatta roll', quantity: 1, unit: 'whole', category: 'Bakery' },
        { ingredient_name: 'Mozzarella', normalized_name: 'mozzarella', quantity: 125, unit: 'g', category: 'Dairy' },
        { ingredient_name: 'Tomato', normalized_name: 'tomato', quantity: 1, unit: 'whole', category: 'Produce' },
        { ingredient_name: 'Fresh Basil', normalized_name: 'fresh basil', quantity: 1, unit: 'handful', category: 'Produce' },
        { ingredient_name: 'Extra Virgin Olive Oil', normalized_name: 'extra virgin olive oil', quantity: 1, unit: 'tbsp', category: 'Pantry' }
      ]
    },
    {
      id: 'b1000000-0000-0000-0000-000000000006',
      title: 'Greek Orzo Salad',
      description: 'Lemony orzo with feta, olives, cucumber and herbs - great cold.',
      instructions: 'Boil orzo and rinse under cold water.\nToss with chopped cucumber, olives and feta.\nDress with lemon juice and olive oil.',
      prep_time_minutes: 20,
      tags: ['salad', 'quick', 'healthy', 'vegetarian'],
      recipe_ingredients: [
        { ingredient_name: 'Orzo', normalized_name: 'orzo', quantity: 200, unit: 'g', category: 'Dry Goods' },
        { ingredient_name: 'Feta Cheese', normalized_name: 'feta cheese', quantity: 100, unit: 'g', category: 'Dairy' },
        { ingredient_name: 'Kalamata Olives', normalized_name: 'kalamata olives', quantity: 60, unit: 'g', category: 'Canned Goods' },
        { ingredient_name: 'Cucumber', normalized_name: 'cucumber', quantity: 1, unit: 'whole', category: 'Produce' },
        { ingredient_name: 'Lemon', normalized_name: 'lemon', quantity: 1, unit: 'whole', category: 'Produce' }
      ]
    }
  ];

  // Offline/demo pantry: only things we actually have
  const STARTER_PANTRY = [
    { id: 'pantry-start-1', ingredient_name: 'Extra Virgin Olive Oil', normalized_name: 'extra virgin olive oil', quantity: 1, unit: 'bottle', category: 'Pantry' },
    { id: 'pantry-start-2', ingredient_name: 'Garlic', normalized_name: 'garlic', quantity: 4, unit: 'cloves', category: 'Produce' },
    { id: 'pantry-start-3', ingredient_name: 'Spaghetti', normalized_name: 'spaghetti', quantity: 500, unit: 'g', category: 'Dry Goods' },
    { id: 'pantry-start-4', ingredient_name: 'Red Chili Flakes', normalized_name: 'red chili flakes', quantity: 1, unit: 'jar', category: 'Spices' },
    { id: 'pantry-start-5', ingredient_name: 'Parmesan Cheese', normalized_name: 'parmesan cheese', quantity: 100, unit: 'g', category: 'Dairy' }
  ];

  const STORAGE_RECIPES_KEY = 'andinu_cache_recipes';
  const STORAGE_PANTRY_KEY = 'andinu_cache_pantry';
  const STORAGE_PLAN_DAYS_KEY = 'andinu_cache_plan_slots_v3';
  const STORAGE_SHOPPING_KEY = 'andinu_cache_shopping';
  const LOCAL_PLAN_ID = 'local-plan';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normName = (s) => String(s || '').toLowerCase().trim();
  const useDb = () => Boolean(isSupabaseConfigured && household?.id && activePlan?.id);
  const useDbBasic = () => Boolean(isSupabaseConfigured && household?.id);

  function formatQty(n) {
    if (typeof n !== 'number' || isNaN(n)) return '';
    return String(Math.round(n * 100) / 100);
  }

  function parseAmount(text) {
    const m = String(text || '').trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
    if (m) return { quantity: parseFloat(m[1].replace(',', '.')), unit: m[2] || '' };
    return { quantity: 1, unit: String(text || '').trim() };
  }

  function amountLabel(item) {
    const qty = item.quantity;
    const unit = item.unit || '';
    if (/^\d/.test(unit)) return unit;
    if (qty == null || qty === '') return unit;
    return `${formatQty(Number(qty))} ${unit}`.trim();
  }

  const recipeOf = (entry) => entry ? (recipes.find(r => r.id === entry.recipe_id) || entry.recipes || null) : null;
  // Days are keyed by ISO date (YYYY-MM-DD). The planner is a rolling window starting today.
  const pad2 = (n) => String(n).padStart(2, '0');
  const toISO = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  const parseISO = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
  const todayStr = () => toISO(new Date());
  const addDays = (s, n) => { const dt = parseISO(s); dt.setDate(dt.getDate() + n); return toISO(dt); };
  const dowOf = (s) => (parseISO(s).getDay() + 6) % 7; // 0 = Monday
  const dayName = (s) => parseISO(s).toLocaleDateString(undefined, { weekday: 'long' });
  const dayShort = (s) => parseISO(s).toLocaleDateString(undefined, { weekday: 'short' });
  const dayNice = (s) => parseISO(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const windowDates = () => Array.from({ length: 7 }, (_, i) => addDays(todayStr(), i));
  focusedDay = todayStr();

  const getEntry = (d, s) => planDays.find(p => p.meal_date === d && p.slot_type === s);
  const nextDay = (d) => addDays(d, 1);
  const isLinked = (entry) => Boolean(entry?.source_meal_prep_id);
  const isInPantry = (norm) => pantryItems.some(p => normName(p.normalized_name || p.ingredient_name) === norm);

  // Staples (oils, spices, condiments, baking basics...) are bought in bulk and their use per
  // dish is unknown, so they are NEVER removed automatically. Users can override per item.
  const STAPLE_CATEGORIES = new Set(['pantry', 'spices', 'spice', 'condiments', 'oils', 'baking', 'sauces']);
  const STAPLE_WORDS = /\b(oil|salt|pepper|vinegar|flour|sugar|spices?|seasoning|paprika|cumin|cinnamon|oregano|thyme|rosemary|turmeric|nutmeg|chili|chilli|mustard|ketchup|mayo|mayonnaise|soy sauce|honey|stock|bouillon|baking|yeast|cornstarch|sesame|curry)\b/i;
  const isStapleName = (name, category) =>
    STAPLE_CATEGORIES.has(String(category || '').toLowerCase().trim()) || STAPLE_WORDS.test(String(name || ''));
  const isStapleItem = (p) => (p.is_staple != null ? Boolean(p.is_staple) : isStapleName(p.ingredient_name, p.category));

  // Marks the entry as consumed and returns normalized names of non-staple ingredients it uses.
  function collectUsedIngredients(entry) {
    const names = new Set();
    entry.ingredients_consumed = true;
    if (!entry.recipe_id) return names;
    const mult = entry.servings_multiplier != null ? Number(entry.servings_multiplier) : 1;
    if (mult <= 0) return names; // leftover lunch: its ingredients went with the 2x dinner
    (recipeOf(entry)?.recipe_ingredients || []).forEach(ing => {
      if (isStapleName(ing.ingredient_name, ing.category)) return;
      const n = normName(ing.normalized_name || ing.ingredient_name);
      if (n) names.add(n);
    });
    return names;
  }

  // Deletes matching, non-staple pantry rows. Returns the removed items.
  async function removeFromPantry(norms) {
    const usedUp = pantryItems.filter(p => norms.has(normName(p.normalized_name || p.ingredient_name)) && !isStapleItem(p));
    if (!usedUp.length) return [];
    pantryItems = pantryItems.filter(p => !usedUp.includes(p));
    if (useDbBasic()) await supabase.from('pantry_items').delete().in('id', usedUp.map(p => p.id));
    else localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(pantryItems));
    return usedUp;
  }

  function newEntry(d, s) {
    const e = {
      id: generateUUID(),
      meal_plan_id: activePlan?.id || LOCAL_PLAN_ID,
      meal_date: d,
      day_of_week: dowOf(d),
      slot_type: s,
      ingredients_consumed: false,
      recipe_id: null,
      recipes: null,
      requested_tag: null,
      is_meal_prep: false,
      servings_multiplier: 1,
      source_meal_prep_id: null,
      is_cooked: false
    };
    planDays.push(e);
    return e;
  }

  function mondayDateString() {
    const d = new Date();
    const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
    d.setDate(diff);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  async function reloadPantry() {
    if (!useDbBasic()) return;
    const { data, error } = await supabase.from('pantry_items').select('*').order('ingredient_name');
    if (!error && data) pantryItems = data;
  }

  async function loadAllData() {
    let dbLoaded = false;
    if (isSupabaseConfigured && household?.id) {
      try {
        // 1. Recipes
        const { data: recs, error: recsErr } = await supabase
          .from('recipes')
          .select('*, recipe_ingredients(*)')
          .order('title');

        if (!recsErr && recs && recs.length > 0) {
          recipes = recs;
        } else if (!recsErr) {
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

        // 2. Pantry (= only what we have; an empty pantry is a valid state)
        const { data: pantry, error: pantryErr } = await supabase
          .from('pantry_items')
          .select('*')
          .order('ingredient_name');
        if (!pantryErr && pantry) {
          pantryItems = pantry;
          dbLoaded = true;
        }

        // 3. This week's plan
        const weekDateStr = mondayDateString();
        let { data: plan } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('week_start_date', weekDateStr)
          .maybeSingle();

        if (!plan) {
          const { data: newPlan, error: newPlanErr } = await supabase
            .from('meal_plans')
            .insert([{ id: generateUUID(), household_id: household.id, week_start_date: weekDateStr, title: 'Weekly Plan' }])
            .select()
            .single();
          if (!newPlanErr) plan = newPlan;
          else console.warn('Error creating weekly plan in Supabase:', newPlanErr);
        }

        activePlan = plan;

        {
          // All household entries from today on, plus past ones not yet consumed
          const { data: days } = await supabase
            .from('meal_plan_days')
            .select('*, recipes(*, recipe_ingredients(*))')
            .or(`meal_date.gte.${todayStr()},ingredients_consumed.eq.false`)
            .order('meal_date');
          planDays = (days || []).map(d => ({
            ...d,
            slot_type: d.slot_type || 'dinner',
            servings_multiplier: d.servings_multiplier != null ? Number(d.servings_multiplier) : 1
          }));
        }

        // 4. Shopping list
        const { data: shop } = await supabase
          .from('meal_shopping_items')
          .select('*')
          .order('is_checked', { ascending: true })
          .order('ingredient_name');
        if (shop) shoppingItems = shop;
      } catch (err) {
        console.warn('Error loading meal prep data:', err);
      }
    }

    // Offline / demo fallbacks
    if (recipes.length === 0) {
      const cached = localStorage.getItem(STORAGE_RECIPES_KEY);
      recipes = cached ? JSON.parse(cached) : [...STARTER_RECIPES];
    }

    if (!dbLoaded) {
      const cachedPantry = localStorage.getItem(STORAGE_PANTRY_KEY);
      pantryItems = cachedPantry
        ? JSON.parse(cachedPantry).filter(p => p.in_stock !== false)
        : [...STARTER_PANTRY];
    }

    if (!activePlan) {
      const cachedDays = localStorage.getItem(STORAGE_PLAN_DAYS_KEY);
      planDays = cachedDays ? JSON.parse(cachedDays) : [];
      if (!isSupabaseConfigured || !household?.id) {
        const cachedShop = localStorage.getItem(STORAGE_SHOPPING_KEY);
        if (cachedShop) shoppingItems = JSON.parse(cachedShop);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Persistence for plan entries
  // ---------------------------------------------------------------------------
  function toRow(e) {
    return {
      id: e.id,
      meal_plan_id: (e.meal_plan_id && e.meal_plan_id !== LOCAL_PLAN_ID) ? e.meal_plan_id : activePlan.id,
      meal_date: e.meal_date,
      day_of_week: dowOf(e.meal_date),
      ingredients_consumed: Boolean(e.ingredients_consumed),
      slot_type: e.slot_type,
      recipe_id: e.recipe_id || null,
      requested_tag: e.requested_tag || null,
      is_meal_prep: Boolean(e.is_meal_prep),
      servings_multiplier: e.servings_multiplier,
      source_meal_prep_id: e.source_meal_prep_id || null,
      is_cooked: Boolean(e.is_cooked),
      cooked_at: e.is_cooked ? (e.cooked_at || new Date().toISOString()) : null
    };
  }

  async function persist(changes) {
    if (!useDb()) {
      localStorage.setItem(STORAGE_PLAN_DAYS_KEY, JSON.stringify(planDays));
      return;
    }
    try {
      if (changes.remove.length) {
        await supabase.from('meal_plan_days').delete().in('id', changes.remove.map(e => e.id));
      }
      const unique = new Map();
      changes.upsert.forEach(e => unique.set(e.id, e));
      const rows = Array.from(unique.values()).map(toRow);
      // Sources (dinners) first so linked lunches can reference them
      const groups = [rows.filter(r => !r.source_meal_prep_id), rows.filter(r => r.source_meal_prep_id)];
      for (const group of groups) {
        if (!group.length) continue;
        const { error } = await supabase
          .from('meal_plan_days')
          .upsert(group, { onConflict: 'meal_plan_id,meal_date,slot_type' });
        if (error) console.warn('Error saving meal plan entries:', error);
      }
    } catch (e) {
      console.warn('Error saving plan to Supabase:', e);
    }
  }

  const newChanges = () => ({ upsert: [], remove: [] });

  function removeEntry(entry, changes) {
    planDays = planDays.filter(p => p !== entry);
    changes.remove.push(entry);
  }

  // Keep next day's Lunch in sync with day N's Dinner (meal prep carryover).
  function syncCarryover(d, changes) {
    const dinner = getEntry(d, 'dinner');
    const nd = nextDay(d);
    const lunch = getEntry(nd, 'lunch');
    const active = dinner && dinner.is_meal_prep && dinner.recipe_id;

    if (active) {
      const l = lunch || newEntry(nd, 'lunch');
      l.recipe_id = dinner.recipe_id;
      l.recipes = recipeOf(dinner);
      l.source_meal_prep_id = dinner.id;
      l.servings_multiplier = 0; // already counted in the 2x dinner
      l.is_meal_prep = false;
      l.is_cooked = false;
      changes.upsert.push(l);
    } else if (lunch && lunch.source_meal_prep_id && (!dinner || lunch.source_meal_prep_id === dinner.id)) {
      removeEntry(lunch, changes);
    }
  }

  async function setRecipe(d, s, recipeId) {
    const changes = newChanges();
    let entry = getEntry(d, s);

    if (!recipeId) {
      if (entry && !isLinked(entry)) {
        removeEntry(entry, changes);
        if (s === 'dinner') syncCarryover(d, changes);
      }
    } else {
      if (entry && isLinked(entry)) return; // locked
      entry = entry || newEntry(d, s);
      entry.recipe_id = recipeId;
      entry.recipes = recipes.find(r => r.id === recipeId) || null;
      entry.is_cooked = false;
      entry.ingredients_consumed = false; // a new recipe hasn't been used yet
      if (s === 'dinner') entry.servings_multiplier = entry.is_meal_prep ? 2 : 1;
      changes.upsert.push(entry);
      if (s === 'dinner') syncCarryover(d, changes);
    }
    await persist(changes);
  }

  async function setMealPrep(d, on) {
    const dinner = getEntry(d, 'dinner');
    if (!dinner || !dinner.recipe_id) return;
    const changes = newChanges();
    dinner.is_meal_prep = on;
    dinner.servings_multiplier = on ? 2 : 1;
    changes.upsert.push(dinner);
    syncCarryover(d, changes);
    await persist(changes);
  }

  async function toggleCooked(d, s) {
    const entry = getEntry(d, s);
    if (!entry) return;
    entry.is_cooked = !entry.is_cooked;
    entry.cooked_at = entry.is_cooked ? new Date().toISOString() : null;

    // Cooking uses up the ingredients right away (once; the day passing won't repeat it)
    let removed = [];
    if (entry.is_cooked && !entry.ingredients_consumed) {
      removed = await removeFromPantry(collectUsedIngredients(entry));
    }

    const changes = newChanges();
    changes.upsert.push(entry);
    await persist(changes);
    return removed;
  }

  // ---------------------------------------------------------------------------
  // Suggestion algorithm (pantry-optimised)
  // ---------------------------------------------------------------------------
  function scoreRecipeForPantry(recipe, requestedTag) {
    const ingList = recipe?.recipe_ingredients || [];
    if (ingList.length === 0) return { score: 0, inStockCount: 0, totalCount: 0, coveragePercent: 0 };

    let score = 0;
    if (requestedTag && recipe.tags?.includes(requestedTag)) score += 10;

    let inStockCount = 0;
    ingList.forEach(ing => {
      if (isInPantry(normName(ing.normalized_name || ing.ingredient_name))) inStockCount++;
    });

    const coverageRatio = inStockCount / ingList.length;
    score += coverageRatio * 20;

    return { score, inStockCount, totalCount: ingList.length, coveragePercent: Math.round(coverageRatio * 100) };
  }

  function suggestRecipe(tag, usedIds) {
    if (recipes.length === 0) return null;
    let pool = recipes;
    if (tag) {
      const tagged = pool.filter(r => (r.tags || []).includes(tag));
      if (tagged.length) pool = tagged;
    }
    const fresh = pool.filter(r => !usedIds.has(r.id));
    if (fresh.length) pool = fresh;
    const top = pool
      .map(r => ({ r, s: scoreRecipeForPantry(r, tag).score }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
    return top[Math.floor(Math.random() * top.length)].r;
  }

  const usedRecipeIds = () => new Set(planDays.map(p => p.recipe_id).filter(Boolean));

  async function autoFillEmptySlots() {
    const used = usedRecipeIds();
    // Plans from today onwards (next 7 days); keeps manual choices & locked meal-prep lunches
    const dates = windowDates();
    for (let i = 0; i < dates.length; i++) {
      for (const slot of ['dinner', 'lunch']) {
        const existing = getEntry(dates[i], slot);
        if (existing?.recipe_id) continue;
        const tag = SLOT_TAGS[slot][(i + (slot === 'lunch' ? 0 : 1)) % SLOT_TAGS[slot].length];
        const pick = suggestRecipe(tag, used);
        if (!pick) return;
        used.add(pick.id);
        await setRecipe(dates[i], slot, pick.id);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Shopping list generation
  // ---------------------------------------------------------------------------
  function computeWeeklyNeeds() {
    const totals = new Map();
    const dates = new Set(windowDates());
    planDays.forEach(entry => {
      if (!dates.has(entry.meal_date)) return; // only the upcoming 7 days
      const rec = recipeOf(entry);
      if (!rec) return;
      const mult = entry.servings_multiplier != null ? Number(entry.servings_multiplier) : 1;
      if (mult <= 0) return; // linked meal-prep lunch: already counted in 2x dinner
      (rec.recipe_ingredients || []).forEach(ing => {
        const norm = normName(ing.normalized_name || ing.ingredient_name);
        if (!norm) return;
        const unit = ing.unit || '';
        const key = `${norm}|${unit}`;
        const qty = (typeof ing.quantity === 'number' ? ing.quantity : parseFloat(ing.quantity) || 1) * mult;
        if (totals.has(key)) totals.get(key).quantity += qty;
        else totals.set(key, { ingredient_name: ing.ingredient_name, normalized_name: norm, quantity: qty, unit, category: ing.category || 'Groceries' });
      });
    });
    return Array.from(totals.values());
  }

  async function generateShoppingList() {
    const upcoming = new Set(windowDates());
    if (!planDays.some(p => p.recipe_id && upcoming.has(p.meal_date))) {
      toast('Plan at least one meal first.');
      return false;
    }
    const planKey = activePlan?.id || LOCAL_PLAN_ID;
    const manualUnchecked = new Set(
      shoppingItems.filter(s => !s.is_checked && s.meal_plan_id !== planKey).map(s => normName(s.normalized_name || s.ingredient_name))
    );

    // Drop previously generated, not-yet-bought items so regenerating stays accurate
    const stale = shoppingItems.filter(s => !s.is_checked && s.meal_plan_id === planKey);
    shoppingItems = shoppingItems.filter(s => !stale.includes(s));
    if (stale.length && useDbBasic()) {
      await supabase.from('meal_shopping_items').delete().in('id', stale.map(s => s.id));
    }

    const needed = computeWeeklyNeeds().filter(n => !isInPantry(n.normalized_name) && !manualUnchecked.has(n.normalized_name));

    const payload = needed.map(n => ({
      id: generateUUID(),
      household_id: household?.id,
      meal_plan_id: planKey,
      ingredient_name: n.ingredient_name,
      normalized_name: n.normalized_name,
      quantity: Math.round(n.quantity * 100) / 100,
      unit: n.unit,
      category: n.category,
      is_checked: false
    }));

    if (payload.length && useDbBasic()) {
      const dbPayload = payload.map(p => ({ ...p, meal_plan_id: activePlan?.id || null }));
      const { data, error } = await supabase.from('meal_shopping_items').insert(dbPayload).select();
      if (error) {
        toast(`Failed to build list: ${error.message}`);
        return false;
      }
      shoppingItems = [...(data || []), ...shoppingItems];
    } else if (payload.length) {
      shoppingItems = [...payload, ...shoppingItems];
    }
    if (!useDbBasic()) localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));

    // In DB mode generated rows reference the real plan id
    return payload.length;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function scrollSafeRender() {
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  function render() {
    if (dayObserver) { dayObserver.disconnect(); dayObserver = null; }
    document.body.classList.toggle('mp-sheet-open', Boolean(sheet) || showAddRecipe);

    const pendingShop = shoppingItems.filter(s => !s.is_checked).length;

    container.innerHTML = `
      <div class="meals-view-shell">
        <div class="view-header">
          <div>
            <h1 class="view-title">Kitchen &amp; Meal Prep</h1>
            <p class="view-subtitle">Lunch &amp; dinner planner, pantry and recipe box</p>
          </div>
          <div class="pantry-stock-pill" title="Ingredients you have on hand">
            <span>🥫</span>
            <span>${pantryItems.length} in Pantry</span>
          </div>
        </div>

        <nav class="subnav-tabs-bar glass-panel">
          <button class="subnav-tab ${activeTab === 'planner' ? 'active' : ''}" data-tab="planner">📅 Weekly Planner</button>
          <button class="subnav-tab ${activeTab === 'shopping' ? 'active' : ''}" data-tab="shopping">
            🛒 Shopping List ${pendingShop ? `<span class="tab-badge">${pendingShop}</span>` : ''}
          </button>
          <button class="subnav-tab ${activeTab === 'pantry' ? 'active' : ''}" data-tab="pantry">🥫 Pantry</button>
          <button class="subnav-tab ${activeTab === 'recipes' ? 'active' : ''}" data-tab="recipes">📖 Recipes (${recipes.length})</button>
        </nav>

        <div class="tab-content-area">${renderTabContent()}</div>
        ${renderSheet()}
      </div>
    `;

    attachEvents();
    if (activeTab === 'planner') setupDayObserver();
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'planner': return renderPlannerView();
      case 'shopping': return renderShoppingView();
      case 'pantry': return renderPantryView();
      case 'recipes': return renderRecipesView();
      default: return '';
    }
  }

  // --- PLANNER ---------------------------------------------------------------
  function coverageBadge(recipe, mult) {
    const stats = scoreRecipeForPantry(recipe, null);
    if (!stats.totalCount) return '';
    return `<span class="mp-chip ${stats.coveragePercent >= 75 ? 'mp-chip-good' : ''}">🥫 ${stats.inStockCount}/${stats.totalCount} in pantry</span>`;
  }

  function renderSlot(d, slot) {
    const entry = getEntry(d, slot);
    const rec = recipeOf(entry);
    const isLunch = slot === 'lunch';
    const icon = isLunch ? '☀️' : '🌙';
    const label = isLunch ? 'Lunch' : 'Dinner';
    const dayLbl = dayName(d);

    // Lunch auto-filled by yesterday's meal prep dinner
    if (isLunch && entry && isLinked(entry) && rec) {
      const prevLabel = dayName(addDays(d, -1));
      return `
        <div class="mp-slot mp-slot-linked ${entry.is_cooked ? 'is-cooked' : ''}">
          <div class="mp-slot-head"><span class="mp-slot-name">${icon} ${label}</span><span class="mp-lock">🔒 Locked</span></div>
          <button class="mp-slot-main" data-action="open-sheet" data-day="${d}" data-slot="${slot}">
            <span class="mp-linked-badge">🍱 Meal Prep from ${prevLabel} — Ready in Fridge</span>
            <span class="mp-slot-title">${esc(rec.title)}</span>
            <span class="mp-slot-meta">No extra prep needed ${entry.is_cooked ? '• ✓ Eaten' : ''}</span>
          </button>
        </div>`;
    }

    if (entry && rec) {
      const isPrep = slot === 'dinner' && entry.is_meal_prep;
      return `
        <div class="mp-slot ${isPrep ? 'mp-slot-prep' : ''} ${entry.is_cooked ? 'is-cooked' : ''}">
          <div class="mp-slot-head">
            <span class="mp-slot-name">${icon} ${label}</span>
            ${isPrep ? `<span class="mp-prep-badge">2x Portions • Packs ${dayName(nextDay(d))}'s Lunch</span>` : ''}
          </div>
          <button class="mp-slot-main" data-action="open-sheet" data-day="${d}" data-slot="${slot}">
            <span class="mp-slot-title">${esc(rec.title)}</span>
            <span class="mp-slot-meta">
              <span class="mp-chip">⏱️ ${rec.prep_time_minutes || '?'}m</span>
              ${coverageBadge(rec)}
              ${entry.is_cooked ? '<span class="mp-chip mp-chip-good">✓ Cooked</span>' : ''}
            </span>
          </button>
          ${slot === 'dinner' ? `
            <div class="mp-seg" role="group" aria-label="Dinner portions for ${dayLbl}">
              <button class="mp-seg-btn ${!isPrep ? 'active' : ''}" data-action="set-prep" data-day="${d}" data-prep="0">🍽️ 1x Dinner</button>
              <button class="mp-seg-btn ${isPrep ? 'active prep' : ''}" data-action="set-prep" data-day="${d}" data-prep="1">🍱 2x Meal Prep <small>(+Tomorrow's Lunch)</small></button>
            </div>
            ${isPrep ? `<div class="mp-connector">↓ Covers ${dayName(nextDay(d))}'s lunch</div>` : ''}
          ` : ''}
        </div>`;
    }

    // Empty slot
    return `
      <div class="mp-slot mp-slot-empty">
        <div class="mp-slot-head"><span class="mp-slot-name">${icon} ${label}</span></div>
        <button class="mp-add-btn" data-action="open-picker" data-day="${d}" data-slot="${slot}">+ Add / Suggest ${label}</button>
        <div class="mp-tag-row">
          ${SLOT_TAGS[slot].map(t => `<button class="mp-tag-pill" data-action="suggest" data-day="${d}" data-slot="${slot}" data-tag="${t}">${t}</button>`).join('')}
        </div>
      </div>`;
  }

  function renderPlannerView() {
    const dates = windowDates();
    const today = todayStr();
    const plannedCount = planDays.filter(p => p.recipe_id && dates.includes(p.meal_date)).length;
    const relLabel = (s) => s === today ? 'Today' : s === addDays(today, 1) ? 'Tomorrow' : null;

    return `
      <div class="planner-view">
        <div class="mp-hero">
          <div class="mp-hero-text">
            <h2>Coming Up</h2>
            <p>${plannedCount} of 14 meals planned for the next 7 days. Past days roll off automatically and use up their ingredients from your pantry.</p>
          </div>
          <div class="mp-hero-actions">
            <button class="btn-secondary" data-action="autofill">✨ Plan My Week (from today)</button>
            <button class="mp-primary-btn" data-action="generate-shopping">🛒 Generate Shopping List for This Week</button>
          </div>
        </div>

        <div class="mp-pills" role="tablist" aria-label="Upcoming days">
          ${dates.map(ds => {
            const l = getEntry(ds, 'lunch');
            const dn = getEntry(ds, 'dinner');
            return `
              <button class="mp-pill ${focusedDay === ds ? 'active' : ''} ${ds === today ? 'today' : ''}" data-action="jump-day" data-day="${ds}">
                <span class="mp-pill-label">${ds === today ? 'Today' : dayShort(ds)}</span>
                <span class="mp-pill-date">${parseISO(ds).getDate()}</span>
                <span class="mp-dots">
                  <span class="mp-dot ${l?.recipe_id ? 'on' : ''}"></span>
                  <span class="mp-dot ${dn?.recipe_id ? 'on' : ''} ${dn?.is_meal_prep ? 'prep' : ''}"></span>
                </span>
              </button>`;
          }).join('')}
        </div>

        <div class="mp-agenda">
          ${dates.map(ds => `
            <section class="mp-day ${ds === today ? 'is-today' : ''}" id="mp-day-${ds}" data-day="${ds}">
              <header class="mp-day-header">
                <h3>${dayName(ds)}</h3>
                <span class="mp-day-date">${dayNice(ds)}</span>
                ${relLabel(ds) ? `<span class="today-badge">${relLabel(ds)}</span>` : ''}
              </header>
              ${renderSlot(ds, 'lunch')}
              ${renderSlot(ds, 'dinner')}
            </section>
          `).join('')}
        </div>

        <div class="mp-bottom-cta">
          <button class="mp-primary-btn" data-action="generate-shopping">🛒 Generate Shopping List for This Week</button>
        </div>
      </div>
    `;
  }

  // --- BOTTOM SHEET ----------------------------------------------------------
  function renderSheet() {
    if (showAddRecipe) return renderAddRecipeModal();
    if (!sheet) return '';
    const { day, slot } = sheet;
    const entry = getEntry(day, slot);
    const dayLabel = dayName(day);
    const slotLabel = slot === 'lunch' ? 'Lunch' : 'Dinner';

    if (sheet.type === 'picker') {
      const sorted = [...recipes].sort((a, b) => scoreRecipeForPantry(b, null).score - scoreRecipeForPantry(a, null).score);
      return `
        <div class="mp-sheet-backdrop" data-action="close-sheet">
          <div class="mp-sheet" role="dialog" aria-label="Choose ${slotLabel}">
            <div class="mp-sheet-grab"></div>
            <div class="mp-sheet-head">
              <div><span class="mp-sheet-kicker">${dayLabel} ${slotLabel}</span><h3>Choose a recipe</h3></div>
              <button class="mp-sheet-close" data-action="close-sheet" aria-label="Close">&times;</button>
            </div>
            <div class="mp-sheet-body">
              ${sorted.map(r => `
                <button class="mp-picker-row" data-action="choose-recipe" data-recipe-id="${r.id}">
                  <span class="mp-picker-title">${esc(r.title)}</span>
                  <span class="mp-slot-meta"><span class="mp-chip">⏱️ ${r.prep_time_minutes || '?'}m</span>${coverageBadge(r)}${(r.tags || []).slice(0, 2).map(t => `<span class="mp-chip">${esc(t)}</span>`).join('')}</span>
                </button>`).join('')}
              ${entry?.recipe_id && !isLinked(entry) ? `<button class="mp-picker-row mp-picker-clear" data-action="choose-recipe" data-recipe-id="">🍴 Eating out / leave empty</button>` : ''}
            </div>
          </div>
        </div>`;
    }

    // Recipe quick-view
    const rec = recipeOf(entry);
    if (!entry || !rec) return '';
    const linked = isLinked(entry);
    const mult = linked ? 1 : (Number(entry.servings_multiplier) || 1);
    const steps = String(rec.instructions || '')
      .split(/\n|(?<=\.)\s+(?=[A-Z])/)
      .map(s => s.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter(Boolean);

    return `
      <div class="mp-sheet-backdrop" data-action="close-sheet">
        <div class="mp-sheet" role="dialog" aria-label="${esc(rec.title)}">
          <div class="mp-sheet-grab"></div>
          <div class="mp-sheet-head">
            <div>
              <span class="mp-sheet-kicker">${dayLabel} ${slotLabel}${entry.is_meal_prep ? ' • 🍱 Meal Prep 2x' : ''}</span>
              <h3>${esc(rec.title)}</h3>
            </div>
            <button class="mp-sheet-close" data-action="close-sheet" aria-label="Close">&times;</button>
          </div>
          <div class="mp-sheet-body">
            ${linked ? `<div class="mp-note mp-note-sage">🍱 Packed from ${dayName(addDays(day, -1))} dinner — ingredients are already counted in that 2x cook. Just grab it from the fridge.</div>` : ''}
            ${entry.is_meal_prep ? `<div class="mp-note mp-note-prep">Cooking <strong>2x</strong> tonight. Quantities below are doubled and also cover ${dayName(nextDay(day))}'s lunch.</div>` : ''}
            <div class="mp-sheet-meta"><span class="mp-chip">⏱️ ${rec.prep_time_minutes || '?'}m</span>${(rec.tags || []).map(t => `<span class="mp-chip">${esc(t)}</span>`).join('')}</div>

            <h4 class="mp-sheet-h">Ingredients ${mult !== 1 ? `<span class="mp-mult">× ${mult}</span>` : ''}</h4>
            <ul class="mp-ing-list">
              ${(rec.recipe_ingredients || []).map(ing => {
                const has = isInPantry(normName(ing.normalized_name || ing.ingredient_name));
                const q = typeof ing.quantity === 'number' ? formatQty(ing.quantity * mult) : '';
                return `<li class="${has ? 'has' : ''}"><span class="mp-ing-qty">${q} ${esc(ing.unit || '')}</span><span class="mp-ing-name">${esc(ing.ingredient_name)}</span>${has ? '<span class="mp-ing-have">✓ in pantry</span>' : ''}</li>`;
              }).join('')}
            </ul>

            ${steps.length && !linked ? `
              <h4 class="mp-sheet-h">Instructions</h4>
              <ol class="mp-steps">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
          </div>
          <div class="mp-sheet-foot">
            <button class="mp-primary-btn ${entry.is_cooked ? 'done' : ''}" data-action="toggle-cooked">${entry.is_cooked ? '✓ Cooked — tap to undo' : linked ? 'Mark as Eaten' : 'Mark as Cooked'}</button>
            ${linked ? '' : `<button class="btn-secondary" data-action="open-picker" data-day="${day}" data-slot="${slot}">Change</button>`}
          </div>
        </div>
      </div>`;
  }

  // --- SHOPPING --------------------------------------------------------------
  function renderShoppingView() {
    const pending = shoppingItems.filter(s => !s.is_checked).sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.ingredient_name || '').localeCompare(b.ingredient_name || ''));
    const purchased = shoppingItems.filter(s => s.is_checked);

    const row = (item) => `
      <div class="item-card glass-panel ${item.is_checked ? 'is-completed' : ''}" data-shop-id="${item.id}">
        <label class="custom-checkbox-wrap">
          <input type="checkbox" class="shop-checkbox" data-shop-check-id="${item.id}" ${item.is_checked ? 'checked' : ''} />
          <span class="checkbox-box"></span>
        </label>
        <div class="item-text-content">
          <span class="item-name">${esc(item.ingredient_name)}</span>
          ${item.quantity || item.unit ? `<span class="item-note">${esc(amountLabel(item))}</span>` : ''}
        </div>
        <span class="shop-category-tag">${esc(item.category || 'Groceries')}</span>
        <button class="btn-item-delete" data-action="delete-shop" data-id="${item.id}" title="Remove item" aria-label="Remove item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>`;

    return `
      <div class="shopping-view">
        <div class="shopping-header glass-panel">
          <div>
            <h3 style="font-family: 'Newsreader', Georgia, serif;">Shopping List</h3>
            <p style="color: var(--app-text-muted, #666059); font-size: 0.85rem; margin-top: 2px;">
              Tick an item while you shop and it moves straight into your <strong>Pantry</strong>.
            </p>
          </div>
          <div class="shopping-actions-group">
            <button class="mp-primary-btn compact" data-action="generate-shopping">🛒 Generate from This Week</button>
          </div>
        </div>

        <form id="form-add-shopping-item" class="add-item-card glass-panel" style="margin-bottom: 16px;">
          <div class="add-item-row">
            <input type="text" id="input-shop-item-name" class="text-input" placeholder="Add extra grocery item (e.g. Greek yogurt)..." required />
            <input type="text" id="input-shop-item-qty" class="text-input" style="max-width: 120px;" placeholder="Qty (e.g. 500g)" />
            <button type="submit" class="btn-primary-start" style="width: auto; padding: 0 16px;">Add</button>
          </div>
        </form>

        ${pending.length ? `<div class="items-stack">${pending.map(row).join('')}</div>` : `
          <div class="empty-list-state glass-panel text-center">
            <span class="empty-icon">🛒</span>
            <h3>${purchased.length ? 'All done — everything is in the pantry' : 'Your shopping list is empty'}</h3>
            <p style="color: var(--app-text-muted, #666059); font-size: 0.85rem; margin-top: 4px;">Plan your lunches and dinners, then generate the list. Anything already in your Pantry is skipped.</p>
          </div>`}

        ${purchased.length ? `
          <details class="mp-purchased" open>
            <summary>
              <span>✅ Purchased &amp; Added to Pantry (${purchased.length})</span>
              <button type="button" class="btn-secondary" data-action="clear-purchased" style="padding: 6px 12px; font-size: 0.8rem;">Clear Purchased</button>
            </summary>
            <div class="items-stack">${purchased.map(row).join('')}</div>
          </details>` : ''}
      </div>`;
  }

  // --- PANTRY ----------------------------------------------------------------
  function renderPantryView() {
    const items = [...pantryItems].sort((a, b) => (a.ingredient_name || '').localeCompare(b.ingredient_name || ''));
    return `
      <div class="pantry-view">
        <form id="form-add-pantry" class="add-item-card glass-panel" style="margin-bottom: 20px;">
          <div class="add-item-row">
            <input type="text" id="input-pantry-name" class="text-input" placeholder="Something you have at home (e.g. jasmine rice)..." required />
            <input type="text" id="input-pantry-qty" class="text-input" style="max-width: 130px;" placeholder="Qty (optional)" />
            <button type="submit" class="btn-primary-start" style="width: auto; padding: 0 16px;">Add to Pantry</button>
          </div>
        </form>

        <div class="pantry-column glass-panel mp-pantry-card">
          <div class="column-header"><h4>On hand (${items.length})</h4></div>
          <p class="mp-pantry-hint">Used something up? Just remove it. Anything here is skipped when generating your shopping list.</p>
          <div class="pantry-list">
            ${items.map(item => `
              <div class="pantry-item-row">
                <div class="pantry-item-info">
                  <span class="pantry-item-name">${esc(item.ingredient_name)} ${isStapleItem(item) ? '<span class="mp-chip mp-chip-good" title="Staples are never removed automatically">⭐ Staple</span>' : ''}</span>
                  <span class="pantry-item-meta">${esc(amountLabel(item))} ${amountLabel(item) ? '•' : ''} ${esc(item.category || 'Pantry')}</span>
                </div>
                <div class="pantry-item-controls">
                  <button class="btn-item-staple-sm ${isStapleItem(item) ? 'is-staple' : ''}" data-action="toggle-staple" data-id="${item.id}" title="${isStapleItem(item) ? 'Staple item (never auto-removed) — click to unmark' : 'Mark as staple (never auto-removed)'}" aria-label="Toggle staple">${isStapleItem(item) ? '★' : '☆'}</button>
                  <button class="btn-item-delete-sm" data-action="delete-pantry" data-id="${item.id}" title="Remove from pantry" aria-label="Remove ${esc(item.ingredient_name)} from pantry">🗑</button>
                </div>
              </div>`).join('')}
            ${items.length === 0 ? '<p class="empty-col-note">Your pantry is empty. Add what you have, or tick off items on the shopping list.</p>' : ''}
          </div>
        </div>
      </div>`;
  }

  // --- RECIPES ---------------------------------------------------------------
  function renderRecipesView() {
    return `
      <div class="recipes-view">
        <div class="recipes-header glass-panel">
          <div>
            <h3 style="font-family: 'Newsreader', Georgia, serif;">Favorite Recipes Box</h3>
            <p style="color: var(--app-text-muted, #666059); font-size: 0.85rem; margin-top: 2px;">Lunches and dinners with tagged categories and structured ingredient measurements.</p>
          </div>
          <button class="btn-primary-start" data-action="open-add-recipe" style="width: auto; padding: 8px 16px; font-size: 0.84rem;">➕ Add New Recipe</button>
        </div>

        <div class="recipes-grid">
          ${recipes.map(recipe => `
            <div class="recipe-card glass-panel" data-recipe-id="${recipe.id}">
              <div class="recipe-card-header">
                <div class="recipe-title-wrap">
                  <h4 class="recipe-title">${esc(recipe.title)}</h4>
                  <span class="recipe-prep-pill">⏱️ ${recipe.prep_time_minutes}m</span>
                </div>
                <button class="btn-recipe-delete" data-action="delete-recipe" data-id="${recipe.id}" title="Delete recipe" aria-label="Delete recipe">✕</button>
              </div>
              <p class="recipe-desc">${esc(recipe.description || 'No description provided.')}</p>
              <div class="recipe-tags-row">${(recipe.tags || []).map(t => `<span class="recipe-tag-pill">${esc(t)}</span>`).join('')}</div>
              <div class="recipe-ingredients-summary">
                <h5>Ingredients (${recipe.recipe_ingredients?.length || 0}):</h5>
                <div class="recipe-ing-tags">
                  ${(recipe.recipe_ingredients || []).map(ing => `<span class="recipe-ing-item">${ing.quantity ? `${formatQty(Number(ing.quantity))} ${esc(ing.unit || '')}` : ''} ${esc(ing.ingredient_name)}</span>`).join('')}
                </div>
              </div>
              ${recipe.instructions ? `
                <details class="recipe-instructions-details">
                  <summary>View Instructions</summary>
                  <p class="recipe-instructions-text">${esc(recipe.instructions).replace(/\n/g, '<br/>')}</p>
                </details>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  function renderAddRecipeModal() {
    return `
      <div class="mp-sheet-backdrop" data-action="close-sheet">
        <div class="mp-sheet" role="dialog" aria-label="Create recipe">
          <div class="mp-sheet-grab"></div>
          <div class="mp-sheet-head">
            <div><span class="mp-sheet-kicker">Recipe box</span><h3>Create New Recipe</h3></div>
            <button class="mp-sheet-close" data-action="close-sheet" aria-label="Close">&times;</button>
          </div>
          <form id="form-create-recipe" class="mp-sheet-body">
            <div class="form-group"><label>Recipe Title</label>
              <input type="text" id="recipe-in-title" class="text-input" placeholder="e.g. Creamy Tuscan Garlic Gnocchi" required /></div>
            <div style="display: flex; gap: 12px; margin-top: 12px;">
              <div class="form-group" style="flex: 1;"><label>Prep (min)</label>
                <input type="number" id="recipe-in-time" class="text-input" value="25" min="5" max="180" /></div>
              <div class="form-group" style="flex: 2;"><label>Tags (comma separated)</label>
                <input type="text" id="recipe-in-tags" class="text-input" placeholder="quick, sandwich, vegetarian" /></div>
            </div>
            <div class="form-group" style="margin-top: 12px;"><label>Description</label>
              <input type="text" id="recipe-in-desc" class="text-input" placeholder="Short description of the dish" /></div>
            <div class="form-group" style="margin-top: 12px;"><label>Ingredients (one per line, e.g. "250 g spaghetti")</label>
              <textarea id="recipe-in-ingredients" class="text-input" rows="4" placeholder="250 g spaghetti&#10;4 cloves garlic&#10;2 tbsp olive oil" required></textarea></div>
            <div class="form-group" style="margin-top: 12px;"><label>Cooking Instructions</label>
              <textarea id="recipe-in-instructions" class="text-input" rows="4" placeholder="One step per line..."></textarea></div>
            <button type="submit" class="mp-primary-btn" style="margin-top: 18px; width: 100%;">Save Recipe</button>
          </form>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Toast + mobile day observer
  // ---------------------------------------------------------------------------
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'mp-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2800);
  }

  function setupDayObserver() {
    if (!('IntersectionObserver' in window)) return;
    const days = container.querySelectorAll('.mp-day');
    dayObserver = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        focusedDay = en.target.getAttribute('data-day');
        container.querySelectorAll('.mp-pill').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-day') === focusedDay);
        });
      });
    }, { rootMargin: '-25% 0px -60% 0px' });
    days.forEach(d => dayObserver.observe(d));
  }

  // ---------------------------------------------------------------------------
  // Events (delegated on the freshly-rendered shell each time)
  // ---------------------------------------------------------------------------
  function attachEvents() {
    const shell = container.querySelector('.meals-view-shell');
    if (!shell) return;

    shell.querySelectorAll('.subnav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.getAttribute('data-tab');
        sheet = null;
        render();
      });
    });

    shell.addEventListener('click', async (e) => {
      const el = e.target.closest('[data-action]');
      if (!el || !shell.contains(el)) return;
      const action = el.getAttribute('data-action');
      const d = el.getAttribute('data-day');
      const slot = el.getAttribute('data-slot');

      // Backdrop click should only close when clicking the backdrop itself
      if (action === 'close-sheet' && el.classList.contains('mp-sheet-backdrop') && e.target !== el) return;

      switch (action) {
        case 'jump-day': {
          focusedDay = d;
          shell.querySelectorAll('.mp-pill').forEach(p => p.classList.toggle('active', p.getAttribute('data-day') === d));
          shell.querySelector(`#mp-day-${d}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }
        case 'open-sheet':
          sheet = { type: 'recipe', day: d, slot };
          scrollSafeRender();
          break;
        case 'open-picker':
          sheet = { type: 'picker', day: d, slot };
          scrollSafeRender();
          break;
        case 'close-sheet':
          sheet = null;
          showAddRecipe = false;
          scrollSafeRender();
          break;
        case 'choose-recipe': {
          const id = el.getAttribute('data-recipe-id');
          const { day, slot: s } = sheet;
          sheet = null;
          await setRecipe(day, s, id || null);
          scrollSafeRender();
          break;
        }
        case 'suggest': {
          const pick = suggestRecipe(el.getAttribute('data-tag'), usedRecipeIds());
          if (!pick) { toast('Add some recipes first.'); break; }
          await setRecipe(d, slot, pick.id);
          scrollSafeRender();
          break;
        }
        case 'set-prep':
          await setMealPrep(d, el.getAttribute('data-prep') === '1');
          scrollSafeRender();
          break;
        case 'toggle-cooked': {
          const removed = await toggleCooked(sheet.day, sheet.slot);
          scrollSafeRender();
          if (removed?.length) toast(`Used up: ${removed.map(r => r.ingredient_name).join(', ')}`);
          break;
        }
        case 'toggle-staple': {
          const item = pantryItems.find(p => p.id === el.getAttribute('data-id'));
          if (!item) break;
          item.is_staple = !isStapleItem(item);
          if (useDbBasic()) await supabase.from('pantry_items').update({ is_staple: item.is_staple }).eq('id', item.id);
          else localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(pantryItems));
          scrollSafeRender();
          break;
        }
        case 'autofill':
          el.textContent = 'Filling...';
          await autoFillEmptySlots();
          scrollSafeRender();
          break;
        case 'generate-shopping': {
          const added = await generateShoppingList();
          if (added === false) break;
          activeTab = 'shopping';
          render();
          window.scrollTo({ top: 0 });
          toast(added ? `🛒 ${added} item${added > 1 ? 's' : ''} to buy — pantry staples skipped` : 'You already have everything in your pantry! 🎉');
          break;
        }
        case 'delete-shop': {
          const id = el.getAttribute('data-id');
          shoppingItems = shoppingItems.filter(s => s.id !== id);
          if (useDbBasic()) await supabase.from('meal_shopping_items').delete().eq('id', id);
          else localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));
          scrollSafeRender();
          break;
        }
        case 'clear-purchased': {
          e.preventDefault();
          const ids = shoppingItems.filter(s => s.is_checked).map(s => s.id);
          shoppingItems = shoppingItems.filter(s => !s.is_checked);
          if (useDbBasic() && ids.length) await supabase.from('meal_shopping_items').delete().in('id', ids);
          else localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));
          scrollSafeRender();
          break;
        }
        case 'delete-pantry': {
          const id = el.getAttribute('data-id');
          pantryItems = pantryItems.filter(p => p.id !== id);
          if (useDbBasic()) await supabase.from('pantry_items').delete().eq('id', id);
          else localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(pantryItems));
          scrollSafeRender();
          break;
        }
        case 'open-add-recipe':
          showAddRecipe = true;
          scrollSafeRender();
          break;
        case 'delete-recipe': {
          const id = el.getAttribute('data-id');
          if (!confirm('Delete this recipe?')) return;
          await deleteRecipe(id);
          scrollSafeRender();
          break;
        }
      }
    });

    // Shopping checkbox -> straight into the pantry
    shell.addEventListener('change', async (e) => {
      const chk = e.target.closest('.shop-checkbox');
      if (!chk) return;
      await toggleShoppingItem(chk.getAttribute('data-shop-check-id'), chk.checked);
      scrollSafeRender();
    });

    shell.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      if (form.id === 'form-add-shopping-item') await addShoppingItem();
      else if (form.id === 'form-add-pantry') await addPantryItem();
      else if (form.id === 'form-create-recipe') await createRecipe();
    });
  }

  async function toggleShoppingItem(id, isChecked) {
    const target = shoppingItems.find(s => s.id === id);
    if (!target) return;
    target.is_checked = isChecked;
    const norm = normName(target.normalized_name || target.ingredient_name);

    if (isChecked) {
      if (!isInPantry(norm)) {
        pantryItems.push({
          id: generateUUID(),
          household_id: household?.id,
          ingredient_name: target.ingredient_name,
          normalized_name: norm,
          quantity: target.quantity || 1,
          unit: target.unit || '',
          category: target.category || 'Pantry'
        });
      }
    } else {
      pantryItems = pantryItems.filter(p => normName(p.normalized_name || p.ingredient_name) !== norm);
    }

    if (useDbBasic()) {
      // DB trigger upserts/deletes the pantry row; refetch for real ids
      await supabase.from('meal_shopping_items').update({ is_checked: isChecked, updated_at: new Date().toISOString() }).eq('id', id);
      await reloadPantry();
    } else {
      localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));
      localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(pantryItems));
    }
  }

  async function addShoppingItem() {
    const name = container.querySelector('#input-shop-item-name')?.value?.trim();
    const amount = parseAmount(container.querySelector('#input-shop-item-qty')?.value);
    if (!name) return;
    const item = {
      id: generateUUID(),
      household_id: household?.id,
      ingredient_name: name,
      normalized_name: normName(name),
      quantity: amount.quantity,
      unit: amount.unit,
      category: 'Groceries',
      is_checked: false
    };
    if (useDbBasic()) {
      const { data } = await supabase.from('meal_shopping_items').insert([item]).select().single();
      if (data) shoppingItems.unshift(data);
    } else {
      shoppingItems.unshift(item);
      localStorage.setItem(STORAGE_SHOPPING_KEY, JSON.stringify(shoppingItems));
    }
    scrollSafeRender();
  }

  async function addPantryItem() {
    const name = container.querySelector('#input-pantry-name')?.value?.trim();
    const amount = parseAmount(container.querySelector('#input-pantry-qty')?.value);
    if (!name) return;
    const norm = normName(name);
    const item = {
      id: generateUUID(),
      household_id: household?.id,
      ingredient_name: name,
      normalized_name: norm,
      quantity: amount.quantity,
      unit: amount.unit,
      category: 'Pantry'
    };
    if (useDbBasic()) {
      const { error } = await supabase.from('pantry_items').upsert([item], { onConflict: 'household_id,normalized_name' });
      if (error) { toast(`Could not add: ${error.message}`); return; }
      await reloadPantry();
    } else {
      pantryItems = [item, ...pantryItems.filter(p => normName(p.normalized_name) !== norm)];
      localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(pantryItems));
    }
    scrollSafeRender();
  }

  function parseIngredientLine(line) {
    const m = line.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|tbsp|tsp|cups?|cloves?|cans?|whole|pinch|handful|slices?)?\s+(?:of\s+)?(.+)$/i);
    const name = (m ? m[3] : line).trim();
    return {
      ingredient_name: name,
      normalized_name: normName(name),
      quantity: m ? parseFloat(m[1].replace(',', '.')) : 1,
      unit: m ? (m[2] || '') : '',
      category: 'Other'
    };
  }

  async function createRecipe() {
    const q = (id) => container.querySelector(id)?.value?.trim() || '';
    const title = q('#recipe-in-title');
    if (!title) return;
    const time = parseInt(q('#recipe-in-time') || '25', 10);
    const tags = q('#recipe-in-tags').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const parsedIngs = (container.querySelector('#recipe-in-ingredients')?.value || '')
      .split('\n').map(l => l.trim()).filter(Boolean).map(parseIngredientLine);

    const base = { id: generateUUID(), title, description: q('#recipe-in-desc'), instructions: container.querySelector('#recipe-in-instructions')?.value?.trim() || '', prep_time_minutes: time, tags };

    if (useDbBasic()) {
      const { data: created, error } = await supabase.from('recipes').insert([{ ...base, household_id: household.id }]).select().single();
      if (!error && created) {
        if (parsedIngs.length) {
          const ingPayload = parsedIngs.map(i => ({ id: generateUUID(), ...i, recipe_id: created.id }));
          await supabase.from('recipe_ingredients').insert(ingPayload);
          created.recipe_ingredients = ingPayload;
        }
        recipes.unshift(created);
      }
    } else {
      recipes.unshift({ ...base, household_id: household?.id, recipe_ingredients: parsedIngs });
      localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(recipes));
    }
    showAddRecipe = false;
    scrollSafeRender();
  }

  async function deleteRecipe(id) {
    recipes = recipes.filter(r => r.id !== id);
    const affected = planDays.filter(p => p.recipe_id === id);
    const affectedIds = new Set(affected.map(p => p.id));
    const linked = planDays.filter(p => p.source_meal_prep_id && affectedIds.has(p.source_meal_prep_id));
    const changes = newChanges();
    [...affected, ...linked].forEach(p => { if (planDays.includes(p)) removeEntry(p, changes); });

    if (useDbBasic()) {
      await supabase.from('recipes').delete().eq('id', id);
      if (changes.remove.length && useDb()) await persist(changes);
    } else {
      localStorage.setItem(STORAGE_RECIPES_KEY, JSON.stringify(recipes));
      await persist(changes);
    }
  }

  // Past days: use up their ingredients from the pantry, then remove them so
  // the calendar always starts at today and the freed slots appear at the back.
  async function rolloverPastDays() {
    const today = todayStr();
    const past = planDays.filter(p => p.meal_date < today);
    if (!past.length) return false;

    const changes = newChanges();

    // 1. Consume ingredients (once per entry; staples are never auto-removed)
    const used = new Set();
    past.filter(p => !p.ingredients_consumed).forEach(p => {
      collectUsedIngredients(p).forEach(n => used.add(n));
      changes.upsert.push(p);
    });
    await removeFromPantry(used);
    // 2. Drop past entries, except dinners still feeding an upcoming linked lunch
    //    (deleting those would cascade-delete the lunch).
    const stillReferenced = new Set(
      planDays.filter(p => p.meal_date >= today && p.source_meal_prep_id).map(p => p.source_meal_prep_id)
    );
    past.filter(p => !stillReferenced.has(p.id)).forEach(p => removeEntry(p, changes));
    changes.upsert = changes.upsert.filter(p => planDays.includes(p));

    await persist(changes);
    return true;
  }

  async function refreshIfDayChanged() {
    if (!container.isConnected) {
      document.removeEventListener('visibilitychange', onVisible);
      return;
    }
    if (todayStr() === lastRenderedDay) return;
    lastRenderedDay = todayStr();
    focusedDay = lastRenderedDay;
    await rolloverPastDays();
    scrollSafeRender();
  }
  const onVisible = () => { if (document.visibilityState === 'visible') refreshIfDayChanged(); };

  await loadAllData();
  let lastRenderedDay = todayStr();
  await rolloverPastDays();
  document.addEventListener('visibilitychange', onVisible);
  render();
}
