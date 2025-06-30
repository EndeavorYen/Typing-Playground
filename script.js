// --- 全域元素 ---
const mainMenu = document.getElementById('main-menu');
const gameStaticContainer = document.getElementById('game-static');
const gameDashContainer = document.getElementById('game-dash');

// --- 事件監聽 ---
document.getElementById('btn-game-static').addEventListener('click', () => showGame('static'));
document.getElementById('btn-game-dash').addEventListener('click', () => showGame('dash'));

document.querySelectorAll('.back-button').forEach(btn => {
    btn.addEventListener('click', showMenu);
});

let activeGame = null;

// --- 畫面切換邏輯 ---
function showMenu() {
    if (activeGame === 'dash') {
        gameDash.end(); // 確保停止遊戲循環
    }
    if (activeGame === 'static') {
        gameStatic.end();
    }
    activeGame = null;
    
    mainMenu.classList.remove('hidden');
    gameStaticContainer.classList.add('hidden');
    gameDashContainer.classList.add('hidden');
}

function showGame(gameName) {
    mainMenu.classList.add('hidden');
    activeGame = gameName;
    if (gameName === 'static') {
        gameStaticContainer.classList.remove('hidden');
        gameStatic.start();
    } else if (gameName === 'dash') {
        gameDashContainer.classList.remove('hidden');
        gameDash.start();
    }
}

// ===================================
// ===== 遊戲一：靜態練習 (gameStatic) =====
// ===================================
const gameStatic = {
    // 元素
    display: document.getElementById('gs-char-display'),
    message: document.getElementById('gs-message'),
    // 設定
    wordSet: ['APPLE', 'SKY', 'DREAM', 'CODE', 'HAPPY', 'SUN', 'MOON'],
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    // 狀態
    currentWord: '',
    typedIndex: 0,
    isGameActive: false,
    isAnimating: false,

    start() {
        this.isGameActive = true;
        // 使用新的動畫樣式
        this.display.innerHTML = '<span class="pulse-animation">準備好了嗎？</span>';
        this.message.textContent = '請按任意鍵開始';
        document.addEventListener('keydown', this.handleInitialKey, { once: true });
    },

    init() {
        this.getNextWord();
        document.addEventListener('keydown', this.handleKeyPress);
    },
    
    end() {
        this.isGameActive = false;
        document.removeEventListener('keydown', this.handleKeyPress);
        document.removeEventListener('keydown', this.handleInitialKey);
    },

    handleInitialKey: (e) => {
        // 'this' will be wrong here, so we access gameStatic directly
        gameStatic.init();
    },

    getNextWord() {
        this.typedIndex = 0;
        let newWord;
        do { newWord = this.wordSet[Math.floor(Math.random() * this.wordSet.length)]; } while (newWord === this.currentWord);
        this.currentWord = newWord;
        
        this.display.innerHTML = '';
        this.currentWord.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.textContent = char;
            this.display.appendChild(charSpan);
        });
        this.message.textContent = '換你囉！';
    },

    handleKeyPress(event) {
        const self = gameStatic; // Bind 'this' correctly
        if (!self.isGameActive || self.isAnimating || !self.currentWord) return;
        const keyPressed = event.key.toUpperCase();
        if (keyPressed.length !== 1 || !self.alphabet.includes(keyPressed)) return;

        const expectedKey = self.currentWord[self.typedIndex];
        const targetSpan = self.display.children[self.typedIndex];
        self.isAnimating = true;

        if (keyPressed === expectedKey) {
            targetSpan.classList.add('gs-correct', 'gs-shake-correct-animation');
            self.typedIndex++;
            setTimeout(() => {
                targetSpan.classList.remove('gs-shake-correct-animation');
                self.isAnimating = false;
                if (self.typedIndex === self.currentWord.length) {
                    self.message.textContent = '太棒了！完成！';
                    setTimeout(() => self.getNextWord(), 1000); 
                }
            }, 600);
        } else {
            targetSpan.classList.add('gs-shake-incorrect-animation');
            self.message.textContent = '不對喔，是這個字母！';
            setTimeout(() => {
                targetSpan.classList.remove('gs-shake-incorrect-animation');
                self.isAnimating = false;
            }, 500);
        }
    }
};
// We need to bind the `this` context for event handlers
gameStatic.handleKeyPress = gameStatic.handleKeyPress.bind(gameStatic);

// ===================================
// ===== 遊戲二：打字衝刺 (gameDash) =====
// ===================================
const gameDash = {
    // 元素
    gameArea: document.getElementById('gd-game-area'),
    scoreDisplay: document.getElementById('gd-score-display'),
    livesDisplay: document.getElementById('gd-lives-display'),
    gameOverScreen: document.getElementById('gd-game-over-screen'),
    restartButton: document.getElementById('gd-restart-button'),
    finalScoreDisplay: document.getElementById('gd-final-score'),
    // 設定
    ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    INITIAL_LIVES: 5,
    INITIAL_SPAWN_RATE: 1500,
    INITIAL_SPEED: 1,
    // 狀態
    score: 0, lives: 0, lettersOnScreen: [], gameLoopId: null,
    lastSpawnTime: 0, spawnRate: 1500, fallSpeed: 1, isGameRunning: false,

    start() {
        this.isGameRunning = true;
        this.score = 0;
        this.lives = this.INITIAL_LIVES;
        this.spawnRate = this.INITIAL_SPAWN_RATE;
        this.fallSpeed = this.INITIAL_SPEED;
        this.lettersOnScreen.forEach(letter => letter.element.remove());
        this.lettersOnScreen = [];
        
        this.scoreDisplay.textContent = this.score;
        this.updateLivesDisplay();
        this.gameOverScreen.classList.add('hidden');
        
        document.addEventListener('keydown', this.handleKeyPress);
        this.restartButton.onclick = () => this.start();
        this.gameLoop(0);
    },

    end() {
        this.isGameRunning = false;
        cancelAnimationFrame(this.gameLoopId);
        document.removeEventListener('keydown', this.handleKeyPress);
    },

    gameLoop(timestamp) {
        if (!this.isGameRunning) return;
        if (timestamp - this.lastSpawnTime > this.spawnRate) {
            this.lastSpawnTime = timestamp;
            this.spawnLetter();
        }
        this.moveLetters();
        this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
    },

    spawnLetter() {
        const char = this.ALPHABET[Math.floor(Math.random() * this.ALPHABET.length)];
        const letterElement = document.createElement('div');
        letterElement.className = 'letter';
        letterElement.textContent = char;
        const xPosition = Math.random() * (this.gameArea.clientWidth - 45);
        letterElement.style.left = `${xPosition}px`;
        letterElement.style.top = `-45px`;
        this.gameArea.appendChild(letterElement);
        this.lettersOnScreen.push({ element: letterElement, character: char, y: -45 });
    },

    moveLetters() {
        const gameAreaHeight = this.gameArea.clientHeight;
        for (let i = this.lettersOnScreen.length - 1; i >= 0; i--) {
            const letter = this.lettersOnScreen[i];
            letter.y += this.fallSpeed;
            letter.element.style.top = `${letter.y}px`;
            if (letter.y > gameAreaHeight) {
                letter.element.remove();
                this.lettersOnScreen.splice(i, 1);
                this.loseLife();
            }
        }
    },

    handleKeyPress(event) {
        const self = gameDash;
        if (!self.isGameRunning) return;
        const keyPressed = event.key.toUpperCase();
        for (let i = self.lettersOnScreen.length - 1; i >= 0; i--) {
            if (self.lettersOnScreen[i].character === keyPressed) {
                const letter = self.lettersOnScreen[i];
                self.score++;
                self.scoreDisplay.textContent = self.score;
                if (self.score % 5 === 0) {
                    self.fallSpeed += 0.2;
                    self.spawnRate = Math.max(300, self.spawnRate - 100);
                }
                letter.element.classList.add('popped');
                setTimeout(() => letter.element.remove(), 200);
                self.lettersOnScreen.splice(i, 1);
                return;
            }
        }
    },

    loseLife() {
        this.lives--;
        this.updateLivesDisplay();
        if (this.lives <= 0) {
            this.end();
            this.finalScoreDisplay.textContent = this.score;
            this.gameOverScreen.classList.remove('hidden');
        }
    },

    updateLivesDisplay() {
        this.livesDisplay.textContent = '❤️'.repeat(this.lives);
    }
};
// Bind 'this' context for event handlers
gameDash.handleKeyPress = gameDash.handleKeyPress.bind(gameDash);