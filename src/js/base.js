/*global io:true */

// Shared client bootstrap. Loaded first in radio.min.js, before chat.js and
// radio.js, so both use one socket and one notion of where the app is mounted.
window.RADIO = (function () {
  // The page may be served at / or under a prefix like /radio/. Deriving the
  // prefix from the URL keeps the bundle identical in both cases -- nothing is
  // baked in at build time. app.js redirects /radio -> /radio/, so there is
  // always a trailing slash to strip back to.
  var base = window.location.pathname.replace(/\/[^\/]*$/, '');

  return {
    base: base,

    // Build a URL for a server route, relative to wherever we're mounted.
    url: function (route) {
      return base + '/' + route;
    },

    // One connection for the whole page.
    //
    // chat.js and radio.js each used to call io.connect() themselves, giving
    // every visitor two sockets. The server keys a username to a socket, so
    // setNickname landed on radio.js's connection while messages were sent
    // from chat.js's -- meaning chat always showed 'anonymous'. One socket,
    // shared, is the fix.
    socket: io({ path: base + '/socket.io' })
  };
})();
