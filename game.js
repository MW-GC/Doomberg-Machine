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
const GRID_SIZE = 40; // Grid cell size in pixels
const GRID_LINE_COLOR = 'rgba(0, 0, 0, 0.1)'; // Subtle gray grid lines

// Object labels
const LABEL_SEESAW_PIVOT = 'seesaw-pivot';
const LABEL_SEESAW_PLANK = 'seesaw-plank';

// Physics constants
const POSITION_ITERATIONS = 10; // Increased from default 6 to reduce tunneling
const VELOCITY_ITERATIONS = 6;  // Increased from default 4 to reduce tunneling
const DOOM_VELOCITY_THRESHOLD = 2; // Minimum velocity to doom NPC
const MAX_OBJECTS = 100; // Maximum number of objects allowed for performance
const MAX_SAVE_NAME_LENGTH = 30; // Maximum characters for save design names

// Object type detection thresholds (used in getObjectType for serialization)
const PLATFORM_MIN_WIDTH = 140; // Platforms are wider than ramps (150 vs 120)
const DOMINO_MIN_HEIGHT = 50; // Dominoes are taller than boxes (60 vs 40)

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

/**
 * Snap coordinates to the nearest grid intersection.
 * @param {number} x
 * @param {number} y
 * @returns {{x: number, y: number}}
 */
function snapToGrid(x, y) {
    if (!isGridEnabled) {
        return { x, y };
    }
    return {
        x: Math.round(x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(y / GRID_SIZE) * GRID_SIZE
    };
}

/**
 * Draw grid overlay on canvas.
 * @param {CanvasRenderingContext2D} context
 */
function drawGrid(context) {
    if (!isGridEnabled) return;
    
    context.strokeStyle = GRID_LINE_COLOR;
    context.lineWidth = 1;
    
    context.beginPath();
    
    // Draw vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        context.moveTo(x, 0);
        context.lineTo(x, CANVAS_HEIGHT);
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        context.moveTo(0, y);
        context.lineTo(CANVAS_WIDTH, y);
    }

    context.stroke();
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
let isGridEnabled = false; // Grid toggle state
let npc;
let npcDoomed = false;
let placedObjects = [];
let placedConstraints = [];
let currentRampAngle = DEFAULT_RAMP_ANGLE;
let seesawIdCounter = 0; // Counter for unique seesaw IDs

// Undo/Redo system
let actionHistory = [];
let historyIndex = -1;

// Sound system
let soundEnabled = true;
let audioContext = null;
let lastCollisionSoundTime = 0; // Track last collision sound to prevent spam
const COLLISION_SOUND_COOLDOWN = 100; // Minimum ms between collision sounds

// Initialize audio context with feature detection
try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
        audioContext = new AudioContextClass();
    } else {
        // Web Audio API not supported; disable sound but keep the game running
        console.warn('Web Audio API not supported in this browser. Sound effects disabled.');
        soundEnabled = false;
    }
} catch (e) {
    // Audio context creation failed (blocked/disabled); disable sound safely
    console.warn('Audio context creation failed. Sound effects disabled.', e);
    soundEnabled = false;
    audioContext = null;
}

// Scoring system
let gameStartTime = 0;
let doomTime = 0;
let collisionCount = 0;
let currentScore = 0;
let currentStars = 0;

// Replay/Recording system
let isRecording = false;
let isReplaying = false;
let recordedFrames = [];
let replayFrameIndex = 0;
let replayRunner = null;

/**
 * Apply explosion force to all nearby objects from an explosion center
 * @param {number} explosionX - X coordinate of explosion center
 * @param {number} explosionY - Y coordinate of explosion center
 * @param {number} explosionRadius - Radius of explosion effect (default 150)
 * @param {number} explosionForce - Force magnitude (default 0.08)
 * @param {Matter.Body|null} explosiveBody - The body representing the explosive itself, which will be excluded from the explosion force
 */
function applyExplosionForce(explosionX, explosionY, explosionRadius = 150, explosionForce = 0.08, explosiveBody = null) {
    // Get all bodies in the explosion radius
    const allBodies = Composite.allBodies(world);
    
    allBodies.forEach(body => {
        // Skip static bodies and the explosive itself
        if (body.isStatic || body === explosiveBody) return;
        
        const dx = body.position.x - explosionX;
        const dy = body.position.y - explosionY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply force if within radius
        if (distance < explosionRadius && distance > 0) {
            // Calculate force direction (normalized)
            const forceMagnitude = explosionForce * (1 - distance / explosionRadius);
            const forceX = (dx / distance) * forceMagnitude;
            const forceY = (dy / distance) * forceMagnitude;
            
            // Apply the force at the body's position
            Body.applyForce(body, body.position, { x: forceX, y: forceY });
        }
    });
}

/**
 * Play a simple sound effect using Web Audio API
 * @param {string} type - Type of sound: 'place', 'collision', 'doom', 'ui'
 */
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
            // Object placement - short pop
            oscillator.frequency.value = 400;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
            
        case 'collision':
            // Collision - quick thud
            oscillator.frequency.value = 100;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
            
        case 'doom':
            // Doom - dramatic descending tone
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
            
        case 'ui':
            // UI action - subtle click
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.08);
            break;
            
        default:
            // Unknown sound type - clean up and return
            oscillator.disconnect();
            gainNode.disconnect();
            console.warn(`Unknown sound type: ${type}`);
            return;
    }
}

/**
 * Toggle sound on/off and save preference
 */
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('doomberg_sound_enabled', soundEnabled);
    updateSoundButton();
}

/**
 * Update sound button text and state
 */
function updateSoundButton() {
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        if (!audioContext) {
            // Audio not available - disable button and show unavailable state
            soundBtn.textContent = '🔇 Sound: N/A';
            soundBtn.disabled = true;
            soundBtn.title = 'Web Audio API not supported in this browser';
        } else {
            soundBtn.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
            soundBtn.disabled = false;
        }
    }
}

/**
 * Load sound preference from localStorage
 */
function loadSoundPreference() {
    // Only load preference if audio is available
    if (!audioContext) {
        soundEnabled = false;
        updateSoundButton();
        return;
    }
    
    const saved = localStorage.getItem('doomberg_sound_enabled');
    if (saved !== null) {
        soundEnabled = saved === 'true';
    }
    updateSoundButton();
}

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
    
    // Load sound preference from localStorage
    loadSoundPreference();
    
    // Setup collision detection (only once)
    Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        
        pairs.forEach(pair => {
            // Track all collisions during game for combo scoring
            if (isRunning) {
                collisionCount++;
            }
            
            // Check for explosive collision
            const explosiveBody = pair.bodyA.label === 'explosive' ? pair.bodyA : 
                                  (pair.bodyB.label === 'explosive' ? pair.bodyB : null);
            
            if (explosiveBody && isRunning && !explosiveBody.hasDetonated) {
                // Get the other body in the collision
                const otherBody = pair.bodyA === explosiveBody ? pair.bodyB : pair.bodyA;
                
                // Calculate relative velocity between the two bodies
                const relativeVelocity = Math.sqrt(
                    Math.pow(explosiveBody.velocity.x - otherBody.velocity.x, 2) +
                    Math.pow(explosiveBody.velocity.y - otherBody.velocity.y, 2)
                );
                
                // Detonate on significant impact based on relative velocity
                if (relativeVelocity > 1) {
                    // Mark as detonated immediately to prevent multiple detonations
                    explosiveBody.hasDetonated = true;
                    
                    // Apply explosion force to nearby objects (excluding the explosive itself)
                    applyExplosionForce(explosiveBody.position.x, explosiveBody.position.y, 150, 0.08, explosiveBody);
                    
                    // Change color to indicate explosion (visual feedback)
                    explosiveBody.render.fillStyle = '#FFA500';  // Orange explosion color
                    
                    // Remove explosive immediately
                    Composite.remove(world, explosiveBody);
                    placedObjects = placedObjects.filter(obj => obj !== explosiveBody);
                    updateObjectCounter();
                    
                    updateStatus('💥 EXPLOSION!');
                }
            }
            
            // Check for NPC doom
            if ((pair.bodyA.label === 'npc' || pair.bodyB.label === 'npc') && !npcDoomed) {
                // Check if collision is significant based on the other body's velocity
                const otherBody = pair.bodyA.label === 'npc' ? pair.bodyB : pair.bodyA;
                const velocity = Math.abs(otherBody.velocity.x) + Math.abs(otherBody.velocity.y);
                
                if (velocity > DOOM_VELOCITY_THRESHOLD) {
                    npcDoomed = true;
                    playSound('collision'); // Play collision sound
                    doomTime = (Date.now() - gameStartTime) / 1000; // Time in seconds
                    doomNPC();
                }
            }
            
            // Play general collision sounds for significant impacts during gameplay
            // (rate-limited to avoid audio spam)
            if (isRunning) {
                const now = Date.now();
                if (now - lastCollisionSoundTime > COLLISION_SOUND_COOLDOWN) {
                    // Calculate impact velocity between the two bodies
                    const { bodyA, bodyB } = pair;
                    
                    // Skip if both bodies are static (no collision sound needed)
                    if (bodyA.isStatic && bodyB.isStatic) return;
                    
                    // Calculate relative velocity magnitude
                    const dx = bodyA.velocity.x - bodyB.velocity.x;
                    const dy = bodyA.velocity.y - bodyB.velocity.y;
                    const relativeVelocity = Math.sqrt(dx * dx + dy * dy);
                    
                    // Play collision sound for impacts above a minimum threshold
                    const COLLISION_SOUND_THRESHOLD = 1.5;
                    if (relativeVelocity > COLLISION_SOUND_THRESHOLD) {
                        playSound('collision');
                        lastCollisionSoundTime = now;
                    }
                }
            }
        });
    });
    
    // Draw grid overlay after each render
    Events.on(render, 'afterRender', () => {
        drawGrid(render.context);
    });
    
    // Capture frames for recording during simulation
    Events.on(engine, 'afterUpdate', () => {
        if (isRecording && isRunning && !isPaused) {
            recordedFrames.push(captureFrame());
        }
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
        let x = (event.clientX - rect.left) * scaleX;
        let y = (event.clientY - rect.top) * scaleY;
        
        // Apply snap-to-grid if enabled
        ({ x, y } = snapToGrid(x, y));
        
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
    document.getElementById('gridToggleBtn').addEventListener('click', toggleGrid);
    
    // Save/Load buttons
    document.getElementById('saveBtn').addEventListener('click', () => {
        const name = document.getElementById('saveName').value;
        saveContraption(name);
    });
    
    document.getElementById('loadBtn').addEventListener('click', () => {
        const name = document.getElementById('savedList').value;
        loadContraption(name);
    });
    
    document.getElementById('deleteBtn').addEventListener('click', () => {
        const name = document.getElementById('savedList').value;
        deleteContraption(name);
    });
    
    // Allow Enter key in save name input
    document.getElementById('saveName').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const name = document.getElementById('saveName').value;
            saveContraption(name);
        }
    });
    
    // Replay/Recording buttons
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
    }
    
    const replayBtn = document.getElementById('replayBtn');
    if (replayBtn) {
        replayBtn.addEventListener('click', startReplay);
    }
    
    const stopReplayBtn = document.getElementById('stopReplayBtn');
    if (stopReplayBtn) {
        stopReplayBtn.addEventListener('click', stopReplay);
    }
    
    const saveRecordingBtn = document.getElementById('saveRecordingBtn');
    if (saveRecordingBtn) {
        saveRecordingBtn.addEventListener('click', () => {
            const name = document.getElementById('recordingName').value;
            saveRecording(name);
        });
    }
    
    const loadRecordingBtn = document.getElementById('loadRecordingBtn');
    if (loadRecordingBtn) {
        loadRecordingBtn.addEventListener('click', () => {
            const name = document.getElementById('recordingList').value;
            loadRecording(name);
        });
    }
    
    const deleteRecordingBtn = document.getElementById('deleteRecordingBtn');
    if (deleteRecordingBtn) {
        deleteRecordingBtn.addEventListener('click', () => {
            const name = document.getElementById('recordingList').value;
            if (confirm(`Delete recording "${name}"?`)) {
                deleteRecording(name);
            }
        });
    }
    
    // Allow Enter key in recording name input
    const recordingNameInput = document.getElementById('recordingName');
    if (recordingNameInput) {
        recordingNameInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const name = document.getElementById('recordingName').value;
                saveRecording(name);
            }
        });
    }
    
    // Refresh saved list on page load
    refreshSavedList();
    refreshRecordingList();
    
    // Sound button
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            toggleSound();
            playSound('ui');
        });
    }
    
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
    
    playSound('ui'); // Play UI sound for undo action
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
    
    playSound('ui'); // Play UI sound for redo action
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
            // Note: If object was removed during runtime (e.g., explosive detonation),
            // this check will fail gracefully and skip removal
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
        case 'spring':
            body = Bodies.circle(x, y, 15, {
                restitution: 1.5,
                density: 0.02,
                render: { fillStyle: '#9B59B6' }
            });
            break;
        case 'explosive':
            body = Bodies.circle(x, y, 18, {
                restitution: 0.3,
                density: 0.06,
                label: 'explosive',
                render: { fillStyle: '#E74C3C' }
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
            
        case 'spring':
            body = Bodies.circle(x, y, 15, {
                restitution: 1.5,  // Super bouncy - launches objects
                density: 0.02,     // Light weight
                render: {
                    fillStyle: '#9B59B6'  // Purple color
                }
            });
            break;
            
        case 'explosive':
            body = Bodies.circle(x, y, 18, {
                restitution: 0.3,
                density: 0.06,
                label: 'explosive',  // Label for explosion detection
                render: {
                    fillStyle: '#E74C3C'  // Red color
                }
            });
            break;
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
        
        playSound('place'); // Play placement sound
        updateStatus(`Placed ${type} at (${Math.round(x)}, ${Math.round(y)})`);
        updateObjectCounter();
    }
}

function runMachine() {
    if (isRunning) return;
    
    playSound('ui'); // Play UI sound for run action
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
    
    // Auto-start recording when running
    if (!isRecording && !isReplaying) {
        startRecording();
    }
    
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

function toggleGrid() {
    isGridEnabled = !isGridEnabled;
    
    // Update button UI
    const gridToggleBtn = document.getElementById('gridToggleBtn');
    if (isGridEnabled) {
        gridToggleBtn.classList.add('active');
        gridToggleBtn.textContent = '⊞ Grid: ON';
        updateStatus(`Grid enabled. Objects will snap to ${GRID_SIZE}px grid.`);
    } else {
        gridToggleBtn.classList.remove('active');
        gridToggleBtn.textContent = '⊞ Grid: OFF';
        updateStatus('Grid disabled. Free placement enabled.');
    }
}

function doomNPC() {
    playSound('doom'); // Play doom sound
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
    // Max bonus 500 at 0 seconds, decreases by 50 points per second
    const speedBonus = Math.max(0, Math.round(500 - (doomTime * 50)));
    score += speedBonus;
    breakdown.push({ label: `Speed (${doomTime.toFixed(1)}s)`, points: speedBonus });
    
    // Variety bonus (different object types used)
    // Derive from current placed objects to handle deletions/undo/redo correctly
    const currentTypes = new Set();
    placedObjects.forEach(obj => {
        if (obj.label === LABEL_SEESAW_PIVOT || obj.label === LABEL_SEESAW_PLANK) {
            currentTypes.add('seesaw');
        } else if (obj.circleRadius) {
            currentTypes.add('ball');
        } else if (obj.isStatic) {
            const width = obj.bounds.max.x - obj.bounds.min.x;
            currentTypes.add(width > 140 ? 'platform' : 'ramp');
        } else {
            const height = obj.bounds.max.y - obj.bounds.min.y;
            currentTypes.add(height > 50 ? 'domino' : 'box');
        }
    });
    const varietyCount = currentTypes.size;
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
            modal.classList.remove('show');
            // Wait for transition to complete before hiding
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
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
    
    playSound('ui'); // Play UI sound for reset action
    
    // Stop recording if active
    if (isRecording) {
        stopRecording();
    }
    
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
    playSound('ui'); // Play UI sound for clear action
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

/**
 * Capture current frame state of all objects for recording
 * @returns {Object} Frame data containing positions, angles, and velocities
 */
function captureFrame() {
    const frame = {
        timestamp: Date.now(),
        objects: [],
        npc: null
    };
    
    // Capture all placed objects
    placedObjects.forEach(obj => {
        frame.objects.push({
            id: obj.id,
            position: { x: obj.position.x, y: obj.position.y },
            angle: obj.angle,
            velocity: { x: obj.velocity.x, y: obj.velocity.y },
            angularVelocity: obj.angularVelocity
        });
    });
    
    // Capture NPC state
    if (npc && npc.parts) {
        frame.npc = npc.parts.map(part => ({
            id: part.id,
            position: { x: part.position.x, y: part.position.y },
            angle: part.angle,
            velocity: { x: part.velocity.x, y: part.velocity.y },
            angularVelocity: part.angularVelocity
        }));
    }
    
    return frame;
}

/**
 * Start recording simulation frames
 */
function startRecording() {
    if (isReplaying) {
        updateStatus('Cannot record during replay!');
        return;
    }
    
    isRecording = true;
    recordedFrames = [];
    updateStatus('🔴 Recording simulation...');
    updateReplayButtons();
}

/**
 * Stop recording simulation frames
 */
function stopRecording() {
    isRecording = false;
    updateStatus(`✅ Recording stopped. Captured ${recordedFrames.length} frames.`);
    updateReplayButtons();
}

/**
 * Start replaying recorded simulation
 */
function startReplay() {
    if (recordedFrames.length === 0) {
        updateStatus('No recording to replay! Run and record a simulation first.');
        return;
    }
    
    if (isRunning || isReplaying) {
        updateStatus('Please reset the machine before replaying.');
        return;
    }
    
    playSound('ui');
    isReplaying = true;
    replayFrameIndex = 0;
    
    // Disable editing controls during replay
    document.getElementById('runBtn').disabled = true;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.disabled = true);
    
    updateStatus('▶️ Playing back recording...');
    updateReplayButtons();
    
    // Create a custom runner for replay
    if (!replayRunner) {
        replayRunner = Runner.create({
            isFixed: true,
            delta: 1000 / 60  // 60 FPS
        });
    }
    
    // Use afterUpdate event to apply recorded frames
    const replayHandler = () => {
        if (!isReplaying || replayFrameIndex >= recordedFrames.length) {
            stopReplay();
            return;
        }
        
        applyFrame(recordedFrames[replayFrameIndex]);
        replayFrameIndex++;
    };
    
    Events.on(replayRunner, 'afterUpdate', replayHandler);
    Runner.run(replayRunner, engine);
}

/**
 * Stop replaying and reset to original state
 */
function stopReplay() {
    isReplaying = false;
    replayFrameIndex = 0;
    
    if (replayRunner) {
        Runner.stop(replayRunner);
        Events.off(replayRunner, 'afterUpdate');
    }
    
    // Re-enable editing controls
    document.getElementById('runBtn').disabled = false;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.disabled = false);
    
    updateStatus('⏹️ Replay stopped. Reset the machine to try again.');
    updateReplayButtons();
}

/**
 * Apply a recorded frame to all objects
 * @param {Object} frame - Frame data to apply
 */
function applyFrame(frame) {
    if (!frame) return;
    
    // Apply state to placed objects
    frame.objects.forEach(objData => {
        const obj = placedObjects.find(o => o.id === objData.id);
        if (obj) {
            Body.setPosition(obj, objData.position);
            Body.setAngle(obj, objData.angle);
            Body.setVelocity(obj, objData.velocity);
            Body.setAngularVelocity(obj, objData.angularVelocity);
        }
    });
    
    // Apply state to NPC
    if (frame.npc && npc && npc.parts) {
        frame.npc.forEach(partData => {
            const part = npc.parts.find(p => p.id === partData.id);
            if (part) {
                Body.setPosition(part, partData.position);
                Body.setAngle(part, partData.angle);
                Body.setVelocity(part, partData.velocity);
                Body.setAngularVelocity(part, partData.angularVelocity);
            }
        });
    }
}

/**
 * Save recorded frames to localStorage
 */
function saveRecording(name) {
    if (recordedFrames.length === 0) {
        updateStatus('No recording to save!');
        return;
    }
    
    if (!name || name.trim() === '') {
        updateStatus('Please enter a name for the recording.');
        return;
    }
    
    const recordingData = {
        version: 1,
        timestamp: Date.now(),
        frameCount: recordedFrames.length,
        frames: recordedFrames
    };
    
    try {
        localStorage.setItem(`doomberg_recording_${name}`, JSON.stringify(recordingData));
        updateStatus(`✅ Recording "${name}" saved with ${recordedFrames.length} frames.`);
        refreshRecordingList();
    } catch (e) {
        updateStatus('❌ Failed to save recording. Storage might be full.');
        console.error('Save recording error:', e);
    }
}

/**
 * Load recorded frames from localStorage
 */
function loadRecording(name) {
    if (!name || name.trim() === '') {
        updateStatus('Please select a recording to load.');
        return;
    }
    
    try {
        const data = localStorage.getItem(`doomberg_recording_${name}`);
        if (!data) {
            updateStatus(`Recording "${name}" not found.`);
            return;
        }
        
        const recordingData = JSON.parse(data);
        recordedFrames = recordingData.frames || [];
        updateStatus(`✅ Loaded recording "${name}" with ${recordedFrames.length} frames.`);
        updateReplayButtons();
    } catch (e) {
        updateStatus('❌ Failed to load recording.');
        console.error('Load recording error:', e);
    }
}

/**
 * Delete a recording from localStorage
 */
function deleteRecording(name) {
    if (!name || name.trim() === '') {
        updateStatus('Please select a recording to delete.');
        return;
    }
    
    try {
        localStorage.removeItem(`doomberg_recording_${name}`);
        updateStatus(`🗑️ Recording "${name}" deleted.`);
        refreshRecordingList();
    } catch (e) {
        updateStatus('❌ Failed to delete recording.');
        console.error('Delete recording error:', e);
    }
}

/**
 * Refresh the list of saved recordings
 */
function refreshRecordingList() {
    const select = document.getElementById('recordingList');
    if (!select) return;
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- Select recording --</option>';
    
    // Get all recordings from localStorage
    const recordings = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('doomberg_recording_')) {
            const name = key.replace('doomberg_recording_', '');
            recordings.push(name);
        }
    }
    
    // Sort alphabetically and add to select
    recordings.sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

/**
 * Update replay button states based on current state
 */
function updateReplayButtons() {
    const recordBtn = document.getElementById('recordBtn');
    const replayBtn = document.getElementById('replayBtn');
    const stopReplayBtn = document.getElementById('stopReplayBtn');
    
    if (recordBtn) {
        if (isReplaying) {
            recordBtn.disabled = true;
        } else {
            recordBtn.disabled = false;
            recordBtn.textContent = isRecording ? '⏺️ Recording...' : '⏺️ Record';
            recordBtn.classList.toggle('active', isRecording);
        }
    }
    
    if (replayBtn) {
        replayBtn.disabled = isReplaying || recordedFrames.length === 0;
    }
    
    if (stopReplayBtn) {
        stopReplayBtn.disabled = !isReplaying;
    }
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

/**
 * Helper function to determine object type from a body
 * @param {Body} body - The Matter.js body
 * @returns {string} - The object type string
 */
function getObjectType(body) {
    // Check for seesaw parts
    if (body.label === LABEL_SEESAW_PIVOT || body.label === LABEL_SEESAW_PLANK) {
        return 'seesaw';
    }
    
    // Check for ball (has circleRadius)
    if (body.circleRadius) {
        return 'ball';
    }
    
    // Check for static objects
    if (body.isStatic) {
        const width = body.bounds.max.x - body.bounds.min.x;
        // Platform is wider than ramp (150 vs 120)
        return width > PLATFORM_MIN_WIDTH ? 'platform' : 'ramp';
    }
    
    // Check dynamic objects by height
    const height = body.bounds.max.y - body.bounds.min.y;
    // Domino is taller than box (60 vs 40)
    return height > DOMINO_MIN_HEIGHT ? 'domino' : 'box';
}

/**
 * Save current contraption design to localStorage
 * @param {string} name - Name for the saved design
 */
function saveContraption(name) {
    if (!name || name.trim() === '') {
        updateStatus('Please enter a name for your design');
        alert('Please enter a name for your design!');
        return;
    }
    
    name = name.trim();
    
    // Enforce max length constraint (same as HTML input maxlength="30")
    if (name.length > MAX_SAVE_NAME_LENGTH) {
        updateStatus(`Design name too long (max ${MAX_SAVE_NAME_LENGTH} characters)`);
        alert(`Design name must be ${MAX_SAVE_NAME_LENGTH} characters or less!`);
        return;
    }
    
    // Collect all unique objects (avoid duplicating seesaw parts)
    const processedSeesaws = new Set();
    const objectsData = [];
    
    placedObjects.forEach(obj => {
        // Handle seesaws specially
        if ((obj.label === LABEL_SEESAW_PIVOT || obj.label === LABEL_SEESAW_PLANK) && obj.seesawId !== undefined) {
            // Only save seesaw once using pivot
            if (obj.label === LABEL_SEESAW_PIVOT && !processedSeesaws.has(obj.seesawId)) {
                processedSeesaws.add(obj.seesawId);
                objectsData.push({
                    type: 'seesaw',
                    x: obj.position.x,
                    y: obj.position.y,
                    angle: 0,
                    seesawId: obj.seesawId
                });
            }
        } else {
            // Regular object
            objectsData.push({
                type: getObjectType(obj),
                x: obj.position.x,
                y: obj.position.y,
                angle: obj.angle
            });
        }
    });
    
    const design = {
        version: 1,
        timestamp: Date.now(),
        name: name,
        objects: objectsData
    };
    
    try {
        localStorage.setItem(`doomberg_${name}`, JSON.stringify(design));
        updateStatus(`Saved: ${name}`);
        refreshSavedList();
        document.getElementById('saveName').value = '';
    } catch (e) {
        updateStatus('Failed to save: Storage limit exceeded');
        alert('Failed to save: Your browser storage is full. Please delete some saved designs.');
        console.error('Save error:', e);
    }
}

/**
 * Load a contraption design from localStorage
 * @param {string} name - Name of the saved design to load
 */
function loadContraption(name) {
    if (!name || name.trim() === '') {
        updateStatus('Please select a design to load');
        return;
    }
    
    name = name.trim();
    
    try {
        const data = localStorage.getItem(`doomberg_${name}`);
        if (!data) {
            updateStatus(`Design not found: ${name}`);
            alert(`Design not found: ${name}`);
            return;
        }
        
        const design = JSON.parse(data);
        
        // Verify version - using strict equality for conservative compatibility
        // Only version 1 is currently supported. Future versions should implement
        // backward compatibility logic here if needed (e.g., design.version <= MAX_SUPPORTED_VERSION)
        if (design.version !== 1) {
            updateStatus('Incompatible design version');
            alert('This design was saved with an incompatible version.');
            return;
        }
        
        // Clear existing objects
        clearAll();
        
        // Track maximum seesawId to prevent ID collisions
        let maxSeesawId = -1;
        
        // Recreate objects
        design.objects.forEach(objData => {
            if (objData.type === 'seesaw') {
                // For seesaws, use the saved seesawId to maintain consistency
                const seesawId = objData.seesawId !== undefined ? objData.seesawId : seesawIdCounter++;
                createSeesaw(objData.x, objData.y, seesawId);
                
                // Track max ID
                if (seesawId > maxSeesawId) {
                    maxSeesawId = seesawId;
                }
                
                // Record action for undo/redo
                const pivot = placedObjects.find(obj => obj.label === LABEL_SEESAW_PIVOT && obj.seesawId === seesawId);
                const plank = placedObjects.find(obj => obj.label === LABEL_SEESAW_PLANK && obj.seesawId === seesawId);
                const constraint = placedConstraints.find(c => c.seesawId === seesawId);
                
                if (pivot && plank && constraint) {
                    recordAction({
                        type: 'place',
                        objectType: 'seesaw',
                        x: objData.x,
                        y: objData.y,
                        angle: 0,
                        seesawId: seesawId,
                        pivot: pivot,
                        plank: plank,
                        constraint: constraint
                    });
                }
            } else {
                // Regular objects
                placeObject(objData.type, objData.x, objData.y);
                
                // For ramps, restore the angle
                if (objData.type === 'ramp' && objData.angle !== undefined) {
                    const lastObject = placedObjects[placedObjects.length - 1];
                    if (lastObject && !lastObject.label) {
                        Body.setAngle(lastObject, objData.angle);
                        lastObject.originalAngle = objData.angle;
                    }
                }
            }
        });
        
        // Update seesawIdCounter to prevent ID collisions with newly created seesaws
        if (maxSeesawId >= 0) {
            seesawIdCounter = Math.max(seesawIdCounter, maxSeesawId + 1);
        }
        
        updateStatus(`Loaded: ${name} (${design.objects.length} objects)`);
        updateObjectCounter();
    } catch (e) {
        updateStatus('Failed to load design');
        alert('Failed to load design: The data may be corrupted.');
        console.error('Load error:', e);
    }
}

/**
 * Get list of all saved contraption names
 * @returns {Array<string>} Array of saved design names
 */
function listSavedContraptions() {
    const keys = Object.keys(localStorage);
    return keys
        .filter(k => k.startsWith('doomberg_'))
        .map(k => k.replace('doomberg_', ''))
        .sort();
}

/**
 * Delete a saved contraption from localStorage
 * @param {string} name - Name of the design to delete
 */
function deleteContraption(name) {
    if (!name || name.trim() === '') {
        updateStatus('Please select a design to delete');
        return;
    }
    
    name = name.trim();
    
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }
    
    const storageKey = `doomberg_${name}`;
    
    try {
        // Check if localStorage is available and whether the item exists
        const existingValue = localStorage.getItem(storageKey);
        
        if (existingValue === null) {
            updateStatus(`Design not found: ${name}`);
            refreshSavedList();
            document.getElementById('savedList').value = '';
            return;
        }
        
        // Remove the item
        localStorage.removeItem(storageKey);
        
        // Verify removal succeeded
        const stillExists = localStorage.getItem(storageKey) !== null;
        if (stillExists) {
            updateStatus('Failed to delete design');
            console.error('Delete error: item still present after removeItem');
            return;
        }
        
        updateStatus(`Deleted: ${name}`);
        refreshSavedList();
        document.getElementById('savedList').value = '';
    } catch (e) {
        updateStatus('Saving is not available in this browser');
        console.error('localStorage access error:', e);
    }
}

/**
 * Refresh the saved designs dropdown list
 */
function refreshSavedList() {
    const savedList = document.getElementById('savedList');
    const savedNames = listSavedContraptions();
    
    // Clear current options except the first one
    savedList.innerHTML = '<option value="">-- Select saved design --</option>';
    
    // Add saved designs
    savedNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        savedList.appendChild(option);
    });
}

// Initialize game when page loads
window.addEventListener('load', init);
