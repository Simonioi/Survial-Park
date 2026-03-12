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
 * 2D cross product helper.
 */
function cross2D(ax, ay, bx, by) {
    return (ax * by) - (ay * bx);
}

/**
 * Cast a ray against one wall segment.
 * Returns null when no hit.
 */
function intersectRaySegment(rayX, rayY, rayDX, rayDY, wall) {
    const sx = wall.x2 - wall.x1;
    const sy = wall.y2 - wall.y1;

    const denom = cross2D(rayDX, rayDY, sx, sy);
    if (Math.abs(denom) < 0.00001) {
        return null;
    }

    const ox = wall.x1 - rayX;
    const oy = wall.y1 - rayY;

    const t = cross2D(ox, oy, sx, sy) / denom;      // ray distance (ray is unit length)
    const u = cross2D(ox, oy, rayDX, rayDY) / denom; // segment position 0..1

    if (t <= 0 || u < 0 || u > 1) {
        return null;
    }

    return { distance: t, u: u };
}

/**
 * Render walls with a classic column-based raycaster.
 * Returns a z-buffer for sprite/NPC occlusion.
 */
function renderRaycastWalls(game, ctx, W, H) {
    if (!game || !game.player || !game.walls || game.walls.length === 0) {
        return new Array(W).fill(Infinity);
    }

    const camera = game.player;
    const rayStep = 2; // Lower resolution for stable FPS
    const zBuffer = new Array(W).fill(Infinity);
    const halfH = H / 2;

    const fovDeg = camera.fovAngle || 75;
    const halfFovRad = helpers.radians(fovDeg * 0.5);
    const camAngle = helpers.radians(camera.d);
    const projPlane = (W * 0.5) / Math.tan(halfFovRad);

    for (let screenX = 0; screenX < W; screenX += rayStep) {
        const rayRatio = (screenX / W) - 0.5;
        const rayAngle = camAngle + (rayRatio * 2 * halfFovRad);
        const rayDX = Math.sin(rayAngle);
        const rayDY = -Math.cos(rayAngle);

        let best = null;
        let bestWall = null;

        for (let i = 0; i < game.walls.length; i++) {
            const wall = game.walls[i];
            if (!wall) continue;

            const hit = intersectRaySegment(camera.x, camera.y, rayDX, rayDY, wall);
            if (!hit) continue;

            if (!best || hit.distance < best.distance) {
                best = hit;
                bestWall = wall;
            }
        }

        if (!best || !bestWall) {
            continue;
        }

        // Fish-eye correction.
        const correctedDistance = Math.max(0.001, best.distance * Math.cos(rayAngle - camAngle));
        const wallHeight = (bestWall.height * projPlane) / correctedDistance;
        const drawTop = Math.floor(halfH - wallHeight * 0.5);
        const drawBottom = Math.floor(halfH + wallHeight * 0.5);
        const drawHeight = Math.max(1, drawBottom - drawTop);

        for (let px = 0; px < rayStep && (screenX + px) < W; px++) {
            zBuffer[screenX + px] = correctedDistance;
        }

        if (bestWall.texture && bestWall.texture.complete && bestWall.texture.naturalHeight !== 0) {
            const texX = Math.max(0, Math.min(bestWall.texture.width - 1, Math.floor(best.u * bestWall.texture.width)));
            ctx.drawImage(
                bestWall.texture,
                texX,
                0,
                1,
                bestWall.texture.height,
                screenX,
                drawTop,
                rayStep,
                drawHeight
            );
        } else {
            // Distance shading on flat color fallback.
            const shade = Math.max(0.25, 1 - (correctedDistance / 450));
            ctx.fillStyle = `rgba(139,115,85,${shade})`;
            ctx.fillRect(screenX, drawTop, rayStep, drawHeight);
        }
    }

    return zBuffer;
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
    const camera = this.game.player;
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

    // Skip this wall when projection is invalid (behind camera / clipped).
    if (!points[0] || !points[1] || !points[2] || !points[3]) {
        return null;
    }
    
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

                    // Skip extreme projections that can cause heavy frame drops.
                    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 1 || height <= 1 || width > 5000 || height > 5000) {
                        return;
                    }
                    
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
    // Near plane culling avoids massive scale spikes when camera gets too close.
    if (rotatedZ <= 8) {
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
