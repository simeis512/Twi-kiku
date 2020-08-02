<?php

if (realpath($_SERVER['SCRIPT_FILENAME']) == realpath(__FILE__)) {
	try {
		if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
			throw new Exception('Ajax only page.');
		}
		
		require_once __DIR__ .'/tweet.php';
		postTweet($_POST);
	} catch (Exception $e) {
		die(json_encode(['errors'=>[['code'=>'null','message'=>$e->getMessage()]]]));
	}
}
