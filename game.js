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

// Level System Constants
const LEVEL_STORAGE_KEY = 'doomberg_level_progress';
const ALL_OBJECT_TYPES = ['ball', 'box', 'domino', 'ramp', 'platform', 'seesaw', 'spring', 'explosive'];

/**
 * Level definitions
 * Each level has:
 * - id: unique level identifier
 * - name: display name
 * - description: level objective description
 * - npcPosition: {x, y} position for NPC
 * - preplacedObjects: array of objects to place before player builds
 * - allowedObjects: array of allowed object types (empty = all allowed)
 * - maxObjects: maximum number of objects player can place
 * - timeLimit: optional time limit in seconds (null = no limit)
 * - hints: array of hint strings for the player
 * - starThresholds: score required for 1, 2, 3 stars [min, 2star, 3star]
 */
const LEVELS = [
    {
        id: 1,
        name: "First Contact",
        description: "Learn the basics: Place a ball and doom the NPC!",
        npcPosition: { x: 1000, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100 },
        preplacedObjects: [],
        allowedObjects: ['ball'],
        maxObjects: 3,
        timeLimit: null,
        hints: [
            "Click the Ball button, then click above the NPC to place it",
            "Gravity will do the rest - watch the ball fall!",
            "Press 'Run Machine' to start the simulation"
        ],
        starThresholds: [1000, 1400, 1800]
    },
    {
        id: 2,
        name: "Ramp It Up",
        description: "Use a ramp to redirect a ball toward the NPC",
        npcPosition: { x: 900, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100 },
        preplacedObjects: [
            { type: 'platform', x: 200, y: 300, angle: 0 }
        ],
        allowedObjects: ['ball', 'ramp'],
        maxObjects: 5,
        timeLimit: null,
        hints: [
            "Place a ball on the platform at the left",
            "Use a ramp to guide the ball toward the NPC",
            "Angle matters! The ramp has a default angle"
        ],
        starThresholds: [1000, 1600, 2200]
    },
    {
        id: 3,
        name: "Chain Reaction",
        description: "Create a domino chain to hit the NPC",
        npcPosition: { x: 1000, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100 },
        preplacedObjects: [
            { type: 'ball', x: 100, y: 200, angle: 0 }
        ],
        allowedObjects: ['domino'],
        maxObjects: 10,
        timeLimit: null,
        hints: [
            "Place dominoes in a line from the ball to the NPC",
            "Space them close enough to knock each other down",
            "Watch the chain reaction unfold!"
        ],
        starThresholds: [1000, 1800, 2400]
    },
    {
        id: 4,
        name: "Platform Puzzle",
        description: "Use platforms and boxes to create a path",
        npcPosition: { x: 1000, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100 },
        preplacedObjects: [],
        allowedObjects: ['ball', 'box', 'platform', 'ramp'],
        maxObjects: 8,
        timeLimit: null,
        hints: [
            "Build platforms at different heights",
            "Use boxes to create stepping stones",
            "Think about how the ball will bounce"
        ],
        starThresholds: [1000, 1800, 2600]
    },
    {
        id: 5,
        name: "Seesaw Master",
        description: "Use a seesaw to launch an object at the NPC",
        npcPosition: { x: 950, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100 },
        preplacedObjects: [
            { type: 'platform', x: 200, y: 200, angle: 0 }
        ],
        allowedObjects: ['ball', 'box', 'seesaw'],
        maxObjects: 6,
        timeLimit: null,
        hints: [
            "Place a seesaw in the middle area",
            "Drop a ball on one side to launch the other",
            "A box on the low end can be launched by a falling ball"
        ],
        starThresholds: [1000, 2000, 2800]
    },
    {
        id: 6,
        name: "Spring Thing",
        description: "Bounce your way to victory with springs!",
        npcPosition: { x: 1000, y: 300 },
        preplacedObjects: [
            { type: 'platform', x: 600, y: CANVAS_HEIGHT - GROUND_HEIGHT - 50, angle: 0 }
        ],
        allowedObjects: ['ball', 'spring', 'platform'],
        maxObjects: 7,
        timeLimit: null,
        hints: [
            "Springs have super-high bounciness!",
            "Place springs to redirect the ball upward",
            "Build a bouncing path to reach the elevated NPC"
        ],
        starThresholds: [1000, 2000, 2800]
    },
    {
        id: 7,
        name: "Explosive Entry",
        description: "Use an explosive to blast objects toward the NPC",
        npcPosition: { x: 1000, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100 },
        preplacedObjects: [
            { type: 'box', x: 700, y: CANVAS_HEIGHT - GROUND_HEIGHT - 50, angle: 0 },
            { type: 'box', x: 740, y: CANVAS_HEIGHT - GROUND_HEIGHT - 50, angle: 0 }
        ],
        allowedObjects: ['ball', 'explosive'],
        maxObjects: 5,
        timeLimit: null,
        hints: [
            "Explosives detonate on impact!",
            "Drop a ball on the explosive to trigger it",
            "The explosion will push the boxes toward the NPC"
        ],
        starThresholds: [1000, 1800, 2600]
    },
    {
        id: 8,
        name: "Master Builder",
        description: "Combine everything you've learned. Limited objects!",
        npcPosition: { x: 1050, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100 },
        preplacedObjects: [
            { type: 'platform', x: 200, y: 250, angle: 0 }
        ],
        allowedObjects: ALL_OBJECT_TYPES,
        maxObjects: 6,
        timeLimit: null,
        hints: [
            "You have access to all object types",
            "But you're limited to only 6 objects!",
            "Plan carefully for maximum efficiency"
        ],
        starThresholds: [1000, 2200, 3000]
    }
];

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

// Level system variables
let gameMode = 'sandbox'; // 'sandbox' or 'level'
let currentLevel = null; // Current level object
let levelProgress = {}; // Stores completion data for all levels
let preplacedLevelObjects = []; // Track preplaced objects separately from player-placed
let allowedObjectsForLevel = []; // Which objects are allowed in current level

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

/**
 * Load level progress from localStorage
 */
function loadLevelProgress() {
    const saved = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (saved) {
        try {
            levelProgress = JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to load level progress:', e);
            levelProgress = {};
        }
    } else {
        levelProgress = {};
    }
    
    // Initialize progress for all levels if not exists
    LEVELS.forEach(level => {
        if (!levelProgress[level.id]) {
            levelProgress[level.id] = {
                unlocked: level.id === 1, // First level unlocked by default
                completed: false,
                stars: 0,
                bestScore: 0
            };
        }
    });
}

/**
 * Save level progress to localStorage
 */
function saveLevelProgress() {
    try {
        localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(levelProgress));
    } catch (e) {
        console.error('Failed to save level progress:', e);
    }
}

/**
 * Load a specific level
 * @param {number} levelId - The ID of the level to load
 */
function loadLevel(levelId) {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) {
        console.error('Level not found:', levelId);
        return;
    }
    
    // Check if level is unlocked
    if (!levelProgress[levelId]?.unlocked) {
        updateStatus('This level is locked. Complete previous levels to unlock!');
        return;
    }
    
    // Switch to level mode
    gameMode = 'level';
    currentLevel = level;
    allowedObjectsForLevel = level.allowedObjects.length > 0 ? level.allowedObjects : ALL_OBJECT_TYPES;
    
    // Clear everything
    clearAll();
    
    // Close level selection modal
    const levelModal = document.getElementById('levelModal');
    if (levelModal) {
        levelModal.classList.remove('show');
        setTimeout(() => {
            levelModal.style.display = 'none';
        }, 300);
    }
    
    // Position NPC at level-specific location
    Composite.remove(world, npc);
    createNPC(level.npcPosition.x, level.npcPosition.y);
    
    // Place preplaced objects
    preplacedLevelObjects = [];
    level.preplacedObjects.forEach(obj => {
        const body = placeObjectInternal(obj.type, obj.x, obj.y, obj.angle || 0, true);
        if (body) {
            preplacedLevelObjects.push(body);
        }
    });
    
    // Update UI
    updateAllowedObjectButtons();
    updateLevelInfoDisplay();
    updateStatus(`Level ${level.id}: ${level.name} - ${level.description}`);
}

/**
 * Return to sandbox mode
 */
function returnToSandbox() {
    gameMode = 'sandbox';
    currentLevel = null;
    allowedObjectsForLevel = ALL_OBJECT_TYPES;
    preplacedLevelObjects = [];
    
    // Reset NPC to default position
    Composite.remove(world, npc);
    createNPC();
    
    // Clear everything
    clearAll();
    
    // Update UI
    updateAllowedObjectButtons();
    updateLevelInfoDisplay();
    updateStatus('Sandbox mode: Build freely with no restrictions!');
}

/**
 * Update which object buttons are enabled based on level restrictions
 */
function updateAllowedObjectButtons() {
    const allButtons = document.querySelectorAll('.tool-btn');
    allButtons.forEach(btn => {
        const tool = btn.getAttribute('data-tool');
        if (gameMode === 'level' && allowedObjectsForLevel.length > 0) {
            if (allowedObjectsForLevel.includes(tool)) {
                btn.disabled = false;
                btn.style.opacity = '1';
            } else {
                btn.disabled = true;
                btn.style.opacity = '0.3';
                if (selectedTool === tool) {
                    selectedTool = null;
                    btn.classList.remove('active');
                }
            }
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    });
}

/**
 * Update level info display in UI
 */
function updateLevelInfoDisplay() {
    let levelInfoDiv = document.getElementById('levelInfo');
    if (!levelInfoDiv) {
        // Create level info div if it doesn't exist
        levelInfoDiv = document.createElement('div');
        levelInfoDiv.id = 'levelInfo';
        levelInfoDiv.className = 'level-info';
        const statusDiv = document.getElementById('status');
        statusDiv.parentNode.insertBefore(levelInfoDiv, statusDiv.nextSibling);
    }
    
    if (gameMode === 'level' && currentLevel) {
        const playerObjectCount = placedObjects.length - preplacedLevelObjects.length;
        const objectsLeft = currentLevel.maxObjects - playerObjectCount;
        
        levelInfoDiv.innerHTML = `
            <div class="level-info-header">
                <strong>Level ${currentLevel.id}: ${currentLevel.name}</strong>
            </div>
            <div class="level-info-details">
                <span>Objects: ${playerObjectCount}/${currentLevel.maxObjects}</span>
                ${currentLevel.timeLimit ? `<span>Time Limit: ${currentLevel.timeLimit}s</span>` : ''}
            </div>
        `;
        levelInfoDiv.style.display = 'block';
    } else {
        levelInfoDiv.style.display = 'none';
    }
}

/**
 * Complete current level and update progress
 * @param {number} score - Final score
 * @param {number} stars - Stars earned (1-3)
 */
function completeLevel(score, stars) {
    if (gameMode !== 'level' || !currentLevel) return;
    
    const levelId = currentLevel.id;
    const progress = levelProgress[levelId];
    
    // Update progress
    progress.completed = true;
    if (score > progress.bestScore) {
        progress.bestScore = score;
    }
    if (stars > progress.stars) {
        progress.stars = stars;
    }
    
    // Unlock next level
    const nextLevel = LEVELS.find(l => l.id === levelId + 1);
    if (nextLevel && levelProgress[nextLevel.id]) {
        levelProgress[nextLevel.id].unlocked = true;
    }
    
    // Save progress
    saveLevelProgress();
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
    
    // Load level progress from localStorage
    loadLevelProgress();
    
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
    
    // Start render after all bodies are created; runner will be started in runMachine()
    Render.run(render);
    
    updateStatus('Ready to build! Select an object and click to place it.');
}

function createNPC(customX = null, customY = null) {
    // Create NPC as a compound body (head + body)
    // Position NPC standing on the ground (or at custom position)
    const npcX = customX !== null ? customX : CANVAS_WIDTH - 100;
    
    let npcY;
    if (customY !== null) {
        npcY = customY;
    } else {
        // Calculate Y position so NPC stands on ground (ground top is at CANVAS_HEIGHT - GROUND_HEIGHT)
        // Legs are positioned NPC_LEG_OFFSET pixels below body center
        const groundTop = CANVAS_HEIGHT - GROUND_HEIGHT;
        npcY = groundTop - NPC_LEG_OFFSET - NPC_HALF_LEG_HEIGHT;
    }
    
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
    document.getElementById('levelsBtn').addEventListener('click', showLevelSelectionModal);
    
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
    
    // Refresh saved list on page load
    refreshSavedList();
    
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

/**
 * Internal function to place an object (used by both player placement and level loading)
 * @param {string} type - Object type
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} angle - Rotation angle (default 0)
 * @param {boolean} isPreplaced - Whether this is a preplaced level object
 * @returns {Matter.Body|null} The created body (or null for seesaw)
 */
function placeObjectInternal(type, x, y, angle = 0, isPreplaced = false) {
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
                angle: angle !== 0 ? angle : currentRampAngle,
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
            const { pivot, plank, constraint } = createSeesaw(x, y);
            const seesawId = pivot.seesawId;
            
            // For preplaced objects, don't record undo action
            if (!isPreplaced) {
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
                updateLevelInfoDisplay();
            }
            return pivot; // Return pivot as representative body
            
        case 'spring':
            body = Bodies.circle(x, y, 15, {
                restitution: 1.5,
                density: 0.02,
                render: {
                    fillStyle: '#9B59B6'
                }
            });
            break;
            
        case 'explosive':
            body = Bodies.circle(x, y, 18, {
                restitution: 0.3,
                density: 0.06,
                label: 'explosive',
                render: {
                    fillStyle: '#E74C3C'
                }
            });
            break;
    }
    
    if (body) {
        // Apply angle if specified
        if (angle !== 0) {
            Body.setAngle(body, angle);
        }
        
        // Store original position and angle for reset
        body.originalPosition = { x: body.position.x, y: body.position.y };
        body.originalAngle = body.angle;
        
        Composite.add(world, body);
        placedObjects.push(body);
        
        // For player-placed objects (not preplaced), record action and update UI
        if (!isPreplaced) {
            recordAction({
                type: 'place',
                objectType: type,
                x: body.position.x,
                y: body.position.y,
                angle: body.angle,
                body: body
            });
            playSound('place');
            updateStatus(`Placed ${type} at (${Math.round(x)}, ${Math.round(y)})`);
            updateObjectCounter();
            updateLevelInfoDisplay();
        }
        
        return body;
    }
    
    return null;
}

function placeObject(type, x, y) {
    // In level mode, check object restrictions
    if (gameMode === 'level' && currentLevel) {
        // Count player-placed objects (exclude preplaced)
        const playerObjectCount = placedObjects.length - preplacedLevelObjects.length;
        
        if (playerObjectCount >= currentLevel.maxObjects) {
            updateStatus(`Maximum objects (${currentLevel.maxObjects}) for this level reached!`);
            return;
        }
        
        // Check if object type is allowed
        if (currentLevel.allowedObjects.length > 0 && !currentLevel.allowedObjects.includes(type)) {
            updateStatus(`${type} is not allowed in this level!`);
            return;
        }
    } else {
        // Sandbox mode - check global limit
        if (placedObjects.length >= MAX_OBJECTS) {
            updateStatus(`Maximum object limit (${MAX_OBJECTS}) reached! Please remove some objects first.`);
            alert(`Maximum object limit (${MAX_OBJECTS}) reached!\n\nFor optimal performance, please clear some objects before adding more.`);
            return;
        }
    }
    
    placeObjectInternal(type, x, y, 0, false);
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
    // In level mode, count only player-placed objects
    let objectCount = placedObjects.length;
    if (gameMode === 'level' && preplacedLevelObjects.length > 0) {
        objectCount = placedObjects.length - preplacedLevelObjects.length;
    }
    
    // Max bonus 500 for 1 object, decreases by 20 per object
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
    if (gameMode === 'level' && currentLevel) {
        // Use level-specific star thresholds
        const thresholds = currentLevel.starThresholds;
        if (score >= thresholds[2]) stars = 3;
        else if (score >= thresholds[1]) stars = 2;
        else if (score >= thresholds[0]) stars = 1;
        
        // Complete the level
        completeLevel(score, stars);
    } else {
        // Sandbox mode - use default thresholds
        if (score >= 2000) stars = 2;
        if (score >= 2800) stars = 3;
    }
    
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
                    <h2 id="scoreModalTitle">Mission Complete!</h2>
                    <div class="score-stars" id="scoreStars"></div>
                </div>
                <div class="score-total" id="scoreTotal"></div>
                <div class="score-breakdown" id="scoreBreakdown"></div>
                <div id="scoreModalButtons"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Update modal title based on mode
    const titleElement = document.getElementById('scoreModalTitle');
    if (gameMode === 'level' && currentLevel) {
        titleElement.textContent = `Level ${currentLevel.id} Complete!`;
    } else {
        titleElement.textContent = 'Mission Complete!';
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
    
    // Update buttons based on mode
    const buttonsContainer = document.getElementById('scoreModalButtons');
    if (gameMode === 'level' && currentLevel) {
        const nextLevelExists = LEVELS.find(l => l.id === currentLevel.id + 1);
        buttonsContainer.innerHTML = `
            ${nextLevelExists ? '<button id="nextLevelBtn" class="action-btn">➡️ Next Level</button>' : ''}
            <button id="retryLevelBtn" class="action-btn">🔄 Retry Level</button>
            <button id="levelSelectBtn" class="action-btn">📋 Level Select</button>
            <button id="closeScoreModal" class="action-btn">Continue Building</button>
        `;
        
        // Attach event listeners
        if (nextLevelExists) {
            document.getElementById('nextLevelBtn')?.addEventListener('click', () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                    loadLevel(currentLevel.id + 1);
                }, 300);
            });
        }
        
        document.getElementById('retryLevelBtn')?.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                loadLevel(currentLevel.id);
            }, 300);
        });
        
        document.getElementById('levelSelectBtn')?.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                showLevelSelectionModal();
            }, 300);
        });
    } else {
        buttonsContainer.innerHTML = `
            <button id="closeScoreModal" class="action-btn">Continue Building</button>
        `;
    }
    
    // Close modal handler (always present)
    document.getElementById('closeScoreModal')?.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    
    // Show modal with animation
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Show the level selection modal
 */
function showLevelSelectionModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('levelModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'levelModal';
        modal.className = 'level-modal';
        modal.innerHTML = `
            <div class="level-modal-content">
                <div class="level-modal-header">
                    <h2>Select Level</h2>
                    <button id="closeLevelModal" class="close-btn">✖</button>
                </div>
                <div id="levelGrid" class="level-grid"></div>
                <div class="level-modal-footer">
                    <button id="sandboxModeBtn" class="action-btn">🎨 Sandbox Mode</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close button handler
        document.getElementById('closeLevelModal').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
        
        // Sandbox mode button
        document.getElementById('sandboxModeBtn').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                returnToSandbox();
            }, 300);
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // Populate level grid
    const levelGrid = document.getElementById('levelGrid');
    levelGrid.innerHTML = '';
    
    LEVELS.forEach(level => {
        const progress = levelProgress[level.id];
        const isLocked = !progress.unlocked;
        
        const levelCard = document.createElement('div');
        levelCard.className = `level-card ${isLocked ? 'locked' : ''} ${progress.completed ? 'completed' : ''}`;
        
        if (isLocked) {
            levelCard.innerHTML = `
                <div class="level-number">🔒</div>
                <div class="level-name">Level ${level.id}</div>
                <div class="level-stars">Locked</div>
            `;
        } else {
            const starsHTML = '⭐'.repeat(progress.stars) + '☆'.repeat(3 - progress.stars);
            levelCard.innerHTML = `
                <div class="level-number">${level.id}</div>
                <div class="level-name">${level.name}</div>
                <div class="level-desc">${level.description}</div>
                <div class="level-stars">${starsHTML}</div>
                ${progress.bestScore > 0 ? `<div class="level-best-score">Best: ${progress.bestScore}</div>` : ''}
            `;
            
            levelCard.addEventListener('click', () => {
                loadLevel(level.id);
            });
        }
        
        levelGrid.appendChild(levelCard);
    });
    
    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function resetMachine() {
    if (!isRunning) return;
    
    playSound('ui'); // Play UI sound for reset action
    // Stop the runner
    if (runner) {
        Runner.stop(runner);
    }
    
    // Remove NPC and recreate it at appropriate position
    Composite.remove(world, npc);
    if (gameMode === 'level' && currentLevel) {
        createNPC(currentLevel.npcPosition.x, currentLevel.npcPosition.y);
    } else {
        createNPC();
    }
    
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
    
    // In level mode, only remove player-placed objects, keep preplaced ones
    if (gameMode === 'level' && preplacedLevelObjects.length > 0) {
        // Remove only objects that aren't preplaced
        placedObjects.forEach(obj => {
            if (!preplacedLevelObjects.includes(obj)) {
                Composite.remove(world, obj);
            }
        });
        placedConstraints.forEach(constraint => {
            // Check if this constraint belongs to a preplaced seesaw
            const isPreplaced = preplacedLevelObjects.some(obj => 
                obj.seesawId && obj.seesawId === constraint.seesawId
            );
            if (!isPreplaced) {
                Composite.remove(world, constraint);
            }
        });
        
        // Keep only preplaced objects
        placedObjects = [...preplacedLevelObjects];
        placedConstraints = placedConstraints.filter(c => 
            preplacedLevelObjects.some(obj => obj.seesawId && obj.seesawId === c.seesawId)
        );
    } else {
        // Sandbox mode - remove everything
        placedObjects.forEach(obj => {
            Composite.remove(world, obj);
        });
        placedConstraints.forEach(constraint => {
            Composite.remove(world, constraint);
        });
        placedObjects = [];
        placedConstraints = [];
    }
    
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
    
    updateStatus('Cleared! Start building your machine.');
    updateObjectCounter();
    updateLevelInfoDisplay();
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
