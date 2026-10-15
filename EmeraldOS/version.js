/* =========================================================
   EMERALDOS VERSION CHANNEL
   EmeraldOS 3.2.Test.1
========================================================= */

const EMERALD_VERSION = {
    name: "EmeraldOS",
    version: "3.2.Test.1",
    channel: "Experimental",
    codename: "Edition Preview",
    isExperimental: true,

    features: [
        "Edition system",
        "Plans comparison page",
        "Win95 BIOS boot",
        "Improved loader",
        "Toast notifications",
        "Experimental UI badges"
    ]
};

function getEmeraldVersion() {
    return EMERALD_VERSION;
}

function isExperimentalBuild() {
    return EMERALD_VERSION.isExperimental === true;
}

function renderBuildBadge() {
    const badge = document.getElementById("build-badge");
    if (!badge) return;

    badge.innerHTML = `
        <span style="
            background:#800080;
            color:white;
            padding:2px 6px;
            border:1px solid #fff;
            font-size:11px;
            font-weight:bold;
        ">
            ${EMERALD_VERSION.version} ${EMERALD_VERSION.channel}
        </span>
    `;
}

window.EMERALD_VERSION = EMERALD_VERSION;
window.getEmeraldVersion = getEmeraldVersion;
window.isExperimentalBuild = isExperimentalBuild;
window.renderBuildBadge = renderBuildBadge;

window.addEventListener("DOMContentLoaded", renderBuildBadge);
