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

### 🌀 Spring
- **Type**: Dynamic object
- **Physics**: Super bouncy, lightweight
- **Best For**: Launching objects at high speed, creating unexpected trajectories
- **Special Feature**: Restitution of 1.5 (higher than normal) creates explosive bounce effects
- **Tip**: Place springs strategically to redirect falling objects with extreme velocity

### 💣 Explosive
- **Type**: Dynamic object (single-use)
- **Physics**: Moderate weight, detonates on impact
- **Best For**: Creating explosive force fields, launching multiple objects simultaneously
- **Special Feature**: Detonates when hit by a fast-moving object (velocity > 1), applies radial force to all nearby objects within 150px
- **Visual Feedback**: Changes from red to orange when exploding, then disappears
- **Tip**: Place near the NPC or use to trigger chain reactions with multiple objects

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

6. **Build Your Machine**
   - Combine different objects strategically
   - Think about gravity, momentum, and chain reactions
   - The NPC is positioned on the right side - plan your trajectory!
   - Use the grid for precise alignment and professional-looking contraptions

7. **Run the Simulation**
   - Click the green **▶️ Run Machine** button
   - Physics activates and your contraption comes to life
   - Watch as objects interact and (hopefully) doom the NPC

8. **Check Success**
   - If an object hits the NPC with sufficient velocity, doom is achieved!
   - NPC Status changes to "DOOMED! 💀☠️"
   - NPC turns black to indicate successful doom

9. **Reset or Clear**
   - **🔄 Reset**: Restores all objects to their starting positions (only works while machine is running)
   - **🗑️ Clear All**: Removes all placed objects to start fresh

9. **View Your Score**
   - After successfully dooming the NPC, a score modal will appear
   - Your performance is evaluated on multiple factors
   - Earn 1-3 stars based on your total score!

## ⭐ Scoring System

When you successfully doom the NPC, your contraption is scored based on four key metrics:

### 📊 Scoring Factors

**🎯 Success (1000 points)**
- Base reward for successfully dooming the NPC
- This is your foundation score

**⚡ Efficiency Bonus (up to 500 points)**
- Fewer objects = higher score
- Formula: `500 - ((object_count - 1) × 20)`
- Using just 1 object gives maximum bonus!
- Each additional object reduces your bonus by 20 points

**⏱️ Speed Bonus (up to 500 points)**
- Faster doom = higher score
- Formula: `500 - (doom_time_seconds × 50)`
- Maximum bonus is only achieved when doom happens immediately (0.0s)
- The bonus decreases linearly by 50 points per second of delay (e.g., 0.8s → 460, 1.0s → 450)

**🎨 Variety Bonus (100 points per type)**
- Using different object types increases your score
- Each unique object type adds 100 points
- Encourages creative, diverse contraptions
- Maximum: 600 points (all 6 object types)

**🔥 Combo Multiplier (1.0x - 1.6x)**
- More collisions = higher multiplier
- Activates when you have 5+ collisions
- Formula: `1.1 + min((collisions - 5) × 0.05, 0.5)`
- Maximum multiplier: 1.6x (at 15+ collisions)
- Rewards complex chain reactions!

### 🌟 Star Ratings

Your final score determines your star rating:

- ⭐ **1 Star**: 0 - 1,999 points (Good job!)
- ⭐⭐ **2 Stars**: 2,000 - 2,799 points (Excellent!)
- ⭐⭐⭐ **3 Stars**: 2,800+ points (Perfect!)

### 🏆 Example Scores

**Simple Success (1 Ball, Fast)**
- 1 object, 1.2 seconds, 1 type, 3 collisions
- Score: 1,000 + 500 + 440 + 100 = 2,040 (⭐⭐)

**Efficient Master (Minimal Objects)**
- 2 objects, 2.5 seconds, 2 types, 5 collisions
- Score: 1,000 + 480 + 375 + 200 = 2,055 (⭐⭐)

**Variety Showman (All Types)**
- 10 objects, 5 seconds, 6 types, 20+ collisions
- Score: (1,000 + 320 + 250 + 600) × 1.6 = 3,472 (⭐⭐⭐)

**Speed Demon (Fast & Efficient)**
- 3 objects, 0.8 seconds, 3 types, 12 collisions
- Base: 1,000 + 460 + 460 + 300 = 2,220
- Multiplier: 1.1 + (12 - 5) × 0.05 = 1.45x
- Score: 2,220 × 1.45 = 3,219 (⭐⭐⭐)

To get 3 stars, focus on:
- Fast completion (under 2 seconds)
- Efficient use of objects (fewer is better for efficiency, but variety helps too)
- Creating chain reactions for combo multipliers

## 💾 Save/Load System

The game includes a complete save/load system that stores your contraptions in your browser's localStorage:

### Features
- **Persistent Storage**: Designs are saved even after closing the browser
- **Named Saves**: Give each design a descriptive name (up to 30 characters)
- **Automatic List**: All saved designs appear in the dropdown menu
- **Complex Objects**: Properly saves and restores seesaws, ramps with rotation, and all object types
- **Quick Access**: Quickly switch between different machine designs
- **Multiple Saves**: Save as many different contraptions as you want

### Use Cases
- **Iterate on Designs**: Save work-in-progress and come back later
- **Share Locations**: Note down a design name to tell friends which contraption to try
- **Competition**: Save your record-breaking minimalist solutions
- **Collections**: Build a library of your favorite machines
- **Learning**: Save examples of different physics techniques

### Tips
- Use descriptive names like "3-Ball Cascade" or "Seesaw Launch v2"
- Regularly save your work before making big changes
- Delete old designs you no longer need to keep the list manageable
- Designs include exact positions and angles of all objects

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
- **Spring Combos**: Bounce objects through multiple springs for extreme velocity
- **Explosive Chains**: Place explosives near each other to create cascading explosions
- **Spring-Explosive Combo**: Launch an object with a spring to detonate an explosive with high velocity

### Creative Challenges
- 🏆 **Minimalist**: Doom the NPC with the fewest objects possible (maximize efficiency bonus!)
- 🏆 **Rube Goldberg Master**: Create the longest chain reaction before impact (maximize combo multiplier!)
- 🏆 **Precision Engineer**: Hit the NPC within 1 second of starting (maximize speed bonus!)
- 🏆 **The Domino Effect**: Doom the NPC using only dominoes
- 🏆 **No Direct Hit**: Use a seesaw or indirect method to launch the final projectile
- 🏆 **Variety Show**: Use all 6 object types in one contraption (maximize variety bonus!)
- 🏆 **Perfect Score**: Achieve 3 stars with the highest possible score!

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
| Undo | `Ctrl+Z` or Click "↶ Undo" |
| Redo | `Ctrl+Y` or `Ctrl+Shift+Z` or Click "↷ Redo" |
| Save Design | Type name and click "💾 Save" or press `Enter` |
| Load Design | Select from dropdown and click "📂 Load" |
| Delete Saved Design | Select from dropdown and click "🗑️ Delete" |

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

**Q: Where are my saved designs stored?**  
A: Designs are stored in your browser's localStorage. They persist across sessions but are specific to your browser on this device. Clearing browser data will delete saved designs.

**Q: Can I share my contraptions with others?**  
A: Currently, designs are saved locally. You can tell others the name of your save and describe the machine, but there's no export/import feature yet (planned for future updates).

**Q: Is there a limit to how many designs I can save?**  
A: Browser localStorage typically allows 5-10MB. Each contraption is small (a few KB), so you can save hundreds of designs before running into limits.

**Q: What happens if I save with the same name twice?**  
A: The new save will overwrite the old one. Use unique names or add version numbers (e.g., "Machine v1", "Machine v2") to keep multiple iterations.

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
- More object types (fans, magnets, portals)
- Save/load contraption designs
- Leaderboards and scoring system
- Multiplayer contraption challenges

---

**Now go forth and engineer some doom!** 💀🎰

*Remember: In Doomberg Machine, failure is just another opportunity to try a more creative solution!*
