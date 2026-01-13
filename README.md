# Scoundrel - Deck Dungeon Crawler

A browser-based card game where you survive a 44-card deck by managing weapons, potions, and tough tactical decisions.

This is a digital implementation of the classic card game [Scoundrel](http://www.stfj.net/art/2011/Scoundrel.pdf) by Sivan Tal, freely distributed under Creative Commons.

## Quick Start

Open `index.html` in a web browser. Click **START GAME** and follow the on-screen instructions.

## How It Works

Each room, you draw 4 cards. Choose to **FLEE** (shuffle them to the deck bottom) or **STAY** (interact with 3 cards). 

- **Monsters**: Choose to fight with your equipped weapon or barehanded
- **Weapons**: Equip to reduce monster damage (but weapons degrade against tougher monsters)
- **Potions**: Heal HP (only the first potion per room works)

Win by surviving all 44 cards with HP > 0. Lose if HP hits 0.

## Key Mechanics

- **Weapon Degradation**: Once a weapon is used on a monster, it can only be used on weaker monsters going forward
- **Flee Limitation**: Can't flee twice in a row — forces you to face at least every other room
- **Potion Scarcity**: Only 9 healing items total across the entire deck; use them wisely
- **Tactical Combat**: Each monster fight is a choice between weapon (reduced damage) or barehanded (full damage)

## Strategy Tip

Get a decent weapon early (saves you from brutal barehanded damage), manage your potions for critical moments, and use the flee mechanic to skip impossible rooms while upgrading your weapons when available.

## Design Notes

Built with vanilla JavaScript (no frameworks). See **GAME_RULES_AND_BEHAVIOR.md** for complete design documentation.
