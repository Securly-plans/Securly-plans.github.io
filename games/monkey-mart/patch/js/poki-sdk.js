(function () {
    'use strict';
    window.PokiSDK = {
        init: function () { return Promise.resolve(true); },
        initWithPoki: function () { return Promise.resolve(true); },
        gameLoadingStart: function () {},
        gameLoadingProgress: function () {},
        gameLoadingFinished: function () {},
        gameplayStart: function () {},
        gameplayStop: function () {},
        happyTime: function () {},
        setDebug: function () {},
        isAdBlocked: function () { return false; },
        displayAd: function (container, size, callback) {
            if (typeof callback === 'function') callback();
            return Promise.resolve(true);
        },
        destroyAd: function () {},
        rewardedBreak: function () { return Promise.resolve(true); },
        commercialBreak: function () { return Promise.resolve(true); },
        shareableURL: function () { return Promise.resolve(""); },
        getURLParam: function () { return ""; }
    };
})();
