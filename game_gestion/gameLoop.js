/**
 * Main Game Loop
 * Handles the update and render cycle for the game
 */
function createGameLoop(game, W, H) {
    // Load NPC video for 3D rendering with animation
    const npcVideo = document.createElement('video');
    let npcVideoLoaded = false;
    const npcVideoSpeed = 2.0; // Variable to control video playback speed (1.0 = normal)
    npcVideo.loop = true;
    npcVideo.muted = true;
    npcVideo.playsInline = true;
    npcVideo.playbackRate = npcVideoSpeed;
    
    const npcVideoCandidates = [
        'Ressource/Video_de_Monstre_Sans_Fond.mp4', 
        '../Ressource/Video_de_Monstre_Sans_Fond.mp4'
    ];
    
    const tryLoadNpcVideo = (index) => {
        if (index >= npcVideoCandidates.length) {
            Logger.warn('NPC video not found, using circle fallback');
            return;
        }

        npcVideo.src = npcVideoCandidates[index];
        npcVideo.addEventListener('loadeddata', () => {
            npcVideoLoaded = true;
            npcVideo.playbackRate = npcVideoSpeed; // Apply speed after video is loaded
            npcVideo.pause(); // Start paused, will play when NPCs move
            Logger.info('✓ NPC video loaded (Video_de_Monstre_Sans_Fond.mp4)');
        });
        npcVideo.addEventListener('error', () => {
            tryLoadNpcVideo(index + 1);
        });
        npcVideo.load();
    };

    tryLoadNpcVideo(0);

    // Cache du wrapper de la mini-carte 2D pour pouvoir couper son rendu quand elle est cachée
    const map2DWrapper = document.getElementById('map2d-wrapper');
    
    function gameLoop() {
        const now = performance.now();

        // Update player
        game.player.loop();
        
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
            game.floor.render(game.ctxNPC, W, H, game.player);
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

        // Update NPC positions (movement & AI)
        for (let npc of game.npcs) {
            if (!npc) continue; // Skip null/undefined NPCs
            npc.update(); // Move NPCs toward player with collision detection
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

        // Control video playback based on NPC movement
        if (npcVideoLoaded) {
            let anyNPCMoving = false;
            for (let npc of game.npcs) {
                if (npc && npc.isMoving && !npc.isDead) {
                    anyNPCMoving = true;
                    break;
                }
            }
            
            // Play video when any NPC is moving, pause when all are stationary
            if (anyNPCMoving && npcVideo.paused) {
                npcVideo.play().catch(e => {}); // Silent catch for autoplay restrictions
            } else if (!anyNPCMoving && !npcVideo.paused) {
                npcVideo.pause();
            }
        }
        
        // Render NPCs from far to near, hidden when behind wall columns.
        npcRenderData.sort((a, b) => a.distance - b.distance);
        for (let data of npcRenderData) {
            const sx = Math.floor(data.x);
            if (sx >= 0 && sx < zBuffer.length && data.distance > zBuffer[sx]) {
                continue;
            }

            if (npcVideoLoaded) {
                const imageSize = data.scale * 2;
                // Preserve video aspect ratio
                const videoRatio = npcVideo.videoWidth / npcVideo.videoHeight;
                const imageWidth = imageSize * videoRatio;
                const imageHeight = imageSize;
                
                game.ctxNPC.drawImage(
                    npcVideo,
                    data.x - imageWidth / 2,
                    data.y - imageHeight / 2,
                    imageWidth,
                    imageHeight
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

        if (typeof drawHealthBar === 'function') {
            drawHealthBar(game, W, H);
        }
        
        game.animationId = requestAnimationFrame(gameLoop);
    }
    
    return gameLoop;
}