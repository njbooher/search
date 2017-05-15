<?php

ob_start();

$content = '';

// let the request begin
$ch = curl_init();
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);     // return response
curl_setopt($ch, CURLOPT_HEADER, true);       // enabled response headers
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);

curl_setopt($ch, CURLOPT_URL, 'http://api.ent.iastate.edu/ss/' . md5($_GET['url'] . '1024') . '.png');

// retrieve response (headers and content)
$response = curl_exec($ch);

$response_content = '';

if (curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200) {
  $response_header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  $response_content = substr($response, $response_header_size);
} else {
  $modified_GET = array('uri' => $_GET['url']);
  curl_setopt($ch, CURLOPT_URL, 'http://api.ent.iastate.edu/screenshot/generate.wsgi?' . http_build_query($modified_GET));
  $response = curl_exec($ch);
  if (curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200) {
    $response_header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $response_content = substr($response, $response_header_size);
  }
}

curl_close($ch);

if (!empty($response_content)) {

  $image = imagecreatefromstring($response_content);

  if ($image !== FALSE) {

    $image = imagescale($image, 200);

    if ($image !== FALSE) {

      $image = imagecrop($image, array('x' => 0, 'y' => 0, 'width' => 200, 'height' => 150));

      if ($image !== FALSE) {

        ob_start();

        if (imagepng($image)) {
          $content = ob_get_contents();
        }

        ob_end_flush();

        imagedestroy($image);

      }

    }

  }

}

ob_end_clean();

header('Content-Type: image/png', TRUE);
print $content;
