/**
 * Centralized Logging System
 * Handles all console output for the game with configurable log levels
 */

const Logger = {
    // Log levels
    LEVELS: {
        NONE: 0,    // No logging
        ERROR: 1,   // Only errors
        WARN: 2,    // Warnings and errors
        INFO: 3,    // Info, warnings, and errors
        DEBUG: 4    // All logs including debug
    },

    // Current log level (set to DEBUG to see all logs)
    currentLevel: 3, // INFO by default

    /**
     * Set the logging level
     * @param {number} level - One of Logger.LEVELS
     */
    setLevel(level) {
        this.currentLevel = level;
        console.log(`Logger level set to: ${Object.keys(this.LEVELS).find(k => this.LEVELS[k] === level)}`);
    },

    /**
     * Log an info message
     */
    info(...args) {
        if (this.currentLevel >= this.LEVELS.INFO) {
            console.log(...args);
        }
    },

    /**
     * Log a warning message
     */
    warn(...args) {
        if (this.currentLevel >= this.LEVELS.WARN) {
            console.warn(...args);
        }
    },

    /**
     * Log an error message
     */
    error(...args) {
        if (this.currentLevel >= this.LEVELS.ERROR) {
            console.error(...args);
        }
    },

    /**
     * Log a debug message
     */
    debug(...args) {
        if (this.currentLevel >= this.LEVELS.DEBUG) {
            console.log('[DEBUG]', ...args);
        }
    },

    // Specialized logging methods for common game events

    /**
     * Log NPC spawn
     */
    npcSpawned(index, x, y) {
        this.info(`✓ Spawned NPC #${index} at (${Math.round(x)}, ${Math.round(y)}) - Visible in 3D and 2D maps`);
    },

    /**
     * Log NPC kill
     */
    npcKilled(index) {
        this.debug(`Mob ${index} killed!`);
    },

    /**
     * Log NPC cleanup
     */
    npcCleanup(removed, remaining) {
        this.debug(`Cleaned up ${removed} dead NPCs (${remaining} remaining)`);
    },

    /**
     * Log save operation
     */
    saved(type, details = '') {
        this.info(`✓ Saved ${type}${details ? ': ' + details : ''}`);
    },

    /**
     * Log load operation
     */
    loaded(type, details = '') {
        this.info(`✓ Loaded ${type}${details ? ': ' + details : ''}`);
    },

    /**
     * Log resource loading
     */
    resourceLoaded(name) {
        this.info(`${name} loaded successfully`);
    },

    /**
     * Log resource failure
     */
    resourceFailed(name, error = '') {
        this.error(`Failed to load ${name}${error ? ': ' + error : ''}`);
    },

    /**
     * Log initialization
     */
    initialized(component) {
        this.info(`${component} initialized`);
    },

    /**
     * Log game state
     */
    gameState(message) {
        this.info(message);
    },

    /**
     * Disable all logging (for production)
     */
    disable() {
        this.setLevel(this.LEVELS.NONE);
    },

    /**
     * Enable full debug logging
     */
    enableDebug() {
        this.setLevel(this.LEVELS.DEBUG);
    },

    // === High-level wrapper functions to reduce code in main files ===

    /**
     * Wrap image loading with automatic logging
     * @param {Image} img - Image object to configure
     * @param {string} name - Name of the resource for logging
     * @param {string} src - Image source path
     * @param {Function} onSuccess - Callback when image loads
     * @param {Function} onFail - Callback when image fails (optional)
     */
    wrapImageLoad(img, name, src, onSuccess, onFail) {
        img.onload = () => {
            this.resourceLoaded(name);
            if (onSuccess) onSuccess();
        };
        img.onerror = (e) => {
            this.resourceFailed(name, src);
            if (onFail) onFail(e);
        };
        img.src = src;
    },

    /**
     * Log localStorage operations with detailed info
     */
    storage: {
        saved(key, count = null, details = '') {
            const msg = count !== null 
                ? `✓ Saved ${count} ${key}${details ? ': ' + details : ''}`
                : `✓ Saved ${key}${details ? ': ' + details : ''}`;
            Logger.info(msg);
        },
        
        loaded(key, count = null, details = '') {
            const msg = count !== null
                ? `✓ Loaded ${count} ${key}${details ? ': ' + details : ''}`
                : `✓ Loaded ${key}${details ? ': ' + details : ''}`;
            Logger.info(msg);
        },
        
        missing(key) {
            Logger.info(`No ${key} in localStorage`);
        },
        
        failed(operation, key, error) {
            Logger.error(`Failed to ${operation} ${key}:`, error);
        }
    },

    /**
     * Log player position with formatting
     */
    playerPosition: {
        saved(x, y, rotation) {
            Logger.info(`✓ Saved player position (${Math.round(x)}, ${Math.round(y)}, ${Math.round(rotation)}°)`);
        },
        
        loaded(x, y, rotation) {
            Logger.info(`✓ Loaded player position (${Math.round(x)}, ${Math.round(y)}, ${Math.round(rotation)}°)`);
        }
    },

    /**
     * Log NPC operations with detailed info
     */
    npcs: {
        saved(total, deadCount) {
            Logger.info(`✓ Saved ${total} NPCs (including ${deadCount} dead)`);
        },
        
        loaded(count) {
            Logger.info(`✓ Loaded ${count} NPCs from localStorage`);
        },
        
        spawned(index, x, y) {
            Logger.info(`✓ Spawned NPC #${index} at (${Math.round(x)}, ${Math.round(y)}) - Visible in 3D and 2D maps`);
        },
        
        cleared(count) {
            Logger.info(`✓ Cleared ${count} NPCs from all views (3D map, 2D map, dev mode)`);
        },
        
        cleanedUp(removed, remaining) {
            Logger.debug(`Cleaned up ${removed} dead NPCs (${remaining} remaining)`);
        },
        
        killed(index) {
            Logger.debug(`Mob ${index} killed!`);
        }
    },

    /**
     * Log game stats
     */
    stats: {
        saved(kills, shots) {
            Logger.info(`✓ Saved stats (Kills: ${kills}, Shots: ${shots})`);
        },
        
        loaded(kills, shots) {
            Logger.info(`✓ Loaded stats (Kills: ${kills}, Shots: ${shots})`);
        }
    },

    /**
     * Log dev mode specific events
     */
    devMode: {
        clearing(count) {
            Logger.debug(`Clearing ${count} NPCs...`);
        },
        
        beforeClear(npcCount, rendererCount) {
            Logger.debug('Before clear - game.npcs length:', npcCount);
            Logger.debug('Before clear - 2D renderer NPCs:', rendererCount);
        },
        
        afterClear(npcCount, rendererCount) {
            Logger.debug('After clear - game.npcs length:', npcCount);
            Logger.debug('After clear - 2D renderer NPCs:', rendererCount);
        }
    },

    /**
     * Log auto-save events
     */
    autoSave: {
        onUnload() {
            Logger.debug('Auto-saved game state on page unload');
        },
        
        enabled() {
            Logger.info('Auto-save enabled: saves on page unload and every 10 seconds');
        }
    }
};

// Make Logger globally available
window.Logger = Logger;
