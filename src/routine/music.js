// Music controller for the routine: one place that knows how each audio source
// starts, pauses, resumes and stops, so the view never juggles players itself.
import { audioEngine } from '../audio/audioEngine.js';
import { spotifyService, CURATED_PLAYLISTS } from '../services/spotify.js';

export const SOURCE = {
  APP: 'spotify-app',       // user plays full songs in the Spotify app (optionally remote-controlled via Web API)
  EMBED: 'spotify-embed',   // in-browser Spotify iframe (30s previews unless logged in)
  AMBIENT: 'ambient',       // procedural soundscapes from the audio engine
  SILENT: 'silent'
};

// Playlist the music moves to when a phase begins (strength keeps the user's pick)
const PHASE_PLAYLIST = { mobility: 'evening_acoustic', windDown: 'ambient_sleep' };

function whenIframeApi() {
  return new Promise(resolve => {
    if (window.SpotifyIframeApi) return resolve(window.SpotifyIframeApi);
    window.addEventListener('spotify-iframe-api-ready', () => resolve(window.SpotifyIframeApi), { once: true });
  });
}

class MusicController {
  constructor() {
    this.source = SOURCE.APP;
    this.ambientSound = 'drone';
    this.phasePlaylist = null; // temporary, session-only override set by phase changes
    this.embed = null;
    this.embedHost = null;
    this._mountToken = 0;
    this._pendingEmbedPlay = false;
    this.onStatusChange = null;

    // Duck the Spotify app volume with the coach's voice (ambient ducks itself in the engine).
    // The embed iframe has no volume control, so only the Web API path is ducked.
    audioEngine.onDuck = (isDucking) => {
      if (this.source === SOURCE.APP && spotifyService.isConnected()) {
        spotifyService.duck(isDucking);
      }
    };
  }

  get isSpotify() {
    return this.source === SOURCE.APP || this.source === SOURCE.EMBED;
  }

  get playlist() {
    return this.phasePlaylist || spotifyService.getActivePlaylist();
  }

  /** Can the dock's pause/resume button actually control playback? */
  get canRemoteControl() {
    return this.source === SOURCE.EMBED || (this.source === SOURCE.APP && spotifyService.isConnected());
  }

  // --- embed lifecycle -------------------------------------------------------

  /** (Re)mount the iframe controller into hostEl. Pass null to tear it down. */
  async mountEmbed(hostEl) {
    this.destroyEmbed();
    this.embedHost = hostEl;
    if (this.source !== SOURCE.EMBED || !hostEl) return;

    const token = ++this._mountToken;
    // createController *replaces* the element it is given, so give it a throwaway child
    const slot = document.createElement('div');
    hostEl.replaceChildren(slot);

    const api = await whenIframeApi();
    if (token !== this._mountToken) return;

    api.createController(slot, { uri: this.playlist.uri, width: '100%', height: '80', theme: '0' }, (controller) => {
      if (token !== this._mountToken) {
        try { controller.destroy(); } catch (_) {}
        return;
      }
      this.embed = controller;
      controller.addListener('ready', () => {
        if (this._pendingEmbedPlay) {
          this._pendingEmbedPlay = false;
          try { controller.play(); } catch (_) {}
        }
      });
      controller.addListener('playback_update', () => this.onStatusChange?.());
    });
  }

  destroyEmbed() {
    this._mountToken++; // invalidates any in-flight mount
    if (this.embed) {
      try { this.embed.destroy(); } catch (_) {}
      this.embed = null;
    }
    this.embedHost?.replaceChildren();
    this.embedHost = null;
  }

  // --- transport -------------------------------------------------------------

  async start() {
    switch (this.source) {
      case SOURCE.APP:
        if (spotifyService.isConnected()) await spotifyService.play(this.playlist.uri, true);
        break;
      case SOURCE.EMBED:
        this._playEmbed();
        break;
      case SOURCE.AMBIENT:
        audioEngine.startAmbient(this.ambientSound);
        break;
    }
  }

  pause() {
    switch (this.source) {
      case SOURCE.APP:
        if (spotifyService.isConnected()) spotifyService.pause();
        break;
      case SOURCE.EMBED:
        this._pendingEmbedPlay = false;
        try { this.embed?.pause(); } catch (_) {}
        break;
      case SOURCE.AMBIENT:
        audioEngine.stopAmbient();
        break;
    }
  }

  async resume() {
    switch (this.source) {
      case SOURCE.APP:
        if (spotifyService.isConnected()) await spotifyService.resume();
        break;
      case SOURCE.EMBED:
        try { this.embed?.resume(); } catch (_) {}
        break;
      case SOURCE.AMBIENT:
        audioEngine.startAmbient(this.ambientSound);
        break;
    }
  }

  /** End of session: silence everything and forget phase overrides */
  stop() {
    this.pause();
    this.phasePlaylist = null;
  }

  _playEmbed() {
    if (this.embed) {
      try { this.embed.play(); } catch (e) { console.warn('Embed play error:', e); }
    } else {
      this._pendingEmbedPlay = true; // played as soon as the controller reports ready
    }
  }

  // --- configuration ---------------------------------------------------------

  /** Switch source; silences the old one and optionally starts the new one right away */
  async setSource(source, { playNow = false } = {}) {
    if (source !== this.source) {
      this.pause();
      this.source = source;
    }
    if (playNow) await this.start();
  }

  async setAmbientSound(sound, { playNow = false } = {}) {
    this.ambientSound = sound;
    if (playNow && this.source === SOURCE.AMBIENT) audioEngine.startAmbient(sound);
  }

  async selectPlaylist(uri, { playNow = false } = {}) {
    spotifyService.setPlaylistUri(uri);
    this.phasePlaylist = null;
    if (this.source === SOURCE.EMBED && this.embed) {
      try {
        this.embed.loadUri(uri);
        if (playNow) this.embed.play();
      } catch (_) {}
    } else if (this.source === SOURCE.APP && playNow && spotifyService.isConnected()) {
      await spotifyService.play(uri, true);
    }
  }

  /** Move to the phase's playlist when we can really switch it. Returns the playlist or null. */
  onPhaseChange(phaseId) {
    const target = CURATED_PLAYLISTS.find(p => p.id === PHASE_PLAYLIST[phaseId]);
    if (!target || target.uri === this.playlist.uri) return null;

    if (this.source === SOURCE.EMBED && this.embed) {
      try {
        this.embed.loadUri(target.uri);
        this.embed.play();
      } catch (_) { return null; }
    } else if (this.source === SOURCE.APP && spotifyService.isConnected()) {
      spotifyService.play(target.uri, true);
    } else {
      return null; // the user's own Spotify app keeps playing what they chose
    }
    this.phasePlaylist = target;
    return target;
  }

  /** Restart on a fresh random song (Web API only; the embed cannot shuffle) */
  async shuffle() {
    if (this.source === SOURCE.APP && spotifyService.isConnected()) {
      return spotifyService.play(this.playlist.uri, true);
    }
    return false;
  }

  statusText(running, paused) {
    if (this.source === SOURCE.APP) {
      if (!running) return spotifyService.isConnected()
        ? '📱 Spotify Connected • Starts with the routine'
        : '📱 Spotify App Mode • Play it in the app, then start';
      if (paused) return '⏸ Routine Paused';
      return spotifyService.isConnected()
        ? '📱 Routine Active • Playing via Spotify'
        : '📱 Routine Active • Spotify playing in the app';
    }
    if (!running) return 'In-Browser Player Ready';
    return paused ? '⏸ Paused' : '▶ Playing In-Browser Bedtime Music';
  }
}

export const music = new MusicController();
