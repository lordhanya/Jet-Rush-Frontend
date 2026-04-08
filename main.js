const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 400,
        height: 700
    },
    audio: {
        muteWebAudio: false
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, LeaderboardScene, GameScene, GameOverScene]
};

const GameConfig = {
    API_URL: 'https://jet-rush-backend.onrender.com/api/index.php',
    LANE_COUNT: 3,
    PLAYER_Y_OFFSET: 130,
    LANE_SWITCH_DURATION: 120,
    INITIAL_OBSTACLE_SPEED: 280,
    MAX_OBSTACLE_SPEED: 650,
    INITIAL_SPAWN_DELAY: 1100,
    MIN_SPAWN_DELAY: 350,
    SPEED_INCREMENT: 12,
    SPAWN_DELAY_DECREMENT: 25,
    SCORE_INTERVAL: 1000,
    LANE_POSITIONS: [],
    BIG_ROCK_SPEED_MULT: 0.7,
    SMALL_ROCK_SPEED_MULT: 1.3,
    TRAIL_LENGTH: 8
};

let gameState = {
    username: '',
    soundEnabled: true,
    musicEnabled: true
};

const game = new Phaser.Game(config);