/**
 * Main Game Entry Point
 * Coordinates all game modules and initializes the game
 */
(function() {
    'use strict';

    const viewportW = Math.max(320, window.innerWidth - 40);
    const viewportH = Math.max(320, window.innerHeight - 20);
    const H = Math.min(560, viewportH); // Slightly reduced height
    const W = Math.min(980, Math.floor(viewportW * 0.82), Math.floor(H * 1.6)); // Reduced rectangular view
    const hW = W / 2; // half-width and half-height for centering
    const hH = H / 2; // half-width and half-height for centering
    const TSPEED = 2; // turning speed
    const WSPEED = 1.5; // walking speed
    const MAP_MODE_KEY = 'survivalPark_map_mode';

    // Game state
    const game = {
        canvas2D: null,
        ctx2D: null,
        canvasNPC: null,
        ctxNPC: null,
        player: null,
        npcs: [],
        walls: [],
        floor: null,
        wallTexture: null,
        mossyWallTexture: null,
        map2DRenderer: null,
        keys: {},
        animationId: null,
        isMouseDown: false,
        score: {
            kills: 0,
            shots: 0
        },
        weapon: null,
        mapMode: 'maze',
        spawnPoint: { x: hW, y: hH },
        mapSpawnCells: [],
        mapSpawnSampler: null
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
        let pendingAssets = 3;
        let hasStarted = false;

        // --- MENU INTEGRATION CHANGE ---
        const isDevMode = window.location.href.includes('devMode');

        const onAssetReady = () => {
            pendingAssets -= 1;
            if (!hasStarted && pendingAssets <= 0) {
                hasStarted = true;
                
                // --- MENU HOOK OR AUTO-START IN DEV MODE ---
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
        loadMossyWallTexture(onAssetReady);
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

    function loadMossyWallTexture(onDone) {
        Logger.debug('Loading mossy wall texture...');
        const mossyWallTextureCandidates = [
            'Ressource/Mossy_wall.jpg',
            '../Ressource/Mossy_wall.jpg'
        ];

        const tryLoad = (index) => {
            if (index >= mossyWallTextureCandidates.length) {
                Logger.info('Mossy wall texture not found, using default wall texture for kill-room interior');
                game.mossyWallTexture = null;
                if (onDone) onDone();
                return;
            }

            const mossyWallTexture = new Image();
            const path = mossyWallTextureCandidates[index];
            Logger.wrapImageLoad(mossyWallTexture, 'Wall texture (Mossy_wall.jpg)', path,
                () => {
                    game.mossyWallTexture = mossyWallTexture;
                    if (onDone) onDone();
                },
                () => {
                    tryLoad(index + 1);
                }
            );
        };

        tryLoad(0);
    }
    
    function getMapModeFromInput(modeFromMenu) {
        const urlParams = new URLSearchParams(window.location.search);
        const fromUrl = urlParams.get('mapMode');
        const fromParam = modeFromMenu === 'kill-room' || modeFromMenu === 'maze' ? modeFromMenu : null;
        const normalizedUrl = fromUrl === 'kill-room' || fromUrl === 'maze' ? fromUrl : null;
        const fromStorage = localStorage.getItem(MAP_MODE_KEY);
        const chosen = fromParam || normalizedUrl || (fromStorage === 'kill-room' || fromStorage === 'maze' ? fromStorage : 'maze');
        localStorage.setItem(MAP_MODE_KEY, chosen);
        return chosen;
    }

    function applyGeneratedMap(mapData) {
        if (!mapData) {
            Logger.error('Map generation returned no data');
            return null;
        }

        game.walls.length = 0;
        for (let i = 0; i < mapData.walls.length; i++) {
            game.walls.push(mapData.walls[i]);
        }

        game.spawnPoint = mapData.spawn;
        game.mazeGrid = mapData.mazeGrid;
        game.mazeCellSize = mapData.mazeCellSize;
        game.mazeOffsetX = mapData.mazeOffsetX;
        game.mazeOffsetY = mapData.mazeOffsetY;
        game.mapSpawnCells = mapData.spawnCells || [];
        game.mapSpawnSampler = createMapSpawnSampler(
            game,
            game.mapSpawnCells,
            mapData.minSpawnDistance || 0,
            game.spawnPoint
        );

        return mapData.spawn;
    }

    function buildMapByMode(mode, savedMaze) {
        game.mapMode = mode;

        let generatedMap;
        if (mode === 'kill-room') {
            if (typeof buildKillRoomModeMap !== 'function') {
                Logger.error('Kill room generator not loaded');
                return null;
            }
            generatedMap = buildKillRoomModeMap(game, {
                W: W,
                H: H,
                wallTexture: game.wallTexture,
                interiorWallTexture: game.mossyWallTexture || game.wallTexture
            });
        } else {
            if (typeof buildMazeModeMap !== 'function') {
                Logger.error('Maze generator not loaded');
                return null;
            }
            generatedMap = buildMazeModeMap(game, {
                W: W,
                H: H,
                savedMaze: savedMaze,
                wallTexture: game.wallTexture
            });
        }

        return applyGeneratedMap(generatedMap);
    }
    
    function startGame(modeFromMenu) {
        // Create player (from player.js)
        game.player = new Player(game, W, H, hW, hH, TSPEED, WSPEED);

        const mapMode = getMapModeFromInput(modeFromMenu);

        // Try to restore a saved maze, otherwise generate a new one
        const savedMaze = (window.SaveSystem && mapMode === 'maze') ? SaveSystem.loadMaze() : null;
        const spawn = buildMapByMode(mapMode, savedMaze);

        if (savedMaze) {
            // Restore player position, score, NPCs, wave from save
            if (window.SaveSystem) {
                SaveSystem.loadPlayerPosition(game.player);
                SaveSystem.loadStats(game.score);
            }
        } else if (spawn) {
            game.player.x = spawn.x;
            game.player.y = spawn.y;
            game.player.d = 0;
        }

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
            // Normal mode: survival wave spawning
            if (typeof WaveManager === 'undefined') {
                Logger.error('WaveManager is required but not loaded');
                return;
            }

            WaveManager.init(game);
            if (savedMaze) {
                // Restore NPCs and wave from save
                if (window.SaveSystem) {
                    SaveSystem.loadNPCs(game, W, H, hH);
                    SaveSystem.loadWave();
                }
            }
            Logger.gameState('Survival mode — wave spawning active (' + mapMode + ')');
        }

        // Auto-save when leaving the page
        window.addEventListener('beforeunload', () => {
            if (window.SaveSystem && game) {
                SaveSystem.saveGame(game);
                Logger.autoSave.onUnload();
            }
        });

        // Auto-save periodically every 10 seconds
        setInterval(() => {
            if (window.SaveSystem && game) {
                SaveSystem.saveGame(game);
            }
        }, 10000);

        // Expose resetGame globally so the Main Menu button can call it
        window.resetGame = function () {
            // Stop game loop
            if (game.animationId) {
                cancelAnimationFrame(game.animationId);
                game.animationId = null;
            }
            // Clear saved data
            if (window.SaveSystem) SaveSystem.clearAll();
        };
        
        // Start game loop (from gameLoop.js)
        const gameLoop = createGameLoop(game, W, H);
        gameLoop();
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