/**
 * Scoundrel Game - UI Controller
 * Handles all screen rendering and user interactions
 */

/**
 * UIBuilder - Centralized UI component builder
 * Consolidates all card and element rendering for consistent styling and easier maintenance
 */
class UIBuilder {
    static cachedElements = {};

    /**
     * Get or cache a DOM element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} The cached element or null if not found
     */
    static getCachedElement(id) {
        if (!this.cachedElements[id]) {
            const element = document.getElementById(id);
            if (element) {
                this.cachedElements[id] = element;
            }
        }
        return this.cachedElements[id] || null;
    }

    /**
     * Clear element cache (call on game reset or page unload)
     */
    static clearElementCache() {
        this.cachedElements = {};
    }

    /**
     * Build HTML for a single card element
     * @param {Card} card - The card to render
     * @param {number} index - Card position index
     * @param {boolean} clickable - Whether card is interactive
     * @param {boolean} processed - Whether card has been processed
     * @returns {string} HTML string for the card
     */
    static buildCard(card, index, clickable = false, processed = false) {
        const suitClass = UIBuilder.getSuitClass(card.suit);
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

    /**
     * Build HTML for defeated monsters list
     * Used in weapon displays
     * @param {Array} weaponDefeatedMonsters - Array of defeated monster cards
     * @param {string} containerClass - CSS class for the container
     * @returns {string} HTML string for the monster list
     */
    static buildDefeatedMonsters(weaponDefeatedMonsters, containerClass = 'weapon-monsters') {
        const defeatedMonsters = [...weaponDefeatedMonsters].sort((a, b) => b.rank - a.rank);
        if (defeatedMonsters.length === 0) {
            return '<div class="weapon-status">Unused</div>';
        }
        let html = `<div class="${containerClass}">`;
        defeatedMonsters.forEach((monster, index) => {
            const isLowest = index === defeatedMonsters.length - 1;
            const bold = isLowest ? '<strong>' : '';
            const boldEnd = isLowest ? '</strong>' : '';
            html += `<div class="monster-item${isLowest ? ' lowest' : ''}">${bold}${monster.rank}${monster.suit}${boldEnd}</div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Build HTML for equipped weapon display
     * @param {Game} game - The game instance
     * @param {boolean} isCompact - Whether to use compact styling
     * @returns {string} HTML string for weapon display
     */
    static buildWeapon(game, isCompact = false) {
        const containerClass = isCompact ? 'weapon-display-wrapper' : '';
        const monstersClass = isCompact ? 'weapon-monsters-small' : 'weapon-monsters';
        
        if (!game.player.equippedWeapon) {
            return `
                <div class="${containerClass}">
                    <div class="weapon-label">Equipped Weapon</div>
                    <div class="weapon-card empty">
                        <div style="color: var(--text-secondary); font-size: 1.2em;">No Weapon</div>
                        <div class="weapon-status">Barehanded</div>
                    </div>
                </div>
            `;
        }

        const weapon = game.player.equippedWeapon;
        const status = game.getPlayerStatus();
        const monstersListHtml = UIBuilder.buildDefeatedMonsters(status.weaponDefeatedMonsters, monstersClass);
        
        // Build degradation warning if weapon is locked to specific monsters
        let degradationWarning = '';
        if (game.player.weaponMaxMonsterValue !== null) {
            degradationWarning = `<div class="weapon-degradation-warning">⚠️ Max usable: ${game.player.weaponMaxMonsterValue}</div>`;
        }
        
        return `
            <div class="${containerClass}">
                <div class="weapon-label">Equipped Weapon</div>
                <div class="weapon-card-container">
                    <div class="weapon-card diamonds">
                        <div class="card-rank">${weapon.rank}</div>
                        <div class="card-suit">♦️</div>
                    </div>
                    ${monstersListHtml}
                </div>
                ${degradationWarning}
            </div>
        `;
    }

    /**
     * Get CSS class for card suit
     * @param {string} suit - The suit symbol
     * @returns {string} CSS class name
     */
    static getSuitClass(suit) {
        switch(suit) {
            case '♠️': return 'spades';
            case '♣️': return 'clubs';
            case '♦️': return 'diamonds';
            case '♥️': return 'hearts';
            default: return '';
        }
    }
}

/**
 * Helper function - Build HTML for defeated monsters list
 * Used in both weapon display and combat choice display
 * @deprecated Use UIBuilder.buildDefeatedMonsters instead
 */
function buildDefeatedMonstersHtml(weaponDefeatedMonsters, containerClass = 'weapon-monsters') {
    return UIBuilder.buildDefeatedMonsters(weaponDefeatedMonsters, containerClass);
}

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
let discardPileOrder = 'newest'; // 'newest' (most recent first) or 'oldest' (oldest first)
let logReverseOrder = true; // true = newest first, false = oldest first

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
    
    // Close any open dropdowns/modals when changing screens
    const dropdown = document.getElementById('menuDropdownContent');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
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
    if (game.gameState === GAME_STATES.MENU || game.gameState === GAME_STATES.GAME_OVER || game.gameState === GAME_STATES.ROOM_DECISION) {
        interactionCountLine.innerHTML = '';
        return;
    }
    
    // Show interaction count during card interaction, combat choice, and room complete phases
    if (game.currentRoom && (game.gameState === GAME_STATES.CARD_INTERACTION || game.gameState === GAME_STATES.COMBAT_CHOICE || game.gameState === GAME_STATES.ROOM_COMPLETE)) {
        const processed = game.currentRoom.processedIndices.length;
        const cardsToProcess = game.currentRoom.isFinalRoom ? game.currentRoom.cards.length : 3;
        const countText = `Interacted with ${processed} of ${cardsToProcess} cards`;
        interactionCountLine.innerHTML = `<div class="interaction-count">${countText}</div>`;
    }
}

/**
 * Main game display update
 */
function updateGameDisplay() {
    try {
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
        if (game.gameState === GAME_STATES.COMBAT_CHOICE) {
            updateMonsterDisplay();
        }

        // Show appropriate game phase
        switch (game.gameState) {
            case GAME_STATES.ROOM_DECISION:
                displayRoomDecision();
                break;
            case GAME_STATES.CARD_INTERACTION:
            case GAME_STATES.COMBAT_CHOICE:
                displayCardInteraction();
                break;
            case GAME_STATES.ROOM_COMPLETE:
                displayRoomComplete();
                break;
            case GAME_STATES.GAME_OVER:
                displayGameOver();
                break;
        }
    } catch (error) {
        console.error('Error updating game display:', error);
    }
}

/**
 * Update stats bar with current game status
 */
function updateStatsBar() {
    const game = getGame();
    const status = game.getPlayerStatus();
    // Discard count is now calculated in getPlayerStatus()
    const discardCount = status.discardCount;

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
        <div class="stat-item menu-stat-item">
            <button class="menu-button" onclick="toggleMenuDropdown()" title="Menu">☰</button>
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

    // If in combat-choice state, don't update here (updateMonsterDisplay handles it)
    if (game.gameState === GAME_STATES.COMBAT_CHOICE) {
        return;
    }

    weaponDisplay.innerHTML = buildWeaponDisplayHtml(game, false);
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
        const gameInstance = getGame();
        const isFinalRoom = gameInstance.currentRoom && gameInstance.currentRoom.isFinalRoom;
        const reason = isFinalRoom 
            ? '⚠️ Final room - you must use all remaining cards!'
            : '⚠️ You fled last room - you must face this room!';
        html += `<div class="flee-warning">${reason}</div>`;
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

    // Determine how many cards need to be processed (3 for normal rooms, all for final rooms)
    const cardsToProcess = game.currentRoom.isFinalRoom ? game.currentRoom.cards.length : 3;
    
    // Active cards (clickable) - only if not processed AND fewer than required cards processed
    let cardsHtml = '<div class="cards-display">';
    cards.forEach((card, index) => {
        const isProcessed = processedIndices.includes(index);
        const isClickable = !isProcessed && processedIndices.length < cardsToProcess;
        
        if (isProcessed) {
            // Show empty placeholder for processed cards
            cardsHtml += `<div class="card empty-placeholder"></div>`;
        } else {
            cardsHtml += createCardHTML(card, index, isClickable, false);
        }
    });
    cardsHtml += '</div>';
    
    // Add warning message below cards if this is the beginning of card interaction (just entered from forced stay)
    if (processedIndices.length === 0 && game.ranLastRoom) {
        cardsHtml += '<div class="flee-warning">⚠️ You fled last room - you cannot flee again!</div>';
    }
    
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

    // Build weapon display HTML (compact version for combat choice)
    const weaponHtml = buildWeaponDisplayHtml(game, true);

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
 * Shows all 4 cards with processed cards as empty placeholders, plus next room button
 */
function displayRoomComplete() {
    roomDecisionContent.classList.remove('active');
    cardInteractionContent.classList.remove('active');
    roomCompleteContent.classList.add('active');

    const game = getGame();
    const cards = game.getRoomCards();
    const processedIndices = game.currentRoom.processedIndices;

    // Display all 4 cards, with empty placeholders for processed ones
    let cardsHtml = '<div class="cards-display">';
    cards.forEach((card, index) => {
        const isProcessed = processedIndices.includes(index);
        
        if (isProcessed) {
            // Show empty placeholder for processed cards
            cardsHtml += `<div class="card empty-placeholder"></div>`;
        } else {
            cardsHtml += createCardHTML(card, index, false, false);
        }
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

    // Save stats to persistent storage
    StatsManager.getInstance().save(stats);
    StatsManager.getInstance().updateDisplay();

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
    if (game.fleeRoom()) {
        updateGameDisplay();
    } else {
        updateGameDisplay();
    }
}

function playerStays() {
    const game = getGame();
    game.currentRoom.decidedToStay = true;
    game.gameState = GAME_STATES.CARD_INTERACTION;
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
    if (game.gameState === GAME_STATES.GAME_OVER) {
        showGameOverScreen();
    } else {
        game.enterNextRoom();
        updateGameDisplay();
    }
}

function startNewGame() {
    try {
        gameLog = []; // Reset log for new game
        newGame();
        updateGameDisplay();
        showGameScreen();
    } catch (error) {
        console.error('Error starting new game:', error);
        alert('Error starting game. Check console for details.');
    }
}

/**
 * Helper function - Build weapon display HTML
 * @deprecated Use UIBuilder.buildWeapon instead
 */
function buildWeaponDisplayHtml(game, isCompact = false) {
    return UIBuilder.buildWeapon(game, isCompact);
}

/**
 * Legacy function names for backward compatibility
 */
function createCardHTML(card, index, clickable = false, processed = false) {
    return UIBuilder.buildCard(card, index, clickable, processed);
}

function getSuitClass(suit) {
    return UIBuilder.getSuitClass(suit);
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

function updateLogDisplay() {
    const logContent = document.getElementById('logContent');
    const game = getGame();
    
    if (!game || !game.logger) {
        logContent.innerHTML = '<div class="log-entry">No game in progress.</div>';
        return;
    }
    
    const allLogs = game.logger.getAllLogs();
    
    if (allLogs.length === 0) {
        logContent.innerHTML = '<div class="log-entry">No events yet.</div>';
    } else {
        // Apply ordering based on logReverseOrder flag
        const logsToDisplay = logReverseOrder ? [...allLogs].reverse() : allLogs;
        
        // Display detailed logs with friendly display names
        const logHTML = logsToDisplay.map((entry) => {
                let html = `<div class="log-entry detailed-log">`;
                html += `<div class="log-action-num">[${entry.action}]</div>`;
                let displayText = '';
                let displayClass = 'log-action';
                
                switch(entry.type) {
                    case 'card-movement':
                        displayClass = 'log-card-movement';
                        displayText = `${entry.cardSymbol} <strong>${entry.card}</strong><br>`;
                        displayText += `<span class="log-reason">${entry.from} → ${entry.to}</span>`;
                        displayText += `<br><span style="color: var(--text-secondary); font-size: 0.85em;">${entry.reason}</span>`;
                        break;
                        
                    case 'weapon-change':
                        displayClass = 'log-weapon';
                        displayText = `${entry.weaponSymbol} <strong>${entry.weapon}</strong><br>`;
                        displayText += `<span style="color: var(--accent-gold);">${entry.changeType}</span>`;
                        if (entry.details.newMax) {
                            displayText += ` (locked to max value ${entry.details.newMax})`;
                        }
                        break;
                        
                    case 'state-transition':
                        displayClass = 'log-state';
                        displayText = `State: <code>${entry.from}</code> → <code>${entry.to}</code>`;
                        if (entry.trigger) {
                            displayText += `<br><span style="color: var(--text-secondary); font-size: 0.85em;">${entry.trigger}</span>`;
                        }
                        break;
                        
                    case 'action':
                        displayClass = 'log-action';
                        const actionEmoji = {
                            'game-start': '🎮',
                            'game-end': '🏁',
                            'room-draw': '🎴',
                            'room-exit': '🚪',
                            'room-complete': '✨',
                            'select-card': '👆',
                            'equip-weapon': '🔫',
                            'use-potion': '🧪',
                            'use-potion-rejected': '❌',
                            'flee': '💨',
                            'flee-rejected': '🛑',
                            'room-advance': '📍'
                        }[entry.actionType] || '•';
                        
                        displayText = `${actionEmoji} <strong>${formatActionName(entry.actionType)}</strong>`;
                        
                        // Add readable detail for some actions
                        if (entry.actionType === 'equip-weapon' && entry.details.newWeapon) {
                            displayText += `<br><span style="color: var(--text-secondary); font-size: 0.9em;">Equipped ${entry.details.newWeapon}`;
                            if (entry.details.oldWeapon) {
                                displayText += ` (was ${entry.details.oldWeapon})`;
                            }
                            displayText += `</span>`;
                        } else if (entry.actionType === 'use-potion' && entry.details.healAmount) {
                            displayText += `<br><span style="color: var(--text-secondary); font-size: 0.9em;">+${entry.details.healAmount} HP</span>`;
                        } else if (entry.actionType === 'room-complete') {
                            displayText += `<br><span style="color: var(--text-secondary); font-size: 0.9em;">Room ${entry.details.roomNumber}</span>`;
                        } else if (entry.actionType === 'flee' && entry.details.cardsShuffledToBottom) {
                            displayText += `<br><span style="color: var(--text-secondary); font-size: 0.9em;">Deck grew to ${entry.details.newDeckSize} cards</span>`;
                        } else if (entry.actionType === 'room-draw' && entry.details.cardsDrawn) {
                            displayText += `<br><span style="color: var(--text-secondary); font-size: 0.9em;">Drew ${entry.details.cardsDrawn} cards`;
                            if (entry.details.cardsCarriedOver > 0) {
                                displayText += ` (${entry.details.cardsCarriedOver} carried over)`;
                            }
                            displayText += `</span>`;
                        }
                        break;
                        
                    case 'combat':
                        displayClass = 'log-combat';
                        displayText = `⚔️ <strong>${entry.monster}</strong> (${entry.stats.monsterValue})`;
                        if (entry.method === 'weapon') {
                            displayText += ` vs ${entry.stats.weaponName} (${entry.stats.weaponValue})`;
                        } else {
                            displayText += ` - barehanded`;
                        }
                        displayText += `<br><span style="color: var(--text-secondary); font-size: 0.9em;">Damage: ${entry.stats.damage} | HP: ${entry.stats.hpAfter}/${entry.stats.hp || 20}</span>`;
                        break;
                        
                    case 'status-update':
                        displayClass = 'log-status';
                        const statusEmoji = {
                            'game-start': '🎮',
                            'hp-change': '❤️',
                            'room-advance': '📍',
                            'victory': '🏆',
                            'defeat': '💀'
                        }[entry.eventType] || '•';
                        
                        displayText = `${statusEmoji} <strong>${formatStatusName(entry.eventType)}</strong>`;
                        displayText += `<br><span style="color: var(--text-secondary); font-size: 0.9em;">Room ${entry.stats.roomNumber} | HP ${entry.stats.hp}/${entry.stats.maxHp}`;
                        if (entry.stats.deckSize !== undefined) {
                            displayText += ` | Deck: ${entry.stats.deckSize}`;
                        }
                        if (entry.stats.discardSize !== undefined) {
                            displayText += ` | Discard: ${entry.stats.discardSize}`;
                        }
                        displayText += `</span>`;
                        break;
                        
                    default:
                        displayText = JSON.stringify(entry);
                }
                
                html += `<div class="${displayClass}">${displayText}</div>`;
                html += `<div class="log-timestamp">${entry.timestamp}</div></div>`;
                return html;
            }).join('');
            
            logContent.innerHTML = logHTML;
        }
}

function toggleLogModal() {
    const modal = document.getElementById('logModal');
    modal.classList.toggle('show');
    
    if (modal.classList.contains('show')) {
        updateLogDisplay();
    }
    
    // Close dropdown when opening log
    const dropdown = document.getElementById('menuDropdownContent');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function toggleLogOrder() {
    logReverseOrder = !logReverseOrder;
    const button = document.getElementById('logOrderToggle');
    if (button) {
        button.textContent = logReverseOrder ? '↓ Newest First' : '↑ Oldest First';
    }
    updateLogDisplay();
}

function toggleStatsModal() {
    const modal = document.getElementById('statsModal');
    modal.classList.toggle('show');
    
    if (modal.classList.contains('show')) {
        StatsManager.getInstance().updateDisplay();
    }
    
    // Close dropdown when opening stats
    const dropdown = document.getElementById('menuDropdownContent');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

/**
 * Legacy wrapper - kept for backward compatibility
 * @deprecated Use StatsManager.getInstance().updateDisplay() instead
 */
function updateStatsDisplay() {
    StatsManager.getInstance().updateDisplay();
}

/**
 * Legacy wrapper - kept for backward compatibility
 * @deprecated Use StatsManager.getInstance().getStats() instead
 */
function loadStatsFromStorage() {
    return StatsManager.getInstance().getStats();
}

/**
 * Legacy wrapper - kept for backward compatibility
 * @deprecated Use StatsManager.getInstance().save(gameStats) instead
 */
function saveStatsToStorage(gameStats) {
    StatsManager.getInstance().save(gameStats);
}

/**
 * Reset all game statistics with confirmation
 */
function resetStats() {
    StatsManager.getInstance().reset();
}

// Helper function to format action names for display
function formatActionName(actionType) {
    const names = {
        'game-start': 'Game Started',
        'game-end': 'Game Ended',
        'room-draw': 'Room Entered',
        'room-exit': 'Room Exited',
        'room-complete': 'Room Complete',
        'select-card': 'Card Selected',
        'equip-weapon': 'Weapon Equipped',
        'use-potion': 'Potion Used',
        'use-potion-rejected': 'Potion Rejected',
        'flee': 'Room Fled',
        'flee-rejected': 'Flee Failed',
        'room-advance': 'Room Advance'
    };
    return names[actionType] || actionType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Helper function to format status names for display
function formatStatusName(eventType) {
    const names = {
        'game-start': 'Game Started',
        'hp-change': 'HP Changed',
        'room-advance': 'Advanced to Room',
        'victory': 'Victory!',
        'defeat': 'Defeated!'
    };
    return names[eventType] || eventType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function toggleDiscardModal() {
    const modal = document.getElementById('discardModal');
    modal.classList.toggle('show');
    
    if (modal.classList.contains('show')) {
        updateDiscardPileDisplay();
    }
    
    // Close dropdown when opening discard modal
    const dropdown = document.getElementById('menuDropdownContent');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function toggleDiscardOrder() {
    discardPileOrder = discardPileOrder === 'newest' ? 'oldest' : 'newest';
    updateDiscardPileDisplay();
}

function updateDiscardPileDisplay() {
    const game = getGame();
    const discardPile = game.getDiscardPile();
    const discardContent = document.getElementById('discardContent');
    
    if (discardPile.length === 0) {
        discardContent.innerHTML = '<div class="log-entry">Discard pile is empty.</div>';
        return;
    }
    
    const orderedPile = discardPileOrder === 'newest' ? discardPile : [...discardPile].reverse();
    const orderLabel = discardPileOrder === 'newest' ? '(Most Recent → Oldest)' : '(Oldest → Most Recent)';
    
    let html = `<div style="text-align: center; margin-bottom: 15px; color: var(--text-secondary); font-size: 0.9em;">${orderLabel}</div>`;
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
    
    orderedPile.forEach((card, index) => {
        const suitClass = getSuitClass(card.suit);
        html += `
            <div class="discard-entry ${suitClass}">
                <div class="discard-rank">${card.rank}</div>
                <div class="discard-suit">${card.suit}</div>
                <div class="discard-name">${card.name}</div>
            </div>
        `;
    });
    
    html += '</div>';
    discardContent.innerHTML = html;
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
 * Initialize the game and load statistics
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize StatsManager and load persisted stats from localStorage
    StatsManager.getInstance().updateDisplay();
    
    showMainMenu();
});
