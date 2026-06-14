// Keep track of the highest z-index so the active window is always on top
let zIndexCounter = 100;

// Update the taskbar clock every second
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// --- App Store Logic ---

// The catalog of apps available to download
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

// Open the App Store window
function openAppStore() {
    let storeHTML = '<div style="display: flex; gap: 15px; padding: 10px;">';
    
    // Loop through our catalog and create a card for each app
    appCatalog.forEach((app, index) => {
        storeHTML += `
            <div style="border: 2px solid #000; padding: 10px; text-align: center; background: #eee;">
                <div style="font-size: 30px;">${app.icon}</div>
                <div style="font-weight: bold; margin-bottom: 5px;">${app.name}</div>
                <button onclick="installApp(${index})">Install</button>
            </div>
        `;
    });
    
    storeHTML += '</div>';
    openWindow('App Store', storeHTML);
}

// Function to install the app to the desktop
function installApp(appIndex) {
    const app = appCatalog[appIndex];
    const desktop = document.getElementById('desktop');
    
    // Create the new icon element
    const newIcon = document.createElement('div');
    newIcon.className = 'icon';
    newIcon.innerHTML = `${app.icon}<br>${app.name}`;
    
    // Attach the click event to open the app
    newIcon.addEventListener('click', () => {
        openWindow(app.name, app.content);
    });
    
    // Add it to the desktop
    desktop.appendChild(newIcon);
}

// Function to open a new window
function openWindow(title, contentHTML) {
    const container = document.getElementById('windows-container');

    // --- File System Logic ---
const FileSystem = {
    // Save a file to local storage
    saveFile: function(filename, content) {
        localStorage.setItem('os_file_' + filename, content);
        alert(`${filename} has been saved!`);
    },
    
    // Read a file from local storage
    readFile: function(filename) {
        return localStorage.getItem('os_file_' + filename) || '';
    }
};

// --- Updated Notes App ---
// Now our notes app can actually save data!
function openNotes() {
    const savedText = FileSystem.readFile('my_notes.txt');
    const notesHTML = `
        <textarea id="notes-input" style="width:100%; height:80%; resize:none; border:none; outline:none;">${savedText}</textarea>
        <button onclick="FileSystem.saveFile('my_notes.txt', document.getElementById('notes-input').value)">Save File</button>
    `;
    openWindow('Notes', notesHTML);
}
    
    // Create the main window div
    const win = document.createElement('div');
    win.className = 'window';
    win.style.zIndex = ++zIndexCounter;
    
    // Randomize the starting position slightly so windows don't stack perfectly
    win.style.top = (50 + Math.random() * 50) + 'px';
    win.style.left = (50 + Math.random() * 50) + 'px';

    // Inject the HTML for the title bar and content
    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <button class="close-btn">X</button>
        </div>
        <div class="window-content">${contentHTML}</div>
    `;

    // Bring window to the front when clicked anywhere on it
    win.addEventListener('mousedown', () => {
        win.style.zIndex = ++zIndexCounter;
    });

    // Close window functionality
    win.querySelector('.close-btn').addEventListener('click', () => {
        win.remove();
    });

    // --- Drag and Drop Logic ---
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
        
        // Calculate how far the mouse has moved
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        // Apply the new position
        win.style.left = (initialLeft + dx) + 'px';
        win.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Add the new window to the screen
    container.appendChild(win);
}
