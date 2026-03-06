/**
 * Weapon System Module
 * Handles pistol state, input, and hitscan targeting
 */
function createWeaponState() {
    return {
        cooldownMs: 420,
        lastShotTime: 0,
        muzzleFlashUntil: 0,
        recoil: 0,
        recoilDamping: 0.78,
        recoilKick: 16
    };
}

function setupWeaponInput(game) {
    if (!game || !game.canvasNPC) return;

    game.canvasNPC.addEventListener('mousedown', () => {
        game.isMouseDown = true;
    });

    document.addEventListener('mouseup', () => {
        game.isMouseDown = false;
    });

    game.canvasNPC.addEventListener('mouseleave', () => {
        game.isMouseDown = false;
    });
}

function selectWeaponTarget(game, renderData) {
    const centerX = game.camera.hW;
    const centerY = game.camera.hH;
    let bestTarget = null;

    for (let i = 0; i < renderData.length; i++) {
        const data = renderData[i];
        const dx = data.x - centerX;
        const dy = data.y - centerY;
        const radialDistance = Math.sqrt((dx * dx) + (dy * dy));

        if (radialDistance <= data.scale) {
            if (!bestTarget || data.distance < bestTarget.distance) {
                bestTarget = data;
            }
        }
    }

    return bestTarget;
}

function updateWeaponSystem(game, renderData, now) {
    const triggerPressed = !!game.keys.Space || game.isMouseDown;

    if (game.weapon.recoil > 0.05) {
        game.weapon.recoil *= game.weapon.recoilDamping;
    } else {
        game.weapon.recoil = 0;
    }

    if (!triggerPressed) {
        return;
    }

    if ((now - game.weapon.lastShotTime) < game.weapon.cooldownMs) {
        return;
    }

    game.weapon.lastShotTime = now;
    game.weapon.muzzleFlashUntil = now + 90;
    game.weapon.recoil = game.weapon.recoilKick;
    game.score.shots += 1;

    const target = selectWeaponTarget(game, renderData);
    if (target && target.npc) {
        const killed = target.npc.hit();
        if (killed) {
            game.score.kills += 1;
        }
    }
}
