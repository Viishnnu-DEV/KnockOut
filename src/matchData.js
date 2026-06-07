// ============================================================
// matchData.js — FIFA World Cup 2026 REAL Match Database
// All times converted to IST (Indian Standard Time, UTC+5:30)
// Groups from the official Dec 5 2025 draw in Washington D.C.
// ============================================================

/** Team country ISO-3166 codes for FlagCDN */
export const TEAM_ISO = {
  'Mexico': 'mx', 'South Africa': 'za', 'South Korea': 'kr', 'Czechia': 'cz',
  'Canada': 'ca', 'Bosnia and Herzegovina': 'ba', 'Qatar': 'qa', 'Switzerland': 'ch',
  'Brazil': 'br', 'Morocco': 'ma', 'Haiti': 'ht', 'Scotland': 'gb-sct',
  'USA': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Türkiye': 'tr',
  'Germany': 'de', 'Curaçao': 'cw', 'Ivory Coast': 'ci', 'Ecuador': 'ec',
  'Netherlands': 'nl', 'Japan': 'jp', 'Sweden': 'se', 'Tunisia': 'tn',
  'Belgium': 'be', 'Egypt': 'eg', 'Iran': 'ir', 'New Zealand': 'nz',
  'Spain': 'es', 'Cape Verde': 'cv', 'Saudi Arabia': 'sa', 'Uruguay': 'uy',
  'France': 'fr', 'Senegal': 'sn', 'Iraq': 'iq', 'Norway': 'no',
  'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
  'Portugal': 'pt', 'DR Congo': 'cd', 'Uzbekistan': 'uz', 'Colombia': 'co',
  'England': 'gb-eng', 'Croatia': 'hr', 'Ghana': 'gh', 'Panama': 'pa',
};

/** Get High-Resolution Flag Image URL from FlagCDN */
export function getFlagUrl(team) {
  const code = TEAM_ISO[team];
  if (!code) return '';
  return `https://flagcdn.com/w40/${code}.png`;
}

/** Brand-tinted color for each team */
export const TEAM_COLORS = {
  'Mexico': '#006847', 'South Africa': '#007749', 'South Korea': '#CD2E3A', 'Czechia': '#11457E',
  'Canada': '#FF0000', 'Bosnia and Herzegovina': '#002395', 'Qatar': '#8A1538', 'Switzerland': '#FF0000',
  'Brazil': '#009739', 'Morocco': '#C1272D', 'Haiti': '#00209F', 'Scotland': '#003399',
  'USA': '#002868', 'Paraguay': '#D52B1E', 'Australia': '#00843D', 'Türkiye': '#E30A17',
  'Germany': '#000000', 'Curaçao': '#002B7F', 'Ivory Coast': '#F77F00', 'Ecuador': '#FFD100',
  'Netherlands': '#FF6600', 'Japan': '#BC002D', 'Sweden': '#006AA7', 'Tunisia': '#E70013',
  'Belgium': '#ED2939', 'Egypt': '#CE1126', 'Iran': '#239F40', 'New Zealand': '#000000',
  'Spain': '#AA151B', 'Cape Verde': '#003893', 'Saudi Arabia': '#006C35', 'Uruguay': '#5CACEE',
  'France': '#002395', 'Senegal': '#00853F', 'Iraq': '#CE1126', 'Norway': '#BA0C2F',
  'Argentina': '#75AADB', 'Algeria': '#006233', 'Austria': '#ED2939', 'Jordan': '#007A3D',
  'Portugal': '#006600', 'DR Congo': '#007FFF', 'Uzbekistan': '#1EB53A', 'Colombia': '#FCD116',
  'England': '#FFFFFF', 'Croatia': '#FF0000', 'Ghana': '#006B3F', 'Panama': '#D21034',
  'TBD': '#333333',
};

/** Official group definitions — from the Dec 5, 2025 draw */
export const GROUPS = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['USA', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

/** Real FIFA 2026 host stadiums */
export const STADIUMS = [
  { name: 'Estadio Azteca',           city: 'Mexico City',          country: 'Mexico',  capacity: 87523 },
  { name: 'Estadio Akron',            city: 'Guadalajara',          country: 'Mexico',  capacity: 49850 },
  { name: 'Estadio BBVA',             city: 'Monterrey',            country: 'Mexico',  capacity: 53500 },
  { name: 'BMO Field',                city: 'Toronto',              country: 'Canada',  capacity: 45736 },
  { name: 'BC Place',                 city: 'Vancouver',            country: 'Canada',  capacity: 54500 },
  { name: 'MetLife Stadium',          city: 'East Rutherford, NJ',  country: 'USA',     capacity: 82500 },
  { name: 'SoFi Stadium',             city: 'Inglewood, CA',        country: 'USA',     capacity: 70240 },
  { name: 'Hard Rock Stadium',        city: 'Miami Gardens, FL',    country: 'USA',     capacity: 65326 },
  { name: 'Mercedes-Benz Stadium',    city: 'Atlanta, GA',          country: 'USA',     capacity: 71000 },
  { name: 'Lumen Field',              city: 'Seattle, WA',          country: 'USA',     capacity: 69000 },
  { name: 'NRG Stadium',              city: 'Houston, TX',          country: 'USA',     capacity: 72220 },
  { name: 'AT&T Stadium',             city: 'Arlington, TX',        country: 'USA',     capacity: 80000 },
  { name: 'Lincoln Financial Field',  city: 'Philadelphia, PA',     country: 'USA',     capacity: 69176 },
  { name: 'Gillette Stadium',         city: 'Foxborough, MA',       country: 'USA',     capacity: 65878 },
  { name: "Levi's Stadium",           city: 'Santa Clara, CA',      country: 'USA',     capacity: 68500 },
  { name: 'Arrowhead Stadium',        city: 'Kansas City, MO',      country: 'USA',     capacity: 76416 },
];

// ----------------------------------------------------------------
// Convert 24h time to 12h AM/PM format
// ----------------------------------------------------------------
export function to12Hour(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// ----------------------------------------------------------------
//  REAL MATCHDAY 1 schedule (June 11–17) — from FIFA.com
//  Times are IST. Where local time was given (BST/ET/CT/PT/CST),
//  converted: ET+9:30 = IST, CT+10:30 = IST, PT+12:30 = IST,
//  BST+4:30 = IST, Mexico CST+11:30 = IST
// ----------------------------------------------------------------
const MATCHDAY_1 = [
  // June 11 (local) → June 12 IST for late games
  { id: 1,  teamA: 'Mexico',       teamB: 'South Africa',             group: 'Group A', dateIST: '2026-06-12', timeIST: '00:30', stadium: 'Estadio Azteca',        city: 'Mexico City' },
  // June 12
  { id: 2,  teamA: 'South Korea',  teamB: 'Czechia',                  group: 'Group A', dateIST: '2026-06-12', timeIST: '07:30', stadium: 'Estadio Akron',          city: 'Guadalajara' },
  { id: 3,  teamA: 'Canada',       teamB: 'Bosnia and Herzegovina',   group: 'Group B', dateIST: '2026-06-13', timeIST: '00:30', stadium: 'BMO Field',              city: 'Toronto' },
  // June 13
  { id: 4,  teamA: 'Qatar',        teamB: 'Switzerland',              group: 'Group B', dateIST: '2026-06-13', timeIST: '04:30', stadium: "Levi's Stadium",          city: 'Santa Clara, CA' },
  { id: 5,  teamA: 'Brazil',       teamB: 'Morocco',                  group: 'Group C', dateIST: '2026-06-13', timeIST: '07:30', stadium: 'MetLife Stadium',         city: 'East Rutherford, NJ' },
  { id: 6,  teamA: 'USA',          teamB: 'Paraguay',                 group: 'Group D', dateIST: '2026-06-14', timeIST: '04:30', stadium: 'SoFi Stadium',            city: 'Inglewood, CA' },
  // June 14
  { id: 7,  teamA: 'Haiti',        teamB: 'Scotland',                 group: 'Group C', dateIST: '2026-06-14', timeIST: '00:30', stadium: 'Gillette Stadium',        city: 'Foxborough, MA' },
  { id: 8,  teamA: 'Australia',    teamB: 'Türkiye',                  group: 'Group D', dateIST: '2026-06-14', timeIST: '04:30', stadium: 'BC Place',                city: 'Vancouver' },
  { id: 9,  teamA: 'Netherlands',  teamB: 'Japan',                    group: 'Group F', dateIST: '2026-06-15', timeIST: '00:30', stadium: 'AT&T Stadium',            city: 'Arlington, TX' },
  { id: 10, teamA: 'Sweden',       teamB: 'Tunisia',                  group: 'Group F', dateIST: '2026-06-15', timeIST: '01:30', stadium: 'Estadio BBVA',            city: 'Monterrey' },
  { id: 11, teamA: 'Ivory Coast',  teamB: 'Ecuador',                  group: 'Group E', dateIST: '2026-06-14', timeIST: '07:30', stadium: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
  { id: 12, teamA: 'Germany',      teamB: 'Curaçao',                  group: 'Group E', dateIST: '2026-06-15', timeIST: '04:30', stadium: 'NRG Stadium',             city: 'Houston, TX' },
  // June 15
  { id: 13, teamA: 'Saudi Arabia', teamB: 'Uruguay',                  group: 'Group H', dateIST: '2026-06-15', timeIST: '07:30', stadium: 'Hard Rock Stadium',       city: 'Miami Gardens, FL' },
  { id: 14, teamA: 'Spain',        teamB: 'Cape Verde',               group: 'Group H', dateIST: '2026-06-16', timeIST: '01:30', stadium: 'Mercedes-Benz Stadium',   city: 'Atlanta, GA' },
  { id: 15, teamA: 'Iran',         teamB: 'New Zealand',              group: 'Group G', dateIST: '2026-06-16', timeIST: '04:30', stadium: 'SoFi Stadium',            city: 'Inglewood, CA' },
  { id: 16, teamA: 'Belgium',      teamB: 'Egypt',                    group: 'Group G', dateIST: '2026-06-16', timeIST: '07:30', stadium: 'Lumen Field',             city: 'Seattle, WA' },
  // June 16
  { id: 17, teamA: 'France',       teamB: 'Senegal',                  group: 'Group I', dateIST: '2026-06-17', timeIST: '00:30', stadium: 'MetLife Stadium',         city: 'East Rutherford, NJ' },
  { id: 18, teamA: 'Iraq',         teamB: 'Norway',                   group: 'Group I', dateIST: '2026-06-17', timeIST: '04:30', stadium: 'Lumen Field',             city: 'Seattle, WA' },
  // June 17
  { id: 19, teamA: 'Argentina',    teamB: 'Algeria',                  group: 'Group J', dateIST: '2026-06-17', timeIST: '07:30', stadium: 'Arrowhead Stadium',       city: 'Kansas City, MO' },
  { id: 20, teamA: 'Austria',      teamB: 'Jordan',                   group: 'Group J', dateIST: '2026-06-17', timeIST: '04:30', stadium: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
  { id: 21, teamA: 'Portugal',     teamB: 'DR Congo',                 group: 'Group K', dateIST: '2026-06-18', timeIST: '04:30', stadium: 'NRG Stadium',             city: 'Houston, TX' },
  { id: 22, teamA: 'Uzbekistan',   teamB: 'Colombia',                 group: 'Group K', dateIST: '2026-06-18', timeIST: '01:30', stadium: 'Hard Rock Stadium',       city: 'Miami Gardens, FL' },
  { id: 23, teamA: 'England',      teamB: 'Croatia',                  group: 'Group L', dateIST: '2026-06-18', timeIST: '01:30', stadium: 'AT&T Stadium',            city: 'Arlington, TX' },
  { id: 24, teamA: 'Ghana',        teamB: 'Panama',                   group: 'Group L', dateIST: '2026-06-18', timeIST: '04:30', stadium: 'Estadio Azteca',          city: 'Mexico City' },
];

// ----------------------------------------------------------------
//  MATCHDAY 2 (June 18–23) — Round 2 of each group
// ----------------------------------------------------------------
const MATCHDAY_2 = [
  { id: 25, teamA: 'Mexico',       teamB: 'South Korea',              group: 'Group A', dateIST: '2026-06-19', timeIST: '00:30', stadium: 'Estadio Azteca',          city: 'Mexico City' },
  { id: 26, teamA: 'South Africa', teamB: 'Czechia',                  group: 'Group A', dateIST: '2026-06-19', timeIST: '04:30', stadium: 'Estadio Akron',           city: 'Guadalajara' },
  { id: 27, teamA: 'Canada',       teamB: 'Switzerland',              group: 'Group B', dateIST: '2026-06-19', timeIST: '07:30', stadium: 'BMO Field',               city: 'Toronto' },
  { id: 28, teamA: 'Bosnia and Herzegovina', teamB: 'Qatar',          group: 'Group B', dateIST: '2026-06-20', timeIST: '00:30', stadium: "Levi's Stadium",           city: 'Santa Clara, CA' },
  { id: 29, teamA: 'Brazil',       teamB: 'Haiti',                    group: 'Group C', dateIST: '2026-06-20', timeIST: '04:30', stadium: 'MetLife Stadium',          city: 'East Rutherford, NJ' },
  { id: 30, teamA: 'Morocco',      teamB: 'Scotland',                 group: 'Group C', dateIST: '2026-06-20', timeIST: '07:30', stadium: 'Gillette Stadium',        city: 'Foxborough, MA' },
  { id: 31, teamA: 'USA',          teamB: 'Australia',                group: 'Group D', dateIST: '2026-06-20', timeIST: '01:30', stadium: 'SoFi Stadium',            city: 'Inglewood, CA' },
  { id: 32, teamA: 'Paraguay',     teamB: 'Türkiye',                  group: 'Group D', dateIST: '2026-06-21', timeIST: '00:30', stadium: 'BC Place',                city: 'Vancouver' },
  { id: 33, teamA: 'Germany',      teamB: 'Ivory Coast',              group: 'Group E', dateIST: '2026-06-21', timeIST: '04:30', stadium: 'NRG Stadium',             city: 'Houston, TX' },
  { id: 34, teamA: 'Curaçao',      teamB: 'Ecuador',                  group: 'Group E', dateIST: '2026-06-21', timeIST: '07:30', stadium: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
  { id: 35, teamA: 'Netherlands',  teamB: 'Sweden',                   group: 'Group F', dateIST: '2026-06-21', timeIST: '01:30', stadium: 'AT&T Stadium',            city: 'Arlington, TX' },
  { id: 36, teamA: 'Japan',        teamB: 'Tunisia',                  group: 'Group F', dateIST: '2026-06-22', timeIST: '00:30', stadium: 'Estadio BBVA',            city: 'Monterrey' },
  { id: 37, teamA: 'Belgium',      teamB: 'Iran',                     group: 'Group G', dateIST: '2026-06-22', timeIST: '04:30', stadium: 'Lumen Field',             city: 'Seattle, WA' },
  { id: 38, teamA: 'Egypt',        teamB: 'New Zealand',              group: 'Group G', dateIST: '2026-06-22', timeIST: '07:30', stadium: 'SoFi Stadium',            city: 'Inglewood, CA' },
  { id: 39, teamA: 'Spain',        teamB: 'Saudi Arabia',             group: 'Group H', dateIST: '2026-06-22', timeIST: '01:30', stadium: 'Mercedes-Benz Stadium',   city: 'Atlanta, GA' },
  { id: 40, teamA: 'Cape Verde',   teamB: 'Uruguay',                  group: 'Group H', dateIST: '2026-06-23', timeIST: '00:30', stadium: 'Hard Rock Stadium',       city: 'Miami Gardens, FL' },
  { id: 41, teamA: 'France',       teamB: 'Iraq',                     group: 'Group I', dateIST: '2026-06-23', timeIST: '04:30', stadium: 'MetLife Stadium',          city: 'East Rutherford, NJ' },
  { id: 42, teamA: 'Senegal',      teamB: 'Norway',                   group: 'Group I', dateIST: '2026-06-23', timeIST: '07:30', stadium: 'Arrowhead Stadium',       city: 'Kansas City, MO' },
  { id: 43, teamA: 'Argentina',    teamB: 'Austria',                  group: 'Group J', dateIST: '2026-06-23', timeIST: '01:30', stadium: 'Arrowhead Stadium',       city: 'Kansas City, MO' },
  { id: 44, teamA: 'Algeria',      teamB: 'Jordan',                   group: 'Group J', dateIST: '2026-06-24', timeIST: '00:30', stadium: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
  { id: 45, teamA: 'Portugal',     teamB: 'Uzbekistan',               group: 'Group K', dateIST: '2026-06-24', timeIST: '04:30', stadium: 'NRG Stadium',             city: 'Houston, TX' },
  { id: 46, teamA: 'DR Congo',     teamB: 'Colombia',                 group: 'Group K', dateIST: '2026-06-24', timeIST: '07:30', stadium: 'Hard Rock Stadium',       city: 'Miami Gardens, FL' },
  { id: 47, teamA: 'England',      teamB: 'Ghana',                    group: 'Group L', dateIST: '2026-06-24', timeIST: '01:30', stadium: 'AT&T Stadium',            city: 'Arlington, TX' },
  { id: 48, teamA: 'Croatia',      teamB: 'Panama',                   group: 'Group L', dateIST: '2026-06-24', timeIST: '04:30', stadium: 'Estadio Azteca',          city: 'Mexico City' },
];

// ----------------------------------------------------------------
//  MATCHDAY 3 (June 24–27) — Final group games (simultaneous)
// ----------------------------------------------------------------
const MATCHDAY_3 = [
  { id: 49, teamA: 'Mexico',       teamB: 'Czechia',                  group: 'Group A', dateIST: '2026-06-25', timeIST: '00:30', stadium: 'Estadio Akron',           city: 'Guadalajara' },
  { id: 50, teamA: 'South Africa', teamB: 'South Korea',              group: 'Group A', dateIST: '2026-06-25', timeIST: '00:30', stadium: 'Estadio Azteca',          city: 'Mexico City' },
  { id: 51, teamA: 'Canada',       teamB: 'Qatar',                    group: 'Group B', dateIST: '2026-06-25', timeIST: '04:30', stadium: 'BMO Field',               city: 'Toronto' },
  { id: 52, teamA: 'Bosnia and Herzegovina', teamB: 'Switzerland',    group: 'Group B', dateIST: '2026-06-25', timeIST: '04:30', stadium: "Levi's Stadium",           city: 'Santa Clara, CA' },
  { id: 53, teamA: 'Brazil',       teamB: 'Scotland',                 group: 'Group C', dateIST: '2026-06-25', timeIST: '07:30', stadium: 'MetLife Stadium',          city: 'East Rutherford, NJ' },
  { id: 54, teamA: 'Morocco',      teamB: 'Haiti',                    group: 'Group C', dateIST: '2026-06-25', timeIST: '07:30', stadium: 'Gillette Stadium',        city: 'Foxborough, MA' },
  { id: 55, teamA: 'USA',          teamB: 'Türkiye',                  group: 'Group D', dateIST: '2026-06-26', timeIST: '00:30', stadium: 'SoFi Stadium',            city: 'Inglewood, CA' },
  { id: 56, teamA: 'Paraguay',     teamB: 'Australia',                group: 'Group D', dateIST: '2026-06-26', timeIST: '00:30', stadium: 'BC Place',                city: 'Vancouver' },
  { id: 57, teamA: 'Germany',      teamB: 'Ecuador',                  group: 'Group E', dateIST: '2026-06-26', timeIST: '04:30', stadium: 'NRG Stadium',             city: 'Houston, TX' },
  { id: 58, teamA: 'Curaçao',      teamB: 'Ivory Coast',              group: 'Group E', dateIST: '2026-06-26', timeIST: '04:30', stadium: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
  { id: 59, teamA: 'Netherlands',  teamB: 'Tunisia',                  group: 'Group F', dateIST: '2026-06-26', timeIST: '07:30', stadium: 'AT&T Stadium',            city: 'Arlington, TX' },
  { id: 60, teamA: 'Japan',        teamB: 'Sweden',                   group: 'Group F', dateIST: '2026-06-26', timeIST: '07:30', stadium: 'Estadio BBVA',            city: 'Monterrey' },
  { id: 61, teamA: 'Belgium',      teamB: 'New Zealand',              group: 'Group G', dateIST: '2026-06-27', timeIST: '00:30', stadium: 'Lumen Field',             city: 'Seattle, WA' },
  { id: 62, teamA: 'Egypt',        teamB: 'Iran',                     group: 'Group G', dateIST: '2026-06-27', timeIST: '00:30', stadium: 'SoFi Stadium',            city: 'Inglewood, CA' },
  { id: 63, teamA: 'Spain',        teamB: 'Uruguay',                  group: 'Group H', dateIST: '2026-06-27', timeIST: '04:30', stadium: 'Mercedes-Benz Stadium',   city: 'Atlanta, GA' },
  { id: 64, teamA: 'Cape Verde',   teamB: 'Saudi Arabia',             group: 'Group H', dateIST: '2026-06-27', timeIST: '04:30', stadium: 'Hard Rock Stadium',       city: 'Miami Gardens, FL' },
  { id: 65, teamA: 'France',       teamB: 'Norway',                   group: 'Group I', dateIST: '2026-06-27', timeIST: '07:30', stadium: 'MetLife Stadium',          city: 'East Rutherford, NJ' },
  { id: 66, teamA: 'Senegal',      teamB: 'Iraq',                     group: 'Group I', dateIST: '2026-06-27', timeIST: '07:30', stadium: 'Arrowhead Stadium',       city: 'Kansas City, MO' },
  { id: 67, teamA: 'Argentina',    teamB: 'Jordan',                   group: 'Group J', dateIST: '2026-06-28', timeIST: '00:30', stadium: 'Arrowhead Stadium',       city: 'Kansas City, MO' },
  { id: 68, teamA: 'Algeria',      teamB: 'Austria',                  group: 'Group J', dateIST: '2026-06-28', timeIST: '00:30', stadium: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
  { id: 69, teamA: 'Portugal',     teamB: 'Colombia',                 group: 'Group K', dateIST: '2026-06-28', timeIST: '04:30', stadium: 'NRG Stadium',             city: 'Houston, TX' },
  { id: 70, teamA: 'DR Congo',     teamB: 'Uzbekistan',               group: 'Group K', dateIST: '2026-06-28', timeIST: '04:30', stadium: 'Hard Rock Stadium',       city: 'Miami Gardens, FL' },
  { id: 71, teamA: 'England',      teamB: 'Panama',                   group: 'Group L', dateIST: '2026-06-28', timeIST: '07:30', stadium: 'AT&T Stadium',            city: 'Arlington, TX' },
  { id: 72, teamA: 'Croatia',      teamB: 'Ghana',                    group: 'Group L', dateIST: '2026-06-28', timeIST: '07:30', stadium: 'Estadio Azteca',          city: 'Mexico City' },
];

// ----------------------------------------------------------------
//  KNOCKOUT STAGE — Dates from FIFA.com, teams TBD until group ends
// ----------------------------------------------------------------
function generateKnockout() {
  const matches = [];
  let id = 73;
  const rounds = [
    { round: 'Round of 32', count: 16, dates: ['2026-06-29','2026-06-29','2026-06-29','2026-06-29','2026-06-30','2026-06-30','2026-06-30','2026-06-30','2026-07-01','2026-07-01','2026-07-01','2026-07-01','2026-07-02','2026-07-02','2026-07-02','2026-07-02'], times: ['00:30','04:30','07:30','10:30'] },
    { round: 'Round of 16', count: 8,  dates: ['2026-07-05','2026-07-05','2026-07-05','2026-07-05','2026-07-06','2026-07-06','2026-07-06','2026-07-06'], times: ['00:30','04:30','07:30','10:30'] },
    { round: 'Quarter-final', count: 4, dates: ['2026-07-10','2026-07-10','2026-07-11','2026-07-11'], times: ['00:30','07:30'] },
    { round: 'Semi-final',   count: 2,  dates: ['2026-07-15','2026-07-16'], times: ['04:30'] },
    { round: 'Third Place',  count: 1,  dates: ['2026-07-19'], times: ['01:30'] },
    { round: 'Final',        count: 1,  dates: ['2026-07-20'], times: ['01:30'] },
  ];
  const stadiumCycle = ['MetLife Stadium','SoFi Stadium','AT&T Stadium','Hard Rock Stadium','Mercedes-Benz Stadium','NRG Stadium','Lumen Field','Arrowhead Stadium','Lincoln Financial Field','Gillette Stadium','BC Place','BMO Field','Estadio Azteca','Estadio Akron','Estadio BBVA',"Levi's Stadium"];
  rounds.forEach(({ round, count, dates, times }) => {
    for (let i = 0; i < count; i++) {
      const sIdx = (id - 1) % stadiumCycle.length;
      const stad = STADIUMS.find(s => s.name === stadiumCycle[sIdx]) || STADIUMS[0];
      matches.push({
        id: id++,
        teamA: 'TBD', teamB: 'TBD',
        group: null, round,
        dateIST: dates[i] || dates[dates.length - 1],
        timeIST: times[i % times.length],
        stadium: stad.name, city: stad.city,
        capacity: stad.capacity,
      });
    }
  });
  return matches;
}

// ----------------------------------------------------------------
//  Combine all matches
// ----------------------------------------------------------------
function addCapacity(matches) {
  return matches.map(m => {
    const stad = STADIUMS.find(s => s.name === m.stadium);
    return { ...m, capacity: stad ? stad.capacity : 0 };
  });
}

export const ALL_MATCHES = [
  ...addCapacity(MATCHDAY_1),
  ...addCapacity(MATCHDAY_2),
  ...addCapacity(MATCHDAY_3),
  ...generateKnockout(),
];

/** Get match status based on current date */
export function getMatchStatus(match) {
  const now = new Date();
  const [y, m, d] = match.dateIST.split('-').map(Number);
  const matchDate = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (matchDate < today) return 'DONE';
  if (matchDate.getTime() === today.getTime()) return 'TODAY';
  return 'UPCOMING';
}

/** Get unique sorted dates from match list */
export function getUniqueDates(matches) {
  const set = new Set(matches.map(m => m.dateIST));
  return [...set].sort();
}

/** Get display-friendly date label */
export function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[dt.getDay()]}, ${months[dt.getMonth()]} ${d}`;
}

/** Tournament opening match time (IST) */
export const TOURNAMENT_START = new Date(2026, 5, 12, 0, 30, 0); // June 12, 2026, 12:30 AM IST

/** Stadium lookup */
export function getStadiumInfo(name) {
  return STADIUMS.find(s => s.name === name) || null;
}

/** All teams as flat array */
export function getAllTeams() {
  return Object.values(GROUPS).flat().sort();
}

/** Group standings calculated from actual match results */
export function getGroupStandings() {
  const standings = {};
  const stats = {};
  
  // Initialize stats
  Object.values(GROUPS).flat().forEach(team => {
    stats[team] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  });

  // Calculate stats from ALL_MATCHES
  ALL_MATCHES.forEach(match => {
    if (match.home_score != null && match.away_score != null) {
      const home = match.teamA;
      const away = match.teamB;
      if (stats[home] && stats[away]) {
        stats[home].played++;
        stats[away].played++;
        stats[home].gf += match.home_score;
        stats[home].ga += match.away_score;
        stats[away].gf += match.away_score;
        stats[away].ga += match.home_score;
        stats[home].gd = stats[home].gf - stats[home].ga;
        stats[away].gd = stats[away].gf - stats[away].ga;
        
        if (match.home_score > match.away_score) {
          stats[home].won++; stats[home].pts += 3;
          stats[away].lost++;
        } else if (match.home_score < match.away_score) {
          stats[away].won++; stats[away].pts += 3;
          stats[home].lost++;
        } else {
          stats[home].drawn++; stats[home].pts += 1;
          stats[away].drawn++; stats[away].pts += 1;
        }
      }
    }
  });

  // Group and sort
  Object.entries(GROUPS).forEach(([gKey, teams]) => {
    standings[gKey] = teams.map(team => stats[team] || { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 }).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    });
  });
  return standings;
}
