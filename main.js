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
    SCORE_URL: 'https://jet-rush-backend.onrender.com/api/score.php',
    LEADERBOARD_URL: 'https://jet-rush-backend.onrender.com/api/leaderboard.php',
    LANE_COUNT: 3,
    PLAYER_Y_OFFSET: 130,
    LANE_SWITCH_DURATION: 120,
    INITIAL_OBSTACLE_SPEED: 280,
    MAX_OBSTACLE_SPEED: 650,
    INITIAL_SPAWN_DELAY: 1100,
    MIN_SPAWN_DELAY: 350,
    BASE_SPEED_INCREMENT: 12,
    BASE_SPAWN_DELAY_DECREMENT: 25,
    SCORE_INTERVAL: 1000,
    LANE_POSITIONS: [],
    BIG_ROCK_SPEED_MULT: 0.7,
    SMALL_ROCK_SPEED_MULT: 1.3,
    TRAIL_LENGTH: 8,

    // Wave system
    WAVE_LENGTH: 8,              // score points per wave
    CALM_SPEED_MULT: 0.7,        // calm wave: slower
    CALM_SPAWN_MULT: 1.6,        // calm wave: fewer obstacles
    INTENSE_SPEED_MULT: 1.12,    // intense wave: faster
    INTENSE_SPAWN_MULT: 0.7,     // intense wave: more obstacles
    BOSS_AT_SCORE: 15,           // first boss appears at this score
    BOSS_EVERY: 12,              // then every N score after

    // Power-up system
    POWERUP_SPAWN_CHANCE: 0.12,  // per obstacle spawn
    POWERUP_POOL: ['shield', 'slowmo', 'bomb', 'double'],
    SHIELD_DURATION: 12,
    SLOWMO_DURATION: 5000,
    SLOWMO_TIME_SCALE: 0.5,
    DOUBLE_DURATION: 8000,
    POWERUP_SPEED: 200,

    // Near-miss / combo
    NEAR_MISS_RADIUS: 58,
    COMBO_WINDOW: 3000,
    COMBO_MULTIPLIERS: [1, 2, 3, 5, 8],  // 0,1,2,3,4+ near misses
    NEAR_MISS_BONUS: 25,

    // Obstacle type weights (partitioned ranges, higher = more likely)
    OBSTACLE_TYPES: [
        { key: 'straight',   texture: 'meteor_detailedSmall', weight: 22, speedMul: 1.0, scale: 0.50 },
        { key: 'straightBig', texture: 'meteor_squareLarge',  weight: 14, speedMul: 0.7, scale: 0.80 },
        { key: 'drift',      texture: 'enemy_A',              weight: 12, speedMul: 1.0, scale: 0.55 },
        { key: 'splitter',   texture: 'enemy_B',              weight: 8,  speedMul: 1.0, scale: 0.50 },
        { key: 'homing',     texture: 'enemy_C',              weight: 7,  speedMul: 0.65, scale: 0.50 },
        { key: 'pulsar',     texture: 'enemy_D',              weight: 7,  speedMul: 1.0, scale: 0.55 },
        { key: 'phantom',    texture: 'enemy_E',              weight: 5,  speedMul: 1.0, scale: 0.50 },
        { key: 'meteor',     texture: 'meteor_large',         weight: 12, speedMul: 0.9, scale: 0.70 },
        { key: 'patrol',     texture: 'satellite_A',          weight: 10, speedMul: 0.6, scale: 0.55 },
        { key: 'boss',       texture: 'station_A',            weight: 0,  speedMul: 0.35, scale: 1.1 }
    ]
};

let gameState = {
    username: '',
    soundEnabled: true,
    musicEnabled: true
};

const game = new Phaser.Game(config);