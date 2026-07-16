/*global amplitude_config:true */

// Whether the stream currently has a source, kept fresh by radioTitle()'s poll.
// Read when the play button is pressed — see the interceptor further down.
var streamOnline = false;


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

// Off-air *artwork* only — no dialog. The poll calls this, so the player reads
// as off air quietly in the background.
function showOffAirArt() {
  $('#track').text('* Off Air *');
  $('#radio').attr('src', get_radio_none()).fadeIn(300);
  $('#eq').attr('src', get_radio_eq_none()).fadeIn(300);
}

// The dialog, shown only in response to someone actually trying to play, or a
// retry that failed. It used to be fired by the 20s poll, which meant it threw
// itself over the page unprompted whenever nobody was broadcasting.
//
// Resets the progress bar each time it opens, so a second attempt doesn't start
// out showing the last one's finished bar and stale ERROR.
function showConnectionError() {
  $('#error-reconnecting').hide();
  $('#error-reconnecting-again').hide();
  $('#connection-error-reconnecting').attr('data-transitiongoal', 0).progressbar();
  $('#connection-error').modal('show');
}

// Now-playing info comes from our own /api/status, which proxies Icecast's
// status-json.xsl server-side.
//
// This used to be a JSONP call straight to the stream host's status2.xsl. That
// approach depended on a hand-edited XSL file that Icecast upgrades overwrite;
// it 404s today and has since the 2021 upgrade noted in the README. Same-origin
// JSON also means no mixed content and no JSONP.
// Returns the jqXHR so the retry button can wait on it.
function radioTitle() {
  return $.getJSON(window.RADIO.url('api/status'))
    .done(function(status) {
      streamOnline = !!(status && status.online);
      if (!streamOnline) {
        showOffAirArt();
        return;
      }
      // Back on air: close the dialog if someone's sitting in front of it.
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
      streamOnline = false;
      showOffAirArt();
    });
}
interval = setInterval(radioTitle,20000); // every 20 seconds

/**** Page Features ****/

$(document).ready(function() {
  // Nothing is thrown up on load any more. The terms modal is gone, and the
  // nickname modal opens from the person button beside the message box
  // (data-toggle="modal" wires that up, no JS needed). Chatting as 'anonymous'
  // is fine; naming yourself is opt-in.

  // Press play with nothing broadcasting -> show the connection dialog.
  //
  // Bound on document in the CAPTURE phase so it runs before the event ever
  // reaches the button, which is what lets stopPropagation keep Amplitude's own
  // click handler from firing. (Binding on the button itself wouldn't do it:
  // at the target, listeners run in registration order regardless of capture,
  // and Amplitude registers first.) Without this the click silently starts a
  // doomed playback attempt against a dead mount and nothing tells the user.
  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    if (!e.target.closest('#amplitude-play-pause')) return;
    if (streamOnline) return;   // let Amplitude have it
    e.stopPropagation();
    e.preventDefault();
    showConnectionError();
  }, true);

  // Retry actually re-checks now. It used to just animate the bar to 100% and
  // announce ERROR on the `done` callback, having asked the server nothing.
  //
  // Bound once, here. It used to be bound inside showOffAir(), which the poll
  // called every 20 seconds, so the handlers stacked up for as long as the
  // stream was down and then all fired on a single click.
  $('#connection-error-retry').on('click', function () {
    $('#error-reconnecting-again').hide();
    $('#error-reconnecting').show();
    $('#connection-error-reconnecting').attr('data-transitiongoal', 100).progressbar();
    radioTitle().always(function () {
      if (streamOnline) {
        $('#connection-error').modal('hide');
      } else {
        $('#error-reconnecting-again').show();
      }
    });
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