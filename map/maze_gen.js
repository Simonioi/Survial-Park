/**
 * Maze Generation Module
 * Procedural maze generation using randomized DFS.
 * Produces a different maze each game.
 */
const MazeGen = (function() {
    'use strict';

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

        // Ensure the outer border is solid walls so the player can never escape.
        for (let x = 0; x < cols; x++) {
            grid[0][x] = 1;
            grid[rows - 1][x] = 1;
        }
        for (let y = 0; y < rows; y++) {
            grid[y][0] = 1;
            grid[y][cols - 1] = 1;
        }

        return grid;
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

        // Add solid boundary walls around the entire maze perimeter
        const left   = offsetX;
        const top    = offsetY;
        const right  = offsetX + cols * cellSize;
        const bottom = offsetY + rows * cellSize;
        segments.push([left,  top,    right, top]);    // top edge
        segments.push([left,  bottom, right, bottom]); // bottom edge
        segments.push([left,  top,    left,  bottom]); // left edge
        segments.push([right, top,    right, bottom]); // right edge

        return segments;
    }

    /**
     * Find a safe spawn position — a floor cell with enough clearance
     * so the player never starts inside or adjacent to a wall.
     * Searches outward from the grid center for the closest safe spot.
     */
    function findSafeSpawn(grid, cols, rows, safeRadius) {
        const cx = Math.floor(cols / 2);
        const cy = Math.floor(rows / 2);

        const isSafe = (sx, sy) => {
            for (let oy = -safeRadius; oy <= safeRadius; oy++) {
                for (let ox = -safeRadius; ox <= safeRadius; ox++) {
                    const nx = sx + ox;
                    const ny = sy + oy;
                    if (nx <= 0 || ny <= 0 || nx >= cols - 1 || ny >= rows - 1) {
                        return false;
                    }
                    if (grid[ny][nx] !== 0) {
                        return false;
                    }
                }
            }
            return true;
        };

        // Spiral outward from center
        for (let dist = 0; dist < Math.max(cols, rows); dist++) {
            for (let dy = -dist; dy <= dist; dy++) {
                for (let dx = -dist; dx <= dist; dx++) {
                    if (Math.abs(dx) !== dist && Math.abs(dy) !== dist) {
                        continue; // only check the ring at this distance
                    }
                    const sx = cx + dx;
                    const sy = cy + dy;
                    if (sx <= 0 || sy <= 0 || sx >= cols - 1 || sy >= rows - 1) {
                        continue;
                    }
                    if (isSafe(sx, sy)) {
                        return { cellX: sx, cellY: sy };
                    }
                }
            }
        }

        // Absolute fallback: first floor cell found
        for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
                if (grid[y][x] === 0) {
                    return { cellX: x, cellY: y };
                }
            }
        }

        return { cellX: cx, cellY: cy };
    }

    // Public API
    return {
        randomInt: randomInt,
        generateGrid: generateConnectedCorridorGrid,
        gridToWallSegments: gridToWallSegments,
        findSafeSpawn: findSafeSpawn
    };
})();
