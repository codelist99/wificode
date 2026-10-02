import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const file = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'wificode.sqlite');
mkdirSync(dirname(file), { recursive: true });
export const db = new DatabaseSync(file);
db.exec(`
  PRAGMA journal_mode=WAL;
  PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY, email TEXT, phone TEXT, first_name TEXT DEFAULT '', last_name TEXT DEFAULT '',
    source TEXT DEFAULT 'website', status TEXT DEFAULT 'new', tags TEXT DEFAULT '', notes TEXT DEFAULT '',
    email_consent INTEGER DEFAULT 0, sms_consent INTEGER DEFAULT 0, unsubscribed INTEGER DEFAULT 0,
    aid TEXT DEFAULT '', tid TEXT DEFAULT '', utm_source TEXT DEFAULT '', utm_campaign TEXT DEFAULT '',
    landing_page TEXT DEFAULT '', ip TEXT DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    UNIQUE(email), UNIQUE(phone)
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY, lead_id INTEGER, type TEXT NOT NULL, value REAL DEFAULT 0, currency TEXT DEFAULT 'USD',
    product_id TEXT DEFAULT '', transaction_id TEXT DEFAULT '', page TEXT DEFAULT '', metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL, UNIQUE(transaction_id, type), FOREIGN KEY(lead_id) REFERENCES leads(id)
  );
  CREATE TABLE IF NOT EXISTS automations (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, channel TEXT NOT NULL, delay_minutes INTEGER NOT NULL DEFAULT 5,
    subject TEXT DEFAULT '', message TEXT NOT NULL, enabled INTEGER DEFAULT 0, trigger_event TEXT DEFAULT 'opt_in',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY, lead_id INTEGER NOT NULL, automation_id INTEGER, channel TEXT NOT NULL,
    recipient TEXT NOT NULL, subject TEXT DEFAULT '', body TEXT NOT NULL, status TEXT DEFAULT 'scheduled',
    provider_id TEXT DEFAULT '', error TEXT DEFAULT '', scheduled_at TEXT NOT NULL, sent_at TEXT,
    created_at TEXT NOT NULL, FOREIGN KEY(lead_id) REFERENCES leads(id), FOREIGN KEY(automation_id) REFERENCES automations(id)
  );
  CREATE TABLE IF NOT EXISTS gateway_profiles (
    id INTEGER PRIMARY KEY, lead_id INTEGER NOT NULL UNIQUE, gateway TEXT NOT NULL DEFAULT 'authorize_net',
    customer_profile_id TEXT NOT NULL, payment_profile_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    FOREIGN KEY(lead_id) REFERENCES leads(id)
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY, lead_id INTEGER NOT NULL, product_id TEXT NOT NULL, product_name TEXT NOT NULL,
    amount REAL NOT NULL, currency TEXT NOT NULL DEFAULT 'USD', status TEXT NOT NULL DEFAULT 'pending',
    transaction_id TEXT UNIQUE, response_code TEXT DEFAULT '', response_message TEXT DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(lead_id) REFERENCES leads(id),
    UNIQUE(lead_id, product_id)
  );
`);

const now = () => new Date().toISOString();
const clean = value => String(value ?? '').trim();

export function upsertLead(input = {}) {
  const email = clean(input.email).toLowerCase();
  const phone = clean(input.phone);
  if (!email && !phone) throw new Error('Email or phone is required');
  let lead = email ? db.prepare('SELECT * FROM leads WHERE email=?').get(email) : null;
  if (!lead && phone) lead = db.prepare('SELECT * FROM leads WHERE phone=?').get(phone);
  const stamp = now();
  if (lead) {
    db.prepare(`UPDATE leads SET email=COALESCE(NULLIF(?,''),email), phone=COALESCE(NULLIF(?,''),phone),
      first_name=COALESCE(NULLIF(?,''),first_name), last_name=COALESCE(NULLIF(?,''),last_name),
      source=COALESCE(NULLIF(?,''),source), email_consent=MAX(email_consent,?), sms_consent=MAX(sms_consent,?),
      aid=COALESCE(NULLIF(?,''),aid), tid=COALESCE(NULLIF(?,''),tid), utm_source=COALESCE(NULLIF(?,''),utm_source),
      utm_campaign=COALESCE(NULLIF(?,''),utm_campaign), landing_page=COALESCE(NULLIF(?,''),landing_page), updated_at=? WHERE id=?`)
      .run(email, phone, clean(input.first_name || input.name), clean(input.last_name), clean(input.source),
        input.email_consent ? 1 : 0, input.sms_consent ? 1 : 0, clean(input.aid), clean(input.tid),
        clean(input.utm_source), clean(input.utm_campaign), clean(input.landing_page), stamp, lead.id);
    return { lead: db.prepare('SELECT * FROM leads WHERE id=?').get(lead.id), created: false };
  }
  const result = db.prepare(`INSERT INTO leads(email,phone,first_name,last_name,source,email_consent,sms_consent,
    aid,tid,utm_source,utm_campaign,landing_page,ip,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(email || null, phone || null, clean(input.first_name || input.name), clean(input.last_name), clean(input.source) || 'website',
      input.email_consent ? 1 : 0, input.sms_consent ? 1 : 0, clean(input.aid), clean(input.tid), clean(input.utm_source),
      clean(input.utm_campaign), clean(input.landing_page), clean(input.ip), stamp, stamp);
  return { lead: db.prepare('SELECT * FROM leads WHERE id=?').get(result.lastInsertRowid), created: true };
}

export function addEvent(leadId, type, input = {}) {
  const result = db.prepare(`INSERT OR IGNORE INTO events(lead_id,type,value,currency,product_id,transaction_id,page,metadata,created_at)
    VALUES(?,?,?,?,?,?,?,?,?)`).run(leadId || null, type, Number(input.value || 0), clean(input.currency) || 'USD',
      clean(input.product_id), clean(input.transaction_id), clean(input.page), JSON.stringify(input.metadata || {}), now());
  if (leadId && ['sale','conversion'].includes(type)) db.prepare("UPDATE leads SET status='customer',updated_at=? WHERE id=?").run(now(), leadId);
  return result.changes > 0;
}

export function scheduleAutomations(lead, trigger = 'opt_in') {
  const rules = db.prepare('SELECT * FROM automations WHERE enabled=1 AND trigger_event=?').all(trigger);
  for (const rule of rules) {
    const recipient = rule.channel === 'sms' ? lead.phone : lead.email;
    const consent = rule.channel === 'sms' ? lead.sms_consent : lead.email_consent;
    if (!recipient || !consent || lead.unsubscribed) continue;
    const scheduled = new Date(Date.now() + rule.delay_minutes * 60000).toISOString();
    db.prepare(`INSERT INTO messages(lead_id,automation_id,channel,recipient,subject,body,scheduled_at,created_at)
      VALUES(?,?,?,?,?,?,?,?)`).run(lead.id, rule.id, rule.channel, recipient, rule.subject, rule.message, scheduled, now());
  }
}
