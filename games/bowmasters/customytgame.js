(function () {
    'use strict';
    var aa = typeof Object.defineProperties == "function" ? Object.defineProperty : function (a, b, c) {
        if (a == Array.prototype || a == Object.prototype) return a;
        a[b] = c.value;
        return a
    };

    function ba(a) {
        a = ["object" == typeof globalThis && globalThis, a, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
        for (var b = 0; b < a.length; ++b) {
            var c = a[b];
            if (c && c.Math == Math) return c
        }
        throw Error("Cannot find global object");
    }
    var ca = ba(this);

    function da(a, b) {
        if (b) a: {
            var c = ca;a = a.split(".");
            for (var d = 0; d < a.length - 1; d++) {
                var e = a[d];
                if (!(e in c)) break a;
                c = c[e]
            }
            a = a[a.length - 1];d = c[a];b = b(d);b != d && b != null && aa(c, a, {
                configurable: !0,
                writable: !0,
                value: b
            })
        }
    }

    function l(a) {
        function b(d) {
            return a.next(d)
        }

        function c(d) {
            return a.throw(d)
        }
        return new Promise(function (d, e) {
            function f(g) {
                g.done ? d(g.value) : Promise.resolve(g.value).then(b, c).then(f, e)
            }
            f(a.next())
        })
    }
    da("globalThis", function (a) {
        return a || ca
    });
    da("Object.values", function (a) {
        return a ? a : function (b) {
            var c = [],
                d;
            for (d in b) Object.prototype.hasOwnProperty.call(b, d) && c.push(b[d]);
            return c
        }
    });
    da("Array.prototype.includes", function (a) {
        return a ? a : function (b, c) {
            var d = this;
            d instanceof String && (d = String(d));
            var e = d.length;
            c = c || 0;
            for (c < 0 && (c = Math.max(c + e, 0)); c < e; c++) {
                var f = d[c];
                if (f === b || Object.is(f, b)) return !0
            }
            return !1
        }
    });
    da("Object.entries", function (a) {
        return a ? a : function (b) {
            var c = [],
                d;
            for (d in b) Object.prototype.hasOwnProperty.call(b, d) && c.push([d, b[d]]);
            return c
        }
    });

    function ea(a, b) {
        a instanceof String && (a += "");
        var c = 0,
            d = !1,
            e = {
                next: function () {
                    if (!d && c < a.length) {
                        var f = c++;
                        return {
                            value: b(f, a[f]),
                            done: !1
                        }
                    }
                    d = !0;
                    return {
                        done: !0,
                        value: void 0
                    }
                }
            };
        e[Symbol.iterator] = function () {
            return e
        };
        return e
    }
    da("Array.prototype.values", function (a) {
        return a ? a : function () {
            return ea(this, function (b, c) {
                return c
            })
        }
    });
    const fa = () => {
        var a = window.getCurrentSdkUrl();
        if (a !== null) {
            a = new URL(a.origin + a.pathname + "?" + window.getLocationHash().substring(1));
            if (a.searchParams.has("flags")) {
                let b;
                window.sdkFlags = (b = a.searchParams.get("flags")) != null ? b : ""
            }
            if (a.searchParams.has("environment") && a.searchParams.has("bundle") && a.searchParams.has("key") && (a.searchParams.get("environment") !== "prod" || a.searchParams.get("bundle") !== "public")) throw document.write('<script src="' + a.toString() + '">\x3c/script>'), Error("Exiting SDK: Purposefully exiting to load a different SDK version.");
        }
    };
    if (!window.loadYTGame) {
        window.getLocationHash = () => window.location.hash;
        const a = document.currentScript.src;
        window.getCurrentSdkUrl = () => a != "" ? new URL(a) : null;
        window.loadYTGame = fa;
        fa()
    }
    window.enableSendingResourceLoadedEvents = !0;
    /*

     Copyright The Closure Library Authors.
     SPDX-License-Identifier: Apache-2.0
    */
    var m = this || self;

    function ha(a) {
        var b = typeof a;
        return b == "object" && a != null || b == "function"
    }

    function n(a, b) {
        a = a.split(".");
        for (var c = m, d; a.length && (d = a.shift());) a.length || b === void 0 ? c[d] && c[d] !== Object.prototype[d] ? c = c[d] : c = c[d] = {} : c[d] = b
    }

    function ia(a) {
        return a
    }

    function ka(a, b) {
        function c() {}
        c.prototype = b.prototype;
        a.K = b.prototype;
        a.prototype = new c;
        a.prototype.constructor = a;
        a.R = function (d, e, f) {
            for (var g = Array(arguments.length - 2), h = 2; h < arguments.length; h++) g[h - 2] = arguments[h];
            return b.prototype[e].apply(d, g)
        }
    };

    function la(a) {
        m.setTimeout(() => {
            throw a;
        }, 0)
    };
    var ma, na;
    a: {
        for (var oa = ["CLOSURE_FLAGS"], pa = m, qa = 0; qa < oa.length; qa++)
            if (pa = pa[oa[qa]], pa == null) {
                na = null;
                break a
            } na = pa
    }
    var ra = na && na[610401301];
    ma = ra != null ? ra : !1;

    function sa() {
        var a = m.navigator;
        return a && (a = a.userAgent) ? a : ""
    }
    var ta;
    const ua = m.navigator;
    ta = ua ? ua.userAgentData || null : null;

    function va(a) {
        return ma ? ta ? ta.brands.some(({
            brand: b
        }) => b && b.indexOf(a) != -1) : !1 : !1
    }

    function q(a) {
        return sa().indexOf(a) != -1
    };

    function r() {
        return ma ? !!ta && ta.brands.length > 0 : !1
    }

    function wa() {
        return r() ? va("Chromium") : (q("Chrome") || q("CriOS")) && !(r() ? 0 : q("Edge")) || q("Silk")
    };
    const xa = Array.prototype.indexOf ? function (a, b) {
        return Array.prototype.indexOf.call(a, b, void 0)
    } : function (a, b) {
        if (typeof a === "string") return typeof b !== "string" || b.length != 1 ? -1 : a.indexOf(b, 0);
        for (let c = 0; c < a.length; c++)
            if (c in a && a[c] === b) return c;
        return -1
    };

    function ya(a) {
        ya[" "](a);
        return a
    }
    ya[" "] = function () {};
    var za = r() ? !1 : q("Trident") || q("MSIE"),
        Aa = q("Gecko") && !(sa().toLowerCase().indexOf("webkit") != -1 && !q("Edge")) && !(q("Trident") || q("MSIE")) && !q("Edge"),
        Ba = sa().toLowerCase().indexOf("webkit") != -1 && !q("Edge");
    !q("Android") || wa();
    wa();
    q("Safari") && (wa() || (r() ? 0 : q("Coast")) || (r() ? 0 : q("Opera")) || (r() ? 0 : q("Edge")) || (r() ? va("Microsoft Edge") : q("Edg/")) || r() && va("Opera"));
    var Ca = {},
        Da = null;
    var Ea = typeof Uint8Array !== "undefined",
        Fa = !za && typeof btoa === "function";

    function Ga(a, b) {
        a.__closure__error__context__984382 || (a.__closure__error__context__984382 = {});
        a.__closure__error__context__984382.severity = b
    };
    let Ha = void 0;

    function Ia(a) {
        a = Error(a);
        Ga(a, "warning");
        return a
    }

    function Ja(a) {
        if (a != null) {
            var b;
            var c = (b = Ha) != null ? b : Ha = {};
            b = c[a] || 0;
            b >= 5 || (c[a] = b + 1, a = Error(), Ga(a, "incident"), la(a))
        }
    };
    var Ka = typeof Symbol === "function" && typeof Symbol() === "symbol";

    function t(a, b, c = !1) {
        return typeof Symbol === "function" && typeof Symbol() === "symbol" ? c && Symbol.for && a ? Symbol.for(a) : a != null ? Symbol(a) : Symbol() : b
    }
    var La = t("jas", void 0, !0),
        Ma = t(void 0, "0di"),
        Na = t(void 0, "1oa"),
        Oa = t(void 0, Symbol()),
        Pa = t(void 0, "0actk"),
        Qa = t(void 0, "8utk");
    const u = Ka ? La : "N",
        Ra = {
            N: {
                value: 0,
                configurable: !0,
                writable: !0,
                enumerable: !1
            }
        },
        Sa = Object.defineProperties;

    function Ta(a, b) {
        Ka || u in a || Sa(a, Ra);
        a[u] |= b
    }

    function v(a, b) {
        Ka || u in a || Sa(a, Ra);
        a[u] = b
    }

    function Ua(a) {
        Ta(a, 34);
        return a
    }

    function Va(a, b) {
        v(b, (a | 0) & -15615)
    }

    function Wa(a, b) {
        v(b, (a | 34) & -15581)
    };

    function Xa() {
        return typeof BigInt === "function"
    };

    function w(a) {
        return Array.prototype.slice.call(a)
    };
    var Za = {};

    function $a(a) {
        return a !== null && typeof a === "object" && !Array.isArray(a) && a.constructor === Object
    }

    function ab(a) {
        if (a & 2) throw Error();
    }
    class bb {
        constructor(a, b, c) {
            this.g = a;
            this.h = b;
            this.i = c
        }
        next() {
            const a = this.g.next();
            a.done || (a.value = this.h.call(this.i, a.value));
            return a
        } [Symbol.iterator]() {
            return this
        }
    }

    function cb(a, b) {
        const c = ia(Oa);
        (b = c ? b[c] : void 0) && (a[Oa] = w(b))
    };

    function db(a) {
        a.U = !0;
        return a
    };
    var eb = db(a => typeof a === "number"),
        fb = db(a => typeof a === "string"),
        gb = db(a => typeof a === "boolean");
    var hb = typeof m.BigInt === "function" && typeof m.BigInt(0) === "bigint";
    var nb = db(a => hb ? a >= ib && a <= jb : a[0] === "-" ? kb(a, lb) : kb(a, mb));
    const lb = Number.MIN_SAFE_INTEGER.toString(),
        ib = hb ? BigInt(Number.MIN_SAFE_INTEGER) : void 0,
        mb = Number.MAX_SAFE_INTEGER.toString(),
        jb = hb ? BigInt(Number.MAX_SAFE_INTEGER) : void 0;

    function kb(a, b) {
        if (a.length > b.length) return !1;
        if (a.length < b.length || a === b) return !0;
        for (let c = 0; c < a.length; c++) {
            const d = a[c],
                e = b[c];
            if (d > e) return !1;
            if (d < e) return !0
        }
    };
    let x = 0,
        y = 0;

    function ob(a) {
        const b = a >>> 0;
        x = b;
        y = (a - b) / 4294967296 >>> 0
    }

    function pb(a) {
        if (a < 0) {
            ob(-a);
            const [b, c] = qb(x, y);
            x = b >>> 0;
            y = c >>> 0
        } else ob(a)
    }

    function rb(a, b) {
        b >>>= 0;
        a >>>= 0;
        if (b <= 2097151) var c = "" + (4294967296 * b + a);
        else Xa() ? c = "" + (BigInt(b) << BigInt(32) | BigInt(a)) : (c = (a >>> 24 | b << 8) & 16777215, b = b >> 16 & 65535, a = (a & 16777215) + c * 6777216 + b * 6710656, c += b * 8147497, b *= 2, a >= 1E7 && (c += a / 1E7 >>> 0, a %= 1E7), c >= 1E7 && (b += c / 1E7 >>> 0, c %= 1E7), c = b + sb(c) + sb(a));
        return c
    }

    function sb(a) {
        a = String(a);
        return "0000000".slice(a.length) + a
    }

    function qb(a, b) {
        b = ~b;
        a ? a = ~a + 1 : b += 1;
        return [a, b]
    };
    const tb = typeof BigInt === "function" ? BigInt.asIntN : void 0,
        ub = Number.isSafeInteger,
        vb = Number.isFinite,
        wb = Math.trunc;

    function xb(a) {
        if (typeof a !== "number") throw Error(`Value of float/double field must be a number, found ${typeof a}: ${a}`);
        return a
    }
    const yb = /^-?([1-9][0-9]*|0)(\.[0-9]+)?$/;

    function zb(a) {
        switch (typeof a) {
            case "bigint":
                return !0;
            case "number":
                return vb(a);
            case "string":
                return yb.test(a);
            default:
                return !1
        }
    }

    function z(a) {
        if (a != null) {
            if (!vb(a)) throw Ia("enum");
            a |= 0
        }
        return a
    }

    function Ab(a) {
        if (typeof a !== "number") throw Ia("int32");
        if (!vb(a)) throw Ia("int32");
        return a | 0
    }

    function A(a) {
        return a == null ? a : Ab(a)
    }

    function Bb(a) {
        if (a == null) return a;
        if (typeof a === "string" && a) a = +a;
        else if (typeof a !== "number") return;
        return vb(a) ? a | 0 : void 0
    }

    function B(a) {
        if (a != null && typeof a !== "string") throw Error();
        return a
    }

    function Cb(a) {
        return a == null || typeof a === "string" ? a : void 0
    }

    function Db(a, b, c, d) {
        if (a != null && typeof a === "object" && a.G === Za) return a;
        if (!Array.isArray(a)) return c ? d & 2 ? ((a = b[Ma]) || (a = new b, Ua(a.l), a = b[Ma] = a), b = a) : b = new b : b = void 0, b;
        let e = c = a[u] | 0;
        e === 0 && (e |= d & 32);
        e |= d & 2;
        e !== c && v(a, e);
        return new b(a)
    }

    function Eb(a, b, c) {
        a = b ? Ab(a) : Bb(a);
        return a == null ? c ? 0 : void 0 : a | 0
    };

    function Fb(a) {
        return a
    };
    const Gb = {};
    let Hb = function () {
        try {
            return ya(new class extends Map {
                constructor() {
                    super()
                }
            }), !1
        } catch (a) {
            return !0
        }
    }();
    class Ib {
        constructor() {
            this.g = new Map
        }
        get(a) {
            return this.g.get(a)
        }
        set(a, b) {
            this.g.set(a, b);
            this.size = this.g.size;
            return this
        }
        delete(a) {
            a = this.g.delete(a);
            this.size = this.g.size;
            return a
        }
        clear() {
            this.g.clear();
            this.size = this.g.size
        }
        has(a) {
            return this.g.has(a)
        }
        entries() {
            return this.g.entries()
        }
        keys() {
            return this.g.keys()
        }
        values() {
            return this.g.values()
        }
        forEach(a, b) {
            return this.g.forEach(a, b)
        } [Symbol.iterator]() {
            return this.entries()
        }
    }
    const Jb = (() => Hb ? (Object.setPrototypeOf(Ib.prototype, Map.prototype), Object.defineProperties(Ib.prototype, {
        size: {
            value: 0,
            configurable: !0,
            enumerable: !0,
            writable: !0
        }
    }), Ib) : class extends Map {
        constructor() {
            super()
        }
    })();

    function Kb(a) {
        return a
    }

    function Lb(a) {
        if (a.B & 2) throw Error("Cannot mutate an immutable Map");
    }
    var C = class extends Jb {
        constructor(a, b, c = Kb, d = Kb) {
            super();
            let e = a[u] | 0;
            e |= 64;
            v(a, e);
            this.B = e;
            this.A = b;
            this.C = c;
            this.I = this.A ? Mb : d;
            for (let f = 0; f < a.length; f++) {
                const g = a[f],
                    h = c(g[0], !1, !0);
                let k = g[1];
                b ? k === void 0 && (k = null) : k = d(g[1], !1, !0, void 0, void 0, e);
                super.set(h, k)
            }
        }
        P() {
            var a = Nb;
            if (this.size !== 0) return Array.from(super.entries(), b => {
                b[0] = a(b[0]);
                b[1] = a(b[1]);
                return b
            })
        }
        L(a = Ob) {
            const b = [],
                c = super.entries();
            for (var d; !(d = c.next()).done;) d = d.value, d[0] = a(d[0]), d[1] = a(d[1]), b.push(d);
            return b
        }
        clear() {
            Lb(this);
            super.clear()
        }
        delete(a) {
            Lb(this);
            return super.delete(this.C(a, !0, !1))
        }
        entries() {
            if (this.A) {
                var a = super.keys();
                a = new bb(a, Pb, this)
            } else a = super.entries();
            return a
        }
        values() {
            if (this.A) {
                var a = super.keys();
                a = new bb(a, C.prototype.get, this)
            } else a = super.values();
            return a
        }
        forEach(a, b) {
            this.A ? super.forEach((c, d, e) => {
                a.call(b, e.get(d), d, e)
            }) : super.forEach(a, b)
        }
        set(a, b) {
            Lb(this);
            a = this.C(a, !0, !1);
            return a == null ? this : b == null ? (super.delete(a), this) : super.set(a, this.I(b, !0, !0, this.A, !1, this.B))
        }
        has(a) {
            return super.has(this.C(a,
                !1, !1))
        }
        get(a) {
            a = this.C(a, !1, !1);
            const b = super.get(a);
            if (b !== void 0) {
                var c = this.A;
                return c ? (c = this.I(b, !1, !0, c, this.S, this.B), c !== b && super.set(a, c), c) : b
            }
        } [Symbol.iterator]() {
            return this.entries()
        }
    };
    C.prototype.toJSON = void 0;

    function Mb(a, b, c, d, e, f) {
        a = Db(a, d, c, f);
        e && (a = Qb(a));
        return a
    }

    function Ob(a) {
        return a
    }

    function Pb(a) {
        return [a, this.get(a)]
    }
    let Rb;

    function Sb() {
        return Rb || (Rb = new C(Ua([]), void 0, void 0, void 0, Gb))
    };

    function Tb(a, b, c) {
        const d = w(a);
        var e = d.length;
        const f = b & 256 ? d[e - 1] : void 0;
        e += f ? -1 : 0;
        for (b = b & 512 ? 1 : 0; b < e; b++) d[b] = c(d[b]);
        if (f) {
            b = d[b] = {};
            for (const g in f) b[g] = c(f[g])
        }
        cb(d, a);
        return d
    }

    function Ub(a, b, c, d, e) {
        if (a != null) {
            if (Array.isArray(a)) {
                const f = a[u] | 0;
                return a.length === 0 && f & 1 ? void 0 : e && f & 2 ? a : Vb(a, b, c, d !== void 0, e)
            }
            return b(a, d)
        }
    }

    function Vb(a, b, c, d, e) {
        const f = d || c ? a[u] | 0 : 0;
        d = d ? !!(f & 32) : void 0;
        const g = w(a);
        let h = 0;
        const k = g.length;
        for (let L = 0; L < k; L++) {
            var p = g[L];
            if (L === k - 1 && $a(p)) {
                var M = b,
                    ja = c,
                    Hd = d,
                    Id = e;
                let Ya = void 0;
                for (let Zb in p) {
                    const $b = Ub(p[Zb], M, ja, Hd, Id);
                    if ($b != null) {
                        let ac;
                        ((ac = Ya) != null ? ac : Ya = {})[Zb] = $b
                    }
                }
                p = Ya
            } else p = Ub(g[L], b, c, d, e);
            g[L] = p;
            p != null && (h = L + 1)
        }
        h < k && (g.length = h);
        c && (cb(g, a), c(f, g));
        return g
    }

    function Nb(a) {
        return Ub(a, Wb, void 0, void 0, !1)
    }

    function Wb(a) {
        switch (typeof a) {
            case "number":
                return Number.isFinite(a) ? a : "" + a;
            case "bigint":
                return nb(a) ? Number(a) : "" + a;
            case "boolean":
                return a ? 1 : 0;
            case "object":
                if (Ea && a != null && a instanceof Uint8Array) {
                    Ea && a != null && a instanceof Uint8Array && Ja(Qa);
                    if (Fa) {
                        for (var b = "", c = 0, d = a.length - 10240; c < d;) b += String.fromCharCode.apply(null, a.subarray(c, c += 10240));
                        b += String.fromCharCode.apply(null, c ? a.subarray(c) : a);
                        a = btoa(b)
                    } else {
                        b === void 0 && (b = 0);
                        if (!Da) {
                            Da = {};
                            c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
                            d = ["+/=", "+/", "-_=", "-_.", "-_"];
                            for (var e = 0; e < 5; e++) {
                                var f = c.concat(d[e].split(""));
                                Ca[e] = f;
                                for (var g = 0; g < f.length; g++) {
                                    var h = f[g];
                                    Da[h] === void 0 && (Da[h] = g)
                                }
                            }
                        }
                        b = Ca[b];
                        c = Array(Math.floor(a.length / 3));
                        d = b[64] || "";
                        for (e = f = 0; f < a.length - 2; f += 3) {
                            var k = a[f],
                                p = a[f + 1];
                            h = a[f + 2];
                            g = b[k >> 2];
                            k = b[(k & 3) << 4 | p >> 4];
                            p = b[(p & 15) << 2 | h >> 6];
                            h = b[h & 63];
                            c[e++] = g + k + p + h
                        }
                        g = 0;
                        h = d;
                        switch (a.length - f) {
                            case 2:
                                g = a[f + 1], h = b[(g & 15) << 2] || d;
                            case 1:
                                a = a[f], c[e] = b[a >> 2] + b[(a & 3) << 4 | g >> 4] + h + d
                        }
                        a = c.join("")
                    }
                    return a
                }
                if (a.G === Za) return Xb(a);
                if (a instanceof C) return a.P();
                return
        }
        return a
    }
    let Yb;

    function bc(a) {
        try {
            return Xb(a)
        } finally {
            Yb = void 0
        }
    }

    function Xb(a) {
        var b = a.l;
        a = Vb(b, Wb, void 0, void 0, !1);
        var c = b[u] | 0;
        if ((b = a.length) && !(c & 512)) {
            var d = a[b - 1],
                e = !1;
            $a(d) ? (b--, e = !0) : d = void 0;
            var f, g = (f = Yb) != null ? f : Fb;
            f = c & 512 ? 0 : -1;
            c = b - f;
            g = g(c, f, a, d);
            d && (a[b] = void 0);
            if (c < g && d) {
                c = !0;
                for (var h in d) {
                    const k = +h;
                    k <= g ? (e = k + f, a[e] = d[h], b = Math.max(e + 1, b), e = !1, delete d[h]) : c = !1
                }
                c && (d = void 0)
            }
            for (c = b - 1; b > 0; c = b - 1)
                if (h = a[c], h == null) b--, e = !0;
                else if (c -= f, c >= g) {
                let k;
                ((k = d) != null ? k : d = {})[c] = h;
                b--;
                e = !0
            } else break;
            e && (a.length = b);
            d && a.push(d)
        }
        return a
    };

    function cc() {
        Ja(Pa)
    };

    function dc(a, b, c = Wa) {
        if (a != null) {
            if (Ea && a instanceof Uint8Array) return b ? a : new Uint8Array(a);
            if (Array.isArray(a)) {
                var d = a[u] | 0;
                if (d & 2) return a;
                b && (b = d === 0 || !!(d & 32) && !(d & 64 || !(d & 16)));
                return b ? (v(a, d | 34), d & 4 && Object.freeze(a), a) : Vb(a, dc, d & 4 ? Wa : c, !0, !0)
            }
            a.G === Za ? (c = a.l, d = c[u] | 0, a = d & 2 ? a : new a.constructor(ec(c, d, !0))) : a instanceof C && !(a.B & 2) && (c = Ua(a.L(dc)), a = new C(c, a.A, a.C, a.I));
            return a
        }
    }

    function ec(a, b, c) {
        const d = c || b & 2 ? Wa : Va,
            e = !!(b & 32);
        a = Tb(a, b, f => dc(f, e, d));
        Ta(a, 32 | (c ? 2 : 0));
        return a
    }

    function Qb(a) {
        const b = a.l,
            c = b[u] | 0;
        return c & 2 ? new a.constructor(ec(b, c, !1)) : a
    };

    function D(a, b) {
        a = a.l;
        return fc(a, a[u] | 0, b)
    }

    function fc(a, b, c) {
        if (c === -1) return null;
        const d = c + (b & 512 ? 0 : -1),
            e = a.length - 1;
        if (d >= e && b & 256) return a[e][c];
        if (d <= e) return a[d]
    }

    function E(a, b, c) {
        const d = a.l;
        let e = d[u] | 0;
        ab(e);
        F(d, e, b, c);
        return a
    }

    function F(a, b, c, d) {
        const e = b & 512 ? 0 : -1,
            f = c + e;
        var g = a.length - 1;
        if (f >= g && b & 256) return a[g][c] = d, b;
        if (f <= g) return a[f] = d, b;
        d !== void 0 && (g = b >> 14 & 1023 || 536870912, c >= g ? d != null && (a[g + e] = {
            [c]: d
        }, b |= 256, v(a, b)) : a[f] = d);
        return b
    }

    function gc(a, b, c) {
        return hc(a, b, ic(a, G, c)) !== void 0
    }

    function jc(a, b) {
        this.set(b, a)
    }

    function kc(a, b, c, d) {
        const e = a.l;
        var f = e[u] | 0;
        ab(f);
        if (d == null) {
            var g = lc(e);
            if (mc(g, e, f, c) === b) g.set(c, 0);
            else return a
        } else {
            g = lc(e);
            const h = mc(g, e, f, c);
            h !== b && (h && (f = F(e, f, h)), g.set(c, b))
        }
        F(e, f, b, d);
        return a
    }

    function ic(a, b, c) {
        a = a.l;
        return mc(lc(a), a, a[u] | 0, b) === c ? c : -1
    }

    function lc(a) {
        if (Ka) {
            var b;
            return (b = a[Na]) != null ? b : a[Na] = new Map
        }
        if (Na in a) return a[Na];
        b = new Map;
        Object.defineProperty(a, Na, {
            value: b
        });
        return b
    }

    function mc(a, b, c, d) {
        let e = a.get(d);
        if (e != null) return e;
        e = 0;
        for (let f = 0; f < d.length; f++) {
            const g = d[f];
            fc(b, c, g) != null && (e !== 0 && (c = F(b, c, e)), e = g)
        }
        a.set(d, e);
        return e
    }

    function hc(a, b, c) {
        a = a.l;
        let d = a[u] | 0;
        const e = fc(a, d, c);
        b = Db(e, b, !1, d);
        b !== e && b != null && F(a, d, c, b);
        return b
    }

    function H(a, b, c) {
        c == null && (c = void 0);
        return E(a, b, c)
    }

    function I(a, b, c, d) {
        d == null && (d = void 0);
        return kc(a, b, c, d)
    }

    function nc(a, b) {
        let c;
        return (c = Cb(D(a, b))) != null ? c : ""
    }

    function oc(a, b) {
        a = D(a, b);
        a = a == null ? a : vb(a) ? a | 0 : void 0;
        return a != null ? a : 0
    }

    function J(a, b, c, d) {
        c = ic(a, d, c);
        b = hc(a, b, c);
        if (b != null && (a = a.l, d = a[u] | 0, !(d & 2))) {
            const e = Qb(b);
            e !== b && (b = e, F(a, d, c, b))
        }
        c = b;
        return c
    }

    function K(a, b, c) {
        if (c != null) a: {
            if (!zb(c)) throw Ia("int64");
            switch (typeof c) {
                case "string":
                    var d = wb(Number(c));
                    if (ub(d)) c = String(d);
                    else if (d = c.indexOf("."), d !== -1 && (c = c.substring(0, d)), d = c.length, !(c[0] === "-" ? d < 20 || d === 20 && Number(c.substring(0, 7)) > -922337 : d < 19 || d === 19 && Number(c.substring(0, 6)) < 922337)) {
                        if (c.length < 16) pb(Number(c));
                        else if (Xa()) c = BigInt(c), x = Number(c & BigInt(4294967295)) >>> 0, y = Number(c >> BigInt(32) & BigInt(4294967295));
                        else {
                            d = +(c[0] === "-");
                            y = x = 0;
                            var e = c.length;
                            for (let g = d, h = (e - d) % 6 +
                                    d; h <= e; g = h, h += 6) {
                                var f = Number(c.slice(g, h));
                                y *= 1E6;
                                x = x * 1E6 + f;
                                x >= 4294967296 && (y += Math.trunc(x / 4294967296), y >>>= 0, x >>>= 0)
                            }
                            if (d) {
                                const [g, h] = qb(x, y);
                                x = g;
                                y = h
                            }
                        }
                        c = x;
                        d = y;
                        if (d & 2147483648)
                            if (Xa()) c = "" + (BigInt(d | 0) << BigInt(32) | BigInt(c >>> 0));
                            else {
                                const [g, h] = qb(c, d);
                                c = "-" + rb(g, h)
                            }
                        else c = rb(c, d)
                    }
                    break a;
                case "bigint":
                    d = c = tb(64, c);
                    if (fb(d)) {
                        if (!/^\s*(?:-?[1-9]\d*|0)?\s*$/.test(d)) throw Error(String(d));
                    } else if (eb(d) && !Number.isSafeInteger(d)) throw Error(String(d));
                    hb ? c = BigInt(c) : c = gb(c) ? c ? "1" : "0" : fb(c) ? c.trim() ||
                        "0" : String(c);
                    break a;
                default:
                    if (c = wb(c), !ub(c)) {
                        pb(c);
                        d = x;
                        e = y;
                        if (c = e & 2147483648) d = ~d + 1 >>> 0, e = ~e >>> 0, d == 0 && (e = e + 1 >>> 0);
                        f = e * 4294967296 + (d >>> 0);
                        d = Number.isSafeInteger(f) ? f : rb(d, e);
                        c = typeof d === "number" ? c ? -d : d : c ? "-" + d : d
                    }
            }
        }
        return E(a, b, c)
    }

    function pc(a, b, c) {
        var d = a.l,
            e = d[u] | 0;
        ab(e);
        var f = fc(d, e, b);
        f instanceof C && !(f instanceof C && f.B & 2) ? f.clear() : F(d, e, b);
        if (c) {
            ab(a.l[u] | 0);
            d = c.forEach;
            var g = a.l,
                h = g[u] | 0;
            a: {
                e = g;f = h;
                var k = fc(g, h, b);h = f & 2;g = !1;
                if (k == null) {
                    if (h) {
                        b = Sb();
                        break a
                    }
                    k = []
                } else if (k.constructor === C) {
                    if ((k.B & 2) == 0 || h) {
                        b = k;
                        break a
                    }
                    k = k.L()
                } else Array.isArray(k) ? g = !!((k[u] | 0) & 2) : k = [];
                if (h) {
                    if (!k.length) {
                        b = Sb();
                        break a
                    }
                    g || (g = !0, Ua(k))
                } else if (g) {
                    g = !1;
                    h = w(k);
                    for (k = 0; k < h.length; k++) {
                        const p = h[k] = w(h[k]);
                        Array.isArray(p[1]) && (p[1] =
                            Ua(p[1]))
                    }
                    k = h
                }
                g || ((k[u] | 0) & 64 ? k[u] &= -33 : 32 & f && Ta(k, 32));g = new C(k, void 0, Eb, Eb);F(e, f, b, g);b = g
            }
            d.call(c, jc, b)
        }
        return a
    };
    var N = class {
        constructor(a) {
            a: {
                if (a == null) {
                    var b = 96;
                    a = []
                } else {
                    if (!Array.isArray(a)) throw Error("narr");
                    b = a[u] | 0;
                    8192 & b || !(64 & b) || 2 & b || cc();
                    if (b & 1024) throw Error("farr");
                    if (b & 64) {
                        var c = a;
                        break a
                    }
                    var d = a;
                    b |= 64;
                    var e = d.length;
                    if (e) {
                        var f = e - 1;
                        e = d[f];
                        if ($a(e)) {
                            b |= 256;
                            const g = b & 512 ? 0 : -1;
                            f -= g;
                            if (f >= 1024) throw Error("pvtlmt");
                            for (c in e) {
                                const h = +c;
                                h < f && (d[h + g] = e[c], delete e[c])
                            }
                            b = b & -16760833 | (f & 1023) << 14
                        }
                    }
                }
                v(a, b);c = a
            }
            this.l = c
        }
        toJSON() {
            return bc(this)
        }
    };
    N.prototype.G = Za;
    N.prototype.toString = function () {
        return this.l.toString()
    };
    class qc {
        constructor(a, b) {
            this.data = a;
            this.channel = b
        }
    };

    function rc(a) {
        const b = new MessageChannel;
        sc(b.port1, a);
        return b
    }

    function tc(a, b) {
        sc(a, b);
        return new uc(a)
    }
    class uc {
        constructor(a) {
            this.h = a
        }
        g(a, b, c = []) {
            b = rc(b);
            this.h.postMessage(a, [b.port2].concat(c))
        }
    }

    function sc(a, b) {
        b && (a.onmessage = c => {
            var d = c.data;
            c = tc(c.ports[0]);
            b(new qc(d, c))
        })
    };
    var vc = function () {
        if (!m.addEventListener || !Object.defineProperty) return !1;
        var a = !1,
            b = Object.defineProperty({}, "passive", {
                get: function () {
                    a = !0
                }
            });
        try {
            const c = () => {};
            m.addEventListener("test", c, b);
            m.removeEventListener("test", c, b)
        } catch (c) {}
        return a
    }();
    var wc = ({
        destination: a,
        origin: b,
        V: c,
        M: d = "ZNWN1d",
        onMessage: e
    }) => {
        if (b === "*") throw Error("Sending to wildcard origin not allowed.");
        const f = rc(e);
        a.postMessage(c ? {
            n: d,
            t: c
        } : d, b, [f.port2]);
        return tc(f.port1, e)
    };
    var xc = class {
            constructor(a) {
                this.h = a
            }
            g(a, b, c) {
                this.h.g(bc(a), b, c)
            }
        },
        zc = a => {
            var b = yc;
            return c => {
                const d = new b(c.data);
                return a(new qc(d, c.channel))
            }
        },
        Ac = a => b => a(new qc(b.data, new xc(b.channel)));
    /*

     Copyright Google LLC
     SPDX-License-Identifier: Apache-2.0
    */
    let Bc = globalThis.trustedTypes,
        Cc;

    function Dc() {
        let a = null;
        if (!Bc) return a;
        try {
            const b = c => c;
            a = Bc.createPolicy("goog#html", {
                createHTML: b,
                createScript: b,
                createScriptURL: b
            })
        } catch (b) {}
        return a
    };
    var Ec = class {
        constructor(a) {
            this.g = a
        }
        toString() {
            return this.g + ""
        }
    };

    function Fc(a) {
        Cc === void 0 && (Cc = Dc());
        var b = Cc;
        return new Ec(b ? b.createScriptURL(a) : a)
    };

    function Gc(a, b) {
        var c = a.register;
        if (b instanceof Ec) b = b.g;
        else throw Error("");
        return c.call(a, b, void 0)
    };

    function Hc(a) {
        return String(a).replace(/\-([a-z])/g, function (b, c) {
            return c.toUpperCase()
        })
    }

    function Ic(a) {
        return a.replace(RegExp("(^|[\\s]+)([a-z])", "g"), function (b, c, d) {
            return c + d.toUpperCase()
        })
    };

    function Jc(a, ...b) {
        if (b.length === 0) return Fc(a[0]);
        let c = a[0];
        for (let d = 0; d < b.length; d++) c += encodeURIComponent(b[d]) + a[d + 1];
        return Fc(c)
    };

    function Kc(a, b) {
        this.type = a;
        this.target = b
    }
    Kc.prototype.g = function () {};

    function Lc(a) {
        Kc.call(this, a ? a.type : "");
        this.relatedTarget = this.target = null;
        this.button = this.screenY = this.screenX = this.clientY = this.clientX = 0;
        this.key = "";
        this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = !1;
        this.state = null;
        this.pointerId = 0;
        this.pointerType = "";
        this.h = null;
        if (a) {
            const b = this.type = a.type,
                c = a.changedTouches && a.changedTouches.length ? a.changedTouches[0] : null;
            this.target = a.target || a.srcElement;
            let d = a.relatedTarget;
            d || (b == "mouseover" ? d = a.fromElement : b == "mouseout" && (d = a.toElement));
            this.relatedTarget =
                d;
            c ? (this.clientX = c.clientX !== void 0 ? c.clientX : c.pageX, this.clientY = c.clientY !== void 0 ? c.clientY : c.pageY, this.screenX = c.screenX || 0, this.screenY = c.screenY || 0) : (this.clientX = a.clientX !== void 0 ? a.clientX : a.pageX, this.clientY = a.clientY !== void 0 ? a.clientY : a.pageY, this.screenX = a.screenX || 0, this.screenY = a.screenY || 0);
            this.button = a.button;
            this.key = a.key || "";
            this.ctrlKey = a.ctrlKey;
            this.altKey = a.altKey;
            this.shiftKey = a.shiftKey;
            this.metaKey = a.metaKey;
            this.pointerId = a.pointerId || 0;
            this.pointerType = a.pointerType;
            this.state = a.state;
            this.h = a;
            a.defaultPrevented && Lc.K.g.call(this)
        }
    }
    ka(Lc, Kc);
    Lc.prototype.g = function () {
        Lc.K.g.call(this);
        const a = this.h;
        a.preventDefault ? a.preventDefault() : a.returnValue = !1
    };
    var Mc = "closure_listenable_" + (Math.random() * 1E6 | 0);
    var Nc = 0;

    function Oc(a, b, c, d, e) {
        this.listener = a;
        this.proxy = null;
        this.src = b;
        this.type = c;
        this.capture = !!d;
        this.h = e;
        this.key = ++Nc;
        this.g = this.F = !1
    }

    function Pc(a) {
        a.g = !0;
        a.listener = null;
        a.proxy = null;
        a.src = null;
        a.h = null
    };

    function Qc(a) {
        this.src = a;
        this.g = {};
        this.h = 0
    }
    Qc.prototype.add = function (a, b, c, d, e) {
        const f = a.toString();
        a = this.g[f];
        a || (a = this.g[f] = [], this.h++);
        var g;
        a: {
            for (g = 0; g < a.length; ++g) {
                const h = a[g];
                if (!h.g && h.listener == b && h.capture == !!d && h.h == e) break a
            }
            g = -1
        }
        g > -1 ? (b = a[g], c || (b.F = !1)) : (b = new Oc(b, this.src, f, !!d, e), b.F = c, a.push(b));
        return b
    };
    var Rc = "closure_lm_" + (Math.random() * 1E6 | 0),
        Sc = {},
        Tc = 0;

    function Uc(a, b, c, d, e) {
        if (d && d.once) Vc(a, b, c, d, e);
        else if (Array.isArray(b))
            for (let f = 0; f < b.length; f++) Uc(a, b[f], c, d, e);
        else c = Wc(c), a && a[Mc] ? a.g(b, c, ha(d) ? !!d.capture : !!d, e) : Xc(a, b, c, !1, d, e)
    }

    function Xc(a, b, c, d, e, f) {
        if (!b) throw Error("Invalid event type");
        const g = ha(e) ? !!e.capture : !!e;
        let h = Yc(a);
        h || (a[Rc] = h = new Qc(a));
        c = h.add(b, c, d, g, f);
        if (!c.proxy) {
            d = Zc();
            c.proxy = d;
            d.src = a;
            d.listener = c;
            if (a.addEventListener) vc || (e = g), e === void 0 && (e = !1), a.addEventListener(b.toString(), d, e);
            else if (a.attachEvent) a.attachEvent($c(b.toString()), d);
            else if (a.addListener && a.removeListener) a.addListener(d);
            else throw Error("addEventListener and attachEvent are unavailable.");
            Tc++
        }
    }

    function Zc() {
        function a(c) {
            return b.call(a.src, a.listener, c)
        }
        const b = ad;
        return a
    }

    function Vc(a, b, c, d, e) {
        if (Array.isArray(b))
            for (let f = 0; f < b.length; f++) Vc(a, b[f], c, d, e);
        else c = Wc(c), a && a[Mc] ? a.h(b, c, ha(d) ? !!d.capture : !!d, e) : Xc(a, b, c, !0, d, e)
    }

    function $c(a) {
        return a in Sc ? Sc[a] : Sc[a] = "on" + a
    }

    function ad(a, b) {
        if (a.g) a = !0;
        else {
            b = new Lc(b, this);
            const g = a.listener,
                h = a.h || a.src;
            if (a.F && typeof a !== "number" && a && !a.g) {
                var c = a.src;
                if (c && c[Mc]) c.i(a);
                else {
                    var d = a.type,
                        e = a.proxy;
                    c.removeEventListener ? c.removeEventListener(d, e, a.capture) : c.detachEvent ? c.detachEvent($c(d), e) : c.addListener && c.removeListener && c.removeListener(e);
                    Tc--;
                    if (d = Yc(c)) {
                        e = a.type;
                        var f;
                        if (f = e in d.g) {
                            f = d.g[e];
                            const k = xa(f, a);
                            let p;
                            (p = k >= 0) && Array.prototype.splice.call(f, k, 1);
                            f = p
                        }
                        f && (Pc(a), d.g[e].length == 0 && (delete d.g[e], d.h--));
                        d.h == 0 && (d.src = null, c[Rc] = null)
                    } else Pc(a)
                }
            }
            a = g.call(h, b)
        }
        return a
    }

    function Yc(a) {
        a = a[Rc];
        return a instanceof Qc ? a : null
    }
    var bd = "__closure_events_fn_" + (Math.random() * 1E9 >>> 0);

    function Wc(a) {
        if (typeof a === "function") return a;
        a[bd] || (a[bd] = function (b) {
            return a.handleEvent(b)
        });
        return a[bd]
    };

    function O(a, b) {
        if (typeof b === "string")(b = cd(a, b)) && (a.style[b] = "none");
        else
            for (const e in b) {
                var c = a,
                    d = b[e];
                const f = cd(c, e);
                f && (c.style[f] = d)
            }
    }
    var dd = {};

    function cd(a, b) {
        let c = dd[b];
        if (!c) {
            var d = Hc(b);
            c = d;
            a.style[d] === void 0 && (d = (Ba ? "Webkit" : Aa ? "Moz" : null) + Ic(d), a.style[d] !== void 0 && (c = d));
            dd[b] = c
        }
        return c
    };
    var ed = class extends N {};
    var fd = class extends N {};
    var gd = class extends N {};
    var hd = class extends N {},
        id = [3, 4];
    var jd = class extends N {};

    function kd(a, b) {
        {
            const p = a.l;
            let M = p[u] | 0;
            ab(M);
            if (b == null) F(p, M, 1);
            else {
                var c = b[u] | 0,
                    d = c,
                    e = !!(2 & c) && !!(4 & c) || !!(1024 & c),
                    f = e || Object.isFrozen(b),
                    g = !0,
                    h = !0;
                for (let ja = 0; ja < b.length; ja++) {
                    var k = b[ja];
                    e || (k = !!((k.l[u] | 0) & 2), g && (g = !k), h && (h = k))
                }
                e || (c = g ? 13 : 5, c = h ? c | 16 : c & -17);
                f && c === d || (b = w(b), d = 0, c = 2 & M ? c | 2 : c & -3, c = (c | 32) & -1025, 32 & M || (c &= -33));
                c !== d && v(b, c);
                F(p, M, 1, b)
            }
        }
        return a
    }
    var ld = class extends N {};

    function md(a) {
        var b = new nd;
        if (a != null && typeof a !== "boolean") throw b = typeof a, Error(`Expected boolean but got ${b!="object"?b:a?Array.isArray(a)?"array":b:"null"}: ${a}`);
        return E(b, 2, a)
    }
    var nd = class extends N {};
    var od = class extends N {};
    var pd = class extends N {};
    var qd = class extends N {};

    function rd(a) {
        var b = new sd;
        return E(b, 1, z(a))
    }

    function td(a, b) {
        return H(a, 2, b)
    }

    function ud(a) {
        var b = vd();
        b = wd(b.o);
        return H(a, 4, b)
    }
    var sd = class extends N {},
        xd = [3];
    var yd = class extends N {};
    var zd = class extends N {};
    var Ad = class extends N {
        getInviteCode() {
            return nc(this, 1)
        }
        hasInviteCode() {
            return Cb(D(this, 1)) != null
        }
    };
    var P = class extends N {
            getLanguage() {
                return nc(this, ic(this, Bd, 4))
            }
        },
        Bd = [3, 4, 5, 6];
    var yc = class extends N {},
        G = [2, 3, 4, 5];
    var Cd = class extends N {};
    var Dd = class extends N {};

    function Ed(a, b) {
        return K(a, 1, b)
    }

    function Fd(a, b) {
        return E(a, 3, b == null ? b : xb(b))
    }

    function Gd(a, b) {
        return E(a, 4, b == null ? b : xb(b))
    }

    function Jd(a, b) {
        return H(a, 5, b)
    }

    function Kd(a, b) {
        return H(a, 6, b)
    }
    var Ld = class extends N {};
    var Md = class extends N {};
    var Nd = class extends N {};

    function Q(a) {
        var b = new Od;
        return E(b, 1, z(a))
    }

    function Pd(a, b) {
        return I(a, 2, R, b)
    }

    function Qd(a, b) {
        return I(a, 5, R, b)
    }

    function Rd(a, b) {
        return I(a, 10, R, b)
    }
    var Od = class extends N {
            getInviteCode() {
                return nc(this, ic(this, R, 11))
            }
            hasInviteCode() {
                var a = ic(this, R, 11);
                return Cb(D(this, a)) != null
            }
        },
        R = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    var Sd = {
            UNKNOWN: 0,
            API_UNAVAILABLE: 1,
            INVALID_PARAMS: 2,
            SIZE_LIMIT_EXCEEDED: 3,
            0: "UNKNOWN",
            1: "API_UNAVAILABLE",
            2: "INVALID_PARAMS",
            3: "SIZE_LIMIT_EXCEEDED"
        },
        S = class extends Error {
            constructor(a, b) {
                super(b);
                this.errorType = a;
                this.name = `SDK_ERROR_${Sd[this.errorType]}`
            }
        };
    var Td = new S(0, "An unknown error occurred."),
        T = new S(2, "Invalid parameters entered, please fix and try again."),
        Ud = new S(1, "Unspecified network error. Check your internet connection and try again."),
        Vd = new S(3, "Size limit exceeded."),
        Wd = new S(0, "Resource URL is malformed"),
        Xd = new S(1, "The requested Ad failed to load. Check your network and try again.");

    function Yd(a) {
        switch (a) {
            case 1:
                return "SDK_API_FIRST_FRAME_READY";
            case 2:
                return "SDK_API_LOAD_DATA";
            case 3:
                return "SDK_API_SAVE_DATA";
            case 4:
                return "SDK_API_SEND_SCORE";
            case 5:
                return "SDK_API_ON_AUDIO_ENABLED_CHANGE";
            case 6:
                return "SDK_API_ON_PAUSE";
            case 7:
                return "SDK_API_ON_RESUME";
            case 8:
                return "SDK_API_GET_LANGUAGE";
            case 9:
                return "SDK_API_GAME_READY";
            case 10:
                return "SDK_API_IS_AUDIO_ENABLED";
            case 11:
                return "SDK_API_BENCHMARKING"
        }
        return "SDK_API_UNSPECIFIED"
    }
    var U = class extends S {
        constructor(a, b, c, d) {
            super(a.errorType, c != null ? c : a.message);
            this.v = a;
            this.g = b;
            this.data = d;
            this.name = `${this.name}_${Yd(b)}`
        }
    };

    function V(a, b) {
        let c = Td;
        if (gc(a, P, 2)) switch (oc(J(a, P, 2, G), 2)) {
            case 1:
                return;
            case 2:
                c = T;
                break;
            case 3:
                if (b === 14) {
                    c = Xd;
                    break
                }
                c = Ud;
                break;
            case 4:
                console.warn("The SDK is no-op, if you are trying to verify SDK integration please use the SDK Test Suite available at https://developers.google.com/youtube/gaming/playables/certification/sdktestsuite");
                return;
            default:
                c = Td
        }
        throw new U(c, b);
    };

    function Zd(a, b) {
        const c = d => {
            d instanceof $d && b(d.g)
        };
        a.g.addEventListener(a.type, c);
        a.h !== void 0 && a.dispatchEvent(a.h);
        return () => {
            a.g.removeEventListener(a.type, c)
        }
    }
    var ae = class {
        constructor(a, b) {
            this.type = a;
            this.g = new EventTarget;
            let c;
            this.H = (c = b == null ? void 0 : b.H) != null ? c : !0;
            (b == null ? void 0 : b.J) !== void 0 && this.dispatchEvent(b == null ? void 0 : b.J)
        }
        dispatchEvent(a) {
            this.g.dispatchEvent(new $d(this.type, a));
            this.H && (this.h = a)
        }
    };
    class $d extends Event {
        constructor(a, b) {
            super(a);
            this.g = b
        }
    };
    var be, ce, de = new yc;
    ce = E(de, 1, z(1));
    var ee, fe = new P;
    ee = E(fe, 2, z(4));
    be = I(ce, 2, G, ee);
    var ge = new qc(be, tc((new MessageChannel).port2));

    function W() {
        var a = window !== window.parent;
        he || (he = new ie(a));
        if (he.g !== a) throw Error(`MessagingService is already created with isEmbedded=${!a}`);
        return he
    }

    function je(a, b) {
        Zd(a.target, b)
    }

    function X(a, b, c = () => {}) {
        a.g ? a.channel.g(b, Ac(zc(c))) : c(ge)
    }

    function Y(a, b) {
        return new Promise(c => {
            X(a, b, c)
        })
    }
    var ie = class {
            constructor(a) {
                this.g = a;
                this.target = new ae("HOST_EVENT", {
                    H: !1
                });
                a = (new URLSearchParams(window.location.hash.substring(1))).get("origin") || document.referrer;
                this.channel = new xc(wc({
                    destination: window.parent,
                    origin: this.g ? a : window.location.origin,
                    M: "playableIframe",
                    onMessage: Ac(zc(b => {
                        this.target.dispatchEvent(b)
                    }))
                }))
            }
        },
        he;
    const ke = {
        UNKNOWN: 0,
        SHOWED: 1,
        REJECTED: 3,
        DISMISSED: 2,
        0: "UNKNOWN",
        1: "SHOWED",
        3: "REJECTED",
        2: "DISMISSED"
    };

    function le(a) {
        switch (a) {
            case 1:
                return 1;
            case 2:
                return 3;
            case 3:
                return 2;
            default:
                return 0
        }
    }
    var me = class {
        constructor() {
            this.g = W();
            this.AdResult = ke
        }
        requestAd() {
            const a = this;
            return l(function* () {
                const b = yield Y(a.g, Q(14));
                V(b.data, 14);
                let c, d;
                return le((c = J(b.data, P, 2, G)) == null ? void 0 : (d = J(c, ed, 6, Bd)) == null ? void 0 : oc(d, 1))
            }())
        }
    };
    var ne = window !== window.parent,
        oe = class {
            constructor() {
                this.SDK_VERSION = "1.20250303.0000";
                this.IN_PLAYABLES_ENV = ne;
                this.SdkError = S;
                this.SdkErrorType = Sd
            }
        };

    function pe() {
        return Promise.resolve()
    }
    var qe = class {
        constructor() {
            this.g = W()
        }
        sendScore(a) {
            const b = this;
            return l(function* () {
                if (!Number.isInteger(a.value)) throw new U(T, 4, "Score value must be an integer and" + ` the value entered was: ${a.value}`);
                if (!Number.isSafeInteger(a.value)) throw new U(T, 4, `Score value must be less than the maximum safe integer in Javascript ${Number.MAX_SAFE_INTEGER} and the value entered was: ${a.value}`);
                var c = b.g,
                    d = Q(2);
                var e = new Md;
                e = K(e, 1, a.value);
                d = I(d, 3, R, e);
                c = yield Y(c, d);
                V(c.data, 4)
            }())
        }
        openYTContent(a) {
            return pe(this.g,
                a)
        }
    };

    function re(a) {
        a.h = 0;
        a.g = 0;
        a.i = a.index
    }

    function se(a, b) {
        a.index === a.i && a.g > 0 && (a.h -= a.j[a.index], a.g--, a.i++, a.i >= a.j.length && (a.i = 0));
        a.j[a.index] = b;
        a.h += b;
        a.g++;
        a.index++;
        a.index >= a.j.length && (a.index = 0)
    }

    function te(a) {
        return a.g === 0 ? 0 : a.h / a.g
    }
    var ue = class {
        constructor(a) {
            this.index = this.i = this.g = this.h = 0;
            this.j = Array(a)
        }
    };

    function ve(a) {
        const b = performance.now();
        a.h > 0 ? se(a.g, b - a.h) : a.j !== 0 && (se(a.g, 0), clearTimeout(a.j));
        a.h = -1;
        a.j = setTimeout(() => {
            a.h = performance.now()
        }, 0);
        a.m > 0 && se(a.i, b - a.m);
        a.m = b;
        requestAnimationFrame(() => {
            ve(a)
        })
    }

    function we(a) {
        requestAnimationFrame(() => {
            ve(a)
        })
    }
    var xe = class {
        constructor() {
            this.h = this.m = -1;
            this.j = 0;
            this.i = new ue(3600);
            this.g = new ue(3600)
        }
    };

    function ye(a) {
        setInterval(() => {
            const b = window.performance && window.performance.memory || null;
            b && se(a.g, b.usedJSHeapSize)
        }, 5E3)
    }

    function ze(a) {
        var b = new Dd;
        return K(b, 1, te(a.g))
    }
    var Ae = class {
        constructor() {
            this.g = new ue(12)
        }
    };

    function Be(a) {
        a.navigator = window.navigator;
        typeof performance.getEntriesByType === "function" && "encodedBodySize" in PerformanceResourceTiming.prototype && "decodedBodySize" in PerformanceResourceTiming.prototype && "transferSize" in PerformanceResourceTiming.prototype && ((new PerformanceObserver(b => {
            b.getEntries().forEach(c => {
                if (c.entryType === "resource" && !c.name.includes("https://www.youtube.com/game_api")) {
                    a.o++;
                    a.j += c.encodedBodySize;
                    c.transferSize === 0 && c.decodedBodySize > 0 && a.m++;
                    const f = Z(c.responseStatus);
                    if (!(f >= 100 && f < 200)) {
                        try {
                            var d = new URL(c.name)
                        } catch (g) {
                            throw Wd;
                        }
                        window.location.origin === d.origin ? a.h.set(f, (a.h.get(f) || 0) + 1) : a.g.set(f, (a.g.get(f) || 0) + 1)
                    }
                    var e;
                    (e = a.D) == null || e.call(a, c)
                }
            })
        })).observe({
            type: "resource",
            buffered: !0
        }), a.navigator && "serviceWorker" in a.navigator && a.navigator.serviceWorker.addEventListener && a.navigator.serviceWorker.addEventListener("message", b => {
            a.u++;
            b.data.cacheHit && (a.s++, a.i += b.data.cachedBytes)
        }))
    }

    function Ce(a, b) {
        a.D = b
    }

    function Z(a) {
        return a != null && typeof a === "number" && Number.isFinite(a) ? Math.floor(a) : 0
    }

    function wd(a) {
        var b = new pd;
        var c = Z(a.o);
        b = E(b, 1, A(c));
        c = Z(a.m);
        b = E(b, 2, A(c));
        c = Z(a.j);
        b = E(b, 3, A(c));
        b = pc(b, 4, a.h);
        b = pc(b, 5, a.g);
        c = new od;
        var d = Z(a.u);
        c = K(c, 1, d);
        d = Z(a.s);
        c = K(c, 2, d);
        a = Z(a.i);
        a = K(c, 3, a);
        return H(b, 6, a)
    }
    var De = class {
        constructor() {
            this.navigator = window.navigator;
            this.h = new Map;
            this.g = new Map;
            this.i = this.s = this.u = this.j = this.m = this.o = 0;
            this.D = null
        }
    };

    function vd() {
        Ee || (Ee = new Fe);
        return Ee
    }

    function Ge(a) {
        a.i !== 0 && (a.i = 0, He(a), a.h = setTimeout(() => {
            Ie(a)
        }, 3E4))
    }

    function Je(a) {
        const b = (new URLSearchParams(window.location.hash.substring(1))).get("debug") !== null;
        (b || window.enableSendingResourceLoadedEvents === !0) && Ce(a.o, c => {
            var d = a.u,
                e = Q(1),
                f = rd(3);
            var g = new qd;
            g = E(g, 1, B(c.name));
            g = E(g, 2, A(c.decodedBodySize));
            g = E(g, 3, A(c.encodedBodySize));
            c = E(g, 4, A(c.transferSize));
            f = I(f, 3, xd, c);
            X(d, Pd(e, f))
        });
        we(a.g);
        Be(a.o);
        Be(a.m);
        b && ye(a.j);
        Ge(a)
    }

    function He(a) {
        a.s = performance.now();
        var b = a.g;
        re(b.i);
        re(b.g);
        b = a.m;
        b.o = 0;
        b.m = 0;
        b.j = 0;
        b.u = 0;
        b.s = 0;
        b.i = 0;
        b.h.clear();
        b.g.clear();
        re(a.j.g)
    }

    function Ie(a) {
        X(W(), Rd(Q(12), Kd(Jd(Gd(Fd(K(Ed(new Ld, a.s), 2, performance.now()), te(a.g.i)), te(a.g.g)), wd(a.m)), ze(a.j))));
        He(a);
        a.h = setTimeout(() => {
            Ie(a)
        }, 3E4)
    }
    var Fe = class {
            constructor() {
                this.s = this.h = 0;
                this.i = 1;
                this.u = W();
                this.g = new xe;
                this.o = new De;
                this.m = new De;
                this.j = new Ae
            }
        },
        Ee;

    function Ke() {
        Le || (Le = new Me);
        return Le
    }

    function Ne(a) {
        a.navigator && "serviceWorker" in a.navigator && a.navigator.serviceWorker.addEventListener && a.navigator.serviceWorker.addEventListener("message", b => {
            b.data.serviceWorkerMessageKind === "clientStatusRequest" && Oe(a)
        })
    }

    function Oe(a) {
        a.navigator && "serviceWorker" in a.navigator && a.navigator.serviceWorker.controller && a.navigator.serviceWorker.controller.postMessage({
            serviceWorkerMessageKind: "clientStatus",
            shouldCacheResources: a.shouldCacheResources
        })
    }

    function Pe(a) {
        Ne(a);
        Oe(a)
    }
    var Me = class {
            constructor() {
                this.navigator = window.navigator;
                this.shouldCacheResources = !0
            }
        },
        Le;
    var Qe = class {
        constructor() {
            this.log = () => {}
        }
    };

    function Re(a) {
        switch (a) {
            case 0:
                return 1;
            case 1:
                return 2;
            case 2:
                return 3;
            case 3:
                return 4;
            case 4:
                return 5;
            default:
                return 0
        }
    }

    function Se(a) {
        switch (a.errorType) {
            case 2:
                return 2;
            case 1:
                return 1;
            case 3:
                return 3;
            default:
                return 0
        }
    }

    function Te(a, b) {
        var c = Q(9),
            d = new Nd;
        b = E(d, 1, z(b));
        c = I(c, 8, R, b);
        X(a, c)
    };
    var Ue = class {
        constructor() {
            this.h = ne;
            this.i = new ae("GAME_DATA_EVENT");
            this.g = W();
            this.j = Ke();
            je(this.g, a => {
                switch (oc(a.data, 1)) {
                    case 7:
                        gc(a.data, Ad, 5) && this.i.dispatchEvent(J(a.data, Ad, 5, G))
                }
            })
        }
        saveData(a) {
            const b = this;
            return l(function* () {
                if (b.h) {
                    try {
                        encodeURIComponent(a)
                    } catch (f) {
                        throw new U(T, 3, "Failed to encode save data");
                    }
                    var c = (new Blob([a])).size;
                    if (c > 3145727) {
                        var d = new hd;
                        c = kc(d, 3, id, A(c));
                        throw new U(Vd, 3, void 0, c);
                    }
                    c = b.g;
                    d = Q(3);
                    var e = new fd;
                    e = E(e, 1, B(a));
                    d = I(d, 4, R, e);
                    c = yield Y(c, d);
                    V(c.data,
                        3)
                }
            }())
        }
        loadData() {
            const a = this;
            return l(function* () {
                if (!a.h) return "";
                let qthing = Q(4);
                JSON.stringify(qthing) === "[4]" ? qthing = [4] : qthing = qthing;
                const b = yield Y(a.g, qthing);
                V(b.data, 2);
                let c, d;
                return ((c = J(b.data, P, 2, G)) == null ? void 0 : (d = J(c, fd, 3, Bd)) == null ? void 0 : nc(d, 1)) || ""
            }())
        }
        firstFrameReady() {
            var a = Array.from(document.getElementsByTagName("script")).filter(b => !b.src.endsWith("/@vite/client"))[0];
            a = !!a && a.src.startsWith("https://www.youtube.com/game_api/") && a.attributes.getNamedItem("defer") === null && a.attributes.getNamedItem("async") === null;
            X(this.g, Pd(Q(1), ud(td(rd(1),
                md(a)))))
        }
        gameReady() {
            X(this.g, Pd(Q(1), ud(rd(2))));
            var a = this.j;
            const b = a.shouldCacheResources !== !1;
            a.shouldCacheResources = !1;
            b && Oe(a)
        }
        onGameDataAvailable(a) {
            Te(this.g, 13);
            return Zd(this.i, a)
        }
        shareInviteCode(a) {
            const b = this;
            return l(function* () {
                if (a.length === 0) throw new U(T, 12, "Invite code cannot be empty");
                if ((new TextEncoder).encode(a).length > 8) throw new U(T, 12, "Invite code provided exceeded 8 bytes");
                var c = b.g;
                var d = Q(13);
                d = kc(d, 11, R, B(a));
                c = yield Y(c, d);
                V(c.data, 12)
            }())
        }
    };

    function Ve(a, b) {
        const c = {
            level: 1,
            source: 1
        };
        b && (c.v = b, c.source = 3, c.message = b.message, c.O = b.stack);
        a.h.log(c)
    }
    var We = class {
        constructor(a) {
            var b = window;
            this.h = a;
            this.g = b;
            this.i = !1;
            this.j = c => {
                Ve(this, c.reason instanceof S ? c.reason : void 0)
            };
            this.o = this.g.onerror;
            this.s = this.g.console.warn;
            this.m = this.g.console.error
        }
        install() {
            this.i || (this.i = !0, this.g.onerror = (a, b, c, d, e) => {
                let f;
                (f = this.o) == null || f.call(this.g, a, b, c, d, e);
                Ve(this, e instanceof S ? e : void 0)
            }, this.g.console.warn = (...a) => {
                this.warn(...a)
            }, this.g.console.error = (...a) => {
                this.error(...a)
            }, this.g.addEventListener("unhandledrejection", this.j))
        }
        error(...a) {
            this.h.log({
                level: 1,
                source: 0
            });
            this.m(...a)
        }
        warn(...a) {
            this.h.log({
                level: 0,
                source: 0
            });
            this.s(...a)
        }
    };

    function Xe(a, b) {
        X(a.h, Qd(Q(6), kd(new ld, b.map((c, d) => {
            c = b[b.length - 1 - d];
            d = new jd;
            a: switch (c.level) {
                case 0:
                    var e = 1;
                    break a;
                case 1:
                    e = 2;
                    break a;
                default:
                    e = 0
            }
            d = E(d, 2, z(e));
            d = E(d, 1, z(Re(c.source)));
            c.v && (e = E(d, 6, z(Se(c.v))), e = E(e, 4, B(c.message)), E(e, 5, B(c.O)), c.v instanceof U && c.v.g !== 0 && (E(d, 7, z(c.v.g)), c.v.data && H(d, 8, c.v.data)));
            return d
        }))))
    }
    var Ye = class {
        constructor() {
            this.g = void 0;
            this.h = W();
            this.g = new Qe;
            this.g.log = this.log.bind(this);
            this.i = new We(this.g);
            this.i.install()
        }
        logError() {
            this.log({
                level: 1,
                source: 2
            })
        }
        logWarning() {
            this.log({
                level: 0,
                source: 2
            })
        }
        log(a) {
            Xe(this, [a])
        }
    };
    const Ze = {
        disableConsoleLog: !1,
        enableNerdStats: !1,
        enableServiceWorker: !1,
        enableServiceWorkerKillswitch: !1
    };

    function $e(a) {
        return typeof a === "boolean" ? a : !1
    }
    let af = null;

    function bf() {
        if (af) return af;
        af = Ze;
        let a;
        const b = (a = window.sdkFlags) != null ? a : "";
        if (b) {
            let c;
            try {
                c = JSON.parse(b)
            } catch (d) {
                return console.error("Failed to parse flags.", d, " Flags string: ", b), af
            }
            typeof c === "object" && c && Object.keys(c).length > 0 && (af = {
                disableConsoleLog: $e(c.disableConsoleLog),
                enableNerdStats: $e(c.enableNerdStats),
                enableServiceWorker: $e(c.enableServiceWorker),
                enableServiceWorkerKillswitch: $e(c.enableServiceWorkerKillswitch)
            })
        }
        return af
    };

    function cf() {
        l(function* () {
            try {
                yield Gc(navigator.serviceWorker, Jc`/null_sw.js`)
            } catch (a) {
                console.error("Failed to register null service worker.", a)
            }
        }())
    }

    function df() {
        l(function* () {
            try {
                yield Gc(navigator.serviceWorker, Jc`/sw.js`)
            } catch (a) {
                console.error("Failed to register service worker.", a)
            }
        }())
    }

    function ef(a) {
        l(function* () {
            try {
                yield ff()
            } catch (b) {
                console.error("Failed to unregister service worker.", b)
            }
            try {
                yield gf(a)
            } catch (b) {
                console.error("Failed to delete cache entries.", b)
            }
        }())
    }

    function ff() {
        return l(function* () {
            if (navigator && "serviceWorker" in navigator) {
                yield navigator.serviceWorker.getRegistration("/");
            }
        }())
    }

    function gf(a) {
        return l(function* () {
            if (a && "keys" in a) {
                var b = yield a.keys();
                b && (yield Promise.all(b.map(c => a.delete(c))))
            }
        }())
    }
    var hf = class {
        constructor() {
            var a = window.caches;
            ne && (bf().enableServiceWorker ? bf().enableServiceWorkerKillswitch ? cf() : df() : ef(a))
        }
    };
    var jf = class {
        constructor() {
            this.j = ne;
            this.m = new ae("AUDIO_EVENT", {
                J: !!1
            });
            this.o = !1;
            this.g = W();
            this.i = vd();
            this.D = Ke();
            this.h = new ae("LIFECYCLE_EVENT");
            this.u = 1E4;
            this.s = 0;
            je(this.g, a => {
                switch (oc(a.data, 1)) {
                    case 2:
                        var b;
                        (b = J(a.data, yd, 3, G)) == null ? b = void 0 : (b = D(b, 1), b = b == null || typeof b === "boolean" ? b : typeof b === "number" ? !!b : void 0, b = b != null ? b : !1);
                        this.j && b !== void 0 && (this.m.dispatchEvent(b), this.o = b);
                        break;
                    case 3:
                        this.h.dispatchEvent(1);
                        b = this.i;
                        b.i = 1;
                        clearTimeout(b.h);
                        b.h = 0;
                        break;
                    case 4:
                        this.h.dispatchEvent(0);
                        Ge(this.i);
                        break;
                    case 5:
                        gc(a.data, zd, 4) && (a = J(a.data, zd, 4, G), this.u = (b = Bb(D(a, 1))) != null ? b : 0);
                        b = this.g;
                        a = Q(8);
                        var c = new Cd;
                        c = E(c, 1, B("1.20250303.0000"));
                        a = I(a, 7, R, c);
                        X(b, a)
                }
            });
            Uc(window, "pointerdown", a => {
                !a.h.isTrusted || Date.now() - this.s < this.u || (this.s = Date.now(), X(this.g, Q(10)))
            }, !0);
            Je(this.i);
            Pe(this.D)
        }
        onAudioEnabledChange(a) {
            Te(this.g, 5);
            return Zd(this.m, a)
        }
        isAudioEnabled() {
            if (!this.j) return !0;
            Te(this.g, 10);
            return this.o
        }
        onPause(a) {
            a.T || Te(this.g, 6);
            return Zd(this.h, b => {
                b === 1 && a()
            })
        }
        onResume(a) {
            Te(this.g,
                7);
            return Zd(this.h, b => {
                b === 0 && a()
            })
        }
        getLanguage() {
            const a = this;
            return l(function* () {
                const b = yield Y(a.g, Q(5));
                V(b.data, 8);
                let c;
                return ((c = J(b.data, P, 2, G)) == null ? void 0 : c.getLanguage()) || "en"
            }())
        }
    };
    const kf = new class {
        constructor(a = ne, b = new oe, c = new me, d = new qe, e = new Ue, f = new Ye, g = new jf, h = new hf) {
            this.g = a;
            this.h = b;
            this.ads = c;
            this.engagement = d;
            this.game = e;
            this.health = f;
            this.system = g;
            document.addEventListener("DOMContentLoaded", () => {
                const k = document.body;
                O(k, "touch-action");
                O(k, "overscroll-behavior");
                O(k, "user-select");
                O(k, "-webkit-user-select");
                O(k, "-ms-user-select");
                O(k, "-moz-user-select");
                O(k, "-o-user-select")
            });
            this.g && (Object.defineProperty(window, "localStorage", {
                    value: null,
                    writable: !1
                }),
                Object.defineProperty(window, "sessionStorage", {
                    value: null,
                    writable: !1
                }), Object.defineProperty(window, "indexedDB", {
                    value: null,
                    writable: !1
                }), Object.defineProperty(window, "caches", {
                    value: null,
                    writable: !1
                }), Object.defineProperty(document, "cookie", {
                    value: null,
                    writable: !1
                }))
        }
    };
    n("ytgame", kf.h);
    n("ytgame.ads", kf.ads);
    n("ytgame.engagement", kf.engagement);
    n("ytgame.game", kf.game);
    n("ytgame.health", kf.health);
    n("ytgame.system", kf.system);
    pe = (a, b) => l(function* () {
        var c = b.id;
        if (c.length !== 11 || !/^[-A-Za-z0-9_]+$/.test(c) || !"AEIMQUYcgkosw048".includes(c[10]) || c === "GU5U2spHI_4") throw new U(T, 15, "Invalid format for content being passed");
        c = Q(15);
        var d = new gd;
        d = E(d, 1, B(b.id));
        c = I(c, 12, R, d);
        c = yield Y(a, c);
        V(c.data, 15)
    }());
}).call(this);
