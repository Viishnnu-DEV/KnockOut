/* ============================================================
   useIndexedDB.js — IndexedDB React hook for KICKOFF IST
   Handles: match caching, starred teams, user prefs, sync state
   ============================================================ */

import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'kickoff-ist-db';
const DB_VERSION = 1;
const STORE_NAME = 'kickoff-store';

/* ── Open database ─────────────────────────────────────────── */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log('[IDB] Object store created');
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => {
      console.error('[IDB] Open failed:', e.target.error);
      reject(e.target.error);
    };
  });
}

/* ── Core get/set/delete ───────────────────────────────────── */
export async function idbGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = (e) => resolve(e.target.result ?? null);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('[IDB] Get error:', err);
    return null;
  }
}

export async function idbSet(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('[IDB] Set error:', err);
    return false;
  }
}

export async function idbDelete(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    return false;
  }
}

/* ── Main hook ─────────────────────────────────────────────── */
export function useIndexedDB() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    openDB()
      .then(() => setIsReady(true))
      .catch((err) => console.error('[IDB] Init failed:', err));
  }, []);

  return { isReady, idbGet, idbSet, idbDelete };
}

/* ── Starred teams hook ────────────────────────────────────── */
export function useStarredTeams() {
  const [starredTeams, setStarredTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    idbGet('starred_teams').then((teams) => {
      if (teams) setStarredTeams(teams);
      setLoading(false);
    });
  }, []);

  const toggleTeam = useCallback(async (teamId) => {
    setStarredTeams((prev) => {
      const updated = prev.includes(teamId)
        ? prev.filter((t) => t !== teamId)
        : prev.length < 3
        ? [...prev, teamId]
        : prev; /* Max 3 teams */

      /* Save to IDB */
      idbSet('starred_teams', updated);

      /* Sync to service worker */
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'UPDATE_STARRED_TEAMS',
          data: { teams: updated },
        });
      }

      return updated;
    });
  }, []);

  const isStarred = useCallback(
    (teamId) => starredTeams.includes(teamId),
    [starredTeams]
  );

  return { starredTeams, toggleTeam, isStarred, loading };
}

/* ── Cached matches hook ───────────────────────────────────── */
export function useCachedMatches() {
  const [cachedMatches, setCachedMatches] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    /* Load from IDB on mount */
    Promise.all([
      idbGet('cached_matches'),
      idbGet('last_sync'),
    ]).then(([matches, sync]) => {
      if (matches) setCachedMatches(matches);
      if (sync) setLastSync(new Date(sync));
    });

    /* Online/offline listeners */
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    /* Listen for SW updates */
    const handleSWMessage = (e) => {
      if (e.data?.type === 'SCORES_UPDATED') {
        idbGet('cached_matches').then((matches) => {
          if (matches) setCachedMatches(matches);
        });
        setLastSync(new Date(e.data.timestamp));
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);

  const cacheMatches = useCallback(async (matches, token) => {
    await idbSet('cached_matches', matches);
    await idbSet('last_sync', new Date().toISOString());
    setCachedMatches(matches);
    setLastSync(new Date());

    /* Tell SW to cache too */
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_MATCHES',
        data: { matches, token },
      });
    }
  }, []);

  return { cachedMatches, lastSync, isOffline, cacheMatches };
}
