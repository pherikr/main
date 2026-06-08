import { GameState } from './GameState.js';
import { roll } from './dice.js';
import { EventEngine } from './EventEngine.js';
import { RatingEngine } from './RatingEngine.js';
import { MANAGER_EVENTS, REFEREE_EVENTS, CARD_TERMINALS, OPPOSITION_EVENTS } from '../data/events_flavor.js';

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

    // Check manager event triggers
    const managerEvent = checkManagerEventTrigger(minute);
    if (managerEvent) {
      return { playerInvolved: true, eventDef: managerEvent, feedEntries };
    }

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
      // 4% chance of referee event when not player-involved
      if (Math.random() > 0.96) {
        const refEvent = pickRefereeEvent(minute);
        if (refEvent) return { playerInvolved: true, eventDef: refEvent, feedEntries };
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
        m.shotsOnTarget = (m.shotsOnTarget || 0) + 1;
        entries.push(`🧤 Keeper saves it! Good effort.`);
        break;
      case 'SAVED_REBOUND':
        m.shotsOnTarget = (m.shotsOnTarget || 0) + 1;
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
        m.shotsMissed = (m.shotsMissed || 0) + 1;
        entries.push(`😬 So close! Ball clips the post and goes wide.`);
        break;
      case 'BLOCKED':
        m.shotsMissed = (m.shotsMissed || 0) + 1;
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
      case 'YELLOW_CARD_EVENT': {
        const r1 = CARD_TERMINALS.YELLOW_CARD_EVENT.resolve(GameState);
        r1.forEach(e => entries.push(e));
        break;
      }
      case 'RED_CARD_EVENT': {
        const r2 = CARD_TERMINALS.RED_CARD_EVENT.resolve(GameState);
        r2.forEach(e => entries.push(e));
        break;
      }
      case 'FOUL_GIVEN_DANGER': {
        const r3 = CARD_TERMINALS.FOUL_GIVEN_DANGER.resolve(GameState);
        r3.forEach(e => entries.push(e));
        break;
      }
      case 'DIVE_CAUGHT': {
        const r4 = CARD_TERMINALS.DIVE_CAUGHT.resolve(GameState);
        r4.forEach(e => entries.push(e));
        break;
      }
      case 'SECOND_HALF_BOOST': {
        const r5 = CARD_TERMINALS.SECOND_HALF_BOOST.resolve(GameState);
        r5.forEach(e => entries.push(e));
        break;
      }
      case 'SUB_RISK': {
        const r6 = CARD_TERMINALS.SUB_RISK.resolve(GameState);
        r6.forEach(e => entries.push(e));
        break;
      }
      case 'OPPOSITION_GOAL': {
        const oppNarr = pickOppositionGoalNarrative(minute);
        m.score.them++;
        RatingEngine.apply('caught_upfield');
        entries.push(`💀 ${m.score.us}–${m.score.them} — ${oppNarr}`);
        m.momentum = Math.max(0, m.momentum - 20);
        m.lastOppGoalNarrative = oppNarr;
        m.oppGoalJustScored = true;
        break;
      }
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
  // Team plays weaker with red card (10 men)
  const goalThreshold = 0.8 * getTeamPenalty();

  if (r > goalThreshold) {
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

function checkManagerEventTrigger(minute) {
  const m = GameState.match;
  if (minute === 45 && MANAGER_EVENTS.MANAGER_HALFTIME_BLAST.triggerCondition(GameState)) {
    return MANAGER_EVENTS.MANAGER_HALFTIME_BLAST;
  }
  if (!m.managerTrackBackFired && minute >= 30 && Math.random() > 0.94) {
    if (MANAGER_EVENTS.MANAGER_TRACK_BACK.triggerCondition(GameState)) {
      m.managerTrackBackFired = true;
      return MANAGER_EVENTS.MANAGER_TRACK_BACK;
    }
  }
  if (!m.managerPraiseFired && minute >= 60 && Math.random() > 0.96) {
    if (MANAGER_EVENTS.MANAGER_PRAISE.triggerCondition(GameState)) {
      m.managerPraiseFired = true;
      return MANAGER_EVENTS.MANAGER_PRAISE;
    }
  }
  return null;
}

function pickRefereeEvent(minute) {
  const m = GameState.match;
  const pool = [
    REFEREE_EVENTS.REF_FOUL_GIVEN_YOU,
    REFEREE_EVENTS.REF_OFFSIDE_CALL,
    REFEREE_EVENTS.REF_PENALTY_APPEAL,
  ];
  if (minute >= 60 && m.yellows >= 1) {
    pool.push(REFEREE_EVENTS.REF_LAST_MAN_FOUL);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function getTeamPenalty() {
  return GameState.match.redCard ? 0.75 : 1.0;
}

function resolveOpponentAttack(minute) {
  const m = GameState.match;
  const feed = [];
  // Red card makes opposition attacks more dangerous
  const goalThreshold = m.redCard ? 0.78 : 0.85;
  const r = Math.random();

  if (r > goalThreshold) {
    const narrative = pickOppositionGoalNarrative(minute);
    m.score.them++;
    m.momentum = Math.max(0, m.momentum - 15);
    feed.push(`💀 ${m.score.us}–${m.score.them} — ${narrative}`);
    m.lastOppGoalNarrative = narrative;
    m.oppGoalJustScored = true;
  } else if (r > 0.6) {
    feed.push(`${minute}' — They press. Our keeper claims it.`);
  } else {
    feed.push(`${minute}' — Opposition build-up comes to nothing.`);
  }
  return { feed };
}

function pickOppositionGoalNarrative(minute) {
  const narratives = [
    'A hopeful ball over the top and your keeper misjudges it completely. No excuses.',
    'Set piece routine — the near-post runner loses his marker and buries it.',
    'Counter attack. Three passes and it\'s in the net before your defence gets back.',
    'Long-range effort catches the keeper off his line. Stunning strike.',
    'A cross from the right — nobody attacks it and it floats straight in at the far post.',
    'Penalty. The referee points to the spot. No argument possible.',
    'A scramble in the box. Three attempts before it crosses the line. Messy but it counts.',
    'Their striker holds up play perfectly, turns, and drives low past the keeper.',
    'Corner. Their centre-back rises unmarked at the back post. Routine defending gone wrong.',
    'A catastrophic defensive error. The pass goes straight to him and he doesn\'t miss.',
    'Free kick, bending over the wall. The keeper gets a hand on it but can\'t keep it out.',
    'A through ball splits two defenders and the striker is through. Clinical finish.',
    'They work it short, pull it back, and the arriving midfielder hits it first time. Perfect.',
    'A deflection off a defender wrong-foots the keeper completely.',
    'Fast throw-in catches your team napping. He cuts inside and finishes low.',
    'The substitute has been on three minutes and scores immediately.',
    'A long throw into the box — flick-on and the striker turns and volleys home.',
    'Their winger beats the fullback for pace and crosses. The header is unstoppable.',
    'A goalkeeping error. He spills it and they follow up before anyone can react.',
    'The second ball falls to their midfielder twenty yards out. He doesn\'t think twice.',
  ];
  return narratives[Math.floor(Math.random() * narratives.length)];
}
