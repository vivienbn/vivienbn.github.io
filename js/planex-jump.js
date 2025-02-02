import * as Cookies from "./cookies.js";
const MAX_BIRD_SIZE = 70;
const MIN_BIRD_SIZE = 40;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const vivienJump = new Image();
const vivienFall = new Image();
const startScreen = new Image();
let personnalBest = 0;
let flashCount = 0;
vivienJump.src = '../pictures/vivien-jump.png';
vivienFall.src = '../pictures/vivien-fall.png';
startScreen.src = '../pictures/planex-jump.png';

const bird = {
    x: Math.floor(canvas.width/5) - 12,
    y: Math.floor(canvas.width/2) - 12,
    size: 70,
    gravity: 0.6,
    lift: -10,
    velocity: 0,
};

const pipes = [];
const week = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const sizeCourse = [3,5];
const courses = {
    TRE: {
        color: "#ff93db",
        name: "TD TRE 3MIC - CSH 113 33"
    },
    ELECTIF: {
        color: "#ffa040",
        name: "TD Cours Electifs - CSH 204(VP)"
    },
    BDD: {
        color: "#9e9d40",
        name: "TP Base de Données 2 I3MIBD10 - \nGEI 024A"
    },
    SE: {
        color: "#8cffd9",
        name: "CM Systèmes d'exploitation \nI3IMSI - Amphi 103 ()"
    },
    PROG: {
        color: "#d9ff8c",
        name: "TP Programmation web I3MIWBG - \nGEI 109B"
    },
    OPTI: {
        color: "#ffd98c",
        name: "TP Optimisation et programmation \nlineaire - SS14"
    }
};
let pipeWidth = (canvas.width/5);
const pipeGap = 180;
const groundHeight = 40;
const groundSpeed = 4;
let score = 0;
let isGameOver = true;
let gameStarted = false;
let deathAnimation = false;

 function drawBackground() {
    ctx.fillStyle = "#F1F1F1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;



    for (let x = 0; x < canvas.width; x += (canvas.width/5)) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();   
    }
}

function shuffleSequence(sequence) {
    for (let i = sequence.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    return sequence;
}

function getCenterTextXPosition(xstart, size, text){
    let textLenght = ctx.measureText(text).width;
    let position = xstart + ((size - textLenght)/2);
    return position;
}

function drawGround() {
    let day = "";
    let position = 0;
    ctx.fillStyle = "white";
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    ctx.font = "1em Arial";
    for (let x = 0; x < canvas.width; x += canvas.width/5) {
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x, canvas.height - groundHeight + 1);
        ctx.stroke();
        day = week[Math.floor(x/(canvas.width/5))];
        position = getCenterTextXPosition(x, canvas.width/5, day);
        ctx.fillText(day, position , canvas.height - 15);
    }
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - groundHeight);
    ctx.lineTo(canvas.width, canvas.height - groundHeight + 1);
    ctx.stroke();
}

function drawBird() {
    if(bird.velocity < 0){
        ctx.drawImage(vivienJump, bird.x, bird.y, bird.size, bird.size); // Dessine l'image de l'oiseau
    } else {
        ctx.drawImage(vivienFall, bird.x, bird.y, bird.size, bird.size); // Dessine l'image de l'oiseau
    }
}

  // Fonction pour dessiner un rectangle avec des coins arrondis
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y); // Début au coin supérieur gauche
    ctx.lineTo(x + width - radius, y); // Ligne horizontale vers le coin supérieur droit
    ctx.arcTo(x + width, y, x + width, y + height, radius); // Coin supérieur droit
    ctx.lineTo(x + width, y + height - radius); // Ligne verticale vers le coin inférieur droit
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius); // Coin inférieur droit
    ctx.lineTo(x + radius, y + height); // Ligne horizontale vers le coin inférieur gauche
    ctx.arcTo(x, y + height, x, y + height - radius, radius); // Coin inférieur gauche
    ctx.lineTo(x, y + radius); // Ligne verticale vers le coin supérieur gauche
    ctx.arcTo(x, y, x + radius, y, radius); // Coin supérieur gauche

    ctx.closePath(); // Fermer le chemin
    ctx.stroke(); // Dessiner les bords
    ctx.fill(); // Remplir le rectangle
}

function generateSequence(targetSum) {
    let sequenceGenerated = [];
    while(targetSum != 0){
        if(targetSum < 3){
            sequenceGenerated.push(targetSum);
        } else if(targetSum > 4){
            sequenceGenerated.push(sizeCourse[Math.floor((Math.random() * 100)%2)]);
        } else {
            sequenceGenerated.push(3);
        }
        targetSum -= sequenceGenerated[sequenceGenerated.length - 1];
    }
    return shuffleSequence(sequenceGenerated);
}

function getRandomCourse(dict) {
    const keys = Object.keys(dict); // Obtenir toutes les clés
    const randomKey = keys[Math.floor(Math.random() * keys.length)]; // Choisir une clé aléatoire
    return dict[randomKey]; // Retourner l'objet correspondant à cette clé
}

function drawMultilineText(ctx, text, x, y, lineHeight) {
    const lines = text.split("\n"); // Diviser le texte sur les retours à la ligne
    lines.forEach((line, index) => {
        let textToDraw = tronkText(line, pipeWidth);
        ctx.fillText(textToDraw, x, y + index * lineHeight);
    });
}

function drawTronkedLine(ctx, text, x, y){
    const lines = text.split("\n");
    const subline= lines[0].substring(0, lines[0].length);
    ctx.fillText(tronkText(subline, pipeWidth), x, y);
}

function tronkText(text, size){
    let maxSize = size - 15;
    let ellipsis = '...';
    let ellipsisWidth = ctx.measureText(ellipsis).width;

    if (ctx.measureText(text).width <= maxSize) {
        return text;
    }
    
    let currentText = '';
    for (let i = 0; i < text.length; i++) {
        const newText = currentText + text[i];
        const measuredWidth = ctx.measureText(newText).width;

        if (measuredWidth + ellipsisWidth > maxSize) {
            return currentText + ellipsis;
        }
        currentText = newText;
    }
    return currentText;
}



function refreshHighscore(){
    personnalBest = Cookies.getOrCreateCookie("flappy-score", personnalBest, 365);
    if(score > personnalBest){
        personnalBest = score;
        Cookies.setCookie("flappy-score", score, 365);
        return true;
    }
    return false;
}

function drawCourse(x, course){
    ctx.fillStyle = course.color;
    drawRoundedRect(ctx, x, course.y + 1, pipeWidth, (course.size*20) - 1, 5);
    ctx.fillStyle = "black";
    ctx.font = "10px Arial";
    if(course.size < 2){
        drawTronkedLine(ctx, course.text, x + 10, course.y + 15);
    } else {
        drawMultilineText(ctx, course.text, x + 10, course.y + 15, 15);
    }
}

function generateCourses(nbSegments, y){
    let seqTop = generateSequence(nbSegments);
    let positionY = y;
    let coursesList = [];
    for (let num of seqTop) {
        let course = getRandomCourse(courses);
        let currentCourse = {
            y: positionY,
            color: course.color,
            text: course.name,
            size: num
        }
        coursesList.push(currentCourse);
        positionY += num*20;
    }
    return coursesList;
}


function drawCourses(x, courses){
    courses.forEach(course => {
        drawCourse(x, course);
    });
}

function drawPipes() {
    ctx.fillStyle = "green";
    pipes.forEach(pipe => {
        drawCourses(pipe.x, pipe.topCoursesList);
        drawCourses(pipe.x, pipe.botCoursesList);
    });
}

function updatePipes() {
    pipes.forEach(pipe => {
        pipe.x -= 4;
    });

    if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
        pipes.shift();
    }
}

function randomStep(step, area){
    return Math.floor(Math.random()*(area/step))*step;
}

function spawnPipe() {
    const topHeight = (Math.floor(Math.random()*((canvas.height - groundHeight - pipeGap - 60)/20))*20) + 20;
    const bottomHeight = canvas.height - groundHeight - topHeight - pipeGap;
    const topCourses = generateCourses(topHeight/20, 0);
    const botCourses = generateCourses(bottomHeight/20, topHeight + pipeGap);
    pipes.push({
        scored: false,
        x: canvas.width,
        top: topHeight,
        bottom: bottomHeight,
        topCoursesList: topCourses,
        botCoursesList: botCourses
    });
}

function clamp(min, max, value){
    return Math.max(min, Math.min(max, value));
}

function detectCollision(pipe, bird) {
    // Coordonnées du cercle (oiseau)
    let circleX = bird.x + bird.size / 2;
    let circleY = bird.y + bird.size / 2;
    let radius = bird.size / 2; // Le rayon du cercle

    // Coordonnées et dimensions du rectangle (pipe)
    let pipeX = pipe.x;
    let pipeTopHeight = pipe.top;
    let pipeBottomHeight = pipe.bottom;

    // Trouver les bords du rectangle du tuyau
    let closestX = clamp(pipeX, pipeX + pipeWidth, circleX); // La coordonnée X la plus proche du cercle
    let closestYTop = clamp(0, pipeTopHeight, circleY); // La coordonnée Y la plus proche du cercle sur la partie supérieure
    let closestYBottom = clamp(canvas.height - groundHeight - pipeBottomHeight, canvas.height - groundHeight, circleY); // La coordonnée Y la plus proche sur la partie inférieure

    // Calculer la distance entre le centre du cercle et le point le plus proche du tuyau
    let dx = circleX - closestX;
    let dyTop = circleY - closestYTop;
    let dyBottom = circleY - closestYBottom;

    // Calculer les distances du centre du cercle vers le point le plus proche sur chaque partie du tuyau
    let distanceTop = Math.sqrt(dx * dx + dyTop * dyTop); // Distance à la partie supérieure du tuyau
    let distanceBottom = Math.sqrt(dx * dx + dyBottom * dyBottom); // Distance à la partie inférieure du tuyau

    // Vérifier si l'une des deux distances est inférieure ou égale au rayon du cercle
    return distanceTop <= radius || distanceBottom <= radius;
}


function checkCollision() {
    pipes.forEach(pipe => {
        if (detectCollision(pipe, bird)
        ) {
            isGameOver = true;
            deathAnimation = true;
            onDeath();
        }
    });

    if (bird.y + bird.size > canvas.height - groundHeight || bird.y < 0) {
        isGameOver = true;
        deathAnimation = true;
        onDeath();
    }
}

function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Record: ${personnalBest}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    ctx.fillStyle = "white";
}

function drawGameOverScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "50px Arial";
    let text = "";
    if(refreshHighscore()){
        text = "New Record !"
    } else {
        text = "Score"
    }
    ctx.fillText(text, getCenterTextXPosition(0, canvas.width, text), canvas.height / 2 - 150);
    ctx.font = "80px Arial";
    text = `${score}`;
    ctx.fillText(text, getCenterTextXPosition(0, canvas.width, text), canvas.height / 2 - 10)
    ctx.font = "30px Arial";
    text = "Game Over";
    ctx.fillText(text, getCenterTextXPosition(0, canvas.width, text), canvas.height / 2 + 100);
    ctx.font = "20px Arial";
    text = "Press Space to Restart";
    ctx.fillText(text, getCenterTextXPosition(0, canvas.width, text), canvas.height / 2 + 140);
}

function resetGame() {
    bird.y = Math.floor(canvas.height/2) - 12;
    bird.velocity = 0;
    pipes.length = 0;
    score = 0;
    isGameOver = false;
}

function updateScore(){
    if (pipes.length > 0){
        if(pipes[0].x + (pipeWidth/2) < bird.x && pipes[0].scored == false){
            pipes[0].scored = true;
            score++;
        }
    }
}

function gameLoop() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    flashCount = 0;
    updatePipes();
    updateScore();
    drawBackground();
    drawGround();
    drawBird();
    drawPipes();
    checkCollision();
    drawScore();
}

function drawRotatedImage() {

    // Déplacer le contexte du canvas au centre pour que la rotation soit autour du centre de l'image
    ctx.translate(bird.x + bird.size/2, bird.y + bird.size/2 );

    // Appliquer la rotation
    ctx.rotate(rotation * Math.PI / 180); // Convertir l'angle en radians

    // Dessiner l'image avec son coin supérieur gauche au centre (ajuster la position)
    ctx.drawImage(vivienJump, 0, 0, bird.size, bird.size);

    // Remettre le contexte au système de coordonnées d'origine pour éviter les rotations supplémentaires
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawStartScreen(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(startScreen, 0, 0, canvas.width, canvas.height);
}

function animateDeath(){
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawGround();
    drawPipes();
    drawBird();
    drawScore();
    if(flashCount < 10){
        flashCount++;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashCount/10})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if(bird.y > canvas.height - groundHeight - 80){
        deathAnimation = false;
    }
}

function onDeath(){
    bird.velocity = 0;
    const intervalAnimation = setInterval(() => {
        if (deathAnimation) {
            animateDeath();
        } else {
            clearInterval(intervalAnimation);
            drawGameOverScreen();
        }
    }, 20);
}

function startGame() {
    setInterval(() => {
        if (!isGameOver) {
            gameStarted = true;
            gameLoop();
        }
    }, 20);

    setInterval(() => {
        if (!isGameOver) {
            if(pipes.length == 0){
                spawnPipe();
            } else if(pipes[pipes.length - 1].x < (canvas.width/5)*3 ){
                spawnPipe();
            }
        }
    }, 20);
}

window.onload = () => {
    personnalBest = Cookies.getOrCreateCookie("flappy-score", personnalBest, 365);
    resizeCanva();
    drawStartScreen();
    startGame();
};

canvas.addEventListener("touchstart", (e) => {
    if(isGameOver && !deathAnimation){
        resetGame();
    }
    if(!isGameOver){
        bird.velocity = bird.lift;
    }
});


function resizeCanva(){
    canvas.width = (window.innerWidth / 1.5);
    canvas.height = Math.floor((window.innerHeight / 1.5)/20)*20;
    pipeWidth = (canvas.width/5);
    bird.size = Math.max(MIN_BIRD_SIZE, Math.min(MAX_BIRD_SIZE, (canvas.width/100) * 7));
    bird.x = Math.floor(canvas.width/5) - 12
    if(!gameStarted){
        drawStartScreen();
    } else if (isGameOver && !deathAnimation){
        drawBackground();
        drawGround();
        drawPipes();
        drawBird();
        drawGameOverScreen();
    } 
}

window.addEventListener("resize", resizeCanva);

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        if (isGameOver && !deathAnimation) {
            resetGame();
        }
        if(!isGameOver){
            bird.velocity = bird.lift;
        }
    }
});