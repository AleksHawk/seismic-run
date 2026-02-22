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
let spawnDelay = 900;

const lanes = 3;
const objects = [];
const particles = [];

function startGame(){
    score=0;
    speed=6;
    spawnDelay=900;
    objects.length=0;
    particles.length=0;
    menu.classList.remove("active");
    playing=true;
    spawn();
}

function gameOver(){
    playing=false;
    menu.classList.add("active");
}

function movePlayer(){
    const laneWidth = W/lanes;
    player.style.left = laneWidth*lane + laneWidth/2 - 45 + "px";
}

movePlayer();

window.onkeydown=e=>{
    if(e.key==="ArrowLeft" && lane>0) lane--;
    if(e.key==="ArrowRight" && lane<2) lane++;
    movePlayer();
};

let startX=0;
window.addEventListener("touchstart",e=>startX=e.touches[0].clientX);
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
        y:-80,
        type:Math.random()>0.35?"stone":"obstacle"
    });

    setTimeout(spawn,spawnDelay);
}

function createParticles(x,y,color){
    for(let i=0;i<20;i++){
        particles.push({
            x,y,
            vx:(Math.random()-0.5)*6,
            vy:Math.random()*-5,
            life:30,
            color
        });
    }
}

let difficultyTimer=0;

function loop(){
    requestAnimationFrame(loop);

    ctx.fillStyle="rgba(0,0,0,.3)";
    ctx.fillRect(0,0,W,H);

    // warp stars
    ctx.fillStyle="#ff4500";
    for(let i=0;i<40;i++){
        ctx.fillRect(Math.random()*W,Math.random()*H,2,10);
    }

    if(!playing) return;

    score+=0.15;
    scoreEl.innerText=Math.floor(score);

    difficultyTimer++;

    // збільшення складності кожні ~10 сек
    if(difficultyTimer>600){
        difficultyTimer=0;
        speed+=1;
        spawnDelay=Math.max(300,spawnDelay-120);
    }

    const laneWidth=W/lanes;

    objects.forEach((o,i)=>{
        o.y+=speed;

        const x=o.lane*laneWidth+laneWidth/2;

        if(o.type==="stone"){
            ctx.drawImage(stoneImg,x-20,o.y-20,40,40);
        }else{
            ctx.fillStyle="#ff0000";
            ctx.fillRect(x-25,o.y-25,50,50);
        }

        if(o.y>H) objects.splice(i,1);

        if(o.lane===lane && o.y>H-220 && o.y<H-140){
            if(o.type==="stone"){
                score+=20;
                createParticles(x,o.y,"cyan");
                objects.splice(i,1);
            }else{
                createParticles(x,o.y,"red");
                gameOver();
            }
        }
    });

    particles.forEach((p,i)=>{
        p.x+=p.vx;
        p.y+=p.vy;
        p.life--;
        ctx.fillStyle=p.color;
        ctx.fillRect(p.x,p.y,4,4);
        if(p.life<=0) particles.splice(i,1);
    });
}

const stoneImg=new Image();
stoneImg.src="stone.png";

loop();
