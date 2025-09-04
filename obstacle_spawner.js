// ===== OBSTACLE_SPAWNER.JS - 장애물 생성 관리 =====
class ObstacleSpawner {
    constructor(arena) {
        this.arena = arena;
        this.lastSpawnTime = 0;
        this.nextSpawnDelay = 1000;
        this.lastObstacleType = null;
        this.obstacles = [];
    }
    
    getSpawnDelay(level) {
        let difficulty;
        if (level <= 3) difficulty = CONFIG.DIFFICULTY.EASY;
        else if (level <= 7) difficulty = CONFIG.DIFFICULTY.NORMAL;
        else if (level <= 12) difficulty = CONFIG.DIFFICULTY.HARD;
        else {
            // 최고 난이도 이후 점진적 감소
            const extraLevels = level - 12;
            const reductionPerLevel = 5; // 레벨당 5ms씩 감소
            const minDelay = 50; // 최소 50ms
            
            const baseMin = CONFIG.DIFFICULTY.EXTREME.min - (extraLevels * reductionPerLevel);
            const baseMax = CONFIG.DIFFICULTY.EXTREME.max - (extraLevels * reductionPerLevel);
            
            difficulty = {
                min: Math.max(minDelay, baseMin),
                max: Math.max(minDelay + 50, baseMax)
            };
        }
        
        return Utils.randomInt(difficulty.min, difficulty.max);
    }
    
    shouldSpawnHeart(lives) {
        return lives < CONFIG.LEVEL.MAX_LIVES_FOR_HEARTS && 
               Math.random() < CONFIG.OBSTACLES.HEART_SPAWN_CHANCE;
    }
    
    spawnHeart() {
        let gridX, gridY;
        let attempts = 0;
        const maxAttempts = 20;
        
        // 플레이어 위치 피하기
        do {
            gridX = Utils.randomInt(0, this.arena.width - 1);
            gridY = Utils.randomInt(0, this.arena.height - 1);
            attempts++;
        } while (attempts < maxAttempts && 
                 this.isPlayerPosition && 
                 this.isPlayerPosition(gridX, gridY));
        
        return new Heart(gridX, gridY, this.arena);
    }
    
    // 플레이어 위치 체크 함수 설정
    setPlayerPositionChecker(checkFunction) {
        this.isPlayerPosition = checkFunction;
    }
    
    spawnSpike(level) {
        let startX, startY, targetX, targetY;
        
        if (level <= 3) {
            // 1차원: 위아래에서만 (좌우에서는 피할 수 없으므로 제외)
            const fromTop = Math.random() < 0.5;
            const gridX = Utils.randomInt(0, this.arena.width - 1);
            
            if (fromTop) {
                startX = gridX; startY = -1;
                targetX = gridX; targetY = this.arena.height;
            } else {
                startX = gridX; startY = this.arena.height;
                targetX = gridX; targetY = -1;
            }
        } else {
            // 2차원: 모든 방향에서
            const side = Utils.randomInt(0, 3); // 0:위, 1:오른쪽, 2:아래, 3:왼쪽
            
            switch (side) {
                case 0: // 위에서
                    startX = Utils.randomInt(0, this.arena.width - 1);
                    startY = -1;
                    targetX = startX;
                    targetY = this.arena.height;
                    break;
                case 1: // 오른쪽에서
                    startX = this.arena.width;
                    startY = Utils.randomInt(0, this.arena.height - 1);
                    targetX = -1;
                    targetY = startY;
                    break;
                case 2: // 아래에서
                    startX = Utils.randomInt(0, this.arena.width - 1);
                    startY = this.arena.height;
                    targetX = startX;
                    targetY = -1;
                    break;
                case 3: // 왼쪽에서
                    startX = -1;
                    startY = Utils.randomInt(0, this.arena.height - 1);
                    targetX = this.arena.width;
                    targetY = startY;
                    break;
            }
        }
        
        return new Spike(startX, startY, targetX, targetY, this.arena, level);
    }
    
    spawnLaser(level) {
        // 1차원일 때는 세로 방향 레이저만 (위아래에서 발사)
        if (level <= 3) {
            const gridX = Utils.randomInt(0, this.arena.width - 1);
            const fromTop = Math.random() < 0.5;
            const gridY = fromTop ? -1 : this.arena.height;
            return new Laser(gridX, gridY, 'vertical', this.arena);
        } else {
            // 2차원일 때는 모든 방향
            const isHorizontal = Math.random() < 0.5;
            
            if (isHorizontal) {
                const gridY = Utils.randomInt(0, this.arena.height - 1);
                const fromLeft = Math.random() < 0.5;
                const gridX = fromLeft ? -1 : this.arena.width;
                return new Laser(gridX, gridY, 'horizontal', this.arena);
            } else {
                const gridX = Utils.randomInt(0, this.arena.width - 1);
                const fromTop = Math.random() < 0.5;
                const gridY = fromTop ? -1 : this.arena.height;
                return new Laser(gridX, gridY, 'vertical', this.arena);
            }
        }
    }
    
    spawnBomb(level) {
        let startX, startY, targetX, targetY;
        
        if (level <= 3) {
            // 1차원에서는 폭탄 생성 안함 (너무 복잡)
            return this.spawnSpike(level);
        } else {
            // 2차원: 대각선 포함 모든 방향에서
            const directions = [
                // 직선 방향
                { start: [0, -1], target: [0, this.arena.height] }, // 위에서 아래로
                { start: [0, this.arena.height], target: [0, -1] }, // 아래에서 위로
                { start: [-1, 0], target: [this.arena.width, 0] }, // 왼쪽에서 오른쪽으로
                { start: [this.arena.width, 0], target: [-1, 0] }, // 오른쪽에서 왼쪽으로
                // 대각선 방향
                { start: [-1, -1], target: [this.arena.width, this.arena.height] }, // 왼쪽 위에서 오른쪽 아래로
                { start: [this.arena.width, -1], target: [-1, this.arena.height] }, // 오른쪽 위에서 왼쪽 아래로
                { start: [-1, this.arena.height], target: [this.arena.width, -1] }, // 왼쪽 아래에서 오른쪽 위로
                { start: [this.arena.width, this.arena.height], target: [-1, -1] } // 오른쪽 아래에서 왼쪽 위로
            ];
            
            const direction = Utils.randomChoice(directions);
            startX = direction.start[0];
            startY = direction.start[1];
            targetX = direction.target[0];
            targetY = direction.target[1];
            
            // 시작점이 범위를 벗어나는 경우 조정 (항상 플레이그라운드 밖에서 시작)
            if (startX >= 0 && startX < this.arena.width) {
                // 세로 방향 이동이므로 Y를 플레이그라운드 밖으로
                if (targetY > startY) {
                    startY = -2; // 위에서 시작
                } else {
                    startY = this.arena.height + 1; // 아래에서 시작
                }
            }
            if (startY >= 0 && startY < this.arena.height) {
                // 가로 방향 이동이므로 X를 플레이그라운드 밖으로
                if (targetX > startX) {
                    startX = -2; // 왼쪽에서 시작
                } else {
                    startX = this.arena.width + 1; // 오른쪽에서 시작
                }
            }
        }
        
        return new Bomb(startX, startY, targetX, targetY, this.arena, level);
    }
    
    update(deltaTime, level, playerLives, speedMultiplier = 1.0) {
        this.lastSpawnTime += deltaTime;
        
        if (this.lastSpawnTime >= this.nextSpawnDelay) {
            this.lastSpawnTime = 0;
            this.nextSpawnDelay = this.getSpawnDelay(level);
            
            // 하트 생성 체크
            if (this.shouldSpawnHeart(playerLives)) {
                this.obstacles.push(this.spawnHeart());
                return;
            }
            
            // 장애물 타입 결정
            let obstacleType;
            const rand = Math.random();
            if (rand < CONFIG.OBSTACLES.SPIKE_RATIO) {
                obstacleType = 'spike';
            } else if (rand < CONFIG.OBSTACLES.SPIKE_RATIO + CONFIG.OBSTACLES.LASER_RATIO) {
                obstacleType = 'laser';
            } else {
                obstacleType = 'bomb';
            }
            
            // 같은 타입 연속 생성 방지
            if (this.lastObstacleType === obstacleType && 
                Math.random() < CONFIG.OBSTACLES.PREVENT_SAME_TYPE_CHANCE) {
                const types = ['spike', 'laser', 'bomb'];
                const otherTypes = types.filter(type => type !== obstacleType);
                obstacleType = Utils.randomChoice(otherTypes);
            }
            
            this.lastObstacleType = obstacleType;
            
            // 장애물 생성
            if (obstacleType === 'spike') {
                this.obstacles.push(this.spawnSpike(level));
            } else if (obstacleType === 'laser') {
                this.obstacles.push(this.spawnLaser(level));
            } else {
                const bomb = this.spawnBomb(level);
                if (bomb instanceof Bomb) {
                    // 폭탄 생성 시에만 발사 사운드 재생
                    if (typeof soundManager !== 'undefined') {
                        soundManager.playBoomLaunchSound();
                    }
                }
                this.obstacles.push(bomb);
            }
        }
        
        // 장애물 업데이트 및 정리 (속도 배율 적용)
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.update(deltaTime * speedMultiplier);
            return obstacle.active;
        });
    }
    
    getActiveObstacles() {
        return this.obstacles;
    }
    
    clear() {
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.lastObstacleType = null;
    }
}