import {
  getActiveHousehold,
  getCurrentUser,
  supabase,
  isSupabaseConfigured,
  generateUUID
} from '../services/supabase.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { renderParagraphs } from '../utils/richText.js';
import { resizeImage, blobToDataUrl } from '../utils/images.js';

const BUCKET = 'journal-images';
const STORAGE_ENTRIES_KEY = 'andinu_cache_journal';
const STORAGE_AUTHOR_KEY = 'andinu_journal_author';
const AUTHORS = [
  { id: 'Núria', label: 'Núria 💗' },
  { id: 'Andino', label: 'Andino 🧉' }
];

function todayISO() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatEntryDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function guessAuthor(user) {
  const remembered = localStorage.getItem(STORAGE_AUTHOR_KEY);
  if (AUTHORS.some(a => a.id === remembered)) return remembered;
  const hay = `${user?.user_metadata?.full_name || ''} ${user?.email || ''}`.toLowerCase();
  if (hay.includes('nuria') || hay.includes('núria')) return 'Núria';
  return 'Andino';
}

export async function mountJournal(container, navigate) {
  const household = await getActiveHousehold();
  const user = await getCurrentUser();
  const useRemote = isSupabaseConfigured && Boolean(household?.id);

  let entries = [];
  let imageUrls = {}; // storage path -> displayable URL
  let filter = 'all';
  let modal = null; // null | { id|null, author, date, title, body, images: [{path, url}], scanning, saving, error }
  let lightboxUrl = null;

  // ---- Data ---------------------------------------------------------------

  async function resolveImageUrls() {
    const paths = [...new Set(entries.flatMap(e => e.image_paths || []))].filter(p => !imageUrls[p]);
    if (paths.length === 0) return;
    if (!useRemote) {
      paths.forEach(p => { imageUrls[p] = p; }); // local mode stores data URLs directly
      return;
    }
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
    (data || []).forEach(item => {
      if (item.signedUrl) imageUrls[item.path] = item.signedUrl;
    });
  }

  async function loadData() {
    if (useRemote) {
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .order('entry_date', { ascending: false })
          .order('created_at', { ascending: false });
        if (error) throw error;
        entries = data || [];
      } catch (err) {
        console.warn('Error loading journal entries:', err);
      }
    } else {
      try {
        entries = JSON.parse(localStorage.getItem(STORAGE_ENTRIES_KEY) || '[]');
      } catch {
        entries = [];
      }
    }
    await resolveImageUrls();
  }

  function persistLocal() {
    try {
      localStorage.setItem(STORAGE_ENTRIES_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Could not cache journal locally:', e);
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
      console.warn('Could not remove journal images:', e);
    }
  }

  async function transcribe(blob) {
    const dataUrl = await blobToDataUrl(blob);
    const headers = { 'Content-Type': 'application/json' };
    if (useRemote) {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
    }
    const res = await fetch('/api/journal/transcribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({ image: dataUrl.split(',')[1], mediaType: 'image/jpeg' })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Scan failed');
    return json.text || '';
  }

  // ---- Rendering ----------------------------------------------------------

  function renderEntry(e) {
    const paragraphs = renderParagraphs(e.body);
    const images = (e.image_paths || []).filter(p => imageUrls[p]);
    const isNuria = e.author === 'Núria';

    return `
      <article class="journal-entry ${isNuria ? 'by-nuria' : 'by-andino'}" data-entry-id="${e.id}">
        <header class="journal-entry-head">
          <div class="journal-entry-date">${escapeHtml(formatEntryDate(e.entry_date))}</div>
          <div class="journal-entry-actions">
            <button class="journal-icon-btn" data-action="edit" data-id="${e.id}" title="Edit">✏️</button>
            <button class="journal-icon-btn" data-action="delete" data-id="${e.id}" title="Delete">🗑</button>
          </div>
        </header>
        ${e.title ? `<h2 class="journal-entry-title">${escapeHtml(e.title)}</h2>` : ''}
        <div class="journal-entry-body">${paragraphs}</div>
        ${images.length ? `
          <div class="journal-photos">
            ${images.map(p => `
              <button class="journal-photo" data-action="zoom" data-url="${escapeHtml(imageUrls[p])}">
                <img src="${escapeHtml(imageUrls[p])}" alt="Journal photo" loading="lazy" />
              </button>`).join('')}
          </div>` : ''}
        <footer class="journal-entry-sign">
          — ${escapeHtml(AUTHORS.find(a => a.id === e.author)?.label || e.author)}
        </footer>
      </article>`;
  }

  function renderModal() {
    if (!modal) return '';
    const m = modal;
    return `
      <div id="journal-modal" class="modal-backdrop" style="display: flex;">
        <div class="modal-dialog glass-panel journal-modal-dialog">
          <div class="modal-header">
            <h3>${m.id ? '✏️ Edit letter' : '💌 New letter'}</h3>
            <button id="journal-close" class="modal-close" aria-label="Close">&times;</button>
          </div>
          <form id="journal-form" class="modal-body">
            <div class="form-group">
              <label>Written by</label>
              <div class="journal-author-picker">
                ${AUTHORS.map(a => `
                  <button type="button" class="journal-author-btn ${m.author === a.id ? 'selected' : ''}" data-author="${a.id}">${a.label}</button>
                `).join('')}
              </div>
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label for="journal-date">Date</label>
              <input type="date" id="journal-date" class="text-input" value="${escapeHtml(m.date)}" required />
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label for="journal-title">Title <span class="journal-optional">(optional)</span></label>
              <input type="text" id="journal-title" class="text-input" value="${escapeHtml(m.title)}" placeholder="e.g. What this week made me feel" />
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label for="journal-body">Your words</label>
              <textarea id="journal-body" class="text-input journal-textarea" rows="10" placeholder="Dear ...">${escapeHtml(m.body)}</textarea>
              <p class="journal-hint">Formatting: *bold*, _italic_, and start a line with # for a heading.</p>
            </div>

            <div class="journal-attach-row">
              <label class="journal-attach-btn">
                📷 Add photos
                <input type="file" id="journal-photo-input" accept="image/*" multiple hidden />
              </label>
              <label class="journal-attach-btn ${m.scanning ? 'busy' : ''}">
                ${m.scanning ? '⏳ Reading handwriting…' : '✍️ Scan handwritten note'}
                <input type="file" id="journal-scan-input" accept="image/*" capture="environment" hidden ${m.scanning ? 'disabled' : ''} />
              </label>
            </div>
            <p class="journal-hint">Scanning reads the handwriting and adds it to the text above, so you can fix any mistakes. The original page is kept as a photo.</p>

            ${m.images.length ? `
              <div class="journal-photos journal-photos-edit">
                ${m.images.map((img, i) => `
                  <div class="journal-photo">
                    <img src="${escapeHtml(img.url)}" alt="Attached photo" />
                    <button type="button" class="journal-photo-remove" data-remove-image="${i}" title="Remove photo">&times;</button>
                  </div>`).join('')}
              </div>` : ''}

            ${m.error ? `<p class="journal-error">${escapeHtml(m.error)}</p>` : ''}

            <button type="submit" class="quotes-primary-action-btn" style="margin-top: 20px; width: 100%;" ${m.saving || m.scanning ? 'disabled' : ''}>
              ${m.saving ? 'Saving…' : m.id ? 'Save changes' : '💌 Save letter'}
            </button>
          </form>
        </div>
      </div>`;
  }

  function render() {
    const filtered = filter === 'all' ? entries : entries.filter(e => e.author === filter);
    const count = id => entries.filter(e => e.author === id).length;

    container.innerHTML = `
      <div class="journal-view-shell">
        <div class="journal-header">
          <div>
            <div class="journal-tag-pill">💌 Letters</div>
            <h1 class="journal-title">Our Letters</h1>
            <p class="journal-subtitle">Letters, thoughts and the things we don't say out loud often enough.</p>
          </div>
          <button id="journal-new" class="quotes-primary-action-btn"><span>✒️</span> Write</button>
        </div>

        <div class="journal-filter-bar">
          <button class="journal-filter-pill ${filter === 'all' ? 'active' : ''}" data-filter="all">All (${entries.length})</button>
          ${AUTHORS.map(a => `
            <button class="journal-filter-pill ${filter === a.id ? 'active' : ''}" data-filter="${a.id}">${a.label} (${count(a.id)})</button>
          `).join('')}
        </div>

        <div class="journal-timeline">
          ${filtered.length ? filtered.map(renderEntry).join('') : `
            <div class="journal-empty">
              <span>💌</span>
              <h3>No letters yet</h3>
              <p>Write the first letter, or scan a note that was written by hand.</p>
            </div>`}
        </div>

        ${renderModal()}
        ${lightboxUrl ? `
          <div id="journal-lightbox" class="journal-lightbox"><img src="${escapeHtml(lightboxUrl)}" alt="Journal photo" /></div>` : ''}
      </div>`;

    attachEvents();
  }

  // ---- Actions ------------------------------------------------------------

  function openModal(entry = null) {
    modal = {
      id: entry?.id || null,
      author: entry?.author || guessAuthor(user),
      date: entry?.entry_date || todayISO(),
      title: entry?.title || '',
      body: entry?.body || '',
      images: (entry?.image_paths || []).map(p => ({ path: p, url: imageUrls[p] || p, existing: true })),
      removedPaths: [],
      scanning: false,
      saving: false,
      error: ''
    };
    render();
  }

  function syncModalFields() {
    if (!modal) return;
    const val = id => container.querySelector(id)?.value;
    modal.date = val('#journal-date') ?? modal.date;
    modal.title = val('#journal-title') ?? modal.title;
    modal.body = val('#journal-body') ?? modal.body;
  }

  async function addPhotos(files) {
    syncModalFields();
    for (const file of files) {
      try {
        const blob = await resizeImage(file);
        modal.images.push({ blob, url: URL.createObjectURL(blob), existing: false });
      } catch (e) {
        modal.error = e.message;
      }
    }
    render();
  }

  async function scanNote(file) {
    syncModalFields();
    modal.scanning = true;
    modal.error = '';
    render();
    try {
      const blob = await resizeImage(file);
      const text = await transcribe(blob);
      if (!text) {
        modal.error = 'No handwriting found in that picture.';
      } else {
        modal.body = modal.body.trim() ? `${modal.body.trimEnd()}\n\n${text}` : text;
        modal.images.push({ blob, url: URL.createObjectURL(blob), existing: false });
      }
    } catch (e) {
      modal.error = e.message || 'Scan failed';
    }
    modal.scanning = false;
    render();
  }

  async function saveEntry() {
    syncModalFields();
    const m = modal;
    if (!m.body.trim() && m.images.length === 0) {
      m.error = 'Write something or add a photo first.';
      render();
      return;
    }
    m.saving = true;
    m.error = '';
    render();

    try {
      const image_paths = [];
      for (const img of m.images) {
        image_paths.push(img.existing ? img.path : await uploadImage(img.blob));
      }
      const fields = {
        author: m.author,
        title: m.title.trim() || null,
        body: m.body.trim(),
        entry_date: m.date,
        image_paths
      };

      if (useRemote) {
        const query = m.id
          ? supabase.from('journal_entries').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', m.id)
          : supabase.from('journal_entries').insert({ ...fields, household_id: household.id });
        const { error } = await query;
        if (error) throw error;
      } else if (m.id) {
        entries = entries.map(e => (e.id === m.id ? { ...e, ...fields } : e));
      } else {
        entries.push({ id: generateUUID(), ...fields, created_at: new Date().toISOString() });
      }

      await removeImages(m.removedPaths);
      localStorage.setItem(STORAGE_AUTHOR_KEY, m.author);
      modal = null;
      await loadData();
      if (!useRemote) {
        entries.sort((a, b) => (b.entry_date + b.created_at).localeCompare(a.entry_date + a.created_at));
        persistLocal();
      }
      render();
    } catch (e) {
      console.error('Saving journal entry failed:', e);
      m.saving = false;
      m.error = e.message || 'Could not save. Please try again.';
      render();
    }
  }

  async function deleteEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry || !confirm('Delete this letter for good?')) return;
    if (useRemote) {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (error) {
        alert('Could not delete the entry.');
        return;
      }
    }
    await removeImages(entry.image_paths || []);
    entries = entries.filter(e => e.id !== id);
    if (!useRemote) persistLocal();
    render();
  }

  function attachEvents() {
    container.querySelector('#journal-new')?.addEventListener('click', () => openModal());

    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        render();
      });
    });

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id, url } = btn.dataset;
        if (action === 'edit') openModal(entries.find(e => e.id === id));
        else if (action === 'delete') deleteEntry(id);
        else if (action === 'zoom') {
          lightboxUrl = url;
          render();
        }
      });
    });

    container.querySelector('#journal-lightbox')?.addEventListener('click', () => {
      lightboxUrl = null;
      render();
    });

    if (!modal) return;

    container.querySelector('#journal-close')?.addEventListener('click', () => {
      modal = null;
      render();
    });
    container.querySelector('#journal-modal')?.addEventListener('click', e => {
      if (e.target.id === 'journal-modal') {
        modal = null;
        render();
      }
    });
    container.querySelectorAll('[data-author]').forEach(btn => {
      btn.addEventListener('click', () => {
        syncModalFields();
        modal.author = btn.dataset.author;
        render();
      });
    });
    container.querySelectorAll('[data-remove-image]').forEach(btn => {
      btn.addEventListener('click', () => {
        syncModalFields();
        const [removed] = modal.images.splice(Number(btn.dataset.removeImage), 1);
        if (removed?.existing) modal.removedPaths.push(removed.path);
        render();
      });
    });
    container.querySelector('#journal-photo-input')?.addEventListener('change', e => addPhotos([...e.target.files]));
    container.querySelector('#journal-scan-input')?.addEventListener('change', e => {
      if (e.target.files[0]) scanNote(e.target.files[0]);
    });
    container.querySelector('#journal-form')?.addEventListener('submit', e => {
      e.preventDefault();
      saveEntry();
    });
  }

  await loadData();
  render();
}
