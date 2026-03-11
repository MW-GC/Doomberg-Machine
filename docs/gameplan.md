---
layout: default
title: Enhancement Gameplan
---

# 🎯 Doomberg Machine - Enhancement Gameplan

This document outlines the enhancement roadmap for the Doomberg Machine project. It serves as a living document tracking completed work and planned future improvements.

## 📖 How to Use This Document

- **Completed Features Table**: Shows all implemented features with links to detailed documentation
- **Roadmap Phases**: Current status of Phase 1 (Complete), Phase 2 (Complete), Phase 3 (Planned), Phase 4 (Planned)
- **Future Enhancements**: Expanded descriptions for planned features only
- **Detailed Documentation**: For completed features, see [technical.md](technical.md) and [gameplay.md](gameplay.md)

---

## ✅ Completed Features

All completed features are documented in detail in [technical.md](technical.md) and [gameplay.md](gameplay.md).

### Phase 1: Quick Wins (Completed February 2026)

| Feature | Description | Details |
|---------|-------------|---------|
| **Object Deletion** | Right-click to delete placed objects | [gameplay.md](gameplay.md#controls-reference) |
| **Object Counter** | Display count of placed objects | [gameplay.md](gameplay.md#how-to-play) |
| **Pause/Play** | Pause and resume simulation | [gameplay.md](gameplay.md#controls-reference) |
| **Undo/Redo** | Full undo/redo system with Ctrl+Z/Ctrl+Y | [gameplay.md](gameplay.md#controls-reference) |
| **Slow Motion** | Slow-mo control for detailed observation | [gameplay.md](gameplay.md#controls-reference) |
| **Bug Fixes** | Fixed NPC visibility, tunneling, and reset issues | [technical.md](technical.md) |

### Phase 2: Core Features (Completed February 2026)

| Feature | Description | Details |
|---------|-------------|---------|
| **Save/Load System** | LocalStorage-based contraption saving with custom names | [technical.md](technical.md#9-saveload-system) |
| **Spring Object** | Super-bouncy object with 1.5 restitution coefficient | [gameplay.md](gameplay.md#available-objects) |
| **Explosive Object** | Collision-triggered explosive with radial force | [gameplay.md](gameplay.md#available-objects) |
| **Scoring System** | Score based on efficiency, speed, variety with star ratings | [gameplay.md](gameplay.md#scoring-system) |
| **Grid/Snap Toggle** | Optional 40px grid overlay with snap-to-grid placement | [gameplay.md](gameplay.md#controls-reference) |
| **Sound Effects** | Web Audio API oscillator synthesis for game actions | [technical.md](technical.md#8-sound-system) |

### Phase 3: Advanced Features (Completed February 2026)

| Feature | Description | Details |
|---------|-------------|---------|
| **Replay/Recording System** | Frame-by-frame simulation recording and playback with localStorage persistence | [technical.md](technical.md#10-replay--recording-system) [gameplay.md](gameplay.md#-replay--recording-system) |

---

## 📋 Current State Assessment

### ✅ What's Working Well

1. **Core Gameplay**: Object placement, physics simulation, doom detection
2. **Physics Engine**: Solid Matter.js integration with good performance
3. **User Interface**: Clean, intuitive controls with visual feedback
4. **Documentation**: Comprehensive user and developer docs
5. **Accessibility**: Keyboard controls and focus states
6. **Browser Compatibility**: Works across modern browsers
7. **Completed Features**: All Phase 1, 2 & 3 features implemented (see tables above)

### 🎯 Areas for Future Enhancement

1. **Gameplay Expansion**
   - More object types (fan, rope, portal, magnet, conveyor - see section 6)
   - Level system with progression
   - Mobile/touch support
   - Challenge/tutorial modes

2. **Technical Improvements**
   - Code modularization
   - Automated testing
   - Build/minification pipeline
   - Recording export/import for sharing

3. **Polish & UX**
   - Particle effects
   - Theme system
   - Tutorial/hints system
   - Enhanced animations

---

## 🎯 Future Enhancements

The following sections describe planned features in detail. For completed features, see the table above and refer to [technical.md](technical.md) or [gameplay.md](gameplay.md).

---

### 🎨 Planned Feature Additions

These features would add significant value to the game experience.

#### 6. More Object Types 🔄 **IN PROGRESS**
**Priority**: Medium  
**Effort**: Medium per object  
**Value**: High  
**Status**: 🔄 In Progress (2/N objects completed)

**Description**: Expand object variety with new physics-based objects

**Completed Objects**:

##### 6.1 Spring Object 🌀 ✅ **COMPLETED**
**Status**: ✅ Completed (February 2026)

**Implementation**:
```javascript
case 'spring':
    body = Bodies.circle(x, y, 15, {
        restitution: 1.5,  // Super bouncy
        density: 0.01,
        render: { fillStyle: '#FF00FF' }
    });
    break;
```

**Features**:
- Super-bouncy object with above-unity restitution (1.5)
- Creates dynamic chain reactions
- Purple color (#FF00FF) for easy identification
- Integrated with undo/redo system
- Save/load support

**Benefits**:
- Adds energy to contraptions
- Enables complex chain reactions
- Increases gameplay variety

---

##### 6.2 Explosive Object 💣 ✅ **COMPLETED**
**Status**: ✅ Completed (February 2026)

**Implementation**:
```javascript
case 'explosive':
    body = Bodies.circle(x, y, 20, {
        isStatic: false,
        density: 0.05,
        render: { fillStyle: '#FF4500' },
        label: 'explosive'
    });
    // Detonates on collision with sufficient force (velocity > 1)
    break;
```

**Features**:
- Explodes when hit with velocity > 1
- Applies radial force to nearby objects via `applyExplosionForce()`
- Uses relative velocity calculation to detect impacts
- Orange color (#FF4500) that changes on detonation (#FFA500)
- `hasDetonated` flag prevents multiple detonations
- Proper cleanup and removal after explosion
- Integrated with undo/redo system
- Save/load support

**Benefits**:
- Dramatic contraption climaxes
- Area-of-effect physics interactions
- Strategic placement gameplay

---

**Future Object Ideas** (Planned but not yet implemented):
- Fan 💨 - Force field to push objects
- Rope/Chain ⛓️ - Flexible connected segments  
- Portal 🌀 - Teleportation between two points
- Magnet 🧲 - Attract/repel metal objects
- Conveyor Belt 📦 - Moving platform

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

#### 8. Replay/Playback System
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

### 🎭 Polish & UX Features

These features would add polish and improve the overall user experience.

#### 9. Particle Effects
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

#### 10. Theme System
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

#### 11. Mobile Support
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

#### 12. Code Refactoring
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

#### 13. Automated Testing
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

#### 14. Build System
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

#### 15. Analytics Integration
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

#### 16. Accessibility Improvements

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

## 🎯 Implementation Roadmap

### ✅ Phase 1: Quick Wins - COMPLETED (February 2026)
All 6 quick-win features have been successfully implemented:
- Object deletion (right-click)
- Object counter display  
- Pause/play button
- Undo/redo system
- Slow-motion control
- Bug fixes (tunneling, reset issues)

**See completed features table above for links to documentation.**

---

### ✅ Phase 2: Core Features - COMPLETED (February 2026)
All 6 Phase 2 features have been successfully implemented:
- Save/load system (localStorage)
- Scoring system
- Grid/snap toggle
- Sound effects
- Spring object (object variety expansion)
- Explosive object (object variety expansion)

**Note**: Object variety expansion is ongoing - more objects (fan, rope, portal, etc.) are planned for future phases.

**See completed features table above for links to documentation.**

---

### ⏳ Phase 3: Content & Polish (Planned)
Future enhancements to add depth and polish:
1. Level system (10-15 levels)
2. Particle effects
3. Replay system
4. Mobile support
5. Theme system

**Impact**: Complete game experience with polish

---

### ⏳ Phase 4: Platform & Scale (Planned)
Long-term technical improvements:
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
- 🔄 More object types (IN PROGRESS - Spring ✅, Explosive ✅)
- Level system
- Mobile support

Medium Value, Medium Effort:
- ✅ Scoring system (COMPLETED Feb 2026)
- ✅ Grid toggle (COMPLETED Feb 2026)
- ✅ Sound effects (COMPLETED Feb 2026)

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

## 📝 Summary

### Current Status

✅ **Phase 1 (Quick Wins)**: Complete - 6/6 features implemented  
✅ **Phase 2 (Core Features)**: Complete - 6/6 features implemented  
⏳ **Phase 3 (Content & Polish)**: Planned - 0/5 features  
⏳ **Phase 4 (Platform & Scale)**: Planned - 0/5 features

**Total Progress**: 12/22 major features completed (55%)

### Recommended Next Steps

1. **Gather user feedback** on completed Phase 1 & 2 features
2. **Prioritize Phase 3 items** based on user needs and feedback
3. **Continue object variety expansion** (fan, rope, portal, magnet, conveyor)
4. **Plan Phase 3 implementation** starting with highest-impact features

### Key Principle

Maintain the simplicity and charm of the core game while adding depth and polish. Not every idea needs to be implemented - focus on what makes the game more fun and engaging!

---

**Document Version**: 2.0  
**Last Updated**: February 2026  
**Status**: Phase 1 & 2 Complete, Phase 3 Planning

For feature requests, open GitHub issues. For completed feature documentation, see [technical.md](technical.md) and [gameplay.md](gameplay.md).
