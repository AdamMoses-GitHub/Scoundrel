# Scoundrel - Installation & Usage Guide

Complete implementation manual: From zero to power user in 10 minutes.

---

## Feature Recap

This browser-based card game allows you to:

- ⚔️ **Survive a 44-card dungeon** with strategic weapon and potion management
- 🎲 **Make tactical flee/fight decisions** with a "no consecutive fleeing" constraint
- 🔫 **Manage weapon degradation** dynamically as weapons become less effective over time
- 🧪 **Optimize potion usage** under the one-per-room healing rule
- 📊 **Track lifetime statistics** with localStorage persistence
- 🎮 **Play offline** with zero network dependencies

---

## Installation Guide

### Method A: Direct Browser Open (Recommended)

**For instant play with zero setup:**

1. **Download/Clone the repository:**
   ```bash
   git clone [INSERT_GITHUB_URL_HERE]
   cd Scoundrel
   ```

2. **Open in browser:**
   - **Windows:** Double-click `index.html` or run `start index.html`
   - **macOS:** Run `open index.html`
   - **Linux:** Run `xdg-open index.html`

3. **Play immediately** - No build step, no installations, no servers.

**Supported Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

### Method B: Local Web Server (For Development)

**If you need to test service workers, CORS, or advanced features:**

**Python (Built-in on macOS/Linux):**
```bash
cd Scoundrel
python3 -m http.server 8000
# Open http://localhost:8000 in browser
```

**Node.js (If already installed):**
```bash
npx http-server -p 8000
# Open http://localhost:8000
```

**VS Code Live Server Extension:**
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

---

## Usage - Execution

### Launch the Game

Open `index.html` in your browser using any method from Installation section.

You'll see:
- **Main Menu:** Start Game or Instructions buttons
- **Game Interface:** Stats bar, card display, action buttons
- **Persistent Stats:** Automatically saved to localStorage

### Game Controls

| Action | Control | Notes |
|--------|---------|-------|
| Start New Game | Click "🎲 START GAME" | Resets HP to 20, shuffles deck |
| Read Rules | Click "📖 INSTRUCTIONS" | In-game rules reference |
| Flee Room | Click "💨 FLEE" | Disabled if you fled last room |
| Stay in Room | Click "🏃 STAY" | Interact with 3 of 4 cards |
| Select Card | Click on card | Only active in Stay mode |
| Fight Monster | Choose "⚔️ Use Weapon" or "👊 Barehanded" | Appears when monster selected |
| View Stats | Always visible at top | HP, room, deck count |

---

## Usage - Workflows (Scenario Engine)

### Workflow 1: Early Game Weapon Acquisition

**Tool/Feature:** Weapon Equipping System

**Scenario:** You're in Room 1 with 20 HP and no weapon. You draw a low-value weapon (Diamond 3) alongside two monsters.

**Workflow:**
1. **Choose to STAY** (need a weapon to survive)
2. **Click the Diamond 3 card** → Message: "Equipped 3 of Diamonds (was nothing)"
3. **Click a monster card** → Combat choice appears
4. **Choose "⚔️ Use Weapon"** → Damage reduced by 3 (instead of full monster value)
5. **Select remaining card** (weapon or potion if available)
6. **Click "→ NEXT ROOM"** to proceed

**Example Use Case:** You have a 7-value monster. Without the Diamond 3, you'd take 7 damage. With it, you take 4 damage (7 - 3 = 4). Over 10 rooms, this difference compounds—weapon acquisition early is survival-critical.

---

### Workflow 2: Strategic Fleeing Under Constraints

**Tool/Feature:** Flee Mechanic with "No Consecutive Fleeing" Rule

**Scenario:** You've just completed Room 3 after a brutal fight. Room 4 draws two Aces (14 damage each) and you only have a Diamond 6 weapon.

**Workflow:**
1. **Assess the threat:** Two Aces = 28 total damage potential. With Diamond 6, that's still 16 damage minimum ((14-6) + (14-6)).
2. **Check flee eligibility:** Flee button is **enabled** (you stayed in Room 3).
3. **Click "💨 FLEE"** → All 4 cards shuffle to bottom of deck.
4. **Room 5 auto-draws** → Flee button now **disabled** ("Cannot flee twice in a row").
5. **MUST stay in Room 5** regardless of what draws.
6. **After completing Room 5** → Flee becomes available again in Room 6.

**Example Use Case:** You're at 8 HP with a weak weapon. You fled Room 7 (bad draw). Room 8 draws three monsters. You CANNOT flee—must use potions strategically or accept defeat. This forces ~50% room engagement, preventing infinite deck cycling.

---

### Workflow 3: Weapon Degradation Management

**Tool/Feature:** Dynamic Weapon Degradation System

**Scenario:** You equipped a Diamond 8 (weapon value 8) and are facing a series of monsters: King (13), then a 6, then a 10.

**Workflow:**
1. **Fight King (13) with Diamond 8:**
   - Damage: 13 - 8 = 5 HP lost
   - **Weapon degrades:** Max usable monster value locked to **13**
   - Weapon display shows: "Defeated: K♠️ (current max: 13)"

2. **Fight 6-monster with Diamond 8:**
   - 6 < 13, so weapon is still usable ✓
   - Damage: 6 - 8 = 0 HP (weapon overpowers it)
   - **Weapon degrades further:** Max value now **min(13, 6) = 6**
   - Weapon display shows: "Defeated: K♠️, 6♣️ (current max: 6)"

3. **Fight 6-monster again:**
   - 6 is NOT < 6, so weapon is **UNUSABLE** ✗
   - Must fight barehanded: 6 damage
   - Weapon remains locked at max value 6

4. **Fight 10-monster:**
   - 10 > 6, so weapon is **UNUSABLE** ✗
   - Must fight barehanded: 10 damage

4. **Find Diamond 10 (weapon value 10):**
   - Click to equip → **Resets all degradation**
   - Weapon display shows: "Unused" (fresh start)

**Example Use Case:** You have Diamond 9 and encounter a 4-monster. If you use the weapon, it locks to max value 4—meaning you can NEVER use it on monsters 5+ again. Better to take 4 damage barehanded and save the weapon for a 9+ monster later.

---

### Workflow 4: Potion Timing Optimization

**Tool/Feature:** One-Potion-Per-Room Healing Rule

**Scenario:** Room 6 draws three potions (Heart 8, Heart 5, Heart 2) and one weapon. You're at 12 HP.

**Workflow:**
1. **Click "🏃 STAY"** (need healing).
2. **Identify highest-value potion:** Heart 8 (heals 8 HP).
3. **Click Heart 8 first:**
   - Heals 8 → 20 HP (capped at max)
   - Message: "🧪 Drank potion: +8 HP → 20/20"
   - Flag set: `usedPotionThisRoom = true`

4. **Click weapon card** → Equips normally.

5. **Click Heart 5 (second potion):**
   - Message: "Already used potion this room. No healing effect."
   - **Card still counts as 1 of your 3 selections** (not wasted, just doesn't heal)

6. **Room completes** → Heart 2 auto-discards (unselected 4th card).

**Example Use Case:** Room has Heart 10 and Heart 2. You're at 18 HP. If you select Heart 2 first (+2 → 20 HP), the Heart 10 becomes worthless in this room. Always select highest-value potion first when multiple appear. This applies even if you're near max HP—a 10-value potion "wastes" 8 potential healing if you're at 12 HP, but saves a potion slot for later scarcity.

---

## Development

### Project Structure

```
Scoundrel/
├── index.html              # Main HTML entry point (207 lines)
├── LICENSE                 # Creative Commons BY-SA 4.0 license
├── README.md               # Marketing overview & quick start
├── HOW_TO_PLAY.md          # Complete rules reference (592 lines)
├── INSTALL_AND_USAGE.md    # This file - implementation guide
│
├── css/
│   └── style.css           # Dark fantasy theme, CSS variables
│
└── js/
    ├── game.js             # Game engine & logic (1260 lines)
    │                       #   - Card, Deck, Player, Room, Game classes
    │                       #   - GAME_CONSTANTS, GAME_STATES
    │                       #   - GameLogger for comprehensive event tracking
    │
    ├── ui.js               # UI rendering & event handlers (973 lines)
    │                       #   - UIBuilder for card/element rendering
    │                       #   - Screen management (5 screens)
    │                       #   - Combat UI, weapon displays, stats bar
    │
    └── statsManager.js     # Statistics persistence (228 lines)
                            #   - localStorage integration
                            #   - Schema versioning & migration
                            #   - Win/loss tracking across sessions
```

### Key Directories

**`js/`**: All game logic, UI, and persistence code
- **game.js**: Implements the game rules as classes. Manages state machine transitions (`menu`, `room-decision`, `card-interaction`, `combat-choice`, `room-complete`, `game-over`). Uses Fisher-Yates for deck shuffling.
- **ui.js**: Renders game state to DOM. Handles button clicks, card selections, modal popups. Maintains `gameLog` array for combat history display.
- **statsManager.js**: Singleton pattern for stats management. Loads/saves to `localStorage` with schema version 1. Tracks wins, losses, best runs, total games.

**`css/`**: Styling with CSS custom properties
- Dark backgrounds (`--bg-dark`, `--bg-darker`)
- Gold accents (`--accent-gold`)
- Card-specific colors (red suits, black suits)
- Responsive layouts with flexbox

**Root Files:**
- **index.html**: Single-page structure with 5 screen divs (only one `.active` at a time)
- **HOW_TO_PLAY.md**: 592-line comprehensive rules guide (keep as reference)
- **LICENSE**: Creative Commons Attribution-ShareAlike 4.0

### Code Architecture Highlights

**State Machine (game.js):**
```javascript
const GAME_STATES = {
    MENU: 'menu',
    ROOM_DECISION: 'room-decision',
    CARD_INTERACTION: 'card-interaction',
    COMBAT_CHOICE: 'combat-choice',
    ROOM_COMPLETE: 'room-complete',
    GAME_OVER: 'game-over'
};
```

**Weapon Degradation Logic:**
```javascript
updateWeaponMaxMonsterValue(card) {
    const monsterValue = card.rank;
    if (this.weaponMaxMonsterValue === null) {
        this.weaponMaxMonsterValue = monsterValue;
    } else {
        // Lock to MINIMUM of current max and new monster
        this.weaponMaxMonsterValue = Math.min(this.weaponMaxMonsterValue, monsterValue);
    }
}

canUseWeaponOnMonster(monsterValue) {
    if (this.weaponMaxMonsterValue === null) return true;
    return monsterValue < this.weaponMaxMonsterValue; // Strictly less than
}
```

**Flee Constraint:**
```javascript
declareRun() {
    if (this.ranLastRoom) {
        this.message = '⚠️ Cannot flee twice in a row!';
        return false;
    }
    // Shuffle cards to bottom, set ranLastRoom = true
}
```

### Tests & Style

**No formal test suite** - This is a single-player browser game with deterministic rules.

**Manual testing checklist:**
1. Weapon degradation locks correctly after use
2. Flee button disables after fleeing
3. Second potion in room doesn't heal
4. localStorage persists stats across sessions
5. All 6 game states transition correctly

**Code style:**
- ES6+ class syntax
- JSDoc comments for public methods
- Consistent naming (camelCase for variables, PascalCase for classes)
- No external linters (vanilla JS, no build pipeline)

**To verify game logic in DevTools:**
```javascript
// Open browser console (F12)
console.log(gameInstance);  // Inspect current game state
console.log(gameInstance.player.hp);  // Check HP
console.log(gameInstance.deck.cards.length);  // Cards remaining
```

---

## Requirements

### Core Dependencies

**None.** This is a zero-dependency project.

### Browser Requirements

| Feature | Minimum Browser Version |
|---------|------------------------|
| ES6 Classes | Chrome 49+, Firefox 45+, Safari 10+ |
| CSS Custom Properties | Chrome 49+, Firefox 31+, Safari 9.1+ |
| localStorage API | Chrome 4+, Firefox 3.5+, Safari 4+ |
| Arrow Functions | Chrome 45+, Firefox 22+, Safari 10+ |

**Recommended:** Any modern browser from 2020 or later.

### Runtime Environment

- **Platform:** Any OS with a web browser (Windows, macOS, Linux, ChromeOS)
- **Network:** Not required (game runs 100% client-side)
- **Disk Space:** <1 MB total project size
- **Memory:** <50 MB typical browser memory usage
- **Permissions:** localStorage write access (blocked in private browsing)

### localStorage Behavior

The game stores statistics in `localStorage` under the key `scoundrelStats`:

```json
{
  "version": 1,
  "totalGames": 15,
  "wins": 7,
  "losses": 8,
  "bestRun": {
    "rooms": 12,
    "finalHP": 14
  }
}
```

**Private Browsing Warning:** Stats will not persist between sessions if localStorage is disabled.

---

## Troubleshooting

### Issue: Cards not appearing after clicking "STAY"

**Cause:** JavaScript error in console (check F12 DevTools)  
**Fix:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to clear cached files

### Issue: Stats not persisting

**Cause:** Private browsing mode or localStorage disabled  
**Fix:** Use normal browsing mode or check browser settings → Privacy → Allow localStorage

### Issue: Game feels "too hard"

**Not a bug:** Weapon degradation is intentional. Re-read [Workflow 3](#workflow-3-weapon-degradation-management) above. Save high weapons for high monsters.

### Issue: Flee button greyed out

**Expected behavior:** You fled the previous room. See [Workflow 2](#workflow-2-strategic-fleeing-under-constraints).

---

## Advanced Usage

### Viewing Comprehensive Logs

The game includes a `GameLogger` class that tracks every action to the browser console.

**Enable verbose logging:**
1. Open DevTools (F12)
2. Go to Console tab
3. Play the game
4. See output like:
   ```
   [1] 5♦️ deck → room-0 (drawn)
   [2] 8♠️ deck → room-1 (drawn)
   [3] ⚔️ 5♦️ equipped (weapon-change): reset to new weapon
   [4] ⚔️ 8♠️ vs 5♦️ → 3 dmg (combat)
   [5] ⚔️ 5♦️ degraded: locked to max value 8
   ```

**Use cases:**
- Debugging game logic
- Analyzing weapon degradation patterns
- Tracking flee frequency across runs

### Modifying Game Constants

Edit `js/game.js` at the top to customize difficulty:

```javascript
const GAME_CONSTANTS = {
    STARTING_HP: 20,        // Change to 30 for easy mode
    MAX_HP: 20,             // Change to 30 to match
    CARDS_PER_ROOM: 4,      // Change to 3 for faster games
    CARDS_TO_INTERACT: 3,   // Change to 2 for less card processing
    // ... etc
};
```

**Warning:** Changing `DECK_SIZE` or card distributions requires rewriting `Deck.initializeDeck()`.

### Forking & Customization Ideas

This codebase is designed for easy modification:

- **New card types**: Add to `Card.getType()` and create suit logic
- **Power-ups**: Implement in `Player` class (shields, double healing, etc.)
- **Difficulty modes**: Modify `GAME_CONSTANTS` or add monster HP
- **Multiplayer**: Add turn-based logic with shared deck state
- **Mobile UI**: Responsive CSS already present, add touch gestures

See [LICENSE](LICENSE) for Creative Commons attribution requirements.

---

## See Also

- **[HOW_TO_PLAY.md](HOW_TO_PLAY.md)** - Full rules with gameplay examples
- **[README.md](README.md)** - Project overview & quick start
- **[Original Scoundrel PDF](http://www.stfj.net/art/2011/Scoundrel.pdf)** - Sivan Tal's physical card game rules

---

*Last updated: February 2026*