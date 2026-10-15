var Menu={
preload: function(){

game.stage.backgroundColor='#fff';
game.load.image('botonPlay','images/buttonPlay.png');
},
create: function(){
var boton= this.add.button(game.width/2,game.height/2,'botonPlay',this.IniciarJuego,this);
boton.anchor.setTo(0.5);
},
IniciarJuego: function(){
this.state.start('juego');
}
};
