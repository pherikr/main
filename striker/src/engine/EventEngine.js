import { GameState } from './GameState.js';
import { EVENT_POOL, EVENTS } from '../data/events.js';
import { roll, statToModifier } from './dice.js';
import { RatingEngine } from './RatingEngine.js';
import { WEAPONS } from '../data/weapons.js';

// Build modifier stack for a choice roll
function buildModifiers(choice, eventDef) {
  const m = GameState.match;
  const p = GameState.player;
  const mods = [];

  // Smart bonus (non-ego choice = the situationally safer option)
  if (!choice.isEgo) {
    mods.push({ label: 'Smart choice', value: Math.floor(Math.random() * 3) + 1 });
  }

  // Ego bonus
  if (choice.isEgo && p.stats.ego >= 60) {
    mods.push({ label: 'Ego', value: 1 });
  }

  // Form modifier
  if (m.formModifier !== 0) {
    mods.push({ label: 'Form', value: m.formModifier });
  }

  // Stamina modifier
  const staminaMod = staminaMod_(m.stamina);
  if (staminaMod !== 0) {
    mods.push({ label: 'Stamina', value: staminaMod });
  }

  // Confidence
  if (m.confidence >= 70) mods.push({ label: 'Confidence', value: 1 });
  else if (m.confidence <= 30) mods.push({ label: 'Low confidence', value: -1 });

  // Weapon
  const weaponId = resolvedWeaponId();
  if (weaponId && choice.weaponBoost?.includes(weaponId)) {
    const w = WEAPONS.find(w => w.id === weaponId);
    if (w) mods.push({ label: `Weapon: ${w.name}`, value: w.bonus });
  }

  return mods;
}

function staminaMod_(stamina) {
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

function shouldHaveAdvantage(choice) {
  const m = GameState.match;
  const p = GameState.player;
  const statVal = p.stats[choice.stat] || 50;
  const weaponId = resolvedWeaponId();
  return (
    statVal >= 65 ||
    (weaponId && choice.weaponBoost?.includes(weaponId)) ||
    m.momentum >= 70 ||
    (m.confidence >= 70 && m.match?.workRate === 'high')
  );
}

function shouldHaveDisadvantage(choice) {
  const m = GameState.match;
  return (
    m.stamina < 39 ||
    m.momentum <= 30 ||
    m.rattled
  );
}

export const EventEngine = {
  // Filter choices based on stat gates / weapon gates
  filterChoices(eventDef) {
    const p = GameState.player;
    const weaponId = resolvedWeaponId();
    return eventDef.choices.filter(c => {
      if (c.statGate) {
        const val = p.stats[c.statGate.stat] || 0;
        if (val < c.statGate.min) return false;
      }
      if (c.weaponGate) {
        if (c.weaponGate !== weaponId) return false;
      }
      return true;
    });
  },

  // Resolve a player's choice in an event. Returns result object.
  resolve(eventDef, choice) {
    const m = GameState.match;
    const p = GameState.player;

    const statVal = p.stats[choice.stat] || 50;
    const extraMods = buildModifiers(choice, eventDef);

    const adv = shouldHaveAdvantage(choice) && !shouldHaveDisadvantage(choice);
    const dis = !adv && shouldHaveDisadvantage(choice);

    const result = roll(`${eventDef.id} — ${choice.label}`, {
      stat: statVal,
      advantage: adv,
      disadvantage: dis,
      extraMods,
    });

    // Defender roll (abstract opponent)
    const oppStat = 50 + Math.floor(Math.random() * 10); // 50-60
    const oppResult = roll(`${eventDef.id} — Opponent`, {
      stat: oppStat,
      extraMods: [],
    });

    const isNat20 = result.isNat20;
    const isNat1  = result.isNat1;
    let success = isNat20 ? true : isNat1 ? false : result.total > oppResult.total;

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

    // Stamina drain
    drainStamina();

    // Momentum
    m.momentum = Math.max(0, Math.min(100, m.momentum + (success ? 8 : -8)));
    m.confidence = Math.max(0, Math.min(100, m.confidence + (success ? 5 : -5)));
    m.formModifier = Math.max(-2, Math.min(2, m.formModifier + (success ? 0.5 : -0.5)));

    m.eventsResolved++;
    m.cascadeDepth++;

    // Cascade chain bonus
    if (m.cascadeDepth >= 3 && !m.cascadeBonus) {
      RatingEngine.apply('cascade_bonus');
      m.cascadeBonus = true;
    }

    // Determine next
    const cascade = eventDef.cascades[choice.id];
    const next = success ? cascade.success : cascade.failure;

    // Ego stat tracking
    if (choice.isEgo) m.egoChoicesMade++;

    // Weapon discovery
    if (p.weapon === 'discover' && !m.weaponDiscovered && m.eventsResolved >= 2) {
      discoverWeapon(choice);
    }

    return {
      success, isNat20, isNat1,
      playerRoll: result,
      oppRoll: oppResult,
      next,
      choice,
      eventDef,
    };
  },

  // Get a random event for a given chance type + player position
  pickEvent(chanceType, excludeIds = []) {
    const pos = GameState.player.position;
    const pool = EVENT_POOL.filter(e =>
      e.positions.includes(pos) &&
      e.chanceTypes.includes(chanceType) &&
      !excludeIds.includes(e.id)
    );
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  getEvent(id) {
    return EVENTS[id] || null;
  },
};

function drainStamina() {
  const m = GameState.match;
  const p = GameState.player;
  const baseDrain = { low: 0.3, medium: 0.6, high: 1.2 }[m.workRate];
  const staminaFactor = 1 - (p.stats.stamina - 42) / 52; // higher stamina = slower drain
  m.stamina = Math.max(0, m.stamina - baseDrain * (0.5 + staminaFactor));
}

function discoverWeapon(choice) {
  const m = GameState.match;
  const candidates = WEAPONS.filter(w => w.matches.includes(choice.pitchType));
  const chosen = candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
  m.weaponDiscovered = true;
  m.discoveredWeapon = chosen.id;
}
