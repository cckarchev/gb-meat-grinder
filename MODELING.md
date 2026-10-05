# Modeling rules

The Guild Ball rules this calculator encodes. Read this before adding a model or an
effect. Card text comes from the GBPlaybook data
(`https://github.com/cleech/GBPlaybook/blob/pwa/public/data/GB-Playbook-4-8.json`);
rulings not on cards are quoted from the rulebook or the rules channel.

## Defensive stat floors

- **ARM** can be reduced to **0**, no lower (`ARM_MIN`).
- **DEF** cannot drop below **2** on the dice (`DEF_MIN`): a natural `1` always misses,
  so `2+` is the best possible hit roll. Every point of DEF reduction past that floor,
  whether from conditions (Knocked Down, Snared) or from playbook and character-play
  effects (KD, Stagger, Shield Glare), becomes **+1 attack die** instead.

## Stacking

Bonuses and penalties from the **same named source are not cumulative**: an effect with
the same name applies once, however many times or ways it lands (a teammate's
pre-applied debuff, a character play, a trait). **Different names stack**: *They Ain't
Tough!* (−1) + *Weak Point* (−1) + *Searing Strike* (−1) = −3 ARM, floored at 0. The rare
cards that say "each time" (e.g. *Bleed the Cleats*) are the exception.

> Bonuses and penalties from the same named sources aren't cumulative. Effects and
> abilities of the same name aren't cumulative.

In the code an effect's name is its `id`, so the same effect must use the same id in every
catalog (the `theyAintTough` guild buff and the `theyAintTough` character play, the
`searingStrike` enemy debuff and the `searingStrike` trait).

Once Per Turn (`OPT`) is a separate question: it limits whether a play can be **chosen**
again, not whether its effect stacks. It is copied from each card.

## Buffs vs. debuffs

Classify every effect by **whose state it describes**:

- The **target's state** (−ARM, −DEF, Burning, Tough Hide, already carrying Searing
  Strike) is **enemy-side**: an enemy debuff or condition, shown on the Enemy panel
  (`target: 'enemy'`).
- The **attacker's capabilities** (+damage, +TAC, ignoring Tough Hide, gaining an ability
  such as Searing Strike from *Tempered Steel*) are **attacker-side**: an attacker buff,
  shown on the Attacker panel. An ability whose *effect* lands on the target later in the
  activation is still attacker-side, because it is something the attacker does.

Guild effects stay **availability-scoped to the attacker's guild even when they land on
the enemy.** Blacksmiths cannot use *They Ain't Tough!*, and Farmers and Butchers cannot
use *Searing Strike*. A model listed as the source of an effect (`excludedGuildBuffs`)
sees it disabled on either panel.

## Conditions and timing

Damage is resolved **per attack**:

> After applying damage modifiers to each individual playbook damage result, combine all
> DMG results from an attack into a single instance of damage.

Effects that trigger "when this model damages the target" therefore resolve **after** the
whole attack.

- A **conditional damage buff** (e.g. *Burning Passion*: +1 DMG while the target is
  Burning) applies to an attack only if the condition was present **before** that attack.
- An effect applied **after** damage (e.g. *Searing Strike*: the damaged target suffers
  −1 ARM and Burning) does **not** help the attack that triggered it, nor any wrap result
  inside that attack. Every **later** attack benefits.
- **Damage reduced to 0 is no damage.** "If damage is reduced to 0 (e.g. by Tough Hide),
  no damage has been caused." An attack whose results all end at 0 effective DMG has
  caused no damage and triggers nothing.
- The trigger is **any damage this model deals the target**, attributed to the swing it
  happens on: card damage, a damaging character play (*Impale*), or the charge damage of
  *Sweeping Charge*. A swing that deals none (`>`, `T`, `><`, a GB with no damaging play,
  or a hit zeroed by Tough Hide) triggers nothing.
- *Sweeping Charge* adds 3 DMG to the charge attack **only when that attack picks at
  least one playbook damage result** (a numbered pip); a charge that picks only GB, KD,
  dodges or pushes does not trigger it. It needs a damage result *picked*, not damage
  *caused*: a `1` reduced to 0 by Tough Hide still triggers it (and still earns no
  momentum). Its 3 DMG is unmodified and is damage caused, so it triggers Searing Strike
  for later swings even when every card result was zeroed. It lands with the charge
  attack, so that attack is still resolved at full ARM.
- In the **odds**, a charge roll that falls short of its picked line falls back to the
  best line it reaches, like any other swing. If that fallback is a damage result,
  *Sweeping Charge* triggers, even when the picked line had no damage: a charge that
  picked `>` and rolled 1 net takes `1` and adds the 3 DMG. The all-hit projection and
  its tooltip assume the picked line, so they show no *Sweeping Charge* for that charge.
  A worse roll can therefore deal more damage than the plan shows.

**Plan assumption.** When deciding whether a later swing sees a condition, the calculator
assumes the plan's earlier swings land and reach their picked lines. This is the same
assumption used for carried effects like *Singled Out* and *They Ain't Tough!*. Sweeping
Charge alone depends on the roll of its own (charge) swing.

## Character plays

- Cost notation `N/GB` (e.g. Impale's `2/GB`) means the play can be paid with `N`
  influence **or** triggered for free off a `GB` playbook result. The calculator only
  plans GB triggers.
- `OPT` = **Once Per Turn**: picking it on one swing removes it from later swings.

## Damage sources

> Tough Hide: Works on all plays, character, heroic and legendary. Does not work on
> character traits. In the case of multiple playbook damage results (e.g. from a wrapped
> attack), Tough Hide reduces each individual result by 1 DMG.

| Source | Tough Hide | Tooled Up / The Owner | Burning Passion |
|---|:-:|:-:|:-:|
| **Playbook damage results** | reduces | +1 | +1 while Burning |
| **Character plays** that cause damage (*Impale*) | reduces | +1 | no |
| **Character traits** (*Sweeping Charge*, *Don't Fear The...*) | no | no | no |

## Playbook symbols

Symbols as printed on the card; only damage, momentum, KD, pushes and plays affect the
math:

| Symbol | Meaning | Math effect |
|---|---|---|
| `1`, `2`, … | Damage | damage |
| momentous (tinted) | Generates momentum | momentum |
| `GB` | Guild Ball: may trigger a character play | depends on the play |
| `KD` | Knocked Down (−1 DEF; does nothing on a target already Knocked Down) | DEF |
| `>` / `>>` | Push / double push (clears the target's cover for later swings) | cover |
| `><` | Push + dodge; the push clears cover like `>` | cover |
| `<` / `<<` | Dodge / double dodge | none |
| `T` | Tackle | none |

## Momentum

A momentous playbook result earns **1 momentum** on a hit, subject to one rule:

- A momentous result **with printed damage** earns momentum only if it **causes damage**.
  If modifiers reduce it to 0 (e.g. a `1` under Tough Hide), its effect was negated: it
  earns nothing, and its chip is shown "zeroed".
- A momentous result **without printed damage** (e.g. a momentous `GB` or `<<`) always
  earns momentum, and its chip is shown momentous as usual.

Damage from other sources on the same attack does not rescue a zeroed result: a `1;M`
zeroed by Tough Hide earns no momentum even when *Sweeping Charge* deals its 3 DMG on
that charge.

Taking the target out earns `KILLING_BLOW_MOMENTUM` on top, and Bonus Time spends
momentum before its roll.
