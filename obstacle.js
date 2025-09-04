// ===== OBSTACLE.JS - 장애물 클래스들 =====
class Spike {
    constructor(startX, startY, targetX, targetY, arena, level) {
        this.startGridX = startX;
        this.startGridY = startY;
        this.targetGridX = targetX;
        this.targetGridY = targetY;
        this.arena = arena;
        
        // 레벨에 따른 속도 조정 (최고 난이도 이후 점진적 증가)
        if (level <= 3) this.speed = CONFIG.SPIKE_SPEED.EASY;
        else if (level <= 7) this.speed = CONFIG.SPIKE_SPEED.NORMAL;
        else if (level <= 12) this.speed = CONFIG.SPIKE_SPEED.HARD;
        else {
            const extraLevels = level - 12;
            const speedIncrease = extraLevels * 0.1; // 레벨당 0.1씩 증가
            this.speed = CONFIG.SPIKE_SPEED.EXTREME + speedIncrease;
        }
        
        this.size = CONFIG.OBSTACLES.SPIKE_SIZE;
        this.progress = 0;
        this.showPath = true;
        this.active = true;
        this.delayTime = 0;
        this.isMoving = false; // 이동 중인지 여부
        this.soundPlayed = false; // 사운드 재생 여부
        
        // 방향 계산
        this.directionX = Math.sign(targetX - startX);
        this.directionY = Math.sign(targetY - startY);
    }
    
    update(deltaTime) {
        if (!this.isMoving) {
            // 지연 시간 대기
            this.delayTime += deltaTime;
            if (this.delayTime >= CONFIG.OBSTACLES.SPIKE_DELAY) {
                this.isMoving = true;
                this.showPath = false; // 이동 시작하면 경로 숨김
                
                // 가시 발사 사운드
                if (!this.soundPlayed && typeof soundManager !== 'undefined') {
                    soundManager.playSpikeSound();
                    this.soundPlayed = true;
                }
            }
        } else {
            // 실제 이동
            this.progress += this.speed * deltaTime / 1000;
            
            if (this.progress >= 1) {
                this.active = false;
            }
        }
    }
    
    getCurrentPixelPos(canvasWidth, canvasHeight) {
        const currentGridX = this.startGridX + (this.targetGridX - this.startGridX) * this.progress;
        const currentGridY = this.startGridY + (this.targetGridY - this.startGridY) * this.progress;
        
        const pos = this.arena.gridToPixel(currentGridX, currentGridY, canvasWidth, canvasHeight);
        return {
            x: pos.x + CONFIG.GRID.CELL_SIZE / 2,
            y: pos.y + CONFIG.GRID.CELL_SIZE / 2
        };
    }
    
    getBounds(canvasWidth, canvasHeight) {
        const pos = this.getCurrentPixelPos(canvasWidth, canvasHeight);
        const halfSize = this.size / 2;
        return {
            x: pos.x - halfSize,
            y: pos.y - halfSize,
            width: this.size,
            height: this.size
        };
    }
    
    drawPath(ctx, canvasWidth, canvasHeight) {
        if (!this.showPath) return;
        
        const startPos = this.arena.gridToPixel(this.startGridX, this.startGridY, canvasWidth, canvasHeight);
        const endPos = this.arena.gridToPixel(this.targetGridX, this.targetGridY, canvasWidth, canvasHeight);
        
        const startCenterX = startPos.x + CONFIG.GRID.CELL_SIZE / 2;
        const startCenterY = startPos.y + CONFIG.GRID.CELL_SIZE / 2;
        const endCenterX = endPos.x + CONFIG.GRID.CELL_SIZE / 2;
        const endCenterY = endPos.y + CONFIG.GRID.CELL_SIZE / 2;
        
        // 점선 경로
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(startCenterX, startCenterY);
        ctx.lineTo(endCenterX, endCenterY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 화살표
        const angle = Math.atan2(endCenterY - startCenterY, endCenterX - startCenterX);
        const arrowSize = 15;
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(endCenterX, endCenterY);
        ctx.lineTo(
            endCenterX - arrowSize * Math.cos(angle - Math.PI / 6),
            endCenterY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endCenterX - arrowSize * Math.cos(angle + Math.PI / 6),
            endCenterY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }
    
    draw(ctx, canvasWidth, canvasHeight) {
        this.drawPath(ctx, canvasWidth, canvasHeight);
        
        if (!this.isMoving || this.progress >= 1) return;
        
        const pos = this.getCurrentPixelPos(canvasWidth, canvasHeight);
        
        // 픽셀 아트 스타일 가시
        ctx.fillStyle = '#ff0000';
        
        const size = this.size;
        const halfSize = size / 2;
        const pixelSize = 3; // 픽셀 크기
        
        // 가시 패턴 (삼각형을 픽셀로 표현)
        let spikePattern = [];
        
        if (this.directionX > 0) {
            // 오른쪽으로 향하는 가시 (오른쪽이 뾰족)
            spikePattern = [
                [1,1,0,0,0,0,0,0,0],
                [1,1,1,1,0,0,0,0,0],
                [1,1,1,1,1,1,0,0,0],
                [1,1,1,1,1,1,1,1,0],
                [1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,0],
                [1,1,1,1,1,1,0,0,0],
                [1,1,1,1,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0]
            ];
        } else if (this.directionX < 0) {
            // 왼쪽으로 향하는 가시 (왼쪽이 뾰족)
            spikePattern = [
                [0,0,0,0,0,0,0,1,1],
                [0,0,0,0,1,1,1,1,1],
                [0,0,1,1,1,1,1,1,1],
                [0,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1],
                [0,1,1,1,1,1,1,1,1],
                [0,0,1,1,1,1,1,1,1],
                [0,0,0,0,1,1,1,1,1],
                [0,0,0,0,0,0,0,1,1]
            ];
        } else if (this.directionY > 0) {
            // 아래로 향하는 가시 (아래쪽이 뾰족)
            spikePattern = [
                [1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1],
                [0,1,1,1,1,1,1,1,0],
                [0,1,1,1,1,1,1,1,0],
                [0,0,1,1,1,1,1,0,0],
                [0,0,1,1,1,1,1,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,0,1,0,0,0,0]
            ];
        } else {
            // 위로 향하는 가시 (위쪽이 뾰족)
            spikePattern = [
                [0,0,0,0,1,0,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,1,1,1,1,1,0,0],
                [0,0,1,1,1,1,1,0,0],
                [0,1,1,1,1,1,1,1,0],
                [0,1,1,1,1,1,1,1,0],
                [1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1]
            ];
        }
        
        const startX = pos.x - (spikePattern[0].length * pixelSize) / 2;
        const startY = pos.y - (spikePattern.length * pixelSize) / 2;
        
        for (let y = 0; y < spikePattern.length; y++) {
            for (let x = 0; x < spikePattern[y].length; x++) {
                if (spikePattern[y][x]) {
                    ctx.fillRect(
                        startX + x * pixelSize,
                        startY + y * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }
}

class Bomb {
    constructor(startX, startY, targetX, targetY, arena, level) {
        this.startGridX = startX;
        this.startGridY = startY;
        this.targetGridX = targetX;
        this.targetGridY = targetY;
        this.arena = arena;
        
        // 레벨에 따른 속도 조정
        if (level <= 3) this.speed = CONFIG.SPIKE_SPEED.EASY;
        else if (level <= 7) this.speed = CONFIG.SPIKE_SPEED.NORMAL;
        else if (level <= 12) this.speed = CONFIG.SPIKE_SPEED.HARD;
        else this.speed = CONFIG.SPIKE_SPEED.EXTREME;
        
        this.size = CONFIG.OBSTACLES.BOMB_SIZE;
        this.progress = 0;
        this.showPath = true;
        this.active = true;
        this.exploded = false;
        this.explosionTime = 0;
        this.explosionDuration = 500; // 폭발 지속 시간
        this.explosionCells = []; // 폭발 영향 범위
        this.explosionSoundPlayed = false; // 폭발 사운드 재생 여부 추가
        
        // 방향 계산
        this.directionX = Math.sign(targetX - startX);
        this.directionY = Math.sign(targetY - startY);
    }
    
    update(deltaTime) {
        if (!this.exploded) {
            this.progress += this.speed * deltaTime / 1000;
            
            // 벽에 닿으면 폭발
            if (this.progress >= 1) {
                this.explode();
            }
        } else {
            this.explosionTime += deltaTime;
            if (this.explosionTime >= this.explosionDuration) {
                this.active = false;
            }
        }
    }
    
    explode() {
        this.exploded = true;
        this.showPath = false;
        
        // 폭발 사운드 재생 (한 번만)
        if (!this.explosionSoundPlayed && typeof soundManager !== 'undefined') {
            soundManager.playBoomSound();
            this.explosionSoundPlayed = true;
        }
        
        // 폭발 위치 계산 (벽에 닿기 직전 위치)
        const explosionGridX = Math.round(this.startGridX + (this.targetGridX - this.startGridX) * 0.9);
        const explosionGridY = Math.round(this.startGridY + (this.targetGridY - this.startGridY) * 0.9);
        
        // 폭발 범위 계산 (3x3 영역)
        this.explosionCells = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const cellX = explosionGridX + dx;
                const cellY = explosionGridY + dy;
                if (this.arena.isValidPosition(cellX, cellY)) {
                    this.explosionCells.push({ x: cellX, y: cellY });
                }
            }
        }
    }
    
    getCurrentPixelPos(canvasWidth, canvasHeight) {
        if (this.exploded) {
            // 폭발한 경우 폭발 위치
            const explosionGridX = this.startGridX + (this.targetGridX - this.startGridX) * 0.9;
            const explosionGridY = this.startGridY + (this.targetGridY - this.startGridY) * 0.9;
            const pos = this.arena.gridToPixel(explosionGridX, explosionGridY, canvasWidth, canvasHeight);
            return {
                x: pos.x + CONFIG.GRID.CELL_SIZE / 2,
                y: pos.y + CONFIG.GRID.CELL_SIZE / 2
            };
        } else {
            const currentGridX = this.startGridX + (this.targetGridX - this.startGridX) * this.progress;
            const currentGridY = this.startGridY + (this.targetGridY - this.startGridY) * this.progress;
            
            const pos = this.arena.gridToPixel(currentGridX, currentGridY, canvasWidth, canvasHeight);
            return {
                x: pos.x + CONFIG.GRID.CELL_SIZE / 2,
                y: pos.y + CONFIG.GRID.CELL_SIZE / 2
            };
        }
    }
    
    getBounds(canvasWidth, canvasHeight) {
        if (this.exploded) {
            // 폭발 시 여러 셀에 대한 충돌 영역
            return this.explosionCells.map(cell => {
                const pos = this.arena.gridToPixel(cell.x, cell.y, canvasWidth, canvasHeight);
                return {
                    x: pos.x,
                    y: pos.y,
                    width: CONFIG.GRID.CELL_SIZE,
                    height: CONFIG.GRID.CELL_SIZE
                };
            });
        } else {
            // 폭탄 투사체는 충돌하지 않음 (null 반환)
            return null;
        }
    }
    
    drawPath(ctx, canvasWidth, canvasHeight) {
        if (!this.showPath) return;
        
        const startPos = this.arena.gridToPixel(this.startGridX, this.startGridY, canvasWidth, canvasHeight);
        const endPos = this.arena.gridToPixel(this.targetGridX, this.targetGridY, canvasWidth, canvasHeight);
        
        const startCenterX = startPos.x + CONFIG.GRID.CELL_SIZE / 2;
        const startCenterY = startPos.y + CONFIG.GRID.CELL_SIZE / 2;
        const endCenterX = endPos.x + CONFIG.GRID.CELL_SIZE / 2;
        const endCenterY = endPos.y + CONFIG.GRID.CELL_SIZE / 2;
        
        // 점선 경로 (주황색)
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(startCenterX, startCenterY);
        ctx.lineTo(endCenterX, endCenterY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 화살표
        const angle = Math.atan2(endCenterY - startCenterY, endCenterX - startCenterX);
        const arrowSize = 12;
        
        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(endCenterX, endCenterY);
        ctx.lineTo(
            endCenterX - arrowSize * Math.cos(angle - Math.PI / 6),
            endCenterY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endCenterX - arrowSize * Math.cos(angle + Math.PI / 6),
            endCenterY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }
    
    draw(ctx, canvasWidth, canvasHeight) {
        this.drawPath(ctx, canvasWidth, canvasHeight);
        
        if (this.exploded) {
            this.drawExplosion(ctx, canvasWidth, canvasHeight);
        } else {
            this.drawBomb(ctx, canvasWidth, canvasHeight);
        }
    }
    
    drawBomb(ctx, canvasWidth, canvasHeight) {
        const pos = this.getCurrentPixelPos(canvasWidth, canvasHeight);
        
        // 픽셀 아트 스타일 폭탄
        const bombPattern = [
            [0,0,0,1,1,1,0,0,0],
            [0,0,1,2,2,2,1,0,0],
            [0,1,2,2,2,2,2,1,0],
            [1,2,2,3,2,3,2,2,1],
            [1,2,2,2,2,2,2,2,1],
            [1,2,3,2,2,2,3,2,1],
            [1,2,2,2,2,2,2,2,1],
            [0,1,2,2,2,2,2,1,0],
            [0,0,1,1,1,1,1,0,0]
        ];
        
        const pixelSize = this.size / 9;
        const startX = pos.x - this.size / 2;
        const startY = pos.y - this.size / 2;
        
        // 색상 매핑
        const colors = {
            0: null, // 투명
            1: '#333333', // 어두운 회색 (외곽)
            2: '#666666', // 회색 (몸체)
            3: '#ffffff'  // 흰색 (하이라이트)
        };
        
        for (let y = 0; y < bombPattern.length; y++) {
            for (let x = 0; x < bombPattern[y].length; x++) {
                const colorIndex = bombPattern[y][x];
                if (colorIndex !== 0) {
                    ctx.fillStyle = colors[colorIndex];
                    ctx.fillRect(
                        startX + x * pixelSize,
                        startY + y * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        
        // 도화선 (깜빡이는 효과)
        const fuseTime = Date.now() * 0.01;
        if (Math.sin(fuseTime) > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(startX + 4 * pixelSize, startY - pixelSize, pixelSize, pixelSize);
        }
    }
    
    drawExplosion(ctx, canvasWidth, canvasHeight) {
        const explosionProgress = this.explosionTime / this.explosionDuration;
        const alpha = 1 - explosionProgress;
        
        // 폭발 효과 그리기
        this.explosionCells.forEach(cell => {
            const pos = this.arena.gridToPixel(cell.x, cell.y, canvasWidth, canvasHeight);
            
            // 폭발 애니메이션 (여러 색상 레이어)
            const colors = [
                `rgba(255, 255, 255, ${alpha * 0.8})`, // 흰색 중심
                `rgba(255, 255, 0, ${alpha * 0.6})`,   // 노란색
                `rgba(255, 165, 0, ${alpha * 0.4})`,   // 주황색
                `rgba(255, 0, 0, ${alpha * 0.2})`      // 빨간색 외곽
            ];
            
            colors.forEach((color, index) => {
                ctx.fillStyle = color;
                const offset = index * 5;
                ctx.fillRect(
                    pos.x - offset,
                    pos.y - offset,
                    CONFIG.GRID.CELL_SIZE + offset * 2,
                    CONFIG.GRID.CELL_SIZE + offset * 2
                );
            });
        });
    }
}

class Laser {
    constructor(gridX, gridY, direction, arena) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.direction = direction; // 'horizontal' or 'vertical'
        this.arena = arena;
        this.phase = 'warning'; // 'warning', 'firing', 'done'
        this.warningTime = 0;
        this.firingTime = 0;
        this.totalTime = 0;
        this.active = true;
        this.cannonSize = CONFIG.OBSTACLES.CANNON_SIZE;
        this.chargeSoundPlayed = false; // 차지 사운드 재생 여부
        this.laserSoundPlayed = false; // 레이저 발사 사운드 재생 여부
    }
    
    update(deltaTime) {
        this.totalTime += deltaTime;
        
        if (this.phase === 'warning') {
            // 경고 시작 시 차지 사운드 재생 (한 번만)
            if (!this.chargeSoundPlayed && typeof soundManager !== 'undefined') {
                soundManager.playLaserChargeSound();
                this.chargeSoundPlayed = true;
            }
            
            this.warningTime += deltaTime;
            if (this.warningTime >= CONFIG.LASER.WARNING_TIME) {
                this.phase = 'firing';
                
                // 레이저 발사 사운드 재생 (한 번만)
                if (!this.laserSoundPlayed && typeof soundManager !== 'undefined') {
                    soundManager.playLaserSound();
                    this.laserSoundPlayed = true;
                }
            }
        } else if (this.phase === 'firing') {
            this.firingTime += deltaTime;
            if (this.firingTime >= CONFIG.LASER.FIRE_TIME) {
                this.phase = 'done';
            }
        }
        
        if (this.totalTime >= CONFIG.LASER.LIFETIME) {
            this.active = false;
        }
    }
    
    getBounds(canvasWidth, canvasHeight) {
        if (this.phase !== 'firing') return null;
        
        const pos = this.arena.gridToPixel(0, 0, canvasWidth, canvasHeight);
        
        if (this.direction === 'horizontal') {
            const y = pos.y + this.gridY * CONFIG.GRID.CELL_SIZE;
            return {
                x: pos.x,
                y: y,
                width: this.arena.getPixelWidth(),
                height: CONFIG.GRID.CELL_SIZE
            };
        } else {
            const x = pos.x + this.gridX * CONFIG.GRID.CELL_SIZE;
            return {
                x: x,
                y: pos.y,
                width: CONFIG.GRID.CELL_SIZE,
                height: this.arena.getPixelHeight()
            };
        }
    }
    
    getCannonPos(canvasWidth, canvasHeight) {
        const centerX = this.arena.getCenterX(canvasWidth);
        const centerY = this.arena.getCenterY(canvasHeight);
        
        if (this.direction === 'horizontal') {
            if (this.gridX === -1) {
                // 왼쪽에서 발사
                return {
                    x: centerX - this.cannonSize - 5,
                    y: centerY + this.gridY * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2 - this.cannonSize / 2
                };
            } else {
                // 오른쪽에서 발사
                return {
                    x: centerX + this.arena.getPixelWidth() + 5,
                    y: centerY + this.gridY * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2 - this.cannonSize / 2
                };
            }
        } else {
            if (this.gridY === -1) {
                // 위에서 발사
                return {
                    x: centerX + this.gridX * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2 - this.cannonSize / 2,
                    y: centerY - this.cannonSize - 5
                };
            } else {
                // 아래에서 발사
                return {
                    x: centerX + this.gridX * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2 - this.cannonSize / 2,
                    y: centerY + this.arena.getPixelHeight() + 5
                };
            }
        }
    }
    
    draw(ctx, canvasWidth, canvasHeight) {
        // 픽셀 아트 스타일 캐논 그리기
        const cannonPos = this.getCannonPos(canvasWidth, canvasHeight);
        
        // 고퀄리티 픽셀 레이저 캐논 패턴
        const cannonPattern = [
            [0,0,1,1,1,1,1,0,0],
            [0,1,2,2,2,2,2,1,0],
            [1,2,3,3,3,3,3,2,1],
            [1,2,3,4,4,4,3,2,1],
            [1,2,3,4,4,4,3,2,1],
            [1,2,3,4,4,4,3,2,1],
            [1,2,3,3,3,3,3,2,1],
            [0,1,2,2,2,2,2,1,0],
            [0,0,1,1,1,1,1,0,0]
        ];
        
        const pixelSize = this.cannonSize / 9;
        const startX = cannonPos.x;
        const startY = cannonPos.y;
        
        // 색상 매핑
        const colors = {
            0: null, // 투명
            1: '#666666', // 어두운 회색 (외곽)
            2: '#888888', // 회색 (몸체)
            3: '#aaaaaa', // 밝은 회색 (내부)
            4: '#ffffff'  // 흰색 (중심)
        };
        
        for (let y = 0; y < cannonPattern.length; y++) {
            for (let x = 0; x < cannonPattern[y].length; x++) {
                const colorIndex = cannonPattern[y][x];
                if (colorIndex !== 0) {
                    ctx.fillStyle = colors[colorIndex];
                    ctx.fillRect(
                        startX + x * pixelSize,
                        startY + y * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        
        if (this.phase === 'warning') {
            this.drawWarning(ctx, canvasWidth, canvasHeight);
        } else if (this.phase === 'firing') {
            this.drawLaser(ctx, canvasWidth, canvasHeight);
        }
    }
    
    drawWarning(ctx, canvasWidth, canvasHeight) {
        const progress = this.warningTime / CONFIG.LASER.WARNING_TIME;
        const width = Math.pow(progress, 3) * CONFIG.GRID.CELL_SIZE;
        const alpha = 0.3 + 0.4 * Math.sin(this.totalTime * 0.01);
        
        const pos = this.arena.gridToPixel(0, 0, canvasWidth, canvasHeight);
        
        ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
        
        if (this.direction === 'horizontal') {
            const y = pos.y + this.gridY * CONFIG.GRID.CELL_SIZE + (CONFIG.GRID.CELL_SIZE - width) / 2;
            ctx.fillRect(pos.x, y, this.arena.getPixelWidth(), width);
        } else {
            const x = pos.x + this.gridX * CONFIG.GRID.CELL_SIZE + (CONFIG.GRID.CELL_SIZE - width) / 2;
            ctx.fillRect(x, pos.y, width, this.arena.getPixelHeight());
        }
    }
    
    drawLaser(ctx, canvasWidth, canvasHeight) {
        const pos = this.arena.gridToPixel(0, 0, canvasWidth, canvasHeight);
        const time = Date.now() * 0.01;
        
        if (this.direction === 'horizontal') {
            const y = pos.y + this.gridY * CONFIG.GRID.CELL_SIZE;
            const width = this.arena.getPixelWidth();
            const height = CONFIG.GRID.CELL_SIZE;
            const centerY = y + height / 2;
            
            // 홀로그램 스타일 다층 레이저 (위협적인 빨간색 계열)
            const layers = [
                { 
                    color: `rgba(139, 0, 0, ${0.2 + 0.1 * Math.sin(time * 0.8)})`, // 어두운 빨강
                    offset: 45, 
                    alpha: 0.3 
                },
                { 
                    color: `rgba(255, 69, 0, ${0.3 + 0.2 * Math.sin(time * 1.2)})`, // 주황빨강
                    offset: 35, 
                    alpha: 0.5 
                },
                { 
                    color: `rgba(255, 0, 0, ${0.4 + 0.3 * Math.sin(time * 1.5)})`, // 순수 빨강
                    offset: 25, 
                    alpha: 0.7 
                },
                { 
                    color: `rgba(255, 255, 255, ${0.6 + 0.4 * Math.sin(time * 2.0)})`, // 흰색 코어
                    offset: 15, 
                    alpha: 0.9 
                }
            ];
            
            layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                ctx.fillRect(
                    pos.x, 
                    centerY - layer.offset / 2, 
                    width, 
                    layer.offset
                );
            });
            
        } else {
            const x = pos.x + this.gridX * CONFIG.GRID.CELL_SIZE;
            const width = CONFIG.GRID.CELL_SIZE;
            const height = this.arena.getPixelHeight();
            const centerX = x + width / 2;
            
            // 홀로그램 스타일 다층 레이저 (위협적인 빨간색 계열)
            const layers = [
                { 
                    color: `rgba(139, 0, 0, ${0.2 + 0.1 * Math.sin(time * 0.8)})`, // 어두운 빨강
                    offset: 45, 
                    alpha: 0.3 
                },
                { 
                    color: `rgba(255, 69, 0, ${0.3 + 0.2 * Math.sin(time * 1.2)})`, // 주황빨강
                    offset: 35, 
                    alpha: 0.5 
                },
                { 
                    color: `rgba(255, 0, 0, ${0.4 + 0.3 * Math.sin(time * 1.5)})`, // 순수 빨강
                    offset: 25, 
                    alpha: 0.7 
                },
                { 
                    color: `rgba(255, 255, 255, ${0.6 + 0.4 * Math.sin(time * 2.0)})`, // 흰색 코어
                    offset: 15, 
                    alpha: 0.9 
                }
            ];
            
            layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                ctx.fillRect(
                    centerX - layer.offset / 2, 
                    pos.y, 
                    layer.offset, 
                    height
                );
            });
        }
    }
    
    drawLaserSparks(ctx, x, y, width, height, isHorizontal) {
        // 홀로그램 스타일에서는 스파크 제거
    }
}

class Heart {
    constructor(gridX, gridY, arena) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.arena = arena;
        this.lifetime = CONFIG.OBSTACLES.HEART_LIFETIME;
        this.pulseTime = 0;
        this.active = true;
        this.size = CONFIG.OBSTACLES.HEART_SIZE;
        this.collected = false;
        this.collectTime = 0;
        this.collectDuration = 500; // 0.5초 수집 애니메이션
    }
    
    update(deltaTime) {
        if (this.collected) {
            this.collectTime += deltaTime;
            if (this.collectTime >= this.collectDuration) {
                this.active = false;
            }
        } else {
            this.lifetime -= deltaTime;
            this.pulseTime += deltaTime;
            
            if (this.lifetime <= 0) {
                this.active = false;
            }
        }
    }
    
    collect() {
        this.collected = true;
        this.collectTime = 0;
    }
    
    getBounds(canvasWidth, canvasHeight) {
        const pos = this.arena.gridToPixel(this.gridX, this.gridY, canvasWidth, canvasHeight);
        const centerX = pos.x + CONFIG.GRID.CELL_SIZE / 2;
        const centerY = pos.y + CONFIG.GRID.CELL_SIZE / 2;
        
        return {
            x: centerX - this.size / 2,
            y: centerY - this.size / 2,
            width: this.size,
            height: this.size
        };
    }
    
    draw(ctx, canvasWidth, canvasHeight) {
        const pos = this.arena.gridToPixel(this.gridX, this.gridY, canvasWidth, canvasHeight);
        const centerX = pos.x + CONFIG.GRID.CELL_SIZE / 2;
        const centerY = pos.y + CONFIG.GRID.CELL_SIZE / 2;
        
        // 펄스 효과
        const pulse = 1 + 0.15 * Math.sin(this.pulseTime * 0.005);
        const size = this.size * pulse;
        
        // 하트 그리기 (픽셀 아트 스타일) - 테두리 제거
        ctx.fillStyle = '#ff1493';
        
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
        const startX = centerX - size / 2;
        const startY = centerY - size / 2;
        
        for (let y = 0; y < heartPattern.length; y++) {
            for (let x = 0; x < heartPattern[y].length; x++) {
                if (heartPattern[y][x]) {
                    ctx.fillRect(
                        startX + x * pixelSize,
                        startY + y * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        
        // 흰색 테두리 제거 - 더 이상 테두리를 그리지 않음
    }
}