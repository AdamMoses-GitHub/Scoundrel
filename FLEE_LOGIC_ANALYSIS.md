# Flee Room Logic Analysis & Edge Cases

## Current Implementation

### Flee Flow
1. **fleeRoom()** (game.js lines 631-664)
   - Validates that we can flee (not `ranLastRoom`)
   - Shuffles the 4 room cards using `shuffleArray()`
   - Pushes them to deck bottom with `pushToBottom()`
   - Sets `ranLastRoom = true`
   - Immediately calls `enterNextRoom()`

2. **enterNextRoom()** (game.js lines 497-629)
   - Checks `if (this.deck.isEmpty())` → triggers VICTORY
   - If false, tries to draw 4 cards: `roomCards = this.deck.draw(4)`
   - Creates new Room with those cards
   - Sets `decidedToStay = true` since we just fled

### Card Ordering
✅ Correct: After shuffling fled cards to bottom, the `draw()` method takes from the front of the deck, so newly shuffled cards are drawn later, not immediately.

Example:
```
Before flee: [A, B, C, D, E, F] (6 cards in deck)
After drawing room: [E, F] (4 drawn)
After shuffling fled cards to bottom: [E, F, shuffle(room4)]
After drawing next room: [shuffle(card1, card2, card3, card4)] (E and F were used)
```

## Edge Cases Analysis

### CASE 1: 44 cards (Start of Game)
- Draw 4 for room 1 → 40 left
- Flee → shuffle those 4 to bottom → 44 total
- Draw 4 for room 2 → 40 left
- **Status**: ✅ No problem

### CASE 2: 40 cards (After room 1, normal completion)
- Draw 4 for room 2 → 36 left
- Flee → shuffle those 4 to bottom → 40 total
- Draw 4 for room 3 → 36 left
- **Status**: ✅ No problem

### CASE 3: 8 cards (Near end game)
- Draw 4 for room 11 → 4 left
- Flee → shuffle those 4 to bottom → 8 total
- Draw 4 for room 12 → 4 left
- **Status**: ✅ No problem

### CASE 4: 5 cards (Critical)
- Draw 4 for room N → 1 left
- Flee → shuffle those 4 to bottom → 5 total
- Draw 4 for room N+1 → 1 left
- **Status**: ✅ Works (splice(0, 4) with 5 items returns 4)

### CASE 5: 4 cards (Critical)
- Draw 4 for room N → 0 left
- Flee → shuffle those 4 to bottom → 4 total
- Draw 4 for room N+1 → 0 left
- Next `enterNextRoom()` checks `isEmpty()` → true → **VICTORY**
- **Status**: ✅ Works correctly

### CASE 6: 3 cards (PROBLEM)
- Try to draw 4 for room N → `draw(4)` with 3 items returns only 3 cards
- Attempt to create `new Room(3-card-array)` → **ROOM CONSTRUCTOR ERROR**
- Room constructor checks: `if (cards.length !== 4) throw Error`
- **Status**: ❌ **CRITICAL BUG** - Game crashes

### CASE 7: 2 cards (PROBLEM)
- Try to draw 4 for room N → `draw(4)` with 2 items returns only 2 cards
- **Status**: ❌ **CRITICAL BUG** - Game crashes

### CASE 8: 1 card (PROBLEM)
- Try to draw 4 for room N → `draw(4)` with 1 item returns only 1 card
- **Status**: ❌ **CRITICAL BUG** - Game crashes

### CASE 9: 0 cards (Expected)
- `enterNextRoom()` checks `isEmpty()` → true → **VICTORY**
- **Status**: ✅ Works correctly

## The Problem

The game can never legitimately reach a state where there are 1-3 cards remaining, **UNLESS** there's a bug in the carry-over logic when near the end of the deck.

### Potential Problem Scenario: Carry-Over with Low Deck

In `enterNextRoom()` lines 553-575, when there's a carry-over situation:
```javascript
if (!this.ranLastRoom && this.currentRoom) {
    carryOverIndex = this.currentRoom.cards.findIndex((_, i) => !this.currentRoom.processedIndices.includes(i));
    if (carryOverIndex !== -1) {
        carryOverCard = this.currentRoom.cards[carryOverIndex];
        const newCards = this.deck.draw(3);  // ← PROBLEM HERE
        // ... build roomCards array with 1 carried + 3 new
    }
}
```

**If the deck has only 2 cards left:**
- `draw(3)` returns an array of 2 cards
- The code builds a roomCards array: [carried, new1, new2, null or undefined]
- Room constructor receives 3 cards (or with undefined) → ERROR

**If the deck has only 1 card left:**
- `draw(3)` returns an array of 1 card
- The code builds: [carried, new1, null, null]
- Room constructor receives fewer than 4 cards → ERROR

## Summary of Issues

### ✅ Flee Logic (Correct)
1. 4 cards are properly shuffled using Fisher-Yates
2. They are correctly pushed to the deck bottom
3. New cards are drawn from the front, so the ordering works

### ❌ Edge Case Handling (Broken)
1. **No check for insufficient deck size**: The code doesn't verify there are at least 4 cards before trying to draw a room
2. **Room constructor is too strict**: It requires exactly 4 cards, but the deck can't guarantee this when nearly depleted
3. **Carry-over doesn't handle low deck**: If a carry-over happens with fewer than 4 total cards available (carried + drawable), it crashes

## Recommended Fixes

### Option A: Validate Deck Before Drawing
- Before drawing a room, check if deck has at least 4 cards
- If not, create a room with however many cards remain
- Modify Room constructor to accept 1-4 cards
- Mark the room as "final room" and trigger victory after

### Option B: Better Endgame Handling
- Track when we're in the "final round" (fewer than 4 cards remaining)
- Draw only what's available for final rooms
- Complete game when all cards are drawn

### Option C: Prevent the Situation
- Ensure the game always knows when to trigger victory
- Check at the START of `enterNextRoom()` if this is the last room
- Force victory before trying to draw an incomplete room

## Game Flow Validation

The game SHOULD progress like this:
```
44 cards: room 1 (draw 4, 40 left), room 2 (draw 4, 36 left), ...
After 10 complete rooms: 4 cards left

Room 11:
├─ Draw 4 → 0 left in deck
├─ Process room (stay/flee)
└─ Call enterNextRoom()
    └─ Check isEmpty() → NO (we have 4 cards in hand, but haven't finalized victory yet)
    └─ Try to draw 4 → 0 left
    └─ Next call to enterNextRoom()
        └─ Check isEmpty() → YES → **VICTORY**
```

**The Issue**: After room 10 is complete and you call enterNextRoom(), it should recognize that there are only 4 cards left total in the deck, and this will be the final room.

## Testing Recommendations

1. **Test complete game**: Play all 44 cards without fleeing
2. **Test fleeing at critical points**: Flee when 8, 5, or 4 cards remain
3. **Test carry-over near end**: Complete room 10, carry one unprocessed card to room 11, check if final room logic works
4. **Test fleeing in final rooms**: Flee in room 11 when 4 cards remain
