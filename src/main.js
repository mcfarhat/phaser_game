// Import necessary scenes
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';

// Game configuration
const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    width: 800,        // Game width
    height: 600,       // Game height
    parent: 'game-container', // ID of the DOM element to add the game canvas to
    scene: [           // Array of scenes to load. The first scene in the array is started first.
        BootScene,
        GameScene
    ],
    physics: {
        default: 'arcade', // Use Arcade Physics
        arcade: {
            gravity: { y: 300 }, // Example gravity
            debug: false         // Set to true to see physics bodies
        }
    },
    // Add other configurations here (scale, pixelArt, etc.)
    scale: {
        mode: Phaser.Scale.FIT, // Fit the game to the screen while maintaining aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH // Center the game horizontally and vertically
    }
};

// Create the game instance
const game = new Phaser.Game(config);