/**
 * Main Game Entry Point
 * Coordinates all game modules and initializes the game
 */
(function() {
    'use strict';

    const W = Math.min(600, window.innerHeight - 20); // Smaller canvas size, max 600px
    const H = Math.min(600, window.innerHeight - 20); // Smaller canvas size, max 600px
    const hW = W / 2; // half-width and half-height for centering
    const hH = H / 2; // half-width and half-height for centering
    const TSPEED = 3; // turning speed
    const WSPEED = 3; // walking speed (réduit pour un déplacement moins rapide)

    // Game state
    const game = {
        canvas2D: null,
        ctx2D: null,
        canvasNPC: null,
        ctxNPC: null,
        camera: null,
        npcs: [],
        walls: [],
        floor: null,
        wallTexture: null,
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

        // Wait for floor and wall textures before starting the game loop.
        let pendingAssets = 2;
        let hasStarted = false;

        // --- MODIF POUR LE MENU ---
        const isDevMode = window.location.href.includes('devMode');

        const onAssetReady = () => {
            pendingAssets -= 1;
            if (!hasStarted && pendingAssets <= 0) {
                hasStarted = true;
                
                // --- CONNEXION AU MENU OU LANCEMENT AUTO EN DEV MODE ---
                if (isDevMode) {
                    startGame(); 
                } else {
                    window.demarrerLeJeu = startGame;
                    Logger.info("Ressources chargées. En attente du bouton JOUER...");
                }
            }
        };

        loadFloorTexture(onAssetReady);
        loadWallTexture(onAssetReady);
    }

    function loadFloorTexture(onDone) {
        const floorTextureCandidates = [
            'Ressource/Floor dirt.jpg',
            '../Ressource/Floor dirt.jpg'
        ];

        const tryLoad = (index) => {
            if (index >= floorTextureCandidates.length) {
                Logger.warn('Floor texture not found, starting with solid fallback');
                if (onDone) onDone();
                return;
            }

            const path = floorTextureCandidates[index];
            game.floor.load(path, (success) => {
                if (success) {
                    if (onDone) onDone();
                } else {
                    tryLoad(index + 1);
                }
            });
        };

        tryLoad(0);
    }
    
    function loadWallTexture(onDone) {
        Logger.debug('Loading wall texture...');
        const wallTextureCandidates = [
            'Ressource/tree_wall.jpg',
            '../Ressource/tree_wall.jpg'
        ];

        const tryLoad = (index) => {
            if (index >= wallTextureCandidates.length) {
                Logger.info('Starting game without wall texture');
                game.wallTexture = null;
                if (onDone) onDone();
                return;
            }

            const wallTexture = new Image();
            const path = wallTextureCandidates[index];
            Logger.wrapImageLoad(wallTexture, 'Wall texture (tree_wall.jpg)', path,
                () => {
                    game.wallTexture = wallTexture;
                    if (onDone) onDone();
                },
                () => {
                    tryLoad(index + 1);
                }
            );
        };

        tryLoad(0);
    }
    
    function createWalls() {
        // Build a clean retro FPS corridor layout.
        const wallHeight = 100;

        // Reset existing walls before creating the corridor.
        game.walls.length = 0;

        const leftX = 240;
        const rightX = 360;
        const nearY = 540;
        const farY = 60;

        // Left wall
        game.walls.push(new Wall(
            game,
            [leftX, farY, leftX, nearY],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));

        // Right wall
        game.walls.push(new Wall(
            game,
            [rightX, farY, rightX, nearY],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));

        // Corridor end wall (front)
        game.walls.push(new Wall(
            game,
            [leftX, farY, rightX, farY],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));

        // Corridor back wall
        game.walls.push(new Wall(
            game,
            [leftX, nearY, rightX, nearY],
            wallHeight,
            '#8B7355',
            game.wallTexture
        ));
        
        Logger.info(`✓ Created ${game.walls.length} walls with tree texture`);
    }
    
    function startGame() {
        // Create camera (from camera.js)
        game.camera = new Camera(game, W, H, hW, hH, TSPEED, WSPEED);

        // Create textured walls for the 3D corridor feel.
        createWalls();

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