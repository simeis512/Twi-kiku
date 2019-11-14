<?php
session_start();

if (realpath($_SERVER['SCRIPT_FILENAME']) == realpath(__FILE__)) {
	try {
		if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
			throw new Exception('Ajax only page.');
		}
		
		doRetweet($_POST);
	} catch (Exception $e) {
		die(json_encode(['errors'=>[['code'=>'null','message'=>$e->getMessage()]]]));
	}
}


function doRetweet($post) {
	if (!isset($_SESSION['access_token'])) {
		throw new Exception('Not logged in.');
	}
	
	if (!isset($post['id'])) {
		throw new Exception('Not assigned tweet ID.');
	}
	
	require_once $_SERVER['DOCUMENT_ROOT'] .'../vendor/autoload.php';
	//use Abraham\TwitterOAuth\TwitterOAuth;
	
	require_once $_SERVER['DOCUMENT_ROOT'] .'../keys/twi-kiku_oauth_key.php';
	
	$consumerKey = API_KEY;
	$consumerSecret = API_SECRET;
	$accessToken = $_SESSION['access_token']['oauth_token'];
	$accessTokenSecret = $_SESSION['access_token']['oauth_token_secret'];
	
	$twitter = new Abraham\TwitterOAuth\TwitterOAuth($consumerKey, $consumerSecret, $accessToken, $accessTokenSecret);
	$result = $twitter->post(
		'statuses/retweet/'. $post['id']
	);
	
	if ($twitter->getLastHttpCode() == 200) {
		// ツイート成功
				// ツイート成功
		echo json_encode(['success'=>[['message'=>'Tweet retweeted.']]]);
	} else {
		// ツイート失敗
		echo json_encode($result);

	}
}

?>
