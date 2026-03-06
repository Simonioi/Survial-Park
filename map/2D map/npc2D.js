/**
 * NPC 2D Renderer
 * Handles rendering NPC positions on the 2D top-down map view
 */
class NPC2DRenderer {
    constructor() {
        this.npcMarkers = new Map(); // Store NPC markers by NPC object
    }

    /**
     * Register an NPC for 2D rendering
     * @param {NPC} npc - NPC object to track
     */
    addNPC(npc) {
        this.npcMarkers.set(npc, {
            x: npc.x,
            y: npc.y,
            color: npc.color
        });
    }

    /**
     * Render all NPCs on the 2D map
     * @param {CanvasRenderingContext2D} ctx - 2D canvas context
     */
    render(ctx) {
        for (let [npc, marker] of this.npcMarkers) {
            draw.circle(ctx, marker.x, marker.y, 5, marker.color);
        }
    }

    /**
     * Clear all NPC markers
     */
    clear() {
        this.npcMarkers.clear();
    }
}
