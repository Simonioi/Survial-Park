/**
 * Dev Mode Manager
 * Provides development tools for testing and debugging
 */
class DevMode {
    constructor(game) {
        this.game = game;
        this.enabled = false;
    }

    /**
     * Spawn a new NPC at a random position
     */
    spawnNPC() {
        const W = this.game.canvas2D.width;
        const H = this.game.canvas2D.height;
        const hH = H / 2;
        const npcIndex = this.game.npcs.length;
        
        const npc = new NPC(this.game, npcIndex, undefined, undefined, W, H, hH);
        this.game.npcs.push(npc);
        
        // Register with 2D map renderer
        if (this.game.map2DRenderer) {
            this.game.map2DRenderer.addNPC(npc);
        }
        
        Logger.npcs.spawned(npcIndex, npc.x, npc.y);
        this.updateNPCCount();
        this.syncToLocalStorage();
        return npc;
    }

    /**
     * Spawn NPC at specific coordinates
     * @param {Number} x - X coordinate
     * @param {Number} y - Y coordinate
     */
    spawnNPCAt(x, y) {
        const W = this.game.canvas2D.width;
        const H = this.game.canvas2D.height;
        const hH = H / 2;
        const npcIndex = this.game.npcs.length;
        
        const npc = new NPC(this.game, npcIndex, x, y, W, H, hH);
        this.game.npcs.push(npc);
        
        // Register with 2D map renderer
        if (this.game.map2DRenderer) {
            this.game.map2DRenderer.addNPC(npc);
        }
        
        Logger.npcs.spawned(npcIndex, x, y);
        this.updateNPCCount();
        this.syncToLocalStorage();
        return npc;
    }

    /**
     * Spawn un Sword Rex à une position aléatoire
     */
    spawnSwordRex() {
        const W = this.game.canvas2D.width;
        const H = this.game.canvas2D.height;
        const hH = H / 2;
        const npcIndex = this.game.npcs.length;
        const rex = new SwordRex(this.game, npcIndex, undefined, undefined, W, H, hH);

        this.game.npcs.push(rex);

        if (this.game.map2DRenderer) {
            this.game.map2DRenderer.addNPC(rex);
        }

        Logger.npcs.spawned(npcIndex, rex.x, rex.y);
        this.updateNPCCount();
        this.syncToLocalStorage();
        return rex;
    }

    /**
     * Clear all NPCs from 3D view, 2D map, and dev mode
     */
    clearAllNPCs() {
        const count = this.game.npcs.length;
        
        Logger.devMode.clearing(count);
        Logger.devMode.beforeClear(this.game.npcs.length, this.game.map2DRenderer?.npc2D?.npcs?.length);
        
        // Clear from game (3D view)
        this.game.npcs.length = 0;
        
        // Clear from 2D map renderer
        if (this.game.map2DRenderer && this.game.map2DRenderer.npc2D) {
            this.game.map2DRenderer.npc2D.npcs.length = 0;
        }
        
        Logger.devMode.afterClear(this.game.npcs.length, this.game.map2DRenderer?.npc2D?.npcs?.length);
        Logger.npcs.cleared(count);
        
        this.syncToLocalStorage();
        this.updateNPCCount();
    }

    /**
     * Update NPC count display
     */
    updateNPCCount() {
        const countElement = document.getElementById('npcCount');
        if (countElement) {
            countElement.textContent = this.game.npcs.length;
        }
    }

    /**
     * Sync game state to localStorage using SaveSystem
     */
    syncToLocalStorage() {
        if (!window.SaveSystem) {
            Logger.error('SaveSystem is required in Dev Mode but not loaded');
            return;
        }

        SaveSystem.saveGame(this.game);
    }

    /**
     * Load game state from localStorage using SaveSystem
     */
    loadFromLocalStorage() {
        if (!window.SaveSystem) {
            Logger.error('SaveSystem is required in Dev Mode but not loaded');
            return;
        }

        const W = this.game.canvas2D.width;
        const H = this.game.canvas2D.height;
        const hH = H / 2;
        SaveSystem.loadGame(this.game, W, H, hH);
        this.updateNPCCount();
    }

    /**
     * Get player info
     */
    getPlayerInfo() {
        const cam = this.game.player;
        return {
            x: Math.round(cam.x),
            y: Math.round(cam.y),
            rotation: Math.round(cam.d)
        };
    }
}

// Expose dev mode functions globally
window.devMode = null;

function initDevMode(game) {
    window.devMode = new DevMode(game);
    window.devMode.loadFromLocalStorage(); // Load existing NPCs
    window.devMode.updateNPCCount();
    
    // Auto-save when leaving the page
    window.addEventListener('beforeunload', () => {
        if (window.devMode && window.devMode.game) {
            window.devMode.syncToLocalStorage();
            Logger.autoSave.onUnload();
        }
    });
    
    // Periodic auto-save every 10 seconds
    setInterval(() => {
        if (window.devMode && window.devMode.game) {
            window.devMode.syncToLocalStorage();
        }
    }, 10000);
    
    Logger.initialized('Dev Mode - Click "Spawn NPC" to add NPCs manually');
    Logger.autoSave.enabled();
}

function spawnNPC() {
    if (window.devMode) {
        window.devMode.spawnNPC();
    }
}

function spawnSwordRex() {
    if (window.devMode) {
        window.devMode.spawnSwordRex();
    }
}

function clearNPCs() {
    if (window.devMode) {
        window.devMode.clearAllNPCs();
    }
}
