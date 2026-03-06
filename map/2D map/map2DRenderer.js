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
        
        // Render grid
        this.renderGrid(ctx, W, H);
        
        // Render NPCs
        this.npc2D.render(ctx);
        
        // Render camera (on top)
        if (this.camera2D) {
            this.camera2D.render(ctx);
        }
    }

    /**
     * Render a static grid on the 2D map
     * Grid is fixed in world space, camera moves across it
     * @param {CanvasRenderingContext2D} ctx - 2D canvas context
     * @param {number} W - Canvas width
     * @param {number} H - Canvas height
     */
    renderGrid(ctx, W, H) {
        const gridSize = 10; // Grid cell size in world units (matches camera icon scale)
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        // Draw vertical lines at fixed world positions
        for (let x = 0; x <= W; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        
        // Draw horizontal lines at fixed world positions
        for (let y = 0; y <= H; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
    }
}
