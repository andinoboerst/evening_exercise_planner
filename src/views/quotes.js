import { 
  getActiveHousehold, 
  supabase, 
  isSupabaseConfigured,
  generateUUID
} from '../services/supabase.js';

export async function mountQuotes(container, navigate) {
  const household = await getActiveHousehold();
  
  // State
  let quotes = [];
  let filter = 'all'; // 'all', 'nuria', 'andino', 'fridge', 'mirror'
  let isModalOpen = false;
  let editingQuoteId = null;
  let activePickerQuoteId = null;

  // Local storage cache key
  const STORAGE_QUOTES_KEY = 'andinu_cache_quotes';

  // Available reaction emojis
  const REACTION_EMOJIS = ['💗', '😂', '🧉', '💋', '👀', '🔥', '🐈', '✨'];

  // Curated starter quotes with authentic fridge/mirror whiteboard vibes
  const STARTER_QUOTES = [
    {
      id: 'q-1',
      quote_text: "If we eat the cookies standing up by the pantry, the calories don't count.",
      author_speaker: 'Núria 💗',
      context_or_location: 'Pinned to the fridge',
      style_variant: 'sticky-yellow',
      magnet_icon: '🧲',
      reactions: ['💗', '😂'],
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'q-2',
      quote_text: "Please remember that you love me before you inspect how I loaded the dishwasher.",
      author_speaker: 'Núria 💗',
      context_or_location: 'Written in marker on bathroom mirror',
      style_variant: 'mirror-marker',
      magnet_icon: '🪞',
      reactions: ['💋', '😂'],
      created_at: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 'q-3',
      quote_text: "I wasn't asleep, I was just resting my eyes while aggressively listening.",
      author_speaker: 'Andino 🧉',
      context_or_location: 'On the sofa during movie night',
      style_variant: 'sticky-mint',
      magnet_icon: '🥑',
      reactions: ['🧉', '👀'],
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 'q-4',
      quote_text: "I went to the supermarket for oat milk and somehow returned with three vinyl records.",
      author_speaker: 'Andino 🧉',
      context_or_location: 'Kitchen counter confession',
      style_variant: 'fridge-magnet',
      magnet_icon: '🍋',
      reactions: ['😂', '🔥'],
      created_at: new Date(Date.now() - 86400000 * 7).toISOString()
    },
    {
      id: 'q-5',
      quote_text: "We should adopt a cat. Or maybe two cats and a puppy.",
      author_speaker: 'Núria 💗',
      context_or_location: 'Lipstick note on hallway mirror',
      style_variant: 'sticky-pink',
      magnet_icon: '🐈',
      reactions: ['💗', '🐈'],
      created_at: new Date(Date.now() - 86400000 * 9).toISOString()
    }
  ];

  function formatSpeaker(name) {
    if (!name) return 'Núria 💗';
    const clean = String(name).trim();
    const lower = clean.toLowerCase();
    if (lower === 'núria' || lower === 'nuria' || lower.includes('núria') || lower.includes('nuria')) {
      return 'Núria 💗';
    }
    if (lower === 'andino' || lower === 'andi' || lower.includes('andino') || lower.includes('andi')) {
      return 'Andino 🧉';
    }
    return clean;
  }

  async function loadData() {
    if (isSupabaseConfigured && household?.id) {
      try {
        const { data, error } = await supabase
          .from('household_quotes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          quotes = data.map(q => ({
            ...q,
            author_speaker: formatSpeaker(q.author_speaker),
            reactions: Array.isArray(q.reactions) ? q.reactions : []
          }));
        } else if (!error && data && data.length === 0) {
          // Auto-seed starter quotes to Supabase for this household
          const payload = STARTER_QUOTES.map(q => ({
            id: generateUUID(),
            household_id: household.id,
            quote_text: q.quote_text,
            author_speaker: q.author_speaker,
            context_or_location: q.context_or_location,
            style_variant: q.style_variant,
            magnet_icon: q.magnet_icon,
            reactions: q.reactions || [],
            created_at: q.created_at
          }));
          const { data: created } = await supabase
            .from('household_quotes')
            .insert(payload)
            .select();
          if (created) quotes = created;
        }
      } catch (err) {
        console.warn('Error loading quotes from Supabase:', err);
      }
    }

    if (quotes.length === 0) {
      const cached = localStorage.getItem(STORAGE_QUOTES_KEY);
      quotes = cached ? JSON.parse(cached) : [...STARTER_QUOTES];
      // Normalize cached entries
      quotes = quotes.map(q => ({
        ...q,
        author_speaker: formatSpeaker(q.author_speaker),
        reactions: Array.isArray(q.reactions) ? q.reactions : []
      }));
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  }

  function render() {
    // Filter quotes
    let filtered = [...quotes];
    if (filter === 'nuria') {
      filtered = filtered.filter(q => (q.author_speaker || '').toLowerCase().includes('núria') || (q.author_speaker || '').toLowerCase().includes('nuria'));
    } else if (filter === 'andino') {
      filtered = filtered.filter(q => (q.author_speaker || '').toLowerCase().includes('andino') || (q.author_speaker || '').toLowerCase().includes('andi'));
    } else if (filter === 'fridge') {
      filtered = filtered.filter(q => q.style_variant === 'fridge-magnet' || (q.context_or_location || '').toLowerCase().includes('fridge'));
    } else if (filter === 'mirror') {
      filtered = filtered.filter(q => q.style_variant === 'mirror-marker' || (q.context_or_location || '').toLowerCase().includes('mirror'));
    }

    const nuriaCount = quotes.filter(q => (q.author_speaker || '').toLowerCase().includes('núria') || (q.author_speaker || '').toLowerCase().includes('nuria')).length;
    const andinoCount = quotes.filter(q => (q.author_speaker || '').toLowerCase().includes('andino') || (q.author_speaker || '').toLowerCase().includes('andi')).length;

    container.innerHTML = `
      <div class="quotes-view-shell">
        <!-- Header -->
        <div class="quotes-header">
          <div class="quotes-header-text">
            <div class="quotes-tag-pill">
              <span>🧲 Fridge &amp; Mirror Board</span>
            </div>
            <h1 class="quotes-title">Our Words &amp; Phrases</h1>
            <p class="quotes-subtitle">Funny things said, lipstick mirror scribbles, and fridge magnet quotes.</p>
          </div>
          <button id="btn-open-add-quote" class="quotes-primary-action-btn">
            <span>📌</span> Stick a Note
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="quotes-filter-bar glass-panel">
          <button class="quotes-filter-pill ${filter === 'all' ? 'active' : ''}" data-filter="all">
            All Board (${quotes.length})
          </button>
          <button class="quotes-filter-pill ${filter === 'nuria' ? 'active' : ''}" data-filter="nuria">
            Núria 💗 (${nuriaCount})
          </button>
          <button class="quotes-filter-pill ${filter === 'andino' ? 'active' : ''}" data-filter="andino">
            Andino 🧉 (${andinoCount})
          </button>
          <button class="quotes-filter-pill ${filter === 'fridge' ? 'active' : ''}" data-filter="fridge">
            Fridge 🧲
          </button>
          <button class="quotes-filter-pill ${filter === 'mirror' ? 'active' : ''}" data-filter="mirror">
            Mirror 🪞
          </button>
        </div>

        <!-- The Pinboard / Whiteboard Grid -->
        <div class="quotes-pinboard-surface">
          ${filtered.length > 0 ? `
            <div class="quotes-grid">
              ${filtered.map((q, idx) => {
                const rotationClass = `rotate-tilt-${(idx % 6) + 1}`;
                const cardReactions = Array.isArray(q.reactions) ? q.reactions : [];
                const isPickerOpen = activePickerQuoteId === q.id;

                return `
                  <article class="quote-card style-${q.style_variant || 'sticky-yellow'} ${rotationClass}" data-quote-id="${q.id}">
                    <!-- Pin / Magnet header -->
                    <div class="quote-magnet-head" title="${escapeHtml(q.magnet_icon || '🧲')}">
                      <span class="quote-magnet-icon">${q.magnet_icon || '🧲'}</span>
                    </div>

                    <!-- Quote Body -->
                    <div class="quote-card-content">
                      <p class="quote-main-text">“${escapeHtml(q.quote_text)}”</p>
                    </div>

                    <!-- Attribution & Context -->
                    <div class="quote-attribution-wrap">
                      <div class="quote-author-name">— ${escapeHtml(formatSpeaker(q.author_speaker))}</div>
                      ${q.context_or_location ? `
                        <div class="quote-context-location">
                          <span>📍</span>
                          <span>${escapeHtml(q.context_or_location)}</span>
                        </div>
                      ` : ''}
                    </div>

                    <!-- Reactions Strip (No counters, purely visual emoji stickers) -->
                    <div class="quote-reactions-strip">
                      <div class="quote-stamps-wrap">
                        ${cardReactions.map(emoji => `
                          <button 
                            class="quote-reaction-stamp" 
                            data-action="toggle-reaction" 
                            data-id="${q.id}" 
                            data-emoji="${emoji}" 
                            title="Remove ${emoji} sticker"
                          >
                            <span>${emoji}</span>
                          </button>
                        `).join('')}

                        <!-- Add Reaction Trigger -->
                        <div class="reaction-picker-anchor">
                          <button 
                            class="btn-quote-react-add ${isPickerOpen ? 'active' : ''}" 
                            data-action="toggle-picker" 
                            data-id="${q.id}" 
                            title="Stick an emoji reaction"
                          >
                            <span>✨</span>
                          </button>

                          ${isPickerOpen ? `
                            <div class="reaction-popover-tray glass-panel">
                              ${REACTION_EMOJIS.map(em => `
                                <button 
                                  class="reaction-popover-item ${cardReactions.includes(em) ? 'selected' : ''}" 
                                  data-action="pick-reaction" 
                                  data-id="${q.id}" 
                                  data-emoji="${em}"
                                  title="${cardReactions.includes(em) ? 'Remove ' + em : 'Stick ' + em}"
                                >
                                  ${em}
                                </button>
                              `).join('')}
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    </div>

                    <!-- Card Actions Footer -->
                    <div class="quote-card-footer">
                      <span class="quote-date-label">${formatDate(q.created_at)}</span>

                      <div class="quote-footer-actions">
                        <button class="btn-quote-icon-sm" data-action="edit-quote" data-id="${q.id}" title="Edit note">
                          ✏️
                        </button>
                        <button class="btn-quote-icon-sm" data-action="delete-quote" data-id="${q.id}" title="Unpin note">
                          🗑
                        </button>
                      </div>
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="quotes-empty-state glass-panel text-center">
              <span class="empty-board-icon">🧲</span>
              <h3>This section of the board is empty</h3>
              <p>Stick a funny quote or mirror scribble to start this collection!</p>
              <button id="btn-empty-add-quote" class="quotes-primary-action-btn" style="margin-top: 14px;">
                <span>📌</span> Stick a Note
              </button>
            </div>
          `}
        </div>

        <!-- Add / Edit Modal -->
        ${renderModal()}
      </div>
    `;

    attachEvents();
  }

  function renderModal() {
    if (!isModalOpen) return '';

    const editingQuote = editingQuoteId ? quotes.find(q => q.id === editingQuoteId) : null;
    const isEdit = Boolean(editingQuote);

    const activeStyle = editingQuote?.style_variant || 'sticky-yellow';
    const activeMagnet = editingQuote?.magnet_icon || '🧲';
    const activeAuthor = editingQuote ? formatSpeaker(editingQuote.author_speaker) : 'Núria 💗';
    const activeContext = editingQuote?.context_or_location || 'Pinned to the fridge';
    const activeText = editingQuote?.quote_text || '';

    const STYLES = [
      { id: 'sticky-yellow', label: 'Yellow Post-It', color: '#FEF08A' },
      { id: 'fridge-magnet', label: 'Fridge Magnet Tile', color: '#FFFFFF' },
      { id: 'mirror-marker', label: 'Mirror Glass', color: '#E0F2FE' },
      { id: 'sticky-pink', label: 'Pastel Rose', color: '#FCE7F3' },
      { id: 'sticky-mint', label: 'Mint Leaf', color: '#DCFCE7' },
      { id: 'sticky-blue', label: 'Sky Blue', color: '#E0F2FE' }
    ];

    const MAGNETS = ['🧲', '📌', '🥑', '🍋', '🐈', '🍓', '⭐️', '☕', '🥐', '❤️', '🍕', '🌵'];

    return `
      <div id="modal-quote-dialog" class="modal-backdrop" style="display: flex;">
        <div class="modal-dialog glass-panel quote-modal-dialog">
          <div class="modal-header">
            <h3>${isEdit ? '✏️ Edit Quote Note' : '📌 Stick a Note on the Board'}</h3>
            <button id="btn-close-quote-modal" class="modal-close" aria-label="Close">&times;</button>
          </div>

          <form id="form-quote-upsert" class="modal-body quote-modal-body">
            <!-- Quote Text -->
            <div class="form-group">
              <label for="input-quote-text">The Quote or Phrase</label>
              <textarea 
                id="input-quote-text" 
                class="text-input quote-textarea-input" 
                rows="3" 
                placeholder="What was said or written on the mirror / fridge?..."
                required
              >${escapeHtml(activeText)}</textarea>
            </div>

            <!-- Speaker attribution quick buttons -->
            <div class="form-group" style="margin-top: 14px;">
              <label>Who said or wrote it?</label>
              <div class="quote-author-picker">
                <button type="button" class="author-choice-btn ${activeAuthor === 'Núria 💗' ? 'selected' : ''}" data-author="Núria 💗">
                  Núria 💗
                </button>
                <button type="button" class="author-choice-btn ${activeAuthor === 'Andino 🧉' ? 'selected' : ''}" data-author="Andino 🧉">
                  Andino 🧉
                </button>
                <button type="button" class="author-choice-btn ${activeAuthor === 'Both of us' ? 'selected' : ''}" data-author="Both of us">
                  Both 👫
                </button>
              </div>
              <input 
                type="text" 
                id="input-quote-author" 
                class="text-input" 
                style="margin-top: 8px;" 
                placeholder="Or type custom name..." 
                value="${escapeHtml(activeAuthor)}" 
                required 
              />
            </div>

            <!-- Context / Location -->
            <div class="form-group" style="margin-top: 14px;">
              <label for="input-quote-context">Context or Where it Happened</label>
              <input 
                type="text" 
                id="input-quote-context" 
                class="text-input" 
                placeholder="e.g. Bathroom mirror lipstick note, Kitchen at 2 AM, Road trip..." 
                value="${escapeHtml(activeContext)}"
              />
            </div>

            <!-- Style Variant Selector -->
            <div class="form-group" style="margin-top: 14px;">
              <label>Note Style</label>
              <div class="quote-style-palette">
                ${STYLES.map(s => `
                  <button 
                    type="button" 
                    class="style-choice-swatch ${s.id === activeStyle ? 'selected' : ''}" 
                    data-style="${s.id}" 
                    style="background: ${s.color};"
                    title="${s.label}"
                  ></button>
                `).join('')}
              </div>
              <input type="hidden" id="input-quote-style" value="${activeStyle}" />
            </div>

            <!-- Magnet / Pin Picker -->
            <div class="form-group" style="margin-top: 14px;">
              <label>Magnet or Pin</label>
              <div class="magnet-choice-row">
                ${MAGNETS.map(m => `
                  <button 
                    type="button" 
                    class="magnet-choice-btn ${m === activeMagnet ? 'selected' : ''}" 
                    data-magnet="${m}"
                  >${m}</button>
                `).join('')}
              </div>
              <input type="hidden" id="input-quote-magnet" value="${activeMagnet}" />
            </div>

            <!-- Live Preview -->
            <div class="quote-preview-wrap">
              <span class="preview-label">Live Preview:</span>
              <div id="quote-live-preview" class="quote-card style-${activeStyle} rotate-tilt-1" style="box-shadow: 0 8px 24px rgba(0,0,0,0.12);">
                <div class="quote-magnet-head">
                  <span id="preview-magnet-icon" class="quote-magnet-icon">${activeMagnet}</span>
                </div>
                <div class="quote-card-content">
                  <p id="preview-quote-text" class="quote-main-text">“${escapeHtml(activeText || 'Your funny quote will appear here...')}”</p>
                </div>
                <div class="quote-attribution-wrap">
                  <div id="preview-quote-author" class="quote-author-name">— ${escapeHtml(activeAuthor)}</div>
                  <div id="preview-quote-context" class="quote-context-location">
                    <span>📍</span>
                    <span>${escapeHtml(activeContext || 'On the fridge')}</span>
                  </div>
                </div>
                <div class="quote-card-footer" style="margin-top: 10px;">
                  <span class="quote-date-label">${formatDate(editingQuote?.created_at || new Date().toISOString())}</span>
                </div>
              </div>
            </div>

            <button type="submit" class="quotes-primary-action-btn" style="margin-top: 20px; width: 100%;">
              ${isEdit ? 'Save Changes' : '📌 Pin to Board'}
            </button>
          </form>
        </div>
      </div>
    `;
  }

  async function toggleReaction(quoteId, emoji) {
    const target = quotes.find(q => q.id === quoteId);
    if (!target) return;
    if (!Array.isArray(target.reactions)) {
      target.reactions = [];
    }
    const idx = target.reactions.indexOf(emoji);
    if (idx > -1) {
      target.reactions.splice(idx, 1);
    } else {
      target.reactions.push(emoji);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('household_quotes')
          .update({ reactions: target.reactions })
          .eq('id', quoteId);
      } catch (e) {
        console.warn('Could not update reactions in Supabase:', e);
      }
    }
    localStorage.setItem(STORAGE_QUOTES_KEY, JSON.stringify(quotes));
    render();
  }

  function attachEvents() {
    // Filter pills
    container.querySelectorAll('.quotes-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.getAttribute('data-filter');
        activePickerQuoteId = null;
        render();
      });
    });

    // Open add modal
    const openAdd = () => {
      editingQuoteId = null;
      activePickerQuoteId = null;
      isModalOpen = true;
      render();
    };
    container.querySelector('#btn-open-add-quote')?.addEventListener('click', openAdd);
    container.querySelector('#btn-empty-add-quote')?.addEventListener('click', openAdd);

    // Close modal
    const closeModal = () => {
      isModalOpen = false;
      editingQuoteId = null;
      render();
    };
    container.querySelector('#btn-close-quote-modal')?.addEventListener('click', closeModal);
    const modalBackdrop = container.querySelector('#modal-quote-dialog');
    modalBackdrop?.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    // Author quick buttons in modal
    container.querySelectorAll('.author-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.author-choice-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const author = btn.getAttribute('data-author');
        const authorInput = container.querySelector('#input-quote-author');
        const previewAuthor = container.querySelector('#preview-quote-author');
        if (authorInput) authorInput.value = author;
        if (previewAuthor) previewAuthor.textContent = `— ${author}`;
      });
    });

    // Custom author input live update
    container.querySelector('#input-quote-author')?.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Núria 💗';
      const previewAuthor = container.querySelector('#preview-quote-author');
      if (previewAuthor) previewAuthor.textContent = `— ${val}`;
    });

    // Context input live update
    container.querySelector('#input-quote-context')?.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'On the fridge';
      const previewContext = container.querySelector('#preview-quote-context');
      if (previewContext) {
        previewContext.innerHTML = `<span>📍</span><span>${escapeHtml(val)}</span>`;
      }
    });

    // Quote text live update
    container.querySelector('#input-quote-text')?.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Your funny quote will appear here...';
      const previewText = container.querySelector('#preview-quote-text');
      if (previewText) previewText.textContent = `“${val}”`;
    });

    // Style swatches
    container.querySelectorAll('.style-choice-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        container.querySelectorAll('.style-choice-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        const styleId = swatch.getAttribute('data-style');
        const styleHidden = container.querySelector('#input-quote-style');
        if (styleHidden) styleHidden.value = styleId;

        const livePreview = container.querySelector('#quote-live-preview');
        if (livePreview) {
          livePreview.className = `quote-card style-${styleId} rotate-tilt-1`;
        }
      });
    });

    // Magnet choices
    container.querySelectorAll('.magnet-choice-btn').forEach(mBtn => {
      mBtn.addEventListener('click', () => {
        container.querySelectorAll('.magnet-choice-btn').forEach(b => b.classList.remove('selected'));
        mBtn.classList.add('selected');
        const magnet = mBtn.getAttribute('data-magnet');
        const magnetHidden = container.querySelector('#input-quote-magnet');
        if (magnetHidden) magnetHidden.value = magnet;

        const previewMagnet = container.querySelector('#preview-magnet-icon');
        if (previewMagnet) previewMagnet.textContent = magnet;
      });
    });

    // Form submit
    container.querySelector('#form-quote-upsert')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = container.querySelector('#input-quote-text')?.value?.trim();
      const author = container.querySelector('#input-quote-author')?.value?.trim() || 'Núria 💗';
      const context = container.querySelector('#input-quote-context')?.value?.trim() || '';
      const style = container.querySelector('#input-quote-style')?.value || 'sticky-yellow';
      const magnet = container.querySelector('#input-quote-magnet')?.value || '🧲';

      if (!text) return;

      if (editingQuoteId) {
        // Edit existing
        const target = quotes.find(q => q.id === editingQuoteId);
        if (target) {
          target.quote_text = text;
          target.author_speaker = author;
          target.context_or_location = context;
          target.style_variant = style;
          target.magnet_icon = magnet;
          target.updated_at = new Date().toISOString();

          if (isSupabaseConfigured) {
            await supabase
              .from('household_quotes')
              .update({
                quote_text: text,
                author_speaker: author,
                context_or_location: context,
                style_variant: style,
                magnet_icon: magnet,
                updated_at: new Date().toISOString()
              })
              .eq('id', target.id);
          } else {
            localStorage.setItem(STORAGE_QUOTES_KEY, JSON.stringify(quotes));
          }
        }
      } else {
        // Create new
        const newQuote = {
          id: generateUUID(),
          household_id: household?.id,
          quote_text: text,
          author_speaker: author,
          context_or_location: context,
          style_variant: style,
          magnet_icon: magnet,
          reactions: ['💗'],
          created_at: new Date().toISOString()
        };

        if (isSupabaseConfigured && household?.id) {
          const { data, error } = await supabase
            .from('household_quotes')
            .insert([newQuote])
            .select()
            .single();

          if (data) {
            quotes.unshift({ ...data, reactions: ['💗'] });
          } else if (error) {
            console.warn('Error inserting quote to Supabase:', error);
            quotes.unshift(newQuote);
          }
        } else {
          quotes.unshift(newQuote);
          localStorage.setItem(STORAGE_QUOTES_KEY, JSON.stringify(quotes));
        }
      }

      isModalOpen = false;
      editingQuoteId = null;
      render();
    });

    // Reaction stamp toggle
    container.querySelectorAll('[data-action="toggle-reaction"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const emoji = btn.getAttribute('data-emoji');
        await toggleReaction(id, emoji);
      });
    });

    // Toggle reaction picker popover
    container.querySelectorAll('[data-action="toggle-picker"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        activePickerQuoteId = activePickerQuoteId === id ? null : id;
        render();
      });
    });

    // Pick reaction from popover
    container.querySelectorAll('[data-action="pick-reaction"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const emoji = btn.getAttribute('data-emoji');
        activePickerQuoteId = null;
        await toggleReaction(id, emoji);
      });
    });

    // Edit button
    container.querySelectorAll('[data-action="edit-quote"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingQuoteId = btn.getAttribute('data-id');
        activePickerQuoteId = null;
        isModalOpen = true;
        render();
      });
    });

    // Delete button
    container.querySelectorAll('[data-action="delete-quote"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (!confirm('Unpin this quote from the board?')) return;

        quotes = quotes.filter(q => q.id !== id);

        if (isSupabaseConfigured) {
          await supabase.from('household_quotes').delete().eq('id', id);
        } else {
          localStorage.setItem(STORAGE_QUOTES_KEY, JSON.stringify(quotes));
        }

        render();
      });
    });
  }

  // Close reaction picker on outside click
  document.addEventListener('click', (e) => {
    if (activePickerQuoteId && !e.target.closest('.reaction-picker-anchor')) {
      activePickerQuoteId = null;
      render();
    }
  });

  await loadData();
  render();
}
