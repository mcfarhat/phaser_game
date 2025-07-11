import { PLAYER_CONFIGS, powerUpTypes, hazardTypes, obstacleTypes } from '../config.js';
import { supabase } from '../supabaseClient.js';

async function submitScore(player_name, score, calories) {
    const { data: existing, error: fetchError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('player_name', player_name)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing score:', fetchError.message);
        return;
    }

    if (!existing || score > existing.score || calories > existing.calories) {
        console.log("Submitting:", {
            player_name,
            score: Math.max(score, existing?.score ?? 0),
            calories: Math.max(calories, existing?.calories ?? 0),
            existing
        });

        const { data, error } = await supabase
            .from('leaderboard')
            .upsert([
                {
                    player_name,
                    score: Math.max(score, existing?.score ?? 0),
                    calories: Math.max(calories, existing?.calories ?? 0)
                }
            ], { onConflict: ['player_name'] });

        if (error) {
            console.error('Error updating leaderboard:', error.message);
        } else {
            console.log('Leaderboard updated:', data);
        }
    } else {
        console.log('Score not high enough to update.');
    }
}

export async function fetchAndDisplayLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = `
        <li style="
        text-align: center;
        font-family: 'Luckiest Guy', cursive;
        font-size: 17px;
        //   padding: 10px;
        color: #ccc;
        ">Loading...</li>
    `;

    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .order('calories', { ascending: false })
        .limit(5);

    if (error) {
        leaderboardList.innerHTML = `
        <li style="color: white; font-size: 20px;">Failed to load leaderboard</li>
        `;
        console.error('Error fetching leaderboard:', error.message);
        return;
    }

    leaderboardList.innerHTML = '';

    data.forEach(({ player_name, score, calories }, index) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.justifyContent = 'start';
    li.style.margin = '20px 20px';
    li.style.fontSize = '17px';
    li.style.fontFamily = "'Luckiest Guy', cursive";
    li.style.letterSpacing = '1.5px';
    li.style.gap = '20px';

    const wrapperId = `leaderboard-stats-${index}`;

    li.innerHTML = `
        <span style="width: 30px; text-align: center; color: #fff;">
        <strong>${index + 1}</strong>
        </span>

        <span style="color: #fff; letter-spacing: 1.5px;">
        ${player_name}
        </span>

        <span id="${wrapperId}" style="
        padding: 2px 20px 2px 40px;
        background-color: #fff;
        border-radius: 5px;
        color: #3f3c36;
        display: flex;
        gap: 20px;
        align-items: center;
        font-size: 17px;
        position: relative;
        ">
        <img src="assets/icons/medals.svg" alt="medal" style="
            width: 40px;
            height: 40px;
            position: absolute;
            left: -13px;
            top: 50%;
            transform: translateY(-50%);
        ">
        <span>${score}</span>
        <span>${calories}</span>
        </span>
    `;

    leaderboardList.appendChild(li);
    });
}

export async function showLeaderboardUI() {
    document.getElementById('leaderboard-container').style.display = 'flex';
    document.querySelector('.overlay').style.display = 'block';
    await fetchAndDisplayLeaderboard();
}


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
        this.selectedCharacter = data.selectedCharacter;
        this.playerName = data.playerName;
        if (data.startTimer) {
            this.levelDuration = 5 * 60 * 1000; // 5 minutes
            this.shouldStartTimer = true;
        }
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
        this.lives = 3;
        this.distance = 0;
        this.levelEnded = false;
        this.timerStarted = false;

        this.scoreText = this.add.text(10, 7, 'SCORE: 0', 
        { 
            fontSize: '15px', 
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

        this.caloriesText = this.add.text(120, 7, 'CALORIES: 0', 
        { 
            fontSize: '15px', 
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

        this.timeLeftText = this.add.text(270, 7, 'TIME: 5:00', 
        { 
            fontSize: '15px', 
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
        this.timeLeftText.setResolution(3);

        this.distanceText = this.add.text(390, 7, 'Distance: 0 m', 
        { 
            fontSize: '15px', 
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
            const heart = this.add.image(570 + i * 34, 17, 'heart')
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
        this.pauseButton = this.add.text(width - 33, 1, '⏸', {
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
            this.scene.pause();

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

                this.scene.resume();
            });
            okButton.hasClickListener = true;

            const closeLeaderboardBtn = document.getElementById('close-leaderboard');
            if (closeLeaderboardBtn && !closeLeaderboardBtn.hasListener) {
                closeLeaderboardBtn.addEventListener('click', () => {
                    if (this.clickSound) this.clickSound.play();
                    document.getElementById('leaderboard-container').style.display = 'none';
                    document.querySelector('.overlay').style.display = 'none';
                    this.scene.resume();
                    closeLeaderboardBtn.hasListener = false;
                });
                closeLeaderboardBtn.hasListener = true;
            }
        }

        // Trophy
        this.leaderboardIcon = this.add.image(width - 60, 5, 'trophy-icon')
            .setDisplaySize(28, 28)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true });

        this.leaderboardIcon.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            this.scene.pause();
            showLeaderboardUI();
        });

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
        this.jumpCount = 0; // for double jump

        const fw = config.frameWidth;   // actual displayed width
        const fh = config.frameHeight;  // actual displayed height

        //Picking the hitbox as 75% of the full size:
        const hbW = Math.round(fw * 0.75);
        const hbH = Math.round(fh * 0.75);

        //Centering it horizontally under the sprite:
        const offX = Math.round((fw - hbW) / 2);

        //Pushing it down so its bottom edge sits at the sprite’s feet:
        const offY = Math.round(fh - hbH);

        //Applying to the physics body:
        this.runner.body.setSize(hbW, hbH);
        this.runner.body.setOffset(offX, offY);

        this.runner.setScale(config.scale);
        this.runner.setOrigin(0.5, 1);
        this.runner.body.allowGravity = true;
        this.runner.setCollideWorldBounds(true);
        this.runner.setGravityY(600); // default is 0 

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
        this.physics.add.collider(this.runner, ground, () => {
            this.jumpCount = 0; // reset jump count on ground touch
        });


        // ✅ Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        // Healthy food (power-ups)
        this.physics.add.overlap(this.runner, this.powerUps, this.collectPowerUp, null, this);

        // Junk food (hazards)
        this.physics.add.overlap(this.runner, this.hazards, this.collectHazard, null, this);

        // Obstacle collision (deduct life)
        this.physics.add.collider(this.runner, this.obstacles, this.hitObstacle, null, this);


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
        if (this.shouldStartTimer) {
            this.time.delayedCall(0, () => this.startTimer());
        }
    }

    update(time, delta) {
        if (this.levelEnded) return;

        if (this.shouldStartTimer && !this.timerStarted) {
            this.startTimer();
        }

        // Only check level completion if timer is running
        if (this.timerStarted && time > this.levelEndTime && !this.levelEnded) {
            this.levelCompleted();
            return;
        }


        if (this.isPaused) return;

        this.background.tilePositionX += this.gameSpeed;

        const playerSpeed = 350;
        const jumpHeight = 500;
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

        if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
        if (this.jumpCount < 2) {
            this.runner.setVelocityY(-jumpHeight);
            this.jumpCount++;
        }
    }


        // ✅ Cleanup
        this.powerUps.getChildren().forEach(item => {
            if (item.x < -item.width) item.destroy();
        });
        this.hazards.getChildren().forEach(item => {
            if (item.x < -item.width) item.destroy();
        });

        const deltaSeconds = delta / 1000;
        this.distance += this.gameSpeed * deltaSeconds / 10;
        this.caloriesText.setText('CALORIES: ' + this.calories );
        this.scoreText.setText('SCORE: ' + this.score);
        this.distanceText.setText('DISTANCE: ' + Math.floor(this.distance) + ' m');
        if (this.timerStarted) {
            const timeLeft = Math.max(0, this.levelEndTime - time);
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            this.timeLeftText.setText(`TIME: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        } else {
            this.timeLeftText.setText(`TIME: 5:00`);
        }

    }

    startTimer() {
        this.startTime = this.time.now;
        this.levelEndTime = this.startTime + this.levelDuration;
        this.timerStarted = true; // Mark timer as started
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
    
    isTooClose(x, y) {
        const minXGap = 500;
        const minYGap = 100; 
        return (
            Math.abs(x - this.lastSpawnedItemX) < minXGap &&
            Math.abs(y - this.lastSpawnedItemY) < minYGap
        );
    }

    spawnPowerUp() {
        const weightedList = powerUpTypes.flatMap(item => Array(5 - item.rarity).fill(item));
        const { key } = Phaser.Utils.Array.GetRandom(weightedList);
        const currentX = this.sys.game.config.width + 50;

        let y, attempts = 0;
        do {
            y = Phaser.Math.Between(...this.itemSpawnHeightRange) - 80;
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
            y = Phaser.Math.Between(...this.itemSpawnHeightRange) - 50;
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
        obstacle.body.setSize(60, 40);
        obstacle.body.setOffset(25, 70);
    }
    collectPowerUp(player, item) {
        const data = powerUpTypes.find(p => p.key === item.texture.key);
        if (!data) return;

        this.score += data.score;
        this.calories += data.calories;

        this.scoreText.setText('SCORE: ' + this.score);
        this.caloriesText.setText('CALORIES: ' + this.calories);

        item.destroy();
    }

    collectHazard(player, item) {
        const data = hazardTypes.find(h => h.key === item.texture.key);
        if (!data) return;

        this.score += data.score; // this will reduce score since it's negative
        this.calories += data.calories;

        this.scoreText.setText('SCORE: ' + this.score);
        this.caloriesText.setText('CALORIES: ' + this.calories);

        item.destroy();
    }

    hitObstacle(player, obstacle) {
        this.playHitFeedback();

        obstacle.destroy();

        if (this.lives > 0) {
            this.lives--;

            const heart = this.hearts[this.lives];
            if (heart) {
                // Animate heart: scale up slightly then shrink & fade out
                this.tweens.timeline({
                    targets: heart,
                    ease: 'Power1',
                    tweens: [
                        {
                            scale: heart.scale * 1.3,
                            duration: 150,
                        },
                        {
                            scale: 0,
                            alpha: 0,
                            angle: 360,
                            duration: 300,
                            onComplete: () => {
                                heart.setVisible(false);
                                // Reset scale and alpha for potential reuse
                                heart.setScale(0.04);
                                heart.setAlpha(1);
                            }
                        }
                    ]
                });
            }
            if (this.lives === 0) {
                this.gameOver();
            }
        }
    }

    gameOver() {
        this.togglePause(true);

        // Stop player movement and animation
        this.runner.setVelocity(0);
        this.runner.anims.stop();

        // Fall animation (rotate and drop to ground)
        this.tweens.add({
        targets: this.runner,
        y: this.runner.y + 50,       // Drop slightly to the ground
        angle: 80,                   
        duration: 500,               // Faster impact
        ease: 'Cubic.easeIn',
        onComplete: () => {
            this.runner.setVelocity(0);
            this.runner.body.allowGravity = false;
        }
        });


        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // GAME OVER Text
        const gameOverText = this.add.text(width / 2, height * 0.35, 'GAME OVER', {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Luckiest Guy',
            stroke: '#729C97',
            strokeThickness: 6,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 8,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setResolution(3);

        this.time.delayedCall(200, async () => {
            const playerName = localStorage.getItem('playerName');
            await submitScore(playerName, this.score, this.calories);
            await showLeaderboardUI();
        });
        
        // Common button function
        const createButton = (label, x, y, callback) => {
            const btnWidth = 100;
            const btnHeight = 45;
            const normalColor = 0x729C97;
            const hoverColor = 0x7AAFBA;

            const buttonBg = this.add.graphics();
            buttonBg.fillStyle(normalColor, 1);
            buttonBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);

            const buttonText = this.add.text(0, 0, label, {
                fontSize: '21px',
                fill: '#fff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000',
                    blur: 8,
                    stroke: true,
                    fill: true
                },
            }).setOrigin(0.5).setResolution(3);

            const button = this.add.container(x, y, [buttonBg, buttonText]);
            button.setSize(btnWidth, btnHeight);
            button.setInteractive();

            button.on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillStyle(hoverColor, 1);
                buttonBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
                this.input.setDefaultCursor('pointer');
            });

            button.on('pointerout', () => {
                buttonBg.clear();
                buttonBg.fillStyle(normalColor, 1);
                buttonBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
                this.input.setDefaultCursor('default');
            });

            button.on('pointerdown', () => {
                if (this.clickSound) this.clickSound.play();
                callback();
            });

            this.tweens.add({
                targets: button,
                scaleX: 1.08,
                scaleY: 1.08,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                duration: 600
            });
        };

        // Restart Button
        createButton('RESTART', width / 2 - 70, height * 0.55, () => {
            this.scene.restart();
        });

        // Home Button
        createButton('HOME', width / 2 + 70, height * 0.55, () => {
            this.scene.stop();
            this.scene.start('StartScene');
        });
    }

    levelCompleted() {
        this.levelEnded = true;
        this.togglePause(true);
        
        // Stop player movement and animation
        this.runner.setVelocity(0);
        this.runner.anims.stop();
        
        this.showLevelCompleteScreen();
    }

    showLevelCompleteScreen() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    // Overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
        .setOrigin(0)
        .setDepth(100);
    
    // Pulsing Title Animation
    const levelCompleteText = this.add.text(width / 2, height * 0.2, 'LEVEL COMPLETE!', {
        fontSize: '48px',
        fill: '#7FFF00',
        fontFamily: 'Luckiest Guy',
        stroke: '#729C97',
        strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5)
     .setDepth(101)
     .setResolution(3);

    this.tweens.add({
        targets: levelCompleteText,
        scale: { from: 1.1, to: 1.2 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Stats with custom colors
    const stats = [
        { 
            label: 'HEARTS REMAINING: ', 
            value: this.lives,
            color: '#FF6B6B' // Coral red for hearts
        },
        { 
            label: 'SCORE: ', 
            value: this.score,
            color: '#4ECDC4' // Turquoise for score
        },
        { 
            label: 'CALORIES: ', 
            value: this.calories,
            color: '#FFD166' // Yellow for calories
        },
        { 
            label: 'DISTANCE: ', 
            value: `${Math.floor(this.distance)}m`,
            color: '#06D6A0' // Green for distance
        }
    ];
    
    // Create stats with color coding
    stats.forEach((stat, i) => {
        const yPos = height * 0.35 + (i * 60);
        
        const statText = this.add.text(width / 2, yPos, `${stat.label}${stat.value}`, {
            fontSize: '28px',
            fill: stat.color,
            fontFamily: 'Luckiest Guy',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5)
         .setDepth(101)
         .setResolution(3);

        this.tweens.add({
            targets: statText,
            alpha: { from: 0, to: 1 },
            duration: 500,
            delay: 300 * i,
            ease: 'Back'
        });
    });

    // Confetti Particle Effect
    const emitter = this.add.particles('heart').createEmitter({
        x: width / 2,
        y: 0,
        speed: { min: 100, max: 200 },
        angle: { min: 180, max: 360 },
        scale: { start: 0.04, end: 0 },
        blendMode: 'SCREEN',
        lifespan: 3000,
        gravityY: 300,
        frequency: 100
    });
    emitter.depth = 99;

    // Improved Button with Rounded Corners and Simple Hover Effect
    const nextLevelButton = this.add.text(width / 2, height * 0.8, 'LEVEL 2', {
        fontSize: '32px',
        fill: '#FFFFFF',
        fontFamily: 'Luckiest Guy',
        backgroundColor: '#729C97',
        padding: { x: 50, y: 20 },
        borderRadius: 20, 
        align: 'center'
    }).setOrigin(0.5)
     .setInteractive()
     .setDepth(102)
     .setResolution(3);

    // Button animations
    this.tweens.add({
        targets: nextLevelButton,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.9, to: 1.0 },
        duration: 800,
        delay: 1500,
        ease: 'Elastic'
    });

    // Simple hover effect - just scales up
    nextLevelButton.on('pointerover', () => {
        this.tweens.add({
            targets: nextLevelButton,
            scale: 1.1,
            duration: 200,
            ease: 'Quad.easeOut'
        });
    });

    nextLevelButton.on('pointerout', () => {
        this.tweens.add({
            targets: nextLevelButton,
            scale: 1.0,
            duration: 200,
            ease: 'Quad.easeOut'
        });
    });

    nextLevelButton.on('pointerdown', () => {
        if (this.clickSound) this.clickSound.play();
        this.scene.start('Level2Scene', { 
            lives: this.lives,
            score: this.score,
            calories: this.calories,
            distance: this.distance
        });
    });
}


    playHitFeedback() {
        if (navigator.vibrate) navigator.vibrate(200);
        this.cameras.main.shake(200, 0.01);
        this.tweens.add({
            targets: this.runner,
            tint: 0xff0000,
            yoyo: true,
            duration: 100,
            repeat: 2,
            onComplete: () => this.runner.clearTint()
        });
    }
}
