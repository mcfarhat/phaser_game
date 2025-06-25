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
        this.selectedCharacter = 'runner4'; // you can change this
    }

    preload() {
        const fruitTypes = ['Avocado','Boiled Egg','Berries','Broccoli','Mango', 'Banana', 'Pineapple', 'Pomegranate', 'Proteinshake'];
        const junkTypes = ['Candy Bar','Soda','Fries','Burger', 'Hotdog', 'Donuts','Pizza'];

        this.load.image('background', 'assets/background.jpg');

        fruitTypes.forEach(healthy => {
            this.load.image(healthy, `assets/healthies/${healthy}.png`);
        });

        junkTypes.forEach(junk => {
            this.load.image(junk, `assets/junks/${junk}.png`);
        });

        // ✅ Preload all runners using the config array
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

        const bg = this.textures.get('background')?.getSourceImage();
        if (bg) {
            this.background.setTileScale(width / bg.width, height / bg.height);
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

        // ✅ Character
        this.runner = this.physics.add.sprite(width * config.x, height - config.y, config.key);
        this.runner.setScale(config.scale);
        this.runner.setOrigin(0.5, 1);
        this.runner.body.allowGravity = false;
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
}
