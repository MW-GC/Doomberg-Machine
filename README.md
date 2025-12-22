# Doomberg-Machine 🎰💀
A small game about making a 'Rube Goldberg' machine that must end with the death of the NPC.

## Description
Build creative chain-reaction contraptions using various physics objects to doom the innocent NPC! This browser-based 2D physics game uses Matter.js to simulate realistic physics interactions.

## Features
- 🎮 **Interactive Physics Sandbox**: Place and arrange objects on the canvas
- ⚙️ **Realistic Physics**: Powered by Matter.js physics engine
- 🎨 **Multiple Object Types**:
  - ⚽ **Ball**: Bouncy spheres perfect for rolling down ramps
  - 📦 **Box**: Heavy blocks for crushing or domino effects
  - 🎴 **Domino**: Tall, thin pieces for chain reactions
  - 📐 **Ramp**: Angled platforms to redirect falling objects
  - ▬ **Platform**: Static ledges to hold objects
  - ⚖️ **Seesaw**: Interactive pivot point for complex contraptions
- 💀 **NPC Target**: The poor red figure that awaits its doom
- 🎯 **Collision Detection**: Automatically detects when the NPC gets hit
- 🔄 **Reset & Clear**: Easily restart or clear your contraption

## How to Play

1. **Open the game**: Simply open `index.html` in a web browser
2. **Select an object**: Click on one of the object buttons (Ball, Box, Domino, etc.)
3. **Place objects**: Click anywhere on the canvas to place the selected object
4. **Build your machine**: Create a Rube Goldberg contraption that will hit the NPC
5. **Run the simulation**: Click the "▶️ Run Machine" button to start the physics
6. **Watch the chaos**: See if your contraption successfully dooms the NPC!
7. **Try again**: Use "🔄 Reset" to restore positions or "🗑️ Clear All" to start over

## Running the Game

### Option 1: Direct Browser Opening
Simply double-click `index.html` or drag it into your browser.

### Option 2: Local Web Server (Recommended)
```bash
# Using Python 3
python3 -m http.server 8080

# Using Python 2
python -m SimpleHTTPServer 8080

# Using Node.js (if you have http-server installed)
npx http-server -p 8080
```

Then navigate to `http://localhost:8080` in your web browser.

## Technologies Used
- **HTML5 Canvas**: For rendering the game
- **CSS3**: For beautiful, responsive UI
- **JavaScript**: Game logic and interaction
- **Matter.js**: Physics engine for realistic simulations

## Game Objectives
- Create the most creative Rube Goldberg machine possible
- Successfully doom the NPC by hitting it with objects
- Experiment with different contraption designs
- Challenge yourself to create complex chain reactions!

## Tips for Success
- 💡 Start simple - place a ball high up and let gravity do the work
- 💡 Use ramps to redirect falling objects toward the NPC
- 💡 Combine multiple object types for more interesting contraptions
- 💡 Remember: the NPC is on the right side of the canvas
- 💡 Heavy objects (boxes) can provide more impact force

## Future Enhancements (Potential)
- 3D version using Unity or Unreal Engine
- More object types (springs, explosives, etc.)
- Multiple levels with different challenges
- Score system based on creativity and efficiency
- Share and replay contraptions

## License
Open source - feel free to modify and enhance!

---

**Have fun building your doom machines!** 🎰💀
