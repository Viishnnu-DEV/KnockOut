import { useState, useEffect } from 'react';
import gsap from 'gsap';

export default function ReminderPopup({ matches = [], teamMap = {} }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState('choice'); // choice | permission | success | denied
  const [selectedChoice, setSelectedChoice] = useState(null);

  useEffect(() => {
    // Only show if never asked before
    const alreadyAsked = localStorage.getItem('kickoff_reminder_asked');
    if (alreadyAsked) return;

    // Show after 2.5 seconds
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (visible) {
      // GSAP entrance
      gsap.fromTo('.reminder-popup-card',
        { y: 60, opacity: 0, scale: 0.92 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5,
          ease: 'cubic-bezier(0.34,1.56,0.64,1)' }
      );
      gsap.fromTo('.reminder-popup-overlay',
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
    }
  }, [visible]);

  async function handleChoice(choice) {
    // choice = 'all' | 'specific'
    setSelectedChoice(choice);

    // Check if notifications supported
    if (!('Notification' in window)) {
      setStep('denied');
      localStorage.setItem('kickoff_reminder_asked', 'true');
      return;
    }

    if (Notification.permission === 'granted') {
      await applyChoice(choice);
      return;
    }

    // Ask permission
    setStep('permission');
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      await applyChoice(choice);
    } else {
      setStep('denied');
      localStorage.setItem('kickoff_reminder_asked', 'true');
    }
  }

  async function applyChoice(choice) {
    // Save choice permanently
    localStorage.setItem('kickoff_reminder_asked', 'true');

    // Make sure we import scheduleAllReminders dynamically if needed, 
    // or from the global scope/import. Wait, we need to import it here!
    const { scheduleAllReminders } = await import('../utils/reminderScheduler');

    if (choice === 'all') {
      localStorage.setItem('kickoff_remind_all', 'true');
      // Schedule ALL matches
      await scheduleAllReminders(matches, teamMap);
      setStep('success');
    } else {
      // 'specific' — just save preference, bell buttons handle rest
      localStorage.setItem('kickoff_remind_all', 'false');
      setStep('success');
    }
    // Auto close after 2.5 seconds
    setTimeout(() => dismissPopup(), 2500);
  }

  function dismissPopup() {
    gsap.to('.reminder-popup-card', {
      y: 40, opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in'
    });
    gsap.to('.reminder-popup-overlay', {
      opacity: 0, duration: 0.25,
      onComplete: () => {
        localStorage.setItem('kickoff_reminder_asked', 'true');
        setVisible(false);
      }
    });
  }

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="reminder-popup-overlay"
        onClick={step === 'choice' ? dismissPopup : undefined}
        style={{
          position: 'fixed', inset: 0, zIndex: 99998,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Wrapper to center content safely with GSAP */}
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        pointerEvents: 'none', // Let clicks pass through to overlay
      }}>
        {/* Card */}
        <div
          className="reminder-popup-card"
          style={{
            pointerEvents: 'auto', // Re-enable clicks on the card
            width: 'min(400px, calc(100vw - 32px))',
            background: '#0d0d0d',
            border: '1px solid rgba(0,255,135,0.25)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,135,0.1)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {/* Top accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#00FF87,#FFD700)' }} />

        {/* Content */}
        <div style={{ padding: '28px 28px 24px' }}>

          {/* ── STEP: CHOICE ─────────────────────────────── */}
          {step === 'choice' && (
            <>
              {/* Icon */}
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'rgba(0,255,135,0.1)',
                border: '1px solid rgba(0,255,135,0.2)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 30,
                marginBottom: 20,
              }}>
                🔔
              </div>

              <h2 style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 26, color: '#fff',
                letterSpacing: '0.04em',
                marginBottom: 8, lineHeight: 1.2,
              }}>
                NEVER MISS A KICKOFF
              </h2>

              <p style={{
                fontSize: 14, color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.65, marginBottom: 24,
              }}>
                Get notified <strong style={{ color: '#00FF87' }}>15 minutes before</strong> every
                World Cup match — even when this tab is closed or you're offline. 🇮🇳
              </p>

              {/* Stat pills */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { icon: '⚽', text: '104 matches' },
                  { icon: '📅', text: 'Jun 11 – Jul 19' },
                  { icon: '🕐', text: 'IST times' },
                ].map(p => (
                  <div key={p.text} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20, padding: '4px 10px',
                    fontSize: 12, color: 'rgba(255,255,255,0.5)',
                  }}>
                    <span>{p.icon}</span>
                    <span>{p.text}</span>
                  </div>
                ))}
              </div>

              {/* Choice buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => handleChoice('all')}
                  style={{
                    width: '100%', padding: '14px 20px',
                    background: '#00FF87', border: 'none',
                    borderRadius: 12, cursor: 'pointer',
                    fontSize: 15, fontWeight: 700,
                    color: '#050508', fontFamily: 'DM Sans, sans-serif',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span>🔔</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Remind Me — All Matches</div>
                    <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>
                      15 min alert before every match
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleChoice('specific')}
                  style={{
                    width: '100%', padding: '14px 20px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12, cursor: 'pointer',
                    fontSize: 15, fontWeight: 600,
                    color: '#fff', fontFamily: 'DM Sans, sans-serif',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                >
                  <span>🎯</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Choose Specific Matches</div>
                    <div style={{ fontSize: 11, fontWeight: 400,
                      color: 'rgba(255,255,255,0.45)' }}>
                      Tap the 🔔 on any match card
                    </div>
                  </div>
                </button>

                <button
                  onClick={dismissPopup}
                  style={{
                    background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.3)', fontSize: 13,
                    cursor: 'pointer', padding: '6px',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Not now
                </button>
              </div>
            </>
          )}

          {/* ── STEP: PERMISSION (waiting) ────────────────── */}
          {step === 'permission' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16,
                animation: 'bellRing 0.6s ease infinite alternate' }}>🔔</div>
              <h3 style={{ color: '#fff', marginBottom: 8, fontSize: 18 }}>
                Allow Notifications
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6 }}>
                Tap <strong style={{ color: '#fff' }}>"Allow"</strong> in the browser
                popup above to enable match reminders
              </p>
            </div>
          )}

          {/* ── STEP: SUCCESS ─────────────────────────────── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h3 style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 24, color: '#00FF87',
                letterSpacing: '0.04em', marginBottom: 8,
              }}>
                {selectedChoice === 'all' ? "YOU'RE ALL SET!" : 'READY TO GO!'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
                {selectedChoice === 'all'
                  ? `Reminders set for all ${matches.length} matches. We'll buzz you 15 min before each kickoff! 🏆`
                  : 'Tap the 🔔 bell on any match card to set a reminder for that specific match.'
                }
              </p>
            </div>
          )}

          {/* ── STEP: DENIED ──────────────────────────────── */}
          {step === 'denied' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
              <h3 style={{ color: '#fff', marginBottom: 8, fontSize: 16 }}>
                Notifications blocked
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6,
                marginBottom: 16 }}>
                To enable: tap the lock icon in your browser address bar
                → Notifications → Allow → Refresh page.
              </p>
              <button
                onClick={dismissPopup}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10, padding: '10px 24px',
                  color: '#fff', cursor: 'pointer',
                  fontSize: 13, fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
      </div>

      <style>{`
        @keyframes bellRing {
          from { transform: rotate(-15deg); }
          to   { transform: rotate(15deg); }
        }
      `}</style>
    </>
  );
}
