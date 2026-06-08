// ═══════════════════════════════════════════════════════════════════════
// STRIKER RPG — EVENTS BANK v2.0
// Full event pool with narrative flavor + correct pitchMap zone names
//
// pitchMap zone names MUST match keys in pitchMap.js ZONE_CONFIGS:
// box_entry | shooting_chance | 1v1_keeper | half_chance
// counter_attack | wide_attack | overlap | through_ball_window
// tight_space | free_kick | corner | corner_attack
// own_box_corner | penalty_spot | two_v_one | high_pressure
// ═══════════════════════════════════════════════════════════════════════

export const EVENTS = {

  // ─────────────────────────────────────────────
  // ATTACKING
  // ─────────────────────────────────────────────

  A1: {
    id: 'A1',
    type: 'attacking',
    chanceTypes: ['central', 'through_ball'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'box_entry',
    narrative: (gs) => {
      const minute = gs.match.minute;
      const losing = gs.match.score.us < gs.match.score.them;
      if (losing) return `${minute}' — You need a moment and here it is. Ball to feet on the edge of the box, centre-back caught too high, his partner still recovering. You can hear your heart. He's watching your hips. He doesn't know yet which way you're going — but you do.`;
      return `${minute}' — The ball finds you on the edge of the area. The centre-back shifts across — he's not pressing, he's waiting. His body weight is wrong. One of you is about to look stupid. He's been in this position a thousand times. So have you.`;
    },
    choices: [
      {
        id: 'take_on',
        label: 'Drive at him',
        desc: 'Drop the shoulder, go hard at his weak side. Win it or lose it in one move.',
        isEgo: true,
        yourStats: ['dribbling', 'agility'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: null,
        weaponBoost: ['feint_master', 'blind_spot_ghost'],
        smartBonus: false,
      },
      {
        id: 'feint_shift',
        label: 'Feint and shift',
        desc: 'Show him one way. Go the other. Create the half-yard.',
        isEgo: false,
        yourStats: ['dribbling', 'balance'],
        oppStats: ['slideTackle', 'pace'],
        statGate: null,
        weaponBoost: ['feint_master'],
        smartBonus: true,
      },
      {
        id: 'pass_wide',
        label: 'Release it wide early',
        desc: 'Don\'t force it. Find the winger, keep the ball moving.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'hold_up',
        label: 'Back to defender, shield and wait',
        desc: 'Win the contact. Buy time for support. Needs strength.',
        isEgo: false,
        yourStats: ['physicality', 'balance'],
        oppStats: ['physicality', 'positioning'],
        statGate: { stat: 'physicality', min: 55 },
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      take_on:    { success: 'A1_KEEPER', failure: 'LOSE_POSSESSION' },
      feint_shift:{ success: 'A1_KEEPER', failure: 'A2_HALF' },
      pass_wide:  { success: 'C1_OVERLAP', failure: 'INTERCEPTED' },
      hold_up:    { success: 'POSSESSION_RESET', failure: 'LOSE_POSSESSION' },
    },
  },

  A2: {
    id: 'A2',
    type: 'attacking',
    chanceTypes: ['central', 'shooting'],
    positions: ['ST', 'CAM'],
    pitchMap: 'shooting_chance',
    narrative: (gs) => {
      const minute = gs.match.minute;
      const late = minute >= 75;
      if (late) return `${minute}' — Late in the game and the ball breaks your way. Half a yard. The keeper is slightly off his line, weight shifting left. The closing defender is four steps away. Everything narrows to this.`;
      return `${minute}' — Fifteen yards. The keeper's guessing. You have less than a second before the shape closes around you. Most players in this position think about missing. You think about where exactly you're putting it.`;
    },
    choices: [
      {
        id: 'low_driven',
        label: 'Low and driven — far post',
        desc: 'Open your body. Pick your spot. Technique over power.',
        isEgo: false,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_diving', 'gk_composure'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: true,
      },
      {
        id: 'power_shot',
        label: 'Hit it — pure venom',
        desc: 'Forget placement. If it\'s on target at that pace, he can\'t hold it.',
        isEgo: true,
        yourStats: ['finishing', 'physicality'],
        oppStats: ['gk_reflexes', 'gk_composure'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
      {
        id: 'take_touch',
        label: 'Take a touch — set the angle properly',
        desc: 'One extra touch for a better strike. The defender gets closer.',
        isEgo: false,
        yourStats: ['ballControl', 'composure'],
        oppStats: ['shortTackle', 'pace'],
        statGate: { stat: 'composure', min: 54 },
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'chip',
        label: 'Chip the keeper',
        desc: 'He\'s off his line. You see it. Nobody else in this stadium would try this.',
        isEgo: true,
        yourStats: ['finishing', 'vision'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: { stat: 'vision', min: 56 },
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      low_driven:  { success: 'GOAL',  failure: 'SAVED' },
      power_shot:  { success: 'GOAL',  failure: 'SAVED_REBOUND' },
      take_touch:  { success: 'GOAL',  failure: 'BLOCKED' },
      chip:        { success: 'GOAL',  failure: 'NEAR_MISS' },
    },
  },

  A3: {
    id: 'A3',
    type: 'attacking',
    chanceTypes: ['counter', 'through_ball'],
    positions: ['ST', 'LW', 'RW'],
    pitchMap: 'counter_attack',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — Fast break. You've burst clear off the last line and the defender scrambled back. He's on your shoulder now — stride for stride, breathing hard. Forty yards to the goal. The whole stadium stands up. This is what you were born for.`;
    },
    choices: [
      {
        id: 'cut_inside',
        label: 'Cut inside sharply',
        desc: 'Sharp change of direction at full speed. Leave him on the wrong foot.',
        isEgo: true,
        yourStats: ['agility', 'dribbling'],
        oppStats: ['pace', 'positioning'],
        statGate: null,
        weaponBoost: ['blind_spot_ghost', 'channel_runner'],
        smartBonus: false,
      },
      {
        id: 'power_through',
        label: 'Run through him — use the shoulder',
        desc: 'Physical battle. Win it with your body.',
        isEgo: true,
        yourStats: ['pace', 'physicality'],
        oppStats: ['physicality', 'pace'],
        statGate: { stat: 'physicality', min: 58 },
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'dummy',
        label: 'Peel away — let the ball run to the trailer',
        desc: 'You\'re the decoy. The trailing teammate gets the easier finish.',
        isEgo: false,
        yourStats: ['vision', 'composure'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: ['blind_spot_ghost'],
        smartBonus: true,
      },
    ],
    cascades: {
      cut_inside:    { success: 'A1_KEEPER', failure: 'LOSE_POSSESSION' },
      power_through: { success: 'A1_KEEPER', failure: 'FOUL_WON' },
      dummy:         { success: 'ASSIST',    failure: 'INTERCEPTED' },
    },
  },

  A4: {
    id: 'A4',
    type: 'attacking',
    chanceTypes: ['wide', 'counter'],
    positions: ['LW', 'RW'],
    pitchMap: 'wide_attack',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — Wide ball, fullback backpedalling. Space inside. Your striker is already making the near post run — he's been making it all half waiting for exactly this ball. The whole left side of their defence is exposed. The question is what you do with it.`;
    },
    choices: [
      {
        id: 'cut_shoot',
        label: 'Cut inside — shoot',
        desc: 'Onto your strong foot. You see the near corner open.',
        isEgo: true,
        yourStats: ['dribbling', 'finishing'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
      {
        id: 'whip_cross',
        label: 'Whip it in early — first time',
        desc: 'Before their shape organises. Hard, low cross.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'heading'],
        statGate: null,
        weaponBoost: ['set_piece_maestro'],
        smartBonus: true,
      },
      {
        id: 'take_on_fullback',
        label: 'Beat the fullback — get to the byline',
        desc: 'Go past him. Pull it back from the byline. Better angle but harder to get there.',
        isEgo: true,
        yourStats: ['dribbling', 'pace'],
        oppStats: ['shortTackle', 'pace'],
        statGate: null,
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
      {
        id: 'cutback',
        label: 'Show the cross — pull it back',
        desc: 'Fake the delivery. Cut it back. The arriving midfielder gets a clean shot.',
        isEgo: true,
        yourStats: ['dribbling', 'vision'],
        oppStats: ['positioning', 'shortTackle'],
        statGate: { stat: 'vision', min: 52 },
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
    ],
    cascades: {
      cut_shoot:       { success: 'GOAL',       failure: 'BLOCKED' },
      whip_cross:      { success: 'ASSIST',     failure: 'CLEARED' },
      take_on_fullback:{ success: 'C1_OVERLAP', failure: 'CORNER_WON' },
      cutback:         { success: 'ASSIST',     failure: 'INTERCEPTED' },
    },
  },

  A5: {
    id: 'A5',
    type: 'attacking',
    chanceTypes: ['central', 'through_ball'],
    positions: ['CAM', 'ST'],
    pitchMap: 'two_v_one',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — Your striker drops short to link play, you're running off him in behind. One defender between you both. He can only track one run. You\'ve practiced this. The timing is everything — too early and you're offside, too late and the space closes.`;
    },
    choices: [
      {
        id: 'one_two',
        label: 'Play the one-two',
        desc: 'Pass and go. Sharp, quick, split the defence.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'shoot_first',
        label: 'Ignore the combination — shoot',
        desc: 'Skip the one-two. Catch them before they\'ve set.',
        isEgo: true,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_reflexes', 'gk_diving'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
      {
        id: 'turn_run',
        label: 'Take a touch, turn and drive',
        desc: 'Create your own space. Back yourself one on one.',
        isEgo: false,
        yourStats: ['ballControl', 'dribbling'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: { stat: 'ballControl', min: 52 },
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      one_two:    { success: 'A1_KEEPER', failure: 'INTERCEPTED' },
      shoot_first:{ success: 'GOAL',     failure: 'SAVED' },
      turn_run:   { success: 'A2',       failure: 'LOSE_POSSESSION' },
    },
  },

  A6: {
    id: 'A6',
    type: 'attacking',
    chanceTypes: ['central', 'wide'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'high_pressure',
    narrative: (gs) => {
      const score = gs.match.score;
      const minute = gs.match.minute;
      const losing = score.us < score.them;
      const diff = score.them - score.us;
      if (losing && diff >= 2) return `${minute}' — Two goals down. The crowd has gone quiet in that particular way that means they\'ve already accepted it. You haven\'t. Ball to your feet in a dangerous position. If you don\'t make something happen here nobody will.`;
      if (losing) return `${minute}' — One behind. Clock ticking. Ball finds you and the half-chance is real. This is the moment where the game decides what kind of player you are.`;
      return `${minute}' — Game on the line. You receive in a dangerous position. The defender in front of you has barely broken sweat all match. He doesn\'t know you\'re about to ruin his evening.`;
    },
    choices: [
      {
        id: 'spin_run',
        label: 'Spin sharply — run at goal',
        desc: 'Force the issue. Make something happen.',
        isEgo: true,
        yourStats: ['dribbling', 'pace'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: null,
        weaponBoost: ['channel_runner', 'blind_spot_ghost'],
        smartBonus: false,
      },
      {
        id: 'quick_combo',
        label: 'Combination play — create the 2v1',
        desc: 'Short pass and move. Let the numbers do the work.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: { stat: 'vision', min: 50 },
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'long_shot_attempt',
        label: 'Pull the trigger from distance',
        desc: '25 yards. Nothing to lose. Hit it clean.',
        isEgo: true,
        yourStats: ['longShots', 'composure'],
        oppStats: ['gk_diving', 'gk_reflexes'],
        statGate: { stat: 'longShots', min: 50 },
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      spin_run:          { success: 'A1_KEEPER', failure: 'COUNTER_DANGER' },
      quick_combo:       { success: 'C1_OVERLAP', failure: 'INTERCEPTED' },
      long_shot_attempt: { success: 'GOAL',      failure: 'NEAR_MISS' },
    },
  },

  A7: {
    id: 'A7',
    type: 'attacking',
    chanceTypes: ['through_ball', 'counter'],
    positions: ['ST', 'LW', 'RW'],
    pitchMap: '1v1_keeper',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — You\'ve timed the run perfectly and now it\'s just you and the goalkeeper. The flag stays down. He comes out quick trying to make himself big, close the angle. He\'s good. So are you. Your legs are burning. Your mind is cold.`;
    },
    choices: [
      {
        id: 'round_keeper',
        label: 'Go round him',
        desc: 'Take it past him. Harder to execute but impossible to save once done.',
        isEgo: true,
        yourStats: ['dribbling', 'agility'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: null,
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
      {
        id: 'slot_low',
        label: 'Pick a corner — slot it low',
        desc: 'Composed. Clinical. Decide early and commit.',
        isEgo: false,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_diving', 'gk_reflexes'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: true,
      },
      {
        id: 'chip_1v1',
        label: 'Chip him',
        desc: 'He\'s committed early. Loft it over. If it works it\'s a goal people talk about.',
        isEgo: true,
        yourStats: ['finishing', 'vision'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: { stat: 'vision', min: 54 },
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'cutback_square',
        label: 'Square it — teammate is unmarked',
        desc: 'The selfless ball. Clean finish for someone else.',
        isEgo: false,
        yourStats: ['vision', 'shortPassing'],
        oppStats: ['positioning', 'pace'],
        statGate: { stat: 'vision', min: 55 },
        weaponBoost: ['blind_spot_ghost'],
        smartBonus: false,
      },
    ],
    cascades: {
      round_keeper:   { success: 'GOAL',   failure: 'FOUL_AGAINST' },
      slot_low:       { success: 'GOAL',   failure: 'SAVED' },
      chip_1v1:       { success: 'GOAL',   failure: 'NEAR_MISS' },
      cutback_square: { success: 'ASSIST', failure: 'INTERCEPTED' },
    },
  },

  A8: {
    id: 'A8',
    type: 'attacking',
    chanceTypes: ['central', 'through_ball'],
    positions: ['CAM'],
    pitchMap: 'through_ball_window',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — You receive between the lines and both central defenders step out toward you at the same time. Immediately you see it — the gap behind them, the striker already scanning the run. Nobody else in this stadium sees what you just saw. You have one second to use it.`;
    },
    choices: [
      {
        id: 'thread_it',
        label: 'Thread it through — split the defence',
        desc: 'The pass that breaks the whole thing open. Vision and technique.',
        isEgo: true,
        yourStats: ['vision', 'longPassing'],
        oppStats: ['positioning', 'pace'],
        statGate: { stat: 'vision', min: 58 },
        weaponBoost: ['blind_spot_ghost'],
        smartBonus: false,
      },
      {
        id: 'safe_recycle',
        label: 'Recycle — reset the attack',
        desc: 'Don\'t force it. Keep the ball. The gap will come again.',
        isEgo: false,
        yourStats: ['shortPassing', 'composure'],
        oppStats: ['positioning', 'shortTackle'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'dribble_gap',
        label: 'Carry it — drive into the gap yourself',
        desc: 'Both defenders stepped out. The space is yours if you\'re brave enough.',
        isEgo: true,
        yourStats: ['dribbling', 'composure'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: { stat: 'dribbling', min: 56 },
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
    ],
    cascades: {
      thread_it:    { success: 'ASSIST',           failure: 'INTERCEPTED' },
      safe_recycle: { success: 'POSSESSION_RESET', failure: 'LOSE_POSSESSION' },
      dribble_gap:  { success: 'A2',               failure: 'LOSE_POSSESSION' },
    },
  },

  A9: {
    id: 'A9',
    type: 'attacking',
    chanceTypes: ['central', 'counter'],
    positions: ['ST', 'CAM'],
    pitchMap: 'tight_space',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — Tight space, two defenders tight around you, nowhere obvious to go. Most players in this situation give it back and reset. But you\'re facing goal and there\'s a half-second where both of them are watching the ball instead of you. That\'s enough.`;
    },
    choices: [
      {
        id: 'flick_turn',
        label: 'Flick and turn — spin away',
        desc: 'Disguise the touch. Turn into the space before they react.',
        isEgo: true,
        yourStats: ['ballControl', 'agility'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: { stat: 'ballControl', min: 54 },
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
      {
        id: 'lay_simple',
        label: 'Lay it off simply — wait for the return',
        desc: 'Play out of the press. Trust your teammates.',
        isEgo: false,
        yourStats: ['shortPassing', 'composure'],
        oppStats: ['positioning', 'shortTackle'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'shoot_tight',
        label: 'Shoot through the body — low and hard',
        desc: 'Impossible angle. But you\'ve hit tighter.',
        isEgo: true,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: { stat: 'finishing', min: 58 },
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
    ],
    cascades: {
      flick_turn: { success: 'A2',              failure: 'LOSE_POSSESSION' },
      lay_simple: { success: 'POSSESSION_RESET', failure: 'INTERCEPTED' },
      shoot_tight:{ success: 'GOAL',            failure: 'BLOCKED' },
    },
  },

  A10: {
    id: 'A10',
    type: 'attacking',
    chanceTypes: ['counter', 'wide'],
    positions: ['LW', 'RW', 'ST'],
    pitchMap: 'counter_attack',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — Their whole midfield is committed forward and your team breaks. Three against two. You\'re the furthest forward. The ball is coming your way and behind you the numbers are in your favour for the first time all match. Don\'t rush it. Read it.`;
    },
    choices: [
      {
        id: 'receive_shoot',
        label: 'Receive and shoot first time',
        desc: 'Take the shot on before the shape reorganises.',
        isEgo: true,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_reflexes', 'gk_diving'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
      {
        id: 'hold_spread',
        label: 'Hold up — let the numbers arrive',
        desc: 'Draw the last defender. Create the 3v2 properly.',
        isEgo: false,
        yourStats: ['physicality', 'vision'],
        oppStats: ['physicality', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'run_channel',
        label: 'Run the channel — force the chase',
        desc: 'Take it wide, stretch the defence, cross or shoot from the angle.',
        isEgo: false,
        yourStats: ['pace', 'dribbling'],
        oppStats: ['pace', 'positioning'],
        statGate: null,
        weaponBoost: ['channel_runner'],
        smartBonus: false,
      },
    ],
    cascades: {
      receive_shoot: { success: 'GOAL',       failure: 'SAVED' },
      hold_spread:   { success: 'C1_OVERLAP', failure: 'LOSE_POSSESSION' },
      run_channel:   { success: 'A4',         failure: 'BLOCKED' },
    },
  },

  // ─────────────────────────────────────────────
  // CASCADE EVENTS (triggered from others)
  // ─────────────────────────────────────────────

  A1_KEEPER: {
    id: 'A1_KEEPER',
    type: 'attacking',
    chanceTypes: [],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: '1v1_keeper',
    narrative: (gs) => {
      return `You\'re through. Just the keeper now. He\'s spreading himself, arms wide, trying to fill the goal. He\'s good — you saw him save two today already. But you\'ve beaten the defence. This is your moment. Pick your spot. Commit.`;
    },
    choices: [
      {
        id: 'slot_low_keeper',
        label: 'Pick a corner — slot it low',
        desc: 'Composed finish. Decide before you get there.',
        isEgo: false,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_diving', 'gk_reflexes'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: true,
      },
      {
        id: 'chip_keeper',
        label: 'Chip him — he\'s committed',
        desc: 'He came out early. Lob it over. Pure audacity.',
        isEgo: true,
        yourStats: ['finishing', 'vision'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'driven_near',
        label: 'Hit it hard — near post',
        desc: 'Before he sets. Pure pace. Don\'t give him time.',
        isEgo: true,
        yourStats: ['finishing', 'physicality'],
        oppStats: ['gk_reflexes', 'gk_diving'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
    ],
    cascades: {
      slot_low_keeper: { success: 'GOAL', failure: 'SAVED' },
      chip_keeper:     { success: 'GOAL', failure: 'NEAR_MISS' },
      driven_near:     { success: 'GOAL', failure: 'SAVED_REBOUND' },
    },
  },

  A2_HALF: {
    id: 'A2_HALF',
    type: 'attacking',
    chanceTypes: [],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'half_chance',
    narrative: (gs) => {
      return `Half a yard — not clean but real. The angle is tight. Keeper still moving. You\'ve scored from worse. You\'ve also missed from better. What do you do?`;
    },
    choices: [
      {
        id: 'near_post',
        label: 'Near post — bend it inside the keeper',
        desc: 'Tight angle. He\'s not set. Could go in, could go wide.',
        isEgo: true,
        yourStats: ['finishing', 'agility'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
      {
        id: 'cutback_half',
        label: 'Pull it back — square to support',
        desc: 'The sensible ball. Someone arrives in a better position.',
        isEgo: false,
        yourStats: ['vision', 'shortPassing'],
        oppStats: ['positioning', 'pace'],
        statGate: { stat: 'vision', min: 50 },
        weaponBoost: [],
        smartBonus: true,
      },
    ],
    cascades: {
      near_post:    { success: 'GOAL',   failure: 'NEAR_MISS' },
      cutback_half: { success: 'ASSIST', failure: 'BLOCKED' },
    },
  },

  COUNTER_CASCADE: {
    id: 'COUNTER_CASCADE',
    type: 'attacking',
    chanceTypes: [],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'counter_attack',
    narrative: (gs) => {
      return `Your team clears it and the counter is on. You\'re already turned. The whole defence is scrambling. A defender is closing from your left — he\'s quick but he started behind you. The goal is ahead. Choose how you attack this.`;
    },
    choices: [
      {
        id: 'race_through',
        label: 'Win the foot race — go',
        desc: 'Pure pace. Don\'t think about him. Run.',
        isEgo: false,
        yourStats: ['pace', 'acceleration'],
        oppStats: ['pace', 'positioning'],
        statGate: null,
        weaponBoost: ['channel_runner'],
        smartBonus: false,
      },
      {
        id: 'shift_direction',
        label: 'Shift direction — lose him completely',
        desc: 'Change angle at full pace. He can\'t track the shift.',
        isEgo: true,
        yourStats: ['agility', 'dribbling'],
        oppStats: ['pace', 'shortTackle'],
        statGate: null,
        weaponBoost: ['feint_master', 'blind_spot_ghost'],
        smartBonus: false,
      },
      {
        id: 'hold_wait',
        label: 'Hold up — wait for numbers',
        desc: 'Don\'t rush it. The 2v1 is coming if you\'re patient.',
        isEgo: false,
        yourStats: ['physicality', 'vision'],
        oppStats: ['physicality', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
    ],
    cascades: {
      race_through:    { success: 'A1_KEEPER',  failure: 'LOSE_POSSESSION' },
      shift_direction: { success: 'A1_KEEPER',  failure: 'LOSE_POSSESSION' },
      hold_wait:       { success: 'C1_OVERLAP', failure: 'POSSESSION_RESET' },
    },
  },

  // ─────────────────────────────────────────────
  // CREATION
  // ─────────────────────────────────────────────

  C1_OVERLAP: {
    id: 'C1_OVERLAP',
    type: 'creation',
    chanceTypes: ['wide', 'central'],
    positions: ['CAM', 'LW', 'RW', 'ST'],
    pitchMap: 'overlap',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — Your teammate bursts into the overlap — he\'s been making that run all game and nobody\'s tracked him. One defender, two of you. The geometry is perfect. It\'s the simplest situation in football and still people get it wrong. Don\'t be one of them.`;
    },
    choices: [
      {
        id: 'slide_through',
        label: 'Slide it through the gap',
        desc: 'Thread the pass to his run. Precise, weighted right.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: ['blind_spot_ghost'],
        smartBonus: true,
      },
      {
        id: 'take_yourself',
        label: 'Ignore the overlap — take him on',
        desc: 'Back yourself. The overlap is a distraction.',
        isEgo: true,
        yourStats: ['dribbling', 'agility'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: null,
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
      {
        id: 'dummy_pass',
        label: 'Dummy the pass — defender bites — go yourself',
        desc: 'Show the overlap. He steps. You go the other way.',
        isEgo: true,
        yourStats: ['dribbling', 'vision'],
        oppStats: ['positioning', 'shortTackle'],
        statGate: { stat: 'vision', min: 54 },
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
    ],
    cascades: {
      slide_through: { success: 'ASSIST',    failure: 'INTERCEPTED' },
      take_yourself: { success: 'A2',        failure: 'LOSE_POSSESSION' },
      dummy_pass:    { success: 'A1_KEEPER', failure: 'LOSE_POSSESSION' },
    },
  },

  C2_SWITCH: {
    id: 'C2_SWITCH',
    type: 'creation',
    chanceTypes: ['wide', 'central'],
    positions: ['CAM', 'ST'],
    pitchMap: 'through_ball_window',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — The whole team is compressed to one side and their winger on the far flank is completely isolated. Nobody has tracked him. One switch of play and the game opens up — you can see it clearly, you just have to be brave enough to take the long ball option when everyone else is looking short.`;
    },
    choices: [
      {
        id: 'switch_ball',
        label: 'Switch it — fifty-yard diagonal',
        desc: 'Find the isolated winger. Change the entire point of attack.',
        isEgo: false,
        yourStats: ['longPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: { stat: 'longPassing', min: 50 },
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'drive_central',
        label: 'Drive through centrally',
        desc: 'Don\'t switch. Take it on yourself through the middle.',
        isEgo: true,
        yourStats: ['dribbling', 'composure'],
        oppStats: ['shortTackle', 'physicality'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      switch_ball:   { success: 'A4',  failure: 'INTERCEPTED' },
      drive_central: { success: 'A2',  failure: 'LOSE_POSSESSION' },
    },
  },

  // ─────────────────────────────────────────────
  // DEFENSIVE
  // ─────────────────────────────────────────────

  D1_CORNER_AGAINST: {
    id: 'D1_CORNER_AGAINST',
    type: 'defensive',
    chanceTypes: ['corner_against'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'own_box_corner',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — Corner against. The box is filling up around you. Your man is six-two, good in the air, been a threat all match on set pieces. He\'s watching you watching him. You either do your job or you gamble that your teammates can hold it without you.`;
    },
    choices: [
      {
        id: 'track_runner',
        label: 'Track him — do your job',
        desc: 'Stay tight. Attack the ball when it comes. Win the header.',
        isEgo: false,
        yourStats: ['physicality', 'heading'],
        oppStats: ['heading', 'physicality'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'trust_defence',
        label: 'Trust the defence — run high for counter',
        desc: 'Gamble. If they clear it you\'re through on goal.',
        isEgo: true,
        yourStats: ['pace', 'positioning'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: ['channel_runner'],
        smartBonus: false,
      },
      {
        id: 'zone_defend',
        label: 'Hold the zone — attack the ball not the man',
        desc: 'Discipline over instinct. Cover the dangerous area.',
        isEgo: false,
        yourStats: ['positioning', 'composure'],
        oppStats: ['heading', 'positioning'],
        statGate: { stat: 'positioning', min: 52 },
        weaponBoost: [],
        smartBonus: true,
      },
    ],
    cascades: {
      track_runner:  { success: 'COUNTER_CASCADE',  failure: 'GOAL_MOUTH_SCRAMBLE' },
      trust_defence: { success: 'COUNTER_CASCADE',  failure: 'OPPOSITION_GOAL' },
      zone_defend:   { success: 'COUNTER_CASCADE',  failure: 'GOAL_MOUTH_SCRAMBLE' },
    },
  },

  D2_TRACKING_BACK: {
    id: 'D2_TRACKING_BACK',
    type: 'defensive',
    chanceTypes: ['corner_against', 'counter'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'own_box_corner',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — They\'ve broken. Your team is stretched. You\'re the furthest forward and there\'s a decision to make in the next three seconds — sprint back and try to help or stay high and trust the lads behind you. The manager will have something to say either way.`;
    },
    choices: [
      {
        id: 'sprint_back',
        label: 'Sprint — get back in the defensive line',
        desc: 'Full commitment. Cover the danger. Put the work in.',
        isEgo: false,
        yourStats: ['pace', 'stamina'],
        oppStats: ['pace', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'press_carrier',
        label: 'Press the carrier — force the error',
        desc: 'Go at the ball. Aggressive. Cut off the pass option.',
        isEgo: true,
        yourStats: ['pace', 'physicality'],
        oppStats: ['shortPassing', 'composure'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'hold_position',
        label: 'Stay forward — trust your teammates',
        desc: 'Gamble. If they hold it you\'re already in position for the counter.',
        isEgo: true,
        yourStats: ['positioning', 'composure'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      sprint_back:   { success: 'POSSESSION_RESET', failure: 'OPPOSITION_GOAL' },
      press_carrier: { success: 'FOUL_WON',         failure: 'OPPOSITION_GOAL' },
      hold_position: { success: 'COUNTER_CASCADE',  failure: 'OPPOSITION_GOAL' },
    },
  },

  // ─────────────────────────────────────────────
  // SET PIECES
  // ─────────────────────────────────────────────

  SP_FREEKICK_CLOSE: {
    id: 'SP_FREEKICK_CLOSE',
    type: 'setpiece',
    chanceTypes: ['free_kick'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'free_kick',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — Free kick. Twenty-two yards. Central position. You pick up the ball and the whole stadium decides it knows what\'s about to happen. The wall is set, five men across. The keeper is shouting instructions. Everyone is watching you. This is exactly where you want to be.`;
    },
    choices: [
      {
        id: 'shoot_direct',
        label: 'Shoot direct — curl over the wall',
        desc: 'The classic free kick. Pick the corner.',
        isEgo: false,
        yourStats: ['longShots', 'composure'],
        oppStats: ['gk_diving', 'gk_reflexes'],
        statGate: null,
        weaponBoost: ['set_piece_maestro'],
        smartBonus: false,
      },
      {
        id: 'knuckleball',
        label: 'Knuckleball — no spin, straight and dipping',
        desc: 'Unpredictable flight. Even if he dives the right way it moves away from him.',
        isEgo: true,
        yourStats: ['longShots', 'composure'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: { stat: 'longShots', min: 56 },
        weaponBoost: ['set_piece_maestro'],
        smartBonus: false,
      },
      {
        id: 'pass_wall',
        label: 'Pass around the wall — create the angle',
        desc: 'Unpick the wall. Lay it to the side, shoot from a better angle.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'shortTackle'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'whip_box',
        label: 'Whip it into the box — delivery',
        desc: 'Skip the direct shot. Find the head in the box.',
        isEgo: false,
        yourStats: ['longPassing', 'vision'],
        oppStats: ['heading', 'positioning'],
        statGate: null,
        weaponBoost: ['set_piece_maestro'],
        smartBonus: false,
      },
    ],
    cascades: {
      shoot_direct: { success: 'GOAL',   failure: 'SAVED' },
      knuckleball:  { success: 'GOAL',   failure: 'NEAR_MISS' },
      pass_wall:    { success: 'A2',     failure: 'BLOCKED' },
      whip_box:     { success: 'ASSIST', failure: 'CLEARED' },
    },
  },

  SP_CORNER: {
    id: 'SP_CORNER',
    type: 'setpiece',
    chanceTypes: ['corner'],
    positions: ['CAM', 'LW', 'RW'],
    pitchMap: 'corner',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — Corner. The ball is at your feet by the flag. The box is full — your tall men making runs, defenders trying to track, the keeper claiming his area. Four seconds before the shape resets. You\'ve practised this. Every delivery tells a story. Make this one a good one.`;
    },
    choices: [
      {
        id: 'whipped_inswinger',
        label: 'Whipped inswinger — near post',
        desc: 'Driven with pace and curl. Forces quick reactions.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['heading', 'positioning'],
        statGate: null,
        weaponBoost: ['set_piece_maestro'],
        smartBonus: false,
      },
      {
        id: 'floated_far',
        label: 'Floated to the far post',
        desc: 'High and hanging. Your tall man times his run.',
        isEgo: false,
        yourStats: ['longPassing', 'vision'],
        oppStats: ['heading', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'short_corner',
        label: 'Short corner — create the angle',
        desc: 'Draw defenders out. Better delivery from wider position.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: ['set_piece_maestro'],
        smartBonus: false,
      },
      {
        id: 'driven_low',
        label: 'Driven low — near post flick-on',
        desc: 'Nobody expects it. First defender flicks on, chaos in the box.',
        isEgo: true,
        yourStats: ['shortPassing', 'composure'],
        oppStats: ['positioning', 'gk_composure'],
        statGate: { stat: 'vision', min: 54 },
        weaponBoost: ['set_piece_maestro'],
        smartBonus: false,
      },
    ],
    cascades: {
      whipped_inswinger: { success: 'ASSIST', failure: 'CLEARED' },
      floated_far:       { success: 'ASSIST', failure: 'CLEARED' },
      short_corner:      { success: 'A4',     failure: 'INTERCEPTED' },
      driven_low:        { success: 'ASSIST', failure: 'GOAL_KICK' },
    },
  },

  SP_CORNER_HEADER: {
    id: 'SP_CORNER_HEADER',
    type: 'setpiece',
    chanceTypes: ['corner'],
    positions: ['ST', 'CAM'],
    pitchMap: 'corner_attack',
    narrative: (gs) => {
      const minute = gs.match.minute;
      return `${minute}' — You\'ve peeled away from your marker. There\'s a yard of space and the corner is coming in. Attack it or hold? Get there first or wait for the better position? You have one second to decide and the ball is already in the air.`;
    },
    choices: [
      {
        id: 'attack_header',
        label: 'Attack the ball — early run',
        desc: 'Get there first. Aggressive wins headers.',
        isEgo: true,
        yourStats: ['heading', 'physicality'],
        oppStats: ['heading', 'physicality'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'dummy_run',
        label: 'Dummy run — drag the defender, create space',
        desc: 'Sacrifice your own run. Open space for a teammate arriving late.',
        isEgo: false,
        yourStats: ['positioning', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: ['blind_spot_ghost'],
        smartBonus: true,
      },
      {
        id: 'back_post_run',
        label: 'Back post — time the late run',
        desc: 'Let it float over everyone. Arrive at the back post late.',
        isEgo: false,
        yourStats: ['positioning', 'heading'],
        oppStats: ['positioning', 'heading'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      attack_header: { success: 'GOAL',   failure: 'CLEARED' },
      dummy_run:     { success: 'ASSIST', failure: 'CLEARED' },
      back_post_run: { success: 'GOAL',   failure: 'NEAR_MISS' },
    },
  },

  // ─────────────────────────────────────────────
  // PENALTY
  // ─────────────────────────────────────────────

  PENALTY: {
    id: 'PENALTY',
    type: 'penalty',
    chanceTypes: ['penalty'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'penalty_spot',
    narrative: (gs) => {
      const minute = gs.match.minute;
      const score = gs.match.score;
      const context = score.us < score.them
        ? 'This is your chance to get back in it.'
        : score.us > score.them
        ? 'Put it beyond doubt.'
        : 'This could be the difference.';
      return `${minute}' — PENALTY. You pick up the ball. The stadium drops to a hush. Twelve yards. One kick. ${context} The keeper is bouncing on his line, trying to get in your head. Don\'t let him.`;
    },
    choices: [
      {
        id: 'placed_corner',
        label: 'Placed — low, far corner',
        desc: 'Pick your spot early. Commit completely. Don\'t change your mind.',
        isEgo: false,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_diving', 'gk_composure'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'power_penalty',
        label: 'Hit it hard — down the middle, high',
        desc: 'Pure power. Even if he guesses right he can\'t get there.',
        isEgo: true,
        yourStats: ['finishing', 'physicality'],
        oppStats: ['gk_reflexes', 'gk_composure'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'stutter_run',
        label: 'Stutter run — make him dive early',
        desc: 'Psychological. Force him to commit before you decide.',
        isEgo: true,
        yourStats: ['composure', 'vision'],
        oppStats: ['gk_composure', 'gk_diving'],
        statGate: { stat: 'composure', min: 56 },
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'side_foot_firm',
        label: 'Side foot — firm, low to the right',
        desc: 'No drama. No tricks. Just score.',
        isEgo: false,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_reflexes', 'gk_diving'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      placed_corner: { success: 'GOAL', failure: 'SAVED' },
      power_penalty: { success: 'GOAL', failure: 'NEAR_MISS' },
      stutter_run:   { success: 'GOAL', failure: 'SAVED' },
      side_foot_firm:{ success: 'GOAL', failure: 'SAVED' },
    },
  },

};

// ─────────────────────────────────────────────
// EVENT POOL
// ─────────────────────────────────────────────

export const EVENT_POOL = [
  { id: 'A1',  positions: ['ST','CAM','LW','RW'], chanceTypes: ['central','through_ball'] },
  { id: 'A2',  positions: ['ST','CAM'],           chanceTypes: ['central','shooting'] },
  { id: 'A3',  positions: ['ST','LW','RW'],       chanceTypes: ['counter','through_ball'] },
  { id: 'A4',  positions: ['LW','RW'],            chanceTypes: ['wide','counter'] },
  { id: 'A5',  positions: ['CAM','ST'],           chanceTypes: ['central','through_ball'] },
  { id: 'A6',  positions: ['ST','CAM','LW','RW'], chanceTypes: ['central','wide'] },
  { id: 'A7',  positions: ['ST','LW','RW'],       chanceTypes: ['through_ball','counter'] },
  { id: 'A8',  positions: ['CAM'],               chanceTypes: ['central','through_ball'] },
  { id: 'A9',  positions: ['ST','CAM'],           chanceTypes: ['central','counter'] },
  { id: 'A10', positions: ['LW','RW','ST'],       chanceTypes: ['counter','wide'] },
  { id: 'C1_OVERLAP',        positions: ['CAM','LW','RW','ST'], chanceTypes: ['wide','central'] },
  { id: 'C2_SWITCH',         positions: ['CAM','ST'],           chanceTypes: ['wide','central'] },
  { id: 'D1_CORNER_AGAINST', positions: ['ST','CAM','LW','RW'], chanceTypes: ['corner_against'] },
  { id: 'D2_TRACKING_BACK',  positions: ['ST','CAM','LW','RW'], chanceTypes: ['corner_against','counter'] },
  { id: 'SP_FREEKICK_CLOSE', positions: ['ST','CAM','LW','RW'], chanceTypes: ['free_kick'] },
  { id: 'SP_CORNER',         positions: ['CAM','LW','RW'],      chanceTypes: ['corner'] },
  { id: 'SP_CORNER_HEADER',  positions: ['ST','CAM'],           chanceTypes: ['corner'] },
  { id: 'PENALTY',           positions: ['ST','CAM','LW','RW'], chanceTypes: ['penalty'] },
];
