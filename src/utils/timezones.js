export const TIMEZONES = [
  // ── INDIA (default) ──────────────────────
  {
    id: 'Asia/Kolkata',
    label: 'IST — India Standard Time',
    shortLabel: 'IST',
    offset: '+5:30',
    flag: '🇮🇳',
    region: 'Asia',
    popular: true,
  },

  // ── POPULAR GLOBAL ────────────────────────
  { id: 'America/New_York', label: 'EST — New York', shortLabel: 'EST', offset: '-5:00', flag: '🇺🇸', region: 'Americas', popular: true },
  { id: 'America/Los_Angeles', label: 'PST — Los Angeles', shortLabel: 'PST', offset: '-8:00', flag: '🇺🇸', region: 'Americas', popular: true },
  { id: 'America/Chicago', label: 'CST — Chicago', shortLabel: 'CST', offset: '-6:00', flag: '🇺🇸', region: 'Americas', popular: true },
  { id: 'America/Sao_Paulo', label: 'BRT — São Paulo', shortLabel: 'BRT', offset: '-3:00', flag: '🇧🇷', region: 'Americas', popular: true },
  { id: 'America/Mexico_City', label: 'CST — Mexico City', shortLabel: 'CST', offset: '-6:00', flag: '🇲🇽', region: 'Americas', popular: true },
  { id: 'America/Toronto', label: 'EST — Toronto', shortLabel: 'EST', offset: '-5:00', flag: '🇨🇦', region: 'Americas', popular: true },
  { id: 'America/Vancouver', label: 'PST — Vancouver', shortLabel: 'PST', offset: '-8:00', flag: '🇨🇦', region: 'Americas', popular: true },
  { id: 'America/Argentina/Buenos_Aires', label: 'ART — Buenos Aires', shortLabel: 'ART', offset: '-3:00', flag: '🇦🇷', region: 'Americas', popular: true },

  { id: 'Europe/London', label: 'GMT — London', shortLabel: 'GMT', offset: '+0:00', flag: '🇬🇧', region: 'Europe', popular: true },
  { id: 'Europe/Paris', label: 'CET — Paris', shortLabel: 'CET', offset: '+1:00', flag: '🇫🇷', region: 'Europe', popular: true },
  { id: 'Europe/Berlin', label: 'CET — Berlin', shortLabel: 'CET', offset: '+1:00', flag: '🇩🇪', region: 'Europe', popular: true },
  { id: 'Europe/Madrid', label: 'CET — Madrid', shortLabel: 'CET', offset: '+1:00', flag: '🇪🇸', region: 'Europe', popular: true },
  { id: 'Europe/Rome', label: 'CET — Rome', shortLabel: 'CET', offset: '+1:00', flag: '🇮🇹', region: 'Europe', popular: true },
  { id: 'Europe/Amsterdam', label: 'CET — Amsterdam', shortLabel: 'CET', offset: '+1:00', flag: '🇳🇱', region: 'Europe', popular: true },
  { id: 'Europe/Moscow', label: 'MSK — Moscow', shortLabel: 'MSK', offset: '+3:00', flag: '🇷🇺', region: 'Europe' },
  { id: 'Europe/Istanbul', label: 'TRT — Istanbul', shortLabel: 'TRT', offset: '+3:00', flag: '🇹🇷', region: 'Europe' },
  { id: 'Europe/Lisbon', label: 'WET — Lisbon', shortLabel: 'WET', offset: '+0:00', flag: '🇵🇹', region: 'Europe' },

  { id: 'Asia/Dubai', label: 'GST — Dubai', shortLabel: 'GST', offset: '+4:00', flag: '🇦🇪', region: 'Asia', popular: true },
  { id: 'Asia/Karachi', label: 'PKT — Pakistan', shortLabel: 'PKT', offset: '+5:00', flag: '🇵🇰', region: 'Asia' },
  { id: 'Asia/Dhaka', label: 'BST — Bangladesh', shortLabel: 'BST', offset: '+6:00', flag: '🇧🇩', region: 'Asia' },
  { id: 'Asia/Colombo', label: 'SLST — Sri Lanka', shortLabel: 'SLST', offset: '+5:30', flag: '🇱🇰', region: 'Asia' },
  { id: 'Asia/Kathmandu', label: 'NPT — Nepal', shortLabel: 'NPT', offset: '+5:45', flag: '🇳🇵', region: 'Asia' },
  { id: 'Asia/Singapore', label: 'SGT — Singapore', shortLabel: 'SGT', offset: '+8:00', flag: '🇸🇬', region: 'Asia', popular: true },
  { id: 'Asia/Tokyo', label: 'JST — Tokyo', shortLabel: 'JST', offset: '+9:00', flag: '🇯🇵', region: 'Asia', popular: true },
  { id: 'Asia/Seoul', label: 'KST — Seoul', shortLabel: 'KST', offset: '+9:00', flag: '🇰🇷', region: 'Asia' },
  { id: 'Asia/Shanghai', label: 'CST — Shanghai', shortLabel: 'CST', offset: '+8:00', flag: '🇨🇳', region: 'Asia', popular: true },
  { id: 'Asia/Riyadh', label: 'AST — Riyadh', shortLabel: 'AST', offset: '+3:00', flag: '🇸🇦', region: 'Asia' },
  { id: 'Asia/Tehran', label: 'IRST — Tehran', shortLabel: 'IRST', offset: '+3:30', flag: '🇮🇷', region: 'Asia' },
  { id: 'Asia/Baghdad', label: 'AST — Baghdad', shortLabel: 'AST', offset: '+3:00', flag: '🇮🇶', region: 'Asia' },
  { id: 'Asia/Kuwait', label: 'AST — Kuwait', shortLabel: 'AST', offset: '+3:00', flag: '🇰🇼', region: 'Asia' },
  { id: 'Asia/Bangkok', label: 'ICT — Bangkok', shortLabel: 'ICT', offset: '+7:00', flag: '🇹🇭', region: 'Asia' },
  { id: 'Asia/Jakarta', label: 'WIB — Jakarta', shortLabel: 'WIB', offset: '+7:00', flag: '🇮🇩', region: 'Asia' },
  { id: 'Asia/Manila', label: 'PHT — Manila', shortLabel: 'PHT', offset: '+8:00', flag: '🇵🇭', region: 'Asia' },
  { id: 'Asia/Kuala_Lumpur', label: 'MYT — Kuala Lumpur', shortLabel: 'MYT', offset: '+8:00', flag: '🇲🇾', region: 'Asia' },
  { id: 'Asia/Muscat', label: 'GST — Muscat', shortLabel: 'GST', offset: '+4:00', flag: '🇴🇲', region: 'Asia' },
  { id: 'Asia/Doha', label: 'AST — Doha', shortLabel: 'AST', offset: '+3:00', flag: '🇶🇦', region: 'Asia' },

  { id: 'Africa/Cairo', label: 'EET — Cairo', shortLabel: 'EET', offset: '+2:00', flag: '🇪🇬', region: 'Africa' },
  { id: 'Africa/Nairobi', label: 'EAT — Nairobi', shortLabel: 'EAT', offset: '+3:00', flag: '🇰🇪', region: 'Africa' },
  { id: 'Africa/Lagos', label: 'WAT — Lagos', shortLabel: 'WAT', offset: '+1:00', flag: '🇳🇬', region: 'Africa' },
  { id: 'Africa/Johannesburg', label: 'SAST — Johannesburg', shortLabel: 'SAST', offset: '+2:00', flag: '🇿🇦', region: 'Africa' },
  { id: 'Africa/Casablanca', label: 'WET — Casablanca', shortLabel: 'WET', offset: '+1:00', flag: '🇲🇦', region: 'Africa' },

  { id: 'Australia/Sydney', label: 'AEDT — Sydney', shortLabel: 'AEDT', offset: '+11:00', flag: '🇦🇺', region: 'Pacific', popular: true },
  { id: 'Australia/Melbourne', label: 'AEDT — Melbourne', shortLabel: 'AEDT', offset: '+11:00', flag: '🇦🇺', region: 'Pacific' },
  { id: 'Australia/Perth', label: 'AWST — Perth', shortLabel: 'AWST', offset: '+8:00', flag: '🇦🇺', region: 'Pacific' },
  { id: 'Pacific/Auckland', label: 'NZDT — Auckland', shortLabel: 'NZDT', offset: '+13:00', flag: '🇳🇿', region: 'Pacific' },

  { id: 'UTC', label: 'UTC — Universal Time', shortLabel: 'UTC', offset: '+0:00', flag: '🌐', region: 'UTC', popular: true },
];

// Helper: get timezone by id
export const getTimezone = (id) => {
  const found = TIMEZONES.find((tz) => tz.id === id);
  if (found) return found;

  // Dynamically create a timezone object for unsupported timezones
  try {
    const parts = id.split('/');
    const short = parts[parts.length - 1].replace(/_/g, ' ').substring(0, 4).toUpperCase();
    return {
      id,
      label: `Local — ${id}`,
      shortLabel: short,
      offset: '',
      flag: '📍',
      region: 'Local'
    };
  } catch (e) {
    return TIMEZONES[0];
  }
};

// Helper: get popular timezones
export const getPopularTimezones = () =>
  TIMEZONES.filter((tz) => tz.popular);

// Helper: get timezones grouped by region
export const getByRegion = () =>
  TIMEZONES.reduce((acc, tz) => {
    if (!acc[tz.region]) acc[tz.region] = [];
    acc[tz.region].push(tz);
    return acc;
  }, {});
