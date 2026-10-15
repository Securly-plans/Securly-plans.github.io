

var game = new Phaser.Game(800, 600, Phaser.AUTO,'');
game.state.add('Menu',Menu);
game.state.add('juego',juego);
game.state.add('Game_Over',GameOver);
game.state.add('TuGanas',TuGanas);
game.state.start('Menu');
