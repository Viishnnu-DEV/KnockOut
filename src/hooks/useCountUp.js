// ============================================================
// useCountUp.js — Animated count-up numbers on scroll into view
// Uses IntersectionObserver + requestAnimationFrame for smooth
// cubic-eased number animation
// ============================================================
import { useEffect, useRef } from 'react';

export function useCountUp(target, duration = 1500) {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        function step(now) {
          const p = Math.min((now - start) / duration, 1);
          // Cubic ease out: 1 - (1 - p)^3
          const eased = 1 - Math.pow(1 - p, 3);
          if (ref.current) {
            ref.current.textContent = Math.floor(eased * target);
          }
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      },
      { threshold: 0.3 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return ref;
}
