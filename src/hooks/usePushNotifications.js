/* ============================================================
   usePushNotifications.js — Push notification management
   Handles: permission, subscription, local scheduling
   ============================================================ */

import { useState, useEffect, useCallback } from 'react';
import { idbGet, idbSet } from './useIndexedDB';
import { messaging, db, auth } from '../lib/firebase';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

/* The VAPID key will be provided via env or hardcoded by the user */
const VAPID_PUBLIC_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_PUBLIC_KEY_HERE';

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

  /* ── Subscribe to push (FCM) ───────────────────────────────────── */
  const subscribe = useCallback(async () => {
    try {
      if (!messaging) {
        console.warn('[PUSH] FCM not supported or initialized');
        return null;
      }
      
      const reg = await navigator.serviceWorker.ready;

      if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') {
        console.warn('[PUSH] VAPID key not configured — push will not work');
        return null;
      }

      const currentToken = await getToken(messaging, { 
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: reg
      });

      if (currentToken) {
        setSubscription(currentToken);
        await idbSet('fcm_token', currentToken);
        
        // Save to Firestore
        const uid = auth?.currentUser?.uid || 'anonymous';
        await setDoc(doc(db, 'fcm_tokens', currentToken), {
          token: currentToken,
          uid: uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log('[PUSH] FCM Token obtained:', currentToken);
        return currentToken;
      } else {
        console.warn('[PUSH] No registration token available.');
        return null;
      }
    } catch (err) {
      console.error('[PUSH] Subscribe failed:', err);
      return null;
    }
  }, []);

  /* ── Unsubscribe ─────────────────────────────────────────── */
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    try {
      await deleteDoc(doc(db, 'fcm_tokens', subscription));
    } catch (e) {
      console.error("Failed to delete token from DB", e);
    }
    setSubscription(null);
    await idbSet('fcm_token', null);
    console.log('[PUSH] Unsubscribed from FCM');
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
    idbGet('fcm_token').then(token => {
      if (token) setSubscription(token);
    });
  }, []);

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
