import { getCurrentUser, isEmailAllowed, waitForAuthReady } from './services/supabase.js';
import { renderBottomDock, setupNavEvents } from './components/navigation.js';
import { mountLogin } from './views/login.js';
import { mountAuthCallback } from './views/auth-callback.js';
import { mountDashboard } from './views/dashboard.js';
import { mountRoutine, unmountRoutine } from './views/routine.js';
import { mountMeals } from './views/meals.js';
import { mountLists } from './views/lists.js';

export function applyRouteTheme(path) {
  document.body.classList.remove('theme-hub', 'theme-routine', 'theme-meals', 'theme-lists');
  
  if (path === '/routine') {
    document.body.classList.add('theme-routine');
  } else if (path === '/meals') {
    document.body.classList.add('theme-meals');
  } else if (path === '/lists') {
    document.body.classList.add('theme-lists');
  } else {
    document.body.classList.add('theme-hub');
  }
}

class AppRouter {
  constructor() {
    this.currentPath = window.location.pathname;
    this.currentViewCleanup = null;
    this.appEl = document.getElementById('app');

    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });
  }

  navigate(path) {
    if (this.currentPath === path && path !== '/routine') return;
    window.history.pushState({}, '', path);
    this.handleRoute(path);
  }

  async handleRoute(path) {
    this.currentPath = path;

    // Apply scoped theme to body immediately
    applyRouteTheme(path);

    // Cleanup previous view if needed
    if (this.currentViewCleanup) {
      try { this.currentViewCleanup(); } catch (_) {}
      this.currentViewCleanup = null;
    }

    // Public routes (skip auth check)
    if (path === '/login') {
      this.appEl.innerHTML = '';
      mountLogin(this.appEl, (p) => this.navigate(p));
      return;
    }

    if (path === '/auth/callback' || path.startsWith('/auth/callback')) {
      this.appEl.innerHTML = '';
      mountAuthCallback(this.appEl, (p) => this.navigate(p));
      return;
    }

    // Non-destructive auth check: Wait for cookies and storage hydration
    await waitForAuthReady();

    const user = await getCurrentUser();
    if (!user) {
      // User is not authenticated; redirect to login
      this.navigate('/login');
      return;
    }

    // Check email allowlist
    if (!isEmailAllowed(user.email)) {
      alert(`The Google account ${user.email} is not authorized for this private household.`);
      this.navigate('/login');
      return;
    }

    // Route matching for protected views
    this.appEl.innerHTML = '';

    // Main Content Container
    const viewContainer = document.createElement('main');
    viewContainer.className = 'app-view-container';
    viewContainer.id = 'app-view-container';
    this.appEl.appendChild(viewContainer);

    // Persistent Adaptive Navigation Dock
    const dock = renderBottomDock(path);
    this.appEl.appendChild(dock);
    setupNavEvents((p) => this.navigate(p));

    if (path === '/' || path === '') {
      mountDashboard(viewContainer, (p) => this.navigate(p));
    } else if (path === '/routine') {
      mountRoutine(viewContainer);
      this.currentViewCleanup = () => unmountRoutine();
    } else if (path === '/meals') {
      mountMeals(viewContainer, (p) => this.navigate(p));
    } else if (path === '/lists') {
      mountLists(viewContainer, (p) => this.navigate(p));
    } else {
      // Fallback redirect to /
      this.navigate('/');
    }

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  init() {
    this.handleRoute(window.location.pathname);
  }
}

export const router = new AppRouter();
