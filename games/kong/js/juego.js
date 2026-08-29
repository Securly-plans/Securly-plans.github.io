var timer = 0;
var total = 0;
var contador=0;
var sw1=0;
var sonido;
var Donkeykong;
var juego={


   preload: function() {
     game.load.audio("Audio","audios/DonkeykongMusic.mp3");

    this.game.stage.scale.pageAlignHorizontally = true;
    game.load.spritesheet('princesa', 'images/princess.png',56,42);
      game.load.spritesheet('Barril', 'images/Barriles.png',48,30);
      game.load.image('star', 'images/star.png');
    game.load.image('jungle', 'images/junglE.png');
    game.load.spritesheet('Donkeykong','images/newMonkey.png',84,52);
    game.load.spritesheet('mario','images/Mari0.png',29,32);
    game.load.image('ground', 'images/grOund.png');
   game.load.image('ledge', 'images/ledgE.png');
   game.physics.startSystem(Phaser.Physics.ARCADE);

 },

   create: function() {
   sonido = game.add.audio("Audio");
    sonido.play('',0,1,true);

    game.add.sprite(0, 0, 'jungle');

  game.world.setBounds(0,0,800,600);

      platforms = game.add.group();


      platforms.enableBody = true;


      var ground = platforms.create(0, game.world.height - 64, 'ground');


      ground.scale.setTo(2, 2);

      ground.body.immovable = true;

      var ledge = platforms.create(100,130 , 'ledge');

      ledge.body.immovable = true;

       ledge = platforms.create(100, 220, 'ledge');

      ledge.body.immovable = true;

      ledge = platforms.create(10, 300, 'ledge');

     ledge.body.immovable = true;

    ledge = platforms.create(30,400,'ledge');

      ledge.body.immovable = true;

      ledge = platforms.create(700,170,'ledge');

        ledge.body.immovable = true;
        ledge = platforms.create(20,50,'ledge');

          ledge.body.immovable = true;
        ledge = platforms.create(70, 470, 'ledge');

       ledge.body.immovable = true;

       ledge = platforms.create(300, 80, 'ledge');

      ledge.body.immovable = true;

     ledge = platforms.create(320,200,'ledge');

       ledge.body.immovable = true;

       ledge = platforms.create(290,300,'ledge');

         ledge.body.immovable = true;
         ledge = platforms.create(270, 400, 'ledge');

        ledge.body.immovable = true;
        ledge = platforms.create(300, 480, 'ledge');

       ledge.body.immovable = true;
       ledge = platforms.create(500, 120, 'ledge');

      ledge.body.immovable = true;
      ledge = platforms.create(550, 220, 'ledge');

     ledge.body.immovable = true;
     ledge = platforms.create(500, 300, 'ledge');

    ledge.body.immovable = true;
    ledge = platforms.create(500, 400, 'ledge');

   ledge.body.immovable = true;

   ledge = platforms.create(530, 480, 'ledge');

   ledge.body.immovable = true;

    Barriles=game.add.group();
    Barriles.enableBody=true;
    Barriles.physicsBodyType=Phaser.Physics.ARCADE;
    Barriles.setAll('putOfBoundsKill',true);
    Barriles.setAll('checkWorldBounds',true);

    princesa = game.add.sprite(100, game.world.height - 600, 'princesa');


    game.physics.arcade.enable(princesa);


    princesa.body.bounce.y = 0.2;
    princesa.body.gravity.y = 300;
    princesa.body.collideWorldBounds = true;



    princesa.animations.add('llorar',[0,1,2,3,4,5],3,true);
    princesa.play("llorar");




     Donkeykong = game.add.sprite(300, game.world.height - 600, 'Donkeykong');


    game.physics.arcade.enable(Donkeykong);

    Donkeykong.body.bounce.y = 0.2;
    Donkeykong.body.gravity.y = 300;
    Donkeykong.body.collideWorldBounds = true;



    Donkeykong.animations.add('caminar',[0,1,2,3,4,5],4,true);


   mario = game.add.sprite(130, game.world.height - 107, 'mario');
  mario.anchor.setTo(0.5,0.5);


  game.physics.arcade.enable(mario);


  mario.body.bounce.y = 0.2;
  mario.body.gravity.y = 300;
  mario.body.collideWorldBounds = true;



  mario.animations.add('izquierda',[5,6,7,8,9],10,true);
  mario.animations.add('derecha',[0,1,2,3,4],10,true);

  stars = game.add.group();

  stars.enableBody = true;



      var star = stars.create(550, 100,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y = 0.2;
     star = stars.create(550, 380,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y =  0.2;
       star = stars.create(500, 300,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y =0.2;
      star = stars.create(300, 210,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y =  0.2;
       star = stars.create(100, 180,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y = 0.2;
       star = stars.create(290,300,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y =  0.2;
      star = stars.create(350,70,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y =  0.2;
      star = stars.create(30,170,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y = 0.2;
    star = stars.create(600, 230,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y = 0.2;
       star = stars.create(130,50,'star');

      star.body.gravity.y = 600;

      star.body.bounce.y = 0.2;


   releaseBarril();

 },

  update: function() {

    var hitPlatform = game.physics.arcade.collide(mario, platforms);
    game.physics.arcade.collide(Donkeykong, platforms);
    game.physics.arcade.collide(princesa, platforms);
    game.physics.arcade.collide(Barriles, platforms);
    game.physics.arcade.collide(Barriles,mario,null,finDelJuego);
    game.physics.arcade.overlap(mario,princesa,TuGanas2, null, this);
    game.physics.arcade.collide(stars, platforms);
    game.physics.arcade.overlap(mario, stars, collectStar, null, this);
    cursors = game.input.keyboard.createCursorKeys();

    if (total < 200 && game.time.now > timer){

           releaseBarril();
           Donkeykong.play("caminar");
       }
       Barriles.forEach(function(barril) {
                   if(barril.position.y>=500 && (barril.position.x==0 || barril.position.x==100 )){
                       barril.kill();
                   }

               }, juego);
    mario.body.velocity.x = 0;
    if (cursors.left.isDown)
       {

           mario.body.velocity.x = -150;

           mario.animations.play('izquierda');
       }
    else if (cursors.right.isDown)
       {

           mario.body.velocity.x = 150;

           mario.animations.play('derecha');
       }
    else
       {

           mario.animations.stop();

           mario.frame=3;
       }


       if (cursors.up.isDown && mario.body.touching.down && hitPlatform)
       {

           mario.body.velocity.y = -250;
       }
  }



};
function collectStar (mario, star) {

    contador++;
    star.kill();


}
function TuGanas2(){
if (contador==10 ) {
  sonido.stop();
game.state.start('TuGanas');
}



}
function releaseBarril() {
var Barril=Barriles.create(300, Donkeykong.position.y, 'Barril');
if (sw1==0) {
  Barril.body.bounce.y =0.2;
  Barril.body.gravity.y =600;
  Barril.body.collideWorldBounds = true;

  Barril.animations.add('rodar',[0,1,2,3,4,5,6,7,8],5,true);
  Barril.animations.play('rodar');
  Barril.body.velocity.x=200;
              sw1=1;
          }else{
            Barril.body.bounce.y = 0.2;
            Barril.body.gravity.y =600;
            Barril.body.collideWorldBounds = true;
              Barril.animations.add('rodar',[0,1,2,3,4,5,6,7,8],5,true);
              Barril.scale.setTo(-1,1);
              Barril.animations.play('rodar');
              Barril.body.velocity.x=-200;

              sw1=0;
          }
Barril.body.bounce.setTo(1,0);


    total++;
    timer = game.time.now + 3000;

}
function finDelJuego(){
    sonido.stop();
game.state.start('Game_Over');

}
