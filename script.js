class WaterDropletGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.livesDisplay = document.getElementById('lives');
        this.scoreDisplay = document.getElementById('score');
        this.highScoreDisplay = document.getElementById('highScore');
        this.timerDisplay = document.getElementById('timer');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.exitBtn = document.getElementById('exitBtn');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.finalScoreDisplay = document.getElementById('finalScore');
        this.modalHighScoreDisplay = document.getElementById('modalHighScore');

        this.lives = 3;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameActive = false;
        this.gameStarted = false;
        this.gameTime = 0;
        this.dropletSpawnRate = 1000; // milliseconds
        this.dirtyDropletChance = 0.3; // 30% chance for dirty droplet
        this.spawnInterval = null;
        this.timerInterval = null;
        this.hasCelebratedHighScore = false;

        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGamePlay());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.exitBtn.addEventListener('click', () => this.exitGame());
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
    }

    startGamePlay() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.gameActive = true;
            this.startBtn.style.display = 'none';
            this.spawnDroplets();
        }
    }

    spawnDroplets() {
        this.timerInterval = setInterval(() => {
            if (this.gameActive) {
                this.gameTime++;
                this.updateTimer();
                this.increaseDifficulty();
            }
        }, 1000);

        this.spawnInterval = setInterval(() => {
            if (this.gameActive) {
                this.spawnDroplet();
            }
        }, this.dropletSpawnRate);
    }

    increaseDifficulty() {
        // Every 10 seconds, increase difficulty
        if (this.gameTime % 10 === 0) {
            // Increase spawn rate (decrease interval)
            if (this.dropletSpawnRate > 300) {
                this.dropletSpawnRate -= 50;
                clearInterval(this.spawnInterval);
                this.spawnInterval = setInterval(() => {
                    if (this.gameActive) {
                        this.spawnDroplet();
                    }
                }, this.dropletSpawnRate);
            }

            // Increase dirty droplet chance
            if (this.dirtyDropletChance < 0.7) {
                this.dirtyDropletChance += 0.05;
            }
        }
    }

    updateTimer() {
        this.timerDisplay.textContent = this.gameTime;
    }

    spawnDroplet() {
        const droplet = document.createElement('div');
        droplet.classList.add('droplet');

        // Chance for dirty droplet increases over time
        const isClean = Math.random() > this.dirtyDropletChance;
        droplet.classList.add(isClean ? 'clean' : 'dirty');

        // Random position in game area
        const maxX = this.gameArea.clientWidth - 65;
        const maxY = this.gameArea.clientHeight - 75;
        const randomX = Math.floor(Math.random() * Math.max(0, maxX));
        const randomY = Math.floor(Math.random() * Math.max(0, maxY));

        droplet.style.left = randomX + 'px';
        droplet.style.top = randomY + 'px';

        // Remove droplet after 4 seconds if not clicked
        const timeout = setTimeout(() => {
            if (droplet.parentNode) {
                droplet.remove();
            }
        }, 4000);

        droplet.addEventListener('click', (e) => {
            e.stopPropagation();
            clearTimeout(timeout);
            
            if (isClean) {
                this.handleCleanClick(droplet);
            } else {
                this.handleDirtyClick(droplet);
            }
        });

        this.gameArea.appendChild(droplet);
    }

    handleCleanClick(droplet) {
        // Add points on clean droplet click
        this.score += 10;
        this.showBonusEffect(droplet, '+10');
        droplet.remove();
        this.updateDisplay();
    }

    handleDirtyClick(droplet) {
        // Lose a life on dirty droplet click
        this.lives--;
        this.showPenaltyEffect(droplet, '-1');
        droplet.remove();
        this.updateDisplay();

        if (this.lives <= 0) {
            this.endGame();
        }
    }

    showBonusEffect(element, text) {
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = element.style.left;
        effect.style.top = element.style.top;
        effect.style.color = '#00AA00';
        effect.style.fontSize = '1.8em';
        effect.style.fontWeight = 'bold';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '999';
        effect.textContent = text;

        this.gameArea.appendChild(effect);

        // Animate effect floating up
        let opacity = 1;
        let top = parseInt(effect.style.top);
        const animationInterval = setInterval(() => {
            top -= 2;
            opacity -= 0.05;
            effect.style.top = top + 'px';
            effect.style.opacity = opacity;

            if (opacity <= 0) {
                effect.remove();
                clearInterval(animationInterval);
            }
        }, 30);
    }

    showPenaltyEffect(element, text) {
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = element.style.left;
        effect.style.top = element.style.top;
        effect.style.color = '#ff4444';
        effect.style.fontSize = '1.8em';
        effect.style.fontWeight = 'bold';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '999';
        effect.textContent = text;

        this.gameArea.appendChild(effect);

        // Animate effect floating up
        let opacity = 1;
        let top = parseInt(effect.style.top);
        const animationInterval = setInterval(() => {
            top -= 2;
            opacity -= 0.05;
            effect.style.top = top + 'px';
            effect.style.opacity = opacity;

            if (opacity <= 0) {
                effect.remove();
                clearInterval(animationInterval);
            }
        }, 30);
    }

    updateDisplay() {
        this.livesDisplay.textContent = this.lives;
        this.scoreDisplay.textContent = this.score;
        
        // Update high score if current score is higher
        if (this.score > this.highScore) {
            if (!this.hasCelebratedHighScore) {
                this.showHighScoreCelebration();
                this.hasCelebratedHighScore = true;
            }
            this.highScore = this.score;
            this.saveHighScore();
        }
        this.highScoreDisplay.textContent = this.highScore;

        // Change color of lives based on remaining lives
        if (this.lives <= 1) {
            this.livesDisplay.style.color = '#ff4444';
        } else if (this.lives <= 2) {
            this.livesDisplay.style.color = '#ff8800';
        } else {
            this.livesDisplay.style.color = '#00AA00';
        }
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.spawnInterval);
        clearInterval(this.timerInterval);

        // Show game over modal
        this.finalScoreDisplay.textContent = this.score;
        this.modalHighScoreDisplay.textContent = this.highScore;
        this.gameOverModal.classList.add('active');

        // Remove all droplets
        document.querySelectorAll('.droplet').forEach(d => d.remove());
    }

    resetGame() {
        this.lives = 3;
        this.score = 0;
        this.gameTime = 0;
        this.gameActive = false;
        this.gameStarted = false;
        this.dropletSpawnRate = 1000;
        this.dirtyDropletChance = 0.3;
        this.hasCelebratedHighScore = false;
        this.gameOverModal.classList.remove('active');
        this.startBtn.style.display = 'block';
        
        // Clear all droplets
        document.querySelectorAll('.droplet').forEach(d => d.remove());
        
        // Stop timers
        clearInterval(this.spawnInterval);
        clearInterval(this.timerInterval);
        
        this.updateDisplay();
    }

    showHighScoreCelebration() {
        const banner = document.createElement('div');
        banner.className = 'high-score-toast';
        banner.textContent = 'Congrats! New High Score!';
        this.gameArea.appendChild(banner);

        const confettiCount = 16;
        for (let i = 0; i < confettiCount; i++) {
            const piece = document.createElement('span');
            piece.className = 'confetti-piece';
            piece.style.left = `${8 + Math.random() * 84}%`;
            piece.style.animationDelay = `${Math.random() * 0.25}s`;
            piece.style.animationDuration = `${1.1 + Math.random() * 0.5}s`;
            piece.style.backgroundColor = ['#f4c400', '#4facfe', '#00d4ff', '#66bb6a'][Math.floor(Math.random() * 4)];
            this.gameArea.appendChild(piece);

            setTimeout(() => piece.remove(), 1700);
        }

        setTimeout(() => {
            banner.remove();
        }, 1800);
    }

    playAgain() {
        this.resetGame();
    }

    exitGame() {
        // You could redirect or close the window
        window.location.href = 'about:blank';
    }

    saveHighScore() {
        localStorage.setItem('waterGameHighScore', this.highScore);
    }

    loadHighScore() {
        const saved = localStorage.getItem('waterGameHighScore');
        return saved ? parseInt(saved) : 200;
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WaterDropletGame();
});
