/**
 * Camera 2D Renderer
 * Handles rendering the camera on the 2D top-down map view
 */
class Camera2DRenderer {
    constructor(camera) {
        this.camera = camera;
    }

    /**
     * Render the camera on the 2D map
     * @param {CanvasRenderingContext2D} ctx - 2D canvas context
     */
    render(ctx) {
        // Align with 3D view direction (no negation)
        const d = this.camera.d;
        
        // Draw camera body (diamond shape)
        draw.polygon(ctx, [
            this.calcPoint(this.camera.x, this.camera.y, d - 45, 5),
            this.calcPoint(this.camera.x, this.camera.y, d - 135, 5),
            this.calcPoint(this.camera.x, this.camera.y, d - 225, 5),
            this.calcPoint(this.camera.x, this.camera.y, d - 315, 5)
        ], '#000000', 'fill');
        
        // Draw camera direction indicator
        draw.polygon(ctx, [
            this.calcPoint(this.camera.x, this.camera.y, d - 90, 5),
            this.calcPoint(this.camera.x, this.camera.y, d - 100, 10),
            this.calcPoint(this.camera.x, this.camera.y, d - 80, 10)
        ], '#000000', 'fill');
        
        // Draw view circle (aligned with 3D perspective)
        const c = this.calcPoint(this.camera.x, this.camera.y, d - 90, this.camera.view.r);
        draw.circle(ctx, c[0], c[1], this.camera.view.r, '#FF0000', 0.5);
    }

    calcPoint(x, y, d, r) {
        const a = helpers.radians(d);
        x = x + Math.cos(a) * r;
        y = y + Math.sin(a) * r;
        return [x, y];
    }
}
