import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  try {
    // Requires Vercel environment variables for service account
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle escaped newlines in private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export default async function handler(req, res) {
  // Optional: Only allow requests from Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    // For local testing you might want to bypass this, but for production:
    // return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = admin.firestore();
    
    // 1. Fetch upcoming matches
    // In a real scenario, you'd query your games API or a cached Firestore collection.
    // For this demo, let's fetch from the API proxy
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const apiUrl = `${protocol}://${host}/api/proxy/games`;
    
    const gamesRes = await fetch(apiUrl);
    const data = await gamesRes.json();
    const games = Array.isArray(data) ? data : data.games || data.data || [];
    
    if (!games.length) {
      return res.status(200).json({ message: 'No games found.' });
    }

    const now = new Date();
    const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Find matches starting in exactly ~15 mins
    const upcomingMatches = games.filter((match) => {
      const matchTime = match.utcTimestamp 
        ? new Date(match.utcTimestamp) 
        : new Date(match.utcDateString || match.local_date || match.datetime);
      
      // Match is in the 15-min window
      return matchTime >= fiveMinsAgo && matchTime <= fifteenMinsFromNow;
    });

    if (!upcomingMatches.length) {
      return res.status(200).json({ message: 'No matches in the next 15 minutes.' });
    }

    // 2. For each match, find subscribed users
    // For simplicity, we'll fetch all tokens. In production, 
    // you'd query users who starred these specific teams.
    const tokensSnapshot = await db.collection('fcm_tokens').get();
    const allTokens = tokensSnapshot.docs.map(d => d.data().token);

    if (!allTokens.length) {
      return res.status(200).json({ message: 'No FCM tokens registered.' });
    }

    let pushCount = 0;

    for (const match of upcomingMatches) {
      const homeTeam = match.teamA || match.home_team?.name || match.home_team_id || 'Team A';
      const awayTeam = match.teamB || match.away_team?.name || match.away_team_id || 'Team B';
      const matchTime = match.utcTimestamp 
        ? new Date(match.utcTimestamp) 
        : new Date(match.utcDateString || match.local_date || match.datetime);

      const istTime = matchTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Construct FCM Data Payload (data-only triggers sw.js push event silently so we can show custom UI)
      const payload = {
        data: {
          title: 'Match Starting Soon: KICKOFF IST',
          body: `${homeTeam} vs ${awayTeam} kicks off at ${istTime} IST`,
          matchId: String(match.id),
          teamA: homeTeam,
          teamB: awayTeam,
          timeIST: istTime,
        }
      };

      // Send to all registered tokens (Multicast)
      // Max 500 per batch
      const maxBatch = 500;
      for (let i = 0; i < allTokens.length; i += maxBatch) {
        const batchTokens = allTokens.slice(i, i + maxBatch);
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batchTokens,
          data: payload.data
        });
        pushCount += response.successCount;
      }
    }

    return res.status(200).json({ success: true, pushed: pushCount });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: error.message });
  }
}
