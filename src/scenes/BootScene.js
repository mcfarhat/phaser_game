// BootScene.js
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' }); // Assign a unique key to the scene
    }

    preload() {
        console.log('BootScene: preload()');

        // Loading screen visuals
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
            progressBar.fillStyle(0x729C97, 1);
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

        const fruitTypes = [
            'granola-bar','Avocado','Boiled Egg','Berries','Broccoli',
            'Pomegranate', 'Banana', 'energy-drink', 'Mango',
            'Proteinshake', 'Salad Bowl'
        ];
        const junkTypes = [
            'Candy Bar','Soda','Fries','Burger', 
            'Hotdog', 'Donuts','Pizza'
        ];

        this.load.image('background', 'assets/background.jpg');

        fruitTypes.forEach(healthy => {
            this.load.image(healthy, `assets/collectibles/${healthy}.png`);
        });

        junkTypes.forEach(junk => {
            this.load.image(junk, `assets/obstacles/${junk}.png`);
        });

        this.load.image('start-bg', 'assets/start-background.jpg');
        this.load.audio('start-sound', 'assets/sounds/music.mp3');
        this.load.audio('click-sound', 'assets/sounds/click.mp3');
    }

    create() {
        console.log('BootScene: create()');

        // Music
        if (!this.sound.get('bgMusic')) {
            this.bgMusic = this.sound.add('start-sound', { loop: true, volume: 1 });
            this.registry.set('musicEnabled', false);
        } else {
            this.bgMusic = this.sound.get('bgMusic');
        }

        if (this.registry.get('musicEnabled')) {
            if (!this.bgMusic.isPlaying) this.bgMusic.play();
        }
        
        if (!this.registry.has('soundVolume')) {
            this.registry.set('soundVolume', 0.5); // ✅ Default to half volume
        }
        
        this.clickSound = this.sound.get('click-sound') || this.sound.add('click-sound', {
            volume: this.registry.get('soundVolume') ?? 0.5
        });               

        this.scene.start('StartScene');
    }

    update(time, delta) {
        // Nothing needed here for BootScene
    }
}