
// --- 全域元素 ---
const gameWrapper = document.querySelector('.game-wrapper');
const mainMenu = document.getElementById('main-menu');
const gameStaticContainer = document.getElementById('game-static');
const gameDashContainer = document.getElementById('game-dash');
const gameMonsterContainer = document.getElementById('game-monster');

// --- 事件監聽 ---
document.getElementById('btn-game-static').addEventListener('click', () => showGame('static'));
document.getElementById('btn-game-dash').addEventListener('click', () => showGame('dash'));
document.getElementById('btn-game-monster').addEventListener('click', () => showGame('monster'));

document.querySelectorAll('.back-button').forEach(btn => btn.addEventListener('click', showMenu));

let activeGameKey = null;

// --- 畫面切換邏輯 ---
function showMenu() {
    if (activeGameKey && games[activeGameKey]) {
        games[activeGameKey].end();
        activeGameKey = null;
    }
    mainMenu.classList.remove('hidden');
    gameStaticContainer.classList.add('hidden');
    gameDashContainer.classList.add('hidden');
    gameMonsterContainer.classList.add('hidden');
}

function showGame(gameName) {
    mainMenu.classList.add('hidden');
    activeGameKey = gameName;
    const container = document.getElementById(`game-${gameName}`);
    container.classList.remove('hidden');
    if (games[activeGameKey]) {
        games[activeGameKey].start();
    }
}

// ===================================
// ===== 遊戲一：靜態練習 (gameStatic) =====
// ===================================
const gameStatic = {
    display: document.getElementById('gs-char-display'), message: document.getElementById('gs-message'), wordSet: ['APPLE', 'SKY', 'DREAM', 'CODE', 'HAPPY', 'SUN', 'MOON'], alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', currentWord: '', typedIndex: 0, isGameRunning: false, isAnimating: false,
    start() { this.isGameRunning = true; this.display.innerHTML = '<span class="pulse-animation">準備好了嗎？</span>'; this.message.textContent = '請按任意鍵開始'; document.addEventListener('keydown', this.handleInitialKey, { once: true }); },
    init() { this.getNextWord(); document.addEventListener('keydown', this.handleKeyPress); },
    end() { this.isGameRunning = false; document.removeEventListener('keydown', this.handleKeyPress); document.removeEventListener('keydown', this.handleInitialKey); },
    handleInitialKey: (e) => { gameStatic.init(); },
    getNextWord() { this.typedIndex = 0; let newWord; do { newWord = this.wordSet[Math.floor(Math.random() * this.wordSet.length)]; } while (newWord === this.currentWord); this.currentWord = newWord; this.display.innerHTML = ''; this.currentWord.split('').forEach(char => { const charSpan = document.createElement('span'); charSpan.textContent = char; this.display.appendChild(charSpan); }); this.message.textContent = '換你囉！'; },
    handleKeyPress(event) { if (!this.isGameRunning || this.isAnimating || !this.currentWord) return; const keyPressed = event.key.toUpperCase(); if (keyPressed.length !== 1 || !this.alphabet.includes(keyPressed)) return; const expectedKey = this.currentWord[this.typedIndex]; const targetSpan = this.display.children[this.typedIndex]; this.isAnimating = true; if (keyPressed === expectedKey) { targetSpan.classList.add('gs-correct', 'gs-shake-correct-animation'); this.typedIndex++; setTimeout(() => { targetSpan.classList.remove('gs-shake-correct-animation'); this.isAnimating = false; if (this.typedIndex === this.currentWord.length) { this.message.textContent = '太棒了！完成！'; setTimeout(() => this.getNextWord(), 1000); } }, 600); } else { targetSpan.classList.add('gs-shake-incorrect-animation'); this.message.textContent = '不對喔，是這個字母！'; setTimeout(() => { targetSpan.classList.remove('gs-shake-incorrect-animation'); this.isAnimating = false; }, 500); } }
};
gameStatic.handleKeyPress = gameStatic.handleKeyPress.bind(gameStatic);

// ===================================
// ===== 遊戲二：打字衝刺 (gameDash) =====
// ===================================
const gameDash = {
    gameArea: document.getElementById('gd-game-area'), scoreDisplay: document.getElementById('gd-score-display'), livesDisplay: document.getElementById('gd-lives-display'), levelDisplay: document.getElementById('gd-level-display'), countdownDisplay: document.getElementById('gd-countdown-display'), gameOverScreen: document.getElementById('gd-game-over-screen'), restartButton: document.getElementById('gd-restart-button'), finalScoreDisplay: document.getElementById('gd-final-score'), ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', INITIAL_LIVES: 5, HITS_PER_LEVEL: 10, LEVELS: [ { speed: 0.8, spawn: 1800 }, { speed: 1.0, spawn: 1600 }, { speed: 1.2, spawn: 1400 }, { speed: 1.5, spawn: 1200 }, { speed: 1.8, spawn: 1000 }, { speed: 2.1, spawn: 900 }, { speed: 2.4, spawn: 800 }, { speed: 2.7, spawn: 700 }, { speed: 3.0, spawn: 600 }, { speed: 3.4, spawn: 500 }, ], score: 0, lives: 0, lettersOnScreen: [], gameLoopId: null, lastSpawnTime: 0, isGameRunning: false, currentLevel: 1, hitsInLevel: 0, fallSpeed: 1, spawnRate: 1500,
    start() { this.isGameRunning = true; this.score = 0; this.lives = this.INITIAL_LIVES; this.currentLevel = 1; this.hitsInLevel = 0; this.lettersOnScreen.forEach(letter => letter.element.remove()); this.lettersOnScreen = []; this.updateLevelSettings(); this.updateUI(); this.gameOverScreen.classList.add('hidden'); document.addEventListener('keydown', this.handleKeyPress); this.restartButton.onclick = () => this.start(); this.gameLoop(0); },
    end() { this.isGameRunning = false; if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId); document.removeEventListener('keydown', this.handleKeyPress); },
    updateLevelSettings() { const levelConfig = this.LEVELS[this.currentLevel - 1]; this.fallSpeed = levelConfig.speed; this.spawnRate = levelConfig.spawn; },
    updateUI() { this.scoreDisplay.textContent = this.score; this.livesDisplay.textContent = '❤️'.repeat(this.lives); this.levelDisplay.textContent = this.currentLevel; this.countdownDisplay.textContent = this.HITS_PER_LEVEL - this.hitsInLevel; },
    levelUp() { if (this.currentLevel < this.LEVELS.length) { this.currentLevel++; } this.hitsInLevel = 0; this.updateLevelSettings(); },
    gameLoop(timestamp) { if (!this.isGameRunning) return; if (timestamp - this.lastSpawnTime > this.spawnRate) { this.lastSpawnTime = timestamp; this.spawnLetter(); } this.moveLetters(); this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this)); },
    spawnLetter() { const char = this.ALPHABET[Math.floor(Math.random() * this.ALPHABET.length)]; const letterElement = document.createElement('div'); letterElement.className = 'letter'; letterElement.textContent = char; const xPosition = Math.random() * (this.gameArea.clientWidth - 45); letterElement.style.left = `${xPosition}px`; letterElement.style.top = `-45px`; this.gameArea.appendChild(letterElement); this.lettersOnScreen.push({ element: letterElement, character: char, y: -45 }); },
    moveLetters() { const gameAreaHeight = this.gameArea.clientHeight; for (let i = this.lettersOnScreen.length - 1; i >= 0; i--) { const letter = this.lettersOnScreen[i]; letter.y += this.fallSpeed; letter.element.style.top = `${letter.y}px`; if (letter.y > gameAreaHeight) { letter.element.remove(); this.lettersOnScreen.splice(i, 1); this.loseLife(); } } },
    handleKeyPress(event) { if (!this.isGameRunning) return; const keyPressed = event.key.toUpperCase(); for (let i = this.lettersOnScreen.length - 1; i >= 0; i--) { if (this.lettersOnScreen[i].character === keyPressed) { const letter = this.lettersOnScreen[i]; this.score++; this.hitsInLevel++; if(this.hitsInLevel >= this.HITS_PER_LEVEL) { this.levelUp(); } letter.element.classList.add('popped'); setTimeout(() => letter.element.remove(), 200); this.lettersOnScreen.splice(i, 1); this.updateUI(); return; } } },
    loseLife() { this.lives--; gameWrapper.classList.add('screen-shake-animation'); setTimeout(() => { gameWrapper.classList.remove('screen-shake-animation'); }, 400); if (this.lives <= 0) { this.end(); this.finalScoreDisplay.textContent = this.score; this.gameOverScreen.classList.remove('hidden'); } this.updateUI(); },
};
gameDash.handleKeyPress = gameDash.handleKeyPress.bind(gameDash);

// ===================================
// ===== 遊戲三：打怪物 (gameMonster) =====
// ===================================
const gameMonster = {
    gameArea: document.getElementById('gm-game-area'), levelDisplay: document.getElementById('gm-level-display'), defeatedDisplay: document.getElementById('gm-defeated-display'), gameOverScreen: document.getElementById('gm-game-over-screen'), restartButton: document.getElementById('gm-restart-button'), finalLevelDisplay: document.getElementById('gm-final-level'), ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), MONSTERS_PER_BOSS: 10, SPAWN_EDGE_BUFFER: 80, // 怪物離邊框的距離
    LEVELS: [ { count: 1, interval: 3000, growth: 0.05 }, { count: 2, interval: 2800, growth: 0.06 }, { count: 2, interval: 2500, growth: 0.07 }, { count: 3, interval: 2300, growth: 0.08 }, { count: 3, interval: 2000, growth: 0.10 }, { count: 4, interval: 1800, growth: 0.12 }, { count: 4, interval: 1600, growth: 0.14 }, { count: 5, interval: 1500, growth: 0.16 }, { count: 5, interval: 1400, growth: 0.18 }, { count: 6, interval: 1300, growth: 0.20 }, ],
    DESIGNS: {
        ghost:   { emoji: '👻', size: 60 }, pumpkin: { emoji: '🎃', size: 60 }, lion:    { emoji: '🦁', size: 60 },
        tiger:   { emoji: '🐯', size: 60 }, alien:   { emoji: '👾', size: 60 }, robot:   { emoji: '🤖', size: 60 }
    },
    BOSS_DESIGN: { // 全新複合式 Boss
        containerSize: { width: 300, height: 250 },
        parts: [
            { id: 'head', emoji: '🐲', size: 120, position: { top: '0px', left: '90px' } },
            { id: 'l_wing', emoji: '🐉', size: 80, position: { top: '50px', left: '20px' } },
            { id: 'r_wing', emoji: '🐉', size: 80, position: { top: '50px', left: '200px' } },
            { id: 'tail', emoji: '🔥', size: 60, position: { top: '180px', left: '120px' } }
        ]
    }, 
    isGameRunning: false, gameLoopId: null, lastSpawnTime: 0, currentLevel: 1, monstersDefeated: 0, monstersOnScreen: [], activeChars: [], isBossActive: false,
    start() { this.isGameRunning = true; this.currentLevel = 1; this.monstersDefeated = 0; this.isBossActive = false; this.gameArea.innerHTML = ''; this.monstersOnScreen = []; this.activeChars = []; this.updateUI(); this.gameOverScreen.classList.add('hidden'); document.addEventListener('keydown', this.handleKeyPress); this.restartButton.onclick = () => this.start(); this.gameLoop(0); },
    end() { this.isGameRunning = false; if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId); document.removeEventListener('keydown', this.handleKeyPress); },
    updateUI() { this.levelDisplay.textContent = this.currentLevel; this.defeatedDisplay.textContent = this.monstersDefeated; },
    gameLoop(timestamp) { if (!this.isGameRunning) return; const config = this.LEVELS[this.currentLevel - 1]; if (!this.isBossActive && this.monstersOnScreen.length < config.count && timestamp - this.lastSpawnTime > config.interval) { this.lastSpawnTime = timestamp; this.spawnMonster(); } this.monstersOnScreen.forEach(monster => { if (monster.isDefeated) return; monster.size += config.growth; const el = monster.el; el.style.width = `${monster.size}px`; el.style.height = `${monster.size}px`; if (!monster.isBoss) { el.querySelector('.monster-graphic').style.fontSize = `${monster.size * 0.8}px`; } const rect = el.getBoundingClientRect(); const parentRect = this.gameArea.getBoundingClientRect(); if (rect.left < parentRect.left || rect.right > parentRect.right || rect.top < parentRect.top || rect.bottom > parentRect.bottom) { this.gameOver(); } }); this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this)); },
    spawnMonster() {
        const designKeys = Object.keys(this.DESIGNS);
        const randomDesignKey = designKeys[Math.floor(Math.random() * designKeys.length)];
        const design = this.DESIGNS[randomDesignKey];
        let char;
        do { char = this.ALPHABET[Math.floor(Math.random() * this.ALPHABET.length)]; } while (this.activeChars.includes(char));

        const monsterEl = document.createElement('div');
        monsterEl.className = 'monster';
        monsterEl.innerHTML = `<div class="monster-graphic">${design.emoji}</div><div class="monster-char">${char}</div>`;
        
        const size = design.size;
        monsterEl.style.width = `${size}px`;
        monsterEl.style.height = `${size}px`;
        monsterEl.querySelector('.monster-graphic').style.fontSize = `${size * 0.8}px`;

        const buffer = this.SPAWN_EDGE_BUFFER;
        const x = buffer + Math.random() * (this.gameArea.clientWidth - size - buffer * 2);
        const y = buffer + Math.random() * (this.gameArea.clientHeight - size - buffer * 2);
        monsterEl.style.left = `${x}px`;
        monsterEl.style.top = `${y}px`;

        const monster = { el: monsterEl, char: char, size: size, isDefeated: false };
        this.monstersOnScreen.push(monster);
        this.activeChars.push(char);
        this.gameArea.appendChild(monsterEl);
    },
    spawnBoss() {
        this.isBossActive = true;
        this.gameArea.innerHTML = '';
        this.monstersOnScreen = [];
        this.activeChars = [];

        const bossInfo = this.BOSS_DESIGN;
        const bossContainer = document.createElement('div');
        bossContainer.className = 'monster';
        bossContainer.style.width = `${bossInfo.containerSize.width}px`;
        bossContainer.style.height = `${bossInfo.containerSize.height}px`;

        const bossParts = [];

        bossInfo.parts.forEach(partInfo => {
            let char;
            do { char = this.ALPHABET[Math.floor(Math.random() * this.ALPHABET.length)]; } while (this.activeChars.includes(char));
            this.activeChars.push(char);

            const partEl = document.createElement('div');
            partEl.className = 'boss-part';
            partEl.innerHTML = `<div class="monster-graphic" style="font-size: ${partInfo.size}px">${partInfo.emoji}</div><div class="monster-char">${char}</div>`;
            partEl.style.top = partInfo.position.top;
            partEl.style.left = partInfo.position.left;
            partEl.style.width = `${partInfo.size}px`;
            partEl.style.height = `${partInfo.size}px`;
            
            bossContainer.appendChild(partEl);
            bossParts.push({ el: partEl, char: char, isDefeated: false });
        });
        
        const size = bossInfo.containerSize.width;
        bossContainer.style.left = `${(this.gameArea.clientWidth - size) / 2}px`;
        bossContainer.style.top = `${(this.gameArea.clientHeight - bossInfo.containerSize.height) / 2}px`;

        const boss = { el: bossContainer, isBoss: true, parts: bossParts, size: size, isDefeated: false };
        this.monstersOnScreen.push(boss);
        this.gameArea.appendChild(bossContainer);
    },
    handleKeyPress(event) { if (!this.isGameRunning) return; const char = event.key.toUpperCase(); if (this.isBossActive) { const boss = this.monstersOnScreen[0]; if (!boss) return; const partToHit = boss.parts.find(p => p.char === char && !p.isDefeated); if (partToHit) { partToHit.isDefeated = true; partToHit.el.classList.add('monster-hit'); setTimeout(() => { partToHit.el.classList.add('monster-explode'); }, 300); const remainingParts = boss.parts.filter(p => !p.isDefeated); if (remainingParts.length === 0) { boss.isDefeated = true; setTimeout(() => { this.isBossActive = false; if(this.currentLevel < this.LEVELS.length) this.currentLevel++; this.updateUI(); this.gameArea.innerHTML = ''; this.monstersOnScreen = []; }, 800); } } return; } const monsterIndex = this.monstersOnScreen.findIndex(m => m.char === char); if (monsterIndex !== -1) { const monster = this.monstersOnScreen[monsterIndex]; monster.isDefeated = true; monster.el.classList.add('monster-hit'); setTimeout(() => { monster.el.classList.add('monster-explode'); setTimeout(() => monster.el.remove(), 300); }, 300); this.monstersOnScreen.splice(monsterIndex, 1); this.activeChars.splice(this.activeChars.indexOf(char), 1); this.monstersDefeated++; this.updateUI(); if(this.monstersDefeated > 0 && this.monstersDefeated % this.MONSTERS_PER_BOSS === 0) { this.spawnBoss(); } } },
    gameOver() { if (!this.isGameRunning) return; this.end(); gameWrapper.classList.add('screen-shake-animation'); setTimeout(() => gameWrapper.classList.remove('screen-shake-animation'), 400); this.finalLevelDisplay.textContent = this.currentLevel; this.gameOverScreen.classList.remove('hidden'); }
};
gameMonster.handleKeyPress = gameMonster.handleKeyPress.bind(gameMonster);

const games = {
    static: gameStatic,
    dash: gameDash,
    monster: gameMonster
};