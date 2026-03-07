/**
 * Main Game Loop
 * Handles the update and render cycle for the game
 */
function createGameLoop(game, W, H) {
    // Load NPC image for 3D rendering
    const npcImage = new Image();
    let npcImageLoaded = false;

    const npcImageCandidates = ['Ressource/ugly.png', '../Ressource/ugly.png'];
    const tryLoadNpcImage = (index) => {
        if (index >= npcImageCandidates.length) {
            Logger.warn('NPC image not found, using circle fallback');
            return;
        }

        Logger.wrapImageLoad(npcImage, 'NPC 3D image (ugly.png)', npcImageCandidates[index],
            () => { npcImageLoaded = true; },
            () => { tryLoadNpcImage(index + 1); }
        );
    };

    tryLoadNpcImage(0);

    // Cache du wrapper de la mini-carte 2D pour pouvoir couper son rendu quand elle est cachée
    const map2DWrapper = document.getElementById('map2d-wrapper');
    
    function gameLoop() {
        const now = performance.now();

        // Update camera
        game.camera.loop();
        
        // Clean up dead NPCs periodically (every ~100 frames = ~1.6 seconds at 60fps)
        if (!gameLoop.frameCount) gameLoop.frameCount = 0;
        gameLoop.frameCount++;
        if (gameLoop.frameCount % 100 === 0) {
            const beforeCount = game.npcs.length;
            game.npcs = game.npcs.filter(npc => !npc.isDead);
            const afterCount = game.npcs.length;
            
            // Also clean up 2D renderer
            if (game.map2DRenderer && game.map2DRenderer.npc2D) {
                game.map2DRenderer.npc2D.removeDeadNPCs();
            }
            
            if (beforeCount !== afterCount) {
                Logger.npcs.cleanedUp(beforeCount - afterCount, afterCount);
            }
        }
        
        // Render 2D map uniquement si son wrapper est visible
        if (game.map2DRenderer && (!map2DWrapper || map2DWrapper.style.display !== 'none')) {
            game.map2DRenderer.render();
        }
        
        // Draw sky/floor first
        if (game.floor) {
            game.floor.render(game.ctxNPC, W, H, game.camera);
        } else {
            // Fallback if floor module not initialized
            game.ctxNPC.fillStyle = '#000000';
            game.ctxNPC.fillRect(0, 0, W, H);
        }

        // Render walls via raycasting and keep a depth buffer for sprites.
        let zBuffer = new Array(W).fill(Infinity);
        if (typeof renderRaycastWalls === 'function') {
            zBuffer = renderRaycastWalls(game, game.ctxNPC, W, H);
        }

        // Update and collect NPC render data
        const npcRenderData = [];
        for (let npc of game.npcs) {
            if (!npc) continue; // Skip null/undefined NPCs
            const data = npc.loop();
            if (data) {
                npcRenderData.push(data);
            }
        }

        // Weapon update uses projected NPCs for center-screen hitscan.
        if (game.weapon && typeof updateWeaponSystem === 'function') {
            updateWeaponSystem(game, npcRenderData, now);
        }

        // Render NPCs from far to near, hidden when behind wall columns.
        npcRenderData.sort((a, b) => a.distance - b.distance);
        for (let data of npcRenderData) {
            const sx = Math.floor(data.x);
            if (sx >= 0 && sx < zBuffer.length && data.distance > zBuffer[sx]) {
                continue;
            }

            if (npcImageLoaded) {
                const imageSize = data.scale * 2;
                game.ctxNPC.drawImage(
                    npcImage,
                    data.x - imageSize / 2,
                    data.y - imageSize / 2,
                    imageSize,
                    imageSize
                );
            } else {
                draw.circle(game.ctxNPC, data.x, data.y, data.scale, data.color);
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