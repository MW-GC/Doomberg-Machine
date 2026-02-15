---
layout: default
title: Gameplay Guide
---

# 🎮 Doomberg Machine - Gameplay Guide

Welcome to **Doomberg Machine**, a creative physics-based puzzle game where you build elaborate Rube Goldberg contraptions to doom an unsuspecting NPC! Think of it as a combination of *The Incredible Machine* meets dark humor.

## 🎯 Game Objective

Your mission is simple yet delightfully chaotic: **Create a chain-reaction machine that successfully hits the NPC!**

The red stick figure NPC stands innocently on the right side of the screen, blissfully unaware of the doom you're about to engineer. Your job is to place objects and build contraptions that will inevitably lead to their demise through physics-based interactions.

## 🎨 Available Objects

### ⚽ Ball
- **Type**: Dynamic object
- **Physics**: Bouncy, lightweight
- **Best For**: Rolling down ramps, starting chain reactions
- **Tip**: Balls have high restitution (bounciness) and work great for creating momentum

### 📦 Box
- **Type**: Dynamic object  
- **Physics**: Heavy, moderate bounce
- **Best For**: Crushing, domino effects, heavy impacts
- **Tip**: Boxes are denser than balls and deliver more forceful impacts

### 🎴 Domino
- **Type**: Dynamic object
- **Physics**: Tall and thin, easily toppled
- **Best For**: Classic domino chain reactions
- **Tip**: Place multiple dominoes in a line for satisfying cascading effects

### 📐 Ramp
- **Type**: Static object (doesn't move)
- **Physics**: Angled platform
- **Best For**: Redirecting falling objects, controlling trajectories
- **Special Feature**: Rotatable! Press `Q` to rotate counter-clockwise, `E` to rotate clockwise (15° increments)
- **Tip**: Experiment with different angles to guide objects toward the NPC

### ▬ Platform
- **Type**: Static object
- **Physics**: Horizontal ledge
- **Best For**: Creating levels, holding objects before release
- **Tip**: Stack objects on platforms at different heights for complex machines

### ⚖️ Seesaw
- **Type**: Dynamic pivot system
- **Physics**: Balanced plank on a pivot point
- **Best For**: Weight-based triggers, launching objects
- **Tip**: Drop a heavy object on one side to catapult lighter objects on the other side

## 🕹️ How to Play

### Getting Started

1. **Open the Game**
   - Open `index.html` in any modern web browser
   - For best results, use a local web server (see Technical Guide)

2. **Select an Object**
   - Click any object button in the "Objects" control panel
   - The selected button will highlight in purple
   - Status bar will confirm your selection

3. **Adjust Ramp Angle** (Optional)
   - When the Ramp tool is selected, use keyboard controls:
     - Press `Q` to rotate counter-clockwise
     - Press `E` to rotate clockwise
     - Each press rotates by 15 degrees
   - Current angle displays in the status bar

4. **Toggle Grid** (Optional)
   - Click the **⊞ Grid** button to enable/disable the grid overlay
   - When enabled, a 40px grid appears on the canvas
   - Objects snap to the nearest grid intersection for precise alignment
   - Grid OFF allows free placement at any position

5. **Place Objects**
   - Click anywhere on the blue canvas to place the selected object
   - Objects appear at your click location (or snapped to grid if enabled)
   - You can place up to 100 objects for optimal performance

5. **Build Your Machine**
   - Combine different objects strategically
   - Think about gravity, momentum, and chain reactions
   - The NPC is positioned on the right side - plan your trajectory!
   - Use the grid for precise alignment and professional-looking contraptions

6. **Run the Simulation**
   - Click the green **▶️ Run Machine** button
   - Physics activates and your contraption comes to life
   - Watch as objects interact and (hopefully) doom the NPC

6. **Check Success**
   - If an object hits the NPC with sufficient velocity, doom is achieved!
   - NPC Status changes to "DOOMED! 💀☠️"
   - NPC turns black to indicate successful doom

7. **Reset or Clear**
   - **🔄 Reset**: Restores all objects to their starting positions (only works while machine is running)
   - **🗑️ Clear All**: Removes all placed objects to start fresh

## 💡 Strategy Tips

### For Beginners
- **Start Simple**: Place a ball high up, let gravity do the work
- **Use Ramps**: Direct falling objects toward the NPC with angled ramps
- **Test Early**: Don't build too much before testing - run your machine often!
- **Learn Physics**: Heavier objects (boxes) deliver more impact force
- **Enable Grid**: Use the grid toggle for precise, aligned contraptions

### Advanced Techniques
- **Multi-Stage Machines**: Create multiple chain reactions that lead to each other
- **Seesaw Launches**: Drop a box on one side of a seesaw to catapult a ball toward the NPC
- **Domino Triggers**: Use dominoes to trigger delayed reactions
- **Ramp Combinations**: Stack multiple angled ramps to create complex trajectories
- **Platform Staging**: Build multi-level contraptions with platforms at different heights

### Creative Challenges
- 🏆 **Minimalist**: Doom the NPC with the fewest objects possible
- 🏆 **Rube Goldberg Master**: Create the longest chain reaction before impact
- 🏆 **Precision Engineer**: Hit the NPC within 3 seconds of starting
- 🏆 **The Domino Effect**: Doom the NPC using only dominoes
- 🏆 **No Direct Hit**: Use a seesaw or indirect method to launch the final projectile

## 🎮 Controls Reference

| Action | Control |
|--------|---------|
| Select Object | Click object button |
| Place Object | Click on canvas |
| Delete Object | Right-click on object |
| Toggle Grid/Snap | Click "⊞ Grid" button |
| Rotate Ramp CCW | `Q` key |
| Rotate Ramp CW | `E` key |
| Run Machine | Click "▶️ Run Machine" |
| Pause/Resume | Click "⏸️ Pause" / "▶️ Play" or `Space` key |
| Slow Motion Toggle | Click "🐌 Slow-Mo" |
| Reset Positions | Click "🔄 Reset" |
| Clear All | Click "🗑️ Clear All" |
| Undo | Click "↶ Undo" or `Ctrl+Z` |
| Redo | Click "↷ Redo" or `Ctrl+Y` |

## ❓ Frequently Asked Questions

**Q: Why isn't my object hitting the NPC hard enough?**  
A: The collision detection requires sufficient velocity. Try dropping objects from higher up, or use heavier objects like boxes for more impact force.

**Q: Can I move objects after placing them?**  
A: Not currently - but you can right-click to delete individual objects and place them again, or use Reset to restore positions or Clear All to start over.

**Q: What happens if I run the machine with no objects placed?**  
A: Nothing! The NPC will just stand there, safe and sound. You need to place objects first.

**Q: How do I know what angle my ramp is at?**  
A: When you have the ramp tool selected, press Q or E to rotate, and the current angle (in degrees) displays in the status bar.

**Q: Can objects go off-screen?**  
A: No - the game has invisible walls on the left and right sides to keep everything in play.

**Q: How do I use pause and slow-motion?**  
A: Once the simulation is running, press the Space key or click the "⏸️ Pause" button to pause. Press again to resume. Click "🐌 Slow-Mo" to run at 25% speed for detailed observation. You can even toggle slow-motion while paused - it will activate when you resume.

**Q: What does the Grid toggle do?**  
A: The Grid button enables/disables a 40px grid overlay on the canvas. When enabled (Grid: ON), objects automatically snap to the nearest grid intersection for perfectly aligned placement. Turn it off (Grid: OFF) for free placement at any position. Great for creating precise, professional-looking contraptions!

**Q: Does the NPC fight back?**  
A: Nope! The NPC is purely a target and doesn't move or defend itself (until you hit it).

## 🎪 Fun Facts

- The game uses Matter.js, a real physics engine, so all interactions follow actual physics laws
- The NPC is composed of 6 body parts (head, body, two arms, two legs) constrained together
- Each object type has different density and restitution (bounciness) values
- Ramps default to a -17° angle, which is optimal for most contraptions
- The seesaw uses a constraint system to create realistic pivot physics

## 🎭 Easter Eggs & Secrets

> *"Some say if you doom the NPC fast enough, something special happens..."*

Experiment and discover hidden behaviors! The game rewards creativity and experimentation.

---

## 🎨 Community Ideas

Have an amazing contraption you'd like to share? Consider:
- Taking a screenshot of your setup before running it
- Creating a tutorial video of your most creative machines
- Sharing contraption designs with friends

## 🔜 Coming Soon?

Keep an eye on the repository for potential future features:
- Level system with increasing difficulty
- More object types (springs, explosives, fans)
- Save/load contraption designs
- Leaderboards and scoring system
- Multiplayer contraption challenges

---

**Now go forth and engineer some doom!** 💀🎰

*Remember: In Doomberg Machine, failure is just another opportunity to try a more creative solution!*
