/**
 * Main Game Entry Point
 * Coordinates all game modules and initializes the game
 * * Dependencies (load in this order):
 * 1. helpers.js - Math and drawing utilities
 * 2. camera.js - Camera class
 * 3. npc.js - NPC class
 * 4. gameLoop.js - Main game loop
 */
(function() {
    'use strict';

    const W = Math.min(600, window.innerHeight - 20); // Smaller canvas size, max 600px
    const H = Math.min(600, window.innerHeight - 20); // Smaller canvas size, max 600px
    const hW = W / 2; // half-width and half-height for centering
    const hH = H / 2; // half-width and half-height for centering
    const TSPEED = 3; // turning speed
    const WSPEED = 5; // walking speed

    // Game state
    const game = {
        canvas2D: null,
        ctx2D: null,
        canvasNPC: null,
        ctxNPC: null,
        camera: null,
        npcs: [],
        floor: null,
        map2DRenderer: null,
        keys: {},
        animationId: null,
        isMouseDown: false,
        score: {
            kills: 0,
            shots: 0
        },
        weapon: null
    };

    // Initialize game
   function init() {
        // Setup canvas for 2D view
        const canvas2D = document.getElementById('target2');
        if (!canvas2D) {
            Logger.error('Canvas element "target2" not found');
            return;
        }
        canvas2D.width = W;
        canvas2D.height = H;
        game.canvas2D = canvas2D;
        game.ctx2D = canvas2D.getContext('2d');
        
        // Setup canvas for NPC 3D view
        const canvasNPC = document.getElementById('target');
        if (!canvasNPC) {
            Logger.error('Canvas element "target" not found');
            return;
        }
        canvasNPC.width = W;
        canvasNPC.height = H;
        game.canvasNPC = canvasNPC;
        game.ctxNPC = canvasNPC.getContext('2d');
        
        // Initialize floor
        game.floor = new Floor(game);

        // --- NEW: Check if we are in Dev Mode to adjust file paths ---
        const isDevMode = window.location.href.includes('devMode');
        const basePath = isDevMode ? '../' : '';
        
        // Preload floor background image
        // --- MODIFIED FOR MENU SYSTEM & DEV MODE PATH FIX ---
        // Uses basePath to find the image whether we are in index.html (root) or devMode.html (folder)
        game.floor.load(basePath + 'Ressource/black_bg_test.jpg', (success) => {
            if (isDevMode) {
                // If in Dev Mode, start the game immediately (no menu here)
                startGame();
            } else {
                // Instead of starting the game immediately, we pause it and link it to the PLAY button in menu.js
                window.demarrerLeJeu = startGame;
                Logger.info("Menu ready! Waiting for player to click PLAY...");
            }
        });
    }
    // --- MODIFIED --- 
    // Removed the duplicate loadWallTexture() function that was here before
    function loadWallTexture() {
        Logger.debug('Loading wall texture...');
        const wallTexture = new Image();

        // --- NEW: Check if we are in Dev Mode to adjust file paths ---
        const isDevMode = window.location.href.includes('devMode');
        const basePath = isDevMode ? '../' : '';
        
        // --- MODIFIED DEV MODE PATH FIX ---
        // Added basePath so the image loads correctly in both normal and dev mode
        Logger.wrapImageLoad(wallTexture, 'Wall texture (tree_wall.jpg)', basePath + 'Ressource/tree_wall.jpg',
            () => {
                game.wallTexture = wallTexture;
                startGame();
            },
            (e) => {
                Logger.info('Starting game without wall texture');
                game.wallTexture = null;
                startGame();
            }
        );
    }
    
    function createWalls() {
        // Create some sample walls with tree texture
        const wallHeight = 100;
        
        // Create boundary walls around the edges (camera starts at center so these won't block view)
        
        // Top boundary
        game.walls.push(new Wall(
            game,
            [50, 50, 550, 50],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));
        
        // Bottom boundary
        game.walls.push(new Wall(
            game,
            [50, 550, 550, 550],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));
        
        // Left boundary
        game.walls.push(new Wall(
            game,
            [50, 50, 50, 550],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));
        
        // Right boundary
        game.walls.push(new Wall(
            game,
            [550, 50, 550, 550],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));
        
        // Interior walls creating corridors (away from center starting position)
        // Horizontal wall in upper area
        game.walls.push(new Wall(
            game,
            [100, 150, 250, 150],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));
        
        // Vertical wall on left side
        game.walls.push(new Wall(
            game,
            [150, 200, 150, 350],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));
        
        // Horizontal wall in lower area
        game.walls.push(new Wall(
            game,
            [350, 450, 500, 450],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));
        
        Logger.info(`✓ Created ${game.walls.length} walls with tree texture`);
    }
    
    function startGame() {
        // Create camera (from camera.js)
        game.camera = new Camera(game, W, H, hW, hH, TSPEED, WSPEED);

        // Initialize isolated weapon modules when present.
        if (typeof createWeaponState === 'function') {
            game.weapon = createWeaponState();
        }

        if (typeof setupWeaponInput === 'function') {
            setupWeaponInput(game);
        }
        
        // Initialize 2D map renderer (from 2D map folder)
        game.map2DRenderer = new Map2DRenderer(game);
        game.map2DRenderer.init();
        
        // Initialize Dev Mode if available (from Dev mode folder)
        if (typeof initDevMode === 'function') {
            initDevMode(game);
            Logger.gameState('Dev Mode active - Use spawn button to add NPCs');
        } else {
            // Normal mode: No automatic NPC spawning
            Logger.gameState('Normal mode - Use dev mode to spawn NPCs');
            
            // Load NPCs from localStorage (synced from dev mode)
            loadNPCsFromLocalStorage();
        }
        
        // Auto-save when leaving the page
        window.addEventListener('beforeunload', () => {
            if (window.SaveSystem && game) {
                SaveSystem.saveGame(game);
                Logger.autoSave.onUnload();
            }
        });
        
        // Periodic auto-save every 10 seconds
        setInterval(() => {
            if (window.SaveSystem && game) {
                SaveSystem.saveGame(game);
            }
        }, 10000);
        
        // Start game loop (from gameLoop.js)
        const gameLoop = createGameLoop(game, W, H);
        gameLoop();
    }

    function loadNPCsFromLocalStorage() {
        // Use SaveSystem if available, otherwise fallback to direct load
        if (window.SaveSystem) {
            SaveSystem.loadGame(game, W, H, hH);
        } else {
            Logger.warn('SaveSystem not loaded, falling back to direct load');
            const npcData = localStorage.getItem('survivalPark_npcs');
            if (!npcData) {
                Logger.storage.missing('NPCs');
                return;
            }
            
            try {
                const npcs = JSON.parse(npcData);
                
                // Clear existing NPCs
                game.npcs.length = 0;
                if (game.map2DRenderer && game.map2DRenderer.npc2D) {
                    game.map2DRenderer.npc2D.npcs.length = 0;
                }
                
                // Spawn NPCs from stored data
                npcs.forEach((npcInfo, index) => {
                    const npc = new NPC(game, index, npcInfo.x, npcInfo.y, W, H, hH);
                    game.npcs.push(npc);
                    
                    // Register with 2D map renderer
                    if (game.map2DRenderer) {
                        game.map2DRenderer.addNPC(npc);
                    }
                });
                
                Logger.npcs.loaded(npcs.length);
            } catch (error) {
                Logger.storage.failed('load', 'NPCs', error);
            }
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose game for debugging
    window.game = game;
})();