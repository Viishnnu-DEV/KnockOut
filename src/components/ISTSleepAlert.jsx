import { useState, useEffect } from 'react';
import { Bell, CaretDown, CaretUp, CheckCircle } from '@phosphor-icons/react';
function isNightOwlMatch(match) {
  if (!match || !match.timeIST) return false;
  const hour = parseInt(match.timeIST.split(':')[0], 10);
  return hour >= 0 && hour <= 5; // Midnight to 5 AM IST
}

export default function ISTSleepAlert({ 
  matches, 
  isDark, 
  isFavoriteTeam, 
  onTeamClick,
  isReminderSet,
  onToggleReminder
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const nightOwlMatches = matches.filter(isNightOwlMatch);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleSetAlarm = async (match, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleReminder) {
      const added = await onToggleReminder(match);
      if (added) {
        triggerToast('⏰ Alarm set! We\'ll notify you 15 min before kickoff.');
      }
    }
  };

  if (nightOwlMatches.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mb-8 px-4 relative z-20">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 rounded-2xl flex items-center justify-between border theme-transition select-none text-left cursor-pointer"
        style={{
          background: isDark ? 'rgba(26, 10, 46, 0.45)' : 'rgba(240, 230, 255, 0.5)',
          borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.25)',
          boxShadow: isDark ? '0 8px 32px rgba(139, 92, 246, 0.05)' : '0 8px 32px rgba(139, 92, 246, 0.02)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none" role="img" aria-label="owl">🦉</span>
          <div>
            <h4
              className="text-sm font-bold uppercase tracking-wider"
              style={{
                fontFamily: '"FWC26", sans-serif',
                color: isDark ? '#c084fc' : '#6d28d9',
              }}
            >
              Night Owl Matches ({nightOwlMatches.length} matches between midnight–5 AM IST)
            </h4>
            <p className="text-[11px] opacity-75 mt-0.5" style={{ color: isDark ? '#a78bfa' : '#4c1d95' }}>
              Don't miss these late-night thrillers! Set alarms to stay awake.
            </p>
          </div>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center border theme-transition"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(139, 92, 246, 0.1)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(139, 92, 246, 0.2)',
            color: isDark ? '#ffffff' : '#6d28d9',
          }}
        >
          {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
        </div>
      </button>

      {/* Grid view */}
      {isExpanded && (
        <div
          className="mt-3 p-6 rounded-3xl border theme-transition animate-slideup-modal"
          style={{
            background: isDark ? 'rgba(26, 10, 46, 0.85)' : '#fdfbfe',
            borderColor: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.15)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nightOwlMatches.map((match) => {
              const isFavA = isFavoriteTeam?.(match.teamA);
              const isFavB = isFavoriteTeam?.(match.teamB);
              const hasFav = isFavA || isFavB;

              return (
                <div
                  key={match.id}
                  className="p-5 rounded-2xl border flex flex-col justify-between relative overflow-hidden group theme-transition"
                  style={{
                    background: isDark ? 'rgba(15, 10, 30, 0.95)' : '#ffffff',
                    borderColor: hasFav ? '#10b981' : (isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'),
                    boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.2)' : '0 8px 20px rgba(139, 92, 246, 0.03)',
                  }}
                >
                  {/* Glowing border effect */}
                  <div className="absolute inset-0 border border-purple-500/0 group-hover:border-purple-500/40 rounded-2xl pointer-events-none transition-colors duration-300" />
                  
                  {/* Badges */}
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border"
                      style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderColor: 'rgba(139, 92, 246, 0.3)',
                        color: '#a78bfa',
                      }}
                    >
                      {match.group || match.round || 'Group Stage'}
                    </span>
                    <span className="text-[10px] font-bold text-red-400 animate-pulse">
                      🦉 Night Owl
                    </span>
                  </div>

                  {/* Teams */}
                  <div className="flex justify-between items-center my-2.5">
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onTeamClick?.(match.teamA)}
                    >
                      {match.teamA_flag && (
                        <img src={match.teamA_flag} alt={match.teamA} className="w-6 h-4 object-cover rounded shadow-sm" />
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: '"FWC26", sans-serif' }}>
                        {match.teamA}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-40 font-bold">VS</span>
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onTeamClick?.(match.teamB)}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: '"FWC26", sans-serif' }}>
                        {match.teamB}
                      </span>
                      {match.teamB_flag && (
                        <img src={match.teamB_flag} alt={match.teamB} className="w-6 h-4 object-cover rounded shadow-sm" />
                      )}
                    </div>
                  </div>

                  {/* Kickoff */}
                  <div className="mt-3 pt-3 border-t border-purple-500/10 flex justify-between items-center">
                    <div className="text-left">
                      <p className="text-[10px] opacity-55">{match.displayDate}</p>
                      <p className="text-sm font-bold text-purple-400" style={{ fontFamily: '"FWC26", sans-serif' }}>
                        {match.displayTime || match.timeIST} IST
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleSetAlarm(match, e)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer ${
                        isReminderSet?.(match.id)
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                          : 'bg-purple-600 text-white hover:bg-purple-500 border border-purple-400/30'
                      }`}
                      style={{ fontFamily: '"FWC26", sans-serif' }}
                    >
                      <Bell size={12} weight={isReminderSet?.(match.id) ? "fill" : "regular"} />
                      <span>{isReminderSet?.(match.id) ? 'Alarm Set' : 'Alarm'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {showToast && (
        <div
          className="fixed bottom-16 right-4 z-[9999] px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xl border animate-slideup-modal"
          style={{
            background: isDark ? 'rgba(15, 10, 30, 0.98)' : '#ffffff',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            color: isDark ? '#ffffff' : '#10164f',
          }}
        >
          <CheckCircle size={20} className="text-emerald-500" weight="fill" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
