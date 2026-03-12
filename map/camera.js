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
        this.fovAngle = 60; // Tighter FOV to eliminate remaining distortion
        this.view = { x: null, y: null, r: 70 };
        this.collisionRadius = 10;
        this.mouseSensitivity = 0.15;
        
        this.setupKeyBindings();
        this.setupMouseLook();
    }

    setupKeyBindings() {
        document.addEventListener('keydown', (e) => {
            this.game.keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.game.keys[e.code] = false;
        });
    }

    setupMouseLook() {
        const canvas = this.game.canvasNPC || this.game.canvas2D;

        // Click to lock pointer for mouse look.
        document.addEventListener('click', () => {
            if (canvas && canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === canvas) {
                this.d += e.movementX * this.mouseSensitivity;
            }
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

        // Z / Arrow Up = forward
        if (keys['KeyW'] || keys['ArrowUp']) {
            this.moveWithCollision(
                Math.sin(helpers.radians(this.d)) * this.WSPEED,
                -Math.cos(helpers.radians(this.d)) * this.WSPEED
            );
        }
        // S / Arrow Down = backward
        if (keys['KeyS'] || keys['ArrowDown']) {
            this.moveWithCollision(
                -Math.sin(helpers.radians(this.d)) * this.WSPEED,
                Math.cos(helpers.radians(this.d)) * this.WSPEED
            );
        }

        // Q / Arrow Left = strafe left
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.moveWithCollision(
                -Math.cos(helpers.radians(this.d)) * this.WSPEED,
                -Math.sin(helpers.radians(this.d)) * this.WSPEED
            );
        }
        // D / Arrow Right = strafe right
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.moveWithCollision(
                Math.cos(helpers.radians(this.d)) * this.WSPEED,
                Math.sin(helpers.radians(this.d)) * this.WSPEED
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
