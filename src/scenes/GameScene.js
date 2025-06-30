import { PLAYER_CONFIGS } from '../config.js';

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
        this.selectedCharacter = 'runner9'; 
    }

    preload() {
        const fruitTypes = ['Avocado','Boiled Egg','Berries','Broccoli','Mango', 'Banana', 'Pineapple', 'Pomegranate', 'Proteinshake'];
        const junkTypes = ['Candy Bar','Soda','Fries','Burger', 'Hotdog', 'Donuts','Pizza'];
        const obstacleTypes = ['dumbell', 'gym-bench', 'gym-plates', 'jump-rope', 'kettlebell', 'rock', 'tire-stack'];

        this.load.image('background', 'assets/background.jpg');

        fruitTypes.forEach(healthy => {
            this.load.image(healthy, `assets/healthies/${healthy}.png`);
        });

        junkTypes.forEach(junk => {
            this.load.image(junk, `assets/junks/${junk}.png`);
        });

        obstacleTypes.forEach(obstacle => {
            this.load.image(obstacle, `assets/obstacles/${obstacle}.png`);
        });

        PLAYER_CONFIGS.forEach(config => {
            this.load.spritesheet(config.key, config.sprite, {
                frameWidth: config.frameWidth,
                frameHeight: config.frameHeight,
                margin: 0,
                spacing: 0
            });
        });
    }

    create() {
        const { width, height } = this.sys.game.config;
        const config = PLAYER_CONFIGS.find(p => p.key === this.selectedCharacter);

        // ✅ Background
        this.background = this.add.tileSprite(0, 0, width, height, 'background')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-1);

        const bgImage = this.textures.get('background')?.getSourceImage();
        if (bgImage) {
            const scaleX = width / bgImage.width;
            const scaleY = height / bgImage.height;
            this.background.setTileScale(scaleX, scaleY);
        }

        // ✅ Score
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });

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

        // ✅ Spawn items
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

        this.time.addEvent({
            delay: Phaser.Math.Between(2500, 5000),
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

    }

    update() {
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

        this.hazards.getChildren().forEach(hazard => {
            if (hazard.x < -hazard.width) hazard.destroy();
        });
    }

    isTooClose(newX, newY) {
        const dx = Math.abs(newX - this.lastSpawnedItemX);
        const dy = Math.abs(newY - this.lastSpawnedItemY);
        return dx < this.minDistanceBetweenItems && dy < this.minYDistanceBetweenItems;
    }

    spawnPowerUp() {
        const fruitTypes = ['Avocado','Boiled Egg','Berries','Broccoli','Mango', 'Banana', 'Pineapple', 'Pomegranate', 'Proteinshake'];
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
        const junkTypes = ['Fries','Burger', 'Hotdog', 'Donuts', 'Pizza'];
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

    spawnObstacle() {
        const obstacleTypes = ['dumbell', 'gym-bench', 'gym-plates', 'jump-rope', 'kettlebell', 'rock', 'tire-stack'];
        const key = Phaser.Utils.Array.GetRandom(obstacleTypes);
        const currentX = this.sys.game.config.width + 50;
        const y = 480; // Make sure this matches your ground Y

        const obstacle = this.obstacles.create(currentX, y, key);
        obstacle.setVelocityX(-this.gameSpeed * 50);
        obstacle.setDisplaySize(110, 110); // You can adjust this per asset
        obstacle.setOrigin(0.5, 1);
        obstacle.body.allowGravity = false;
        obstacle.setImmovable(true);
        obstacle.setDepth(5);
    }
}