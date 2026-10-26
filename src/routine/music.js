// Background music for the routine, hands-free: it starts with the session, dips while the coach
// speaks, softens as the session winds down, and fades out at the end.
//
// Tracks are hour-long CC0 ambient mixes ("Calm Pills" by Alaeddin Hallak / Uplifting Pills)
// streamed from the Internet Archive. If a stream can't load, a generated soundscape takes over so
// the routine is never silent by accident. The generated soundscapes live in audioEngine.
import { audioEngine } from '../audio/audioEngine.js';

const ARCHIVE = 'https://archive.org/download/CalmPills/';

export const TRACKS = [
  { id: 'still-habitat', label: 'Still Habitat', file: 'Uplifting_Pills_-_Calm_Pill_1_-_Still_Habitat.mp3' },
  { id: 'peaceful-moments', label: 'Peaceful Moments', file: 'Uplifting_Pills_-_Calm_Pill_8_-_Peaceful_Moments_471CF124-5255-4D81-9243-5D7DE89702AD.mp3' },
  { id: 'safest-place', label: 'The Safest Place', file: 'Uplifting_Pills_-_Calm_Pill_4_-_The_Safest_Place_E7398A89-465A-46D4-AC1F-4D9A2015DEE1.mp3' },
  { id: 'quiet-peace', label: 'Quiet Peace', file: 'Uplifting_Pills_-_Calm_Pill_56_-_Quiet_Peace.mp3' },
  { id: 'lullaby', label: 'Lullaby for Grownups', file: 'Uplifting_Pills_-_Calm_Pill_3_-_Lullaby_for_Grownups_462868CD-0AE8-469D-B460-63696B597AF7.mp3' },
  { id: 'place-to-rest', label: 'Place to Rest My Head', file: 'Uplifting_Pills_-_Calm_Pill_43_-_Place_to_Rest_My_Head.mp3' }
];

// Generated fallbacks and alternatives (no network needed)
export const SOUNDSCAPES = [
  { id: 'rain', label: 'Rain' },
  { id: 'bowls', label: 'Singing bowls' },
  { id: 'drone', label: 'Soft drone' },
  { id: 'silence', label: 'Off' }
];

export const DEFAULT_MUSIC = TRACKS[0].id;
export const isValidMusic = (id) => TRACKS.some(t => t.id === id) || SOUNDSCAPES.some(s => s.id === id);

// Track level per phase: a little more present while moving, quietest at the end
const PHASE_LEVEL = { strength: 0.5, stretch: 0.4, wind: 0.3 };
const DUCKED_FACTOR = 0.25;

class MusicController {
  constructor() {
    this.audio = null;
    this.gain = null;
    this.source = null;
    this.level = PHASE_LEVEL.strength;
    this.ducked = false;
    this.mode = 'silence';
    this.usingGenerated = false;

    audioEngine.onDuck = (isDucking) => this.duck(isDucking);
  }

  get isTrack() {
    return Boolean(this.audio);
  }

  /** Must be called from a user gesture (the Start press) so playback is allowed */
  start(mode) {
    this.stop(0);
    this.mode = mode;
    if (mode === 'silence') return;

    const track = TRACKS.find(t => t.id === mode);
    if (!track) return this._startGenerated(mode);

    try {
      const ctx = audioEngine.ensureContext();
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.loop = true;
      audio.preload = 'auto';
      audio.src = ARCHIVE + encodeURIComponent(track.file);

      // Routing through Web Audio gives volume control on every device (iOS ignores audio.volume)
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      source.connect(gain);
      gain.connect(audioEngine.masterGain);

      audio.addEventListener('error', () => this._fallBack(audio));
      this.audio = audio;
      this.source = source;
      this.gain = gain;
      this.usingGenerated = false;

      audio.play().then(() => this._ramp(this._target(), 3)).catch(() => this._fallBack(audio));
    } catch (e) {
      console.warn('Music start error:', e);
      this._startGenerated('drone');
    }
  }

  _startGenerated(mode) {
    this.usingGenerated = true;
    audioEngine.startAmbient(mode);
  }

  /** The stream failed: keep the routine from going silent */
  _fallBack(audio) {
    if (audio !== this.audio) return;
    this._teardownTrack();
    this._startGenerated('drone');
  }

  _target() {
    return this.level * (this.ducked ? DUCKED_FACTOR : 1);
  }

  _ramp(value, seconds) {
    if (!this.gain) return;
    const now = audioEngine.ctx.currentTime;
    const g = this.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.exponentialRampToValueAtTime(Math.max(0.0001, value), now + seconds);
  }

  setPhase(phaseId) {
    this.level = PHASE_LEVEL[phaseId] ?? this.level;
    if (this.isTrack && !this.audio.paused) this._ramp(this._target(), 4);
  }

  duck(isDucking) {
    this.ducked = isDucking;
    if (this.isTrack && !this.audio.paused) this._ramp(this._target(), isDucking ? 0.25 : 0.8);
  }

  pause() {
    if (this.isTrack) this.audio.pause();
    else if (this.usingGenerated) audioEngine.ctx?.suspend();
  }

  resume() {
    if (this.isTrack) {
      audioEngine.ensureContext();
      this.audio.play().catch(() => {});
    } else if (this.usingGenerated) {
      audioEngine.ensureContext();
    }
  }

  stop(fadeSec = 1.5) {
    if (this.isTrack && fadeSec > 0) {
      this._ramp(0.0001, fadeSec);
      const audio = this.audio;
      setTimeout(() => { if (audio === this.audio) this._teardownTrack(); }, fadeSec * 1000 + 100);
    } else {
      this._teardownTrack();
    }
    audioEngine.stopAmbient();
    this.usingGenerated = false;
  }

  _teardownTrack() {
    if (!this.audio) return;
    try {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.source?.disconnect();
      this.gain?.disconnect();
    } catch (_) { /* already gone */ }
    this.audio = this.source = this.gain = null;
  }
}

export const music = new MusicController();
