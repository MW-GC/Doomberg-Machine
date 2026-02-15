// Matter.js module aliases
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Body = Matter.Body,
      Query = Matter.Query;

// Game constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 20;
const NPC_LEG_OFFSET = 35; // Distance from body center to leg center
const NPC_HALF_LEG_HEIGHT = 10; // Half the height of NPC legs
const MAX_HISTORY_SIZE = 50; // Maximum undo/redo history entries to prevent memory leaks

// Object labels
const LABEL_SEESAW_PIVOT = 'seesaw-pivot';
const LABEL_SEESAW_PLANK = 'seesaw-plank';

// Physics constants
const POSITION_ITERATIONS = 10; // Increased from default 6 to reduce tunneling
const VELOCITY_ITERATIONS = 6;  // Increased from default 4 to reduce tunneling
const DOOM_VELOCITY_THRESHOLD = 2; // Minimum velocity to doom NPC
const MAX_OBJECTS = 100; // Maximum number of objects allowed for performance

/**
 * Normalize an angle in radians to the range [0, 2π).
 * @param {number} angle
 * @returns {number}
 */
function normalizeAngle(angle) {
    const twoPi = 2 * Math.PI;
    let result = angle % twoPi;
    if (result < 0) {
        result += twoPi;
    }
    return result;
}

const DEFAULT_RAMP_ANGLE = normalizeAngle(-17 * Math.PI / 180); // -17 degrees, normalized to [0, 2π)
const ROTATION_INCREMENT = Math.PI / 12; // 15 degrees per key press

// Game variables
let engine;
let render;
let runner;
let world;
let canvas;
let selectedTool = null;
let isRunning = false;
let isPaused = false;
let isSlowMotion = false;
let npc;
let npcDoomed = false;
let placedObjects = [];
let placedConstraints = [];
let currentRampAngle = DEFAULT_RAMP_ANGLE;
let seesawIdCounter = 0; // Counter for unique seesaw IDs

// Undo/Redo system
let actionHistory = [];
let historyIndex = -1;

// Scoring system
let gameStartTime = 0;
let doomTime = 0;
let collisionCount = 0;
let objectTypesUsed = new Set();
let currentScore = 0;
let currentStars = 0;



// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    
    // Create engine with improved iteration settings to prevent tunneling
    engine = Engine.create();
    world = engine.world;
    world.gravity.y = 1;
    
    // Increase iterations to prevent fast objects from tunneling through static bodies
    engine.positionIterations = POSITION_ITERATIONS;
    engine.velocityIterations = VELOCITY_ITERATIONS;
    
    // Create renderer
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            wireframes: false,
            background: '#87CEEB'
        }
    });
    
    // Create ground
    const ground = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - GROUND_HEIGHT / 2, CANVAS_WIDTH, GROUND_HEIGHT, {
        isStatic: true,
        render: {
            fillStyle: '#8B4513'
        }
    });
    Composite.add(world, ground);
    
    // Create walls
    const leftWall = Bodies.rectangle(5, CANVAS_HEIGHT / 2, 10, CANVAS_HEIGHT, {
        isStatic: true,
        render: {
            fillStyle: '#696969'
        }
    });
    const rightWall = Bodies.rectangle(CANVAS_WIDTH - 5, CANVAS_HEIGHT / 2, 10, CANVAS_HEIGHT, {
        isStatic: true,
        render: {
            fillStyle: '#696969'
        }
    });
    Composite.add(world, [leftWall, rightWall]);
    
    // Create NPC
    createNPC();
    
    // Setup mouse control for placing objects
    setupMouseControl();
    
    // Setup button listeners
    setupEventListeners();
    
    // Setup collision detection (only once)
    Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        
        pairs.forEach(pair => {
            // Track all collisions during game for combo scoring
            if (isRunning) {
                collisionCount++;
            }
            
            if ((pair.bodyA.label === 'npc' || pair.bodyB.label === 'npc') && !npcDoomed) {
                // Check if collision is significant based on the other body's velocity
                const otherBody = pair.bodyA.label === 'npc' ? pair.bodyB : pair.bodyA;
                const velocity = Math.abs(otherBody.velocity.x) + Math.abs(otherBody.velocity.y);
                
                if (velocity > DOOM_VELOCITY_THRESHOLD) {
                    npcDoomed = true;
                    doomTime = (Date.now() - gameStartTime) / 1000; // Time in seconds
                    doomNPC();
                }
            }
        });
    });
    
    // Start render after all bodies are created; runner will be started in runMachine()
    Render.run(render);
    
    updateStatus('Ready to build! Select an object and click to place it.');
}

function createNPC() {
    // Create NPC as a compound body (head + body)
    // Position NPC standing on the ground
    const npcX = CANVAS_WIDTH - 100;
    // Calculate Y position so NPC stands on ground (ground top is at CANVAS_HEIGHT - GROUND_HEIGHT)
    // Legs are positioned NPC_LEG_OFFSET pixels below body center
    const groundTop = CANVAS_HEIGHT - GROUND_HEIGHT;
    const npcY = groundTop - NPC_LEG_OFFSET - NPC_HALF_LEG_HEIGHT;
    
    // Body
    const body = Bodies.rectangle(npcX, npcY, 30, 50, {
        render: {
            fillStyle: '#FF0000'
        }
    });
    
    // Head
    const head = Bodies.circle(npcX, npcY - 35, 15, {
        render: {
            fillStyle: '#FFB6C1'
        }
    });
    
    // Arms
    const leftArm = Bodies.rectangle(npcX - 20, npcY, 5, 30, {
        render: {
            fillStyle: '#FFB6C1'
        }
    });
    
    const rightArm = Bodies.rectangle(npcX + 20, npcY, 5, 30, {
        render: {
            fillStyle: '#FFB6C1'
        }
    });
    
    // Legs
    const leftLeg = Bodies.rectangle(npcX - 10, npcY + 35, 8, 20, {
        render: {
            fillStyle: '#0000FF'
        }
    });
    
    const rightLeg = Bodies.rectangle(npcX + 10, npcY + 35, 8, 20, {
        render: {
            fillStyle: '#0000FF'
        }
    });
    
    npc = Body.create({
        parts: [body, head, leftArm, rightArm, leftLeg, rightLeg],
        isStatic: true,
        label: 'npc'
    });
    
    Composite.add(world, npc);
}

function setupMouseControl() {
    canvas.addEventListener('click', (event) => {
        if (isRunning || !selectedTool) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        placeObject(selectedTool, x, y);
    });
    
    // Right-click to delete objects
    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        if (isRunning) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        deleteObjectAtPosition(x, y);
    });
}

function setupEventListeners() {
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTool = btn.dataset.tool;
            // Reset ramp angle when selecting ramp tool
            if (selectedTool === 'ramp') {
                currentRampAngle = DEFAULT_RAMP_ANGLE;
            }
            // Extract just the text part without emoji
            const toolName = selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1);
            updateStatus(`Selected: ${toolName}. Click on canvas to place.`);
        });
    });
    
    // Action buttons
    document.getElementById('runBtn').addEventListener('click', runMachine);
    document.getElementById('resetBtn').addEventListener('click', resetMachine);
    document.getElementById('clearBtn').addEventListener('click', clearAll);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('slowMotionBtn').addEventListener('click', toggleSlowMotion);
    
    // Keyboard controls for rotating ramps and undo/redo
    document.addEventListener('keydown', (event) => {
        // Undo/Redo shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
        if ((event.ctrlKey || event.metaKey) && !isRunning) {
            if (event.shiftKey && (event.key === 'z' || event.key === 'Z')) {
                event.preventDefault();
                redo();
                return;
            } else if (event.key === 'z' || event.key === 'Z') {
                event.preventDefault();
                undo();
                return;
            } else if (event.key === 'y' || event.key === 'Y') {
                event.preventDefault();
                redo();
                return;
            }
        }
        
        // Space key for pause/unpause
        if (event.key === ' ') {
            if (isRunning) {
                event.preventDefault(); // Prevent page scroll
                togglePause();
            }
            return;
        }
      
        // Ramp rotation controls
        if (isRunning || selectedTool !== 'ramp') return;
        
        if (event.key === 'q' || event.key === 'Q') {
            // Rotate counter-clockwise
            rotateRamp(-ROTATION_INCREMENT);
        } else if (event.key === 'e' || event.key === 'E') {
            // Rotate clockwise
            rotateRamp(ROTATION_INCREMENT);
        }
    });
}

function rotateRamp(angleChange) {
    currentRampAngle += angleChange;
    // Normalize angle to keep it within [0, 2π) range
    currentRampAngle = normalizeAngle(currentRampAngle);
    // Display angle in degrees, wrapped to [0, 359]
    const degrees = Math.round(currentRampAngle * 180 / Math.PI) % 360;
    updateStatus(`Ramp angle: ${degrees}°`);
}

function recordAction(action) {
    // Clear any future history if we're not at the end
    actionHistory = actionHistory.slice(0, historyIndex + 1);
    actionHistory.push(action);
    historyIndex++;
    
    // Prune old history if it exceeds MAX_HISTORY_SIZE
    // Keep only the most recent MAX_HISTORY_SIZE entries
    if (actionHistory.length > MAX_HISTORY_SIZE) {
        const overflow = actionHistory.length - MAX_HISTORY_SIZE;
        actionHistory = actionHistory.slice(overflow);
        historyIndex -= overflow;
    }
    
    updateUndoRedoButtons();
}

function undo() {
    if (isRunning || historyIndex < 0) {
        if (historyIndex < 0) {
            updateStatus('Nothing to undo');
        }
        return;
    }
    
    const action = actionHistory[historyIndex];
    revertAction(action);
    historyIndex--;
    updateUndoRedoButtons();
    updateStatus('Undone');
}

function redo() {
    if (isRunning || historyIndex >= actionHistory.length - 1) {
        if (historyIndex >= actionHistory.length - 1) {
            updateStatus('Nothing to redo');
        }
        return;
    }
    
    historyIndex++;
    const action = actionHistory[historyIndex];
    applyAction(action);
    updateUndoRedoButtons();
    updateStatus('Redone');
}

/**
 * Helper function to create a seesaw with all its components
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} seesawId - Unique ID for the seesaw (if null, generates new one)
 * @returns {{pivot: Body, plank: Body, constraint: Constraint}} The created seesaw components
 */
function createSeesaw(x, y, seesawId = null) {
    // Use provided ID or generate new one
    if (seesawId === null) {
        seesawId = seesawIdCounter++;
    }
    
    const pivot = Bodies.rectangle(x, y, 10, 40, {
        isStatic: true,
        label: LABEL_SEESAW_PIVOT,
        render: { fillStyle: '#AA8976' }
    });
    
    const plank = Bodies.rectangle(x, y - 20, 120, 10, {
        density: 0.05,
        label: LABEL_SEESAW_PLANK,
        render: { fillStyle: '#EAAC8B' }
    });
    
    // Store original positions
    pivot.originalPosition = { x: x, y: y };
    pivot.originalAngle = 0;
    pivot.seesawId = seesawId;
    
    plank.originalPosition = { x: x, y: y - 20 };
    plank.originalAngle = 0;
    plank.seesawId = seesawId;
    
    // Create constraint
    const constraint = Matter.Constraint.create({
        bodyA: pivot,
        bodyB: plank,
        length: 0,
        stiffness: 0.9
    });
    constraint.seesawId = seesawId;
    
    // Store original constraint properties for reset
    constraint.originalStiffness = constraint.stiffness;
    constraint.originalLength = constraint.length;
    
    // Add to world
    Composite.add(world, [pivot, plank, constraint]);
    placedObjects.push(pivot, plank);
    placedConstraints.push(constraint);
    
    return { pivot, plank, constraint };
}

/**
 * Helper function to remove a seesaw by its ID
 * @param {number} seesawId - The unique ID of the seesaw to remove
 */
function removeSeesaw(seesawId) {
    const pivot = placedObjects.find(obj => obj.label === LABEL_SEESAW_PIVOT && obj.seesawId === seesawId);
    const plank = placedObjects.find(obj => obj.label === LABEL_SEESAW_PLANK && obj.seesawId === seesawId);
    const constraint = placedConstraints.find(c => c.seesawId === seesawId);
    
    if (pivot) {
        Composite.remove(world, pivot);
        placedObjects = placedObjects.filter(obj => obj !== pivot);
    }
    if (plank) {
        Composite.remove(world, plank);
        placedObjects = placedObjects.filter(obj => obj !== plank);
    }
    if (constraint) {
        Composite.remove(world, constraint);
        placedConstraints = placedConstraints.filter(c => c !== constraint);
    }
}

function revertAction(action) {
    if (action.type === 'place') {
        // Remove the placed object(s)
        if (action.objectType === 'seesaw') {
            // Find and remove seesaw parts by seesawId
            removeSeesaw(action.seesawId);
        } else {
            // Remove single object
            const body = action.body;
            if (body && placedObjects.includes(body)) {
                Composite.remove(world, body);
                placedObjects = placedObjects.filter(obj => obj !== body);
            }
        }
    } else if (action.type === 'delete') {
        // Re-add the deleted object(s)
        if (action.objectType === 'seesaw') {
            // Recreate seesaw
            const { pivot, plank, constraint } = createSeesaw(action.x, action.y, action.seesawId);
            
            // Store references in action for potential future operations
            action.pivot = pivot;
            action.plank = plank;
            action.constraint = constraint;
        } else {
            // Recreate single object
            const body = recreateBody(action.objectType, action.x, action.y, action.angle);
            if (body) {
                body.originalPosition = { x: action.x, y: action.y };
                body.originalAngle = action.angle;
                Composite.add(world, body);
                placedObjects.push(body);
                action.body = body; // Store reference for future operations
            }
        }
    }
    updateObjectCounter();
}

function applyAction(action) {
    if (action.type === 'place') {
        // Re-add the object(s)
        if (action.objectType === 'seesaw') {
            // Recreate seesaw
            const { pivot, plank, constraint } = createSeesaw(action.x, action.y, action.seesawId);
            
            // Store references in action
            action.pivot = pivot;
            action.plank = plank;
            action.constraint = constraint;
        } else {
            // Recreate single object
            const body = recreateBody(action.objectType, action.x, action.y, action.angle);
            if (body) {
                body.originalPosition = { x: action.x, y: action.y };
                body.originalAngle = action.angle;
                Composite.add(world, body);
                placedObjects.push(body);
                action.body = body; // Store reference
            }
        }
    } else if (action.type === 'delete') {
        // Remove the object(s) again
        if (action.objectType === 'seesaw') {
            removeSeesaw(action.seesawId);
        } else {
            const body = action.body;
            if (body && placedObjects.includes(body)) {
                Composite.remove(world, body);
                placedObjects = placedObjects.filter(obj => obj !== body);
            }
        }
    }
    updateObjectCounter();
}

function recreateBody(type, x, y, angle) {
    let body;
    
    switch(type) {
        case 'ball':
            body = Bodies.circle(x, y, 20, {
                restitution: 0.8,
                density: 0.04,
                render: { fillStyle: '#FF6B6B' }
            });
            break;
        case 'box':
            body = Bodies.rectangle(x, y, 40, 40, {
                restitution: 0.3,
                density: 0.05,
                render: { fillStyle: '#A0522D' }
            });
            break;
        case 'domino':
            body = Bodies.rectangle(x, y, 10, 60, {
                restitution: 0.1,
                density: 0.05,
                render: { fillStyle: '#4ECDC4' }
            });
            break;
        case 'ramp':
            body = Bodies.rectangle(x, y, 120, 10, {
                isStatic: true,
                angle: angle,
                render: { fillStyle: '#95E1D3' }
            });
            break;
        case 'platform':
            body = Bodies.rectangle(x, y, 150, 10, {
                isStatic: true,
                render: { fillStyle: '#F38181' }
            });
            break;
    }
    
    if (body && angle) {
        Body.setAngle(body, angle);
    }
    
    return body;
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.disabled = historyIndex < 0 || isRunning;
    }
    if (redoBtn) {
        redoBtn.disabled = historyIndex >= actionHistory.length - 1 || isRunning;
    }
}

function placeObject(type, x, y) {
    // Check if we've reached the maximum object limit
    if (placedObjects.length >= MAX_OBJECTS) {
        updateStatus(`Maximum object limit (${MAX_OBJECTS}) reached! Please remove some objects first.`);
        alert(`Maximum object limit (${MAX_OBJECTS}) reached!\n\nFor optimal performance, please clear some objects before adding more.`);
        return;
    }
    
    // Track object type for scoring
    objectTypesUsed.add(type);
    
    let body;
    
    switch(type) {
        case 'ball':
            body = Bodies.circle(x, y, 20, {
                restitution: 0.8,
                density: 0.04,
                render: {
                    fillStyle: '#FF6B6B'
                }
            });
            break;
            
        case 'box':
            body = Bodies.rectangle(x, y, 40, 40, {
                restitution: 0.3,
                density: 0.05,
                render: {
                    fillStyle: '#A0522D'
                }
            });
            break;
            
        case 'domino':
            body = Bodies.rectangle(x, y, 10, 60, {
                restitution: 0.1,
                density: 0.05,
                render: {
                    fillStyle: '#4ECDC4'
                }
            });
            break;
            
        case 'ramp':
            body = Bodies.rectangle(x, y, 120, 10, {
                isStatic: true,
                angle: currentRampAngle,
                render: {
                    fillStyle: '#95E1D3'
                }
            });
            break;
            
        case 'platform':
            body = Bodies.rectangle(x, y, 150, 10, {
                isStatic: true,
                render: {
                    fillStyle: '#F38181'
                }
            });
            break;
            
        case 'seesaw':
            // Create seesaw using helper function
            // createSeesaw already adds pivot, plank, and constraint to the world
            // and tracks them in placedObjects / placedConstraints.
            const { pivot, plank, constraint } = createSeesaw(x, y);
            const seesawId = pivot.seesawId; // Get the generated ID
            
            // Record action for undo/redo
            recordAction({
                type: 'place',
                objectType: 'seesaw',
                x: x,
                y: y,
                angle: 0,
                seesawId: seesawId,
                pivot: pivot,
                plank: plank,
                constraint: constraint
            });
            
            updateStatus(`Placed seesaw at (${Math.round(x)}, ${Math.round(y)})`);
            updateObjectCounter();
            return;
    }
    
    if (body) {
        // Store original position and angle for reset
        body.originalPosition = { x: body.position.x, y: body.position.y };
        body.originalAngle = body.angle;
        
        Composite.add(world, body);
        placedObjects.push(body);
        
        // Record action for undo/redo
        recordAction({
            type: 'place',
            objectType: type,
            x: body.position.x,
            y: body.position.y,
            angle: body.angle,
            body: body
        });
        
        updateStatus(`Placed ${type} at (${Math.round(x)}, ${Math.round(y)})`);
        updateObjectCounter();
    }
}

function runMachine() {
    if (isRunning) return;
    
    isRunning = true;
    isPaused = false;
    isSlowMotion = false;
    npcDoomed = false;
    
    // Reset scoring metrics
    gameStartTime = Date.now();
    doomTime = 0;
    collisionCount = 0;
    currentScore = 0;
    currentStars = 0;
    
    // Make NPC dynamic
    Body.setStatic(npc, false);
    
    // Reset timeScale to normal
    applyTimeScale();
    
    // Create or reuse runner
    if (!runner) {
        runner = Runner.create();
    }
    Runner.run(runner, engine);
    
    document.getElementById('runBtn').disabled = true;

    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('slowMotionBtn').disabled = false;
    
    // Ensure slow-motion button reflects state
    document.getElementById('slowMotionBtn').classList.remove('active');
  
    updateUndoRedoButtons();
    updatePauseButtonText();
    updateSlowMotionButtonText();
    updateStatus('Machine running! Watch the chaos unfold...');
}

function applyTimeScale() {
    if (isPaused) {
        engine.timing.timeScale = 0;
    } else if (isSlowMotion) {
        engine.timing.timeScale = 0.25;
    } else {
        engine.timing.timeScale = 1.0;
    }
}

function togglePause() {
    if (!isRunning) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        applyTimeScale();
        updateStatus('Simulation paused. Press Space or click Pause to resume.');
    } else {
        applyTimeScale();
        updateStatus('Machine running! Watch the chaos unfold...');
    }
    
    updatePauseButtonText();
}

function toggleSlowMotion() {
    if (!isRunning) return;
    
    isSlowMotion = !isSlowMotion;
    
    // Update UI to reflect state
    const slowMotionBtn = document.getElementById('slowMotionBtn');
    if (isSlowMotion) {
        slowMotionBtn.classList.add('active');
    } else {
        slowMotionBtn.classList.remove('active');
    }
    
    // Apply timeScale if not paused
    if (!isPaused) {
        applyTimeScale();
    }
    
    // Update status message
    if (isSlowMotion) {
        if (isPaused) {
            updateStatus('Slow motion will be used when simulation resumes.');
        } else {
            updateStatus('Slow motion enabled (25% speed).');
        }
    } else {
        if (isPaused) {
            updateStatus('Normal speed will be used when simulation resumes.');
        } else {
            updateStatus('Slow motion disabled. Running at normal speed.');
        }
    }
    
    updateSlowMotionButtonText();
}

function updatePauseButtonText() {
    const pauseBtn = document.getElementById('pauseBtn');
    if (isPaused) {
        pauseBtn.textContent = '▶️ Play';
    } else {
        pauseBtn.textContent = '⏸️ Pause';
    }
}

function updateSlowMotionButtonText() {
    const slowMotionBtn = document.getElementById('slowMotionBtn');
    if (slowMotionBtn.classList.contains('active')) {
        slowMotionBtn.textContent = '🐌 Slow-Mo: ON';
    } else {
        slowMotionBtn.textContent = '🐌 Slow-Mo';
    }
}

function doomNPC() {
    const doomStatus = document.getElementById('doomStatus');
    doomStatus.textContent = 'NPC Status: DOOMED! 💀☠️';
    doomStatus.classList.add('doomed');
    updateStatus('SUCCESS! The NPC has been doomed! 💀');
    
    // Change NPC color to indicate doom
    npc.parts.forEach(part => {
        part.render.fillStyle = '#000000';
    });
    
    // Celebrate with a bit of extra force
    Body.applyForce(npc, npc.position, { x: 0.05, y: -0.1 });
    
    // Calculate and display score after a short delay
    setTimeout(() => {
        calculateAndDisplayScore();
    }, 1000);
}

function calculateAndDisplayScore() {
    let score = 0;
    let breakdown = [];
    
    // Base doom score
    if (npcDoomed) {
        score += 1000;
        breakdown.push({ label: 'NPC Doomed', points: 1000 });
    }
    
    // Efficiency bonus (fewer objects = higher score)
    // Max bonus 500 for 1 object, decreases by 20 per object
    const objectCount = placedObjects.length;
    const efficiencyBonus = Math.max(0, 500 - ((objectCount - 1) * 20));
    score += efficiencyBonus;
    breakdown.push({ label: `Efficiency (${objectCount} objects)`, points: efficiencyBonus });
    
    // Speed bonus (faster doom = higher score)
    // Max bonus 500 for doom under 1 second, decreases by 50 per second
    const speedBonus = Math.max(0, Math.round(500 - (doomTime * 50)));
    score += speedBonus;
    breakdown.push({ label: `Speed (${doomTime.toFixed(1)}s)`, points: speedBonus });
    
    // Variety bonus (different object types used)
    const varietyCount = objectTypesUsed.size;
    const varietyBonus = varietyCount * 100;
    score += varietyBonus;
    breakdown.push({ label: `Variety (${varietyCount} types)`, points: varietyBonus });
    
    // Combo multiplier based on collision chains
    // More collisions = more chain reactions
    let comboMultiplier = 1.0;
    if (collisionCount >= 5) {
        comboMultiplier = 1.1 + Math.min((collisionCount - 5) * 0.05, 0.5); // Max 1.6x
        breakdown.push({ label: `Combo Chain (${collisionCount} collisions)`, points: 0, multiplier: comboMultiplier });
    }
    
    // Apply combo multiplier
    score = Math.round(score * comboMultiplier);
    
    // Calculate star rating
    let stars = 1;
    if (score >= 2000) stars = 2;
    if (score >= 2800) stars = 3;
    
    currentScore = score;
    currentStars = stars;
    
    // Display score modal
    showScoreModal(score, stars, breakdown);
}

function showScoreModal(score, stars, breakdown) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('scoreModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'scoreModal';
        modal.className = 'score-modal';
        modal.innerHTML = `
            <div class="score-modal-content">
                <div class="score-header">
                    <h2>Mission Complete!</h2>
                    <div class="score-stars" id="scoreStars"></div>
                </div>
                <div class="score-total" id="scoreTotal"></div>
                <div class="score-breakdown" id="scoreBreakdown"></div>
                <button id="closeScoreModal" class="action-btn">Continue Building</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal handler
        document.getElementById('closeScoreModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Update modal content
    const starsContainer = document.getElementById('scoreStars');
    starsContainer.innerHTML = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    
    const totalContainer = document.getElementById('scoreTotal');
    totalContainer.innerHTML = `<div class="score-number">${score.toLocaleString()}</div><div class="score-label">Total Score</div>`;
    
    const breakdownContainer = document.getElementById('scoreBreakdown');
    let breakdownHTML = '<table class="score-table">';
    breakdown.forEach(item => {
        if (item.multiplier) {
            breakdownHTML += `<tr><td>${item.label}</td><td class="multiplier">×${item.multiplier.toFixed(2)}</td></tr>`;
        } else {
            breakdownHTML += `<tr><td>${item.label}</td><td>+${item.points}</td></tr>`;
        }
    });
    breakdownHTML += '</table>';
    breakdownContainer.innerHTML = breakdownHTML;
    
    // Show modal with animation
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function resetMachine() {
    if (!isRunning) return;
    
    // Stop the runner
    if (runner) {
        Runner.stop(runner);
    }
    
    // Remove NPC and recreate it
    Composite.remove(world, npc);
    createNPC();
    
    // Reset all dynamic bodies to their original positions
    placedObjects.forEach(obj => {
        if (obj.type === 'body' && !obj.isStatic && obj.originalPosition) {
            Body.setPosition(obj, obj.originalPosition);
            Body.setVelocity(obj, { x: 0, y: 0 });
            Body.setAngularVelocity(obj, 0);
            Body.setAngle(obj, obj.originalAngle || 0);
        }
    });
    
    // Reset all constraints to their original properties
    placedConstraints.forEach(constraint => {
        if (constraint.originalStiffness !== undefined) {
            constraint.stiffness = constraint.originalStiffness;
        }
        if (constraint.originalLength !== undefined) {
            constraint.length = constraint.originalLength;
        }
    });
    // Reset timeScale
    engine.timing.timeScale = 1.0;
    
    isRunning = false;
    isPaused = false;
    isSlowMotion = false;
    npcDoomed = false;
    document.getElementById('runBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('slowMotionBtn').disabled = true;
    document.getElementById('slowMotionBtn').classList.remove('active');
    updateUndoRedoButtons();
    updatePauseButtonText();
    updateSlowMotionButtonText();
    
    const doomStatus = document.getElementById('doomStatus');
    doomStatus.textContent = 'NPC Status: Alive 😊';
    doomStatus.classList.remove('doomed');
    
    updateStatus('Machine reset! Make adjustments and try again.');
}

function clearAll() {
    // Remove all placed objects
    placedObjects.forEach(obj => {
        Composite.remove(world, obj);
    });
    placedConstraints.forEach(constraint => {
        Composite.remove(world, constraint);
    });
    placedObjects = [];
    placedConstraints = [];
    
    // Clear undo/redo history
    actionHistory = [];
    historyIndex = -1;
    updateUndoRedoButtons();
    
    // Reset scoring metrics
    objectTypesUsed.clear();
    collisionCount = 0;
    currentScore = 0;
    currentStars = 0;
    
    // Reset if running
    if (isRunning) {
        resetMachine();
    }
    
    updateStatus('All objects cleared! Start building your machine.');
    updateObjectCounter();
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

/**
 * Update the object counter display to show the current number of placed objects.
 * Note: Seesaws count as 2 objects since they consist of both a pivot and plank body.
 */
function updateObjectCounter() {
    document.getElementById('objectCounter').textContent = `Objects: ${placedObjects.length}`;
}

function deleteObjectAtPosition(x, y) {
    // Find all bodies at this position
    const bodies = Query.point(placedObjects, { x, y });
    
    if (bodies.length > 0) {
        // Delete the first body found
        const bodyToDelete = bodies[0];
        deleteObject(bodyToDelete);
    }
}

function deleteObject(body) {
    // Check if body exists in placedObjects
    const index = placedObjects.indexOf(body);
    if (index === -1) return;
    
    // Check if this is a seesaw part by looking at its label or seesawId
    const isSeesawPart = (body.label === LABEL_SEESAW_PIVOT || body.label === LABEL_SEESAW_PLANK) && body.seesawId;
    
    if (isSeesawPart) {
        // Find all parts of this seesaw using the seesawId
        const seesawId = body.seesawId;
        const pivot = placedObjects.find(obj => obj.label === LABEL_SEESAW_PIVOT && obj.seesawId === seesawId);
        const plank = placedObjects.find(obj => obj.label === LABEL_SEESAW_PLANK && obj.seesawId === seesawId);
        const constraint = placedConstraints.find(c => c.seesawId === seesawId);
        
        // Record deletion for undo
        recordAction({
            type: 'delete',
            objectType: 'seesaw',
            x: pivot ? pivot.position.x : body.position.x,
            y: pivot ? pivot.position.y : body.position.y,
            angle: 0,
            seesawId: seesawId,
            pivot: pivot,
            plank: plank,
            constraint: constraint
        });
        
        // Remove seesaw using helper function
        removeSeesaw(seesawId);
        
        updateStatus('Deleted seesaw');
    } else {
        // Determine object type from body properties
        let objectType;
        if (body.circleRadius) {
            objectType = 'ball';
        } else if (body.isStatic) {
            // Check dimensions to distinguish ramp from platform
            const width = body.bounds.max.x - body.bounds.min.x;
            objectType = width > 140 ? 'platform' : 'ramp';
        } else {
            // Check dimensions to distinguish box from domino
            const height = body.bounds.max.y - body.bounds.min.y;
            objectType = height > 50 ? 'domino' : 'box';
        }
        
        // Record deletion for undo
        recordAction({
            type: 'delete',
            objectType: objectType,
            x: body.position.x,
            y: body.position.y,
            angle: body.angle,
            body: body
        });
        
        // Remove single object
        Composite.remove(world, body);
        placedObjects = placedObjects.filter(obj => obj !== body);
        updateStatus(`Deleted ${objectType}`);
    }
    
    // Update the object counter after deletion
    updateObjectCounter();
}

// Initialize game when page loads
window.addEventListener('load', init);
