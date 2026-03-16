/**
 * Main Game Loop
 * Handles the update and render cycle for the game
 */
function createGameLoop(game, W, H) {
    // Load NPC video for 3D rendering with animation
    // Gestion multi-monstres : vidéos différentes
    const npcVideos = {
        default: document.createElement('video'),
        SwordRex: document.createElement('video')
    };
    const npcVideoLoaded = {
        default: false,
        SwordRex: false
    };
    const npcVideoSpeed = 2.0;
    const npcVideoSpeeds = {
        default: npcVideoSpeed,
        SwordRex: 1.0 // SwordRex en x1 (test)
    };
    // Config vidéos
    npcVideos.default.loop = true;
    npcVideos.default.muted = true;
    npcVideos.default.playsInline = true;
    npcVideos.default.playbackRate = npcVideoSpeeds.default;
    npcVideos.SwordRex.loop = true;
    npcVideos.SwordRex.muted = true;
    npcVideos.SwordRex.playsInline = true;
    npcVideos.SwordRex.playbackRate = npcVideoSpeeds.SwordRex;

    // Vidéos à charger
    const npcVideoCandidates = {
        default: [
            'Ressource/Video_de_Monstre_Sans_Fond.mp4',
            '../Ressource/Video_de_Monstre_Sans_Fond.mp4'
        ],
        SwordRex: [
            'Ressource/SwordRex.webm',
            '../Ressource/SwordRex.webm'
        ]
    };

    function tryLoadNpcVideo(key, index) {
        const candidates = npcVideoCandidates[key];
        const video = npcVideos[key];
        if (index >= candidates.length) {
            Logger.warn(`NPC video not found for ${key}, using circle fallback`);
            return;
        }
        video.src = candidates[index];
        video.addEventListener('loadeddata', () => {
            npcVideoLoaded[key] = true;
            video.playbackRate = npcVideoSpeeds[key] || npcVideoSpeeds.default;
            video.pause();
            Logger.info(`✓ NPC video loaded (${candidates[index]})`);
        });
        video.addEventListener('error', () => {
            tryLoadNpcVideo(key, index + 1);
        });
        video.load();
    }

    tryLoadNpcVideo('default', 0);
    tryLoadNpcVideo('SwordRex', 0);

    // Cache du wrapper de la mini-carte 2D pour pouvoir couper son rendu quand elle est cachée
    const map2DWrapper = document.getElementById('map2d-wrapper');
    
    function gameLoop() {
        const now = performance.now();

        // Update player
        game.player.loop();

        // Show death screen and halt loop when player dies.
        if (game.player.isDead) {
            cancelAnimationFrame(game.animationId);
            
            // Save game stats for scoreboard
            const kills = (game.score && game.score.kills) ? game.score.kills : 0;
            const wave = (typeof WaveManager !== 'undefined') ? WaveManager.getWave() : 1;
            window.lastGameStats = { kills: kills, wave: wave };
            
            const deathScreen = document.getElementById('death-screen');
            if (deathScreen) deathScreen.style.display = 'flex';
            return;
        }

        // Wave manager - check for next wave.
        if (typeof WaveManager !== 'undefined') {
            WaveManager.update();
        }
        
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

        // Contrôle lecture vidéo pour chaque type de monstre
        for (const key of Object.keys(npcVideos)) {
            if (npcVideoLoaded[key]) {
                let anyMoving = false;
                for (let npc of game.npcs) {
                    if (npc && npc.isMoving && !npc.isDead && ((npc.videoKey || 'default') === key)) {
                        anyMoving = true;
                        break;
                    }
                }
                if (anyMoving && npcVideos[key].paused) {
                    npcVideos[key].play().catch(e => {});
                } else if (!anyMoving && !npcVideos[key].paused) {
                    npcVideos[key].pause();
                }
            }
        }
        
        // Render NPCs from far to near, hidden when behind wall columns.
        npcRenderData.sort((a, b) => a.distance - b.distance);
        for (let data of npcRenderData) {
            const sx = Math.floor(data.x);
            if (sx >= 0 && sx < zBuffer.length && data.distance > zBuffer[sx]) {
                continue;
            }
            // Choix de la vidéo selon le type de monstre
            const key = (data.npc && data.npc.videoKey) ? data.npc.videoKey : 'default';
            if (npcVideoLoaded[key]) {
                const video = npcVideos[key];
                const imageSize = data.scale * 2;
                const videoRatio = video.videoWidth / video.videoHeight;
                const imageWidth = imageSize * videoRatio;
                const imageHeight = imageSize;
                game.ctxNPC.drawImage(
                    video,
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