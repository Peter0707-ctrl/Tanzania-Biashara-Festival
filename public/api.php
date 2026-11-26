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
    if (!$cfg['configured'] || !$orderId) return array('configured' => $cfg['configured'], 'paid' => false);
    $res = selcomApiCallPhp('GET', '/v1/checkout/order-status', array('order_id' => (string)$orderId));
    if (!$res['ok']) return array('configured' => true, 'paid' => false);
    $row = (isset($res['data']['data'][0]) && is_array($res['data']['data'][0])) ? $res['data']['data'][0] : array();
    $st = strtoupper((string)($row['payment_status'] ?? ($res['data']['payment_status'] ?? '')));
    $isPaid = ($st === 'COMPLETED' || $st === 'PAID' || $st === 'SUCCESSFUL');
    return array(
        'configured' => true,
        'paid' => $isPaid,
        'paymentStatus' => $st ?: 'PENDING',
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
        } catch (Exception $e) {}
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

            // Also sync recent bookings into relational `bookings` table for cPanel phpMyAdmin visibility
            if (isset($db['bookings']) && is_array($db['bookings'])) {
                $bStmt = $pdo->prepare("INSERT INTO `bookings` (`id`, `control_number_enc`, `business_name`, `tagline`, `contact_person_enc`, `phone_enc`, `phone_idx`, `email_enc`, `email_idx`, `sector`, `package_id`, `package_name`, `booth_code`, `cities`, `total_amount`, `payment_method`, `status`, `featured`, `access_pin_hash`, `client_request_id`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE `booth_code` = VALUES(`booth_code`), `status` = VALUES(`status`), `control_number_enc` = VALUES(`control_number_enc`), `total_amount` = VALUES(`total_amount`)");
                foreach (array_slice($db['bookings'], 0, 50) as $b) {
                    $stLower = strtolower(trim($b['status'] ?? ''));
                    $normStatus = ($stLower === 'paid' || $stLower === 'confirmed') ? 'Confirmed' : (($stLower === 'cancelled') ? 'Cancelled' : (($stLower === 'expired') ? 'Expired' : 'Awaiting Payment'));
                    @$bStmt->execute(array(
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
        } catch (Exception $e) {}
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
            @file_put_contents($t, $json, LOCK_EX);
        }
    }
}

function pruneExpiredPhp(&$db) {
    $nowMs = round(microtime(true) * 1000);
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
        'paymentExpiresAt' => $b['paymentExpiresAt'] ?? null,
        'createdAt' => $b['createdAt'] ?? null,
        'paidAt' => $b['paidAt'] ?? null,
        'hasAccessPin' => !empty($b['accessPin']),
        'unmasked' => $unmasked,
        'stepUpRequired' => !$unmasked && !empty($b['accessPin']),
        'manageToken' => $manageToken ?: ($b['manageToken'] ?? null)
    );
}

$db = readDbPhp();
if (pruneExpiredPhp($db)) {
    writeDbPhp($db);
}
$payload = json_decode($rawBody, true);
if (!is_array($payload)) $payload = array();

if ($route === 'data' && $method === 'GET') {
    echo json_encode(sanitizePublicDbPhp($db));
    exit;
}

if ($route === 'bookings/hold' && $method === 'POST') {
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
    if ($holdToken !== '') {
        $filtered = array();
        foreach ($db['boothHolds'] as $h) {
            if (($h['holdToken'] ?? '') !== $holdToken) $filtered[] = $h;
        }
        $db['boothHolds'] = $filtered;
    } else {
        $holdToken = bin2hex(random_bytes(16));
    }
    $nowMs = round(microtime(true) * 1000);
    $holdRecord = array(
        'holdId' => 'HLD-' . strtoupper(bin2hex(random_bytes(3))),
        'holdToken' => $holdToken,
        'boothCode' => $boothCode,
        'cities' => $cities,
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
        'status' => 'Awaiting Payment',
        'paymentExpiresAt' => gmdate('c', time() + 86400),
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
    $bookingId = strtoupper(trim($payload['bookingId'] ?? ($payload['ref'] ?? '')));
    $rawPhone = trim($payload['phone'] ?? '');
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
    if ($stLower !== 'paid' && $stLower !== 'confirmed') {
        $cfg = getSelcomConfigPhp();
        if ($cfg['configured']) {
            $live = querySelcomOrderStatusPhp($found['id']);
            if (!empty($live['paid'])) {
                $found['status'] = 'Paid';
                $found['paymentExpiresAt'] = null;
                $found['paidAt'] = gmdate('c');
                if (!empty($live['reference'])) $found['selcomReference'] = $live['reference'];
                writeDbPhp($db);
            }
        }
    }

    $pinMatches = ($pin !== '' && isset($found['accessPin']) && (string)$found['accessPin'] === $pin);
    $tokenMatches = (!empty($payload['manageToken']) && isset($found['manageToken']) && $found['manageToken'] === $payload['manageToken']);
    $unmasked = $pinMatches || $tokenMatches || empty($found['accessPin']);

    if ($route === 'bookings/manage') {
        if (!$unmasked) {
            http_response_code(403);
            echo json_encode(array('success' => false, 'error' => 'PIN ya usalama ya tarakimu 6 si sahihi.'));
            exit;
        }
        if ($action === 'switch_booth') {
            $newCode = strtoupper(trim($payload['newBoothCode'] ?? ''));
            if ($newCode !== '') {
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
            }
        } elseif ($action === 'cancel') {
            $oldCode = $found['boothCode'];
            $found['status'] = 'Cancelled';
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

if ($route === 'admin/set-destination' && $method === 'POST') {
    if (empty($_COOKIE['tbf_admin_session']) || strpos($_COOKIE['tbf_admin_session'], '.') === false) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'error' => 'Admin authentication required'));
        exit;
    }
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

if (($route === 'attendee-rsvp' || $route === 'newsletter/subscribe') && $method === 'POST') {
    if ($route === 'attendee-rsvp') {
        $db['analytics']['totalRegisteredAttendees'] = max(240, (int)($db['analytics']['totalRegisteredAttendees'] ?? 240)) + 1;
        writeDbPhp($db);
    }
    echo json_encode(array('success' => true, 'liveStats' => buildLiveStatsPhp($db)));
    exit;
}

echo json_encode(array('success' => true, 'authenticated' => false));
