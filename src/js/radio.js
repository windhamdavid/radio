/*!
 * jQuery Color Animations v@VERSION
 * https://github.com/jquery/jquery-color
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: @DATE
 */
(function( jQuery, undefined ) {

	var stepHooks = "backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor",

	// plusequals test for += 100 -= 100
	rplusequals = /^([\-+])=\s*(\d+\.?\d*)/,
	// a set of RE's that can match strings and generate color tuples.
	stringParsers = [{
			re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ],
					execResult[ 3 ],
					execResult[ 4 ]
				];
			}
		}, {
			re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ] * 2.55,
					execResult[ 2 ] * 2.55,
					execResult[ 3 ] * 2.55,
					execResult[ 4 ]
				];
			}
		}, {
			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ], 16 )
				];
			}
		}, {
			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9])([a-f0-9])([a-f0-9])/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ] + execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ] + execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ] + execResult[ 3 ], 16 )
				];
			}
		}, {
			re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			space: "hsla",
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ] / 100,
					execResult[ 3 ] / 100,
					execResult[ 4 ]
				];
			}
		}],

	// jQuery.Color( )
	color = jQuery.Color = function( color, green, blue, alpha ) {
		return new jQuery.Color.fn.parse( color, green, blue, alpha );
	},
	spaces = {
		rgba: {
			props: {
				red: {
					idx: 0,
					type: "byte"
				},
				green: {
					idx: 1,
					type: "byte"
				},
				blue: {
					idx: 2,
					type: "byte"
				}
			}
		},

		hsla: {
			props: {
				hue: {
					idx: 0,
					type: "degrees"
				},
				saturation: {
					idx: 1,
					type: "percent"
				},
				lightness: {
					idx: 2,
					type: "percent"
				}
			}
		}
	},
	propTypes = {
		"byte": {
			floor: true,
			max: 255
		},
		"percent": {
			max: 1
		},
		"degrees": {
			mod: 360,
			floor: true
		}
	},
	support = color.support = {},

	// element for support tests
	supportElem = jQuery( "<p>" )[ 0 ],

	// colors = jQuery.Color.names
	colors,

	// local aliases of functions called often
	each = jQuery.each;

// determine rgba support immediately
supportElem.style.cssText = "background-color:rgba(1,1,1,.5)";
support.rgba = supportElem.style.backgroundColor.indexOf( "rgba" ) > -1;

// define cache name and alpha properties
// for rgba and hsla spaces
each( spaces, function( spaceName, space ) {
	space.cache = "_" + spaceName;
	space.props.alpha = {
		idx: 3,
		type: "percent",
		def: 1
	};
});

function clamp( value, prop, allowEmpty ) {
	var type = propTypes[ prop.type ] || {};

	if ( value == null ) {
		return (allowEmpty || !prop.def) ? null : prop.def;
	}

	// ~~ is an short way of doing floor for positive numbers
	value = type.floor ? ~~value : parseFloat( value );

	// IE will pass in empty strings as value for alpha,
	// which will hit this case
	if ( isNaN( value ) ) {
		return prop.def;
	}

	if ( type.mod ) {
		// we add mod before modding to make sure that negatives values
		// get converted properly: -10 -> 350
		return (value + type.mod) % type.mod;
	}

	// for now all property types without mod have min and max
	return 0 > value ? 0 : type.max < value ? type.max : value;
}

function stringParse( string ) {
	var inst = color(),
		rgba = inst._rgba = [];

	string = string.toLowerCase();

	each( stringParsers, function( i, parser ) {
		var parsed,
			match = parser.re.exec( string ),
			values = match && parser.parse( match ),
			spaceName = parser.space || "rgba";

		if ( values ) {
			parsed = inst[ spaceName ]( values );

			// if this was an rgba parse the assignment might happen twice
			// oh well....
			inst[ spaces[ spaceName ].cache ] = parsed[ spaces[ spaceName ].cache ];
			rgba = inst._rgba = parsed._rgba;

			// exit each( stringParsers ) here because we matched
			return false;
		}
	});

	// Found a stringParser that handled it
	if ( rgba.length ) {

		// if this came from a parsed string, force "transparent" when alpha is 0
		// chrome, (and maybe others) return "transparent" as rgba(0,0,0,0)
		if ( rgba.join() === "0,0,0,0" ) {
			jQuery.extend( rgba, colors.transparent );
		}
		return inst;
	}

	// named colors
	return colors[ string ];
}

color.fn = jQuery.extend( color.prototype, {
	parse: function( red, green, blue, alpha ) {
		if ( red === undefined ) {
			this._rgba = [ null, null, null, null ];
			return this;
		}
		if ( red.jquery || red.nodeType ) {
			red = jQuery( red ).css( green );
			green = undefined;
		}

		var inst = this,
			type = jQuery.type( red ),
			rgba = this._rgba = [];

		// more than 1 argument specified - assume ( red, green, blue, alpha )
		if ( green !== undefined ) {
			red = [ red, green, blue, alpha ];
			type = "array";
		}

		if ( type === "string" ) {
			return this.parse( stringParse( red ) || colors._default );
		}

		if ( type === "array" ) {
			each( spaces.rgba.props, function( key, prop ) {
				rgba[ prop.idx ] = clamp( red[ prop.idx ], prop );
			});
			return this;
		}

		if ( type === "object" ) {
			if ( red instanceof color ) {
				each( spaces, function( spaceName, space ) {
					if ( red[ space.cache ] ) {
						inst[ space.cache ] = red[ space.cache ].slice();
					}
				});
			} else {
				each( spaces, function( spaceName, space ) {
					var cache = space.cache;
					each( space.props, function( key, prop ) {

						// if the cache doesn't exist, and we know how to convert
						if ( !inst[ cache ] && space.to ) {

							// if the value was null, we don't need to copy it
							// if the key was alpha, we don't need to copy it either
							if ( key === "alpha" || red[ key ] == null ) {
								return;
							}
							inst[ cache ] = space.to( inst._rgba );
						}

						// this is the only case where we allow nulls for ALL properties.
						// call clamp with alwaysAllowEmpty
						inst[ cache ][ prop.idx ] = clamp( red[ key ], prop, true );
					});

					// everything defined but alpha?
					if ( inst[ cache ] && jQuery.inArray( null, inst[ cache ].slice( 0, 3 ) ) < 0 ) {
						// use the default of 1
						inst[ cache ][ 3 ] = 1;
						if ( space.from ) {
							inst._rgba = space.from( inst[ cache ] );
						}
					}
				});
			}
			return this;
		}
	},
	is: function( compare ) {
		var is = color( compare ),
			same = true,
			inst = this;

		each( spaces, function( _, space ) {
			var localCache,
				isCache = is[ space.cache ];
			if (isCache) {
				localCache = inst[ space.cache ] || space.to && space.to( inst._rgba ) || [];
				each( space.props, function( _, prop ) {
					if ( isCache[ prop.idx ] != null ) {
						same = ( isCache[ prop.idx ] === localCache[ prop.idx ] );
						return same;
					}
				});
			}
			return same;
		});
		return same;
	},
	_space: function() {
		var used = [],
			inst = this;
		each( spaces, function( spaceName, space ) {
			if ( inst[ space.cache ] ) {
				used.push( spaceName );
			}
		});
		return used.pop();
	},
	transition: function( other, distance ) {
		var end = color( other ),
			spaceName = end._space(),
			space = spaces[ spaceName ],
			startColor = this.alpha() === 0 ? color( "transparent" ) : this,
			start = startColor[ space.cache ] || space.to( startColor._rgba ),
			result = start.slice();

		end = end[ space.cache ];
		each( space.props, function( key, prop ) {
			var index = prop.idx,
				startValue = start[ index ],
				endValue = end[ index ],
				type = propTypes[ prop.type ] || {};

			// if null, don't override start value
			if ( endValue === null ) {
				return;
			}
			// if null - use end
			if ( startValue === null ) {
				result[ index ] = endValue;
			} else {
				if ( type.mod ) {
					if ( endValue - startValue > type.mod / 2 ) {
						startValue += type.mod;
					} else if ( startValue - endValue > type.mod / 2 ) {
						startValue -= type.mod;
					}
				}
				result[ index ] = clamp( ( endValue - startValue ) * distance + startValue, prop );
			}
		});
		return this[ spaceName ]( result );
	},
	blend: function( opaque ) {
		// if we are already opaque - return ourself
		if ( this._rgba[ 3 ] === 1 ) {
			return this;
		}

		var rgb = this._rgba.slice(),
			a = rgb.pop(),
			blend = color( opaque )._rgba;

		return color( jQuery.map( rgb, function( v, i ) {
			return ( 1 - a ) * blend[ i ] + a * v;
		}));
	},
	toRgbaString: function() {
		var prefix = "rgba(",
			rgba = jQuery.map( this._rgba, function( v, i ) {
				return v == null ? ( i > 2 ? 1 : 0 ) : v;
			});

		if ( rgba[ 3 ] === 1 ) {
			rgba.pop();
			prefix = "rgb(";
		}

		return prefix + rgba.join() + ")";
	},
	toHslaString: function() {
		var prefix = "hsla(",
			hsla = jQuery.map( this.hsla(), function( v, i ) {
				if ( v == null ) {
					v = i > 2 ? 1 : 0;
				}

				// catch 1 and 2
				if ( i && i < 3 ) {
					v = Math.round( v * 100 ) + "%";
				}
				return v;
			});

		if ( hsla[ 3 ] === 1 ) {
			hsla.pop();
			prefix = "hsl(";
		}
		return prefix + hsla.join() + ")";
	},
	toHexString: function( includeAlpha ) {
		var rgba = this._rgba.slice(),
			alpha = rgba.pop();

		if ( includeAlpha ) {
			rgba.push( ~~( alpha * 255 ) );
		}

		return "#" + jQuery.map( rgba, function( v ) {

			// default to 0 when nulls exist
			v = ( v || 0 ).toString( 16 );
			return v.length === 1 ? "0" + v : v;
		}).join("");
	},
	toString: function() {
		return this._rgba[ 3 ] === 0 ? "transparent" : this.toRgbaString();
	}
});
color.fn.parse.prototype = color.fn;

// hsla conversions adapted from:
// https://code.google.com/p/maashaack/source/browse/packages/graphics/trunk/src/graphics/colors/HUE2RGB.as?r=5021

function hue2rgb( p, q, h ) {
	h = ( h + 1 ) % 1;
	if ( h * 6 < 1 ) {
		return p + (q - p) * h * 6;
	}
	if ( h * 2 < 1) {
		return q;
	}
	if ( h * 3 < 2 ) {
		return p + (q - p) * ((2/3) - h) * 6;
	}
	return p;
}

spaces.hsla.to = function ( rgba ) {
	if ( rgba[ 0 ] == null || rgba[ 1 ] == null || rgba[ 2 ] == null ) {
		return [ null, null, null, rgba[ 3 ] ];
	}
	var r = rgba[ 0 ] / 255,
		g = rgba[ 1 ] / 255,
		b = rgba[ 2 ] / 255,
		a = rgba[ 3 ],
		max = Math.max( r, g, b ),
		min = Math.min( r, g, b ),
		diff = max - min,
		add = max + min,
		l = add * 0.5,
		h, s;

	if ( min === max ) {
		h = 0;
	} else if ( r === max ) {
		h = ( 60 * ( g - b ) / diff ) + 360;
	} else if ( g === max ) {
		h = ( 60 * ( b - r ) / diff ) + 120;
	} else {
		h = ( 60 * ( r - g ) / diff ) + 240;
	}

	// chroma (diff) == 0 means greyscale which, by definition, saturation = 0%
	// otherwise, saturation is based on the ratio of chroma (diff) to lightness (add)
	if ( diff === 0 ) {
		s = 0;
	} else if ( l <= 0.5 ) {
		s = diff / add;
	} else {
		s = diff / ( 2 - add );
	}
	return [ Math.round(h) % 360, s, l, a == null ? 1 : a ];
};

spaces.hsla.from = function ( hsla ) {
	if ( hsla[ 0 ] == null || hsla[ 1 ] == null || hsla[ 2 ] == null ) {
		return [ null, null, null, hsla[ 3 ] ];
	}
	var h = hsla[ 0 ] / 360,
		s = hsla[ 1 ],
		l = hsla[ 2 ],
		a = hsla[ 3 ],
		q = l <= 0.5 ? l * ( 1 + s ) : l + s - l * s,
		p = 2 * l - q;

	return [
		Math.round( hue2rgb( p, q, h + ( 1 / 3 ) ) * 255 ),
		Math.round( hue2rgb( p, q, h ) * 255 ),
		Math.round( hue2rgb( p, q, h - ( 1 / 3 ) ) * 255 ),
		a
	];
};


each( spaces, function( spaceName, space ) {
	var props = space.props,
		cache = space.cache,
		to = space.to,
		from = space.from;

	// makes rgba() and hsla()
	color.fn[ spaceName ] = function( value ) {

		// generate a cache for this space if it doesn't exist
		if ( to && !this[ cache ] ) {
			this[ cache ] = to( this._rgba );
		}
		if ( value === undefined ) {
			return this[ cache ].slice();
		}

		var ret,
			type = jQuery.type( value ),
			arr = ( type === "array" || type === "object" ) ? value : arguments,
			local = this[ cache ].slice();

		each( props, function( key, prop ) {
			var val = arr[ type === "object" ? key : prop.idx ];
			if ( val == null ) {
				val = local[ prop.idx ];
			}
			local[ prop.idx ] = clamp( val, prop );
		});

		if ( from ) {
			ret = color( from( local ) );
			ret[ cache ] = local;
			return ret;
		} else {
			return color( local );
		}
	};

	// makes red() green() blue() alpha() hue() saturation() lightness()
	each( props, function( key, prop ) {
		// alpha is included in more than one space
		if ( color.fn[ key ] ) {
			return;
		}
		color.fn[ key ] = function( value ) {
			var vtype = jQuery.type( value ),
				fn = ( key === "alpha" ? ( this._hsla ? "hsla" : "rgba" ) : spaceName ),
				local = this[ fn ](),
				cur = local[ prop.idx ],
				match;

			if ( vtype === "undefined" ) {
				return cur;
			}

			if ( vtype === "function" ) {
				value = value.call( this, cur );
				vtype = jQuery.type( value );
			}
			if ( value == null && prop.empty ) {
				return this;
			}
			if ( vtype === "string" ) {
				match = rplusequals.exec( value );
				if ( match ) {
					value = cur + parseFloat( match[ 2 ] ) * ( match[ 1 ] === "+" ? 1 : -1 );
				}
			}
			local[ prop.idx ] = value;
			return this[ fn ]( local );
		};
	});
});

// add cssHook and .fx.step function for each named hook.
// accept a space separated string of properties
color.hook = function( hook ) {
	var hooks = hook.split( " " );
	each( hooks, function( i, hook ) {
		jQuery.cssHooks[ hook ] = {
			set: function( elem, value ) {
				var parsed, curElem,
					backgroundColor = "";

				if ( value !== "transparent" && ( jQuery.type( value ) !== "string" || ( parsed = stringParse( value ) ) ) ) {
					value = color( parsed || value );
					if ( !support.rgba && value._rgba[ 3 ] !== 1 ) {
						curElem = hook === "backgroundColor" ? elem.parentNode : elem;
						while (
							(backgroundColor === "" || backgroundColor === "transparent") &&
							curElem && curElem.style
						) {
							try {
								backgroundColor = jQuery.css( curElem, "backgroundColor" );
								curElem = curElem.parentNode;
							} catch ( e ) {
							}
						}

						value = value.blend( backgroundColor && backgroundColor !== "transparent" ?
							backgroundColor :
							"_default" );
					}

					value = value.toRgbaString();
				}
				try {
					elem.style[ hook ] = value;
				} catch( e ) {
					// wrapped to prevent IE from throwing errors on "invalid" values like 'auto' or 'inherit'
				}
			}
		};
		jQuery.fx.step[ hook ] = function( fx ) {
			if ( !fx.colorInit ) {
				fx.start = color( fx.elem, hook );
				fx.end = color( fx.end );
				fx.colorInit = true;
			}
			jQuery.cssHooks[ hook ].set( fx.elem, fx.start.transition( fx.end, fx.pos ) );
		};
	});

};

color.hook( stepHooks );

jQuery.cssHooks.borderColor = {
	expand: function( value ) {
		var expanded = {};

		each( [ "Top", "Right", "Bottom", "Left" ], function( i, part ) {
			expanded[ "border" + part + "Color" ] = value;
		});
		return expanded;
	}
};

// Basic color names only.
// Usage of any of the other color names requires adding yourself or including
// jquery.color.svg-names.js.
colors = jQuery.Color.names = {
	// 4.1. Basic color keywords
	aqua: "#00ffff",
	black: "#000000",
	blue: "#0000ff",
	fuchsia: "#ff00ff",
	gray: "#808080",
	green: "#008000",
	lime: "#00ff00",
	maroon: "#800000",
	navy: "#000080",
	olive: "#808000",
	purple: "#800080",
	red: "#ff0000",
	silver: "#c0c0c0",
	teal: "#008080",
	white: "#ffffff",
	yellow: "#ffff00",

	// 4.2.3. "transparent" color keyword
	transparent: [ null, null, null, 0 ],

	_default: "#ffffff"
};

}( jQuery ));

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






