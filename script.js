const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

let W,H;
function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
resize();
window.onresize = resize;

const player = document.getElementById("player");
const scoreEl = document.getElementById("score");
const menu = document.getElementById("menu");

let lane = 1;
let score = 0;
let speed = 6;
let playing = false;

const lanes = 3;
const objects = [];
const particles = [];

function startGame(){
    score = 0;
    speed = 6;
    objects.length = 0;
    particles.length = 0;
    menu.classList.remove("active");
    playing = true;
}

function gameOver(){
    playing = false;
    menu.classList.add("active");
}

function movePlayer(){
    const laneWidth = W/lanes;
    player.style.left = laneWidth * lane + laneWidth/2 - 45 + "px";
}

movePlayer();

window.onkeydown = e=>{
    if(e.key==="ArrowLeft" && lane>0) lane--;
    if(e.key==="ArrowRight" && lane<2) lane++;
    movePlayer();
};

let startX=0;
window.addEventListener("touchstart",e=> startX=e.touches[0].clientX);
window.addEventListener("touchend",e=>{
    const dx=e.changedTouches[0].clientX-startX;
    if(dx>50 && lane<2) lane++;
    if(dx<-50 && lane>0) lane--;
    movePlayer();
});

function spawn(){
    if(!playing) return;

    objects.push({
        lane:Math.floor(Math.random()*3),
        y:-100,
        type:Math.random()>0.3?"stone":"obstacle"
    });

    setTimeout(spawn,900 - speed*50);
}
spawn();

function createParticle(x,y){
    particles.push({
        x,y,
        vx:(Math.random()-0.5)*6,
        vy:Math.random()*-4,
        life:30
    });
}

function loop(){
    requestAnimationFrame(loop);

    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.fillRect(0,0,W,H);

    // warp stars
    ctx.fillStyle="#ff4500";
    for(let i=0;i<40;i++){
        ctx.fillRect(Math.random()*W,Math.random()*H,2,10);
    }

    if(!playing) return;

    score+=0.1;
    scoreEl.innerText=Math.floor(score);

    const laneWidth = W/lanes;

    objects.forEach((o,i)=>{
        o.y += speed;

        const x = o.lane*laneWidth + laneWidth/2;

        if(o.type==="stone"){
            ctx.fillStyle="#00ffff";
            ctx.beginPath();
            ctx.arc(x,o.y,20,0,Math.PI*2);
            ctx.fill();
        } else {
            ctx.fillStyle="#ff0000";
            ctx.fillRect(x-25,o.y-25,50,50);
        }

        if(o.y>H) objects.splice(i,1);

        if(o.lane===lane && o.y>H-200 && o.y<H-120){
            if(o.type==="stone"){
                score+=50;
                for(let p=0;p<20;p++) createParticle(x,o.y);
                objects.splice(i,1);
            } else {
                gameOver();
            }
        }
    });

    particles.forEach((p,i)=>{
        p.x+=p.vx;
        p.y+=p.vy;
        p.life--;

        ctx.fillStyle="orange";
        ctx.fillRect(p.x,p.y,3,3);

        if(p.life<=0) particles.splice(i,1);
    });

    speed+=0.002;
}

loop();
