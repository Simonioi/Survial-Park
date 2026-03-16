/**
 * Kill-room mode map generation.
 * Builds a single-room arena with interior cover and wave spawn points.
 */
(function() {
    'use strict';

    function addWallSegment(walls, game, wallTexture, wallHeight, x1, y1, x2, y2) {
        walls.push(new Wall(game, [x1, y1, x2, y2], wallHeight, '#8B7355', wallTexture));
    }

    function buildKillRoomModeMap(game, options) {
        const W = options.W;
        const H = options.H;
        const wallTexture = options.wallTexture || null;

        const wallHeight = 100;
        const margin = 35;
        const minX = margin;
        const minY = margin;
        const maxX = W - margin;
        const maxY = H - margin;

        const walls = [];

        // Outer room.
        addWallSegment(walls, game, wallTexture, wallHeight, minX, minY, maxX, minY);
        addWallSegment(walls, game, wallTexture, wallHeight, maxX, minY, maxX, maxY);
        addWallSegment(walls, game, wallTexture, wallHeight, maxX, maxY, minX, maxY);
        addWallSegment(walls, game, wallTexture, wallHeight, minX, maxY, minX, minY);

        // Interior cover obstacles.
        addWallSegment(walls, game, wallTexture, wallHeight, W * 0.25, H * 0.28, W * 0.40, H * 0.28);
        addWallSegment(walls, game, wallTexture, wallHeight, W * 0.25, H * 0.28, W * 0.25, H * 0.42);

        addWallSegment(walls, game, wallTexture, wallHeight, W * 0.60, H * 0.30, W * 0.75, H * 0.30);
        addWallSegment(walls, game, wallTexture, wallHeight, W * 0.75, H * 0.30, W * 0.75, H * 0.45);

        addWallSegment(walls, game, wallTexture, wallHeight, W * 0.33, H * 0.62, W * 0.47, H * 0.62);
        addWallSegment(walls, game, wallTexture, wallHeight, W * 0.47, H * 0.62, W * 0.47, H * 0.78);

        addWallSegment(walls, game, wallTexture, wallHeight, W * 0.58, H * 0.68, W * 0.74, H * 0.68);
        addWallSegment(walls, game, wallTexture, wallHeight, W * 0.58, H * 0.54, W * 0.58, H * 0.68);

        const spawn = { x: W * 0.5, y: H * 0.5 };
        const spawnCells = [];
        const step = 28;

        for (let y = minY + step; y <= maxY - step; y += step) {
            for (let x = minX + step; x <= maxX - step; x += step) {
                if (x > W * 0.44 && x < W * 0.56 && y > H * 0.44 && y < H * 0.56) {
                    continue;
                }
                spawnCells.push({ x: x, y: y });
            }
        }

        Logger.info('✓ Created kill room layout with interior cover obstacles');

        return {
            mode: 'kill-room',
            walls: walls,
            spawn: spawn,
            spawnCells: spawnCells,
            minSpawnDistance: step * 2.5,
            mazeGrid: null,
            mazeCellSize: step,
            mazeOffsetX: 0,
            mazeOffsetY: 0
        };
    }

    window.buildKillRoomModeMap = buildKillRoomModeMap;
})();
