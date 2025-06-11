export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('runner', 'assets/runner.png');
  }

  create() {
    this.player = this.add.sprite(100, 400, 'runner');
    this.player.setScale(0.2); // Adjust size if needed
  }

  update() {
    // Empty for now — used later for jump/run/etc.
  }
}
