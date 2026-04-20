// Game State
let gameState = {
    score: 0,
    fishCaught: 0,
    level: 1,
    inventory: [],
    currentTime: 360,
    maxInventory: 20,
    currentZone: 'freshwater',
    currentLocation: 'Mountain Stream',
    caughtSpecies: new Set(),
    allFish: [],
    difficulty: 'normal',
    isGameActive: false,
    recentCatches: [],
    depth: 1
};

let fishes = [];
let currentInventoryFilter = 'all';
let particles = [];

// Canvas
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');

// Achievements
const achievements = [
    { id: 'first_catch', name: 'First Cast', desc: 'Catch your first fish', condition: () => gameState.fishCaught >= 1 },
    { id: 'ten_catches', name: 'Fishing Pro', desc: 'Catch 10 fish', condition: () => gameState.fishCaught >= 10 },
    { id: 'fifty_catches', name: 'Master Angler', desc: 'Catch 50 fish', condition: () => gameState.fishCaught >= 50 },
    { id: 'hundred_fish', name: 'Legendary Fisher', desc: 'Catch 100 fish', condition: () => gameState.fishCaught >= 100 },
    { id: 'night_fisher', name: 'Night Owl', desc: 'Catch 5 night-only fish', condition: () => countNightCatches() >= 5 },
    { id: 'collector', name: 'Collector', desc: 'Catch 50 unique species', condition: () => gameState.caughtSpecies.size >= 50 },
    { id: 'completionist', name: 'Completionist', desc: 'Catch all 102 fish', condition: () => gameState.caughtSpecies.size === 102 },
    { id: 'depth_master', name: 'Depth Master', desc: 'Reach depth level 10', condition: () => gameState.depth >= 10 }
];

let unlockedAchievements = new Set();

// Particle system
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
        this.vy += 0.1;
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

// Load fish data
async function loadFishData() {
    try {
        const response = await fetch('data/fish.json');
        const data = await response.json();
        fishes = data.fish;
        gameState.allFish = fishes;
    } catch (error) {
        console.error('Error loading fish data:', error);
    }
}

// Screen Navigation
function showScreen(screenId) {
    console.log('showScreen called with:', screenId);
    
    try {
        // Get all screens
        const screens = document.querySelectorAll('.screen');
        console.log('Found screen elements:', screens.length);
        
        // Remove active class from all
        screens.forEach(s => {
            s.classList.remove('active');
        });
        
        // Get target screen
        const screen = document.getElementById(screenId);
        console.log('Target screen found:', screenId, !!screen);
        
        if (screen) {
            screen.classList.add('active');
            console.log('Active class added to:', screenId);
            
            // Call render functions if needed
            if (screenId === 'gameScreen' && gameState.isGameActive) {
                animateCanvas();
            }
            if (screenId === 'inventory') renderInventory();
            if (screenId === 'stats') renderStats();
            if (screenId === 'achievements') renderAchievements();
            if (screenId === 'gallery') renderGallery();
        } else {
            console.error('Screen not found:', screenId);
        }
    } catch (e) {
        console.error('Error in showScreen:', e);
    }
}

function startGame() {
    alert('START GAME button clicked!');
    console.log('startGame() called');
    gameState.isGameActive = true;
    gameState.inventory = [];
    gameState.score = 0;
    gameState.fishCaught = 0;
    gameState.level = 1;
    gameState.depth = 1;
    gameState.caughtSpecies.clear();
    gameState.currentTime = 360;
    gameState.currentZone = 'freshwater';
    gameState.currentLocation = 'Mountain Stream';
    console.log('Game state reset, showing location select');
    showScreen('locationSelect');
}

function selectLocation(waterType, locationName) {
    gameState.currentZone = waterType;
    gameState.currentLocation = locationName;
    gameState.currentTime = 360;
    gameState.isGameActive = true;
    
    document.getElementById('locationName').textContent = locationName;
    document.getElementById('waterDisplay').textContent = waterType.charAt(0).toUpperCase() + waterType.slice(1);
    
    updateAllUI();
    showScreen('gameScreen');
    animateCanvas();
}

function pauseGame() {
    gameState.isGameActive = false;
    document.getElementById('pauseMenu').classList.add('show');
}

function resumeGame() {
    document.getElementById('pauseMenu').classList.remove('show');
    gameState.isGameActive = true;
    showScreen('gameScreen');
    animateCanvas();
}

function mainMenu() {
    gameState.isGameActive = false;
    document.getElementById('pauseMenu').classList.remove('show');
    showScreen('mainMenu');
}

// Time functions
function getTimeString(minutes) {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function isNightTime(minutes) {
    const hours = Math.floor(minutes / 60) % 24;
    return hours >= 3 && hours < 6;
}

function getAvailableFish() {
    const isNight = isNightTime(gameState.currentTime);
    const zone = gameState.currentZone;

    let available = fishes.filter(fish => {
        if (fish.waterType !== zone) return false;
        if (fish.nightOnly && !isNight) return false;
        return true;
    });

    // Difficulty scaling
    if (gameState.difficulty === 'hard') {
        available = available.filter(f => f.rarity !== 'common');
    } else if (gameState.difficulty === 'expert') {
        available = available.filter(f => f.nightOnly);
    }

    // If no fish available, return all for the water type (fallback)
    if (available.length === 0) {
        available = fishes.filter(f => f.waterType === zone);
    }

    return available;
}

function catchRandomFish() {
    const available = getAvailableFish();
    if (available.length === 0) return null;

    const weights = {
        'common': 100,
        'uncommon': 50,
        'rare': 20,
        'very_rare': 5
    };

    let totalWeight = 0;
    const weighted = available.map(fish => {
        const weight = weights[fish.rarity] || 1;
        totalWeight += weight;
        return { fish, totalWeight };
    });

    let random = Math.random() * totalWeight;
    const selected = weighted.find(item => random <= item.totalWeight);
    return selected ? selected.fish : available[0];
}

// Casting line
function castLine() {
    if (gameState.inventory.length >= gameState.maxInventory) {
        document.getElementById('fishingStatus').textContent = 'Inventory full! Clear some space.';
        return;
    }

    const castBtn = event.target;
    castBtn.disabled = true;
    document.getElementById('fishingStatus').textContent = 'Casting line...';

    setTimeout(() => {
        const caughtFish = catchRandomFish();
        
        if (caughtFish) {
            const catchData = {
                ...caughtFish,
                caughtTime: gameState.currentTime,
                caughtDate: new Date().toLocaleString()
            };
            
            gameState.inventory.push(catchData);
            gameState.caughtSpecies.add(caughtFish.id);
            gameState.score += caughtFish.points;
            gameState.fishCaught += 1;
            gameState.level = Math.floor(gameState.fishCaught / 10) + 1;
            gameState.depth = Math.floor(gameState.fishCaught / 5) + 1;
            
            // Add to recent catches (max 5)
            gameState.recentCatches.unshift(caughtFish.name);
            if (gameState.recentCatches.length > 5) {
                gameState.recentCatches.pop();
            }

            // Add particles
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(gameCanvas.width / 2, gameCanvas.height / 2));
            }

            showCaughtFishModal(caughtFish);
            checkAchievements();
        } else {
            document.getElementById('fishingStatus').textContent = 'No fish in this zone at this time...';
        }

        updateAllUI();
        castBtn.disabled = false;
    }, 1000);
}

function advanceTime() {
    gameState.currentTime = (gameState.currentTime + 60) % 1440;
    
    const isNight = isNightTime(gameState.currentTime);
    const timeStr = getTimeString(gameState.currentTime);
    
    document.getElementById('timeDisplay').textContent = timeStr;
    document.getElementById('timeTypeDisplay').textContent = isNight ? 'Night Time' : 'Daytime';
    document.getElementById('quickTime').textContent = timeStr;
    
    if (isNight) {
        document.getElementById('fishingStatus').textContent = 'Night time! Rare mystical fish appear!';
    } else {
        document.getElementById('fishingStatus').textContent = 'Daybreak. Standard fishing conditions.';
    }
}

// UI Updates
function updateAllUI() {
    document.getElementById('statScore').textContent = gameState.score;
    document.getElementById('quickScore').textContent = 'Score: ' + gameState.score;
    document.getElementById('statCaught').textContent = gameState.fishCaught;
    document.getElementById('statInventory').textContent = gameState.inventory.length + '/20';
    document.getElementById('statSpecies').textContent = gameState.caughtSpecies.size + '/102';
    document.getElementById('statLevel').textContent = gameState.level;
    
    document.getElementById('timeDisplay').textContent = getTimeString(gameState.currentTime);
    document.getElementById('timeTypeDisplay').textContent = isNightTime(gameState.currentTime) ? 'Night Time' : 'Daytime';
    document.getElementById('quickTime').textContent = getTimeString(gameState.currentTime);
    
    updateRarityStats();
    updateRecentCatches();
}

function updateRarityStats() {
    const stats = { common: 0, uncommon: 0, rare: 0, very_rare: 0 };
    gameState.inventory.forEach(fish => {
        stats[fish.rarity] = (stats[fish.rarity] || 0) + 1;
    });
    
    document.getElementById('commonCount').textContent = stats.common;
    document.getElementById('uncommonCount').textContent = stats.uncommon;
    document.getElementById('rareCount').textContent = stats.rare;
    document.getElementById('legendaryCount').textContent = stats.very_rare;
}

function updateRecentCatches() {
    const recentDiv = document.getElementById('recentCatches');
    if (gameState.recentCatches.length === 0) {
        recentDiv.innerHTML = '<p class="empty-message">No catches yet...</p>';
    } else {
        recentDiv.innerHTML = gameState.recentCatches.map(name => 
            `<div class="recent-item">${name}</div>`
        ).join('');
    }
}

// Modals
function showCaughtFishModal(fish) {
    const rarity = fish.rarity.toUpperCase();
    const color = getRarityColor(fish.rarity);
    
    document.getElementById('caughtTitle').textContent = `Caught: ${fish.name}!`;
    document.getElementById('caughtIcon').innerHTML = `<div style="background: ${color}; padding: 20px; border-radius: 10px; text-align: center; color: white; font-weight: bold;">${fish.name.substring(0, 2)}</div>`;
    
    document.getElementById('caughtDetails').innerHTML = `
        <div style="padding: 15px;">
            <div><strong>Size:</strong> ${fish.size.toUpperCase()}</div>
            <div><strong>Water:</strong> ${fish.waterType}</div>
            <div><strong>Rarity:</strong> ${rarity}</div>
            <div style="margin-top: 10px; font-size: 1.3em; color: #FFD700;"><strong>+${fish.points} Points</strong></div>
        </div>
    `;
    
    document.getElementById('caughtFishModal').classList.add('show');
}

function closeCaughtModal() {
    document.getElementById('caughtFishModal').classList.remove('show');
}

function getRarityColor(rarity) {
    const colors = {
        'common': '#888888',
        'uncommon': '#4CAF50',
        'rare': '#2196F3',
        'very_rare': '#FF9800'
    };
    return colors[rarity] || '#888';
}

// Inventory
function filterInventory(rarity) {
    currentInventoryFilter = rarity;
    renderInventory();
    
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function renderInventory() {
    const invList = document.getElementById('inventoryList');
    document.getElementById('invCapacity').textContent = gameState.inventory.length + '/20';
    
    let filtered = gameState.inventory;
    if (currentInventoryFilter !== 'all') {
        filtered = gameState.inventory.filter(f => f.rarity === currentInventoryFilter);
    }

    if (filtered.length === 0) {
        invList.innerHTML = '<p class="empty-message">No fish in this category</p>';
        return;
    }

    const grouped = {};
    filtered.forEach(fish => {
        if (!grouped[fish.id]) grouped[fish.id] = [];
        grouped[fish.id].push(fish);
    });

    invList.innerHTML = Object.entries(grouped).map(([id, fishList]) => {
        const fish = fishList[0];
        const count = fishList.length;
        const color = getRarityColor(fish.rarity);
        
        return `
            <div class="inventory-item" style="border-left: 4px solid ${color}; padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 5px;">
                <div><strong>${fish.name}${count > 1 ? ` (×${count})` : ''}</strong></div>
                <div style="font-size: 0.9em; color: #666;">Size: ${fish.size} | Rarity: ${fish.rarity} | Points: ${fish.points}</div>
            </div>
        `;
    }).join('');
}

// Statistics
function renderStats() {
    const stats = calculateStats();
    
    // By Size
    document.getElementById('statsBySize').innerHTML = Object.entries(stats.bySize).map(([size, count]) =>
        `<div class="stat-item"><span>${size.charAt(0).toUpperCase() + size.slice(1)}</span><span>${count}</span></div>`
    ).join('');
    
    // By Rarity
    document.getElementById('statsByRarity').innerHTML = Object.entries(stats.byRarity).map(([rarity, count]) =>
        `<div class="stat-item"><span style="color: ${getRarityColor(rarity)}">${rarity.toUpperCase()}</span><span>${count}</span></div>`
    ).join('');
    
    // By Water
    document.getElementById('statsByWater').innerHTML = Object.entries(stats.byWater).map(([water, count]) =>
        `<div class="stat-item"><span>${water}</span><span>${count}</span></div>`
    ).join('');
    
    // Night Stats
    document.getElementById('statsNight').innerHTML = `
        <div class="stat-item"><span>Night Catches</span><span>${stats.nightCatches}</span></div>
        <div class="stat-item"><span>Unique Species</span><span>${gameState.caughtSpecies.size}/102</span></div>
        <div class="stat-item"><span>Completion</span><span>${Math.round(gameState.caughtSpecies.size / 102 * 100)}%</span></div>
    `;
}

function calculateStats() {
    const stats = {
        bySize: { tiny: 0, small: 0, medium: 0, large: 0 },
        byRarity: { common: 0, uncommon: 0, rare: 0, very_rare: 0 },
        byWater: { freshwater: 0, saltwater: 0 },
        nightCatches: 0
    };

    gameState.inventory.forEach(fish => {
        stats.bySize[fish.size]++;
        stats.byRarity[fish.rarity]++;
        stats.byWater[fish.waterType]++;
        if (fish.nightOnly) stats.nightCatches++;
    });

    return stats;
}

function countNightCatches() {
    return gameState.inventory.filter(f => f.nightOnly).length;
}

// Achievements
function checkAchievements() {
    achievements.forEach(ach => {
        if (!unlockedAchievements.has(ach.id) && ach.condition()) {
            unlockedAchievements.add(ach.id);
        }
    });
}

function renderAchievements() {
    const list = document.getElementById('achievementsList');
    list.innerHTML = achievements.map(ach => {
        const unlocked = unlockedAchievements.has(ach.id);
        return `
            <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}" style="padding: 15px; margin: 10px; border: 2px solid ${unlocked ? '#FFD700' : '#ccc'}; border-radius: 8px; text-align: center;">
                <div style="font-size: 2em; margin-bottom: 10px;">${unlocked ? '*' : 'o'}</div>
                <div><strong>${ach.name}</strong></div>
                <div style="font-size: 0.9em; color: #666;">${ach.desc}</div>
            </div>
        `;
    }).join('');
}

// Gallery
function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    const stats = document.getElementById('galleryStats');
    stats.textContent = gameState.caughtSpecies.size + '/102';
    
    grid.innerHTML = fishes.map(fish => {
        const caught = gameState.caughtSpecies.has(fish.id);
        const color = caught ? getRarityColor(fish.rarity) : '#ddd';
        
        return `
            <div class="gallery-item" style="padding: 15px; margin: 8px; border: 2px solid ${color}; border-radius: 8px; text-align: center; background: ${caught ? '#f0f0f0' : '#fff'};">
                <div style="font-size: 2em; margin-bottom: 5px; opacity: ${caught ? '1' : '0.3'}">*</div>
                <div style="font-weight: bold; font-size: 0.9em;">${fish.name}</div>
                <div style="font-size: 0.8em; color: #666;">${caught ? 'Caught' : 'Not caught'}</div>
            </div>
        `;
    }).join('');
}

// Settings
function setDifficulty(level) {
    gameState.difficulty = level;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function exportSave() {
    const data = JSON.stringify({
        score: gameState.score,
        fishCaught: gameState.fishCaught,
        inventory: gameState.inventory,
        caughtSpecies: Array.from(gameState.caughtSpecies),
        unlockedAchievements: Array.from(unlockedAchievements)
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cat-goes-deep-save.json';
    a.click();
}

function resetGame() {
    if (confirm('Reset all progress? This cannot be undone!')) {
        gameState = {
            score: 0,
            fishCaught: 0,
            level: 1,
            inventory: [],
            currentTime: 360,
            maxInventory: 20,
            currentZone: 'freshwater',
            currentLocation: 'Mountain Stream',
            caughtSpecies: new Set(),
            allFish: fishes,
            difficulty: 'normal',
            isGameActive: false,
            recentCatches: [],
            depth: 1
        };
        unlockedAchievements.clear();
        showScreen('mainMenu');
    }
}

// Canvas Animation
function animateCanvas() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw water
    const gradient = ctx.createLinearGradient(0, 0, 0, gameCanvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E0F6FF');
    gradient.addColorStop(1, '#4A90E2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw caught fish
    drawFishCollection();
    
    // Draw time
    drawTimeInfo();
    
    // Update and draw particles
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    particles = particles.filter(p => p.life > 0);
    
    if (gameState.isGameActive) {
        requestAnimationFrame(animateCanvas);
    }
}

function drawFishCollection() {
    if (gameState.inventory.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Cast your line to start catching fish!', gameCanvas.width / 2, gameCanvas.height / 2);
        return;
    }

    const cols = 5;
    const cellWidth = gameCanvas.width / cols;
    const cellHeight = 60;

    gameState.inventory.forEach((fish, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = col * cellWidth + cellWidth / 2;
        const y = 50 + row * cellHeight;

        ctx.fillStyle = getRarityColor(fish.rarity);
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initials = fish.name.split(' ').map(w => w[0]).join('').substring(0, 2);
        ctx.fillText(initials, x, y);
    });
}

function drawTimeInfo() {
    const isNight = isNightTime(gameState.currentTime);
    const timeStr = getTimeString(gameState.currentTime);

    ctx.fillStyle = isNight ? '#667eea' : '#FFD700';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(timeStr, gameCanvas.width - 15, 15);
    
    if (isNight) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('NIGHT FISHING', gameCanvas.width - 15, 40);
    }
}

// Initialize
async function initGame() {
    await loadFishData();
    document.getElementById('locationName').textContent = gameState.currentLocation;
    document.getElementById('waterDisplay').textContent = 'Freshwater';
    updateAllUI();
}

initGame();


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
    console.log('Game initializing...');
    await loadFishData();
    console.log('Fish data loaded:', fishes.length);
    
    // Make functions globally accessible
    window.showScreen = showScreen;
    window.startGame = startGame;
    window.selectLocation = selectLocation;
    window.pauseGame = pauseGame;
    window.resumeGame = resumeGame;
    window.mainMenu = mainMenu;
    window.filterInventory = filterInventory;
    window.castLine = castLine;
    window.advanceTime = advanceTime;
    window.setDifficulty = setDifficulty;
    window.exportSave = exportSave;
    window.resetGame = resetGame;
    window.closeCaughtModal = closeCaughtModal;
    
    // Add direct event listeners to all buttons
    setTimeout(() => {
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Button clicked:', btn.textContent, btn.onclick);
            });
        });
        console.log('Game initialized - all buttons ready');
    }, 100);
}

// Start the game
initGame();
