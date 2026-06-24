async function loadGames() {
    try {
        const response = await fetch('games.json');
        const games = await response.json();
        displayGames(games);
    } catch (error) {
        console.error("Error loading games:", error);
    }
}

function displayGames(games) {
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = games.map(game => `
        <div class="game-card" onclick="window.location.href='play.html?id=${game.id}'">
            <img src="${game.thumbnail}" alt="${game.title}">
            <h3>${game.title}</h3>
        </div>
    `).join('');
}

loadGames();
