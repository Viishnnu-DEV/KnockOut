// ============================================================
// TimezoneSelector.jsx — Global timezone picker for navbar
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { useTimezone } from '../hooks/useTimezone';
import { TIMEZONES, getPopularTimezones } from '../utils/timezones';
import { GlobeHemisphereWest } from '@phosphor-icons/react';

export default function TimezoneSelector({ isDark }) {
  const { timezone, timezoneId, changeTimezone } = useTimezone();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('popular'); // popular | all
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Theme-aware colors
  const bgColor = isDark ? '#0d0d0d' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16,22,79,0.1)';
  const textColor = isDark ? '#fff' : '#10164f';
  const subTextColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(16,22,79,0.4)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(16,22,79,0.04)';
  const activeBg = isDark ? 'rgba(252,185,0,0.08)' : 'rgba(252,185,0,0.1)';
  const accentColor = '#fcb900';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,22,79,0.05)';
  const inputBorderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16,22,79,0.12)';

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [isOpen]);

  const filtered = TIMEZONES.filter((tz) => {
    const q = search.toLowerCase();
    return (
      tz.label.toLowerCase().includes(q) ||
      tz.shortLabel.toLowerCase().includes(q) ||
      tz.id.toLowerCase().includes(q) ||
      tz.flag.includes(q)
    );
  });

  const displayList = search
    ? filtered
    : activeTab === 'popular'
    ? getPopularTimezones()
    : TIMEZONES;

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'relative', display: 'inline-block', fontFamily: '"DM Sans", "Noto Sans", sans-serif' }}
    >
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="tz-trigger-btn h-[32px] sm:h-[36px]"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 12px',
          background: isOpen
            ? (isDark ? 'rgba(252,185,0,0.1)' : 'rgba(252,185,0,0.08)')
            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,22,79,0.05)'),
          border: `1px solid ${isOpen
            ? (isDark ? 'rgba(252,185,0,0.4)' : 'rgba(252,185,0,0.3)')
            : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(16,22,79,0.12)')}`,
          borderRadius: 8,
          cursor: 'pointer',
          color: textColor,
          fontSize: 13,
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          fontFamily: '"Noto Sans", sans-serif',
        }}
        title="Change timezone"
      >
        <GlobeHemisphereWest size={16} weight="bold" className="opacity-70" />
        <span className="tz-label" style={{ fontWeight: 600, fontFamily: '"Noto Sans", sans-serif', marginTop: '1px' }}>{timezone.shortLabel}</span>
        <span className="tz-label" style={{ color: subTextColor, fontSize: 11 }}>
          {timezone.offset}
        </span>
        <span style={{
          color: subTextColor,
          fontSize: 10,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
          display: 'flex',
          alignItems: 'center',
          marginTop: '2px'
        }}>▼</span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="tz-dropdown-panel" style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 320,
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: 14,
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.7)' : '0 20px 60px rgba(16,22,79,0.12)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'tzDropIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 14px 8px',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,22,79,0.06)'}`,
          }}>
            <div style={{ fontSize: 11, color: subTextColor, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: '"FWC26", sans-serif' }}>
              Match times shown in
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔍</span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search timezone or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: inputBg,
                  border: `1px solid ${inputBorderColor}`,
                  borderRadius: 8,
                  padding: '7px 10px 7px 32px',
                  color: textColor,
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: '"Noto Sans", sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Tabs (only when not searching) */}
            {!search && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {['popular', 'all'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="tz-tab-btn"
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 500,
                      fontFamily: '"Noto Sans", sans-serif',
                      background: activeTab === tab ? accentColor : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(16,22,79,0.06)'),
                      color: activeTab === tab ? '#10164f' : subTextColor,
                      transition: 'all 0.15s ease',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab === 'popular' ? '⭐ Popular' : '🌍 All'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0', overscrollBehavior: 'contain' }} className="tz-list" data-lenis-prevent="true">
            {displayList.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: subTextColor, fontSize: 13 }}>
                No timezone found for "{search}"
              </div>
            )}
            {displayList.map((tz) => (
              <button
                key={tz.id}
                onClick={() => { changeTimezone(tz.id); setIsOpen(false); setSearch(''); }}
                className="tz-option-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 14px',
                  background: tz.id === timezoneId ? activeBg : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                  fontFamily: '"Noto Sans", sans-serif',
                }}
                onMouseEnter={(e) => { if (tz.id !== timezoneId) e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={(e) => { if (tz.id !== timezoneId) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: textColor, fontWeight: tz.id === timezoneId ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{tz.shortLabel}</span>
                    {tz.id === timezoneId && <span style={{ fontSize: 10, color: isDark ? '#10b981' : '#047857', background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 4 }}>active</span>}
                  </div>
                  <div style={{ fontSize: 11, color: subTextColor, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tz.label}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: accentColor, flexShrink: 0, fontFamily: 'monospace' }}>
                  {tz.offset}
                </span>
              </button>
            ))}
          </div>

          {/* Footer note */}
          <div style={{
            padding: '8px 14px',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,22,79,0.06)'}`,
            fontSize: 11,
            color: subTextColor,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Times auto-convert instantly</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                try {
                  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  changeTimezone(browserTz);
                } catch(e) {}
              }}
              className="tz-reset-btn"
              style={{ background: 'none', border: 'none', color: accentColor, fontSize: 11, cursor: 'pointer', fontFamily: '"Noto Sans", sans-serif', fontWeight: 600 }}
            >
              Detect Local
            </button>
            <button
              onClick={() => changeTimezone('Asia/Kolkata')}
              className="tz-reset-btn"
              style={{ background: 'none', border: 'none', color: textColor, opacity: 0.6, fontSize: 11, cursor: 'pointer', fontFamily: '"Noto Sans", sans-serif', fontWeight: 600 }}
            >
              Reset to IST
            </button>
          </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tzDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 640px) {
          .tz-label { display: none; }
          .tz-dropdown-panel {
            position: fixed !important;
            top: 60px !important;
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
            max-width: none !important;
          }
        }
        /* Prevent button-slide effects on tz buttons */
        .tz-trigger-btn::before,
        .tz-tab-btn::before,
        .tz-option-btn::before,
        .tz-reset-btn::before {
          content: none !important;
          display: none !important;
        }
      `}</style>
    </div>
  );
}
