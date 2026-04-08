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
        this.load.image('obstacle_big', 'assets/images/obstacle_big.png');
        this.load.image('obstacle_small', 'assets/images/obstacle_small.png');
        this.load.image('trail', 'assets/images/trial_effect_purple.png');
        this.load.image('logo', 'assets/images/jet_rush_logo.png');
        
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