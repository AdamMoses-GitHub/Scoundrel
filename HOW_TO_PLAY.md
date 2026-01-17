# How to Play Scoundrel

This is a digital implementation of the classic card game [Scoundrel](http://www.stfj.net/art/2011/Scoundrel.pdf) by Sivan Tal, freely distributed under Creative Commons. For the original rules, see the [PDF](http://www.stfj.net/art/2011/Scoundrel.pdf).

## Table of Contents
1. [Getting Started](#getting-started)
2. [The Basics](#the-basics)
3. [Card Types](#card-types)
4. [Room Sequence](#room-sequence)
5. [Combat System](#combat-system)
6. [Strategic Mechanics](#strategic-mechanics)
7. [Win & Lose Conditions](#win--lose-conditions)
8. [Gameplay Example](#gameplay-example)
9. [Tips & Strategies](#tips--strategies)

---

## Getting Started

### Setup
1. Open `index.html` in any web browser (Chrome, Firefox, Safari, Edge)
2. Click the **"🎲 START GAME"** button on the main menu
3. You'll begin at Room 1 with:
   - **20 HP** (health points)
   - **No weapon equipped** (barehanded)
   - **44 cards remaining** in the deck

### Your Goal
Survive all 44 cards with **HP > 0** to win the game.

---

## The Basics

### Each Room
1. **Draw cards** from the deck (normally 4, but may be fewer in the final room)
2. **Decide**: FLEE or STAY
   - **FLEE**: Shuffle the room's cards back to the bottom of the deck (avoids the room entirely). *Not allowed on the final room if it has fewer than 4 cards.*
   - **STAY**: Interact with 3 of the room's cards (remaining cards auto-discard). On a final room with fewer cards, interact with all of them.
3. **Apply card effects** (damage, healing, weapon equipping)
4. **Proceed to next room** (if you survived)

### Your Stats (Always Visible at Top)
- **Room**: Current room number
- **HP**: Your current health / maximum health (20)
- **Deck**: Number of cards remaining to process
- **Discard**: Number of cards already processed

---

## Card Types

### 1. Monsters (26 cards total)
**Appearance**: Black cards (Spades ♠️ and Clubs ♣️) with ranks 2-Ace

**What Happens When You Face a Monster**:
- You must choose: **Fight with weapon** or **Fight barehanded**
- **Damage Taken** = Monster Value - Weapon Value (minimum 0)

**Monster Values**:
- Cards 2-10: Face value (2, 3, 4, ... 10)
- Jack: 11
- Queen: 12
- King: 13
- Ace: 14

**Examples**:
- Monster 5, no weapon → Take 5 damage
- Monster 10, weapon 7 → Take 3 damage (10 - 7)
- Monster 4, weapon 8 → Take 0 damage (4 - 8 = -4, minimum is 0)

### 2. Weapons (9 cards total)
**Appearance**: Red diamonds (♦️) with ranks 2-10

**What Happens When You Pick One Up**:
- **Equip it immediately** (replaces your current weapon)
- Your weapon value is subtracted from monster damage
- Higher weapon = more damage reduction

**Weapon Values**: 2 through 10 (Diamond 10 is the strongest)

**Important**: Weapons have a **degradation mechanic** (see below)

### 3. Potions (9 cards total)
**Appearance**: Hearts (♥️) with ranks 2-10

**What Happens When You Use One**:
- **Heal HP** equal to the potion value (2-10)
- Your HP cannot exceed 20 (max HP)
- **Only the first potion per room heals** — subsequent potions in the same room have no effect

**Potion Values**: 2 through 10 HP healing

**Examples**:
- At 15 HP, use a Potion 8 → Heals to 20 (can't go over max)
- At 10 HP, use a Potion 6 → Heals to 16
- In same room, second potion does nothing (still counts as 1 card toward your 3 interactions)

---

## Room Sequence

### Step 1: Draw Cards
Cards are revealed face-up. Normally you draw 4 cards, but in the final room(s) when fewer than 4 cards remain in the deck, you draw whatever is left.

### Step 2: Flee or Stay
**FLEE Button**:
- Shuffles all room cards to the bottom of the deck
- Immediately advances to the next room
- **Cannot flee if you fled the previous room** (see Flee Limitation below)
- **Cannot flee if this is a final room with fewer than 4 cards** (you must complete the game)

**STAY Button**:
- Proceeds to the interaction phase
- You'll click on 3 of the room's cards to interact with them (or all cards if it's a final room with fewer than 4)

### Step 3: Interact with Cards (Only if Staying)

**Normal Room (4 cards)**: You must select 3 of the 4 cards.
**Final Room (fewer than 4 cards)**: You must interact with all remaining cards.

Each card selection:

1. **Click a card** to select it
2. **Effect applies immediately**:
   - **Monster**: A window appears asking "Weapon or Barehanded?" (Choose one)
   - **Weapon**: Equips instantly (message shows old and new weapon)
   - **Potion**: Heals instantly (or shows "already used potion this room")
3. **Card is marked as processed** (grayed out, can't select again)
4. **Repeat** until all required cards are done

The **unselected cards are auto-discarded** (no interaction, just removed from play). In a normal 4-card room, 1 card is auto-discarded. In final rooms, all selected cards are processed.

### Step 4: Room Complete
A message shows:
- What was discarded
- Your current HP and deck status

**Click "→ NEXT ROOM"** to proceed to the next room's decision phase.

---

## Combat System

When you select a monster card, you enter **Combat Choice** mode.

### Your Options

**Option 1: Use Weapon**
- Damage = Monster Value - Weapon Value
- Example: Monster 8 vs Weapon 5 = 3 damage
- **Only available if your weapon can handle this monster** (see Weapon Degradation below)

**Option 2: Fight Barehanded**
- Damage = Full Monster Value
- Example: Monster 8, no weapon = 8 damage
- Always available, no restrictions

### Weapon Degradation Mechanic

**When a weapon is used on a monster, it becomes less effective against stronger monsters going forward.**

Here's how it works:

1. **First use**: Weapon can be used on any monster
2. **After first use**: Weapon "remembers" the strongest monster it fought
3. **Going forward**: Weapon can ONLY be used on monsters **weaker than** that value

**Example Progression**:
- You equip a Diamond 5 (weapon value 5)
- Room 1: You fight a 7-monster with it
  - Weapon is now "locked" at maximum value 7 (can only be used on monsters < 7, i.e., values 2-6)
- Room 2: An 8-monster appears
  - Weapon can't be used (8 >= 7, not strictly less)
  - Must fight barehanded: 8 damage
- Room 3: A 6-monster appears
  - Weapon CAN be used (6 < 7) ✓
  - Take 1 damage (6 - 5 = 1)
- Room 4: A 5-monster appears
  - Weapon can't be used (5 is not < 5)
  - Must fight barehanded: 5 damage

**Why This Matters**:
- Weapon degradation is **irreversible** - using a weapon on ANY monster locks you into not being able to use it on monsters of that value or stronger
- "Wasting" a high weapon on a weak monster locks it to that weak monster value
- Upgrading to a better weapon resets the degradation (fresh start)
- **Strategy**: Save weapons for use only when necessary, or use high weapons early on high monsters to avoid locking them to lower values

### Weapon Upgrading

When you find a new weapon:
- **Old weapon is replaced** (you can't dual-wield)
- **New weapon has no degradation history** (starts fresh)
- Example: Diamond 5 (degraded to max 7) → Pick up Diamond 9
  - Diamond 9 can be used on any monster (no history yet)

---

## Final Room & Carry-Over Mechanics

### The Final Room

When fewer than 4 cards remain in the deck:

1. **Final room is triggered** - The next room becomes special
2. **Exactly those remaining cards are drawn** (not padded to 4)
   - Example: 2 cards left → 2-card final room
3. **You MUST interact with ALL cards** (unlike normal rooms where you select 3 of 4)
4. **You CANNOT flee** the final room (flee button is disabled)
5. **No auto-discard** - You must process every remaining card

**Strategic Importance**: 
- Know roughly when the final room approaches (after ~11 rooms)
- Don't save potions if you're close to the final room
- The final room forces engagement, so plan weapon/potion use accordingly

### Card Carry-Over System

When you STAY in a room and select only some cards:

1. **Unselected cards carry over** to the next room
2. **Carry-over position matters** - Cards appear in the same position as before
3. **Next room draws fewer new cards** to accommodate the carry-over card(s)
   - Example: 1 carry-over card → next room draws 3 new cards (total 4)
4. **Useful for avoiding bad situations**
   - You can intentionally skip a strong monster to draw it later
   - You can carry potions forward to use when you're in worse shape

**Example Scenario**:
- Room 5 has: Weapon, Monster 10, Potion, Monster 8
- You stay and select: Weapon, Monster 8, Potion
- Room 6 will automatically include Monster 10 in the same position + 3 new cards drawn
- This gives you more preparation time before facing that Monster 10

---

## Strategic Mechanics

### 1. The Flee Limitation

**Rule**: Cannot flee twice in a row.

**What This Means**:
- If you flee Room 1, you MUST stay in Room 2
- After staying in a room (processing 3 cards), you can flee again
- This forces engagement with at least 50% of rooms

**Example**:
- Flee Room 1 ✓ (ranLastRoom = true)
- Room 2: Flee button DISABLED ("must face this room")
- Stay in Room 2 ✓ (ranLastRoom = false)
- Flee Room 3 ✓ (ranLastRoom = true)
- Room 4: Flee button disabled again

### 2. Potion One-Per-Room Rule

**Rule**: Only the first potion in a room provides healing.

**What This Means**:
- First potion selected: Heals for its value
- Second potion in same room: "Already used potion this room" message, 0 healing
- Third potion: Same as second, 0 healing

**Strategic Implication**:
- Multiple potions in one room = only one heals
- Save potions for critical moments
- Don't "waste" potions in rooms where you don't need healing

### 3. Deck Depletion

**44 Cards Total**:
- 26 Monsters
- 9 Weapons
- 9 Potions

**Processing Rate**: Roughly 3-4 cards per room (after fleeing or staying)

**Result**: ~11-15 rooms to finish the deck

**Late Game Challenge**: Lower HP with fewer remaining cards means less margin for error

---

## Win & Lose Conditions

### Victory
- **Condition**: Process all 44 cards with HP > 0
- **How to achieve it**: Survive every room, manage weapons and potions, use fleeing strategically
- **Victory Screen Shows**:
  - "🏆 VICTORY!"
  - Final HP remaining
  - Rooms completed

### Defeat
- **Condition**: HP drops to 0 or below
- **When it happens**: During monster combat
- **Result**: Game ends immediately
- **Game Over Screen Shows**:
  - "💀 DEFEAT!"
  - Room number where you died
  - Final HP (0)

---

## Gameplay Example

### Room 1: Early Game Setup

**Draw**: 3♦️ (Weapon), 8♠️ (Monster), 6♥️ (Potion), Jack♣️ (Monster)

**Your Inventory Before**: 20 HP, no weapon

**Decision**: STAY (need a weapon early!)

**Interactions**:
1. **Click 3♦️ (Weapon)**
   - Equip Diamond 3
   - Message: "Equipped 3 of Diamonds (was nothing)"
   - Inventory: 20 HP, Diamond 3 weapon (max value: none yet)

2. **Click 8♠️ (Monster)**
   - Dialog: "Use weapon or fight barehanded?"
   - Choose: **USE WEAPON**
   - Calculation: 8 - 3 = 5 damage
   - Take 5 damage → 15 HP
   - Weapon max value now: 8 (can use on monsters ≤ 7 from now on)
   - Message: "⚔️ 8 of Spades (8) vs 3 of Diamonds (3) → 5 dmg (15/20)"

3. **Click 6♥️ (Potion)**
   - Heal 6 HP → 20 HP
   - Message: "🧪 Drank potion: +6 HP → 20/20"

**Auto-Discard**: Jack♣️ (Monster) is discarded

**Room 1 Complete**:
- HP: 20/20
- Weapon: Diamond 3 (can use on monsters ≤ 7)
- Status: 40 cards remaining

---

### Room 2: Mid-Game Upgrade

**Draw**: King♠️ (Monster 13), Queen♦️ (Weapon 12), Ace♥️ (Potion 11), 5♠️ (Monster)

**Your Inventory Before**: 20 HP, Diamond 3 (max value 8)

**Decision**: STAY (time to upgrade weapon!)

**Interactions**:
1. **Click Queen♦️ (Weapon)**
   - Equip Diamond 12
   - Message: "Equipped Queen of Diamonds (was 3 of Diamonds)"
   - Weapon max value reset (fresh start)
   - Inventory: 20 HP, Diamond 12 weapon (max value: none yet)

2. **Click King♠️ (Monster 13)**
   - Dialog: "Use weapon or fight barehanded?"
   - Choose: **USE WEAPON**
   - Calculation: 13 - 12 = 1 damage
   - Take 1 damage → 19 HP
   - Weapon max value now: 13 (can use on monsters ≤ 12 from now on)
   - Message: "⚔️ King of Spades (13) vs Queen of Diamonds (12) → 1 dmg (19/20)"

3. **Click Ace♥️ (Potion 11)**
   - Heal 11 HP, but capped at 20 → 20 HP
   - Message: "🧪 Drank potion: +11 HP → 20/20"

**Auto-Discard**: 5♠️ (Monster)

**Room 2 Complete**:
- HP: 20/20
- Weapon: Diamond 12 (can use on monsters ≤ 12)
- Status: 36 cards remaining

---

### Room 3: Flee Decision

**Draw**: Ace♠️ (Monster 14), Ace♣️ (Monster 14), 7♠️ (Monster), 2♥️ (Potion 2)

**Your Inventory Before**: 20 HP, Diamond 12 (max value 13)

**Analysis**: 
- Two Aces (14 damage each)
- Weapon can only handle up to 12
- Would take 2 damage minimum per Ace (14 - 12 = 2)
- Not a good room if you stay

**Decision**: FLEE
- Message: "💨 You fled the room! The 4 cards shuffle to the bottom of the deck."
- All 4 cards go to deck bottom (shuffled randomly)
- Immediately advance to Room 4
- ranLastRoom flag = true (cannot flee next room)

---

### Room 4: Forced Room

**Draw**: 4♠️ (Monster), 5♣️ (Monster), 8♦️ (Weapon), 9♥️ (Potion)

**Your Inventory Before**: 20 HP, Diamond 12 (max value 13)

**Flee Button Status**: DISABLED (message explains "You fled last room - you must face this room!")

**Decision**: STAY (no choice!)

**Interactions**:
1. **Click 8♦️ (Weapon)**
   - Equip Diamond 8
   - Message: "Equipped 8 of Diamonds (was Queen of Diamonds)"
   - Weapon max value reset
   - This is a DOWNGRADE (was 12, now 8), but sometimes necessary

2. **Click 5♣️ (Monster)**
   - Dialog: "Use weapon or fight barehanded?"
   - Choose: **USE WEAPON**
   - Calculation: 5 - 8 = -3, minimum is 0
   - Take 0 damage → 20 HP
   - Weapon max value now: 5 (can use on monsters ≤ 4 from now on)
   - Message: "⚔️ 5 of Clubs (5) vs 8 of Diamonds (8) → 0 dmg (20/20)"

3. **Click 4♠️ (Monster)**
   - Dialog: "Use weapon or fight barehanded?"
   - Choose: **USE WEAPON**
   - Calculation: 4 - 8 = -4, minimum is 0
   - Take 0 damage → 20 HP
   - Weapon max value stays: 5 (4 < 5, no update needed)
   - Message: "⚔️ 4 of Spades (4) vs 8 of Diamonds (8) → 0 dmg (20/20)"

**Auto-Discard**: 9♥️ (Potion)

**Room 4 Complete**:
- HP: 20/20
- Weapon: Diamond 8 (can use on monsters ≤ 4)
- Status: 28 cards remaining
- ranLastRoom flag reset to false (can flee again)

---

## Tips & Strategies

### Early Game (Rooms 1-3)
1. **Prioritize weapons** — Barehanded damage is brutal; get any weapon quickly
2. **Don't waste potions** — Save them for when you need them
3. **Build foundation** — Aim to upgrade to a better weapon (Diamond 5+) by Room 2-3

### Mid Game (Rooms 4-8)
1. **Manage weapon degradation** — Don't use good weapons on weak monsters
2. **Accumulate potions** — Keep a mental count of healing available
3. **Upgrade when safe** — Replace weak weapons when you find better ones
4. **Use fleeing strategically** — Escape rooms with bad combinations (multiple high monsters, no weapons)

### Late Game (Rooms 9+)
1. **HP becomes precious** — Less time to recover from bad decisions
2. **Weapon viability critical** — Ensure your current weapon can handle remaining monsters
3. **Plan potion use** — If low on HP, save potions for dangerous monsters
4. **Every decision counts** — Fewer cards remaining means less room for error

### General Strategy Tips

**Weapon Management**:
- Get a weapon by Room 1-2 (don't go barehanded too long)
- Upgrade to Diamond 6+ by mid-game
- Avoid using weapons on monsters weaker than your current "max value"
- If weapon is degraded to a low value, replacing it is often better than keeping it

**Potion Management**:
- Don't heal at 100% HP (waste)
- Use potions in high-damage rooms to prevent HP collapse
- Remember: only 9 total in the deck; plan accordingly
- Multiple potions in one room? Only first heals; choose wisely

**Risk Assessment**:
- After seeing 4 cards, estimate: Can I win this room?
- Compare: HP cost of staying vs. benefit of fleeing
- If HP is low and room is dangerous, fleeing might be worth it
- If HP is high, staying for resources (weapons/potions) is often worth it

**Deck Awareness**:
- Track roughly how many cards remain
- Later games are harder (less HP recovery time)
- Early mistakes cost more (more rooms to recover)

---

## Advanced Mechanics & Edge Cases

### 1. Weapon Further Degrades on Weaker Monsters

Once a weapon is locked to a maximum value, using it on a WEAKER monster further degrades it:

**Example**:
- Diamond 7 used on Monster 10 → locked at max 10
- Diamond 7 used on Monster 8 → locked at max 8 (further degraded!)
- Diamond 7 used on Monster 6 → locked at max 6 (even worse)

**Strategic Impact**:
- Once degraded, weapons can only get worse, never better
- Avoid using a locked weapon if possible - fight barehanded instead
- Upgrading to a new weapon is often better than using a degraded one

### 2. Weapon vs. Barehanded Trade-off

**When to use weapon:**
- Weapon will reduce damage by 2+ points
- Weapon can still be used (not locked too low)
- You're not unnecessarily degrading it further

**When to fight barehanded:**
- Weapon is severely degraded and can't be used
- Weapon would degrade to a useless value
- Better to take the damage and save weapon for later

### 3. Potion Healing Mechanics

Healing always caps at maximum HP:
- 18 HP + Potion 5 = 20 HP (not 23)
- Healing is never wasted mechanically, but tactically it can be (using at full HP)

### 4. Final Room Preparation Strategy

Since final room forces all remaining cards:
- Plan potion use before the final room
- Don't waste a high weapon in a normal room if final room is coming soon
- If you're injured heading into final room, prioritize healing

### 5. Carry-Over Strategic Use

**Intentional Skipping**:
- Skip dangerous monsters to buy time for weapon upgrades
- Skip duplicate potions to use them in harder rooms
- Skip low-value weapons to find better ones

**Example Strategy**:
- Room 8: See Monster 12, Weapon 3, Potion, Monster 5
- Your weapon is locked at value 7
- You can only use weapon on Monster 5, and Monster 12 will one-shot you
- STAY and select: Weapon 3, Potion, Monster 5
- Monster 12 carries to Room 9 (giving you 1 more room to find Diamond 8+)

### 6. The "Carry-Over Tax"

By carrying a card forward, you:
- ✓ Gain: Time to prepare with room to get better equipment
- ✗ Cost: Deck position changes (might draw different monsters sooner)

Balance is key!

---

## Glossary

| Term | Definition |
|------|-----------|
| **HP** | Health Points. Start with 20. Lose HP when fighting monsters. Reach 0 or below = defeat. |
| **Weapon** | Diamond card that reduces monster damage. Can be equipped and upgraded. |
| **Weapon Degradation** | Mechanism where weapons become limited after use. Can only be used on weaker monsters than the strongest it faced. |
| **Weapon Max Value** | The strongest monster a weapon has been used on. Weapon can't be used on monsters of equal or stronger value going forward. |
| **Flee** | Action to shuffle current room's 4 cards to deck bottom and skip the room. Can't flee twice in a row. |
| **Stay** | Decision to process 3 of 4 cards in current room (1 auto-discards). Allows you to interact with weapons, potions, and monsters. |
| **Monster** | Black card (Spade/Club) that deals damage. Value ranges from 2-14 (Ace). |
| **Potion** | Heart card that heals HP. Value ranges from 2-10. Only first potion per room heals. |
| **Room** | A cycle where 4 cards are drawn. You decide to flee or stay. |
| **Degradation** | Process where weapon loses effectiveness after use. See Weapon Degradation. |
| **Discard** | Card that is not selected during room interaction. Removed from play permanently. |

---

## Quick Reference

**Start of Game**:
- HP: 20
- Weapon: None
- Potion Used This Room: No

**Each Room**:
1. Draw 4 cards
2. Choose FLEE or STAY
3. If STAY, interact with 3 cards
4. Advance to next room (or victory/defeat)

**Combat When Fighting a Monster**:
- With weapon: Damage = Monster Value - Weapon Value (minimum 0)
- Barehanded: Damage = Monster Value
- Weapon can only be used if monster value < weapon's max value

**Victory**: All 44 cards processed with HP > 0
**Defeat**: HP drops to 0 or below

Good luck, Scoundrel!
