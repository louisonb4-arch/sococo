/* SO COCO — motion runtime (vanilla, zéro dépendance) */

export const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const inViewport = (el) => {
  const r = el.getBoundingClientRect();
  return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0;
};

/* Attribue un --module-delay croissant aux seuls blocs visibles au chargement */
export const moduleDelays = (increment = 350, base = 550, target = document.body) => {
  const els = [...target.querySelectorAll('[data-module-delay]')];
  const visibility = els.map(inViewport);          // lectures en batch
  let delay = base;
  els.forEach((el, i) => {                         // écritures en batch
    const visible = visibility[i];
    el.setAttribute('data-module-delay', visible);
    if (!visible) return;
    el.style.setProperty('--module-delay', `${delay}ms`);
    delay += increment;
  });
};

/* Masque par mot — le mot est le masque, son contenu monte */
export const splitWords = (el) => {
  if (el.dataset.splitDone) return;
  // Parcours des nœuds pour préserver l'italique (<i>) mot à mot
  const parts = [];
  el.childNodes.forEach((n) => {
    const italic = n.nodeType === 1 && n.tagName === 'I';
    (n.textContent || '').split(/\s+/).filter(Boolean).forEach((w) => parts.push({ w, italic }));
  });
  const text = parts.map((p) => p.w).join(' ');
  el.setAttribute('aria-label', text);
  el.innerHTML = parts.map((p, i) =>
    `<span class="word${p.italic ? ' word--i' : ''}" aria-hidden="true" style="--word-index:${i}">` +
    `<span class="word__inner">${p.w}</span></span>`
  ).join(' ');
  el.style.setProperty('--word-total', parts.length);
  el.dataset.splitDone = 'true';
};

/* Un seul observer pour tout le site.
   [data-reveal-parent] : on observe le parent (un enfant clippé à 100 %
   ne déclenche jamais l'IO) et on allume ses enfants [data-reveal]. */
let observer = null;

export const observe = (root = document) => {
  if (motionReduced) return;

  observer ||= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const t = entry.target;
      if (t.hasAttribute('data-reveal-parent')) {
        t.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-inview'));
      } else {
        t.classList.add('is-inview');
      }
      observer.unobserve(t);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

  root.querySelectorAll('[data-reveal], [data-split], [data-reveal-parent]').forEach((el) => {
    if (el.closest('[data-reveal-parent]') && el.hasAttribute('data-reveal')) return; // géré par le parent
    observer.observe(el);
  });
};

/* Séquence d'ouverture.
   loaderMin : temps d'affichage minimum du loader — sur un serveur rapide,
   `load` tombe immédiatement et l'ouverture paraîtrait expédiée. */
export const boot = ({ base = 550, step = 350, loader = '[data-site-loader]', loaderMin = 1600 } = {}) => {
  const t0 = performance.now();
  document.querySelectorAll('[data-split]').forEach(splitWords);

  const run = () => {
    moduleDelays(step, base);
    if (!motionReduced) document.documentElement.classList.add('--js-inview-enabled');

    document.querySelectorAll(
      '[data-module-delay="true"][data-reveal],' +
      '[data-module-delay="true"] [data-reveal],' +
      '[data-module-delay="true"] [data-split]'
    ).forEach((el) => el.classList.add('is-inview'));

    observe();

    const el = document.querySelector(loader);
    if (!el) return;
    el.classList.add('--js-ready');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.isConnected && el.remove(), 1200); // filet de sécurité
  };

  const onReady = () => {
    if (motionReduced) return run();
    const wait = Math.max(0, loaderMin - (performance.now() - t0));
    setTimeout(run, wait);
  };

  if (document.readyState === 'complete') onReady();
  else window.addEventListener('load', onReady, { once: true });
};
