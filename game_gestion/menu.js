const MENU_MAP_MODE_KEY = 'survivalPark_map_mode';

function readSelectedMapMode() {
    const modeSelect = document.getElementById('map-mode');
    if (!modeSelect || !modeSelect.value) return 'maze';
    return modeSelect.value === 'kill-room' ? 'kill-room' : 'maze';
}

// Function called when the player clicks "PLAY"
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

// Trick to skip the menu when coming from Dev Mode
window.addEventListener('DOMContentLoaded', () => {
    // Read the page URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const modeSelect = document.getElementById('map-mode');
    const storedMode = localStorage.getItem(MENU_MAP_MODE_KEY);
    if (modeSelect && (storedMode === 'maze' || storedMode === 'kill-room')) {
        modeSelect.value = storedMode;
    }
    
    // If the URL contains "?skipMenu=true"
    if (urlParams.get('skipMenu') === 'true') {
        const urlMode = urlParams.get('mapMode');
        const fallbackMode = localStorage.getItem(MENU_MAP_MODE_KEY) || 'maze';
        const autoMode = (urlMode === 'kill-room' || urlMode === 'maze') ? urlMode : fallbackMode;
        localStorage.setItem(MENU_MAP_MODE_KEY, autoMode);
        
        // 1. Hide the menu black screen immediately
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-ui').style.display = 'block';
        
        // 2. Wait briefly for map.js to load assets, then start
        let attenteJeu = setInterval(() => {
            if (typeof window.demarrerLeJeu === "function") {
                window.demarrerLeJeu(autoMode); // Automatic start
                clearInterval(attenteJeu); // Stop polling
            }
        }, 100); // Check every 100 milliseconds
    }
});