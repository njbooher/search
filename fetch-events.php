<?php

ob_start();

$content = '';

/**
 * URL to forward requests to
 */
$request_url = 'http://www.event.iastate.edu/rssgen.php?all=1';

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

  $response_doc = new SimpleXMLElement($response_content);

  if ($response_doc) {

    $results = array();

    foreach ($response_doc->channel->item as $item) {

      $item = (array) $item[0];

      $event_datetime = DateTime::createFromFormat(DateTime::RSS, $item['pubDate']);
      $event_utcdatetime = clone $event_datetime;
      $event_utcdatetime->setTimezone(new DateTimeZone('UTC'));

      $results[] = array(
        'guid' => $item['link'],
        'summary' => $item['title'],
        'description' => $item['description'],
        'eventlink' => $item['link'],
        'recurrenceId' => '',
        'formattedDate' => $event_datetime->format('l, M j, Y g:i A - g:i A'),
        'start' => array(
          'allday' => "false",
          'shortdate' => $event_datetime->format('n/j/y'),
          'longdate' => $event_datetime->format('M j, Y'),
          'dayname' => $event_datetime->format('l'),
          'time' => $event_datetime->format('g:i A'),
          'utcdate' => $event_utcdatetime->format('Ymd\THis\Z'),
          'datetime' => $event_datetime->format('Ymd\THis'),
          'timezone' => $event_datetime->format('e'),
        ),
        'end' => array(
          'allday' => "false",
          'shortdate' => $event_datetime->format('n/j/y'),
          'longdate' => $event_datetime->format('M j, Y'),
          'dayname' => $event_datetime->format('l'),
          'time' => $event_datetime->format('g:i A'),
          'utcdate' => $event_utcdatetime->format('Ymd\THis\Z'),
          'datetime' => $event_datetime->format('Ymd\THis'),
          'timezone' => $event_datetime->format('e'),
        ),
        'location' => array()
      );

    }

    if (!empty($results)) {

      $response = array(
        'bwEventList' => array(
          'resultSize' => (string) count($results),
          'paged' => 'true',
          'events' => $results
        )
      );

      $content = json_encode($response, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);

    }

  }

}

curl_close($ch);

ob_end_clean();

header('Content-Type: application/json; charset=UTF-8', TRUE);
print $content;
