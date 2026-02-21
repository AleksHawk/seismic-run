const player = document.getElementById('player');
const scoreEl = document.getElementById('score-val');
const container = document.getElementById('game-container');

let score = 0, currentLane = 1, isLive = false, speed = 5;
const lanes = [66, 200, 333]; // Позиції центрів ліній

function updatePlayerPos() {
    player.style.left = (lanes[currentLane] - 40) + 'px';
}

function startGame() {
    score = 0; speed = 5; isLive = true;
    scoreEl.innerText = score;
    document.getElementById('overlay').classList.remove('active');
    updatePlayerPos();
    spawnLoop();
    gameLoop();
}

function spawnLoop() {
    if (!isLive) return;
    
    const lane = Math.floor(Math.random() * 3);
    const type = Math.random() > 0.3 ? 'stone' : 'obstacle';
    
    const el = document.createElement('div');
    el.className = type === 'stone' ? 'stone-item' : 'obstacle';
    el.style.top = '-50px';
    el.style.left = lanes[lane] + 'px';
    container.appendChild(el);

    // Логіка руху об'єкта
    let pos = -50;
    const move = setInterval(() => {
        if (!isLive) { clearInterval(move); el.remove(); return; }
        
        pos += speed;
        el.style.top = pos + 'px';

        // Колізія
        if (pos > 470 && pos < 550 && lane === currentLane) {
            if (type === 'stone') {
                score += 10;
                scoreEl.innerText = score;
                el.remove();
                clearInterval(move);
            } else {
                gameOver();
            }
        }

        if (pos > 650) { el.remove(); clearInterval(move); }
    }, 20);

    setTimeout(spawnLoop, Math.max(400, 1000 - (score * 2)));
}

function gameLoop() {
    if (!isLive) return;
    speed += 0.002; // Поступове прискорення
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    isLive = false;
    document.getElementById('ss-score-val').innerText = score;
    document.getElementById('overlay').classList.add('active');
    document.querySelector('h1').innerText = "WASTED!";
    
    // Авто-скріншот через 1 сек
    setTimeout(takeScreenshot, 500);
}

function takeScreenshot() {
    html2canvas(document.getElementById('screenshot-export')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'seismic-surf-score.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

// Керування
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && currentLane > 0) currentLane--;
    if (e.key === 'ArrowRight' && currentLane < 2) currentLane++;
    updatePlayerPos();
});

// Тап на лінії (для мобільних)
document.getElementById('lane-0').onclick = () => { currentLane = 0; updatePlayerPos(); };
document.getElementById('lane-1').onclick = () => { currentLane = 1; updatePlayerPos(); };
document.getElementById('lane-2').onclick = () => { currentLane = 2; updatePlayerPos(); };
