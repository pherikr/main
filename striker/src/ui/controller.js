// Main game controller — wires all screens and engines together

import { GameState } from '../engine/GameState.js';
import { PROFILES } from '../data/profiles.js';
import { WEAPONS } from '../data/weapons.js';
import { EventEngine } from '../engine/EventEngine.js';
import { MatchEngine } from '../engine/MatchEngine.js';
import { RatingEngine } from '../engine/RatingEngine.js';
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

  document.getElementById('wr-toggle').addEventListener('click', e => {
    const b = e.target.closest('[data-wr]');
    if (!b) return;
    const m = GameState.match;
    if (b.dataset.wr === 'high' && m.stamina < 19) return;
    m.workRate = b.dataset.wr;
    refreshHUD();
  });

  document.getElementById('men-toggle').addEventListener('click', e => {
    const b = e.target.closest('[data-men]');
    if (!b) return;
    GameState.match.mentality = b.dataset.men;
    refreshHUD();
  });

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

  // Advance 3 minutes per tick
  const tickMinutes = 3;
  m.minute = Math.min(90, m.minute + tickMinutes);
  MatchEngine.drainStaminaPassive(tickMinutes);

  // Force late drama at 82'
  if (m.minute >= 82 && !a6Scheduled && (m.score.us <= m.score.them)) {
    a6Scheduled = true;
    triggerEvent(EventEngine.getEvent('A6'));
    return;
  }

  const { playerInvolved, eventDef, feedEntries } = MatchEngine.tick(m.minute);

  feedEntries.forEach(e => m.feed.push(e));
  refreshFeed();
  refreshHUD();
  refreshDebug();

  if (playerInvolved && eventDef) {
    clearTimeout(matchTimer);
    // Brief pause then show event
    matchTimer = setTimeout(() => triggerEvent(eventDef), 600);
  } else {
    // Continue after ~1.2s per minute
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

  // Reset cascade depth if going back to feed
  if (isTerminal(next)) {
    const entries = MatchEngine.resolveTerminal(next, m.minute);
    entries.forEach(e => m.feed.push(e));
    m.cascadeDepth = 0;
    m.cascadeBonus = false;
    returnToMatch();
  } else {
    // Cascade to next event
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
  app.innerHTML = `<div id="match-wrapper">${weaponDiscoveryScreen(weapon)}</div>`;
  document.getElementById('wd-continue-btn').addEventListener('click', () => handleContinue(result));
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
  const cascadeIds = ['A1','A2','A2_KEEPER','A2_HALF','A3','A4','A5','A6','D1','SP1','SP2','C1','C2'];
  return !cascadeIds.includes(nextId);
}
