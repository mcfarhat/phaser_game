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

        // Pause pannel
        const pauseOverlay = document.getElementById('pauseOverlay');
        const resumeBtn = document.getElementById('resumeBtn');
        const restartBtn = document.getElementById('restartBtn');
        const homeBtn = document.getElementById('homeBtn');

        if (resumeBtn && !resumeBtn.hasClickListener) {
            resumeBtn.addEventListener('click', () => {
                if (this.clickSound) this.clickSound.play();
                pauseOverlay.style.display = 'none';
                this.togglePause(false);
            });
            resumeBtn.hasClickListener = true;
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

        this.calories = 0;
        this.distance = 0;
        this.startTime = this.time.now;

        this.caloriesText = this.add.text(16, 7, 'CALORIES: 0', 
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

        this.timerText = this.add.text(200, 7, 'Time: 0 s', 
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

        this.distanceText = this.add.text(350, 7, 'Distance: 0 m', 
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

        this.voiceEnabled = this.registry.get('soundEnabled') ?? true;

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
            document.querySelector('.overlay').style.display = 'block';
            document.querySelector('.panel').style.display = 'flex';

            document.getElementById('musicSlider').value = (this.registry.get('musicVolume') ?? 0) * 100;
            document.getElementById('soundSlider').value = (this.registry.get('soundVolume') ?? 0.5) * 100;
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

        this.clickSound = this.sound.get('click-sound') || this.sound.add('click-sound', {
            volume: this.registry.get('soundVolume') ?? 0.5
        });
    }

    update(time, delta) {
        if (this.isPaused) return;

        this.background.tilePositionX += this.gameSpeed;

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
        this.distanceText.setText('DISTANCE: ' + Math.floor(this.distance) + ' m');
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

    isTooClose(newX, newY) {
        const dx = Math.abs(newX - this.lastSpawnedItemX);
        const dy = Math.abs(newY - this.lastSpawnedItemY);
        return dx < this.minDistanceBetweenItems && dy < this.minYDistanceBetweenItems;
    }

    spawnPowerUp() {
        const types = ['granola-bar', 'Avocado', 'Boiled Egg', 'Berries', 'Broccoli', 'Pomegranate', 'Banana', 'energy-drink', 'Mango', 'Proteinshake', 'Salad Bowl'];
        const key = Phaser.Utils.Array.GetRandom(types);
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
        const types = ['Candy Bar', 'Soda', 'Fries', 'Burger', 'Hotdog', 'Donuts', 'Pizza'];
        const key = Phaser.Utils.Array.GetRandom(types);
        const currentX = this.sys.game.config.width + 100;

        let y, attempts = 0;
        do {
            y = Phaser.Math.Between(...this.itemSpawnHeightRange);
        } while (this.isTooClose(currentX, y) && ++attempts < 10);

        const item = this.hazards.create(currentX, y, key);
        item.setVelocityX(-this.gameSpeed * 50).setDisplaySize(80, 80);
        item.body.allowGravity = false;
        item.setImmovable(true);
        this.lastSpawnedItemX = currentX;
        this.lastSpawnedItemY = y;
    }
}