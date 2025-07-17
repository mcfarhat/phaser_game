//StartScene.js
export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    init(data) {
    // store it so you can use it in create() or pass onwards
    this.selectedCharacter = data.selectedCharacter;
    }

    preload() {}

    create() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        WebFont.load({
            google: { families: ['Luckiest Guy'] },
            active: () => this.createTitleText()
        });

        this.add.image(0, 0, 'start-bg')
            .setOrigin(0, 0)
            .setDisplaySize(width, height);

        if (!this.registry.has('musicVolume')) this.registry.set('musicVolume', 0);
        if (!this.registry.has('soundVolume')) this.registry.set('soundVolume', 0.5);
        if (!this.registry.has('musicEnabled')) this.registry.set('musicEnabled', true);
        if (!this.registry.has('soundEnabled')) this.registry.set('soundEnabled', true);

        this.bgMusic = this.sound.get('start-sound') || this.sound.add('start-sound', { loop: true });
        if (this.registry.get('musicEnabled')) {
            if (!this.bgMusic.isPlaying) {
                this.bgMusic.play({ volume: this.registry.get('musicVolume') });
            }
        }

        this.clickSound = this.sound.get('click-sound') || this.sound.add('click-sound', {
            volume: this.registry.get('soundVolume') ?? 0.5
        });

        const playClickSound = () => {
            if (this.registry.get('soundEnabled') && this.clickSound) {
                this.clickSound.setVolume(this.registry.get('soundVolume'));
                this.clickSound.play();
            }
        };

        // SETTINGS BUTTON
        const settingsBtn = this.add.text(width - 10, 5, '⚙', {
            fontSize: '27px',
            color: '#FFF',
            fontStyle: 'bold',
            fontFamily: 'Luckiest Guy',
            stroke: '#729C97',
            strokeThickness: 1.5,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 8,
                stroke: true,
                fill: true
            }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        settingsBtn.setResolution(3);

        settingsBtn.on('pointerdown', () => {
            playClickSound();
            document.querySelector('.overlay').style.display = 'block';
            document.querySelector('.panel').style.display = 'flex';

            document.getElementById('musicSlider').value = this.registry.get('musicVolume') * 100;
            document.getElementById('soundSlider').value = this.registry.get('soundVolume') * 100;
        });

        // Sliders feedback sound
        const musicSlider = document.getElementById('musicSlider');
        const soundSlider = document.getElementById('soundSlider');
        if (musicSlider) musicSlider.addEventListener('input', playClickSound);
        if (soundSlider) soundSlider.addEventListener('input', playClickSound);

        // OK Button from settings panel
        const okButton = document.querySelector('.panel .button');
        okButton.onclick = () => {
            playClickSound();

            const newMusicVolume = parseInt(musicSlider.value) / 100;
            const newSoundVolume = parseInt(soundSlider.value) / 100;

            this.registry.set('musicVolume', newMusicVolume);
            this.registry.set('soundVolume', newSoundVolume);
            localStorage.setItem('musicVolume', newMusicVolume);
            localStorage.setItem('soundVolume', newSoundVolume);

            const musicEnabled = newMusicVolume > 0;
            const soundEnabled = newSoundVolume > 0;

            this.registry.set('musicEnabled', musicEnabled);
            this.registry.set('soundEnabled', soundEnabled);
            localStorage.setItem('musicEnabled', musicEnabled.toString());
            localStorage.setItem('soundEnabled', soundEnabled.toString());

            if (musicEnabled) {
                if (!this.bgMusic.isPlaying) {
                    this.bgMusic.play({ loop: true, volume: newMusicVolume });
                } else {
                    this.bgMusic.setVolume(newMusicVolume);
                }
            } else if (this.bgMusic.isPlaying) {
                this.bgMusic.stop();
            }

            if (this.clickSound) this.clickSound.setVolume(newSoundVolume);

            document.querySelector('.panel').style.display = 'none';
            document.querySelector('.overlay').style.display = 'none';
        };

        // START BUTTON
        const btnWidth = 93;
        const btnHeight = 45;
        const btnX = width / 2;
        const btnY = height / 2 + 124;

        const buttonBg = this.add.graphics();
        const normalColor = 0x729C97;
        const hoverColor = 0x7AAFBA;

        buttonBg.fillStyle(normalColor, 1);
        buttonBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);

        //START
        const startText = this.add.text(0, 0, 'START', {
            fontSize: '21px',
            fill: '#fff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 8,
                stroke: true,
                fill: true
            },
        }).setOrigin(0.5);
        startText.setResolution(3);

        const startButton = this.add.container(btnX, btnY, [buttonBg, startText]);
        startButton.setSize(btnWidth, btnHeight);
        startButton.setInteractive();

        startButton.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(hoverColor, 1);
            buttonBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
            this.input.setDefaultCursor('pointer');
        });

        startButton.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(normalColor, 1);
            buttonBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
            this.input.setDefaultCursor('default');
        });

        startButton.on('pointerdown', () => {
            playClickSound();
            this.scene.start('CharacterSelectScene');
        });

        this.tweens.add({
            targets: startButton,
            scaleX: 1.08,
            scaleY: 1.08,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 600
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('CharacterSelectScene');
        });
    }

    createTitleText() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        const title = this.add.text(width / 2, height * 0.21, 'Healthy Hustle', {
            fontFamily: 'Luckiest Guy',
            fontSize: '55px',
            color: '#E0F7FA',
            stroke: '#729C97',
            strokeThickness: 8,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 8,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
        title.setResolution(3);
    }
}