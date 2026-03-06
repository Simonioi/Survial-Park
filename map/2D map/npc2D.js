/**
 * NPC 2D Renderer
 * Handles rendering NPC positions on the 2D top-down map view
 * Synchronizes with game.npcs array for consistent display
 */
class NPC2DRenderer {
    constructor() {
        this.npcs = []; // Store references to NPC objects
    }

    /**
     * Register an NPC for 2D rendering
     * @param {NPC} npc - NPC object to track
     */
    addNPC(npc) {
        if (!this.npcs.includes(npc)) {
            this.npcs.push(npc);
        }
    }

    /**
     * Render all NPCs on the 2D map as colored dots
     * Reads current position from NPC objects each frame (live data)
     * @param {CanvasRenderingContext2D} ctx - 2D canvas context
     */
    render(ctx) {
        // Only render if there are NPCs
        if (this.npcs.length === 0) {
            return; // No NPCs to render
        }
        
        // Filter out any null/undefined NPCs and dead NPCs (defensive programming)
        const validNPCs = this.npcs.filter(npc => 
            npc && 
            typeof npc.x === 'number' && 
            typeof npc.y === 'number' && 
            !npc.isDead // Skip dead NPCs to match 3D view
        );
        
        for (let npc of validNPCs) {
            // Read current position from NPC (live data)
            draw.circle(ctx, npc.x, npc.y, 5, npc.color);
        }
    }

    /**
     * Clear all NPC references
     * Removes NPCs from 2D map display
     */
    clear() {
        this.npcs = [];
    }

    /**
     * Remove dead NPCs from the render list
     * Synchronizes with the main game.npcs array
     */
    removeDeadNPCs() {
        this.npcs = this.npcs.filter(npc => npc && !npc.isDead);
    }
}
