-- ==============================================================================
-- AndiNu.cc Seed Data
-- ==============================================================================

-- 1. Default Household (Used for initial local/staging setup)
INSERT INTO public.households (id, name)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Andino & Núria (AndiNú)')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Default List Categories
INSERT INTO public.list_categories (id, household_id, name, icon, display_order)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Movies to Watch', '🎬', 1),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Vinyl Records to Buy', '🎵', 2),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Places to Visit', '✈️', 3)
ON CONFLICT (id) DO NOTHING;

-- 3. Sample List Items
INSERT INTO public.list_items (household_id, category_id, title, subtitle_or_note, url, is_completed, display_order)
VALUES 
  -- Movies
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Past Lives', 'Dir. Celine Song — romantic drama', '', true, 1),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Perfect Days', 'Dir. Wim Wenders — cozy Tokyo vibes', '', false, 2),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'La La Land', 'Rewatch night with wine', '', true, 3),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Anatomy of a Fall', 'French legal thriller', '', false, 4),

  -- Vinyl Records
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Chet Baker Sings', 'Chet Baker — Pacific Jazz 1954 reissue', '', true, 1),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'In Rainbows', 'Radiohead — essential vinyl listening', '', false, 2),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Blonde', 'Frank Ocean — bootleg or official repress', '', false, 3),

  -- Places to Visit
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Kyoto & Kamakura', 'Autumn foliage and matcha teahouses', '', false, 1),
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Amalfi Coast & Positano', 'Summer road trip, cliffside dining', '', true, 2),
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Lisbon & Sintra', 'Pastel de nata & cozy viewpoints', '', false, 3)
ON CONFLICT DO NOTHING;

-- 4. Initial Pantry Items
INSERT INTO public.pantry_items (household_id, ingredient_name, normalized_name, quantity, unit, category)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Extra Virgin Olive Oil', 'extra virgin olive oil', 1, 'bottle', 'Pantry'),
  ('a0000000-0000-0000-0000-000000000001', 'Garlic', 'garlic', 4, 'cloves', 'Produce'),
  ('a0000000-0000-0000-0000-000000000001', 'Spaghetti', 'spaghetti', 500, 'g', 'Dry Goods'),
  ('a0000000-0000-0000-0000-000000000001', 'Red Chili Flakes', 'red chili flakes', 1, 'jar', 'Spices'),
  ('a0000000-0000-0000-0000-000000000001', 'Parmesan Cheese', 'parmesan cheese', 100, 'g', 'Dairy'),
  ('a0000000-0000-0000-0000-000000000001', 'Sea Salt', 'sea salt', 1, 'pinch', 'Spices')
ON CONFLICT (household_id, normalized_name) DO NOTHING;

-- 5. Curated Starter Recipes
INSERT INTO public.recipes (id, household_id, title, description, instructions, prep_time_minutes, tags)
VALUES 
  (
    'r0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Spaghetti Aglio, Olio e Peperoncino',
    'Classic Roman midnight pasta: garlic gently infused in golden olive oil with red pepper flakes and fresh parsley.',
    '1. Bring a pot of salted water to boil and drop in spaghetti. Cook until 2 min shy of al dente.
2. In a wide pan over low heat, gently warm olive oil and thinly sliced garlic until golden and fragrant.
3. Add chili flakes. Ladle 1/2 cup pasta water into the pan to emulsify.
4. Transfer spaghetti directly into the pan, tossing vigorously.
5. Finish with fresh parsley and grated parmesan.',
    15,
    ARRAY['quick', 'pasta', 'comfort', 'vegetarian']
  ),
  (
    'r0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Mediterranean Chickpea & Avocado Bowl',
    'Crisp cucumbers, cherry tomatoes, creamy avocado, kalamata olives, and herb-tossed chickpeas with lemon tahini.',
    '1. Rinse and drain chickpeas, pat dry.
2. Dice cucumbers, halved cherry tomatoes, and avocado.
3. Whisk together lemon juice, olive oil, garlic, salt, and tahini.
4. Toss everything in a large bowl, garnish with fresh dill and crumbled feta.',
    20,
    ARRAY['quick', 'healthy', 'vegetarian', 'salad']
  ),
  (
    'r0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Sheet Pan Crispy Salmon & Roasted Greens',
    'Tender salmon fillets brushed with honey-dijon glaze alongside roasted broccolini and baby potatoes.',
    '1. Preheat oven to 200°C (400°F).
2. Halve baby potatoes and toss with olive oil, salt, and rosemary. Roast for 15 min.
3. Push potatoes to the side; add broccolini and salmon fillets.
4. Brush salmon with honey, whole-grain mustard, and lemon juice.
5. Roast for another 12-14 min until salmon flakes easily and edges are crisp.',
    30,
    ARRAY['healthy', 'weekend', 'high-protein']
  )
ON CONFLICT (id) DO NOTHING;

-- Ingredients for Spaghetti Aglio e Olio
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, normalized_name, quantity, unit, category)
VALUES 
  ('r0000000-0000-0000-0000-000000000001', 'Spaghetti', 'spaghetti', 250, 'g', 'Dry Goods'),
  ('r0000000-0000-0000-0000-000000000001', 'Extra Virgin Olive Oil', 'extra virgin olive oil', 4, 'tbsp', 'Pantry'),
  ('r0000000-0000-0000-0000-000000000001', 'Garlic', 'garlic', 4, 'cloves', 'Produce'),
  ('r0000000-0000-0000-0000-000000000001', 'Red Chili Flakes', 'red chili flakes', 1, 'tsp', 'Spices'),
  ('r0000000-0000-0000-0000-000000000001', 'Parmesan Cheese', 'parmesan cheese', 40, 'g', 'Dairy')
ON CONFLICT DO NOTHING;

-- Ingredients for Chickpea & Avocado Bowl
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, normalized_name, quantity, unit, category)
VALUES 
  ('r0000000-0000-0000-0000-000000000002', 'Canned Chickpeas', 'canned chickpeas', 1, 'can', 'Canned Goods'),
  ('r0000000-0000-0000-0000-000000000002', 'Avocado', 'avocado', 1, 'whole', 'Produce'),
  ('r0000000-0000-0000-0000-000000000002', 'Cherry Tomatoes', 'cherry tomatoes', 150, 'g', 'Produce'),
  ('r0000000-0000-0000-0000-000000000002', 'Cucumber', 'cucumber', 1, 'whole', 'Produce'),
  ('r0000000-0000-0000-0000-000000000002', 'Extra Virgin Olive Oil', 'extra virgin olive oil', 2, 'tbsp', 'Pantry'),
  ('r0000000-0000-0000-0000-000000000002', 'Lemon', 'lemon', 1, 'whole', 'Produce')
ON CONFLICT DO NOTHING;

