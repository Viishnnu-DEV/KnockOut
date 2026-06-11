// =====================================================================
// /api/matches.js - Vercel Serverless Function Proxy
// =====================================================================
// Proxies the HTTP API (http://worldcup26.ir:3050) to HTTPS so that
// browsers don't block requests with "Mixed Content" security errors.
// Adds Cache-Control headers to serve cached data from the edge,
// preventing your HTTP API from crashing under high load.
// =====================================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Forward the request to your actual HTTP API
    const response = await fetch('http://worldcup26.ir:3050/get/games', {
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
    responseHeaders.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(data, {
      status: 200,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('[API Proxy] Error fetching matches:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch live matches' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
