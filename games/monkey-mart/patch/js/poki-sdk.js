// Clean PokiSDK Dummy Stub
(function() {
    'use strict';
    window.PokiSDK = {
        init: function() { return Promise.resolve(true); },
        gameLoadingStart: function() {},
        gameLoadingProgress: function() {},
        gameLoadingFinished: function() {},
        gameplayStart: function() {},
        gameplayStop: function() {},
        happyTime: function() {},
        displayAd: function() { return Promise.resolve(true); },
        destroyAd: function() {},
        rewardedBreak: function() { return Promise.resolve(true); },
        commercialBreak: function() { return Promise.resolve(true); }
    };
})();
