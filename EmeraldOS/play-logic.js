async function initPlayer() {
    // 1. Get the "slug" or ID from the URL (e.g., ?id=1)
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('id');

    try {
        // 2. Fetch your JSON database
        const response = await fetch('games.json');
        const games = await response.json();

        // 3. Find the specific game
        const game = games.find(g => g.id == gameId);

        if (game) {
            document.title = `${game.title} - Emerald`;
            document.getElementById('gameTitle').innerText = game.title;
            document.getElementById('gameFrame').src = game.url;
            // You can add more fields to your JSON like "description"
            document.getElementById('gameDescription').innerText = game.description || "Enjoy this game on Emerald!";
        } else {
            document.getElementById('gameTitle').innerText = "Game Not Found";
        }
    } catch (error) {
        console.error("Error loading game details:", error);
    }
}

initPlayer();
