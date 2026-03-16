/**
 * Teleport Command (Dev Mode only)
 * Click on the 2D map to teleport the player to that position.
 */
(function () {
    'use strict';

    function pointToSegDist(px, py, x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        var len2 = dx * dx + dy * dy;
        if (len2 === 0) return Math.hypot(px - x1, py - y1);
        var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }

    function hitsWall(x, y, radius) {
        var walls = window.game && window.game.walls;
        if (!walls) return false;
        for (var i = 0; i < walls.length; i++) {
            var w = walls[i];
            if (w && pointToSegDist(x, y, w.x1, w.y1, w.x2, w.y2) < radius) return true;
        }
        return false;
    }

    function initTeleport() {
        const canvas2D = document.getElementById('target2');
        if (!canvas2D) return;

        canvas2D.addEventListener('click', function (e) {
            if (!window.game || !window.game.player) return;

            const rect = canvas2D.getBoundingClientRect();

            // Map mouse position to world coordinates accounting for CSS scaling + zoom
            const scaleX = canvas2D.width / rect.width;
            const scaleY = canvas2D.height / rect.height;
            var canvasX = (e.clientX - rect.left) * scaleX;
            var canvasY = (e.clientY - rect.top) * scaleY;

            // Reverse the zoom transform applied by Map2DRenderer
            var zoom = (window.game.map2DRenderer && window.game.map2DRenderer.zoom) || 1;
            var g = window.game;
            var ox = g.mazeOffsetX || 0;
            var oy = g.mazeOffsetY || 0;
            var cols = g.mazeGrid ? g.mazeGrid[0].length : 0;
            var rows = g.mazeGrid ? g.mazeGrid.length : 0;
            var cs  = g.mazeCellSize || 1;
            var mazeCX = ox + (cols * cs) / 2;
            var mazeCY = oy + (rows * cs) / 2;
            var worldX = (canvasX - canvas2D.width / 2) / zoom + mazeCX;
            var worldY = (canvasY - canvas2D.height / 2) / zoom + mazeCY;

            // Check the target isn't inside a wall
            if (hitsWall(worldX, worldY, window.game.player.collisionRadius)) {
                Logger.warn('TP blocked — destination is inside a wall');
                return;
            }

            window.game.player.x = worldX;
            window.game.player.y = worldY;

            Logger.info('TP → (' + Math.round(worldX) + ', ' + Math.round(worldY) + ')');
        });
    }

    window.addEventListener('load', function () {
        // Small delay so the game is fully initialised
        setTimeout(initTeleport, 200);
    });
})();
