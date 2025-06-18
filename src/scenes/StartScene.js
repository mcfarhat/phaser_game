// StartScene.js
export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {}

    create() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        WebFont.load({
            google: {
                families: ['Luckiest Guy']
            },
            active: () => {
                this.createTitleText();
            }
        });

        // Background
        this.add.image(0, 0, 'start-bg')
            .setOrigin(0, 0)
            .setDisplaySize(width, height);

        // Background Music
        this.bgMusic = this.sound.get('start-sound') || this.sound.add('start-sound', { loop: true });
        if (this.registry.get('musicEnabled')) {
            if (!this.bgMusic.isPlaying) {
                this.bgMusic.play();
            }
        }

        // SETTINGS button
        const settingsBtn = this.add.text(width - 30, 20, '⚙', {
            fontSize: '25px',
            color: '#FFF',
            fontStyle: 'bold'
        }).setOrigin(1, 0)
          .setInteractive({ useHandCursor: true })
          .setScrollFactor(0)
          .setDepth(10);

        settingsBtn.on('pointerdown', () => {
            showSettingsPanel();
        });

        // SETTINGS panel
        const panel = this.add.container(0, 0).setDepth(20).setVisible(false);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.6)
            .setOrigin(0, 0);
        panel.add(dim);

        const card = this.add.graphics();
        const cardWidth = 230;
        const cardHeight = 200;
        const cardX = width / 2 - cardWidth / 2;
        const cardY = height / 2 - cardHeight / 2;

        card.fillStyle(0x8D715D, 0.85);
        card.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 20);
        panel.add(card);

        // Title
        const title = this.add.text(width / 2, cardY + 35, 'Settings', {
            fontSize: '26px',
            color: '#dbc49a',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        panel.add(title);

        // MUSIC toggle
        const musicEmoji = this.add.text(cardX + 50, cardY + 80, '', {
            fontSize: '22px',
            color: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setInteractive({ useHandCursor: true });
        panel.add(musicEmoji);

        const musicLabel = this.add.text(cardX + 100, cardY + 84, 'MUSIC', {
            fontSize: '20px',
            color: '#dbc49a',
            fontFamily: 'Arial',
        });
        panel.add(musicLabel);

        musicEmoji.on('pointerdown', () => {
            const current = this.registry.get('musicEnabled');
            const newValue = !current;
            this.registry.set('musicEnabled', newValue);
            updateMusicEmoji();
        
            if (newValue) {
                if (!this.bgMusic.isPlaying) {
                    this.bgMusic.play({ loop: true });
                }
            } else {
                if (this.bgMusic && this.bgMusic.isPlaying) {
                    this.bgMusic.stop();
                }
            }
        });  

        const updateMusicEmoji = () => {
            const enabled = this.registry.get('musicEnabled') ?? false;
            musicEmoji.setText(enabled ? '🔈' : '🔇');
        };

        // BACK button
        const backBtnIcon = this.add.text(cardX + 55, cardY + 125, '←', {
            fontSize: '20px',
            color: '#FFF',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            padding: { x: 10, y: 5 }
        }).setInteractive({ useHandCursor: true });
        panel.add(backBtnIcon);

        const backLabel = this.add.text(cardX + 100, cardY + 129, 'BACK', {
            fontSize: '20px',
            color: '#dbc49a',
            fontFamily: 'Arial',
        });
        panel.add(backLabel);

        backBtnIcon.on('pointerdown', () => {
            panel.setVisible(false);
        });

        const showSettingsPanel = () => {
            updateMusicEmoji();
            panel.setVisible(true);
        };  
        
        // START button
        const btnWidth = 130;
        const btnHeight = 50;
        const btnX = width / 2 - btnWidth / 2;
        const btnY = height / 2 + 210;

        const buttonBg = this.add.graphics();
        const normalColor = 0x4a2f1d;
        const hoverColor = 0xdbc49a;

        buttonBg.fillStyle(normalColor, 1);
        buttonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
        buttonBg.setInteractive(
            new Phaser.Geom.Rectangle(btnX, btnY, btnWidth, btnHeight),
            Phaser.Geom.Rectangle.Contains
        ).on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(hoverColor, 1);
            buttonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.input.setDefaultCursor('pointer');
        }).on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(normalColor, 1);
            buttonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.input.setDefaultCursor('default');
        }).on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        this.add.text(width / 2, btnY + btnHeight / 2, 'START', {
            fontSize: '23px',
            fontFamily: 'Arial',
            fill: '#8D715D',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
    createTitleText() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
    
        const titleText = this.add.text(width / 2, height * 0.2, 'JUNK RUN', {
            fontFamily: 'Luckiest Guy',
            fontSize: '60px',
            color: '#dbc49a',
            stroke: '#4a2f1d',
            strokeThickness: 8,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000000',
                blur: 4,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
    
        this.tweens.timeline({
            targets: titleText,
            loop: -1,
            ease: 'Sine.easeInOut',
            tweens: [
                { angle: -4, y: titleText.y - 3, duration: 280 },
                { angle: 4, y: titleText.y + 3, duration: 280 },
                { angle: -2, y: titleText.y - 2, duration: 280 },
                { angle: 2, y: titleText.y + 2, duration: 280 },
                { angle: 0, y: titleText.y, duration: 280 },
                { delay: 500 }
            ]
        });
    }
    
}