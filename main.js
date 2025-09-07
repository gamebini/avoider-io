// ===== MAIN.JS - 게임 초기화 및 전역 함수 =====
let game;

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas);
}

function startGame() {
    console.log('startGame() called'); // 디버깅용
    if (game) {
        game.start();
    } else {
        console.error('Game object not initialized');
    }
}

function goToMainMenu() {
    if (game) {
        game.goToMainMenu();
    }
}

function resumeGame() {
    if (game) {
        game.resumeGame();
    }
}

// 새 기록 입력 완료 후 게임오버 모달 표시
function showGameOverAfterRecord() {
    if (game) {
        game.showGameOverModal();
    }
}

// 문의 메일 열기 전역 함수 - 가장 간단한 버전
function openContactMail() {
    console.log('전역 openContactMail 함수 호출됨'); 
    
    if (game && game.openContactMail) {
        console.log('게임 객체를 통해 메일 열기');
        game.openContactMail();
    } else {
        console.log('게임 객체 없음, 직접 mailto 링크로 이동');
        window.location.href = 'mailto:cstv110301@gmail.com';
    }
}

// 게임 초기화
window.addEventListener('load', initGame);