// Generates SVG pitch map snapshots per event type

const ZONE_CONFIGS = {
  box_entry: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      // penalty box
      { type: 'rect', x: 30, y: 20, w: 140, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      // goal
      { type: 'rect', x: 75, y: 0, w: 50, h: 20, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 100, y: 95, label: 'YOU' },
      { type: 'defender', x: 95, y: 70 },
      { type: 'defender', x: 130, y: 55 },
      { type: 'keeper', x: 100, y: 15 },
      { type: 'ball', x: 100, y: 100 },
      { type: 'arrow', x1: 100, y1: 95, x2: 100, y2: 60, color: '#4ade80' },
    ],
  },
  shooting_chance: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'rect', x: 30, y: 20, w: 140, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 0, w: 50, h: 20, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
      { type: 'arc', cx: 100, cy: 80, r: 30, startAngle: 200, endAngle: 340, stroke: 'rgba(255,255,255,0.3)' },
    ],
    elements: [
      { type: 'player', x: 100, y: 85, label: 'YOU' },
      { type: 'keeper', x: 100, y: 12 },
      { type: 'ball', x: 100, y: 85 },
      { type: 'arrow', x1: 100, y1: 80, x2: 100, y2: 25, color: '#facc15', dashed: true },
    ],
  },
  counter_attack: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'line', x1: 0, y1: 70, x2: 200, y2: 70, stroke: 'rgba(255,255,255,0.3)', sw: 1 },
      { type: 'rect', x: 30, y: 10, w: 140, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 0, w: 50, h: 10, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 100, y: 90, label: 'YOU' },
      { type: 'defender', x: 105, y: 80 },
      { type: 'ball', x: 95, y: 92 },
      { type: 'arrow', x1: 100, y1: 85, x2: 100, y2: 40, color: '#4ade80' },
      { type: 'keeper', x: 100, y: 12 },
    ],
  },
  wide_attack: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'rect', x: 30, y: 20, w: 140, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 0, w: 50, h: 20, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 35, y: 75, label: 'YOU' },
      { type: 'defender', x: 55, y: 65 },
      { type: 'teammate', x: 110, y: 55 },
      { type: 'teammate', x: 90, y: 80 },
      { type: 'ball', x: 35, y: 80 },
      { type: 'keeper', x: 100, y: 12 },
      { type: 'arrow', x1: 35, y1: 75, x2: 100, y2: 45, color: '#4ade80', dashed: true },
    ],
  },
  tight_space: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'rect', x: 20, y: 20, w: 160, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 0, w: 50, h: 20, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 100, y: 100, label: 'YOU' },
      { type: 'defender', x: 90, y: 80 },
      { type: 'defender', x: 115, y: 85 },
      { type: 'teammate', x: 130, y: 70 },
      { type: 'ball', x: 102, y: 100 },
      { type: 'arrow', x1: 100, y1: 95, x2: 130, y2: 72, color: '#60a5fa', dashed: true },
    ],
  },
  high_pressure: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'rect', x: 30, y: 20, w: 140, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 0, w: 50, h: 20, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 100, y: 95, label: 'YOU' },
      { type: 'defender', x: 95, y: 70 },
      { type: 'defender', x: 125, y: 60 },
      { type: 'keeper', x: 100, y: 12 },
      { type: 'ball', x: 100, y: 98 },
    ],
  },
  own_box_corner: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'rect', x: 30, y: 40, w: 140, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 120, w: 50, h: 20, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 100, y: 80, label: 'YOU' },
      { type: 'defender', x: 120, y: 65 },
      { type: 'defender', x: 80, y: 70 },
      { type: 'teammate', x: 100, y: 125 },  // keeper
      { type: 'ball', x: 30, y: 40 },   // corner flag
      { type: 'arrow', x1: 30, y1: 40, x2: 100, y2: 80, color: '#f87171', dashed: true },
    ],
  },
  free_kick: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'rect', x: 30, y: 15, w: 140, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 0, w: 50, h: 15, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 100, y: 100, label: 'YOU' },
      { type: 'wall', x: 100, y: 70 },
      { type: 'keeper', x: 100, y: 10 },
      { type: 'ball', x: 100, y: 103 },
      { type: 'arrow', x1: 100, y1: 98, x2: 100, y2: 20, color: '#facc15', dashed: true },
    ],
  },
  corner: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'rect', x: 30, y: 20, w: 140, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 0, w: 50, h: 20, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 170, y: 120, label: 'YOU' },
      { type: 'ball', x: 170, y: 123 },
      { type: 'teammate', x: 100, y: 50 },
      { type: 'teammate', x: 80, y: 65 },
      { type: 'defender', x: 105, y: 55 },
      { type: 'keeper', x: 100, y: 12 },
      { type: 'arrow', x1: 165, y1: 120, x2: 100, y2: 50, color: '#4ade80', dashed: true },
    ],
  },
  two_v_one: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'rect', x: 30, y: 20, w: 140, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 0, w: 50, h: 20, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 80, y: 80, label: 'YOU' },
      { type: 'teammate', x: 140, y: 65 },
      { type: 'defender', x: 110, y: 72 },
      { type: 'ball', x: 82, y: 82 },
      { type: 'arrow', x1: 82, y1: 80, x2: 140, y2: 66, color: '#60a5fa', dashed: true },
    ],
  },
  through_ball_window: {
    viewBox: '0 0 200 140',
    bg: '#2d5a27',
    lines: [
      { type: 'rect', x: 20, y: 30, w: 160, h: 100, stroke: 'rgba(255,255,255,0.4)', fill: 'none', sw: 1.5 },
      { type: 'rect', x: 75, y: 0, w: 50, h: 30, stroke: 'rgba(255,255,255,0.6)', fill: 'rgba(255,255,255,0.1)', sw: 1.5 },
    ],
    elements: [
      { type: 'player', x: 100, y: 110, label: 'YOU' },
      { type: 'defender', x: 80, y: 65 },
      { type: 'defender', x: 125, y: 60 },
      { type: 'teammate', x: 100, y: 45 },
      { type: 'ball', x: 102, y: 112 },
      { type: 'arrow', x1: 100, y1: 107, x2: 100, y2: 50, color: '#4ade80', dashed: true },
    ],
  },
};

export function renderPitchMap(zone) {
  const cfg = ZONE_CONFIGS[zone] || ZONE_CONFIGS['box_entry'];
  const { viewBox, bg, lines = [], elements = [] } = cfg;

  let svg = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" class="pitch-map">
  <rect width="100%" height="100%" fill="${bg}" rx="6"/>
  <!-- grass stripes -->
  ${renderStripes(viewBox)}
  ${lines.map(renderLine).join('\n  ')}
  ${elements.map(renderElement).join('\n  ')}
</svg>`;

  return svg;
}

function renderStripes(viewBox) {
  const parts = viewBox.split(' ');
  const w = parseInt(parts[2]);
  const h = parseInt(parts[3]);
  let out = '';
  for (let i = 0; i < w; i += 20) {
    if ((i / 20) % 2 === 0) {
      out += `<rect x="${i}" y="0" width="20" height="${h}" fill="rgba(0,0,0,0.06)"/>`;
    }
  }
  return out;
}

function renderLine(l) {
  if (l.type === 'rect') {
    return `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" stroke="${l.stroke}" fill="${l.fill}" stroke-width="${l.sw}"/>`;
  }
  if (l.type === 'line') {
    return `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${l.stroke}" stroke-width="${l.sw}"/>`;
  }
  if (l.type === 'arc') {
    const r = l.r;
    const cx = l.cx; const cy = l.cy;
    const s = (l.startAngle * Math.PI) / 180;
    const e = (l.endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    return `<path d="M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}" stroke="${l.stroke}" fill="none" stroke-width="1.5"/>`;
  }
  return '';
}

function renderElement(el) {
  switch (el.type) {
    case 'player':
      return `<circle cx="${el.x}" cy="${el.y}" r="7" fill="#22c55e" stroke="#fff" stroke-width="1.5"/>
              <text x="${el.x}" y="${el.y - 11}" text-anchor="middle" fill="#fff" font-size="7" font-weight="bold" font-family="Barlow,sans-serif">${el.label || ''}</text>`;
    case 'defender':
      return `<circle cx="${el.x}" cy="${el.y}" r="6" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>`;
    case 'teammate':
      return `<circle cx="${el.x}" cy="${el.y}" r="6" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>`;
    case 'keeper':
      return `<circle cx="${el.x}" cy="${el.y}" r="6" fill="#a855f7" stroke="#fff" stroke-width="1.5"/>
              <text x="${el.x}" y="${el.y - 9}" text-anchor="middle" fill="#e9d5ff" font-size="6" font-family="Barlow,sans-serif">GK</text>`;
    case 'ball':
      return `<circle cx="${el.x}" cy="${el.y}" r="4" fill="#facc15" stroke="#92400e" stroke-width="1"/>`;
    case 'wall':
      return `<rect x="${el.x - 18}" y="${el.y - 5}" width="36" height="10" fill="#ef4444" stroke="#fff" stroke-width="1" rx="2"/>
              <text x="${el.x}" y="${el.y + 4}" text-anchor="middle" fill="#fff" font-size="6" font-family="Barlow,sans-serif">WALL</text>`;
    case 'arrow': {
      const dx = el.x2 - el.x1;
      const dy = el.y2 - el.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len; const uy = dy / len;
      const ex = el.x2 - ux * 8;
      const ey = el.y2 - uy * 8;
      const dash = el.dashed ? 'stroke-dasharray="4 3"' : '';
      return `<line x1="${el.x1}" y1="${el.y1}" x2="${ex}" y2="${ey}" stroke="${el.color}" stroke-width="1.5" ${dash} opacity="0.8"/>
              <polygon points="${el.x2},${el.y2} ${el.x2 - ux * 7 - uy * 4},${el.y2 - uy * 7 + ux * 4} ${el.x2 - ux * 7 + uy * 4},${el.y2 - uy * 7 - ux * 4}" fill="${el.color}" opacity="0.8"/>`;
    }
    default:
      return '';
  }
}
