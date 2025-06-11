// GameScene.js
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' }); // Assign a unique key
    }

    // Load assets for this scene
    preload() {
        console.log('GameScene: preload()');
        // Example: Load an image asset
        // Make sure you have an 'assets' folder with 'logo.png' inside
        // For this barebone, we'll skip actual asset loading for max simplicity,
        // or uncomment the line below if you add an assets folder.
        // this.load.image('phaser_logo', 'assets/images/phaser3-logo.png');
    }

    // Create game objects and set up the scene
    create() {
        console.log('GameScene: create()');

        // Add some text to the center of the screen
        const gameText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Phaser Barebone Running!', {
            fontSize: '48px',
            color: '#00ff00' // Green color
        }).setOrigin(0.5); // Center the text origin

        // Add the loaded image (if you uncommented the preload line and added the asset)
        // const logo = this.add.image(this.sys.game.config.width / 2, this.sys.game.config.height / 2 - 100, 'phaser_logo');
        // logo.setOrigin(0.5); // Center the logo origin

        // Add some basic interactive element (example: rotate on pointer down)
        gameText.setInteractive();
        gameText.on('pointerdown', () => {
            gameText.setStyle({ color: '#ff00ff' }); // Change color on click
        });

        console.log('GameScene: create() complete');
    }

    // Game loop - runs every frame
    update(time, delta) {
        // console.log('GameScene: update()', time, delta); // Uncomment for debugging

        // Example update logic (e.g., move a character, check collisions)
        // If you had the logo, you could rotate it:
        // if (this.logo) {
        //    this.logo.rotation += 0.01;
        // }
    }
}