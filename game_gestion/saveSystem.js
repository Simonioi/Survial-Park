/**
 * Save System Module
 * Handles localStorage communication for game state persistence
 * Keeps game state synced between main game and dev mode
 */

const STORAGE_KEY_NPCS = 'survivalPark_npcs';
const STORAGE_KEY_CAMERA = 'survivalPark_camera';
const STORAGE_KEY_SCORE = 'survivalPark_score';

/**
 * Save current NPC state to localStorage
 * @param {Array} npcs - Array of NPC objects
 * @returns {number} Number of NPCs saved
 */
function saveNPCsToStorage(npcs) {
    const npcData = npcs
        .filter(npc => npc && !npc.isDead)
        .map(npc => ({
            x: npc.x,
            y: npc.y
        }));
    
    localStorage.setItem(STORAGE_KEY_NPCS, JSON.stringify(npcData));
    console.log(`✓ Saved ${npcData.length} NPCs to localStorage`);
    return npcData.length;
}

/**
 * Load NPC positions from localStorage
 * @returns {Array|null} Array of NPC data {x, y} or null if no data
 */
function loadNPCsFromStorage() {
    const npcData = localStorage.getItem(STORAGE_KEY_NPCS);
    
    if (!npcData) {
        console.log('No NPCs in localStorage');
        return null;
    }
    
    try {
        const npcs = JSON.parse(npcData);
        console.log(`✓ Loaded ${npcs.length} NPC positions from localStorage`);
        return npcs;
    } catch (error) {
        console.error('Failed to load NPCs from localStorage:', error);
        return null;
    }
}

/**
 * Save camera position to localStorage
 * @param {Object} camera - Camera object with x, y, d properties
 */
function saveCameraToStorage(camera) {
    const cameraData = {
        x: camera.x,
        y: camera.y,
        d: camera.d
    };
    
    localStorage.setItem(STORAGE_KEY_CAMERA, JSON.stringify(cameraData));
    console.log(`✓ Saved camera position (${Math.round(camera.x)}, ${Math.round(camera.y)}, ${Math.round(camera.d)}°) to localStorage`);
}

/**
 * Load camera position from localStorage
 * @returns {Object|null} Camera data {x, y, d} or null if no data
 */
function loadCameraFromStorage() {
    const cameraData = localStorage.getItem(STORAGE_KEY_CAMERA);
    
    if (!cameraData) {
        console.log('No camera position in localStorage');
        return null;
    }
    
    try {
        const camera = JSON.parse(cameraData);
        console.log(`✓ Loaded camera position (${Math.round(camera.x)}, ${Math.round(camera.y)}, ${Math.round(camera.d)}°) from localStorage`);
        return camera;
    } catch (error) {
        console.error('Failed to load camera from localStorage:', error);
        return null;
    }
}

/**
 * Save score to localStorage
 * @param {Object} score - Score object with kills and shots properties
 */
function saveScoreToStorage(score) {
    const scoreData = {
        kills: score.kills || 0,
        shots: score.shots || 0
    };
    
    localStorage.setItem(STORAGE_KEY_SCORE, JSON.stringify(scoreData));
    console.log(`✓ Saved score (Kills: ${scoreData.kills}, Shots: ${scoreData.shots}) to localStorage`);
}

/**
 * Load score from localStorage
 * @returns {Object|null} Score data {kills, shots} or null if no data
 */
function loadScoreFromStorage() {
    const scoreData = localStorage.getItem(STORAGE_KEY_SCORE);
    
    if (!scoreData) {
        console.log('No score in localStorage');
        return null;
    }
    
    try {
        const score = JSON.parse(scoreData);
        console.log(`✓ Loaded score (Kills: ${score.kills}, Shots: ${score.shots}) from localStorage`);
        return score;
    } catch (error) {
        console.error('Failed to load score from localStorage:', error);
        return null;
    }
}

/**
 * Save complete game state (NPCs + Camera + Score)
 * @param {Array} npcs - Array of NPC objects
 * @param {Object} camera - Camera object
 * @param {Object} score - Score object with kills and shots
 */
function saveGameState(npcs, camera, score) {
    saveNPCsToStorage(npcs);
    saveCameraToStorage(camera);
    saveScoreToStorage(score);
}

/**
 * Clear all saved game data from localStorage
 */
function clearNPCStorage() {
    localStorage.removeItem(STORAGE_KEY_NPCS);
    console.log('✓ Cleared NPC data from localStorage');
}

/**
 * Clear camera data from localStorage
 */
function clearCameraStorage() {
    localStorage.removeItem(STORAGE_KEY_CAMERA);
    console.log('✓ Cleared camera data from localStorage');
}

/**
 * Clear score data from localStorage
 */
function clearScoreStorage() {
    localStorage.removeItem(STORAGE_KEY_SCORE);
    console.log('✓ Cleared score data from localStorage');
}

/**
 * Clear all game state from localStorage
 */
function clearAllStorage() {
    clearNPCStorage();
    clearCameraStorage();
    clearScoreStorage();
    console.log('✓ Cleared all game data from localStorage');
}

/**
 * Check if there are NPCs saved in localStorage
 * @returns {boolean} True if NPCs exist in storage
 */
function hasStoredNPCs() {
    return localStorage.getItem(STORAGE_KEY_NPCS) !== null;
}

/**
 * Check if there is camera data saved in localStorage
 * @returns {boolean} True if camera data exists in storage
 */
function hasStoredCamera() {
    return localStorage.getItem(STORAGE_KEY_CAMERA) !== null;
}

/**
 * Check if there is score data saved in localStorage
 * @returns {boolean} True if score data exists in storage
 */
function hasStoredScore() {
    return localStorage.getItem(STORAGE_KEY_SCORE) !== null;
}
