// ═══════════════════════════════════════════════════════════════════════
// STRIKER RPG — FLAVOR EVENTS v1.0
// Manager events, referee events, yellow card system,
// celebration pool, in-game stats block
// ADD THESE TO events_bank_v3.js EVENTS object
// ═══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// MANAGER EVENTS
// ─────────────────────────────────────────────────────────────────────
// These fire based on match state, not chanceType
// Trigger conditions defined in minuteGate + triggerCondition
// ─────────────────────────────────────────────────────────────────────

export const MANAGER_EVENTS = {

  MANAGER_TRACK_BACK: {
    id: 'MANAGER_TRACK_BACK',
    type: 'manager',
    pitchMap: 'high_pressure',
    minuteGate: { min: 30, max: 85 },
    // Fires when: trailing by 1+ OR player rating < 6.0
    triggerCondition: (gs) =>
      gs.match.score.them > gs.match.score.us ||
      gs.match.rating < 6.0,
    narrative: (gs) => {
      const losing = gs.match.score.them > gs.match.score.us;
      const badPerf = gs.match.rating < 6.0;
      if (losing && badPerf) return `${gs.match.minute}' — The manager is on his feet on the touchline. He's looking directly at you, pointing at the ground in front of him. "GET BACK! TRACK YOUR RUNNER!" The whole dugout is up. He means you. Right now.`;
      if (losing) return `${gs.match.minute}' — From the touchline, loud and clear: "TRACK BACK! We need you tracking that right midfielder — he's been free all half." He's right. You've been ignoring him.`;
      return `${gs.match.minute}' — The manager catches your eye from the touchline. Taps his wrist. Points back. "You're not working hard enough off the ball. Track your runner or you're coming off."`;
    },
    choices: [
      {
        id: 'switch_defensive',
        label: 'Do as he says — switch to defensive mentality',
        desc: 'Track back. Do the dirty work. Manager happy.',
        isEgo: false,
        yourStats: ['composure', 'positioning'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
        managerEffect: { relationship: +8, confidence: +3 },
      },
      {
        id: 'ignore_manager',
        label: 'Ignore him — stay forward',
        desc: 'You\'re a striker. Defending isn\'t your job.',
        isEgo: true,
        yourStats: ['composure', 'positioning'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        managerEffect: { relationship: -12, confidence: +2 },
      },
      {
        id: 'half_effort',
        label: 'Jog back — show willing but stay high',
        desc: 'Pretend to track. Stay available for the counter.',
        isEgo: false,
        yourStats: ['intelligence', 'composure'],
        oppStats: ['positioning', 'pace'],
        statGate: { stat: 'intelligence', min: 55 },
        weaponBoost: [],
        smartBonus: false,
        managerEffect: { relationship: +2, confidence: +1 },
      },
    ],
    cascades: {
      switch_defensive: { success: 'POSSESSION_RESET', failure: 'OPPOSITION_ATTACK' },
      ignore_manager:   { success: 'OPPOSITION_ATTACK', failure: 'OPPOSITION_ATTACK' },
      half_effort:      { success: 'POSSESSION_RESET', failure: 'OPPOSITION_ATTACK' },
    },
  },

  MANAGER_HALFTIME_BLAST: {
    id: 'MANAGER_HALFTIME_BLAST',
    type: 'manager',
    pitchMap: 'high_pressure',
    minuteGate: { min: 45, max: 46 },
    triggerCondition: (gs) =>
      gs.match.rating < 6.5 || gs.match.score.them > gs.match.score.us,
    narrative: (gs) => {
      const losing = gs.match.score.them > gs.match.score.us;
      if (losing) return `HALF TIME — The dressing room is quiet in the wrong way. The manager paces. Then he stops, looks at you specifically. "First half — not good enough. You had three chances and wasted all of them. Second half you either turn it around or you're watching the last twenty from that bench. Understood?"`;
      return `HALF TIME — "You've been decent. But decent won't win us anything." He circles the room. "Second half — more intensity. More press. And I want you dropping in when we don't have the ball. We work as a team or we don't work at all."`;
    },
    choices: [
      {
        id: 'accept_blast',
        label: '"I\'ll be better second half."',
        desc: 'Take it. Channel it. Professionalism.',
        isEgo: false,
        yourStats: ['composure', 'intelligence'],
        oppStats: ['composure', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
        managerEffect: { relationship: +6, confidence: +8 },
      },
      {
        id: 'argue_back',
        label: '"Give me the ball more and I\'ll score."',
        desc: 'Push back. You might be right. But he might sub you.',
        isEgo: true,
        yourStats: ['composure', 'intelligence'],
        oppStats: ['composure', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        managerEffect: { relationship: -15, confidence: +5 },
      },
      {
        id: 'stay_silent',
        label: 'Say nothing. Nod. Walk out first.',
        desc: 'Let your football do the talking.',
        isEgo: false,
        yourStats: ['intelligence', 'composure'],
        oppStats: ['composure', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        managerEffect: { relationship: +3, confidence: +4 },
      },
    ],
    cascades: {
      accept_blast: { success: 'SECOND_HALF_BOOST', failure: 'POSSESSION_RESET' },
      argue_back:   { success: 'SECOND_HALF_BOOST', failure: 'SUB_RISK' },
      stay_silent:  { success: 'SECOND_HALF_BOOST', failure: 'POSSESSION_RESET' },
    },
  },

  MANAGER_PRAISE: {
    id: 'MANAGER_PRAISE',
    type: 'manager',
    pitchMap: 'high_pressure',
    minuteGate: { min: 60, max: 85 },
    triggerCondition: (gs) =>
      gs.match.rating >= 7.5 && gs.match.goals >= 1,
    narrative: (gs) => {
      return `${gs.match.minute}' — You catch the manager's eye from the touchline. He's not shouting. He just nods — the kind of nod that means more than anything he could say. Then he points forward. He trusts you. He wants you higher.`;
    },
    choices: [
      {
        id: 'push_higher',
        label: 'Push higher — trust the signal',
        desc: 'Respond to the trust. Get in behind.',
        isEgo: false,
        yourStats: ['pace', 'positioning'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: ['channel_runner', 'blind_spot_ghost'],
        smartBonus: true,
        managerEffect: { relationship: +5, confidence: +6 },
      },
      {
        id: 'stay_disciplined',
        label: 'Stay in your position — don\'t get greedy',
        desc: 'You\'re playing well. Don\'t change what\'s working.',
        isEgo: false,
        yourStats: ['composure', 'intelligence'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        managerEffect: { relationship: +3, confidence: +3 },
      },
    ],
    cascades: {
      push_higher:      { success: 'A1_KEEPER', failure: 'LOSE_POSSESSION' },
      stay_disciplined: { success: 'POSSESSION_RESET', failure: 'POSSESSION_RESET' },
    },
  },

};

// ─────────────────────────────────────────────────────────────────────
// OPPOSITION ATTACK EVENT
// Fires when player ignores manager / fails defensive transition
// ─────────────────────────────────────────────────────────────────────

export const OPPOSITION_EVENTS = {

  OPPOSITION_ATTACK: {
    id: 'OPPOSITION_ATTACK',
    type: 'defensive',
    pitchMap: 'own_box_corner',
    minuteGate: null,
    narrative: (gs) => {
      return `Your runner has the ball. You were supposed to be marking him. He's turned and he's running at goal with space — because you weren't there. He's twenty yards out, shooting lane open. What do you do?`;
    },
    choices: [
      {
        id: 'clean_tackle',
        label: 'Sprint and tackle — take it off him cleanly',
        desc: 'Close him down from behind. Get the timing right.',
        isEgo: false,
        yourStats: ['pace', 'positioning'],
        oppStats: ['pace', 'dribbling'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'two_footer',
        label: 'Two-foot him — stop the attack',
        desc: 'Stop him any way you can. Red card risk.',
        isEgo: true,
        yourStats: ['physicality', 'composure'],
        oppStats: ['pace', 'agility'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        redCardRisk: true,
      },
      {
        id: 'abandon_run_counter',
        label: 'Don\'t track — peel off for the counter',
        desc: 'Let them have it. You\'ll score at the other end.',
        isEgo: true,
        yourStats: ['pace', 'intelligence'],
        oppStats: ['pace', 'positioning'],
        statGate: null,
        weaponBoost: ['channel_runner'],
        smartBonus: false,
      },
    ],
    cascades: {
      clean_tackle:         { success: 'COUNTER_CASCADE', failure: 'OPPOSITION_GOAL' },
      two_footer:           { success: 'FOUL_GIVEN_DANGER', failure: 'RED_CARD_EVENT' },
      abandon_run_counter:  { success: 'COUNTER_CASCADE', failure: 'OPPOSITION_GOAL' },
    },
  },

};

// ─────────────────────────────────────────────────────────────────────
// REFEREE EVENTS
// Random triggers across the match
// ─────────────────────────────────────────────────────────────────────

export const REFEREE_EVENTS = {

  REF_FOUL_GIVEN_YOU: {
    id: 'REF_FOUL_GIVEN_YOU',
    type: 'referee',
    pitchMap: 'box_entry',
    minuteGate: null,
    narrative: (gs) => {
      return `${gs.match.minute}' — The defender clips your heel as you turn. You go down. The referee blows. Free kick to you — good position, twenty-five yards. The defender is in his face arguing. The ref doesn't want to hear it.`;
    },
    choices: [
      {
        id: 'get_up_quickly',
        label: 'Get up fast — show no pain',
        desc: 'Look strong. Don\'t waste time on the ground.',
        isEgo: false,
        yourStats: ['composure', 'physicality'],
        oppStats: ['composure', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
        ratingEffect: +0.1,
      },
      {
        id: 'stay_down',
        label: 'Stay down — milk it',
        desc: 'Take a breather. Kill some clock.',
        isEgo: false,
        yourStats: ['intelligence', 'composure'],
        oppStats: ['positioning', 'composure'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        ratingEffect: -0.1,
      },
      {
        id: 'confront_defender',
        label: 'Get in his face — let him know',
        desc: 'Assert yourself. Yellow card risk.',
        isEgo: true,
        yourStats: ['composure', 'intelligence'],
        oppStats: ['composure', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        yellowCardRisk: true,
        ratingEffect: 0,
      },
    ],
    cascades: {
      get_up_quickly:    { success: 'SP_FREEKICK_CLOSE', failure: 'SP_FREEKICK_CLOSE' },
      stay_down:         { success: 'SP_FREEKICK_CLOSE', failure: 'SP_FREEKICK_CLOSE' },
      confront_defender: { success: 'SP_FREEKICK_CLOSE', failure: 'YELLOW_CARD_EVENT' },
    },
  },

  REF_OFFSIDE_CALL: {
    id: 'REF_OFFSIDE_CALL',
    type: 'referee',
    pitchMap: 'counter_attack',
    minuteGate: null,
    narrative: (gs) => {
      return `${gs.match.minute}' — You time the run and burst in behind. The ball is perfect. You're through — and then the flag goes up. Offside. You stop. Look back. The linesman's arm is raised. Was it tight? Absolutely. Was it offside? You're not sure. Neither is anyone else.`;
    },
    choices: [
      {
        id: 'accept_decision',
        label: 'Accept it — get back in position',
        desc: 'Professionalism. The ref saw what he saw.',
        isEgo: false,
        yourStats: ['composure', 'intelligence'],
        oppStats: ['composure', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
        ratingEffect: +0.1,
      },
      {
        id: 'argue_offside',
        label: 'Argue with the linesman',
        desc: 'You were on. Let him know.',
        isEgo: true,
        yourStats: ['composure', 'intelligence'],
        oppStats: ['composure', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        yellowCardRisk: true,
        ratingEffect: -0.1,
      },
    ],
    cascades: {
      accept_decision: { success: 'POSSESSION_RESET', failure: 'POSSESSION_RESET' },
      argue_offside:   { success: 'POSSESSION_RESET', failure: 'YELLOW_CARD_EVENT' },
    },
  },

  REF_PENALTY_APPEAL: {
    id: 'REF_PENALTY_APPEAL',
    type: 'referee',
    pitchMap: 'box_entry',
    minuteGate: null,
    narrative: (gs) => {
      return `${gs.match.minute}' — You go down in the box. Contact? Definitely some. Enough for a penalty? The referee looks at you, then at the defender. He waves play on. You can't believe it. Neither can half the stadium.`;
    },
    choices: [
      {
        id: 'appeal_calmly',
        label: 'Show him the arm on your back — appeal',
        desc: 'Reasonable appeal. Won\'t work but won\'t cost you.',
        isEgo: false,
        yourStats: ['composure', 'intelligence'],
        oppStats: ['composure', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
        ratingEffect: 0,
      },
      {
        id: 'surround_ref',
        label: 'Surround the ref with teammates',
        desc: 'Maximum pressure. High yellow card risk.',
        isEgo: true,
        yourStats: ['composure', 'intelligence'],
        oppStats: ['composure', 'composure'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        yellowCardRisk: true,
        ratingEffect: -0.1,
      },
      {
        id: 'get_on_with_it',
        label: 'Get up and get on with it',
        desc: 'Channel the frustration into the next action.',
        isEgo: false,
        yourStats: ['composure', 'positioning'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        ratingEffect: +0.2,
        momentumBoost: +5,
      },
    ],
    cascades: {
      appeal_calmly:   { success: 'POSSESSION_RESET', failure: 'POSSESSION_RESET' },
      surround_ref:    { success: 'POSSESSION_RESET', failure: 'YELLOW_CARD_EVENT' },
      get_on_with_it:  { success: 'A1',               failure: 'POSSESSION_RESET' },
    },
  },

  REF_LAST_MAN_FOUL: {
    id: 'REF_LAST_MAN_FOUL',
    type: 'referee',
    pitchMap: 'counter_attack',
    minuteGate: { min: 60, max: 90 },
    triggerCondition: (gs) => gs.match.yellows >= 1,
    narrative: (gs) => {
      return `${gs.match.minute}' — You're through on goal and the defender has come from nowhere and hauled you down. Last man. The referee reaches for his pocket. You already have a yellow. The whole stadium holds its breath.`;
    },
    choices: [
      {
        id: 'accept_fate',
        label: 'Accept the decision — stay calm',
        desc: 'You know what\'s coming. Handle it with dignity.',
        isEgo: false,
        yourStats: ['composure', 'intelligence'],
        oppStats: ['composure', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
        ratingEffect: +0.1,
      },
      {
        id: 'beg_ref',
        label: 'Plead with the referee — beg for yellow',
        desc: 'Long shot. But it happens.',
        isEgo: false,
        yourStats: ['intelligence', 'composure'],
        oppStats: ['composure', 'composure'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
        ratingEffect: 0,
      },
    ],
    cascades: {
      accept_fate: { success: 'PENALTY',   failure: 'PENALTY' },
      beg_ref:     { success: 'PENALTY',   failure: 'RED_CARD_EVENT' },
    },
  },

};

// ─────────────────────────────────────────────────────────────────────
// YELLOW CARD & RED CARD TERMINAL EVENTS
// These resolve as terminals but with special state effects
// Add these cases to MatchEngine.resolveTerminal()
// ─────────────────────────────────────────────────────────────────────

export const CARD_TERMINALS = {

  YELLOW_CARD_EVENT: {
    resolve: (gs) => {
      // Don't set state here — giveCard() in controller handles everything
      // Just return feed text so MatchEngine can push it, then controller calls giveCard
      return ['__GIVE_YELLOW__'];
    },
  },

  RED_CARD_EVENT: {
    resolve: (gs) => {
      return ['__GIVE_RED__'];
    },
  },

  FOUL_GIVEN_DANGER: {
    resolve: (gs) => {
      // This is a yellow — may become red if second yellow
      return ['__GIVE_YELLOW__'];
    },
  },

  DIVE_CAUGHT: {
    resolve: (gs) => {
      return ['__GIVE_YELLOW__', `${gs.match.minute}' — Simulation! The referee wasn't fooled.`];
    },
  },

  SECOND_HALF_BOOST: {
    resolve: (gs) => {
      gs.match.confidence = Math.min(100, gs.match.confidence + 10);
      gs.match.momentum   = Math.min(100, gs.match.momentum + 8);
      return [`${gs.match.minute}' — Second half. The talk at half time landed.`];
    },
  },

  SUB_RISK: {
    resolve: (gs) => {
      gs.match.subRisk = true;
      return [`${gs.match.minute}' — The manager is watching. One more poor decision and you might find yourself on the bench.`];
    },
  },

};

// ─────────────────────────────────────────────────────────────────────
// CELEBRATION POOL
// Fires after every GOAL terminal
// ─────────────────────────────────────────────────────────────────────

export const CELEBRATIONS = [
  {
    id: 'shirt_off',
    label: 'Shirt off — pure emotion',
    desc: 'You rip your shirt off and sprint to the corner flag. The crowd explodes.',
    isEgo: true,
    yellowCardRisk: true, // automatic yellow
    ratingBonus: +0.2,
    narrative: 'You rip your shirt off before you even know you\'re doing it. The yellow card comes immediately. Worth every second.',
  },
  {
    id: 'gyokeres_mask',
    label: 'The mask — pull it up',
    desc: 'You mime putting on the mask. The crowd loses it.',
    isEgo: true,
    yellowCardRisk: false,
    ratingBonus: +0.3,
    narrative: 'The mask goes on. The crowd roar doubles. You hold it for a moment — then point at the badge.',
  },
  {
    id: 'slide_corner',
    label: 'Slide to the corner flag',
    desc: 'Classic. Slide on your knees all the way to the flag.',
    isEgo: false,
    yellowCardRisk: false,
    ratingBonus: +0.1,
    narrative: 'You drop to your knees and slide. Teammates pile on. The bench empties.',
  },
  {
    id: 'point_sky',
    label: 'Point to the sky',
    desc: 'Quiet dedication. Personal moment.',
    isEgo: false,
    yellowCardRisk: false,
    ratingBonus: +0.1,
    narrative: 'You stop. Point up. A private moment in the most public arena in the world.',
  },
  {
    id: 'run_bench',
    label: 'Sprint to the bench — celebrate with the staff',
    desc: 'Team celebration. The subs and coaches mob you.',
    isEgo: false,
    yellowCardRisk: false,
    ratingBonus: +0.15,
    narrative: 'You sprint straight to the bench. The whole dugout empties. The manager catches you and shakes you.',
  },
  {
    id: 'calm_walk',
    label: 'Walk back calmly — like you expected it',
    desc: 'Cold. Efficient. Zero emotion.',
    isEgo: true,
    yellowCardRisk: false,
    ratingBonus: +0.2,
    narrative: 'You turn. Walk back. No celebration. Like scoring here is the most natural thing in the world. The crowd murmurs.',
  },
  {
    id: 'robot',
    label: 'The robot',
    desc: 'Lock up. Do the robot. You\'ve been waiting to do this all season.',
    isEgo: true,
    yellowCardRisk: false,
    ratingBonus: +0.15,
    narrative: 'You lock your arms. Start the robot. The crowd doesn\'t know whether to laugh or roar. They do both.',
  },
  {
    id: 'teammate_piggyback',
    label: 'Jump on your teammate\'s back',
    desc: 'Find the teammate who set you up. Thank him properly.',
    isEgo: false,
    yellowCardRisk: false,
    ratingBonus: +0.2,
    narrative: 'You find him immediately and jump on his back. He almost goes down. The crowd love it.',
  },
  {
    id: 'baby_cradle',
    label: 'Baby cradle — for someone back home',
    desc: 'Rock the invisible baby. There\'s someone this one\'s for.',
    isEgo: false,
    yellowCardRisk: false,
    ratingBonus: +0.15,
    narrative: 'You cradle your arms. Rock gently. The stadium understands immediately. Somebody at home just started crying.',
  },
  {
    id: 'phone_call',
    label: 'Pretend to make a phone call',
    desc: 'Classic. Ring ring.',
    isEgo: true,
    yellowCardRisk: false,
    ratingBonus: +0.1,
    narrative: 'You hold your hand to your ear. Ring ring. The crowd laughs and roars simultaneously.',
  },
];

// ─────────────────────────────────────────────────────────────────────
// IN-GAME STATS BLOCK
// Calculated values shown in match HUD
// ─────────────────────────────────────────────────────────────────────

export const STATS_BLOCK = {

  // Estimate touches based on position, work rate, events resolved, performance
  estimateTouches: (gs) => {
    const m = gs.match;
    const p = gs.player;
    const minutesPlayed = Math.min(90, m.minute);
    const posBase = { ST: 28, CAM: 45, LW: 35, RW: 35 }[p.position] || 32;
    const wrMod  = { low: 0.7, medium: 1.0, high: 1.3 }[m.workRate];
    const ratingMod = m.rating >= 7.5 ? 1.25 : m.rating >= 6.5 ? 1.0 : m.rating >= 5.5 ? 0.8 : 0.6;
    const eventMod = 1 + (m.eventsResolved || 0) * 0.08;
    const raw = (posBase * (minutesPlayed / 90)) * wrMod * ratingMod * eventMod;
    return Math.max(4, Math.round(raw));
  },

  // Estimate shots based on events resolved, goals, near misses
  estimateShots: (gs) => {
    const m = gs.match;
    const goalsAndMisses = (m.goals || 0) + (m.shotsOnTarget || 0) + (m.shotsMissed || 0);
    const eventShots = Math.floor((m.eventsResolved || 0) * 0.55);
    return Math.max(0, Math.max(goalsAndMisses, eventShots));
  },

  // Duel count estimate
  estimateDuels: (gs) => {
    const m = gs.match;
    return Math.max(0, Math.round((m.eventsResolved || 0) * 0.7));
  },

};

// ─────────────────────────────────────────────────────────────────────
// HUD STATS BLOCK HTML
// Add this to matchHUD() in screens.js
// ─────────────────────────────────────────────────────────────────────

export function renderStatsBlock(gs) {
  const m = gs.match;
  const touches = STATS_BLOCK.estimateTouches(gs);
  const shots   = STATS_BLOCK.estimateShots(gs);
  const duels   = STATS_BLOCK.estimateDuels(gs);
  const yellows = m.yellows || 0;
  const cardHtml = yellows === 1
    ? '<span class="stat-card-badge yellow">🟨</span>'
    : yellows >= 2 || m.redCard
    ? '<span class="stat-card-badge red">🟥</span>'
    : '';

  return `
<div class="hud-stats-block">
  <div class="hsb-item">
    <span class="hsb-val">${m.goals || 0}</span>
    <span class="hsb-label">G</span>
  </div>
  <div class="hsb-item">
    <span class="hsb-val">${m.assists || 0}</span>
    <span class="hsb-label">A</span>
  </div>
  <div class="hsb-item">
    <span class="hsb-val">${shots}</span>
    <span class="hsb-label">SH</span>
  </div>
  <div class="hsb-item">
    <span class="hsb-val">${touches}</span>
    <span class="hsb-label">TCH</span>
  </div>
  <div class="hsb-item">
    <span class="hsb-val">${duels}</span>
    <span class="hsb-label">DLS</span>
  </div>
  ${cardHtml ? `<div class="hsb-item">${cardHtml}</div>` : ''}
</div>`;
}

// ─────────────────────────────────────────────────────────────────────
// CSS to add to style.css for stats block and card badges
// ─────────────────────────────────────────────────────────────────────

export const STATS_CSS = `
.hud-stats-block {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 12px;
  background: rgba(0,0,0,0.5);
  border-top: 0.5px solid rgba(255,255,255,0.08);
}
.hsb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 28px;
}
.hsb-val {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #f0ede6;
  line-height: 1;
}
.hsb-label {
  font-size: 8px;
  color: rgba(255,255,255,0.35);
  letter-spacing: .08em;
  text-transform: uppercase;
  font-family: 'Barlow Condensed', sans-serif;
}
.stat-card-badge {
  font-size: 14px;
}
`;
