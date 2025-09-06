// ===== SOUND.JS - 사운드 관리 시스템 =====
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.7; // 볼륨 증가
        this.loadSounds();
    }
    
    loadSounds() {
        // 모든 사운드 로드
        this.loadSound('move', 'sound/moving.wav');
        this.loadSound('boom_launch', 'sound/boom_launch.wav');
        this.loadSound('boom', 'sound/boom.wav');
        this.loadSound('hurt', 'sound/hurt.wav');
        this.loadSound('laser_charge', 'sound/laser_charge.wav');
        this.loadSound('laser', 'sound/laser.wav');
        this.loadSound('levelup', 'sound/levelup.wav');
        this.loadSound('spike', 'sound/spike.wav');
        this.loadSound('start', 'sound/start.wav');
        this.loadSound('pause', 'sound/pause.wav');
        this.loadSound('count', 'sound/count.wav');
        this.loadSound('gameover', 'sound/gameover.wav'); // 게임오버 사운드 추가
        this.loadSound('life', 'sound/life.wav'); // 목숨 아이템 사운드 추가
    }
    
    loadSound(name, path) {
        try {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = this.volume;
            this.sounds[name] = audio;
        } catch (error) {
            console.warn(`사운드 로드 실패: ${path}`, error);
        }
    }
    
    playSound(name, volume = 1.0) {
        if (!this.enabled || !this.sounds[name]) return;
        
        try {
            const sound = this.sounds[name].cloneNode();
            sound.volume = this.volume * volume;
            sound.play().catch(error => {
                // 자동 재생 정책으로 인한 오류 무시
                console.debug(`사운드 재생 실패: ${name}`, error);
            });
        } catch (error) {
            console.warn(`사운드 재생 오류: ${name}`, error);
        }
    }
    
    // 긴 사운드용 (재생/중지 제어 가능)
    playLongSound(name, volume = 1.0) {
        if (!this.enabled || !this.sounds[name]) return null;
        
        try {
            const sound = this.sounds[name].cloneNode();
            sound.volume = this.volume * volume;
            sound.play().catch(error => {
                console.debug(`사운드 재생 실패: ${name}`, error);
            });
            return sound;
        } catch (error) {
            console.warn(`사운드 재생 오류: ${name}`, error);
            return null;
        }
    }
    
    stopSound(soundInstance) {
        if (soundInstance) {
            try {
                soundInstance.pause();
                soundInstance.currentTime = 0;
            } catch (error) {
                console.warn('사운드 중지 오류:', error);
            }
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    // 각 사운드별 재생 메서드들
    playMoveSound() {
        this.playSound('move', 0.5);
    }
    
    playBoomLaunchSound() {
        this.playSound('boom_launch', 0.6);
    }
    
    playBoomSound() {
        this.playSound('boom', 0.8);
    }
    
    playHurtSound() {
        this.playSound('hurt', 0.7);
    }
    
    playLaserChargeSound() {
        this.playSound('laser_charge', 0.4);
    }
    
    playLaserSound() {
        this.playSound('laser', 0.6);
    }
    
    playLevelUpSound() {
        this.playSound('levelup', 0.8);
    }
    
    playSpikeSound() {
        this.playSound('spike', 0.5);
    }
    
    playStartSound() {
        this.playSound('start', 0.8);
    }
    
    playPauseSound() {
        this.playSound('pause', 0.6);
    }
    
    playCountSound() {
        return this.playLongSound('count', 0.5);
    }
    
    // 새로 추가된 사운드들
    playGameOverSound() {
        this.playSound('gameover', 0.9);
    }
    
    playLifeSound() {
        this.playSound('life', 0.7);
    }
}

// 전역 사운드 매니저
const soundManager = new SoundManager();