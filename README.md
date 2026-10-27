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
- CSS Modules, styled with the club's shared tokens and self-hosted fonts from
  [`@cckarchev/shared`](https://github.com/cckarchev/cck-shared), plus the
  app tokens in `src/styles/global.css`

## Development

```bash
npm install
npm run dev
```

```bash
npm run build     # type-check + bundle
npm run preview   # serve the built dist/ locally
npm test          # run the core test suite once
npm run test:watch
npm run test:coverage
npm run check     # Biome lint + format check
npm run lint
npm run format
npm run deploy    # build + deploy to Cloudflare (see Deploy)
```

`src/core/engine.golden.test.ts` snapshots the whole engine against the real
attacker data. If a rules change is intended, review the snapshot diff and
update it with `npx vitest run -u`.

## Project layout

```
src/
  core/           pure engine logic, one folder per domain
    plan/         the attack plan and the clamp that keeps it legal
    attacks/      attack rows, sequencing, swing modifiers and projections
    playbook/     playbook lookups, labels, wrap slots, row effects, cover, Knock Down
    character-plays/  character play lookup, effects, Once Per Turn usage
    damage/       damage, kill odds, killing blow, resilience, probability
    activation/   momentum, Bonus Time, simulation, summary/ (activation totals and tooltips)
    shared/       constants and small helpers
  data/
    attackers/    beater definitions + registry.ts (the simulatable models)
    guilds/       per-guild buffs, one file per guild
    characterPlays.ts   shared character plays catalog
    characterTraits.ts  shared character traits catalog
    guildBuffs.ts       guild buffs shared across guilds
  ui/             shared UI primitives (toggles, tooltips, steppers)
  meat-grinder/   the app: root component, simulation hooks, reducer/, share/,
                  and one folder per panel (attacker-panel/, enemy-panel/,
                  attacks-panel/), nested like the component tree
```

## Modeling rules

[MODELING.md](MODELING.md) records the Guild Ball rules the calculator encodes (stacking,
condition timing, damage sources, momentum). Read it before adding a model or an effect.

Types live next to their domain as `*.types.ts`.

Adding a beater means writing a file in `src/data/attackers/` and registering it
in `src/data/attackers/registry.ts`. Guild buffs live in their own file under
`src/data/guilds/`; buffs several guilds share live in `src/data/guildBuffs.ts`.

## Deploy

The site runs on Cloudflare Workers as static assets only, with no Worker script.
`wrangler.jsonc` serves `dist/` and attaches the custom domain
`gb-meat-grinder.cckarchev.ar`.

`npm run deploy` builds and uploads it with the project's own Wrangler. Log in once
with `npx wrangler login` on an account that holds the `cckarchev.ar` zone.

## Disclaimer

This website is completely unofficial and in no way endorsed by Steamforged Games
Limited. Guild Ball and all associated names, guilds, players, and game terms are
trademarks of Steamforged Games Limited. No challenge to their status is intended. All
such material is used without permission for non-commercial, fan use only.

See [NOTICE](NOTICE) for the full disclaimer.
