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

    /** Find a random floor cell that isn't too close to the player */
    function randomFloorCell(minPlayerDist) {
        var grid = game.mazeGrid;
        var cs = game.mazeCellSize;
        var ox = game.mazeOffsetX;
        var oy = game.mazeOffsetY;
        if (!grid) return null;

        var rows = grid.length;
        var cols = grid[0].length;
        var px = game.player.x;
        var py = game.player.y;

        // Collect all floor cells
        var cells = [];
        for (var y = 1; y < rows - 1; y++) {
            for (var x = 1; x < cols - 1; x++) {
                if (grid[y][x] === 0) {
                    var wx = ox + (x + 0.5) * cs;
                    var wy = oy + (y + 0.5) * cs;
                    var dx = wx - px;
                    var dy = wy - py;
                    if (Math.sqrt(dx * dx + dy * dy) >= minPlayerDist) {
                        cells.push({ x: wx, y: wy });
                    }
                }
            }
        }

        if (cells.length === 0) return null;
        return cells[Math.floor(Math.random() * cells.length)];
    }

    /** Spawn `count` NPCs on random floor cells */
    function spawnWave() {
        var count = baseCount + (wave - 1) * countIncrement;
        var W = game.canvas2D.width;
        var H = game.canvas2D.height;
        var hH = H / 2;
        var minDist = game.mazeCellSize * 3; // at least 3 cells away from player

        for (var i = 0; i < count; i++) {
            var pos = randomFloorCell(minDist);
            // Fallback: relax distance constraint
            if (!pos) pos = randomFloorCell(0);
            var idx = game.npcs.length;
            var npc = new NPC(game, idx, pos ? pos.x : undefined, pos ? pos.y : undefined, W, H, hH);
            game.npcs.push(npc);

            if (game.map2DRenderer) {
                game.map2DRenderer.addNPC(npc);
            }
        }

        Logger.info('Wave ' + wave + ' — ' + count + ' NPCs spawned');
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
