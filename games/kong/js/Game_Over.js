var bg;
var GameOver={
preload: function(){

game.stage.backgroundColor='#fff';
game.load.image('gameover','images/GameOverMario.png');
},
create: function(){

bg=game.add.tileSprite(0,0,800,600,'gameover')
},
upload: function(){

}
};
