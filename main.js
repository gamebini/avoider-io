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

// 게임 초기화
window.addEventListener('load', initGame);