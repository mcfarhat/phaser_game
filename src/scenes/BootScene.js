// BootScene.js
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' }); // Assign a unique key to the scene
    }

    // Preload assets needed for the *initial* loading screen itself
    preload() {
        console.log('BootScene: preload()');
        // Example: Load a progress bar background or logo here
        // this.load.image('loading_bg', 'assets/images/loading_bg.png');

        // In this barebone example, we have no boot-specific assets,
        // so we just console log and move on.
        const progressBox = this.add.graphics();
        const progressBar = this.add.graphics();

        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        const loadingText = this.add.text(400, 240, 'Loading...', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x39ff14, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        for (let i = 0; i < 10; i++) {
            this.load.image(`dummy${i}`, 'assets/dummy.png');
        }
    }

    // Create game objects or setup scene
    create() {
        console.log('BootScene: create()');

        // Add some text (optional)
        const bootText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Booting...', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);


        // Transition to the next scene (e.g., a PreloadScene or the main GameScene)
        // In a real game, you might transition to a PreloadScene here
        // that loads all game assets and then transitions to GameScene.
        // For this barebone example, we go directly to GameScene.
        this.scene.start('GameScene');
    }

    // Game loop logic (optional for BootScene)
    update(time, delta) {
        // Nothing typically needed here for a simple boot scene
    }
}