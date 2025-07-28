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

    // Add background
    this.add.image(width / 2, height / 2, 'char-bg').setDisplaySize(width, height);

    // Add a title
    this.add.text(width / 2, height * 0.15, 'SELECT YOUR RUNNER', {
      fontSize: '48px',
      fill: '#fff',
      fontFamily: 'Luckiest Guy', // Assuming you have this font loaded
      stroke: '#729C97',
      strokeThickness: 6,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000',
        blur: 8,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setResolution(3);

    // Click sound
    this.clickSound = this.sound.get('click-sound') || this.sound.add('click-sound', {
      volume: this.registry.get('soundVolume') ?? 0.5
    });

    // 1. Track which character is showing
    this.currentIndex = 0;

    // 2. Character Sprite (now a Phaser.GameObjects.Sprite for animation)
    this.characterSprite = this.add.sprite(width / 2, height / 2 - 50, '')
      .setScale(1)
      .setDepth(1); // Set an initial texture in showCharacter

    this.padlockIcon = this.add.image(width / 2, height / 2 , 'padlock')
        .setScale(0.1) // Adjust scale as needed
        .setOrigin(0.5)
        .setDepth(2) // Higher depth so it's on top of the character
        .setVisible(false); // Start invisible

    // Unlock requirement text (initially invisible)
    this.unlockText = this.add.text(width / 2, height * 0.75, '', {
        fontSize: '24px',
        fill: '#FFD700', // Gold color for unlock text
        fontFamily: 'Luckiest Guy',
        stroke: '#000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: width * 0.7 } // Wrap long text
    }).setOrigin(0.5).setResolution(3)
      .setVisible(false); // Start invisible

    // 4. Arrow controls with enhanced styling and hover effects
    const arrowStyle = {
      fontSize: '72px', // Larger arrows
      fill: '#729C97', // Match button color
      fontFamily: 'Luckiest Guy',
      stroke: '#000',
      strokeThickness: 8,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000',
        blur: 5,
        stroke: true,
        fill: true
      }
    };

    this.leftArrow = this.add.text(width * 0.25, height / 2, '<', arrowStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.clickSound) this.clickSound.play();
        this.showPrevious();
      })
      .on('pointerover', () => this.leftArrow.setStyle({ fill: '#7AAFBA' })) // Hover effect
      .on('pointerout', () => this.leftArrow.setStyle({ fill: '#729C97' }));

    this.rightArrow = this.add.text(width * 0.75, height / 2, '>', arrowStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.clickSound) this.clickSound.play();
        this.showNext();
      })
      .on('pointerover', () => this.rightArrow.setStyle({ fill: '#7AAFBA' })) // Hover effect
      .on('pointerout', () => this.rightArrow.setStyle({ fill: '#729C97' }));

    // 5. Select button with hover effect and pulsating animation
    const buttonNormalColor = 0x729C97;
    const buttonHoverColor = 0x7AAFBA;

    // Create a graphics object for the button background
    const selectButtonBg = this.add.graphics();
    selectButtonBg.fillStyle(buttonNormalColor, 1);
    selectButtonBg.fillRoundedRect(-100, -30, 200, 60, 15); // Adjust size for padding

    // Create text for the button
    const selectButtonText = this.add.text(0, 0, 'SELECT', {
      fontSize: '32px',
      fill: '#fff',
      fontFamily: 'Luckiest Guy',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000',
        blur: 8,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setResolution(3);

    // Create a container for the button (background + text)
    this.selectButton = this.add.container(width / 2, height * 0.85, [selectButtonBg, selectButtonText]);
    this.selectButton.setSize(200, 60); // Set container size for interactivity
    this.selectButton.setInteractive({ useHandCursor: true });

    this.selectButton.on('pointerover', () => {
      selectButtonBg.clear();
      selectButtonBg.fillStyle(buttonHoverColor, 1);
      selectButtonBg.fillRoundedRect(-100, -30, 200, 60, 15);
      this.input.setDefaultCursor('pointer');
      this.selectButton.setScale(1.1);
    });

    this.selectButton.on('pointerout', () => {
      selectButtonBg.clear();
      selectButtonBg.fillStyle(buttonNormalColor, 1);
      selectButtonBg.fillRoundedRect(-100, -30, 200, 60, 15);
      this.input.setDefaultCursor('default');
      this.selectButton.setScale(1);
    });

    this.selectButton.on('pointerdown', () => {
      if (this.clickSound) this.clickSound.play();
      this.confirmSelection();
    });

    // 6. Finally, show the first character
    this.showCharacter(this.currentIndex);
    }

    showCharacter(index) {
        const cfg = PLAYER_CONFIGS[index];
        const { width, height } = this.sys.game.config;

        // Set the texture of the sprite
        this.characterSprite.setTexture(cfg.key);

        // Adjust scale
        this.characterSprite.setScale(cfg.scale || 1);

        // Position the sprite (adjust Y based on character's actual height)
        // A common strategy is to make characters stand on a "ground" line
        // Assuming a ground line around height/2 + 50
        const spriteDisplayHeight = cfg.frameHeight * cfg.scale;
        this.characterSprite.y = this.sys.game.config.height / 2 + 20 ;
        this.characterSprite.x = this.sys.game.config.width * (cfg.x + 0.28);


        // Create and play animation dynamically
        const animKey = `${cfg.key}_idle_select`; // Unique key for select scene animation

        // Ensure the animation is created only once
        if (!this.anims.get(animKey)) {
            this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(cfg.key, {
                    start: 0,
                    end: cfg.frames - 1
                }),
                frameRate: 8, // Slower frame rate for idle animation on select screen
                repeat: -1
            });
        }
        this.characterSprite.anims.play(animKey, true);

        const playerHighScore = parseInt(localStorage.getItem('highScore') || '0'); // Get player's high score
        const playerMaxLevel = parseInt(localStorage.getItem('maxLevelReached') || '1'); // Get player's max level

        let isLocked = false;
        let unlockMessage = '';

        if (cfg.unlockedBy && Object.keys(cfg.unlockedBy).length > 0) { // Check if 'unlockedBy' is defined and not empty
            if (cfg.unlockedBy.type === 'score') {
                if (playerHighScore < cfg.unlockedBy.value) {
                    isLocked = true;
                    unlockMessage = `REACH ${cfg.unlockedBy.value} SCORE TO UNLOCK`;
                }
            } else if (cfg.unlockedBy.type === 'level') {
                if (playerMaxLevel < cfg.unlockedBy.value) {
                    isLocked = true;
                    unlockMessage = `COMPLETE LEVEL ${cfg.unlockedBy.value} TO UNLOCK`;
                }
            }
        }
        // else: if unlockedBy is empty, it's unlocked by default (like runner1)


        // Adjust UI based on locked status
        if (isLocked) {
            this.characterSprite.setTint(0x555555); // Dim the character
            this.padlockIcon.setVisible(true); // Show padlock
            this.unlockText.setText(unlockMessage).setVisible(true); // Show unlock message
            this.selectButton.setAlpha(0.5); // Dim select button
            this.selectButton.disableInteractive(); // Disable interaction
        } else {
            this.characterSprite.clearTint(); // Remove tint
            this.padlockIcon.setVisible(false); // Hide padlock
            this.unlockText.setVisible(false); // Hide unlock message
            this.selectButton.setAlpha(1); // Restore full opacity
            this.selectButton.setInteractive({ useHandCursor: true }); // Enable interaction
        }
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
