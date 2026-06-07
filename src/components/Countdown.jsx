// ============================================================
// Countdown.jsx — Premium flip-clock countdown to tournament
// opening match or next upcoming match. Uses GSAP for digit-flip.
// ============================================================
import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { TOURNAMENT_START } from '../matchData';

/** Compute time remaining until target date */
function getTimeLeft(target) {
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/** Individual flip digit block */
function FlipUnit({ value, label, isDark }) {
  const displayVal = String(value).padStart(2, '0');

  // Dynamic colors matching Sand & Cyprus themes
  const unitBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.06)';
  const unitBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(16, 22, 79, 0.15)';
  const dividerBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.1)';
  const digitColor = isDark ? '#ffffff' : '#10164f';
  const shadowColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(16, 22, 79, 0.12)';
  const labelColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(16, 22, 79, 0.5)';

  return (
    <div className="flex flex-col items-center">
      {/* Digit container */}
      <div
        className="relative overflow-hidden rounded-xl theme-transition"
        style={{
          background: unitBg,
          border: `1px solid ${unitBorder}`,
          backdropFilter: 'blur(10px)',
          minWidth: '72px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Center divider line */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: '50%',
            height: '1px',
            background: dividerBg,
          }}
        />
        <div
          className="text-center select-none theme-transition"
          style={{
            fontFamily: '"FWC26", sans-serif',
            fontSize: '48px',
            lineHeight: 1,
            color: digitColor,
            textShadow: `0 0 20px ${shadowColor}`,
          }}
        >
          <span className="timer-digit inline-block">{displayVal}</span>
        </div>
      </div>
      {/* Label */}
      <span
        className="mt-2 text-xs uppercase tracking-[0.2em] theme-transition"
        style={{
          fontFamily: '"Noto Sans", sans-serif',
          color: labelColor,
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** Separator colon between digit groups */
function Colon({ isDark }) {
  const dotColor = isDark ? '#ffffff' : '#10164f';
  const shadowColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(16, 22, 79, 0.2)';
  return (
    <div
      className="px-1 theme-transition"
      style={{
        height: '72px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        className="w-1.5 h-1.5 rounded-full theme-transition" 
        style={{ 
          background: dotColor, 
          opacity: 0.6,
          boxShadow: `0 0 8px ${shadowColor}` 
        }} 
      />
      <div 
        className="w-1.5 h-1.5 rounded-full theme-transition" 
        style={{ 
          background: dotColor, 
          opacity: 0.6,
          boxShadow: `0 0 8px ${shadowColor}` 
        }} 
      />
    </div>
  );
}

// ----------------------------------------------------------------
//  Countdown component
// ----------------------------------------------------------------
export default function Countdown({ isDark, nextMatch }) {
  const getTargetDate = (match) => {
    if (match) {
      return match.utcTimestamp ? new Date(match.utcTimestamp) : new Date(match.local_date);
    }
    return TOURNAMENT_START;
  };

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(getTargetDate(nextMatch)));

  useEffect(() => {
    const target = getTargetDate(nextMatch);
    setTimeout(() => {
      setTimeLeft(getTimeLeft(target));
    }, 0);
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(timer);
  }, [nextMatch]);

  // Effect 6 digit flip animation
  useEffect(() => {
    const interval = setInterval(() => {
      document.querySelectorAll('.timer-digit').forEach(el => {
        const current = el.textContent;
        const prev = el.dataset.prev || '';
        if (current !== prev) {
          el.dataset.prev = current;
          gsap.fromTo(el,
            { y: -8, opacity: 0.3 },
            { y: 0, opacity: 1, duration: 0.35,
              ease: 'cubic-bezier(0.4,0,0.2,1)' }
          );
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      {nextMatch ? (
        <div 
          className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border theme-transition"
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.04)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(16, 22, 79, 0.15)',
            color: '#fcb900',
            fontFamily: '"FWC26", sans-serif',
            letterSpacing: '0.08em',
          }}
        >
          {nextMatch.teamA} vs {nextMatch.teamB} • {nextMatch.stadium} • {nextMatch.displayTime} IST
        </div>
      ) : (
        <div 
          className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border theme-transition"
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.04)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(16, 22, 79, 0.15)',
            color: '#fcb900',
            fontFamily: '"FWC26", sans-serif',
            letterSpacing: '0.08em',
          }}
        >
          Tournament Opening Match Countdown
        </div>
      )}
      <div className="flex items-start gap-2 sm:gap-3 justify-center">
        <FlipUnit value={timeLeft.days} label="Days" isDark={isDark} />
        <Colon isDark={isDark} />
        <FlipUnit value={timeLeft.hours} label="Hours" isDark={isDark} />
        <Colon isDark={isDark} />
        <FlipUnit value={timeLeft.minutes} label="Mins" isDark={isDark} />
        <Colon isDark={isDark} />
        <FlipUnit value={timeLeft.seconds} label="Secs" isDark={isDark} />
      </div>
    </div>
  );
}
