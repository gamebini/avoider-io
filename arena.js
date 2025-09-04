// ===== ARENA.JS - 게임 아레나 시스템 =====
class Arena {
    constructor() {
        this.width = CONFIG.GRID.MIN_WIDTH;
        this.height = CONFIG.GRID.MIN_HEIGHT;
        this.cellSize = CONFIG.GRID.CELL_SIZE;
        this.borderWidth = CONFIG.GRID.BORDER_WIDTH;
        this.expandEffects = []; // 확장 이펙트 배열
        this.walls = []; // 벽 타일 배열
        this.currentLevel = 1;
    }
    
    updateSize(level) {
        const oldWidth = this.width;
        const oldHeight = this.height;
        
        if (level <= 3) {
            // 1차원 단계 (가로로 늘어남)
            this.width = Math.min(level + 2, 5);
            this.height = 1;
        } else if (level <= 7) {
            // 2차원 전환 (세로로 늘어남)
            this.width = 5;
            this.height = Math.min(level - 2, 5);
        } else {
            // 최대 복잡도
            this.width = 5;
            this.height = 5;
        }
        
        this.currentLevel = level;
        
        // 크기가 변경되면 확장 이펙트 생성
        if (oldWidth !== this.width || oldHeight !== this.height) {
            this.createExpandEffect();
        }
        // 맵 확장이 완료된 후에도 레벨업 시 확장 이펙트 표시
        else if (this.width === CONFIG.GRID.MAX_WIDTH && this.height === CONFIG.GRID.MAX_HEIGHT) {
            this.createExpandEffect();
        }
    }
    
    createWalls(count) {
        this.walls = [];
        const availablePositions = [];
        
        // 사용 가능한 모든 위치 수집
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                availablePositions.push({ x, y });
            }
        }
        
        // 랜덤하게 벽 위치 선택
        for (let i = 0; i < Math.min(count, availablePositions.length); i++) {
            const randomIndex = Utils.randomInt(0, availablePositions.length - 1);
            this.walls.push(availablePositions.splice(randomIndex, 1)[0]);
        }
    }
    
    clearWalls() {
        this.walls = [];
    }
    
    isWall(gridX, gridY) {
        return this.walls.some(wall => wall.x === gridX && wall.y === gridY);
    }
    
    createExpandEffect() {
        this.expandEffects.push({
            time: 0,
            duration: 300, // 0.3초로 단축
            intensity: 1.0
        });
    }
    
    update(deltaTime) {
        // 확장 이펙트 업데이트
        this.expandEffects = this.expandEffects.filter(effect => {
            effect.time += deltaTime;
            effect.intensity = 1 - (effect.time / effect.duration);
            return effect.time < effect.duration;
        });
    }
    
    getPixelWidth() {
        return this.width * this.cellSize;
    }
    
    getPixelHeight() {
        return this.height * this.cellSize;
    }
    
    getCenterX(canvasWidth) {
        return (canvasWidth - this.getPixelWidth()) / 2;
    }
    
    getCenterY(canvasHeight) {
        return (canvasHeight - this.getPixelHeight()) / 2 + 60; // 간격 45에서 60으로 증가
    }
    
    gridToPixel(gridX, gridY, canvasWidth, canvasHeight) {
        const centerX = this.getCenterX(canvasWidth);
        const centerY = this.getCenterY(canvasHeight);
        return {
            x: centerX + gridX * this.cellSize,
            y: centerY + gridY * this.cellSize
        };
    }
    
    isValidPosition(gridX, gridY) {
        return gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height && !this.isWall(gridX, gridY);
    }
    
    draw(ctx, canvasWidth, canvasHeight) {
        const centerX = this.getCenterX(canvasWidth);
        const centerY = this.getCenterY(canvasHeight);
        
        // 확장 이펙트 그리기 (배경)
        this.drawExpandEffects(ctx, centerX, centerY);
        
        // 아레나 테두리 (적당한 진한 색)
        const isDarkMode = !document.body.classList.contains('light-mode');
        ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = this.borderWidth;
        ctx.strokeRect(
            centerX - this.borderWidth,
            centerY - this.borderWidth,
            this.getPixelWidth() + this.borderWidth * 2,
            this.getPixelHeight() + this.borderWidth * 2
        );
        
        // 경계선 바깥 장식 패턴
        this.drawOuterDecorations(ctx, centerX, centerY, isDarkMode);
        
        // 벽 그리기
        this.drawWalls(ctx, canvasWidth, canvasHeight, isDarkMode);
        
        // 격자 선 (더 흐린 색)
        ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        // 세로 선
        for (let i = 1; i < this.width; i++) {
            const x = centerX + i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(x, centerY);
            ctx.lineTo(x, centerY + this.getPixelHeight());
            ctx.stroke();
        }
        
        // 가로 선
        for (let i = 1; i < this.height; i++) {
            const y = centerY + i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(centerX, y);
            ctx.lineTo(centerX + this.getPixelWidth(), y);
            ctx.stroke();
        }
    }
    
    drawOuterDecorations(ctx, centerX, centerY, isDarkMode) {
        const decorationColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
        const cornerSize = 15;
        const margin = 20;
        
        // 5x2부터 점선이 화려해짐 (삼각형 패턴 스타일)
        const isAdvanced = this.width === 5 && this.height >= 2;
        const level = Math.min(this.height, 5); // 레벨별 복잡도
        
        ctx.strokeStyle = decorationColor;
        ctx.lineWidth = 2;
        
        const outerLeft = centerX - this.borderWidth - margin;
        const outerRight = centerX + this.getPixelWidth() + this.borderWidth + margin;
        const outerTop = centerY - this.borderWidth - margin;
        const outerBottom = centerY + this.getPixelHeight() + this.borderWidth + margin;
        
        // 모서리 장식 (더 복잡한 형태)
        if (isAdvanced) {
            this.drawAdvancedCorners(ctx, outerLeft, outerRight, outerTop, outerBottom, cornerSize, level);
        } else {
            this.drawBasicCorners(ctx, outerLeft, outerRight, outerTop, outerBottom, cornerSize);
        }
        
        // 점선들 (레벨별 패턴)
        ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        if (isAdvanced) {
            this.drawAdvancedBorders(ctx, outerLeft, outerRight, outerTop, outerBottom, cornerSize, level);
        } else {
            this.drawBasicBorders(ctx, outerLeft, outerRight, outerTop, outerBottom, cornerSize);
        }
        
        ctx.setLineDash([]); // 점선 리셋
    }
    
    drawBasicCorners(ctx, left, right, top, bottom, cornerSize) {
        // 기본 ㄱ자 모양 모서리
        ctx.beginPath();
        ctx.moveTo(left, top + cornerSize);
        ctx.lineTo(left, top);
        ctx.lineTo(left + cornerSize, top);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(right - cornerSize, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, top + cornerSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(left, bottom - cornerSize);
        ctx.lineTo(left, bottom);
        ctx.lineTo(left + cornerSize, bottom);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(right - cornerSize, bottom);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right, bottom - cornerSize);
        ctx.stroke();
    }
    
    drawAdvancedCorners(ctx, left, right, top, bottom, cornerSize, level) {
        // 삼각형 패턴 스타일의 복잡한 모서리
        const complexity = Math.min(level - 1, 3); // 0~3 단계
        
        // 왼쪽 위 모서리
        ctx.beginPath();
        ctx.moveTo(left, top + cornerSize);
        ctx.lineTo(left, top);
        ctx.lineTo(left + cornerSize, top);
        ctx.stroke();
        
        // 추가 장식 선들
        for (let i = 1; i <= complexity; i++) {
            const offset = i * 3;
            ctx.beginPath();
            ctx.moveTo(left + offset, top + cornerSize - offset);
            ctx.lineTo(left + offset, top + offset);
            ctx.lineTo(left + cornerSize - offset, top + offset);
            ctx.stroke();
        }
        
        // 오른쪽 위 모서리
        ctx.beginPath();
        ctx.moveTo(right - cornerSize, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, top + cornerSize);
        ctx.stroke();
        
        for (let i = 1; i <= complexity; i++) {
            const offset = i * 3;
            ctx.beginPath();
            ctx.moveTo(right - offset, top + cornerSize - offset);
            ctx.lineTo(right - offset, top + offset);
            ctx.lineTo(right - cornerSize + offset, top + offset);
            ctx.stroke();
        }
        
        // 왼쪽 아래 모서리
        ctx.beginPath();
        ctx.moveTo(left, bottom - cornerSize);
        ctx.lineTo(left, bottom);
        ctx.lineTo(left + cornerSize, bottom);
        ctx.stroke();
        
        for (let i = 1; i <= complexity; i++) {
            const offset = i * 3;
            ctx.beginPath();
            ctx.moveTo(left + offset, bottom - cornerSize + offset);
            ctx.lineTo(left + offset, bottom - offset);
            ctx.lineTo(left + cornerSize - offset, bottom - offset);
            ctx.stroke();
        }
        
        // 오른쪽 아래 모서리
        ctx.beginPath();
        ctx.moveTo(right - cornerSize, bottom);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right, bottom - cornerSize);
        ctx.stroke();
        
        for (let i = 1; i <= complexity; i++) {
            const offset = i * 3;
            ctx.beginPath();
            ctx.moveTo(right - offset, bottom - cornerSize + offset);
            ctx.lineTo(right - offset, bottom - offset);
            ctx.lineTo(right - cornerSize + offset, bottom - offset);
            ctx.stroke();
        }
    }
    
    drawBasicBorders(ctx, left, right, top, bottom, cornerSize) {
        ctx.setLineDash([5, 5]);
        
        // 기본 점선들
        ctx.beginPath();
        ctx.moveTo(left + cornerSize + 10, top);
        ctx.lineTo(right - cornerSize - 10, top);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(left + cornerSize + 10, bottom);
        ctx.lineTo(right - cornerSize - 10, bottom);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(left, top + cornerSize + 10);
        ctx.lineTo(left, bottom - cornerSize - 10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(right, top + cornerSize + 10);
        ctx.lineTo(right, bottom - cornerSize - 10);
        ctx.stroke();
    }
    
    drawAdvancedBorders(ctx, left, right, top, bottom, cornerSize, level) {
        // 레벨별 점선 패턴
        const patterns = [
            [3, 3, 8, 3, 3, 8],           // 레벨 2
            [2, 2, 5, 2, 2, 5, 2, 2],    // 레벨 3
            [1, 2, 3, 1, 3, 2, 1, 5],    // 레벨 4
            [1, 1, 2, 1, 2, 1, 1, 3, 1, 1] // 레벨 5+
        ];
        
        const patternIndex = Math.min(level - 2, patterns.length - 1);
        ctx.setLineDash(patterns[patternIndex]);
        
        // 위쪽 점선 (여러 줄)
        for (let i = 0; i < Math.min(level - 1, 3); i++) {
            const yOffset = i * 2;
            ctx.beginPath();
            ctx.moveTo(left + cornerSize + 10, top - yOffset);
            ctx.lineTo(right - cornerSize - 10, top - yOffset);
            ctx.stroke();
        }
        
        // 아래쪽 점선 (여러 줄)
        for (let i = 0; i < Math.min(level - 1, 3); i++) {
            const yOffset = i * 2;
            ctx.beginPath();
            ctx.moveTo(left + cornerSize + 10, bottom + yOffset);
            ctx.lineTo(right - cornerSize - 10, bottom + yOffset);
            ctx.stroke();
        }
        
        // 왼쪽 점선 (여러 줄)
        for (let i = 0; i < Math.min(level - 1, 3); i++) {
            const xOffset = i * 2;
            ctx.beginPath();
            ctx.moveTo(left - xOffset, top + cornerSize + 10);
            ctx.lineTo(left - xOffset, bottom - cornerSize - 10);
            ctx.stroke();
        }
        
        // 오른쪽 점선 (여러 줄)
        for (let i = 0; i < Math.min(level - 1, 3); i++) {
            const xOffset = i * 2;
            ctx.beginPath();
            ctx.moveTo(right + xOffset, top + cornerSize + 10);
            ctx.lineTo(right + xOffset, bottom - cornerSize - 10);
            ctx.stroke();
        }
    }
    
    drawWalls(ctx, canvasWidth, canvasHeight, isDarkMode) {
        this.walls.forEach(wall => {
            const pos = this.gridToPixel(wall.x, wall.y, canvasWidth, canvasHeight);
            
            // 벽 타일 그리기
            ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(pos.x, pos.y, this.cellSize, this.cellSize);
            
            // 벽 패턴
            ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            
            // 대각선 패턴
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x + this.cellSize, pos.y + this.cellSize);
            ctx.moveTo(pos.x + this.cellSize, pos.y);
            ctx.lineTo(pos.x, pos.y + this.cellSize);
            ctx.stroke();
        });
    }
    
    // 톱니바퀴 충돌 체크
    getGearBounds(canvasWidth, canvasHeight) {
        return this.gears.map(gear => {
            const perimeter = (this.getPixelWidth() + this.getPixelHeight()) * 2;
            const currentDistance = gear.progress * perimeter;
            
            const centerX = this.getCenterX(canvasWidth);
            const centerY = this.getCenterY(canvasHeight);
            
            let x, y;
            const width = this.getPixelWidth();
            const height = this.getPixelHeight();
            
            if (currentDistance <= width) {
                x = centerX + currentDistance;
                y = centerY;
            } else if (currentDistance <= width + height) {
                x = centerX + width;
                y = centerY + (currentDistance - width);
            } else if (currentDistance <= width * 2 + height) {
                x = centerX + width - (currentDistance - width - height);
                y = centerY + height;
            } else {
                x = centerX;
                y = centerY + height - (currentDistance - width * 2 - height);
            }
            
            return {
                x: x - gear.size,
                y: y - gear.size,
                width: gear.size * 2,
                height: gear.size * 2
            };
        });
    }
    
    drawExpandEffects(ctx, centerX, centerY) {
        this.expandEffects.forEach(effect => {
            const alpha = effect.intensity * 0.4; // 투명도 감소
            const scale = 1 + (1 - effect.intensity) * 0.15; // 확장 크기 감소
            
            // 메인 확장 효과 (노란색 테두리)
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.lineWidth = this.borderWidth * 2; // 두께 감소
            
            const effectWidth = this.getPixelWidth() * scale;
            const effectHeight = this.getPixelHeight() * scale;
            const effectX = centerX - (effectWidth - this.getPixelWidth()) / 2 - this.borderWidth;
            const effectY = centerY - (effectHeight - this.getPixelHeight()) / 2 - this.borderWidth;
            
            ctx.strokeRect(
                effectX,
                effectY,
                effectWidth + this.borderWidth * 2,
                effectHeight + this.borderWidth * 2
            );
            
            // 추가 글로우 효과 (더 작은 반경)
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.2})`;
            ctx.lineWidth = this.borderWidth * 4; // 두께 감소
            
            const glowScale = 1 + (1 - effect.intensity) * 0.25; // 글로우 크기 감소
            const glowWidth = this.getPixelWidth() * glowScale;
            const glowHeight = this.getPixelHeight() * glowScale;
            const glowX = centerX - (glowWidth - this.getPixelWidth()) / 2 - this.borderWidth;
            const glowY = centerY - (glowHeight - this.getPixelHeight()) / 2 - this.borderWidth;
            
            ctx.strokeRect(
                glowX,
                glowY,
                glowWidth + this.borderWidth * 2,
                glowHeight + this.borderWidth * 2
            );
        });
    }
}