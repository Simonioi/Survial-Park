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
        
        console.log(`✓ Spawned NPC #${npcIndex} at (${Math.round(npc.x)}, ${Math.round(npc.y)}) - Visible in 3D and 2D maps`);
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
        
        console.log(`✓ Spawned NPC #${npcIndex} at (${Math.round(x)}, ${Math.round(y)}) - Visible in 3D and 2D maps`);
        this.updateNPCCount();
        this.syncToLocalStorage();
        return npc;
    }

    /**
     * Clear all NPCs from 3D view, 2D map, and dev mode
     */
    clearAllNPCs() {
        const count = this.game.npcs.length;
        
        console.log(`Clearing ${count} NPCs...`);
        console.log('Before clear - game.npcs length:', this.game.npcs.length);
        console.log('Before clear - 2D renderer NPCs:', this.game.map2DRenderer?.npc2D?.npcs?.length);
        
        // Clear from game (3D view)
        this.game.npcs.length = 0; // Clear array in place instead of reassigning
        
        // Clear from 2D map renderer
        if (this.game.map2DRenderer && this.game.map2DRenderer.npc2D) {
            this.game.map2DRenderer.npc2D.npcs.length = 0; // Clear array in place
        }
        
        console.log('After clear - game.npcs length:', this.game.npcs.length);
        console.log('After clear - 2D renderer NPCs:', this.game.map2DRenderer?.npc2D?.npcs?.length);
        console.log(`✓ Cleared ${count} NPCs from all views (3D map, 2D map, dev mode)`);
        
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
        if (window.SaveSystem) {
            SaveSystem.saveGame(this.game);
        } else {
            console.warn('SaveSystem not loaded, falling back to direct save');
            const npcData = this.game.npcs.map(npc => ({
                x: npc.x,
                y: npc.y
            }));
            localStorage.setItem('survivalPark_npcs', JSON.stringify(npcData));
        }
    }

    /**
     * Load game state from localStorage using SaveSystem
     */
    loadFromLocalStorage() {
        if (window.SaveSystem) {
            const W = this.game.canvas2D.width;
            const H = this.game.canvas2D.height;
            const hH = H / 2;
            SaveSystem.loadGame(this.game, W, H, hH);
            this.updateNPCCount();
        } else {
            console.warn('SaveSystem not loaded, falling back to direct load');
            const npcData = localStorage.getItem('survivalPark_npcs');
            if (!npcData) {
                console.log('No NPCs in localStorage to load');
                return;
            }
            
            try {
                const npcs = JSON.parse(npcData);
                
                // Clear existing NPCs
                this.game.npcs.length = 0;
                if (this.game.map2DRenderer && this.game.map2DRenderer.npc2D) {
                    this.game.map2DRenderer.npc2D.npcs.length = 0;
                }
                
                // Spawn NPCs from stored data
                const W = this.game.canvas2D.width;
                const H = this.game.canvas2D.height;
                const hH = H / 2;
                
                npcs.forEach((npcInfo, index) => {
                    const npc = new NPC(this.game, index, npcInfo.x, npcInfo.y, W, H, hH);
                    this.game.npcs.push(npc);
                    
                    // Register with 2D map renderer
                    if (this.game.map2DRenderer) {
                        this.game.map2DRenderer.addNPC(npc);
                    }
                });
                
                console.log(`✓ Loaded ${npcs.length} NPCs from localStorage`);
                this.updateNPCCount();
            } catch (error) {
                console.error('Failed to load NPCs from localStorage:', error);
            }
        }
    }

    /**
     * Get camera info
     */
    getCameraInfo() {
        const cam = this.game.camera;
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
            console.log('Auto-saved game state on page unload');
        }
    });
    
    // Periodic auto-save every 10 seconds
    setInterval(() => {
        if (window.devMode && window.devMode.game) {
            window.devMode.syncToLocalStorage();
        }
    }, 10000);
    
    console.log('Dev Mode initialized - Click "Spawn NPC" to add NPCs manually');
    console.log('Auto-save enabled: saves on page unload and every 10 seconds');
}

function spawnNPC() {
    if (window.devMode) {
        window.devMode.spawnNPC();
    }
}

function clearNPCs() {
    if (window.devMode) {
        window.devMode.clearAllNPCs();
    }
}
