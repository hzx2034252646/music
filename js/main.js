function formatTime(t) {
    var min = Math.floor(parseFloat(t) / 60);
    var s = Math.floor(parseFloat(t)) - min * 60;
    min = isNaN(min) ? 0 : min;
    s = isNaN(s) ? 0 : s;
    var min_str, s_str;
    min_str = min < 10 ? '0' + min : '' + min;
    s_str = s < 10 ? '0' + s : '' + s;
    return min_str + ':' + s_str;
}

function parseLyric(song, json, time) {
    var lyric = [],
        m, s, ms, time_str, lyric_arr1;
    //以换行符将歌词字符串分割成数组
    lyric_arr1 = song.replace(/\[([a-z]*):.*]/g, '').replace(/\/\//g, '').split(/\n/g);
    //过滤掉数组中的空字符串
    var lyric_arr2 = [],
        i;
    for (i = 0; i < lyric_arr1.length; i++) {
        if (lyric_arr1[i] != '') {
            lyric_arr2.push(lyric_arr1[i]);
        }
    }
    //创建json对象存储时间和歌词
    for (i = 0; i < lyric_arr2.length; i++) {
        time_str = lyric_arr2[i].match(/\d*:\d*\.\d*/g);
        if (!time_str) {
            continue;
        }
        lyric[i] = lyric_arr2[i].split(']').slice(-1)
        for (var j = 0; j < time_str.length; j++) {
            m = parseInt(time_str[j].split(/[:\.]/g)[0]);
            s = parseInt(time_str[j].split(/[:\.]/g)[1]);
            ms = parseInt(time_str[j].split(/[:\.]/g)[2]);
            time[j] = Math.floor((m * 60 + s + ms / 1000));
        }
        for (var k = 0; k < time_str.length; k++) {
            if (lyric[i] != '') {
                json[time[k]] = { "time": time[k], "lyric": lyric[i] };
            }
        }
    }
    //将json对象中的时间存入数组
    i = 0;
    for (var key in json) {
        time[i++] = json[key].time;
    }
    //时间排序
    function sortNumber(a, b) {
        return a - b;
    }
    time.sort(sortNumber);
}

function loadLyric(lyric, tlyric) {
    var json1 = {},
        json2 = {},
        time = [],
        time1 = [],
        time2 = [];
    var i, $lyric = $('.lyric'),
        $content = $('.content');
    var audio = $('audio').get(0);
    $lyric.html('');
    if (!lyric) {
        if ($('.player .pic').css('display') != 'none') {
            $lyric.html('<p style="margin-top:20%">暂无歌词</p>');
        } else {
            $lyric.html('<p style="margin-top:50%">暂无歌词</p>');
        }
        return;
    }
    parseLyric(lyric, json1, time1);
    time = time1;
    if (tlyric) {
        parseLyric(tlyric, json2, time2);
        time = time1.length > time2.length ? time1 : time2;
        for (i = 0; i < time.length; i++) {
            if (!json2[time[i]]) {
                $lyric.append('<p data-time=' + time[i] + '>' + json1[time[i]].lyric + '</p>');
            } else {
                try {
                    $lyric.append('<p data-time=' + time[i] + '>' + json1[time[i]].lyric + '<br><span class="trans">' + json2[time[i]].lyric + '</span></p>');
                } catch (err) {}
            }
        }
    } else {
        for (i = 0; i < time.length; i++) {
            $lyric.append('<p data-time=' + time[i] + '>' + json1[time[i]].lyric + '</p>');
        }
    }
    //歌词滚动
    function moveLyric() {
        var t, $p;
        var h = $content.height();
        t = audio.currentTime;
        for (var i = 0; i < time.length; i++) {
            if ((time[i] <= t && t < time[i + 1] && i < time.length - 1) || (i == time.length - 1 && t >= time[i])) {
                $p = $lyric.find('p[data-time="' + time[i] + '"]');
                $p.addClass('lyric-active').siblings().removeClass('lyric-active');
                var top;
                if (typeof $lyric.find('.lyric-active').position() != 'undefined') {
                    top = $lyric.find('.lyric-active').position().top;
                }
                var dis = tlyric ? (1 / 3) * h : (2 / 5) * h;
                if ($('.player .pic').css('display') != 'none') {
                    dis = 0;
                }
                $content.stop().animate({ scrollTop: top - dis }, 500);
                return;
            }
        }
    }
    audio.addEventListener('timeupdate', moveLyric);
    //滚动歌词时停止自动滚动定位
    var timeout = null;
    var autoScroll = true;
    $content.scroll(function() {
        if (timeout != null) {
            clearTimeout(timeout);
        }
        autoScroll = false;
        audio.removeEventListener('timeupdate', moveLyric);
        timeout = setTimeout(function() {
            autoScroll = true;
            audio.addEventListener('timeupdate', moveLyric);
        }, 1000);
    });
}

$(function() {

    var baseURL = 'http://www.gy84.com/music/api.php';
    // var baseURL = 'https://www.fczbl.vip/musicplayer/api.php';
    var source = 'netease',
        keyword = '',
        page = 1,
        music = [],
        search_song = [],
        currentSong = {},
        lastPlayTime = 0;

    $('.header_btn_item').click(function() {
        $(this).addClass('btn-active').siblings().removeClass('btn-active');
    })
    $('.control .iconfont').on('touchstart', function() {
        $(this).addClass('icon-active');
    })
    $('.control .iconfont').on('touchend', function() {
        $(this).removeClass('icon-active');
    })
    //播放
    $('.play').click(function() {
        $(this).hide();
        $('.pause').show();
        if (!$('audio').get(0).src.match('mp3')) {
            return;
        }
        $('audio').get(0).play();
    })
    //暂停
    $('.pause').click(function() {
        $(this).hide();
        $('.play').show();
        $('audio').get(0).pause();
    })
    //上一首
    $('.prev').click(function() {
        if (!music[0]) {
            return;
        }
        var i = music.findIndex(item => item.id == currentSong.id);
        if (i == 0) {
            i = music.length;
        }
        playMusic(music[i - 1].id);
    })
    //下一首
    $('.next').click(function() {
        if (!music[0]) {
            return;
        }
        var i = music.findIndex(item => item.id == currentSong.id);
        if (i == music.length - 1) {
            i = -1
        }
        playMusic(music[i + 1].id);
    })
    //单曲循环
    $('.randomPlay').click(function() {
        $('.singlePlay').show().siblings().hide();
        layer.close(layer.index);
        layer.msg('单曲循环');
        $('audio').get(0).loop = true;
    })

    function loop() {
        var i = music.findIndex(item => item.id == currentSong.id);
        if (i == music.length - 1) {
            i = -1;
        }
        playMusic(music[++i].id);
    }
    //列表循环
    $('.singlePlay').click(function() {
        $('.listLoop').show().siblings().hide();
        layer.close(layer.index);
        layer.msg('列表循环');
        var audio = $('audio').get(0);
        audio.loop = false;
        audio.removeEventListener('ended', random);
        audio.addEventListener('ended', loop);
    })

    function random() {
        var i = Math.floor(Math.random() * music.length);
        playMusic(music[i].id);
    }
    //随机播放
    $('.listLoop').click(function() {
        $('.randomPlay').show().siblings().hide();
        layer.close(layer.index);
        layer.msg('随机播放');
        var audio = $('audio').get(0);
        audio.loop = false;
        audio.removeEventListener('ended', loop);
        audio.addEventListener('ended', random);
    })
    //设置
    $('.setting').click(function() {
        if ($('#source').css('visibility') == 'visible') {
            return layer.close(layer.index);
        }
        var str = '<ul id="source">' +
            '<li data-source="netease">网易云音乐</li>' +
            '<li data-source="tencent">QQ音乐</li>' +
            '<li data-source="kugou">酷狗音乐</li>' +
            '<li data-source="xiami">虾米音乐</li>' +
            '<li data-source="baidu">百度音乐</li>' +
            '</ul>';
        layer.tips(str, this, {
            tips: 1,
            time: 0
        });
        $('#source').find('li[data-source=' + source + ']').addClass('source-active');
    })

    $(document).delegate('#source li', 'click', function() {
        $(this).addClass('source-active').siblings().removeClass('source-active');
        source = $(this).attr('data-source');
        layer.close(layer.index);
    })
    //搜索
    $('#search').click(function() {
        $('.searching').show().siblings().hide();
        $('.header_btn_bar').hide().siblings().show();
    })
    $('.cancel_btn').click(function() {
        $('.search').hide().siblings().show();
    })

    function searchSong(s, page) {
        $.ajax({
            type: 'POST',
            url: baseURL,
            dataType: 'jsonp',
            data: 'types=search&name=' + s + '&source=' + source + '&pages=' + page,
            timeout: 5000,
            beforeSend: function() {
                layer.close(layer.index);
                layer.msg('加载中', { icon: 16, time: 0, shade: [0.3, '#000'] });
            },
            success: function(data) {
                var singer,
                    num,
                    len = $('.searching').find('.song-list-item').length,
                    $list = $('.searching').find('.song-list');
                $.each(data, function(index, value) {
                    search_song.push(value);
                    singer = value.artist[0];
                    num = value.artist.length;
                    if (num > 1) {
                        for (var i = 1; i < num; i++) {
                            singer = singer + '、' + value.artist[i];
                        }
                    }
                    $list.append(
                        '<li class="song-list-item" id=' + value.id + '>' +
                        '<div class="num">' + (len + index + 1) + '</div>' +
                        '<div class="title">' + value.name + '</div>' +
                        '<div class="singer">' + singer + '</div>' +
                        '</li>');
                })
                $list.find('p').remove();
                var count = data.length;
                if (len == 0 && count < 20) {
                    return layer.close(layer.index);
                }
                if (count < 20) {
                    $list.append('<p class="noMore">没有更多数据了</p>');
                } else {
                    $list.append('<p class="loadMore">加载更多</p>');
                }
                layer.close(layer.index);
            },
            complete: function(xhr, status) {
                if (status == 'timeout') {
                    layer.msg('加载超时');
                }
                if (status == 'error') {
                    layer.msg('加载失败');
                }
            }
        })
    }

    function search() {
        var s = $.trim($('.search_input').val());
        if (!s) {
            return;
        }
        page = 1;
        search_song = [];
        keyword = s;
        $('.search_input').blur();
        $('.searching').find('.song-list').html('');
        searchSong(keyword, page);
    }
    $('.search_input').keyup(function(ev) {
        if (ev.which == 13) {
            search();
        }
    })
    $('.search_btn').click(function() {
        search();
    })
    $('.song-list').delegate('.loadMore', 'click', function() {
        searchSong(keyword, ++page);
    })
    $('.song-list').delegate('li', 'touchstart', function() {
        $(this).css('background', 'rgba(0,0,0,.1');
    })
    $('.song-list').delegate('li', 'touchend', function() {
        $(this).css('background', 'none');
    })

    function playMusic(id) {
        var audio = $('audio').get(0);
        var song = search_song.find(item => item.id == id) || music.find(item => item.id == id);
        currentSong = song;
        if (Date.now() - lastPlayTime < 1000) {
            return;
        }
        lastPlayTime = Date.now();
        audio.pause();
        if ($('.player .pic').css('display') != 'none') {
            $('.lyric').html('<p style="margin-top:20%;color:#fff"><span class="wave" style="margin-right:5px"></span>歌词加载中</p>');
        } else {
            $('.lyric').html('<p style="margin-top:50%;color:#fff"><span class="wave" style="margin-right:5px"></span>歌词加载中</p>');
        }
        $.ajax({
            type: 'POST',
            url: baseURL,
            dataType: 'jsonp',
            data: 'types=url&source=' + song.source + '&id=' + song.url_id,
            success: function(data) {
                audio.src = data.url;
                audio.load();
                audio.addEventListener('durationchange', function() {
                    $('.total-time').text(formatTime(audio.duration));
                });
                audio.addEventListener('canplay', function() {
                    audio.play();
                });
                audio.addEventListener('timeupdate', function() {
                    var $progress = $('.progressbar');
                    var dis = audio.currentTime / audio.duration * $progress.width();
                    var timeRanges = audio.buffered;
                    try {
                        var timeBuffered = timeRanges.end(timeRanges.length - 1);
                    } catch (err) {}
                    var dis1 = timeBuffered / audio.duration * $progress.width();
                    $('.current-time').text(formatTime(audio.currentTime));
                    $('.ball').get(0).style.left = dis + 'px';
                    $('.current-progress').get(0).style.width = dis + 'px';
                    $('.buffered-progress').get(0).style.width = dis1 + 'px';
                    if (audio.paused) {
                        $('.pause').hide()
                        $('.play').show()
                        $('.song-list').find('li[id=' + id + ']').removeClass('li-active');
                    } else {
                        $('.play').hide()
                        $('.pause').show()
                        $('.song-list').find('li').removeClass('li-active');
                        $('.song-list').find('li[id=' + id + ']').addClass('li-active');
                    }
                });
                audio.onerror = function() {
                    layer.msg('该歌曲暂时无法播放');
                };
            }
        })
        $.ajax({
            type: 'POST',
            url: baseURL,
            dataType: 'jsonp',
            data: 'types=pic&source=' + song.source + '&id=' + song.pic_id,
            success: function(data) {
                var url = data.url.replace('300y300', '400y400').replace('300h_300w', '400h_400w');
                $('.pic').find('img').attr('src', url);
                $('.blur_bg').css({ 'background-image': 'url(' + url + ')' }).addClass('blur');
            }
        })
        $.ajax({
            type: 'POST',
            url: baseURL,
            dataType: 'jsonp',
            data: 'types=lyric&source=' + song.source + '&id=' + song.lyric_id,
            success: function(data) {
                loadLyric(data.lyric, data.tlyric);
            }
        })
        var musicArray = [];
        if (localStorage.getItem('music')) {
            musicArray = JSON.parse(localStorage.getItem('music'));
        }
        var index = musicArray.findIndex(item => item.id == id)
        if (index > -1) {
            musicArray.splice(index, 1);
        }
        musicArray.unshift(song);
        localStorage.setItem('music', JSON.stringify(musicArray));
    }
    $('.song-list').delegate('li', 'click', function() {
        playMusic(this.id);
    })


    //播放器
    $('#player').click(function() {
        $('.player').show().siblings().hide();
    })
    $('.player').click(function() {
        if ($('.pic').css('display') != 'none') {
            $('.pic').hide()
        } else {
            $('.pic').show()
        }
    })
    $('#progress').on('touchstart', function(ev) {
        var oEvent = ev || event;
        var disX = oEvent.touches[0].clientX - $('#progress').offset().left - (1 / 2) * $('.ball').get(0).offsetWidth;
        if (disX < 0) {
            disX = 0;
        } else if (disX > $('#progress').width()) {
            disX = $('#progress').width();
        } else if ($('.buffered-progress').width() != 0 && disX > $('.buffered-progress').width()) {
            disX = $('.buffered-progress').width();
        } else {
            $('.ball').css({ left: disX });
            $('.current-progress').css({ width: disX });
        }
        let audio = $('audio').get(0);
        audio.currentTime = disX / $('#progress').width() * audio.duration;
    })

    function loadMusic() {
        var singer,
            num,
            $list = $('.playing').find('.song-list');
        $list.html('');
        music = JSON.parse(localStorage.getItem('music')) || [];
        $.each(music, function(index, value) {
            singer = value.artist[0];
            num = value.artist.length;
            if (num > 1) {
                for (var i = 1; i < num; i++) {
                    singer = singer + '、' + value.artist[i];
                }
            }
            $list.append(
                '<li class="song-list-item" id=' + value.id + '>' +
                '<div class="num">' + (index + 1) + '</div>' +
                '<div class="title">' + value.name + '</div>' +
                '<div class="singer">' + singer + '</div>' +
                '<div class="delete">&times;</div>' +
                '</li>');
        })
        $('.playing').show().siblings().hide();
    }
    //正在播放
    $('#playing').click(function() {
        loadMusic();
    })
    $('.song-list').delegate('.delete', 'click', function(ev) {
        ev.stopPropagation();
        var id = $(this).parent().attr('id');
        var index = music.findIndex(item => item.id == id);
        music.splice(index, 1);
        localStorage.setItem('music', JSON.stringify(music));
        loadMusic();
    })
    loadMusic();
})