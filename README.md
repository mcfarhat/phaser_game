# Phaser Game Project

This is a barebone foundation for a Phaser 3 game project, providing a minimal structure to get started.

## Project Structure
phaser-game/
├── index.html # Main HTML file
├── package.json # Node.js project configuration
├── README.md # This file
├── .gitignore # Files ignored by Git
└── src/
├── main.js # Game configuration and instantiation
└── scenes/
├── BootScene.js # Initial loading/bootstrapping scene
└── GameScene.js # Example main game scene

## Prerequisites

*   Node.js and npm installed (needed to run the local development server script).

## Setup and Running

1.  **Clone or Download:** Get the project files.
2.  **Open Terminal:** Navigate to the project's root directory (`phaser-barebone/`).
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
    This installs the `serve` package (for local serving) and Phaser (optional, but good practice).
4.  **Start Development Server:**
    ```bash
    npm start
    ```
    or
    ```bash
    npm run serve
    ```
    This will start a simple web server, typically accessible at `http://localhost:3000` or similar.
5.  **Open in Browser:** Open your web browser and go to the address provided by the `serve` command. You should see the Phaser game running with a basic message from the `GameScene`.

## Core Files Explained

*   **`index.html`**: The entry point. It contains the HTML structure, includes the Phaser library (via CDN by default), and loads `src/main.js` as an ES Module.
*   **`src/main.js`**: Configures and creates the Phaser `Game` instance. It defines the game's dimensions, rendering options, and lists the scenes to be used, starting with `BootScene`.
*   **`src/scenes/BootScene.js`**: The very first scene. Useful for initial setup, showing a loading screen background, or loading a minimal set of assets before transitioning to the main loading scene or game scene.
*   **`src/scenes/GameScene.js`**: An example of a main game scene. It includes the standard Phaser scene methods:
    *   `preload()`: Load assets (images, audio, etc.).
    *   `create()`: Set up the game world (create sprites, add text, set up input).
    *   `update(time, delta)`: Contains the game loop logic (movement, checks, etc.).

## Extending the Project

*   **Add More Scenes:** Create new `.js` files in `src/scenes/`, extend `Phaser.Scene`, and add them to the `scene` array in `src/main.js`. Use `this.scene.start('SceneKey')` to transition between scenes.
*   **Add Assets:** Create subdirectories in an `assets/` folder (e.g., `assets/images`, `assets/audio`) and load them in the `preload` method of your scenes using `this.load`.
*   **Add Game Logic:** Implement game mechanics in the `create` and `update` methods of your scenes.
*   **Build Tools:** For larger projects, consider integrating a build tool like Webpack or Parcel for asset bundling, code minification, and hot module replacement. This would involve installing Phaser via npm (`npm install phaser`) and `import`ing it in `main.js`, removing the CDN link from `index.html`.

## License

This project is licensed under the MIT License.