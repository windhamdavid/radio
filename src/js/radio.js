
/* Radio Funtions */

/*
	Version: 1.1
	Author: Dan Pastori
	Company: 521 Dimensions
*/
function hook_amplitude_functions(e){var a=window.onload;window.onload="function"!=typeof window.onload?e:function(){a&&a(),e()}}function amplitude_configure_variables(){amplitude_active_config.amplitude_active_song=new Audio,amplitude_bind_time_update(),void 0!=amplitude_config.amplitude_songs&&(amplitude_active_config.amplitude_songs=amplitude_config.amplitude_songs),void 0!=amplitude_config.amplitude_volume&&(amplitude_active_config.amplitude_volume=amplitude_config.amplitude_volume/100,amplitude_active_config.amplitude_pre_mute_volume=amplitude_config.amplitude_volume/100,document.getElementById("amplitude-volume-slider")&&(document.getElementById("amplitude-volume-slider").value=100*amplitude_active_config.amplitude_volume),amplitude_active_config.amplitude_active_song.volume=amplitude_active_config.amplitude_volume),void 0!=amplitude_config.amplitude_pre_mute_volume&&(amplitude_active_config.amplitude_pre_mute_volume=amplitude_config.amplitude_pre_mute_volume),void 0!=amplitude_config.amplitude_auto_play&&(amplitude_active_config.amplitude_auto_play=amplitude_config.amplitude_auto_play),void 0!=amplitude_config.amplitude_start_song&&(amplitude_active_config.amplitude_start_song=amplitude_config.amplitude_start_song),void 0!=amplitude_config.amplitude_before_play_callback&&(amplitude_active_config.amplitude_before_play_callback=amplitude_config.amplitude_before_play_callback),void 0!=amplitude_config.amplitude_after_play_callback&&(amplitude_active_config.amplitude_after_play_callback=amplitude_config.amplitude_after_play_callback),void 0!=amplitude_config.amplitude_before_stop_callback&&(amplitude_active_config.amplitude_before_stop_callback=amplitude_config.amplitude_before_stop_callback),void 0!=amplitude_config.amplitude_after_stop_callback&&(amplitude_active_config.amplitude_after_stop_callback=amplitude_config.amplitude_after_stop_callback),void 0!=amplitude_config.amplitude_before_next_callback&&(amplitude_active_config.amplitude_before_next_callback=amplitude_config.amplitude_before_next_callback),void 0!=amplitude_config.amplitude_after_next_callback&&(amplitude_active_config.amplitude_after_next_callback=amplitude_config.amplitude_after_next_callback),void 0!=amplitude_config.amplitude_before_prev_callback&&(amplitude_active_config.amplitude_before_prev_callback=amplitude_config.amplitude_before_prev_callback),void 0!=amplitude_config.amplitude_after_prev_callback&&(amplitude_active_config.amplitude_after_prev_callback=amplitude_config.amplitude_after_prev_callback),void 0!=amplitude_config.amplitude_after_pause_callback&&(amplitude_active_config.amplitude_after_pause_callback=amplitude_config.amplitude_after_pause_callback),void 0!=amplitude_config.amplitude_before_pause_callback&&(amplitude_active_config.amplitude_before_pause_callback=amplitude_config.amplitude_before_pause_callback),void 0!=amplitude_config.amplitude_after_shuffle_callback&&(amplitude_active_config.amplitude_after_shuffle_callback=amplitude_config.amplitude_after_shuffle_callback),void 0!=amplitude_config.amplitude_before_shuffle_callback&&(amplitude_active_config.amplitude_before_shuffle_callback=amplitude_config.amplitude_before_shuffle_callback),void 0!=amplitude_config.amplitude_before_volume_change_callback&&(amplitude_active_config.amplitude_before_volume_change_callback=amplitude_config.amplitude_before_volume_change_callback),void 0!=amplitude_config.amplitude_after_volume_change_callback&&(amplitude_active_config.amplitude_after_volume_change_callback=amplitude_config.amplitude_after_volume_change_callback),void 0!=amplitude_config.amplitude_before_mute_callback&&(amplitude_active_config.amplitude_before_mute_callback=amplitude_config.amplitude_before_mute_callback),void 0!=amplitude_config.amplitude_after_mute_callback&&(amplitude_active_config.amplitude_after_mute_callback=amplitude_config.amplitude_after_mute_callback),void 0!=amplitude_config.amplitude_before_time_update_callback&&(amplitude_active_config.amplitude_before_time_update_callback=amplitude_config.amplitude_before_time_update_callback),void 0!=amplitude_config.amplitude_after_time_update_callback&&(amplitude_active_config.amplitude_after_time_update_callback=amplitude_config.amplitude_after_time_update_callback),void 0!=amplitude_config.amplitude_before_song_information_set_callback&&(amplitude_active_config.amplitude_before_song_information_set_callback=amplitude_config.amplitude_before_song_information_set_callback),void 0!=amplitude_config.amplitude_after_song_information_set_callback&&(amplitude_active_config.amplitude_after_song_information_set_callback=amplitude_config.amplitude_after_song_information_set_callback),void 0!=amplitude_config.amplitude_before_song_added_callback&&(amplitude_active_config.amplitude_before_song_added_callback=amplitude_config.amplitude_before_song_added_callback),void 0!=amplitude_config.amplitude_after_song_added_callback&&(amplitude_active_config.amplitude_after_song_added_callback=amplitude_config.amplitude_after_song_added_callback),void 0!=amplitude_config.amplitude_volume_up_amount&&(amplitude_active_config.amplitude_volume_up_amount=amplitude_config.amplitude_volume_up_amount),void 0!=amplitude_config.amplitude_volume_down_amount&&(amplitude_active_config.amplitude_volume_down_amount=amplitude_config.amplitude_volume_down_amount),void 0!=amplitude_config.amplitude_continue_next&&(amplitude_active_config.amplitude_continue_next=amplitude_config.amplitude_continue_next),null!=amplitude_active_config.amplitude_start_song?(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_songs[amplitude_active_config.amplitude_start_song].url,amplitude_set_active_song_information(amplitude_active_config.amplitude_songs[amplitude_active_config.amplitude_start_song]),amplitude_active_config.amplitude_list_playing_index=amplitude_active_config.amplitude_start_song,"undefined"==amplitude_active_config.amplitude_start_song.live&&(amplitude_active_config.amplitude_start_song.live=!1)):0!=amplitude_active_config.amplitude_songs.length?(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_songs[0].url,amplitude_set_active_song_information(amplitude_active_config.amplitude_songs[0]),amplitude_active_config.amplitude_list_playing_index=0):console.log("Please define a an array of songs!"),amplitude_bind_song_additions()}function amplitude_web_desktop(){document.getElementById("amplitude-play")&&document.getElementById("amplitude-play").addEventListener("click",function(){amplitude_play_song()}),document.getElementById("amplitude-stop")&&document.getElementById("amplitude-stop").addEventListener("click",function(){amplitude_stop_song()}),document.getElementById("amplitude-pause")&&document.getElementById("amplitude-pause").addEventListener("click",function(){amplitude_pause_song()}),document.getElementById("amplitude-play-pause")&&document.getElementById("amplitude-play-pause").addEventListener("click",function(){if(amplitude_active_config.amplitude_active_song.paused){var e=" amplitude-playing";this.className=this.className.replace("amplitude-paused",""),this.className=this.className.replace(e,""),this.className=this.className+e}else{var e=" amplitude-paused";this.className=this.className.replace("amplitude-playing",""),this.className=this.className.replace(e,""),this.className=this.className+e}amplitude_play_pause()}),document.getElementById("amplitude-mute")&&document.getElementById("amplitude-mute").addEventListener("click",function(){amplitude_mute()}),document.getElementById("amplitude-shuffle")&&(document.getElementById("amplitude-shuffle").classList.add("amplitude-shuffle-off"),document.getElementById("amplitude-shuffle").addEventListener("click",function(){amplitude_active_config.amplitude_shuffle?(this.classList.add("amplitude-shuffle-off"),this.classList.remove("amplitude-shuffle-on")):(this.classList.add("amplitude-shuffle-on"),this.classList.remove("amplitude-shuffle-off")),amplitude_shuffle_playlist()})),document.getElementById("amplitude-next")&&document.getElementById("amplitude-next").addEventListener("click",function(){amplitude_next_song()}),document.getElementById("amplitude-previous")&&document.getElementById("amplitude-previous").addEventListener("click",function(){amplitude_previous_song()}),document.getElementById("amplitude-song-slider")&&document.getElementById("amplitude-song-slider").addEventListener("input",amplitude_handle_song_sliders),document.getElementById("amplitude-volume-slider")&&document.getElementById("amplitude-volume-slider").addEventListener("input",function(){amplitude_volume_update(this.value)}),document.getElementById("amplitude-volume-up")&&document.getElementById("amplitude-volume-up").addEventListener("click",function(){amplitude_change_volume("up")}),document.getElementById("amplitude-volume-down")&&document.getElementById("amplitude-volume-down").addEventListener("click",function(){amplitude_change_volume("down")}),amplitude_active_config.amplitude_continue_next&&amplitude_active_config.amplitude_active_song.addEventListener("ended",function(){amplitude_next_song()});for(var e=document.getElementsByClassName("amplitude-play-pause"),a=0;a<e.length;a++)e[a].addEventListener("click",amplitude_handle_play_pause_classes);for(var i=document.getElementsByClassName("amplitude-song-slider"),a=0;a<i.length;a++)i[a].addEventListener("input",amplitude_handle_song_sliders)}function amplitude_web_mobile(){document.getElementById("amplitude-play")&&document.getElementById("amplitude-play").addEventListener("touchstart",function(){amplitude_play_song()}),document.getElementById("amplitude-stop")&&document.getElementById("amplitude-stop").addEventListener("touchstart",function(){amplitude_stop_song()}),document.getElementById("amplitude-pause")&&document.getElementById("amplitude-pause").addEventListener("touchstart",function(){amplitude_pause_song()}),document.getElementById("amplitude-play-pause")&&document.getElementById("amplitude-play-pause").addEventListener("touchstart",function(){if(amplitude_active_config.amplitude_active_song.paused){var e=" amplitude-playing";this.className=this.className.replace("amplitude-paused",""),this.className=this.className.replace(e,""),this.className=this.className+e}else{var e=" amplitude-paused";this.className=this.className.replace("amplitude-playing",""),this.className=this.className.replace(e,""),this.className=this.className+e}amplitude_play_pause()}),document.getElementById("amplitude-mute")&&(/iPhone|iPad|iPod/i.test(navigator.userAgent)?console.log("iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4"):document.getElementById("amplitude-mute").addEventListener("touchstart",function(){amplitude_mute()})),document.getElementById("amplitude-shuffle")&&(document.getElementById("amplitude-shuffle").classList.add("amplitude-shuffle-off"),document.getElementById("amplitude-shuffle").addEventListener("touchstart",function(){amplitude_active_config.amplitude_shuffle?(this.classList.add("amplitude-shuffle-off"),this.classList.remove("amplitude-shuffle-on")):(this.classList.add("amplitude-shuffle-on"),this.classList.remove("amplitude-shuffle-off")),amplitude_shuffle_playlist()})),document.getElementById("amplitude-next")&&document.getElementById("amplitude-next").addEventListener("touchstart",function(){amplitude_next_song()}),document.getElementById("amplitude-previous")&&document.getElementById("amplitude-previous").addEventListener("touchstart",function(){amplitude_previous_song()}),document.getElementById("amplitude-song-slider")&&document.getElementById("amplitude-song-slider").addEventListener("input",amplitude_handle_song_sliders),document.getElementById("amplitude-volume-slider")&&(/iPhone|iPad|iPod/i.test(navigator.userAgent)?console.log("iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4"):document.getElementById("amplitude-volume-slider").addEventListener("input",function(){amplitude_volume_update(this.value)})),document.getElementById("amplitude-volume-up")&&(/iPhone|iPad|iPod/i.test(navigator.userAgent)?console.log("iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4"):document.getElementById("amplitude-volume-up").addEventListener("touchstart",function(){amplitude_change_volume("up")})),document.getElementById("amplitude-volume-down")&&(/iPhone|iPad|iPod/i.test(navigator.userAgent)?console.log("iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4"):document.getElementById("amplitude-volume-down").addEventListener("touchstart",function(){amplitude_change_volume("down")})),amplitude_active_config.amplitude_continue_next&&amplitude_active_config.amplitude_active_song.addEventListener("ended",function(){amplitude_next_song()});for(var e=document.getElementsByClassName("amplitude-play-pause"),a=0;a<e.length;a++)e[a].addEventListener("touchstart",amplitude_handle_play_pause_classes);for(var i=document.getElementsByClassName("amplitude-song-slider"),a=0;a<i.length;a++)i[a].addEventListener("input",amplitude_handle_song_sliders)}function amplitude_start(){document.getElementById("amplitude-song-time-visualization")&&(document.getElementById("amplitude-song-time-visualization").innerHTML='<div id="amplitude-song-time-visualization-status"></div>',document.getElementById("amplitude-song-time-visualization-status").setAttribute("style","width:0px")),amplitude_active_config.amplitude_auto_play&&amplitude_play_pause()}function amplitude_play_song(){if(amplitude_active_config.amplitude_before_play_callback){var e=window[amplitude_active_config.amplitude_before_play_callback];e()}"undefined"!=amplitude_active_config.amplitude_active_song_information.live&&amplitude_active_config.amplitude_active_song_information.live&&amplitude_reconnect_stream();for(var a=document.getElementsByClassName("amplitude-song-slider"),i=0;i<a.length;i++)a[i].getAttribute("amplitude-song-slider-index")!=amplitude_active_config.amplitude_list_playing_index&&(a[i].value=0);if(amplitude_active_config.amplitude_active_song.play(),amplitude_set_song_info(),amplitude_active_config.amplitude_after_play_callback){var t=window[amplitude_active_config.amplitude_after_play_callback];t()}}function amplitude_stop_song(){if(amplitude_active_config.amplitude_before_stop_callback){var e=window[amplitude_active_config.amplitude_before_stop_callback];e()}if(amplitude_active_config.amplitude_active_song.currentTime=0,amplitude_active_config.amplitude_active_song.pause(),"undefined"!=typeof amplitude_active_config.amplitude_active_song.live&&amplitude_active_config.amplitude_active_song.live&&amplitude_disconnect_stream(),amplitude_active_config.amplitude_after_stop_callback){var a=window[amplitude_active_config.amplitude_after_stop_callback];a()}}function amplitude_pause_song(){if(amplitude_active_config.amplitude_before_pause_callback){var e=window[amplitude_active_config.amplitude_before_pause_callback];e()}if(amplitude_active_config.amplitude_active_song.pause(),amplitude_active_config.amplitude_active_song_information.live&&amplitude_disconnect_stream(),amplitude_active_config.amplitude_after_pause_callback){var a=window[amplitude_active_config.amplitude_active_pause_callback];a()}}function amplitude_play_pause(){if(amplitude_active_config.amplitude_active_song.paused){amplitude_play_song();var e=document.querySelector('[amplitude-song-index="'+amplitude_active_config.amplitude_list_playing_index+'"]');null!=e&&(e.classList.add("amplitude-list-playing"),e.classList.remove("amplitude-list-paused"))}else{amplitude_pause_song();var e=document.querySelector('[amplitude-song-index="'+amplitude_active_config.amplitude_list_playing_index+'"]');null!=e&&(e.classList.add("amplitude-list-paused"),e.classList.remove("amplitude-list-playing"))}}function amplitude_update_time(){if(amplitude_active_config.amplitude_before_time_update_callback){var e=window[amplitude_active_config.amplitude_before_time_update_callback];e()}var a=(Math.floor(amplitude_active_config.amplitude_active_song.currentTime%60)<10?"0":"")+Math.floor(amplitude_active_config.amplitude_active_song.currentTime%60),i=Math.floor(amplitude_active_config.amplitude_active_song.currentTime/60),t=Math.floor(amplitude_active_config.amplitude_active_song.duration/60),l=(Math.floor(amplitude_active_config.amplitude_active_song.duration%60)<10?"0":"")+Math.floor(amplitude_active_config.amplitude_active_song.duration%60);if(document.getElementById("amplitude-current-time")&&(document.getElementById("amplitude-current-time").innerHTML=i+":"+a),document.getElementById("amplitude-audio-duration")&&(isNaN(t)||(document.getElementById("amplitude-audio-duration").innerHTML=t+":"+l)),document.getElementById("amplitude-song-slider")&&(document.getElementById("amplitude-song-slider").value=amplitude_active_config.amplitude_active_song.currentTime/amplitude_active_config.amplitude_active_song.duration*100),document.getElementById("amplitude-song-time-visualization")){var _=document.getElementById("amplitude-song-time-visualization").offsetWidth;document.getElementById("amplitude-song-time-visualization-status").setAttribute("style","width:"+_*(amplitude_active_config.amplitude_active_song.currentTime/amplitude_active_config.amplitude_active_song.duration)+"px")}if(amplitude_active_config.amplitude_songs.length>1){var u=document.querySelector('[amplitude-song-slider-index="'+amplitude_active_config.amplitude_list_playing_index+'"]');null!=u&&(u.value=amplitude_active_config.amplitude_active_song.currentTime/amplitude_active_config.amplitude_active_song.duration*100);var d=document.querySelector('[amplitude-current-time-index="'+amplitude_active_config.amplitude_list_playing_index+'"]');null!=d&&(d.innerHTML=i+":"+a);var n=document.querySelector('[amplitude-audio-duration-index="'+amplitude_active_config.amplitude_list_playing_index+'"]');null!=n&&(isNaN(t)||(n.innerHTML=t+":"+l))}if(amplitude_active_config.amplitude_after_time_update_callback){var m=window[amplitude_active_config.amplitude_after_time_update_callback];m()}}function amplitude_volume_update(e){if(amplitude_active_config.amplitude_before_volume_change_callback){var a=window[amplitude_active_config.amplitude_before_volume_change_callback];a()}if(amplitude_active_config.amplitude_active_song.volume=e/100,amplitude_active_config.amplitude_volume=e/100,amplitude_active_config.amplitude_after_volume_change_callback){var i=window[amplitude_active_config.amplitude_after_volume_change_callback];i()}}function amplitude_change_volume(e){amplitude_active_config.amplitude_volume>=0&&"down"==e&&amplitude_volume_update(100*amplitude_active_config.amplitude_volume-amplitude_active_config.amplitude_volume_down_amount>0?100*amplitude_active_config.amplitude_volume-amplitude_active_config.amplitude_volume_down_amount:0),amplitude_active_config.amplitude_volume<=1&&"up"==e&&amplitude_volume_update(100*amplitude_active_config.amplitude_volume+amplitude_active_config.amplitude_volume_up_amount<100?100*amplitude_active_config.amplitude_volume+amplitude_active_config.amplitude_volume_up_amount:100),document.getElementById("amplitude-volume-slider")&&(document.getElementById("amplitude-volume-slider").value=100*amplitude_active_config.amplitude_volume)}function amplitude_set_active_song_information(e){if(amplitude_active_config.amplitude_before_song_information_set_callback){var a=window[amplitude_active_config.amplitude_before_song_information_set_callback];a()}if(amplitude_active_config.amplitude_active_song_information.song_title="undefined"!=e.name?e.name:"",amplitude_active_config.amplitude_active_song_information.artist="undefined"!=e.aritst?e.artist:"",amplitude_active_config.amplitude_active_song_information.cover_art_url="undefined"!=e.cover_art_url?e.cover_art_url:"",amplitude_active_config.amplitude_active_song_information.album="undefined"!=e.album?e.album:"",amplitude_active_config.amplitude_active_song_information.live="undefined"!=e.live?e.live:!1,amplitude_active_config.amplitude_active_song_information.url="undefined"!=e.url?e.url:"",amplitude_active_config.amplitude_active_song_information.visual_id="undefined"!=e.visual_id?e.visual_id:"",amplitude_active_song_information=amplitude_active_config.amplitude_active_song_information,amplitude_active_config.amplitude_after_song_information_set_callback){var i=window[amplitude_active_config.amplitude_after_song_information_set_callback];i()}}function amplitude_set_song_position(e){amplitude_active_config.amplitude_active_song.currentTime=amplitude_active_config.amplitude_active_song.duration*(e/100)}function amplitude_mute(){if(amplitude_active_config.amplitude_before_mute_callback){var e=window[amplitude_active_config.amplitude_before_mute_callback];e()}if(0==amplitude_active_config.amplitude_volume?amplitude_active_config.amplitude_volume=amplitude_active_config.amplitude_pre_mute_volume:(amplitude_active_config.amplitude_pre_mute_volume=amplitude_active_config.amplitude_volume,amplitude_active_config.amplitude_volume=0),amplitude_volume_update(100*amplitude_active_config.amplitude_volume),document.getElementById("amplitude-volume-slider")&&(document.getElementById("amplitude-volume-slider").value=100*amplitude_active_config.amplitude_volume),amplitude_active_config.amplitude_after_mute_callback){var a=window[amplitude_active_config.amplitude_after_mute_callback];a()}}function amplitude_set_song_info(){document.getElementById("amplitude-now-playing-artist")&&(document.getElementById("amplitude-now-playing-artist").innerHTML=amplitude_active_config.amplitude_active_song_information.artist),document.getElementById("amplitude-now-playing-title")&&(document.getElementById("amplitude-now-playing-title").innerHTML=amplitude_active_config.amplitude_active_song_information.song_title),document.getElementById("amplitude-now-playing-album")&&(document.getElementById("amplitude-now-playing-album").innerHTML=amplitude_active_config.amplitude_active_song_information.album),document.getElementById("amplitude-album-art")&&null!=amplitude_active_config.amplitude_active_song_information.cover_art_url&&(document.getElementById("amplitude-album-art").innerHTML='<img src="'+amplitude_active_config.amplitude_active_song_information.cover_art_url+'" class="amplitude-album-art-image"/>');var e=document.getElementsByClassName("amplitude-now-playing");e.length>0&&e[0].classList.remove("amplitude-now-playing"),void 0!=amplitude_active_config.amplitude_active_song_information.visual_id&&document.getElementById(amplitude_active_config.amplitude_active_song_information.visual_id)&&document.getElementById(amplitude_active_config.amplitude_active_song_information.visual_id).classList.add("amplitude-now-playing")}function amplitude_next_song(){if(amplitude_active_config.amplitude_before_next_callback){var e=window[amplitude_active_config.amplitude_before_next_callback];e()}if(amplitude_active_config.amplitude_shuffle?("undefined"!=typeof amplitude_active_config.amplitude_shuffle_list[parseInt(amplitude_active_config.amplitude_playlist_index)+1]?(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_shuffle_list[parseInt(amplitude_active_config.amplitude_playlist_index)+1].url,amplitude_active_config.amplitude_list_playing_index=amplitude_active_config.amplitude_shuffle_list[parseInt(amplitude_active_config.amplitude_playlist_index)+1].original,amplitude_active_config.amplitude_playlist_index=parseInt(amplitude_active_config.amplitude_playlist_index)+1):(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_shuffle_list[0].url,amplitude_active_config.amplitude_playlist_index=0,amplitude_active_config.amplitude_list_playing_index=amplitude_active_config.amplitude_shuffle_list[0].original),amplitude_set_active_song_information(amplitude_active_config.amplitude_shuffle_list[parseInt(amplitude_active_config.amplitude_playlist_index)]),amplitude_play_song()):("undefined"!=typeof amplitude_active_config.amplitude_songs[parseInt(amplitude_active_config.amplitude_playlist_index)+1]?(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_songs[parseInt(amplitude_active_config.amplitude_playlist_index)+1].url,amplitude_active_config.amplitude_playlist_index=parseInt(amplitude_active_config.amplitude_playlist_index)+1):(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_songs[0].url,amplitude_active_config.amplitude_playlist_index=0),amplitude_set_active_song_information(amplitude_active_config.amplitude_songs[parseInt(amplitude_active_config.amplitude_playlist_index)]),amplitude_play_song(),amplitude_active_config.amplitude_list_playing_index=parseInt(amplitude_active_config.amplitude_playlist_index)),amplitude_set_play_pause(),amplitude_set_playlist_play_pause(),amplitude_active_config.amplitude_after_next_callback){var a=window[amplitude_active_config.amplitude_after_next_callback];a()}}function amplitude_previous_song(){if(amplitude_active_config.amplitude_before_prev_callback){var e=window[amplitude_active_config.amplitude_before_prev_callback];e()}if(amplitude_active_config.amplitude_shuffle?("undefined"!=typeof amplitude_active_config.amplitude_shuffle_list[parseInt(amplitude_active_config.amplitude_playlist_index)-1]?(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_shuffle_list[parseInt(amplitude_active_config.amplitude_playlist_index)-1].url,amplitude_active_config.amplitude_list_playing_index=amplitude_active_config.amplitude_shuffle_list[parseInt(amplitude_active_config.amplitude_playlist_index)-1].original,amplitude_active_config.amplitude_playlist_index=parseInt(amplitude_active_config.amplitude_playlist_index)-1):(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_shuffle_list[amplitude_active_config.amplitude_shuffle_list.length-1].url,amplitude_active_config.amplitude_playlist_index=amplitude_active_config.amplitude_shuffle_list.length-1,amplitude_active_config.amplitude_list_playing_index=amplitude_active_config.amplitude_shuffle_list[amplitude_active_config.amplitude_shuffle_list.length-1].original),amplitude_set_active_song_information(amplitude_active_config.amplitude_shuffle_list[parseInt(amplitude_active_config.amplitude_playlist_index)]),amplitude_play_song()):("undefined"!=typeof amplitude_active_config.amplitude_songs[parseInt(amplitude_active_config.amplitude_playlist_index)-1]?(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_songs[parseInt(amplitude_active_config.amplitude_playlist_index)-1].url,amplitude_active_config.amplitude_playlist_index=parseInt(amplitude_active_config.amplitude_playlist_index)-1):(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_songs[amplitude_active_config.amplitude_songs.length-1].url,amplitude_active_config.amplitude_playlist_index=amplitude_active_config.amplitude_songs.length-1),amplitude_set_active_song_information(amplitude_active_config.amplitude_songs[parseInt(amplitude_active_config.amplitude_playlist_index)]),amplitude_play_song(),amplitude_active_config.amplitude_list_playing_index=parseInt(amplitude_active_config.amplitude_playlist_index)),amplitude_set_play_pause(),amplitude_set_playlist_play_pause(),amplitude_active_config.amplitude_after_prev_callback){var a=window[amplitude_active_config.amplitude_after_prev_callback];a()}}function amplitude_set_playlist_play_pause(){for(var e=document.getElementsByClassName("amplitude-play-pause"),a=0;a<e.length;a++){var i=" amplitude-list-paused";e[a].className=e[a].className.replace("amplitude-list-playing",""),e[a].className=e[a].className.replace(i,""),e[a].className=e[a].className+i}var t=document.querySelector('[amplitude-song-index="'+amplitude_active_config.amplitude_list_playing_index+'"]');null!=t&&(t.classList.add("amplitude-list-playing"),t.classList.remove("amplitude-list-paused"))}function amplitude_set_play_pause(){var e=document.getElementById("amplitude-play-pause");if(void 0!=e)if(amplitude_active_config.amplitude_active_song.paused){var a=" amplitude-paused";e.className=e.className.replace("amplitude-playing",""),e.className=e.className.replace(a,""),e.className=e.className+a}else{var a=" amplitude-playing";e.className=e.className.replace("amplitude-paused",""),e.className=e.className.replace(a,""),e.className=e.className+a}}function amplitude_shuffle_playlist(){amplitude_active_config.amplitude_shuffle?(amplitude_active_config.amplitude_shuffle=!1,amplitude_active_config.amplitude_shuffle_list={}):(amplitude_active_config.amplitude_shuffle=!0,amplitude_shuffle_songs())}function amplitude_shuffle_songs(){if(amplitude_active_config.amplitude_before_shuffle_callback){var e=window[amplitude_active_config.amplitude_before_shuffle_callback];e()}var a=new Array(amplitude_active_config.amplitude_songs.length);for(i=0;i<amplitude_active_config.amplitude_songs.length;i++)a[i]=amplitude_active_config.amplitude_songs[i],a[i].original=i;for(i=amplitude_active_config.amplitude_songs.length-1;i>0;i--){var t=Math.floor(Math.random()*amplitude_active_config.amplitude_songs.length+1);amplitude_shuffle_swap(a,i,t-1)}if(amplitude_active_config.amplitude_shuffle_list=a,amplitude_active_config.amplitude_after_shuffle_callback){var l=window[amplitude_active_config.amplitude_after_shuffle_callback];l()}}function amplitude_shuffle_swap(e,a,i){var t=e[a];e[a]=e[i],e[i]=t}function amplitude_bind_time_update(){amplitude_active_config.amplitude_active_song.addEventListener("timeupdate",function(){amplitude_update_time()})}function amplitude_prepare_list_play_pause(e){if(e!=amplitude_active_config.amplitude_list_playing_index&&(amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_songs[e].url,amplitude_set_active_song_information(amplitude_active_config.amplitude_songs[e])),amplitude_active_config.amplitude_list_playing_index=e,amplitude_active_config.amplitude_active_song.paused){if(amplitude_play_song(),document.getElementById("amplitude-play-pause")){var a="amplitude-playing";document.getElementById("amplitude-play-pause").className=document.getElementById("amplitude-play-pause").className.replace("amplitude-paused",""),document.getElementById("amplitude-play-pause").className=document.getElementById("amplitude-play-pause").className.replace(a,""),document.getElementById("amplitude-play-pause").className=document.getElementById("amplitude-play-pause").className+a}}else if(amplitude_pause_song(),document.getElementById("amplitude-play-pause")){var a="amplitude-paused";document.getElementById("amplitude-play-pause").className=document.getElementById("amplitude-play-pause").className.replace("amplitude-playing",""),document.getElementById("amplitude-play-pause").className=document.getElementById("amplitude-play-pause").className.replace(a,""),document.getElementById("amplitude-play-pause").className=document.getElementById("amplitude-play-pause").className+a}}function amplitude_add_song(e){return amplitude_active_config.amplitude_songs.push(e),amplitude_active_config.amplitude_songs.length-1}function amplitude_bind_song_additions(){document.addEventListener("DOMNodeInserted",function(e){if(void 0!=e.target.classList&&"amplitude-album-art-image"!=e.target.classList[0]){for(var a=document.getElementsByClassName("amplitude-play-pause"),i=0;i<a.length;i++)/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)?(a[i].removeEventListener("touchstart",amplitude_handle_play_pause_classes),a[i].addEventListener("touchstart",amplitude_handle_play_pause_classes)):(a[i].removeEventListener("click",amplitude_handle_play_pause_classes),a[i].addEventListener("click",amplitude_handle_play_pause_classes));
for(var t=document.getElementsByClassName("amplitude-song-slider"),i=0;i<t.length;i++)t[i].removeEventListener("input",amplitude_handle_song_sliders),t[i].addEventListener("input",amplitude_handle_song_sliders)}})}function amplitude_handle_play_pause_classes(){var e=document.getElementsByClassName("amplitude-play-pause");if(this.getAttribute("amplitude-song-index")!=amplitude_active_config.amplitude_list_playing_index){for(var a=0;a<e.length;a++){var i=" amplitude-list-paused";e[a].className=e[a].className.replace(" amplitude-list-playing",""),e[a].className=e[a].className.replace(i,""),e[a].className=e[a].className+i}var i=" amplitude-list-playing";this.className=this.className.replace(" amplitude-list-paused",""),this.className=this.className.replace(i,""),this.className=this.className+i}else if(amplitude_active_config.amplitude_active_song.paused){var i=" amplitude-list-playing";this.className=this.className.replace(" amplitude-list-paused",""),this.className=this.className.replace(i,""),this.className=this.className+i}else{var i=" amplitude-list-paused";this.className=this.className.replace(" amplitude-list-playing",""),this.className=this.className.replace(i,""),this.className=this.className+i}amplitude_prepare_list_play_pause(this.getAttribute("amplitude-song-index"))}function amplitude_handle_song_sliders(){amplitude_set_song_position(this.value)}function amplitude_disconnect_stream(){amplitude_active_config.amplitude_active_song.pause(),amplitude_active_config.amplitude_active_song.src="",amplitude_active_config.amplitude_active_song.load()}function amplitude_reconnect_stream(){amplitude_active_config.amplitude_active_song.src=amplitude_active_config.amplitude_active_song_information.url,amplitude_active_config.amplitude_active_song.load()}var amplitude_active_config={amplitude_active_song:null,amplitude_volume:.5,amplitude_pre_mute_volume:.5,amplitude_list_playing_index:null,amplitude_auto_play:!1,amplitude_songs:{},amplitude_shuffle:!1,amplitude_shuffle_list:{},amplitude_start_song:null,amplitude_volume_up_amount:10,amplitude_volume_down_amount:10,amplitude_continue_next:!1,amplitude_active_song_information:{},amplitude_before_play_callback:null,amplitude_after_play_callback:null,amplitude_before_stop_callback:null,amplitude_after_stop_callback:null,amplitude_before_next_callback:null,amplitude_after_next_callback:null,amplitude_before_prev_callback:null,amplitude_after_prev_callback:null,amplitude_before_pause_callback:null,amplitude_after_pause_callback:null,amplitude_before_shuffle_callback:null,amplitude_after_shuffle_callback:null,amplitude_before_volume_change_callback:null,amplitude_after_volume_change_callback:null,amplitude_before_mute_callback:null,amplitude_after_mute_callback:null,amplitude_before_time_update_callback:null,amplitude_after_time_update_callback:null,amplitude_before_song_information_set_callback:null,amplitude_after_song_information_set_callback:null,amplitude_before_song_added_callback:null,amplitude_after_song_added_callback:null},amplitude_active_song_information={};hook_amplitude_functions(amplitude_configure_variables),hook_amplitude_functions(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)?amplitude_web_mobile:amplitude_web_desktop),hook_amplitude_functions(amplitude_start);























(function( $ ) {
	$.fn.lfmr = function(options){
		var urla = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=windhamdavid&api_key=e12ea1d0253898ee9a93edfe42ffdeab&format=json&limit=100";
		var tracks = [];
		function isLoadedr (recentElement) {
			for (var i = 0; i < tracks.length; i++){
				var markup = $("<li class='list-group-item'>" + tracks[i].artist + " - <span class='artist'>" + tracks[i].title + " : " + tracks[i].album + "</li>");
				recentElement.append(markup);
			}
		}
		return this.each(function(){
			var $this = $(this);
			$.getJSON( urla, function(data){
				$(data.recenttracks.track).each(function(){
					tracks.push ({
						artist:	this.artist["#text"],
						title: this.name,
						album: this.album["#text"]
					});
				});
				isLoadedr($this);
			});
		});
	};
	
	$('.recent').lfmr();
  
	$.fn.lfya = function(options){
		var urla = "https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=windhamdavid&api_key=e12ea1d0253898ee9a93edfe42ffdeab&period=12month&format=json&limit=100";
		var artists = [];
		function isLoadeda (artistElement) {
			for (var i = 0; i < artists.length; i++){
				var markup = $("<li class='list-group-item'>" + artists[i].aname + "<span class='badge'>" + artists[i].played + "</span></li>");
				artistElement.append(markup);
			}
		}
		return this.each(function(){
			var $this = $(this);
			$.getJSON( urla, function(data){
				$(data.topartists.artist).each(function(){
					artists.push ({
						aname:	this.name,
						played: this.playcount
					});
				});
				isLoadeda($this);
			});
		});
	};
  
  $('.artists').lfya();
  
	$.fn.lfyt = function(options){
		var urla = "https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=windhamdavid&api_key=e12ea1d0253898ee9a93edfe42ffdeab&period=12month&format=json&limit=100";
		var tracks = [];
		function isLoadedt (tracksElement) {
			for (var i = 0; i < tracks.length; i++){
				var markup = $("<li class='list-group-item'>" + tracks[i].artist + " - <span class='artist'>" + tracks[i].title + "</span><span class='badge'>" + tracks[i].played + "</span></li>");
				tracksElement.append(markup);
			}
		}
		return this.each(function(){
			var $this = $(this);
			$.getJSON( urla, function(data){
				$(data.toptracks.track).each(function(){
					tracks.push ({
						title: this.name,
						artist: this.artist.name,
						played: this.playcount,
					});
				});
				isLoadedt($this);
			});
		});
	};
	
	$('.tracks').lfyt();
		
})( jQuery );

/* =======  SAVE FOR LATER Icecast 2.4 upgrade to fix CORs headers @ http://64.207.154.37:8008/status2.xsl ========
(function($){
	$.fn.icecast = function(options){
		$.ajaxSetup({
			cache:true,
			scriptCharset:"utf-8",
			contentType:"text/json;charset=utf-8"
		});
		var defaults = {
			server:"http://stream.davidawindham.com:8008/stream",
			stationlogo:""
		};
		var options = $.extend(defaults,options);
		return this.each(function(){var icecast = $(this);
			$.getJSON('http://'+options.server+'/status2.xsl',
			function(data){$.each(data.mounts,function(i,mount){
				$(icecast).append('<li class="mount"><div class="track">'+mount.title+'</div><div class="listeners">Listeners: '+mount.listeners+' at '+mount.bitrate+'kbps</div></li>');
			});
		});
	});	
};})(jQuery);

$(function(){
	$('.mounts').icecast({server:"64.207.154.37:8008"});
});
*/

amplitude_config = {
  amplitude_songs: []
//	"amplitude_songs": [{
//			"url": "http://code.davidawindham.com:8008/stream",
//			"live": true
//		}],
//	"amplitude_volume": 90
}

function get_radio_tower() {return 'img/radio.gif';}
function get_radio_none() {return 'img/none.svg';}
function get_radio_eq() {return 'img/eq.gif';}
function get_radio_eq_none() {return 'img/1.png';}

function radioTitle() {
	$('#radio').attr('src', get_radio_none()).fadeIn(300);
	$('#eq').attr('src', get_radio_eq_none()).fadeIn(300);
//    var url = 'http://code.davidawindham.com:8008/status2.xsl';
/*    var mountpoint = '/stream';
    $.ajax({ type: 'GET',
          url: url,
          async: true,
          jsonpCallback: 'parseMusic',
          contentType: "application/json",
          dataType: 'jsonp',
          success: function (json) {	
			$('#track').text(json[mountpoint].title);
      $('#listeners').text(json[mountpoint].listeners);
			$('#peak-listeners').text(json[mountpoint].peak_listeners); 
			$('#bitrate').text(json[mountpoint].bitrate); 
			$('#radio').attr('src', get_radio_tower()).fadeIn(300);
			$('#eq').attr('src', get_radio_eq()).fadeIn(300);
        },
          error: function (e) { console.log(e.message);
			  $('#radio').attr('src', get_radio_none()).fadeIn(300);
			  $('#eq').attr('src', get_radio_eq_none()).fadeIn(300);
        }
    });
*/
}

$(function() {
  var el, newPoint, newPlace, offset;
  $("input[type='range']").change(function() {
    el = $(this);
    width = el.width();
    newPoint = (el.val() - el.attr("min")) / (el.attr("max") - el.attr("min"));
    offset = -1.3;
    if (newPoint < 0) { newPlace = 0;  }
    else if (newPoint > 1) { newPlace = width; }
    else { newPlace = width * newPoint + offset; offset -= newPoint;}
    el
      .next("output")
      .css({
        left: newPlace,
        marginLeft: offset + "%"
      })
      .text(el.val());
  })
  .trigger('change');
});




$(document).ready(function () {
    //setTimeout(function () {radioTitle();}, 2000);
    //setInterval(function () {radioTitle();}, 30000); // update every 30 seconds
    
  spectrum();
    
  function spectrum() {
      var randomColor = Math.floor(Math.random()*16777215).toString(16);
      $("span#user-label").css({ backgroundColor: '#' + randomColor });
      //$("body").animate({ backgroundColor: '#' + randomColor });
      //$("body").animate({ backgroundColor: '#' + randomColor }, 1000);
      //spectrum();
  }
                            


  
});






