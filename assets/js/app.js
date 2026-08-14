import { boot, motionReduced } from './core/motion.js';
import initDouceurs from './modules/douceurs.js';

document.addEventListener('DOMContentLoaded', initDouceurs);

/* Si reduced-motion : retirer le loader immédiatement */
if (motionReduced) {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('[data-site-loader]')?.remove();
  });
}

boot({ base: 550, step: 350, loaderMin: 1250 });
