<?php
session_start();

$isDebug = false;

if (realpath($_SERVER['SCRIPT_FILENAME']) == realpath(__FILE__)) {
	try {
		if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
			throw new Exception('Ajax only page.');
		}
		
		print(getTweets($_GET));
	} catch (Exception $e) {
		die(json_encode(['errors'=>[['code'=>'null','message'=>$e->getMessage()]]]));
	}
}


function getTweets($get) {
	if (!isset($_SESSION['access_token'])) {
		throw new Exception('Not logged in.');
	}
	
	/*if (!isset($get['q']) && !isset($get['user'])) {
		throw new Exception('Not assigned search word.');
	}*/
	
	$params = [
		'count' => 50,
		'include_entities' => true,
		'tweet_mode' => 'extended'
	];
	
	if (isset($get['q'])) {
		$endPoint = 'search/tweets';
		$params['q'] = $get['q'];
		$params['exclude'] = 'retweets';
		$params['result_type'] = 'recent';
	} elseif(isset($get['user'])) {
		$endPoint = 'statuses/user_timeline';
		$params['screen_name'] = $get['user'];
		$params['include_rts'] = false;
	} else {
		$endPoint = 'statuses/home_timeline';
		$params['include_rts'] = false;
		$params['count'] = 70;
	}
	
	if (isset($get['max_id'])) {
		$params['max_id'] = $get['max_id'] - 1;
	}
	
	if (isset($get['count'])) {
		$params['count'] = min($get['count'], 100);
	}
	
	require_once $_SERVER['DOCUMENT_ROOT'] .'../vendor/autoload.php';
	//use Abraham\TwitterOAuth\TwitterOAuth;
	
	require_once __DIR__ .'/playerFactory.php';
	
	require_once $_SERVER['DOCUMENT_ROOT'] .'../keys/twi-kiku_oauth_key.php';
	
	$consumerKey = API_KEY;
	$consumerSecret = API_SECRET;
	$accessToken = $_SESSION['access_token']['oauth_token'];
	$accessTokenSecret = $_SESSION['access_token']['oauth_token_secret'];
	
	$twitter = new Abraham\TwitterOAuth\TwitterOAuth($consumerKey, $consumerSecret, $accessToken, $accessTokenSecret);
	$result = $twitter->get(
		$endPoint,
		$params
	);
	
	if ($twitter->getLastHttpCode() == 200) {
		// ツイート取得成功
		debugPrint('get tweet.'. PHP_EOL);
		//var_dump($result->statuses);
		$dataTmp = [];
		$lastId = 0;
		if (isset($get['q'])) {
			$tweets = $result->statuses;
		} else {
			$tweets = $result;
		}
		
		$tweetCount = 0;
		
		foreach ($tweets as $tweet) {
			$tweetCount++;
			
			$data = [];
			$data['tweet_id'] = $tweet->id_str;
			$data['tweet_text'] = $tweet->full_text;
			$data['name'] = $tweet->user->name;
			$data['screen_name'] = $tweet->user->screen_name;
			$data['icon_url'] = str_replace('normal', 'bigger', $tweet->user->profile_image_url_https);
			$data['following'] = $tweet->user->following;
			$data['retweeted'] = $tweet->retweeted;
			$data['favorited'] = $tweet->favorited;
			$data['created_at'] = $tweet->created_at;
			$data['time'] = strtotime($tweet->created_at);
			
			if ($endPoint === 'search/tweets') {
				$statusResult = $twitter->get(
					'statuses/show',
					['id' => $tweet->id_str, 'trim_user' => false]
				);
				
				if ($twitter->getLastHttpCode() == 200) {
					$data['following'] = $statusResult->user->following;
					$data['retweeted'] = $statusResult->retweeted;
					$data['favorited'] = $statusResult->favorited;
				}
			}
			
			$lastId = $tweet->id_str;
			
			debugPrint('<br>');
			
			debugPrint('<a href="https://twitter.com/'. $tweet->user->screen_name .'/status/'. $tweet->id .'">'. $tweet->full_text .'</a>');
			debugPrint('<br>');
			/*var_dump($tweet->entities->urls[0]->expanded_url);
			print('<br>');
			//var_dump($tweet->entities->media[0]);
			//print('<br>');
			var_dump($tweet->extended_entities->media[0]->video_info->variants[0]->url);
			print('<br>');
			print('<br>');
			
			$url = $tweet->entities->urls[0]->expanded_url;
			if (is_null($url)) {
				$url = $tweet->extended_entities->media[0]->video_info->variants[0]->url;
			}
			print($url);
			print('<br>');*/
			debugPrint('<img src="'. $tweet->user->profile_image_url .'">');
			list ($service, $url) = getServiceAndUrl($tweet);

			$data['html'] = null;
			$data['service'] = null;
			$data['service_url'] = null;

			if (!is_null($service)) {
				debugPrint('<a href="'. $url .'" target="_blank">'. $service .'</a>');
				debugPrint('<br>');
				
				$data['html'] = getHtmlCode($service, $url);
				if (!is_null($data['html'])) {
					$data['service'] = $service;
					$data['service_url'] = $url;
				}
			} else {
				continue;
			}
			
			$dataTmp[] = $data;
		}
		
		$ret = [];
		$ret['tweets'] = $dataTmp;
		$ret['last_id'] = $lastId;
		$ret['tweet_count'] = $tweetCount;
		
		//$ret['result'] = $result;
		/*print('<pre>');
		var_dump($ret);
		print('</pre>');*/
		//return json_encode($ret);
		return json_encode(['success'=>[['message'=>$ret]]]);
	} else {
		// ツイート失敗
		echo json_encode($result);
	}
}

function getServiceAndUrl($tweet) {
	if (isset($tweet->extended_entities)) {
		$bitrate = -1;
		foreach ($tweet->extended_entities->media[0]->video_info->variants as $variant) {
			if (!isset($variant->bitrate)) continue;
			if ($variant->bitrate >= $bitrate) {
				$bitrate = $variant->bitrate;
				$url = $variant->url;
			}
		}
		if (isset($url)) {
			//var_dump($tweet->extended_entities->media[0]->video_info);
			return ['twitter', $url];
		}
	}
	
	foreach ($tweet->entities->urls as $url_data) {
		$url = $url_data->expanded_url;
		
		$service = whichService($url);
		if (!is_null($service)) return [$service, $url];
	}
	
	return [null, null];
}

function whichService($url) {
	$list = [	/*'/video\.twimg\.com/' => 'twitter',*/
					'/soundcloud/' => 'soundcloud',
					'/youtube|youtu.be/' => 'youtube',
					'/creofuga/' => 'creofuga',
					'/mqube/' => 'mqube',
					'/hearthis\.at/' => 'hearthisat',
					'/allihoopa/' => 'allihoopa',
					'/bandcamp/' => 'bandcamp',
					'/\.mp3$/' => 'mp3' ];
	
	foreach ($list as $regex => $service) {
		if (preg_match($regex, $url)) {
			return $service;
		}
	}
	
	return null;
}

function getHtmlCode($service, $url) {
	require_once __DIR__ .'/playerFactory.php';
	return generatePlayer($service, $url);
}

function debugPrint($text) {
	global $isDebug;
	if ($isDebug) print($text);
}

?>
