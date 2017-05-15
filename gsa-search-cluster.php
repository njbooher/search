<?php

ob_start();

$content = '';

/**
 * URL to forward requests to
 */
$request_url = 'http://google.iastate.edu:80/cluster';

// append query string for GET requests
if (count($_GET) > 0) {
  $request_url .= '?' . http_build_query($_GET);
}

// let the request begin
$ch = curl_init($request_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);     // return response
curl_setopt($ch, CURLOPT_HEADER, true);       // enabled response headers
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS,  http_build_query($_POST));

// retrieve response (headers and content)
$response = curl_exec($ch);

if (curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200) {
  $response_header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  $response_headers_unsplit = substr($response, 0, $response_header_size);
  $response_content = substr($response, $response_header_size);
  $content = $response_content;
}

curl_close($ch);

ob_end_clean();

header('Content-Type: application/json; charset=UTF-8', TRUE);
print $content;
