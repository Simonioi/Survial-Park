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

    /** Spawn `count` NPCs on random floor cells */
    function spawnWave() {
        var count = baseCount + (wave - 1) * countIncrement;
        var W = game.canvas2D.width;
        var H = game.canvas2D.height;
        var hH = H / 2;
        var baseCellSize = game.mazeCellSize || 30;
        var minDist = baseCellSize * 3; // at least 3 cells away from player

        for (var i = 0; i < count; i++) {
            var pos = sampleSpawnPosition(minDist);
            // Fallback: relax distance constraint
            if (!pos) pos = sampleSpawnPosition(0);
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
