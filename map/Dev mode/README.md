# Dev Mode

Development tools for testing and debugging the game.

## Files

### devMode.html
The main dev mode interface showing:
- 3D perspective view (top half)
- 2D top-down map (bottom half)
- Dev panel on the right with controls and info

### devMode.js
Provides the DevMode class with functions:
- `spawnNPC()` - Spawn NPC at random position
- `spawnNPCAt(x, y)` - Spawn NPC at specific coordinates
- `clearAllNPCs()` - Remove all NPCs from the game
- `updateNPCCount()` - Update the NPC counter display
- `getCameraInfo()` - Get current camera position and rotation

## Features

### NPC Spawning
- Click "Spawn Random NPC" to add NPCs one at a time
- NPCs spawn at random positions on the map
- View NPC count in real-time
- Clear all NPCs with one click

### Dual Map View
- See both 2D and 3D views simultaneously
- Watch how camera movement affects both views
- Useful for debugging vision cone and perspective projection

### Camera Info
- Real-time display of camera position (x, y)
- Current rotation angle
- Updates every frame

## Usage

### Accessing Dev Mode
Click the "🛠️ Dev Mode" button on the main interface, or navigate directly to:
```
map/Dev mode/devMode.html
```

### Auto-Detection
When dev mode is loaded, the game automatically:
- Detects the `initDevMode` function
- Skips automatic NPC spawning
- Enables manual spawn controls

### Normal Mode
When loading the regular `index.html`:
- Automatically spawns 10 NPCs on start
- Dev mode functions are not loaded
- Standard gameplay

## Technical Notes

- Dev mode shares the same game engine as normal mode
- Both maps render from the same game state
- NPCs are synchronized between views
- All game mechanics (weapon, camera, etc.) work normally in dev mode
