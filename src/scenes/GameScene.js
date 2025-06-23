export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameSpeed = 4;
        this.lastSpawnedItemX = -Infinity;
        this.lastSpawnedItemY = -Infinity;
        this.minDistanceBetweenItems = 150;
        this.minYDistanceBetweenItems = 120;
        this.itemSpawnHeightRange = [150, 300];
        this.selectedVoice = null;
    }

    preload() {

        // this.load.spritesheet('runner1', 'assets/players/player1-sprite.png', {
        //     frameWidth: 204,
        //     frameHeight: 226,
        //     margin: 0,
        //     spacing: 0
        // });

        // this.load.spritesheet('runner2', 'assets/players/player2-sprite.png', {
        //     frameWidth: 65,
        //     frameHeight: 55,
        //     margin: 0,
        //     spacing: 0
        // });

        // this.load.spritesheet('runner3', 'assets/players/player3-sprite.png', {
        //     frameWidth: 680,
        //     frameHeight: 472,
        //     margin: 0,
        //     spacing: 0
        // });

        this.load.spritesheet('runner4', 'assets/players/player4-sprite.png', {
            frameWidth: 165,
            frameHeight: 200,
            margin: 0,
            spacing: 0
        });
    }

    create() {
        const { width, height } = this.sys.game.config;
        this.isPaused = false;

        // Background
        this.background = this.add.tileSprite(0, 0, 0, 0, 'background').setOrigin(0).setScrollFactor(0).setDepth(-1);
        const bg = this.textures.get('background').getSourceImage();
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        this.background.setTileScale(scaleX, scaleY);

        // Score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });

        this.updateMusicEmoji();

        // QUIT button
        const quitBtnIcon = this.add.text(cardX + 45, cardY + 160, '⛔', {
            fontSize: '22px',
            color: '#ffffff',
            fontFamily: 'Arial',
            padding: { x: 10, y: 5 }
        }).setInteractive({ useHandCursor: true });
        this.pausePanel.add(quitBtnIcon);

        const quitLabel = this.add.text(cardX + 100, cardY + 164, 'QUIT', {
            fontSize: '22px',
            color: '#dbc49a',
            fontFamily: 'Arial',
        });
        this.pausePanel.add(quitLabel);

        quitBtnIcon.on('pointerdown', () => {
            this.pausePanel.setVisible(false);
            this.isPaused = false;
            this.scene.stop();
            this.scene.start('StartScene');
        });
    
        // Pause button
        this.pauseButton = this.add.text(width - 50, 15, '⏸', {
            fontSize: '23px',
            color: '#fff',
            fontFamily: 'Arial',
            padding: { x: 10, y: 5 },
        }).setInteractive({ useHandCursor: true }).setDepth(30);

        this.pauseButton.on('pointerdown', () => this.togglePause(!this.isPaused));

        // Motivation messages
        this.motivationTimer = this.time.addEvent({
            delay: 10000,
            loop: true,
            callback: () => {
                if (this.isPaused) return;
        
                const messages = [
                    "Let's go!", "Keep pushing!", "You got this!",
                    "Stay strong!", "You're doing great!", "Run like the wind!",
                    "Breathe! Focus! Push!", "Burn those calories!", "No pain, no gain!"
                ];
                const message = Phaser.Math.RND.pick(messages);
        
                this.motivationText.setText(message)
                    .setAlpha(1)
                    .setScale(0)
                    .setOrigin(0.5)
                    .setPosition(this.sys.game.config.width / 2 , 140);
                    this.tweens.add({
                    targets: this.motivationText,
                    scale: 1,
                    ease: 'Back.Out',
                    duration: 400,
                    onComplete: () => {
                        this.time.delayedCall(1000, () => {
                            this.tweens.add({
                                targets: this.motivationText,
                                alpha: 0,
                                duration: 400
                            });
                        });
                    }
                });
        
                if (this.voiceEnabled) {
                    const utterance = new SpeechSynthesisUtterance(message);
                    utterance.pitch = 1.8;
                    utterance.rate = 1.5;
                    utterance.volume = 0.65;
                    if (this.selectedVoice) utterance.voice = this.selectedVoice;
                    speechSynthesis.cancel();
                    speechSynthesis.speak(utterance);
                }
            }
        });        

        // Groups and timers
        this.powerUps = this.physics.add.group();
        this.hazards = this.physics.add.group();

        // Spawn loops
        this.time.addEvent({
            delay: Phaser.Math.Between(2500, 4500),
            loop: true,
            callback: () => { if (!this.isPaused) this.spawnPowerUp(); }
        });

        this.hazardTimer = this.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000),
            loop: true,
            callback: () => { if (!this.isPaused) this.spawnHazard(); }
        });
    }

    update() {
        if (this.isPaused) return;

        this.background.tilePositionX += this.gameSpeed;

        this.powerUps.getChildren().forEach(item => {
            if (item.x < -item.width) item.destroy();
        });
        this.hazards.getChildren().forEach(item => {
            if (item.x < -item.width) item.destroy();
        });

        let elapsedSeconds = Math.floor((this.time.now - this.startTime) / 1000);
        this.timerText.setText('Time: ' + elapsedSeconds + 's');
        this.distance += 0.1;
        this.caloriesText.setText('Calories: 0');
        this.distanceText.setText('Distance: ' + Math.floor(this.distance) + 'm');
    }

    togglePause(pause) {
        this.isPaused = pause;
        this.pausePanel.setVisible(pause);
        this.physics.world.isPaused = pause;
        this.powerUpTimer.paused = pause;
        this.hazardTimer.paused = pause;
        this.motivationTimer.paused = pause;
        this.pauseButton.disableInteractive();
        if (!pause) {
            this.pauseButton.setInteractive({ useHandCursor: true });
            if (this.bgMusic && this.registry.get('musicEnabled')) {
                this.bgMusic.resume();
            }
        }
    }

    updateMusicEmoji() {
        const enabled = this.registry.get('musicEnabled') ?? false;
        this.musicEmoji.setText(enabled ? '🔈' : '🔇');
    }

    isTooClose(newX, newY) {
        const dx = Math.abs(newX - this.lastSpawnedItemX);
        const dy = Math.abs(newY - this.lastSpawnedItemY);
        return dx < this.minDistanceBetweenItems && dy < this.minYDistanceBetweenItems;
    }

    spawnPowerUp() {
        const fruitTypes = ['granola-bar', 'Avocado', 'Boiled Egg', 'Berries', 'Broccoli', 'Pomegranate', 'Banana', 'energy-drink', 'Mango', 'Proteinshake', 'Salad Bowl'];
        const key = Phaser.Utils.Array.GetRandom(fruitTypes);
        const currentX = this.sys.game.config.width + 50;

        let y, attempts = 0;
        do {
            y = Phaser.Math.Between(...this.itemSpawnHeightRange);
        } while (this.isTooClose(currentX, y) && ++attempts < 10);

        const item = this.powerUps.create(currentX, y, key);
        item.setVelocityX(-this.gameSpeed * 50).setDisplaySize(80, 80);
        item.body.allowGravity = false;
        item.setImmovable(true);
        this.lastSpawnedItemX = currentX;
        this.lastSpawnedItemY = y;
    }

    spawnHazard() {
        const junkTypes = ['Candy Bar', 'Soda', 'Fries', 'Burger', 'Hotdog', 'Donuts', 'Pizza'];
        const key = Phaser.Utils.Array.GetRandom(junkTypes);
        const currentX = this.sys.game.config.width + 100;

        let y;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            y = Phaser.Math.Between(...this.itemSpawnHeightRange);
        } while (this.isTooClose(currentX, y) && ++attempts < 10);

        const hazard = this.hazards.create(currentX, y, key);
        hazard.setVelocityX(-this.gameSpeed * 50).setDisplaySize(80, 80);
        hazard.body.allowGravity = false;
        hazard.setImmovable(true);
        this.lastSpawnedItemX = currentX;
        this.lastSpawnedItemY = y;
    }
}