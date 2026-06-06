import { GameState } from './GameState.js';
import { EVENT_POOL, EVENTS } from '../data/events.js';
import { roll, statToModifier } from './dice.js';
import { RatingEngine } from './RatingEngine.js';
import { WEAPONS } from '../data/weapons.js';

// ── STAT RESOLUTION ───────────────────────────────────────────────────────────

// Average player stats from a choice's yourStats array
function avgPlayerStat(yourStats) {
  const p = GameState.player;
  if (!yourStats?.length) return 50;
  const vals = yourStats.map(k => p.stats[k] || 50);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// Average opponent stats from a choice's oppStats array
function avgOppStat(oppStats) {
  const opp = GameState.opponent;
  if (!oppStats?.length) return 52;
  const vals = oppStats.map(k => {
    // GK keys
    if (k.startsWith('gk_')) return opp.gk[k] ?? 53;
    return opp.defender[k] ?? 52;
  });
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// ── MODIFIER STACK ────────────────────────────────────────────────────────────

function buildModifiers(choice) {
  const m = GameState.match;
  const p = GameState.player;
  const mods = [];

  // Smart bonus — defined per-choice in the event definition
  if (choice.smartBonus) {
    mods.push({ label: 'Smart choice', value: Math.floor(Math.random() * 3) + 1 });
  }

  // Ego bonus — high ego stat rewards the flashy call
  if (choice.isEgo && (p.stats.ego || 50) >= 60) {
    mods.push({ label: 'Ego', value: 1 });
  }

  // Form modifier
  if (m.formModifier !== 0) {
    mods.push({ label: 'Form', value: Math.round(m.formModifier) });
  }

  // Stamina modifier
  const sm = staminaMod(m.stamina);
  if (sm !== 0) mods.push({ label: 'Stamina', value: sm });

  // Confidence
  if (m.confidence >= 70)      mods.push({ label: 'Confidence', value: 1 });
  else if (m.confidence <= 30) mods.push({ label: 'Low confidence', value: -1 });

  // Weapon bonus
  const weaponId = resolvedWeaponId();
  if (weaponId && choice.weaponBoost?.includes(weaponId)) {
    const w = WEAPONS.find(w => w.id === weaponId);
    if (w) mods.push({ label: `Weapon: ${w.name}`, value: w.bonus });
  }

  return mods;
}

function staminaMod(stamina) {
  if (stamina >= 70) return 0;
  if (stamina >= 40) return -1;
  if (stamina >= 20) return -2;
  return -3;
}

function resolvedWeaponId() {
  const p = GameState.player;
  if (p.weapon === 'discover') return GameState.match.discoveredWeapon;
  return p.weapon;
}

// ── ADVANTAGE / DISADVANTAGE ──────────────────────────────────────────────────

function shouldHaveAdvantage(choice) {
  const m = GameState.match;
  const playerStat = avgPlayerStat(choice.yourStats);
  const oppStat    = avgOppStat(choice.oppStats);
  const weaponId   = resolvedWeaponId();
  return (
    playerStat >= oppStat + 15 ||
    (weaponId && choice.weaponBoost?.includes(weaponId)) ||
    m.momentum >= 70
  );
}

function shouldHaveDisadvantage(choice) {
  const m = GameState.match;
  const playerStat = avgPlayerStat(choice.yourStats);
  const oppStat    = avgOppStat(choice.oppStats);
  return (
    oppStat >= playerStat + 15 ||
    m.stamina < 39 ||
    m.momentum <= 30 ||
    m.rattled
  );
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

export const EventEngine = {
  filterChoices(eventDef) {
    const p = GameState.player;
    const weaponId = resolvedWeaponId();
    return eventDef.choices.filter(c => {
      if (c.statGate) {
        const val = p.stats[c.statGate.stat] || 0;
        if (val < c.statGate.min) return false;
      }
      if (c.weaponGate && c.weaponGate !== weaponId) return false;
      return true;
    });
  },

  resolve(eventDef, choice) {
    const m = GameState.match;
    const p = GameState.player;

    // Player roll — average of yourStats
    const playerStatAvg = avgPlayerStat(choice.yourStats);
    const extraMods     = buildModifiers(choice);

    const adv = shouldHaveAdvantage(choice) && !shouldHaveDisadvantage(choice);
    const dis = !adv && shouldHaveDisadvantage(choice);

    const playerRoll = roll(`${eventDef.id} — ${choice.label}`, {
      stat: playerStatAvg,
      advantage: adv,
      disadvantage: dis,
      extraMods,
    });

    // Opponent roll — average of oppStats mapped to real defender/GK stats
    const oppStatAvg = avgOppStat(choice.oppStats);
    const oppRoll = roll(`${eventDef.id} — Opponent (${(choice.oppStats||[]).join(', ')})`, {
      stat: oppStatAvg,
      extraMods: [],
    });

    const isNat20 = playerRoll.isNat20;
    const isNat1  = playerRoll.isNat1;
    const success = isNat20 ? true : isNat1 ? false : playerRoll.total > oppRoll.total;

    // Rating
    if (!isNat20 && !isNat1) {
      RatingEngine.apply(choice.isEgo
        ? (success ? 'ego_success' : 'ego_failure')
        : (success ? 'safe_success' : 'safe_failure')
      );
    }
    if (isNat20) RatingEngine.apply('nat20_bonus');
    if (isNat1)  { RatingEngine.apply('nat1_penalty'); m.rattled = true; }
    else          m.rattled = false;

    // Stamina drain per event action
    drainStamina();

    // Momentum / confidence / form
    m.momentum   = Math.max(0, Math.min(100, m.momentum   + (success ?  8 : -8)));
    m.confidence = Math.max(0, Math.min(100, m.confidence + (success ?  5 : -5)));
    m.formModifier = Math.max(-2, Math.min(2, m.formModifier + (success ? 0.5 : -0.5)));

    m.eventsResolved++;
    m.cascadeDepth++;

    if (m.cascadeDepth >= 3 && !m.cascadeBonus) {
      RatingEngine.apply('cascade_bonus');
      m.cascadeBonus = true;
    }

    if (choice.isEgo) m.egoChoicesMade++;

    // Weapon discovery
    if (p.weapon === 'discover' && !m.weaponDiscovered && m.eventsResolved >= 2) {
      discoverWeapon(choice);
    }

    const cascade = eventDef.cascades[choice.id];
    let next = success ? cascade.success : cascade.failure;

    // Fix 3: FOUL_AGAINST in the box → promote to PENALTY
    if (next === 'FOUL_AGAINST') {
      next = 'PENALTY_TRIGGER';
    }

    return {
      success, isNat20, isNat1,
      playerRoll, oppRoll,
      next,
      choice,
      eventDef,
    };
  },

  pickEvent(chanceType, excludeIds = []) {
    const pos = GameState.player.position;
    const pool = EVENT_POOL.filter(e =>
      e.positions.includes(pos) &&
      e.chanceTypes.includes(chanceType) &&
      !excludeIds.includes(e.id)
    );
    if (!pool.length) return null;
    const entry = pool[Math.floor(Math.random() * pool.length)];
    // Return full event def
    return EVENTS[entry.id] || null;
  },

  getEvent(id) {
    return EVENTS[id] || null;
  },
};

// ── STAMINA DRAIN ─────────────────────────────────────────────────────────────
// Fix 1: High work rate is now 3× base — stat 50 hits yellow ~min 40, red ~min 65

function drainStamina() {
  const m = GameState.match;
  const p = GameState.player;

  // Base drain per event action (not per minute — passive drain handles time)
  const baseDrain = { low: 0.5, medium: 1.2, high: 3.6 }[m.workRate];

  // staminaStat 42→1.0 scale factor, 68→0.23 (higher stat = slower drain)
  const staminaStat = p.stats.stamina || 50;
  const factor = 1 - (staminaStat - 42) / 78;  // 42→1.0, 68→0.67

  m.stamina = Math.max(0, m.stamina - baseDrain * factor);
}

function discoverWeapon(choice) {
  const m = GameState.match;
  const pitchType = choice.pitchType || '';
  const candidates = WEAPONS.filter(w => w.matches?.includes(pitchType));
  const chosen = candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
  m.weaponDiscovered = true;
  m.discoveredWeapon = chosen.id;
}
