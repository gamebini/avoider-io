// ===== EFFECTS.JS - 효과 시스템 =====
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
    
    drawEffectIconsAndLives(ctx, canvasWidth, canvasHeight, playerLives) {
        // 5x3 조건 제거하여 항상 표시되도록 수정
        
        // 점수와 플레이그라운드 사이에 위치
        const centerX = canvasWidth / 2;
        const scoreY = 65;
        const playgroundY = this.arena.getCenterY(canvasHeight);
        const iconY = scoreY + (playgroundY - scoreY) / 2;
        
        const isDarkMode = !document.body.classList.contains('light-mode');
        const iconSize = CONFIG.EFFECTS.ICON_SIZE;
        const spacing = iconSize + 10; // 아이콘 간격
        const totalWidth = spacing * 7 - 10; // 전체 너비 (효과 4개 + 구분선 + 목숨 3개)
        
        // 시작 X 위치
        let startX = centerX - totalWidth / 2;
        
        // 효과 아이콘들 (왼쪽)
        const effects = ['reverse', 'blur', 'slow', 'wall'];
        effects.forEach((effect, index) => {
            const iconX = startX + index * spacing;
            const isActive = this.currentEffect === effect;
            
            this.drawSingleEffectIcon(ctx, effect, iconX, iconY - iconSize / 2, iconSize, isDarkMode, isActive);
        });
        
        // 구분선
        const separatorX = startX + 4 * spacing - 5;
        ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(separatorX, iconY - iconSize / 2);
        ctx.lineTo(separatorX, iconY + iconSize / 2);
        ctx.stroke();
        
        // 목숨 (오른쪽)
        for (let i = 0; i < 3; i++) {
            const heartX = startX + (5 + i) * spacing;
            const isAlive = i < playerLives;
            
            this.drawHeart(ctx, heartX, iconY - iconSize / 2, iconSize, isDarkMode, isAlive);
        }
    }
    
    drawSingleEffectIcon(ctx, effectType, x, y, size, isDarkMode, isActive) {
        const alpha = isActive ? 1.0 : 0.3; // 활성화 시 불투명, 비활성화 시 반투명
        
        // 배경 그라데이션 효과 - 작아진 크기에 맞게 조정
        const gradient = ctx.createRadialGradient(
            x + size / 2, y + size / 2, 3, // 내부 반지름 축소
            x + size / 2, y + size / 2, size * 0.8 // 외부 반지름도 조정
        );
        
        if (isDarkMode) {
            gradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 * alpha})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${0.1 * alpha})`);
        } else {
            gradient.addColorStop(0, `rgba(0, 0, 0, ${0.3 * alpha})`);
            gradient.addColorStop(1, `rgba(0, 0, 0, ${0.1 * alpha})`);
        }
        
        // 둥근 배경 - 패딩 감소
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x - 6, y - 6, size + 12, size + 12, 8); // 패딩 8에서 6으로, 반지름 12에서 8로
        ctx.fill();
        
        // 얇은 테두리
        ctx.strokeStyle = isDarkMode ? `rgba(255, 255, 255, ${0.4 * alpha})` : `rgba(0, 0, 0, ${0.4 * alpha})`;
        ctx.lineWidth = 1.5; // 선 두께 조정
        ctx.stroke();
        
        // 펄스 효과 (활성화된 것만)
        let pulseAlpha = alpha;
        if (isActive) {
            const time = Date.now() * 0.003;
            pulseAlpha = alpha * (0.7 + 0.3 * Math.sin(time));
        }
        
        // 아이콘 그리기
        ctx.fillStyle = isDarkMode ? `rgba(255, 255, 255, ${pulseAlpha})` : `rgba(0, 0, 0, ${pulseAlpha})`;
        ctx.strokeStyle = isDarkMode ? `rgba(255, 255, 255, ${pulseAlpha})` : `rgba(0, 0, 0, ${pulseAlpha})`;
        
        switch (effectType) {
            case 'reverse':
                this.drawReverseIcon(ctx, x, y, size);
                break;
            case 'blur':
                this.drawBlurIcon(ctx, x, y, size);
                break;
            case 'slow':
                this.drawSlowIcon(ctx, x, y, size);
                break;
            case 'wall':
                this.drawWallIcon(ctx, x, y, size);
                break;
        }
    }
    
    drawHeart(ctx, x, y, size, isDarkMode, isAlive) {
        const alpha = isAlive ? 1.0 : 0.3; // 살아있으면 불투명, 죽으면 반투명
        
        // 하트 모양을 픽셀로 그리기
        const heartPattern = [
            [0,1,1,0,1,1,0],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0],
            [0,0,0,1,0,0,0]
        ];
        
        const pixelSize = size / 7;
        const startX = x;
        const startY = y;
        
        ctx.fillStyle = `rgba(255, 20, 147, ${alpha})`; // #ff1493 with alpha
        
        for (let row = 0; row < heartPattern.length; row++) {
            for (let col = 0; col < heartPattern[row].length; col++) {
                if (heartPattern[row][col]) {
                    ctx.fillRect(
                        startX + col * pixelSize,
                        startY + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        
        // 하트 테두리
        ctx.strokeStyle = isDarkMode ? `rgba(255, 255, 255, ${alpha * 0.5})` : `rgba(0, 0, 0, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, startY, size, size);
    }
    
    drawReverseIcon(ctx, x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        // 두 개의 곡선 화살표 (교차하는 형태)
        ctx.lineWidth = 3;
        
        // 첫 번째 화살표 (왼쪽에서 오른쪽으로 곡선)
        ctx.beginPath();
        ctx.moveTo(x + size * 0.2, centerY - size * 0.1);
        ctx.quadraticCurveTo(centerX, centerY - size * 0.3, x + size * 0.8, centerY - size * 0.1);
        ctx.stroke();
        
        // 첫 번째 화살표 머리
        ctx.beginPath();
        ctx.moveTo(x + size * 0.8, centerY - size * 0.1);
        ctx.lineTo(x + size * 0.7, centerY - size * 0.2);
        ctx.lineTo(x + size * 0.7, centerY);
        ctx.fill();
        
        // 두 번째 화살표 (오른쪽에서 왼쪽으로 곡선)
        ctx.beginPath();
        ctx.moveTo(x + size * 0.8, centerY + size * 0.1);
        ctx.quadraticCurveTo(centerX, centerY + size * 0.3, x + size * 0.2, centerY + size * 0.1);
        ctx.stroke();
        
        // 두 번째 화살표 머리
        ctx.beginPath();
        ctx.moveTo(x + size * 0.2, centerY + size * 0.1);
        ctx.lineTo(x + size * 0.3, centerY + size * 0.2);
        ctx.lineTo(x + size * 0.3, centerY);
        ctx.fill();
    }
    
    drawBlurIcon(ctx, x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        // 흐린 원들 (여러 겹)
        for (let i = 0; i < 4; i++) {
            const radius = size * (0.1 + i * 0.08);
            const offsetX = (i - 1.5) * size * 0.15;
            const offsetY = Math.sin(i) * size * 0.1;
            
            ctx.globalAlpha = (0.3 + i * 0.2) * parseFloat(ctx.fillStyle.match(/[\d\.]+(?=\))/g).pop() || 1);
            ctx.beginPath();
            ctx.arc(centerX + offsetX, centerY + offsetY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
    
    drawSlowIcon(ctx, x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        // 시계 모양
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        
        // 시침 (짧은 바늘)
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - size * 0.2);
        ctx.stroke();
        
        // 분침 (긴 바늘)
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + size * 0.25, centerY);
        ctx.stroke();
        
        // 중앙 점
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawWallIcon(ctx, x, y, size) {
        // 더 간단하고 명확한 벽 패턴
        const blockSize = size / 5;
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                // 체크보드 패턴
                if ((row + col) % 2 === 0) {
                    const blockX = x + col * blockSize;
                    const blockY = y + row * blockSize;
                    
                    ctx.fillRect(blockX, blockY, blockSize, blockSize);
                    
                    // 작은 테두리
                    const currentAlpha = parseFloat(ctx.strokeStyle.match(/[\d\.]+(?=\))/g).pop() || 1);
                    ctx.strokeStyle = `rgba(102, 102, 102, ${currentAlpha})`;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(blockX, blockY, blockSize, blockSize);
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