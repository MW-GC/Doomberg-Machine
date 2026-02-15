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

#### 4. Grid/Snap Toggle
**Priority**: Medium  
**Effort**: Medium  
**Value**: Medium

**Description**: Optional grid overlay with snap-to-grid placement

**Implementation**:
```javascript
let gridEnabled = false;
const GRID_SIZE = 20;

function snapToGrid(x, y) {
    if (!gridEnabled) return { x, y };
    return {
        x: Math.round(x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(y / GRID_SIZE) * GRID_SIZE
    };
}

function drawGrid() {
    if (!gridEnabled) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    // Draw grid lines...
}
```

**Benefits**:
- More precise placement
- Easier to align objects
- Professional look

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

#### 6. More Object Types
**Priority**: Medium  
**Effort**: Medium per object  
**Value**: High

**Proposed New Objects**:

**Spring** 🌀
```javascript
case 'spring':
    body = Bodies.circle(x, y, 15, {
        restitution: 1.5,  // Super bouncy
        density: 0.01,
        render: { fillStyle: '#FF00FF' }
    });
    break;
```

**Fan** 💨
```javascript
case 'fan':
    // Static body with force field
    body = Bodies.rectangle(x, y, 40, 40, {
        isStatic: true,
        render: { fillStyle: '#00FFFF' },
        plugin: {
            wind: { x: 0.02, y: 0 }  // Right-facing wind
        }
    });
    // In update loop, apply force to nearby objects
    break;
```

**Explosive** 💣
```javascript
case 'explosive':
    body = Bodies.circle(x, y, 20, {
        isStatic: false,
        density: 0.05,
        render: { fillStyle: '#FF4500' },
        label: 'explosive'
    });
    // On collision with sufficient force, explode
    break;
```

**Rope/Chain** ⛓️
```javascript
case 'rope':
    // Create chain of connected bodies
    const segments = createRopeSegments(x, y, length);
    // Use constraints to connect them
    break;
```

**Portal** 🌀
```javascript
case 'portal':
    // Create pair of portals (A and B)
    // Teleport objects from one to the other
    break;
```

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

#### 8. Save/Load System
**Priority**: Medium  
**Effort**: Medium  
**Value**: High

**Description**: Save contraption designs and load them later

**Implementation Options**:

**Option A: LocalStorage**
```javascript
function saveContraption(name) {
    const design = {
        version: 1,
        name: name,
        objects: placedObjects.map(obj => ({
            type: obj.label,
            position: obj.position,
            angle: obj.angle,
            // ... other properties
        }))
    };
    localStorage.setItem(`contraption_${name}`, JSON.stringify(design));
}

function loadContraption(name) {
    const data = localStorage.getItem(`contraption_${name}`);
    if (data) {
        const design = JSON.parse(data);
        recreateObjects(design.objects);
    }
}
```

**Option B: URL Encoding**
```javascript
function exportToURL() {
    const data = compressDesign(placedObjects);
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?design=${encoded}`;
    navigator.clipboard.writeText(url);
}
```

**Option C: File Export**
```javascript
function exportToFile() {
    const data = JSON.stringify(designData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contraption.json';
    a.click();
}
```

**Benefits**:
- Share designs with others
- Build complex machines over multiple sessions
- Backup favorite contraptions
- Community sharing potential

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

#### 10. Scoring System
**Priority**: Medium  
**Effort**: Medium  
**Value**: Medium

**Description**: Score contraptions based on various metrics

**Scoring Factors**:
```javascript
function calculateScore() {
    let score = 0;
    
    // Base doom score
    if (npcDoomed) score += 1000;
    
    // Efficiency bonus (fewer objects = higher score)
    const objectBonus = Math.max(0, 500 - (placedObjects.length * 20));
    score += objectBonus;
    
    // Speed bonus (faster doom = higher score)
    const timeBonus = Math.max(0, 500 - (doomTime * 10));
    score += timeBonus;
    
    // Creativity bonus (variety of objects used)
    const uniqueTypes = new Set(placedObjects.map(o => o.label)).size;
    score += uniqueTypes * 100;
    
    // Combo multiplier (chain reactions)
    score *= comboMultiplier;
    
    return score;
}
```

**Display**:
- Show score after doom
- Leaderboard (local or online)
- Star rating (1-3 stars based on score)

**Benefits**:
- Adds challenge and replayability
- Encourages optimization
- Competition and community engagement

---

### 🎭 Polish & UX (Lower Priority but High Impact)

#### 11. Sound Effects
**Priority**: Low  
**Effort**: Medium  
**Value**: High

**Sounds Needed**:
- Object placement: "plop" sound
- Collision: varying impact sounds based on force
- Doom: dramatic sound effect
- UI interactions: click, hover sounds
- Background music: optional ambient track

**Implementation**:
```javascript
const sounds = {
    place: new Audio('sounds/place.mp3'),
    collision: new Audio('sounds/collision.mp3'),
    doom: new Audio('sounds/doom.mp3'),
    ui: new Audio('sounds/click.mp3')
};

function playSound(soundName) {
    if (sounds[soundName] && !muted) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play();
    }
}
```

**UI Addition**:
- Mute/unmute button
- Volume control
- Sound settings panel

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
2. Object counter display
3. Pause/play button
4. ✅ Undo/redo system - **COMPLETED**
5. Bug fixes (tunneling, reset issues)

**Impact**: High usability improvements with minimal effort  
**Status**: 2/5 completed (40%)

### Phase 2: Core Features (3-4 weeks)
1. Save/load system (localStorage)
2. More object types (spring, explosive)
3. Scoring system
4. Grid/snap toggle
5. Sound effects

**Impact**: Major feature additions that enhance gameplay

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
- Object counter
- Pause button
- ✅ Undo/redo system (COMPLETED Feb 2026)
- Bug fixes

High Value, High Effort:
- Save/load system
- Level system
- Mobile support
- More object types

Low Value, Low Effort:
- Theme system
- Analytics
- Grid toggle

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
