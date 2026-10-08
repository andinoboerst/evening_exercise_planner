// Spotify Service: OAuth PKCE, Web API remote playback, and curated deep-links

const SPOTIFY_CLIENT_ID_KEY = 'nocturne_spotify_client_id';
const SPOTIFY_TOKEN_KEY = 'nocturne_spotify_token';
const SPOTIFY_PLAYLIST_KEY = 'nocturne_spotify_playlist_pref';

export const CURATED_PLAYLISTS = [
  {
    id: 'lofi_chill',
    name: 'Lo-Fi Beats Workout & Flow',
    description: 'Mellow grooves, warm beats for strength and mobility.',
    uri: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
    webUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    tag: 'Strength & Flow'
  },
  {
    id: 'evening_acoustic',
    name: 'Evening Chill & Acoustic',
    description: 'Gentle guitar and calm melodies for decompression.',
    uri: 'spotify:playlist:37i9dQZF1DX4E3UdUs7fUx',
    webUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4E3UdUs7fUx',
    tag: 'Stretching'
  },
  {
    id: 'ambient_sleep',
    name: 'Deep Sleep & Ambient Yoga',
    description: 'Theta drone, calm strings, and soundscapes for wind-down.',
    uri: 'spotify:playlist:37i9dQZF1DWZd79rJ6a7lp',
    webUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp',
    tag: 'Wind-Down'
  },
  {
    id: 'peaceful_piano',
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
    this.loadToken();
    this.handleRedirectCallback();
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
  }

  setClientId(clientId) {
    this.clientId = clientId.trim();
    localStorage.setItem(SPOTIFY_CLIENT_ID_KEY, this.clientId);
  }

  setPlaylistUri(uri) {
    this.activePlaylistUri = uri;
    localStorage.setItem(SPOTIFY_PLAYLIST_KEY, uri);
  }

  isConnected() {
    return Boolean(this.token);
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

      // Clean URL params so clean state
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
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
  }

  // Trigger Playback via Spotify Web API
  async play(contextUri = this.activePlaylistUri) {
    if (!this.token) {
      // Fallback: Launch Spotify App directly via URI or Web Player
      this.launchSpotifyApp(contextUri);
      return false;
    }

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context_uri: contextUri
        })
      });

      if (res.status === 404 || res.status === 403) {
        // No active device found, launch Spotify app
        this.launchSpotifyApp(contextUri);
        return false;
      }
      return res.ok;
    } catch (e) {
      console.warn('Spotify play API error, launching app fallback:', e);
      this.launchSpotifyApp(contextUri);
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
    } catch (e) {
      console.warn('Spotify pause error:', e);
    }
  }

  // Launch Spotify app directly via custom scheme or web link
  launchSpotifyApp(uri = this.activePlaylistUri) {
    try {
      // Custom scheme opens Spotify native app immediately on iOS & Android
      window.location.href = uri;
    } catch (_) {
      const item = CURATED_PLAYLISTS.find(p => p.uri === uri);
      if (item) {
        window.open(item.webUrl, '_blank');
      }
    }
  }
}

export const spotifyService = new SpotifyService();
