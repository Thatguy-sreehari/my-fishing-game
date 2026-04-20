# ⛵ SUPER FISHING QUEST ⛵

A comprehensive fishing game combining the mechanics of "Cat Goes Fishing" and "Scale the Depths" with **102+ unique fish**, **day/night cycles**, and **special nighttime creatures**.

## 🎮 Features

### Core Gameplay
- **Cast & Catch** - Click "CAST LINE" to fish in selected zones
- **Day/Night Cycle** - Advance time to unlock night-only fish (3 AM - 6 AM)
- **Dual Zones** - Fish in Freshwater or Saltwater environments
- **Inventory System** - Collect up to 20 fish simultaneously
- **Progressive Difficulty** - Level up as you catch more fish

### Fish & Progression
- **102 Unique Fish** - Categorized by:
  - **Size**: Tiny, Small, Medium, Large
  - **Rarity**: Common, Uncommon, Rare, Very Rare
  - **Water Type**: Freshwater or Saltwater
  - **Availability**: Day/Night specific creatures

### Night Fishing (Special)
- **3 AM - 6 AM Window**: Exclusive night-only fish appear
- **Rare Night Species**:
  - 🌙 Catfish
  - 🌙 Eel
  - 🌙 Ghost Fish
  - 🌙 Dragonfish
  - 🌙 Anglerfish
  - 🌙 Void Fish (Legendary - 100 points!)
  - And many more...

### Collection & Stats
- **Species Tracking** - See how many unique fish you've caught (0/102)
- **Collection Analytics** - Break down catches by size, rarity, water type
- **Scoring System** - Common fish (10-30 pts), Rare (50-75 pts), Legendary (80-100 pts)
- **Progress Percentage** - Track completion toward 100%

## 🎮 How to Play

### Quick Start
1. Open `index.html` in a web browser
2. Click **"CAST LINE"** to fish in the current zone
3. Click **"ADVANCE TIME"** to move through the day
4. Watch for special night creatures appearing between 3 AM - 6 AM

### Controls
| Control | Action |
|---------|--------|
| 🎣 CAST LINE | Attempt to catch a fish |
| ⏰ ADVANCE TIME | Move time forward by 1 hour |
| 📍 Zone Select | Switch between Freshwater/Saltwater |
| 🗑️ Clear | Empty inventory (start fresh) |
| 📊 Stats | View collection breakdown |
| ❓ Help | Show instructions |

### Strategy Tips
- 🌙 Fish at night (3-6 AM) for rare, high-point creatures
- 🌊 Different fish appear in different water types
- 📈 Larger fish typically have higher rarity and points
- 🎯 Complete your collection for 100% achievement

## 📁 Project Structure

```
My fishing game/
├── index.html              # Main game page
├── css/
│   └── style.css          # Game styling & UI
├── js/
│   └── game.js            # Core game logic
├── data/
│   └── fish.json          # 102 fish database
├── sprites/               # Add your sprite images here
│   ├── fish/
│   ├── background/
│   └── ui/
├── assets/                # Game assets folder
└── README.md              # This file
```

## 🐟 Fish Classification

### By Rarity
| Rarity | Example Fish | Catch Rate | Points |
|--------|-------------|-----------|--------|
| Common | Guppy, Minnow | 40% | 10-20 |
| Uncommon | Trout, Carp | 30% | 25-50 |
| Rare | Shark, Tuna | 20% | 55-75 |
| Very Rare | Void Fish, Arapaima | 10% | 80-100 |

### By Size
- **Tiny** (1-3 inches) - Quick catches, common
- **Small** (4-8 inches) - Fair challenge
- **Medium** (9-15 inches) - Good rewards
- **Large** (16+ inches) - High value, harder to catch

### Night-Exclusive Fish (3 AM - 6 AM)
- Catfish
- Eel
- Moonfish
- Ghost Fish
- Dragonfish
- Lanternfish
- Anglerfish
- Viperfish
- Twilight Bass
- Black Carp
- Squid
- Octopus
- Nautilus
- Midnight Croaker
- Seahag
- Phantom Perch
- Void Fish
- And more...

## 🎨 Customization

### Adding Sprites
1. Place fish sprite images in `sprites/fish/` folder
2. Update fish.json with sprite path references
3. Modify `game.js` to render sprites instead of circles

### Modifying Fish
Edit `data/fish.json` to:
- Add new fish species
- Adjust catch rates (modify weight system in `game.js`)
- Change point values
- Add/remove night-exclusive species

### Theming
Modify `css/style.css` to:
- Change color gradients
- Adjust UI layout
- Add custom fonts
- Customize animations

## 🛠️ Technical Details

### Technologies Used
- **HTML5** - Game structure
- **CSS3** - Styling with gradients & animations
- **Canvas API** - Graphics rendering
- **JavaScript (Vanilla)** - Game logic & state management
- **JSON** - Fish database

### Game Loop
- Real-time canvas animation at 60 FPS
- Particle effect system for fishing feedback
- Weighted random selection for fish spawning
- Persistent inventory storage

### Browser Compatibility
Works on all modern browsers supporting:
- HTML5 Canvas
- ES6 JavaScript
- Fetch API

## 📊 Game Mechanics

### Fishing Algorithm
```
1. Player clicks CAST LINE
2. getAvailableFish() filters by:
   - Current zone (fresh/salt water)
   - Current time (night-only filter)
3. Weighted random selection (rarity affects probability)
4. Fish added to inventory (max 20)
5. Points awarded & level updated
```

### Leveling System
- **Level** = (Fish Caught ÷ 10) + 1
- No level cap - catch infinitely!

### Time Cycle
- Advances by 60 minutes per click
- 24-hour cycle (0-1440 minutes)
- Night period: 3 AM - 6 AM (minutes 180-360)

## 🔄 Future Enhancement Ideas

- [ ] Multiplayer leaderboards
- [ ] Fish evolution/breeding system
- [ ] Boss fish encounters
- [ ] Equipment upgrades
- [ ] Mini-games for better catch rates
- [ ] Save/load progress
- [ ] Mobile touch controls
- [ ] Sound effects & music
- [ ] Animated sprites
- [ ] Fishing competitions

## 📝 Credits

Created by combining game mechanics from:
- **Cat Goes Fishing** - Casual fishing mechanics
- **Scale the Depths** - Depth/progression system
- **Custom Systems** - 102+ fish database, day/night cycles

## 🎓 Educational Value

This game teaches:
- Object-oriented game design
- State management patterns
- DOM manipulation & Canvas API
- Data structure organization
- Random weighted selection algorithms
- UI/UX design principles

## 📖 License

Feel free to modify and use for educational purposes. Add your own sprites and creative touches!

---

**Ready to become a master fisher? Start your quest now! 🎣✨**
