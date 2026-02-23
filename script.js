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

// ПРАВИЛЬНЕ НАЛАШТУВАННЯ FIREBASE (COMPAT SDK)
const firebaseConfig = {
  apiKey: "AIzaSyBF9qulhD2vkXaVvFWCP9yUypIu3xJLmto",
  authDomain: "seismic-run-8368a.firebaseapp.com",
  databaseURL: "https://seismic-run-8368a-default-rtdb.firebaseio.com",
  projectId: "seismic-run-8368a",
  storageBucket: "seismic-run-8368a.firebasestorage.app",
  messagingSenderId: "818412955795",
  appId: "1:818412955795:web:dd98ced7ff8ec95a330566"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ФУНКЦІЯ ЗАВАНТАЖЕННЯ ГЛОБАЛЬНОГО РЕКОРДУ В МЕНЮ
function loadGlobalBest() {
    db.ref('leaderboard').orderByChild('score').limitToLast(1).on('value', (snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                document.getElementById('best-name').innerText = child.key;
                document.getElementById('best-score').innerText = Math.floor(child.val().score);
                document.getElementById('text-lb-wait').innerText = "global record live";
            });
        }
    });
}
loadGlobalBest();

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

let isLive = false, score = 0, speed = 7.5;
let energy = 0, feverMode = false, feverTimer = 0, frameCount = 0, shakeTime = 0;
let isThrusting = false, obstacles = [], stones = [], particles = [], currentPlayerName = "";

const p = { x: 100, y: 0, w: 60, h: 60, vy: 0, floorY: 0, ceilY: 0 };

function tryStartGame() {
    const name = playerNameInput.value.trim();
    if (name === "") {
        playerNameInput.classList.add('input-error');
        inputGroup.classList.add('has-error');
        setTimeout(() => { playerNameInput.classList.remove('input-error'); inputGroup.classList.remove('has-error'); }, 1000);
        return; 
    }
    currentPlayerName = name;
    document.getElementById('menu').classList.remove('active');
    initGame();
}

function initGame() {
    score = 0; speed = 7.5; energy = 0; feverMode = false; feverTimer = 0; frameCount = 0;
    obstacles = []; stones = []; particles = []; p.vy = 0;
    p.floorY = h - 30; p.ceilY = 30; p.y = p.floorY - p.h;
    scoreEl.innerText = score; energyEl.innerText = `energy: 0/5`; energyEl.classList.remove('fever');
    isLive = true;
    document.getElementById('ss-foot-text').innerText = `can you beat ${currentPlayerName}'s score?`;
    bgMusic.currentTime = 0; bgMusic.play().catch(()=>{});
    requestAnimationFrame(loop);
}

function startThrust() { if (isLive) isThrusting = true; }
function stopThrust() { isThrusting = false; }

window.addEventListener('keydown', e => { if(e.code === 'Space') startThrust(); });
window.addEventListener('keyup', e => { if(e.code === 'Space') stopThrust(); });
wrapper.addEventListener('touchstart', e => { if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'A' && !e.target.classList.contains('lang-btn')) startThrust(); }, {passive: true});
wrapper.addEventListener('touchend', stopThrust, {passive: true});
wrapper.addEventListener('mousedown', e => { if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'A' && !e.target.classList.contains('lang-btn')) startThrust(); });
wrapper.addEventListener('mouseup', stopThrust);

function spawn() {
    // ДИНАМІКА: кожні 15 секунд (900 кадрів) камінців стає менше
    let level = Math.floor(frameCount / 900);
    let obstacleThreshold = Math.min(0.70, 0.40 + (level * 0.10));
    
    let type = Math.random() > obstacleThreshold ? 'stone' : 'obstacle';
    if (type === 'obstacle') {
        let isTop = Math.random() > 0.5;
        let obsH = Math.random() * (h/2.5) + 40;
        obstacles.push({ x: w, w: 50, h: obsH, y: isTop ? p.ceilY : p.floorY - obsH });
    } else {
        stones.push({ x: w, y: Math.random() * (h - 140) + 70, w: 45, h: 45, collected: false });
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, life: Math.random() * 20 + 10, color: color });
    }
}

function die() {
    isLive = false; shakeTime = 20; isThrusting = false;
    hitSfx.currentTime = 0; hitSfx.play().catch(()=>{}); bgMusic.pause();
    if(navigator.vibrate) navigator.vibrate([300, 100, 300]);
    createParticles(p.x + p.w/2, p.y + p.h/2, '#ff0000', 50);
    
    let finalSc = Math.floor(score);
    
    // СИНХРОНІЗАЦІЯ З FIREBASE
    if (finalSc > 0 && currentPlayerName) {
        const userRef = db.ref('leaderboard/' + currentPlayerName);
        userRef.once('value').then((snapshot) => {
            const oldScore = snapshot.val() ? snapshot.val().score : 0;
            if (finalSc > oldScore) {
                userRef.set({ score: finalSc });
            }
        });
    }

    if (finalSc > bestLocalScore) {
        bestLocalScore = finalSc; bestLocalName = currentPlayerName;
        localStorage.setItem('seismic_best_score', bestLocalScore);
        localStorage.setItem('seismic_best_name', bestLocalName);
    }

    setTimeout(() => {
        document.getElementById('final-score').innerText = finalSc;
        document.getElementById('ss-score-val').innerText = finalSc;
        document.getElementById('game-over').classList.add('active');
    }, 1000);
}

function loop() {
    if (shakeTime > 0) { ctx.save(); ctx.translate((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20); shakeTime--; } else { ctx.save(); }
    ctx.fillStyle = feverMode ? "rgba(40, 0, 0, 0.5)" : "rgba(10, 0, 20, 0.5)"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ff4500"; ctx.fillRect(0, p.ceilY - 5, w, 5); ctx.fillRect(0, p.floorY, w, 5);
    ctx.fillStyle = feverMode ? "#ffaa00" : "#00ffff"; for(let i=0; i<6; i++) { ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*120+30, 2); }

    if (!isLive && particles.length === 0) { ctx.restore(); return; }
    if (isLive) frameCount++;

    if (feverMode) {
        feverTimer--;
        if (feverTimer <= 0) {
            feverMode = false; energy = 0; speed -= 3;
            energyEl.innerText = `energy: 0/5`; energyEl.classList.remove('fever');
        }
    }

    if (isLive && frameCount % 240 === 0) {
        speed += 2.0; wrapper.style.boxShadow = "inset 0 0 60px #ff0000";
        setTimeout(() => wrapper.style.boxShadow = "none", 300);
    }

    if (isLive && frameCount % Math.max(20, 90 - Math.floor(speed*1.5)) === 0) spawn();

    if (isLive) {
        if (isThrusting) { p.vy -= 1.8; createParticles(p.x + 10, p.y + p.h, '#ff4500', 2); } else { p.vy += 1.2; }
        p.vy *= 0.85; p.y += p.vy;
        if (p.y + p.h > p.floorY) { p.y = p.floorY - p.h; p.vy = 0; } else if (p.y < p.ceilY) { p.y = p.ceilY; p.vy = 0; }
        score += feverMode ? 0.3 : 0.1; scoreEl.innerText = Math.floor(score);
        if (feverMode) createParticles(p.x, p.y + p.h/2, '#ffaa00', 1);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i]; if (isLive) obs.x -= speed;
        ctx.fillStyle = "#ff0000"; ctx.shadowBlur = 20; ctx.shadowColor = "#ff0000"; ctx.fillRect(obs.x, obs.y, obs.w, obs.h); ctx.shadowBlur = 0;
        if (isLive && p.x + 10 < obs.x + obs.w && p.x + p.w - 10 > obs.x && p.y + 10 < obs.y + obs.h && p.y + p.h - 10 > obs.y) {
            if (feverMode) {
                score += 50; hitSfx.currentTime = 0; hitSfx.play().catch(()=>{}); shakeTime = 15;
                createParticles(obs.x + obs.w/2, obs.y + obs.h/2, '#ff0000', 40); if(navigator.vibrate) navigator.vibrate(100);
                obstacles.splice(i, 1); continue;
            } else { die(); }
        }
        if (obs.x + obs.w < 0) obstacles.splice(i, 1);
    }

    for (let i = stones.length - 1; i >= 0; i--) {
        let st = stones[i]; if (isLive) st.x -= speed;
        if (!st.collected) {
            ctx.shadowBlur = 15; ctx.shadowColor = "#00ffff"; ctx.drawImage(stoneImg, st.x, st.y, st.w, st.h); ctx.shadowBlur = 0;
            if (isLive && p.x < st.x + st.w && p.x + p.w > st.x && p.y < st.y + st.h && p.y + p.h > st.y) {
                st.collected = true; score += feverMode ? 40 : 15;
                if (!feverMode) {
                    energy++;
                    if (energy >= 5) {
                        feverMode = true; feverTimer = 300; speed += 3;
                        energyEl.innerText = "🔥 fever mode! 🔥"; energyEl.classList.add('fever');
                    } else { energyEl.innerText = `energy: ${energy}/5`; }
                }
                coinSfx.currentTime = 0; coinSfx.play().catch(()=>{}); if(navigator.vibrate) navigator.vibrate(40);
                createParticles(st.x + st.w/2, st.y + st.h/2, "#00ffff", 15);
            }
        }
        if (st.x + st.w < 0) stones.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i]; pt.x += pt.vx; pt.y += pt.vy; pt.life--;
        ctx.fillStyle = pt.color; ctx.fillRect(pt.x, pt.y, 4, 4); if (pt.life <= 0) particles.splice(i, 1);
    }

    if (isLive) { ctx.save(); ctx.shadowBlur = feverMode ? 25 : 10; ctx.shadowColor = feverMode ? "#ff4500" : "#ffaa00"; ctx.drawImage(rockyImg, p.x, p.y, p.w, p.h); ctx.restore(); }
    ctx.restore(); if (isLive || shakeTime > 0 || particles.length > 0) requestAnimationFrame(loop);
}

document.getElementById('btn-start').onclick = tryStartGame;
document.getElementById('btn-restart').onclick = () => { document.getElementById('game-over').classList.remove('active'); initGame(); };
document.getElementById('btn-save').onclick = function() {
    const originalText = this.innerText; this.innerText = "saving...";
    html2canvas(document.getElementById('ss-export'), { backgroundColor: "#05000a", scale: 2, logging: false }).then(canvas => {
        const link = document.createElement('a'); link.download = 'seismic-run-record.png'; link.href = canvas.toDataURL('image/png'); link.click();
        this.innerText = "saved!"; setTimeout(() => this.innerText = originalText, 2000);
    });
};

document.getElementById('btn-x').onclick = function() {
    const txt = encodeURIComponent(`participating in a challenge from @AleksYastreb! 🚀\nmy record (${currentPlayerName}): ${Math.floor(score)} points 🪨\nmade with love for the @SeismicSys community ❤️\n\ntry to beat it: https://alekshawk.github.io/seismic-run/\n\ni pass the baton to: @`);
    window.open(`https://twitter.com/intent/tweet?text=${txt}`, '_blank');
};
