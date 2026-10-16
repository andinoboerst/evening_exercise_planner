import { 
  getActiveHousehold, 
  supabase, 
  isSupabaseConfigured,
  generateUUID
} from '../services/supabase.js';

export async function mountLists(container, navigate) {
  const household = await getActiveHousehold();
  let categories = [];
  let activeCategoryId = null;
  let items = [];
  let filter = 'all'; // 'all', 'todo', 'completed'
  let categoryModal = null; // null | 'new' | 'edit'
  let editingItemId = null;

  // Stamp shown on completed items. Per-category and editable; defaults are generic.
  function completedLabel(cat) {
    if (cat?.completed_label) return cat.completed_label;
    const n = (cat?.name || '').toLowerCase();
    if (n.includes('movie')) return 'Watched';
    if (n.includes('vinyl')) return 'Owned';
    if (n.includes('place')) return 'Visited';
    return 'Done';
  }

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
          .order('is_completed', { ascending: true })
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

    // Sort pending items to the top, completed items below
    filteredItems.sort((a, b) => {
      const aDone = Boolean(a.is_completed);
      const bDone = Boolean(b.is_completed);
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

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
                <span class="cat-name">${escapeHtml(cat.name)}</span>
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
              <h2 class="active-cat-title">${escapeHtml(activeCat?.name || 'List')}</h2>
              <span class="active-cat-progress">${completedCount} of ${totalCount} ${escapeHtml(completedLabel(activeCat).toLowerCase())}</span>
            </div>
            ${activeCat ? `<button id="btn-edit-category" class="btn-secondary-sm" title="Edit or delete this category" style="margin-left: 8px;">✏️ Edit</button>` : ''}
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
              placeholder="Add an item to ${escapeHtml(activeCat?.name || 'this list')}..." 
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
                      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="item-link">
                        🔗 Open Link
                      </a>
                    ` : ''}
                  </div>

                  ${item.is_completed ? `
                    <span class="item-stamp-badge">${escapeHtml(completedLabel(activeCat).toUpperCase())}</span>
                  ` : ''}

                  <button class="btn-item-edit" data-edit-id="${item.id}" title="Edit item" aria-label="Edit item">✏️</button>
                  <button class="btn-item-delete" data-delete-id="${item.id}" title="Delete item" aria-label="Delete item">
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

        ${renderCategoryModal(activeCat)}
        ${renderItemModal()}
      </div>
    `;

    attachEvents();
  }

  function renderCategoryModal(activeCat) {
    if (!categoryModal) return '';
    const isEdit = categoryModal === 'edit' && activeCat;
    const icon = isEdit ? (activeCat.icon || '📋') : '📚';
    const emojis = ['📚', '🎲', '☕', '🏕️', '🎨', '🎧', '🍷', '🌿', '💡', '🎸', '🎯', '🥐'];
    if (!emojis.includes(icon)) emojis.unshift(icon);
    return `
      <div id="modal-new-category" class="modal-backdrop" style="display: flex;">
        <div class="modal-dialog glass-panel">
          <div class="modal-header">
            <h3>${isEdit ? 'Edit Category' : 'Create New Category'}</h3>
            <button id="btn-close-cat-modal" class="modal-close">&times;</button>
          </div>
          <form id="form-create-category" class="modal-body">
            <div class="form-group">
              <label for="input-cat-name">Category Name</label>
              <input type="text" id="input-cat-name" class="text-input" placeholder="e.g. Books to Read, Board Games..." value="${isEdit ? escapeHtml(activeCat.name) : ''}" required />
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label for="input-cat-label">Label when an item is completed</label>
              <input type="text" id="input-cat-label" class="text-input" maxlength="20" placeholder="Done" value="${isEdit ? escapeHtml(completedLabel(activeCat)) : 'Done'}" />
              <small style="color: var(--text-muted);">e.g. Done, Read, Tried, Watched, Visited, Owned</small>
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label>Select Icon</label>
              <div class="emoji-picker-grid">
                ${emojis.map(emoji => `
                  <button type="button" class="emoji-choice-btn ${emoji === icon ? 'selected' : ''}" data-emoji="${emoji}">${emoji}</button>
                `).join('')}
              </div>
              <input type="hidden" id="input-cat-emoji" value="${icon}" />
            </div>

            <button type="submit" class="btn-primary-start" style="margin-top: 20px;">${isEdit ? 'Save Changes' : 'Create Category'}</button>
            ${isEdit ? `<button type="button" id="btn-delete-category" class="btn-secondary" style="margin-top: 10px; width: 100%; color: #D95D39;">🗑 Delete category &amp; its items</button>` : ''}
          </form>
        </div>
      </div>`;
  }

  function renderItemModal() {
    const item = items.find(i => i.id === editingItemId);
    if (!item) return '';
    return `
      <div id="modal-edit-item" class="modal-backdrop" style="display: flex;">
        <div class="modal-dialog glass-panel">
          <div class="modal-header">
            <h3>Edit Item</h3>
            <button id="btn-close-item-modal" class="modal-close">&times;</button>
          </div>
          <form id="form-edit-item" class="modal-body">
            <div class="form-group">
              <label for="edit-item-title">Title</label>
              <input type="text" id="edit-item-title" class="text-input" value="${escapeHtml(item.title)}" required />
            </div>
            <div class="form-group" style="margin-top: 12px;">
              <label for="edit-item-note">Note</label>
              <input type="text" id="edit-item-note" class="text-input" value="${escapeHtml(item.subtitle_or_note || '')}" />
            </div>
            <div class="form-group" style="margin-top: 12px;">
              <label for="edit-item-url">Link</label>
              <input type="url" id="edit-item-url" class="text-input" value="${escapeHtml(item.url || '')}" placeholder="https://..." />
            </div>
            <button type="submit" class="btn-primary-start" style="margin-top: 20px;">Save Changes</button>
          </form>
        </div>
      </div>`;
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
        id: generateUUID(),
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

    // Edit item: open modal
    container.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingItemId = btn.getAttribute('data-edit-id');
        render();
      });
    });

    const closeItemModal = () => { editingItemId = null; render(); };
    container.querySelector('#btn-close-item-modal')?.addEventListener('click', closeItemModal);
    const itemModal = container.querySelector('#modal-edit-item');
    itemModal?.addEventListener('click', (e) => { if (e.target === itemModal) closeItemModal(); });

    container.querySelector('#form-edit-item')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const item = items.find(i => i.id === editingItemId);
      if (!item) return;
      const title = container.querySelector('#edit-item-title')?.value?.trim();
      if (!title) return;
      const patch = {
        title,
        subtitle_or_note: container.querySelector('#edit-item-note')?.value?.trim() || '',
        url: container.querySelector('#edit-item-url')?.value?.trim() || ''
      };

      if (isSupabaseConfigured) {
        const { error } = await supabase.from('list_items').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', item.id);
        if (error) { alert(`Could not save: ${error.message}`); return; }
      }
      Object.assign(item, patch);
      if (!isSupabaseConfigured) localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
      editingItemId = null;
      render();
    });

    // New / edit category modal
    const btnNewCat = container.querySelector('#btn-new-category');
    const modalCat = container.querySelector('#modal-new-category');
    const btnCloseModal = container.querySelector('#btn-close-cat-modal');
    const closeCatModal = () => { categoryModal = null; render(); };

    btnNewCat?.addEventListener('click', () => { categoryModal = 'new'; render(); });
    container.querySelector('#btn-edit-category')?.addEventListener('click', () => { categoryModal = 'edit'; render(); });
    btnCloseModal?.addEventListener('click', closeCatModal);
    modalCat?.addEventListener('click', (e) => { if (e.target === modalCat) closeCatModal(); });

    container.querySelector('#btn-delete-category')?.addEventListener('click', async () => {
      const cat = categories.find(c => c.id === activeCategoryId);
      if (!cat) return;
      const count = items.filter(i => i.category_id === cat.id).length;
      if (!confirm(`Delete "${cat.name}"${count ? ` and its ${count} item${count > 1 ? 's' : ''}` : ''}? This can't be undone.`)) return;

      if (isSupabaseConfigured) {
        const { error } = await supabase.from('list_categories').delete().eq('id', cat.id);
        if (error) { alert(`Could not delete: ${error.message}`); return; }
      }
      categories = categories.filter(c => c.id !== cat.id);
      items = items.filter(i => i.category_id !== cat.id);
      activeCategoryId = categories[0]?.id || null;
      if (!isSupabaseConfigured) {
        localStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(categories));
        localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
      }
      categoryModal = null;
      render();
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
      const label = container.querySelector('#input-cat-label')?.value?.trim() || 'Done';

      // Edit existing category
      if (categoryModal === 'edit') {
        const cat = categories.find(c => c.id === activeCategoryId);
        if (!cat) return;
        const patch = { name, icon, completed_label: label };
        if (isSupabaseConfigured) {
          const { error } = await supabase.from('list_categories').update(patch).eq('id', cat.id);
          if (error) {
            alert(`Could not save: ${error.message}\n\nMake sure the latest database migration has been applied.`);
            return;
          }
        }
        Object.assign(cat, patch);
        if (!isSupabaseConfigured) localStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(categories));
        categoryModal = null;
        render();
        return;
      }

      const newCat = {
        id: generateUUID(),
        household_id: household.id,
        name,
        icon,
        completed_label: label,
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

      categoryModal = null;
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

