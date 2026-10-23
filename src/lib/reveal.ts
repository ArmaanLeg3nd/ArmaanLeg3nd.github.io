import { animate } from 'motion/mini';

/** One reveal lifecycle for static pages and content mounted later by tools. */
export function installReveals(root: HTMLElement) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet<HTMLElement>();
  const pending = new Set<HTMLElement>();
  const animations = new Map<HTMLElement, ReturnType<typeof animate>>();
  let disposed = false;
  const visible = (target: HTMLElement) => {
    const animation = animations.get(target);
    animations.delete(target);
    animation?.stop();
    target.style.removeProperty('opacity');
    target.style.removeProperty('transform');
    target.dataset.revealState = 'visible';
    pending.delete(target);
    intersection.unobserve(target);
  };
  const intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const target = entry.target as HTMLElement;
      intersection.unobserve(target);
      if (preference.matches || document.hidden) { visible(target); continue; }
      target.dataset.revealState = 'entering';
      const animation = animate(target, { opacity: [0,1], transform: ['translateY(18px)','translateY(0px)'] }, {
        duration: .55, delay: Math.min(.16,Math.max(0,Number(target.dataset.revealDelay) || 0)), ease: [.22,1,.36,1]
      });
      animations.set(target,animation);
      animation.then(() => { if (!disposed && animations.get(target) === animation) visible(target); });
    }
  }, { threshold: 0, rootMargin: '0px 0px -16px' });
  const observe = (target: HTMLElement) => {
    if (seen.has(target)) return;
    seen.add(target);
    // Hidden documents, collapsed panels and reduced-motion users never get invisible content.
    if (preference.matches || document.hidden || !target.getClientRects().length || target.getBoundingClientRect().bottom <= 0 || target.contains(document.activeElement)) {
      target.dataset.revealState = 'visible';
      return;
    }
    target.style.opacity = '0';
    target.style.transform = 'translateY(18px)';
    target.dataset.revealState = 'pending';
    pending.add(target);
    intersection.observe(target);
  };
  const scan = (node: Node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.matches('[data-reveal]')) observe(node);
    node.querySelectorAll<HTMLElement>('[data-reveal]').forEach(observe);
  };
  const mutations = new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(scan);
    for (const target of pending) if (!target.isConnected) visible(target);
  });
  const flush = () => { for (const target of [...pending]) visible(target); };
  const onPreference = () => { if (preference.matches) flush(); };
  const onVisibility = () => { if (document.hidden) flush(); };
  const onFocus = (event: FocusEvent) => {
    let target = (event.target as HTMLElement).closest<HTMLElement>('[data-reveal]');
    while (target && root.contains(target)) { visible(target); target = target.parentElement?.closest<HTMLElement>('[data-reveal]') || null; }
  };
  scan(root);
  mutations.observe(root,{childList:true,subtree:true});
  preference.addEventListener('change',onPreference);
  document.addEventListener('visibilitychange',onVisibility);
  root.addEventListener('focusin',onFocus);
  return () => {
    disposed = true;
    mutations.disconnect();
    flush();
    intersection.disconnect();
    preference.removeEventListener('change',onPreference);
    document.removeEventListener('visibilitychange',onVisibility);
    root.removeEventListener('focusin',onFocus);
  };
}
