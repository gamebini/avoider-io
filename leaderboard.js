// ===== LEADERBOARD.JS - 실제 리더보드 시스템 =====
class LeaderboardManager {
    constructor() {
        this.storageKey = 'avoider_leaderboard_v2';
        this.maxEntries = 10;
        this.currentRecord = null;
        
        // 보안 및 검증 설정
        this.lastSubmissionTime = 0;
        this.submissionCooldown = 30000; // 30초 쿨다운
        this.maxNameLength = 15;
        this.minValidScore = 500; // 최소 유효 점수 (더미 데이터보다 낮게)
        this.encryptionKey = this.generateEncryptionKey();
        
        // 해킹 방지를 위한 게임 세션 추적
        this.gameSessionData = {
            startTime: 0,
            lastLevelTime: 0,
            scoreCheckpoints: [],
            validationHash: null
        };
        
        // 실제 리더보드 초기화 (더미 데이터 제거)
        this.initializeRealLeaderboard();
    }

    // 실제 리더보드 초기화 (더미 데이터 대신 빈 리더보드)
    initializeRealLeaderboard() {
        const existingData = this.loadLocalLeaderboard();
        
        // 기존 데이터가 더미 데이터인지 확인
        if (this.isDummyData(existingData)) {
            console.log('🗑️ 더미 데이터 감지됨. 실제 리더보드로 초기화합니다.');
            localStorage.removeItem(this.storageKey);
        }
    }

    // 더미 데이터 여부 확인
    isDummyData(leaderboard) {
        if (!Array.isArray(leaderboard) || leaderboard.length === 0) return false;
        
        const dummyNames = ['SYSTEM', 'ADMIN', 'PLAYER', 'GUEST', 'USER'];
        const dummyCount = leaderboard.filter(entry => 
            dummyNames.includes(entry.name) && entry.verified === true
        ).length;
        
        // 더미 데이터가 3개 이상이면 더미 데이터로 판단
        return dummyCount >= 3;
    }

    // 암호화 키 생성
    generateEncryptionKey() {
        const browserFingerprint = this.getBrowserFingerprint();
        const sessionId = Date.now().toString(36) + Math.random().toString(36);
        return btoa(browserFingerprint + sessionId).substring(0, 32);
    }

    // 브라우저 핑거프린팅
    getBrowserFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Avoider.io fingerprint', 2, 2);
            
            return btoa(JSON.stringify({
                userAgent: navigator.userAgent.substring(0, 100),
                language: navigator.language,
                platform: navigator.platform,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                canvas: canvas.toDataURL().substring(0, 50)
            }));
        } catch (error) {
            console.warn('브라우저 핑거프린팅 실패:', error);
            return btoa(navigator.userAgent + Date.now());
        }
    }

    // 게임 세션 시작
    startGameSession() {
        this.gameSessionData = {
            startTime: Date.now(),
            lastLevelTime: Date.now(),
            scoreCheckpoints: [0],
            validationHash: this.generateValidationHash(0, 1, Date.now())
        };
    }

    // 게임 진행 중 검증 데이터 업데이트
    updateGameSession(score, level, gameTime) {
        const now = Date.now();
        const timeSinceStart = now - this.gameSessionData.startTime;
        
        if (this.gameSessionData.scoreCheckpoints.length > 0) {
            const lastScore = this.gameSessionData.scoreCheckpoints[this.gameSessionData.scoreCheckpoints.length - 1];
            const scoreDiff = score - lastScore;
            const timeDiff = timeSinceStart / 1000;
            
            if (scoreDiff > timeDiff * CONFIG.SECURITY.MAX_SCORE_PER_SECOND && score > 1000) {
                console.warn('비정상적인 점수 증가 감지');
                return false;
            }
        }

        if (level > 1 && (now - this.gameSessionData.lastLevelTime) < 3000) {
            console.warn('비정상적인 레벨 진행 감지');
            return false;
        }

        this.gameSessionData.scoreCheckpoints.push(score);
        this.gameSessionData.lastLevelTime = now;
        this.gameSessionData.validationHash = this.generateValidationHash(score, level, timeSinceStart);
        
        return true;
    }

    // 검증 해시 생성
    generateValidationHash(score, level, gameTime) {
        const data = `${score}-${level}-${Math.floor(gameTime/1000)}-${this.encryptionKey}`;
        return this.simpleHash(data);
    }

    // 간단한 해시 함수
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    // 입력 검증 및 정화
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .trim()
            .substring(0, this.maxNameLength)
            .replace(/[<>\"'&]/g, '') // XSS 방지
            .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, '') // 한글, 영문, 숫자만 허용
            .toUpperCase();
    }

    // 점수 유효성 검증
    validateScore(score, level, gameTime) {
        if (!Number.isInteger(score) || score < 0 || score > CONFIG.SECURITY.MAX_TOTAL_SCORE) {
            return { valid: false, reason: '유효하지 않은 점수' };
        }

        if (!Number.isInteger(level) || level < 1 || level > CONFIG.SECURITY.MAX_LEVEL) {
            return { valid: false, reason: '유효하지 않은 레벨' };
        }

        if (!Number.isInteger(gameTime) || gameTime < 0 || gameTime > 86400) {
            return { valid: false, reason: '유효하지 않은 게임 시간' };
        }

        if (score < this.minValidScore) {
            return { valid: false, reason: `최소 ${this.minValidScore}점 이상이어야 합니다` };
        }

        const maxPossibleScore = gameTime * CONFIG.SECURITY.MAX_SCORE_PER_SECOND;
        if (score > maxPossibleScore && score > 1000) {
            return { valid: false, reason: '시간 대비 점수가 비정상적입니다' };
        }

        const minTimeForLevel = (level - 1) * CONFIG.SECURITY.MIN_TIME_PER_LEVEL;
        if (gameTime < minTimeForLevel) {
            return { valid: false, reason: '레벨 진행이 너무 빠릅니다' };
        }

        const expectedHash = this.generateValidationHash(score, level, gameTime * 1000);
        if (this.gameSessionData.validationHash !== expectedHash) {
            return { valid: false, reason: '게임 세션 검증에 실패했습니다' };
        }

        return { valid: true };
    }

    // 제출 쿨다운 검증
    canSubmitScore() {
        const now = Date.now();
        if (now - this.lastSubmissionTime < this.submissionCooldown) {
            const remainingTime = Math.ceil((this.submissionCooldown - (now - this.lastSubmissionTime)) / 1000);
            return { 
                canSubmit: false, 
                reason: `${remainingTime}초 후에 다시 시도하세요` 
            };
        }
        return { canSubmit: true };
    }

    // 로컬 리더보드 로드
    loadLocalLeaderboard() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                return this.validateLeaderboardData(parsed);
            }
        } catch (error) {
            console.warn('로컬 리더보드 로드 실패:', error);
        }
        return []; // 빈 배열 반환 (더미 데이터 없음)
    }

    // 로컬 리더보드 저장
    saveLocalLeaderboard(leaderboard) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(leaderboard));
            console.log('✅ 리더보드 저장 완료:', leaderboard.length, '개 기록');
        } catch (error) {
            console.error('로컬 리더보드 저장 실패:', error);
            this.cleanupLocalStorage();
        }
    }

    // 로컬 저장소 정리
    cleanupLocalStorage() {
        try {
            const oldKeys = ['avoider_leaderboard', 'avoider_leaderboard_v1'];
            oldKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`오래된 데이터 삭제: ${key}`);
                }
            });
            
            const defaultData = [];
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        } catch (error) {
            console.error('로컬 저장소 정리 실패:', error);
            alert('저장 공간이 부족합니다. 브라우저 데이터를 정리해주세요.');
        }
    }

    // 리더보드 데이터 검증
    validateLeaderboardData(data) {
        if (!Array.isArray(data)) return [];
        
        return data
            .filter(entry => {
                return entry && 
                       typeof entry.name === 'string' && 
                       Number.isInteger(entry.score) && 
                       Number.isInteger(entry.level) && 
                       Number.isInteger(entry.time) &&
                       entry.score >= 0 && 
                       entry.level >= 1 &&
                       entry.time >= 0;
            })
            .slice(0, this.maxEntries);
    }

    // 리더보드 로드
    async loadLeaderboard() {
        return this.loadLocalLeaderboard();
    }

    // 점수가 리더보드에 등록 가능한지 확인
    async isNewRecord(score) {
        const validation = this.validateScore(score, 1, 1);
        if (!validation.valid) {
            console.warn('점수 검증 실패:', validation.reason);
            return false;
        }

        const leaderboard = await this.loadLeaderboard();
        
        // 리더보드가 10개 미만이거나, 최저 점수보다 높으면 신기록
        if (leaderboard.length < this.maxEntries) {
            return true;
        }
        
        const lowestScore = leaderboard[leaderboard.length - 1].score;
        return score > lowestScore;
    }

    // 새 기록 추가
    async addRecord(name, score, level, time) {
        const cooldownCheck = this.canSubmitScore();
        if (!cooldownCheck.canSubmit) {
            alert(cooldownCheck.reason);
            return null;
        }

        const sanitizedName = this.sanitizeInput(name) || "ANONYMOUS";
        
        const validation = this.validateScore(score, level, time);
        if (!validation.valid) {
            alert(`❌ 기록 등록 실패: ${validation.reason}`);
            return null;
        }

        this.lastSubmissionTime = Date.now();

        const newRecord = {
            name: sanitizedName,
            score: Math.floor(score),
            level: Math.floor(level),
            time: Math.floor(time),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            verified: false,
            sessionId: this.encryptionKey.substring(0, 8)
        };

        try {
            const leaderboard = await this.loadLeaderboard();
            
            leaderboard.push(newRecord);
            leaderboard.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.level !== a.level) return b.level - a.level;
                return b.time - a.time;
            });

            leaderboard.splice(this.maxEntries);

            this.saveLocalLeaderboard(leaderboard);

            console.log('🎉 새 기록 등록:', newRecord);
            return leaderboard;
        } catch (error) {
            console.error('기록 추가 실패:', error);
            alert('기록 저장 중 오류가 발생했습니다.');
            return null;
        }
    }

    // UI 렌더링
    async renderLeaderboard() {
        const leaderboard = await this.loadLeaderboard();
        const listElement = document.getElementById('leaderboardList');
        
        if (!listElement) return;
        
        listElement.innerHTML = '';
        
        // 빈 리더보드 메시지
        if (leaderboard.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-leaderboard-message';
            emptyMessage.innerHTML = `
                <div style="text-align: center; padding: 40px; opacity: 0.7;">
                    <h3>🏆 아직 기록이 없습니다!</h3>
                    <p>첫 번째 기록의 주인공이 되어보세요!</p>
                    <p>최소 ${this.minValidScore}점 이상 달성하면 리더보드에 등록됩니다.</p>
                </div>
            `;
            listElement.appendChild(emptyMessage);
            return;
        }
        
        leaderboard.forEach((entry, index) => {
            const rank = index + 1;
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            entryElement.setAttribute('role', 'listitem');
            
            if (rank <= 3) {
                entryElement.classList.add(`rank-${rank}`);
            }
            
            const verifiedIcon = entry.verified ? '✓' : '👤';
            const verifiedTitle = entry.verified ? '검증된 기록' : '플레이어 기록';
            const verifiedClass = entry.verified ? 'verified' : 'unverified';
            
            entryElement.innerHTML = `
                <div class="rank">${rank}</div>
                <div class="player-info">
                    <div class="player-name">
                        ${entry.name} 
                        <span class="verified-icon ${verifiedClass}" title="${verifiedTitle}">${verifiedIcon}</span>
                    </div>
                    <div class="player-stats">
                        <span class="score">${entry.score.toLocaleString()}점</span>
                        <span class="level">LV.${entry.level}</span>
                        <span class="time">${entry.time}초</span>
                        <span class="date">${entry.date}</span>
                    </div>
                </div>
            `;
            
            listElement.appendChild(entryElement);
        });
        
        // 빈 슬롯 표시
        for (let i = leaderboard.length; i < this.maxEntries; i++) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'leaderboard-entry empty';
            emptyElement.setAttribute('role', 'listitem');
            emptyElement.innerHTML = `
                <div class="rank">${i + 1}</div>
                <div class="player-info">
                    <div class="player-name">---</div>
                    <div class="player-stats">
                        <span class="score">-</span>
                        <span class="level">-</span>
                        <span class="time">-</span>
                        <span class="date">-</span>
                    </div>
                </div>
            `;
            listElement.appendChild(emptyElement);
        }
    }

    // Alert로 이름 입력받기 (더 간단한 방법)
    showNewRecordAlert(score, level, time) {
        const playerName = prompt(`🎉 축하합니다! 새로운 기록을 달성했습니다!

📊 달성 기록:
• 점수: ${score.toLocaleString()}점
• 레벨: ${level}
• 생존 시간: ${time}초

플레이어 이름을 입력하세요 (최대 ${this.maxNameLength}자):`);

        if (playerName !== null) { // 취소하지 않았으면
            this.submitRecordDirect(playerName || "ANONYMOUS", score, level, time);
        }
    }

    // 직접 기록 제출
    async submitRecordDirect(name, score, level, time) {
        try {
            const result = await this.addRecord(name, score, level, time);
            
            if (result) {
                if (typeof soundManager !== 'undefined') {
                    soundManager.playLevelUpSound();
                }
                
                // 성공 메시지
                alert(`✅ 기록이 성공적으로 등록되었습니다!

🏆 등록된 정보:
• 이름: ${name}
• 점수: ${score.toLocaleString()}점
• 순위: ${this.getPlayerRank(result, name, score)}위`);
            }
        } catch (error) {
            console.error('기록 제출 오류:', error);
            alert('❌ 기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    }

    // 플레이어 순위 찾기
    getPlayerRank(leaderboard, name, score) {
        const index = leaderboard.findIndex(entry => 
            entry.name === name && entry.score === score
        );
        return index !== -1 ? index + 1 : '?';
    }

    // 기존 모달 시스템도 유지 (선택 사용 가능)
    showNewRecordModal(score, level, time) {
        const validation = this.validateScore(score, level, time);
        if (!validation.valid) {
            alert(`기록이 유효하지 않습니다: ${validation.reason}`);
            return;
        }

        this.currentRecord = { score, level, time };
        
        // 현재 포커스된 요소 저장
        this.previouslyFocusedElement = document.activeElement;
        
        document.getElementById('recordScore').textContent = score.toLocaleString();
        document.getElementById('recordLevel').textContent = level;
        document.getElementById('recordTime').textContent = time;
        
        const nameInput = document.getElementById('playerName');
        nameInput.value = '';
        
        const overlay = document.getElementById('nameInputOverlay');
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
        
        setTimeout(() => {
            nameInput.focus();
        }, 100);
        
        nameInput.removeEventListener('keypress', this.handleEnterKey);
        nameInput.addEventListener('keypress', this.handleEnterKey);
        
        this.handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                this.skipRecord();
                document.removeEventListener('keydown', this.handleEscapeKey);
            }
        };
        document.addEventListener('keydown', this.handleEscapeKey);
    }

    handleEnterKey = (e) => {
        if (e.key === 'Enter') {
            submitRecord();
        }
    }

    // 기록 제출 (모달 버전)
    async submitRecord() {
        if (!this.currentRecord) return;
        
        const nameInput = document.getElementById('playerName');
        const playerName = nameInput.value.trim();
        
        if (!playerName) {
            alert('이름을 입력해주세요.');
            nameInput.focus();
            return;
        }

        const submitButton = document.querySelector('#nameInputOverlay .pixel-button:not(.secondary)');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.textContent = '저장 중...';
        
        try {
            const result = await this.addRecord(
                playerName,
                this.currentRecord.score,
                this.currentRecord.level,
                this.currentRecord.time
            );
            
            if (result) {
                this.closeNewRecordModal();
                
                if (typeof soundManager !== 'undefined') {
                    soundManager.playLevelUpSound();
                }
                
                this.showSuccessMessage('🎉 기록이 성공적으로 저장되었습니다!');
                
                showGameOverAfterRecord();
            }
        } catch (error) {
            console.error('기록 제출 오류:', error);
            alert('기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            submitButton.textContent = originalText;
        }
    }

    // 성공 메시지 표시
    showSuccessMessage(message) {
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'success-message';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #00ff00;
            color: #000;
            padding: 10px 20px;
            border: 3px solid #fff;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            z-index: 10001;
            animation: fadeInOut 3s ease-in-out;
        `;

        document.body.appendChild(messageElement);

        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    skipRecord() {
        this.closeNewRecordModal();
        showGameOverAfterRecord();
    }

    closeNewRecordModal() {
        const overlay = document.getElementById('nameInputOverlay');
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
        
        this.currentRecord = null;
        
        if (this.handleEscapeKey) {
            document.removeEventListener('keydown', this.handleEscapeKey);
            this.handleEscapeKey = null;
        }
        
        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
            this.previouslyFocusedElement = null;
        }
    }

    // 리더보드 모달 열기
    async openLeaderboard() {
        try {
            this.previouslyFocusedElement = document.activeElement;
            
            await this.renderLeaderboard();
            
            const overlay = document.getElementById('leaderboardOverlay');
            overlay.classList.add('show');
            overlay.setAttribute('aria-hidden', 'false');
            
            setTimeout(() => {
                const closeButton = overlay.querySelector('.pixel-button');
                if (closeButton) {
                    closeButton.focus();
                }
            }, 100);
            
        } catch (error) {
            console.error('리더보드 로드 오류:', error);
            alert('리더보드를 불러오는 중 오류가 발생했습니다.');
        }
    }

    // 리더보드 모달 닫기
    closeLeaderboard() {
        const overlay = document.getElementById('leaderboardOverlay');
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
        
        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
            this.previouslyFocusedElement = null;
        }
    }

    // 통계 정보
    getStatistics() {
        try {
            const leaderboard = this.loadLocalLeaderboard();
            
            return {
                totalEntries: leaderboard.length,
                highestScore: leaderboard.length > 0 ? leaderboard[0].score : 0,
                averageScore: leaderboard.length > 0 ? 
                    Math.round(leaderboard.reduce((sum, entry) => sum + entry.score, 0) / leaderboard.length) : 0,
                lastUpdated: new Date().toLocaleString()
            };
        } catch (error) {
            console.error('통계 정보 가져오기 실패:', error);
            return {
                totalEntries: 0,
                highestScore: 0,
                averageScore: 0,
                lastUpdated: '알 수 없음'
            };
        }
    }

    // 리더보드 초기화
    resetLeaderboard() {
        if (confirm('정말로 리더보드를 초기화하시겠습니까?\n\n⚠️ 모든 기록이 삭제되며 되돌릴 수 없습니다.')) {
            try {
                localStorage.removeItem(this.storageKey);
                this.showSuccessMessage('🗑️ 리더보드가 초기화되었습니다.');
                console.log('리더보드 초기화 완료');
            } catch (error) {
                console.error('리더보드 초기화 실패:', error);
                alert('리더보드 초기화에 실패했습니다.');
            }
        }
    }

    // 디버그 정보
    debugInfo() {
        console.group('🎮 Avoider.io 리더보드 디버그 정보');
        console.log('저장소 키:', this.storageKey);
        console.log('최소 유효 점수:', this.minValidScore);
        console.log('암호화 키:', this.encryptionKey.substring(0, 8) + '...');
        console.log('게임 세션 데이터:', this.gameSessionData);
        console.log('통계:', this.getStatistics());
        console.log('로컬 저장소 사용량:', JSON.stringify(this.loadLocalLeaderboard()).length, 'bytes');
        console.groupEnd();
    }
}

// 전역 리더보드 매니저 인스턴스
const leaderboardManager = new LeaderboardManager();

// 전역 함수들
function openLeaderboard() {
    leaderboardManager.openLeaderboard();
}

function closeLeaderboard() {
    leaderboardManager.closeLeaderboard();
}

function submitRecord() {
    leaderboardManager.submitRecord();
}

function skipRecord() {
    leaderboardManager.skipRecord();
}

function resetLeaderboard() {
    leaderboardManager.resetLeaderboard();
}

function showLeaderboardStats() {
    const stats = leaderboardManager.getStatistics();
    alert(`📊 리더보드 통계

전체 기록: ${stats.totalEntries}개
최고 점수: ${stats.highestScore.toLocaleString()}점
평균 점수: ${stats.averageScore.toLocaleString()}점

마지막 업데이트: ${stats.lastUpdated}`);
}

// 디버그 함수
window.debugLeaderboard = function() {
    leaderboardManager.debugInfo();
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Avoider.io 실제 리더보드 시스템 초기화 완료');
    console.log(`📋 최소 기록 점수: ${leaderboardManager.minValidScore}점`);
    
    if (typeof Storage === 'undefined') {
        console.warn('⚠️ 이 브라우저는 로컬 저장소를 지원하지 않습니다.');
        alert('이 브라우저는 로컬 저장소를 지원하지 않아 기록 저장이 불가능합니다.');
    }
});

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    
    .verified-icon.verified {
        color: var(--verified-color, #00dd00);
    }
    
    .verified-icon.unverified {
        color: var(--unverified-color, #ffaa00);
    }
    
    .empty-leaderboard-message {
        border: 2px dashed rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        margin: 20px 0;
    }
    
    .empty-leaderboard-message h3 {
        margin-bottom: 15px;
        color: #ffd700;
    }
    
    .empty-leaderboard-message p {
        margin-bottom: 10px;
        line-height: 1.4;
    }
`;
document.head.appendChild(style);