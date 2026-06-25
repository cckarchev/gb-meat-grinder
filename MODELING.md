# Modeling rules

A reference for the Guild Ball rules this calculator encodes — read this before
adding a new model or effect. These are general rules, not specific to any one model.

## Defensive stat floors

- **ARM** can be reduced to **0**, no lower.
- **DEF** floors at **1**: a natural `1` on the attack die always misses, so `2+`
  is the effective hit floor. Any DEF reduction past the floor converts into
  **bonus attack dice**.

## ARM-reduction stacking

- Each **−ARM source is −1** and does **not** stack with itself (same source caps at −1,
  like the GB *They Ain't Tough* carry-over).
- **Different sources stack**: e.g. *They Ain't Tough* (−1) + *Weak Point* (−1) +
  *Searing Strike* (−1) = −3 ARM.

## Buffs vs. debuffs

Classify every effect by **what it modifies**:

- Modifies the **enemy's defenses** (−ARM, −DEF, Tough Hide, Burning) → **enemy-side**
  (an enemy debuff / condition).
- Modifies the **attacker's output** (+damage, +TAC, "ignore Tough Hide") → **attacker-side**
  (an attacker buff).

Guild effects stay **availability-scoped to the attacker's guild even when they are
applied to the enemy.** A −ARM debuff is still a guild thing — Blacksmiths can't use
*They Ain't Tough*, Farmers/Butchers can't use *Searing Strike* — but it lands on the
enemy, so it belongs on the enemy side of the model, filtered by the selected attacker's
guild.

## Conditions and timing

- A **conditional damage buff** (e.g. *Burning Passion*: +1 damage while the enemy is
  Burning) applies to a hit **only if the condition was present _before_ that hit**.
- An effect that applies a condition **after** damage (e.g. *Searing Strike*: "enemy models
  damaged by this model suffer −1 ARM and Burning") does **not** buff the triggering hit, but
  every **later** hit benefits (both the +1 damage from Burning Passion and the −1 ARM).
- The trigger is **any damage this model deals the target**, not just an attack's card damage.
  Card damage on a swing, a flat-damage character play (*Impale*), and *Sweeping Charge* all
  count — each attributed to its own swing. So the trigger is **not** "the first swing that
  deals card damage": a swing whose only damage is *Impale* (a damageless `GB` line) or the
  charge swing's *Sweeping Charge* still lights the condition for **later** swings. Only swings
  that deal no damage at all (`>`, `T`, `><`, a damageless `GB` with no flat-damage play) fail
  to trigger it.
- *Sweeping Charge*'s flat damage is dealt **alongside** the charge attack, not before it, so
  that **first attack is still resolved at full ARM** (the damage is simultaneous, not prior).
  But it counts as damage, so it triggers the condition for every swing **after** the charge —
  even if the charge attack itself dealt no card damage (e.g. it missed). The same goes for a
  flat-damage character play: it lights the condition for the swings after the one it lands on.

## Character plays

- Cost notation `N/GB` (e.g. Impale's `2/GB`) means the play can be paid with `N` influence
  **or** triggered for free off a `GB` playbook result.
- `OPT` = **Once Per Turn**: usable once per activation — picking it on one swing removes
  it from later swings.
Damage comes from three kinds of source, each modified differently:

| Source | Tough Hide | Tooled Up (+DMG buff) | Burning Passion |
|--------|:----------:|:---------------------:|:---------------:|
| **Playbook results** (card damage) | reduces | lifts | lifts |
| **Character plays** that deal damage (e.g. *Impale*) | reduces | lifts | — |
| **Special abilities / other** (e.g. *Sweeping Charge*) | — | — | — |

- A character play may deal **flat damage** (e.g. Impale = 3 DMG), not just modify later
  swings. It is treated like a playbook result for modifiers — Tough Hide reduces it, Tooled Up
  lifts it — but Burning Passion is **playbook-only** and never touches it.
- A **special ability**'s flat damage (e.g. *Sweeping Charge*) is fully unmodified: no Tough
  Hide, no +DMG buff, no Burning Passion.

## Playbook symbols

Symbols as printed on the card; only damage and momentum affect the math, the rest are
cosmetic for the attack sequence:

| Symbol | Meaning | Damage relevance |
|--------|---------|------------------|
| `1`, `2`, … | Damage | yes |
| momentous (tinted) | Generates momentum | yes (momentum) |
| `GB` | Guild Ball — may trigger a character play | depends on the play |
| `KD` | Knocked Down (−1 DEF; only the first applies) | via DEF |
| `>` / `>>` | Push / double push (clears the enemy's cover for later swings) | via cover |
| `<` | Dodge | cosmetic |
| `<<` | Double dodge | cosmetic |
| `T` | Tackle | cosmetic |
| `><` | Push + Dodge — the push clears cover like `>` | via cover |

## Momentum

A playbook result generates momentum from its momentous flag **alone, independent of
damage**. A 0-damage momentous result (e.g. a GB) still earns momentum, and Tough Hide
reducing a momentous line's damage to 0 does not remove it. Damage only drives the chip
styling — a momentous line dealing no damage is shown "zeroed" but still counts momentum.
