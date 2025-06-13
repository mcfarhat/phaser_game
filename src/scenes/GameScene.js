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

         this.player = null; // To hold the player sprite
    
    }

    preload() {
        const fruitTypes = ['Avocado','Boiled Egg','Berries','Broccoli','Mango', 'Banana', 'Pineapple', 'Pomegranate', 'Proteinshake'];
        const junkTypes = ['Candy Bar','Soda','Fries','Burger', 'Hotdog', 'Donuts','Pizza'];

        this.load.image('background', 'assets/background.jpg');
        this.load.image('runner', 'assets/runner.png');

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

    // Score
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '24px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4
    });

    // --- NEW PLAYER SETUP (CORRECTED) ---
    // Now 'height' is correctly defined and available here
    this.player = this.physics.add.sprite(100, 300, 'runner');
    this.player.setScale(0.2); // Adjust this size if needed
    this.player.setCollideWorldBounds(true);
    // --- END NEW BLOCK ---

    // Groups for fruits and junks
    this.powerUps = this.physics.add.group();
    this.hazards = this.physics.add.group();

    // Spawn loops
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