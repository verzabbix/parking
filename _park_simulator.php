<?php

const ZABBIX_API_ENDPOINT = 'http://zabbix/ui/api_jsonrpc.php';
const ZABBIX_API_TOKEN = '0000000000000000000000000000000000000000000000000000000000000000';
const ZABBIX_PARKING_LOT_HOST_NAME = 'My parking lot';

$host = $hostid = ZabbixAPI('host.get', [
	'output' => ['hostid'],
	'selectMacros' => ['macro', 'value'],
	'filter' => [
		'name' => ZABBIX_PARKING_LOT_HOST_NAME
	]
])[0];

$host_macros = array_column($host['macros'], 'value', 'macro');

$groupid = $hostid = ZabbixAPI('hostgroup.get', [
	'output' => ['groupid'],
	'filter' => [
		'name' => $host_macros['{$GROUP}']
	]
])[0]['groupid'];

$spot_hosts = ZabbixAPI('host.get', [
	'output' => ['hostid'],
	'groupids' => [$groupid]
]);
$spot_hostids = array_column($spot_hosts, 'hostid');

$spot_items = ZabbixAPI('item.get', [
	'output' => ['itemid', 'lastvalue'],
	'hostids' => $spot_hostids,
	'filter' => [
		'key_' => ['license_plate']
	]
]);
$spot_items = array_column($spot_items, 'lastvalue', 'itemid');

while (true) {
	$spot_itemid = array_rand($spot_items);
	$spot_lastvalue = $spot_items[$spot_itemid];

	$spot_new_value_empty = $spot_lastvalue !== '' ? rand(1, 3) === 1 : false;
	$spot_new_value = $spot_new_value_empty ? '' : 'LV-' . rand(1000, 9999);

	ZabbixAPI('history.push', [
		'itemid' => $spot_itemid,
		'value' => $spot_new_value
	]);

	$spot_items[$spot_itemid] = $spot_new_value;

	sleep(30);
}

// -----------------------------------------------------------------------------

function ZabbixAPI(string $method, array $params): ?array {
	$ch = curl_init(ZABBIX_API_ENDPOINT);

	$data = [
		'jsonrpc' => '2.0',
		'method' => $method,
		'params' => $params,
		'id' => 1
	];

	$header = [
		'Content-Type: application/json',
		'Authorization: Bearer '.ZABBIX_API_TOKEN
	];

	curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
	curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	$result = curl_exec($ch);

	if ($result === false) {
		throw new Exception('Fatal: curl_exec failed.');
	}

	curl_close($ch);

	$result_json = json_decode($result, JSON_OBJECT_AS_ARRAY | JSON_THROW_ON_ERROR);

	if (!array_key_exists('result', $result_json)) {
		throw new Exception('Fatal: no result returned from API.');
	}

	return $result_json['result'];
}
