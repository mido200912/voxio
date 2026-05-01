import { useEffect, useRef } from 'react';

export const useScrollReveal = (options = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            const children = entry.target.querySelectorAll('[data-reveal-delay]');
            children.forEach((child) => {
              const delay = child.getAttribute('data-reveal-delay');
              child.style.transitionDelay = `${delay}ms`;
              child.classList.add('revealed');
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options.threshold || 0.12,
        rootMargin: options.rootMargin || '0px 0px -60px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
};
