/**
 * Maze mode map generation.
 * Builds maze walls and spawn data from either saved or procedural grid.
 */
(function() {
    'use strict';

    function buildMazeModeMap(game, options) {
        const W = options.W;
        const H = options.H;
        const savedMaze = options.savedMaze || null;
        const wallTexture = options.wallTexture || null;

        const wallHeight = 100;
        const cellSize = savedMaze ? savedMaze.cellSize : 42;
        const cols = savedMaze ? savedMaze.cols : 41;
        const rows = savedMaze ? savedMaze.rows : 41;
        const loopChance = 0.08;
        const spawnSafeRadius = 1;

        let grid;
        let offsetX;
        let offsetY;

        if (savedMaze) {
            grid = savedMaze.grid;
            offsetX = savedMaze.offsetX;
            offsetY = savedMaze.offsetY;
        } else {
            const startCellX = 1 + 2 * MazeGen.randomInt(Math.floor((cols - 1) / 2));
            const startCellY = 1 + 2 * MazeGen.randomInt(Math.floor((rows - 1) / 2));
            grid = MazeGen.generateGrid(cols, rows, startCellX, startCellY, loopChance);
            offsetX = Math.floor((W - cols * cellSize) / 2);
            offsetY = Math.floor((H - rows * cellSize) / 2);
        }

        const wallSegments = MazeGen.gridToWallSegments(grid, cellSize, offsetX, offsetY);
        const walls = [];
        for (let i = 0; i < wallSegments.length; i++) {
            walls.push(new Wall(game, wallSegments[i], wallHeight, '#8B7355', wallTexture));
        }

        const safe = MazeGen.findSafeSpawn(grid, cols, rows, spawnSafeRadius);
        const spawn = {
            x: offsetX + (safe.cellX + 0.5) * cellSize,
            y: offsetY + (safe.cellY + 0.5) * cellSize
        };

        const spawnCells = [];
        for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
                if (grid[y][x] !== 0) continue;
                spawnCells.push({
                    x: offsetX + (x + 0.5) * cellSize,
                    y: offsetY + (y + 0.5) * cellSize
                });
            }
        }

        Logger.info('✓ Created ' + walls.length + ' procedural walls (' + cols + 'x' + rows + ' maze)');

        return {
            mode: 'maze',
            walls: walls,
            spawn: spawn,
            spawnCells: spawnCells,
            minSpawnDistance: cellSize * 3,
            mazeGrid: grid,
            mazeCellSize: cellSize,
            mazeOffsetX: offsetX,
            mazeOffsetY: offsetY
        };
    }

    window.buildMazeModeMap = buildMazeModeMap;
})();
