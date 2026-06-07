// ============================================================
// useHeadroom.js — Sticky header with headroom hide/show behavior
// Adds CSS classes: is-top, is-not-top, is-pinned, is-unpinned
// ============================================================
import { useEffect, useRef } from 'react';

export function useHeadroom(headerRef, isDark = false) {
  const lastScrollY = useRef(0);

  useEffect(() => {
    const header = headerRef?.current;
    if (!header) return;

    // Add the base header class
    header.classList.add('header');

    const handleScroll = () => {
      const currentY = window.scrollY;

      // Top detection
      if (currentY <= 5) {
        header.classList.add('is-top');
        header.classList.remove('is-not-top');
      } else {
        header.classList.remove('is-top');
        header.classList.add('is-not-top');
      }

      // Light theme modifier
      if (!isDark) {
        header.classList.add('light-theme');
      } else {
        header.classList.remove('light-theme');
      }

      // Pin/unpin detection
      if (currentY > 80) {
        if (currentY > lastScrollY.current + 5) {
          // Scrolling down
          header.classList.add('is-unpinned');
          header.classList.remove('is-pinned');
        } else if (currentY < lastScrollY.current - 5) {
          // Scrolling up
          header.classList.remove('is-unpinned');
          header.classList.add('is-pinned');
        }
      } else {
        header.classList.remove('is-unpinned');
        header.classList.add('is-pinned');
      }

      lastScrollY.current = currentY;
    };

    // Initial state
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headerRef, isDark]);
}
