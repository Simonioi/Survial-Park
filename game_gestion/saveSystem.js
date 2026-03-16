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
        STATS: 'survivalPark_stats',
        WAVE: 'survivalPark_wave',
        MAZE: 'survivalPark_maze',
        MAP_MODE: 'survivalPark_map_mode'
    },

    /**
     * Save complete game state
     * @param {Object} game - The game state object
     */
    saveGame(game) {
        this.saveNPCs(game.npcs);
        this.savePlayerPosition(game.player);
        this.saveStats(game.score);
        this.saveWave();
        this.saveMaze(game);
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
        this.loadWave();
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
        localStorage.removeItem(this.KEYS.WAVE);        localStorage.removeItem(this.KEYS.MAZE);        Logger.info('✓ Cleared all saved game data');
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
    },

    /**
     * Save wave state
     */
    saveWave() {
        if (typeof WaveManager !== 'undefined') {
            localStorage.setItem(this.KEYS.WAVE, JSON.stringify({ wave: WaveManager.getWave() }));
        }
    },

    /**
     * Load wave state
     */
    loadWave() {
        var data = localStorage.getItem(this.KEYS.WAVE);
        if (!data || typeof WaveManager === 'undefined') return;
        try {
            var parsed = JSON.parse(data);
            if (parsed.wave) WaveManager.setWave(parsed.wave);
        } catch (e) { /* ignore */ }
    },

    /**
     * Save maze grid + params so the same map is restored across page loads
     */
    saveMaze(game) {
        if (!game.mazeGrid) return;
        var rows = game.mazeGrid.length;
        // Pack grid to a compact string of '0'/'1'
        var flat = '';
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < game.mazeGrid[y].length; x++) {
                flat += game.mazeGrid[y][x];
            }
        }
        var data = {
            cols: game.mazeGrid[0].length,
            rows: rows,
            flat: flat,
            cellSize: game.mazeCellSize,
            offsetX: game.mazeOffsetX,
            offsetY: game.mazeOffsetY,
            mapMode: game.mapMode || 'maze'
        };
        localStorage.setItem(this.KEYS.MAZE, JSON.stringify(data));
    },

    /**
     * Load saved maze data (returns null when nothing saved)
     */
    loadMaze() {
        var raw = localStorage.getItem(this.KEYS.MAZE);
        if (!raw) return null;
        try {
            var data = JSON.parse(raw);
            var requestedMode = localStorage.getItem(this.KEYS.MAP_MODE) || 'maze';
            var savedMode = data.mapMode || 'maze';
            if (savedMode !== requestedMode) {
                return null;
            }
            var grid = [];
            var idx = 0;
            for (var y = 0; y < data.rows; y++) {
                var row = [];
                for (var x = 0; x < data.cols; x++) {
                    row.push(Number(data.flat[idx++]));
                }
                grid.push(row);
            }
            return { grid: grid, cols: data.cols, rows: data.rows, cellSize: data.cellSize, offsetX: data.offsetX, offsetY: data.offsetY, mapMode: savedMode };
        } catch (e) {
            return null;
        }
    }
};

// Make SaveSystem globally available
window.SaveSystem = SaveSystem;
