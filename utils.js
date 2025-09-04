// ===== UTILS.JS - 유틸리티 함수 =====
const Utils = {
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
};