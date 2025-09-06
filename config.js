// ===== CONFIG.JS - 최적화된 게임 설정 상수 =====
const CONFIG = {
    // 캔버스 설정
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600
    },
    
    // 그리드 설정
    GRID: {
        MIN_WIDTH: 3,
        MIN_HEIGHT: 1,
        MAX_WIDTH: 5,
        MAX_HEIGHT: 5,
        CELL_SIZE: 80,
        BORDER_WIDTH: 3
    },
    
    // 플레이어 설정
    PLAYER: {
        MARGIN: 5,
        INVINCIBILITY_TIME: 800, // 무적 시간 최적화
        BLINK_INTERVAL: 100
    },
    
    // 장애물 설정
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
        SPIKE_DELAY: 800
    },
    
    // 레이저 설정
    LASER: {
        WARNING_TIME: 2000,
        FIRE_TIME: 1000,
        LIFETIME: 4000
    },
    
    // 레벨 설정
    LEVEL: {
        DURATION: 5000,
        MAX_LIVES_FOR_HEARTS: 3
    },
    
    // 난이도 설정 (보안 검증과 연동)
    DIFFICULTY: {
        EASY: { min: 1200, max: 2000 },
        NORMAL: { min: 900, max: 1600 },
        HARD: { min: 600, max: 1200 },
        EXTREME: { min: 300, max: 600 }
    },
    
    // 스파이크 속도 설정
    SPIKE_SPEED: {
        EASY: 1.0,
        NORMAL: 1.3,
        HARD: 1.6,
        EXTREME: 2.2
    },
    
    // 효과 설정
    EFFECTS: {
        INTERVAL: 10000,      // 10초마다
        DURATION: 3000,       // 3초 지속
        ICON_SIZE: 30,
        EFFECT_SPACING: 25,
        HEART_SPACING: 20,
        SEPARATOR_GAP: 15
    },
    
    // UI 설정
    UI: {
        ICON_SPACING: 90,
        SEPARATOR_GAP: 25,
        EFFECTS_SPACING: 90,
        LIVES_SPACING: 75
    },
    
    // 보안 설정 (새로 추가)
    SECURITY: {
        // 점수 검증
        MAX_SCORE_PER_SECOND: 20,
        MIN_VALID_SCORE: 100,
        MAX_TOTAL_SCORE: 1000000,
        
        // 레벨 검증
        MAX_LEVEL_PER_MINUTE: 12,
        MIN_TIME_PER_LEVEL: 5, // 초
        MAX_LEVEL: 1000,
        
        // 입력 검증
        MAX_KEYS_PER_SECOND: 10,
        MIN_KEY_INTERVAL: 50, // ms
        KEY_SPAM_THRESHOLD: 5,
        
        // 제출 제한
        SUBMISSION_COOLDOWN: 30000, // 30초
        MAX_NAME_LENGTH: 15,
        MIN_GAME_TIME: 10, // 최소 게임 시간 (초)
        
        // 검증 간격
        VALIDATION_INTERVAL: 5000, // 5초마다 검증
        HISTORY_LIMIT: 100, // 점수 히스토리 최대 보관 수
        
        // 의심스러운 활동 임계값
        SUSPICIOUS_THRESHOLD: 3 // 의심스러운 패턴 감지 임계값
    },
    
    // 성능 설정
    PERFORMANCE: {
        // 메모리 관리
        MAX_OBSTACLES: 50,
        MAX_PARTICLES: 100,
        MAX_EFFECTS: 20,
        
        // 렌더링 최적화
        TARGET_FPS: 60,
        MAX_DELTA_TIME: 50, // 최대 프레임 간격 (ms)
        
        // 가비지 컬렉션 최적화
        CLEANUP_INTERVAL: 10000 // 10초마다 정리
    },
    
    // 게임플레이 밸런싱 설정
    GAMEPLAY: {
        // 기본 게임 룰
        STARTING_LIVES: 3, // 시작 목숨 수
        MAX_LIVES: 5, // 최대 목숨 수
        STARTING_LEVEL: 1, // 시작 레벨
        
        // 점수 시스템
        BASE_SCORE_PER_INTERVAL: 1, // 기본 점수 (100ms마다)
        SCORE_INTERVAL: 100, // 점수 갱신 간격 (ms)
        LEVEL_SCORE_MULTIPLIER: 0.5, // 레벨별 점수 배수 (level/2 + 1)
        
        // 레벨 진행
        LEVEL_DURATION: 5000, // 레벨당 지속 시간 (ms)
        LEVEL_UP_SOUND_DELAY: 0, // 레벨업 사운드 지연 (ms)
        
        // 아레나 확장 규칙
        ARENA_1D_MAX_LEVEL: 3, // 1차원 모드 최대 레벨
        ARENA_2D_START_LEVEL: 4, // 2차원 모드 시작 레벨
        ARENA_FULL_SIZE_LEVEL: 8, // 최대 크기 달성 레벨
        
        // 플레이어 이동
        MOVE_REPEAT_DELAY: 150, // 키 반복 입력 방지 지연 (ms)
        TELEPORT_EFFECT_DURATION: 200, // 텔레포트 이펙트 지속시간 (ms)
        
        // 무적 상태
        INVINCIBILITY_DURATION: 800, // 피해 후 무적 시간 (ms)
        INVINCIBILITY_BLINK_INTERVAL: 100, // 깜빡임 간격 (ms)
        
        // 피해 시스템
        DAMAGE_EFFECT_DURATION: 300, // 피해 화면 효과 지속시간 (ms)
        HEAL_EFFECT_DURATION: 800, // 치유 효과 지속시간 (ms)
        HEAL_PARTICLE_COUNT: 12, // 치유 시 파티클 개수
        HEAL_PARTICLE_SPEED_MIN: 50, // 치유 파티클 최소 속도 (pixel/s)
        HEAL_PARTICLE_SPEED_MAX: 150, // 치유 파티클 최대 속도 (pixel/s)
        HEAL_PARTICLE_SIZE_MIN: 8, // 치유 파티클 최소 크기
        HEAL_PARTICLE_SIZE_MAX: 16, // 치유 파티클 최대 크기
        HEAL_PARTICLE_GRAVITY: 30 // 치유 파티클 중력 효과 (pixel/s²)
    },
    
    // 장애물 생성 및 동작 설정
    OBSTACLE_SPAWNING: {
        // 생성 확률
        SPIKE_SPAWN_RATIO: 0.45, // 가시 생성 비율 (45%)
        LASER_SPAWN_RATIO: 0.35, // 레이저 생성 비율 (35%)
        BOMB_SPAWN_RATIO: 0.2, // 폭탄 생성 비율 (20%)
        
        // 연속 생성 방지
        PREVENT_SAME_TYPE_CHANCE: 0.7, // 같은 타입 연속 생성 방지 확률 (70%)
        
        // 하트 아이템
        HEART_SPAWN_CHANCE: 0.08, // 하트 생성 확률 (8%)
        HEART_LIFETIME: 8000, // 하트 지속시간 (ms)
        HEART_COOLDOWN: 5000, // 하트 생성 쿨다운 (ms)
        HEART_MAX_LIVES_THRESHOLD: 3, // 하트가 생성되는 최대 목숨 수
        
        // 스파이크 설정
        SPIKE_DELAY: 800, // 가시 발동 지연 (ms)
        SPIKE_WARNING_DURATION: 800, // 가시 경고 표시 시간 (ms)
        
        // 레이저 설정
        LASER_WARNING_TIME: 2000, // 레이저 경고 시간 (ms)
        LASER_FIRE_TIME: 1000, // 레이저 발사 시간 (ms)
        LASER_TOTAL_LIFETIME: 4000, // 레이저 총 생명시간 (ms)
        
        // 폭탄 설정
        BOMB_EXPLOSION_DURATION: 500, // 폭발 지속시간 (ms)
        BOMB_EXPLOSION_RANGE: 1, // 폭발 범위 (그리드 단위, 3x3 = 1)
        BOMB_TRAVEL_PROGRESS_LIMIT: 0.9 // 폭발 발생 지점 (90% 지점)
    },
    
    // 난이도 조정 (레벨별 장애물 생성 간격)
    DIFFICULTY_SCALING: {
        // 각 난이도별 생성 간격 (ms)
        EASY_LEVELS: { from: 1, to: 3, min_interval: 1200, max_interval: 2000 },
        NORMAL_LEVELS: { from: 4, to: 7, min_interval: 900, max_interval: 1600 },
        HARD_LEVELS: { from: 8, to: 12, min_interval: 600, max_interval: 1200 },
        EXTREME_LEVELS: { from: 13, to: Infinity, min_interval: 300, max_interval: 600 },
        
        // 극한 난이도에서 추가 어려움 증가
        EXTREME_LEVEL_REDUCTION_PER_LEVEL: 5, // 레벨당 감소량 (ms)
        EXTREME_MIN_INTERVAL: 50, // 최소 생성 간격 (ms)
        
        // 속도 배율 (레벨별 장애물 이동 속도)
        SPEED_EASY: 1.0,
        SPEED_NORMAL: 1.3,
        SPEED_HARD: 1.6,
        SPEED_EXTREME: 2.2,
        SPEED_EXTREME_INCREASE_PER_LEVEL: 0.1 // 극한 난이도 레벨당 속도 증가
    },
    
    // 특수 효과 시스템
    SPECIAL_EFFECTS: {
        // 효과 발동 조건
        EFFECTS_START_ARENA_SIZE: { width: 5, height: 3 }, // 효과 시작 아레나 크기
        EFFECT_ACTIVATION_INTERVAL: 10000, // 효과 발동 간격 (ms)
        EFFECT_DURATION: 3000, // 효과 지속시간 (ms)
        
        // 각 효과별 설정
        REVERSE_CONTROLS: {
            name: 'reverse',
            display_name: 'REVERSE',
            color: '#ff3333'
        },
        BLUR_EFFECT: {
            name: 'blur',
            display_name: 'BLUR',
            color: '#3399ff',
            blur_amount: '3px'
        },
        SLOW_MOTION: {
            name: 'slow',
            display_name: 'SLOW',
            color: '#ff9933',
            speed_multiplier: 0.5 // 50% 속도
        },
        WALL_SPAWN: {
            name: 'wall',
            display_name: 'WALL',
            color: '#33ff33',
            walls_per_height: 1 // 높이당 벽 개수
        }
    },
    
    // 아레나 확장 효과
    ARENA_EFFECTS: {
        EXPAND_EFFECT_DURATION: 300, // 확장 효과 지속시간 (ms)
        EXPAND_SCALE_AMOUNT: 0.15, // 확장 크기 배율
        EXPAND_GLOW_SCALE: 0.25, // 글로우 효과 크기 배율
        EXPAND_BORDER_MULTIPLIER: 2, // 테두리 두께 배율
        EXPAND_GLOW_BORDER_MULTIPLIER: 4 // 글로우 테두리 두께 배율
    },
    
    // 사운드 설정
    SOUND: {
        // 기본 볼륨 (0.0 ~ 1.0)
        MASTER_VOLUME: 0.7,
        
        // 각 사운드별 볼륨 배율
        MOVE_VOLUME: 0.5,
        BOOM_LAUNCH_VOLUME: 0.6,
        BOOM_VOLUME: 0.8,
        HURT_VOLUME: 0.7,
        LASER_CHARGE_VOLUME: 0.4,
        LASER_VOLUME: 0.6,
        LEVELUP_VOLUME: 0.8,
        SPIKE_VOLUME: 0.5,
        START_VOLUME: 0.8,
        PAUSE_VOLUME: 0.6,
        COUNT_VOLUME: 0.5,
        GAMEOVER_VOLUME: 0.9,
        LIFE_VOLUME: 0.7
    },
    
    // 게임오버 애니메이션
    GAMEOVER_ANIMATION: {
        TOTAL_DURATION: 6000, // 총 애니메이션 시간 (ms)
        SCORE_PHASE_RATIO: 0.4, // 점수 애니메이션 비율 (40%)
        TIME_PHASE_RATIO: 0.7, // 시간 애니메이션 종료 비율 (70%)
        LEVEL_PHASE_RATIO: 1.0 // 레벨 애니메이션 종료 비율 (100%)
    },
    
    // LED UI 시스템
    LED_UI: {
        // LED 패널 설정
        PANEL_WIDTH: 400,
        PANEL_HEIGHT: 60,
        PANEL_BG_COLOR_DARK: '#1a1a1a',
        PANEL_BG_COLOR_LIGHT: '#2a2a2a',
        
        // LED 매트릭스 설정
        DOT_SIZE: 2,
        DOT_SPACING: 4,
        DOT_COLOR_DARK: '#333333',
        DOT_COLOR_LIGHT: '#444444',
        
        // 텍스트 설정
        CHAR_WIDTH: 14,
        CHAR_HEIGHT: 21,
        CHAR_SPACING: 2,
        TEXT_BLINK_SPEED: 0.01, // 깜빡임 속도
        TEXT_MIN_ALPHA: 0.8,
        TEXT_MAX_ALPHA: 1.0,
        
        // 하트 LED 설정
        HEART_LED_SIZE: 6,
        HEART_LED_SPACING: 8,
        HEART_PATTERN_WIDTH: 7,
        HEART_PATTERN_HEIGHT: 6,
        HEART_PULSE_SPEED: 0.008,
        HEART_MIN_ALPHA: 0.7,
        HEART_MAX_ALPHA: 1.0,
        
        // 구분선 설정
        DIVIDER_LED_HEIGHT: 3,
        DIVIDER_LED_SPACING: 2,
        DIVIDER_ANIMATION_SPEED: 0.005,
        DIVIDER_MIN_ALPHA: 0.4,
        DIVIDER_MAX_ALPHA: 0.7
    }
};