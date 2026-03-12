/**
 * Save System Module
 * Handles all game state persistence via localStorage
 * Shared between dev mode and main game
 */

const SaveSystem = {
    // Storage keys
    KEYS: {
        NPCS: 'survivalPark_npcs',
        PLAYER: 'survivalPark_player',
        STATS: 'survivalPark_stats'
    },

    /**
     * Save complete game state
     * @param {Object} game - The game state object
     */
    saveGame(game) {
        this.saveNPCs(game.npcs);
        this.savePlayerPosition(game.player);
        this.saveStats(game.score);
        Logger.saved('game state', 'to localStorage');
    },

    /**
     * Load complete game state
     * @param {Object} game - The game state object to populate
     * @param {Number} W - Canvas width
     * @param {Number} H - Canvas height
     * @param {Number} hH - Half canvas height
     */
    loadGame(game, W, H, hH) {
        this.loadPlayerPosition(game.player);
        this.loadStats(game.score);
        this.loadNPCs(game, W, H, hH);
        Logger.loaded('game state', 'from localStorage');
    },

    /**
     * Save NPCs to localStorage
     * @param {Array} npcs - Array of NPC objects
     */
    saveNPCs(npcs) {
        const npcData = npcs.map(npc => ({
            x: npc.x,
            y: npc.y,
            isDead: npc.isDead || false
        }));
        localStorage.setItem(this.KEYS.NPCS, JSON.stringify(npcData));
        Logger.npcs.saved(npcData.length, npcData.filter(n => n.isDead).length);
    },

    /**
     * Load NPCs from localStorage
     * @param {Object} game - The game state object
     * @param {Number} W - Canvas width
     * @param {Number} H - Canvas height
     * @param {Number} hH - Half canvas height
     * @returns {Number} - Number of NPCs loaded
     */
    loadNPCs(game, W, H, hH) {
        const npcData = localStorage.getItem(this.KEYS.NPCS);
        if (!npcData) {
            Logger.storage.missing('NPCs');
            return 0;
        }

        try {
            const npcs = JSON.parse(npcData);
            
            // Clear existing NPCs
            game.npcs.length = 0;
            if (game.map2DRenderer && game.map2DRenderer.npc2D) {
                game.map2DRenderer.npc2D.npcs.length = 0;
            }

            // Spawn NPCs from stored data
            npcs.forEach((npcInfo, index) => {
                const npc = new NPC(game, index, npcInfo.x, npcInfo.y, W, H, hH);
                
                // Restore dead state if NPC was dead
                if (npcInfo.isDead) {
                    npc.isDead = true;
                    npc.hp = 0;
                }
                
                game.npcs.push(npc);
                
                // Register with 2D map renderer
                if (game.map2DRenderer) {
                    game.map2DRenderer.addNPC(npc);
                }
            });

            Logger.npcs.loaded(npcs.length);
            return npcs.length;
        } catch (error) {
            Logger.storage.failed('load', 'NPCs', error);
            return 0;
        }
    },

    /**
     * Save player position
     * @param {Object} camera - Camera object with x, y, d properties
     */
    savePlayerPosition(camera) {
        const playerData = {
            x: camera.x,
            y: camera.y,
            rotation: camera.d
        };
        localStorage.setItem(this.KEYS.PLAYER, JSON.stringify(playerData));
        Logger.playerPosition.saved(camera.x, camera.y, camera.d);
    },

    /**
     * Load player position
     * @param {Object} camera - Camera object to update
     * @returns {Boolean} - True if loaded successfully
     */
    loadPlayerPosition(camera) {
        const playerData = localStorage.getItem(this.KEYS.PLAYER);
        if (!playerData) {
            Logger.storage.missing('player position');
            return false;
        }

        try {
            const data = JSON.parse(playerData);
            camera.x = data.x;
            camera.y = data.y;
            camera.d = data.rotation;
            Logger.playerPosition.loaded(data.x, data.y, data.rotation);
            return true;
        } catch (error) {
            Logger.storage.failed('load', 'player position', error);
            return false;
        }
    },

    /**
     * Save game statistics
     * @param {Object} score - Score object with kills and shots
     */
    saveStats(score) {
        const statsData = {
            kills: score.kills || 0,
            shots: score.shots || 0
        };
        localStorage.setItem(this.KEYS.STATS, JSON.stringify(statsData));
        Logger.stats.saved(statsData.kills, statsData.shots);
    },

    /**
     * Load game statistics
     * @param {Object} score - Score object to update
     * @returns {Boolean} - True if loaded successfully
     */
    loadStats(score) {
        const statsData = localStorage.getItem(this.KEYS.STATS);
        if (!statsData) {
            Logger.storage.missing('stats');
            return false;
        }

        try {
            const data = JSON.parse(statsData);
            score.kills = data.kills || 0;
            score.shots = data.shots || 0;
            Logger.stats.loaded(data.kills, data.shots);
            return true;
        } catch (error) {
            Logger.storage.failed('load', 'stats', error);
            return false;
        }
    },

    /**
     * Clear all saved game data
     */
    clearAll() {
        localStorage.removeItem(this.KEYS.NPCS);
        localStorage.removeItem(this.KEYS.PLAYER);
        localStorage.removeItem(this.KEYS.STATS);
        Logger.info('✓ Cleared all saved game data');
    },

    /**
     * Get summary of saved data
     * @returns {Object} - Summary of what's saved
     */
    getSummary() {
        const npcs = localStorage.getItem(this.KEYS.NPCS);
        const player = localStorage.getItem(this.KEYS.PLAYER);
        const stats = localStorage.getItem(this.KEYS.STATS);

        return {
            hasNPCs: !!npcs,
            npcCount: npcs ? JSON.parse(npcs).length : 0,
            hasPlayer: !!player,
            hasStats: !!stats,
            stats: stats ? JSON.parse(stats) : null
        };
    }
};

// Make SaveSystem globally available
window.SaveSystem = SaveSystem;
