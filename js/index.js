import * as Cookies from "../scripts/cookies.js";

function updateScores() {
    // Récupérer les scores depuis les cookies
    const scorePJ = Cookies.getCookie("flappy-score") || 0;
    const scoreTYR = Cookies.getCookie("third-year-run-score") || 0;
    const scoreMS = Cookies.getCookie("snake-score") || 0;

    // Modifier le texte dans les cellules du tableau
    document.getElementById("scorePJ").innerText = scorePJ;
    document.getElementById("scoreTYR").innerText = scoreTYR;
    document.getElementById("scoreMS").innerText = scoreMS;
}

document.addEventListener("DOMContentLoaded", updateScores);