export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameSpeed = 4;
        this.score = 0;
        this.lives = 3;
        this.isInvincible = false;
        this.calories = 0;
        this.maxGameSpeed = 10;
        this.speedIncrement = 0.002;
        this.isGameOver = false; // ✅ New flag

        this.lastSpawnedItemX = -Infinity;
        this.lastSpawnedItemY = -Infinity;
        this.minDistanceBetweenItems = 150;
        this.minYDistanceBetweenItems = 120;
        this.itemSpawnHeightRange = [150, 300];
    }

    preload() {
        const fruitTypes = ['Avocado', 'Boiled Egg', 'Berries', 'Broccoli', 'Mango', 'Banana', 'Pineapple', 'Pomegranate', 'Proteinshake'];
        const junkTypes = ['Candy Bar', 'Soda', 'Fries', 'Burger', 'Hotdog', 'Donuts', 'Pizza'];

        this.load.image('background', 'assets/background.jpg');
        this.load.spritesheet('runner', 'assets/players/player1-sprite.png', {
            frameWidth: 204,
            frameHeight: 226
        });
        this.load.image('heart', 'assets/ui/heart.png');

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
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        this.background.setScale(scaleX, scaleY);

        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });

        this.caloriesText = this.add.text(16, 46, 'Calories: 0', {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });

        this.hearts = [];
        for (let i = 0; i < this.lives; i++) {
            const heart = this.add.image(40 + i * 60, 100, 'heart').setScale(0.12).setScrollFactor(0);
            this.hearts.push(heart);
        }

        this.powerUps = this.physics.add.group();
        this.hazards = this.physics.add.group();

        this.player = this.physics.add.sprite(150, 500, 'runner', 0);
        this.player.setOrigin(0.5, 1);
        this.player.setScale(1);
        this.player.setGravityY(1200);
        this.player.setCollideWorldBounds(true);
        this.jumps = 0;
        this.maxJumps = 2;

        this.player.body.setSize(80, 160);
        this.player.body.setOffset(60, 70);

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('runner', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.player.play('run');

        const ground = this.add.rectangle(0, 550, width, 20, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(ground, true);
        this.physics.add.collider(this.player, ground);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.physics.add.overlap(this.player, this.powerUps, this.collectItem, null, this);
        this.physics.add.overlap(this.player, this.hazards, this.hitHazard, null, this);

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
        if (this.isGameOver) return; // ✅ Stop game logic after game over

        if (this.gameSpeed < this.maxGameSpeed) {
            this.gameSpeed += this.speedIncrement;
        }

        this.background.tilePositionX += this.gameSpeed;

        const playerSpeed = 350;
        const jumpHeight = 600;
        const onGround = this.player.body.blocked.down;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-playerSpeed);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(playerSpeed);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        if (onGround) this.jumps = 0;

        if (Phaser.Input.Keyboard.JustDown(this.spacebar) && this.jumps < this.maxJumps) {
            this.player.setVelocityY(-jumpHeight);
            this.jumps++;
        }

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
        if (this.isGameOver) return; // ✅ Prevent spawning after game over
        const fruitTypes = ['Avocado', 'Boiled Egg', 'Berries', 'Broccoli', 'Mango', 'Banana', 'Pineapple', 'Pomegranate', 'Proteinshake'];
        const key = Phaser.Utils.Array.GetRandom(fruitTypes);
        const currentX = this.sys.game.config.width + 50;

        let y;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            y = Phaser.Math.Between(...this.itemSpawnHeightRange);
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
        if (this.isGameOver) return; // ✅ Prevent spawning after game over
        const junkTypes = ['Fries', 'Burger', 'Hotdog', 'Donuts', 'Pizza'];
        const key = Phaser.Utils.Array.GetRandom(junkTypes);
        const currentX = this.sys.game.config.width + 100;

        let y;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            y = Phaser.Math.Between(...this.itemSpawnHeightRange);
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

    collectItem(player, item) {
        if (this.isGameOver) return;
        item.destroy();
        this.score += 10;
        this.calories += 5;
        this.scoreText.setText('Score: ' + this.score);
        this.caloriesText.setText('Calories: ' + this.calories);
    }

    hitHazard(player, hazard) {
        if (this.isInvincible || this.isGameOver) return;

        this.cameras.main.shake(200, 0.01);
        hazard.destroy();
        this.lives -= 1;

        if (this.lives >= 0 && this.hearts[this.lives]) {
            const heart = this.hearts[this.lives];
            this.tweens.add({
                targets: heart,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 300,
                yoyo: false,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    heart.setVisible(false);
                    heart.setScale(0.12);
                    heart.setAlpha(1);
                }
            });
        }

        this.isInvincible = true;
        this.time.delayedCall(1500, () => this.isInvincible = false);

        this.tweens.add({
            targets: this.player,
            alpha: 0.5,
            yoyo: true,
            repeat: 5,
            duration: 100,
            onComplete: () => this.player.setAlpha(1)
        });

        if (this.lives <= 0) {
            this.isGameOver = true; // ✅ Lock state
            this.gameSpeed = 0;

            this.player.anims.stop();
            this.player.setTint(0xff0000);
            this.player.body.setAllowGravity(true);
            this.player.setVelocityX(0);
            this.player.setVelocityY(-300);

            this.tweens.add({
                targets: this.player,
                angle: 90,
                duration: 400,
                ease: 'Cubic.easeOut',
            });

            this.time.addEvent({
                delay: 800,
                callback: () => {
                    this.player.setVelocity(0);
                    this.player.body.moves = false;
                }
            });

            this.time.delayedCall(1200, () => {
                this.add.text(
                    this.sys.game.config.width / 2,
                    this.sys.game.config.height / 2,
                    'GAME OVER',
                    {
                        fontSize: '48px',
                        fill: '#fff',
                        stroke: '#000',
                        strokeThickness: 6
                    }
                ).setOrigin(0.5);
            });
        }
    }
}
