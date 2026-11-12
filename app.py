"""
Tanzania Biashara Festival (TBF) — Python Backend Server (Synchronized with server.js)
Booking-First + Contextual Authentication + Atomic Locking + PII Sanitization
Run with: python app.py
"""
import base64
import datetime
import hashlib
import hmac
import json
import os
import secrets
import threading
import time
from http.cookies import SimpleCookie
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import quote, unquote, urlparse

PORT = int(os.environ.get("PORT", 3000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "db.json")
SECRET_PATH = os.path.join(DATA_DIR, ".auth_secret")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

HOLD_TTL_MS = 10 * 60 * 1000
UNPAID_BOOKING_TTL_MS = 24 * 60 * 60 * 1000
ADMIN_SESSION_TTL_SEC = 2 * 60 * 60
MANAGE_TOKEN_TTL_SEC = 15 * 60

ADMIN_IDENTIFIER = os.environ.get("TBF_ADMIN_EMAIL", "info@biasharafestival.co.tz").strip().lower()
ADMIN_PLAIN_FALLBACK = os.environ.get("TBF_ADMIN_PASSWORD", "").strip()

db_lock = threading.Lock()
active_visitor_sessions = {}
rate_limit_store = {}
auth_lockout_store = {}
pin_lockout_store = {}


def get_hmac_secret():
    if os.environ.get("TBF_SESSION_SECRET"):
        return os.environ["TBF_SESSION_SECRET"]
    try:
        if os.path.exists(SECRET_PATH):
            with open(SECRET_PATH, "r", encoding="utf-8") as f:
                s = f.read().strip()
                if len(s) >= 32:
                    return s
        os.makedirs(DATA_DIR, exist_ok=True)
        s = secrets.token_hex(32)
        with open(SECRET_PATH, "w", encoding="utf-8") as f:
            f.write(s)
        return s
    except Exception:
        return secrets.token_hex(32)


HMAC_SECRET = get_hmac_secret()


def hash_secret(plain_text):
    salt = secrets.token_hex(16)
    derived = hashlib.scrypt(str(plain_text).encode("utf-8"), salt=salt.encode("utf-8"), n=16384, r=8, p=1, dklen=32)
    return f"{salt}:{derived.hex()}"


def verify_secret(plain_text, stored_hash):
    if not stored_hash or ":" not in str(stored_hash):
        return False
    salt, orig_hex = str(stored_hash).split(":", 1)
    try:
        derived = hashlib.scrypt(str(plain_text).encode("utf-8"), salt=salt.encode("utf-8"), n=16384, r=8, p=1, dklen=32)
        expected = bytes.fromhex(orig_hex)
        return len(derived) == len(expected) and hmac.compare_digest(derived, expected)
    except Exception:
        return False


ADMIN_CREDENTIAL_HASH = hash_secret(ADMIN_PLAIN_FALLBACK) if ADMIN_PLAIN_FALLBACK else None


def _b64url_encode(raw_bytes):
    return base64.urlsafe_b64encode(raw_bytes).rstrip(b"=").decode("ascii")


def _b64url_decode(txt):
    pad = "=" * ((4 - len(txt) % 4) % 4)
    return base64.urlsafe_b64decode(txt + pad)


def sign_payload(obj, ttl_ms):
    body = dict(obj)
    body["exp"] = int(time.time() * 1000) + ttl_ms
    encoded = _b64url_encode(json.dumps(body).encode("utf-8"))
    sig = _b64url_encode(hmac.new(HMAC_SECRET.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest())
    return f"{encoded}.{sig}"


def verify_signed_token(token):
    if not token or "." not in str(token):
        return None
    encoded, sig = str(token).split(".", 1)
    expected = _b64url_encode(hmac.new(HMAC_SECRET.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        parsed = json.loads(_b64url_decode(encoded).decode("utf-8"))
        if not parsed or parsed.get("exp", 0) < int(time.time() * 1000):
            return None
        return parsed
    except Exception:
        return None


def ensure_db_shape(db):
    for key in ["regions", "boothPackages", "bookings", "sponsors", "announcements", "newsletterSubscribers", "boothHolds", "securityLog"]:
        if not isinstance(db.get(key), list):
            db[key] = []
    if not isinstance(db.get("analytics"), dict):
        db["analytics"] = {}
    return db


def read_db():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return ensure_db_shape(json.load(f))


def write_db_atomic(data):
    tmp = f"{DB_PATH}.tmp.{os.getpid()}.{threading.get_ident()}"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, DB_PATH)


def normalize_phone_tail(phone):
    digits = "".join(ch for ch in str(phone or "") if ch.isdigit())
    return digits[-9:] if len(digits) >= 9 else digits


def recalc_region_code_if_unused(db, region_name, booth_code):
    still = any(
        str(b.get("status", "")).lower() not in ("cancelled", "expired")
        and region_name in (b.get("cities") or [])
        and b.get("boothCode") == booth_code
        for b in db["bookings"]
    )
    if not still:
        for reg in db["regions"]:
            if reg.get("name") == region_name and booth_code in (reg.get("bookedCodes") or []):
                reg["bookedCodes"].remove(booth_code)
                if reg.get("bookedBooths", 0) > 0:
                    reg["bookedBooths"] -= 1


def prune_expired_records(db):
    now_ms = int(time.time() * 1000)
    changed = False
    before = len(db["boothHolds"])
    db["boothHolds"] = [h for h in db["boothHolds"] if h.get("expiresAt", 0) > now_ms]
    if len(db["boothHolds"]) != before:
        changed = True
    for b in db["bookings"]:
        if str(b.get("status", "")).lower() == "awaiting payment" and b.get("paymentExpiresAt"):
            try:
                exp_ts = datetime.datetime.fromisoformat(b["paymentExpiresAt"].replace("Z", "+00:00")).timestamp() * 1000
                if exp_ts <= now_ms:
                    b["status"] = "Expired"
                    changed = True
                    for city in b.get("cities") or []:
                        recalc_region_code_if_unused(db, city, b.get("boothCode"))
            except Exception:
                pass
    return changed


def find_booth_conflict(db, booth_code, cities, exclude_hold=None, exclude_booking=None):
    city_set = set(cities)
    for b in db["bookings"]:
        if exclude_booking and b.get("id") == exclude_booking:
            continue
        if str(b.get("status", "")).lower() in ("cancelled", "expired"):
            continue
        if b.get("boothCode") == booth_code and any(c in city_set for c in (b.get("cities") or [])):
            return ("BOOKED", b.get("id"))
    now_ms = int(time.time() * 1000)
    for h in db["boothHolds"]:
        if h.get("expiresAt", 0) <= now_ms:
            continue
        if exclude_hold and h.get("holdToken") == exclude_hold:
            continue
        if h.get("boothCode") == booth_code and any(c in city_set for c in (h.get("cities") or [])):
            return ("HELD", h.get("expiresAt"))
    return None


def get_live_stats(db):
    cutoff = time.time() - 600
    for k in [k for k, v in active_visitor_sessions.items() if v["lastSeen"] < cutoff]:
        del active_visitor_sessions[k]
    region_map = {}
    for info in active_visitor_sessions.values():
        r = info.get("region", "dar")
        region_map[r] = region_map.get(r, 0) + 1
    analytics = db.get("analytics", {})
    active_bookings = [b for b in db["bookings"] if str(b.get("status", "")).lower() not in ("cancelled", "expired")]
    return {
        "liveOnlineCount": max(1, len(active_visitor_sessions)),
        "regionLiveMap": region_map,
        "totalCookieVisitors": analytics.get("totalCookieVisitors", 71997),
        "totalRegisteredAttendees": analytics.get("totalRegisteredAttendees", 18450),
        "totalBusinessesShowcased": analytics.get("totalBusinessesShowcased", 493) + len(active_bookings),
        "totalPartnersAndInvestors": analytics.get("totalPartnersAndInvestors", 149) + len(db.get("sponsors", [])),
    }


def sanitize_public_db(db):
    now_ms = int(time.time() * 1000)
    pub_bookings = [
        {
            "id": b.get("id"),
            "businessName": b.get("businessName"),
            "tagline": b.get("tagline"),
            **({"taglineEn": b["taglineEn"]} if b.get("taglineEn") else {}),
            **({"taglineZh": b["taglineZh"]} if b.get("taglineZh") else {}),
            "sector": b.get("sector"),
            "packageId": b.get("packageId"),
            "packageName": b.get("packageName"),
            "boothCode": b.get("boothCode"),
            "cities": b.get("cities") or [],
            "status": b.get("status"),
            "featured": bool(b.get("featured")),
            **({"images": b["images"]} if isinstance(b.get("images"), list) else {}),
        }
        for b in db["bookings"]
        if str(b.get("status", "")).lower() not in ("cancelled", "expired") and b.get("featured") is not False
    ]
    holds = [{"boothCode": h["boothCode"], "cities": h["cities"], "expiresAt": h["expiresAt"]} for h in db["boothHolds"] if h.get("expiresAt", 0) > now_ms]
    return {
        "regions": db["regions"],
        "boothPackages": db["boothPackages"],
        "bookings": pub_bookings,
        "activeHolds": holds,
        "announcements": db["announcements"],
        "destination": db.get("destination"),
        "analytics": db["analytics"],
        "sponsorsCount": len(db["sponsors"]),
    }


def mask_phone(phone):
    digits = "".join(ch for ch in str(phone or "") if ch.isdigit())
    return f"+255 *** *** {digits[-3:]}" if len(digits) >= 4 else "***"


def mask_email(email):
    s = str(email or "").strip()
    if "@" not in s:
        return "***"
    local, dom = s.split("@", 1)
    return f"{local[:1]}***@{dom}"


def to_safe_receipt(b, unmasked=False, has_pin=False, step_up=False, manage_token=None):
    ctrl = b.get("controlNumber")
    return {
        "id": b.get("id"),
        "controlNumber": (ctrl or "-") if unmasked else (f"***{str(ctrl)[-4:]}" if ctrl else "-"),
        "businessName": b.get("businessName"),
        "tagline": b.get("tagline"),
        "contactPerson": b.get("contactPerson") if unmasked else (f"{str(b.get('contactPerson', ''))[:2]}***"),
        "phone": b.get("phone") if unmasked else mask_phone(b.get("phone")),
        "email": b.get("email") if unmasked else mask_email(b.get("email")),
        "sector": b.get("sector"),
        "packageId": b.get("packageId"),
        "packageName": b.get("packageName"),
        "boothCode": b.get("boothCode"),
        "cities": b.get("cities") or [],
        "totalAmount": int(b.get("totalAmount") or 0),
        "paymentMethod": b.get("paymentMethod"),
        "status": b.get("status"),
        "paymentExpiresAt": b.get("paymentExpiresAt"),
        "createdAt": b.get("createdAt"),
        "hasAccessPin": has_pin,
        "unmasked": unmasked,
        "stepUpRequired": step_up,
        "manageToken": manage_token,
    }


def check_rate_limit(bucket, max_hits, window_sec):
    now = time.time()
    entry = rate_limit_store.get(bucket)
    if not entry or entry["resetAt"] <= now:
        rate_limit_store[bucket] = {"count": 1, "resetAt": now + window_sec}
        return True, 0
    if entry["count"] >= max_hits:
        return False, max(1, int(entry["resetAt"] - now))
    entry["count"] += 1
    return True, 0


class TBFHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def _get_context(self):
        c = SimpleCookie(self.headers.get("Cookie", ""))
        existing = c["tbf_device_id"].value if "tbf_device_id" in c else None
        did = unquote(existing) if existing and len(existing) >= 12 else secrets.token_hex(16)
        ua = self.headers.get("User-Agent", "unknown")
        ua_norm = "".join("x" if ch.isdigit() else ch for ch in ua)
        ua_family = hashlib.sha256(ua_norm.encode("utf-8")).hexdigest()[:16]
        return {"device_id": did, "is_new_device": not bool(existing), "ua_family": ua_family, "ip": self.client_address[0], "cookies": c}

    def _verify_admin(self, ctx):
        if "tbf_admin_session" not in ctx["cookies"]:
            return None
        sess = verify_signed_token(unquote(ctx["cookies"]["tbf_admin_session"].value))
        if not sess or sess.get("role") != "admin" or sess.get("uaFamily") != ctx["ua_family"]:
            return None
        return sess

    def _send_json(self, status, payload, cookies=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        if cookies:
            for c_str in cookies:
                self.send_header("Set-Cookie", c_str)
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        return json.loads(raw) if raw else {}

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        ctx = self._get_context()
        dev_cookies = [f"tbf_device_id={quote(ctx['device_id'])}; Path=/; Max-Age={90*86400}; SameSite=Lax; HttpOnly"] if ctx["is_new_device"] else []

        if parsed.path == "/api/data":
            with db_lock:
                db = read_db()
                if prune_expired_records(db):
                    write_db_atomic(db)
            out = sanitize_public_db(db)
            out["liveStats"] = get_live_stats(db)
            return self._send_json(200, out, dev_cookies)

        if parsed.path == "/api/auth/session":
            sess = self._verify_admin(ctx)
            return self._send_json(200, {"authenticated": bool(sess), "user": {"identifier": sess["sub"], "role": "admin"} if sess else None}, dev_cookies)

        if parsed.path == "/api/admin/overview":
            sess = self._verify_admin(ctx)
            if not sess:
                return self._send_json(401, {"success": False, "error": "Admin authentication required"}, dev_cookies)
            with db_lock:
                db = read_db()
                if prune_expired_records(db):
                    write_db_atomic(db)
            safe_bookings = [{**{k: v for k, v in b.items() if k != "accessPinHash"}, "hasAccessPin": bool(b.get("accessPinHash"))} for b in db["bookings"]]
            return self._send_json(200, {
                "success": True,
                "bookings": safe_bookings,
                "sponsors": db["sponsors"],
                "activeHolds": db["boothHolds"],
                "newsletterCount": len(db["newsletterSubscribers"]),
                "securityLog": db["securityLog"][:15],
                "liveStats": get_live_stats(db),
            }, dev_cookies)

        return super().do_GET()

    def do_DELETE(self):
        parsed = urlparse(self.path)
        ctx = self._get_context()
        if parsed.path == "/api/bookings/hold":
            payload = self._read_body()
            hold_token = str(payload.get("holdToken", ""))
            with db_lock:
                db = read_db()
                before = len(db["boothHolds"])
                db["boothHolds"] = [h for h in db["boothHolds"] if h.get("holdToken") != hold_token]
                if len(db["boothHolds"]) != before:
                    write_db_atomic(db)
            return self._send_json(200, {"success": True})
        return self._send_json(404, {"error": "Endpoint not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        ctx = self._get_context()
        dev_cookies = [f"tbf_device_id={quote(ctx['device_id'])}; Path=/; Max-Age={90*86400}; SameSite=Lax; HttpOnly"] if ctx["is_new_device"] else []
        payload = self._read_body()

        if parsed.path == "/api/auth/login":
            ident = str(payload.get("identifier", "")).strip().lower()
            pwd = str(payload.get("password", ""))
            lkey = f"admin:{ctx['device_id']}:{ctx['ip']}"
            entry = auth_lockout_store.get(lkey)
            if entry and entry.get("lockedUntil", 0) > time.time():
                retry = max(1, int(entry["lockedUntil"] - time.time()))
                return self._send_json(429, {"success": False, "locked": True, "retryAfterSec": retry, "error": f"Locked. Retry in {retry}s."}, dev_cookies)
            if ident != ADMIN_IDENTIFIER or not verify_secret(pwd, ADMIN_CREDENTIAL_HASH):
                cur = auth_lockout_store.get(lkey, {"failures": 0, "lockedUntil": 0})
                cur["failures"] += 1
                if cur["failures"] >= 5:
                    cur["lockedUntil"] = time.time() + 600
                auth_lockout_store[lkey] = cur
                rem = max(0, 5 - cur["failures"])
                return self._send_json(429 if cur["lockedUntil"] else 401, {"success": False, "remainingAttempts": rem, "error": f"Invalid credentials ({rem} attempts left)."}, dev_cookies)
            auth_lockout_store.pop(lkey, None)
            tok = sign_payload({"role": "admin", "sub": ADMIN_IDENTIFIER, "deviceId": ctx["device_id"], "uaFamily": ctx["ua_family"]}, ADMIN_SESSION_TTL_SEC * 1000)
            cookies = dev_cookies + [f"tbf_admin_session={quote(tok)}; Path=/; Max-Age={ADMIN_SESSION_TTL_SEC}; SameSite=Lax; HttpOnly"]
            return self._send_json(200, {"success": True, "user": {"identifier": ADMIN_IDENTIFIER, "role": "admin"}}, cookies)

        if parsed.path == "/api/auth/logout":
            return self._send_json(200, {"success": True}, dev_cookies + ["tbf_admin_session=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly"])

        if parsed.path == "/api/visitor-ping":
            vid = payload.get("visitorId", f"v_{int(time.time()*1000)}")
            region_id = payload.get("regionId", "dar")
            active_visitor_sessions[vid] = {"lastSeen": time.time(), "region": region_id}
            with db_lock:
                db = read_db()
                if payload.get("isNewVisitor"):
                    db["analytics"]["totalCookieVisitors"] = db["analytics"].get("totalCookieVisitors", 71997) + 1
                    write_db_atomic(db)
            cookies = dev_cookies + [f"tbf_visitor_id={quote(vid)}; Path=/; Max-Age=31536000; SameSite=Lax"]
            return self._send_json(200, {"success": True, "visitorId": vid, "liveStats": get_live_stats(db), "regions": db["regions"]}, cookies)

        if parsed.path == "/api/attendee-rsvp":
            region_id = payload.get("regionId", "dar")
            count = min(20, max(1, int(payload.get("count", 1))))
            with db_lock:
                db = read_db()
                for reg in db["regions"]:
                    if reg["id"] == region_id:
                        reg["registeredAttendees"] = reg.get("registeredAttendees", 0) + count
                db["analytics"]["totalRegisteredAttendees"] = db["analytics"].get("totalRegisteredAttendees", 18450) + count
                write_db_atomic(db)
            return self._send_json(201, {"success": True, "liveStats": get_live_stats(db), "db": sanitize_public_db(db)}, dev_cookies)

        if parsed.path == "/api/bookings/hold":
            ok, retry = check_rate_limit(f"hold:{ctx['device_id']}:{ctx['ip']}", 20, 600)
            if not ok:
                return self._send_json(429, {"success": False, "retryAfterSec": retry, "error": "Rate limit exceeded"}, dev_cookies)
            code = str(payload.get("boothCode", "")).strip().upper()
            cities = [c for c in (payload.get("cities") or []) if c]
            inc_tok = payload.get("holdToken")
            if not code or not cities:
                return self._send_json(400, {"success": False, "error": "boothCode and cities required"}, dev_cookies)
            with db_lock:
                db = read_db()
                prune_expired_records(db)
                conflict = find_booth_conflict(db, code, cities, exclude_hold=inc_tok)
                if conflict:
                    return self._send_json(409, {"success": False, "errorCode": "BOOTH_HELD" if conflict[0] == "HELD" else "BOOTH_BOOKED", "error": "Booth unavailable"}, dev_cookies)
                if inc_tok:
                    db["boothHolds"] = [h for h in db["boothHolds"] if h.get("holdToken") != inc_tok]
                tok = inc_tok or secrets.token_hex(16)
                hold = {"holdId": "HLD-" + secrets.token_hex(3).upper(), "holdToken": tok, "boothCode": code, "cities": cities, "deviceId": ctx["device_id"], "createdAt": int(time.time() * 1000), "expiresAt": int(time.time() * 1000) + HOLD_TTL_MS}
                db["boothHolds"].append(hold)
                write_db_atomic(db)
            return self._send_json(200, {"success": True, "hold": {k: hold[k] for k in ("holdId", "holdToken", "boothCode", "cities", "expiresAt")}, "db": sanitize_public_db(db)}, dev_cookies)

        if parsed.path == "/api/bookings":
            ok, retry = check_rate_limit(f"book:{ctx['device_id']}:{ctx['ip']}", 5, 900)
            if not ok:
                return self._send_json(429, {"success": False, "retryAfterSec": retry, "error": "Booking rate limit exceeded"}, dev_cookies)
            biz = str(payload.get("businessName", "")).strip()
            cp = str(payload.get("contactPerson", "")).strip()
            phone = str(payload.get("phone", "")).strip()
            code = str(payload.get("boothCode", "")).strip().upper()
            cities = [c for c in (payload.get("cities") or []) if c]
            hold_tok = payload.get("holdToken")
            if not biz or not cp or len(normalize_phone_tail(phone)) < 9 or not code or not cities:
                return self._send_json(400, {"success": False, "error": "Complete business details required"}, dev_cookies)
            pin = str(secrets.randbelow(900000) + 100000)
            with db_lock:
                db = read_db()
                prune_expired_records(db)
                conflict = find_booth_conflict(db, code, cities, exclude_hold=hold_tok)
                if conflict:
                    return self._send_json(409, {"success": False, "errorCode": "BOOTH_BOOKED", "error": "Booth already reserved or booked"}, dev_cookies)
                if hold_tok:
                    db["boothHolds"] = [h for h in db["boothHolds"] if h.get("holdToken") != hold_tok]
                exp_iso = datetime.datetime.fromtimestamp(time.time() + UNPAID_BOOKING_TTL_MS / 1000, tz=datetime.timezone.utc).isoformat()
                new_b = {
                    "id": f"TBF-BIZ-{secrets.randbelow(9000) + 1000}",
                    "controlNumber": f"99104{secrets.randbelow(9000000) + 1000000}",
                    "accessPinHash": hash_secret(pin),
                    "businessName": biz,
                    "tagline": str(payload.get("tagline", "Bidhaa na huduma bora.")).strip(),
                    "contactPerson": cp,
                    "phone": phone,
                    "email": str(payload.get("email", "vendor@biasharafestival.co.tz")).strip(),
                    "sector": str(payload.get("sector", "Biashara & Huduma")).strip(),
                    "packageId": payload.get("packageId", "standard-booth"),
                    "packageName": payload.get("packageName", "Standard SME Booth (3m x 3m)"),
                    "boothCode": code,
                    "cities": cities,
                    "totalAmount": int(payload.get("totalAmount", 350000)),
                    "paymentMethod": payload.get("paymentMethod", "M-Pesa"),
                    "featured": True,
                    "status": "Awaiting Payment",
                    "paymentExpiresAt": exp_iso,
                    "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                }
                db["bookings"].insert(0, new_b)
                for reg in db["regions"]:
                    if reg["name"] in cities:
                        reg["bookedBooths"] = min(reg.get("totalBooths", 999), reg.get("bookedBooths", 0) + 1)
                        if code not in reg.setdefault("bookedCodes", []):
                            reg["bookedCodes"].append(code)
                write_db_atomic(db)
            return self._send_json(201, {"success": True, "booking": to_safe_receipt(new_b, True, True, False), "accessPin": pin, "liveStats": get_live_stats(db), "db": sanitize_public_db(db)}, dev_cookies)

        if parsed.path == "/api/bookings/lookup":
            ref_in = str(payload.get("ref", "")).strip().upper()
            p_tail = normalize_phone_tail(payload.get("phone"))
            pin = str(payload.get("pin", "")).strip()
            if not ref_in or not p_tail:
                return self._send_json(400, {"success": False, "error": "Reference / Control Number and Phone required"}, dev_cookies)
            with db_lock:
                db = read_db()
                prune_expired_records(db)
            found = next((b for b in db["bookings"] if (str(b.get("id", "")).strip().upper() == ref_in or str(b.get("controlNumber", "")).strip().upper() == ref_in) and normalize_phone_tail(b.get("phone")) == p_tail), None)
            if not found:
                return self._send_json(404, {"success": False, "error": "Booking not found"}, dev_cookies)
            has_pin = bool(found.get("accessPinHash"))
            if not pin:
                return self._send_json(200, {"success": True, "booking": to_safe_receipt(found, False, has_pin, has_pin)}, dev_cookies)
            if not has_pin or not verify_secret(pin, found.get("accessPinHash")):
                return self._send_json(403, {"success": False, "error": "Invalid 6-digit Access PIN"}, dev_cookies)
            mtok = sign_payload({"role": "booking_owner", "bookingId": found["id"], "deviceId": ctx["device_id"]}, MANAGE_TOKEN_TTL_SEC * 1000)
            return self._send_json(200, {"success": True, "booking": to_safe_receipt(found, True, True, False, mtok)}, dev_cookies)

        if parsed.path == "/api/bookings/manage":
            ref_in = str(payload.get("ref", "")).strip().upper()
            p_tail = normalize_phone_tail(payload.get("phone"))
            pin = str(payload.get("pin", "")).strip()
            mtok = str(payload.get("manageToken", "")).strip()
            action = str(payload.get("action", "unlock")).strip()
            with db_lock:
                db = read_db()
                found = next((b for b in db["bookings"] if (str(b.get("id", "")).strip().upper() == ref_in or str(b.get("controlNumber", "")).strip().upper() == ref_in) and normalize_phone_tail(b.get("phone")) == p_tail), None)
                if not found:
                    return self._send_json(404, {"success": False, "error": "Booking not found"}, dev_cookies)
                claims = verify_signed_token(mtok) if mtok else None
                ok_tok = bool(claims and claims.get("role") == "booking_owner" and claims.get("bookingId") == found["id"] and claims.get("deviceId") == ctx["device_id"])
                ok_pin = bool(pin and found.get("accessPinHash") and verify_secret(pin, found["accessPinHash"]))
                if not (ok_tok or ok_pin):
                    return self._send_json(403, {"success": False, "error": "Valid Access PIN required"}, dev_cookies)
                new_tok = sign_payload({"role": "booking_owner", "bookingId": found["id"], "deviceId": ctx["device_id"]}, MANAGE_TOKEN_TTL_SEC * 1000)
                if action == "unlock":
                    return self._send_json(200, {"success": True, "booking": to_safe_receipt(found, True, True, False, new_tok)}, dev_cookies)
                if action == "switch_booth":
                    new_code = str(payload.get("newBoothCode", "")).strip().upper()
                    if find_booth_conflict(db, new_code, found.get("cities") or [], exclude_booking=found["id"]):
                        return self._send_json(409, {"success": False, "error": "Target booth unavailable"}, dev_cookies)
                    old_code = found["boothCode"]
                    found["boothCode"] = new_code
                    for city in found.get("cities") or []:
                        recalc_region_code_if_unused(db, city, old_code)
                        for reg in db["regions"]:
                            if reg["name"] == city and new_code not in reg.setdefault("bookedCodes", []):
                                reg["bookedCodes"].append(new_code)
                                reg["bookedBooths"] = min(reg.get("totalBooths", 999), reg.get("bookedBooths", 0) + 1)
                    write_db_atomic(db)
                    return self._send_json(200, {"success": True, "booking": to_safe_receipt(found, True, True, False, new_tok), "db": sanitize_public_db(db)}, dev_cookies)
                if action == "cancel":
                    if str(found.get("status", "")).lower() == "paid":
                        return self._send_json(400, {"success": False, "error": "Paid bookings cannot be self-cancelled"}, dev_cookies)
                    found["status"] = "Cancelled"
                    found["paymentExpiresAt"] = None
                    for city in found.get("cities") or []:
                        recalc_region_code_if_unused(db, city, found.get("boothCode"))
                    write_db_atomic(db)
                    return self._send_json(200, {"success": True, "booking": to_safe_receipt(found, True, True, False, new_tok), "db": sanitize_public_db(db), "liveStats": get_live_stats(db)}, dev_cookies)

        if parsed.path in ("/api/announcements", "/api/admin/set-destination", "/api/admin/bookings/status"):
            if not self._verify_admin(ctx):
                return self._send_json(401, {"success": False, "error": "Admin authentication required"}, dev_cookies)

        if parsed.path == "/api/announcements":
            with db_lock:
                db = read_db()
                new_ann = {"id": f"UPD-{secrets.randbelow(900)+100}", "type": payload.get("type", "EVENT"), "category": payload.get("category", "UPDATE"), "region": payload.get("region", "All Regions"), "title": payload.get("title", "Update"), "summary": payload.get("summary", "")}
                db["announcements"].insert(0, new_ann)
                write_db_atomic(db)
            return self._send_json(201, {"success": True, "announcement": new_ann, "db": sanitize_public_db(db)}, dev_cookies)

        if parsed.path == "/api/admin/set-destination":
            with db_lock:
                db = read_db()
                rid = str(payload.get("regionId", "mwanza")).strip().lower()
                rname = str(payload.get("regionName") or rid.title()).strip()
                target_reg = next((r for r in db["regions"] if r.get("id") == rid or str(r.get("name", "")).lower() == rname.lower()), None)
                if not target_reg:
                    target_reg = {
                        "id": rid,
                        "name": rname,
                        "venueSw": payload.get("venue", f"{rname} Exhibition Grounds"),
                        "venueEn": payload.get("venue", f"{rname} Exhibition Grounds"),
                        "venueLocation": payload.get("venueLocation", f"{rname} City Center"),
                        "eventDates": payload.get("eventDates", ""),
                        "totalBooths": 160,
                        "bookedBooths": 0,
                        "registeredAttendees": 0,
                        "bookedCodes": [],
                    }
                    db["regions"].append(target_reg)
                else:
                    if payload.get("venue"):
                        target_reg["venueSw"] = payload.get("venue")
                        target_reg["venueEn"] = payload.get("venue")
                    if payload.get("venueLocation"):
                        target_reg["venueLocation"] = payload.get("venueLocation")
                    if payload.get("eventDates"):
                        target_reg["eventDates"] = payload.get("eventDates")
                dest = {"regionId": target_reg["id"], "regionName": target_reg["name"], "venue": payload.get("venue", ""), "venueLocation": payload.get("venueLocation", ""), "eventDates": payload.get("eventDates", ""), "notes": payload.get("notes", ""), "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}
                db["destination"] = dest
                write_db_atomic(db)
            return self._send_json(200, {"success": True, "destination": dest, "regions": db["regions"]}, dev_cookies)

        if parsed.path == "/api/sponsors":
            org = str(payload.get("organization", "")).strip()
            cn = str(payload.get("contactName", "")).strip()
            ph = str(payload.get("phone", "")).strip()
            em = str(payload.get("email", "")).strip()
            if not org or not cn or not ph or "@" not in em:
                return self._send_json(400, {"success": False, "error": "Valid sponsor details required"}, dev_cookies)
            with db_lock:
                db = read_db()
                db["sponsors"].insert(0, {"id": f"SP-{secrets.randbelow(900)+100}", "organization": org, "contactName": cn, "phone": ph, "email": em, "tier": payload.get("tier") or "Sponsor", "targetRegions": payload.get("targetRegions", "All"), "status": "New Inquiry"})
                write_db_atomic(db)
            return self._send_json(201, {"success": True, "liveStats": get_live_stats(db)}, dev_cookies)

        if parsed.path == "/api/newsletter/subscribe":
            email = str(payload.get("email", "")).strip().lower()
            if "@" not in email:
                return self._send_json(400, {"success": False, "error": "Valid email required"}, dev_cookies)
            with db_lock:
                db = read_db()
                if not any(s.get("email") == email for s in db["newsletterSubscribers"]):
                    db["newsletterSubscribers"].insert(0, {"id": f"SUB-{secrets.randbelow(9000)+1000}", "email": email, "name": str(payload.get("name", "")), "region": payload.get("region", "All Regions")})
                    write_db_atomic(db)
            return self._send_json(200, {"success": True, "totalSubscribers": len(db["newsletterSubscribers"])}, dev_cookies)

        return self._send_json(404, {"error": "Endpoint not found"}, dev_cookies)


if __name__ == "__main__":
    print(f"Tanzania Biashara Festival (Python Server) running at http://localhost:{PORT}")
    HTTPServer(("0.0.0.0", PORT), TBFHandler).serve_forever()
