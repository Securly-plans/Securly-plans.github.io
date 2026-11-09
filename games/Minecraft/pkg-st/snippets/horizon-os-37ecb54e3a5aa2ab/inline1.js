
// The page's own stack pointer, kept whenever no green thread runs, and the
// green threads' while they wait.
let sp, base, entry;
const saved = new Map();
let running = 0;
// What each green thread is doing, for the console: globalThis.horizonFibers.
const fibers = (globalThis.horizonFibers = new Map());

// The module imports `horizon_fiber_suspend` straight from this one when it
// can; when the glue wraps it in a JS shim instead (which can't suspend
// wasm), the shim is replaced as the module is instantiated.
function suspending(imports) {
    for (const space of Object.values(imports ?? {})) {
        for (const name of Object.keys(space)) {
            if (name.startsWith("__wbg_horizon_fiber_suspend_")) space[name] = horizon_fiber_suspend;
        }
    }
    return imports;
}
const instantiate = WebAssembly.instantiate;
WebAssembly.instantiate = (module, imports) => instantiate(module, suspending(imports));
const instantiateStreaming = WebAssembly.instantiateStreaming;
if (instantiateStreaming) {
    WebAssembly.instantiateStreaming = (source, imports) => instantiateStreaming(source, suspending(imports));
}

// A task after the browser's own work, without timers' 4 ms floor.
const channel = new MessageChannel();
const queued = [];
channel.port1.onmessage = () => queued.shift()();
function soon(f) {
    queued.push(f);
    channel.port2.postMessage(0);
}

async function suspend(ms) {
    const id = running;
    const fiber = fibers.get(id);
    fiber.waits += 1;
    fiber.waiting = ms;
    saved.set(id, sp.value);
    sp.value = base;
    running = 0;
    await new Promise((resolve) => (ms > 0 ? setTimeout(resolve, ms) : soon(resolve)));
    sp.value = saved.get(id);
    saved.delete(id);
    running = id;
    fiber.waiting = null;
}

export const horizon_fiber_suspend = typeof WebAssembly.Suspending === "function"
    ? new WebAssembly.Suspending(suspend)
    : () => { throw new Error("this browser can't switch WebAssembly stacks"); };

export function horizon_fiber_supported() {
    return typeof WebAssembly.Suspending === "function" && typeof WebAssembly.promising === "function";
}

export function horizon_fiber_start(exports, id, top, name) {
    fibers.set(id, { name, waits: 0, waiting: null });
    sp ??= exports.__stack_pointer;
    entry ??= WebAssembly.promising(exports.horizon_fiber_entry);
    soon(() => {
        // Nothing of the page's runs now: its stack pointer is at rest.
        base = sp.value;
        sp.value = top;
        running = id;
        entry(id).then(
            () => {
                sp.value = base;
                fibers.delete(id);
            },
            (e) => {
                sp.value = base;
                fibers.delete(id);
                console.error(`Horizon: green thread ${name} failed: ${e}`);
            });
        if (running === id) running = 0;
        sp.value = base;
    });
}
