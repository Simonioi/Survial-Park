// Fonction appelée quand le joueur clique sur "JOUER"
function lancerMenu() {
    // 1. On cache le menu
    document.getElementById('main-menu').style.display = 'none';
    
    // 2. On affiche l'interface du jeu
    document.getElementById('game-ui').style.display = 'block';
    
    // 3. On déclenche le moteur de jeu de tes potes
    if (typeof window.demarrerLeJeu === "function") {
        window.demarrerLeJeu(); 
    } else {
        console.error("Erreur : La connexion avec map.js n'est pas faite !");
    }
}