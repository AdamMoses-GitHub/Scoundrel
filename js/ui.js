/**
 * Scoundrel Game - UI Controller
 * Handles all screen rendering and user interactions
 */

// Get elements
const gameContainer = document.getElementById('gameContainer');
const mainMenuScreen = document.getElementById('mainMenu');
const instructionsScreen = document.getElementById('instructions');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

const statsBar = document.getElementById('statsBar');
const interactionCountLine = document.getElementById('interactionCountLine');
const gameContent = document.getElementById('gameContent');
const weaponDisplay = document.getElementById('weaponDisplay');

// Game log tracking
let gameLog = [];

// Game phase content areas
const roomDecisionContent = document.getElementById('roomDecisionContent');
const cardInteractionContent = document.getElementById('cardInteractionContent');
const roomCompleteContent = document.getElementById('roomCompleteContent');

/**
 * Screen management
 */
function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    screenElement.classList.add('active');
}

function showMainMenu() {
    showScreen(mainMenuScreen);
}

function showInstructions() {
    showScreen(instructionsScreen);
}

function showGameScreen() {
    showScreen(gameScreen);
}

function showGameOverScreen() {
    showScreen(gameOverScreen);
}

/**
 * Update interaction count line - shown only during card interaction
 */
function updateInteractionCountLine() {
    const game = getGame();
    
    // Hide interaction count line in non-room states or during room-decision
    if (game.gameState === 'menu' || game.gameState === 'game-over' || game.gameState === 'room-decision') {
        interactionCountLine.innerHTML = '';
        return;
    }
    
    // Show interaction count during card interaction, combat choice, and room complete phases
    if (game.currentRoom && (game.gameState === 'card-interaction' || game.gameState === 'combat-choice' || game.gameState === 'room-complete')) {
        const processed = game.currentRoom.processedIndices.length;
        const countText = `Interacted with ${processed} of 3 cards`;
        interactionCountLine.innerHTML = `<div class="interaction-count">${countText}</div>`;
    }
}

/**
 * Main game display update
 */
function updateGameDisplay() {
    const game = getGame();

    // Update stats bar
    updateStatsBar();
    
    // Update interaction count line
    updateInteractionCountLine();

    // Track message in log (only log once, then clear)
    if (game.message) {
        gameLog.push(game.message);
        game.message = ''; // Clear message after logging to prevent duplicates
    }

    // Update weapon and monster display
    updateWeaponDisplay();
    if (game.gameState === 'combat-choice') {
        updateMonsterDisplay();
    }

    // Show appropriate game phase
    switch (game.gameState) {
        case 'room-decision':
            displayRoomDecision();
            break;
        case 'card-interaction':
        case 'combat-choice':
            displayCardInteraction();
            break;
        case 'room-complete':
            displayRoomComplete();
            break;
        case 'game-over':
            displayGameOver();
            break;
    }
}

/**
 * Update stats bar with current game status
 */
function updateStatsBar() {
    const game = getGame();
    const status = game.getPlayerStatus();
    // Discard count = Total (44) - Deck remaining - 4 cards in play
    const discardCount = 44 - status.deckRemaining - 4;

    statsBar.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Room</span>
            <span class="stat-value">${status.room}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">HP</span>
            <div id="hpBar">
                <div id="hpFill" style="width: ${(status.hp / status.maxHp) * 100}%"></div>
                <div id="hpText">${status.hp}/${status.maxHp}</div>
            </div>
        </div>
        <div class="stat-item">
            <span class="stat-label">Deck</span>
            <span class="stat-value">${status.deckRemaining}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Discard</span>
            <span class="stat-value">${discardCount}</span>
        </div>
    `;

    // Update HP bar color
    const hpFill = document.getElementById('hpFill');
    const hpPercent = (status.hp / status.maxHp);
    if (hpPercent < 0.3) {
        hpFill.classList.add('critical');
    } else {
        hpFill.classList.remove('critical');
    }
}

/**
 * Update weapon display area with equipped weapon card
 */
function updateWeaponDisplay() {
    const game = getGame();
    const status = game.getPlayerStatus();

    // If in combat-choice state, don't update here (updateMonsterDisplay handles it)
    if (game.gameState === 'combat-choice') {
        return;
    }

    if (!game.player.equippedWeapon) {
        weaponDisplay.innerHTML = `
            <div class="weapon-label">Equipped Weapon</div>
            <div class="weapon-card empty">
                <div style="color: var(--text-secondary); font-size: 1.2em;">No Weapon</div>
                <div class="weapon-status">Barehanded</div>
            </div>
        `;
        return;
    }

    const weapon = game.player.equippedWeapon;
    
    // Sort defeated monsters in descending order by rank
    const defeatedMonsters = [...status.weaponDefeatedMonsters].sort((a, b) => b.rank - a.rank);
    
    // Build monsters list HTML
    let monstersListHtml = '';
    if (defeatedMonsters.length > 0) {
        monstersListHtml = '<div class="weapon-monsters">';
        defeatedMonsters.forEach((monster, index) => {
            if (index === defeatedMonsters.length - 1) {
                // Last (lowest) monster in bold
                monstersListHtml += `<div class="monster-item lowest"><strong>${monster.rank}${monster.suit}</strong></div>`;
            } else {
                monstersListHtml += `<div class="monster-item">${monster.rank}${monster.suit}</div>`;
            }
        });
        monstersListHtml += '</div>';
    } else {
        monstersListHtml = '<div class="weapon-status">Unused</div>';
    }

    weaponDisplay.innerHTML = `
        <div class="weapon-label">Equipped Weapon</div>
        <div class="weapon-card-container">
            <div class="weapon-card diamonds">
                <div class="card-rank">${weapon.rank}</div>
                <div class="card-suit">♦️</div>
            </div>
            ${monstersListHtml}
        </div>
    `;
}

/**
 * Display room decision phase
 * Shows 4 cards, Flee/Stay buttons
 */
function displayRoomDecision() {
    // Hide other phases
    cardInteractionContent.classList.remove('active');
    roomCompleteContent.classList.remove('active');
    roomDecisionContent.classList.add('active');

    const game = getGame();
    const cards = game.getRoomCards();
    const status = game.getPlayerStatus();

    let html = '<div class="cards-display">';
    cards.forEach((card, index) => {
        html += createCardHTML(card, index, false);
    });
    html += '</div>';

    // Add warning message if can't flee
    if (!status.canRun) {
        html += '<div class="flee-warning">⚠️ You fled last room - you must face this room!</div>';
    }

    html += `
        <div class="decision-buttons">
            <button onclick="playerFlees()" ${!status.canRun ? 'disabled' : ''}>💨 FLEE</button>
            <button onclick="playerStays()">⚔️ STAY</button>
        </div>
    `;

    roomDecisionContent.innerHTML = html;
}

/**
 * Display card interaction phase
 * Shows clickable cards, process cards one by one
 */
function displayCardInteraction() {
    cardInteractionContent.classList.add('active');
    roomCompleteContent.classList.remove('active');
    roomDecisionContent.classList.remove('active');

    const game = getGame();
    const cards = game.getRoomCards();
    const processedIndices = game.currentRoom.processedIndices;

    // Active cards (clickable) - only if not processed AND fewer than 3 cards processed
    let cardsHtml = '<div class="cards-display">';
    cards.forEach((card, index) => {
        const isProcessed = processedIndices.includes(index);
        const isClickable = !isProcessed && processedIndices.length < 3;
        cardsHtml += createCardHTML(card, index, isClickable, isProcessed);
    });
    cardsHtml += '</div>';
    
    // If room is complete, add next room button
    if (game.currentRoom.roomComplete) {
        cardsHtml += `<div class="room-complete-button"><button onclick="nextRoom()">→ NEXT ROOM</button></div>`;
    }

    cardInteractionContent.innerHTML = cardsHtml;
}

/**
 * Update monster display during combat choice
 * Shows selected monster and combat choice buttons in bottom area
 */
function updateMonsterDisplay() {
    const game = getGame();
    const monsterIndex = game.currentRoom.selectedMonsterIndex;
    const monster = game.getRoomCards()[monsterIndex];
    const status = game.getPlayerStatus();
    const canUseWeapon = game.player.canUseWeaponOnMonster(monster.rank);

    // Build weapon display HTML
    let weaponHtml = '';
    if (!game.player.equippedWeapon) {
        weaponHtml = `
            <div class="weapon-display-wrapper">
                <div class="weapon-label">Equipped Weapon</div>
                <div class="weapon-card empty">
                    <div style="color: var(--text-secondary); font-size: 1.2em;">No Weapon</div>
                    <div class="weapon-status">Barehanded</div>
                </div>
            </div>
        `;
    } else {
        const weapon = game.player.equippedWeapon;
        
        // Sort defeated monsters in descending order by rank
        const defeatedMonsters = [...status.weaponDefeatedMonsters].sort((a, b) => b.rank - a.rank);
        
        // Build monsters list HTML
        let monstersListHtml = '';
        if (defeatedMonsters.length > 0) {
            monstersListHtml = '<div class="weapon-monsters-small">';
            defeatedMonsters.forEach((monster, index) => {
                if (index === defeatedMonsters.length - 1) {
                    // Last (lowest) monster in bold
                    monstersListHtml += `<div class="monster-item lowest"><strong>${monster.rank}${monster.suit}</strong></div>`;
                } else {
                    monstersListHtml += `<div class="monster-item">${monster.rank}${monster.suit}</div>`;
                }
            });
            monstersListHtml += '</div>';
        } else {
            monstersListHtml = '<div class="weapon-status">Unused</div>';
        }
        
        weaponHtml = `
            <div class="weapon-display-wrapper">
                <div class="weapon-label">Equipped Weapon</div>
                <div class="weapon-card-container">
                    <div class="weapon-card diamonds">
                        <div class="card-rank">${weapon.rank}</div>
                        <div class="card-suit">♦️</div>
                    </div>
                    ${monstersListHtml}
                </div>
            </div>
        `;
    }

    // Create monster card display
    let html = weaponHtml;
    html += '<div class="monster-display-area">';
    html += '<div class="monster-label">SELECTED MONSTER</div>';
    html += '<div class="monster-card-wrapper">';
    html += createCardHTML(monster, monsterIndex, false);
    html += '</div>';

    // Add flavor text about weapon status
    let weaponStatusText = '';
    if (!game.player.equippedWeapon) {
        weaponStatusText = '<p style="color: var(--text-secondary);">No weapon equipped</p>';
    } else if (!canUseWeapon) {
        weaponStatusText = `<p style="color: var(--accent-red); font-weight: bold;">Weapon too weak! (Max: ${status.weaponMaxValue})</p>`;
    } else {
        const weaponValue = game.player.getWeaponValue();
        const damage = Math.max(0, monster.rank - weaponValue);
        weaponStatusText = `<p style="color: var(--accent-gold);">Damage with weapon: ${damage}</p>`;
    }
    html += weaponStatusText;

    html += `
        <div class="combat-choice-buttons">
            <button onclick="fightBarehanded()" class="combat-btn">👊 Barehanded</button>
            <button onclick="fightWithWeapon()" class="combat-btn" ${!canUseWeapon ? 'disabled' : ''}>⚔️ Use Weapon</button>
        </div>
    `;
    html += '</div>';

    weaponDisplay.innerHTML = html;
}

/**
 * Display room complete phase
 * Shows all 4 cards with processed state, plus next room button
 */
function displayRoomComplete() {
    roomDecisionContent.classList.remove('active');
    cardInteractionContent.classList.remove('active');
    roomCompleteContent.classList.add('active');

    const game = getGame();
    const cards = game.getRoomCards();
    const processedIndices = game.currentRoom.processedIndices;

    // Display all 4 cards
    let cardsHtml = '<div class="cards-display">';
    cards.forEach((card, index) => {
        const isProcessed = processedIndices.includes(index);
        cardsHtml += createCardHTML(card, index, false, isProcessed);
    });
    cardsHtml += '</div>';

    let html = cardsHtml;
    html += `
        <div class="room-complete-button">
            <button onclick="nextRoom()">→ NEXT ROOM</button>
        </div>
    `;

    roomCompleteContent.innerHTML = html;
}

/**
 * Display game over screen
 * Shows victory/defeat with stats
 */
function displayGameOver() {
    const game = getGame();
    const stats = game.getGameOverStats();

    const resultClass = stats.won ? 'victory' : 'defeat';
    const resultTitle = stats.won ? '🏆 VICTORY!' : '💀 DEFEAT!';
    const resultMessage = stats.won
        ? `You survived all ${stats.roomsCompleted} rooms with ${stats.finalHp} HP!`
        : `You were defeated at room ${stats.roomsCompleted} with ${stats.finalHp} HP.`;

    const gameOverHtml = `
        <div class="game-over-content ${resultClass}">
            <h2>${resultTitle}</h2>
            <p>${resultMessage}</p>
            <table class="stats-table">
                <tr>
                    <td class="label">Rooms Completed:</td>
                    <td class="value">${stats.roomsCompleted}</td>
                </tr>
                <tr>
                    <td class="label">Final HP:</td>
                    <td class="value">${stats.finalHp}</td>
                </tr>
                <tr>
                    <td class="label">Final Weapon:</td>
                    <td class="value">${stats.weaponEquipped}</td>
                </tr>
            </table>
            <div class="button-group">
                <button onclick="startNewGame()">🎲 PLAY AGAIN</button>
                <button onclick="showMainMenu()">↩️ MAIN MENU</button>
            </div>
        </div>
    `;

    gameOverScreen.innerHTML = gameOverHtml;
    showGameOverScreen();
}

/**
 * Game action handlers
 */
function playerFlees() {
    const game = getGame();
    if (game.declareRun()) {
        updateGameDisplay();
    } else {
        updateGameDisplay();
    }
}

function playerStays() {
    const game = getGame();
    game.currentRoom.decidedToStay = true;
    game.gameState = 'card-interaction';
    updateGameDisplay();
}

function selectCard(cardIndex) {
    const game = getGame();
    game.selectAndProcessCard(cardIndex);
    updateGameDisplay();
}

function fightBarehanded() {
    const game = getGame();
    game.processCombatChoice(false); // false = don't use weapon
    updateGameDisplay();
}

function fightWithWeapon() {
    const game = getGame();
    game.processCombatChoice(true); // true = use weapon
    updateGameDisplay();
}

function nextRoom() {
    const game = getGame();
    if (game.gameState === 'game-over') {
        showGameOverScreen();
    } else {
        game.enterNextRoom();
        updateGameDisplay();
    }
}

function startNewGame() {
    gameLog = []; // Reset log for new game
    newGame();
    updateGameDisplay();
    showGameScreen();
}

/**
 * Helper functions
 */
function createCardHTML(card, index, clickable = false, processed = false) {
    const suitClass = getSuitClass(card.suit);
    const clickHandler = clickable ? `onclick="selectCard(${index})"` : '';
    const clickableClass = clickable ? 'clickable' : '';
    const processedClass = processed ? 'processed' : '';

    return `
        <div class="card ${suitClass} ${clickableClass} ${processedClass}" ${clickHandler}>
            <div class="card-rank">${card.rank}</div>
            <div class="card-suit">${card.suit}</div>
            <div class="card-name">${card.name}</div>
        </div>
    `;
}

function getSuitClass(suit) {
    switch(suit) {
        case '♠️': return 'spades';
        case '♣️': return 'clubs';
        case '♦️': return 'diamonds';
        case '♥️': return 'hearts';
        default: return '';
    }
}

/**
 * Event handlers for menu buttons
 */
function startGame() {
    startNewGame();
    showGameScreen();
}

function showInstructionsFromMenu() {
    showInstructions();
}

function backToMenu() {
    showMainMenu();
}

function exitToMenu() {
    showMainMenu();
}

function toggleMenuDropdown() {
    const dropdown = document.getElementById('menuDropdownContent');
    dropdown.classList.toggle('show');
}

function toggleLogModal() {
    const modal = document.getElementById('logModal');
    modal.classList.toggle('show');
    
    if (modal.classList.contains('show')) {
        // Populate log content in reverse chronological order (newest first)
        const logContent = document.getElementById('logContent');
        logContent.innerHTML = gameLog.length > 0 
            ? [...gameLog].reverse().map(msg => `<div class="log-entry">${msg}</div>`).join('')
            : '<div class="log-entry">No events yet.</div>';
    }
    
    // Close dropdown when opening log
    const dropdown = document.getElementById('menuDropdownContent');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const menuDropdown = document.querySelector('.menu-dropdown');
    if (menuDropdown && !menuDropdown.contains(event.target)) {
        const dropdown = document.getElementById('menuDropdownContent');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
});

/**
 * Initialize the game
 */
document.addEventListener('DOMContentLoaded', function() {
    showMainMenu();
});
