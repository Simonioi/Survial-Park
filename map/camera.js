/**
 * Camera Class
 * Handles camera position, rotation, and rendering on 2D map
 */
class Camera {
    constructor(game, W, H, hW, hH, TSPEED, WSPEED) {
        this.game = game; // reference to main game object for access to canvas and context
        this.W = W; // canvas width and height
        this.H = H; // canvas width and height
        this.hW = hW; // half-width and half-height of the canvas for centering
        this.hH = hH; // half-width and half-height of the canvas for centering
        this.TSPEED = TSPEED; // turning speed
        this.WSPEED = WSPEED; // walking speed
        
        this.d = 0;
        this.x = hW;
        this.y = hH;
        this.fov = 850;
        this.fovAngle = 120; // Field of view angle in degrees
        this.view = { x: null, y: null, r: 70 }; // 7 squares * 10 units per square
        
        this.setupKeyBindings(); // setup keyboard controls for camera movement and rotation
    }

    setupKeyBindings() {
        document.addEventListener('keydown', (e) => {
            this.game.keys[e.code] = true;
            
            // Camera controls: rotation and forward/backward movement
            if (e.code === 'ArrowLeft') this.d += this.TSPEED;
            if (e.code === 'ArrowRight') this.d -= this.TSPEED;
            if (e.code === 'ArrowUp') {
                // Move forward in camera's facing direction
                this.x += Math.sin(helpers.radians(this.d)) * this.WSPEED;
                this.y -= Math.cos(helpers.radians(this.d)) * this.WSPEED;
            }
            if (e.code === 'ArrowDown') {
                // Move backward from camera's facing direction
                this.x -= Math.sin(helpers.radians(this.d)) * this.WSPEED;
                this.y += Math.cos(helpers.radians(this.d)) * this.WSPEED;
            }
        });

        document.addEventListener('keyup', (e) => {
            this.game.keys[e.code] = false;
        });
    }

    loop() {
        // Update camera rotation bounds
        if (this.d > 360) this.d = 0;
        if (this.d < 0) this.d = 360;
        
        // Update view position for collision detection (aligned with 3D view)
        const a = helpers.radians(this.d + 90);
        this.view.x = this.x + Math.cos(a) * this.view.r;
        this.view.y = this.y + Math.sin(a) * this.view.r;
    }
}
