//StartScene.js
export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {}

    create() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        WebFont.load({
            google: { families: ['Luckiest Guy'] },
            active: () => this.createTitleText()
        });

        // Background
        this.add.image(0, 0, 'start-bg')
            .setOrigin(0, 0)
            .setDisplaySize(width, height);

        // Background Music
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

        // SETTINGS button
        const settingsBtn = this.add.text(width - 30, 20, '⚙', {
            fontSize: '27px',
            color: '#FFF',
            fontStyle: 'bold'
        }).setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });

        settingsBtn.on('pointerdown', () => {
            this.clickSound?.play();
            document.querySelector('.overlay').style.display = 'block';
            document.querySelector('.panel').style.display = 'flex';

            document.getElementById('musicSlider').value = this.registry.get('musicVolume') * 100;
            document.getElementById('soundSlider').value = this.registry.get('soundVolume') * 100;
        });


        // OK Button
        const okButton = document.querySelector('.panel .button');
        okButton.onclick = () => {
            this.clickSound?.play();

            const newMusicVolume = parseInt(document.getElementById('musicSlider').value) / 100;
            const newSoundVolume = parseInt(document.getElementById('soundSlider').value) / 100;

            this.registry.set('musicVolume', newMusicVolume);
            this.registry.set('soundVolume', newSoundVolume);

            if (this.bgMusic) {
                if (newMusicVolume > 0) {
                    if (!this.bgMusic.isPlaying) {
                        this.bgMusic.play({ loop: true, volume: newMusicVolume });
                    } else {
                        this.bgMusic.setVolume(newMusicVolume);
                    }
                } else {
                    if (this.bgMusic.isPlaying) this.bgMusic.stop();
                }
            }

            if (this.clickSound) {
                this.clickSound.setVolume(newSoundVolume);
            }

            this.clickSound?.play();

            document.querySelector('.panel').style.display = 'none';
            document.querySelector('.overlay').style.display = 'none';
        };

        // START button
        const btnWidth = 100;
        const btnHeight = 50;
        const btnX = width / 2 - btnWidth / 2;
        const btnY = height / 2 + 100;

        const buttonBg = this.add.graphics();
        const normalColor = 0x729C97;
        const hoverColor = 0x7AAFBA;

        buttonBg.fillStyle(normalColor, 1);
        buttonBg.fillRoundedRect(0, 0, btnWidth, btnHeight, 13);

        const startText = this.add.text(btnWidth / 2, btnHeight / 2, 'START', {
            fontSize: '22px',
            fontFamily: 'Arial',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const startButton = this.add.container(btnX, btnY, [buttonBg, startText]);

        buttonBg.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, btnWidth, btnHeight),
            Phaser.Geom.Rectangle.Contains
        ).on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(hoverColor, 1);
            buttonBg.fillRoundedRect(0, 0, btnWidth, btnHeight, 15);
            this.input.setDefaultCursor('pointer');
        }).on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(normalColor, 1);
            buttonBg.fillRoundedRect(0, 0, btnWidth, btnHeight, 15);
            this.input.setDefaultCursor('default');
        }).on('pointerdown', () => {
            this.clickSound?.play();
            this.scene.start('GameScene');
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
            this.scene.start('GameScene');
        });

        this.clickSound = this.sound.get('click-sound') || this.sound.add('click-sound', {
            volume: this.registry.get('soundVolume') ?? 0.5
        });        
    }

    createTitleText() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        this.add.text(width / 2, height * 0.21, 'Healthy Hustle', {
            fontFamily: 'Luckiest Guy',
            fontSize: '55px',
            color: '#E0F7FA',
            stroke: '#729C97',
            strokeThickness: 10,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000',
                blur: 4,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
    }
}