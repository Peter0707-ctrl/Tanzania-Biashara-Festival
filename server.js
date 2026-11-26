const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

function loadEnvFile(envPath, overwrite = false) {
  try {
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf-8');
    raw.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) return;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && (overwrite || process.env[key] === undefined || process.env[key] === '')) {
        process.env[key] = val;
      }
    });
  } catch (err) {}
}

loadEnvFile(path.join(__dirname, '.env'), true);

function getSelcomConfig() {
  loadEnvFile(path.join(__dirname, '.env'), true);
  const vendorId = String(process.env.SELCOM_VENDOR_ID || process.env.SELCOM_VENDOR || '').trim();
  const apiKey = String(process.env.SELCOM_API_KEY || '').trim();
  const apiSecret = String(process.env.SELCOM_API_SECRET || '').trim();
  const rawBaseUrl = String(process.env.SELCOM_BASE_URL || 'https://apigw.selcommobile.com').trim().replace(/\/+$/, '');
  const baseUrl = rawBaseUrl.replace(/\/v1$/i, '');
  const publicUrl = String(process.env.SELCOM_PUBLIC_URL || 'https://biasharafestival.co.tz').trim().replace(/\/+$/, '');
  const webhookUrl = String(process.env.SELCOM_WEBHOOK_URL || `${publicUrl}/api/webhooks/selcom`).trim();
  const testAmount = Number(process.env.SELCOM_TEST_AMOUNT || 0);
  return {
    vendorId,
    apiKey,
    apiSecret,
    baseUrl,
    publicUrl,
    webhookUrl,
    testAmount,
    configured: Boolean(vendorId && apiKey && apiSecret)
  };
}

function normalizeTzMsisdn(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('255') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return '255' + digits.slice(1);
  if (digits.length === 9) return '255' + digits;
  return digits;
}

function buildSelcomHeaders(payloadObj, apiKey, apiSecret) {
  const timestamp = new Date().toISOString();
  const keys = Object.keys(payloadObj || {});
  const signedFields = keys.join(',');
  const parts = [`timestamp=${timestamp}`];
  keys.forEach(k => {
    parts.push(`${k}=${String(payloadObj[k] ?? '')}`);
  });
  const signString = parts.join('&');
  const digest = crypto.createHmac('sha256', apiSecret).update(signString, 'utf8').digest('base64');
  const authToken = Buffer.from(apiKey, 'utf8').toString('base64');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `SELCOM ${authToken}`,
    'Digest-Method': 'HS256',
    'Digest': digest,
    'Timestamp': timestamp,
    'Signed-Fields': signedFields
  };
}

function selcomApiCall(method, endpointPath, payloadObj = {}) {
  return new Promise((resolve) => {
    const cfg = getSelcomConfig();
    if (!cfg.configured) {
      return resolve({ ok: false, configured: false, error: 'Selcom API credentials not yet configured in .env' });
    }
    try {
      const headers = buildSelcomHeaders(payloadObj, cfg.apiKey, cfg.apiSecret);
      let fullUrl = `${cfg.baseUrl}${endpointPath}`;
      let bodyStr = '';
      if (method === 'GET') {
        const qs = Object.keys(payloadObj)
          .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(payloadObj[k] ?? ''))}`)
          .join('&');
        if (qs) fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
      } else {
        bodyStr = JSON.stringify(payloadObj);
        headers['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8');
      }

      const parsedUrl = new URL(fullUrl);
      const reqOpts = {
        method,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        headers,
        timeout: 15000
      };

      const req = https.request(reqOpts, (res) => {
        let raw = '';
        res.on('data', chunk => { raw += chunk.toString('utf8'); });
        res.on('end', () => {
          try {
            const json = JSON.parse(raw || '{}');
            const isOk = res.statusCode >= 200 && res.statusCode < 300 && (json.resultcode === '000' || json.result === 'SUCCESS');
            resolve({ ok: isOk, configured: true, status: res.statusCode, data: json });
          } catch (e) {
            resolve({ ok: false, configured: true, status: res.statusCode, error: 'Invalid JSON from Selcom gateway' });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, configured: true, error: 'Selcom gateway request timed out' });
      });
      req.on('error', (err) => {
        resolve({ ok: false, configured: true, error: err.message || 'Selcom network error' });
      });

      if (bodyStr) req.write(bodyStr);
      req.end();
    } catch (err) {
      resolve({ ok: false, configured: true, error: err.message || 'Selcom request exception' });
    }
  });
}

async function createSelcomOrderAndPush({ orderId, amount, buyerName, buyerEmail, buyerPhone, boothCode, cities, paymentMethod, triggerPush = true }) {
  const cfg = getSelcomConfig();
  if (!cfg.configured) {
    return { configured: false, orderCreated: false, pushSent: false };
  }
  const msisdn = normalizeTzMsisdn(buyerPhone);
  const orderPayload = {
    vendor: cfg.vendorId,
    order_id: String(orderId),
    buyer_email: String(buyerEmail || 'info@biasharafestival.co.tz'),
    buyer_name: String(buyerName || 'TBF Exhibitor'),
    buyer_phone: msisdn,
    amount: Math.max(100, Math.round(Number(amount) || 0)),
    currency: 'TZS',
    buyer_remarks: `TBF Booth #${boothCode} (${(cities || []).join(', ')})`.slice(0, 96),
    merchant_remarks: `TBF Booth ${orderId}`.slice(0, 96),
    no_of_items: 1,
    webhook: Buffer.from(cfg.webhookUrl, 'utf8').toString('base64')
  };

  const orderRes = await selcomApiCall('POST', '/v1/checkout/create-order-minimal', orderPayload);
  if (!orderRes.ok) {
    return {
      configured: true,
      orderCreated: false,
      pushSent: false,
      error: orderRes.data?.message || orderRes.error || 'Selcom order creation failed'
    };
  }

  const row = Array.isArray(orderRes.data?.data) && orderRes.data.data[0] ? orderRes.data.data[0] : {};
  const reference = String(orderRes.data?.reference || row.reference || '');
  const paymentToken = String(row.payment_token || row.control_number || reference || '');
  let gatewayUrl = '';
  if (row.payment_gateway_url) {
    try {
      const decoded = Buffer.from(String(row.payment_gateway_url), 'base64').toString('utf8');
      gatewayUrl = /^https?:\/\//i.test(decoded) ? decoded : String(row.payment_gateway_url);
    } catch (e) {
      gatewayUrl = String(row.payment_gateway_url);
    }
  }

  let pushSent = false;
  let pushMessage = '';
  let transId = '';
  const isMobileMoney = !/card|visa|mastercard|bank|crdb|nmb/i.test(String(paymentMethod || ''));
  if (triggerPush && isMobileMoney && /^255[67]\d{8}$/.test(msisdn)) {
    transId = 'TBF' + Date.now().toString().slice(-9) + crypto.randomInt(10, 99);
    const pushRes = await selcomApiCall('POST', '/v1/checkout/wallet-payment', {
      transid: transId,
      order_id: String(orderId),
      msisdn
    });
    pushSent = Boolean(pushRes.ok);
    pushMessage = pushRes.data?.message || (pushSent ? 'USSD Push prompt sent to mobile phone' : (pushRes.error || ''));
  }

  return {
    configured: true,
    orderCreated: true,
    reference,
    controlNumber: paymentToken || reference,
    gatewayUrl,
    pushSent,
    pushMessage,
    transId
  };
}

async function querySelcomOrderStatus(orderId) {
  const cfg = getSelcomConfig();
  if (!cfg.configured || !orderId) return { configured: cfg.configured, paid: false };
  const statusRes = await selcomApiCall('GET', '/v1/checkout/order-status', { order_id: String(orderId) });
  if (!statusRes.ok) return { configured: true, paid: false, raw: statusRes.data };
  const row = Array.isArray(statusRes.data?.data) && statusRes.data.data[0] ? statusRes.data.data[0] : {};
  const payStatus = String(row.payment_status || statusRes.data?.payment_status || '').toUpperCase();
  const isPaid = payStatus === 'COMPLETED' || payStatus === 'PAID' || payStatus === 'SUCCESSFUL';
  return {
    configured: true,
    paid: isPaid,
    paymentStatus: payStatus || 'PENDING',
    reference: String(row.reference || statusRes.data?.reference || ''),
    transId: String(row.transid || ''),
    channel: String(row.channel || '')
  };
}

const IS_PROD = String(process.env.NODE_ENV || 'production').toLowerCase() === 'production';
const DEBUG_MODE = !IS_PROD && process.env.TBF_DEBUG === '1';
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SECRET_PATH = path.join(DATA_DIR, '.auth_secret');
const PUBLIC_DIR = path.join(__dirname, 'public');

const dbAdapter = require('./data/db_adapter');
dbAdapter.initialize().catch(err => {
  if (DEBUG_MODE) console.warn('[DB] Adapter initialization warning:', err.message);
});

const HOLD_TTL_MS = 10 * 60 * 1000; // 10 minutes temporary booth reservation hold
const UNPAID_BOOKING_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours auto-expiry for unpaid online reservations
const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours sliding session
const MANAGE_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes step-up management token

const ADMIN_IDENTIFIER = String(process.env.TBF_ADMIN_EMAIL || 'info@biasharafestival.co.tz').trim().toLowerCase();
const ADMIN_SECRET_CONFIGURED = String(process.env.TBF_ADMIN_PASSWORD || '').trim();
const OFFICIAL_MAIL_FROM = String(process.env.TBF_MAIL_FROM || 'info@biasharafestival.co.tz').trim();
const OFFICIAL_MAIL_NAME = String(process.env.TBF_MAIL_NAME || 'Tanzania Biashara Festival').trim();

function sendFestivalEmail(toEmail, subject, htmlBody) {
  return new Promise((resolve) => {
    const cleanTo = String(toEmail || '').replace(/[\r\n<>]/g, '').trim();
    if (!isValidEmail(cleanTo)) return resolve({ sent: false, reason: 'invalid_email' });
    const cleanSubject = String(subject || 'Tanzania Biashara Festival Update').replace(/[\r\n]/g, ' ').trim();
    const rawMime = [
      `From: ${OFFICIAL_MAIL_NAME} <${OFFICIAL_MAIL_FROM}>`,
      `Reply-To: ${OFFICIAL_MAIL_FROM}`,
      `To: ${cleanTo}`,
      `Subject: ${cleanSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      String(htmlBody || '')
    ].join('\r\n');

    const sendmailBins = ['/usr/sbin/sendmail', '/usr/lib/sendmail', 'sendmail'];
    const bin = sendmailBins.find(p => p === 'sendmail' || fs.existsSync(p));
    if (!bin) return resolve({ sent: false, reason: 'no_sendmail' });

    try {
      const child = spawn(bin, ['-t', '-i', '-f', OFFICIAL_MAIL_FROM], { stdio: ['pipe', 'ignore', 'ignore'] });
      child.on('error', () => resolve({ sent: false, reason: 'spawn_error' }));
      child.on('close', (code) => resolve({ sent: code === 0 }));
      child.stdin.write(rawMime);
      child.stdin.end();
    } catch (err) {
      resolve({ sent: false, reason: 'exec_error' });
    }
  });
}

function buildBrandedNewsletterHtml(title, bodyHtml) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:#0b6b68;color:#ffffff;padding:24px 28px;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a7f3d0;font-weight:bold;">TANZANIA BIASHARA FESTIVAL (TBF)</div>
        <h2 style="margin:8px 0 0;font-size:20px;line-height:1.3;">${String(title || '').replace(/[<>]/g, '')}</h2>
      </div>
      <div style="padding:24px 28px;color:#1e293b;font-size:14px;line-height:1.65;">
        ${bodyHtml}
      </div>
      <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
        <strong>Tanzania Biashara Festival Secretariat</strong> &bull;
        <a href="https://biasharafestival.co.tz" style="color:#0b6b68;font-weight:bold;">biasharafestival.co.tz</a> &bull;
        Tel: +255 767 053 250 &bull; ${OFFICIAL_MAIL_FROM}
      </div>
    </div>
  `;
}

// In-memory runtime security & presence state (bounded/pruned)
const activeVisitorSessions = new Map();
const rateLimitStore = new Map();
const authLockoutStore = new Map();
const pinLockoutStore = new Map();
const revokedAdminTokens = new Map();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function getHmacSecret() {
  if (process.env.TBF_SESSION_SECRET && String(process.env.TBF_SESSION_SECRET).trim().length >= 32) {
    return String(process.env.TBF_SESSION_SECRET).trim();
  }
  try {
    if (fs.existsSync(SECRET_PATH)) {
      const existing = fs.readFileSync(SECRET_PATH, 'utf-8').trim();
      if (existing.length >= 32) return existing;
    }
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    const created = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_PATH, created, { encoding: 'utf-8', mode: 0o600 });
    return created;
  } catch (err) {
    return crypto.randomBytes(32).toString('hex');
  }
}

const HMAC_SECRET = getHmacSecret();
// Separate cryptographic subkeys (never reuse a single raw key across signing, encryption, and blind indexing)
const AUTH_SIGNING_KEY = crypto.createHmac('sha256', HMAC_SECRET).update('tbf:auth-signing:v2').digest();
const DATA_ENC_KEY = crypto.createHmac('sha256', HMAC_SECRET).update('tbf:aes256gcm-pii:v1').digest();
const BLIND_INDEX_KEY = crypto.createHmac('sha256', HMAC_SECRET).update('tbf:blind-index:v1').digest();
const ENC_PREFIX = 'enc:v1:';

function encryptField(plainText) {
  if (plainText === undefined || plainText === null) return '';
  const str = String(plainText);
  if (!str) return '';
  if (str.startsWith(ENC_PREFIX)) return str;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', DATA_ENC_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('base64url')}:${authTag.toString('base64url')}:${ciphertext.toString('base64url')}`;
}

function decryptField(stored) {
  if (stored === undefined || stored === null) return '';
  const str = String(stored);
  if (!str.startsWith(ENC_PREFIX)) return str;
  try {
    const parts = str.slice(ENC_PREFIX.length).split(':');
    if (parts.length !== 3) return '';
    const iv = Buffer.from(parts[0], 'base64url');
    const authTag = Buffer.from(parts[1], 'base64url');
    const ciphertext = Buffer.from(parts[2], 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', DATA_ENC_KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch (err) {
    return '';
  }
}

function computeBlindIndex(normalizedValue) {
  const s = String(normalizedValue || '').trim();
  if (!s) return '';
  return crypto.createHmac('sha256', BLIND_INDEX_KEY).update(s).digest('hex').slice(0, 32);
}

function sanitizeTextInput(value, maxLen = 180) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function isValidEmail(email) {
  return /^[^\s@<>]{1,64}@[^\s@<>]{1,120}\.[^\s@<>]{2,32}$/.test(String(email || '').trim().toLowerCase());
}

function hashSecret(plainText) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plainText), salt, 32, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `${salt}:${hash}`;
}

function verifySecret(plainText, storedHash) {
  if (!storedHash || !String(storedHash).includes(':')) return false;
  const [salt, originalHex] = String(storedHash).split(':');
  if (!salt || !originalHex) return false;
  try {
    const derived = crypto.scryptSync(String(plainText), salt, 32, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(originalHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch (err) {
    return false;
  }
}

const ADMIN_CREDENTIAL_HASH = ADMIN_SECRET_CONFIGURED ? hashSecret(ADMIN_SECRET_CONFIGURED) : null;

function signPayload(obj, ttlMs) {
  const body = { ...obj, exp: Date.now() + ttlMs };
  const encoded = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SIGNING_KEY).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySignedToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', AUTH_SIGNING_KEY).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function isHttpsRequest(req) {
  if (!req) return false;
  return Boolean(req.socket?.encrypted) || String(req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https';
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const map = {};
  header.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) {
      try { map[k] = decodeURIComponent(v); } catch (e) { map[k] = v; }
    }
  });
  return map;
}

// Extract mobile-IP-tolerant contextual fingerprint (deviceId + UA family)
function getClientContext(req) {
  const cookies = parseCookies(req);
  const existingDeviceId = cookies.tbf_device_id;
  const deviceId = existingDeviceId && /^[a-zA-Z0-9_-]{12,64}$/.test(existingDeviceId)
    ? existingDeviceId
    : crypto.randomBytes(16).toString('hex');
  const ua = String(req.headers['user-agent'] || 'unknown');
  const uaFamily = crypto.createHash('sha256').update(ua.replace(/[\d.]+/g, 'x')).digest('hex').slice(0, 16);
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const clientIp = fwd || req.socket.remoteAddress || '127.0.0.1';
  return {
    deviceId,
    isNewDeviceCookie: !existingDeviceId,
    uaFamily,
    clientIp
  };
}

function buildCookieHeader(name, value, { maxAge = 0, httpOnly = true, secure = false } = {}) {
  const safeName = String(name || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanVal = encodeURIComponent(String(value || '').replace(/[\r\n]/g, ''));
  const attrs = [
    `${safeName}=${cleanVal}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`
  ];
  if (httpOnly) attrs.push('HttpOnly');
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

function pruneMapStore(store, maxSize = 5000) {
  if (store.size <= maxSize) return;
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if ((v.resetAt && v.resetAt <= now) || (v.lockedUntil && v.lockedUntil <= now) || store.size > maxSize) {
      store.delete(k);
    }
    if (store.size <= Math.floor(maxSize * 0.75)) break;
  }
}

function isMaliciousOrAutomatedBot(req, isMutation = false) {
  const ua = String(req.headers['user-agent'] || '').trim();
  if (!ua && isMutation) return true;
  // Always block vulnerability scanners & exploit bots on all routes
  if (/(sqlmap|nikto|nmap|masscan|zgrab|gobuster|dirbuster|nuclei|acunetix|nessus|wfuzz|havij|libwww-perl|morfeus)/i.test(ua)) {
    return true;
  }
  // On state-mutating POST/DELETE routes (except Selcom webhook), block raw scripting libraries & headless scrapers
  if (isMutation && /(python-requests|python-urllib|go-http-client|scrapy|phantomjs|headlesschrome| pycurl|axios\/0\.|java\/1\.|Mechanize)/i.test(ua)) {
    return true;
  }
  return false;
}

function hasHoneypotTripped(payload) {
  if (!payload || typeof payload !== 'object') return false;
  return Boolean(
    (payload.website_url && String(payload.website_url).trim() !== '') ||
    (payload.fax_number && String(payload.fax_number).trim() !== '') ||
    (payload._hp_trap && String(payload._hp_trap).trim() !== '')
  );
}

function checkRateLimit(bucket, maxHits, windowMs, ipAddress = '') {
  pruneMapStore(rateLimitStore);
  const now = Date.now();
  const entry = rateLimitStore.get(bucket);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(bucket, { count: 1, resetAt: now + windowMs });
  } else if (entry.count >= maxHits) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  } else {
    entry.count += 1;
  }

  // Enforce strict IP-only bucket as well so cookie-less bots cannot bypass rate limits by rotating deviceId
  if (ipAddress) {
    const ipBucket = `ip-strict:${bucket.split(':')[0]}:${ipAddress}`;
    const ipMax = Math.max(maxHits, Math.ceil(maxHits * 1.5));
    const ipEntry = rateLimitStore.get(ipBucket);
    if (!ipEntry || ipEntry.resetAt <= now) {
      rateLimitStore.set(ipBucket, { count: 1, resetAt: now + windowMs });
    } else if (ipEntry.count >= ipMax) {
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((ipEntry.resetAt - now) / 1000)) };
    } else {
      ipEntry.count += 1;
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

function getLockoutState(store, key) {
  const entry = store.get(key);
  if (!entry) return { locked: false, retryAfterSec: 0 };
  if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
    return { locked: true, retryAfterSec: Math.max(1, Math.ceil((entry.lockedUntil - Date.now()) / 1000)) };
  }
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    store.delete(key);
  }
  return { locked: false, retryAfterSec: 0 };
}

function recordFailure(store, key, maxAttempts = 5, lockDurationMs = 10 * 60 * 1000) {
  pruneMapStore(store);
  const entry = store.get(key) || { failures: 0, lockedUntil: 0 };
  entry.failures += 1;
  if (entry.failures >= maxAttempts) {
    entry.lockedUntil = Date.now() + lockDurationMs;
  }
  store.set(key, entry);
  return entry;
}

// FIFO Atomic DB Transaction Queue (solves JSON file concurrency & partial writes)
let dbQueue = Promise.resolve();
let atomicWriteSeq = 0;

function ensureDbShape(db) {
  if (!Array.isArray(db.regions)) db.regions = [];
  if (!Array.isArray(db.boothPackages)) db.boothPackages = [];
  if (!Array.isArray(db.bookings)) db.bookings = [];
  if (!Array.isArray(db.sponsors)) db.sponsors = [];
  if (!Array.isArray(db.announcements)) db.announcements = [];
  if (!Array.isArray(db.newsletterSubscribers)) db.newsletterSubscribers = [];
  if (!Array.isArray(db.boothHolds)) db.boothHolds = [];
  if (!Array.isArray(db.securityLog)) db.securityLog = [];
  if (!Array.isArray(db.organizerAccounts)) db.organizerAccounts = [];
  if (!db.analytics) db.analytics = {};
  return db;
}

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return ensureDbShape(JSON.parse(raw));
  } catch (err) {
    if (DEBUG_MODE) console.error('Error reading DB:', err);
    return ensureDbShape({});
  }
}

function writeDBAtomic(data) {
  atomicWriteSeq += 1;
  const tmpPath = `${DB_PATH}.tmp.${process.pid}.${atomicWriteSeq}`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o600 });
  try {
    fs.chmodSync(tmpPath, 0o600);
  } catch (e) {}
  fs.renameSync(tmpPath, DB_PATH);
}

function recalcRegionCodeIfUnused(db, regionName, boothCode) {
  const stillBooked = db.bookings.some(b => {
    const status = String(b.status || '').toLowerCase();
    return status !== 'cancelled' && status !== 'expired'
      && Array.isArray(b.cities) && b.cities.includes(regionName)
      && b.boothCode === boothCode;
  });
  if (!stillBooked) {
    const reg = db.regions.find(r => r.name === regionName);
    if (reg && Array.isArray(reg.bookedCodes)) {
      const idx = reg.bookedCodes.indexOf(boothCode);
      if (idx !== -1) {
        reg.bookedCodes.splice(idx, 1);
        if (reg.bookedBooths > 0) reg.bookedBooths -= 1;
      }
    }
  }
}

function pruneExpiredRecords(db) {
  const now = Date.now();
  let changed = false;

  const beforeHolds = db.boothHolds.length;
  db.boothHolds = db.boothHolds.filter(h => Number(h.expiresAt || 0) > now);
  if (db.boothHolds.length !== beforeHolds) changed = true;

  db.bookings.forEach(b => {
    const st = String(b.status || '').toLowerCase();
    if (st === 'awaiting payment' && b.paymentExpiresAt && Date.parse(b.paymentExpiresAt) <= now) {
      b.status = 'Expired';
      changed = true;
      if (Array.isArray(b.cities)) {
        b.cities.forEach(cityName => recalcRegionCodeIfUnused(db, cityName, b.boothCode));
      }
    }
  });

  if (db.securityLog.length > 100) {
    db.securityLog = db.securityLog.slice(0, 100);
    changed = true;
  }
  return changed;
}

function withDbTransaction(mutator) {
  const run = dbQueue.then(async () => {
    let db = null;
    if (dbAdapter && dbAdapter.isMySQL) {
      db = await dbAdapter.readState();
    }
    if (!db) {
      db = readDB();
    } else {
      ensureDbShape(db);
    }
    const pruned = pruneExpiredRecords(db);
    const result = await mutator(db);
    if (pruned || (result && result.dirty !== false)) {
      writeDBAtomic(db);
      if (dbAdapter && dbAdapter.isMySQL) {
        await dbAdapter.writeState(db);
      }
    }
    return result ? result.value : undefined;
  });
  dbQueue = run.catch(() => {});
  return run;
}

function readDbClean() {
  const db = readDB();
  if (pruneExpiredRecords(db)) {
    try { writeDBAtomic(db); } catch (e) {}
  }
  return db;
}

function computeCanonicalBoothAmount(db, boothCode, packageId, cityCount) {
  const prefix = String(boothCode || '').split('-')[0].toUpperCase();
  const pkgs = Array.isArray(db?.boothPackages) ? db.boothPackages : [];
  let pkg = pkgs.find(p => p.id === packageId && String(p.zonePrefix || '').toUpperCase() === prefix);
  if (!pkg) pkg = pkgs.find(p => String(p.zonePrefix || '').toUpperCase() === prefix);
  if (!pkg) pkg = pkgs.find(p => p.id === packageId);
  const defaultPrices = { SME: 150000, B: 350000, FOOD: 400000, A: 750000 };
  const unitPrice = Math.max(100000, Number(pkg?.price) || defaultPrices[prefix] || 350000);
  const count = Math.max(1, Number(cityCount) || 1);
  const subtotal = unitPrice * count;
  const discount = count >= 2 ? Math.round(subtotal * 0.15) : 0;
  return {
    unitPrice,
    totalAmount: subtotal - discount,
    resolvedPackageId: pkg?.id || packageId || 'standard-booth',
    resolvedPackageName: pkg?.nameEn || pkg?.nameSw || 'Standard SME Booth (3m x 3m)'
  };
}

function findBoothConflict(db, boothCode, cities, excludeHoldToken = null, excludeBookingId = null) {
  const citySet = new Set(cities);
  const bookedConflict = db.bookings.find(b => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    const status = String(b.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'expired') return false;
    return b.boothCode === boothCode && Array.isArray(b.cities) && b.cities.some(c => citySet.has(c));
  });
  if (bookedConflict) return { type: 'BOOKED', ref: bookedConflict.id };

  const now = Date.now();
  const holdConflict = db.boothHolds.find(h => {
    if (h.expiresAt <= now) return false;
    if (excludeHoldToken && h.holdToken === excludeHoldToken) return false;
    return h.boothCode === boothCode && Array.isArray(h.cities) && h.cities.some(c => citySet.has(c));
  });
  if (holdConflict) return { type: 'HELD', expiresAt: holdConflict.expiresAt };
  return null;
}

function getLiveStats(db) {
  const now = Date.now();
  for (const [vid, info] of activeVisitorSessions.entries()) {
    if (now - info.lastSeen > 10 * 60 * 1000) activeVisitorSessions.delete(vid);
  }
  const regionLiveMap = {};
  for (const info of activeVisitorSessions.values()) {
    regionLiveMap[info.region] = (regionLiveMap[info.region] || 0) + 1;
  }
  const liveOnlineCount = Math.max(1, activeVisitorSessions.size);
  const activeBookings = (db.bookings || []).filter(b => {
    const st = String(b.status || '').toLowerCase();
    return st !== 'cancelled' && st !== 'expired';
  });

  const totalRegisteredAttendees = (db.regions || []).reduce(
    (sum, r) => sum + (Number(r.registeredAttendees) || 0),
    0
  );

  return {
    liveOnlineCount,
    regionLiveMap,
    totalCookieVisitors: Math.max(1, Number(db.analytics?.totalCookieVisitors || 185)),
    totalRegisteredAttendees: Math.max(totalRegisteredAttendees, Number(db.analytics?.totalRegisteredAttendees || 240)),
    totalBusinessesShowcased: activeBookings.length,
    totalPartnersAndInvestors: Math.max(1, (db.sponsors || []).length + 1),
    selcomConfigured: getSelcomConfig().configured,
    storageEngine: (dbAdapter && dbAdapter.isMySQL) || String(process.env.DB_TYPE || '').toLowerCase() === 'mysql' ? 'mysql' : 'json'
  };
}

// Public /api/data SANITIZATION: never expose PII, controlNumbers, PIN hashes, or unpublished inquiries
function sanitizePublicDb(db) {
  const now = Date.now();
  const publicBookings = (db.bookings || [])
    .filter(b => {
      const st = String(b.status || '').toLowerCase();
      return st !== 'cancelled' && st !== 'expired' && b.featured !== false;
    })
    .map(b => ({
      id: b.id,
      businessName: b.businessName,
      tagline: b.tagline,
      ...(b.taglineEn ? { taglineEn: b.taglineEn } : {}),
      ...(b.taglineZh ? { taglineZh: b.taglineZh } : {}),
      sector: b.sector,
      packageId: b.packageId,
      packageName: b.packageName,
      boothCode: b.boothCode,
      cities: Array.isArray(b.cities) ? b.cities : [],
      status: b.status,
      featured: Boolean(b.featured),
      images: Array.isArray(b.images) ? b.images : undefined
    }));

  const activeHolds = (db.boothHolds || [])
    .filter(h => h.expiresAt > now)
    .map(h => ({
      boothCode: h.boothCode,
      cities: h.cities,
      expiresAt: h.expiresAt
    }));

  return {
    regions: db.regions,
    boothPackages: db.boothPackages,
    bookings: publicBookings,
    activeHolds,
    announcements: db.announcements,
    destination: db.destination,
    analytics: db.analytics,
    sponsorsCount: (db.sponsors || []).length,
    selcomConfigured: getSelcomConfig().configured
  };
}

function maskPhone(phone) {
  const s = String(phone || '').trim();
  const digits = s.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `+255 *** *** ${digits.slice(-3)}`;
}

function maskEmail(email) {
  const s = String(email || '').trim();
  if (!s.includes('@')) return '***';
  const [local, domain] = s.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

function normalizePhoneTail(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

function buildSecurityHeaders(req, { isHtml = false, isServiceWorker = false } = {}) {
  const headers = {
    'Server': 'TBF-Edge/1.0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-DNS-Prefetch-Control': 'off',
    'X-XSS-Protection': '0'
  };
  if (isHttpsRequest(req)) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  if (isHtml) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://nominatim.openstreetmap.org",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ');
  } else if (isServiceWorker) {
    headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'";
  } else {
    headers['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'";
  }
  return headers;
}

function getAllowedCorsOrigin(req) {
  if (!req) return '';
  const origin = String(req.headers.origin || '').trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim().toLowerCase();
  if (!origin || !host) return '';
  try {
    const parsed = new URL(origin);
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.host.toLowerCase() === host) {
      return origin;
    }
  } catch (e) {}
  return '';
}

function verifySameOriginMutation(req) {
  const method = String(req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
  const rawPath = String(req.url || '/').split('?')[0];
  if (rawPath === '/api/webhooks/selcom') return true;
  const secFetchSite = String(req.headers['sec-fetch-site'] || '').trim().toLowerCase();
  if (secFetchSite === 'cross-site') return false;
  const origin = String(req.headers.origin || '').trim();
  if (origin) {
    return Boolean(getAllowedCorsOrigin(req));
  }
  return true;
}

function verifyAdminRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies.tbf_admin_session;
  const session = verifySignedToken(token);
  if (!session || session.role !== 'admin' || !session.jti) return null;
  const revokedExp = revokedAdminTokens.get(session.jti);
  if (revokedExp && revokedExp > Date.now()) return null;
  const ctx = getClientContext(req);
  if (session.uaFamily !== ctx.uaFamily) return null;
  if (!cookies.tbf_device_id || session.deviceId !== cookies.tbf_device_id) return null;
  return session;
}

function appendSetCookies(headers, cookieStrings) {
  if (!cookieStrings || !cookieStrings.length) return headers;
  const prev = headers['Set-Cookie'];
  const list = Array.isArray(prev) ? prev.slice() : (prev ? [prev] : []);
  headers['Set-Cookie'] = list.concat(cookieStrings);
  return headers;
}

function sendJSON(res, statusCode, payload, extraHeaders = {}, cookiesToSet = []) {
  const req = res._tbfReq || null;
  const allowedOrigin = getAllowedCorsOrigin(req);
  const headers = {
    ...buildSecurityHeaders(req, { isHtml: false }),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    ...(allowedOrigin ? {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    } : {}),
    ...extraHeaders
  };
  appendSetCookies(headers, cookiesToSet);
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(payload));
}

function safeJsonParse(rawStr) {
  if (!rawStr || !rawStr.trim()) return {};
  const parsed = JSON.parse(rawStr, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    const err = new Error('JSON payload must be a non-null object');
    err.statusCode = 400;
    throw err;
  }
  return parsed;
}

function parseBody(req, maxBytes = 131072) {
  return new Promise((resolve, reject) => {
    let body = '';
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      body += chunk.toString('utf8');
      if (Buffer.byteLength(body, 'utf8') > maxBytes) {
        aborted = true;
        const err = new Error('Payload too large');
        err.statusCode = 413;
        reject(err);
        req.destroy();
      }
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        resolve(safeJsonParse(body));
      } catch (e) {
        const err = new Error(e.message || 'Invalid JSON payload');
        err.statusCode = e.statusCode || 400;
        reject(err);
      }
    });
    req.on('error', err => {
      if (!aborted) reject(err);
    });
  });
}

function findBookingByRefAndPhone(db, refInput, phoneTail) {
  return (db.bookings || []).find(b => {
    const bId = String(b.id || '').trim().toUpperCase();
    const bCtrl = String(b.controlNumber || '').trim().toUpperCase();
    const bTail = normalizePhoneTail(b.phone);
    const refMatch = (bId && bId === refInput) || (bCtrl && bCtrl === refInput);
    const phoneMatch = bTail && bTail === phoneTail;
    return refMatch && phoneMatch;
  });
}

function findBookingByRefAndContact(db, refInput, phoneTail, emailInput) {
  const emailIdx = emailInput ? computeBlindIndex(emailInput) : '';
  const phoneIdx = phoneTail ? computeBlindIndex(phoneTail) : '';
  return (db.bookings || []).find(b => {
    const bId = String(b.id || '').trim().toUpperCase();
    const bCtrl = decryptField(b.controlNumber).trim().toUpperCase();
    const refMatch = (bId && bId === refInput) || (bCtrl && bCtrl === refInput);
    if (!refMatch) return false;
    if (emailInput) {
      if (b.emailIdx && b.emailIdx === emailIdx) return true;
      const bEmail = decryptField(b.email).trim().toLowerCase();
      if (bEmail && bEmail === emailInput) return true;
    }
    if (phoneTail) {
      if (b.phoneIdx && b.phoneIdx === phoneIdx) return true;
      const bTail = normalizePhoneTail(decryptField(b.phone));
      if (bTail && bTail === phoneTail) return true;
    }
    return false;
  });
}

function bookingMatchesEmail(b, emailInput, emailIdx) {
  if (!b || !emailInput) return false;
  if (b.emailIdx && b.emailIdx === emailIdx) return true;
  return decryptField(b.email).trim().toLowerCase() === emailInput;
}

function isOrganizerEmail(db, emailLower) {
  if (!emailLower) return false;
  if (ADMIN_CREDENTIAL_HASH && emailLower === ADMIN_IDENTIFIER) return true;
  return (db.organizerAccounts || []).some(
    a => a && a.active !== false && decryptField(a.email).trim().toLowerCase() === emailLower
  );
}

function verifyOrganizerCredentials(db, emailLower, secret) {
  if (!emailLower || !secret) return null;
  if (emailLower === ADMIN_IDENTIFIER && verifySecret(secret, ADMIN_CREDENTIAL_HASH)) {
    return { identifier: ADMIN_IDENTIFIER, name: 'Festival Organizer', role: 'admin' };
  }
  const acc = (db.organizerAccounts || []).find(
    a => a && a.active !== false && decryptField(a.email).trim().toLowerCase() === emailLower && verifySecret(secret, a.passwordHash)
  );
  if (acc) {
    return { identifier: decryptField(acc.email).trim().toLowerCase(), name: decryptField(acc.name) || 'Festival Organizer', role: 'admin' };
  }
  return null;
}

function resolveExhibitorEmailLogin(db, { emailInput, refInput, pin, lockKey, deviceId }) {
  const emailIdx = computeBlindIndex(emailInput);
  const emailMatches = (db.bookings || []).filter(b => bookingMatchesEmail(b, emailInput, emailIdx));
  if (!emailMatches.length) {
    return { status: 404, body: { success: false, error: 'Invalid email, reference, or PIN/password.' } };
  }

  let found = null;
  if (refInput) {
    found = emailMatches.find(b => {
      const bId = String(b.id || '').trim().toUpperCase();
      const bCtrl = decryptField(b.controlNumber).trim().toUpperCase();
      return (bId && bId === refInput) || (bCtrl && bCtrl === refInput);
    });
    if (!found) {
      return { status: 404, body: { success: false, error: 'Invalid email, reference, or PIN/password.' } };
    }
    const hasPin = Boolean(found.accessPinHash);
    if (!pin) {
      return {
        status: 200,
        body: {
          success: true,
          role: 'exhibitor',
          unlocked: false,
          booking: toSafeBookingReceipt(found, { unmasked: false, hasPin, stepUpRequired: hasPin })
        }
      };
    }
    if (!hasPin || !verifySecret(pin, found.accessPinHash)) {
      const fail = recordFailure(pinLockoutStore, lockKey, 5, 15 * 60 * 1000);
      return {
        status: fail.lockedUntil ? 429 : 403,
        body: {
          success: false,
          error: fail.lockedUntil
            ? 'Too many invalid attempts. Locked for 15 minutes.'
            : 'Invalid email, reference, or PIN/password.'
        }
      };
    }
  } else {
    found = emailMatches.find(b => b.accessPinHash && verifySecret(pin, b.accessPinHash));
    if (!found) {
      const fail = recordFailure(pinLockoutStore, lockKey, 5, 15 * 60 * 1000);
      return {
        status: fail.lockedUntil ? 429 : 403,
        body: {
          success: false,
          error: fail.lockedUntil
            ? 'Too many invalid attempts. Locked for 15 minutes.'
            : 'Invalid email, reference, or PIN/password.'
        }
      };
    }
  }

  pinLockoutStore.delete(lockKey);
  const manageToken = signPayload({
    role: 'booking_owner',
    bookingId: found.id,
    deviceId
  }, MANAGE_TOKEN_TTL_MS);

  return {
    status: 200,
    body: {
      success: true,
      role: 'exhibitor',
      unlocked: true,
      booking: toSafeBookingReceipt(found, { unmasked: true, hasPin: true, stepUpRequired: false, manageToken })
    }
  };
}

function toSafeBookingReceipt(b, { unmasked = false, hasPin = false, stepUpRequired = false, manageToken = null } = {}) {
  const plainCtrl = decryptField(b.controlNumber);
  const plainContact = decryptField(b.contactPerson);
  const plainPhone = decryptField(b.phone);
  const plainEmail = decryptField(b.email);
  return {
    id: b.id,
    controlNumber: unmasked ? (plainCtrl || '-') : (plainCtrl ? `***${String(plainCtrl).slice(-4)}` : '-'),
    selcomReference: b.selcomReference || null,
    selcomGatewayUrl: unmasked ? (b.selcomGatewayUrl || null) : null,
    selcomPushSent: Boolean(b.selcomPushSent),
    selcomConfigured: getSelcomConfig().configured,
    businessName: b.businessName,
    tagline: b.tagline,
    contactPerson: unmasked ? plainContact : (plainContact ? `${String(plainContact).slice(0, 2)}***` : '-'),
    phone: unmasked ? plainPhone : maskPhone(plainPhone),
    email: unmasked ? plainEmail : maskEmail(plainEmail),
    sector: b.sector,
    packageId: b.packageId,
    packageName: b.packageName,
    boothCode: b.boothCode,
    cities: Array.isArray(b.cities) ? b.cities : [],
    totalAmount: Number(b.totalAmount) || 0,
    paymentMethod: b.paymentMethod,
    status: b.status,
    paymentExpiresAt: b.paymentExpiresAt || null,
    createdAt: b.createdAt || null,
    paidAt: b.paidAt || null,
    hasAccessPin: hasPin,
    unmasked,
    stepUpRequired,
    manageToken
  };
}

function toSafeAdminBooking(b) {
  const { accessPinHash, emailIdx, phoneIdx, ownerDeviceHash, clientRequestId, ...rest } = b;
  return {
    ...rest,
    controlNumber: decryptField(b.controlNumber) || '-',
    contactPerson: decryptField(b.contactPerson) || '-',
    phone: decryptField(b.phone) || '-',
    email: decryptField(b.email) || '-',
    hasAccessPin: Boolean(accessPinHash)
  };
}

function toSafeAdminSponsor(s) {
  return {
    ...s,
    contactName: decryptField(s.contactName) || '-',
    phone: decryptField(s.phone) || '-',
    email: decryptField(s.email) || '-'
  };
}

const server = http.createServer(async (req, res) => {
  res._tbfReq = req;
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'TBF-Edge/1.0');
  const rawUrlPath = String(req.url || '/').split('?')[0];
  let decodedRawPath = rawUrlPath;
  for (let i = 0; i < 5; i++) {
    try {
      const next = decodeURIComponent(decodedRawPath);
      if (next === decodedRawPath) break;
      decodedRawPath = next;
    } catch (e) {
      res.writeHead(400, { ...buildSecurityHeaders(req, { isHtml: false }), 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Bad Request');
    }
  }
  if (
    decodedRawPath.includes('\0') ||
    decodedRawPath.includes(':') ||
    decodedRawPath.includes('~') ||
    /(^|[\\/])\.\.?([\\/]|$)/.test(decodedRawPath) ||
    /(\/\.|\.\/|\\\.|\\)/.test(decodedRawPath)
  ) {
    res.writeHead(403, { ...buildSecurityHeaders(req, { isHtml: false }), 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (e) {
    return sendJSON(res, 400, { success: false, error: 'Malformed request URL' });
  }
  const pathname = url.pathname;
  const ctx = getClientContext(req);
  const isHttps = isHttpsRequest(req);
  const deviceCookieList = ctx.isNewDeviceCookie
    ? [buildCookieHeader('tbf_device_id', ctx.deviceId, { maxAge: 90 * 24 * 3600, httpOnly: true, secure: isHttps })]
    : [];

  if (req.method === 'OPTIONS') {
    return sendJSON(res, 200, { ok: true }, {}, deviceCookieList);
  }

  const isMutationReq = req.method !== 'GET' && req.method !== 'HEAD';
  if (pathname !== '/api/webhooks/selcom' && isMaliciousOrAutomatedBot(req, isMutationReq)) {
    return sendJSON(res, 403, { success: false, error: 'Automated bot traffic is not permitted.' }, {}, deviceCookieList);
  }

  if (!verifySameOriginMutation(req)) {
    return sendJSON(res, 403, { success: false, error: 'Forbidden cross-origin mutation' }, {}, deviceCookieList);
  }

  if (pathname.startsWith('/api/')) {
    const apiRate = checkRateLimit(`api:${ctx.deviceId}:${ctx.clientIp}`, 240, 60 * 1000, ctx.clientIp);
    if (!apiRate.allowed) {
      return sendJSON(res, 429, {
        success: false,
        retryAfterSec: apiRate.retryAfterSec,
        error: `Rate limit exceeded. Try again in ${apiRate.retryAfterSec}s.`
      }, { 'Retry-After': String(apiRate.retryAfterSec) }, deviceCookieList);
    }
  }

  // API: Sanitized Public Festival Data
  if (pathname === '/api/data' && req.method === 'GET') {
    const db = readDbClean();
    return sendJSON(res, 200, {
      ...sanitizePublicDb(db),
      liveStats: getLiveStats(db)
    }, {}, deviceCookieList);
  }

  // API: Auth - Check Admin Session
  if (pathname === '/api/auth/session' && req.method === 'GET') {
    const session = verifyAdminRequest(req);
    return sendJSON(res, 200, {
      authenticated: Boolean(session),
      user: session ? { identifier: session.sub, role: 'admin' } : null
    }, {}, deviceCookieList);
  }

  // API: Auth - Organizer Admin Login (Contextual Brute-Force Lockout + IP-Tolerant Cookie Binding)
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const rate = checkRateLimit(`auth-login:${ctx.deviceId}:${ctx.clientIp}`, 25, 15 * 60 * 1000);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: `Too many requests. Try again in ${rate.retryAfterSec}s.` }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const identifier = String(payload.identifier || '').trim().toLowerCase();
      const password = String(payload.password || '');

      const lockKey = `admin:${ctx.deviceId}:${ctx.clientIp}`;
      const lockState = getLockoutState(authLockoutStore, lockKey);
      if (lockState.locked) {
        return sendJSON(res, 429, {
          success: false,
          locked: true,
          retryAfterSec: lockState.retryAfterSec,
          error: `Too many failed login attempts. Try again in ${lockState.retryAfterSec}s.`
        }, {}, deviceCookieList);
      }

      if (!identifier || !password) {
        return sendJSON(res, 400, { success: false, error: 'Identifier and password are required' }, {}, deviceCookieList);
      }

      const db = readDbClean();
      const orgUser = verifyOrganizerCredentials(db, identifier, password);
      if (!orgUser) {
        const failInfo = recordFailure(authLockoutStore, lockKey, 5, 10 * 60 * 1000);
        await withDbTransaction(txDb => {
          txDb.securityLog.unshift({
            type: 'ADMIN_LOGIN_FAILED',
            identifier,
            deviceId: ctx.deviceId.slice(0, 8),
            at: new Date().toISOString()
          });
        });
        const remaining = Math.max(0, 5 - failInfo.failures);
        return sendJSON(res, failInfo.lockedUntil ? 429 : 401, {
          success: false,
          remainingAttempts: remaining,
          retryAfterSec: failInfo.lockedUntil ? 600 : 0,
          error: failInfo.lockedUntil
            ? 'Account temporarily locked for 10 minutes due to repeated failed attempts.'
            : `Invalid credentials (${remaining} attempts remaining).`
        }, {}, deviceCookieList);
      }

      authLockoutStore.delete(lockKey);
      const sessionToken = signPayload({
        role: 'admin',
        sub: orgUser.identifier,
        jti: crypto.randomBytes(12).toString('hex'),
        deviceId: ctx.deviceId,
        uaFamily: ctx.uaFamily
      }, ADMIN_SESSION_TTL_MS);

      const cookies = deviceCookieList.concat([
        buildCookieHeader('tbf_admin_session', sessionToken, { maxAge: ADMIN_SESSION_TTL_MS / 1000, httpOnly: true, secure: isHttps })
      ]);

      return sendJSON(res, 200, {
        success: true,
        user: orgUser
      }, {}, cookies);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid login payload' }, {}, deviceCookieList);
    }
  }

  // API: Auth - Logout (with server-side JTI revocation)
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const existingCookies = parseCookies(req);
    const activeToken = existingCookies.tbf_admin_session;
    const parsedSession = verifySignedToken(activeToken);
    if (parsedSession && parsedSession.jti) {
      pruneMapStore(revokedAdminTokens, 5000);
      revokedAdminTokens.set(parsedSession.jti, parsedSession.exp || (Date.now() + ADMIN_SESSION_TTL_MS));
    }
    const cookies = deviceCookieList.concat([
      buildCookieHeader('tbf_admin_session', '', { maxAge: 0, httpOnly: true, secure: isHttps })
    ]);
    return sendJSON(res, 200, { success: true }, {}, cookies);
  }

  // API: Auth - Single Unified Login (Handles both pre-created Organizer Accounts & Exhibitor Email Bookings silently)
  if (pathname === '/api/auth/unified-login' && req.method === 'POST') {
    const rate = checkRateLimit(`unified-login:${ctx.deviceId}:${ctx.clientIp}`, 25, 15 * 60 * 1000);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: `Too many attempts. Try again in ${rate.retryAfterSec}s.` }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const emailInput = String(payload.email || '').trim().toLowerCase();
      const refInput = String(payload.ref || '').trim().toUpperCase();
      const rawSecret = String(payload.secret ?? payload.pin ?? '');
      const pinInput = rawSecret.trim();

      if (!emailInput || !emailInput.includes('@') || (!refInput && !rawSecret)) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Email address and either your PIN/Password or Booking ID / Payment Reference are required.'
        }, {}, deviceCookieList);
      }

      const db = readDbClean();
      const adminLockKey = `admin:${ctx.deviceId}:${ctx.clientIp}`;
      const pinLockKey = `email-login:${emailInput}:${ctx.deviceId}`;

      // 1. Check if pre-created organizer account matches (only when secret is provided without conflicting ref)
      if (rawSecret) {
        const adminLock = getLockoutState(authLockoutStore, adminLockKey);
        const orgUser = !adminLock.locked ? verifyOrganizerCredentials(db, emailInput, rawSecret) : null;
        if (orgUser) {
          authLockoutStore.delete(adminLockKey);
          const sessionToken = signPayload({
            role: 'admin',
            sub: orgUser.identifier,
            jti: crypto.randomBytes(12).toString('hex'),
            deviceId: ctx.deviceId,
            uaFamily: ctx.uaFamily
          }, ADMIN_SESSION_TTL_MS);
          const cookies = deviceCookieList.concat([
            buildCookieHeader('tbf_admin_session', sessionToken, { maxAge: ADMIN_SESSION_TTL_MS / 1000, httpOnly: true, secure: isHttps })
          ]);
          return sendJSON(res, 200, {
            success: true,
            role: 'admin',
            user: orgUser
          }, {}, cookies);
        }

        // Record admin failure if this email belongs to an organizer account (without revealing its role!)
        if (isOrganizerEmail(db, emailInput) && !refInput) {
          if (adminLock.locked) {
            return sendJSON(res, 429, {
              success: false,
              locked: true,
              retryAfterSec: adminLock.retryAfterSec,
              error: `Too many failed attempts. Try again in ${adminLock.retryAfterSec}s.`
            }, {}, deviceCookieList);
          }
          const emailIdx = computeBlindIndex(emailInput);
          const hasBooking = (db.bookings || []).some(b => bookingMatchesEmail(b, emailInput, emailIdx));
          if (!hasBooking) {
            const failInfo = recordFailure(authLockoutStore, adminLockKey, 5, 10 * 60 * 1000);
            await withDbTransaction(txDb => {
              txDb.securityLog.unshift({
                type: 'UNIFIED_LOGIN_FAILED',
                identifier: maskEmail(emailInput),
                deviceId: ctx.deviceId.slice(0, 8),
                at: new Date().toISOString()
              });
            });
            return sendJSON(res, failInfo.lockedUntil ? 429 : 401, {
              success: false,
              error: failInfo.lockedUntil
                ? 'Too many failed attempts. Try again in 600s.'
                : 'Invalid email, reference, or PIN/password.'
            }, {}, deviceCookieList);
          }
        }
      }

      // 2. Otherwise evaluate Exhibitor reservation access by Email (+ PIN and/or Ref)
      const pinLock = getLockoutState(pinLockoutStore, pinLockKey);
      if (pinLock.locked) {
        return sendJSON(res, 429, {
          success: false,
          locked: true,
          retryAfterSec: pinLock.retryAfterSec,
          error: `Too many failed attempts. Try again in ${pinLock.retryAfterSec}s.`
        }, {}, deviceCookieList);
      }

      const outcome = resolveExhibitorEmailLogin(db, {
        emailInput,
        refInput,
        pin: pinInput,
        lockKey: pinLockKey,
        deviceId: ctx.deviceId
      });
      return sendJSON(res, outcome.status, outcome.body, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: 'Invalid sign-in payload' }, {}, deviceCookieList);
    }
  }

  // API: Admin Overview (Protected)
  if (pathname === '/api/admin/overview' && req.method === 'GET') {
    const session = verifyAdminRequest(req);
    if (!session) {
      return sendJSON(res, 401, { success: false, error: 'Admin authentication required' }, {}, deviceCookieList);
    }
    const db = readDbClean();
    const safeBookings = (db.bookings || []).map(toSafeAdminBooking);
    const safeSponsors = (db.sponsors || []).map(toSafeAdminSponsor);
    const safeOrganizers = (db.organizerAccounts || []).map(a => ({
      id: a.id,
      email: decryptField(a.email),
      name: decryptField(a.name),
      active: a.active !== false,
      createdAt: a.createdAt || null
    }));
    return sendJSON(res, 200, {
      success: true,
      bookings: safeBookings,
      sponsors: safeSponsors,
      organizers: safeOrganizers,
      activeHolds: db.boothHolds,
      newsletterCount: (db.newsletterSubscribers || []).length,
      securityLog: db.securityLog.slice(0, 15),
      liveStats: getLiveStats(db)
    }, {}, deviceCookieList);
  }

  // API: Provision / Manage Organizer Account (ADMIN AUTH REQUIRED)
  if (pathname === '/api/admin/organizers' && req.method === 'POST') {
    const session = verifyAdminRequest(req);
    if (!session) {
      return sendJSON(res, 401, { success: false, error: 'Admin authentication required' }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const email = sanitizeTextInput(payload.email || '', 160).toLowerCase();
      const name = sanitizeTextInput(payload.name || 'Festival Organizer', 120);
      const password = String(payload.password || '');
      if (!isValidEmail(email) || password.length < 10) {
        return sendJSON(res, 400, { success: false, error: 'Valid email and password (minimum 10 characters) are required' }, {}, deviceCookieList);
      }

      const result = await withDbTransaction(db => {
        const existingIdx = (db.organizerAccounts || []).findIndex(
          a => decryptField(a.email).trim().toLowerCase() === email
        );
        const record = {
          id: existingIdx >= 0 ? db.organizerAccounts[existingIdx].id : ('ORG-' + crypto.randomInt(1000, 9999)),
          email: encryptField(email),
          name: encryptField(name),
          passwordHash: hashSecret(password),
          active: true,
          createdAt: existingIdx >= 0 ? db.organizerAccounts[existingIdx].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if (existingIdx >= 0) db.organizerAccounts[existingIdx] = record;
        else db.organizerAccounts.unshift(record);
        return {
          dirty: true,
          value: { id: record.id, email, name, active: true }
        };
      });
      return sendJSON(res, 201, { success: true, organizer: result }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid organizer account payload' }, {}, deviceCookieList);
    }
  }

  // API: Admin Update Booking Payment Status (Protected)
  if (pathname === '/api/admin/bookings/status' && req.method === 'POST') {
    const session = verifyAdminRequest(req);
    if (!session) {
      return sendJSON(res, 401, { success: false, error: 'Admin authentication required' }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const bookingId = String(payload.bookingId || '').trim();
      const newStatus = String(payload.status || 'Confirmed').trim();
      const allowed = ['Confirmed', 'Paid', 'Awaiting Payment', 'Cancelled'];
      if (!bookingId || !allowed.includes(newStatus)) {
        return sendJSON(res, 400, { success: false, error: 'Valid bookingId and status required' }, {}, deviceCookieList);
      }
      const updated = await withDbTransaction(db => {
        const b = db.bookings.find(x => x.id === bookingId);
        if (!b) return { dirty: false, value: null };
        b.status = newStatus;
        if (newStatus === 'Confirmed' || newStatus === 'Paid') {
          b.paymentExpiresAt = null;
        } else if (newStatus === 'Cancelled' && Array.isArray(b.cities)) {
          b.cities.forEach(c => recalcRegionCodeIfUnused(db, c, b.boothCode));
        }
        return { dirty: true, value: b };
      });
      if (!updated) {
        return sendJSON(res, 404, { success: false, error: 'Booking not found' }, {}, deviceCookieList);
      }
      return sendJSON(res, 200, { success: true, booking: toSafeAdminBooking(updated) }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid status payload' }, {}, deviceCookieList);
    }
  }

  // API: Cookie Visitor Ping & Regional Interest Tracker
  if (pathname === '/api/visitor-ping' && req.method === 'POST') {
    const rate = checkRateLimit(`vping:${ctx.deviceId}:${ctx.clientIp}`, 120, 10 * 60 * 1000);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: 'Too many visitor pings' }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const rawVisitorId = String(payload.visitorId || '').trim();
      const visitorId = /^[a-zA-Z0-9_-]{4,64}$/.test(rawVisitorId) ? rawVisitorId : ('v_' + Date.now());
      const isNewCookie = Boolean(payload.isNewVisitor);
      const regionId = String(payload.regionId || 'dar').trim().toLowerCase().slice(0, 32);

      pruneMapStore(activeVisitorSessions, 5000);
      activeVisitorSessions.set(visitorId, {
        lastSeen: Date.now(),
        region: regionId,
        consent: String(payload.cookieConsent || 'accepted').slice(0, 24)
      });

      const out = await withDbTransaction(db => {
        if (!db.analytics) {
          db.analytics = {
            totalCookieVisitors: 185,
            totalRegisteredAttendees: 240,
            totalBusinessesShowcased: 10,
            totalPartnersAndInvestors: 2
          };
        }
        db.analytics.totalCookieVisitors = (Number(db.analytics.totalCookieVisitors) || 0) + 1;
        const reg = (db.regions || []).find(r => r.id === regionId);
        if (reg) {
          reg.cookieVisitors = (Number(reg.cookieVisitors) || 0) + 1;
        }
        return {
          dirty: true,
          value: { liveStats: getLiveStats(db), regions: db.regions }
        };
      });

      const cookies = deviceCookieList.concat([
        buildCookieHeader('tbf_visitor_id', visitorId, { maxAge: 31536000, httpOnly: false, secure: isHttps })
      ]);
      return sendJSON(res, 200, {
        success: true,
        visitorId,
        liveStats: out.liveStats,
        regions: out.regions
      }, {}, cookies);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid visitor ping' }, {}, deviceCookieList);
    }
  }

  // API: Register Regional Attendee RSVP
  if (pathname === '/api/attendee-rsvp' && req.method === 'POST') {
    const rate = checkRateLimit(`rsvp:${ctx.deviceId}:${ctx.clientIp}`, 15, 15 * 60 * 1000);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: `Too many requests. Wait ${rate.retryAfterSec}s.` }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const regionId = String(payload.regionId || 'dar').trim().toLowerCase().slice(0, 32);
      const attendeesCount = Math.min(20, Math.max(1, Number(payload.count) || 1));

      const out = await withDbTransaction(db => {
        const region = db.regions.find(r => r.id === regionId);
        if (region) {
          region.registeredAttendees = (region.registeredAttendees || 0) + attendeesCount;
          region.cookieVisitors = (region.cookieVisitors || 0) + 1;
        }
        if (db.analytics) {
          db.analytics.totalRegisteredAttendees = (db.analytics.totalRegisteredAttendees || 18450) + attendeesCount;
        }
        return {
          dirty: true,
          value: { region, liveStats: getLiveStats(db), db: sanitizePublicDb(db) }
        };
      });

      return sendJSON(res, 201, { success: true, ...out }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid attendee RSVP' }, {}, deviceCookieList);
    }
  }

  // API: Acquire or Refresh Temporary Booth Hold (10-min Anti-Race-Condition Lock + Anti-Bot Hoarding Cap)
  if (pathname === '/api/bookings/hold' && req.method === 'POST') {
    const rate = checkRateLimit(`hold:${ctx.deviceId}:${ctx.clientIp}`, 35, 10 * 60 * 1000, ctx.clientIp);
    if (!rate.allowed) {
      return sendJSON(res, 429, {
        success: false,
        retryAfterSec: rate.retryAfterSec,
        error: `Too many booth lock requests. Wait ${rate.retryAfterSec}s.`
      }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      if (hasHoneypotTripped(payload)) {
        return sendJSON(res, 403, { success: false, error: 'Automated bot request rejected.' }, {}, deviceCookieList);
      }
      const boothCode = String(payload.boothCode || '').trim().toUpperCase();
      const cities = Array.isArray(payload.cities) ? payload.cities.filter(Boolean) : [];
      const incomingHoldToken = payload.holdToken ? String(payload.holdToken) : null;

      if (!boothCode || !cities.length) {
        return sendJSON(res, 400, { success: false, error: 'boothCode and at least one city are required' }, {}, deviceCookieList);
      }

      const outcome = await withDbTransaction(db => {
        const conflict = findBoothConflict(db, boothCode, cities, incomingHoldToken);
        if (conflict) {
          return { dirty: false, value: { conflict } };
        }
        // Remove previous holds owned by this exact incoming token OR same deviceId/IP (>1 hold) so bots cannot hoard booths
        db.boothHolds = db.boothHolds.filter(h => {
          if (incomingHoldToken && h.holdToken === incomingHoldToken) return false;
          if (h.deviceId === ctx.deviceId || (h.clientIp && h.clientIp === ctx.clientIp)) return false;
          return true;
        });
        const holdToken = incomingHoldToken || crypto.randomBytes(16).toString('hex');
        const holdRecord = {
          holdId: 'HLD-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
          holdToken,
          boothCode,
          cities,
          deviceId: ctx.deviceId,
          clientIp: ctx.clientIp,
          createdAt: Date.now(),
          expiresAt: Date.now() + HOLD_TTL_MS
        };
        db.boothHolds.push(holdRecord);
        return {
          dirty: true,
          value: { hold: { holdId: holdRecord.holdId, holdToken, boothCode, cities, expiresAt: holdRecord.expiresAt }, db: sanitizePublicDb(db) }
        };
      });

      if (outcome.conflict) {
        return sendJSON(res, 409, {
          success: false,
          errorCode: outcome.conflict.type === 'HELD' ? 'BOOTH_HELD' : 'BOOTH_BOOKED',
          error: outcome.conflict.type === 'HELD'
            ? 'This booth slot is temporarily held by another exhibitor completing checkout.'
            : 'This booth slot has already been booked in one of your selected cities.'
        }, {}, deviceCookieList);
      }

      return sendJSON(res, 200, { success: true, ...outcome }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: 'Invalid booth hold payload' }, {}, deviceCookieList);
    }
  }

  // API: Release Temporary Booth Hold
  if (pathname === '/api/bookings/hold' && req.method === 'DELETE') {
    try {
      const payload = await parseBody(req);
      const holdToken = String(payload.holdToken || '');
      if (!holdToken) {
        return sendJSON(res, 200, { success: true }, {}, deviceCookieList);
      }
      await withDbTransaction(db => {
        const before = db.boothHolds.length;
        db.boothHolds = db.boothHolds.filter(h => h.holdToken !== holdToken);
        return { dirty: db.boothHolds.length !== before, value: true };
      });
      return sendJSON(res, 200, { success: true }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: 'Invalid release request' }, {}, deviceCookieList);
    }
  }

  // API: Create Booking (Booking-First Final Checkout + Race Guard + Access PIN + Auto-Expiry)
  if (pathname === '/api/bookings' && req.method === 'POST') {
    const rate = checkRateLimit(`book:${ctx.deviceId}:${ctx.clientIp}`, 5, 15 * 60 * 1000, ctx.clientIp);
    if (!rate.allowed) {
      return sendJSON(res, 429, {
        success: false,
        retryAfterSec: rate.retryAfterSec,
        error: `Booking rate limit reached. Please wait ${rate.retryAfterSec}s before creating another reservation.`
      }, {}, deviceCookieList);
    }

    try {
      const payload = await parseBody(req);
      if (hasHoneypotTripped(payload)) {
        return sendJSON(res, 403, { success: false, error: 'Automated bot submission rejected.' }, {}, deviceCookieList);
      }
      const businessName = sanitizeTextInput(payload.businessName, 120);
      const contactPerson = sanitizeTextInput(payload.contactPerson, 100);
      const phone = sanitizeTextInput(payload.phone, 32);
      const email = sanitizeTextInput(payload.email, 120).toLowerCase();
      const boothCode = sanitizeTextInput(payload.boothCode, 20).toUpperCase();
      const cities = Array.isArray(payload.cities)
        ? payload.cities.map(c => sanitizeTextInput(c, 50)).filter(Boolean).slice(0, 35)
        : [];
      const holdToken = payload.holdToken ? sanitizeTextInput(payload.holdToken, 80) : null;

      if (!businessName || !contactPerson || normalizePhoneTail(phone).length < 9 || !isValidEmail(email) || !/^[A-Z]{2,8}-\d{1,3}$/.test(boothCode) || !cities.length) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Business name, contact person, valid email, valid 9+ digit phone, boothCode, and at least one city are required.'
        }, {}, deviceCookieList);
      }

      const refNum = 'TBF-BIZ-' + crypto.randomInt(1000, 9999);
      const accessPin = String(crypto.randomInt(100000, 999999));
      const clientRequestId = payload.clientRequestId ? String(payload.clientRequestId).trim().slice(0, 64) : '';
      const dbSnapshot = readDbClean();
      const canonicalPricing = computeCanonicalBoothAmount(
        dbSnapshot,
        boothCode,
        sanitizeTextInput(payload.packageId || 'standard-booth', 48),
        cities.length
      );
      const totalAmountVal = canonicalPricing.totalAmount;
      const payMethodVal = sanitizeTextInput(payload.paymentMethod || 'M-Pesa / Mixx by Yas / Airtel Money', 64);

      // Call real Selcom Payment Gateway if configured in .env
      const selcomRes = await createSelcomOrderAndPush({
        orderId: refNum,
        amount: totalAmountVal,
        buyerName: contactPerson,
        buyerEmail: email,
        buyerPhone: phone,
        boothCode,
        cities,
        paymentMethod: payMethodVal,
        triggerPush: true
      });
      const controlNum = (selcomRes.orderCreated && selcomRes.controlNumber)
        ? selcomRes.controlNumber
        : ('TBF-' + refNum.replace('TBF-BIZ-', '') + '-' + crypto.randomInt(1000, 9999));

      const outcome = await withDbTransaction(db => {
        // Idempotent retry safety on slow/flaky mobile networks
        if (clientRequestId) {
          const existing = db.bookings.find(b => b.clientRequestId === clientRequestId);
          if (existing) {
            return {
              dirty: false,
              value: {
                deduplicated: true,
                booking: toSafeBookingReceipt(existing, { unmasked: true, hasPin: Boolean(existing.accessPinHash), stepUpRequired: false }),
                selcom: selcomRes,
                liveStats: getLiveStats(db),
                db: sanitizePublicDb(db)
              }
            };
          }
        }

        const conflict = findBoothConflict(db, boothCode, cities, holdToken);
        if (conflict) {
          return { dirty: false, value: { conflict } };
        }

        if (holdToken) {
          db.boothHolds = db.boothHolds.filter(h => h.holdToken !== holdToken);
        }

        const safeEmail = email.slice(0, 120);
        const safePhone = phone.slice(0, 32);
        const newBooking = {
          id: refNum,
          controlNumber: encryptField(controlNum),
          selcomReference: selcomRes.reference || null,
          selcomGatewayUrl: selcomRes.gatewayUrl || null,
          selcomPushSent: Boolean(selcomRes.pushSent),
          selcomTransId: selcomRes.transId || null,
          accessPinHash: hashSecret(accessPin),
          clientRequestId: clientRequestId || undefined,
          ownerDeviceHash: crypto.createHash('sha256').update(ctx.deviceId).digest('hex').slice(0, 16),
          businessName: businessName.slice(0, 120),
          tagline: sanitizeTextInput(payload.tagline || 'Bidhaa na huduma bora kwa wateja na wawekezaji mikoani.', 240),
          contactPerson: encryptField(contactPerson.slice(0, 100)),
          phone: encryptField(safePhone),
          email: encryptField(safeEmail),
          emailIdx: computeBlindIndex(safeEmail.toLowerCase()),
          phoneIdx: computeBlindIndex(normalizePhoneTail(safePhone)),
          sector: sanitizeTextInput(payload.sector || 'Biashara & Huduma', 80),
          packageId: sanitizeTextInput(payload.packageId || 'standard-booth', 48),
          packageName: sanitizeTextInput(payload.packageName || 'Standard SME Booth (3m x 3m)', 80),
          boothCode,
          cities,
          totalAmount: totalAmountVal,
          paymentMethod: payMethodVal,
          featured: true,
          status: 'Awaiting Payment',
          paymentExpiresAt: new Date(Date.now() + UNPAID_BOOKING_TTL_MS).toISOString(),
          createdAt: new Date().toISOString()
        };

        db.bookings.unshift(newBooking);
        db.regions.forEach(region => {
          if (newBooking.cities.includes(region.name)) {
            if (!Array.isArray(region.bookedCodes)) region.bookedCodes = [];
            if (!region.bookedCodes.includes(newBooking.boothCode)) {
              region.bookedCodes.push(newBooking.boothCode);
              region.bookedBooths = region.bookedCodes.length;
            }
          }
        });

        return {
          dirty: true,
          value: {
            booking: toSafeBookingReceipt(newBooking, { unmasked: true, hasPin: true, stepUpRequired: false }),
            accessPin,
            selcom: selcomRes,
            liveStats: getLiveStats(db),
            db: sanitizePublicDb(db)
          }
        };
      });

      if (outcome.conflict) {
        return sendJSON(res, 409, {
          success: false,
          errorCode: outcome.conflict.type === 'HELD' ? 'BOOTH_HELD' : 'BOOTH_BOOKED',
          error: outcome.conflict.type === 'HELD'
            ? 'Sorry, another exhibitor is currently holding this booth slot. Please pick an available slot.'
            : 'Sorry, this booth slot was just booked in one of your selected cities.'
        }, {}, deviceCookieList);
      }

      return sendJSON(res, 201, {
        success: true,
        ...outcome
      }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid booking payload' }, {}, deviceCookieList);
    }
  }

  // API: Trigger / Re-trigger Selcom Mobile Money USSD Push on an Unpaid Booking
  if (pathname === '/api/bookings/selcom-push' && req.method === 'POST') {
    const rate = checkRateLimit(`selcom-push:${ctx.deviceId}:${ctx.clientIp}`, 15, 10 * 60 * 1000);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: `Subiri sekunde ${rate.retryAfterSec} kabla ya kutuma prompt nyingine.` }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const bookingId = String(payload.bookingId || payload.ref || '').trim().toUpperCase();
      const rawPhone = String(payload.phone || '').trim();
      const db = readDbClean();
      const found = (db.bookings || []).find(b => String(b.id || '').toUpperCase() === bookingId);
      if (!found) {
        return sendJSON(res, 404, { success: false, error: 'Booking haijapatikana.' }, {}, deviceCookieList);
      }
      if (String(found.status || '').toLowerCase() === 'paid' || String(found.status || '').toLowerCase() === 'confirmed') {
        return sendJSON(res, 200, {
          success: true,
          alreadyPaid: true,
          message: 'Malipo yako tayari yamethibitishwa!',
          booking: toSafeBookingReceipt(found, { unmasked: true, hasPin: Boolean(found.accessPinHash) })
        }, {}, deviceCookieList);
      }

      const cfg = getSelcomConfig();
      if (!cfg.configured) {
        return sendJSON(res, 503, {
          success: false,
          configured: false,
          error: 'Selcom API Keys (SELCOM_VENDOR_ID, SELCOM_API_KEY, SELCOM_API_SECRET) bado hazijawekwa kwenye .env ya server.'
        }, {}, deviceCookieList);
      }

      const targetPhone = rawPhone || decryptField(found.phone);
      const msisdn = normalizeTzMsisdn(targetPhone);
      if (!/^255[67]\d{8}$/.test(msisdn)) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Tafadhali weka namba sahihi ya simu ya Tanzania (mfano 07XXXXXXXX au 2557XXXXXXXX).'
        }, {}, deviceCookieList);
      }

      let selcomOrderRef = found.selcomReference;
      let selcomCtrl = decryptField(found.controlNumber);
      let selcomGwUrl = found.selcomGatewayUrl;
      if (!selcomOrderRef) {
        const created = await createSelcomOrderAndPush({
          orderId: found.id,
          amount: found.totalAmount,
          buyerName: decryptField(found.contactPerson),
          buyerEmail: decryptField(found.email),
          buyerPhone: msisdn,
          boothCode: found.boothCode,
          cities: found.cities,
          paymentMethod: 'M-Pesa / Mobile Money',
          triggerPush: true
        });
        if (!created.orderCreated) {
          return sendJSON(res, 502, {
            success: false,
            error: created.error || 'Imeshindikana kuwasiliana na Selcom Gateway kwa sasa.'
          }, {}, deviceCookieList);
        }
        selcomOrderRef = created.reference;
        selcomCtrl = created.controlNumber || selcomCtrl;
        selcomGwUrl = created.gatewayUrl || selcomGwUrl;
        await withDbTransaction(txDb => {
          const b = txDb.bookings.find(x => x.id === found.id);
          if (b) {
            b.selcomReference = selcomOrderRef;
            if (selcomCtrl) b.controlNumber = encryptField(selcomCtrl);
            if (selcomGwUrl) b.selcomGatewayUrl = selcomGwUrl;
            b.selcomPushSent = Boolean(created.pushSent);
          }
          return { dirty: true, value: true };
        });
        return sendJSON(res, 200, {
          success: created.pushSent,
          pushSent: created.pushSent,
          controlNumber: selcomCtrl,
          reference: selcomOrderRef,
          gatewayUrl: selcomGwUrl,
          message: created.pushSent
            ? `Prompt ya malipo (Selcom USSD Push) imetumwa kwenye simu ${msisdn}. Weka PIN yako kukamilisha malipo.`
            : (created.pushMessage || 'Oda ya Selcom imeundwa. Kamilisha malipo au jaribu tena.')
        }, {}, deviceCookieList);
      }

      const transId = 'TBF' + Date.now().toString().slice(-9) + crypto.randomInt(10, 99);
      const pushRes = await selcomApiCall('POST', '/v1/checkout/wallet-payment', {
        transid: transId,
        order_id: String(found.id),
        msisdn
      });

      if (pushRes.ok) {
        await withDbTransaction(txDb => {
          const b = txDb.bookings.find(x => x.id === found.id);
          if (b) {
            b.selcomPushSent = true;
            b.selcomTransId = transId;
          }
          return { dirty: true, value: true };
        });
      }

      return sendJSON(res, pushRes.ok ? 200 : 502, {
        success: pushRes.ok,
        pushSent: pushRes.ok,
        transId,
        message: pushRes.ok
          ? `Prompt ya malipo (Selcom USSD Push) imetumwa kwenye simu ${msisdn}. Weka PIN yako ya M-Pesa / Mixx / Airtel / HaloPesa.`
          : (pushRes.data?.message || pushRes.error || 'Imeshindikana kutuma USSD Push kwenye namba hiyo.'),
        error: !pushRes.ok ? (pushRes.data?.message || pushRes.error || 'Selcom USSD Push failed') : undefined
      }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: 'Invalid Selcom push request' }, {}, deviceCookieList);
    }
  }

  // API: Official Selcom Payment Webhook Callback (Cryptographically & Upstream Verified)
  if (pathname === '/api/webhooks/selcom' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const orderId = String(payload.order_id || '').trim().toUpperCase();

      if (!orderId) {
        return sendJSON(res, 400, { result: 'FAIL', message: 'Missing order_id' });
      }

      const cfg = getSelcomConfig();
      if (!cfg.configured) {
        return sendJSON(res, 503, { result: 'FAIL', message: 'Selcom gateway not configured' });
      }

      // NEVER trust unverified webhook body alone — always verify order payment status directly against Selcom API
      const liveCheck = await querySelcomOrderStatus(orderId);
      const verifiedPaid = Boolean(liveCheck.paid);

      if (verifiedPaid) {
        await withDbTransaction(db => {
          const b = (db.bookings || []).find(x => String(x.id || '').toUpperCase() === orderId);
          if (!b) return { dirty: false };
          b.status = 'Paid';
          b.paymentExpiresAt = null;
          b.paidAt = new Date().toISOString();
          if (liveCheck.reference || payload.reference) b.selcomReference = String(liveCheck.reference || payload.reference);
          if (liveCheck.transId || payload.transid) b.selcomTransId = String(liveCheck.transId || payload.transid);
          if (liveCheck.channel || payload.channel) b.paymentMethod = `Selcom (${sanitizeTextInput(liveCheck.channel || payload.channel, 40)})`;
          return { dirty: true };
        });
      }

      return sendJSON(res, 200, { result: 'SUCCESS', resultcode: '000', order_id: orderId, verifiedPaid });
    } catch (err) {
      return sendJSON(res, 400, { result: 'FAIL', message: 'Invalid webhook payload' });
    }
  }

  // API: Exhibitor Email Login (Uses Email + Ref/Control # or 6-digit PIN)
  if (pathname === '/api/bookings/email-login' && req.method === 'POST') {
    const rate = checkRateLimit(`email-login-rl:${ctx.deviceId}:${ctx.clientIp}`, 30, 15 * 60 * 1000);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: `Too many login attempts. Wait ${rate.retryAfterSec}s.` }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const emailInput = String(payload.email || '').trim().toLowerCase();
      const refInput = String(payload.ref || '').trim().toUpperCase();
      const pin = String(payload.pin || '').trim();

      if (!emailInput || !emailInput.includes('@') || (!refInput && !pin)) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Email address and either a Booking ID / Payment Reference or 6-digit Security PIN are required.'
        }, {}, deviceCookieList);
      }

      const lockKey = `email-login:${emailInput}:${ctx.deviceId}`;
      const lockState = getLockoutState(pinLockoutStore, lockKey);
      if (lockState.locked) {
        return sendJSON(res, 429, {
          success: false,
          locked: true,
          retryAfterSec: lockState.retryAfterSec,
          error: `Too many invalid login attempts. Try again in ${lockState.retryAfterSec}s.`
        }, {}, deviceCookieList);
      }

      const db = readDbClean();
      const outcome = resolveExhibitorEmailLogin(db, {
        emailInput,
        refInput,
        pin,
        lockKey,
        deviceId: ctx.deviceId
      });
      return sendJSON(res, outcome.status, outcome.body, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid exhibitor login payload' }, {}, deviceCookieList);
    }
  }

  // API: Lookup Guest Booking (Contextual Auth: Masked by default unless Step-Up PIN provided)
  if (pathname === '/api/bookings/lookup' && req.method === 'POST') {
    const rate = checkRateLimit(`lookup-rl:${ctx.deviceId}:${ctx.clientIp}`, 30, 15 * 60 * 1000);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: `Too many lookup attempts. Wait ${rate.retryAfterSec}s.` }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const refInput = String(payload.ref || '').trim().toUpperCase();
      const phoneTail = normalizePhoneTail(payload.phone);
      const emailInput = String(payload.email || '').trim().toLowerCase();
      const pin = String(payload.pin || '').trim();

      if (!refInput || (!phoneTail && !emailInput)) {
        return sendJSON(res, 400, { success: false, error: 'Booking ID / Payment Reference and Phone or Email are required' }, {}, deviceCookieList);
      }

      const db = readDbClean();
      let found = findBookingByRefAndContact(db, refInput, phoneTail, emailInput);
      if (!found) {
        return sendJSON(res, 404, { success: false, error: 'No matching booth reservation found for those details.' }, {}, deviceCookieList);
      }

      // Live Selcom payment verification whenever an unpaid booking is checked
      const stLower = String(found.status || '').toLowerCase();
      if (stLower !== 'paid' && stLower !== 'confirmed' && getSelcomConfig().configured) {
        const liveSelcom = await querySelcomOrderStatus(found.id);
        if (liveSelcom.paid) {
          const updated = await withDbTransaction(txDb => {
            const b = txDb.bookings.find(x => x.id === found.id);
            if (!b) return { dirty: false, value: null };
            b.status = 'Paid';
            b.paymentExpiresAt = null;
            b.paidAt = new Date().toISOString();
            if (liveSelcom.reference) b.selcomReference = liveSelcom.reference;
            if (liveSelcom.transId) b.selcomTransId = liveSelcom.transId;
            return { dirty: true, value: b };
          });
          if (updated) found = updated;
        }
      }

      const hasPin = Boolean(found.accessPinHash);
      if (!pin) {
        return sendJSON(res, 200, {
          success: true,
          booking: toSafeBookingReceipt(found, { unmasked: false, hasPin, stepUpRequired: hasPin })
        }, {}, deviceCookieList);
      }

      const lockKey = `pin:${found.id}:${ctx.deviceId}`;
      const lockState = getLockoutState(pinLockoutStore, lockKey);
      if (lockState.locked) {
        return sendJSON(res, 429, {
          success: false,
          locked: true,
          retryAfterSec: lockState.retryAfterSec,
          error: `Too many invalid Access PIN attempts. Try again in ${lockState.retryAfterSec}s.`
        }, {}, deviceCookieList);
      }

      if (!hasPin || !verifySecret(pin, found.accessPinHash)) {
        const fail = recordFailure(pinLockoutStore, lockKey, 5, 15 * 60 * 1000);
        return sendJSON(res, fail.lockedUntil ? 429 : 403, {
          success: false,
          error: fail.lockedUntil
            ? 'Access PIN temporarily locked for 15 minutes after 5 failed attempts.'
            : 'Invalid 6-digit Access PIN.'
        }, {}, deviceCookieList);
      }

      pinLockoutStore.delete(lockKey);
      const manageToken = signPayload({
        role: 'booking_owner',
        bookingId: found.id,
        deviceId: ctx.deviceId
      }, MANAGE_TOKEN_TTL_MS);

      return sendJSON(res, 200, {
        success: true,
        booking: toSafeBookingReceipt(found, { unmasked: true, hasPin: true, stepUpRequired: false, manageToken })
      }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid booking lookup payload' }, {}, deviceCookieList);
    }
  }

  // API: Self-Service Booking Manage (Step-Up PIN or Scoped Manage Token Required: unlock / switch_booth / cancel)
  if (pathname === '/api/bookings/manage' && req.method === 'POST') {
    const rate = checkRateLimit(`manage-rl:${ctx.deviceId}:${ctx.clientIp}`, 30, 15 * 60 * 1000);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: `Too many management requests. Wait ${rate.retryAfterSec}s.` }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const refInput = String(payload.ref || '').trim().toUpperCase();
      const phoneTail = normalizePhoneTail(payload.phone);
      const emailInput = String(payload.email || '').trim().toLowerCase();
      const pin = String(payload.pin || '').trim();
      const manageToken = String(payload.manageToken || '').trim();
      const action = String(payload.action || 'unlock').trim();

      if (!refInput || (!phoneTail && !emailInput)) {
        return sendJSON(res, 400, { success: false, error: 'Booking reference and phone or email are required' }, {}, deviceCookieList);
      }

      const dbInitial = readDbClean();
      const target = findBookingByRefAndContact(dbInitial, refInput, phoneTail, emailInput);
      if (!target) {
        return sendJSON(res, 404, { success: false, error: 'Booking not found' }, {}, deviceCookieList);
      }

      const lockKey = `pin:${target.id}:${ctx.deviceId}`;
      const lockState = getLockoutState(pinLockoutStore, lockKey);
      if (lockState.locked) {
        return sendJSON(res, 429, {
          success: false,
          locked: true,
          retryAfterSec: lockState.retryAfterSec,
          error: `Step-up verification temporarily locked for ${lockState.retryAfterSec}s.`
        }, {}, deviceCookieList);
      }

      let authorized = false;
      if (manageToken) {
        const claims = verifySignedToken(manageToken);
        if (claims && claims.role === 'booking_owner' && claims.bookingId === target.id && claims.deviceId === ctx.deviceId) {
          authorized = true;
        }
      }
      if (!authorized && pin && target.accessPinHash && verifySecret(pin, target.accessPinHash)) {
        authorized = true;
        pinLockoutStore.delete(lockKey);
      }

      if (!authorized) {
        const fail = recordFailure(pinLockoutStore, lockKey, 5, 15 * 60 * 1000);
        return sendJSON(res, fail.lockedUntil ? 429 : 403, {
          success: false,
          error: target.accessPinHash
            ? (fail.lockedUntil ? 'Locked for 15 minutes after repeated invalid Access PINs.' : 'Valid 6-digit Access PIN required for this action.')
            : 'Legacy seed booking cannot be modified self-service; contact organizer support.'
        }, {}, deviceCookieList);
      }

      const issuedToken = signPayload({
        role: 'booking_owner',
        bookingId: target.id,
        deviceId: ctx.deviceId
      }, MANAGE_TOKEN_TTL_MS);

      if (action === 'unlock') {
        return sendJSON(res, 200, {
          success: true,
          booking: toSafeBookingReceipt(target, { unmasked: true, hasPin: Boolean(target.accessPinHash), stepUpRequired: false, manageToken: issuedToken })
        }, {}, deviceCookieList);
      }

      if (action === 'switch_booth') {
        const newCode = String(payload.newBoothCode || '').trim().toUpperCase();
        if (!newCode) {
          return sendJSON(res, 400, { success: false, error: 'newBoothCode is required' }, {}, deviceCookieList);
        }
        const result = await withDbTransaction(db => {
          const b = db.bookings.find(x => x.id === target.id);
          if (!b) return { dirty: false, value: { errorStatus: 404, error: 'Booking not found' } };
          if (String(b.status).toLowerCase() === 'cancelled' || String(b.status).toLowerCase() === 'expired') {
            return { dirty: false, value: { errorStatus: 400, error: 'Cannot switch booth on an inactive booking' } };
          }
          const conflict = findBoothConflict(db, newCode, b.cities || [], null, b.id);
          if (conflict) {
            return { dirty: false, value: { errorStatus: 409, error: `Booth ${newCode} is not available across all your selected cities.` } };
          }
          const oldCode = b.boothCode;
          b.boothCode = newCode;
          (b.cities || []).forEach(cityName => {
            recalcRegionCodeIfUnused(db, cityName, oldCode);
            const reg = db.regions.find(r => r.name === cityName);
            if (reg) {
              if (!Array.isArray(reg.bookedCodes)) reg.bookedCodes = [];
              if (!reg.bookedCodes.includes(newCode)) {
                reg.bookedCodes.push(newCode);
                reg.bookedBooths = Math.min(reg.totalBooths || 999, (reg.bookedBooths || 0) + 1);
              }
            }
          });
          return {
            dirty: true,
            value: {
              booking: toSafeBookingReceipt(b, { unmasked: true, hasPin: true, stepUpRequired: false, manageToken: issuedToken }),
              db: sanitizePublicDb(db)
            }
          };
        });
        if (result.errorStatus) {
          return sendJSON(res, result.errorStatus, { success: false, error: result.error }, {}, deviceCookieList);
        }
        return sendJSON(res, 200, { success: true, ...result }, {}, deviceCookieList);
      }

      if (action === 'cancel') {
        const result = await withDbTransaction(db => {
          const b = db.bookings.find(x => x.id === target.id);
          if (!b) return { dirty: false, value: { errorStatus: 404, error: 'Booking not found' } };
          if (String(b.status).toLowerCase() === 'paid') {
            return { dirty: false, value: { errorStatus: 400, error: 'Paid bookings require organizer desk review to refund/cancel.' } };
          }
          b.status = 'Cancelled';
          b.paymentExpiresAt = null;
          (b.cities || []).forEach(cityName => recalcRegionCodeIfUnused(db, cityName, b.boothCode));
          return {
            dirty: true,
            value: {
              booking: toSafeBookingReceipt(b, { unmasked: true, hasPin: true, stepUpRequired: false, manageToken: issuedToken }),
              db: sanitizePublicDb(db),
              liveStats: getLiveStats(db)
            }
          };
        });
        if (result.errorStatus) {
          return sendJSON(res, result.errorStatus, { success: false, error: result.error }, {}, deviceCookieList);
        }
        return sendJSON(res, 200, { success: true, ...result }, {}, deviceCookieList);
      }

      return sendJSON(res, 400, { success: false, error: 'Unsupported booking management action' }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid management payload' }, {}, deviceCookieList);
    }
  }

  // API: Create a new Sponsor / Partner Inquiry (Public Submit, Sanitized Response)
  if (pathname === '/api/sponsors' && req.method === 'POST') {
    const rate = checkRateLimit(`sp:${ctx.deviceId}:${ctx.clientIp}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: 'Too many requests' }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const organization = sanitizeTextInput(payload.organization, 140);
      const contactName = sanitizeTextInput(payload.contactName, 100);
      const phone = sanitizeTextInput(payload.phone, 32);
      const email = sanitizeTextInput(payload.email, 120).toLowerCase();
      if (!organization || !contactName || normalizePhoneTail(phone).length < 7 || !isValidEmail(email)) {
        return sendJSON(res, 400, { success: false, error: 'Complete organization contact details are required' }, {}, deviceCookieList);
      }

      const out = await withDbTransaction(db => {
        const newSponsor = {
          id: 'SP-' + crypto.randomInt(100, 999),
          organization,
          contactName: encryptField(contactName),
          phone: encryptField(phone),
          email: encryptField(email),
          tier: sanitizeTextInput(payload.tier || 'Sponsor', 48),
          targetRegions: sanitizeTextInput(payload.targetRegions || 'National Tour (All Regions)', 140),
          status: 'New Inquiry',
          createdAt: new Date().toISOString()
        };
        db.sponsors.unshift(newSponsor);
        return {
          dirty: true,
          value: {
            sponsorId: newSponsor.id,
            liveStats: getLiveStats(db)
          }
        };
      });

      return sendJSON(res, 201, { success: true, ...out }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid sponsor payload' }, {}, deviceCookieList);
    }
  }

  // API: Create/Update Events, News, or Advertisements (ADMIN AUTH REQUIRED)
  if (pathname === '/api/announcements' && req.method === 'POST') {
    const session = verifyAdminRequest(req);
    if (!session) {
      return sendJSON(res, 401, { success: false, error: 'Admin login required to publish announcements' }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const rawType = sanitizeTextInput(payload.type || 'EVENT', 24).toUpperCase();
      const postType = ['EVENT', 'NEWS', 'ADVERTISEMENT', 'ADVISORY'].includes(rawType) ? rawType : 'EVENT';
      const out = await withDbTransaction(db => {
        const newAnn = {
          id: 'UPD-' + crypto.randomInt(100, 999),
          type: postType,
          category: sanitizeTextInput(payload.category || `${postType} UPDATE`, 60),
          region: sanitizeTextInput(payload.region || 'All Regions', 60),
          title: sanitizeTextInput(payload.title || 'Taarifa Mpya ya Tanzania Biashara Festival', 180),
          summary: sanitizeTextInput(payload.summary || '', 1500)
        };
        db.announcements.unshift(newAnn);

        if (payload.regionId && payload.scheduleStatus) {
          const reg = db.regions.find(r => r.id === payload.regionId);
          if (reg) {
            const sched = sanitizeTextInput(payload.scheduleStatus, 140);
            reg.scheduleStatusSw = sched;
            reg.scheduleStatusEn = sched;
          }
        }
        return {
          dirty: true,
          value: { announcement: newAnn, db: sanitizePublicDb(db) }
        };
      });
      return sendJSON(res, 201, { success: true, ...out }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid announcement payload' }, {}, deviceCookieList);
    }
  }

  // API: Admin Set Tour Destination & Venue Location (ADMIN AUTH REQUIRED)
  if (pathname === '/api/admin/set-destination' && req.method === 'POST') {
    const session = verifyAdminRequest(req);
    if (!session) {
      return sendJSON(res, 401, { success: false, error: 'Admin authentication required' }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const rawId = sanitizeTextInput(payload.regionId || 'mwanza', 40).toLowerCase();
      const rawName = sanitizeTextInput(payload.regionName || '', 60);
      const out = await withDbTransaction(db => {
        let targetRegion = db.regions.find(r =>
          r.id === rawId || (rawName && r.name.toLowerCase() === rawName.toLowerCase())
        );
        const regionName = rawName || (targetRegion ? targetRegion.name : 'Mwanza');
        const regionId = targetRegion ? targetRegion.id : (rawId || regionName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        const defaultVenue = sanitizeTextInput(payload.venue || targetRegion?.venueSw || `${regionName} Exhibition Grounds`, 140);
        const defaultLocation = sanitizeTextInput(payload.venueLocation || targetRegion?.venueLocation || `${regionName} City Center`, 140);
        const defaultDates = sanitizeTextInput(payload.eventDates || targetRegion?.eventDates || 'Tarehe 15 - 20 Julai 2026', 80);

        if (!targetRegion) {
          targetRegion = {
            id: regionId,
            name: regionName,
            nameZh: regionName,
            zoneSw: `Mkoa wa ${regionName}`,
            zoneEn: `${regionName} Region`,
            zoneZh: regionName,
            scheduleStatusSw: 'Usajili wa Biashara & Mabanda Uko Wazi',
            scheduleStatusEn: 'Vendor & Business Registration Open',
            scheduleStatusZh: '商户与展位预订开放中',
            venueSw: defaultVenue,
            venueEn: defaultVenue,
            venueLocation: defaultLocation,
            eventDates: defaultDates,
            totalBooths: 160,
            bookedBooths: 0,
            registeredAttendees: 0,
            bookedCodes: []
          };
          db.regions.push(targetRegion);
        } else {
          if (payload.venue) {
            targetRegion.venueSw = defaultVenue;
            targetRegion.venueEn = defaultVenue;
          }
          if (payload.venueLocation) targetRegion.venueLocation = defaultLocation;
          if (payload.eventDates) targetRegion.eventDates = defaultDates;
        }

        const destination = {
          regionId,
          regionName,
          venue: defaultVenue,
          venueLocation: defaultLocation,
          eventDates: defaultDates,
          notes: sanitizeTextInput(payload.notes || 'Viwanja rasmi vya maonyesho, minada ya wazi na makongamano ya biashara.', 300),
          pinX: Number(payload.pinX) || (targetRegion?.mapCoords?.pinX || 260),
          pinY: Number(payload.pinY) || (targetRegion?.mapCoords?.pinY || 180),
          updatedAt: new Date().toISOString()
        };
        db.destination = destination;
        return {
          dirty: true,
          value: { destination: db.destination, regions: db.regions }
        };
      });
      return sendJSON(res, 200, { success: true, ...out }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: err.statusCode === 413 ? err.message : 'Invalid destination payload' }, {}, deviceCookieList);
    }
  }

  // API: Submit Contact Inquiry (Real Persisted Contact Form + Anti-Bot Protection)
  if (pathname === '/api/contact-messages' && req.method === 'POST') {
    const rate = checkRateLimit(`contact:${ctx.deviceId}:${ctx.clientIp}`, 10, 15 * 60 * 1000, ctx.clientIp);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: 'Too many messages sent. Please wait a few minutes.' }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      if (hasHoneypotTripped(payload)) {
        return sendJSON(res, 403, { success: false, error: 'Automated bot submission rejected.' }, {}, deviceCookieList);
      }
      const name = sanitizeTextInput(payload.name, 100);
      const phone = sanitizeTextInput(payload.phone, 32);
      const email = sanitizeTextInput(payload.email, 120).toLowerCase();
      const inquiryType = sanitizeTextInput(payload.type || 'General Inquiry', 80);
      const message = sanitizeTextInput(payload.message, 1200);

      if (!name || normalizePhoneTail(phone).length < 7 || !message) {
        return sendJSON(res, 400, { success: false, error: 'Full name, valid phone number, and message are required.' }, {}, deviceCookieList);
      }

      await withDbTransaction(db => {
        if (!Array.isArray(db.contactMessages)) db.contactMessages = [];
        db.contactMessages.unshift({
          id: 'MSG-' + crypto.randomInt(1000, 9999),
          name: encryptField(name),
          phone: encryptField(phone),
          email: email ? encryptField(email) : '',
          type: inquiryType,
          message,
          createdAt: new Date().toISOString()
        });
        if (db.contactMessages.length > 250) db.contactMessages = db.contactMessages.slice(0, 250);
        return { dirty: true, value: true };
      });

      return sendJSON(res, 201, { success: true, message: 'Inquiry received and logged.' }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 400, { success: false, error: 'Invalid contact message payload.' }, {}, deviceCookieList);
    }
  }

  // API: Subscribe to Newsletter
  if (pathname === '/api/newsletter/subscribe' && req.method === 'POST') {
    const rate = checkRateLimit(`sub:${ctx.deviceId}:${ctx.clientIp}`, 12, 15 * 60 * 1000, ctx.clientIp);
    if (!rate.allowed) {
      return sendJSON(res, 429, { success: false, retryAfterSec: rate.retryAfterSec, error: 'Too many requests' }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      if (hasHoneypotTripped(payload)) {
        return sendJSON(res, 403, { success: false, error: 'Automated bot submission rejected.' }, {}, deviceCookieList);
      }
      const email = sanitizeTextInput(payload.email, 120).toLowerCase();
      if (!isValidEmail(email)) {
        return sendJSON(res, 400, { success: false, error: 'Valid email address is required' }, {}, deviceCookieList);
      }
      const emailIdx = computeBlindIndex(email);

      const totalSubscribers = await withDbTransaction(db => {
        const existing = db.newsletterSubscribers.find(s =>
          (s.emailIdx && s.emailIdx === emailIdx) || decryptField(s.email).toLowerCase() === email
        );
        if (!existing) {
          db.newsletterSubscribers.unshift({
            id: 'SUB-' + crypto.randomInt(1000, 9999),
            email: encryptField(email),
            emailIdx,
            name: encryptField(sanitizeTextInput(payload.name || '', 80)),
            region: sanitizeTextInput(payload.region || 'All Regions', 60),
            subscribedAt: new Date().toISOString()
          });
        }
        return { dirty: !existing, value: { total: db.newsletterSubscribers.length, isNew: !existing } };
      });

      // Automatically send a Welcome Email from info@biasharafestival.co.tz on new subscription
      if (totalSubscribers.isNew) {
        const safeSubName = sanitizeTextInput(payload.name || 'Mshiriki / Mfuatiliaji', 80);
        const safeReg = sanitizeTextInput(payload.region || 'All Regions', 60);
        sendFestivalEmail(
          email,
          'Karibu Tanzania Biashara Festival (TBF) — Official Newsletter Confirmation',
          buildBrandedNewsletterHtml(
            'Asante kwa Kujiunga na Jarida Rasmi la TBF!',
            `<p>Habari <strong>${safeSubName}</strong>,</p>
             <p>Umejiunga kikamilifu na jarida rasmi la <strong>Tanzania Biashara Festival (TBF)</strong> kwa ajili ya taarifa za: <strong>${safeReg}</strong>.</p>
             <p>Tutakutumia ratiba rasmi za mikoa, fursa za mabanda, minada ya wazi, na majukwaa ya uwekezaji kupitia <strong>${OFFICIAL_MAIL_FROM}</strong>.</p>
             <p><a href="https://biasharafestival.co.tz/booking" style="display:inline-block;padding:10px 18px;background:#0b6b68;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Hifadhi Banda Mtandaoni &rarr;</a></p>`
          )
        ).catch(() => {});
      }

      return sendJSON(res, 200, {
        success: true,
        from: OFFICIAL_MAIL_FROM,
        message: 'Successfully subscribed to TBF newsletter',
        totalSubscribers: totalSubscribers.total
      }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, err.statusCode || 500, { success: false, error: err.statusCode === 413 ? err.message : 'Failed to process subscription' }, {}, deviceCookieList);
    }
  }

  // API: Organizer Admin Broadcast Newsletter (Sends real emails from info@biasharafestival.co.tz)
  if (pathname === '/api/admin/newsletter/send' && req.method === 'POST') {
    const session = verifyAdminRequest(req);
    if (!session) {
      return sendJSON(res, 401, { success: false, error: 'Admin authentication required' }, {}, deviceCookieList);
    }
    try {
      const payload = await parseBody(req);
      const subject = sanitizeTextInput(payload.subject, 180);
      const message = sanitizeTextInput(payload.message, 4000);
      const targetRegion = sanitizeTextInput(payload.targetRegion || 'ALL', 60);
      if (!subject || !message) {
        return sendJSON(res, 400, { success: false, error: 'Subject and message body are required.' }, {}, deviceCookieList);
      }

      const db = readDbClean();
      const subs = (db.newsletterSubscribers || []).filter(s => {
        if (!targetRegion || targetRegion === 'ALL') return true;
        const reg = String(s.region || '').toLowerCase();
        return reg.includes('all') || reg === targetRegion.toLowerCase();
      });

      const escapedParagraphs = message
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => `<p style="margin:0 0 12px;">${line.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p>`)
        .join('');
      const htmlBody = buildBrandedNewsletterHtml(
        subject,
        `${escapedParagraphs}<p style="margin-top:20px;"><a href="https://biasharafestival.co.tz/booking" style="display:inline-block;padding:10px 18px;background:#0b6b68;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Book Exhibition Booth / View Schedule &rarr;</a></p>`
      );

      let sentCount = 0;
      for (const s of subs) {
        const plainEmail = decryptField(s.email).trim().toLowerCase();
        if (isValidEmail(plainEmail)) {
          const mailRes = await sendFestivalEmail(plainEmail, subject, htmlBody);
          if (mailRes.sent) sentCount += 1;
        }
      }

      await withDbTransaction(txDb => {
        if (!Array.isArray(txDb.newsletterCampaigns)) txDb.newsletterCampaigns = [];
        txDb.newsletterCampaigns.unshift({
          id: 'CMP-' + crypto.randomInt(1000, 9999),
          from: OFFICIAL_MAIL_FROM,
          subject,
          targetRegion,
          recipientCount: subs.length,
          sentCount,
          sentAt: new Date().toISOString()
        });
        return { dirty: true };
      });

      return sendJSON(res, 200, {
        success: true,
        from: OFFICIAL_MAIL_FROM,
        totalTargeted: subs.length,
        sentCount,
        message: subs.length === 0
          ? 'Hakuna msajili kwenye kundi hilo bado, lakini kampeni imehifadhiwa.'
          : `Newsletter imetumwa kutoka ${OFFICIAL_MAIL_FROM} kwenda kwa wasajili ${sentCount} kati ya ${subs.length}.`
      }, {}, deviceCookieList);
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: 'Failed to broadcast newsletter' }, {}, deviceCookieList);
    }
  }

  // Serve Static Files (block path traversal, null bytes, and dotfiles/directories)
  let decodedPath = pathname;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch (e) {
    res.writeHead(400, { ...buildSecurityHeaders(req, { isHtml: false }), 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad Request');
  }
  if (decodedPath.includes('\0') || /(^|[\\/])\./.test(decodedPath)) {
    res.writeHead(403, { ...buildSecurityHeaders(req, { isHtml: false }), 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  const cleanSectionRoutes = new Set(['/booking', '/about', '/sponsors', '/events', '/news', '/contacts', '/login']);
  const relativePath = (decodedPath === '/' || cleanSectionRoutes.has(decodedPath.replace(/\/+$/, '').toLowerCase()))
    ? 'index.html'
    : decodedPath.replace(/^[/\\]+/, '');
  const resolvedPublic = path.resolve(PUBLIC_DIR);
  const resolvedTarget = path.resolve(resolvedPublic, relativePath);
  if (resolvedTarget !== resolvedPublic && !resolvedTarget.startsWith(resolvedPublic + path.sep)) {
    res.writeHead(403, { ...buildSecurityHeaders(req, { isHtml: false }), 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  fs.stat(resolvedTarget, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { ...buildSecurityHeaders(req, { isHtml: false }), 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(resolvedTarget).toLowerCase();
    const isServiceWorker = ext === '.js' && path.basename(resolvedTarget).toLowerCase() === 'sw.js';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const staticHeaders = {
      ...buildSecurityHeaders(req, { isHtml: ext === '.html', isServiceWorker }),
      'Content-Type': contentType,
      'Content-Length': stats.size
    };
    if (ext === '.html' || ext === '.js' || ext === '.css') {
      staticHeaders['Cache-Control'] = 'public, max-age=0, must-revalidate';
    }
    if (deviceCookieList.length) appendSetCookies(staticHeaders, deviceCookieList);
    res.writeHead(200, staticHeaders);
    const stream = fs.createReadStream(resolvedTarget);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal Server Error');
      } else {
        res.destroy();
      }
    });
    res.on('close', () => {
      if (!res.writableEnded) stream.destroy();
    });
    stream.pipe(res);
  });
});

function migrateDbPiiEncryptionOnce() {
  try {
    if (!fs.existsSync(DB_PATH)) return;
    const db = readDB();
    let changed = false;

    db.bookings.forEach(b => {
      if (b.controlNumber && !String(b.controlNumber).startsWith(ENC_PREFIX)) {
        b.controlNumber = encryptField(b.controlNumber);
        changed = true;
      }
      if (b.contactPerson && !String(b.contactPerson).startsWith(ENC_PREFIX)) {
        b.contactPerson = encryptField(b.contactPerson);
        changed = true;
      }
      if (b.phone) {
        const plainPhone = decryptField(b.phone);
        if (!String(b.phone).startsWith(ENC_PREFIX)) {
          b.phone = encryptField(plainPhone);
          changed = true;
        }
        const tailIdx = computeBlindIndex(normalizePhoneTail(plainPhone));
        if (tailIdx && b.phoneIdx !== tailIdx) {
          b.phoneIdx = tailIdx;
          changed = true;
        }
      }
      if (b.email) {
        const plainEmail = decryptField(b.email).trim().toLowerCase();
        if (!String(b.email).startsWith(ENC_PREFIX)) {
          b.email = encryptField(plainEmail);
          changed = true;
        }
        const eIdx = computeBlindIndex(plainEmail);
        if (eIdx && b.emailIdx !== eIdx) {
          b.emailIdx = eIdx;
          changed = true;
        }
      }
    });

    db.sponsors.forEach(s => {
      if (s.contactName && !String(s.contactName).startsWith(ENC_PREFIX)) {
        s.contactName = encryptField(s.contactName);
        changed = true;
      }
      if (s.phone && !String(s.phone).startsWith(ENC_PREFIX)) {
        s.phone = encryptField(s.phone);
        changed = true;
      }
      if (s.email && !String(s.email).startsWith(ENC_PREFIX)) {
        s.email = encryptField(String(s.email).trim().toLowerCase());
        changed = true;
      }
    });

    db.newsletterSubscribers.forEach(sub => {
      if (sub.email) {
        const plainEmail = decryptField(sub.email).trim().toLowerCase();
        if (!String(sub.email).startsWith(ENC_PREFIX)) {
          sub.email = encryptField(plainEmail);
          changed = true;
        }
        const eIdx = computeBlindIndex(plainEmail);
        if (eIdx && sub.emailIdx !== eIdx) {
          sub.emailIdx = eIdx;
          changed = true;
        }
      }
      if (sub.name && !String(sub.name).startsWith(ENC_PREFIX)) {
        sub.name = encryptField(sub.name);
        changed = true;
      }
    });

    if (changed) {
      writeDBAtomic(db);
    } else {
      try { fs.chmodSync(DB_PATH, 0o600); } catch (e) {}
    }
  } catch (err) {
    if (DEBUG_MODE) console.error('Startup DB encryption migration error:', err);
  }
}

migrateDbPiiEncryptionOnce();

server.headersTimeout = 65000;
server.requestTimeout = 30000;
server.keepAliveTimeout = 60000;

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught exception:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRITICAL] Unhandled rejection:', reason?.message || reason);
});

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [vid, info] of activeVisitorSessions.entries()) {
    if (now - info.lastSeen > 10 * 60 * 1000) activeVisitorSessions.delete(vid);
  }
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > (record.resetAt || 0) + 60000) rateLimitStore.delete(key);
  }
  for (const [key, record] of authLockoutStore.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) authLockoutStore.delete(key);
  }
  for (const [key, record] of pinLockoutStore.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) pinLockoutStore.delete(key);
  }
  for (const [jti, exp] of revokedAdminTokens.entries()) {
    if (now > exp) revokedAdminTokens.delete(jti);
  }
}, 60000);
if (cleanupInterval.unref) cleanupInterval.unref();

server.listen(PORT, () => {
  console.log(`Tanzania Biashara Festival platform running at http://localhost:${PORT}`);
});
