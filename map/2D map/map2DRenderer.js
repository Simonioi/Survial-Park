/**
 * Map 2D Renderer
 * Coordinates all 2D top-down map rendering
 */
class Map2DRenderer {
    constructor(game) {
        this.game = game;
        this.camera2D = null;
        this.npc2D = new NPC2DRenderer();
        this.zoom = 1; // zoom factor (<1 = zoomed out)
    }

    /**
     * Initialize the 2D renderer after player is created
     */
    init() {
        if (this.game.player) {
            this.camera2D = new Player2DRenderer(this.game.player);
        }
        this.computeZoom();
    }

    /**
     * Compute zoom so the entire maze fits in the 2D canvas
     */
    computeZoom() {
        const g = this.game;
        if (g.mazeGrid && g.mazeCellSize) {
            const mazePixelW = g.mazeGrid[0].length * g.mazeCellSize;
            const mazePixelH = g.mazeGrid.length * g.mazeCellSize;
            const canvasW = g.canvas2D.width;
            const canvasH = g.canvas2D.height;
            // Fit the maze plus a small margin
            this.zoom = Math.min(canvasW / mazePixelW, canvasH / mazePixelH) * 0.92;
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

        // Apply zoom transform centred on the maze
        ctx.save();
        const ox = this.game.mazeOffsetX || 0;
        const oy = this.game.mazeOffsetY || 0;
        const cols = this.game.mazeGrid ? this.game.mazeGrid[0].length : 0;
        const rows = this.game.mazeGrid ? this.game.mazeGrid.length : 0;
        const cs  = this.game.mazeCellSize || 1;
        // Centre of the maze in world space
        const mazeCX = ox + (cols * cs) / 2;
        const mazeCY = oy + (rows * cs) / 2;
        // Translate so maze centre maps to canvas centre, then scale
        ctx.translate(W / 2, H / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-mazeCX, -mazeCY);

        // Render grid
        this.renderGrid(ctx, W, H);

        // Render walls
        this.renderWalls(ctx);

        // Render NPCs
        this.npc2D.render(ctx);
        
        // Render player (on top)
        if (this.camera2D) {
            this.camera2D.render(ctx);
        }

        ctx.restore();
    }

    /**
     * Render all wall segments on the 2D map
     * @param {CanvasRenderingContext2D} ctx - 2D canvas context
     */
    renderWalls(ctx) {
        const walls = this.game.walls;
        if (!walls || walls.length === 0) return;

        for (let i = 0; i < walls.length; i++) {
            walls[i].draw2D(ctx);
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
        const gridSize = 10;
        const g = this.game;
        const ox = g.mazeOffsetX || 0;
        const oy = g.mazeOffsetY || 0;
        const cols = g.mazeGrid ? g.mazeGrid[0].length : 0;
        const rows = g.mazeGrid ? g.mazeGrid.length : 0;
        const cs  = g.mazeCellSize || 1;
        const maxX = ox + cols * cs;
        const maxY = oy + rows * cs;
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        for (let x = ox; x <= maxX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, oy);
            ctx.lineTo(x, maxY);
            ctx.stroke();
        }
        
        for (let y = oy; y <= maxY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(ox, y);
            ctx.lineTo(maxX, y);
            ctx.stroke();
        }
    }
}
