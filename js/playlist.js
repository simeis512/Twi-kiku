// JavaScript Document

// 先頭文字大文字化メソッド追加
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// 文字列バイト数取得メソッド追加
String.prototype.bytes = function () {
	return(encodeURIComponent(this).replace(/%../g,"x").length);
}

// Playlistクラス
class Playlist {
	// コンストラクタ
	constructor($mainPlayer, $playlist, $nextLoader, params) {
		// 初期値設定
		this._$mainPlayer = $mainPlayer;
		this._$playlist = $playlist;
		this._$nextLoader = $nextLoader;
		this._params = params;
		
		this._isLoading = false;				// ロード中か
		this._isTerminated = false;				// 取得可能限界に到達したか
		this._isReversePlay = false;			// 逆順再生するか
		
		this._list = [];						// Playerを格納する配列
		//this._mediaTweetCount = 0;				// media要素があるツイートの数
		this._lastId = null;					// 最終取得ツイートID
		this._nowPlaying = -1;					// 再生中のPlayer番号
		this._loopMode = Playlist.LOOP_NONE;	// ループモード
		
		this._autoRetweetEnabled = false;		// オートRT機能の有効/無効
		this._autoFavoriteEnabled = false;		// オートファボ機能の有効/無効
		this._isInputting = false;				// 入力中か
		
		const self = this;

		// シークバークリック時の動作
		this._$mainPlayer.find('.progress input[type="range"]').on('input change', () => {
			const duration = self._focusingPlayer().getDuration();
			self._focusingPlayer().seekTo(Math.floor(duration * self._$mainPlayer.find('.progress input[type="range"]').val()));
			self._$mainPlayer.find('.progress .complete').css('width', self._$mainPlayer.find('.progress input[type="range"]').val()*100 +'%');
		});

		this._$mainPlayer.find('.current-time').on('click', () => {
			self.replay();
		});
		
		// プレイヤーコントローラ操作時の動作
		this._$mainPlayer.find('.prev').on('click', () => {
			self.prev();
		});
		
		this._$mainPlayer.find('.next').on('click', () => {
			self.next();
		});
		
		this._$mainPlayer.find('.media-front-wrapper').on('click', () => {
			self.toggle();
		});

		// ループモード変更時の操作
		this._$mainPlayer.find('input[name="loop-mode"]:radio').on('change', (event) => {
			self._loopMode = eval('Playlist.'+ $(event.currentTarget).val());
			self._$mainPlayer.find('.play-direction').addClass('disable');
			switch (self._loopMode) {
				case Playlist.LOOP_NONE:
					if (!self._isTerminated) {
						self._$nextLoader.slideDown();
					}
					break;
					
				case Playlist.LOOP_ALL:
					self._$nextLoader.slideUp();
					self._$mainPlayer.find('.play-direction').removeClass('disable');
					break;
					
				case Playlist.LOOP_CURRENT:
					self._$nextLoader.slideUp();
					break;
			}
		});
		
		this._$mainPlayer.find('.play-direction').on('click', () => {
			self._isReversePlay = !self._isReversePlay;
			self._$mainPlayer.find('.play-direction i').toggleClass('reversed');
		});
		
		// Twitter関連UIの動作
		this._$mainPlayer.find('.retweet-button').on('click', () => {
			self.doRetweet();
		});
		
		this._$mainPlayer.find('.favorite-button').on('click', () => {
			self.doFavorite();
		});
		
		this._$mainPlayer.find('.auto-retweet').on('click', () => {
			self._autoRetweetEnabled = !self._autoRetweetEnabled;
			self._$mainPlayer.find('.auto-retweet').toggleClass('enable');
		});
		
		this._$mainPlayer.find('.auto-favorite').on('click', () => {
			self._autoFavoriteEnabled = !self._autoFavoriteEnabled;
			self._$mainPlayer.find('.auto-favorite').toggleClass('enable');
		});
		
		this._$mainPlayer.find('.quote-retweet-button').on('click', () => {
			self.doQuoteRetweet();
		});
		
		this._$mainPlayer.find('.reply-button').on('click', () => {
			self.doReply();
		});
		
		this._$mainPlayer.find('.tweet-textarea').on('focus', () => {
			self._isInputting = true;
		}).on('blur', () => {
			self._isInputting = false;
		});
		
		// プレイヤー開閉ボタンの動作
		this._$mainPlayer.find('.slide-tab').on('click', () => {
			self._$mainPlayer.toggleClass('slide-in');
		});
		
		$('#search > input').on('focus', () => {
			self._$mainPlayer.removeClass('slide-in');
		});
		
		// スクロール時の動作
		$(window).on('scroll', () => {
			const winHeight = $(window).height();
			const scrollPos = $(window).scrollTop();
			const lastTweetPos = self._$nextLoader.offset().top;

			if(winHeight + scrollPos > lastTweetPos) {
				self.searchStart();
			}
		});
	}
	
	// Player追加メソッド
	add(player) {
		this._list.push(player);
	}
	
	// Player削除メソッド
	remove(index) {
		this._list.remove(index);
	}
	
	// Player全削除メソッド
	clear() {
		this._list.clear();
	}
	
	// 再生メソッド
	play() {
		// 範囲確認
		if (this._nowPlaying < 0) this._nowPlaying = 0;
		if (this._nowPlaying > this._list.length-1) this._nowPlaying = this._list.length-1;
		
		// 再生と事前処理
		this._focusingPlayer().play();
		this._whenChangePlayState();

		// 終端ならツイート取得
		if (this._nowPlaying >= this._list.length-2) {
			this.searchStart();
		}
	}
	
	// 一時停止メソッド
	pause() {
		// 範囲確認
		if (this._nowPlaying < 0) this._nowPlaying = 0;
		if (this._nowPlaying > this._list.length-1) this._nowPlaying = this._list.length-1;
		
		// 一時停止
		this._focusingPlayer().pause();
		this._whenChangePauseState();
	}
	
	// 停止メソッド
	stop() {
		// 範囲確認
		if (this._nowPlaying < 0) this._nowPlaying = 0;
		if (this._nowPlaying > this._list.length-1) this._nowPlaying = this._list.length-1;
		
		// 停止
		this._focusingPlayer().stop();
		this._whenChangePauseState();
	}
	
	// 再生⇔一時停止メソッド
	toggle() {
		// 範囲確認
		if (this._nowPlaying < 0) this._nowPlaying = 0;
		if (this._nowPlaying > this._list.length-1) this._nowPlaying = this._list.length-1;
		
		// 再生状態トグル＋再生状態で分岐
		const state = this._focusingPlayer().toggle();
		if (state === Player.STATE_PLAY) {
			this._whenChangePlayState();
		} else if (state === Player.STATE_PAUSE) {
			this._whenChangePauseState();
		}
	}
	
	// 最初から再生するメソッド
	replay() {
		this.stop();
		this._updateSeekbar();
		this.play();
	}
	
	// 曲送りメソッド
	next() {
		let nextPos = this._nowPlaying + 1;
		
		// 範囲確認
		if (nextPos > this._list.length-1) nextPos = 0;
		
		this.move(this._list[nextPos]);
	}
	
	// 曲戻しメソッド
	prev() {
		let prevPos = this._nowPlaying - 1;
		
		// 範囲確認
		if (prevPos < 0) prevPos = this._list.length-1;
		
		this.move(this._list[prevPos]);
		/*const currentTime = this._focusingPlayer().getCurrentTime();
		
		// 再生時間で処理分岐
		if (currentTime < 1) {
			this.move(this._list[this._nowPlaying - 1]);
		} else {
			this.stop();
			this.play();
		}*/
	}
	
	// 曲移動メソッド
	move(targetPlayer) {
		// 移動先の特定
		let moveTo = this._nowPlaying;
		for (let i=0; i<this._list.length; ++i) {
			if (this._list[i] === targetPlayer) {
				moveTo = i;
				break;
			}
		}
		
		// 移動先で処理分岐
		if (moveTo === this._nowPlaying) {
			this.toggle();
		} else {
			// 範囲確認
			if (this._nowPlaying < 0) this._nowPlaying = 0;
			if (this._nowPlaying > this._list.length - 1) this._nowPlaying = this._list.length - 1;
			
			// 現在の曲停止
			this.stop();
			this._focusingPlayer().getContainer().removeClass('now-playing');
			this._focusingPlayer().getMedia().parent().hide();
			
			// 次の曲再生
			this._nowPlaying = moveTo;
			this.play();
			this._focusingPlayer().getContainer().addClass('now-playing');
			this._focusingPlayer().getMedia().parent().show();
			
			// Twitter関連アイコン更新
			if (this._focusingPlayer().getData()['retweeted']) {
				this._$mainPlayer.find('.retweet-button').addClass('retweeted').css('font-weight', 'bolder');
			} else {
				this._$mainPlayer.find('.retweet-button').removeClass('retweeted').css('font-weight', 'normal');
			}
			if (this._focusingPlayer().getData()['favorited']) {
				this._$mainPlayer.find('.favorite-button').addClass('favorited').find('i').removeClass('far').addClass('fas');
			} else {
				this._$mainPlayer.find('.favorite-button').removeClass('favorited').find('i').removeClass('fas').addClass('far');
			}
			
			// シークバーリセット
			this._updateSeekbar();
			
			// シークバーの色設定
			this._$mainPlayer.find('.progress .complete').removeClass(function(index, className) {
				return (className.match(/\bservice-\S+/g) || []).join(' ');
			});
			this._$mainPlayer.find('.progress .complete').addClass('service-'+ this._focusingPlayer().getMedia().attr('class'));
			
			// ツイートの位置にスクロール
			$('html,body').animate({scrollTop: this._focusingPlayer().getContainer().offset().top - 8});
		}
	}
	
	// ループモード変更メソッド
	loopModeShift() {
		switch (this._loopMode) {
			case Playlist.LOOP_NONE:
				this._loopMode = Playlist.LOOP_ALL;
				break;

			case Playlist.LOOP_ALL:
				this._loopMode = Playlist.LOOP_CURRENT;
				break;

			case Playlist.LOOP_CURRENT:
				this._loopMode = Playlist.LOOP_NONE;
				break;
		}
	}

	// Twitter関連メソッド
	doRetweet() {
		if (this._focusingPlayer().getData()['retweeted']) {
			return;
		}
		this._focusingPlayer().twitterAction('retweet');
		this._$mainPlayer.find('.retweet-button').addClass('retweeted')
		.find('i').css('font-weight', 'bolder');
		M.toast({html: '<strong>リツイート</strong>しました', classes: 'rounded retweeted'})
	}

	doFavorite() {
		if (this._focusingPlayer().getData()['favorited']) {
			return;
		}
		this._focusingPlayer().twitterAction('favorite');
		this._$mainPlayer.find('.favorite-button').addClass('favorited')
		.find('i').removeClass('far').addClass('fas');
		M.toast({html: '<strong>いいね</strong>しました', classes: 'rounded favorited'})
	}
	
	doQuoteRetweet() {
		this._focusingPlayer().twitterAction('quoteRetweet', this._$mainPlayer.find('.tweet-textarea').val());
		this._$mainPlayer.find('.tweet-textarea').val('');
		M.toast({html: '<strong>引用RT</strong>しました', classes: 'rounded retweeted'})
		this._isInputting = false;
	}

	doReply() {
		this._focusingPlayer().twitterAction('reply', this._$mainPlayer.find('.tweet-textarea').val());
		this._$mainPlayer.find('.tweet-textarea').val('');
		M.toast({ html: '<strong>リプライ</strong>しました', classes: 'rounded replied' })
		this._isInputting = false;
	}
	
	// ツイート取得の開始
	searchStart(count) {
		// ループする場合
		if (this._loopMode !== Playlist.LOOP_NONE) {
			return;
		}

		// 終端に到達している場合
		if (this._isTerminated) {
			return;
		}
		
		// ロード中ではない
		if (!this._isLoading) {
			// ロード中フラグを立てる
			this._isLoading = true;
			
			// 送信データの整形
			let data = {};
			if ('q' in this._params) {
				data['q'] = this._params['q'].replace('%3A', ':');
			} else if ('user' in this._params) {
				data['user'] = this._params['user'];
			}
			
			if (count !== undefined) {
				data['count'] = count;
			}
			if (this._lastId !== null) {
				data['max_id'] = this._lastId;
			}

			const self = this;
			
			// ツイート取得PHPの呼び出し
			$.getJSON(
				'php/getTweets.php',
				data
			)
			.done((json) => {
				// 成功時
				if ('success' in json) {
					const message = json['success'][0]['message'];
					if (message['tweet_count'] === 0) {
						$(window).off('scroll');
						self._isTerminated = true;
						self._$nextLoader.slideUp();
					} else {
						if (self._lastId === message['last_id']) {
							self._isTerminated = true;
							self._$nextLoader.slideUp();
						} else {
							self._lastId = message['last_id'];
							const $additionalPlaylist = $('<div>');
							for (let tweet of message['tweets']) {
								let serviceText;
								switch (tweet['service']) {
									case 'twitter':
										serviceText = '<i class="fab fa-twitter"></i>';
										break;
									case 'soundcloud':
										serviceText = '<i class="fab fa-soundcloud"></i>';
										break;
									case 'youtube':
										serviceText = '<i class="fab fa-youtube"></i>';
										break;
									case 'creofuga':
										serviceText = 'CF';
										break;
									case 'mqube':
										serviceText = 'MQ';
										break;
									case 'hearthisat':
										serviceText = 'hearthis.at';
										break;
									case 'allihoopa':
										serviceText = 'allihoopa';
										break;
									case 'bandcamp':
										serviceText = '<i class="fab fa-bandcamp"></i>';
										break;
									case 'mp3':
										serviceText = '.mp3';
										break;
								}
								

								// ツイート文の整形
								const tweetText = '<div>' + tweet['tweet_text'].split('\n').reduce((text, line) => { return text += '<p>' + line + '&emsp;</p>' }, '') + '</div>';

								// ツイート時刻の整形
								const tweetDate = new Date(tweet['created_at']).toLocaleString();
								
								// ツイートコンテナの生成
								const $tweetContainer = Playlist.$ORIGINAL_TWEET_CONMTAINER.clone()
									.attr({ 'data-tweet-id': tweet['tweet_id'], 'data-screen-name': tweet['screen_name'], 'data-retweeted': tweet['retweeted'], 'data-favorited': tweet['favorited'] })
									.find('a:first').attr('href', 'https://twitter.com/' + tweet['screen_name']).end()
									.find('.icon>img').attr('src', tweet['icon_url']).end()
									.find('.user-name').text(tweet['name']).end()
									.find('.screen-name').text(tweet['screen_name']).end()
									.find('.tweet-text').html(tweetText).end()
									.find('.tweet-text>div').attr('style', 'animation-duration:' + 4000 / tweetText.bytes() + 's').end()
									.find('.service').addClass('service-'+ tweet['service']).html(serviceText).end()
									.find('a:eq(1)').attr('href', tweet['service_url']).end()
									.find('.media').append($(tweet['html'])).end()
									.find('.tweet-link').attr('href', 'https://twitter.com/' + tweet['screen_name'] + '/status/' + tweet['tweet_id']).text(tweetDate).end();

								// ツイート関連UIの処理
								if (!tweet['following'] && tweet['screen_name'] !== $('#main-player').data('screen-name')) {
									twttr.widgets.createFollowButton(tweet['screen_name'], $tweetContainer.find('.follow-button').get(0), {showScreenName: "false", showCount: false, size: "large"});
								}
								/*if (tweet['favorited']) {
									$tweetContainer.find('.favorite-button').addClass('favorited')
										.find('i').removeClass('far').addClass('fas');
								}*/

								// 追加プレイリストにキューイング
								$tweetContainer.appendTo($additionalPlaylist);
							}

							// DOMに追加
							self._pushPlaylists($additionalPlaylist);

							// ツイート文クリック時の動作
							self._$playlist.off('click', '.tweet-text');
							self._$playlist.on('click', '.tweet-text', event => {
								$(event.currentTarget).toggleClass('marquee');
								if ($(event.currentTarget).hasClass('marquee')) {
									$(event.currentTarget).find('div').css('width', '');
								} else {
									$(event.currentTarget).find('div').css('width', 'calc(100% - 40px)');
								}
								//self._$mainPlayer.removeClass('slide-in');
							});
						}
					}
				}
				// 失敗時
				else if ('errors' in json) {
					console.log(json['errors'][0]['message']);
				}
			})
			.fail( (error) => {
				console.log('Ajax error: '+ error.responseText);
			})
			.always( () => {

			});
		}
	}

	// DOMへの追加メソッド
	_pushPlaylists($additionalPlaylist) {
		const self = this;
		
		// 一旦追加プレイリストをDOMに追加
		$additionalPlaylist.appendTo(this._$playlist);

		let mediaTweetNumber = 0;
		
		// プレイリスト走査
		$additionalPlaylist.children().each((number, element) => {
			const $container = $(element);

			// #next-loader前に追加
			$container.detach().insertBefore(this._$nextLoader);

			const $media = $($container.find('.media')[0].children[0]);
			
			// メディアを含まない
			if (!$media[0]) {
				$container.hide();
				return true;
			}
			
			$media.parent().insertBefore(this._$mainPlayer.find('.media-front-wrapper'));
			
			// classからサービスを取得
			const service = $media.attr('class').capitalize();
			
			// サービスからPlayerインスタンス作成
			let player;
			eval('player = new ' + service + '_player($container, $media)');

			// UI操作時の動作
			$container.find('.play-pause-button').on('click', () => {
				this.move(player);
				
				if (self._focusingPlayer().isPaused()) {
					//self._$mainPlayer.removeClass('slide-in');
				} else {
					self._$mainPlayer.addClass('slide-in');
				}
			});
			$container.find('.favorite-button').on('click', () => {
				player.twitterAction('favorite');
				$container.find('.favorite-button').addClass('favorited')
				.find('i').removeClass('far').addClass('fas');
				M.toast({html: '<strong>いいね</strong>しました', classes: 'rounded favorited'})
			});

			// 配列に追加
			this.add(player);

			++mediaTweetNumber;
		});

		// 追加プレイリストを削除
		$additionalPlaylist.remove();

		// ロード中フラグを下げる
		this._isLoading = false;

		// 取得ツイートが少ない
		if (mediaTweetNumber <= 2) {
			this.searchStart();
		}
	}
	
	_focusingPlayer() {
		return this._list[this._nowPlaying];
	}
	
	// シークバーの更新
	_updateSeekbar() {
		const duration = this._focusingPlayer().getDuration();
		const currentTime = this._focusingPlayer().getCurrentTime();
		this._$mainPlayer.find('.current-time').text(toHms(Math.floor(currentTime)));
		this._$mainPlayer.find('.remain-time').text(toHms(Math.floor(duration)));
		this._$mainPlayer.find('.progress input[type="range"]').val(currentTime/duration);
		this._$mainPlayer.find('.progress .complete').css('width', currentTime/duration*100 +'%');
	}
	
	// 再生状態へ移行したとき
	_whenChangePlayState() {
		const self = this;

		// 0.5秒ごとに監視
		this._monitoringInterval = setInterval(() => {
			// 再生が終了しているか
			if (self._focusingPlayer().isEnded()) {
				// ループモードで分岐
				switch (self._loopMode) {
					case Playlist.LOOP_NONE:
						// 文章入力中
						if (self._isInputting) {
							break;
						}
						// オートTwitterアクション機能の実行
						if (self._autoRetweetEnabled) {
							self.doRetweet();
						}
						if (self._autoFavoriteEnabled) {
							self.doFavorite();
						}
						// 最後ではない
						if (self._nowPlaying < self._list.length-1) {
							self.next();
						}
						break;
						
					case Playlist.LOOP_ALL:
						// 文章入力中
						if (self._isInputting) {
							break;
						}
						// オートTwitterアクション機能の実行
						if (self._autoRetweetEnabled) {
							self.doRetweet();
						}
						if (self._autoFavoriteEnabled) {
							self.doFavorite();
						}
						self.stop();
						if (self._isReversePlay) {
							self.prev();
						} else {
							self.next();
						}
						break;
						
					case Playlist.LOOP_CURRENT:
						self.replay();
						break;
				}
			}

			// シークバーの更新
			self._updateSeekbar();
		}, 500);
		
		// UIの更新
		this._$mainPlayer.find('.media-front-wrapper').removeClass('media-pause');
		//this._$mainPlayer.addClass('slide-in');	別にいらなかった
		this._$mainPlayer.find('.slide-tab').fadeIn('fast');
		
		const tweetText = this._list[this._nowPlaying]._$container.find('.tweet-text');
		if (tweetText.hasClass('marquee')) {
			tweetText.click();
		}
	}
	
	// 一時停止状態へ移行したとき
	_whenChangePauseState() {
		// UIの更新
		this._$mainPlayer.find('.media-front-wrapper').addClass('media-pause');

		// 監視終了
		clearInterval(this._monitoringInterval);
	}
	
	static get LOOP_NONE() {
		return 0;
	}
	
	static get LOOP_ALL() {
		return 1;
	}

	static get LOOP_CURRENT() {
		return 2;
	}
	
	static get $ORIGINAL_TWEET_CONMTAINER() {
		return $(
				'<div class="tweet-container">' +
					'<div class="left">' +
						'<div class="play-pause-button pause"></div>' +
					'</div>' +
					'<div class="right">' +
						'<div class="user">' +
							'<a target="_blank">' +
								'<div class="icon"><img></div>' +
								'<div class="user-info">' +
									'<div class="user-name"></div>' +
									'<div class="screen-name"></div>' +
								'</div>' +
							'</a>' +
							'<div class="follow-button"></div>' +
						'</div>' +
						'<div class="tweet-text-container">' +
							'<div class="tweet-text marquee"></div>' +
						'</div>' +
					'</div>' +
					'<a target="_blank"><div class="service"></div></a>' +
					'<div class="media"></div>' +
					/*'<div class="retweet-button"></div>' +
					'<div class="favorite-button"><i class="far fa-heart"></i></div>' +*/
					'<a class="tweet-link" target="_blank"></a>' +
				'</div>'
			);
	}
}

// 秒をh:m:s形式に変換
function toHms(t) {
	let hms = "";
	const h = t / 3600 | 0;
	const m = t % 3600 / 60 | 0;
	const s = t % 60;

	if (h != 0) {
		hms = h + ":" + padZero(m) + ":" + padZero(s);
	} else {
		hms = m + ":" + padZero(s);
	}

	return hms;

	function padZero(v) {
		if (v < 10) {
			return "0" + v;
		} else {
			return v;
		}
	}
}
