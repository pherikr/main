export const WEAPONS = [
  {
    id: 'blind_spot_ghost',
    name: 'Blind Spot Ghost',
    desc: 'Unlocks ghost run options — slip past defenders before they react.',
    icon: '👻',
    matches: ['counter', 'through_ball', 'wide'],
    bonus: 2,
  },
  {
    id: 'direct_shot',
    name: 'Direct Shot',
    desc: 'Receive and shoot in one motion — no touch needed.',
    icon: '⚡',
    matches: ['shooting', 'central'],
    bonus: 3,
  },
  {
    id: 'channel_runner',
    name: 'Channel Runner',
    desc: 'Exploits the gap between CB and fullback automatically.',
    icon: '🔀',
    matches: ['through_ball', 'counter'],
    bonus: 2,
  },
  {
    id: 'feint_master',
    name: 'Feint Master',
    desc: 'Guaranteed first step advantage — once per match.',
    icon: '🌀',
    matches: ['dribble', 'wide'],
    bonus: 4,
    usesLeft: 1,
  },
  {
    id: 'set_piece_maestro',
    name: 'Set Piece Maestro',
    desc: 'Unlocks knuckleball and precise placement on free kicks.',
    icon: '🎯',
    matches: ['free_kick', 'corner'],
    bonus: 3,
  },
];

export const DISCOVER_OPTION = {
  id: 'discover',
  name: 'Discover it in play',
  desc: 'Your weapon reveals itself during the match based on how you play.',
  icon: '❓',
};
