class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.playerName = gameState.username;
        
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0a0a1a);
        
        this.createStarsBackground();
        this.createLogo();
        this.createNameInput();
        this.createButtons();
        this.createSoundToggle();
        
        this.cameras.main.setAlpha(0);
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }

    createStarsBackground() {
        const { width, height } = this.scale;
        
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const speed = Phaser.Math.Between(50, 150);
            
            const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
            star.speed = speed;
            this.stars.push(star);
        }
    }

    update() {
        const { height } = this.scale;
        
        this.stars.forEach(star => {
            star.y += star.speed * 0.016;
            if (star.y > height + 10) {
                star.y = -10;
                star.x = Phaser.Math.Between(0, this.scale.width);
            }
        });
    }

    createLogo() {
        const { width, height } = this.scale;
        
        const logoContainer = this.add.container(width / 2, height * 0.18);
        
        const circleBg = this.add.circle(0, 0, 55, 0x1a1a2e);
        
        const logo = this.add.image(0, 0, 'logo');
        logo.setScale(0.35);
        
        logoContainer.add([circleBg, logo]);
        
        this.tweens.add({
            targets: logoContainer,
            scale: 1.05,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createNameInput() {
        const { width, height } = this.scale;
        
        this.add.text(width / 2, height * 0.36, "What's your name, Pilot?", {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#9d4edd'
        }).setOrigin(0.5);
        
        const inputBg = this.add.rectangle(width / 2, height * 0.44, 240, 50, 0x1a1a2e)
            .setStrokeStyle(2, 0x9d4edd);
        
        const inputGlow = this.add.rectangle(width / 2, height * 0.44, 244, 54, 0x9d4edd, 0.2)
            .setStrokeStyle(1, 0x9d4edd);
        
        this.nameText = this.add.text(width / 2, height * 0.44, this.playerName || 'Tap to enter name...', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: this.playerName ? '#ffffff' : '#666688'
        }).setOrigin(0.5);
        
        inputBg.setInteractive({ useHandCursor: true });
        
        const self = this;
        inputBg.on('pointerdown', function() {
            self.showNameInputPrompt();
        });
        
        this.nameText.setInteractive({ useHandCursor: true });
        this.nameText.on('pointerdown', function() {
            self.showNameInputPrompt();
        });
        
        this.tweens.add({
            targets: [inputBg, inputGlow],
            alpha: 0.7,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            delay: 500
        });
    }

    showNameInputPrompt() {
        const name = prompt("Enter your pilot name:", this.playerName);
        if (name && name.trim().length > 0) {
            this.playerName = name.trim().substring(0, 12);
            gameState.username = this.playerName;
            this.nameText.setText(this.playerName);
            this.nameText.setColor('#ffffff');
            if (gameState.soundEnabled) {
                this.sound.play('tap');
            }
        }
    }

    createButtons() {
        const { width, height } = this.scale;
        
        this.createButton(width / 2, height * 0.60, 'LAUNCH', 0x9d4edd, () => {
            if (!this.playerName || this.playerName.trim() === '') {
                alert('Please enter your name first!');
                return;
            }
            if (gameState.soundEnabled) {
                this.sound.play('tap');
            }
            this.cameras.main.flash(200, 157, 78, 221);
            this.scene.start('GameScene', { 
                soundEnabled: gameState.soundEnabled,
                username: this.playerName
            });
        });
        
        this.createButton(width / 2, height * 0.73, 'LEADERBOARD', 0x00b4d8, () => {
            if (gameState.soundEnabled) {
                this.sound.play('tap');
            }
            this.scene.start('LeaderboardScene', { soundEnabled: gameState.soundEnabled });
        });
        
        this.add.text(width / 2, height * 0.85, 'TAP LEFT/RIGHT or ARROW KEYS to move', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#555577'
        }).setOrigin(0.5);
    }

    createButton(x, y, text, color, callback) {
        const buttonWidth = 200;
        const buttonHeight = 50;
        
        const container = this.add.container(x, y);
        
        const glow = this.add.rectangle(0, 0, buttonWidth + 8, buttonHeight + 8, color, 0.3)
            .setOrigin(0.5);
        
        const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, color)
            .setOrigin(0.5);
        
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Arial',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        container.add([glow, bg, label]);
        
        const hitArea = new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, { useHandCursor: true });
        
        const self = this;
        container.on('pointerover', function() {
            self.tweens.add({ targets: [bg, glow], scaleX: 1.08, scaleY: 1.08, duration: 100 });
        });
        
        container.on('pointerout', function() {
            self.tweens.add({ targets: [bg, glow], scaleX: 1, scaleY: 1, duration: 100 });
        });
        
        container.on('pointerdown', function() {
            self.tweens.add({ targets: bg, scaleX: 0.95, scaleY: 0.95, duration: 50, yoyo: true });
            callback();
        });
        
        return container;
    }

    createSoundToggle() {
        const { width } = this.scale;
        
        const toggleContainer = this.add.container(width - 40, 35);
        
        const soundIcon = this.add.text(0, 0, gameState.soundEnabled ? '🔊' : '🔇', {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        toggleContainer.add(soundIcon);
        
        const hitArea = new Phaser.Geom.Circle(0, 0, 20);
        toggleContainer.setInteractive(hitArea, Phaser.Geom.Circle.Contains, { useHandCursor: true });
        
        const self = this;
        toggleContainer.on('pointerdown', function() {
            gameState.soundEnabled = !gameState.soundEnabled;
            soundIcon.setText(gameState.soundEnabled ? '🔊' : '🔇');
            if (gameState.soundEnabled) {
                self.sound.play('tap');
            }
        });
    }
}