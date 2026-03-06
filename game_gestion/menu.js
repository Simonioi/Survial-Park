// Cette fonction est déclenchée par le bouton "▶ JOUER" de ton fichier index.html
function startGame() {
    // 1. On cache l'écran noir du menu principal
    document.getElementById('main-menu').style.display = 'none';
    
    // 2. On affiche la zone qui contient les canvas du jeu et les contrôles
    document.getElementById('game-ui').style.display = 'block';
    
    // 3. On donne le signal pour démarrer la boucle du jeu et les monstres !
    // IMPORTANT : Tes potes doivent créer cette fonction dans leur code (ex: gameLoop.js)
    if (typeof demarrerLeJeu === "function") {
        demarrerLeJeu(); 
    } else {
        console.warn("Attention : La fonction demarrerLeJeu() n'a pas encore été créée par tes potes !");
        // Si le jeu se lance déjà tout seul au chargement de la page pour le moment, 
        // ce n'est pas grave, le menu s'effacera et on verra le jeu qui tournait en fond.
    }
}