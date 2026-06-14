// Keep track of the highest z-index so the active window is always on top
let zIndexCounter = 100;

// Update the taskbar clock every second
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// Function to open a new window
function openWindow(title, contentHTML) {
    const container = document.getElementById('windows-container');
    
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
