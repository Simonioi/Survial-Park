const MENU_MAP_MODE_KEY = 'survivalPark_map_mode';

function readSelectedMapMode() {
    const modeSelect = document.getElementById('map-mode');
    if (!modeSelect || !modeSelect.value) return 'maze';
    return modeSelect.value === 'kill-room' ? 'kill-room' : 'maze';
}

// Fonction appelée quand le joueur clique sur "JOUER"
function lancerMenu(mode) {
    const selectedMode = mode || readSelectedMapMode();
    localStorage.setItem(MENU_MAP_MODE_KEY, selectedMode);

    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    
    if (typeof window.demarrerLeJeu === "function") {
        window.demarrerLeJeu(selectedMode); 
    } else {
        console.error("Erreur : La connexion avec map.js n'est pas faite !");
    }
}

// L'astuce pour zapper le menu quand on vient du Dev Mode
window.addEventListener('DOMContentLoaded', () => {
    // On regarde l'URL de la page
    const urlParams = new URLSearchParams(window.location.search);
    const modeSelect = document.getElementById('map-mode');
    const storedMode = localStorage.getItem(MENU_MAP_MODE_KEY);
    if (modeSelect && (storedMode === 'maze' || storedMode === 'kill-room')) {
        modeSelect.value = storedMode;
    }
    
    // Si l'URL contient "?skipMenu=true"
    if (urlParams.get('skipMenu') === 'true') {
        const urlMode = urlParams.get('mapMode');
        const fallbackMode = localStorage.getItem(MENU_MAP_MODE_KEY) || 'maze';
        const autoMode = (urlMode === 'kill-room' || urlMode === 'maze') ? urlMode : fallbackMode;
        localStorage.setItem(MENU_MAP_MODE_KEY, autoMode);
        
        // 1. On cache l'écran noir du menu tout de suite
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-ui').style.display = 'block';
        
        // 2. On patiente un instant que map.js charge les images, puis on lance !
        let attenteJeu = setInterval(() => {
            if (typeof window.demarrerLeJeu === "function") {
                window.demarrerLeJeu(autoMode); // Démarrage automatique
                clearInterval(attenteJeu); // On arrête de chercher
            }
        }, 100); // Vérifie toutes les 100 millisecondes
    }
});