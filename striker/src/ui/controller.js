// Main game controller — wires all screens and engines together

import { GameState } from '../engine/GameState.js';
import { PROFILES } from '../data/profiles.js';
import { WEAPONS } from '../data/weapons.js';
import { EventEngine } from '../engine/EventEngine.js';
import { MatchEngine } from '../engine/MatchEngine.js';
import { RatingEngine } from '../engine/RatingEngine.js';
import { CELEBRATIONS, OPPOSITION_EVENTS } from '../data/events_flavor.js';
import {
  matchHUD, matchFeedPanel,
  eventScreen, outcomeScreen, weaponDiscoveryScreen, postMatchScreen, debugPanel,
  backgroundStep1Screen, backgroundStep2Screen, youthEventScreen, youthEventResultScreen, academyXIScreen,
  renderPortrait, renderCreatorCard, SKIN_TONES, HAIR_COLORS, HAIR_STYLES_LABELS,
  POSITION_DATA, ARCHETYPES, calcOverallFromStats,
  CLUB_OFFERS, assignSquad, renderSquadFormation,
} from './screens.js';
import { NATIONS } from '../data/nations.js';
import { BACKGROUNDS, SCHOOL_FOCUS, YOUTH_EVENTS } from '../data/background.js';

const app = document.getElementById('app');
const debugEl = document.getElementById('debug-container');

let matchTimer = null;
let pendingEventDef = null;
let pendingResult = null;
let awaitingTerminal = false;

// ── STATE MACHINE ─────────────────────────────────────────────────────────────

export function startGame() {
  GameState.reset();
  showCreation();
}

// Debug helpers — accessible from the debug panel buttons
window.__debugCard = (type) => {
  if (type === 'sub') {
    GameState.match.stamina = 0;
  } else {
    giveCard(type);
  }
};

// ── CREATOR STATE ─────────────────────────────────────────────────────────────

const creatorState = {
  firstName: '',
  lastName:  '',
  nationality: '',
  birthDay:   1,
  birthMonth: 1,
  facePreset:   1,
  skinTone:     2,
  hairStyle:    'short',
  hairColor:    'black',
  eyebrowStyle: 2,
  height: 178,
  weight:  72,
  position:  '',
  archetype: '',
  weapon:    'discover',
};

// ── TOAST ─────────────────────────────────────────────────────────────────────

function showToast(msg, icon = '') {
  const el = document.createElement('div');
  el.className = 'creator-toast';
  el.textContent = `${icon} ${msg}`.trim();
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('toast-show'), 10);
  setTimeout(() => { el.classList.remove('toast-show'); setTimeout(() => el.remove(), 300); }, 2500);
}

// ── CREATOR SHELL + REFRESH ───────────────────────────────────────────────────

function creatorShell(step, content) {
  const dots = Array.from({length:6}, (_,i) =>
    `<div class="creator-dot ${i+1 < step ? 'done' : i+1 === step ? 'active' : ''}"></div>`
  ).join('');
  return `
<div class="creator-shell animate__animated animate__fadeIn">
  <div class="creator-topbar">
    <button class="creator-back-btn" id="creator-back">←</button>
    <span class="creator-step-label">Step ${step} of 6</span>
    <div class="creator-dots">${dots}</div>
  </div>
  <div class="creator-body">
    <div class="creator-left">${content}</div>
    <div class="creator-right" id="creator-right">
      ${renderCreatorRight()}
    </div>
  </div>
  <div class="creator-footer">
    <button class="cta-btn" id="creator-continue" style="width:100%">Continue →</button>
  </div>
</div>`;
}

function renderCreatorRight() {
  return renderPortrait(creatorState) + renderCreatorCard(creatorState);
}

function refreshCreatorRight() {
  const el = document.getElementById('creator-right');
  if (el) el.innerHTML = renderCreatorRight();
}

function wireFooter(validate, nextFn) {
  document.getElementById('creator-continue')?.addEventListener('click', () => {
    if (validate()) nextFn();
  });
  document.getElementById('creator-back')?.addEventListener('click', () => {
    const stepFns = [null, null, showCreatorStep1, showCreatorStep2,
                     showCreatorStep3, showCreatorStep4, showCreatorStep5];
    const label = document.querySelector('.creator-step-label')?.textContent || '';
    const cur = parseInt(label.match(/\d+/)?.[0] || '1');
    if (cur > 1 && stepFns[cur]) stepFns[cur]();
    else if (cur === 1) showMainMenu();
  });
}

// ── CREATION — STEP 1: IDENTITY ───────────────────────────────────────────────

function showCreation() {
  showMainMenu();
}

function showCreatorStep1() {
  app.innerHTML = creatorShell(1, `
    <div class="step-title">
      <h2>Who Are You?</h2>
      <p class="step-sub">Your identity. The name they'll chant.</p>
    </div>
    <div class="field-group">
      <label class="field-label">First Name</label>
      <input class="creator-input" id="inp-firstname" type="text" placeholder="First name..." maxlength="14"
             value="${creatorState.firstName}" autocomplete="off"/>
    </div>
    <div class="field-group">
      <label class="field-label">Last Name</label>
      <input class="creator-input" id="inp-lastname" type="text" placeholder="Last name..." maxlength="18"
             value="${creatorState.lastName}" autocomplete="off"/>
    </div>
    <div class="field-group">
      <label class="field-label">Birthday</label>
      <div class="birthday-row">
        <input class="creator-input birthday-inp" id="inp-day" type="number" placeholder="Day" min="1" max="31" value="${creatorState.birthDay || ''}"/>
        <select class="creator-input birthday-sel" id="inp-month">
          ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            .map((m,i) => `<option value="${i+1}" ${creatorState.birthMonth===i+1?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="field-note">Season 2025/26 — You are 16 years old</div>
    </div>
    <div class="field-group">
      <label class="field-label">Nationality</label>
      <div class="nation-search-wrap">
        <input class="creator-input" id="nation-search" placeholder="Search nationality..." autocomplete="off"/>
      </div>
      <div class="nation-grid-v2" id="nation-grid-v2">
        ${NATIONS.map(n => `
          <button class="nation-btn ${creatorState.nationality===n.id?'selected':''}" data-nation="${n.id}">
            <img class="nation-flag-img" src="https://flagcdn.com/w40/${n.code}.png" alt="" loading="lazy"/>
            <span class="nation-name">${n.name}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `);
  wireStep1();
}

function wireStep1() {
  const update = () => {
    creatorState.firstName  = document.getElementById('inp-firstname')?.value || '';
    creatorState.lastName   = document.getElementById('inp-lastname')?.value  || '';
    creatorState.birthDay   = parseInt(document.getElementById('inp-day')?.value)   || 1;
    creatorState.birthMonth = parseInt(document.getElementById('inp-month')?.value) || 1;
    refreshCreatorRight();
  };
  document.getElementById('inp-firstname')?.addEventListener('input', update);
  document.getElementById('inp-lastname')?.addEventListener('input',  update);
  document.getElementById('inp-day')?.addEventListener('input',       update);
  document.getElementById('inp-month')?.addEventListener('change',    update);

  document.getElementById('nation-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.nation-btn').forEach(btn => {
      btn.style.display = btn.querySelector('.nation-name').textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  document.getElementById('nation-grid-v2')?.addEventListener('click', e => {
    const btn = e.target.closest('.nation-btn');
    if (!btn) return;
    creatorState.nationality = btn.dataset.nation;
    document.querySelectorAll('.nation-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    refreshCreatorRight();
  });

  wireFooter(() => {
    if (!creatorState.firstName)  { showToast('Enter your first name', '⚠️'); return false; }
    if (!creatorState.nationality){ showToast('Select your nationality', '⚠️'); return false; }
    return true;
  }, showCreatorStep2);
}

// ── STEP 2: APPEARANCE ────────────────────────────────────────────────────────

function showCreatorStep2() {
  app.innerHTML = creatorShell(2, `
    <div class="step-title">
      <h2>Your Look</h2>
      <p class="step-sub">Build your player from the outside in.</p>
    </div>
    <div class="field-group">
      <label class="field-label">Skin Tone</label>
      <div class="skin-row">
        ${Object.entries(SKIN_TONES).map(([k,v]) => `
          <button class="skin-btn ${creatorState.skinTone==k?'selected':''}" data-skin="${k}"
                  style="background:${v.base};border-color:${creatorState.skinTone==k?'#e8ff47':'rgba(255,255,255,0.1)'}"></button>
        `).join('')}
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">Face Preset</label>
      <div class="face-row">
        ${[1,2,3,4,5].map(i => `
          <button class="face-btn ${creatorState.facePreset===i?'selected':''}" data-face="${i}">
            ${['Oval','Round','Square','Angular','Slim'][i-1]}
          </button>
        `).join('')}
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">Hair Style</label>
      <div class="option-chips" id="hair-style-chips">
        ${Object.entries(HAIR_STYLES_LABELS).map(([id, label]) => `
          <button class="chip-btn ${creatorState.hairStyle===id?'selected':''}" data-hairstyle="${id}">${label}</button>
        `).join('')}
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">Hair Colour</label>
      <div class="hair-color-row" id="hair-color-row">
        ${Object.entries(HAIR_COLORS).map(([id,hex]) => `
          <button class="hair-col-btn ${creatorState.hairColor===id?'selected':''}"
                  data-haircolor="${id}"
                  style="background:${hex};border-color:${creatorState.hairColor===id?'#e8ff47':'rgba(255,255,255,0.15)'}"></button>
        `).join('')}
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">Eyebrow Style</label>
      <div class="option-chips" id="eyebrow-chips">
        ${['Thin','Medium','Thick','Arched','Straight'].map((label,i) => `
          <button class="chip-btn ${creatorState.eyebrowStyle===i+1?'selected':''}" data-eyebrow="${i+1}">${label}</button>
        `).join('')}
      </div>
    </div>
  `);
  wireStep2();
}

function wireStep2() {
  document.querySelector('.skin-row')?.addEventListener('click', e => {
    const btn = e.target.closest('.skin-btn');
    if (!btn) return;
    creatorState.skinTone = parseInt(btn.dataset.skin);
    document.querySelectorAll('.skin-btn').forEach(b => { b.style.borderColor = 'rgba(255,255,255,0.1)'; b.classList.remove('selected'); });
    btn.style.borderColor = '#e8ff47';
    btn.classList.add('selected');
    refreshCreatorRight();
  });
  document.querySelector('.face-row')?.addEventListener('click', e => {
    const btn = e.target.closest('.face-btn');
    if (!btn) return;
    creatorState.facePreset = parseInt(btn.dataset.face);
    document.querySelectorAll('.face-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    refreshCreatorRight();
  });
  document.getElementById('hair-style-chips')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-hairstyle]');
    if (!btn) return;
    creatorState.hairStyle = btn.dataset.hairstyle;
    document.querySelectorAll('#hair-style-chips .chip-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    refreshCreatorRight();
  });
  document.getElementById('hair-color-row')?.addEventListener('click', e => {
    const btn = e.target.closest('.hair-col-btn');
    if (!btn) return;
    creatorState.hairColor = btn.dataset.haircolor;
    document.querySelectorAll('.hair-col-btn').forEach(b => { b.style.borderColor = 'rgba(255,255,255,0.15)'; b.classList.remove('selected'); });
    btn.style.borderColor = '#e8ff47';
    btn.classList.add('selected');
    refreshCreatorRight();
  });
  document.getElementById('eyebrow-chips')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-eyebrow]');
    if (!btn) return;
    creatorState.eyebrowStyle = parseInt(btn.dataset.eyebrow);
    document.querySelectorAll('#eyebrow-chips .chip-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    refreshCreatorRight();
  });
  wireFooter(() => true, showCreatorStep3);
}

// ── STEP 3: PHYSICAL BUILD ────────────────────────────────────────────────────

function showCreatorStep3() {
  app.innerHTML = creatorShell(3, `
    <div class="step-title">
      <h2>Physical Build</h2>
      <p class="step-sub">Your body. Your tools.</p>
    </div>
    <div class="field-group">
      <label class="field-label">Height</label>
      <div class="slider-display-row">
        <input type="range" class="creator-slider" id="height-slider" min="160" max="205" value="${creatorState.height}" step="1"/>
        <input type="number" class="creator-input num-inp" id="height-num" min="160" max="205" value="${creatorState.height}"/>
        <span class="unit-label">cm</span>
      </div>
      <div class="height-context" id="height-context">${getHeightContext(creatorState.height)}</div>
    </div>
    <div class="field-group">
      <label class="field-label">Weight</label>
      <div class="slider-display-row">
        <input type="range" class="creator-slider" id="weight-slider" min="55" max="110" value="${creatorState.weight}" step="1"/>
        <input type="number" class="creator-input num-inp" id="weight-num" min="55" max="110" value="${creatorState.weight}"/>
        <span class="unit-label">kg</span>
      </div>
    </div>
    <div class="phys-stat-preview" id="phys-stat-preview">
      ${renderPhysStatPreview(creatorState.height, creatorState.weight)}
    </div>
  `);
  wireStep3();
}

function getHeightContext(h) {
  if (h <= 168) return 'Low centre of gravity. Agile and quick to change direction.';
  if (h <= 178) return 'Average height. Balanced across all attributes.';
  if (h <= 188) return 'Above average. Starting to win aerial duels.';
  return 'Tall. Dominant in the air. Natural aerial threat.';
}

function renderPhysStatPreview(height, weight) {
  const mods = calcPhysicalMods(height, weight);
  const positive = Object.entries(mods).filter(([,v]) => v > 0);
  const negative = Object.entries(mods).filter(([,v]) => v < 0);
  const names = { agility:'Agility', acceleration:'Acceleration', heading:'Heading',
                  physicality:'Physicality', stamina:'Stamina', pace:'Pace', ballControl:'Ball Control' };
  return `<div class="phys-preview-grid">
    <div class="phys-col boost">
      <div class="phys-col-label">▲ Boosted</div>
      ${positive.map(([k,v]) => `<div class="phys-row"><span>${names[k]||k}</span><span class="boost-val">+${v}</span></div>`).join('')}
      ${!positive.length ? '<div class="phys-row" style="color:rgba(255,255,255,0.2)">—</div>' : ''}
    </div>
    <div class="phys-col reduce">
      <div class="phys-col-label">▼ Reduced</div>
      ${negative.map(([k,v]) => `<div class="phys-row"><span>${names[k]||k}</span><span class="reduce-val">${v}</span></div>`).join('')}
      ${!negative.length ? '<div class="phys-row" style="color:rgba(255,255,255,0.2)">—</div>' : ''}
    </div>
  </div>`;
}

function calcPhysicalMods(height, weight) {
  const mods = {};
  const h = height - 178;
  if (h !== 0) {
    mods.heading     = Math.round(h * 0.18);
    mods.physicality = Math.round(h * 0.12);
    mods.agility     = Math.round(h * -0.14);
    mods.acceleration= Math.round(h * -0.10);
  }
  const w = weight - 72;
  if (w !== 0) {
    mods.physicality  = (mods.physicality||0)   + Math.round(w * 0.12);
    mods.stamina      = Math.round(w * -0.08);
    mods.agility      = (mods.agility||0)        + Math.round(w * -0.06);
    mods.acceleration = (mods.acceleration||0)   + Math.round(w * -0.05);
    if (w > 0) mods.heading = (mods.heading||0) + Math.round(w * 0.06);
  }
  Object.keys(mods).forEach(k => { if (mods[k] === 0) delete mods[k]; });
  return mods;
}

function wireStep3() {
  const syncH = (val) => {
    val = Math.max(160, Math.min(205, parseInt(val) || 178));
    creatorState.height = val;
    document.getElementById('height-slider').value = val;
    document.getElementById('height-num').value    = val;
    document.getElementById('height-context').textContent = getHeightContext(val);
    document.getElementById('phys-stat-preview').innerHTML = renderPhysStatPreview(val, creatorState.weight);
    refreshCreatorRight();
  };
  const syncW = (val) => {
    val = Math.max(55, Math.min(110, parseInt(val) || 72));
    creatorState.weight = val;
    document.getElementById('weight-slider').value = val;
    document.getElementById('weight-num').value    = val;
    document.getElementById('phys-stat-preview').innerHTML = renderPhysStatPreview(creatorState.height, val);
    refreshCreatorRight();
  };
  document.getElementById('height-slider')?.addEventListener('input', e => syncH(e.target.value));
  document.getElementById('height-num')?.addEventListener('input',   e => syncH(e.target.value));
  document.getElementById('weight-slider')?.addEventListener('input', e => syncW(e.target.value));
  document.getElementById('weight-num')?.addEventListener('input',   e => syncW(e.target.value));
  wireFooter(() => true, showCreatorStep4);
}

// ── STEP 4: POSITION ──────────────────────────────────────────────────────────

function showCreatorStep4() {
  app.innerHTML = creatorShell(4, `
    <div class="step-title">
      <h2>Your Position</h2>
      <p class="step-sub">Where do you play?</p>
    </div>
    <div class="pos-grid">
      ${Object.entries(POSITION_DATA).map(([id,p]) => `
        <button class="pos-card ${creatorState.position===id?'selected':''}" data-pos="${id}">
          <div class="pos-icon">${p.icon}</div>
          <div class="pos-label">${id} — ${p.label}</div>
          <div class="pos-desc">${p.desc}</div>
        </button>
      `).join('')}
    </div>
  `);
  document.querySelector('.pos-grid')?.addEventListener('click', e => {
    const btn = e.target.closest('.pos-card');
    if (!btn) return;
    creatorState.position  = btn.dataset.pos;
    creatorState.archetype = '';
    document.querySelectorAll('.pos-card').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    refreshCreatorRight();
  });
  wireFooter(() => {
    if (!creatorState.position) { showToast('Select your position', '⚠️'); return false; }
    return true;
  }, showCreatorStep5);
}

// ── STEP 5: ARCHETYPE ─────────────────────────────────────────────────────────

function showCreatorStep5() {
  const archs = ARCHETYPES[creatorState.position] || [];
  app.innerHTML = creatorShell(5, `
    <div class="step-title">
      <h2>Your Archetype</h2>
      <p class="step-sub">What kind of player are you?</p>
    </div>
    <div class="arch-list">
      ${archs.map(a => `
        <button class="arch-card ${creatorState.archetype===a.id?'selected':''}" data-arch="${a.id}">
          <div class="arch-header">
            <span class="arch-icon">${a.icon}</span>
            <div>
              <div class="arch-name">${a.name}</div>
              <div class="arch-pos">${creatorState.position}</div>
            </div>
          </div>
          <div class="arch-desc">${a.desc}</div>
          <div class="arch-tags">
            ${a.strengths.map(s => `<span class="arch-tag boost">▲ ${s}</span>`).join('')}
            ${a.weaknesses.map(s => `<span class="arch-tag reduce">▼ ${s}</span>`).join('')}
          </div>
        </button>
      `).join('')}
    </div>
  `);
  document.querySelector('.arch-list')?.addEventListener('click', e => {
    const btn = e.target.closest('.arch-card');
    if (!btn) return;
    creatorState.archetype = btn.dataset.arch;
    document.querySelectorAll('.arch-card').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    refreshCreatorRight();
  });
  wireFooter(() => {
    if (!creatorState.archetype) { showToast('Choose your archetype', '⚠️'); return false; }
    return true;
  }, showCreatorStep6);
}

// ── STEP 6: SUMMARY + WEAPON ──────────────────────────────────────────────────

function showCreatorStep6() {
  const nation = NATIONS.find(n => n.id === creatorState.nationality);
  const arch   = ARCHETYPES[creatorState.position]?.find(a => a.id === creatorState.archetype);
  const stats  = buildStatsFromCreator(creatorState);
  const ovr    = calcOverallFromStats(stats, creatorState.position);

  const displayStats = [
    ['Pace',        stats.pace],
    ['Dribbling',   stats.dribbling],
    ['Finishing',   stats.finishing],
    ['Passing',     stats.shortPassing],
    ['Vision',      stats.vision],
    ['Physicality', stats.physicality],
    ['Composure',   stats.composure],
    ['Stamina',     stats.stamina],
  ];

  app.innerHTML = creatorShell(6, `
    <div class="step-title">
      <h2>Your Player</h2>
      <p class="step-sub">Review your build. Choose your weapon.</p>
    </div>
    <div class="summary-identity">
      <div class="si-name">${creatorState.firstName} ${creatorState.lastName}</div>
      <div class="si-meta">
        ${nation ? `<img src="https://flagcdn.com/w40/${nation.code}.png" style="height:14px;vertical-align:middle;margin-right:4px;" alt=""/>` : ''}
        ${nation?.name || ''} · ${creatorState.position} · ${arch?.name || ''}
      </div>
      <div class="si-physical">${creatorState.height}cm · ${creatorState.weight}kg · Age 16</div>
    </div>
    <div class="summary-stats">
      ${displayStats.map(([label, val]) => `
        <div class="sum-stat-row">
          <span class="sum-stat-name">${label}</span>
          <div class="sum-stat-track"><div class="sum-stat-fill" style="width:${val}%;background:${getStatColor(val)}"></div></div>
          <span class="sum-stat-val">${val}</span>
        </div>
      `).join('')}
    </div>
    <div class="field-group" style="margin-top:16px">
      <label class="field-label">Starting Weapon</label>
      <div class="weapon-list" id="weapon-list-v2">
        ${WEAPONS.map(w => `
          <button class="weapon-card-btn ${creatorState.weapon===w.id?'selected':''}" data-weapon="${w.id}">
            <span class="wcb-icon">${w.icon}</span>
            <div><div class="wcb-name">${w.name}</div><div class="wcb-desc">${w.desc}</div></div>
          </button>
        `).join('')}
        <button class="weapon-card-btn ${creatorState.weapon==='discover'?'selected':''}" data-weapon="discover">
          <span class="wcb-icon">🔮</span>
          <div><div class="wcb-name">Discover In Play</div><div class="wcb-desc">Your weapon reveals itself in the right moment.</div></div>
        </button>
      </div>
    </div>
  `);

  document.getElementById('weapon-list-v2')?.addEventListener('click', e => {
    const btn = e.target.closest('.weapon-card-btn');
    if (!btn) return;
    creatorState.weapon = btn.dataset.weapon;
    document.querySelectorAll('.weapon-card-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });

  wireFooter(() => true, () => finalisePlayer());
}

function getStatColor(val) {
  if (val >= 75) return '#e8ff47';
  if (val >= 65) return '#4ade80';
  if (val >= 55) return '#60a5fa';
  return '#f87171';
}

// ── FINALISE PLAYER ───────────────────────────────────────────────────────────

function finalisePlayer() {
  const stats   = buildStatsFromCreator(creatorState);
  const overall = calcOverallFromStats(stats, creatorState.position);
  const fullName = [creatorState.firstName, creatorState.lastName].filter(Boolean).join(' ');

  GameState.player = {
    name:        fullName,
    firstName:   creatorState.firstName,
    lastName:    creatorState.lastName,
    nationality: creatorState.nationality,
    birthDay:    creatorState.birthDay,
    birthMonth:  creatorState.birthMonth,
    position:    creatorState.position,
    archetype:   creatorState.archetype,
    profile:     mapArchetypeToProfile(creatorState.archetype, creatorState.position),
    weapon:      creatorState.weapon,
    height:      creatorState.height,
    weight:      creatorState.weight,
    appearance: {
      facePreset:   creatorState.facePreset,
      skinTone:     creatorState.skinTone,
      hairStyle:    creatorState.hairStyle,
      hairColor:    creatorState.hairColor,
      eyebrowStyle: creatorState.eyebrowStyle,
    },
    stats,
    overall,
    backgroundMods: {},
  };

  GameState.match.confidence = stats.confidence || 50;
  showBackgroundStep1();
}

function buildStatsFromCreator(state) {
  const profile = PROFILES.find(p => p.id === mapArchetypeToProfile(state.archetype, state.position));
  const stats = {};
  if (profile) {
    for (const [stat, [min, max]] of Object.entries(profile.stats)) {
      stats[stat] = Math.floor(Math.random() * (max - min + 1)) + min;
    }
  } else {
    Object.assign(stats, { pace:54, acceleration:53, finishing:52, dribbling:52, agility:51,
      shortPassing:51, longPassing:48, vision:50, physicality:51, stamina:52,
      heading:48, ballControl:51, composure:50, positioning:50, balance:50,
      confidence:50, intelligence:48, ego:45, resilience:50 });
  }
  const arch = ARCHETYPES[state.position]?.find(a => a.id === state.archetype);
  if (arch?.statMods) {
    for (const [k, v] of Object.entries(arch.statMods)) {
      stats[k] = Math.max(42, Math.min(72, (stats[k] || 50) + v));
    }
  }
  const physMods = calcPhysicalMods(state.height, state.weight);
  for (const [k, v] of Object.entries(physMods)) {
    stats[k] = Math.max(40, Math.min(72, (stats[k] || 50) + v));
  }
  return stats;
}

function mapArchetypeToProfile(archetype, position) {
  const physical  = ['enforcer', 'runner'];
  const technical = ['dribbler', 'maestro', 'playmaker', 'inside_forward', 'false_nine'];
  if (physical.includes(archetype))  return 'powerhouse';
  if (technical.includes(archetype)) return 'technician';
  return 'pace_power';
}

// ── BACKGROUND SYSTEM ─────────────────────────────────────────────────────────

const STAT_KEY_MAP = {
  ballControl: 'ball_control',
  shortPassing: 'passing',
  longPassing: 'passing',
};

function applyStatMods(mods) {
  const stats = GameState.player.stats;
  if (!GameState.player.backgroundMods) GameState.player.backgroundMods = {};
  const bg = GameState.player.backgroundMods;
  for (const [rawKey, val] of Object.entries(mods)) {
    const key = STAT_KEY_MAP[rawKey] || rawKey;
    stats[key] = Math.max(42, Math.min(72, (stats[key] || 50) + val));
    bg[key] = (bg[key] || 0) + val;
  }
  recalcOverall();
}

function recalcOverall() {
  const primary = ['pace','dribbling','finishing','passing','physicality','heading'];
  const stats = GameState.player.stats;
  GameState.player.overall = Math.round(primary.reduce((s, k) => s + (stats[k] || 50), 0) / primary.length);
}

function pickYouthEvents() {
  const pool = [...YOUTH_EVENTS].sort(() => Math.random() - 0.5);
  return [pool[0], pool[1]];
}

function showBackgroundStep1() {
  GameState.youthEventQueue = pickYouthEvents();
  app.innerHTML = backgroundStep1Screen();
  document.getElementById('bg1-choices').addEventListener('click', e => {
    const btn = e.target.closest('[data-bg]');
    if (!btn) return;
    const bg = BACKGROUNDS.find(b => b.id === btn.dataset.bg);
    if (!bg) return;
    applyStatMods(bg.statMods);
    showBackgroundStep2();
  });
}

function showBackgroundStep2() {
  app.innerHTML = backgroundStep2Screen();
  document.getElementById('bg2-choices').addEventListener('click', e => {
    const btn = e.target.closest('[data-school]');
    if (!btn) return;
    const school = SCHOOL_FOCUS.find(s => s.id === btn.dataset.school);
    if (!school) return;
    applyStatMods(school.statMods);
    showYouthEvent(0);
  });
}

function showYouthEvent(idx) {
  const eventDef = GameState.youthEventQueue[idx];
  if (!eventDef) { showAcademyXI(); return; }
  app.innerHTML = youthEventScreen(eventDef);
  document.getElementById('ye-choices').addEventListener('click', e => {
    const btn = e.target.closest('[data-choice]');
    if (!btn) return;
    const choice = eventDef.choices.find(c => c.id === btn.dataset.choice);
    if (!choice) return;
    applyStatMods(choice.statMods);
    showYouthEventResult(eventDef, choice.id, idx);
  });
}

function showYouthEventResult(eventDef, choiceId, idx) {
  app.innerHTML = youthEventResultScreen(eventDef, choiceId);
  document.getElementById('yr-continue-btn').addEventListener('click', () => {
    if (idx < 1) {
      showYouthEvent(1);
    } else {
      showAcademyXI();
    }
  });
}

function showAcademyXI() {
  showYouthClubPlacement();
}

// ── MATCH ─────────────────────────────────────────────────────────────────────

function startMatch() {
  if (matchTimer) { clearTimeout(matchTimer); matchTimer = null; }
  awaitingTerminal = false;
  pendingEventDef = null;
  pendingResult = null;
  GameState.resetMatch();
  renderMatch();
  scheduleA6Check();
  runMatchTick();
}

function renderMatch() {
  app.innerHTML = `
    <div id="match-wrapper">
      ${matchHUD()}
      <div id="match-feed-area">
        ${matchFeedPanel(GameState.match.feed)}
      </div>
      <div id="debug-toggle-bar">
        <button id="debug-toggle-btn" class="debug-toggle">🎲 Debug</button>
      </div>
    </div>
  `;

  const wrToggleEl = document.getElementById('wr-toggle');
  if (wrToggleEl) {
    wrToggleEl.addEventListener('click', e => {
      const b = e.target.closest('[data-wr]');
      if (!b) return;
      const m = GameState.match;
      if (b.dataset.wr === 'high' && m.stamina < 19) return;
      m.workRate = b.dataset.wr;
      refreshHUD();
    });
  }

  const menToggleEl = document.getElementById('men-toggle');
  if (menToggleEl) {
    menToggleEl.addEventListener('click', e => {
      const b = e.target.closest('[data-men]');
      if (!b) return;
      GameState.match.mentality = b.dataset.men;
      refreshHUD();
    });
  }

  document.getElementById('debug-toggle-btn').addEventListener('click', () => {
    GameState.debug.enabled = !GameState.debug.enabled;
    refreshDebug();
  });
}

let a6Scheduled = false;

function scheduleA6Check() {
  // Force A6 (late drama) event around 82nd minute if match is close or losing
  a6Scheduled = false;
}

function runMatchTick() {
  if (matchTimer) clearTimeout(matchTimer);

  const m = GameState.match;
  if (m.minute >= 90) {
    endMatch();
    return;
  }

  // If sent off and bench not shown yet — show it now
  if (m.sentOff && !m.benchShown) {
    showBenchPOV();
    return;
  }

  // Fix 4: stamina 0 = substitution — match continues without player events
  if (m.stamina <= 0 && !m.substituted) {
    m.substituted = true;
    m.exhaustionSub = true;
    m.stamina = 0;
    m.feed.push(`🚑 ${m.minute}' — You're being substituted. Your legs gave out. The manager has no choice.`);
    refreshFeed();
    refreshHUD();
    if (!m.benchShown) {
      m.benchShown = true;
      showBenchPOV('sub');
    } else {
      matchTimer = setTimeout(runMatchTick, 1200);
    }
    return;
  }

  const tickMinutes = 3;
  m.minute = Math.min(90, m.minute + tickMinutes);
  MatchEngine.drainStaminaPassive(tickMinutes);

  // Force late drama at 82'
  if (m.minute >= 82 && !a6Scheduled && (m.score.us <= m.score.them) && !m.substituted) {
    a6Scheduled = true;
    triggerEvent(EventEngine.getEvent('A6'));
    return;
  }

  // If substituted or sent off — run background-only simulation, no player events
  if (m.substituted || m.sentOff) {
    const bgEntries = runBackgroundOnly(m.minute);
    bgEntries.forEach(e => m.feed.push(e));
    refreshFeed();
    refreshHUD();
    matchTimer = setTimeout(runMatchTick, Math.max(400, tickMinutes * 300));
    return;
  }

  const { playerInvolved, eventDef, feedEntries } = MatchEngine.tick(m.minute);

  feedEntries.forEach(e => m.feed.push(e));
  refreshFeed();
  refreshHUD();
  refreshDebug();

  // Fix 4: opposition goal popup
  if (m.oppGoalJustScored) {
    m.oppGoalJustScored = false;
    showOppositionGoalPopup(m.lastOppGoalNarrative || '');
  }

  if (playerInvolved && eventDef) {
    clearTimeout(matchTimer);
    matchTimer = setTimeout(() => triggerEvent(eventDef), 600);
  } else {
    matchTimer = setTimeout(runMatchTick, Math.max(400, tickMinutes * 400));
  }
}

function triggerEvent(eventDef) {
  if (!eventDef) { runMatchTick(); return; }
  GameState.match.eventsThisMatch = (GameState.match.eventsThisMatch || 0) + 1;
  pendingEventDef = eventDef;
  const choices = EventEngine.filterChoices(eventDef);
  app.innerHTML = `
    <div id="match-wrapper">
      ${matchHUD()}
      <div id="event-area">
        ${eventScreen(eventDef, choices)}
      </div>
    </div>
  `;
  wireHUDControls();
  document.getElementById('choices-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-choice]');
    if (!b) return;
    const choice = choices.find(c => c.id === b.dataset.choice);
    if (choice) handleChoice(choice);
  });
}

function handleChoice(choice) {
  const result = EventEngine.resolve(pendingEventDef, choice);
  pendingResult = result;

  // Step 5: manager relationship effect
  if (choice.managerEffect) {
    GameState.match.managerRelationship = Math.max(0, Math.min(100,
      (GameState.match.managerRelationship || 50) + choice.managerEffect.relationship
    ));
    if (choice.managerEffect.confidence) {
      GameState.match.confidence = Math.max(0, Math.min(100,
        GameState.match.confidence + choice.managerEffect.confidence
      ));
    }
  }

  const narrativeText = buildOutcomeNarrative(result);

  app.innerHTML = `
    <div id="match-wrapper">
      ${matchHUD()}
      <div id="event-area">
        ${outcomeScreen(result, narrativeText)}
      </div>
    </div>
  `;
  wireHUDControls();
  refreshDebug();

  // Weapon discovery check
  const m = GameState.match;
  if (m.weaponDiscovered && GameState.player.weapon === 'discover') {
    const w = WEAPONS.find(x => x.id === m.discoveredWeapon);
    if (w) {
      setTimeout(() => showWeaponDiscovery(w, result), 1200);
      return;
    }
  }

  document.getElementById('continue-btn').addEventListener('click', () => handleContinue(result));
}

function handleContinue(result) {
  const next = result.next;
  const m = GameState.match;

  // Fix 3: FOUL_AGAINST in box → PENALTY event
  if (next === 'PENALTY_TRIGGER') {
    m.feed.push(`🟡 ${m.minute}' — Foul in the box! PENALTY to us!`);
    refreshFeed();
    const penaltyEvent = EventEngine.getEvent('PENALTY');
    if (penaltyEvent) {
      triggerEvent(penaltyEvent);
    } else {
      returnToMatch();
    }
    return;
  }

  // OPPOSITION_ATTACK — treat as a new event, not a terminal
  if (next === 'OPPOSITION_ATTACK') {
    triggerEvent(OPPOSITION_EVENTS.OPPOSITION_ATTACK);
    return;
  }

  if (isTerminal(next)) {
    const entries = MatchEngine.resolveTerminal(next, m.minute);
    m.cascadeDepth = 0;
    m.cascadeBonus = false;

    // Check for card signals BEFORE pushing to feed
    const hasYellow = entries.includes('__GIVE_YELLOW__');
    const hasRed    = entries.includes('__GIVE_RED__');

    // Push all non-signal entries to feed
    entries
      .filter(e => e !== '__GIVE_YELLOW__' && e !== '__GIVE_RED__')
      .forEach(e => m.feed.push(e));

    // Fire card — giveCard handles all state and UI, then returns
    if (hasRed) {
      giveCard('red');
      return;
    }
    if (hasYellow) {
      giveCard('yellow');
      return;
    }
    if (next === 'GOAL') {
      showMomentFlash('GOAL');
      showCelebrationScreen();
      return;
    }
    if (next === 'ASSIST') {
      showMomentFlash('ASSIST');
    }
    returnToMatch();
  } else {
    const nextEvent = EventEngine.getEvent(next);
    if (nextEvent) {
      triggerEvent(nextEvent);
    } else {
      m.cascadeDepth = 0;
      returnToMatch();
    }
  }
}

function showWeaponDiscovery(weapon, result) {
  GameState.player.weapon = weapon.id;  // Fix 1: set permanently so it never retriggers
  GameState.match.weaponDiscovered = true;
  app.innerHTML = `<div id="match-wrapper">${weaponDiscoveryScreen(weapon)}</div>`;
  document.getElementById('wd-continue-btn').addEventListener('click', () => handleContinue(result));
}

// ── CARD SYSTEM — single source of truth ─────────────────────────────────────
// giveCard() is the ONLY function that handles cards.
// It runs synchronously. No setTimeout. Nothing can interrupt it.

function giveCard(type) {
  // type: 'yellow' | 'red' | 'second_yellow'
  clearTimeout(matchTimer);
  const m = GameState.match;

  if (type === 'yellow') {
    m.yellows = (m.yellows || 0) + 1;
    if (m.yellows >= 2) {
      // Second yellow becomes red
      giveCard('second_yellow');
      return;
    }
    // Show yellow card notification inline then resume
    m.feed.push(`🟨 YELLOW CARD — ${GameState.player.name} is booked. ${m.minute}'. One more and you're off.`);
    returnToMatch();
    return;
  }

  // RED or SECOND_YELLOW — player is sent off
  m.redCard    = true;
  m.sentOff    = true;
  m.substituted = true;

  const reason  = type === 'second_yellow' ? 'SECOND YELLOW CARD' : 'RED CARD';
  const subText = type === 'second_yellow'
    ? 'Two yellows. You\'re off. Your team play the rest with ten men.'
    : 'Straight red. Walk. Your team play the rest with ten men.';

  // Build the red card screen synchronously — NO setTimeout
  app.innerHTML = `
    <div class="screen redcard-screen animate__animated animate__fadeIn">
      <div class="rc-card">${type === 'second_yellow' ? '🟨🟥' : '🟥'}</div>
      <div class="rc-title">${reason}</div>
      <div class="rc-name">${GameState.player.name}</div>
      <div class="rc-minute">${m.minute}'</div>
      <div class="rc-text">${subText}</div>
      <div class="rc-question">What do you do?</div>
      <div class="rc-choices">
        <button class="rc-btn" data-rc="apologise">
          <div class="rc-btn-label">Apologise to the referee</div>
          <div class="rc-btn-desc">Head down. Accept it. Professionalism.</div>
        </button>
        <button class="rc-btn rc-btn-ego" data-rc="argue">
          <div class="rc-btn-label">Argue — you were robbed</div>
          <div class="rc-btn-desc">It wasn't a red. You're letting him know.</div>
        </button>
        <button class="rc-btn" data-rc="tunnel">
          <div class="rc-btn-label">Storm down the tunnel</div>
          <div class="rc-btn-desc">Don't look back. Don't say a word.</div>
        </button>
      </div>
    </div>
  `;

  // Wire the buttons — synchronous, no race condition possible
  document.querySelector('.rc-choices').addEventListener('click', e => {
    const btn = e.target.closest('[data-rc]');
    if (!btn) return;
    const choice = btn.dataset.rc;

    if (choice === 'apologise') {
      m.managerRelationship = Math.min(100, (m.managerRelationship || 50) + 5);
      m.feed.push(`${m.minute}' — You hold your hands up and walk off. Head down. The crowd applauds the sportsmanship.`);
    } else if (choice === 'argue') {
      m.managerRelationship = Math.max(0, (m.managerRelationship || 50) - 10);
      m.confidence = Math.min(100, (m.confidence || 50) + 8);
      m.feed.push(`${m.minute}' — You're still arguing as you leave the pitch. The fourth official has to step in.`);
    } else {
      m.managerRelationship = Math.max(0, (m.managerRelationship || 50) - 5);
      m.feed.push(`${m.minute}' — You disappear down the tunnel without a word. The stadium goes quiet.`);
    }

    showBenchPOV();
  });
}

function showBenchPOV() {
  const m = GameState.match;
  m.benchShown = true;

  // Rebuild the full match view — matchHUD() will detect sentOff and
  // render OFF THE PITCH bar instead of work rate / mentality controls
  app.innerHTML = `
    <div id="match-wrapper">
      ${matchHUD()}
      <div id="match-feed-area">
        <div class="bench-pov-header">
          <div class="bench-pov-icon">🟥</div>
          <div class="bench-pov-title">YOU'RE OFF THE PITCH</div>
          <div class="bench-pov-sub">The match continues without you</div>
        </div>
        ${matchFeedPanel(m.feed)}
      </div>
    </div>
  `;

  // Don't wire HUD controls — player is off, controls do nothing
  // Just resume background simulation
  matchTimer = setTimeout(runMatchTick, 1200);
}

// Fix 4: opposition goal popup overlay
function showOppositionGoalPopup(narrative) {
  const m = GameState.match;
  const wrapper = document.getElementById('match-wrapper');
  if (!wrapper) return;
  const overlay = document.createElement('div');
  overlay.className = 'opp-goal-overlay animate__animated animate__fadeIn';
  overlay.innerHTML = `
    <div class="og-icon">💀</div>
    <div class="og-score">${m.score.us} — ${m.score.them}</div>
    <div class="og-narrative">${narrative}</div>
  `;
  wrapper.appendChild(overlay);
  setTimeout(() => overlay.remove(), 3000);
}

// Fix 3: goal/assist flash overlay
function showMomentFlash(type) {
  const isGoal = type === 'GOAL';
  const wrapper = document.getElementById('match-wrapper');
  if (!wrapper) return;
  const overlay = document.createElement('div');
  overlay.className = 'moment-flash animate__animated animate__zoomIn';
  overlay.innerHTML = `
    <div class="mf-icon">${isGoal ? '⚽' : '🎯'}</div>
    <div class="mf-word">${isGoal ? 'GOAL!' : 'ASSIST!'}</div>
    <div class="mf-name">${GameState.player.name}</div>
    <div class="mf-minute">${GameState.match.minute}'</div>
    <div class="mf-score">${GameState.match.score.us} — ${GameState.match.score.them}</div>
  `;
  wrapper.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2200);
}

function showCelebrationScreen() {
  const minute = GameState.match.minute;
  const shirtOff = CELEBRATIONS.find(c => c.id === 'shirt_off');
  const others = CELEBRATIONS.filter(c => c.id !== 'shirt_off')
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const pool = [shirtOff, ...others];

  app.innerHTML = `
    <div class="screen celebration-screen animate__animated animate__zoomIn">
      <div class="cel-badge">⚽ GOAL!</div>
      <div class="cel-minute">${minute}'</div>
      <div class="cel-title">HOW DO YOU CELEBRATE?</div>
      <div class="cel-choices">
        ${pool.map(c => `
          <button class="cel-choice ${c.isEgo ? 'ego' : ''}" data-cel="${c.id}">
            <div class="cel-label">${c.label}</div>
            <div class="cel-desc">${c.desc}</div>
            ${c.yellowCardRisk ? '<div class="cel-warning">⚠️ Yellow card risk</div>' : ''}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.querySelector('.cel-choices').addEventListener('click', e => {
    const btn = e.target.closest('[data-cel]');
    if (!btn) return;
    const cel = CELEBRATIONS.find(c => c.id === btn.dataset.cel);
    if (!cel) return;
    if (cel.ratingBonus) {
      GameState.match.rating = Math.max(1, Math.min(10,
        GameState.match.rating + cel.ratingBonus
      ));
    }
    GameState.match.feed.push(`🎉 ${cel.narrative}`);
    if (cel.yellowCardRisk) {
      // giveCard handles yellow→red promotion automatically
      giveCard('yellow');
      return;
    }
    returnToMatch();
  });
}

function returnToMatch() {
  pendingEventDef = null;
  pendingResult = null;
  renderMatch();
  refreshHUD();
  refreshFeed();
  refreshDebug();
  // Small delay then continue simulation
  matchTimer = setTimeout(runMatchTick, 800);
}

function endMatch() {
  clearTimeout(matchTimer);
  app.innerHTML = postMatchScreen();

  document.getElementById('op-choices').addEventListener('click', e => {
    const b = e.target.closest('[data-op]');
    if (!b) return;
    const idx = parseInt(b.dataset.op);
    // Apply off-pitch effect (cosmetic in POC)
    document.querySelectorAll('.op-choice').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    showStatGains();
  });
}

function showStatGains() {
  const gains = generateStatGains();
  const el = document.getElementById('stat-gains-reveal');
  const list = document.getElementById('stat-gains-list');
  list.innerHTML = Object.entries(gains).map(([k, v]) => `
    <div class="stat-gain-row">
      <span class="sg-stat">${k.replace('_',' ').toUpperCase()}</span>
      <span class="sg-val">+${v}</span>
    </div>
  `).join('');
  el.style.display = 'block';
  el.classList.add('animate__animated', 'animate__fadeInUp');

  document.getElementById('play-again-btn').addEventListener('click', () => handlePostMatchFlowEnd());
}

function generateStatGains() {
  const m = GameState.match;
  const p = GameState.player;
  const gains = {};

  // Gain in the stats you used most
  if (m.goals > 0)   gains.finishing = Math.min(2, m.goals);
  if (m.assists > 0) gains.vision    = 1;
  if (m.egoChoicesMade >= 3) gains.ego = 1;
  if (m.workRate === 'high' && m.stamina < 30) gains.stamina = 1;
  gains.confidence = m.rating >= 7 ? 2 : m.rating >= 6 ? 1 : 0;

  return Object.fromEntries(Object.entries(gains).filter(([,v]) => v > 0));
}

// ── MAIN MENU ─────────────────────────────────────────────────────────────────

function showMainMenu() {
  app.innerHTML = `
    <div class="screen main-menu-screen animate__animated animate__fadeIn">
      <div class="mm-logo">STRIKER</div>
      <div class="mm-tagline">Your story starts now.</div>
      <div class="mm-menu-buttons">
        <button class="cta-btn mm-btn-primary" id="mm-new-game">New Game</button>
        <button class="cta-btn mm-btn-secondary" id="mm-continue" disabled>
          Continue
          <span class="mm-continue-note">No saved career yet</span>
        </button>
        <button class="cta-btn mm-btn-ghost" id="mm-settings">Settings</button>
      </div>
    </div>
  `;
  document.getElementById('mm-new-game').addEventListener('click', showCreatorStep1);
  document.getElementById('mm-settings').addEventListener('click', () => showToast('Settings coming soon', '⚙️'));
}

// ── YOUTH CLUB PLACEMENT ──────────────────────────────────────────────────────

function showYouthClubPlacement() {
  const p = GameState.player;
  const nation = NATIONS.find(n => n.id === p.nationality);
  const clubPool = CLUB_OFFERS.local[p.nationality] || CLUB_OFFERS.local.default;
  const club = clubPool[Math.floor(Math.random() * clubPool.length)];

  GameState.career = {
    clubName: club.name,
    clubBadge: club.badge,
    clubLeague: club.league,
    squad: assignSquad(p.position, p.name, p.nationality),
  };

  app.innerHTML = `
    <div class="screen placement-screen animate__animated animate__fadeIn">
      <div class="placement-badge">${club.badge}</div>
      <div class="placement-eyebrow">${nation?.flag || ''} Youth Trial</div>
      <div class="placement-title">${club.name}</div>
      <div class="placement-sub">${club.league}</div>
      <div class="placement-text">
        Your background has earned you a trial place at ${club.name}.
        Nothing is guaranteed yet — you'll need to prove it on the pitch.
      </div>
      <div class="placement-formation">${renderSquadFormation(GameState.career.squad)}</div>
      <button class="cta-btn placement-btn" id="placement-continue">Begin Your Trial →</button>
    </div>
  `;
  document.getElementById('placement-continue').addEventListener('click', showTrialIntroScreen);
}

// ── THE TRIAL ─────────────────────────────────────────────────────────────────

const TRIAL_OPPONENT_NAMES = [
  'Riverside Trialists', 'City Selection B', 'Park District XI',
  'Coastal Academy Hopefuls', 'Northside Trial Group', 'Regional Selection C',
  'Camp Trialists A', 'Valley Youth Trial', 'Southgate Hopefuls',
  'Old Boys Trial XI', "Bishop's Trial Selection", 'Iron District Youth',
  'Harbor Trial Group', 'Crestwood Selection', 'Union Trial XI',
];

function simResult(teamA, teamB) {
  const aScore = Math.max(0, Math.round((teamA.attack - teamB.defense) / 10 + (Math.random() * 3 - 1)));
  const bScore = Math.max(0, Math.round((teamB.attack - teamA.defense) / 10 + (Math.random() * 3 - 1)));
  return { aScore, bScore };
}

function generateTrialTeams(playerOverall) {
  const playerTeam = { id: 'player_trial', name: GameState.player.name, attack: playerOverall, defense: playerOverall };
  const opponents = TRIAL_OPPONENT_NAMES.map((name, i) => {
    const base = 40 + Math.floor(i * 1.6);
    return { id: `trial_opp_${i}`, name, attack: base + Math.floor(Math.random()*8), defense: base + Math.floor(Math.random()*8) - 2 };
  });
  return [playerTeam, ...opponents];
}

function generateTrialBracket(teams) {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({ home: shuffled[i], away: shuffled[i+1], result: null, winner: null });
  }
  return { stage: 'Round of 16', matches };
}

function simulateOtherTrialMatches(round) {
  round.matches.forEach(m => {
    if (m.winner) return;
    if (m.home.id === 'player_trial' || m.away.id === 'player_trial') return;
    const r = simResult(m.home, m.away);
    m.result = r;
    m.winner = r.aScore >= r.bScore ? m.home : m.away;
  });
}

function progressTrialRoundIfComplete() {
  const trial = GameState.trial;
  const round = trial.rounds[trial.rounds.length - 1];
  if (!round.matches.every(m => m.winner)) return;
  if (round.stage === 'Final') return;
  const winners = round.matches.map(m => m.winner);
  const nextStage = { 'Round of 16':'Quarter-Final', 'Quarter-Final':'Semi-Final', 'Semi-Final':'Final' }[round.stage];
  const nextMatches = [];
  for (let i = 0; i < winners.length; i += 2) {
    nextMatches.push({ home: winners[i], away: winners[i+1] || winners[i], result: null, winner: null });
  }
  trial.rounds.push({ stage: nextStage, matches: nextMatches });
}

function resolveRestOfTrialBracketInstantly() {
  const trial = GameState.trial;
  while (true) {
    const round = trial.rounds[trial.rounds.length - 1];
    round.matches.forEach(m => {
      if (!m.winner) {
        const r = simResult(m.home, m.away);
        m.result = r;
        m.winner = r.aScore >= r.bScore ? m.home : m.away;
      }
    });
    if (round.stage === 'Final') break;
    progressTrialRoundIfComplete();
  }
}

function showTrialIntroScreen() {
  app.innerHTML = `
    <div class="screen trial-intro-screen animate__animated animate__fadeIn">
      <div class="trial-intro-icon">🏆</div>
      <div class="trial-intro-title">THE TRIAL</div>
      <div class="trial-intro-sub">Round of 16 Knockout</div>
      <div class="trial-intro-text">
        Fifteen other trialists want the same shirt you do. One bad
        performance and you're going home. Win, and you walk into the
        season as a starter.
      </div>
      <div class="trial-bracket-preview">Round of 16 → Quarter-Final → Semi-Final → Final</div>
      <button class="cta-btn" id="trial-begin-btn">Begin Your Trial →</button>
    </div>
  `;
  document.getElementById('trial-begin-btn').addEventListener('click', beginTrial);
}

function beginTrial() {
  const teams = generateTrialTeams(GameState.player.overall);
  GameState.trial = {
    rounds: [generateTrialBracket(teams)],
    eliminated: false,
    eliminatedStage: null,
    champion: false,
    stats: { goals: 0, assists: 0, matchesPlayed: 0, ratings: [] },
  };
  const round = GameState.trial.rounds[0];
  simulateOtherTrialMatches(round);
  const myMatch = round.matches.find(m => m.home.id === 'player_trial' || m.away.id === 'player_trial');
  launchTrialMatch(myMatch);
}

function launchTrialMatch(match) {
  const opp = match.home.id === 'player_trial' ? match.away : match.home;
  const gk = Math.round((opp.attack + opp.defense) / 2 - 4);
  GameState.opponent = {
    name: opp.name, attack: opp.attack, defense: opp.defense, gk,
    defender: {
      shortTackle: opp.defense, slideTackle: opp.defense - 4, positioning: opp.defense - 2,
      pace: opp.attack - 6, physicality: opp.defense - 2, heading: opp.defense - 4,
    },
    gk_diving: gk, gk_reflexes: gk + 2, gk_composure: gk - 2,
  };
  GameState.currentTrialMatch = match;
  startMatch();
}

function handlePostMatchFlowEnd() {
  if (GameState.currentTrialMatch) {
    const match = GameState.currentTrialMatch;
    GameState.currentTrialMatch = null;
    onTrialMatchComplete(match);
  } else if (GameState.currentFixture) {
    const fixture = GameState.currentFixture;
    GameState.currentFixture = null;
    onMatchComplete(fixture);
  } else {
    showCareerHub();
  }
}

function onTrialMatchComplete(match) {
  const m = GameState.match;
  const trial = GameState.trial;

  trial.stats.goals   += (m.goals || 0);
  trial.stats.assists += (m.assists || 0);
  trial.stats.matchesPlayed++;
  trial.stats.ratings.push(m.rating || 6.0);

  match.result = { aScore: m.score.us, bScore: m.score.them };
  const winner = m.score.us >= m.score.them
    ? (match.home.id === 'player_trial' ? match.home : match.away)
    : (match.home.id === 'player_trial' ? match.away : match.home);
  match.winner = winner;

  if (winner.id !== 'player_trial') {
    trial.eliminated = true;
    trial.eliminatedStage = trial.rounds[trial.rounds.length - 1].stage;
  }

  simulateOtherTrialMatches(trial.rounds[trial.rounds.length - 1]);
  progressTrialRoundIfComplete();

  const lastRound = trial.rounds[trial.rounds.length - 1];
  if (lastRound.stage === 'Final' && lastRound.matches.every(mm => mm.winner)) {
    trial.champion = lastRound.matches[0].winner.id === 'player_trial';
  }

  showTrialProgressScreen();
}

function showTrialProgressScreen() {
  const trial = GameState.trial;
  const stillIn = !trial.eliminated && !trial.champion;

  app.innerHTML = `
    <div class="screen detail-screen animate__animated animate__fadeIn">
      <div class="detail-title" style="text-align:center;margin-bottom:6px">THE TRIAL</div>
      <div class="cup-bracket">
        ${trial.rounds.map(round => `
          <div class="cup-round">
            <div class="cup-round-label">${round.stage}</div>
            ${round.matches.map(m => `
              <div class="cup-match ${(m.home.id==='player_trial'||m.away.id==='player_trial')?'cup-match-mine':''}">
                <span class="${m.winner?.id===m.home.id?'cup-winner':''}">${m.home.name}</span>
                <span class="cup-vs">${m.result?`${m.result.aScore}-${m.result.bScore}`:'vs'}</span>
                <span class="${m.winner?.id===m.away.id?'cup-winner':''}">${m.away.name}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
      <button class="cta-btn" id="trial-progress-continue" style="margin-top:16px">
        ${stillIn ? 'Continue to Next Round →' : 'See Trial Results →'}
      </button>
    </div>
  `;

  document.getElementById('trial-progress-continue').addEventListener('click', () => {
    if (stillIn) {
      const round = trial.rounds[trial.rounds.length - 1];
      const myMatch = round.matches.find(m => !m.winner && (m.home.id==='player_trial'||m.away.id==='player_trial'));
      if (myMatch) launchTrialMatch(myMatch);
    } else {
      if (trial.eliminated) resolveRestOfTrialBracketInstantly();
      showTrialCompleteSummary();
    }
  });
}

function getTrialOutcomeBonus() {
  const trial = GameState.trial;
  if (trial.champion) return { stardom: 18, managerRel: 80, bankBonus: 200, label: 'Trial Champion' };
  const stage = trial.eliminatedStage || 'Final';
  const map = {
    'Round of 16':   { stardom: 0,  managerRel: 38, bankBonus: 20,  label: 'Eliminated in the Round of 16' },
    'Quarter-Final': { stardom: 3,  managerRel: 48, bankBonus: 50,  label: 'Reached the Quarter-Final' },
    'Semi-Final':    { stardom: 8,  managerRel: 58, bankBonus: 90,  label: 'Reached the Semi-Final' },
    'Final':         { stardom: 13, managerRel: 68, bankBonus: 140, label: 'Trial Runner-Up' },
  };
  return map[stage] || map['Round of 16'];
}

function showTrialCompleteSummary() {
  const trial = GameState.trial;
  const bonus = getTrialOutcomeBonus();
  const avgRating = trial.stats.ratings.length
    ? trial.stats.ratings.reduce((a,b)=>a+b,0) / trial.stats.ratings.length
    : 0;

  app.innerHTML = `
    <div class="screen trial-summary-screen animate__animated animate__fadeIn">
      <div class="trial-summary-icon">${trial.champion ? '🏆' : trial.eliminated ? '📋' : '⚽'}</div>
      <div class="trial-summary-headline">${bonus.label}</div>
      <div class="trial-summary-stats">
        <div class="tss-row"><span>Matches Played</span><span>${trial.stats.matchesPlayed}</span></div>
        <div class="tss-row"><span>Goals</span><span>${trial.stats.goals}</span></div>
        <div class="tss-row"><span>Assists</span><span>${trial.stats.assists}</span></div>
        <div class="tss-row"><span>Average Rating</span><span>${avgRating.toFixed(1)}</span></div>
      </div>
      <div class="trial-summary-bonus">
        <div class="tsb-item"><span>Manager Trust</span><span>${bonus.managerRel}/100</span></div>
        <div class="tsb-item"><span>Stardom</span><span>+${bonus.stardom}</span></div>
        <div class="tsb-item"><span>Signing Bonus</span><span>£${bonus.bankBonus}</span></div>
      </div>
      <button class="cta-btn" id="begin-career-btn" style="margin-top:18px">Begin Your Career →</button>
    </div>
  `;
  document.getElementById('begin-career-btn').addEventListener('click', beginCareerFromTrial);
}

function beginCareerFromTrial() {
  const bonus = getTrialOutcomeBonus();
  GameState.match.managerRelationship = bonus.managerRel;
  GameState.career.stardom = bonus.stardom + 5;
  GameState.career.bankBalance = (GameState.career.bankBalance || 0) + bonus.bankBonus;
  initializeCareer();
}

// ── CAREER HUB ────────────────────────────────────────────────────────────────

const LEAGUE_TEAMS_TEMPLATE = [
  { id: 'riverside',     name: 'Riverside Academy',      attack: 48, defense: 46 },
  { id: 'city_youth',    name: 'City Youth B',           attack: 52, defense: 50 },
  { id: 'united_jr',     name: 'United Juniors',         attack: 55, defense: 53 },
  { id: 'park_rangers',  name: 'Park Rangers Academy',   attack: 50, defense: 48 },
  { id: 'east_side',     name: 'East Side Youth',        attack: 53, defense: 51 },
  { id: 'forest_yth',    name: 'Forest Youth',           attack: 49, defense: 50 },
  { id: 'kings_college', name: "King's College Academy", attack: 51, defense: 49 },
];

const WEEK_TYPE = {
  1:'league', 2:'league', 3:'league', 4:'league', 5:'league', 6:'league', 7:'league',
  8:'cup_qf', 9:'rest', 10:'cup_sf', 11:'rest', 12:'cup_final',
};

function buildLeagueTeams(playerTeamName, playerOverall) {
  const playerTeam = {
    id: 'player_team', name: playerTeamName,
    attack: Math.round(40 + playerOverall * 0.25),
    defense: Math.round(38 + playerOverall * 0.22),
    isPlayerTeam: true,
  };
  return [playerTeam, ...LEAGUE_TEAMS_TEMPLATE];
}

function generateRoundRobin(teams) {
  const n = teams.length;
  const arr = teams.slice();
  const rounds = [];
  for (let round = 0; round < n - 1; round++) {
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      matches.push({ home: arr[i], away: arr[n - 1 - i] });
    }
    rounds.push(matches);
    arr.splice(1, 0, arr.pop());
  }
  return rounds;
}

function generateCupBracket(teams) {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({ home: shuffled[i], away: shuffled[i+1], result: null, winner: null });
  }
  return { stage: 'Quarter-Final', matches };
}

function initializeCareer() {
  const p = GameState.player;
  const car = GameState.career;

  const teamName = car.clubName || `${p.name.split(' ')[0]}'s Academy`;
  const teams = buildLeagueTeams(teamName, p.overall);
  const rounds = generateRoundRobin(teams);
  const fixtures = [];
  rounds.forEach((roundMatches, i) => {
    const week = i + 1;
    roundMatches.forEach(m => {
      const isPlayerMatch = m.home.id === 'player_team' || m.away.id === 'player_team';
      fixtures.push({ week, type: 'league', home: m.home, away: m.away, isPlayerMatch, played: false, result: null });
    });
  });

  car.fixtures = fixtures;
  car.leagueTable = teams.map(t => ({
    id: t.id, name: t.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0,
    isPlayerTeam: t.isPlayerTeam || false,
  }));
  car.cup = { name: 'Academy Cup', rounds: [generateCupBracket(teams)], eliminated: false, eliminatedStage: null, champion: false };
  if (!car.squad) car.squad = assignSquad(p.position, p.name, p.nationality);
  car.weekNumber = 0;
  car.totalWeeks = 12;
  car.date = { day: 1, month: 9, year: 2025 };
  car.careerStats = car.careerStats || { totalGoals: 0, totalAssists: 0, matchesPlayed: 0, formHistory: [] };
  car.bankBalance = car.bankBalance || 0;
  car.stardom = car.stardom || 8;
  car.seasonComplete = false;

  showCareerHub();
}

function recordLeagueResult(homeTeam, awayTeam, result) {
  const table = GameState.career.leagueTable;
  const home = table.find(t => t.id === homeTeam.id);
  const away = table.find(t => t.id === awayTeam.id);
  if (!home || !away) return;
  home.played++; away.played++;
  home.gf += result.aScore; home.ga += result.bScore;
  away.gf += result.bScore; away.ga += result.aScore;
  if (result.aScore > result.bScore)      { home.won++; home.pts += 3; away.lost++; }
  else if (result.aScore < result.bScore) { away.won++; away.pts += 3; home.lost++; }
  else { home.drawn++; away.drawn++; home.pts += 1; away.pts += 1; }
  table.sort((a, b) => (b.pts - a.pts) || ((b.gf - b.ga) - (a.gf - a.ga)));
}

function simulateOtherFixturesForWeek(weekNum) {
  const others = GameState.career.fixtures.filter(f => f.week === weekNum && !f.isPlayerMatch && f.type === 'league');
  others.forEach(f => {
    const result = simResult(f.home, f.away);
    f.result = result; f.played = true;
    recordLeagueResult(f.home, f.away, result);
  });
}

function simulateOtherCupMatches(round) {
  round.matches.forEach(m => {
    if (m.winner) return;
    if (m.home.id === 'player_team' || m.away.id === 'player_team') return;
    const result = simResult(m.home, m.away);
    m.result = result;
    m.winner = result.aScore >= result.bScore ? m.home : m.away;
  });
}

function simNextWeek() {
  const car = GameState.career;
  car.weekNumber++;
  advanceCareerDate(7);

  if (car.weekNumber > car.totalWeeks) {
    car.seasonComplete = true;
    showSeasonCompleteScreen();
    return;
  }

  const weekType = WEEK_TYPE[car.weekNumber];

  if (weekType === 'rest') {
    showCareerHub();
    showToast('Quiet week. Training continues.', '📅');
    return;
  }

  if (weekType === 'league') {
    simulateOtherFixturesForWeek(car.weekNumber);
    const myFixture = car.fixtures.find(f => f.week === car.weekNumber && f.isPlayerMatch);
    if (!myFixture) { showCareerHub(); return; }
    launchFixture(myFixture);
    return;
  }

  if (weekType === 'cup_qf' || weekType === 'cup_sf' || weekType === 'cup_final') {
    handleCupWeek();
    return;
  }
}

function handleCupWeek() {
  const car = GameState.career;
  const currentRound = car.cup.rounds[car.cup.rounds.length - 1];

  if (car.cup.eliminated) {
    simulateOtherCupMatches(currentRound);
    progressCupRoundIfComplete();
    showCareerHub();
    return;
  }

  const myMatch = currentRound.matches.find(m =>
    !m.winner && (m.home.id === 'player_team' || m.away.id === 'player_team')
  );
  simulateOtherCupMatches(currentRound);

  if (myMatch) {
    launchFixture({ type: 'cup', home: myMatch.home, away: myMatch.away, cupMatch: myMatch, isPlayerMatch: true });
  } else {
    showCareerHub();
  }
}

function progressCupRoundIfComplete() {
  const car = GameState.career;
  const round = car.cup.rounds[car.cup.rounds.length - 1];
  if (!round.matches.every(m => m.winner)) return;
  if (round.stage === 'Final') {
    car.cup.champion = round.matches[0].winner.id === 'player_team';
    return;
  }
  const winners = round.matches.map(m => m.winner);
  const nextStage = round.stage === 'Quarter-Final' ? 'Semi-Final' : 'Final';
  const nextMatches = [];
  for (let i = 0; i < winners.length; i += 2) {
    nextMatches.push({ home: winners[i], away: winners[i+1] || winners[i], result: null, winner: null });
  }
  car.cup.rounds.push({ stage: nextStage, matches: nextMatches });
}

function advanceCareerDate(days) {
  const d = GameState.career.date;
  const date = new Date(d.year, d.month - 1, d.day);
  date.setDate(date.getDate() + days);
  d.day = date.getDate(); d.month = date.getMonth() + 1; d.year = date.getFullYear();
}

function launchFixture(fixture) {
  const opp = fixture.home.id === 'player_team' ? fixture.away : fixture.home;
  const gk = Math.round((opp.attack + opp.defense) / 2 - 4);
  GameState.opponent = {
    name: opp.name, attack: opp.attack, defense: opp.defense, gk,
    defender: {
      shortTackle: opp.defense, slideTackle: opp.defense - 4, positioning: opp.defense - 2,
      pace: opp.attack - 6, physicality: opp.defense - 2, heading: opp.defense - 4,
    },
    gk_diving: gk, gk_reflexes: gk + 2, gk_composure: gk - 2,
  };
  GameState.currentFixture = fixture;
  startMatch();
}

function onMatchComplete(fixture) {
  const m = GameState.match;
  const car = GameState.career;

  car.careerStats.totalGoals   += (m.goals || 0);
  car.careerStats.totalAssists += (m.assists || 0);
  car.careerStats.matchesPlayed++;
  car.careerStats.formHistory.push(m.rating || 6.0);
  if (car.careerStats.formHistory.length > 5) car.careerStats.formHistory.shift();

  if (m.rating >= 8.0) car.stardom = Math.min(100, car.stardom + 3);
  else if (m.rating >= 6.5) car.stardom = Math.min(100, car.stardom + 1);
  else if (m.rating < 5.0) car.stardom = Math.max(0, car.stardom - 1);

  car.bankBalance += 50;

  if (fixture && fixture.type === 'league') {
    recordLeagueResult(fixture.home, fixture.away, { aScore: m.score.us, bScore: m.score.them });
    fixture.played = true;
  } else if (fixture && fixture.type === 'cup' && fixture.cupMatch) {
    fixture.cupMatch.result = { aScore: m.score.us, bScore: m.score.them };
    const winner = m.score.us >= m.score.them
      ? (fixture.home.id === 'player_team' ? fixture.home : fixture.away)
      : (fixture.home.id === 'player_team' ? fixture.away : fixture.home);
    fixture.cupMatch.winner = winner;
    if (winner.id !== 'player_team') {
      car.cup.eliminated = true;
      car.cup.eliminatedStage = car.cup.rounds[car.cup.rounds.length - 1].stage;
    }
    progressCupRoundIfComplete();
  }

  showCareerHub();
}

function getPlayerPortraitHTML() {
  try {
    const p = GameState.player;
    const nation = NATIONS.find(n => n.id === p.nationality);
    return `<img src="https://flagcdn.com/w40/${nation?.code || 'gb'}.png" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" alt=""/>`;
  } catch(e) { return ''; }
}

let compCarouselIndex = 0;
let compCarouselTimer = null;
let compTouchStartX = 0;

function showCareerHub() {
  const p = GameState.player;
  const car = GameState.career;
  const nation = NATIONS.find(n => n.id === p.nationality);
  const myRow = car.leagueTable.find(t => t.isPlayerTeam);
  const myPosition = car.leagueTable.findIndex(t => t.isPlayerTeam) + 1;
  const nextFixture = getNextFixture();
  const form = car.careerStats.formHistory;
  const avgForm = form.length ? (form.reduce((a,b)=>a+b,0)/form.length) : 6.0;

  app.innerHTML = `
    <div class="hub-screen animate__animated animate__fadeIn">

      <div class="hub-topbar">
        <button class="hub-icon-btn" id="hub-settings">⚙️</button>
        <div class="hub-brand">
          <div class="hub-logo">STRIKER</div>
          <div class="hub-date">Week ${car.weekNumber || 1} · ${formatCareerDate(car.date)}</div>
        </div>
        <div style="width:32px"></div>
      </div>

      <div class="hub-header">
        <div class="hub-portrait">${getPlayerPortraitHTML()}</div>
        <div class="hub-identity">
          <div class="hub-name">${p.name}</div>
          <div class="hub-meta">${nation?.flag||''} Age 16 · ${ordinal(myPosition)} in League</div>
        </div>
        <div class="hub-rating-block">
          <div class="hub-ovr">${p.overall}</div>
          <div class="hub-balance">£${car.bankBalance}</div>
        </div>
      </div>

      <div class="hub-body">
        <div class="hub-panel hub-team-panel">
          <div class="hub-panel-label">${car.clubName || (myRow ? myRow.name : 'Your Team')}</div>
          ${renderSquadFormation(car.squad)}
          <div class="hub-subs-label">Substitutes</div>
          <div class="hub-subs-list">
            ${car.squad.subs.map(s => `<div class="hub-sub-row"><span>${s.name}</span><span class="hub-sub-pos">${s.pos}</span></div>`).join('')}
          </div>
        </div>

        <div class="hub-panel hub-comp-panel" id="hub-comp-panel">
          ${renderCompetitionsPanel()}
        </div>
      </div>

      <div class="hub-fixture-banner">
        <div class="hfb-label">NEXT FIXTURE</div>
        <div class="hfb-content">
          ${nextFixture
            ? `<div class="hfb-opponent">vs ${nextFixture.home.id==='player_team'?nextFixture.away.name:nextFixture.home.name}</div>
               <div class="hfb-comp-tag">${nextFixture.type==='cup'?'Academy Cup':'League'}</div>`
            : `<div class="hfb-opponent">Season complete</div>`}
        </div>
      </div>

      <div class="hub-tabbar">
        <button class="hub-tab" data-tab="stats">Stats</button>
        <button class="hub-tab" data-tab="team">Team</button>
        <button class="hub-tab hub-tab-sim" id="hub-sim-btn">SIM<br>NEXT WEEK</button>
        <button class="hub-tab" data-tab="relationships">Relationships</button>
        <button class="hub-tab" data-tab="actions">Actions</button>
      </div>

      <div class="hub-footer-stats">
        <div class="hfs-col">
          <div class="hfs-row"><span>Form</span><span class="${avgForm>=7?'good':avgForm>=5.5?'mid':'bad'}">${avgForm.toFixed(1)}</span></div>
          <div class="hfs-row"><span>Goals</span><span>${car.careerStats.totalGoals}</span></div>
          <div class="hfs-row"><span>Assists</span><span>${car.careerStats.totalAssists}</span></div>
        </div>
        <div class="hfs-col hfs-bars">
          ${renderMiniBar('Manager', GameState.match.managerRelationship || 50)}
          ${renderMiniBar('Stardom', car.stardom)}
          <div class="hfs-row"><span>Market Value</span><span class="hfs-mv">${formatMarketValue(p.overall, car.stardom)}</span></div>
        </div>
      </div>

    </div>
  `;

  wireCareerHub();
  startCompCarouselAutoRotate();
}

function renderMiniBar(label, val) {
  return `
    <div class="hfs-bar-row">
      <span class="hfs-bar-label">${label}</span>
      <div class="hfs-bar-track"><div class="hfs-bar-fill" style="width:${val}%"></div></div>
    </div>`;
}

function formatMarketValue(overall, stardom) {
  const base = Math.pow(Math.max(0, overall - 40), 1.8) * 80;
  const value = Math.round(base * (1 + stardom/100) / 1000) * 1000;
  return value >= 1000 ? `£${Math.round(value/1000)}k` : `£${value}`;
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

function formatCareerDate(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.day} ${months[d.month-1]} ${d.year}`;
}

function getNextFixture() {
  const car = GameState.career;
  return car.fixtures.find(f => f.week >= car.weekNumber + 1 && f.isPlayerMatch && !f.played) || null;
}

function getCompetitionsSummary() {
  const car = GameState.career;
  const myRow = car.leagueTable.find(t => t.isPlayerTeam);
  const myPos = car.leagueTable.findIndex(t => t.isPlayerTeam) + 1;
  const league = {
    id: 'league', icon: '🏆', name: 'Academy League',
    summaryLine: myRow ? `${ordinal(myPos)} / ${car.leagueTable.length} · ${myRow.pts} pts` : '—',
  };
  let cupSummary;
  if (car.cup.champion) cupSummary = '🏆 Champions!';
  else if (car.cup.eliminated) cupSummary = `Eliminated — ${car.cup.eliminatedStage}`;
  else cupSummary = car.cup.rounds[car.cup.rounds.length - 1]?.stage || 'Quarter-Final';
  const cup = { id: 'cup', icon: '🏅', name: 'Academy Cup', summaryLine: cupSummary };
  return [league, cup];
}

function renderCompetitionsPanel() {
  const comps = getCompetitionsSummary();
  return `
    <div class="hub-panel-label">Competitions</div>
    <div class="comp-carousel" id="comp-carousel">
      <div class="comp-track" id="comp-track">
        ${comps.map(c => `
          <button class="comp-card" data-comp="${c.id}">
            <div class="comp-card-icon">${c.icon}</div>
            <div class="comp-card-name">${c.name}</div>
            <div class="comp-card-summary">${c.summaryLine}</div>
            <div class="comp-card-tap">Tap for details →</div>
          </button>
        `).join('')}
      </div>
    </div>
    <div class="comp-dots">
      ${comps.map((_,i) => `<div class="comp-dot ${i===compCarouselIndex?'active':''}" data-dot="${i}"></div>`).join('')}
    </div>
  `;
}

function wireCompetitionsCarousel() {
  const track = document.getElementById('comp-track');
  const carousel = document.getElementById('comp-carousel');
  if (!track || !carousel) return;
  updateCompTrackPosition();
  carousel.addEventListener('touchstart', e => {
    compTouchStartX = e.touches[0].clientX;
    clearInterval(compCarouselTimer);
  });
  carousel.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - compTouchStartX;
    const comps = getCompetitionsSummary();
    if (dx < -40) compCarouselIndex = Math.min(comps.length - 1, compCarouselIndex + 1);
    if (dx > 40)  compCarouselIndex = Math.max(0, compCarouselIndex - 1);
    updateCompTrackPosition();
    setTimeout(startCompCarouselAutoRotate, 2500);
  });
  document.querySelectorAll('.comp-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      compCarouselIndex = parseInt(dot.dataset.dot);
      updateCompTrackPosition();
    });
  });
  document.querySelectorAll('.comp-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.comp === 'league') showLeagueTableDetail();
      else showCupDetail();
    });
  });
}

function updateCompTrackPosition() {
  const track = document.getElementById('comp-track');
  if (track) track.style.transform = `translateX(-${compCarouselIndex * 100}%)`;
  document.querySelectorAll('.comp-dot').forEach((d,i) => d.classList.toggle('active', i===compCarouselIndex));
}

function startCompCarouselAutoRotate() {
  clearInterval(compCarouselTimer);
  compCarouselTimer = setInterval(() => {
    const comps = getCompetitionsSummary();
    compCarouselIndex = (compCarouselIndex + 1) % comps.length;
    updateCompTrackPosition();
  }, 4000);
}

function showLeagueTableDetail() {
  const car = GameState.career;
  app.innerHTML = `
    <div class="screen detail-screen animate__animated animate__fadeIn">
      <div class="detail-header">
        <button class="detail-back" id="detail-back">←</button>
        <div class="detail-title">Academy League</div>
      </div>
      <table class="league-table-full">
        <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
        <tbody>
          ${car.leagueTable.map((t,i) => `
            <tr class="${t.isPlayerTeam ? 'lt-highlight' : ''}">
              <td>${i+1}</td><td>${t.name}</td><td>${t.played}</td><td>${t.won}</td>
              <td>${t.drawn}</td><td>${t.lost}</td><td>${t.gf-t.ga}</td><td><b>${t.pts}</b></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  document.getElementById('detail-back').addEventListener('click', showCareerHub);
}

function showCupDetail() {
  const car = GameState.career;
  app.innerHTML = `
    <div class="screen detail-screen animate__animated animate__fadeIn">
      <div class="detail-header">
        <button class="detail-back" id="detail-back">←</button>
        <div class="detail-title">Academy Cup</div>
      </div>
      <div class="cup-bracket">
        ${car.cup.rounds.map(round => `
          <div class="cup-round">
            <div class="cup-round-label">${round.stage}</div>
            ${round.matches.map(m => `
              <div class="cup-match ${(m.home.id==='player_team'||m.away.id==='player_team')?'cup-match-mine':''}">
                <span class="${m.winner?.id===m.home.id?'cup-winner':''}">${m.home.name}</span>
                <span class="cup-vs">${m.result ? `${m.result.aScore}-${m.result.bScore}` : 'vs'}</span>
                <span class="${m.winner?.id===m.away.id?'cup-winner':''}">${m.away.name}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
        ${car.cup.champion ? `<div class="cup-champion-banner">🏆 CHAMPIONS</div>` : ''}
        ${car.cup.eliminated ? `<div class="cup-eliminated-banner">Eliminated — ${car.cup.eliminatedStage}</div>` : ''}
      </div>
    </div>`;
  document.getElementById('detail-back').addEventListener('click', showCareerHub);
}

function showStatsTab() {
  const car = GameState.career;
  const form = car.careerStats.formHistory;
  app.innerHTML = `
    <div class="screen detail-screen animate__animated animate__fadeIn">
      <div class="detail-header"><button class="detail-back" id="detail-back">←</button><div class="detail-title">Season Stats</div></div>
      <div class="stats-tab-grid">
        <div class="stat-tile"><div class="stat-tile-val">${car.careerStats.matchesPlayed}</div><div class="stat-tile-label">Matches</div></div>
        <div class="stat-tile"><div class="stat-tile-val">${car.careerStats.totalGoals}</div><div class="stat-tile-label">Goals</div></div>
        <div class="stat-tile"><div class="stat-tile-val">${car.careerStats.totalAssists}</div><div class="stat-tile-label">Assists</div></div>
        <div class="stat-tile"><div class="stat-tile-val">${car.stardom}</div><div class="stat-tile-label">Stardom</div></div>
      </div>
      <div class="hub-panel-label" style="margin-top:16px">Recent Form</div>
      <div class="form-history-row">
        ${form.map(f => `<div class="form-pip ${f>=7?'good':f>=5.5?'mid':'bad'}">${f.toFixed(1)}</div>`).join('') || '<span style="color:rgba(255,255,255,0.3);font-size:12px">No matches played yet</span>'}
      </div>
    </div>`;
  document.getElementById('detail-back').addEventListener('click', showCareerHub);
}

function showTeamTab() {
  const car = GameState.career;
  app.innerHTML = `
    <div class="screen detail-screen animate__animated animate__fadeIn">
      <div class="detail-header"><button class="detail-back" id="detail-back">←</button><div class="detail-title">Full Squad</div></div>
      <div class="squad-list">
        ${car.squad.starters.map(s => `
          <div class="squad-row ${s.isPlayer?'squad-row-mine':''}">
            <span class="squad-pos-tag">${s.label}</span><span>${s.name}</span>
          </div>`).join('')}
      </div>
      <div class="hub-panel-label" style="margin-top:14px">Substitutes</div>
      <div class="squad-list">
        ${car.squad.subs.map(s => `<div class="squad-row"><span class="squad-pos-tag">${s.pos}</span><span>${s.name}</span></div>`).join('')}
      </div>
    </div>`;
  document.getElementById('detail-back').addEventListener('click', showCareerHub);
}

function showRelationshipsTab() {
  const car = GameState.career;
  const mgrRel = GameState.match.managerRelationship || 50;
  app.innerHTML = `
    <div class="screen detail-screen animate__animated animate__fadeIn">
      <div class="detail-header"><button class="detail-back" id="detail-back">←</button><div class="detail-title">Relationships</div></div>
      <div class="rel-row">
        <div class="rel-name">Academy Manager</div>
        <div class="hfs-bar-track" style="width:100%"><div class="hfs-bar-fill" style="width:${mgrRel}%"></div></div>
      </div>
      ${car.squad.starters.filter(s=>!s.isPlayer).slice(0,4).map(s => `
        <div class="rel-row">
          <div class="rel-name">${s.name} <span class="rel-pos">${s.label}</span></div>
          <div class="hfs-bar-track" style="width:100%"><div class="hfs-bar-fill" style="width:50%"></div></div>
        </div>`).join('')}
      <div class="rel-note">Relationships deepen as your story continues.</div>
    </div>`;
  document.getElementById('detail-back').addEventListener('click', showCareerHub);
}

function showActionsTab() {
  app.innerHTML = `
    <div class="screen detail-screen animate__animated animate__fadeIn">
      <div class="detail-header"><button class="detail-back" id="detail-back">←</button><div class="detail-title">Actions</div></div>
      <div class="actions-placeholder">
        <div class="actions-icon">🚧</div>
        <div class="actions-text">Training, press conferences, and lifestyle choices arrive in a future update.</div>
      </div>
    </div>`;
  document.getElementById('detail-back').addEventListener('click', showCareerHub);
}

function showSeasonCompleteScreen() {
  const car = GameState.career;
  const myPos = car.leagueTable.findIndex(t => t.isPlayerTeam) + 1;
  app.innerHTML = `
    <div class="screen detail-screen animate__animated animate__fadeIn" style="text-align:center;padding-top:60px">
      <div style="font-size:48px">🏁</div>
      <div class="detail-title" style="font-size:32px;margin-top:10px">Season Complete</div>
      <div style="color:rgba(255,255,255,0.5);margin-top:8px">Finished ${ordinal(myPos)} in the Academy League</div>
      <div style="color:rgba(255,255,255,0.3);margin-top:20px;font-size:13px">Next season and progression — coming soon.</div>
    </div>`;
}

function wireCareerHub() {
  document.getElementById('hub-sim-btn')?.addEventListener('click', simNextWeek);
  document.querySelectorAll('.hub-tab[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === 'stats') showStatsTab();
      if (tab === 'team') showTeamTab();
      if (tab === 'relationships') showRelationshipsTab();
      if (tab === 'actions') showActionsTab();
    });
  });
  document.getElementById('hub-settings')?.addEventListener('click', () => showToast('Settings coming soon', '⚙️'));
  wireCompetitionsCarousel();
}

// ── UI HELPERS ────────────────────────────────────────────────────────────────

function refreshHUD() {
  const hudEl = document.querySelector('.hud');
  if (hudEl) {
    const tmp = document.createElement('div');
    tmp.innerHTML = matchHUD();
    const newHud = tmp.firstElementChild;
    hudEl.replaceWith(newHud);
    wireHUDControls();
  }
}

function wireHUDControls() {
  const wrToggle = document.getElementById('wr-toggle');
  const menToggle = document.getElementById('men-toggle');
  if (wrToggle) {
    wrToggle.addEventListener('click', e => {
      const b = e.target.closest('[data-wr]');
      if (!b) return;
      if (b.dataset.wr === 'high' && GameState.match.stamina < 19) return;
      GameState.match.workRate = b.dataset.wr;
      refreshHUD();
    });
  }
  if (menToggle) {
    menToggle.addEventListener('click', e => {
      const b = e.target.closest('[data-men]');
      if (!b) return;
      GameState.match.mentality = b.dataset.men;
      refreshHUD();
    });
  }
}

function refreshFeed() {
  const feedArea = document.getElementById('match-feed-area');
  if (feedArea) feedArea.innerHTML = matchFeedPanel(GameState.match.feed);
}

function refreshDebug() {
  if (!debugEl) return;
  if (GameState.debug.enabled) {
    debugEl.style.display = 'block';
    debugEl.innerHTML = debugPanel();
  } else {
    debugEl.style.display = 'none';
  }
}

// ── OUTCOME NARRATIVE ─────────────────────────────────────────────────────────

function buildOutcomeNarrative(result) {
  const { success, isNat20, isNat1, choice, next } = result;

  if (isNat20) {
    return `Pure brilliance. ${choice.label} — executed with a level of quality that silences the watching coaches. A moment of total class.`;
  }
  if (isNat1) {
    return `You get it wrong. Completely. The ball skips away, the opportunity gone. You feel the heat on your face — that can't happen again.`;
  }

  const successNarrations = {
    take_on:         `You drive at him, shoulder drops, he bites — and you're gone. The crowd makes a noise.`,
    feint:           `The feint works. He commits to the wrong foot and you're in the clear.`,
    lofted_pass:     `You pick it out perfectly — the ball arcs over the press and lands at his feet.`,
    hold_up:         `You hold your ground, take the contact, and the ball stays under you.`,
    low_driven:      `Clean contact. Low, driven, far corner. Keeper goes the wrong way.`,
    power_shot:      `Your laces crack through it. Pure instinct. The ball flies.`,
    take_touch:      `You take your touch, open your hips, and find the corner.`,
    cut_inside:      `Sharp drop of the shoulder. He can't stay with you. You cut inside and have the angle.`,
    power_through:   `You bully him off it. Physicality wins — you're free.`,
    dummy_run:       `You peel away at the perfect moment. The ball rolls for the runner — perfectly weighted.`,
    whip_in:         `The delivery is whipped in hard. Dangerous. Someone's getting on the end of that.`,
    cut_inside_shoot:`You cut inside, create the angle, and pull the trigger.`,
    pull_back:       `You play it back across the face — clinical. The midfielder arrives on cue.`,
    one_two:         `Perfectly executed. Quick, sharp, through the gap. The defence is split.`,
    shoot_first_time:`First time. No hesitation. Your body position is perfect.`,
    hold_turn:       `Cushioned control, swivel, and now you're facing goal.`,
    spin_run:        `You spin sharply off your marker. He can't stay with you.`,
    quick_combo:     `Quick, short, decisive. You get it back and you're running at goal.`,
    long_shot:       `Hit from range — it dips viciously and crashes into the top corner.`,
    track_runner:    `You win the header. Clean contact, good timing. The danger is cleared.`,
    run_high:        `They clear it. You're already facing the other way. The counter is on.`,
    shoot_direct:    `Over the wall. It dips. The keeper scrambles.`,
    lay_off:         `Sharp pass — teammate arrives and cracks it home.`,
    whip_into_box:   `Perfect delivery into the danger zone.`,
    knuckleball:     `It doesn't move, then it moves everywhere. The keeper has no chance.`,
    whipped:         `Curled in, sharp, to the near post. Dangerous.`,
    floated:         `It hangs in the air perfectly. The striker is all alone.`,
    short_corner:    `Quick combination opens the angle. Cross is in.`,
    slide_through:   `Threaded through the eye of a needle. Perfectly weighted.`,
    take_on:         `You drop the shoulder, dummy the pass, and drive forward.`,
    switch_play:     `Ball switched perfectly. Their defence is stretched.`,
    thread_it:       `Vision of a midfielder. Thread between two defenders — the striker is through.`,
    safe_back:       `Ball recycled efficiently. Possession maintained.`,
    shoot_yourself:  `You ignore the run and hit it yourself. Good choice.`,
  };

  const failureNarrations = {
    take_on:         `He reads it. Gets across, forces you wide, and wins the ball.`,
    feint:           `He doesn't bite. You're off balance. He takes the ball cleanly.`,
    lofted_pass:     `Too heavy. The keeper collects comfortably.`,
    hold_up:         `He's too strong. Muscled off it. Possession gone.`,
    low_driven:      `Too close to the keeper. He smothers it.`,
    power_shot:      `It flies wide. Into the crowd. You put too much into it.`,
    take_touch:      `The touch lets you down. Defender gets across.`,
    cut_inside:      `He stays tight and cuts your angle. Ball goes out of play.`,
    power_through:   `He holds position. You can't bully him today.`,
    dummy_run:       `The ball runs to a defender. He reads it perfectly.`,
    whip_in:         `It goes straight at the first defender. Cleared immediately.`,
    cut_inside_shoot:`He stays with you. You're forced back.`,
    pull_back:       `Intercepted in the middle. They're on the counter.`,
    one_two:         `The pass is too heavy. Defender cuts it out.`,
    shoot_first_time:`It loops wide. Poor contact. You should have taken a touch.`,
    hold_turn:       `He nicks it off you as you turn. Danger.`,
    spin_run:        `He's been waiting for that spin. He holds position and you run into him.`,
    quick_combo:     `Pass is intercepted. Counter developing quickly.`,
    long_shot:       `High and wide. Frustrated, you put too much effort in.`,
    track_runner:    `He gets ahead of you. Header back across goal — dangerous.`,
    run_high:        `They don't clear it. Ball into the net. You were nowhere near.`,
    shoot_direct:    `Saved. Well struck, but the keeper is equal to it.`,
    lay_off:         `Miscontrolled by the arriving player. Possession gone.`,
    whip_into_box:   `Too high, too close to the keeper. He claims it.`,
    knuckleball:     `It doesn't do enough. Keeper holds it.`,
    whipped:         `Corner delivery is too close. Goalkeeper claims it comfortably.`,
    floated:         `The delivery is too deep. Goalkeeper off his line, collects.`,
    short_corner:    `Too slow. Pressed. Ball lost.`,
    slide_through:   `A step behind. The defender reads the pass and cuts it out.`,
    switch_play:     `Pass is intercepted. The switch wasn't on.`,
    thread_it:       `The gap closes before the ball gets through. Offside.`,
    safe_back:       `Misplayed. Poor contact. They win the ball.`,
    shoot_yourself:  `High and wide. You should have looked for the run.`,
  };

  const map = success ? successNarrations : failureNarrations;
  return map[choice.id] || (success
    ? `Good decision. It comes off.`
    : `It doesn't come off this time.`
  );
}

function isTerminal(nextId) {
  const cascadeIds = [
    'A1','A2','A3','A4','A5','A6','A7','A8','A9','A10',
    'A1_KEEPER','A2_HALF',
    'C1_OVERLAP','C2_SWITCH',
    'D1_CORNER_AGAINST','D2_TRACKING_BACK',
    'COUNTER_CASCADE',
    'SP_FREEKICK_CLOSE','SP_CORNER','SP_CORNER_HEADER',
    'PENALTY',
    // v3 new cascade IDs
    'LATE_ENFORCER','LATE_LAST_CHANCE',
    'GAUNTLET_DEF1','GAUNTLET_DEF2','GAUNTLET_DEF3',
    'KEEPER_ADVANCE',
    // Flavor events — not terminals
    'MANAGER_TRACK_BACK','MANAGER_HALFTIME_BLAST','MANAGER_PRAISE',
    'OPPOSITION_ATTACK',
    'REF_FOUL_GIVEN_YOU','REF_OFFSIDE_CALL','REF_PENALTY_APPEAL','REF_LAST_MAN_FOUL',
    // Motivation chain events — cascade, not terminals
    'MOTIVATION_CHAIN_1','MOTIVATION_CHAIN_2','MOTIVATION_CHAIN_3',
    // New event cascades
    'A_MAN_MARK','A_WINGER_BEAT','A_QUIET_STADIUM','A_STAR_TEAMMATE',
    'A_DIRTY_DEFENDER','A_EXPERIENCED_DEF','A_MOTIVATION',
    'S_KEEPER_RUSH','S_WIDE_TOUCH','S_KEEPER_STILL','S_FOOTSTEPS','S_LAST_DEF_CHALLENGE',
    'COUNTER_WINGER_LOOSE','COUNTER_STRIKER_CORNER','COUNTER_CAM_BOX',
    'CREATE_DOUBLE_RUN','CREATE_COLLAPSE','CREATE_TINY_WINDOW',
    'CHAOS_CORNER_VOLLEY','CHAOS_TEAMMATE_FOULED','CHAOS_OVERHIT_CORNER',
    'BOX_FOUL',
    // Legacy IDs kept for safety
    'D1','SP1','SP2','C1','C2',
  ];
  return !cascadeIds.includes(nextId);
}

// Background-only simulation when player is substituted
function runBackgroundOnly(minute) {
  const m = GameState.match;
  const feed = [];
  const r = Math.random();
  if (r > 0.88) {
    m.score.us++;
    feed.push(`⚽ ${m.score.us}–${m.score.them} — Team goal while you watch from the bench.`);
  } else if (r > 0.78) {
    m.score.them++;
    feed.push(`💔 ${m.score.us}–${m.score.them} — They score. You can only watch.`);
  } else if (r > 0.5) {
    feed.push(`${minute}' — Team pressing hard without you.`);
  } else {
    feed.push(`${minute}' — Match continues. You're on the bench.`);
  }
  return feed;
}
