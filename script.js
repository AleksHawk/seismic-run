const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
});

const rockyImg = new Image();
rockyImg.src = "rocky.png";

const stoneImg = new Image();
stoneImg.src = "stone.png";

let isThrusting = false;
let gameOver = false;
let score = 0;
let speed = 4;
let feverMode = false;
let feverTimer = 0;
let shakeTime = 0;

const player = {
  x: 150,
  y: h/2,
  w: 70,
  h: 70,
  vy: 0
};

let stones = [];
let obstacles = [];

document.addEventListener("mousedown", () => isThrusting = true);
document.addEventListener("mouseup", () => isThrusting = false);
document.addEventListener("touchstart", () => isThrusting = true);
document.addEventListener("touchend", () => isThrusting = false);

function spawnStone() {
  stones.push({
    x: w + 50,
    y: Math.random() * (h - 100) + 50,
    size: 40
  });
}

function spawnObstacle() {
  obstacles.push({
    x: w + 50,
    y: Math.random() * (h - 200) + 100,
    w: 80,
    h: 80
  });
}

setInterval(spawnStone, 1200);
setInterval(spawnObstacle, 2500);

function update() {

  if (gameOver) return;

  // ⭐ NEW ARCADE PHYSICS
  const THRUST = 3.2;
  const GRAVITY = 2.4;
  const DRAG = 0.93;

  if (isThrusting) {
    player.vy -= THRUST;
  } else {
    player.vy += GRAVITY;
  }

  player.vy *= DRAG;

  // LIMIT SPEED
  player.vy = Math.max(-15, Math.min(15, player.vy));

  player.y += player.vy;

  if (player.y < 0 || player.y > h - player.h) {
    gameOver = true;
  }

  stones.forEach((s, i) => {
    s.x -= speed;

    if (collide(player, s)) {
      score += feverMode ? 40 : 15;
      shakeTime = 6;
      stones.splice(i, 1);

      if (score % 200 === 0) {
        feverMode = true;
        feverTimer = 300;
        shakeTime = 25;
      }
    }
  });

  obstacles.forEach((o) => {
    o.x -= speed;
    if (collide(player, o)) {
      gameOver = true;
    }
  });

  if (feverMode) {
    feverTimer--;
    if (feverTimer <= 0) feverMode = false;
  }

  speed += 0.0006;
  if (shakeTime > 0) shakeTime--;
}

function draw() {

  ctx.save();

  if (shakeTime > 0) {
    ctx.translate(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0,0,w,h);

  // SPEED LINES
  ctx.fillStyle = feverMode ? "#ffaa00" : "#00ffff";
  for(let i=0;i<8;i++){
    ctx.fillRect(Math.random()*w, Math.random()*h, speed*8, 2);
  }

  // STONES
  stones.forEach(s => {
    ctx.drawImage(stoneImg, s.x, s.y, s.size, s.size);
  });

  // OBSTACLES
  ctx.fillStyle = "red";
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });

  // PLAYER WITH TILT
  ctx.save();

  let tilt = player.vy * 0.04;
  tilt = Math.max(-0.6, Math.min(0.6, tilt));

  ctx.translate(player.x + player.w/2, player.y + player.h/2);
  ctx.rotate(tilt);
  ctx.drawImage(rockyImg, -player.w/2, -player.h/2, player.w, player.h);

  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial";
  ctx.fillText("Score: " + score, 30, 40);

  if (feverMode) {
    ctx.fillStyle = "orange";
    ctx.fillText("FEVER MODE!", 30, 80);
  }

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "60px Arial";
    ctx.fillText("GAME OVER", w/2 - 180, h/2);
  }

  ctx.restore();
}

function collide(a, b) {
  return a.x < b.x + (b.w || b.size) &&
         a.x + a.w > b.x &&
         a.y < b.y + (b.h || b.size) &&
         a.y + a.h > b.y;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
