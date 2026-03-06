/**
 * Weapon HUD Module
 * Draws crosshair, pistol sprite, muzzle flash and score overlay
 */
function drawWeaponCrosshair(game, now) {
    const cx = game.camera.hW;
    const cy = game.camera.hH;
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
    const centerX = game.camera.hW;
    const recoilY = game.weapon.recoil;
    const weaponY = H - 95 + recoilY;

    game.ctxNPC.save();

    game.ctxNPC.fillStyle = '#2f2f2f';
    game.ctxNPC.fillRect(centerX - 60, weaponY, 120, 88);

    game.ctxNPC.fillStyle = '#4a4a4a';
    game.ctxNPC.fillRect(centerX - 22, weaponY - 46, 44, 50);

    game.ctxNPC.fillStyle = '#6a6a6a';
    game.ctxNPC.fillRect(centerX - 9, weaponY - 72, 18, 28);

    game.ctxNPC.fillStyle = '#1b1b1b';
    game.ctxNPC.fillRect(centerX - 42, weaponY + 12, 84, 12);

    if (now < game.weapon.muzzleFlashUntil) {
        game.ctxNPC.globalAlpha = 0.9;
        game.ctxNPC.fillStyle = '#ffd84d';
        game.ctxNPC.beginPath();
        game.ctxNPC.moveTo(centerX, weaponY - 96);
        game.ctxNPC.lineTo(centerX - 14, weaponY - 72);
        game.ctxNPC.lineTo(centerX + 14, weaponY - 72);
        game.ctxNPC.closePath();
        game.ctxNPC.fill();

        game.ctxNPC.globalAlpha = 0.25;
        game.ctxNPC.fillStyle = '#fff0a0';
        game.ctxNPC.fillRect(0, 0, W, H * 0.35);
    }

    game.ctxNPC.globalAlpha = 0.75;
    game.ctxNPC.fillStyle = '#ffffff';
    game.ctxNPC.font = 'bold 14px Arial';
    game.ctxNPC.fillText(`KILLS: ${game.score.kills}`, 15, 25);
    game.ctxNPC.fillText(`SHOTS: ${game.score.shots}`, 15, 45);

    game.ctxNPC.restore();
}
