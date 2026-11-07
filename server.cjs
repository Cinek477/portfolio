const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const { renderPage } = require('./shared/render-page.cjs');
const { sendAsset } = require('./server/static-assets.cjs');
const { defaults: homeDefaults, normalizeHome, hydrateHome } = require('./shared/home.cjs');
const { pageDefaults, normalizeContent, normalizeOffers, normalizeEditor, pageDataScripts } = require('./shared/page-content.cjs');
const { normalize, normalizeProject } = require('./shared/normalize.cjs');
const MAX_BODY = 32 * 1024 * 1024;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function createGalleryServer(options = {}) {
  const dataDir = options.dataDir || path.join(ROOT, 'data');
  const uploadDir = options.uploadDir || path.join(ROOT, 'assets', 'images');
  const exportFile = options.exportFile || path.join(ROOT, 'assets/js/gallery-data.js');
  const projectExportFile =
    options.projectExportFile ||
    (options.dataDir
      ? path.join(dataDir, 'projects-data.js')
      : path.join(ROOT, 'assets/js/projects-data.js'));
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'gallery.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, category TEXT NOT NULL, data TEXT NOT NULL, position INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT NOT NULL, position INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS page_drafts (page TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS page_history (id INTEGER PRIMARY KEY AUTOINCREMENT, page TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS trash (kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, position INTEGER NOT NULL, deleted_at TEXT NOT NULL, PRIMARY KEY(kind,id));`);
  const insert = db.prepare(
    'INSERT INTO photos (id, category, data, position) VALUES (?, ?, ?, ?)',
  );
  if (!db.prepare("SELECT value FROM settings WHERE key='imported'").get()) {
    const sandbox = { window: {} };
    vm.runInNewContext(
      fs.readFileSync(path.join(ROOT, 'assets/js/gallery-data.js'), 'utf8'),
      sandbox,
    );
    db.exec('BEGIN');
    try {
      sandbox.window.portfolioPhotos
        .filter((photo) => photo.src)
        .forEach((photo, index) =>
          insert.run(photo.id, photo.category, JSON.stringify(photo), index),
        );
      db.prepare("INSERT INTO settings VALUES ('imported', '1')").run();
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  if (!db.prepare("SELECT value FROM settings WHERE key='projects-imported'").get()) {
    const sandbox = { window: {} };
    vm.runInNewContext(
      fs.readFileSync(path.join(ROOT, 'assets/js/projects-data.js'), 'utf8'),
      sandbox,
    );
    db.exec('BEGIN');
    try {
      sandbox.window.portfolioProjects.forEach((project, position) =>
        db
          .prepare('INSERT INTO projects VALUES (?, ?, ?)')
          .run(project.id, JSON.stringify(project), position),
      );
      db.prepare("INSERT INTO settings VALUES ('projects-imported', '1')").run();
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  function readReviews() { return JSON.parse(db.prepare("SELECT value FROM settings WHERE key='tutoring-reviews'").get()?.value || '[]'); }
  function exportGallery() {
    const home = readHome();
    fs.writeFileSync(options.dataDir ? path.join(dataDir, 'home-data.js') : path.join(ROOT, 'assets/js/home-data.js'), `window.portfolioHome = ${JSON.stringify(home, null, 2)};\n`);
    const pages = { home: home.content, about: readAbout(), knowledge: { ...readOffers(), reviews: readReviews().filter(item=>item.visible && !item.archived) }, projects: readProjectPage(), contact: readContact() };
    fs.writeFileSync(options.dataDir ? path.join(dataDir, 'pages-data.js') : path.join(ROOT, 'assets/js/pages-data.js'), `window.portfolioPageContent = ${JSON.stringify(pages, null, 2)};\n`);
    for (const [file, source] of pageDataScripts(pages)) {
      fs.writeFileSync(options.dataDir ? path.join(dataDir, file) : path.join(ROOT, 'assets/js', file), source);
    }
    const photos = db
      .prepare('SELECT data FROM photos ORDER BY position')
      .all()
      .map((row) => JSON.parse(row.data)).filter(photo => photo.visible !== false);
    const content =
      '// Eksport z panelu galerii. Opisy edytuj przez admin.html.\n' +
      `window.portfolioPhotos = ${JSON.stringify(photos, null, 2)};\n`;
    fs.mkdirSync(path.dirname(exportFile), { recursive: true });
    const temporaryFile = `${exportFile}.tmp`;
    fs.writeFileSync(temporaryFile, content, 'utf8');
    fs.renameSync(temporaryFile, exportFile);
    const projects = db
      .prepare('SELECT data FROM projects ORDER BY position')
      .all()
      .map((row) => JSON.parse(row.data))
      .filter(project => project.visible !== false);
    fs.mkdirSync(path.dirname(projectExportFile), { recursive: true });
    fs.writeFileSync(
      `${projectExportFile}.tmp`,
      `// Eksport projektów z panelu administratora.\nwindow.portfolioProjects = ${JSON.stringify(projects, null, 2)};\n`,
      'utf8',
    );
    fs.renameSync(`${projectExportFile}.tmp`, projectExportFile);
  }
  function mutateGallery(operation) {
    db.exec('BEGIN');
    try {
      const before = Object.fromEntries(['home','about','projects','knowledge','contact'].map(page => [page, JSON.stringify(readPublished(page))]));
      operation();
      for (const [page, data] of Object.entries(before)) {
        if (data === JSON.stringify(readPublished(page))) continue;
        db.prepare('INSERT INTO page_history(page,data,created_at) VALUES (?,?,?)').run(page, data, new Date().toISOString());
        db.prepare('DELETE FROM page_history WHERE page=? AND id NOT IN (SELECT id FROM page_history WHERE page=? ORDER BY id DESC LIMIT 10)').run(page, page);
      }
      exportGallery();
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      exportGallery();
      throw error;
    }
  }
  function readPublished(page) {
    if (page === 'home') return readHome();
    if (page === 'about') return { content: readAbout() };
    if (page === 'projects') return readProjectPage();
    if (page === 'contact') return readContact();
    return readOffers();
  }
  function normalizeDraft(page, input, old) {
    if (page === 'home') {
      const result = normalizeHome(input, old);
      if (result.featured.some(id => !db.prepare('SELECT id FROM projects WHERE id=?').get(id)))
        throw Object.assign(new Error('Wybrany projekt lub osiągnięcie już nie istnieje.'), { status:400 });
      return result;
    }
    if (page === 'about') return { content: normalizeContent(input.content, old.content) };
    if (page === 'projects' || page === 'contact') return { editor: normalizeEditor(input.editor, old.editor) };
    return normalizeOffers(input, old);
  }
  function readHome() {
    const saved = JSON.parse(db.prepare("SELECT value FROM settings WHERE key='home'").get()?.value || JSON.stringify(homeDefaults));
    return hydrateHome(saved);
  }
  function readContact() { return { ...pageDefaults.contact, ...JSON.parse(db.prepare("SELECT value FROM settings WHERE key='page-contact'").get()?.value || '{}') }; }
  function readProjectPage() {
    return { ...pageDefaults.projects, ...JSON.parse(db.prepare("SELECT value FROM settings WHERE key='page-projects'").get()?.value || '{}') };
  }
  function readOffers() {
    return { ...pageDefaults.knowledge, ...JSON.parse(db.prepare("SELECT value FROM settings WHERE key='page-knowledge'").get()?.value || '{}') };
  }
  function readAbout() {
    return JSON.parse(db.prepare("SELECT value FROM settings WHERE key='page-about'").get()?.value || JSON.stringify(pageDefaults.about));
  }
  if (!db.prepare("SELECT value FROM settings WHERE key='page-contact'").get()) db.prepare('INSERT INTO settings(key,value) VALUES (?,?)').run('page-contact',JSON.stringify(pageDefaults.contact));
  exportGallery();

  const sessions = new Map();
  const attempts = new Map();
  const sessionDuration = 8 * 60 * 60 * 1000;
  const credentials = () => {
    const row = db.prepare("SELECT value FROM settings WHERE key='admin-auth'").get();
    return row ? JSON.parse(row.value) : null;
  };
  function sessionToken(req) {
    return req.headers.cookie?.match(/(?:^|;\s*)gallery_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  }
  function authenticated(req) {
    const token = sessionToken(req);
    const expires = sessions.get(token);
    if (!expires || expires <= Date.now()) {
      if (token) sessions.delete(token);
      return false;
    }
    return true;
  }
  function createSession(req, res) {
    const old = sessionToken(req);
    if (old) sessions.delete(old);
    for (const [token, expires] of sessions) if (expires <= Date.now()) sessions.delete(token);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + sessionDuration);
    res.setHeader(
      'Set-Cookie',
      `gallery_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDuration / 1000}`,
    );
  }
  function passwordFrom(input) {
    if (
      !input ||
      typeof input.password !== 'string' ||
      input.password.length < 10 ||
      input.password.length > 128
    ) {
      throw Object.assign(new Error('Hasło musi mieć od 10 do 128 znaków.'), { status: 400 });
    }
    return input.password;
  }

  function json(res, status, value) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(value));
  }
  async function body(req, limit = MAX_BODY) {
    if (!(req.headers['content-type'] || '').startsWith('application/json'))
      throw Object.assign(new Error('Wymagany JSON.'), { status: 415 });
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > limit)
        throw Object.assign(new Error('Plik jest za duży (limit żądania: 32 MB).'), {
          status: 413,
        });
      chunks.push(chunk);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw Object.assign(new Error('Niepoprawne dane JSON.'), { status: 400 });
    }
  }
  function storeImage(dataUrl, group = 'gallery', basename = crypto.randomUUID()) {
    const match =
      typeof dataUrl === 'string' &&
      dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match)
      throw Object.assign(new Error('Dozwolone zdjęcia: JPG, PNG, WebP.'), { status: 400 });
    const bytes = Buffer.from(match[2], 'base64');
    const valid =
      match[1] === 'jpeg'
        ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        : match[1] === 'png'
          ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : bytes.subarray(0, 4).toString() === 'RIFF' &&
            bytes.subarray(8, 12).toString() === 'WEBP';
    if (!valid || bytes.length > 20 * 1024 * 1024)
      throw Object.assign(new Error('Niepoprawny obraz lub plik większy niż 20 MB.'), {
        status: 400,
      });
    const name = `${basename}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
    const size = basename.endsWith('_thumb') ? '800px' : '2400px';
    const directory = path.join(uploadDir, group, size);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, name), bytes, { flag: 'wx' });
    return { src: `assets/images/${group}/${size}/${name}`, file: path.join(directory, name) };
  }
  function storeImages(input, group = 'gallery') {
    const id = crypto.randomUUID();
    const main = storeImage(input.image, group, id);
    let thumb;
    try {
      if (input.thumbnail) thumb = storeImage(input.thumbnail, group, `${id}_thumb`);
      return {
        src: main.src,
        thumbUrl: thumb?.src || '',
        files: [main.file, thumb?.file].filter(Boolean),
      };
    } catch (error) {
      fs.unlinkSync(main.file);
      throw error;
    }
  }
  const inbox = require('./server/inbox.cjs').createInbox({ db, json, body, authenticated, options });
  function notFound(req, res) {
    if (
      (req.method === 'GET' || req.method === 'HEAD') &&
      req.headers.accept?.includes('text/html')
    ) {
      const html = Buffer.from(renderPage(fs.readFileSync(path.join(ROOT, 'pages', '404.html'), 'utf8'), '404.html'));
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': html.length,
        'Cache-Control': 'no-cache',
      });
      return res.end(req.method === 'HEAD' ? undefined : html);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(req.method === 'HEAD' ? undefined : 'Nie znaleziono pliku.');
  }
  let backupBusy=false;
  const spotify=require('./server/spotify.cjs').createSpotify({directory:dataDir,json,body,authenticated,fetchImpl:options.spotifyFetch||fetch});
  const backups=require('./server/backups.cjs').createBackups({db,databaseFile:path.join(dataDir,'gallery.sqlite'),imagesDir:uploadDir,directory:options.backupDir||path.join(options.dataDir||ROOT,'backups','project-snapshots'),json,body,authenticated,exportData:()=>{require('./server/inbox.cjs').ensureCaseColumns(db);exportGallery();},clearSessions:()=>sessions.clear(),setBusy:value=>{backupBusy=value;}});
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return json(res, 400, { error: 'Niepoprawny adres.' });
      }
      if (pathname.startsWith('/api/')) {
        if (req.method !== 'GET') {
          const allowed = new Set([
            `http://localhost:${server.address().port}`,
            `http://127.0.0.1:${server.address().port}`,
          ]);
          if (!allowed.has(req.headers.origin))
            return json(res, 403, { error: 'Otwórz panel z lokalnego adresu serwera.' });
        }
        if (await backups.handle(req,res,pathname)) return;
        if(backupBusy && !['GET','HEAD'].includes(req.method)) return json(res,503,{error:'Trwa tworzenie lub przywracanie kopii. Spróbuj za chwilę.'});
        if(pathname==='/api/admin/stats'&&req.method==='GET'){
          if(!authenticated(req))return json(res,401,{error:'Zaloguj się do panelu administratora.'});
          const photos=db.prepare('SELECT data FROM photos').all().map(row=>JSON.parse(row.data));
          return json(res,200,{drafts:db.prepare('SELECT COUNT(*) AS n FROM page_drafts').get().n,hiddenPhotos:photos.filter(photo=>photo.visible===false).length,albumOnly:photos.filter(photo=>photo.visible!==false&&photo.galleryVisible===false).length,unread:db.prepare("SELECT COUNT(*) AS n FROM messages WHERE folder='inbox' AND is_read=0").get().n});
        }
        if((options.automaticBackups ?? !options.dataDir) && authenticated(req) && !['GET','HEAD'].includes(req.method) &&
          (req.method==='DELETE'||/^\/api\/page-drafts\/[^/]+\/publish$/.test(pathname)||/^\/api\/(?:pages\/[^/]+|home|photo-management|photo-order|album-cover|photos(?:\/[^/]+)?|projects(?:\/[^/]+)?)$/.test(pathname))){
          await backups.automatic();
        }
        if(pathname==='/api/preflight'&&req.method==='GET'){
          if(!authenticated(req))return json(res,401,{error:'Zaloguj się do panelu.'});
          const pages=Object.fromEntries(['home','about','projects','knowledge','contact'].map(page=>[page,readPublished(page)]));
          return json(res,200,require('./server/preflight.cjs').check({root:ROOT,pages,photos:db.prepare('SELECT data FROM photos').all().map(row=>JSON.parse(row.data)).filter(item=>item.visible!==false),projects:db.prepare('SELECT data FROM projects').all().map(row=>JSON.parse(row.data)).filter(item=>item.visible!==false)}));
        }
        if(await spotify.handle(req,res,pathname))return;
        if (await inbox(req, res, pathname)) return;
        if (pathname === '/api/auth/status' && req.method === 'GET') {
          return json(res, 200, {
            authenticated: authenticated(req),
            requiresSetup: !credentials(),
          });
        }
        if (pathname === '/api/auth/setup' && req.method === 'POST') {
          if (credentials()) return json(res, 409, { error: 'Konto administratora już istnieje.' });
          const input = await body(req);
          const password = passwordFrom(input);
          const salt = crypto.randomBytes(32).toString('hex');
          const hash = (await scrypt(password, salt, 64)).toString('hex');
          if (credentials()) return json(res, 409, { error: 'Konto administratora już istnieje.' });
          db.prepare("INSERT INTO settings (key, value) VALUES ('admin-auth', ?)").run(
            JSON.stringify({ salt, hash }),
          );
          createSession(req, res);
          return json(res, 201, { authenticated: true });
        }
        if (pathname === '/api/auth/login' && req.method === 'POST') {
          const key = req.socket.remoteAddress;
          let attempt = attempts.get(key);
          if (!attempt || attempt.until < Date.now())
            attempt = { count: 0, until: Date.now() + 15 * 60 * 1000 };
          if (attempt.count >= 8)
            return json(res, 429, {
              error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
            });
          attempts.set(key, attempt);
          attempt.count++;
          const input = await body(req);
          const stored = credentials();
          if (!stored) return json(res, 409, { error: 'Najpierw ustaw hasło administratora.' });
          const password =
            typeof input?.password === 'string' && input.password.length <= 128
              ? input.password
              : '';
          const hash = await scrypt(password, stored.salt, 64);
          if (
            input?.username !== 'admin' ||
            !crypto.timingSafeEqual(hash, Buffer.from(stored.hash, 'hex'))
          ) {
            return json(res, 401, { error: 'Niepoprawny login lub hasło.' });
          }
          attempts.delete(key);
          createSession(req, res);
          return json(res, 200, { authenticated: true });
        }
        if (pathname === '/api/auth/logout' && req.method === 'POST') {
          sessions.delete(sessionToken(req));
          res.setHeader(
            'Set-Cookie',
            'gallery_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0',
          );
          return json(res, 200, { authenticated: false });
        }
        if (req.method !== 'GET' && !authenticated(req)) {
          return json(res, 401, { error: 'Zaloguj się do panelu administratora.' });
        }
        if (pathname === '/api/trash' || pathname.startsWith('/api/trash/')) {
          if (!authenticated(req)) return json(res, 401, { error: 'Zaloguj się do panelu administratora.' });
          if (pathname === '/api/trash' && req.method === 'GET')
            return json(res, 200, db.prepare('SELECT * FROM trash ORDER BY deleted_at DESC').all().map(row => ({ ...row, data: JSON.parse(row.data) })));
          const permanent = pathname.match(/^\/api\/trash\/(photos|projects)\/([\w-]+)$/);
          if (permanent && req.method === 'DELETE') {
            const input = await body(req);
            if (input?.confirmId !== permanent[2]) return json(res, 400, { error: 'Potwierdź trwałe usunięcie wybranego wpisu.' });
            const result = db.prepare('DELETE FROM trash WHERE kind=? AND id=?').run(permanent[1], permanent[2]);
            return json(res, result.changes ? 200 : 404, result.changes ? { ok: true } : { error: 'Wpis nie znajduje się już w koszu.' });
          }
          const match = pathname.match(/^\/api\/trash\/(photos|projects)\/([\w-]+)\/restore$/);
          if (!match || req.method !== 'POST') return json(res, 405, { error: 'Niedozwolona operacja.' });
          const [, kind, id] = match;
          const row = db.prepare('SELECT * FROM trash WHERE kind=? AND id=?').get(kind, id);
          if (!row) return json(res, 404, { error: 'Wpis nie znajduje się już w koszu.' });
          if (db.prepare(`SELECT id FROM ${kind} WHERE id=?`).get(id)) return json(res, 409, { error: 'Wpis o tym identyfikatorze już istnieje. Nie nadpisano danych.' });
          mutateGallery(() => {
            if (kind === 'photos') db.prepare('INSERT INTO photos VALUES (?,?,?,?)').run(id, JSON.parse(row.data).category, row.data, row.position);
            else db.prepare('INSERT INTO projects VALUES (?,?,?)').run(id, row.data, row.position);
            db.prepare('DELETE FROM trash WHERE kind=? AND id=?').run(kind, id);
          });
          return json(res, 200, { ok: true });
        }
        const draftRoute = pathname.match(/^\/api\/page-drafts\/(home|about|projects|knowledge|contact)(?:\/(publish|history|restore))?$/);
        if (draftRoute) {
          if (!authenticated(req)) return json(res,401,{error:'Zaloguj się do panelu administratora.'});
          const [, page, action] = draftRoute;
          const row = db.prepare('SELECT * FROM page_drafts WHERE page=?').get(page);
          if (action === 'history' && req.method === 'GET')
            return json(res,200,db.prepare('SELECT id,created_at FROM page_history WHERE page=? ORDER BY id DESC').all(page));
          if (!action && req.method === 'GET') return json(res,200,row ? { data:page==='home'?hydrateHome(JSON.parse(row.data)):JSON.parse(row.data), updatedAt:row.updated_at } : {data:null});
          if (!action && req.method === 'DELETE') {
            db.prepare('DELETE FROM page_drafts WHERE page=?').run(page); return json(res,200,{ok:true});
          }
          if (action === 'restore' && req.method === 'POST') {
            const input = await body(req);
            const revision = db.prepare('SELECT data FROM page_history WHERE page=? AND id=?').get(page,Number(input.id));
            if (!revision) return json(res,404,{error:'Nie znaleziono wersji.'});
            const updatedAt = new Date().toISOString();
            db.prepare('INSERT INTO page_drafts VALUES (?,?,?) ON CONFLICT(page) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').run(page,revision.data,updatedAt);
            return json(res,200,{data:JSON.parse(revision.data),updatedAt});
          }
          if (action === 'publish' && req.method === 'POST') {
            if (!row) return json(res,409,{error:'Najpierw zapisz szkic.'});
            const draft = JSON.parse(row.data), value = normalizeDraft(page,draft,draft);
            mutateGallery(() => {
              db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
                .run(page === 'home' ? 'home' : 'page-'+page,JSON.stringify(page === 'about' ? value.content : value));
              db.prepare('DELETE FROM page_drafts WHERE page=?').run(page);
            });
            return json(res,200,value);
          }
          if (!action && req.method === 'PUT') {
            const input = await body(req);
            const value = normalizeDraft(page,input,row ? JSON.parse(row.data) : readPublished(page));
            const upload = input.image && ['home','about'].includes(page) ? storeImages(input,'pages') : null;
            if (upload) Object.assign(value.content.photo,{src:upload.src,thumbUrl:upload.thumbUrl});
            const updatedAt = new Date().toISOString();
            try { db.prepare('INSERT INTO page_drafts VALUES (?,?,?) ON CONFLICT(page) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').run(page,JSON.stringify(value),updatedAt); }
            catch(error) { if(upload) upload.files.forEach(file=>fs.unlinkSync(file)); throw error; }
            return json(res,200,{data:value,updatedAt});
          }
          return json(res,405,{error:'Niedozwolona metoda.'});
        }
        if (pathname === '/api/reviews' || /^\/api\/reviews\/[a-f0-9-]{36}$/.test(pathname)) {
          const items=readReviews(), id=pathname.split('/')[3];
          if(req.method==='GET' && !id) return json(res,200,authenticated(req)?items:items.filter(item=>item.visible&&!item.archived));
          if(!authenticated(req))return json(res,401,{error:'Zaloguj się do panelu.'});
          if(!['POST','PUT'].includes(req.method) || (req.method==='POST' && id) || (req.method==='PUT' && !id))return json(res,405,{error:'Niedozwolona metoda.'});
          const input=await body(req), old=id?items.find(item=>item.id===id):null;
          if(id&&!old)return json(res,404,{error:'Nie znaleziono opinii.'});
          const text=(key,max,required=false)=>{const value=input[key];if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw Object.assign(Error('Sprawdź treść, podpis i długość pól.'),{status:400});return value.trim();};
          if(typeof input.rating!=='number'||!Number.isFinite(input.rating)||input.rating<0||input.rating>5||input.rating*2%1 || typeof input.visible!=='boolean'||typeof input.archived!=='boolean') return json(res,400,{error:'Ocena musi wynosić 0–5 co 0,5. Sprawdź widoczność.'});
          if(!old && items.length>=500)return json(res,400,{error:'Osiągnięto limit 500 opinii.'});
          const item={id:old?.id||crypto.randomUUID(),author:text('author',100,true),text:text('text',2000,true),context:text('context',160),textEn:text('textEn',2000),contextEn:text('contextEn',160),rating:input.rating,visible:input.visible,archived:input.archived};
          if(old)items[items.indexOf(old)]=item;else items.push(item);
          mutateGallery(()=>db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('tutoring-reviews',JSON.stringify(items)));
          return json(res,old?200:201,item);
        }
        // Kontakt i lista projektów mają ten sam model edytora i zapis ustawień.
        if (['/api/pages/contact', '/api/pages/projects'].includes(pathname)) {
          const name = pathname.split('/').at(-1);
          const old = readPublished(name);
          if (req.method === 'GET') return json(res, 200, old);
          if (req.method !== 'PUT') return json(res, 405, { error: 'Niedozwolona metoda.' });
          const page = normalizeDraft(name, await body(req), old);
          mutateGallery(() => db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('page-' + name, JSON.stringify(page)));
          return json(res, 200, page);
        }
        if (pathname === '/api/pages/knowledge') {
          if (req.method === 'GET') return json(res, 200, readOffers());
          if (req.method !== 'PUT') return json(res, 405, { error: 'Niedozwolona metoda.' });
          const offers = normalizeOffers(await body(req), readOffers());
          mutateGallery(() => db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('page-knowledge', JSON.stringify(offers)));
          return json(res, 200, offers);
        }
        if (['/api/home', '/api/pages/home', '/api/pages/about'].includes(pathname)) {
          const homePage = pathname !== '/api/pages/about';
          const old = homePage ? readHome() : { content: readAbout() };
          if (req.method === 'GET') return json(res, 200, old);
          if (req.method === 'PUT') {
            const input = await body(req);
            const page = homePage ? normalizeHome(input, old) : { content: normalizeContent(input.content, old.content) };
            if (homePage && page.featured.some(id => !db.prepare('SELECT id FROM projects WHERE id=?').get(id)))
              return json(res, 400, { error: 'Wybrany projekt lub osiągnięcie już nie istnieje.' });
            const upload = input.image ? storeImages(input, 'pages') : null;
            if (upload) Object.assign(page.content.photo, { src: upload.src, thumbUrl: upload.thumbUrl });
            try {
              mutateGallery(() => db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
                .run(homePage ? 'home' : 'page-about', JSON.stringify(homePage ? page : page.content)));
            } catch (error) {
              if (upload) upload.files.forEach(file => fs.unlinkSync(file));
              throw error;
            }
            return json(res, 200, page);
          }
          return json(res, 405, { error: 'Niedozwolona metoda.' });
        }
        if (pathname === '/api/projects' && req.method === 'GET')
          return json(
            res,
            200,
            db
              .prepare('SELECT data FROM projects ORDER BY position')
              .all()
              .map((row) => JSON.parse(row.data))
              .filter(project => authenticated(req) || project.visible !== false),
          );
        const projectId = pathname.match(/^\/api\/projects\/([\w-]+)$/)?.[1];
        if (
          (pathname === '/api/projects' && req.method === 'POST') ||
          (projectId && ['PUT', 'DELETE'].includes(req.method))
        ) {
          const row = projectId
            ? db.prepare('SELECT data FROM projects WHERE id=?').get(projectId)
            : null;
          if (projectId && !row) return json(res, 404, { error: 'Nie znaleziono projektu.' });
          if (req.method === 'DELETE') {
            const permanent = url.searchParams.get('permanent') === '1';
            if (permanent && (await body(req))?.confirmId !== projectId) return json(res, 400, { error: 'Potwierdź trwałe usunięcie wybranego wpisu.' });
            mutateGallery(() => {
              if (!permanent) db.prepare('INSERT INTO trash SELECT ?,id,data,position,? FROM projects WHERE id=?').run('projects', new Date().toISOString(), projectId);
              db.prepare('DELETE FROM projects WHERE id=?').run(projectId);
            });
            return json(res, 200, { ok: true });
          }
          const input = await body(req);
          const project = normalizeProject(input, row ? JSON.parse(row.data) : {});
          project.id = projectId || crypto.randomUUID();
          const upload = input.image ? storeImages(input, 'projects') : null;
          if (upload) {
            project.src = upload.src;
            project.thumbUrl = upload.thumbUrl;
          }
          try {
            mutateGallery(() => {
              if (row)
                db.prepare('UPDATE projects SET data=? WHERE id=?').run(
                  JSON.stringify(project),
                  project.id,
                );
              else
                db.prepare('INSERT INTO projects VALUES (?, ?, ?)').run(
                  project.id,
                  JSON.stringify(project),
                  db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM projects').get()
                    .next,
                );
            });
          } catch (error) {
            if (upload) upload.files.forEach((file) => fs.unlinkSync(file));
            throw error;
          }
          return json(res, row ? 200 : 201, project);
        }
        if (pathname === '/api/photos' && req.method === 'GET')
          return json(
            res,
            200,
            db
              .prepare('SELECT data FROM photos ORDER BY position')
              .all()
              .map((row) => JSON.parse(row.data)).filter(photo => authenticated(req) || photo.visible !== false),
          );
        if(pathname==='/api/album-cover' && req.method==='POST'){
          const input=await body(req),row=typeof input.id==='string'?db.prepare('SELECT data FROM photos WHERE id=?').get(input.id):null;
          if(!row)return json(res,404,{error:'Nie znaleziono zdjęcia.'});
          const photo=JSON.parse(row.data),key=value=>(value||'').trim().normalize('NFC').toLocaleLowerCase('pl');
          if(!photo.album||photo.visible===false)return json(res,400,{error:'Wybierz widoczne zdjęcie przypisane do albumu.'});
          mutateGallery(()=>{for(const entry of db.prepare('SELECT data FROM photos').all()){const item=JSON.parse(entry.data);if(key(item.album)===key(photo.album)){item.albumCover=item.id===photo.id;db.prepare('UPDATE photos SET data=? WHERE id=?').run(JSON.stringify(item),item.id);}}});
          return json(res,200,{ok:true});
        }
        if (pathname === '/api/photo-management'  && req.method === 'POST') {
          const input = await body(req);
          if (!Array.isArray(input.ids) || !input.ids.length || input.ids.length > 1000 || new Set(input.ids).size !== input.ids.length || input.ids.some(id=>typeof id !== 'string'))
            return json(res,400,{error:'Wybierz zdjęcia bez powtórzeń.'});
          if (input.album !== undefined && (typeof input.album !== 'string' || input.album.length > 160)) return json(res,400,{error:'Niepoprawna nazwa albumu.'});
          if (input.visible !== undefined && typeof input.visible !== 'boolean') return json(res,400,{error:'Niepoprawna widoczność.'});
          if (input.galleryVisible !== undefined && typeof input.galleryVisible !== 'boolean') return json(res,400,{error:'Niepoprawna widoczność w galerii.'});
          if (input.album === undefined && input.visible === undefined && input.galleryVisible === undefined) return json(res,400,{error:'Wybierz zmianę.'});
          const rows = input.ids.map(id=>db.prepare('SELECT data FROM photos WHERE id=?').get(id));
          if (rows.some(row=>!row)) return json(res,409,{error:'Lista zdjęć się zmieniła. Odśwież panel.'});
          if (input.galleryVisible === false && rows.some(row=>!(input.album ?? JSON.parse(row.data).album ?? '').trim())) return json(res,400,{error:'Najpierw przypisz zdjęcie do albumu.'});
          mutateGallery(()=>rows.forEach(row=>{
            const photo=JSON.parse(row.data);
            if(input.album !== undefined) { if(photo.album!==input.album.trim().normalize('NFC'))photo.albumCover=false;photo.album=input.album.trim().normalize('NFC'); }
            if(input.visible !== undefined) photo.visible=input.visible;
            if(input.galleryVisible !== undefined) photo.galleryVisible=input.galleryVisible;
            if(!photo.album) photo.galleryVisible=true;
            db.prepare('UPDATE photos SET data=? WHERE id=?').run(JSON.stringify(photo),photo.id);
          }));
          return json(res,200,{ok:true});
        }
        if (pathname === '/api/photo-order' && req.method === 'PUT') {
          const input=await body(req), current=db.prepare('SELECT id FROM photos').all().map(row=>row.id);
          if (!Array.isArray(input.ids) || input.ids.length !== current.length || new Set(input.ids).size !== current.length || input.ids.some(id=>!current.includes(id)))
            return json(res,409,{error:'Lista zdjęć się zmieniła. Odśwież panel przed zmianą kolejności.'});
          mutateGallery(()=>input.ids.forEach((id,index)=>db.prepare('UPDATE photos SET position=? WHERE id=?').run(index,id)));
          return json(res,200,{ok:true});
        }
        if (pathname === '/api/photos' && req.method === 'POST') {
          const input = await body(req);
          const photo = normalize(input);
          photo.id = crypto.randomUUID();
          const upload = storeImages(input);
          photo.src = upload.src;
          photo.thumbUrl = upload.thumbUrl;
          try {
            mutateGallery(() =>
              insert.run(
                photo.id,
                photo.category,
                JSON.stringify(photo),
                db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM photos').get().next,
              ),
            );
          } catch (error) {
            upload.files.forEach((file) => fs.unlinkSync(file));
            throw error;
          }
          return json(res, 201, photo);
        }
        const id = pathname.match(/^\/api\/photos\/([\w-]+)$/)?.[1];
        if (id && ['PUT', 'DELETE'].includes(req.method)) {
          const row = db.prepare('SELECT data FROM photos WHERE id=?').get(id);
          if (!row) return json(res, 404, { error: 'Nie znaleziono zdjęcia.' });
          if (req.method === 'DELETE') {
            const permanent = url.searchParams.get('permanent') === '1';
            if (permanent && (await body(req))?.confirmId !== id) return json(res, 400, { error: 'Potwierdź trwałe usunięcie wybranego wpisu.' });
            mutateGallery(() => {
              if (!permanent) db.prepare('INSERT INTO trash SELECT ?,id,data,position,? FROM photos WHERE id=?').run('photos', new Date().toISOString(), id);
              db.prepare('DELETE FROM photos WHERE id=?').run(id);
            });
            // Plik pozostaje na dysku, aby można było odzyskać usunięte zdjęcie.
            return json(res, 200, { ok: true });
          }
          const photo = normalize(await body(req), JSON.parse(row.data));
          mutateGallery(() =>
            db
              .prepare('UPDATE photos SET category=?, data=? WHERE id=?')
              .run(photo.category, JSON.stringify(photo), id),
          );
          return json(res, 200, photo);
        }
        return json(res, 404, { error: 'Nieznany adres API.' });
      }
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405);
        return res.end();
      }
      const routes = require('./shared/pretty-routes.cjs');
      const route = routes.resolve(url);
      if (route.redirect) { res.writeHead(302, {Location: route.redirect, 'Cache-Control':'no-store'}); return res.end(); }
      const relative = route.file || (pathname === '/' ? 'index.html' : pathname.replace(/^\//, ''));
      if(route.id) url.searchParams.set('id',route.id);
      if(route.album) url.searchParams.set('album',route.album);
      // Otwarte przed reorganizacją karty mogą nadal używać dawnych adresów zdjęć.
      if (
        /^assets\/(?:(?:hobby|uploads)|images\/(?:gallery|projects))\/[^/\\]+\.(?:jpe?g|png|webp)$/i.test(
          relative,
        )
      ) {
        const name = path.basename(relative);
        for (const group of ['gallery', 'projects']) {
          const size = path.parse(name).name.endsWith('_thumb') ? '800px' : '2400px';
          const target = `assets/images/${group}/${size}/${name}`;
          if (fs.existsSync(path.join(ROOT, target))) {
            res.writeHead(302, { Location: '/' + target, 'Cache-Control': 'no-store' });
            return res.end();
          }
        }
      }
      const file = path.resolve(ROOT, relative.endsWith('.html') && !relative.includes('/') ? 'pages/' + relative : relative);
      const extension = path.extname(file).toLowerCase();
      const staticAllowed =
        !relative.includes('\\') &&
        !relative.split('/').some((part) => part.startsWith('.')) &&
        file.startsWith(ROOT + path.sep) &&
        MIME[extension] &&
        (relative.startsWith('assets/') || !relative.includes('/'));
      if (!staticAllowed) {
        return notFound(req, res);
      }
      const stats = await fs.promises.stat(file);
      if (!stats.isFile()) {
        return notFound(req, res);
      }
      if (extension === '.html') {
        const raw=routes.html(renderPage(await fs.promises.readFile(file, 'utf8'), relative));
        let base='http://'+req.headers.host;
        if(process.env.PUBLIC_SITE_URL){try{const configured=new URL(process.env.PUBLIC_SITE_URL);if(['http:','https:'].includes(configured.protocol))base=configured.origin;}catch{}}
        const html = Buffer.from(relative==='admin.html'?raw:require('./server/social-meta.cjs').socialMeta(raw,{url,base,photos:db.prepare('SELECT data FROM photos ORDER BY position').all().map(row=>JSON.parse(row.data)),projects:db.prepare('SELECT data FROM projects ORDER BY position').all().map(row=>JSON.parse(row.data))}));
        res.writeHead(200, {
          'Content-Type': MIME[extension],
          'Content-Length': html.length,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache',
        });
        return res.end(req.method === 'HEAD' ? undefined : html);
      }
      return sendAsset(req, res, file, stats, MIME[extension]);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return notFound(req, res);
      }
      if (!res.headersSent)
        json(res, error.status || 500, {
          error: error.status ? error.message : 'Błąd lokalnego serwera.',
        });
      console.error(error.message);
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (require.main === module) {
  if (fs.existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));
  const server = createGalleryServer();
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '127.0.0.1', () =>
    console.log(
      `Portfolio: http://localhost:${port}\nGaleria: http://localhost:${port}/hobby.html\nPanel: http://localhost:${port}/admin.html`,
    ),
  );
  server.on('error', (error) => {
    console.error(
      error.code === 'EADDRINUSE'
        ? 'Port jest zajęty. Zamknij poprzedni serwer lub zmień PORT.'
        : error.message,
    );
    process.exitCode = 1;
  });
  process.on('SIGINT', () => server.close());
  process.on('SIGTERM', () => server.close());
}
module.exports = { createGalleryServer };
