/**** Radio Functions ****/

/* Last-fm API */
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


amplitude_config = {
//  amplitude_songs: []
	"amplitude_songs": [{
			"url": "http://stream.davidawindham.com:8008/stream",
			"live": true
		}],
	"amplitude_volume": 90
}

function get_radio_tower() {return 'img/radio.gif';}
function get_radio_none() {return 'img/none.svg';}
function get_radio_eq() {return 'img/eq.gif';}
function get_radio_eq_none() {return 'img/none.svg';}

var interval = null;
$(document).ready(function() {
  interval = setInterval(radioTitle,30000); // every 30 seconds stop polling if offline
});

function radioTitle() {
	$('#radio').attr('src', get_radio_none()).fadeIn(300);
	$('#eq').attr('src', get_radio_eq_none()).fadeIn(300);
    var url = 'http://stream.davidawindham.com/status2.xsl';
    var mountpoint = '/stream';
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
      error: function(e){
        console.error('cannot connect to stream');
        $('#connection-error').modal('show');
        clearInterval(interval);
  		  $('#radio').attr('src', get_radio_none()).fadeIn(300);
  		  $('#eq').attr('src', get_radio_eq_none()).fadeIn(300);
      }
  });
}



$(document).ready(function() {
  function spectrum() {
      var randomColor = Math.floor(Math.random()*16777215).toString(16);
      $("span#user-label").css({ backgroundColor: '#' + randomColor });
  };                        
  $('ul.nav-tabs a').tooltip();
  
});






