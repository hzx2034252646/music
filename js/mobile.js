function searchSong(s, page) {
    $.ajax({
        type: 'POST',
        url: baseURL,
        dataType: 'jsonp',
        data: 'types=search&name=' + s + '&source=' + source + '&pages=' + page,
        timeout: 20000,
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
$(function() {
    $('.header_btn_item').click(function() {
        $(this).addClass('btn-active').siblings().removeClass('btn-active');
    })
    $('.control .iconfont').on('touchstart', function() {
        $(this).addClass('icon-active');
    })
    $('.control .iconfont').on('touchend', function() {
        $(this).removeClass('icon-active');
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
    $('.search_btn').click(function() {
        search();
    })
    $('.song-list').delegate('li', 'touchstart', function() {
        $(this).css('background', 'rgba(0,0,0,.1');
    })
    $('.song-list').delegate('li', 'touchend', function() {
        $(this).css('background', 'none');
    })

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
    //正在播放
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