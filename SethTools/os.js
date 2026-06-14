// ==========================================
// 1. GLOBAL VARIABLES & CLOCK
// ==========================================
let zIndexCounter = 100;

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 2. WINDOW MANAGEMENT & DRAGGING
// ==========================================
function openWindow(title, contentHTML) {
    const container = document.getElementById('windows-container');
    
    // Create window element
    const win = document.createElement('div');
    win.className = 'window';
    win.style.zIndex = ++zIndexCounter;
    
    // Randomize starting position
    win.style.top = (50 + Math.random() * 50) + 'px';
    win.style.left = (50 + Math.random() * 50) + 'px';

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <button class="close-btn">X</button>
        </div>
        <div class="window-content">${contentHTML}</div>
    `;

    // Bring to front on click
    win.addEventListener('mousedown', () => {
        win.style.zIndex = ++zIndexCounter;
    });

    // Close button
    win.querySelector('.close-btn').addEventListener('click', () => {
        win.remove();
    });

    // --- Drag Logic ---
    const titleBar = win.querySelector('.title-bar');
    let isDragging = false, startX, startY, initialLeft, initialTop;

    titleBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = win.offsetLeft;
        initialTop = win.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        win.style.left = (initialLeft + dx) + 'px';
        win.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    container.appendChild(win);
}

// ==========================================
// 3. FILE SYSTEM (LOCALSTORAGE)
// ==========================================
const FileSystem = {
    saveFile: function(filename, content) {
        localStorage.setItem('os_file_' + filename, content);
        alert(`${filename} has been saved!`);
    },
    readFile: function(filename) {
        return localStorage.getItem('os_file_' + filename) || '';
    }
};

function openNotes() {
    const savedText = FileSystem.readFile('my_notes.txt');
    const notesHTML = `
        <textarea id="notes-input" style="width:100%; height:80%; resize:none; border:none; outline:none;">${savedText}</textarea>
        <button onclick="FileSystem.saveFile('my_notes.txt', document.getElementById('notes-input').value)">Save File</button>
    `;
    openWindow('Notes', notesHTML);
}

// ==========================================
// 4. APP STORE & PERSISTENCE
// ==========================================
const appCatalog = [
    { 
        name: 'Calculator', 
        icon: '🧮', 
        content: '<h3>Calculator App</h3><p>Imagine a cool calculator here.</p>' 
    },
    { 
        name: 'Paint', 
        icon: '🎨', 
        content: '<h3>Paint App</h3><p>Canvas drawing area goes here.</p>' 
    }
];

function renderDesktopApps() {
    const zone = document.getElementById('installed-apps-zone');
    if (!zone) return; // Safety check in case the HTML isn't loaded yet
    
    zone.innerHTML = ''; // Clear out the old icons
    const installedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
    
    installedApps.forEach(appName => {
        const app = appCatalog.find(a => a.name === appName);
        if (app) {
            const newIcon = document.createElement('div');
            newIcon.className = 'icon';
            newIcon.innerHTML = `${app.icon}<br>${app.name}`;
            newIcon.onclick = () => openWindow(app.name, app.content);
            zone.appendChild(newIcon);
        }
    });
}

function getAppStoreHTML() {
    const installedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
    let storeHTML = '<div style="display: flex; gap: 15px; padding: 10px;">';
    
    appCatalog.forEach((app, index) => {
        const isInstalled = installedApps.includes(app.name);
        
        const buttonHTML = isInstalled 
            ? `<button onclick="uninstallApp(${index})" style="color: red; border: 1px solid #000; cursor: pointer;">Uninstall</button>`
            : `<button onclick="installApp(${index})" style="border: 1px solid #000; cursor: pointer;">Install</button>`;
            
        storeHTML += `
            <div style="border: 2px solid #000; padding: 10px; text-align: center; background: #eee;">
                <div style="font-size: 30px;">${app.icon}</div>
                <div style="font-weight: bold; margin-bottom: 5px;">${app.name}</div>
                ${buttonHTML}
            </div>
        `;
    });
    
    storeHTML += '</div>';
    return storeHTML;
}

function openAppStore() {
    const content = `<div id="app-store-ui">${getAppStoreHTML()}</div>`;
    openWindow('App Store', content);
}

function installApp(appIndex) {
    const app = appCatalog[appIndex];
    let installedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
    
    if (!installedApps.includes(app.name)) {
        installedApps.push(app.name);
        localStorage.setItem('os_installed_apps', JSON.stringify(installedApps));
        
        renderDesktopApps(); 
        
        const storeUI = document.getElementById('app-store-ui');
        if (storeUI) storeUI.innerHTML = getAppStoreHTML();
    }
}

function uninstallApp(appIndex) {
    const app = appCatalog[appIndex];
    let installedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
    
    installedApps = installedApps.filter(appName => appName !== app.name);
    localStorage.setItem('os_installed_apps', JSON.stringify(installedApps));
    
    renderDesktopApps(); 
    
    const storeUI = document.getElementById('app-store-ui');
    if (storeUI) storeUI.innerHTML = getAppStoreHTML();
}

// ==========================================
// 5. INITIALIZATION
// ==========================================
// Draw the installed apps onto the desktop once the page finishes loading
window.addEventListener('DOMContentLoaded', () => {
    renderDesktopApps();
});
