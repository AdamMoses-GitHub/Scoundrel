/**
 * Scoundrel Game Engine
 * Core game logic and rules implementation
 */

/**
 * Game Constants
 * Centralized values for game configuration
 */
const GAME_CONSTANTS = {
    STARTING_HP: 20,
    MAX_HP: 20,
    CARDS_PER_ROOM: 4,
    CARDS_TO_INTERACT: 3,
    DECK_SIZE: 44,
    MAX_RANK: 14,          // Ace value
    WEAPON_MAX_RANK: 10,   // Highest weapon card
    MIN_RANK: 2            // Lowest card value
};

/**
 * Game State Constants
 * All possible game states centralized for consistency
 */
const GAME_STATES = {
    MENU: 'menu',
    ROOM_DECISION: 'room-decision',
    CARD_INTERACTION: 'card-interaction',
    COMBAT_CHOICE: 'combat-choice',
    ROOM_COMPLETE: 'room-complete',
    GAME_OVER: 'game-over'
};

/**
 * Utility function - Get random integer from 0 to max (exclusive)
 * @param {number} max - Upper bound (exclusive)
 * @returns {number} Random integer in range [0, max)
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/**
 * Utility function - Fisher-Yates shuffle
 * Shuffles array in-place
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = getRandomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Card suit and rank constants
const Suit = {
    SPADES: '♠️',
    CLUBS: '♣️',
    DIAMONDS: '♦️',
    HEARTS: '♥️'
};

const Rank = {
    2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
    JACK: 11,
    QUEEN: 12,
    KING: 13,
    ACE: 14
};

const RankNames = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace'
};

/**
 * GameLogger class - comprehensive logging system for all game events and card movements
 * Logs to console (debug), game log array (display), and tracks event history
 */
class GameLogger {
    static ACTION_EMOJI = {
        'flee': '💨',
        'stay': '🏃',
        'fight-barehanded': '👊',
        'fight-weapon': '⚔️',
        'use-potion': '🧪',
        'equip-weapon': '🔫',
        'combat-resolved': '✓',
        'room-complete': '✨',
        'victory': '🏆',
        'defeat': '💀'
    };

    static STATUS_EMOJI = {
        'hp-change': '❤️',
        'room-advance': '📍',
        'victory': '🏆',
        'defeat': '💀'
    };

    constructor() {
        this.logs = [];           // All log entries with timestamps
        this.actionCounter = 0;   // Sequential action numbering
    }

    /**
     * Get current timestamp
     * @returns {string} Formatted timestamp
     */
    getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    /**
     * Log a card movement (deck→room, room→discard, weapon→equipped, etc.)
     * @param {Card} card - The card being moved
     * @param {String} from - Source location (deck, room-[0-3], equipped, discard)
     * @param {String} to - Destination location
     * @param {String} reason - Why the card moved (selected, discarded, auto-discard, etc.)
     * @param {Object} context - Additional context (damage, hp change, etc.)
     */
    logCardMovement(card, from, to, reason, context = {}) {
        this.actionCounter++;
        const entry = {
            action: this.actionCounter,
            type: 'card-movement',
            timestamp: this.getTimestamp(),
            card: card.getName(),
            cardSymbol: card.toString(),
            from,
            to,
            reason,
            context
        };
        this.logs.push(entry);
        
        // Console logging (verbose)
        console.log(`[${entry.action}] ${card.toString()} ${from} → ${to} (${reason})`);
        if (Object.keys(context).length > 0) {
            console.log(`      Context:`, context);
        }
    }

    /**
     * Log a weapon state change (degradation, reset, etc.)
     * @param {Card} weapon - The weapon card
     * @param {String} changeType - Type of change (degraded, reset, locked, etc.)
     * @param {Object} details - Degradation details (maxValue, monsterValue, etc.)
     */
    logWeaponChange(weapon, changeType, details = {}) {
        this.actionCounter++;
        const entry = {
            action: this.actionCounter,
            type: 'weapon-change',
            timestamp: this.getTimestamp(),
            weapon: weapon.getName(),
            weaponSymbol: weapon.toString(),
            changeType,
            details
        };
        this.logs.push(entry);

        const weaponMax = details.newMax !== undefined ? details.newMax : details.maxValue;
        const monsterVal = details.monsterValue;
        const detail = changeType === 'degraded' 
            ? `locked to max value ${weaponMax} (fought ${RankNames[monsterVal]} = ${monsterVal})`
            : `reset to new weapon (no degradation history)`;
        
        console.log(`[${entry.action}] ⚔️  ${weapon.toString()} ${changeType}: ${detail}`);
    }

    /**
     * Log a game state transition
     * @param {String} fromState - Previous game state
     * @param {String} toState - New game state
     * @param {String} trigger - What caused the transition (button click, automatic, etc.)
     */
    logStateTransition(fromState, toState, trigger = '') {
        this.actionCounter++;
        const entry = {
            action: this.actionCounter,
            type: 'state-transition',
            timestamp: this.getTimestamp(),
            from: fromState,
            to: toState,
            trigger
        };
        this.logs.push(entry);

        console.log(`[${entry.action}] 🔄 State: ${fromState} → ${toState}${trigger ? ` (${trigger})` : ''}`);
    }

    /**
     * Log a game action (flee, stay, combat choice, etc.)
     * @param {String} action - Action type (flee, stay, fight, use-weapon, use-potion, etc.)
     * @param {Object} details - Action details
     */
    logAction(action, details = {}) {
        this.actionCounter++;
        const entry = {
            action: this.actionCounter,
            type: 'action',
            timestamp: this.getTimestamp(),
            actionType: action,
            details
        };
        this.logs.push(entry);

        const emoji = GameLogger.ACTION_EMOJI[action] || '•';

        const detailStr = Object.entries(details)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ');
        
        console.log(`[${entry.action}] ${emoji} ${action}${detailStr ? ` (${detailStr})` : ''}`);
    }

    /**
     * Log combat resolution (damage calculation, weapon usage, etc.)
     * @param {Card} monster - Monster card
     * @param {String} method - How fight was resolved (barehanded, weapon)
     * @param {Object} stats - Combat stats (monsterValue, weaponValue, damage, hp)
     */
    logCombat(monster, method, stats = {}) {
        this.actionCounter++;
        const entry = {
            action: this.actionCounter,
            type: 'combat',
            timestamp: this.getTimestamp(),
            monster: monster.getName(),
            monsterSymbol: monster.toString(),
            method,
            stats
        };
        this.logs.push(entry);

        const weaponStr = method === 'weapon' 
            ? ` vs ${stats.weaponName} (${stats.weaponValue})` 
            : ' (barehanded)';
        
        console.log(`[${entry.action}] ⚔️  Combat: ${monster.toString()}${weaponStr} → ${stats.damage} damage`);
    }

    /**
     * Log player status update (HP change, room advancement, etc.)
     * @param {String} eventType - Type of status event (hp-change, room-advance, victory, defeat)
     * @param {Object} stats - Current player stats
     */
    logStatusUpdate(eventType, stats = {}) {
        this.actionCounter++;
        const entry = {
            action: this.actionCounter,
            type: 'status-update',
            timestamp: this.getTimestamp(),
            eventType,
            stats
        };
        this.logs.push(entry);

        const emoji = GameLogger.STATUS_EMOJI[eventType] || '•';

        console.log(`[${entry.action}] ${emoji} ${eventType}: Room ${stats.roomNumber}, HP ${stats.hp}/${stats.maxHp}`);
    }

    /**
     * Get all logs as structured data
     */
    getAllLogs() {
        return [...this.logs];
    }

    /**
     * Get logs filtered by type
     */
    getLogsByType(type) {
        return this.logs.filter(log => log.type === type);
    }

    /**
     * Get recent logs (last N entries)
     */
    getRecentLogs(count = 10) {
        return this.logs.slice(-count);
    }

    /**
     * Clear all logs (called on new game)
     */
    clear() {
        this.logs = [];
        this.actionCounter = 0;
        console.log('🗑️  Game logs cleared');
    }

    /**
     * Export logs as JSON for debugging
     */
    exportAsJSON() {
        return JSON.stringify(this.logs, null, 2);
    }
}

/**
 * Card class - represents a single playing card
 */
class Card {
    constructor(suit, rank) {
        if (rank < GAME_CONSTANTS.MIN_RANK || rank > GAME_CONSTANTS.MAX_RANK) {
            throw new Error(`Invalid card rank: ${rank}`);
        }
        this.suit = suit;
        this.rank = rank;
    }

    getValue() {
        return this.rank;
    }

    get name() {
        return this.getName();
    }

    getName() {
        return `${RankNames[this.rank]} of ${this.suitName()}`;
    }

    suitName() {
        switch(this.suit) {
            case Suit.SPADES: return 'Spades';
            case Suit.CLUBS: return 'Clubs';
            case Suit.DIAMONDS: return 'Diamonds';
            case Suit.HEARTS: return 'Hearts';
        }
    }

    isMonster() {
        return this.suit === Suit.SPADES || this.suit === Suit.CLUBS;
    }

    isWeapon() {
        return this.suit === Suit.DIAMONDS;
    }

    isPotion() {
        return this.suit === Suit.HEARTS;
    }

    getType() {
        if (this.isMonster()) return 'Monster';
        if (this.isWeapon()) return 'Weapon';
        if (this.isPotion()) return 'Potion';
        return 'Unknown';
    }

    toString() {
        return `${this.suit} ${RankNames[this.rank]}`;
    }
}

/**
 * Deck class - manages the 44-card deck
 */
class Deck {
    static MONSTER_RANK_MIN = GAME_CONSTANTS.MIN_RANK;
    static MONSTER_RANK_MAX = GAME_CONSTANTS.MAX_RANK;
    static WEAPON_RANK_MIN = GAME_CONSTANTS.MIN_RANK;
    static WEAPON_RANK_MAX = GAME_CONSTANTS.WEAPON_MAX_RANK;
    static POTION_RANK_MIN = GAME_CONSTANTS.MIN_RANK;
    static POTION_RANK_MAX = GAME_CONSTANTS.WEAPON_MAX_RANK;

    constructor() {
        this.cards = [];
        this.initializeDeck();
        this.shuffle();
    }

    initializeDeck() {
        // All Black cards (Spades/Clubs 2-Ace) = Monsters (26 cards)
        for (let rank = Deck.MONSTER_RANK_MIN; rank <= Deck.MONSTER_RANK_MAX; rank++) {
            this.cards.push(new Card(Suit.SPADES, rank));
            this.cards.push(new Card(Suit.CLUBS, rank));
        }
        // All Diamonds (2-10) = Weapons (9 cards)
        for (let rank = Deck.WEAPON_RANK_MIN; rank <= Deck.WEAPON_RANK_MAX; rank++) {
            this.cards.push(new Card(Suit.DIAMONDS, rank));
        }
        // All Hearts (2-10) = Potions (9 cards)
        for (let rank = Deck.POTION_RANK_MIN; rank <= Deck.POTION_RANK_MAX; rank++) {
            this.cards.push(new Card(Suit.HEARTS, rank));
        }
        // Total: 26 + 9 + 9 = 44 cards
    }

    shuffle() {
        // Fisher-Yates shuffle
        shuffleArray(this.cards);
    }

    draw(count = 1) {
        return this.cards.splice(0, count);
    }

    pushToBottom(cards) {
        this.cards.push(...cards);
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    remaining() {
        return this.cards.length;
    }
}

/**
 * Player class - tracks player state
 */
class Player {
    constructor() {
        this.hp = GAME_CONSTANTS.STARTING_HP;
        this.maxHp = GAME_CONSTANTS.MAX_HP;
        this.equippedWeapon = null;
        this.weaponMaxMonsterValue = null; // Tracks the highest monster the weapon has been used on
        this.weaponDefeatedMonsters = []; // Tracks all monsters defeated by current weapon
        this.usedPotionThisRoom = false;
        this.roomNumber = 0;
        this.discardedCards = []; // Tracks all cards discarded from play (includes replaced weapons)
    }

    isAlive() {
        return this.hp > 0;
    }

    takeDamage(amount) {
        if (amount < 0) return; // Ignore negative damage
        this.hp = Math.max(0, this.hp - amount);
    }

    heal(amount) {
        if (amount < 0) return; // Ignore negative healing
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    getWeaponValue() {
        return this.equippedWeapon ? this.equippedWeapon.getValue() : 0;
    }

    equipWeapon(card) {
        // Old weapon was already discarded in selectAndProcessCard() if replacing
        this.equippedWeapon = card;
        this.weaponMaxMonsterValue = null; // Reset degradation when equipping new weapon
        this.weaponDefeatedMonsters = []; // Reset defeated monsters list
    }

    canUseWeaponOnMonster(monsterValue) {
        if (!this.equippedWeapon) {
            return false; // No weapon equipped
        }
        if (this.weaponMaxMonsterValue === null) {
            return true; // Weapon has never been used, can use on any monster
        }
        return monsterValue < this.weaponMaxMonsterValue; // Can only use on weaker monsters than previous max
    }

    updateWeaponMaxMonsterValue(card) {
        if (!this.equippedWeapon) return;
        
        // Add to defeated monsters list - store both rank and suit
        this.weaponDefeatedMonsters.push({
            rank: card.rank,
            suit: card.suit
        });
        
        const monsterValue = card.rank;
        if (this.weaponMaxMonsterValue === null) {
            this.weaponMaxMonsterValue = monsterValue;
        } else {
            // Update to the lower value if this monster is weaker (degradation)
            this.weaponMaxMonsterValue = Math.min(this.weaponMaxMonsterValue, monsterValue);
        }
    }

    resetRoomState() {
        this.usedPotionThisRoom = false;
    }
}

/**
 * Room class - manages cards in current room
 */
class Room {
    constructor(cards) {
        // Allow 1-4 cards: normal rooms have 4, final rooms may have fewer
        if (cards.length < 1 || cards.length > GAME_CONSTANTS.CARDS_PER_ROOM) {
            throw new Error(`Room must have 1-${GAME_CONSTANTS.CARDS_PER_ROOM} cards, got ${cards.length}`);
        }
        this.cards = cards; // Cards drawn this room
        this.isFinalRoom = cards.length < GAME_CONSTANTS.CARDS_PER_ROOM; // True if fewer than 4 cards (last room)
        this.processedIndices = []; // Indices of cards already interacted with
        this.decidedToStay = false; // Whether player chose to stay
        this.selectedMonsterIndex = null; // Tracks which monster is being fought (for combat choice)
        this.roomComplete = false; // Flag for when all interaction cards are processed
        this.discardedCard = null; // Stores the discarded card info
    }
}

/**
 * Game class - main game controller
 */
class Game {
    constructor() {
        this.logger = new GameLogger(); // Initialize logging system
        this.deck = null;
        this.player = null;
        this.currentRoom = null;
        this.gameState = GAME_STATES.MENU; // Initial state
        this.gameOver = false;
        this.won = false;
        this.message = '';
        this.ranLastRoom = false;
        this.discardPile = []; // Array of cards discarded from rooms (most recent at index 0)
    }

    start() {
        this.logger.clear(); // Clear logs from previous game
        this.logger.logAction('game-start', { timestamp: new Date().toLocaleTimeString() });
        
        this.deck = new Deck();
        this.player = new Player();
        this.gameOver = false;
        this.won = false;
        this.message = `Welcome to Scoundrel! Survive all ${GAME_CONSTANTS.DECK_SIZE} cards with HP > 0.`;
        this.ranLastRoom = false;
        this.discardPile = [];
        
        this.logger.logStatusUpdate('game-start', {
            roomNumber: 0,
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            deckSize: this.deck.cards.length
        });
        
        this.enterNextRoom();
    }

    discardCard(card) {
        // Add card to discard pile (most recent at front)
        this.discardPile.unshift(card);
        this.logger.logCardMovement(card, 'play', 'discard-pile', 'processed', {
            deckRemaining: this.deck.cards.length,
            discardCount: this.discardPile.length
        });
    }

    /**
     * Get formatted card progress message
     * @param {number} processed - Number of cards processed
     * @param {boolean} isFinalRoom - Whether this is the final room
     * @returns {string} Formatted progress message
     */
    getCardProgressMessage(processed, isFinalRoom) {
        const cardsToProcess = isFinalRoom 
            ? this.currentRoom.cards.length 
            : GAME_CONSTANTS.CARDS_TO_INTERACT;
        const remaining = cardsToProcess - processed;
        return `\n(${processed}/${cardsToProcess} cards processed, ${remaining} remaining)`;
    }

    enterNextRoom() {
        if (this.gameOver) return;

        // Before moving to next room, discard remaining cards from previous room
        if (this.currentRoom && this.currentRoom.roomComplete) {
            this.logger.logAction('room-exit', { roomNumber: this.player.roomNumber });
            
            // Room was completed - discard remaining cards that weren't processed or carried over
            // First determine which card will be carried over (if not fleeing)
            const carryOverIndex = !this.ranLastRoom ? this.currentRoom.cards.findIndex((_, i) => !this.currentRoom.processedIndices.includes(i)) : -1;
            
            this.currentRoom.cards.forEach((card, index) => {
                // Skip the carried-over card (unprocessed card from a successful room completion)
                if (index === carryOverIndex) {
                    this.logger.logCardMovement(card, `room-${this.player.roomNumber}[${index}]`, `room-${this.player.roomNumber + 1}[${index}]`, 'carried-over', {
                        reason: 'unprocessed card carried to next room'
                    });
                    return;
                }
                // Skip already processed cards (monsters and potions were discarded when processed)
                if (this.currentRoom.processedIndices.includes(index)) {
                    return;
                }
                // Skip currently equipped weapon (it's in play, not discarded)
                if (card.isWeapon() && card === this.player.equippedWeapon) {
                    return;
                }
                // Discard remaining cards (typically only the 4th card after flee)
                this.logger.logCardMovement(card, `room-${this.player.roomNumber}[${index}]`, 'discard-pile', 'auto-discard', {
                    reason: 'room exited, card not selected or carried',
                    deckRemaining: this.deck.cards.length
                });
                this.discardCard(card);
            });
        }

        this.player.roomNumber += 1;
        this.player.resetRoomState();

        if (this.deck.isEmpty()) {
            this.gameOver = true;
            this.won = true;
            this.message = `🏆 VICTORY! You survived all rooms with ${this.player.hp} HP remaining!`;
            this.gameState = GAME_STATES.GAME_OVER;
            
            this.logger.logStatusUpdate('victory', {
                roomNumber: this.player.roomNumber,
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                deckSize: 0
            });
            return;
        }

        // Determine room cards: carry over the unprocessed card from previous room if available
        // But NOT if we just fled (ranLastRoom is already true at this point)
        let roomCards;
        let carryOverCard = null;
        let carryOverIndex = -1;
        
        if (!this.ranLastRoom && this.currentRoom) {
            // Only carry over if we didn't just flee and there's a previous room
            // Find the unprocessed card from the previous room
            carryOverIndex = this.currentRoom.cards.findIndex((_, i) => !this.currentRoom.processedIndices.includes(i));
            if (carryOverIndex !== -1) {
                carryOverCard = this.currentRoom.cards[carryOverIndex];
                // Try to draw 3 new cards (may get fewer if deck is nearly depleted)
                const newCards = this.deck.draw(3);
                const cardsDrawnCount = newCards.length;
                
                // Build new room with carried card in same position, filled with new cards
                roomCards = [];
                let newCardIndex = 0;
                for (let i = 0; i < 4; i++) {
                    if (i === carryOverIndex) {
                        roomCards[i] = carryOverCard;
                    } else if (newCardIndex < newCards.length) {
                        roomCards[i] = newCards[newCardIndex++];
                    }
                    // If we run out of new cards, don't add anything (room will have fewer than 4)
                }
                // Remove undefined entries so room only contains actual cards
                roomCards = roomCards.filter(card => card !== undefined);
                
                this.logger.logAction('room-draw', {
                    roomNumber: this.player.roomNumber,
                    cardsDrawn: cardsDrawnCount,
                    cardsCarriedOver: 1,
                    newCards: newCards.map(c => c.toString()).join(', '),
                    carriedCard: carryOverCard.toString()
                });
            } else {
                // No unprocessed card to carry over, draw as many as available (up to 4)
                roomCards = this.deck.draw(4);
                
                this.logger.logAction('room-draw', {
                    roomNumber: this.player.roomNumber,
                    cardsDrawn: roomCards.length,
                    cardsCarriedOver: 0,
                    newCards: roomCards.map(c => c.toString()).join(', ')
                });
            }
        } else {
            // Draw as many cards as available (up to 4) if this is the first room or if we just fled
            roomCards = this.deck.draw(4);
            
            this.logger.logAction('room-draw', {
                roomNumber: this.player.roomNumber,
                cardsDrawn: roomCards.length,
                cardsCarriedOver: 0,
                newCards: roomCards.map(c => c.toString()).join(', '),
                context: this.ranLastRoom ? 'after-flee' : 'first-room'
            });
        }
        
        this.currentRoom = new Room(roomCards);
        
        // Log room entry
        this.logger.logStatusUpdate('room-advance', {
            roomNumber: this.player.roomNumber,
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            deckSize: this.deck.cards.length,
            discardSize: this.discardPile.length
        });
        
        // If player fled last room, they must stay this room (auto-stay, no chooser shown)
        if (this.ranLastRoom) {
            this.currentRoom.decidedToStay = true;
            this.gameState = GAME_STATES.CARD_INTERACTION;
            this.message = `Room ${this.player.roomNumber}: You drew 4 cards.\n⚠️ You fled last room - you cannot flee again!`;
            
            console.log('🚪 FORCED STAY (fled last room):', {
                roomNumber: this.player.roomNumber,
                cardsInRoom: this.currentRoom.cards.map(c => c.toString()).join(', '),
                hp: this.player.hp,
                weapon: this.player.equippedWeapon ? this.player.equippedWeapon.toString() : 'none'
            });
            
            this.logger.logStateTransition('room-exit', 'card-interaction', 'forced-stay-after-flee');
        } else {
            this.gameState = GAME_STATES.ROOM_DECISION;
            const carryMessage = carryOverCard ? `\n♻️ Carried over: ${carryOverCard.getName()}` : '';
            this.message = `Room ${this.player.roomNumber}: You drew 4 cards.${carryMessage}`;
            
            console.log('💬 ROOM DECISION:', {
                roomNumber: this.player.roomNumber,
                cardsInRoom: this.currentRoom.cards.map(c => c.toString()).join(', '),
                carriedOver: carryOverCard ? carryOverCard.toString() : 'none',
                canFlee: !this.ranLastRoom && !this.currentRoom.isFinalRoom,
                hp: this.player.hp,
                weapon: this.player.equippedWeapon ? this.player.equippedWeapon.toString() : 'none'
            });
        }
    }

    fleeRoom() {
        // Validate state
        if (!this.currentRoom) {
            this.message = '✗ No room to flee from!';
            console.log('❌ fleeRoom() rejected: No current room');
            return false;
        }
        
        if (this.ranLastRoom) {
            this.message = '⚠️ Cannot flee twice in a row! You must face this room.';
            this.logger.logAction('flee-rejected', {
                reason: 'fled-last-room',
                roomNumber: this.player.roomNumber
            });
            console.log('❌ fleeRoom() rejected: Already fled last room');
            return false;
        }

        // Cannot flee a final room (fewer than 4 cards)
        if (this.currentRoom.isFinalRoom) {
            this.message = '⚠️ Cannot flee the final room! You must face all remaining cards.';
            this.logger.logAction('flee-rejected', {
                reason: 'final-room',
                roomNumber: this.player.roomNumber
            });
            console.log('❌ fleeRoom() rejected: Final room with', this.currentRoom.cards.length, 'cards');
            return false;
        }

        console.log('💨 FLEE ACTION:', {
            roomNumber: this.player.roomNumber,
            cardsInRoom: this.currentRoom.cards.map(c => c.toString()).join(', '),
            deckBefore: this.deck.remaining(),
            hp: this.player.hp
        });

        // Shuffle the cards and put to bottom of deck
        const fleedCards = [...this.currentRoom.cards];
        const cardList = fleedCards.map(c => c.toString()).join(', ');
        shuffleArray(fleedCards);
        this.deck.pushToBottom(fleedCards);
        this.ranLastRoom = true;

        const cardCount = fleedCards.length;
        this.message = `💨 You fled the room! The ${cardCount} cards shuffle to the bottom of the deck.`;
        
        this.logger.logAction('flee', {
            roomNumber: this.player.roomNumber,
            cardsShuffledToBottom: cardList,
            newDeckSize: this.deck.cards.length,
            hp: this.player.hp
        });
        
        console.log('✅ Flee successful:', {
            cardsShuffled: cardList,
            deckAfter: this.deck.remaining(),
            ranLastRoom: this.ranLastRoom
        });
        
        this.enterNextRoom();
        return true;
    }

    selectAndProcessCard(cardIndex) {
        // Validate current room exists
        if (!this.currentRoom) {
            this.message = '✗ No room in progress!';
            console.log('❌ selectCard rejected: No current room');
            return false;
        }

        // Validate card index
        if (cardIndex < 0 || cardIndex >= this.currentRoom.cards.length) {
            this.message = '✗ Invalid card selection!';
            console.log('❌ selectCard rejected: Invalid index', cardIndex);
            return false;
        }

        // Check if already processed
        if (this.currentRoom.processedIndices.includes(cardIndex)) {
            this.message = '✗ You already interacted with that card!';
            console.log('❌ selectCard rejected: Card already processed', cardIndex);
            return false;
        }

        const card = this.currentRoom.cards[cardIndex];
        console.log('\n🎴 CARD SELECTED:', {
            cardIndex: cardIndex,
            card: card.toString(),
            type: card.getType(),
            roomNumber: this.player.roomNumber,
            processedCount: this.currentRoom.processedIndices.length,
            totalCards: this.currentRoom.cards.length
        });

        // If it's a monster, show combat choice instead of immediately fighting
        if (card.isMonster()) {
            this.currentRoom.selectedMonsterIndex = cardIndex;
            this.gameState = GAME_STATES.COMBAT_CHOICE;
            this.message = `You selected ${card.getName()}. Choose how to fight:`;
            
            const canUseWeapon = this.player.equippedWeapon && 
                (this.player.weaponMaxMonsterValue === null || card.rank <= this.player.weaponMaxMonsterValue);
            
            console.log('⚔️ COMBAT CHOICE:', {
                monster: card.toString(),
                monsterValue: card.rank,
                weapon: this.player.equippedWeapon ? this.player.equippedWeapon.toString() : 'none',
                weaponValue: this.player.equippedWeapon ? this.player.equippedWeapon.rank : 0,
                weaponMaxMonster: this.player.weaponMaxMonsterValue || 'unlimited',
                canUseWeapon: canUseWeapon,
                barehandedDamage: card.rank,
                weaponDamage: this.player.equippedWeapon ? Math.max(0, card.rank - this.player.equippedWeapon.rank) : card.rank
            });
            
            this.logger.logAction('select-card', {
                cardIndex,
                card: card.toString(),
                cardType: 'monster',
                roomNumber: this.player.roomNumber
            });
            
            return true;
        }

        // For non-monsters, process immediately
        this.message = '';

        // Process weapons and potions
        let oldWeapon = null;
        if (card.isWeapon()) {
            console.log('⚔️ WEAPON EQUIPPED:', {
                oldWeapon: this.player.equippedWeapon ? this.player.equippedWeapon.toString() : 'none',
                oldMaxMonster: this.player.weaponMaxMonsterValue || 'unlimited',
                newWeapon: card.toString(),
                weaponValue: card.rank
            });
            
            oldWeapon = this.player.equippedWeapon; // Capture old weapon before replacing
            this.player.equipWeapon(card);
            const oldWeaponName = oldWeapon ? oldWeapon.getName() : 'nothing';
            this.message += `🔫 Equipped ${card.getName()} (was ${oldWeaponName})`;
            
            this.logger.logAction('equip-weapon', {
                newWeapon: card.toString(),
                oldWeapon: oldWeapon ? oldWeapon.toString() : null,
                cardIndex,
                roomNumber: this.player.roomNumber
            });
            
            // If there was an old weapon, discard it immediately
            if (oldWeapon) {
                this.logger.logCardMovement(oldWeapon, 'equipped-slot', 'discard-pile', 'replaced', {
                    newWeapon: card.toString()
                });
                this.discardCard(oldWeapon);
            }
            // New weapon goes to equipped slot, not discarded
        } else if (card.isPotion()) {
            if (!this.player.usedPotionThisRoom) {
                const healing = card.getValue();
                const hpBefore = this.player.hp;
                this.player.heal(healing);
                this.player.usedPotionThisRoom = true;
                
                console.log('🧪 POTION CONSUMED:', {
                    potion: card.toString(),
                    potionValue: card.rank,
                    hpBefore: hpBefore,
                    hpAfter: this.player.hp,
                    actualHeal: this.player.hp - hpBefore,
                    maxHp: this.player.maxHp
                });
                
                this.message += `🧪 Drank potion: +${healing} HP → ${this.player.hp}/${this.player.maxHp}`;
                
                this.logger.logAction('use-potion', {
                    potion: card.toString(),
                    healAmount: healing,
                    hpBefore: this.player.hp - healing,
                    hpAfter: this.player.hp,
                    cardIndex,
                    roomNumber: this.player.roomNumber
                });
            } else {
                console.log('❌ POTION IGNORED:', {
                    potion: card.toString(),
                    reason: 'Already drank potion this room'
                });
                
                this.message += `⚠️ Already used a potion this room, ${card.getName()} has no effect`;
                
                this.logger.logAction('use-potion-rejected', {
                    potion: card.toString(),
                    reason: 'already-used-potion',
                    cardIndex,
                    roomNumber: this.player.roomNumber
                });
            }
            // Potions are immediately discarded
            this.logger.logCardMovement(card, `room-${this.player.roomNumber}[${cardIndex}]`, 'discard-pile', 'potion-consumed', {
                healingProvided: card.getValue()
            });
            this.discardCard(card);
        }

        // Mark card as processed
        this.currentRoom.processedIndices.push(cardIndex);
        const processed = this.currentRoom.processedIndices.length;
        
        // Check if all interaction cards have been processed
        const remaining = this.checkAndCompleteRoom();
        
        if (remaining === 0) {
            // All required cards processed - mark room as complete
            // Remaining card(s) will be discarded when entering next room
            this.message += `\n\nRoom complete!`;
            this.message += `\nStatus: ${this.player.hp}/${this.player.maxHp} HP | Deck: ${this.deck.remaining()} cards`;
            this.gameState = GAME_STATES.ROOM_COMPLETE;
        } else {
            this.message += this.getCardProgressMessage(processed, this.currentRoom.isFinalRoom);
            this.gameState = GAME_STATES.CARD_INTERACTION;
        }

        return true;
    }

    processCombatChoice(useWeapon) {
        // Validate state before processing
        if (!this.currentRoom) {
            this.message = '✗ No room in progress!';
            console.log('❌ processCombatChoice rejected: No current room');
            return false;
        }
        if (this.currentRoom.selectedMonsterIndex === null) {
            this.message = '✗ No monster selected for combat!';
            console.log('❌ processCombatChoice rejected: No monster selected');
            return false;
        }

        const monsterIndex = this.currentRoom.selectedMonsterIndex;
        const card = this.currentRoom.cards[monsterIndex];
        
        console.log('⚔️ COMBAT RESOLUTION:', {
            method: useWeapon ? 'weapon' : 'barehanded',
            monster: card.toString(),
            monsterValue: card.rank
        });
        
        // Clear the selected monster
        this.currentRoom.selectedMonsterIndex = null;

        this.message = '';

        if (useWeapon) {
            this.fightMonster(card, true); // true = use weapon
        } else {
            this.fightMonster(card, false); // false = barehanded
        }

        // Check if player died in combat
        if (this.player.hp < 1) {
            this.gameOver = true;
            this.won = false;
            this.message += `\n\n💀 You were defeated!`;
            this.gameState = GAME_STATES.GAME_OVER;
            
            this.logger.logStatusUpdate('defeat', {
                roomNumber: this.player.roomNumber,
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                killedBy: card.toString()
            });
            
            return true;
        }

        // Monster is immediately discarded after combat
        this.logger.logCardMovement(card, `room-${this.player.roomNumber}[${monsterIndex}]`, 'discard-pile', 'defeated-in-combat', {
            hpAfter: this.player.hp,
            weaponUsed: useWeapon && this.player.equippedWeapon ? this.player.equippedWeapon.toString() : 'barehanded'
        });
        this.discardCard(card);

        // Mark card as processed
        this.currentRoom.processedIndices.push(monsterIndex);
        const processed = this.currentRoom.processedIndices.length;
        
        // Check if all interaction cards have been processed
        const remaining = this.checkAndCompleteRoom();

        // Always show processed count
        this.message += this.getCardProgressMessage(processed, this.currentRoom.isFinalRoom);
        
        // Stay in card-interaction to show the progress
        this.gameState = GAME_STATES.CARD_INTERACTION;
        
        // If all interaction cards have been processed, update state
        if (remaining === 0) {
            // All required cards processed - mark room as complete
            // Remaining card(s) will be discarded when entering next room
            this.currentRoom.roomComplete = true;
            this.ranLastRoom = false;
            
            console.log('✅ ROOM COMPLETE:', {
                roomNumber: this.player.roomNumber,
                cardsProcessed: this.currentRoom.processedIndices.length,
                hp: this.player.hp,
                deckRemaining: this.deck.remaining(),
                discardPile: this.discardPile.length,
                ranLastRoom: this.ranLastRoom
            });
            
            this.logger.logAction('room-complete', {
                roomNumber: this.player.roomNumber,
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                deckRemaining: this.deck.remaining(),
                discardCount: this.discardPile.length
            });
        }

        return true;
    }

    fightMonster(card, useWeapon = true) {
        const monsterValue = card.getValue();
        const canUseWeapon = this.player.canUseWeaponOnMonster(monsterValue);
        
        // Determine if we're actually using weapon (player chose AND weapon is available)
        const actuallyUseWeapon = useWeapon && canUseWeapon;

        if (!actuallyUseWeapon) {
            // Fight barehanded
            const damage = monsterValue;
            const hpBefore = this.player.hp;
            this.player.takeDamage(damage);
            this.message += `⚔️ ${card.getName()} (${monsterValue}) barehanded → ${damage} dmg (${this.player.hp}/${this.player.maxHp})`;
            
            this.logger.logCombat(card, 'barehanded', {
                monsterValue,
                weaponValue: 0,
                damage,
                hpBefore,
                hpAfter: this.player.hp
            });
        } else if (this.player.equippedWeapon) {
            // Fight with weapon
            const weaponValue = this.player.getWeaponValue();
            const damage = Math.max(0, monsterValue - weaponValue);
            const hpBefore = this.player.hp;
            const degradeBefore = this.player.weaponMaxMonsterValue;
            
            this.player.takeDamage(damage);
            this.player.updateWeaponMaxMonsterValue(card);
            
            const degradeAfter = this.player.weaponMaxMonsterValue;
            const weaponDegraded = degradeBefore !== null && degradeAfter < degradeBefore;
            
            this.message += `⚔️ ${card.getName()} (${monsterValue}) vs ${this.player.equippedWeapon.getName()} (${weaponValue}) → ${damage} dmg (${this.player.hp}/${this.player.maxHp})`;
            
            this.logger.logCombat(card, 'weapon', {
                monsterValue,
                weaponName: this.player.equippedWeapon.toString(),
                weaponValue,
                damage,
                hpBefore,
                hpAfter: this.player.hp
            });
            
            if (weaponDegraded) {
                this.logger.logWeaponChange(this.player.equippedWeapon, 'degraded', {
                    newMax: degradeAfter,
                    monsterValue,
                    previousMax: degradeBefore
                });
            }
        } else {
            // No weapon - fight barehanded
            const damage = monsterValue;
            const hpBefore = this.player.hp;
            this.player.takeDamage(damage);
            this.message += `⚔️ ${card.getName()} (${monsterValue}) barehanded → ${damage} dmg (${this.player.hp}/${this.player.maxHp})`;
            
            this.logger.logCombat(card, 'barehanded', {
                monsterValue,
                weaponValue: 0,
                damage,
                hpBefore,
                hpAfter: this.player.hp
            });
        }
    }

    getPlayerStatus() {
        // Discard count is simply the size of the discard pile
        // Accounting: Deck + Discard + Room cards + Equipped weapon = 44 total
        const discardCount = this.discardPile.length;
        
        // Can't flee if: already fled last room OR if this is a final room with fewer than 4 cards
        const canRun = !this.ranLastRoom && (!this.currentRoom || !this.currentRoom.isFinalRoom);
        
        return {
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            room: this.player.roomNumber,
            weapon: this.player.equippedWeapon ? this.player.equippedWeapon.getName() : 'None',
            weaponMaxValue: this.player.weaponMaxMonsterValue,
            weaponDefeatedMonsters: this.player.weaponDefeatedMonsters,
            deckRemaining: this.deck.remaining(),
            discardCount: discardCount,
            canRun: canRun
        };
    }

    getRoomCards() {
        return this.currentRoom ? this.currentRoom.cards.map(c => ({
            suit: c.suit,
            rank: c.rank,
            name: c.getName(),
            getType: () => c.getType(),
            toString: c.toString()
        })) : [];
    }

    /**
     * Helper method to check if room completion conditions are met
     * Determines if all required cards have been processed and marks room as complete
     * Returns the number of remaining cards that need to be processed (0 = complete)
     */
    checkAndCompleteRoom() {
        if (!this.currentRoom) return -1;
        
        const processed = this.currentRoom.processedIndices.length;
        
        // Determine how many cards need to be processed for this room
        // Normal room: 3 cards. Final room: all cards in the room
        const cardsToProcess = this.currentRoom.isFinalRoom 
            ? this.currentRoom.cards.length 
            : GAME_CONSTANTS.CARDS_TO_INTERACT;
        const remaining = cardsToProcess - processed;

        // If all interaction cards have been processed, mark room as complete
        if (remaining === 0) {
            this.currentRoom.roomComplete = true;
            this.ranLastRoom = false;
            
            this.logger.logAction('room-complete', {
                roomNumber: this.player.roomNumber,
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                deckRemaining: this.deck.remaining(),
                discardCount: this.discardPile.length
            });
        }
        
        return remaining;
    }

    getDiscardPile() {
        // Return discard pile from most recent to oldest
        return this.discardPile.map(c => ({
            suit: c.suit,
            rank: c.rank,
            name: c.getName(),
            toString: c.toString()
        }));
    }

    getGameOverStats() {
        return {
            won: this.won,
            finalHp: this.player.hp,
            roomsCompleted: this.player.roomNumber,
            weaponEquipped: this.player.equippedWeapon ? this.player.equippedWeapon.getName() : 'None'
        };
    }
}

/**
 * GameManager - Singleton pattern for managing the global game instance
 * Ensures type-safe access to the game and prevents uninitialized access
 */
class GameManager {
    static instance = null;

    /**
     * Initialize a new game
     */
    static initialize() {
        try {
            GameManager.instance = new Game();
            GameManager.instance.start();
            console.log('✓ Game initialized and started');
            return GameManager.instance;
        } catch (error) {
            console.error('Error initializing game:', error);
            throw error;
        }
    }

    /**
     * Get the current game instance
     */
    static getInstance() {
        if (!GameManager.instance) {
            throw new Error('Game not initialized. Call GameManager.initialize() first.');
        }
        return GameManager.instance;
    }

    /**
     * Check if a game is currently active
     */
    static isInitialized() {
        return GameManager.instance !== null;
    }

    /**
     * Reset the game instance (for cleanup)
     */
    static reset() {
        GameManager.instance = null;
    }
}

// Legacy function for backward compatibility
function getGame() {
    return GameManager.getInstance();
}

// Legacy function for backward compatibility
function newGame() {
    return GameManager.initialize();
}
