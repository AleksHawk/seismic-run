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
function resize() { w = wrapper.clientWidth; h = wrapper.clientHeight; canvas.width = w; canvas.height = h; }
window.addEventListener('resize', resize); resize();

// ПОВЕРНУТО СТАБІЛЬНІ НАЛАШТУВАННЯ
let isLive = false, score = 0, speed = 7.5;
let energy = 0, feverMode = false, feverTimer = 0, frameCount = 0, shakeTime = 0;
let isThrusting = false, obstacles = [], stones = [], particles = [], currentPlayerName = "";

const p = { x: 100, y: 0, w: 60, h: 60, vy: 0, floorY: 0, ceilY: 0 };

function tryStartGame() {
    const name = playerNameInput.value.trim();
    if (name === "") {
        playerNameInput.style.borderColor = "red";
        setTimeout(() => playerNameInput.style.borderColor = "#00ffff", 1000);
        return; 
    }
    currentPlayerName = name;
    document.getElementById('menu').classList.remove('active');
    initGame();
}

function initGame() {
    score = 0; speed = 7.5; energy = 0; feverMode = false; feverTimer = 0; frameCount = 0;
    obstacles = []; stones = []; particles = []; p.vy = 0;
    p.floorY = h - 30; p.ceilY = 30; p.y = h - 100;
    scoreEl.innerText = "0"; energyEl.innerText = "energy: 0/5"; energyEl.classList.remove('fever');
    isLive = true;
    requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => { if(e.code === 'Space') isThrusting = true; });
window.addEventListener('keyup', e => { if(e.code === 'Space') isThrusting = false; });
wrapper.addEventListener('touchstart', e => { if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') isThrusting = true; }, {passive: true});
wrapper.addEventListener('touchend', () => isThrusting = false);
wrapper.addEventListener('mousedown', e => { if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') isThrusting = true; });
wrapper.addEventListener('mouseup', () => isThrusting = false);

function spawn() {
    let type = Math.random() > 0.45 ? 'stone' : 'obstacle';
    if (type === 'obstacle') {
        let obsH = Math.random() * (h/2.5) + 40;
        obstacles.push({ x: w, w: 50, h: obsH, y: Math.random() > 0.5 ? p.ceilY : p.floorY - obsH });
    } else {
        stones.push({ x: w, y: Math.random() * (h - 140) + 70, w: 45, h: 45, collected: false });
    }
}

function die() {
    isLive = false; shakeTime = 20;
    setTimeout(() => {
        document.getElementById('final-score').innerText = Math.floor(score);
        document.getElementById('ss-score-val').innerText = Math.floor(score);
        document.getElementById('game-over').classList.add('active');
    }, 1000);
}

function loop() {
    if (shakeTime > 0) { ctx.save(); ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10); shakeTime--; } else { ctx.save(); }
    
    ctx.fillStyle = feverMode ? "rgba(40, 0, 0, 0.5)" : "#0a0014";
    ctx.fillRect(0, 0, w, h);

    if (isLive) {
        frameCount++;
        if (isThrusting) p.vy -= 0.6; else p.vy += 0.4;
        p.vy *= 0.92; p.y += p.vy;

        if (p.y < p.ceilY || p.y + p.h > p.floorY) die();
        if (frameCount % 240 === 0) speed += 2.0;
        if (frameCount % Math.max(20, 90 - Math.floor(speed*1.5)) === 0) spawn();

        score += feverMode ? 0.3 : 0.1;
        scoreEl.innerText = Math.floor(score);

        // Малюємо Рокі
        ctx.save();
        ctx.shadowBlur = feverMode ? 25 : 10;
        ctx.shadowColor = feverMode ? "#ff4500" : "#ffaa00";
        ctx.drawImage(rockyImg, p.x, p.y, p.w, p.h);
        ctx.restore();

        obstacles.forEach((obs, i) => {
            obs.x -= speed;
            ctx.fillStyle = "#ff0000"; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            if (p.x < obs.x + obs.w && p.x + p.w > obs.x && p.y < obs.y + obs.h && p.y + p.h > obs.y) {
                if (feverMode) { obstacles.splice(i, 1); score += 50; } else die();
            }
        });

        stones.forEach((st, i) => {
            st.x -= speed;
            if (!st.collected) {
                ctx.drawImage(stoneImg, st.x, st.y, st.w, st.h);
                if (p.x < st.x + st.w && p.x + p.w > st.x && p.y < st.y + st.h && p.y + p.h > st.y) {
                    st.collected = true; energy++;
                    if (energy >= 5) { 
                        feverMode = true; feverTimer = 300; energy = 0; speed += 3; 
                        energyEl.innerText = "🔥 FEVER! 🔥"; energyEl.classList.add('fever'); 
                    } else { energyEl.innerText = `energy: ${energy}/5`; }
                }
            }
        });

        if (feverMode) { feverTimer--; if (feverTimer <= 0) { feverMode = false; speed -= 3; energyEl.innerText = "energy: 0/5"; energyEl.classList.remove('fever'); } }
    }

    ctx.restore();
    if (isLive || shakeTime > 0) requestAnimationFrame(loop);
}

document.getElementById('btn-start').onclick = tryStartGame;
document.getElementById('btn-restart').onclick = () => { document.getElementById('game-over').classList.remove('active'); initGame(); };
document.getElementById('btn-save').onclick = () => { 
    html2canvas(document.getElementById('ss-export'), {backgroundColor: "#05000a"}).then(c => {
        let l = document.createElement('a'); l.download = 'seismic_record.png'; l.href = c.toDataURL(); l.click();
    });
};
document.getElementById('btn-x').onclick = () => {
    const txt = encodeURIComponent(`my record in Seismic Run: ${Math.floor(score)} points! 🚀\nmade with love for the @SeismicSys community ❤️\n\ntry it: https://alekshawk.github.io/seismic-run/`);
    window.open(`https://twitter.com/intent/tweet?text=${txt}`, '_blank');
};
