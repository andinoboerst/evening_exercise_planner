import './style.css';
import { router } from './router.js';

// Launch the AndiNú Unified Modular Monolith Router
document.addEventListener('DOMContentLoaded', () => {
  router.init();
});

// Also trigger immediately in case DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  router.init();
}
