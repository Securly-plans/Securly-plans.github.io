(function(){

    const PROXY = location.origin + "/?url=";

    function proxify(url) {
        try {
            return PROXY + encodeURIComponent(
                new URL(url, location.href).href
            );
        } catch {
            return url;
        }
    }

    // FETCH

    const oldFetch = window.fetch;

    window.fetch = function(url, options) {

        return oldFetch(
            proxify(url),
            options
        );
    };

    // XHR

    const open = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function(
        method,
        url
    ) {

        arguments[1] = proxify(url);

        return open.apply(this, arguments);
    };

    // WEBSOCKET WARNING

    const WS = window.WebSocket;

    window.WebSocket = function(url, protocols){

        console.warn(
            "EmeraldNet: WebSockets not yet supported."
        );

        return new WS(url, protocols);
    };

})();
