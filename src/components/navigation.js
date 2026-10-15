import { getCurrentUser, signOut } from '../services/supabase.js';

export function renderBottomDock(activePath = '/') {
  const dock = document.createElement('nav');
  dock.className = 'app-bottom-dock';
  dock.id = 'app-bottom-dock';

  const items = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/routine', label: 'Routine', icon: '🌙' },
    { path: '/meals', label: 'Meals', icon: '🍳' },
    { path: '/lists', label: 'Lists', icon: '📝' }
  ];

  dock.innerHTML = `
    <div class="dock-container">
      ${items.map(item => {
        const isActive = activePath === item.path;
        return `
          <a href="${item.path}" class="dock-item ${isActive ? 'active' : ''}" data-nav="${item.path}">
            <span class="dock-icon">${item.icon}</span>
            <span class="dock-label">${item.label}</span>
            ${isActive ? '<span class="dock-active-pill"></span>' : ''}
          </a>
        `;
      }).join('')}
    </div>
  `;

  return dock;
}

export function renderTopNav(activePath = '/', title = 'AndiNú') {
  const header = document.createElement('header');
  header.className = 'app-top-nav';
  header.id = 'app-top-nav';

  header.innerHTML = `
    <div class="nav-content">
      <a href="/" class="nav-brand" data-nav="/">
        <div class="nav-brand-icon">
          <img src="/AndiNu_icon.png" alt="AndiNú" class="nav-brand-img" />
        </div>
        <div class="nav-brand-text">
          <span class="nav-title">${title}</span>
          <span class="nav-domain">andinu.cc</span>
        </div>
      </a>

      <div class="nav-actions">
        <a href="/" class="nav-link ${activePath === '/' ? 'active' : ''}" data-nav="/">Hub</a>
        <a href="/routine" class="nav-link ${activePath === '/routine' ? 'active' : ''}" data-nav="/routine">Routine</a>
        <a href="/meals" class="nav-link ${activePath === '/meals' ? 'active' : ''}" data-nav="/meals">Meals</a>
        <a href="/lists" class="nav-link ${activePath === '/lists' ? 'active' : ''}" data-nav="/lists">Lists</a>
        
        <button id="nav-btn-user" class="nav-user-pill" title="Account settings">
          <span class="user-avatar">✨</span>
          <span id="nav-user-email" class="user-email-label">Account</span>
        </button>
      </div>
    </div>
  `;

  return header;
}

export async function setupNavEvents(navigate) {
  // Bind all data-nav links
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = el.getAttribute('data-nav');
      if (path) navigate(path);
    });
  });

  // User pill dropdown / sign out
  const userBtn = document.getElementById('nav-btn-user');
  const userLabel = document.getElementById('nav-user-email');
  const user = await getCurrentUser();
  if (user && userLabel) {
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Andi';
    userLabel.textContent = displayName;
  }

  userBtn?.addEventListener('click', () => {
    if (confirm('Do you want to sign out?')) {
      signOut();
    }
  });
}

