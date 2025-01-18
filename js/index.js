import * as Cookies from "./cookies.js";

const LINK = {
    PJ: {DOM: document.getElementById("PJlink"), HREF: './planex-jump.html'},
    TYR: {DOM: document.getElementById("TYRlink"), HREF: './school-runner.html'},
    MS: {DOM: document.getElementById("MSlink"), HREF: './mathisnake.html'}
}

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

function setLink(object){
    object.DOM.onclick = ()=>{
        window.location.href = object.HREF;
    }
}

function setLinks(){
    setLink(LINK.PJ);
    setLink(LINK.TYR);
    setLink(LINK.MS);
}

function loadDom(){
    updateScores();
    setLinks();
}

document.addEventListener("DOMContentLoaded", loadDom);
