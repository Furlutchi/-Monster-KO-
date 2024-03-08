class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }
}


// configuration générale du jeu*
var config = {
  type: Phaser.AUTO,
  width: 800, // largeur en pixels
  height: 600, // hauteur en pixels
  physics: {
    // définition des parametres physiques
    default: "arcade", // mode arcade : le plus simple : des rectangles pour gérer les collisions. Pas de pentes
    arcade: {
      // parametres du mode arcade
      gravity: {
        y: 300 // gravité verticale : acceleration ddes corps en pixels par seconde
      },
      debug: false // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    }
  },
  scene: {
    // une scene est un écran de jeu. Pour fonctionner il lui faut 3 fonctions  : create, preload, update
    preload: preload, // la phase preload est associée à la fonction preload, du meme nom (on aurait pu avoir un autre nom)
    create: create, // la phase create est associée à la fonction create, du meme nom (on aurait pu avoir un autre nom)
    update: update // la phase update est associée à la fonction update, du meme nom (on aurait pu avoir un autre nom)
  }
};
// création et lancement du jeu*
new Phaser.Game(config);
// VARIABLES GLOBALES *
var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier
var groupe_monstre;
var groupe_etoiles; // contient tous les sprite etoiles 
var score = 0;
var zone_texte_score; 
var boutonFeu;
var groupeBullets;
var son_feu;
var musique_de_fond;
var gameOver = false;
/***********************************************************************/
/** FONCTION PRELOAD 
/***********************************************************************/

/** La fonction preload est appelée une et une seule fois,
 * lors du chargement de la scene dans le jeu.
 * On y trouve surtout le chargement des assets (images, son ..)
 */
function preload() {
  // tous les assets du jeu sont placés dans le sous-répertoire src/assets/
  
  
  this.load.spritesheet("img_perso", "src/assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48
  });

this.load.image("img_etoile", "src/assets/star.png");
this.load.image("img_bombe", "src/assets/bomb.png");
this.load.image("bullet", "src/assets/balle.png");
  // chargement tuiles de jeu
this.load.image("Phaser_tuilesdejeu", "src/assets/tuilesJeu.png");
this.load.image("menu_fond", "stc/assets/acceuil.png");
this.load.image("imageBoutonPlay", "src/assets/play.png")
// chargement de la carte
this.load.tilemapTiledJSON("carte", "src/assets/map.json");  
// on charge deux fichiers audio avec les identifiants coupDeFeu et background
this.load.audio('coupDeFeu', 'src/assets/gun.mp3');
this.load.audio('background', 'src/assets/guile.mp3');  
}

/***********************************************************************/
// FONCTION CREATE 
/***********************************************************************/
function create() {
   // CREATION DU MONDE + PLATEFORMES  *
   // chargement de la carte
const carteDuNiveau = this.add.tilemap("carte");
// chargement du jeu de tuiles
const tileset = carteDuNiveau.addTilesetImage(
          "tuiles_de_jeu",
          "Phaser_tuilesdejeu"
        );  


        // chargement du calque calque_background
const calque_background = carteDuNiveau.createLayer(
  "calque_background",
  tileset
);
// chargement du calque calque_background_2
const calque_background_2 = carteDuNiveau.createLayer(
  "calque_background_2",
  tileset
);
// chargement du calque calque_plateformes
const calque_plateformes = carteDuNiveau.createLayer(
  "calque_plateformes",
  tileset
);  
// définition des tuiles de plateformes qui sont solides
// utilisation de la propriété estSolide
calque_plateformes.setCollisionByProperty({ estSolide: true }); 
 
 // CREATION DU PERSONNAGE * 
   // On créée un nouveeau personnage : player
  player = this.physics.add.sprite(100, 450, "img_perso");
  player.direction = 'right';
   //  propriétées physiqyes de l'objet player :
  player.setBounce(0.2); // on donne un petit coefficient de rebond
  player.setCollideWorldBounds(true); // le player se cognera contre les bords du monde

  // CREATION DU CLAVIER *
  // ceci permet de creer un clavier et de mapper des touches, connaitre l'état des touches
  clavier = this.input.keyboard.createCursorKeys();
  boutonFeu = this.input.keyboard.addKey('T'); 
 
  //creation etoiles *
  groupe_etoiles = this.physics.add.group();
  // on rajoute 10 étoiles avec une boucle for :
  // on répartit les ajouts d'étoiles tous les 70 pixels sur l'axe des x
  for (var i = 0; i < 100; i++) {
    var coordX = 70 + 70 * i;
    groupe_etoiles.create(coordX, 10, "img_etoile");
  } 
  this.physics.add.collider(groupe_etoiles, calque_plateformes,); 
 groupe_etoiles.children.iterate(function iterateur(etoile_i) {
    // On tire un coefficient aléatoire de rerebond : valeur entre 0.4 et 0.8
    var coef_rebond = Phaser.Math.FloatBetween(0.4, 0.8);
    etoile_i.setBounceY(coef_rebond); // on attribut le coefficient de rebond à l'étoile etoile_i
  }); 
 // les actions à entreprendre seront écrites dans la fonction ramasserEtoile
 this.physics.add.overlap(player, groupe_etoiles, ramasserEtoile, null, this);
 
 // creation monstre *
 groupe_monstre = this.physics.add.group(); 
this.physics.add.collider(groupe_monstre, calque_plateformes);
 this.physics.add.collider(player, groupe_monstre, chocAvecBombe, null, this); 
 groupe_monstre.y = Phaser.Math.Between(10,250);
  
 //creation balle *
  groupeBullets = this.physics.add.group();
  this.physics.add.overlap(groupeBullets, groupe_monstre, hit, null,this);
  
   //GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
    // ajout d'une collision entre le joueur et le calque plateformes
 this.physics.add.collider(player, calque_plateformes);
  // redimentionnement du monde avec les dimensions calculées via tiled
this.physics.world.setBounds(0, 0, 3200, 640);
//  ajout du champs de la caméra de taille identique à celle du monde
this.cameras.main.setBounds(0, 0, 3200, 640);
// ancrage de la caméra sur le joueur
this.cameras.main.startFollow(player);

    // cretion des animations *
  // creation de l'animation "anim_tourne_gauche" qui sera jouée sur le player lorsque ce dernier tourne à gauche
  this.anims.create({
    key: "anim_tourne_gauche", // key est le nom de l'animation : doit etre unique poru la scene.
    frames: this.anims.generateFrameNumbers("img_perso", { start: 4, end: 4 }), // on prend toutes les frames de img perso numerotées de 0 à 3
    frameRate: 10, // vitesse de défilement des frames
    repeat: -1 // nombre de répétitions de l'animation. -1 = infini
  });
  // creation de l'animation "anim_tourne_face" qui sera jouée sur le player lorsque ce dernier n'avance pas.
  this.anims.create({
    key: "anim_face",
    frames: [{ key: "img_perso", frame: 2 }],
    frameRate: 20
  });
 // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
  this.anims.create({
    key: "anim_tourne_droite",
    frames: this.anims.generateFrameNumbers("img_perso", { start: 8, end:8 }),
    frameRate: 10,
    repeat: -1
  });
  // instructions pour les objets surveillés en bord de monde
this.physics.world.on("worldbounds", function(body) {
  // on récupère l'objet surveillé
  var objet = body.gameObject;
  // s'il s'agit d'une balle
  if (groupeBullets.contains(objet)) {
      // on le détruit
      objet.destroy();
  }
});
  zone_texte_score = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' }); 
 // ajout des sons au gestionnaire sound
// recupération de variables pour manipuler le son
son_feu = this.sound.add('coupDeFeu');
musique_de_fond = this.sound.add('background'); 
musique_de_fond.play();
son_feu.play();



  
}



/***********************************************************************/
/** FONCTION UPDATE 
/***********************************************************************/

function update() {
  if (clavier.left.isDown) {
    player.direction = 'left';
    player.setVelocityX(-160);
    player.anims.play("anim_tourne_gauche", true);
  } else if (clavier.right.isDown) {
    player.direction = 'right';
    player.setVelocityX(160);
    player.anims.play("anim_tourne_droite", true);
  } else {
    player.setVelocityX(0);
    player.anims.play("anim_face");
  }

  if (clavier.up.isDown && player.body.blocked.down) {
    player.setVelocityY(-1000);
  }  
  if (groupe_etoiles.countActive(true) === 0) {
    // si ce nombre est égal à 0 : on va réactiver toutes les étoiles désactivées
    // pour chaque étoile etoile_i du groupe, on réacttive etoile_i avec la méthode enableBody
    // ceci s'ecrit bizarrement : avec un itérateur sur les enfants (children) du groupe (equivalent du for)
    groupe_etoiles.children.iterate(function iterateur(etoile_i) {
      etoile_i.enableBody(true, etoile_i.x, 0, true, true);
    });
    if (gameOver) {
      musique_de_fond.stop();
      return;
    } 
  } 

  if ( Phaser.Input.Keyboard.JustDown(boutonFeu)) {
    tirer(player);
 }  
 
} 
this.game.scene.restart;

/***********************************************************************/
/** FONCTION ramasserEtoile
/***********************************************************************/
 function ramasserEtoile(un_player, une_etoile) {
  // on désactive le "corps physique" de l'étoile mais aussi sa texture
  // l'étoile existe alors sans exister : elle est invisible et ne peut plus intéragir
  une_etoile.disableBody(true, true);
  //  on ajoute 10 points au score total, on met à jour l'affichage
  score += 10;
  zone_texte_score.setText("Score: " + score); 
    // on ajoute une nouvelle bombe au jeu
    // - on génère une nouvelle valeur x qui sera l'abcisse de la bombe
    var x;
    if (player.x < 400) {
      x = Phaser.Math.Between(400, 800);
    } else {
      x = Phaser.Math.Between(0, 400);
    }

    var une_bombe = groupe_monstre.create(x, 16, "img_bombe");
    une_bombe.setBounce(1);
    une_bombe.setCollideWorldBounds(true);
    une_bombe.setVelocity(Phaser.Math.Between(-200, 200), 20);
    une_bombe.allowGravity = false;
  } 
  
/***********************************************************************/
/** FONCTION chocAvecBombe
/***********************************************************************/
 function chocAvecBombe(un_player, une_bombe) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("anim_face");
    gameOver = true;
  } 
    /***********************************************************************/
   /**  //fonction tirer( ), prenant comme paramètre l'auteur du tir
   /***********************************************************************/

 
   function tirer(player) {
    var coefDir;
  if (player.direction == 'left') { coefDir = -1; } else { coefDir = 1 }
    // on crée la balle a coté du joueur
    var bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');
    // parametres physiques de la balle.
    bullet.setCollideWorldBounds(true);
    // on acive la détection de l'evenement "collision au bornes"
    bullet.body.onWorldBounds = true;  
    bullet.body.allowGravity =false;
    bullet.setVelocity(1000 * coefDir, 0); // vitesse en x et en y
}  

  /***********************************************************************/
   /**  fonction déclenchée lorsque uneBalle et uneCible se superposent
   /***********************************************************************/

   function hit (uneBalle, uneCible) {
    uneBalle.destroy(); // destruction de la balle
    uneCible.destroy();  // destruction de la cible.   
}  



