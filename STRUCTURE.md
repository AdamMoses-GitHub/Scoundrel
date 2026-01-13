# Scoundrel Game - Complete Understanding V4

## Architecture & Code Overview

### Project Structure
```
/Scoundrel
├── index.html          (Page structure & DOM layout)
├── js/game.js          (Core game logic & state management)
├── js/ui.js            (User interface rendering & event handlers)
└── css/style.css       (Dark fantasy theme styling)
```

### Three-Layer Architecture

**1. Game Engine (js/game.js)**
- Implements all game rules as classes: `Card`, `Deck`, `Player`, `Room`, `Game`
- Manages game state machine with states: 'menu', 'room-decision', 'card-interaction', 'combat-choice', 'room-complete', 'game-over'
- Handles all calculations: damage, healing, weapon degradation
- Global `gameInstance` variable holds the current game

**2. UI Controller (js/ui.js)**
- Renders game state to HTML
- Listens for user interactions (button clicks, card selections)
- Updates display in response to game state changes
- Maintains `gameLog` array for combat history
- Manages screen transitions and modal popups

**3. DOM & Styling**
- Single HTML page with 5 screen divs (only one `.active` at a time)
- Global color scheme: Dark backgrounds with gold accents
- Real-time stats bar showing HP, room, deck count

---

## Core Game Rules

### 1. The Deck (44 Cards Total)

**Composition:**
- **26 Monsters:** All black cards (Spades 2-Ace, Clubs 2-Ace)
- **9 Weapons:** Diamonds 2-10
- **9 Potions:** Hearts 2-10

**Card Values:**
- Number cards (2-10): Face value
- Jack = 11
- Queen = 12
- King = 13
- Ace = 14

**Code Implementation (game.js - Deck class):**
```javascript
initializeDeck() {
    // Add all Spades & Clubs (2-14) = Monsters
    for (let rank = 2; rank <= 14; rank++) {
        this.cards.push(new Card(Suit.SPADES, rank));
        this.cards.push(new Card(Suit.CLUBS, rank));
    }
    // Add Diamonds (2-10) = Weapons
    for (let rank = 2; rank <= 10; rank++) {
        this.cards.push(new Card(Suit.DIAMONDS, rank));
    }
    // Add Hearts (2-10) = Potions
    for (let rank = 2; rank <= 10; rank++) {
        this.cards.push(new Card(Suit.HEARTS, rank));
    }
}
```

The deck is shuffled using Fisher-Yates algorithm when created, and cards are always drawn from the front.

### 2. Player Starting State

**Initial Stats (Player class constructor):**
- HP: 20 (maximum)
- Equipped Weapon: null (barehanded)
- Potions Used This Room: false
- Room Number: 0

**Persistent Across Rooms:**
- Current HP (damaged carried forward)
- Equipped weapon (persists until replaced)
- Weapon degradation state (tracked as `weaponMaxMonsterValue` and `weaponDefeatedMonsters` array)

**Reset Per Room:**
- `usedPotionThisRoom` flag (set to false at `resetRoomState()`)

### 3. Per-Room Sequence

**PHASE 1: Room Entry & Flee/Stay Decision**
```javascript
// In Game.enterNextRoom()
this.player.roomNumber += 1;
this.player.resetRoomState();

if (this.deck.isEmpty()) {
    this.gameOver = true;
    this.won = true;
    return; // Victory
}

const roomCards = this.deck.draw(4);
this.currentRoom = new Room(roomCards);
this.gameState = 'room-decision';
```

- 4 cards drawn from deck
- Room number incremented
- Player cannot flee if they fled the previous room
- Decision: FLEE or STAY

**PHASE 2: Card Interaction (Only if Staying)**

Player must interact with exactly 3 of the 4 cards:

```javascript
selectAndProcessCard(cardIndex) {
    // Validate and mark card as processed
    this.currentRoom.processedIndices.push(cardIndex);
    
    // Apply card effect
    // - Monster: Show combat choice UI
    // - Weapon: Immediately equip
    // - Potion: Immediately heal (if first potion)
    
    // Check if 3 cards processed
    if (this.currentRoom.processedIndices.length === 3) {
        this.gameState = 'room-complete';
        this.ranLastRoom = false; // Reset flee flag after completing room
    }
}
```

- The 4th unselected card is auto-discarded
- Monster interactions trigger `combat-choice` state (user chooses weapon vs barehanded)
- Weapon/potion interactions apply immediately
- Once 3 cards processed, room is complete

---

## Card Interactions & Mechanics

### Monster Cards (Spades & Clubs)

When player selects a monster, they enter the `combat-choice` state where they decide how to fight:

```javascript
fightMonster(card, useWeapon = true) {
    const monsterValue = card.getValue();
    const weaponValue = this.player.getWeaponValue();
    
    // Calculate damage
    let damage = Math.max(0, monsterValue - weaponValue);
    
    this.player.takeDamage(damage);
    if (useWeapon && this.player.equippedWeapon) {
        this.player.updateWeaponMaxMonsterValue(card);
    }
}
```

**Combat Choices:**
1. **With Weapon:** `damage = max(0, monsterValue - weaponValue)`
   - Weapon is marked as used on this monster value
   - Weapon degradation updates (weapon can only be used on equal or lower monsters going forward)

2. **Barehanded:** `damage = monsterValue`
   - No weapon degradation tracking
   - Takes full monster damage

**Example Combat:**
- Monster 10, Weapon 6 equipped → Damage = 10 - 6 = 4 HP lost
- Monster 4, Weapon 10 equipped → Damage = max(0, 4 - 10) = 0 HP lost
- Monster 8, No weapon → Damage = 8 HP lost

### Weapon Cards (Diamonds 2-10)

**Mechanics:**
```javascript
equipWeapon(card) {
    this.equippedWeapon = card;
    this.weaponMaxMonsterValue = null; // Reset degradation on new weapon
    this.weaponDefeatedMonsters = []; // Clear history
}
```

When you equip a weapon:
- Replaces current weapon immediately
- Resets all degradation tracking
- Only one weapon equipped at a time (no dual wielding)

**Weapon Degradation System:**

The core strategic mechanic. Each weapon tracks the highest monster value it has been used on:

```javascript
canUseWeaponOnMonster(monsterValue) {
    if (!this.equippedWeapon) return false;
    if (this.weaponMaxMonsterValue === null) return true; // Never used yet
    return monsterValue <= this.weaponMaxMonsterValue; // Can only use on equal/lower
}

updateWeaponMaxMonsterValue(card) {
    this.weaponDefeatedMonsters.push({ rank: card.rank, suit: card.suit });
    
    const monsterValue = card.rank;
    if (this.weaponMaxMonsterValue === null) {
        this.weaponMaxMonsterValue = monsterValue;
    } else {
        this.weaponMaxMonsterValue = Math.min(this.weaponMaxMonsterValue, monsterValue);
    }
}
```

**Degradation Examples:**

1. **Single High-Value Use:** Diamond 5 kills Queen (12)
   - `weaponMaxMonsterValue` = 12
   - Can use on any monster ≤ 12 in the future
   - Never degrades further unless a lower monster is encountered

2. **Gradual Degradation:** Diamond 5 used on [Queen 12, then Jack 11, then 7]
   - After Queen: max = 12
   - After Jack: max = min(12, 11) = 11
   - After 7: max = min(11, 7) = 7
   - Can only use on monsters ≤ 7 going forward

3. **Unusable Weapon:** Diamond 2 used on Ace (14), then King (13) appears
   - max value = 14 (locked at highest possible)
   - Can use on King since 13 ≤ 14
   - After using on King: max = min(14, 13) = 13

4. **Weapon Replacement Resets Degradation:** Diamond 5 → Diamond 10
   - Old weapon's history is lost
   - Diamond 10 starts fresh with `weaponMaxMonsterValue = null`
   - Acts like a brand new weapon with no history

**UI Display (weapon-display element):**
- Shows current equipped weapon card
- Lists all monsters defeated by this weapon (sorted descending by rank)
- Last (lowest) monster is highlighted in bold (shows current max value)
- Shows "Unused" if weapon has never been deployed

### Potion Cards (Hearts 2-10)

**Mechanics:**
```javascript
// In selectAndProcessCard()
if (card.isPotion()) {
    if (!this.player.usedPotionThisRoom) {
        const healing = card.getValue();
        this.player.heal(healing); // Capped at maxHp (20)
        this.player.usedPotionThisRoom = true;
    } else {
        // Message: already used potion this room, no effect
    }
}
```

**Rules:**
- Heal amount = card value (2-10 HP)
- Only the **first potion per room** heals
- Subsequent potions in same room have no healing effect but are still "consumed"
- HP cannot exceed max HP (20)

**Strategic Implications:**
- 9 potions total for ~11 rooms (not guaranteed availability)
- One-per-room limit means careful selection
- Multiple potions in a single room might indicate a tough room (but only first heals)
- Potion value varies (2 to 10 HP) - higher value potions are rarer

---

## The Flee Mechanic

**Core Rule:**
Cannot flee twice in a row. If you flee room A, you must stay in room B.

**Implementation:**

```javascript
declareRun() {
    if (this.ranLastRoom) {
        this.message = '⚠️ Cannot flee twice in a row!';
        return false;
    }
    
    // Shuffle 4 cards and put at bottom of deck
    const fleedCards = [...this.currentRoom.cards];
    // Fisher-Yates shuffle
    for (let i = fleedCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fleedCards[i], fleedCards[j]] = [fleedCards[j], fleedCards[i]];
    }
    
    this.deck.pushToBottom(fleedCards); // Cards to bottom of deck
    this.ranLastRoom = true; // Set flag
    this.enterNextRoom(); // Immediately proceed
    return true;
}
```

**Flee Flag Management:**

- `ranLastRoom = true` when player flees
- Checked at start of next room (flee button disabled if true)
- `ranLastRoom = false` when player completes a room normally (after processing 3 cards)
- Resetting allows fleeing again in a future room

**Strategic Impact:**
- Limits consecutive escapes (forces engagement with ~50% of rooms)
- Fleeing resets your position in deck (bad rooms delayed, not eliminated)
- Can strategically flee to reach better weapon/potion distribution later
- Cannot "chain flee" to skip entire deck sections

---

## Win & Lose Conditions

### Victory

```javascript
if (this.deck.isEmpty()) {
    this.gameOver = true;
    this.won = true;
    this.message = `🏆 VICTORY! You survived with ${this.player.hp} HP!`;
    this.gameState = 'game-over';
}
```

- Triggered when deck has no remaining cards to draw
- Must have HP > 0
- Victory is deterministic (not random) if you reach this state
- Shows final HP on victory screen

### Defeat

```javascript
if (this.player.hp < 1) {
    this.gameOver = true;
    this.won = false;
    this.message = `💀 You were defeated!`;
    this.gameState = 'game-over';
}
```

- Triggered when HP drops to 0 or below during combat
- Game ends immediately (no recovery possible)
- Shows defeat screen with room number where you died

---

## Game State Machine

```
START
  ↓
'menu' → Display main menu
  ↓
'room-decision' → Draw 4 cards, show Flee/Stay buttons
  ├─ Flee → Shuffle cards to bottom → Next room (still 'room-decision')
  └─ Stay → 'card-interaction'
      ↓
'card-interaction' → Show 4 cards (clickable), pick 3
  ├─ Click non-monster → Apply effect immediately → Still 'card-interaction'
  ├─ Click monster → 'combat-choice'
  │   ↓
  │ 'combat-choice' → Show weapon vs barehanded options
  │   └─ Choose → Apply damage → 'card-interaction'
  │
  └─ After 3 cards → 'room-complete'
      ↓
'room-complete' → Show room stats, prompt for next room
  ├─ Deck empty → 'game-over' (victory)
  └─ Deck has cards → 'room-decision' (next room)

'game-over' → Show victory/defeat screen
```

**Key State Transitions:**

- Can only reach 'room-decision' at start of new rooms
- 'card-interaction' cycles internally when clicking weapons/potions
- 'combat-choice' is brief (user chooses, then back to 'card-interaction')
- Once 3 cards processed, immediately transition to 'room-complete'
- From 'room-complete', next click advances to next room's 'room-decision'

---

## UI Architecture

### Screen Management

Five screens, only one active at a time (`.active` class):

1. **#mainMenu** - Start/Instructions buttons
2. **#instructions** - Full rules documentation
3. **#gameScreen** - All in-game UI
4. **#gameOverScreen** - Victory/Defeat display
5. Modal for combat log

### Game Screen Layers (All in #gameScreen)

```
┌─ Menu Dropdown (top-right) ─┐
│  ☰ Menu button              │
│  ├─ View Log                │
│  └─ Exit to Menu            │
└─────────────────────────────┘

┌─ Stats Bar (always visible) ─────────────┐
│ Room: 5  |  HP: 12/20  |  Deck: 25       │
└──────────────────────────────────────────┘

┌─ Interaction Counter (only during play) ─┐
│ Interacted with 2 of 3 cards             │
└──────────────────────────────────────────┘

┌─ Game Content (dynamic) ──────────────────┐
│                                            │
│  #roomDecisionContent (Flee/Stay phase)   │
│    or                                     │
│  #cardInteractionContent (interaction)    │
│    or                                     │
│  #roomCompleteContent (room summary)      │
│                                            │
└────────────────────────────────────────────┘

┌─ Weapon Display (sidebar) ──────────────┐
│  Equipped Weapon: 7 of Diamonds         │
│  [Card visual]                          │
│  Defeated: Queen, Jack, 7 (bold)        │
└─────────────────────────────────────────┘
```

### Display Updates (ui.js)

**Main Update Function:**
```javascript
function updateGameDisplay() {
    // 1. Update stats bar (always)
    updateStatsBar();
    
    // 2. Update interaction count line (during gameplay)
    updateInteractionCountLine();
    
    // 3. Log message if exists
    if (game.message) {
        gameLog.push(game.message);
        game.message = '';
    }
    
    // 4. Render based on current state
    switch (game.gameState) {
        case 'room-decision': displayRoomDecision(); break;
        case 'card-interaction': displayCardInteraction(); break;
        case 'combat-choice': updateMonsterDisplay(); break;
        case 'room-complete': displayRoomComplete(); break;
        case 'game-over': displayGameOver(); break;
    }
}
```

This is called after every game state change to refresh the display.

### HP Bar Coloring

```javascript
const hpPercent = (status.hp / status.maxHp);
if (hpPercent < 0.3) {
    hpFill.classList.add('critical'); // Red
} else {
    hpFill.classList.remove('critical'); // Green/Yellow
}
```

- Green: > 60% HP
- Yellow: 30-60% HP
- Red: < 30% HP (critical)

### Card Display in Rooms

**Room Decision Phase:**
- 4 cards shown with suit, rank, and full name
- No interaction, just visual information
- Flee/Stay buttons below

**Card Interaction Phase:**
- 4 cards shown initially
- Processed cards grayed out (opacity 40%)
- Clickable cards have gold border, cursor pointer
- Message shows count: "Processed: 2 of 3"

**Weapon Display:**
- Shows currently equipped weapon card
- Lists defeated monsters (descending order by rank)
- Lowest monster value bolded (shows current max value)
- Shows "No Weapon" if barehanded

---

## Strategic Depth

### Weapon Degradation as Core Strategy

The degradation system creates tension:

1. **Early Game (Rooms 1-3):**
   - Get any weapon quickly (Diamond 2 better than nothing)
   - Weapons have high HP cost if used on high monsters
   - Preferring to avoid high monsters until better weapon acquired

2. **Mid Game (Rooms 4-7):**
   - Upgrade to better weapon when available
   - Manage degradation carefully (don't waste good weapons on weak monsters)
   - Balance between weapon preservation and HP preservation

3. **Late Game (Rooms 8+):**
   - HP increasingly precious (harder to heal)
   - Must have viable weapon for remaining monsters
   - Weapon choices become make-or-break decisions

### Example Degradation Trap

- Get Diamond 3, use immediately on Jack (11): max value = 11
- Now can use on anything ≤ 11
- Queen (12) appears: can't use weapon, must fight barehanded (12 damage)
- This is why upgrading weapons is crucial

### Potion Scarcity

- Only 9 potions distributed among 44 cards
- Roughly 1 potion per 5 rooms
- Saving potions vs using early requires judgment
- Multiple potions in one room might be waste (only first heals)

### Flee Strategy

- Limited to every other room effectively (can't flee twice in a row)
- Use to skip bad room combinations (all high monsters, no weapons)
- Cards return later (not permanently lost)
- Telegraphing upcoming room difficulty is impossible (random deck)

---

## Code Flow Example: Single Card Selection

**User clicks a monster card:**

```javascript
// ui.js: User clicks card
card.addEventListener('click', () => {
    getGame().selectAndProcessCard(cardIndex);
    updateGameDisplay();
});

// game.js: selectAndProcessCard()
selectAndProcessCard(cardIndex) {
    const card = this.currentRoom.cards[cardIndex];
    
    // Monster → show combat choice UI
    if (card.isMonster()) {
        this.currentRoom.selectedMonsterIndex = cardIndex;
        this.gameState = 'combat-choice'; // State change
        return true;
    }
    
    // ... non-monster handling ...
    
    this.currentRoom.processedIndices.push(cardIndex); // Mark processed
}

// ui.js: updateGameDisplay() runs
function updateGameDisplay() {
    // Combat-choice state triggered
    if (game.gameState === 'combat-choice') {
        updateMonsterDisplay(); // Shows weapon vs barehanded buttons
    }
}

// User clicks "Use Weapon" button
processCombatChoice(true) { // useWeapon = true
    const card = this.currentRoom.cards[monsterIndex];
    this.fightMonster(card, true);
    this.gameState = 'card-interaction'; // Back to card selection
}

// ui.js: updateGameDisplay() runs again
// Now shows updated HP and remaining card count
```

---

## Key Implementation Details

### Damage Calculation (Always Safe)
```javascript
const damage = Math.max(0, monsterValue - weaponValue);
this.player.takeDamage(damage);
```
- Prevents negative damage (no healing from over-equipped weapons)
- Used in both weapon and barehanded calculations

### Potion Effect Block
```javascript
if (!this.player.usedPotionThisRoom) {
    this.player.heal(healing);
    this.player.usedPotionThisRoom = true;
} else {
    // No healing, message shows "already used"
}
```
- Flag prevents multiple healings per room
- Flag reset at `enterNextRoom()` / `resetRoomState()`

### Weapon Replacement
```javascript
equipWeapon(card) {
    this.equippedWeapon = card; // Overwrites old weapon
    this.weaponMaxMonsterValue = null; // Degradation reset
    this.weaponDefeatedMonsters = []; // History cleared
}
```
- No stacking or dual wielding
- New weapon has fresh degradation state
- Old weapon data permanently lost

### Deck Bottom Positioning
```javascript
pushToBottom(cards) {
    this.cards.push(...cards); // Appends to end of array
}

// Later, when deck is drawn down:
draw(4) {
    return this.cards.splice(0, 4); // Remove from front
}
```
- Fled cards placed at bottom (higher indices)
- Always drawn from front (lower indices)
- Creates natural queue system

---

## Complete Rule Summary

| Rule | Implementation |
|------|-----------------|
| 44-card deck | 26 monsters, 9 weapons, 9 potions |
| Start with 20 HP | Player.hp = 20, maxHp = 20 |
| Can't flee twice in a row | `ranLastRoom` flag checked before flee |
| Weapons degrade | `weaponMaxMonsterValue` updated after use |
| One potion per room | `usedPotionThisRoom` flag per room |
| Damage can't be negative | `Math.max(0, damage)` formula |
| Weapon replacement resets degradation | Equip sets `weaponMaxMonsterValue = null` |
| 3 cards per room | Must process exactly 3 before room complete |
| Victory = deck empty + HP > 0 | Checked in `enterNextRoom()` |
| Defeat = HP ≤ 0 | Checked in `processCombatChoice()` |

---

## Victory Path Example

**Game Progression:**

**Room 1:** Draw 3♦️(weapon), 8♠️(monster), 6♥️(potion), Jack♣️(monster)
- Stay
- Take weapon (hp 20)
- Use weapon on 8-monster (hp: 20 - (8-3) = 17)
- Use potion (hp: 20)
- Auto-discard Jack
- Status: 20 HP, Diamond 3 (max value: 8)

**Room 2:** Draw King♠️, Queen♦️, Ace♥️, 5♠️
- Stay
- Upgrade to Queen♦️ (hp 20) [weapon max reset]
- Use on King (hp: 20 - (13-12) = 19)
- Use Ace potion (hp: 20)
- Auto-discard 5
- Status: 20 HP, Queen 12 (max value: 13)

**Room 3:** Draw Ace♠️, 7♠️, 2♦️, King♥️
- Flee (Ace too dangerous, weapon max 13 is safe but let's avoid)
- Cards to bottom
- Status: 20 HP, Queen 12 (max value: 13), ranLastRoom = true

**Room 4:** Draw various
- Must stay (fled last room)
- Continue gameplay...
- Eventually deck empties
- If HP > 0: Victory!
- If HP ≤ 0: Defeat

---

## Edge Cases & Special Handling

### Multiple Potions in One Room
- First potion heals fully
- Subsequent potions consumed but don't heal
- Message: "⚠️ Already used a potion this room, [Card] has no effect"
- Still counts toward 3-card interaction limit

### Weapon Locked at Maximum Value
- Diamond 2 used on Ace (14) → max value = 14
- Can use on any remaining monsters (none higher than Ace possible)
- Value persists until weapon replaced

### Weapon Cannot Be Downgraded
- Can equip weaker weapon but this resets degradation
- Old weapon's history lost
- Usually strategically poor (losing a useful weapon)

### Barehanded Combat Option Unavailable
- If weapon's max value < current monster
- UI prevents weapon option (button disabled)
- Must select barehanded
- Message explains "weapon not viable for this monster"

### Deck Shuffle on Flee
- Uses Fisher-Yates algorithm same as initial shuffle
- Fled cards placed in random order at bottom
- Creates some unpredictability in future rooms

---

## Summary

**Scoundrel** is a deck-management roguelike where:

1. **Core Challenge:** Weapon degradation forces strategic combat decisions
2. **Resource Management:** Potions are scarce (9 total), healing is limited
3. **Risk/Reward:** Flee mechanic allows escaping bad rooms but with limitation (can't flee twice)
4. **Progression:** Each room removes cards from play; survive 44 cards to win
5. **Deterministic Luck:** Some games harder based on shuffle, but all games winnable with good strategy

The interplay between weapon degradation, potion scarcity, and the flee limitation creates a rich strategic puzzle where each decision compounds into future consequences.
