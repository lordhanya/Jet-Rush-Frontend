class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        this.score = data.score || 0;
        this.username = data.username || 'Pilot';
        this.soundEnabled = data.soundEnabled !== false;
        
        const { width, height } = this.scale;
        
        this.add.rectangle(0, 0, width, height, 0x0a0a1a);
        
        this.createStarsBackground();
        this.createLogo();
        this.createTitle();
        this.createStats();
        this.createButtons();
        this.createSoundToggle();
        
        if (this.soundEnabled) {
            this.sound.play('gameOver');
        }
        
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
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.5, 1.5);
            const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.6));
            star.speed = Phaser.Math.Between(30, 80);
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
        
        const logoContainer = this.add.container(width / 2, height * 0.10);
        
        const circleBg = this.add.circle(0, 0, 45, 0x1a1a2e);
        
        const logo = this.add.image(0, 0, 'logo');
        logo.setScale(0.28);
        
        logoContainer.add([circleBg, logo]);
        
        this.tweens.add({
            targets: logoContainer,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    createTitle() {
        const { width, height } = this.scale;
        
        const titleText = this.add.text(width / 2, height * 0.26, 'MISSION FAILED', {
            fontFamily: 'Arial',
            fontSize: '30px',
            fontStyle: 'bold',
            color: '#ff4466'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: titleText,
            alpha: 0.4,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.add.text(width / 2, height * 0.33, 'PILOT DOWN', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#666688',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    createStats() {
        const { width, height } = this.scale;
        
        const statsBg = this.add.rectangle(width / 2, height * 0.50, 280, 170, 0x1a1a2e, 0.9)
            .setStrokeStyle(1, 0x9d4edd);
        
        this.add.text(width / 2, height * 0.42, this.username, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#9d4edd',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, height * 0.50, 'FINAL SCORE', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#666688'
        }).setOrigin(0.5);
        
        const scoreText = this.add.text(width / 2, height * 0.58, this.score.toString(), {
            fontFamily: 'Arial',
            fontSize: '52px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: scoreText,
            scale: 1.08,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createButtons() {
        const { width, height } = this.scale;
        
        this.createButton(width / 2, height * 0.72, 'RETRY', 0xff4466, () => {
            if (this.soundEnabled) {
                this.sound.play('tap');
            }
            this.cameras.main.flash(200, 255, 68, 102);
            this.scene.start('GameScene', { 
                soundEnabled: this.soundEnabled,
                username: this.username
            });
        });
        
        this.createButton(width / 2, height * 0.84, 'MAIN MENU', 0x2a2a4a, () => {
            if (this.soundEnabled) {
                this.sound.play('tap');
            }
            this.cameras.main.flash(150, 157, 78, 221);
            this.scene.start('MenuScene', { soundEnabled: this.soundEnabled });
        });
    }

    createButton(x, y, text, color, callback) {
        const buttonWidth = 180;
        const buttonHeight = 48;
        
        const container = this.add.container(x, y);
        
        const glow = this.add.rectangle(0, 0, buttonWidth + 6, buttonHeight + 6, color, 0.3)
            .setOrigin(0.5);
        
        const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, color)
            .setOrigin(0.5);
        
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Arial',
            fontSize: '18px',
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
        
        const toggleContainer = this.add.container(width - 40, 30);
        
        const soundIcon = this.add.text(0, 0, this.soundEnabled ? '🔊' : '🔇', {
            fontSize: '22px'
        }).setOrigin(0.5);
        
        toggleContainer.add(soundIcon);
        
        const hitArea = new Phaser.Geom.Circle(0, 0, 20);
        toggleContainer.setInteractive(hitArea, Phaser.Geom.Circle.Contains, { useHandCursor: true });
        
        const self = this;
        toggleContainer.on('pointerdown', function() {
            self.soundEnabled = !self.soundEnabled;
            soundIcon.setText(self.soundEnabled ? '🔊' : '🔇');
            if (self.soundEnabled) {
                self.sound.play('tap');
            }
        });
    }
}