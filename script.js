// --- Global elements & navigation logic ---
const gameWrapper = document.querySelector('.game-wrapper');
const mainMenu = document.getElementById('main-menu');
const gameStaticContainer = document.getElementById('game-static');
const gameDashContainer = document.getElementById('game-dash');
const gameMonsterContainer = document.getElementById('game-monster');
document.getElementById('btn-game-static').addEventListener('click', () => showGame('static'));
document.getElementById('btn-game-dash').addEventListener('click', () => showGame('dash'));
document.getElementById('btn-game-monster').addEventListener('click', () => showGame('monster'));
document.querySelectorAll('.back-button').forEach(btn => btn.addEventListener('click', showMenu));
let activeGameKey = null;
function showMenu() { if (activeGameKey && games[activeGameKey]) { games[activeGameKey].end(); } activeGameKey = null; mainMenu.classList.remove('hidden'); gameStaticContainer.classList.add('hidden'); gameDashContainer.classList.add('hidden'); gameMonsterContainer.classList.add('hidden'); }
function showGame(gameName) { mainMenu.classList.add('hidden'); activeGameKey = gameName; const container = document.getElementById(`game-${gameName}`); container.classList.remove('hidden'); if (games[activeGameKey]) { games[activeGameKey].start(); } }

// ===================================
// ===== Vocabulary store (vocabulary) =====
// ===================================
const vocabulary = {
    storageKey: 'tp_words',
    // Default English words for static practice
    defaultWords: ['APPLE', 'SKY', 'DREAM', 'CODE', 'HAPPY', 'SUN', 'MOON', 'WATER', 'CLOUD', 'MUSIC', 'SMILE', 'LIGHT', 'NIGHT', 'BRAVE', 'PEACE', 'WORLD', 'SPACE', 'GREEN', 'QUICK', 'ZEBRA'],
    getWords() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return this.defaultWords.slice();
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return this.defaultWords.slice();
            return arr.filter(w => typeof w === 'string' && w.length > 0);
        } catch (e) {
            return this.defaultWords.slice();
        }
    },
    setWords(wordsArray) {
        const sanitized = this.sanitize(wordsArray);
        localStorage.setItem(this.storageKey, JSON.stringify(sanitized));
        return sanitized;
    },
    reset() {
        localStorage.removeItem(this.storageKey);
    },
    sanitize(wordsArray) {
        const seen = new Set();
        const output = [];
        for (const w of wordsArray) {
            if (typeof w !== 'string') continue;
            const upper = w.replace(/[^a-zA-Z]/g, '').toUpperCase();
            if (upper.length >= 2 && upper.length <= 16 && !seen.has(upper)) {
                seen.add(upper);
                output.push(upper);
            }
        }
        return output.slice(0, 500);
    }
};

// ===================================
// ===== Speech recognition core (gameVoice) =====
// ===================================
const gameVoice = {
    recognition: null,
    isSupported: ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    isListening: false,
    feedbackDisplay: null,
    feedbackTimeout: null,
    charMap: { 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z', 'AY': 'A', 'BEE': 'B', 'CEE': 'C', 'DEE': 'D', 'EE': 'E', 'EFF': 'F', 'GEE': 'G', 'AITCH': 'H', 'EYE': 'I', 'AYE': 'I', 'JAY': 'J', 'KAY': 'K', 'EL': 'L', 'EM': 'M', 'EN': 'N', 'OH': 'O', 'PEA': 'P', 'QUEUE': 'Q', 'CUE': 'Q', 'ARE': 'R', 'ARR': 'R', 'ESS': 'S', 'TEE': 'T', 'YOU': 'U', 'VEE': 'V', 'WHY': 'Y', 'EX': 'X', 'ZEE': 'Z', 'ZED': 'Z', 'SEA': 'C', 'SEE': 'C' },
    init(callback) {
        if (!this.isSupported) return;
        this.feedbackDisplay = document.getElementById('voice-feedback-display');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = false;

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.trim().toUpperCase();
            this.showFeedback(transcript);
            // attempt char-map conversion or fallback to first char
            const recognizedChar = this.charMap[transcript] || transcript.charAt(0);
            if (recognizedChar) {
                callback(recognizedChar);
            }
        };
        this.recognition.onend = () => {
            if (this.isListening) { // 如果是意外停止，就重新啟動
                this.recognition.start();
            }
        };
    },
    showFeedback(text) {
        if (!this.feedbackDisplay) return;
        clearTimeout(this.feedbackTimeout);
        this.feedbackDisplay.textContent = text;
        this.feedbackDisplay.classList.add('show');
        this.feedbackTimeout = setTimeout(() => {
            this.feedbackDisplay.classList.remove('show');
        }, 2000);
    },
    start() {
        if (this.isSupported && this.recognition && !this.isListening) {
            this.isListening = true;
            this.recognition.start();
        }
    },
    stop() {
        if (this.isSupported && this.recognition && this.isListening) {
            this.isListening = false;
            this.recognition.stop();
        }
    },
    toggle(micButton, callback) {
        if (!this.isSupported) {
            alert('您的瀏覽器不支援語音辨識功能，建議使用 Chrome 或 Edge。');
            return;
        }
        if (!this.recognition) this.init(callback);

        if (this.isListening) {
            this.stop();
            micButton.classList.remove('listening');
            micButton.innerHTML = '🎤';
        } else {
            this.start();
            micButton.classList.add('listening');
            micButton.innerHTML = '🎙️';
        }
    }
};

// ===================================
// ===== Game 1: Static practice (gameStatic) =====
// ===================================
const gameStatic = {
    micButton: document.getElementById('gs-mic-button'),
    display: document.getElementById('gs-char-display'), message: document.getElementById('gs-message'), alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', currentWord: '', typedIndex: 0, isGameRunning: false, isAnimating: false, keydownHandler: null,
    start() { this.isGameRunning = true; this.display.innerHTML = '<span class="pulse-animation">準備好了嗎？</span>'; this.message.textContent = '請按任意鍵開始'; document.addEventListener('keydown', this.handleInitialKey, { once: true }); this.micButton.onclick = () => gameVoice.toggle(this.micButton, (char) => this.handleInput(char)); this.micButton.classList.remove('listening'); this.micButton.innerHTML = '🎤'; if (!gameVoice.isSupported) this.micButton.style.display = 'none'; else this.micButton.style.display = 'block'; },
    init() { this.getNextWord(); if (!this.keydownHandler) { this.keydownHandler = (e) => this.handleInput(e.key.toUpperCase()); document.addEventListener('keydown', this.keydownHandler); } },
    end() { this.isGameRunning = false; gameVoice.stop(); document.removeEventListener('keydown', this.handleInitialKey); if (this.keydownHandler) { document.removeEventListener('keydown', this.keydownHandler); this.keydownHandler = null; } },
    handleInitialKey: (e) => { gameStatic.init(); },
    getNextWord() { const words = vocabulary.getWords(); if (!words || words.length === 0) { this.currentWord = ''; this.display.innerHTML = '<span class="pulse-animation">目前沒有可用詞彙，請到「管理詞彙」新增。</span>'; this.message.textContent = ''; return; } this.typedIndex = 0; let newWord; do { newWord = words[Math.floor(Math.random() * words.length)]; } while (newWord === this.currentWord && words.length > 1); this.currentWord = newWord; this.display.innerHTML = ''; this.currentWord.split('')[0] && this.currentWord.split('').forEach(char => { const charSpan = document.createElement('span'); charSpan.textContent = char; this.display.appendChild(charSpan); }); this.message.textContent = '換你囉！'; },
    handleInput(inputChar) { if (!this.isGameRunning || this.isAnimating || !this.currentWord || inputChar.length !== 1) return; const expectedKey = this.currentWord[this.typedIndex]; if (inputChar === expectedKey) { const targetSpan = this.display.children[this.typedIndex]; this.isAnimating = true; targetSpan.classList.add('gs-correct', 'gs-shake-correct-animation'); this.typedIndex++; setTimeout(() => { targetSpan.classList.remove('gs-shake-correct-animation'); this.isAnimating = false; if (this.typedIndex === this.currentWord.length) { this.message.textContent = '太棒了！完成！'; setTimeout(() => this.getNextWord(), 1000); } }, 600); } else { const targetSpan = this.display.children[this.typedIndex]; this.isAnimating = true; targetSpan.classList.add('gs-shake-incorrect-animation'); this.message.textContent = '不對喔，是這個字母！'; setTimeout(() => { targetSpan.classList.remove('gs-shake-incorrect-animation'); this.isAnimating = false; }, 500); } }
};

// ===================================
// ===== 遊戲二：打字衝刺 (gameDash) =====
// ===================================
const gameDash = {
    micButton: document.getElementById('gd-mic-button'),
    gameArea: document.getElementById('gd-game-area'), scoreDisplay: document.getElementById('gd-score-display'), livesDisplay: document.getElementById('gd-lives-display'), levelDisplay: document.getElementById('gd-level-display'), countdownDisplay: document.getElementById('gd-countdown-display'), gameOverScreen: document.getElementById('gd-game-over-screen'), restartButton: document.getElementById('gd-restart-button'), finalScoreDisplay: document.getElementById('gd-final-score'), ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', INITIAL_LIVES: 5, HITS_PER_LEVEL: 10, LEVELS: [ { speed: 0.8, spawn: 1800 }, { speed: 1.0, spawn: 1600 }, { speed: 1.2, spawn: 1400 }, { speed: 1.5, spawn: 1200 }, { speed: 1.8, spawn: 1000 }, { speed: 2.1, spawn: 900 }, { speed: 2.4, spawn: 800 }, { speed: 2.7, spawn: 700 }, { speed: 3.0, spawn: 600 }, { speed: 3.4, spawn: 500 }, ], score: 0, lives: 0, lettersOnScreen: [], gameLoopId: null, lastSpawnTime: 0, isGameRunning: false, currentLevel: 1, hitsInLevel: 0, fallSpeed: 1, spawnRate: 1500, keydownHandler: null,
    start() { this.isGameRunning = true; this.score = 0; this.lives = this.INITIAL_LIVES; this.currentLevel = 1; this.hitsInLevel = 0; this.lettersOnScreen.forEach(letter => letter.element.remove()); this.lettersOnScreen = []; this.updateLevelSettings(); this.updateUI(); this.gameOverScreen.classList.add('hidden'); if (!this.keydownHandler) { this.keydownHandler = (e) => this.handleInput(e.key.toUpperCase()); document.addEventListener('keydown', this.keydownHandler); } this.restartButton.onclick = () => this.start(); this.micButton.onclick = () => gameVoice.toggle(this.micButton, (char) => this.handleInput(char)); this.micButton.classList.remove('listening'); this.micButton.innerHTML = '🎤'; if (!gameVoice.isSupported) this.micButton.style.display = 'none'; else this.micButton.style.display = 'block'; this.gameLoop(0); },
    end() { this.isGameRunning = false; gameVoice.stop(); if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId); if (this.keydownHandler) { document.removeEventListener('keydown', this.keydownHandler); this.keydownHandler = null; } },
    updateLevelSettings() { const levelConfig = this.LEVELS[this.currentLevel - 1]; this.fallSpeed = levelConfig.speed; this.spawnRate = levelConfig.spawn; },
    updateUI() { this.scoreDisplay.textContent = this.score; this.livesDisplay.textContent = '❤️'.repeat(this.lives); this.levelDisplay.textContent = this.currentLevel; this.countdownDisplay.textContent = this.HITS_PER_LEVEL - this.hitsInLevel; },
    levelUp() { if (this.currentLevel < this.LEVELS.length) { this.currentLevel++; } this.hitsInLevel = 0; this.updateLevelSettings(); },
    gameLoop(timestamp) { if (!this.isGameRunning) return; if (timestamp - this.lastSpawnTime > this.spawnRate) { this.lastSpawnTime = timestamp; this.spawnLetter(); } this.moveLetters(); this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this)); },
    spawnLetter() { const char = this.ALPHABET[Math.floor(Math.random() * this.ALPHABET.length)]; const letterElement = document.createElement('div'); letterElement.className = 'letter'; letterElement.textContent = char; const xPosition = Math.random() * (this.gameArea.clientWidth - 45); letterElement.style.left = `${xPosition}px`; letterElement.style.top = `-45px`; this.gameArea.appendChild(letterElement); this.lettersOnScreen.push({ element: letterElement, character: char, y: -45 }); },
    moveLetters() { const gameAreaHeight = this.gameArea.clientHeight; for (let i = this.lettersOnScreen.length - 1; i >= 0; i--) { const letter = this.lettersOnScreen[i]; letter.y += this.fallSpeed; letter.element.style.top = `${letter.y}px`; if (letter.y > gameAreaHeight) { letter.element.remove(); this.lettersOnScreen.splice(i, 1); this.loseLife(); } } },
    handleInput(inputChar) { if (!this.isGameRunning || inputChar.length !== 1) return; for (let i = this.lettersOnScreen.length - 1; i >= 0; i--) { if (this.lettersOnScreen[i].character === inputChar) { const letter = this.lettersOnScreen[i]; this.score++; this.hitsInLevel++; if(this.hitsInLevel >= this.HITS_PER_LEVEL) { this.levelUp(); } letter.element.classList.add('popped'); setTimeout(() => letter.element.remove(), 200); this.lettersOnScreen.splice(i, 1); this.updateUI(); return; } } },
    loseLife() { this.lives--; gameWrapper.classList.add('screen-shake-animation'); setTimeout(() => { gameWrapper.classList.remove('screen-shake-animation'); }, 400); if (this.lives <= 0) { this.end(); this.finalScoreDisplay.textContent = this.score; this.gameOverScreen.classList.remove('hidden'); } this.updateUI(); },
};

// ===================================
// ===== 遊戲三：打怪物 (gameMonster) =====
// ===================================
const gameMonster = {
    micButton: document.getElementById('gm-mic-button'),
    gameArea: document.getElementById('gm-game-area'), levelDisplay: document.getElementById('gm-level-display'), defeatedDisplay: document.getElementById('gm-defeated-display'), gameOverScreen: document.getElementById('gm-game-over-screen'), restartButton: document.getElementById('gm-restart-button'), finalLevelDisplay: document.getElementById('gm-final-level'),
    ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), MONSTERS_PER_BOSS: 10, SPAWN_EDGE_BUFFER: 80, keydownHandler: null,
    LEVELS: [ { count: 1, interval: 3000, growth: 0.05 }, { count: 2, interval: 2800, growth: 0.06 }, { count: 2, interval: 2500, growth: 0.07 }, { count: 3, interval: 2300, growth: 0.08 }, { count: 3, interval: 2000, growth: 0.10 }, { count: 4, interval: 1800, growth: 0.12 }, { count: 4, interval: 1600, growth: 0.14 }, { count: 5, interval: 1500, growth: 0.16 }, { count: 5, interval: 1400, growth: 0.18 }, { count: 6, interval: 1300, growth: 0.20 }, ],
    DESIGNS: {
        ghost:   { emoji: '👻', size: 60 }, pumpkin: { emoji: '🎃', size: 60 }, lion:    { emoji: '🦁', size: 60 },
        tiger:   { emoji: '🐯', size: 60 }, alien:   { emoji: '👾', size: 60 }, robot:   { emoji: '🤖', size: 60 }
    },
    BOSS_DESIGNS: [
        {
            name: '火焰魔龍', containerSize: { width: 350, height: 280 }, growth: 0.06,
            parts: [
                { id: 'head', emoji: '🐲', size: 120, position: { top: '0px', left: '115px' }, isMain: true },
                { id: 'l_wing', emoji: '🐉', size: 80, position: { top: '50px', left: '45px' } },
                { id: 'r_wing', emoji: '🐉', size: 80, position: { top: '50px', left: '225px' } },
                { id: 'tail', emoji: '🔥', size: 60, position: { top: '200px', left: '145px' }, isWeakPoint: true, growthFactor: 1.5 }
            ]
        },
        {
            name: '巨大機器人', containerSize: { width: 300, height: 300 }, growth: 0.08,
            parts: [
                { id: 'head', emoji: '🤖', size: 100, position: { top: '0px', left: '100px' }, isMain: true },
                { id: 'l_arm', emoji: '🦾', size: 120, position: { top: '80px', left: '-20px' }, growthFactor: 1.2, isWeakPoint: true },
                { id: 'r_arm', emoji: '🦾', size: 120, position: { top: '80px', left: '200px' }, growthFactor: 1.2 },
                { id: 'l_leg', emoji: '🦿', size: 100, position: { top: '180px', left: '60px' } },
                { id: 'r_leg', emoji: '🦿', size: 100, position: { top: '180px', left: '140px' } }
            ]
        },
        {
            name: '宇宙章魚', containerSize: { width: 320, height: 320 }, growth: 0.07,
            parts: [
                { id: 'body', emoji: '🐙', size: 130, position: { top: '80px', left: '95px' }, isMain: true },
                { id: 't1', emoji: '🐍', size: 70, position: { top: '20px', left: '50px' }, cssClass: 'tentacle' },
                { id: 't2', emoji: '🐍', size: 70, position: { top: '20px', left: '200px' }, cssClass: 'tentacle', isWeakPoint: true },
                { id: 't3', emoji: '🐍', size: 70, position: { top: '180px', left: '50px' }, cssClass: 'tentacle' },
                { id: 't4', emoji: '🐍', size: 70, position: { top: '180px', left: '200px' }, cssClass: 'tentacle' },
            ]
        }
    ],
    isGameRunning: false, gameLoopId: null, lastSpawnTime: 0, currentLevel: 1, monstersDefeated: 0, monstersOnScreen: [], activeChars: [], isBossActive: false,
    start() { this.isGameRunning = true; this.currentLevel = 1; this.monstersDefeated = 0; this.isBossActive = false; this.gameArea.innerHTML = ''; this.monstersOnScreen = []; this.activeChars = []; this.updateUI(); this.gameOverScreen.classList.add('hidden'); if (!this.keydownHandler) { this.keydownHandler = (e) => this.handleInput(e.key.toUpperCase()); document.addEventListener('keydown', this.keydownHandler); } this.restartButton.onclick = () => this.start(); this.micButton.onclick = () => gameVoice.toggle(this.micButton, (char) => this.handleInput(char)); this.micButton.classList.remove('listening'); this.micButton.innerHTML = '🎤'; if (!gameVoice.isSupported) this.micButton.style.display = 'none'; else this.micButton.style.display = 'block'; this.gameLoop(0); },
    end() { this.isGameRunning = false; gameVoice.stop(); if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId); if (this.keydownHandler) { document.removeEventListener('keydown', this.keydownHandler); this.keydownHandler = null; } },
    updateUI() { this.levelDisplay.textContent = this.currentLevel; this.defeatedDisplay.textContent = this.monstersDefeated; },
    gameLoop(timestamp) {
        if (!this.isGameRunning) return;
        const config = this.LEVELS[this.currentLevel - 1];
        if (!this.isBossActive && this.monstersOnScreen.length < config.count && timestamp - this.lastSpawnTime > config.interval) {
            this.lastSpawnTime = timestamp;
            this.spawnMonster();
        }
        this.monstersOnScreen.forEach(monster => {
            if (monster.isDefeated) return;
            let mainElementForCollision = monster.el;
            if (monster.isBoss) {
                const boss = monster;
                const bossGrowth = boss.design.growth;
                mainElementForCollision = boss.mainPart.el;
                boss.parts.forEach(part => {
                    if(part.isDefeated) return;
                    const partGrowth = bossGrowth * (part.info.growthFactor || 1);
                    part.size += partGrowth;
                    part.el.style.width = `${part.size}px`;
                    part.el.style.height = `${part.size}px`;
                    part.el.querySelector('.monster-graphic').style.fontSize = `${part.size * 0.8}px`;
                });
            } else {
                monster.size += config.growth;
                monster.el.style.width = `${monster.size}px`;
                monster.el.style.height = `${monster.size}px`;
                monster.el.querySelector('.monster-graphic').style.fontSize = `${monster.size * 0.8}px`;
            }
            const rect = mainElementForCollision.getBoundingClientRect();
            const parentRect = this.gameArea.getBoundingClientRect();
            if (rect.left < parentRect.left || rect.right > parentRect.right || rect.top < parentRect.top || rect.bottom > parentRect.bottom) {
                this.gameOver();
            }
        });
        this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
    },
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
        const bossDesign = this.BOSS_DESIGNS[Math.floor(Math.random() * this.BOSS_DESIGNS.length)];
        const bossContainer = document.createElement('div');
        bossContainer.className = 'monster';
        bossContainer.style.width = `${bossDesign.containerSize.width}px`;
        bossContainer.style.height = `${bossDesign.containerSize.height}px`;
        const bossParts = [];
        let mainPart = null;
        let weakPoint = null;
        bossDesign.parts.forEach(partInfo => {
            let char;
            do { char = this.ALPHABET[Math.floor(Math.random() * this.ALPHABET.length)]; } while (this.activeChars.includes(char));
            this.activeChars.push(char);
            const partEl = document.createElement('div');
            partEl.className = 'boss-part';
            if (partInfo.cssClass) partEl.classList.add(partInfo.cssClass);
            if (partInfo.isWeakPoint) partEl.classList.add('weak-point');
            partEl.innerHTML = `<div class="monster-graphic" style="font-size: ${partInfo.size * 0.8}px">${partInfo.emoji}</div><div class="monster-char">${char}</div>`;
            partEl.style.top = partInfo.position.top;
            partEl.style.left = partInfo.position.left;
            partEl.style.width = `${partInfo.size}px`;
            partEl.style.height = `${partInfo.size}px`;
            bossContainer.appendChild(partEl);
            const partObject = { el: partEl, char: char, info: partInfo, size: partInfo.size, isDefeated: false };
            bossParts.push(partObject);
            if (partInfo.isMain) mainPart = partObject;
            if (partInfo.isWeakPoint) weakPoint = partObject;
        });
        const size = bossDesign.containerSize.width;
        bossContainer.style.left = `${(this.gameArea.clientWidth - size) / 2}px`;
        bossContainer.style.top = `${(this.gameArea.clientHeight - bossDesign.containerSize.height) / 2}px`;
        const boss = { el: bossContainer, isBoss: true, parts: bossParts, mainPart: mainPart, weakPoint: weakPoint, design: bossDesign, size: size, isDefeated: false };
        this.monstersOnScreen.push(boss);
        this.gameArea.appendChild(bossContainer);
    },
    handleInput(inputChar) {
        if (!this.isGameRunning || inputChar.length !== 1) return;
        if (this.isBossActive) {
            const boss = this.monstersOnScreen[0];
            if (!boss || boss.isDefeated) return;
            const partToHit = boss.parts.find(p => p.char === inputChar && !p.isDefeated);
            if (partToHit) {
                partToHit.el.classList.add('monster-hit');
                partToHit.isDefeated = true;
                if (partToHit.info.isMain) {
                    boss.isDefeated = true;
                    boss.el.classList.add('monster-explode');
                    setTimeout(() => {
                        this.isBossActive = false;
                        if(this.currentLevel < this.LEVELS.length) this.currentLevel++;
                        this.monstersDefeated++;
                        this.updateUI();
                        this.gameArea.innerHTML = '';
                        this.monstersOnScreen = [];
                    }, 800);
                } else {
                    setTimeout(() => {
                        partToHit.el.classList.add('monster-explode');
                    }, 300);
                    const weakPointIsActive = boss.weakPoint && !boss.weakPoint.isDefeated;
                    if (weakPointIsActive && !partToHit.info.isWeakPoint) {
                        setTimeout(() => {
                            partToHit.isDefeated = false;
                            partToHit.el.classList.remove('monster-explode', 'monster-hit');
                        }, 3000);
                    }
                }
            }
            return;
        }
        const monsterIndex = this.monstersOnScreen.findIndex(m => m.char === inputChar);
        if (monsterIndex > -1) {
            const monster = this.monstersOnScreen[monsterIndex];
            monster.isDefeated = true;
            monster.el.classList.add('monster-hit');
            setTimeout(() => {
                monster.el.classList.add('monster-explode');
                setTimeout(() => monster.el.remove(), 300);
            }, 300);
            this.monstersOnScreen.splice(monsterIndex, 1);
            this.activeChars.splice(this.activeChars.indexOf(monster.char), 1);
            this.monstersDefeated++;
            this.updateUI();
            if (this.monstersDefeated > 0 && this.monstersDefeated % this.MONSTERS_PER_BOSS === 0) {
                this.spawnBoss();
            }
        }
    },
    gameOver() { if (!this.isGameRunning) return; this.end(); gameWrapper.classList.add('screen-shake-animation'); setTimeout(() => gameWrapper.classList.remove('screen-shake-animation'), 400); this.finalLevelDisplay.textContent = this.currentLevel; this.gameOverScreen.classList.remove('hidden'); }
};

const games = {
    static: gameStatic,
    dash: gameDash,
    monster: gameMonster
};

// ===================================
// ===== Vocabulary modal wiring =====
// ===================================
const vocabModal = document.getElementById('vocab-modal');
const openVocabBtn = document.getElementById('open-vocab-btn');
const vocabTextarea = document.getElementById('vocab-textarea');
const vocabStats = document.getElementById('vocab-stats');
const vocabSave = document.getElementById('vocab-save');
const vocabCancel = document.getElementById('vocab-cancel');
const vocabReset = document.getElementById('vocab-reset');

function openVocabModal() {
    const words = vocabulary.getWords();
    vocabTextarea.value = words.join('\n');
    updateVocabStats(words);
    vocabModal.classList.remove('hidden');
}

function closeVocabModal() {
    vocabModal.classList.add('hidden');
}

function updateVocabStats(wordsArr) {
    vocabStats.textContent = `目前詞彙數：${wordsArr.length}`;
}

openVocabBtn.addEventListener('click', openVocabModal);
vocabCancel.addEventListener('click', closeVocabModal);
vocabReset.addEventListener('click', () => {
    vocabulary.reset();
    const words = vocabulary.getWords();
    vocabTextarea.value = words.join('\n');
    updateVocabStats(words);
});
vocabSave.addEventListener('click', () => {
    const lines = vocabTextarea.value.split(/\r?\n/);
    const saved = vocabulary.setWords(lines);
    updateVocabStats(saved);
    closeVocabModal();
    if (activeGameKey === 'static' && gameStatic.isGameRunning) {
        // Refresh next word pool without disrupting current animation
        setTimeout(() => gameStatic.getNextWord(), 200);
    }
});
