# gb-meat-grinder

A Guild Ball attack calculator. Model a player's attack sequence, configure target defences and guild buffs, and see the expected damage output across every playbook result combination.

## Features

- **Attacker roster** — currently supports Veteran Boar, Windle, and Thresher
- **All 20 guilds** — select the attacking guild to apply guild-specific character plays and buff auras (Tooled Up, The Owner, Singled Out, Stagger, etc.)
- **Playbook grid** — interactive grid showing every attack outcome; select which columns to include in the simulation
- **Full attack sequence** — chain multiple attacks in order, with momentum and crowd-out carry-over between them

## Tech stack

- React 19 + TypeScript
- Vite
- styled-components

## Development

```bash
npm install
npm run dev
```

```bash
npm run build   # type-check + bundle
npm run lint
npm run format
```
