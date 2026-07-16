/*global amplitude_config:true */

// TEMPORARY (2026-07-16) — suppresses the "Off the Air" modal, which pops up
// whenever the stream has no source (i.e. right now) and covers the page.
//
// This is all that's left of review mode: the terms and nickname/password
// modals are gone for good now, not just hidden. The off-air artwork still
// swaps in either way, so the player reads as off air regardless — this only
// stops the dialog. Set to false to get the dialog back.
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
  // Nothing is thrown up on load any more. The terms modal is gone, and the
  // nickname modal opens from the person button beside the message box
  // (data-toggle="modal" wires that up, no JS needed). Chatting as 'anonymous'
  // is fine; naming yourself is opt-in.
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