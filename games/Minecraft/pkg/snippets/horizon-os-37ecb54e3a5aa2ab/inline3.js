
export function horizon_fetch_sync(url) {
    // The offline page (web/package.py) holds its files itself: a file:// page can't fetch.
    const held = globalThis.horizonHeldFile?.(url);
    if (held) return held;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    // Synchronous requests on the main thread can't ask for an ArrayBuffer:
    // read the bytes as a binary string instead.
    xhr.overrideMimeType("text/plain; charset=x-user-defined");
    xhr.send();
    if (xhr.status !== 200 && xhr.status !== 0) return undefined;
    const text = xhr.responseText;
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
    return bytes;
}
