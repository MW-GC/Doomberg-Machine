---
layout: default
title: Enhancement Gameplan
---

# 🎯 Doomberg Machine - Enhancement Gameplan

This document outlines potential improvements, fixes, and enhancements for the Doomberg Machine project. Items are categorized by type and priority.

## 📋 Current State Assessment

### ✅ What's Working Well

1. **Core Gameplay Loop**: Placing objects → Running simulation → Doom detection works smoothly
2. **Physics Engine**: Matter.js integration is solid and performant
3. **User Interface**: Clean, intuitive controls with good visual feedback
4. **Code Quality**: Readable, well-organized, maintainable code
5. **Documentation**: Comprehensive docs for users and developers
6. **Accessibility**: Keyboard controls and focus states implemented
7. **Browser Compatibility**: Works across modern browsers
8. **Performance**: Maintains 60 FPS with reasonable object counts

### ⚠️ Areas for Improvement

1. **User Experience Gaps**
   - No undo functionality
   - Can't move objects after placement
   - No save/load system
   - Limited visual feedback for object properties
   - No tutorial or hints system

2. **Gameplay Limitations**
   - Only 6 object types
   - No progression or difficulty curve
   - No scoring or challenge system
   - Single static level
   - No replay functionality

3. **Technical Debt**
   - Single monolithic game.js file
   - Global state management
   - No automated tests
   - No build/minification process
   - Matter.js is committed (should be npm dependency)

4. **Polish Gaps**
   - No sound effects or music
   - Limited particle effects
   - No celebration animations
   - Basic color scheme could be more dynamic
   - Missing loading states

## 🎯 Enhancement Categories

### 🚀 High Priority (Quick Wins)

These improvements offer high value with relatively low effort.

#### 1. Undo/Redo System ✅ **IMPLEMENTED**
**Priority**: High  
**Effort**: Medium  
**Value**: High  
**Status**: ✅ Completed (February 2026)

**Description**: Allow players to undo/redo object placements and deletions

**Implementation**:
```javascript
let actionHistory = [];
let historyIndex = -1;

function recordAction(action) {
    // Clear future history when making new action
    actionHistory = actionHistory.slice(0, historyIndex + 1);
    actionHistory.push(action);
    historyIndex++;
    updateUndoRedoButtons();
}

function undo() {
    if (isRunning || historyIndex < 0) return;
    const action = actionHistory[historyIndex];
    revertAction(action);
    historyIndex--;
    updateUndoRedoButtons();
}

function redo() {
    if (isRunning || historyIndex >= actionHistory.length - 1) return;
    historyIndex++;
    const action = actionHistory[historyIndex];
    applyAction(action);
    updateUndoRedoButtons();
}
```

**UI Changes**:
- ✅ Added "↶ Undo" and "↷ Redo" buttons
- ✅ Keyboard shortcuts: Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z
- ✅ Buttons auto-enable/disable based on history state
- ✅ Right-click deletion with undo support

**Features Delivered**:
- Full undo/redo for object placement
- Right-click to delete objects (bonus feature)
- Undo/redo of deletions
- Support for complex objects (seesaws with constraints)
- Smart button state management
- Keyboard shortcuts
- Status message updates

**Benefits**:
- ✅ Reduces frustration from misclicks
- ✅ Encourages experimentation
- ✅ Professional feel
- ✅ Improved user experience

---

#### 2. Object Deletion ✅ **IMPLEMENTED**
**Priority**: High  
**Effort**: Low  
**Value**: High  
**Status**: ✅ Completed (February 2026) - Implemented as part of Undo/Redo system

**Description**: Allow deletion of individual objects

**Implementation**:
- ✅ Right-click on objects to delete them
- ✅ Uses Matter.js Query.point() to find body at cursor
- ✅ Properly handles complex objects (seesaws)
- ✅ Integrates with undo/redo system

**Code Changes**:
```javascript
function deleteObjectAtPosition(x, y) {
    const bodies = Matter.Query.point(placedObjects, { x, y });
    if (bodies.length > 0) {
        const body = bodies[0];
        // Record deletion for undo
        recordAction({ type: 'delete', ... });
        // Remove object
        Composite.remove(world, body);
        placedObjects = placedObjects.filter(obj => obj !== body);
    }
}

// Right-click handler
canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (isRunning) return;
    const x = /* scaled mouse coordinates */;
    const y = /* scaled mouse coordinates */;
    deleteObjectAtPosition(x, y);
});
```

**Benefits**:
- ✅ Fine-tune contraptions without starting over
- ✅ Less frustration
- ✅ More iterative design process
- ✅ Natural right-click interaction pattern

---

#### 3. Object Counter Display
**Priority**: Medium  
**Effort**: Low  
**Value**: Medium

**Description**: Show count of placed objects

**Implementation**:
```javascript
function updateObjectCounter() {
    const counter = document.getElementById('objectCounter');
    counter.textContent = `Objects: ${placedObjects.length}`;
}
```

**UI Addition**:
```html
<div id="objectCounter" class="object-counter">Objects: 0</div>
```

**Benefits**:
- Helps players track complexity
- Enables challenge modes (beat level with X objects)
- Provides useful feedback

---

#### 4. Grid/Snap Toggle ✅ **IMPLEMENTED**
**Priority**: Medium  
**Effort**: Medium  
**Value**: Medium  
**Status**: ✅ Completed (February 2026)

**Description**: Optional grid overlay with snap-to-grid placement for precise object positioning

**Implementation**:
```javascript
let isGridEnabled = false;
const GRID_SIZE = 40; // Grid cell size in pixels

function snapToGrid(x, y) {
    if (!isGridEnabled) return { x, y };
    return {
        x: Math.round(x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(y / GRID_SIZE) * GRID_SIZE
    };
}

function drawGrid(context) {
    if (!isGridEnabled) return;
    // Draw vertical and horizontal grid lines
    context.strokeStyle = GRID_LINE_COLOR;
    context.lineWidth = 1;
    // ... grid rendering logic
}

function toggleGrid() {
    isGridEnabled = !isGridEnabled;
    updateStatus(isGridEnabled ? 'Grid: ON' : 'Grid: OFF');
    const btn = document.getElementById('gridToggleBtn');
    btn.classList.toggle('active');
    btn.textContent = isGridEnabled ? '⊞ Grid: ON' : '⊞ Grid: OFF';
}
```

**Features Delivered**:
- ✅ Toggle button to enable/disable grid (⊞ icon)
- ✅ Visual grid overlay with 40x40 pixel cells
- ✅ Snap-to-grid placement when enabled
- ✅ Subtle gray grid lines (rgba(0, 0, 0, 0.1))
- ✅ Button shows active state with styling
- ✅ Status message updates
- ✅ Grid renders after each physics frame using afterRender event

**UI Changes**:
- ✅ Added "⊞ Grid: OFF" / "⊞ Grid: ON" toggle button
- ✅ Button highlights when grid is active
- ✅ Grid overlay drawn on canvas

**Benefits**:
- ✅ More precise object placement
- ✅ Easier to align objects vertically and horizontally
- ✅ Professional contraption designs
- ✅ Better spatial planning
- ✅ Optional (can be toggled on/off)

---

#### 5. Pause/Slow Motion
**Priority**: Medium  
**Effort**: Low  
**Value**: Medium

**Description**: Pause or slow down simulation to observe physics

**Implementation**:
```javascript
function pauseSimulation() {
    engine.timing.timeScale = 0;
}

function slowMotion() {
    engine.timing.timeScale = 0.25; // 25% speed
}

function normalSpeed() {
    engine.timing.timeScale = 1.0;
}
```

**UI Changes**:
- Add "⏸️ Pause" / "▶️ Play" button
- Add "🐌 Slow-Mo" button
- Keyboard: Spacebar to pause/unpause

**Benefits**:
- Better observation of complex interactions
- Screenshot opportunities
- Educational value

---

### 🎨 Medium Priority (Feature Additions)

These features add significant value but require more effort.

#### 6. More Object Types ✅ **IMPLEMENTED**
**Priority**: Medium  
**Effort**: Medium per object  
**Value**: High  
**Status**: ✅ Completed (February 2026)

**Description**: Expand object variety with new physics-based objects

**Implemented Objects**:

**Spring** 🌀 ✅
```javascript
case 'spring':
    body = Bodies.circle(x, y, 15, {
        restitution: 1.5,  // Super bouncy
        density: 0.01,
        render: { fillStyle: '#FF00FF' }
    });
    break;
```
- Super-bouncy object with above-unity restitution
- Creates dynamic chain reactions
- Purple color for easy identification

**Explosive** 💣 ✅
```javascript
case 'explosive':
    body = Bodies.circle(x, y, 20, {
        isStatic: false,
        density: 0.05,
        render: { fillStyle: '#FF4500' },
        label: 'explosive'
    });
    // Detonates on collision with sufficient force
    break;
```
- Explodes when hit with velocity > 1
- Applies radial force to nearby objects
- Uses `applyExplosionForce()` for realistic blast physics
- Orange color for explosion effect

**Features Delivered**:
- ✅ Spring object with 1.5 restitution coefficient
- ✅ Explosive object with collision-triggered detonation
- ✅ Radial explosion force applied to nearby objects
- ✅ Visual feedback (color change on detonation)
- ✅ Proper cleanup and removal after detonation
- ✅ Integration with undo/redo system
- ✅ Save/load support for new object types

**Benefits**:
- ✅ Increased creative possibilities
- ✅ More complex contraption designs
- ✅ Enhanced gameplay variety
- ✅ Chain reaction opportunities

**Future Object Ideas** (Not in this phase):
- Fan 💨 - Force field to push objects
- Rope/Chain ⛓️ - Flexible connected segments
- Portal 🌀 - Teleportation between two points

---

#### 7. Level System
**Priority**: Medium  
**Effort**: High  
**Value**: High

**Description**: Pre-designed levels with specific challenges

**Level Structure**:
```javascript
const levels = [
    {
        id: 1,
        name: "Getting Started",
        npcPosition: { x: 1100, y: 500 },
        obstacles: [],
        objectives: {
            doomNPC: true,
            maxObjects: null,
            timeLimit: null
        },
        hints: ["Try placing a ball above the NPC"]
    },
    {
        id: 2,
        name: "The Gap",
        npcPosition: { x: 1100, y: 500 },
        obstacles: [
            { type: 'wall', x: 800, y: 300, width: 20, height: 400 }
        ],
        objectives: {
            doomNPC: true,
            maxObjects: 10,
            timeLimit: 15
        }
    }
    // ... more levels
];
```

**UI Changes**:
- Level selection menu
- Progress tracking
- Star rating system (3 stars for perfect completion)
- Unlock progression

**Benefits**:
- Structured progression
- Clear goals
- Replayability
- Tutorial integration

---

#### 8. Save/Load System ✅ **IMPLEMENTED**
**Priority**: Medium  
**Effort**: Medium  
**Value**: High  
**Status**: ✅ Completed (February 2026)

**Description**: Save contraption designs and load them later

**Implementation Delivered**:

**LocalStorage Implementation** ✅
```javascript
function saveContraption(name) {
    const design = {
        version: 1,
        timestamp: Date.now(),
        name: name,
        objects: placedObjects.map(obj => ({
            type: getObjectType(obj),
            x: obj.position.x,
            y: obj.position.y,
            angle: obj.angle
        }))
    };
    localStorage.setItem(`doomberg_${name}`, JSON.stringify(design));
}

function loadContraption(name) {
    const data = localStorage.getItem(`doomberg_${name}`);
    if (data) {
        const design = JSON.parse(data);
        clearAll();
        design.objects.forEach(objData => {
            placeObject(objData.type, objData.x, objData.y);
            // Restore angles for ramps
        });
    }
}
```

**Features Delivered**:
- ✅ Save designs with custom names (up to 30 characters)
- ✅ Load previously saved designs
- ✅ List all saved designs in dropdown menu
- ✅ Delete saved designs with confirmation
- ✅ Handles complex objects (seesaws with constraints)
- ✅ Saves and restores ramp rotation angles
- ✅ Enter key shortcut for quick saving
- ✅ Error handling for storage quota and corrupted data
- ✅ Status messages for all operations
- ✅ Complete documentation in gameplay.md and technical.md

**UI Changes**:
- ✅ Added "Save/Load" control group
- ✅ Text input for design name
- ✅ Save, Load, and Delete buttons
- ✅ Dropdown showing all saved designs
- ✅ Consistent styling with existing UI

**Benefits Achieved**:
- ✅ Share design names with others
- ✅ Build complex machines over multiple sessions
- ✅ Backup favorite contraptions
- ✅ Community sharing potential (by name)
- ✅ Persistent storage across browser sessions
- ✅ Easy iteration and experimentation

**Future Enhancements** (Not in this PR):
- URL Encoding: Share designs via links (Option B)
- File Export/Import: Download/upload JSON files (Option C)
- Cloud sync: Store designs on server
- Design thumbnails: Visual preview in dropdown

---

#### 9. Replay/Playback System
**Priority**: Medium  
**Effort**: High  
**Value**: Medium

**Description**: Record and replay simulation runs

**Implementation**:
```javascript
let recording = [];

function recordFrame() {
    const frame = {
        time: engine.timing.timestamp,
        bodies: placedObjects.map(obj => ({
            id: obj.id,
            position: { ...obj.position },
            angle: obj.angle,
            velocity: { ...obj.velocity }
        }))
    };
    recording.push(frame);
}

function playback() {
    let frameIndex = 0;
    const interval = setInterval(() => {
        if (frameIndex >= recording.length) {
            clearInterval(interval);
            return;
        }
        applyFrame(recording[frameIndex]);
        frameIndex++;
    }, 1000 / 60);
}
```

**Benefits**:
- Share successful runs
- Study physics interactions
- Create GIFs/videos easily
- Debugging complex contraptions

---

#### 10. Scoring System ✅ **IMPLEMENTED**
**Priority**: Medium  
**Effort**: Medium  
**Value**: Medium  
**Status**: ✅ Completed (February 2026)

**Description**: Score contraptions based on various metrics

**Implementation**:

**Scoring Metrics Implemented**:
```javascript
function calculateScore() {
    let score = 0;
    
    // Base doom score
    if (npcDoomed) score += 1000;
    
    // Efficiency bonus (fewer objects = higher score)
    const objectBonus = Math.max(0, 500 - ((placedObjects.length - 1) * 20));
    score += objectBonus;
    
    // Speed bonus (faster doom = higher score)
    const speedBonus = Math.max(0, 500 - (doomTime * 50));
    score += speedBonus;
    
    // Variety bonus (different object types used)
    const uniqueTypes = objectTypesUsed.size;
    score += uniqueTypes * 100;
    
    // Combo multiplier (chain reactions)
    let comboMultiplier = 1.0;
    if (collisionCount >= 5) {
        comboMultiplier = 1.1 + Math.min((collisionCount - 5) * 0.05, 0.5);
    }
    score = Math.round(score * comboMultiplier);
    
    return score;
}
```

**Star Rating System**:
- ⭐ 1 Star: 0-1,999 points
- ⭐⭐ 2 Stars: 2,000-2,799 points
- ⭐⭐⭐ 3 Stars: 2,800+ points

**Display Implementation**:
- Animated score modal appears 1 second after doom
- Shows star rating with emoji (⭐⭐⭐)
- Large, prominent total score display
- Detailed breakdown table with color-coded values
- "Continue Building" button to dismiss

**Features Delivered**:
- ✅ Tracks object count, completion time, object variety
- ✅ Calculates score based on efficiency, speed, variety, and success
- ✅ Implements combo multipliers for chain reactions
- ✅ Beautiful animated modal with score breakdown
- ✅ Star rating system (1-3 stars)
- ✅ Comprehensive documentation in gameplay.md and technical.md

**Benefits**:
- ✅ Adds challenge and replayability
- ✅ Encourages optimization and experimentation
- ✅ Provides clear performance feedback
- ✅ Foundation for future leaderboards and challenges

---

### 🎭 Polish & UX (Lower Priority but High Impact)

#### 11. Sound Effects ✅ **IMPLEMENTED**
**Priority**: Low  
**Effort**: Medium  
**Value**: High  
**Status**: ✅ Completed (February 2026)

**Description**: Add audio feedback for game actions using Web Audio API

**Implementation**:

**Web Audio API with Oscillator Synthesis**:
```javascript
let soundEnabled = true;
let audioContext = null;

// Initialize audio context with feature detection
try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
        audioContext = new AudioContextClass();
    } else {
        soundEnabled = false;
    }
} catch (e) {
    soundEnabled = false;
    audioContext = null;
}

function playSound(type) {
    if (!soundEnabled || !audioContext) return;
    
    // Resume audio context if suspended (for autoplay policies)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound based on type
    switch(type) {
        case 'place':
            oscillator.frequency.value = 440;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        
        case 'collision':
            oscillator.frequency.value = 220;
            // ... collision sound configuration
            break;
        
        case 'doom':
            oscillator.frequency.value = 110;
            // ... doom sound configuration
            break;
        
        case 'ui':
            oscillator.frequency.value = 880;
            // ... UI sound configuration
            break;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('doomberg_sound_enabled', soundEnabled);
    updateSoundButton();
    updateStatus(soundEnabled ? 'Sound: ON' : 'Sound: OFF');
}

function loadSoundPreference() {
    const saved = localStorage.getItem('doomberg_sound_enabled');
    if (saved !== null) {
        soundEnabled = saved === 'true';
    }
}
```

**Sounds Implemented**:
- ✅ **Object placement**: Quick "plop" sound (440 Hz, 0.1s)
- ✅ **Collision**: Impact sound based on force (220 Hz, variable duration)
  - Rate-limited to 100ms cooldown to prevent audio spam
  - Only plays for impacts with relative velocity > 1.5
- ✅ **Doom**: Dramatic sound effect (110 Hz sweep, 0.8s)
- ✅ **UI interactions**: Click/button sounds (880 Hz, 0.05s)

**Features Delivered**:
- ✅ Web Audio API oscillator-based sound synthesis
- ✅ No external audio files required (procedurally generated)
- ✅ Toggle button to mute/unmute sounds
- ✅ Sound preference persists in localStorage
- ✅ Collision sound rate limiting (prevents spam)
- ✅ Feature detection for browser compatibility
- ✅ Graceful fallback when Web Audio API unavailable
- ✅ Auto-resume for browser autoplay policies
- ✅ Sound button disables when audio unavailable

**UI Changes**:
- ✅ Added "🔊 Sound: ON" / "🔇 Sound: OFF" toggle button
- ✅ Button shows current state with icon and text
- ✅ Button disabled if Web Audio API unavailable
- ✅ Status messages for sound state changes

**Benefits**:
- ✅ Enhanced audio feedback improves user experience
- ✅ No external dependencies or file loading
- ✅ Lightweight implementation
- ✅ Persistent user preference
- ✅ Accessible (can be disabled)
- ✅ Browser-compatible with fallbacks

**Future Audio Enhancements** (Not in this phase):
- Background music with volume control
- More varied collision sounds based on object types
- Explosive detonation sound effect
- Spring bounce sound
- MP3/OGG audio files for richer sounds

---

#### 12. Particle Effects
**Priority**: Low  
**Effort**: Medium  
**Value**: Medium

**Effect Types**:

**Collision Sparks**:
```javascript
function createCollisionParticles(x, y, velocity) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 4 - 2,
            life: 30,
            color: '#FFD700'
        });
    }
}
```

**Doom Explosion**:
```javascript
function doomExplosion() {
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: npc.position.x,
            y: npc.position.y,
            vx: Math.cos(i * Math.PI * 2 / 50) * 5,
            vy: Math.sin(i * Math.PI * 2 / 50) * 5,
            life: 60,
            color: ['#FF0000', '#FF6B6B', '#000000'][i % 3]
        });
    }
}
```

**Trails**:
```javascript
function drawTrail(body) {
    // Keep history of last 10 positions
    // Draw fading line between them
}
```

---

#### 13. Theme System
**Priority**: Low  
**Effort**: Medium  
**Value**: Low

**Themes**:
- **Classic**: Current color scheme
- **Dark Mode**: Dark background, light objects
- **Neon**: Bright fluorescent colors
- **Retro**: Pixel art style
- **Minimalist**: Black & white
- **Holiday**: Seasonal themes

**Implementation**:
```javascript
const themes = {
    classic: {
        background: '#87CEEB',
        ground: '#8B4513',
        ball: '#FF6B6B',
        // ... more colors
    },
    dark: {
        background: '#1a1a2e',
        ground: '#16213e',
        ball: '#e94560',
        // ... more colors
    }
};

function applyTheme(themeName) {
    const theme = themes[themeName];
    render.options.background = theme.background;
    // Update all body colors...
}
```

---

#### 14. Mobile Support
**Priority**: Medium  
**Effort**: High  
**Value**: High

**Challenges**:
- Touch controls vs mouse controls
- Smaller screen size
- Performance on mobile devices
- Object placement precision

**Solutions**:
```javascript
// Touch support
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    handleTouch(touch.clientX, touch.clientY);
});

// Zoom controls for mobile
let zoomLevel = 1.0;
function zoom(delta) {
    zoomLevel += delta;
    render.bounds.min.x *= (1 + delta);
    render.bounds.max.x *= (1 + delta);
    // ... adjust y bounds too
}

// Mobile-specific UI
if (isMobile()) {
    // Larger buttons
    // Simplified controls
    // Toolbar at bottom
}
```

---

### 🔧 Technical Improvements

#### 15. Code Refactoring
**Priority**: Medium  
**Effort**: High  
**Value**: Medium

**Goals**:
- Split game.js into modules
- Implement proper state management
- Add TypeScript types
- Improve separation of concerns

**Proposed Structure**:
```
src/
├── core/
│   ├── engine.js       // Physics engine wrapper
│   ├── state.js        // State management
│   └── constants.js    // Game constants
├── objects/
│   ├── GameObject.js   // Base class
│   ├── Ball.js
│   ├── Box.js
│   └── ...
├── systems/
│   ├── InputSystem.js  // Mouse, keyboard, touch
│   ├── UISystem.js     // UI updates
│   ├── PhysicsSystem.js
│   └── AudioSystem.js
├── utils/
│   ├── math.js
│   └── helpers.js
└── main.js             // Entry point
```

---

#### 16. Automated Testing
**Priority**: Medium  
**Effort**: High  
**Value**: High

**Test Categories**:

**Unit Tests**:
```javascript
describe('normalizeAngle', () => {
    test('normalizes positive angle', () => {
        expect(normalizeAngle(Math.PI * 3)).toBe(Math.PI);
    });
    
    test('normalizes negative angle', () => {
        expect(normalizeAngle(-Math.PI)).toBe(Math.PI);
    });
});
```

**Integration Tests**:
```javascript
describe('placeObject', () => {
    test('creates ball at position', () => {
        placeObject('ball', 100, 100);
        expect(placedObjects.length).toBe(1);
        expect(placedObjects[0].position.x).toBe(100);
    });
});
```

**E2E Tests** (with Playwright):
```javascript
test('complete gameplay flow', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.click('[data-tool="ball"]');
    await page.click('#gameCanvas', { position: { x: 100, y: 100 } });
    await page.click('#runBtn');
    await page.waitForSelector('.doomed');
});
```

---

#### 17. Build System
**Priority**: Low  
**Effort**: Medium  
**Value**: Medium

**Setup**:
```javascript
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "test": "vitest"
  },
  "devDependencies": {
    "vite": "^4.0.0",
    "eslint": "^8.0.0",
    "vitest": "^0.34.0"
  }
}
```

**Benefits**:
- Minification for production
- Module bundling
- Tree-shaking
- Development hot reload
- Automated deployment

---

#### 18. Analytics Integration
**Priority**: Low  
**Effort**: Low  
**Value**: Low

**Metrics to Track**:
- Most used object types
- Average objects per contraption
- Success rate (% of dooms)
- Time to first doom
- Session duration
- Return user rate

**Implementation** (privacy-respecting):
```javascript
// Only track anonymous usage data
function trackEvent(category, action, label) {
    if (analyticsEnabled && userConsent) {
        // Send to analytics service
    }
}

// Examples
trackEvent('object', 'place', 'ball');
trackEvent('game', 'doom', 'success');
```

---

### 🐛 Bug Fixes & Quality

#### 19. Recently Fixed Issues

**✅ Issue: NPC disappears when simulation starts** (Fixed: Feb 2026)
- **Cause**: CSS background gradient on canvas was rendering over canvas content, and NPC was positioned floating above ground causing physics phase-through
- **Fix**: 
  1. Removed CSS `background: linear-gradient(...)` from `#gameCanvas` 
  2. Repositioned NPC to stand directly on ground surface
  3. Extracted positioning constants (`NPC_LEG_OFFSET`, `NPC_HALF_LEG_HEIGHT`) for maintainability
```javascript
// NPC now positioned on ground from start
const groundTop = CANVAS_HEIGHT - GROUND_HEIGHT;
const npcY = groundTop - NPC_LEG_OFFSET - NPC_HALF_LEG_HEIGHT;
```
- **Result**: NPC remains visible throughout gameplay, physics interactions work correctly

---

#### 20. Known Issues

**Issue: Objects sometimes pass through static bodies at high velocity**
- **Cause**: Matter.js tunneling issue
- **Fix**: Enable CCD (Continuous Collision Detection)
```javascript
engine.positionIterations = 10;
engine.velocityIterations = 6;
// Or use smaller time steps
```

**Issue: Reset doesn't perfectly restore complex contraptions**
- **Cause**: Constraint states not fully reset
- **Fix**: Store and restore constraint states
```javascript
constraint.originalStiffness = constraint.stiffness;
// On reset:
constraint.stiffness = constraint.originalStiffness;
```

**Issue: Performance degrades with many objects**
- **Cause**: O(n²) collision detection
- **Fix**: Implement spatial partitioning or limit object count
```javascript
const MAX_OBJECTS = 100;
if (placedObjects.length >= MAX_OBJECTS) {
    alert('Maximum objects reached!');
    return;
}
```

---

#### 21. Accessibility Improvements

**Screen Reader Support**:
- Add ARIA labels to interactive elements
- Announce state changes
- Provide text descriptions of visuals

**Keyboard Navigation**:
- Tab through all controls
- Arrow keys to navigate object selection
- Number keys (1-6) for quick object selection

**Visual Improvements**:
- Higher contrast mode option
- Larger text size option
- Colorblind-friendly palettes
- Reduce motion option (disable animations)

---

## 🎯 Recommended Implementation Roadmap

### Phase 1: Quick Wins (1-2 weeks)
1. ✅ Object deletion (right-click) - **COMPLETED**
2. ✅ Object counter display - **COMPLETED**
3. ✅ Pause/play button - **COMPLETED**
4. ✅ Undo/redo system - **COMPLETED**
5. ✅ Slow-motion control - **COMPLETED**
6. ✅ Bug fixes (tunneling, reset issues) - **COMPLETED**

**Impact**: High usability improvements with minimal effort  
**Status**: ✅ 6/6 completed (100%)

### Phase 2: Core Features (3-4 weeks)
1. ✅ Save/load system (localStorage) - **COMPLETED**
2. ✅ More object types (spring, explosive) - **COMPLETED**
3. ✅ Scoring system - **COMPLETED**
4. ✅ Grid/snap toggle - **COMPLETED**
5. ✅ Sound effects - **COMPLETED**

**Impact**: Major feature additions that enhance gameplay  
**Status**: ✅ 5/5 completed (100%)

### Phase 3: Content & Polish (4-6 weeks)
1. Level system (10-15 levels)
2. Particle effects
3. Replay system
4. Mobile support
5. Theme system

**Impact**: Complete game experience with polish

### Phase 4: Platform & Scale (ongoing)
1. Code refactoring (modules)
2. Automated testing
3. Build system
4. Analytics
5. Community features (sharing)

**Impact**: Professional-grade codebase, scalable

---

## 📊 Prioritization Matrix

```
High Value, Low Effort:
- ✅ Object deletion (COMPLETED Feb 2026)
- ✅ Object counter (COMPLETED Feb 2026)
- ✅ Pause button (COMPLETED Feb 2026)
- ✅ Undo/redo system (COMPLETED Feb 2026)
- ✅ Bug fixes (COMPLETED Feb 2026)

High Value, High Effort:
- ✅ Save/load system (COMPLETED Feb 2026)
- Level system
- Mobile support
- More object types

Medium Value, Medium Effort:
- ✅ Scoring system (COMPLETED Feb 2026)
- Grid toggle
- Sound effects

Low Value, Low Effort:
- Theme system
- Analytics

Low Value, High Effort:
- (Avoid these)
```

---

## 🎮 Community Requests

If opening to community feedback, consider:
- GitHub Issues for feature requests
- Discord server for community
- Reddit for sharing contraptions
- Steam Workshop-style sharing

---

## 💡 Innovation Ideas

### Crazy Ideas Worth Exploring

1. **Multiplayer**: Two players build contraptions to doom each other's NPCs
2. **VR Version**: Build in 3D space with hand controllers
3. **Level Editor**: Players create and share custom levels
4. **Randomizer Mode**: Random object spawning for improvisation
5. **Speedrun Mode**: Race against time to doom NPC
6. **Sandbox Mode**: Infinite objects, no objective, pure creativity
7. **Story Mode**: Narrative explaining why NPC must be doomed
8. **Achievements**: Steam-style achievement system
9. **Daily Challenge**: New pre-built level each day
10. **AI Opponent**: AI builds contraptions for players to beat

---

## 📝 Conclusion

This gameplan provides a comprehensive roadmap for enhancing Doomberg Machine. The recommended approach is to:

1. **Start with Phase 1** (Quick Wins) to immediately improve UX
2. **Gather user feedback** after Phase 1 to validate priorities
3. **Implement Phase 2** (Core Features) to add depth
4. **Polish with Phase 3** for a complete experience
5. **Scale with Phase 4** for long-term maintenance

The key is to maintain the simplicity and charm of the current game while adding depth and polish.

**Remember**: Not every idea needs to be implemented. Focus on what makes the game more fun and engaging!

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Ready for community feedback

Feel free to open GitHub issues for any of these items you'd like to see implemented!
