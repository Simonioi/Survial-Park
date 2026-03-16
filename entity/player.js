/**
 * Player Class
 * Handles player position, rotation, input, and collision
 */
class Player {
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
        this.lastUpdateTime = performance.now();

        // Health system — player starts with 100 HP
        this.hpId = hp.createEntity('Player', 100);
        this.isDead = false;
        
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

    /**
     * Apply damage to the player
     * @param {number} amount - HP to remove
     */
    takeDamage(amount) {
        if (this.isDead) return;
        hp.damage(this.hpId, amount);
        if (hp.isDead(this.hpId)) {
            this.isDead = true;
        }
    }

    loop() {
        // Freeze all input when dead.
        if (this.isDead) return;

        const now = performance.now();
        const deltaMs = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        // 60 FPS baseline => movement stays stable even when framerate changes.
        const frameScale = Math.max(0.2, Math.min(2.5, deltaMs / (1000 / 60)));
        const moveSpeed = this.WSPEED * frameScale * 2;

        // Smooth per-frame movement based on held keys.
        const keys = this.game.keys;
        const angle = helpers.radians(this.d);
        const sinA = Math.sin(angle);
        const cosA = Math.cos(angle);

        let moveX = 0;
        let moveY = 0;

        // Z / Arrow Up = forward
        if (keys['KeyW'] || keys['ArrowUp']) {
            moveX += sinA;
            moveY += -cosA;
        }
        // S / Arrow Down = backward
        if (keys['KeyS'] || keys['ArrowDown']) {
            moveX += -sinA;
            moveY += cosA;
        }

        // Q / Arrow Left = strafe left
        if (keys['KeyA'] || keys['ArrowLeft']) {
            moveX += -cosA;
            moveY += -sinA;
        }
        // D / Arrow Right = strafe right
        if (keys['KeyD'] || keys['ArrowRight']) {
            moveX += cosA;
            moveY += sinA;
        }

        // Normalize so diagonal movement doesn't get faster than straight movement.
        const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveLength > 0) {
            this.moveWithCollision(
                (moveX / moveLength) * moveSpeed,
                (moveY / moveLength) * moveSpeed
            );
        }

        // Update rotation bounds
        if (this.d > 360) this.d -= 360;
        if (this.d < 0) this.d += 360;
        
        // Update view position for collision detection (aligned with 3D view)
        const a = helpers.radians(this.d + 90);
        this.view.x = this.x + Math.cos(a) * this.view.r;
        this.view.y = this.y + Math.sin(a) * this.view.r;
    }
}
