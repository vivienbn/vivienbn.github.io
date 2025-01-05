import * as Cookies from "../scripts/cookies.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configuration du jeu
const boxSize = 20; // Taille des cases
const COLORS = {
    SNAKE: 'rgb(49,221,11)',
    BACKGROUND: 'black',
    FRUIT: 'red'
}
let snake = [{ x: 10, y: 10 }]; // Position initiale du serpent
let direction = null;
let food = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
let score = 0;
let record = 0;
refreshHighscore();

// Déplacer le serpent
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
    if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
});

function drawGame() {
    // Efface l'écran
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // dessiner le background
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Dessiner la nourriture
    ctx.fillStyle = COLORS.FRUIT;
    ctx.fillRect(food.x * boxSize, food.y * boxSize, boxSize, boxSize);

    // Déplacer le serpent
    let head = { ...snake[0] };
    if (direction === "UP") head.y -= 1;
    if (direction === "DOWN") head.y += 1;
    if (direction === "LEFT") head.x -= 1;
    if (direction === "RIGHT") head.x += 1;

    // Ajouter la nouvelle tête
    snake.unshift(head);

    // Vérifier si le serpent mange la nourriture
    if (head.x === food.x && head.y === food.y) {
        score++;
        food = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
    } else {
        snake.pop(); // Supprime le dernier segment
    }

    // Dessiner le serpent
    ctx.fillStyle = COLORS.SNAKE;
    snake.forEach((segment) => {
        ctx.fillRect(segment.x * boxSize, segment.y * boxSize, boxSize - 1, boxSize - 1);
    });

    // Collision avec les murs ou le serpent
    if (
        head.x < 0 || head.x >= canvas.width / boxSize ||
        head.y < 0 || head.y >= canvas.height / boxSize ||
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        alert(`Game Over! Score: ${score}`);
        snake = [{ x: 10, y: 10 }];
        direction = null;
        refreshHighscore();
        score = 0;
    }

    // Afficher le score
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Record: ${record}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
}

// Mise à jour du record
function refreshHighscore(){
    record = Cookies.getOrCreateCookie("snake-score", record, 365);
    if(score > record){
        record = score;
        Cookies.setCookie("snake-score", score, 365);
        return true;
    }
    return false;
}

// Rafraîchir le jeu toutes les 100 ms
setInterval(drawGame, 100);
