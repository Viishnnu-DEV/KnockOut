/* ============================================================
   usePWA.js — Service Worker registration + PWA hooks
   Handles: SW registration, install prompt, update detection
   ============================================================ */

import { useState, useEffect, useCallback, useRef } from 'react';

export function usePWA() {
  const [swStatus, setSwStatus] = useState('idle'); /* idle | registering | registered | error */
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const deferredPromptRef = useRef(null);
  const swRegistrationRef = useRef(null);

  /* ── Register service worker ─────────────────────────────── */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service workers not supported');
      return;
    }

    setSwStatus('registering');

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        swRegistrationRef.current = registration;
        setSwStatus('registered');
        console.log('[PWA] SW registered:', registration.scope);

        /* Detect update available */
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('[PWA] New SW version available');
              setUpdateAvailable(true);
            }
          });
        });

        /* Check for waiting SW (already updated but not activated) */
        if (registration.waiting) {
          setUpdateAvailable(true);
        }
      })
      .catch((err) => {
        console.error('[PWA] SW registration failed:', err);
        setSwStatus('error');
      });

    /* Reload when new SW takes over */
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  /* ── Install prompt ──────────────────────────────────────── */
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setIsInstallable(true);
      console.log('[PWA] Install prompt ready');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
      console.log('[PWA] App installed to homescreen');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    /* Check if already installed */
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /* ── Online/offline ──────────────────────────────────────── */
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* ── Actions ─────────────────────────────────────────────── */
  const installApp = useCallback(async () => {
    if (!deferredPromptRef.current) return false;
    deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    deferredPromptRef.current = null;
    setIsInstallable(false);
    return outcome === 'accepted';
  }, []);

  const applyUpdate = useCallback(() => {
    const reg = swRegistrationRef.current;
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, []);

  const requestBackgroundSync = useCallback(async () => {
    const reg = swRegistrationRef.current;
    if (reg?.sync) {
      try {
        await reg.sync.register('sync-live-scores');
        console.log('[PWA] Background sync registered');
        return true;
      } catch {
        console.warn('[PWA] Background sync not available');
        return false;
      }
    }
    return false;
  }, []);

  return {
    swStatus,
    updateAvailable,
    isInstallable,
    isInstalled,
    isOffline,
    installApp,
    applyUpdate,
    requestBackgroundSync,
    registration: swRegistrationRef.current,
  };
}
