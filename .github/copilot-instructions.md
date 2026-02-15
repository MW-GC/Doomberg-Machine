# Copilot Instructions for Doomberg-Machine

This file provides comprehensive instructions for GitHub Copilot agents working on the Doomberg-Machine repository.

## 🎮 Project Overview

**Doomberg-Machine** is a browser-based 2D physics puzzle game where players build Rube Goldberg contraptions to doom an NPC character. Built with vanilla JavaScript and Matter.js physics engine.

**Core Concept**: Creative, physics-based sandbox gameplay with dark humor

## 📁 Repository Structure

```
Doomberg-Machine/
├── .github/
│   └── copilot-instructions.md (this file)
├── docs/
│   ├── gameplay.md        # User-facing gameplay documentation
│   ├── technical.md       # Developer technical documentation
│   ├── architecture.md    # System architecture & design
│   └── gameplan.md        # Enhancement roadmap & improvements
├── index.html             # Main HTML structure (61 lines)
├── style.css              # All styling & animations (190 lines)
├── game.js                # Game logic & physics (431 lines)
├── matter.min.js          # Matter.js physics engine
├── package.json           # Project metadata
└── README.md              # User documentation

Total JavaScript: ~500 lines (game logic + utilities)
```

## 🎯 File-Specific Instructions

### index.html
**Purpose**: HTML5 structure, canvas, controls, and UI layout

**When to Edit**:
- Adding new UI buttons or controls
- Restructuring control panels
- Adding new status displays
- Integrating new HTML elements

**Code Conventions**:
- Use semantic HTML5 elements
- Maintain responsive container structure
- Keep scripts in loading order: Matter.js → game.js
- Use data attributes for tool buttons: `data-tool="objectType"`

**Examples**:
```html
<!-- Adding new object button -->
<button class="tool-btn" data-tool="spring">🌀 Spring</button>

<!-- Adding new status display -->
<div id="objectCounter" class="object-counter">Objects: 0</div>
```

**Avoid**:
- Inline styles (use style.css)
- Inline JavaScript (use game.js)
- Breaking responsive layout
- Changing script load order

---

### style.css
**Purpose**: All visual styling, animations, and responsive design

**When to Edit**:
- Styling new UI elements
- Adding animations or transitions
- Implementing themes
- Responsive design adjustments
- Accessibility improvements

**Code Conventions**:
- Use modern CSS3 (Flexbox, Grid, CSS variables)
- Mobile-first responsive design with media queries
- Maintain consistent color palette
- Include focus states for accessibility
- Group related styles together

**Color Palette**:
```css
/* Primary Colors */
Primary Gradient: #667eea → #764ba2
Header Gradient: #f093fb → #f5576c
Background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)

/* Game Colors */
Sky: #87CEEB
Ground: #8B4513
NPC Body: #FF0000, #FFB6C1 (pink), #0000FF (blue)

/* Object Colors */
Ball: #FF6B6B
Box: #A0522D
Domino: #4ECDC4
Ramp: #95E1D3
Platform: #F38181
Seesaw: #AA8976, #EAAC8B

/* UI Colors */
Success: #28a745
Active Button: #667eea
Focus Outline: #4CAF50
```

**Animations**:
```css
/* Doom pulse (victory animation) */
@keyframes doom-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

/* Button hover effect */
transform: translateY(-2px);
transition: all 0.3s ease;
```

**Accessibility**:
```css
/* Always include focus states */
.tool-btn:focus, .action-btn:focus {
    outline: 3px solid #4CAF50;
    outline-offset: 2px;
}
```

---

### game.js
**Purpose**: Core game logic, physics integration, event handling, and state management

**When to Edit**:
- Adding new object types
- Implementing new game mechanics
- Modifying physics behavior
- Adding event handlers
- Changing game state logic

**Code Structure**:
```javascript
// Section 1: Matter.js aliases (lines 1-10)
// Section 2: Constants (lines 12-32)
// Section 3: Global variables (lines 34-46)
// Section 4: Initialization (lines 48-124)
// Section 5: NPC creation (lines 126-178)
// Section 6: Input handling (lines 180-228)
// Section 7: Object placement (lines 239-336)
// Section 8: Game state (lines 338-423)
// Section 9: Utilities (lines 425-431)
```

**Naming Conventions**:
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Private helpers: prefix with underscore (convention)

**Key Functions**:
```javascript
init()                      // Initialize engine, world, event listeners
createNPC()                 // Create compound NPC body
setupMouseControl()         // Canvas click handler for placement
setupEventListeners()       // Button and keyboard listeners
placeObject(type, x, y)     // Factory for creating objects
runMachine()                // Start physics simulation
resetMachine()              // Restore objects to original positions
clearAll()                  // Remove all placed objects
doomNPC()                   // Victory condition handler
normalizeAngle(angle)       // Angle normalization utility
rotateRamp(angleChange)     // Ramp rotation handler
updateStatus(message)       // Status display update
```

**Important Patterns**:

**1. Store Original Position on Creation**:
```javascript
body.originalPosition = { x: body.position.x, y: body.position.y };
body.originalAngle = body.angle;
```

**2. Separate Bodies from Constraints**:
```javascript
let placedObjects = [];      // Physics bodies
let placedConstraints = [];  // Matter.js constraints
```

**3. Check Impact Velocity in Collisions**:
```javascript
// Check OTHER body's velocity, not NPC's
const otherBody = pair.bodyA.label === 'npc' ? pair.bodyB : pair.bodyA;
const velocity = Math.abs(otherBody.velocity.x) + Math.abs(otherBody.velocity.y);
```

**4. Register Collision Listener Only Once** (in `init()`):
```javascript
// CORRECT: In init()
Events.on(engine, 'collisionStart', (event) => { /* ... */ });

// WRONG: In runMachine() - creates duplicate listeners
```

**5. Canvas Coordinate Conversion**:
```javascript
const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
const x = (event.clientX - rect.left) * scaleX;
const y = (event.clientY - rect.top) * scaleY;
```

**Adding New Object Types**:
```javascript
// 1. Add case to placeObject() switch
case 'spring':
    body = Bodies.circle(x, y, 15, {
        restitution: 1.2,  // Physics properties
        density: 0.02,
        render: {
            fillStyle: '#FF00FF'  // Color
        }
    });
    break;

// 2. Add button to index.html
// 3. Test thoroughly
```

**Physics Constants**:
```javascript
CANVAS_WIDTH = 1200
CANVAS_HEIGHT = 600
GROUND_HEIGHT = 20
GRAVITY = 1 (world.gravity.y)

DEFAULT_RAMP_ANGLE = -17° (in radians, normalized)
ROTATION_INCREMENT = 15° (Math.PI / 12)

DOOM_VELOCITY_THRESHOLD = 2
```

**State Variables**:
```javascript
isRunning     // false = ready to build, true = simulation active
npcDoomed     // false = alive, true = successfully doomed
selectedTool  // null or string (object type)
placedObjects // Array of placed Body references
placedConstraints // Array of Constraint references
```

**Common Mistakes to Avoid**:
- ❌ Modifying `npc.velocity` in collision check (check impacting body instead)
- ❌ Registering event listeners in `runMachine()` (do it in `init()`)
- ❌ Not storing `originalPosition` on new objects (breaks reset)
- ❌ Mixing bodies and constraints in same array
- ❌ Forgetting to scale mouse coordinates
- ❌ Using `eval()` or `new Function()` (security risk)
- ❌ Removing working code without reason

---

### package.json
**Purpose**: Project metadata and dependencies

**When to Edit**:
- Adding new dependencies
- Updating scripts
- Changing project metadata

**Current Dependencies**:
```json
{
  "dependencies": {
    "matter-js": "^0.20.0"
  }
}
```

**Before Adding Dependencies**:
1. Check if functionality can be implemented natively
2. Verify package is actively maintained
3. Check for security vulnerabilities
4. Consider bundle size impact
5. Document why the dependency is needed

**Recommended Scripts** (not yet implemented):
```json
{
  "scripts": {
    "dev": "python3 -m http.server 8080",
    "test": "vitest",
    "lint": "eslint game.js",
    "build": "uglifyjs game.js -o game.min.js"
  }
}
```

---

### Documentation Files (docs/)

**gameplay.md**:
- User-facing gameplay guide
- How to play, controls, tips
- GitHub Pages formatted
- Update when: Adding new objects, mechanics, controls

**technical.md**:
- Developer documentation
- API reference, code structure
- Setup instructions
- Update when: Major code changes, new APIs, architecture shifts

**architecture.md**:
- System design, patterns
- Data flow, component diagrams
- Design decisions
- Update when: Architectural changes, new patterns, refactoring

**gameplan.md**:
- Enhancement roadmap
- Improvements, fixes, features
- Prioritization and planning
- Update when: Completing items, adding new ideas, changing priorities

---

## 🔧 Development Workflows

### Adding a New Feature

1. **Research & Design**:
   - Check `docs/gameplan.md` for planned features
   - Review `docs/architecture.md` for patterns
   - Consider impact on existing code

2. **Implementation**:
   - Make minimal changes
   - Follow existing patterns
   - Add to appropriate file(s)
   - Maintain code style

3. **Testing**:
   - Test feature in browser
   - Test edge cases
   - Verify reset/clear still work
   - Check performance

4. **Documentation**:
   - Update relevant docs
   - Add code comments if complex
   - Update README if user-facing

5. **Commit**:
   - Clear commit message
   - Reference issue if applicable
   - Group related changes

### Fixing a Bug

1. **Reproduce**:
   - Understand the issue
   - Create minimal reproduction
   - Identify root cause

2. **Fix**:
   - Make targeted change
   - Don't refactor unrelated code
   - Verify fix resolves issue

3. **Test**:
   - Test the fix thoroughly
   - Test related functionality
   - Ensure no regressions

4. **Document**:
   - Add comment explaining fix if subtle
   - Update docs if behavior changes
   - Remove from gameplan.md if listed

### Refactoring Code

1. **Justify**:
   - Clear benefit (readability, performance, maintainability)
   - Not "just because"
   - Document the reason

2. **Plan**:
   - Identify scope
   - Consider dependencies
   - Plan incremental changes

3. **Execute**:
   - Small, testable changes
   - Preserve functionality
   - Test after each step

4. **Verify**:
   - All tests pass
   - Performance is same or better
   - Code is more maintainable

---

## 🎨 Code Style & Conventions

### JavaScript Style

```javascript
// ✅ GOOD
const CANVAS_WIDTH = 1200;  // Constants in UPPER_SNAKE_CASE
let isRunning = false;      // Variables in camelCase
function placeObject() {}   // Functions in camelCase

// Clear, descriptive names
function normalizeAngle(angle) {
    const twoPi = 2 * Math.PI;
    let result = angle % twoPi;
    if (result < 0) {
        result += twoPi;
    }
    return result;
}

// ❌ AVOID
var Running = false;        // No var, wrong case
function PlaceObject() {}   // Wrong case
function n(a) {}           // Unclear names
```

### Comments

```javascript
// ✅ GOOD - Explain WHY, not WHAT
// Check velocity of impacting object, not target object
const otherBody = pair.bodyA.label === 'npc' ? pair.bodyB : pair.bodyA;

// Normalize angle to keep it within [0, 2π) range
currentRampAngle = normalizeAngle(currentRampAngle);

// ❌ AVOID - Stating the obvious
// Set x to 5
const x = 5;

// Add to array
placedObjects.push(body);
```

### Matter.js Usage

```javascript
// ✅ GOOD - Use proper API methods
Body.setPosition(body, { x: 100, y: 100 });
Body.setVelocity(body, { x: 0, y: 0 });
Body.setAngle(body, 0);
Composite.add(world, body);
Composite.remove(world, body);

// ❌ AVOID - Direct property mutation
body.position.x = 100;  // May break physics
body.velocity = { x: 0, y: 0 };  // May not sync
```

---

## 🧪 Testing Guidelines

### Manual Testing Checklist

Every feature/fix should be manually tested:

```
Object Placement:
- [ ] Object appears at click location
- [ ] Multiple objects can be placed
- [ ] Status updates correctly

Physics Simulation:
- [ ] Objects interact realistically
- [ ] Gravity affects dynamic objects
- [ ] Static objects don't move

Collision Detection:
- [ ] Fast impacts doom NPC
- [ ] Slow touches don't doom
- [ ] Visual feedback works

Reset/Clear:
- [ ] Reset restores positions
- [ ] Clear removes all objects
- [ ] State resets correctly
```

### Browser Compatibility Testing

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (if possible)

### Performance Testing

```javascript
// Monitor frame rate
console.log(engine.timing.fps);

// Check object count impact
console.log(`Objects: ${placedObjects.length}, FPS: ${engine.timing.fps}`);

// Memory usage
console.log(performance.memory);  // Chrome only
```

---

## 🔒 Security Guidelines

### What to NEVER Do

```javascript
// ❌ NEVER use eval() or new Function()
eval(userInput);  // XSS vulnerability

// ❌ NEVER execute user-provided code
new Function(userInput)();

// ❌ NEVER trust user input without validation
const x = event.clientX;  // Validate/sanitize

// ❌ NEVER commit secrets or API keys
const API_KEY = "sk-1234...";  // Use environment variables
```

### What to ALWAYS Do

```javascript
// ✅ Sanitize input
const x = Math.max(0, Math.min(CANVAS_WIDTH, validatedX));

// ✅ Validate data
if (typeof type === 'string' && validTypes.includes(type)) {
    placeObject(type, x, y);
}

// ✅ Use Content Security Policy (in HTML)
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">

// ✅ Check dependencies for vulnerabilities
npm audit
```

---

## 📊 Performance Best Practices

### Do's

```javascript
// ✅ Limit object count
const MAX_OBJECTS = 100;
if (placedObjects.length >= MAX_OBJECTS) {
    alert('Maximum objects reached');
    return;
}

// ✅ Use static bodies when possible
const platform = Bodies.rectangle(x, y, width, height, {
    isStatic: true  // No physics calculations needed
});

// ✅ Reuse objects/functions
// Store function references
const updateStatus = document.getElementById('status').textContent;
```

### Don'ts

```javascript
// ❌ Creating objects in loops
for (let i = 0; i < 1000; i++) {
    const obj = { x: i, y: i };  // Creates 1000 objects
}

// ❌ Unnecessary physics complexity
engine.positionIterations = 100;  // Default 6 is usually fine

// ❌ Frequent DOM queries
for (let i = 0; i < 100; i++) {
    document.getElementById('status').textContent = i;  // Query every loop
}
```

---

## 🎯 Task-Specific Instructions

### Task: Add New Object Type

**Files to Modify**:
1. `index.html` - Add button
2. `style.css` - Style button (optional, inherits)
3. `game.js` - Add case to `placeObject()`
4. `docs/gameplay.md` - Document new object
5. `docs/technical.md` - Update API reference

**Template**:
```javascript
// In game.js, add to placeObject() switch
case 'newObject':
    body = Bodies.rectangle(x, y, width, height, {
        restitution: 0.5,   // Bounciness (0-1)
        density: 0.05,      // Mass
        friction: 0.1,      // Surface friction
        render: {
            fillStyle: '#COLOR'
        }
    });
    break;
```

**Testing**:
- Place multiple instances
- Run simulation and observe physics
- Test reset functionality
- Verify collision detection
- Check performance with many instances

---

### Task: Modify Physics Behavior

**Common Changes**:

```javascript
// Adjust gravity
world.gravity.y = 1.5;  // Stronger gravity

// Change doom threshold
if (velocity > 5) {  // Require faster impact
    npcDoomed = true;
    doomNPC();
}

// Modify object properties
case 'ball':
    body = Bodies.circle(x, y, 20, {
        restitution: 0.9,  // More bouncy
        density: 0.08,     // Heavier
        // ...
    });
```

**Considerations**:
- How does this affect existing contraptions?
- Does it make the game easier or harder?
- Is it still fun?
- Does it maintain 60 FPS?

---

### Task: Add UI Element

**Files to Modify**:
1. `index.html` - Add HTML structure
2. `style.css` - Add styling
3. `game.js` - Add event listeners and logic

**Example: Add Object Counter**:

```html
<!-- index.html -->
<div id="objectCounter" class="object-counter">Objects: 0</div>
```

```css
/* style.css */
.object-counter {
    padding: 10px;
    background: #e9ecef;
    border-radius: 5px;
    font-weight: 500;
}
```

```javascript
// game.js
function updateObjectCounter() {
    document.getElementById('objectCounter').textContent = 
        `Objects: ${placedObjects.length}`;
}

// Call after placement
function placeObject(type, x, y) {
    // ... existing code
    updateObjectCounter();
}
```

---

### Task: Implement Save/Load

**Recommended Approach**: LocalStorage

```javascript
function saveContraption(name) {
    const design = {
        version: 1,
        timestamp: Date.now(),
        objects: placedObjects.map(obj => ({
            type: obj.label || detectType(obj),
            x: obj.position.x,
            y: obj.position.y,
            angle: obj.angle
        }))
    };
    
    localStorage.setItem(`contraption_${name}`, JSON.stringify(design));
    updateStatus(`Saved: ${name}`);
}

function loadContraption(name) {
    const data = localStorage.getItem(`contraption_${name}`);
    if (!data) {
        updateStatus(`Not found: ${name}`);
        return;
    }
    
    const design = JSON.parse(data);
    clearAll();
    
    design.objects.forEach(obj => {
        placeObject(obj.type, obj.x, obj.y);
        if (obj.angle !== 0) {
            // Handle rotated objects
        }
    });
    
    updateStatus(`Loaded: ${name}`);
}

function listSavedContraptions() {
    const keys = Object.keys(localStorage);
    return keys.filter(k => k.startsWith('contraption_'))
               .map(k => k.replace('contraption_', ''));
}
```

**UI Addition**:
```html
<input type="text" id="saveName" placeholder="Contraption name">
<button id="saveBtn">💾 Save</button>
<button id="loadBtn">📂 Load</button>
<select id="savedList"></select>
```

---

### Task: Add Sound Effects

**Files Needed**:
```
sounds/
├── place.mp3       # Object placement
├── collision.mp3   # Object collision
├── doom.mp3        # NPC doom
└── ui.mp3          # UI interaction
```

**Implementation**:
```javascript
// Initialize sounds
const sounds = {
    place: new Audio('sounds/place.mp3'),
    collision: new Audio('sounds/collision.mp3'),
    doom: new Audio('sounds/doom.mp3'),
    ui: new Audio('sounds/ui.mp3')
};

let soundEnabled = true;

function playSound(name) {
    if (soundEnabled && sounds[name]) {
        sounds[name].currentTime = 0;  // Restart if playing
        sounds[name].play().catch(e => {
            console.log('Sound play failed:', e);
        });
    }
}

// Use in code
function placeObject(type, x, y) {
    // ... existing code
    playSound('place');
}

function doomNPC() {
    // ... existing code
    playSound('doom');
}
```

**UI Addition**:
```html
<button id="soundToggle" class="action-btn">
    🔊 Sound: ON
</button>
```

```javascript
document.getElementById('soundToggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    document.getElementById('soundToggle').textContent = 
        soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
});
```

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Objects Passing Through Static Bodies

**Cause**: High velocity tunneling

**Solution**:
```javascript
// Increase constraint iterations
engine.positionIterations = 10;  // Default: 6
engine.velocityIterations = 6;   // Default: 4

// Or enable CCD on specific bodies
Body.setCCD(body, true);  // Continuous Collision Detection
```

---

### Pitfall 2: Reset Not Working Correctly

**Cause**: Not storing original position/angle

**Solution**:
```javascript
// ALWAYS store on creation
body.originalPosition = { x: body.position.x, y: body.position.y };
body.originalAngle = body.angle;

// Then restore properly
function resetMachine() {
    placedObjects.forEach(obj => {
        if (obj.originalPosition) {
            Body.setPosition(obj, obj.originalPosition);
            Body.setAngle(obj, obj.originalAngle || 0);
            Body.setVelocity(obj, { x: 0, y: 0 });
            Body.setAngularVelocity(obj, 0);
        }
    });
}
```

---

### Pitfall 3: Memory Leaks

**Cause**: Not removing bodies/constraints properly

**Solution**:
```javascript
function clearAll() {
    // Remove from world first
    placedObjects.forEach(obj => {
        Composite.remove(world, obj);
    });
    placedConstraints.forEach(constraint => {
        Composite.remove(world, constraint);
    });
    
    // Then clear arrays
    placedObjects = [];
    placedConstraints = [];
}
```

---

### Pitfall 4: Poor Performance with Many Objects

**Cause**: O(n²) collision detection

**Solution**:
```javascript
// Limit objects
const MAX_OBJECTS = 100;

// Use spatial partitioning (advanced)
// Or implement object pooling

// Optimize render (if custom rendering)
render.options.showPerformance = true;  // Monitor FPS
```

---

## 📚 Additional Resources

### Matter.js Documentation
- [Official Docs](https://brm.io/matter-js/docs/)
- [Examples](https://brm.io/matter-js/)
- [GitHub](https://github.com/liabru/matter-js)

### Web APIs
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### Game Development
- [Game Programming Patterns](http://gameprogrammingpatterns.com/)
- [HTML5 Game Development](https://developer.mozilla.org/en-US/docs/Games)

---

## 🎓 Learning from the Codebase

### Key Takeaways

1. **Simplicity**: Vanilla JS can build complex games without frameworks
2. **Physics**: Let the engine handle complexity (Matter.js)
3. **State**: Simple variables can manage game state effectively
4. **Patterns**: Factory, Observer, Memento patterns naturally emerge
5. **Performance**: Static bodies and smart optimizations maintain 60 FPS

### Code Examples to Study

**Factory Pattern in `placeObject()`**:
```javascript
function placeObject(type, x, y) {
    let body;
    
    switch(type) {
        case 'ball': body = createBall(); break;
        case 'box': body = createBox(); break;
        // ... centralizes creation logic
    }
}
```

**Observer Pattern in Collision Detection**:
```javascript
Events.on(engine, 'collisionStart', (event) => {
    // Decoupled collision handling
});
```

**Memento Pattern in Reset System**:
```javascript
// Store state on creation
body.originalPosition = { x, y };

// Restore later
Body.setPosition(body, body.originalPosition);
```

---

## 🤝 Contributing Guidelines

### Before Starting

1. Read all documentation in `docs/`
2. Understand the codebase structure
3. Check `docs/gameplan.md` for planned features
4. Test the game yourself to understand mechanics

### Making Changes

1. **One feature/fix per PR**
2. **Minimal changes** - don't refactor unnecessarily
3. **Test thoroughly** - manual testing in browser
4. **Update docs** - keep documentation in sync
5. **Clear commits** - descriptive commit messages

### Code Review Checklist

- [ ] Code follows existing style
- [ ] No console.log() left in code
- [ ] Performance is acceptable (60 FPS)
- [ ] Works in Chrome, Firefox, Safari
- [ ] Documentation updated
- [ ] No security issues
- [ ] Backward compatible (doesn't break existing contraptions)

---

## 🎯 Quick Reference

### Frequently Used Code Snippets

**Create a Body**:
```javascript
const body = Bodies.rectangle(x, y, width, height, {
    restitution: 0.5,
    density: 0.05,
    isStatic: false,
    render: { fillStyle: '#COLOR' }
});
```

**Add to World**:
```javascript
Composite.add(world, body);
placedObjects.push(body);
```

**Remove from World**:
```javascript
Composite.remove(world, body);
placedObjects = placedObjects.filter(obj => obj !== body);
```

**Apply Force**:
```javascript
Body.applyForce(body, body.position, { x: 0.1, y: -0.2 });
```

**Update UI**:
```javascript
document.getElementById('status').textContent = 'Message';
```

---

## 📞 Getting Help

### When Stuck

1. **Check Documentation**: `docs/technical.md` has detailed API reference
2. **Search Issues**: Similar problems may have been solved
3. **Matter.js Docs**: Physics-related issues
4. **Console Logs**: Add `console.log()` to debug
5. **Browser DevTools**: Inspect elements, check network, profile performance

### Debugging Tips

```javascript
// Log collision events
Events.on(engine, 'collisionStart', (event) => {
    console.log('Collision:', event.pairs);
});

// Log object placement
function placeObject(type, x, y) {
    console.log(`Placing ${type} at (${x}, ${y})`);
}

// Monitor performance
setInterval(() => {
    console.log(`FPS: ${engine.timing.fps.toFixed(1)}`);
}, 1000);
```

---

**Last Updated**: February 2026  
**Version**: 1.0  
**Maintainer**: GitHub Copilot for MW-GC Team

This document is your comprehensive guide to working on Doomberg-Machine. Keep it updated as the codebase evolves!
