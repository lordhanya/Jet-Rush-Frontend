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
        this.isPaused = false;
        this.obstacles = [];
        this.powerUps = [];
        this.trailParticles = [];
        this.isMoving = false;
        this.moveDirection = 0;

        this.activeWave = 'calm';
        this.enteredWave = 0;
        this.nextBossScore = GameConfig.BOSS_AT_SCORE;
        this.bossSpawned = false;

        this.combo = 0;
        this.comboMultiplier = 1;
        this.lastNearMissTime = 0;
        this.nearMissCount = 0;
        this.powerUpsCollected = 0;

        this.shieldActive = false;
        this.slowmoActive = false;
        this.slowmoTimer = null;
        this.doubleActive = false;
        this.doubleTimer = null;

        this.createSpeedLines();
        this.createPlayer();
        this.createTrail();
        this.createUI();
        this.setupInput();
        this.startSpawning();
        this.startScoreTimer();
        this.playBackgroundMusic();
        this.updateWaveVisual();
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

        this.player.setScale(0.6);
        this.player.setDepth(10);
        this.player.setRotation(0);

        this.playerGlow = this.add.rectangle(
            this.player.x,
            this.player.y + 30,
            62,
            22,
            0x9d4edd,
            0.3
        );
        this.playerGlow.setDepth(9);
        this.playerGlow.setOrigin(0.5, 0);

        this.shieldFX = this.add.circle(
            this.player.x,
            this.player.y,
            50,
            0x00ff88,
            0.25
        );
        this.shieldFX.setStrokeStyle(4, 0x00ff88, 0.8);
        this.shieldFX.setDepth(9);
        this.shieldFX.setVisible(false);
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
        const { width, height } = this.scale;

        this.add.text(15, 12, this.username, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#9d4edd'
        }).setDepth(100);

        this.scoreText = this.add.text(width / 2, 52, '0', {
            fontFamily: 'Arial',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(100);

        this.add.text(width / 2, 80, 'SCORE', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#666688'
        }).setOrigin(0.5).setDepth(100);

        this.comboText = this.add.text(width - 70, 62, '', {
            fontFamily: 'Arial',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(1, 0.5).setDepth(100);

        this.waveText = this.add.text(width - 15, 14, 'INTENSE', {
            fontFamily: 'Arial',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#ff4466'
        }).setOrigin(1, 0).setDepth(100);

        this.statusText = this.add.text(width / 2, height * 0.16, '', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#9d4edd'
        }).setOrigin(0.5).setDepth(100).setAlpha(0);

        this.createPauseButton(width / 2, 12);
        this.createPauseOverlay();
    }

    showStatus(message, color = '#9d4edd') {
        this.statusText.setText(message);
        this.statusText.setColor(color);
        this.statusText.setAlpha(1);
        this.statusText.setScale(0.8);
        this.tweens.killTweensOf(this.statusText);
        this.tweens.add({
            targets: this.statusText,
            alpha: 0,
            scale: 1.15,
            duration: 1200,
            ease: 'Power2'
        });
    }

    // ---------- Pause system ----------

    createPauseButton(x, y) {
        const button = this.add.container(x, y);
        button.setDepth(100);

        const bg = this.add.circle(0, 0, 11, 0x1a1a2e, 0.9)
            .setStrokeStyle(2, 0x9d4edd);
        const icon = this.add.text(0, 0, '⏸', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#ffffff'
        }).setOrigin(0.5);

        button.add([bg, icon]);

        const hitArea = new Phaser.Geom.Circle(0, 0, 14);
        button.setInteractive(hitArea, Phaser.Geom.Circle.Contains, { useHandCursor: true });

        button.icon = icon;
        button.on('pointerdown', () => {
            this.togglePause();
        });

        this.pauseButton = button;
    }

    createPauseOverlay() {
        const { width, height } = this.scale;

        const overlay = this.add.container(width / 2, height / 2);
        overlay.setDepth(200);
        overlay.setVisible(false);

        const dim = this.add.rectangle(0, 0, width, height, 0x0a0a1a, 0.92);

        const panel = this.add.rectangle(0, 0, 300, 340, 0x1a1a2e, 0.95)
            .setStrokeStyle(2, 0x9d4edd);

        const title = this.add.text(0, -120, 'PAUSED', {
            fontFamily: 'Arial',
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        const resumeBtn = this.createOverlayButton(0, -20, 'RESUME', 0x00b4d8, () => {
            this.togglePause();
        });

        const abortBtn = this.createOverlayButton(0, 70, 'ABORT MISSION', 0xff4466, () => {
            this.showAbortConfirm();
        });

        overlay.add([dim, panel, title, resumeBtn.ref, abortBtn.ref]);

        this.pauseOverlay = overlay;
        this.pauseResumeBtn = resumeBtn;
        this.pauseAbortBtn = abortBtn;

        this.createAbortConfirm();
    }

    createAbortConfirm() {
        const { width, height } = this.scale;

        const overlay = this.add.container(width / 2, height / 2);
        overlay.setDepth(201);
        overlay.setVisible(false);

        const dim = this.add.rectangle(0, 0, width, height, 0x0a0a1a, 0.95);

        const panel = this.add.rectangle(0, 0, 310, 240, 0x1a1a2e, 0.98)
            .setStrokeStyle(2, 0xff4466);

        const text = this.add.text(0, -60, 'ABORT MISSION?\n\nProgress will be lost.', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const cancelBtn = this.createOverlayButton(0, 35, 'CANCEL', 0x00b4d8, () => {
            this.abortConfirmOverlay.setVisible(false);
        });

        const confirmBtn = this.createOverlayButton(0, 115, 'CONFIRM', 0xff4466, () => {
            this.abortMission();
        });

        overlay.add([dim, panel, text, cancelBtn.ref, confirmBtn.ref]);

        this.abortConfirmOverlay = overlay;
    }

    createOverlayButton(x, y, label, color, callback) {
        const container = this.add.container(x, y);

        const glow = this.add.rectangle(0, 0, 190, 48, color, 0.3)
            .setOrigin(0.5);
        const bg = this.add.rectangle(0, 0, 180, 44, color)
            .setOrigin(0.5);
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Arial',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add([glow, bg, text]);

        const hitArea = new Phaser.Geom.Rectangle(-90, -22, 180, 44);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, { useHandCursor: true });

        container.on('pointerover', () => {
            this.tweens.add({ targets: [bg, glow], scaleX: 1.06, scaleY: 1.06, duration: 100 });
        });
        container.on('pointerout', () => {
            this.tweens.add({ targets: [bg, glow], scaleX: 1, scaleY: 1, duration: 100 });
        });
        container.on('pointerdown', () => {
            this.tweens.add({ targets: bg, scaleX: 0.95, scaleY: 0.95, duration: 50, yoyo: true });
            if (this.soundEnabled) this.sound.play('tap');
            callback();
        });

        return { ref: container };
    }

    pauseTimers() {
        if (this.spawnTimer) this.spawnTimer.paused = true;
        if (this.scoreTimer) this.scoreTimer.paused = true;
        if (this.slowmoTimer) this.slowmoTimer.paused = true;
        if (this.doubleTimer) this.doubleTimer.paused = true;
    }

    resumeTimers() {
        if (this.spawnTimer) this.spawnTimer.paused = false;
        if (this.scoreTimer) this.scoreTimer.paused = false;
        if (this.slowmoTimer) this.slowmoTimer.paused = false;
        if (this.doubleTimer) this.doubleTimer.paused = false;
    }

    togglePause() {
        if (this.isGameOver) return;

        if (this.isPaused) {
            this.isPaused = false;
            this.physics.resume();
            this.resumeTimers();
            if (this.bgMusic) this.bgMusic.resume();
            this.pauseOverlay.setVisible(false);
            if (this.abortConfirmOverlay) this.abortConfirmOverlay.setVisible(false);
            this.pauseButton.icon.setText('⏸');
        } else {
            this.isPaused = true;
            this.physics.pause();
            this.pauseTimers();
            if (this.bgMusic) this.bgMusic.pause();
            this.pauseOverlay.setVisible(true);
            this.pauseButton.icon.setText('▶');
        }
    }

    showAbortConfirm() {
        this.pauseOverlay.setVisible(false);
        this.abortConfirmOverlay.setVisible(true);
    }

    abortMission() {
        this.stopBackgroundMusic();
        this.scene.start('MenuScene', { soundEnabled: this.soundEnabled });
    }

    setupInput() {
        this.input.on('pointerdown', (pointer) => {
            if (this.isGameOver || this.isPaused) return;

            if (this.pauseButton) {
                const d = Phaser.Math.Distance.Between(
                    this.pauseButton.x, this.pauseButton.y, pointer.x, pointer.y
                );
                if (d < 30) return;
            }

            if (pointer.x < this.scale.width / 2) {
                this.moveLeft();
            } else {
                this.moveRight();
            }
        });

        this.input.keyboard.on('keydown-LEFT', () => {
            if (!this.isGameOver && !this.isPaused) this.moveLeft();
        });

        this.input.keyboard.on('keydown-RIGHT', () => {
            if (!this.isGameOver && !this.isPaused) this.moveRight();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isGameOver) return;
            this.togglePause();
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

        if (this.shieldFX.visible) {
            this.tweens.add({
                targets: this.shieldFX,
                x: targetX,
                duration: GameConfig.LANE_SWITCH_DURATION,
                ease: 'Power2'
            });
        }
    }

    // ---------- Wave system ----------

    waveSpeedMul() {
        if (this.activeWave === 'calm') return GameConfig.CALM_SPEED_MULT;
        if (this.activeWave === 'intense') return GameConfig.INTENSE_SPEED_MULT;
        return 1;
    }

    waveSpawnMul() {
        if (this.activeWave === 'calm') return GameConfig.CALM_SPAWN_MULT;
        if (this.activeWave === 'intense') return GameConfig.INTENSE_SPAWN_MULT;
        return 1;
    }

    advanceWave() {
        if (this.activeWave === 'intense') {
            this.activeWave = 'calm';
            this.updateWaveVisual();
            this.showStatus('CALM ZONE', '#00ff88');
        } else {
            this.activeWave = 'intense';
            this.updateWaveVisual();
            this.showStatus('DANGER ZONE', '#ff4466');
        }
    }

    updateWaveVisual() {
        if (this.activeWave === 'calm') {
            this.waveText.setText('CALM');
            this.waveText.setColor('#00ff88');
            this.tweens.add({ targets: this.playerGlow, fillAlpha: 0.15, duration: 400 });
        } else {
            this.waveText.setText('INTENSE');
            this.waveText.setColor('#ff4466');
            this.tweens.add({ targets: this.playerGlow, fillAlpha: 0.3, duration: 400 });
        }
    }

    // ---------- Spawning ----------

    startSpawning() {
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
    }

    pickObstacleType() {
        const minScore = this.score < 8 ? 0 : (this.score < 15 ? 1 : (this.score < 22 ? 2 : 3));

        const available = GameConfig.OBSTACLE_TYPES.filter(t => {
            if (t.key === 'boss') return false;
            if ((t.key === 'splitter' || t.key === 'patrol') && minScore < 1) return false;
            if ((t.key === 'homing' || t.key === 'pulsar') && minScore < 2) return false;
            if (t.key === 'phantom' && minScore < 3) return false;
            return true;
        });

        let totalWeight = 0;
        available.forEach(t => totalWeight += t.weight);
        let roll = Math.random() * totalWeight;
        for (const t of available) {
            roll -= t.weight;
            if (roll <= 0) return t;
        }
        return available[available.length - 1];
    }

    spawnObstacle() {
        if (this.isGameOver) return;

        if (!this.bossSpawned && this.score >= this.nextBossScore && this.score >= 3) {
            this.spawnBoss();
            this.bossSpawned = true;
            this.nextBossScore += GameConfig.BOSS_EVERY;
            return;
        }

        const type = this.pickObstacleType();
        const baseSpeed = this.obstacleSpeed * type.speedMul * this.waveSpeedMul();

        // Count lanes currently blocked inside the danger zone
        let dangerCount = 0;
        const dangerLanes = {};
        for (let i = 0; i < GameConfig.LANE_COUNT; i++) {
            const hasObstacle = this.obstacles.some(obs =>
                obs.lane === i && obs.y < 220 && obs.behavior !== 'boss'
            );
            if (hasObstacle) {
                dangerLanes[i] = true;
                dangerCount++;
            }
        }

        // Never fill all three lanes at once - always keep at least one escape lane
        if (dangerCount >= GameConfig.LANE_COUNT - 1) {
            this.trySpawnPowerUp();
            return;
        }

        const availableLanes = [];
        for (let i = 0; i < GameConfig.LANE_COUNT; i++) {
            if (!dangerLanes[i]) {
                availableLanes.push(i);
            }
        }

        if (availableLanes.length === 0) {
            this.trySpawnPowerUp();
            return;
        }

        const lane = Phaser.Math.RND.pick(availableLanes);
        const x = GameConfig.LANE_POSITIONS[lane];

        const obstacle = this.add.image(x, -60, type.texture);
        obstacle.setScale(type.scale);
        obstacle.setDepth(5);
        obstacle.lane = lane;
        obstacle.behavior = type.key;
        obstacle.baseScale = type.scale;
        obstacle.speed = baseSpeed;
        obstacle.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
        obstacle.active = true;

        if (type.key === 'phantom') {
            obstacle.fadeTimer = 0;
        }
        if (type.key === 'patrol') {
            obstacle.patrolDir = 1;
            obstacle.patrolSpeed = Phaser.Math.FloatBetween(0.8, 1.4);
        }
        if (type.key === 'homing') {
            obstacle.homingActive = false;
        }
        if (type.key === 'splitter') {
            obstacle.hasSplit = false;
        }

        this.physics.add.existing(obstacle);
        obstacle.body.setCircle(obstacle.width * obstacle.scaleX * 0.38);

        this.obstacles.push(obstacle);

        this.trySpawnPowerUp();
    }

    spawnBoss() {
        const stations = ['station_A', 'station_B', 'station_C'];
        const texture = Phaser.Math.RND.pick(stations);
        const lane = Phaser.Math.Between(0, GameConfig.LANE_COUNT - 1);
        const x = GameConfig.LANE_POSITIONS[lane];

        const boss = this.add.image(x, -100, texture);
        boss.setScale(0.7);
        boss.setDepth(5);
        boss.lane = lane;
        boss.behavior = 'boss';
        boss.speed = 170;
        boss.hp = 3;
        boss.active = true;

        this.physics.add.existing(boss);
        boss.body.setCircle(boss.width * boss.scaleX * 0.4);

        this.obstacles.push(boss);
        this.showStatus('STATION INBOUND!', '#ff4466');
        if (this.soundEnabled) {
            this.sound.play('score');
        }
    }

    trySpawnPowerUp() {
        if (Math.random() > GameConfig.POWERUP_SPAWN_CHANCE) return;
        if (this.powerUps.length > 2) return;

        const type = Phaser.Math.RND.pick(GameConfig.POWERUP_POOL);
        const textureMap = {
            shield: 'shield_pickup',
            slowmo: 'slowmo_pickup',
            bomb: 'bomb_pickup',
            double: 'double_pickup'
        };

        const availableLanes = [];
        for (let i = 0; i < GameConfig.LANE_COUNT; i++) {
            const hasObstacle = this.obstacles.some(obs =>
                obs.lane === i && obs.y < 200
            );
            if (!hasObstacle) {
                availableLanes.push(i);
            }
        }
        if (availableLanes.length === 0) return;

        const lane = Phaser.Math.RND.pick(availableLanes);
        const x = GameConfig.LANE_POSITIONS[lane];

        const pickup = this.add.image(x, -40, textureMap[type]);
        pickup.setScale(0.55);
        pickup.setDepth(4);
        pickup.lane = lane;
        pickup.powerType = type;

        this.tweens.add({
            targets: pickup,
            y: '-=12',
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.powerUps.push(pickup);
    }

    // ---------- Score / difficulty ----------

    startScoreTimer() {
        this.scoreTimer = this.time.addEvent({
            delay: GameConfig.SCORE_INTERVAL,
            callback: () => {
                if (this.isGameOver) return;

                this.score++;
                this.updateScoreDisplay();

                if (this.score % 5 === 0 && this.soundEnabled) {
                    this.sound.play('score');
                }

                if (this.score - this.enteredWave >= GameConfig.WAVE_LENGTH) {
                    this.enteredWave = this.score;
                    this.advanceWave();
                }

                this.increaseDifficulty();
            },
            loop: true
        });
    }

    updateScoreDisplay() {
        const shown = Math.floor(this.score * this.comboMultiplier);
        this.scoreText.setText(shown.toString());
        this.scoreText.setColor(this.comboMultiplier > 1 ? '#ffd700' : '#ffffff');
    }

    increaseDifficulty() {
        if (this.obstacleSpeed < GameConfig.MAX_OBSTACLE_SPEED) {
            const inc = GameConfig.BASE_SPEED_INCREMENT * (this.activeWave === 'intense' ? 1 : 0.4);
            this.obstacleSpeed = Math.min(this.obstacleSpeed + inc, GameConfig.MAX_OBSTACLE_SPEED);
        }

        const newDelay = Math.max(
            GameConfig.MIN_SPAWN_DELAY,
            this.spawnDelay - GameConfig.BASE_SPAWN_DELAY_DECREMENT * this.waveSpawnMul()
        );
        if (this.spawnTimer && newDelay < this.spawnTimer.delay) {
            this.spawnTimer.delay = newDelay;
            this.spawnDelay = newDelay;
        }
    }

    // ---------- Power-ups ----------

    applyPowerUp(type) {
        this.powerUpsCollected++;

        switch (type) {
            case 'shield':
                this.shieldActive = true;
                this.shieldFX.setVisible(true);
                this.shieldFX.setAlpha(0.8);
                this.showStatus('SHIELD UP', '#00ff88');
                break;

            case 'slowmo':
                this.slowmoActive = true;
                if (this.slowmoTimer) this.slowmoTimer.remove(false);
                this.slowmoTimer = this.time.addEvent({
                    delay: GameConfig.SLOWMO_DURATION,
                    callback: () => this.deactivateSlowmo()
                });
                this.showStatus('SLOW MOTION', '#00b4d8');
                break;

            case 'double':
                this.doubleActive = true;
                if (this.doubleTimer) this.doubleTimer.remove(false);
                this.doubleTimer = this.time.addEvent({
                    delay: GameConfig.DOUBLE_DURATION,
                    callback: () => this.deactivateDouble()
                });
                this.showStatus('2X SCORE', '#ffd700');
                break;

            case 'bomb':
                this.explodeAll();
                this.showStatus('NOVA BLAST!', '#ff4466');
                break;
        }

        if (this.soundEnabled) {
            this.sound.play('score');
        }
    }

    deactivateSlowmo() {
        if (this.slowmoTimer) {
            this.slowmoTimer.remove(false);
            this.slowmoTimer = null;
        }
        this.slowmoActive = false;
    }

    deactivateDouble() {
        if (this.doubleTimer) {
            this.doubleTimer.remove(false);
            this.doubleTimer = null;
        }
        this.doubleActive = false;
        this.updateScoreDisplay();
    }

    explodeAll() {
        this.obstacles.forEach(obs => {
            if (obs.behavior === 'boss') return;
            this.spawnBurst(obs.x, obs.y, 0xff4466, 12);
            obs.destroy();
        });
        this.obstacles = this.obstacles.filter(obs => {
            if (!obs.active) return false;
            return obs.behavior === 'boss';
        });
        this.cameras.main.shake(200, 0.01);
    }

    updatePowerUps(ts = 1) {
        const { height } = this.scale;

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pickup = this.powerUps[i];

            pickup.y += GameConfig.POWERUP_SPEED * ts * 0.016;

            if (pickup.y > height + 60) {
                pickup.destroy();
                this.powerUps.splice(i, 1);
                continue;
            }

            if (this.checkPickupCollision(this.player, pickup)) {
                this.applyPowerUp(pickup.powerType);
                this.spawnBurst(pickup.x, pickup.y, 0x00ff88, 10);
                pickup.destroy();
                this.powerUps.splice(i, 1);
            }
        }
    }

    checkPickupCollision(player, pickup) {
        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            pickup.x, pickup.y
        );
        const radius = 40 +
            (player.width * player.scaleX * 0.35) +
            (pickup.width * pickup.scaleX * 0.4);
        return distance < radius;
    }

    // ---------- Combo / near-miss ----------

    checkNearMiss(obstacle) {
        const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            obstacle.x, obstacle.y
        );

        const now = this.time.now;

        if (distance < GameConfig.NEAR_MISS_RADIUS && obstacle.behavior !== 'boss') {
            if (now - this.lastNearMissTime > GameConfig.COMBO_WINDOW) {
                this.combo = 0;
            }
            this.lastNearMissTime = now;
            this.combo++;
            this.nearMissCount++;

            const idx = Math.min(this.combo - 1, GameConfig.COMBO_MULTIPLIERS.length - 1);
            this.comboMultiplier = GameConfig.COMBO_MULTIPLIERS[idx];

            const bonus = GameConfig.NEAR_MISS_BONUS * this.comboMultiplier;
            this.showScorePopup('CLOSE CALL +' + bonus, obstacle.x, obstacle.y - 20, '#ffd700');
            this.updateScoreDisplay();

            if (this.combo > 1 && this.soundEnabled) {
                this.sound.play('score');
            }
        } else if (now - this.lastNearMissTime > GameConfig.COMBO_WINDOW && this.combo > 0) {
            this.combo = 0;
            this.comboMultiplier = 1;
            this.comboText.setText('');
            this.updateScoreDisplay();
        }

        this.comboText.setText(this.combo > 1 ? 'x' + this.comboMultiplier + ' COMBO' : '');
        this.comboText.setAlpha(this.combo > 1 ? 1 : 0.4);
    }

    showScorePopup(text, x, y, color) {
        const t = this.add.text(x, y, text, {
            fontFamily: 'Arial',
            fontSize: '12px',
            fontStyle: 'bold',
            color: color
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({
            targets: t,
            y: y - 40,
            alpha: 0,
            duration: 700,
            ease: 'Power2',
            onComplete: () => t.destroy()
        });
    }

    spawnBurst(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const p = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.9);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.Between(60, 200);
            p.setDepth(150);
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => p.destroy()
            });
        }
    }

    // ---------- Obstacle behaviors ----------

    updateObstacle(obstacle, ts = 1) {
        const behavior = obstacle.behavior;
        const mv = 0.016;
        const dy = obstacle.speed * ts * mv;

        switch (behavior) {
            case 'straight':
            case 'straightBig':
            case 'meteor':
                obstacle.y += dy;
                obstacle.rotation += 0.03;
                break;

            case 'drift':
                obstacle.y += dy;
                const driftX = Math.sin(obstacle.phase + this.time.now * 0.002) * 45;
                obstacle.x = GameConfig.LANE_POSITIONS[obstacle.lane] + driftX;
                obstacle.rotation += 0.02;
                break;

            case 'splitter':
                obstacle.y += dy;
                if (obstacle.y > 220 && !obstacle.hasSplit) {
                    this.doSplit(obstacle);
                }
                break;

            case 'splitPiece':
                obstacle.x += obstacle.splitDir * 1.2;
                obstacle.y += dy;
                obstacle.rotation += 0.05;
                break;

            case 'homing':
                if (!obstacle.homingActive && obstacle.y > 60) {
                    obstacle.homingActive = true;
                }
                if (obstacle.homingActive) {
                    const dx = this.player.x - obstacle.x;
                    obstacle.x += Phaser.Math.Clamp(dx * 0.002 * ts, -1.6, 1.6);
                    obstacle.y += dy;
                    obstacle.rotation += 0.04;
                } else {
                    obstacle.y += dy;
                }
                break;

            case 'pulsar':
                obstacle.y += dy;
                const pulseScale = 1 + Math.sin(this.time.now * 0.008) * 0.3;
                obstacle.setScale(obstacle.baseScale * pulseScale);
                obstacle.body.setCircle(obstacle.width * obstacle.scaleX * 0.4);
                break;

            case 'phantom':
                obstacle.y += dy;
                obstacle.fadeTimer = (obstacle.fadeTimer + 1) % 180;
                if (obstacle.fadeTimer < 60) {
                    obstacle.setAlpha(Math.abs(Math.sin(obstacle.fadeTimer * 0.05)));
                    obstacle.active = obstacle.fadeTimer > 20;
                    obstacle.body.enable = obstacle.active;
                } else {
                    obstacle.setAlpha(1);
                    obstacle.active = true;
                    obstacle.body.enable = true;
                }
                break;

            case 'patrol':
                if (obstacle.y < 140) {
                    obstacle.y += dy;
                } else {
                    let px = obstacle.x + obstacle.patrolDir * obstacle.patrolSpeed;
                    const leftBound = GameConfig.LANE_POSITIONS[0];
                    const rightBound = GameConfig.LANE_POSITIONS[GameConfig.LANE_COUNT - 1];
                    if (px < leftBound) {
                        obstacle.patrolDir = 1;
                        px = leftBound;
                    } else if (px > rightBound) {
                        obstacle.patrolDir = -1;
                        px = rightBound;
                    }
                    obstacle.x = px;
                    obstacle.y += dy * 0.3;
                }
                obstacle.rotation += 0.02;
                break;

            case 'boss':
                obstacle.y += dy;
                obstacle.rotation += 0.003;
                break;
        }
    }

    doSplit(obstacle) {
        obstacle.hasSplit = true;
        this.spawnBurst(obstacle.x, obstacle.y, 0x00b4d8, 8);

        for (let dir = -1; dir <= 1; dir += 2) {
            const piece = this.add.image(obstacle.x + dir * 20, obstacle.y, 'meteor_small');
            piece.setScale(0.4);
            piece.setDepth(5);
            piece.lane = obstacle.lane;
            piece.behavior = 'splitPiece';
            piece.speed = this.obstacleSpeed * 1.25;
            piece.splitDir = dir;
            piece.active = true;

            this.physics.add.existing(piece);
            piece.body.setCircle(piece.width * piece.scaleX * 0.38);

            this.obstacles.push(piece);
        }

        obstacle.destroy();
        const idx = this.obstacles.indexOf(obstacle);
        if (idx !== -1) this.obstacles.splice(idx, 1);
    }

    // ---------- Collision ----------

    checkCollision(player, obstacle) {
        if (!obstacle.active) return false;

        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            obstacle.x, obstacle.y
        );

        const collisionRadius = (player.width * player.scaleX * 0.22) +
            (obstacle.width * obstacle.scaleX * 0.38);

        return distance < collisionRadius;
    }

    hitObstacle(obstacle) {
        if (this.shieldActive) {
            this.shieldActive = false;
            this.shieldFX.setVisible(false);
            this.spawnBurst(this.player.x, this.player.y, 0x00ff88, 14);
            this.showStatus('SHIELD DOWN', '#ff4466');

            if (obstacle.behavior === 'boss') {
                obstacle.hp -= 1;
                if (obstacle.hp <= 0) {
                    this.destroyBoss(obstacle);
                } else {
                    this.cameras.main.shake(300, 0.015);
                }
            } else if (obstacle.behavior !== 'boss') {
                obstacle.destroy();
                const idx = this.obstacles.indexOf(obstacle);
                if (idx !== -1) this.obstacles.splice(idx, 1);
            }

            this.combo = 0;
            this.comboMultiplier = 1;
            this.comboText.setText('');
            return;
        }

        this.gameOver();
    }

    destroyBoss(boss) {
        this.spawnBurst(boss.x, boss.y, 0xff4466, 30);
        this.spawnBurst(boss.x, boss.y, 0xffd700, 20);
        this.cameras.main.shake(400, 0.02);
        this.showStatus('STATION DESTROYED! +50', '#ffd700');
        if (this.soundEnabled) {
            this.sound.play('score');
        }
        boss.destroy();
        const idx = this.obstacles.indexOf(boss);
        if (idx !== -1) this.obstacles.splice(idx, 1);
        this.bossSpawned = false;
    }

    // ---------- Main loop ----------

    update() {
        if (this.isGameOver || this.isPaused) return;

        const ts = this.slowmoActive ? GameConfig.SLOWMO_TIME_SCALE : 1;

        this.updateSpeedLines();
        this.updateTrail();
        this.updatePowerUps(ts);

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];

            if (!obstacle.active) {
                this.obstacles.splice(i, 1);
                continue;
            }

            this.updateObstacle(obstacle, ts);

            if (obstacle.y > this.scale.height + 100) {
                if (obstacle.behavior === 'boss') {
                    continue;
                }
                obstacle.destroy();
                this.obstacles.splice(i, 1);
                continue;
            }

            if (this.checkCollision(this.player, obstacle)) {
                this.hitObstacle(obstacle);
                if (this.isGameOver) return;
                if (i >= this.obstacles.length) i = this.obstacles.length - 1;
                continue;
            }

            this.checkNearMiss(obstacle);
        }

        if (this.shieldFX.visible) {
            this.shieldFX.setPosition(this.player.x, this.player.y);
            const pulse = 1 + Math.sin(this.time.now * 0.01) * 0.1;
            this.shieldFX.setRadius(50 * pulse);
        }
    }

    async sendScore() {
        try {
            const response = await fetch(GameConfig.SCORE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.username,
                    score: this.score,
                    maxCombo: this.comboMultiplier,
                    nearMisses: this.nearMissCount,
                    powerupsCollected: this.powerUpsCollected
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
