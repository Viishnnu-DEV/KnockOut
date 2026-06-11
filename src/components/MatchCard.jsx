// ============================================================
// MatchCard.jsx — Premium match card with symmetric alignment,
// 3D flip, status badges, favorites, and Phosphor icons.
// ============================================================
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { Star, MapPin, CalendarPlus, Bell, Flag, ThumbsUp, Moon, SunHorizon, Sun, CheckCircle, ShareNetwork, CaretRight, X } from '@phosphor-icons/react';
import { getMatchStatus, getStadiumInfo, to12Hour, formatDateLabel } from '../matchData';
import { convertToTimezone, isMatchToday } from '../utils/timeConverter';
import { useTimezone } from '../hooks/useTimezone';
import { FanPoll } from './FanPoll';
import MatchReminderBell from './MatchReminderBell';

// ----------------------------------------------------------------
//  Status badge component
// ----------------------------------------------------------------
function StatusBadge({ status, isDark }) {
  // Map string to object if needed
  let s = status;
  if (typeof status === 'string') {
    if (status === 'DONE' || status === 'FT') {
      s = { label: 'FT', color: '#555' };
    } else if (status === 'LIVE') {
      s = { label: 'LIVE', color: '#ff3333', pulse: true };
    } else if (status === 'TODAY') {
      s = { label: 'TODAY', color: '#FFD700' };
    } else {
      s = { label: 'UPCOMING', color: isDark ? '#F0EDE5' : '#004643' };
    }
  }

  const getBadgeStyle = () => {
    if (s.label === 'LIVE') {
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        text: '#ff3333'
      };
    }
    if (s.label === 'TODAY') {
      return {
        bg: 'rgba(252, 185, 0, 0.15)',
        border: 'rgba(252, 185, 0, 0.4)',
        text: '#fcb900'
      };
    }
    if (s.label === 'UPCOMING') {
      return isDark ? {
        bg: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.25)',
        text: '#ffffff'
      } : {
        bg: 'rgba(16, 22, 79, 0.06)',
        border: 'rgba(16, 22, 79, 0.25)',
        text: '#10164f'
      };
    }
    // FT / DONE
    return isDark ? {
      bg: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(255, 255, 255, 0.15)',
      text: 'rgba(255, 255, 255, 0.4)'
    } : {
      bg: 'rgba(16, 22, 79, 0.04)',
      border: 'rgba(16, 22, 79, 0.15)',
      text: 'rgba(16, 22, 79, 0.4)'
    };
  };

  const colors = getBadgeStyle();

  return (
    <span
      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider z-10 theme-transition"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontFamily: '"FWC26", sans-serif',
      }}
    >
      {s.pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#ff3333]"
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2 bg-[#ff3333]"
          />
        </span>
      )}
      {s.label}
    </span>
  );
}

// ----------------------------------------------------------------
//  Team display (flag image + name) — Centered and wrap-friendly
// ----------------------------------------------------------------
function TeamSide({ team, flagUrl, isFav, onToggleFav }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center w-full">
      <div className="w-12 h-8 rounded overflow-hidden shadow-sm border border-black/10 bg-white/15 flex items-center justify-center team-flag">
        {flagUrl ? (
          <img
            src={flagUrl}
            alt={team}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Flag size={20} className="opacity-40" />
        )}
      </div>
      <div
        className="text-xs sm:text-sm font-bold uppercase tracking-wider max-w-[100px] sm:max-w-[120px] flex items-center justify-center gap-1.5"
        style={{ fontFamily: '"FWC26", sans-serif', minHeight: '2.5rem' }}
      >
        <span className="line-clamp-2 leading-tight">{team}</span>
        {onToggleFav && team !== 'TBD' && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(e); }}
            className="hover:scale-125 transition-transform flex-shrink-0 cursor-pointer"
            title={`Favorite ${team}`}
          >
            <Star 
              size={13} 
              weight={isFav ? "fill" : "regular"} 
              className={`theme-transition ${isFav ? "text-[#fcb900]" : "opacity-30 hover:opacity-90"}`} 
            />
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
//  VS divider with animated pulse dot
// ----------------------------------------------------------------
function VsDivider({ isDark }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 self-start pt-3">
      <div className="relative">
        <span
          className="text-xl font-black theme-transition"
          style={{ 
            fontFamily: '"FWC26", sans-serif', 
            letterSpacing: '0.1em',
            color: isDark ? 'rgba(240, 237, 229, 0.3)' : 'rgba(0, 70, 67, 0.3)'
          }}
        >
          VS
        </span>
        {/* Pulsing dot */}
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <span className="flex h-1.5 w-1.5">
            <span className="animate-ping absolute h-full w-full rounded-full bg-[#D1A751] opacity-50" />
            <span className="relative rounded-full h-1.5 w-1.5 bg-[#D1A751]" />
          </span>
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
//  Helpers for Sleep Impact and Prime Time
// ----------------------------------------------------------------
function getSleepImpact(timeStr) {
  const [hour] = timeStr.split(':').map(Number);
  if (hour >= 0 && hour < 4) {
    return { icon: Moon, label: 'All-nighter', color: '#ef4444' };
  } else if (hour >= 4 && hour < 7) {
    return { icon: SunHorizon, label: 'Early riser', color: '#ff6900' };
  } else if (hour >= 7 && hour < 12) {
    return { icon: Sun, label: 'Worth it', color: '#fcb900' };
  } else {
    return { icon: CheckCircle, label: 'Perfect timing', color: '#10b981' };
  }
}

function isGreatForIndia(timeStr) {
  const [hour] = timeStr.split(':').map(Number);
  // Evening: 6 PM – 10 PM IST (18:00 to 22:00)
  return hour >= 18 && hour <= 22;
}

// ----------------------------------------------------------------
//  MatchCard component
// ----------------------------------------------------------------
export default function MatchCard({ 
  match, 
  isFavoriteTeam, 
  onToggleFavorite, 
  onTeamClick, 
  isDark, 
  showDate, 
  onShare,
  isReminderSet,
  onToggleReminder
}) {
  const cardRef = useRef(null);
  const [flipped, setFlipped] = useState(false);
  const { timezone, timezoneId } = useTimezone();
  const converted = convertToTimezone(match.utcDateString || match.local_date || match.datetime, timezoneId);
  const matchToday = isMatchToday(match.utcDateString || match.local_date || match.datetime, timezoneId);
  const status = match.apiStatus || getMatchStatus(match);
  const stadiumInfo = getStadiumInfo(match.stadium);

  const isFavA = isFavoriteTeam(match.teamA);
  const isFavB = isFavoriteTeam(match.teamB);
  const hasFav = isFavA || isFavB;

  // Theme-based variables (Stripped blur filters to prevent flip-blur glitches)
  const cardBg = isDark ? 'rgba(8, 11, 40, 0.95)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(16, 22, 79, 0.15)';
  const cardShadow = isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(16, 22, 79, 0.04)';
  const textColor = isDark ? '#ffffff' : '#10164f';
  const subTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(16, 22, 79, 0.6)';

  // GSAP hover handlers
  const handleEnter = () => {
    // pop-up animation removed
  };

  const handleLeave = () => {
    // pop-up animation removed
  };

  // Google Calendar link
  const calTitle = `${match.teamA} vs ${match.teamB} — FIFA World Cup 2026`;
  const [y, m, d] = match.dateIST.split('-');
  const [hh, mm] = match.timeIST.split(':');
  const startDT = `${y}${m}${d}T${hh}${mm}00`;
  const endH = String((parseInt(hh) + 2) % 24).padStart(2, '0');
  const endDT = `${y}${m}${d}T${endH}${mm}00`;
  const calURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calTitle)}&dates=${startDT}/${endDT}&details=${encodeURIComponent(`${match.stadium}, ${match.city}`)}&location=${encodeURIComponent(`${match.stadium}, ${match.city}`)}`;

  const handleRemind = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('[MatchCard] handleRemind clicked! Match:', match.id, 'onToggleReminder exists?', !!onToggleReminder);
    if (onToggleReminder) {
      try {
        const result = await onToggleReminder(match);
        console.log('[MatchCard] onToggleReminder returned:', result);
      } catch (err) {
        console.error('[MatchCard] onToggleReminder threw an error:', err);
      }
    } else {
      console.warn('[MatchCard] onToggleReminder is undefined!');
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`flip-card relative cursor-pointer ${flipped ? 'flipped' : ''}`}
      style={{ minHeight: '440px', perspective: '1200px' }}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flip-card-inner" style={{ minHeight: '440px' }}>
        {/* =================== FRONT =================== */}
        <div
          className="flip-card-front p-5 flex flex-col justify-between theme-transition animate-fadein"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: cardShadow,
            borderRadius: '1.5rem',
            color: textColor,
            ...(hasFav && {
              borderLeft: '5px solid #10b981',
              boxShadow: isDark
                ? '0 10px 30px rgba(16, 185, 129, 0.15), inset 1px 0 0 rgba(16, 185, 129, 0.2)'
                : '0 10px 30px rgba(16, 185, 129, 0.08), inset 1px 0 0 rgba(16, 185, 129, 0.15)',
            })
          }}
        >
          <StatusBadge status={status} isDark={isDark} />

          {/* Group / Round & Sleep Impact Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2 max-w-[calc(100%-85px)]">
            <span
              className="text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full theme-transition font-bold"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.06)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(16, 22, 79, 0.15)',
                color: isDark ? '#ffffff' : '#10164f',
                fontFamily: '"Noto Sans", sans-serif',
              }}
            >
              {match.group || match.round}
            </span>

            {/* Sleep Impact Badge */}
            {(() => {
              const sleep = getSleepImpact(match.timeIST);
              const SleepIcon = sleep.icon;
              return (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 theme-transition whitespace-nowrap"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.04)',
                    border: `1px solid ${sleep.color}40`,
                    color: sleep.color,
                    fontFamily: '"Noto Sans", sans-serif',
                  }}
                  title="Sleep Impact for Indian viewers"
                >
                  <SleepIcon size={11} className="flex-shrink-0" />
                  <span>{sleep.label}</span>
                </span>
              );
            })()}

            {/* Great for India Badge */}
            {isGreatForIndia(match.timeIST) && (
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 theme-transition"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  fontFamily: '"Noto Sans", sans-serif',
                }}
              >
                <ThumbsUp size={11} className="flex-shrink-0" />
                <span>Great for India</span>
              </span>
            )}
          </div>

          {/* Teams row — Grid centered layout for pixel-perfect alignment */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center w-full my-3">
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity w-full flex justify-center"
              onClick={(e) => { e.stopPropagation(); onTeamClick?.(match.teamA); }}
            >
              <TeamSide 
                team={match.teamA} 
                flagUrl={match.teamA_flag} 
                isFav={isFavA}
                onToggleFav={(e) => onToggleFavorite?.(match.teamA, e)}
              />
            </div>
            {match.home_score !== undefined && match.home_score !== null ? (
              <div 
                className="flex items-center gap-2 px-3 font-bold text-xl sm:text-2xl"
                style={{ fontFamily: '"FWC26", sans-serif', color: textColor }}
              >
                <span>{match.home_score}</span>
                <span className="text-xs opacity-40 font-normal">-</span>
                <span>{match.away_score}</span>
              </div>
            ) : (
              <VsDivider isDark={isDark} />
            )}
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity w-full flex justify-center"
              onClick={(e) => { e.stopPropagation(); onTeamClick?.(match.teamB); }}
            >
              <TeamSide 
                team={match.teamB} 
                flagUrl={match.teamB_flag} 
                isFav={isFavB}
                onToggleFav={(e) => onToggleFavorite?.(match.teamB, e)}
              />
            </div>
          </div>

          {/* Time & Venue */}
          <div className="mt-auto pt-3 flex flex-col gap-1.5">
            <div className="flex flex-col items-center justify-center">
              {showDate && (
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1 theme-transition"
                  style={{
                    fontFamily: '"Noto Sans", sans-serif',
                    color: '#fcb900',
                  }}
                >
                  {converted.valid ? converted.dayStr : formatDateLabel(match.dateIST)}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span
                  className="text-lg font-bold theme-transition"
                  style={{
                    fontFamily: '"FWC26", sans-serif',
                    color: isDark ? '#ffffff' : '#10164f',
                    textShadow: isDark ? '0 0 12px rgba(255, 255, 255, 0.15)' : '0 0 12px rgba(16, 22, 79, 0.15)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {converted.valid ? converted.timeStr : (match.displayTime || to12Hour(match.timeIST))}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded theme-transition"
                  style={{
                    color: subTextColor,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,22,79,0.06)',
                  }}
                >
                  {converted.tzAbbr || timezone.shortLabel}
                </span>
                {matchToday && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#fcb900]/15 text-[#fcb900] border border-[#fcb900]/30">
                    Today
                  </span>
                )}
              </div>
            </div>
            <div 
              className="flex items-center justify-center gap-1.5 text-[11px] theme-transition mt-1"
              style={{ color: subTextColor }}
            >
              <div className="flex items-center gap-1 hover:text-[#fcb900] transition-colors">
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate max-w-[200px]">{match.stadium} • {match.city}</span>
                <CaretRight size={12} className="opacity-70" />
              </div>
            </div>
            {/* Timezone badge */}
            <div className="flex justify-center">
              <span
                className="text-[9px] px-2 py-0.5 rounded-full theme-transition"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.05)',
                  color: subTextColor,
                  fontFamily: '"Noto Sans", sans-serif',
                }}
              >
                {timezone.flag} {timezone.label} ({timezone.offset})
              </span>
            </div>
            
            <div className="flex justify-center mt-2 z-50 relative">
              <MatchReminderBell
                match={match}
                teamA={{ name: match.teamA, flag: match.teamA_flag }}
                teamB={{ name: match.teamB, flag: match.teamB_flag }}
                isDark={isDark}
              />
            </div>
          </div>



          {/* Fan Poll Voting Embed */}
          {match.teamA !== 'TBD' && match.teamB !== 'TBD' && (
            <FanPoll
              matchId={match.id}
              teamA={match.teamA}
              teamB={match.teamB}
              flagA={match.teamA_flag}
              flagB={match.teamB_flag}
              isDark={isDark}
            />
          )}

          {/* Absolute Buttons on Front - Moved to end of DOM and increased touch area */}
          <div className="absolute bottom-[5.5rem] right-4 flex items-center gap-4 z-50">

            {/* Share button */}
            {match.teamA !== 'TBD' && (
              <button
                onClick={(e) => { e.stopPropagation(); onShare?.(match); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="share-icon-plain p-3 -m-3 hover:scale-125 transition-transform opacity-90 hover:opacity-100 cursor-pointer flex items-center justify-center"
                style={{ color: textColor }}
                title="Share Match Story"
              >
                <ShareNetwork size={20} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* =================== BACK =================== */}
        <div
          className="flip-card-back p-5 flex flex-col justify-center items-center gap-4 theme-transition relative"
          style={{
            background: isDark ? 'rgba(8, 11, 40, 0.98)' : '#fcfbf9',
            border: `1px solid ${cardBorder}`,
            boxShadow: cardShadow,
            borderRadius: '1.5rem',
            color: textColor,
          }}
        >
          {/* Close button for back side */}
          <button 
            className="absolute top-4 right-4 p-2 opacity-60 hover:opacity-100 hover:scale-110 transition-all sm:hidden"
            onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
            style={{ color: textColor }}
          >
            <X size={20} />
          </button>
          <h4
            className="text-xl text-center px-2 theme-transition flex items-center justify-center gap-2"
            style={{ 
              fontFamily: '"FWC26", sans-serif', 
              letterSpacing: '0.05em',
              color: textColor 
            }}
          >
            <MapPin size={20} className="text-[#fcb900]" /> {match.stadium}
          </h4>
          <p className="text-sm theme-transition" style={{ color: subTextColor }}>{match.city}</p>
          {stadiumInfo && (
            <p className="text-xs theme-transition" style={{ color: subTextColor }}>
              Capacity: {stadiumInfo.capacity.toLocaleString()}
            </p>
          )}

          <div className="flex gap-2.5 mt-2">
            <a
              href={calURL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="button-slide px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 border theme-transition flex items-center gap-1.5"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(16, 22, 79, 0.25)',
                color: textColor,
                fontFamily: '"FWC26", sans-serif',
                letterSpacing: '0.08em'
              }}
            >
              <CalendarPlus size={14} className="flex-shrink-0" />
              <span className="scrl">
                <span className="scrl-inner">
                  <span>Add to Cal</span>
                  <span>Open Calendar</span>
                </span>
              </span>
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); handleRemind(e); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="button-slide px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 border theme-transition flex items-center gap-1.5"
              style={{
                background: isReminderSet ? 'rgba(16, 185, 129, 0.1)' : 'rgba(252, 185, 0, 0.1)',
                borderColor: isReminderSet ? 'rgba(16, 185, 129, 0.3)' : 'rgba(252, 185, 0, 0.3)',
                color: isReminderSet ? '#10b981' : '#fcb900',
                fontFamily: '"FWC26", sans-serif',
                letterSpacing: '0.08em'
              }}
            >
              <Bell size={14} className="flex-shrink-0" weight={isReminderSet ? "fill" : "regular"} />
              <span className="scrl">
                <span className="scrl-inner">
                  {isReminderSet ? (
                    <>
                      <span>Alert Set</span>
                      <span>Remove Alert</span>
                    </>
                  ) : (
                    <>
                      <span>Remind Me</span>
                      <span>Set Alert</span>
                    </>
                  )}
                </span>
              </span>
            </button>
          </div>

          <p className="text-[10px] theme-transition" style={{ color: subTextColor }}>Tap to flip back</p>
        </div>
      </div>
    </div>
  );
}
