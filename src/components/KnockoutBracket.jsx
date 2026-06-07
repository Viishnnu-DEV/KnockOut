import React from 'react';
import { getFlagUrl, ALL_MATCHES } from '../matchData';
import { convertToTimezone } from '../utils/timeConverter';
import { useTimezone } from '../hooks/useTimezone';

// --- Bracket Match Node ---
function BracketMatch({ match, isDark, timezone }) {
  if (!match) return <div className="w-[180px] h-[70px]" />;
  
  const bg = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16,22,79,0.1)';
  const text = isDark ? '#ffffff' : '#10164f';
  const subText = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(16,22,79,0.55)';
  
  const converted = convertToTimezone(`${match.dateIST}T${match.timeIST}:00`, timezone.id);
  const timeStr = converted.valid ? `${converted.dayStr}, ${converted.timeStr}` : match.dateIST;

  return (
    <div className="relative w-[180px] flex flex-col rounded-[8px] overflow-hidden border shadow-sm z-10 theme-transition hover:scale-105"
         style={{ background: bg, borderColor: border, color: text, transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s' }}>
      <div className="px-2 py-1 flex justify-between items-center text-[9px] uppercase font-bold tracking-widest"
           style={{ background: isDark ? 'rgba(0,0,0,0.3)' : '#f8f9fa', color: subText }}>
        <span>{timeStr}</span>
        <span style={{ color: '#fcb900' }}>M{match.id}</span>
      </div>
      <div className="flex flex-col p-1.5 gap-1 text-[13px] font-bold">
        <TeamRow team={match.teamA} flag={match.teamA_flag} score={match.home_score} isDark={isDark} />
        <TeamRow team={match.teamB} flag={match.teamB_flag} score={match.away_score} isDark={isDark} />
      </div>
    </div>
  );
}

function TeamRow({ team, flag, score, isDark }) {
  const isTBD = team === 'TBD';
  const displayFlag = flag || (isTBD ? null : getFlagUrl(team));

  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        {displayFlag ? (
          <img src={displayFlag} alt={team} className="w-4 h-3 object-cover rounded-[2px]" />
        ) : (
          <div className="w-4 h-3 rounded-[2px]" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        )}
        <span className="truncate max-w-[110px]" style={{ color: isTBD ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(16,22,79,0.3)') : 'inherit' }}>
          {team}
        </span>
      </div>
      {score !== undefined && score !== null && (
        <span className="text-[#fcb900]">{score}</span>
      )}
    </div>
  );
}

// --- Bracket Column ---
const BracketColumn = ({ title, matches, isDark, timezone, isLast, isFirst, thirdPlaceMatch }) => {
  const lineColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(16,22,79,0.15)';

  return (
    <div className="flex flex-col min-w-[200px] relative">
      {/* Column Header */}
      <div className="h-10 flex items-center justify-center font-bold uppercase tracking-widest text-[11px] sticky top-0 z-20 backdrop-blur-md"
           style={{ color: '#fcb900', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16,22,79,0.1)'}` }}>
        {title}
      </div>
      
      {/* Matches */}
      <div className="flex flex-col flex-1 py-4 gap-0 relative">
        {matches.map((m, i) => (
          <div key={m?.id || i} className="flex-1 shrink-0 flex items-center justify-center relative min-h-[90px]">
            <BracketMatch match={m} isDark={isDark} timezone={timezone} />
            
            {/* Draw connecting line to right if not last column */}
            {!isLast && m && (
              <div className="absolute top-1/2 -right-[10px] w-[10px] border-t-[1.5px] z-0" style={{ borderColor: lineColor }} />
            )}

            {/* Draw vertical connecting lines for pairs (every even node connects down) */}
            {!isLast && i % 2 === 0 && m && (
              <div className="absolute top-1/2 -right-[10px] border-r-[1.5px] z-0" style={{ height: '100%', borderColor: lineColor }} />
            )}

            {/* Draw connecting line to left if not first column */}
            {!isFirst && m && (
              <div className="absolute top-1/2 -left-[10px] w-[10px] border-t-[1.5px] z-0" style={{ borderColor: lineColor }} />
            )}
          </div>
        ))}
      </div>

      {/* Third Place Playoff inject */}
      {title === 'Final' && thirdPlaceMatch && (
        <div className="absolute bottom-6 left-0 w-full flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold mb-2 text-[#fcb900] tracking-widest">Third Place</span>
          <BracketMatch match={thirdPlaceMatch} isDark={isDark} timezone={timezone} />
        </div>
      )}
    </div>
  );
};

// --- Main Bracket Component ---
export default function KnockoutBracket({ matches = [], isDark }) {
  const { timezone } = useTimezone();

  // Merge live API matches over the static skeleton so the bracket always renders
  const bracketSkeleton = ALL_MATCHES.filter(m => m.round);
  const liveMap = new Map(matches.map(m => [m.id, m]));
  
  const mergedMatches = bracketSkeleton.map(m => {
    if (liveMap.has(m.id)) {
      const liveM = liveMap.get(m.id);
      // Only merge teams and scores to prevent overwriting the static round/date data
      return { 
        ...m, 
        teamA: liveM.teamA !== 'TBD' ? liveM.teamA : m.teamA,
        teamB: liveM.teamB !== 'TBD' ? liveM.teamB : m.teamB,
        teamA_flag: liveM.teamA_flag || m.teamA_flag,
        teamB_flag: liveM.teamB_flag || m.teamB_flag,
        home_score: liveM.home_score,
        away_score: liveM.away_score,
        finished: liveM.finished
      };
    }
    return m;
  });

  // Filter and group by rounds
  const r32 = mergedMatches.filter(m => m.round === 'Round of 32');
  const r16 = mergedMatches.filter(m => m.round === 'Round of 16');
  const qf = mergedMatches.filter(m => m.round === 'Quarter-final');
  const sf = mergedMatches.filter(m => m.round === 'Semi-final');
  const final = mergedMatches.filter(m => m.round === 'Final');
  const thirdPlace = mergedMatches.filter(m => m.round === 'Third Place')[0];

  if (r32.length === 0) return null; // No knockout matches exist yet

  return (
    <section className="w-full max-w-7xl mx-auto px-4 mt-8 mb-10 relative z-10">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <h2 
          className="text-2xl sm:text-3xl font-black uppercase tracking-[0.15em] theme-transition"
          style={{ fontFamily: '"FWC26", sans-serif', color: isDark ? '#ffffff' : '#10164f' }}
        >
          Knockout Bracket
        </h2>
      </div>

      <div 
        className="w-full overflow-hidden rounded-[1.5rem] border shadow-2xl relative theme-transition"
        style={{
          background: isDark ? 'rgba(8, 11, 40, 0.4)' : '#f8f9fa',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.08)',
        }}
      >
        <div 
          className="w-full overflow-x-auto flex gap-[20px] px-6 pb-12 pt-2 scrollbar-hide"
          style={{ 
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            minHeight: 'min-content'
          }}
        >
          <BracketColumn title="Round of 32" matches={r32} isDark={isDark} timezone={timezone} isFirst={true} />
          <BracketColumn title="Round of 16" matches={r16} isDark={isDark} timezone={timezone} />
          <BracketColumn title="Quarter-finals" matches={qf} isDark={isDark} timezone={timezone} />
          <BracketColumn title="Semi-finals" matches={sf} isDark={isDark} timezone={timezone} />
          <BracketColumn title="Final" matches={final} isDark={isDark} timezone={timezone} isLast={true} thirdPlaceMatch={thirdPlace} />
        </div>
      </div>
    </section>
  );
}
