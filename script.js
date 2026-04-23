class WaterDropletGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.livesDisplay = document.getElementById('lives');
        this.scoreDisplay = document.getElementById('score');
        this.highScoreDisplay = document.getElementById('highScore');
        this.timerDisplay = document.getElementById('timer');
        this.streakDisplay = document.getElementById('streak');
        this.powerDisplay = document.getElementById('powerStatus');
        this.abilityStormBtn = document.getElementById('abilityStorm');
        this.abilityMagnetBtn = document.getElementById('abilityMagnet');
        this.abilityPurifyBtn = document.getElementById('abilityPurify');
        this.abilityStormCharge = document.getElementById('abilityStormCharge');
        this.abilityMagnetCharge = document.getElementById('abilityMagnetCharge');
        this.abilityPurifyCharge = document.getElementById('abilityPurifyCharge');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.exitBtn = document.getElementById('exitBtn');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.finalScoreDisplay = document.getElementById('finalScore');
        this.modalHighScoreDisplay = document.getElementById('modalHighScore');
        this.difficultySelector = document.getElementById('difficultySelector');
        this.gameContent = document.getElementById('gameContent');

        // Difficulty configurations
        this.difficulties = {
            easy: {
                lives: 3,
                spawnRate: 1200,
                dirtyChance: 0.2,
                difficulty: 'Easy'
            },
            medium: {
                lives: 2,
                spawnRate: 900,
                dirtyChance: 0.3,
                difficulty: 'Medium'
            },
            hard: {
                lives: 1,
                spawnRate: 600,
                dirtyChance: 0.4,
                difficulty: 'Hard'
            }
        };

        this.currentDifficulty = null;
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
        this.cleanStreak = 0;
        this.comboMultiplier = 1;
        this.shieldCharges = 0;
        this.slowMoUntil = 0;
        this.movementStartScore = 90;
        this.variedSpeedStartScore = 1000;
        this.zapSpeedStartScore = 1500;
        this.abilities = {
            storm: { charge: 0, maxCharge: 120, chargePerClean: 6, activeUntil: 0, durationMs: 0 },
            magnet: { charge: 0, maxCharge: 120, chargePerClean: 5, activeUntil: 0, durationMs: 7000 },
            purify: { charge: 0, maxCharge: 120, chargePerClean: 6, activeUntil: 0, durationMs: 6000 }
        };

        this.setupEventListeners();
        this.updateDisplay();
        this.showDifficultySelector();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGamePlay());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.exitBtn.addEventListener('click', () => this.changeDifficulty());
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        
        const changeDiffBtn = document.getElementById('changeDifficultyBtn');
        if (changeDiffBtn) {
            changeDiffBtn.addEventListener('click', () => this.changeDifficulty());
        }
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectDifficulty(e.target.dataset.difficulty));
        });

        if (this.abilityStormBtn) {
            this.abilityStormBtn.addEventListener('click', () => this.useAbility('storm'));
        }
        if (this.abilityMagnetBtn) {
            this.abilityMagnetBtn.addEventListener('click', () => this.useAbility('magnet'));
        }
        if (this.abilityPurifyBtn) {
            this.abilityPurifyBtn.addEventListener('click', () => this.useAbility('purify'));
        }
    }

    showDifficultySelector() {
        this.difficultySelector.style.display = 'block';
        this.gameContent.style.display = 'none';
    }

    selectDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        const config = this.difficulties[difficulty];
        
        // Apply difficulty settings
        this.lives = config.lives;
        this.dropletSpawnRate = config.spawnRate;
        this.dirtyDropletChance = config.dirtyChance;
        
        // Hide difficulty selector and show game
        this.difficultySelector.style.display = 'none';
        this.gameContent.style.display = 'block';
        this.startBtn.style.display = 'block';
        
        this.updateDisplay();
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
                this.updateAbilityState();
                this.updatePowerState();
                this.increaseDifficulty();
            }
        }, 1000);

        this.refreshSpawnInterval();
    }

    refreshSpawnInterval() {
        clearInterval(this.spawnInterval);
        this.spawnInterval = setInterval(() => {
            if (this.gameActive) {
                this.spawnDroplet();
            }
        }, this.getEffectiveSpawnRate());
    }

    getEffectiveSpawnRate() {
        return this.isSlowMotionActive() ? Math.floor(this.dropletSpawnRate * 1.45) : this.dropletSpawnRate;
    }

    getDropletLifetime() {
        return this.isSlowMotionActive() ? 6000 : 4000;
    }

    isSlowMotionActive() {
        return Date.now() < this.slowMoUntil;
    }

    updatePowerState() {
        const wasSlowMotionActive = this.isSlowMotionActive();

        if (this.slowMoUntil !== 0 && !wasSlowMotionActive) {
            this.slowMoUntil = 0;
            this.refreshSpawnInterval();
        }

        this.updateDisplay();
    }

    activateSlowMotion(seconds) {
        this.slowMoUntil = Date.now() + (seconds * 1000);
        this.refreshSpawnInterval();
    }

    updateAbilityState() {
        const now = Date.now();
        Object.values(this.abilities).forEach((ability) => {
            if (ability.activeUntil > 0 && now >= ability.activeUntil) {
                ability.activeUntil = 0;
            }
        });

        this.updateDisplay();
    }

    isAbilityReady(name) {
        return this.abilities[name].charge >= this.abilities[name].maxCharge;
    }

    isAbilityActive(name) {
        return Date.now() < this.abilities[name].activeUntil;
    }

    hasAnyActiveAbility() {
        return Object.keys(this.abilities).some((name) => this.isAbilityActive(name));
    }

    gainAbilityCharge(multiplier) {
        Object.values(this.abilities).forEach((ability) => {
            const gain = Math.ceil(ability.chargePerClean * multiplier);
            ability.charge = Math.min(ability.maxCharge, ability.charge + gain);
        });
    }

    useAbility(name) {
        if (!this.gameActive || !this.isAbilityReady(name)) {
            return;
        }

        // Using one ability resets the full ability bar state.
        Object.values(this.abilities).forEach((ability) => {
            ability.charge = 0;
            ability.activeUntil = 0;
        });

        if (name === 'storm') {
            this.activateStormFlush();
        } else if (name === 'magnet') {
            this.activateAquaMagnet();
        } else if (name === 'purify') {
            this.activatePurityPrism();
        }

        this.updateDisplay();
    }

    activateStormFlush() {
        const dirtyDroplets = this.gameArea.querySelectorAll('.droplet.dirty');
        let cleaned = 0;

        dirtyDroplets.forEach((droplet) => {
            if (droplet.parentNode) {
                this.removeDroplet(droplet);
                cleaned++;
            }
        });

        if (cleaned > 0) {
            this.score += cleaned * 6;
            this.showPowerToast(`Storm Flush! Cleared ${cleaned}`);
        } else {
            this.showPowerToast('Storm Flush! Sky is already clear.');
        }
    }

    activateAquaMagnet() {
        this.abilities.magnet.activeUntil = Date.now() + this.abilities.magnet.durationMs;
        this.autoCollectVisibleCleanDroplets();
        this.showPowerToast('Aqua Magnet online!');
    }

    activatePurityPrism() {
        this.abilities.purify.activeUntil = Date.now() + this.abilities.purify.durationMs;
        this.convertAllDirtyToClean();
        this.showPowerToast('Purity Prism activated!');
    }

    autoCollectVisibleCleanDroplets() {
        const cleanDroplets = this.gameArea.querySelectorAll('.droplet.clean');
        cleanDroplets.forEach((droplet) => {
            if (droplet.parentNode) {
                this.handleCleanClick(droplet);
            }
        });
    }

    convertAllDirtyToClean() {
        const dirtyDroplets = this.gameArea.querySelectorAll('.droplet.dirty');
        dirtyDroplets.forEach((droplet) => this.convertDirtyToClean(droplet));
    }

    convertDirtyToClean(droplet) {
        droplet.dataset.kind = 'clean';
        droplet.classList.remove('dirty');
        droplet.classList.add('clean');
    }

    getAbilityStatus(name) {
        const ability = this.abilities[name];
        if (this.isAbilityActive(name)) {
            const seconds = Math.max(1, Math.ceil((ability.activeUntil - Date.now()) / 1000));
            return `${seconds}s`;
        }
        if (this.isAbilityReady(name)) {
            return 'READY';
        }
        return `${Math.floor((ability.charge / ability.maxCharge) * 100)}%`;
    }

    updateAbilityButtons() {
        const abilityMap = [
            { name: 'storm', button: this.abilityStormBtn, label: this.abilityStormCharge },
            { name: 'magnet', button: this.abilityMagnetBtn, label: this.abilityMagnetCharge },
            { name: 'purify', button: this.abilityPurifyBtn, label: this.abilityPurifyCharge }
        ];

        abilityMap.forEach((item) => {
            if (!item.button || !item.label) {
                return;
            }

            const ready = this.isAbilityReady(item.name);
            const active = this.isAbilityActive(item.name);
            item.label.textContent = this.getAbilityStatus(item.name);
            item.button.disabled = !ready || !this.gameActive;
            item.button.classList.toggle('ready', ready && this.gameActive && !active);
            item.button.classList.toggle('active', active);
        });
    }

    increaseDifficulty() {
        // Every 10 seconds, increase difficulty based on current level
        if (this.gameTime % 10 === 0) {
            const minSpawnRate = this.currentDifficulty === 'hard' ? 300 : 
                                this.currentDifficulty === 'medium' ? 400 : 500;
            
            // Increase spawn rate (decrease interval)
            if (this.dropletSpawnRate > minSpawnRate) {
                this.dropletSpawnRate -= 30;
                this.refreshSpawnInterval();
            }

            // Increase dirty droplet chance based on difficulty
            const maxChance = this.currentDifficulty === 'hard' ? 0.8 : 
                            this.currentDifficulty === 'medium' ? 0.65 : 0.5;
            if (this.dirtyDropletChance < maxChance) {
                this.dirtyDropletChance += 0.05;
            }
        }
    }

    updateTimer() {
        this.timerDisplay.textContent = this.gameTime;
    }

    getMovementStage() {
        if (this.score >= this.zapSpeedStartScore) {
            return 2;
        }

        if (this.score >= this.variedSpeedStartScore) {
            return 1;
        }

        return 0;
    }

    configureDropletMovementProfile(droplet) {
        const stage = this.getMovementStage();
        const currentStage = droplet._movementProfileStage ?? -1;

        if (stage <= currentStage) {
            return;
        }

        if (stage === 0) {
            droplet._speedFactor = 1;
            droplet._zapMode = false;
            droplet._zapVisible = true;
            droplet.style.opacity = '1';
        }

        if (stage === 1) {
            droplet._speedFactor = Math.random() < 0.62 ? 0.65 + (Math.random() * 1.45) : 1;
            droplet._zapMode = false;
            droplet._zapVisible = true;
            droplet.style.opacity = '1';
        }

        if (stage === 2) {
            const shouldZap = Math.random() < 0.14;
            if (shouldZap) {
                droplet._zapMode = true;
                droplet._speedFactor = 2.5 + (Math.random() * 2.2);
                droplet._zapVisible = true;
                droplet._zapNextToggle = Date.now() + 170 + Math.floor(Math.random() * 220);
                droplet.style.opacity = '1';
            } else {
                droplet._zapMode = false;
                if (!droplet._speedFactor || droplet._speedFactor < 1.25) {
                    droplet._speedFactor = 0.8 + (Math.random() * 1.9);
                }
                droplet._zapVisible = true;
                droplet.style.opacity = '1';
            }
        }

        droplet._movementProfileStage = stage;
    }

    updateZappingDropletState(droplet) {
        if (!droplet._zapMode) {
            return;
        }

        const now = Date.now();
        if (!droplet._zapNextToggle || now < droplet._zapNextToggle) {
            return;
        }

        droplet._zapVisible = !droplet._zapVisible;
        if (!droplet._zapVisible) {
            droplet.style.opacity = '0.05';
            droplet._zapNextToggle = now + 70 + Math.floor(Math.random() * 100);
            return;
        }

        const dropletWidth = droplet.offsetWidth || 65;
        const dropletHeight = droplet.offsetHeight || 75;
        const maxX = Math.max(0, this.gameArea.clientWidth - dropletWidth);
        const maxY = Math.max(0, this.gameArea.clientHeight - dropletHeight);
        const nextX = Math.random() * maxX;
        const nextY = Math.random() * maxY;

        droplet.style.left = `${nextX}px`;
        droplet.style.top = `${nextY}px`;
        droplet.style.opacity = '1';
        droplet._zapNextToggle = now + 110 + Math.floor(Math.random() * 170);
    }

    getDropletMoveSpeed() {
        if (this.score < this.movementStartScore) {
            return 0;
        }

        const scoreOverStart = this.score - this.movementStartScore;
        const slowStartBoost = Math.min(0.8, scoreOverStart / 220);

        // A short distance after movement starts, speed begins increasing faster.
        const rampThreshold = 60;
        const fastRampBase = Math.max(0, scoreOverStart - rampThreshold);
        const fastRampBoost = Math.min(3.2, Math.pow(fastRampBase / 90, 1.18) * 0.45);

        let speed = 0.7 + slowStartBoost + fastRampBoost;

        if (this.currentDifficulty === 'medium') {
            speed *= 1.08;
        } else if (this.currentDifficulty === 'hard') {
            speed *= 1.16;
        }

        if (this.isSlowMotionActive()) {
            speed *= 0.82;
        }

        return speed;
    }

    startDropletMovement(droplet) {
        if (droplet._moveInterval) {
            return;
        }

        this.configureDropletMovementProfile(droplet);

        const speed = this.getDropletMoveSpeed();
        if (speed <= 0) {
            return;
        }

        let vx = Math.random() * 2 - 1;
        let vy = Math.random() * 2 - 1;
        const vectorLength = Math.hypot(vx, vy) || 1;
        vx /= vectorLength;
        vy /= vectorLength;

        droplet._moveInterval = setInterval(() => {
            if (!this.gameActive || !droplet.parentNode) {
                clearInterval(droplet._moveInterval);
                droplet._moveInterval = null;
                return;
            }

            const currentSpeed = this.getDropletMoveSpeed();
            if (currentSpeed <= 0) {
                return;
            }

            this.updateZappingDropletState(droplet);
            if (droplet._zapMode && !droplet._zapVisible) {
                return;
            }

            const dropletWidth = droplet.offsetWidth || 65;
            const dropletHeight = droplet.offsetHeight || 75;
            const maxX = Math.max(0, this.gameArea.clientWidth - dropletWidth);
            const maxY = Math.max(0, this.gameArea.clientHeight - dropletHeight);

            const speedFactor = droplet._speedFactor || 1;
            let nextX = parseFloat(droplet.style.left || '0') + vx * currentSpeed * speedFactor;
            let nextY = parseFloat(droplet.style.top || '0') + vy * currentSpeed * speedFactor;

            if (nextX <= 0 || nextX >= maxX) {
                vx *= -1;
                nextX = Math.min(maxX, Math.max(0, nextX));
            }

            if (nextY <= 0 || nextY >= maxY) {
                vy *= -1;
                nextY = Math.min(maxY, Math.max(0, nextY));
            }

            droplet.style.left = `${nextX}px`;
            droplet.style.top = `${nextY}px`;
        }, 30);
    }

    activateMovementForExistingDroplets() {
        if (this.getDropletMoveSpeed() <= 0) {
            return;
        }

        this.gameArea.querySelectorAll('.droplet').forEach((droplet) => {
            this.configureDropletMovementProfile(droplet);
            this.startDropletMovement(droplet);
        });
    }

    removeDroplet(droplet) {
        if (!droplet) {
            return;
        }

        if (droplet._lifeTimeout) {
            clearTimeout(droplet._lifeTimeout);
            droplet._lifeTimeout = null;
        }

        if (droplet._moveInterval) {
            clearInterval(droplet._moveInterval);
            droplet._moveInterval = null;
        }

        droplet.style.opacity = '1';

        if (droplet.parentNode) {
            droplet.remove();
        }
    }

    spawnDroplet() {
        const droplet = document.createElement('div');
        droplet.classList.add('droplet');

        // Chance for dirty droplet increases over time
        let isClean = Math.random() > this.dirtyDropletChance;
        if (!isClean && this.isAbilityActive('purify')) {
            isClean = true;
        }

        droplet.dataset.kind = isClean ? 'clean' : 'dirty';
        droplet.classList.add(droplet.dataset.kind);

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
                // If it was a clean droplet and wasn't clicked, lose a heart
                if (droplet.dataset.kind === 'clean') {
                    this.handleMissedClean(droplet);
                }
                this.removeDroplet(droplet);
            }
        }, this.getDropletLifetime());
        droplet._lifeTimeout = timeout;

        droplet.addEventListener('click', (e) => {
            e.stopPropagation();
            clearTimeout(timeout);
            
            if (droplet.dataset.kind === 'clean') {
                this.handleCleanClick(droplet);
            } else {
                this.handleDirtyClick(droplet);
            }
        });

        this.gameArea.appendChild(droplet);
        this.startDropletMovement(droplet);

        if (this.isAbilityActive('magnet') && droplet.dataset.kind === 'clean') {
            setTimeout(() => {
                if (droplet.parentNode && droplet.dataset.kind === 'clean') {
                    clearTimeout(timeout);
                    this.handleCleanClick(droplet);
                }
            }, 220);
        }
    }

    handleCleanClick(droplet) {
        this.cleanStreak++;
        this.updateComboMultiplier();

        const points = 10 * this.comboMultiplier;
        this.score += points;
        this.activateMovementForExistingDroplets();
        if (!this.hasAnyActiveAbility()) {
            this.gainAbilityCharge(this.comboMultiplier);
        }

        // Every 5 clean hits in a row grants a protective shield charge.
        if (this.cleanStreak > 0 && this.cleanStreak % 5 === 0) {
            this.shieldCharges++;
            this.showPowerToast('Shield unlocked!');
        }

        // Every 8 clean hits in a row triggers temporary slow motion.
        if (this.cleanStreak > 0 && this.cleanStreak % 8 === 0) {
            this.activateSlowMotion(6);
            this.showPowerToast('Time Wave: slow motion!');
        }

        this.showBonusEffect(droplet, `+${points}`);
        this.removeDroplet(droplet);
        this.updateDisplay();
    }

    handleMissedClean(droplet) {
        this.breakStreak();

        // Shield prevents one life loss from mistakes.
        if (this.consumeShieldIfAvailable(droplet)) {
            this.updateDisplay();
            return;
        }

        this.lives--;
        this.showPenaltyEffect(droplet, '-1');
        this.updateDisplay();

        if (this.lives <= 0) {
            this.endGame();
        }
    }

    handleDirtyClick(droplet) {
        this.breakStreak();

        if (this.consumeShieldIfAvailable(droplet)) {
            this.removeDroplet(droplet);
            this.updateDisplay();
            return;
        }

        this.lives--;
        this.showPenaltyEffect(droplet, '-1');
        this.removeDroplet(droplet);
        this.updateDisplay();

        if (this.lives <= 0) {
            this.endGame();
        }
    }

    breakStreak() {
        this.cleanStreak = 0;
        this.updateComboMultiplier();
    }

    updateComboMultiplier() {
        if (this.cleanStreak >= 12) {
            this.comboMultiplier = 4;
        } else if (this.cleanStreak >= 8) {
            this.comboMultiplier = 3;
        } else if (this.cleanStreak >= 4) {
            this.comboMultiplier = 2;
        } else {
            this.comboMultiplier = 1;
        }
    }

    consumeShieldIfAvailable(element) {
        if (this.shieldCharges <= 0) {
            return false;
        }

        this.shieldCharges--;
        this.showShieldEffect(element);
        return true;
    }

    showShieldEffect(element) {
        this.showBonusEffect(element, 'Shield!');
    }

    showPowerToast(text) {
        const toast = document.createElement('div');
        toast.className = 'power-toast';
        toast.textContent = text;
        this.gameArea.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 1500);
    }

    getPowerStatusText() {
        if (this.isAbilityActive('magnet')) {
            return 'Aqua Magnet active';
        }

        if (this.isAbilityActive('purify')) {
            return 'Purity Prism active';
        }

        if (this.isSlowMotionActive()) {
            const remaining = Math.max(1, Math.ceil((this.slowMoUntil - Date.now()) / 1000));
            return `Time Wave ${remaining}s`;
        }

        if (this.shieldCharges > 0) {
            return `Shield x${this.shieldCharges}`;
        }

        if (this.comboMultiplier > 1) {
            return `Combo x${this.comboMultiplier}`;
        }

        return 'None';
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
        if (this.streakDisplay) {
            this.streakDisplay.textContent = this.cleanStreak;
        }
        if (this.powerDisplay) {
            this.powerDisplay.textContent = this.getPowerStatusText();
        }
        this.updateAbilityButtons();
        
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
        document.querySelectorAll('.droplet').forEach((d) => this.removeDroplet(d));
    }

    resetGame() {
        this.lives = this.difficulties[this.currentDifficulty].lives;
        this.score = 0;
        this.gameTime = 0;
        this.gameActive = false;
        this.gameStarted = false;
        this.dropletSpawnRate = this.difficulties[this.currentDifficulty].spawnRate;
        this.dirtyDropletChance = this.difficulties[this.currentDifficulty].dirtyChance;
        this.hasCelebratedHighScore = false;
        this.cleanStreak = 0;
        this.comboMultiplier = 1;
        this.shieldCharges = 0;
        this.slowMoUntil = 0;
        Object.values(this.abilities).forEach((ability) => {
            ability.charge = 0;
            ability.activeUntil = 0;
        });
        this.gameOverModal.classList.remove('active');
        this.startBtn.style.display = 'block';
        
        // Clear all droplets
        document.querySelectorAll('.droplet').forEach((d) => this.removeDroplet(d));
        
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
        // Ask for difficulty selection again
        this.gameContent.style.display = 'none';
        this.difficultySelector.style.display = 'block';
        this.resetGame();
    }

    changeDifficulty() {
        // End current game and go back to difficulty selection
        this.gameActive = false;
        clearInterval(this.spawnInterval);
        clearInterval(this.timerInterval);
        this.cleanStreak = 0;
        this.comboMultiplier = 1;
        this.shieldCharges = 0;
        this.slowMoUntil = 0;
        Object.values(this.abilities).forEach((ability) => {
            ability.charge = 0;
            ability.activeUntil = 0;
        });
        document.querySelectorAll('.droplet').forEach((d) => this.removeDroplet(d));
        this.gameContent.style.display = 'none';
        this.difficultySelector.style.display = 'block';
        this.gameOverModal.classList.remove('active');
        this.updateDisplay();
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
