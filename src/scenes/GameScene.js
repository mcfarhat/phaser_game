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

        this.load.json('characterConfigs', 'assets/charConfig.json');
    }

    create() {
        const { width, height } = this.sys.game.config;

        // Moving background
        this.background = this.add.tileSprite(0, 0, width, height, 'background')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-1);

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

        // Groups for fruits and junks
        this.powerUps = this.physics.add.group();
        this.hazards = this.physics.add.group();

        // Get JSON config
        const configs = this.cache.json.get('characterConfigs');
        const selectedCharacter = 'runner7';
        const config = configs[selectedCharacter];

        this.load.spritesheet(selectedCharacter, config.sprite, {
            frameWidth: config.frameWidth,
            frameHeight: config.frameHeight,
            margin: 0,
            spacing: 0
        });


        this.load.once('complete', () => {
            // Create runner sprite
            this.runner = this.physics.add.sprite(width * config.x, height - config.y, selectedCharacter);
            this.runner.setScale(config.scale);
            this.runner.setOrigin(0.5, 1);
            this.runner.body.allowGravity = false;
            this.runner.setDepth(10);

            // Create the run animation
            this.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNumbers(selectedCharacter, {
                    start: 0,
                    end: config.frames - 1
                }),
                frameRate: 10,
                repeat: -1
            });

            // Play the run animation
            this.runner.anims.play('run', true);

            // Set up spawn events
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
        });

        // Trigger loading of the sprite sheet
        this.load.start();
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
        const itemSize = 80;
        if (dx < this.minDistanceBetweenItems) {
            if (dy < this.minYDistanceBetweenItems) {
                return true;
            }
        }
        return false;
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