// Spotify Service: In-app Web Playback SDK, background Web API remote playback, and embed player

const SPOTIFY_CLIENT_ID_KEY = 'nocturne_spotify_client_id';
const SPOTIFY_TOKEN_KEY = 'nocturne_spotify_token';
const SPOTIFY_PLAYLIST_KEY = 'nocturne_spotify_playlist_pref';

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
    this.activePlaylistUri = localStorage.getItem(SPOTIFY_PLAYLIST_KEY) || CURATED_PLAYLISTS[0].uri;
    this.player = null;
    this.webPlayerDeviceId = null;
    this.availableDevices = [];
    this.isPlaying = false;

    this.loadToken();
    this.handleRedirectCallback();

    if (this.token) {
      this.initWebPlaybackSDK();
    }
  }

  loadToken() {
    try {
      const stored = localStorage.getItem(SPOTIFY_TOKEN_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at > Date.now()) {
          this.token = parsed.access_token;
        } else {
          localStorage.removeItem(SPOTIFY_TOKEN_KEY);
          this.token = null;
        }
      }
    } catch (_) {
      this.token = null;
    }
  }

  saveToken(accessToken, expiresInSec) {
    this.token = accessToken;
    const expiresAt = Date.now() + (expiresInSec * 1000);
    localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify({
      access_token: accessToken,
      expires_at: expiresAt
    }));
    this.initWebPlaybackSDK();
  }

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

  isConnected() {
    return Boolean(this.token);
  }

  // --- Official Spotify Web Playback SDK (In-browser player) ---
  initWebPlaybackSDK() {
    if (!this.token) return;

    const setup = () => {
      if (this.player || !window.Spotify) return;
      try {
        this.player = new window.Spotify.Player({
          name: 'AndiNú Web Player',
          getOAuthToken: cb => cb(this.token),
          volume: 0.8
        });

        this.player.addListener('ready', ({ device_id }) => {
          console.log('[Nocturne] Spotify in-browser player ready! Device ID:', device_id);
          this.webPlayerDeviceId = device_id;
        });

        this.player.addListener('not_ready', ({ device_id }) => {
          console.log('[Nocturne] Spotify player device offline:', device_id);
          if (this.webPlayerDeviceId === device_id) {
            this.webPlayerDeviceId = null;
          }
        });

        this.player.addListener('player_state_changed', state => {
          if (state) {
            this.isPlaying = !state.paused;
          }
        });

        this.player.addListener('initialization_error', ({ message }) => {
          console.warn('[Nocturne] Spotify SDK init error:', message);
        });

        this.player.addListener('authentication_error', ({ message }) => {
          console.warn('[Nocturne] Spotify SDK auth error:', message);
          this.disconnect();
        });

        this.player.addListener('account_error', ({ message }) => {
          console.warn('[Nocturne] Spotify SDK Premium account required for Web Playback SDK:', message);
        });

        this.player.connect();
      } catch (err) {
        console.warn('Error creating Spotify player:', err);
      }
    };

    if (window.Spotify) {
      setup();
    } else {
      window.onSpotifyWebPlaybackSDKReady = setup;
    }
  }

  // Generate PKCE code verifier and challenge
  async generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async loginWithPKCE() {
    if (!this.clientId) {
      throw new Error('Please enter a Spotify Client ID first.');
    }

    const verifier = this.generateRandomString(128);
    const challenge = await this.generateCodeChallenge(verifier);

    localStorage.setItem('spotify_verifier', verifier);

    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'user-modify-playback-state user-read-playback-state user-read-currently-playing streaming';

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scope,
      code_challenge_method: 'S256',
      code_challenge: challenge
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleRedirectCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      const verifier = localStorage.getItem('spotify_verifier');
      const redirectUri = window.location.origin + window.location.pathname;

      window.history.replaceState({}, document.title, window.location.pathname);

      if (verifier && this.clientId) {
        try {
          const body = new URLSearchParams({
            client_id: this.clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: verifier
          });

          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
          });

          const data = await response.json();
          if (data.access_token) {
            this.saveToken(data.access_token, data.expires_in);
            localStorage.removeItem('spotify_verifier');
            return true;
          }
        } catch (e) {
          console.error('Spotify token exchange failed', e);
        }
      }
    }
    return false;
  }

  disconnect() {
    this.token = null;
    this.webPlayerDeviceId = null;
    if (this.player) {
      try { this.player.disconnect(); } catch (_) {}
      this.player = null;
    }
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
  }

  // Fetch available Spotify Connect devices
  async getDevices() {
    if (!this.token) return [];
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.availableDevices = data.devices || [];
        return this.availableDevices;
      }
    } catch (e) {
      console.warn('Error fetching Spotify devices:', e);
    }
    return [];
  }

  // Transfer playback to a specific device ID
  async transferPlayback(deviceId, play = true) {
    if (!this.token || !deviceId) return false;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: play
        })
      });
      return res.ok;
    } catch (e) {
      console.warn('Error transferring playback:', e);
      return false;
    }
  }

  // Trigger Playback in background WITHOUT EVER jumping out of the app
  async play(contextUri = this.activePlaylistUri) {
    if (!this.token) {
      // Not logged in: keep inside app, user can use embedded player or ambient sounds
      return false;
    }

    try {
      const devices = await this.getDevices();
      let targetDeviceId = null;

      // 1. Check for already active device
      const activeDev = devices.find(d => d.is_active);
      if (activeDev) {
        targetDeviceId = activeDev.id;
      } else if (this.webPlayerDeviceId) {
        // 2. Use in-app Web Playback SDK device
        targetDeviceId = this.webPlayerDeviceId;
        await this.transferPlayback(targetDeviceId, true);
      } else if (devices.length > 0) {
        // 3. Use any available Spotify Connect device (phone / computer / speaker)
        targetDeviceId = devices[0].id;
        await this.transferPlayback(targetDeviceId, true);
      }

      const url = targetDeviceId 
        ? `https://api.spotify.com/v1/me/player/play?device_id=${targetDeviceId}`
        : 'https://api.spotify.com/v1/me/player/play';

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context_uri: contextUri,
          offset: { position: 0 },
          position_ms: 0
        })
      });

      if (res.ok) {
        this.isPlaying = true;
        return true;
      } else {
        console.warn('Spotify play response status:', res.status);
        return false;
      }
    } catch (e) {
      console.warn('Spotify play error:', e);
      return false;
    }
  }

  async pause() {
    if (!this.token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      this.isPlaying = false;
    } catch (e) {
      console.warn('Spotify pause error:', e);
    }
  }

  // Audio Ducking: lowers music during voice coach instructions
  async setVolume(percent) {
    if (!this.token) return;
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    try {
      if (this.player) {
        try { await this.player.setVolume(clamped / 100); } catch (_) {}
      }
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${clamped}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
    } catch (e) {
      console.warn('Spotify setVolume error:', e);
    }
  }

  async duck(isDucking) {
    // When coach speaks, duck to 20%, when finished restore to 80%
    const target = isDucking ? 20 : 80;
    await this.setVolume(target);
  }
}

export const spotifyService = new SpotifyService();
