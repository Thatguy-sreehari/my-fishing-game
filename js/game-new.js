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
    depth: 1,
    currentBoat: 'starter-boat',
    unlockedBoats: ['starter-boat'],
    unlockedRods: ['basic-rod'],
    currentRod: 'basic-rod',
    showRod: true
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

// Boats & Equipment Unlocks
const boats = [
    { id: 'starter-boat', name: 'Starter Boat', unlockAt: 0, capacity: 10 },
    { id: 'fishing-boat', name: 'Fishing Boat', unlockAt: 10, capacity: 15 },
    { id: 'speedboat', name: 'Speedboat', unlockAt: 30, capacity: 20 },
    { id: 'yacht', name: 'Luxury Yacht', unlockAt: 60, capacity: 30 },
    { id: 'research-vessel', name: 'Research Vessel', unlockAt: 100, capacity: 50 }
];

const rods = [
    { id: 'basic-rod', name: 'Basic Rod', unlockAt: 0, catchRate: 0.6 },
    { id: 'bamboo-rod', name: 'Bamboo Rod', unlockAt: 15, catchRate: 0.75 },
    { id: 'carbon-rod', name: 'Carbon Rod', unlockAt: 35, catchRate: 0.85 },
    { id: 'gold-rod', name: 'Golden Rod', unlockAt: 75, catchRate: 0.95 }
];

// Check for new unlocks
function checkUnlocks() {
    // Check boats
    boats.forEach(boat => {
        if (gameState.fishCaught >= boat.unlockAt && !gameState.unlockedBoats.includes(boat.id)) {
            gameState.unlockedBoats.push(boat.id);
            showMessage(`🚤 Unlocked: ${boat.name}!`);
        }
    });
    
    // Check rods
    rods.forEach(rod => {
        if (gameState.fishCaught >= rod.unlockAt && !gameState.unlockedRods.includes(rod.id)) {
            gameState.unlockedRods.push(rod.id);
            showMessage(`🎣 Unlocked: ${rod.name}!`);
        }
    });
}

function switchRod(rodId) {
    if (gameState.unlockedRods.includes(rodId)) {
        gameState.currentRod = rodId;
        showMessage(`Switched to ${rods.find(r => r.id === rodId).name}`);
        updateAllUI();
    }
}

function switchBoat(boatId) {
    if (gameState.unlockedBoats.includes(boatId)) {
        gameState.currentBoat = boatId;
        showMessage(`Switched to ${boats.find(b => b.id === boatId).name}`);
        updateAllUI();
    }
}

function showMessage(text) {
    document.getElementById('fishingStatus').textContent = text;
}

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
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        if (screenId === 'gameScreen' && gameState.isGameActive) {
            animateCanvas();
        }
        if (screenId === 'inventory') renderInventory();
        if (screenId === 'stats') renderStats();
        if (screenId === 'achievements') renderAchievements();
        if (screenId === 'gallery') renderGallery();
    }
}

function startGame() {
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
    showScreen('locationSelect');
}

function selectLocation(waterType, locationName) {
    gameState.currentZone = waterType;
    gameState.currentLocation = locationName;
    gameState.currentTime = 360;
    
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
    // All fish are always available - simplifies the system
    return fishes;
}

function catchRandomFish() {
    const available = getAvailableFish();
    if (available.length === 0) return null;

    // Get current rod's catch rate
    const currentRod = rods.find(r => r.id === gameState.currentRod);
    const catchRate = currentRod.catchRate;
    
    // Check if catch succeeds based on rod
    if (Math.random() > catchRate) {
        return null; // Failed catch
    }

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
        showMessage('🛑 Inventory full! Clear some space.');
        return;
    }

    const castBtn = document.querySelector('[onclick*="castLine"]');
    if (castBtn) castBtn.disabled = true;
    
    showMessage('🎣 Casting line... WAIT FOR THE BITE!');

    // Wait for a bite (2-5 seconds)
    const biteWait = 2000 + Math.random() * 3000;
    
    setTimeout(() => {
        showMessage('💫 You\'ve got a bite! REEL IT IN!');
        
        // Time to reel in (3-7 seconds)
        const reelTime = 3000 + Math.random() * 4000;
        
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
                for (let i = 0; i < 20; i++) {
                    particles.push(new Particle(gameCanvas.width / 2, gameCanvas.height / 3));
                }

                showCaughtFishModal(caughtFish);
                checkAchievements();
                checkUnlocks();
            } else {
                showMessage('❌ The line broke! Try again.');
            }

            updateAllUI();
            if (castBtn) castBtn.disabled = false;
        }, reelTime);
        
    }, biteWait);
}

// UI Updates
function updateAllUI() {
    document.getElementById('statScore').textContent = gameState.score;
    document.getElementById('quickScore').textContent = 'Score: ' + gameState.score;
    document.getElementById('statCaught').textContent = gameState.fishCaught;
    document.getElementById('statInventory').textContent = gameState.inventory.length + '/20';
    document.getElementById('statSpecies').textContent = gameState.caughtSpecies.size + '/102';
    document.getElementById('statLevel').textContent = gameState.level;
    
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
                <div style="font-size: 2em; margin-bottom: 10px;">${unlocked ? '★' : '☆'}</div>
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
                <div style="font-size: 2em; margin-bottom: 5px; opacity: ${caught ? '1' : '0.3'}">●</div>
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
function resizeCanvas() {
    if (!gameCanvas) return;
    const rect = gameCanvas.parentElement.getBoundingClientRect();
    gameCanvas.width = rect.width - 20; // Account for borders
    gameCanvas.height = rect.height - 20;
}

function animateCanvas() {
    resizeCanvas();
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw water
    const gradient = ctx.createLinearGradient(0, 0, 0, gameCanvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E0F6FF');
    gradient.addColorStop(1, '#4A90E2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw boat (simple representation)
    drawBoat();
    
    // Draw rod with camera culling
    if (gameState.showRod) {
        drawRod();
    }

    // Draw caught fish
    drawFishCollection();
    
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

function drawBoat() {
    const boatY = gameCanvas.height - 80;
    const boatX = 100;
    
    // Boat hull (side view)
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(boatX - 50, boatY);
    ctx.lineTo(boatX + 50, boatY);
    ctx.lineTo(boatX + 60, boatY + 20);
    ctx.lineTo(boatX - 60, boatY + 20);
    ctx.closePath();
    ctx.fill();
    
    // Boat outline
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Boat name/label
    const boat = boats.find(b => b.id === gameState.currentBoat);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(boat.name, boatX, boatY - 10);
}

function drawRod() {
    const rodStartX = 80;
    const rodStartY = gameCanvas.height - 100;
    const rodEndX = gameCanvas.width / 2;
    const rodEndY = gameCanvas.height / 3;
    
    // Rod line (curved fishing line)
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rodStartX, rodStartY);
    ctx.quadraticCurveTo(rodStartX + 100, rodStartY - 50, rodEndX, rodEndY);
    ctx.stroke();
    
    // Rod handle
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(rodStartX, rodStartY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Current rod label
    const rod = rods.find(r => r.id === gameState.currentRod);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(rod.name, rodStartX - 40, rodStartY - 20);
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

    const cols = 4;
    const cellWidth = gameCanvas.width / cols;
    const cellHeight = 100;
    const blobRadius = 30;

    gameState.inventory.forEach((fish, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = col * cellWidth + cellWidth / 2;
        const y = 50 + row * cellHeight;

        // Draw colorful blob
        ctx.fillStyle = getRarityColor(fish.rarity);
        ctx.beginPath();
        ctx.arc(x, y, blobRadius, 0, Math.PI * 2);
        ctx.fill();

        // Add border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw fish name below blob
        ctx.fillStyle = '#333';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(fish.name, x, y + blobRadius + 5);
    });
}

// Initialize
async function initGame() {
    await loadFishData();
    document.getElementById('locationName').textContent = gameState.currentLocation;
    document.getElementById('waterDisplay').textContent = 'Freshwater';
    updateAllUI();
    
    // Make all functions globally accessible for onclick handlers
    window.showScreen = showScreen;
    window.startGame = startGame;
    window.selectLocation = selectLocation;
    window.castLine = castLine;
    window.pauseGame = pauseGame;
    window.filterInventory = filterInventory;
    window.closeCaughtModal = closeCaughtModal;
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (gameState.isGameActive) {
            resizeCanvas();
        }
    });
    
    // Hotkey controls
    window.addEventListener('keydown', (e) => {
        if (!gameState.isGameActive) return;
        
        switch(e.key.toLowerCase()) {
            case ' ':  // Space = Cast line
            case 'c':  // C = Cast
                e.preventDefault();
                castLine();
                break;
            case 'i':  // I = Inventory
                e.preventDefault();
                showScreen('inventory');
                break;
            case 's':  // S = Stats
                e.preventDefault();
                showScreen('stats');
                break;
            case 'a':  // A = Achievements
                e.preventDefault();
                showScreen('achievements');
                break;
            case 'g':  // G = Gallery
                e.preventDefault();
                showScreen('gallery');
                break;
            case 'escape':
            case 'm':  // M = Menu
                e.preventDefault();
                pauseGame();
                break;
        }
    });
    
    console.log('Game initialized - Hotkeys: SPACE/C=Cast, I=Inventory, S=Stats, A=Achievements, G=Gallery, M/ESC=Menu');
}

initGame();
