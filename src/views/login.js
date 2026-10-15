import { signInWithGoogle, isSupabaseConfigured } from '../services/supabase.js';

export function mountLogin(container, navigate) {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card glass-panel">
        <div class="login-header">
          <div class="login-logo-wrap">
            <img src="/AndiNu_icon.png" alt="AndiNú Logo" class="login-logo-img" />
          </div>
          <div class="dash-names-pill" style="margin: 0 auto 8px auto; width: fit-content;">Andino & Núria</div>
          <h1 class="login-title">AndiNú</h1>
          <p class="login-subtitle">Household Suite • <code>andinu.cc</code></p>
        </div>

        <div class="login-body">
          <p class="login-desc">
            Sign in with your Google account to access our bedtime routine, kitchen & meal planner, and shared lists.
          </p>

          <button id="btn-google-login" class="btn-google-auth">
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          ${!isSupabaseConfigured ? `
            <div class="mock-login-badge">
              <span>⚠️ Supabase credentials not yet detected in environment.</span>
              <button id="btn-mock-login" class="btn-secondary" style="margin-top: 10px; width: 100%;">
                Enter in Local Preview Mode
              </button>
            </div>
          ` : ''}

          <div class="login-security-note">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Private household security: Only invited Google accounts are authorized.</span>
          </div>

          <div class="login-footer-links">
            <a href="/" data-nav="/">Overview</a> • 
            <a href="/pp" data-nav="/pp">Privacy Policy</a> • 
            <a href="/tos" data-nav="/tos">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-google-login')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-google-login');
    if (btn) {
      btn.innerHTML = `<span class="spinner"></span> Connecting to Google...`;
      btn.disabled = true;
    }
    const { error } = await signInWithGoogle();
    if (error) {
      alert(`Sign in failed: ${error.message}`);
      if (btn) {
        btn.innerHTML = `<span>Continue with Google</span>`;
        btn.disabled = false;
      }
    }
  });

  document.getElementById('btn-mock-login')?.addEventListener('click', () => {
    localStorage.setItem('andinu_mock_user', JSON.stringify({
      id: 'mock-andino',
      email: 'andino@andinu.cc',
      user_metadata: { full_name: 'Andino & Núria' }
    }));
    navigate('/');
  });

  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = el.getAttribute('data-nav');
      if (path) navigate(path);
    });
  });
}
