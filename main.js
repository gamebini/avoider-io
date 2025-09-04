// ===== MAIN.JS - 게임 초기화 및 전역 함수 =====
let game;

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas);
}

function startGame() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameContainer').classList.add('show');
    document.getElementById('gameOverOverlay').classList.remove('show');
    game.start();
}

function goToMainMenu() {
    document.getElementById('mainMenu').classList.remove('hidden');
    document.getElementById('gameContainer').classList.remove('show');
    document.getElementById('pauseOverlay').classList.remove('show');
    document.getElementById('gameOverOverlay').classList.remove('show');
}

function resumeGame() {
    game.resumeGame();
}

// 게임 초기화
window.addEventListener('load', initGame);