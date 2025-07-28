export const PLAYER_CONFIGS = [
  {
    key: 'runner1',
    sprite: 'assets/players/player1-sprite.png',
    frameWidth: 204,
    frameHeight: 226,
    scale: 1.1,
    x: 0.2,
    y: 125,
    frames: 4,
    unlockedBy: {},
  },
  {
    key: 'runner2',
    sprite: 'assets/players/player2-sprite.png',
    frameWidth: 64,
    frameHeight: 59,
    scale: 3.5,
    x: 0.2,
    y: 135,
    frames: 6,
    unlockedBy: { type: 'score', value: 30 },
  },
  {
    key: 'runner3',
    sprite: 'assets/players/player3-sprite.png',
    frameWidth: 680,
    frameHeight: 455,
    scale: 0.55,
    x: 0.3,
    y: 110,
    frames: 8,
    unlockedBy: { type: 'level', value: 3 },
  },
  {
    key: 'runner4',
    sprite: 'assets/players/player4-sprite.png',
    frameWidth: 165,
    frameHeight: 196,
    scale: 1.3,
    x: 0.2,
    y: 100,
    frames: 8,
    unlockedBy: { type: 'score', value: 50 },
  },
  {
    key: 'runner5',
    sprite: 'assets/players/player5-sprite.png',
    frameWidth: 305,
    frameHeight: 330,
    scale: 0.9,
    x: 0.15,
    y: 120,
    frames: 8,
    unlockedBy: { type: 'level', value: 5 },
  },
  {
    key: 'runner6',
    sprite: 'assets/players/player6-sprite.png',
    frameWidth: 220,
    frameHeight: 249,
    scale: 1.1,
    x: 0.2,
    y: 100,
    frames: 8,
    unlockedBy: { type: 'score', value: 70 },
  },
  {
    key: 'runner7',
    sprite: 'assets/players/player7-sprite.png',
    frameWidth: 327,
    frameHeight: 430,
    scale: 0.65,
    x: 0.2,
    y: 125,
    frames: 8,
    unlockedBy: { type: 'level', value: 7 },
  },
  {
    key: 'runner8',
    sprite: 'assets/players/player8-sprite.png',
    frameWidth: 195,
    frameHeight: 268,
    scale: 1.2,
    x: 0.2,
    y: 115,
    frames: 8,
    unlockedBy: { type: 'score', value: 90 },
  },
  {
    key: 'runner9',
    sprite: 'assets/players/player9-sprite.png',
    frameWidth: 88,
    frameHeight: 106,
    scale: 2.3,
    x: 0.2,
    y: 130,
    frames: 6,
    unlockedBy: { type: 'level', value: 9 },
  },
  {
    key: 'runner10',
    sprite: 'assets/players/player10-sprite.png',
    frameWidth: 92,
    frameHeight: 130,
    scale: 2,
    x: 0.2,
    y: 115,
    frames: 6,
    unlockedBy: { type: 'score', value: 100 },
  }
];

export const powerUpTypes = [
  {
    key: 'granola-bar',
    calories: 50,
    score: 2,
    rarity: 4,
  },
  {
    key: 'Avocado',
    calories: 70,
    score: 3,
    rarity: 3,
  },
  {
    key: 'Boiled Egg',
    calories: 30,
    score: 1,
    rarity: 1,
  },
  {
    key: 'Berries',
    calories: 40,
    score: 2,
    rarity: 2,
  },
  {
    key: 'Broccoli',
    calories: 35,
    score: 1,
    rarity: 1,
  },
  {
    key: 'Pomegranate',
    calories: 45,
    score: 2,
    rarity: 2,
  },
  {
    key: 'Banana',
    calories: 60,
    score: 2,
    rarity: 3,
  },
  {
    key: 'energy-drink',
    calories: 80,
    score: 4,
    rarity: 4,
  },
  {
    key: 'Mango',
    calories: 55,
    score: 2,
    rarity: 2,
  },
  {
    key: 'Proteinshake',
    calories: 90,
    score: 5,
    rarity: 4,
  },
  {
    key: 'Salad Bowl',
    calories: 65,
    score: 3,
    rarity: 3,
  }
];

export const hazardTypes = [
  {
    key: 'Candy Bar',
    calories: 90,
    score: -1,
    rarity: 1,
  },
  {
    key: 'Soda',
    calories: 85,
    score: -1,
    rarity: 1,
  },
  {
    key: 'Fries',
    calories: 120,
    score: -2,
    rarity: 2,
  },
  {
    key: 'Burger',
    calories: 150,
    score: -2,
    rarity: 4,
  },
  {
    key: 'Hotdog',
    calories: 130,
    score: -2,
    rarity: 2,
  },
  {
    key: 'Donuts',
    calories: 110,
    score: -2,
    rarity: 3,
  },
  {
    key: 'Pizza',
    calories: 160,
    score: -3,
    rarity: 4,
  }
];

export const obstacleTypes = [
  'dumbell',
  'gym-bench',
  'gym-plates',
  'jump-rope',
  'kettlebell',
  'rock',
  'tire-stack'
];

export const LEVEL_CONFIGS = [
  {
    id: 1,
    speed: 4,
    duration: 180000,  // 3:00
    powerUpFrequency: 3500,
    hazardFrequency: 4000,
    obstacleFrequency: 5000,
    spawnRange: [150, 300],
    label: 'Level 1',
    background: 'background1',
    calorieBurnPerSecond: 1.0,
    calorieBurnPerJump: 5,
    extraHeartSpawnRange: [60000, 70000]
 
  },
  {
    id: 2,
    speed: 4.75,
    duration: 210000,  // 3:30
    powerUpFrequency: 3300,
    hazardFrequency: 3800,
    obstacleFrequency: 4800,
    spawnRange: [150, 290],
    label: 'Level 2',
    background: 'background2',
    calorieBurnPerSecond: 1.5,
    calorieBurnPerJump: 5,
    extraHeartSpawnRange: [70000, 80000]
  
  },
  {
    id: 3,
    speed: 5.5,
    duration: 240000,  // 4:00
    powerUpFrequency: 3100,
    hazardFrequency: 3600,
    obstacleFrequency: 4600,
    spawnRange: [150, 280],
    label: 'Level 3',
    background: 'background3',
    calorieBurnPerSecond: 2.0,
    calorieBurnPerJump: 5,
    extraHeartSpawnRange: [60000, 80000]


  },
  {
    id: 4,
    speed: 6.25,
    duration: 270000,  // 4:30
    powerUpFrequency: 3000,
    hazardFrequency: 3400,
    obstacleFrequency: 4400,
    spawnRange: [145, 270],
    label: 'Level 4',
    background: 'background4',
    calorieBurnPerSecond: 2.5,
    calorieBurnPerJump: 5,
    extraHeartSpawnRange: [60000, 90000]
    
  },
  {
    id: 5,
    speed: 7,
    duration: 300000,  // 5:00
    powerUpFrequency: 2900,
    hazardFrequency: 3200,
    obstacleFrequency: 4200,
    spawnRange: [145, 260],
    label: 'Level 5',
    background: 'background5',
    calorieBurnPerSecond: 3.0,
    calorieBurnPerJump: 5,
    extraHeartSpawnRange: [80000, 90000]
 
  },
  {
    id: 6,
    speed: 7.75,
    duration: 330000,  // 5:30
    powerUpFrequency: 2800,
    hazardFrequency: 3000,
    obstacleFrequency: 4000,
    spawnRange: [140, 250],
    label: 'Level 6',
    background: 'background6',
    calorieBurnPerSecond: 3.5,
    calorieBurnPerJump: 5,
    extraHeartSpawnRange: [90000, 150000]
  
  },
  {
    id: 7,
    speed: 8.5,
    duration: 360000,  // 6:00
    powerUpFrequency: 2700,
    hazardFrequency: 2800,
    obstacleFrequency: 3800,
    spawnRange: [135, 240],
    label: 'Level 7',
    background: 'background7',
    calorieBurnPerSecond: 4.0,
    calorieBurnPerJump: 5,
    extraHeartSpawnRange: [90000, 170000]
 
  },
  {
    id: 8,
    speed: 9.25,
    duration: 390000,  // 6:30
    powerUpFrequency: 2600,
    hazardFrequency: 2600,
    obstacleFrequency: 3600,
    spawnRange: [130, 230],
    label: 'Level 8',
    background: 'background8',
    calorieBurnPerSecond: 4.5,
    calorieBurnPerJump: 5,
    extraHeartSpawnRange: [10000, 160000]
 
  },
  {
    id: 9,
    speed: 10,
    duration: 420000,  // 7:00
    powerUpFrequency: 2500,
    hazardFrequency: 2400,
    obstacleFrequency: 3400,
    spawnRange: [125, 220],
    label: 'Level 9',
    background: 'background9',
    calorieBurnPerSecond: 5.0,
    calorieBurnPerJump: 5,
   extraHeartSpawnRange: [90000, 100000]

  },
  {
    id: 10,
    speed: 10.75,
    duration: 450000,  // 7:30
    powerUpFrequency: 2400,
    hazardFrequency: 2200,
    obstacleFrequency: 3200,
    spawnRange: [120, 210],
    label: 'Level 10',
    background: 'background10',
    calorieBurnPerSecond: 5.5,
    calorieBurnPerJump: 5,
   extraHeartSpawnRange: [90000, 100000]

  }
];