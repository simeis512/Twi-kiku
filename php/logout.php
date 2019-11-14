<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<meta name=”theme-color” content=”#fff″>
<title>ツイキク</title>
<link rel="apple-touch-icon" type="image/png" href="./apple-touch-icon-180x180.png">
<link rel="icon" href="./favicon.ico">
<link href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" rel="stylesheet" integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU" crossorigin="anonymous">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link href="http://mplus-fonts.sourceforge.jp/webfonts/basic_latin/mplus_webfonts.css" rel="stylesheet" type="text/css">
<link href="http://mplus-fonts.sourceforge.jp/webfonts/general-j/mplus_webfonts.css" rel="stylesheet" type="text/css">
<link href="../css/main.css" rel="stylesheet" type="text/css">
</head>

<body>

<div id="app">

<header>
	<a href="." id="logo">ツイキク</a>
</header>

<div id="main">

<?php

session_start();

//セッション変数を全て解除
$_SESSION = array();
 
//セッションクッキーの削除
if (isset($_COOKIE["PHPSESSID"])) {
    setcookie("PHPSESSID", '', time() - 1800, '/');
}
 
//セッションを破棄する
session_destroy();

echo <<<EOT
	<div id="top-page">
		<div>ログアウトしました</div>
		<div><a href='..'>トップページへ</a></div>
	</div>
EOT;

?>

</div>

<footer></footer>

</div>

</body>
</html>
