// Pitch map SVG renderer — fixed zone names matching events_bank_v2.js
// Zone keys: box_entry | shooting_chance | 1v1_keeper | half_chance
//            counter_attack | wide_attack | overlap | through_ball_window
//            tight_space | free_kick | corner | corner_attack
//            own_box_corner | penalty_spot | two_v_one | high_pressure

const ZONE_CONFIGS = {

  box_entry: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player',   x: 100, y: 110, label: 'YOU' },
      { type: 'defender', x:  92, y:  82 },
      { type: 'defender', x: 135, y:  68 },
      { type: 'keeper',   x: 100, y:  14 },
      { type: 'ball',     x: 100, y: 115 },
      { type: 'arrow',    x1: 100, y1: 108, x2: 100, y2: 70, color: '#4ade80' },
    ],
  },

  shooting_chance: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player', x: 100, y: 100, label: 'YOU' },
      { type: 'keeper', x: 100, y:  14 },
      { type: 'ball',   x: 100, y: 104 },
      { type: 'arrow',  x1: 100, y1:  96, x2: 100, y2:  28, color: '#facc15', dashed: true },
    ],
  },

  '1v1_keeper': {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player', x: 100, y: 110, label: 'YOU' },
      { type: 'keeper', x: 100, y:  30, large: true },
      { type: 'ball',   x:  97, y: 114 },
      { type: 'arrow',  x1: 100, y1: 104, x2: 100, y2:  44, color: '#facc15', dashed: true },
    ],
  },

  half_chance: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player',   x: 140, y: 95, label: 'YOU' },
      { type: 'defender', x: 130, y: 72 },
      { type: 'keeper',   x: 100, y: 14 },
      { type: 'ball',     x: 140, y: 100 },
      { type: 'arrow',    x1: 138, y1:  92, x2: 105, y2:  28, color: '#facc15', dashed: true },
    ],
  },

  counter_attack: {
    viewBox: '0 0 200 160',
    elements: [
      { type: 'pitch_lines', zone: 'wide' },
      { type: 'player',   x: 100, y: 120, label: 'YOU' },
      { type: 'defender', x: 108, y: 100 },
      { type: 'keeper',   x: 100, y:  18 },
      { type: 'ball',     x:  96, y: 124 },
      { type: 'arrow',    x1: 100, y1: 115, x2: 100, y2:  55, color: '#4ade80' },
    ],
  },

  wide_attack: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player',   x:  22, y:  85, label: 'YOU' },
      { type: 'defender', x:  40, y:  72 },
      { type: 'teammate', x: 100, y:  68 },
      { type: 'teammate', x:  85, y:  90 },
      { type: 'keeper',   x: 100, y:  14 },
      { type: 'ball',     x:  22, y:  90 },
      { type: 'arrow',    x1:  24, y1:  84, x2:  98, y2:  56, color: '#60a5fa', dashed: true },
    ],
  },

  overlap: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player',   x:  75, y:  90, label: 'YOU' },
      { type: 'teammate', x: 150, y:  72 },
      { type: 'defender', x: 112, y:  80 },
      { type: 'keeper',   x: 100, y:  14 },
      { type: 'ball',     x:  76, y:  94 },
      { type: 'arrow',    x1:  78, y1:  88, x2: 148, y2:  74, color: '#60a5fa', dashed: true },
    ],
  },

  through_ball_window: {
    viewBox: '0 0 200 160',
    elements: [
      { type: 'pitch_lines', zone: 'wide' },
      { type: 'player',   x: 100, y: 130, label: 'YOU' },
      { type: 'defender', x:  78, y:  85 },
      { type: 'defender', x: 125, y:  80 },
      { type: 'teammate', x: 100, y:  55 },
      { type: 'ball',     x: 102, y: 134 },
      { type: 'arrow',    x1: 100, y1: 124, x2: 100, y2:  68, color: '#4ade80' },
      // gap indicator
      { type: 'gap_line',  x1: 82, y1: 90, x2: 120, y2: 84 },
    ],
  },

  tight_space: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player',   x: 100, y: 105, label: 'YOU' },
      { type: 'defender', x:  82, y:  88 },
      { type: 'defender', x: 118, y:  90 },
      { type: 'teammate', x: 145, y:  78 },
      { type: 'keeper',   x: 100, y:  14 },
      { type: 'ball',     x: 100, y: 110 },
    ],
  },

  free_kick: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player', x: 100, y: 118, label: 'YOU' },
      { type: 'wall',   x: 100, y:  82 },
      { type: 'keeper', x: 100, y:  14 },
      { type: 'ball',   x: 100, y: 122 },
      { type: 'arrow',  x1: 100, y1: 116, x2:  80, y2:  22, color: '#facc15', dashed: true },
    ],
  },

  corner: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player',   x: 178, y: 135, label: 'YOU' },
      { type: 'ball',     x: 178, y: 138 },
      { type: 'teammate', x:  92, y:  65 },
      { type: 'teammate', x:  76, y:  82 },
      { type: 'teammate', x: 112, y:  58 },
      { type: 'defender', x:  88, y:  70 },
      { type: 'defender', x: 115, y:  65 },
      { type: 'keeper',   x: 100, y:  14 },
      { type: 'arrow',    x1: 174, y1: 132, x2:  96, y2:  62, color: '#4ade80', dashed: true },
    ],
  },

  corner_attack: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player',   x: 100, y:  80, label: 'YOU' },
      { type: 'defender', x:  88, y:  68 },
      { type: 'keeper',   x: 100, y:  14 },
      { type: 'ball',     x: 100, y:  22 },  // ball in the air
      { type: 'arrow',    x1: 100, y1:  22, x2: 100, y2:  68, color: '#facc15', dashed: true },
      { type: 'ball_air', x: 100, y:  38 },
    ],
  },

  own_box_corner: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_bottom' },
      { type: 'player',   x: 100, y:  72, label: 'YOU' },
      { type: 'defender', x: 120, y:  55 },  // attacker
      { type: 'defender', x:  78, y:  60 },  // attacker 2
      { type: 'teammate', x: 100, y: 130 },  // GK
      { type: 'ball',     x:  22, y:  22 },  // corner flag
      { type: 'arrow',    x1:  24, y1:  24, x2:  98, y2:  70, color: '#f87171', dashed: true },
    ],
  },

  penalty_spot: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player', x: 100, y: 105, label: 'YOU' },
      { type: 'keeper', x: 100, y:  18, large: true },
      { type: 'ball',   x: 100, y: 110 },
      { type: 'spot',   x: 100, y: 108 },
      { type: 'arrow',  x1: 100, y1: 102, x2:  70, y2:  22, color: '#facc15', dashed: true },
    ],
  },

  two_v_one: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player',   x:  72, y:  92, label: 'YOU' },
      { type: 'teammate', x: 148, y:  72 },
      { type: 'defender', x: 108, y:  82 },
      { type: 'keeper',   x: 100, y:  14 },
      { type: 'ball',     x:  73, y:  96 },
      { type: 'arrow',    x1:  75, y1:  90, x2: 146, y2:  74, color: '#60a5fa', dashed: true },
    ],
  },

  high_pressure: {
    viewBox: '0 0 200 150',
    elements: [
      { type: 'pitch_lines', zone: 'box_top' },
      { type: 'player',   x: 100, y: 110, label: 'YOU' },
      { type: 'defender', x:  90, y:  85 },
      { type: 'defender', x: 125, y:  75 },
      { type: 'keeper',   x: 100, y:  14 },
      { type: 'ball',     x: 100, y: 115 },
      { type: 'arrow',    x1: 100, y1: 107, x2: 100, y2:  68, color: '#4ade80' },
    ],
  },
};

export function renderPitchMap(zone) {
  const cfg = ZONE_CONFIGS[zone] || ZONE_CONFIGS['box_entry'];
  const { viewBox, elements } = cfg;

  const svgInner = elements.map(renderElement).join('\n  ');

  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" class="pitch-map">
  ${renderBackground(viewBox)}
  ${svgInner}
</svg>`;
}

function renderBackground(viewBox) {
  const [, , w, h] = viewBox.split(' ').map(Number);
  // Grass
  let out = `<rect width="${w}" height="${h}" fill="#2d5a27" rx="6"/>`;
  // Stripes
  for (let i = 0; i < w; i += 20) {
    if ((i / 20) % 2 === 0) {
      out += `<rect x="${i}" y="0" width="20" height="${h}" fill="rgba(0,0,0,0.06)"/>`;
    }
  }
  return out;
}

function renderElement(el) {
  switch (el.type) {

    case 'pitch_lines': {
      if (el.zone === 'box_top') {
        return `
  <!-- penalty box -->
  <rect x="30" y="10" width="140" height="110" stroke="rgba(255,255,255,0.35)" fill="none" stroke-width="1.2"/>
  <!-- 6-yard box -->
  <rect x="70" y="10" width="60" height="30" stroke="rgba(255,255,255,0.25)" fill="none" stroke-width="1"/>
  <!-- goal -->
  <rect x="78" y="0" width="44" height="12" stroke="rgba(255,255,255,0.7)" fill="rgba(255,255,255,0.08)" stroke-width="1.5"/>`;
      }
      if (el.zone === 'box_bottom') {
        return `
  <!-- own box -->
  <rect x="30" y="30" width="140" height="110" stroke="rgba(255,255,255,0.35)" fill="none" stroke-width="1.2"/>
  <rect x="70" y="110" width="60" height="30" stroke="rgba(255,255,255,0.25)" fill="none" stroke-width="1"/>
  <!-- own goal at bottom -->
  <rect x="78" y="138" width="44" height="12" stroke="rgba(255,255,255,0.7)" fill="rgba(255,255,255,0.08)" stroke-width="1.5"/>`;
      }
      if (el.zone === 'wide') {
        return `
  <!-- half -->
  <line x1="0" y1="80" x2="200" y2="80" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <!-- penalty box -->
  <rect x="30" y="10" width="140" height="110" stroke="rgba(255,255,255,0.3)" fill="none" stroke-width="1.2"/>
  <!-- goal -->
  <rect x="78" y="0" width="44" height="12" stroke="rgba(255,255,255,0.7)" fill="rgba(255,255,255,0.08)" stroke-width="1.5"/>`;
      }
      return '';
    }

    case 'player':
      return `<circle cx="${el.x}" cy="${el.y}" r="8" fill="#22c55e" stroke="#fff" stroke-width="2"/>
  <text x="${el.x}" y="${el.y - 13}" text-anchor="middle" fill="#fff" font-size="7.5" font-weight="bold" font-family="Barlow Condensed,sans-serif">${el.label || ''}</text>`;

    case 'defender':
      return `<circle cx="${el.x}" cy="${el.y}" r="7" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>`;

    case 'teammate':
      return `<circle cx="${el.x}" cy="${el.y}" r="7" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>`;

    case 'keeper': {
      const r = el.large ? 9 : 7;
      return `<circle cx="${el.x}" cy="${el.y}" r="${r}" fill="#a855f7" stroke="#fff" stroke-width="1.5"/>
  <text x="${el.x}" y="${el.y - r - 3}" text-anchor="middle" fill="#e9d5ff" font-size="6.5" font-family="Barlow Condensed,sans-serif">GK</text>`;
    }

    case 'ball':
      return `<circle cx="${el.x}" cy="${el.y}" r="4.5" fill="#facc15" stroke="#92400e" stroke-width="1"/>`;

    case 'ball_air':
      return `<circle cx="${el.x}" cy="${el.y}" r="5" fill="#facc15" stroke="#92400e" stroke-width="1" opacity="0.6"/>
  <circle cx="${el.x}" cy="${el.y}" r="8" fill="none" stroke="rgba(250,204,21,0.3)" stroke-width="1"/>`;

    case 'spot':
      return `<circle cx="${el.x}" cy="${el.y}" r="3" fill="rgba(255,255,255,0.6)"/>`;

    case 'wall':
      return `<rect x="${el.x - 20}" y="${el.y - 6}" width="40" height="12" fill="#ef4444" stroke="#fff" stroke-width="1" rx="2"/>
  <text x="${el.x}" y="${el.y + 4}" text-anchor="middle" fill="#fff" font-size="6" font-family="Barlow Condensed,sans-serif" font-weight="bold">WALL</text>`;

    case 'arrow': {
      const dx = el.x2 - el.x1;
      const dy = el.y2 - el.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len; const uy = dy / len;
      const ex = el.x2 - ux * 9;
      const ey = el.y2 - uy * 9;
      const dash = el.dashed ? 'stroke-dasharray="5 3"' : '';
      return `<line x1="${el.x1}" y1="${el.y1}" x2="${ex}" y2="${ey}" stroke="${el.color}" stroke-width="1.8" ${dash} opacity="0.85"/>
  <polygon points="${el.x2},${el.y2} ${el.x2 - ux*8 - uy*4},${el.y2 - uy*8 + ux*4} ${el.x2 - ux*8 + uy*4},${el.y2 - uy*8 - ux*4}" fill="${el.color}" opacity="0.85"/>`;
    }

    case 'gap_line':
      return `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="rgba(250,204,21,0.4)" stroke-width="1" stroke-dasharray="3 3"/>`;

    default:
      return '';
  }
}
