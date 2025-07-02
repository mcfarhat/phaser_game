import { PLAYER_CONFIGS, powerUpTypes, hazardTypes, obstacleTypes } from '../config.js';

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

    init(data) {
    // now data.selectedCharacter is what you passed
    this.selectedCharacter = data.selectedCharacter;
  }
    
    preload() {}


    create() {
        const { width, height } = this.sys.game.config;
        const config = PLAYER_CONFIGS.find(p => p.key === this.selectedCharacter);
        this.isPaused = false;
        
        // Pause pannel
        const pauseOverlay = document.getElementById('pauseOverlay');
        const closePauseBtn = document.getElementById('closePauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        const homeBtn = document.getElementById('homeBtn');

        if (closePauseBtn && !closePauseBtn.hasClickListener) {
            closePauseBtn.addEventListener('click', () => {
                if (this.clickSound) this.clickSound.play();
                pauseOverlay.style.display = 'none';
                this.togglePause(false); 
            });
            closePauseBtn.hasClickListener = true;
        }

        if (restartBtn && !restartBtn.hasClickListener) {
            restartBtn.addEventListener('click', () => {
                if (this.clickSound) this.clickSound.play();
                pauseOverlay.style.display = 'none';
                this.scene.restart();
            });
            restartBtn.hasClickListener = true;
        }

        if (homeBtn && !homeBtn.hasClickListener) {
            homeBtn.addEventListener('click', () => {
                if (this.clickSound) this.clickSound.play();
                pauseOverlay.style.display = 'none';
                this.scene.stop();
                this.scene.start('StartScene');
            });
            homeBtn.hasClickListener = true;
        }

        // Background
        this.background = this.add.tileSprite(0, 0, 0, 0, 'background')
            .setOrigin(0).setScrollFactor(0).setDepth(-1);
        const bg = this.textures.get('background').getSourceImage();
        this.background.setScale(width / bg.width, height / bg.height);

        this.score = 0;
        this.calories = 0;
        this.distance = 0;
        this.startTime = this.time.now;

        this.scoreText = this.add.text(10, 7, 'SCORE: 0', 
        { 
            fontSize: '19px', 
            fill: '#fff', 
            fontFamily: 'Arial', 
            fontStyle: 'bold',

            stroke: '#729C97',
            strokeThickness: 1.5,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 4,
                stroke: true,
                fill: true
            } 
        }).setScrollFactor(0);
        this.scoreText.setResolution(3);

        this.caloriesText = this.add.text(130, 7, 'CALORIES: 0', 
        { 
            fontSize: '19px', 
            fill: '#fff', 
            fontFamily: 'Arial', 
            fontStyle: 'bold',

            stroke: '#729C97',
            strokeThickness: 1.5,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 4,
                stroke: true,
                fill: true
            } 
        }).setScrollFactor(0);
        this.caloriesText.setResolution(3);

        this.timerText = this.add.text(280, 7, 'Time: 0 s', 
        { 
            fontSize: '19px', 
            fill: '#fff', 
            fontFamily: 'Arial', 
            fontStyle: 'bold',
            stroke: '#729C97',
            strokeThickness: 1.5,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 2,
                stroke: true,
                fill: true
            } 
        }).setScrollFactor(0);
        this.timerText.setResolution(3);

        this.distanceText = this.add.text(400, 7, 'Distance: 0 m', 
        { 
            fontSize: '19px', 
            fill: '#fff', 
            fontFamily: 'Arial', 
            fontStyle: 'bold',
            stroke: '#729C97',
            strokeThickness: 1.5,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 2,
                stroke: true,
                fill: true
            } 
        }).setScrollFactor(0);  
        this.distanceText.setResolution(3);   
        
        this.hearts = [];

        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(600 + i * 35, 17, 'heart') // adjust position as needed
                .setScale(0.040) // scale to fit nicely
                .setScrollFactor(0); // fix to camera

            this.hearts.push(heart);
        }

        this.motivationText = this.add.text(400, 100, '', {
            fontSize: '30px', fontFamily: 'Luckiest Guy', fill: '#7AAFBA'
        }).setAlpha(0);

        // Load voice
        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                this.selectedVoice = voices.find(v =>
                    v.name.includes("Microsoft Zira") ||
                    v.name.includes("Microsoft Mark") ||
                    v.name.includes("Google UK English Male") ||
                    v.name.includes("Google US English") ||
                    v.name.includes("Alex") ||
                    v.name.includes("Samantha") ||
                    v.name.includes("Daniel")
                );
            }
        };
        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Music and sound settings
        this.bgMusic = this.sound.get('start-sound');
        if (this.registry.get('musicEnabled') && !this.bgMusic.isPlaying) {
            this.bgMusic.play({ loop: true, volume: this.registry.get('musicVolume') });
        }

        this.voiceEnabled = this.registry.get('soundEnabled');

        // Pause button
        this.pauseButton = this.add.text(width - 37, 1, '⏸', {
            fontSize: '27px',
            color: '#fff',
            fontFamily: 'Luckiest Guy',
            stroke: '#729C97', 
            strokeThickness: 1.5,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 8,
                stroke: true,
                fill: true
            }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        this.pauseButton.setResolution(3);


        this.pauseButton.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            document.getElementById('pauseOverlay').style.display = 'flex';
            this.togglePause(true);
        });

        // SETTINGS button
        const settingsBtn = this.add.text(width - 10, 1, '⚙', {
            fontSize: '27px',
            color: '#fff',
            fontStyle: 'bold',            
            fontFamily: 'Luckiest Guy',
            stroke: '#729C97',
            strokeThickness: 1.5,
            shadow: {  
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 8,
                stroke: true,
                fill: true
            }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        settingsBtn.setResolution(3);

        settingsBtn.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();

            // Show settings panel
            document.querySelector('.overlay').style.display = 'block';
            document.querySelector('.panel').style.display = 'flex';

            // Pause the game
            this.togglePause(true);

            // Set slider values strictly from registry (no fallback)
            const musicSlider = document.getElementById('musicSlider');
            const soundSlider = document.getElementById('soundSlider');

            if (musicSlider) {
                musicSlider.value = this.registry.get('musicVolume') * 100;
            }
            if (soundSlider) {
                soundSlider.value = this.registry.get('soundVolume') * 100;
            }
        });

        //OK button
        const okButton = document.querySelector('.panel .button');
        if (okButton && !okButton.hasClickListener) {
            okButton.addEventListener('click', () => {
                if (this.clickSound) this.clickSound.play();

                const newMusicVolume = parseInt(document.getElementById('musicSlider').value) / 100;
                const newSoundVolume = parseInt(document.getElementById('soundSlider').value) / 100;

                this.registry.set('musicVolume', newMusicVolume);
                this.registry.set('soundVolume', newSoundVolume);
                localStorage.setItem('musicVolume', newMusicVolume);
                localStorage.setItem('soundVolume', newSoundVolume);

                const musicEnabled = newMusicVolume > 0;
                const soundEnabled = newSoundVolume > 0;

                this.registry.set('musicEnabled', musicEnabled);
                this.registry.set('soundEnabled', soundEnabled);
                localStorage.setItem('musicEnabled', musicEnabled.toString());
                localStorage.setItem('soundEnabled', soundEnabled.toString());

                if (this.bgMusic) {
                    if (musicEnabled) {
                        if (!this.bgMusic.isPlaying) {
                            this.bgMusic.play({ loop: true, volume: newMusicVolume });
                        } else {
                            this.bgMusic.setVolume(newMusicVolume);
                        }
                    } else {
                        this.bgMusic.stop();
                    }
                }

                if (this.clickSound) this.clickSound.setVolume(newSoundVolume);

                document.querySelector('.overlay').style.display = 'none';
                document.querySelector('.panel').style.display = 'none';

                this.togglePause(false);

            });
            okButton.hasClickListener = true;
        }

        // Motivation text
        this.motivationTimer = this.time.addEvent({
            delay: 10000,
            loop: true,
            callback: () => {
                if (this.isPaused) return;

                const messages = [
                    "LET'S GO!", "KEEP PUSHING!", "YOU GOT THIS!",
                    "STAY STRONG!", "YOU'RE DOING GREAT!",
                    "BREATHE, FOCUS, PUSH!", "NO PAIN, NO GAIN!"
                ];
                const message = Phaser.Math.RND.pick(messages);

                const randomX = Phaser.Math.Between(width / 2, width / 2 + 200);
                const randomY = Phaser.Math.Between(270, 350);

                this.motivationText.setText(message)
                    .setAlpha(1).setScale(0).setOrigin(0.5)
                    .setPosition(randomX, randomY);

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
                                duration: 600
                            });
                        });
                    }
                });

                if (this.registry.get('soundEnabled')) {
                    const utterance = new SpeechSynthesisUtterance(message);
                    utterance.pitch = 1.8;
                    utterance.rate = 1.5;
                    utterance.volume = this.registry.get('soundVolume') ?? 0.5;
                    if (this.selectedVoice) utterance.voice = this.selectedVoice;
                    speechSynthesis.cancel();
                    speechSynthesis.speak(utterance);
                }
            }
        });

        // Groups
        this.powerUps = this.physics.add.group();
        this.hazards = this.physics.add.group();
        this.obstacles = this.physics.add.group();

        // ✅ Character
        this.runner = this.physics.add.sprite(width * config.x, 0, config.key);
        this.runner.setScale(config.scale);
        this.runner.setOrigin(0.5, 1);
        this.runner.body.allowGravity = true;
        this.runner.setCollideWorldBounds(true);
        this.runner.setDepth(10);

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers(config.key, {
                start: 0,
                end: config.frames - 1
            }),
            frameRate: 10,
            repeat: -1
        });

        this.runner.anims.play('run', true);

        // ✅ Ground
        const ground = this.add.rectangle(0, 470, width, 20, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(ground, true);
        this.physics.add.collider(this.runner, ground);

        // ✅ Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);


        // Spawn events
        this.powerUpTimer = this.time.addEvent({
            delay: Phaser.Math.Between(2500, 4500),
            loop: true,
            callback: () => { if (!this.isPaused) this.spawnPowerUp(); }
        });
        
        this.hazardTimer = this.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000),
            loop: true,
            callback: () => { if (!this.isPaused) this.spawnHazard(); }
        });

        this.clickSound = this.sound.get('click-sound') || this.sound.add('click-sound', {
            volume: this.registry.get('soundVolume') ?? 0.5
        });

        this.time.addEvent({
            delay: Phaser.Math.Between(2500, 5000),
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

    }

    update(time, delta) {
        if (this.isPaused) return;

        this.background.tilePositionX += this.gameSpeed;

        const playerSpeed = 350;
        const jumpHeight = 600;
        const onGround = this.runner.body.blocked.down;

        // ✅ Movement control
        if (this.cursors.left.isDown) {
            this.runner.setVelocityX(-playerSpeed);
            this.runner.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.runner.setVelocityX(playerSpeed);
            this.runner.setFlipX(false);
        } else {
            this.runner.setVelocityX(0);
        }

        if (onGround && Phaser.Input.Keyboard.JustDown(this.spacebar)) {
            this.runner.setVelocityY(-jumpHeight);
        }

        // ✅ Cleanup
        this.powerUps.getChildren().forEach(item => {
            if (item.x < -item.width) item.destroy();
        });
        this.hazards.getChildren().forEach(item => {
            if (item.x < -item.width) item.destroy();
        });

        const elapsed = Math.floor((time - this.startTime) / 1000);
        this.timerText.setText('TIME: ' + elapsed + ' s');
        const deltaSeconds = delta / 1000;
        this.distance += this.gameSpeed * deltaSeconds / 10;
        this.caloriesText.setText('CALORIES: 0');
        this.scoreText.setText('SCORE: 0');
        this.distanceText.setText('DISTANCE: ' + Math.floor(this.distance) + ' m');
    }

    togglePause(pause) {
        this.isPaused = pause;
    
        this.physics.world.isPaused = pause;
        this.powerUpTimer.paused = pause;
        this.hazardTimer.paused = pause;
        this.motivationTimer.paused = pause;
    
        if (pause) {
            this.runner.anims.pause();
        } else {
            this.runner.anims.resume();
        }
    
        this.powerUps.getChildren().forEach(powerUp => {
            if (pause) {
                powerUp.originalVelocity = powerUp.body.velocity.x;
                powerUp.body.setVelocityX(0);
            } else if (powerUp.originalVelocity !== undefined) {
                powerUp.body.setVelocityX(powerUp.originalVelocity);
            }
        });
    
        this.hazards.getChildren().forEach(hazard => {
            if (pause) {
                hazard.originalVelocity = hazard.body.velocity.x;
                hazard.body.setVelocityX(0);
            } else if (hazard.originalVelocity !== undefined) {
                hazard.body.setVelocityX(hazard.originalVelocity);
            }
        });
    
        this.pauseButton.disableInteractive();
        if (!pause) {
            this.pauseButton.setInteractive({ useHandCursor: true });
            if (this.bgMusic && this.registry.get('musicEnabled')) {
                this.bgMusic.resume();
            }
        }
    }
    
    
    isTooClose(newX, newY) {
        const dx = Math.abs(newX - this.lastSpawnedItemX);
        const dy = Math.abs(newY - this.lastSpawnedItemY);
        return dx < this.minDistanceBetweenItems && dy < this.minYDistanceBetweenItems;
    }

    spawnPowerUp() {
        const weightedList = powerUpTypes.flatMap(item => Array(5 - item.rarity).fill(item));
        const { key } = Phaser.Utils.Array.GetRandom(weightedList);
        const currentX = this.sys.game.config.width + 50;

        let y, attempts = 0;
        do {
            y = Phaser.Math.Between(...this.itemSpawnHeightRange);
        } while (this.isTooClose(currentX, y) && ++attempts < 10);

        const item = this.powerUps.create(currentX, y, key);
        item.setVelocityX(-this.gameSpeed * 50).setDisplaySize(80, 80);
        item.body.allowGravity = false;
        item.setImmovable(true);
        item.collectibleType = powerUpTypes.find(p => p.key === key); // Store reference
        this.lastSpawnedItemX = currentX;
        this.lastSpawnedItemY = y;
    }

    spawnHazard() {
        const weightedList = hazardTypes.flatMap(item => Array(5 - item.rarity).fill(item));
        const { key } = Phaser.Utils.Array.GetRandom(weightedList);
        const currentX = this.sys.game.config.width + 100;

        let y, attempts = 0;
        do {
            y = Phaser.Math.Between(...this.itemSpawnHeightRange);
        } while (this.isTooClose(currentX, y) && ++attempts < 10);

        const item = this.hazards.create(currentX, y, key);
        item.setVelocityX(-this.gameSpeed * 50).setDisplaySize(80, 80);
        item.body.allowGravity = false;
        item.setImmovable(true);
        item.collectibleType = hazardTypes.find(h => h.key === key);
        this.lastSpawnedItemX = currentX;
        this.lastSpawnedItemY = y;
    }

    spawnObstacle() {
        const key = Phaser.Utils.Array.GetRandom(obstacleTypes);
        const currentX = this.sys.game.config.width + 50;
        const y = 480;

        const obstacle = this.obstacles.create(currentX, y, key);
        obstacle.setVelocityX(-this.gameSpeed * 50);
        obstacle.setDisplaySize(110, 110);
        obstacle.setOrigin(0.5, 1);
        obstacle.body.allowGravity = false;
        obstacle.setImmovable(true);
        obstacle.setDepth(5);
    }
}