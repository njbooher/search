<?php

ob_start();

$content = '';

/**
 * URL to forward requests to
 */
$request_url = 'http://google.iastate.edu:80/search';

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

// retrieve response (headers and content)
$response = curl_exec($ch);

if (curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200) {

  $response_header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  $response_headers_unsplit = substr($response, 0, $response_header_size);
  $response_content = substr($response, $response_header_size);

  $response_doc = new DOMDocument('1.0', 'iso-8859-1');

  if ($response_doc->loadXML($response_content)) {

    $stylesheet = new DOMDocument('1.0', 'iso-8859-1');

    if ($stylesheet->load('stylesheet.xsl')) {

      $transformer = new XSLTProcessor();
      $transformer->importStylesheet($stylesheet);
      $transformed_content = $transformer->transformToXML($response_doc);

      if ($transformed_content !== FALSE) {

        $content = ")]}'," . $transformed_content;

      }

    }

  }

}

curl_close($ch);

ob_end_clean();

header('Content-Type: application/json; charset=UTF-8', TRUE);
print $content;
