/**
 * Floor Module
 * Handles floor/background rendering for the 3D view
 */

class Floor {
    constructor(game) {
        this.game = game;
        this.backgroundImage = null;
        this.loaded = false;
        this.failed = false;
    }

    /**
     * Load the floor background image
     * @param {String} imagePath - Path to the background image
     * @param {Function} callback - Called when loading completes (success or failure)
     */
    load(imagePath, callback) {
        Logger.debug(`Loading floor background: ${imagePath}...`);
        const bgImage = new Image();
        Logger.wrapImageLoad(bgImage, 'Floor background', imagePath,
            () => {
                this.backgroundImage = bgImage;
                this.loaded = true;
                if (callback) callback(true);
            },
            (e) => {
                Logger.info('Will use solid color fallback');
                this.failed = true;
                if (callback) callback(false);
            }
        );
    }

    /**
     * Render the floor/background
     * @param {CanvasRenderingContext2D} ctx - Canvas context for 3D view
     * @param {Number} width - Canvas width
     * @param {Number} height - Canvas height
     */
    render(ctx, width, height, camera) {
        const horizon = Math.floor(height * 0.5);

        // Night sky for horror atmosphere.
        ctx.fillStyle = '#0b1630';
        ctx.fillRect(0, 0, width, horizon);

        // Horizon blend band
        ctx.fillStyle = 'rgba(120,150,220,0.12)';
        ctx.fillRect(0, horizon - 2, width, 4);

        const viewHeight = height - horizon;

        // Solid fixed ground — no image, no movement.
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(0, horizon, width, viewHeight);

        // Depth-fog gradient for retro feel.
        const grad = ctx.createLinearGradient(0, horizon, 0, height);
        grad.addColorStop(0, 'rgba(0,0,0,0.35)');
        grad.addColorStop(1, 'rgba(0,0,0,0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, horizon, width, viewHeight);
    }

    /**
     * Render the floor using scanline floor-casting so the texture
     * is anchored to the world and rotates with the camera.
     */
    renderFloorCast(ctx, width, height, horizon, camera) {
        const texture = this.backgroundImage;
        if (!texture || !texture.width || !texture.height) {
            ctx.fillStyle = '#6b5b3e';
            ctx.fillRect(0, horizon, width, height - horizon);
            return;
        }

        // Grab pixel data from the texture once.
        if (!this._floorTexData || this._floorTexSrc !== texture.src) {
            const offscreen = document.createElement('canvas');
            offscreen.width = texture.width;
            offscreen.height = texture.height;
            const octx = offscreen.getContext('2d');
            octx.drawImage(texture, 0, 0);
            this._floorTexData = octx.getImageData(0, 0, texture.width, texture.height);
            this._floorTexSrc = texture.src;
        }

        const texData = this._floorTexData.data;
        const texW = this._floorTexData.width;
        const texH = this._floorTexData.height;

        const imgData = ctx.createImageData(width, height - horizon);
        const pixels = imgData.data;

        const fovDeg = camera.fovAngle || 75;
        const halfFov = helpers.radians(fovDeg * 0.5);
        const camAngle = helpers.radians(camera.d);
        const camX = camera.x;
        const camY = camera.y;

        const dirX = Math.sin(camAngle);
        const dirY = -Math.cos(camAngle);
        const planeX = Math.cos(camAngle) * Math.tan(halfFov);
        const planeY = Math.sin(camAngle) * Math.tan(halfFov);

        const cameraHeight = 0.5;
        const stripH = 2; // Render every 2nd row for performance.
        const textureScale = 0.04; // How often the texture repeats across the world.

        for (let sy = 0; sy < height - horizon; sy += stripH) {
            const screenY = horizon + sy;
            const rowDist = (cameraHeight * height) / (screenY - horizon + 0.5);

            // Fog factor for depth shading.
            const fog = Math.min(1, rowDist * 0.003);

            // Left and right floor positions for this row.
            const floorStepX = (2 * rowDist * planeX) / width;
            const floorStepY = (2 * rowDist * planeY) / width;

            let floorX = camX + rowDist * dirX - rowDist * planeX;
            let floorY = camY + rowDist * dirY - rowDist * planeY;

            for (let x = 0; x < width; x++) {
                // Texture coordinates (wrap).
                const tx = ((Math.floor(floorX * textureScale * texW) % texW) + texW) % texW;
                const ty = ((Math.floor(floorY * textureScale * texH) % texH) + texH) % texH;

                const texIdx = (ty * texW + tx) * 4;
                const r = texData[texIdx];
                const g = texData[texIdx + 1];
                const b = texData[texIdx + 2];

                // Write pixel with fog applied.
                const invFog = 1 - fog;
                for (let dy = 0; dy < stripH && (sy + dy) < height - horizon; dy++) {
                    const pIdx = ((sy + dy) * width + x) * 4;
                    pixels[pIdx]     = Math.floor(r * invFog);
                    pixels[pIdx + 1] = Math.floor(g * invFog);
                    pixels[pIdx + 2] = Math.floor(b * invFog);
                    pixels[pIdx + 3] = 255;
                }

                floorX += floorStepX;
                floorY += floorStepY;
            }
        }

        ctx.putImageData(imgData, 0, horizon);
    }

    /**
     * Set a new background image
     * @param {Image} image - Pre-loaded image object
     */
    setBackgroundImage(image) {
        if (image && image.complete && image.naturalHeight !== 0) {
            this.backgroundImage = image;
            this.loaded = true;
            Logger.info('Floor background set successfully');
        }
    }
}
