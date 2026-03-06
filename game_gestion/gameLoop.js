/**
 * Main Game Loop
 * Handles the update and render cycle for the game
 */
function createGameLoop(game, W, H) {
    // Load NPC image for 3D rendering
    const npcImage = new Image();
    let npcImageLoaded = false;
    
    npcImage.onload = () => {
        npcImageLoaded = true;
        console.log('NPC 3D image (ugly.png) loaded successfully');
    };
    npcImage.onerror = () => {
        console.error('Failed to load ugly.png for 3D NPCs');
    };
    npcImage.src = '../Ressource/ugly.png';
    
    function gameLoop() {
        const now = performance.now();

        // Update camera
        game.camera.loop();
        
        // Save camera position and score periodically (every ~60 frames = ~1 second at 60fps)
        if (!gameLoop.frameCount) gameLoop.frameCount = 0;
        gameLoop.frameCount++;
        if (gameLoop.frameCount % 60 === 0) {
            if (typeof saveCameraToStorage === 'function') {
                saveCameraToStorage(game.camera);
            }
            if (typeof saveScoreToStorage === 'function' && game.score) {
                saveScoreToStorage(game.score);
            }
        }
        
        // Clean up dead NPCs periodically (every ~100 frames = ~1.6 seconds at 60fps)
        if (gameLoop.frameCount % 100 === 0) {
            const beforeCount = game.npcs.length;
            game.npcs = game.npcs.filter(npc => !npc.isDead);
            const afterCount = game.npcs.length;
            
            // Also clean up 2D renderer
            if (game.map2DRenderer && game.map2DRenderer.npc2D) {
                game.map2DRenderer.npc2D.removeDeadNPCs();
            }
            
            if (beforeCount !== afterCount) {
                console.log(`Cleaned up ${beforeCount - afterCount} dead NPCs (${afterCount} remaining)`);
                // Sync to localStorage after cleanup so dev mode sees the changes
                if (typeof saveNPCsToStorage === 'function') {
                    saveNPCsToStorage(game.npcs);
                }
            }
        }
        
        // Render 2D map
        if (game.map2DRenderer) {
            game.map2DRenderer.render();
        }
        
        // Draw floor/background
        if (game.floor) {
            game.floor.render(game.ctxNPC, W, H);
        } else {
            // Fallback if floor module not initialized
            game.ctxNPC.fillStyle = '#000000';
            game.ctxNPC.fillRect(0, 0, W, H);
        }
        
        // Update and collect NPC render data
        const renderData = [];
        for (let npc of game.npcs) {
            if (!npc) continue; // Skip null/undefined NPCs
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
        
        // Render NPCs (only if there are any to render)
        if (renderData.length > 0) {
            if (npcImageLoaded) {
                // Render NPCs as images
                for (let data of renderData) {
                    const imageSize = data.scale * 2; // Scale the image based on distance
                    game.ctxNPC.drawImage(
                        npcImage,
                        data.x - imageSize / 2,
                        data.y - imageSize / 2,
                        imageSize,
                        imageSize
                    );
                }
            } else {
                // Fallback to circles while image loads
                for (let data of renderData) {
                    draw.circle(game.ctxNPC, data.x, data.y, data.scale, data.color);
                }
            }
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
