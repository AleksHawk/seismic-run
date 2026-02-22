const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('game-wrapper');
const scoreEl = document.getElementById('score-val');
const energyEl = document.getElementById('energy-val');
const playerNameInput = document.getElementById('player-name');

const rulesI18n = {
    en: { title: "rules:", r1: "hold space or touch screen to fly up", r2: "collect 5 stones to activate superpower", r3: "avoid red obstacles", r4: "in fever mode you are invincible!" },
    ua: { title: "правила:", r1: "затисни екран щоб летіти", r2: "збери 5 камінців для суперсили", r3: "уникай червоних труб", r4: "у fever mode ти безсмертний!" }
};

function setRulesLang(lang) {
    document.getElementById('text-rules').innerText = rulesI18n[lang].title;
    document.getElementById('rules-list').innerHTML = `<li>${rulesI18n[lang].r1}</li><li>${rulesI18n[lang].r2}</li><li>${rulesI18n[lang].r3}</li><li>${rulesI18n[lang].r4}</li>`;
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setRulesLang(btn.dataset.lang);
    };
});

const rockyImg = new Image(); rockyImg.src = 'rocky.png';
const stoneImg = new Image(); stoneImg.src = 'stone.png';

let w, h;
function resize() { 
    w = wrapper.clientWidth; 
    h = wrapper.clientHeight; 
    canvas.width = w; 
    canvas.height = h; 
}
window.addEventListener('resize', resize); resize();

// ПАРАМЕТРИ ШВИДКОСТІ ТА ФІЗИКИ
let isLive = false, score = 0, speed = 8.5;
let energy = 0, feverMode = false, feverTimer = 0, frameCount = 0, shakeTime = 0;
let isThrusting = false, obstacles = [], stones = [], particles = [], currentPlayerName = "";

const p = { x: 80, y: 0, w: 50, h: 50, vy: 0, floorY: 0, ceilY: 0 };

function initGame() {
    score = 0; speed = 8.5; energy = 0; feverMode = false; feverTimer = 0; frameCount = 0;
    obstacles = []; stones = []; particles = []; p.vy = 0;
    p.floorY = h - 30; p.ceilY = 30; p.y = h / 2;
    scoreEl.innerText = 0; energyEl.innerText = "energy: 0/5";
    isLive = true;
    requestAnimationFrame(loop);
}

function startThrust() { if (isLive) isThrusting = true; }
function stopThrust() { isThrusting = false; }

window.addEventListener('keydown', e => { if(e.code === 'Space') startThrust(); });
window.addEventListener('keyup', e => { if(e.code === 'Space') stopThrust(); });
wrapper.addEventListener('touchstart', e => { if(e.target.tagName !== 'BUTTON') startThrust(); }, {passive: true});
wrapper.addEventListener('touchend', stopThrust);

function spawn() {
    let level = Math.floor(frameCount / 900); // 15 сек = 900 кадрів
    let obstacleThreshold = Math.min(0.70, 0.20 + (level * 0.15));
    
    if (Math.random() > obstacleThreshold) {
        stones.push({ x: w, y: Math.random() * (h - 150) + 70, w: 40, h: 40, collected: false });
    } else {
        let obsH = Math.random() * (h/3) + 50;
        obstacles.push({ x: w, w: 50, h: obsH, y: Math.random() > 0.5 ? p.ceilY : p.floorY - obsH });
    }
}

function loop() {
    if (shakeTime > 0) { ctx.save(); ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10); shakeTime--; } else { ctx.save(); }
    
    ctx.fillStyle = feverMode ? "rgba(50, 0, 0, 0.6)" : "#0a0014";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ff4500"; ctx.fillRect(0, p.ceilY-5, w, 5); ctx.fillRect(0, p.floorY, w, 5);

    if (isLive) {
        frameCount++;
        // ФІЗИКА (РИВОК ТА ПАДІННЯ)
        if (isThrusting) p.vy -= 1.3; else p.vy += 1.0;
        p.vy *= 0.89; p.y += p.vy;

        if (p.y < p.ceilY || p.y + p.h > p.floorY) { isLive = false; shakeTime = 20; setTimeout(() => document.getElementById('game-over').classList.add('active'), 1000); }

        if (frameCount % 60 === 0) spawn();
        if (frameCount % 300 === 0) speed += 1.0;

        score += feverMode ? 0.4 : 0.1;
        scoreEl.innerText = Math.floor(score);

        ctx.drawImage(rockyImg, p.x, p.y, p.w, p.h);

        obstacles.forEach((obs, i) => {
            obs.x -= speed;
            ctx.fillStyle = "red"; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            if (p.x < obs.x + obs.w && p.x + p.w > obs.x && p.y < obs.y + obs.h && p.y + p.h > obs.y) {
                if (feverMode) { obstacles.splice(i, 1); score += 50; } else { isLive = false; die(); }
            }
        });

        stones.forEach((st, i) => {
            st.x -= speed;
            if (!st.collected) {
                ctx.drawImage(stoneImg, st.x, st.y, st.w, st.h);
                if (p.x < st.x + st.w && p.x + p.w > st.x && p.y < st.y + st.h && p.y + p.h > st.y) {
                    st.collected = true; energy++;
                    if (energy >= 5) { feverMode = true; feverTimer = 300; energy = 0; energyEl.innerText = "🔥 FEVER! 🔥"; }
                    else { energyEl.innerText = `energy: ${energy}/5`; }
                }
            }
        });

        if (feverMode) { feverTimer--; if (feverTimer <= 0) feverMode = false; }
    }

    ctx.restore();
    if (isLive || !isLive) requestAnimationFrame(loop);
}

document.getElementById('btn-start').onclick = () => { if (playerNameInput.value.trim()) { document.getElementById('menu').classList.remove('active'); initGame(); } };
document.getElementById('btn-restart').onclick = () => { document.getElementById('game-over').classList.remove('active'); initGame(); };
