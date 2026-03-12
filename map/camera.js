/**
 * Camera Class
 * Handles camera position, rotation, and rendering on 2D map
 */
class Camera {
    constructor(game, W, H, hW, hH, TSPEED, WSPEED) {
        this.game = game;
        this.W = W;
        this.H = H;
        this.hW = hW;
        this.hH = hH;
        this.TSPEED = TSPEED;
        this.WSPEED = WSPEED;
        
        this.d = 0;
        this.x = hW;
        this.y = hH;
        this.fov = 850;
        this.fovAngle = 75; // Reduced from 120 to fix barrel distortion
        this.view = { x: null, y: null, r: 70 };
        this.collisionRadius = 10;
        
        this.setupKeyBindings();
    }

    setupKeyBindings() {
        document.addEventListener('keydown', (e) => {
            this.game.keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.game.keys[e.code] = false;
        });
    }

    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) {
            return helpers.distance(px, py, x1, y1);
        }

        const t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        const clampedT = Math.max(0, Math.min(1, t));
        const projX = x1 + clampedT * dx;
        const projY = y1 + clampedT * dy;
        return helpers.distance(px, py, projX, projY);
    }

    collidesWithWall(x, y) {
        if (!this.game || !this.game.walls) {
            return false;
        }

        for (let i = 0; i < this.game.walls.length; i++) {
            const wall = this.game.walls[i];
            if (!wall) continue;

            const distanceToWall = this.pointToSegmentDistance(
                x,
                y,
                wall.x1,
                wall.y1,
                wall.x2,
                wall.y2
            );

            if (distanceToWall < this.collisionRadius) {
                return true;
            }
        }

        return false;
    }

    moveWithCollision(dx, dy) {
        const nextX = this.x + dx;
        const nextY = this.y + dy;

        if (!this.collidesWithWall(nextX, nextY)) {
            this.x = nextX;
            this.y = nextY;
            return;
        }

        // Axis-separated fallback allows a basic wall-slide feel.
        if (!this.collidesWithWall(nextX, this.y)) {
            this.x = nextX;
        }

        if (!this.collidesWithWall(this.x, nextY)) {
            this.y = nextY;
        }
    }

    loop() {
        // Smooth per-frame movement based on held keys.
        const keys = this.game.keys;

        if (keys['ArrowLeft']) this.d += this.TSPEED;
        if (keys['ArrowRight']) this.d -= this.TSPEED;

        if (keys['ArrowUp']) {
            this.moveWithCollision(
                Math.sin(helpers.radians(this.d)) * this.WSPEED,
                -Math.cos(helpers.radians(this.d)) * this.WSPEED
            );
        }
        if (keys['ArrowDown']) {
            this.moveWithCollision(
                -Math.sin(helpers.radians(this.d)) * this.WSPEED,
                Math.cos(helpers.radians(this.d)) * this.WSPEED
            );
        }

        // Update camera rotation bounds
        if (this.d > 360) this.d -= 360;
        if (this.d < 0) this.d += 360;
        
        // Update view position for collision detection (aligned with 3D view)
        const a = helpers.radians(this.d + 90);
        this.view.x = this.x + Math.cos(a) * this.view.r;
        this.view.y = this.y + Math.sin(a) * this.view.r;
    }
}
