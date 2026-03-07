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
    render(ctx, width, height) {
        if (this.loaded && this.backgroundImage) {
            // Draw the background image
            ctx.drawImage(this.backgroundImage, 0, 0, width, height);
        } else {
            // Fallback to solid black
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
        }
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
