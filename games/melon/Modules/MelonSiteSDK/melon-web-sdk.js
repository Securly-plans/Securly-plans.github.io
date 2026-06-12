( () => {
    "use strict";
    const e = "background: #495d14; color: #88ad25; font-size: medium; padding: 1px 8px; border-radius: 4px;";
    function t(t, s=console.log) {
        s("%cMelWebSdk", e, ...t)
    }
    var s, a, i, n, r, o;
    !function(e) {
        e.Hello = "hello",
        e.ModulesInitialized = "modules-initialized"
    }(s || (s = {})),
    function(e) {
        e.Start = "start",
        e.Success = "success"
    }(a || (a = {})),
    function(e) {
        e.Hello = "hello"
    }(i || (i = {})),
    function(e) {
        e.Start = "start",
        e.Success = "success"
    }(n || (n = {})),
    function(e) {
        e.Global = "global",
        e.Adv = "adv",
        e.EventTracker = "event-tracker",
        e.Auth = "auth",
        e.GameEvents = "game-events",
        e.Settings = "settings",
        e.Store = "store",
        e.Host = "host"
    }(r || (r = {})),
    function(e) {
        e.MelonWebApp = "melon-web-app",
        e.MelonWebGameApp = "melon-web-game-app"
    }(o || (o = {}));
    const c = 36e5;
    class l {
        timeoutId;
        start(e, t) {
            this.clear(),
            this.timeoutId = setTimeout(( () => {
                e(),
                this.timeoutId = void 0
            }
            ), t)
        }
        clear() {
            this.timeoutId && (clearTimeout(this.timeoutId),
            this.timeoutId = void 0)
        }
        destroy() {
            this.clear()
        }
    }
    class d {
        callbacks;
        timer = new l;
        constructor(e, t=15e3) {
            this.callbacks = e,
            this.timer.start(( () => this.handleTimeoutError()), t)
        }
        handleTimeoutError() {
            this.callbacks?.onError?.({
                reason: "timeout"
            }),
            this.handleDestroy()
        }
        handleDestroy() {
            this.callbacks?.onDestroy?.(),
            this.timer.destroy()
        }
    }
    class h extends d {
        parseMessage(e) {
            e.type === a.Success && this.callbacks?.onSuccess?.(),
            this.handleDestroy()
        }
    }
    class u {
        communicator;
        cycle;
        intervalId;
        constructor(e) {
            this.communicator = e
        }
        start(e) {
            const t = Date.now();
            return this.cycle = new h({
                ...e?.callbacks,
                onDestroy: () => {
                    this.handleDestroyCycle(),
                    e?.callbacks?.onDestroy?.()
                }
            },36e5),
            this.intervalId = setInterval(( () => {
                this.sentHelloMessage(t)
            }
            ), 500),
            t
        }
        parseMessage(e) {
            switch (e.type) {
            case a.Start:
                this.handleReceiveStart(e);
                break;
            case a.Success:
                this.cycle?.parseMessage?.(e)
            }
        }
        handleReceiveStart(e) {
            this.communicator.postMessage({
                module: r.Global,
                event: i.Hello,
                type: n.Success,
                data: {
                    id: e.data.id
                }
            })
        }
        sentHelloMessage(e) {
            this.communicator.postMessage({
                module: r.Global,
                event: i.Hello,
                type: n.Start,
                data: {
                    id: e
                }
            })
        }
        handleDestroyCycle() {
            delete this.cycle,
            this.intervalId && clearInterval(this.intervalId)
        }
    }
    class g {
        communicator;
        helloManager;
        isConnectedToParent = new Promise((e => {
            this.setIsConnectedToParent = e
        }
        ));
        setIsConnectedToParent;
        isParentModulesInitialized = new Promise((e => {
            this.setIsParentModulesInitialized = e
        }
        ));
        setIsParentModulesInitialized;
        constructor(e) {
            this.communicator = e;
            const t = this.generateConnectionPromise()
              , s = this.generateConnectionPromise();
            this.isConnectedToParent = t.promise,
            this.setIsConnectedToParent = t.resolve,
            this.isParentModulesInitialized = s.promise,
            this.setIsParentModulesInitialized = s.resolve,
            this.helloManager = new u(this.communicator),
            this.helloManager.start({
                callbacks: {
                    onSuccess: () => this.setIsConnectedToParent(!0),
                    onError: () => {
                        this.setIsConnectedToParent(!1),
                        this.setIsParentModulesInitialized(!1)
                    }
                }
            })
        }
        parseMessage(e) {
            switch (e.event) {
            case s.Hello:
                this.helloManager.parseMessage(e);
                break;
            case s.ModulesInitialized:
                const {id: t, ...a} = e.data;
                this.setIsParentModulesInitialized(a ?? {
                    hostModuleCreated: !1
                })
            }
        }
        generateConnectionPromise() {
            let e;
            return {
                promise: new Promise((t => {
                    e = t
                }
                )),
                resolve: e
            }
        }
    }
    var m, y, M, p, w;
    !function(e) {
        e.StateData = "state-data",
        e.ShowRewardedVideo = "show-rewarded-video",
        e.ShowFullscreenAdv = "show-fullscreen-adv"
    }(m || (m = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.ShowRewardedVideo = "show-rewarded-video",
        e.ShowFullscreenAdv = "show-fullscreen-adv"
    }(y || (y = {})),
    function(e) {
        e.ShowRewardedVideo = "show-rewarded-video",
        e.ShowFullscreenAdv = "show-fullscreen-adv"
    }(M || (M = {})),
    function(e) {
        e.Closed = "closed",
        e.Error = "error"
    }(p || (p = {})),
    function(e) {
        e.Closed = "closed",
        e.Error = "error"
    }(w || (w = {}));
    class v extends d {
        parseMessage(e) {
            switch (e.type) {
            case w.Error:
                this.handleShowRewardedVideoError(e.data.data);
                break;
            case w.Closed:
                this.handleShowRewardedVideoClosed(e.data.data)
            }
        }
        handleShowRewardedVideoError(e) {
            this.callbacks?.onError && this.callbacks.onError(e),
            this.handleDestroy()
        }
        handleShowRewardedVideoClosed(e) {
            this.callbacks?.onClose && this.callbacks.onClose(e),
            this.handleDestroy()
        }
    }
    class D {
        communicator;
        rewardedVideoCycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.rewardedVideoCycles.set(t, new v({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            },c)),
            this.communicator.postMessage({
                module: r.Adv,
                event: y.ShowRewardedVideo,
                type: M.ShowRewardedVideo,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.rewardedVideoCycles.has(e.data.id) && this.rewardedVideoCycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.rewardedVideoCycles.delete(e)
        }
    }
    class k extends d {
        parseMessage(e) {
            switch (e.type) {
            case p.Error:
                this.handleShowRewardedVideoError(e.data.data);
                break;
            case p.Closed:
                this.handleShowRewardedVideoClosed()
            }
        }
        handleShowRewardedVideoError(e) {
            this.callbacks?.onError && this.callbacks.onError(e),
            this.handleDestroy()
        }
        handleShowRewardedVideoClosed() {
            this.callbacks?.onClose && this.callbacks.onClose(),
            this.handleDestroy()
        }
    }
    class b {
        communicator;
        fullscreenAdvCycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.fullscreenAdvCycles.set(t, new k({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e?.callbacks?.onDestroy?.()
                }
            },c)),
            this.communicator.postMessage({
                module: r.Adv,
                event: y.ShowFullscreenAdv,
                type: M.ShowFullscreenAdv,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.fullscreenAdvCycles.has(e.data.id) && this.fullscreenAdvCycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.fullscreenAdvCycles.delete(e)
        }
    }
    class S extends d {
        parseMessage(e) {
            this.handleReceivedMessage(e)
        }
        handleReceivedMessage(e) {
            this.callbacks?.onReceived && this.callbacks.onReceived(),
            this.handleDestroy()
        }
    }
    class C {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new S({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.Adv,
                event: y.RequestInitialData,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class R {
        communicator;
        rewardedVideoManager;
        fullscreenAdvManager;
        initializeAdvManager;
        stateData;
        constructor(e) {
            this.communicator = e,
            this.rewardedVideoManager = new D(this.communicator),
            this.fullscreenAdvManager = new b(this.communicator),
            this.initializeAdvManager = new C(this.communicator)
        }
        initialize() {
            return this.initializeAdvData()
        }
        get isAdvAvailable() {
            return !!this.stateData?.isAvailable
        }
        showRewardedVideo(e) {
            this.rewardedVideoManager.addNew(e)
        }
        showFullscreenAdv(e) {
            this.fullscreenAdvManager.addNew(e)
        }
        parseMessage(e) {
            switch (e.event) {
            case m.ShowRewardedVideo:
                this.rewardedVideoManager.parseMessage(e);
                break;
            case m.ShowFullscreenAdv:
                this.fullscreenAdvManager.parseMessage(e);
                break;
            case m.StateData:
                this.initializeAdvManager.parseMessage(e),
                "result"in e.data && this.handleReceivedStateData(e.data.result);
                break;
            default:
                console.error("Unknown event", e.event)
            }
        }
        handleReceivedStateData(e) {
            this.stateData = e
        }
        initializeAdvData() {
            return new Promise((e => {
                this.initializeAdvManager.addNew({
                    callbacks: {
                        onReceived: () => {
                            e(!0)
                        }
                        ,
                        onError: () => {
                            e(!1)
                        }
                    }
                })
            }
            ))
        }
    }
    const E = "localhost";
    class z {
        parseMessage;
        messageListener;
        constructor(e) {
            this.parseMessage = e
        }
        initialize() {
            window.parent || t(["Warning! Parent container is not found", console.warn]),
            this.messageListener = this.onReceiveMessage.bind(this),
            window.addEventListener("message", this.messageListener)
        }
        destroy() {
            this.messageListener && (window.removeEventListener("message", this.messageListener),
            delete this.messageListener)
        }
        postMessage(e) {
            window.parent ? (t(["Post message to parent", e]),
            window.parent.postMessage({
                ...e,
                source: o.MelonWebGameApp
            }, "*")) : t(["Can not post message: parent window object is not found"], console.error)
        }
        onReceiveMessage(e) {
            this.checkMessageOrigin(e.origin) && this.checkMessageSource(e.data.source) && (t(["Received message", e.data]),
            this.parseMessage(e.data))
        }
        checkMessageOrigin(e) {
            const s = new URL(e);
            return !(!s.hostname.endsWith("melonsandbox.com") && s.hostname !== E || s.hostname !== E && "http:" === s.protocol && (t(["not secure connection, please use https", e], console.error),
            1))
        }
        checkMessageSource(e) {
            if (e === o.MelonWebApp)
                return !0;
            t(["incorrect message source", e], console.error)
        }
    }
    var I, f, A, q, T, L, N, P, G, U, W, V, x, F, H, O, B, j, K, $, J, Q, X, Y, Z, _;
    !function(e) {
        e.AppsFlyer = "apps-flyer",
        e.GoogleTag = "google-tag"
    }(I || (I = {})),
    function(e) {
        e.StateData = "state-data",
        e.SetCustomerUserId = "set-customer-user-id",
        e.SetEvent = "set-event"
    }(f || (f = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.SetCustomerUserId = "set-customer-user-id",
        e.SetEvent = "set-event"
    }(A || (A = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(q || (q = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(T || (T = {}));
    class ee extends d {
        parseMessage(e) {
            switch (e.type) {
            case q.Success:
                this.handleSuccess();
                break;
            case q.Error:
                this.handleError(e)
            }
        }
        handleSuccess() {
            this.callbacks?.onSuccess && this.callbacks.onSuccess(),
            this.handleDestroy()
        }
        handleError(e) {
            this.callbacks?.onError && this.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
    }
    class te {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new ee({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.EventTracker,
                submodule: I.AppsFlyer,
                event: A.SetCustomerUserId,
                data: {
                    id: t,
                    userId: e.userId
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class se extends d {
        parseMessage(e) {
            switch (e.type) {
            case T.Success:
                this.handleSuccess();
                break;
            case T.Error:
                this.handleError(e)
            }
        }
        handleSuccess() {
            this.callbacks?.onSuccess && this.callbacks.onSuccess(),
            this.handleDestroy()
        }
        handleError(e) {
            this.callbacks?.onError && this.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
    }
    class ae {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new se({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.EventTracker,
                submodule: I.AppsFlyer,
                event: A.SetEvent,
                data: {
                    id: t,
                    data: {
                        eventName: e.eventName,
                        eventValue: e.eventValue,
                        eventKey: e.eventKey
                    }
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class ie extends d {
        parseMessage(e) {
            this.handleReceivedMessage(e)
        }
        handleReceivedMessage(e) {
            this.callbacks?.onReceived?.(e.data.result),
            this.handleDestroy()
        }
    }
    class ne {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new ie({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e?.callbacks?.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.EventTracker,
                submodule: I.AppsFlyer,
                event: A.RequestInitialData,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class re {
        communicator;
        setCustomerUserIdManager;
        setEventManager;
        initializeManager;
        stateData;
        constructor(e) {
            this.communicator = e,
            this.setCustomerUserIdManager = new te(this.communicator),
            this.setEventManager = new ae(this.communicator),
            this.initializeManager = new ne(this.communicator)
        }
        initialize() {
            return this.initializeData()
        }
        get isAvailable() {
            return !!this.stateData?.isAvailable
        }
        setCustomerUserId(e) {
            this.setCustomerUserIdManager.addNew(e)
        }
        setEvent(e) {
            this.setEventManager.addNew(e)
        }
        parseMessage(e) {
            switch (e.event) {
            case f.StateData:
                this.initializeManager.parseMessage(e),
                "result"in e.data && this.handleReceivedStateData(e.data.result);
                break;
            case f.SetCustomerUserId:
                this.setCustomerUserIdManager.parseMessage(e);
                break;
            case f.SetEvent:
                this.setEventManager.parseMessage(e);
                break;
            default:
                console.error("Unknown event", e.event)
            }
        }
        handleReceivedStateData(e) {
            this.stateData = e
        }
        initializeData() {
            return new Promise((e => {
                this.initializeManager.addNew({
                    callbacks: {
                        onReceived: () => {
                            e(!0)
                        }
                        ,
                        onError: () => {
                            e(!1)
                        }
                    }
                })
            }
            ))
        }
    }
    !function(e) {
        e.StateData = "state-data",
        e.SetCustomerUserId = "set-customer-user-id",
        e.SetEvent = "set-event"
    }(L || (L = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.SetCustomerUserId = "set-customer-user-id",
        e.SetEvent = "set-event"
    }(N || (N = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(P || (P = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(G || (G = {}));
    class oe extends d {
        parseMessage(e) {
            switch (e.type) {
            case P.Success:
                this.handleSuccess();
                break;
            case P.Error:
                this.handleError(e)
            }
        }
        handleSuccess() {
            this.callbacks?.onSuccess && this.callbacks.onSuccess(),
            this.handleDestroy()
        }
        handleError(e) {
            this.callbacks?.onError && this.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
    }
    class ce {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new oe({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.EventTracker,
                submodule: I.GoogleTag,
                event: N.SetCustomerUserId,
                data: {
                    id: t,
                    userId: e.userId
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class le extends d {
        parseMessage(e) {
            switch (e.type) {
            case G.Success:
                this.handleSuccess();
                break;
            case G.Error:
                this.handleError(e)
            }
        }
        handleSuccess() {
            this.callbacks?.onSuccess && this.callbacks.onSuccess(),
            this.handleDestroy()
        }
        handleError(e) {
            this.callbacks?.onError && this.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
    }
    class de {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new le({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.EventTracker,
                submodule: I.GoogleTag,
                event: N.SetEvent,
                data: {
                    id: t,
                    eventParameters: e.eventParameters
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class he extends d {
        parseMessage(e) {
            this.handleReceivedMessage(e)
        }
        handleReceivedMessage(e) {
            this.callbacks?.onReceived?.(e.data.result),
            this.handleDestroy()
        }
    }
    class ue {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new he({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e?.callbacks?.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.EventTracker,
                submodule: I.GoogleTag,
                event: N.RequestInitialData,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class ge {
        communicator;
        setCustomerUserIdManager;
        setEventManager;
        initializeManager;
        stateData;
        constructor(e) {
            this.communicator = e,
            this.setCustomerUserIdManager = new ce(this.communicator),
            this.setEventManager = new de(this.communicator),
            this.initializeManager = new ue(this.communicator)
        }
        initialize() {
            return this.initializeData()
        }
        get isAvailable() {
            return !!this.stateData?.isAvailable
        }
        setCustomerUserId(e) {
            this.setCustomerUserIdManager.addNew(e)
        }
        setEvent(e) {
            this.setEventManager.addNew(e)
        }
        parseMessage(e) {
            switch (e.event) {
            case L.StateData:
                this.initializeManager.parseMessage(e),
                "result"in e.data && this.handleReceivedStateData(e.data.result);
                break;
            case L.SetCustomerUserId:
                this.setCustomerUserIdManager.parseMessage(e);
                break;
            case L.SetEvent:
                this.setEventManager.parseMessage(e);
                break;
            default:
                console.error("Unknown event", e.event)
            }
        }
        handleReceivedStateData(e) {
            this.stateData = e
        }
        initializeData() {
            return new Promise((e => {
                this.initializeManager.addNew({
                    callbacks: {
                        onReceived: () => {
                            e(!0)
                        }
                        ,
                        onError: () => {
                            e(!1)
                        }
                    }
                })
            }
            ))
        }
    }
    class me {
        communicator;
        appsFlyer;
        googleTag;
        constructor(e) {
            this.communicator = e,
            this.appsFlyer = new re(this.communicator),
            this.googleTag = new ge(this.communicator)
        }
        initialize() {
            return Promise.allSettled([this.appsFlyer.initialize(), this.googleTag.initialize()]).then((e => e.every((e => "fulfilled" === e.status && e.status))))
        }
        parseMessage(e) {
            switch (e.submodule) {
            case I.AppsFlyer:
                this.appsFlyer.parseMessage(e);
                break;
            case I.GoogleTag:
                this.googleTag.parseMessage(e)
            }
        }
    }
    !function(e) {
        e.AuthChangeStarted = "auth-change-started",
        e.AuthChangeCompleted = "auth-change-completed",
        e.AuthChangeFailed = "auth-change-failed"
    }(U || (U = {})),
    function(e) {
        e.StateData = "state-data",
        e.RequestGoogleToken = "request-google-token",
        e.GetAuthData = "get-auth-data",
        e.AuthListeners = "auth-listeners"
    }(W || (W = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.RequestGoogleToken = "request-google-token",
        e.GetAuthData = "get-auth-data"
    }(V || (V = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(x || (x = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(F || (F = {}));
    class ye extends d {
        parseMessage(e) {
            switch (e.type) {
            case F.Success:
                this.handleSuccess(e);
                break;
            case F.Error:
                this.handleError(e)
            }
        }
        handleSuccess(e) {
            this.callbacks?.onSuccess && this.callbacks.onSuccess(e.data.token),
            this.handleDestroy()
        }
        handleError(e) {
            this.callbacks?.onError && this.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
    }
    class Me {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new ye({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.Auth,
                event: V.RequestGoogleToken,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class pe extends d {
        retryCount = 0;
        retryTimeout;
        parseMessage(e) {
            this.handleReceivedMessage(e)
        }
        handleReceivedMessage(e) {
            e.data.result.deviceId ? (this.callbacks?.onReceived && this.callbacks.onReceived(e.data.result),
            this.handleDestroy()) : this.retryCount < 10 ? (this.retryTimeout = setTimeout(( () => {
                this.callbacks.onRetry()
            }
            ), 500),
            this.retryCount++) : (this.callbacks?.onError?.({
                reason: "retry count exceeded"
            }),
            this.handleDestroy())
        }
        handleDestroy() {
            void 0 !== this.retryTimeout && clearTimeout(this.retryTimeout),
            super.handleDestroy()
        }
    }
    class we {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const s = Date.now();
            return this.cycles.set(s, new pe({
                ...e?.callbacks ?? {},
                onRetry: () => {
                    t(["Retry getting state data while init auth module"], console.warn),
                    this.requestStateData(s)
                }
                ,
                onDestroy: () => {
                    this.handleDestroyCycle(s),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.requestStateData(s),
            s
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        requestStateData(e) {
            this.communicator.postMessage({
                module: r.Auth,
                event: V.RequestInitialData,
                data: {
                    id: e
                }
            })
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class ve extends d {
        parseMessage(e) {
            switch (e.type) {
            case x.Success:
                this.handleSuccess(e);
                break;
            case x.Error:
                this.handleError(e)
            }
        }
        handleSuccess(e) {
            if (this.callbacks?.onSuccess) {
                const {id: t, ...s} = e.data;
                this.callbacks.onSuccess(s)
            }
            this.handleDestroy()
        }
        handleError(e) {
            this.callbacks?.onError && this.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
    }
    class De {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new ve({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.Auth,
                event: V.GetAuthData,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class ke {
        getTokenManager;
        listeners;
        constructor(e) {
            this.getTokenManager = e
        }
        initListeners(e) {
            this.listeners = e,
            this.getTokenManager.addNew({
                callbacks: {
                    onSuccess: e => {
                        this.listeners?.onInitialized && this.listeners.onInitialized(e)
                    }
                    ,
                    onError: () => {
                        this.listeners?.onInitialized && this.listeners.onInitialized()
                    }
                }
            })
        }
        parseMessage(e) {
            switch (e.type) {
            case U.AuthChangeStarted:
                this.listeners?.onAuthChangeStarted && this.listeners.onAuthChangeStarted();
                break;
            case U.AuthChangeCompleted:
                if (this.listeners?.onAuthChangeCompleted) {
                    const {id: t, ...s} = e.data;
                    this.listeners.onAuthChangeCompleted(s)
                }
                break;
            case U.AuthChangeFailed:
                if (this.listeners?.onAuthChangeFailed) {
                    const t = e.data;
                    this.listeners.onAuthChangeFailed(t.error)
                }
            }
        }
    }
    class be {
        communicator;
        requestGoogleTokenManager;
        getAuthDataManager;
        initializeManager;
        authListenersManager;
        stateData;
        constructor(e) {
            this.communicator = e,
            this.requestGoogleTokenManager = new Me(this.communicator),
            this.getAuthDataManager = new De(this.communicator),
            this.initializeManager = new we(this.communicator),
            this.authListenersManager = new ke(this.getAuthDataManager)
        }
        initialize() {
            return this.initializeData()
        }
        initAuthListeners(e) {
            this.authListenersManager.initListeners(e)
        }
        get isGoogleAvailable() {
            return this.stateData?.isGoogleAvailable ?? !1
        }
        get deviceId() {
            return this.stateData?.deviceId
        }
        requestGoogleToken(e) {
            this.requestGoogleTokenManager.addNew(e)
        }
        getAuthData(e) {
            this.getAuthDataManager.addNew(e)
        }
        parseMessage(e) {
            switch (e.event) {
            case W.StateData:
                this.initializeManager.parseMessage(e),
                "result"in e.data && this.handleReceivedStateData(e.data.result);
                break;
            case W.RequestGoogleToken:
                this.requestGoogleTokenManager.parseMessage(e);
                break;
            case W.GetAuthData:
                this.getAuthDataManager.parseMessage(e);
                break;
            case W.AuthListeners:
                this.authListenersManager.parseMessage(e)
            }
        }
        handleReceivedStateData(e) {
            this.stateData = e
        }
        initializeData() {
            return new Promise((e => {
                this.initializeManager.addNew({
                    callbacks: {
                        onReceived: () => {
                            e(!0)
                        }
                        ,
                        onError: () => {
                            e(!1)
                        }
                    }
                })
            }
            ))
        }
    }
    !function(e) {
        e.GameStep = "game-step"
    }(H || (H = {})),
    function(e) {
        e.LoadStarted = "load-started",
        e.Ready = "ready",
        e.UserDataReset = "user-data-reset",
        e.UserDataReady = "user-data-ready"
    }(O || (O = {}));
    class Se {
        communicator;
        constructor(e) {
            this.communicator = e
        }
        sendGameStep(e, t) {
            const s = "string" == typeof t ? parseInt(t) : t;
            this.communicator.postMessage({
                module: r.GameEvents,
                event: H.GameStep,
                data: {
                    id: Date.now(),
                    step: e,
                    timestamp: s
                }
            })
        }
    }
    !function(e) {
        e.En = "en",
        e.Ru = "ru"
    }(B || (B = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(j || (j = {})),
    function(e) {
        e.StateData = "state-data",
        e.RequestChangeLanguage = "request-change-language",
        e.LanguageChanged = "language-changed"
    }(K || (K = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.RequestChangeLanguage = "request-change-language"
    }($ || ($ = {}));
    class Ce extends d {
        parseMessage(e) {
            this.handleReceivedMessage(e)
        }
        handleReceivedMessage(e) {
            this.callbacks?.onReceived && this.callbacks.onReceived(e.data.result),
            this.handleDestroy()
        }
    }
    class Re {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new Ce({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.Settings,
                event: $.RequestInitialData,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class Ee extends d {
        parseMessage(e) {
            switch (e.type) {
            case j.Success:
                this.handleSuccess(e);
                break;
            case j.Error:
                this.handleError(e)
            }
        }
        handleSuccess(e) {
            this.callbacks?.onSuccess && this.callbacks.onSuccess(e.data.language),
            this.handleDestroy()
        }
        handleError(e) {
            this.callbacks?.onError && this.callbacks.onError(),
            this.handleDestroy()
        }
    }
    class ze {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new Ee({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.Settings,
                event: $.RequestChangeLanguage,
                data: {
                    id: t,
                    language: e.newLanguage
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class Ie {
        communicator;
        listeners;
        constructor(e) {
            this.communicator = e
        }
        initListeners(e) {
            this.listeners = e
        }
        parseMessage(e) {
            e.event === K.LanguageChanged && this.listeners?.onLanguageChanged && this.listeners.onLanguageChanged(e.data?.language)
        }
    }
    class fe {
        communicator;
        requestChangeLanguageManager;
        initializeManager;
        settingsListenersManager;
        stateData;
        constructor(e) {
            this.communicator = e,
            this.requestChangeLanguageManager = new ze(this.communicator),
            this.initializeManager = new Re(this.communicator),
            this.settingsListenersManager = new Ie(this.communicator)
        }
        initialize() {
            return this.initializeData()
        }
        initListeners(e) {
            this.settingsListenersManager.initListeners(e)
        }
        get language() {
            return this.stateData?.language
        }
        requestChangeLanguage(e) {
            this.requestChangeLanguageManager.addNew(e)
        }
        parseMessage(e) {
            switch (e.event) {
            case K.StateData:
                this.initializeManager.parseMessage(e),
                "result"in e.data && this.handleReceivedStateData(e.data.result);
                break;
            case K.RequestChangeLanguage:
                this.requestChangeLanguageManager.parseMessage(e);
                break;
            case K.LanguageChanged:
                this.settingsListenersManager.parseMessage(e)
            }
        }
        handleReceivedStateData(e) {
            this.stateData = e
        }
        initializeData() {
            return new Promise((e => {
                this.initializeManager.addNew({
                    callbacks: {
                        onReceived: () => {
                            e(!0)
                        }
                        ,
                        onError: () => {
                            e(!1)
                        }
                    }
                })
            }
            ))
        }
    }
    !function(e) {
        e.ContentItem = "content-item",
        e.StoreItem = "store-item",
        e.WorksContentItem = "works-content-item",
        e.WorksStoreItem = "works-store-item",
        e.CreateWorksContentItem = "create-works-content-item",
        e.CreateWorksStoreItem = "create-works-store-item"
    }(J || (J = {})),
    function(e) {
        e.StateData = "state-data",
        e.OpenStoreRequest = "open-store-request",
        e.UpdateWalletCoins = "update-wallet-coins"
    }(Q || (Q = {})),
    function(e) {
        e.OpenStoreRequest = "open-store-request",
        e.RequestInitialData = "request-initial-data",
        e.UpdateWalletCoins = "update-wallet-coins"
    }(X || (X = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(Y || (Y = {}));
    class Ae {
        communicator;
        listeners;
        constructor(e) {
            this.communicator = e
        }
        initListeners(e) {
            this.listeners = e
        }
        parseMessage(e) {
            switch (e.event) {
            case Q.OpenStoreRequest:
                if (this.listeners?.onOpenStoreRequested) {
                    const t = e.data;
                    this.listeners.onOpenStoreRequested({
                        pageType: t.pageType,
                        itemId: t.itemId
                    }),
                    this.responseWithSuccess(X.OpenStoreRequest, e.data.id)
                } else
                    this.responseWithError(X.OpenStoreRequest, e.data.id, {
                        message: "listeners.onOpenStoreRequested is not defined"
                    });
                break;
            case Q.UpdateWalletCoins:
                if (this.listeners?.onUpdateWalletCoins) {
                    const t = e.data;
                    this.listeners.onUpdateWalletCoins({
                        coins: t.coins
                    })
                }
            }
        }
        responseWithError(e, t, s) {
            this.communicator.postMessage({
                module: r.Store,
                event: e,
                type: Y.Error,
                data: {
                    id: t,
                    error: s
                }
            })
        }
        responseWithSuccess(e, t) {
            this.communicator.postMessage({
                module: r.Store,
                event: e,
                type: Y.Success,
                data: {
                    id: t
                }
            })
        }
    }
    class qe extends d {
        parseMessage(e) {
            this.handleReceivedMessage(e)
        }
        handleReceivedMessage(e) {
            this.callbacks?.onReceived && this.callbacks.onReceived(e.data.result),
            this.handleDestroy()
        }
    }
    class Te {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new qe({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.Store,
                event: X.RequestInitialData,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class Le {
        communicator;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.communicator.postMessage({
                module: r.Store,
                event: X.UpdateWalletCoins,
                data: {
                    id: t,
                    coins: e.coins
                }
            }),
            t
        }
    }
    class Ne {
        communicator;
        storeListenersManager;
        initializeManager;
        updateWalletCoinsManager;
        stateData;
        constructor(e) {
            this.communicator = e,
            this.storeListenersManager = new Ae(this.communicator),
            this.initializeManager = new Te(this.communicator),
            this.updateWalletCoinsManager = new Le(this.communicator)
        }
        get links() {
            return this.stateData.links
        }
        initialize() {
            return this.initializeData()
        }
        initListeners(e) {
            this.storeListenersManager.initListeners(e)
        }
        updateWalletCoins(e) {
            this.updateWalletCoinsManager.addNew(e)
        }
        parseMessage(e) {
            switch (e.event) {
            case Q.StateData:
                this.initializeManager.parseMessage(e),
                "result"in e.data && this.handleReceivedStateData(e.data.result);
                break;
            case Q.OpenStoreRequest:
            case Q.UpdateWalletCoins:
                this.storeListenersManager.parseMessage(e)
            }
        }
        handleReceivedStateData(e) {
            this.stateData = e
        }
        initializeData() {
            return new Promise((e => {
                this.initializeManager.addNew({
                    callbacks: {
                        onReceived: () => {
                            e(!0)
                        }
                        ,
                        onError: () => {
                            e(!1)
                        }
                    }
                })
            }
            ))
        }
    }
    !function(e) {
        e.StateData = "state-data"
    }(Z || (Z = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.RequestChangeHost = "request-change-host"
    }(_ || (_ = {}));
    class Pe extends d {
        parseMessage(e) {
            this.handleReceivedMessage(e)
        }
        handleReceivedMessage(e) {
            this.callbacks?.onReceived && this.callbacks.onReceived(e.data.result),
            this.handleDestroy()
        }
    }
    class Ge {
        communicator;
        cycles = new Map;
        constructor(e) {
            this.communicator = e
        }
        addNew(e) {
            const t = Date.now();
            return this.cycles.set(t, new Pe({
                ...e?.callbacks ?? {},
                onDestroy: () => {
                    this.handleDestroyCycle(t),
                    e.callbacks.onDestroy?.()
                }
            })),
            this.communicator.postMessage({
                module: r.Host,
                event: _.RequestInitialData,
                data: {
                    id: t
                }
            }),
            t
        }
        parseMessage(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        handleDestroyCycle(e) {
            this.cycles.delete(e)
        }
    }
    class Ue {
        communicator;
        initializeManager;
        stateData;
        constructor(e) {
            this.communicator = e,
            this.initializeManager = new Ge(this.communicator)
        }
        initialize() {
            return this.initializeData()
        }
        get activeHost() {
            return this.stateData?.activeHost
        }
        get changeHost() {
            return this.stateData?.changeHost
        }
        requestChangeHost(e) {
            this.communicator.postMessage({
                module: r.Host,
                event: _.RequestChangeHost,
                data: {
                    id: Date.now(),
                    host: e
                }
            })
        }
        parseMessage(e) {
            e.event === Z.StateData && (this.initializeManager.parseMessage(e),
            "result"in e.data && this.handleReceivedStateData(e.data.result))
        }
        handleReceivedStateData(e) {
            this.stateData = e
        }
        initializeData() {
            return new Promise((e => {
                this.initializeManager.addNew({
                    callbacks: {
                        onReceived: () => {
                            e(!0)
                        }
                        ,
                        onError: () => {
                            e(!1)
                        }
                    }
                })
            }
            ))
        }
    }
    class We {
        global;
        adv;
        eventTracker;
        auth;
        gameEvents;
        settings;
        store;
        host;
        communicator = new z(this.parseMessage.bind(this));
        constructor() {
            this.communicator.initialize(),
            this.global = new g(this.communicator),
            this.adv = new R(this.communicator),
            this.eventTracker = new me(this.communicator),
            this.auth = new be(this.communicator),
            this.gameEvents = new Se(this.communicator),
            this.settings = new fe(this.communicator),
            this.store = new Ne(this.communicator)
        }
        async communicationEstablished() {
            return t(["check parent connection & modules initialization"]),
            !!(await Promise.all([this.global.isConnectedToParent.then((e => (e || t(["could not connect to parent"]),
            e))), this.global.isParentModulesInitialized.then((e => e ? (e.hostModuleCreated && this.createHostModule(),
            !0) : (t(["parent modules was not initialized"]),
            !1)))])).every(Boolean) && this.initializeModules().then(( () => (t(["modules initialized"]),
            !0))).catch(( () => (t(["modules not initialized"]),
            !1)))
        }
        initialize() {
            t(["initialize"])
        }
        destroy() {
            t(["destroy"]),
            this.communicator.destroy()
        }
        parseMessage(e) {
            switch (e.module) {
            case r.Global:
                this.global.parseMessage(e);
                break;
            case r.Adv:
                this.adv.parseMessage(e);
                break;
            case r.EventTracker:
                this.eventTracker.parseMessage(e);
                break;
            case r.Auth:
                this.auth.parseMessage(e);
                break;
            case r.Settings:
                this.settings.parseMessage(e);
                break;
            case r.Store:
                this.store.parseMessage(e);
                break;
            case r.Host:
                this.host ? this.host.parseMessage(e) : t(["host module is not available"], console.error)
            }
        }
        initializeModules() {
            return t(["initialize modules"]),
            Promise.all([this.adv.initialize().then(this.getTrackModuleInitialization("adv")), this.eventTracker.initialize().then(this.getTrackModuleInitialization("eventTracker")), this.auth.initialize().then(this.getTrackModuleInitialization("auth")), this.settings.initialize().then(this.getTrackModuleInitialization("settings")), this.store.initialize().then(this.getTrackModuleInitialization("store")), this.host ? this.host.initialize().then(this.getTrackModuleInitialization("host")) : void 0].filter(Boolean)).then((e => {
                if (!e.every(Boolean))
                    throw new Error("Failed to initialize one of modules")
            }
            ))
        }
        getTrackModuleInitialization(e) {
            return s => (t([`${e} module is ${s ? "" : "not "}initialized`], s ? console.log : console.warn),
            s)
        }
        createHostModule() {
            this.host = new Ue(this.communicator)
        }
    }
    if (console.log("%cgame-sdk-script", e, "version", "1.1.0"),
    window.parent) {
        const t = new We;
        console.log("%cgame-sdk-script", e, "check initialization"),
        t.communicationEstablished().then((s => {
            s ? (console.log("%cgame-sdk-script", e, "assign window"),
            Object.assign(window, {
                MelWebSdk: t
            })) : console.log("%cgame-sdk-script", e, "loading failed")
        }
        )).catch(( () => {
            console.log("%cgame-sdk-script", e, "loading failed")
        }
        ))
    } else
        console.log("%cgame-sdk-script", e, "failed: no parent found")
}
)();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QyxJQUFJLG9CQUFxQkwsRUFBZSxVQ0pyQixTRE12QjJILE9BQU9DLE9BQVEsQ0FDakIsTUFBTStLLEVBQVksSUFBSW5CLEdBRXRCcFIsUUFBUUMsSUFBSSxvQkFBcUJMLEVBQWUsd0JBQ2hEMlMsRUFBVVgsMkJBQ1A1RixNQUFNOEYsSUFDREEsR0FDRjlSLFFBQVFDLElBQUksb0JBQXFCTCxFQUFlLGlCQUNoRDRTLE9BQU9DLE9BQU9sTCxPQUFRLENBQ3BCZ0wsZUFHRnZTLFFBQVFDLElBQUksb0JBQXFCTCxFQUFlLGlCQUNsRCxJQUVEc1MsT0FBTSxLQUNMbFMsUUFBUUMsSUFBSSxvQkFBcUJMLEVBQWUsaUJBQWlCLEdBRXZFLE1BQ0VJLFFBQVFDLElBQUksb0JBQXFCTCxFQUFlLDBCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbG9nZ2VyLXN0eWxlcy5jb25zdGFudC50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy91dGlscy9sb2ctbWVzc2FnZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2dsb2JhbC9tb2RlbHMvZ2xvYmFsLXJlY2VpdmVkLW1lc3NhZ2UtZXZlbnQudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9nbG9iYWwvbW9kZWxzL2dsb2JhbC1yZWNlaXZlZC1tZXNzYWdlLWV2ZW50LXR5cGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9nbG9iYWwvbW9kZWxzL2dsb2JhbC1zZW50LW1lc3NhZ2UtZXZlbnQudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9nbG9iYWwvbW9kZWxzL2dsb2JhbC1zZW50LW1lc3NhZ2UtZXZlbnQtdHlwZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2RlbHMvbWVzc2FnZS1tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kZWxzL21lc3NhZ2Utc291cmNlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL2NvbnN0YW50cy9pbml0aWFsaXphdGlvbi10aW1lb3V0LnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZGVscy90aW1lci1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZGVscy9iYXNlLWNhbGxiYWNrLWN5Y2xlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvZ2xvYmFsL2hlbGxvL2hlbGxvLWNhbGxiYWNrLWN5Y2xlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvZ2xvYmFsL2hlbGxvL2hlbGxvLW1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9nbG9iYWwvZ2xvYmFsLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvYWR2L21vZGVscy9hZHYtcmVjZWl2ZWQtbWVzc2FnZS1ldmVudC50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2Fkdi9tb2RlbHMvYWR2LXNlbnQtbWVzc2FnZS1ldmVudC50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2Fkdi9tb2RlbHMvYWR2LXNlbnQtbWVzc2FnZS1ldmVudC10eXBlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvYWR2L21vZGVscy9zaG93LWZ1bGxzY3JlZW4tYWR2LWNhbGxiYWNrLXR5cGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9hZHYvbW9kZWxzL3Nob3ctcmV3YXJkZWQtdmlkZW8tY2FsbGJhY2stdHlwZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2Fkdi9yZXdhcmRlZC12aWRlby9yZXdhcmRlZC12aWRlby1jYWxsYmFjay1jeWNsZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2Fkdi9yZXdhcmRlZC12aWRlby9yZXdhcmRlZC12aWRlby1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvYWR2L2Z1bGxzY3JlZW4tYWR2L2Z1bGxzY3JlZW4tYWR2LWNhbGxiYWNrLWN5Y2xlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvYWR2L2Z1bGxzY3JlZW4tYWR2L2Z1bGxzY3JlZW4tYWR2LW1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9hZHYvaW5pdGlhbGl6ZS1hZHYtZGF0YS9pbml0aWFsaXplLWFkdi1kYXRhLWNhbGxiYWNrLWN5Y2xlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvYWR2L2luaXRpYWxpemUtYWR2LWRhdGEvaW5pdGlhbGl6ZS1hZHYtbWFuYWdlci50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2Fkdi9hZHYtbW9kdWxlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL2dhbWUtY29tbXVuaWNhdG9yLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvZXZlbnQtdHJhY2tlci9tb2RlbHMvZXZlbnQtdHJhY2tlci1tZXNzYWdlLXN1Ym1vZHVsZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvc3VibW9kdWxlcy9hcHBzLWZseWVyL21vZGVscy9hcHBzLWZseWVyLXJlY2VpdmVkLW1lc3NhZ2UtZXZlbnQudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ldmVudC10cmFja2VyL3N1Ym1vZHVsZXMvYXBwcy1mbHllci9tb2RlbHMvYXBwcy1mbHllci1zZW50LW1lc3NhZ2UtZXZlbnQudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ldmVudC10cmFja2VyL3N1Ym1vZHVsZXMvYXBwcy1mbHllci9tb2RlbHMvc2V0LWN1c3RvbWVyLXVzZXItaWQtY2FsbGJhY2stdHlwZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvc3VibW9kdWxlcy9hcHBzLWZseWVyL21vZGVscy9zZXQtZXZlbnQtY2FsbGJhY2stdHlwZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvc3VibW9kdWxlcy9nb29nbGUtdGFnL21vZGVscy9nb29nbGUtdGFnLXJlY2VpdmVkLW1lc3NhZ2UtZXZlbnQudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ldmVudC10cmFja2VyL3N1Ym1vZHVsZXMvZ29vZ2xlLXRhZy9tb2RlbHMvZ29vZ2xlLXRhZy1zZW50LW1lc3NhZ2UtZXZlbnQudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ldmVudC10cmFja2VyL3N1Ym1vZHVsZXMvZ29vZ2xlLXRhZy9tb2RlbHMvc2V0LWN1c3RvbWVyLXVzZXItaWQtY2FsbGJhY2stdHlwZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvc3VibW9kdWxlcy9nb29nbGUtdGFnL21vZGVscy9zZXQtZXZlbnQtY2FsbGJhY2stdHlwZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2F1dGgvbW9kZWxzL2F1dGgtbGlzdGVuZXJzLXJlY2VpdmVkLWV2ZW50LXR5cGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9hdXRoL21vZGVscy9hdXRoLXJlY2VpdmVkLW1lc3NhZ2UtZXZlbnQudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9hdXRoL21vZGVscy9hdXRoLXNlbnQtbWVzc2FnZS1ldmVudC50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2F1dGgvbW9kZWxzL2dldC1hdXRoLWRhdGEtY2FsbGJhY2stdHlwZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2F1dGgvbW9kZWxzL3JlcXVlc3QtZ29vZ2xlLXRva2VuLWNhbGxiYWNrLXR5cGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9nYW1lLWV2ZW50cy9tb2RlbHMvZ2FtZS1ldmVudHMtc2VudC1tZXNzYWdlLWV2ZW50LnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvZ2FtZS1ldmVudHMvbW9kZWxzL2dhbWUtc3RlcC10eXBlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvc2V0dGluZ3MvbW9kZWxzL2xhbmd1YWdlLXR5cGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9zZXR0aW5ncy9tb2RlbHMvcmVxdWVzdC1jaGFuZ2UtbGFuZ3VhZ2UtY2FsbGJhY2stdHlwZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL3NldHRpbmdzL21vZGVscy9zZXR0aW5ncy1yZWNlaXZlZC1tZXNzYWdlLWV2ZW50LnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvc2V0dGluZ3MvbW9kZWxzL3NldHRpbmdzLXNlbnQtbWVzc2FnZS1ldmVudC50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL3N0b3JlL21vZGVscy9zdG9yZS1wYWdlLXR5cGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9zdG9yZS9tb2RlbHMvc3RvcmUtcmVjZWl2ZWQtbWVzc2FnZS1ldmVudC50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL3N0b3JlL21vZGVscy9zdG9yZS1zZW50LW1lc3NhZ2UtZXZlbnQudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9zdG9yZS9tb2RlbHMvc3RvcmUtc2VudC1tZXNzYWdlLWV2ZW50LXR5cGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ob3N0L21vZGVscy9ob3N0LXJlY2VpdmVkLW1lc3NhZ2UtZXZlbnQudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ob3N0L21vZGVscy9ob3N0LXNlbnQtbWVzc2FnZS1ldmVudC50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvc3VibW9kdWxlcy9hcHBzLWZseWVyL3NldC1jdXN0b21lci11c2VyLWlkL3NldC1jdXN0b21lci11c2VyLWlkLWNhbGxiYWNrLWN5Y2xlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvZXZlbnQtdHJhY2tlci9zdWJtb2R1bGVzL2FwcHMtZmx5ZXIvc2V0LWN1c3RvbWVyLXVzZXItaWQvc2V0LWN1c3RvbWVyLXVzZXItaWQtbWFuYWdlci50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvc3VibW9kdWxlcy9hcHBzLWZseWVyL3NldC1ldmVudC9zZXQtZXZlbnQtY2FsbGJhY2stY3ljbGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ldmVudC10cmFja2VyL3N1Ym1vZHVsZXMvYXBwcy1mbHllci9zZXQtZXZlbnQvc2V0LWV2ZW50LW1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ldmVudC10cmFja2VyL3N1Ym1vZHVsZXMvYXBwcy1mbHllci9pbml0aWFsaXplLWRhdGEvaW5pdGlhbGl6ZS1kYXRhLWNhbGxiYWNrLWN5Y2xlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvZXZlbnQtdHJhY2tlci9zdWJtb2R1bGVzL2FwcHMtZmx5ZXIvaW5pdGlhbGl6ZS1kYXRhL2luaXRpYWxpemUtbWFuYWdlci50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvc3VibW9kdWxlcy9hcHBzLWZseWVyL2FwcHMtZmx5ZXItc3VibW9kdWxlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvZXZlbnQtdHJhY2tlci9zdWJtb2R1bGVzL2dvb2dsZS10YWcvc2V0LWN1c3RvbWVyLXVzZXItaWQvc2V0LWN1c3RvbWVyLXVzZXItaWQtY2FsbGJhY2stY3ljbGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ldmVudC10cmFja2VyL3N1Ym1vZHVsZXMvZ29vZ2xlLXRhZy9zZXQtY3VzdG9tZXItdXNlci1pZC9zZXQtY3VzdG9tZXItdXNlci1pZC1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvZXZlbnQtdHJhY2tlci9zdWJtb2R1bGVzL2dvb2dsZS10YWcvc2V0LWV2ZW50L3NldC1ldmVudC1jYWxsYmFjay1jeWNsZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvc3VibW9kdWxlcy9nb29nbGUtdGFnL3NldC1ldmVudC9zZXQtZXZlbnQtbWFuYWdlci50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvc3VibW9kdWxlcy9nb29nbGUtdGFnL2luaXRpYWxpemUtZGF0YS9pbml0aWFsaXplLWRhdGEtY2FsbGJhY2stY3ljbGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ldmVudC10cmFja2VyL3N1Ym1vZHVsZXMvZ29vZ2xlLXRhZy9pbml0aWFsaXplLWRhdGEvaW5pdGlhbGl6ZS1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvZXZlbnQtdHJhY2tlci9zdWJtb2R1bGVzL2dvb2dsZS10YWcvZ29vZ2xlLXRhZy1zdWJtb2R1bGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9ldmVudC10cmFja2VyL2V2ZW50LXRyYWNrZXItbW9kdWxlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvYXV0aC9yZXF1ZXN0LWdvb2dsZS10b2tlbi9yZXF1ZXN0LWdvb2dsZS10b2tlbi1jYWxsYmFjay1jeWNsZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2F1dGgvcmVxdWVzdC1nb29nbGUtdG9rZW4vcmVxdWVzdC1nb29nbGUtdG9rZW4tbWFuYWdlci50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2F1dGgvaW5pdGlhbGl6ZS1kYXRhL2luaXRpYWxpemUtZGF0YS1jYWxsYmFjay1jeWNsZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2F1dGgvaW5pdGlhbGl6ZS1kYXRhL2luaXRpYWxpemUtbWFuYWdlci50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2F1dGgvZ2V0LWF1dGgtZGF0YS9nZXQtYXV0aC1kYXRhLWNhbGxiYWNrLWN5Y2xlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvYXV0aC9nZXQtYXV0aC1kYXRhL2dldC1hdXRoLWRhdGEtbWFuYWdlci50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2F1dGgvYXV0aC1saXN0ZW5lcnMvYXV0aC1saXN0ZW5lcnMtbWFuYWdlci50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL2F1dGgvYXV0aC1tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9nYW1lLWV2ZW50cy9nYW1lLWV2ZW50cy50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL3NldHRpbmdzL2luaXRpYWxpemUtZGF0YS9pbml0aWFsaXplLWRhdGEtY2FsbGJhY2stY3ljbGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9zZXR0aW5ncy9pbml0aWFsaXplLWRhdGEvaW5pdGlhbGl6ZS1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvc2V0dGluZ3MvcmVxdWVzdC1jaGFuZ2UtbGFuZ3VhZ2UvcmVxdWVzdC1jaGFuZ2UtbGFuZ3VhZ2UtY2FsbGJhY2stY3ljbGUudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9zZXR0aW5ncy9yZXF1ZXN0LWNoYW5nZS1sYW5ndWFnZS9yZXF1ZXN0LWNoYW5nZS1sYW5ndWFnZS1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvc2V0dGluZ3Mvc2V0dGluZ3MtbGlzdGVuZXJzL3NldHRpbmdzLWxpc3RlbmVycy1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvc2V0dGluZ3Mvc2V0dGluZ3MtbW9kdWxlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvc3RvcmUvc3RvcmUtbGlzdGVuZXJzL3N0b3JlLWxpc3RlbmVycy1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvc3RvcmUvaW5pdGlhbGl6ZS1kYXRhL2luaXRpYWxpemUtZGF0YS1jYWxsYmFjay1jeWNsZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9tb2R1bGVzL3N0b3JlL2luaXRpYWxpemUtZGF0YS9pbml0aWFsaXplLW1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vZ2FtZS1zZGsvLi9zcmMvbW9kdWxlcy9zdG9yZS9yZXF1ZXN0LXVwZGF0ZS13YWxsZXQtY29pbnMvdXBkYXRlLXdhbGxldC1jb2lucy1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvc3RvcmUvc3RvcmUtbW9kdWxlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvaG9zdC9pbml0aWFsaXplLWRhdGEvaW5pdGlhbGl6ZS1kYXRhLWNhbGxiYWNrLWN5Y2xlLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvaG9zdC9pbml0aWFsaXplLWRhdGEvaW5pdGlhbGl6ZS1tYW5hZ2VyLnRzIiwid2VicGFjazovL2dhbWUtc2RrLy4vc3JjL21vZHVsZXMvaG9zdC9ob3N0LW1vZHVsZS50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9nYW1lLXNkay50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9nYW1lLXNkay8uL3NyYy9jb25zdGFudHMvdmVyc2lvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgTE9HR0VSX1NUWUxFUyA9ICdiYWNrZ3JvdW5kOiAjNDk1ZDE0OyBjb2xvcjogIzg4YWQyNTsgZm9udC1zaXplOiBtZWRpdW07IHBhZGRpbmc6IDFweCA4cHg7IGJvcmRlci1yYWRpdXM6IDRweDsnO1xuIiwiaW1wb3J0IHsgTE9HR0VSX1NUWUxFUyB9IGZyb20gJ0AvbG9nZ2VyLXN0eWxlcy5jb25zdGFudCc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbG9nTWVzc2FnZShhcmdzOiB1bmtub3duW10sIGxvZ2dlciA9IGNvbnNvbGUubG9nKSB7XHJcbiAgbG9nZ2VyKCclY01lbFdlYlNkaycsIExPR0dFUl9TVFlMRVMsIC4uLmFyZ3MpO1xyXG59XHJcbiIsImV4cG9ydCBlbnVtIEdsb2JhbFJlY2VpdmVkTWVzc2FnZUV2ZW50IHtcbiAgSGVsbG8gPSAnaGVsbG8nLFxuICBNb2R1bGVzSW5pdGlhbGl6ZWQgPSAnbW9kdWxlcy1pbml0aWFsaXplZCcsXG59XG4iLCJleHBvcnQgZW51bSBHbG9iYWxSZWNlaXZlZE1lc3NhZ2VFdmVudFR5cGUge1xuICBTdGFydCA9ICdzdGFydCcsXG4gIFN1Y2Nlc3MgPSAnc3VjY2VzcycsXG59XG4iLCJleHBvcnQgZW51bSBHbG9iYWxTZW50TWVzc2FnZUV2ZW50IHtcbiAgSGVsbG8gPSAnaGVsbG8nLFxufVxuIiwiZXhwb3J0IGVudW0gR2xvYmFsU2VudE1lc3NhZ2VFdmVudFR5cGUge1xuICBTdGFydCA9ICdzdGFydCcsXG4gIFN1Y2Nlc3MgPSAnc3VjY2VzcycsXG59XG4iLCJleHBvcnQgZW51bSBNZXNzYWdlTW9kdWxlIHtcclxuICBHbG9iYWwgPSAnZ2xvYmFsJyxcclxuICBBZHYgPSAnYWR2JyxcclxuICBFdmVudFRyYWNrZXIgPSAnZXZlbnQtdHJhY2tlcicsXHJcbiAgQXV0aCA9ICdhdXRoJyxcclxuICBHYW1lRXZlbnRzID0gJ2dhbWUtZXZlbnRzJyxcclxuICBTZXR0aW5ncyA9ICdzZXR0aW5ncycsXHJcbiAgU3RvcmUgPSAnc3RvcmUnLFxyXG4gIEhvc3QgPSAnaG9zdCcsXHJcbn1cclxuIiwiZXhwb3J0IGVudW0gTWVzc2FnZVNvdXJjZSB7XG4gIE1lbG9uV2ViQXBwID0gJ21lbG9uLXdlYi1hcHAnLFxuICBNZWxvbldlYkdhbWVBcHAgPSAnbWVsb24td2ViLWdhbWUtYXBwJyxcbn1cbiIsImV4cG9ydCBjb25zdCBJTklUSUFMSVpBVElPTl9TRU5UX0hFTExPX01FU1NBR0VfSU5URVJWQUwgPSA1MDA7XHJcbmV4cG9ydCBjb25zdCBJTklUSUFMSVpBVElPTl9USU1FT1VUID0gMTAwMCAqIDYwICogNjA7IC8vIDEgaG91clxyXG5leHBvcnQgY29uc3QgQ0FMTEJBQ0tfQ1lDTEVfVElNRU9VVCA9IDE1MDAwOyAvLyAxNSBzZWNvbmRzXHJcbmV4cG9ydCBjb25zdCBDQUxMQkFDS19DWUNMRV9BRFZfVElNRU9VVCA9IDEwMDAgKiA2MCAqIDYwOyAvLyAxIGhvdXJcclxuIiwiZXhwb3J0IGNsYXNzIFRpbWVyTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSB0aW1lb3V0SWQ/OiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PjtcclxuXHJcbiAgcHVibGljIHN0YXJ0KGNhbGxiYWNrOiAoKSA9PiB2b2lkLCB0aW1lb3V0TXM6IG51bWJlcikge1xyXG4gICAgdGhpcy5jbGVhcigpO1xyXG4gICAgdGhpcy50aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgdGhpcy50aW1lb3V0SWQgPSB1bmRlZmluZWQ7XHJcbiAgICB9LCB0aW1lb3V0TXMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNsZWFyKCkge1xyXG4gICAgaWYgKHRoaXMudGltZW91dElkKSB7XHJcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCk7XHJcbiAgICAgIHRoaXMudGltZW91dElkID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLmNsZWFyKCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IENBTExCQUNLX0NZQ0xFX1RJTUVPVVQgfSBmcm9tICdAL2NvbnN0YW50cyc7XHJcbmltcG9ydCB7IEJhc2VDYWxsYmFja3MgfSBmcm9tICcuL2Jhc2UtY2FsbGJhY2stbW9kdWxlJztcclxuaW1wb3J0IHsgVGltZXJNYW5hZ2VyIH0gZnJvbSAnLi90aW1lci1tYW5hZ2VyJztcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlQ2FsbGJhY2tDeWNsZTxUQ2FsbGJhY2tzIGV4dGVuZHMgQmFzZUNhbGxiYWNrcz4ge1xyXG4gIHByb3RlY3RlZCB0aW1lciA9IG5ldyBUaW1lck1hbmFnZXIoKTtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcm90ZWN0ZWQgY2FsbGJhY2tzPzogVENhbGxiYWNrcyxcclxuICAgIHRpbWVvdXRNczogbnVtYmVyID0gQ0FMTEJBQ0tfQ1lDTEVfVElNRU9VVCxcclxuICApIHtcclxuICAgIHRoaXMudGltZXIuc3RhcnQoKCkgPT4gdGhpcy5oYW5kbGVUaW1lb3V0RXJyb3IoKSwgdGltZW91dE1zKTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBoYW5kbGVUaW1lb3V0RXJyb3IoKSB7XHJcbiAgICB0aGlzLmNhbGxiYWNrcz8ub25FcnJvcj8uKHsgcmVhc29uOiAndGltZW91dCcgfSk7XHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBoYW5kbGVEZXN0cm95KCkge1xyXG4gICAgdGhpcy5jYWxsYmFja3M/Lm9uRGVzdHJveT8uKCk7XHJcbiAgICB0aGlzLnRpbWVyLmRlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQmFzZUNhbGxiYWNrQ3ljbGUsIFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuaW1wb3J0IHsgR2xvYmFsUmVjZWl2ZWRNZXNzYWdlRXZlbnRUeXBlLCBIZWxsb0NhbGxiYWNrcyB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5leHBvcnQgY2xhc3MgSGVsbG9DYWxsYmFja0N5Y2xlIGV4dGVuZHMgQmFzZUNhbGxiYWNrQ3ljbGU8SGVsbG9DYWxsYmFja3M+IHtcclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcclxuICAgICAgY2FzZSBHbG9iYWxSZWNlaXZlZE1lc3NhZ2VFdmVudFR5cGUuU3VjY2VzczpcclxuICAgICAgICB0aGlzLmNhbGxiYWNrcz8ub25TdWNjZXNzPy4oKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgUmVjZWl2ZWRNZXNzYWdlLCBNZXNzYWdlTW9kdWxlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5pbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XHJcbmltcG9ydCB7IElOSVRJQUxJWkFUSU9OX1NFTlRfSEVMTE9fTUVTU0FHRV9JTlRFUlZBTCwgSU5JVElBTElaQVRJT05fVElNRU9VVCB9IGZyb20gJ0AvY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCB7IEdsb2JhbFJlY2VpdmVkTWVzc2FnZUV2ZW50VHlwZSwgR2xvYmFsU2VudE1lc3NhZ2VFdmVudCwgR2xvYmFsU2VudE1lc3NhZ2VFdmVudFR5cGUsIEhlbGxvQ2FsbGJhY2tzIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IEhlbGxvQ2FsbGJhY2tDeWNsZSB9IGZyb20gJy4vaGVsbG8tY2FsbGJhY2stY3ljbGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEhlbGxvTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBjeWNsZT86IEhlbGxvQ2FsbGJhY2tDeWNsZTtcclxuICBwcml2YXRlIGludGVydmFsSWQ/OiBOb2RlSlMuVGltZW91dDtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XHJcblxyXG4gIHB1YmxpYyBzdGFydChkYXRhOiB7IGNhbGxiYWNrcz86IEhlbGxvQ2FsbGJhY2tzIH0pIHtcclxuICAgIGNvbnN0IGlkID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgICB0aGlzLmN5Y2xlID0gbmV3IEhlbGxvQ2FsbGJhY2tDeWNsZShcclxuICAgICAge1xyXG4gICAgICAgIC4uLmRhdGE/LmNhbGxiYWNrcyxcclxuICAgICAgICBvbkRlc3Ryb3k6ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuaGFuZGxlRGVzdHJveUN5Y2xlKCk7XHJcbiAgICAgICAgICBkYXRhPy5jYWxsYmFja3M/Lm9uRGVzdHJveT8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgSU5JVElBTElaQVRJT05fVElNRU9VVCxcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5pbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICB0aGlzLnNlbnRIZWxsb01lc3NhZ2UoaWQpO1xyXG4gICAgfSwgSU5JVElBTElaQVRJT05fU0VOVF9IRUxMT19NRVNTQUdFX0lOVEVSVkFMKTtcclxuXHJcbiAgICByZXR1cm4gaWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcclxuICAgICAgY2FzZSBHbG9iYWxSZWNlaXZlZE1lc3NhZ2VFdmVudFR5cGUuU3RhcnQ6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVSZWNlaXZlU3RhcnQobWVzc2FnZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgR2xvYmFsUmVjZWl2ZWRNZXNzYWdlRXZlbnRUeXBlLlN1Y2Nlc3M6XHJcbiAgICAgICAgdGhpcy5jeWNsZT8ucGFyc2VNZXNzYWdlPy4obWVzc2FnZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVJlY2VpdmVTdGFydChtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcclxuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLkdsb2JhbCxcclxuICAgICAgZXZlbnQ6IEdsb2JhbFNlbnRNZXNzYWdlRXZlbnQuSGVsbG8sXHJcbiAgICAgIHR5cGU6IEdsb2JhbFNlbnRNZXNzYWdlRXZlbnRUeXBlLlN1Y2Nlc3MsXHJcbiAgICAgIGRhdGE6IHsgaWQ6IG1lc3NhZ2UuZGF0YS5pZCB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNlbnRIZWxsb01lc3NhZ2UoaWQ6IG51bWJlcikge1xyXG4gICAgdGhpcy5jb21tdW5pY2F0b3IucG9zdE1lc3NhZ2Uoe1xyXG4gICAgICBtb2R1bGU6IE1lc3NhZ2VNb2R1bGUuR2xvYmFsLFxyXG4gICAgICBldmVudDogR2xvYmFsU2VudE1lc3NhZ2VFdmVudC5IZWxsbyxcclxuICAgICAgdHlwZTogR2xvYmFsU2VudE1lc3NhZ2VFdmVudFR5cGUuU3RhcnQsXHJcbiAgICAgIGRhdGE6IHsgaWQgfSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVEZXN0cm95Q3ljbGUoKSB7XHJcbiAgICBkZWxldGUgdGhpcy5jeWNsZTtcclxuICAgIGlmICh0aGlzLmludGVydmFsSWQpIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbElkKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJ0AvZ2FtZS1jb21tdW5pY2F0b3InO1xuaW1wb3J0IHsgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnQC9tb2RlbHMnO1xuXG5pbXBvcnQgeyBHbG9iYWxSZWNlaXZlZE1lc3NhZ2VFdmVudCwgTW9kdWxlc0luaXRpYWxpemVkRGF0YSB9IGZyb20gJy4vbW9kZWxzJztcbmltcG9ydCB7IEhlbGxvTWFuYWdlciB9IGZyb20gJy4vaGVsbG8nO1xuXG5leHBvcnQgY2xhc3MgR2xvYmFsTW9kdWxlIHtcbiAgcHJpdmF0ZSBoZWxsb01hbmFnZXI6IEhlbGxvTWFuYWdlcjtcblxuICBwdWJsaWMgcmVhZG9ubHkgaXNDb25uZWN0ZWRUb1BhcmVudDogUHJvbWlzZTxib29sZWFuPiA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgdGhpcy5zZXRJc0Nvbm5lY3RlZFRvUGFyZW50ID0gcmVzb2x2ZTtcbiAgfSk7XG4gIHByaXZhdGUgc2V0SXNDb25uZWN0ZWRUb1BhcmVudDogKHZhbHVlOiBib29sZWFuKSA9PiB2b2lkO1xuXG4gIHB1YmxpYyByZWFkb25seSBpc1BhcmVudE1vZHVsZXNJbml0aWFsaXplZDogUHJvbWlzZTxNb2R1bGVzSW5pdGlhbGl6ZWREYXRhIHwgZmFsc2U+ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICB0aGlzLnNldElzUGFyZW50TW9kdWxlc0luaXRpYWxpemVkID0gcmVzb2x2ZTtcbiAgfSk7XG4gIHByaXZhdGUgc2V0SXNQYXJlbnRNb2R1bGVzSW5pdGlhbGl6ZWQ6ICh2YWx1ZTogTW9kdWxlc0luaXRpYWxpemVkRGF0YSB8IGZhbHNlKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7XG4gICAgY29uc3QgY29ubmVjdGVkUHJvbWlzZSA9IHRoaXMuZ2VuZXJhdGVDb25uZWN0aW9uUHJvbWlzZTxib29sZWFuPigpO1xuICAgIGNvbnN0IG1vZHVsZXNQcm9taXNlID0gdGhpcy5nZW5lcmF0ZUNvbm5lY3Rpb25Qcm9taXNlPE1vZHVsZXNJbml0aWFsaXplZERhdGEgfCBmYWxzZT4oKTtcblxuICAgIHRoaXMuaXNDb25uZWN0ZWRUb1BhcmVudCA9IGNvbm5lY3RlZFByb21pc2UucHJvbWlzZTtcbiAgICB0aGlzLnNldElzQ29ubmVjdGVkVG9QYXJlbnQgPSBjb25uZWN0ZWRQcm9taXNlLnJlc29sdmU7XG4gICAgdGhpcy5pc1BhcmVudE1vZHVsZXNJbml0aWFsaXplZCA9IG1vZHVsZXNQcm9taXNlLnByb21pc2U7XG4gICAgdGhpcy5zZXRJc1BhcmVudE1vZHVsZXNJbml0aWFsaXplZCA9IG1vZHVsZXNQcm9taXNlLnJlc29sdmU7XG5cbiAgICB0aGlzLmhlbGxvTWFuYWdlciA9IG5ldyBIZWxsb01hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xuICAgIHRoaXMuaGVsbG9NYW5hZ2VyLnN0YXJ0KHtcbiAgICAgIGNhbGxiYWNrczoge1xuICAgICAgICBvblN1Y2Nlc3M6ICgpID0+IHRoaXMuc2V0SXNDb25uZWN0ZWRUb1BhcmVudCh0cnVlKSxcbiAgICAgICAgb25FcnJvcjogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0SXNDb25uZWN0ZWRUb1BhcmVudChmYWxzZSk7XG4gICAgICAgICAgdGhpcy5zZXRJc1BhcmVudE1vZHVsZXNJbml0aWFsaXplZChmYWxzZSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcbiAgICBzd2l0Y2ggKG1lc3NhZ2UuZXZlbnQpIHtcbiAgICAgIGNhc2UgR2xvYmFsUmVjZWl2ZWRNZXNzYWdlRXZlbnQuSGVsbG86XG4gICAgICAgIHRoaXMuaGVsbG9NYW5hZ2VyLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEdsb2JhbFJlY2VpdmVkTWVzc2FnZUV2ZW50Lk1vZHVsZXNJbml0aWFsaXplZDpcbiAgICAgICAgY29uc3QgeyBpZCwgLi4uZGF0YSB9ID0gbWVzc2FnZS5kYXRhIGFzIHsgaWQ6IG51bWJlciB9ICYgTW9kdWxlc0luaXRpYWxpemVkRGF0YTtcbiAgICAgICAgdGhpcy5zZXRJc1BhcmVudE1vZHVsZXNJbml0aWFsaXplZChkYXRhID8/IHsgaG9zdE1vZHVsZUNyZWF0ZWQ6IGZhbHNlIH0pO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlQ29ubmVjdGlvblByb21pc2U8VD4oKSB7XG4gICAgbGV0IHJlc29sdmUhOiAodjogVCkgPT4gdm9pZDtcblxuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTxUPigocikgPT4ge1xuICAgICAgcmVzb2x2ZSA9IHI7XG4gICAgfSk7XG5cbiAgICByZXR1cm4geyBwcm9taXNlLCByZXNvbHZlIH07XG4gIH1cbn1cbiIsImV4cG9ydCBlbnVtIEFkdlJlY2VpdmVkTWVzc2FnZUV2ZW50IHtcbiAgU3RhdGVEYXRhID0gJ3N0YXRlLWRhdGEnLFxuICBTaG93UmV3YXJkZWRWaWRlbyA9ICdzaG93LXJld2FyZGVkLXZpZGVvJyxcbiAgU2hvd0Z1bGxzY3JlZW5BZHYgPSAnc2hvdy1mdWxsc2NyZWVuLWFkdicsXG59XG4iLCJleHBvcnQgZW51bSBBZHZTZW50TWVzc2FnZUV2ZW50IHtcbiAgUmVxdWVzdEluaXRpYWxEYXRhID0gJ3JlcXVlc3QtaW5pdGlhbC1kYXRhJyxcbiAgU2hvd1Jld2FyZGVkVmlkZW8gPSAnc2hvdy1yZXdhcmRlZC12aWRlbycsXG4gIFNob3dGdWxsc2NyZWVuQWR2ID0gJ3Nob3ctZnVsbHNjcmVlbi1hZHYnLFxufVxuIiwiZXhwb3J0IGVudW0gQWR2U2VudE1lc3NhZ2VFdmVudFR5cGUge1xuICBTaG93UmV3YXJkZWRWaWRlbyA9ICdzaG93LXJld2FyZGVkLXZpZGVvJyxcbiAgU2hvd0Z1bGxzY3JlZW5BZHYgPSAnc2hvdy1mdWxsc2NyZWVuLWFkdicsXG59XG4iLCJleHBvcnQgZW51bSBTaG93RnVsbHNjcmVlbkFkdkNhbGxiYWNrVHlwZSB7XG4gIENsb3NlZCA9ICdjbG9zZWQnLFxuICBFcnJvciA9ICdlcnJvcicsXG59XG4iLCJleHBvcnQgZW51bSBTaG93UmV3YXJkZWRWaWRlb0NhbGxiYWNrVHlwZSB7XG4gIENsb3NlZCA9ICdjbG9zZWQnLFxuICBFcnJvciA9ICdlcnJvcicsXG59XG4iLCJpbXBvcnQgeyBCYXNlQ2FsbGJhY2tDeWNsZSwgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgU2hvd1Jld2FyZGVkVmlkZW9DYWxsYmFja3MsIFNob3dSZXdhcmRlZFZpZGVvQ2FsbGJhY2tUeXBlIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBSZXdhcmRlZFZpZGVvQ2FsbGJhY2tDeWNsZSBleHRlbmRzIEJhc2VDYWxsYmFja0N5Y2xlPFNob3dSZXdhcmRlZFZpZGVvQ2FsbGJhY2tzPiB7XHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XHJcbiAgICAgIGNhc2UgU2hvd1Jld2FyZGVkVmlkZW9DYWxsYmFja1R5cGUuRXJyb3I6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVTaG93UmV3YXJkZWRWaWRlb0Vycm9yKChtZXNzYWdlLmRhdGEgYXMgeyBpZDogbnVtYmVyOyBkYXRhOiBvYmplY3QgfSkuZGF0YSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgU2hvd1Jld2FyZGVkVmlkZW9DYWxsYmFja1R5cGUuQ2xvc2VkOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlU2hvd1Jld2FyZGVkVmlkZW9DbG9zZWQoKG1lc3NhZ2UuZGF0YSBhcyB7IGlkOiBudW1iZXI7IGRhdGE6IHsgaXNSZXdhcmRlZDogYm9vbGVhbiB9IH0pLmRhdGEpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVTaG93UmV3YXJkZWRWaWRlb0Vycm9yKGRhdGE6IG9iamVjdCkge1xyXG4gICAgaWYgKHRoaXMuY2FsbGJhY2tzPy5vbkVycm9yKSB7XHJcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uRXJyb3IoZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5oYW5kbGVEZXN0cm95KCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVNob3dSZXdhcmRlZFZpZGVvQ2xvc2VkKGRhdGE6IHsgaXNSZXdhcmRlZDogYm9vbGVhbiB9KSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uQ2xvc2UpIHtcclxuICAgICAgdGhpcy5jYWxsYmFja3Mub25DbG9zZShkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgUmVjZWl2ZWRNZXNzYWdlLCBNZXNzYWdlTW9kdWxlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5pbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XHJcblxyXG5pbXBvcnQgeyBBZHZTZW50TWVzc2FnZUV2ZW50LCBBZHZTZW50TWVzc2FnZUV2ZW50VHlwZSwgU2hvd1Jld2FyZGVkVmlkZW9DYWxsYmFja3MgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgUmV3YXJkZWRWaWRlb0NhbGxiYWNrQ3ljbGUgfSBmcm9tICcuL3Jld2FyZGVkLXZpZGVvLWNhbGxiYWNrLWN5Y2xlJztcclxuaW1wb3J0IHsgQ0FMTEJBQ0tfQ1lDTEVfQURWX1RJTUVPVVQgfSBmcm9tICdAL2NvbnN0YW50cyc7XHJcblxyXG5leHBvcnQgY2xhc3MgUmV3YXJkZWRWaWRlb01hbmFnZXIge1xyXG4gIHByaXZhdGUgcmV3YXJkZWRWaWRlb0N5Y2xlcyA9IG5ldyBNYXA8bnVtYmVyLCBSZXdhcmRlZFZpZGVvQ2FsbGJhY2tDeWNsZT4oKTtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XHJcblxyXG4gIHB1YmxpYyBhZGROZXcoZGF0YT86IHsgY2FsbGJhY2tzPzogU2hvd1Jld2FyZGVkVmlkZW9DYWxsYmFja3MgfSkge1xyXG4gICAgY29uc3QgaWQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHRoaXMucmV3YXJkZWRWaWRlb0N5Y2xlcy5zZXQoXHJcbiAgICAgIGlkLFxyXG4gICAgICBuZXcgUmV3YXJkZWRWaWRlb0NhbGxiYWNrQ3ljbGUoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLi4uKGRhdGE/LmNhbGxiYWNrcyA/PyB7fSksXHJcbiAgICAgICAgICBvbkRlc3Ryb3k6ICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVEZXN0cm95Q3ljbGUoaWQpO1xyXG4gICAgICAgICAgICBkYXRhLmNhbGxiYWNrcy5vbkRlc3Ryb3k/LigpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIENBTExCQUNLX0NZQ0xFX0FEVl9USU1FT1VULFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLmNvbW11bmljYXRvci5wb3N0TWVzc2FnZSh7XHJcbiAgICAgIG1vZHVsZTogTWVzc2FnZU1vZHVsZS5BZHYsXHJcbiAgICAgIGV2ZW50OiBBZHZTZW50TWVzc2FnZUV2ZW50LlNob3dSZXdhcmRlZFZpZGVvLFxyXG4gICAgICB0eXBlOiBBZHZTZW50TWVzc2FnZUV2ZW50VHlwZS5TaG93UmV3YXJkZWRWaWRlbyxcclxuICAgICAgZGF0YTogeyBpZCB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGlkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIGlmICh0aGlzLnJld2FyZGVkVmlkZW9DeWNsZXMuaGFzKG1lc3NhZ2UuZGF0YS5pZCkpIHtcclxuICAgICAgY29uc3QgY3ljbGUgPSB0aGlzLnJld2FyZGVkVmlkZW9DeWNsZXMuZ2V0KG1lc3NhZ2UuZGF0YS5pZCk7XHJcbiAgICAgIGN5Y2xlLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRGVzdHJveUN5Y2xlKGN5Y2xlSWQ6IG51bWJlcikge1xyXG4gICAgdGhpcy5yZXdhcmRlZFZpZGVvQ3ljbGVzLmRlbGV0ZShjeWNsZUlkKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQmFzZUNhbGxiYWNrQ3ljbGUsIFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IFNob3dGdWxsc2NyZWVuQWR2Q2FsbGJhY2tzLCBTaG93RnVsbHNjcmVlbkFkdkNhbGxiYWNrVHlwZSB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5leHBvcnQgY2xhc3MgRnVsbHNjcmVlbkFkdkNhbGxiYWNrQ3ljbGUgZXh0ZW5kcyBCYXNlQ2FsbGJhY2tDeWNsZTxTaG93RnVsbHNjcmVlbkFkdkNhbGxiYWNrcz4ge1xyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xyXG4gICAgICBjYXNlIFNob3dGdWxsc2NyZWVuQWR2Q2FsbGJhY2tUeXBlLkVycm9yOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlU2hvd1Jld2FyZGVkVmlkZW9FcnJvcigobWVzc2FnZS5kYXRhIGFzIHsgaWQ6IG51bWJlcjsgZGF0YTogb2JqZWN0IH0pLmRhdGEpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFNob3dGdWxsc2NyZWVuQWR2Q2FsbGJhY2tUeXBlLkNsb3NlZDpcclxuICAgICAgICB0aGlzLmhhbmRsZVNob3dSZXdhcmRlZFZpZGVvQ2xvc2VkKCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVNob3dSZXdhcmRlZFZpZGVvRXJyb3IoZGF0YTogb2JqZWN0KSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uRXJyb3IpIHtcclxuICAgICAgdGhpcy5jYWxsYmFja3Mub25FcnJvcihkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlU2hvd1Jld2FyZGVkVmlkZW9DbG9zZWQoKSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uQ2xvc2UpIHtcclxuICAgICAgdGhpcy5jYWxsYmFja3Mub25DbG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBSZWNlaXZlZE1lc3NhZ2UsIE1lc3NhZ2VNb2R1bGUgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IEFkdlNlbnRNZXNzYWdlRXZlbnQsIEFkdlNlbnRNZXNzYWdlRXZlbnRUeXBlLCBTaG93RnVsbHNjcmVlbkFkdkNhbGxiYWNrcyB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBGdWxsc2NyZWVuQWR2Q2FsbGJhY2tDeWNsZSB9IGZyb20gJy4vZnVsbHNjcmVlbi1hZHYtY2FsbGJhY2stY3ljbGUnO1xyXG5pbXBvcnQgeyBDQUxMQkFDS19DWUNMRV9BRFZfVElNRU9VVCB9IGZyb20gJ0AvY29uc3RhbnRzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBGdWxsc2NyZWVuQWR2TWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBmdWxsc2NyZWVuQWR2Q3ljbGVzID0gbmV3IE1hcDxudW1iZXIsIEZ1bGxzY3JlZW5BZHZDYWxsYmFja0N5Y2xlPigpO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbW11bmljYXRvcjogR2FtZUNvbW11bmljYXRvcikge31cclxuXHJcbiAgcHVibGljIGFkZE5ldyhkYXRhPzogeyBjYWxsYmFja3M/OiBTaG93RnVsbHNjcmVlbkFkdkNhbGxiYWNrcyB9KSB7XHJcbiAgICBjb25zdCBpZCA9IERhdGUubm93KCk7XHJcblxyXG4gICAgdGhpcy5mdWxsc2NyZWVuQWR2Q3ljbGVzLnNldChcclxuICAgICAgaWQsXHJcbiAgICAgIG5ldyBGdWxsc2NyZWVuQWR2Q2FsbGJhY2tDeWNsZShcclxuICAgICAgICB7XHJcbiAgICAgICAgICAuLi4oZGF0YT8uY2FsbGJhY2tzID8/IHt9KSxcclxuICAgICAgICAgIG9uRGVzdHJveTogKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZURlc3Ryb3lDeWNsZShpZCk7XHJcbiAgICAgICAgICAgIGRhdGE/LmNhbGxiYWNrcz8ub25EZXN0cm95Py4oKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBDQUxMQkFDS19DWUNMRV9BRFZfVElNRU9VVCxcclxuICAgICAgKSxcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5jb21tdW5pY2F0b3IucG9zdE1lc3NhZ2Uoe1xyXG4gICAgICBtb2R1bGU6IE1lc3NhZ2VNb2R1bGUuQWR2LFxyXG4gICAgICBldmVudDogQWR2U2VudE1lc3NhZ2VFdmVudC5TaG93RnVsbHNjcmVlbkFkdixcclxuICAgICAgdHlwZTogQWR2U2VudE1lc3NhZ2VFdmVudFR5cGUuU2hvd0Z1bGxzY3JlZW5BZHYsXHJcbiAgICAgIGRhdGE6IHsgaWQgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBpZDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBpZiAodGhpcy5mdWxsc2NyZWVuQWR2Q3ljbGVzLmhhcyhtZXNzYWdlLmRhdGEuaWQpKSB7XHJcbiAgICAgIGNvbnN0IGN5Y2xlID0gdGhpcy5mdWxsc2NyZWVuQWR2Q3ljbGVzLmdldChtZXNzYWdlLmRhdGEuaWQpO1xyXG4gICAgICBjeWNsZS5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZURlc3Ryb3lDeWNsZShjeWNsZUlkOiBudW1iZXIpIHtcclxuICAgIHRoaXMuZnVsbHNjcmVlbkFkdkN5Y2xlcy5kZWxldGUoY3ljbGVJZCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IEJhc2VDYWxsYmFja0N5Y2xlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBJbml0aWFsaXplQWR2RGF0YUNhbGxiYWNrcyB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5leHBvcnQgY2xhc3MgSW5pdGlhbGl6ZUFkdkRhdGFDYWxsYmFja0N5Y2xlIGV4dGVuZHMgQmFzZUNhbGxiYWNrQ3ljbGU8SW5pdGlhbGl6ZUFkdkRhdGFDYWxsYmFja3M+IHtcclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgdGhpcy5oYW5kbGVSZWNlaXZlZE1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVJlY2VpdmVkTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIGlmICh0aGlzLmNhbGxiYWNrcz8ub25SZWNlaXZlZCkge1xyXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblJlY2VpdmVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5oYW5kbGVEZXN0cm95KCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFJlY2VpdmVkTWVzc2FnZSwgTWVzc2FnZU1vZHVsZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJ0AvZ2FtZS1jb21tdW5pY2F0b3InO1xyXG5cclxuaW1wb3J0IHsgQWR2U2VudE1lc3NhZ2VFdmVudCwgSW5pdGlhbGl6ZUFkdkRhdGFDYWxsYmFja3MgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgSW5pdGlhbGl6ZUFkdkRhdGFDYWxsYmFja0N5Y2xlIH0gZnJvbSAnLi9pbml0aWFsaXplLWFkdi1kYXRhLWNhbGxiYWNrLWN5Y2xlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBJbml0aWFsaXplQWR2TWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBjeWNsZXMgPSBuZXcgTWFwPG51bWJlciwgSW5pdGlhbGl6ZUFkdkRhdGFDYWxsYmFja0N5Y2xlPigpO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbW11bmljYXRvcjogR2FtZUNvbW11bmljYXRvcikge31cclxuXHJcbiAgcHVibGljIGFkZE5ldyhkYXRhOiB7IGNhbGxiYWNrczogSW5pdGlhbGl6ZUFkdkRhdGFDYWxsYmFja3MgfSkge1xyXG4gICAgY29uc3QgaWQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHRoaXMuY3ljbGVzLnNldChcclxuICAgICAgaWQsXHJcbiAgICAgIG5ldyBJbml0aWFsaXplQWR2RGF0YUNhbGxiYWNrQ3ljbGUoe1xyXG4gICAgICAgIC4uLihkYXRhPy5jYWxsYmFja3MgPz8ge30pLFxyXG4gICAgICAgIG9uRGVzdHJveTogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5oYW5kbGVEZXN0cm95Q3ljbGUoaWQpO1xyXG4gICAgICAgICAgZGF0YS5jYWxsYmFja3Mub25EZXN0cm95Py4oKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5jb21tdW5pY2F0b3IucG9zdE1lc3NhZ2Uoe1xyXG4gICAgICBtb2R1bGU6IE1lc3NhZ2VNb2R1bGUuQWR2LFxyXG4gICAgICBldmVudDogQWR2U2VudE1lc3NhZ2VFdmVudC5SZXF1ZXN0SW5pdGlhbERhdGEsXHJcbiAgICAgIGRhdGE6IHsgaWQgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBpZDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBpZiAodGhpcy5jeWNsZXMuaGFzKG1lc3NhZ2UuZGF0YS5pZCkpIHtcclxuICAgICAgY29uc3QgY3ljbGUgPSB0aGlzLmN5Y2xlcy5nZXQobWVzc2FnZS5kYXRhLmlkKTtcclxuICAgICAgY3ljbGUucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVEZXN0cm95Q3ljbGUoY3ljbGVJZDogbnVtYmVyKSB7XHJcbiAgICB0aGlzLmN5Y2xlcy5kZWxldGUoY3ljbGVJZCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJ0AvZ2FtZS1jb21tdW5pY2F0b3InO1xyXG5cclxuaW1wb3J0IHsgQWR2UmVjZWl2ZWRNZXNzYWdlRXZlbnQsIEFkdlN0YXRlRGF0YSwgU2hvd0Z1bGxzY3JlZW5BZHZDYWxsYmFja3MsIFNob3dSZXdhcmRlZFZpZGVvQ2FsbGJhY2tzIH0gZnJvbSAnLi9tb2RlbHMnO1xyXG5pbXBvcnQgeyBSZXdhcmRlZFZpZGVvTWFuYWdlciB9IGZyb20gJy4vcmV3YXJkZWQtdmlkZW8nO1xyXG5pbXBvcnQgeyBGdWxsc2NyZWVuQWR2TWFuYWdlciB9IGZyb20gJy4vZnVsbHNjcmVlbi1hZHYnO1xyXG5pbXBvcnQgeyBJbml0aWFsaXplQWR2TWFuYWdlciB9IGZyb20gJy4vaW5pdGlhbGl6ZS1hZHYtZGF0YSc7XHJcblxyXG5leHBvcnQgY2xhc3MgQWR2TW9kdWxlIHtcclxuICBwcml2YXRlIHJld2FyZGVkVmlkZW9NYW5hZ2VyOiBSZXdhcmRlZFZpZGVvTWFuYWdlcjtcclxuICBwcml2YXRlIGZ1bGxzY3JlZW5BZHZNYW5hZ2VyOiBGdWxsc2NyZWVuQWR2TWFuYWdlcjtcclxuICBwcml2YXRlIGluaXRpYWxpemVBZHZNYW5hZ2VyOiBJbml0aWFsaXplQWR2TWFuYWdlcjtcclxuXHJcbiAgcHJpdmF0ZSBzdGF0ZURhdGE/OiBBZHZTdGF0ZURhdGE7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7XHJcbiAgICB0aGlzLnJld2FyZGVkVmlkZW9NYW5hZ2VyID0gbmV3IFJld2FyZGVkVmlkZW9NYW5hZ2VyKHRoaXMuY29tbXVuaWNhdG9yKTtcclxuICAgIHRoaXMuZnVsbHNjcmVlbkFkdk1hbmFnZXIgPSBuZXcgRnVsbHNjcmVlbkFkdk1hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xyXG4gICAgdGhpcy5pbml0aWFsaXplQWR2TWFuYWdlciA9IG5ldyBJbml0aWFsaXplQWR2TWFuYWdlcih0aGlzLmNvbW11bmljYXRvcik7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIHJldHVybiB0aGlzLmluaXRpYWxpemVBZHZEYXRhKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGlzQWR2QXZhaWxhYmxlKCkge1xyXG4gICAgcmV0dXJuICEhdGhpcy5zdGF0ZURhdGE/LmlzQXZhaWxhYmxlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNob3dSZXdhcmRlZFZpZGVvKGRhdGE/OiB7IGNhbGxiYWNrcz86IFNob3dSZXdhcmRlZFZpZGVvQ2FsbGJhY2tzIH0pIHtcclxuICAgIHRoaXMucmV3YXJkZWRWaWRlb01hbmFnZXIuYWRkTmV3KGRhdGEpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNob3dGdWxsc2NyZWVuQWR2KGRhdGE/OiB7IGNhbGxiYWNrcz86IFNob3dGdWxsc2NyZWVuQWR2Q2FsbGJhY2tzIH0pIHtcclxuICAgIHRoaXMuZnVsbHNjcmVlbkFkdk1hbmFnZXIuYWRkTmV3KGRhdGEpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIHN3aXRjaCAobWVzc2FnZS5ldmVudCkge1xyXG4gICAgICBjYXNlIEFkdlJlY2VpdmVkTWVzc2FnZUV2ZW50LlNob3dSZXdhcmRlZFZpZGVvOlxyXG4gICAgICAgIHRoaXMucmV3YXJkZWRWaWRlb01hbmFnZXIucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEFkdlJlY2VpdmVkTWVzc2FnZUV2ZW50LlNob3dGdWxsc2NyZWVuQWR2OlxyXG4gICAgICAgIHRoaXMuZnVsbHNjcmVlbkFkdk1hbmFnZXIucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEFkdlJlY2VpdmVkTWVzc2FnZUV2ZW50LlN0YXRlRGF0YTpcclxuICAgICAgICB0aGlzLmluaXRpYWxpemVBZHZNYW5hZ2VyLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICBpZiAoJ3Jlc3VsdCcgaW4gbWVzc2FnZS5kYXRhKSB7XHJcbiAgICAgICAgICB0aGlzLmhhbmRsZVJlY2VpdmVkU3RhdGVEYXRhKG1lc3NhZ2UuZGF0YS5yZXN1bHQgYXMgQWR2U3RhdGVEYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBldmVudCcsIG1lc3NhZ2UuZXZlbnQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVSZWNlaXZlZFN0YXRlRGF0YShkYXRhOiBBZHZTdGF0ZURhdGEpIHtcclxuICAgIHRoaXMuc3RhdGVEYXRhID0gZGF0YTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaW5pdGlhbGl6ZUFkdkRhdGEoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUpID0+IHtcclxuICAgICAgdGhpcy5pbml0aWFsaXplQWR2TWFuYWdlci5hZGROZXcoe1xyXG4gICAgICAgIGNhbGxiYWNrczoge1xyXG4gICAgICAgICAgb25SZWNlaXZlZDogKCkgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIG9uRXJyb3I6ICgpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IGxvZ01lc3NhZ2UgfSBmcm9tICdAL3V0aWxzJztcclxuXHJcbmltcG9ydCB7IE1lc3NhZ2VTb3VyY2UsIFJlY2VpdmVkTWVzc2FnZSwgU2VudE1lc3NhZ2UgfSBmcm9tICcuL21vZGVscyc7XHJcblxyXG4vLyBsaXN0IG9mIG9yaWdpbnMgdGhhdCB3ZSBhbGxvdyB0byB1c2Ugb3VyIFNES1xyXG5jb25zdCBBTExPV0VEX0RFVl9IT1NUID0gJ2xvY2FsaG9zdCc7XHJcbmNvbnN0IEJBU0VfT1JJR0lOID0gJ21lbG9uc2FuZGJveC5jb20nO1xyXG5cclxuZXhwb3J0IGNsYXNzIEdhbWVDb21tdW5pY2F0b3Ige1xyXG4gIHByaXZhdGUgbWVzc2FnZUxpc3RlbmVyPzogdHlwZW9mIHRoaXMub25SZWNlaXZlTWVzc2FnZTtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJzZU1lc3NhZ2U6IChtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpID0+IHZvaWQpIHt9XHJcblxyXG4gIHB1YmxpYyBpbml0aWFsaXplKCkge1xyXG4gICAgaWYgKCF3aW5kb3cucGFyZW50KSB7XHJcbiAgICAgIGxvZ01lc3NhZ2UoWydXYXJuaW5nISBQYXJlbnQgY29udGFpbmVyIGlzIG5vdCBmb3VuZCcsIGNvbnNvbGUud2Fybl0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubWVzc2FnZUxpc3RlbmVyID0gdGhpcy5vblJlY2VpdmVNZXNzYWdlLmJpbmQodGhpcyk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMubWVzc2FnZUxpc3RlbmVyKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkZXN0cm95KCkge1xyXG4gICAgaWYgKHRoaXMubWVzc2FnZUxpc3RlbmVyKSB7XHJcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5tZXNzYWdlTGlzdGVuZXIpO1xyXG4gICAgICBkZWxldGUgdGhpcy5tZXNzYWdlTGlzdGVuZXI7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcG9zdE1lc3NhZ2U8VCBleHRlbmRzIHsgaWQ6IG51bWJlciB9PihtZXNzYWdlOiBPbWl0PFNlbnRNZXNzYWdlPFQ+LCAnc291cmNlJz4pIHtcclxuICAgIGlmICghd2luZG93LnBhcmVudCkge1xyXG4gICAgICBsb2dNZXNzYWdlKFsnQ2FuIG5vdCBwb3N0IG1lc3NhZ2U6IHBhcmVudCB3aW5kb3cgb2JqZWN0IGlzIG5vdCBmb3VuZCddLCBjb25zb2xlLmVycm9yKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxvZ01lc3NhZ2UoWydQb3N0IG1lc3NhZ2UgdG8gcGFyZW50JywgbWVzc2FnZV0pO1xyXG4gICAgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSh7IC4uLm1lc3NhZ2UsIHNvdXJjZTogTWVzc2FnZVNvdXJjZS5NZWxvbldlYkdhbWVBcHAgfSwgJyonKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgb25SZWNlaXZlTWVzc2FnZShldmVudDogTWVzc2FnZUV2ZW50PFJlY2VpdmVkTWVzc2FnZT4pIHtcclxuICAgIGlmICghdGhpcy5jaGVja01lc3NhZ2VPcmlnaW4oZXZlbnQub3JpZ2luKSB8fCAhdGhpcy5jaGVja01lc3NhZ2VTb3VyY2UoZXZlbnQuZGF0YS5zb3VyY2UpKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsb2dNZXNzYWdlKFsnUmVjZWl2ZWQgbWVzc2FnZScsIGV2ZW50LmRhdGFdKTtcclxuICAgIHRoaXMucGFyc2VNZXNzYWdlKGV2ZW50LmRhdGEpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjaGVja01lc3NhZ2VPcmlnaW4ob3JpZ2luOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwob3JpZ2luKTtcclxuICAgIGlmICghdXJsLmhvc3RuYW1lLmVuZHNXaXRoKEJBU0VfT1JJR0lOKSAmJiB1cmwuaG9zdG5hbWUgIT09IEFMTE9XRURfREVWX0hPU1QpIHtcclxuICAgICAgLy8gc29tZXRoaW5nIGZyb20gYW4gdW5rbm93biBkb21haW4sIGludmFsaWRcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh1cmwuaG9zdG5hbWUgIT09IEFMTE9XRURfREVWX0hPU1QgJiYgdXJsLnByb3RvY29sID09PSAnaHR0cDonKSB7XHJcbiAgICAgIGxvZ01lc3NhZ2UoWydub3Qgc2VjdXJlIGNvbm5lY3Rpb24sIHBsZWFzZSB1c2UgaHR0cHMnLCBvcmlnaW5dLCBjb25zb2xlLmVycm9yKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjaGVja01lc3NhZ2VTb3VyY2Uoc291cmNlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIGlmIChzb3VyY2UgIT09IE1lc3NhZ2VTb3VyY2UuTWVsb25XZWJBcHApIHtcclxuICAgICAgbG9nTWVzc2FnZShbJ2luY29ycmVjdCBtZXNzYWdlIHNvdXJjZScsIHNvdXJjZV0sIGNvbnNvbGUuZXJyb3IpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59XHJcbiIsImV4cG9ydCBlbnVtIEV2ZW50VHJhY2tlck1lc3NhZ2VTdWJtb2R1bGUge1xuICBBcHBzRmx5ZXIgPSAnYXBwcy1mbHllcicsXG4gIEdvb2dsZVRhZyA9ICdnb29nbGUtdGFnJyxcbn1cbiIsImV4cG9ydCBlbnVtIEFwcHNGbHllclJlY2VpdmVkTWVzc2FnZUV2ZW50IHtcbiAgU3RhdGVEYXRhID0gJ3N0YXRlLWRhdGEnLFxuICBTZXRDdXN0b21lclVzZXJJZCA9ICdzZXQtY3VzdG9tZXItdXNlci1pZCcsXG4gIFNldEV2ZW50ID0gJ3NldC1ldmVudCcsXG59XG4iLCJleHBvcnQgZW51bSBBcHBzRmx5ZXJTZW50TWVzc2FnZUV2ZW50IHtcbiAgUmVxdWVzdEluaXRpYWxEYXRhID0gJ3JlcXVlc3QtaW5pdGlhbC1kYXRhJyxcbiAgU2V0Q3VzdG9tZXJVc2VySWQgPSAnc2V0LWN1c3RvbWVyLXVzZXItaWQnLFxuICBTZXRFdmVudCA9ICdzZXQtZXZlbnQnLFxufVxuIiwiZXhwb3J0IGVudW0gU2V0Q3VzdG9tZXJVc2VySWRDYWxsYmFja1R5cGUge1xyXG4gIFN1Y2Nlc3MgPSAnc3VjY2VzcycsXHJcbiAgRXJyb3IgPSAnZXJyb3InLFxyXG59XHJcbiIsImV4cG9ydCBlbnVtIFNldEV2ZW50Q2FsbGJhY2tUeXBlIHtcbiAgU3VjY2VzcyA9ICdzdWNjZXNzJyxcbiAgRXJyb3IgPSAnZXJyb3InLFxufVxuIiwiZXhwb3J0IGVudW0gR29vZ2xlVGFnUmVjZWl2ZWRNZXNzYWdlRXZlbnQge1xuICBTdGF0ZURhdGEgPSAnc3RhdGUtZGF0YScsXG4gIFNldEN1c3RvbWVyVXNlcklkID0gJ3NldC1jdXN0b21lci11c2VyLWlkJyxcbiAgU2V0RXZlbnQgPSAnc2V0LWV2ZW50Jyxcbn1cbiIsImV4cG9ydCBlbnVtIEdvb2dsZVRhZ1NlbnRNZXNzYWdlRXZlbnQge1xuICBSZXF1ZXN0SW5pdGlhbERhdGEgPSAncmVxdWVzdC1pbml0aWFsLWRhdGEnLFxuICBTZXRDdXN0b21lclVzZXJJZCA9ICdzZXQtY3VzdG9tZXItdXNlci1pZCcsXG4gIFNldEV2ZW50ID0gJ3NldC1ldmVudCcsXG59XG4iLCJleHBvcnQgZW51bSBTZXRDdXN0b21lclVzZXJJZENhbGxiYWNrVHlwZSB7XHJcbiAgU3VjY2VzcyA9ICdzdWNjZXNzJyxcclxuICBFcnJvciA9ICdlcnJvcicsXHJcbn1cclxuIiwiZXhwb3J0IGVudW0gU2V0RXZlbnRDYWxsYmFja1R5cGUge1xuICBTdWNjZXNzID0gJ3N1Y2Nlc3MnLFxuICBFcnJvciA9ICdlcnJvcicsXG59XG4iLCJleHBvcnQgZW51bSBBdXRoTGlzdGVuZXJzUmVjZWl2ZWRFdmVudFR5cGUge1xyXG4gIEF1dGhDaGFuZ2VTdGFydGVkID0gJ2F1dGgtY2hhbmdlLXN0YXJ0ZWQnLFxyXG4gIEF1dGhDaGFuZ2VDb21wbGV0ZWQgPSAnYXV0aC1jaGFuZ2UtY29tcGxldGVkJyxcclxuICBBdXRoQ2hhbmdlRmFpbGVkID0gJ2F1dGgtY2hhbmdlLWZhaWxlZCcsXHJcbn1cclxuIiwiZXhwb3J0IGVudW0gQXV0aFJlY2VpdmVkTWVzc2FnZUV2ZW50IHtcclxuICBTdGF0ZURhdGEgPSAnc3RhdGUtZGF0YScsXHJcbiAgUmVxdWVzdEdvb2dsZVRva2VuID0gJ3JlcXVlc3QtZ29vZ2xlLXRva2VuJyxcclxuICBHZXRBdXRoRGF0YSA9ICdnZXQtYXV0aC1kYXRhJyxcclxuICBBdXRoTGlzdGVuZXJzID0gJ2F1dGgtbGlzdGVuZXJzJyxcclxufVxyXG4iLCJleHBvcnQgZW51bSBBdXRoU2VudE1lc3NhZ2VFdmVudCB7XHJcbiAgUmVxdWVzdEluaXRpYWxEYXRhID0gJ3JlcXVlc3QtaW5pdGlhbC1kYXRhJyxcclxuICBSZXF1ZXN0R29vZ2xlVG9rZW4gPSAncmVxdWVzdC1nb29nbGUtdG9rZW4nLFxyXG4gIEdldEF1dGhEYXRhID0gJ2dldC1hdXRoLWRhdGEnLFxyXG59XHJcbiIsImV4cG9ydCBlbnVtIEdldEF1dGhEYXRhQ2FsbGJhY2tUeXBlIHtcclxuICBTdWNjZXNzID0gJ3N1Y2Nlc3MnLFxyXG4gIEVycm9yID0gJ2Vycm9yJyxcclxufVxyXG4iLCJleHBvcnQgZW51bSBSZXF1ZXN0R29vZ2xlVG9rZW5DYWxsYmFja1R5cGUge1xuICBTdWNjZXNzID0gJ3N1Y2Nlc3MnLFxuICBFcnJvciA9ICdlcnJvcicsXG59XG4iLCJleHBvcnQgZW51bSBHYW1lRXZlbnRzU2VudE1lc3NhZ2VFdmVudCB7XG4gIEdhbWVTdGVwID0gJ2dhbWUtc3RlcCcsXG59XG4iLCJleHBvcnQgZW51bSBHYW1lU3RlcFR5cGUge1xyXG4gIExvYWRTdGFydGVkID0gJ2xvYWQtc3RhcnRlZCcsXHJcbiAgUmVhZHkgPSAncmVhZHknLFxyXG4gIFVzZXJEYXRhUmVzZXQgPSAndXNlci1kYXRhLXJlc2V0JyxcclxuICBVc2VyRGF0YVJlYWR5ID0gJ3VzZXItZGF0YS1yZWFkeScsXHJcbn1cclxuIiwiZXhwb3J0IGVudW0gTGFuZ3VhZ2VUeXBlIHtcclxuICBFbiA9ICdlbicsXHJcbiAgUnUgPSAncnUnLFxyXG59XHJcbiIsImV4cG9ydCBlbnVtIFJlcXVlc3RDaGFuZ2VMYW5ndWFnZUNhbGxiYWNrVHlwZSB7XHJcbiAgU3VjY2VzcyA9ICdzdWNjZXNzJyxcclxuICBFcnJvciA9ICdlcnJvcicsXHJcbn1cclxuIiwiZXhwb3J0IGVudW0gU2V0dGluZ3NSZWNlaXZlZE1lc3NhZ2VFdmVudCB7XHJcbiAgU3RhdGVEYXRhID0gJ3N0YXRlLWRhdGEnLFxyXG4gIFJlcXVlc3RDaGFuZ2VMYW5ndWFnZSA9ICdyZXF1ZXN0LWNoYW5nZS1sYW5ndWFnZScsXHJcbiAgTGFuZ3VhZ2VDaGFuZ2VkID0gJ2xhbmd1YWdlLWNoYW5nZWQnLFxyXG59XHJcbiIsImV4cG9ydCBlbnVtIFNldHRpbmdzU2VudE1lc3NhZ2VFdmVudCB7XHJcbiAgUmVxdWVzdEluaXRpYWxEYXRhID0gJ3JlcXVlc3QtaW5pdGlhbC1kYXRhJyxcclxuICBSZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2UgPSAncmVxdWVzdC1jaGFuZ2UtbGFuZ3VhZ2UnLFxyXG59XHJcbiIsImV4cG9ydCBlbnVtIFN0b3JlUGFnZVR5cGUge1xyXG4gIENvbnRlbnRJdGVtID0gJ2NvbnRlbnQtaXRlbScsXHJcbiAgU3RvcmVJdGVtID0gJ3N0b3JlLWl0ZW0nLFxyXG4gIFdvcmtzQ29udGVudEl0ZW0gPSAnd29ya3MtY29udGVudC1pdGVtJyxcclxuICBXb3Jrc1N0b3JlSXRlbSA9ICd3b3Jrcy1zdG9yZS1pdGVtJyxcclxuICBDcmVhdGVXb3Jrc0NvbnRlbnRJdGVtID0gJ2NyZWF0ZS13b3Jrcy1jb250ZW50LWl0ZW0nLFxyXG4gIENyZWF0ZVdvcmtzU3RvcmVJdGVtID0gJ2NyZWF0ZS13b3Jrcy1zdG9yZS1pdGVtJyxcclxufVxyXG4iLCJleHBvcnQgZW51bSBTdG9yZVJlY2VpdmVkTWVzc2FnZUV2ZW50IHtcclxuICBTdGF0ZURhdGEgPSAnc3RhdGUtZGF0YScsXHJcbiAgT3BlblN0b3JlUmVxdWVzdCA9ICdvcGVuLXN0b3JlLXJlcXVlc3QnLFxyXG4gIFVwZGF0ZVdhbGxldENvaW5zID0gJ3VwZGF0ZS13YWxsZXQtY29pbnMnLFxyXG59XHJcbiIsImV4cG9ydCBlbnVtIFN0b3JlU2VudE1lc3NhZ2VFdmVudCB7XG4gIE9wZW5TdG9yZVJlcXVlc3QgPSAnb3Blbi1zdG9yZS1yZXF1ZXN0JyxcbiAgUmVxdWVzdEluaXRpYWxEYXRhID0gJ3JlcXVlc3QtaW5pdGlhbC1kYXRhJyxcbiAgVXBkYXRlV2FsbGV0Q29pbnMgPSAndXBkYXRlLXdhbGxldC1jb2lucycsXG59XG4iLCJleHBvcnQgZW51bSBTdG9yZVNlbnRNZXNzYWdlRXZlbnRUeXBlIHtcclxuICBTdWNjZXNzID0gJ3N1Y2Nlc3MnLFxyXG4gIEVycm9yID0gJ2Vycm9yJyxcclxufVxyXG4iLCJleHBvcnQgZW51bSBIb3N0UmVjZWl2ZWRNZXNzYWdlRXZlbnQge1xyXG4gIFN0YXRlRGF0YSA9ICdzdGF0ZS1kYXRhJyxcclxufVxyXG4iLCJleHBvcnQgZW51bSBIb3N0U2VudE1lc3NhZ2VFdmVudCB7XHJcbiAgUmVxdWVzdEluaXRpYWxEYXRhID0gJ3JlcXVlc3QtaW5pdGlhbC1kYXRhJyxcclxuICBSZXF1ZXN0Q2hhbmdlSG9zdCA9ICdyZXF1ZXN0LWNoYW5nZS1ob3N0JyxcclxufVxyXG4iLCJpbXBvcnQgeyBCYXNlQ2FsbGJhY2tDeWNsZSwgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgU2V0Q3VzdG9tZXJVc2VySWRDYWxsYmFja3MsIFNldEN1c3RvbWVyVXNlcklkQ2FsbGJhY2tUeXBlIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBTZXRDdXN0b21lclVzZXJJZENhbGxiYWNrQ3ljbGUgZXh0ZW5kcyBCYXNlQ2FsbGJhY2tDeWNsZTxTZXRDdXN0b21lclVzZXJJZENhbGxiYWNrcz4ge1xyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xyXG4gICAgICBjYXNlIFNldEN1c3RvbWVyVXNlcklkQ2FsbGJhY2tUeXBlLlN1Y2Nlc3M6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKCk7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIFNldEN1c3RvbWVyVXNlcklkQ2FsbGJhY2tUeXBlLkVycm9yOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlRXJyb3IobWVzc2FnZSBhcyBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyBlcnJvcjogdW5rbm93biB9Pik7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVN1Y2Nlc3MoKSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uU3VjY2Vzcykge1xyXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblN1Y2Nlc3MoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRXJyb3IobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlcjsgZXJyb3I6IHVua25vd24gfT4pIHtcclxuICAgIGlmICh0aGlzLmNhbGxiYWNrcz8ub25FcnJvcikge1xyXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vbkVycm9yKG1lc3NhZ2UuZGF0YS5lcnJvcik7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5oYW5kbGVEZXN0cm95KCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IE1lc3NhZ2VNb2R1bGUsIFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJ0AvZ2FtZS1jb21tdW5pY2F0b3InO1xyXG5cclxuaW1wb3J0IHsgRXZlbnRUcmFja2VyTWVzc2FnZVN1Ym1vZHVsZSB9IGZyb20gJ0AvbW9kdWxlcy9ldmVudC10cmFja2VyL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBBcHBzRmx5ZXJTZW50TWVzc2FnZUV2ZW50LCBTZXRDdXN0b21lclVzZXJJZERhdGEgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgU2V0Q3VzdG9tZXJVc2VySWRDYWxsYmFja0N5Y2xlIH0gZnJvbSAnLi9zZXQtY3VzdG9tZXItdXNlci1pZC1jYWxsYmFjay1jeWNsZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2V0Q3VzdG9tZXJVc2VySWRNYW5hZ2VyIHtcclxuICBwcml2YXRlIGN5Y2xlcyA9IG5ldyBNYXA8bnVtYmVyLCBTZXRDdXN0b21lclVzZXJJZENhbGxiYWNrQ3ljbGU+KCk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7fVxyXG5cclxuICBwdWJsaWMgYWRkTmV3KGRhdGE6IFNldEN1c3RvbWVyVXNlcklkRGF0YSkge1xyXG4gICAgY29uc3QgaWQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHRoaXMuY3ljbGVzLnNldChcclxuICAgICAgaWQsXHJcbiAgICAgIG5ldyBTZXRDdXN0b21lclVzZXJJZENhbGxiYWNrQ3ljbGUoe1xyXG4gICAgICAgIC4uLihkYXRhPy5jYWxsYmFja3MgPz8ge30pLFxyXG4gICAgICAgIG9uRGVzdHJveTogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5oYW5kbGVEZXN0cm95Q3ljbGUoaWQpO1xyXG4gICAgICAgICAgZGF0YS5jYWxsYmFja3Mub25EZXN0cm95Py4oKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5jb21tdW5pY2F0b3IucG9zdE1lc3NhZ2Uoe1xyXG4gICAgICBtb2R1bGU6IE1lc3NhZ2VNb2R1bGUuRXZlbnRUcmFja2VyLFxyXG4gICAgICBzdWJtb2R1bGU6IEV2ZW50VHJhY2tlck1lc3NhZ2VTdWJtb2R1bGUuQXBwc0ZseWVyLFxyXG4gICAgICBldmVudDogQXBwc0ZseWVyU2VudE1lc3NhZ2VFdmVudC5TZXRDdXN0b21lclVzZXJJZCxcclxuICAgICAgZGF0YTogeyBpZCwgdXNlcklkOiBkYXRhLnVzZXJJZCB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGlkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIGlmICh0aGlzLmN5Y2xlcy5oYXMobWVzc2FnZS5kYXRhLmlkKSkge1xyXG4gICAgICBjb25zdCBjeWNsZSA9IHRoaXMuY3ljbGVzLmdldChtZXNzYWdlLmRhdGEuaWQpO1xyXG4gICAgICBjeWNsZS5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZURlc3Ryb3lDeWNsZShjeWNsZUlkOiBudW1iZXIpIHtcclxuICAgIHRoaXMuY3ljbGVzLmRlbGV0ZShjeWNsZUlkKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQmFzZUNhbGxiYWNrQ3ljbGUsIFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IFNldEV2ZW50Q2FsbGJhY2tzLCBTZXRFdmVudENhbGxiYWNrVHlwZSB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2V0RXZlbnRDYWxsYmFja0N5Y2xlIGV4dGVuZHMgQmFzZUNhbGxiYWNrQ3ljbGU8U2V0RXZlbnRDYWxsYmFja3M+IHtcclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcclxuICAgICAgY2FzZSBTZXRFdmVudENhbGxiYWNrVHlwZS5TdWNjZXNzOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlU3VjY2VzcygpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBTZXRFdmVudENhbGxiYWNrVHlwZS5FcnJvcjpcclxuICAgICAgICB0aGlzLmhhbmRsZUVycm9yKG1lc3NhZ2UgYXMgUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlcjsgZXJyb3I6IHVua25vd24gfT4pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVTdWNjZXNzKCkge1xyXG4gICAgaWYgKHRoaXMuY2FsbGJhY2tzPy5vblN1Y2Nlc3MpIHtcclxuICAgICAgdGhpcy5jYWxsYmFja3Mub25TdWNjZXNzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5oYW5kbGVEZXN0cm95KCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZUVycm9yKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZTx7IGlkOiBudW1iZXI7IGVycm9yOiB1bmtub3duIH0+KSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uRXJyb3IpIHtcclxuICAgICAgdGhpcy5jYWxsYmFja3Mub25FcnJvcihtZXNzYWdlLmRhdGEuZXJyb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBNZXNzYWdlTW9kdWxlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IEV2ZW50VHJhY2tlck1lc3NhZ2VTdWJtb2R1bGUgfSBmcm9tICdAL21vZHVsZXMvZXZlbnQtdHJhY2tlci9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgQXBwc0ZseWVyU2VudE1lc3NhZ2VFdmVudCwgU2V0RXZlbnREYXRhIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IFNldEV2ZW50Q2FsbGJhY2tDeWNsZSB9IGZyb20gJy4vc2V0LWV2ZW50LWNhbGxiYWNrLWN5Y2xlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBTZXRFdmVudE1hbmFnZXIge1xyXG4gIHByaXZhdGUgY3ljbGVzID0gbmV3IE1hcDxudW1iZXIsIFNldEV2ZW50Q2FsbGJhY2tDeWNsZT4oKTtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XHJcblxyXG4gIHB1YmxpYyBhZGROZXcoZGF0YTogU2V0RXZlbnREYXRhKSB7XHJcbiAgICBjb25zdCBpZCA9IERhdGUubm93KCk7XHJcblxyXG4gICAgdGhpcy5jeWNsZXMuc2V0KFxyXG4gICAgICBpZCxcclxuICAgICAgbmV3IFNldEV2ZW50Q2FsbGJhY2tDeWNsZSh7XHJcbiAgICAgICAgLi4uKGRhdGE/LmNhbGxiYWNrcyA/PyB7fSksXHJcbiAgICAgICAgb25EZXN0cm95OiAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLmhhbmRsZURlc3Ryb3lDeWNsZShpZCk7XHJcbiAgICAgICAgICBkYXRhLmNhbGxiYWNrcy5vbkRlc3Ryb3k/LigpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLmNvbW11bmljYXRvci5wb3N0TWVzc2FnZSh7XHJcbiAgICAgIG1vZHVsZTogTWVzc2FnZU1vZHVsZS5FdmVudFRyYWNrZXIsXHJcbiAgICAgIHN1Ym1vZHVsZTogRXZlbnRUcmFja2VyTWVzc2FnZVN1Ym1vZHVsZS5BcHBzRmx5ZXIsXHJcbiAgICAgIGV2ZW50OiBBcHBzRmx5ZXJTZW50TWVzc2FnZUV2ZW50LlNldEV2ZW50LFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgaWQsXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgZXZlbnROYW1lOiBkYXRhLmV2ZW50TmFtZSxcclxuICAgICAgICAgIGV2ZW50VmFsdWU6IGRhdGEuZXZlbnRWYWx1ZSxcclxuICAgICAgICAgIGV2ZW50S2V5OiBkYXRhLmV2ZW50S2V5LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gaWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgaWYgKHRoaXMuY3ljbGVzLmhhcyhtZXNzYWdlLmRhdGEuaWQpKSB7XHJcbiAgICAgIGNvbnN0IGN5Y2xlID0gdGhpcy5jeWNsZXMuZ2V0KG1lc3NhZ2UuZGF0YS5pZCk7XHJcbiAgICAgIGN5Y2xlLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRGVzdHJveUN5Y2xlKGN5Y2xlSWQ6IG51bWJlcikge1xyXG4gICAgdGhpcy5jeWNsZXMuZGVsZXRlKGN5Y2xlSWQpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBTdGF0ZURhdGEsIEluaXRpYWxpemVEYXRhQ2FsbGJhY2tzIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IEJhc2VDYWxsYmFja0N5Y2xlIH0gZnJvbSAnQC9tb2RlbHMvYmFzZS1jYWxsYmFjay1jeWNsZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgSW5pdGlhbGl6ZURhdGFDYWxsYmFja0N5Y2xlIGV4dGVuZHMgQmFzZUNhbGxiYWNrQ3ljbGU8SW5pdGlhbGl6ZURhdGFDYWxsYmFja3M+IHtcclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgdGhpcy5oYW5kbGVSZWNlaXZlZE1lc3NhZ2UobWVzc2FnZSBhcyBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyByZXN1bHQ6IFN0YXRlRGF0YSB9Pik7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVJlY2VpdmVkTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyByZXN1bHQ6IFN0YXRlRGF0YSB9Pikge1xyXG4gICAgdGhpcy5jYWxsYmFja3M/Lm9uUmVjZWl2ZWQ/LihtZXNzYWdlLmRhdGEucmVzdWx0KTtcclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBNZXNzYWdlTW9kdWxlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IEV2ZW50VHJhY2tlck1lc3NhZ2VTdWJtb2R1bGUgfSBmcm9tICdAL21vZHVsZXMvZXZlbnQtdHJhY2tlci9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgQXBwc0ZseWVyU2VudE1lc3NhZ2VFdmVudCwgSW5pdGlhbGl6ZURhdGFDYWxsYmFja3MgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgSW5pdGlhbGl6ZURhdGFDYWxsYmFja0N5Y2xlIH0gZnJvbSAnLi9pbml0aWFsaXplLWRhdGEtY2FsbGJhY2stY3ljbGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEluaXRpYWxpemVNYW5hZ2VyIHtcclxuICBwcml2YXRlIGN5Y2xlcyA9IG5ldyBNYXA8bnVtYmVyLCBJbml0aWFsaXplRGF0YUNhbGxiYWNrQ3ljbGU+KCk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7fVxyXG5cclxuICBwdWJsaWMgYWRkTmV3KGRhdGE6IHsgY2FsbGJhY2tzOiBJbml0aWFsaXplRGF0YUNhbGxiYWNrcyB9KSB7XHJcbiAgICBjb25zdCBpZCA9IERhdGUubm93KCk7XHJcblxyXG4gICAgdGhpcy5jeWNsZXMuc2V0KFxyXG4gICAgICBpZCxcclxuICAgICAgbmV3IEluaXRpYWxpemVEYXRhQ2FsbGJhY2tDeWNsZSh7XHJcbiAgICAgICAgLi4uKGRhdGE/LmNhbGxiYWNrcyA/PyB7fSksXHJcbiAgICAgICAgb25EZXN0cm95OiAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLmhhbmRsZURlc3Ryb3lDeWNsZShpZCk7XHJcbiAgICAgICAgICBkYXRhPy5jYWxsYmFja3M/Lm9uRGVzdHJveT8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcclxuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLkV2ZW50VHJhY2tlcixcclxuICAgICAgc3VibW9kdWxlOiBFdmVudFRyYWNrZXJNZXNzYWdlU3VibW9kdWxlLkFwcHNGbHllcixcclxuICAgICAgZXZlbnQ6IEFwcHNGbHllclNlbnRNZXNzYWdlRXZlbnQuUmVxdWVzdEluaXRpYWxEYXRhLFxyXG4gICAgICBkYXRhOiB7IGlkIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gaWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgaWYgKHRoaXMuY3ljbGVzLmhhcyhtZXNzYWdlLmRhdGEuaWQpKSB7XHJcbiAgICAgIGNvbnN0IGN5Y2xlID0gdGhpcy5jeWNsZXMuZ2V0KG1lc3NhZ2UuZGF0YS5pZCk7XHJcbiAgICAgIGN5Y2xlLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRGVzdHJveUN5Y2xlKGN5Y2xlSWQ6IG51bWJlcikge1xyXG4gICAgdGhpcy5jeWNsZXMuZGVsZXRlKGN5Y2xlSWQpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IEFwcHNGbHllclJlY2VpdmVkTWVzc2FnZUV2ZW50LCBTdGF0ZURhdGEsIFNldEV2ZW50RGF0YSwgU2V0Q3VzdG9tZXJVc2VySWREYXRhIH0gZnJvbSAnLi9tb2RlbHMnO1xyXG5pbXBvcnQgeyBTZXRDdXN0b21lclVzZXJJZE1hbmFnZXIgfSBmcm9tICcuL3NldC1jdXN0b21lci11c2VyLWlkJztcclxuaW1wb3J0IHsgU2V0RXZlbnRNYW5hZ2VyIH0gZnJvbSAnLi9zZXQtZXZlbnQnO1xyXG5pbXBvcnQgeyBJbml0aWFsaXplTWFuYWdlciB9IGZyb20gJy4vaW5pdGlhbGl6ZS1kYXRhJztcclxuXHJcbmV4cG9ydCBjbGFzcyBBcHBzRmx5ZXJTdWJtb2R1bGUge1xyXG4gIHByaXZhdGUgc2V0Q3VzdG9tZXJVc2VySWRNYW5hZ2VyOiBTZXRDdXN0b21lclVzZXJJZE1hbmFnZXI7XHJcbiAgcHJpdmF0ZSBzZXRFdmVudE1hbmFnZXI6IFNldEV2ZW50TWFuYWdlcjtcclxuICBwcml2YXRlIGluaXRpYWxpemVNYW5hZ2VyOiBJbml0aWFsaXplTWFuYWdlcjtcclxuXHJcbiAgcHJpdmF0ZSBzdGF0ZURhdGE/OiBTdGF0ZURhdGE7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7XHJcbiAgICB0aGlzLnNldEN1c3RvbWVyVXNlcklkTWFuYWdlciA9IG5ldyBTZXRDdXN0b21lclVzZXJJZE1hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xyXG4gICAgdGhpcy5zZXRFdmVudE1hbmFnZXIgPSBuZXcgU2V0RXZlbnRNYW5hZ2VyKHRoaXMuY29tbXVuaWNhdG9yKTtcclxuICAgIHRoaXMuaW5pdGlhbGl6ZU1hbmFnZXIgPSBuZXcgSW5pdGlhbGl6ZU1hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGluaXRpYWxpemUoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gdGhpcy5pbml0aWFsaXplRGF0YSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBpc0F2YWlsYWJsZSgpIHtcclxuICAgIHJldHVybiAhIXRoaXMuc3RhdGVEYXRhPy5pc0F2YWlsYWJsZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXRDdXN0b21lclVzZXJJZChkYXRhOiBTZXRDdXN0b21lclVzZXJJZERhdGEpIHtcclxuICAgIHRoaXMuc2V0Q3VzdG9tZXJVc2VySWRNYW5hZ2VyLmFkZE5ldyhkYXRhKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXRFdmVudChkYXRhOiBTZXRFdmVudERhdGEpIHtcclxuICAgIHRoaXMuc2V0RXZlbnRNYW5hZ2VyLmFkZE5ldyhkYXRhKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBzd2l0Y2ggKG1lc3NhZ2UuZXZlbnQpIHtcclxuICAgICAgY2FzZSBBcHBzRmx5ZXJSZWNlaXZlZE1lc3NhZ2VFdmVudC5TdGF0ZURhdGE6XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplTWFuYWdlci5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgaWYgKCdyZXN1bHQnIGluIG1lc3NhZ2UuZGF0YSkge1xyXG4gICAgICAgICAgdGhpcy5oYW5kbGVSZWNlaXZlZFN0YXRlRGF0YShtZXNzYWdlLmRhdGEucmVzdWx0IGFzIFN0YXRlRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEFwcHNGbHllclJlY2VpdmVkTWVzc2FnZUV2ZW50LlNldEN1c3RvbWVyVXNlcklkOlxyXG4gICAgICAgIHRoaXMuc2V0Q3VzdG9tZXJVc2VySWRNYW5hZ2VyLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBBcHBzRmx5ZXJSZWNlaXZlZE1lc3NhZ2VFdmVudC5TZXRFdmVudDpcclxuICAgICAgICB0aGlzLnNldEV2ZW50TWFuYWdlci5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBldmVudCcsIG1lc3NhZ2UuZXZlbnQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVSZWNlaXZlZFN0YXRlRGF0YShkYXRhOiBTdGF0ZURhdGEpIHtcclxuICAgIHRoaXMuc3RhdGVEYXRhID0gZGF0YTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaW5pdGlhbGl6ZURhdGEoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUpID0+IHtcclxuICAgICAgdGhpcy5pbml0aWFsaXplTWFuYWdlci5hZGROZXcoe1xyXG4gICAgICAgIGNhbGxiYWNrczoge1xyXG4gICAgICAgICAgb25SZWNlaXZlZDogKCkgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIG9uRXJyb3I6ICgpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IEJhc2VDYWxsYmFja0N5Y2xlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBTZXRDdXN0b21lclVzZXJJZENhbGxiYWNrcywgU2V0Q3VzdG9tZXJVc2VySWRDYWxsYmFja1R5cGUgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5leHBvcnQgY2xhc3MgU2V0Q3VzdG9tZXJVc2VySWRDYWxsYmFja0N5Y2xlIGV4dGVuZHMgQmFzZUNhbGxiYWNrQ3ljbGU8U2V0Q3VzdG9tZXJVc2VySWRDYWxsYmFja3M+IHtcclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcclxuICAgICAgY2FzZSBTZXRDdXN0b21lclVzZXJJZENhbGxiYWNrVHlwZS5TdWNjZXNzOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlU3VjY2VzcygpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBTZXRDdXN0b21lclVzZXJJZENhbGxiYWNrVHlwZS5FcnJvcjpcclxuICAgICAgICB0aGlzLmhhbmRsZUVycm9yKG1lc3NhZ2UgYXMgUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlcjsgZXJyb3I6IHVua25vd24gfT4pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVTdWNjZXNzKCkge1xyXG4gICAgaWYgKHRoaXMuY2FsbGJhY2tzPy5vblN1Y2Nlc3MpIHtcclxuICAgICAgdGhpcy5jYWxsYmFja3Mub25TdWNjZXNzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5oYW5kbGVEZXN0cm95KCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZUVycm9yKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZTx7IGlkOiBudW1iZXI7IGVycm9yOiB1bmtub3duIH0+KSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uRXJyb3IpIHtcclxuICAgICAgdGhpcy5jYWxsYmFja3Mub25FcnJvcihtZXNzYWdlLmRhdGEuZXJyb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBNZXNzYWdlTW9kdWxlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IEV2ZW50VHJhY2tlck1lc3NhZ2VTdWJtb2R1bGUgfSBmcm9tICdAL21vZHVsZXMvZXZlbnQtdHJhY2tlci9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgR29vZ2xlVGFnU2VudE1lc3NhZ2VFdmVudCwgU2V0Q3VzdG9tZXJVc2VySWREYXRhIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IFNldEN1c3RvbWVyVXNlcklkQ2FsbGJhY2tDeWNsZSB9IGZyb20gJy4vc2V0LWN1c3RvbWVyLXVzZXItaWQtY2FsbGJhY2stY3ljbGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNldEN1c3RvbWVyVXNlcklkTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBjeWNsZXMgPSBuZXcgTWFwPG51bWJlciwgU2V0Q3VzdG9tZXJVc2VySWRDYWxsYmFja0N5Y2xlPigpO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbW11bmljYXRvcjogR2FtZUNvbW11bmljYXRvcikge31cclxuXHJcbiAgcHVibGljIGFkZE5ldyhkYXRhOiBTZXRDdXN0b21lclVzZXJJZERhdGEpIHtcclxuICAgIGNvbnN0IGlkID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgICB0aGlzLmN5Y2xlcy5zZXQoXHJcbiAgICAgIGlkLFxyXG4gICAgICBuZXcgU2V0Q3VzdG9tZXJVc2VySWRDYWxsYmFja0N5Y2xlKHtcclxuICAgICAgICAuLi4oZGF0YT8uY2FsbGJhY2tzID8/IHt9KSxcclxuICAgICAgICBvbkRlc3Ryb3k6ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuaGFuZGxlRGVzdHJveUN5Y2xlKGlkKTtcclxuICAgICAgICAgIGRhdGEuY2FsbGJhY2tzLm9uRGVzdHJveT8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcclxuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLkV2ZW50VHJhY2tlcixcclxuICAgICAgc3VibW9kdWxlOiBFdmVudFRyYWNrZXJNZXNzYWdlU3VibW9kdWxlLkdvb2dsZVRhZyxcclxuICAgICAgZXZlbnQ6IEdvb2dsZVRhZ1NlbnRNZXNzYWdlRXZlbnQuU2V0Q3VzdG9tZXJVc2VySWQsXHJcbiAgICAgIGRhdGE6IHsgaWQsIHVzZXJJZDogZGF0YS51c2VySWQgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBpZDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBpZiAodGhpcy5jeWNsZXMuaGFzKG1lc3NhZ2UuZGF0YS5pZCkpIHtcclxuICAgICAgY29uc3QgY3ljbGUgPSB0aGlzLmN5Y2xlcy5nZXQobWVzc2FnZS5kYXRhLmlkKTtcclxuICAgICAgY3ljbGUucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVEZXN0cm95Q3ljbGUoY3ljbGVJZDogbnVtYmVyKSB7XHJcbiAgICB0aGlzLmN5Y2xlcy5kZWxldGUoY3ljbGVJZCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IEJhc2VDYWxsYmFja0N5Y2xlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBTZXRFdmVudENhbGxiYWNrcywgU2V0RXZlbnRDYWxsYmFja1R5cGUgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNldEV2ZW50Q2FsbGJhY2tDeWNsZSBleHRlbmRzIEJhc2VDYWxsYmFja0N5Y2xlPFNldEV2ZW50Q2FsbGJhY2tzPiB7XHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XHJcbiAgICAgIGNhc2UgU2V0RXZlbnRDYWxsYmFja1R5cGUuU3VjY2VzczpcclxuICAgICAgICB0aGlzLmhhbmRsZVN1Y2Nlc3MoKTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgU2V0RXZlbnRDYWxsYmFja1R5cGUuRXJyb3I6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVFcnJvcihtZXNzYWdlIGFzIFJlY2VpdmVkTWVzc2FnZTx7IGlkOiBudW1iZXI7IGVycm9yOiB1bmtub3duIH0+KTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlU3VjY2VzcygpIHtcclxuICAgIGlmICh0aGlzLmNhbGxiYWNrcz8ub25TdWNjZXNzKSB7XHJcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uU3VjY2VzcygpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVFcnJvcihtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyBlcnJvcjogdW5rbm93biB9Pikge1xyXG4gICAgaWYgKHRoaXMuY2FsbGJhY2tzPy5vbkVycm9yKSB7XHJcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uRXJyb3IobWVzc2FnZS5kYXRhLmVycm9yKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgTWVzc2FnZU1vZHVsZSwgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5pbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XHJcblxyXG5pbXBvcnQgeyBFdmVudFRyYWNrZXJNZXNzYWdlU3VibW9kdWxlIH0gZnJvbSAnQC9tb2R1bGVzL2V2ZW50LXRyYWNrZXIvbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IEdvb2dsZVRhZ1NlbnRNZXNzYWdlRXZlbnQsIFNldEV2ZW50RGF0YSB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBTZXRFdmVudENhbGxiYWNrQ3ljbGUgfSBmcm9tICcuL3NldC1ldmVudC1jYWxsYmFjay1jeWNsZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2V0RXZlbnRNYW5hZ2VyIHtcclxuICBwcml2YXRlIGN5Y2xlcyA9IG5ldyBNYXA8bnVtYmVyLCBTZXRFdmVudENhbGxiYWNrQ3ljbGU+KCk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7fVxyXG5cclxuICBwdWJsaWMgYWRkTmV3KGRhdGE6IFNldEV2ZW50RGF0YSkge1xyXG4gICAgY29uc3QgaWQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHRoaXMuY3ljbGVzLnNldChcclxuICAgICAgaWQsXHJcbiAgICAgIG5ldyBTZXRFdmVudENhbGxiYWNrQ3ljbGUoe1xyXG4gICAgICAgIC4uLihkYXRhPy5jYWxsYmFja3MgPz8ge30pLFxyXG4gICAgICAgIG9uRGVzdHJveTogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5oYW5kbGVEZXN0cm95Q3ljbGUoaWQpO1xyXG4gICAgICAgICAgZGF0YS5jYWxsYmFja3Mub25EZXN0cm95Py4oKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5jb21tdW5pY2F0b3IucG9zdE1lc3NhZ2Uoe1xyXG4gICAgICBtb2R1bGU6IE1lc3NhZ2VNb2R1bGUuRXZlbnRUcmFja2VyLFxyXG4gICAgICBzdWJtb2R1bGU6IEV2ZW50VHJhY2tlck1lc3NhZ2VTdWJtb2R1bGUuR29vZ2xlVGFnLFxyXG4gICAgICBldmVudDogR29vZ2xlVGFnU2VudE1lc3NhZ2VFdmVudC5TZXRFdmVudCxcclxuICAgICAgZGF0YToge1xyXG4gICAgICAgIGlkLFxyXG4gICAgICAgIGV2ZW50UGFyYW1ldGVyczogZGF0YS5ldmVudFBhcmFtZXRlcnMsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gaWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgaWYgKHRoaXMuY3ljbGVzLmhhcyhtZXNzYWdlLmRhdGEuaWQpKSB7XHJcbiAgICAgIGNvbnN0IGN5Y2xlID0gdGhpcy5jeWNsZXMuZ2V0KG1lc3NhZ2UuZGF0YS5pZCk7XHJcbiAgICAgIGN5Y2xlLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRGVzdHJveUN5Y2xlKGN5Y2xlSWQ6IG51bWJlcikge1xyXG4gICAgdGhpcy5jeWNsZXMuZGVsZXRlKGN5Y2xlSWQpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBTdGF0ZURhdGEsIEluaXRpYWxpemVEYXRhQ2FsbGJhY2tzIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IEJhc2VDYWxsYmFja0N5Y2xlIH0gZnJvbSAnQC9tb2RlbHMvYmFzZS1jYWxsYmFjay1jeWNsZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgSW5pdGlhbGl6ZURhdGFDYWxsYmFja0N5Y2xlIGV4dGVuZHMgQmFzZUNhbGxiYWNrQ3ljbGU8SW5pdGlhbGl6ZURhdGFDYWxsYmFja3M+IHtcclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgdGhpcy5oYW5kbGVSZWNlaXZlZE1lc3NhZ2UobWVzc2FnZSBhcyBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyByZXN1bHQ6IFN0YXRlRGF0YSB9Pik7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVJlY2VpdmVkTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyByZXN1bHQ6IFN0YXRlRGF0YSB9Pikge1xyXG4gICAgdGhpcy5jYWxsYmFja3M/Lm9uUmVjZWl2ZWQ/LihtZXNzYWdlLmRhdGEucmVzdWx0KTtcclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBNZXNzYWdlTW9kdWxlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IEV2ZW50VHJhY2tlck1lc3NhZ2VTdWJtb2R1bGUgfSBmcm9tICdAL21vZHVsZXMvZXZlbnQtdHJhY2tlci9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgR29vZ2xlVGFnU2VudE1lc3NhZ2VFdmVudCwgSW5pdGlhbGl6ZURhdGFDYWxsYmFja3MgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgSW5pdGlhbGl6ZURhdGFDYWxsYmFja0N5Y2xlIH0gZnJvbSAnLi9pbml0aWFsaXplLWRhdGEtY2FsbGJhY2stY3ljbGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEluaXRpYWxpemVNYW5hZ2VyIHtcclxuICBwcml2YXRlIGN5Y2xlcyA9IG5ldyBNYXA8bnVtYmVyLCBJbml0aWFsaXplRGF0YUNhbGxiYWNrQ3ljbGU+KCk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7fVxyXG5cclxuICBwdWJsaWMgYWRkTmV3KGRhdGE6IHsgY2FsbGJhY2tzOiBJbml0aWFsaXplRGF0YUNhbGxiYWNrcyB9KSB7XHJcbiAgICBjb25zdCBpZCA9IERhdGUubm93KCk7XHJcblxyXG4gICAgdGhpcy5jeWNsZXMuc2V0KFxyXG4gICAgICBpZCxcclxuICAgICAgbmV3IEluaXRpYWxpemVEYXRhQ2FsbGJhY2tDeWNsZSh7XHJcbiAgICAgICAgLi4uKGRhdGE/LmNhbGxiYWNrcyA/PyB7fSksXHJcbiAgICAgICAgb25EZXN0cm95OiAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLmhhbmRsZURlc3Ryb3lDeWNsZShpZCk7XHJcbiAgICAgICAgICBkYXRhPy5jYWxsYmFja3M/Lm9uRGVzdHJveT8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcclxuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLkV2ZW50VHJhY2tlcixcclxuICAgICAgc3VibW9kdWxlOiBFdmVudFRyYWNrZXJNZXNzYWdlU3VibW9kdWxlLkdvb2dsZVRhZyxcclxuICAgICAgZXZlbnQ6IEdvb2dsZVRhZ1NlbnRNZXNzYWdlRXZlbnQuUmVxdWVzdEluaXRpYWxEYXRhLFxyXG4gICAgICBkYXRhOiB7IGlkIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gaWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgaWYgKHRoaXMuY3ljbGVzLmhhcyhtZXNzYWdlLmRhdGEuaWQpKSB7XHJcbiAgICAgIGNvbnN0IGN5Y2xlID0gdGhpcy5jeWNsZXMuZ2V0KG1lc3NhZ2UuZGF0YS5pZCk7XHJcbiAgICAgIGN5Y2xlLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRGVzdHJveUN5Y2xlKGN5Y2xlSWQ6IG51bWJlcikge1xyXG4gICAgdGhpcy5jeWNsZXMuZGVsZXRlKGN5Y2xlSWQpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IEdvb2dsZVRhZ1JlY2VpdmVkTWVzc2FnZUV2ZW50LCBTdGF0ZURhdGEsIFNldEV2ZW50RGF0YSwgU2V0Q3VzdG9tZXJVc2VySWREYXRhIH0gZnJvbSAnLi9tb2RlbHMnO1xyXG5pbXBvcnQgeyBTZXRDdXN0b21lclVzZXJJZE1hbmFnZXIgfSBmcm9tICcuL3NldC1jdXN0b21lci11c2VyLWlkJztcclxuaW1wb3J0IHsgU2V0RXZlbnRNYW5hZ2VyIH0gZnJvbSAnLi9zZXQtZXZlbnQnO1xyXG5pbXBvcnQgeyBJbml0aWFsaXplTWFuYWdlciB9IGZyb20gJy4vaW5pdGlhbGl6ZS1kYXRhJztcclxuXHJcbmV4cG9ydCBjbGFzcyBHb29nbGVUYWdTdWJtb2R1bGUge1xyXG4gIHByaXZhdGUgc2V0Q3VzdG9tZXJVc2VySWRNYW5hZ2VyOiBTZXRDdXN0b21lclVzZXJJZE1hbmFnZXI7XHJcbiAgcHJpdmF0ZSBzZXRFdmVudE1hbmFnZXI6IFNldEV2ZW50TWFuYWdlcjtcclxuICBwcml2YXRlIGluaXRpYWxpemVNYW5hZ2VyOiBJbml0aWFsaXplTWFuYWdlcjtcclxuXHJcbiAgcHJpdmF0ZSBzdGF0ZURhdGE/OiBTdGF0ZURhdGE7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7XHJcbiAgICB0aGlzLnNldEN1c3RvbWVyVXNlcklkTWFuYWdlciA9IG5ldyBTZXRDdXN0b21lclVzZXJJZE1hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xyXG4gICAgdGhpcy5zZXRFdmVudE1hbmFnZXIgPSBuZXcgU2V0RXZlbnRNYW5hZ2VyKHRoaXMuY29tbXVuaWNhdG9yKTtcclxuICAgIHRoaXMuaW5pdGlhbGl6ZU1hbmFnZXIgPSBuZXcgSW5pdGlhbGl6ZU1hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGluaXRpYWxpemUoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gdGhpcy5pbml0aWFsaXplRGF0YSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBpc0F2YWlsYWJsZSgpIHtcclxuICAgIHJldHVybiAhIXRoaXMuc3RhdGVEYXRhPy5pc0F2YWlsYWJsZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXRDdXN0b21lclVzZXJJZChkYXRhOiBTZXRDdXN0b21lclVzZXJJZERhdGEpIHtcclxuICAgIHRoaXMuc2V0Q3VzdG9tZXJVc2VySWRNYW5hZ2VyLmFkZE5ldyhkYXRhKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXRFdmVudChkYXRhOiBTZXRFdmVudERhdGEpIHtcclxuICAgIHRoaXMuc2V0RXZlbnRNYW5hZ2VyLmFkZE5ldyhkYXRhKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBzd2l0Y2ggKG1lc3NhZ2UuZXZlbnQpIHtcclxuICAgICAgY2FzZSBHb29nbGVUYWdSZWNlaXZlZE1lc3NhZ2VFdmVudC5TdGF0ZURhdGE6XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplTWFuYWdlci5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgaWYgKCdyZXN1bHQnIGluIG1lc3NhZ2UuZGF0YSkge1xyXG4gICAgICAgICAgdGhpcy5oYW5kbGVSZWNlaXZlZFN0YXRlRGF0YShtZXNzYWdlLmRhdGEucmVzdWx0IGFzIFN0YXRlRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdvb2dsZVRhZ1JlY2VpdmVkTWVzc2FnZUV2ZW50LlNldEN1c3RvbWVyVXNlcklkOlxyXG4gICAgICAgIHRoaXMuc2V0Q3VzdG9tZXJVc2VySWRNYW5hZ2VyLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHb29nbGVUYWdSZWNlaXZlZE1lc3NhZ2VFdmVudC5TZXRFdmVudDpcclxuICAgICAgICB0aGlzLnNldEV2ZW50TWFuYWdlci5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBldmVudCcsIG1lc3NhZ2UuZXZlbnQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVSZWNlaXZlZFN0YXRlRGF0YShkYXRhOiBTdGF0ZURhdGEpIHtcclxuICAgIHRoaXMuc3RhdGVEYXRhID0gZGF0YTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaW5pdGlhbGl6ZURhdGEoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUpID0+IHtcclxuICAgICAgdGhpcy5pbml0aWFsaXplTWFuYWdlci5hZGROZXcoe1xyXG4gICAgICAgIGNhbGxiYWNrczoge1xyXG4gICAgICAgICAgb25SZWNlaXZlZDogKCkgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIG9uRXJyb3I6ICgpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJ0AvZ2FtZS1jb21tdW5pY2F0b3InO1xyXG5cclxuaW1wb3J0IHsgRXZlbnRUcmFja2VyTWVzc2FnZVN1Ym1vZHVsZSB9IGZyb20gJy4vbW9kZWxzJztcclxuaW1wb3J0IHsgQXBwc0ZseWVyU3VibW9kdWxlIH0gZnJvbSAnLi9zdWJtb2R1bGVzL2FwcHMtZmx5ZXInO1xyXG5pbXBvcnQgeyBHb29nbGVUYWdTdWJtb2R1bGUgfSBmcm9tICcuL3N1Ym1vZHVsZXMvZ29vZ2xlLXRhZyc7XHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRUcmFja2VyTW9kdWxlIHtcclxuICBwdWJsaWMgYXBwc0ZseWVyOiBBcHBzRmx5ZXJTdWJtb2R1bGU7XHJcbiAgcHVibGljIGdvb2dsZVRhZzogR29vZ2xlVGFnU3VibW9kdWxlO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbW11bmljYXRvcjogR2FtZUNvbW11bmljYXRvcikge1xyXG4gICAgdGhpcy5hcHBzRmx5ZXIgPSBuZXcgQXBwc0ZseWVyU3VibW9kdWxlKHRoaXMuY29tbXVuaWNhdG9yKTtcclxuICAgIHRoaXMuZ29vZ2xlVGFnID0gbmV3IEdvb2dsZVRhZ1N1Ym1vZHVsZSh0aGlzLmNvbW11bmljYXRvcik7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIC8vIFRPRE86IHJldmlld1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsU2V0dGxlZChbdGhpcy5hcHBzRmx5ZXIuaW5pdGlhbGl6ZSgpLCB0aGlzLmdvb2dsZVRhZy5pbml0aWFsaXplKCldKS50aGVuKChkYXRhKSA9PlxyXG4gICAgICBkYXRhLmV2ZXJ5KChyZXN1bHQpID0+IHJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnICYmIHJlc3VsdC5zdGF0dXMpLFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBzd2l0Y2ggKG1lc3NhZ2Uuc3VibW9kdWxlKSB7XHJcbiAgICAgIGNhc2UgRXZlbnRUcmFja2VyTWVzc2FnZVN1Ym1vZHVsZS5BcHBzRmx5ZXI6XHJcbiAgICAgICAgdGhpcy5hcHBzRmx5ZXIucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEV2ZW50VHJhY2tlck1lc3NhZ2VTdWJtb2R1bGUuR29vZ2xlVGFnOlxyXG4gICAgICAgIHRoaXMuZ29vZ2xlVGFnLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQmFzZUNhbGxiYWNrQ3ljbGUsIFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IFJlcXVlc3RHb29nbGVUb2tlbkNhbGxiYWNrcywgUmVxdWVzdEdvb2dsZVRva2VuQ2FsbGJhY2tUeXBlIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBSZXF1ZXN0R29vZ2xlVG9rZW5DYWxsYmFja0N5Y2xlIGV4dGVuZHMgQmFzZUNhbGxiYWNrQ3ljbGU8UmVxdWVzdEdvb2dsZVRva2VuQ2FsbGJhY2tzPiB7XHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XHJcbiAgICAgIGNhc2UgUmVxdWVzdEdvb2dsZVRva2VuQ2FsbGJhY2tUeXBlLlN1Y2Nlc3M6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVTdWNjZXNzKG1lc3NhZ2UgYXMgUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlcjsgdG9rZW46IHN0cmluZyB9Pik7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIFJlcXVlc3RHb29nbGVUb2tlbkNhbGxiYWNrVHlwZS5FcnJvcjpcclxuICAgICAgICB0aGlzLmhhbmRsZUVycm9yKG1lc3NhZ2UgYXMgUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlcjsgZXJyb3I6IHVua25vd24gfT4pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVTdWNjZXNzKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZTx7IGlkOiBudW1iZXI7IHRva2VuOiBzdHJpbmcgfT4pIHtcclxuICAgIGlmICh0aGlzLmNhbGxiYWNrcz8ub25TdWNjZXNzKSB7XHJcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uU3VjY2VzcyhtZXNzYWdlLmRhdGEudG9rZW4pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVFcnJvcihtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyBlcnJvcjogdW5rbm93biB9Pikge1xyXG4gICAgaWYgKHRoaXMuY2FsbGJhY2tzPy5vbkVycm9yKSB7XHJcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uRXJyb3IobWVzc2FnZS5kYXRhLmVycm9yKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgUmVjZWl2ZWRNZXNzYWdlLCBNZXNzYWdlTW9kdWxlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5pbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XHJcblxyXG5pbXBvcnQgeyBBdXRoU2VudE1lc3NhZ2VFdmVudCwgUmVxdWVzdEdvb2dsZVRva2VuRGF0YSB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBSZXF1ZXN0R29vZ2xlVG9rZW5DYWxsYmFja0N5Y2xlIH0gZnJvbSAnLi9yZXF1ZXN0LWdvb2dsZS10b2tlbi1jYWxsYmFjay1jeWNsZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVxdWVzdEdvb2dsZVRva2VuTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBjeWNsZXMgPSBuZXcgTWFwPG51bWJlciwgUmVxdWVzdEdvb2dsZVRva2VuQ2FsbGJhY2tDeWNsZT4oKTtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XHJcblxyXG4gIHB1YmxpYyBhZGROZXcoZGF0YTogUmVxdWVzdEdvb2dsZVRva2VuRGF0YSkge1xyXG4gICAgY29uc3QgaWQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHRoaXMuY3ljbGVzLnNldChcclxuICAgICAgaWQsXHJcbiAgICAgIG5ldyBSZXF1ZXN0R29vZ2xlVG9rZW5DYWxsYmFja0N5Y2xlKHtcclxuICAgICAgICAuLi4oZGF0YT8uY2FsbGJhY2tzID8/IHt9KSxcclxuICAgICAgICBvbkRlc3Ryb3k6ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuaGFuZGxlRGVzdHJveUN5Y2xlKGlkKTtcclxuICAgICAgICAgIGRhdGEuY2FsbGJhY2tzLm9uRGVzdHJveT8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcclxuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLkF1dGgsXHJcbiAgICAgIGV2ZW50OiBBdXRoU2VudE1lc3NhZ2VFdmVudC5SZXF1ZXN0R29vZ2xlVG9rZW4sXHJcbiAgICAgIGRhdGE6IHsgaWQgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBpZDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBpZiAodGhpcy5jeWNsZXMuaGFzKG1lc3NhZ2UuZGF0YS5pZCkpIHtcclxuICAgICAgY29uc3QgY3ljbGUgPSB0aGlzLmN5Y2xlcy5nZXQobWVzc2FnZS5kYXRhLmlkKTtcclxuICAgICAgY3ljbGUucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVEZXN0cm95Q3ljbGUoY3ljbGVJZDogbnVtYmVyKSB7XHJcbiAgICB0aGlzLmN5Y2xlcy5kZWxldGUoY3ljbGVJZCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IEJhc2VDYWxsYmFja0N5Y2xlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBTdGF0ZURhdGEsIEluaXRpYWxpemVEYXRhQ2FsbGJhY2tzIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmNvbnN0IE1BWF9SRVRSWV9DT1VOVCA9IDEwO1xyXG5cclxuZXhwb3J0IGNsYXNzIEluaXRpYWxpemVEYXRhQ2FsbGJhY2tDeWNsZSBleHRlbmRzIEJhc2VDYWxsYmFja0N5Y2xlPEluaXRpYWxpemVEYXRhQ2FsbGJhY2tzPiB7XHJcbiAgcHJpdmF0ZSByZXRyeUNvdW50ID0gMDtcclxuICBwcml2YXRlIHJldHJ5VGltZW91dD86IE5vZGVKUy5UaW1lb3V0O1xyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgdGhpcy5oYW5kbGVSZWNlaXZlZE1lc3NhZ2UobWVzc2FnZSBhcyBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyByZXN1bHQ6IFN0YXRlRGF0YSB9Pik7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVJlY2VpdmVkTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyByZXN1bHQ6IFN0YXRlRGF0YSB9Pikge1xyXG4gICAgaWYgKCFtZXNzYWdlLmRhdGEucmVzdWx0LmRldmljZUlkKSB7XHJcbiAgICAgIGlmICh0aGlzLnJldHJ5Q291bnQgPCBNQVhfUkVUUllfQ09VTlQpIHtcclxuICAgICAgICB0aGlzLnJldHJ5VGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jYWxsYmFja3Mub25SZXRyeSgpO1xyXG4gICAgICAgIH0sIDUwMCk7XHJcblxyXG4gICAgICAgIHRoaXMucmV0cnlDb3VudCsrO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuY2FsbGJhY2tzPy5vbkVycm9yPy4oeyByZWFzb246ICdyZXRyeSBjb3VudCBleGNlZWRlZCcgfSk7XHJcbiAgICAgICAgdGhpcy5oYW5kbGVEZXN0cm95KCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmNhbGxiYWNrcz8ub25SZWNlaXZlZCkge1xyXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblJlY2VpdmVkKG1lc3NhZ2UuZGF0YS5yZXN1bHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGhhbmRsZURlc3Ryb3koKSB7XHJcbiAgICBpZiAodGhpcy5yZXRyeVRpbWVvdXQgIT09IHVuZGVmaW5lZCkgY2xlYXJUaW1lb3V0KHRoaXMucmV0cnlUaW1lb3V0KTtcclxuICAgIHN1cGVyLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgUmVjZWl2ZWRNZXNzYWdlLCBNZXNzYWdlTW9kdWxlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5pbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XHJcbmltcG9ydCB7IGxvZ01lc3NhZ2UgfSBmcm9tICdAL3V0aWxzJztcclxuXHJcbmltcG9ydCB7IEF1dGhTZW50TWVzc2FnZUV2ZW50LCBJbml0aWFsaXplRGF0YUNhbGxiYWNrcyB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBJbml0aWFsaXplRGF0YUNhbGxiYWNrQ3ljbGUgfSBmcm9tICcuL2luaXRpYWxpemUtZGF0YS1jYWxsYmFjay1jeWNsZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgSW5pdGlhbGl6ZU1hbmFnZXIge1xyXG4gIHByaXZhdGUgY3ljbGVzID0gbmV3IE1hcDxudW1iZXIsIEluaXRpYWxpemVEYXRhQ2FsbGJhY2tDeWNsZT4oKTtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XHJcblxyXG4gIHB1YmxpYyBhZGROZXcoZGF0YTogeyBjYWxsYmFja3M6IE9taXQ8SW5pdGlhbGl6ZURhdGFDYWxsYmFja3MsICdvblJldHJ5Jz4gfSkge1xyXG4gICAgY29uc3QgaWQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHRoaXMuY3ljbGVzLnNldChcclxuICAgICAgaWQsXHJcbiAgICAgIG5ldyBJbml0aWFsaXplRGF0YUNhbGxiYWNrQ3ljbGUoe1xyXG4gICAgICAgIC4uLihkYXRhPy5jYWxsYmFja3MgPz8ge30pLFxyXG4gICAgICAgIG9uUmV0cnk6ICgpID0+IHtcclxuICAgICAgICAgIGxvZ01lc3NhZ2UoWydSZXRyeSBnZXR0aW5nIHN0YXRlIGRhdGEgd2hpbGUgaW5pdCBhdXRoIG1vZHVsZSddLCBjb25zb2xlLndhcm4pO1xyXG4gICAgICAgICAgdGhpcy5yZXF1ZXN0U3RhdGVEYXRhKGlkKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uRGVzdHJveTogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5oYW5kbGVEZXN0cm95Q3ljbGUoaWQpO1xyXG4gICAgICAgICAgZGF0YS5jYWxsYmFja3Mub25EZXN0cm95Py4oKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5yZXF1ZXN0U3RhdGVEYXRhKGlkKTtcclxuXHJcbiAgICByZXR1cm4gaWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgaWYgKHRoaXMuY3ljbGVzLmhhcyhtZXNzYWdlLmRhdGEuaWQpKSB7XHJcbiAgICAgIGNvbnN0IGN5Y2xlID0gdGhpcy5jeWNsZXMuZ2V0KG1lc3NhZ2UuZGF0YS5pZCk7XHJcbiAgICAgIGN5Y2xlLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVxdWVzdFN0YXRlRGF0YShpZDogbnVtYmVyKSB7XHJcbiAgICB0aGlzLmNvbW11bmljYXRvci5wb3N0TWVzc2FnZSh7XHJcbiAgICAgIG1vZHVsZTogTWVzc2FnZU1vZHVsZS5BdXRoLFxyXG4gICAgICBldmVudDogQXV0aFNlbnRNZXNzYWdlRXZlbnQuUmVxdWVzdEluaXRpYWxEYXRhLFxyXG4gICAgICBkYXRhOiB7IGlkIH0sXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRGVzdHJveUN5Y2xlKGN5Y2xlSWQ6IG51bWJlcikge1xyXG4gICAgdGhpcy5jeWNsZXMuZGVsZXRlKGN5Y2xlSWQpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBCYXNlQ2FsbGJhY2tDeWNsZSwgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgQXV0aERhdGEsIEdldEF1dGhEYXRhQ2FsbGJhY2tzLCBHZXRBdXRoRGF0YUNhbGxiYWNrVHlwZSB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5leHBvcnQgY2xhc3MgR2V0QXV0aERhdGFDYWxsYmFja0N5Y2xlIGV4dGVuZHMgQmFzZUNhbGxiYWNrQ3ljbGU8R2V0QXV0aERhdGFDYWxsYmFja3M+IHtcclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcclxuICAgICAgY2FzZSBHZXRBdXRoRGF0YUNhbGxiYWNrVHlwZS5TdWNjZXNzOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlU3VjY2VzcyhtZXNzYWdlIGFzIFJlY2VpdmVkTWVzc2FnZTx7IGlkOiBudW1iZXIgfSAmIEF1dGhEYXRhPik7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIEdldEF1dGhEYXRhQ2FsbGJhY2tUeXBlLkVycm9yOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlRXJyb3IobWVzc2FnZSBhcyBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyBlcnJvcjogdW5rbm93biB9Pik7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVN1Y2Nlc3MobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlciB9ICYgQXV0aERhdGE+KSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uU3VjY2Vzcykge1xyXG4gICAgICBjb25zdCB7IGlkLCAuLi5hdXRoRGF0YSB9ID0gbWVzc2FnZS5kYXRhO1xyXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblN1Y2Nlc3MoYXV0aERhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVFcnJvcihtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyBlcnJvcjogdW5rbm93biB9Pikge1xyXG4gICAgaWYgKHRoaXMuY2FsbGJhY2tzPy5vbkVycm9yKSB7XHJcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uRXJyb3IobWVzc2FnZS5kYXRhLmVycm9yKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgUmVjZWl2ZWRNZXNzYWdlLCBNZXNzYWdlTW9kdWxlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5pbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XHJcblxyXG5pbXBvcnQgeyBBdXRoU2VudE1lc3NhZ2VFdmVudCwgR2V0QXV0aERhdGEgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgR2V0QXV0aERhdGFDYWxsYmFja0N5Y2xlIH0gZnJvbSAnLi9nZXQtYXV0aC1kYXRhLWNhbGxiYWNrLWN5Y2xlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBHZXRBdXRoRGF0YU1hbmFnZXIge1xyXG4gIHByaXZhdGUgY3ljbGVzID0gbmV3IE1hcDxudW1iZXIsIEdldEF1dGhEYXRhQ2FsbGJhY2tDeWNsZT4oKTtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XHJcblxyXG4gIHB1YmxpYyBhZGROZXcoZGF0YTogR2V0QXV0aERhdGEpIHtcclxuICAgIGNvbnN0IGlkID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgICB0aGlzLmN5Y2xlcy5zZXQoXHJcbiAgICAgIGlkLFxyXG4gICAgICBuZXcgR2V0QXV0aERhdGFDYWxsYmFja0N5Y2xlKHtcclxuICAgICAgICAuLi4oZGF0YT8uY2FsbGJhY2tzID8/IHt9KSxcclxuICAgICAgICBvbkRlc3Ryb3k6ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuaGFuZGxlRGVzdHJveUN5Y2xlKGlkKTtcclxuICAgICAgICAgIGRhdGEuY2FsbGJhY2tzLm9uRGVzdHJveT8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcclxuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLkF1dGgsXHJcbiAgICAgIGV2ZW50OiBBdXRoU2VudE1lc3NhZ2VFdmVudC5HZXRBdXRoRGF0YSxcclxuICAgICAgZGF0YTogeyBpZCB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGlkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIGlmICh0aGlzLmN5Y2xlcy5oYXMobWVzc2FnZS5kYXRhLmlkKSkge1xyXG4gICAgICBjb25zdCBjeWNsZSA9IHRoaXMuY3ljbGVzLmdldChtZXNzYWdlLmRhdGEuaWQpO1xyXG4gICAgICBjeWNsZS5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZURlc3Ryb3lDeWNsZShjeWNsZUlkOiBudW1iZXIpIHtcclxuICAgIHRoaXMuY3ljbGVzLmRlbGV0ZShjeWNsZUlkKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgQXV0aExpc3RlbmVycywgQXV0aExpc3RlbmVyc1JlY2VpdmVkRXZlbnRUeXBlLCBBdXRoRGF0YSB9IGZyb20gJy4uL21vZGVscyc7XHJcbmltcG9ydCB0eXBlIHsgR2V0QXV0aERhdGFNYW5hZ2VyIH0gZnJvbSAnLi4vZ2V0LWF1dGgtZGF0YSc7XHJcblxyXG5leHBvcnQgY2xhc3MgQXV0aExpc3RlbmVyc01hbmFnZXIge1xyXG4gIHByaXZhdGUgbGlzdGVuZXJzPzogQXV0aExpc3RlbmVycztcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBnZXRUb2tlbk1hbmFnZXI6IEdldEF1dGhEYXRhTWFuYWdlcikge31cclxuXHJcbiAgcHVibGljIGluaXRMaXN0ZW5lcnMobGlzdGVuZXJzOiBBdXRoTGlzdGVuZXJzKSB7XHJcbiAgICB0aGlzLmxpc3RlbmVycyA9IGxpc3RlbmVycztcclxuXHJcbiAgICB0aGlzLmdldFRva2VuTWFuYWdlci5hZGROZXcoe1xyXG4gICAgICBjYWxsYmFja3M6IHtcclxuICAgICAgICBvblN1Y2Nlc3M6IChkYXRhKSA9PiB7XHJcbiAgICAgICAgICBpZiAodGhpcy5saXN0ZW5lcnM/Lm9uSW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMub25Jbml0aWFsaXplZChkYXRhKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uRXJyb3I6ICgpID0+IHtcclxuICAgICAgICAgIGlmICh0aGlzLmxpc3RlbmVycz8ub25Jbml0aWFsaXplZCkge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5vbkluaXRpYWxpemVkKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XHJcbiAgICAgIGNhc2UgQXV0aExpc3RlbmVyc1JlY2VpdmVkRXZlbnRUeXBlLkF1dGhDaGFuZ2VTdGFydGVkOlxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RlbmVycz8ub25BdXRoQ2hhbmdlU3RhcnRlZCkge1xyXG4gICAgICAgICAgdGhpcy5saXN0ZW5lcnMub25BdXRoQ2hhbmdlU3RhcnRlZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBBdXRoTGlzdGVuZXJzUmVjZWl2ZWRFdmVudFR5cGUuQXV0aENoYW5nZUNvbXBsZXRlZDpcclxuICAgICAgICBpZiAodGhpcy5saXN0ZW5lcnM/Lm9uQXV0aENoYW5nZUNvbXBsZXRlZCkge1xyXG4gICAgICAgICAgY29uc3QgeyBpZCwgLi4uYXV0aERhdGEgfSA9IChtZXNzYWdlIGFzIFJlY2VpdmVkTWVzc2FnZTx7IGlkOiBudW1iZXIgfSAmIEF1dGhEYXRhPikuZGF0YTtcclxuICAgICAgICAgIHRoaXMubGlzdGVuZXJzLm9uQXV0aENoYW5nZUNvbXBsZXRlZChhdXRoRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEF1dGhMaXN0ZW5lcnNSZWNlaXZlZEV2ZW50VHlwZS5BdXRoQ2hhbmdlRmFpbGVkOlxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RlbmVycz8ub25BdXRoQ2hhbmdlRmFpbGVkKSB7XHJcbiAgICAgICAgICBjb25zdCBkYXRhID0gKG1lc3NhZ2UgYXMgUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlcjsgZXJyb3I/OiB1bmtub3duIH0+KS5kYXRhO1xyXG4gICAgICAgICAgdGhpcy5saXN0ZW5lcnMub25BdXRoQ2hhbmdlRmFpbGVkKGRhdGEuZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5pbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XHJcblxyXG5pbXBvcnQgeyBBdXRoUmVjZWl2ZWRNZXNzYWdlRXZlbnQsIFN0YXRlRGF0YSwgUmVxdWVzdEdvb2dsZVRva2VuRGF0YSwgQXV0aExpc3RlbmVycywgR2V0QXV0aERhdGEgfSBmcm9tICcuL21vZGVscyc7XHJcbmltcG9ydCB7IFJlcXVlc3RHb29nbGVUb2tlbk1hbmFnZXIgfSBmcm9tICcuL3JlcXVlc3QtZ29vZ2xlLXRva2VuJztcclxuaW1wb3J0IHsgSW5pdGlhbGl6ZU1hbmFnZXIgfSBmcm9tICcuL2luaXRpYWxpemUtZGF0YSc7XHJcbmltcG9ydCB7IEdldEF1dGhEYXRhTWFuYWdlciB9IGZyb20gJy4vZ2V0LWF1dGgtZGF0YSc7XHJcbmltcG9ydCB7IEF1dGhMaXN0ZW5lcnNNYW5hZ2VyIH0gZnJvbSAnLi9hdXRoLWxpc3RlbmVycyc7XHJcblxyXG5leHBvcnQgY2xhc3MgQXV0aE1vZHVsZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSByZXF1ZXN0R29vZ2xlVG9rZW5NYW5hZ2VyOiBSZXF1ZXN0R29vZ2xlVG9rZW5NYW5hZ2VyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZ2V0QXV0aERhdGFNYW5hZ2VyOiBHZXRBdXRoRGF0YU1hbmFnZXI7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBpbml0aWFsaXplTWFuYWdlcjogSW5pdGlhbGl6ZU1hbmFnZXI7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBhdXRoTGlzdGVuZXJzTWFuYWdlcjogQXV0aExpc3RlbmVyc01hbmFnZXI7XHJcblxyXG4gIHByaXZhdGUgc3RhdGVEYXRhPzogU3RhdGVEYXRhO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbW11bmljYXRvcjogR2FtZUNvbW11bmljYXRvcikge1xyXG4gICAgdGhpcy5yZXF1ZXN0R29vZ2xlVG9rZW5NYW5hZ2VyID0gbmV3IFJlcXVlc3RHb29nbGVUb2tlbk1hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xyXG4gICAgdGhpcy5nZXRBdXRoRGF0YU1hbmFnZXIgPSBuZXcgR2V0QXV0aERhdGFNYW5hZ2VyKHRoaXMuY29tbXVuaWNhdG9yKTtcclxuICAgIHRoaXMuaW5pdGlhbGl6ZU1hbmFnZXIgPSBuZXcgSW5pdGlhbGl6ZU1hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xyXG4gICAgdGhpcy5hdXRoTGlzdGVuZXJzTWFuYWdlciA9IG5ldyBBdXRoTGlzdGVuZXJzTWFuYWdlcih0aGlzLmdldEF1dGhEYXRhTWFuYWdlcik7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIHJldHVybiB0aGlzLmluaXRpYWxpemVEYXRhKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdEF1dGhMaXN0ZW5lcnMobGlzdGVuZXJzOiBBdXRoTGlzdGVuZXJzKSB7XHJcbiAgICB0aGlzLmF1dGhMaXN0ZW5lcnNNYW5hZ2VyLmluaXRMaXN0ZW5lcnMobGlzdGVuZXJzKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgaXNHb29nbGVBdmFpbGFibGUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdGF0ZURhdGE/LmlzR29vZ2xlQXZhaWxhYmxlID8/IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBkZXZpY2VJZCgpIHtcclxuICAgIHJldHVybiB0aGlzLnN0YXRlRGF0YT8uZGV2aWNlSWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVxdWVzdEdvb2dsZVRva2VuKGRhdGE6IFJlcXVlc3RHb29nbGVUb2tlbkRhdGEpIHtcclxuICAgIHRoaXMucmVxdWVzdEdvb2dsZVRva2VuTWFuYWdlci5hZGROZXcoZGF0YSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0QXV0aERhdGEoZGF0YTogR2V0QXV0aERhdGEpIHtcclxuICAgIHRoaXMuZ2V0QXV0aERhdGFNYW5hZ2VyLmFkZE5ldyhkYXRhKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBzd2l0Y2ggKG1lc3NhZ2UuZXZlbnQpIHtcclxuICAgICAgY2FzZSBBdXRoUmVjZWl2ZWRNZXNzYWdlRXZlbnQuU3RhdGVEYXRhOlxyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZU1hbmFnZXIucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgICAgIGlmICgncmVzdWx0JyBpbiBtZXNzYWdlLmRhdGEpIHtcclxuICAgICAgICAgIHRoaXMuaGFuZGxlUmVjZWl2ZWRTdGF0ZURhdGEobWVzc2FnZS5kYXRhLnJlc3VsdCBhcyBTdGF0ZURhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBBdXRoUmVjZWl2ZWRNZXNzYWdlRXZlbnQuUmVxdWVzdEdvb2dsZVRva2VuOlxyXG4gICAgICAgIHRoaXMucmVxdWVzdEdvb2dsZVRva2VuTWFuYWdlci5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgQXV0aFJlY2VpdmVkTWVzc2FnZUV2ZW50LkdldEF1dGhEYXRhOlxyXG4gICAgICAgIHRoaXMuZ2V0QXV0aERhdGFNYW5hZ2VyLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBBdXRoUmVjZWl2ZWRNZXNzYWdlRXZlbnQuQXV0aExpc3RlbmVyczpcclxuICAgICAgICB0aGlzLmF1dGhMaXN0ZW5lcnNNYW5hZ2VyLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlUmVjZWl2ZWRTdGF0ZURhdGEoZGF0YTogU3RhdGVEYXRhKSB7XHJcbiAgICB0aGlzLnN0YXRlRGF0YSA9IGRhdGE7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGluaXRpYWxpemVEYXRhKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXNvbHZlKSA9PiB7XHJcbiAgICAgIHRoaXMuaW5pdGlhbGl6ZU1hbmFnZXIuYWRkTmV3KHtcclxuICAgICAgICBjYWxsYmFja3M6IHtcclxuICAgICAgICAgIG9uUmVjZWl2ZWQ6ICgpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBvbkVycm9yOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoZmFsc2UpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XG5cbmltcG9ydCB7IE1lc3NhZ2VNb2R1bGUgfSBmcm9tICdAL21vZGVscyc7XG5cbmltcG9ydCB7IEdhbWVFdmVudHNTZW50TWVzc2FnZUV2ZW50LCBHYW1lU3RlcFR5cGUgfSBmcm9tICcuL21vZGVscyc7XG5cbmV4cG9ydCBjbGFzcyBHYW1lRXZlbnRzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XG5cbiAgcHVibGljIHNlbmRHYW1lU3RlcChzdGVwOiBHYW1lU3RlcFR5cGUsIHRpbWVzdGFtcDogc3RyaW5nIHwgbnVtYmVyKSB7XG4gICAgY29uc3QgdGltZVN0YW1wTWlsbGlzZWNvbmRzID0gdHlwZW9mIHRpbWVzdGFtcCA9PT0gJ3N0cmluZycgPyBwYXJzZUludCh0aW1lc3RhbXApIDogdGltZXN0YW1wO1xuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcbiAgICAgIG1vZHVsZTogTWVzc2FnZU1vZHVsZS5HYW1lRXZlbnRzLFxuICAgICAgZXZlbnQ6IEdhbWVFdmVudHNTZW50TWVzc2FnZUV2ZW50LkdhbWVTdGVwLFxuICAgICAgZGF0YToge1xuICAgICAgICBpZDogRGF0ZS5ub3coKSxcbiAgICAgICAgc3RlcCxcbiAgICAgICAgdGltZXN0YW1wOiB0aW1lU3RhbXBNaWxsaXNlY29uZHMsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBCYXNlQ2FsbGJhY2tDeWNsZSwgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgU3RhdGVEYXRhLCBJbml0aWFsaXplRGF0YUNhbGxiYWNrcyB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5leHBvcnQgY2xhc3MgSW5pdGlhbGl6ZURhdGFDYWxsYmFja0N5Y2xlIGV4dGVuZHMgQmFzZUNhbGxiYWNrQ3ljbGU8SW5pdGlhbGl6ZURhdGFDYWxsYmFja3M+IHtcclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgdGhpcy5oYW5kbGVSZWNlaXZlZE1lc3NhZ2UobWVzc2FnZSBhcyBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyByZXN1bHQ6IFN0YXRlRGF0YSB9Pik7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVJlY2VpdmVkTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyByZXN1bHQ6IFN0YXRlRGF0YSB9Pikge1xyXG4gICAgaWYgKHRoaXMuY2FsbGJhY2tzPy5vblJlY2VpdmVkKSB7XHJcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uUmVjZWl2ZWQobWVzc2FnZS5kYXRhLnJlc3VsdCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5oYW5kbGVEZXN0cm95KCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFJlY2VpdmVkTWVzc2FnZSwgTWVzc2FnZU1vZHVsZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJ0AvZ2FtZS1jb21tdW5pY2F0b3InO1xyXG5cclxuaW1wb3J0IHsgU2V0dGluZ3NTZW50TWVzc2FnZUV2ZW50LCBJbml0aWFsaXplRGF0YUNhbGxiYWNrcyB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBJbml0aWFsaXplRGF0YUNhbGxiYWNrQ3ljbGUgfSBmcm9tICcuL2luaXRpYWxpemUtZGF0YS1jYWxsYmFjay1jeWNsZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgSW5pdGlhbGl6ZU1hbmFnZXIge1xyXG4gIHByaXZhdGUgY3ljbGVzID0gbmV3IE1hcDxudW1iZXIsIEluaXRpYWxpemVEYXRhQ2FsbGJhY2tDeWNsZT4oKTtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XHJcblxyXG4gIHB1YmxpYyBhZGROZXcoZGF0YTogeyBjYWxsYmFja3M6IEluaXRpYWxpemVEYXRhQ2FsbGJhY2tzIH0pIHtcclxuICAgIGNvbnN0IGlkID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgICB0aGlzLmN5Y2xlcy5zZXQoXHJcbiAgICAgIGlkLFxyXG4gICAgICBuZXcgSW5pdGlhbGl6ZURhdGFDYWxsYmFja0N5Y2xlKHtcclxuICAgICAgICAuLi4oZGF0YT8uY2FsbGJhY2tzID8/IHt9KSxcclxuICAgICAgICBvbkRlc3Ryb3k6ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuaGFuZGxlRGVzdHJveUN5Y2xlKGlkKTtcclxuICAgICAgICAgIGRhdGEuY2FsbGJhY2tzLm9uRGVzdHJveT8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcclxuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLlNldHRpbmdzLFxyXG4gICAgICBldmVudDogU2V0dGluZ3NTZW50TWVzc2FnZUV2ZW50LlJlcXVlc3RJbml0aWFsRGF0YSxcclxuICAgICAgZGF0YTogeyBpZCB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGlkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIGlmICh0aGlzLmN5Y2xlcy5oYXMobWVzc2FnZS5kYXRhLmlkKSkge1xyXG4gICAgICBjb25zdCBjeWNsZSA9IHRoaXMuY3ljbGVzLmdldChtZXNzYWdlLmRhdGEuaWQpO1xyXG4gICAgICBjeWNsZS5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZURlc3Ryb3lDeWNsZShjeWNsZUlkOiBudW1iZXIpIHtcclxuICAgIHRoaXMuY3ljbGVzLmRlbGV0ZShjeWNsZUlkKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQmFzZUNhbGxiYWNrQ3ljbGUsIFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IFJlcXVlc3RDaGFuZ2VMYW5ndWFnZUNhbGxiYWNrcywgUmVxdWVzdENoYW5nZUxhbmd1YWdlQ2FsbGJhY2tUeXBlLCBMYW5ndWFnZVR5cGUgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5leHBvcnQgY2xhc3MgUmVxdWVzdENoYW5nZUxhbmd1YWdlQ2FsbGJhY2tDeWNsZSBleHRlbmRzIEJhc2VDYWxsYmFja0N5Y2xlPFJlcXVlc3RDaGFuZ2VMYW5ndWFnZUNhbGxiYWNrcz4ge1xyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xyXG4gICAgICBjYXNlIFJlcXVlc3RDaGFuZ2VMYW5ndWFnZUNhbGxiYWNrVHlwZS5TdWNjZXNzOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlU3VjY2VzcyhtZXNzYWdlIGFzIFJlY2VpdmVkTWVzc2FnZTx7IGlkOiBudW1iZXI7IGxhbmd1YWdlOiBMYW5ndWFnZVR5cGUgfT4pO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBSZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2VDYWxsYmFja1R5cGUuRXJyb3I6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVFcnJvcihtZXNzYWdlKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlU3VjY2VzcyhtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyBsYW5ndWFnZTogTGFuZ3VhZ2VUeXBlIH0+KSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uU3VjY2Vzcykge1xyXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblN1Y2Nlc3MobWVzc2FnZS5kYXRhLmxhbmd1YWdlKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRXJyb3IobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uRXJyb3IpIHtcclxuICAgICAgdGhpcy5jYWxsYmFja3Mub25FcnJvcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBSZWNlaXZlZE1lc3NhZ2UsIE1lc3NhZ2VNb2R1bGUgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IFNldHRpbmdzU2VudE1lc3NhZ2VFdmVudCwgUmVxdWVzdENoYW5nZUxhbmd1YWdlRGF0YSB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBSZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2VDYWxsYmFja0N5Y2xlIH0gZnJvbSAnLi9yZXF1ZXN0LWNoYW5nZS1sYW5ndWFnZS1jYWxsYmFjay1jeWNsZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVxdWVzdENoYW5nZUxhbmd1YWdlTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBjeWNsZXMgPSBuZXcgTWFwPG51bWJlciwgUmVxdWVzdENoYW5nZUxhbmd1YWdlQ2FsbGJhY2tDeWNsZT4oKTtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XHJcblxyXG4gIHB1YmxpYyBhZGROZXcoZGF0YTogUmVxdWVzdENoYW5nZUxhbmd1YWdlRGF0YSkge1xyXG4gICAgY29uc3QgaWQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHRoaXMuY3ljbGVzLnNldChcclxuICAgICAgaWQsXHJcbiAgICAgIG5ldyBSZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2VDYWxsYmFja0N5Y2xlKHtcclxuICAgICAgICAuLi4oZGF0YT8uY2FsbGJhY2tzID8/IHt9KSxcclxuICAgICAgICBvbkRlc3Ryb3k6ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuaGFuZGxlRGVzdHJveUN5Y2xlKGlkKTtcclxuICAgICAgICAgIGRhdGEuY2FsbGJhY2tzLm9uRGVzdHJveT8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcclxuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLlNldHRpbmdzLFxyXG4gICAgICBldmVudDogU2V0dGluZ3NTZW50TWVzc2FnZUV2ZW50LlJlcXVlc3RDaGFuZ2VMYW5ndWFnZSxcclxuICAgICAgZGF0YTogeyBpZCwgbGFuZ3VhZ2U6IGRhdGEubmV3TGFuZ3VhZ2UgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBpZDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBpZiAodGhpcy5jeWNsZXMuaGFzKG1lc3NhZ2UuZGF0YS5pZCkpIHtcclxuICAgICAgY29uc3QgY3ljbGUgPSB0aGlzLmN5Y2xlcy5nZXQobWVzc2FnZS5kYXRhLmlkKTtcclxuICAgICAgY3ljbGUucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVEZXN0cm95Q3ljbGUoY3ljbGVJZDogbnVtYmVyKSB7XHJcbiAgICB0aGlzLmN5Y2xlcy5kZWxldGUoY3ljbGVJZCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJ0AvZ2FtZS1jb21tdW5pY2F0b3InO1xyXG5cclxuaW1wb3J0IHsgTGFuZ3VhZ2VMaXN0ZW5lcnMsIExhbmd1YWdlVHlwZSwgU2V0dGluZ3NSZWNlaXZlZE1lc3NhZ2VFdmVudCB9IGZyb20gJy4uL21vZGVscyc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2V0dGluZ3NMaXN0ZW5lcnNNYW5hZ2VyIHtcclxuICBwcml2YXRlIGxpc3RlbmVycz86IExhbmd1YWdlTGlzdGVuZXJzO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbW11bmljYXRvcjogR2FtZUNvbW11bmljYXRvcikge31cclxuXHJcbiAgcHVibGljIGluaXRMaXN0ZW5lcnMobGlzdGVuZXJzOiBMYW5ndWFnZUxpc3RlbmVycykge1xyXG4gICAgdGhpcy5saXN0ZW5lcnMgPSBsaXN0ZW5lcnM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgc3dpdGNoIChtZXNzYWdlLmV2ZW50KSB7XHJcbiAgICAgIGNhc2UgU2V0dGluZ3NSZWNlaXZlZE1lc3NhZ2VFdmVudC5MYW5ndWFnZUNoYW5nZWQ6IHtcclxuICAgICAgICBpZiAodGhpcy5saXN0ZW5lcnM/Lm9uTGFuZ3VhZ2VDaGFuZ2VkKSB7XHJcbiAgICAgICAgICB0aGlzLmxpc3RlbmVycy5vbkxhbmd1YWdlQ2hhbmdlZCgobWVzc2FnZSBhcyBSZWNlaXZlZE1lc3NhZ2U8eyBpZDogbnVtYmVyOyBsYW5ndWFnZTogTGFuZ3VhZ2VUeXBlIH0+KS5kYXRhPy5sYW5ndWFnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJ0AvZ2FtZS1jb21tdW5pY2F0b3InO1xyXG5cclxuaW1wb3J0IHsgU2V0dGluZ3NSZWNlaXZlZE1lc3NhZ2VFdmVudCwgU3RhdGVEYXRhLCBSZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2VEYXRhLCBMYW5ndWFnZUxpc3RlbmVycyB9IGZyb20gJy4vbW9kZWxzJztcclxuaW1wb3J0IHsgSW5pdGlhbGl6ZU1hbmFnZXIgfSBmcm9tICcuL2luaXRpYWxpemUtZGF0YSc7XHJcbmltcG9ydCB7IFJlcXVlc3RDaGFuZ2VMYW5ndWFnZU1hbmFnZXIgfSBmcm9tICcuL3JlcXVlc3QtY2hhbmdlLWxhbmd1YWdlJztcclxuaW1wb3J0IHsgU2V0dGluZ3NMaXN0ZW5lcnNNYW5hZ2VyIH0gZnJvbSAnLi9zZXR0aW5ncy1saXN0ZW5lcnMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNldHRpbmdzTW9kdWxlIHtcclxuICBwcml2YXRlIHJlcXVlc3RDaGFuZ2VMYW5ndWFnZU1hbmFnZXI6IFJlcXVlc3RDaGFuZ2VMYW5ndWFnZU1hbmFnZXI7XHJcbiAgcHJpdmF0ZSBpbml0aWFsaXplTWFuYWdlcjogSW5pdGlhbGl6ZU1hbmFnZXI7XHJcbiAgcHJpdmF0ZSBzZXR0aW5nc0xpc3RlbmVyc01hbmFnZXI6IFNldHRpbmdzTGlzdGVuZXJzTWFuYWdlcjtcclxuXHJcbiAgcHJpdmF0ZSBzdGF0ZURhdGE/OiBTdGF0ZURhdGE7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7XHJcbiAgICB0aGlzLnJlcXVlc3RDaGFuZ2VMYW5ndWFnZU1hbmFnZXIgPSBuZXcgUmVxdWVzdENoYW5nZUxhbmd1YWdlTWFuYWdlcih0aGlzLmNvbW11bmljYXRvcik7XHJcbiAgICB0aGlzLmluaXRpYWxpemVNYW5hZ2VyID0gbmV3IEluaXRpYWxpemVNYW5hZ2VyKHRoaXMuY29tbXVuaWNhdG9yKTtcclxuICAgIHRoaXMuc2V0dGluZ3NMaXN0ZW5lcnNNYW5hZ2VyID0gbmV3IFNldHRpbmdzTGlzdGVuZXJzTWFuYWdlcih0aGlzLmNvbW11bmljYXRvcik7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIHJldHVybiB0aGlzLmluaXRpYWxpemVEYXRhKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdExpc3RlbmVycyhsaXN0ZW5lcnM6IExhbmd1YWdlTGlzdGVuZXJzKSB7XHJcbiAgICB0aGlzLnNldHRpbmdzTGlzdGVuZXJzTWFuYWdlci5pbml0TGlzdGVuZXJzKGxpc3RlbmVycyk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGxhbmd1YWdlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc3RhdGVEYXRhPy5sYW5ndWFnZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2UoZGF0YTogUmVxdWVzdENoYW5nZUxhbmd1YWdlRGF0YSkge1xyXG4gICAgdGhpcy5yZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2VNYW5hZ2VyLmFkZE5ldyhkYXRhKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBzd2l0Y2ggKG1lc3NhZ2UuZXZlbnQpIHtcclxuICAgICAgY2FzZSBTZXR0aW5nc1JlY2VpdmVkTWVzc2FnZUV2ZW50LlN0YXRlRGF0YTpcclxuICAgICAgICB0aGlzLmluaXRpYWxpemVNYW5hZ2VyLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICBpZiAoJ3Jlc3VsdCcgaW4gbWVzc2FnZS5kYXRhKSB7XHJcbiAgICAgICAgICB0aGlzLmhhbmRsZVJlY2VpdmVkU3RhdGVEYXRhKG1lc3NhZ2UuZGF0YS5yZXN1bHQgYXMgU3RhdGVEYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgU2V0dGluZ3NSZWNlaXZlZE1lc3NhZ2VFdmVudC5SZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2U6XHJcbiAgICAgICAgdGhpcy5yZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2VNYW5hZ2VyLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBTZXR0aW5nc1JlY2VpdmVkTWVzc2FnZUV2ZW50Lkxhbmd1YWdlQ2hhbmdlZDpcclxuICAgICAgICB0aGlzLnNldHRpbmdzTGlzdGVuZXJzTWFuYWdlci5wYXJzZU1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVJlY2VpdmVkU3RhdGVEYXRhKGRhdGE6IFN0YXRlRGF0YSkge1xyXG4gICAgdGhpcy5zdGF0ZURhdGEgPSBkYXRhO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpbml0aWFsaXplRGF0YSgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSkgPT4ge1xyXG4gICAgICB0aGlzLmluaXRpYWxpemVNYW5hZ2VyLmFkZE5ldyh7XHJcbiAgICAgICAgY2FsbGJhY2tzOiB7XHJcbiAgICAgICAgICBvblJlY2VpdmVkOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgb25FcnJvcjogKCkgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKGZhbHNlKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgTWVzc2FnZU1vZHVsZSwgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnQC9tb2RlbHMnO1xuaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJ0AvZ2FtZS1jb21tdW5pY2F0b3InO1xuXG5pbXBvcnQge1xuICBTdG9yZVJlY2VpdmVkTWVzc2FnZUV2ZW50LFxuICB0eXBlIFN0b3JlTGlzdGVuZXJzLFxuICB0eXBlIE9wZW5TdG9yZVJlcXVlc3RQYXlsb2FkLFxuICBTdG9yZVNlbnRNZXNzYWdlRXZlbnQsXG4gIFN0b3JlU2VudE1lc3NhZ2VFdmVudFR5cGUsXG4gIFVwZGF0ZVdhbGxldENvaW5zRGF0YSxcbn0gZnJvbSAnLi4vbW9kZWxzJztcblxuZXhwb3J0IGNsYXNzIFN0b3JlTGlzdGVuZXJzTWFuYWdlciB7XG4gIHByaXZhdGUgbGlzdGVuZXJzPzogU3RvcmVMaXN0ZW5lcnM7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHt9XG5cbiAgcHVibGljIGluaXRMaXN0ZW5lcnMobGlzdGVuZXJzOiBTdG9yZUxpc3RlbmVycykge1xuICAgIHRoaXMubGlzdGVuZXJzID0gbGlzdGVuZXJzO1xuICB9XG5cbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcbiAgICBzd2l0Y2ggKG1lc3NhZ2UuZXZlbnQpIHtcbiAgICAgIGNhc2UgU3RvcmVSZWNlaXZlZE1lc3NhZ2VFdmVudC5PcGVuU3RvcmVSZXF1ZXN0OiB7XG4gICAgICAgIGlmICh0aGlzLmxpc3RlbmVycz8ub25PcGVuU3RvcmVSZXF1ZXN0ZWQpIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gKG1lc3NhZ2UgYXMgUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlciB9ICYgT3BlblN0b3JlUmVxdWVzdFBheWxvYWQ+KS5kYXRhO1xuXG4gICAgICAgICAgdGhpcy5saXN0ZW5lcnMub25PcGVuU3RvcmVSZXF1ZXN0ZWQoe1xuICAgICAgICAgICAgcGFnZVR5cGU6IGRhdGEucGFnZVR5cGUsXG4gICAgICAgICAgICBpdGVtSWQ6IGRhdGEuaXRlbUlkLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdGhpcy5yZXNwb25zZVdpdGhTdWNjZXNzKFN0b3JlU2VudE1lc3NhZ2VFdmVudC5PcGVuU3RvcmVSZXF1ZXN0LCBtZXNzYWdlLmRhdGEuaWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMucmVzcG9uc2VXaXRoRXJyb3IoU3RvcmVTZW50TWVzc2FnZUV2ZW50Lk9wZW5TdG9yZVJlcXVlc3QsIG1lc3NhZ2UuZGF0YS5pZCwge1xuICAgICAgICAgICAgbWVzc2FnZTogJ2xpc3RlbmVycy5vbk9wZW5TdG9yZVJlcXVlc3RlZCBpcyBub3QgZGVmaW5lZCcsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgU3RvcmVSZWNlaXZlZE1lc3NhZ2VFdmVudC5VcGRhdGVXYWxsZXRDb2luczoge1xuICAgICAgICBpZiAodGhpcy5saXN0ZW5lcnM/Lm9uVXBkYXRlV2FsbGV0Q29pbnMpIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gKG1lc3NhZ2UgYXMgUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlciB9ICYgVXBkYXRlV2FsbGV0Q29pbnNEYXRhPikuZGF0YTtcblxuICAgICAgICAgIHRoaXMubGlzdGVuZXJzLm9uVXBkYXRlV2FsbGV0Q29pbnMoeyBjb2luczogZGF0YS5jb2lucyB9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlc3BvbnNlV2l0aEVycm9yKGV2ZW50OiBTdG9yZVNlbnRNZXNzYWdlRXZlbnQsIG1lc3NhZ2VJZDogbnVtYmVyLCBlcnJvcjogdW5rbm93bikge1xuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcbiAgICAgIG1vZHVsZTogTWVzc2FnZU1vZHVsZS5TdG9yZSxcbiAgICAgIGV2ZW50OiBldmVudCxcbiAgICAgIHR5cGU6IFN0b3JlU2VudE1lc3NhZ2VFdmVudFR5cGUuRXJyb3IsXG4gICAgICBkYXRhOiB7IGlkOiBtZXNzYWdlSWQsIGVycm9yIH0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlc3BvbnNlV2l0aFN1Y2Nlc3MoZXZlbnQ6IFN0b3JlU2VudE1lc3NhZ2VFdmVudCwgbWVzc2FnZUlkOiBudW1iZXIpIHtcbiAgICB0aGlzLmNvbW11bmljYXRvci5wb3N0TWVzc2FnZSh7XG4gICAgICBtb2R1bGU6IE1lc3NhZ2VNb2R1bGUuU3RvcmUsXG4gICAgICBldmVudDogZXZlbnQsXG4gICAgICB0eXBlOiBTdG9yZVNlbnRNZXNzYWdlRXZlbnRUeXBlLlN1Y2Nlc3MsXG4gICAgICBkYXRhOiB7IGlkOiBtZXNzYWdlSWQgfSxcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgQmFzZUNhbGxiYWNrQ3ljbGUsIFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IFN0YXRlRGF0YSwgSW5pdGlhbGl6ZURhdGFDYWxsYmFja3MgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEluaXRpYWxpemVEYXRhQ2FsbGJhY2tDeWNsZSBleHRlbmRzIEJhc2VDYWxsYmFja0N5Y2xlPEluaXRpYWxpemVEYXRhQ2FsbGJhY2tzPiB7XHJcbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcclxuICAgIHRoaXMuaGFuZGxlUmVjZWl2ZWRNZXNzYWdlKG1lc3NhZ2UgYXMgUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlcjsgcmVzdWx0OiBTdGF0ZURhdGEgfT4pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVSZWNlaXZlZE1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlPHsgaWQ6IG51bWJlcjsgcmVzdWx0OiBTdGF0ZURhdGEgfT4pIHtcclxuICAgIGlmICh0aGlzLmNhbGxiYWNrcz8ub25SZWNlaXZlZCkge1xyXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblJlY2VpdmVkKG1lc3NhZ2UuZGF0YS5yZXN1bHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGFuZGxlRGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBSZWNlaXZlZE1lc3NhZ2UsIE1lc3NhZ2VNb2R1bGUgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IEluaXRpYWxpemVEYXRhQ2FsbGJhY2tzLCBTdG9yZVNlbnRNZXNzYWdlRXZlbnQgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgSW5pdGlhbGl6ZURhdGFDYWxsYmFja0N5Y2xlIH0gZnJvbSAnLi9pbml0aWFsaXplLWRhdGEtY2FsbGJhY2stY3ljbGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEluaXRpYWxpemVNYW5hZ2VyIHtcclxuICBwcml2YXRlIGN5Y2xlcyA9IG5ldyBNYXA8bnVtYmVyLCBJbml0aWFsaXplRGF0YUNhbGxiYWNrQ3ljbGU+KCk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7fVxyXG5cclxuICBwdWJsaWMgYWRkTmV3KGRhdGE6IHsgY2FsbGJhY2tzOiBJbml0aWFsaXplRGF0YUNhbGxiYWNrcyB9KSB7XHJcbiAgICBjb25zdCBpZCA9IERhdGUubm93KCk7XHJcblxyXG4gICAgdGhpcy5jeWNsZXMuc2V0KFxyXG4gICAgICBpZCxcclxuICAgICAgbmV3IEluaXRpYWxpemVEYXRhQ2FsbGJhY2tDeWNsZSh7XHJcbiAgICAgICAgLi4uKGRhdGE/LmNhbGxiYWNrcyA/PyB7fSksXHJcbiAgICAgICAgb25EZXN0cm95OiAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLmhhbmRsZURlc3Ryb3lDeWNsZShpZCk7XHJcbiAgICAgICAgICBkYXRhLmNhbGxiYWNrcy5vbkRlc3Ryb3k/LigpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLmNvbW11bmljYXRvci5wb3N0TWVzc2FnZSh7XHJcbiAgICAgIG1vZHVsZTogTWVzc2FnZU1vZHVsZS5TdG9yZSxcclxuICAgICAgZXZlbnQ6IFN0b3JlU2VudE1lc3NhZ2VFdmVudC5SZXF1ZXN0SW5pdGlhbERhdGEsXHJcbiAgICAgIGRhdGE6IHsgaWQgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBpZDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICBpZiAodGhpcy5jeWNsZXMuaGFzKG1lc3NhZ2UuZGF0YS5pZCkpIHtcclxuICAgICAgY29uc3QgY3ljbGUgPSB0aGlzLmN5Y2xlcy5nZXQobWVzc2FnZS5kYXRhLmlkKTtcclxuICAgICAgY3ljbGUucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYW5kbGVEZXN0cm95Q3ljbGUoY3ljbGVJZDogbnVtYmVyKSB7XHJcbiAgICB0aGlzLmN5Y2xlcy5kZWxldGUoY3ljbGVJZCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IE1lc3NhZ2VNb2R1bGUgfSBmcm9tICdAL21vZGVscyc7XG5pbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XG5cbmltcG9ydCB7IFN0b3JlU2VudE1lc3NhZ2VFdmVudCwgVXBkYXRlV2FsbGV0Q29pbnNEYXRhIH0gZnJvbSAnLi4vbW9kZWxzJztcblxuZXhwb3J0IGNsYXNzIFVwZGF0ZVdhbGxldENvaW5zTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7fVxuXG4gIHB1YmxpYyBhZGROZXcoZGF0YTogVXBkYXRlV2FsbGV0Q29pbnNEYXRhKSB7XG4gICAgY29uc3QgaWQgPSBEYXRlLm5vdygpO1xuXG4gICAgdGhpcy5jb21tdW5pY2F0b3IucG9zdE1lc3NhZ2Uoe1xuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLlN0b3JlLFxuICAgICAgZXZlbnQ6IFN0b3JlU2VudE1lc3NhZ2VFdmVudC5VcGRhdGVXYWxsZXRDb2lucyxcbiAgICAgIGRhdGE6IHsgaWQsIGNvaW5zOiBkYXRhLmNvaW5zIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cbn1cbiIsImltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcbmltcG9ydCB7IFJlY2VpdmVkTWVzc2FnZSB9IGZyb20gJ0AvbW9kZWxzJztcblxuaW1wb3J0IHsgU3RvcmVMaXN0ZW5lcnNNYW5hZ2VyIH0gZnJvbSAnLi9zdG9yZS1saXN0ZW5lcnMnO1xuaW1wb3J0IHsgU3RvcmVMaXN0ZW5lcnMsIFN0b3JlUmVjZWl2ZWRNZXNzYWdlRXZlbnQsIFN0YXRlRGF0YSwgVXBkYXRlV2FsbGV0Q29pbnNEYXRhIH0gZnJvbSAnLi9tb2RlbHMnO1xuaW1wb3J0IHsgSW5pdGlhbGl6ZU1hbmFnZXIgfSBmcm9tICcuL2luaXRpYWxpemUtZGF0YSc7XG5pbXBvcnQgeyBVcGRhdGVXYWxsZXRDb2luc01hbmFnZXIgfSBmcm9tICdAL21vZHVsZXMvc3RvcmUvcmVxdWVzdC11cGRhdGUtd2FsbGV0LWNvaW5zJztcblxuZXhwb3J0IGNsYXNzIFN0b3JlTW9kdWxlIHtcbiAgcHJpdmF0ZSBzdG9yZUxpc3RlbmVyc01hbmFnZXI6IFN0b3JlTGlzdGVuZXJzTWFuYWdlcjtcbiAgcHJpdmF0ZSBpbml0aWFsaXplTWFuYWdlcjogSW5pdGlhbGl6ZU1hbmFnZXI7XG4gIHByaXZhdGUgdXBkYXRlV2FsbGV0Q29pbnNNYW5hZ2VyOiBVcGRhdGVXYWxsZXRDb2luc01hbmFnZXI7XG5cbiAgcHJpdmF0ZSBzdGF0ZURhdGE/OiBTdGF0ZURhdGE7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21tdW5pY2F0b3I6IEdhbWVDb21tdW5pY2F0b3IpIHtcbiAgICB0aGlzLnN0b3JlTGlzdGVuZXJzTWFuYWdlciA9IG5ldyBTdG9yZUxpc3RlbmVyc01hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZU1hbmFnZXIgPSBuZXcgSW5pdGlhbGl6ZU1hbmFnZXIodGhpcy5jb21tdW5pY2F0b3IpO1xuICAgIHRoaXMudXBkYXRlV2FsbGV0Q29pbnNNYW5hZ2VyID0gbmV3IFVwZGF0ZVdhbGxldENvaW5zTWFuYWdlcih0aGlzLmNvbW11bmljYXRvcik7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGxpbmtzKCk6IFN0YXRlRGF0YVsnbGlua3MnXSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGVEYXRhLmxpbmtzO1xuICB9XG5cbiAgcHVibGljIGluaXRpYWxpemUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZURhdGEoKTtcbiAgfVxuXG4gIHB1YmxpYyBpbml0TGlzdGVuZXJzKGxpc3RlbmVyczogU3RvcmVMaXN0ZW5lcnMpIHtcbiAgICB0aGlzLnN0b3JlTGlzdGVuZXJzTWFuYWdlci5pbml0TGlzdGVuZXJzKGxpc3RlbmVycyk7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlV2FsbGV0Q29pbnMoZGF0YTogVXBkYXRlV2FsbGV0Q29pbnNEYXRhKSB7XG4gICAgdGhpcy51cGRhdGVXYWxsZXRDb2luc01hbmFnZXIuYWRkTmV3KGRhdGEpO1xuICB9XG5cbiAgcHVibGljIHBhcnNlTWVzc2FnZShtZXNzYWdlOiBSZWNlaXZlZE1lc3NhZ2UpIHtcbiAgICBzd2l0Y2ggKG1lc3NhZ2UuZXZlbnQpIHtcbiAgICAgIGNhc2UgU3RvcmVSZWNlaXZlZE1lc3NhZ2VFdmVudC5TdGF0ZURhdGE6XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZU1hbmFnZXIucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICBpZiAoJ3Jlc3VsdCcgaW4gbWVzc2FnZS5kYXRhKSB7XG4gICAgICAgICAgdGhpcy5oYW5kbGVSZWNlaXZlZFN0YXRlRGF0YShtZXNzYWdlLmRhdGEucmVzdWx0IGFzIFN0YXRlRGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFN0b3JlUmVjZWl2ZWRNZXNzYWdlRXZlbnQuT3BlblN0b3JlUmVxdWVzdDpcbiAgICAgIGNhc2UgU3RvcmVSZWNlaXZlZE1lc3NhZ2VFdmVudC5VcGRhdGVXYWxsZXRDb2luczpcbiAgICAgICAgdGhpcy5zdG9yZUxpc3RlbmVyc01hbmFnZXIucGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZVJlY2VpdmVkU3RhdGVEYXRhKGRhdGE6IFN0YXRlRGF0YSkge1xuICAgIHRoaXMuc3RhdGVEYXRhID0gZGF0YTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZURhdGEoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLmluaXRpYWxpemVNYW5hZ2VyLmFkZE5ldyh7XG4gICAgICAgIGNhbGxiYWNrczoge1xuICAgICAgICAgIG9uUmVjZWl2ZWQ6ICgpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkVycm9yOiAoKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VDYWxsYmFja0N5Y2xlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcblxyXG5pbXBvcnQgeyBTdGF0ZURhdGEsIEluaXRpYWxpemVEYXRhQ2FsbGJhY2tzIH0gZnJvbSAnLi4vbW9kZWxzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBJbml0aWFsaXplRGF0YUNhbGxiYWNrQ3ljbGUgZXh0ZW5kcyBCYXNlQ2FsbGJhY2tDeWNsZTxJbml0aWFsaXplRGF0YUNhbGxiYWNrcz4ge1xyXG4gIHB1YmxpYyBwYXJzZU1lc3NhZ2UobWVzc2FnZTogUmVjZWl2ZWRNZXNzYWdlKSB7XHJcbiAgICB0aGlzLmhhbmRsZVJlY2VpdmVkTWVzc2FnZShtZXNzYWdlIGFzIFJlY2VpdmVkTWVzc2FnZTx7IGlkOiBudW1iZXI7IHJlc3VsdDogU3RhdGVEYXRhIH0+KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlUmVjZWl2ZWRNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZTx7IGlkOiBudW1iZXI7IHJlc3VsdDogU3RhdGVEYXRhIH0+KSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja3M/Lm9uUmVjZWl2ZWQpIHtcclxuICAgICAgdGhpcy5jYWxsYmFja3Mub25SZWNlaXZlZChtZXNzYWdlLmRhdGEucmVzdWx0KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmhhbmRsZURlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgUmVjZWl2ZWRNZXNzYWdlLCBNZXNzYWdlTW9kdWxlIH0gZnJvbSAnQC9tb2RlbHMnO1xyXG5pbXBvcnQgeyBHYW1lQ29tbXVuaWNhdG9yIH0gZnJvbSAnQC9nYW1lLWNvbW11bmljYXRvcic7XHJcblxyXG5pbXBvcnQgeyBIb3N0U2VudE1lc3NhZ2VFdmVudCwgSW5pdGlhbGl6ZURhdGFDYWxsYmFja3MgfSBmcm9tICcuLi9tb2RlbHMnO1xyXG5cclxuaW1wb3J0IHsgSW5pdGlhbGl6ZURhdGFDYWxsYmFja0N5Y2xlIH0gZnJvbSAnLi9pbml0aWFsaXplLWRhdGEtY2FsbGJhY2stY3ljbGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEluaXRpYWxpemVNYW5hZ2VyIHtcclxuICBwcml2YXRlIGN5Y2xlcyA9IG5ldyBNYXA8bnVtYmVyLCBJbml0aWFsaXplRGF0YUNhbGxiYWNrQ3ljbGU+KCk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7fVxyXG5cclxuICBwdWJsaWMgYWRkTmV3KGRhdGE6IHsgY2FsbGJhY2tzOiBJbml0aWFsaXplRGF0YUNhbGxiYWNrcyB9KSB7XHJcbiAgICBjb25zdCBpZCA9IERhdGUubm93KCk7XHJcblxyXG4gICAgdGhpcy5jeWNsZXMuc2V0KFxyXG4gICAgICBpZCxcclxuICAgICAgbmV3IEluaXRpYWxpemVEYXRhQ2FsbGJhY2tDeWNsZSh7XHJcbiAgICAgICAgLi4uKGRhdGE/LmNhbGxiYWNrcyA/PyB7fSksXHJcbiAgICAgICAgb25EZXN0cm95OiAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLmhhbmRsZURlc3Ryb3lDeWNsZShpZCk7XHJcbiAgICAgICAgICBkYXRhLmNhbGxiYWNrcy5vbkRlc3Ryb3k/LigpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLmNvbW11bmljYXRvci5wb3N0TWVzc2FnZSh7XHJcbiAgICAgIG1vZHVsZTogTWVzc2FnZU1vZHVsZS5Ib3N0LFxyXG4gICAgICBldmVudDogSG9zdFNlbnRNZXNzYWdlRXZlbnQuUmVxdWVzdEluaXRpYWxEYXRhLFxyXG4gICAgICBkYXRhOiB7IGlkIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gaWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgaWYgKHRoaXMuY3ljbGVzLmhhcyhtZXNzYWdlLmRhdGEuaWQpKSB7XHJcbiAgICAgIGNvbnN0IGN5Y2xlID0gdGhpcy5jeWNsZXMuZ2V0KG1lc3NhZ2UuZGF0YS5pZCk7XHJcbiAgICAgIGN5Y2xlLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRGVzdHJveUN5Y2xlKGN5Y2xlSWQ6IG51bWJlcikge1xyXG4gICAgdGhpcy5jeWNsZXMuZGVsZXRlKGN5Y2xlSWQpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBNZXNzYWdlTW9kdWxlLCBSZWNlaXZlZE1lc3NhZ2UgfSBmcm9tICdAL21vZGVscyc7XHJcbmltcG9ydCB7IEdhbWVDb21tdW5pY2F0b3IgfSBmcm9tICdAL2dhbWUtY29tbXVuaWNhdG9yJztcclxuXHJcbmltcG9ydCB7IEhvc3RSZWNlaXZlZE1lc3NhZ2VFdmVudCwgU3RhdGVEYXRhLCBIb3N0U2VudE1lc3NhZ2VFdmVudCB9IGZyb20gJy4vbW9kZWxzJztcclxuaW1wb3J0IHsgSW5pdGlhbGl6ZU1hbmFnZXIgfSBmcm9tICcuL2luaXRpYWxpemUtZGF0YSc7XHJcbmltcG9ydCB7IGxvZ01lc3NhZ2UgfSBmcm9tICdAL3V0aWxzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBIb3N0TW9kdWxlIHtcclxuICBwcml2YXRlIGluaXRpYWxpemVNYW5hZ2VyOiBJbml0aWFsaXplTWFuYWdlcjtcclxuXHJcbiAgcHJpdmF0ZSBzdGF0ZURhdGE/OiBTdGF0ZURhdGE7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tbXVuaWNhdG9yOiBHYW1lQ29tbXVuaWNhdG9yKSB7XHJcbiAgICB0aGlzLmluaXRpYWxpemVNYW5hZ2VyID0gbmV3IEluaXRpYWxpemVNYW5hZ2VyKHRoaXMuY29tbXVuaWNhdG9yKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBpbml0aWFsaXplKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZURhdGEoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYWN0aXZlSG9zdCgpIHtcclxuICAgIHJldHVybiB0aGlzLnN0YXRlRGF0YT8uYWN0aXZlSG9zdDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgY2hhbmdlSG9zdCgpIHtcclxuICAgIHJldHVybiB0aGlzLnN0YXRlRGF0YT8uY2hhbmdlSG9zdDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXF1ZXN0Q2hhbmdlSG9zdChob3N0OiBzdHJpbmcpIHtcclxuICAgIHRoaXMuY29tbXVuaWNhdG9yLnBvc3RNZXNzYWdlKHtcclxuICAgICAgbW9kdWxlOiBNZXNzYWdlTW9kdWxlLkhvc3QsXHJcbiAgICAgIGV2ZW50OiBIb3N0U2VudE1lc3NhZ2VFdmVudC5SZXF1ZXN0Q2hhbmdlSG9zdCxcclxuICAgICAgZGF0YTogeyBpZDogRGF0ZS5ub3coKSwgaG9zdCB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2VNZXNzYWdlKG1lc3NhZ2U6IFJlY2VpdmVkTWVzc2FnZSkge1xyXG4gICAgc3dpdGNoIChtZXNzYWdlLmV2ZW50KSB7XHJcbiAgICAgIGNhc2UgSG9zdFJlY2VpdmVkTWVzc2FnZUV2ZW50LlN0YXRlRGF0YTpcclxuICAgICAgICB0aGlzLmluaXRpYWxpemVNYW5hZ2VyLnBhcnNlTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICBpZiAoJ3Jlc3VsdCcgaW4gbWVzc2FnZS5kYXRhKSB7XHJcbiAgICAgICAgICB0aGlzLmhhbmRsZVJlY2VpdmVkU3RhdGVEYXRhKG1lc3NhZ2UuZGF0YS5yZXN1bHQgYXMgU3RhdGVEYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZVJlY2VpdmVkU3RhdGVEYXRhKGRhdGE6IFN0YXRlRGF0YSkge1xyXG4gICAgdGhpcy5zdGF0ZURhdGEgPSBkYXRhO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpbml0aWFsaXplRGF0YSgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSkgPT4ge1xyXG4gICAgICB0aGlzLmluaXRpYWxpemVNYW5hZ2VyLmFkZE5ldyh7XHJcbiAgICAgICAgY2FsbGJhY2tzOiB7XHJcbiAgICAgICAgICBvblJlY2VpdmVkOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgb25FcnJvcjogKCkgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKGZhbHNlKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgbG9nTWVzc2FnZSB9IGZyb20gJ0AvdXRpbHMnO1xuXG5pbXBvcnQgeyBHbG9iYWxNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvZ2xvYmFsJztcbmltcG9ydCB7IEFkdk1vZHVsZSB9IGZyb20gJy4vbW9kdWxlcy9hZHYnO1xuaW1wb3J0IHsgR2FtZUNvbW11bmljYXRvciB9IGZyb20gJy4vZ2FtZS1jb21tdW5pY2F0b3InO1xuaW1wb3J0IHsgTWVzc2FnZU1vZHVsZSwgUmVjZWl2ZWRNZXNzYWdlIH0gZnJvbSAnLi9tb2RlbHMnO1xuaW1wb3J0IHsgRXZlbnRUcmFja2VyTW9kdWxlIH0gZnJvbSAnLi9tb2R1bGVzL2V2ZW50LXRyYWNrZXInO1xuaW1wb3J0IHsgQXV0aE1vZHVsZSB9IGZyb20gJy4vbW9kdWxlcy9hdXRoJztcbmltcG9ydCB7IEdhbWVFdmVudHNNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvZ2FtZS1ldmVudHMnO1xuaW1wb3J0IHsgU2V0dGluZ3NNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvc2V0dGluZ3MnO1xuaW1wb3J0IHsgU3RvcmVNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvc3RvcmUnO1xuaW1wb3J0IHsgSG9zdE1vZHVsZSwgSG9zdFJlY2VpdmVkTWVzc2FnZUV2ZW50IH0gZnJvbSAnLi9tb2R1bGVzL2hvc3QnO1xuXG5leHBvcnQgY2xhc3MgR2FtZVNkayB7XG4gIHB1YmxpYyBnbG9iYWw6IEdsb2JhbE1vZHVsZTtcbiAgcHVibGljIGFkdjogQWR2TW9kdWxlO1xuICBwdWJsaWMgZXZlbnRUcmFja2VyOiBFdmVudFRyYWNrZXJNb2R1bGU7XG4gIHB1YmxpYyBhdXRoOiBBdXRoTW9kdWxlO1xuICBwdWJsaWMgZ2FtZUV2ZW50czogR2FtZUV2ZW50c01vZHVsZTtcbiAgcHVibGljIHNldHRpbmdzOiBTZXR0aW5nc01vZHVsZTtcbiAgcHVibGljIHN0b3JlOiBTdG9yZU1vZHVsZTtcbiAgcHVibGljIGhvc3Q/OiBIb3N0TW9kdWxlO1xuXG4gIHByaXZhdGUgY29tbXVuaWNhdG9yID0gbmV3IEdhbWVDb21tdW5pY2F0b3IodGhpcy5wYXJzZU1lc3NhZ2UuYmluZCh0aGlzKSk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5jb21tdW5pY2F0b3IuaW5pdGlhbGl6ZSgpO1xuICAgIHRoaXMuZ2xvYmFsID0gbmV3IEdsb2JhbE1vZHVsZSh0aGlzLmNvbW11bmljYXRvcik7XG4gICAgdGhpcy5hZHYgPSBuZXcgQWR2TW9kdWxlKHRoaXMuY29tbXVuaWNhdG9yKTtcbiAgICB0aGlzLmV2ZW50VHJhY2tlciA9IG5ldyBFdmVudFRyYWNrZXJNb2R1bGUodGhpcy5jb21tdW5pY2F0b3IpO1xuICAgIHRoaXMuYXV0aCA9IG5ldyBBdXRoTW9kdWxlKHRoaXMuY29tbXVuaWNhdG9yKTtcbiAgICB0aGlzLmdhbWVFdmVudHMgPSBuZXcgR2FtZUV2ZW50c01vZHVsZSh0aGlzLmNvbW11bmljYXRvcik7XG4gICAgdGhpcy5zZXR0aW5ncyA9IG5ldyBTZXR0aW5nc01vZHVsZSh0aGlzLmNvbW11bmljYXRvcik7XG4gICAgdGhpcy5zdG9yZSA9IG5ldyBTdG9yZU1vZHVsZSh0aGlzLmNvbW11bmljYXRvcik7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgY29tbXVuaWNhdGlvbkVzdGFibGlzaGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxvZ01lc3NhZ2UoWydjaGVjayBwYXJlbnQgY29ubmVjdGlvbiAmIG1vZHVsZXMgaW5pdGlhbGl6YXRpb24nXSk7XG5cbiAgICBjb25zdCB2YWx1ZXMgPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLmdsb2JhbC5pc0Nvbm5lY3RlZFRvUGFyZW50LnRoZW4oKHZhbHVlKSA9PiB7XG4gICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICBsb2dNZXNzYWdlKFsnY291bGQgbm90IGNvbm5lY3QgdG8gcGFyZW50J10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH0pLFxuICAgICAgdGhpcy5nbG9iYWwuaXNQYXJlbnRNb2R1bGVzSW5pdGlhbGl6ZWQudGhlbigodmFsdWUpID0+IHtcbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgIGxvZ01lc3NhZ2UoWydwYXJlbnQgbW9kdWxlcyB3YXMgbm90IGluaXRpYWxpemVkJ10pO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS5ob3N0TW9kdWxlQ3JlYXRlZCkge1xuICAgICAgICAgIHRoaXMuY3JlYXRlSG9zdE1vZHVsZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSksXG4gICAgXSk7XG4gICAgaWYgKHZhbHVlcy5ldmVyeShCb29sZWFuKSkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZU1vZHVsZXMoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgbG9nTWVzc2FnZShbJ21vZHVsZXMgaW5pdGlhbGl6ZWQnXSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgbG9nTWVzc2FnZShbJ21vZHVsZXMgbm90IGluaXRpYWxpemVkJ10pO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHB1YmxpYyBpbml0aWFsaXplKCkge1xuICAgIGxvZ01lc3NhZ2UoWydpbml0aWFsaXplJ10pO1xuICB9XG5cbiAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgbG9nTWVzc2FnZShbJ2Rlc3Ryb3knXSk7XG4gICAgdGhpcy5jb21tdW5pY2F0b3IuZGVzdHJveSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZU1lc3NhZ2UoZGF0YTogUmVjZWl2ZWRNZXNzYWdlKSB7XG4gICAgc3dpdGNoIChkYXRhLm1vZHVsZSkge1xuICAgICAgY2FzZSBNZXNzYWdlTW9kdWxlLkdsb2JhbDpcbiAgICAgICAgdGhpcy5nbG9iYWwucGFyc2VNZXNzYWdlKGRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTWVzc2FnZU1vZHVsZS5BZHY6XG4gICAgICAgIHRoaXMuYWR2LnBhcnNlTWVzc2FnZShkYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE1lc3NhZ2VNb2R1bGUuRXZlbnRUcmFja2VyOlxuICAgICAgICB0aGlzLmV2ZW50VHJhY2tlci5wYXJzZU1lc3NhZ2UoZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBNZXNzYWdlTW9kdWxlLkF1dGg6XG4gICAgICAgIHRoaXMuYXV0aC5wYXJzZU1lc3NhZ2UoZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBNZXNzYWdlTW9kdWxlLlNldHRpbmdzOlxuICAgICAgICB0aGlzLnNldHRpbmdzLnBhcnNlTWVzc2FnZShkYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE1lc3NhZ2VNb2R1bGUuU3RvcmU6XG4gICAgICAgIHRoaXMuc3RvcmUucGFyc2VNZXNzYWdlKGRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTWVzc2FnZU1vZHVsZS5Ib3N0OlxuICAgICAgICBpZiAodGhpcy5ob3N0KSB7XG4gICAgICAgICAgdGhpcy5ob3N0LnBhcnNlTWVzc2FnZShkYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2dNZXNzYWdlKFsnaG9zdCBtb2R1bGUgaXMgbm90IGF2YWlsYWJsZSddLCBjb25zb2xlLmVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGluaXRpYWxpemVNb2R1bGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxvZ01lc3NhZ2UoWydpbml0aWFsaXplIG1vZHVsZXMnXSk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgICBbXG4gICAgICAgIHRoaXMuYWR2LmluaXRpYWxpemUoKS50aGVuKHRoaXMuZ2V0VHJhY2tNb2R1bGVJbml0aWFsaXphdGlvbignYWR2JykpLFxuICAgICAgICB0aGlzLmV2ZW50VHJhY2tlci5pbml0aWFsaXplKCkudGhlbih0aGlzLmdldFRyYWNrTW9kdWxlSW5pdGlhbGl6YXRpb24oJ2V2ZW50VHJhY2tlcicpKSxcbiAgICAgICAgdGhpcy5hdXRoLmluaXRpYWxpemUoKS50aGVuKHRoaXMuZ2V0VHJhY2tNb2R1bGVJbml0aWFsaXphdGlvbignYXV0aCcpKSxcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5pbml0aWFsaXplKCkudGhlbih0aGlzLmdldFRyYWNrTW9kdWxlSW5pdGlhbGl6YXRpb24oJ3NldHRpbmdzJykpLFxuICAgICAgICB0aGlzLnN0b3JlLmluaXRpYWxpemUoKS50aGVuKHRoaXMuZ2V0VHJhY2tNb2R1bGVJbml0aWFsaXphdGlvbignc3RvcmUnKSksXG4gICAgICAgIHRoaXMuaG9zdCA/IHRoaXMuaG9zdC5pbml0aWFsaXplKCkudGhlbih0aGlzLmdldFRyYWNrTW9kdWxlSW5pdGlhbGl6YXRpb24oJ2hvc3QnKSkgOiB1bmRlZmluZWQsXG4gICAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICApLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGNvbnN0IGlzSW5pdGlhbGl6ZWQgPSBkYXRhLmV2ZXJ5KEJvb2xlYW4pO1xuICAgICAgaWYgKCFpc0luaXRpYWxpemVkKSB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBpbml0aWFsaXplIG9uZSBvZiBtb2R1bGVzJyk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldFRyYWNrTW9kdWxlSW5pdGlhbGl6YXRpb24obW9kdWxlTmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIChpc0luaXRpYWxpemVkOiBib29sZWFuKSA9PiB7XG4gICAgICBsb2dNZXNzYWdlKFtgJHttb2R1bGVOYW1lfSBtb2R1bGUgaXMgJHtpc0luaXRpYWxpemVkID8gJycgOiAnbm90ICd9aW5pdGlhbGl6ZWRgXSwgaXNJbml0aWFsaXplZCA/IGNvbnNvbGUubG9nIDogY29uc29sZS53YXJuKTtcbiAgICAgIHJldHVybiBpc0luaXRpYWxpemVkO1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUhvc3RNb2R1bGUoKSB7XG4gICAgdGhpcy5ob3N0ID0gbmV3IEhvc3RNb2R1bGUodGhpcy5jb21tdW5pY2F0b3IpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBMT0dHRVJfU1RZTEVTIH0gZnJvbSAnLi9sb2dnZXItc3R5bGVzLmNvbnN0YW50JztcbmltcG9ydCB7IEdhbWVTZGsgfSBmcm9tICcuL2dhbWUtc2RrJztcbmltcG9ydCB7IFNES19WRVJTSU9OIH0gZnJvbSAnLi9jb25zdGFudHMvdmVyc2lvbic7XG5cbmNvbnNvbGUubG9nKCclY2dhbWUtc2RrLXNjcmlwdCcsIExPR0dFUl9TVFlMRVMsICd2ZXJzaW9uJywgU0RLX1ZFUlNJT04pO1xuXG5pZiAod2luZG93LnBhcmVudCkge1xuICBjb25zdCBNZWxXZWJTZGsgPSBuZXcgR2FtZVNkaygpO1xuXG4gIGNvbnNvbGUubG9nKCclY2dhbWUtc2RrLXNjcmlwdCcsIExPR0dFUl9TVFlMRVMsICdjaGVjayBpbml0aWFsaXphdGlvbicpO1xuICBNZWxXZWJTZGsuY29tbXVuaWNhdGlvbkVzdGFibGlzaGVkKClcbiAgICAudGhlbigodmFsdWUpID0+IHtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnJWNnYW1lLXNkay1zY3JpcHQnLCBMT0dHRVJfU1RZTEVTLCAnYXNzaWduIHdpbmRvdycpO1xuICAgICAgICBPYmplY3QuYXNzaWduKHdpbmRvdywge1xuICAgICAgICAgIE1lbFdlYlNkayxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnJWNnYW1lLXNkay1zY3JpcHQnLCBMT0dHRVJfU1RZTEVTLCAnbG9hZGluZyBmYWlsZWQnKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC5jYXRjaCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnJWNnYW1lLXNkay1zY3JpcHQnLCBMT0dHRVJfU1RZTEVTLCAnbG9hZGluZyBmYWlsZWQnKTtcbiAgICB9KTtcbn0gZWxzZSB7XG4gIGNvbnNvbGUubG9nKCclY2dhbWUtc2RrLXNjcmlwdCcsIExPR0dFUl9TVFlMRVMsICdmYWlsZWQ6IG5vIHBhcmVudCBmb3VuZCcpO1xufVxuIiwiZXhwb3J0IGNvbnN0IFNES19WRVJTSU9OID0gJzEuMS4wJztcclxuIl0sIm5hbWVzIjpbIkxPR0dFUl9TVFlMRVMiLCJsb2dNZXNzYWdlIiwiYXJncyIsImxvZ2dlciIsImNvbnNvbGUiLCJsb2ciLCJHbG9iYWxSZWNlaXZlZE1lc3NhZ2VFdmVudCIsIkdsb2JhbFJlY2VpdmVkTWVzc2FnZUV2ZW50VHlwZSIsIkdsb2JhbFNlbnRNZXNzYWdlRXZlbnQiLCJHbG9iYWxTZW50TWVzc2FnZUV2ZW50VHlwZSIsIk1lc3NhZ2VNb2R1bGUiLCJNZXNzYWdlU291cmNlIiwiQ0FMTEJBQ0tfQ1lDTEVfQURWX1RJTUVPVVQiLCJUaW1lck1hbmFnZXIiLCJ0aW1lb3V0SWQiLCJzdGFydCIsImNhbGxiYWNrIiwidGltZW91dE1zIiwidGhpcyIsImNsZWFyIiwic2V0VGltZW91dCIsInVuZGVmaW5lZCIsImNsZWFyVGltZW91dCIsImRlc3Ryb3kiLCJCYXNlQ2FsbGJhY2tDeWNsZSIsImNhbGxiYWNrcyIsInRpbWVyIiwiY29uc3RydWN0b3IiLCJoYW5kbGVUaW1lb3V0RXJyb3IiLCJvbkVycm9yIiwicmVhc29uIiwiaGFuZGxlRGVzdHJveSIsIm9uRGVzdHJveSIsIkhlbGxvQ2FsbGJhY2tDeWNsZSIsInBhcnNlTWVzc2FnZSIsIm1lc3NhZ2UiLCJ0eXBlIiwiU3VjY2VzcyIsIm9uU3VjY2VzcyIsIkhlbGxvTWFuYWdlciIsImNvbW11bmljYXRvciIsImN5Y2xlIiwiaW50ZXJ2YWxJZCIsImRhdGEiLCJpZCIsIkRhdGUiLCJub3ciLCJoYW5kbGVEZXN0cm95Q3ljbGUiLCJzZXRJbnRlcnZhbCIsInNlbnRIZWxsb01lc3NhZ2UiLCJTdGFydCIsImhhbmRsZVJlY2VpdmVTdGFydCIsInBvc3RNZXNzYWdlIiwibW9kdWxlIiwiR2xvYmFsIiwiZXZlbnQiLCJIZWxsbyIsImNsZWFySW50ZXJ2YWwiLCJHbG9iYWxNb2R1bGUiLCJoZWxsb01hbmFnZXIiLCJpc0Nvbm5lY3RlZFRvUGFyZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJzZXRJc0Nvbm5lY3RlZFRvUGFyZW50IiwiaXNQYXJlbnRNb2R1bGVzSW5pdGlhbGl6ZWQiLCJzZXRJc1BhcmVudE1vZHVsZXNJbml0aWFsaXplZCIsImNvbm5lY3RlZFByb21pc2UiLCJnZW5lcmF0ZUNvbm5lY3Rpb25Qcm9taXNlIiwibW9kdWxlc1Byb21pc2UiLCJwcm9taXNlIiwiTW9kdWxlc0luaXRpYWxpemVkIiwiaG9zdE1vZHVsZUNyZWF0ZWQiLCJyIiwiQWR2UmVjZWl2ZWRNZXNzYWdlRXZlbnQiLCJBZHZTZW50TWVzc2FnZUV2ZW50IiwiQWR2U2VudE1lc3NhZ2VFdmVudFR5cGUiLCJTaG93RnVsbHNjcmVlbkFkdkNhbGxiYWNrVHlwZSIsIlNob3dSZXdhcmRlZFZpZGVvQ2FsbGJhY2tUeXBlIiwiUmV3YXJkZWRWaWRlb0NhbGxiYWNrQ3ljbGUiLCJFcnJvciIsImhhbmRsZVNob3dSZXdhcmRlZFZpZGVvRXJyb3IiLCJDbG9zZWQiLCJoYW5kbGVTaG93UmV3YXJkZWRWaWRlb0Nsb3NlZCIsIm9uQ2xvc2UiLCJSZXdhcmRlZFZpZGVvTWFuYWdlciIsInJld2FyZGVkVmlkZW9DeWNsZXMiLCJNYXAiLCJhZGROZXciLCJzZXQiLCJBZHYiLCJTaG93UmV3YXJkZWRWaWRlbyIsImhhcyIsImdldCIsImN5Y2xlSWQiLCJkZWxldGUiLCJGdWxsc2NyZWVuQWR2Q2FsbGJhY2tDeWNsZSIsIkZ1bGxzY3JlZW5BZHZNYW5hZ2VyIiwiZnVsbHNjcmVlbkFkdkN5Y2xlcyIsIlNob3dGdWxsc2NyZWVuQWR2IiwiSW5pdGlhbGl6ZUFkdkRhdGFDYWxsYmFja0N5Y2xlIiwiaGFuZGxlUmVjZWl2ZWRNZXNzYWdlIiwib25SZWNlaXZlZCIsIkluaXRpYWxpemVBZHZNYW5hZ2VyIiwiY3ljbGVzIiwiUmVxdWVzdEluaXRpYWxEYXRhIiwiQWR2TW9kdWxlIiwicmV3YXJkZWRWaWRlb01hbmFnZXIiLCJmdWxsc2NyZWVuQWR2TWFuYWdlciIsImluaXRpYWxpemVBZHZNYW5hZ2VyIiwic3RhdGVEYXRhIiwiaW5pdGlhbGl6ZSIsImluaXRpYWxpemVBZHZEYXRhIiwiaXNBZHZBdmFpbGFibGUiLCJpc0F2YWlsYWJsZSIsInNob3dSZXdhcmRlZFZpZGVvIiwic2hvd0Z1bGxzY3JlZW5BZHYiLCJTdGF0ZURhdGEiLCJoYW5kbGVSZWNlaXZlZFN0YXRlRGF0YSIsInJlc3VsdCIsImVycm9yIiwiQUxMT1dFRF9ERVZfSE9TVCIsIkdhbWVDb21tdW5pY2F0b3IiLCJtZXNzYWdlTGlzdGVuZXIiLCJ3aW5kb3ciLCJwYXJlbnQiLCJ3YXJuIiwib25SZWNlaXZlTWVzc2FnZSIsImJpbmQiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsInNvdXJjZSIsIk1lbG9uV2ViR2FtZUFwcCIsImNoZWNrTWVzc2FnZU9yaWdpbiIsIm9yaWdpbiIsImNoZWNrTWVzc2FnZVNvdXJjZSIsInVybCIsIlVSTCIsImhvc3RuYW1lIiwiZW5kc1dpdGgiLCJwcm90b2NvbCIsIk1lbG9uV2ViQXBwIiwiRXZlbnRUcmFja2VyTWVzc2FnZVN1Ym1vZHVsZSIsIkFwcHNGbHllclJlY2VpdmVkTWVzc2FnZUV2ZW50IiwiQXBwc0ZseWVyU2VudE1lc3NhZ2VFdmVudCIsIlNldEN1c3RvbWVyVXNlcklkQ2FsbGJhY2tUeXBlIiwiU2V0RXZlbnRDYWxsYmFja1R5cGUiLCJHb29nbGVUYWdSZWNlaXZlZE1lc3NhZ2VFdmVudCIsIkdvb2dsZVRhZ1NlbnRNZXNzYWdlRXZlbnQiLCJBdXRoTGlzdGVuZXJzUmVjZWl2ZWRFdmVudFR5cGUiLCJBdXRoUmVjZWl2ZWRNZXNzYWdlRXZlbnQiLCJBdXRoU2VudE1lc3NhZ2VFdmVudCIsIkdldEF1dGhEYXRhQ2FsbGJhY2tUeXBlIiwiUmVxdWVzdEdvb2dsZVRva2VuQ2FsbGJhY2tUeXBlIiwiR2FtZUV2ZW50c1NlbnRNZXNzYWdlRXZlbnQiLCJHYW1lU3RlcFR5cGUiLCJMYW5ndWFnZVR5cGUiLCJSZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2VDYWxsYmFja1R5cGUiLCJTZXR0aW5nc1JlY2VpdmVkTWVzc2FnZUV2ZW50IiwiU2V0dGluZ3NTZW50TWVzc2FnZUV2ZW50IiwiU3RvcmVQYWdlVHlwZSIsIlN0b3JlUmVjZWl2ZWRNZXNzYWdlRXZlbnQiLCJTdG9yZVNlbnRNZXNzYWdlRXZlbnQiLCJTdG9yZVNlbnRNZXNzYWdlRXZlbnRUeXBlIiwiSG9zdFJlY2VpdmVkTWVzc2FnZUV2ZW50IiwiSG9zdFNlbnRNZXNzYWdlRXZlbnQiLCJTZXRDdXN0b21lclVzZXJJZENhbGxiYWNrQ3ljbGUiLCJoYW5kbGVTdWNjZXNzIiwiaGFuZGxlRXJyb3IiLCJTZXRDdXN0b21lclVzZXJJZE1hbmFnZXIiLCJFdmVudFRyYWNrZXIiLCJzdWJtb2R1bGUiLCJBcHBzRmx5ZXIiLCJTZXRDdXN0b21lclVzZXJJZCIsInVzZXJJZCIsIlNldEV2ZW50Q2FsbGJhY2tDeWNsZSIsIlNldEV2ZW50TWFuYWdlciIsIlNldEV2ZW50IiwiZXZlbnROYW1lIiwiZXZlbnRWYWx1ZSIsImV2ZW50S2V5IiwiSW5pdGlhbGl6ZURhdGFDYWxsYmFja0N5Y2xlIiwiSW5pdGlhbGl6ZU1hbmFnZXIiLCJBcHBzRmx5ZXJTdWJtb2R1bGUiLCJzZXRDdXN0b21lclVzZXJJZE1hbmFnZXIiLCJzZXRFdmVudE1hbmFnZXIiLCJpbml0aWFsaXplTWFuYWdlciIsImluaXRpYWxpemVEYXRhIiwic2V0Q3VzdG9tZXJVc2VySWQiLCJzZXRFdmVudCIsIkdvb2dsZVRhZyIsImV2ZW50UGFyYW1ldGVycyIsIkdvb2dsZVRhZ1N1Ym1vZHVsZSIsIkV2ZW50VHJhY2tlck1vZHVsZSIsImFwcHNGbHllciIsImdvb2dsZVRhZyIsImFsbFNldHRsZWQiLCJ0aGVuIiwiZXZlcnkiLCJzdGF0dXMiLCJSZXF1ZXN0R29vZ2xlVG9rZW5DYWxsYmFja0N5Y2xlIiwidG9rZW4iLCJSZXF1ZXN0R29vZ2xlVG9rZW5NYW5hZ2VyIiwiQXV0aCIsIlJlcXVlc3RHb29nbGVUb2tlbiIsInJldHJ5Q291bnQiLCJyZXRyeVRpbWVvdXQiLCJkZXZpY2VJZCIsIm9uUmV0cnkiLCJzdXBlciIsInJlcXVlc3RTdGF0ZURhdGEiLCJHZXRBdXRoRGF0YUNhbGxiYWNrQ3ljbGUiLCJhdXRoRGF0YSIsIkdldEF1dGhEYXRhTWFuYWdlciIsIkdldEF1dGhEYXRhIiwiQXV0aExpc3RlbmVyc01hbmFnZXIiLCJnZXRUb2tlbk1hbmFnZXIiLCJsaXN0ZW5lcnMiLCJpbml0TGlzdGVuZXJzIiwib25Jbml0aWFsaXplZCIsIkF1dGhDaGFuZ2VTdGFydGVkIiwib25BdXRoQ2hhbmdlU3RhcnRlZCIsIkF1dGhDaGFuZ2VDb21wbGV0ZWQiLCJvbkF1dGhDaGFuZ2VDb21wbGV0ZWQiLCJBdXRoQ2hhbmdlRmFpbGVkIiwib25BdXRoQ2hhbmdlRmFpbGVkIiwiQXV0aE1vZHVsZSIsInJlcXVlc3RHb29nbGVUb2tlbk1hbmFnZXIiLCJnZXRBdXRoRGF0YU1hbmFnZXIiLCJhdXRoTGlzdGVuZXJzTWFuYWdlciIsImluaXRBdXRoTGlzdGVuZXJzIiwiaXNHb29nbGVBdmFpbGFibGUiLCJyZXF1ZXN0R29vZ2xlVG9rZW4iLCJnZXRBdXRoRGF0YSIsIkF1dGhMaXN0ZW5lcnMiLCJHYW1lRXZlbnRzTW9kdWxlIiwic2VuZEdhbWVTdGVwIiwic3RlcCIsInRpbWVzdGFtcCIsInRpbWVTdGFtcE1pbGxpc2Vjb25kcyIsInBhcnNlSW50IiwiR2FtZUV2ZW50cyIsIkdhbWVTdGVwIiwiU2V0dGluZ3MiLCJSZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2VDYWxsYmFja0N5Y2xlIiwibGFuZ3VhZ2UiLCJSZXF1ZXN0Q2hhbmdlTGFuZ3VhZ2VNYW5hZ2VyIiwiUmVxdWVzdENoYW5nZUxhbmd1YWdlIiwibmV3TGFuZ3VhZ2UiLCJTZXR0aW5nc0xpc3RlbmVyc01hbmFnZXIiLCJMYW5ndWFnZUNoYW5nZWQiLCJvbkxhbmd1YWdlQ2hhbmdlZCIsIlNldHRpbmdzTW9kdWxlIiwicmVxdWVzdENoYW5nZUxhbmd1YWdlTWFuYWdlciIsInNldHRpbmdzTGlzdGVuZXJzTWFuYWdlciIsInJlcXVlc3RDaGFuZ2VMYW5ndWFnZSIsIlN0b3JlTGlzdGVuZXJzTWFuYWdlciIsIk9wZW5TdG9yZVJlcXVlc3QiLCJvbk9wZW5TdG9yZVJlcXVlc3RlZCIsInBhZ2VUeXBlIiwiaXRlbUlkIiwicmVzcG9uc2VXaXRoU3VjY2VzcyIsInJlc3BvbnNlV2l0aEVycm9yIiwiVXBkYXRlV2FsbGV0Q29pbnMiLCJvblVwZGF0ZVdhbGxldENvaW5zIiwiY29pbnMiLCJtZXNzYWdlSWQiLCJTdG9yZSIsIlVwZGF0ZVdhbGxldENvaW5zTWFuYWdlciIsIlN0b3JlTW9kdWxlIiwic3RvcmVMaXN0ZW5lcnNNYW5hZ2VyIiwidXBkYXRlV2FsbGV0Q29pbnNNYW5hZ2VyIiwibGlua3MiLCJ1cGRhdGVXYWxsZXRDb2lucyIsIkhvc3QiLCJIb3N0TW9kdWxlIiwiYWN0aXZlSG9zdCIsImNoYW5nZUhvc3QiLCJyZXF1ZXN0Q2hhbmdlSG9zdCIsImhvc3QiLCJSZXF1ZXN0Q2hhbmdlSG9zdCIsIkdhbWVTZGsiLCJnbG9iYWwiLCJhZHYiLCJldmVudFRyYWNrZXIiLCJhdXRoIiwiZ2FtZUV2ZW50cyIsInNldHRpbmdzIiwic3RvcmUiLCJjb21tdW5pY2F0aW9uRXN0YWJsaXNoZWQiLCJhbGwiLCJ2YWx1ZSIsImNyZWF0ZUhvc3RNb2R1bGUiLCJCb29sZWFuIiwiaW5pdGlhbGl6ZU1vZHVsZXMiLCJjYXRjaCIsImdldFRyYWNrTW9kdWxlSW5pdGlhbGl6YXRpb24iLCJmaWx0ZXIiLCJtb2R1bGVOYW1lIiwiaXNJbml0aWFsaXplZCIsIk1lbFdlYlNkayIsIk9iamVjdCIsImFzc2lnbiJdLCJzb3VyY2VSb290IjoiIn0=
