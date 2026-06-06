// Single source of truth for the entire game session

export const GameState = {
  // Player
  player: {
    name: '',
    nationality: '',
    position: '',   // ST | CAM | LW | RW
    profile: '',    // pace_power | technician | powerhouse
    weapon: null,   // weapon id or 'discover'
    stats: {},
    overall: 0,
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

  reset() {
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
    };
    this.debug.rolls = [];
    this.postMatch = { statChanges: {}, managerQuote: '', headline: '', offPitchEvent: null };
  },
};
