# 🎨 SPRITE INTEGRATION GUIDE

## Overview
This guide explains how to add your custom sprites to the Super Fishing Quest game.

---

## Directory Structure

Create this folder structure in your project:

```
My fishing game/
├── sprites/
│   ├── fish/
│   │   ├── tiny/
│   │   │   ├── guppy.png
│   │   │   ├── minnow.png
│   │   │   └── ...
│   │   ├── small/
│   │   │   ├── dace.png
│   │   │   ├── perch.png
│   │   │   └── ...
│   │   ├── medium/
│   │   │   ├── trout.png
│   │   │   ├── carp.png
│   │   │   └── ...
│   │   └── large/
│   │       ├── pike.png
│   │       ├── shark.png
│   │       └── ...
│   ├── backgrounds/
│   │   ├── daytime-fresh.png (freshwater day)
│   │   ├── daytime-salt.png (saltwater day)
│   │   ├── nighttime-fresh.png (freshwater night)
│   │   └── nighttime-salt.png (saltwater night)
│   ├── effects/
│   │   ├── splash.png (splash effect)
│   │   ├── bubble.png (bubble particle)
│   │   └── ripple.png (water ripple)
│   ├── ui/
│   │   ├── bobber.png (fishing bobber)
│   │   ├── hook.png (fishing hook)
│   │   └── rod.png (fishing rod)
│   └── animations/
│       ├── cast.gif (casting animation)
│       └── bite.gif (fish bite animation)
```

---

## Sprite Specifications

### Fish Sprites

**Format**: PNG with transparency
**Dimensions**: 
- Tiny: 24×24 pixels
- Small: 32×32 pixels
- Medium: 48×48 pixels
- Large: 64×64 pixels

**Naming Convention**: `<fish-name-lowercase>.png`
Example: `rainbow-trout.png`, `ghost-fish.png`

**Quality**: 
- Minimum: 72 DPI
- Recommended: 96-144 DPI
- 8-bit or 32-bit PNG

**Attributes**:
- Transparent background (remove white/solid backgrounds)
- Fish should face right (or be symmetrical)
- Include simple shading/details
- Color should match rarity:
  - Common: Grey/Brown tones
  - Uncommon: Bright colors (reds, blues)
  - Rare: Metallic/shimmering colors
  - Very Rare: Glowing/special effects

### Background Sprites

**Daytime Backgrounds**:
- Fresh Water: Light blues, greens, clear water
- Salt Water: Deep blues, turquoise, ocean vibes
- Dimensions: 1200×600 pixels (or higher)

**Nighttime Backgrounds**:
- Fresh Water: Dark blue/purple, moonlight
- Salt Water: Deep dark blue, stars, mysterious
- Dimensions: 1200×600 pixels (or higher)

### Effect Sprites

**Splash Effect**:
- Dimensions: 64×64 pixels
- Frames: 4-6 animation frames (horizontal strip)
- Shows water disruption

**Bubble Particles**:
- Dimensions: 16×16 pixels
- Style: Semi-transparent bubbles
- Used for particle effects

---

## Implementation Steps

### Step 1: Organize Your Sprites
1. Create the sprite folder structure as shown above
2. Place fish sprites in appropriate size folders
3. Rename all sprites to match fish names in `fish.json`
4. Ensure all sprites have transparent backgrounds

### Step 2: Update fish.json (Optional)
Add a `sprite` property to each fish:

```json
{
  "id": 1,
  "name": "Guppy",
  "size": "tiny",
  "rarity": "common",
  "points": 10,
  "nightOnly": false,
  "waterType": "freshwater",
  "sprite": "sprites/fish/tiny/guppy.png"
}
```

### Step 3: Modify game.js

Replace the `drawFishCollection()` function with sprite rendering:

```javascript
function drawFishCollection() {
    if (gameState.inventory.length === 0) return;

    const cols = 5;
    const cellWidth = gameCanvas.width / cols;
    const cellHeight = 60;

    gameState.inventory.forEach((fish, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = col * cellWidth + cellWidth / 2;
        const y = 100 + row * cellHeight;

        // Load and draw fish sprite
        const img = new Image();
        img.src = fish.sprite || getSpritePathForFish(fish);
        img.onload = () => {
            // Draw sprite
            ctx.drawImage(img, 
                x - 15, y - 15,  // Position
                30, 30            // Size
            );
        };

        // Fallback to colored circle if sprite not found
        img.onerror = () => {
            ctx.fillStyle = getRarityColor(fish.rarity);
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
        };
    });
}

// Helper function to construct sprite path
function getSpritePathForFish(fish) {
    const fileName = fish.name.toLowerCase().replace(/\s+/g, '-');
    return `sprites/fish/${fish.size}/${fileName}.png`;
}
```

### Step 4: Add Background Sprite Support

Add to `game.js` after canvas setup:

```javascript
let backgroundImage = new Image();

function drawWaterBackground() {
    const isNight = isNightTime(gameState.currentTime);
    const zone = gameState.currentZone;
    
    // Determine which background to load
    let bgPath = `sprites/backgrounds/`;
    if (isNight) {
        bgPath += `nighttime-${zone}.png`;
    } else {
        bgPath += `daytime-${zone}.png`;
    }
    
    backgroundImage.src = bgPath;
    backgroundImage.onload = () => {
        ctx.drawImage(backgroundImage, 0, 0, gameCanvas.width, gameCanvas.height);
    };
}

// Call this when zone changes or time advances
waterTypeSelect.addEventListener('change', drawWaterBackground);
```

### Step 5: Update Canvas Rendering

Modify `animateCanvas()` to use background images:

```javascript
function animateCanvas() {
    // Draw background image first
    drawWaterBackground();
    
    // Then draw fish collection
    drawFishCollection();
    
    // Draw overlays
    drawTimeIndicator();
    
    // Draw particles last
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    particles = particles.filter(p => p.life > 0);

    requestAnimationFrame(animateCanvas);
}
```

### Step 6: Add Splash Effect (Optional)

Create a splash animation when fish are caught:

```javascript
class SplashEffect {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.frameCount = config.frameCount || 6;
        this.frameWidth = config.frameWidth || 64;
        this.frameHeight = config.frameHeight || 64;
        this.image = new Image();
        this.image.src = 'sprites/effects/splash.png';
        this.complete = false;
    }

    update() {
        this.frame++;
        if (this.frame >= this.frameCount) {
            this.complete = true;
        }
    }

    draw(ctx) {
        const sx = this.frame * this.frameWidth;
        ctx.drawImage(
            this.image,
            sx, 0,                           // Source position
            this.frameWidth, this.frameHeight,  // Source size
            this.x - 32, this.y - 32,       // Destination position
            64, 64                          // Destination size
        );
    }
}

// In castLine() function, add splash:
let splash = new SplashEffect(gameCanvas.width / 2, gameCanvas.height / 2);
particles.push(splash);
```

---

## Sprite Design Tips

### Fish Characteristics
- **Common Fish**: Basic coloring, simple designs
- **Uncommon Fish**: More detail, slight shine/metallic
- **Rare Fish**: Vibrant colors, shimmer effects
- **Very Rare Fish**: Glowing aura, complex patterns, special effects

### Color Psychology
- **Freshwater**: Browns, greens, silvers, golds
- **Saltwater**: Blues, teals, purples, neons
- **Night Fish**: Dark colors with glowing elements, ethereal glow

### Animation Tips (If Animated)
- Create sprite sheets with 4-8 frames
- Consistent frame size for each animation
- 100-150ms per frame for smooth animation
- Group related animations together

---

## Testing Your Sprites

### Before Deployment
1. [ ] All sprites load without 404 errors
2. [ ] Sprites display correctly on canvas
3. [ ] Colors match rarity tiers
4. [ ] No visual artifacts or corrupted images
5. [ ] Performance is smooth (60 FPS)
6. [ ] Mobile display works correctly

### Debugging
Use browser DevTools (F12) to check:
- Network tab for failed image loads
- Console for JavaScript errors
- Performance tab for FPS drops

---

## Alternative: Emoji Fish (Quick Option)

If you want to launch without custom sprites, use emoji:

```javascript
// Modify drawFishCollection:
function drawFishCollection() {
    // ... existing code ...
    
    const emojiMap = {
        'Guppy': '🐠',
        'Shark': '🦈',
        'Octopus': '🐙',
        'Squid': '🦑',
        'Starfish': '⭐',
        // ... etc
    };
    
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojiMap[fish.name] || '🐟', x, y);
}
```

---

## Asset Resources

### Free Sprite Sources
1. **OpenGameArt.org** - Free game art
2. **Itch.io** - Indie game assets
3. **Pixabay** - Free images
4. **UnSplash** - Free photography
5. **Font Awesome** - Icon library

### Creation Tools
- **Aseprite** - Pixel art editor
- **Piskel** - Free sprite editor (online)
- **Krita** - Free digital painting
- **GIMP** - Free image editor
- **Photoshop** - Professional (paid)

---

## File Size Optimization

### Before Adding to Project
1. Compress PNGs using PNGQuant or TinyPNG
2. Target max 50KB per sprite
3. Resize to exact dimensions needed
4. Remove unnecessary metadata

### Build Optimization
```bash
# Using ImageMagick (command line example)
convert input.png -depth 8 -colors 256 output.png
```

---

## Responsive Design Considerations

For mobile-friendly game:
1. Create 2x versions of sprites (@2x)
2. Use CSS media queries for scale
3. Adjust canvas size based on viewport
4. Test on various screen sizes

---

## Version Control Tips

Add to `.gitignore`:
```
sprites/
assets/
*.psd
*.ai
*.sketch
```

Keep only final PNG files in repo (smaller size).

---

## Support & Troubleshooting

### Common Issues

**Sprites not loading?**
- Check file paths match exactly (case-sensitive on Linux)
- Verify CORS settings if loading from CDN
- Check browser console for 404 errors

**Poor performance?**
- Reduce sprite resolution
- Limit concurrent image loads
- Use image compression
- Cache loaded images

**Sprites look blurry?**
- Use exact pixel dimensions (no scaling)
- Enable image-rendering: pixelated in CSS
- Higher DPI source images

---

## Next Steps

1. Create sprite folder structure
2. Design/gather your fish sprites
3. Implement sprite rendering code
4. Test thoroughly in browser
5. Optimize for performance
6. Push to GitHub
7. Share with community!

**Happy artistic game development! 🎨🐟**
