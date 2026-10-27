function ensureCaseColumns(db){
  const columns=db.prepare('PRAGMA table_info(messages)').all().map(column=>column.name);
  if(!columns.includes('case_status'))db.exec("ALTER TABLE messages ADD COLUMN case_status TEXT NOT NULL DEFAULT 'new'");
  if(!columns.includes('private_note'))db.exec("ALTER TABLE messages ADD COLUMN private_note TEXT NOT NULL DEFAULT ''");
}
const crypto = require('node:crypto');
function createInbox({ db, json, body, authenticated, options }) {
  db.exec(
    `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, email TEXT NOT NULL, category TEXT NOT NULL, details TEXT NOT NULL, message TEXT NOT NULL, created TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, mail_status TEXT NOT NULL DEFAULT 'pending');`,
  );
  if (!db.prepare('PRAGMA table_info(messages)').all().some(column => column.name === 'folder')) db.exec("ALTER TABLE messages ADD COLUMN folder TEXT NOT NULL DEFAULT 'inbox' CHECK(folder IN ('inbox','spam','trash'))");
  ensureCaseColumns(db);
  const categories = {
    it: 'Projekt IT',
    photo: 'Fotografia',
    tutoring: 'Korepetycje',
    other: 'Inne',
  };
  const details = {
    it: ['web', 'hackathon', 'other'],
    photo: ['concert', 'portrait', 'event'],
    tutoring: ['basic', 'advanced', 'university', 'other', 'programming', 'maths'],
    other: ['other'],
  };
  const attempts = new Map();
  const configured = () =>
    !options.mailDisabled &&
    Boolean(options.notifyMessage || (process.env.RESEND_API_KEY && process.env.CONTACT_MAIL_FROM));
  async function notify(item) {
    let state = 'not_configured';
    if (configured()) {
      try {
        if (options.notifyMessage) await options.notifyMessage(item);
        else {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            signal: AbortSignal.timeout(10000),
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
              'Idempotency-Key': `contact-${item.id}`,
            },
            body: JSON.stringify({
              from: process.env.CONTACT_MAIL_FROM,
              to: [process.env.CONTACT_MAIL_TO || 'podyma.marcin33@gmail.com'],
              reply_to: item.email,
              subject: `Portfolio: ${categories[item.category]}`,
              text: `Od: ${item.email}\nTemat: ${categories[item.category]} / ${item.details}\n\n${item.message}`,
            }),
          });
          if (!response.ok) throw new Error('Mail provider rejected notification');
        }
        state = 'sent';
      } catch {
        state = 'failed';
      }
    }
    db.prepare('UPDATE messages SET mail_status=? WHERE id=?').run(state, item.id);
  }
  return async (req, res, pathname) => {
    if (pathname === '/api/contact' && req.method === 'POST') {
      const input = await body(req, 32 * 1024);
      if (!input || typeof input !== 'object' || Array.isArray(input))
        return (json(res, 400, { error: 'Niepoprawna wiadomość.' }), true);
      const email = typeof input.email === 'string' ? input.email.trim() : '';
      const message = typeof input.message === 'string' ? input.message.trim() : '';
      if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !Object.hasOwn(categories, input.category) ||
        !details[input.category].includes(input.details) ||
        message.length < 10 ||
        message.length > 5000 ||
        !/^[\da-f-]{36}$/i.test(input.requestId || '')
      )
        return (json(res, 400, { error: 'Sprawdź e-mail, temat i treść wiadomości.' }), true);
      const existing = db.prepare('SELECT id FROM messages WHERE id=?').get(input.requestId);
      if (existing) return (json(res, 200, { ok: true }), true);
      const key = req.socket.remoteAddress;
      const now = Date.now();
      const recent = (attempts.get(key) || []).filter((time) => time > now - 15 * 60 * 1000);
      if (recent.length >= 5)
        return (
          json(res, 429, { error: 'Poczekaj chwilę przed wysłaniem kolejnej wiadomości.' }),
          true
        );
      recent.push(now);
      attempts.set(key, recent);
      const item = {
        id: input.requestId,
        email,
        category: input.category,
        details: input.details,
        message,
        created: new Date().toISOString(),
      };
      db.prepare(
        'INSERT INTO messages (id,email,category,details,message,created) VALUES (?,?,?,?,?,?)',
      ).run(item.id, email, item.category, item.details, message, item.created);
      await notify(item);
      json(res, 201, { ok: true });
      return true;
    }
    if (!pathname.startsWith('/api/messages')) return false;
    if (!authenticated(req))
      return (json(res, 401, { error: 'Zaloguj się do panelu administratora.' }), true);
    if (pathname === '/api/messages' && req.method === 'GET') {
      const folder = new URL(req.url, 'http://localhost').searchParams.get('folder') || 'inbox';
      if (!['inbox', 'spam', 'trash'].includes(folder)) return (json(res, 400, { error: 'Niepoprawny folder.' }), true);
      const counts = Object.fromEntries(['inbox', 'spam', 'trash'].map(name => [name, db.prepare('SELECT COUNT(*) AS count FROM messages WHERE folder=?').get(name).count]));
      json(res, 200, {
        items: db.prepare('SELECT * FROM messages WHERE folder=? ORDER BY created DESC LIMIT 100').all(folder),
        unread: db.prepare("SELECT COUNT(*) AS count FROM messages WHERE is_read=0 AND folder='inbox'").get().count,
        counts,
        snapshot: folder === 'trash' ? crypto.createHash('sha256').update(JSON.stringify(db.prepare("SELECT id FROM messages WHERE folder='trash' ORDER BY id").all().map(row => row.id))).digest('hex') : undefined,
        mailConfigured: configured(),
      });
      return true;
    }
    if (pathname === '/api/messages' && req.method === 'DELETE') {
      const input = await body(req, 16384);
      if (input?.folder !== 'trash' || input.confirmation !== 'EMPTY_TRASH') return (json(res, 400, { error: 'Potwierdź opróżnienie kosza wiadomości.' }), true);
      const ids = db.prepare("SELECT id FROM messages WHERE folder='trash' ORDER BY id").all().map(row => row.id);
      const snapshot = crypto.createHash('sha256').update(JSON.stringify(ids)).digest('hex');
      if (input.snapshot !== snapshot) return (json(res, 409, { error: 'Zawartość kosza zmieniła się. Sprawdź ją i potwierdź ponownie.' }), true);
      const result = db.prepare("DELETE FROM messages WHERE folder='trash'").run();
      json(res, 200, { ok: true, deleted: result.changes }); return true;
    }
    const match = pathname.match(/^\/api\/messages\/([\da-f-]+)(\/notify)?$/i);
    const item = match && db.prepare('SELECT * FROM messages WHERE id=?').get(match[1]);
    if (!item) return (json(res, 404, { error: 'Nie znaleziono wiadomości.' }), true);
    if (req.method === 'PUT' && !match[2]) {
      const input = await body(req, 16384);
      if(input?.caseStatus!==undefined || input?.privateNote!==undefined){
        if((input.caseStatus!==undefined&&!['new','reply','agreed','done'].includes(input.caseStatus))||(input.privateNote!==undefined&&(typeof input.privateNote!=='string'||input.privateNote.length>4000)))return (json(res,400,{error:'Sprawdź status sprawy i notatkę (maks. 4000 znaków).'}),true);
        db.prepare('UPDATE messages SET case_status=?,private_note=? WHERE id=?').run(input.caseStatus??item.case_status,input.privateNote??item.private_note,item.id);
        return (json(res,200,{ok:true}),true);
      }

      if (input?.folder !== undefined) {
        if (!['inbox', 'spam', 'trash'].includes(input.folder)) return (json(res, 400, { error: 'Niepoprawny folder.' }), true);
        db.prepare('UPDATE messages SET folder=? WHERE id=?').run(input.folder, item.id);
      } else {
        if (typeof input?.read !== 'boolean') return (json(res, 400, { error: 'Niepoprawny status.' }), true);
        db.prepare('UPDATE messages SET is_read=? WHERE id=?').run(Number(input.read), item.id);
      }
      json(res, 200, { ok: true });
      return true;
    }
    if (req.method === 'DELETE' && !match[2]) {
      const input = await body(req, 1024);
      if (item.folder !== 'trash' || input?.confirmId !== item.id)
        return (json(res, 400, { error: 'Najpierw przenieś wiadomość do kosza i potwierdź trwałe usunięcie.' }), true);
      db.prepare('DELETE FROM messages WHERE id=?').run(item.id);
      json(res, 200, { ok: true }); return true;
    }
    if (req.method === 'POST' && match[2]) {
      if (item.folder !== 'inbox') return (json(res, 409, { error: 'Przywróć wiadomość do odebranych przed ponowieniem powiadomienia.' }), true);
      if (!configured())
        return (json(res, 409, { error: 'Uzupełnij konfigurację poczty w .env.' }), true);
      if (item.mail_status !== 'sent') await notify(item);
      json(res, 200, {
        status: db.prepare('SELECT mail_status FROM messages WHERE id=?').get(item.id).mail_status,
      });
      return true;
    }
    json(res, 405, { error: 'Niedozwolona operacja.' });
    return true;
  };
}
module.exports = { createInbox, ensureCaseColumns };
