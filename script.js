const rocky = document.getElementById('rocky');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over-screen');
const startScreen = document.getElementById('start-screen');

let score = 0;
let isGameOver = true;
let position = 40; // висота від землі
let gravity = 2;
let isJumping = false;
let gameSpeed = 5;

// Стрибок як у Маріо
function jump() {
    if (isJumping || isGameOver) return;
    isJumping = true;
    let upInterval = setInterval(() => {
        if (position >= 220) {
            clearInterval(upInterval);
            let downInterval = setInterval(() => {
                if (position <= 40) {
                    clearInterval(downInterval);
                    isJumping = false;
                }
                position -= 5;
                rocky.style.bottom = position + 'px';
            }, 20);
        }
        position += 5;
        rocky.style.bottom = position + 'px';
    }, 20);
}

// Слухаємо тільки пробіл
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (isGameOver) {
            startGame();
        } else {
            jump();
        }
    }
});

function createObstacle() {
    if (isGameOver) return;
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    let obstacleLeft = 800;
    obstacle.style.left = obstacleLeft + 'px';
    gameContainer.appendChild(obstacle);

    let moveInterval = setInterval(() => {
        if (isGameOver) clearInterval(moveInterval);
        obstacleLeft -= gameSpeed;
        obstacle.style.left = obstacleLeft + 'px';

        // Колізія з перешкодою
        if (obstacleLeft > 100 && obstacleLeft < 170 && position < 80) {
            endGame();
            clearInterval(moveInterval);
        }
        
        if (obstacleLeft < -50) {
            clearInterval(moveInterval);
            obstacle.remove();
        }
    }, 20);

    // Рандомна поява наступної перешкоди
    setTimeout(createObstacle, Math.random() * 2000 + 1000);
}

function createStone() {
    if (isGameOver) return;
    const stone = document.createElement('div');
    stone.classList.add('stone');
    let stoneLeft = 800;
    let stoneBottom = Math.random() * 150 + 100;
    stone.style.left = stoneLeft + 'px';
    stone.style.bottom = stoneBottom + 'px';
    gameContainer.appendChild(stone);

    let moveInterval = setInterval(() => {
        if (isGameOver) clearInterval(moveInterval);
        stoneLeft -= gameSpeed;
        stone.style.left = stoneLeft + 'px';

        // Збір камінчика (Маріо стиль)
        if (stoneLeft > 100 && stoneLeft < 170 && 
            position + 70 > stoneBottom && position < stoneBottom + 35) {
            score += 10;
            scoreDisplay.innerText = score;
            stone.remove();
            clearInterval(moveInterval);
        }
    }, 20);

    setTimeout(createStone, Math.random() * 3000 + 1500);
}

function startGame() {
    isGameOver = false;
    score = 0;
    scoreDisplay.innerText = score;
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    
    // Очистка старих об'єктів
    document.querySelectorAll('.obstacle, .stone').forEach(el => el.remove());
    
    createObstacle();
    createStone();
}

function endGame() {
    isGameOver = true;
    gameOverScreen.classList.add('active');
    document.getElementById('final-score').innerText = score;
    document.getElementById('screenshot-score').innerText = score;
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

// Кнопка скріншоту
document.getElementById('share-btn').onclick = () => {
    html2canvas(document.getElementById('screenshot-export')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'seismic-score.png';
        link.href = canvas.toDataURL();
        link.click();
    });
};
