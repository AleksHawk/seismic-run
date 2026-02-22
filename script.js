const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('game-wrapper');
const player = document.getElementById('player');
const entitiesLayer = document.getElementById('entities');
const scoreVal = document.getElementById('score-val');
const finalScore = document.getElementById('final-score');
const ssScoreVal = document.getElementById('ss-score-val');
const menu = document.getElementById('menu');
const gameOver = document.getElementById('game-over');

let w, h;
function resize() {
    w = wrapper.clientWidth;
    h = wrapper.clientHeight;
    canvas.width = w;
    canvas.height = h;
}
window.addEventListener('resize', resize);
resize();

let lane = 1;
let score = 0;
let speed = 8;
let isPlaying = false;
let frameCount = 0;
let entities = [];
let particles = [];

function getLaneX(l) {
    const step = w / 3;
    if (l === 0) return (step / 2);
    if (l === 1) return (step * 1.5);
    return (step * 2.5);
}

function updatePlayer() {
    const targetX = getLaneX(lane);
    const offset = targetX - (w / 2);
    player.style.transform = `translateX(${offset}px)`;
}

function spawn() {
    const l = Math.floor(Math.random() * 3);
    const isStone = Math.random() > 0.35;
    const el = document.createElement('div');
    el.className = `entity ${isStone ? 'stone' : 'obstacle'}`;
    entitiesLayer.appendChild(el);

    entities.push({ el: el, lane: l, y: -100, type: isStone ? 'stone' : 'obstacle' });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 30,
            color: color
        });
    }
}

function loop() {
    if (!isPlaying) return;
    frameCount++;

    ctx.fillStyle = "rgba(10, 0, 20, 0.5)";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#ff4500";
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 20 * (speed / 8));
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
    }

    if (frameCount % 600 === 0) {
        speed += 1.5;
        wrapper.style.boxShadow = "inset 0 0 60px #ff0000";
        setTimeout(() => wrapper.style.boxShadow = "none", 300);
    }

    let spawnRate = Math.max(20, 70 - (speed * 1.5));
    if (frameCount % Math.floor(spawnRate) === 0) spawn();

    score += 0.15;
    scoreVal.innerText = Math.floor(score);

    const playerY = h - 170;

    for (let i = entities.length - 1; i >= 0; i--) {
        let ent = entities[i];
        ent.y += speed;
        const xOffset = getLaneX(ent.lane) - (w / 2);
        ent.el.style.transform = `translate3d(${xOffset}px, ${ent.y}px, 0)`;

        if (ent.lane === lane && ent.y > playerY && ent.y < playerY + 80) {
            const px = getLaneX(ent.lane);
            if (ent.type === 'stone') {
                score += 20;
                createParticles(px, playerY + 45, "#00ffff");
                ent.el.remove();
                entities.splice(i, 1);
                continue;
            } else {
                createParticles(px, playerY + 45, "#ff0000");
                endGame();
                return;
            }
        }

        if (ent.y > h + 100) {
            ent.el.remove();
            entities.splice(i, 1);
        }
    }

    requestAnimationFrame(loop);
}

function startGame() {
    score = 0;
    speed = 8;
    frameCount = 0;
    lane = 1;
    isPlaying = true;
    scoreVal.innerText = 0;
    menu.classList.remove('active');
    gameOver.classList.remove('active');
    
    entities.forEach(ent => ent.el.remove());
    entities = [];
    particles = [];
    
    updatePlayer();
    requestAnimationFrame(loop);
}

function endGame() {
    isPlaying = false;
    finalScore.innerText = Math.floor(score);
    ssScoreVal.innerText = Math.floor(score);
    if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
    gameOver.classList.add('active');
}

window.addEventListener('keydown', e => {
    if (!isPlaying) return;
    if (e.key === 'ArrowLeft' && lane > 0) lane--;
    if (e.key === 'ArrowRight' && lane < 2) lane++;
    updatePlayer();
});

let touchStartX = 0;
wrapper.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
wrapper.addEventListener('touchend', e => {
    if (!isPlaying) return;
    let diff = touchStartX - e.changedTouches[0].screenX;
    if (diff > 40 && lane > 0) lane--;
    else if (diff < -40 && lane < 2) lane++;
    updatePlayer();
}, {passive: true});

document.getElementById('btn-start').onclick = startGame;
document.getElementById('btn-restart').onclick = startGame;

document.getElementById('btn-save').onclick = function() {
    const originalText = this.innerText;
    this.innerText = "saving...";
    html2canvas(document.getElementById('ss-export'), { backgroundColor: "#05000a", scale: 2, logging: false }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'seismic-record.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.innerText = "saved!";
        setTimeout(() => this.innerText = originalText, 2000);
    });
};

document.getElementById('btn-x').onclick = function() {
    const txt = encodeURIComponent(`запускаю новий челендж seismic run! 🔥\nмій рекорд: ${Math.floor(score)} балів 🪨\n\nспробуй побити: https://alekshawk.github.io/seismic-run/\n\nа я передаю естафету: @IMenlikovaOG @juliapiekh @garbar27`);
    window.open(`https://twitter.com/intent/tweet?text=${txt}`, '_blank');
};
