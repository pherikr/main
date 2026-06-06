// ═══════════════════════════════════════════════════════════════════════
// STRIKER RPG — EVENTS BANK v1.0
// Complete event pool for Academy tier POC
// 
// STRUCTURE OF EACH EVENT:
// id          — unique string
// type        — 'attacking' | 'defensive' | 'setpiece' | 'creation' | 'penalty'
// chanceTypes — matches MatchEngine chance types: 
//               'through_ball' | 'central' | 'wide' | 'counter' | 
//               'free_kick' | 'corner' | 'corner_against' | 'penalty'
// positions   — which positions see this event: ['ST','CAM','LW','RW']
// narrative   — function(gs) returning first-person atmospheric string
// choices     — array of choice objects (see below)
// cascades    — maps choice.id → { success, failure } terminal or event IDs
// pitchMap    — which SVG snapshot to render: see PITCH_MAPS at bottom
//
// CHOICE STRUCTURE:
// id          — unique within event
// label       — short title (shown bold)
// desc        — one line description
// isEgo       — true = flashy/risky, higher reward on success, bigger penalty on fail
// yourStats   — array of 1-2 stat keys from PLAYER stats
// oppStats    — array of 1-2 stat keys from OPPONENT stats (defender or GK)
//               MUST match in count — equal number on both sides
// statGate    — { stat, min } or null — if player stat below min, choice is hidden
// weaponBoost — weapon IDs that add +2 to this choice's roll
// smartBonus  — true if this is the situationally optimal choice (+1 to +3 flat)
//
// DEFENDER STAT KEYS (opponent):
// shortTackle | slideTackle | positioning | pace | physicality | heading
//
// GK STAT KEYS (opponent):
// gk_diving | gk_reflexes | gk_composure | gk_handling
//
// TERMINAL IDs (cascade endpoints — no further event):
// GOAL | ASSIST | SAVED | SAVED_REBOUND | NEAR_MISS | BLOCKED
// LOSE_POSSESSION | INTERCEPTED | CLEARED | FOUL_WON | FOUL_AGAINST
// OPPOSITION_GOAL | GOAL_MOUTH_SCRAMBLE | POSSESSION_RESET
// COUNTER_DANGER | CORNER_WON | GOAL_KICK
//
// CASCADING EVENT IDs (lead to next event):
// → A1_KEEPER (1v1 with keeper after beating defender)
// → A2_HALF   (half chance from feint, awkward angle)
// → C1_OVERLAP (teammate overlapping, 2v1 created)
// → C2_SWITCH  (switch of play, winger receives)
// → SP_CORNER  (corner delivery)
// → SP_FREEKICK_CLOSE (close range free kick)
// → COUNTER_CASCADE   (fast break, defender tracking)
// ═══════════════════════════════════════════════════════════════════════

export const EVENTS = {

  // ═══════════════════════════════════════════════
  // ATTACKING EVENTS
  // ═══════════════════════════════════════════════

  A1: {
    id: 'A1',
    type: 'attacking',
    chanceTypes: ['central', 'through_ball'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'box_entry',
    narrative: (gs) =>
      `${gs.match.minute}' — The ball drops at your feet on the edge of the box. The centre-back has shifted across but his weight is wrong. His partner hasn't recovered. You have one second before the shape closes.`,
    choices: [
      {
        id: 'take_on',
        label: 'Drive at him',
        desc: 'Drop your shoulder and go. If it works, you\'re through.',
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
        desc: 'Sell the dummy. Create the half-yard.',
        isEgo: false,
        yourStats: ['dribbling', 'balance'],
        oppStats: ['slideTackle', 'pace'],
        statGate: null,
        weaponBoost: ['feint_master'],
        smartBonus: true,
      },
      {
        id: 'pass_wide',
        label: 'Release it wide',
        desc: 'Early ball. Keep possession, find better angle.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'hold_up',
        label: 'Back to defender, shield',
        desc: 'Win the foul or wait for support. Requires strength.',
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
    narrative: (gs) =>
      `${gs.match.minute}' — Half a yard of space. Fifteen yards out. The keeper's weight shifts left — he's guessing. The defender is closing from behind. One touch. One decision.`,
    choices: [
      {
        id: 'low_driven',
        label: 'Low driven — far post',
        desc: 'Pick your spot. Technique over power.',
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
        desc: 'No placement. Just pace. If it\'s on target, he can\'t hold it.',
        isEgo: true,
        yourStats: ['finishing', 'physicality'],
        oppStats: ['gk_reflexes', 'gk_composure'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
      {
        id: 'take_touch',
        label: 'Take a touch — compose yourself',
        desc: 'Better angle. Closing defender arrives though.',
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
        desc: 'He\'s off his line. Audacious. Vision check.',
        isEgo: true,
        yourStats: ['finishing', 'vision'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: { stat: 'vision', min: 56 },
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      low_driven:  { success: 'GOAL',     failure: 'SAVED' },
      power_shot:  { success: 'GOAL',     failure: 'SAVED_REBOUND' },
      take_touch:  { success: 'GOAL',     failure: 'BLOCKED' },
      chip:        { success: 'GOAL',     failure: 'NEAR_MISS' },
    },
  },

  A3: {
    id: 'A3',
    type: 'attacking',
    chanceTypes: ['counter', 'through_ball'],
    positions: ['ST', 'LW', 'RW'],
    pitchMap: 'counter_run',
    narrative: (gs) =>
      `${gs.match.minute}' — You've burst through on the break. A defender is on your shoulder stride for stride — you can hear his breathing. Forty yards to go. The whole stadium on their feet.`,
    choices: [
      {
        id: 'cut_inside',
        label: 'Cut inside — create the angle',
        desc: 'Change direction sharply. Leave him flat-footed.',
        isEgo: true,
        yourStats: ['agility', 'dribbling'],
        oppStats: ['pace', 'positioning'],
        statGate: null,
        weaponBoost: ['blind_spot_ghost', 'channel_runner'],
        smartBonus: false,
      },
      {
        id: 'power_through',
        label: 'Power through him',
        desc: 'Use your shoulder. Stay wide. Win the foot race.',
        isEgo: true,
        yourStats: ['pace', 'physicality'],
        oppStats: ['physicality', 'pace'],
        statGate: { stat: 'physicality', min: 58 },
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'dummy',
        label: 'Dummy — peel off',
        desc: 'Let the ball run to your trailing teammate. Smart play.',
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
    narrative: (gs) =>
      `${gs.match.minute}' — Ball wide to you. The fullback is backpedalling. Space inside. Your striker is making a near post run. The crowd senses something.`,
    choices: [
      {
        id: 'cut_shoot',
        label: 'Cut inside and shoot',
        desc: 'Onto your strong foot. You see the near corner.',
        isEgo: true,
        yourStats: ['dribbling', 'finishing'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
      {
        id: 'whip_cross',
        label: 'Whip it in early',
        desc: 'First-time delivery before the shape organises.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'heading'],
        statGate: null,
        weaponBoost: ['set_piece_maestro'],
        smartBonus: true,
      },
      {
        id: 'take_on_fullback',
        label: 'Take the fullback on — get to the byline',
        desc: 'Beat him and pull it back. Better ball, higher difficulty.',
        isEgo: true,
        yourStats: ['dribbling', 'pace'],
        oppStats: ['shortTackle', 'pace'],
        statGate: null,
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
      {
        id: 'cutback',
        label: 'Dummy cross — cutback',
        desc: 'Show the cross, pull it back. Unpredictable.',
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
    pitchMap: 'one_two',
    narrative: (gs) =>
      `${gs.match.minute}' — Your striker drops short, you're in behind him. The defender is between you both — he can't track both runs. This is the moment you both felt coming.`,
    choices: [
      {
        id: 'one_two',
        label: 'Play the one-two',
        desc: 'Short, quick combination. Create the 2v1.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'shoot_first',
        label: 'Shoot first time',
        desc: 'Skip the combination. Catch them out.',
        isEgo: true,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_reflexes', 'gk_diving'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: false,
      },
      {
        id: 'turn_run',
        label: 'Take a touch, turn and run',
        desc: 'Create your own space. Drive at goal.',
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
    pitchMap: 'late_game',
    narrative: (gs) =>
      `${gs.match.minute}' — ${gs.match.score.us < gs.match.score.them ? 'You\'re trailing. Time is running out.' : 'All square. Someone has to make something happen.'} The ball comes to you in a dangerous position. The crowd is willing you on.`,
    choices: [
      {
        id: 'spin_run',
        label: 'Spin away and run at goal',
        desc: 'Everything on the line. Make something happen.',
        isEgo: true,
        yourStats: ['dribbling', 'pace'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: null,
        weaponBoost: ['channel_runner', 'blind_spot_ghost'],
        smartBonus: false,
      },
      {
        id: 'quick_combo',
        label: 'Quick combination — create the 2v1',
        desc: 'Pass and move. Trust your teammate.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: { stat: 'vision', min: 50 },
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'long_shot_attempt',
        label: 'Hit it from here',
        desc: 'Twenty-five yards. Nothing to lose.',
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
      long_shot_attempt: { success: 'GOAL',       failure: 'NEAR_MISS' },
    },
  },

  A7: {
    id: 'A7',
    type: 'attacking',
    chanceTypes: ['through_ball', 'counter'],
    positions: ['ST', 'LW', 'RW'],
    pitchMap: 'in_behind',
    narrative: (gs) =>
      `${gs.match.minute}' — The ball is threaded in behind the defence. You time your run perfectly — the flag stays down. Just the goalkeeper between you and the goal. Your legs are burning but your mind is cold.`,
    choices: [
      {
        id: 'round_keeper',
        label: 'Round the keeper',
        desc: 'Go past him. Harder to mess up once done.',
        isEgo: true,
        yourStats: ['dribbling', 'agility'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: null,
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
      {
        id: 'slot_low',
        label: 'Slot it low — pick a corner',
        desc: 'Composed finish. Take the pressure off.',
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
        desc: 'Audacious. He\'s off his line. If it works, it\'s immortal.',
        isEgo: true,
        yourStats: ['finishing', 'vision'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: { stat: 'vision', min: 54 },
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'cutback_square',
        label: 'Square it — teammate unmarked',
        desc: 'The easy goal. Selfless. Vision check.',
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
    narrative: (gs) =>
      `${gs.match.minute}' — You receive it between the lines. Both central defenders step out towards you simultaneously. Behind them — a gap. Your striker is already scanning the run. You see it before anyone else.`,
    choices: [
      {
        id: 'thread_it',
        label: 'Thread it through — split the defence',
        desc: 'The pass everyone in the stadium sees except the defenders.',
        isEgo: true,
        yourStats: ['vision', 'longPassing'],
        oppStats: ['positioning', 'pace'],
        statGate: { stat: 'vision', min: 58 },
        weaponBoost: ['blind_spot_ghost'],
        smartBonus: false,
      },
      {
        id: 'safe_recycle',
        label: 'Recycle — reset and probe',
        desc: 'Don\'t force it. Keep possession. The gap will come again.',
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
        desc: 'Take it on. Both defenders stepped out — exploit it.',
        isEgo: true,
        yourStats: ['dribbling', 'composure'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: { stat: 'dribbling', min: 56 },
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
    ],
    cascades: {
      thread_it:    { success: 'ASSIST',  failure: 'INTERCEPTED' },
      safe_recycle: { success: 'POSSESSION_RESET', failure: 'LOSE_POSSESSION' },
      dribble_gap:  { success: 'A2',     failure: 'LOSE_POSSESSION' },
    },
  },

  // ═══════════════════════════════════════════════
  // 1v1 KEEPER CASCADE EVENT (triggered from other events)
  // ═══════════════════════════════════════════════

  A1_KEEPER: {
    id: 'A1_KEEPER',
    type: 'attacking',
    chanceTypes: [],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: '1v1_keeper',
    narrative: (gs) =>
      `You're through. The crowd holds its breath. Just the keeper — he's spreading himself, trying to make himself big. One chance. Make it count.`,
    choices: [
      {
        id: 'slot_low_keeper',
        label: 'Slot it low — pick a corner',
        desc: 'Composed. Clinical. The percentage shot.',
        isEgo: false,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_diving', 'gk_reflexes'],
        statGate: null,
        weaponBoost: ['direct_shot'],
        smartBonus: true,
      },
      {
        id: 'chip_keeper',
        label: 'Chip him',
        desc: 'He\'s committed. Loft it over. Pure audacity.',
        isEgo: true,
        yourStats: ['finishing', 'vision'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'driven_near',
        label: 'Drive it — near post',
        desc: 'Before he sets. Pure pace on the shot.',
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
    narrative: (gs) =>
      `You've created half a yard — not perfect but enough. The angle is tight. The keeper is still moving. You have to decide now.`,
    choices: [
      {
        id: 'near_post',
        label: 'Near post — bend it inside the keeper',
        desc: 'Tight angle but he\'s not set.',
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
        desc: 'Better chance for someone arriving late.',
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

  // ═══════════════════════════════════════════════
  // CREATION / ASSIST EVENTS
  // ═══════════════════════════════════════════════

  C1_OVERLAP: {
    id: 'C1_OVERLAP',
    type: 'creation',
    chanceTypes: ['wide', 'central'],
    positions: ['CAM', 'LW', 'RW', 'ST'],
    pitchMap: 'overlap',
    narrative: (gs) =>
      `Your teammate bursts into the overlap — he's screaming for it. One defender, two of you. The geometry is perfect if you read it right.`,
    choices: [
      {
        id: 'slide_through',
        label: 'Slide it through the gap',
        desc: 'Precise pass. Thread it to his run.',
        isEgo: false,
        yourStats: ['shortPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: ['blind_spot_ghost'],
        smartBonus: true,
      },
      {
        id: 'take_yourself',
        label: 'Keep it — take on the defender yourself',
        desc: 'Ignore the overlap. Back yourself.',
        isEgo: true,
        yourStats: ['dribbling', 'agility'],
        oppStats: ['shortTackle', 'positioning'],
        statGate: null,
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
      {
        id: 'dummy_pass',
        label: 'Dummy the pass — defender bites',
        desc: 'Show the pass, keep it. The gap opens up.',
        isEgo: true,
        yourStats: ['dribbling', 'vision'],
        oppStats: ['positioning', 'shortTackle'],
        statGate: { stat: 'vision', min: 54 },
        weaponBoost: ['feint_master'],
        smartBonus: false,
      },
    ],
    cascades: {
      slide_through: { success: 'ASSIST',  failure: 'INTERCEPTED' },
      take_yourself: { success: 'A2',      failure: 'LOSE_POSSESSION' },
      dummy_pass:    { success: 'A1_KEEPER', failure: 'LOSE_POSSESSION' },
    },
  },

  C2_SWITCH: {
    id: 'C2_SWITCH',
    type: 'creation',
    chanceTypes: ['wide', 'central'],
    positions: ['CAM', 'ST'],
    pitchMap: 'switch_play',
    narrative: (gs) =>
      `The whole team is bunched left. You see the winger isolated on the far side — completely free. One switch of play changes everything.`,
    choices: [
      {
        id: 'switch_ball',
        label: 'Switch it — fifty-yard diagonal',
        desc: 'Find the winger. Change the point of attack.',
        isEgo: false,
        yourStats: ['longPassing', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: { stat: 'longPassing', min: 50 },
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'drive_central',
        label: 'Drive central — force the issue',
        desc: 'Ignore the switch. Take it on centrally.',
        isEgo: true,
        yourStats: ['dribbling', 'composure'],
        oppStats: ['shortTackle', 'physicality'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
    ],
    cascades: {
      switch_ball:   { success: 'A4',     failure: 'INTERCEPTED' },
      drive_central: { success: 'A2',     failure: 'LOSE_POSSESSION' },
    },
  },

  // ═══════════════════════════════════════════════
  // DEFENSIVE EVENTS
  // ═══════════════════════════════════════════════

  D1_CORNER_AGAINST: {
    id: 'D1_CORNER_AGAINST',
    type: 'defensive',
    chanceTypes: ['corner_against'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'defending_corner',
    narrative: (gs) =>
      `${gs.match.minute}' — Corner against. The box is filling up. Your man is big — six foot two, excellent in the air. Do you do your job or gamble?`,
    choices: [
      {
        id: 'track_runner',
        label: 'Track your man — win the header',
        desc: 'Do your defensive job. Stay on him.',
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
        desc: 'Gamble on your teammates. If they clear it, you\'re through.',
        isEgo: true,
        yourStats: ['pace', 'positioning'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: ['channel_runner'],
        smartBonus: false,
      },
      {
        id: 'zone_defend',
        label: 'Hold the zone — don\'t follow his run',
        desc: 'Discipline. Attack the ball, not the man.',
        isEgo: false,
        yourStats: ['positioning', 'composure'],
        oppStats: ['heading', 'positioning'],
        statGate: { stat: 'positioning', min: 52 },
        weaponBoost: [],
        smartBonus: true,
      },
    ],
    cascades: {
      track_runner:   { success: 'COUNTER_CASCADE', failure: 'GOAL_MOUTH_SCRAMBLE' },
      trust_defence:  { success: 'COUNTER_CASCADE', failure: 'OPPOSITION_GOAL' },
      zone_defend:    { success: 'COUNTER_CASCADE', failure: 'GOAL_MOUTH_SCRAMBLE' },
    },
  },

  D2_TRACKING_BACK: {
    id: 'D2_TRACKING_BACK',
    type: 'defensive',
    chanceTypes: ['corner_against', 'counter'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'tracking_back',
    narrative: (gs) =>
      `${gs.match.minute}' — They've broken fast. You're the last one back. One defender between them and your keeper. Do you track all the way or hold your position?`,
    choices: [
      {
        id: 'sprint_back',
        label: 'Sprint — get back in the line',
        desc: 'Full commitment. Cover the danger.',
        isEgo: false,
        yourStats: ['pace', 'stamina'],
        oppStats: ['pace', 'positioning'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'press_carrier',
        label: 'Press the ball carrier — force the error',
        desc: 'Aggressive. Cut off the pass.',
        isEgo: true,
        yourStats: ['pace', 'physicality'],
        oppStats: ['shortPassing', 'composure'],
        statGate: null,
        weaponBoost: [],
        smartBonus: false,
      },
      {
        id: 'hold_position',
        label: 'Hold position — stay for the counter',
        desc: 'Trust your teammates. Stay forward.',
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

  // ═══════════════════════════════════════════════
  // COUNTER CASCADE (triggered from defensive events)
  // ═══════════════════════════════════════════════

  COUNTER_CASCADE: {
    id: 'COUNTER_CASCADE',
    type: 'attacking',
    chanceTypes: [],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'counter_run',
    narrative: (gs) =>
      `Your team clears it and you're away. Defence to attack in two seconds. The space is enormous. A defender is scrambling back — he's on your shoulder.`,
    choices: [
      {
        id: 'race_through',
        label: 'Race him — get in behind',
        desc: 'Pure pace. Win the foot race.',
        isEgo: false,
        yourStats: ['pace', 'acceleration'],
        oppStats: ['pace', 'positioning'],
        statGate: null,
        weaponBoost: ['channel_runner'],
        smartBonus: false,
      },
      {
        id: 'shift_direction',
        label: 'Shift direction — lose him',
        desc: 'Change angle at full speed. Leave him behind.',
        isEgo: true,
        yourStats: ['agility', 'dribbling'],
        oppStats: ['pace', 'shortTackle'],
        statGate: null,
        weaponBoost: ['feint_master', 'blind_spot_ghost'],
        smartBonus: false,
      },
      {
        id: 'hold_wait',
        label: 'Hold up — let teammates catch up',
        desc: 'Don\'t rush it. Create the numerical advantage.',
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

  // ═══════════════════════════════════════════════
  // SET PIECE EVENTS
  // ═══════════════════════════════════════════════

  SP_FREEKICK_CLOSE: {
    id: 'SP_FREEKICK_CLOSE',
    type: 'setpiece',
    chanceTypes: ['free_kick'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'free_kick',
    narrative: (gs) =>
      `${gs.match.minute}' — Free kick. Twenty-two yards. Central position. The wall is set. The keeper is organising. Everyone in the stadium knows you're taking it.`,
    choices: [
      {
        id: 'shoot_direct',
        label: 'Hit it direct — over the wall',
        desc: 'Curl it into the top corner. The classic.',
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
        desc: 'Unpredictable flight. Keeper can\'t read it. High risk.',
        isEgo: true,
        yourStats: ['longShots', 'composure'],
        oppStats: ['gk_composure', 'gk_reflexes'],
        statGate: { stat: 'longShots', min: 56 },
        weaponBoost: ['set_piece_maestro'],
        smartBonus: false,
      },
      {
        id: 'pass_wall',
        label: 'Pass to the side — create the angle',
        desc: 'Unpick the wall. Shot from the side. Safer.',
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
        desc: 'Skip the shot. Deliver for the header.',
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
    pitchMap: 'corner_delivery',
    narrative: (gs) =>
      `${gs.match.minute}' — Corner. The ball is in your hands. Your tallest player is peeling away from his marker. You have four seconds before the shape closes.`,
    choices: [
      {
        id: 'whipped_inswinger',
        label: 'Whipped inswinger — attack the near post',
        desc: 'Driven, curling in. Forces a reaction.',
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
        desc: 'High and hanging. Your tall man attacks it.',
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
        desc: 'Unexpected. Catches a flat-footed defence.',
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
    narrative: (gs) =>
      `${gs.match.minute}' — Corner delivery inbound. You've peeled off your marker — there's a yard of space. The ball is coming to your zone. Attack it or hold?`,
    choices: [
      {
        id: 'attack_header',
        label: 'Attack the ball — header',
        desc: 'Get there first. Aggression wins headers.',
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
        desc: 'Sacrifice your run. Open space for a teammate.',
        isEgo: false,
        yourStats: ['positioning', 'vision'],
        oppStats: ['positioning', 'pace'],
        statGate: null,
        weaponBoost: ['blind_spot_ghost'],
        smartBonus: true,
      },
      {
        id: 'back_post_run',
        label: 'Back post — time the run late',
        desc: 'Let it float over. Arrive late at the back post.',
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

  // ═══════════════════════════════════════════════
  // PENALTY
  // ═══════════════════════════════════════════════

  PENALTY: {
    id: 'PENALTY',
    type: 'penalty',
    chanceTypes: ['penalty'],
    positions: ['ST', 'CAM', 'LW', 'RW'],
    pitchMap: 'penalty_spot',
    narrative: (gs) =>
      `${gs.match.minute}' — PENALTY. You pick up the ball. The stadium goes quiet. Twelve yards. Just you and the keeper. Everything in this match could pivot on the next ten seconds.`,
    choices: [
      {
        id: 'placed_corner',
        label: 'Place it — low, far corner',
        desc: 'Pick your spot. Don\'t change your mind.',
        isEgo: false,
        yourStats: ['finishing', 'composure'],
        oppStats: ['gk_diving', 'gk_composure'],
        statGate: null,
        weaponBoost: [],
        smartBonus: true,
      },
      {
        id: 'power_penalty',
        label: 'Hit it hard — middle high',
        desc: 'Pure power. Even if he guesses right he can\'t reach it.',
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
        desc: 'Psychological. Force the keeper to commit.',
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
        desc: 'Safe side. No drama. Just score.',
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

// ═══════════════════════════════════════════════
// EVENT POOL — links events to chance types
// Used by EventEngine.pickEvent(chanceType)
// ═══════════════════════════════════════════════

export const EVENT_POOL = [
  { id: 'A1',                 positions: ['ST','CAM','LW','RW'], chanceTypes: ['central','through_ball'] },
  { id: 'A2',                 positions: ['ST','CAM'],           chanceTypes: ['central','shooting'] },
  { id: 'A3',                 positions: ['ST','LW','RW'],       chanceTypes: ['counter','through_ball'] },
  { id: 'A4',                 positions: ['LW','RW'],            chanceTypes: ['wide','counter'] },
  { id: 'A5',                 positions: ['CAM','ST'],           chanceTypes: ['central','through_ball'] },
  { id: 'A6',                 positions: ['ST','CAM','LW','RW'], chanceTypes: ['central','wide'] },
  { id: 'A7',                 positions: ['ST','LW','RW'],       chanceTypes: ['through_ball','counter'] },
  { id: 'A8',                 positions: ['CAM'],                chanceTypes: ['central','through_ball'] },
  { id: 'C1_OVERLAP',         positions: ['CAM','LW','RW','ST'], chanceTypes: ['wide','central'] },
  { id: 'C2_SWITCH',          positions: ['CAM','ST'],           chanceTypes: ['wide','central'] },
  { id: 'D1_CORNER_AGAINST',  positions: ['ST','CAM','LW','RW'], chanceTypes: ['corner_against'] },
  { id: 'D2_TRACKING_BACK',   positions: ['ST','CAM','LW','RW'], chanceTypes: ['corner_against','counter'] },
  { id: 'SP_FREEKICK_CLOSE',  positions: ['ST','CAM','LW','RW'], chanceTypes: ['free_kick'] },
  { id: 'SP_CORNER',          positions: ['CAM','LW','RW'],      chanceTypes: ['corner'] },
  { id: 'SP_CORNER_HEADER',   positions: ['ST','CAM'],           chanceTypes: ['corner'] },
  { id: 'PENALTY',            positions: ['ST','CAM','LW','RW'], chanceTypes: ['penalty'] },
];

// ═══════════════════════════════════════════════
// OUTCOME NARRATIVE BANK
// Used by UI to describe what happened after rolls
// ═══════════════════════════════════════════════

export const OUTCOME_NARRATIVES = {
  GOAL: [
    'The net shakes. The bench erupts. You wheeled away before it even hit the back.',
    'Perfect. Exactly where you meant it.',
    'The keeper had no chance. Clinical.',
    'It was in from the moment it left your foot.',
    'Unstoppable. Straight into the top corner.',
  ],
  SAVED: [
    'He gets down well. Strong hand. Corner.',
    'He guessed right. Good save.',
    'Straight at him. Should have picked a corner.',
    'He tips it onto the post. Agonising.',
    'Good stop. He read your body shape.',
  ],
  NEAR_MISS: [
    'Clips the outside of the post. So close.',
    'Dips just over the bar. You had him.',
    'Inches wide. The crowd groan.',
    'Over the bar. You tried to place it too fine.',
  ],
  SAVED_REBOUND: [
    'He can\'t hold it — it falls loose! Scramble in the box.',
    'Parried out. Someone needs to react.',
    'Good save but it\'s not dead yet.',
  ],
  BLOCKED: [
    'Body on the line. Defender throws himself in front.',
    'Blocked! Right place, right time for the defender.',
    'Gets a touch on it. Goes behind for a corner.',
  ],
  LOSE_POSSESSION: [
    'Clean tackle. He takes the ball without fouling.',
    'You hesitated. He took it from you.',
    'He read the movement. Stripped you clean.',
    'Lost it. They break immediately.',
  ],
  INTERCEPTED: [
    'He steps in front of it. Good read.',
    'The pass was there but he anticipated it.',
    'Intercepted. Good defensive positioning.',
  ],
  CLEARED: [
    'Defender heads it clear. Into row Z.',
    'The centre-back gets there first. Thump.',
    'Cleared off the line. Remarkable defending.',
  ],
  ASSIST: [
    'Perfect ball. He didn\'t even have to break stride.',
    'Threaded through. Your teammate does the rest.',
    'Exactly where he needed it. What a pass.',
  ],
  OPPOSITION_GOAL: [
    'You were caught upfield. They punish you.',
    'Too high up the pitch. The space behind was huge.',
    'They exploited your position. Brutal.',
  ],
  GOAL_MOUTH_SCRAMBLE: [
    'Bodies everywhere. Somehow it stays out.',
    'Three chances, three blocks. Miraculous defending.',
    'Off the line. Off the post. Somehow cleared.',
  ],
  FOUL_WON: [
    'He catches you. Referee has no hesitation.',
    'Good contact — penalty appeal? No, just a free kick.',
    'Foul given. He couldn\'t stop you any other way.',
  ],
  COUNTER_CASCADE: [
    'Your team clears it and you\'re in acres of space.',
    'Headed clear — you\'ve already turned and run.',
    'The ball is yours and the defence is still scrambling.',
  ],
  POSSESSION_RESET: [
    'Ball retained. Your team resets.',
    'Good hold-up. Teammates get into position.',
    'Kept it simple. The next attack builds.',
  ],
};

// ═══════════════════════════════════════════════
// PITCH MAP DEFINITIONS
// Simple SVG snapshots — rendered by UI layer
// ═══════════════════════════════════════════════

export const PITCH_MAPS = {
  box_entry:          { zone: 'final_third',  ballX: 0.48, ballY: 0.72, defX: [0.52], tmX: [] },
  shooting_chance:    { zone: 'box',          ballX: 0.50, ballY: 0.82, defX: [],     tmX: [] },
  '1v1_keeper':       { zone: 'box',          ballX: 0.50, ballY: 0.88, defX: [],     tmX: [] },
  half_chance:        { zone: 'box',          ballX: 0.62, ballY: 0.80, defX: [0.60], tmX: [] },
  counter_run:        { zone: 'midfield',     ballX: 0.50, ballY: 0.55, defX: [0.52], tmX: [] },
  in_behind:          { zone: 'final_third',  ballX: 0.50, ballY: 0.75, defX: [],     tmX: [] },
  wide_attack:        { zone: 'wide_right',   ballX: 0.78, ballY: 0.65, defX: [0.74], tmX: [0.55] },
  one_two:            { zone: 'final_third',  ballX: 0.50, ballY: 0.70, defX: [0.50], tmX: [0.45] },
  through_ball_window:{ zone: 'midfield',     ballX: 0.50, ballY: 0.50, defX: [0.46,0.54], tmX: [0.50] },
  overlap:            { zone: 'wide_right',   ballX: 0.72, ballY: 0.60, defX: [0.68], tmX: [0.78] },
  switch_play:        { zone: 'midfield',     ballX: 0.50, ballY: 0.48, defX: [],     tmX: [0.15] },
  defending_corner:   { zone: 'box_defending',ballX: 0.50, ballY: 0.12, defX: [0.48], tmX: [0.52] },
  tracking_back:      { zone: 'midfield',     ballX: 0.50, ballY: 0.40, defX: [0.48], tmX: [] },
  free_kick:          { zone: 'final_third',  ballX: 0.50, ballY: 0.70, defX: [0.48,0.50,0.52], tmX: [0.46,0.54] },
  corner_delivery:    { zone: 'corner',       ballX: 0.02, ballY: 0.05, defX: [],     tmX: [0.42,0.50,0.55] },
  corner_attack:      { zone: 'box',          ballX: 0.50, ballY: 0.15, defX: [0.48], tmX: [0.55] },
  penalty_spot:       { zone: 'box',          ballX: 0.50, ballY: 0.88, defX: [],     tmX: [] },
  late_game:          { zone: 'final_third',  ballX: 0.50, ballY: 0.68, defX: [0.50], tmX: [0.44] },
};
