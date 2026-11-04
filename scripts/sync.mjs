// Brings every game's legal and support pages under one GitHub Pages site.
//   node scripts/sync.mjs            publish only the games whose pages are complete
//   node scripts/sync.mjs --drafts   also copy unfinished games, for a local look only
//
// Each game keeps its own generator in its own project. This script does not run or
// change them: it copies their last build, moves root links under /<slug>/, and keeps
// a game out until no placeholder is left in its pages.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS = resolve(ROOT, '..');
const DRAFTS = process.argv.includes('--drafts');
const studio = JSON.parse(readFileSync(join(ROOT, 'studio.json'), 'utf8'));

const TEXT = new Set(['.html', '.css', '.js', '.xml', '.txt', '.json', '.webmanifest', '.svg']);
// Files that only mean something at a domain's root, or only on another host.
const DROP = new Set(['CNAME', 'app-ads.txt', '_headers', '_redirects', 'robots.txt', '.nojekyll']);
const PLACEHOLDERS = [
  /\[[\p{Lu}][\p{Lu}\d /.,_-]{2,}\]/gu,
  /\[[a-z]+(?:\.[a-zA-Z]+)+\]/g,
  // A page that talks to a server on the developer's own machine.
  /https?:\/\/(?:127\.0\.0\.1|localhost)\b[:/\d]*/g,
  /\bTODO\b/g,
  /\bPLACEHOLDER\b/g,
  /(?<!@)\bexample\.com\b/g,
  /pub-X{6,}/g,
];

const escapeHtml = text =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const walk = dir =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Root-relative links point at the game's old domain root; here that root is /<slug>/.
const rebase = (text, game) => {
  const base = `/${game.slug}/`;
  let out = text;
  if (game.domain) {
    out = out.replace(new RegExp(`https?://(www\\.)?${escapeRegex(game.domain)}`, 'g'), `${studio.site}/${game.slug}`);
  }
  return out
    .replace(/(\s(?:href|src|action|poster)=["'])\/(?!\/)/g, `$1${base}`)
    .replace(/(url\(\s*["']?)\/(?!\/)/g, `$1${base}`)
    .replace(/(location\.(?:replace\(|assign\(|href\s*=\s*))(["'])\/(?!\/)/g, `$1$2${base}`)
    .replace(/(["'])\/\1(\s*\+)/g, `$1${base}$1$2`);
};

const placeholdersIn = (files, dir, game) => {
  const found = new Map();
  // Left after rebase means an address on a domain nobody owns yet, such as a support mailbox.
  const patterns = game.domain ? [...PLACEHOLDERS, new RegExp(`[\\w.+-]*@?${escapeRegex(game.domain)}`, 'g')] : PLACEHOLDERS;
  // Readers only see the pages; a script's `[T.PRESENCE]` is code, not a gap.
  for (const file of files) {
    if (!['.html', '.txt', '.xml'].includes(extname(file))) continue;
    const text = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const key = match[0];
        if (!found.has(key)) found.set(key, relative(dir, file));
      }
    }
  }
  return found;
};

// Gece Baskısı renders its legal text inside the web client, so it has no static build.
const renderLegalModule = async (game, target) => {
  const { legalDoc } = await import(pathToFileURL(join(PROJECTS, game.project, game.legalModule)).href);
  for (const kind of ['privacy', 'terms']) {
    mkdirSync(join(target, kind), { recursive: true });
    for (const lang of ['tr', 'en']) {
      const doc = legalDoc(kind, lang);
      const sections = doc.sections
        .map(section => `<section><h2>${escapeHtml(section.heading)}</h2>${section.body.map(p => `<p>${escapeHtml(p)}</p>`).join('')}</section>`)
        .join('\n');
      const other = lang === 'tr' ? 'en' : 'tr';
      writeFileSync(
        join(target, kind, `${lang}.html`),
        page(`${doc.title} · ${game.name}`, lang, `<p><a href="../">${escapeHtml(game.name)}</a> · <a href="${other}.html" lang="${other}">${other === 'tr' ? 'Türkçe' : 'English'}</a></p><h1>${escapeHtml(doc.title)}</h1><p class="meta">${escapeHtml(doc.updated)}</p>\n${sections}`, '../../'),
      );
    }
    writeFileSync(join(target, kind, 'index.html'), languageRedirect(['tr', 'en'], 'en'));
  }
  writeFileSync(
    join(target, 'index.html'),
    page(game.name, 'en', `<h1>${escapeHtml(game.name)}</h1><ul><li><a href="privacy/">Privacy · Gizlilik</a></li><li><a href="terms/">Terms · Kullanım Şartları</a></li><li>Support · Destek: <a href="mailto:${studio.email}">${studio.email}</a></li></ul>`, '../'),
  );
};

const languageRedirect = (langs, fallback) =>
  `<!doctype html><meta charset="utf-8"><script>var L=${JSON.stringify(langs)},c=(navigator.language||'').slice(0,2).toLowerCase();location.replace((L.indexOf(c)>=0?c:'${fallback}')+'.html');</script><a href="${fallback}.html">${fallback}</a>\n`;

const page = (title, lang, body, up = '') => `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${up}studio.css">
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;

const linkTo = (game, key) => {
  const target = game.links[key];
  return target === undefined ? null : `${game.slug}/${target}`;
};

const home = published => {
  const cards = studio.games
    .map(game => {
      const live = published.has(game.slug);
      const links = live
        ? [
            ['privacy', 'Gizlilik · Privacy'],
            ['terms', 'Kullanım Şartları · Terms'],
            ['support', 'Destek · Support'],
            ['deleteAccount', 'Hesap Silme · Delete account'],
          ]
            .map(([key, label]) => (linkTo(game, key) === null ? '' : `<a href="${linkTo(game, key)}">${label}</a>`))
            .join('')
        : '<span class="soon">Yakında · Coming soon</span>';
      return `<article><h2>${escapeHtml(game.name)}</h2><p>${escapeHtml(game.tagline.tr)} · <span lang="en">${escapeHtml(game.tagline.en)}</span></p><nav>${links}</nav></article>`;
    })
    .join('\n');
  return page(
    `${studio.developer} · Mobil Oyunlar`,
    'tr',
    `<h1>${escapeHtml(studio.developer)}</h1>
<p class="meta">Mobil oyunlar · <span lang="en">Mobile games</span></p>
<div class="games">
${cards}
</div>
<footer><a href="mailto:${studio.email}">${studio.email}</a></footer>`,
  );
};

// Every relative href and src has to land on a file.
const brokenLinks = dir => {
  const broken = [];
  for (const file of walk(dir).filter(path => path.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    for (const [, url] of html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)) {
      if (/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(url)) continue;
      const clean = url.split(/[?#]/)[0];
      let target = clean.startsWith('/') ? join(ROOT, clean) : resolve(dirname(file), clean);
      if (clean.endsWith('/') || (existsSync(target) && statSync(target).isDirectory())) target = join(target, 'index.html');
      if (!existsSync(target)) broken.push(`${relative(dir, file)} -> ${url}`);
    }
  }
  return broken;
};

const main = async () => {
  for (const game of studio.games) rmSync(join(ROOT, game.slug), { recursive: true, force: true });

  const published = new Set();
  const report = [];
  for (const game of studio.games) {
    const target = join(ROOT, game.slug);
    if (game.legalModule) {
      await renderLegalModule(game, target);
    } else {
      const source = join(PROJECTS, game.project, game.out);
      if (!existsSync(source)) {
        report.push(`${game.name}: no build at ${game.project}/${game.out}. Run \`${game.build}\` in ${game.project}.`);
        continue;
      }
      cpSync(source, target, { recursive: true, filter: path => !DROP.has(path.split('/').pop()) });
      for (const file of walk(target)) {
        if (TEXT.has(extname(file))) writeFileSync(file, rebase(readFileSync(file, 'utf8'), game));
      }
    }

    const files = walk(target);
    const missing = placeholdersIn(files, target, game);
    const broken = brokenLinks(target);
    if (missing.size === 0 && broken.length === 0) {
      published.add(game.slug);
      report.push(`${game.name}: published (${files.length} files)`);
      continue;
    }
    const fix = game.legalModule ? `${game.project}/${game.legalModule}` : `${game.project}, then \`${game.build}\``;
    report.push(`${game.name}: kept out. Fill in ${fix}:`);
    for (const [token, file] of missing) report.push(`  ${token}  (${file})`);
    for (const link of broken.slice(0, 10)) report.push(`  broken link ${link}`);
    if (broken.length > 10) report.push(`  ...and ${broken.length - 10} more broken links`);
    if (!DRAFTS) rmSync(target, { recursive: true, force: true });
  }

  writeFileSync(join(ROOT, 'index.html'), home(published));
  writeFileSync(join(ROOT, '404.html'), page('404', 'tr', `<h1>404</h1><p><a href="${studio.site}/">${escapeHtml(studio.developer)}</a></p>`, `${studio.site}/`));
  writeFileSync(join(ROOT, '.nojekyll'), '');
  // One file covers every game, because they all sit under one AdMob publisher account.
  writeFileSync(
    join(ROOT, 'app-ads.txt'),
    studio.admobPublisherId
      ? `google.com, ${studio.admobPublisherId}, DIRECT, f08c47fec0942fa0\n`
      : '# Set admobPublisherId in studio.json (pub-XXXXXXXXXXXXXXXX), then run node scripts/sync.mjs\n',
  );
  if (!studio.admobPublisherId) report.push('app-ads.txt: admobPublisherId is empty in studio.json');

  const rootBroken = brokenLinks(ROOT).filter(link => ['index.html', '404.html'].includes(link.split(' -> ')[0]));
  for (const link of rootBroken) report.push(`broken link ${link}`);

  console.log(report.join('\n'));
  console.log(`\n${published.size}/${studio.games.length} games published${DRAFTS ? ' (drafts copied too: do not push)' : ''}`);
};

await main();
