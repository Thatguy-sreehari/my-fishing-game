# Game Configuration & Constants

## Fish Database Statistics
- **Total Fish**: 102
- **Night-Only Species**: 18
- **Water Types**: 2 (Freshwater, Saltwater)
- **Size Categories**: 4 (Tiny, Small, Medium, Large)
- **Rarity Tiers**: 4 (Common, Uncommon, Rare, Very Rare)

## Point Distribution
```
Common:     10-30 points (40% catch rate)
Uncommon:   25-50 points (30% catch rate)
Rare:       51-75 points (20% catch rate)
Very Rare:  76-100 points (10% catch rate)
```

## Game Timing
- **Start Time**: 6:00 AM (360 minutes)
- **Night Window**: 3:00 AM - 6:00 AM (minutes 180-360)
- **Day Window**: 6:00 AM - 3:00 AM (minutes 360-1440 + 0-180)
- **Day Cycle**: 24 hours = 1440 minutes

## Inventory Limits
- **Max Capacity**: 20 fish
- **No Level Cap**: Unlimited progression
- **Score**: No maximum cap

## Night-Only Fish (18 Special Species)
1. Catfish (Large, 55 pts)
2. Eel (Small, 26 pts)
3. Moonfish (Medium, 50 pts)
4. Nightjar (Medium, 52 pts)
5. Ghost Fish (Medium, 80 pts)
6. Midnight Croaker (Large, 88 pts)
7. Dragonfish (Small, 77 pts)
8. Lanternfish (Small, 54 pts)
9. Anglerfish (Medium, 82 pts)
10. Viperfish (Small, 79 pts)
11. Twilight Bass (Medium, 56 pts)
12. Black Carp (Large, 89 pts)
13. Squid (Medium, 47 pts)
14. Octopus (Medium, 66 pts)
15. Nautilus (Medium, 87 pts)
16. Lamprey (Small, 84 pts)
17. Monkfish (Large, 83 pts)
18. Void Fish (Large, 100 pts)

## UI Colors
```
Primary Gradient: #667eea to #764ba2 (Purple)
Secondary Gradient: #f093fb to #f5576c (Pink-Red)
Tertiary Gradient: #4facfe to #00f2fe (Blue-Cyan)
Water Gradient: #87CEEB to #4A90E2
Text Primary: #333333
Text Secondary: #666666
```

## File Sizes (Approximate)
- index.html: ~8 KB
- css/style.css: ~12 KB
- js/game.js: ~18 KB
- data/fish.json: ~15 KB
- README.md: ~10 KB
- Total: ~63 KB (web-ready size)

## Performance Notes
- Smooth 60 FPS canvas rendering
- No external dependencies required (vanilla JS)
- Lightweight particle system (max 50 particles)
- Efficient DOM updates only on state changes
- Minimal memory footprint (~2-3 MB typical)

## Browser Requirements
- HTML5 Canvas support
- ES6 JavaScript
- Fetch API
- CSS Grid & Flexbox

## Sprite Directory Structure (To Implement)
```
sprites/
├── fish/
│   ├── tiny/
│   ├── small/
│   ├── medium/
│   └── large/
├── backgrounds/
│   ├── daytime.png
│   ├── nighttime.png
│   ├── freshwater.png
│   └── saltwater.png
├── ui/
│   ├── bobber.png
│   ├── hook.png
│   └── particles/
└── animations/
    ├── splash.gif
    └── cast.gif
```

## API Endpoints (For Future Backend)
- POST /api/save-game
- GET /api/leaderboard
- POST /api/achievement
- GET /api/fish-info/{id}

## Accessibility Features
- Keyboard navigation support
- Clear text descriptions for all icons
- High contrast colors
- Screen reader friendly HTML structure

## Customization Hotspots
1. Fish weights in `catchRandomFish()` function
2. Color scheme in `css/style.css`
3. Fish database in `data/fish.json`
4. Point values and rarity thresholds in fish data
5. UI text in HTML templates

## Save Game Structure (If Implementing)
```json
{
  "score": 1250,
  "fishCaught": 34,
  "level": 4,
  "currentTime": 600,
  "currentZone": "freshwater",
  "inventory": [...],
  "caughtSpecies": [1, 5, 12, ...],
  "lastSaveTime": "2024-04-20T15:30:00Z"
}
```

## Testing Checklist
- [ ] All 102 fish can be caught
- [ ] Night-only fish appear at 3-6 AM only
- [ ] Zone filtering works correctly
- [ ] Inventory respects 20-fish limit
- [ ] Leveling system increments properly
- [ ] Modal popups display fish info correctly
- [ ] Stats calculation is accurate
- [ ] Particle effects render smoothly
- [ ] No console errors on game actions
- [ ] Responsive design works on mobile

## Known Limitations & Future Improvements
- Canvas rendering only (no sprite animation yet)
- No persistent save system
- No multiplayer/networking
- No sound effects
- No mobile touch optimization
- No accessibility for fully disabled users (WIP)

## Contact & Support
For modifications or extensions:
1. Edit fish.json to add/modify species
2. Update game.js game mechanics
3. Customize css/style.css for theming
4. Add sprite assets to sprites/ folder

Happy fishing! 🎣
