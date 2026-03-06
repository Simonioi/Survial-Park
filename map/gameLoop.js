/**
 * Main Game Loop
 * Handles the update and render cycle for the game
 */
function createGameLoop(game, W, H) {
    function gameLoop() {
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
        
        // Sort by z-index (furthest first)
        renderData.sort((a, b) => a.zIndex - b.zIndex);
        
        // Render NPCs
        for (let data of renderData) {
            draw.circle(game.ctxNPC, data.x, data.y, data.scale, data.color);
        }
        
        game.animationId = requestAnimationFrame(gameLoop);
    }
    
    return gameLoop;
}
