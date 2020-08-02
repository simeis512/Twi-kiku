// Playerクラス
class Player {
  // コンストラクタ
  constructor($element, $media) {
    // 初期値設定
    this._$container = $element
    this._$media = $media

    this._isPaused = true         // 一時停止状態か
    this._data = $element.data()  // データ配列
  }
  
  // 再生メソッド
  play() {
    if (this.isPaused() === true) {
      this._isPaused = false
      this._$container.find('.play-pause-button').removeClass('pause').addClass('play')
    }
  }
  
  // 一時停止メソッド
  pause() {
    if (this.isPaused() === false) {
      this._isPaused = true
      this._$container.find('.play-pause-button').removeClass('play').addClass('pause')
    }
  }
  
  // 再生⇔一時停止メソッド
  toggle() {
    if (this.isPaused() === true) {
      this.play()
      this._isPaused = false
      return Player.STATE_PLAY
    } else {
      this.pause()
      this._isPaused = true
      return Player.STATE_PAUSE
    }
  }
  
  // 一時停止状態確認メソッド
  isPaused() {
    return this._isPaused
  }
  
  // メディア取得メソッド
  getMedia() {
    return this._$media
  }
  
  // コンテナ取得メソッド
  getContainer() {
    return this._$container
  }

  // データ取得メソッド
  getData() {
    return this._data
  }
  
  // データ格納メソッド
  setData(data) {
    for (let key in data) {
      this._data[key] = data[key]
    }
    this._$container.data(data)
  }
  
  // Twitter関連メソッド
  twitterAction(action, tweetText) {
    const tweetId = this._data['tweetId']
    const screenName = this._data['screenName']

    let data = {}
    let doneAction = null

    switch(action) {
      case 'retweet':
        data['id'] = tweetId
        doneAction = 'retweeted'
        break

      case 'favorite':
        data['id'] = tweetId
        doneAction = 'favorited'
        break

      case 'quoteRetweet':
        data['tweet_url'] = 'https://twitter.com/'+ screenName +'/status/'+ tweetId
        data['status'] = tweetText
        break

      case 'reply':
        data['in_reply_to_status_id'] = tweetId
        data['status'] = '@'+ screenName +'\n'+ tweetText
        break

      case 'follow':
        data['screen_name']
        doneAction = 'following'
        break
    }

    $.post(
      'php/'+ action +'.php',
      data
    )
    .done( (json) => {
      console.log(json)
      if (doneAction !== null) {
        this._data[doneAction] = true
      }
    })
    .fail( (error) => {
      console.log('Ajax error: '+ error.responseText)
    })
    .always( () => {

    })
  }
  
  /* Virtual method */
  // 停止メソッド
  stop() {
  }
  
  // 曲時間取得メソッド
  getDuration() {
  }
  
  // 再生時間取得メソッド
  getCurrentTime() {
  }
  
  // シークメソッド
  seekTo(seconds) {
  }
  
  // 終了状態確認メソッド
  isEnded() {
  }
  
  static get STATE_PLAY() {
    return 0
  }
  
  static get STATE_PAUSE() {
    return 1
  }
}


class Youtube_player extends Player {
  constructor($element, $media) {
    super($element, $media)
    let youtubeId
    if (this._$media.data('url').indexOf('youtube') != -1) {
      youtubeId = this._$media.data('url').split('v=')
    } else if (this._$media.data('url').indexOf('youtu.be') != -1) {
      youtubeId = this._$media.data('url').split('?')[0].split('/')
    }
    youtubeId = youtubeId[youtubeId.length-1]
    //$('.player-media').append($('<div></div>', {id: 'youtube-'+ youtubeId}))
    //this._player = this._$media.find('iframe')[0].contentWindow
    this._player = new YT.Player('youtube-'+ youtubeId,
                   {
                    videoId: youtubeId,
                    payerVars: { controls: 0, showinfo: 0 }
                   })
  }
  
  play() {
    super.play()
    //this._videoControl('playVideo')
    this._player.playVideo()
  }
  
  pause() {
    super.pause()
    //this._videoControl('pauseVideo')
    this._player.pauseVideo()
  }
  
  _videoControl(action) {
    this._player.postMessage('{"event":"command","func":"'+ action +'","args":""}', '*')
  }
  
  // Virtual method
  stop() {
    this._player.stopVideo()
  }
  
  getDuration() {
    return this._player.getDuration()
  }
  
  getCurrentTime() {
    return this._player.getCurrentTime()
  }
  
  seekTo(seconds) {
    this._player.seekTo(seconds, true)
  }
  
  isEnded() {
    return (this._player.getPlayerState() === YT.PlayerState.ENDED)
  }
}

class Soundcloud_player extends Player {
  constructor($element, $media) {
    super($element, $media)
    this._widget = SC.Widget(this._$media.find('iframe')[0])
    this._isEnded = false
    this._duration = 0
    this._currentTime = 0
    let self = this
    this._widget.bind(SC.Widget.Events.FINISH, () => {
      self._widget.getSounds(sounds => {
        self._widget.getCurrentSoundIndex(soundIndex => {
          if (sounds.length - 1 == soundIndex) {
            self._isEnded = true
          }
        })
      })
    })
    this._widget.bind(SC.Widget.Events.PLAY_PROGRESS, () => {
      self._widget.getDuration(duration => {
        self._duration = duration/1000
      })
      self._widget.getPosition(position => {
        self._currentTime = position/1000
      })
    })
    //setInterval(function(){$('#time').text(self.isEnded() ? 'end' : 'play')}, 100)
  }
  
  play() {
    super.play()
    this._isEnded = false
    this._widget.play()
  }
  
  pause() {
    super.pause()
    this._widget.pause()
  }
  
  // Virtual method
  stop() {
    this.pause()
    this._widget.seekTo(0)
  }
  
  getDuration() {
    return this._duration
  }
  
  getCurrentTime() {
    return this._currentTime
  }
  
  seekTo(seconds) {
    this._widget.seekTo(seconds*1000)
  }
  
  isEnded() {
    return this._isEnded
  }
}

class _HTML5Media_player extends Player {
  play() {
    super.play()
    this._media.play()
  }
  
  pause() {
    super.pause()
    this._media.pause()
  }
  
  // Virtual method
  stop() {
    this.pause()
    this._media.currentTime = 0
  }
  
  getDuration(ret) {
    return this._media.duration
  }
  
  getCurrentTime(ret) {
    return this._media.currentTime
  }
  
  seekTo(seconds) {
    this._media.currentTime = seconds
  }
  
  isEnded() {
    return this._media.ended
  }
}

class _Video_player extends _HTML5Media_player {
  constructor($element, $media) {
    super($element, $media)
    this._$media.find('iframe').on('load', () => {
      this._media = this._$media.find('iframe').contents().find('video')[0]
    })
  }
}

class Twitter_player extends _Video_player {
}

class _Mp3_player extends _HTML5Media_player {
  constructor($element, $media) {
    super($element, $media)
    this._$media.find('iframe').on('load', () => {
      this._media = this._$media.find('iframe').contents().find('audio')[0]
    })
  }
}

class Mqube_player extends _Mp3_player {
}

class Allihoopa_player extends _Mp3_player {
}

class Hearthisat_player extends _Mp3_player {
}

class Creofuga_player extends _Mp3_player {
}

class Bandcamp_player extends _Mp3_player {
}

class Fastuploader_player extends _Mp3_player {
}

/*class Creofuga_player extends Player {
  constructor($element) {
    super($element)
    this._$play_button = this._$media.find('iframe').contents().find('.play_button_img')
  }
  
  play() {
    super.play()
    this._$play_button.click()
  }
  
  pause() {
    super.pause()
    this._$play_button.click()
  }
}*/

/*class Okmusic_player extends Player {
  constructor($element) {
    super($element)
    
  }
  
  play() {
    
  }
  
  pause() {
    super.pause()
    
  }
}

class Pawoo_player extends Player {
  constructor($element) {
    super($element)
    this._$play_button = this._$media.find('iframe').contents().find('.playbutton')
    this._is_played = false
  }
  
  // .playbutton -> .canvas-container
  play() {
    super.play()
    this._$play_button.click()
    if (!this._is_played) {
      this._$play_button = this._$media.find('iframe').contents().find('.canvas-container')
    }
  }
  
  // .canvas-container
  pause() {
    super.pause()
    this._$play_button.click()
  }
  
  // .icon-play の aria-label を監視
  isPaused() {
    
  }
}

class Piapro_player extends Player {
  constructor($element) {
    super($element)
    
  }
  
  play() {
    super.play()
    
  }
  
  pause() {
    super.pause()
    
  }
}

class Dropbox_player extends Player {
  constructor($element) {
    super($element)
    
  }
  
  play() {
    super.play()
    
  }
  
  pause() {
    super.pause()
    
  }
}*/
