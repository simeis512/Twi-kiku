<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<meta name="Keywords" content="Twitter,音楽,ミュージック,ミュージックプレイヤー,music,music player,ツイキク,twi kiku">
<meta name="Description" content="Twitter上の音楽を連続再生したりループ再生したりできるサービスです">
<meta name="theme-color" content="#fff">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Cache-Control" content="no-cache">
<?php
	$value = '';
	if (isset($_GET['q'])) {
		$value = $_GET['q'];
	} elseif (isset($_GET['user'])) {
		$value = 'user:'. $_GET['user'];
	}
	$extraTitle = ($value === '' ? '' : ' | '. htmlspecialchars($value, ENT_QUOTES, 'UTF-8'));
?>
<title>ツイキク<?php echo $extraTitle ?></title>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="https://w.soundcloud.com/player/api.js" type="text/javascript"></script>
<script src="https://www.youtube.com/iframe_api" type="text/javascript"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
<script src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
<script src="js/player.js" type="text/javascript"></script>
<script src="js/playlist.js" type="text/javascript"></script>
<script src="js/main.js" type="text/javascript"></script>
<link rel="apple-touch-icon" type="image/png" href="./apple-touch-icon-180x180.png">
<link rel="icon" href="./favicon.ico">
<link href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" rel="stylesheet" integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU" crossorigin="anonymous">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link href="http://mplus-fonts.sourceforge.jp/webfonts/basic_latin/mplus_webfonts.css" rel="stylesheet" type="text/css">
<link href="http://mplus-fonts.sourceforge.jp/webfonts/general-j/mplus_webfonts.css" rel="stylesheet" type="text/css">
<!--<link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" rel="stylesheet">-->
<link href="css/materialize-toast.css" rel="stylesheet" type="text/css">
<link href="css/controller.css" rel="stylesheet" type="text/css">
<link href="css/player.css" rel="stylesheet" type="text/css">
<link href="css/main.css" rel="stylesheet" type="text/css">
</head>

<body>

<div id="app">

<header>
	<a href="." id="logo">ツイキク</a>
	<?php
		session_start();
		if (isset($_SESSION['access_token'])) {
			echo '<a href="php/logout.php" id="logout">ログアウト<i class="fas fa-sign-out-alt"></i></a>';
		}
	?>
</header>

<div id="main">

<?php

if (!isset($_SESSION['access_token'])) {
	echo <<<EOT
		<div id="top-page">
			<a href="php/login.php?{$_SERVER['QUERY_STRING']}" id="login"><i class="fab fa-twitter"></i> Twitterでログイン <i class="fas fa-sign-in-alt"></i></a>
			<div>
				<p>Twitter上の音楽を連続再生したりループ再生したりできるサービスです</p>
				<p>※ TwitterのAPIを使用するためTwitterアカウントが必要です</p>
			</div>
		</div>
EOT;
} else {
	//callback.phpからセッションを受け継ぐ
	/*echo "<p>ID：". $_SESSION['id'] . "</p>";
	echo "<p>名前：". $_SESSION['name'] . "</p>";
	echo "<p>スクリーン名：". $_SESSION['screen_name'] . "</p>";
	echo "<p>最新ツイート：" .$_SESSION['text']. "</p>";
	echo "<p><img src=".$_SESSION['profile_image_url_https']."></p>";
	echo "<p>access_token：". $_SESSION['access_token']['oauth_token'] . "</p>";*/
	
	echo <<<EOT
		<form id="search">
			<input type="text" name="q" value="{$value}"><button type="submit">検索</button>
		</form>
EOT;
	
	echo <<<EOT
		<div id="main-player" data-screen-name="{$_SESSION['screen_name']}">
			<div class="main-player-container">
				<div class="control-button-container">
					<div class="prev"></div>
					<div class="media-area">
						<div class="media-front-wrapper"></div>
					</div>
					<div class="next"></div>
				</div>
				<div class="controller">
					<div class="seekbar">
						<span class="current-time"></span>
						<div class="progress">
							<input type="range" value="0" min="0" max="1" step="0.01">
							<div class="complete"></div>
						</div>
						<span class="remain-time"></span>
					</div>
					<div class="loop-setting">
						<div class="loop-mode-selector">
							<label><input type="radio" name="loop-mode" value="LOOP_NONE" checked><span><i class="material-icons">playlist_add</i>オートロード</span></label>
							<label><input type="radio" name="loop-mode" value="LOOP_ALL"><span><i class="material-icons">repeat</i>全曲ループ</span></label>
							<label><input type="radio" name="loop-mode" value="LOOP_CURRENT"><span><i class="material-icons">repeat_one</i>１曲ループ</span></label>
						</div>
						<div class="play-direction disable"><i class="fas fa-arrow-down"></i></div>
					</div>
				</div>
				<div class="twitter-controll">
					<div class="twitter-action">
						<div class="retweet-action">
							<span class="retweet-button"><i class="fas fa-retweet"></i></span>
							<span class="auto-retweet">オート</span>
						</div>
						<div class="favorite-action">
							<span class="favorite-button"><i class="far fa-heart"></i></span>
							<span class="auto-favorite">オート</span>
						</div>
					</div>
					<div class="tweet-action">
						<textarea class="tweet-textarea"></textarea>
						<div class="tweet-submit">
							<div class="quote-retweet-button"><i class="fas fa-retweet"></i>引用RT</div>
							<div class="reply-button"><i class="fas fa-reply"></i>リプライ</div>
						</div>
					</div>
				</div>
			</div>
			<div class="slide-tab" style="display:none"></div>
		</div>
		<div id="playlist" data-q="{$_GET['q']}" data-user="{$_SESSION['screen_name']}">
			<div id="next-loader">&emsp;&emsp;ツイートをロードしています</div>
		</div>
EOT;
}

?>

</div>

<footer></footer>

</div>

</body>
</html>
