// Single source of truth for the entire game session

export const GameState = {
  // Player
  player: {
    name: '',
    firstName: '',
    lastName: '',
    nationality: '',
    birthDay: 1,
    birthMonth: 1,
    position: '',   // ST | CAM | LW | RW
    profile: '',    // pace_power | technician | powerhouse
    archetype: '',
    weapon: null,   // weapon id or 'discover'
    height: 178,
    weight: 72,
    appearance: {
      facePreset: 1, skinTone: 2, hairStyle: 'short', hairColor: 'black', eyebrowStyle: 2,
    },
    stats: {},
    overall: 0,
    backgroundMods: {},
  },

  // Match
  match: {
    minute: 0,
    score: { us: 0, them: 0 },
    stamina: 100,
    workRate: 'medium',   // low | medium | high
    mentality: 'balanced', // attacking | balanced | defensive
    rating: 6.0,
    momentum: 50,          // 0–100
    confidence: 50,        // 0–100
    formModifier: 0,       // -2 to +2
    eventsResolved: 0,
    eventsThisMatch: 0,
    minEvents: 5,
    goals: 0,
    assists: 0,
    weaponDiscovered: false,
    discoveredWeapon: null,
    egoChoicesMade: 0,
    feed: [],              // match feed log entries
    cascadeDepth: 0,       // current cascade chain length
    cascadeBonus: false,
    ratingHistory: [],
    rattled: false,        // just came off nat 1
    substituted: false,    // player subbed off
    exhaustionSub: false,  // subbed due to stamina = 0
    yellows: 0,
    redCard: false,
    sentOff: false,
    subRisk: false,
    managerRelationship: 50,
    shotsOnTarget: 0,
    shotsMissed: 0,
    keeperAdvanced: false,
    refEventFired: false,
    managerHalftimeFired: false,
    managerTrackBackFired: false,
    managerPraiseFired: false,
    benchShown: false,
    oppGoalJustScored: false,
    lastOppGoalNarrative: '',
  },

  // Opponent — Academy tier fixed stats
  opponent: {
    defender: {
      shortTackle: 52,
      slideTackle: 50,
      positioning: 54,
      pace: 51,
      physicality: 53,
      heading: 52,
    },
    gk: {
      gk_diving:    55,
      gk_reflexes:  53,
      gk_composure: 54,
      gk_handling:  52,
    },
  },

  // Debug
  debug: {
    enabled: false,
    rolls: [],
  },

  // Post match
  postMatch: {
    statChanges: {},
    managerQuote: '',
    headline: '',
    offPitchEvent: null,
  },

  // Career & Trial
  trial: null,
  currentTrialMatch: null,
  currentFixture: null,
  career: null,

  reset() {
    this.trial = null;
    this.currentTrialMatch = null;
    this.currentFixture = null;
    this.career = null;
    this.match = {
      minute: 0,
      score: { us: 0, them: 0 },
      stamina: 100,
      workRate: 'medium',
      mentality: 'balanced',
      rating: 6.0,
      momentum: 50,
      confidence: 50,
      formModifier: 0,
      eventsResolved: 0,
      eventsThisMatch: 0,
      minEvents: 5,
      goals: 0,
      assists: 0,
      weaponDiscovered: false,
      discoveredWeapon: null,
      egoChoicesMade: 0,
      feed: [],
      cascadeDepth: 0,
      cascadeBonus: false,
      ratingHistory: [],
      rattled: false,
      substituted: false,
      exhaustionSub: false,
      yellows: 0,
      redCard: false,
      sentOff: false,
      subRisk: false,
      managerRelationship: 50,
      shotsOnTarget: 0,
      shotsMissed: 0,
      keeperAdvanced: false,
      refEventFired: false,
      managerHalftimeFired: false,
      managerTrackBackFired: false,
      managerPraiseFired: false,
      benchShown: false,
      oppGoalJustScored: false,
      lastOppGoalNarrative: '',
    };
    this.debug.rolls = [];
    this.postMatch = { statChanges: {}, managerQuote: '', headline: '', offPitchEvent: null };
  },
};
