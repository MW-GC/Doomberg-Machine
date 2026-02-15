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
let npc;
let npcDoomed = false;
let placedObjects = [];
let placedConstraints = [];
let currentRampAngle = DEFAULT_RAMP_ANGLE;

// Undo/Redo system
let actionHistory = [];
let historyIndex = -1;
const LABEL_SEESAW_PIVOT = 'seesaw_pivot';
const LABEL_SEESAW_PLANK = 'seesaw_plank';
let seesawIdCounter = 0;

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    
    // Create engine
    engine = Engine.create();
    world = engine.world;
    world.gravity.y = 1;
    
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
            if ((pair.bodyA.label === 'npc' || pair.bodyB.label === 'npc') && !npcDoomed) {
                // Check if collision is significant based on the other body's velocity
                const otherBody = pair.bodyA.label === 'npc' ? pair.bodyB : pair.bodyA;
                const velocity = Math.abs(otherBody.velocity.x) + Math.abs(otherBody.velocity.y);
                
                if (velocity > 2) {
                    npcDoomed = true;
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

function revertAction(action) {
    if (action.type === 'place') {
        // Remove the placed object(s)
        if (action.objectType === 'seesaw') {
            // Find and remove seesaw parts by seesawId
            const pivot = placedObjects.find(obj => obj.label === LABEL_SEESAW_PIVOT && obj.seesawId === action.seesawId);
            const plank = placedObjects.find(obj => obj.label === LABEL_SEESAW_PLANK && obj.seesawId === action.seesawId);
            const constraint = placedConstraints.find(c => c.seesawId === action.seesawId);
            
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
            const pivot = Bodies.rectangle(action.x, action.y, 10, 40, {
                isStatic: true,
                render: { fillStyle: '#AA8976' },
                label: LABEL_SEESAW_PIVOT
            });
            const plank = Bodies.rectangle(action.x, action.y - 20, 120, 10, {
                density: 0.05,
                render: { fillStyle: '#EAAC8B' },
                label: LABEL_SEESAW_PLANK
            });
            
            pivot.originalPosition = { x: action.x, y: action.y };
            pivot.originalAngle = 0;
            pivot.seesawId = action.seesawId;
            plank.originalPosition = { x: action.x, y: action.y - 20 };
            plank.originalAngle = 0;
            plank.seesawId = action.seesawId;
            
            const constraint = Matter.Constraint.create({
                bodyA: pivot,
                bodyB: plank,
                length: 0,
                stiffness: 0.9
            });
            constraint.seesawId = action.seesawId;
            
            Composite.add(world, [pivot, plank, constraint]);
            placedObjects.push(pivot, plank);
            placedConstraints.push(constraint);
            
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
}

function applyAction(action) {
    if (action.type === 'place') {
        // Re-add the object(s)
        if (action.objectType === 'seesaw') {
            // Recreate seesaw
            const pivot = Bodies.rectangle(action.x, action.y, 10, 40, {
                isStatic: true,
                render: { fillStyle: '#AA8976' },
                label: LABEL_SEESAW_PIVOT
            });
            const plank = Bodies.rectangle(action.x, action.y - 20, 120, 10, {
                density: 0.05,
                render: { fillStyle: '#EAAC8B' },
                label: LABEL_SEESAW_PLANK
            });
            
            pivot.originalPosition = { x: action.x, y: action.y };
            pivot.originalAngle = 0;
            pivot.seesawId = action.seesawId;
            plank.originalPosition = { x: action.x, y: action.y - 20 };
            plank.originalAngle = 0;
            plank.seesawId = action.seesawId;
            
            const constraint = Matter.Constraint.create({
                bodyA: pivot,
                bodyB: plank,
                length: 0,
                stiffness: 0.9
            });
            constraint.seesawId = action.seesawId;
            
            Composite.add(world, [pivot, plank, constraint]);
            placedObjects.push(pivot, plank);
            placedConstraints.push(constraint);
            
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
            const pivot = placedObjects.find(obj => obj.label === LABEL_SEESAW_PIVOT && obj.seesawId === action.seesawId);
            const plank = placedObjects.find(obj => obj.label === LABEL_SEESAW_PLANK && obj.seesawId === action.seesawId);
            const constraint = placedConstraints.find(c => c.seesawId === action.seesawId);
            
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
        } else {
            const body = action.body;
            if (body && placedObjects.includes(body)) {
                Composite.remove(world, body);
                placedObjects = placedObjects.filter(obj => obj !== body);
            }
        }
    }
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
            // Create seesaw as two bodies - the pivot and the plank
            const pivot = Bodies.rectangle(x, y, 10, 40, {
                isStatic: true,
                render: {
                    fillStyle: '#AA8976'
                },
                label: LABEL_SEESAW_PIVOT
            });
            const plank = Bodies.rectangle(x, y - 20, 120, 10, {
                density: 0.05,
                render: {
                    fillStyle: '#EAAC8B'
                },
                label: LABEL_SEESAW_PLANK
            });
            
            // Assign unique seesaw ID
            const seesawId = seesawIdCounter++;
            pivot.seesawId = seesawId;
            plank.seesawId = seesawId;
            
            // Store original positions
            pivot.originalPosition = { x: pivot.position.x, y: pivot.position.y };
            pivot.originalAngle = pivot.angle;
            plank.originalPosition = { x: plank.position.x, y: plank.position.y };
            plank.originalAngle = plank.angle;
            
            // Add constraint to make it rotate around pivot
            const constraint = Matter.Constraint.create({
                bodyA: pivot,
                bodyB: plank,
                length: 0,
                stiffness: 0.9
            });
            constraint.seesawId = seesawId;
            
            Composite.add(world, [pivot, plank, constraint]);
            placedObjects.push(pivot, plank);
            placedConstraints.push(constraint);
            
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
    }
}

function deleteObjectAtPosition(x, y) {
    // Use Matter.js Query to find bodies at this position
    const bodies = Matter.Query.point(placedObjects, { x, y });
    
    if (bodies.length > 0) {
        const body = bodies[0];
        
        // Check if it's part of a seesaw
        if (body.label === LABEL_SEESAW_PIVOT || body.label === LABEL_SEESAW_PLANK) {
            const seesawId = body.seesawId;
            const pivot = placedObjects.find(obj => obj.label === LABEL_SEESAW_PIVOT && obj.seesawId === seesawId);
            const plank = placedObjects.find(obj => obj.label === LABEL_SEESAW_PLANK && obj.seesawId === seesawId);
            const constraint = placedConstraints.find(c => c.seesawId === seesawId);
            
            // Record deletion for undo
            recordAction({
                type: 'delete',
                objectType: 'seesaw',
                x: pivot ? pivot.position.x : x,
                y: pivot ? pivot.position.y : y,
                angle: 0,
                seesawId: seesawId,
                pivot: pivot,
                plank: plank,
                constraint: constraint
            });
            
            // Remove all seesaw parts
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
            
            updateStatus('Deleted seesaw');
        } else {
            // Determine object type from body properties
            let objectType = 'object';
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
            
            // Remove the object
            Composite.remove(world, body);
            placedObjects = placedObjects.filter(obj => obj !== body);
            updateStatus(`Deleted ${objectType}`);
        }
    }
}

function runMachine() {
    if (isRunning) return;
    
    isRunning = true;
    npcDoomed = false;
    
    // Make NPC dynamic
    Body.setStatic(npc, false);
    
    // Create or reuse runner
    if (!runner) {
        runner = Runner.create();
    }
    Runner.run(runner, engine);
    
    document.getElementById('runBtn').disabled = true;
    updateUndoRedoButtons();
    updateStatus('Machine running! Watch the chaos unfold...');
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
    
    isRunning = false;
    npcDoomed = false;
    document.getElementById('runBtn').disabled = false;
    updateUndoRedoButtons();
    
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
    
    // Reset if running
    if (isRunning) {
        resetMachine();
    }
    
    updateStatus('All objects cleared! Start building your machine.');
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

// Initialize game when page loads
window.addEventListener('load', init);
