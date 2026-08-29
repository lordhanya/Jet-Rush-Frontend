class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.calculateLanePositions();
        this.loadAssets();
        this.createLoadingScreen();
    }

    calculateLanePositions() {
        const laneWidth = this.scale.width / GameConfig.LANE_COUNT;
        GameConfig.LANE_POSITIONS = [];
        for (let i = 0; i < GameConfig.LANE_COUNT; i++) {
            GameConfig.LANE_POSITIONS.push(laneWidth * i + laneWidth / 2);
        }
    }

    loadAssets() {
        this.load.image('player', 'assets/images/player.png');
        this.load.image('trail', 'assets/images/trial_effect_purple.png');
        this.load.image('logo', 'assets/images/jet_rush_logo.png');
        
        this.load.image('meteor_large', 'assets/images/meteor_large.png');
        this.load.image('meteor_small', 'assets/images/meteor_small.png');
        this.load.image('meteor_detailedLarge', 'assets/images/meteor_detailedLarge.png');
        this.load.image('meteor_detailedSmall', 'assets/images/meteor_detailedSmall.png');
        this.load.image('meteor_squareLarge', 'assets/images/meteor_squareLarge.png');
        this.load.image('meteor_squareSmall', 'assets/images/meteor_squareSmall.png');
        this.load.image('meteor_squareDetailedLarge', 'assets/images/meteor_squareDetailedLarge.png');
        this.load.image('meteor_squareDetailedSmall', 'assets/images/meteor_squareDetailedSmall.png');
        
        this.load.image('enemy_A', 'assets/images/enemy_A.png');
        this.load.image('enemy_B', 'assets/images/enemy_B.png');
        this.load.image('enemy_C', 'assets/images/enemy_C.png');
        this.load.image('enemy_D', 'assets/images/enemy_D.png');
        this.load.image('enemy_E', 'assets/images/enemy_E.png');
        
        this.load.image('satellite_A', 'assets/images/satellite_A.png');
        this.load.image('satellite_B', 'assets/images/satellite_B.png');
        this.load.image('satellite_C', 'assets/images/satellite_C.png');
        this.load.image('satellite_D', 'assets/images/satellite_D.png');
        
        this.load.image('station_A', 'assets/images/station_A.png');
        this.load.image('station_B', 'assets/images/station_B.png');
        this.load.image('station_C', 'assets/images/station_C.png');
        
        this.load.image('effect_purple', 'assets/images/effect_purple.png');
        this.load.image('effect_yellow', 'assets/images/effect_yellow.png');
        this.load.image('star_large', 'assets/images/star_large.png');
        this.load.image('star_medium', 'assets/images/star_medium.png');
        this.load.image('star_small', 'assets/images/star_small.png');
        this.load.image('star_tiny', 'assets/images/star_tiny.png');
        
        this.load.image('shield_pickup', 'assets/images/shield_pickup.png');
        this.load.image('slowmo_pickup', 'assets/images/slowmo_pickup.png');
        this.load.image('bomb_pickup', 'assets/images/bomb_pickup.png');
        this.load.image('double_pickup', 'assets/images/double_pickup.png');
        
        this.load.audio('tap', 'assets/sounds/tap_sound.mp3');
        this.load.audio('score', 'assets/sounds/score_sound.mp3');
        this.load.audio('gameOver', 'assets/sounds/game_over.mp3');
        this.load.audio('bgMusic', 'assets/sounds/background_music.mp3');
        
        this.load.start();
    }

    createLoadingScreen() {
        const { width, height } = this.scale;
        
        this.add.rectangle(0, 0, width, height, 0x0a0a1a);
        
        const loadingText = this.add.text(width / 2, height * 0.5, 'LOADING...', {
            fontFamily: 'Arial',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#9d4edd'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: loadingText,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.load.once('complete', () => {
            this.scene.start('MenuScene');
        });
    }
}