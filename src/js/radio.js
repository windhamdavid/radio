/*global amplitude_config:true */

// Whether the stream currently has a source, kept fresh by radioTitle()'s poll.
// Read when the play button is pressed — see the interceptor further down.
var streamOnline = false;

// One-shot autostart. It needs TWO things true: the stream is live (known from
// the status poll) and Amplitude has finished initializing (it binds its play
// handler on window.onload). Clicking before Amplitude is bound is a silent
// no-op, and radioAutoplayTried would then block a retry — so gate on both and
// let whichever finishes last fire it.
var radioAutoplayTried = false;
var amplitudeReady = false;
// After the load event, defer one turn so Amplitude's own onload handler (which
// binds the button) has definitely run.
window.addEventListener('load', function () {
  setTimeout(function () { amplitudeReady = true; maybeRadioAutoplay(); }, 0);
});

function maybeRadioAutoplay() {
  if (radioAutoplayTried || !amplitudeReady || !streamOnline) return;
  radioAutoplayTried = true;
  tryRadioAutoplay();
}

// A tiny silent WAV. Playing it unmuted is subject to the same per-page autoplay
// policy as the real stream, so a successful play() means autoplay is allowed.
var SILENT_CLIP =
  'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAgICAgICAgICAgICAgICA';

// Fallback for when the browser blocks load-autoplay (a cold visit, Safari,
// etc.): start the radio on the first user interaction anywhere on the page.
// The first real gesture is an activation the browser accepts, so audio starts
// without the user having to find the play button. Fires at most once.
function armFirstGestureAutoplay() {
  function start(e) {
    // If the gesture IS the play button, let Amplitude handle it — clicking it
    // ourselves too would toggle it right back to paused.
    if (e.target && e.target.closest && e.target.closest('#amplitude-play-pause')) {
      remove();
      return;
    }
    var btn = document.getElementById('amplitude-play-pause');
    if (streamOnline && btn && btn.classList.contains('amplitude-paused')) {
      btn.click();
      remove(); // started; stop listening
    }
    // If offline, stay armed so a later gesture (once live) still starts it.
  }
  function remove() {
    document.removeEventListener('pointerdown', start, true);
    document.removeEventListener('keydown', start, true);
  }
  document.addEventListener('pointerdown', start, true);
  document.addEventListener('keydown', start, true);
}

function tryRadioAutoplay() {
  var probe;
  try { probe = new Audio(SILENT_CLIP); } catch (e) { return; }
  var p = probe.play();
  if (!p || !p.then) return; // no promise: don't risk a fake-playing state
  p.then(function () {
    // Allowed. Stop the probe and start the real player via its button.
    try { probe.pause(); } catch (e) { /* noop */ }
    var btn = document.getElementById('amplitude-play-pause');
    if (btn && streamOnline && btn.classList.contains('amplitude-paused')) btn.click();
  }).catch(function () {
    // Blocked: leave the radio paused; the play button is right there.
  });
}


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




// Recently-played tracks, refreshed on an interval (see $(document).ready).
//
// REPLACES the list on each call — the old version appended, so polling would
// have stacked duplicates. Only the first load fades in; refreshes swap the
// items silently so the tab doesn't blink every couple of minutes. Values go in
// via text nodes / .text() so a track or artist name can't inject markup.
function getRecentTracks(initial) {
  $.getJSON(window.RADIO.url("api/lastfm?method=user.getrecenttracks&limit=100"), function (data) {
    var tracks = data && data.recenttracks && data.recenttracks.track;
    if (!tracks) return;
    $('.recent').each(function () {
      var $el = $(this).empty();
      $(tracks).each(function () {
        var $li = $("<li class='list-group-item'></li>");
        $li.append(document.createTextNode(this.artist["#text"] + " - "));
        $li.append($("<span class='artist'></span>").text(this.name + " : " + this.album["#text"]));
        $el.append($li);
      });
    });
    if (initial) $('.recent').hide().fadeIn(1000);
  });
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

      // Autostart if the browser allows it (see maybeRadioAutoplay / the probe).
      maybeRadioAutoplay();
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
  armFirstGestureAutoplay(); // start audio on first interaction if load-autoplay was blocked
  getRecentTracks(true); // initial load (fades in)
  // Refresh recent tracks every 2 minutes. The /api/lastfm proxy caches for
  // 60s, so a 120s poll always gets fresh data without hammering Last.fm.
  setInterval(function () { getRecentTracks(false); }, 120000);
  var randomColor = Math.floor(Math.random()*16777215).toString(16);
  $("span#user-label").css({ backgroundColor: '#' + randomColor });
  $('ul.nav-tabs a').tooltip();
});