// Screen rendering helpers — returns HTML strings injected into #app

import { NATIONS } from '../data/nations.js';
import { PROFILES } from '../data/profiles.js';
import { BACKGROUNDS, SCHOOL_FOCUS, YOUTH_EVENTS, NATIONALITY_NAMES, FORMATION_433, POSITION_MAP } from '../data/background.js';
import { WEAPONS, DISCOVER_OPTION } from '../data/weapons.js';
import { GameState } from '../engine/GameState.js';
import { RatingEngine } from '../engine/RatingEngine.js';
import { renderPitchMap } from './pitchMap.js';
import { renderStatsBlock } from '../data/events_flavor.js';

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatStatName(key) {
  const names = {
    dribbling: 'DRI', agility: 'AGI', finishing: 'FIN',
    composure: 'CMP', vision: 'VIS', longPassing: 'LPS',
    shortPassing: 'SPS', physicality: 'PHY', pace: 'PAC',
    balance: 'BAL', ballControl: 'CTL', longShots: 'LSH',
    heading: 'HED', acceleration: 'ACC', intelligence: 'INT',
    stamina: 'STA', shortTackle: 'STK', slideTackle: 'SLD',
    positioning: 'POS', gk_diving: 'DIV', gk_reflexes: 'REF',
    gk_composure: 'GKC', gk_handling: 'HND',
  };
  return names[key] || key.toUpperCase().slice(0, 3);
}

function getOppStat(key) {
  const opp = GameState.opponent;
  if (!opp) return '?';
  if (key.startsWith('gk_')) return opp.gk?.[key] ?? '?';
  return opp.defender?.[key] ?? '?';
}

// ── CREATION ─────────────────────────────────────────────────────────────────

export function creationScreen() {
  return `
<div class="screen creation-screen animate__animated animate__fadeIn">
  <div class="creation-header">
    <div class="badge">STRIKER</div>
    <h1>Create Your Player</h1>
    <p class="subtitle">Academy Debut — Under-21 Trial Match</p>
  </div>

  <div class="creation-body">
    <!-- Name -->
    <div class="form-group">
      <label>Player Name</label>
      <input type="text" id="player-name" placeholder="Enter your name..." maxlength="24" autocomplete="off"/>
    </div>

    <!-- Nationality -->
    <div class="form-group">
      <label>Nationality</label>
      <div class="flag-grid" id="nation-grid">
        ${NATIONS.map(n => `
          <button class="flag-btn" data-nation="${n.id}">
            <img class="flag-img" src="https://flagcdn.com/w40/${n.code}.png" alt="${n.name}" loading="lazy">
            <span class="flag-name">${n.name}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Position -->
    <div class="form-group">
      <label>Position</label>
      <div class="button-row" id="position-grid">
        ${['ST','CAM','LW','RW'].map(p => `
          <button class="choice-btn" data-position="${p}">${p}</button>
        `).join('')}
      </div>
    </div>

    <!-- Profile -->
    <div class="form-group">
      <label>Physical Profile</label>
      <div class="profile-grid" id="profile-grid">
        ${PROFILES.map(p => `
          <button class="profile-btn" data-profile="${p.id}">
            <div class="profile-icon">${p.icon}</div>
            <div class="profile-name">${p.name}</div>
            <div class="profile-desc">${p.desc}</div>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Weapon -->
    <div class="form-group">
      <label>Starting Weapon</label>
      <div class="weapon-grid" id="weapon-grid">
        ${WEAPONS.map(w => `
          <button class="weapon-btn" data-weapon="${w.id}">
            <span class="weapon-icon">${w.icon}</span>
            <div class="weapon-info">
              <div class="weapon-name">${w.name}</div>
              <div class="weapon-desc">${w.desc}</div>
            </div>
          </button>
        `).join('')}
        <button class="weapon-btn discover-btn" data-weapon="discover">
          <span class="weapon-icon">${DISCOVER_OPTION.icon}</span>
          <div class="weapon-info">
            <div class="weapon-name">${DISCOVER_OPTION.name}</div>
            <div class="weapon-desc">${DISCOVER_OPTION.desc}</div>
          </div>
        </button>
      </div>
    </div>

    <button class="cta-btn" id="create-player-btn" disabled>Generate Stat Card →</button>
  </div>
</div>`;
}

export function statCardScreen() {
  const p = GameState.player;
  const stats = p.stats;
  const { label, color } = RatingEngine.band(p.overall / 10 + 3.5);
  const nation = NATIONS.find(n => n.id === p.nationality);
  const profile = PROFILES.find(pr => pr.id === p.profile);
  const weapon = p.weapon === 'discover'
    ? DISCOVER_OPTION
    : WEAPONS.find(w => w.id === p.weapon);

  const STAT_DISPLAY = [
    { key: 'pace',         label: 'PAC' },
    { key: 'dribbling',   label: 'DRI' },
    { key: 'finishing',   label: 'FIN' },
    { key: 'passing',     label: 'PAS' },
    { key: 'physicality', label: 'PHY' },
    { key: 'heading',     label: 'HEA' },
  ];

  return `
<div class="screen stat-card-screen animate__animated animate__fadeIn">
  <div class="creation-header">
    <div class="badge">STAT CARD</div>
    <h1>${p.name || 'Your Player'}</h1>
  </div>

  <div class="card-container">
    <div class="fifa-card">
      <div class="card-top">
        <div class="card-overall">${p.overall}</div>
        <div class="card-pos">${p.position}</div>
        <div class="card-flag">${nation?.flag || ''}</div>
        <div class="card-avatar">⚽</div>
      </div>
      <div class="card-name">${p.name || 'Player'}</div>
      <div class="card-stats">
        ${STAT_DISPLAY.map(s => `
          <div class="card-stat">
            <span class="cs-val">${stats[s.key] || 0}</span>
            <span class="cs-label">${s.label}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card-details">
      <div class="detail-row">
        <span class="detail-label">Profile</span>
        <span class="detail-val">${profile?.icon} ${profile?.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Weapon</span>
        <span class="detail-val">${weapon?.icon} ${weapon?.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Stamina</span>
        <span class="detail-val">${stats.stamina}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Vision</span>
        <span class="detail-val">${stats.vision}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Agility</span>
        <span class="detail-val">${stats.agility}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ball Control</span>
        <span class="detail-val">${stats.ball_control}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ego</span>
        <span class="detail-val">${stats.ego}</span>
      </div>

      <div class="full-stat-bars">
        ${Object.entries(stats).filter(([k]) => !['ego','confidence'].includes(k)).map(([k, v]) => `
          <div class="stat-bar-row">
            <span class="sb-label">${k.replace('_',' ').toUpperCase()}</span>
            <div class="sb-track">
              <div class="sb-fill" style="width:${((v-42)/26)*100}%; background:${v >= 65 ? '#ffd700' : v >= 58 ? '#4ade80' : '#60a5fa'}"></div>
            </div>
            <span class="sb-val">${v}</span>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <button class="cta-btn" id="start-match-btn">Kick Off →</button>
</div>`;
}

// ── MATCH HUD ────────────────────────────────────────────────────────────────

export function matchHUD() {
  const m = GameState.match;
  const p = GameState.player;
  const { label, color } = RatingEngine.band(m.rating);
  const staminaColor = m.stamina >= 70 ? '#4ade80' : m.stamina >= 40 ? '#facc15' : m.stamina >= 20 ? '#fb923c' : '#ef4444';

  const offPitch = m.sentOff || (m.substituted && !m.sentOff);
  const offPitchLabel = m.sentOff
    ? '🟥 OFF THE PITCH — Suspended'
    : '🚑 OFF THE PITCH — Subbed off';

  return `
<div class="hud">
  <div class="hud-score">
    <span class="hud-team us">US</span>
    <span class="hud-goals">${m.score.us} – ${m.score.them}</span>
    <span class="hud-team them">OPP</span>
  </div>
  <div class="hud-minute">
    <span class="clock">${m.minute}'</span>
  </div>
  <div class="hud-right">
    <div class="hud-rating" style="color:${color}">${m.rating.toFixed(1)} <span class="rating-label">${label}</span></div>
  </div>

  ${offPitch ? `
  <div class="hud-off-pitch-bar">${offPitchLabel}</div>
  ` : `
  <div class="hud-bars">
    <div class="hud-bar-group">
      <span class="hud-bar-label">STA</span>
      <div class="hud-bar-track">
        <div class="hud-bar-fill" style="width:${m.stamina}%;background:${staminaColor}"></div>
      </div>
      <span class="hud-bar-val">${Math.round(m.stamina)}</span>
    </div>
    <div class="hud-bar-group">
      <span class="hud-bar-label">MOM</span>
      <div class="hud-bar-track">
        <div class="hud-bar-fill" style="width:${m.momentum}%;background:#a78bfa"></div>
      </div>
      <span class="hud-bar-val">${Math.round(m.momentum)}</span>
    </div>
  </div>

  <div class="hud-controls">
    <div class="hud-control-group">
      <span class="hud-ctrl-label">WORK RATE</span>
      <div class="toggle-group" id="wr-toggle">
        <button class="toggle-btn ${m.workRate === 'low' ? 'active' : ''}" data-wr="low">LOW</button>
        <button class="toggle-btn ${m.workRate === 'medium' ? 'active' : ''}" data-wr="medium">MED</button>
        <button class="toggle-btn ${m.workRate === 'high' ? 'active' : ''}" data-wr="high" ${m.stamina < 19 ? 'disabled' : ''}>HIGH</button>
      </div>
    </div>
    <div class="hud-control-group">
      <span class="hud-ctrl-label">MENTALITY</span>
      <div class="toggle-group" id="men-toggle">
        <button class="toggle-btn ${m.mentality === 'attacking' ? 'active' : ''}" data-men="attacking">ATK</button>
        <button class="toggle-btn ${m.mentality === 'balanced' ? 'active' : ''}" data-men="balanced">BAL</button>
        <button class="toggle-btn ${m.mentality === 'defensive' ? 'active' : ''}" data-men="defensive">DEF</button>
      </div>
    </div>
  </div>
  `}
  ${renderStatsBlock(GameState)}
</div>`;
}

export function matchFeedPanel(feed) {
  return `
<div class="feed-panel" id="feed-panel">
  ${feed.slice(-20).reverse().map((entry, i) => `
    <div class="feed-entry ${i === 0 ? 'feed-latest animate__animated animate__fadeInDown' : ''}">${entry}</div>
  `).join('')}
</div>`;
}

// ── EVENT SCREEN ─────────────────────────────────────────────────────────────

export function eventScreen(eventDef, filteredChoices) {
  const m = GameState.match;
  const p = GameState.player;
  const { label: rLabel, color: rColor } = RatingEngine.band(m.rating);

  const weaponId = p.weapon === 'discover' ? m.discoveredWeapon : p.weapon;
  const weapon = weaponId ? WEAPONS.find(w => w.id === weaponId) : null;

  const staminaColor = m.stamina >= 70 ? '#4ade80' : m.stamina >= 40 ? '#facc15' : m.stamina >= 20 ? '#fb923c' : '#ef4444';
  const staminaLabel = m.stamina >= 70 ? 'Sharp' : m.stamina >= 40 ? 'Tiring' : m.stamina >= 20 ? 'Heavy' : 'Exhausted';

  const pitchZone = eventDef.pitchMap || 'box_entry';

  return `
<div class="screen event-screen animate__animated animate__fadeIn">
  <div class="event-header">
    <div class="event-meta">
      <span class="ev-minute">${m.minute}'</span>
      <span class="ev-score">${m.score.us}–${m.score.them}</span>
      <span class="ev-rating" style="color:${rColor}">${m.rating.toFixed(1)}</span>
      <span class="ev-stamina" style="color:${staminaColor}">${staminaLabel}</span>
      ${weapon ? `<span class="ev-weapon">${weapon.icon} ${weapon.name}</span>` : ''}
    </div>
  </div>

  <div class="pitch-map-container">
    ${renderPitchMap(pitchZone)}
  </div>

  <div class="event-narrative">
    ${eventDef.narrative(GameState)}
  </div>

  <div class="choices-grid" id="choices-grid">
    ${filteredChoices.map(c => {
      const boosted = weapon && c.weaponBoost?.includes(weapon.id);
      return `
      <button class="choice-card ${c.isEgo ? 'ego' : 'safe'} ${boosted ? 'weapon-boosted' : ''}"
              data-choice="${c.id}">
        <div class="cc-top">
          <span class="cc-label">${c.label}</span>
          ${c.isEgo ? '<span class="cc-ego">EGO</span>' : ''}
          ${boosted ? `<span class="cc-boost">${weapon.icon} BOOSTED</span>` : ''}
        </div>
        <div class="cc-desc">${c.desc}</div>
        <div class="cc-stats-row">
          <div class="cc-stats-yours">
            ${(c.yourStats||[]).map(s => `<span class="cc-stat-chip yours">${formatStatName(s)}&nbsp;<strong>${p.stats[s] || '?'}</strong></span>`).join('')}
          </div>
          <span class="cc-vs">vs</span>
          <div class="cc-stats-opp">
            ${(c.oppStats||[]).map(s => `<span class="cc-stat-chip opp">${formatStatName(s)}&nbsp;<strong>${getOppStat(s)}</strong></span>`).join('')}
          </div>
        </div>
      </button>`;
    }).join('')}
  </div>
</div>`;
}

// ── OUTCOME SCREEN ────────────────────────────────────────────────────────────

export function outcomeScreen(result, narrativeText) {
  const { success, isNat20, isNat1, playerRoll, oppRoll, choice } = result;
  const m = GameState.match;
  const { label: rLabel, color: rColor } = RatingEngine.band(m.rating);

  const badge = isNat20
    ? '<div class="outcome-badge nat20">⚡ NATURAL 20 — BRILLIANT!</div>'
    : isNat1
    ? '<div class="outcome-badge nat1">💀 NATURAL 1 — MISTAKE!</div>'
    : success
    ? '<div class="outcome-badge success">✓ SUCCESS</div>'
    : '<div class="outcome-badge failure">✗ FAILED</div>';

  return `
<div class="screen outcome-screen animate__animated animate__fadeIn">
  ${badge}

  <div class="outcome-result-card ${success ? 'success' : 'failure'}">
    <div class="orc-icon">${isNat20 ? '⚡' : isNat1 ? '💀' : success ? '✓' : '✗'}</div>
    <div class="orc-narrative">${narrativeText}</div>
  </div>

  <div class="dice-display">
    <div class="dice-block">
      <div class="dice-face ${isNat20 ? 'nat20' : isNat1 ? 'nat1' : ''}">${playerRoll.dice}</div>
      <div class="dice-label">YOUR ROLL</div>
      <div class="dice-total">+${playerRoll.baseMod + playerRoll.extraMods.reduce((a,b)=>a+b.value,0)} = <strong>${playerRoll.total}</strong></div>
    </div>
    <div class="dice-vs">VS</div>
    <div class="dice-block">
      <div class="dice-face opp">${oppRoll.dice}</div>
      <div class="dice-label">OPPONENT</div>
      <div class="dice-total">+${oppRoll.baseMod} = <strong>${oppRoll.total}</strong></div>
    </div>
  </div>

  ${playerRoll.advantage ? '<div class="adv-badge advantage">⬆ ADVANTAGE</div>' :
    playerRoll.disadvantage ? '<div class="adv-badge disadvantage">⬇ DISADVANTAGE</div>' : ''}

  <div class="mods-list">
    ${playerRoll.extraMods.map(mod => `
      <span class="mod-chip ${mod.value > 0 ? 'pos' : 'neg'}">${mod.label}: ${mod.value > 0 ? '+' : ''}${mod.value}</span>
    `).join('')}
  </div>

  <div class="outcome-rating">
    Rating: <span style="color:${rColor}">${m.rating.toFixed(1)} — ${rLabel}</span>
  </div>

  <button class="cta-btn" id="continue-btn">Continue →</button>
</div>`;
}

// ── WEAPON DISCOVERY ─────────────────────────────────────────────────────────

export function weaponDiscoveryScreen(weapon) {
  return `
<div class="screen weapon-discovery animate__animated animate__zoomIn">
  <div class="wd-badge">WEAPON DISCOVERED</div>
  <div class="wd-icon">${weapon.icon}</div>
  <h2>${weapon.name}</h2>
  <p>${weapon.desc}</p>
  <div class="wd-glow"></div>
  <button class="cta-btn" id="wd-continue-btn">Let's Go →</button>
</div>`;
}

// ── POST MATCH ────────────────────────────────────────────────────────────────

export function postMatchScreen() {
  const m = GameState.match;
  const p = GameState.player;
  const { label, color } = RatingEngine.band(m.rating);

  const result = m.score.us > m.score.them ? 'WIN' :
                 m.score.us < m.score.them ? 'LOSS' : 'DRAW';

  const resultColor = result === 'WIN' ? '#4ade80' : result === 'LOSS' ? '#ef4444' : '#facc15';

  const managerQuote = generateManagerQuote(m, result);
  const headline = generateHeadline(m, p);

  const offPitch = generateOffPitchEvent(m, result);

  return `
<div class="screen post-match-screen animate__animated animate__fadeIn">
  <div class="pm-header">
    <div class="pm-result" style="color:${resultColor}">${result}</div>
    <div class="pm-score">${m.score.us} – ${m.score.them}</div>
    <div class="pm-rating-block">
      <div class="pm-rating" style="color:${color}">${m.rating.toFixed(1)}</div>
      <div class="pm-band">${label}</div>
    </div>
  </div>

  <div class="pm-stats">
    <div class="pm-stat"><span>Goals</span><strong>${m.goals}</strong></div>
    <div class="pm-stat"><span>Assists</span><strong>${m.assists}</strong></div>
    <div class="pm-stat"><span>Events</span><strong>${m.eventsResolved}</strong></div>
    <div class="pm-stat"><span>Ego Plays</span><strong>${m.egoChoicesMade}</strong></div>
  </div>

  ${m.exhaustionSub ? `
  <div class="pm-sub-notice">
    🚑 <strong>Substituted through exhaustion</strong> — stamina ran out before full time.
    Work rate management will be critical going forward.
  </div>` : ''}

  <div class="pm-headline">"${headline}"</div>

  <div class="pm-manager">
    <div class="pm-manager-label">MANAGER</div>
    <div class="pm-manager-quote">${managerQuote}</div>
  </div>

  <div class="pm-offpitch">
    <div class="pm-op-label">AFTER THE MATCH</div>
    <div class="pm-op-text">${offPitch.text}</div>
    <div class="pm-op-choices" id="op-choices">
      ${offPitch.choices.map((c, i) => `
        <button class="choice-card op-choice" data-op="${i}">
          <div class="cc-label">${c.label}</div>
          <div class="cc-desc">${c.effect}</div>
        </button>
      `).join('')}
    </div>
  </div>

  <div class="pm-stat-gains" id="stat-gains-reveal" style="display:none">
    <div class="pm-sg-label">STAT IMPROVEMENTS</div>
    <div id="stat-gains-list"></div>
    <button class="cta-btn" id="play-again-btn" style="margin-top:2rem">Play Again →</button>
  </div>
</div>`;
}

// ── DEBUG PANEL ───────────────────────────────────────────────────────────────

export function debugPanel() {
  const rolls = GameState.debug.rolls;

  return `
<div class="debug-panel">
  <div class="debug-title">🎲 DEBUG — Roll Log</div>
  <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
    <button onclick="window.__debugCard('yellow')" style="padding:4px 8px;font-size:11px;background:#856404;border:none;border-radius:4px;color:#fff;cursor:pointer">🟨 Yellow</button>
    <button onclick="window.__debugCard('red')" style="padding:4px 8px;font-size:11px;background:#7f1d1d;border:none;border-radius:4px;color:#fff;cursor:pointer">🟥 Red Card</button>
    <button onclick="window.__debugCard('sub')" style="padding:4px 8px;font-size:11px;background:#1e3a5f;border:none;border-radius:4px;color:#fff;cursor:pointer">🚑 Sub Off</button>
  </div>
  ${!rolls.length ? '<em>No rolls yet.</em>' : ''}
  <div class="debug-rolls">
    ${rolls.slice(-30).reverse().map(r => `
      <div class="debug-entry ${r.isNat20 ? 'nat20' : r.isNat1 ? 'nat1' : ''}">
        <span class="dr-label">${r.label}</span>
        <span class="dr-dice">${r.advantage ? '⬆' : r.disadvantage ? '⬇' : ''}d20: <strong>${r.dice}</strong>${r.r2 != null ? ` / ${r.r1 === r.dice ? r.r2 : r.r1}` : ''}</span>
        <span class="dr-mod">mod: ${r.baseMod >= 0 ? '+' : ''}${r.baseMod}</span>
        ${r.extraMods.map(m => `<span class="dr-extra">${m.label}: ${m.value >= 0 ? '+' : ''}${m.value}</span>`).join('')}
        <span class="dr-total">= <strong>${r.total}</strong></span>
        ${r.isNat20 ? '<span class="dr-badge nat20">NAT 20</span>' : ''}
        ${r.isNat1  ? '<span class="dr-badge nat1">NAT 1</span>'  : ''}
      </div>
    `).join('')}
  </div>
</div>`;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function generateManagerQuote(m, result) {
  if (m.rating >= 8.0)
    return `"That was outstanding. I've not seen many academy players perform like that. Keep going."`;
  if (m.rating >= 7.0)
    return `"Good match. You showed quality when it mattered. A few more moments like that and you'll be pushing for more minutes."`;
  if (m.rating >= 6.0)
    return `"Decent enough. You were there or thereabouts. Consistency is the next step."`;
  if (m.rating >= 5.0)
    return `"Not your best today. You've got to be more decisive — the game asked questions and you weren't always ready."`;
  return `"I'll be honest with you — that wasn't good enough. We'll go again in training. You've got ability, but this can't happen again."`;
}

function generateHeadline(m, p) {
  if (m.goals >= 2)      return `${p.name || 'Academy Kid'} Announces Himself With Brace On Debut`;
  if (m.goals === 1 && m.assists >= 1) return `Goal And Assist — ${p.name || 'The Youngster'} Impresses In Trial`;
  if (m.rating >= 8.5)   return `${p.name || 'Youngster'} Dazzles In Academy Trial — Clubs To Watch`;
  if (m.rating >= 7.0)   return `Promising Display From ${p.name || 'Academy Hopeful'} In First Outing`;
  if (m.rating >= 6.0)   return `Steady Start For ${p.name || 'New Recruit'} — Room To Grow`;
  if (m.rating >= 5.0)   return `Tough Debut For ${p.name || 'The Kid'} — Manager Backs Him To Improve`;
  return                        `${p.name || 'Academy Trialist'} Has Work To Do After Rocky Debut`;
}

function generateOffPitchEvent(m, result) {
  if (m.rating >= 7.0) {
    return {
      text: `Your teammate Rashid approaches as you head to the dressing room. "Serious performance today. Where did you learn to move like that?"`,
      choices: [
        { label: '"Just natural."',     effect: '+Ego, +Confidence' },
        { label: '"Hard work, always."', effect: '+Form Modifier for next match' },
        { label: '"Your runs helped me."', effect: '+Relationship: Rashid' },
      ],
    };
  }
  if (result === 'LOSS') {
    return {
      text: `The coach pulls you aside. "Tough one today. But I saw the effort. You want this?"`,
      choices: [
        { label: '"I\'ll be better."',          effect: '+Confidence' },
        { label: '"We need to change the system."', effect: '-Relationship: Coach, +Ego' },
        { label: '"I\'m learning."',            effect: 'Neutral — steady build' },
      ],
    };
  }
  return {
    text: `In the tunnel, a senior player nods at you. "Not bad, kid. You've got pace. Don't waste it."`,
    choices: [
      { label: '"Appreciate that."',   effect: '+Confidence' },
      { label: '"I\'m just getting started."', effect: '+Ego' },
      { label: 'Say nothing — focus.', effect: '+Form Modifier' },
    ],
  };
}

// ── BACKGROUND SYSTEM ────────────────────────────────────────────────────────

function statModsPreview(mods) {
  return Object.entries(mods).map(([k, v]) => {
    const label = formatStatName(k);
    const sign = v > 0 ? '+' : '';
    const cls = v > 0 ? 'smod-pos' : 'smod-neg';
    return `<span class="${cls}">${sign}${v} ${label}</span>`;
  }).join('');
}

function miniStatBar(label, val) {
  const pct = ((val - 42) / 30) * 100;
  const col = val >= 65 ? '#ffd700' : val >= 58 ? '#4ade80' : '#60a5fa';
  return `
    <div class="spm-row">
      <span class="spm-label">${label}</span>
      <div class="spm-track"><div class="spm-fill" style="width:${Math.min(100,Math.max(0,pct))}%;background:${col}"></div></div>
      <span class="spm-val">${val}</span>
    </div>`;
}

function statPreviewPanel() {
  const s = GameState.player.stats;
  const rows = [
    ['PAC', s.pace || 0], ['DRI', s.dribbling || 0], ['FIN', s.finishing || 0],
    ['PAS', s.passing || 0], ['PHY', s.physicality || 0], ['HEA', s.heading || 0],
  ];
  return `
    <div class="stat-preview-mini">
      <div class="spm-title">YOUR STATS</div>
      ${rows.map(([l, v]) => miniStatBar(l, v)).join('')}
    </div>`;
}

export function backgroundStep1Screen() {
  return `
<div class="screen bg-screen animate__animated animate__fadeIn">
  <div class="bg-header">
    <div class="badge">BACKGROUND</div>
    <h2 class="bg-title">WHERE DID YOU COME FROM?</h2>
    <p class="bg-subtitle">Your background shapes who you are before you ever kick a ball.</p>
  </div>
  <div class="bg-body">
    <div class="bg-choices" id="bg1-choices">
      ${BACKGROUNDS.map(b => `
        <button class="bg-choice-btn" data-bg="${b.id}">
          <div class="bgc-top">
            <span class="bgc-icon">${b.icon}</span>
            <div class="bgc-info">
              <div class="bgc-label">${b.label}</div>
              <div class="bgc-desc">${b.desc}</div>
            </div>
          </div>
          <div class="bgc-flavour">${b.flavour}</div>
          <div class="bgc-mods">${statModsPreview(b.statMods)}</div>
        </button>
      `).join('')}
    </div>
    ${statPreviewPanel()}
  </div>
</div>`;
}

export function backgroundStep2Screen() {
  return `
<div class="screen bg-screen animate__animated animate__fadeIn">
  <div class="bg-header">
    <div class="badge">BACKGROUND</div>
    <h2 class="bg-title">IN SCHOOL, YOU...</h2>
    <p class="bg-subtitle">How you spent your time shaped how you think.</p>
  </div>
  <div class="bg-body">
    <div class="bg-choices" id="bg2-choices">
      ${SCHOOL_FOCUS.map(s => `
        <button class="bg-choice-btn" data-school="${s.id}">
          <div class="bgc-top">
            <span class="bgc-icon">${s.icon}</span>
            <div class="bgc-info">
              <div class="bgc-label">${s.label}</div>
              <div class="bgc-desc">${s.desc}</div>
            </div>
          </div>
          <div class="bgc-mods">${statModsPreview(s.statMods)}</div>
        </button>
      `).join('')}
    </div>
    ${statPreviewPanel()}
  </div>
</div>`;
}

export function youthEventScreen(eventDef) {
  return `
<div class="screen youth-event-screen animate__animated animate__fadeIn">
  <div class="ye-eyebrow">${eventDef.letter} — YOUTH EVENT</div>
  <div class="ye-title">${eventDef.title}</div>
  <div class="ye-narrative">${eventDef.narrative}</div>
  <div class="ye-choices" id="ye-choices">
    ${eventDef.choices.map(c => `
      <button class="ye-choice-btn" data-choice="${c.id}">
        <div class="ye-choice-label">${c.label}</div>
        <div class="ye-choice-desc">${c.desc}</div>
        <div class="bgc-mods">${statModsPreview(c.statMods)}</div>
      </button>
    `).join('')}
  </div>
  ${statPreviewPanel()}
</div>`;
}

export function youthEventResultScreen(eventDef, choiceId) {
  const choice = eventDef.choices.find(c => c.id === choiceId);
  return `
<div class="screen youth-result-screen animate__animated animate__fadeIn">
  <div class="ye-eyebrow">${eventDef.letter} — YOUTH EVENT</div>
  <div class="ye-title">${eventDef.title}</div>
  <div class="yr-result">${choice?.result || ''}</div>
  <div class="yr-mods">${statModsPreview(choice?.statMods || {})}</div>
  ${statPreviewPanel()}
  <button class="cta-btn yr-continue-btn" id="yr-continue-btn">Continue →</button>
</div>`;
}

function renderFormationPitch(playerPosition, playerName, nationality) {
  const names = NATIONALITY_NAMES[nationality] || NATIONALITY_NAMES.default;
  let nameIdx = 0;
  const getTeammateName = () => names[nameIdx++ % names.length];

  const playerSpot = POSITION_MAP[playerPosition] || 'ST';
  const spots = Object.entries(FORMATION_433);

  const circles = spots.map(([key, pos]) => {
    const isPlayer = key === playerSpot;
    const name = isPlayer ? playerName : getTeammateName();
    const cx = (pos.x / 100) * 280;
    const cy = (pos.y / 100) * 380;
    return `
      <g>
        <circle cx="${cx}" cy="${cy}" r="${isPlayer ? 14 : 10}"
          fill="${isPlayer ? '#e8ff47' : 'rgba(255,255,255,0.85)'}"
          stroke="${isPlayer ? '#000' : 'rgba(0,0,0,0.3)'}"
          stroke-width="${isPlayer ? 2 : 1}"/>
        ${isPlayer ? `<text x="${cx}" y="${cy + 4}" text-anchor="middle"
          fill="#000" font-size="7" font-weight="bold"
          font-family="Barlow Condensed, sans-serif">YOU</text>` : ''}
        <text x="${cx}" y="${cy + (isPlayer ? 28 : 23)}"
          text-anchor="middle"
          fill="${isPlayer ? '#e8ff47' : 'rgba(255,255,255,0.65)'}"
          font-size="${isPlayer ? '8' : '7'}"
          font-weight="${isPlayer ? 'bold' : 'normal'}"
          font-family="Barlow Condensed, sans-serif">
          ${isPlayer ? name.toUpperCase() : name}
        </text>
      </g>`;
  }).join('');

  return `
    <svg viewBox="0 0 280 380" xmlns="http://www.w3.org/2000/svg"
         style="width:100%;max-width:280px;margin:0 auto;display:block">
      <rect width="280" height="380" fill="#2d5a1b" rx="8"/>
      ${Array.from({length:7},(_,i)=>`<rect x="${i*40}" y="0" width="40" height="380" fill="rgba(0,0,0,${i%2===0?'0.06':'0'})"/>`).join('')}
      <rect x="14" y="14" width="252" height="352" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" rx="2"/>
      <line x1="14" y1="190" x2="266" y2="190" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      <circle cx="140" cy="190" r="35" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <rect x="70" y="14" width="140" height="55" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      <rect x="70" y="311" width="140" height="55" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      <rect x="105" y="6" width="70" height="14" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
      <rect x="105" y="360" width="70" height="14" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
      ${circles}
    </svg>`;
}

export function academyXIScreen() {
  const p = GameState.player;
  const nation = NATIONS.find(n => n.id === p.nationality);
  const countryName = nation?.name || 'National';
  const pitch = renderFormationPitch(p.position, p.name, p.nationality);

  return `
<div class="screen academy-xi-screen animate__animated animate__fadeIn">
  <div class="axi-header">
    <img class="axi-flag-img" src="https://flagcdn.com/w80/${nation?.code || 'un'}.png" alt="${countryName}">
    <div class="axi-eyebrow">${countryName} Under-18 National Finals</div>
    <div class="axi-title">${p.name.toUpperCase()}</div>
    <div class="axi-subtitle">You've made the starting XI</div>
  </div>
  <div class="axi-formation-label">4 — 3 — 3</div>
  <div class="axi-pitch-wrap">${pitch}</div>
  <div class="axi-manager-quote">
    <div class="axi-mgr-text">"You've earned this. Now go show them what you're made of."</div>
    <div class="axi-mgr-name">Academy Director</div>
  </div>
  <button class="cta-btn axi-kick-btn" id="kick-off-btn">⚽ KICK OFF</button>
</div>`;
}
