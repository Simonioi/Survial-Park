/**
 * Main Game Loop
 * Handles the update and render cycle for the game
 */
function createGameLoop(game, W, H) {
    function gameLoop() {
        const now = performance.now();

        // Update camera
        game.camera.loop();
        
        // Render 2D map
        if (game.map2DRenderer) {
            game.map2DRenderer.render();
        }
        
        // Draw background image if loaded, otherwise clear with black
        if (game.backgroundImage) {
            game.ctxNPC.drawImage(game.backgroundImage, 0, 0, W, H);
        } else {
            // Clear to black if no background
            game.ctxNPC.fillStyle = '#000000';
            game.ctxNPC.fillRect(0, 0, W, H);
        }
        
        // Update and collect NPC render data
        const renderData = [];
        for (let npc of game.npcs) {
            const data = npc.loop();
            if (data) {
                renderData.push(data);
            }
        }

        // Weapon update uses projected NPCs for center-screen hitscan.
        if (game.weapon && typeof updateWeaponSystem === 'function') {
            updateWeaponSystem(game, renderData, now);
        }
        
        // Sort by z-index (furthest first)
        renderData.sort((a, b) => a.zIndex - b.zIndex);
        
        // Render NPCs
        for (let data of renderData) {
            draw.circle(game.ctxNPC, data.x, data.y, data.scale, data.color);
        }

        if (game.weapon && typeof drawWeaponCrosshair === 'function') {
            drawWeaponCrosshair(game, now);
        }

        if (game.weapon && typeof drawWeaponOverlay === 'function') {
            drawWeaponOverlay(game, W, H, now);
        }
        
        game.animationId = requestAnimationFrame(gameLoop);
    }
    
    return gameLoop;
}
