/**
 * Wave Manager – Survival mode
 * Spawns waves of NPCs with increasing count.
 * When all NPCs of a wave are dead, the next wave starts.
 */
const WaveManager = (function () {
    'use strict';

    let game = null;
    let wave = 0;
    let baseCount = 3;        // NPCs in wave 1
    let countIncrement = 2;   // extra NPCs per wave
    let waveActive = false;
    let delayBetweenWaves = 1500; // ms pause before next wave

    function init(gameRef) {
        game = gameRef;
        wave = 0;
        waveActive = false;
    }

    /** Number of NPCs alive (not dead) */
    function aliveCount() {
        if (!game || !game.npcs) return 0;
        var n = 0;
        for (var i = 0; i < game.npcs.length; i++) {
            if (!game.npcs[i].isDead) n++;
        }
        return n;
    }

    function sampleSpawnPosition(minDist) {
        if (game && typeof game.mapSpawnSampler === 'function') {
            return game.mapSpawnSampler(minDist);
        }
        return game && game.spawnPoint ? { x: game.spawnPoint.x, y: game.spawnPoint.y } : null;
    }

    function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        var lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            var ddx = px - x1;
            var ddy = py - y1;
            return Math.sqrt(ddx * ddx + ddy * ddy);
        }

        var t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        var closestX = x1 + t * dx;
        var closestY = y1 + t * dy;
        var cdx = px - closestX;
        var cdy = py - closestY;
        return Math.sqrt(cdx * cdx + cdy * cdy);
    }

    function getPlayableBounds() {
        if (!game) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

        // Maze bounds
        if (game.mazeGrid && game.mazeCellSize) {
            var ox = game.mazeOffsetX || 0;
            var oy = game.mazeOffsetY || 0;
            var cols = game.mazeGrid[0] ? game.mazeGrid[0].length : 0;
            var rows = game.mazeGrid.length;
            var cs = game.mazeCellSize;
            return {
                minX: ox + cs * 0.5,
                minY: oy + cs * 0.5,
                maxX: ox + cols * cs - cs * 0.5,
                maxY: oy + rows * cs - cs * 0.5
            };
        }

        // Kill-room bounds from spawn cells when available
        if (game.mapSpawnCells && game.mapSpawnCells.length > 0) {
            var minX = Infinity;
            var minY = Infinity;
            var maxX = -Infinity;
            var maxY = -Infinity;
            for (var i = 0; i < game.mapSpawnCells.length; i++) {
                var c = game.mapSpawnCells[i];
                if (c.x < minX) minX = c.x;
                if (c.y < minY) minY = c.y;
                if (c.x > maxX) maxX = c.x;
                if (c.y > maxY) maxY = c.y;
            }
            return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
        }

        // Generic fallback to canvas
        return {
            minX: 10,
            minY: 10,
            maxX: Math.max(10, game.canvas2D.width - 10),
            maxY: Math.max(10, game.canvas2D.height - 10)
        };
    }

    function isInsidePlayableBounds(pos) {
        if (!pos) return false;
        var b = getPlayableBounds();
        return pos.x >= b.minX && pos.x <= b.maxX && pos.y >= b.minY && pos.y <= b.maxY;
    }

    function isInsideMazeFloorCell(pos) {
        if (!pos || !game || !game.mazeGrid || !game.mazeCellSize) return true;

        var ox = game.mazeOffsetX || 0;
        var oy = game.mazeOffsetY || 0;
        var cs = game.mazeCellSize;
        var cx = Math.floor((pos.x - ox) / cs);
        var cy = Math.floor((pos.y - oy) / cs);

        if (cy < 0 || cy >= game.mazeGrid.length) return false;
        if (cx < 0 || cx >= game.mazeGrid[cy].length) return false;
        return game.mazeGrid[cy][cx] === 0;
    }

    function isTooCloseToWall(pos, minWallDistance) {
        if (!pos || !game || !game.walls || game.walls.length === 0) return false;
        for (var i = 0; i < game.walls.length; i++) {
            var wall = game.walls[i];
            if (!wall) continue;
            var d = pointToSegmentDistance(pos.x, pos.y, wall.x1, wall.y1, wall.x2, wall.y2);
            if (d < minWallDistance) return true;
        }
        return false;
    }

    function sanitizeSpawnPosition(rawPos, minDist) {
        var wallBuffer = Math.max(12, (game.mazeCellSize || 24) * 0.45);
        var pos = rawPos;

        if (pos && isInsidePlayableBounds(pos) && isInsideMazeFloorCell(pos) && !isTooCloseToWall(pos, wallBuffer)) {
            return pos;
        }

        // Retry with sampler a few times when first pick is invalid.
        for (var tries = 0; tries < 10; tries++) {
            var retry = sampleSpawnPosition(minDist);
            if (retry && isInsidePlayableBounds(retry) && isInsideMazeFloorCell(retry) && !isTooCloseToWall(retry, wallBuffer)) {
                return retry;
            }
        }

        // In maze mode, prefer a known spawn cell center to avoid any wall overlap.
        if (game && game.mazeGrid && game.mapSpawnCells && game.mapSpawnCells.length > 0) {
            for (var i = 0; i < game.mapSpawnCells.length; i++) {
                var candidate = game.mapSpawnCells[(i + Math.floor(Math.random() * game.mapSpawnCells.length)) % game.mapSpawnCells.length];
                if (candidate && isInsideMazeFloorCell(candidate) && !isTooCloseToWall(candidate, wallBuffer)) {
                    return { x: candidate.x, y: candidate.y };
                }
            }
        }

        // Last-resort fallback: spawn point clamped in playable bounds.
        var b = getPlayableBounds();
        var fallback = game && game.spawnPoint ? game.spawnPoint : { x: (b.minX + b.maxX) * 0.5, y: (b.minY + b.maxY) * 0.5 };
        var safeFallback = {
            x: Math.min(b.maxX, Math.max(b.minX, fallback.x)),
            y: Math.min(b.maxY, Math.max(b.minY, fallback.y))
        };

        if (isInsideMazeFloorCell(safeFallback)) {
            return safeFallback;
        }

        // Final maze-safe fallback: player's spawn point if valid, else first spawn cell.
        if (game && game.spawnPoint && isInsideMazeFloorCell(game.spawnPoint)) {
            return { x: game.spawnPoint.x, y: game.spawnPoint.y };
        }
        if (game && game.mapSpawnCells && game.mapSpawnCells.length > 0) {
            return { x: game.mapSpawnCells[0].x, y: game.mapSpawnCells[0].y };
        }

        return safeFallback;
    }

    /** Spawn `count` NPCs on random floor cells */
    function spawnWave() {
        var count = baseCount + (wave - 1) * countIncrement;
        var swordRexCount = (wave % 3 === 0) ? Math.floor(wave / 3) : 0;
        var W = game.canvas2D.width;
        var H = game.canvas2D.height;
        var hH = H / 2;
        var baseCellSize = game.mazeCellSize || 30;
        var minDist = baseCellSize * 3; // at least 3 cells away from player

        for (var i = 0; i < count; i++) {
            var pos = sampleSpawnPosition(minDist);
            // Fallback: relax distance constraint
            if (!pos) pos = sampleSpawnPosition(0);
            pos = sanitizeSpawnPosition(pos, minDist);
            var idx = game.npcs.length;
            var npc = new NPC(game, idx, pos ? pos.x : undefined, pos ? pos.y : undefined, W, H, hH);
            game.npcs.push(npc);

            if (game.map2DRenderer) {
                game.map2DRenderer.addNPC(npc);
            }
        }

        // Sword Rex progressif: vague 3 => 1, vague 6 => 2, vague 9 => 3, etc.
        if (swordRexCount > 0 && typeof SwordRex !== 'undefined') {
            for (var r = 0; r < swordRexCount; r++) {
                var rexPos = sampleSpawnPosition(minDist);
                if (!rexPos) rexPos = sampleSpawnPosition(0);
                rexPos = sanitizeSpawnPosition(rexPos, minDist);
                var rexIdx = game.npcs.length;
                var rex = new SwordRex(game, rexIdx, rexPos ? rexPos.x : undefined, rexPos ? rexPos.y : undefined, W, H, hH);
                game.npcs.push(rex);

                if (game.map2DRenderer) {
                    game.map2DRenderer.addNPC(rex);
                }
            }
        }

        Logger.info('Wave ' + wave + ' — ' + count + ' NPCs spawned' + (swordRexCount > 0 ? ' + ' + swordRexCount + ' SwordRex' : ''));
        waveActive = true;
    }

    /** Call every frame from the game loop */
    function update() {
        if (!game || !game.player) return;

        // First wave auto-start
        if (wave === 0) {
            wave = 1;
            spawnWave();
            return;
        }

        if (!waveActive) return;

        // Check if all NPCs are dead
        if (aliveCount() === 0) {
            waveActive = false;
            wave++;
            setTimeout(spawnWave, delayBetweenWaves);
        }
    }

    function getWave() {
        return wave;
    }

    function setWave(w) {
        wave = w;
    }

    return {
        init: init,
        update: update,
        getWave: getWave,
        setWave: setWave
    };
})();
