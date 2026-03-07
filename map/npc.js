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
        
        // Health system - mob dies after 2 hits
        this.hpId = hp.createEntity(`Mob_${i}`, 2);
        this.isDead = false;
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

    loop() {
        // Don't render dead mobs
        if (this.isDead) {
            return null;
        }
        
        // Calculate distance to camera
        const dis = helpers.distance(this.x, this.y, this.camera.x, this.camera.y);
        
        // Check if NPC is within render distance (7 squares = 70 units)
        if (dis > this.camera.view.r) {
            return null; // Too far away
        }
        
        // Calculate angle from camera to NPC
        this.dx = this.x - this.camera.x;
        this.dz = this.y - this.camera.y;
        const npcAngle = Math.atan2(this.dz, this.dx);
        
        // Calculate camera direction angle (adjusted for coordinate system)
        // Camera d=0 is north, but atan2 uses east as 0, so subtract 90
        const cameraAngle = helpers.radians(this.camera.d - 90);
        
        // Calculate relative angle (NPC angle relative to camera direction)
        let relativeAngle = npcAngle - cameraAngle;
        
        // Normalize angle to -π to π range
        while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
        while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
        
        // Convert to degrees and check if within FOV (120° = ±60°)
        const relativeAngleDeg = helpers.degrees(relativeAngle);
        const halfFOV = this.camera.fovAngle / 2;
        
        if (Math.abs(relativeAngleDeg) > halfFOV) {
            return null; // Outside FOV cone
        }
        
        // NPC is visible - calculate rendering position
        this.cr = helpers.radians(this.camera.d);
        this.dy = this.hH;
        this.angle = npcAngle;
        this.radius = Math.sqrt(this.dx * this.dx + this.dz * this.dz) * 4;
        this.dx = Math.cos(this.angle + this.cr) * this.radius;
        
        this.zIndex = -dis;
        
        this.scaleRatio = this.fov / (this.fov + (dis * 5));
        this.dx = this.dx * this.scaleRatio;
        this.scale = this.scaleRatio * this.size;
        
        // Store for z-sorting and weapon targeting
        return {
            x: this.dx + this.camera.hW,
            y: this.dy,
            scale: this.scale,
            color: this.color,
            zIndex: this.zIndex,
            distance: dis,
            npc: this
        };
    }
}
