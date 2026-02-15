---
layout: default
title: Doomberg Machine
---

# 🎰 Doomberg Machine 💀

Welcome to **Doomberg Machine** - a creative physics-based puzzle game where you build elaborate Rube Goldberg contraptions to doom an unsuspecting NPC!

## 🎮 Play the Game

<div style="text-align: center; margin: 30px 0;">
  <a href="../index.html" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-size: 1.2em; font-weight: bold;">
    🎮 Launch Game
  </a>
</div>

## 📚 Documentation

### For Players

- **[Gameplay Guide](gameplay.md)** - Learn how to play, controls, tips, and strategies
- **[Game Overview](#game-overview)** - Quick introduction to the game

### For Developers

- **[Technical Documentation](technical.md)** - Code structure, API reference, development guide
- **[Architecture & Design](architecture.md)** - System architecture, design patterns, data flow
- **[Enhancement Gameplan](gameplan.md)** - Roadmap of improvements and future features

## 🎯 Game Overview

**Objective**: Build a chain-reaction machine that successfully hits the NPC!

### How It Works

1. **Select Objects**: Choose from balls, boxes, dominoes, ramps, platforms, and seesaws
2. **Place on Canvas**: Click to position objects strategically
3. **Build Machine**: Create a contraption using physics and creativity
4. **Run Simulation**: Watch your machine come to life
5. **Doom the NPC**: Success when your contraption hits the target!

### Available Objects

- ⚽ **Ball** - Bouncy spheres for rolling and momentum
- 📦 **Box** - Heavy blocks for crushing impacts
- 🎴 **Domino** - Tall pieces for chain reactions
- 📐 **Ramp** - Angled platforms (rotatable with Q/E keys)
- ▬ **Platform** - Static ledges for multi-level builds
- ⚖️ **Seesaw** - Pivot points for launching objects

## ✨ Features

- **Realistic Physics**: Powered by Matter.js physics engine
- **Intuitive Controls**: Simple click-to-place interface
- **Creative Freedom**: Unlimited object placement
- **Visual Feedback**: Real-time status updates and doom detection
- **Responsive Design**: Works on desktop and mobile browsers

## 🚀 Quick Start

### Play Online
Just click the "Launch Game" button above!

### Run Locally

```bash
# Clone the repository
git clone https://github.com/MW-GC/Doomberg-Machine.git
cd Doomberg-Machine

# Start a local server
python3 -m http.server 8080

# Open in browser
# Navigate to http://localhost:8080
```

## 🎮 Controls

| Action | Control |
|--------|---------|
| Select Object | Click object button |
| Place Object | Click on canvas |
| Rotate Ramp | Q (counter-clockwise) / E (clockwise) |
| Run Machine | Click "▶️ Run Machine" |
| Reset | Click "🔄 Reset" |
| Clear All | Click "🗑️ Clear All" |

## 💡 Tips for Success

- Start simple - place a ball high up and let gravity work
- Use ramps to redirect falling objects toward the NPC
- Combine multiple object types for interesting effects
- Heavy objects (boxes) deliver more impact force
- Experiment with seesaw catapult mechanisms

## 🛠️ Technology

- **HTML5 Canvas** - Rendering
- **CSS3** - Beautiful, responsive UI
- **Vanilla JavaScript** - Game logic
- **Matter.js** - Physics simulation

## 📖 Documentation Structure

```
docs/
├── index.md          # This page
├── gameplay.md       # Player guide
├── technical.md      # Developer documentation
├── architecture.md   # System design
└── gameplan.md       # Enhancement roadmap
```

## 🤝 Contributing

Interested in contributing? Check out:

1. [Technical Documentation](technical.md) for code structure
2. [Enhancement Gameplan](gameplan.md) for feature ideas
3. [Architecture Guide](architecture.md) for design patterns

## 📜 License

Open source - feel free to modify and enhance!

## 🎪 Community

- **Repository**: [GitHub](https://github.com/MW-GC/Doomberg-Machine)
- **Issues**: [Report bugs or request features](https://github.com/MW-GC/Doomberg-Machine/issues)
- **Discussions**: Share your contraptions and ideas!

---

<div style="text-align: center; margin: 50px 0;">
  <h2>Ready to Build Your Doom Machine?</h2>
  <a href="../index.html" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 10px; font-size: 1.2em; font-weight: bold;">
    🎰 Start Playing Now!
  </a>
</div>

---

**Have fun building your doom machines!** 🎰💀
