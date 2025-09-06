// ===== GAME.JS - 보안 강화된 메인 게임 클래스 =====
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.arena = new Arena();
        this.player = new Player(this.arena);
        this.spawner = new ObstacleSpawner(this.arena);
        this.effectManager = new EffectManager(this.arena);
        
        // 플레이어 위치 체크 함수 설정
        this.spawner.setPlayerPositionChecker((x, y) => {
            return this.player.gridX === x && this.player.gridY === y;
        });
        
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.level = 1;
        this.gameTime = 0;
        this.levelTime = 0;
        this.lastTime = 0;
        this.score = 0;
        this.lastScoreTime = 0;
        
        // 보안 및 무결성 검증
        this.gameIntegrity = {
            startTime: 0,
            lastValidationTime: 0,
            scoreHistory: [],
            levelHistory: [],
            suspicious: false,
            validationInterval: 5000, // 5초마다 검증
            maxScorePerSecond: 20, // 초당 최대 점수 증가
            maxLevelPerMinute: 12 // 분당 최대 레벨 증가
        };
        
        // 입력 보안 (키 매크로 방지)
        this.inputSecurity = {
            keyPressHistory: [],
            maxKeysPerSecond: 10,
            lastKeyTime: 0,
            suspiciousPatterns: 0
        };

        // 게임오버 애니메이션 관련
        this.gameOverAnimation = {
            scoreAnimating: false,
            timeAnimating: false,
            levelAnimating: false,
            displayedScore: 0,
            displayedTime: 0,
            displayedLevel: 0,
            totalDuration: 6000,
            startTime: 0,
            countSound: null,
            fadeOut: false,
            fadeStartTime: 0
        };
        
        this.keys = {};
        this.lastKeyPressTime = {};
        this.keyRepeatDelay = 150;
        
        this.setupEventListeners();
        this.startIntegrityMonitoring();
        this.gameLoop();
    }

    // 게임 무결성 모니터링 시작
    startIntegrityMonitoring() {
        setInterval(() => {
            this.validateGameIntegrity();
        }, this.gameIntegrity.validationInterval);

        // 개발자 도구 감지 (기본적인 수준)
        this.detectDevTools();
    }

    // 개발자 도구 감지 (완벽하지 않지만 기본적인 억제 효과)
    detectDevTools() {
        const threshold = 160;
        let devtools = {open: false, orientation: null};
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.warn('개발자 도구가 감지되었습니다.');
                    this.gameIntegrity.suspicious = true;
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    // 게임 무결성 검증
    validateGameIntegrity() {
        if (this.gameState !== 'playing') return;

        const currentTime = Date.now();
        const gameTimeSeconds = this.gameTime / 1000;
        
        // 점수 증가율 검증
        if (this.gameIntegrity.scoreHistory.length > 0) {
            const lastScore = this.gameIntegrity.scoreHistory[this.gameIntegrity.scoreHistory.length - 1];
            const scoreDiff = this.score - lastScore.score;
            const timeDiff = (currentTime - lastScore.timestamp) / 1000;
            
            if (scoreDiff > this.gameIntegrity.maxScorePerSecond * timeDiff && this.score > 500) {
                console.warn('비정상적인 점수 증가 감지');
                this.gameIntegrity.suspicious = true;
            }
        }

        // 레벨 진행률 검증
        if (this.gameIntegrity.levelHistory.length > 0) {
            const lastLevel = this.gameIntegrity.levelHistory[this.gameIntegrity.levelHistory.length - 1];
            const levelDiff = this.level - lastLevel.level;
            const timeDiff = (currentTime - lastLevel.timestamp) / 60000; // 분 단위
            
            if (levelDiff > this.gameIntegrity.maxLevelPerMinute * timeDiff && this.level > 5) {
                console.warn('비정상적인 레벨 진행 감지');
                this.gameIntegrity.suspicious = true;
            }
        }

        // 게임 시간 검증
        const expectedMinTime = (this.level - 1) * 5; // 레벨당 최소 5초
        if (gameTimeSeconds < expectedMinTime && this.level > 3) {
            console.warn('게임 시간이 너무 짧음');
            this.gameIntegrity.suspicious = true;
        }

        // 히스토리 업데이트
        this.gameIntegrity.scoreHistory.push({
            score: this.score,
            timestamp: currentTime
        });
        
        this.gameIntegrity.levelHistory.push({
            level: this.level,
            timestamp: currentTime
        });

        // 히스토리 크기 제한 (메모리 관리)
        if (this.gameIntegrity.scoreHistory.length > 100) {
            this.gameIntegrity.scoreHistory.shift();
        }
        if (this.gameIntegrity.levelHistory.length > 50) {
            this.gameIntegrity.levelHistory.shift();
        }

        this.gameIntegrity.lastValidationTime = currentTime;
    }

    // 입력 보안 검증
    validateInput(keyCode) {
        const currentTime = Date.now();
        
        // 키 입력 빈도 체크
        this.inputSecurity.keyPressHistory.push(currentTime);
        
        // 1초 이내의 키 입력만 유지
        this.inputSecurity.keyPressHistory = this.inputSecurity.keyPressHistory.filter(
            time => currentTime - time <= 1000
        );

        // 초당 키 입력 수 체크
        if (this.inputSecurity.keyPressHistory.length > this.inputSecurity.maxKeysPerSecond) {
            console.warn('비정상적인 키 입력 빈도 감지');
            this.gameIntegrity.suspicious = true;
            return false;
        }

        // 키 입력 패턴 분석 (동일한 키의 반복적인 입력)
        const timeSinceLastKey = currentTime - this.inputSecurity.lastKeyTime;
        if (timeSinceLastKey < 50) { // 50ms 이내 연속 입력
            this.inputSecurity.suspiciousPatterns++;
            if (this.inputSecurity.suspiciousPatterns > 5) {
                console.warn('의심스러운 키 입력 패턴 감지');
                this.gameIntegrity.suspicious = true;
            }
        } else {
            this.inputSecurity.suspiciousPatterns = Math.max(0, this.inputSecurity.suspiciousPatterns - 1);
        }

        this.inputSecurity.lastKeyTime = currentTime;
        return true;
    }

    setupEventListeners() {
        // 컨텍스트 메뉴 비활성화 (우클릭 방지)
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 드래그 앤 드롭 비활성화
        this.canvas.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });

        // 캔버스 클릭 이벤트 (시작 버튼용)
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'menu') {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // 시작 버튼 영역 체크
                const startButtonX = this.canvas.width / 2 - 100;
                const startButtonY = this.canvas.height / 2 - 25;
                const buttonWidth = 200;
                const buttonHeight = 50;
                
                if (x >= startButtonX && x <= startButtonX + buttonWidth &&
                    y >= startButtonY && y <= startButtonY + buttonHeight) {
                    this.start();
                    return;
                }
                
                // 리더보드 버튼 영역 체크
                const leaderboardButtonX = this.canvas.width / 2 - 100;
                const leaderboardButtonY = this.canvas.height / 2 + 40;
                
                if (x >= leaderboardButtonX && x <= leaderboardButtonX + buttonWidth &&
                    y >= leaderboardButtonY && y <= leaderboardButtonY + buttonHeight) {
                    leaderboardManager.openLeaderboard();
                    return;
                }
            }
        });
        
        // 마우스 이벤트 추가 (호버 효과용)
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameState === 'menu') {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const startButtonX = this.canvas.width / 2 - 100;
                const startButtonY = this.canvas.height / 2 - 25;
                const buttonWidth = 200;
                const buttonHeight = 50;
                
                const isHoveringStart = (x >= startButtonX && x <= startButtonX + buttonWidth &&
                    y >= startButtonY && y <= startButtonY + buttonHeight);
                
                const leaderboardButtonX = this.canvas.width / 2 - 100;
                const leaderboardButtonY = this.canvas.height / 2 + 40;
                
                const isHoveringLeaderboard = (x >= leaderboardButtonX && x <= leaderboardButtonX + buttonWidth &&
                    y >= leaderboardButtonY && y <= leaderboardButtonY + buttonHeight);
                
                this.isHoveringStartButton = isHoveringStart;
                this.isHoveringLeaderboardButton = isHoveringLeaderboard;
                
                this.canvas.style.cursor = (isHoveringStart || isHoveringLeaderboard) ? 'pointer' : 'default';
            } else {
                this.canvas.style.cursor = 'default';
            }
        });
        
        // 키보드 이벤트 (보안 검증 추가)
        document.addEventListener('keydown', (e) => {
            // F12, Ctrl+Shift+I 등 개발자 도구 단축키 차단
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                console.warn('개발자 도구 접근 시도 감지');
                return;
            }

            if (this.gameState === 'playing') {
                // 입력 보안 검증
                if (!this.validateInput(e.code)) {
                    e.preventDefault();
                    return;
                }
                this.handleGameInput(e);
            } else if (this.gameState === 'paused' && e.code === 'Escape') {
                this.resumeGame();
            } else if (this.gameState === 'menu' && e.code === 'Space') {
                this.start();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 탭 전환 감지 - 게임이 백그라운드로 가면 자동 일시정지
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === 'playing') {
                this.pauseGame();
            }
        });

        // 창 크기 변경 감지
        window.addEventListener('resize', () => {
            if (this.gameState === 'playing') {
                console.warn('게임 중 창 크기 변경 감지');
                this.gameIntegrity.suspicious = true;
            }
        });
    }
    
    handleGameInput(e) {
        const currentTime = Date.now();
        
        if (e.code === 'Escape') {
            this.pauseGame();
            return;
        }
        
        // 이동 키 처리 (연속 입력 방지)
        if (this.lastKeyPressTime[e.code] && 
            currentTime - this.lastKeyPressTime[e.code] < this.keyRepeatDelay) {
            return;
        }
        
        this.lastKeyPressTime[e.code] = currentTime;
        
        // 효과에 따른 컨트롤 반전 처리
        const reversed = this.effectManager.shouldReverseControls();
        
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.player.move(0, -1);
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.player.move(0, 1);
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.player.move(reversed ? 1 : -1, 0);
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.player.move(reversed ? -1 : 1, 0);
                break;
        }
    }
    
    start() {
        // 의심스러운 활동이 감지된 경우 경고
        if (this.gameIntegrity.suspicious) {
            const confirmStart = confirm('비정상적인 활동이 감지되었습니다. 정말 게임을 시작하시겠습니까?');
            if (!confirmStart) return;
        }

        // 게임 시작 사운드 재생
        if (typeof soundManager !== 'undefined') {
            soundManager.playStartSound();
        }
        
        // 게임오버 애니메이션 중단 및 사운드 정지
        if (this.gameOverAnimation.countSound && typeof soundManager !== 'undefined') {
            soundManager.stopSound(this.gameOverAnimation.countSound);
            this.gameOverAnimation.countSound = null;
        }
        
        // 모달 완전히 제거
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) {
            gameOverOverlay.remove();
            
            const newGameOverOverlay = document.createElement('div');
            newGameOverOverlay.id = 'gameOverOverlay';
            newGameOverOverlay.className = 'game-over-overlay';
            newGameOverOverlay.innerHTML = `
                <div class="game-over-menu">
                    <h2 class="game-over-title">GAME OVER</h2>
                    <div class="final-score-display">
                        <span id="finalScore">0</span>
                    </div>
                    <div class="stats">
                        <p>레벨: <span id="finalLevel">1</span></p>
                        <p>생존 시간: <span id="finalTime">0</span>초</p>
                    </div>
                    <button class="pixel-button" onclick="startGame()">RETRY</button>
                    <button class="pixel-button" onclick="goToMainMenu()">MAIN MENU</button>
                </div>
            `;
            document.querySelector('.game-container').appendChild(newGameOverOverlay);
        }
        
        // 게임 상태 초기화
        this.gameState = 'playing';
        this.level = 1;
        this.gameTime = 0;
        this.levelTime = 0;
        this.score = 0;
        this.lastScoreTime = 0;
        
        // 보안 상태 초기화
        this.gameIntegrity = {
            startTime: Date.now(),
            lastValidationTime: Date.now(),
            scoreHistory: [{score: 0, timestamp: Date.now()}],
            levelHistory: [{level: 1, timestamp: Date.now()}],
            suspicious: false,
            validationInterval: 5000,
            maxScorePerSecond: 20,
            maxLevelPerMinute: 12
        };
        
        this.inputSecurity = {
            keyPressHistory: [],
            maxKeysPerSecond: 10,
            lastKeyTime: 0,
            suspiciousPatterns: 0
        };

        // 리더보드 게임 세션 시작
        if (typeof leaderboardManager !== 'undefined') {
            leaderboardManager.startGameSession();
        }
        
        // 플레이어, 아레나, 스포너, 이펙트 초기화
        this.player.reset();
        this.arena.updateSize(this.level);
        this.spawner.clear();
        this.effectManager.reset();
        
        // 게임오버 애니메이션 완전 리셋
        this.gameOverAnimation = {
            scoreAnimating: false,
            timeAnimating: false,
            levelAnimating: false,
            displayedScore: 0,
            displayedTime: 0,
            displayedLevel: 0,
            totalDuration: 6000,
            startTime: 0,
            countSound: null,
            fadeOut: false,
            fadeStartTime: 0
        };
        
        // 타이머 리셋
        this.lastTime = performance.now();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            if (typeof soundManager !== 'undefined') {
                soundManager.playPauseSound();
            }
            
            this.gameState = 'paused';
            document.getElementById('pauseOverlay').classList.add('show');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseOverlay').classList.remove('show');
            this.lastTime = performance.now();
        }
    }
    
    goToMainMenu() {
        this.gameState = 'menu';
        document.getElementById('pauseOverlay').classList.remove('show');
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) {
            gameOverOverlay.classList.remove('show');
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        if (typeof soundManager !== 'undefined') {
            soundManager.playGameOverSound();
        }
        
        const finalScore = this.score;
        const finalLevel = this.level;
        const finalTime = Math.floor(this.gameTime / 1000);
        
        // 의심스러운 활동이 감지된 경우 리더보드 등록 차단
        if (this.gameIntegrity.suspicious) {
            alert('비정상적인 활동이 감지되어 리더보드에 등록할 수 없습니다.');
            this.showGameOverModal();
            return;
        }

        // 리더보드 체크 (async 처리)
        this.checkLeaderboard(finalScore, finalLevel, finalTime);
    }

    async checkLeaderboard(finalScore, finalLevel, finalTime) {
        try {
            if (typeof leaderboardManager !== 'undefined') {
                // 게임 세션 업데이트
                leaderboardManager.updateGameSession(finalScore, finalLevel, finalTime);
                
                const isNewRecord = await leaderboardManager.isNewRecord(finalScore);
                if (isNewRecord) {
                    leaderboardManager.showNewRecordModal(finalScore, finalLevel, finalTime);
                } else {
                    this.showGameOverModal();
                }
            } else {
                this.showGameOverModal();
            }
        } catch (error) {
            console.error('리더보드 체크 오류:', error);
            this.showGameOverModal();
        }
    }
    
    showGameOverModal() {
        // 애니메이션 초기화
        this.gameOverAnimation = {
            scoreAnimating: true,
            timeAnimating: false,
            levelAnimating: false,
            displayedScore: 0,
            displayedTime: 0,
            displayedLevel: 0,
            totalDuration: 6000,
            startTime: Date.now(),
            countSound: null,
            fadeOut: false,
            fadeStartTime: 0
        };
        
        document.getElementById('gameOverOverlay').classList.add('show');
        
        if (typeof soundManager !== 'undefined') {
            this.gameOverAnimation.countSound = soundManager.playCountSound();
        }
        
        this.animateGameOverStats();
    }
    
    animateGameOverStats() {
        if (this.gameState !== 'gameOver') return;
        
        const finalScore = this.score;
        const finalTime = Math.floor(this.gameTime / 1000);
        const finalLevel = this.level;
        
        const currentTime = Date.now();
        const elapsed = currentTime - this.gameOverAnimation.startTime;
        const progress = Math.min(elapsed / this.gameOverAnimation.totalDuration, 1);
        
        const scorePhase = 0.4;
        const timePhase = 0.7;
        
        if (progress <= scorePhase) {
            const scoreProgress = progress / scorePhase;
            this.gameOverAnimation.displayedScore = finalScore * scoreProgress;
            this.gameOverAnimation.scoreAnimating = true;
            this.gameOverAnimation.timeAnimating = false;
            this.gameOverAnimation.levelAnimating = false;
        } else if (progress <= timePhase) {
            this.gameOverAnimation.displayedScore = finalScore;
            const timeProgress = (progress - scorePhase) / (timePhase - scorePhase);
            this.gameOverAnimation.displayedTime = finalTime * timeProgress;
            this.gameOverAnimation.scoreAnimating = false;
            this.gameOverAnimation.timeAnimating = true;
            this.gameOverAnimation.levelAnimating = false;
        } else {
            this.gameOverAnimation.displayedScore = finalScore;
            this.gameOverAnimation.displayedTime = finalTime;
            const levelProgress = (progress - timePhase) / (1 - timePhase);
            this.gameOverAnimation.displayedLevel = finalLevel * levelProgress;
            this.gameOverAnimation.scoreAnimating = false;
            this.gameOverAnimation.timeAnimating = false;
            this.gameOverAnimation.levelAnimating = true;
        }
        
        // DOM 업데이트
        const finalScoreElement = document.getElementById('finalScore');
        const finalTimeElement = document.getElementById('finalTime');
        const finalLevelElement = document.getElementById('finalLevel');
        
        if (finalScoreElement) {
            finalScoreElement.textContent = Math.floor(this.gameOverAnimation.displayedScore).toString();
        }
        if (finalTimeElement) {
            finalTimeElement.textContent = Math.floor(this.gameOverAnimation.displayedTime);
        }
        if (finalLevelElement) {
            finalLevelElement.textContent = Math.floor(this.gameOverAnimation.displayedLevel);
        }
        
        if (progress >= 1) {
            if (this.gameOverAnimation.countSound && typeof soundManager !== 'undefined') {
                soundManager.stopSound(this.gameOverAnimation.countSound);
                this.gameOverAnimation.countSound = null;
            }
        } else {
            if (this.gameState === 'gameOver') {
                requestAnimationFrame(() => this.animateGameOverStats());
            }
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.gameTime += deltaTime;
        this.levelTime += deltaTime;
        
        // 점수 계산
        this.lastScoreTime += deltaTime;
        if (this.lastScoreTime >= 100) {
            const baseScore = Math.floor(this.level / 2) + 1;
            this.score += baseScore;
            this.lastScoreTime = 0;

            // 리더보드에 게임 진행 상황 업데이트
            if (typeof leaderboardManager !== 'undefined') {
                leaderboardManager.updateGameSession(this.score, this.level, Math.floor(this.gameTime / 1000));
            }
        }
        
        // 레벨업 체크
        if (this.levelTime >= CONFIG.LEVEL.DURATION) {
            this.level++;
            this.levelTime = 0;
            this.arena.updateSize(this.level);
            this.adjustPlayerPosition();
            
            if (typeof soundManager !== 'undefined') {
                soundManager.playLevelUpSound();
            }
        }
        
        this.player.update(deltaTime);
        this.arena.update(deltaTime);
        this.effectManager.update(deltaTime, this.gameTime);
        this.spawner.update(deltaTime, this.level, this.player.lives, this.effectManager.getObstacleSpeedMultiplier(), this.gameTime);
        
        this.checkCollisions();
        
        if (this.player.lives <= 0) {
            this.gameOver();
        }
    }
    
    adjustPlayerPosition() {
        if (!this.arena.isValidPosition(this.player.gridX, this.player.gridY)) {
            this.player.gridX = Math.floor(this.arena.width / 2);
            this.player.gridY = Math.floor(this.arena.height / 2);
        }
    }
    
    checkCollisions() {
        const playerBounds = this.player.getBounds(this.canvas.width, this.canvas.height);
        const obstacles = this.spawner.getActiveObstacles();
        
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            
            if (obstacle instanceof Heart) {
                const heartBounds = obstacle.getBounds(this.canvas.width, this.canvas.height);
                if (!obstacle.collected && Utils.rectCollision(playerBounds, heartBounds)) {
                    if (this.player.lives < CONFIG.LEVEL.MAX_LIVES_FOR_HEARTS) {
                        this.player.heal();
                        obstacle.collect();
                    }
                }
            } else if (obstacle instanceof Bomb) {
                const bombBounds = obstacle.getBounds(this.canvas.width, this.canvas.height);
                if (bombBounds) {
                    bombBounds.forEach(bounds => {
                        if (Utils.rectCollision(playerBounds, bounds)) {
                            this.player.takeDamage();
                        }
                    });
                }
            } else {
                const obstacleBounds = obstacle.getBounds(this.canvas.width, this.canvas.height);
                if (obstacleBounds && Utils.rectCollision(playerBounds, obstacleBounds)) {
                    this.player.takeDamage();
                }
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-color');
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'menu') {
            this.drawStartScreen();
        } else {
            this.drawScore();
            this.effectManager.drawUI(this.ctx, this.canvas.width, this.canvas.height, this.player.lives);
            
            if (this.effectManager.shouldBlur()) {
                this.ctx.filter = 'blur(3px)';
            }
            
            this.arena.draw(this.ctx, this.canvas.width, this.canvas.height);
            
            const obstacles = this.spawner.getActiveObstacles();
            obstacles.forEach(obstacle => {
                obstacle.draw(this.ctx, this.canvas.width, this.canvas.height);
            });
            
            this.player.draw(this.ctx, this.canvas.width, this.canvas.height);
            
            this.ctx.filter = 'none';
            this.player.drawDamageEffects(this.ctx, this.canvas.width, this.canvas.height);
            
            // 의심스러운 활동 감지시 경고 표시
            if (this.gameIntegrity.suspicious) {
                this.drawSecurityWarning();
            }
        }
    }

    drawSecurityWarning() {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, 30);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠ 비정상적인 활동이 감지되었습니다', this.canvas.width / 2, 20);
        this.ctx.textAlign = 'start';
    }
    
    drawStartScreen() {
        const isDarkMode = !document.body.classList.contains('light-mode');
        
        this.ctx.font = 'bold 60px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = isDarkMode ? '#ffffff' : '#333333';
        this.ctx.fillText('AVOIDER.IO', this.canvas.width / 2, this.canvas.height / 2 - 120);
        
        const startButtonX = this.canvas.width / 2 - 100;
        const startButtonY = this.canvas.height / 2 - 25;
        const buttonWidth = 200;
        const buttonHeight = 50;
        
        this.drawButton(startButtonX, startButtonY, buttonWidth, buttonHeight, 'START GAME', this.isHoveringStartButton, isDarkMode);
        
        const leaderboardButtonX = this.canvas.width / 2 - 100;
        const leaderboardButtonY = this.canvas.height / 2 + 40;
        
        this.drawButton(leaderboardButtonX, leaderboardButtonY, buttonWidth, buttonHeight, 'LEADERBOARD', this.isHoveringLeaderboardButton, isDarkMode);
    }
    
    drawButton(x, y, width, height, text, isHovering, isDarkMode) {
        if (isHovering) {
            this.ctx.strokeStyle = isDarkMode ? '#ffffff' : '#333333';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, width, height);
            
            this.ctx.font = 'bold 24px "Courier New", monospace';
            this.ctx.fillStyle = isDarkMode ? '#ffffff' : '#333333';
            this.ctx.fillText(text, this.canvas.width / 2, y + height/2 + 8);
        } else {
            this.ctx.fillStyle = isDarkMode ? '#ffffff' : '#333333';
            this.ctx.fillRect(x, y, width, height);
            
            this.ctx.strokeStyle = isDarkMode ? '#ffffff' : '#333333';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, width, height);
            
            this.ctx.font = 'bold 24px "Courier New", monospace';
            this.ctx.fillStyle = isDarkMode ? '#000000' : '#ffffff';
            this.ctx.fillText(text, this.canvas.width / 2, y + height/2 + 8);
        }
    }
    
    drawScore() {
        const isDarkMode = !document.body.classList.contains('light-mode');
        const scoreMultiplier = Math.floor(this.level / 2) + 1;
        
        this.ctx.font = 'bold 48px "Arial", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = isDarkMode ? '#ffffff' : '#333333';
        
        this.ctx.shadowColor = isDarkMode ? '#000000' : '#ffffff';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        const scoreText = this.score.toString();
        this.ctx.fillText(scoreText, this.canvas.width / 2, 65);
        
        const scoreWidth = this.ctx.measureText(scoreText).width;
        this.ctx.font = 'bold 24px "Arial", sans-serif';
        this.ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(51, 51, 51, 0.7)';
        this.ctx.fillText(`x${scoreMultiplier}`, this.canvas.width / 2 + scoreWidth / 2 + 25, 65);
        
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.textAlign = 'start';
    }
    
    gameLoop(currentTime = performance.now()) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.update(deltaTime);
        }
        
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}