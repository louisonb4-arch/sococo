/* Viewer sticky des douceurs — desktop uniquement.
   L'item lu au centre de l'écran affiche son panneau photo. */

export default function initDouceurs() {
  const mq = matchMedia('(min-width: 900px)');
  const items = [...document.querySelectorAll('.douceurs__item[data-photo]')];
  const figs = [...document.querySelectorAll('.douceurs__stack .douceurs__photo')];
  if (!items.length || !figs.length) return;

  const show = (name) => figs.forEach((f) =>
    f.classList.toggle('is-current', f.dataset.view === name)
  );
  show(items[0].dataset.photo);

  const io = new IntersectionObserver((entries) => {
    if (!mq.matches) return;
    entries.forEach((e) => {
      if (e.isIntersecting) show(e.target.dataset.photo);
    });
  }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });

  items.forEach((el) => io.observe(el));
}
