// ===== LEADERBOARD.JS - 웹 전용 보안 강화된 리더보드 시스템 =====
class LeaderboardManager {
    constructor() {
        this.storageKey = 'avoider_leaderboard_v2';
        this.maxEntries = 10;
        this.currentRecord = null;
        
        // GitHub API 설정 (선택사항 - 웹 전용이므로 주로 로컬 저장소 사용)
        this.apiEndpoint = 'https://api.github.com/repos/gamebini/avoider-io-data/contents/leaderboard.json';
        this.github_token = null; // GitHub Personal Access Token (없어도 됨)
        
        // 보안 및 검증 설정
        this.lastSubmissionTime = 0;
        this.submissionCooldown = 30000; // 30초 쿨다운
        this.maxNameLength = 15;
        this.minValidScore = 100; // 최소 유효 점수
        this.encryptionKey = this.generateEncryptionKey();
        
        // 해킹 방지를 위한 게임 세션 추적
        this.gameSessionData = {
            startTime: 0,
            lastLevelTime: 0,
            scoreCheckpoints: [],
            validationHash: null
        };
        
        // 웹 전용 설정
        this.webOnlyMode = true;
        this.syncAttempts = 0;
        this.maxSyncAttempts = 3;
    }

    // 암호화 키 생성 (브라우저 세션별 고유)
    generateEncryptionKey() {
        const browserFingerprint = this.getBrowserFingerprint();
        const sessionId = Date.now().toString(36) + Math.random().toString(36);
        return btoa(browserFingerprint + sessionId).substring(0, 32);
    }

    // 브라우저 핑거프린팅 (기본적인 수준)
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

    // 게임 세션 시작 시 호출
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
        
        // 비정상적인 점수 증가 감지
        if (this.gameSessionData.scoreCheckpoints.length > 0) {
            const lastScore = this.gameSessionData.scoreCheckpoints[this.gameSessionData.scoreCheckpoints.length - 1];
            const scoreDiff = score - lastScore;
            const timeDiff = timeSinceStart / 1000; // 초 단위
            
            // 점수 증가율 검증 (초당 최대 50점 정도로 제한)
            if (scoreDiff > timeDiff * CONFIG.SECURITY.MAX_SCORE_PER_SECOND && score > 1000) {
                console.warn('비정상적인 점수 증가 감지');
                return false;
            }
        }

        // 레벨 시간 검증 (최소 3초는 걸려야 함)
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
            hash = hash & hash; // 32비트 정수로 변환
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
            .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
            .toUpperCase();
    }

    // 점수 유효성 검증
    validateScore(score, level, gameTime) {
        // 기본 검증
        if (!Number.isInteger(score) || score < 0 || score > CONFIG.SECURITY.MAX_TOTAL_SCORE) {
            return { valid: false, reason: '유효하지 않은 점수' };
        }

        if (!Number.isInteger(level) || level < 1 || level > CONFIG.SECURITY.MAX_LEVEL) {
            return { valid: false, reason: '유효하지 않은 레벨' };
        }

        if (!Number.isInteger(gameTime) || gameTime < 0 || gameTime > 86400) {
            return { valid: false, reason: '유효하지 않은 게임 시간' };
        }

        // 최소 점수 검증
        if (score < this.minValidScore) {
            return { valid: false, reason: '점수가 너무 낮음' };
        }

        // 시간 대비 점수 검증 (대략적인 상한선)
        const maxPossibleScore = gameTime * CONFIG.SECURITY.MAX_SCORE_PER_SECOND;
        if (score > maxPossibleScore && score > 1000) {
            return { valid: false, reason: '시간 대비 점수가 비정상적' };
        }

        // 레벨 대비 최소 시간 검증
        const minTimeForLevel = (level - 1) * CONFIG.SECURITY.MIN_TIME_PER_LEVEL;
        if (gameTime < minTimeForLevel) {
            return { valid: false, reason: '레벨 진행이 너무 빠름' };
        }

        // 게임 세션 검증
        const expectedHash = this.generateValidationHash(score, level, gameTime * 1000);
        if (this.gameSessionData.validationHash !== expectedHash) {
            return { valid: false, reason: '게임 세션 검증 실패' };
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
                return this.validateLeaderboardData(JSON.parse(data));
            }
        } catch (error) {
            console.warn('로컬 리더보드 로드 실패:', error);
        }
        return this.getDefaultLeaderboard();
    }

    // 로컬 리더보드 저장
    saveLocalLeaderboard(leaderboard) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(leaderboard));
            console.log('로컬 리더보드 저장 완료');
        } catch (error) {
            console.error('로컬 리더보드 저장 실패:', error);
            // 저장 공간이 부족한 경우 오래된 데이터 정리
            this.cleanupLocalStorage();
        }
    }

    // 로컬 저장소 정리
    cleanupLocalStorage() {
        try {
            // 오래된 버전의 리더보드 데이터 삭제
            const oldKeys = ['avoider_leaderboard', 'avoider_leaderboard_v1'];
            oldKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`오래된 데이터 삭제: ${key}`);
                }
            });
            
            // 다시 저장 시도
            const defaultData = this.getDefaultLeaderboard();
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        } catch (error) {
            console.error('로컬 저장소 정리 실패:', error);
            alert('저장 공간이 부족합니다. 브라우저 데이터를 정리해주세요.');
        }
    }

    // 리더보드 데이터 검증
    validateLeaderboardData(data) {
        if (!Array.isArray(data)) return this.getDefaultLeaderboard();
        
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

    // 기본 리더보드 데이터
    getDefaultLeaderboard() {
        return [
            { name: "SYSTEM", score: 5000, level: 10, time: 120, date: new Date().toLocaleDateString(), verified: true },
            { name: "ADMIN", score: 3500, level: 8, time: 85, date: new Date().toLocaleDateString(), verified: true },
            { name: "PLAYER", score: 2500, level: 6, time: 60, date: new Date().toLocaleDateString(), verified: true },
            { name: "GUEST", score: 1500, level: 4, time: 35, date: new Date().toLocaleDateString(), verified: true },
            { name: "USER", score: 1000, level: 3, time: 25, date: new Date().toLocaleDateString(), verified: true }
        ];
    }

    // 리더보드 로드 (웹 전용 - 로컬 우선)
    async loadLeaderboard() {
        return this.loadLocalLeaderboard();
    }

    // 점수가 리더보드에 등록 가능한지 확인
    async isNewRecord(score) {
        const validation = this.validateScore(score, 1, 1); // 기본 검증
        if (!validation.valid) {
            console.warn('점수 검증 실패:', validation.reason);
            return false;
        }

        const leaderboard = await this.loadLeaderboard();
        
        if (leaderboard.length < this.maxEntries) {
            return true;
        }
        
        const lowestScore = leaderboard[leaderboard.length - 1].score;
        return score > lowestScore;
    }

    // 새 기록 추가 (웹 전용)
    async addRecord(name, score, level, time) {
        // 쿨다운 검증
        const cooldownCheck = this.canSubmitScore();
        if (!cooldownCheck.canSubmit) {
            alert(cooldownCheck.reason);
            return null;
        }

        // 입력 검증
        const sanitizedName = this.sanitizeInput(name) || "ANONYMOUS";
        
        // 점수 유효성 검증
        const validation = this.validateScore(score, level, time);
        if (!validation.valid) {
            alert(`점수 검증 실패: ${validation.reason}`);
            return null;
        }

        this.lastSubmissionTime = Date.now();

        const newRecord = {
            name: sanitizedName,
            score: Math.floor(score), // 정수로 변환
            level: Math.floor(level),
            time: Math.floor(time),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            verified: false, // 사용자 제출 기록은 미검증으로 표시
            sessionId: this.encryptionKey.substring(0, 8) // 세션 식별용
        };

        try {
            const leaderboard = await this.loadLeaderboard();
            
            // 기록 추가 및 정렬
            leaderboard.push(newRecord);
            leaderboard.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.level !== a.level) return b.level - a.level;
                return b.time - a.time;
            });

            // 상위 10개만 유지
            leaderboard.splice(this.maxEntries);

            // 로컬에 저장
            this.saveLocalLeaderboard(leaderboard);

            console.log('새 기록 추가 완료:', newRecord);
            return leaderboard;
        } catch (error) {
            console.error('기록 추가 실패:', error);
            alert('기록 저장 중 오류가 발생했습니다.');
            return null;
        }
    }

    // UI 렌더링 (검증 상태 표시 추가)
    async renderLeaderboard() {
        const leaderboard = await this.loadLeaderboard();
        const listElement = document.getElementById('leaderboardList');
        
        if (!listElement) return;
        
        listElement.innerHTML = '';
        
        leaderboard.forEach((entry, index) => {
            const rank = index + 1;
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            entryElement.setAttribute('role', 'listitem');
            
            if (rank <= 3) {
                entryElement.classList.add(`rank-${rank}`);
            }
            
            const verifiedIcon = entry.verified ? '✓' : '⚠';
            const verifiedTitle = entry.verified ? '검증된 기록' : '사용자 제출 기록';
            const verifiedClass = entry.verified ? 'verified' : 'unverified';
            
            entryElement.innerHTML = `
                <div class="rank">${rank}</div>
                <div class="player-info">
                    <div class="player-name">
                        ${entry.name} 
                        <span class="verified-icon ${verifiedClass}" title="${verifiedTitle}">${verifiedIcon}</span>
                    </div>
                    <div class="player-stats">
                        <span class="score">${entry.score.toLocaleString()}</span>
                        <span class="level">LV.${entry.level}</span>
                        <span class="time">${entry.time}s</span>
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

    // 새 기록 입력 모달 표시 (검증 강화)
    showNewRecordModal(score, level, time) {
        const validation = this.validateScore(score, level, time);
        if (!validation.valid) {
            alert(`기록이 유효하지 않습니다: ${validation.reason}`);
            return;
        }

        this.currentRecord = { score, level, time };
        
        document.getElementById('recordScore').textContent = score.toLocaleString();
        document.getElementById('recordLevel').textContent = level;
        document.getElementById('recordTime').textContent = time;
        
        const nameInput = document.getElementById('playerName');
        nameInput.value = '';
        nameInput.focus();
        
        document.getElementById('nameInputOverlay').classList.add('show');
        document.getElementById('nameInputOverlay').setAttribute('aria-hidden', 'false');
        
        // Enter 키 이벤트 (한 번만 등록)
        nameInput.removeEventListener('keypress', this.handleEnterKey);
        nameInput.addEventListener('keypress', this.handleEnterKey);
    }

    handleEnterKey = (e) => {
        if (e.key === 'Enter') {
            submitRecord();
        }
    }

    // 기록 제출 (async로 변경)
    async submitRecord() {
        if (!this.currentRecord) return;
        
        const nameInput = document.getElementById('playerName');
        const playerName = nameInput.value.trim();
        
        if (!playerName) {
            alert('이름을 입력해주세요.');
            nameInput.focus();
            return;
        }

        // 제출 버튼 비활성화 (중복 제출 방지)
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
                
                // 성공 메시지 표시
                this.showSuccessMessage('기록이 성공적으로 저장되었습니다!');
                
                showGameOverAfterRecord();
            }
        } catch (error) {
            console.error('기록 제출 오류:', error);
            alert('기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            // 버튼 복원
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            submitButton.textContent = originalText;
        }
    }

    // 성공 메시지 표시
    showSuccessMessage(message) {
        // 기존 메시지가 있으면 제거
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

        // 3초 후 자동 제거
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    // 기록 등록 건너뛰기
    skipRecord() {
        this.closeNewRecordModal();
        showGameOverAfterRecord();
    }

    // 새 기록 모달 닫기
    closeNewRecordModal() {
        document.getElementById('nameInputOverlay').classList.remove('show');
        document.getElementById('nameInputOverlay').setAttribute('aria-hidden', 'true');
        this.currentRecord = null;
    }

    // 리더보드 모달 열기 (async로 변경)
    async openLeaderboard() {
        try {
            await this.renderLeaderboard();
            document.getElementById('leaderboardOverlay').classList.add('show');
            document.getElementById('leaderboardOverlay').setAttribute('aria-hidden', 'false');
        } catch (error) {
            console.error('리더보드 로드 오류:', error);
            alert('리더보드를 불러오는 중 오류가 발생했습니다.');
        }
    }

    // 리더보드 모달 닫기
    closeLeaderboard() {
        document.getElementById('leaderboardOverlay').classList.remove('show');
        document.getElementById('leaderboardOverlay').setAttribute('aria-hidden', 'true');
    }

    // 리더보드 내보내기 (웹 전용 기능)
    exportLeaderboard() {
        try {
            const leaderboard = this.loadLocalLeaderboard();
            const dataStr = JSON.stringify(leaderboard, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `avoider-io-leaderboard-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            console.log('리더보드 내보내기 완료');
        } catch (error) {
            console.error('리더보드 내보내기 실패:', error);
            alert('리더보드 내보내기에 실패했습니다.');
        }
    }

    // 리더보드 가져오기 (웹 전용 기능)
    importLeaderboard(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                const validatedData = this.validateLeaderboardData(importedData);
                
                if (validatedData.length > 0) {
                    const currentData = this.loadLocalLeaderboard();
                    const mergedData = [...currentData, ...validatedData];
                    
                    // 중복 제거 및 정렬
                    const uniqueData = mergedData.filter((entry, index, self) => 
                        index === self.findIndex(e => 
                            e.name === entry.name && 
                            e.score === entry.score && 
                            e.level === entry.level
                        )
                    );
                    
                    uniqueData.sort((a, b) => {
                        if (b.score !== a.score) return b.score - a.score;
                        if (b.level !== a.level) return b.level - a.level;
                        return b.time - a.time;
                    });
                    
                    // 상위 10개만 유지
                    uniqueData.splice(this.maxEntries);
                    
                    this.saveLocalLeaderboard(uniqueData);
                    this.showSuccessMessage('리더보드를 성공적으로 가져왔습니다!');
                } else {
                    alert('유효한 리더보드 데이터가 없습니다.');
                }
            } catch (error) {
                console.error('리더보드 가져오기 실패:', error);
                alert('파일 형식이 올바르지 않습니다.');
            }
        };
        reader.readAsText(file);
    }

    // 리더보드 초기화
    resetLeaderboard() {
        if (confirm('정말로 리더보드를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            try {
                localStorage.removeItem(this.storageKey);
                this.showSuccessMessage('리더보드가 초기화되었습니다.');
                console.log('리더보드 초기화 완료');
            } catch (error) {
                console.error('리더보드 초기화 실패:', error);
                alert('리더보드 초기화에 실패했습니다.');
            }
        }
    }

    // 통계 정보 가져오기
    getStatistics() {
        try {
            const leaderboard = this.loadLocalLeaderboard();
            const userEntries = leaderboard.filter(entry => !entry.verified);
            
            return {
                totalEntries: leaderboard.length,
                userEntries: userEntries.length,
                systemEntries: leaderboard.length - userEntries.length,
                highestScore: leaderboard.length > 0 ? leaderboard[0].score : 0,
                averageScore: leaderboard.length > 0 ? 
                    Math.round(leaderboard.reduce((sum, entry) => sum + entry.score, 0) / leaderboard.length) : 0,
                lastUpdated: new Date().toLocaleString()
            };
        } catch (error) {
            console.error('통계 정보 가져오기 실패:', error);
            return {
                totalEntries: 0,
                userEntries: 0,
                systemEntries: 0,
                highestScore: 0,
                averageScore: 0,
                lastUpdated: '알 수 없음'
            };
        }
    }

    // 디버그 정보 출력
    debugInfo() {
        console.group('🎮 Avoider.io 리더보드 디버그 정보');
        console.log('저장소 키:', this.storageKey);
        console.log('웹 전용 모드:', this.webOnlyMode);
        console.log('암호화 키:', this.encryptionKey.substring(0, 8) + '...');
        console.log('게임 세션 데이터:', this.gameSessionData);
        console.log('통계:', this.getStatistics());
        console.log('로컬 저장소 사용량:', JSON.stringify(this.loadLocalLeaderboard()).length, 'bytes');
        console.groupEnd();
    }
}

// 전역 리더보드 매니저 인스턴스
const leaderboardManager = new LeaderboardManager();

// 전역 함수들 (HTML onclick에서 사용)
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

// 웹 전용 추가 기능들
function exportLeaderboard() {
    leaderboardManager.exportLeaderboard();
}

function resetLeaderboard() {
    leaderboardManager.resetLeaderboard();
}

function showLeaderboardStats() {
    const stats = leaderboardManager.getStatistics();
    alert(`📊 리더보드 통계
    
전체 기록: ${stats.totalEntries}개
사용자 기록: ${stats.userEntries}개
시스템 기록: ${stats.systemEntries}개

최고 점수: ${stats.highestScore.toLocaleString()}점
평균 점수: ${stats.averageScore.toLocaleString()}점

마지막 업데이트: ${stats.lastUpdated}`);
}

// 개발자 도구에서 사용할 수 있는 디버그 함수
window.debugLeaderboard = function() {
    leaderboardManager.debugInfo();
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Avoider.io 리더보드 시스템 (웹 전용) 초기화 완료');
    
    // 브라우저 호환성 체크
    if (typeof Storage === 'undefined') {
        console.warn('⚠️ 이 브라우저는 로컬 저장소를 지원하지 않습니다.');
        alert('이 브라우저는 로컬 저장소를 지원하지 않아 기록 저장이 불가능합니다.');
    }
});

// CSS 애니메이션 추가 (동적으로)
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
`;
document.head.appendChild(style);