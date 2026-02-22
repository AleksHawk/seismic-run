const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('game-wrapper');
const scoreEl = document.getElementById('score-val');
const comboEl = document.getElementById('combo-val');

// аудіо
const bgMusic = new Audio('https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3');
bgMusic.loop = true; bgMusic.volume = 0.4;
const coinSfx = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3');
const hitSfx = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-explosion-with-glass-debris-1701.mp3');

// картинки
const rockyImg = new Image(); rockyImg.src = 'rocky.png';
const stoneImg = new Image(); stoneImg.src = 'stone.png';

let w, h;
function resize() {
    w = wrapper.clientWidth; h = wrapper.clientHeight;
    canvas.width = w; canvas.height = h;
}
window.addEventListener('resize', resize);
resize();

// змінні гри
let isLive = false, score = 0, speed = 6, combo = 0, feverMode = false;
let frameCount = 0, shakeTime = 0;
let isThrusting = false;
let obstacles = [], stones = [], particles = [];

const p = { x: 100, y: 0, w: 60, h: 60, vy: 0, floorY: 0, ceilY: 0 };

function initGame() {
    score = 0; speed = 6; combo = 0; feverMode = false; frameCount = 0;
    obstacles = []; stones = []; particles = [];
    isThrusting = false;
    p.floorY = h - 30; p.ceilY = 30;
    p.y = p.floorY - p.h; p.vy = 0;
    scoreEl.innerText = score; updateCombo();
    isLive = true;
    bgMusic.currentTime = 0; bgMusic.play().catch(()=>{});
    requestAnimationFrame(loop);
}

// управління джетпаком
function startThrust() { if (isLive) isThrusting = true; }
function stopThrust() { isThrusting = false; }

window.addEventListener('keydown', e => { if(e.code === 'Space') startThrust(); });
window.addEventListener('keyup', e => { if(e.code === 'Space') stopThrust(); });

wrapper.addEventListener('touchstart', e => { startThrust(); }, {passive: true});
wrapper.addEventListener('touchend', e => { stopThrust(); }, {passive: true});
wrapper.addEventListener('mousedown', e => { startThrust(); });
wrapper.addEventListener('mouseup', e => { stopThrust(); });

function spawn() {
    let type = Math.random() > 0.45 ? 'stone' : 'obstacle';
    
    if (type === 'obstacle') {
        let isTop = Math.random() > 0.5;
        let obsH = Math.random() * (h/2.5) + 40;
        obstacles.push({
            x: w, w: 50, h: obsH,
            y: isTop ? p.ceilY : p.floorY - obsH
        });
    } else {
        stones.push({
            x: w, y: Math.random() * (h - 140) + 70,
            w: 45, h: 45, collected: false
        });
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: Math.random() * 20 + 10, color: color
        });
    }
}

function updateCombo() {
    comboEl.innerText = `combo: ${combo}`;
    if (combo >= 5) {
        if (!feverMode) speed += 3; 
        feverMode = true;
        comboEl.classList.add('fever');
    } else {
        if (feverMode) speed -= 3;
        feverMode = false;
        comboEl.classList.remove('fever');
    }
}

function die() {
    isLive = false; shakeTime = 20; isThrusting = false;
    hitSfx.currentTime = 0; hitSfx.play().catch(()=>{});
    bgMusic.pause();
    if(navigator.vibrate) navigator.vibrate([300, 100, 300]);
    createParticles(p.x + p.w/2, p.y + p.h/2, '#ff0000', 50);
    
    setTimeout(() => {
        document.getElementById('final-score').innerText = Math.floor(score);
        document.getElementById('ss-score-val').innerText = Math.floor(score);
        document.getElementById('game-over').classList.add('active');
    }, 1000);
}

function loop() {
    if (shakeTime > 0) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
        shakeTime--;
    } else {
        ctx.save();
    }

    ctx.fillStyle = feverMode ? "rgba(40, 0, 0, 0.5)" : "rgba(10, 0, 20, 0.5)";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#ff4500";
    ctx.fillRect(0, p.ceilY - 5, w, 5);
    ctx.fillRect(0, p.floorY, w, 5);
    
    ctx.fillStyle = feverMode ? "#ffaa00" : "#00ffff";
    for(let i=0; i<6; i++) {
        ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*120+30, 2);
    }

    if (!isLive && particles.length === 0) { ctx.restore(); return; }
    if (isLive) frameCount++;

    if (isLive && frameCount % Math.max(30, 90 - Math.floor(speed*1.5)) === 0) spawn();

    // фізика джетпака
    if (isLive) {
        if (isThrusting) {
            p.vy -= 0.6; // тяга вгору
            createParticles(p.x + 10, p.y + p.h, '#ff4500', 2); // вогонь з джетпака
        } else {
            p.vy += 0.4; // гравітація вниз
        }
        
        p.vy *= 0.92; // опір повітря
        p.y += p.vy;
        
        // обмеження підлоги та стелі
        if (p.y + p.h > p.floorY) {
            p.y = p.floorY - p.h; p.vy = 0;
        } else if (p.y < p.ceilY) {
            p.y = p.ceilY; p.vy = 0;
        }

        score += feverMode ? 0.2 : 0.1;
        scoreEl.innerText = Math.floor(score);
        
        if (feverMode) createParticles(p.x, p.y + p.h/2, '#ffaa00', 1);
    }

    // перешкоди
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        if (isLive) obs.x -= speed;
        
        ctx.fillStyle = "#ff0000";
        ctx.shadowBlur = 20; ctx.shadowColor = "#ff0000";
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.shadowBlur = 0;

        if (isLive && p.x + 10 < obs.x + obs.w && p.x + p.w - 10 > obs.x && p.y + 10 < obs.y + obs.h && p.y + p.h - 10 > obs.y) {
            die();
        }
        if (obs.x + obs.w < 0) obstacles.splice(i, 1);
    }

    // камінці
    for (let i = stones.length - 1; i >= 0; i--) {
        let st = stones[i];
        if (isLive) st.x -= speed;
        
        if (!st.collected) {
            ctx.shadowBlur = 15; ctx.shadowColor = "#00ffff";
            ctx.drawImage(stoneImg, st.x, st.y, st.w, st.h);
            ctx.shadowBlur = 0;
            
            if (isLive && p.x < st.x + st.w && p.x + p.w > st.x && p.y < st.y + st.h && p.y + p.h > st.y) {
                st.collected = true;
                score += feverMode ? 40 : 15;
                combo++; updateCombo();
                coinSfx.currentTime = 0; coinSfx.play().catch(()=>{});
                if(navigator.vibrate) navigator.vibrate(40);
                createParticles(st.x + st.w/2, st.y + st.h/2, "#00ffff", 15);
            }
            
            if (isLive && st.x + st.w < p.x && !st.collected) {
                combo = 0; updateCombo();
                st.collected = true; 
            }
        }
        if (st.x + st.w < 0) stones.splice(i, 1);
    }

    // частинки
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx; pt.y += pt.vy; pt.life--;
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, 4, 4);
        if (pt.life <= 0) particles.splice(i, 1);
    }

    // гравець
    if (isLive) {
        ctx.save();
        ctx.shadowBlur = feverMode ? 25 : 10; 
        ctx.shadowColor = feverMode ? "#ff4500" : "#ffaa00";
        ctx.drawImage(rockyImg, p.x, p.y, p.w, p.h);
        ctx.restore();
    }

    ctx.restore();
    if (isLive || shakeTime > 0 || particles.length > 0) requestAnimationFrame(loop);
}

document.getElementById('btn-start').onclick = () => { document.getElementById('menu').classList.remove('active'); initGame(); };
document.getElementById('btn-restart').onclick = () => { document.getElementById('game-over').classList.remove('active'); initGame(); };

document.getElementById('btn-save').onclick = function() {
    const originalText = this.innerText;
    this.innerText = "saving...";
    html2canvas(document.getElementById('ss-export'), { backgroundColor: "#05000a", scale: 2, logging: false }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'seismic-run-record.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.innerText = "saved!";
        setTimeout(() => this.innerText = originalText, 2000);
    });
};

document.getElementById('btn-x').onclick = function() {
    const txt = encodeURIComponent(`запускаю новий челендж seismic run! 🚀\nмій рекорд: ${Math.floor(score)} балів 🪨\n\nспробуй побити: https://alekshawk.github.io/seismic-run/\n\nа я передаю естафету: @IMenlikovaOG @juliapiekh @garbar27`);
    window.open(`https://twitter.com/intent/tweet?text=${txt}`, '_blank');
};
