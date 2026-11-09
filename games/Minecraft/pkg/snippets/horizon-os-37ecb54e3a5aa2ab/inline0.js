
const sockets = new Map();
let onEvent = null, take = null, onListen = null;
function open(id, url, host, port, code, relays) {
    if (code) return joinShared(id, code, relays);
    if (!url) {
        const scheme = location.protocol === "https:" ? "wss" : "ws";
        const name = host.includes(":") ? `[${host}]` : host;
        url = `${scheme}://${name}:${port}/`;
    }
    let ws;
    try {
        ws = new WebSocket(url);
    } catch (e) {
        onEvent(id, 2, null, String(e.message ?? e));
        return;
    }
    ws.binaryType = "arraybuffer";
    sockets.set(id, {
        ready: () => ws.readyState === WebSocket.OPEN,
        send: (data) => ws.send(data),
        close: () => ws.close(),
    });
    ws.onopen = () => {
        onEvent(id, 0, null, "");
        flush(id);
    };
    ws.onmessage = ({ data }) => {
        if (data instanceof ArrayBuffer) onEvent(id, 1, new Uint8Array(data), "");
        else onEvent(id, 3, null, data);
    };
    ws.onclose = ({ code, reason }) => {
        sockets.delete(id);
        onEvent(id, 2, null, reason || (code === 1006 ? "Connection refused" : `closed (${code})`));
    };
}
function flush(id) {
    const socket = sockets.get(id);
    if (socket && socket.ready()) {
        for (const data of take(id)) socket.send(data);
    }
}
function close(id) {
    const socket = sockets.get(id);
    sockets.delete(id);
    socket?.close();
}

// EaglerSPRelay's packets: an id, then the fields; strings are ASCII after
// a u8 length, descriptions and candidates bytes after a u16 one.
const ascii = (bytes) => new TextDecoder("latin1").decode(bytes);
const str8 = (s) => [s.length & 255, ...new TextEncoder().encode(s.slice(0, 255))];
function bytes16(s) {
    const b = new TextEncoder().encode(s);
    return [b.length >> 8, b.length & 255, ...b];
}
const packet = (id, ...fields) => new Uint8Array([id, ...fields.flat()]);
function readStr8(b, o) {
    return [ascii(b.subarray(o + 1, o + 1 + b[o])), o + 1 + b[o]];
}
function readBytes16(b, o) {
    const n = (b[o] << 8) | b[o + 1];
    return [ascii(b.subarray(o + 2, o + 2 + n)), o + 2 + n];
}
// RelayPacket01ICEServers: a u16 count of 'S' (STUN) or 'T' (TURN, with a
// user and a password) servers.
function iceServers(b) {
    const servers = [];
    let o = 3;
    for (let n = (b[1] << 8) | b[2]; n > 0; n--) {
        const turn = b[o++] === 84;
        let url, user, pass;
        [url, o] = readBytes16(b, o);
        [user, o] = readStr8(b, o);
        [pass, o] = readStr8(b, o);
        servers.push(turn ? { urls: url, username: user, credential: pass } : { urls: url });
    }
    return servers;
}
// The whole description once the candidates are in it: the relay passes one
// description and one candidate message each way, so candidates ride in the
// description and the candidate messages carry none.
async function described(pc, description) {
    await pc.setLocalDescription(description);
    if (pc.iceGatheringState !== "complete") {
        await new Promise((done) => {
            const timer = setTimeout(done, 5000);
            pc.addEventListener("icegatheringstatechange", () => {
                if (pc.iceGatheringState === "complete") {
                    clearTimeout(timer);
                    done();
                }
            });
        });
    }
    const d = pc.localDescription;
    return JSON.stringify({ type: d.type, sdp: d.sdp });
}
// A data channel as a socket: binary pieces of at most 16 KiB, held back
// while the browser's buffer is full.
function channelSocket(id, channel, pc) {
    const queue = [];
    const pump = () => {
        while (queue.length && channel.readyState === "open" && channel.bufferedAmount < 4 << 20) {
            channel.send(queue.shift());
        }
    };
    channel.binaryType = "arraybuffer";
    channel.bufferedAmountLowThreshold = 1 << 20;
    channel.onbufferedamountlow = pump;
    channel.onmessage = ({ data }) => {
        if (data instanceof ArrayBuffer) onEvent(id, 1, new Uint8Array(data), "");
    };
    channel.onclose = () => {
        sockets.delete(id);
        pc.close();
        onEvent(id, 2, null, "The shared world closed the connection");
    };
    sockets.set(id, {
        ready: () => channel.readyState === "open",
        send(data) {
            if (typeof data === "string") return;
            for (let i = 0; i < data.length; i += 16384) queue.push(data.subarray(i, i + 16384));
            pump();
        },
        close() {
            channel.close();
            pc.close();
        },
    });
}
// Joining a shared world: each relay in turn until one knows the code.
function joinShared(id, code, relays) {
    let next = 0, why = "No relay could be reached";
    const fail = (reason) => onEvent(id, 2, null, reason);
    const attempt = () => {
        if (next >= relays.length) return fail(why);
        let ws;
        try {
            ws = new WebSocket(relays[next++]);
        } catch (e) {
            return attempt();
        }
        ws.binaryType = "arraybuffer";
        let pc = null, opened = false, answered = false, settled = false, retry = true;
        sockets.set(id, { ready: () => false, send() {}, close() { settled = true; ws.close(); pc?.close(); } });
        const timer = setTimeout(() => {
            if (!opened) {
                retry = false;
                why = "Could not reach the shared world (timed out)";
                ws.close();
                pc?.close();
            }
        }, 25000);
        // RelayPacket05ClientSuccess once the channel is open and the host's
        // candidate message came (the relay wants it in that order).
        const succeed = () => {
            if (opened && answered && !settled) {
                settled = true;
                ws.send(packet(0x05, str8("")));
                ws.close();
            }
        };
        ws.onopen = () => ws.send(packet(0x00, [2, 1], str8(code)));
        ws.onmessage = async ({ data }) => {
            const b = new Uint8Array(data);
            try {
                if (b[0] === 0x01) {
                    pc = new RTCPeerConnection({ iceServers: iceServers(b) });
                    const channel = pc.createDataChannel("horizon", { ordered: true });
                    channel.onopen = () => {
                        opened = true;
                        clearTimeout(timer);
                        channelSocket(id, channel, pc);
                        onEvent(id, 0, null, "");
                        flush(id);
                        succeed();
                    };
                    const offer = await described(pc, await pc.createOffer());
                    ws.send(packet(0x04, str8(""), bytes16(offer)));
                } else if (b[0] === 0x04) {
                    const [description] = readBytes16(b, readStr8(b, 1)[1]);
                    await pc.setRemoteDescription(JSON.parse(description));
                    ws.send(packet(0x03, str8(""), bytes16("[]")));
                } else if (b[0] === 0x03) {
                    answered = true;
                    succeed();
                } else if (b[0] === 0xfe && !opened) {
                    // RelayPacketFEDisconnectClient: the id, a code, the reason.
                    const o = readStr8(b, 1)[1];
                    retry = false;
                    why = readBytes16(b, o + 1)[0] || "The shared world refused the connection";
                } else if (b[0] === 0xff) {
                    // RelayPacketFFErrorCode: 5 is a code this relay doesn't know.
                    retry = b[1] === 5 || b[1] === 4;
                    why = b[1] === 5 ? "No shared world has that code" : readBytes16(b, 2)[0];
                }
            } catch (e) {
                retry = false;
                why = String(e.message ?? e);
                ws.close();
            }
        };
        ws.onclose = () => {
            if (opened || settled) return;
            clearTimeout(timer);
            pc?.close();
            if (retry) attempt();
            else fail(why);
        };
    };
    attempt();
}
// Hosting a shared world: the first relay that gives a code.
const listeners = new Map();
function listen(lid, name, relays) {
    let next = 0, closed = false, ws = null;
    const peers = new Map();
    listeners.set(lid, {
        close() {
            closed = true;
            ws?.close();
            for (const p of peers.values()) if (!p.open) p.pc.close();
        },
    });
    const attempt = () => {
        if (closed) return;
        if (next >= relays.length) return onListen(lid, 2, "No relay could be reached");
        try {
            ws = new WebSocket(relays[next++]);
        } catch (e) {
            return attempt();
        }
        ws.binaryType = "arraybuffer";
        let servers = [], code = null;
        ws.onopen = () => ws.send(packet(0x00, [1, 1], str8(name)));
        ws.onmessage = async ({ data }) => {
            const b = new Uint8Array(data);
            try {
                if (b[0] === 0x00) {
                    code = readStr8(b, 3)[0];
                    console.info(`Horizon: shared world ${code} on ${ws.url}`);
                    onListen(lid, 0, code);
                } else if (b[0] === 0x01) {
                    servers = iceServers(b);
                } else if (b[0] === 0x02) {
                    const [peer] = readStr8(b, 1);
                    const pc = new RTCPeerConnection({ iceServers: servers });
                    const p = { pc, open: false };
                    peers.set(peer, p);
                    pc.ondatachannel = ({ channel }) => {
                        const opened = () => {
                            p.open = true;
                            peers.delete(peer);
                            const id = onListen(lid, 1, peer);
                            channelSocket(id, channel, pc);
                            onEvent(id, 0, null, "");
                        };
                        if (channel.readyState === "open") opened();
                        else channel.onopen = opened;
                    };
                } else if (b[0] === 0x04) {
                    const [peer, o] = readStr8(b, 1);
                    const p = peers.get(peer);
                    if (!p) return;
                    await p.pc.setRemoteDescription(JSON.parse(readBytes16(b, o)[0]));
                    const answer = await described(p.pc, await p.pc.createAnswer());
                    ws.send(packet(0x04, str8(peer), bytes16(answer)));
                } else if (b[0] === 0x03) {
                    ws.send(packet(0x03, str8(readStr8(b, 1)[0]), bytes16("[]")));
                } else if (b[0] === 0x06 || b[0] === 0xfe) {
                    const [peer] = readStr8(b, 1);
                    const p = peers.get(peer);
                    if (p && !p.open) p.pc.close();
                    peers.delete(peer);
                }
            } catch (e) {
                console.warn("Horizon: shared world peer:", e);
            }
        };
        ws.onclose = ({ code: status, reason }) => {
            if (closed) return;
            console.warn(`Horizon: the relay closed the shared world (${status} ${reason})`);
            if (code === null) attempt();
            else onListen(lid, 2, "The relay closed the shared world");
        };
    };
    attempt();
}
function onPage(data) {
    if (data.socket === "open") open(data.id, data.url, data.host, data.port, data.code, data.relays);
    else if (data.socket === "flush") flush(data.id);
    else if (data.socket === "listen") listen(data.id, data.name, data.relays);
    else if (data.socket === "unlisten") {
        listeners.get(data.id)?.close();
        listeners.delete(data.id);
    } else close(data.id);
}
export function horizon_socket_install(events, taker, listening) {
    onEvent = events;
    take = taker;
    onListen = listening;
    // What workers ask of the page arrives at the worker objects the page
    // made (workers.rs), which hand it here.
    globalThis.horizonSocket = onPage;
}
// A worker's blocking GET (workers may make synchronous requests): the body
// of a 2xx answer, or null. An https page asks for https.
export function horizon_http_get(url) {
    if (location.protocol === "https:") url = url.replace(/^http:/, "https:");
    try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send();
        return xhr.status >= 200 && xhr.status < 300 ? new Uint8Array(xhr.response) : null;
    } catch (e) {
        return null;
    }
}
export function horizon_socket_ask(data) {
    if (typeof window === "undefined") self.postMessage(data);
    else onPage(data);
}
