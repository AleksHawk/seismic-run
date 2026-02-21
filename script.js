const rocky = document.getElementById('rocky');
const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const shareBtn = document.getElementById('share-btn');
const screenshotExport = document.getElementById('screenshot-export');
const screenshotScore = document.getElementById('screenshot-score');
const bgLayers = document.querySelectorAll('.bg-layer');

let isJumping = false;
let isGameOver = true;
let score = 0;
let gameSpeed = 2000;
let spawnInterval;
let checkInterval;

function jump() {
    if (!isGameOver && !isJumping) {
        isJumping = true;
        rocky.classList.add('jump');
        
        setTimeout(() => {
            rocky.classList.remove('jump');
            isJumping = false;
        }, 600);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
});
gameContainer.addEventListener('mousedown', jump);
gameContainer.addEventListener('touchstart', jump);

function spawnEntity() {
    if (isGameOver) return;

    const isStone = Math.random() > 0.5;
    const entity = document.createElement('div');
    
    if (isStone) {
        entity.classList.add('stone');
        entity.style.bottom = Math.random() > 0.5 ? '120px' : '60px';
    } else {
        entity.classList.add('obstacle');
    }
    
    entity.classList.add('anim-move');
    entity.style.animationDuration = (gameSpeed / 1000) + 's';
    gameContainer.appendChild(entity);

    setTimeout(() => {
        if (entity.parentNode) {
            entity.remove();
        }
    }, gameSpeed);

    if (gameSpeed > 800) gameSpeed -= 10;
}

function checkCollision() {
    if (isGameOver) return;

    const rockyRect = rocky.getBoundingClientRect();
    const entities = document.querySelectorAll('.obstacle, .stone');

    entities.forEach(entity => {
        const entityRect = entity.getBoundingClientRect();

        if (
            rockyRect.right > entityRect.left + 10 &&
            rockyRect.left < entityRect.right - 10 &&
            rockyRect.bottom > entityRect.top + 10 &&
            rockyRect.top < entityRect.bottom - 10
        ) {
            if (entity.classList.contains('obstacle')) {
                endGame();
            } else if (entity.classList.contains('stone')) {
                score += 10;
                scoreElement.innerText = score;
                entity.remove();
            }
        }
    });
}

function startGame() {
    isGameOver = false;
    score = 0;
    gameSpeed = 2000;
    scoreElement.innerText = score;
    
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    gameContainer.parentElement.classList.remove('earthquake');
    
    document.querySelectorAll('.obstacle, .stone').forEach(e => e.remove());
    
    bgLayers.forEach(layer => layer.classList.add('anim-bg'));

    clearInterval(spawnInterval);
    clearInterval(checkInterval);
    
    spawnInterval = setInterval(spawnEntity, 1200);
    checkInterval = setInterval(checkCollision, 50);
}

function endGame() {
    isGameOver = true;
    clearInterval(spawnInterval);
    clearInterval(checkInterval);
    
    bgLayers.forEach(layer => layer.classList.remove('anim-bg'));
    document.querySelectorAll('.anim-move').forEach(e => e.style.animationPlayState = 'paused');
    
    gameContainer.parentElement.classList.add('earthquake');
    
    finalScoreElement.innerText = score;
    screenshotScore.innerText = score;
    
    setTimeout(() => {
        gameOverScreen.classList.add('active');
    }, 500);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

shareBtn.addEventListener('click', () => {
    const originalText = shareBtn.innerText;
    shareBtn.innerText = "saving...";
    
    html2canvas(screenshotExport, {
        backgroundColor: "#1a0500",
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'seismic-run-score.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        shareBtn.innerText = originalText;
    });
});
