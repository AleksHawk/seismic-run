const world = document.getElementById('game-world');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');

let pX = 100, pY = 100, velocityY = 0, isGrounded = false;
let score = 0, gameActive = false;
let keys = {};

// Генерація рівня (платформи та камінці)
const levelData = [
    { x: 0, y: 0, w: 1000, h: 40 }, // Земля
    { x: 400, y: 150, w: 200, h: 30 },
    { x: 700, y: 250, w: 150, h: 30 },
    { x: 1000, y: 150, w: 300, h: 30 },
];

const stones = [
    { x: 450, y: 190 }, { x: 750, y: 290 }, { x: 1100, y: 190 }
];

function buildLevel() {
    levelData.forEach(p => {
        const div = document.createElement('div');
        div.className = 'platform';
        div.style.left = p.x + 'px';
        div.style.bottom = p.y + 'px';
        div.style.width = p.w + 'px';
        div.style.height = p.h + 'px';
        world.appendChild(div);
    });

    stones.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'item-stone';
        div.id = 'stone-' + i;
        div.style.left = s.x + 'px';
        div.style.bottom = s.y + 'px';
        world.appendChild(div);
    });
}

function update() {
    if (!gameActive) return;

    // Рух
    if (keys['ArrowRight'] || keys['right']) pX += 7;
    if (keys['ArrowLeft'] || keys['left']) pX -= 7;

    // Гравітація
    velocityY -= 1.2;
    pY += velocityY;

    isGrounded = false;

    // Перевірка зіткнень з платформами
    levelData.forEach(p => {
        if (pX + 50 > p.x && pX < p.x + p.w && 
            pY <= p.y + p.h && pY + velocityY >= p.y + p.h - 20) {
            pY = p.y + p.h;
            velocityY = 0;
            isGrounded = true;
        }
    });

    // Перевірка збору камінців
    document.querySelectorAll('.item-stone').forEach(s => {
        let sX = parseInt(s.style.left);
        let sY = parseInt(s.style.bottom);
        if (pX + 50 > sX && pX < sX + 35 && pY + 60 > sY && pY < sY + 35) {
            s.remove();
            score += 10;
            scoreEl.innerText = score;
        }
    });

    // Смерть при падінні
    if (pY < -100) resetGame();

    // Оновлення позиції
    player.style.left = pX + 'px';
    player.style.bottom = pY + 'px';

    // Камера (як у Маріо)
    if (pX > 300) {
        world.style.transform = `translateX(-${pX - 300}px)`;
    }

    requestAnimationFrame(update);
}

function startGame() {
    document.getElementById('overlay').classList.remove('active');
    gameActive = true;
    buildLevel();
    update();
}

function resetGame() {
    location.reload(); // Найпростіший спосіб скинути рівень
}

// Керування
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Мобільні кнопки
const bL = document.getElementById('btn-left'), bR = document.getElementById('btn-right'), bJ = document.getElementById('btn-jump');
bL.ontouchstart = () => keys['left'] = true; bL.ontouchend = () => keys['left'] = false;
bR.ontouchstart = () => keys['right'] = true; bR.ontouchend = () => keys['right'] = false;
bJ.onclick = () => { if (isGrounded) velocityY = 20; };
window.addEventListener('keydown', e => { if (e.code === 'Space' && isGrounded) velocityY = 20; });
