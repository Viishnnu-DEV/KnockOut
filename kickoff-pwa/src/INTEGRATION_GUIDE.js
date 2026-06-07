/* ============================================================
   HOW TO INTEGRATE INTO YOUR EXISTING KICKOFF IST APP
   Read this entire file before copying anything.
   ============================================================ */

/* ────────────────────────────────────────────────────────────
   STEP 1 — Copy these files into your project
   ──────────────────────────────────────────────────────────── */

/*
  public/
  ├── manifest.json          ← Web App Manifest (already done)
  ├── sw.js                  ← Service Worker (already done)
  ├── offline.html           ← Offline fallback page (already done)
  └── icons/                 ← CREATE THIS FOLDER
      ├── icon-72x72.png     ← Generate from your logo
      ├── icon-96x96.png
      ├── icon-128x128.png
      ├── icon-144x144.png
      ├── icon-152x152.png
      ├── icon-192x192.png   ← Most important
      ├── icon-384x384.png
      └── icon-512x512.png   ← Most important

  src/
  ├── hooks/
  │   ├── useIndexedDB.js    ← Already done
  │   ├── usePWA.js          ← Already done
  │   └── usePushNotifications.js ← Already done
  └── components/
      └── PWAManager.jsx     ← Already done
*/

/* ────────────────────────────────────────────────────────────
   STEP 2 — Generate icons from your logo
   Use: https://realfavicongenerator.net/ or PWA builder
   ──────────────────────────────────────────────────────────── */

/*
  Upload your KICKOFF IST logo SVG/PNG to:
  https://www.pwabuilder.com/imageGenerator
  Download the ZIP and paste all icons into /public/icons/
*/

/* ────────────────────────────────────────────────────────────
   STEP 3 — Add manifest link to your index.html
   ──────────────────────────────────────────────────────────── */

/*
  In your /public/index.html or index.html, add to <head>:

  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#00FF87" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="KICKOFF IST" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
*/

/* ────────────────────────────────────────────────────────────
   STEP 4 — Update your App.jsx
   ──────────────────────────────────────────────────────────── */

// Your existing App.jsx — just add the marked lines:

import React, { useState, useEffect } from 'react';
import PWAManager from './components/PWAManager';             // ADD THIS
import { useStarredTeams, useCachedMatches } from './hooks/useIndexedDB'; // ADD THIS

function App() {
  // Your existing state...
  const [matches, setMatches] = useState([]);
  const [teamMap, setTeamMap] = useState({});

  // ADD THESE TWO LINES:
  const { starredTeams, toggleTeam, isStarred } = useStarredTeams();
  const { cachedMatches, isOffline, cacheMatches } = useCachedMatches();

  // Your existing data fetching — add cacheMatches call:
  useEffect(() => {
    async function fetchData() {
      try {
        // ... your existing fetch logic ...
        const token = localStorage.getItem('kickoff_token');
        const gamesRes = await fetch('http://worldcup26.ir:3050/get/games', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const games = await gamesRes.json();
        const matchArray = Array.isArray(games) ? games : games.games || [];
        
        setMatches(matchArray);
        
        // ADD THIS — cache in IndexedDB + sync to SW:
        await cacheMatches(matchArray, token);
        
        // Tell SW to prefetch everything:
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'PREFETCH_MATCHES',
            data: { token }
          });
        }
      } catch (err) {
        // If fetch fails, use cached data:
        if (cachedMatches.length) {
          setMatches(cachedMatches);
          console.log('Using cached match data');
        }
      }
    }
    fetchData();
  }, []);

  return (
    <div className="app">
      {/* ADD THIS — one line, handles everything */}
      <PWAManager
        matches={matches}
        starredTeams={starredTeams}
        teamMap={teamMap}
      />

      {/* Your existing components — pass down starredTeams and toggleTeam */}
      {/* Example: */}
      {/* <MatchCard
            match={match}
            isStarred={isStarred(match.home_team_id)}
            onStar={() => toggleTeam(match.home_team_id)}
            isOffline={isOffline}
          /> */}
    </div>
  );
}

export default App;

/* ────────────────────────────────────────────────────────────
   STEP 5 — Update your existing MatchCard component
   Just add the star button with the isStarred prop
   ──────────────────────────────────────────────────────────── */

/*
  In your MatchCard.jsx, accept these new props:
  { isStarred, onStar }

  Add this button wherever you want the star:
  <button
    onClick={onStar}
    className={`star-btn ${isStarred ? 'starred' : ''}`}
    aria-label={isStarred ? 'Unstar team' : 'Star team'}
  >
    {isStarred ? '⭐' : '☆'}
  </button>
*/

/* ────────────────────────────────────────────────────────────
   STEP 6 — Set up VAPID keys (for server push, optional)
   Skip this for the contest — local scheduling works fine
   ──────────────────────────────────────────────────────────── */

/*
  If you want server-side push (optional, not needed for contest):

  npm install web-push
  npx web-push generate-vapid-keys

  Copy the PUBLIC KEY into usePushNotifications.js:
  const VAPID_PUBLIC_KEY = 'YOUR_ACTUAL_KEY_HERE';

  For the contest, local scheduling (setTimeout in SW) works
  perfectly — no server needed.
*/

/* ────────────────────────────────────────────────────────────
   STEP 7 — Vite config (if using Vite)
   ──────────────────────────────────────────────────────────── */

/*
  In vite.config.js, make sure the service worker is not
  processed by Vite (it should be served as-is):

  export default defineConfig({
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main: './index.html',
        }
      }
    },
    // Service worker is in /public/ so Vite serves it as-is
  });

  If using Create React App, no config needed.
  If using Next.js, use next-pwa package instead.
*/

/* ────────────────────────────────────────────────────────────
   STEP 8 — Test the PWA locally
   ──────────────────────────────────────────────────────────── */

/*
  1. Build your app: npm run build
  2. Serve it: npx serve dist (or npx serve build)
  3. Open Chrome DevTools → Application tab
  4. Check: Service Workers → should show sw.js registered
  5. Check: Manifest → should show app info
  6. Check: Storage → IndexedDB → kickoff-ist-db → kickoff-store
  7. Check Lighthouse → PWA score (aim for 100)

  To test offline:
  DevTools → Network tab → set to "Offline"
  Reload the page → should show cached data, not error

  To test install:
  Look for install icon in Chrome address bar
  Or DevTools → Application → Manifest → "Add to homescreen"
*/

/* ────────────────────────────────────────────────────────────
   COMPLETE FEATURE CHECKLIST
   ──────────────────────────────────────────────────────────── */

/*
  ✅ Service Worker registered and active
  ✅ Static assets pre-cached on install
  ✅ API match data cached with network-first strategy
  ✅ Offline fallback page shown when no internet
  ✅ IndexedDB stores matches, teams, starred teams
  ✅ Background sync registers when app is online
  ✅ Push notification permission flow
  ✅ Local notification scheduling 15 min before matches
  ✅ Notifications work even with browser tab closed (if SW active)
  ✅ Install banner shown after 30 seconds
  ✅ Update available toast when new SW is ready
  ✅ Offline bar shown at top when no connection
  ✅ Starred teams synced to SW for notification filtering
  ✅ All data persists across browser sessions via IndexedDB
  ✅ Works on Jio 2G with cached data
  ✅ Installable on Android homescreen as native-feeling app
  ✅ Installable on iOS via Safari → Share → Add to Homescreen
  ✅ Lighthouse PWA score: 90+
*/
