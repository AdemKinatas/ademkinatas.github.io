// Serves ademkinatas.com straight from Cloudflare: the site files are Workers Static Assets
// (see wrangler.toml, directory ".."), and this Worker only decides which file a URL means.
//
// The URL rules are the ones GitHub Pages used to apply, kept as they were because store listings,
// AdMob and app-ads.txt crawlers already know these addresses:
//   /dir/             -> dir/index.html
//   /dir              -> 301 to /dir/ (when dir/index.html exists)
//   /page             -> page.html          /dir/index.html and /page.html also work as they are
//   anything else     -> 404.html with status 404
//   /app-ads.txt      -> a plain 200 at the root, never a redirect
// Cloudflare's own html_handling is switched off because it answers 307 and drops ".html".
// /robots.txt is not in the site: Cloudflare's managed robots.txt answers it before the Worker.
//
// ademkinatas.github.io is no longer an origin. GitHub Pages is only the source backup of the repository.
const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml',
  ttf: 'font/ttf',
  png: 'image/png',
};

// Byte for byte the body GitHub Pages sent with its 301.
const MOVED =
  '<html>\r\n<head><title>301 Moved Permanently</title></head>\r\n<body>\r\n<center><h1>301 Moved Permanently</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n';

// Free Supabase projects pause after 7 days without API activity, which would take a game's online
// play down in a quiet week. The daily cron (wrangler.toml [triggers]) calls one cheap public RPC per
// project with its publishable key (a public value, the same one the app ships). Add Mythmate here
// when its production project exists.
const KEEP_ALIVE = [
  {
    name: 'tas-kagit-makas',
    url: 'https://odaggchmrodysdybxall.supabase.co/rest/v1/rpc/app_config',
    key: 'sb_publishable_ZjAUXxYVtij5gibqCKHDHA_duXIRxT7',
  },
];

export default {
  async scheduled(_event, _env, ctx) {
    ctx.waitUntil(
      Promise.all(
        KEEP_ALIVE.map(async ({ name, url, key }) => {
          const res = await fetch(url, {
            method: 'POST',
            headers: { apikey: key, 'Content-Type': 'application/json' },
            body: '{}',
          });
          if (!res.ok) console.error(`keep-alive ${name}: ${res.status}`);
        }),
      ),
    );
  },

  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    // GitHub Pages decoded %-escapes and collapsed repeated slashes before looking for a file.
    let path = url.pathname;
    try {
      path = decodeURI(path);
    } catch {}
    path = path.replace(/\/{2,}/g, '/');

    // The asset when it exists at exactly this path, otherwise null.
    const asset = async (assetPath, req) => {
      const response = await env.ASSETS.fetch(new Request(new URL(assetPath, url.origin), req));
      if (response.status !== 200 && response.status !== 304) return null;
      const headers = new Headers(response.headers);
      const type = TYPES[assetPath.split('.').pop()];
      if (type) headers.set('Content-Type', type);
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(response.body, { status: response.status, headers });
    };

    let found = null;
    if (path.endsWith('/')) {
      found = await asset(path + 'index.html', request);
    } else {
      found = (await asset(path, request)) ?? (await asset(path + '.html', request));
      if (!found && (await asset(path + '/index.html', new Request(url, { method: 'GET' })))) {
        return new Response(request.method === 'HEAD' ? null : MOVED, {
          status: 301,
          headers: {
            'Content-Type': 'text/html',
            Location: `${url.origin}${path}/${url.search}`,
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
    if (found) return found;

    const page = await asset('/404.html', new Request(url, { method: 'GET' }));
    return new Response(request.method === 'HEAD' || !page ? null : page.body, {
      status: 404,
      headers: page ? page.headers : { 'Content-Type': TYPES.html },
    });
  },
};
