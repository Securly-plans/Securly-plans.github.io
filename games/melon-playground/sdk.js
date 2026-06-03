/**
 * Mock Yandex Games SDK 
 * Prevents "YaGames is not defined" errors and simulates ad/player behavior.
 */

window.YaGames = {
    init: function() {
        console.log("%c[MockSDK] Initializing...", "color: #2196F3; font-weight: bold;");
        
        return Promise.resolve({
            // Device Information
            deviceInfo: {
                type: 'desktop',
                isMobile: () => false,
                isDesktop: () => true,
                isTablet: () => false,
                isTV: () => false,
            },

            // Environment & Localization
            environment: {
                i18n: { lang: 'en', tld: 'com' },
                app: { id: '000000' },
                browser: { lang: 'en' },
                payload: null,
            },

            // Screen & Fullscreen API
            screen: {
                fullscreen: {
                    status: 'off',
                    request: () => {
                        console.log("[MockSDK] Fullscreen requested");
                        return Promise.resolve();
                    },
                    exit: () => Promise.resolve(),
                }
            },

            // Modern Features API
            features: {
                LoadingAPI: {
                    ready: function() { console.log("[MockSDK] LoadingAPI: Ready"); }
                },
                GameplayAPI: {
                    start: function() { console.log("[MockSDK] GameplayAPI: Started"); },
                    stop: function() { console.log("[MockSDK] GameplayAPI: Stopped"); }
                }
            },

            // Helper methods frequently called by Unity Wrappers
            ready: function() { return Promise.resolve(); },
            gameplayStart: function() { return Promise.resolve(); },
            gameplayStop: function() { return Promise.resolve(); },

            // Advertising API (Fixed callback logic)
            adv: {
                showFullscreenAdv: function(config = {}) {
                    console.log("[MockSDK] Showing Fullscreen Ad...");
                    if (config.callbacks) {
                        if (config.callbacks.onOpen) config.callbacks.onOpen();
                        // Close instantly for mock
                        if (config.callbacks.onClose) config.callbacks.onClose(true);
                    }
                },
                showRewardedVideo: function(config = {}) {
                    console.log("[MockSDK] Showing Reward Video...");
                    if (config.callbacks) {
                        if (config.callbacks.onOpen) config.callbacks.onOpen();
                        
                        setTimeout(() => {
                            if (config.callbacks.onRewarded) {
                                console.log("[MockSDK] Reward Triggered!");
                                config.callbacks.onRewarded();
                            }
                            setTimeout(() => {
                                if (config.callbacks.onClose) config.callbacks.onClose();
                            }, 100);
                        }, 500); // Simulated delay
                    }
                },
                getBannerAdvStatus: function() {
                    return Promise.resolve({ stickyAdvIsShowing: false, reason: 'mock' });
                },
                showBannerAdv: function() { return Promise.resolve(); },
                hideBannerAdv: function() { return Promise.resolve(); },
            },

            // User & Player Data API
            getPlayer: function(opts) {
                console.log("[MockSDK] Player requested");
                return Promise.resolve({
                    getMode: () => 'lite',
                    getName: () => 'Mock Player',
                    getPhoto: (size) => 'https://via.placeholder.com/150',
                    getUniqueID: () => 'mock-id-123',
                    getPayingStatus: () => 'none',
                    getData: (keys) => {
                        console.log("[MockSDK] getData called for:", keys);
                        return Promise.resolve({});
                    },
                    setData: (data, flush) => {
                        console.log("[MockSDK] setData called:", data);
                        return Promise.resolve();
                    },
                    stats: {
                        set: () => Promise.resolve(),
                        get: () => Promise.resolve({}),
                    }
                });
            },

            // Payments API
            getPayments: function() {
                return Promise.reject(new Error('Payments not available in Mock'));
            },

            // Leaderboards API
            getLeaderboards: function() {
                const lbMock = {
                    getLeaderboardDescription: (name) => Promise.resolve({
                        default: false,
                        description: {
                            invert_sort_order: false,
                            score_format: { options: { decimal_offset: 0 } },
                            type: 'numeric'
                        }
                    }),
                    getLeaderboardEntries: (name, opts) => Promise.resolve({ entries: [] }),
                    setLeaderboardScore: (name, score) => {
                        console.log(`[MockSDK] Score ${score} set for ${name}`);
                        return Promise.resolve();
                    },
                    getLeaderboardPlayerEntry: () => Promise.reject('No entry'),
                };
                return Promise.resolve(lbMock);
            },
            
            // Redundant leaderboards path for older SDK versions
            leaderboards: {
                getLeaderboardDescription: (name) => Promise.resolve({}),
                getLeaderboardEntries: (name, opts) => Promise.resolve({ entries: [] }),
                setLeaderboardScore: (name, score) => Promise.resolve(),
            },

            // Feedback / Review API
            feedback: {
                canReview: () => Promise.resolve({ value: false, reason: 'NO_AUTH' }),
                requestReview: () => Promise.resolve({ feedbackSent: false })
            }
        });
    }
};

console.log("%c[MockSDK] Global YaGames object ready - Ads & Analytics disabled", "background: #222; color: #bada55; padding: 2px 5px;");
