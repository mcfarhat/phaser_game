import { PLAYER_CONFIGS, powerUpTypes, hazardTypes, obstacleTypes, LEVEL_CONFIGS } from '../config.js';
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
    leaderboardList.innerHTML = ''; // Clear any existing content

    // Header Row (as a div)
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.flexDirection = 'row';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.alignItems = 'center';
    headerRow.style.gap = '20px';
    headerRow.style.padding = '8px 20px';
    headerRow.style.fontSize = '17px';
    headerRow.style.letterSpacing = '1.2px';
    headerRow.style.color = '#FFF';
    headerRow.style.borderBottom = '2px solid #EFEFEF';
    headerRow.style.marginBottom = '8px';
    headerRow.style.fontFamily = "'Luckiest Guy', cursive";

    headerRow.innerHTML = `
        <span style="flex: 2; text-align: left;">NICKNAME</span>
        <span style="flex: 1; text-align: right;">SCORE</span>
        <span style="flex: 1; text-align: right;">CALORIES</span>
    `;

    leaderboardList.appendChild(headerRow);

    // Fetch leaderboard data
    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .order('calories', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching leaderboard:', error.message);
        return;
    }

    data.forEach(({ player_name, score, calories }, index) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '5px 20px';
        row.style.fontSize = '17px';
        row.style.fontFamily = "'Luckiest Guy', cursive";
        row.style.borderBottom = '1px solid #aaa';
        row.style.color = '#fff';
        row.style.gap = '20px';

        // Highlight top 3
        if (index === 0) {
        row.classList.add('sparkle-gold'); 
        } else if (index === 1) {
        row.classList.add('sparkle-silver'); 
        } else if (index === 2) {
        row.classList.add('sparkle-bronze');
        }

        row.innerHTML = `
            <span style="flex: 2; text-align: left;">${player_name}</span>
            <span style="flex: 1; text-align: left;">${score}</span>
            <span style="flex: 1; text-align: left;">${calories}</span>
        `;

        leaderboardList.appendChild(row);
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
        this.lastSpawnedItemX = -Infinity;
        this.lastSpawnedItemY = -Infinity;
        this.minDistanceBetweenItems = 150;
        this.minYDistanceBetweenItems = 120; 
        this.selectedVoice = null;
    }

    init(data) {
        this.selectedCharacter = this.registry.get('selectedCharacter')
        || PLAYER_CONFIGS[0].key;
        this.config = PLAYER_CONFIGS.find(p => p.key === this.selectedCharacter);

        this.playerName = data.playerName;
        this.levelId = data.levelId || 1; // ✅ Move this up first
        this.levelConfig = LEVEL_CONFIGS.find(l => l.id === this.levelId); // now safe
        this.calorieBurnPerSecond = this.levelConfig.calorieBurnPerSecond || 0;
        this.calorieBurnPerJump = this.levelConfig.calorieBurnPerJump || 0;


        if (data.startTimer) {
            this.levelDuration = this.levelConfig.duration;
            this.shouldStartTimer = true;
        }
        
        this.gameSpeed = this.levelConfig.speed;
        this.itemSpawnHeightRange = this.levelConfig.spawnRange;
        
        this.score = this.registry.get('score') ?? 0;
        this.calories = this.registry.get('calories') ?? 0;
        this.distance = this.registry.get('distance') ?? 0;
        this.lives = this.registry.get('lives') ?? 3;
        
        this.elapsedTime = 0;           // Tracks gameplay time
        this.timerStarted = false;     // Starts true when actual timer begins
    }

    
    preload() {
    this.load.image('heart', 'assets/icons/heart.svg');
    
  // Dynamically load backgrounds from 1 to 10
  for (let i = 1; i <= 10; i++) {
    this.load.image(`background${i}`, `assets/backgrounds/background${i}.png`);
  }

}
updateCaloriesText() {
    this.caloriesText.setText('CALORIES: ' + Math.floor(this.calories));
}




    create() {
        const { width, height } = this.sys.game.config;
        this.isPaused = false;

        console.log(this.selectedCharacter);

        const soundVolume = this.registry.get('soundVolume');

        this.hitSound = this.sound.add('hit-sound', { volume: soundVolume });
        this.gameOverSound = this.sound.add('game-over', { volume: soundVolume });
        this.levelCompleteSound = this.sound.add('level-complete', { volume: soundVolume });
        this.collectItemSound = this.sound.add('collect-item', { volume: soundVolume });


        // Pause pannel
        const pauseOverlay = document.getElementById('pauseOverlay');
        const closePauseBtn = document.getElementById('closePauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        const homeBtn = document.getElementById('homeBtn');

        const closeLeaderboardBtn = document.getElementById('close-leaderboard');
        if (closeLeaderboardBtn && !closeLeaderboardBtn.dataset.listenerAttached) {
            closeLeaderboardBtn.addEventListener('click', () => {
                if (this.clickSound) this.clickSound.play();
                document.getElementById('leaderboard-container').style.display = 'none';
                document.querySelector('.overlay').style.display = 'none';
                this.scene.resume();
            });
            closeLeaderboardBtn.dataset.listenerAttached = 'true';
        }

        if (restartBtn && !restartBtn.hasClickListener) {
            restartBtn.addEventListener('click', () => {
                if (this.clickSound) this.clickSound.play();
                pauseOverlay.style.display = 'none';
                // 🔄 Reset all stats
                this.resetStats();

                // 🏁 Start fresh from Level 1
                this.scene.stop('GameScene');
                this.scene.start('GameScene', {
                    playerName: this.playerName,
                    levelId: this.levelId,
                    startTimer: true
                });
            });
            restartBtn.hasClickListener = true;
        }

        if (homeBtn && !homeBtn.hasClickListener) {
            homeBtn.addEventListener('click', () => {
                if (this.clickSound) this.clickSound.play();
                pauseOverlay.style.display = 'none';
                this.resetStats();
                this.registry.remove('selectedCharacter');
                this.scene.stop('GameScene');
                this.scene.start('StartScene');
            });
            homeBtn.hasClickListener = true;
        }

        // Background
        const bgKey = this.levelConfig.background || 'background1';

        this.background = this.add.tileSprite(0, 0, 0, 0, bgKey)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-1);

        const bg = this.textures.get(bgKey).getSourceImage();
        this.background.setScale(width / bg.width, height / bg.height);


        const hudHeight = 40;        // total height of the stats bar
        const hudPadding = 10;       // inner padding for text

        const hudBg = this.add.rectangle(
        0,          // x
        0,          // y
        width,      // full width of the game canvas
        hudHeight,  // height of the bar
        0x000000,   // black
        0.4         // 40% opacity
        )
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(50);
        
        this.extraHeartTimer = null;
        this.levelEnded = false;
        this.timerStarted = false;

        const hudStyle = {
            fontSize: '18px', 
            fill: '#fff', 
            fontFamily: 'Luckiest Guy', 
            letterSpacing: '1.5px',
        };

        // Score
        this.scoreText = this.add.text(
        hudPadding, hudPadding,
        'SCORE: 0',
        hudStyle
        ).setScrollFactor(0).setDepth(51);

        // Calories
        this.caloriesText = this.add.text(
        hudPadding + 110, hudPadding,
        'CALORIES: 0',
        hudStyle
        ).setScrollFactor(0).setDepth(51);

        // Time Left
        this.timeLeftText = this.add.text(
        hudPadding + 260, hudPadding,
        'TIME: 5:00',
        hudStyle
        ).setScrollFactor(0).setDepth(51);

        // Distance
        this.distanceText = this.add.text(
        hudPadding + 390, hudPadding,
        'DISTANCE: 0 m',
        hudStyle
        ).setScrollFactor(0).setDepth(51);   

        this.levelText = this.add.text(
        width / 2,                // center horizontally
        hudHeight + hudPadding,   // just below the box
        `LEVEL: ${this.levelId}`, // dynamic level number
        {
            fontSize: '25px',
            fill: '#FFD700', // ← Gold color 
            fontFamily: 'Luckiest Guy', 
            letterSpacing: '1.5px',
        }
        )
        .setOrigin(0.5, 0)  // center-align horizontally, top-align vertically
        .setScrollFactor(0)
        .setDepth(51);
        
        this.hearts = [];

        for (let i = 0; i < this.lives; i++) {
            const heart = this.add.image(565 + i * 35, 20, 'heart') // adjust position as needed
                .setScale(0.040) // scale to fit nicely
                .setScrollFactor(0) // fix to camera
                .setDepth(60);

            this.hearts.push(heart);
        }

        this.motivationText = this.add.text(400, 100, '', {
            fontSize: '30px', fontFamily: 'Luckiest Guy', fill: '#7AAFBA'
        }).setAlpha(0);

        // Music and sound settings
        this.bgMusic = this.sound.get('start-sound');
        if (this.registry.get('musicEnabled') && !this.bgMusic.isPlaying) {
            this.bgMusic.play({ loop: true, volume: this.registry.get('musicVolume') });
        }

        // Pause button
        this.pauseButton = this.add.image(width - 40, 2, 'pause-icon')
            .setDisplaySize(16, 31)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true });

        this.pauseButton.setScrollFactor(0);
        this.pauseButton.setDepth(60);


        this.pauseButton.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            document.getElementById('pauseOverlay').style.display = 'flex';
            this.togglePause(true);
        });

        this.swapCharacterButton = this.add.image(width - 107, 18, 'swap-icon') // Preload 'swap_icon'
            .setOrigin(0.5)
            .setScale(0.04) // Adjust scale
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(100)
            .on('pointerdown', () => {
                if (!this.paused) { // Only allow swap if not already paused
                    this.togglePause(true);

                    this.showCharacterSwapOverlay(); // Call a new method to handle selection
                }
            });

        // SETTINGS button
        const settingsBtn = this.add.image(width - 10, 6, 'settings-icon')
            .setDisplaySize(25, 23)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true });

        settingsBtn.setDepth(60);
        settingsBtn.setScrollFactor(0);

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

            const closePauseBtn = document.getElementById('closePauseBtn');
            if (closePauseBtn && !closePauseBtn.hasClickListener) {
                closePauseBtn.addEventListener('click', () => {
                    if (this.clickSound) this.clickSound.play();
                    document.getElementById('pauseOverlay').style.display = 'none';
                    this.togglePause(false);
                });
                closePauseBtn.hasClickListener = true;
            }
        }

        // Trophy
        this.leaderboardIcon = this.add.image(width - 63, 6, 'trophy-icon')
            .setDisplaySize(25, 23)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .setDepth(60);


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
            }
        });

        // Groups
        this.powerUps = this.physics.add.group();
        this.hazards = this.physics.add.group();
        this.obstacles = this.physics.add.group();
        this.extraHearts = this.physics.add.group();



        // ✅ Character
        this.runner = this.physics.add.sprite(width * this.config.x, 0, this.config.key);
        this.jumpCount = 0; // for double jump

        const fw = this.config.frameWidth;
        const fh = this.config.frameHeight;

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

        this.runner.setScale(this.config.scale);
        this.runner.setOrigin(0.5, 1);
        this.runner.body.allowGravity = true;
        this.runner.setCollideWorldBounds(true);
        this.runner.setGravityY(600); // default is 0

        this.runner.setDepth(10);

        // Create a unique animation key for the selected character
        // We're using the character's key (e.g., 'runner1', 'runner2')
        // to make the animation key unique (e.g., 'runner1_run', 'runner2_run')
        const animKey = `${this.config.key}_run`;

        // Check if the animation already exists (optional, but good practice
        // to prevent Phaser warnings if GameScene is restarted multiple times
        // without a full page refresh)
        if (!this.anims.get(animKey)) {
            this.anims.create({
                key: animKey, // Use the unique key here
                frames: this.anims.generateFrameNumbers(this.config.key, {
                    start: 0,
                    end: this.config.frames - 1
                }),
                frameRate: 10,
                repeat: -1
            });
        }
        this.runner.anims.play(animKey, true); // Play the unique animation

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

        this.physics.add.overlap(this.runner, this.extraHearts, this.collectExtraHeart, null, this);


        // Obstacle collision (deduct life)
        this.physics.add.collider(this.runner, this.obstacles, this.hitObstacle, null, this);


        // Spawn events
        this.powerUpTimer = this.time.addEvent({
            delay: this.levelConfig.powerUpFrequency,
            loop: true,
            callback: () => { if (!this.isPaused) this.spawnPowerUp(); }
        });
        
        this.hazardTimer = this.time.addEvent({
            delay: this.levelConfig.hazardFrequency,
            loop: true,
            callback: () => { if (!this.isPaused) this.spawnHazard(); }
        });
if (this.levelConfig.extraHeartSpawnRange) {
    const [min, max] = this.levelConfig.extraHeartSpawnRange;

    const scheduleExtraHeart = () => {
        const delay = Phaser.Math.Between(min, max);
        console.log(`Next heart in ${delay / 1000}s`); // Debug log

        this.time.delayedCall(delay, () => {
            if (!this.levelEnded && !this.isPaused) {
                console.log('Spawning extra heart'); // Debug log
                this.spawnExtraHeart();
                scheduleExtraHeart(); // Schedule the next one
            }
        });
    };

    scheduleExtraHeart(); // Start spawning hearts
}


        this.clickSound = this.sound.get('click-sound') || this.sound.add('click-sound', {
            volume: this.registry.get('soundVolume') ?? 0.5
        });

        this.time.addEvent({
            delay: this.levelConfig.obstacleFrequency,
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

        // New countdown logic—only ticks when unpaused
        if (this.timerStarted && !this.isPaused) {
            this.elapsedTime += delta;

            // compute remaining time
            const timeLeft = Math.max(this.levelDuration - this.elapsedTime, 0);
            const mins = Math.floor(timeLeft / 60000);
            const secs = Math.floor((timeLeft % 60000) / 1000)
            .toString().padStart(2, '0');

            // update the HUD
            this.timeLeftText.setText(`TIME: ${mins}:${secs}`);

            // end the level when clock hits zero
            if (timeLeft === 0 && !this.levelEnded) {
            this.levelEnded = true;
            this.levelCompleted();
            return;
            }
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

        // 👟 Burn calories for each jump
        this.calories -= this.calorieBurnPerJump;
      
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
        this.calories -= this.calorieBurnPerSecond * deltaSeconds;


        this.distance += this.gameSpeed * deltaSeconds / 10;
        this.updateCaloriesText();


        this.scoreText.setText('SCORE: ' + this.score);
        this.distanceText.setText('DISTANCE: ' + Math.floor(this.distance) + ' m');
        

    }

    startTimer() {
        this.timerStarted = true; // Mark timer as started
    }

    togglePause(pause) {
        this.isPaused = pause;

        this.physics.world.isPaused = pause; // This pauses/resumes all physics bodies automatically
        this.powerUpTimer.paused = pause;
        this.hazardTimer.paused = pause;
        this.motivationTimer.paused = pause;
        if (this.extraHeartTimer && !this.extraHeartTimer.hasDispatched) {
            this.extraHeartTimer.paused = pause;
        }

        if (pause) {
            this.runner.anims.pause();
        } else {
            this.runner.anims.resume();
        }

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
spawnExtraHeart() {
    const currentX = this.sys.game.config.width + 50;
    const y = Phaser.Math.Between(...this.itemSpawnHeightRange) - 50;

    const heart = this.extraHearts.create(currentX, y, 'heart');
    heart.setVelocityX(-this.gameSpeed * 50);
    heart.setDisplaySize(60, 60);
    heart.body.allowGravity = false;
    heart.setImmovable(true);
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

        this.collectItemSound.setVolume(this.registry.get('soundVolume')).play();

        this.score += data.score;
        this.calories += data.calories;

        this.scoreText.setText('SCORE: ' + this.score);
        this.updateCaloriesText();


        item.destroy();
    }

    collectHazard(player, item) {
        const data = hazardTypes.find(h => h.key === item.texture.key);
        if (!data) return;

        this.collectItemSound.setVolume(this.registry.get('soundVolume')).play();

        this.score += data.score; // this will reduce score since it's negative
        this.calories += data.calories;

        this.scoreText.setText('SCORE: ' + this.score);
        this.updateCaloriesText();


        item.destroy();
    }
collectExtraHeart(player, heart) {
    if (this.lives < 3) {
        this.lives++;

        
        const heartIcon = this.hearts[this.lives - 1];
        if (heartIcon) {
            heartIcon.setVisible(true);
            heartIcon.setScale(0.04);
            heartIcon.setAlpha(1);
        }

        if (this.collectItemSound && this.registry.get('soundEnabled')) {
            this.collectItemSound.setVolume(this.registry.get('soundVolume')).play();
        }
    }

    heart.destroy();
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
             if (this.lives > 0 && this.hitSound && this.registry.get('soundEnabled')) {
                this.hitSound.setVolume(this.registry.get('soundVolume'));
                this.hitSound.play();
            }

            if (this.lives === 0) {
                if (this.gameOverSound && this.registry.get('soundEnabled')) {
                    this.gameOverSound.setVolume(this.registry.get('soundVolume'));
                    this.gameOverSound.play();
                }

                this.gameOver();
            }
        }
    }

    gameOver() {
    
        this.allowButtons = false;


        this.togglePause(true);
         // 🛠 Cancel extra heart timer
    if (this.extraHeartTimer) {
        this.extraHeartTimer.remove(false);
    }

        const soundEnabled = this.registry.get('soundEnabled') ?? true;
        const soundVolume = this.registry.get('soundVolume');

        if (soundEnabled) {
            const gameOverSound = this.sound.get('game-over') || this.sound.add('game-over');

            gameOverSound.setVolume(soundVolume);
            gameOverSound.play();
        }

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

            // Existing high score from localStorage (or 0 if none)
            const currentHighScore = parseInt(localStorage.getItem('highScore') || '0');
            // Check if current game's score is higher than the saved high score
            if (this.score > currentHighScore) {
                localStorage.setItem('highScore', this.score.toString());
                console.log(`New High Score: ${this.score}`); // For debugging
            }

            await showLeaderboardUI(); 
            this.time.delayedCall(2000, () => {
    this.allowButtons = true;
});
            


        });
        
        // Common button function
        const createButton = (label, x, y, callback) => {
            const btnWidth = 120;
            const btnHeight = 45;
            const normalColor = 0x729C97;
            const hoverColor = 0x7AAFBA;

            const buttonBg = this.add.graphics();
            buttonBg.fillStyle(normalColor, 1);
            buttonBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);

            const buttonText = this.add.text(0, 0, label, {
                fontSize: '20px',
                fill: '#fff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                padding: { x: 6, y: 2 },
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
                if (!this.allowButtons) return;
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
            if (this.clickSound) this.clickSound.play();

            // 🔄 Reset all stats
            this.resetStats();

            // 🏁 Start fresh from Level 1
            this.scene.stop();
            this.scene.start('GameScene', {
                selectedCharacter: this.selectedCharacter,
                levelId: this.levelId,
                startTimer: true
            });
        });


        // Home Button
        createButton('HOME', width / 2 + 70, height * 0.55, () => {
            this.registry.remove('selectedCharacter');
            this.resetStats();
            this.scene.stop();
            this.scene.start('StartScene');
        });
    }

    levelCompleted() {
        this.levelEnded = true;
        this.togglePause(true);
         // 🛠️ CANCEL any leftover heart timer
    if (this.extraHeartTimer) {
        this.extraHeartTimer.remove(false);
    }
        
        // Stop player movement and animation
        this.runner.setVelocity(0);
        this.runner.anims.stop();

        if (this.levelCompleteSound && this.registry.get('soundEnabled')) {
            this.levelCompleteSound.setVolume(this.registry.get('soundVolume'));
            this.levelCompleteSound.play();
        }

        const currentMaxLevel = parseInt(localStorage.getItem('maxLevelReached') || '1');
        // Check if current level completed is higher than the saved max level
        if (this.levelId > currentMaxLevel) {
            localStorage.setItem('maxLevelReached', this.levelId.toString());
            console.log(`New Max Level Reached: ${this.levelId}`); // For debugging
        }

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
    const levelNum = this.levelId || 1;
    const levelCompleteText = this.add.text(
        width / 2,
        height * 0.2,
        `LEVEL ${levelNum} COMPLETED!`,    
        {
        fontSize: '48px',
        fill: '#7FFF00',
        fontFamily: 'Luckiest Guy',
        stroke: '#729C97',
        strokeThickness: 6,
        align: 'center'
        }
    )
    .setOrigin(0.5)
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
            value: Math.floor(this.calories),
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
    const nextLevelButton = this.add.text(width / 2, height * 0.8, 'Next LEVEL', {
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

    //store the player's stats in the registry
    this.registry.set('score', this.score);
    this.registry.set('calories', this.calories);
    this.registry.set('distance', this.distance);
    this.registry.set('lives', this.lives);


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

        const nextLevelId = (this.levelId || 1) + 1;

        this.scene.start('GameScene', {
            selectedCharacter: this.selectedCharacter,
            levelId: nextLevelId,
            startTimer: true
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

    resetStats(){
        this.registry.set('score', 0);
        this.registry.set('calories', 0);
        this.registry.set('distance', 0);
        this.registry.set('lives', 3);
    }

    showCharacterSwapOverlay() {
        const { width, height } = this.sys.game.config;

        this.customOverlayBackgroundImage = this.add.image(width / 2, height / 2, 'swap-bg')
        .setOrigin(0.5, 0.5) // Center the image
        .setDisplaySize(width, height) // Make it fill the screen
        .setScrollFactor(0)
        .setDepth(100);

        // The main full-screen overlay rectangle
        this.overlayRect = this.add.rectangle(0, 0, width, height, 0x000000, 0.1)
            .setOrigin(0, 0) // Top-left origin
            .setScrollFactor(0) // Fixed to camera
            .setDepth(100) // Ensure it's on top of game elements
            .setInteractive(); // Blocks input to game underneath

        // Overlay Title
        this.overlayTitle = this.add.text(width / 2, height * 0.1, 'CHANGE RUNNER', {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Luckiest Guy',
            stroke: '#729C97',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Character display
        this.swapDisplayChar = this.add.sprite(width / 2, height * 0.5, '') // Centered horizontally, middle-ish vertically
            .setScale(1)
            .setOrigin(0.5, 1) // Character stands on this Y line
            .setScrollFactor(0)
            .setDepth(101);

        // Character Label
        this.swapCharLabel = this.add.text(width / 2, height * 0.7, '', {
            fontSize: '32px',
            fill: '#FFF',
            fontFamily: 'Luckiest Guy'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Store the index of the currently playing character
        const currentPlayerConfig = PLAYER_CONFIGS.find(p => p.key === this.registry.get('selectedCharacter'));
        this.currentSwapIndex = PLAYER_CONFIGS.indexOf(currentPlayerConfig);

        // Arrows to cycle characters
        const arrowStyle = { fontSize: '72px', fill: '#729C97', fontFamily: 'Luckiest Guy' };
        this.swapLeftArrow = this.add.text(width * 0.25, height * 0.45, '<', arrowStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(101)
            .on('pointerdown', () => this.cycleSwapCharacter(-1));

        this.swapRightArrow = this.add.text(width * 0.75, height * 0.45, '>', arrowStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(101)
            .on('pointerdown', () => this.cycleSwapCharacter(1));

        const makeButton = (x, y, w, h, radius, color, hoverColor, text, textStyle, onClick) => {
            // 1) Draw the rounded rect
            const bg = this.add.graphics();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-w/2, -h/2, w, h, radius);

            // 2) Create the label
            const label = this.add.text(0, 0, text, textStyle).setOrigin(0.5);

            // 3) Put in a container
            const btn = this.add.container(x, y, [ bg, label ])
                .setSize(w, h)
                .setInteractive({ useHandCursor: true })
                .setScrollFactor(0)
                .setDepth(101);

            // 4) Hover effects
            btn.on('pointerover', () => {
                // scale up
                this.tweens.add({
                    targets: btn,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 150,
                    ease: 'Quad.easeOut'
                });
                // change bg color
                bg.clear()
                .fillStyle(hoverColor, 1)
                .fillRoundedRect(-w/2, -h/2, w, h, radius);
            });

            btn.on('pointerout', () => {
                // scale back
                this.tweens.add({
                    targets: btn,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 150,
                    ease: 'Quad.easeOut'
                });
                // restore bg color
                bg.clear()
                .fillStyle(color, 1)
                .fillRoundedRect(-w/2, -h/2, w, h, radius);
            });

            btn.on('pointerdown', onClick);

            return btn;
        };


    // Confirm Swap
    this.confirm = makeButton(
        width/2, height*0.8,
        240, 60,
        15,
        0x4CAF50,     // base color
        0x388E3C,     // hover color (darker green)
        'CONFIRM SWAP',
        {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Luckiest Guy'
        },
        () => this.confirmCharacterSwap()
    );

    // Cancel Swap
    this.cancel = makeButton(
        width/2, height*0.9,
        180, 50,
        12,
        0xFF5733,     // base color
        0xC63D1F,     // hover color (darker orange)
        'CANCEL',
        {
            fontSize: '20px',
            fill: '#fff',
            fontFamily: 'Luckiest Guy'
        },
        () => this.hideCharacterSwapOverlay()
    );


        // Call displaySwapCharacter to initially populate the character
        this.displaySwapCharacter(this.currentSwapIndex);

        // Pause the game using your comprehensive togglePause method
        this.togglePause(true);
    }

    cycleSwapCharacter(direction) {
        this.currentSwapIndex = (this.currentSwapIndex + direction + PLAYER_CONFIGS.length) % PLAYER_CONFIGS.length;
        this.displaySwapCharacter(this.currentSwapIndex);
    }

    displaySwapCharacter(index) {
        const cfg = PLAYER_CONFIGS[index];
        const { width, height } = this.sys.game.config;

        this.swapDisplayChar.setTexture(cfg.key);
        this.swapDisplayChar.setScale(cfg.scale || 1);
        this.swapCharLabel.setText(cfg.label);
        this.swapDisplayChar.y = height * 0.65;
        this.swapDisplayChar.x = width * (cfg.x + 0.28);

        // Dynamically create/play animation for the preview
        const animKey = `${cfg.key}_idle_swap`; // Unique key for swap overlay
        if (!this.anims.get(animKey)) {
            this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(cfg.key, {
                    start: 0,
                    end: cfg.frames - 1
                }),
                frameRate: 8, // Slower for preview
                repeat: -1
            });
        }
        this.swapDisplayChar.anims.play(animKey, true);

        // Handle locked status for the preview
        const playerHighScore = parseInt(localStorage.getItem('highScore') || '0');
        const playerMaxLevel = parseInt(localStorage.getItem('maxLevelReached') || '1');
        let isLocked = false;
        let unlockMessage = '';

        if (cfg.unlockedBy && Object.keys(cfg.unlockedBy).length > 0) {
            if (cfg.unlockedBy.type === 'score') {
                if (playerHighScore < cfg.unlockedBy.value) {
                    isLocked = true;
                    unlockMessage = `REACH ${cfg.unlockedBy.value} SCORE TO UNLOCK`;
                }
            } else if (cfg.unlockedBy.type === 'level') {
                if (playerMaxLevel < cfg.unlockedBy.value) {
                    isLocked = true;
                    unlockMessage = `COMPLETE LEVEL ${cfg.unlockedBy.value} TO UNLOCK`;
                }
            }
        }

        // Show lock icon and message on overlay if locked
        if (isLocked) {
            this.swapDisplayChar.setTint(0x555555); // Dim the character
            if (!this.swapPadlockIcon) { // Create if not exists
                // Position padlock relative to full screen 
                this.swapPadlockIcon = this.add.image(width / 2, height * 0.45, 'padlock') 
                    .setScale(0.1)
                    .setOrigin(0.5)
                    .setScrollFactor(0)
                    .setDepth(102); // Higher depth than overlayRect
            }
            this.swapPadlockIcon.setVisible(true);

            if (!this.swapUnlockText) { // Create if not exists
                // Position unlock text relative to full screen 
                this.swapUnlockText = this.add.text(width / 2, height * 0.7, '', { 
                    fontSize: '20px', fill: '#FFD700', fontFamily: 'Luckiest Guy', align: 'center', wordWrap: { width: width * 0.8 }
                }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
            }
            this.swapUnlockText.setText(unlockMessage).setVisible(true);
            this.confirm.setAlpha(0.5).disableInteractive(); // Disable confirm if locked
        } else {
            this.swapDisplayChar.clearTint();
            this.swapPadlockIcon?.setVisible(false); // Hide padlock if it exists
            this.swapUnlockText?.setVisible(false); // Hide unlock text if it exists
            this.confirm.setAlpha(1).setInteractive({ useHandCursor: true });
        }
    }

    confirmCharacterSwap() {
        const newCharConfig = PLAYER_CONFIGS[this.currentSwapIndex];

        // 1. Update the selected character in registry
        this.registry.set('selectedCharacter', newCharConfig.key);

        // 2. Stop current player animation
        this.runner.anims.stop();

        // 3. Update player sprite texture
        this.runner.setTexture(newCharConfig.key);

        // 4. Update player scale
        this.runner.setScale(newCharConfig.scale);

        // 5. Update player hitbox (critical for new character)
        const fw = newCharConfig.frameWidth;
        const fh = newCharConfig.frameHeight;
        const hbW = Math.round(fw * 0.75); // Using your existing hitbox logic
        const hbH = Math.round(fh * 0.75);
        const offX = Math.round((fw - hbW) / 2);
        const offY = Math.round(fh - hbH);
        this.runner.body.setSize(hbW, hbH);
        this.runner.body.setOffset(offX, offY);

        // 6. Create and play the new character's running animation
        const animKey = `${newCharConfig.key}_run`; // Use the unique key for GameScene animation
        if (!this.anims.get(animKey)) { // Only create if it doesn't exist
            this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(newCharConfig.key, {
                    start: 0,
                    end: newCharConfig.frames - 1
                }),
                frameRate: 10,
                repeat: -1
            });
        }
        this.runner.anims.play(animKey, true);

        // 7. Hide the overlay and resume game
        this.hideCharacterSwapOverlay();
    }

    hideCharacterSwapOverlay() {
        // Destroy all overlay elements
        this.customOverlayBackgroundImage.destroy();
        this.overlayRect.destroy();
        this.overlayTitle.destroy();
        this.swapDisplayChar.destroy();
        this.swapCharLabel.destroy();
        this.swapLeftArrow.destroy();
        this.swapRightArrow.destroy();
        this.confirm.destroy();
        this.cancel.destroy();
        this.swapPadlockIcon?.destroy(); // Destroy if it was created
        this.swapUnlockText?.destroy(); // Destroy if it was created

        // Resume game using your comprehensive togglePause method
        this.togglePause(false);
    }
}