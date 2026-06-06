import { GameState } from './GameState.js';

export const RatingEngine = {
  apply(outcome, context = {}) {
    const m = GameState.match;
    let delta = 0;

    switch (outcome) {
      case 'safe_success':       delta = +0.2; break;
      case 'safe_failure':       delta = -0.1; break;
      case 'ego_success':        delta = +0.5; break;
      case 'ego_failure':        delta = -0.4; break;
      case 'nat20_bonus':        delta = +0.6; break;
      case 'nat1_penalty':       delta = -0.5; break;
      case 'goal':               delta = +0.8; break;
      case 'assist':             delta = +0.5; break;
      case 'cascade_bonus':      delta = +0.3; break;
      case 'lost_dangerous':     delta = -0.2; break;
      case 'caught_upfield':     delta = -0.3; break;
      case 'defensive_well':     delta = +0.2; break;
      case 'teammate_scores':    delta = +0.1; break;
      default:                   delta = 0;
    }

    m.rating = Math.max(1.0, Math.min(10.0, m.rating + delta));
    m.ratingHistory.push({ minute: m.minute, rating: m.rating, outcome, delta });
    return delta;
  },

  band(rating) {
    if (rating >= 9.0) return { label: 'Masterclass',  color: '#ffd700' };
    if (rating >= 8.0) return { label: 'Excellent',    color: '#4ade80' };
    if (rating >= 7.0) return { label: 'Good',         color: '#86efac' };
    if (rating >= 6.0) return { label: 'Decent',       color: '#bef264' };
    if (rating >= 5.0) return { label: 'Poor',         color: '#fb923c' };
    if (rating >= 4.0) return { label: 'Awful',        color: '#f87171' };
    return               { label: 'Nightmare',         color: '#dc2626' };
  },
};
