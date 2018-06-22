function searchSong(s, page) {
    $.ajax({
        type: 'POST',
        url: baseURL,
        dataType: 'jsonp',
        data: 'types=search&name=' + s + '&source=' + source + '&pages=' + page,
        timeout: 20000,
        beforeSend: function() {
            layer.msg('加载中', { icon: 16, time: 0, shade: [0.3, '#000'] });
        },
        success: function(data) {
            var singer,
                num,
                len = $('.song-list').find('.song-list-item').length,
                $list = $('.song-list');
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
                    '<li class="song-list-item searching" id=' + value.id + '>' +
                    '<div class="num">' + (len + index + 1) + '</div>' +
                    '<div class="title">' +
                    '<span class="ellipsis">' + value.name + '</span>' +
                    '<span class="icon play_icon"></span>' +
                    '<span class="icon download_icon"></span>' +
                    '</div>' +
                    '<div class="singer">' +
                    '<span class="ellipsis">' + singer + '</span>' +
                    '</div>' +
                    '<div class="album">' +
                    '<span class="ellipsis">' + value.album + '</span>' +
                    '</div>' +
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
                page--;
            }
            if (status == 'error') {
                layer.msg('加载失败');
                page--;
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
    $('.song-list').html('');
    searchSong(keyword, page);
}

function loadMusic() {
    var singer,
        num,
        $list = $('.song-list');
    $list.html('');
    music = JSON.parse(localStorage.getItem('music')) || [];
    $('.count').text(music.length);
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
            '<div class="title">' +
            '<span class="ellipsis">' + value.name + '</span>' +
            '<span class="icon play_icon"></span>' +
            '<span class="icon download_icon"></span>' +
            '<span class="icon delete_icon"></span>' +
            '</div>' +
            '<div class="singer">' +
            '<span class="ellipsis">' + singer + '</span>' +
            '</div>' +
            '<div class="album">' +
            '<span class="ellipsis">' + value.album + '</span>' +
            '</div>' +
            '</li>');
    })
}
$(function() {
    $('.search_source').click(function() {
        if ($('.search_source_list').css('display') != 'none') {
            $('.search_source_list').fadeOut();
        } else {
            $('.search_source_list').fadeIn();
        }
    })

    $('.search_source_item').click(function() {
        source = $(this).attr('data-source');
        $('.search_source').attr('data-source', source);
        $('.search_source_list').fadeOut();
    })
    $('.song-list').delegate('li', 'mouseenter', function() {
        var dis1 = $(this).find('.title').width(),
            dis2 = parseFloat($(this).find('.play_icon').css('right'))+40;
        dis1> dis2 && $(this).find('.title').find('.ellipsis').css('width', dis1 - dis2 + 'px');
    })
    $('.song-list').delegate('li', 'mouseleave', function() {
        $(this).find('.title').find('.ellipsis').css('width', '100%');
    })
    $('.song-list').delegate('.play_icon', 'click', function() {
        var id = $(this).parent().parent().attr('id');
        playMusic(id);
    })
    $('.song-list').delegate('.download_icon', 'click', function() {
        var id = $(this).parent().parent().attr('id');
        var song = music.find(function(item){
            return item.id == id;
        }) || search_song.find(function(item){
            return item.id == id;
        });
        $.ajax({
            type: 'POST',
            url: baseURL,
            dataType: 'jsonp',
            data: 'types=url&source=' + song.source + '&id=' + song.url_id,
            beforeSend: function() {
            	layer.msg('加载中', { icon: 16, time: 0, shade: [0.3, '#000'] });
            },
            success: function(data) {
            	layer.close(layer.index);
                if(!data.url) {
                    return layer.msg('该歌曲暂时无法下载');
                }
                var a = document.createElement('a');
       			a.href = data.url;
                a.download = song.name;
                a.target = '_blank';
       			a.click();
            }
        })
    })
    $('.song-list').delegate('.delete_icon', 'click', function() {
        var id = $(this).parent().parent().attr('id');
        var index = music.findIndex(function(item){
            return item.id == id;
        });
        music.splice(index, 1);
        localStorage.setItem('music', JSON.stringify(music));
        loadMusic();
    })
    loadMusic();
})