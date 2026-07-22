// Safe PokiSDK Replacement
(function() {
    'use strict';

    var dummySDK = {
        init: function() { return Promise.resolve(true); },
        initWithPoki: function() { return Promise.resolve(true); },
        setDebug: function() {},
        gameLoadingStart: function() {},
        gameLoadingProgress: function() {},
        gameLoadingFinished: function() {},
        gameplayStart: function() {},
        gameplayStop: function() {},
        happyTime: function() {},
        displayAd: function() { return Promise.resolve(true); },
        destroyAd: function() {},
        rewardedBreak: function() { return Promise.resolve(true); },
        commercialBreak: function() { return Promise.resolve(true); },
        customEvent: function() {},
        captureError: function() {},
        isAdBlocked: function() { return false; }
    };

    // Safety net: Proxy catches any missing functions so the game never crashes
    window.PokiSDK = new Proxy(dummySDK, {
        get: function(target, prop) {
            if (prop in target) {
                return target[prop];
            }
            return function() { return Promise.resolve(true); };
        }
    });
})();
