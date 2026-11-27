<?php
/**
 * Tanzania Biashara Festival (TBF) - cPanel Apache <-> Node.js, JSON DB & Selcom Payment Gateway Bridge
 * 1. Proxies /api/* to Node.js server.js when listening on 127.0.0.1:3000
 * 2. Provides full native PHP execution against data/db.json + Official Selcom Checkout & USSD Push API
 *    so Booking, Holds, Lookup, Admin, and Selcom Payments work 100% on cPanel even without Node.js daemon.
 */
error_reporting(0);
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate');

$route = isset($_GET['route']) ? trim($_GET['route'], '/') : '';
$method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper($_SERVER['REQUEST_METHOD']) : 'GET';
$rawBody = file_get_contents('php://input');
$clientIp = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'))[0]);
$userAgent = trim($_SERVER['HTTP_USER_AGENT'] ?? '');

// Anti-Bot Shield: Block vulnerability scanners and headless form-stuffing bots
if ($route !== 'webhooks/selcom') {
    if (preg_match('/(sqlmap|nikto|nmap|masscan|zgrab|gobuster|dirbuster|nuclei|acunetix|nessus|wfuzz|havij|libwww-perl)/i', $userAgent)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('success' => false, 'error' => 'Automated security scanner blocked.'));
        exit;
    }
    if ($method !== 'GET' && $method !== 'HEAD' && ($userAgent === '' || preg_match('/(python-requests|python-urllib|go-http-client|scrapy|phantomjs|headlesschrome|pycurl)/i', $userAgent))) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('success' => false, 'error' => 'Automated bot mutation traffic is not permitted.'));
        exit;
    }
}

function checkIpRateLimitPhp($bucketPrefix, $maxHits, $windowSec) {
    global $clientIp;
    $dir = sys_get_temp_dir() . '/tbf_rl';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $key = md5($bucketPrefix . ':' . $clientIp);
    $file = $dir . '/' . $key . '.json';
    $now = time();
    $entry = array('count' => 0, 'resetAt' => $now + $windowSec);
    if (file_exists($file)) {
        $parsed = json_decode(@file_get_contents($file), true);
        if (is_array($parsed) && isset($parsed['resetAt']) && $parsed['resetAt'] > $now) {
            $entry = $parsed;
        }
    }
    if ($entry['count'] >= $maxHits) {
        http_response_code(429);
        header('Content-Type: application/json; charset=utf-8');
        $wait = max(1, $entry['resetAt'] - $now);
        echo json_encode(array('success' => false, 'retryAfterSec' => $wait, 'error' => "Too many requests from your IP. Please wait {$wait}s."));
        exit;
    }
    $entry['count'] = ((int)$entry['count']) + 1;
    @file_put_contents($file, json_encode($entry), LOCK_EX);
}

function rejectIfHoneypotPhp($payload) {
    if (!is_array($payload)) return;
    if (!empty($payload['website_url']) || !empty($payload['fax_number']) || !empty($payload['_hp_trap'])) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('success' => false, 'error' => 'Automated bot submission rejected.'));
        exit;
    }
}

function b64UrlEncodePhp($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function b64UrlDecodePhp($data) {
    $pad = strlen($data) % 4;
    if ($pad) $data .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($data, '-_', '+/'), true);
}

function getHmacSecretPhp() {
    $envSecret = trim(getEnvVar('TBF_SESSION_SECRET', ''));
    if (strlen($envSecret) >= 32) return $envSecret;
    $paths = array(
        __DIR__ . '/data/.auth_secret',
        dirname(__DIR__) . '/data/.auth_secret',
        '/home/reliancetech/www.biasharafestival.co.tz/data/.auth_secret',
        '/home/reliancetech/biasharafestival.co.tz/data/.auth_secret',
        '/home/reliancetech/data/.auth_secret'
    );
    foreach ($paths as $p) {
        if (file_exists($p) && is_readable($p)) {
            $val = trim((string)@file_get_contents($p));
            if (strlen($val) >= 32) return $val;
        }
    }
    $targetDir = __DIR__ . '/data';
    if (!is_dir($targetDir)) @mkdir($targetDir, 0700, true);
    $secretFile = $targetDir . '/.auth_secret';
    $created = bin2hex(random_bytes(32));
    @file_put_contents($secretFile, $created, LOCK_EX);
    @chmod($secretFile, 0600);
    return $created;
}

function getAuthSigningKeyPhp() {
    static $key = null;
    if ($key === null) {
        $key = hash_hmac('sha256', 'tbf:auth-signing:v2', getHmacSecretPhp(), true);
    }
    return $key;
}

function getUaFamilyPhp() {
    global $userAgent;
    $norm = preg_replace('/[\d.]+/', 'x', $userAgent ?: 'unknown');
    return substr(hash('sha256', $norm), 0, 16);
}

function getOrCreateDeviceIdPhp() {
    $existing = trim((string)($_COOKIE['tbf_device_id'] ?? ''));
    if ($existing !== '' && preg_match('/^[a-zA-Z0-9_-]{12,64}$/', $existing)) {
        return $existing;
    }
    return bin2hex(random_bytes(16));
}

function signPayloadPhp($obj, $ttlMs) {
    $obj['exp'] = round(microtime(true) * 1000) + $ttlMs;
    $encoded = b64UrlEncodePhp(json_encode($obj));
    $sig = b64UrlEncodePhp(hash_hmac('sha256', $encoded, getAuthSigningKeyPhp(), true));
    return $encoded . '.' . $sig;
}

function verifySignedTokenPhp($token) {
    if (!is_string($token) || strpos($token, '.') === false) return null;
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') return null;
    $expected = b64UrlEncodePhp(hash_hmac('sha256', $parts[0], getAuthSigningKeyPhp(), true));
    if (!hash_equals($expected, $parts[1])) return null;
    $raw = b64UrlDecodePhp($parts[0]);
    if ($raw === false) return null;
    $parsed = json_decode($raw, true);
    if (!is_array($parsed) || !isset($parsed['exp']) || (float)$parsed['exp'] < (microtime(true) * 1000)) {
        return null;
    }
    return $parsed;
}

function signBotFormTokenPhp() {
    return signPayloadPhp(array('role' => 'bot_form', 'iatMs' => round(microtime(true) * 1000)), 6 * 3600 * 1000);
}

function rejectUnlessValidBotTokenPhp($payload, $minAgeMs = 700) {
    $token = is_array($payload) ? trim((string)($payload['_tbfBotToken'] ?? '')) : '';
    $claims = verifySignedTokenPhp($token);
    $ok = is_array($claims) && (($claims['role'] ?? '') === 'bot_form') && isset($claims['iatMs'])
        && ((round(microtime(true) * 1000) - (float)$claims['iatMs']) >= $minAgeMs);
    if (!$ok) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('success' => false, 'error' => 'Automated bot submission rejected. Please refresh the page and submit normally.'));
        exit;
    }
}

function verifyAdminRequestPhp() {
    $token = $_COOKIE['tbf_admin_session'] ?? '';
    $session = verifySignedTokenPhp($token);
    if (!is_array($session) || ($session['role'] ?? '') !== 'admin' || empty($session['jti'])) return null;
    if (($session['uaFamily'] ?? '') !== getUaFamilyPhp()) return null;
    $cookieDev = trim((string)($_COOKIE['tbf_device_id'] ?? ''));
    if ($cookieDev === '' || ($session['deviceId'] ?? '') !== $cookieDev) return null;
    return $session;
}

function requireAdminAuthPhp() {
    $session = verifyAdminRequestPhp();
    if (!$session) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'error' => 'Admin authentication required'));
        exit;
    }
    return $session;
}

function loadEnvPhp() {
    $envCandidates = array(
        __DIR__ . '/.env',
        dirname(__DIR__) . '/.env',
        '/home/reliancetech/www.biasharafestival.co.tz/.env',
        '/home/reliancetech/biasharafestival.co.tz/.env',
        '/home/reliancetech/public_html/.env',
        '/home/reliancetech/.env'
    );
    $vars = array();
    foreach ($envCandidates as $file) {
        if (file_exists($file) && is_readable($file)) {
            $lines = @file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if (is_array($lines)) {
                foreach ($lines as $line) {
                    $trimmed = trim($line);
                    if ($trimmed === '' || $trimmed[0] === '#') continue;
                    $pos = strpos($trimmed, '=');
                    if ($pos === false || $pos <= 0) continue;
                    $k = trim(substr($trimmed, 0, $pos));
                    $v = trim(substr($trimmed, $pos + 1));
                    if ((strlen($v) >= 2) && (($v[0] === '"' && substr($v, -1) === '"') || ($v[0] === "'" && substr($v, -1) === "'"))) {
                        $v = substr($v, 1, -1);
                    }
                    if ($k !== '' && (!isset($vars[$k]) || $vars[$k] === '')) {
                        $vars[$k] = $v;
                    }
                }
            }
        }
    }
    return $vars;
}

$ENV_VARS = loadEnvPhp();
function getEnvVar($key, $default = '') {
    global $ENV_VARS;
    if (isset($ENV_VARS[$key]) && $ENV_VARS[$key] !== '') return $ENV_VARS[$key];
    $g = getenv($key);
    if ($g !== false && $g !== '') return $g;
    return $default;
}

function getSelcomConfigPhp() {
    $vendorId = trim(getEnvVar('SELCOM_VENDOR_ID', getEnvVar('SELCOM_VENDOR', '')));
    $apiKey = trim(getEnvVar('SELCOM_API_KEY', ''));
    $apiSecret = trim(getEnvVar('SELCOM_API_SECRET', ''));
    $rawBase = rtrim(trim(getEnvVar('SELCOM_BASE_URL', 'https://apigw.selcommobile.com')), '/');
    $baseUrl = preg_replace('/\/v1$/i', '', $rawBase);
    $publicUrl = rtrim(trim(getEnvVar('SELCOM_PUBLIC_URL', 'https://biasharafestival.co.tz')), '/');
    $webhookUrl = trim(getEnvVar('SELCOM_WEBHOOK_URL', $publicUrl . '/api/webhooks/selcom'));
    return array(
        'vendorId' => $vendorId,
        'apiKey' => $apiKey,
        'apiSecret' => $apiSecret,
        'baseUrl' => $baseUrl,
        'publicUrl' => $publicUrl,
        'webhookUrl' => $webhookUrl,
        'configured' => ($vendorId !== '' && $apiKey !== '' && $apiSecret !== '')
    );
}

function getOfficialMailFromPhp() {
    return trim(getEnvVar('TBF_MAIL_FROM', 'info@biasharafestival.co.tz')) ?: 'info@biasharafestival.co.tz';
}

function sendFestivalEmailPhp($toEmail, $subject, $htmlBody) {
    $to = trim(str_replace(array("\r", "\n", "<", ">"), '', (string)$toEmail));
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
    $fromEmail = getOfficialMailFromPhp();
    $fromName = trim(getEnvVar('TBF_MAIL_NAME', 'Tanzania Biashara Festival'));
    $cleanSubject = trim(str_replace(array("\r", "\n"), ' ', (string)$subject));
    $headers = array(
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        "From: {$fromName} <{$fromEmail}>",
        "Reply-To: {$fromEmail}",
        'X-Mailer: TBF-Platform/1.0'
    );
    return @mail($to, $cleanSubject, (string)$htmlBody, implode("\r\n", $headers), "-f{$fromEmail}");
}

function buildBrandedNewsletterHtmlPhp($title, $bodyHtml) {
    $fromEmail = htmlspecialchars(getOfficialMailFromPhp(), ENT_QUOTES, 'UTF-8');
    $safeTitle = htmlspecialchars((string)$title, ENT_QUOTES, 'UTF-8');
    return '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">'
        . '<div style="background:#0b6b68;color:#ffffff;padding:24px 28px;"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a7f3d0;font-weight:bold;">TANZANIA BIASHARA FESTIVAL (TBF)</div>'
        . '<h2 style="margin:8px 0 0;font-size:20px;line-height:1.3;">' . $safeTitle . '</h2></div>'
        . '<div style="padding:24px 28px;color:#1e293b;font-size:14px;line-height:1.65;">' . $bodyHtml . '</div>'
        . '<div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">'
        . '<strong>Tanzania Biashara Festival Secretariat</strong> &bull; <a href="https://biasharafestival.co.tz" style="color:#0b6b68;font-weight:bold;">biasharafestival.co.tz</a> &bull; Tel: +255 767 053 250 &bull; ' . $fromEmail
        . '</div></div>';
}

function normalizeTzMsisdnPhp($phone) {
    $digits = preg_replace('/\D+/', '', (string)$phone);
    if (strpos($digits, '255') === 0 && strlen($digits) === 12) return $digits;
    if (strpos($digits, '0') === 0 && strlen($digits) === 10) return '255' . substr($digits, 1);
    if (strlen($digits) === 9) return '255' . $digits;
    return $digits;
}

function selcomApiCallPhp($method, $endpointPath, $payloadObj = array()) {
    $cfg = getSelcomConfigPhp();
    if (!$cfg['configured']) {
        return array('ok' => false, 'configured' => false, 'error' => 'Selcom API credentials not yet configured in .env');
    }
    if (!function_exists('curl_init')) {
        return array('ok' => false, 'configured' => true, 'error' => 'PHP cURL extension required for Selcom API');
    }
    $timestamp = gmdate('Y-m-d\TH:i:s\Z');
    $keys = array_keys($payloadObj);
    $signedFields = implode(',', $keys);
    $parts = array('timestamp=' . $timestamp);
    foreach ($keys as $k) {
        $parts[] = $k . '=' . (string)($payloadObj[$k] ?? '');
    }
    $signString = implode('&', $parts);
    $digest = base64_encode(hash_hmac('sha256', $signString, $cfg['apiSecret'], true));
    $authToken = base64_encode($cfg['apiKey']);

    $url = $cfg['baseUrl'] . $endpointPath;
    if ($method === 'GET' && !empty($payloadObj)) {
        $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($payloadObj);
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $headers = array(
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: SELCOM ' . $authToken,
        'Digest-Method: HS256',
        'Digest: ' . $digest,
        'Timestamp: ' . $timestamp,
        'Signed-Fields: ' . $signedFields
    );
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payloadObj));
    }
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        return array('ok' => false, 'configured' => true, 'error' => $err ?: 'Selcom network error');
    }
    $json = json_decode($raw, true);
    if (!is_array($json)) $json = array();
    $isOk = ($status >= 200 && $status < 300) && (($json['resultcode'] ?? '') === '000' || ($json['result'] ?? '') === 'SUCCESS');
    return array('ok' => $isOk, 'configured' => true, 'status' => $status, 'data' => $json);
}

function createSelcomOrderAndPushPhp($orderId, $amount, $buyerName, $buyerEmail, $buyerPhone, $boothCode, $cities, $paymentMethod, $triggerPush = true) {
    $cfg = getSelcomConfigPhp();
    if (!$cfg['configured']) {
        return array('configured' => false, 'orderCreated' => false, 'pushSent' => false);
    }
    $msisdn = normalizeTzMsisdnPhp($buyerPhone);
    $citiesStr = is_array($cities) ? implode(', ', $cities) : (string)$cities;
    $orderPayload = array(
        'vendor' => $cfg['vendorId'],
        'order_id' => (string)$orderId,
        'buyer_email' => (string)($buyerEmail ?: 'info@biasharafestival.co.tz'),
        'buyer_name' => (string)($buyerName ?: 'TBF Exhibitor'),
        'buyer_phone' => $msisdn,
        'amount' => max(100, (int)round((float)$amount)),
        'currency' => 'TZS',
        'buyer_remarks' => substr("TBF Booth #$boothCode ($citiesStr)", 0, 96),
        'merchant_remarks' => substr("TBF Booth $orderId", 0, 96),
        'no_of_items' => 1,
        'webhook' => base64_encode($cfg['webhookUrl'])
    );

    $orderRes = selcomApiCallPhp('POST', '/v1/checkout/create-order-minimal', $orderPayload);
    if (!$orderRes['ok']) {
        return array(
            'configured' => true,
            'orderCreated' => false,
            'pushSent' => false,
            'error' => $orderRes['data']['message'] ?? ($orderRes['error'] ?? 'Selcom order creation failed')
        );
    }

    $row = (isset($orderRes['data']['data'][0]) && is_array($orderRes['data']['data'][0])) ? $orderRes['data']['data'][0] : array();
    $reference = (string)($orderRes['data']['reference'] ?? ($row['reference'] ?? ''));
    $paymentToken = (string)($row['payment_token'] ?? ($row['control_number'] ?? $reference));
    $gatewayUrl = '';
    if (!empty($row['payment_gateway_url'])) {
        $decoded = @base64_decode((string)$row['payment_gateway_url'], true);
        if ($decoded && preg_match('/^https?:\/\//i', $decoded)) {
            $gatewayUrl = $decoded;
        } else {
            $gatewayUrl = (string)$row['payment_gateway_url'];
        }
    }

    $pushSent = false;
    $pushMessage = '';
    $transId = '';
    $isMobileMoney = !preg_match('/card|visa|mastercard|bank|crdb|nmb/i', (string)$paymentMethod);
    if ($triggerPush && $isMobileMoney && preg_match('/^255[67]\d{8}$/', $msisdn)) {
        $transId = 'TBF' . substr((string)time(), -7) . mt_rand(100, 999);
        $pushRes = selcomApiCallPhp('POST', '/v1/checkout/wallet-payment', array(
            'transid' => $transId,
            'order_id' => (string)$orderId,
            'msisdn' => $msisdn
        ));
        $pushSent = !empty($pushRes['ok']);
        $pushMessage = $pushRes['data']['message'] ?? ($pushSent ? 'USSD Push prompt sent to mobile phone' : ($pushRes['error'] ?? ''));
    }

    return array(
        'configured' => true,
        'orderCreated' => true,
        'reference' => $reference,
        'controlNumber' => $paymentToken ?: $reference,
        'gatewayUrl' => $gatewayUrl,
        'pushSent' => $pushSent,
        'pushMessage' => $pushMessage,
        'transId' => $transId
    );
}

function querySelcomOrderStatusPhp($orderId) {
    $cfg = getSelcomConfigPhp();
    if (!$cfg['configured'] || !$orderId) return array('configured' => $cfg['configured'], 'paid' => false, 'outcome' => 'PENDING', 'paymentStatus' => 'PENDING', 'gatewayMessage' => '');
    $res = selcomApiCallPhp('GET', '/v1/checkout/order-status', array('order_id' => (string)$orderId));
    $row = (isset($res['data']['data'][0]) && is_array($res['data']['data'][0])) ? $res['data']['data'][0] : array();
    $st = strtoupper((string)($row['payment_status'] ?? ($res['data']['payment_status'] ?? '')));
    $gwMsg = trim((string)($row['message'] ?? ($res['data']['message'] ?? ($row['result'] ?? ($res['data']['result'] ?? '')))));
    $combined = $st . ' ' . $gwMsg;
    if (empty($res['ok'])) {
        $outcome = 'PENDING';
        if (preg_match('/(insufficient|low\s*balance|not\s*enough\s*fund|salio)/i', $combined)) $outcome = 'INSUFFICIENT_FUNDS';
        elseif (preg_match('/(user_cancelled|cancelled|canceled|abort|rejected\s*by\s*user)/i', $combined)) $outcome = 'CANCELLED';
        return array('configured' => true, 'paid' => false, 'outcome' => $outcome, 'paymentStatus' => $st ?: 'PENDING', 'gatewayMessage' => $gwMsg);
    }
    $isPaid = ($st === 'COMPLETED' || $st === 'PAID' || $st === 'SUCCESSFUL');
    $outcome = 'PENDING';
    if ($isPaid) {
        $outcome = 'PAID';
    } elseif ($st === 'INSUFFICIENT_FUNDS' || $st === 'INSUFFICIENT_BALANCE' || preg_match('/(insufficient|low\s*balance|not\s*enough\s*fund|salio)/i', $combined)) {
        $outcome = 'INSUFFICIENT_FUNDS';
    } elseif ($st === 'CANCELLED' || $st === 'CANCELED' || $st === 'USER_CANCELLED' || $st === 'ABORTED' || preg_match('/(user_cancelled|cancelled|canceled|abort|rejected\s*by\s*user)/i', $combined)) {
        $outcome = 'CANCELLED';
    } elseif ($st === 'FAILED' || $st === 'DECLINED' || $st === 'REJECTED' || $st === 'EXPIRED' || $st === 'TIMEOUT') {
        $outcome = 'FAILED';
    }
    return array(
        'configured' => true,
        'paid' => $isPaid,
        'outcome' => $outcome,
        'paymentStatus' => $st ?: 'PENDING',
        'gatewayMessage' => $gwMsg,
        'reference' => (string)($row['reference'] ?? ($res['data']['reference'] ?? '')),
        'transId' => (string)($row['transid'] ?? '')
    );
}

function isNodeListening($port = 3000) {
    $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.25);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

function tryStartNodeServer() {
    if (isNodeListening(3000)) return true;
    if (!function_exists('exec')) return false;
    $candidates = array(
        __DIR__ . '/server.js',
        dirname(__DIR__) . '/server.js',
        '/home/reliancetech/server.js',
        '/home/reliancetech/www.biasharafestival.co.tz/server.js',
        '/home/reliancetech/biasharafestival.co.tz/server.js'
    );
    $serverJs = '';
    foreach ($candidates as $c) {
        if (file_exists($c)) { $serverJs = $c; break; }
    }
    if (!$serverJs) return false;
    $workDir = dirname($serverJs);
    $nodePaths = array_merge(
        glob('/opt/cpanel/ea-nodejs*/bin/node') ?: array(),
        glob('/home/reliancetech/nodevenv/*/*/bin/node') ?: array(),
        array('/usr/local/bin/node', '/usr/bin/node', 'node')
    );
    foreach ($nodePaths as $nb) {
        if ($nb === 'node' || is_executable($nb)) {
            @exec("cd " . escapeshellarg($workDir) . " && nohup " . escapeshellarg($nb) . " " . escapeshellarg($serverJs) . " >/dev/null 2>&1 &");
            usleep(600000);
            if (isNodeListening(3000)) return true;
        }
    }
    return isNodeListening(3000);
}

// 1. Proxy to Node.js server.js if available
if (tryStartNodeServer() && function_exists('curl_init')) {
    $qs = $_SERVER['QUERY_STRING'] ?? '';
    $qsClean = preg_replace('/(^|&)route=[^&]*/', '', $qs);
    $qsClean = ltrim($qsClean, '&');
    $targetUrl = 'http://127.0.0.1:3000/api/' . $route . ($qsClean ? ('?' . $qsClean) : '');

    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 16);

    $reqHeaders = array(
        'Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'application/json'),
        'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? 'biasharafestival.co.tz'),
        'X-Forwarded-Proto: ' . ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http'),
        'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1')
    );
    if (!empty($_SERVER['HTTP_ORIGIN'])) $reqHeaders[] = 'Origin: ' . $_SERVER['HTTP_ORIGIN'];
    if (!empty($_SERVER['HTTP_COOKIE'])) $reqHeaders[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
    if (!empty($_SERVER['HTTP_USER_AGENT'])) $reqHeaders[] = 'User-Agent: ' . $_SERVER['HTTP_USER_AGENT'];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);

    if ($method !== 'GET' && $method !== 'HEAD') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $rawBody);
    }

    $resp = curl_exec($ch);
    if ($resp !== false) {
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $hdrSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $rawHdrs = substr($resp, 0, $hdrSize);
        $body = substr($resp, $hdrSize);
        curl_close($ch);

        http_response_code($status ?: 200);
        foreach (explode("\r\n", $rawHdrs) as $line) {
            if (stripos($line, 'Set-Cookie:') === 0 || stripos($line, 'Content-Type:') === 0) {
                header($line, false);
            }
        }
        echo $body;
        exit;
    }
    curl_close($ch);
}

// 2. Native PHP Execution against data/db.json + Selcom Payment Gateway
header('Content-Type: application/json; charset=utf-8');

function locateDbJson() {
    $paths = array(
        __DIR__ . '/data/db.json',
        dirname(__DIR__) . '/data/db.json',
        '/home/reliancetech/www.biasharafestival.co.tz/data/db.json',
        '/home/reliancetech/biasharafestival.co.tz/data/db.json',
        '/home/reliancetech/data/db.json'
    );
    foreach ($paths as $p) {
        if (file_exists($p)) return $p;
    }
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    return $dir . '/db.json';
}

$DB_LOCK_FP = null;
function acquireDbLockPhp() {
    global $DB_LOCK_FP;
    if ($DB_LOCK_FP) return;
    $lockPath = dirname(locateDbJson()) . '/.db.lock';
    if (!is_dir(dirname($lockPath))) @mkdir(dirname($lockPath), 0755, true);
    $fp = @fopen($lockPath, 'c+');
    if ($fp) {
        @flock($fp, LOCK_EX);
        $DB_LOCK_FP = $fp;
        register_shutdown_function(function () use (&$DB_LOCK_FP) {
            if ($DB_LOCK_FP) {
                @flock($DB_LOCK_FP, LOCK_UN);
                @fclose($DB_LOCK_FP);
                $DB_LOCK_FP = null;
            }
        });
    }
}

function getMysqlPdoPhp() {
    static $pdo = null;
    static $attempted = false;
    if ($attempted) return $pdo;
    $attempted = true;
    $dbType = strtolower(trim(getEnvVar('DB_TYPE', '')));
    $dbHost = trim(getEnvVar('DB_HOST', 'localhost'));
    $dbName = trim(getEnvVar('DB_NAME', ''));
    $dbUser = trim(getEnvVar('DB_USER', ''));
    $dbPass = getEnvVar('DB_PASS', '');
    $dbPort = (int)getEnvVar('DB_PORT', '3306') ?: 3306;
    if ($dbType !== 'mysql' || $dbName === '' || $dbUser === '' || !class_exists('PDO')) {
        return null;
    }
    try {
        $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
        $pdo = new PDO($dsn, $dbUser, $dbPass, array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 4
        ));
        $pdo->exec("CREATE TABLE IF NOT EXISTS `tbf_state_store` (
            `state_key` VARCHAR(64) NOT NULL PRIMARY KEY,
            `state_json` LONGTEXT NOT NULL,
            `version` BIGINT UNSIGNED NOT NULL DEFAULT 1,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        return $pdo;
    } catch (Exception $e) {
        error_log('[TBF PHP DB] MySQL connection error: ' . $e->getMessage());
        $pdo = null;
        return null;
    }
}

function readDbPhp() {
    $pdo = getMysqlPdoPhp();
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT `state_json` FROM `tbf_state_store` WHERE `state_key` = 'primary' LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch();
            if ($row && !empty($row['state_json'])) {
                $data = json_decode($row['state_json'], true);
                if (is_array($data)) {
                    if (!isset($data['bookings']) || !is_array($data['bookings'])) $data['bookings'] = array();
                    if (!isset($data['boothHolds']) || !is_array($data['boothHolds'])) $data['boothHolds'] = array();
                    if (!isset($data['regions']) || !is_array($data['regions'])) $data['regions'] = array();
                    return $data;
                }
            } else {
                // Auto-seed MySQL from db.json on first connection
                $path = locateDbJson();
                if (file_exists($path)) {
                    $raw = @file_get_contents($path);
                    if ($raw) {
                        $ins = $pdo->prepare("INSERT IGNORE INTO `tbf_state_store` (`state_key`, `state_json`, `version`) VALUES ('primary', ?, 1)");
                        $ins->execute(array($raw));
                        $data = json_decode($raw, true);
                        if (is_array($data)) return $data;
                    }
                }
            }
        } catch (Exception $e) {
            error_log('[TBF PHP DB] MySQL read error: ' . $e->getMessage());
        }
    }
    $path = locateDbJson();
    if (!file_exists($path)) {
        return array('regions' => array(), 'boothPackages' => array(), 'bookings' => array(), 'sponsors' => array(), 'announcements' => array(), 'boothHolds' => array());
    }
    $data = json_decode(@file_get_contents($path), true);
    if (!is_array($data)) $data = array();
    if (!isset($data['bookings']) || !is_array($data['bookings'])) $data['bookings'] = array();
    if (!isset($data['boothHolds']) || !is_array($data['boothHolds'])) $data['boothHolds'] = array();
    if (!isset($data['regions']) || !is_array($data['regions'])) $data['regions'] = array();
    return $data;
}

function writeDbPhp($db) {
    $json = json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $pdo = getMysqlPdoPhp();
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("INSERT INTO `tbf_state_store` (`state_key`, `state_json`, `version`) VALUES ('primary', ?, 1) ON DUPLICATE KEY UPDATE `state_json` = VALUES(`state_json`), `version` = `version` + 1");
            $stmt->execute(array($json));
        } catch (Exception $e) {
            error_log('[TBF PHP DB] MySQL read error: ' . $e->getMessage());
        }

        // Separate try/catch so relational table sync can never interrupt primary state store
        try {
            if (isset($db['bookings']) && is_array($db['bookings'])) {
                $bStmt = $pdo->prepare("INSERT INTO `bookings` (`id`, `control_number_enc`, `business_name`, `tagline`, `contact_person_enc`, `phone_enc`, `phone_idx`, `email_enc`, `email_idx`, `sector`, `package_id`, `package_name`, `booth_code`, `cities`, `total_amount`, `payment_method`, `status`, `featured`, `access_pin_hash`, `client_request_id`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE `booth_code` = VALUES(`booth_code`), `status` = VALUES(`status`), `control_number_enc` = VALUES(`control_number_enc`), `total_amount` = VALUES(`total_amount`)");
                foreach (array_slice($db['bookings'], 0, 50) as $b) {
                    $stLower = strtolower(trim($b['status'] ?? ''));
                    $normStatus = ($stLower === 'paid' || $stLower === 'confirmed') ? 'Confirmed' : (($stLower === 'cancelled') ? 'Cancelled' : (($stLower === 'expired') ? 'Expired' : 'Awaiting Payment'));
                    $bStmt->execute(array(
                        (string)($b['id'] ?? ''),
                        (string)($b['controlNumber'] ?? ''),
                        substr((string)($b['businessName'] ?? ''), 0, 180),
                        substr((string)($b['tagline'] ?? ''), 0, 255),
                        (string)($b['contactPerson'] ?? ''),
                        (string)($b['phone'] ?? ''),
                        (string)($b['phoneIdx'] ?? ''),
                        (string)($b['email'] ?? ''),
                        (string)($b['emailIdx'] ?? ''),
                        substr((string)($b['sector'] ?? 'Biashara'), 0, 120),
                        substr((string)($b['packageId'] ?? 'standard-booth'), 0, 64),
                        substr((string)($b['packageName'] ?? 'Standard Booth'), 0, 120),
                        substr((string)($b['boothCode'] ?? 'B-01'), 0, 32),
                        json_encode($b['cities'] ?? array()),
                        max(0, (int)($b['totalAmount'] ?? 0)),
                        substr((string)($b['paymentMethod'] ?? 'Selcom Pay'), 0, 64),
                        $normStatus,
                        1,
                        $b['accessPinHash'] ?? ($b['accessPin'] ?? null),
                        !empty($b['clientRequestId']) ? $b['clientRequestId'] : null
                    ));
                }
            }
        } catch (Exception $e) {
            error_log('[TBF PHP DB] MySQL read error: ' . $e->getMessage());
        }
    }
    $targets = array(
        __DIR__ . '/data/db.json',
        dirname(__DIR__) . '/data/db.json',
        '/home/reliancetech/www.biasharafestival.co.tz/data/db.json',
        '/home/reliancetech/biasharafestival.co.tz/data/db.json',
        '/home/reliancetech/data/db.json'
    );
    foreach ($targets as $t) {
        $d = dirname($t);
        if (is_dir($d) || @mkdir($d, 0755, true)) {
            $tmp = $d . '/.db.tmp.' . getmypid() . '.' . mt_rand(100, 999);
            if (@file_put_contents($tmp, $json, LOCK_EX) !== false) {
                @chmod($tmp, 0600);
                @rename($tmp, $t);
            }
        }
    }
}

function pruneExpiredPhp(&$db) {
    $nowMs = round(microtime(true) * 1000);
    $nowSec = time();
    $changed = false;
    $validHolds = array();
    foreach ($db['boothHolds'] as $h) {
        if ((float)($h['expiresAt'] ?? 0) > $nowMs) {
            $validHolds[] = $h;
        } else {
            $changed = true;
        }
    }
    $db['boothHolds'] = $validHolds;
    foreach ($db['bookings'] as &$b) {
        $st = strtolower(trim($b['status'] ?? ''));
        if ($st === 'awaiting payment' && !empty($b['paymentExpiresAt'])) {
            $expTs = strtotime((string)$b['paymentExpiresAt']);
            if ($expTs !== false && $expTs <= $nowSec) {
                $b['status'] = 'Expired';
                $changed = true;
                $oldCode = strtoupper((string)($b['boothCode'] ?? ''));
                foreach (($b['cities'] ?? array()) as $cityName) {
                    $stillUsed = false;
                    foreach ($db['bookings'] as $other) {
                        $ost = strtolower(trim($other['status'] ?? ''));
                        if ($ost !== 'cancelled' && $ost !== 'expired' && strtoupper((string)($other['boothCode'] ?? '')) === $oldCode && in_array($cityName, $other['cities'] ?? array(), true)) {
                            $stillUsed = true;
                            break;
                        }
                    }
                    if (!$stillUsed && is_array($db['regions'] ?? null)) {
                        foreach ($db['regions'] as &$reg) {
                            if (($reg['name'] ?? '') === $cityName && is_array($reg['bookedCodes'] ?? null)) {
                                $reg['bookedCodes'] = array_values(array_diff($reg['bookedCodes'], array($oldCode)));
                                $reg['bookedBooths'] = count($reg['bookedCodes']);
                            }
                        }
                        unset($reg);
                    }
                }
            }
        }
    }
    unset($b);
    return $changed;
}

function buildLiveStatsPhp($db) {
    $bookingsCount = 0;
    if (isset($db['bookings']) && is_array($db['bookings'])) {
        foreach ($db['bookings'] as $b) {
            $st = strtolower(trim($b['status'] ?? ''));
            if ($st !== 'cancelled' && $st !== 'expired') $bookingsCount++;
        }
    }
    $sponsorsCount = isset($db['sponsors']) && is_array($db['sponsors']) ? count($db['sponsors']) : 0;
    $regAttendees = 0;
    if (isset($db['regions']) && is_array($db['regions'])) {
        foreach ($db['regions'] as $r) {
            $regAttendees += (int)($r['registeredAttendees'] ?? 0);
        }
    }
    $visitors = max(185, (int)($db['analytics']['totalCookieVisitors'] ?? ($db['analytics']['totalUniqueVisitors'] ?? 185)));
    $attendees = max(240, $regAttendees, (int)($db['analytics']['totalRegisteredAttendees'] ?? 240));
    $investors = max(1, $sponsorsCount + 1, (int)($db['analytics']['totalPartnersAndInvestors'] ?? 2));
    $cfg = getSelcomConfigPhp();
    return array(
        'liveOnlineCount' => 1,
        'totalCookieVisitors' => $visitors,
        'totalRegisteredAttendees' => $attendees,
        'totalPartnersAndInvestors' => $investors,
        'totalBusinessesShowcased' => $bookingsCount,
        'selcomConfigured' => $cfg['configured'],
        'storageEngine' => getMysqlPdoPhp() ? 'mysql' : 'json'
    );
}

function sanitizePublicDbPhp($db) {
    $nowMs = round(microtime(true) * 1000);
    $publicBookings = array();
    foreach (($db['bookings'] ?? array()) as $b) {
        $st = strtolower(trim($b['status'] ?? ''));
        if ($st === 'cancelled' || $st === 'expired') continue;
        $publicBookings[] = array(
            'id' => $b['id'] ?? '',
            'businessName' => $b['businessName'] ?? '',
            'tagline' => $b['tagline'] ?? '',
            'sector' => $b['sector'] ?? '',
            'packageId' => $b['packageId'] ?? '',
            'packageName' => $b['packageName'] ?? '',
            'boothCode' => $b['boothCode'] ?? '',
            'cities' => $b['cities'] ?? array(),
            'status' => $b['status'] ?? 'Awaiting Payment',
            'featured' => true
        );
    }
    $activeHolds = array();
    foreach (($db['boothHolds'] ?? array()) as $h) {
        if ((float)($h['expiresAt'] ?? 0) > $nowMs) {
            $activeHolds[] = array(
                'boothCode' => $h['boothCode'],
                'cities' => $h['cities'] ?? array(),
                'expiresAt' => $h['expiresAt']
            );
        }
    }
    $cfg = getSelcomConfigPhp();
    return array(
        'festivalName' => $db['festivalName'] ?? 'Tanzania Biashara Festival (TBF)',
        'motto' => $db['motto'] ?? 'Every business has a place, every city has an opportunity',
        'destination' => $db['destination'] ?? null,
        'regions' => $db['regions'] ?? array(),
        'boothPackages' => $db['boothPackages'] ?? array(),
        'bookings' => $publicBookings,
        'activeHolds' => $activeHolds,
        'announcements' => $db['announcements'] ?? array(),
        'liveStats' => buildLiveStatsPhp($db),
        'selcomConfigured' => $cfg['configured']
    );
}

function findBoothConflictPhp($db, $boothCode, $cities, $excludeHoldToken = '', $excludeBookingId = '') {
    $nowMs = round(microtime(true) * 1000);
    foreach (($db['bookings'] ?? array()) as $b) {
        if ($excludeBookingId !== '' && ($b['id'] ?? '') === $excludeBookingId) continue;
        $st = strtolower(trim($b['status'] ?? ''));
        if ($st === 'cancelled' || $st === 'expired') continue;
        if (strtoupper($b['boothCode'] ?? '') === $boothCode && is_array($b['cities'] ?? null)) {
            foreach ($b['cities'] as $c) {
                if (in_array($c, $cities, true)) return array('type' => 'BOOKED', 'ref' => $b['id']);
            }
        }
    }
    foreach (($db['boothHolds'] ?? array()) as $h) {
        if ((float)($h['expiresAt'] ?? 0) <= $nowMs) continue;
        if ($excludeHoldToken !== '' && ($h['holdToken'] ?? '') === $excludeHoldToken) continue;
        if (strtoupper($h['boothCode'] ?? '') === $boothCode && is_array($h['cities'] ?? null)) {
            foreach ($h['cities'] as $c) {
                if (in_array($c, $cities, true)) return array('type' => 'HELD', 'expiresAt' => $h['expiresAt']);
            }
        }
    }
    return null;
}

function normalizePhoneTailPhp($phone) {
    $d = preg_replace('/\D+/', '', (string)$phone);
    return strlen($d) >= 9 ? substr($d, -9) : $d;
}

function formatBookingReceiptPhp($b, $unmasked = true, $manageToken = '') {
    $cfg = getSelcomConfigPhp();
    $ctrl = (string)($b['controlNumber'] ?? '-');
    $phone = (string)($b['phone'] ?? '-');
    $email = (string)($b['email'] ?? '-');
    $contact = (string)($b['contactPerson'] ?? '-');
    return array(
        'id' => $b['id'] ?? '',
        'controlNumber' => $unmasked ? $ctrl : ('***' . substr($ctrl, -4)),
        'selcomReference' => $b['selcomReference'] ?? null,
        'selcomGatewayUrl' => $unmasked ? ($b['selcomGatewayUrl'] ?? null) : null,
        'selcomPushSent' => !empty($b['selcomPushSent']),
        'selcomConfigured' => $cfg['configured'],
        'businessName' => $b['businessName'] ?? '',
        'tagline' => $b['tagline'] ?? '',
        'contactPerson' => $unmasked ? $contact : (substr($contact, 0, 2) . '***'),
        'phone' => $unmasked ? $phone : ('+255 *** *** ' . substr(preg_replace('/\D+/', '', $phone), -3)),
        'email' => $unmasked ? $email : (substr($email, 0, 1) . '***'),
        'sector' => $b['sector'] ?? '',
        'packageId' => $b['packageId'] ?? '',
        'packageName' => $b['packageName'] ?? '',
        'boothCode' => $b['boothCode'] ?? '',
        'cities' => $b['cities'] ?? array(),
        'totalAmount' => (float)($b['totalAmount'] ?? 0),
        'paymentMethod' => $b['paymentMethod'] ?? '',
        'status' => $b['status'] ?? 'Awaiting Payment',
        'lastPaymentOutcome' => $b['lastPaymentOutcome'] ?? null,
        'lastGatewayMessage' => $b['lastGatewayMessage'] ?? null,
        'paymentExpiresAt' => $b['paymentExpiresAt'] ?? null,
        'createdAt' => $b['createdAt'] ?? null,
        'paidAt' => $b['paidAt'] ?? null,
        'hasAccessPin' => !empty($b['accessPin']),
        'unmasked' => $unmasked,
        'stepUpRequired' => !$unmasked && !empty($b['accessPin']),
        'manageToken' => $manageToken ?: ($b['manageToken'] ?? null)
    );
}

if ($method !== 'GET' && $method !== 'HEAD') {
    acquireDbLockPhp();
}
$db = readDbPhp();
if (pruneExpiredPhp($db)) {
    writeDbPhp($db);
}
$payload = json_decode($rawBody, true);
if (!is_array($payload)) $payload = array();

if ($route === 'bot-token' && $method === 'GET') {
    echo json_encode(array('success' => true, 'botToken' => signBotFormTokenPhp()));
    exit;
}

if ($route === 'data' && $method === 'GET') {
    $pub = sanitizePublicDbPhp($db);
    $pub['botToken'] = signBotFormTokenPhp();
    echo json_encode($pub);
    exit;
}

if ($route === 'auth/session' && $method === 'GET') {
    $session = verifyAdminRequestPhp();
    echo json_encode(array(
        'authenticated' => (bool)$session,
        'user' => $session ? array('identifier' => $session['sub'] ?? 'admin', 'role' => 'admin') : null
    ));
    exit;
}

if ($route === 'auth/login' && $method === 'POST') {
    checkIpRateLimitPhp('auth-login', 15, 900);
    $identifier = strtolower(trim((string)($payload['identifier'] ?? '')));
    $password = (string)($payload['password'] ?? '');
    if ($identifier === '' || $password === '') {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Identifier and password are required'));
        exit;
    }
    $adminEmail = strtolower(trim(getEnvVar('TBF_ADMIN_EMAIL', 'info@biasharafestival.co.tz')));
    $adminPass = trim(getEnvVar('TBF_ADMIN_PASSWORD', ''));
    $matchedUser = null;
    if ($adminPass !== '' && $identifier === $adminEmail && hash_equals($adminPass, $password)) {
        $matchedUser = array('identifier' => $adminEmail, 'name' => 'Festival Organizer', 'role' => 'admin');
    } elseif (is_array($db['organizerAccounts'] ?? null)) {
        foreach ($db['organizerAccounts'] as $acc) {
            if (($acc['active'] ?? true) === false) continue;
            $accEmail = strtolower(trim((string)($acc['email'] ?? '')));
            $accHash = (string)($acc['passwordHash'] ?? '');
            if ($accEmail === $identifier && $accHash !== '' && password_verify($password, $accHash)) {
                $matchedUser = array('identifier' => $accEmail, 'name' => (string)($acc['name'] ?? 'Festival Organizer'), 'role' => 'admin');
                break;
            }
        }
    }
    if (!$matchedUser) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'error' => 'Invalid credentials'));
        exit;
    }
    $devId = getOrCreateDeviceIdPhp();
    $token = signPayloadPhp(array(
        'role' => 'admin',
        'sub' => $matchedUser['identifier'],
        'jti' => bin2hex(random_bytes(12)),
        'deviceId' => $devId,
        'uaFamily' => getUaFamilyPhp()
    ), 7200 * 1000);
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $cookieOpts = array('expires' => time() + 7200, 'path' => '/', 'secure' => $isSecure, 'httponly' => true, 'samesite' => 'Lax');
    setcookie('tbf_device_id', $devId, array_merge($cookieOpts, array('expires' => time() + 31536000)));
    setcookie('tbf_admin_session', $token, $cookieOpts);
    echo json_encode(array('success' => true, 'user' => $matchedUser));
    exit;
}

if ($route === 'auth/logout' && $method === 'POST') {
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    setcookie('tbf_admin_session', '', array('expires' => time() - 3600, 'path' => '/', 'secure' => $isSecure, 'httponly' => true, 'samesite' => 'Lax'));
    echo json_encode(array('success' => true));
    exit;
}

if ($route === 'admin/overview' && $method === 'GET') {
    requireAdminAuthPhp();
    echo json_encode(array(
        'success' => true,
        'bookings' => $db['bookings'] ?? array(),
        'sponsors' => $db['sponsors'] ?? array(),
        'organizers' => array(),
        'activeHolds' => $db['boothHolds'] ?? array(),
        'newsletterCount' => count($db['newsletterSubscribers'] ?? array()),
        'securityLog' => array_slice($db['securityLog'] ?? array(), 0, 15),
        'liveStats' => buildLiveStatsPhp($db)
    ));
    exit;
}

if ($route === 'admin/bookings/status' && $method === 'POST') {
    requireAdminAuthPhp();
    $bookingId = trim((string)($payload['bookingId'] ?? ''));
    $newStatus = trim((string)($payload['status'] ?? 'Confirmed'));
    if ($bookingId === '' || !in_array($newStatus, array('Confirmed', 'Paid', 'Awaiting Payment', 'Cancelled'), true)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Valid bookingId and status required'));
        exit;
    }
    $updatedBooking = null;
    foreach ($db['bookings'] as &$b) {
        if (($b['id'] ?? '') === $bookingId) {
            $b['status'] = $newStatus;
            if ($newStatus === 'Confirmed' || $newStatus === 'Paid') {
                $b['paymentExpiresAt'] = null;
            } elseif ($newStatus === 'Cancelled') {
                $oldCode = strtoupper((string)($b['boothCode'] ?? ''));
                foreach (($db['regions'] ?? array()) as &$reg) {
                    if (in_array($reg['name'] ?? '', $b['cities'] ?? array(), true)) {
                        $reg['bookedCodes'] = array_values(array_diff($reg['bookedCodes'] ?? array(), array($oldCode)));
                        $reg['bookedBooths'] = count($reg['bookedCodes']);
                    }
                }
                unset($reg);
            }
            $updatedBooking = $b;
            break;
        }
    }
    unset($b);
    if (!$updatedBooking) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'error' => 'Booking not found'));
        exit;
    }
    writeDbPhp($db);
    echo json_encode(array('success' => true, 'booking' => $updatedBooking));
    exit;
}

if ($route === 'bookings/hold' && $method === 'POST') {
    checkIpRateLimitPhp('hold', 35, 600);
    rejectIfHoneypotPhp($payload);
    $boothCode = strtoupper(trim($payload['boothCode'] ?? ''));
    $cities = isset($payload['cities']) && is_array($payload['cities']) ? array_values(array_filter($payload['cities'])) : array();
    $holdToken = trim($payload['holdToken'] ?? '');
    if ($boothCode === '' || empty($cities)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'boothCode and at least one city are required'));
        exit;
    }
    $conflict = findBoothConflictPhp($db, $boothCode, $cities, $holdToken);
    if ($conflict) {
        http_response_code(409);
        echo json_encode(array(
            'success' => false,
            'errorCode' => $conflict['type'] === 'HELD' ? 'BOOTH_HELD' : 'BOOTH_BOOKED',
            'error' => $conflict['type'] === 'HELD'
                ? 'Banda hili limeshikwa kwa muda na mshiriki mwingine.'
                : 'Banda hili tayari limechukuliwa kwenye mkoa uliochagua.'
        ));
        exit;
    }
    // Anti-Hoarding Guard: Release previous holds from same token or same IP so a bot cannot lock multiple booths
    $filtered = array();
    foreach ($db['boothHolds'] as $h) {
        if ($holdToken !== '' && ($h['holdToken'] ?? '') === $holdToken) continue;
        if (!empty($h['clientIp']) && $h['clientIp'] === $clientIp) continue;
        $filtered[] = $h;
    }
    $db['boothHolds'] = $filtered;
    if ($holdToken === '') {
        $holdToken = bin2hex(random_bytes(16));
    }
    $nowMs = round(microtime(true) * 1000);
    $holdRecord = array(
        'holdId' => 'HLD-' . strtoupper(bin2hex(random_bytes(3))),
        'holdToken' => $holdToken,
        'boothCode' => $boothCode,
        'cities' => $cities,
        'clientIp' => $clientIp,
        'createdAt' => $nowMs,
        'expiresAt' => $nowMs + (10 * 60 * 1000)
    );
    $db['boothHolds'][] = $holdRecord;
    writeDbPhp($db);
    echo json_encode(array(
        'success' => true,
        'hold' => $holdRecord,
        'db' => sanitizePublicDbPhp($db)
    ));
    exit;
}

if ($route === 'bookings/hold' && $method === 'DELETE') {
    $holdToken = trim($payload['holdToken'] ?? '');
    if ($holdToken !== '') {
        $filtered = array();
        foreach ($db['boothHolds'] as $h) {
            if (($h['holdToken'] ?? '') !== $holdToken) $filtered[] = $h;
        }
        $db['boothHolds'] = $filtered;
        writeDbPhp($db);
    }
    echo json_encode(array('success' => true));
    exit;
}

if ($route === 'bookings' && $method === 'POST') {
    checkIpRateLimitPhp('book', 6, 900);
    rejectIfHoneypotPhp($payload);
    rejectUnlessValidBotTokenPhp($payload, 800);
    $businessName = trim($payload['businessName'] ?? '');
    $contactPerson = trim($payload['contactPerson'] ?? '');
    $phone = trim($payload['phone'] ?? '');
    $email = strtolower(trim($payload['email'] ?? ''));
    $boothCode = strtoupper(trim($payload['boothCode'] ?? ''));
    $cities = isset($payload['cities']) && is_array($payload['cities']) ? array_values(array_filter($payload['cities'])) : array();
    $holdToken = trim($payload['holdToken'] ?? '');
    $clientRequestId = trim($payload['clientRequestId'] ?? '');

    if ($businessName === '' || $contactPerson === '' || strlen(normalizePhoneTailPhp($phone)) < 9 || strpos($email, '@') === false || $boothCode === '' || empty($cities)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Tafadhali jaza taarifa zote za biashara, simu, barua pepe na uchague banda.'));
        exit;
    }

    $unpaidCount = 0;
    $reqTail = normalizePhoneTailPhp($phone);
    foreach (($db['bookings'] ?? array()) as $eb) {
        if (strtolower(trim($eb['status'] ?? '')) !== 'awaiting payment') continue;
        if (($eb['clientIp'] ?? '') === $clientIp || strtolower(trim($eb['email'] ?? '')) === $email || ($reqTail !== '' && normalizePhoneTailPhp($eb['phone'] ?? '') === $reqTail)) {
            $unpaidCount++;
        }
    }
    if ($unpaidCount >= 2) {
        http_response_code(429);
        echo json_encode(array('success' => false, 'error' => 'Una booking 2 ambazo bado hazijalipiwa. Tafadhali kamilisha malipo au ghairi booking iliyopo kwanza.'));
        exit;
    }

    if ($clientRequestId !== '') {
        foreach ($db['bookings'] as $eb) {
            if (($eb['clientRequestId'] ?? '') === $clientRequestId) {
                echo json_encode(array(
                    'success' => true,
                    'deduplicated' => true,
                    'booking' => formatBookingReceiptPhp($eb, true),
                    'accessPin' => $eb['accessPin'] ?? '',
                    'liveStats' => buildLiveStatsPhp($db),
                    'db' => sanitizePublicDbPhp($db)
                ));
                exit;
            }
        }
    }

    $conflict = findBoothConflictPhp($db, $boothCode, $cities, $holdToken);
    if ($conflict) {
        http_response_code(409);
        echo json_encode(array('success' => false, 'error' => 'Samahani, banda hili limeshachukuliwa. Tafadhali chagua banda lingine lililo wazi.'));
        exit;
    }

    if ($holdToken !== '') {
        $filtered = array();
        foreach ($db['boothHolds'] as $h) {
            if (($h['holdToken'] ?? '') !== $holdToken) $filtered[] = $h;
        }
        $db['boothHolds'] = $filtered;
    }

    $refNum = 'TBF-BIZ-' . mt_rand(1000, 9999);
    $accessPin = (string)mt_rand(100000, 999999);
    $reqPkgId = trim($payload['packageId'] ?? 'standard-booth');
    $prefix = strtoupper(explode('-', $boothCode)[0] ?? 'B');
    $defaultPrices = array('SME' => 150000, 'B' => 350000, 'FOOD' => 400000, 'A' => 750000);
    $unitPrice = $defaultPrices[$prefix] ?? 350000;
    foreach (($db['boothPackages'] ?? array()) as $pkg) {
        if (($pkg['id'] ?? '') === $reqPkgId && strtoupper($pkg['zonePrefix'] ?? '') === $prefix) {
            $unitPrice = max(100000, (float)($pkg['price'] ?? $unitPrice));
            break;
        }
    }
    $cityCount = max(1, count($cities));
    $subtotal = $unitPrice * $cityCount;
    $discount = $cityCount >= 2 ? round($subtotal * 0.15) : 0;
    $totalAmount = $subtotal - $discount;
    $paymentMethod = trim($payload['paymentMethod'] ?? 'M-Pesa / Mixx by Yas / Airtel Money');

    $selcomRes = createSelcomOrderAndPushPhp($refNum, $totalAmount, $contactPerson, $email, $phone, $boothCode, $cities, $paymentMethod, true);
    $controlNum = (!empty($selcomRes['orderCreated']) && !empty($selcomRes['controlNumber']))
        ? $selcomRes['controlNumber']
        : ('TBF-' . str_replace('TBF-BIZ-', '', $refNum) . '-' . mt_rand(1000, 9999));

    $newBooking = array(
        'id' => $refNum,
        'controlNumber' => $controlNum,
        'selcomReference' => $selcomRes['reference'] ?? null,
        'selcomGatewayUrl' => $selcomRes['gatewayUrl'] ?? null,
        'selcomPushSent' => !empty($selcomRes['pushSent']),
        'selcomTransId' => $selcomRes['transId'] ?? null,
        'accessPin' => $accessPin,
        'manageToken' => bin2hex(random_bytes(16)),
        'clientRequestId' => $clientRequestId,
        'businessName' => $businessName,
        'tagline' => trim($payload['tagline'] ?? 'Bidhaa na huduma bora kwa wateja na wawekezaji mikoani.'),
        'contactPerson' => $contactPerson,
        'phone' => $phone,
        'email' => $email,
        'sector' => trim($payload['sector'] ?? 'Biashara & Huduma'),
        'packageId' => trim($payload['packageId'] ?? 'standard-booth'),
        'packageName' => trim($payload['packageName'] ?? 'Standard SME Booth (3m x 3m)'),
        'boothCode' => $boothCode,
        'cities' => $cities,
        'totalAmount' => $totalAmount,
        'paymentMethod' => $paymentMethod,
        'featured' => true,
        'clientIp' => $clientIp,
        'status' => 'Awaiting Payment',
        'paymentExpiresAt' => gmdate('c', time() + 3600),
        'createdAt' => gmdate('c')
    );

    array_unshift($db['bookings'], $newBooking);
    foreach ($db['regions'] as &$reg) {
        if (in_array($reg['name'] ?? '', $cities, true)) {
            if (!isset($reg['bookedCodes']) || !is_array($reg['bookedCodes'])) $reg['bookedCodes'] = array();
            if (!in_array($boothCode, $reg['bookedCodes'], true)) {
                $reg['bookedCodes'][] = $boothCode;
                $reg['bookedBooths'] = count($reg['bookedCodes']);
            }
        }
    }
    unset($reg);
    writeDbPhp($db);

    http_response_code(201);
    echo json_encode(array(
        'success' => true,
        'booking' => formatBookingReceiptPhp($newBooking, true, $newBooking['manageToken']),
        'accessPin' => $accessPin,
        'selcom' => $selcomRes,
        'liveStats' => buildLiveStatsPhp($db),
        'db' => sanitizePublicDbPhp($db)
    ));
    exit;
}

if ($route === 'bookings/selcom-push' && $method === 'POST') {
    checkIpRateLimitPhp('selcom-push', 15, 600);
    $bookingId = strtoupper(trim($payload['bookingId'] ?? ($payload['ref'] ?? '')));
    $rawPhone = trim($payload['phone'] ?? '');
    $pin = trim($payload['pin'] ?? '');
    $manageToken = trim($payload['manageToken'] ?? '');
    $foundIdx = -1;
    foreach ($db['bookings'] as $idx => $b) {
        if (strtoupper($b['id'] ?? '') === $bookingId) { $foundIdx = $idx; break; }
    }
    if ($foundIdx < 0) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'error' => 'Booking haijapatikana.'));
        exit;
    }
    $found = $db['bookings'][$foundIdx];
    $pinOk = ($pin !== '' && isset($found['accessPin']) && hash_equals((string)$found['accessPin'], $pin));
    $tokOk = ($manageToken !== '' && isset($found['manageToken']) && hash_equals((string)$found['manageToken'], $manageToken));
    $ipOk = (!empty($found['clientIp']) && $found['clientIp'] === $clientIp);
    if (!$pinOk && !$tokOk && !$ipOk) {
        http_response_code(403);
        echo json_encode(array('success' => false, 'error' => 'Uthibitisho wa mmiliki wa booking unahitajika kutuma prompt ya malipo.'));
        exit;
    }
    if (!empty($found['lastSelcomPushAt']) && (time() - (int)$found['lastSelcomPushAt']) < 60) {
        $waitSec = max(1, 60 - (time() - (int)$found['lastSelcomPushAt']));
        http_response_code(429);
        echo json_encode(array('success' => false, 'retryAfterSec' => $waitSec, 'error' => "Prompt imeshatumwa. Subiri sekunde {$waitSec} kabla ya kutuma tena."));
        exit;
    }
    $st = strtolower(trim($found['status'] ?? ''));
    if ($st === 'paid' || $st === 'confirmed') {
        echo json_encode(array(
            'success' => true,
            'alreadyPaid' => true,
            'message' => 'Malipo yako tayari yamethibitishwa!',
            'booking' => formatBookingReceiptPhp($found, true)
        ));
        exit;
    }

    $cfg = getSelcomConfigPhp();
    if (!$cfg['configured']) {
        http_response_code(503);
        echo json_encode(array(
            'success' => false,
            'configured' => false,
            'error' => 'Selcom API Keys (SELCOM_VENDOR_ID, SELCOM_API_KEY, SELCOM_API_SECRET) bado hazijawekwa kwenye .env ya server.'
        ));
        exit;
    }

    $targetPhone = $rawPhone !== '' ? $rawPhone : ($found['phone'] ?? '');
    $msisdn = normalizeTzMsisdnPhp($targetPhone);
    if (!preg_match('/^255[67]\d{8}$/', $msisdn)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Weka namba sahihi ya simu ya Tanzania (mfano 07XXXXXXXX au 2557XXXXXXXX).'));
        exit;
    }

    if (empty($found['selcomReference'])) {
        $created = createSelcomOrderAndPushPhp(
            $found['id'],
            $found['totalAmount'] ?? 350000,
            $found['contactPerson'] ?? 'Exhibitor',
            $found['email'] ?? 'info@biasharafestival.co.tz',
            $msisdn,
            $found['boothCode'] ?? 'B-01',
            $found['cities'] ?? array('Mwanza'),
            'M-Pesa / Mobile Money',
            true
        );
        if (empty($created['orderCreated'])) {
            http_response_code(502);
            echo json_encode(array('success' => false, 'error' => $created['error'] ?? 'Imeshindikana kuwasiliana na Selcom Gateway.'));
            exit;
        }
        $db['bookings'][$foundIdx]['selcomReference'] = $created['reference'];
        if (!empty($created['controlNumber'])) $db['bookings'][$foundIdx]['controlNumber'] = $created['controlNumber'];
        if (!empty($created['gatewayUrl'])) $db['bookings'][$foundIdx]['selcomGatewayUrl'] = $created['gatewayUrl'];
        $db['bookings'][$foundIdx]['selcomPushSent'] = !empty($created['pushSent']);
        $db['bookings'][$foundIdx]['lastSelcomPushAt'] = time();
        writeDbPhp($db);
        echo json_encode(array(
            'success' => !empty($created['pushSent']),
            'pushSent' => !empty($created['pushSent']),
            'controlNumber' => $db['bookings'][$foundIdx]['controlNumber'],
            'reference' => $created['reference'],
            'gatewayUrl' => $created['gatewayUrl'],
            'message' => !empty($created['pushSent'])
                ? "Prompt ya malipo (Selcom USSD Push) imetumwa kwenye simu $msisdn. Weka PIN yako kukamilisha malipo."
                : ($created['pushMessage'] ?: 'Oda ya Selcom imeundwa.')
        ));
        exit;
    }

    $transId = 'TBF' . substr((string)time(), -7) . mt_rand(100, 999);
    $pushRes = selcomApiCallPhp('POST', '/v1/checkout/wallet-payment', array(
        'transid' => $transId,
        'order_id' => (string)$found['id'],
        'msisdn' => $msisdn
    ));
    if (!empty($pushRes['ok'])) {
        $db['bookings'][$foundIdx]['selcomPushSent'] = true;
        $db['bookings'][$foundIdx]['selcomTransId'] = $transId;
        $db['bookings'][$foundIdx]['lastSelcomPushAt'] = time();
        writeDbPhp($db);
    }
    http_response_code(!empty($pushRes['ok']) ? 200 : 502);
    echo json_encode(array(
        'success' => !empty($pushRes['ok']),
        'pushSent' => !empty($pushRes['ok']),
        'transId' => $transId,
        'message' => !empty($pushRes['ok'])
            ? "Prompt ya malipo (Selcom USSD Push) imetumwa kwenye simu $msisdn. Weka PIN yako ya M-Pesa / Mixx / Airtel / HaloPesa."
            : ($pushRes['data']['message'] ?? ($pushRes['error'] ?? 'Imeshindikana kutuma USSD Push.')),
        'error' => empty($pushRes['ok']) ? ($pushRes['data']['message'] ?? ($pushRes['error'] ?? 'Selcom Push failed')) : null
    ));
    exit;
}

if ($route === 'webhooks/selcom' && $method === 'POST') {
    $orderId = strtoupper(trim($payload['order_id'] ?? ''));
    if ($orderId === '') {
        http_response_code(400);
        echo json_encode(array('result' => 'FAIL', 'message' => 'Missing order_id'));
        exit;
    }
    $cfg = getSelcomConfigPhp();
    if (!$cfg['configured']) {
        http_response_code(503);
        echo json_encode(array('result' => 'FAIL', 'message' => 'Selcom not configured'));
        exit;
    }
    // Always verify directly against Selcom API (never trust raw webhook payload alone)
    $live = querySelcomOrderStatusPhp($orderId);
    $verifiedPaid = !empty($live['paid']);
    if ($verifiedPaid) {
        foreach ($db['bookings'] as &$b) {
            if (strtoupper($b['id'] ?? '') === $orderId) {
                $b['status'] = 'Paid';
                $b['paymentExpiresAt'] = null;
                $b['paidAt'] = gmdate('c');
                if (!empty($live['reference']) || !empty($payload['reference'])) {
                    $b['selcomReference'] = (string)($live['reference'] ?: $payload['reference']);
                }
                if (!empty($live['transId']) || !empty($payload['transid'])) {
                    $b['selcomTransId'] = (string)($live['transId'] ?: $payload['transid']);
                }
                break;
            }
        }
        unset($b);
        writeDbPhp($db);
    }
    echo json_encode(array('result' => 'SUCCESS', 'resultcode' => '000', 'order_id' => $orderId, 'verifiedPaid' => $verifiedPaid));
    exit;
}

if (($route === 'bookings/lookup' || $route === 'bookings/email-login' || $route === 'bookings/manage') && $method === 'POST') {
    checkIpRateLimitPhp('lookup', 40, 900);
    $refInput = strtoupper(trim($payload['ref'] ?? ''));
    $phoneTail = normalizePhoneTailPhp($payload['phone'] ?? '');
    $emailInput = strtolower(trim($payload['email'] ?? ''));
    $pin = trim($payload['pin'] ?? ($payload['secret'] ?? ''));
    $action = trim($payload['action'] ?? 'lookup');

    $foundIdx = -1;
    foreach ($db['bookings'] as $idx => $b) {
        $bId = strtoupper(trim($b['id'] ?? ''));
        $bCtrl = strtoupper(trim($b['controlNumber'] ?? ''));
        $refMatch = ($refInput === '' || $bId === $refInput || $bCtrl === $refInput);
        if (!$refMatch) continue;
        $contactMatch = false;
        if ($emailInput !== '' && strtolower(trim($b['email'] ?? '')) === $emailInput) $contactMatch = true;
        if ($phoneTail !== '' && normalizePhoneTailPhp($b['phone'] ?? '') === $phoneTail) $contactMatch = true;
        if ($contactMatch) { $foundIdx = $idx; break; }
    }

    if ($foundIdx < 0) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'error' => 'Hakuna booking iliyopatikana kwa taarifa hizo.'));
        exit;
    }

    $found = &$db['bookings'][$foundIdx];
    $stLower = strtolower(trim($found['status'] ?? ''));
    $livePaymentStatus = ($stLower === 'paid' || $stLower === 'confirmed') ? 'PAID' : ($found['lastPaymentOutcome'] ?? 'PENDING');
    $gatewayMessage = (string)($found['lastGatewayMessage'] ?? '');
    if ($stLower !== 'paid' && $stLower !== 'confirmed') {
        $cfg = getSelcomConfigPhp();
        if ($cfg['configured']) {
            $live = querySelcomOrderStatusPhp($found['id']);
            $livePaymentStatus = $live['outcome'] ?? (!empty($live['paid']) ? 'PAID' : 'PENDING');
            $gatewayMessage = (string)($live['gatewayMessage'] ?? '');
            if (!empty($live['paid'])) {
                $found['status'] = 'Paid';
                $found['lastPaymentOutcome'] = 'PAID';
                $found['lastGatewayMessage'] = $gatewayMessage;
                $found['paymentExpiresAt'] = null;
                $found['paidAt'] = gmdate('c');
                if (!empty($live['reference'])) $found['selcomReference'] = $live['reference'];
                writeDbPhp($db);
            } elseif (in_array($livePaymentStatus, array('INSUFFICIENT_FUNDS', 'CANCELLED', 'FAILED'), true)) {
                $found['lastPaymentOutcome'] = $livePaymentStatus;
                $found['lastGatewayMessage'] = $gatewayMessage;
                writeDbPhp($db);
            }
        }
    }

    $pinMatches = ($pin !== '' && isset($found['accessPin']) && hash_equals((string)$found['accessPin'], $pin));
    $tokenMatches = (!empty($payload['manageToken']) && isset($found['manageToken']) && hash_equals((string)$found['manageToken'], (string)$payload['manageToken']));
    $unmasked = $pinMatches || $tokenMatches;

    if ($route === 'bookings/manage') {
        if (!$unmasked) {
            http_response_code(403);
            echo json_encode(array('success' => false, 'error' => 'PIN ya usalama ya tarakimu 6 si sahihi.'));
            exit;
        }
        $curSt = strtolower(trim($found['status'] ?? ''));
        if ($action === 'switch_booth') {
            if ($curSt === 'cancelled' || $curSt === 'expired') {
                http_response_code(400);
                echo json_encode(array('success' => false, 'error' => 'Cannot switch booth on an inactive booking'));
                exit;
            }
            $newCode = strtoupper(trim($payload['newBoothCode'] ?? ''));
            if ($newCode === '') {
                http_response_code(400);
                echo json_encode(array('success' => false, 'error' => 'newBoothCode is required'));
                exit;
            }
            $conflict = findBoothConflictPhp($db, $newCode, $found['cities'] ?? array(), '', $found['id']);
            if ($conflict) {
                http_response_code(409);
                echo json_encode(array('success' => false, 'error' => "Banda {$newCode} tayari limechukuliwa katika mkoa uliouchagua."));
                exit;
            }
            $oldCode = $found['boothCode'];
            $found['boothCode'] = $newCode;
            foreach ($db['regions'] as &$reg) {
                if (in_array($reg['name'] ?? '', $found['cities'] ?? array(), true)) {
                    $reg['bookedCodes'] = array_values(array_diff($reg['bookedCodes'] ?? array(), array($oldCode)));
                    if (!in_array($newCode, $reg['bookedCodes'], true)) $reg['bookedCodes'][] = $newCode;
                    $reg['bookedBooths'] = count($reg['bookedCodes']);
                }
            }
            unset($reg);
            writeDbPhp($db);
        } elseif ($action === 'cancel') {
            if ($curSt === 'paid' || $curSt === 'confirmed') {
                http_response_code(400);
                echo json_encode(array('success' => false, 'error' => 'Paid bookings require organizer desk review to cancel.'));
                exit;
            }
            $oldCode = $found['boothCode'];
            $found['status'] = 'Cancelled';
            $found['paymentExpiresAt'] = null;
            foreach ($db['regions'] as &$reg) {
                if (in_array($reg['name'] ?? '', $found['cities'] ?? array(), true)) {
                    $reg['bookedCodes'] = array_values(array_diff($reg['bookedCodes'] ?? array(), array($oldCode)));
                    $reg['bookedBooths'] = count($reg['bookedCodes']);
                }
            }
            unset($reg);
            writeDbPhp($db);
        }
    }

    echo json_encode(array(
        'success' => true,
        'role' => 'exhibitor',
        'unlocked' => $unmasked,
        'livePaymentStatus' => $livePaymentStatus,
        'gatewayMessage' => $gatewayMessage,
        'booking' => formatBookingReceiptPhp($found, $unmasked, $unmasked ? ($found['manageToken'] ?? bin2hex(random_bytes(8))) : ''),
        'db' => sanitizePublicDbPhp($db),
        'liveStats' => buildLiveStatsPhp($db)
    ));
    exit;
}

if ($route === 'visitor-ping' && $method === 'POST') {
    if (!isset($db['analytics']) || !is_array($db['analytics'])) {
        $db['analytics'] = array(
            'totalCookieVisitors' => 185,
            'totalRegisteredAttendees' => 240,
            'totalBusinessesShowcased' => 0,
            'totalPartnersAndInvestors' => 2
        );
    }
    $currentVisitors = max(185, (int)($db['analytics']['totalCookieVisitors'] ?? 185));
    $db['analytics']['totalCookieVisitors'] = $currentVisitors + 1;

    $regionId = strtolower(trim($payload['regionId'] ?? 'mwanza'));
    if (isset($db['regions']) && is_array($db['regions'])) {
        foreach ($db['regions'] as &$r) {
            if (strtolower($r['id'] ?? '') === $regionId) {
                $r['cookieVisitors'] = ((int)($r['cookieVisitors'] ?? 0)) + 1;
                break;
            }
        }
        unset($r);
    }
    writeDbPhp($db);
    echo json_encode(array(
        'success' => true,
        'visitorId' => $payload['visitorId'] ?? ('v_' . time()),
        'liveStats' => buildLiveStatsPhp($db),
        'regions' => $db['regions'] ?? array()
    ));
    exit;
}

if ($route === 'sponsors' && $method === 'POST') {
    checkIpRateLimitPhp('sponsors', 10, 900);
    rejectIfHoneypotPhp($payload);
    rejectUnlessValidBotTokenPhp($payload, 600);
    $organization = trim((string)($payload['organization'] ?? ''));
    $contactName = trim((string)($payload['contactName'] ?? ''));
    $phone = trim((string)($payload['phone'] ?? ''));
    $email = strtolower(trim((string)($payload['email'] ?? '')));
    if ($organization === '' || $contactName === '' || strlen(normalizePhoneTailPhp($phone)) < 7 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Complete organization contact details are required'));
        exit;
    }
    if (!isset($db['sponsors']) || !is_array($db['sponsors'])) $db['sponsors'] = array();
    $newSponsor = array(
        'id' => 'SP-' . mt_rand(100, 999),
        'organization' => substr($organization, 0, 140),
        'contactName' => substr($contactName, 0, 100),
        'phone' => substr($phone, 0, 32),
        'email' => substr($email, 0, 120),
        'tier' => substr(trim((string)($payload['tier'] ?? 'Sponsor')), 0, 48),
        'targetRegions' => substr(trim((string)($payload['targetRegions'] ?? 'National Tour (All Regions)')), 0, 140),
        'status' => 'New Inquiry',
        'createdAt' => gmdate('c')
    );
    array_unshift($db['sponsors'], $newSponsor);
    writeDbPhp($db);
    http_response_code(201);
    echo json_encode(array('success' => true, 'sponsorId' => $newSponsor['id'], 'liveStats' => buildLiveStatsPhp($db)));
    exit;
}

if ($route === 'announcements' && $method === 'POST') {
    requireAdminAuthPhp();
    $rawType = strtoupper(trim((string)($payload['type'] ?? 'EVENT')));
    $postType = in_array($rawType, array('EVENT', 'NEWS', 'ADVERTISEMENT', 'ADVISORY'), true) ? $rawType : 'EVENT';
    if (!isset($db['announcements']) || !is_array($db['announcements'])) $db['announcements'] = array();
    $newAnn = array(
        'id' => 'UPD-' . mt_rand(100, 999),
        'type' => $postType,
        'category' => substr(trim((string)($payload['category'] ?? ($postType . ' UPDATE'))), 0, 60),
        'region' => substr(trim((string)($payload['region'] ?? 'All Regions')), 0, 60),
        'title' => substr(trim((string)($payload['title'] ?? 'Taarifa Mpya ya Tanzania Biashara Festival')), 0, 180),
        'summary' => substr(trim((string)($payload['summary'] ?? '')), 0, 1500)
    );
    array_unshift($db['announcements'], $newAnn);
    writeDbPhp($db);
    http_response_code(201);
    echo json_encode(array('success' => true, 'announcement' => $newAnn, 'db' => sanitizePublicDbPhp($db)));
    exit;
}

if ($route === 'admin/set-destination' && $method === 'POST') {
    requireAdminAuthPhp();
    $regionId = strtolower(trim($payload['regionId'] ?? 'mwanza'));
    $regionName = trim($payload['regionName'] ?? 'Mwanza');
    $venue = trim($payload['venue'] ?? ($regionName . ' Exhibition Grounds'));
    $venueLocation = trim($payload['venueLocation'] ?? ($regionName . ' City Center'));
    $eventDates = trim($payload['eventDates'] ?? 'Tarehe Zitatangazwa');
    $notes = trim($payload['notes'] ?? '');

    $db['destination'] = array(
        'regionId' => $regionId,
        'regionName' => $regionName,
        'venue' => $venue,
        'venueLocation' => $venueLocation,
        'eventDates' => $eventDates,
        'notes' => $notes,
        'updatedAt' => gmdate('c')
    );

    if (!isset($db['regions']) || !is_array($db['regions'])) $db['regions'] = array();
    $found = false;
    foreach ($db['regions'] as &$r) {
        if (strtolower($r['id'] ?? '') === $regionId || strtolower($r['name'] ?? '') === strtolower($regionName)) {
            $r['venueSw'] = $venue;
            $r['venueEn'] = $venue;
            $r['venueLocation'] = $venueLocation;
            $r['eventDates'] = $eventDates;
            $found = true;
            break;
        }
    }
    unset($r);
    if (!$found) {
        $db['regions'][] = array(
            'id' => $regionId,
            'name' => $regionName,
            'venueSw' => $venue,
            'venueEn' => $venue,
            'venueLocation' => $venueLocation,
            'eventDates' => $eventDates,
            'totalBooths' => 160,
            'bookedBooths' => 0,
            'registeredAttendees' => 0,
            'bookedCodes' => array()
        );
    }
    writeDbPhp($db);
    echo json_encode(array('success' => true, 'destination' => $db['destination'], 'regions' => $db['regions']));
    exit;
}

if ($route === 'contact-messages' && $method === 'POST') {
    checkIpRateLimitPhp('contact', 10, 900);
    rejectIfHoneypotPhp($payload);
    rejectUnlessValidBotTokenPhp($payload, 600);
    $name = trim($payload['name'] ?? '');
    $phone = trim($payload['phone'] ?? '');
    $email = strtolower(trim($payload['email'] ?? ''));
    $type = trim($payload['type'] ?? 'General Inquiry');
    $message = trim($payload['message'] ?? '');
    if ($name === '' || strlen(normalizePhoneTailPhp($phone)) < 7 || $message === '') {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Tafadhali jaza Jina, Namba ya Simu sahihi na Ujumbe wako.'));
        exit;
    }
    if (!isset($db['contactMessages']) || !is_array($db['contactMessages'])) $db['contactMessages'] = array();
    array_unshift($db['contactMessages'], array(
        'id' => 'MSG-' . mt_rand(1000, 9999),
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'type' => $type,
        'message' => substr($message, 0, 1200),
        'createdAt' => gmdate('c')
    ));
    writeDbPhp($db);
    http_response_code(201);
    echo json_encode(array('success' => true));
    exit;
}

if ($route === 'attendee-rsvp' && $method === 'POST') {
    checkIpRateLimitPhp('rsvp', 15, 900);
    rejectIfHoneypotPhp($payload);
    $db['analytics']['totalRegisteredAttendees'] = max(240, (int)($db['analytics']['totalRegisteredAttendees'] ?? 240)) + 1;
    writeDbPhp($db);
    echo json_encode(array('success' => true, 'liveStats' => buildLiveStatsPhp($db)));
    exit;
}

if ($route === 'newsletter/subscribe' && $method === 'POST') {
    checkIpRateLimitPhp('newsletter', 10, 900);
    rejectIfHoneypotPhp($payload);
    rejectUnlessValidBotTokenPhp($payload, 500);
    $email = strtolower(trim($payload['email'] ?? ''));
    $name = trim($payload['name'] ?? '');
    $region = trim($payload['region'] ?? 'All Regions');

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[^\s@<>]{1,64}@[^\s@<>]{1,120}\.[^\s@<>]{2,32}$/', $email)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Tafadhali weka Barua Pepe (Email) sahihi.'));
        exit;
    }

    if (!isset($db['newsletterSubscribers']) || !is_array($db['newsletterSubscribers'])) {
        $db['newsletterSubscribers'] = array();
    }
    $emailHash = substr(hash('sha256', $email), 0, 32);
    $already = false;
    foreach ($db['newsletterSubscribers'] as $sub) {
        if (($sub['emailIdx'] ?? '') === $emailHash || strtolower(trim($sub['email'] ?? '')) === $email) {
            $already = true;
            break;
        }
    }
    if (!$already) {
        array_unshift($db['newsletterSubscribers'], array(
            'id' => 'SUB-' . mt_rand(1000, 9999),
            'email' => $email,
            'emailIdx' => $emailHash,
            'name' => substr($name, 0, 80),
            'region' => substr($region ?: 'All Regions', 0, 60),
            'subscribedAt' => gmdate('c')
        ));
        writeDbPhp($db);

        $pdo = getMysqlPdoPhp();
        if ($pdo) {
            try {
                $nStmt = $pdo->prepare("INSERT IGNORE INTO `newsletter_subscribers` (`email_enc`, `email_idx`, `name_enc`, `ip_hash`) VALUES (?, ?, ?, ?)");
                $nStmt->execute(array($email, $emailHash, substr($name, 0, 120), substr(hash('sha256', $clientIp), 0, 32)));
            } catch (Exception $e) {
            error_log('[TBF PHP DB] MySQL read error: ' . $e->getMessage());
        }
        }

        // Send instant Welcome Email from info@biasharafestival.co.tz
        $safeName = htmlspecialchars($name ?: 'Mshiriki / Mfuatiliaji', ENT_QUOTES, 'UTF-8');
        $safeRegion = htmlspecialchars($region ?: 'All Regions', ENT_QUOTES, 'UTF-8');
        $fromEmail = getOfficialMailFromPhp();
        $welcomeHtml = buildBrandedNewsletterHtmlPhp(
            'Asante kwa Kujiunga na Jarida Rasmi la TBF!',
            "<p>Habari <strong>{$safeName}</strong>,</p><p>Umejiunga kikamilifu na jarida rasmi la <strong>Tanzania Biashara Festival (TBF)</strong> kwa ajili ya taarifa za: <strong>{$safeRegion}</strong>.</p><p>Tutakutumia ratiba rasmi za mikoa, fursa za mabanda, minada ya wazi, na majukwaa ya uwekezaji kupitia <strong>{$fromEmail}</strong>.</p><p><a href=\"https://biasharafestival.co.tz/booking\" style=\"display:inline-block;padding:10px 18px;background:#0b6b68;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;\">Hifadhi Banda Mtandaoni &rarr;</a></p>"
        );
        sendFestivalEmailPhp($email, 'Karibu Tanzania Biashara Festival (TBF) — Newsletter Confirmation', $welcomeHtml);
    }

    echo json_encode(array(
        'success' => true,
        'from' => getOfficialMailFromPhp(),
        'message' => 'Successfully subscribed to TBF newsletter',
        'totalSubscribers' => count($db['newsletterSubscribers'])
    ));
    exit;
}

if ($route === 'admin/newsletter/send' && $method === 'POST') {
    requireAdminAuthPhp();
    $subject = trim($payload['subject'] ?? '');
    $message = trim($payload['message'] ?? '');
    $targetRegion = trim($payload['targetRegion'] ?? 'ALL');
    if ($subject === '' || $message === '') {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Subject na Ujumbe vinahitajika.'));
        exit;
    }
    $subs = $db['newsletterSubscribers'] ?? array();
    $targeted = array();
    foreach ($subs as $s) {
        if ($targetRegion === '' || strtoupper($targetRegion) === 'ALL') {
            $targeted[] = $s;
        } else {
            $r = strtolower($s['region'] ?? '');
            if (strpos($r, 'all') !== false || $r === strtolower($targetRegion)) $targeted[] = $s;
        }
    }
    $lines = array_filter(array_map('trim', preg_split('/\r?\n/', $message)));
    $bodyHtml = '';
    foreach ($lines as $ln) {
        $bodyHtml .= '<p style="margin:0 0 12px;">' . htmlspecialchars($ln, ENT_QUOTES, 'UTF-8') . '</p>';
    }
    $bodyHtml .= '<p style="margin-top:20px;"><a href="https://biasharafestival.co.tz/booking" style="display:inline-block;padding:10px 18px;background:#0b6b68;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Book Exhibition Booth / View Schedule &rarr;</a></p>';
    $html = buildBrandedNewsletterHtmlPhp($subject, $bodyHtml);
    $sentCount = 0;
    foreach ($targeted as $s) {
        $em = trim((string)($s['email'] ?? ''));
        if (filter_var($em, FILTER_VALIDATE_EMAIL) && sendFestivalEmailPhp($em, $subject, $html)) {
            $sentCount++;
        }
    }
    $fromEmail = getOfficialMailFromPhp();
    echo json_encode(array(
        'success' => true,
        'from' => $fromEmail,
        'totalTargeted' => count($targeted),
        'sentCount' => $sentCount,
        'message' => count($targeted) === 0
            ? 'Hakuna msajili kwenye kundi hilo bado.'
            : "Newsletter imetumwa kutoka {$fromEmail} kwenda kwa wasajili {$sentCount} kati ya " . count($targeted) . "."
    ));
    exit;
}

http_response_code(404);
echo json_encode(array('success' => false, 'error' => 'API route not found'));
