// ===== PLAYER.JS - 플레이어 클래스 =====
class Player {
    constructor(arena) {
        this.arena = arena;
        this.gridX = 1; // 3x1 맵에서 중앙 위치
        this.gridY = 0;
        this.lives = 3;
        this.isInvincible = false;
        this.invincibilityTime = 0;
        this.blinkTime = 0;
        this.isVisible = true;
        this.teleportEffects = [];
        this.damageEffects = [];
    }
    
    reset() {
        this.gridX = Math.floor(this.arena.width / 2); // 중앙 위치
        this.gridY = Math.floor(this.arena.height / 2);
        this.lives = 3;
        this.isInvincible = false;
        this.invincibilityTime = 0;
        this.blinkTime = 0;
        this.isVisible = true;
    }
    
    move(deltaX, deltaY) {
        const newX = this.gridX + deltaX;
        const newY = this.gridY + deltaY;
        
        if (this.arena.isValidPosition(newX, newY)) {
            // 텔레포트 이펙트 생성 (이전 위치에서만)
            this.createTeleportEffect(this.gridX, this.gridY);
            
            // 위치 이동
            this.gridX = newX;
            this.gridY = newY;
            
            // 이동 사운드 재생
            if (typeof soundManager !== 'undefined') {
                soundManager.playMoveSound();
            }
        }
    }
    
    createTeleportEffect(gridX, gridY) {
        this.teleportEffects.push({
            gridX: gridX,
            gridY: gridY,
            time: 0,
            duration: 200 // 0.2초 지속
        });
    }
    
    takeDamage() {
        if (this.isInvincible) return false;
        
        this.lives--;
        this.isInvincible = true;
        this.invincibilityTime = CONFIG.PLAYER.INVINCIBILITY_TIME;
        this.blinkTime = 0;
        
        // 피해 이펙트 생성
        this.createDamageEffect();
        
        // 피해 사운드 재생
        if (typeof soundManager !== 'undefined') {
            soundManager.playHurtSound();
        }
        
        return true;
    }
    
    createDamageEffect() {
        this.damageEffects.push({
            time: 0,
            duration: 300, // 0.3초 지속
            intensity: 1.0
        });
    }
    
    heal() {
        this.lives++;
    }
    
    update(deltaTime) {
        if (this.isInvincible) {
            this.invincibilityTime -= deltaTime;
            this.blinkTime += deltaTime;
            
            if (this.blinkTime >= CONFIG.PLAYER.BLINK_INTERVAL) {
                this.isVisible = !this.isVisible;
                this.blinkTime = 0;
            }
            
            if (this.invincibilityTime <= 0) {
                this.isInvincible = false;
                this.isVisible = true;
            }
        }
        
        // 텔레포트 이펙트 업데이트
        this.teleportEffects = this.teleportEffects.filter(effect => {
            effect.time += deltaTime;
            return effect.time < effect.duration;
        });
        
        // 피해 이펙트 업데이트
        this.damageEffects = this.damageEffects.filter(effect => {
            effect.time += deltaTime;
            effect.intensity = 1 - (effect.time / effect.duration);
            return effect.time < effect.duration;
        });
    }
    
    getBounds(canvasWidth, canvasHeight) {
        const pos = this.arena.gridToPixel(this.gridX, this.gridY, canvasWidth, canvasHeight);
        return {
            x: pos.x + CONFIG.PLAYER.MARGIN,
            y: pos.y + CONFIG.PLAYER.MARGIN,
            width: CONFIG.GRID.CELL_SIZE - CONFIG.PLAYER.MARGIN * 2,
            height: CONFIG.GRID.CELL_SIZE - CONFIG.PLAYER.MARGIN * 2
        };
    }
    
    draw(ctx, canvasWidth, canvasHeight) {
        // 텔레포트 이펙트 먼저 그리기
        this.drawTeleportEffects(ctx, canvasWidth, canvasHeight);
        
        if (!this.isVisible) return;
        
        const bounds = this.getBounds(canvasWidth, canvasHeight);
        
        if (this.isInvincible) {
            ctx.fillStyle = '#00ffff'; // 청록색으로 변경
        } else {
            ctx.fillStyle = document.body.classList.contains('light-mode') ? '#000000' : '#ffffff';
        }
        
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
    
    drawDamageEffects(ctx, canvasWidth, canvasHeight) {
        this.damageEffects.forEach(effect => {
            const progress = effect.time / effect.duration;
            // 사인 곡선으로 부드러운 페이드 인/아웃
            const alpha = Math.sin(progress * Math.PI) * 0.3 * effect.intensity;
            
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        });
    }
    
    // 피해 이펙트를 그리기 위한 메서드 (Game 클래스에서 호출)
    hasDamageEffect() {
        return this.damageEffects.length > 0;
    }
    
    drawTeleportEffects(ctx, canvasWidth, canvasHeight) {
        this.teleportEffects.forEach(effect => {
            const progress = effect.time / effect.duration;
            
            // 빠른 크기 변화 (0~0.5): 커졌다가 작아짐
            // 느린 사라짐 (0.5~1.0): 투명도만 변화
            let scale, alpha;
            
            if (progress <= 0.5) {
                // 첫 번째 절반: 빠른 크기 변화
                const scaleProgress = progress * 2; // 0~1로 정규화
                scale = 1 + 0.15 * Math.sin(scaleProgress * Math.PI); // 1.0 → 1.15 → 1.0
                alpha = 0.8;
            } else {
                // 두 번째 절반: 크기는 원래대로, 투명도만 감소
                const fadeProgress = (progress - 0.5) * 2; // 0~1로 정규화
                scale = 1.0;
                alpha = 0.8 * (1 - fadeProgress);
            }
            
            const pos = this.arena.gridToPixel(effect.gridX, effect.gridY, canvasWidth, canvasHeight);
            const centerX = pos.x + CONFIG.GRID.CELL_SIZE / 2;
            const centerY = pos.y + CONFIG.GRID.CELL_SIZE / 2;
            
            // 텔레포트 이펙트 그리기
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            const baseSize = CONFIG.GRID.CELL_SIZE - CONFIG.PLAYER.MARGIN * 2;
            const size = baseSize * scale;
            ctx.fillRect(
                centerX - size / 2,
                centerY - size / 2,
                size,
                size
            );
        });
    }
}