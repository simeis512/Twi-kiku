<?php

if (realpath($_SERVER['SCRIPT_FILENAME']) == realpath(__FILE__)) {
	try {
		if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
			throw new Exception('Ajax only page.');
		}
		
		if (!isset($_POST['status'])) {
			throw new Exception('Not assigned tweet text.');
		}
		if (!isset($_POST['tweet_url'])) {
			throw new Exception('Not assigned target tweet.');
		}
		
		$post = [
			'status' => $_POST['status'] . PHP_EOL . $_POST['tweet_url']
		];
	
		require_once __DIR__ .'/tweet.php';
		postTweet($post);
	} catch (Exception $e) {
		die(json_encode(['errors'=>[['code'=>'null','message'=>$e->getMessage()]]]));
	}
}

?>
