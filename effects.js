// ===== EFFECTS.JS - 효과 시스템 (픽셀 LED UI) =====
class EffectManager {
    constructor(arena) {
        this.arena = arena;
        this.effects = [];
        this.lastEffectTime = 0;
        this.currentEffect = null;
        this.effectStartTime = 0;
        this.controlsReversed = false;
        this.obstacleSlowdown = 1.0;
        this.blurEffect = false;
    }
    
    update(deltaTime, gameTime) {
        // 5x3부터 효과 시작
        if (this.arena.width !== 5 || this.arena.height < 3) {
            return;
        }
        
        // 10초마다 새로운 효과
        if (gameTime - this.lastEffectTime >= CONFIG.EFFECTS.INTERVAL) {
            this.activateRandomEffect();
            this.lastEffectTime = gameTime;
            this.effectStartTime = gameTime;
        }
        
        // 현재 효과 종료 체크 (3초 후)
        if (this.currentEffect && gameTime - this.effectStartTime >= CONFIG.EFFECTS.DURATION) {
            this.deactivateEffect();
        }
    }
    
    activateRandomEffect() {
        const effects = ['reverse', 'blur', 'slow', 'wall'];
        const selectedEffect = Utils.randomChoice(effects);
        
        this.currentEffect = selectedEffect;
        
        switch (selectedEffect) {
            case 'reverse':
                this.controlsReversed = true;
                break;
            case 'blur':
                this.blurEffect = true;
                break;
            case 'slow':
                this.obstacleSlowdown = 0.5; // 50% 속도
                break;
            case 'wall':
                const wallCount = Math.floor(this.arena.height); // N * 5에서 N개
                this.arena.createWalls(wallCount);
                break;
        }
    }
    
    deactivateEffect() {
        switch (this.currentEffect) {
            case 'reverse':
                this.controlsReversed = false;
                break;
            case 'blur':
                this.blurEffect = false;
                break;
            case 'slow':
                this.obstacleSlowdown = 1.0;
                break;
            case 'wall':
                this.arena.clearWalls();
                break;
        }
        this.currentEffect = null;
    }
    
    drawUI(ctx, canvasWidth, canvasHeight, playerLives) {
        // 점수와 격자 사이 위치 (중앙 배치)
        const scoreY = 65;
        const playgroundY = this.arena.getCenterY(canvasHeight);
        const uiY = scoreY + (playgroundY - scoreY) / 2;
        
        const isDarkMode = !document.body.classList.contains('light-mode');
        
        // 픽셀 LED 스타일 UI
        this.drawPixelLedUI(ctx, canvasWidth, uiY, isDarkMode, playerLives);
    }
    
    drawPixelLedUI(ctx, canvasWidth, centerY, isDarkMode, playerLives) {
        const barWidth = 400;
        const barHeight = 60;
        const startX = (canvasWidth - barWidth) / 2;
        
        // LED 패널 배경
        this.drawLedPanel(ctx, startX, centerY - barHeight/2, barWidth, barHeight, isDarkMode);
        
        // 구분선 위치 계산
        const dividerX = startX + barWidth/2;
        
        // 왼쪽: 효과 이름 텍스트 (LED 스타일)
        this.drawEffectText(ctx, startX + 10, centerY, barWidth/2 - 20, isDarkMode);
        
        // 중앙 구분선 (LED 스타일)
        this.drawLedDivider(ctx, dividerX, centerY - 20, 40, isDarkMode);
        
        // 오른쪽: 목숨 LED 디스플레이
        this.drawLifeLeds(ctx, dividerX + 10, centerY, barWidth/2 - 20, playerLives, isDarkMode);
    }
    
    drawLedPanel(ctx, x, y, width, height, isDarkMode) {
        // 패널 배경 (어두운 메탈릭)
        ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#2a2a2a';
        ctx.fillRect(x, y, width, height);
        
        // LED 매트릭스 도트 패턴
        const dotSize = 2;
        const dotSpacing = 4;
        
        ctx.fillStyle = isDarkMode ? '#333333' : '#444444';
        for (let dx = dotSpacing; dx < width; dx += dotSpacing) {
            for (let dy = dotSpacing; dy < height; dy += dotSpacing) {
                ctx.fillRect(x + dx, y + dy, dotSize, dotSize);
            }
        }
        
        // 패널 테두리 (메탈릭 프레임)
        ctx.strokeStyle = isDarkMode ? '#555555' : '#666666';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // 내부 테두리 (LED 영역)
        ctx.strokeStyle = isDarkMode ? '#444444' : '#555555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
    }
    
    drawEffectText(ctx, x, centerY, width, isDarkMode) {
        if (!this.currentEffect) {
            // 비활성 상태
            this.drawLedText(ctx, x, centerY, width, 'READY', '#333333', false);
            return;
        }
        
        // 효과별 색상과 텍스트
        const effectData = {
            'reverse': { text: 'REVERSE', color: '#ff3333' },
            'blur': { text: 'BLUR', color: '#3399ff' },
            'slow': { text: 'SLOW', color: '#ff9933' },
            'wall': { text: 'WALL', color: '#33ff33' }
        };
        
        const data = effectData[this.currentEffect];
        const isActive = true;
        
        this.drawLedText(ctx, x, centerY, width, data.text, data.color, isActive);
    }
    
    drawLedText(ctx, x, centerY, width, text, color, isActive) {
        // LED 스타일 텍스트 렌더링
        const charWidth = 14;
        const charHeight = 21;
        const charSpacing = 2;
        const totalWidth = text.length * (charWidth + charSpacing) - charSpacing;
        const startX = x + (width - totalWidth) / 2;
        const startY = centerY - charHeight / 2;
        
        // 깜빡임 효과 (활성 상태일 때)
        const alpha = isActive ? (0.8 + 0.2 * Math.sin(Date.now() * 0.01)) : 0.3;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charX = startX + i * (charWidth + charSpacing);
            
            this.drawLedCharacter(ctx, charX, startY, charWidth, charHeight, char, color, alpha);
        }
    }
    
    drawLedCharacter(ctx, x, y, width, height, char, color, alpha) {
        // 5x7 픽셀 문자 패턴
        const patterns = {
            'R': [
                [1,1,1,1,0],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,1,1,1,0],
                [1,0,1,0,0],
                [1,0,0,1,0],
                [1,0,0,0,1]
            ],
            'E': [
                [1,1,1,1,1],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,1,1,1,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,1,1,1,1]
            ],
            'V': [
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [0,1,0,1,0],
                [0,1,0,1,0],
                [0,0,1,0,0]
            ],
            'S': [
                [0,1,1,1,1],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [0,1,1,1,0],
                [0,0,0,0,1],
                [0,0,0,0,1],
                [1,1,1,1,0]
            ],
            'B': [
                [1,1,1,1,0],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,1,1,1,0],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,1,1,1,0]
            ],
            'L': [
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,1,1,1,1]
            ],
            'U': [
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [0,1,1,1,0]
            ],
            'W': [
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,1,0,1],
                [1,0,1,0,1],
                [1,1,0,1,1],
                [1,0,0,0,1]
            ],
            'A': [
                [0,1,1,1,0],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,1,1,1,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1]
            ],
            'O': [
                [0,1,1,1,0],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [0,1,1,1,0]
            ],
            'Y': [
                [1,0,0,0,1],
                [1,0,0,0,1],
                [0,1,0,1,0],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [0,0,1,0,0]
            ],
            'D': [
                [1,1,1,1,0],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,1,1,1,0]
            ],
            ' ': [
                [0,0,0,0,0],
                [0,0,0,0,0],
                [0,0,0,0,0],
                [0,0,0,0,0],
                [0,0,0,0,0],
                [0,0,0,0,0],
                [0,0,0,0,0]
            ]
        };
        
        const pattern = patterns[char] || patterns[' '];
        
        // 픽셀 크기를 직접 전달받은 width, height 기준으로 계산
        const pixelWidth = width / 5;   // 5개 열
        const pixelHeight = height / 7; // 7개 행
        
        // 문자별 LED 픽셀 그리기
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                if (pattern[row][col]) {
                    const pixelX = x + col * pixelWidth;
                    const pixelY = y + row * pixelHeight;
                    
                    // LED 픽셀 (글로우 효과)
                    ctx.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
                    ctx.fillRect(pixelX, pixelY, pixelWidth - 0.5, pixelHeight - 0.5);
                    
                    // 밝은 중심점
                    if (alpha > 0.5) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha - 0.5) * 0.6})`;
                        ctx.fillRect(
                            pixelX + pixelWidth * 0.3, 
                            pixelY + pixelHeight * 0.3, 
                            pixelWidth * 0.4, 
                            pixelHeight * 0.4
                        );
                    }
                }
            }
        }
    }
    
    drawLedDivider(ctx, x, y, height, isDarkMode) {
        // 수직 LED 바 (분리선)
        const ledHeight = 3;
        const ledSpacing = 2;
        const numLeds = Math.floor(height / (ledHeight + ledSpacing));
        
        for (let i = 0; i < numLeds; i++) {
            const ledY = y + i * (ledHeight + ledSpacing);
            const alpha = 0.4 + 0.3 * Math.sin(Date.now() * 0.005 + i * 0.5);
            
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.fillRect(x - 1, ledY, 3, ledHeight);
        }
    }
    
    drawLifeLeds(ctx, x, centerY, width, playerLives, isDarkMode) {
        // 목숨 LED 디스플레이
        const ledSize = 6;
        const ledSpacing = 8;
        const heartWidth = 7 * ledSize;
        const totalWidth = 3 * heartWidth + 2 * ledSpacing;
        const startX = x + (width - totalWidth) / 2;
        
        for (let i = 0; i < 3; i++) {
            const heartX = startX + i * (heartWidth + ledSpacing);
            const isAlive = i < playerLives;
            
            this.drawLedHeart(ctx, heartX, centerY - heartWidth/2, ledSize, isAlive);
        }
    }
    
    drawLedHeart(ctx, x, y, ledSize, isAlive) {
        // LED 하트 패턴 (7x6)
        const heartPattern = [
            [0,1,1,0,1,1,0],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0],
            [0,0,0,1,0,0,0]
        ];
        
        for (let row = 0; row < heartPattern.length; row++) {
            for (let col = 0; col < heartPattern[row].length; col++) {
                if (heartPattern[row][col]) {
                    const pixelX = x + col * ledSize;
                    const pixelY = y + row * ledSize;
                    
                    if (isAlive) {
                        // 살아있는 하트 (빨간색 LED + 펄스)
                        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.008);
                        ctx.fillStyle = `rgba(255, 0, 100, ${pulse})`;
                        ctx.fillRect(pixelX, pixelY, ledSize - 1, ledSize - 1);
                        
                        // 밝은 중심점
                        ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.4})`;
                        ctx.fillRect(
                            pixelX + ledSize * 0.3, 
                            pixelY + ledSize * 0.3, 
                            ledSize * 0.4, 
                            ledSize * 0.4
                        );
                    } else {
                        // 죽은 하트 (더 어두운 LED)
                        ctx.fillStyle = 'rgba(60, 30, 30, 0.2)'; // 더 어둡게 (100,50,50,0.3 → 60,30,30,0.2)
                        ctx.fillRect(pixelX, pixelY, ledSize - 1, ledSize - 1);
                    }
                }
            }
        }
    }
    
    // 게임 로직에서 사용할 헬퍼 메서드들
    shouldReverseControls() {
        return this.controlsReversed;
    }
    
    getObstacleSpeedMultiplier() {
        return this.obstacleSlowdown;
    }
    
    shouldBlur() {
        return this.blurEffect;
    }
    
    reset() {
        this.deactivateEffect();
        this.effects = [];
        this.lastEffectTime = 0;
        this.currentEffect = null;
        this.effectStartTime = 0;
    }
}