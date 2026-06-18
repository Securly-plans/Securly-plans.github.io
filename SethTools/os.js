// ==========================================
// 1. GLOBAL VARIABLES & CLOCK
// =========================================
let zIndexCounter = 100;

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// START MENU LOGIC
// ==========================================
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');

// Toggle menu when clicking the Start button
startBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents the document click listener below from firing immediately
    startMenu.classList.toggle('show');
    
    // Visually press the start button down
    if (startMenu.classList.contains('show')) {
        startBtn.style.borderColor = '#000 #fff #fff #000';
        startBtn.style.background = '#dfdfdf';
    } else {
        startBtn.style.borderColor = '#fff #000 #000 #fff';
        startBtn.style.background = '#c0c0c0';
    }
});

// Close the start menu if you click anywhere else on the screen
document.addEventListener('click', (e) => {
    if (startMenu.classList.contains('show') && !startMenu.contains(e.target)) {
        startMenu.classList.remove('show');
        startBtn.style.borderColor = '#fff #000 #000 #fff';
        startBtn.style.background = '#c0c0c0';
    }
});

// ==========================================
// 2. WINDOW MANAGEMENT & DRAGGING
// ==========================================
function openWindow(title, contentHTML) {
    const container = document.getElementById('windows-container');
    const taskbarApps = document.getElementById('taskbar-apps');
    
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

    // --- NEW: Create the Taskbar Tab ---
    const tab = document.createElement('div');
    tab.className = 'taskbar-tab active';
    tab.innerText = title;
    taskbarApps.appendChild(tab);

    // Toggle Minimize / Restore when taskbar tab is clicked
    tab.addEventListener('click', () => {
        if (win.style.display === 'none') {
            // Restore window
            win.style.display = 'flex';
            win.style.zIndex = ++zIndexCounter;
            
            // Visually push all tabs up, then press this one down
            document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        } else {
            // If it's visible but behind other windows, just bring it to the front
            if (win.style.zIndex < zIndexCounter) {
                win.style.zIndex = ++zIndexCounter;
                document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            } else {
                // If it's already the front window, minimize it
                win.style.display = 'none';
                tab.classList.remove('active');
            }
        }
    });

    // Bring to front and depress tab on window click
    win.addEventListener('mousedown', () => {
        win.style.zIndex = ++zIndexCounter;
        document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });

    // Close button (Now removes the window AND the taskbar tab)
    win.querySelector('.close-btn').addEventListener('click', () => {
        win.remove();
        tab.remove();
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
    
    // Visually update tabs so only the new one is "pressed down"
    document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
}

// ==========================================
// 3. FILE SYSTEM & UPGRADED NOTES
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

function openNotes(filename = 'New_Note.txt') {
    const savedText = FileSystem.readFile(filename);
    
    // We generate a random ID for the inputs so it doesn't break if you open two Note windows at once
    const safeId = Math.floor(Math.random() * 10000); 
    
    const notesHTML = `
        <div style="background: #c0c0c0; padding: 4px; display: flex; gap: 5px; border-bottom: 2px solid #000;">
            <input type="text" id="fname-${safeId}" value="${filename}" style="flex: 1; padding: 2px;">
            <button onclick="
                FileSystem.saveFile(document.getElementById('fname-${safeId}').value, document.getElementById('fcontent-${safeId}').value);
                if (document.getElementById('explorer-content')) renderFileExplorer(); // Auto-refresh Explorer if open
            ">Save</button>
        </div>
        <textarea id="fcontent-${safeId}" style="width:100%; height:calc(100% - 35px); resize:none; border:none; outline:none; padding:5px; box-sizing: border-box;">${savedText}</textarea>
    `;
    openWindow('Notes', notesHTML);
}

// ==========================================
// 4. APP STORE & PERSISTENCE
// ==========================================
const appCatalog = [
    { 
        name: 'Calculator.EOSas', 
        icon: '🧮', 
        content: `
            <div style="display: flex; flex-direction: column; height: 100%; background: #ddd; padding: 5px;">
                <input type="text" id="calc-display" disabled style="font-size: 20px; text-align: right; padding: 5px; margin-bottom: 5px; border: 2px inset #fff;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; flex: 1;">
                    <button onclick="document.getElementById('calc-display').value = ''" style="grid-column: span 3;">C</button>
                    <button onclick="document.getElementById('calc-display').value += '/'">/</button>
                    <button onclick="document.getElementById('calc-display').value += '7'">7</button>
                    <button onclick="document.getElementById('calc-display').value += '8'">8</button>
                    <button onclick="document.getElementById('calc-display').value += '9'">9</button>
                    <button onclick="document.getElementById('calc-display').value += '*'">*</button>
                    <button onclick="document.getElementById('calc-display').value += '4'">4</button>
                    <button onclick="document.getElementById('calc-display').value += '5'">5</button>
                    <button onclick="document.getElementById('calc-display').value += '6'">6</button>
                    <button onclick="document.getElementById('calc-display').value += '-'">-</button>
                    <button onclick="document.getElementById('calc-display').value += '1'">1</button>
                    <button onclick="document.getElementById('calc-display').value += '2'">2</button>
                    <button onclick="document.getElementById('calc-display').value += '3'">3</button>
                    <button onclick="document.getElementById('calc-display').value += '+'">+</button>
                    <button onclick="document.getElementById('calc-display').value += '0'" style="grid-column: span 2;">0</button>
                    <button onclick="document.getElementById('calc-display').value += '.'">.</button>
                    <button onclick="try { document.getElementById('calc-display').value = eval(document.getElementById('calc-display').value) } catch(e) { document.getElementById('calc-display').value = 'Error' }">=</button>
                </div>
            </div>
        ` 
    },
    { 
        name: 'Paint.EOSas', 
        icon: '🎨', 
        content: `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="padding: 5px; background: #c0c0c0; border-bottom: 2px solid #000;">
                    <button onclick="clearCanvas()">Clear Canvas</button>
                </div>
                <div style="flex: 1; overflow: hidden; position: relative;">
                    <canvas id="paint-canvas" width="600" height="400" 
                        style="background: white; cursor: crosshair; display: block;"
                        onmousedown="startDraw(event)" 
                        onmousemove="draw(event)" 
                        onmouseup="stopDraw()" 
                        onmouseout="stopDraw()">
                    </canvas>
                </div>
            </div>
        ` 
    },
    {  
        name: 'Emerald.Aweb',
        icon: '🌐',
        content:`<iframe src= Securly-plans.github.io 'style= width:100%; height:98%; border:none;'></iframe>`
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

// ==========================================
// 6. PAINT APP LOGIC
// ==========================================
let isDrawing = false;
let paintCtx = null;

function startDraw(e) {
    isDrawing = true;
    const canvas = document.getElementById('paint-canvas');
    if (!paintCtx) paintCtx = canvas.getContext('2d');
    
    // Get the exact position of the mouse relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    paintCtx.beginPath();
    paintCtx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    const canvas = document.getElementById('paint-canvas');
    
    // Get the exact position of the mouse relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    paintCtx.lineWidth = 3;
    paintCtx.lineCap = 'round';
    paintCtx.lineTo(x, y);
    paintCtx.stroke();
}

function stopDraw() {
    isDrawing = false;
    if (paintCtx) {
        paintCtx.closePath();
    }
}

function clearCanvas() {
    const canvas = document.getElementById('paint-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// ==========================================
// 7. FILE EXPLORER APP
// ==========================================

function getFilesList() {
    let files = [];
    // Loop through everything in local storage
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        // Only grab things we explicitly saved as files
        if (key.startsWith('os_file_')) {
            files.push(key.replace('os_file_', '')); // Remove prefix for display
        }
    }
    return files;
}

function deleteFile(filename) {
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
        localStorage.removeItem('os_file_' + filename);
        renderFileExplorer(); // Live-refresh the window
    }
}

function renderFileExplorer() {
    const container = document.getElementById('explorer-content');
    if (!container) return; // If window is closed, do nothing
    
    const files = getFilesList();
    
    if (files.length === 0) {
        container.innerHTML = '<p style="padding: 10px; color: #666; font-style: italic;">Folder is empty. Open Notes to save a file!</p>';
        return;
    }
    
    // Build an HTML table to display the files
    let html = '<table style="width: 100%; border-collapse: collapse; text-align: left;">';
    html += '<tr style="background: #e0e0e0; border-bottom: 2px solid #999;">
                <th style="padding: 5px;">Filename</th>
                <th style="padding: 5px; width: 80px;">Actions</th>
             </tr>';
             
    files.forEach(file => {
        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 5px; cursor: pointer; color: #000080; text-decoration: underline;" onclick="openNotes('${file}')">
                    📄 ${file}
                </td>
                <td style="padding: 5px;">
                    <button onclick="deleteFile('${file}')" style="color: red; cursor: pointer;">Delete</button>
                </td>
            </tr>
        `;
    });
    html += '</table>';
    container.innerHTML = html;
}

function openFileExplorer() {
    // We wrap the content in a div with an ID so we can live-refresh it when files are deleted or added
    const content = `<div id="explorer-content" style="height: 100%; background: #fff; overflow-y: auto;"></div>`;
    openWindow('File Explorer', content);
    
    // Give the DOM a tiny fraction of a second to attach the window before rendering the files inside it
    setTimeout(renderFileExplorer, 10);
}

















