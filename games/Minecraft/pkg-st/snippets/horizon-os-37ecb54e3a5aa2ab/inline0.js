
export function horizon_console(level, message) {
    if (level <= 1) console.error(message);
    else if (level === 2) console.warn(message);
    else console.log(message);
}

let wantLock = false;
let lostLock = false;
let hooked = null;
export function horizon_pointer_lock_lost() {
    const lost = lostLock;
    lostLock = false;
    return lost;
}
function lock(canvas) {
    // Refused outside a click or key press: by a rejected promise, or a throw.
    try {
        const p = canvas.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
    } catch (e) {}
}
export function horizon_pointer_locked() {
    const canvas = document.querySelector("canvas");
    return !!canvas && document.pointerLockElement === canvas;
}
export function horizon_pointer_lock(want) {
    wantLock = want;
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    if (hooked === null) {
        // Escape while the pointer is locked only releases the lock: the page
        // never sees the key, so the game hears of it as a lost lock.
        document.addEventListener("pointerlockchange", () => {
            if (wantLock && !document.pointerLockElement) lostLock = true;
        });
    }
    if (hooked !== canvas) {
        hooked = canvas;
        // Browsers refuse the lock asked with Escape (no user gesture), and for
        // a moment after Escape let it go: the game then waits for the next
        // click or key. The click that takes the lock only takes the lock, so
        // it doesn't swing a sword.
        let swallowUp = false;
        window.addEventListener("pointerdown", (e) => {
            if (wantLock && e.target === canvas && document.pointerLockElement !== canvas) {
                lock(canvas);
                swallowUp = true;
                e.stopImmediatePropagation();
            }
        }, true);
        window.addEventListener("pointerup", (e) => {
            if (swallowUp) {
                swallowUp = false;
                e.stopImmediatePropagation();
            }
        }, true);
        window.addEventListener("keydown", (e) => {
            if (wantLock && e.key !== "Escape" && document.pointerLockElement !== canvas) lock(canvas);
        }, true);
    }
    if (want) {
        if (document.pointerLockElement !== canvas) lock(canvas);
    } else if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

let picked = null;
export function horizon_pick_file(kind, accept) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async () => {
        const file = input.files && input.files[0];
        if (file) picked = [kind, new Uint8Array(await file.arrayBuffer())];
    };
    input.click();
}
export function horizon_take_picked() {
    const p = picked;
    picked = null;
    return p;
}
