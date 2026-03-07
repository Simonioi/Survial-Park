// Function call when the player click on play
function lancerMenu() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    
    if (typeof window.demarrerLeJeu === "function") {
        window.demarrerLeJeu(); 
    } else {
        console.error("Erreur : La connexion avec map.js n'est pas faite !");
    }
}

// skip menu
window.addEventListener('DOMContentLoaded', () => {
    // we look the url
    const urlParams = new URLSearchParams(window.location.search);
    
    // if it contains "?skipMenu=true"
    if (urlParams.get('skipMenu') === 'true') {
        
        // we hide the black screen instantly
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-ui').style.display = 'block';
        
        // we wait the loading of map.js and we start
        let attenteJeu = setInterval(() => {
            if (typeof window.demarrerLeJeu === "function") {
                window.demarrerLeJeu(); // auto start
                clearInterval(attenteJeu); // stop searching 
            }
        }, 100); // verification 
    }
});