/**
 * Wall
 * Creates 3D wall segments from 2D line coordinates
 * 
 * @param {Object} game - Game object
 * @param {Array} coords - Wall segment coordinates [x1, y1, x2, y2]
 * @param {Number} height - Wall height (default 100)
 * @param {String} color - Wall color (default '#8B7355')
 * @param {Image} texture - Optional texture image to use instead of color
 */   
function Wall(game, coords, height = 100, color = '#8B7355', texture = null) {
    this.game = game;
    this.x1 = coords[0];
    this.y1 = coords[1];
    this.x2 = coords[2];
    this.y2 = coords[3];
    this.height = height;
    this.color = color;
    this.texture = texture;
    this.once = false;
}

/**
 * Wall.prototype.draw2D
 * Draws the wall as a line on the 2D map
 */
Wall.prototype.draw2D = function(ctx) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
}

/**
 * Wall.prototype.loop
 * Renders the wall in 3D perspective
 * Converts 2D wall coordinates to 3D projected polygon
 * @returns {Object} Render data with z-index and render function
 */
Wall.prototype.loop = function() {
    const camera = this.game.camera;
    const hH = this.game.canvas2D.height / 2;
    
    // Project the 4 corners of the wall to 2D screen space
    const points = [];
    
    // Bottom-left corner
    points[0] = project3DTo2D(
        { x: this.x1, y: hH, z: this.y1 },
        camera,
        this.game.canvasNPC.width,
        this.game.canvasNPC.height
    );
    
    // Top-left corner
    points[1] = project3DTo2D(
        { x: this.x1, y: hH - this.height, z: this.y1 },
        camera,
        this.game.canvasNPC.width,
        this.game.canvasNPC.height
    );
    
    // Top-right corner
    points[2] = project3DTo2D(
        { x: this.x2, y: hH - this.height, z: this.y2 },
        camera,
        this.game.canvasNPC.width,
        this.game.canvasNPC.height
    );
    
    // Bottom-right corner
    points[3] = project3DTo2D(
        { x: this.x2, y: hH, z: this.y2 },
        camera,
        this.game.canvasNPC.width,
        this.game.canvasNPC.height
    );
    
    // Calculate average z-index for depth sorting
    const avgDist = (points[0].distance + points[3].distance) / 2;
    
    // Return render data
    return {
        zIndex: -avgDist,
        render: (ctx) => {
            if (points[0] && points[1] && points[2] && points[3]) {
                ctx.save();
                
                // Create clipping path for the wall polygon
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                ctx.lineTo(points[1].x, points[1].y);
                ctx.lineTo(points[2].x, points[2].y);
                ctx.lineTo(points[3].x, points[3].y);
                ctx.closePath();
                ctx.clip();
                
                // If texture is available and loaded, draw it
                if (this.texture && this.texture.complete && this.texture.naturalHeight !== 0) {
                    // Calculate bounding box of the wall
                    const minX = Math.min(points[0].x, points[1].x, points[2].x, points[3].x);
                    const maxX = Math.max(points[0].x, points[1].x, points[2].x, points[3].x);
                    const minY = Math.min(points[0].y, points[1].y, points[2].y, points[3].y);
                    const maxY = Math.max(points[0].y, points[1].y, points[2].y, points[3].y);
                    
                    const width = maxX - minX;
                    const height = maxY - minY;
                    
                    // Draw texture to fill the wall
                    ctx.drawImage(this.texture, minX, minY, width, height);
                } else {
                    // Fallback to solid color
                    ctx.fillStyle = this.color;
                    ctx.fill();
                }
                
                ctx.restore();
                
                // Draw outline
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                ctx.lineTo(points[1].x, points[1].y);
                ctx.lineTo(points[2].x, points[2].y);
                ctx.lineTo(points[3].x, points[3].y);
                ctx.closePath();
                ctx.stroke();
            }
        }
    };
}

/**
 * project3DTo2D
 * Projects a 3D point to 2D screen space from camera perspective
 * @param {Object} point - {x, y, z} coordinates in 3D space
 * @param {Object} camera - Camera object with position and direction
 * @param {Number} screenWidth - Canvas width
 * @param {Number} screenHeight - Canvas height
 * @returns {Object} {x, y, distance} screen coordinates and distance from camera
 */
function project3DTo2D(point, camera, screenWidth, screenHeight) {
    const halfWidth = screenWidth / 2;
    const halfHeight = screenHeight / 2;
    
    // Translate point relative to camera position
    let dx = point.x - camera.x;
    let dz = point.z - camera.y;
    
    // Rotate point based on camera direction
    const angle = helpers.radians(-camera.d);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const rotatedX = dx * cos - dz * sin;
    const rotatedZ = dx * sin + dz * cos;
    
    // Calculate distance from camera
    const distance = Math.sqrt(rotatedX * rotatedX + rotatedZ * rotatedZ);
    
    // Don't render if behind camera
    if (rotatedZ <= 0) {
        return null;
    }
    
    // Perspective projection
    const fov = camera.fov;
    const scale = fov / rotatedZ;
    
    const screenX = halfWidth + rotatedX * scale;
    const screenY = halfHeight - (point.y - halfHeight) * scale;
    
    return {
        x: screenX,
        y: screenY,
        distance: distance
    };
}
