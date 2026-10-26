// Everything the routine remembers. Settings and tonight's plan stay on the device (localStorage).
// History is shared through Supabase so phone and TV agree; the routine page is public (a TV
// browser never signs in), so it uses an open table (see the routine_sessions migration).
// The local copy is a cache: the routine works offline and uploads finished sessions later.
import { supabase, generateUUID } from '../services/supabase.js';

const KEY_HISTORY = 'andinu.routine.history';
const KEY_SETTINGS = 'andinu.routine.settings';
const KEY_TONIGHT = 'andinu.routine.tonight';
const HISTORY_LIMIT = 60;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) { /* storage blocked: the routine still works, it just forgets */ }
}

/** Local calendar date, 'YYYY-MM-DD' */
export function dateKey(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

const DEFAULT_SETTINGS = {
  preset: 'full',
  voice: true,
  bells: true,
  music: 'still-habitat' // a track id, rain | bowls | drone | silence (see music.js)
};

export const settingsStore = {
  get() {
    return { ...DEFAULT_SETTINGS, ...read(KEY_SETTINGS, {}) };
  },
  set(patch) {
    const next = { ...settingsStore.get(), ...patch };
    write(KEY_SETTINGS, next);
    return next;
  }
};

/** Tonight's plan survives reloads (and swaps/rerolls) until the date changes */
export const tonightStore = {
  get(preset) {
    const saved = read(KEY_TONIGHT, null);
    return saved && saved.dateKey === dateKey() && saved.preset === preset ? saved : null;
  },
  set(preset, rerolls, plan) {
    write(KEY_TONIGHT, { dateKey: dateKey(), preset, rerolls, plan });
  }
};

const TABLE = 'routine_sessions';
const KEY_PENDING = 'andinu.routine.pending'; // ids of sessions not yet uploaded

export const historyStore = {
  all() {
    return read(KEY_HISTORY, []);
  },
  /** Exercise ids of earlier sessions, most recent first (feeds the generator's no-repeat logic) */
  recentExerciseIds() {
    return historyStore.all().map(entry => entry.ids);
  },
  log({ ids, seconds }) {
    const entry = { id: generateUUID(), date: dateKey(), at: Date.now(), ids, seconds };
    write(KEY_HISTORY, [entry, ...historyStore.all()].slice(0, HISTORY_LIMIT));
    write(KEY_PENDING, [...read(KEY_PENDING, []), entry.id]);
    historyStore.sync();
  },

  /**
   * Upload sessions that never made it, then replace the cache with the shared history.
   * Resolves true when the cache changed. Never throws: offline just means a stale cache.
   */
  async sync() {
    if (!supabase) return false;
    try {
      const local = historyStore.all();
      const pendingIds = new Set(read(KEY_PENDING, []));
      const pending = local.filter(entry => pendingIds.has(entry.id));
      if (pending.length) {
        const { error } = await supabase.from(TABLE).upsert(
          pending.map(e => ({ id: e.id, session_date: e.date, exercise_ids: e.ids, seconds: e.seconds })),
          { onConflict: 'id', ignoreDuplicates: true }
        );
        if (error) throw error;
        write(KEY_PENDING, []);
      }

      const { data, error } = await supabase
        .from(TABLE)
        .select('id, session_date, exercise_ids, seconds, created_at')
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) throw error;

      const remote = data.map(row => ({
        id: row.id, date: row.session_date, at: Date.parse(row.created_at), ids: row.exercise_ids, seconds: row.seconds
      }));
      const stillPending = local.filter(entry => read(KEY_PENDING, []).includes(entry.id));
      const merged = [...stillPending, ...remote].sort((a, b) => b.at - a.at).slice(0, HISTORY_LIMIT);
      const changed = JSON.stringify(merged.map(e => e.id)) !== JSON.stringify(local.map(e => e.id));
      write(KEY_HISTORY, merged);
      return changed;
    } catch (e) {
      console.warn('Routine history sync failed (will retry next time):', e?.message || e);
      return false;
    }
  },

  /** Consecutive days (ending today or yesterday) with at least one finished session */
  streak() {
    const days = new Set(historyStore.all().map(entry => entry.date));
    const cursor = new Date();
    if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (days.has(dateKey(cursor))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  },
  last() {
    return historyStore.all()[0] || null;
  }
};
