// Game State
let gameState = {
    score: 0,
    fishCaught: 0,
    level: 1,
    inventory: [],
    currentTime: 360, // 6:00 AM in minutes
    maxInventory: 20,
    currentZone: 'freshwater',
    caughtSpecies: new Set(),
    allFish: []
};

// Fish data will be loaded from fish.json
let fishes = [];

// DOM Elements
const castButton = document.getElementById('castButton');
const timeButton = document.getElementById('timeButton');
const scoreDisplay = document.getElementById('score');
const fishCaughtDisplay = document.getElementById('fishCaught');
const levelDisplay = document.getElementById('level');
const gameTimeDisplay = document.getElementById('gameTime');
const timeTypeDisplay = document.getElementById('timeType');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const fishingStatusDiv = document.getElementById('fishingStatus');
const inventoryDiv = document.getElementById('inventory');
const waterTypeSelect = document.getElementById('waterType');
const caughtModal = document.getElementById('caughtModal');
const collectionModal = document.getElementById('collectionModal');
const instructionsModal = document.getElementById('instructionsModal');
const capacitySpan = document.getElementById('capacity');
const speciesCountSpan = document.getElementById('speciesCount');
const statsBtn = document.getElementById('statsBtn');
const instructionsBtn = document.getElementById('instructionsBtn');

// Particle system for fishing effects
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4 - 1;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 3 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy += 0.1; // gravity
    }

    draw(context) {
        context.save();
        context.globalAlpha = this.life;
        context.fillStyle = '#4A90E2';
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
}

let particles = [];

// Load fish data
async function loadFishData() {
    try {
        const response = await fetch('data/fish.json');
        const data = await response.json();
        fishes = data.fish;
        gameState.allFish = fishes;
    } catch (error) {
        console.error('Error loading fish data:', error);
        // Fallback: create sample data
        console.log('Using fallback fish data');
    }
}

// Get time string from minutes
function getTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Determine if it's nighttime (3 AM to 6 AM)
function isNightTime(minutes) {
    const hours = Math.floor(minutes / 60);
    return hours >= 3 && hours < 6;
}

// Get available fish for current conditions
function getAvailableFish() {
    const isNight = isNightTime(gameState.currentTime);
    const zone = gameState.currentZone;

    return fishes.filter(fish => {
        // Check zone
        if (fish.waterType !== zone) return false;
        
        // Check night-only restriction
        if (fish.nightOnly && !isNight) return false;
        
        // Day fish can still be caught at night if not exclusively night
        return true;
    });
}

// Random fish catch based on conditions
function catchRandomFish() {
    const available = getAvailableFish();
    if (available.length === 0) {
        return null;
    }

    // Weight fish by rarity (rarer fish have lower catch chance)
    const weights = {
        'common': 100,
        'uncommon': 50,
        'rare': 20,
        'very_rare': 5
    };

    let totalWeight = 0;
    const weightedFish = available.map(fish => {
        const weight = weights[fish.rarity] || 1;
        totalWeight += weight;
        return { fish, weight, totalWeight };
    });

    // Random selection based on weight
    let random = Math.random() * totalWeight;
    const selected = weightedFish.find(item => random <= item.totalWeight);
    
    return selected ? selected.fish : available[0];
}

// Cast fishing line
function castLine() {
    if (gameState.inventory.length >= gameState.maxInventory) {
        showMessage('🎒 Your inventory is full! Catch limit reached.');
        return;
    }

    fishingStatusDiv.innerHTML = '<p>🎣 Casting line...</p>';
    castButton.disabled = true;

    // Simulate fishing animation
    drawFishingAnimation();

    setTimeout(() => {
        const caughtFish = catchRandomFish();
        
        if (caughtFish) {
            // Add to inventory
            gameState.inventory.push({
                ...caughtFish,
                caughtTime: gameState.currentTime,
                caughtDate: new Date().toLocaleString()
            });

            // Mark species as caught
            gameState.caughtSpecies.add(caughtFish.id);

            // Update score
            gameState.score += caughtFish.points;
            gameState.fishCaught += 1;

            // Level up every 10 fish
            gameState.level = Math.floor(gameState.fishCaught / 10) + 1;

            // Show catch modal
            showCaughtModal(caughtFish);

            // Add particles
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(gameCanvas.width / 2, gameCanvas.height / 2));
            }

            fishingStatusDiv.innerHTML = `<p>✨ Caught ${caughtFish.name}! +${caughtFish.points} points</p>`;
        } else {
            fishingStatusDiv.innerHTML = '<p>❌ No fish in this zone at this time...</p>';
        }

        updateUI();
        castButton.disabled = false;
    }, 1500);
}

// Draw fishing animation
function drawFishingAnimation() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw water gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, gameCanvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E0F6FF');
    gradient.addColorStop(1, '#4A90E2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw fishing line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gameCanvas.width / 2, 10);
    ctx.lineTo(gameCanvas.width / 2, gameCanvas.height - 50);
    ctx.stroke();

    // Draw bobber
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(gameCanvas.width / 2, gameCanvas.height - 50, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw particles
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    particles = particles.filter(p => p.life > 0);
}

// Animate canvas
function animateCanvas() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw water
    const gradient = ctx.createLinearGradient(0, 0, 0, gameCanvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E0F6FF');
    gradient.addColorStop(1, '#4A90E2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw fish icons based on caught
    drawFishCollection();

    // Draw time indicator
    drawTimeIndicator();

    // Update particles
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    particles = particles.filter(p => p.life > 0);

    requestAnimationFrame(animateCanvas);
}

// Draw fish collection on canvas
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

        // Draw fish bubble
        ctx.fillStyle = getRarityColor(fish.rarity);
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw initials
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initials = fish.name.split(' ').map(w => w[0]).join('').substring(0, 2);
        ctx.fillText(initials, x, y);

        // Draw size indicator
        const sizeIndicator = getSizeIndicator(fish.size);
        ctx.font = '10px Arial';
        ctx.fillText(sizeIndicator, x, y + 20);
    });
}

// Draw time indicator
function drawTimeIndicator() {
    const isNight = isNightTime(gameState.currentTime);
    const timeStr = getTimeString(gameState.currentTime);

    ctx.fillStyle = isNight ? '#2C3E50' : '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(timeStr, gameCanvas.width - 10, 10);

    // Night indicator
    if (isNight) {
        ctx.fillStyle = '#FFF';
        ctx.font = '14px Arial';
        ctx.fillText('🌙 NIGHT FISHING', gameCanvas.width - 10, 40);
    }
}

// Get rarity color
function getRarityColor(rarity) {
    const colors = {
        'common': '#999999',
        'uncommon': '#2ecc71',
        'rare': '#3498db',
        'very_rare': '#f39c12'
    };
    return colors[rarity] || '#666';
}

// Get size indicator emoji
function getSizeIndicator(size) {
    const indicators = {
        'tiny': '•',
        'small': '••',
        'medium': '•••',
        'large': '••••'
    };
    return indicators[size] || '•';
}

// Advance time
function advanceTime() {
    gameState.currentTime = (gameState.currentTime + 60) % 1440; // 24 hours = 1440 minutes

    updateTimeDisplay();
    
    const isNight = isNightTime(gameState.currentTime);
    if (isNight) {
        showMessage('🌙 It\'s now night time! Special fish may appear!');
    } else {
        showMessage('☀️ The sun is rising. Day fishing now available.');
    }
}

// Update time display
function updateTimeDisplay() {
    gameTimeDisplay.textContent = getTimeString(gameState.currentTime);
    timeTypeDisplay.textContent = isNightTime(gameState.currentTime) ? '🌙 Night' : '☀️ Day';
}

// Show caught fish modal
function showCaughtModal(fish) {
    document.getElementById('fishName').textContent = `✨ Caught: ${fish.name}!`;
    document.getElementById('fishDesc').innerHTML = `
        <strong>Size:</strong> ${fish.size.toUpperCase()}<br>
        <strong>Water:</strong> ${fish.waterType}<br>
        <strong>Type:</strong> ${fish.nightOnly ? '🌙 Night Only' : '☀️ Day/Night'}
    `;
    document.getElementById('fishPoints').textContent = `+${fish.points} Points`;
    document.getElementById('fishRarity').innerHTML = `<span class="rarity-${fish.rarity}">⭐ ${fish.rarity.toUpperCase()}</span>`;
    
    caughtModal.classList.add('show');
}

// Update UI
function updateUI() {
    scoreDisplay.textContent = gameState.score;
    fishCaughtDisplay.textContent = gameState.fishCaught;
    levelDisplay.textContent = gameState.level;
    capacitySpan.textContent = gameState.inventory.length;
    speciesCountSpan.textContent = gameState.caughtSpecies.size;

    updateInventoryDisplay();
}

// Update inventory display
function updateInventoryDisplay() {
    inventoryDiv.innerHTML = '';

    // Group by fish type
    const grouped = {};
    gameState.inventory.forEach(fish => {
        if (!grouped[fish.id]) {
            grouped[fish.id] = [];
        }
        grouped[fish.id].push(fish);
    });

    // Display grouped fish
    Object.entries(grouped).forEach(([id, fishList]) => {
        const fish = fishList[0];
        const count = fishList.length;

        const item = document.createElement('div');
        item.className = 'inventory-item';
        item.innerHTML = `
            <div class="fish-name">${fish.name}${count > 1 ? ` (×${count})` : ''}</div>
            <div class="fish-meta">
                <span><strong>Size:</strong> ${fish.size}</span>
                <span><span class="rarity-${fish.rarity}"><strong>Rarity:</strong> ${fish.rarity}</span></span>
                <span><strong>Points:</strong> ${fish.points}</span>
                <span><strong>Water:</strong> ${fish.waterType.substring(0, 3)}</span>
            </div>
        `;
        inventoryDiv.appendChild(item);
    });
}

// Show collection stats modal
function showCollectionStats() {
    const stats = calculateCollectionStats();

    // By Size
    let sizeHtml = '';
    Object.entries(stats.bySize).forEach(([size, count]) => {
        sizeHtml += `<div class="stat-item"><span>${size}</span><span>${count}</span></div>`;
    });
    document.getElementById('bySizeStats').innerHTML = sizeHtml;

    // By Rarity
    let rarityHtml = '';
    Object.entries(stats.byRarity).forEach(([rarity, count]) => {
        rarityHtml += `<div class="stat-item"><span class="rarity-${rarity}">${rarity}</span><span>${count}</span></div>`;
    });
    document.getElementById('byRarityStats').innerHTML = rarityHtml;

    // By Water Type
    let waterHtml = '';
    Object.entries(stats.byWater).forEach(([water, count]) => {
        waterHtml += `<div class="stat-item"><span>${water}</span><span>${count}</span></div>`;
    });
    document.getElementById('byWaterStats').innerHTML = waterHtml;

    // Night Catches
    let nightHtml = `
        <div class="stat-item"><span>Night Fishing</span><span>${stats.nightCatches}</span></div>
        <div class="stat-item"><span>Total Unique</span><span>${gameState.caughtSpecies.size}/102</span></div>
        <div class="stat-item"><span>Collection %</span><span>${Math.round(gameState.caughtSpecies.size / 102 * 100)}%</span></div>
    `;
    document.getElementById('nightStats').innerHTML = nightHtml;

    collectionModal.classList.add('show');
}

// Calculate collection stats
function calculateCollectionStats() {
    const stats = {
        bySize: { tiny: 0, small: 0, medium: 0, large: 0 },
        byRarity: { common: 0, uncommon: 0, rare: 0, very_rare: 0 },
        byWater: { freshwater: 0, saltwater: 0 },
        nightCatches: 0
    };

    gameState.inventory.forEach(fish => {
        stats.bySize[fish.size] = (stats.bySize[fish.size] || 0) + 1;
        stats.byRarity[fish.rarity] = (stats.byRarity[fish.rarity] || 0) + 1;
        stats.byWater[fish.waterType] = (stats.byWater[fish.waterType] || 0) + 1;
        if (fish.nightOnly) stats.nightCatches += 1;
    });

    return stats;
}

// Show message
function showMessage(message) {
    fishingStatusDiv.innerHTML = `<p>${message}</p>`;
}

// Clear inventory
function clearInventory() {
    if (confirm('Clear all fish from inventory? This cannot be undone.')) {
        gameState.inventory = [];
        gameState.caughtSpecies.clear();
        gameState.score = 0;
        gameState.fishCaught = 0;
        gameState.level = 1;
        updateUI();
        showMessage('🗑️ Inventory cleared!');
    }
}

// Modal event listeners
document.addEventListener('click', (e) => {
    const modals = [caughtModal, collectionModal, instructionsModal];
    
    modals.forEach(modal => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    if (e.target.classList.contains('close') || e.target.classList.contains('btn-continue')) {
        caughtModal.classList.remove('show');
        collectionModal.classList.remove('show');
        instructionsModal.classList.remove('show');
    }
});

// Event listeners
castButton.addEventListener('click', castLine);
timeButton.addEventListener('click', advanceTime);
waterTypeSelect.addEventListener('change', (e) => {
    gameState.currentZone = e.target.value;
    showMessage(`Switched to ${gameState.currentZone} fishing!`);
});
document.getElementById('clearBtn').addEventListener('click', clearInventory);
statsBtn.addEventListener('click', showCollectionStats);
instructionsBtn.addEventListener('click', () => instructionsModal.classList.add('show'));

// Initialize game
async function initGame() {
    await loadFishData();
    updateUI();
    updateTimeDisplay();
    animateCanvas();
    showMessage('Ready to fish! Click CAST LINE to start.');
}

// Start the game
initGame();
