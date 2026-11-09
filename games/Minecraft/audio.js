// Browsers keep sound off until the player clicks or presses a key: the
// game's audio contexts (cpal's) start suspended and are resumed then. Loaded
// before the game's glue, which keeps the AudioContext class it finds.
const contexts = [];
if (globalThis.AudioContext) {
    const BrowserAudioContext = globalThis.AudioContext;
    globalThis.AudioContext = class extends BrowserAudioContext {
        constructor(...args) {
            super(...args);
            contexts.push(this);
        }
    };
    const resume = () => {
        for (const ctx of contexts) {
            if (ctx.state === "suspended") ctx.resume().catch(() => {});
        }
    };
    addEventListener("pointerdown", resume, true);
    addEventListener("keydown", resume, true);
}
