import './style.css';
import { router } from './router.js';

// Launch the AndiNú Unified Modular Monolith Router (exactly once)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => router.init(), { once: true });
} else {
  router.init();
}
