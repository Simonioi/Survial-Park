# 2D Map Rendering Module

This folder contains all the code related to rendering the 2D top-down map view.

## Files

### camera2D.js
Handles rendering the camera on the 2D map view. Displays:
- Camera position (diamond shape)
- Camera direction (arrow indicator)
- Camera view radius (red circle)

### npc2D.js  
Handles rendering NPC positions on the 2D map as colored circles.

### map2DRenderer.js
Main coordinator for all 2D rendering. Combines camera and NPC rendering into a single render cycle.

## Usage

The 2D map renderer is initialized in `map.js`:

```javascript
// Initialize 2D map renderer
game.map2DRenderer = new Map2DRenderer(game);
game.map2DRenderer.init();

// Register NPCs for 2D rendering
game.map2DRenderer.addNPC(npc);
```

Rendering is called in the game loop (`gameLoop.js`):

```javascript
// Render 2D map
if (game.map2DRenderer) {
    game.map2DRenderer.render();
}
```

## Canvas

The 2D map renders to the `target2` canvas element, which displays the "2D Map View" when the user clicks "Show 2D Map".
