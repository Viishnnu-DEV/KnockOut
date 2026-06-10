// ============================================================
// App.jsx — KICKOFF IST: Main application controller
// Sand & Cyprus Light Theme · Flat Grid Layout · Lenis · GSAP
// Full animation suite inspired by nynjfwc26.com
// ============================================================
import React, { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { 
  SoccerBall, 
  MagnifyingGlass, 
  Star, 
  Sun, 
  Moon, 
  Trophy, 
  Buildings, 
  MapPin, 
  X, 
  House, 
  Calendar, 
  ChartBar,
  CaretDown,
  Flag,
  ThumbsUp,
  SunHorizon,
  SunDim,
  Warning,
  ShareNetwork,
  TreeStructure
} from '@phosphor-icons/react';
import './App.css';

import Countdown from './components/Countdown';
import MatchCard from './components/MatchCard';
import Preloader from './components/Preloader';
import { useLenis } from './hooks/useLenis';
import { useCountUp } from './hooks/useCountUp';
import { useHeadroom } from './hooks/useHeadroom';
import { useScrollReveal } from './hooks/useScrollReveal';
import {
  GROUPS, STADIUMS,
  formatDateLabel, to12Hour, getFlagUrl,
} from './matchData';

// Import new components
import { FanVerdictLeaderboard } from './components/FanPoll';
import ISTSleepAlert from './components/ISTSleepAlert';
import StoryCardGenerator from './components/StoryCardGenerator';
import PWAManager from './components/PWAManager';
import TimezoneSelector from './components/TimezoneSelector';
import KnockoutBracket from './components/KnockoutBracket';
import { useCachedMatches, idbSet } from './hooks/useIndexedDB';
import { useTimezone } from './hooks/useTimezone';
import { getLocalDateKey } from './utils/timeConverter';
import ReminderPopup from './components/ReminderPopup';
import { initReminders } from './utils/reminderScheduler';

const GlobeLocator = React.lazy(() => import('./components/GlobeLocator'));

gsap.registerPlugin(ScrollTrigger);

const STADIUM_OFFSETS = {
  '1': -6, // Estadio Azteca
  '2': -6, // Estadio Akron
  '3': -6, // Estadio BBVA
  '4': -5, // AT&T Stadium
  '5': -5, // NRG Stadium
  '6': -5, // GEHA Field at Arrowhead Stadium
  '7': -4, // Mercedes-Benz Stadium
  '8': -4, // Hard Rock Stadium
  '9': -4, // Gillette Stadium
  '10': -4, // Lincoln Financial Field
  '11': -4, // MetLife Stadium
  '12': -4, // BMO Field
  '13': -7, // BC Place
  '14': -7, // Lumen Field
  '15': -7, // Levi's Stadium
  '16': -7, // SoFi Stadium
};

function toIST(utcDateString) {
  const date = new Date(utcDateString);
  return {
    time: date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    date: date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    fullDate: new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  };
}

function parseMatchFromApi(apiMatch, teamMap, stadiumMap) {
  const parts = apiMatch.local_date.split(' ');
  const dateParts = parts[0].split('/');
  const timeParts = parts[1].split(':');
  const month = parseInt(dateParts[0]) - 1;
  const day = parseInt(dateParts[1]);
  const year = parseInt(dateParts[2]);
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);

  const offset = STADIUM_OFFSETS[apiMatch.stadium_id] || -4;
  const utcTimestamp = Date.UTC(year, month, day, hour, minute) - (offset * 60 * 60 * 1000);
  const utcDateString = new Date(utcTimestamp).toISOString();
  
  const istInfo = toIST(utcDateString);

  const istTimestamp = utcTimestamp + (5.5 * 60 * 60 * 1000);
  const istDateObj = new Date(istTimestamp);
  const yyyy = istDateObj.getUTCFullYear();
  const mm = String(istDateObj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(istDateObj.getUTCDate()).padStart(2, '0');
  const dateIST = `${yyyy}-${mm}-${dd}`;

  const hh = String(istDateObj.getUTCHours()).padStart(2, '0');
  const min = String(istDateObj.getUTCMinutes()).padStart(2, '0');
  const timeIST = `${hh}:${min}`;

  const homeTeam = teamMap[apiMatch.home_team_id];
  const awayTeam = teamMap[apiMatch.away_team_id];
  const stadium = stadiumMap[apiMatch.stadium_id];

  return {
    _id: apiMatch._id,
    id: Number(apiMatch.id),
    teamA: homeTeam ? homeTeam.name : (apiMatch.home_team_name_en || 'TBD'),
    teamB: awayTeam ? awayTeam.name : (apiMatch.away_team_name_en || 'TBD'),
    teamA_flag: homeTeam ? homeTeam.flag : '',
    teamB_flag: awayTeam ? awayTeam.flag : '',
    home_score: apiMatch.home_score !== 'null' && apiMatch.home_score !== null ? Number(apiMatch.home_score) : null,
    away_score: apiMatch.away_score !== 'null' && apiMatch.away_score !== null ? Number(apiMatch.away_score) : null,
    finished: apiMatch.finished === 'TRUE' || apiMatch.finished === true,
    group: apiMatch.group ? `Group ${apiMatch.group}` : null,
    round: apiMatch.type === 'group' ? null : formatRoundName(apiMatch.type),
    stadium: stadium ? stadium.name : 'TBD',
    city: stadium ? stadium.city : 'TBD',
    capacity: stadium ? stadium.capacity : 0,
    dateIST,
    timeIST,
    displayTime: istInfo.time,
    displayDate: istInfo.date,
    utcTimestamp,
    utcDateString,
    local_date: apiMatch.local_date
  };
}

function formatRoundName(type) {
  if (type === 'round_of_32') return 'Round of 32';
  if (type === 'round_of_16') return 'Round of 16';
  if (type === 'quarter') return 'Quarter-final';
  if (type === 'semi') return 'Semi-final';
  if (type === 'final') return 'Final';
  return type;
}



function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

function getMatchStatus(match) {
  const now = new Date();
  const matchTime = match.utcTimestamp 
    ? new Date(match.utcTimestamp) 
    : new Date(match.local_date);
  const diffMinutes = (now - matchTime) / 60000;

  if (match.finished) return { label: 'FT', color: '#555' };
  if (diffMinutes >= 0 && diffMinutes <= 110) return { label: 'LIVE', color: '#ff3333', pulse: true };
  if (isToday(matchTime)) return { label: 'TODAY', color: '#FFD700' };
  if (matchTime > now) return { label: 'UPCOMING', color: '#00FF87' };
  return { label: 'FT', color: '#555' };
}

const API_BASE = '/api';

const authenticateUser = async () => {
  try {
    const authRes = await fetch(`${API_BASE}/auth/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kickoffist@mail.com',
        password: 'kickoff2026'
      })
    });
    
    if (authRes.ok) {
      const data = await authRes.json();
      if (data.token) {
        localStorage.setItem('kickoff_token', data.token);
        return data.token;
      }
    }
    
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'kickoffist',
        email: 'kickoffist@mail.com',
        password: 'kickoff2026'
      })
    });
    
    if (regRes.ok) {
      const data = await regRes.json();
      if (data.token) {
        localStorage.setItem('kickoff_token', data.token);
        return data.token;
      }
    }
  } catch (err) {
    console.error("Authentication failed:", err);
  }
  return null;
};

const fetchWithAuth = async (url, options = {}, isRetry = false) => {
  let token = localStorage.getItem('kickoff_token');
  if (!token) {
    token = await authenticateUser();
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !isRetry) {
    localStorage.removeItem('kickoff_token');
    const newToken = await authenticateUser();
    if (newToken) {
      return fetchWithAuth(url, options, true);
    }
  }
  return res;
};

function SkeletonCard({ isDark }) {
  const cardBg = isDark ? 'rgba(8, 11, 40, 0.5)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.08)';

  return (
    <div
      className="p-5 flex flex-col justify-between rounded-[1.5rem] border animate-pulse"
      style={{
        background: cardBg,
        borderColor: cardBorder,
        minHeight: '240px',
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="w-16 h-4 bg-current opacity-10 rounded" />
        <div className="w-20 h-4 bg-current opacity-10 rounded-full" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 my-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-8 bg-current opacity-10 rounded" />
          <div className="w-16 h-3 bg-current opacity-10 rounded" />
        </div>
        <div className="w-8 h-8 bg-current opacity-10 rounded-full" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-8 bg-current opacity-10 rounded" />
          <div className="w-16 h-3 bg-current opacity-10 rounded" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 mt-auto">
        <div className="w-24 h-5 bg-current opacity-15 rounded" />
        <div className="w-32 h-3 bg-current opacity-10 rounded" />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
//  Confetti burst on favorite toggle (GSAP-powered)
// ----------------------------------------------------------------
function confettiBurst(e) {
  const origin = { x: e.clientX, y: e.clientY };
  const colors = ['#004643', '#D1A751', '#F0EDE5', '#003330', '#c59b3f'];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;left:${origin.x}px;top:${origin.y}px;z-index:9999;
      width:6px;height:6px;border-radius:50%;pointer-events:none;
      background:${colors[i % colors.length]};
    `;
    document.body.appendChild(el);
    gsap.to(el, {
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200 - 80,
      opacity: 0,
      scale: Math.random() * 2 + 0.5,
      duration: 0.8 + Math.random() * 0.5,
      ease: 'power2.out',
      onComplete: () => el.remove(),
    });
  }
}

// ----------------------------------------------------------------
//  IST View Helpers
// ----------------------------------------------------------------
function getISTTimeSlot(timeStr) {
  const [hour] = timeStr.split(':').map(Number);
  if (hour >= 12 && hour < 18) return 'Afternoon';
  if (hour >= 18 && hour <= 22) return 'Evening';
  if (hour > 22 || hour < 4) return 'Late Night';
  return 'Morning'; // 04:00 to 11:59 AM
}

function getMatchStage(match) {
  if (match.round) {
    if (match.round === 'Quarter-final') return 'QF';
    if (match.round === 'Semi-final') return 'SF';
    return match.round;
  }
  return 'Group Stage';
}

function getWeekNumber(dateStr) {
  if (dateStr <= '2026-06-18') return 1;
  if (dateStr <= '2026-06-25') return 2;
  if (dateStr <= '2026-07-02') return 3;
  if (dateStr <= '2026-07-09') return 4;
  if (dateStr <= '2026-07-16') return 5;
  return 6;
}

const WEEK_LABELS = {
  ALL: 'Full Tournament',
  1: 'Week 1: Jun 12 – Jun 18',
  2: 'Week 2: Jun 19 – Jun 25',
  3: 'Week 3: Jun 26 – Jul 02',
  4: 'Week 4: Jul 03 – Jul 09',
  5: 'Week 5: Jul 10 – Jul 16',
  6: 'Week 6: Jul 17 – Jul 20',
};



function StatCounter({ target }) {
  const ref = useCountUp(target);
  return <span ref={ref}>0</span>;
}

// ================================================================
//  APP
// ================================================================
export default function App() {
  const { cachedMatches, cacheMatches } = useCachedMatches();
  const { timezone, timezoneId } = useTimezone();

  // --- State ---
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kickoff_favs') || '[]'); }
    catch { return []; }
  });
  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kickoff_reminders') || '[]'); }
    catch { return []; }
  });
  const [search, setSearch] = useState('');
  const [activeDate, setActiveDate] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('kickoff_theme');
      if (saved !== null) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [teamModal, setTeamModal] = useState(null);
  const [isTeamShareOpen, setIsTeamShareOpen] = useState(false);
  const [shareMatch, setShareMatch] = useState(null);
  const [openGroups, setOpenGroups] = useState({});
  const [mobileTab, setMobileTab] = useState('schedule');
  const [isKnockoutOpen, setIsKnockoutOpen] = useState(false);

  // --- New Feature States ---
  const [scheduleView, setScheduleView] = useState('schedule'); // schedule, watch-guide, my-matches
  const [isFavDrawerOpen, setIsFavDrawerOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [venueFilter, setVenueFilter] = useState('ALL');
  const [timeSlotFilter, setTimeSlotFilter] = useState('ALL');
  const [watchGuideWeek, setWatchGuideWeek] = useState('ALL');
  
  // --- In-App Popups ---
  const [inAppAlerts, setInAppAlerts] = useState([]);
  const remindedSet = useRef(new Set());

  // --- Refs ---
  const dateNavRef = useRef(null);
  const scheduleRef = useRef(null);
  const statsRef = useRef(null);
  const standingsRef = useRef(null);
  const headerRef = useRef(null);
  const marqueeRef = useRef(null);

  // --- Animation States & Hooks ---
  const [preloaderDone, setPreloaderDone] = useState(() => {
    return sessionStorage.getItem('kickoff_preloader_done') === 'true';
  });

  const handlePreloaderComplete = useCallback(() => {
    setPreloaderDone(true);
    sessionStorage.setItem('kickoff_preloader_done', 'true');
  }, []);

  useLenis();
  useHeadroom(headerRef, isDark);
  useScrollReveal('.reveal');

  // --- Live Data States ---
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [matchesData, setMatchesData] = useState([]);
  const [standings, setStandings] = useState({});

  const matchesDataRef = useRef([]);

  useEffect(() => {
    matchesDataRef.current = matchesData;
  }, [matchesData]);

  // Load matches from cache first for instant load
  useEffect(() => {
    if (cachedMatches && cachedMatches.length > 0 && matchesData.length === 0) {
      setTimeout(() => {
        setMatchesData(cachedMatches);
        setLoading(false);
      }, 0);
    }
  }, [cachedMatches, matchesData.length]);

  // --- In-App 15 Minute Reminder Effect ---
  useEffect(() => {
    if (!matchesData || !matchesData.length) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      matchesData.forEach(match => {
        if (match.finished) return;
        
        const matchTime = match.utcDateString 
          ? new Date(match.utcDateString) 
          : new Date(match.local_date);
          
        const diffMins = (matchTime - now) / 60000;
        
        // Between 0 and 15.5 mins, not yet reminded
        if (diffMins > 0 && diffMins <= 15.5 && !remindedSet.current.has(match.id)) {
          remindedSet.current.add(match.id);
          
          const newAlert = {
            id: match.id + '-' + Date.now(),
            matchId: match.id,
            title: `Match starting soon!`,
            body: `${match.teamA} vs ${match.teamB} kicks off in 15 mins!`
          };
          
          setInAppAlerts(prev => [...prev, newAlert]);
          
          // Auto remove after 30 seconds
          setTimeout(() => {
            setInAppAlerts(prev => prev.filter(a => a.id !== newAlert.id));
          }, 30000);
        }
      });
    }, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, [matchesData]);

  // --- Derived ---
  const allDates = useMemo(() => {
    if (!matchesData || !matchesData.length) return [];
    const dates = matchesData.map((m) =>
      getLocalDateKey(m.utcDateString || m.local_date || m.datetime, timezoneId)
    ).filter(Boolean);
    return [...new Set(dates)].sort();
  }, [matchesData, timezoneId]);

  const currentActiveDate = activeDate || allDates[0];

  useEffect(() => {
    if (activeDate && allDates.length && !allDates.includes(activeDate)) {
      setActiveDate(allDates[0]);
    }
  }, [timezoneId, allDates, activeDate]);

  // --- API Fetch Effect ---
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        if (matchesDataRef.current.length === 0) {
          setLoading(true);
        }
        setErrorMsg(null);
        
        let token = localStorage.getItem('kickoff_token');
        if (!token) {
          token = await authenticateUser();
        }
        
        if (!token) {
          throw new Error("Authentication failed");
        }
        
        const [gamesRes, teamsRes, groupsRes, stadiumsRes] = await Promise.all([
          fetchWithAuth(`${API_BASE}/get/games`),
          fetchWithAuth(`${API_BASE}/get/teams`),
          fetchWithAuth(`${API_BASE}/get/groups`),
          fetchWithAuth(`${API_BASE}/get/stadiums`)
        ]);
        
        if (!gamesRes.ok || !teamsRes.ok || !groupsRes.ok || !stadiumsRes.ok) {
          throw new Error("Failed to fetch live World Cup data");
        }
        
        const [gamesData, teamsData, groupsData, stadiumsData] = await Promise.all([
          gamesRes.json(),
          teamsRes.json(),
          groupsRes.json(),
          stadiumsRes.json()
        ]);
        
        const teamLookup = {};
        const apiTeams = teamsData.teams || teamsData;
        apiTeams.forEach(t => {
          teamLookup[t.id] = {
            name: t.name_en,
            flag: t.flag,
            code: t.fifa_code,
            group: t.groups
          };
        });
        
        const stadiumLookup = {};
        const apiStadiums = stadiumsData.stadiums || stadiumsData;
        apiStadiums.forEach(s => {
          stadiumLookup[s.id] = {
            name: s.name_en,
            city: s.city_en,
            country: s.country_en,
            capacity: s.capacity
          };
        });
        
        const apiGames = gamesData.games || gamesData;
        const parsedMatches = apiGames.map(g => parseMatchFromApi(g, teamLookup, stadiumLookup));
        
        setMatchesData(parsedMatches);
        cacheMatches(parsedMatches);
        
        const apiGroups = groupsData.groups || groupsData;
        const parsedStandings = {};
        [...apiGroups].sort((a, b) => a.name.localeCompare(b.name)).forEach(g => {
          const groupLetter = g.name;
          const teamsInGroup = g.teams.map(t => {
            const teamInfo = teamLookup[t.team_id];
            return {
              team: teamInfo ? teamInfo.name : `Team ${t.team_id}`,
              flag: teamInfo ? teamInfo.flag : '',
              played: Number(t.mp || 0),
              won: Number(t.w || 0),
              drawn: Number(t.d || 0),
              lost: Number(t.l || 0),
              gf: Number(t.gf || 0),
              ga: Number(t.ga || 0),
              gd: Number(t.gd || 0),
              pts: Number(t.pts || 0)
            };
          }).sort((a, b) => b.pts - a.pts || b.gf - a.gf);
          
          parsedStandings[groupLetter] = teamsInGroup;
        });
        
        setStandings(parsedStandings);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load live data:", err);
        setErrorMsg("Data unavailable — check connection");
        setLoading(false);
      }
    };
    
    fetchLiveData();
  }, [cacheMatches]);

  // --- Initialize Smart Reminders ---
  useEffect(() => {
    if (matchesData && matchesData.length > 0) {
      // Re-sync reminders on every page load
      // Works offline — reads from localStorage
      initReminders(matchesData, {});
    }
  }, [matchesData]);

  // --- Live Score Auto-Refresh Effect ---
  useEffect(() => {
    const interval = setInterval(async () => {
      const liveMatches = matchesData.filter(m => {
        const status = getMatchStatus(m);
        return status.label === 'LIVE';
      });
      
      if (!liveMatches.length) return;
      
      let token = localStorage.getItem('kickoff_token');
      if (!token) return;
      
      try {
        const updatedMatches = [...matchesData];
        let hasChanges = false;
        
        for (const match of liveMatches) {
          const res = await fetch(`${API_BASE}/get/game/${match._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const gameData = await res.json();
            const apiMatch = gameData.game || gameData;
            if (apiMatch) {
              const idx = updatedMatches.findIndex(m => m.id === match.id);
              if (idx !== -1) {
                const homeScore = apiMatch.home_score !== 'null' && apiMatch.home_score !== null ? Number(apiMatch.home_score) : null;
                const awayScore = apiMatch.away_score !== 'null' && apiMatch.away_score !== null ? Number(apiMatch.away_score) : null;
                const finished = apiMatch.finished === 'TRUE' || apiMatch.finished === true;
                
                updatedMatches[idx] = {
                  ...updatedMatches[idx],
                  home_score: homeScore,
                  away_score: awayScore,
                  finished
                };
                hasChanges = true;
              }
            }
          }
        }
        
        if (hasChanges) {
          setMatchesData(updatedMatches);
        }
      } catch (err) {
        console.error("Failed to auto-refresh live scores:", err);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [matchesData]);

  // --- nextMatch calculation ---
  const nextMatch = useMemo(() => {
    if (!matchesData || !matchesData.length) return null;
    const now = new Date();
    return matchesData
      .filter(m => !m.finished && new Date(m.utcTimestamp) > now)
      .sort((a, b) => a.utcTimestamp - b.utcTimestamp)[0];
  }, [matchesData]);

  // --- Favorites Drawer Lenis Stop/Start + Stagger Animation ---
  useEffect(() => {
    if (isFavDrawerOpen) {
      if (window.lenis) window.lenis.stop();
      document.body.style.overflow = 'hidden';
      gsap.fromTo('.drawer-team-list button',
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.005, duration: 0.25, ease: 'power2.out', delay: 0.1 }
      );
    } else {
      if (window.lenis) window.lenis.start();
      document.body.style.overflow = '';
    }
  }, [isFavDrawerOpen]);

  // --- Hero Entrance Animation (Effect 4, after preloader) ---
  useEffect(() => {
    if (!preloaderDone) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Any element with class .mask-appear (add to hero headings):
    tl.fromTo('.mask-appear',
      { clipPath: 'inset(100% 0 0 0)' },
      { clipPath: 'inset(0% 0 0 0)', duration: 0.9, stagger: 0.15 }
    , 0);

    // Hero background image or video:
    tl.fromTo('.hero-media',
      { scale: 1.08 },
      { scale: 1.0, duration: 1.6, ease: 'power2.out' }
    , 0);

    // Nav items:
    tl.fromTo('.nav-item',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }
    , 0.3);

    // CTA buttons:
    tl.fromTo('.hero-cta',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 }
    , 0.5);

    return () => {
      tl.kill();
    };
  }, [preloaderDone]);

  // Unique Cities/Venues dynamically extracted from STADIUMS
  const uniqueCities = useMemo(() => [...new Set(STADIUMS.map(s => s.city))].sort(), []);

  // Persist favorites to LocalStorage, IndexedDB and Service Worker for PWA alarms
  useEffect(() => {
    localStorage.setItem('kickoff_favs', JSON.stringify(favorites));
    idbSet('starred_teams', favorites);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_STARRED_TEAMS',
        data: { teams: favorites },
      });
    }
  }, [favorites]);

  // Persist reminders to LocalStorage, IndexedDB and Service Worker for PWA alarms
  useEffect(() => {
    localStorage.setItem('kickoff_reminders', JSON.stringify(reminders));
    idbSet('starred_matches', reminders);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_STARRED_MATCHES',
        data: { matches: reminders },
      });
    }
  }, [reminders]);

  const isReminderSet = useCallback(
    (matchId) => reminders.includes(matchId),
    [reminders]
  );

  const toggleReminder = useCallback(async (match) => {
    console.log('[App] toggleReminder called for:', match.id);
    const isSet = reminders.includes(match.id);

    if (isSet) {
      console.log('[App] Reminder is already set, removing it.');
      setReminders((prev) => prev.filter((id) => id !== match.id));
      return false;
    }

    // Unconditionally add to reminders state so PWA/in-app logic works
    setReminders((prev) => [...prev, match.id]);

    let canShowNative = false;

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        canShowNative = true;
      } else if (Notification.permission === 'default') {
        try {
          const result = await Notification.requestPermission();
          canShowNative = (result === 'granted');
        } catch (err) {
          console.warn('[App] Permission request failed:', err);
        }
      }
    }

    if (canShowNative) {
      const title = 'KICKOFF IST — Reminder Set!';
      const body = `We'll notify you 15 minutes before ${match.teamA} vs ${match.teamB} kicks off!`;
      const icon = '/favicon.svg';

      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body,
            icon,
            badge: icon,
            vibrate: [200, 100, 200],
            tag: `reminder-set-${match.id}`,
          });
        } catch (err) {
          try { new Notification(title, { body, icon }); } catch (e) { /* ignore */ }
        }
      } else {
        try { new Notification(title, { body, icon }); } catch (e) { /* ignore */ }
      }
    }

    // Show a simple in-app confirmation
    const newAlert = {
      id: 'toast-' + Date.now(),
      title: 'Reminder Set',
      body: `Alert set for ${match.teamA} vs ${match.teamB}`
    };
    setInAppAlerts(prev => [...prev, newAlert]);
    setTimeout(() => {
      setInAppAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, 4000);

    console.log('[App] toggleReminder complete.');
    return true;
  }, [reminders]);

  const isFavoriteTeam = useCallback(
    (team) => favorites.includes(team),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (team, e) => {
      if (team === 'TBD') return;
      setFavorites((prev) => {
        if (prev.includes(team)) return prev.filter((t) => t !== team);
        if (prev.length >= 6) return prev; // max 6
        return [...prev, team];
      });
      // Confetti burst
      if (e && !favorites.includes(team)) confettiBurst(e);
    },
    [favorites]
  );

  const resetAllFilters = useCallback(() => {
    setSearch('');
    setStageFilter('ALL');
    setGroupFilter('ALL');
    setVenueFilter('ALL');
    setTimeSlotFilter('ALL');
  }, []);

  const hasActiveFilters = search.trim() !== '' || stageFilter !== 'ALL' || groupFilter !== 'ALL' || venueFilter !== 'ALL' || timeSlotFilter !== 'ALL';

  // --- Filter matches ---
  const filteredMatches = useMemo(() => {
    let matches = matchesData;

    // 1. My Matches tab view
    if (scheduleView === 'my-matches') {
      matches = matches.filter(
        (m) => favorites.includes(m.teamA) || favorites.includes(m.teamB)
      );
    }

    // 2. Real-time search filter by team name
    if (search.trim()) {
      const q = search.toLowerCase();
      matches = matches.filter(
        (m) =>
          (m.teamA || '').toLowerCase().includes(q) ||
          (m.teamB || '').toLowerCase().includes(q)
      );
    }

    // 3. Dropdowns
    if (stageFilter !== 'ALL') {
      matches = matches.filter((m) => getMatchStage(m) === stageFilter);
    }
    if (groupFilter !== 'ALL') {
      matches = matches.filter((m) => m.group === `Group ${groupFilter}`);
    }
    if (venueFilter !== 'ALL') {
      matches = matches.filter((m) => m.city === venueFilter || m.stadium === venueFilter);
    }
    if (timeSlotFilter !== 'ALL') {
      matches = matches.filter((m) => getISTTimeSlot(m.timeIST) === timeSlotFilter);
    }

    // 4. Date filter (Only if in main schedule and no search/filter criteria is active)
    if (scheduleView === 'schedule' && currentActiveDate && !hasActiveFilters) {
      matches = matches.filter(
        (m) => getLocalDateKey(m.utcDateString || m.local_date || m.datetime, timezoneId) === currentActiveDate
      );
    }

    return matches;
  }, [scheduleView, favorites, search, stageFilter, groupFilter, venueFilter, timeSlotFilter, currentActiveDate, hasActiveFilters, matchesData, timezoneId]);

  // --- Week distribution stats for Watch Guide Bar Chart ---
  const weekStats = useMemo(() => {
    const stats = {
      ALL: { Morning: 0, Afternoon: 0, Evening: 0, 'Late Night': 0, total: 0 },
      1: { Morning: 0, Afternoon: 0, Evening: 0, 'Late Night': 0, total: 0 },
      2: { Morning: 0, Afternoon: 0, Evening: 0, 'Late Night': 0, total: 0 },
      3: { Morning: 0, Afternoon: 0, Evening: 0, 'Late Night': 0, total: 0 },
      4: { Morning: 0, Afternoon: 0, Evening: 0, 'Late Night': 0, total: 0 },
      5: { Morning: 0, Afternoon: 0, Evening: 0, 'Late Night': 0, total: 0 },
      6: { Morning: 0, Afternoon: 0, Evening: 0, 'Late Night': 0, total: 0 },
    };

    matchesData.forEach((m) => {
      const slot = getISTTimeSlot(m.timeIST);
      const wk = getWeekNumber(m.dateIST);
      stats.ALL[slot]++;
      stats.ALL.total++;
      if (stats[wk]) {
        stats[wk][slot]++;
        stats[wk].total++;
      }
    });

    return stats;
  }, [matchesData]);


  // Lenis engine is initialized in the useLenis hook.

  // ----------------------------------------------------------------
  //  Refresh ScrollTrigger when scheduleView changes
  // ----------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
    return () => clearTimeout(timer);
  }, [scheduleView]);

  // ----------------------------------------------------------------
  //  Parallax effect on hero watermark text
  // ----------------------------------------------------------------
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const parallaxTexts = document.querySelectorAll('.parallax-text');
    parallaxTexts.forEach((el) => {
      gsap.to(el, {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  // ----------------------------------------------------------------
  //  Scroll-reactive marquee speed
  // ----------------------------------------------------------------
  useEffect(() => {
    const lenis = window.lenis;
    
    const onScroll = ({ velocity }) => {
      if (!marqueeRef.current) return;
      const abv = Math.abs(velocity);
      // Base speed 25s, speed up with scroll velocity
      const speedFactor = Math.max(0.3, 1 - abv * 0.015);
      const els = marqueeRef.current.querySelectorAll('.animate-marquee');
      els.forEach((el) => {
        el.style.animationDuration = `${25 * speedFactor}s`;
      });
    };

    if (lenis) {
      lenis.on('scroll', onScroll);
      return () => lenis.off('scroll', onScroll);
    } else {
      const timer = setTimeout(() => {
        if (window.lenis) {
          window.lenis.on('scroll', onScroll);
        }
      }, 50);
      return () => {
        clearTimeout(timer);
        if (window.lenis) window.lenis.off('scroll', onScroll);
      };
    }
  }, [preloaderDone]);

  // ----------------------------------------------------------------
  //  GSAP scroll animations
  // ----------------------------------------------------------------
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stats card stagger-in on mount
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.querySelectorAll('.stat-card'), 
          {
            y: 40,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.8,
          }
        );
      }

      // Match cards stagger
      ScrollTrigger.batch('.match-card-wrapper', {
        onEnter: (batch) =>
          gsap.from(batch, {
            y: 50,
            opacity: 0,
            stagger: 0.06,
            duration: 0.5,
            ease: 'power3.out',
          }),
        start: 'top 90%',
      });

      // Standings section
      if (standingsRef.current) {
        gsap.from(standingsRef.current, {
          y: 60,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: standingsRef.current,
            start: 'top 85%',
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // ----------------------------------------------------------------
  //  Bounce chevron animation
  // ----------------------------------------------------------------
  useEffect(() => {
    gsap.to('.scroll-chevron', {
      y: 10,
      repeat: -1,
      yoyo: true,
      duration: 0.8,
      ease: 'sine.inOut',
    });
  }, []);

  // ----------------------------------------------------------------
  //  Theme toggle & initialization
  // ----------------------------------------------------------------
  useEffect(() => {
    // Sync initial body styling to avoid discrepancies
    document.body.style.backgroundColor = isDark ? '#050508' : '#ffffff';
    document.body.style.color = isDark ? '#ffffff' : '#10164f';
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kickoff_theme', next ? 'dark' : 'light');
      } catch (e) {
        console.error(e);
      }
      gsap.to('body', {
        backgroundColor: next ? '#050508' : '#ffffff',
        color: next ? '#ffffff' : '#10164f',
        duration: 0.6,
        ease: 'power2.inOut',
      });
      return next;
    });
  };

  // ----------------------------------------------------------------
  //  Progress bar — how far into the tournament
  // ----------------------------------------------------------------
  const totalMatches = matchesData.length;
  const doneMatches = matchesData.filter(
    (m) => {
      if (m.finished) return true;
      const [y, mo, d] = m.dateIST.split('-').map(Number);
      return new Date(y, mo - 1, d) < new Date();
    }
  ).length;
  const progress = totalMatches > 0 ? (doneMatches / totalMatches) * 100 : 0;

  // ----------------------------------------------------------------
  //  Date nav click → scroll
  // ----------------------------------------------------------------
  const handleDateClick = (date) => {
    setActiveDate(date);
    const pill = document.getElementById(`date-pill-${date}`);
    if (pill) pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  // ----------------------------------------------------------------
  //  Group accordion toggle
  // ----------------------------------------------------------------
  const toggleGroup = (g) => {
    setOpenGroups((prev) => ({ ...prev, [g]: !prev[g] }));
  };

  // ----------------------------------------------------------------
  //  RENDER
  // ----------------------------------------------------------------
  // Styles based on theme
  const bodyBg = isDark ? '#050508' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#10164f';
  const subTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(16, 22, 79, 0.6)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.05)';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(16, 22, 79, 0.15)';
  const pillBg = isDark ? 'rgba(8, 11, 40, 0.85)' : 'rgba(255, 255, 255, 0.75)';
  const pillBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(16, 22, 79, 0.12)';

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden pb-11 theme-transition ${isDark ? 'dark-mode-scrollbar' : ''}`}
      style={{
        background: bodyBg,
        color: textColor,
      }}
    >
      <PWAManager matches={matchesData} starredTeams={favorites} starredMatches={reminders} teamMap={{}} />

      {/* ====== PROGRESS BAR ====== */}
      <div className="fixed top-0 left-0 w-full z-50 h-1" style={{ background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.1)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: isDark ? 'linear-gradient(90deg, #ffffff, #ff6900)' : 'linear-gradient(90deg, #304ffe, #ff6900)',
            boxShadow: isDark ? '0 0 10px rgba(255, 255, 255, 0.4)' : '0 0 10px rgba(48, 79, 254, 0.3)',
          }}
        />
      </div>

      {/* ====== TOP BAR ====== */}
      <header ref={headerRef} className="header fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-8 py-3 theme-transition">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <a href="/" className="nav-item flex items-center gap-2 theme-transition" style={{ color: isDark ? '#ffffff' : '#10164f' }}>
            <SoccerBall size={24} weight="duotone" className="theme-transition flex-shrink-0" />
            <span
              className="text-xl font-black tracking-[0.05em] uppercase leading-none mt-1"
              style={{ fontFamily: '"FWC26", sans-serif', color: isDark ? '#ffffff' : '#10164f' }}
            >
              KICKOFF
            </span>
            <span
              className="text-md font-bold tracking-[0.1em] uppercase hidden md:inline leading-none mt-1"
              style={{ fontFamily: '"FWC26", sans-serif', color: isDark ? '#ffffff' : '#10164f' }}
            >
              • IST Schedule
            </span>
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Knockout Bracket Icon */}
          <button
            onClick={() => setIsKnockoutOpen(true)}
            className="nav-item w-[32px] h-[32px] sm:w-[36px] sm:h-[36px] rounded-full flex items-center justify-center text-lg transition-transform hover:scale-110 theme-transition shrink-0"
            style={{
              background: inputBg,
              border: `1px solid ${inputBorder}`,
              color: textColor
            }}
            title="Knockout Bracket"
          >
            <TreeStructure size={16} />
          </button>
          <TimezoneSelector isDark={isDark} />
          {/* Search */}
          <div className="nav-item relative hidden sm:block">
            <input
              type="text"
              placeholder="Search teams…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-1.5 pr-8 rounded-full text-sm outline-none w-48 focus:w-64 transition-all theme-transition"
              style={{
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textColor,
                fontFamily: '"DM Sans", sans-serif',
              }}
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                style={{ color: textColor }}
              >
                <X size={16} />
              </button>
            ) : (
              <MagnifyingGlass size={16} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 theme-transition" />
            )}
          </div>
          {/* Favorite Teams Drawer Trigger */}
          <button
            onClick={() => setIsFavDrawerOpen(true)}
            className="nav-item button-slide px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 theme-transition flex items-center justify-center gap-1.5 cursor-pointer h-[32px] sm:h-[36px] shrink-0"
            style={{
              background: favorites.length > 0 ? 'rgba(16, 185, 129, 0.12)' : inputBg,
              border: `1px solid ${favorites.length > 0 ? 'rgba(16, 185, 129, 0.3)' : inputBorder}`,
              color: favorites.length > 0 ? '#10b981' : textColor,
              fontFamily: '"FWC26", sans-serif',
              letterSpacing: '0.08em'
            }}
          >
            <Star size={14} weight={favorites.length > 0 ? "fill" : "regular"} className="flex-shrink-0" />
            <div className="hidden sm:block">
              <span className="scrl">
                <span className="scrl-inner">
                  <span>My Teams ({favorites.length}/6)</span>
                  <span>Manage Favorites</span>
                </span>
              </span>
            </div>
            <span className="sm:hidden leading-none mt-px">
              Teams
            </span>
          </button>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="nav-item w-[32px] h-[32px] sm:w-[36px] sm:h-[36px] rounded-full flex items-center justify-center text-lg transition-transform hover:scale-110 theme-transition shrink-0"
            style={{
              background: inputBg,
              border: `1px solid ${inputBorder}`,
              color: textColor
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ================================================================ */}
      {/*  SECTION 1 — HERO (Flat Typography + Grid)                       */}
      {/* ================================================================ */}
      <section className="relative w-full overflow-hidden flex flex-col items-center justify-center px-4" style={{ minHeight: '100dvh' }}>
        {/* Editorial Pattern Background */}
        <div className={`absolute inset-0 z-0 ${isDark ? 'editorial-grid-dark' : 'editorial-grid'} opacity-50 theme-transition hero-media parallax-bg`} />
        
        {/* Soft Radial Center Highlight */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none theme-transition"
          style={{
            background: isDark 
              ? 'radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, transparent 65%)'
              : 'radial-gradient(circle at center, rgba(16, 22, 79, 0.04) 0%, transparent 65%)'
          }}
        />

        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Hero content overlay */}
        <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-4xl mx-auto text-center px-4 pt-20">
          {/* Title — KICKOFF / IST stacked and center-aligned */}
          <h1
            className="hero-title select-none font-black theme-transition w-full"
            style={{
              fontFamily: '"FWC26", sans-serif',
              fontSize: 'clamp(3.5rem, 12vw, 9.5rem)',
              lineHeight: 1,
              color: textColor,
              textShadow: isDark ? '0 0 40px rgba(255, 255, 255, 0.1)' : '0 0 40px rgba(16, 22, 79, 0.1)',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div className="mask-appear block text-center tracking-[0.04em]">KICKOFF</div>
            </div>
            <div style={{ overflow: 'hidden', marginTop: '0.08em' }}>
              <div
                className="mask-appear block text-center"
                style={{ color: '#fcb900', letterSpacing: '0.42em', paddingLeft: '0.42em' }}
              >
                IST
              </div>
            </div>
          </h1>

          {/* Subtitle */}
          <div style={{ overflow: 'hidden' }}>
            <p
              className="hero-subtitle mt-6 px-4 theme-transition hero-cta"
              style={{
                fontFamily: '"Noto Sans", sans-serif',
                fontSize: 'clamp(0.8rem, 1.8vw, 1.15rem)',
                color: subTextColor,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              FIFA World Cup 2026 — Indian Standard Time Schedule
            </p>
          </div>

          {/* Countdown */}
          <div className="hero-countdown mt-10 hero-cta">
            <Countdown isDark={isDark} nextMatch={nextMatch} />
          </div>
        </div>
      </section>

      {/* ====== SEAMLESS INFINITE MARQUEE (NYNJ Brand-Inspired) ====== */}
      <div 
        className="w-full overflow-hidden border-t border-b py-3.5 select-none flex theme-transition" 
        style={{ 
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16,22,79,0.08)', 
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(16,22,79,0.02)' 
        }}
      >
        <div 
          className="flex whitespace-nowrap text-xs font-bold tracking-[0.2em] uppercase" 
          style={{ fontFamily: '"FWC26", sans-serif', color: '#ff6900' }}
        >
          <div className="animate-marquee flex gap-8 pr-8">
            <span>New York New Jersey 2026</span><span>•</span>
            <span>MetLife Stadium</span><span>•</span>
            <span>FIFA World Cup 2026</span><span>•</span>
            <span>Indian Standard Time Schedule</span><span>•</span>
            <span>104 Matches</span><span>•</span>
            <span>48 Teams</span><span>•</span>
          </div>
          <div className="animate-marquee flex gap-8 pr-8" aria-hidden="true">
            <span>New York New Jersey 2026</span><span>•</span>
            <span>MetLife Stadium</span><span>•</span>
            <span>FIFA World Cup 2026</span><span>•</span>
            <span>Indian Standard Time Schedule</span><span>•</span>
            <span>104 Matches</span><span>•</span>
            <span>48 Teams</span><span>•</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  SECTION 2 — TOURNAMENT OVERVIEW STATS                           */}
      {/* ================================================================ */}
      <section ref={statsRef} className="relative py-16 px-4 border-t border-b theme-transition" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.08)' }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center mb-16 reveal"
            style={{
              fontFamily: '"FWC26", sans-serif',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: '0.05em',
              color: textColor,
            }}
          >
            Tournament Overview
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { label: 'Total Matches', value: 104, icon: <SoccerBall size={32} weight="duotone" className="theme-transition" style={{ color: isDark ? '#ffffff' : '#10164f' }} /> },
              { label: 'Teams', value: 48, icon: <Trophy size={32} weight="duotone" className="theme-transition" style={{ color: isDark ? '#ffffff' : '#10164f' }} /> },
              { label: 'Host Cities', value: 16, icon: <Buildings size={32} weight="duotone" className="theme-transition" style={{ color: isDark ? '#ffffff' : '#10164f' }} /> },
              { label: 'Stadiums', value: 15, icon: <MapPin size={32} weight="duotone" className="theme-transition" style={{ color: isDark ? '#ffffff' : '#10164f' }} /> },
            ].map((stat) => (
              <div
                key={stat.label}
                className="stat-card flex flex-col items-center gap-3 p-6 rounded-2xl border theme-transition"
                style={{
                  background: isDark ? 'rgba(8, 11, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.08)',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(16, 22, 79, 0.02)',
                }}
              >
                <span className="text-3xl">{stat.icon}</span>
                <span
                  className="stat-number text-4xl sm:text-5xl font-bold"
                  data-target={stat.value}
                  style={{
                    fontFamily: '"FWC26", sans-serif',
                    color: '#fcb900',
                    textShadow: '0 0 12px rgba(252,185,0,0.2)',
                  }}
                >
                  <StatCounter target={stat.value} />
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.15em] theme-transition"
                  style={{ fontFamily: '"Noto Sans", sans-serif', color: subTextColor }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  3D GLOBE LOCATOR SECTION                                         */}
      {/* ================================================================ */}
      <Suspense fallback={
        <div className={`h-[400px] flex flex-col items-center justify-center text-xs transition-colors ${isDark ? 'bg-[#050508] text-white/50' : 'bg-white text-[#10164f]/50'}`}>
          <SoccerBall size={32} className={`animate-spin mb-2 ${isDark ? 'text-[#00FF87]' : 'text-[#10164f]'}`} />
          <span>Loading Stadium Universe...</span>
        </div>
      }>
        <GlobeLocator isDark={isDark} />
      </Suspense>

      {/* ================================================================ */}
      {/*  SECTION 3 — MATCH SCHEDULE                                      */}
      {/* ================================================================ */}
      <section ref={scheduleRef} className="relative py-16 px-4">
        {/* Watermark date/text (with parallax) */}
        <div
          className="parallax-text absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none select-none theme-transition"
          style={{
            fontFamily: '"FWC26", sans-serif',
            fontSize: 'clamp(4rem, 15vw, 12rem)',
            color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.07)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            zIndex: 0,
          }}
        >
          {scheduleView === 'watch-guide' 
            ? 'GUIDE' 
            : (scheduleView === 'my-matches' 
                ? 'MY TEAMS' 
                : (scheduleView === 'verdict'
                    ? 'VERDICT'
                    : (search.trim() || hasActiveFilters ? 'FILTERED' : 'SCHEDULE')))}
        </div>

        {/* View Tabs */}
        <div className="relative z-10 flex justify-center items-center gap-2 mb-10 flex-wrap max-w-2xl mx-auto">
          {[
            { key: 'schedule', icon: <Calendar size={16} />, label: 'Schedule by Date' },
            { key: 'watch-guide', icon: <SoccerBall size={16} />, label: 'IST Watch Guide' },
            { key: 'my-matches', icon: <Star size={16} />, label: 'My Matches' },
            { key: 'verdict', icon: <ChartBar size={16} />, label: 'Fan Verdict' },
          ].map((tab) => {
            const isActive = scheduleView === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setScheduleView(tab.key);
                }}
                className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 border theme-transition flex items-center gap-1.5 cursor-pointer"
                style={{
                  background: isActive ? '#fcb900' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,22,79,0.03)'),
                  borderColor: isActive ? '#fcb900' : inputBorder,
                  color: isActive ? '#10164f' : textColor,
                  fontFamily: '"FWC26", sans-serif',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* IST Sleep Alert Panel */}
        <ISTSleepAlert 
          matches={matchesData} 
          isDark={isDark} 
          isFavoriteTeam={isFavoriteTeam}
          onToggleFavorite={toggleFavorite}
          onTeamClick={(team) => setTeamModal(team)}
          isReminderSet={isReminderSet}
          onToggleReminder={toggleReminder}
        />

        {/* Search & dropdown filter panel (Visible for Schedule and My Matches) */}
        {(scheduleView === 'schedule' || scheduleView === 'my-matches') && (
          <div 
            className="relative z-10 mb-8 p-5 rounded-2xl border mx-auto max-w-6xl theme-transition"
            style={{
              background: isDark ? 'rgba(8, 11, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.08)',
            }}
          >
            {/* Search + Match Count Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder="Search teams by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none border theme-transition"
                  style={{
                    background: inputBg,
                    borderColor: inputBorder,
                    color: textColor,
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                />
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                    style={{ color: textColor }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: '"FWC26", sans-serif', color: '#fcb900' }}>
                Showing {filteredMatches.length} of {scheduleView === 'my-matches' ? 'your teams\'' : '104'} matches
              </div>
            </div>

            {/* Dropdowns Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              {/* Stage */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">Stage</label>
                <select
                  value={stageFilter}
                  onChange={(e) => {
                    setStageFilter(e.target.value);
                    if (e.target.value !== 'ALL' && e.target.value !== 'Group Stage') {
                      setGroupFilter('ALL');
                    }
                  }}
                  className="px-3 py-2 rounded-xl text-xs outline-none border theme-transition cursor-pointer bg-transparent"
                  style={{ borderColor: inputBorder, color: textColor }}
                >
                  <option value="ALL" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>All Stages</option>
                  <option value="Group Stage" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Group Stage</option>
                  <option value="Round of 32" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Round of 32</option>
                  <option value="Round of 16" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Round of 16</option>
                  <option value="QF" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Quarter-finals</option>
                  <option value="SF" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Semi-finals</option>
                  <option value="Final" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Final</option>
                </select>
              </div>

              {/* Group */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">Group</label>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none border theme-transition cursor-pointer bg-transparent disabled:opacity-40"
                  style={{ borderColor: inputBorder, color: textColor }}
                  disabled={stageFilter !== 'ALL' && stageFilter !== 'Group Stage'}
                >
                  <option value="ALL" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>All Groups</option>
                  {Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)).map((g) => (
                    <option key={g} value={g} style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Group {g}</option>
                  ))}
                </select>
              </div>

              {/* Venue */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">City/Venue</label>
                <select
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none border theme-transition cursor-pointer bg-transparent"
                  style={{ borderColor: inputBorder, color: textColor }}
                >
                  <option value="ALL" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>All Cities</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city} style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Time Slot */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest opacity-50 font-bold">Time Slot</label>
                <select
                  value={timeSlotFilter}
                  onChange={(e) => setTimeSlotFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none border theme-transition cursor-pointer bg-transparent"
                  style={{ borderColor: inputBorder, color: textColor }}
                >
                  <option value="ALL" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>All Times</option>
                  <option value="Morning" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Morning (before 12 PM)</option>
                  <option value="Afternoon" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Afternoon (12–6 PM)</option>
                  <option value="Evening" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Evening (6–10 PM)</option>
                  <option value="Late Night" style={{ background: isDark ? '#10164f' : '#ffffff', color: textColor }}>Late Night (after 10 PM)</option>
                </select>
              </div>

              {/* Reset button */}
              <button
                onClick={resetAllFilters}
                disabled={!hasActiveFilters}
                className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider border theme-transition disabled:opacity-30 flex items-center justify-center gap-1 cursor-pointer h-[36px]"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,22,79,0.03)',
                  borderColor: inputBorder,
                  color: textColor,
                  fontFamily: '"FWC26", sans-serif'
                }}
              >
                <X size={14} /> Reset
              </button>
            </div>
          </div>
        )}

        {/* Date Strip (Only shown for schedule view when search & filters are inactive) */}
        {scheduleView === 'schedule' && !hasActiveFilters && (
          <div
            ref={dateNavRef}
            className="sticky top-16 z-30 mb-12 mx-auto max-w-6xl overflow-x-auto scrollbar-hide theme-transition"
            style={{
              background: pillBg,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '9999px',
              border: `1px solid ${pillBorder}`,
              padding: '4px',
            }}
          >
            <div className="flex gap-1 min-w-max px-1">
              {allDates.map((date) => {
                const isActive = currentActiveDate === date;
                return (
                  <button
                    key={date}
                    id={`date-pill-${date}`}
                    onClick={() => handleDateClick(date)}
                    className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border theme-transition cursor-pointer"
                    style={{
                      fontFamily: '"Noto Sans", sans-serif',
                      background: isActive ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(16, 22, 79, 0.1)') : 'transparent',
                      color: isActive ? textColor : subTextColor,
                      borderColor: isActive ? (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(16, 22, 79, 0.3)') : 'transparent',
                    }}
                  >
                    {formatDateLabel(date)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =================== SCHEDULE & MY MATCHES VIEW GRIDS =================== */}
        {(scheduleView === 'schedule' || scheduleView === 'my-matches') && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} isDark={isDark} />
              ))
            ) : errorMsg ? (
              <div className="col-span-full text-center py-16 bg-red-500/5 rounded-3xl border border-dashed border-red-500/20 p-8 max-w-md mx-auto">
                <Warning size={44} className="mx-auto text-red-500 mb-4" />
                <h4 className="text-lg font-bold mb-2" style={{ fontFamily: '"FWC26", sans-serif' }}>
                  {errorMsg}
                </h4>
                <p className="text-xs opacity-75 mb-6 leading-relaxed">
                  We were unable to connect to the live match data API. Please check your internet connection or try again later.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fcb900] text-[#10164f] hover:scale-105 transition-transform cursor-pointer"
                  style={{ fontFamily: '"FWC26", sans-serif' }}
                >
                  Retry Connection
                </button>
              </div>
            ) : scheduleView === 'my-matches' && favorites.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-emerald-500/5 rounded-3xl border border-dashed border-emerald-500/20 p-8 max-w-md mx-auto">
                <Star size={44} className="mx-auto text-emerald-500 mb-4" weight="fill" />
                <h4 className="text-lg font-bold mb-2" style={{ fontFamily: '"FWC26", sans-serif' }}>
                  Select Your Favorite Teams
                </h4>
                <p className="text-xs opacity-75 mb-6 leading-relaxed">
                  You haven't selected any favorite teams yet! Click "My Teams" in the header to choose up to 6 teams and track their matches in this custom tab.
                </p>
                <button
                  onClick={() => setIsFavDrawerOpen(true)}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fcb900] text-[#10164f] hover:scale-105 transition-transform cursor-pointer"
                  style={{ fontFamily: '"FWC26", sans-serif' }}
                >
                  Choose Teams
                </button>
              </div>
            ) : filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <div key={match.id} className="match-card-wrapper">
                  <MatchCard
                    match={match}
                    isFavoriteTeam={isFavoriteTeam}
                    onToggleFavorite={toggleFavorite}
                    onTeamClick={(team) => setTeamModal(team)}
                    isDark={isDark}
                    showDate={true}
                    onShare={setShareMatch}
                    isReminderSet={isReminderSet(match.id)}
                    onToggleReminder={toggleReminder}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10 p-8 max-w-md mx-auto">
                <SoccerBall size={44} className="mx-auto opacity-30 mb-4 animate-spin-slow" />
                <h4 className="text-lg font-bold mb-2" style={{ fontFamily: '"FWC26", sans-serif' }}>
                  {scheduleView === 'my-matches' ? 'No Matches Today for Your Teams' : 'No Matches Found'}
                </h4>
                <p className="text-xs opacity-70 mb-6 leading-relaxed">
                  {scheduleView === 'my-matches' 
                    ? 'None of your favorite teams have matches scheduled on this day matching the filters.'
                    : 'We couldn\'t find any matches matching your search term or active filters.'}
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fcb900] text-[#10164f] hover:scale-105 transition-transform cursor-pointer"
                  style={{ fontFamily: '"FWC26", sans-serif' }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================== IST WATCH GUIDE TAB VIEW =================== */}
        {scheduleView === 'watch-guide' && (
          <div className="space-y-10 relative z-10">
            {/* Week Selector */}
            <div className="flex justify-center gap-1.5 mb-8 overflow-x-auto scrollbar-hide py-1 max-w-4xl mx-auto px-4">
              {Object.entries(WEEK_LABELS).map(([weekKey, label]) => {
                const isActive = watchGuideWeek === weekKey;
                return (
                  <button
                    key={weekKey}
                    onClick={() => setWatchGuideWeek(weekKey)}
                    className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border theme-transition transition-transform hover:scale-105 cursor-pointer"
                    style={{
                      background: isActive ? '#fcb900' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,22,79,0.03)'),
                      borderColor: isActive ? '#fcb900' : inputBorder,
                      color: isActive ? '#10164f' : textColor,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* CSS Horizontal Bar Chart */}
            <div 
              className="p-6 rounded-2xl border mx-auto max-w-xl mb-12 theme-transition"
              style={{
                background: isDark ? 'rgba(8, 11, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.08)',
              }}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider mb-6 text-center" style={{ fontFamily: '"FWC26", sans-serif', color: '#fcb900' }}>
                Time Slot Distribution — {WEEK_LABELS[watchGuideWeek]}
              </h4>
              
              <div className="chart-container">
                {[
                  { slot: 'Morning', icon: SunHorizon, desc: 'Before 12 PM IST', color: '#304ffe' },
                  { slot: 'Afternoon', icon: Sun, desc: '12 PM – 6 PM IST', color: '#ff6900' },
                  { slot: 'Evening', icon: SunDim, desc: '6 PM – 10 PM IST (Prime Time)', color: '#10b981', badge: 'Great for India' },
                  { slot: 'Late Night', icon: Moon, desc: 'After 10 PM IST', color: '#8b5cf6' },
                ].map(({ slot, icon, desc, color, badge }) => {
                  const count = weekStats[watchGuideWeek][slot];
                  const total = weekStats[watchGuideWeek].total;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={slot} className="chart-row">
                      <div className="chart-row-header" style={{ color: textColor }}>
                        <span className="flex items-center gap-1.5 font-bold">
                          {(() => {
                            const IconComp = icon;
                            return <IconComp size={16} className="text-current" />;
                          })()}
                          <span>{slot}</span>
                          <span className="opacity-50 font-normal text-[10px]">({desc})</span>
                          {badge && (
                            <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold ml-1.5 flex items-center gap-1">
                              <ThumbsUp size={8} weight="fill" />
                              <span>{badge}</span>
                            </span>
                          )}
                        </span>
                        <span className="font-bold">{count} matches ({Math.round(pct)}%)</span>
                      </div>
                      <div className="chart-bar-bg" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16,22,79,0.06)' }}>
                        <div 
                          className="chart-bar-fill"
                          style={{ 
                            width: `${pct}%`, 
                            background: color,
                            boxShadow: `0 0 10px ${color}33`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grouped Matches List */}
            {(() => {
              // Group current matches
              const matchesOfWeek = watchGuideWeek === 'ALL'
                ? matchesData
                : matchesData.filter((m) => getWeekNumber(m.dateIST) === Number(watchGuideWeek));

              const grouped = {
                'Morning': [],
                'Afternoon': [],
                'Evening': [],
                'Late Night': [],
              };
              
              matchesOfWeek.forEach((m) => {
                const slot = getISTTimeSlot(m.timeIST);
                if (grouped[slot]) grouped[slot].push(m);
              });

              return (
                <div className="max-w-6xl mx-auto space-y-12">
                  {[
                    { slot: 'Morning', icon: SunHorizon, label: 'Morning matches (before 12 PM IST)', desc: 'Broadcasted early morning in India — great for a morning kickoff.' },
                    { slot: 'Afternoon', icon: Sun, label: 'Afternoon matches (12 PM – 6 PM IST)', desc: 'Midday slot matches.' },
                    { slot: 'Evening', icon: SunDim, label: 'Evening matches (6 PM – 10 PM IST) — Prime Time', desc: 'Perfect prime time viewing for Indian football fans!', highlight: true },
                    { slot: 'Late Night', icon: Moon, label: 'Late Night matches (after 10 PM IST)', desc: 'Late night / early hours kickoffs. Pull an all-nighter or stay up late.' },
                  ].map(({ slot, icon, label, desc, highlight }) => {
                    const slotMatches = grouped[slot] || [];
                    if (slotMatches.length === 0) return null;
                    
                    return (
                      <div key={slot} className="space-y-4">
                        <div className="border-b pb-2 flex flex-col md:flex-row md:items-end justify-between gap-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16,22,79,0.1)' }}>
                          <div>
                            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: '"FWC26", sans-serif', color: textColor }}>
                              {(() => {
                                const IconComp = icon;
                                return <IconComp size={20} className="text-[#fcb900] flex-shrink-0" />;
                              })()}
                              <span>{label}</span>
                              {highlight && (
                                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1 flex items-center gap-1">
                                  <ThumbsUp size={10} weight="fill" />
                                  <span>Great for India</span>
                                </span>
                              )}
                            </h3>
                            <p className="text-xs opacity-60 mt-1" style={{ color: subTextColor }}>{desc}</p>
                          </div>
                          <span className="text-xs opacity-50 font-bold uppercase" style={{ color: subTextColor }}>{slotMatches.length} matches</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {slotMatches.map((match) => (
                            <div key={match.id} className="match-card-wrapper">
                              <MatchCard
                                match={match}
                                isFavoriteTeam={isFavoriteTeam}
                                onToggleFavorite={toggleFavorite}
                                onTeamClick={(team) => setTeamModal(team)}
                                isDark={isDark}
                                showDate={true}
                                onShare={setShareMatch}
                                isReminderSet={isReminderSet(match.id)}
                                onToggleReminder={toggleReminder}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* =================== FAN VERDICT TAB VIEW =================== */}
        {scheduleView === 'verdict' && (
          <div className="space-y-10 relative z-10 animate-fadein">
            <FanVerdictLeaderboard matches={matchesData} isDark={isDark} />
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/*  SECTION 4 — GROUP STANDINGS                                     */}
      {/* ================================================================ */}
      <section ref={standingsRef} className="relative py-16 px-4 border-t theme-transition" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.08)' }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center mb-16 reveal"
            style={{
              fontFamily: '"FWC26", sans-serif',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: '0.05em',
              color: textColor,
            }}
          >
            Group Standings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(standings).map(([gKey, teams]) => {
              const isOpen = openGroups[gKey];
              return (
                <div
                  key={gKey}
                  className="rounded-2xl overflow-hidden border theme-transition"
                  style={{
                    background: isDark ? 'rgba(8, 11, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.08)',
                  }}
                >
                  {/* Group header — accordion toggle */}
                  <button
                    onClick={() => toggleGroup(gKey)}
                    className={`w-full flex items-center justify-between px-5 py-4 transition-colors theme-transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'}`}
                  >
                    <span
                      className="text-lg font-bold theme-transition"
                      style={{ fontFamily: '"FWC26", sans-serif', letterSpacing: '0.08em', color: textColor }}
                    >
                      Group {gKey}
                    </span>
                    <CaretDown
                      size={16}
                      className="opacity-40 transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {/* Table — collapsible */}
                  <div
                    style={{
                      maxHeight: isOpen ? '320px' : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <table className="w-full text-sm" style={{ fontFamily: '"Noto Sans", sans-serif' }}>
                      <thead>
                        <tr className="opacity-40 text-[10px] uppercase border-b theme-transition" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.08)' }}>
                          <th className="text-left px-5 py-2">Team</th>
                          <th className="px-2 py-2">P</th>
                          <th className="px-2 py-2">W</th>
                          <th className="px-2 py-2">D</th>
                          <th className="px-2 py-2">L</th>
                          <th className="px-2 py-2">GD</th>
                          <th className="px-2 py-2 text-[#fcb900]">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map((t, idx) => {
                          return (
                            <tr
                              key={t.team}
                              className="border-t theme-transition"
                              style={{
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.05)',
                                background: idx < 2 ? (isDark ? 'rgba(252, 185, 0, 0.04)' : 'rgba(252, 185, 0, 0.07)') : 'transparent',
                              }}
                            >
                              <td className="px-5 py-3 flex items-center gap-2.5">
                                <div className="w-6 h-4 rounded overflow-hidden border border-black/10 flex-shrink-0 bg-white/15 flex items-center justify-center">
                                  {t.flag ? (
                                    <img src={t.flag} alt={t.team} className="w-full h-full object-cover" />
                                  ) : (
                                    <Flag size={14} className="opacity-40" />
                                  )}
                                </div>
                                <span className="font-semibold opacity-95">{t.team}</span>
                              </td>
                              <td className="text-center opacity-60">{t.played}</td>
                              <td className="text-center opacity-60">{t.won}</td>
                              <td className="text-center opacity-60">{t.drawn}</td>
                              <td className="text-center opacity-60">{t.lost}</td>
                              <td className="text-center opacity-60">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                              <td
                                className="text-center font-bold"
                                style={{ color: '#fcb900' }}
                              >
                                {t.pts}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  TEAM STATS MODAL                                                */}
      {/* ================================================================ */}
      {teamModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center animate-slideup-modal"
          onClick={() => setTeamModal(null)}
        >
          {/* Backdrop (Stripped backdrop-blur-sm to prevent viewport glitches on touch) */}
          <div className="absolute inset-0 bg-black/45" />
          
          {/* Modal */}
          <div
            className="relative w-full max-w-lg mx-4 rounded-3xl p-6 border theme-transition max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? 'rgba(8, 11, 40, 0.98)' : '#ffffff',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(16, 22, 79, 0.15)',
              boxShadow: isDark ? '0 -10px 40px rgba(0,0,0,0.4)' : '0 -10px 40px rgba(16, 22, 79, 0.08)',
              color: textColor
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 rounded overflow-hidden border border-black/10 bg-white/15 flex items-center justify-center">
                  {getFlagUrl(teamModal) ? (
                    <img src={getFlagUrl(teamModal)} alt={teamModal} className="w-full h-full object-cover" />
                  ) : (
                    <Flag size={20} className="opacity-40" />
                  )}
                </div>
                <h4
                  className="text-2xl font-bold"
                  style={{ fontFamily: '"FWC26", sans-serif', letterSpacing: '0.05em' }}
                >
                  {teamModal}
                </h4>
              </div>
              <button
                onClick={() => setTeamModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-inherit hover:opacity-75 transition-opacity"
                style={{ background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.06)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Find team's group */}
            {(() => {
              const groupKey = Object.entries(GROUPS).find(([, teams]) =>
                teams.includes(teamModal)
              )?.[0];
              if (!groupKey || !standings[groupKey]) return null;

              return (
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] mb-3 theme-transition" style={{ fontFamily: '"Noto Sans", sans-serif', color: subTextColor }}>
                    Group {groupKey} Standings
                  </p>
                  <table className="w-full text-sm animate-fadein animate-fadein" style={{ fontFamily: '"Noto Sans", sans-serif' }}>
                    <thead>
                      <tr className="opacity-40 text-[10px] uppercase border-b theme-transition" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.08)' }}>
                        <th className="text-left py-2">Team</th>
                        <th className="py-2">P</th>
                        <th className="py-2">W</th>
                        <th className="py-2">D</th>
                        <th className="py-2">L</th>
                        <th className="py-2">GD</th>
                        <th className="py-2 text-[#fcb900]">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings[groupKey].map((t) => {
                        const isCurrent = t.team === teamModal;
                        return (
                          <tr
                            key={t.team}
                            className="border-t theme-transition"
                            style={{
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.05)',
                              background: isCurrent ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.05)') : 'transparent',
                            }}
                          >
                            <td className="py-2 flex items-center gap-2">
                              <div className="w-6 h-4 rounded overflow-hidden border border-black/10 flex-shrink-0 bg-white/15 flex items-center justify-center">
                                {t.flag ? (
                                  <img src={t.flag} alt={t.team} className="w-full h-full object-cover" />
                                ) : (
                                  <Flag size={14} className="opacity-40" />
                                )}
                              </div>
                              <span className={isCurrent ? 'font-bold' : 'opacity-80'}>
                                {t.team}
                              </span>
                            </td>
                            <td className="text-center opacity-60">{t.played}</td>
                            <td className="text-center opacity-60">{t.won}</td>
                            <td className="text-center opacity-60">{t.drawn}</td>
                            <td className="text-center opacity-60">{t.lost}</td>
                            <td className="text-center opacity-60">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                            <td className="text-center font-bold" style={{ color: '#fcb900' }}>{t.pts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Matches for this team */}
            <p className="text-xs uppercase tracking-[0.1em] mt-5 mb-2.5 theme-transition" style={{ fontFamily: '"Noto Sans", sans-serif', color: subTextColor }}>
              Upcoming Matches
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto animate-fadein">
              {matchesData
                .filter((m) => m.teamA === teamModal || m.teamB === teamModal)
                .slice(0, 6)
                .map((m) => {
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs theme-transition"
                      style={{ background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(16, 22, 79, 0.04)' }}
                    >
                      {/* Grid symmetric columns inside team modal list for perfect alignment */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full pr-3">
                        {/* Team A */}
                        <div className="flex items-center gap-1.5 justify-end">
                          <span>{m.teamA}</span>
                          {m.teamA_flag ? (
                            <img src={m.teamA_flag} alt={m.teamA} className="w-5 h-3.5 object-cover rounded border border-black/10 bg-white/15 flex-shrink-0" onError={(e) => e.target.style.display = 'none'} />
                          ) : (
                            <Flag size={14} className="opacity-40" />
                          )}
                        </div>
                        {/* VS */}
                        <span className="opacity-40 text-[9px] uppercase font-black px-1 text-center">vs</span>
                        {/* Team B */}
                        <div className="flex items-center gap-1.5 justify-start">
                          {m.teamB_flag ? (
                            <img src={m.teamB_flag} alt={m.teamB} className="w-5 h-3.5 object-cover rounded border border-black/10 bg-white/15 flex-shrink-0" onError={(e) => e.target.style.display = 'none'} />
                          ) : (
                            <Flag size={14} className="opacity-40" />
                          )}
                          <span>{m.teamB}</span>
                        </div>
                      </div>
                      
                      <span style={{ color: '#fcb900', fontFamily: '"FWC26"', fontSize: '14px', letterSpacing: '0.03em' }} className="flex-shrink-0">
                        {to12Hour(m.timeIST)} IST
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Generate Team Card button */}
            <button
              onClick={() => setIsTeamShareOpen(true)}
              className="w-full mt-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ fontFamily: '"FWC26", sans-serif' }}
            >
              <ShareNetwork size={14} />
              <span>Generate Team Card</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  MOBILE BOTTOM NAV                                               */}
      {/* ================================================================ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden flex justify-around items-center py-2.5 px-2 theme-transition"
        style={{
          background: isDark ? 'rgba(8, 11, 40, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 22, 79, 0.1)'}`,
        }}
      >
        {[
          { key: 'home', icon: <House size={20} weight={mobileTab === 'home' ? 'fill' : 'regular'} className="theme-transition" />, label: 'Home' },
          { key: 'schedule', icon: <Calendar size={20} weight={mobileTab === 'schedule' ? 'fill' : 'regular'} className="theme-transition" />, label: 'Schedule' },
          { key: 'standings', icon: <ChartBar size={20} weight={mobileTab === 'standings' ? 'fill' : 'regular'} className="theme-transition" />, label: 'Standings' },
          { key: 'search', icon: <MagnifyingGlass size={20} weight={mobileTab === 'search' ? 'fill' : 'regular'} className="theme-transition" />, label: 'Search' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setMobileTab(tab.key);
              const btn = document.activeElement;
              if (btn) gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.2, ease: 'back.out(3)' });
              
              if (tab.key === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
              if (tab.key === 'schedule') scheduleRef.current?.scrollIntoView({ behavior: 'smooth' });
              if (tab.key === 'standings') standingsRef.current?.scrollIntoView({ behavior: 'smooth' });
              if (tab.key === 'search') {
                scheduleRef.current?.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                  const input = document.getElementById('mobile-search-input');
                  if (input) input.focus();
                }, 400);
              }
            }}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all theme-transition"
            style={{
              color: mobileTab === tab.key ? '#fcb900' : subTextColor,
            }}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-medium" style={{ fontFamily: '"Noto Sans", sans-serif' }}>
              {tab.label}
            </span>
          </button>
        ))}

      </nav>

      {/* ================================================================ */}
      {/*  FAVORITE TEAMS DRAWER (up to 6 teams)                           */}
      {/* ================================================================ */}
      <div 
        className={`drawer-overlay ${isFavDrawerOpen ? 'active' : ''}`}
        onClick={() => setIsFavDrawerOpen(false)}
      />
      
      <div 
        className={`drawer-panel ${isFavDrawerOpen ? 'active' : ''} flex flex-col theme-transition`}
        style={{
          background: isDark ? 'rgba(8, 11, 40, 0.98)' : '#ffffff',
          color: textColor,
          borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 22, 79, 0.1)'}`,
        }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 22, 79, 0.1)' }}>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: '"FWC26", sans-serif' }}>
              <Star size={20} className="text-[#fcb900]" weight="fill" />
              <span>Favorite Teams</span>
            </h3>
            <p className="text-xs opacity-60 mt-1">Select up to 6 teams to follow</p>
          </div>
          <button
            onClick={() => setIsFavDrawerOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-inherit hover:opacity-75 transition-opacity cursor-pointer"
            style={{ background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.06)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Selected Teams Summary */}
        <div className="p-6 bg-emerald-500/5 border-b flex items-center justify-between" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 22, 79, 0.1)' }}>
          <span className="text-xs font-bold uppercase tracking-wider">
            {favorites.length === 0 
              ? 'No teams selected' 
              : `${favorites.length} of 6 selected`}
          </span>
          {favorites.length > 0 && (
            <button
              onClick={() => setFavorites([])}
              className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Teams List (Grouped by Group) */}
        <div className="flex-1 overflow-y-auto p-6 drawer-team-list space-y-6">
          {Object.entries(GROUPS).map(([groupLetter, teams]) => (
            <div key={groupLetter} className="space-y-2.5">
              <h5 className="text-[10px] font-bold uppercase tracking-widest opacity-40 border-b pb-1" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16, 22, 79, 0.05)' }}>
                Group {groupLetter}
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {teams.map((teamName) => {
                  const isFav = favorites.includes(teamName);
                  const flagUrl = getFlagUrl(teamName);
                  return (
                    <button
                      key={teamName}
                      onClick={(e) => toggleFavorite(teamName, e)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer ${
                        isFav 
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.08)]' 
                          : isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06]' : 'bg-black/[0.01] border-black/5 hover:bg-black/[0.04]'
                      }`}
                      style={{ 
                        color: isFav ? '#10b981' : textColor,
                      }}
                    >
                      <div className="w-6 h-4 rounded overflow-hidden border border-black/10 flex-shrink-0 bg-white/10 flex items-center justify-center">
                        {flagUrl ? (
                          <img src={flagUrl} alt={teamName} className="w-full h-full object-cover" />
                        ) : (
                          <Flag size={10} className="opacity-40" />
                        )}
                      </div>
                      <span className="truncate">{teamName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!preloaderDone && (
        <Preloader isDark={isDark} onComplete={handlePreloaderComplete} />
      )}


      {/* Modal slide-up keyframe */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideup-modal {
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-fadein {
          animation: fadeIn 0.4s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Removed ChatTicker */}

      {isTeamShareOpen && (
        <StoryCardGenerator
          mode="team"
          teamA={teamModal}
          flagA={getFlagUrl(teamModal)}
          isOpen={isTeamShareOpen}
          onClose={() => setIsTeamShareOpen(false)}
          isDark={isDark}
          teamStats={{
            group: Object.entries(GROUPS).find(([, teams]) => teams.includes(teamModal))?.[0] || 'N/A',
            ranking: standings[Object.entries(GROUPS).find(([, teams]) => teams.includes(teamModal))?.[0]]
              ? `#${standings[Object.entries(GROUPS).find(([, teams]) => teams.includes(teamModal))?.[0]].findIndex(t => t.team === teamModal) + 1} in Group`
              : 'N/A',
            favsCount: Math.floor((teamModal.charCodeAt(0) * 153) % 4500) + 800
          }}
        />
      )}

      {shareMatch && (
        <StoryCardGenerator
          match={shareMatch}
          teamA={shareMatch.teamA}
          teamB={shareMatch.teamB}
          flagA={shareMatch.teamA_flag}
          flagB={shareMatch.teamB_flag}
          istTime={shareMatch.displayTime || to12Hour(shareMatch.timeIST)}
          istDate={formatDateLabel(shareMatch.dateIST)}
          isOpen={!!shareMatch}
          onClose={() => setShareMatch(null)}
          isDark={isDark}
        />
      )}

      {/* ================================================================ */}
      {/*  KNOCKOUT BRACKET MODAL                                          */}
      {/* ================================================================ */}
      {isKnockoutOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col theme-transition animate-fadein"
          style={{ 
            background: isDark ? 'rgba(8, 11, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)', 
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: textColor 
          }}
        >
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 22, 79, 0.1)' }}>
            <div className="flex items-center gap-3">
              <TreeStructure size={24} color="#fcb900" />
              <h2 className="text-2xl font-black uppercase tracking-[0.1em] mt-1" style={{ fontFamily: '"FWC26", sans-serif' }}>
                Knockout Stage
              </h2>
            </div>
            <button
              onClick={() => setIsKnockoutOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-inherit hover:opacity-75 transition-opacity cursor-pointer border"
              style={{ 
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 22, 79, 0.06)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 22, 79, 0.1)'
              }}
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto relative" data-lenis-prevent="true">
            {/* The bracket itself handles its own spacing and horizontal scroll natively */}
            <div className="pt-10 pb-20 px-4">
              <KnockoutBracket matches={matchesData} isDark={isDark} />
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  FOOTER                                                          */}
      {/* ================================================================ */}
      <footer 
        className="w-full py-8 mt-16 border-t theme-transition text-center text-xs tracking-widest font-bold uppercase z-20 relative"
        style={{
          background: isDark ? '#050508' : '#ffffff',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.08)',
          color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(16, 22, 79, 0.5)',
          fontFamily: '"Noto Sans", sans-serif'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-3">
          <p
            className="text-center max-w-lg normal-case tracking-normal font-normal text-[11px] leading-relaxed"
            style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(16,22,79,0.45)' }}
          >
            Match times shown in {timezone.flag} {timezone.shortLabel} ({timezone.offset}). Not affiliated with FIFA.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <span>© {new Date().getFullYear()} KICKOFF IST • FIFA World Cup 2026</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-2">
              <span>Made with ⚽ by</span>
              <span
                className={`font-black tracking-wider transition-colors ${isDark ? 'text-[#00FF87]' : 'text-[#304ffe]'}`}
                style={{ fontFamily: '"FWC26", sans-serif', fontSize: '14px' }}
              >
                Vishnu
              </span>
            </span>
          </div>
        </div>
      </footer>

      <ReminderPopup matches={matchesData} teamMap={{}} />
    </div>
  );
}
