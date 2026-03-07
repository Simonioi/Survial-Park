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

        const cam = this.camera;

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

        // Différence d’angle (dans [-π, π])
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
