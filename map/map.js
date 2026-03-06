/**
 * Main Game Entry Point
 * Coordinates all game modules and initializes the game
 * 
 * Dependencies (load in this order):
 * 1. helpers.js - Math and drawing utilities
 * 2. camera.js - Camera class
 * 3. npc.js - NPC class
 * 4. gameLoop.js - Main game loop
 */
(function() {
    'use strict';

    const W = window.innerHeight - 20; // Use height for both dimensions to maintain square aspect ratio
    const H = window.innerHeight - 20; // Use height for both dimensions to maintain square aspect ratio
    const hW = W / 2; // half-width and half-height for centering
    const hH = H / 2; // half-width and half-height for centering
    const TSPEED = 3; // turning speed
    const WSPEED = 5; // walking speed

    // Game state
    const game = {
        canvas2D: null,
        ctx2D: null,
        canvasNPC: null,
        ctxNPC: null,
        camera: null,
        npcs: [],
        map2DRenderer: null,
        keys: {},
        animationId: null,
        isMouseDown: false,
        score: {
            kills: 0,
            shots: 0
        },
        weapon: null
    };

    // Initialize game
    function init() {
        // Setup canvas for 2D view
        const canvas2D = document.getElementById('target2');
        if (!canvas2D) {
            console.error('Canvas element "target2" not found');
            return;
        }
        canvas2D.width = W;
        canvas2D.height = H;
        game.canvas2D = canvas2D;
        game.ctx2D = canvas2D.getContext('2d');
        
        // Setup canvas for NPC 3D view
        const canvasNPC = document.getElementById('target');
        if (!canvasNPC) {
            console.error('Canvas element "target" not found');
            return;
        }
        canvasNPC.width = W;
        canvasNPC.height = H;
        game.canvasNPC = canvasNPC;
        game.ctxNPC = canvasNPC.getContext('2d');
        
        // Preload background image
        console.log('Loading background image...');
        const bgImage = new Image();
        bgImage.onload = () => {
            console.log('Background image loaded successfully!');
            game.backgroundImage = bgImage;
            startGame();
        };
        bgImage.onerror = (e) => {
            console.error('Failed to load background image:', e);
            console.log('Starting game without background');
            game.backgroundImage = null;
            startGame();
        };
        bgImage.src = 'black_bg_test.jpg';
    }
    
    function startGame() {
        // Create camera (from camera.js)
        game.camera = new Camera(game, W, H, hW, hH, TSPEED, WSPEED);

        // Initialize isolated weapon modules when present.
        if (typeof createWeaponState === 'function') {
            game.weapon = createWeaponState();
        }

        if (typeof setupWeaponInput === 'function') {
            setupWeaponInput(game);
        }
        
        // Initialize 2D map renderer (from 2D map folder)
        game.map2DRenderer = new Map2DRenderer(game);
        game.map2DRenderer.init();
        
        // Create NPCs (from npc.js)
        for (let i = 0; i < 10; i++) {
            const npc = new NPC(game, i, undefined, undefined, W, H, hH);
            game.npcs.push(npc);
            game.map2DRenderer.addNPC(npc); // Register NPC for 2D rendering
        }
        
        // Start game loop (from gameLoop.js)
        const gameLoop = createGameLoop(game, W, H);
        gameLoop();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose game for debugging
    window.game = game;
})();