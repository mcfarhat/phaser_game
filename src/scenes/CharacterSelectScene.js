import { PLAYER_CONFIGS } from '../config.js';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data){
    this.playerName = data.playerName;
  }

  preload() {
    
    // Load each character sprite
    PLAYER_CONFIGS.forEach(p => {
      this.load.image(p.key, p.sprite);
    });

  }

  create() {
    const { width, height } = this.sys.game.config;

    // 1. Track which character is showing
    this.currentIndex = 0;

    // 2. Pre-create sprite & text placeholders
    this.characterSprite = this.add.image(width/2, height/2 - 50, '')
        .setScale(1)
        .setDepth(1);

    this.characterLabel = this.add.text(width/2, height/2 + 60, '', {
        fontSize: '24px', fontFamily: 'Arial', fill: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // 3. Arrow controls
    this.leftArrow = this.add.text(width*0.25, height/2, '<', { 
        fontSize: '48px', fill: '#fff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.showPrevious());

    this.rightArrow = this.add.text(width*0.75, height/2, '>', { 
        fontSize: '48px', fill: '#fff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.showNext());

    // 4. Select button
    this.selectButton = this.add.text(width/2, height*0.8, 'SELECT', {
        fontSize: '32px',
        fill: '#fff',
        fontFamily: 'Luckiest Guy',
        backgroundColor: '#729C97',
        padding: { x: 20, y: 10 },
        borderRadius: 10,
        align: 'center'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.confirmSelection());

    // 5. Finally, show the first character
    this.showCharacter(this.currentIndex);
    }

    showCharacter(index) {
        const cfg = PLAYER_CONFIGS[index];
        this.characterSprite.setTexture(cfg.key);
        this.characterSprite.setScale(cfg.scale || 1);
        this.characterLabel.setText(cfg.label);
    }

    showPrevious() {
        this.currentIndex = (this.currentIndex - 1 + PLAYER_CONFIGS.length) % PLAYER_CONFIGS.length;
        this.showCharacter(this.currentIndex);
    }

    showNext() {
        this.currentIndex = (this.currentIndex + 1) % PLAYER_CONFIGS.length;
        this.showCharacter(this.currentIndex);
    }

    confirmSelection() {
        const cfg = PLAYER_CONFIGS[this.currentIndex];
        this.registry.set('selectedCharacter', cfg.key);
        this.scene.start('GameScene', {
            playerName: this.playerName,
            levelId: 1,
            startTimer: true
        });
    }

}
