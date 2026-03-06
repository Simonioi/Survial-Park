/**
 * NPC Class - Non Player Character
 * Handles NPC position and 3D projection rendering
 */
class NPC {
    constructor(game, i, x, y, W, H, hH) {
        this.game = game;
        this.i = i;
        this.W = W;
        this.H = H;
        this.hH = hH;
        
        this.x = x !== undefined ? x : helpers.random(W);
        this.y = y !== undefined ? y : helpers.random(H);
        this.camera = game.camera;
        this.dx = 0;
        this.dy = 0;
        this.dz = 0;
        this.fov = this.camera.fov;
        this.scale = 0;
        this.angle = 0;
        this.color = '#FF6600'; // Orange color for 3D representation
        this.radius = 0;
        this.scaleRatio = 0;
        this.size = 100;
        this.zIndex = 0;
    }

    loop() {
        // Check if NPC is outside camera view
        if (!helpers.checkCircleCollision(
            this.camera.view.x, 
            this.camera.view.y, 
            this.camera.view.r, 
            this.x, 
            this.y, 
            5
        )) {
            this.cr = helpers.radians(-this.camera.d); // Negate for correct 3D rotation direction
            this.dx = this.x - this.camera.x;
            this.dz = this.y - this.camera.y;
            this.dy = this.hH;
            this.angle = Math.atan2(this.dz, this.dx);
            this.radius = Math.sqrt(this.dx * this.dx + this.dz * this.dz) * 4;
            this.dx = Math.cos(this.angle + this.cr) * this.radius;
            
            const dis = helpers.distance(this.x, this.y, this.camera.x, this.camera.y);
            this.zIndex = -dis;
            
            this.scaleRatio = this.fov / (this.fov + (dis * 5));
            this.dx = this.dx * this.scaleRatio;
            this.scale = this.scaleRatio * this.size;
            
            // Store for z-sorting
            return {
                x: this.dx + this.camera.hW,
                y: this.dy,
                scale: this.scale,
                color: this.color,
                zIndex: this.zIndex
            };
        }
        return null;
    }
}
