// Screen rendering helpers — returns HTML strings injected into #app

import { NATIONS } from '../data/nations.js';
import { PROFILES } from '../data/profiles.js';
import { BACKGROUNDS, SCHOOL_FOCUS, YOUTH_EVENTS, NATIONALITY_NAMES, FORMATION_433, POSITION_MAP } from '../data/background.js';
import { WEAPONS, DISCOVER_OPTION } from '../data/weapons.js';
import { GameState } from '../engine/GameState.js';
import { RatingEngine } from '../engine/RatingEngine.js';
import { renderPitchMap } from './pitchMap.js';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { renderStatsBlock } from '../data/events_flavor.js';

// ── CREATOR DATA CONSTANTS ────────────────────────────────────────────────────

export const SKIN_TONES = {
  1: { name: 'Very Light' },
  2: { name: 'Light'      },
  3: { name: 'Medium'     },
  4: { name: 'Tan'        },
  5: { name: 'Dark'       },
  6: { name: 'Very Dark'  },
};

export const HAIR_COLORS = {
  black:      '#1a1a1a',
  dark_brown: '#2C1A0E',
  brown:      '#6B3A2A',
  blonde:     '#D4A820',
  red:        '#A0290A',
  white:      '#E8E8E0',
};

export const HAIR_STYLES_LABELS = {
  buzz: 'Buzz Cut', fade: 'Fade', short: 'Short', messy: 'Messy',
  curly: 'Curly', long: 'Long', afro: 'Afro', undercut: 'Undercut',
};

export const POSITION_DATA = {
  ST:  { label: 'Striker',       icon: '⚡', desc: 'Centre forward. Goals are everything. Leads the line.' },
  CAM: { label: 'Attacking Mid', icon: '🎯', desc: 'Between the lines. The playmaker. Creates and scores.' },
  LW:  { label: 'Left Wing',     icon: '💨', desc: 'Wide, fast, direct. Takes defenders on.' },
  RW:  { label: 'Right Wing',    icon: '🌀', desc: 'Cuts inside. Creates danger from the right.' },
};

export const ARCHETYPES = {
  ST: [
    { id: 'enforcer',        name: 'Enforcer',         icon: '💪', desc: 'Physical. Dominant. Makes life hell for defenders.', strengths: ['Physicality','Heading','Aerial'],       weaknesses: ['Agility','Dribbling'],            statMods: { physicality:+6, heading:+6, stamina:+3, dribbling:-3, agility:-2 } },
    { id: 'complete_forward',name: 'Complete Forward', icon: '⚽', desc: 'Does everything. Scores, creates, pressures.',        strengths: ['Finishing','Vision','Composure'],        weaknesses: ['Nothing specific — balanced'],    statMods: { finishing:+4, vision:+3, composure:+3, shortPassing:+2 } },
    { id: 'false_nine',      name: 'False Nine',       icon: '🎭', desc: 'Drops deep. Creates overloads. Thinks like a midfielder.', strengths: ['Vision','Passing','Intelligence'], weaknesses: ['Heading','Physicality'],           statMods: { vision:+6, shortPassing:+5, intelligence:+5, heading:-3, physicality:-2 } },
    { id: 'predator',        name: 'Predator',         icon: '🎯', desc: 'Pure finisher. Appears in the box. Clinical.',        strengths: ['Finishing','Composure','Positioning'],  weaknesses: ['Stamina','Pace'],                 statMods: { finishing:+7, composure:+5, positioning:+4, stamina:-2, pace:-2 } },
  ],
  CAM: [
    { id: 'visionary',     name: 'Visionary',     icon: '👁️', desc: 'Sees passes before they exist. The eyes of the team.',  strengths: ['Vision','Intelligence','Long Passing'], weaknesses: ['Physicality','Pace'],   statMods: { vision:+8, intelligence:+6, longPassing:+4, physicality:-3, pace:-2 } },
    { id: 'playmaker',     name: 'Playmaker',     icon: '🎨', desc: 'Controls the tempo. Dictates everything.',               strengths: ['Passing','Vision','Ball Control'],       weaknesses: ['Heading','Physicality'], statMods: { shortPassing:+6, vision:+5, ballControl:+5, heading:-3, physicality:-2 } },
    { id: 'second_striker',name: 'Second Striker',icon: '⚡', desc: 'Attacks from deep. Arrives late into the box.',          strengths: ['Finishing','Runs','Composure'],          weaknesses: ['Long Passing','Defending'], statMods: { finishing:+5, composure:+4, acceleration:+3, longPassing:-2 } },
    { id: 'maestro',       name: 'Maestro',       icon: '👑', desc: 'Technical excellence in every action.',                  strengths: ['Dribbling','Vision','Passing'],          weaknesses: ['Heading','Stamina'],    statMods: { dribbling:+5, vision:+4, shortPassing:+4, ballControl:+3, heading:-3 } },
  ],
  LW: [
    { id: 'runner',         name: 'Runner',        icon: '💨', desc: 'Pure pace. Gets in behind. Beats defenders with speed.',  strengths: ['Pace','Acceleration','Stamina'],       weaknesses: ['Vision','Long Passing'],     statMods: { pace:+7, acceleration:+6, stamina:+3, vision:-2, longPassing:-2 } },
    { id: 'dribbler',       name: 'Dribbler',      icon: '🌀', desc: 'Takes players on. Creates with his feet. Unpredictable.',strengths: ['Dribbling','Agility','Balance'],       weaknesses: ['Heading','Physicality'],     statMods: { dribbling:+7, agility:+5, balance:+4, heading:-3, physicality:-2 } },
    { id: 'inside_forward', name: 'Inside Forward',icon: '🎯', desc: 'Cuts inside onto his strong foot. Creates and scores.',  strengths: ['Finishing','Dribbling','Long Shots'],  weaknesses: ['Crossing','Heading'],        statMods: { finishing:+5, dribbling:+4, longShots:+4, heading:-3 } },
  ],
  RW: [
    { id: 'runner',         name: 'Runner',        icon: '💨', desc: 'Pure pace. Gets in behind. Beats defenders with speed.',  strengths: ['Pace','Acceleration','Stamina'],       weaknesses: ['Vision','Long Passing'],     statMods: { pace:+7, acceleration:+6, stamina:+3, vision:-2, longPassing:-2 } },
    { id: 'dribbler',       name: 'Dribbler',      icon: '🌀', desc: 'Takes players on. Creates with his feet. Unpredictable.',strengths: ['Dribbling','Agility','Balance'],       weaknesses: ['Heading','Physicality'],     statMods: { dribbling:+7, agility:+5, balance:+4, heading:-3, physicality:-2 } },
    { id: 'inside_forward', name: 'Inside Forward',icon: '🎯', desc: 'Cuts inside onto his strong foot. Creates and scores.',  strengths: ['Finishing','Dribbling','Long Shots'],  weaknesses: ['Crossing','Heading'],        statMods: { finishing:+5, dribbling:+4, longShots:+4, heading:-3 } },
  ],
};

// ── PORTRAIT — DiceBear avataaars (local, no network) ────────────────────────

const PORTRAIT_SKIN = {
  1: ['pale'],
  2: ['light'],
  3: ['tanned'],
  4: ['brown'],
  5: ['darkBrown'],
  6: ['black'],
};

const PORTRAIT_HAIR_TOP = {
  buzz:     ['TheCaesar'],
  fade:     ['Sides'],
  short:    ['ShortFlat'],
  messy:    ['ShortWaved'],
  curly:    ['Curly'],
  long:     ['LongButNotTooLong'],
  afro:     ['Fro'],
  undercut: ['TheCaesarAndSidePart'],
};

const PORTRAIT_HAIR_COLOR = {
  black:      ['black'],
  dark_brown: ['brownDark'],
  brown:      ['brown'],
  blonde:     ['blondeGolden'],
  red:        ['auburn'],
  white:      ['platinum'],
};

const PORTRAIT_EYEBROW = {
  1: ['defaultNatural'],
  2: ['default'],
  3: ['raisedExcitedNatural'],
  4: ['upDown'],
  5: ['flatNatural'],
};

const PORTRAIT_EYES = {
  1: ['default'],
  2: ['squint'],
  3: ['default'],
  4: ['side'],
  5: ['happy'],
};

const PORTRAIT_JERSEY = {
  egypt: ['Red'], brazil: ['PastelYellow'], england: ['White'], france: ['Blue01'],
  spain: ['Red'], argentina: ['Blue02'], portugal: ['Red'], germany: ['White'],
  netherlands: ['PastelOrange'], italy: ['Blue01'], nigeria: ['PastelGreen'],
  senegal: ['White'], ghana: ['Gray01'], morocco: ['Red'], ivory_coast: ['PastelOrange'],
  cameroon: ['PastelGreen'], algeria: ['White'], japan: ['Blue03'],
  south_korea: ['Red'], usa: ['Blue02'], mexico: ['PastelGreen'],
  colombia: ['PastelYellow'], uruguay: ['Blue01'], croatia: ['Red'],
  sweden: ['PastelYellow'], turkey: ['Red'], poland: ['White'],
  serbia: ['Red'], denmark: ['Red'], saudi: ['PastelGreen'],
};

export function renderPortrait(state) {
  const seed = ((state.firstName || '') + (state.lastName || '')).trim() || 'player';

  const avatar = createAvatar(avataaars, {
    seed,
    size:            200,
    backgroundColor: ['1a1f2e'],
    radius:          12,
    skinColor:       PORTRAIT_SKIN[state.skinTone]         || ['tanned'],
    top:             PORTRAIT_HAIR_TOP[state.hairStyle]    || ['ShortFlat'],
    hairColor:       PORTRAIT_HAIR_COLOR[state.hairColor]  || ['black'],
    eyebrow:         PORTRAIT_EYEBROW[state.eyebrowStyle]  || ['default'],
    eyes:            PORTRAIT_EYES[state.facePreset]       || ['default'],
    mouth:           ['default'],
    accessories:     ['blank'],
    facialHair:      ['blank'],
    clotheType:      ['ShirtCrewNeck'],
    clotheColor:     PORTRAIT_JERSEY[state.nationality]    || ['Blue02'],
  });

  return `<div class="portrait-frame">${avatar.toString()}</div>`;
}

export function getPlayerPortraitSVG(small = false) {
  const p   = GameState.player;
  const app = p.appearance || {};

  const avatar = createAvatar(avataaars, {
    seed:            (p.name || 'player').replace(/\s+/g, ''),
    size:            small ? 48 : 120,
    backgroundColor: ['1a1f2e'],
    radius:          small ? 50 : 10,
    skinColor:       PORTRAIT_SKIN[app.skinTone]        || ['tanned'],
    top:             PORTRAIT_HAIR_TOP[app.hairStyle]   || ['ShortFlat'],
    hairColor:       PORTRAIT_HAIR_COLOR[app.hairColor] || ['black'],
    eyebrow:         PORTRAIT_EYEBROW[app.eyebrowStyle] || ['default'],
    eyes:            PORTRAIT_EYES[app.facePreset]      || ['default'],
    mouth:           ['default'],
    accessories:     ['blank'],
    facialHair:      ['blank'],
    clotheType:      ['ShirtCrewNeck'],
    clotheColor:     PORTRAIT_JERSEY[p.nationality]     || ['Blue02'],
  });

  return avatar.toString();
}

export function renderCreatorCard(state) {
  const nation = NATIONS.find(n => n.id === state.nationality);
  const name = [state.firstName, state.lastName].filter(Boolean).join(' ') || '—';
  const flagImg = nation ? `<img src="https://flagcdn.com/w40/${nation.code}.png" class="cc-flag-img" alt=""/>` : '';
  const arch = ARCHETYPES[state.position]?.find(a => a.id === state.archetype);
  const ovr  = (state.position && state.archetype)
    ? calcOverallFromStats(buildStatsPreview(state), state.position)
    : '—';

  return `<div class="creator-card">
  <div class="cc-ovr">${ovr}</div>
  <div class="cc-name">${name}</div>
  <div class="cc-meta">${flagImg}<span class="cc-pos">${state.position || '—'}</span><span class="cc-age">Age 16</span></div>
  ${arch ? `<div class="cc-arch">${arch.name}</div>` : ''}
  ${state.height ? `<div class="cc-physical">${state.height}cm · ${state.weight}kg</div>` : ''}
</div>`;
}

function buildStatsPreview(state) {
  const base = { pace:54, acceleration:53, finishing:52, dribbling:52, agility:51,
                 shortPassing:51, longPassing:48, vision:50, physicality:51, stamina:52,
                 heading:48, ballControl:51, composure:50, positioning:50, balance:50 };
  const arch = ARCHETYPES[state.position]?.find(a => a.id === state.archetype);
  if (arch?.statMods) {
    for (const [k, v] of Object.entries(arch.statMods)) {
      base[k] = Math.max(42, Math.min(72, (base[k] || 50) + v));
    }
  }
  return base;
}

export function calcOverallFromStats(stats, pos) {
  const weights = {
    ST:  { finishing:.18, pace:.14, dribbling:.12, physicality:.1, composure:.1, vision:.08, heading:.08, stamina:.08, shortPassing:.06, agility:.06 },
    CAM: { vision:.18, shortPassing:.16, dribbling:.12, composure:.1, ballControl:.1, longPassing:.1, finishing:.08, agility:.08, stamina:.08 },
    LW:  { pace:.16, dribbling:.16, acceleration:.12, agility:.1, finishing:.1, vision:.08, stamina:.1, balance:.08, shortPassing:.1 },
    RW:  { pace:.16, dribbling:.16, acceleration:.12, agility:.1, finishing:.1, vision:.08, stamina:.1, balance:.08, shortPassing:.1 },
  };
  const w = weights[pos] || weights.ST;
  return Math.round(Object.entries(w).reduce((s, [k, wt]) => s + (stats[k] || 50) * wt, 0));
}

// ── CREATION (replaced by new step-based creator in controller.js) ─────────────

export function creationScreen() { return ''; }
export function statCardScreen()  { return ''; }

// ── CLUB OFFERS DATA ─────────────────────────────────────────────────────────

const CLUB_OFFERS = {
  elite: [
    { name: 'Arsenal Academy',    badge: '🔴', league: 'Premier League Academy' },
    { name: 'Chelsea Academy',    badge: '💙', league: 'Premier League Academy' },
    { name: 'Real Madrid Academy',badge: '⚪', league: 'La Liga Academy' },
    { name: 'Barcelona Academy',  badge: '🔵', league: 'La Liga Academy' },
  ],
  high: [
    { name: 'Everton Academy',       badge: '🔵', league: 'Premier League Academy' },
    { name: 'West Ham Academy',      badge: '🔵', league: 'Premier League Academy' },
    { name: 'Wolves Academy',        badge: '🟡', league: 'Premier League Academy' },
    { name: 'Fulham Academy',        badge: '⬛', league: 'Premier League Academy' },
    { name: 'Southampton Academy',   badge: '🔴', league: 'Premier League Academy' },
    { name: 'Nottm Forest Academy',  badge: '🔴', league: 'Premier League Academy' },
  ],
  local: {
    egypt:        [{ name: 'Zamalek Academy', badge: '⬜', league: 'Egyptian Premier League' }, { name: 'Al Ahly Academy', badge: '🔴', league: 'Egyptian Premier League' }],
    nigeria:      [{ name: 'Enyimba Academy', badge: '🔴', league: 'NPFL' }, { name: 'Rangers FC Academy', badge: '🟢', league: 'NPFL' }],
    england:      [{ name: 'Stoke City Academy', badge: '🔴', league: 'Championship' }, { name: 'Sheffield Wednesday Academy', badge: '🔵', league: 'Championship' }],
    brazil:       [{ name: 'Flamengo Academy', badge: '🔴', league: 'Brasileirão' }, { name: 'Grêmio Academy', badge: '🔵', league: 'Brasileirão' }],
    france:       [{ name: 'Lens Academy', badge: '🟡', league: 'Ligue 2' }, { name: 'Auxerre Academy', badge: '🔵', league: 'Ligue 2' }],
    spain:        [{ name: 'Málaga Academy', badge: '🔵', league: 'Segunda División' }, { name: 'Levante Academy', badge: '🔵', league: 'Segunda División' }],
    germany:      [{ name: 'Karlsruher SC Academy', badge: '🔵', league: '2. Bundesliga' }, { name: 'Kaiserslautern Academy', badge: '🔴', league: '2. Bundesliga' }],
    portugal:     [{ name: 'Vitória SC Academy', badge: '⬛', league: 'Primeira Liga' }, { name: 'Boavista Academy', badge: '⬛', league: 'Primeira Liga' }],
    argentina:    [{ name: 'San Lorenzo Academy', badge: '🔵', league: 'Primera División' }, { name: 'Racing Club Academy', badge: '🔵', league: 'Primera División' }],
    netherlands:  [{ name: 'FC Utrecht Academy', badge: '🔴', league: 'Eredivisie' }, { name: 'Heracles Academy', badge: '⬛', league: 'Eredivisie' }],
    italy:        [{ name: 'Genoa Academy', badge: '🔴', league: 'Serie B' }, { name: 'Palermo Academy', badge: '🌸', league: 'Serie B' }],
    senegal:      [{ name: 'Génération Foot', badge: '🟢', league: 'Ligue 1 Sénégal' }, { name: 'AS Douanes Academy', badge: '🔵', league: 'Ligue 1 Sénégal' }],
    ghana:        [{ name: 'Hearts of Oak Academy', badge: '🔴', league: 'Ghana Premier League' }, { name: 'Asante Kotoko Academy', badge: '🟡', league: 'Ghana Premier League' }],
    morocco:      [{ name: 'Raja Casablanca Academy', badge: '🟢', league: 'Botola Pro' }, { name: 'Wydad Academy', badge: '🔴', league: 'Botola Pro' }],
    ivory_coast:  [{ name: 'ASEC Mimosas Academy', badge: '🟡', league: 'Ligue 1 CI' }, { name: 'Africa Sports Academy', badge: '🟢', league: 'Ligue 1 CI' }],
    cameroon:     [{ name: 'Coton Sport Academy', badge: '⬛', league: 'MTN Elite One' }, { name: 'Eding Sport Academy', badge: '🟢', league: 'MTN Elite One' }],
    algeria:      [{ name: 'USM Alger Academy', badge: '🔴', league: 'Ligue Professionnelle 1' }, { name: 'MC Oran Academy', badge: '🟢', league: 'Ligue Professionnelle 1' }],
    japan:        [{ name: 'Júbilo Iwata Academy', badge: '🔵', league: 'J2 League' }, { name: 'Tokushima Vortis Academy', badge: '🔵', league: 'J2 League' }],
    south_korea:  [{ name: 'Daejeon Citizen Academy', badge: '🟡', league: 'K League 1' }, { name: 'Gangwon FC Academy', badge: '🟠', league: 'K League 1' }],
    usa:          [{ name: 'Columbus Crew Academy', badge: '🟡', league: 'MLS Academy' }, { name: 'FC Cincinnati Academy', badge: '🔵', league: 'MLS Academy' }],
    mexico:       [{ name: 'Cruz Azul Academy', badge: '🔵', league: 'Liga MX' }, { name: 'San Luis Academy', badge: '🔴', league: 'Liga MX' }],
    colombia:     [{ name: 'Junior FC Academy', badge: '🔴', league: 'Categoría Primera A' }, { name: 'Cali Academy', badge: '🟢', league: 'Categoría Primera A' }],
    uruguay:      [{ name: 'Nacional Academy', badge: '🔵', league: 'Primera División' }, { name: 'Defensor Sporting Academy', badge: '🟣', league: 'Primera División' }],
    croatia:      [{ name: 'Hajduk Split Academy', badge: '⬛', league: 'Prva HNL' }, { name: 'Rijeka Academy', badge: '⬛', league: 'Prva HNL' }],
    sweden:       [{ name: 'Malmö FF Academy', badge: '🔵', league: 'Allsvenskan' }, { name: 'AIK Academy', badge: '⬛', league: 'Allsvenskan' }],
    turkey:       [{ name: 'Trabzonspor Academy', badge: '🟤', league: 'Süper Lig' }, { name: 'Bursaspor Academy', badge: '🟢', league: '1. Lig' }],
    poland:       [{ name: 'Lech Poznań Academy', badge: '🔵', league: 'Ekstraklasa' }, { name: 'Cracovia Academy', badge: '🔴', league: 'Ekstraklasa' }],
    serbia:       [{ name: 'Vojvodina Academy', badge: '🔴', league: 'SuperLiga' }, { name: 'Čukarički Academy', badge: '🔴', league: 'SuperLiga' }],
    denmark:      [{ name: 'Randers FC Academy', badge: '🔵', league: 'Superliga' }, { name: 'Viborg FF Academy', badge: '🟢', league: 'Superliga' }],
    saudi:        [{ name: 'Al-Qadsiah Academy', badge: '🟢', league: 'Saudi Pro League' }, { name: 'Al-Fateh Academy', badge: '🟡', league: 'Saudi Pro League' }],
    default:      [{ name: 'Stoke City Academy', badge: '🔴', league: 'Championship' }, { name: 'Barnsley Academy', badge: '🔴', league: 'Championship' }],
  },
  low: [
    { name: 'Hartlepool United Academy', badge: '⬛', league: 'National League' },
    { name: 'Solihull Moors Academy',    badge: '🟡', league: 'National League' },
    { name: 'Altrincham Academy',        badge: '🔴', league: 'National League North' },
    { name: 'Gateshead Academy',         badge: '⬛', league: 'National League' },
  ],
  nonleague: [
    { name: 'Stafford Rangers',   badge: '⬛', league: 'Northern Premier League' },
    { name: 'Nantwich Town',      badge: '🔴', league: 'Northern Premier League' },
    { name: 'Warrington Rylands', badge: '🔵', league: 'Northern Premier League' },
  ],
};

function getOffers(m, p) {
  const rating = m.rating;
  const nat = p.nationality || 'default';
  if (rating >= 9.0) return CLUB_OFFERS.elite;
  if (rating >= 8.0) return CLUB_OFFERS.high.sort(() => Math.random() - 0.5).slice(0, 2);
  if (rating >= 6.0) return CLUB_OFFERS.local[nat] || CLUB_OFFERS.local.default;
  if (rating >= 4.0) return CLUB_OFFERS.low.sort(() => Math.random() - 0.5).slice(0, 2);
  return CLUB_OFFERS.nonleague.sort(() => Math.random() - 0.5).slice(0, 2);
}

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

function getDiveNarrative(outcome, roll) {
  if (outcome === 'PENALTY') {
    return [
      "The referee doesn't hesitate. Down you go, point to the spot.",
      "Perfect execution. The contact was minimal but the sell was immaculate.",
      "He points to the spot. You don't celebrate — you stay in character.",
    ][Math.floor(Math.random() * 3)];
  }
  if (outcome === 'PLAY_ON') {
    return [
      "He saw it. He doesn't care. Play on.",
      "Contact wasn't enough. You're back on your feet.",
      "The referee waves it away. At least nobody booked you.",
    ][Math.floor(Math.random() * 3)];
  }
  return [
    "The yellow card comes out before you're back on your feet.",
    "He had a perfect view. He is not impressed.",
    "A theatrical performance. The referee gives you a standing ovation. In the form of a yellow card.",
  ][Math.floor(Math.random() * 3)];
}

export function outcomeScreen(result, narrativeText) {
  const { success, isNat20, isNat1, playerRoll, oppRoll, choice } = result;
  const m = GameState.match;
  const { label: rLabel, color: rColor } = RatingEngine.band(m.rating);

  // Two-step dive result display
  if (result.isDiveResult) {
    const step1Class = (result.diveOutcome === 'DIVE_CAUGHT' && !result.step2Roll) ? 'fail' : 'success';
    const step2Class = result.diveOutcome === 'PENALTY' ? 'success' : 'fail';
    return `
<div class="screen outcome-screen animate__animated animate__fadeIn">
  <div class="outcome-header">
    <div class="dice-step-label">FOUL SELLING ROLL</div>
    <div class="dice-result-mini ${step1Class}">
      d20: ${result.playerRoll.dice}
      ${result.isNat20 ? '— NATURAL 20 🎲' : result.isNat1 ? '— NATURAL 1 💀' : ''}
    </div>
    ${result.step2Roll !== null ? `
      <div class="dice-step-label" style="margin-top:10px">REFEREE DECISION</div>
      <div class="dice-result-mini ${step2Class}">
        d20: ${result.step2Roll}
        ${result.step2Roll >= 16 ? '— PENALTY 📋' : result.step2Roll >= 8 ? '— PLAY ON' : '— CAUGHT 🟨'}
      </div>
    ` : ''}
  </div>
  <div class="outcome-result ${result.diveOutcome === 'PENALTY' ? 'success' : 'failure'}">
    ${result.diveOutcome === 'PENALTY' ? '📋 PENALTY' : result.diveOutcome === 'PLAY_ON' ? 'PLAY ON' : '🟨 CAUGHT DIVING'}
  </div>
  <div class="outcome-narrative">${getDiveNarrative(result.diveOutcome, result.playerRoll.dice)}</div>
  <div class="outcome-rating">
    Rating: <span style="color:${rColor}">${m.rating.toFixed(1)} — ${rLabel}</span>
  </div>
  <button class="cta-btn" id="continue-btn">Continue →</button>
</div>`;
  }

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

// ── SOCIAL FEED ───────────────────────────────────────────────────────────────

function generateSocialFeed(m, p) {
  const name = p.name || 'The Kid';
  const nat = p.nationality || '';
  const rating = m.rating;
  const goals = m.goals || 0;
  const assists = m.assists || 0;
  const sentOff = m.sentOff || false;
  const result = m.score.us > m.score.them ? 'win' :
                 m.score.us < m.score.them ? 'loss' : 'draw';
  const scoreStr = `${m.score.us}-${m.score.them}`;
  const ego = m.egoChoicesMade || 0;

  // ── OFFICIAL ────────────────────────────────────────────────────────────────
  const officialPosts = [];
  if (goals >= 3) {
    officialPosts.push({ source: 'AcademyWatch Report', handle: '@AcademyWatchHQ', verified: true,
      text: `HAT-TRICK ALERT 🚨 ${name} bags THREE in the academy finals today. At ${p.position}, the youngster showed composure beyond their years. Full match report ↓`, time: 'Match Report' });
  }
  if (goals >= 2 && goals < 3) {
    officialPosts.push({ source: 'Youth Football Daily', handle: '@YouthFBDaily', verified: true,
      text: `BRACE: ${name} scores twice in today's U18 national finals (${scoreStr}). The ${nat} forward looks every inch a professional prospect. 📊 Rating: ${rating.toFixed(1)}`, time: 'Match Report' });
  }
  if (goals === 1 && assists >= 1) {
    officialPosts.push({ source: 'Academy Scout Network', handle: '@AcademyScoutNet', verified: true,
      text: `Goal and assist from ${name} today. The ${nat} youngster was directly involved in ${goals + assists} of the team's attacks. One to watch. 👀`, time: 'Match Report' });
  }
  if (sentOff) {
    officialPosts.push({ source: 'Academy Watch Report', handle: '@AcademyWatchHQ', verified: true,
      text: `SENT OFF: ${name} was shown a red card in today's U18 finals. The incident overshadowed what had been an otherwise ${rating >= 6.5 ? 'impressive' : 'mixed'} performance. Disciplinary review expected.`, time: 'Match Report' });
  }
  if (rating >= 8.5 && goals === 0) {
    officialPosts.push({ source: 'Youth Football Daily', handle: '@YouthFBDaily', verified: true,
      text: `No goals but ${name} was arguably the best player on the pitch today. Movement, creativity, decision-making — this is a player coaches dream about. Rating: ${rating.toFixed(1)} 🌟`, time: 'Match Report' });
  }
  if (result === 'loss' && rating >= 7.0) {
    officialPosts.push({ source: 'Academy Scout Network', handle: '@AcademyScoutNet', verified: true,
      text: `Defeat for the team but ${name} gave everything. In a losing side, a ${rating.toFixed(1)} rating tells its own story. Someone will be watching that tape tonight.`, time: 'Match Report' });
  }
  officialPosts.push({ source: 'Academy Watch Report', handle: '@AcademyWatchHQ', verified: true,
    text: `Full-time: ${scoreStr}. ${name} finishes with a ${rating.toFixed(1)} match rating. ${rating >= 7.0 ? 'A performance that will have scouts talking.' : rating >= 6.0 ? 'Showed flashes. Needs consistency.' : 'Tough day. The academy road is long.'}`, time: 'Match Report' });

  // ── BYSTANDER ───────────────────────────────────────────────────────────────
  const bystanderPosts = [];
  const handles = ['@lil_scout_99','@futbol_obsessed','@academyrat_uk','@youthwatcher','@grassrootsguy','@scouting_from_home'];
  const handle = handles[Math.floor(Math.random() * handles.length)];
  if (goals >= 3) {
    bystanderPosts.push({ source: 'Fan Post', handle, verified: false,
      text: `BROOO ${name} just scored a hatrick at the U18 nationals 😭😭 i was there live. the third one was UNREAL. someone sign this kid NOW`, time: `${m.minute - 5}'` });
  }
  if (sentOff) {
    bystanderPosts.push({ source: 'Fan Post', handle, verified: false,
      text: `ngl ${name} getting a red card today was completely avoidable. was having a decent game too. temper will cost this kid their career if they don't sort it`, time: `${m.minute}'` });
  }
  if (ego >= 3 && goals >= 1) {
    bystanderPosts.push({ source: 'Fan Post', handle, verified: false,
      text: `${name} today was just different 🤤 the audacity of some of those decisions man. chip the keeper?? at 16?? we don't deserve this kid`, time: `${Math.floor(Math.random() * 30 + 60)}'` });
  }
  if (rating < 5.0) {
    bystanderPosts.push({ source: 'Fan Post', handle, verified: false,
      text: `rough watch from ${name} today if im being honest. doesn't mean anything at this age but they'll need to have a serious look at themselves in training this week`, time: 'Post-match' });
  }
  if (result === 'win' && goals === 0 && assists === 0 && rating >= 6.5) {
    bystanderPosts.push({ source: 'Fan Post', handle, verified: false,
      text: `${name} didn't get on the scoresheet today but their movement was causing problems all game. no stats but you could just SEE the quality`, time: 'Post-match' });
  }
  bystanderPosts.push({ source: 'Fan Post', handle, verified: false,
    text: rating >= 7.0
      ? `was at the nationals today — ${name} looked different from everyone else on that pitch. just something about the way they move`
      : `${name} had moments today. wasn't the complete performance but you can see what's there. development takes time`, time: 'Post-match' });

  // ── RUMOUR ──────────────────────────────────────────────────────────────────
  const rumourPosts = [];
  if (goals >= 2 || rating >= 8.5) {
    rumourPosts.push({ source: '🔥 Transfer Whispers', handle: '@TransferWhispers_', verified: false,
      text: `🚨 EXCL: Multiple Premier League academies have already requested footage of ${name} from today's national finals. Nothing concrete yet but the interest is REAL. 👀 #AcademyTransfer`, time: 'Breaking' });
  }
  if (sentOff) {
    rumourPosts.push({ source: '🔥 Transfer Whispers', handle: '@TransferWhispers_', verified: false,
      text: `SOURCES: The red card incident involving ${name} today is already being discussed in academy circles. Some clubs reportedly cooled interest — others see the fire as a plus. Character assessment ongoing 👀`, time: 'Breaking' });
  }
  if (rating >= 7.0 && rating < 8.5) {
    rumourPosts.push({ source: '🔥 Transfer Whispers', handle: '@TransferWhispers_', verified: false,
      text: `Hearing that ${name}'s performance today has landed on the desk of at least two Championship academy directors. Not a done deal. But conversations are happening. 🤫`, time: 'Rumour' });
  }
  if (rating < 5.5) {
    rumourPosts.push({ source: '🔥 Transfer Whispers', handle: '@TransferWhispers_', verified: false,
      text: `${name} had a tough one today. No shame in it — every legend had a bad game at academy level. The real test is what happens next in training. #development`, time: 'Opinion' });
  }
  rumourPosts.push({ source: '🔥 Transfer Whispers', handle: '@TransferWhispers_', verified: false,
    text: goals >= 1
      ? `The goal${goals > 1 ? 's' : ''} from ${name} today will be in every scout's inbox by tomorrow morning. Academy football moves fast. 🚀`
      : `${name} — name to remember or flash in the pan? Today's performance will have people forming very different opinions. The journey starts here.`, time: 'Opinion' });

  return [officialPosts[0], bystanderPosts[0], rumourPosts[0]];
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
  const offers = getOffers(m, p);
  const offersTitle = m.rating >= 9.0 ? 'ELITE CLUBS ARE WATCHING' :
                      m.rating >= 8.0 ? 'INTEREST FROM PROFESSIONAL CLUBS' :
                      m.rating >= 6.0 ? 'LOCAL CLUBS HAVE MADE CONTACT' :
                      m.rating >= 4.0 ? 'LOWER LEAGUE INTEREST' :
                                        'NON-LEAGUE OFFERS';
  const socialPosts = generateSocialFeed(m, p);

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

  <div class="pm-offers">
    <div class="pm-offers-label">${offersTitle}</div>
    ${offers.map(o => `
      <div class="pm-offer-card">
        <div class="pm-offer-badge">${o.badge}</div>
        <div class="pm-offer-info">
          <div class="pm-offer-name">${o.name}</div>
          <div class="pm-offer-league">${o.league}</div>
        </div>
        <div class="pm-offer-action">VIEW OFFER →</div>
      </div>
    `).join('')}
  </div>

  <div class="pm-social-feed">
    <div class="pm-social-label">SOCIAL FEED</div>
    ${socialPosts.map(post => `
      <div class="pm-post">
        <div class="pm-post-header">
          <div class="pm-post-avatar">${post.verified ? '🔵' : '💬'}</div>
          <div class="pm-post-meta">
            <div class="pm-post-source">${post.source} ${post.verified ? '✓' : ''}</div>
            <div class="pm-post-handle">${post.handle}</div>
          </div>
          <div class="pm-post-time">${post.time}</div>
        </div>
        <div class="pm-post-text">${post.text}</div>
      </div>
    `).join('')}
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
