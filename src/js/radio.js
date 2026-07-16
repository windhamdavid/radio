/*global amplitude_config:true */

// ===========================================================================
// TEMPORARY (2026-07-16) — REVIEW MODE. Set to false to restore normal behaviour.
//
// Suppresses every modal that covers the page on load, so the layout and the
// site chrome can be looked at without clicking through:
//   - #auth-modal      terms / "I have read and agree"
//   - #modal_setnick   nickname + password (chained from the terms modal)
//   - #connection-error "Off the Air" (shows whenever the stream has no source,
//                       which is right now — it would cover the page otherwise)
//
// Only the modal *display* is suppressed. All the markup and handlers are
// untouched, so flipping this back restores the entry flow exactly. The off-air
// artwork still swaps in, so the player still reads as off air.
//
// Nothing security-relevant is lost here: the password modal never was real
// protection (see the /other route in app.js).
// ===========================================================================
var REVIEW_MODE = true;


/* Radio Funtions */

/**** Last-fm API ****/

// These go through our own /api/lastfm rather than straight to audioscrobbler.
// The API key used to be inlined here four times and shipped in the bundle; it
// now lives in $LASTFM_API_KEY on the server. The server allowlists the method,
// period and limit, so this is not an open relay.

(function( $ ) {

	$.fn.lfya = function(){
		var urla = window.RADIO.url("api/lastfm?method=user.gettopartists&period=12month&limit=200");
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
		var urla = window.RADIO.url("api/lastfm?method=user.gettoptracks&period=12month&limit=200");
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
		var url = window.RADIO.url("api/lastfm?method=user.gettopalbums&period=12month&limit=200");
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
		var urla = window.RADIO.url("api/lastfm?method=user.getrecenttracks&limit=100");
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
  if (!REVIEW_MODE) {
    $('#connection-error').modal('show');
  }
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
  // See REVIEW_MODE at the top of this file. Skipping the terms modal also skips
  // the nickname/password modal it chains into, so everyone stays 'anonymous'
  // in chat while review mode is on.
  if (!REVIEW_MODE) {
    $('#auth-modal').modal('show');
  }
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