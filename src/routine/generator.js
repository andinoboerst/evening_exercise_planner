// Builds tonight's session from the exercise library.
//
// A plan is plain data ({ preset, phases: [{ id, items: [{ id, work, rest }] }] }) so it can be
// stored and shown before it is turned into timer steps by buildSteps().
//
// Plans are seeded by date, so the same night gives the same plan on every device
// (phone and TV agree without syncing). A reroll changes the seed.

import { EXERCISES, PHASES, POSITION_ORDER, getExercise } from './library.js';

// Seconds of work / rest per exercise slot
const SLOT = {
  strength: { work: 60, rest: 15 },
  stretch: { work: 80, rest: 10 }
};
const WIND_SLOTS = ['breathe', 'release', 'rest']; // 3 x 100s = the 5 minute wind-down

export const PRESETS = {
  full: { id: 'full', label: 'Full', strength: 8, stretch: 10 },
  short: { id: 'short', label: 'Short', strength: 5, stretch: 6 },
  calm: { id: 'calm', label: 'Wind-down', strength: 0, stretch: 3 }
};
export const DEFAULT_PRESET = 'full';

// Focus areas a session should cover first, in priority order, before filling with anything else
const REQUIRED_FOCUS = {
  strength: ['core', 'glutes', 'upper', 'back', 'legs'],
  stretch: ['spine', 'hips', 'hamstrings', 'shoulders', 'neck']
};

// Variations of the same movement; a session never contains two from one family
const FAMILIES = [
  ['glute-bridge', 'single-leg-bridge'],
  ['supine-twist', 'seated-twist'],
  ['seated-forward-fold', 'hamstring-strap'],
  ['superman', 'swimmer'],
  ['dead-bug', 'leg-raise']
];
const familyOf = (id) => FAMILIES.find(f => f.includes(id)) || null;

// How many sessions back an exercise is still "recent" enough to be discouraged
const RECENT_WINDOW = 4;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rngFor(dateKey, preset, rerolls = 0) {
  return mulberry32(hashString(`${dateKey}|${preset}|${rerolls}`));
}

/** Lower is better: random jitter plus a penalty for exercises done in the last few sessions */
function scorer(rng, recentSessions) {
  const age = new Map();
  recentSessions.slice(0, RECENT_WINDOW).forEach((ids, i) => {
    ids.forEach(id => { if (!age.has(id)) age.set(id, i); });
  });
  return (exercise) => {
    const a = age.get(exercise.id);
    const penalty = a === undefined ? 0 : (RECENT_WINDOW - a) * 0.4;
    return rng() + penalty;
  };
}

function pickExercises(phaseId, count, rng, recentSessions) {
  if (count <= 0) return [];
  const score = scorer(rng, recentSessions);
  const pool = EXERCISES
    .filter(e => e.phase === phaseId)
    .map(e => ({ e, s: score(e) }))
    .sort((a, b) => a.s - b.s)
    .map(x => x.e);

  const chosen = [];
  const take = (exercise) => {
    const family = familyOf(exercise.id);
    if (family && chosen.some(c => family.includes(c.id))) return false;
    chosen.push(exercise);
    return true;
  };

  for (const focus of REQUIRED_FOCUS[phaseId] || []) {
    if (chosen.length >= count) break;
    if (chosen.some(c => c.focus.includes(focus))) continue;
    const match = pool.find(e => !chosen.includes(e) && e.focus.includes(focus));
    if (match) take(match);
  }
  for (const e of pool) {
    if (chosen.length >= count) break;
    if (!chosen.includes(e)) take(e);
  }

  return orderByPosition(phaseId, chosen);
}

/** Group by body position so the couple changes position as little as possible */
function orderByPosition(phaseId, exercises) {
  const order = POSITION_ORDER[phaseId];
  const libraryIndex = (e) => EXERCISES.indexOf(e);
  return [...exercises].sort((a, b) => (order.indexOf(a.pos) - order.indexOf(b.pos)) || (libraryIndex(a) - libraryIndex(b)));
}

function pickWindDown(rng, recentSessions) {
  const score = scorer(rng, recentSessions);
  return WIND_SLOTS.map(slot => {
    const options = EXERCISES.filter(e => e.phase === 'wind' && e.slot === slot);
    return options.map(e => ({ e, s: score(e) })).sort((a, b) => a.s - b.s)[0].e;
  });
}

const toItem = (exercise, phaseId) => ({
  id: exercise.id,
  work: exercise.seconds || SLOT[phaseId].work,
  rest: phaseId === 'wind' ? 0 : SLOT[phaseId].rest
});

/**
 * @param {object} opts
 * @param {string} opts.preset          key of PRESETS
 * @param {string} opts.dateKey         e.g. '2026-10-26'
 * @param {number} [opts.rerolls]       bump for a different plan on the same night
 * @param {string[][]} [opts.recent]    exercise ids of previous sessions, most recent first
 */
export function generatePlan({ preset = DEFAULT_PRESET, dateKey, rerolls = 0, recent = [] }) {
  const cfg = PRESETS[preset] || PRESETS[DEFAULT_PRESET];
  const rng = rngFor(dateKey, cfg.id, rerolls);

  const phases = [];
  if (cfg.strength > 0) {
    phases.push({ id: 'strength', items: pickExercises('strength', cfg.strength, rng, recent).map(e => toItem(e, 'strength')) });
  }
  if (cfg.stretch > 0) {
    phases.push({ id: 'stretch', items: pickExercises('stretch', cfg.stretch, rng, recent).map(e => toItem(e, 'stretch')) });
  }
  phases.push({ id: 'wind', items: pickWindDown(rng, recent).map(e => toItem(e, 'wind')) });

  return { preset: cfg.id, phases };
}

/** Replace one exercise with another from the same phase (and wind-down slot), keeping the plan balanced enough */
export function swapExercise(plan, phaseIndex, itemIndex, recent = []) {
  const phase = plan.phases[phaseIndex];
  const current = getExercise(phase.items[itemIndex].id);
  const used = new Set(plan.phases.flatMap(p => p.items.map(i => i.id)));
  const rng = mulberry32(hashString(`${current.id}|${Date.now()}`));
  const score = scorer(rng, recent);

  const options = EXERCISES
    .filter(e => e.phase === current.phase && !used.has(e.id) && (current.phase !== 'wind' || e.slot === current.slot))
    .filter(e => {
      const family = familyOf(e.id);
      return !family || !phase.items.some((it, i) => i !== itemIndex && family.includes(it.id));
    })
    // Prefer the same body position so the flow of the session survives the swap
    .map(e => ({ e, s: score(e) + (e.pos === current.pos ? 0 : 1) }))
    .sort((a, b) => a.s - b.s);

  if (options.length === 0) return plan;
  const next = structuredClone(plan);
  next.phases[phaseIndex].items[itemIndex] = toItem(options[0].e, current.phase);
  return next;
}

export function planExerciseIds(plan) {
  return plan.phases.flatMap(p => p.items.map(i => i.id));
}

/** Total seconds of a plan, including rests */
export function planDurationSec(plan) {
  return plan.phases.reduce((acc, p) => acc + p.items.reduce((a, i) => a + i.work + i.rest, 0), 0);
}

export function phaseDurationSec(phase) {
  return phase.items.reduce((a, i) => a + i.work + i.rest, 0);
}

/**
 * Flatten a plan into timer steps. Per-side exercises become two work steps (left, right).
 * A rest step knows which exercise comes next so the coach can announce it.
 */
export function buildSteps(plan) {
  const flat = [];
  plan.phases.forEach((phasePlan, phaseIndex) => {
    phasePlan.items.forEach((item, itemIndex) => {
      flat.push({ phaseIndex, itemIndex, item, exercise: getExercise(item.id), phase: PHASES[phasePlan.id] });
    });
  });

  const steps = [];
  flat.forEach((entry, i) => {
    const { exercise, item } = entry;
    const common = { phaseIndex: entry.phaseIndex, itemIndex: entry.itemIndex, phase: entry.phase, exercise };
    if (exercise.perSide) {
      const half = Math.round(item.work / 2);
      steps.push({ ...common, isRest: false, duration: half, side: 'left', sideCount: 2 });
      steps.push({ ...common, isRest: false, duration: item.work - half, side: 'right', sideCount: 2 });
    } else {
      steps.push({ ...common, isRest: false, duration: item.work, side: null });
    }
    if (item.rest > 0) {
      const next = flat[i + 1];
      steps.push({ ...common, isRest: true, duration: item.rest, side: null, next: next ? next.exercise : null });
    }
  });
  return steps;
}

export const totalDurationSec = (steps) => steps.reduce((acc, s) => acc + s.duration, 0);
