/**
 * Map 2D Renderer
 * Coordinates all 2D top-down map rendering
 */
class Map2DRenderer {
    constructor(game) {
        this.game = game;
        this.camera2D = null;
        this.npc2D = new NPC2DRenderer();
    }

    /**
     * Initialize the 2D renderer after camera is created
     */
    init() {
        if (this.game.camera) {
            this.camera2D = new Camera2DRenderer(this.game.camera);
        }
    }

    /**
     * Add an NPC to the 2D map
     * @param {NPC} npc - NPC object to add
     */
    addNPC(npc) {
        this.npc2D.addNPC(npc);
    }

    /**
     * Render the entire 2D map
     */
    render() {
        const ctx = this.game.ctx2D;
        const W = this.game.canvas2D.width;
        const H = this.game.canvas2D.height;
        
        // Clear canvas
        draw.clear(ctx, W, H);
        
        // Render NPCs
        this.npc2D.render(ctx);
        
        // Render camera (on top)
        if (this.camera2D) {
            this.camera2D.render(ctx);
        }
    }
}
