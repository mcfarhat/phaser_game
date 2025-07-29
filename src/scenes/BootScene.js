import { PLAYER_CONFIGS } from '../config.js';

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

        const obstacleTypes = ['dumbell', 'gym-bench', 'gym-plates', 'jump-rope', 'kettlebell', 'rock', 'tire-stack'];

        this.load.image('background', 'assets/background.jpg');

        fruitTypes.forEach(healthy => {
            this.load.image(healthy, `assets/collectibles/${healthy}.png`);
        });

        junkTypes.forEach(junk => {
            this.load.image(junk, `assets/junks/${junk}.png`);
        });

        obstacleTypes.forEach(obstacle => {
            this.load.image(obstacle, `assets/obstacles/${obstacle}.png`);
        });

        this.load.image('start-bg', 'assets/start-background.jpg');
        this.load.image('char-bg', 'assets/backgrounds/character-selection-bg3.png');
        this.load.image('swap-bg', 'assets/backgrounds/swap-bg.png');
        this.load.audio('start-sound', 'assets/sounds/music.mp3');
        this.load.audio('click-sound', 'assets/sounds/click.mp3');

        PLAYER_CONFIGS.forEach(config => {
            this.load.spritesheet(config.key, config.sprite, {
                frameWidth: config.frameWidth,
                frameHeight: config.frameHeight,
                margin: 0,
                spacing: 0
            });
        });

        this.load.image('heart', 'assets/icons/heart.svg');
        this.load.image('medal', 'assest/icons/medals.svg');
        this.load.image('trophy-icon', 'assets/icons/trophy.svg');
        this.load.image('settings-icon', 'assets/icons/settings.svg');
        this.load.image('pause-icon', 'assets/icons/pause.svg');
        this.load.image('swap-icon', 'assets/icons/swap.png');
        this.load.image('padlock', 'assets/icons/padlock.png');
        this.load.audio('game-over', 'assets/sounds/game-over.mp3');
        this.load.audio('hit-sound', 'assets/sounds/hit.mp3');
        this.load.audio('level-complete', 'assets/sounds/level-complete.mp3');
        this.load.audio('collect-item', 'assets/sounds/collect.mp3');
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

        this.bgMusic = this.sound.get('start-sound') || this.sound.add('start-sound', { loop: true, volume: musicVolume });

        if (musicEnabled && !this.bgMusic.isPlaying) {
            this.bgMusic.play();
        }

        this.clickSound = this.sound.get('click-sound') || this.sound.add('click-sound', {
            volume: soundVolume
        });

        this.scene.start('StartScene');
    }
}