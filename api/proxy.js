export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    
    // The path will be something like /api/games
    // We want to proxy to http://worldcup26.ir:3050/get/games
    // If the path is /api/get/games, we proxy to http://worldcup26.ir:3050/get/games
    let path = url.pathname.replace(/^\/api/, '');
    
    // If they omitted /get/, we can auto-prepend it if it's a known endpoint
    if (!path.startsWith('/get/')) {
      if (['/games', '/teams', '/groups', '/stadiums'].includes(path)) {
        path = `/get${path}`;
      }
    }

    const targetUrl = `http://worldcup26.ir:3050${path}${url.search}`;
    
    // Clone headers, but remove host and connection headers
    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.delete('connection');
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
    });
    
    const responseHeaders = new Headers(response.headers);
    
    // Set Vercel Edge Cache headers
    // s-maxage=60: cache on edge for 60 seconds
    // stale-while-revalidate=120: serve stale cache while fetching fresh data in background
    responseHeaders.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    // Ensure CORS headers are set
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
