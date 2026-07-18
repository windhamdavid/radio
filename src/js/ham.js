/* the-ham.org live video panel.
 *
 * A persistent "Video Stream" bar with a status dot and a chevron. The video
 * collapses/expands beneath it:
 *   - dot: dim when nothing's broadcasting, red + pulsing when a source is live
 *   - chevron: down when collapsed, up when expanded; click the bar to toggle
 *   - when a stream goes live it auto-expands and autoplays MUTED (the only
 *     autoplay browsers allow); the corner button unmutes
 *   - collapsing tears the video down (no wasted bandwidth); expanding replays
 *
 * Live state comes from /api/live (which proxies the-ham's nginx-rtmp stat.xml).
 * hls.js is loaded lazily the first time video actually plays, so the idle case
 * costs zero bytes beyond this small file.
 */
(function () {
  var POLL_MS = 15000;

  var panel, head, dot, chevron, body, wrap, video, muteBtn, errBox, offlineMsg;
  var live = false;         // is a source publishing?
  var expanded = false;     // is the body open?
  var userCollapsed = false; // did the user collapse it while live?
  var currentUrl = null, currentName = null;
  var playingUrl = null;    // guards against restarting hls on every poll
  var hls = null, hlsLoading = false, hlsWaiters = [];

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ----- hls.js, loaded on demand -------------------------------------------
  function loadHls(cb) {
    if (window.Hls) return cb();
    hlsWaiters.push(cb);
    if (hlsLoading) return;
    hlsLoading = true;
    var s = document.createElement('script');
    s.src = window.RADIO.url('js/hls.min.js');
    s.onload = function () {
      var fns = hlsWaiters; hlsWaiters = [];
      fns.forEach(function (f) { f(); });
    };
    s.onerror = function () { showError('Could not load the video player.'); };
    document.head.appendChild(s);
  }

  function showError(msg) { if (errBox) { errBox.textContent = msg; errBox.hidden = false; } }
  function clearError() { if (errBox) errBox.hidden = true; }

  function syncMuteBtn() {
    if (!muteBtn) return;
    var icon = video.muted ? 'glyphicon-volume-off' : 'glyphicon-volume-up';
    muteBtn.innerHTML = '<span class="glyphicon ' + icon + '" aria-hidden="true"></span>';
    muteBtn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
  }

  // ----- render the bar/body from state -------------------------------------
  function render() {
    dot.classList.toggle('live', live);
    head.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    body.hidden = !expanded;
    wrap.hidden = !(expanded && live);
    offlineMsg.hidden = !(expanded && !live);
  }

  // ----- playback ------------------------------------------------------------
  function play() {
    if (!currentUrl || playingUrl === currentUrl) return; // already on it
    clearError();
    loadHls(function () {
      if (!currentUrl) return;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentUrl; // Safari/iOS native HLS
      } else if (window.Hls && window.Hls.isSupported()) {
        teardownHls();
        // Low-latency live tuning. Pairs with the short server segments so the
        // player hugs the live edge instead of the default ~3-segment lag:
        //  - lowLatencyMode: use LL-HLS parts if the server emits them
        //  - liveSyncDurationCount: aim ~2 segments behind live
        //  - liveMaxLatencyDurationCount: if we fall further behind, catch up
        //  - maxLiveSyncPlaybackRate: nudge playback slightly faster to close
        //    the gap smoothly rather than seeking (which visibly jumps)
        //  - backBufferLength: don't hoard old segments in memory
        hls = new window.Hls({
          liveDurationInfinity: true,
          lowLatencyMode: true,
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 6,
          maxLiveSyncPlaybackRate: 1.5,
          backBufferLength: 10,
        });
        hls.loadSource(currentUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, onHlsError);
      } else {
        showError('This browser can’t play the stream.');
        return;
      }
      video.muted = true; // muted so autoplay is allowed
      syncMuteBtn();
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay quirks; stays muted */ });
      playingUrl = currentUrl;
    });
  }

  function onHlsError(evt, data) {
    if (!data || !data.fatal) return;
    var T = window.Hls.ErrorTypes;
    if (data.type === T.NETWORK_ERROR) {
      showError('Stream interrupted — retrying…');
      try { hls.startLoad(); } catch (e) { /* noop */ }
    } else if (data.type === T.MEDIA_ERROR) {
      showError('Recovering…');
      try { hls.recoverMediaError(); } catch (e) { /* noop */ }
    } else {
      teardownHls();
      showError('Stream unavailable.');
    }
  }

  function teardownHls() {
    if (hls) { try { hls.destroy(); } catch (e) { /* noop */ } hls = null; }
  }
  function stopVideo() {
    teardownHls();
    try { video.pause(); } catch (e) { /* noop */ }
    video.removeAttribute('src');
    try { video.load(); } catch (e) { /* noop */ }
    playingUrl = null;
    clearError();
  }

  // ----- expand / collapse ---------------------------------------------------
  function expand() {
    expanded = true;
    userCollapsed = false;
    render();
    if (live) play();
  }
  function collapse() {
    expanded = false;
    userCollapsed = true; // respect the choice; don't auto-reopen this session
    stopVideo();
    render();
  }
  function toggle() { if (expanded) collapse(); else expand(); }

  // ----- poll ----------------------------------------------------------------
  function applyStatus(st) {
    if (st && st.online && st.hlsUrl) {
      currentUrl = st.hlsUrl;
      currentName = st.name;
      if (!live) {                       // just went live
        live = true;
        if (!userCollapsed) expanded = true; // auto-open unless user collapsed it
      }
      render();
      if (expanded) play();
    } else {
      if (live) {                        // just went offline
        live = false;
        userCollapsed = false;           // a fresh broadcast may auto-open again
        stopVideo();
      }
      currentUrl = null;
      currentName = null;
      render();
    }
  }

  function poll() {
    fetch(window.RADIO.url('api/live'), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(applyStatus)
      .catch(function () { /* transient blip: leave state as-is */ });
  }

  ready(function () {
    panel = document.getElementById('ham-panel');
    if (!panel) return;
    head = document.getElementById('ham-toggle');
    dot = panel.querySelector('.ham-dot');
    chevron = panel.querySelector('.ham-chevron');
    body = document.getElementById('ham-body');
    wrap = panel.querySelector('.ham-video-wrap');
    video = document.getElementById('ham-video');
    muteBtn = document.getElementById('ham-mute');
    errBox = document.getElementById('ham-error');
    offlineMsg = document.getElementById('ham-offline');

    video.muted = true;
    video.setAttribute('playsinline', '');
    syncMuteBtn();
    render();

    head.addEventListener('click', toggle);

    if (muteBtn) {
      muteBtn.addEventListener('click', function (e) {
        e.stopPropagation(); // the bar toggles; the mute button shouldn't
        video.muted = !video.muted;
        if (!video.muted && video.volume === 0) video.volume = 1;
        syncMuteBtn();
      });
    }

    poll();
    setInterval(poll, POLL_MS);
  });
})();
