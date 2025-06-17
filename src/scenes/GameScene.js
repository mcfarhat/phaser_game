// GameScene.js
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameSpeed = 4;
        this.score = 0;
        this.lastSpawnedItemX = -Infinity;
        this.lastSpawnedItemY = -Infinity;
        this.minDistanceBetweenItems = 150;
        this.minYDistanceBetweenItems = 120;
        this.itemSpawnHeightRange = [150, 300];

        this.player = null;
    }

    preload() {
        const fruitTypes = ['Avocado', 'Boiled Egg', 'Berries', 'Broccoli', 'Mango', 'Banana', 'Pineapple', 'Pomegranate', 'Proteinshake'];
        const junkTypes = ['Candy Bar', 'Soda', 'Fries', 'Burger', 'Hotdog', 'Donuts', 'Pizza'];

        this.load.image('background', 'assets/background.jpg');
        
        // --- CHANGE 1 of 4: LOAD SPRITESHEET ---
        // We load 'runner.png' as a spritesheet with frames that are 256x1024 pixels.
       this.load.spritesheet('runner', 'assets/runner_run.png', { frameWidth: 269, frameHeight: 1024 });

        // --- SYNTAX FIX ---
        // Your original code was missing the backticks (`) for the template literals. I've fixed that here.
        fruitTypes.forEach(healthy => {
            this.load.image(healthy, `assets/healthies/${healthy}.png`);
        });

        junkTypes.forEach(junk => {
            this.load.image(junk, `assets/junks/${junk}.png`);
        });
    }

    create() {
        const { width, height } = this.sys.game.config;

        this.background = this.add.tileSprite(0, 0, 0, 0, 'background')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-1);

        const bg = this.textures.get('background').getSourceImage();
        const scaleX = this.sys.game.config.width / bg.width;
        const scaleY = this.sys.game.config.height / bg.height;
        this.background.setScale(scaleX, scaleY);

        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });

        // --- CHANGE 2 of 4: COMPLETE PLAYER SETUP ---
        // This entire block replaces your old player setup.

        // We start the player at a specific coordinate. Adjust the Y-value (550) if he's too high or low.
        this.player = this.physics.add.sprite(150, 550, 'runner');

        // This fixes the "cut-off" problem by using the player's feet as the anchor point.
        this.player.setOrigin(0.5, 1);

        // This makes the player the correct size. Try 0.2 first. Change if he is too big/small.
        this.player.setScale(0.35);

        // This keeps the player from walking off-screen.
        this.player.setCollideWorldBounds(true);

        // This shrinks the invisible physics box to tightly wrap the character.
        this.player.body.setSize(80, 160);
        this.player.body.setOffset(95, 840);

        // --- CHANGE 3 of 4: ANIMATION & INPUT ---
        // This defines the 'run' animation using all 6 frames of your sheet.
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('runner', { start: 0, end: 5 }),
            frameRate: 12,
            repeat: -1
        });

        // This starts the player's running animation and keeps it looping.
        this.player.anims.play('run', true);

        // This creates an object to listen for the arrow keys.
        this.cursors = this.input.keyboard.createCursorKeys();

        // --- (Your existing code for item spawning continues below) ---
        this.powerUps = this.physics.add.group();
        this.hazards = this.physics.add.group();

        this.time.addEvent({
            delay: Phaser.Math.Between(2500, 4500),
            callback: this.spawnPowerUp,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000),
            callback: this.spawnHazard,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        this.background.tilePositionX += this.gameSpeed;
        
        // --- CHANGE 4 of 4: PLAYER MOVEMENT LOGIC ---
        // This block makes the character move when you press the arrow keys.
        const playerSpeed = 350;

        // Reset player's velocity each frame.
        this.player.setVelocity(0);

        // Check for key presses and apply velocity.
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-playerSpeed);
            this.player.setFlipX(true); // Flip sprite to face left
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(playerSpeed);
            this.player.setFlipX(false); // Make sprite face right
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-playerSpeed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(playerSpeed);
        }

        // --- (Your existing code for item cleanup continues below) ---
        this.powerUps.getChildren().forEach(item => {
            if (item.x < -item.width) item.destroy();
        });

        this.hazards.getChildren().forEach(hazard => {
            if (hazard.x < -hazard.width) hazard.destroy();
        });
    }

    isTooClose(newX, newY) {
        const dx = Math.abs(newX - this.lastSpawnedItemX);
        const dy = Math.abs(newY - this.lastSpawnedItemY);
        if (dx < this.minDistanceBetweenItems && dy < this.minYDistanceBetweenItems) {
            return true;
        }
        return false;
    }

    spawnPowerUp() {
        const fruitTypes = ['Avocado', 'Boiled Egg', 'Berries', 'Broccoli', 'Mango', 'Banana', 'Pineapple', 'Pomegranate', 'Proteinshake'];
        const key = Phaser.Utils.Array.GetRandom(fruitTypes);
        const currentX = this.sys.game.config.width + 50;
        let y;
        let attempts = 0;
        const maxAttempts = 10;
        do {
            y = Phaser.Math.Between(this.itemSpawnHeightRange[0], this.itemSpawnHeightRange[1]);
            attempts++;
        } while (this.isTooClose(currentX, y) && attempts < maxAttempts);
        const item = this.powerUps.create(currentX, y, key);
        item.setVelocityX(-this.gameSpeed * 50);
        item.setDisplaySize(80, 80);
        item.body.allowGravity = false;
        item.setImmovable(true);
        item.setDepth(0);
        this.lastSpawnedItemX = currentX;
        this.lastSpawnedItemY = y;
    }

    spawnHazard() {
        const junkTypes = ['Fries', 'Burger', 'Hotdog', 'Donuts', 'Pizza'];
        const key = Phaser.Utils.Array.GetRandom(junkTypes);
        const currentX = this.sys.game.config.width + 100;
        let y;
        let attempts = 0;
        const maxAttempts = 10;
        do {
            y = Phaser.Math.Between(this.itemSpawnHeightRange[0], this.itemSpawnHeightRange[1]);
            attempts++;
        } while (this.isTooClose(currentX, y) && attempts < maxAttempts);
        const hazard = this.hazards.create(currentX, y, key);
        hazard.setVelocityX(-this.gameSpeed * 50);
        hazard.setDisplaySize(80, 80);
        hazard.body.allowGravity = false;
        hazard.setImmovable(true);
        hazard.setDepth(0);
        this.lastSpawnedItemX = currentX;
        this.lastSpawnedItemY = y;
    }
}