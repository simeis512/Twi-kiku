<?php
//ini_set('display_errors', "On");
session_start();

require_once $_SERVER['DOCUMENT_ROOT'] .'../keys/twi-kiku_oauth_key.php';

$consumerKey = API_KEY;
$consumerSecret = API_SECRET;

//ライブラリを読み込む
require_once $_SERVER['DOCUMENT_ROOT'] .'../vendor/autoload.php';

//oauth_tokenとoauth_verifierを取得
if ($_SESSION['oauth_token'] == $_GET['oauth_token'] and $_GET['oauth_verifier']) {
	
	//Twitterからアクセストークンを取得する
	$connection = new Abraham\TwitterOAuth\TwitterOAuth($consumerKey, $consumerSecret, $_SESSION['oauth_token'], $_SESSION['oauth_token_secret']);
	$access_token = $connection->oauth('oauth/access_token', ['oauth_verifier' => $_GET['oauth_verifier']]);

	//取得したアクセストークンでユーザ情報を取得
	$user_connection = new Abraham\TwitterOAuth\TwitterOAuth($consumerKey, $consumerSecret, $access_token['oauth_token'], $access_token['oauth_token_secret']);
	$user_info = $user_connection->get('account/verify_credentials');	
	
	// ユーザ情報の展開
	//var_dump($user_info);
	
	//適当にユーザ情報を取得
	$id = $user_info->id;
	$name = $user_info->name;
	$screen_name = $user_info->screen_name;
	$profile_image_url_https = $user_info->profile_image_url_https;
	$text = $user_info->status->text;
	
	//各値をセッションに入れる
	$_SESSION['access_token'] = $access_token;
	$_SESSION['id'] = $id;
	$_SESSION['name'] = $name;
	$_SESSION['screen_name'] = $screen_name;
	$_SESSION['text'] = $text;
	$_SESSION['profile_image_url_https'] = $profile_image_url_https;
	
	header('Location: ..'. (isset($_SERVER['QUERY_STRING']) ? '?'.preg_replace('/&oauth.+$/', '', $_SERVER['QUERY_STRING']) : ''));
	exit();
} else {
	header('Location: ..');
	exit();
}
