<?php

$attributes_to_fetch = array(
  'cn',
  'sn',
  'ou',
  'mail',
  'givenName',
  'uid',
  'cn',
  'title',
  'dept',
  'telephoneNumber',
  'facsimileTelephoneNumber',
  'postalAddress',
);

ob_start();

$results = array();

$ldap_connection = ldap_connect('ldap.iastate.edu');
$ldap_bind = ldap_bind($ldap_connection);
$ldap_search = ldap_search($ldap_connection, 'dc=iastate,dc=edu', '(|(uid= ' . ldap_escape($_GET['term'], LDAP_ESCAPE_FILTER) . ')(cn=*' . ldap_escape($_GET['term'], LDAP_ESCAPE_FILTER) . '*))', $attributes_to_fetch);

$ldap_entry = ldap_first_entry($ldap_connection, $ldap_search);

if ($ldap_entry) {
  do {
    $result = array();
    foreach ($attributes_to_fetch as $attribute) {
      $values = ldap_get_values($ldap_connection, $ldap_entry, $attribute);
      if ($values['count'] > 0) {
        $result[strtolower($attribute)] = $values[0];
      }
    }
    $result['uni'] = $result['uid'];
    unset($result['uid']);
    $results[] = $result;
  } while ($ldap_entry = ldap_next_entry($ldap_connection, $ldap_entry));
}

$content = json_encode($results, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);

ob_end_clean();

header('Content-Type: application/json; charset=UTF-8', TRUE);

print $content;
