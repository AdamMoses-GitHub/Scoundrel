# Scoundrel - Deck Dungeon Crawler

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)
![License](https://img.shields.io/badge/license-CC_BY--SA_4.0-green.svg)

*Because managing a 44-card deck without a spreadsheet is like trying to organize a library by throwing books at shelves.*

![App Screenshot](INSERT_IMAGE_URL_HERE)

## About

**The Pain:** Traditional card-based dungeon crawlers force you to track complex weapon durability, potion inventories, and monster encounters across dozens of rooms—all in your head or on scratch paper. One miscalculation and you're toast.

**The Solution:** Scoundrel distills this into a pure tactical experience: a browser-based card game where the computer handles all the bookkeeping, letting you focus on the brutal decisions. Every weapon degrades, every potion is precious, and you can't run from trouble more than once in a row.

This is a digital implementation of the classic card game [Scoundrel](http://www.stfj.net/art/2011/Scoundrel.pdf) by Sivan Tal, freely distributed under Creative Commons.

**Repository:** [INSERT_GITHUB_URL_HERE]

## What It Does

### The Main Features
- **44-Card Deck Management**: Survive a randomly shuffled deck of 26 monsters, 9 weapons, and 9 potions
- **Flee or Fight Decisions**: Choose to skip tough rooms (but can't flee twice in a row)
- **Tactical Combat System**: Fight monsters with equipped weapons or barehanded—each choice has consequences
- **Weapon Degradation Tracking**: Weapons "remember" the toughest monsters they've fought and become less effective over time
- **One-Potion-Per-Room Rule**: Strategic healing with limited resources (only first potion in a room heals)
- **Real-Time Stats Dashboard**: Live HP, room number, deck count, and weapon status always visible

### The Nerdy Stuff
- **Zero Dependencies**: Pure vanilla JavaScript—no frameworks, no build tools, no npm installs
- **Client-Side Persistence**: localStorage-based statistics tracking across sessions
- **Fisher-Yates Shuffling**: Cryptographically sound deck randomization
- **Comprehensive Logging System**: Developer console tracks every card movement, state transition, and combat calculation
- **Responsive UI Architecture**: Event-driven state machine with 6 distinct game states

## Quick Start (TL;DR)

For full installation options and detailed workflows, see [INSTALL_AND_USAGE.md](INSTALL_AND_USAGE.md).

```bash
# Clone the repository
git clone [INSERT_GITHUB_URL_HERE]
cd Scoundrel

# Open in browser (no build required!)
# Windows
start index.html
# macOS
open index.html
# Linux
xdg-open index.html
```

Click **START GAME** and survive the deck. That's it.

## Tech Stack

| Component | Purpose | Why This One |
|-----------|---------|--------------|
| **Vanilla JavaScript (ES6+)** | Game engine & logic | Zero overhead, instant load times, no dependency hell |
| **HTML5** | DOM structure | Semantic markup with accessibility features |
| **CSS3 (Custom Properties)** | Dark fantasy theme | Dynamic theming with CSS variables, smooth animations |
| **localStorage API** | Statistics persistence | Built-in browser storage, no backend needed |
| **Fisher-Yates Algorithm** | Deck shuffling | Industry-standard unbiased randomization |
| **Event-Driven State Machine** | Game flow control | Clean separation of concerns, predictable state transitions |

## How It Works

Each room draws 4 cards (or fewer in the final room). You choose to **FLEE** (shuffle cards to deck bottom) or **STAY** (interact with 3 of 4 cards). 

- **Monsters (♠️♣️)**: Fight with weapon (reduced damage) or barehanded (full damage)
- **Weapons (♦️)**: Equip to reduce monster damage, but degrade after use
- **Potions (♥️)**: Heal HP, but only the first potion per room works

**Win** by surviving all 44 cards with HP > 0. **Lose** if HP hits 0.

### Core Mechanics
- **Weapon Degradation**: Once used on a monster, weapons can only be used on strictly weaker monsters going forward
- **Flee Limitation**: Can't flee twice in a row—forces engagement with ~50% of rooms
- **Potion Scarcity**: Only 9 healing items total; plan carefully

See [HOW_TO_PLAY.md](HOW_TO_PLAY.md) for complete rules and strategies.

## Contributing

Pull requests welcome! This is a fan implementation of a Creative Commons game—feel free to fork, modify, and share.

## License

This digital implementation is licensed under **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**, matching the original game's license.

Original game design by [Sivan Tal](http://www.stfj.net/art/2011/Scoundrel.pdf).

---

<sub>keywords: card game, dungeon crawler, browser game, vanilla javascript, roguelike, deck management, tactical combat, weapon degradation, strategy game, html5 game, single-player, turn-based, resource management, permadeath, procedural generation, indie game, open source game, creative commons, sivan tal, scoundrel</sub>
