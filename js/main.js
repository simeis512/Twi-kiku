// JavaScript Document
let params = []  // クエリパラメータ
let playlist     // Playlistインスタンス

// 最初に呼ばれるやつ
$(window).on('load', () => {
  // クエリパラメータの取得
  for (let param of location.search.substring(1).split('&')) {
    const keyValue = param.split('=')
    params[keyValue[0]] = keyValue[1]
  }
  
  // トップページの表示変更
  if ($('#top-page').length) {
    const agent = navigator.userAgent
    if (/(Android|iP(hone|od|ad))/.test(agent)) {
      $('#top-page div:last-child').append('<p>※ 通信を多用するためWi-Fi推奨です</p>')
    }
    if (!(/(?=Chrome)(?!(Edge|Opera))/.test(agent) || /Firefox/.test(agent))) {
      $('#top-page div:last-child').append($('<p>※ ChromeかFirefox推奨です</p>'))
    }
    if (/iP(hone|od|ad)/.test(agent)) {
      $('#top-page div:last-child').append($('<p>※ iOSでは上手く動かない可能性があります</p>'))
    }
    //$('#top-page div:last-child').append($('<p>'+agent+'</p>'))
  }
  
  // 検索ボタンを押したときの動作設定
  $('#search').submit(event => {
    const root = location.protocol +'//'+ location.host
    
    // 「user:」で始まる場合、ユーザーTLモードに
    if (/^user:\S+$/.test($('[name="q"]').val())) {
      location.href = root +'?user='+ $('[name="q"]').val().split(':')[1]
      return false
    }
    // 空欄の場合、ホームTLモードに
    else if($('[name="q"]').val() == '') {
      location.href = root
      return false
    }
  })
  
  // Playlistインスタンスの生成
  playlist = new Playlist($('#main-player'), $('#playlist'), $('#next-loader'), params)
  
  // ツイート取得
  playlist.searchStart(10)
})
