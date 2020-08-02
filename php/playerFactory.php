<?php

function generatePlayer($service, $url) {
	//if (in_array($service, ['soundcloud', 'mqube', 'twitter', 'bandcamp'])) return '';
	
	$body = '<style type=&quot;text/css&quot;>body{display: flex; position: absolute; justify-content: center; align-items: center; margin: 0; width: 100%; height: 100%; color: #fff; font-size: 22px;}</style>';
	$noImage = '<span>No Image</span>';
	$image = '<img src=&quot;%URL%&quot; &quot; width=&quot;300px&quot; height=&quot;300px&quot;>';
	
	if ($service !== 'youtube') {
		$url = explode('?', $url)[0];
	}
	
	switch ($service) {
		case 'twitter':
			$iframe = '<iframe scrolling="no" frameborder="0" srcdoc="'. $body .'<video src=&quot;'. $url .'&quot; width=&quot;300px&quot; height=&quot;300px&quot; style=&quot;object-fit: contain;&quot;></video>"></iframe>';
			break;

		case 'soundcloud':
			$ch = curl_init('https://soundcloud.com/oembed');
			curl_setopt_array($ch, [CURLOPT_POSTFIELDS=>['format'=>'json','url'=>$url], CURLOPT_RETURNTRANSFER=>true]);
			$res = curl_exec($ch);
			curl_close($ch);
			$res = json_decode($res, true);
			preg_match('/src=.+">/', $res['html'], $matchs);
			if (!$res) {
				return null;
			} else {
				$iframe = '<iframe scrolling="no" frameborder="0" allow="autoplay" '. $matchs[0] .'</iframe>';
			}
			break;

		case 'youtube':
			if (strpos($url, 'youtube') !== false) {
				$youtubeID = explode('v=', $url);
			} elseif (strpos($url, 'youtu.be') !== false) {
				$url = explode('?', $url)[0];
				$youtubeID = explode('/', $url);
			}
			$youtubeID = $youtubeID[count($youtubeID)-1];
			$iframe = '<iframe id="youtube-'. $youtubeID .'" scrolling="no" frameborder="0" src="https://www.youtube.com/embed/'. $youtubeID .'?enablejsapi=1" frameborder="0" encrypted-media"></iframe>';
			break;

		case 'mqube':
			preg_match('/<audio.+<\/audio>/', file_get_contents($url), $matchs);
			$mcubeSrc = $body . $noImage .'<div style=&quot;display: none;&quot;>'. $matchs[0] .'</div>';
			$iframe = '<iframe scrolling="no" frameborder="0" srcdoc="'. $mcubeSrc .'"></iframe>';
			break;

		case 'creofuga':
			$creofugaHtml = file_get_contents($url);
			preg_match('/audio-main-content-media-icon".+"/', $creofugaHtml, $matchs);
			$creofugaImg = explode('"', $matchs[0])[4];
			
			$creofugaID = explode('/', $url);
			$creofugaID = $creofugaID[count($creofugaID)-1];
			$creofugaHeader = get_headers('https://creofuga.net/audios/play?id='. $creofugaID);
			foreach ($creofugaHeader as $header) {
				if (preg_match('/^Location: /', $header)) {
					$creofugaMp3 = preg_replace('/^Location: /','', $header);
					break;
				}
			}
			$creofugaSrc = $body . str_replace('%URL%', $creofugaImg, $image) .'<div style=&quot;display: none;&quot;><audio controls src=&quot;'. $creofugaMp3 .'&quot;></audio></div>';
			$iframe = '<iframe scrolling="no" frameborder="0" srcdoc="'. $creofugaSrc .'"></iframe>';
			break;

		case 'hearthisat':
			$hearthisatHtml = file_get_contents($url);
			preg_match('/data-mp3=".+"/', $hearthisatHtml, $matchs);
			$hearthisatHeader = get_headers(explode('"', $matchs[0])[1]);
			$hearthisatAudioSrc = explode('?', preg_replace('@^Location: @','', $hearthisatHeader[9]))[0];
			preg_match('/src="https:\/\/images.+"/', $hearthisatHtml, $matchs);
			$hearthisatImg = explode('"', $matchs[0])[1];
			$hearthisatSrc = $body . str_replace('%URL%', $hearthisatImg, $image)  .'<div style=&quot;display: none;&quot;><audio controls src=&quot;'. $hearthisatAudioSrc .'&quot;></audio><img src=&quot;'. $hearthisatImg .'&quot;></div>';
			$iframe = '<iframe scrolling="no" frameborder="0" srcdoc="'. $hearthisatSrc .'"></iframe>';
			break;

		case 'allihoopa':
			$allihoopaHtml = file_get_contents($url);
			preg_match('/data-audio-url=".+"/', $allihoopaHtml, $matchs);
			$allihoopaAudioSrc = explode('"', $matchs[0])[1];
			preg_match('/data-cover-image-url=".+"/', $allihoopaHtml, $matchs);
			$allihoopaImg = explode('"', $matchs[0])[1];
			$allihoopaSrc = $body . str_replace('%URL%', $allihoopaImg, $image)  .'<div style=&quot;display: none;&quot;><audio controls src=&quot;'. $allihoopaAudioSrc .'&quot;></audio><img src=&quot;'. $allihoopaImg .'&quot;></div>';
			$iframe = '<iframe scrolling="no" frameborder="0" srcdoc="'. $allihoopaSrc .'"></iframe>';
			break;

		case 'bandcamp':
			$bandcampHtml = file_get_contents($url);
			preg_match('/mp3-128":".+"/', $bandcampHtml, $matchs);
			$bandcampAudioSrc = explode('"', $matchs[0])[2];
			preg_match('/popupImage" href=".+"/', $bandcampHtml, $matchs);
			$bandcampImg = explode('"', $matchs[0])[2];
			$bandcampSrc = $body . str_replace('%URL%', $bandcampImg, $image) .'<div style=&quot;display: none;&quot;><audio controls src=&quot;'. $bandcampAudioSrc .'&quot;></audio><img src=&quot;'. $bandcampImg .'&quot;></div>';
			$iframe = '<iframe scrolling="no" frameborder="0" srcdoc="'. $bandcampSrc .'"></iframe>';
			break;

		default:
			return null;
			break;
	}
	
	$music = '<div class="media-iframe">'. $iframe .'</div>';
	
	return '<div class="'. $service .'" data-url="'. $url .'">'. $music .'</div>';
}
