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

        // Retro FPS sky
        ctx.fillStyle = '#4fa6ff';
        ctx.fillRect(0, 0, width, horizon);

        // Horizon blend band
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(0, horizon - 2, width, 4);

        if (this.loaded && this.backgroundImage) {
            this.renderPerspectiveFloor(ctx, width, height, horizon, camera);
        } else {
            // Fallback ground color when texture is unavailable
            ctx.fillStyle = '#6b5b3e';
            ctx.fillRect(0, horizon, width, height - horizon);
        }
    }

    /**
     * Render a pseudo-perspective textured floor (Doom/Wolf3D style feel)
     */
    renderPerspectiveFloor(ctx, width, height, horizon, camera) {
        const texture = this.backgroundImage;
        if (!texture || !texture.width || !texture.height) {
            ctx.fillStyle = '#6b5b3e';
            ctx.fillRect(0, horizon, width, height - horizon);
            return;
        }

        const texW = texture.width;
        const texH = texture.height;

        // Paramètres caméra basiques pour faire défiler la texture
        const camX = camera ? camera.x : 0;
        const camY = camera ? camera.y : 0;
        const camD = camera ? camera.d : 0;
        const camAngle = helpers.radians(camD);

        // Hauteur de l'horizon et taille des bandes
        const viewHeight = height - horizon;
        const stripHeight = 4; // bandes plus épaisses = beaucoup moins de drawImage

        // Facteurs de défilement de la texture
        const scrollSpeedX = 0.35;
        const scrollSpeedY = 0.6;

        for (let y = horizon; y < height; y += stripHeight) {
            const depth = (y - horizon) / viewHeight; // 0 (proche) -> 1 (loin)

            // On pousse un peu plus la texture près de l'horizon pour donner une sensation de perspective
            const texRow = ((camY * scrollSpeedY) + depth * texH * 3) % texH;
            const texColOffset = ((camX * scrollSpeedX) + Math.sin(camAngle) * depth * texW) % texW;

            const sampleY = (texRow + texH) % texH;

            // Premier drawImage : de texColOffset jusqu'à la fin de la texture
            const srcX1 = Math.floor((texColOffset + texW) % texW);
            const srcW1 = texW - srcX1;

            ctx.drawImage(
                texture,
                srcX1,
                Math.floor(sampleY),
                srcW1,
                1,
                0,
                y,
                (srcW1 / texW) * width,
                stripHeight
            );

            // Si on a “wrapé” horizontalement, second drawImage pour le reste
            if (srcX1 > 0) {
                const remainingW = srcX1;
                ctx.drawImage(
                    texture,
                    0,
                    Math.floor(sampleY),
                    remainingW,
                    1,
                    (srcW1 / texW) * width,
                    y,
                    (remainingW / texW) * width,
                    stripHeight
                );
            }
        }

        // Léger dégradé pour marquer l'horizon sans masquer la texture
        const grad = ctx.createLinearGradient(0, horizon, 0, height);
        grad.addColorStop(0, 'rgba(0,0,0,0.25)');
        grad.addColorStop(1, 'rgba(0,0,0,0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, horizon, width, height - horizon);
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
