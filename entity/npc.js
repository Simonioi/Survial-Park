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
        this.player = game.player;
        this.dx = 0;
        this.dy = 0;
        this.dz = 0;
        this.fov = this.player ? this.player.fov : 0;
        this.scale = 0;
        this.angle = 0;
        this.color = '#FF6600'; // Orange color for 3D representation
        this.radius = 0;
        this.scaleRatio = 0;
        this.size = 100;
        this.zIndex = 0;
        
        // Health system - mob dies after 2 hits
        this.hpId = hp.createEntity(`Mob_${i}`, 2);
        this.isDead = false;

        // Attack system — mob deals 10 damage per second when adjacent to player
        this.attackDamage = 10;
        this.attackCooldownMs = 1000;
        this.lastAttackTime = 0;
        
        // Movement tracking for animation
        this.isMoving = false;
        this.lastX = this.x;
        this.lastY = this.y;
    }

    /**
     * Hit the mob (used by weapon system)
     * @returns {boolean} True if mob died from this hit
     */
    hit() {
        if (this.isDead) return false;
        
        hp.damage(this.hpId, 1);
        
        if (hp.isDead(this.hpId)) {
            this.isDead = true;
            Logger.npcs.killed(this.i);
            return true;
        }
        
        return false;
    }

    /**
     * Update NPC position - chase player with wall collision detection
     */
    update() {
        // Don't move if dead
        if (this.isDead) return;
        
        // Get player reference (with fallback if not set in constructor)
        if (!this.player && this.game && this.game.player) {
            this.player = this.game.player;
        }
        
        // Still no player? Can't move
        if (!this.player) return;

        const cam = this.player;
        
        // Calculate direction to player
        const dx = cam.x - this.x;
        const dy = cam.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Don't move if too close (avoid jittering) — attack instead
        if (distance < 20) {
            const now = performance.now();
            if ((now - this.lastAttackTime) >= this.attackCooldownMs) {
                this.lastAttackTime = now;
                if (cam.takeDamage) {
                    cam.takeDamage(this.attackDamage);
                }
            }
            return;
        }
        
        // Normalize direction and apply speed
        const speed = 0.25 // NPC movement speed
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;
        
        // Calculate new position
        const newX = this.x + moveX;
        const newY = this.y + moveY;
        
        // Check collision with walls
        const collisionRadius = 15; // NPC collision radius
        const oldX = this.x;
        const oldY = this.y;
        
        if (!this.checkWallCollision(newX, newY, collisionRadius)) {
            // No collision - update position
            this.x = newX;
            this.y = newY;
        } else {
            // Try sliding along walls - move only on one axis at a time
            if (!this.checkWallCollision(newX, this.y, collisionRadius)) {
                this.x = newX;
            } else if (!this.checkWallCollision(this.x, newY, collisionRadius)) {
                this.y = newY;
            }
            // If both fail, NPC stays in place (blocked by wall)
        }
        
        // Track if NPC actually moved for animation
        this.isMoving = (this.x !== oldX || this.y !== oldY);
    }

    /**
     * Check if a position collides with any wall
     * @param {number} x - X position to check
     * @param {number} y - Y position to check
     * @param {number} radius - Collision radius
     * @returns {boolean} True if collision detected
     */
    checkWallCollision(x, y, radius) {
        if (!this.game || !this.game.walls) return false;
        
        const walls = this.game.walls;
        if (walls.length === 0) return false;
        
        for (let wall of walls) {
            if (!wall) continue;
            
            // Check distance from point to line segment
            const dist = this.pointToSegmentDistance(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
            if (dist < radius) {
                return true; // Collision detected
            }
        }
        
        return false; // No collision
    }

    /**
     * Calculate distance from point to line segment
     * @param {number} px - Point X
     * @param {number} py - Point Y
     * @param {number} x1 - Segment start X
     * @param {number} y1 - Segment start Y
     * @param {number} x2 - Segment end X
     * @param {number} y2 - Segment end Y
     * @returns {number} Distance to segment
     */
    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            // Segment is a point
            return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }
        
        // Calculate projection of point onto line (parameter t)
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]
        
        // Calculate closest point on segment
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        
        // Return distance to closest point
        return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
    }

    loop() {
        // Don't render dead mobs
        if (this.isDead) {
            return null;
        }

        // Get player reference (with fallback if not set in constructor)
        if (!this.player && this.game && this.game.player) {
            this.player = this.game.player;
        }
        
        // No player? Can't render
        if (!this.player) return null;

        const cam = this.player;

        // Vecteur du joueur vers le NPC dans le monde
        const dx = this.x - cam.x;
        const dy = this.y - cam.y;
        const dis = Math.sqrt(dx * dx + dy * dy);

        // Trop loin -> pas affiché
        const maxRenderDistance = 600;
        if (dis > maxRenderDistance || dis < 2) {
            return null;
        }

        // Angle absolu vers le NPC et angle absolu de la caméra
        const rayAngle = Math.atan2(dx, -dy);
        const camAngle = helpers.radians(cam.d);

        // Différence d'angle (dans [-π, π])
        let angleDiff = rayAngle - camAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Si trop sur le côté, hors champ
        const fovDeg = cam.fovAngle || 75;
        const halfFovRad = helpers.radians(fovDeg * 0.5);
        if (Math.abs(angleDiff) > halfFovRad) {
            return null;
        }

        const projPlane = (this.W * 0.5) / Math.tan(halfFovRad);

        // Position X: même formule linéaire que le raycaster des murs
        const spriteScreenX = this.W * (0.5 + angleDiff / (2 * halfFovRad));

        // Distance corrigée (fish-eye) comme pour les murs
        const correctedDistance = Math.max(0.1, dis * Math.cos(angleDiff));
        const spriteHeight = (this.size * projPlane) / correctedDistance;
        if (spriteHeight <= 2) {
            return null;
        }

        const halfSprite = spriteHeight * 0.5;
        if (spriteScreenX + halfSprite < 0 || spriteScreenX - halfSprite > this.W) {
            return null;
        }

        this.zIndex = -correctedDistance;
        this.scale = halfSprite;
        this.dy = this.hH;

        return {
            x: spriteScreenX,
            y: this.dy,
            scale: this.scale,
            color: this.color,
            zIndex: this.zIndex,
            distance: correctedDistance,
            npc: this
        };
    }
}
