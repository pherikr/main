import { GameState } from './GameState.js';
import { roll } from './dice.js';
import { EventEngine } from './EventEngine.js';
import { RatingEngine } from './RatingEngine.js';

// Opponent team stats (Academy tier fixed)
const OPPONENT = {
  midfield: 52,
  attack: 50,
  gk: 55,
  defence: 53,
};

const TEAM_BASE = {
  midfield: 54,
  attack: 56,
};

const CHANCE_TYPES = [
  'through_ball',
  'central',
  'wide',
  'counter',
  'free_kick',
  'corner',
  'corner_against',
];

const POSITION_CHANCE_WEIGHTS = {
  ST:  { through_ball: 3, central: 3, wide: 2, counter: 3, free_kick: 1, corner: 2, corner_against: 1, penalty: 0 },
  CAM: { central: 4, through_ball: 3, wide: 1, counter: 2, free_kick: 2, corner: 2, corner_against: 1, penalty: 0 },
  LW:  { wide: 4, through_ball: 2, counter: 3, central: 1, free_kick: 1, corner: 3, corner_against: 1, penalty: 0 },
  RW:  { wide: 4, through_ball: 2, counter: 3, central: 1, free_kick: 1, corner: 3, corner_against: 1, penalty: 0 },
};

export const MatchEngine = {
  // Run a single 3-minute possession tick. Returns { playerInvolved, eventDef, feedEntries }
  tick(minute) {
    const m = GameState.match;
    const p = GameState.player;
    const feedEntries = [];

    // Step 1: possession
    const ourMid = TEAM_BASE.midfield + statToMod(p.stats.vision);
    const theirMid = OPPONENT.midfield;
    const posRoll = roll('Possession', { stat: ourMid, extraMods: [] });
    const oppPosRoll = roll('Opp Possession', { stat: theirMid, extraMods: [] });
    const weHaveBall = posRoll.total >= oppPosRoll.total;

    if (!weHaveBall) {
      // Opponent builds attack
      const res = resolveOpponentAttack(minute);
      feedEntries.push(...res.feed);
      return { playerInvolved: false, eventDef: null, feedEntries };
    }

    // Step 2: do we reach final third
    const atkRoll = roll('Attack build-up', { stat: TEAM_BASE.attack, extraMods: [] });
    if (atkRoll.dice <= 6) {
      feedEntries.push(`${minute}' — Possession maintained. Patient build-up.`);
      return { playerInvolved: false, eventDef: null, feedEntries };
    }
    if (atkRoll.dice <= 12) {
      feedEntries.push(`${minute}' — Good move forward. Building pressure.`);
    }

    // Step 3: chance type
    const chanceType = pickChanceType(p.position);

    // Step 4: is player involved
    const involvedChance = calcInvolvementChance(chanceType, m, p);
    const involved = Math.random() * 100 < involvedChance;

    if (!involved) {
      // Background resolution
      const res = resolveBackground(chanceType, minute);
      feedEntries.push(...res.feed);
      if (res.goal) {
        m.score.us++;
        feedEntries.push(`⚽ GOAL! ${m.score.us}–${m.score.them} — Brilliant team move!`);
      }
      return { playerInvolved: false, eventDef: null, feedEntries };
    }

    // Player involved — pick event
    const eventDef = EventEngine.pickEvent(chanceType);
    if (!eventDef) {
      feedEntries.push(`${minute}' — You're involved. Chance comes to nothing.`);
      return { playerInvolved: false, eventDef: null, feedEntries };
    }

    return { playerInvolved: true, eventDef, feedEntries, chanceType };
  },

  // Resolve a terminal event outcome (goal, assist, etc.)
  resolveTerminal(terminalId, minute) {
    const m = GameState.match;
    const entries = [];

    switch (terminalId) {
      case 'GOAL':
        m.score.us++;
        m.goals++;
        RatingEngine.apply('goal');
        entries.push(`⚽ GOAL! ${m.score.us}–${m.score.them} — You find the net!`);
        m.momentum = Math.min(100, m.momentum + 20);
        break;
      case 'ASSIST':
        m.score.us++;
        m.assists++;
        RatingEngine.apply('assist');
        entries.push(`🎯 ASSIST! ${m.score.us}–${m.score.them} — Perfect delivery!`);
        m.momentum = Math.min(100, m.momentum + 15);
        break;
      case 'TEAMMATE_SCORES':
        m.score.us++;
        RatingEngine.apply('teammate_scores');
        entries.push(`⚽ GOAL! ${m.score.us}–${m.score.them} — Your teammate converts!`);
        m.momentum = Math.min(100, m.momentum + 10);
        break;
      case 'SAVED':
        entries.push(`🧤 Keeper saves it! Good effort.`);
        break;
      case 'SAVED_REBOUND':
        entries.push(`🧤 Keeper tips it — corner won!`);
        break;
      case 'CLEARED':
        entries.push(`💨 Defender heads it clear.`);
        break;
      case 'HEADER_EVENT':
        entries.push(`📦 Ball in the box — teammate heads just over!`);
        break;
      case 'OPPOSITION_GOAL':
        m.score.them++;
        RatingEngine.apply('caught_upfield');
        entries.push(`😤 ${m.score.us}–${m.score.them} — They score. You were caught upfield.`);
        m.momentum = Math.max(0, m.momentum - 20);
        break;
      case 'GOAL_MOUTH_SCRAMBLE':
        entries.push(`😅 Scramble in the box — somehow it stays out!`);
        break;
      case 'D_COUNTER':
        m.score.them++;
        RatingEngine.apply('lost_dangerous');
        entries.push(`💔 ${m.score.us}–${m.score.them} — Counter attack. They punish the loss.`);
        m.momentum = Math.max(0, m.momentum - 15);
        break;
      case 'LOSE_POSSESSION':
        RatingEngine.apply('lost_dangerous');
        entries.push(`😑 Possession lost. They clear it.`);
        break;
      case 'INTERCEPTED':
        entries.push(`✋ Intercepted. Good try.`);
        break;
      case 'FOUL_WON':
        entries.push(`📋 Foul won! Free kick to us.`);
        break;
      case 'POSSESSION':
        entries.push(`🔄 Possession maintained.`);
        break;
      case 'DEFENDER_BLOCKS':
        entries.push(`🚫 Defender gets across — blocked!`);
        break;
      case 'FINAL_WHISTLE_FAIL':
        entries.push(`📣 Chance gone. Final whistle coming soon.`);
        break;
      case 'A2_KEEPER':
        // cascade to A2 handled by EventEngine, this is just fallback
        entries.push(`You're through on goal...`);
        break;
      case 'NEAR_MISS':
        entries.push(`😬 So close! Ball clips the post and goes wide.`);
        break;
      case 'BLOCKED':
        entries.push(`🚫 Defender throws himself in front — blocked!`);
        break;
      case 'CORNER_WON':
        entries.push(`🚩 Corner won! Good delivery coming up.`);
        break;
      case 'GOAL_KICK':
        entries.push(`⬆ Too high — keeper takes the goal kick.`);
        break;
      case 'FOUL_AGAINST':
        entries.push(`📋 Foul given against you. Free kick to them.`);
        break;
      case 'COUNTER_DANGER':
        m.score.them++;
        RatingEngine.apply('caught_upfield');
        entries.push(`💔 ${m.score.us}–${m.score.them} — Counter. They punish the gamble.`);
        m.momentum = Math.max(0, m.momentum - 20);
        break;
      case 'POSSESSION_RESET':
        entries.push(`🔄 Possession retained. Team resets.`);
        break;
      default:
        entries.push(`${minute}' — Play continues.`);
    }

    return entries;
  },

  drainStaminaPassive(minutes) {
    const m = GameState.match;
    const p = GameState.player;
    // Fix 1: aggressive high-rate drain — stat 50 on high hits yellow ~min 40, red ~min 65
    // Base per-minute: low=0.15, medium=0.4, high=1.1
    const drainPerMin = { low: 0.15, medium: 0.4, high: 1.1 }[m.workRate];
    const staminaStat = p.stats.stamina || 50;
    const factor = 1 - (staminaStat - 42) / 78;  // 42→1.0, 68→0.67
    m.stamina = Math.max(0, m.stamina - drainPerMin * minutes * factor);
  },
};

function statToMod(stat) {
  return Math.round((stat - 55) / 4);
}

function pickChanceType(position) {
  const weights = POSITION_CHANCE_WEIGHTS[position] || POSITION_CHANCE_WEIGHTS.ST;
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [type, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return type;
  }
  return 'central';
}

function calcInvolvementChance(chanceType, m, p) {
  let base = 40;
  const wrMod = { low: -20, medium: 0, high: 25 }[m.workRate];
  const scoreDiff = m.score.us - m.score.them;
  const urgencyMod = scoreDiff < 0 ? 15 : 0;
  const staminaPenalty = m.stamina < 40 ? -10 : 0;
  return Math.min(90, Math.max(5, base + wrMod + urgencyMod + staminaPenalty));
}

function resolveBackground(chanceType, minute) {
  const feed = [];
  const r = Math.random();

  if (r > 0.8) {
    feed.push(`${minute}' — Teammate drives forward...`);
    return { goal: true, feed };
  }
  if (r > 0.5) {
    feed.push(`${minute}' — Shot on target — keeper holds!`);
    return { goal: false, feed };
  }
  feed.push(`${minute}' — Chance comes to nothing. Play resets.`);
  return { goal: false, feed };
}

function resolveOpponentAttack(minute) {
  const m = GameState.match;
  const feed = [];
  const r = Math.random();

  if (r > 0.85) {
    m.score.them++;
    feed.push(`💔 ${m.score.us}–${m.score.them} — They break through and score!`);
    m.momentum = Math.max(0, m.momentum - 15);
  } else if (r > 0.6) {
    feed.push(`${minute}' — They press. Our keeper claims it.`);
  } else {
    feed.push(`${minute}' — Opposition build-up comes to nothing.`);
  }
  return { feed };
}
