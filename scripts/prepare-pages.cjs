const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { renderPage } = require('../shared/render-page.cjs');

const root = path.resolve(__dirname, '..');
const aliases = { 'o-mnie': 'about.html', projekty: 'projects.html', korepetycje: 'knowledge.html', 'po-godzinach': 'hobby.html', kontakt: 'contact.html' };
const pageNames = ['index.html', 'about.html', 'projects.html', 'project.html', 'knowledge.html', 'hobby.html', 'contact.html', '404.html'];
function preparePages({ base = process.env.PAGES_BASE_PATH || '/portfolio/', output = path.join(root, 'dist/github-pages') } = {}) {
  if (!/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(base) || base.split('/').some(part => part === '.' || part === '..')) throw Error('Nieprawidłowy prefiks adresu Pages.');
  output = path.resolve(output);
  const dist = path.join(root, 'dist');
  if (!output.startsWith(dist + path.sep)) throw Error('Eksport musi znajdować się wewnątrz dist/.');
  for (let check = output; check !== root; check = path.dirname(check)) {
    if (fs.lstatSync(check, { throwIfNoEntry: false })?.isSymbolicLink()) throw Error('Eksport nie może używać dowiązań.');
  }
  function copyAssets(source, destination) {
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw Error('Zasoby nie mogą zawierać dowiązań.');
      if (entry.name.startsWith('.') || /^admin.*\.(js|css)$/.test(entry.name)) continue;
      const from = path.join(source, entry.name), to = path.join(destination, entry.name);
      if (entry.isDirectory()) { fs.mkdirSync(to, { recursive: true }); copyAssets(from, to); }
      else fs.copyFileSync(from, to);
    }
  }
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
  copyAssets(path.join(root, 'assets'), path.join(output, 'assets'));
  const data = { window: {} };
  for (const file of ['gallery-data.js', 'projects-data.js', 'home-data.js', 'pages-data.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js', file), 'utf8'), data, { timeout: 1000 });
  }
  const photos = JSON.parse(JSON.stringify(data.window.portfolioPhotos || [])).filter(item => item.visible !== false && !item.archived);
  const projects = JSON.parse(JSON.stringify(data.window.portfolioProjects || [])).filter(item => item.visible !== false && !item.archived);
  const pages = JSON.parse(JSON.stringify(data.window.portfolioPageContent || {}));
  const home = JSON.parse(JSON.stringify(data.window.portfolioHome || {}));
  function localLink(value, page) {
    if (value.startsWith('#')) return page + value;
    if (value.startsWith('/') && !value.startsWith('//')) {
      const [target] = value.slice(1).split(/[?#]/);
      return (aliases[target] || (target === '' ? 'index.html' : target)) + value.slice(1 + target.length);
    }
    return value;
  }
  function normalizeLinks(value, page) {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === 'string' && ['href', 'src', 'thumbUrl'].includes(key)) value[key] = localLink(item, page);
      else if (item && typeof item === 'object') normalizeLinks(item, page);
    }
  }
  for (const [key, value] of Object.entries(pages)) normalizeLinks(value, { home: 'index.html', about: 'about.html', projects: 'projects.html', knowledge: 'knowledge.html', contact: 'contact.html' }[key] || 'index.html');
  normalizeLinks(home, 'index.html');
  for (const item of projects) if (item.link?.startsWith('#')) item.link = 'projects.html' + item.link;
  const reviews = (pages.knowledge?.reviews || []).filter(item => item.visible !== false && !item.archived);
  if (pages.knowledge) pages.knowledge.reviews = reviews;
  for (const group of pages.contact?.editor?.groups || []) for (const field of group.fields || []) {
    if (group.id + '-' + field.id === 'copy-text-22') field.value = { pl: 'Otwórz wiadomość w poczcie', en: 'Open email draft' };
    if (group.id + '-' + field.id === 'copy-text-23') field.value = { pl: 'Kreator otworzy szkic w Twoim programie pocztowym. Wysyłkę zatwierdzasz w poczcie.', en: 'The wizard opens a draft in your email app. Send it from there.' };
  }
  for (const [file, property, value] of [
    ['gallery-data.js', 'portfolioPhotos', photos], ['projects-data.js', 'portfolioProjects', projects],
    ['pages-data.js', 'portfolioPageContent', pages], ['home-data.js', 'portfolioHome', home],
  ]) fs.writeFileSync(path.join(output, 'assets/js', file), `window.${property} = ${JSON.stringify(value, null, 2)};\n`);
  const api = path.join(output, 'static-api');
  fs.mkdirSync(path.join(api, 'pages'), { recursive: true });
  const snapshots = { photos, projects, reviews, 'pages/home': { ...home, content: pages.home }, 'pages/about': { content: pages.about }, 'pages/knowledge': pages.knowledge, 'pages/projects': pages.projects, 'pages/contact': pages.contact };
  for (const [name, value] of Object.entries(snapshots)) fs.writeFileSync(path.join(api, name + '.json'), JSON.stringify(value ?? {}));
  // Adaptujemy tylko eksport; lokalne źródła nadal korzystają z backendu.
  for (const entry of fs.readdirSync(path.join(output, 'assets/js'))) {
    if (!entry.endsWith('.js')) continue;
    const file = path.join(output, 'assets/js', entry);
    let source = fs.readFileSync(file, 'utf8');
    source = source.replace(/(['"])\/api\/(photos|projects|reviews|pages\/contact|pages\/knowledge)\1/g, (_, quote, endpoint) => `new URL('static-api/${endpoint}.json', document.baseURI).href`);
    source = source.replace("'/api/pages/' + page", "new URL('static-api/pages/' + page + '.json', document.baseURI).href");
    source = source.replace('`/api/pages/${page}`', 'new URL(`static-api/pages/${page}.json`, document.baseURI).href');
    if (entry === 'gallery.js') source = source.replace("new URL('/po-godzinach',location.origin)", "new URL('hobby.html',document.baseURI)");
    if (entry === 'project-detail.js') source = source.replace("new URL(location.href).searchParams.get('id') ||", "new URL(location.href).searchParams.get('id') || window.portfolioStaticProjectId ||");
    if (entry === 'gallery.js') source = source.replace("new URL(location.href).searchParams.get('album') ||", "new URL(location.href).searchParams.get('album') || window.portfolioStaticAlbumId ||");
    if (entry === 'contact.js') {
      const start = source.indexOf('    const payload={email:');
      const end = source.indexOf('\n  });\n  document.addEventListener', start);
      if (start < 0 || end < 0) throw Error('Zmieniono kreator kontaktu; sprawdź adaptację Pages.');
      source = source.slice(0, start) + `    const subject=encodeURIComponent(text('Zapytanie z portfolio: ','Portfolio enquiry: ')+label('topics-'+category,categories[category]));
    const body=encodeURIComponent(bodyMessage+'\\n\\n'+text('E-mail do odpowiedzi: ','Reply email: ')+email.value);
    location.href='mailto:podyma.marcin33@gmail.com?subject='+subject+'&body='+body;
    status.textContent=text('Otwórz szkic w programie pocztowym i zatwierdź wysyłkę. Jeśli poczta się nie otworzyła, napisz na podyma.marcin33@gmail.com.','Open the draft in your email app and send it there. If the app did not open, email podyma.marcin33@gmail.com.');` + source.slice(end);
    }
    fs.writeFileSync(file, source);
  }
  // The shared router resolves assets against the Pages base URL.
  fs.writeFileSync(path.join(output, 'assets/js/spotify.js'), '// Live Spotify is unavailable without the backend.\n');
  function html(page, extra = '') {
    let source = renderPage(fs.readFileSync(path.join(root, 'pages', page), 'utf8'), page);
    if (page === 'hobby.html') source = source.replace('</head>', '<style>.spotify-current,.spotify-live{display:none!important}.music-record{animation-play-state:paused!important}</style></head>');
    source = source.replace(/href="(#[^"]*|\/(?!\/)[^"]*)"/g, (_, href) => `href="${localLink(href, page)}"`);
    source = source.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">${extra}`);
    return source;
  }
  function write(name, source) { const file = path.join(output, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, source); }
  for (const page of pageNames) write(page, html(page));
  for (const [alias, page] of Object.entries(aliases)) write(alias + '/index.html', html(page));
  for (const project of projects.filter(item => item.caseStudy?.enabled)) {
    const slug = { 'achievements-1': 'swoja-droga', 'achievements-0': 'krakhack' }[project.id] || project.id;
    write('projekty/' + encodeURIComponent(slug) + '/index.html', html('project.html', `<script>window.portfolioStaticProjectId=${JSON.stringify(project.id).replace(/</g, '\\u003c')};</script>`));
  }
  for (const photo of photos.filter(item => item.album)) write('album/' + encodeURIComponent(photo.id) + '/index.html', html('hobby.html', `<script>window.portfolioStaticAlbumId=${JSON.stringify(photo.id).replace(/</g, '\\u003c')};</script>`));
  const adminNotice = `<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Panel lokalny</title><body><main><h1>Panel jest dostępny lokalnie</h1><p>GitHub Pages udostępnia publiczne portfolio. Edycję treści wykonaj w lokalnym panelu, a następnie opublikuj eksport.</p><a href="${base}">Wróć do portfolio</a></main></body></html>`;
  write('admin.html', adminNotice); write('admin/index.html', adminNotice);
  write('.nojekyll', '');
  return output;
}
if (require.main === module) console.log('GitHub Pages: ' + preparePages());
module.exports = { preparePages };
