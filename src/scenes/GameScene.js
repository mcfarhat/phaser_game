// GameScene.js
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameSpeed = 4;
        this.score = 0;
    }

    // Load assets for this scene
    preload() {
        const fruitTypes = ['Mango', 'Banana', 'Cherries', 'Pineapple', 'Pomegranate'];
        const junkTypes = ['Fries','Burger', 'Hotdog', 'Donuts', 'Icecream','Pizza'];

        this.load.image('background', 'assets/background.png');

        fruitTypes.forEach(fruit => {
            this.load.image(fruit, `assets/fruits/${fruit}.png`);
        });

        junkTypes.forEach(junk => {
            this.load.image(junk, `assets/junks/${junk}.png`);
        });
    }

    create() {
        console.log('GameScene: create()');

        // Moving background
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

        // Groups for fruits and junks
        this.powerUps = this.physics.add.group();
        this.hazards = this.physics.add.group();

        // Spawn loops
        this.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000),
            callback: this.spawnPowerUp,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: Phaser.Math.Between(1500, 3500),
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

    spawnPowerUp() {
        const fruitTypes = ['Mango', 'Banana', 'Cherries', 'Pineapple', 'Pomegranate'];
        const key = Phaser.Utils.Array.GetRandom(fruitTypes);
        const y = Phaser.Math.Between(200, 400);
    
        const item = this.powerUps.create(this.sys.game.config.width + 50, y, key);
        item.setVelocityX(-this.gameSpeed * 50);
        item.setDisplaySize(80, 80);
        item.body.allowGravity = false;
    }
    
    spawnHazard() {
        const junkTypes = ['Fries','Burger', 'Hotdog', 'Donuts', 'Icecream', 'Pizza'];
        const key = Phaser.Utils.Array.GetRandom(junkTypes);
        const y = Phaser.Math.Between(200, 400);
    
        const hazard = this.hazards.create(this.sys.game.config.width + 100, y, key);
        hazard.setVelocityX(-this.gameSpeed * 50);
        hazard.setDisplaySize(80, 80);
        hazard.body.allowGravity = false;
    }
}