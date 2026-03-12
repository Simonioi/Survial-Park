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
    
    function randomInt(maxExclusive) {
        return Math.floor(Math.random() * maxExclusive);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            const tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
    }

    function generateConnectedCorridorGrid(cols, rows, spawnCellX, spawnCellY, loopChance) {
        const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
        const stack = [[spawnCellX, spawnCellY]];
        const directions = [
            [0, -2],
            [2, 0],
            [0, 2],
            [-2, 0]
        ];

        grid[spawnCellY][spawnCellX] = 0;

        // DFS maze carving keeps all corridors connected to the spawn root.
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const cx = current[0];
            const cy = current[1];
            const choices = [];

            for (let i = 0; i < directions.length; i++) {
                const dx = directions[i][0];
                const dy = directions[i][1];
                const nx = cx + dx;
                const ny = cy + dy;

                if (nx <= 0 || ny <= 0 || nx >= cols - 1 || ny >= rows - 1) {
                    continue;
                }

                if (grid[ny][nx] === 1) {
                    choices.push([dx, dy]);
                }
            }

            if (choices.length === 0) {
                stack.pop();
                continue;
            }

            shuffleArray(choices);
            const selected = choices[0];
            const dx = selected[0];
            const dy = selected[1];
            const nx = cx + dx;
            const ny = cy + dy;

            grid[cy + Math.floor(dy / 2)][cx + Math.floor(dx / 2)] = 0;
            grid[ny][nx] = 0;
            stack.push([nx, ny]);
        }

        // Add loops so the map feels less like a strict tree maze.
        for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
                if (grid[y][x] !== 1 || Math.random() >= loopChance) {
                    continue;
                }

                const leftAndRightOpen = grid[y][x - 1] === 0 && grid[y][x + 1] === 0;
                const upAndDownOpen = grid[y - 1][x] === 0 && grid[y + 1][x] === 0;
                if (leftAndRightOpen || upAndDownOpen) {
                    grid[y][x] = 0;
                }
            }
        }

        return grid;
    }

    function carveRectFloor(grid, minX, minY, maxX, maxY) {
        const rows = grid.length;
        const cols = grid[0].length;
        const startX = Math.max(1, minX);
        const startY = Math.max(1, minY);
        const endX = Math.min(cols - 2, maxX);
        const endY = Math.min(rows - 2, maxY);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                grid[y][x] = 0;
            }
        }
    }

    function carveSpawnRoomAndExits(grid, spawnCellX, spawnCellY, roomHalfSize) {
        const rows = grid.length;
        const cols = grid[0].length;
        const doorHalfWidth = 1;

        // Keep a stable, always-open spawn hall around the player.
        carveRectFloor(
            grid,
            spawnCellX - roomHalfSize,
            spawnCellY - roomHalfSize,
            spawnCellX + roomHalfSize,
            spawnCellY + roomHalfSize
        );

        const exits = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];

        for (let i = 0; i < exits.length; i++) {
            const dir = exits[i];
            const dx = dir[0];
            const dy = dir[1];
            let x = spawnCellX;
            let y = spawnCellY;

            for (let step = 0; step < Math.max(cols, rows); step++) {
                x += dx;
                y += dy;

                if (x <= 0 || y <= 0 || x >= cols - 1 || y >= rows - 1) {
                    break;
                }

                const wasFloor = grid[y][x] === 0;

                // Carve wider door openings so room exits are easy to see.
                if (dx !== 0) {
                    for (let oy = -doorHalfWidth; oy <= doorHalfWidth; oy++) {
                        const ny = y + oy;
                        if (ny > 0 && ny < rows - 1) {
                            grid[ny][x] = 0;
                        }
                    }
                } else {
                    for (let ox = -doorHalfWidth; ox <= doorHalfWidth; ox++) {
                        const nx = x + ox;
                        if (nx > 0 && nx < cols - 1) {
                            grid[y][nx] = 0;
                        }
                    }
                }

                // Once we are outside the room and touching existing maze floor,
                // this exit is connected and can stop.
                if (step > roomHalfSize && wasFloor) {
                    break;
                }
            }
        }
    }

    function forceFrontSpawnEntrance(grid, mazeGrid, spawnCellX, spawnCellY, roomHalfSize) {
        const rows = grid.length;
        const cols = grid[0].length;
        const doorHalfWidth = 1;
        const dx = 0;
        const dy = -1; // Camera starts at d=0, so this is straight ahead.
        let connected = false;

        for (let step = roomHalfSize; step < rows; step++) {
            const x = spawnCellX + dx * step;
            const y = spawnCellY + dy * step;

            if (x <= 0 || y <= 0 || x >= cols - 1 || y >= rows - 1) {
                break;
            }

            for (let ox = -doorHalfWidth; ox <= doorHalfWidth; ox++) {
                const nx = x + ox;
                if (nx > 0 && nx < cols - 1) {
                    grid[y][nx] = 0;
                }
            }

            const hitProcedural =
                mazeGrid[y][x] === 0 ||
                (x - 1 > 0 && mazeGrid[y][x - 1] === 0) ||
                (x + 1 < cols - 1 && mazeGrid[y][x + 1] === 0);

            if (step > roomHalfSize && hitProcedural) {
                connected = true;
                break;
            }
        }

        if (!connected) {
            // Fallback: keep the front lane open almost to the map border.
            for (let y = spawnCellY - roomHalfSize; y > 1; y--) {
                for (let ox = -doorHalfWidth; ox <= doorHalfWidth; ox++) {
                    const nx = spawnCellX + ox;
                    if (nx > 0 && nx < cols - 1) {
                        grid[y][nx] = 0;
                    }
                }
            }
        }
    }

    function connectSpawnRoomToProcedural(grid, mazeGrid, spawnCellX, spawnCellY, roomHalfSize, minLinks) {
        const rows = grid.length;
        const cols = grid[0].length;
        const directions = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];
        let links = 0;

        for (let i = 0; i < directions.length; i++) {
            if (links >= minLinks) {
                break;
            }

            const dx = directions[i][0];
            const dy = directions[i][1];
            const doorX = spawnCellX + dx * roomHalfSize;
            const doorY = spawnCellY + dy * roomHalfSize;
            let hitX = null;
            let hitY = null;

            for (let step = roomHalfSize + 1; step < Math.max(cols, rows); step++) {
                const x = spawnCellX + dx * step;
                const y = spawnCellY + dy * step;
                if (x <= 0 || y <= 0 || x >= cols - 1 || y >= rows - 1) {
                    break;
                }

                // Target only corridors that already belonged to the procedural maze.
                if (mazeGrid[y][x] === 0) {
                    hitX = x;
                    hitY = y;
                    break;
                }
            }

            if (hitX === null || hitY === null) {
                continue;
            }

            let x = doorX;
            let y = doorY;
            while (x !== hitX || y !== hitY) {
                grid[y][x] = 0;
                if (x !== hitX) x += dx;
                if (y !== hitY) y += dy;
            }
            grid[hitY][hitX] = 0;
            links += 1;
        }

        // Fallback: connect to nearest procedural floor if directional links failed.
        if (links === 0) {
            let best = null;
            for (let y = 1; y < rows - 1; y++) {
                for (let x = 1; x < cols - 1; x++) {
                    if (mazeGrid[y][x] !== 0) {
                        continue;
                    }
                    const dist = Math.abs(x - spawnCellX) + Math.abs(y - spawnCellY);
                    if (dist <= roomHalfSize + 1) {
                        continue;
                    }
                    if (!best || dist < best.dist) {
                        best = { x: x, y: y, dist: dist };
                    }
                }
            }

            if (best) {
                let x = spawnCellX;
                let y = spawnCellY;
                while (x !== best.x) {
                    grid[y][x] = 0;
                    x += best.x > x ? 1 : -1;
                }
                while (y !== best.y) {
                    grid[y][x] = 0;
                    y += best.y > y ? 1 : -1;
                }
                grid[best.y][best.x] = 0;
            }
        }
    }

    function widenCorridors(grid, radius) {
        const rows = grid.length;
        const cols = grid[0].length;
        const widened = grid.map((row) => row.slice());

        for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
                if (grid[y][x] !== 0) {
                    continue;
                }

                for (let oy = -radius; oy <= radius; oy++) {
                    for (let ox = -radius; ox <= radius; ox++) {
                        const nx = x + ox;
                        const ny = y + oy;
                        if (nx <= 0 || ny <= 0 || nx >= cols - 1 || ny >= rows - 1) {
                            continue;
                        }
                        widened[ny][nx] = 0;
                    }
                }
            }
        }

        return widened;
    }

    function enforceVisibleSpawnFrontDoor(grid, referenceGrid, spawnCellX, spawnCellY) {
        const rows = grid.length;
        const cols = grid[0].length;

        const inBounds = (x, y) => x > 0 && y > 0 && x < cols - 1 && y < rows - 1;
        const roomHalfWidth = 3;
        const roomHalfDepth = 2;
        const northWallY = spawnCellY - roomHalfDepth - 1;
        const corridorHalfWidth = 1;

        // 1) Rebuild a clean spawn room.
        for (let y = spawnCellY - roomHalfDepth; y <= spawnCellY + roomHalfDepth; y++) {
            for (let x = spawnCellX - roomHalfWidth; x <= spawnCellX + roomHalfWidth; x++) {
                if (inBounds(x, y)) {
                    grid[y][x] = 0;
                }
            }
        }

        // 2) Build a solid front wall facing the player.
        for (let x = spawnCellX - roomHalfWidth; x <= spawnCellX + roomHalfWidth; x++) {
            if (inBounds(x, northWallY)) {
                grid[northWallY][x] = 1;
            }
        }

        // 3) Carve a centered doorway in that wall (the visible hole).
        for (let x = spawnCellX - 1; x <= spawnCellX + 1; x++) {
            if (inBounds(x, northWallY)) {
                grid[northWallY][x] = 0;
            }
        }

        // 4) Carve a corridor directly behind the doorway until it touches
        // existing procedural floor (from referenceGrid).
        let connectionY = 1;
        for (let y = northWallY - 1; y >= 1; y--) {
            for (let x = spawnCellX - corridorHalfWidth; x <= spawnCellX + corridorHalfWidth; x++) {
                if (inBounds(x, y)) {
                    grid[y][x] = 0;
                }
            }

            let touchesProcedural = false;
            for (let x = spawnCellX - corridorHalfWidth - 1; x <= spawnCellX + corridorHalfWidth + 1; x++) {
                if (inBounds(x, y) && referenceGrid[y][x] === 0) {
                    touchesProcedural = true;
                    break;
                }
            }

            if (touchesProcedural && y < northWallY - 1) {
                connectionY = y;
                break;
            }
        }

        // Open a wider junction where the entry corridor meets the procedural map.
        for (let x = spawnCellX - 3; x <= spawnCellX + 3; x++) {
            if (inBounds(x, connectionY)) {
                grid[connectionY][x] = 0;
            }
        }

        // 5) Keep corridor walls for readability, but do not close existing side paths.
        for (let y = northWallY - 1; y > connectionY; y--) {
            const leftWallX = spawnCellX - (corridorHalfWidth + 1);
            const rightWallX = spawnCellX + (corridorHalfWidth + 1);
            if (inBounds(leftWallX, y) && referenceGrid[y][leftWallX] === 1) {
                grid[y][leftWallX] = 1;
            }
            if (inBounds(rightWallX, y) && referenceGrid[y][rightWallX] === 1) {
                grid[y][rightWallX] = 1;
            }
        }
    }

    function addInterval(map, key, start, end) {
        if (!map[key]) {
            map[key] = [];
        }
        map[key].push([start, end]);
    }

    function mergeIntervals(intervals) {
        if (!intervals || intervals.length === 0) {
            return [];
        }

        const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
        const merged = [sorted[0].slice()];

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];

            if (current[0] <= last[1]) {
                if (current[1] > last[1]) {
                    last[1] = current[1];
                }
            } else {
                merged.push(current.slice());
            }
        }

        return merged;
    }

    function gridToWallSegments(grid, cellSize, offsetX, offsetY) {
        const rows = grid.length;
        const cols = grid[0].length;
        const horizontalEdges = {};
        const verticalEdges = {};

        const isFloor = (x, y) => {
            if (x < 0 || y < 0 || x >= cols || y >= rows) {
                return false;
            }
            return grid[y][x] === 0;
        };

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (grid[y][x] !== 1) {
                    continue;
                }

                if (isFloor(x, y - 1)) {
                    addInterval(horizontalEdges, y, x, x + 1);
                }
                if (isFloor(x, y + 1)) {
                    addInterval(horizontalEdges, y + 1, x, x + 1);
                }
                if (isFloor(x - 1, y)) {
                    addInterval(verticalEdges, x, y, y + 1);
                }
                if (isFloor(x + 1, y)) {
                    addInterval(verticalEdges, x + 1, y, y + 1);
                }
            }
        }

        const segments = [];

        const horizontalKeys = Object.keys(horizontalEdges);
        for (let i = 0; i < horizontalKeys.length; i++) {
            const key = horizontalKeys[i];
            const y = Number(key);
            const merged = mergeIntervals(horizontalEdges[key]);
            for (let j = 0; j < merged.length; j++) {
                const interval = merged[j];
                segments.push([
                    offsetX + interval[0] * cellSize,
                    offsetY + y * cellSize,
                    offsetX + interval[1] * cellSize,
                    offsetY + y * cellSize
                ]);
            }
        }

        const verticalKeys = Object.keys(verticalEdges);
        for (let i = 0; i < verticalKeys.length; i++) {
            const key = verticalKeys[i];
            const x = Number(key);
            const merged = mergeIntervals(verticalEdges[key]);
            for (let j = 0; j < merged.length; j++) {
                const interval = merged[j];
                segments.push([
                    offsetX + x * cellSize,
                    offsetY + interval[0] * cellSize,
                    offsetX + x * cellSize,
                    offsetY + interval[1] * cellSize
                ]);
            }
        }

        return segments;
    }

    function createWalls() {
        const wallHeight = 100;
        const cellSize = 40;
        const cols = 15;
        const rows = 15;
        const loopChance = 0.16;
        const corridorWidenRadius = 1;
        const roomHW = 3;
        const roomHD = 3;
        const entranceHW = 1;

        game.walls.length = 0;

        const spawnCellX = Math.floor(cols / 2);
        const spawnCellY = Math.floor(rows / 2);

        // 1) Generate base maze.
        const grid = generateConnectedCorridorGrid(cols, rows, spawnCellX, spawnCellY, loopChance);

        // 2) Widen corridors.
        const wide = widenCorridors(grid, corridorWidenRadius);

        // 3) Carve a large spawn room in the center.
        for (let y = spawnCellY - roomHD; y <= spawnCellY + roomHD; y++) {
            for (let x = spawnCellX - roomHW; x <= spawnCellX + roomHW; x++) {
                if (x > 0 && y > 0 && x < cols - 1 && y < rows - 1) {
                    wide[y][x] = 0;
                }
            }
        }

        // 4) Carve entrance corridors in all 4 directions until they
        //    connect to existing maze floor.
        const dirs = [
            [0, -1],  // north (straight ahead for d=0)
            [0, 1],   // south
            [-1, 0],  // west
            [1, 0]    // east
        ];

        for (let d = 0; d < dirs.length; d++) {
            const dx = dirs[d][0];
            const dy = dirs[d][1];
            let connected = false;

            for (let step = 1; step < Math.max(cols, rows); step++) {
                const cx = spawnCellX + dx * (roomHW + step);
                const cy = spawnCellY + dy * (roomHD + step);

                if (cx <= 0 || cy <= 0 || cx >= cols - 1 || cy >= rows - 1) {
                    break;
                }

                // Check if this cell already touches widened maze floor.
                if (wide[cy][cx] === 0) {
                    connected = true;
                }

                // Carve the entrance (3 cells wide).
                if (dx !== 0) {
                    for (let oy = -entranceHW; oy <= entranceHW; oy++) {
                        const ny = cy + oy;
                        if (ny > 0 && ny < rows - 1) {
                            wide[ny][cx] = 0;
                        }
                    }
                } else {
                    for (let ox = -entranceHW; ox <= entranceHW; ox++) {
                        const nx = cx + ox;
                        if (nx > 0 && nx < cols - 1) {
                            wide[cy][nx] = 0;
                        }
                    }
                }

                if (connected) {
                    break;
                }
            }
        }

        // 5) Convert final grid to wall segments (single source of truth).
        const offsetX = Math.floor((W - cols * cellSize) / 2);
        const offsetY = Math.floor((H - rows * cellSize) / 2);
        const wallSegments = gridToWallSegments(wide, cellSize, offsetX, offsetY);

        for (let i = 0; i < wallSegments.length; i++) {
            game.walls.push(new Wall(
                game,
                wallSegments[i],
                wallHeight,
                '#8B7355',
                game.wallTexture
            ));
        }

        const spawn = {
            x: offsetX + (spawnCellX + 0.5) * cellSize,
            y: offsetY + (spawnCellY + 0.5) * cellSize
        };

        Logger.info(`✓ Created ${game.walls.length} procedural corridor walls`);
        return spawn;
    }
    
    function startGame() {
        // Create camera (from camera.js)
        game.camera = new Camera(game, W, H, hW, hH, TSPEED, WSPEED);

        // Create procedural connected corridors and place player at map spawn.
        const spawn = createWalls();
        if (spawn) {
            game.camera.x = spawn.x;
            game.camera.y = spawn.y;
            game.camera.d = 0;
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