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
 * Utility function - Fisher-Yates shuffle
 * Shuffles array in-place
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
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
 * Card class - represents a single playing card
 */
class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    getValue() {
        return this.rank;
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

    toString() {
        return `${this.suit} ${RankNames[this.rank]}`;
    }
}

/**
 * Deck class - manages the 44-card deck
 */
class Deck {
    constructor() {
        this.cards = [];
        this.initializeDeck();
        this.shuffle();
    }

    initializeDeck() {
        // All Black cards (Spades/Clubs 2-Ace) = Monsters (26 cards)
        for (let rank = GAME_CONSTANTS.MIN_RANK; rank <= GAME_CONSTANTS.MAX_RANK; rank++) {
            this.cards.push(new Card(Suit.SPADES, rank));
            this.cards.push(new Card(Suit.CLUBS, rank));
        }
        // All Diamonds (2-10) = Weapons (9 cards)
        for (let rank = GAME_CONSTANTS.MIN_RANK; rank <= GAME_CONSTANTS.WEAPON_MAX_RANK; rank++) {
            this.cards.push(new Card(Suit.DIAMONDS, rank));
        }
        // All Hearts (2-10) = Potions (9 cards)
        for (let rank = GAME_CONSTANTS.MIN_RANK; rank <= GAME_CONSTANTS.WEAPON_MAX_RANK; rank++) {
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
    }

    isAlive() {
        return this.hp > 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    getWeaponValue() {
        return this.equippedWeapon ? this.equippedWeapon.getValue() : 0;
    }

    equipWeapon(card) {
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
        if (cards.length !== GAME_CONSTANTS.CARDS_PER_ROOM) {
            throw new Error(`Room must have exactly ${GAME_CONSTANTS.CARDS_PER_ROOM} cards`);
        }
        this.cards = cards; // Cards drawn this room
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
        this.deck = null;
        this.player = null;
        this.currentRoom = null;
        this.gameState = 'menu'; // menu, room-decision, card-interaction, combat-choice, room-complete, game-over
        this.gameOver = false;
        this.won = false;
        this.message = '';
        this.ranLastRoom = false;
    }

    start() {
        this.deck = new Deck();
        this.player = new Player();
        this.gameOver = false;
        this.won = false;
        this.message = `Welcome to Scoundrel! Survive all ${GAME_CONSTANTS.DECK_SIZE} cards with HP > 0.`;
        this.ranLastRoom = false;
        this.enterNextRoom();
    }

    enterNextRoom() {
        if (this.gameOver) return;

        this.player.roomNumber += 1;
        this.player.resetRoomState();

        if (this.deck.isEmpty()) {
            this.gameOver = true;
            this.won = true;
            this.message = `🏆 VICTORY! You survived all rooms with ${this.player.hp} HP remaining!`;
            this.gameState = 'game-over';
            return;
        }

        const roomCards = this.deck.draw(4);
        this.currentRoom = new Room(roomCards);
        
        // If player fled last room, they must stay this room (auto-stay, no chooser shown)
        if (this.ranLastRoom) {
            this.currentRoom.decidedToStay = true;
            this.gameState = 'card-interaction';
            this.message = `Room ${this.player.roomNumber}: You drew 4 cards.\n⚠️ You fled last room - you cannot flee again!`;
        } else {
            this.gameState = 'room-decision';
            this.message = `Room ${this.player.roomNumber}: You drew 4 cards.`;
        }
    }

    fleeRoom() {
        // Validate state
        if (!this.currentRoom) {
            this.message = '✗ No room to flee from!';
            return false;
        }
        
        if (this.ranLastRoom) {
            this.message = '⚠️ Cannot flee twice in a row! You must face this room.';
            return false;
        }

        // Shuffle the cards and put to bottom of deck
        const fleedCards = [...this.currentRoom.cards];
        shuffleArray(fleedCards);
        this.deck.pushToBottom(fleedCards);
        this.ranLastRoom = true;

        this.message = '💨 You fled the room! The 4 cards shuffle to the bottom of the deck.';
        this.enterNextRoom();
        return true;
    }

    selectAndProcessCard(cardIndex) {
        // Validate current room exists
        if (!this.currentRoom) {
            this.message = '✗ No room in progress!';
            return false;
        }

        // Validate card index
        if (cardIndex < 0 || cardIndex >= this.currentRoom.cards.length) {
            this.message = '✗ Invalid card selection!';
            return false;
        }

        // Check if already processed
        if (this.currentRoom.processedIndices.includes(cardIndex)) {
            this.message = '✗ You already interacted with that card!';
            return false;
        }

        const card = this.currentRoom.cards[cardIndex];

        // If it's a monster, show combat choice instead of immediately fighting
        if (card.isMonster()) {
            this.currentRoom.selectedMonsterIndex = cardIndex;
            this.gameState = 'combat-choice';
            this.message = `You selected ${card.getName()}. Choose how to fight:`;
            return true;
        }

        // For non-monsters, process immediately
        this.message = '';

        // Process weapons and potions
        if (card.isWeapon()) {
            const oldWeapon = this.player.equippedWeapon ? this.player.equippedWeapon.getName() : 'nothing';
            this.player.equipWeapon(card);
            this.message += `🔫 Equipped ${card.getName()} (was ${oldWeapon})`;
        } else if (card.isPotion()) {
            if (!this.player.usedPotionThisRoom) {
                const healing = card.getValue();
                this.player.heal(healing);
                this.player.usedPotionThisRoom = true;
                this.message += `🧪 Drank potion: +${healing} HP → ${this.player.hp}/${this.player.maxHp}`;
            } else {
                this.message += `⚠️ Already used a potion this room, ${card.getName()} has no effect`;
            }
        }

        // Mark card as processed
        this.currentRoom.processedIndices.push(cardIndex);
        const processed = this.currentRoom.processedIndices.length;
        const remaining = GAME_CONSTANTS.CARDS_TO_INTERACT - processed;

        // Check if all interaction cards have been processed
        if (remaining === 0) {
            // Find the unprocessed card
            const unprocessedCard = this.currentRoom.cards.find((_, i) => !this.currentRoom.processedIndices.includes(i));
            this.message += `\n\nRoom complete! Discarded: ${unprocessedCard.getName()}`;
            this.message += `\nStatus: ${this.player.hp}/${this.player.maxHp} HP | Deck: ${this.deck.remaining()} cards`;
            this.gameState = 'room-complete';
            // Reset the "fled last room" flag since we completed this room normally
            this.ranLastRoom = false;
        } else {
            this.message += `\n(${processed} cards processed, ${remaining} remaining)`;
            this.gameState = 'card-interaction';
        }

        return true;
    }

    processCombatChoice(useWeapon) {
        // Validate state before processing
        if (!this.currentRoom) {
            this.message = '✗ No room in progress!';
            return false;
        }
        if (this.currentRoom.selectedMonsterIndex === null) {
            this.message = '✗ No monster selected for combat!';
            return false;
        }

        const monsterIndex = this.currentRoom.selectedMonsterIndex;
        const card = this.currentRoom.cards[monsterIndex];
        
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
            this.gameState = 'game-over';
            return true;
        }

        // Mark card as processed
        this.currentRoom.processedIndices.push(monsterIndex);
        const processed = this.currentRoom.processedIndices.length;
        const remaining = GAME_CONSTANTS.CARDS_TO_INTERACT - processed;

        // Always show processed count
        this.message += `\n(${processed} cards processed, ${remaining} remaining)`;
        
        // Stay in card-interaction to show the progress
        this.gameState = 'card-interaction';
        
        // If all interaction cards have been processed, prepare room complete info
        if (remaining === 0) {
            // This info will be shown when transitioning to room-complete
            const unprocessedCard = this.currentRoom.cards.find((_, i) => !this.currentRoom.processedIndices.includes(i));
            this.currentRoom.discardedCard = unprocessedCard;
            this.currentRoom.roomComplete = true;
            this.ranLastRoom = false;
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
            this.player.takeDamage(damage);
            this.message += `⚔️ ${card.getName()} (${monsterValue}) barehanded → ${damage} dmg (${this.player.hp}/${this.player.maxHp})`;
        } else if (this.player.equippedWeapon) {
            // Fight with weapon
            const weaponValue = this.player.getWeaponValue();
            const damage = Math.max(0, monsterValue - weaponValue);
            this.player.takeDamage(damage);
            this.player.updateWeaponMaxMonsterValue(card);
            this.message += `⚔️ ${card.getName()} (${monsterValue}) vs ${this.player.equippedWeapon.getName()} (${weaponValue}) → ${damage} dmg (${this.player.hp}/${this.player.maxHp})`;
        } else {
            // No weapon - fight barehanded
            const damage = monsterValue;
            this.player.takeDamage(damage);
            this.message += `⚔️ ${card.getName()} (${monsterValue}) barehanded → ${damage} dmg (${this.player.hp}/${this.player.maxHp})`;
        }
    }

    getPlayerStatus() {
        return {
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            room: this.player.roomNumber,
            weapon: this.player.equippedWeapon ? this.player.equippedWeapon.getName() : 'None',
            weaponMaxValue: this.player.weaponMaxMonsterValue,
            weaponDefeatedMonsters: this.player.weaponDefeatedMonsters,
            deckRemaining: this.deck.remaining(),
            canRun: !this.ranLastRoom
        };
    }

    getRoomCards() {
        return this.currentRoom ? this.currentRoom.cards.map(c => ({
            suit: c.suit,
            rank: c.rank,
            name: c.getName(),
            toString: c.toString()
        })) : [];
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

// Global game instance
let gameInstance = null;

function getGame() {
    if (!gameInstance) {
        gameInstance = new Game();
    }
    return gameInstance;
}

function newGame() {
    gameInstance = new Game();
    gameInstance.start();
    return gameInstance;
}
