---
layout: default
title: Architecture & Design
---

# 🏛️ Doomberg Machine - Architecture & Design

This document describes the architectural decisions, design patterns, and system design of the Doomberg Machine project.

## 🎯 Design Philosophy

### Core Principles

1. **Simplicity First**: Keep the codebase minimal and readable
2. **Physics-Driven**: Let the physics engine handle complexity
3. **Immediate Feedback**: Provide instant visual and textual feedback
4. **Extensibility**: Design for easy addition of new features
5. **Browser-Native**: Use web standards, minimize dependencies

### Design Goals

- **Zero Build Step**: Run directly in browser without compilation
- **Self-Contained**: Single repository with all assets
- **Accessible**: Keyboard and mouse controls, focus states
- **Performant**: Maintain 60 FPS with reasonable object counts
- **Responsive**: Adapt to different screen sizes

## 🏗️ System Architecture

### Layer Architecture

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                  │
│  - HTML Structure (index.html)              │
│  - CSS Styling (style.css)                  │
│  - Visual Feedback & Animations             │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Application Layer                   │
│  - Game State Management                    │
│  - Event Handling & User Input              │
│  - Object Factory & Placement               │
│  - UI Control Logic                         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Physics Layer                       │
│  - Matter.js Engine                         │
│  - Collision Detection                      │
│  - Body Simulation                          │
│  - Constraint System                        │
└─────────────────────────────────────────────┘
```

### Component Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Canvas    │────▶│    Render    │────▶│   Physics    │
│             │     │   Manager    │     │   Engine     │
└─────────────┘     └──────────────┘     └──────────────┘
       │                                          │
       │                                          │
       ▼                                          ▼
┌─────────────┐                          ┌──────────────┐
│   Mouse     │                          │  Collision   │
│  Controller │                          │  Detector    │
└─────────────┘                          └──────────────┘
       │                                          │
       │                                          │
       ▼                                          ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Placement  │────▶│    State     │◀────│    Doom      │
│   System    │     │   Manager    │     │   System     │
└─────────────┘     └──────────────┘     └──────────────┘
```

## 🔄 Data Flow

### Object Placement Flow

```
User Click Event
       │
       ▼
Mouse Coordinate Conversion
       │
       ▼
Selected Tool Check
       │
       ▼
placeObject() Factory
       │
       ├──▶ Create Physics Body
       │
       ├──▶ Store Original Position
       │
       ├──▶ Add to World
       │
       └──▶ Track in Array
```

### Simulation Flow

```
Run Machine Click
       │
       ▼
Set isRunning = true
       │
       ├──▶ Make NPC Dynamic
       │
       └──▶ Start Physics Runner
              │
              ▼
       Physics Update Loop (60 FPS)
              │
              ├──▶ Apply Forces
              │
              ├──▶ Update Positions
              │
              ├──▶ Detect Collisions
              │
              │    ┌────────────┐
              │    │ Collision? │
              │    └─────┬──────┘
              │          │ Yes
              │          ▼
              │    Check Velocity
              │          │
              │          ▼
              │    Doom if Fast Enough
              │
              └──▶ Render Frame
```

### State Transition Diagram

```
     ┌─────────┐
     │ INITIAL │
     └────┬────┘
          │ window.load
          ▼
     ┌─────────┐  place object  ┌─────────┐
  ┌─▶│  READY  │◀───────────────│ READY + │
  │  └────┬────┘                │ OBJECTS │
  │       │                     └─────────┘
  │       │ run machine
  │       ▼
  │  ┌─────────┐
  │  │ RUNNING │
  │  └────┬────┘
  │       │
  │       ├──────────────────┐
  │       │                  │
  │       │ collision        │ reset
  │       │ w/ velocity      │
  │       ▼                  ▼
  │  ┌─────────┐        ┌─────────┐
  │  │ DOOMED  │        │  RESET  │
  │  └─────────┘        └────┬────┘
  │                          │
  └──────────────────────────┘
                    
  clear all → READY
```

## 🎨 Design Patterns

### 1. Factory Pattern

**Usage**: Object creation in `placeObject()`

**Benefit**: Centralizes object creation logic, makes adding new types easy

```javascript
function placeObject(type, x, y) {
    let body;
    
    switch(type) {
        case 'ball':
            body = createBall(x, y);
            break;
        case 'box':
            body = createBox(x, y);
            break;
        // ... more types
    }
    
    if (body) {
        configureBody(body, x, y);
        addToWorld(body);
    }
}
```

### 2. Observer Pattern

**Usage**: Collision detection via Matter.js events

**Benefit**: Decouples collision logic from simulation loop

```javascript
Events.on(engine, 'collisionStart', (event) => {
    // React to collisions without polling
    handleCollisions(event.pairs);
});
```

### 3. State Machine

**Usage**: Game state management

**States**:
- `isRunning`: false (ready) / true (simulating)
- `npcDoomed`: false (alive) / true (doomed)
- `selectedTool`: null / string (tool type)

**Transitions**:
- Ready → Running: Run Machine button
- Running → Ready: Reset button
- Running → Doomed: Collision with velocity
- Any → Ready: Clear All button

### 4. Memento Pattern (Simplified)

**Usage**: Object reset system

**Implementation**: Store original state on body creation

```javascript
body.originalPosition = { x, y };
body.originalAngle = angle;

// Later, restore:
Body.setPosition(body, body.originalPosition);
Body.setAngle(body, body.originalAngle);
```

### 5. Strategy Pattern (Implicit)

**Usage**: Different physics properties per object type

**Benefit**: Each object type has its own "strategy" for physics behavior

```javascript
const strategies = {
    ball: { restitution: 0.8, density: 0.04 },
    box: { restitution: 0.3, density: 0.05 },
    domino: { restitution: 0.1, density: 0.05 }
};
```

## 🗃️ Data Structures

### Primary Data Structures

#### 1. placedObjects: Array<Body>
```javascript
let placedObjects = [];
```
- **Purpose**: Track all user-placed physics bodies
- **Operations**: push (O(1)), forEach (O(n)), clear (O(1))
- **Used For**: Reset functionality, clear all, iteration

#### 2. placedConstraints: Array<Constraint>
```javascript
let placedConstraints = [];
```
- **Purpose**: Track Matter.js constraints separately
- **Why Separate**: Constraints need different removal handling
- **Used For**: Seesaw pivot cleanup

#### 3. Matter.js World Composite
```javascript
engine.world
```
- **Structure**: Composite containing all bodies and constraints
- **Managed By**: Matter.js engine
- **Access Pattern**: Read-only queries, modifications via API

### Object Properties Schema

#### Standard Body
```javascript
{
    position: { x: number, y: number },
    angle: number,
    velocity: { x: number, y: number },
    angularVelocity: number,
    isStatic: boolean,
    
    // Custom properties
    originalPosition: { x: number, y: number },
    originalAngle: number,
    
    // Matter.js properties
    density: number,
    restitution: number,
    friction: number,
    // ... many more
}
```

#### NPC Composite Body
```javascript
{
    parts: [body, head, leftArm, rightArm, leftLeg, rightLeg],
    isStatic: boolean,
    label: 'npc',
    // ... standard body properties
}
```

## ⚙️ Physics System Design

### Physics Configuration

**Coordinate System**:
- Origin: Top-left corner
- X-axis: Left to right (0 to 1200)
- Y-axis: Top to bottom (0 to 600)
- Units: Pixels

**World Boundaries**:
```
┌────────────────────────────┐
│          Sky Area          │ ← 0
│                            │
│    ┌──────────────────┐    │
│ W  │  Play Area       │  W │
│ A  │                  │  A │
│ L  │                  │  L │
│ L  │                  │  L │
│    └──────────────────┘    │
│        Ground (20px)       │ ← 600
└────────────────────────────┘
  ↑                        ↑
  5px                      1195px
```

**Gravity**:
- Direction: Downward (positive Y)
- Magnitude: 1.0 (Matter.js units)
- Effect: Realistic falling and rolling

### Collision Detection

**Detection Method**: Broadphase → Narrowphase (Matter.js internal)

**Broadphase**: SAT (Separating Axis Theorem)
- Fast rejection of non-colliding pairs
- Efficient for many objects

**Narrowphase**: Precise collision resolution
- Accurate collision points
- Proper velocity response

**Doom Detection Logic**:
```javascript
if (collision involves NPC && !npcDoomed) {
    otherBody = get non-NPC body;
    velocity = |otherBody.velocity.x| + |otherBody.velocity.y|;
    
    if (velocity > DOOM_THRESHOLD) {
        doom();
    }
}
```

**Why Check Impact Velocity**:
- Prevents doom from light touches
- Requires meaningful impact
- More satisfying gameplay

### Constraint System

**Seesaw Implementation**:
```javascript
Pivot (Static)
    │
    │ Constraint (length: 0, stiffness: 0.9)
    │
Plank (Dynamic)
```

**Constraint Properties**:
- **Length: 0**: Fixed rotation point (hinge)
- **Stiffness: 0.9**: Slight flexibility (more realistic)
- **bodyA: pivot**: Anchor point (static)
- **bodyB: plank**: Rotating element (dynamic)

## 🎮 Input System Design

### Mouse Input Processing

**Coordinate Transformation**:
```javascript
// Screen coordinates → Canvas coordinates
const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
const canvasX = (event.clientX - rect.left) * scaleX;
const canvasY = (event.clientY - rect.top) * scaleY;
```

**Why Needed**:
- Canvas may be scaled by CSS
- Screen coordinates don't match canvas pixels
- Must account for scaling to place objects accurately

### Keyboard Input

**Ramp Rotation System**:
- **Q Key**: Rotate counter-clockwise (-15°)
- **E Key**: Rotate clockwise (+15°)

**Angle Management**:
```javascript
// Continuous rotation with normalization
currentRampAngle += angleChange;
currentRampAngle = normalizeAngle(currentRampAngle);
```

**Normalization**: Keeps angle in [0, 2π) range
- Prevents overflow with many rotations
- Simplifies angle comparisons
- Consistent display values

## 🎨 UI/UX Design

### Visual Hierarchy

**Priority Levels**:
1. **Primary**: Canvas (game area) - largest, centered
2. **Secondary**: Control buttons - grouped logically
3. **Tertiary**: Status displays - informational
4. **Quaternary**: Instructions - reference material

### Color Scheme

**Palette**:
```css
Primary Gradient: #667eea → #764ba2 (purple)
Header Gradient: #f093fb → #f5576c (pink-red)
Sky: #87CEEB (light blue)
Ground: #8B4513 (brown)
```

**Object Colors**:
- Ball: #FF6B6B (red) - danger/action
- Box: #A0522D (sienna) - heavy/solid
- Domino: #4ECDC4 (turquoise) - unique/special
- Ramp: #95E1D3 (mint) - functional
- Platform: #F38181 (coral) - structural
- Seesaw: #AA8976/#EAAC8B (tan) - mechanical

**Semantic Colors**:
- Success: Green (#28a745)
- Danger: Red (#721c24)
- Info: Blue (#17a2b8)
- Neutral: Gray (#6c757d)

### Animation Design

**Doom Pulse Animation**:
```css
@keyframes doom-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
```
- Duration: 0.5s
- Repeats: 3 times
- Effect: Attention-grabbing celebration

**Button Hover**:
```css
transform: translateY(-2px);
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
```
- Subtle lift effect
- Provides tactile feedback
- Smooth 0.3s transition

### Accessibility

**Focus States**:
```css
.tool-btn:focus, .action-btn:focus {
    outline: 3px solid #4CAF50;
    outline-offset: 2px;
}
```

**Keyboard Navigation**:
- All buttons are keyboard accessible
- Tab order follows visual layout
- Enter/Space activate buttons

**Screen Reader Support**:
- Semantic HTML structure
- Descriptive button labels with emoji
- Status updates in accessible elements

## 🔧 Performance Considerations

### Optimization Strategies

**1. Object Pooling (Not Implemented)**
- Current: Create/destroy objects each time
- Future: Reuse object instances
- Benefit: Reduce GC pressure

**2. Constraint Separation**
- Track constraints separately from bodies
- Prevents removal conflicts
- Cleaner reset logic

**3. Static Object Optimization**
- Ramps and platforms are static
- Matter.js optimizes static bodies
- No continuous physics calculations

**4. Event Listener Efficiency**
- Single collision listener registered once
- No duplicate registrations
- Efficient event handling

### Performance Limits

**Recommended Object Counts**:
- **Optimal**: 0-30 objects (smooth 60 FPS)
- **Good**: 30-60 objects (stable 60 FPS)
- **Acceptable**: 60-100 objects (may drop to 50 FPS)
- **Poor**: 100+ objects (noticeable slowdown)

**Bottlenecks**:
1. Collision detection (O(n²) worst case)
2. Rendering complex shapes
3. Constraint solving iterations
4. DOM updates for status text

## 🚀 Extensibility Design

### Adding New Object Types

**Required Steps**:
1. Add button to HTML
2. Add case to `placeObject()` switch
3. Define physics properties
4. Choose appropriate color

**Optional Steps**:
- Add special behavior (like seesaw constraints)
- Add custom collision handling
- Add UI-specific controls (like ramp rotation)

### Potential Extensions

**Feature Categories**:

**1. Object Types**
- Springs: High restitution, variable stiffness
- Explosives: Trigger-based force application
- Fans: Continuous force fields
- Magnets: Attractive/repulsive forces
- Portals: Position teleportation

**2. Gameplay Mechanics**
- Multi-level progression
- Timed challenges
- Object count limits
- Scoring system
- Combo multipliers

**3. Social Features**
- Save/load contraptions
- Share designs via URL encoding
- Replay system
- Leaderboards
- User profiles

**4. Visual Enhancements**
- Particle effects on collision
- Trails for moving objects
- Zoom and pan controls
- Slow-motion mode
- Custom themes/skins

## 📊 System Metrics

### Code Metrics

```
Total Lines of Code: ~1,500
- game.js: 431 lines
- style.css: 190 lines
- index.html: 61 lines
- Documentation: 800+ lines

Cyclomatic Complexity: Low-Medium
Functions: 15 primary functions
Dependencies: 1 (Matter.js)
```

### Performance Metrics

```
Frame Rate: 60 FPS target
Physics Updates: 60 Hz
Render Updates: 60 Hz
Input Latency: <16ms
Memory Usage: ~30-50 MB
```

## 🔐 Security Considerations

### Current Security

**Safe Practices**:
- No server communication (offline-capable)
- No user data collection
- No external API calls
- No eval() or dynamic code execution
- Input sanitized by browser (canvas coordinates)

**Not Vulnerable To**:
- XSS attacks (no user-generated HTML)
- CSRF attacks (no server requests)
- SQL injection (no database)
- Code injection (no eval)

### Future Considerations

**If Adding Server Features**:
- Sanitize save game data
- Validate URL parameters
- Rate limit API requests
- Implement CORS properly
- Use HTTPS for all requests

## 📚 Design Decisions Log

### Key Decisions

**1. Why Matter.js?**
- **Decision**: Use Matter.js physics engine
- **Alternatives**: Box2D, Planck.js, custom physics
- **Reasoning**: Well-documented, browser-native, good performance
- **Trade-offs**: Adds 500KB dependency, but saves months of development

**2. Why Separate Bodies/Constraints Arrays?**
- **Decision**: Track `placedObjects` and `placedConstraints` separately
- **Alternatives**: Single array, use world queries
- **Reasoning**: Different removal logic, cleaner reset code
- **Trade-offs**: Slight memory overhead, easier maintenance

**3. Why Check Impact Velocity?**
- **Decision**: Doom only on fast collisions (velocity > 2)
- **Alternatives**: Any collision, force-based, damage accumulation
- **Reasoning**: Feels more satisfying, prevents accidental doom
- **Trade-offs**: Requires tuning, may be confusing initially

**4. Why Static NPC Until Run?**
- **Decision**: NPC is static until simulation starts
- **Alternatives**: Always dynamic, controlled by motor
- **Reasoning**: Prevents accidental doom, clear game phases
- **Trade-offs**: Slightly less realistic, but better gameplay

**5. Why No Object Dragging?**
- **Decision**: Click-to-place only, no drag-to-position
- **Alternatives**: Full drag system, grid snapping
- **Reasoning**: Simpler code, encourages experimentation
- **Trade-offs**: Less precision, more trial-and-error

## 🔮 Future Architecture

### Proposed Improvements

**1. Module System**
```javascript
// Current: Single file
// Proposed: Multiple modules
import { PhysicsEngine } from './physics.js';
import { ObjectFactory } from './objects.js';
import { UIController } from './ui.js';
```

**2. State Management Library**
```javascript
// Current: Global variables
// Proposed: Centralized state
const state = {
    game: { isRunning, npcDoomed },
    objects: { placed, selected },
    ui: { status, doomStatus }
};
```

**3. Component Architecture**
```javascript
// Proposed: Component classes
class GameObject {
    constructor(type, x, y) { }
    place() { }
    reset() { }
    remove() { }
}

class Ball extends GameObject { }
class Box extends GameObject { }
```

## 📖 References

### Influential Designs

- **The Incredible Machine** (1993): Rube Goldberg puzzle game
- **Crayon Physics Deluxe** (2009): Drawing-based physics sandbox
- **World of Goo** (2008): Physics-based construction puzzle

### Technical References

- [Matter.js Documentation](https://brm.io/matter-js/docs/)
- [Game Programming Patterns](http://gameprogrammingpatterns.com/)
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

**Architecture Version**: 1.0  
**Document Version**: 1.0  
**Last Updated**: February 2026

This architecture is designed to be simple, maintainable, and extensible while maintaining excellent performance and user experience.
