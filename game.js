// ===== GAME.JS - 메인 게임 클래스 =====
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
        
        // 게임오버 애니메이션 관련
        this.gameOverAnimation = {
            scoreAnimating: false,
            timeAnimating: false,
            levelAnimating: false,
            displayedScore: 0,
            displayedTime: 0,
            displayedLevel: 0,
            totalDuration: 6000, // 6초 고정
            startTime: 0,
            countSound: null,
            fadeOut: false, // 페이드아웃 플래그
            fadeStartTime: 0 // 페이드아웃 시작 시간
        };
        
        this.keys = {};
        this.lastKeyPressTime = {};
        this.keyRepeatDelay = 150;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing') {
                this.handleGameInput(e);
            } else if (this.gameState === 'paused' && e.code === 'Escape') {
                this.resumeGame();
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
        // 게임 시작 사운드 재생
        if (typeof soundManager !== 'undefined') {
            soundManager.playStartSound();
        }
        
        this.gameState = 'playing';
        this.level = 1;
        this.gameTime = 0;
        this.levelTime = 0;
        this.score = 0;
        this.lastScoreTime = 0;
        this.player.reset();
        this.arena.updateSize(this.level);
        this.spawner.clear();
        this.effectManager.reset();
        
        // 게임오버 애니메이션 리셋
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
        
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            // 일시정지 사운드 재생
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
            this.lastTime = performance.now(); // 시간 리셋
            this.gameLoop(); // 게임 루프 재시작
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // 애니메이션 초기화 - 카운팅 순서: 점수 → 생존시간 → 레벨
        this.gameOverAnimation = {
            scoreAnimating: true,
            timeAnimating: false,
            levelAnimating: false,
            displayedScore: 0,
            displayedTime: 0,
            displayedLevel: 0,
            totalDuration: 6000, // 6초 고정
            startTime: Date.now(),
            countSound: null,
            fadeOut: false,
            fadeStartTime: 0
        };
        
        document.getElementById('gameOverOverlay').classList.add('show');
        
        // 카운트 사운드 재생 시작
        if (typeof soundManager !== 'undefined') {
            this.gameOverAnimation.countSound = soundManager.playCountSound();
        }
        
        // 애니메이션 시작
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
        
        // 각 단계별 시간 배분: 점수(40%), 생존시간(30%), 레벨(30%)
        const scorePhase = 0.4;
        const timePhase = 0.7;
        
        if (progress <= scorePhase) {
            // 점수 애니메이션 (0~40%)
            const scoreProgress = progress / scorePhase;
            this.gameOverAnimation.displayedScore = finalScore * scoreProgress;
            this.gameOverAnimation.scoreAnimating = true;
            this.gameOverAnimation.timeAnimating = false;
            this.gameOverAnimation.levelAnimating = false;
        } else if (progress <= timePhase) {
            // 생존시간 애니메이션 (40~70%)
            this.gameOverAnimation.displayedScore = finalScore;
            const timeProgress = (progress - scorePhase) / (timePhase - scorePhase);
            this.gameOverAnimation.displayedTime = finalTime * timeProgress;
            this.gameOverAnimation.scoreAnimating = false;
            this.gameOverAnimation.timeAnimating = true;
            this.gameOverAnimation.levelAnimating = false;
        } else {
            // 레벨 애니메이션 (70~100%)
            this.gameOverAnimation.displayedScore = finalScore;
            this.gameOverAnimation.displayedTime = finalTime;
            const levelProgress = (progress - timePhase) / (1 - timePhase);
            this.gameOverAnimation.displayedLevel = finalLevel * levelProgress;
            this.gameOverAnimation.scoreAnimating = false;
            this.gameOverAnimation.timeAnimating = false;
            this.gameOverAnimation.levelAnimating = true;
        }
        
        // DOM 업데이트
        document.getElementById('finalScore').textContent = Math.floor(this.gameOverAnimation.displayedScore).toString();
        document.getElementById('finalTime').textContent = Math.floor(this.gameOverAnimation.displayedTime);
        document.getElementById('finalLevel').textContent = Math.floor(this.gameOverAnimation.displayedLevel);
        
        // 애니메이션 완료 체크
        if (progress >= 1) {
            // 모든 애니메이션 완료 시 카운트 사운드 중지
            if (this.gameOverAnimation.countSound && typeof soundManager !== 'undefined') {
                soundManager.stopSound(this.gameOverAnimation.countSound);
                this.gameOverAnimation.countSound = null;
            }
        } else {
            // 애니메이션 계속
            requestAnimationFrame(() => this.animateGameOverStats());
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.gameTime += deltaTime;
        this.levelTime += deltaTime;
        
        // 점수 계산 (레벨에 따라 더 많은 점수)
        this.lastScoreTime += deltaTime;
        if (this.lastScoreTime >= 100) { // 0.1초마다 점수 계산
            const baseScore = Math.floor(this.level / 2) + 1; // 레벨에 따른 기본 점수
            this.score += baseScore;
            this.lastScoreTime = 0;
        }
        
        // 레벨업 체크
        if (this.levelTime >= CONFIG.LEVEL.DURATION) {
            this.level++;
            this.levelTime = 0;
            this.arena.updateSize(this.level);
            // 아레나 크기가 변경되면 플레이어 위치 조정
            this.adjustPlayerPosition();
            
            // 레벨업 사운드 재생
            if (typeof soundManager !== 'undefined') {
                soundManager.playLevelUpSound();
            }
        }
        
        // 플레이어 업데이트
        this.player.update(deltaTime);
        
        // 아레나 업데이트 (확장 이펙트)
        this.arena.update(deltaTime);
        
        // 효과 시스템 업데이트
        this.effectManager.update(deltaTime, this.gameTime);
        
        // 장애물 생성 및 업데이트 (속도 효과 적용)
        this.spawner.update(deltaTime, this.level, this.player.lives, this.effectManager.getObstacleSpeedMultiplier());
        
        // 충돌 검사
        this.checkCollisions();
        
        // 게임오버 체크
        if (this.player.lives <= 0) {
            this.gameOver();
        }
        
        // UI 업데이트
        this.updateUI();
    }
    
    adjustPlayerPosition() {
        // 아레나 크기가 변경될 때 플레이어가 유효한 위치에 있는지 확인
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
                        this.player.heal(); // 목숨 회복
                        obstacle.collect(); // 페이드아웃 애니메이션 시작
                    }
                }
            } else if (obstacle instanceof Bomb) {
                const bombBounds = obstacle.getBounds(this.canvas.width, this.canvas.height);
                // 폭탄 투사체는 충돌하지 않고, 폭발 시에만 충돌
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
    
    updateUI() {
        // UI 요소들 업데이트 (목숨은 캔버스에서 직접 그리므로 제외)
        document.getElementById('levelDisplay').textContent = this.level;
        document.getElementById('timeDisplay').textContent = Math.floor(this.gameTime / 1000);
        document.getElementById('arenaSizeDisplay').textContent = `${this.arena.width}x${this.arena.height}`;
        
        // 난이도 표시
        let difficulty;
        if (this.level <= 3) difficulty = 'Easy';
        else if (this.level <= 7) difficulty = 'Normal';
        else if (this.level <= 12) difficulty = 'Hard';
        else difficulty = 'Extreme';
        
        document.getElementById('difficultyDisplay').textContent = difficulty;
    }
    
    // 게임 화면 렌더링 메서드 - 모든 게임 요소들을 순서대로 그리기
    draw() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경색 적용 (다크/라이트 모드에 따라)
        this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-color');
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 점수 표시 (상단 중앙에 메인 점수와 배수 표시)
        this.drawScore();
        
        // TODO: 효과 아이콘과 목숨 UI 표시 구현 필요
        // 위치: 점수와 플레이그라운드 사이 중앙
        // 포함 요소: 효과 아이콘 4개 | 구분선 | 하트 3개
        // this.effectManager.drawEffectIconsAndLives(this.ctx, this.canvas.width, this.canvas.height, this.player.lives);
        
        // 블러 효과 적용 (blur 효과가 활성화된 경우)
        if (this.effectManager.shouldBlur()) {
            this.ctx.filter = 'blur(3px)';
        }
        
        // 아레나 그리기 (격자, 테두리, 장식 패턴 포함)
        this.arena.draw(this.ctx, this.canvas.width, this.canvas.height);
        
        // 모든 활성화된 장애물들 그리기 (가시, 레이저, 폭탄, 하트 아이템)
        const obstacles = this.spawner.getActiveObstacles();
        obstacles.forEach(obstacle => {
            obstacle.draw(this.ctx, this.canvas.width, this.canvas.height);
        });
        
        // 플레이어 그리기 (무적 상태 시 깜빡임 효과 포함)
        this.player.draw(this.ctx, this.canvas.width, this.canvas.height);
        
        // 블러 효과 제거 (다음 프레임을 위해)
        this.ctx.filter = 'none';
        
        // 피해 이펙트 그리기 (화면 전체 빨간색 오버레이)
        this.player.drawDamageEffects(this.ctx, this.canvas.width, this.canvas.height);
    }
    
    drawScore() {
        const isDarkMode = !document.body.classList.contains('light-mode');
        
        // 점수 배수 계산
        const scoreMultiplier = Math.floor(this.level / 2) + 1;
        
        // 점수 텍스트
        this.ctx.font = 'bold 48px "Arial", sans-serif'; // Arial 폰트 사용
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = isDarkMode ? '#ffffff' : '#333333';
        
        // 텍스트 그림자 효과
        this.ctx.shadowColor = isDarkMode ? '#000000' : '#ffffff';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        // 점수 표시 (쉼표 제거)
        const scoreText = this.score.toString();
        this.ctx.fillText(scoreText, this.canvas.width / 2, 65);
        
        // 배수 텍스트 (점수 오른쪽에 작게, 간격 증가)
        const scoreWidth = this.ctx.measureText(scoreText).width;
        this.ctx.font = 'bold 24px "Arial", sans-serif';
        this.ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(51, 51, 51, 0.7)';
        this.ctx.fillText(`x${scoreMultiplier}`, this.canvas.width / 2 + scoreWidth / 2 + 25, 65); // 간격 25px
        
        // 그림자 리셋
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 텍스트 정렬 리셋
        this.ctx.textAlign = 'start';
    }
    
    gameLoop(currentTime = performance.now()) {
        if (this.gameState === 'playing') {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.draw();
            
            requestAnimationFrame((time) => this.gameLoop(time));
        } else if (this.gameState === 'paused') {
            // 일시정지 상태에서는 루프를 계속 돌리지 않음
            return;
        }
    }
}