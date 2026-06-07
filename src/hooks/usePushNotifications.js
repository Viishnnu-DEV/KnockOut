/* ============================================================
   usePushNotifications.js — Push notification management
   Handles: permission, subscription, local scheduling
   ============================================================ */

import { useState, useEffect, useCallback } from 'react';
import { idbGet, idbSet } from './useIndexedDB';

/* Replace with your actual VAPID public key from web-push */
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [subscription, setSubscription] = useState(null);
  const [isSupported] = useState(
    () => 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  );
  const [scheduledCount, setScheduledCount] = useState(0);

  /* ── Show local notification via SW ─────────────────────── */
  const showLocalNotification = useCallback(async ({ title, body, matchId, teamA, teamB, timeIST }) => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: `match-${matchId}`,
        requireInteraction: true,
        data: { matchId, url: `/?match=${matchId}`, teamA, teamB, timeIST },
        actions: [
          { action: 'view', title: '📺 View Match' },
          { action: 'dismiss', title: '✕ Later' },
        ],
      });
    } catch {
      /* Fallback to Notification API */
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icons/icon-192x192.png' });
      }
    }
  }, []);

  /* ── Subscribe to push ───────────────────────────────────── */
  const subscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;

      /* Check if VAPID key is configured */
      if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') {
        console.warn('[PUSH] VAPID key not configured — using local notifications only');
        return null;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setSubscription(sub);
      await idbSet('push_subscription', JSON.stringify(sub));

      console.log('[PUSH] Subscribed:', sub.endpoint);
      return sub;
    } catch (err) {
      console.error('[PUSH] Subscribe failed:', err);
      return null;
    }
  }, []);

  /* ── Unsubscribe ─────────────────────────────────────────── */
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    await subscription.unsubscribe();
    setSubscription(null);
    await idbSet('push_subscription', null);
    console.log('[PUSH] Unsubscribed');
  }, [subscription]);

  /* ── Request permission ──────────────────────────────────── */
  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'unsupported';

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribe();
      }

      return result;
    } catch (err) {
      console.error('[PUSH] Permission request failed:', err);
      return 'denied';
    }
  }, [isSupported, subscribe]);

  /* ── Schedule local notifications for starred matches ─────── */
  const scheduleMatchAlerts = useCallback(
    async (matches, starredTeams, starredMatches = [], teamMap = {}) => {
      if (permission !== 'granted') return 0;

      const now = new Date();
      let scheduled = 0;

      /* Clear previously scheduled timeouts */
      const existingTimers = await idbGet('notification_timers') || [];
      existingTimers.forEach((id) => clearTimeout(id));

      const newTimers = [];

      for (const match of matches) {
        // Use timezone-safe timestamps if available
        const matchTime = match.utcTimestamp 
          ? new Date(match.utcTimestamp) 
          : new Date(match.utcDateString || match.local_date || match.datetime);

        if (matchTime <= now) continue; /* Past matches */

        // Support both parsed match format and raw api match format
        const homeId = match.teamA || match.home_team_id || match.home_team?.name;
        const awayId = match.teamB || match.away_team_id || match.away_team?.name;
        const isStarred =
          starredTeams.includes(homeId) || 
          starredTeams.includes(awayId) || 
          starredMatches.includes(match.id);

        if (!isStarred) continue;

        /* Schedule notification 15 mins before kickoff */
        const alertTime = new Date(matchTime.getTime() - 15 * 60 * 1000);
        const delay = alertTime.getTime() - now.getTime();

        if (delay < 0) continue; /* Already past alert time */
        if (delay > 7 * 24 * 60 * 60 * 1000) continue; /* Skip > 7 days out */

        const homeTeam = teamMap[homeId]?.name || match.home_team?.name || homeId;
        const awayTeam = teamMap[awayId]?.name || match.away_team?.name || awayId;

        const istTime = matchTime.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const timerId = setTimeout(async () => {
          await showLocalNotification({
            title: `⚽ Match Alert — KICKOFF IST`,
            body: `${homeTeam} vs ${awayTeam} kicks off in 15 minutes at ${istTime} IST!`,
            matchId: match.id,
            teamA: homeTeam,
            teamB: awayTeam,
            timeIST: istTime,
          });
        }, delay);

        newTimers.push(timerId);
        scheduled++;
      }

      await idbSet('notification_timers', newTimers);
      setScheduledCount(scheduled);

      console.log(`[PUSH] Scheduled ${scheduled} match alerts`);
      return scheduled;
    },
    [permission, showLocalNotification]
  );

  /* ── Load subscription on mount ───────────────────────────── */
  useEffect(() => {
    if (isSupported) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setSubscription(sub);
        });
      });
    }
  }, [isSupported]);

  return {
    permission,
    isSupported,
    subscription,
    scheduledCount,
    requestPermission,
    subscribe,
    unsubscribe,
    scheduleMatchAlerts,
    showLocalNotification,
  };
}
