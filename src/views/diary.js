import {
  getActiveHousehold,
  supabase,
  isSupabaseConfigured,
  generateUUID
} from '../services/supabase.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { renderParagraphs } from '../utils/richText.js';
import { resizeImage, blobToDataUrl } from '../utils/images.js';

const BUCKET = 'journal-images';
const STORAGE_ENTRIES_KEY = 'andinu_cache_diary';
const AUTHORS = [
  { id: 'Both', label: 'Both 👫' },
  { id: 'Núria', label: 'Núria 💗' },
  { id: 'Andino', label: 'Andino 🧉' }
];

function todayISO() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateRange(start, end) {
  if (!start) return '';
  const fmt = (s, opts) => new Date(`${s}T12:00:00`).toLocaleDateString(undefined, opts);
  const full = { day: 'numeric', month: 'long', year: 'numeric' };
  if (!end || end === start) return fmt(start, full);
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  if (a.getFullYear() === b.getFullYear()) {
    return `${fmt(start, { day: 'numeric', month: 'long' })} – ${fmt(end, full)}`;
  }
  return `${fmt(start, full)} – ${fmt(end, full)}`;
}

// Every 'YYYY-MM' a story touches, so a trip crossing a month boundary shows up under both
function monthKeys(e) {
  const keys = [];
  let [y, m] = e.start_date.slice(0, 7).split('-').map(Number);
  const last = (e.end_date && e.end_date > e.start_date ? e.end_date : e.start_date).slice(0, 7);
  for (let i = 0; i < 60; i++) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    keys.push(key);
    if (key >= last) break;
    if (++m > 12) { m = 1; y++; }
  }
  return keys;
}

// The cover is the picture the author chose, otherwise the first photo (then the first image of any kind)
function effectiveCoverId(d) {
  const images = d.blocks.filter(b => b.type === 'image');
  if (d.coverId && images.some(b => b.id === d.coverId)) return d.coverId;
  return (images.find(b => b.kind === 'photo') || images[0])?.id || null;
}

const blockPaths = blocks => (blocks || []).filter(b => b.type === 'image' && b.path).map(b => b.path);

export async function mountDiary(container, navigate) {
  const household = await getActiveHousehold();
  const useRemote = isSupabaseConfigured && Boolean(household?.id);

  let entries = [];
  let imageUrls = {}; // storage path -> displayable URL
  let view = 'list'; // 'list' | 'read' | 'edit'
  let activeId = null;
  let draft = null;
  let lightboxUrl = null;
  let sortDir = 'desc'; // 'desc' = newest first
  let filterYear = '';
  let filterMonth = ''; // '01'..'12'
  let query = '';

  // ---- Data ---------------------------------------------------------------

  async function resolveImageUrls(paths) {
    const missing = [...new Set(paths)].filter(p => p && !imageUrls[p]);
    if (missing.length === 0) return;
    if (!useRemote) {
      missing.forEach(p => { imageUrls[p] = p; }); // local mode stores data URLs directly
      return;
    }
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(missing, 3600);
    (data || []).forEach(item => {
      if (item.signedUrl) imageUrls[item.path] = item.signedUrl;
    });
  }

  async function loadData() {
    if (useRemote) {
      try {
        const { data, error } = await supabase
          .from('diary_entries')
          .select('*')
          .order('start_date', { ascending: false })
          .order('created_at', { ascending: false });
        if (error) throw error;
        entries = data || [];
      } catch (err) {
        console.warn('Error loading diary entries:', err);
      }
    } else {
      try {
        entries = JSON.parse(localStorage.getItem(STORAGE_ENTRIES_KEY) || '[]');
      } catch {
        entries = [];
      }
    }
    await resolveImageUrls(entries.map(e => e.cover_path));
  }

  function persistLocal() {
    try {
      localStorage.setItem(STORAGE_ENTRIES_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Could not cache diary locally:', e);
    }
  }

  async function uploadImage(blob) {
    if (!useRemote) return blobToDataUrl(blob);
    const path = `${household.id}/${generateUUID()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return path;
  }

  async function removeImages(paths) {
    if (!useRemote || paths.length === 0) return;
    try {
      await supabase.storage.from(BUCKET).remove(paths);
    } catch (e) {
      console.warn('Could not remove diary images:', e);
    }
  }

  // ---- Rendering: list ----------------------------------------------------

  function renderList() {
    return `
      <div class="diary-header">
        <div>
          <div class="diary-tag-pill">📖 Diary</div>
          <h1 class="diary-title">Our Diary</h1>
          <p class="diary-subtitle">Trips, days out and everything we want to remember together.</p>
        </div>
        <button id="diary-new" class="diary-btn">＋ New story</button>
      </div>

      ${entries.length ? renderToolbar() : ''}
      <div id="diary-results">${renderResults()}</div>`;
  }

  function renderToolbar() {
    const allKeys = entries.flatMap(monthKeys);
    const years = [...new Set(allKeys.map(k => k.slice(0, 4)))].sort().reverse();
    const months = [...new Set(allKeys.filter(k => !filterYear || k.startsWith(filterYear)).map(k => k.slice(5)))].sort();
    const monthName = m => new Date(2000, Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'long' });

    return `
      <div class="diary-toolbar">
        <input type="search" id="diary-search" class="text-input diary-search" value="${escapeHtml(query)}"
          placeholder="🔍 Search places, titles or text…" />
        <select id="diary-year" class="text-input" aria-label="Filter by year">
          <option value="">All years</option>
          ${years.map(y => `<option value="${y}" ${y === filterYear ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <select id="diary-month" class="text-input" aria-label="Filter by month">
          <option value="">All months</option>
          ${months.map(m => `<option value="${m}" ${m === filterMonth ? 'selected' : ''}>${monthName(m)}</option>`).join('')}
        </select>
        <button type="button" id="diary-sort" class="diary-sort-btn" title="Change sort order">
          ${sortDir === 'desc' ? '↓ Newest first' : '↑ Oldest first'}
        </button>
      </div>`;
  }

  function visibleEntries() {
    const q = query.trim().toLowerCase();
    const matches = e => {
      if ((filterYear || filterMonth) &&
          !monthKeys(e).some(k => (!filterYear || k.startsWith(filterYear)) && (!filterMonth || k.slice(5) === filterMonth))) {
        return false;
      }
      if (!q) return true;
      const text = (e.blocks || []).filter(b => b.type === 'text').map(b => b.text).join(' ');
      return [e.title, e.location, text].some(v => (v || '').toLowerCase().includes(q));
    };
    const dir = sortDir === 'desc' ? -1 : 1;
    return entries
      .filter(matches)
      .sort((a, b) => dir * (a.start_date + a.created_at).localeCompare(b.start_date + b.created_at));
  }

  function renderResults() {
    if (entries.length === 0) {
      return `
        <div class="diary-empty">
          <span>🗺️</span>
          <h3>No stories yet</h3>
          <p>Write about a trip or a favourite day, with photos and maps right where they belong.</p>
        </div>`;
    }
    const list = visibleEntries();
    if (list.length === 0) {
      return `
        <div class="diary-empty">
          <span>🔍</span>
          <h3>No stories match</h3>
          <p>Try a different search, or clear the year and month filters.</p>
        </div>`;
    }
    const filtered = list.length !== entries.length;
    return `
      ${filtered ? `<div class="diary-count">${list.length} of ${entries.length} stories</div>` : ''}
      <div class="diary-grid">
        ${list.map(e => {
          const cover = e.cover_path && imageUrls[e.cover_path];
          const author = AUTHORS.find(a => a.id === e.author)?.label || e.author;
          return `
            <button class="diary-card" data-open="${e.id}">
              <div class="diary-card-cover ${cover ? '' : 'no-cover'}">
                ${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy" />` : '<span>📖</span>'}
              </div>
              <div class="diary-card-body">
                <h3>${escapeHtml(e.title)}</h3>
                ${e.location ? `<div class="diary-card-place">📍 ${escapeHtml(e.location)}</div>` : ''}
                <div class="diary-card-meta">${escapeHtml(formatDateRange(e.start_date, e.end_date))} · ${escapeHtml(author)}</div>
              </div>
            </button>`;
        }).join('')}
      </div>`;
  }

  // ---- Rendering: reading -------------------------------------------------

  function renderRead() {
    const e = entries.find(x => x.id === activeId);
    if (!e) return renderList();
    const author = AUTHORS.find(a => a.id === e.author)?.label || e.author;

    const body = (e.blocks || []).map(b => {
      if (b.type === 'text') return `<div class="diary-text">${renderParagraphs(b.text)}</div>`;
      const url = imageUrls[b.path];
      if (!url) return '';
      return `
        <figure class="diary-figure ${b.kind === 'map' ? 'is-map' : ''}">
          <button class="diary-figure-img" data-zoom="${escapeHtml(url)}">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(b.caption || (b.kind === 'map' ? 'Map' : 'Photo'))}" loading="lazy" />
          </button>
          ${b.caption || b.kind === 'map' ? `<figcaption>${b.kind === 'map' ? '📍 ' : ''}${escapeHtml(b.caption || 'Map')}</figcaption>` : ''}
        </figure>`;
    }).join('');

    return `
      <div class="diary-read-bar">
        <button class="diary-link-btn" id="diary-back">← All stories</button>
        <div>
          <button class="diary-link-btn" id="diary-edit">✏️ Edit</button>
          <button class="diary-link-btn" id="diary-delete">🗑 Delete</button>
        </div>
      </div>
      <article class="diary-article">
        <header>
          <div class="diary-article-meta">${escapeHtml(formatDateRange(e.start_date, e.end_date))}${e.location ? ` · 📍 ${escapeHtml(e.location)}` : ''}</div>
          <h1>${escapeHtml(e.title)}</h1>
          <div class="diary-article-by">Written by ${escapeHtml(author)}</div>
        </header>
        ${body}
      </article>`;
  }

  // ---- Rendering: editing -------------------------------------------------

  function renderInserter(index) {
    return `
      <div class="diary-inserter">
        <span class="diary-inserter-line"></span>
        <button type="button" data-insert="text" data-at="${index}">＋ Text</button>
        <button type="button" data-insert="photo" data-at="${index}">＋ Photos</button>
        <button type="button" data-insert="map" data-at="${index}">＋ Map</button>
        <span class="diary-inserter-line"></span>
      </div>`;
  }

  function renderBlockEditor(b, i, total, coverId) {
    const isCover = b.type === 'image' && b.id === coverId;
    const controls = `
      <div class="diary-block-controls">
        ${b.type === 'image' ? `<button type="button" class="diary-cover-btn ${isCover ? 'is-cover' : ''}" data-cover="${i}" title="${isCover ? 'This is the cover' : 'Use as cover'}">⭐</button>` : ''}
        <button type="button" data-move="-1" data-at="${i}" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button>
        <button type="button" data-move="1" data-at="${i}" ${i === total - 1 ? 'disabled' : ''} title="Move down">↓</button>
        <button type="button" data-remove="${i}" title="Remove">🗑</button>
      </div>`;

    if (b.type === 'text') {
      return `
        <div class="diary-block">
          ${controls}
          <textarea class="text-input diary-block-text" data-text="${i}" rows="4" placeholder="Tell the story… (*bold*, _italic_, # heading)">${escapeHtml(b.text)}</textarea>
        </div>`;
    }
    return `
      <div class="diary-block">
        ${controls}
        <div class="diary-block-image ${b.kind === 'map' ? 'is-map' : ''}">
          ${isCover ? '<span class="diary-cover-badge">⭐ Cover</span>' : ''}
          <img src="${escapeHtml(b.url)}" alt="" />
        </div>
        <input type="text" class="text-input" data-caption="${i}" value="${escapeHtml(b.caption)}"
          placeholder="${b.kind === 'map' ? 'Map caption, e.g. Our route on day 2' : 'Caption (optional)'}" />
      </div>`;
  }

  function renderEdit() {
    const d = draft;
    const coverId = effectiveCoverId(d);
    return `
      <div class="diary-read-bar">
        <button class="diary-link-btn" id="diary-cancel">← Cancel</button>
        <button class="diary-btn" id="diary-save" ${d.saving ? 'disabled' : ''}>${d.saving ? 'Saving…' : 'Save story'}</button>
      </div>

      <div class="diary-editor">
        <div class="form-group">
          <label for="diary-f-title">Title</label>
          <input type="text" id="diary-f-title" class="text-input diary-title-input" value="${escapeHtml(d.title)}" placeholder="e.g. Three days in Lisbon" />
        </div>
        <div class="diary-field-row">
          <div class="form-group">
            <label for="diary-f-location">Where</label>
            <input type="text" id="diary-f-location" class="text-input" value="${escapeHtml(d.location)}" placeholder="Lisbon, Portugal" />
          </div>
          <div class="form-group">
            <label for="diary-f-start">From</label>
            <input type="date" id="diary-f-start" class="text-input" value="${escapeHtml(d.start_date)}" />
          </div>
          <div class="form-group">
            <label for="diary-f-end">To <span class="diary-optional">(optional)</span></label>
            <input type="date" id="diary-f-end" class="text-input" value="${escapeHtml(d.end_date)}" />
          </div>
        </div>
        <div class="form-group">
          <label>Written by</label>
          <div class="diary-author-picker">
            ${AUTHORS.map(a => `<button type="button" class="diary-author-btn ${d.author === a.id ? 'selected' : ''}" data-author="${a.id}">${a.label}</button>`).join('')}
          </div>
        </div>

        <div class="diary-blocks">
          ${renderInserter(0)}
          ${d.blocks.map((b, i) => renderBlockEditor(b, i, d.blocks.length, coverId) + renderInserter(i + 1)).join('')}
        </div>

        ${d.error ? `<p class="diary-error">${escapeHtml(d.error)}</p>` : ''}
      </div>`;
  }

  function render() {
    container.innerHTML = `
      <div class="diary-view-shell">
        ${view === 'edit' ? renderEdit() : view === 'read' ? renderRead() : renderList()}
        ${lightboxUrl ? `<div id="diary-lightbox" class="journal-lightbox"><img src="${escapeHtml(lightboxUrl)}" alt="" /></div>` : ''}
      </div>`;
    attachEvents();
    if (view === 'edit') container.querySelectorAll('.diary-block-text').forEach(autoGrow);
  }

  function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 90)}px`;
  }

  // ---- Actions ------------------------------------------------------------

  const newTextBlock = (text = '') => ({ id: generateUUID(), type: 'text', text });

  async function openEntry(id) {
    activeId = id;
    const e = entries.find(x => x.id === id);
    await resolveImageUrls(blockPaths(e?.blocks));
    view = 'read';
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async function startEdit(entry = null) {
    if (entry) await resolveImageUrls(blockPaths(entry.blocks));
    draft = {
      id: entry?.id || null,
      title: entry?.title || '',
      location: entry?.location || '',
      author: entry?.author || 'Both',
      start_date: entry?.start_date || todayISO(),
      end_date: entry?.end_date || '',
      blocks: entry
        ? entry.blocks.map(b => b.type === 'image'
            ? { id: b.id, type: 'image', kind: b.kind, path: b.path, url: imageUrls[b.path], caption: b.caption || '' }
            : { ...b })
        : [newTextBlock()],
      coverId: entry?.blocks.find(b => b.type === 'image' && b.path === entry.cover_path)?.id || null,
      originalPaths: entry ? blockPaths(entry.blocks) : [],
      saving: false,
      error: ''
    };
    view = 'edit';
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function syncDraftFields() {
    const val = id => container.querySelector(id)?.value;
    draft.title = val('#diary-f-title') ?? draft.title;
    draft.location = val('#diary-f-location') ?? draft.location;
    draft.start_date = val('#diary-f-start') ?? draft.start_date;
    draft.end_date = val('#diary-f-end') ?? draft.end_date;
  }

  function pickImages(kind, index) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.addEventListener('change', async () => {
      const added = [];
      for (const file of input.files) {
        try {
          const blob = await resizeImage(file, kind === 'map' ? 2200 : 1600);
          added.push({ id: generateUUID(), type: 'image', kind, blob, url: URL.createObjectURL(blob), caption: '' });
        } catch (e) {
          draft.error = e.message;
        }
      }
      if (added.length) {
        draft.blocks.splice(index, 0, ...added);
        draft.error = '';
      }
      render();
    });
    input.click();
  }

  async function saveDraft() {
    syncDraftFields();
    const d = draft;
    if (!d.title.trim()) {
      d.error = 'Give the story a title first.';
      render();
      return;
    }
    if (d.end_date && d.end_date < d.start_date) {
      d.error = 'The end date is before the start date.';
      render();
      return;
    }
    d.saving = true;
    d.error = '';
    render();

    try {
      const blocks = [];
      for (const b of d.blocks) {
        if (b.type === 'text') {
          if (b.text.trim()) blocks.push({ id: b.id, type: 'text', text: b.text.trim() });
        } else {
          const path = b.path || await uploadImage(b.blob);
          blocks.push({ id: b.id, type: 'image', kind: b.kind, path, caption: b.caption.trim() });
        }
      }
      const fields = {
        title: d.title.trim(),
        location: d.location.trim() || null,
        author: d.author,
        start_date: d.start_date,
        end_date: d.end_date || null,
        blocks,
        cover_path: blocks.find(b => b.id === effectiveCoverId(d))?.path || null
      };

      let savedId = d.id;
      if (useRemote) {
        if (d.id) {
          const { error } = await supabase.from('diary_entries').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', d.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from('diary_entries').insert({ ...fields, household_id: household.id }).select('id').single();
          if (error) throw error;
          savedId = data.id;
        }
      } else if (d.id) {
        entries = entries.map(e => (e.id === d.id ? { ...e, ...fields } : e));
      } else {
        savedId = generateUUID();
        entries.push({ id: savedId, ...fields, created_at: new Date().toISOString() });
      }

      // Only delete orphaned files once the entry itself is safely saved
      const kept = new Set(blockPaths(blocks));
      await removeImages(d.originalPaths.filter(p => !kept.has(p)));

      draft = null;
      if (useRemote) {
        await loadData();
      } else {
        entries.sort((a, b) => (b.start_date + b.created_at).localeCompare(a.start_date + a.created_at));
        persistLocal();
      }
      await openEntry(savedId);
    } catch (e) {
      console.error('Saving diary entry failed:', e);
      d.saving = false;
      d.error = e.message || 'Could not save. Please try again.';
      render();
    }
  }

  async function deleteActive() {
    const e = entries.find(x => x.id === activeId);
    if (!e || !confirm(`Delete "${e.title}" for good?`)) return;
    if (useRemote) {
      const { error } = await supabase.from('diary_entries').delete().eq('id', e.id);
      if (error) {
        alert('Could not delete the story.');
        return;
      }
    }
    await removeImages(blockPaths(e.blocks));
    entries = entries.filter(x => x.id !== e.id);
    if (!useRemote) persistLocal();
    view = 'list';
    activeId = null;
    render();
  }

  function bindCards() {
    container.querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', () => openEntry(el.dataset.open)));
  }

  function attachEvents() {
    const $ = sel => container.querySelector(sel);
    const on = (sel, fn) => $(sel)?.addEventListener('click', fn);

    on('#diary-new', () => startEdit());
    bindCards();

    // Search only redraws the results, so the input keeps focus while typing
    $('#diary-search')?.addEventListener('input', e => {
      query = e.target.value;
      $('#diary-results').innerHTML = renderResults();
      bindCards();
    });
    $('#diary-year')?.addEventListener('change', e => {
      filterYear = e.target.value;
      filterMonth = '';
      render();
    });
    $('#diary-month')?.addEventListener('change', e => {
      filterMonth = e.target.value;
      render();
    });
    on('#diary-sort', () => {
      sortDir = sortDir === 'desc' ? 'asc' : 'desc';
      render();
    });

    on('#diary-back', () => { view = 'list'; render(); });
    on('#diary-edit', () => startEdit(entries.find(e => e.id === activeId)));
    on('#diary-delete', deleteActive);

    container.querySelectorAll('[data-zoom]').forEach(el => el.addEventListener('click', () => {
      lightboxUrl = el.dataset.zoom;
      render();
    }));
    on('#diary-lightbox', () => { lightboxUrl = null; render(); });

    if (view !== 'edit') return;

    on('#diary-cancel', () => {
      if (!confirm('Discard your changes to this story?')) return;
      draft = null;
      view = activeId && entries.some(e => e.id === activeId) ? 'read' : 'list';
      render();
    });
    on('#diary-save', saveDraft);

    container.querySelectorAll('[data-author]').forEach(btn => btn.addEventListener('click', () => {
      syncDraftFields();
      draft.author = btn.dataset.author;
      render();
    }));

    // Typing updates state directly, without re-rendering (keeps focus and caret)
    container.querySelectorAll('[data-text]').forEach(el => el.addEventListener('input', () => {
      draft.blocks[Number(el.dataset.text)].text = el.value;
      autoGrow(el);
    }));
    container.querySelectorAll('[data-caption]').forEach(el => el.addEventListener('input', () => {
      draft.blocks[Number(el.dataset.caption)].caption = el.value;
    }));

    container.querySelectorAll('[data-insert]').forEach(btn => btn.addEventListener('click', () => {
      syncDraftFields();
      const at = Number(btn.dataset.at);
      if (btn.dataset.insert === 'text') {
        draft.blocks.splice(at, 0, newTextBlock());
        render();
      } else {
        pickImages(btn.dataset.insert, at);
      }
    }));
    container.querySelectorAll('[data-cover]').forEach(btn => btn.addEventListener('click', () => {
      syncDraftFields();
      draft.coverId = draft.blocks[Number(btn.dataset.cover)].id;
      render();
    }));
    container.querySelectorAll('[data-move]').forEach(btn => btn.addEventListener('click', () => {
      syncDraftFields();
      const at = Number(btn.dataset.at);
      const to = at + Number(btn.dataset.move);
      [draft.blocks[at], draft.blocks[to]] = [draft.blocks[to], draft.blocks[at]];
      render();
    }));
    container.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
      syncDraftFields();
      draft.blocks.splice(Number(btn.dataset.remove), 1);
      render();
    }));
  }

  await loadData();
  render();
}
