// =====================================================================
// /api/teams.js - Vercel Serverless Function Proxy
// =====================================================================
// Proxies the HTTP API (http://worldcup26.ir:3050) to HTTPS.
// Teams data rarely changes mid-tournament, so we cache it heavily.
// =====================================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch('http://worldcup26.ir:3050/get/teams', {
      headers: {
        Authorization: req.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream API failed with status: ${response.status}`);
    }

    const data = await response.text();

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    responseHeaders.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(data, {
      status: 200,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('[API Proxy] Error fetching teams:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch teams data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
