# GAME DESIGN DOCUMENT
## Super Fishing Quest - Technical Design

---

## 1. VISION & OVERVIEW

**Genre**: Casual Fishing Simulation / Collection Game
**Platform**: Web Browser (HTML5/Canvas)
**Target Audience**: All Ages, Casual Gamers
**Inspiration**: Cat Goes Fishing + Scale the Depths Mechanics

**Core Loop**:
1. Select zone (Fresh/Salt water)
2. Cast fishing line
3. Catch random fish (weighted by rarity)
4. View caught fish
5. Build collection
6. Advance time to unlock night-only creatures

---

## 2. GAME MECHANICS

### 2.1 Casting System
- **Trigger**: Player clicks "CAST LINE" button
- **Animation**: 1.5 second fishing animation
- **Calculation**: 
  - Gets available fish for current conditions
  - Uses weighted random selection based on rarity
  - Adds to inventory if space available
  - Shows catch modal with fish info
- **Feedback**: Particles, modal popup, status message

### 2.2 Time Progression
- **Base Time**: 6:00 AM (start)
- **Advance Amount**: +60 minutes per click
- **Cycle**: 24 hours (resets after 11:59 PM)
- **Night Window**: 3:00 AM - 6:00 AM (special fish appear)
- **Impact**: 
  - Changes UI time display
  - Filters available fish
  - Triggers night-only species
  - Updates visual feedback

### 2.3 Zone Selection
- **Freshwater**: Lakes, rivers, ponds
  - Available fish: 50+
  - Examples: Trout, Catfish, Pike, Koi
  - Mechanics: Same catch algorithm
  
- **Saltwater**: Ocean, sea
  - Available fish: 50+
  - Examples: Salmon, Shark, Tuna, Lionfish
  - Mechanics: Same catch algorithm

### 2.4 Rarity & Catch Weights

**Weight System** (affects spawn probability):
```
Common:     100 weight → 40% encounter rate
Uncommon:   50 weight  → 30% encounter rate
Rare:       20 weight  → 20% encounter rate
Very Rare:  5 weight   → 10% encounter rate
```

**Calculation**:
```javascript
// Weighted random selection
let totalWeight = 0;
const weighted = availableFish.map(fish => {
    weight = rarityWeights[fish.rarity];
    totalWeight += weight;
    return { fish, weight, totalWeight };
});
random = Math.random() * totalWeight;
selected = weighted.find(item => random <= item.totalWeight);
```

### 2.5 Inventory System
- **Capacity**: 20 fish maximum
- **Storage**: In-memory array
- **Features**:
  - Groups duplicate species
  - Shows count for each species caught
  - Displays rarity and value
  - Sortable by addition order
- **Limitations**: 
  - No persistence (resets on page reload)
  - Max 20 individual fish storage

### 2.6 Leveling & Progression
- **Level Formula**: `level = floor(fishCaught / 10) + 1`
- **Scaling**: Every 10 fish = +1 level
- **Cap**: Unlimited
- **Rewards**: Psychological progression only (visual feedback)

---

## 3. FISH DATABASE STRUCTURE

### 3.1 Fish Data Schema
```json
{
  "id": 1,
  "name": "Guppy",
  "size": "tiny",
  "rarity": "common",
  "points": 10,
  "nightOnly": false,
  "waterType": "freshwater"
}
```

### 3.2 Properties Explained
- **id**: Unique identifier (1-102)
- **name**: Display name
- **size**: tiny|small|medium|large (affects rarity perception)
- **rarity**: common|uncommon|rare|very_rare
- **points**: Score value (10-100)
- **nightOnly**: Boolean - appears only at 3-6 AM
- **waterType**: freshwater|saltwater

### 3.3 Fish Density
```
Tiny:      ~25 species (quick catches)
Small:     ~30 species (common)
Medium:    ~30 species (balanced)
Large:     ~17 species (rare/valuable)
```

### 3.4 Rarity Distribution
```
Common:     ~35 species (50%)
Uncommon:   ~30 species (30%)
Rare:       ~20 species (15%)
Very Rare:  ~17 species (5%)
```

---

## 4. USER INTERFACE DESIGN

### 4.1 Layout
```
┌─────────────────────────────────────────┐
│          HEADER (Title/Subtitle)         │
├─────────┬─────────────────────┬──────────┤
│  LEFT   │                     │  RIGHT   │
│  PANEL  │   CENTER CANVAS     │  PANEL   │
│  (Stats)│  (Game Rendering)   │(Inventory)
│         │                     │          │
├─────────┴─────────────────────┴──────────┤
│         FOOTER (Buttons & Info)           │
└─────────────────────────────────────────┘
```

### 4.2 Left Panel Components
1. **Game Stats** (4 boxes):
   - Time display with AM/PM
   - Score accumulator
   - Fish caught counter
   - Level indicator

2. **Fishing Zone**:
   - Dropdown to select water type
   - Shows current selection

3. **Action Buttons**:
   - CAST LINE (primary)
   - ADVANCE TIME (secondary)

### 4.3 Center Panel
- **Canvas Element**:
  - 400×500 pixels
  - Water gradient background
  - Fish collection display
  - Time indicator overlay
  - Particle effect layer

### 4.4 Right Panel
- **Inventory Header**:
  - Title + Clear button
  - Capacity indicator
  - Species count tracker

- **Inventory List**:
  - Scrollable container (max 450px height)
  - Grouped fish entries
  - Rarity-colored indicators
  - Point values displayed

### 4.5 Modal Dialogs
1. **Caught Fish Modal**:
   - Fish name (large)
   - Size/Water type info
   - Points earned (highlighted)
   - Rarity badge
   - Continue button

2. **Collection Stats Modal**:
   - 4-section grid
   - Size breakdown
   - Rarity breakdown
   - Water type breakdown
   - Night catch stats + % complete

3. **Instructions Modal**:
   - Controls explanation
   - Night fishing guide
   - Statistics info
   - Goal statement

---

## 5. VISUAL DESIGN

### 5.1 Color Scheme
**Primary**: Purple gradient (#667eea → #764ba2)
**Secondary**: Pink-Red (#f093fb → #f5576c)
**Tertiary**: Cyan (#4facfe → #00f2fe)
**Backgrounds**: 
- Water: Sky blue → Light cyan → Deep blue
- UI: White with gradient headers

### 5.2 Typography
- **Titles**: Arial Bold, 2.5em
- **Headers**: Arial Bold, 1.5em
- **Body**: Arial Regular, 1em
- **Small Text**: Arial, 0.9em

### 5.3 Icon Usage
- 🎣 Fishing/Action icons
- 🌙 Night indicator
- ☀️ Day indicator
- 🌊 Water/Ocean
- 💰 Points/Currency
- 📊 Statistics
- 🏆 Achievement
- ✨ Special/Catch
- 🐟 Fish

### 5.4 Animation Effects
- **Fade In**: Modals (0.3s)
- **Slide In**: Modal content (0.3s)
- **Particle Effects**: Water splashes during fishing
- **Hover States**: Button elevation, color shifts
- **Pulse**: Active state feedback

---

## 6. TECHNICAL IMPLEMENTATION

### 6.1 Game State Object
```javascript
gameState = {
    score: 0,              // Total points
    fishCaught: 0,         // Total fish caught
    level: 1,              // Current level
    inventory: [],         // Caught fish array
    currentTime: 360,      // Minutes (0-1440)
    maxInventory: 20,      // Storage limit
    currentZone: 'freshwater',  // Active zone
    caughtSpecies: Set(),  // Unique fish IDs
    allFish: []           // Complete fish database
}
```

### 6.2 Core Functions
1. **loadFishData()**: Load fish.json via Fetch
2. **getTimeString()**: Convert minutes to HH:MM
3. **isNightTime()**: Check 3-6 AM window
4. **getAvailableFish()**: Filter by zone + time
5. **catchRandomFish()**: Weighted random selection
6. **castLine()**: Main fishing action
7. **advanceTime()**: Progress time by 1 hour
8. **updateUI()**: Refresh all displays
9. **showCaughtModal()**: Display caught fish info
10. **showCollectionStats()**: Display analytics

### 6.3 Event Handling
- **Click Events**: Buttons, modals, close buttons
- **Change Events**: Zone dropdown
- **Animation Frames**: Canvas animation loop
- **Modal Management**: Show/hide with classes

### 6.4 Canvas Rendering
- **Gradient Background**: Water color simulation
- **Fish Display**: 5-column grid of caught fish
- **Particle System**: Splashes during fishing
- **Time Overlay**: HH:MM display, night indicator

---

## 7. GAME BALANCE

### 7.1 Difficulty Progression
- Early (0-10 fish): Common catches only
- Mid (10-30 fish): Uncommon fish appear more
- Advanced (30-50 fish): Rare fish accessible
- Expert (50+ fish): Very rare catches only

###.2 Time-to-Completion
- Casual Player: 2-3 hours to catch 50 fish
- Completionist: 8-10 hours to catch all 102
- Speedrunner: 1 hour focused night fishing

### 7.3 Point Progression
- Catch 1 Common = 15 avg points
- Catch 1 Uncommon = 35 avg points
- Catch 1 Rare = 65 avg points
- Catch 1 Very Rare = 85 avg points

---

## 8. FUTURE ENHANCEMENTS

### Phase 2: Polish
- [ ] Animated sprite rendering
- [ ] Sound effects library
- [ ] Smooth casting animation
- [ ] Fish population simulation

### Phase 3: Features
- [ ] Save/Load system
- [ ] Achievements & badges
- [ ] Daily challenges
- [ ] Fishing tournaments

### Phase 4: Expansion
- [ ] 200+ fish species
- [ ] Seasonal variations
- [ ] Equipment upgrades
- [ ] NPC interactions

### Phase 5: Multiplayer
- [ ] Global leaderboards
- [ ] Trading system
- [ ] Cooperative fishing
- [ ] Competitive tournaments

---

## 9. TECHNICAL DEBT & KNOWN ISSUES
- No sprite rendering (currently geometric)
- No persistent storage
- No mobile optimization
- Limited accessibility features
- No sound/audio system

---

## 10. DEVELOPMENT CHECKLIST

### Pre-Launch
- [x] Fish database created (102 species)
- [x] Core game mechanics implemented
- [x] UI/UX design complete
- [x] Canvas rendering working
- [ ] Sprite assets created
- [ ] Sound effects added
- [ ] Mobile testing
- [ ] Browser compatibility testing
- [ ] Performance optimization
- [ ] Bug fixing & QA

### Post-Launch
- [ ] Analytics tracking
- [ ] Player feedback collection
- [ ] Bug fix patches
- [ ] Feature updates
- [ ] Community engagement

---

**Document Version**: 1.0
**Last Updated**: April 20, 2026
**Status**: Complete Core Implementation
