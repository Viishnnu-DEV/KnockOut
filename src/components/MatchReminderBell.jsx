import { useState, useEffect, useCallback } from 'react';
import {
  hasReminder, scheduleOneReminder, cancelReminder
} from '../utils/reminderScheduler';

export default function MatchReminderBell({ match, teamA, teamB, isDark = true }) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justSet, setJustSet] = useState(false);

  const matchTime = new Date(match.local_date || match.datetime);
  const now = new Date();
  const isPast = matchTime <= now;
  const isFinished = match.finished;

  // Load state on mount
  useEffect(() => {
    setActive(hasReminder(String(match.id)));
  }, [match.id]);

  const toggle = useCallback(async (e) => {
    e.stopPropagation(); // Don't trigger card click

    if (isPast || isFinished || loading) return;

    // Ask permission first if not granted
    if (!active && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }

    setLoading(true);

    try {
      const homeTeam = teamA?.name || match.home_team?.name || 'Team A';
      const awayTeam = teamB?.name || match.away_team?.name || 'Team B';
      const homeFlag = teamA?.flag || match.home_team?.flag || '🏳';
      const awayFlag = teamB?.flag || match.away_team?.flag || '🏳';

      const istTime = matchTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
      const alertTime = new Date(matchTime.getTime() - 15 * 60 * 1000);

      if (!active) {
        await scheduleOneReminder({
          matchId: String(match.id),
          homeTeam, awayTeam,
          homeFlag, awayFlag,
          istTime,
          alertTime,
          matchTime: matchTime.toISOString(),
        });
        setActive(true);
        setJustSet(true);
        setTimeout(() => setJustSet(false), 2000);
      } else {
        cancelReminder(String(match.id));
        setActive(false);
      }
    } finally {
      setLoading(false);
    }
  }, [active, loading, match, teamA, teamB, matchTime, isPast, isFinished]);

  // Don't show for past/finished matches
  if (isPast || isFinished) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={toggle}
        disabled={loading}
        title={active ? 'Cancel reminder' : 'Set reminder — 15 min before kickoff'}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          background: active
            ? 'rgba(0,255,135,0.12)'
            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,22,79,0.06)'),
          border: `1px solid ${active
            ? 'rgba(0,255,135,0.35)'
            : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(16,22,79,0.15)')}`,
          borderRadius: 20, cursor: isPast ? 'default' : 'pointer',
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          fontFamily: 'DM Sans, sans-serif',
          transform: justSet ? 'scale(1.1)' : 'scale(1)',
        }}
        aria-label={active ? 'Remove match reminder' : 'Set match reminder'}
      >
        {/* Bell icon */}
        <span style={{
          fontSize: 14,
          filter: active ? 'none' : 'grayscale(0.5)',
          animation: justSet ? 'bellBounce 0.4s ease' : 'none',
          display: 'inline-block',
        }}>
          {loading ? '⏳' : active ? '🔔' : '🔕'}
        </span>
        {/* Label */}
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: active ? (isDark ? '#00FF87' : '#047857') : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(16,22,79,0.55)'),
        }}>
          {justSet ? 'Reminder set!' : active ? 'Reminder on' : 'Remind me'}
        </span>
      </button>

      {/* "Set!" micro toast */}
      {justSet && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)',
          left: '50%', transform: 'translateX(-50%)',
          background: '#00FF87', color: '#050508',
          fontSize: 11, fontWeight: 600, padding: '4px 10px',
          borderRadius: 20, whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,255,135,0.4)',
          animation: 'toastUp 0.3s ease',
          pointerEvents: 'none',
        }}>
          ✅ 15 min reminder set!
        </div>
      )}

      <style>{`
        @keyframes bellBounce {
          0%  { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-20deg) scale(1.2); }
          50% { transform: rotate(20deg) scale(1.2); }
          75% { transform: rotate(-10deg) scale(1.1); }
          100%{ transform: rotate(0deg) scale(1); }
        }
        @keyframes toastUp {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
