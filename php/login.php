<?php
//ini_set('display_errors', "On");
session_start();

require_once $_SERVER['DOCUMENT_ROOT'] .'../keys/twi-kiku_oauth_key.php';

$consumerKey = API_KEY;
$consumerSecret = API_SECRET;

//Callback URL
$callback = 'http://twi-kiku.com/php/callback.php'. (isset($_SERVER['QUERY_STRING']) ? '?'.$_SERVER['QUERY_STRING'] : '');

//ライブラリを読み込む
require_once $_SERVER['DOCUMENT_ROOT'] .'../vendor/autoload.php';

//TwitterOAuthのインスタンスを生成し、Twitterからリクエストトークンを取得する
$connection = new Abraham\TwitterOAuth\TwitterOAuth($consumerKey, $consumerSecret);
$request_token = $connection->oauth("oauth/request_token", ["oauth_callback" => $callback]);

//リクエストトークンはcallback.phpでも利用するのでセッションに保存する
$_SESSION['oauth_token'] = $request_token['oauth_token'];
$_SESSION['oauth_token_secret'] = $request_token['oauth_token_secret'];

// Twitterの認証画面へリダイレクト
$url = $connection->url("oauth/authenticate", ["oauth_token" => $request_token['oauth_token']]);
header('Location: ' . $url);

?>
