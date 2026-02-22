const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('game-wrapper');
const scoreEl = document.getElementById('score-val');
const energyEl = document.getElementById('energy-val');
const playerNameInput = document.getElementById('player-name');
const inputGroup = document.querySelector('.input-group');

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

const firebaseConfig = { apiKey: "твоя-апі-ключ", authDomain: "твій-проект.firebaseapp.com", databaseURL: "https://твій-проект.firebaseio.com", projectId: "твій-проект" };
let db;
if (firebaseConfig.apiKey !== "твоя-апі-ключ") { firebase.initializeApp(firebaseConfig); db = firebase.database(); }

let bestLocalScore = localStorage.getItem('seismic_best_score') || 0;
let bestLocalName = localStorage.getItem('seismic_best_name') || 'nobody';
document.getElementById('best-name').innerText = bestLocalName;
document.getElementById('best-score').innerText = bestLocalScore;

const bgMusic = new Audio('https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3');
bgMusic.loop = true; bgMusic.volume = 0.4;
const coinSfx = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3');
const hitSfx = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-explosion-with-glass-debris-1701.mp3');
const rockyImg = new Image(); rockyImg.src = 'rocky.png';
const stoneImg = new Image(); stoneImg.src = 'stone.png';

let w, h;
function resize() { w = wrapper.clientWidth; h = wrapper.clientHeight; canvas.width = w; canvas.height = h; }
window.addEventListener('resize', resize); resize();

let isLive = false, score = 0, speed = 8.0;
let energy = 0, feverMode = false, feverTimer = 0, frameCount = 0, shakeTime = 0;
let isThrusting = false, obstacles = [], stones = [], particles = [], currentPlayerName = "";
const p = { x: 100, y: 0, w: 60, h: 60, vy: 0, floorY: 0, ceilY: 0 };

function tryStartGame() {
    const name = playerNameInput.value.trim();
    if (name === "") { playerNameInput.style.borderColor = "red"; return; }
    currentPlayerName = name; document.getElementById('menu').classList.remove('active'); initGame();
}

function initGame() {
    score = 0; speed = 8.0; energy = 0; feverMode = false; feverTimer = 0; frameCount = 0;
    obstacles = []; stones = []; particles = []; p.vy = 0;
    p.floorY = h - 30; p.ceilY = 30; p.y = h / 2;
    scoreEl.innerText = 0; energyEl.innerText = `energy: 0/5`; isLive = true;
    bgMusic.currentTime = 0; bgMusic.play().catch(()=>{}); requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => { if(e.code === 'Space') isThrusting = true; });
window.addEventListener('keyup', e => { if(e.code === 'Space') isThrusting = false; });
wrapper.addEventListener('touchstart', e => { if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') isThrusting = true; }, {passive: true});
wrapper.addEventListener('touchend', () => isThrusting = false);
wrapper.addEventListener('mousedown', e => { if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') isThrusting = true; });
wrapper.addEventListener('mouseup', () => isThrusting = false);

function spawn() {
    // Кожні 15 секунд (900 кадрів) камінців стає менше
    // Початковий шанс: 85% камінців. Кожні 15 сек шанс на трубу зростає.
    let level = Math.floor(frameCount / 900); 
    let obstacleThreshold = Math.min(0.70, 0.15 + (level * 0.15)); 
    
    if (Math.random() > obstacleThreshold) {
        stones.push({ x: w, y: Math.random() * (h - 160) + 80, w: 45, h: 45, collected: false });
    } else {
        let obsH = Math.random() * (h/2.5) + 50;
        obstacles.push({ x: w, w: 50, h: obsH, y: Math.random() > 0.5 ? p.ceilY : p.floorY - obsH });
    }
}

function die() {
    isLive = false; shakeTime = 20; hitSfx.play().catch(()=>{}); bgMusic.pause();
    setTimeout(() => {
        document.getElementById('final-score').innerText = Math.floor(score);
        document.getElementById('ss-score-val').innerText = Math.floor(score);
        document.getElementById('game-over').classList.add('active');
    }, 1000);
}

function loop() {
    if (shakeTime > 0) { ctx.save(); ctx.translate((Math.random()-0.5)*15, (Math.random()-0.5)*15); shakeTime--; } else { ctx.save(); }
    ctx.fillStyle = feverMode ? "rgba(60, 0, 0, 0.6)" : "#0a0014"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ff4500"; ctx.fillRect(0, p.ceilY-5, w, 5); ctx.fillRect(0, p.floorY, w, 5);
    
    if (isLive) {
        frameCount++;
        // --- РІЗКА ФІЗИКА ---
        if (isThrusting) p.vy -= 1.4; else p.vy += 1.1;
        p.vy *= 0.88; p.y += p.vy;
        
        if (p.y + p.h > p.floorY || p.y < p.ceilY) die();
        if (frameCount % 60 === 0) spawn();
        if (frameCount % 300 === 0) speed += 1.0;
        score += feverMode ? 0.4 : 0.15; scoreEl.innerText = Math.floor(score);

        ctx.drawImage(rockyImg, p.x, p.y, p.w, p.h);

        obstacles.forEach((obs, i) => {
            obs.x -= speed; ctx.fillStyle = "red"; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            if (p.x < obs.x + obs.w && p.x + p.w > obs.x && p.y < obs.y + obs.h && p.y + p.h > obs.y) {
                if (feverMode) { obstacles.splice(i, 1); score += 50; } else die();
            }
        });

        stones.forEach((st, i) => {
            st.x -= speed;
            if (!st.collected) {
                ctx.drawImage(stoneImg, st.x, st.y, st.w, st.h);
                if (p.x < st.x + st.w && p.x + p.w > st.x && p.y < st.y + st.h && p.y + p.h > st.y) {
                    st.collected = true; energy++; coinSfx.play().catch(()=>{});
                    if (energy >= 5) { feverMode = true; feverTimer = 300; energy = 0; speed += 3; energyEl.innerText = "🔥 FEVER! 🔥"; }
                    else energyEl.innerText = `energy: ${energy}/5`;
                }
            }
        });
        if (feverMode) { feverTimer--; if (feverTimer <= 0) { feverMode = false; speed -= 3; energyEl.innerText = "energy: 0/5"; } }
    }
    ctx.restore(); if (isLive || shakeTime > 0) requestAnimationFrame(loop);
}

document.getElementById('btn-start').onclick = tryStartGame;
document.getElementById('btn-restart').onclick = () => { document.getElementById('game-over').classList.remove('active'); initGame(); };
document.getElementById('btn-save').onclick = function() { html2canvas(document.getElementById('ss-export')).then(c => { let l = document.createElement('a'); l.download = 'rec.png'; l.href = c.toDataURL(); l.click(); }); };
document.getElementById('btn-x').onclick = function() { window.open(`https://twitter.com/intent/tweet?text=Score: ${Math.floor(score)}! @SeismicSys`, '_blank'); };
