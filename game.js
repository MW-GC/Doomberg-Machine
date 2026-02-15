// Matter.js module aliases
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Body = Matter.Body;

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
    
    // Keyboard controls for rotating ramps
    document.addEventListener('keydown', (event) => {
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
                }
            });
            const plank = Bodies.rectangle(x, y - 20, 120, 10, {
                density: 0.05,
                render: {
                    fillStyle: '#EAAC8B'
                }
            });
            
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
            
            Composite.add(world, [pivot, plank, constraint]);
            placedObjects.push(pivot, plank);
            placedConstraints.push(constraint);
            updateStatus(`Placed seesaw at (${Math.round(x)}, ${Math.round(y)})`);
            return;
    }
    
    if (body) {
        // Store original position and angle for reset
        body.originalPosition = { x: body.position.x, y: body.position.y };
        body.originalAngle = body.angle;
        
        Composite.add(world, body);
        placedObjects.push(body);
        updateStatus(`Placed ${type} at (${Math.round(x)}, ${Math.round(y)})`);
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
