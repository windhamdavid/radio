/*global amplitude_config:true */


/* Radio Funtions */

/**** Last-fm API ****/

(function( $ ) {
  
	$.fn.lfya = function(){
		var urla = "https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=windhamdavid&api_key=e12ea1d0253898ee9a93edfe42ffdeab&period=12month&format=json&limit=200";
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
  
	$.fn.lfyt = function(){
		var urla = "https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=windhamdavid&api_key=e12ea1d0253898ee9a93edfe42ffdeab&period=12month&format=json&limit=200";
		var tracks = [];
		function isLoadedt (tracksElement) {
			for (var i = 0; i < tracks.length; i++){
				var markup = $("<li class='list-group-item'>" + tracks[i].artist + ": <span class='artist'>" + tracks[i].title + "</span><span class='badge'>" + tracks[i].played + "</span></li>");
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
  
	$.fn.lfm = function(){
		var url = "https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=windhamdavid&api_key=e12ea1d0253898ee9a93edfe42ffdeab&period=12month&format=json&limit=200";
		var albums = [];
		function isLoaded (albumElement) {
			for (var i = 0; i < albums.length; i++){
				var markup = $("<li class='list-group-item'>" + albums[i].artist + ": <span class='artist'>" + albums[i].name + "</span></li>");
				albumElement.append(markup);
			}
			albumElement.find('.album').hover(function(){
				$(this).addClass('flip');
			},function(){
				$(this).removeClass('flip');
			});
		}
		return this.each(function(){
			var $this = $(this);
			$.getJSON( url, function(data){
				$(data.topalbums.album).each(function(){
					albums.push ({
						name:	this.name,
						artist: this.artist.name,
						played: this.playcount,
						art:	this.image[this.image.length-1]["#text"]
					});
				});
				isLoaded($this);
			});
		});
	};
	
	$('.albums').lfm();
  
})( jQuery );




function getRecentTracks() {
  
	$.fn.lfmr = function(){
    //tracksinterval = setInterval(getRecentTracks,180000);  // check every 3 minutes
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
  $('.recent').hide();
  $('.recent').fadeIn(1000);
}


/**** Audio Player ****/

// __STREAM_URL__ is substituted at build time from $STREAM_URL (see build.mjs).
// It must be https:// -- the page is served over TLS, and a http:// stream is
// blocked as mixed content, which is what the old :8008 URL would hit today.
amplitude_config = {
	"amplitude_songs": [{
			"url": __STREAM_URL__,
			"live": true
		}],
	"amplitude_volume": 73
};

function get_radio_tower() {return 'img/radio.gif';}
function get_radio_none() {return 'img/none.svg';}
function get_radio_eq() {return 'img/eq.gif';}
function get_radio_eq_none() {return 'img/1.png';}


var interval = null;

function showOffAir() {
  $('#connection-error').modal('show');
  $('#error-reconnecting').hide();
  $('#error-reconnecting-again').hide();
  $('#connection-error-reconnecting').attr('data-transitiongoal', 0).progressbar();
  $('#connection-error-retry').on('click', function () {
    $('#error-reconnecting').show();
    $('#connection-error-reconnecting').attr('data-transitiongoal', 100).progressbar({
        done: function() { $('#error-reconnecting-again').show(); }
    });
  });
  $('#track').text('* Off Air *');
  $('#radio').attr('src', get_radio_none()).fadeIn(300);
  $('#eq').attr('src', get_radio_eq_none()).fadeIn(300);
}

// Now-playing info comes from our own /api/status, which proxies Icecast's
// status-json.xsl server-side.
//
// This used to be a JSONP call straight to the stream host's status2.xsl. That
// approach depended on a hand-edited XSL file that Icecast upgrades overwrite;
// it 404s today and has since the 2021 upgrade noted in the README. Same-origin
// JSON also means no mixed content and no JSONP.
function radioTitle() {
  $.getJSON(window.RADIO.url('api/status'))
    .done(function(status) {
      if (!status || !status.online) {
        showOffAir();
        return;
      }
      $('#connection-error').modal('hide');
      $('#track').text(status.title || 'Unknown track');
      $('#listeners').text(status.listeners);
      $('#peak-listeners').text(status.peakListeners);
      $('#bitrate').text(status.bitrate === null ? '--' : status.bitrate);
      $('#radio').attr('src', get_radio_tower()).fadeIn(300);
      $('#eq').attr('src', get_radio_eq()).fadeIn(300);
    })
    .fail(function() {
      // Keep polling rather than clearInterval-ing on the first blip, so the
      // page recovers on its own once the stream or server is back.
      showOffAir();
    });
}
interval = setInterval(radioTitle,20000); // every 20 seconds

/**** Page Features ****/

$(document).ready(function() {
  $('#auth-modal').modal('show');
  $('#auth').validator().on('submit', function (e) {
    if (e.isDefaultPrevented()) {
    } else {
      e.preventDefault();
      $('#auth-modal').modal('hide');
      $('#modal_setnick').modal('show');
    }
  }); 
  $('#nick').validator();
  var socket = window.RADIO.socket;
  var getNickname = function() {
      var nickname = $('#nickname').val();
      $('#nickname').val("");
      return nickname;
  };
  $('#nick').validator().on('submit', function (e) {
    if (e.isDefaultPrevented()) {
    } else {
      e.preventDefault();
      socket.emit('setNickname', {'username':getNickname()});
      $('#modal_setnick').modal('hide');
    }
  }); 
  radioTitle(); // call it once on load to avoid 20s delay
  getRecentTracks();  //call it once to avoid 3m delay
  var randomColor = Math.floor(Math.random()*16777215).toString(16);
  $("span#user-label").css({ backgroundColor: '#' + randomColor });
  $('ul.nav-tabs a').tooltip();
});