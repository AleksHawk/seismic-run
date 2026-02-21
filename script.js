const world = document.getElementById('game-world');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');

// Налаштування фізики (Маріо-стайл)
let pX = 50, pY = 200, velX = 0, velY = 0;
let gravity = 0.8, friction = 0.8, jumpPower = -16;
let score = 0, isLive = false;
let keys = {};

// Дані рівня
const platforms = [
    {x: 0, y: 0, w: 800, h: 50}, // Початкова земля
    {x: 900, y: 0, w: 1200, h: 50}, // Наступна ділянка
    {x: 300, y: 150, w: 150, h: 30},
    {x: 550, y: 250, w: 200, h: 30},
    {x: 1000, y: 180, w: 200, h: 30}
];

const stones = [
    {x: 350, y: 190}, {x: 600, y: 290}, {x: 1100, y: 220}
];

// Створюємо світ
function buildLevel() {
    platforms.forEach(p => {
        const el = document.createElement('div');
        el.className = 'platform';
        el.style.left = p.x + 'px';
        el.style.bottom = p.y + 'px';
        el.style.width = p.w + 'px';
        el.style.height = p.h + 'px';
        world.appendChild(el);
    });

    stones.forEach(s => {
        const el = document.createElement('div');
        el.className = 'item-stone';
        el.style.left = s.x + 'px';
        el.style.bottom = s.y + 'px';
        world.appendChild(el);
    });
}

function update() {
    if (!isLive) return;

    // Керування
    if (keys['ArrowRight']) velX += 1.5;
    if (keys['ArrowLeft']) velX -= 1.5;
    if ((keys['Space'] || keys['ArrowUp']) && player.onGround) {
        velY = jumpPower;
        player.onGround = false;
    }

    // Застосування фізики
    velX *= friction;
    velY += gravity;
    pX += velX;
    pY -= velY;

    player.onGround = false;

    // Колізії з платформами
    platforms.forEach(p => {
        // Перевірка чи гравець над платформою
        if (pX + 40 > p.x && pX < p.x + p.w) {
            let platTop = 400 - p.y - p.h;
            // Приземлення
            if (pY + 50 >= platTop && pY + 50 <= platTop + 20 && velY >= 0) {
                pY = platTop - 50;
                velY = 0;
                player.onGround = true;
            }
        }
    });

    // Збір камінців
    document.querySelectorAll('.item-stone').forEach(s => {
        let sX = parseInt(s.style.left);
        let sY = 400 - parseInt(s.style.bottom) - 30;
        if (Math.abs(pX - sX) < 40 && Math.abs(pY - sY) < 40) {
            s.remove();
            score += 10;
            scoreEl.innerText = score;
        }
    });

    // Оновлення екрану
    player.style.left = pX + 'px';
    player.style.top = pY + 'px';

    // Камера
    if (pX > 300) {
        world.style.left = -(pX - 300) + 'px';
    }

    // Падіння в прірву
    if (pY > 450) die();

    requestAnimationFrame(update);
}

function die() {
    isLive = false;
    document.getElementById('game-over').classList.add('active');
}

function startGame() {
    document.getElementById('menu').classList.remove('active');
    isLive = true;
    buildLevel();
    update();
}

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
