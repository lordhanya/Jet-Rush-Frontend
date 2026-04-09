class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create(data) {
        this.soundEnabled = data.soundEnabled !== false;
        
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0a0a1a);
        
        this.createStarsBackground();
        
        this.add.text(this.scale.width / 2, this.scale.height * 0.08, '🏆 LEADERBOARD', {
            fontFamily: 'Arial',
            fontSize: '26px',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(0.5);
        
        this.add.text(this.scale.width / 2, this.scale.height * 0.14, 'Top 20 Pilots', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#666688'
        }).setOrigin(0.5);
        
        this.addBackButton();
        
        this.loadingText = this.add.text(this.scale.width / 2, this.scale.height * 0.5, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#666688'
        }).setOrigin(0.5);
        
        this.cameras.main.setAlpha(0);
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 1,
            duration: 400,
            ease: 'Power2'
        });
        
        this.fetchLeaderboard();
    }

    createStarsBackground() {
        const { width, height } = this.scale;
        
        this.stars = [];
        for (let i = 0; i < 30; i++) {
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

    addBackButton() {
        const backBtn = this.add.container(45, 25);
        
        const backBg = this.add.rectangle(0, 0, 70, 36, 0x9d4edd, 0.2)
            .setStrokeStyle(2, 0x9d4edd);
        
        const backIcon = this.add.text(-18, -3, '←', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#9d4edd',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const backText = this.add.text(-6, 0, 'Back', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        backBtn.add([backBg, backIcon, backText]);
        
        const hitArea = new Phaser.Geom.Rectangle(-35, -18, 70, 36);
        backBtn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, { useHandCursor: true });
        
        const self = this;
        backBtn.on('pointerover', function() {
            self.tweens.add({ targets: backBg, scaleX: 1.1, scaleY: 1.1, duration: 100 });
            backBg.setFillStyle(0x9d4edd, 0.4);
        });
        
        backBtn.on('pointerout', function() {
            self.tweens.add({ targets: backBg, scaleX: 1, scaleY: 1, duration: 100 });
            backBg.setFillStyle(0x9d4edd, 0.2);
        });
        
        backBtn.on('pointerdown', function() {
            if (self.soundEnabled) {
                self.sound.play('tap');
            }
            self.cameras.main.flash(150, 157, 78, 221);
            self.scene.start('MenuScene', { soundEnabled: self.soundEnabled });
        });
    }

    async fetchLeaderboard() {
        try {
            const response = await fetch(GameConfig.LEADERBOARD_URL);
            const text = await response.text();
            console.log('Leaderboard response:', text);
            
            if (!text || text.trim() === '' || text.startsWith('<') || text.startsWith('<?')) {
                this.displayLeaderboard([]);
                return;
            }
            
            const data = JSON.parse(text);
            this.displayLeaderboard(data);
        } catch (e) {
            console.error('Failed to fetch leaderboard:', e);
            this.displayLeaderboard([]);
        }
    }

    displayLeaderboard(scores) {
        const { width, height } = this.scale;
        
        if (this.loadingText) {
            this.loadingText.destroy();
        }
        
        if (!scores || scores.length === 0) {
            this.add.text(width / 2, height * 0.5, 'No scores yet!\nBe the first!', {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#666688',
                align: 'center'
            }).setOrigin(0.5);
            return;
        }
        
        const startY = height * 0.20;
        const rowHeight = 36;
        const maxDisplay = Math.min(scores.length, 10);
        
        const headerBg = this.add.rectangle(width / 2, startY - 12, 340, 28, 0x1a1a2e);
        headerBg.setStrokeStyle(1, 0x9d4edd);
        
        this.add.text(width * 0.18, startY - 12, 'RANK', { fontSize: '11px', color: '#9d4edd' }).setOrigin(0.5);
        this.add.text(width * 0.42, startY - 12, 'PILOT', { fontSize: '11px', color: '#9d4edd' }).setOrigin(0.5);
        this.add.text(width * 0.70, startY - 12, 'SCORE', { fontSize: '11px', color: '#9d4edd' }).setOrigin(0.5);
        this.add.text(width * 0.90, startY - 12, 'DATE', { fontSize: '11px', color: '#9d4edd' }).setOrigin(0.5);
        
        const listBg = this.add.rectangle(width / 2, startY + (maxDisplay * rowHeight) / 2 + 10, 
            340, maxDisplay * rowHeight + 20, 0x0a0a1a, 0.9)
            .setStrokeStyle(1, 0x2a2a4a);
        
        scores.slice(0, maxDisplay).forEach((entry, index) => {
            const y = startY + 20 + index * rowHeight;
            const rank = index + 1;
            
            let medal = '';
            let color = '#ffffff';
            let bgColor = 0x000000;
            let bgAlpha = 0;
            
            if (rank === 1) { 
                medal = '🥇'; 
                color = '#ffd700'; 
                bgColor = 0x2a2010;
                bgAlpha = 0.5;
            }
            else if (rank === 2) { 
                medal = '🥈'; 
                color = '#c0c0c0'; 
                bgColor = 0x202025;
                bgAlpha = 0.4;
            }
            else if (rank === 3) { 
                medal = '🥉'; 
                color = '#cd7f32'; 
                bgColor = 0x252015;
                bgAlpha = 0.4;
            }
            else { 
                medal = '#' + rank; 
                color = '#888899';
            }
            
            const rowBg = this.add.rectangle(width / 2, y, 340, 32, bgColor, bgAlpha);
            
            const rankText = this.add.text(width * 0.18, y, medal, {
                fontFamily: 'Arial',
                fontSize: '15px',
                color: color
            }).setOrigin(0.5);
            
            const nameText = this.add.text(width * 0.42, y, entry.username.substring(0, 12), {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff'
            }).setOrigin(0, 0.5);
            
            const scoreText = this.add.text(width * 0.70, y, entry.score.toString(), {
                fontFamily: 'Arial',
                fontSize: '15px',
                fontStyle: 'bold',
                color: '#00ff88'
            }).setOrigin(0.5);
            
            const dateText = this.add.text(width * 0.90, y, entry.date ? entry.date.substring(5) : '', {
                fontFamily: 'Arial',
                fontSize: '11px',
                color: '#666688'
            }).setOrigin(0.5);
        });
    }

    showError() {
        const { width, height } = this.scale;
        
        this.add.text(width / 2, height * 0.5, 'Failed to load leaderboard', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ff4466'
        }).setOrigin(0.5);
    }
}