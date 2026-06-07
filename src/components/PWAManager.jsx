/* ============================================================
   PWAManager.jsx — Install banner, update toast, offline bar
   Drop this once into App.jsx — it handles everything
   ============================================================ */

import { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function PWAManager({ matches = [], starredTeams = [], starredMatches = [], teamMap = {} }) {
  const {
    isInstallable,
    isInstalled,
    isOffline,
    updateAvailable,
    installApp,
    applyUpdate,
    requestBackgroundSync,
  } = usePWA();

  const {
    permission,
    requestPermission,
    scheduleMatchAlerts,
  } = usePushNotifications();

  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(() => {
    try { return sessionStorage.getItem('kickoff_install_dismissed') === 'true'; } catch { return false; }
  });
  const [notifDismissed, setNotifDismissed] = useState(() => {
    try { return sessionStorage.getItem('kickoff_notif_dismissed') === 'true'; } catch { return false; }
  });
  const [syncStatus, setSyncStatus] = useState('');

  /* Show install banner after 3s for non-installed users (even without native prompt) */
  useEffect(() => {
    if (installDismissed || isInstalled) return;
    const timer = setTimeout(() => setShowInstallBanner(true), 3000);
    return () => clearTimeout(timer);
  }, [installDismissed, isInstalled]);

  /* Show update toast */
  useEffect(() => {
    if (updateAvailable) {
      setTimeout(() => setShowUpdateToast(true), 0);
    }
  }, [updateAvailable]);

  /* Schedule alerts when starred teams or matches change */
  useEffect(() => {
    if (permission === 'granted' && matches.length) {
      scheduleMatchAlerts(matches, starredTeams, starredMatches, teamMap);
    }
  }, [matches, starredTeams, starredMatches, permission, scheduleMatchAlerts, teamMap]);

  /* Post starred data to SW on mount & trigger immediate notification check */
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    if (!matches.length) return;

    // Ensure SW has latest starred data for background scheduling
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_STARRED_TEAMS',
      data: { teams: starredTeams },
    });
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_STARRED_MATCHES',
      data: { matches: starredMatches },
    });
    // Trigger an immediate notification check in the SW
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATIONS',
    });
  }, [matches, starredTeams, starredMatches]);

  /* Request background sync when online */
  useEffect(() => {
    if (!isOffline) {
      requestBackgroundSync();
    }
  }, [isOffline, requestBackgroundSync]);

  /* ── Handlers ──────────────────────────────────────────────── */
  const handleInstall = async () => {
    const accepted = await installApp();
    setShowInstallBanner(false);
    if (accepted && permission === 'default') {
      setTimeout(() => setShowNotifPrompt(true), 2000);
    }
  };

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    setShowNotifPrompt(false);
    if (result === 'granted' && matches.length) {
      const count = await scheduleMatchAlerts(matches, starredTeams, starredMatches, teamMap);
      if (count > 0) {
        setSyncStatus(`✅ ${count} match alerts scheduled!`);
        setTimeout(() => setSyncStatus(''), 4000);
      }
    }
  };

  return (
    <>
      {/* ── Offline bar ───────────────────────────────────────── */}
      {isOffline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: '#1a1a1a',
          borderBottom: '1px solid rgba(255,160,0,0.4)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 13,
          color: '#FFB300',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          <span>📡</span>
          <span>You're offline — showing cached IST schedule</span>
        </div>
      )}

      {/* ── Update available toast ─────────────────────────────── */}
      {showUpdateToast && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 99998,
          background: '#0d0d0d',
          border: '1px solid rgba(0,255,135,0.3)',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          maxWidth: 300,
          fontFamily: 'DM Sans, sans-serif',
          animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <span style={{ fontSize: 20 }}>🔄</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 2 }}>
              Update available
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              New match data ready
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={applyUpdate}
              style={{
                background: '#00FF87',
                color: '#050508',
                border: 'none',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Update
            </button>
            <button
              onClick={() => setShowUpdateToast(false)}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.4)',
                border: 'none',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* ── Install banner ─────────────────────────────────────── */}
      {showInstallBanner && !isInstalled && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99997,
          background: '#0a0a0a',
          borderTop: '1px solid rgba(0,255,135,0.2)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: 'DM Sans, sans-serif',
          animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#00FF87',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}>
            ⚽
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
              Add KICKOFF IST to homescreen
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
              {isInstallable
                ? 'Get match alerts & offline access'
                : 'Tap Install or use browser menu → Add to Home Screen'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => {
                setShowInstallBanner(false);
                setInstallDismissed(true);
                try { sessionStorage.setItem('kickoff_install_dismissed', 'true'); } catch { /* ignore */ }
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Not now
            </button>
            <button
              onClick={isInstallable ? handleInstall : () => setShowInstallBanner(false)}
              style={{
                background: '#00FF87',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                color: '#050508',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {isInstallable ? 'Install' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* ── Notification permission prompt ─────────────────────── */}
      {showNotifPrompt && permission === 'default' && (
        <div style={{
          position: 'fixed',
          bottom: showInstallBanner ? 100 : 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99996,
          background: '#0d0d0d',
          border: '1px solid rgba(0,255,135,0.25)',
          borderRadius: 16,
          padding: '20px 24px',
          width: 'min(380px, calc(100vw - 32px))',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          fontFamily: 'DM Sans, sans-serif',
          animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <button
            onClick={() => {
              setShowNotifPrompt(false);
              setNotifDismissed(true);
              try { sessionStorage.setItem('kickoff_notif_dismissed', 'true'); } catch { /* ignore */ }
            }}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>

          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
            Never miss a match
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.5 }}>
            Get alerts 15 minutes before your starred teams kick off — even when this tab is closed.
          </div>

          {starredTeams.length > 0 && (
            <div style={{
              background: 'rgba(0,255,135,0.06)',
              border: '1px solid rgba(0,255,135,0.15)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 14,
            }}>
              ⭐ You have {starredTeams.length} starred team{starredTeams.length > 1 ? 's' : ''} — we'll alert you for their matches
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setShowNotifPrompt(false);
                setNotifDismissed(true);
                try { sessionStorage.setItem('kickoff_notif_dismissed', 'true'); } catch { /* ignore */ }
              }}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '10px',
                fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Maybe later
            </button>
            <button
              onClick={handleEnableNotifications}
              style={{
                flex: 2,
                background: '#00FF87',
                border: 'none',
                borderRadius: 8,
                padding: '10px',
                fontSize: 13,
                fontWeight: 600,
                color: '#050508',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Enable Alerts 🔔
            </button>
          </div>
        </div>
      )}

      {/* ── Sync status toast ─────────────────────────────────── */}
      {syncStatus && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 16,
          zIndex: 99999,
          background: '#0d1a11',
          border: '1px solid rgba(0,255,135,0.3)',
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 13,
          color: '#00FF87',
          fontFamily: 'DM Sans, sans-serif',
          animation: 'slideDown 0.3s ease',
          fontWeight: 500,
        }}>
          {syncStatus}
        </div>
      )}

      {/* ── Animations ───────────────────────────────────────── */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
