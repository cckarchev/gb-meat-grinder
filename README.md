# gb-meat-grinder

A Guild Ball attack calculator. Model a player's attack sequence, configure target defences and guild buffs, and see the expected damage output across every playbook result combination.

## Features

- **Beater roster**: currently supports Veteran Boar, Windle, and Thresher. We add specific beaters as people ask for them, so this list grows over time rather than covering every guild.
- **Guild buffs**: select the attacking guild to apply its character plays and buff auras (Tooled Up, The Owner, Singled Out, Stagger, etc.)
- **Playbook grid**: interactive grid showing every attack outcome; select which columns to include in the simulation
- **Full attack sequence**: chain multiple attacks in order, with momentum and crowd-out carry-over between them

Want a beater that isn't here yet? [Open an issue](https://github.com/cckarchev/gb-meat-grinder/issues) to suggest one.

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
npm run build     # type-check + bundle
npm run preview   # serve the built dist/ locally
npm run lint
npm run format
```

## Project layout

```
src/
  core/         attack math: probability, playbook, sequencing, kill odds
  attackers/    beater definitions + registry.ts (the simulatable models)
  guilds/       per-guild buffs and character plays, one file per guild
  components/   UI panels, attack widgets, and ui/ primitives
  types/        shared type definitions
```

Adding a beater means writing a file in `src/attackers/` and registering it in `src/attackers/registry.ts`. Guild buffs live in their own file under `src/guilds/`.

See [MODELING.md](MODELING.md) for the game rules the calculator encodes before  modeling a new model or effect.

## Disclaimer

This website is completely unofficial and in no way endorsed by Steamforged Games Limited. Guild Ball and all associated names, guilds, players, and game terms are trademarks of Steamforged Games Limited. No challenge to their status is intended. All such material is used without permission for non-commercial, fan use only.

See [NOTICE](NOTICE) for the full disclaimer.
