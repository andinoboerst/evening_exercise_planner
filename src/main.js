import './style.css';
import { WEEKLY_ROUTINES, getRoutineForDay } from './data/routines.js';
import { audioEngine } from './audio/audioEngine.js';
import { spotifyService, CURATED_PLAYLISTS } from './services/spotify.js';
import { wakeLockService } from './services/wakeLock.js';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

// App State
let currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
let activeRoutine = getRoutineForDay(currentDayIndex);

let isRunning = false;
let isPaused = false;
let timerInterval = null;

// Routine Progress Tracking
let currentPhaseIndex = 0;
let currentExerciseIndex = 0;
let isRestInterval = false;
let intervalRemainingSec = 0; // Countdown for active interval (work or rest)
let totalRoutineElapsedSec = 0;

// Enabled Routine Phases (Customizable per session)
let enabledPhases = {
  strength: true,
  mobility: true,
  windDown: true
};

function getEnabledDurationSec() {
  let sec = 0;
  if (enabledPhases.strength) sec += 600; // 10 min
  if (enabledPhases.mobility) sec += 900; // 15 min
  if (enabledPhases.windDown) sec += 300; // 5 min
  return sec;
}

function getEnabledDurationMin() {
  return Math.round(getEnabledDurationSec() / 60);
}

// Audio / Feature Settings
let settings = {
  voiceEnabled: true,
  soundEffectsEnabled: true,
  audioSource: 'spotify', // 'spotify' (default!), 'ambient', 'silent'
  ambientSound: 'drone'   // 'drone', 'rain', 'bowls'
};

let spotifyEmbedController = null;
let pendingSpotifyPlay = false;

// Audio Ducking: automatically lower Spotify background music when voice coach speaks
audioEngine.onDuck = (isDucking) => {
  if (settings.audioSource === 'spotify') {
    spotifyService.duck(isDucking);
  }
};

// Flattened steps calculation for exact timeline
function buildFlattenedSteps(routine) {
  const steps = [];
  routine.phases.forEach((phase, pIdx) => {
    // Skip phase if user disabled it
    if (!enabledPhases[phase.id]) return;

    phase.exercises.forEach((ex, eIdx) => {
      // Work step
      steps.push({
        phaseIndex: pIdx,
        exerciseIndex: eIdx,
        isRest: false,
        duration: ex.duration,
        phase: phase,
        exercise: ex
      });
      // Rest step if any
      if (ex.rest && ex.rest > 0) {
        steps.push({
          phaseIndex: pIdx,
          exerciseIndex: eIdx,
          isRest: true,
          duration: ex.rest,
          phase: phase,
          exercise: ex
        });
      }
    });
  });
  return steps;
}

let flattenedSteps = buildFlattenedSteps(activeRoutine);
let currentStepIndex = 0;

// Format seconds into MM:SS
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Render Main App Shell
function renderApp() {
  const appEl = document.getElementById('app');
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
          <h1 class="brand-title">NOCTURNE</h1>
          <div class="brand-subtitle">
            <span>30m Couples Mat Routine</span>
            <span>•</span>
            <span id="wake-lock-badge" style="color: #38bdf8;">Screen Awake</span>
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
              <span class="day-chip-state">${isToday ? 'Today' : '30m'}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Phase Breakdown Pills -->
    <div class="phase-breakdown-bar">
      <div class="phase-pill strength ${!enabledPhases.strength ? 'disabled' : ''} ${currentPhaseIndex === 0 && isRunning ? 'current-phase' : ''}">
        <span class="phase-pill-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
          Strength
        </span>
        <span class="phase-pill-duration">${enabledPhases.strength ? '10 min' : 'Skipped'}</span>
      </div>
      <div class="phase-pill mobility ${!enabledPhases.mobility ? 'disabled' : ''} ${currentPhaseIndex === 1 && isRunning ? 'current-phase' : ''}">
        <span class="phase-pill-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
          Mobility
        </span>
        <span class="phase-pill-duration">${enabledPhases.mobility ? '15 min' : 'Skipped'}</span>
      </div>
      <div class="phase-pill winddown ${!enabledPhases.windDown ? 'disabled' : ''} ${currentPhaseIndex === 2 && isRunning ? 'current-phase' : ''}">
        <span class="phase-pill-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          Wind Down
        </span>
        <span class="phase-pill-duration">${enabledPhases.windDown ? '5 min' : 'Skipped'}</span>
      </div>
    </div>

    <!-- Main Dynamic Stage -->
    <main class="main-stage" id="main-stage">
      <!-- Injected via updateStageUI() -->
    </main>

    <!-- Persistent Spotify Bedtime Player Dock (Mounted once, never unmounted across routine transitions!) -->
    <div id="spotify-player-dock" class="spotify-player-dock ${settings.audioSource === 'spotify' ? '' : 'hidden'}">
      <div class="spotify-inapp-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="spotify-icon-dot">🎧</span>
          <div>
            <span class="spotify-inapp-title" id="spotify-dock-title">${spotifyService.getActivePlaylist().name}</span>
            <span class="spotify-inapp-sub" id="spotify-dock-status">
              ${isRunning ? '▶ Playing Bedtime Music • Auto-Ducking on voice' : (spotifyService.isConnected() ? 'Spotify Connected • Plays on Start' : 'In-App Player • Plays on Start')}
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button id="btn-dock-play-pause" class="icon-btn" style="width: auto; height: 30px; padding: 0 10px; font-size: 0.72rem; font-weight: 600; display: ${isRunning ? 'inline-flex' : 'none'};">
            ${isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <a id="btn-dock-open-app" href="${spotifyService.getActivePlaylist().uri}" target="_blank" class="icon-btn" style="width: auto; height: 30px; padding: 0 10px; font-size: 0.72rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; color: var(--spotify-green);" title="Play full songs directly in your Spotify app">
            Spotify App ↗
          </a>
          <button id="btn-dock-change-playlist" class="icon-btn" style="width: auto; height: 30px; padding: 0 10px; font-size: 0.72rem; font-weight: 600;">
            Change
          </button>
        </div>
      </div>
      <div id="spotify-embed-container" style="margin-top: 8px;">
        <iframe 
          id="spotify-embed-frame"
          style="border-radius: 12px; border: none;"
          src="https://open.spotify.com/embed/playlist/${spotifyService.getActivePlaylistId()}?utm_source=generator&theme=0" 
          width="100%" 
          height="80" 
          frameBorder="0" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="eager"
        ></iframe>
      </div>
    </div>

    <!-- Overall Session Progress Bar (Bottom) -->
    <div style="margin-top: 14px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-dim); margin-bottom: 4px;">
        <span>Routine Progress</span>
        <span id="overall-time-counter">${formatTime(totalRoutineElapsedSec)} / ${formatTime(getEnabledDurationSec())}</span>
      </div>
      <div class="overall-timeline">
        <div class="overall-timeline-progress" id="overall-timeline-bar" style="width: ${(totalRoutineElapsedSec / Math.max(1, getEnabledDurationSec())) * 100}%;"></div>
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
  initSpotifyEmbedController();
  updateDockState();
}

// Render either the Idle Card or Active Workout Card
function updateStageUI() {
  const stageEl = document.getElementById('main-stage');
  if (!stageEl) return;

  if (!isRunning) {
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
            <button class="audio-tab-btn spotify-tab ${settings.audioSource === 'spotify' ? 'active' : ''}" id="tab-src-spotify">
              <span>🟢 Spotify Music</span>
            </button>
            <button class="audio-tab-btn ${settings.audioSource === 'ambient' ? 'active' : ''}" id="tab-src-ambient">
              <span>🟣 Ambient Sounds</span>
            </button>
            <button class="audio-tab-btn ${settings.audioSource === 'silent' ? 'active' : ''}" id="tab-src-silent">
              <span>⚪ Timer Only</span>
            </button>
          </div>
        </div>

        ${settings.audioSource === 'ambient' ? `
          <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 18px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #c4b5fd; margin-bottom: 8px;">Select Ambient Soundscape:</div>
            <div style="display: flex; gap: 6px;">
              <button class="day-chip ${settings.ambientSound === 'drone' ? 'active' : ''}" id="btn-amb-choice-drone" style="flex: 1; padding: 8px 4px;">
                <span class="day-chip-name">432Hz Om</span>
                <span class="day-chip-state" style="font-size: 0.74rem;">Sleep Drone</span>
              </button>
              <button class="day-chip ${settings.ambientSound === 'rain' ? 'active' : ''}" id="btn-amb-choice-rain" style="flex: 1; padding: 8px 4px;">
                <span class="day-chip-name">Night Rain</span>
                <span class="day-chip-state" style="font-size: 0.74rem;">Rainfall</span>
              </button>
              <button class="day-chip ${settings.ambientSound === 'bowls' ? 'active' : ''}" id="btn-amb-choice-bowls" style="flex: 1; padding: 8px 4px;">
                <span class="day-chip-name">Zen Bowls</span>
                <span class="day-chip-state" style="font-size: 0.74rem;">Harmonics</span>
              </button>
            </div>
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

    // Audio source tab listeners (seamless, without wiping the page)
    document.getElementById('tab-src-spotify')?.addEventListener('click', () => {
      settings.audioSource = 'spotify';
      audioEngine.stopAmbient();
      updateDockState();
      updateStageUI();
    });
    document.getElementById('tab-src-ambient')?.addEventListener('click', () => {
      settings.audioSource = 'ambient';
      if (spotifyEmbedController) {
        try { spotifyEmbedController.pause(); } catch (_) {}
      }
      spotifyService.pause();
      updateDockState();
      updateStageUI();
    });
    document.getElementById('tab-src-silent')?.addEventListener('click', () => {
      settings.audioSource = 'silent';
      audioEngine.stopAmbient();
      if (spotifyEmbedController) {
        try { spotifyEmbedController.pause(); } catch (_) {}
      }
      spotifyService.pause();
      updateDockState();
      updateStageUI();
    });

    // Ambient choices listeners
    ['drone', 'rain', 'bowls'].forEach(soundType => {
      document.getElementById(`btn-amb-choice-${soundType}`)?.addEventListener('click', () => {
        settings.ambientSound = soundType;
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
      flattenedSteps = buildFlattenedSteps(activeRoutine);
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
    // Render Active Workout Screen
    const currentStep = flattenedSteps[currentStepIndex];
    if (!currentStep) return;

    const currentPhase = currentStep.phase;
    const currentEx = currentStep.exercise;
    const nextStep = flattenedSteps[currentStepIndex + 1];

    const phaseClass = currentPhase.id; // 'strength', 'mobility', 'windDown'
    const phaseColor = currentPhase.color;

    // SVG Circle Calculations
    const radius = 105;
    const circumference = 2 * Math.PI * radius;
    const progressFraction = (currentStep.duration - intervalRemainingSec) / currentStep.duration;
    const strokeDashoffset = circumference - (progressFraction * circumference);

    stageEl.innerHTML = `
      <section class="active-session-card">
        <!-- Phase Badge -->
        <div class="active-phase-badge ${phaseClass}">
          <span>Phase ${currentStep.phaseIndex + 1} of 3:</span>
          <span>${currentPhase.title}</span>
        </div>

        <!-- Timer Circle -->
        <div class="timer-container">
          <svg class="timer-svg" viewBox="0 0 240 240">
            <circle class="timer-track" cx="120" cy="120" r="${radius}"></circle>
            <circle 
              id="timer-progress-ring"
              class="timer-progress" 
              cx="120" 
              cy="120" 
              r="${radius}"
              stroke="${currentStep.isRest ? '#38bdf8' : phaseColor}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${strokeDashoffset}"
            ></circle>
          </svg>
          <div class="timer-inner-content">
            <div class="timer-digits" id="timer-display">${intervalRemainingSec}</div>
            <div class="timer-status-label" style="color: ${currentStep.isRest ? '#38bdf8' : phaseColor};">
              ${currentStep.isRest ? 'REST / BREATHE' : 'EXERCISE HOLD'}
            </div>
            <div class="timer-total-remaining">
              Total left: ${formatTime(Math.max(0, getEnabledDurationSec() - totalRoutineElapsedSec))}
            </div>
          </div>
        </div>

        <!-- Exercise Details -->
        <div class="current-exercise-details">
          <h2 class="exercise-name">${currentStep.isRest ? `Rest (Next: ${nextStep?.exercise?.name || 'Done'})` : currentEx.name}</h2>
          ${!currentStep.isRest ? `<span class="exercise-target-badge">${currentEx.target}</span>` : ''}
          <p class="exercise-instructions">
            ${currentStep.isRest 
              ? 'Deep belly inhale through nose, relaxing exhale through mouth. Prepare mat posture.' 
              : currentEx.instructions}
          </p>
        </div>

        <!-- Partner Coaching Callout -->
        <div class="partner-callout">
          <span class="partner-callout-icon">✨</span>
          <div class="partner-callout-text">
            <strong>Partner Tip:</strong> ${currentEx.partnerTip}
          </div>
        </div>

        <!-- Up Next Preview -->
        ${nextStep ? `
          <div class="up-next-strip">
            <span class="up-next-label">Up Next:</span>
            <span class="up-next-name">${nextStep.isRest ? 'Rest Interval' : nextStep.exercise.name}</span>
          </div>
        ` : ''}

        <!-- Interactive Session Controls -->
        <div class="session-controls">
          <button id="btn-prev-step" class="control-btn control-btn-secondary" title="Previous Step">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
          </button>

          <button id="btn-play-pause" class="control-btn control-btn-primary" title="${isPaused ? 'Resume' : 'Pause'}">
            ${isPaused ? `
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            ` : `
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            `}
          </button>

          <button id="btn-next-step" class="control-btn control-btn-secondary" title="Skip to Next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          </button>
        </div>

        <!-- Dedicated Stop Bar with generous touch target -->
        <div class="btn-stop-bar">
          <button id="btn-stop-session" class="btn-stop-outline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            <span>End Routine Early</span>
          </button>
        </div>
      </section>
    `;

    document.getElementById('btn-play-pause').addEventListener('click', togglePause);
    document.getElementById('btn-next-step').addEventListener('click', skipToNextStep);
    document.getElementById('btn-prev-step').addEventListener('click', goToPreviousStep);
    document.getElementById('btn-stop-session').addEventListener('click', confirmStopRoutine);
  }
}

// Helper to update the phase pills highlight without recreating the DOM
function updatePhasePills() {
  const pills = document.querySelectorAll('.phase-pill');
  pills.forEach((pill, idx) => {
    pill.classList.toggle('current-phase', isRunning && currentPhaseIndex === idx);
  });
}

// Helper to update persistent dock appearance and controls
function updateDockState() {
  const dock = document.getElementById('spotify-player-dock');
  if (!dock) return;

  if (settings.audioSource === 'spotify') {
    dock.classList.remove('hidden');
    dock.style.display = 'block';
  } else {
    dock.classList.add('hidden');
    dock.style.display = 'none';
  }

  const statusEl = document.getElementById('spotify-dock-status');
  if (statusEl) {
    if (isRunning) {
      statusEl.textContent = isPaused ? '⏸ Paused' : '▶ Playing Bedtime Music • Auto-Ducking on voice';
    } else {
      statusEl.textContent = spotifyService.isConnected() 
        ? 'Spotify Connected • Auto-Plays on Start' 
        : 'In-App Player • Auto-Plays on Start';
    }
  }

  const btnPause = document.getElementById('btn-dock-play-pause');
  if (btnPause) {
    btnPause.style.display = isRunning ? 'inline-flex' : 'none';
    btnPause.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
  }

  const btnOpenApp = document.getElementById('btn-dock-open-app');
  if (btnOpenApp) {
    btnOpenApp.href = spotifyService.getActivePlaylist().uri;
  }
}

// Initialize Spotify Iframe API Controller once
function initSpotifyEmbedController() {
  const container = document.getElementById('spotify-embed-container');
  if (!container) return;

  const mount = (IFrameAPI) => {
    if (spotifyEmbedController) return;

    const options = {
      uri: spotifyService.getActivePlaylist().uri,
      width: '100%',
      height: '80',
      theme: '0'
    };

    IFrameAPI.createController(container, options, (EmbedController) => {
      spotifyEmbedController = EmbedController;
      console.log('[Nocturne] Spotify EmbedController connected!');

      EmbedController.addListener('ready', () => {
        console.log('[Nocturne] Spotify Embed ready for playback');
        if (pendingSpotifyPlay && isRunning) {
          EmbedController.play();
          pendingSpotifyPlay = false;
        }
      });

      EmbedController.addListener('playback_update', e => {
        if (e && e.data) {
          const isPlaying = !e.data.isPaused;
          const statusEl = document.getElementById('spotify-dock-status');
          if (statusEl && isRunning) {
            statusEl.textContent = isPlaying ? '▶ Playing Bedtime Music' : (isPaused ? '⏸ Paused' : 'Ready');
          }
        }
      });

      if (pendingSpotifyPlay && isRunning) {
        EmbedController.play();
        pendingSpotifyPlay = false;
      }
    });
  };

  if (window.SpotifyIframeApi) {
    mount(window.SpotifyIframeApi);
  } else {
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      window.SpotifyIframeApi = IFrameAPI;
      mount(IFrameAPI);
    };
  }
}

// Start the 30-Minute Routine
async function startRoutine() {
  audioEngine.ensureContext();
  await wakeLockService.requestLock();

  // Reset indices
  currentStepIndex = 0;
  totalRoutineElapsedSec = 0;
  const initialStep = flattenedSteps[0];
  intervalRemainingSec = initialStep.duration;
  currentPhaseIndex = initialStep.phaseIndex;

  isRunning = true;
  isPaused = false;

  // Sound & Speech Cues
  audioEngine.playChime('start');
  audioEngine.speak(`Welcome to tonight's bedtime routine. Starting with ${initialStep.phase.title}. First exercise: ${initialStep.exercise.name}.`, true);

  // Background Audio / Spotify
  if (settings.audioSource === 'spotify') {
    // 1. Ensure preinstalled ambient sounds NEVER play over Spotify!
    audioEngine.stopAmbient();

    // 2. Trigger in-app Spotify Iframe Controller
    if (spotifyEmbedController) {
      try { 
        spotifyEmbedController.play(); 
      } catch (e) {
        console.warn('Embed play error:', e);
      }
    } else {
      pendingSpotifyPlay = true;
      const frame = document.querySelector('#spotify-embed-container iframe') || document.getElementById('spotify-embed-frame');
      if (frame && frame.src && !frame.src.includes('autoplay=1')) {
        frame.src = `${frame.src}${frame.src.includes('?') ? '&' : '?'}autoplay=1`;
      }
    }

    // 3. Trigger Spotify Web API on connected phone / desktop / web player
    if (spotifyService.isConnected()) {
      spotifyService.play();
    }
  } else if (settings.audioSource === 'ambient') {
    audioEngine.startAmbient(settings.ambientSound);
  } else {
    audioEngine.stopAmbient();
  }

  // Update UI into active state WITHOUT tearing down the Spotify dock!
  updateStageUI();
  updatePhasePills();
  updateDockState();
  runTimerLoop();
}

// Primary Timer Loop (1-second tick)
function runTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (isPaused) return;

    intervalRemainingSec--;
    totalRoutineElapsedSec++;

    // Update bottom overall bar
    const totalSec = Math.max(1, getEnabledDurationSec());
    const bar = document.getElementById('overall-timeline-bar');
    const timeCount = document.getElementById('overall-time-counter');
    if (bar) bar.style.width = `${Math.min(100, (totalRoutineElapsedSec / totalSec) * 100)}%`;
    if (timeCount) timeCount.textContent = `${formatTime(totalRoutineElapsedSec)} / ${formatTime(totalSec)}`;

    const currentStep = flattenedSteps[currentStepIndex];
    if (!currentStep) return;

    // Update digits & circle progress
    const digits = document.getElementById('timer-display');
    if (digits) digits.textContent = intervalRemainingSec;

    const ring = document.getElementById('timer-progress-ring');
    if (ring) {
      const radius = 105;
      const circumference = 2 * Math.PI * radius;
      const frac = (currentStep.duration - intervalRemainingSec) / currentStep.duration;
      ring.style.strokeDashoffset = circumference - (frac * circumference);
    }

    // Audio Cues during interval
    // Halfway mark
    if (!currentStep.isRest && intervalRemainingSec === Math.floor(currentStep.duration / 2) && currentStep.duration > 25) {
      audioEngine.playHalfwayDing();
    }

    // 10-second transition preview
    if (!currentStep.isRest && intervalRemainingSec === 10) {
      const nextStep = flattenedSteps[currentStepIndex + 1];
      if (nextStep) {
        const nextName = nextStep.isRest ? 'Rest' : nextStep.exercise.name;
        audioEngine.speak(`10 seconds left. Up next: ${nextName}.`);
      }
    }

    // 3-2-1 Countdown Beeps
    if (intervalRemainingSec <= 3 && intervalRemainingSec >= 1) {
      audioEngine.playCountdownBeep(intervalRemainingSec);
    }

    // Step Complete!
    if (intervalRemainingSec <= 0) {
      advanceStep();
    }
  }, 1000);
}

// Move to next exercise or rest step (preserves continuous Spotify audio stream)
function advanceStep() {
  currentStepIndex++;

  if (currentStepIndex >= flattenedSteps.length || totalRoutineElapsedSec >= getEnabledDurationSec()) {
    completeRoutine();
    return;
  }

  const newStep = flattenedSteps[currentStepIndex];
  intervalRemainingSec = newStep.duration;

  // Check if phase changed (Strength -> Mobility -> WindDown)
  const prevStep = flattenedSteps[currentStepIndex - 1];
  const phaseChanged = prevStep && prevStep.phaseIndex !== newStep.phaseIndex;
  currentPhaseIndex = newStep.phaseIndex;

  if (phaseChanged) {
    audioEngine.playPhaseGong();
    audioEngine.speak(`Phase complete. Welcome to ${newStep.phase.title}. ${newStep.phase.description}`, true);

    // If mobility or wind-down started, smoothly adapt Spotify playlist to matching bedtime vibe
    if (settings.audioSource === 'spotify') {
      const nextPlaylist = newStep.phase.id === 'windDown' ? CURATED_PLAYLISTS[2] : (newStep.phase.id === 'mobility' ? CURATED_PLAYLISTS[1] : null);
      if (nextPlaylist) {
        if (spotifyEmbedController) {
          try {
            spotifyEmbedController.loadUri(nextPlaylist.uri);
            spotifyEmbedController.play();
          } catch (_) {}
        }
        if (spotifyService.isConnected()) {
          spotifyService.play(nextPlaylist.uri);
        }
        const titleEl = document.getElementById('spotify-dock-title');
        if (titleEl) titleEl.textContent = nextPlaylist.name;
      }
    }
  } else {
    if (newStep.isRest) {
      audioEngine.playChime('complete');
      audioEngine.speak(`Rest and breathe for ${newStep.duration} seconds.`, false);
    } else {
      audioEngine.playChime('start');
      audioEngine.speak(`Start: ${newStep.exercise.name}.`, true);
    }
  }

  // Update stage and phase badges WITHOUT re-rendering app shell (Spotify keeps playing!)
  updateStageUI();
  updatePhasePills();
}

function skipToNextStep() {
  advanceStep();
}

function goToPreviousStep() {
  if (currentStepIndex > 0) {
    currentStepIndex = Math.max(0, currentStepIndex - 1);
    const newStep = flattenedSteps[currentStepIndex];
    intervalRemainingSec = newStep.duration;
    currentPhaseIndex = newStep.phaseIndex;
    updateStageUI();
    updatePhasePills();
  }
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    audioEngine.stopSpeech();
    if (settings.audioSource === 'spotify') {
      if (spotifyEmbedController) {
        try { spotifyEmbedController.pause(); } catch (_) {}
      }
      spotifyService.pause();
    } else if (settings.audioSource === 'ambient') {
      audioEngine.stopAmbient();
    }
  } else {
    if (settings.audioSource === 'spotify') {
      if (spotifyEmbedController) {
        try { spotifyEmbedController.play(); } catch (_) {}
      }
      spotifyService.play();
    } else if (settings.audioSource === 'ambient') {
      audioEngine.startAmbient(settings.ambientSound);
    }
  }
  updateStageUI();
  updateDockState();
}

function confirmStopRoutine() {
  openModal(`
    <div style="text-align: center; padding: 18px 10px;">
      <div style="font-size: 2.2rem; margin-bottom: 12px;">🌙</div>
      <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 700; color: #fff; margin-bottom: 8px;">End Routine Early?</h3>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 24px; line-height: 1.45;">
        You've completed ${formatTime(totalRoutineElapsedSec)} of your 30-minute evening session. Would you like to resume or wrap up?
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

function stopRoutine() {
  if (timerInterval) clearInterval(timerInterval);
  isRunning = false;
  isPaused = false;
  audioEngine.stopAmbient();
  audioEngine.stopSpeech();
  if (spotifyEmbedController) {
    try { spotifyEmbedController.pause(); } catch (_) {}
  }
  spotifyService.pause();
  wakeLockService.releaseLock();
  updateStageUI();
  updatePhasePills();
  updateDockState();
}

// Routine Completed Celebration!
function completeRoutine() {
  if (timerInterval) clearInterval(timerInterval);
  isRunning = false;
  isPaused = false;
  audioEngine.playPhaseGong();
  audioEngine.stopAmbient();
  wakeLockService.releaseLock();

  // Blast celebratory bedtime confetti
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#38bdf8']
    });
  } catch (_) {}

  audioEngine.speak("Congratulations! You completed your 30-minute evening routine together. You are ready for restful sleep. Goodnight.", true);

  openModal(`
    <div class="completion-content">
      <div class="completion-icon-ring">🌙</div>
      <h2 class="completion-title">Rest Well Tonight!</h2>
      <p class="completion-text">
        You spent <strong>10 minutes on strength</strong>, <strong>15 minutes on mobility</strong>, and <strong>5 minutes winding down</strong> together. Your bodies and minds are relaxed and ready for deep sleep.
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
  document.querySelectorAll('.day-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const dayIdx = parseInt(chip.getAttribute('data-day'), 10);
      currentDayIndex = dayIdx;
      activeRoutine = getRoutineForDay(dayIdx);
      flattenedSteps = buildFlattenedSteps(activeRoutine);
      if (isRunning) {
        stopRoutine();
      }
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
        ${phase.exercises.map(ex => `
          <div class="exercise-list-item">
            <div class="exercise-list-item-header">
              <span class="exercise-list-item-title">${ex.name}</span>
              <span class="exercise-list-item-duration">${ex.duration}s hold ${ex.rest ? `+ ${ex.rest}s rest` : ''}</span>
            </div>
            <p class="exercise-list-item-desc">${ex.instructions}</p>
            <p class="exercise-list-item-partner"><strong>Partner:</strong> ${ex.partnerTip}</p>
          </div>
        `).join('')}
      </div>
    `).join('');

    openModal(html, `${activeRoutine.dayName} Full Routine Overview`);
  });

  // Spotify & Music Hub Modal
  const openMusicHub = () => {
    const isConnected = spotifyService.isConnected();
    const html = `
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Curated Playlists</h4>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
          Tap any playlist to open directly in Spotify or use with the auto-player.
        </p>

        ${CURATED_PLAYLISTS.map(p => `
          <div class="spotify-playlist-card ${spotifyService.activePlaylistUri === p.uri ? 'selected' : ''}" data-uri="${p.uri}">
            <div>
              <div class="spotify-playlist-name">${p.name}</div>
              <div class="spotify-playlist-desc">${p.description}</div>
            </div>
            <span style="font-size: 0.75rem; font-weight: 600; color: var(--spotify-green); border: 1px solid rgba(29, 185, 84, 0.4); padding: 4px 8px; border-radius: 999px;">
              ${p.tag}
            </span>
          </div>
        `).join('')}
      </div>

      <div style="background: rgba(29, 185, 84, 0.08); border: 1px solid rgba(29, 185, 84, 0.3); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <h4 style="font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>💡 Full Song Playback vs 30s Previews</span>
        </h4>
        <p style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 10px; line-height: 1.45;">
          Spotify's web embed player requires your browser to be logged into <strong>open.spotify.com</strong>. Without a browser cookie, Spotify limits embeds to 30-second previews.
        </p>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
          <a href="https://open.spotify.com" target="_blank" class="btn-primary-start" style="padding: 10px 14px; font-size: 0.8rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); text-decoration: none; justify-content: center;">
            🌐 1. Log In at open.spotify.com (Unlocks Full Web Songs) ↗
          </a>
          <a href="${spotifyService.getActivePlaylist().uri}" target="_blank" class="btn-primary-start" style="padding: 10px 14px; font-size: 0.8rem; background: var(--spotify-green); color: #000; font-weight: 700; text-decoration: none; justify-content: center;">
            📱 2. Play Directly in Spotify App (Full Songs & Background) ↗
          </a>
        </div>
        <p style="font-size: 0.72rem; color: #94a3b8; line-height: 1.35;">
          Once logged in at open.spotify.com or playing via the Spotify app, you'll hear uninterrupted full music throughout your workout!
        </p>
      </div>

      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <h4 style="font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 6px;">Spotify Connect & Developer API</h4>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px;">
          ${isConnected ? '✅ Connected to Spotify Developer Account' : 'Connect your Spotify account to enable remote control & automatic audio ducking:'}
        </p>

        <div style="background: #05070d; border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 12px; font-size: 0.75rem; color: #94a3b8; line-height: 1.45;">
          <div style="margin-bottom: 4px;">
            1. Go to: <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: var(--spotify-green); font-weight: 600; text-decoration: underline;">developer.spotify.com/dashboard</a>
          </div>
          <div style="margin-bottom: 4px;">
            2. In <strong>Redirect URIs</strong>, enter your app URL (e.g. your Vercel URL or http://localhost:5173/)
          </div>
          <div>
            3. Copy the <strong>Client ID</strong> and paste below:
          </div>
        </div>
        
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <input 
            type="text" 
            id="input-spotify-client-id" 
            placeholder="Paste Spotify Client ID here" 
            value="${spotifyService.clientId}"
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

      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
        <h4 style="font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 6px;">Built-in Ambient Soundscape</h4>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px;">
          Relaxing background sound generator if you prefer pure soothing bedtime frequencies over Spotify.
        </p>
        <div style="display: flex; gap: 8px;">
          <button class="day-chip ${settings.audioSource === 'ambient' && settings.ambientSound === 'drone' ? 'active' : ''}" id="btn-ambient-drone" style="flex: 1;">
            <span class="day-chip-name">432Hz Om</span>
            <span class="day-chip-state">Drone</span>
          </button>
          <button class="day-chip ${settings.audioSource === 'ambient' && settings.ambientSound === 'rain' ? 'active' : ''}" id="btn-ambient-rain" style="flex: 1;">
            <span class="day-chip-name">Night Rain</span>
            <span class="day-chip-state">Rainfall</span>
          </button>
          <button class="day-chip ${settings.audioSource === 'ambient' && settings.ambientSound === 'bowls' ? 'active' : ''}" id="btn-ambient-bowls" style="flex: 1;">
            <span class="day-chip-name">Zen Bowls</span>
            <span class="day-chip-state">Harmonics</span>
          </button>
        </div>
      </div>
    `;

    openModal(html, 'Bedtime Music & Audio Hub');

    // Playlist Selection (seamless in-app update)
    document.querySelectorAll('.spotify-playlist-card').forEach(card => {
      card.addEventListener('click', async () => {
        const uri = card.getAttribute('data-uri');
        spotifyService.setPlaylistUri(uri);
        const p = spotifyService.getActivePlaylist();

        settings.audioSource = 'spotify';
        audioEngine.stopAmbient();

        const titleEl = document.getElementById('spotify-dock-title');
        if (titleEl) titleEl.textContent = p.name;

        if (spotifyEmbedController) {
          try {
            spotifyEmbedController.loadUri(uri);
            if (isRunning && !isPaused) {
              spotifyEmbedController.play();
            }
          } catch (_) {}
        } else {
          const frame = document.querySelector('#spotify-embed-container iframe') || document.getElementById('spotify-embed-frame');
          if (frame) {
            frame.src = `https://open.spotify.com/embed/playlist/${p.spotifyId}?utm_source=generator&theme=0${isRunning && !isPaused ? '&autoplay=1' : ''}`;
          }
        }

        if (spotifyService.isConnected() && isRunning && !isPaused) {
          await spotifyService.play(uri);
        }

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

    // Spotify Login
    document.getElementById('btn-spotify-login')?.addEventListener('click', async () => {
      try {
        await spotifyService.loginWithPKCE();
      } catch (err) {
        alert(err.message);
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
      document.getElementById(`btn-ambient-${soundType}`)?.addEventListener('click', () => {
        settings.audioSource = 'ambient';
        settings.ambientSound = soundType;
        if (spotifyEmbedController) {
          try { spotifyEmbedController.pause(); } catch (_) {}
        }
        spotifyService.pause();
        if (isRunning && !isPaused) {
          audioEngine.startAmbient(soundType);
        }
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

  // Install & Sideload Guide Modal
  document.getElementById('btn-install-guide')?.addEventListener('click', async () => {
    const networkUrl = 'http://147.83.70.119:5173';
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
        <p style="font-size: 0.82rem; margin-top: 4px;">Make sure your phone is connected to the same Wi-Fi network, then scan with your phone camera:</p>
        
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
          <li>Tap <strong>Install</strong>. Done! Nocturne will now be on your Android home screen, running full-screen without address bars and keeping your screen awake!</li>
        </ol>
      </div>

      <div class="install-step-card">
        <h4>📱 How to Install on iPhone / iPad</h4>
        <ol>
          <li>Open the URL in <strong>Safari</strong> on your iPhone.</li>
          <li>Tap the <strong>Share</strong> button (box with an arrow pointing up at the bottom).</li>
          <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
          <li>Tap <strong>Add</strong> in the top right. Nocturne is installed on your iOS home screen!</li>
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

// Initial Launch
renderApp();
