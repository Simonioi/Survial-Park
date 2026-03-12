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

            // Map mouse position to world coordinates accounting for CSS scaling
            const scaleX = canvas2D.width / rect.width;
            const scaleY = canvas2D.height / rect.height;
            const worldX = (e.clientX - rect.left) * scaleX;
            const worldY = (e.clientY - rect.top) * scaleY;

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
