/* ============================================================
   KICKOFF IST — Service Worker
   Handles: Offline caching, Background Sync, Push Notifications
   ============================================================ */

const SW_VERSION = 'kickoff-ist-v1.0.0';

const CACHE_STATIC = `${SW_VERSION}-static`;
const CACHE_API = `${SW_VERSION}-api`;
const CACHE_IMAGES = `${SW_VERSION}-images`;

/* All static assets to pre-cache on install */
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

/* API endpoints to cache */
const API_BASE = 'http://worldcup26.ir:3050';
const API_ENDPOINTS = [
  `${API_BASE}/get/games`,
  `${API_BASE}/get/teams`,
  `${API_BASE}/get/groups`,
  `${API_BASE}/get/stadiums`,
];

/* Background sync tag names */
const SYNC_LIVE_SCORES = 'sync-live-scores';
const SYNC_NOTIFICATIONS = 'sync-notifications';

/* ── INSTALL ───────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing KICKOFF IST Service Worker...');

  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] Static assets cached. Skipping waiting.');
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE ──────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker...');

  event.waitUntil(
    Promise.all([
      /* Delete old caches */
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('kickoff-ist-') && key !== CACHE_STATIC && key !== CACHE_API && key !== CACHE_IMAGES)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        )
      ),
      /* Claim all clients immediately */
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW] Activated. Now controlling all pages.');
      /* Schedule notification checks */
      scheduleNotificationCheck();
    })
  );
});

/* ── FETCH — Network-First for API, Cache-First for static ─── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET requests */
  if (request.method !== 'GET') return;

  /* Skip chrome-extension and other non-http */
  if (!url.protocol.startsWith('http')) return;

  /* API requests — Network first, fallback to cache */
  if (url.origin === new URL(API_BASE).origin) {
    event.respondWith(networkFirstWithCache(request, CACHE_API));
    return;
  }

  /* Static assets — Cache first, fallback to network */
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(cacheFirstWithNetwork(request, CACHE_IMAGES));
    return;
  }

  /* HTML navigation — Network first, fallback to cached index, then offline page */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  /* Default: network first */
  event.respondWith(networkFirstWithCache(request, CACHE_STATIC));
});

/* Network-first strategy */
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    /* Return offline JSON for API calls */
    if (request.url.includes(API_BASE)) {
      return new Response(
        JSON.stringify({ offline: true, message: 'Using cached data — you are offline' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    return caches.match('/offline.html');
  }
}

/* Cache-first strategy */
async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/* ── BACKGROUND SYNC ───────────────────────────────────────── */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync fired:', event.tag);

  if (event.tag === SYNC_LIVE_SCORES) {
    event.waitUntil(syncLiveScores());
  }

  if (event.tag === SYNC_NOTIFICATIONS) {
    event.waitUntil(checkAndFireNotifications());
  }
});

/* Sync live scores from API into IndexedDB */
async function syncLiveScores() {
  try {
    console.log('[SW] Syncing live scores...');

    /* Get stored auth token from IndexedDB */
    const token = await getFromIDB('kickoff_token');
    if (!token) {
      console.log('[SW] No auth token, skipping sync');
      return;
    }

    const response = await fetch(`${API_BASE}/get/games`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('API fetch failed');

    const data = await response.json();
    const games = Array.isArray(data) ? data : data.games || data.data || [];

    /* Store updated games in IndexedDB */
    await saveToIDB('cached_matches', games);
    await saveToIDB('last_sync', new Date().toISOString());

    console.log('[SW] Live scores synced:', games.length, 'matches');

    /* Notify all open clients about the update */
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
      client.postMessage({
        type: 'SCORES_UPDATED',
        count: games.length,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error('[SW] Live score sync failed:', err);
    throw err; /* Re-throw so browser retries */
  }
}

/* ── PUSH NOTIFICATIONS ────────────────────────────────────── */
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'KICKOFF IST ⚽',
    body: 'A match is about to start!',
    matchId: null,
    teamA: '',
    teamB: '',
    timeIST: '',
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error('[SW] Push data parse error:', e);
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: '/icons/notification-banner.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: `match-${data.matchId}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      matchId: data.matchId,
      url: `/?match=${data.matchId}`,
      teamA: data.teamA,
      teamB: data.teamB,
      timeIST: data.timeIST,
    },
    actions: [
      {
        action: 'view',
        title: '📺 View Match',
        icon: '/icons/action-view.png',
      },
      {
        action: 'dismiss',
        title: '✕ Dismiss',
        icon: '/icons/action-dismiss.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/* Handle notification click */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') return;

  const matchUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        /* Focus existing window if open */
        const existingClient = clients.find(
          (c) => c.url.includes(self.location.origin)
        );
        if (existingClient) {
          existingClient.focus();
          existingClient.postMessage({
            type: 'NAVIGATE_TO_MATCH',
            url: matchUrl,
            matchId: event.notification.data?.matchId,
          });
          return;
        }
        /* Open new window */
        return self.clients.openWindow(matchUrl);
      })
  );
});

/* Handle notification close */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed by user');
});

/* ── LOCAL NOTIFICATION SCHEDULING ────────────────────────── */
/* Called on activate and periodically to schedule upcoming match alerts */
async function scheduleNotificationCheck() {
  /* Check every 5 minutes if there are matches in next 15 mins */
  setInterval(checkAndFireNotifications, 5 * 60 * 1000);
  await checkAndFireNotifications();
}

async function checkAndFireNotifications() {
  try {
    const starredTeams = await getFromIDB('starred_teams') || [];
    if (!starredTeams.length) return;

    const matches = await getFromIDB('cached_matches') || [];
    if (!matches.length) return;

    const now = new Date();
    const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const upcomingMatches = matches.filter((match) => {
      const matchTime = new Date(match.local_date || match.datetime);
      const isInWindow = matchTime >= fiveMinsAgo && matchTime <= fifteenMinsFromNow;
      const isStarredTeam =
        starredTeams.includes(match.home_team_id) ||
        starredTeams.includes(match.away_team_id) ||
        starredTeams.includes(match.home_team?.name) ||
        starredTeams.includes(match.away_team?.name);
      const notAlreadyNotified = !match._notified;
      return isInWindow && isStarredTeam && notAlreadyNotified;
    });

    for (const match of upcomingMatches) {
      const homeTeam = match.home_team?.name || match.home_team_id || 'Team A';
      const awayTeam = match.away_team?.name || match.away_team_id || 'Team B';
      const matchTime = new Date(match.local_date || match.datetime);

      /* Convert to IST */
      const istTime = matchTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      await self.registration.showNotification(
        `⚽ Match in 15 minutes! — KICKOFF IST`,
        {
          body: `${homeTeam} vs ${awayTeam} kicks off at ${istTime} IST`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: [300, 100, 300, 100, 300],
          tag: `match-alert-${match.id}`,
          requireInteraction: true,
          data: {
            matchId: match.id,
            url: `/?match=${match.id}`,
            teamA: homeTeam,
            teamB: awayTeam,
            timeIST: istTime,
          },
          actions: [
            { action: 'view', title: '📺 View Match' },
            { action: 'dismiss', title: '✕ Later' },
          ],
        }
      );

      /* Mark as notified */
      match._notified = true;
    }

    /* Save back with _notified flags */
    if (upcomingMatches.length > 0) {
      await saveToIDB('cached_matches', matches);
    }
  } catch (err) {
    console.error('[SW] Notification check failed:', err);
  }
}

/* ── MESSAGE HANDLER — from React app ─────────────────────── */
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_MATCHES':
      saveToIDB('cached_matches', data.matches)
        .then(() => saveToIDB('kickoff_token', data.token))
        .then(() => event.source?.postMessage({ type: 'CACHE_SUCCESS' }))
        .catch((err) => event.source?.postMessage({ type: 'CACHE_ERROR', error: err.message }));
      break;

    case 'UPDATE_STARRED_TEAMS':
      saveToIDB('starred_teams', data.teams)
        .then(() => {
          console.log('[SW] Starred teams updated:', data.teams);
          event.source?.postMessage({ type: 'STARRED_UPDATED' });
        });
      break;

    case 'REQUEST_SYNC':
      self.registration.sync?.register(SYNC_LIVE_SCORES)
        .then(() => console.log('[SW] Background sync registered'))
        .catch((err) => {
          console.warn('[SW] Background sync not available, syncing directly');
          syncLiveScores();
        });
      break;

    case 'PREFETCH_MATCHES':
      prefetchMatchData(data.token);
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/* Pre-fetch and cache all match data */
async function prefetchMatchData(token) {
  if (!token) return;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [gamesRes, teamsRes, groupsRes, stadiumsRes] = await Promise.all([
      fetch(`${API_BASE}/get/games`, { headers }),
      fetch(`${API_BASE}/get/teams`, { headers }),
      fetch(`${API_BASE}/get/groups`, { headers }),
      fetch(`${API_BASE}/get/stadiums`, { headers }),
    ]);

    const [games, teams, groups, stadiums] = await Promise.all([
      gamesRes.json(), teamsRes.json(), groupsRes.json(), stadiumsRes.json(),
    ]);

    await Promise.all([
      saveToIDB('cached_matches', Array.isArray(games) ? games : games.games || []),
      saveToIDB('cached_teams', Array.isArray(teams) ? teams : teams.teams || []),
      saveToIDB('cached_groups', Array.isArray(groups) ? groups : groups.groups || []),
      saveToIDB('cached_stadiums', Array.isArray(stadiums) ? stadiums : stadiums.stadiums || []),
      saveToIDB('kickoff_token', token),
    ]);

    console.log('[SW] All match data pre-fetched and cached in IndexedDB');

    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) =>
      c.postMessage({ type: 'PREFETCH_COMPLETE', timestamp: new Date().toISOString() })
    );
  } catch (err) {
    console.error('[SW] Prefetch failed:', err);
  }
}

/* ── INDEXEDDB HELPERS ─────────────────────────────────────── */
const IDB_NAME = 'kickoff-ist-db';
const IDB_VERSION = 1;
const IDB_STORE = 'kickoff-store';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function saveToIDB(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.put(value, key);
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getFromIDB(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(key);
    req.onsuccess = (e) => resolve(e.target.result ?? null);
    req.onerror = (e) => reject(e.target.error);
  });
}
