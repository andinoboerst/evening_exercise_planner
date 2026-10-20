// Spotify Service: Web API remote playback (PKCE login), Web Playback SDK device, and playlist catalog

const SPOTIFY_CLIENT_ID_KEY = 'nocturne_spotify_client_id';
const SPOTIFY_TOKEN_KEY = 'nocturne_spotify_token';
const SPOTIFY_PLAYLIST_KEY = 'nocturne_spotify_playlist_pref';
const SPOTIFY_VERIFIER_KEY = 'nocturne_spotify_verifier';
const SPOTIFY_STATE_KEY = 'nocturne_spotify_oauth_state';
const API = 'https://api.spotify.com/v1/me/player';

export const CURATED_PLAYLISTS = [
  {
    id: 'lofi_chill',
    spotifyId: '37i9dQZF1DXcBWIGoYBM5M',
    name: 'Lo-Fi Beats Workout & Flow',
    description: 'Mellow grooves, warm beats for strength and mobility.',
    uri: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
    webUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    tag: 'Strength & Flow'
  },
  {
    id: 'evening_acoustic',
    spotifyId: '37i9dQZF1DX4E3UdUs7fUx',
    name: 'Evening Chill & Acoustic',
    description: 'Gentle guitar and calm melodies for decompression.',
    uri: 'spotify:playlist:37i9dQZF1DX4E3UdUs7fUx',
    webUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4E3UdUs7fUx',
    tag: 'Stretching'
  },
  {
    id: 'ambient_sleep',
    spotifyId: '37i9dQZF1DWZd79rJ6a7lp',
    name: 'Deep Sleep & Ambient Yoga',
    description: 'Theta drone, calm strings, and soundscapes for wind-down.',
    uri: 'spotify:playlist:37i9dQZF1DWZd79rJ6a7lp',
    webUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp',
    tag: 'Wind-Down'
  },
  {
    id: 'peaceful_piano',
    spotifyId: '37i9dQZF1DX4sWSpwq3LiO',
    name: 'Peaceful Piano Nocturne',
    description: 'Quiet piano for spinal stretches and mindful breathing.',
    uri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO',
    webUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
    tag: 'Meditation'
  }
];

class SpotifyService {
  constructor() {
    this.clientId = localStorage.getItem(SPOTIFY_CLIENT_ID_KEY) || '';
    this.token = null;
    this.refreshToken = null;
    this.expiresAt = 0;
    this.activePlaylistUri = localStorage.getItem(SPOTIFY_PLAYLIST_KEY) || CURATED_PLAYLISTS[0].uri;
    this.player = null;
    this.webPlayerDeviceId = null;
    this.availableDevices = [];
    this.isPlaying = false;

    // Ducking state (serialised so rapid speech start/stop never races API calls)
    this._duckTarget = false;
    this._duckApplied = false;
    this._duckBusy = false;
    this._restoreVolume = 80;

    this.loadToken();
    // Resolves once a pending OAuth redirect (if any) has been processed
    this.ready = this.handleRedirectCallback().then(() => {
      if (this.token) this.initWebPlaybackSDK();
    });
  }

  // --- Token storage -------------------------------------------------------

  loadToken() {
    try {
      const stored = localStorage.getItem(SPOTIFY_TOKEN_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      this.refreshToken = parsed.refresh_token || null;
      this.expiresAt = parsed.expires_at || 0;
      if (parsed.access_token && parsed.expires_at > Date.now() + 30_000) {
        this.token = parsed.access_token;
      } else if (!this.refreshToken) {
        localStorage.removeItem(SPOTIFY_TOKEN_KEY);
      }
    } catch (_) {
      this.token = null;
    }
  }

  saveToken({ access_token, refresh_token, expires_in }) {
    this.token = access_token;
    this.refreshToken = refresh_token || this.refreshToken;
    this.expiresAt = Date.now() + (expires_in * 1000);
    localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify({
      access_token: this.token,
      refresh_token: this.refreshToken,
      expires_at: this.expiresAt
    }));
  }

  // Returns a valid access token, refreshing it when it is about to expire
  async getValidToken() {
    if (this.token && this.expiresAt > Date.now() + 30_000) return this.token;
    if (!this.refreshToken || !this.clientId) {
      if (this.token) this.disconnect();
      return null;
    }
    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId
        }).toString()
      });
      const data = await res.json();
      if (!data.access_token) throw new Error(data.error_description || 'refresh failed');
      this.saveToken(data);
      return this.token;
    } catch (e) {
      console.warn('[Spotify] token refresh failed:', e);
      this.disconnect();
      return null;
    }
  }

  // Authenticated fetch against the Web API. Returns the Response or null when disconnected.
  async api(path, options = {}) {
    const token = await this.getValidToken();
    if (!token) return null;
    const url = path.startsWith('http') ? path : `${API}${path}`;
    return fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
  }

  // --- Settings / catalog --------------------------------------------------

  setClientId(clientId) {
    this.clientId = clientId.trim();
    localStorage.setItem(SPOTIFY_CLIENT_ID_KEY, this.clientId);
  }

  setPlaylistUri(uri) {
    this.activePlaylistUri = uri;
    localStorage.setItem(SPOTIFY_PLAYLIST_KEY, uri);
  }

  getActivePlaylist() {
    return CURATED_PLAYLISTS.find(p => p.uri === this.activePlaylistUri) || CURATED_PLAYLISTS[0];
  }

  getActivePlaylistId() {
    const item = this.getActivePlaylist();
    return item.spotifyId || item.uri.replace('spotify:playlist:', '');
  }

  // A connected session is one we can still authenticate (valid token, or refreshable)
  isConnected() {
    return Boolean(this.token) || Boolean(this.refreshToken && this.clientId);
  }

  // --- Official Spotify Web Playback SDK (In-browser player device) ---------

  initWebPlaybackSDK() {
    if (!this.token || this.player) return;

    const setup = () => {
      if (this.player || !window.Spotify) return;
      try {
        this.player = new window.Spotify.Player({
          name: 'AndiNú Web Player',
          getOAuthToken: async cb => {
            const t = await this.getValidToken();
            if (t) cb(t);
          },
          volume: 0.8
        });

        this.player.addListener('ready', ({ device_id }) => {
          this.webPlayerDeviceId = device_id;
        });
        this.player.addListener('not_ready', ({ device_id }) => {
          if (this.webPlayerDeviceId === device_id) this.webPlayerDeviceId = null;
        });
        this.player.addListener('player_state_changed', state => {
          if (state) this.isPlaying = !state.paused;
        });
        this.player.addListener('initialization_error', ({ message }) => {
          console.warn('[Spotify] SDK init error:', message);
        });
        this.player.addListener('authentication_error', ({ message }) => {
          console.warn('[Spotify] SDK auth error:', message);
          this.disconnect();
        });
        this.player.addListener('account_error', ({ message }) => {
          console.warn('[Spotify] Premium account required for Web Playback SDK:', message);
        });

        this.player.connect();
      } catch (err) {
        console.warn('[Spotify] Error creating player:', err);
      }
    };

    if (window.Spotify) {
      setup();
    } else {
      window.addEventListener('spotify-sdk-ready', setup, { once: true });
    }
  }

  // --- PKCE login ----------------------------------------------------------

  async generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values, v => possible[v % possible.length]).join('');
  }

  async loginWithPKCE() {
    if (!this.clientId) {
      throw new Error('Please enter a Spotify Client ID first.');
    }

    const verifier = this.generateRandomString(128);
    const challenge = await this.generateCodeChallenge(verifier);
    const state = this.generateRandomString(24);

    localStorage.setItem(SPOTIFY_VERIFIER_KEY, verifier);
    localStorage.setItem(SPOTIFY_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: window.location.origin + window.location.pathname,
      scope: 'user-modify-playback-state user-read-playback-state user-read-currently-playing streaming',
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Only consumes the URL when it is OUR Spotify redirect (matching state). Supabase's
  // Google login also returns a `?code=` and must be left untouched.
  async handleRedirectCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const expectedState = localStorage.getItem(SPOTIFY_STATE_KEY);

    if (!code || !state || !expectedState || state !== expectedState) return false;

    const verifier = localStorage.getItem(SPOTIFY_VERIFIER_KEY);
    const redirectUri = window.location.origin + window.location.pathname;

    window.history.replaceState({}, document.title, window.location.pathname);
    localStorage.removeItem(SPOTIFY_STATE_KEY);
    localStorage.removeItem(SPOTIFY_VERIFIER_KEY);

    if (!verifier || !this.clientId) return false;

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: verifier
        }).toString()
      });
      const data = await response.json();
      if (data.access_token) {
        this.saveToken(data);
        return true;
      }
    } catch (e) {
      console.error('Spotify token exchange failed', e);
    }
    return false;
  }

  disconnect() {
    this.token = null;
    this.refreshToken = null;
    this.expiresAt = 0;
    this.webPlayerDeviceId = null;
    this.isPlaying = false;
    if (this.player) {
      try { this.player.disconnect(); } catch (_) {}
      this.player = null;
    }
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
  }

  // --- Playback ------------------------------------------------------------

  async getDevices() {
    try {
      const res = await this.api('/devices');
      if (res?.ok) {
        const data = await res.json();
        this.availableDevices = data.devices || [];
        return this.availableDevices;
      }
    } catch (e) {
      console.warn('[Spotify] Error fetching devices:', e);
    }
    return [];
  }

  async transferPlayback(deviceId, play = true) {
    if (!deviceId) return false;
    try {
      const res = await this.api('', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [deviceId], play })
      });
      return Boolean(res?.ok);
    } catch (e) {
      console.warn('[Spotify] Error transferring playback:', e);
      return false;
    }
  }

  async setShuffle(state = true, deviceId = null) {
    try {
      const qs = new URLSearchParams({ state: String(state) });
      if (deviceId) qs.set('device_id', deviceId);
      await this.api(`/shuffle?${qs}`, { method: 'PUT' });
    } catch (e) {
      console.warn('[Spotify] setShuffle error:', e);
    }
  }

  // Pick the best target device: active > in-app web player > any available
  async resolveDevice() {
    const devices = await this.getDevices();
    const active = devices.find(d => d.is_active);
    if (active) return active.id;

    const fallback = this.webPlayerDeviceId || devices[0]?.id || null;
    if (fallback) await this.transferPlayback(fallback, false);
    return fallback;
  }

  // Start a context from the beginning (shuffled so each session opens on a different song)
  async play(contextUri = this.activePlaylistUri, shuffle = true) {
    if (!this.isConnected()) return false;

    try {
      const deviceId = await this.resolveDevice();
      if (shuffle) await this.setShuffle(true, deviceId);

      const qs = deviceId ? `?device_id=${deviceId}` : '';
      const put = (offset) => this.api(`/play${qs}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context_uri: contextUri,
          ...(offset !== null ? { offset: { position: offset } } : {}),
          position_ms: 0
        })
      });

      // Random start offset; fall back to the top if it exceeds the playlist length
      let res = await put(shuffle ? Math.floor(Math.random() * 25) : null);
      if (res && !res.ok && shuffle) res = await put(0);

      this.isPlaying = Boolean(res?.ok);
      if (res && !res.ok) console.warn('[Spotify] play failed with status', res.status);
      return this.isPlaying;
    } catch (e) {
      console.warn('[Spotify] play error:', e);
      return false;
    }
  }

  // Continue whatever was paused (does NOT restart the playlist)
  async resume() {
    if (!this.isConnected()) return false;
    try {
      const res = await this.api('/play', { method: 'PUT' });
      this.isPlaying = Boolean(res?.ok);
      return this.isPlaying;
    } catch (e) {
      console.warn('[Spotify] resume error:', e);
      return false;
    }
  }

  async pause() {
    if (!this.isConnected()) return;
    try {
      await this.api('/pause', { method: 'PUT' });
      this.isPlaying = false;
    } catch (e) {
      console.warn('[Spotify] pause error:', e);
    }
  }

  async setVolume(percent) {
    if (!this.isConnected()) return;
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    try {
      if (this.player) {
        try { await this.player.setVolume(clamped / 100); } catch (_) {}
      }
      await this.api(`/volume?volume_percent=${clamped}`, { method: 'PUT' });
    } catch (e) {
      console.warn('[Spotify] setVolume error:', e);
    }
  }

  async getCurrentVolume() {
    try {
      const res = await this.api('');
      if (res?.ok && res.status !== 204) {
        const data = await res.json();
        const v = data?.device?.volume_percent;
        if (Number.isFinite(v)) return v;
      }
    } catch (_) {}
    return null;
  }

  // Audio ducking: lowers music while the voice coach speaks, then restores the
  // volume the user actually had. Calls are coalesced: only the latest request wins.
  duck(isDucking) {
    this._duckTarget = isDucking;
    if (!this.isConnected()) return Promise.resolve();
    if (!this._duckBusy) this._duckLoop();
    return Promise.resolve();
  }

  async _duckLoop() {
    this._duckBusy = true;
    try {
      while (this._duckTarget !== this._duckApplied) {
        const target = this._duckTarget;
        if (target) {
          const current = await this.getCurrentVolume();
          if (current !== null && current > 20) this._restoreVolume = current;
          await this.setVolume(20);
        } else {
          await this.setVolume(this._restoreVolume);
        }
        this._duckApplied = target;
      }
    } finally {
      this._duckBusy = false;
    }
  }
}

export const spotifyService = new SpotifyService();
