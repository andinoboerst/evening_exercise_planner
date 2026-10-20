import { WEEKLY_ROUTINES, getRoutineForDay } from '../data/routines.js';
import { audioEngine } from '../audio/audioEngine.js';
import { spotifyService, CURATED_PLAYLISTS } from '../services/spotify.js';
import { wakeLockService } from '../services/wakeLock.js';
import { RoutineSession, buildSteps, totalDurationSec } from '../routine/session.js';
import { music, SOURCE } from '../routine/music.js';
import { getPoseImage } from '../utils/poseImages.js';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { escapeHtml } from '../utils/escapeHtml.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let routineContainer = null;
let activeRoutine = getRoutineForDay(new Date().getDay());

// Phases the couple wants tonight (customisable before starting)
const enabledPhases = { strength: true, mobility: true, windDown: true };

// Voice / bell preferences (music preferences live in the music controller)
const settings = { voiceEnabled: true, soundEffectsEnabled: true };

const TIMER_RADIUS = 60; // Duo circular timer radius (viewBox 0 0 140 140, cx 70, cy 70)

const session = new RoutineSession({
  onTick: handleTick,
  onStepChange: handleStepChange,
  onComplete: handleComplete
});

let isStarting = false;

const PHASE_META = [
  { id: 'strength', cssClass: 'strength', label: 'Strength', icon: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>' },
  { id: 'mobility', cssClass: 'mobility', label: 'Mobility', icon: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>' },
  { id: 'windDown', cssClass: 'winddown', label: 'Wind Down', icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' }
];

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

function rebuildSteps() {
  session.setSteps(buildSteps(activeRoutine, enabledPhases));
}

const isLive = () => session.running && !session.paused;
const isRunningNow = () => session.running;
const isPausedNow = () => session.paused;
const isSpotifyApp = () => music.source === SOURCE.APP;
const isSpotifyEmbed = () => music.source === SOURCE.EMBED;
const canShuffle = () => music.source === SOURCE.APP && spotifyService.isConnected();

const getEnabledDurationSec = () => totalDurationSec(session.steps);
const getEnabledDurationMin = () => Math.round(getEnabledDurationSec() / 60);
const getRoutineElapsedSec = () => session.elapsedSec;
const getRoutineRemainingSec = () => (session.running ? Math.ceil(session.totalRemainingSec) : getEnabledDurationSec());

function routineMinutes(routine) {
  if (!routine) return getEnabledDurationMin();
  return Math.round(totalDurationSec(buildSteps(routine, enabledPhases)) / 60);
}

function phaseMinutes(phaseId) {
  const phase = activeRoutine.phases.find(p => p.id === phaseId);
  if (!phase) return 0;
  return Math.round(phase.exercises.reduce((acc, ex) => acc + ex.duration + (ex.rest || 0), 0) / 60);
}

// Format seconds into MM:SS
function formatTime(sec) {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function renderPhasePills() {
  return PHASE_META.map((meta, idx) => {
    const enabled = enabledPhases[meta.id];
    const current = session.running && session.currentStep?.phaseIndex === idx;
    return `
      <div class="phase-pill ${meta.cssClass} ${!enabled ? 'disabled' : ''} ${current ? 'current-phase' : ''}">
        <span class="phase-pill-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">${meta.icon}</svg>
          ${meta.label}
        </span>
        <span class="phase-pill-duration">${enabled ? `${phaseMinutes(meta.id)} min` : 'Skipped'}</span>
      </div>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

// Render Main App Shell
function renderApp(container = routineContainer) {
  const appEl = container;
  if (!appEl) return;
  appEl.innerHTML = `
    <!-- Top Header -->
    <header class="app-header">
      <div class="brand">
        <div class="brand-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </div>
        <div>
          <h1 class="brand-title">AndiNú</h1>
          <div class="brand-subtitle">
            <span>${getEnabledDurationMin()}m Couples Mat Routine</span>
            <span>•</span>
            <span id="wake-lock-badge" style="color: #38bdf8;">${wakeLockService.isActive ? 'Screen Awake' : ''}</span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button id="btn-spotify-hub" class="icon-btn ${spotifyService.isConnected() ? 'spotify-active' : ''}" title="Spotify Music">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.627.627 0 0 1-.861.208c-2.361-1.442-5.334-1.769-8.835-.969a.626.626 0 1 1-.28-1.222c3.83-.876 7.123-.502 9.768 1.122.288.177.38.552.208.861zm1.226-2.729a.784.784 0 0 1-1.079.258c-2.7-1.66-6.817-2.14-10.01-1.171a.785.785 0 0 1-.453-1.503c3.652-1.107 8.196-.574 11.284 1.336a.786.786 0 0 1 .258 1.08zm.105-2.836C14.685 8.94 9.356 8.764 6.27 9.7a.942.942 0 1 1-.547-1.802c3.551-1.077 9.43-.87 13.167 1.348a.943.943 0 0 1-.973 1.613z"/>
          </svg>
        </button>
        <button id="btn-audio-toggle" class="icon-btn ${settings.soundEffectsEnabled ? 'active' : ''}" title="Sound FX">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
        <button id="btn-install-guide" class="icon-btn" title="Sideload & Install App">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      </div>
    </header>

    <!-- Day of Week Selector -->
    <div class="day-selector-container">
      <div class="day-strip" id="day-strip">
        ${[1, 2, 3, 4, 5, 6, 0].map(dIdx => {
          const r = WEEKLY_ROUTINES.find(item => item.dayIndex === dIdx);
          const isToday = new Date().getDay() === dIdx;
          const isSelected = activeRoutine.dayIndex === dIdx;
          const shortName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dIdx];
          return `
            <button class="day-chip ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''}" data-day="${dIdx}">
              <span class="day-chip-name">${shortName}</span>
              <span class="day-chip-state">${isToday ? 'Today' : `${routineMinutes(r)}m`}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Phase Breakdown Pills -->
    <div class="phase-breakdown-bar">${renderPhasePills()}</div>

    <!-- Main Dynamic Stage -->
    <main class="main-stage" id="main-stage">
      <!-- Injected via updateStageUI() -->
    </main>

    <!-- Persistent Spotify Bedtime Player Dock (Mounted once, never unmounted across routine transitions!) -->
    <div id="spotify-player-dock" class="spotify-player-dock ${music.isSpotify ? '' : 'hidden'}">
      <div class="spotify-inapp-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="spotify-icon-dot">🎧</span>
          <div>
            <span class="spotify-inapp-title" id="spotify-dock-title">${music.playlist.name}</span>
            <span class="spotify-inapp-sub" id="spotify-dock-status">
              ${music.statusText(isRunningNow(), isPausedNow())}
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button id="btn-dock-shuffle" class="icon-btn" style="width: auto; height: 30px; padding: 0 10px; font-size: 0.72rem; font-weight: 600; display: ${canShuffle() ? 'inline-flex' : 'none'};" title="Shuffle to a fresh song">
            🔀 Shuffle
          </button>
          <button id="btn-dock-play-pause" class="icon-btn" style="width: auto; height: 30px; padding: 0 10px; font-size: 0.72rem; font-weight: 600; display: ${session.running && music.canRemoteControl ? 'inline-flex' : 'none'};">
            ${session.paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <a id="btn-dock-open-app" href="${music.playlist.uri}" target="_blank" rel="noopener noreferrer" class="icon-btn" style="width: auto; height: 30px; padding: 0 10px; font-size: 0.72rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; color: var(--spotify-green);" title="Play in Spotify app with shuffled starting track">
            Spotify App ↗
          </a>
          <button id="btn-dock-change-playlist" class="icon-btn" style="width: auto; height: 30px; padding: 0 10px; font-size: 0.72rem; font-weight: 600;">
            Change
          </button>
        </div>
      </div>
      <div id="spotify-embed-container" style="margin-top: 8px; display: ${music.source === SOURCE.EMBED ? 'block' : 'none'};"></div>
    </div>

    <!-- Overall Session Progress Bar (Bottom) -->
    <div class="bottom-timeline-wrapper" style="margin-top: 14px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-dim); margin-bottom: 4px;">
        <span>Routine Progress</span>
        <span id="overall-time-counter">${formatTime(getRoutineElapsedSec())} / ${formatTime(getEnabledDurationSec())}</span>
      </div>
      <div class="overall-timeline">
        <div class="overall-timeline-progress" id="overall-timeline-bar" style="width: ${(getRoutineElapsedSec() / Math.max(1, getEnabledDurationSec())) * 100}%;"></div>
      </div>
    </div>

    <!-- Bottom Secondary Actions -->
    <footer class="bottom-strip">
      <button class="action-tile-btn" id="btn-view-routine">
        <div class="action-tile-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
        </div>
        <div class="action-tile-text">
          <span class="action-tile-title">Exercise List</span>
          <span class="action-tile-subtitle">View all steps</span>
        </div>
      </button>
      <button class="action-tile-btn" id="btn-music-selector">
        <div class="action-tile-icon" style="color: var(--spotify-green);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
        </div>
        <div class="action-tile-text">
          <span class="action-tile-title">Bedtime Music</span>
          <span class="action-tile-subtitle" id="music-status-subtitle">Spotify & Ambient</span>
        </div>
      </button>
    </footer>

    <!-- Modals & Drawers -->
    <div id="modal-container"></div>
  `;

  bindEvents();
  updateStageUI();
  updateDockState();
}

// Render either the Idle Card or Active Workout Card
function updateStageUI() {
  const stageEl = document.getElementById('main-stage');
  if (!stageEl) return;

  if (!session.running) {
    // Render Idle Screen
    stageEl.innerHTML = `
      <section class="idle-card">
        <div class="idle-header">
          <div class="badge-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            ${activeRoutine.dayName} Plan
          </div>
          <h2 class="routine-headline">${activeRoutine.title}</h2>
          <p class="routine-tagline">${activeRoutine.tagline}</p>
        </div>

        <div class="couples-badge">
          <span class="couples-badge-icon">🧘‍♀️🧘‍♂️</span>
          <div class="couples-badge-text">
            <strong>Couples Floor Mat Synchronized:</strong> Built for two people side-by-side. If either reaches fatigue first, rest into child's pose while your partner finishes the interval — no stress!
          </div>
        </div>

        <!-- Phase Customization Checkboxes -->
        <div class="phase-selector-card">
          <div class="phase-selector-header">
            <span class="phase-selector-title">Select Tonight's Blocks:</span>
            <span class="phase-selector-total" id="active-total-label">${getEnabledDurationMin()} min total</span>
          </div>
          <div class="phase-checkbox-list">
            <label class="phase-toggle-card ${enabledPhases.strength ? 'selected' : 'disabled'}" for="chk-phase-strength">
              <input type="checkbox" id="chk-phase-strength" ${enabledPhases.strength ? 'checked' : ''} />
              <div class="phase-toggle-info">
                <span class="phase-toggle-name">🔥 Strength & Core (10m)</span>
                <span class="phase-toggle-meta">Planks, Push-ups, Mat stability</span>
              </div>
            </label>
            <label class="phase-toggle-card ${enabledPhases.mobility ? 'selected' : 'disabled'}" for="chk-phase-mobility">
              <input type="checkbox" id="chk-phase-mobility" ${enabledPhases.mobility ? 'checked' : ''} />
              <div class="phase-toggle-info">
                <span class="phase-toggle-name">✨ Stretching & Mobility (15m)</span>
                <span class="phase-toggle-meta">Spine decompression, Cat-Cow, Back & Hips</span>
              </div>
            </label>
            <label class="phase-toggle-card ${enabledPhases.windDown ? 'selected' : 'disabled'}" for="chk-phase-winddown">
              <input type="checkbox" id="chk-phase-winddown" ${enabledPhases.windDown ? 'checked' : ''} />
              <div class="phase-toggle-info">
                <span class="phase-toggle-name">🌙 Wind-Down & Meditation (5m)</span>
                <span class="phase-toggle-meta">4-7-8 Breathing, Savasana sleep transition</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Audio Source Selector -->
        <div style="margin-bottom: 14px;">
          <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Bedtime Audio Mode:
          </div>
          <div class="audio-source-strip">
            <button class="audio-tab-btn spotify-tab ${isSpotifyApp() ? 'active' : ''}" id="tab-src-spotify-app">
              <span>📱 Spotify App</span>
            </button>
            <button class="audio-tab-btn ${music.source === 'ambient' ? 'active' : ''}" id="tab-src-ambient">
              <span>🟣 Ambient</span>
            </button>
            <button class="audio-tab-btn ${isSpotifyEmbed() ? 'active' : ''}" id="tab-src-spotify-embed">
              <span>🌐 Web Mini</span>
            </button>
            <button class="audio-tab-btn ${music.source === 'silent' ? 'active' : ''}" id="tab-src-silent">
              <span>⚪ Silent</span>
            </button>
          </div>
        </div>

        ${isSpotifyApp() ? `
          <div class="spotify-mode-guide">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #fff;">
                📱 Full Songs via Spotify App
              </div>
              <a href="${music.playlist.uri}" target="_blank" rel="noopener noreferrer" class="btn-open-spotify-inline">
                Open in Spotify & Play ↗
              </a>
            </div>
            <p style="font-size: 0.76rem; color: #cbd5e1; line-height: 1.4; margin: 0;">
              Tap <strong>Open in Spotify & Play</strong>, hit play in Spotify, then return here and tap <strong>START ROUTINE</strong>. Spotify keeps playing uninterrupted in the background!
            </p>
          </div>
        ` : ''}

        ${music.source === 'ambient' ? `
          <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.78rem; font-weight: 700; color: #c4b5fd;">Select Ambient Soundscape:</span>
              <span style="font-size: 0.7rem; color: #a5b4fc; background: rgba(139,92,246,0.2); padding: 2px 6px; border-radius: 4px;">Ducks during voice</span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="day-chip ${music.ambientSound === 'drone' ? 'active' : ''}" id="btn-amb-choice-drone" style="flex: 1; padding: 8px 4px;">
                <span class="day-chip-name">432Hz Om</span>
                <span class="day-chip-state" style="font-size: 0.74rem;">Sleep Drone</span>
              </button>
              <button class="day-chip ${music.ambientSound === 'rain' ? 'active' : ''}" id="btn-amb-choice-rain" style="flex: 1; padding: 8px 4px;">
                <span class="day-chip-name">Night Rain</span>
                <span class="day-chip-state" style="font-size: 0.74rem;">Rainfall</span>
              </button>
              <button class="day-chip ${music.ambientSound === 'bowls' ? 'active' : ''}" id="btn-amb-choice-bowls" style="flex: 1; padding: 8px 4px;">
                <span class="day-chip-name">Zen Bowls</span>
                <span class="day-chip-state" style="font-size: 0.74rem;">Harmonics</span>
              </button>
            </div>
          </div>
        ` : ''}

        ${isSpotifyEmbed() ? `
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 16px; font-size: 0.75rem; color: #94a3b8; line-height: 1.4;">
            🌐 In-browser mini player. Note: Spotify limits web embeds to 30-second clips unless your browser has cookies on open.spotify.com. For full songs on phone, use <strong>📱 Spotify App</strong> mode!
          </div>
        ` : ''}

        <button id="btn-start-routine" class="btn-primary-start">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          START ${getEnabledDurationMin()}-MIN ROUTINE
        </button>

        <div class="quick-options">
          <label class="quick-toggle-item">
            <input type="checkbox" id="chk-voice" ${settings.voiceEnabled ? 'checked' : ''} />
            <span>Voice Coach</span>
          </label>
          <label class="quick-toggle-item">
            <input type="checkbox" id="chk-beeps" ${settings.soundEffectsEnabled ? 'checked' : ''} />
            <span>Sound Bells</span>
          </label>
        </div>
      </section>
    `;

    document.getElementById('btn-start-routine').addEventListener('click', startRoutine);

    bindAudioSourceTabs();

    // Ambient choices listeners
    ['drone', 'rain', 'bowls'].forEach(soundType => {
      document.getElementById(`btn-amb-choice-${soundType}`)?.addEventListener('click', () => {
        music.setAmbientSound(soundType);
        updateStageUI();
      });
    });

    // Phase toggle handlers
    const handlePhaseToggle = (phaseKey) => {
      const activeCount = Object.values(enabledPhases).filter(Boolean).length;
      if (enabledPhases[phaseKey] && activeCount <= 1) {
        alert('At least one routine block must be active!');
        return;
      }
      enabledPhases[phaseKey] = !enabledPhases[phaseKey];
      rebuildSteps();
      renderApp();
    };

    document.getElementById('chk-phase-strength')?.addEventListener('change', () => handlePhaseToggle('strength'));
    document.getElementById('chk-phase-mobility')?.addEventListener('change', () => handlePhaseToggle('mobility'));
    document.getElementById('chk-phase-winddown')?.addEventListener('change', () => handlePhaseToggle('windDown'));

    document.getElementById('chk-voice').addEventListener('change', (e) => {
      settings.voiceEnabled = e.target.checked;
      audioEngine.voiceEnabled = settings.voiceEnabled;
    });
    document.getElementById('chk-beeps').addEventListener('change', (e) => {
      settings.soundEffectsEnabled = e.target.checked;
      audioEngine.soundEffectsEnabled = settings.soundEffectsEnabled;
      const btn = document.getElementById('btn-audio-toggle');
      if (btn) btn.classList.toggle('active', settings.soundEffectsEnabled);
    });


  } else {
    // Render Active Workout Screen (Compact, Single-Screen Mobile Layout)
    const currentStep = session.steps[session.stepIndex];
    if (!currentStep) return;

    const currentPhase = currentStep.phase;
    const currentEx = currentStep.exercise;
    const nextStep = session.steps[session.stepIndex + 1];
    const upcomingEx = nextStep ? nextStep.exercise : null;
    const isRest = currentStep.isRest;

    // The pose to visually showcase:
    // If resting, show UPCOMING exercise posture so couple gets into position!
    const displayEx = (isRest && upcomingEx) ? upcomingEx : currentEx;
    const displayPoseImg = getPoseImage(displayEx);

    const phaseClass = currentPhase.id; // 'strength', 'mobility', 'windDown'
    const phaseColor = currentPhase.color;
    const hasMorePhases = session.steps.slice(session.stepIndex + 1).some(s => s.phaseIndex !== currentStep.phaseIndex);

    // SVG Circle Calculations for Compact Duo Timer
    const circumference = 2 * Math.PI * TIMER_RADIUS;
    const progressFraction = (currentStep.duration - session.remainingSec) / currentStep.duration;
    const strokeDashoffset = circumference - (progressFraction * circumference);

    stageEl.innerHTML = `
      <section class="compact-active-card">
        <!-- 1. Top Phase & Skip Header -->
        <div class="compact-card-header ${phaseClass}">
          <div class="compact-phase-info">
            <span class="compact-phase-dot" style="background: ${phaseColor};"></span>
            <span class="compact-phase-title">Phase ${currentStep.phaseIndex + 1}: ${currentPhase.title}</span>
          </div>
          <div class="compact-header-actions">
            <span class="compact-time-left" id="timer-total-remaining-display">
              ${formatTime(getRoutineRemainingSec())} left
            </span>
            ${hasMorePhases ? `
              <button id="btn-skip-phase" class="btn-skip-phase-pill" title="Skip remaining exercises in this section and move to next">
                Skip Section ⏭
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 2. Duo Hero: Compact Timer & Pose Image Side-by-Side -->
        <div class="compact-duo-hero">
          <!-- Compact Timer Circle -->
          <div class="compact-timer-box ${isRest ? 'is-rest' : ''}">
            <svg class="compact-timer-svg" viewBox="0 0 140 140">
              <circle class="timer-track" cx="70" cy="70" r="${TIMER_RADIUS}"></circle>
              <circle 
                id="timer-progress-ring"
                class="timer-progress" 
                cx="70" 
                cy="70" 
                r="${TIMER_RADIUS}"
                stroke="${isRest ? '#38bdf8' : phaseColor}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${strokeDashoffset}"
              ></circle>
            </svg>
            <div class="compact-timer-inner">
              <div class="compact-timer-digits" id="timer-display">${session.remainingSec}</div>
              <div class="compact-timer-status" style="color: ${isRest ? '#38bdf8' : phaseColor};">
                ${isRest ? 'BREATHE' : 'HOLD'}
              </div>
              <div class="compact-timer-sub">
                ${isRest ? 'Transition' : `Ex ${currentStep.exerciseIndex + 1}/${currentPhase.exercises.length}`}
              </div>
            </div>
          </div>

          <!-- Compact Pose Visual Preview -->
          <div class="compact-pose-box">
            <img 
              src="${displayPoseImg}" 
              alt="${displayEx.name}" 
              class="compact-pose-img"
            />
          </div>
        </div>

        <!-- 3. Exercise Details & Instructions (Shows upcoming exercise setup during rest!) -->
        <div class="compact-details-box">
          ${isRest ? `
            <!-- REST INTERVAL: Clearly explains upcoming movement to get in position -->
            <div class="compact-rest-panel">
              <div class="compact-title-block">
                <div class="compact-title-meta">
                  <span class="rest-tag-badge">💨 Rest & Breathe</span>
                  ${upcomingEx?.target ? `<span class="compact-target-pill">${upcomingEx.target}</span>` : ''}
                </div>
                <h2 class="compact-ex-name rest-highlight">
                  ${upcomingEx ? `Up Next: ${upcomingEx.name}` : 'Phase Complete'}
                </h2>
              </div>

              <div class="compact-instructions-card rest-card">
                ${upcomingEx ? `
                  <div class="upcoming-setup-lead">
                    <span class="lead-icon">🧘</span>
                    <span class="lead-text"><strong>Get in Position:</strong> ${upcomingEx.instructions}</span>
                  </div>
                  ${upcomingEx.partnerTip ? `
                    <div class="compact-tip-line">
                      <span class="tip-icon">✨</span>
                      <span class="tip-text"><strong>Partner Tip:</strong> ${upcomingEx.partnerTip}</span>
                    </div>
                  ` : ''}
                ` : `
                  <p class="compact-desc-text">Deep belly inhale through nose, relaxing exhale through mouth. Prepare for next phase.</p>
                `}
              </div>
            </div>
          ` : `
            <!-- ACTIVE EXERCISE HOLD -->
            <div class="compact-work-panel">
              <div class="compact-title-block">
                <div class="compact-title-meta">
                  <span class="work-tag-badge">Active Hold</span>
                  <span class="compact-target-pill">${currentEx.target}</span>
                </div>
                <h2 class="compact-ex-name">${currentEx.name}</h2>
              </div>

              <div class="compact-instructions-card">
                <p class="compact-desc-text">${currentEx.instructions}</p>
                ${currentEx.partnerTip ? `
                  <div class="compact-tip-line">
                    <span class="tip-icon">✨</span>
                    <span class="tip-text"><strong>Partner Tip:</strong> ${currentEx.partnerTip}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          `}
        </div>

        <!-- 4. Compact Controls Row -->
        <div class="compact-controls-row">
          <button id="btn-prev-step" class="compact-btn compact-btn-nav" title="Previous Step">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
          </button>

          <button id="btn-play-pause" class="compact-btn compact-btn-main" title="${session.paused ? 'Resume' : 'Pause'}">
            ${session.paused ? `
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            ` : `
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            `}
          </button>

          <button id="btn-next-step" class="compact-btn compact-btn-nav" title="Skip to Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          </button>

          <button id="btn-stop-session" class="compact-btn compact-btn-stop" title="End Routine Early">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg>
            <span>End</span>
          </button>
        </div>

        <!-- 5. Integrated Routine Progress Bar -->
        <div class="compact-timeline-strip">
          <div class="compact-timeline-labels">
            <span>Routine Progress</span>
            <span id="overall-time-counter">${formatTime(getRoutineElapsedSec())} / ${formatTime(getEnabledDurationSec())}</span>
          </div>
          <div class="compact-timeline-bar-bg">
            <div 
              id="overall-timeline-bar" 
              class="compact-timeline-bar-fill" 
              style="width: ${(getRoutineElapsedSec() / Math.max(1, getEnabledDurationSec())) * 100}%;"
            ></div>
          </div>
        </div>
      </section>
    `;

    document.getElementById('btn-play-pause')?.addEventListener('click', togglePause);
    document.getElementById('btn-next-step')?.addEventListener('click', skipToNextStep);
    document.getElementById('btn-prev-step')?.addEventListener('click', goToPreviousStep);
    document.getElementById('btn-skip-phase')?.addEventListener('click', skipCurrentPhase);
    document.getElementById('btn-stop-session')?.addEventListener('click', confirmStopRoutine);
  }
}

// Idle-screen audio source tabs (re-render only the stage, never the whole shell)
function bindAudioSourceTabs() {
  const tabs = {
    'tab-src-spotify-app': SOURCE.APP,
    'tab-src-ambient': SOURCE.AMBIENT,
    'tab-src-spotify-embed': SOURCE.EMBED,
    'tab-src-silent': SOURCE.SILENT
  };
  Object.entries(tabs).forEach(([id, source]) => {
    document.getElementById(id)?.addEventListener('click', async () => {
      await music.setSource(source);
      updateDockState();
      updateStageUI();
    });
  });
}

// Helper to update the phase pills highlight without recreating the DOM
function updatePhasePills() {
  document.querySelectorAll('.phase-pill').forEach((pill, idx) => {
    pill.classList.toggle('current-phase', session.running && session.currentStep?.phaseIndex === idx);
  });
}

function renderWakeBadge() {
  const badge = document.getElementById('wake-lock-badge');
  if (badge) badge.textContent = wakeLockService.isActive ? 'Screen Awake' : '';
}

// Helper to update the persistent dock appearance and controls
function updateDockState() {
  const dock = document.getElementById('spotify-player-dock');
  if (!dock) return;

  const showDock = music.isSpotify;
  dock.classList.toggle('hidden', !showDock);
  dock.style.display = showDock ? 'block' : 'none';

  const embedHost = document.getElementById('spotify-embed-container');
  if (embedHost) embedHost.style.display = isSpotifyEmbed() ? 'block' : 'none';
  syncEmbedMount(embedHost);

  const titleEl = document.getElementById('spotify-dock-title');
  if (titleEl) titleEl.textContent = music.playlist.name;

  const statusEl = document.getElementById('spotify-dock-status');
  if (statusEl) statusEl.textContent = music.statusText(session.running, session.paused);

  const btnPause = document.getElementById('btn-dock-play-pause');
  if (btnPause) {
    btnPause.style.display = (session.running && music.canRemoteControl) ? 'inline-flex' : 'none';
    btnPause.textContent = session.paused ? '▶ Resume' : '⏸ Pause';
  }

  const btnShuffle = document.getElementById('btn-dock-shuffle');
  if (btnShuffle) btnShuffle.style.display = canShuffle() ? 'inline-flex' : 'none';

  const btnOpenApp = document.getElementById('btn-dock-open-app');
  if (btnOpenApp) btnOpenApp.href = music.playlist.uri;
}

// Keep the Spotify iframe in step with the dock: mounted only in embed mode, and
// re-mounted whenever renderApp() replaced the host element.
function syncEmbedMount(host) {
  const wanted = isSpotifyEmbed() && host;
  if (wanted && music.embedHost !== host) {
    music.mountEmbed(host);
  } else if (!wanted && (music.embedHost || music.embed)) {
    music.mountEmbed(null);
  }
}

// ---------------------------------------------------------------------------
// Session callbacks (timer cues, step transitions, completion)
// ---------------------------------------------------------------------------

function handleTick(sec, step) {
  updateTimerDisplay(sec, step);
  updateTimelineProgress();

  if (!step.isRest) {
    if (step.duration > 25 && sec === Math.floor(step.duration / 2)) {
      audioEngine.playHalfwayDing();
    }
    if (sec === 10) {
      const next = session.steps[session.stepIndex + 1];
      if (next) {
        audioEngine.speak(`10 seconds left. Up next: ${next.isRest ? 'Rest' : next.exercise.name}.`);
      }
    }
  }

  if (sec >= 1 && sec <= 3) {
    audioEngine.playCountdownBeep(sec);
  }
}

function handleStepChange(step, prev, reason) {
  const phaseChanged = !prev || prev.phaseIndex !== step.phaseIndex;

  if (reason === 'restart') {
    audioEngine.playChime('start');
  } else if (reason === 'skip-phase') {
    audioEngine.playPhaseGong();
    audioEngine.speak(`Skipping to ${step.phase.title}. First exercise: ${step.exercise.name}.`, true);
  } else if (phaseChanged) {
    audioEngine.playPhaseGong();
    audioEngine.speak(`Phase complete. Welcome to ${step.phase.title}. ${step.phase.description}`, true);
  } else if (step.isRest) {
    const upcoming = session.steps[session.stepIndex + 1];
    audioEngine.playChime('complete');
    audioEngine.speak(`Rest and breathe. Up next: ${upcoming?.exercise?.name || 'the next exercise'}.`, true);
  } else {
    audioEngine.playChime('start');
    audioEngine.speak(`Start: ${step.exercise.name}.`, true);
  }

  if (phaseChanged && reason !== 'restart') {
    music.onPhaseChange(step.phase.id);
  }

  // Update stage/pills/dock WITHOUT re-rendering the app shell, so music is never interrupted
  updateStageUI();
  updatePhasePills();
  updateDockState();
  updateTimelineProgress();
}

function handleComplete() {
  endSession();
  audioEngine.playPhaseGong();

  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#38bdf8']
    });
  } catch (_) {}

  audioEngine.speak(`Congratulations! You completed your ${getEnabledDurationMin()}-minute evening routine together. You are ready for restful sleep. Goodnight.`, true);

  openModal(`
    <div class="completion-content">
      <div class="completion-icon-ring">🌙</div>
      <h2 class="completion-title">Rest Well Tonight!</h2>
      <p class="completion-text">
        You completed your <strong>${getEnabledDurationMin()}-minute evening routine</strong> together. Your bodies and minds are relaxed and ready for deep sleep.
      </p>
      <button id="btn-finish-dialog" class="btn-primary-start" style="font-size: 1.05rem; padding: 14px 20px;">
        Head to Bed ✨
      </button>
    </div>
  `);

  document.getElementById('btn-finish-dialog')?.addEventListener('click', () => {
    closeModal();
    renderApp();
  });
}

// ---------------------------------------------------------------------------
// Live DOM updates
// ---------------------------------------------------------------------------

function updateTimerDisplay(sec, step) {
  const digits = document.getElementById('timer-display');
  if (digits) digits.textContent = sec;

  const ring = document.getElementById('timer-progress-ring');
  if (ring) {
    const circumference = 2 * Math.PI * TIMER_RADIUS;
    const frac = (step.duration - sec) / step.duration;
    ring.style.strokeDashoffset = circumference - (frac * circumference);
  }
}

// Synchronize remaining time, elapsed time, and bottom timeline progress bar
function updateTimelineProgress() {
  const totalSec = Math.max(1, getEnabledDurationSec());
  const elapsedSec = getRoutineElapsedSec();
  const remainingSec = getRoutineRemainingSec();

  document.querySelectorAll('#overall-timeline-bar').forEach(bar => {
    bar.style.width = `${Math.min(100, (elapsedSec / totalSec) * 100)}%`;
  });
  document.querySelectorAll('#overall-time-counter').forEach(el => {
    el.textContent = `${formatTime(elapsedSec)} / ${formatTime(totalSec)}`;
  });
  document.querySelectorAll('#timer-total-remaining-display').forEach(el => {
    el.textContent = `${formatTime(remainingSec)} left`;
  });
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

function startRoutine() {
  if (session.running || isStarting) return;
  isStarting = true;
  try {
    // Audio + speech must be primed synchronously inside the tap (iOS/Safari autoplay rules)
    audioEngine.ensureContext();
    audioEngine.voiceEnabled = settings.voiceEnabled;
    audioEngine.soundEffectsEnabled = settings.soundEffectsEnabled;

    if (!session.start()) return;
    const first = session.currentStep;

    document.body.classList.add('routine-active');
    audioEngine.playChime('start');
    audioEngine.speak(`Welcome to tonight's bedtime routine. Starting with ${first.phase.title}. First exercise: ${first.exercise.name}.`, true);

    updateStageUI();
    updatePhasePills();
    updateDockState();

    wakeLockService.requestLock().then(renderWakeBadge);
    music.start().catch(e => console.warn('Music start error:', e));
  } finally {
    isStarting = false;
  }
}

function togglePause() {
  if (!session.running) return;
  if (session.paused) {
    session.resume();
    music.resume();
  } else {
    session.pause();
    audioEngine.stopSpeech();
    music.pause();
  }
  updateStageUI();
  updateDockState();
}

function skipToNextStep() { session.next(); }
function goToPreviousStep() { session.prev(); }
function skipCurrentPhase() { session.skipPhase(); }

function confirmStopRoutine() {
  openModal(`
    <div style="text-align: center; padding: 18px 10px;">
      <div style="font-size: 2.2rem; margin-bottom: 12px;">🌙</div>
      <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 700; color: #fff; margin-bottom: 8px;">End Routine Early?</h3>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 24px; line-height: 1.45;">
        You've completed ${formatTime(getRoutineElapsedSec())} of your ${getEnabledDurationMin()}-minute evening session. Would you like to resume or wrap up?
      </p>
      <div style="display: flex; gap: 12px;">
        <button id="btn-cancel-stop" class="btn-primary-start" style="flex: 1; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); color: #fff; font-size: 0.95rem; padding: 14px 10px;">
          Resume Routine
        </button>
        <button id="btn-confirm-stop" class="btn-primary-start" style="flex: 1; background: #ef4444; color: #fff; font-size: 0.95rem; padding: 14px 10px;">
          End Session
        </button>
      </div>
    </div>
  `);

  document.getElementById('btn-cancel-stop')?.addEventListener('click', closeModal);
  document.getElementById('btn-confirm-stop')?.addEventListener('click', () => {
    closeModal();
    stopRoutine();
  });
}

// Tear down everything a running session owns (timer, voice, music, screen lock). No DOM.
function endSession() {
  session.stop();
  document.body.classList.remove('routine-active');
  audioEngine.stopSpeech();
  music.stop();
  wakeLockService.releaseLock().then(renderWakeBadge);
}

function stopRoutine() {
  endSession();
  updateStageUI();
  updatePhasePills();
  updateDockState();
}

// Modal System
function openModal(contentHtml, title = '') {
  const container = document.getElementById('modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay open" id="modal-backdrop">
      <div class="modal-sheet">
        <div class="modal-drag-pill"></div>
        ${title ? `
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="icon-btn" id="modal-close-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        ` : ''}
        <div class="modal-body-scroll">
          ${contentHtml}
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
}

function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) container.innerHTML = '';
}

// Bind Global Navigation & Modal Triggers
function bindEvents() {
  // Day Selector
  document.querySelectorAll('.day-chip[data-day]').forEach(chip => {
    chip.addEventListener('click', () => {
      const dayIdx = parseInt(chip.getAttribute('data-day'), 10);
      if (session.running) stopRoutine();
      activeRoutine = getRoutineForDay(dayIdx);
      rebuildSteps();
      renderApp();
    });
  });

  // Sound FX Toggle in header
  document.getElementById('btn-audio-toggle')?.addEventListener('click', () => {
    settings.soundEffectsEnabled = !settings.soundEffectsEnabled;
    audioEngine.soundEffectsEnabled = settings.soundEffectsEnabled;
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) btn.classList.toggle('active', settings.soundEffectsEnabled);
  });

  // Routine Explorer Modal
  document.getElementById('btn-view-routine')?.addEventListener('click', () => {
    const html = activeRoutine.phases.map(phase => `
      <div class="explorer-phase-block">
        <div class="explorer-phase-title" style="color: ${phase.color};">
          <span>${phase.title}</span>
          <span style="font-size: 0.72rem; color: var(--text-dim);">(${Math.round(phase.durationSec / 60)} min)</span>
        </div>
        ${phase.exercises.map(ex => {
          const poseImg = getPoseImage(ex);
          return `
          <div class="exercise-list-item-with-thumb">
            <img src="${poseImg}" alt="${ex.name}" class="exercise-thumb" loading="lazy" />
            <div class="exercise-list-item-body">
              <div class="exercise-list-item-header">
                <span class="exercise-list-item-title">${ex.name}</span>
                <span class="exercise-list-item-duration">${ex.duration}s hold ${ex.rest ? `+ ${ex.rest}s rest` : ''}</span>
              </div>
              <p class="exercise-list-item-desc">${ex.instructions}</p>
              <p class="exercise-list-item-partner"><strong>Partner:</strong> ${ex.partnerTip}</p>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `).join('');

    openModal(html, `${activeRoutine.dayName} Full Routine Overview`);
  });

  // Spotify & Music Hub Modal
  const openMusicHub = () => {
    const isConnected = spotifyService.isConnected();
    const html = `
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Curated Bedtime Playlists</h4>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
          Tap any playlist to select it. For uninterrupted full tracks, tap <strong>Open in App ↗</strong> to play directly in Spotify on your phone!
        </p>

        ${CURATED_PLAYLISTS.map(p => `
          <div class="spotify-playlist-card ${spotifyService.activePlaylistUri === p.uri ? 'selected' : ''}" data-uri="${p.uri}">
            <div style="flex: 1; min-width: 0;">
              <div class="spotify-playlist-name">${p.name}</div>
              <div class="spotify-playlist-desc">${p.description}</div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
              <a href="${p.uri}" target="_blank" rel="noopener noreferrer" class="btn-open-spotify-inline" style="padding: 5px 10px; font-size: 0.72rem;">
                Open App ↗
              </a>
              <span style="font-size: 0.75rem; font-weight: 600; color: var(--spotify-green); border: 1px solid rgba(29, 185, 84, 0.4); padding: 4px 8px; border-radius: 999px;">
                ${p.tag}
              </span>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="background: rgba(29, 185, 84, 0.08); border: 1px solid rgba(29, 185, 84, 0.3); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <h4 style="font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>📱 Mode 1: Spotify App (Recommended for Full Songs)</span>
        </h4>
        <p style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 10px; line-height: 1.45;">
          To listen to full songs without 30-second previews and with automatic mobile system ducking:
        </p>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
          <a href="${music.playlist.uri}" target="_blank" rel="noopener noreferrer" class="btn-primary-start" style="padding: 10px 14px; font-size: 0.82rem; background: var(--spotify-green); color: #000; font-weight: 700; text-decoration: none; justify-content: center;">
            📱 1. Open Active Playlist in Spotify App & Press Play ↗
          </a>
          <button id="btn-select-app-mode" class="btn-primary-start" style="padding: 10px 14px; font-size: 0.8rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); justify-content: center;">
            ✓ 2. Set Spotify App Mode (Background Audio)
          </button>
        </div>
        <p style="font-size: 0.72rem; color: #94a3b8; line-height: 1.35;">
          AndiNú will NOT play any 30s preview iframe over your music. You'll hear your full Spotify songs in the background, and your phone will automatically duck the music during coaching cues!
        </p>
      </div>

      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <h4 style="font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 6px;">🟣 Mode 2: Built-in Ambient Soundscapes (Auto-Ducked)</h4>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px;">
          Free procedural bedtime frequencies generated directly in-app. Volume drops to 15% during voice commands.
        </p>
        <div style="display: flex; gap: 8px;">
          <button class="day-chip ${music.source === 'ambient' && music.ambientSound === 'drone' ? 'active' : ''}" id="btn-ambient-drone" style="flex: 1;">
            <span class="day-chip-name">432Hz Om</span>
            <span class="day-chip-state">Drone</span>
          </button>
          <button class="day-chip ${music.source === 'ambient' && music.ambientSound === 'rain' ? 'active' : ''}" id="btn-ambient-rain" style="flex: 1;">
            <span class="day-chip-name">Night Rain</span>
            <span class="day-chip-state">Rainfall</span>
          </button>
          <button class="day-chip ${music.source === 'ambient' && music.ambientSound === 'bowls' ? 'active' : ''}" id="btn-ambient-bowls" style="flex: 1;">
            <span class="day-chip-name">Zen Bowls</span>
            <span class="day-chip-state">Harmonics</span>
          </button>
        </div>
      </div>

      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <h4 style="font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 6px;">🌐 Mode 3: In-Browser Player & Spotify API</h4>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px;">
          ${isConnected ? '✅ Connected to Spotify Account' : 'Connect via Spotify Web API (Requires Spotify Developer Client ID):'}
        </p>

        <div style="background: #05070d; border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 12px; font-size: 0.75rem; color: #94a3b8; line-height: 1.45;">
          <div style="margin-bottom: 4px;">
            1. Go to: <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: var(--spotify-green); font-weight: 600; text-decoration: underline;">developer.spotify.com/dashboard</a>
          </div>
          <div style="margin-bottom: 4px;">
            2. In <strong>Redirect URIs</strong>, enter your current website URL (e.g. your Vercel URL)
          </div>
          <div>
            3. Paste your <strong>Client ID</strong> below and tap Log in:
          </div>
        </div>
        
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <input 
            type="text" 
            id="input-spotify-client-id" 
            placeholder="Paste Spotify Client ID here" 
            value="${escapeHtml(spotifyService.clientId)}"
            style="flex: 1; background: #070a12; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px 12px; color: #fff; font-size: 0.82rem;"
          />
          <button id="btn-save-client-id" class="icon-btn" style="width: auto; padding: 0 14px; font-size: 0.8rem; font-weight: 600;">Save</button>
        </div>

        <div style="display: flex; gap: 8px;">
          ${isConnected ? `
            <button id="btn-spotify-disconnect" class="btn-primary-start" style="padding: 8px 14px; font-size: 0.82rem; background: #ef4444;">
              Disconnect Spotify
            </button>
          ` : `
            <button id="btn-spotify-login" class="btn-primary-start" style="padding: 10px 16px; font-size: 0.85rem; background: var(--spotify-green); color: #000; font-weight: 700;">
              Log in with Spotify
            </button>
          `}
        </div>
      </div>
    `;

    openModal(html, 'Bedtime Music & Audio Hub');

    // Button to set Spotify App Mode
    document.getElementById('btn-select-app-mode')?.addEventListener('click', async () => {
      await music.setSource(SOURCE.APP, { playNow: isLive() });
      closeModal();
      updateDockState();
      updateStageUI();
    });

    // Playlist Selection (seamless in-app update)
    document.querySelectorAll('.spotify-playlist-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        if (e.target.closest('a')) return; // Allow direct link to open
        await music.selectPlaylist(card.getAttribute('data-uri'), { playNow: isLive() });
        closeModal();
        updateDockState();
        updateStageUI();
      });
    });

    // Save Client ID
    document.getElementById('btn-save-client-id')?.addEventListener('click', () => {
      const val = document.getElementById('input-spotify-client-id')?.value || '';
      spotifyService.setClientId(val);
      alert('Spotify Client ID saved!');
    });

    // Spotify Login with automatic input capture and friendly fallback
    document.getElementById('btn-spotify-login')?.addEventListener('click', async () => {
      const inputEl = document.getElementById('input-spotify-client-id');
      const val = inputEl?.value?.trim();
      if (val) {
        spotifyService.setClientId(val);
      }
      if (!spotifyService.clientId) {
        alert('Please paste your Spotify Client ID in the box above first, or use "Mode 1: Spotify App" to play full songs without developer setup!');
        inputEl?.focus();
        return;
      }
      try {
        await spotifyService.loginWithPKCE();
      } catch (err) {
        alert(err.message || 'Spotify login failed');
      }
    });

    // Spotify Disconnect
    document.getElementById('btn-spotify-disconnect')?.addEventListener('click', () => {
      spotifyService.disconnect();
      closeModal();
      updateDockState();
      updateStageUI();
    });

    // Ambient Buttons
    ['drone', 'rain', 'bowls'].forEach(soundType => {
      document.getElementById(`btn-ambient-${soundType}`)?.addEventListener('click', async () => {
        music.setAmbientSound(soundType);
        await music.setSource(SOURCE.AMBIENT);
        if (isLive()) await music.start();
        closeModal();
        updateDockState();
        updateStageUI();
      });
    });
  };

  document.getElementById('btn-spotify-hub')?.addEventListener('click', openMusicHub);
  document.getElementById('btn-music-selector')?.addEventListener('click', openMusicHub);
  document.getElementById('btn-dock-change-playlist')?.addEventListener('click', openMusicHub);
  document.getElementById('btn-dock-play-pause')?.addEventListener('click', togglePause);
  document.getElementById('btn-dock-shuffle')?.addEventListener('click', async () => {
    const ok = await music.shuffle();
    const statusEl = document.getElementById('spotify-dock-status');
    if (statusEl) {
      statusEl.textContent = ok ? '🔀 Shuffled track' : '⚠️ Could not reach Spotify';
      setTimeout(updateDockState, 1800);
    }
  });

  // Install & Sideload Guide Modal
  document.getElementById('btn-install-guide')?.addEventListener('click', async () => {
    const networkUrl = window.location.origin;
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(networkUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#090d16', light: '#ffffff' }
      });
    } catch (e) {
      console.warn('QR code generation failed:', e);
    }

    const html = `
      <div class="install-step-card" style="text-align: center;">
        <h4 style="justify-content: center; font-size: 1rem;">📲 Open on Your Android Phone</h4>
        <p style="font-size: 0.82rem; margin-top: 4px;">Scan with your phone camera to open AndiNú on your phone:</p>
        
        ${qrDataUrl ? `
          <div class="qr-code-box">
            <img src="${qrDataUrl}" alt="Scan QR Code to open on phone" />
          </div>
        ` : ''}

        <div class="qr-code-url">${networkUrl}</div>
        <p style="font-size: 0.74rem; color: var(--text-dim); margin-top: 6px;">
          (You can also simply type <strong>${networkUrl}</strong> into Chrome on your phone)
        </p>
      </div>

      <div class="install-step-card">
        <h4>🤖 How to Install on Android (PWA)</h4>
        <ol>
          <li>Open <strong>${networkUrl}</strong> in Google Chrome on your Android phone.</li>
          <li>Tap the <strong>Three Dots (⋮)</strong> menu in the upper right.</li>
          <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
          <li>Tap <strong>Install</strong>. Done! AndiNú will now be on your Android home screen, running full-screen without address bars and keeping your screen awake!</li>
        </ol>
      </div>

      <div class="install-step-card">
        <h4>📱 How to Install on iPhone / iPad</h4>
        <ol>
          <li>Open the URL in <strong>Safari</strong> on your iPhone.</li>
          <li>Tap the <strong>Share</strong> button (box with an arrow pointing up at the bottom).</li>
          <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
          <li>Tap <strong>Add</strong> in the top right. AndiNú is installed on your iOS home screen!</li>
        </ol>
      </div>

      <div class="install-step-card">
        <h4>⚡ Capacitor: Build Standalone Native .APK</h4>
        <p>If you prefer a signed standalone Android APK file:</p>
        <div class="code-snippet">
          # 1. Build the production bundle<br/>
          npm run build<br/><br/>
          # 2. Add Android native container<br/>
          npx cap add android<br/><br/>
          # 3. Open in Android Studio to build APK<br/>
          npx cap open android
        </div>
      </div>
    `;

    openModal(html, 'Open & Install on Your Phone');
  });

}

// ---------------------------------------------------------------------------
// Mount / unmount
// ---------------------------------------------------------------------------

export async function mountRoutine(container) {
  routineContainer = container;
  activeRoutine = getRoutineForDay(new Date().getDay());
  rebuildSteps();

  audioEngine.voiceEnabled = settings.voiceEnabled;
  audioEngine.soundEffectsEnabled = settings.soundEffectsEnabled;
  music.onStatusChange = updateDockState;
  wakeLockService.onChange = renderWakeBadge;

  // Let a pending Spotify OAuth redirect finish so the first render shows the right login state
  await spotifyService.ready;
  if (routineContainer !== container) return; // navigated away while waiting

  renderApp(container);
}

export function unmountRoutine() {
  routineContainer = null;
  endSession();
  music.destroyEmbed();
  music.onStatusChange = null;
  wakeLockService.onChange = null;
  audioEngine.stopAmbient();
}
