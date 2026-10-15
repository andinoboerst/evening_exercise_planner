import { supabase, isSupabaseConfigured, isEmailAllowed, signOut } from '../services/supabase.js';

export async function mountAuthCallback(container, navigate) {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card glass-panel text-center">
        <div class="spinner-large" style="margin: 20px auto;"></div>
        <h2 style="font-family: var(--font-heading); margin-bottom: 8px;">Authenticating...</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Connecting your Google account to Andi & Nú's hub</p>
      </div>
    </div>
  `;

  if (!isSupabaseConfigured) {
    navigate('/');
    return;
  }

  try {
    // Supabase JS handles the PKCE hash / query code automatically via detectSessionInUrl: true
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session?.user) {
      // Check auth state change once in case session is being processed
      const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (newSession?.user) {
          authListener.subscription.unsubscribe();
          handleUserCheck(newSession.user);
        }
      });
      setTimeout(() => {
        authListener.subscription.unsubscribe();
        navigate('/login');
      }, 3500);
      return;
    }

    await handleUserCheck(session.user);
  } catch (err) {
    console.error('Auth callback error:', err);
    container.innerHTML = `
      <div class="login-wrapper">
        <div class="login-card glass-panel text-center">
          <div style="font-size: 2rem; margin-bottom: 12px;">⚠️</div>
          <h2 style="color: #ef4444; font-family: var(--font-heading);">Authentication Failed</h2>
          <p style="color: var(--text-muted); margin: 12px 0 20px;">${err.message || 'Unable to exchange login session.'}</p>
          <a href="/login" class="btn-primary-start" style="display: inline-block; padding: 10px 20px;">Return to Login</a>
        </div>
      </div>
    `;
  }

  async function handleUserCheck(user) {
    const email = user.email || '';
    if (!isEmailAllowed(email)) {
      container.innerHTML = `
        <div class="login-wrapper">
          <div class="login-card glass-panel text-center">
            <div style="font-size: 2.2rem; margin-bottom: 12px;">🔒</div>
            <h2 style="font-family: var(--font-heading); margin-bottom: 8px; color: #f59e0b;">Access Restricted</h2>
            <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; margin-bottom: 16px;">
              The Google account <strong>${email}</strong> is not listed on the household allowlist for <code>andinu.cc</code>.
            </p>
            <p style="color: var(--text-dim); font-size: 0.8rem; margin-bottom: 24px;">
              Please ask Andi to add your email address in the Household Settings or switch to an authorized Google account.
            </p>
            <button id="btn-callback-signout" class="btn-secondary" style="padding: 10px 20px;">
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      `;
      document.getElementById('btn-callback-signout')?.addEventListener('click', () => {
        signOut();
      });
      return;
    }

    // Attempt to link or verify household
    try {
      await supabase.rpc('get_or_create_initial_household');
    } catch (_) {}

    // Redirect to home dashboard
    navigate('/');
  }
}

