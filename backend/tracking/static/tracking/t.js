// Usage: <script src=".../t.js" data-project="KEY" async></script>
(function () {
  try {
    var script = document.currentScript;
    var key = script && script.getAttribute("data-project");
    if (!key) return;
    var endpoint = new URL(script.src).origin + "/api/track/";

    var token = new URLSearchParams(location.search).get("ff_t");
    try {
      if (token) localStorage.setItem("ff_t", token);
      else token = localStorage.getItem("ff_t");
    } catch (e) {}

    var lastSent = {};
    var send = function () {
      try {
        var url = location.href;
        var now = Date.now();
        if (lastSent[url] && now - lastSent[url] < 30000) return;
        lastSent[url] = now;
        var body = JSON.stringify({ k: key, t: token, u: url });
        // text/plain body: no CORS preflight.
        if (navigator.sendBeacon && navigator.sendBeacon(endpoint, body)) return;
        fetch(endpoint, { method: "POST", body: body, mode: "no-cors", keepalive: true }).catch(function () {});
      } catch (e) {}
    };

    var pushState = history.pushState;
    history.pushState = function () {
      var result = pushState.apply(this, arguments);
      send();
      return result;
    };
    addEventListener("popstate", send);
    send();
  } catch (e) {}
})();
