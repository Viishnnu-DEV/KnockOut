import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ThumbsUp, Users } from '@phosphor-icons/react';
import { doc, getDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Shared Storage Helpers
async function loadPollData(matchId) {
  try {
    const docRef = doc(db, 'live_polls', `match-${matchId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return { 
        teamAVotes: 0, 
        teamBVotes: 0, 
        totalVoters: 0 
      };
    }
  } catch (err) {
    console.error("Firestore read error:", err);
    return { teamAVotes: 0, teamBVotes: 0, totalVoters: 0 };
  }
}

async function submitVote(matchId, team) {
  // Check if already voted (localStorage)
  if (localStorage.getItem(`live_voted:${matchId}`)) {
    return { status: 'already_voted' };
  }

  const docRef = doc(db, 'live_polls', `match-${matchId}`);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      let current;
      if (!docSnap.exists()) {
        current = { 
          teamAVotes: 0, 
          teamBVotes: 0, 
          totalVoters: 0 
        };
      } else {
        current = docSnap.data();
      }

      const newData = {
        ...current,
        [`team${team}Votes`]: (current[`team${team}Votes`] || 0) + 1,
        totalVoters: (current.totalVoters || 0) + 1
      };

      transaction.set(docRef, newData);
      return newData;
    });
    
    localStorage.setItem(`live_voted:${matchId}`, team);
    return { status: 'success', data: updated };
  } catch (err) {
    console.error("Voting failed:", err);
    return { status: 'error' };
  }
}

// ============================================================
//  Poll embed component (Inside MatchCard)
// ============================================================
export function FanPoll({ matchId, teamA, teamB, flagA, flagB, isDark }) {
  const [pollData, setPollData] = useState({ teamAVotes: 0, teamBVotes: 0, totalVoters: 0 });
  const [userVote, setUserVote] = useState(null);
  const barRefA = useRef(null);
  const barRefB = useRef(null);

  useEffect(() => {
    const voted = localStorage.getItem(`live_voted:${matchId}`);
    if (voted) {
      setUserVote(voted);
    }

    const docRef = doc(db, 'live_polls', `match-${matchId}`);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setPollData(docSnap.data());
      } else {
        setPollData({ 
          teamAVotes: 0, 
          teamBVotes: 0, 
          totalVoters: 0 
        });
      }
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      loadPollData(matchId).then(setPollData);
    });

    return () => unsubscribe();
  }, [matchId]);

  // Animate vote bars on vote or data change
  const total = pollData.teamAVotes + pollData.teamBVotes;
  const pctA = total > 0 ? Math.round((pollData.teamAVotes / total) * 100) : 50;
  const pctB = total > 0 ? 100 - pctA : 50;

  useEffect(() => {
    if (userVote) {
      if (barRefA.current) {
        gsap.to(barRefA.current, { width: `${pctA}%`, duration: 0.8, ease: 'power2.out' });
      }
      if (barRefB.current) {
        gsap.to(barRefB.current, { width: `${pctB}%`, duration: 0.8, ease: 'power2.out' });
      }
    }
  }, [pctA, pctB, userVote]);

  const handleVote = async (team) => {
    const res = await submitVote(matchId, team);
    if (res.status === 'success') {
      setUserVote(team);
      setPollData(res.data);
    } else if (res.status === 'already_voted') {
      const voted = localStorage.getItem(`voted:${matchId}`);
      setUserVote(voted);
    }
  };

  const textCol = isDark ? 'text-white' : 'text-[#10164f]';
  const borderCol = isDark ? 'border-white/10' : 'border-[#10164f]/10';

  return (
    <div className={`mt-4 pt-3 border-t ${borderCol} w-full text-center relative z-10`}>
      {!userVote ? (
        <div className="space-y-2.5">
          <h5 className={`text-[10px] font-bold uppercase tracking-widest ${textCol}`}>
            Who Wins? 🏆
          </h5>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleVote('A'); }}
              className="py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-500/10 hover:border-emerald-500/40"
              style={{
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16,22,79,0.1)',
                color: isDark ? '#ffffff' : '#10164f',
              }}
            >
              {flagA && <img src={flagA} alt="" className="w-4 h-2.5 object-cover rounded-sm" />}
              <span>{teamA}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleVote('B'); }}
              className="py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-500/10 hover:border-emerald-500/40"
              style={{
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16,22,79,0.1)',
                color: isDark ? '#ffffff' : '#10164f',
              }}
            >
              {flagB && <img src={flagB} alt="" className="w-4 h-2.5 object-cover rounded-sm" />}
              <span>{teamB}</span>
            </button>
          </div>
          <p className="text-[9px] opacity-50 flex items-center justify-center gap-1">
            <Users size={10} />
            <span>{total.toLocaleString()} fans voted</span>
          </p>
        </div>
      ) : (
        <div className="space-y-2 animate-slideup-modal">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-emerald-500 flex items-center gap-1">
              <ThumbsUp size={10} weight="fill" />
              <span>{pctA}% {teamA}</span>
            </span>
            <span className="opacity-55">{pctB}% {teamB}</span>
          </div>

          {/* Double Bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden flex border ${isDark ? 'bg-white/5 border-white/5' : 'bg-[#10164f]/5 border-[#10164f]/5'}`}>
            <div
              ref={barRefA}
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pctA}%` }}
            />
            <div
              ref={barRefB}
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${pctB}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[9px] opacity-60">
            <span>Voted for {userVote === 'A' ? teamA : teamB}</span>
            <span>{total.toLocaleString()} total votes from India 🇮🇳</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  Leaderboard View Component (For Fan Verdict Tab)
// ============================================================
export function FanVerdictLeaderboard({ matches, isDark }) {
  const [boardStats, setBoardStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllStats = async () => {
      setLoading(true);
      try {
        const list = await Promise.all(
          matches.map(async (m) => {
            const data = await loadPollData(m.id);
            const total = data.teamAVotes + data.teamBVotes;
            const pctA = total > 0 ? Math.round((data.teamAVotes / total) * 100) : 50;
            const pctB = total > 0 ? 100 - pctA : 50;
            const margin = Math.abs(pctA - pctB);
            return {
              match: m,
              pctA,
              pctB,
              total,
              margin,
            };
          })
        );

        // Sort by closest margin (contested match)
        const sorted = [...list].sort((a, b) => a.margin - b.margin);
        setBoardStats(sorted);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    if (matches && matches.length > 0) {
      loadAllStats();
    }
  }, [matches]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Users className="animate-spin text-[#00FF87] mx-auto mb-2" size={32} />
        <span className="text-xs opacity-60">Loading leaderboard...</span>
      </div>
    );
  }

  const mostContested = boardStats[0];
  const biggestLandslide = [...boardStats].sort((a, b) => b.margin - a.margin)[0];

  return (
    <div className={`max-w-4xl mx-auto px-4 space-y-10 z-10 relative ${isDark ? 'text-white' : 'text-[#10164f]'}`}>
      {/* Banner / Stat summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mostContested && (
          <div 
            className="p-5 rounded-2xl border flex flex-col justify-between"
            style={{
              background: isDark ? 'rgba(8, 11, 40, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.08)',
            }}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD700] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                Most Contested
              </span>
              <h4 className="text-lg font-bold mt-3" style={{ fontFamily: '"FWC26", sans-serif' }}>
                {mostContested.match.teamA} vs {mostContested.match.teamB}
              </h4>
              <p className="text-xs opacity-60 mt-1">
                Margins are razor thin for this upcoming fixture! Fans are split.
              </p>
            </div>
            <div className="text-sm font-bold text-[#FFD700] mt-4">
              {mostContested.pctA}% vs {mostContested.pctB}% • {mostContested.total.toLocaleString()} Votes
            </div>
          </div>
        )}

        {biggestLandslide && (
          <div 
            className="p-5 rounded-2xl border flex flex-col justify-between"
            style={{
              background: isDark ? 'rgba(8, 11, 40, 0.65)' : 'rgba(255, 255, 255, 0.45)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.08)',
            }}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00FF87] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Biggest Landslide
              </span>
              <h4 className="text-lg font-bold mt-3" style={{ fontFamily: '"FWC26", sans-serif' }}>
                {biggestLandslide.match.teamA} vs {biggestLandslide.match.teamB}
              </h4>
              <p className="text-xs opacity-60 mt-1">
                One team dominates the polls. Fans are highly confident.
              </p>
            </div>
            <div className="text-sm font-bold text-[#00FF87] mt-4">
              {biggestLandslide.pctA}% vs {biggestLandslide.pctB}% • {biggestLandslide.total.toLocaleString()} Votes
            </div>
          </div>
        )}
      </div>

      {/* Full rankings */}
      <div 
        className="p-6 rounded-3xl border theme-transition"
        style={{
          background: isDark ? 'rgba(8, 11, 40, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.08)',
        }}
      >
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#fcb900] mb-6" style={{ fontFamily: '"FWC26", sans-serif' }}>
          🗳️ Full Fan Verdict Leaderboard (Closest Contests First)
        </h4>

        <div className="space-y-4 max-h-[500px] overflow-y-auto drawer-team-list pr-2">
          {boardStats.map(({ match, pctA, pctB, total }, idx) => (
            <div 
              key={match.id}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-[#10164f]/5'}`}
              style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.05)',
                background: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(16, 22, 79, 0.01)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="opacity-40 font-bold w-5">#{idx + 1}</span>
                <div className="flex flex-col">
                  <span className="font-bold">{match.teamA} vs {match.teamB}</span>
                  <span className="text-[10px] opacity-50">{match.stadium} • {match.group || match.round}</span>
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-[#00FF87]">{pctA}% — {pctB}%</span>
                  <span className="text-[9px] opacity-40">{total.toLocaleString()} votes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
