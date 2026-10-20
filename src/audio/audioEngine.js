// Web Audio API & Speech Synthesis Engine for Nocturne
const AMBIENT_LEVEL = 0.12;

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.voiceEnabled = true;
    this.soundEffectsEnabled = true;
    this.ambientMode = 'drone'; // 'drone', 'rain', 'silence'
    this.ambientPlaying = false;
    this.masterGain = null;
    this.selectedVoice = null;
    this.activeSpeech = 0;     // utterances currently queued/speaking (ducking is refcounted)
    this.onDuck = null;        // (isDucking) => void, lets other players duck with the coach
    this.ambientSession = null; // { gain, nodes } for the soundscape currently audible

    this.initVoices();
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  initVoices() {
    if ('speechSynthesis' in window) {
      const load = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer natural, calm English voices (e.g. Samantha, Daniel, Google US, Alex)
        this.selectedVoice = voices.find(v => 
          (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel') || v.name.includes('Google')))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  // --- Sound Effects ---

  // Exercise Transition / Start Bell (Tibetan Singing Bowl style)
  playChime(type = 'start') {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      const baseFreq = type === 'start' ? 528 : (type === 'complete' ? 660 : 432);
      const partials = [
        { freq: baseFreq, gain: 0.4, decay: 2.5 },
        { freq: baseFreq * 1.5, gain: 0.25, decay: 2.0 },
        { freq: baseFreq * 2.76, gain: 0.15, decay: 1.6 },
        { freq: baseFreq * 4.12, gain: 0.08, decay: 1.2 }
      ];

      partials.forEach(p => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(p.gain, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + p.decay + 0.1);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Big Phase Transition Gong / Zen Bell
  playPhaseGong() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      [216, 324, 432, 648].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3 / (idx + 1), now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 4.0);
      });
    } catch (e) {
      console.warn('Phase gong error:', e);
    }
  }

  // 3-2-1 Countdown Beeps
  playCountdownBeep(count) {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = count === 1 ? 880 : (count === 2 ? 660 : 550);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Countdown beep error:', e);
    }
  }

  // Halfway encouraging chime
  playHalfwayDing() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now); // G5 note
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.3);
    } catch (e) {
      console.warn('Halfway ding error:', e);
    }
  }

  // --- Audio Ducking (lowers background music/ambient during speech) ---
  duck(isDucking) {
    const session = this.ambientSession;
    // A fading-out session must not be swelled back up by a late duck(false)
    if (session && !session.stopping && this.ctx) {
      const gain = session.gain.gain;
      const now = this.ctx.currentTime;
      try {
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(Math.max(0.001, gain.value), now);
        gain.exponentialRampToValueAtTime(isDucking ? 0.015 : AMBIENT_LEVEL, now + (isDucking ? 0.25 : 0.6));
      } catch (_) {}
    }
    if (typeof this.onDuck === 'function') {
      try { this.onDuck(isDucking); } catch (_) {}
    }
  }

  // --- Voice Guidance ---
  speak(text, priority = false) {
    if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      if (priority) {
        // cancel() fires onend/onerror for everything queued; reset first so the
        // refcount below doesn't go negative and the music doesn't flicker.
        this.activeSpeech = 0;
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = 0.95; // Slightly slower, calm bedtime pace
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.activeSpeech = Math.max(0, this.activeSpeech - 1);
        if (this.activeSpeech === 0) this.duck(false);
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      if (this.activeSpeech === 0) this.duck(true);
      this.activeSpeech++;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      this.activeSpeech = 0;
      this.duck(false);
    }
  }

  stopSpeech() {
    this.activeSpeech = 0;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.duck(false);
  }

  // --- Ambient Background Soundscape ---
  startAmbient(mode = this.ambientMode) {
    this.ambientMode = mode;
    // Replace (not stack on) whatever is playing; the old session fades out on its own nodes
    this.stopAmbient();
    if (mode === 'silence' || !mode) return;

    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      // Come in ducked if the coach is mid-sentence
      gain.gain.exponentialRampToValueAtTime(this.activeSpeech > 0 ? 0.015 : AMBIENT_LEVEL, now + 3.0);
      gain.connect(this.masterGain);

      const nodes = [];
      if (mode === 'drone') {
        // Warm 432 Hz harmonic sleep drone with a 4 Hz theta beat (432 vs 436)
        [108, 216, 432, 436].forEach(f => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, now);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          osc.connect(filter);
          filter.connect(gain);
          osc.start();
          nodes.push(osc);
        });
      } else if (mode === 'rain') {
        const bufferSize = ctx.sampleRate * 4;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.45;
          b6 = white * 0.115926;
        }
        // Fade the loop edges to avoid a click at the loop boundary
        const fadeSamples = 2400;
        for (let i = 0; i < fadeSamples; i++) {
          const factor = i / fadeSamples;
          output[i] *= factor;
          output[bufferSize - 1 - i] *= factor;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;
        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(1200, now);
        rainSource.connect(rainFilter);
        rainFilter.connect(gain);
        rainSource.start();
        nodes.push(rainSource);
      } else if (mode === 'bowls') {
        [216, 288, 432, 576].forEach(freq => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const oscGain = ctx.createGain();
          oscGain.gain.setValueAtTime(0.25, now);
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freq, now);
          filter.Q.setValueAtTime(2.5, now);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(filter);
          filter.connect(oscGain);
          oscGain.connect(gain);
          osc.start();
          nodes.push(osc);
        });
      }

      this.ambientSession = { gain, nodes, stopping: false };
      this.ambientPlaying = true;
    } catch (e) {
      console.warn('Ambient soundscape start error:', e);
    }
  }

  stopAmbient() {
    const session = this.ambientSession;
    if (!session) return;
    // Detach immediately: a start that follows owns a fresh session, so the delayed
    // teardown below can never kill its nodes.
    this.ambientSession = null;
    this.ambientPlaying = false;
    session.stopping = true;
    try {
      const g = session.gain.gain;
      const now = this.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(0.0001, g.value), now);
      g.exponentialRampToValueAtTime(0.0001, now + 1.5);
    } catch (e) {
      console.warn('Stop ambient error:', e);
    }
    setTimeout(() => {
      session.nodes.forEach(node => {
        try { node.stop(); node.disconnect(); } catch (_) {}
      });
      try { session.gain.disconnect(); } catch (_) {}
    }, 1600);
  }

  setVolume(val) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }
}

export const audioEngine = new AudioEngine();
