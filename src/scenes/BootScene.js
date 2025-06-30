// BootScene.js
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
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

        // this.load.spritesheet('runner1', 'assets/players/player1-sprite.png', {
        //     frameWidth: 204,
        //     frameHeight: 226,
        //     margin: 0,
        //     spacing: 0
        // });

        // this.load.spritesheet('runner2', 'assets/players/player2-sprite.png', {
        //     frameWidth: 65,
        //     frameHeight: 55,
        //     margin: 0,
        //     spacing: 0
        // });

        // this.load.spritesheet('runner3', 'assets/players/player3-sprite.png', {
        //     frameWidth: 680,
        //     frameHeight: 472,
        //     margin: 0,
        //     spacing: 0
        // });

        this.load.spritesheet('runner4', 'assets/players/player4-sprite.png', {
            frameWidth: 165,
            frameHeight: 200,
            margin: 0,
            spacing: 0
        });

        this.load.image('heart', 'assets/heart.svg');

        this.load.spritesheet('runner', 'assets/runner_run.png', { frameWidth: 269, frameHeight: 1024 });

    }

    create() {
        console.log('BootScene: create()');

        // localStorage
        const musicEnabled = localStorage.getItem('musicEnabled') === 'false' ? false : true;
        const soundEnabled = localStorage.getItem('soundEnabled') === 'false' ? false : true;
        const musicVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0');
        const soundVolume = parseFloat(localStorage.getItem('soundVolume') ?? '0.5');

        this.registry.set('musicEnabled', musicEnabled);
        this.registry.set('soundEnabled', soundEnabled);
        this.registry.set('musicVolume', musicVolume);
        this.registry.set('soundVolume', soundVolume);

        this.bgMusic = this.sound.get('bgMusic') || this.sound.add('start-sound', { loop: true, volume: musicVolume });

        if (musicEnabled && !this.bgMusic.isPlaying) {
            this.bgMusic.play();
        }

        this.clickSound = this.sound.get('click-sound') || this.sound.add('click-sound', {
            volume: soundVolume
        });

        this.scene.start('StartScene');
    }
}