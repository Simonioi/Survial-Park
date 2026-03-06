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
        // Draw FOV cone (120° visibility area)
        this.renderFOVCone(ctx);
        
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
    }

    /**
     * Render the FOV cone showing visible area
     * @param {CanvasRenderingContext2D} ctx - 2D canvas context
     */
    renderFOVCone(ctx) {
        const halfFOV = this.camera.fovAngle / 2;
        const viewDistance = this.camera.view.r;
        const cameraDir = this.camera.d - 90; // Adjust for coordinate system
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 102, 204, 0.1)'; // Light blue transparent
        ctx.strokeStyle = 'rgba(0, 102, 204, 0.3)';
        ctx.lineWidth = 2;
        
        // Draw FOV cone
        ctx.beginPath();
        ctx.moveTo(this.camera.x, this.camera.y);
        
        // Left edge of cone
        const leftAngle = helpers.radians(cameraDir - halfFOV);
        const leftX = this.camera.x + Math.cos(leftAngle) * viewDistance;
        const leftY = this.camera.y + Math.sin(leftAngle) * viewDistance;
        ctx.lineTo(leftX, leftY);
        
        // Arc along the cone's edge
        ctx.arc(
            this.camera.x, 
            this.camera.y, 
            viewDistance, 
            leftAngle, 
            helpers.radians(cameraDir + halfFOV)
        );
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    calcPoint(x, y, d, r) {
        const a = helpers.radians(d);
        x = x + Math.cos(a) * r;
        y = y + Math.sin(a) * r;
        return [x, y];
    }
}
