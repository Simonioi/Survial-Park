// Fonction appelée quand le joueur clique sur "JOUER"
function lancerMenu() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    
    if (typeof window.demarrerLeJeu === "function") {
        window.demarrerLeJeu(); 
    } else {
        console.error("Erreur : La connexion avec map.js n'est pas faite !");
    }
}

// L'astuce pour zapper le menu quand on vient du Dev Mode
window.addEventListener('DOMContentLoaded', () => {
    // On regarde l'URL de la page
    const urlParams = new URLSearchParams(window.location.search);
    
    // Si l'URL contient "?skipMenu=true"
    if (urlParams.get('skipMenu') === 'true') {
        
        // 1. On cache l'écran noir du menu tout de suite
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-ui').style.display = 'block';
        
        // 2. On patiente un instant que map.js charge les images, puis on lance !
        let attenteJeu = setInterval(() => {
            if (typeof window.demarrerLeJeu === "function") {
                window.demarrerLeJeu(); // Démarrage automatique
                clearInterval(attenteJeu); // On arrête de chercher
            }
        }, 100); // Vérifie toutes les 100 millisecondes
    }
});