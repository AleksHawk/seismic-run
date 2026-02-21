const player = document.getElementById('player');
const scoreEl = document.getElementById('score-val');
const container = document.getElementById('game-container');
const overlay = document.getElementById('overlay');

let score = 0, currentLane = 1, isLive = false;
let speed = 6, spawnRate = 1200;
const laneWidth = window.innerWidth > 450 ? 150 : window.innerWidth / 3;

function updatePlayerPos() {
    const offset = (window.innerWidth / 3) * currentLane + (window.innerWidth / 6) - 45;
    player.style.left = offset + 'px';
}

function startGame() {
    score = 0; speed = 6; spawnRate = 1200; isLive = true;
    scoreEl.innerText = score;
    overlay.classList.remove('active');
    updatePlayerPos();
    gameLoop();
    spawnLoop();
    createWarpLines();
}

// Прискорення кожні 10 секунд
setInterval(() => {
    if (isLive) {
        speed += 1.5;
        spawnRate = Math.max(400, spawnRate - 100);
        container.style.boxShadow = "inset 0 0 50px #ff4500";
        setTimeout(() => container.style.boxShadow = "none", 500);
    }
}, 10000);

function createWarpLines() {
    if (!isLive) return;
    const line = document.createElement('div');
    line.className = 'warp-line';
    line.style.left = Math.random() * 100 + '%';
    line.style.top = '-100px';
    container.appendChild(line);
    
    let pos = -100;
    const anim = setInterval(() => {
        pos += speed * 2;
        line.style.top = pos + 'px';
        if (pos > window.innerHeight) { clearInterval(anim); line.remove(); }
    }, 20);
    setTimeout(createWarpLines, 100);
}

function spawnLoop() {
    if (!isLive) return;
    const lane = Math.floor(Math.random() * 3);
    const type = Math.random() > 0.3 ? 'stone' : 'obstacle';
    const el = document.createElement('div');
    el.className = type === 'stone' ? 'stone-item' : 'obstacle';
    el.style.top = '-100px';
    el.style.left = (lane * 33.3) + 16.6 + '%';
    container.appendChild(el);

    let pos = -100;
    const move = setInterval(() => {
        if (!isLive) { clearInterval(move); el.remove(); return; }
        pos += speed;
        el.style.top = pos + 'px';

        // Перевірка колізії (адаптовано під мобільні)
        const pRect = player.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();

        if (eRect.bottom > pRect.top + 20 && eRect.top < pRect.bottom - 20 && lane === currentLane) {
            if (type === 'stone') {
                score += 10;
                scoreEl.innerText = score;
                el.remove(); clearInterval(move);
            } else {
                gameOver();
            }
        }
        if (pos > window.innerHeight) { el.remove(); clearInterval(move); }
    }, 20);
    setTimeout(spawnLoop, spawnRate);
}

function gameOver() {
    isLive = false;
    if (navigator.vibrate) navigator.vibrate(200);
    document.getElementById('ss-score-val').innerText = score;
    overlay.classList.add('active');
    overlay.querySelector('h1').innerText = "WASTED!";
    overlay.querySelector('p').innerText = "FINAL SCORE: " + score;
}

// Керування для телефону (свайпи або тапи)
let startX = 0;
container.addEventListener('touchstart', e => startX = e.touches[0].clientX);
container.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50 && currentLane > 0) currentLane--;
    else if (endX - startX > 50 && currentLane < 2) currentLane++;
    updatePlayerPos();
});

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && currentLane > 0) currentLane--;
    if (e.key === 'ArrowRight' && currentLane < 2) currentLane++;
    updatePlayerPos();
});

window.addEventListener('resize', updatePlayerPos);
updatePlayerPos();
