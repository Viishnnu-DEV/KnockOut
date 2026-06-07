import { useEffect, useState, useRef } from 'react';

let preloaderHasRun = false;

export default function Preloader({ onComplete, isDark }) {
  const [runLoading, setRunLoading] = useState(() => !preloaderHasRun);
  const [percentage, setPercentage] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef(null);

  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (preloaderHasRun) {
      onCompleteRef.current?.();
      return;
    }

    preloaderHasRun = true;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Handle accessibility - skip preloader if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.style.overflow = '';
      onCompleteRef.current?.();
      setTimeout(() => {
        setRunLoading(false);
      }, 0);
      return;
    }

    const duration = 1600; // faster duration for better mobile UX
    const startTime = performance.now();
    let frameId;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: eased = 1 - Math.pow(1 - progress, 3)
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentPct = Math.floor(eased * 100);
      
      setPercentage(currentPct);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        // Trigger exit wipe animation
        setIsExiting(true);
        // Wipe duration is 0.8s (800ms)
        const timeoutId = setTimeout(() => {
          document.body.style.overflow = '';
          onCompleteRef.current?.();
          setRunLoading(false);
        }, 800);
        return () => clearTimeout(timeoutId);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  if (!runLoading) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`preloader-overlay ${isExiting ? 'preloader-exit' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: isDark ? '#050508' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDark ? '#ffffff' : '#10164f',
        clipPath: isExiting ? undefined : 'circle(150% at 50% 50%)',
      }}
    >
      {/* Radial glow for aesthetics */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark ? 'radial-gradient(circle at 50% 50%, rgba(0, 255, 135, 0.05) 0%, transparent 60%)' : 'radial-gradient(circle at 50% 50%, rgba(16, 22, 79, 0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div className="flex flex-col items-center gap-8 z-10 w-full max-w-md px-6">
        {/* Simple single loader */}
        <div className="flex items-baseline gap-1 select-none z-10">
          <span
            style={{
              fontFamily: '"FWC26", sans-serif',
              fontSize: 'clamp(4.5rem, 15vw, 8rem)',
              lineHeight: 1,
              color: isDark ? '#ffffff' : '#10164f',
            }}
          >
            {percentage}
          </span>
          <span
            style={{
              fontFamily: '"FWC26", sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(16, 22, 79, 0.3)',
            }}
          >
            %
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: '"Noto Sans", sans-serif',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(16, 22, 79, 0.4)',
            marginTop: '8px',
          }}
        >
          FIFA WORLD CUP 2026 IST
        </div>
      </div>
    </div>
  );
}

