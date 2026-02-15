---
layout: default
title: Technical Documentation
---

# 🔧 Doomberg Machine - Technical Documentation

This document provides comprehensive technical information for developers who want to understand, modify, or extend the Doomberg Machine codebase.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Code Structure](#code-structure)
- [Core Systems](#core-systems)
- [Physics Engine](#physics-engine)
- [Game Loop](#game-loop)
- [API Reference](#api-reference)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Deployment](#deployment)

## 🎯 Project Overview

**Doomberg Machine** is a browser-based 2D physics puzzle game built with vanilla JavaScript and the Matter.js physics engine. Players create Rube Goldberg machines to doom an NPC character through physics-based interactions.

### Project Goals
- Provide an intuitive physics sandbox experience
- Maintain simple, readable code structure
- Minimize dependencies (only Matter.js required)
- Ensure cross-browser compatibility
- Create an extensible architecture for future enhancements

## 🛠️ Technology Stack

### Core Technologies
- **HTML5**: Structure and Canvas API for rendering
- **CSS3**: Styling with modern features (Flexbox, animations, gradients)
- **JavaScript (ES6+)**: Game logic and interaction handling
- **Matter.js v0.20.0**: 2D physics engine

### Development Tools
- **npm**: Package management
- **Git**: Version control
- **Any modern web browser**: Chrome, Firefox, Safari, Edge

### Runtime Requirements
- Modern web browser with ES6 support
- JavaScript enabled
- HTML5 Canvas support
- Minimum 1280x720 resolution recommended

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────┐
│         User Interface              │
│  (HTML/CSS - Controls & Canvas)     │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Game Controller (game.js)      │
│  - Event Handling                   │
│  - State Management                 │
│  - Object Placement                 │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│    Physics Engine (Matter.js)       │
│  - Body Simulation                  │
│  - Collision Detection              │
│  - Constraint System                │
└─────────────────────────────────────┘
```

### Design Patterns Used

1. **Module Pattern**: Self-contained game initialization
2. **Observer Pattern**: Event-driven collision detection
3. **Factory Pattern**: Object creation in `placeObject()`
4. **State Machine**: Game state management (ready/running/doomed)

## 📁 Code Structure

### File Organization

```
Doomberg-Machine/
├── index.html          # Main HTML structure
├── style.css           # All styling and animations
├── game.js             # Game logic and physics integration
├── matter.min.js       # Matter.js physics engine (minified)
├── package.json        # Project metadata and dependencies
├── README.md           # User-facing documentation
└── docs/              # GitHub Pages documentation
    ├── gameplay.md    # Player guide
    ├── technical.md   # This file
    ├── architecture.md # Design documentation
    └── gameplan.md    # Enhancement roadmap
```

### Key Files

#### `index.html`
- Semantic HTML5 structure
- Responsive container layout
- Canvas element for game rendering
- Control panels and status displays
- Script loading order (Matter.js → game.js)

#### `style.css`
- Modern CSS3 features
- Responsive design with media queries
- Gradient backgrounds and animations (used for UI, NOT for canvas element)
- Accessibility features (focus states)
- Component-based organization
- **Important**: Canvas element (`#gameCanvas`) should NOT have CSS background property

#### `game.js`
- Core game logic (431 lines)
- Matter.js integration
- Event handling system
- Object placement and management
- State management

## 🎮 Core Systems

### 1. Initialization System

```javascript
function init() {
    // Engine creation
    // Renderer setup
    // World initialization
    // Static objects (ground, walls)
    // NPC creation
    // Event listener setup
    // Collision detection registration
}
```

**Key Responsibilities**:
- Create Matter.js engine and renderer
- Set up physics world with gravity
- Initialize game boundaries (ground, walls)
- Create and position the NPC
- Register all event listeners
- Start the renderer

### 2. Object Placement System

```javascript
function placeObject(type, x, y) {
    // Factory pattern for creating different object types
    // Store original position for reset functionality
    // Add to physics world
    // Track in placedObjects array
}
```

**Supported Object Types**:
- `ball`: Circle body with high restitution
- `box`: Rectangle body with medium density
- `domino`: Tall thin rectangle, easily toppled
- `ramp`: Static angled platform (rotatable)
- `platform`: Static horizontal ledge
- `seesaw`: Compound body with pivot constraint

### 3. State Management

**Game States**:
- **Ready**: Awaiting player input, objects can be placed
- **Running**: Physics simulation active, no new placements
- **Doomed**: NPC has been hit with sufficient force

**State Variables**:
```javascript
let isRunning = false;      // Physics simulation status
let isPaused = false;       // Pause state (timeScale = 0)
let isSlowMotion = false;   // Slow-motion state (timeScale = 0.25)
let isGridEnabled = false;  // Grid overlay and snap-to-grid state
let npcDoomed = false;      // Victory condition flag
let selectedTool = null;    // Currently selected object type
let placedObjects = [];     // Array of placed body references
let placedConstraints = []; // Array of constraint references
```

### 4. Collision Detection System

```javascript
Events.on(engine, 'collisionStart', (event) => {
    // Check if NPC is involved in collision
    // Verify sufficient velocity for "doom"
    // Trigger doom sequence if conditions met
});
```

**Doom Criteria**:
- NPC body is involved in collision
- Impacting object velocity > 2 units
- NPC not already doomed (prevents duplicate triggers)

**Velocity Calculation**:
```javascript
const velocity = Math.abs(otherBody.velocity.x) + Math.abs(otherBody.velocity.y);
```

### 5. Playback Control System

**Simulation Speed Control**:
- Uses Matter.js `engine.timing.timeScale` to control simulation speed
- Three states: Normal (1.0), Slow-motion (0.25), Paused (0)
- State managed by `isPaused` and `isSlowMotion` boolean flags

**Speed Calculation**:
```javascript
function applyTimeScale() {
    if (isPaused) {
        engine.timing.timeScale = 0;           // Paused
    } else if (isSlowMotion) {
        engine.timing.timeScale = 0.25;        // 25% speed
    } else {
        engine.timing.timeScale = 1.0;         // Normal speed
    }
}
```

**Features**:
- Pause/Resume: Space key or button click
- Slow-motion: Toggle button (25% speed)
- Can queue slow-motion while paused (applies on resume)
- Context-aware status messages

### 6. Reset System

**Reset Functionality**:
- Stops the physics runner
- Removes and recreates NPC
- Restores all dynamic objects to original positions
- Clears velocities and angular momentum
- Resets angle to original orientation
- Resets playback state (isPaused, isSlowMotion)
- Re-enables UI controls

**Original Position Storage**:
```javascript
body.originalPosition = { x: body.position.x, y: body.position.y };
body.originalAngle = body.angle;
```

## ⚙️ Physics Engine

### Matter.js Integration

**Engine Configuration**:
```javascript
engine = Engine.create();
world = engine.world;
world.gravity.y = 1;  // Standard gravity
```

**Renderer Configuration**:
```javascript
render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: 1200,        // CANVAS_WIDTH
        height: 600,        // CANVAS_HEIGHT
        wireframes: false,
        background: '#87CEEB'  // Matter.js handles background fill
    }
});
```

**Grid Constants**:
- **`GRID_SIZE`**: 40 pixels - Grid cell size for overlay and snap-to-grid

**Important**: The canvas element should NOT have a CSS background as it will render over the canvas drawing context. Matter.js's `background` option fills the canvas properly before rendering physics bodies.

### Physics Properties

#### Density
- **Ball**: 0.04 (lightweight, rolls easily)
- **Box**: 0.05 (heavier, more impact)
- **Domino**: 0.05 (balanced for toppling)
- **Seesaw Plank**: 0.05 (balanced pivot)

#### Restitution (Bounciness)
- **Ball**: 0.8 (very bouncy)
- **Box**: 0.3 (moderate bounce)
- **Domino**: 0.1 (minimal bounce)

#### Static vs Dynamic Bodies
- **Static**: ramp, platform, pivot (don't move, infinite mass)
- **Dynamic**: ball, box, domino, seesaw plank (affected by physics)

#### NPC Positioning Constants
The NPC is positioned to stand on the ground from initialization to prevent physics phase-through issues:
- **`NPC_LEG_OFFSET`**: 35 pixels - Distance from NPC body center to leg center
- **`NPC_HALF_LEG_HEIGHT`**: 10 pixels - Half the height of NPC legs
- **Positioning calculation**: 
  ```javascript
  const groundTop = CANVAS_HEIGHT - GROUND_HEIGHT;  // 580
  const npcY = groundTop - NPC_LEG_OFFSET - NPC_HALF_LEG_HEIGHT;  // 535
  ```
- This ensures NPC feet are placed at ground level (y=580) when created, preventing the NPC from falling through the ground when made dynamic

### Constraints

**Seesaw Constraint**:
```javascript
const constraint = Matter.Constraint.create({
    bodyA: pivot,      // Static pivot point
    bodyB: plank,      // Dynamic plank
    length: 0,         // Zero length = fixed rotation point
    stiffness: 0.9     // High stiffness for realistic pivot
});
```

## 🔄 Game Loop

### Rendering Loop

Matter.js handles the game loop internally through the Runner and Renderer:

```javascript
// Continuous rendering (always active)
Render.run(render);

// Physics simulation (activated on "Run Machine")
Runner.run(runner, engine);
```

**Frame Rate**: 60 FPS (Matter.js default)

**Update Order**:
1. Process user input events
2. Update physics simulation (when running)
3. Detect collisions
4. Update visual representation
5. Render frame

## 📚 API Reference

### Core Functions

#### `init()`
Initializes the game engine, renderer, world, and event listeners.
- **Called**: On window load
- **Returns**: void

#### `createNPC()`
Creates the NPC as a compound body with multiple parts positioned on the ground.
- **Returns**: void
- **Side Effects**: Sets global `npc` variable
- **Positioning**: NPC is placed directly on ground surface to prevent physics phase-through
  - Ground top = `CANVAS_HEIGHT - GROUND_HEIGHT` = 580
  - NPC Y = `groundTop - NPC_LEG_OFFSET - NPC_HALF_LEG_HEIGHT` = 545
  - This ensures NPC feet touch the ground when simulation starts

#### `placeObject(type, x, y)`
Factory function for creating and placing game objects.
- **Parameters**:
  - `type` (string): Object type identifier
  - `x` (number): X coordinate
  - `y` (number): Y coordinate
- **Returns**: void
- **Side Effects**: Adds body to world and tracking arrays, records action in history

#### `deleteObjectAtPosition(x, y)`
Deletes object at specified position using Matter.js Query.
- **Parameters**:
  - `x` (number): X coordinate
  - `y` (number): Y coordinate
- **Returns**: void
- **Side Effects**: Removes body from world, records deletion action for undo
- **Special Handling**: Properly removes seesaws (both bodies and constraints)

#### `undo()`
Reverts the most recent action in history.
- **Preconditions**: `!isRunning && historyIndex >= 0`
- **Returns**: void
- **Side Effects**: Reverts action, decrements history index, updates buttons
- **Supports**: Placement undo (removes objects), deletion undo (restores objects)

#### `redo()`
Re-applies a previously undone action.
- **Preconditions**: `!isRunning && historyIndex < actionHistory.length - 1`
- **Returns**: void
- **Side Effects**: Applies action, increments history index, updates buttons

#### `recordAction(action)`
Records an action in the history for undo/redo.
- **Parameters**: `action` (object): Action object with type, objectType, position, etc.
- **Returns**: void
- **Side Effects**: Adds to actionHistory, clears future history, updates buttons

#### `updateUndoRedoButtons()`
Updates the enabled/disabled state of undo/redo buttons.
- **Returns**: void
- **Side Effects**: Enables/disables buttons based on history state and isRunning

#### `runMachine()`
Activates physics simulation and makes NPC dynamic.
- **Preconditions**: `!isRunning`
- **Returns**: void
- **Side Effects**: Starts runner, updates state

#### `resetMachine()`
Restores all objects to original positions.
- **Preconditions**: `isRunning`
- **Returns**: void
- **Side Effects**: Stops runner, resets positions and state

#### `clearAll()`
Removes all placed objects from the world.
- **Returns**: void
- **Side Effects**: Empties tracking arrays, clears undo/redo history, calls reset if running

#### `deleteObjectAtPosition(x, y)`
Finds and deletes the object at the specified canvas position.
- **Parameters**: 
  - `x` (number): Canvas x-coordinate
  - `y` (number): Canvas y-coordinate
- **Returns**: void
- **Side Effects**: Calls `deleteObject()` if body found

#### `deleteObject(body)`
Removes a body from the world, handling compound objects (seesaws).
- **Parameters**: `body` (Body): Matter.js body to delete
- **Returns**: void
- **Side Effects**: Removes body and related constraints, updates arrays and status
- **Notes**: For seesaws, removes both pivot and plank using `seesawId`

#### `doomNPC()`
Triggers the victory condition when NPC is hit.
- **Preconditions**: `!npcDoomed`
- **Returns**: void
- **Side Effects**: Updates UI, changes NPC color, applies force

#### `togglePause()`
Toggles simulation pause state.
- **Preconditions**: `isRunning`
- **Returns**: void
- **Side Effects**: Updates `isPaused`, applies timeScale, updates UI
- **Notes**: Uses `applyTimeScale()` to set `engine.timing.timeScale` to 0 (paused) or appropriate speed

#### `toggleSlowMotion()`
Toggles slow-motion mode (25% speed).
- **Preconditions**: `isRunning`
- **Returns**: void
- **Side Effects**: Updates `isSlowMotion`, applies timeScale if not paused, updates UI
- **Notes**: Can be toggled while paused; takes effect on resume

#### `applyTimeScale()`
Applies appropriate timeScale based on current state.
- **Returns**: void
- **Side Effects**: Sets `engine.timing.timeScale` based on `isPaused` and `isSlowMotion`
- **Logic**: 
  - Paused: `0`
  - Slow-motion (not paused): `0.25`
  - Normal (not paused): `1.0`

#### `toggleGrid()`
Toggles the grid overlay and snap-to-grid functionality.
- **Returns**: void
- **Side Effects**: 
  - Updates `isGridEnabled` state
  - Adds/removes 'active' class from grid button
  - Updates button text (⊞ Grid: ON/OFF)
  - Updates status message
- **Behavior**: When enabled, shows 40px grid overlay and snaps object placement to grid intersections

### Utility Functions

#### `normalizeAngle(angle)`
Normalizes an angle to the range [0, 2π).
- **Parameters**: `angle` (number): Angle in radians
- **Returns**: number - Normalized angle

#### `snapToGrid(x, y)`
Snaps coordinates to the nearest grid intersection when grid is enabled.
- **Parameters**: 
  - `x` (number): X coordinate
  - `y` (number): Y coordinate
- **Returns**: object - `{x: number, y: number}` with snapped or original coordinates
- **Behavior**: If `isGridEnabled` is false, returns original coordinates unchanged
- **Grid Size**: Uses `GRID_SIZE` constant (40px)

#### `drawGrid(context)`
Draws the grid overlay on the canvas.
- **Parameters**: `context` (CanvasRenderingContext2D): Canvas 2D context
- **Returns**: void
- **Behavior**: If `isGridEnabled` is false, does nothing
- **Appearance**: Semi-transparent black lines (rgba(0, 0, 0, 0.1))
- **Pattern**: Draws vertical and horizontal lines at `GRID_SIZE` intervals

#### `rotateRamp(angleChange)`
Updates the current ramp rotation angle.
- **Parameters**: `angleChange` (number): Angle delta in radians
- **Returns**: void
- **Side Effects**: Updates `currentRampAngle`, displays status

#### `updateStatus(message)`
Updates the status display text.
- **Parameters**: `message` (string): Status message
- **Returns**: void

### Event Handlers

#### Mouse Click Handler
```javascript
canvas.addEventListener('click', (event) => {
    // Convert screen coordinates to canvas coordinates
    // Apply snap-to-grid if enabled
    // Call placeObject() with selected tool
});
```

#### Keyboard Handler
```javascript
document.addEventListener('keydown', (event) => {
    // Q: Rotate ramp counter-clockwise
    // E: Rotate ramp clockwise
});
```

#### Button Click Handlers
- Tool selection buttons: Update `selectedTool`
- Run button: Call `runMachine()`
- Reset button: Call `resetMachine()`
- Clear button: Call `clearAll()`

## 🛠️ Development Guide

### Setup Instructions

1. **Clone the repository**:
```bash
git clone https://github.com/MW-GC/Doomberg-Machine.git
cd Doomberg-Machine
```

2. **Install dependencies**:
```bash
npm install
```

3. **Run a local server**:
```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Option 3: PHP
php -S localhost:8080
```

4. **Open in browser**:
Navigate to `http://localhost:8080`

### Adding New Object Types

To add a new object type, follow this pattern:

1. **Add button to HTML** (`index.html`):
```html
<button class="tool-btn" data-tool="spring">🌀 Spring</button>
```

2. **Add case to placeObject()** (`game.js`):
```javascript
case 'spring':
    body = Bodies.circle(x, y, 15, {
        restitution: 1.2,  // Super bouncy!
        density: 0.02,
        render: {
            fillStyle: '#FF00FF'
        }
    });
    break;
```

3. **Test thoroughly**:
- Place multiple instances
- Test physics interactions
- Verify reset functionality
- Check collision detection

### Modifying Physics Parameters

**Gravity Adjustment**:
```javascript
world.gravity.y = 1.5;  // Increase for stronger gravity
```

**Doom Threshold**:
```javascript
if (velocity > 5) {  // Require faster impact
    npcDoomed = true;
    doomNPC();
}
```

**Object Properties**:
```javascript
// Make balls heavier and less bouncy
body = Bodies.circle(x, y, 20, {
    restitution: 0.5,    // Reduce from 0.8
    density: 0.08,       // Increase from 0.04
    render: {
        fillStyle: '#FF6B6B'
    }
});
```

### Coding Conventions

**Naming Conventions**:
- Variables and functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Private helpers: prefix with underscore (convention, not enforced)

**Code Style**:
- 4-space indentation
- Single quotes for strings (where practical)
- Semicolons required
- Comments for complex logic
- JSDoc comments for public functions

**State Management**:
- Store original position/angle on bodies for reset
- Use separate arrays for bodies vs constraints
- Check velocity of impacting object in collisions

### Browser Compatibility

**Supported Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features**:
- ES6 syntax (const, let, arrow functions)
- HTML5 Canvas
- CSS3 Flexbox
- requestAnimationFrame (used by Matter.js)

## 🧪 Testing

### Manual Testing Checklist

**Object Placement**:
- [ ] Each object type can be selected
- [ ] Objects appear at click location
- [ ] Multiple objects can be placed
- [ ] Status updates on placement

**Ramp Rotation**:
- [ ] Q key rotates counter-clockwise
- [ ] E key rotates clockwise
- [ ] Angle displays in status
- [ ] Angle normalizes correctly

**Physics Simulation**:
- [ ] Run button starts simulation
- [ ] Objects interact realistically
- [ ] Gravity affects dynamic objects
- [ ] Static objects remain fixed

**Collision Detection**:
- [ ] Fast impacts doom NPC
- [ ] Slow contacts don't doom NPC
- [ ] Doom triggers only once
- [ ] Visual feedback on doom

**Reset/Clear**:
- [ ] Reset restores positions
- [ ] Reset recreates NPC
- [ ] Clear removes all objects
- [ ] UI updates appropriately

### Performance Testing

**Metrics to Monitor**:
- Frame rate (should maintain 60 FPS)
- Memory usage (check for leaks on reset/clear)
- Object count performance (test with 50+ objects)

**Performance Tips**:
- Limit total objects to ~100 for optimal performance
- Static objects have minimal performance impact
- Complex constraints (like seesaws) are more expensive

## 🚀 Deployment

### GitHub Pages Setup

1. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to Pages section
   - Select source branch (usually `main`)
   - Select root folder

2. **Configure Jekyll** (optional):
Create `_config.yml`:
```yaml
theme: jekyll-theme-cayman
title: Doomberg Machine
description: Build Rube Goldberg machines of doom!
```

3. **Verify Deployment**:
- Check `https://username.github.io/repository-name`
- Ensure all assets load correctly
- Test on mobile devices

### Production Optimization

**Recommended Optimizations**:
1. Minify JavaScript (game.js)
2. Minify CSS (style.css)
3. Optimize image assets (if added)
4. Enable gzip compression on server
5. Add cache headers for static assets

**Build Script Example**:
```json
{
  "scripts": {
    "build": "uglifyjs game.js -o game.min.js",
    "deploy": "npm run build && git push"
  }
}
```

## 🐛 Debugging

### Common Issues

**Issue: Canvas shows background gradient but no game objects**
- Check that canvas element in CSS does NOT have a `background` property
- Matter.js `render.options.background` should be set for proper rendering
- CSS backgrounds render over the canvas drawing context, hiding game content
- Solution: Remove any CSS `background` from `#gameCanvas`

**Issue: NPC disappears when simulation starts**
- Verify NPC is positioned on ground surface, not floating above it
- Check `createNPC()` uses `NPC_LEG_OFFSET` and `NPC_HALF_LEG_HEIGHT` constants
- NPC should be at y=545 (with ground at y=580) for proper ground contact
- If NPC floats and falls, it may phase through ground due to compound body physics

**Issue: Objects fall through ground**
- Check ground body is static
- Verify ground height and position
- Ensure physics engine is running

**Issue: NPC doesn't doom**
- Check collision event listener is registered
- Verify velocity calculation
- Check `npcDoomed` flag isn't stuck

**Issue: Reset doesn't work**
- Ensure originalPosition is stored on placement
- Check runner is stopped
- Verify composite remove/add cycle

**Issue: Canvas coordinates incorrect**
- Verify scaling factors (scaleX, scaleY)
- Check canvas.width vs rect.width
- Test with different viewport sizes

### Debug Tools

**Enable Matter.js Debug Renderer**:
```javascript
render = Render.create({
    // ... other options
    options: {
        wireframes: true,  // Show collision boundaries
        showAngleIndicator: true,
        showVelocity: true
    }
});
```

**Console Logging**:
```javascript
// Log collision events
Events.on(engine, 'collisionStart', (event) => {
    console.log('Collision:', event.pairs);
});

// Log object placement
function placeObject(type, x, y) {
    console.log(`Placing ${type} at (${x}, ${y})`);
    // ... rest of function
}
```

## 📖 Additional Resources

### External Documentation
- [Matter.js Documentation](https://brm.io/matter-js/docs/)
- [Matter.js Examples](https://brm.io/matter-js/)
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)

### Learning Resources
- [Game Development Patterns](http://gameprogrammingpatterns.com/)
- [2D Game Physics](https://www.iforce2d.net/b2dtut/)
- [JavaScript Game Development](https://eloquentjavascript.net/)

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintainers**: MW-GC Team

For questions or contributions, please open an issue on GitHub!
