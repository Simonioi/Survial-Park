
// Returns a function that picks spawn cells while enforcing min player distance.
(function() {
    'use strict';

    function createMapSpawnSampler(game, cells, minDistance, fallbackPoint) {
        const sourceCells = Array.isArray(cells) ? cells : [];

        return function sampleSpawn(minDistOverride) {
            const minDist = Number.isFinite(minDistOverride) ? minDistOverride : minDistance;
            const px = game && game.player ? game.player.x : fallbackPoint.x;
            const py = game && game.player ? game.player.y : fallbackPoint.y;
            const eligible = [];

            for (let i = 0; i < sourceCells.length; i++) {
                const cell = sourceCells[i];
                const dx = cell.x - px;
                const dy = cell.y - py;
                if (Math.sqrt(dx * dx + dy * dy) >= minDist) {
                    eligible.push(cell);
                }
            }

            const pool = eligible.length > 0 ? eligible : sourceCells;
            if (pool.length === 0) {
                return { x: fallbackPoint.x, y: fallbackPoint.y };
            }

            const selected = pool[Math.floor(Math.random() * pool.length)];
            return { x: selected.x, y: selected.y };
        };
    }

    window.createMapSpawnSampler = createMapSpawnSampler;
})();
