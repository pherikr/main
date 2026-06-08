// Main game controller — wires all screens and engines together

import { GameState } from '../engine/GameState.js';
import { PROFILES } from '../data/profiles.js';
import { WEAPONS } from '../data/weapons.js';
import { EventEngine } from '../engine/EventEngine.js';
import { MatchEngine } from '../engine/MatchEngine.js';
import { RatingEngine } from '../engine/RatingEngine.js';
import { CELEBRATIONS, OPPOSITION_EVENTS } from '../data/events_flavor.js';
import {
  creationScreen, statCardScreen, matchHUD, matchFeedPanel,
  eventScreen, outcomeScreen, weaponDiscoveryScreen, postMatchScreen, debugPanel,
} from './screens.js';

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

// ── CREATION ─────────────────────────────────────────────────────────────────

function showCreation() {
  app.innerHTML = creationScreen();
  const btn = document.getElementById('create-player-btn');

  // Selection state
  const sel = { name: '', nation: '', position: '', profile: '', weapon: '' };

  document.getElementById('player-name').addEventListener('input', e => {
    sel.name = e.target.value.trim();
    validate();
  });

  document.getElementById('nation-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-nation]');
    if (!b) return;
    sel.nation = b.dataset.nation;
    document.querySelectorAll('.flag-btn').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    validate();
  });

  document.getElementById('position-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-position]');
    if (!b) return;
    sel.position = b.dataset.position;
    document.querySelectorAll('[data-position]').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    validate();
  });

  document.getElementById('profile-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-profile]');
    if (!b) return;
    sel.profile = b.dataset.profile;
    document.querySelectorAll('[data-profile]').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    validate();
  });

  document.getElementById('weapon-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-weapon]');
    if (!b) return;
    sel.weapon = b.dataset.weapon;
    document.querySelectorAll('[data-weapon]').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    validate();
  });

  function validate() {
    btn.disabled = !(sel.name && sel.nation && sel.position && sel.profile && sel.weapon);
  }

  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    buildPlayer(sel);
    showStatCard();
  });
}

function buildPlayer(sel) {
  const profile = PROFILES.find(p => p.id === sel.profile);
  const stats = {};
  for (const [stat, [min, max]] of Object.entries(profile.stats)) {
    stats[stat] = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  // overall = avg of primary stats
  const primary = ['pace','dribbling','finishing','passing','physicality','heading'];
  const overall = Math.round(primary.reduce((s, k) => s + (stats[k] || 50), 0) / primary.length);

  GameState.player = {
    name: sel.name,
    nationality: sel.nation,
    position: sel.position,
    profile: sel.profile,
    weapon: sel.weapon,
    stats,
    overall,
  };

  // Seed match confidence from player stats
  GameState.match.confidence = stats.confidence || 50;
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────

function showStatCard() {
  app.innerHTML = statCardScreen();
  document.getElementById('start-match-btn').addEventListener('click', () => {
    startMatch();
  });
}

// ── MATCH ─────────────────────────────────────────────────────────────────────

function startMatch() {
  GameState.match.minute = 0;
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
    refreshFeed();
    refreshHUD();
    matchTimer = setTimeout(runMatchTick, 1200);
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

  document.getElementById('play-again-btn').addEventListener('click', () => startGame());
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
