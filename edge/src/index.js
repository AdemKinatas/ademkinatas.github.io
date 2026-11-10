// Serves ademkinatas.com from the GitHub Pages site, without moving it.
//
// The store listings and AdMob name ademkinatas.github.io as the developer website, and an
// app-ads.txt crawler does not follow a redirect to another domain. So github.io keeps no
// custom domain and stays as it is; this Worker answers for ademkinatas.com with the same files.
const ORIGIN = 'https://ademkinatas.github.io';

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const upstream = await fetch(ORIGIN + url.pathname + url.search, {
      method: request.method,
      redirect: 'manual',
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    const headers = new Headers(upstream.headers);
    // GitHub adds the trailing slash with a redirect to its own host; keep visitors here.
    const location = headers.get('Location');
    if (location?.startsWith(ORIGIN)) headers.set('Location', location.replace(ORIGIN, url.origin));
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
