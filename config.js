// ===== CONFIG.JS - 게임 설정 상수 =====
const CONFIG = {
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600
    },
    GRID: {
        MIN_WIDTH: 3,
        MIN_HEIGHT: 1,
        MAX_WIDTH: 5,
        MAX_HEIGHT: 5,
        CELL_SIZE: 80,
        BORDER_WIDTH: 3
    },
    PLAYER: {
        MARGIN: 5,
        INVINCIBILITY_TIME: 1500,
        BLINK_INTERVAL: 100
    },
    OBSTACLES: {
        SPIKE_RATIO: 0.45,
        LASER_RATIO: 0.35,
        BOMB_RATIO: 0.2,
        HEART_SPAWN_CHANCE: 0.08,
        HEART_LIFETIME: 8000,
        PREVENT_SAME_TYPE_CHANCE: 0.7,
        SPIKE_SIZE: 35,
        HEART_SIZE: 40,
        CANNON_SIZE: 35,
        BOMB_SIZE: 30,
        SPIKE_DELAY: 800 // 가시 발동 지연 시간 (ms)
    },
    LASER: {
        WARNING_TIME: 2000,
        FIRE_TIME: 1000,
        LIFETIME: 4000
    },
    LEVEL: {
        DURATION: 5000,
        MAX_LIVES_FOR_HEARTS: 3  // 3개로 변경
    },
    DIFFICULTY: {
        EASY: { min: 1200, max: 2000 },
        NORMAL: { min: 900, max: 1600 },
        HARD: { min: 600, max: 1200 },
        EXTREME: { min: 300, max: 600 }
    },
    SPIKE_SPEED: {
        EASY: 1.0,
        NORMAL: 1.3,
        HARD: 1.6,
        EXTREME: 2.2
    },
    EFFECTS: {
        INTERVAL: 10000,      // 10초마다
        DURATION: 3000,       // 3초 지속
        ICON_SIZE: 24         // UI 아이콘 크기
    },
    UI: {
        ICON_SPACING: 90,     // 이펙트 아이콘 간격 대폭 증가 (75 → 90)
        SEPARATOR_GAP: 25,    // 경계선과 하트 사이 간격 대폭 감소 (40 → 25)
        EFFECTS_SPACING: 90,  // 이펙트끼리의 간격
        LIVES_SPACING: 75     // 하트끼리의 간격
    }
};