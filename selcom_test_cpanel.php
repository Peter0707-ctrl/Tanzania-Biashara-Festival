<?php
/**
 * Selcom Live Account & Merchant Name Inspector (CLI tool for cPanel IP 102.223.19.7)
 * Reads SELCOM_* from .env and runs a live TZS 200 order check against Selcom API.
 */
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('CLI only');
}

function loadDotEnvCli() {
    $candidates = array(
        __DIR__ . '/.env',
        '/home/reliancetech/www.biasharafestival.co.tz/.env',
        '/home/reliancetech/.env'
    );
    $vars = array();
    foreach ($candidates as $f) {
        if (file_exists($f)) {
            foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $t = trim($line);
                if ($t === '' || $t[0] === '#') continue;
                $p = strpos($t, '=');
                if ($p > 0) {
                    $k = trim(substr($t, 0, $p));
                    $v = trim(substr($t, $p + 1), " \t\n\r\0\x0B\"'");
                    if ($k !== '' && empty($vars[$k])) $vars[$k] = $v;
                }
            }
        }
    }
    return $vars;
}

$env = loadDotEnvCli();
$vendor = $env['SELCOM_VENDOR_ID'] ?? ($env['SELCOM_VENDOR'] ?? '');
$apiKey = $env['SELCOM_API_KEY'] ?? '';
$apiSecret = $env['SELCOM_API_SECRET'] ?? '';
$rawBase = rtrim($env['SELCOM_BASE_URL'] ?? 'https://apigw.selcommobile.com', '/');
$baseUrl = preg_replace('/\/v1$/i', '', $rawBase);

if (!$vendor || !$apiKey || !$apiSecret) {
    echo "ERROR: SELCOM credentials missing in .env\n";
    exit(1);
}

$orderId = 'TBF-CHK-' . time();
$payload = array(
    'vendor' => $vendor,
    'order_id' => $orderId,
    'buyer_email' => 'info@biasharafestival.co.tz',
    'buyer_name' => 'Tanzania Biashara Festival',
    'buyer_phone' => '255767053250',
    'amount' => 200,
    'currency' => 'TZS',
    'buyer_remarks' => 'Tanzania Biashara Festival Booth Test',
    'merchant_remarks' => 'Tanzania Biashara Festival',
    'no_of_items' => 1,
    'webhook' => base64_encode('https://biasharafestival.co.tz/api/webhooks/selcom')
);

$timestamp = gmdate('Y-m-d\TH:i:s\Z');
$keys = array_keys($payload);
$signedFields = implode(',', $keys);
$parts = array('timestamp=' . $timestamp);
foreach ($keys as $k) {
    $parts[] = $k . '=' . $payload[$k];
}
$digest = base64_encode(hash_hmac('sha256', implode('&', $parts), $apiSecret, true));
$auth = base64_encode($apiKey);

$ch = curl_init($baseUrl . '/v1/checkout/create-order-minimal');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: SELCOM ' . $auth,
    'Digest-Method: HS256',
    'Digest: ' . $digest,
    'Timestamp: ' . $timestamp,
    'Signed-Fields: ' . $signedFields
));
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
$raw = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "====================================================\n";
echo "SELCOM API TEST FROM CPANEL SERVER (VENDOR: $vendor)\n";
echo "====================================================\n";
echo "HTTP Status : $httpCode\n";
echo "Raw Response: $raw\n";

$json = json_decode($raw, true);
if (is_array($json) && !empty($json['data'][0]['payment_gateway_url'])) {
    $gwUrl = base64_decode($json['data'][0]['payment_gateway_url']);
    echo "Checkout URL: $gwUrl\n";
    $ch2 = curl_init($gwUrl);
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch2, CURLOPT_TIMEOUT, 10);
    $html = curl_exec($ch2);
    curl_close($ch2);
    if ($html) {
        if (preg_match('/<title>([^<]+)<\/title>/i', $html, $m)) {
            echo "Page Title  : " . trim($m[1]) . "\n";
        }
        if (preg_match_all('/(?:merchant|vendor|business|company|pay\s+to|name)["\'\s:>]+([A-Za-z0-9\s&\.\-_]{3,60})/i', $html, $matches)) {
            echo "Detected Names on Checkout: " . implode(' | ', array_unique(array_slice($matches[1], 0, 5))) . "\n";
        }
    }
}
echo "====================================================\n";
