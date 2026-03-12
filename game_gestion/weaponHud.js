/**
 * Weapon HUD Module
 * Draws crosshair, pistol sprite, muzzle flash and score overlay
 */
const weaponHudAssets = {
    pistolNeutral: null,
    pistolFire: null,
    neutralLoaded: false,
    fireLoaded: false,
    loadFailed: false,
    triedLoading: false
};

function ensureWeaponSpriteLoaded() {
    if (weaponHudAssets.triedLoading) return;

    weaponHudAssets.triedLoading = true;

    const loadWithFallback = (img, label, candidates, onSuccess) => {
        const tryLoad = (index) => {
            if (index >= candidates.length) {
                weaponHudAssets.loadFailed = true;
                return;
            }

            Logger.wrapImageLoad(img, label, candidates[index],
                () => { onSuccess(); },
                () => { tryLoad(index + 1); }
            );
        };

        tryLoad(0);
    };

    const neutralImg = new Image();
    loadWithFallback(
        neutralImg,
        'weapon sprite (neutral)',
        ['Ressource/doom pistol 1.png', '../Ressource/doom pistol 1.png'],
        () => {
            weaponHudAssets.neutralLoaded = true;
            weaponHudAssets.pistolNeutral = neutralImg;
        }
    );

    const fireImg = new Image();
    loadWithFallback(
        fireImg,
        'weapon sprite (fire)',
        ['Ressource/doom pistol 2.png', '../Ressource/doom pistol 2.png'],
        () => {
            weaponHudAssets.fireLoaded = true;
            weaponHudAssets.pistolFire = fireImg;
        }
    );
}

function drawHealthBar(game, W, H) {
    const player = game.player;
    if (!player || !player.hpId) return;

    const currentHp = hp.getHp(player.hpId);
    const maxHp     = hp.getMaxHp(player.hpId);
    if (currentHp === null || maxHp === null) return;

    const ratio   = Math.max(0, currentHp / maxHp);
    const barW    = 200;
    const barH    = 18;
    const x       = 15;
    const y       = H - 36;
    const radius  = 4;

    const ctx = game.ctxNPC;
    ctx.save();

    // Background track
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, radius);
    ctx.fill();

    // Filled portion — colour shifts green→yellow→red as HP drops
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(255 * ratio);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = `rgb(${r},${g},0)`;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(0, barW * ratio), barH, radius);
    ctx.fill();

    // Border
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, radius);
    ctx.stroke();

    // Label
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText(`HP: ${currentHp} / ${maxHp}`, x + barW + 10, y + barH / 2);

    ctx.restore();
}

function drawWeaponCrosshair(game, now) {
    const cx = game.player.hW;
    const cy = game.player.hH;
    const pulse = 1 + (Math.sin(now * 0.02) * 0.08);
    const gap = 8 * pulse;
    const len = 14 * pulse;

    game.ctxNPC.save();
    game.ctxNPC.strokeStyle = '#ffffff';
    game.ctxNPC.lineWidth = 2;
    game.ctxNPC.globalAlpha = 0.9;

    game.ctxNPC.beginPath();
    game.ctxNPC.moveTo(cx - gap - len, cy);
    game.ctxNPC.lineTo(cx - gap, cy);
    game.ctxNPC.moveTo(cx + gap, cy);
    game.ctxNPC.lineTo(cx + gap + len, cy);
    game.ctxNPC.moveTo(cx, cy - gap - len);
    game.ctxNPC.lineTo(cx, cy - gap);
    game.ctxNPC.moveTo(cx, cy + gap);
    game.ctxNPC.lineTo(cx, cy + gap + len);
    game.ctxNPC.stroke();
    game.ctxNPC.restore();
}

function drawWeaponOverlay(game, W, H, now) {
    ensureWeaponSpriteLoaded();

    const centerX = game.player.hW;
    const centerY = game.player.hH;
    const recoilY = game.weapon.recoil;
    const isFiring = now < game.weapon.muzzleFlashUntil;
    const fireAnimMs = game.weapon.fireAnimMs || 90;
    const fireProgress = isFiring ? (1 - ((game.weapon.muzzleFlashUntil - now) / fireAnimMs)) : 0;

    // Doom-like punch: quick downward kick then settle back.
    const shotKick = isFiring ? Math.sin(fireProgress * Math.PI) * 18 : 0;

    const baseWidth = Math.round(W * 0.42);
    const baseHeight = Math.round(baseWidth * 0.75);
    const rightMargin = 14;
    const bottomMargin = -20;
    const stretchX = isFiring ? 1.04 : 1;
    const stretchY = isFiring ? 0.97 : 1;
    const drawWidth = baseWidth * stretchX;
    const drawHeight = baseHeight * stretchY;

    // Keep the weapon anchored bottom-right while allowing recoil motion.
    const drawX = W - rightMargin - drawWidth;
    const drawY = H - bottomMargin - drawHeight + recoilY + shotKick;

    // Approximate muzzle position inside the sprite to align flash with crosshair.
    const muzzleX = drawX + (drawWidth * 0.23);
    const muzzleY = drawY + (drawHeight * 0.25);

    game.ctxNPC.save();

    const activeSprite = isFiring ? weaponHudAssets.pistolFire : weaponHudAssets.pistolNeutral;
    const spriteReady = isFiring ? weaponHudAssets.fireLoaded : weaponHudAssets.neutralLoaded;

    if (spriteReady && activeSprite) {
        game.ctxNPC.imageSmoothingEnabled = false;
        game.ctxNPC.drawImage(
            activeSprite,
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );
    } else {
        // Temporary fallback while sprite loads.
        game.ctxNPC.fillStyle = '#2f2f2f';
        game.ctxNPC.fillRect(drawX, drawY, drawWidth, drawHeight);
    }

    game.ctxNPC.globalAlpha = 0.75;
    game.ctxNPC.fillStyle = '#ffffff';
    game.ctxNPC.font = 'bold 14px Arial';
    game.ctxNPC.fillText(`KILLS: ${game.score.kills}`, 15, 25);
    game.ctxNPC.fillText(`SHOTS: ${game.score.shots}`, 15, 45);
    if (typeof WaveManager !== 'undefined') {
        game.ctxNPC.fillText(`WAVE: ${WaveManager.getWave()}`, 15, 65);
    }

    game.ctxNPC.restore();
}