// Night routine: setup screen, guided player, completion screen.
// Works on a phone and on a TV browser: one press starts it, and the remote's arrows/OK drive it.
import { audioEngine } from '../audio/audioEngine.js';
import { wakeLockService } from '../services/wakeLock.js';
import { RoutineSession } from '../routine/session.js';
import { PRESETS, DEFAULT_PRESET, generatePlan, swapExercise, buildSteps, planDurationSec, phaseDurationSec, planExerciseIds } from '../routine/generator.js';
import { PHASES, getExercise } from '../routine/library.js';
import { renderMedia, setMediaPlaying } from '../routine/media.js';
import { music, TRACKS, SOUNDSCAPES, DEFAULT_MUSIC, isValidMusic } from '../routine/music.js';
import { settingsStore, tonightStore, historyStore, dateKey } from '../routine/store.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import '../routine/routine.css';

const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const COUNTDOWN_FROM = 3;

const PHASE_ICONS = {
  strength: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  stretch: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
  wind: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
};
const icon = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name}</svg>`;

const ICON = {
  prev: '<path d="M19 20 9 12l10-8v16z"/><path d="M5 19V5"/>',
  next: '<path d="m5 4 10 8-10 8V4z"/><path d="M19 5v14"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m6 4 14 8-14 8V4z"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  swap: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/><circle cx="8.5" cy="15.5" r="1"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  voice: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  voiceOff: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/>'
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let root = null;
let navigate = null;
let settings = settingsStore.get();
let rerolls = 0;
let plan = null;
let screen = 'idle'; // idle | active | done
let confirmingExit = false;
let shownMediaKey = null;
let doneSummary = null;

const session = new RoutineSession({
  onTick: handleTick,
  onStepChange: handleStepChange,
  onComplete: handleComplete
});

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

function loadPlan() {
  const saved = tonightStore.get(settings.preset);
  if (saved) {
    plan = saved.plan;
    rerolls = saved.rerolls;
    return;
  }
  rerolls = 0;
  plan = generatePlan({ preset: settings.preset, dateKey: dateKey(), rerolls, recent: historyStore.recentExerciseIds() });
  tonightStore.set(settings.preset, rerolls, plan);
}

function reroll() {
  rerolls++;
  plan = generatePlan({ preset: settings.preset, dateKey: dateKey(), rerolls, recent: historyStore.recentExerciseIds() });
  tonightStore.set(settings.preset, rerolls, plan);
  renderIdle();
}

function swap(phaseIndex, itemIndex) {
  plan = swapExercise(plan, phaseIndex, itemIndex, historyStore.recentExerciseIds());
  tonightStore.set(settings.preset, rerolls, plan);
  renderIdle();
  // Keep the d-pad/keyboard position on the swapped row
  root.querySelector(`[data-swap="${phaseIndex}:${itemIndex}"]`)?.focus();
}

function setPreset(id) {
  settings = settingsStore.set({ preset: id });
  loadPlan();
  renderIdle();
  root.querySelector(`[data-preset="${id}"]`)?.focus();
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const minutes = (sec) => Math.round(sec / 60);

function formatTime(sec) {
  const total = Math.max(0, Math.floor(sec));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function describeLast() {
  const last = historyStore.last();
  if (!last) return 'Your first night together.';
  const days = Math.round((new Date(dateKey()) - new Date(last.date)) / 86400000);
  const when = days === 0 ? 'earlier today' : days === 1 ? 'yesterday' : `${days} days ago`;
  return `Last session ${when}.`;
}

// ---------------------------------------------------------------------------
// Idle screen
// ---------------------------------------------------------------------------

function renderIdle() {
  screen = 'idle';
  const streak = historyStore.streak();
  const total = planDurationSec(plan);

  root.innerHTML = `
    <div class="rt rt-idle">
      <header class="rt-top">
        <button type="button" class="rt-btn rt-btn-ghost" data-action="home">${icon(ICON.back)} Home</button>
        <div class="rt-top-meta">
          ${streak > 0 ? `<span class="rt-chip">${streak} night${streak === 1 ? '' : 's'} in a row</span>` : ''}
        </div>
      </header>

      <section class="rt-hero">
        <h1 class="rt-title">Tonight’s routine</h1>
        <p class="rt-sub">${minutes(total)} minutes on the mat. ${escapeHtml(describeLast())}</p>
      </section>

      <div class="rt-presets" role="group" aria-label="Session length">
        ${Object.values(PRESETS).map(p => {
          const preview = p.id === settings.preset ? total : null;
          return `<button type="button" class="rt-preset ${p.id === settings.preset ? 'is-on' : ''}" data-preset="${p.id}" aria-pressed="${p.id === settings.preset}">
            <span class="rt-preset-label">${p.label}</span>
            <span class="rt-preset-min">${preview ? `${minutes(preview)} min` : `~${presetMinutes(p)} min`}</span>
          </button>`;
        }).join('')}
      </div>

      <button type="button" class="rt-start" data-action="start" autofocus>
        ${icon(ICON.play, 28)}<span>Start</span>
      </button>

      <section class="rt-plan" aria-label="Tonight’s plan">
        ${plan.phases.map((phase, pi) => `
          <div class="rt-plan-phase" style="--phase:${PHASES[phase.id].color}">
            <h2 class="rt-plan-phase-title">
              <span class="rt-phase-icon">${icon(PHASE_ICONS[phase.id], 16)}</span>
              ${PHASES[phase.id].title}
              <span class="rt-plan-phase-min">${minutes(phaseDurationSec(phase))} min</span>
            </h2>
            <ul class="rt-plan-list">
              ${phase.items.map((item, ii) => {
                const ex = getExercise(item.id);
                return `<li class="rt-plan-item">
                  <span class="rt-plan-name">${escapeHtml(ex.name)}${ex.perSide ? '<span class="rt-tag">each side</span>' : ''}</span>
                  <span class="rt-plan-time">${item.work}s</span>
                  <button type="button" class="rt-icon-btn" data-swap="${pi}:${ii}" aria-label="Swap ${escapeHtml(ex.name)}">${icon(ICON.swap, 16)}</button>
                </li>`;
              }).join('')}
            </ul>
          </div>`).join('')}
        <button type="button" class="rt-btn rt-btn-ghost rt-reroll" data-action="reroll">${icon(ICON.dice, 18)} Shuffle everything</button>
      </section>

      <section class="rt-settings" aria-label="Sound">
        <h2 class="rt-settings-title">Sound</h2>
        <div class="rt-toggles">
          <button type="button" class="rt-toggle ${settings.voice ? 'is-on' : ''}" data-toggle="voice" aria-pressed="${settings.voice}">${icon(settings.voice ? ICON.voice : ICON.voiceOff, 18)} Voice guide</button>
          <button type="button" class="rt-toggle ${settings.bells ? 'is-on' : ''}" data-toggle="bells" aria-pressed="${settings.bells}">${icon(ICON.music, 18)} Bells &amp; beeps</button>
        </div>
        <h3 class="rt-settings-sub">Music</h3>
        <div class="rt-ambient" role="group" aria-label="Music">
          ${[...TRACKS, ...SOUNDSCAPES].map(o => `<button type="button" class="rt-pill ${o.id === settings.music ? 'is-on' : ''}" data-music="${o.id}" aria-pressed="${o.id === settings.music}">${o.label}</button>`).join('')}
        </div>
        <p class="rt-hint">Music starts by itself, dips when the coach speaks and fades out at the end. Calm Pills by Alaeddin Hallak (Uplifting Pills), CC0, streamed from the Internet Archive. If it can\u2019t load, a soft generated sound plays instead.</p>
      </section>
    </div>`;
}

function presetMinutes(preset) {
  const p = generatePlan({ preset: preset.id, dateKey: dateKey(), rerolls: 0 });
  return minutes(planDurationSec(p));
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

function startRoutine() {
  session.setSteps(buildSteps(plan));

  // Audio and fullscreen both need this user gesture
  audioEngine.ensureContext();
  audioEngine.voiceEnabled = settings.voice;
  audioEngine.soundEffectsEnabled = settings.bells;
  music.start(settings.music);
  wakeLockService.requestLock();
  document.documentElement.requestFullscreen?.().catch(() => {});

  screen = 'active';
  confirmingExit = false;
  root.innerHTML = '';
  session.start();
  music.setPhase(session.currentStep.phase.id);
  renderActive();
  announce(session.currentStep, null, 'start');
  document.addEventListener('keydown', onKeydown);
}

function renderActive() {
  const step = session.currentStep;
  if (!step) return;
  const resting = step.isRest;
  const focusExercise = resting && step.next ? step.next : step.exercise;
  const paused = session.paused;

  // The shell and the demo area persist between steps: replacing an iframe would reload (restart) the clip
  let shell = root.querySelector('.rt-active');
  if (!shell) {
    root.innerHTML = `
      <div class="rt rt-active">
        <header class="rt-bar"></header>
        <main class="rt-stage"><div class="rt-media"></div><div class="rt-info"></div></main>
        <footer class="rt-controls"></footer>
        <div class="rt-overlay"></div>
      </div>`;
    shell = root.querySelector('.rt-active');
    shownMediaKey = null;
  }
  shell.classList.toggle('is-rest', resting);
  shell.style.setProperty('--phase', step.phase.color);

  shell.querySelector('.rt-bar').innerHTML = barHtml(step);
  shell.querySelector('.rt-info').innerHTML = infoHtml(step);
  shell.querySelector('.rt-controls').innerHTML = controlsHtml(paused);
  shell.querySelector('.rt-overlay').innerHTML = confirmingExit ? confirmHtml() : paused ? '<div class="rt-paused" aria-hidden="true">Paused</div>' : '';

  if (focusExercise.id !== shownMediaKey) {
    shownMediaKey = focusExercise.id;
    const media = shell.querySelector('.rt-media');
    const html = renderMedia(focusExercise);
    media.classList.toggle('is-empty', !html);
    media.innerHTML = html || `<span class="rt-media-fallback">${icon(PHASE_ICONS[step.phase.id], 72)}</span>`;
  }

  setMediaPlaying(root, !(paused || confirmingExit));
  root.querySelector(confirmingExit ? '[data-action="resume"]' : '[data-action="toggle"]')?.focus();
}

function barHtml(step) {
  return `
    <ol class="rt-phases" aria-label="Progress">
      ${plan.phases.map((p, i) => `<li class="rt-phase-seg ${i < step.phaseIndex ? 'is-done' : ''} ${i === step.phaseIndex ? 'is-current' : ''}" style="--seg:${PHASES[p.id].color}">${PHASES[p.id].title}</li>`).join('')}
    </ol>
    <span class="rt-remaining" data-total-remaining>${formatTime(session.totalRemainingSec)} left</span>
    <button type="button" class="rt-icon-btn" data-action="exit" aria-label="End routine">${icon(ICON.close, 22)}</button>`;
}

function infoHtml(step) {
  const resting = step.isRest;
  const label = resting
    ? 'Rest'
    : `${step.phase.title}${step.side ? ` \u00b7 ${step.side === 'left' ? 'Left' : 'Right'} side` : ''}`;
  const title = resting ? (step.next ? `Next: ${step.next.name}` : 'Almost there') : step.exercise.name;
  const detail = resting ? (step.next ? step.next.cue : '') : step.exercise.cue;
  const tip = !resting && step.exercise.tip ? step.exercise.tip : '';
  return `
    <p class="rt-label">${escapeHtml(label)}</p>
    <h1 class="rt-name">${escapeHtml(title)}</h1>
    <div class="rt-timer">
      <svg viewBox="0 0 120 120" class="rt-ring" aria-hidden="true">
        <circle class="rt-ring-track" cx="60" cy="60" r="${RING_RADIUS}"></circle>
        <circle class="rt-ring-fill" cx="60" cy="60" r="${RING_RADIUS}" stroke-dasharray="${RING_LENGTH}" stroke-dashoffset="${RING_LENGTH * (1 - ringProgress())}"></circle>
      </svg>
      <span class="rt-time" data-time>${formatTime(session.remainingSec)}</span>
    </div>
    <p class="rt-cue">${escapeHtml(detail)}</p>
    ${tip ? `<p class="rt-tip"><strong>Together:</strong> ${escapeHtml(tip)}</p>` : ''}
    ${!resting ? upNextHtml() : ''}`;
}

function controlsHtml(paused) {
  return `
    <button type="button" class="rt-ctl" data-action="prev" aria-label="Previous">${icon(ICON.prev, 28)}</button>
    <button type="button" class="rt-ctl rt-ctl-main" data-action="toggle" aria-label="${paused ? 'Resume' : 'Pause'}">${icon(paused ? ICON.play : ICON.pause, 36)}</button>
    <button type="button" class="rt-ctl" data-action="next" aria-label="Next">${icon(ICON.next, 28)}</button>
    <button type="button" class="rt-ctl rt-ctl-side ${settings.voice ? '' : 'is-off'}" data-action="voice" aria-label="Voice guide ${settings.voice ? 'on' : 'off'}" aria-pressed="${settings.voice}">${icon(settings.voice ? ICON.voice : ICON.voiceOff, 24)}</button>`;
}

function upNextHtml() {
  const steps = session.steps;
  const current = session.currentStep;
  const upcoming = steps.slice(session.stepIndex + 1).find(s => !s.isRest && s.exercise.id !== current.exercise.id);
  if (!upcoming) return '<p class="rt-next">Last one — then rest.</p>';
  return `<p class="rt-next">Up next: <strong>${escapeHtml(upcoming.exercise.name)}</strong></p>`;
}

function confirmHtml() {
  return `
    <div class="rt-modal" role="dialog" aria-modal="true" aria-labelledby="rt-confirm-title">
      <div class="rt-modal-card">
        <h2 id="rt-confirm-title">End tonight’s routine?</h2>
        <p>Your progress won’t be saved.</p>
        <div class="rt-modal-actions">
          <button type="button" class="rt-btn rt-btn-primary" data-action="resume">Keep going</button>
          <button type="button" class="rt-btn rt-btn-ghost" data-action="end">End routine</button>
        </div>
      </div>
    </div>`;
}

function ringProgress() {
  const step = session.currentStep;
  if (!step) return 0;
  return Math.min(1, Math.max(0, 1 - session.remainingMs / (step.duration * 1000)));
}

// --- Session callbacks -------------------------------------------------------

function handleTick(sec, step) {
  const timeEl = root?.querySelector('[data-time]');
  if (!timeEl) return;
  timeEl.textContent = formatTime(sec);
  root.querySelector('.rt-ring-fill')?.setAttribute('stroke-dashoffset', String(RING_LENGTH * (1 - ringProgress())));
  const total = root.querySelector('[data-total-remaining]');
  if (total) total.textContent = `${formatTime(session.totalRemainingSec)} left`;

  if (sec > 0 && sec <= COUNTDOWN_FROM && step.phase.id !== 'wind') {
    audioEngine.playCountdownBeep(sec);
  }
  const isHold = !step.isRest && step.duration >= 50 && step.phase.id !== 'wind';
  if (isHold && sec === Math.floor(step.duration / 2)) {
    audioEngine.playHalfwayDing();
    audioEngine.speak('Halfway.');
  }
}

function handleStepChange(step, prev, reason) {
  music.setPhase(step.phase.id);
  renderActive();
  announce(step, prev, reason);
}

/** What the coach says and which sound plays when a step begins */
function announce(step, prev, reason) {
  const newPhase = !prev || prev.phaseIndex !== step.phaseIndex;
  if (newPhase && prev) audioEngine.playPhaseGong(); else audioEngine.playChime('start');

  const lines = [];
  if (newPhase && prev) lines.push(PHASE_INTROS[step.phase.id]);

  if (step.isRest) {
    if (step.next) lines.push(`Rest. Next up, ${step.next.name}.`);
  } else if (step.side === 'right') {
    lines.push('Switch sides.');
  } else {
    const side = step.side === 'left' ? ', left side first' : '';
    lines.push(`${step.exercise.name}${side}.`, step.exercise.cue);
  }

  // Manual skipping should cut off whatever was being said; automatic changes queue politely
  if (lines.length) audioEngine.speak(lines.join(' '), reason !== 'auto' || newPhase);
}

const PHASE_INTROS = {
  strength: 'Let’s begin with strength.',
  stretch: 'Strength done. Now let’s stretch and release.',
  wind: 'Time to wind down. Lie back and close your eyes if you like.'
};

function handleComplete() {
  const ids = planExerciseIds(plan);
  const seconds = session.totalSec;
  historyStore.log({ ids, seconds });
  const exercises = plan.phases.filter(p => p.id !== 'wind').reduce((n, p) => n + p.items.length, 0);
  doneSummary = { minutes: minutes(seconds), exercises, streak: historyStore.streak() };
  teardownPlayer(6);
  audioEngine.playChime('complete');
  audioEngine.speak('Well done. Sleep well.', true);
  renderDone();
}

function teardownPlayer(fadeSec = 1.5) {
  document.removeEventListener('keydown', onKeydown);
  music.stop(fadeSec);
  wakeLockService.releaseLock();
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}

// ---------------------------------------------------------------------------
// Done screen
// ---------------------------------------------------------------------------

function renderDone() {
  screen = 'done';
  root.innerHTML = `
    <div class="rt rt-done">
      <div class="rt-done-card">
        <div class="rt-done-moon">${icon(PHASE_ICONS.wind, 56)}</div>
        <h1 class="rt-title">Well done</h1>
        <p class="rt-sub">${doneSummary.minutes} minutes, ${doneSummary.exercises} exercises, together.</p>
        <p class="rt-sub">${doneSummary.streak} night${doneSummary.streak === 1 ? '' : 's'} in a row. Sleep well.</p>
        <button type="button" class="rt-btn rt-btn-primary rt-done-btn" data-action="finish" autofocus>Done</button>
      </div>
    </div>`;
  root.querySelector('[data-action="finish"]')?.focus();
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function togglePause() {
  if (!session.running) return;
  if (session.paused) {
    session.resume();
    music.resume();
    setMediaPlaying(root, true);
  } else {
    session.pause();
    music.pause();
    audioEngine.stopSpeech();
    setMediaPlaying(root, false);
  }
  renderActive();
}

function requestExit() {
  if (!session.paused) { session.pause(); music.pause(); }
  audioEngine.stopSpeech();
  confirmingExit = true;
  renderActive();
}

function resumeFromExit() {
  confirmingExit = false;
  session.resume();
  music.resume();
  setMediaPlaying(root, true);
  renderActive();
}

function endRoutine() {
  session.stop();
  audioEngine.stopSpeech();
  teardownPlayer();
  loadPlan();
  renderIdle();
  focusStart();
}

function toggleVoice() {
  settings = settingsStore.set({ voice: !settings.voice });
  audioEngine.voiceEnabled = settings.voice;
  if (!settings.voice) audioEngine.stopSpeech();
  renderActive();
}

function onKeydown(event) {
  if (screen !== 'active') return;
  const onControl = event.target instanceof HTMLElement && event.target.closest('button, a, input, select');
  switch (event.key) {
    case 'ArrowRight':
    case 'MediaTrackNext':
      if (!confirmingExit && !onControl) session.next();
      break;
    case 'ArrowLeft':
    case 'MediaTrackPrevious':
      if (!confirmingExit && !onControl) session.prev();
      break;
    case ' ':
    case 'Enter':
    case 'MediaPlayPause':
      // A focused button already handles Enter/Space itself
      if (!onControl && !confirmingExit) { event.preventDefault(); togglePause(); }
      break;
    case 'Escape':
    case 'Backspace':
    case 'BrowserBack':
      event.preventDefault();
      if (confirmingExit) resumeFromExit(); else requestExit();
      break;
    default:
      return;
  }
}

function focusStart() {
  root?.querySelector('[data-action="start"]')?.focus();
}

// ---------------------------------------------------------------------------
// Click handling (one delegated listener)
// ---------------------------------------------------------------------------

function onClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  const el = target?.closest('[data-action], [data-preset], [data-swap], [data-toggle], [data-music]');
  if (!el || !root.contains(el)) return;

  if (el.dataset.preset) return setPreset(el.dataset.preset);
  if (el.dataset.swap) {
    const [pi, ii] = el.dataset.swap.split(':').map(Number);
    return swap(pi, ii);
  }
  if (el.dataset.toggle) {
    settings = settingsStore.set({ [el.dataset.toggle]: !settings[el.dataset.toggle] });
    renderIdle();
    return root.querySelector(`[data-toggle="${el.dataset.toggle}"]`)?.focus();
  }
  if (el.dataset.music) {
    settings = settingsStore.set({ music: el.dataset.music });
    renderIdle();
    return root.querySelector(`[data-music="${el.dataset.music}"]`)?.focus();
  }

  switch (el.dataset.action) {
    case 'home': return navigate?.('/');
    case 'start': return startRoutine();
    case 'reroll': return reroll();
    case 'toggle': return togglePause();
    case 'prev': return session.prev();
    case 'next': return session.next();
    case 'voice': return toggleVoice();
    case 'exit': return requestExit();
    case 'resume': return resumeFromExit();
    case 'end': return endRoutine();
    case 'finish':
      loadPlan();
      renderIdle();
      return focusStart();
  }
}

// ---------------------------------------------------------------------------
// Mount / unmount
// ---------------------------------------------------------------------------

export async function mountRoutine(container, navigateTo) {
  root = container;
  navigate = navigateTo;
  settings = settingsStore.get();
  if (!PRESETS[settings.preset]) settings = settingsStore.set({ preset: DEFAULT_PRESET });
  if (!isValidMusic(settings.music)) settings = settingsStore.set({ music: DEFAULT_MUSIC });
  root.addEventListener('click', onClick);
  const mounted = root;

  // Tonight's first plan should know what was done recently on any device, so give the shared
  // history a moment to arrive. Offline or slow: carry on with what this device remembers.
  const synced = historyStore.sync();
  if (!tonightStore.get(settings.preset)) {
    root.innerHTML = '<div class="rt rt-loading">Preparing tonight\u2019s routine\u2026</div>';
    await Promise.race([synced, new Promise(resolve => setTimeout(resolve, 1500))]);
    if (root !== mounted) return;
  }
  loadPlan();
  renderIdle();
  focusStart();

  // If history arrives later, refresh the stats (the plan itself stays locked for the night)
  synced.then(changed => {
    if (!changed || root !== mounted || screen !== 'idle') return;
    renderIdle();
    focusStart();
  });
}

export function unmountRoutine() {
  session.stop();
  audioEngine.stopSpeech();
  teardownPlayer();
  root?.removeEventListener('click', onClick);
  root = null;
}
