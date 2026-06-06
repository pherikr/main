import { GameState } from './GameState.js';

export function d20() {
  return Math.floor(Math.random() * 20) + 1;
}

export function statToModifier(stat) {
  // stat 42–68 → modifier -4 to +8
  // mid-point ~55 → 0
  return Math.round((stat - 55) / 4);
}

export function roll(label, { stat, advantage = false, disadvantage = false, extraMods = [] }) {
  const base = statToModifier(stat);
  const total_extra = extraMods.reduce((a, b) => a + b.value, 0);

  let r1, r2, finalRoll;
  if (advantage) {
    r1 = d20(); r2 = d20();
    finalRoll = Math.max(r1, r2);
  } else if (disadvantage) {
    r1 = d20(); r2 = d20();
    finalRoll = Math.min(r1, r2);
  } else {
    finalRoll = d20();
    r1 = finalRoll; r2 = null;
  }

  const isNat20 = finalRoll === 20;
  const isNat1  = finalRoll === 1;
  const total   = finalRoll + base + total_extra;

  const entry = {
    label,
    dice: finalRoll,
    r1, r2,
    advantage, disadvantage,
    baseMod: base,
    extraMods,
    total,
    isNat20, isNat1,
  };

  GameState.debug.rolls.push(entry);

  return entry;
}

export function rollVs(label, attacker, defender) {
  const a = roll(`${label} [ATK]`, attacker);
  const d = roll(`${label} [DEF]`, defender);
  return { attacker: a, defender: d, success: a.total > d.total, margin: a.total - d.total };
}
