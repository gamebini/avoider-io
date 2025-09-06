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
        this.healEffects = []; // 하트 힐링 효과 추가
    }
    
    reset() {
        this.gridX = Math.floor(this.arena.width / 2); // 중앙 위치
        this.gridY = Math.floor(this.arena.height / 2);
        this.lives = 3;
        this.isInvincible = false;
        this.invincibilityTime = 0;
        this.blinkTime = 0;
        this.isVisible = true;
        this.healEffects = []; // 힐링 효과 리셋
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
        
        // 힐링 효과 생성
        this.createHealEffect();
        
        // 하트 아이템 사운드 재생
        if (typeof soundManager !== 'undefined') {
            soundManager.playLifeSound();
        }
    }
    
    createHealEffect() {
        this.healEffects.push({
            time: 0,
            duration: 800, // 0.8초 지속
            intensity: 1.0,
            particles: [] // 파티클 배열
        });
        
        // 파티클 생성 (하트 모양 파티클들)
        const effect = this.healEffects[this.healEffects.length - 1];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 50 + Math.random() * 100; // 50-150 픽셀/초
            effect.particles.push({
                x: 0, // 플레이어 위치 기준 상대 좌표
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                size: 8 + Math.random() * 8 // 8-16 크기
            });
        }
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
        
        // 힐링 이펙트 업데이트
        this.healEffects = this.healEffects.filter(effect => {
            effect.time += deltaTime;
            effect.intensity = 1 - (effect.time / effect.duration);
            
            // 파티클 업데이트
            effect.particles.forEach(particle => {
                particle.x += particle.vx * deltaTime / 1000;
                particle.y += particle.vy * deltaTime / 1000;
                particle.life = 1 - (effect.time / effect.duration);
                
                // 중력 효과 (약간 아래로)
                particle.vy += 30 * deltaTime / 1000;
            });
            
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
        
        // 힐링 이펙트 그리기 (플레이어 뒤에)
        this.drawHealEffects(ctx, canvasWidth, canvasHeight);
        
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
    
    drawHealEffects(ctx, canvasWidth, canvasHeight) {
        const playerPos = this.arena.gridToPixel(this.gridX, this.gridY, canvasWidth, canvasHeight);
        const playerCenterX = playerPos.x + CONFIG.GRID.CELL_SIZE / 2;
        const playerCenterY = playerPos.y + CONFIG.GRID.CELL_SIZE / 2;
        
        this.healEffects.forEach(effect => {
            const progress = effect.time / effect.duration;
            
            // 픽셀 LED 스타일 힐링 효과
            const ledSize = 3;
            const maxRadius = 60;
            const currentRadius = maxRadius * (1 - effect.intensity);
            
            // LED 매트릭스 힐링 효과
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                for (let r = 10; r < currentRadius; r += ledSize * 2) {
                    const x = playerCenterX + Math.cos(angle) * r;
                    const y = playerCenterY + Math.sin(angle) * r;
                    
                    const distanceAlpha = 1 - (r / maxRadius);
                    const timeAlpha = effect.intensity;
                    const finalAlpha = distanceAlpha * timeAlpha * 0.8;
                    
                    if (finalAlpha > 0.1) {
                        // 픽셀 LED 힐링 점
                        ctx.fillStyle = `rgba(255, 105, 180, ${finalAlpha})`;
                        ctx.fillRect(x - ledSize/2, y - ledSize/2, ledSize, ledSize);
                        
                        // LED 중심 하이라이트
                        if (finalAlpha > 0.5) {
                            ctx.fillStyle = `rgba(255, 255, 255, ${(finalAlpha - 0.5) * 0.6})`;
                            ctx.fillRect(x - ledSize/4, y - ledSize/4, ledSize/2, ledSize/2);
                        }
                    }
                }
            }
            
            // 중앙 LED 하트 펄스
            const heartSize = 16;
            const heartPattern = [
                [0,1,1,0,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,0,1,1,1,0,0],
                [0,0,0,1,0,0,0]
            ];
            
            const ledPixelSize = 2;
            const heartWidth = heartPattern[0].length * ledPixelSize;
            const heartHeight = heartPattern.length * ledPixelSize;
            const heartStartX = playerCenterX - heartWidth / 2;
            const heartStartY = playerCenterY - heartHeight / 2;
            
            const heartAlpha = effect.intensity * (0.8 + 0.2 * Math.sin(effect.time * 0.02));
            
            for (let row = 0; row < heartPattern.length; row++) {
                for (let col = 0; col < heartPattern[row].length; col++) {
                    if (heartPattern[row][col]) {
                        const pixelX = heartStartX + col * ledPixelSize;
                        const pixelY = heartStartY + row * ledPixelSize;
                        
                        // LED 하트 픽셀
                        ctx.fillStyle = `rgba(255, 105, 180, ${heartAlpha})`;
                        ctx.fillRect(pixelX, pixelY, ledPixelSize, ledPixelSize);
                        
                        // LED 하이라이트
                        if (heartAlpha > 0.6) {
                            ctx.fillStyle = `rgba(255, 255, 255, ${(heartAlpha - 0.6) * 0.8})`;
                            ctx.fillRect(
                                pixelX + ledPixelSize * 0.2, 
                                pixelY + ledPixelSize * 0.2, 
                                ledPixelSize * 0.6, 
                                ledPixelSize * 0.6
                            );
                        }
                    }
                }
            }
            
            // 파티클들도 LED 스타일로 변경
            effect.particles.forEach(particle => {
                const particleX = playerCenterX + particle.x;
                const particleY = playerCenterY + particle.y;
                const alpha = particle.life * 0.8;
                const size = Math.max(2, particle.size * particle.life * 0.3); // 작게 조정
                
                if (alpha > 0.1) {
                    // LED 스타일 파티클 (작은 정사각형)
                    ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
                    ctx.fillRect(particleX - size/2, particleY - size/2, size, size);
                    
                    // LED 중심 하이라이트
                    if (alpha > 0.5) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha - 0.5) * 0.6})`;
                        ctx.fillRect(
                            particleX - size/4, 
                            particleY - size/4, 
                            size/2, 
                            size/2
                        );
                    }
                }
            });
        });
    }
    
    drawHeartParticle(ctx, x, y, size) {
        // 간단한 하트 모양 파티클
        const heartPattern = [
            [0,1,1,0,1,1,0],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0],
            [0,0,0,1,0,0,0]
        ];
        
        const pixelSize = size / 7;
        const startX = x - size / 2;
        const startY = y - size / 2;
        
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