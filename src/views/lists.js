import { 
  getActiveHousehold, 
  supabase, 
  isSupabaseConfigured 
} from '../services/supabase.js';

export async function mountLists(container, navigate) {
  const household = await getActiveHousehold();
  let categories = [];
  let activeCategoryId = null;
  let items = [];
  let filter = 'all'; // 'all', 'todo', 'completed'
  let isAddCategoryOpen = false;

  // Local storage cache keys for demo/offline fallback
  const STORAGE_CATS_KEY = 'andinu_cache_list_categories';
  const STORAGE_ITEMS_KEY = 'andinu_cache_list_items';

  async function loadData() {
    if (isSupabaseConfigured && household?.id) {
      try {
        const { data: cats, error: catErr } = await supabase
          .from('list_categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (!catErr && cats?.length > 0) {
          categories = cats;
        }

        const { data: itms, error: itmErr } = await supabase
          .from('list_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!itmErr && itms) {
          items = itms;
        }
      } catch (err) {
        console.warn('Error loading lists from Supabase:', err);
      }
    }

    // Fallback if no categories yet
    if (categories.length === 0) {
      const cachedCats = localStorage.getItem(STORAGE_CATS_KEY);
      if (cachedCats) {
        categories = JSON.parse(cachedCats);
      } else {
        categories = [
          { id: 'cat-movies', name: 'Movies to Watch', icon: '🎬', display_order: 1 },
          { id: 'cat-vinyl', name: 'Vinyl Records to Buy', icon: '🎵', display_order: 2 },
          { id: 'cat-places', name: 'Places to Visit', icon: '✈️', display_order: 3 }
        ];
        localStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(categories));
      }
    }

    if (items.length === 0 && !isSupabaseConfigured) {
      const cachedItems = localStorage.getItem(STORAGE_ITEMS_KEY);
      if (cachedItems) {
        items = JSON.parse(cachedItems);
      } else {
        items = [
          { id: 'item-1', category_id: categories[0].id, title: 'Past Lives', subtitle_or_note: 'Dir. Celine Song — romantic drama', url: '', is_completed: true },
          { id: 'item-2', category_id: categories[0].id, title: 'Perfect Days', subtitle_or_note: 'Dir. Wim Wenders — cozy Tokyo vibes', url: '', is_completed: false },
          { id: 'item-3', category_id: categories[0].id, title: 'Anatomy of a Fall', subtitle_or_note: 'French courtroom thriller', url: '', is_completed: false },
          { id: 'item-4', category_id: categories[1].id, title: 'Chet Baker Sings', subtitle_or_note: 'Pacific Jazz 1954 reissue', url: '', is_completed: true },
          { id: 'item-5', category_id: categories[1].id, title: 'In Rainbows', subtitle_or_note: 'Radiohead essential pressing', url: '', is_completed: false },
          { id: 'item-6', category_id: categories[2].id, title: 'Kyoto & Kamakura', subtitle_or_note: 'Autumn foliage & matcha teahouses', url: '', is_completed: false },
          { id: 'item-7', category_id: categories[2].id, title: 'Amalfi Coast & Positano', subtitle_or_note: 'Summer road trip & cliffside dining', url: '', is_completed: true }
        ];
        localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
      }
    }

    if (!activeCategoryId && categories.length > 0) {
      activeCategoryId = categories[0].id;
    }
  }

  function render() {
    const activeCat = categories.find(c => c.id === activeCategoryId) || categories[0] || null;

    let filteredItems = items.filter(i => i.category_id === activeCat?.id);
    if (filter === 'todo') {
      filteredItems = filteredItems.filter(i => !i.is_completed);
    } else if (filter === 'completed') {
      filteredItems = filteredItems.filter(i => i.is_completed);
    }

    const totalCount = items.filter(i => i.category_id === activeCat?.id).length;
    const completedCount = items.filter(i => i.category_id === activeCat?.id && i.is_completed).length;

    container.innerHTML = `
      <div class="lists-view-shell">
        <!-- View Header -->
        <div class="view-header">
          <div class="view-header-brand">
            <div class="view-brand-logo">
              <img src="/AndiNu_icon.png" alt="AndiNú Logo" class="brand-mini-logo" />
            </div>
            <div>
              <div class="view-brand-tag">Andino & Núria</div>
              <h1 class="view-title">Our Shared Lists</h1>
              <p class="view-subtitle">Shared wishlists, watchlists & collections</p>
            </div>
          </div>
          <button id="btn-new-category" class="btn-secondary-sm">
            <span>➕</span> New Category
          </button>
        </div>

        <!-- Category Horizontal Tabs -->
        <div class="category-tabs-scroll">
          ${categories.map(cat => {
            const isActive = cat.id === activeCategoryId;
            const catCount = items.filter(i => i.category_id === cat.id && !i.is_completed).length;
            return `
              <button class="category-tab-btn ${isActive ? 'active' : ''}" data-cat-id="${cat.id}">
                <span class="cat-icon">${cat.icon || '📋'}</span>
                <span class="cat-name">${cat.name}</span>
                ${catCount > 0 ? `<span class="cat-badge">${catCount}</span>` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Active Category Header & Filter Controls -->
        <div class="list-controls-bar glass-panel">
          <div class="list-summary-info">
            <span class="list-cat-emoji">${activeCat?.icon || '📋'}</span>
            <div class="list-cat-text">
              <h2 class="active-cat-title">${activeCat?.name || 'List'}</h2>
              <span class="active-cat-progress">${completedCount} of ${totalCount} completed</span>
            </div>
          </div>

          <!-- Filter Pills -->
          <div class="filter-pills-wrap">
            <button class="filter-pill ${filter === 'all' ? 'active' : ''}" data-filter="all">All (${totalCount})</button>
            <button class="filter-pill ${filter === 'todo' ? 'active' : ''}" data-filter="todo">To Do (${totalCount - completedCount})</button>
            <button class="filter-pill ${filter === 'completed' ? 'active' : ''}" data-filter="completed">Done (${completedCount})</button>
          </div>
        </div>

        <!-- Add Item Form -->
        <form id="form-add-item" class="add-item-card glass-panel">
          <div class="add-item-row">
            <input 
              type="text" 
              id="input-item-title" 
              class="text-input" 
              placeholder="Add an item to ${activeCat?.name || 'this list'}..." 
              required
            />
            <button type="submit" class="btn-primary-start" style="width: auto; padding: 0 18px;">
              Add
            </button>
          </div>
          <div class="add-item-extras">
            <input 
              type="text" 
              id="input-item-note" 
              class="text-input-subtle" 
              placeholder="Optional note / artist / city / year..."
            />
            <input 
              type="url" 
              id="input-item-url" 
              class="text-input-subtle" 
              placeholder="Optional link (https://...)"
            />
          </div>
        </form>

        <!-- List Items Collection -->
        <div class="items-collection">
          ${filteredItems.length > 0 ? `
            <div class="items-stack">
              ${filteredItems.map(item => `
                <div class="item-card glass-panel ${item.is_completed ? 'is-completed' : ''}" data-item-id="${item.id}">
                  <label class="custom-checkbox-wrap">
                    <input 
                      type="checkbox" 
                      class="item-checkbox" 
                      data-check-id="${item.id}" 
                      ${item.is_completed ? 'checked' : ''}
                    />
                    <span class="checkbox-box"></span>
                  </label>

                  <div class="item-text-content">
                    <span class="item-name">${escapeHtml(item.title)}</span>
                    ${item.subtitle_or_note ? `
                      <span class="item-note">${escapeHtml(item.subtitle_or_note)}</span>
                    ` : ''}
                    ${item.url ? `
                      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="item-link">
                        🔗 Open Link
                      </a>
                    ` : ''}
                  </div>

                  ${item.is_completed ? `
                    <span class="item-stamp-badge">
                      ${(activeCat?.name || '').toLowerCase().includes('movie') ? 'WATCHED' : 
                        (activeCat?.name || '').toLowerCase().includes('vinyl') ? 'OWNED' : 
                        (activeCat?.name || '').toLowerCase().includes('place') ? 'VISITED' : 'COLLECTED'}
                    </span>
                  ` : ''}

                  <button class="btn-item-delete" data-delete-id="${item.id}" title="Delete item">
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
              <span class="empty-icon">${activeCat?.icon || '📋'}</span>
              <h3>No items in this view</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
                ${filter === 'completed' ? 'Nothing marked complete yet.' : 'Add your first item using the box above!'}
              </p>
            </div>
          `}
        </div>

        <!-- New Category Modal -->
        <div id="modal-new-category" class="modal-backdrop" style="${isAddCategoryOpen ? 'display: flex;' : 'display: none;'}">
          <div class="modal-dialog glass-panel">
            <div class="modal-header">
              <h3>Create New Category</h3>
              <button id="btn-close-cat-modal" class="modal-close">&times;</button>
            </div>
            <form id="form-create-category" class="modal-body">
              <div class="form-group">
                <label for="input-cat-name">Category Name</label>
                <input 
                  type="text" 
                  id="input-cat-name" 
                  class="text-input" 
                  placeholder="e.g. Books to Read, Board Games..." 
                  required
                />
              </div>

              <div class="form-group" style="margin-top: 14px;">
                <label>Select Icon</label>
                <div class="emoji-picker-grid">
                  ${['📚', '🎲', '☕', '🏕️', '🎨', '🎧', '🍷', '🌿', '💡', '🎸', '🎯', '🥐'].map(emoji => `
                    <button type="button" class="emoji-choice-btn" data-emoji="${emoji}">${emoji}</button>
                  `).join('')}
                </div>
                <input type="hidden" id="input-cat-emoji" value="📚" />
              </div>

              <button type="submit" class="btn-primary-start" style="margin-top: 20px;">
                Create Category
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Category tabs
    container.querySelectorAll('.category-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategoryId = btn.getAttribute('data-cat-id');
        render();
      });
    });

    // Filter pills
    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        filter = pill.getAttribute('data-filter');
        render();
      });
    });

    // Checkbox toggle
    container.querySelectorAll('.item-checkbox').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const id = chk.getAttribute('data-check-id');
        const isChecked = e.target.checked;
        const targetItem = items.find(i => i.id === id);
        if (targetItem) {
          targetItem.is_completed = isChecked;
          targetItem.completed_at = isChecked ? new Date().toISOString() : null;
        }

        // Optimistic UI update
        const parentCard = chk.closest('.item-card');
        if (parentCard) {
          parentCard.classList.toggle('is-completed', isChecked);
        }

        // Supabase sync
        if (isSupabaseConfigured) {
          await supabase
            .from('list_items')
            .update({
              is_completed: isChecked,
              completed_at: isChecked ? new Date().toISOString() : null
            })
            .eq('id', id);
        } else {
          localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
        }

        render();
      });
    });

    // Add item form
    const addForm = container.querySelector('#form-add-item');
    addForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = container.querySelector('#input-item-title');
      const noteInput = container.querySelector('#input-item-note');
      const urlInput = container.querySelector('#input-item-url');

      const title = titleInput?.value?.trim();
      const note = noteInput?.value?.trim() || '';
      const url = urlInput?.value?.trim() || '';

      if (!title || !activeCategoryId) return;

      const newItem = {
        id: isSupabaseConfigured ? undefined : `local-${Date.now()}`,
        household_id: household.id,
        category_id: activeCategoryId,
        title,
        subtitle_or_note: note,
        url,
        is_completed: false,
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('list_items')
          .insert([newItem])
          .select()
          .single();

        if (error) {
          console.error('Supabase error inserting list item:', error);
          alert(`Supabase Error (${error.code || 'DB'}): ${error.message}\n\nPlease verify that the database migrations have been executed in your Supabase project.`);
          return;
        }

        if (data) {
          items.unshift(data);
        }
      } else {
        items.unshift(newItem);
        localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
      }

      render();
    });

    // Delete item
    container.querySelectorAll('.btn-item-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        if (!confirm('Delete this item?')) return;

        items = items.filter(i => i.id !== id);

        if (isSupabaseConfigured) {
          await supabase.from('list_items').delete().eq('id', id);
        } else {
          localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
        }

        render();
      });
    });

    // New Category Modal
    const btnNewCat = container.querySelector('#btn-new-category');
    const modalCat = container.querySelector('#modal-new-category');
    const btnCloseModal = container.querySelector('#btn-close-cat-modal');

    btnNewCat?.addEventListener('click', () => {
      isAddCategoryOpen = true;
      modalCat.style.display = 'flex';
    });

    btnCloseModal?.addEventListener('click', () => {
      isAddCategoryOpen = false;
      modalCat.style.display = 'none';
    });

    modalCat?.addEventListener('click', (e) => {
      if (e.target === modalCat) {
        isAddCategoryOpen = false;
        modalCat.style.display = 'none';
      }
    });

    // Emoji Picker
    const emojiHiddenInput = container.querySelector('#input-cat-emoji');
    container.querySelectorAll('.emoji-choice-btn').forEach(emojiBtn => {
      emojiBtn.addEventListener('click', () => {
        container.querySelectorAll('.emoji-choice-btn').forEach(b => b.classList.remove('selected'));
        emojiBtn.classList.add('selected');
        if (emojiHiddenInput) {
          emojiHiddenInput.value = emojiBtn.getAttribute('data-emoji') || '📋';
        }
      });
    });

    // Form create category
    const catForm = container.querySelector('#form-create-category');
    catForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = container.querySelector('#input-cat-name');
      const name = nameInput?.value?.trim();
      const icon = emojiHiddenInput?.value || '📋';

      if (!name) return;

      const newCat = {
        id: isSupabaseConfigured ? undefined : `cat-${Date.now()}`,
        household_id: household.id,
        name,
        icon,
        display_order: categories.length + 1
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('list_categories')
          .insert([newCat])
          .select()
          .single();

        if (error) {
          console.error('Supabase error creating category:', error);
          alert(`Supabase Error (${error.code || 'DB'}): ${error.message}\n\nPlease verify that the database migrations have been executed in your Supabase project.`);
          return;
        }

        if (data) {
          categories.push(data);
          activeCategoryId = data.id;
        }
      } else {
        categories.push(newCat);
        activeCategoryId = newCat.id;
        localStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(categories));
      }

      isAddCategoryOpen = false;
      render();
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  await loadData();
  render();
}

