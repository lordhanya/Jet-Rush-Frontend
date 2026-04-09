class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.soundEnabled = data.soundEnabled !== false;
        this.username = data.username || 'Pilot';
    }

    create() {
        this.score = 0;
        this.currentLane = 1;
        this.obstacleSpeed = GameConfig.INITIAL_OBSTACLE_SPEED;
        this.spawnDelay = GameConfig.INITIAL_SPAWN_DELAY;
        this.isGameOver = false;
        this.obstacles = [];
        this.trailParticles = [];
        this.isMoving = false;
        this.moveDirection = 0;
        
        this.createSpeedLines();
        this.createPlayer();
        this.createTrail();
        this.createUI();
        this.setupInput();
        this.startSpawning();
        this.startScoreTimer();
        this.playBackgroundMusic();
    }

    playBackgroundMusic() {
        if (gameState.musicEnabled) {
            const bgMusic = this.sound.add('bgMusic', { 
                loop: true, 
                volume: 0.3 
            });
            bgMusic.play();
            this.bgMusic = bgMusic;
        }
    }

    stopBackgroundMusic() {
        if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic = null;
        }
    }

    createSpeedLines() {
        const { width, height } = this.scale;
        
        this.speedLines = [];
        
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const length = Phaser.Math.Between(30, 80);
            const line = this.add.rectangle(x, y, 2, length, 0x9d4edd, 0.4);
            line.speed = Phaser.Math.Between(200, 400);
            line.length = length;
            this.speedLines.push(line);
        }
        
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const length = Phaser.Math.Between(20, 50);
            const line = this.add.rectangle(x, y, 1, length, 0x00b4d8, 0.25);
            line.speed = Phaser.Math.Between(100, 200);
            line.length = length;
            line.isParallax = true;
            this.speedLines.push(line);
        }
    }

    updateSpeedLines() {
        const { height } = this.scale;
        
        this.speedLines.forEach(line => {
            line.y += line.speed * 0.016;
            if (line.y > height + line.length) {
                line.y = -line.length;
                line.x = Phaser.Math.Between(0, this.scale.width);
            }
        });
    }

    createPlayer() {
        const { width, height } = this.scale;
        
        this.player = this.add.image(
            GameConfig.LANE_POSITIONS[this.currentLane],
            height - GameConfig.PLAYER_Y_OFFSET,
            'player'
        );
        
        this.player.setScale(0.85);
        this.player.setDepth(10);
        this.player.setRotation(0);
        
        this.playerGlow = this.add.rectangle(
            this.player.x,
            this.player.y + 30,
            60,
            20,
            0x9d4edd,
            0.3
        );
        this.playerGlow.setDepth(9);
        this.playerGlow.setOrigin(0.5, 0);
    }

    createTrail() {
        for (let i = 0; i < GameConfig.TRAIL_LENGTH; i++) {
            const trail = this.add.image(this.player.x, this.player.y + i * 12, 'trail');
            trail.setScale(0.6 - i * 0.05);
            trail.setAlpha(0.6 - i * 0.07);
            trail.setDepth(8);
            this.trailParticles.push(trail);
        }
    }

    updateTrail() {
        const targetX = this.player.x;
        const targetY = this.player.y;
        
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const trail = this.trailParticles[i];
            
            if (i === 0) {
                trail.x = targetX;
                trail.y = targetY + 25;
            } else {
                const prev = this.trailParticles[i - 1];
                trail.x += (prev.x - trail.x) * 0.3;
                trail.y += (prev.y - trail.y) * 0.3;
            }
        }
    }

    createUI() {
        const { width } = this.scale;
        
        this.add.text(15, 12, this.username, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#9d4edd'
        }).setDepth(100);
        
        this.scoreText = this.add.text(width / 2, 30, '0', {
            fontFamily: 'Arial',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(100);
        
        this.add.text(width / 2, 58, 'SCORE', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#666688'
        }).setOrigin(0.5).setDepth(100);
    }

    setupInput() {
        this.input.on('pointerdown', (pointer) => {
            if (this.isGameOver) return;
            
            if (pointer.x < this.scale.width / 2) {
                this.moveLeft();
            } else {
                this.moveRight();
            }
        });
        
        this.input.keyboard.on('keydown-LEFT', () => {
            if (!this.isGameOver) this.moveLeft();
        });
        
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (!this.isGameOver) this.moveRight();
        });
    }

    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.moveDirection = -1;
            this.isMoving = true;
            this.animatePlayerMovement();
            if (this.soundEnabled) {
                this.sound.play('tap');
            }
        }
    }

    moveRight() {
        if (this.currentLane < GameConfig.LANE_COUNT - 1) {
            this.currentLane++;
            this.moveDirection = 1;
            this.isMoving = true;
            this.animatePlayerMovement();
            if (this.soundEnabled) {
                this.sound.play('tap');
            }
        }
    }

    animatePlayerMovement() {
        const targetX = GameConfig.LANE_POSITIONS[this.currentLane];
        const targetRotation = this.moveDirection * 0.25;
        
        this.tweens.add({
            targets: this.player,
            x: targetX,
            rotation: targetRotation,
            duration: GameConfig.LANE_SWITCH_DURATION,
            ease: 'Power2',
            onComplete: () => {
                this.isMoving = false;
                this.tweens.add({
                    targets: this.player,
                    rotation: 0,
                    duration: 150,
                    ease: 'Power2'
                });
            }
        });
        
        this.tweens.add({
            targets: this.playerGlow,
            x: targetX,
            duration: GameConfig.LANE_SWITCH_DURATION,
            ease: 'Power2'
        });
    }

    startSpawning() {
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
    }

    spawnObstacle() {
        if (this.isGameOver) return;
        
        const isBig = Math.random() > 0.5;
        const texture = isBig ? 'obstacle_big' : 'obstacle_small';
        const speedMult = isBig ? GameConfig.BIG_ROCK_SPEED_MULT : GameConfig.SMALL_ROCK_SPEED_MULT;
        const scale = isBig ? 0.8 : 0.55;
        
        const availableLanes = [];
        for (let i = 0; i < GameConfig.LANE_COUNT; i++) {
            const hasObstacle = this.obstacles.some(obs => 
                obs.lane === i && obs.y < 180
            );
            if (!hasObstacle) {
                availableLanes.push(i);
            }
        }
        
        if (availableLanes.length === 0) return;
        
        const lane = Phaser.Math.RND.pick(availableLanes);
        const x = GameConfig.LANE_POSITIONS[lane];
        
        const obstacle = this.add.image(x, -60, texture);
        obstacle.setScale(scale);
        obstacle.lane = lane;
        obstacle.isBig = isBig;
        obstacle.setDepth(5);
        
        this.obstacles.push(obstacle);
        
        this.physics.add.existing(obstacle);
        obstacle.body.setVelocityY(this.obstacleSpeed * speedMult);
        
        obstacle.body.setCircle(obstacle.width * 0.35);
    }

    startScoreTimer() {
        this.scoreTimer = this.time.addEvent({
            delay: GameConfig.SCORE_INTERVAL,
            callback: () => {
                if (!this.isGameOver) {
                    this.score++;
                    this.scoreText.setText(this.score.toString());
                    
                    if (this.score % 5 === 0 && this.soundEnabled) {
                        this.sound.play('score');
                    }
                    
                    this.increaseDifficulty();
                }
            },
            loop: true
        });
    }

    increaseDifficulty() {
        if (this.obstacleSpeed < GameConfig.MAX_OBSTACLE_SPEED) {
            this.obstacleSpeed += GameConfig.SPEED_INCREMENT;
        }
        
        if (this.spawnDelay > GameConfig.MIN_SPAWN_DELAY) {
            this.spawnDelay -= GameConfig.SPAWN_DELAY_DECREMENT;
            this.spawnTimer.delay = this.spawnDelay;
        }
    }

    update() {
        if (this.isGameOver) return;
        
        this.updateSpeedLines();
        this.updateTrail();
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            if (obstacle.y > this.scale.height + 100) {
                obstacle.destroy();
                this.obstacles.splice(i, 1);
                continue;
            }
            
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
            }
        }
    }

    checkCollision(player, obstacle) {
        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            obstacle.x, obstacle.y
        );
        
        const collisionRadius = (player.width * player.scaleX * 0.35) + 
                               (obstacle.width * obstacle.scaleX * 0.35);
        
        return distance < collisionRadius;
    }

    async sendScore() {
        try {
            const response = await fetch(GameConfig.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: this.username, 
                    score: this.score 
                })
            });
            const text = await response.text();
            console.log('Score sent response:', text);
        } catch (e) {
            console.error('Failed to send score:', e);
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.stopBackgroundMusic();
        
        if (this.soundEnabled) {
            this.sound.play('gameOver');
        }
        
        this.physics.pause();
        
        this.cameras.main.shake(300, 0.02);
        
        this.tweens.add({
            targets: this.player,
            alpha: 0.4,
            scale: 0.6,
            duration: 300
        });
        
        this.tweens.add({
            targets: this.trailParticles,
            alpha: 0,
            duration: 200
        });
        
        this.cameras.main.flash(300, 157, 78, 221, true);
        
        this.sendScore();
        
        this.time.delayedCall(800, () => {
            this.scene.start('GameOverScene', { 
                score: this.score,
                username: this.username,
                soundEnabled: this.soundEnabled
            });
        });
    }
}