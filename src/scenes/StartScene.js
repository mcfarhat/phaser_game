//StartScene.js
import { supabase } from '../supabaseClient.js';
import { showLeaderboardUI } from './GameScene.js';

export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    init(data) {
        this.playerName = data.playerName;
        this.startTimer = data.startTimer;
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
        const settingsBtn = this.add.image(width - 10, 5, 'settings-icon')
            .setDisplaySize(25, 23)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(60);  

        settingsBtn.on('pointerdown', () => {
            playClickSound();
            document.querySelector('.overlay').style.display = 'block';
            document.querySelector('.panel').style.display = 'flex';

            document.getElementById('musicSlider').value = this.registry.get('musicVolume') * 100;
            document.getElementById('soundSlider').value = this.registry.get('soundVolume') * 100;
        });

        this.leaderboardIcon = this.add.image(width - 39, 6, 'trophy-icon')
            .setDisplaySize(25, 23)
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(60);

        this.leaderboardIcon.on('pointerdown', () => {
            if (this.clickSound) this.clickSound.play();
            this.scene.pause();
            showLeaderboardUI();
        });

        const closeLeaderboardBtn = document.getElementById('close-leaderboard');
        if (closeLeaderboardBtn && !closeLeaderboardBtn.hasListener) {
            closeLeaderboardBtn.addEventListener('click', () => {
                if (this.clickSound) this.clickSound.play();
                document.getElementById('leaderboard-container').style.display = 'none';
                document.querySelector('.overlay').style.display = 'none';
                this.scene.resume();
                closeLeaderboardBtn.hasListener = false;
            });
            closeLeaderboardBtn.hasListener = true;
            
        }

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

        this.startButton = this.add.container(btnX, btnY, [buttonBg, startText]);
        this.startButton.setSize(btnWidth, btnHeight);
        this.startButton.setInteractive();
        this.startButton.disableInteractive();  // disables clicks


        this.startButton.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(hoverColor, 1);
            buttonBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
            this.input.setDefaultCursor('pointer');
        });

        this.startButton.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(normalColor, 1);
            buttonBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
            this.input.setDefaultCursor('default');
        });

        this.startButton.on('pointerdown', () => {
            playClickSound();
            this.scene.start('CharacterSelectScene', {
                playerName: this.playerName,
            });
        });

        this.tweens.add({
            targets: this.startButton,
            scaleX: 1.08,
            scaleY: 1.08,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 600
        });

        this.loadPlayerNameFromSupabase();

        const hudHeight = 40;     
        const hudPadding = 10;  
        const hudBg = this.add.rectangle(
            0,             
            0,            
            width,         
            hudHeight,     
            0x000000,     
            0.4            
        )
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(50);
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

    startGame() {
        this.startButton.setInteractive();
    }

    createNameInput() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // Overlay (same as settings)
        this.nameOverlay = document.createElement('div');
        this.nameOverlay.className = 'overlay';
        this.nameOverlay.style.display = 'block';
        this.nameOverlay.style.zIndex = 999;
        document.body.appendChild(this.nameOverlay);

        // Panel container
        this.namePanel = document.createElement('div');
        this.namePanel.className = 'panel';
        this.namePanel.style.display = 'flex';
        this.namePanel.style.flexDirection = 'column';
        this.namePanel.style.alignItems = 'center';
        this.namePanel.style.justifyContent = 'center';
        this.namePanel.style.padding = '40px 20px 20px 20px';
        this.namePanel.style.gap = '10px';
        this.namePanel.style.zIndex = 1000;
        this.namePanel.style.width = '260px';
        this.namePanel.style.height = '130px';
        this.namePanel.style.borderRadius = '15px';
        this.namePanel.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
        this.namePanel.style.position = 'absolute';
        this.namePanel.style.left = '50%';
        this.namePanel.style.top = '45%';
        this.namePanel.style.transform = 'translate(-50%, -50%)';

        // Prompt
        const prompt = document.createElement('p');
        prompt.textContent = 'ENTER YOUR NICKNAME:';
        prompt.style.fontSize = '20px';
        prompt.style.fontFamily = 'Luckiest Guy';
        prompt.style.color = '#7AAFBA';
        prompt.style.margin = '0';

        // Input field
        const inputWidth = 210;
        const inputHeight = 25;

        this.nameInputElement = document.createElement('input');
        this.nameInputElement.type = 'text';
        this.nameInputElement.placeholder = 'YOUR NICKNAME';
        this.nameInputElement.style.width = `${inputWidth}px`;
        this.nameInputElement.style.height = `${inputHeight}px`;
        this.nameInputElement.style.fontSize = '18px';
        this.nameInputElement.style.color = '#7AAFBA';
        this.nameInputElement.style.padding = '8px 12px';
        this.nameInputElement.style.borderRadius = '8px';
        this.nameInputElement.style.boxShadow = '0 4px 10px rgba(0,0,0,0.25)';
        this.nameInputElement.style.fontFamily = 'Luckiest Guy';
        this.nameInputElement.style.backgroundColor = '#FFF';
        this.nameInputElement.className = 'name-input';

        const style = document.createElement('style');
        style.textContent = `
        .name-input::placeholder {
            color:rgb(211, 239, 242);
            font-family: 'Luckiest Guy';
            font-size: 15px;
            letter-spacing: 0.5px;
        }
        `;
        document.head.appendChild(style);

        // GO button
        const goButton = document.createElement('button');
        goButton.textContent = 'GO';
        goButton.style.backgroundColor = '#7AAFBA';
        goButton.style.color = '#fff';
        goButton.style.fontSize = '18px';
        goButton.style.padding = '8px 24px';
        goButton.style.border = 'none';
        goButton.style.borderRadius = '30px';
        goButton.style.cursor = 'pointer';
        goButton.style.fontFamily = 'Luckiest Guy';
        goButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        goButton.style.transition = 'transform 0.1s ease';
        goButton.style.letterSpacing = '1px';
        goButton.style.marginTop = '15px';

        goButton.addEventListener('click', async () => {
            const val = this.nameInputElement.value.trim();
            if (val.length > 0) {
                localStorage.setItem('playerName', val);
                this.playerName = val;

                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userData?.user) {
                    const userId = userData.user.id;
                    await supabase
                        .from('users')
                        .upsert({ id: userId, name: val }, { onConflict: ['id'] });
                }

                this.removeNameInput();
                this.displayWelcomeMessage(val);
                this.startGame();
            }
        });

        // Add elements to panel
        this.namePanel.appendChild(prompt);
        this.namePanel.appendChild(this.nameInputElement);
        this.namePanel.appendChild(goButton);
        document.body.appendChild(this.namePanel);

        // Focus input
        this.nameInputElement.focus();

        // Handle Enter key
        this.nameInputElement.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                const val = this.nameInputElement.value.trim();
                if (val.length > 0) {
                    localStorage.setItem('playerName', val);
                    this.playerName = val;

                    const { data: userData, error: userError } = await supabase.auth.getUser();
                    if (userData?.user) {
                        const userId = userData.user.id;
                        await supabase
                            .from('users')
                            .upsert({ id: userId, name: val }, { onConflict: ['id'] });
                    }

                    this.removeNameInput();
                    this.displayWelcomeMessage(val);
                    this.startGame();
                }
            }
        });
    }

   removeNameInput() {
        if (this.nameOverlay) {
            this.nameOverlay.remove();
            this.nameOverlay = null;
        }
        if (this.namePanel) {
            this.namePanel.remove();
            this.namePanel = null;
        }
        if (this.nameInputElement) {
            this.nameInputElement.remove();
            this.nameInputElement = null;
        }
    }


    async loadPlayerNameFromSupabase() {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            console.warn('User not logged in, falling back to localStorage');
            this.useLocalStorageName();
            return;
        }

        const userId = userData.user.id;

        const { data, error } = await supabase
            .from('users')
            .select('name')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.warn('No player name found in Supabase, using localStorage');
            this.useLocalStorageName();
        } else {
            this.playerName = data.name;
            this.displayWelcomeMessage(data.name);
            this.startGame();
        }
    }

    useLocalStorageName() {
        const name = localStorage.getItem('playerName');
        if (name) {
            this.playerName = name;
            this.displayWelcomeMessage(name);
            this.startGame();
        } else {
            this.createNameInput();
        }
    }

    displayWelcomeMessage(name) {
        this.add.text(10, 7, `WELCOME, ${name}!`, {
            fontFamily: 'Luckiest Guy',
            fontSize: '20px',
            fill: '#ffffff',
            letterSpacing: '1.2px'
        }).setDepth(10).setScrollFactor(0).setDepth(60);
    }
}