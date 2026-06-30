'use strict';

/* ════════════════════════════════════════════════════════════
   TODDLER ARCADE — script.js

   HOW TO ADD A NEW GAME
   ─────────────────────
   1. Add a <div id="screen-GAMENAME" class="screen"> in index.html
   2. Add a .game-card button with data-game="GAMENAME" on the home screen
   3. Add a case in startGame() that calls initMyGame()
   4. Add a case in stopCurrentGame() that calls stopMyGame()
   5. Implement initMyGame() and stopMyGame() following the same
      pattern as the three games below.
   ════════════════════════════════════════════════════════════ */


/* ────────────────────────────────────────────────────────────
   AUDIO ENGINE
   All sounds are synthesised with Web Audio API — no files.
   ──────────────────────────────────────────────────────────── */
let AC = null;  // AudioContext, created on first user gesture
let muted = false;

function audio() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}

/* Quick one-shot: ramp frequency down = satisfying "thwop" */
function sfxPop() {
  if (muted) return;
  const ac = audio(), t = ac.currentTime;
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(500 + Math.random() * 300, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(g); g.connect(ac.destination);
  osc.start(t); osc.stop(t + 0.2);
}

/* Rising three-note "yum!" ding */
function sfxYum() {
  if (muted) return;
  const ac = audio(), t = ac.currentTime;
  [523, 659, 784].forEach((f, i) => {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const start = t + i * 0.11;
    g.gain.setValueAtTime(0.22, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
    osc.connect(g); g.connect(ac.destination);
    osc.start(start); osc.stop(start + 0.3);
  });
}

/* Short white-noise scrub */
function sfxScrub() {
  if (muted) return;
  const ac = audio();
  const len = Math.round(ac.sampleRate * 0.07);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.12;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain(); g.gain.value = 0.5;
  src.connect(g); g.connect(ac.destination);
  src.start();
}

/* Double honk */
function sfxHonk() {
  if (muted) return;
  const ac = audio(), t = ac.currentTime;
  [0, 0.22].forEach(delay => {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t + delay);
    osc.frequency.setValueAtTime(240, t + delay + 0.09);
    g.gain.setValueAtTime(0.28, t + delay);
    g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.18);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t + delay); osc.stop(t + delay + 0.2);
  });
}

/* Happy 5-note win fanfare */
function sfxWin() {
  if (muted) return;
  const ac = audio(), t = ac.currentTime;
  [523, 659, 784, 1047, 1319].forEach((f, i) => {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'square';
    osc.frequency.value = f;
    const start = t + i * 0.13;
    g.gain.setValueAtTime(0.14, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    osc.connect(g); g.connect(ac.destination);
    osc.start(start); osc.stop(start + 0.28);
  });
}


/* ────────────────────────────────────────────────────────────
   PARTICLE HELPERS  (sparkles + confetti)
   ──────────────────────────────────────────────────────────── */
const particleLayer = document.getElementById('particles');

function sparkles(x, y, count = 10, palette = null) {
  const colors = palette || ['#FFD700','#FF6B6B','#6BCB77','#4D96FF','#FF6FC8','#C77DFF','#FF9A3C'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    const angle = (i / count) * Math.PI * 2;
    const dist  = 40 + Math.random() * 50;
    el.style.cssText = `
      left:${x}px; top:${y}px;
      width:${7 + Math.random() * 9}px;
      height:${7 + Math.random() * 9}px;
      background:${colors[i % colors.length]};
      --tx:${Math.cos(angle)*dist}px;
      --ty:${Math.sin(angle)*dist}px;
    `;
    particleLayer.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
}

function confettiBurst(x, y, count = 70) {
  const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF6FC8','#C77DFF','#FF9A3C','#1abc9c'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    const isCircle = Math.random() > 0.5;
    const size = 7 + Math.random() * 9;
    el.style.cssText = `
      left:${x - size/2 + (Math.random()-0.5)*120}px;
      top:${y}px;
      width:${size}px; height:${isCircle ? size : size*0.5}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${1.2 + Math.random()*1}s;
      animation-delay:${Math.random()*0.2}s;
      --r:${isCircle ? '50%' : '2px'};
      --spin:${(Math.random()-0.5)*720}deg;
    `;
    particleLayer.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}


/* ────────────────────────────────────────────────────────────
   SCREEN MANAGER
   ──────────────────────────────────────────────────────────── */
let currentGame = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function startGame(name) {
  audio(); // unlock AudioContext on first gesture
  stopCurrentGame();
  currentGame = name;
  showScreen(name);
  if (name === 'balloons') initBalloons();
  if (name === 'dino')     initDino();
  if (name === 'carwash')  initCarwash();
}

function stopCurrentGame() {
  if (currentGame === 'balloons') stopBalloons();
  if (currentGame === 'dino')     stopDino();
  if (currentGame === 'carwash')  stopCarwash();
}

function goHome() {
  stopCurrentGame();
  currentGame = null;
  showScreen('home');
}

// Home-screen card clicks
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('pointerdown', () => startGame(card.dataset.game));
});

// Mute toggle
const muteBtn = document.getElementById('mute-btn');
muteBtn.addEventListener('pointerdown', () => {
  muted = !muted;
  muteBtn.textContent = muted ? '🔇' : '🔊';
});

// Block context menu & scroll everywhere
document.addEventListener('contextmenu', e => e.preventDefault());


/* ════════════════════════════════════════════════════════════
   GAME 1 — POP THE BALLOONS
   ════════════════════════════════════════════════════════════ */
const BALLOON_COLORS = [
  '#FF6B6B','#FFD93D','#6BCB77','#4D96FF',
  '#FF6FC8','#C77DFF','#FF9A3C','#4ECDC4','#fff176',
];

let bField, bInterval;

function initBalloons() {
  bField = document.getElementById('balloon-field');
  bField.innerHTML = '';
  // Stagger 4 initial balloons, then spawn on interval
  for (let i = 0; i < 8; i++) setTimeout(spawnBalloon, i * 250);
  bInterval = setInterval(spawnBalloon, 800);
}

function stopBalloons() {
  clearInterval(bInterval);
  if (bField) bField.innerHTML = '';
}

function spawnBalloon() {
  if (!bField || currentGame !== 'balloons') return;

  const isGiant  = Math.random() < 0.1;
  const size     = isGiant ? 130 + Math.random()*30 : 50 + Math.random()*65;
  const color    = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
  const xPct     = 4 + Math.random() * 86;            // horizontal start %
  const duration = 14 + Math.random() * 8;            // seconds to cross screen
  // Random horizontal drift at 4 keypoints
  const drift    = () => (Math.random()-0.5) * 60;

  const el = document.createElement('div');
  el.className = 'balloon';
  el.style.cssText = `
    left:${xPct}%;
    animation-duration:${duration}s;
    --dist: calc(-100vh - ${size*1.7}px);
    --dx1:${drift()}px; --dx2:${drift()}px;
    --dx3:${drift()}px; --dx4:${drift()}px;
  `;
  el.innerHTML = `
    <div class="balloon-body" style="width:${size}px;height:${size*1.18}px;background:${color}">
      <div class="balloon-shine"></div>
    </div>
    <div class="balloon-string" style="height:${size*0.55}px"></div>
  `;

  el.addEventListener('pointerdown', e => {
    e.stopPropagation();
    if (el.classList.contains('popped')) return;
    el.classList.add('popped');
    sfxPop();
    const r = el.getBoundingClientRect();
    sparkles(r.left + r.width/2, r.top + r.height/2, 12, [color,'#fff','#FFD700']);
    setTimeout(() => el.remove(), 250);
  });

  bField.appendChild(el);
  // Auto-remove if it floats off-screen unpopped
  setTimeout(() => el.remove(), (duration + 1) * 1000);
}


/* ════════════════════════════════════════════════════════════
   GAME 2 — FEED THE DINO
   ════════════════════════════════════════════════════════════ */
const FRUITS = ['🍎','🍌','🍓','🍉','🍊','🍇','🍑','🍒','🍍','🥝'];

let dWrap, dFruitField, dFruitInterval, dActiveFruits, dDrag;

function initDino() {
  dWrap        = document.getElementById('dino-wrap');
  dFruitField  = document.getElementById('fruit-field');
  dWrap.innerHTML = '';
  dFruitField.innerHTML = '';
  dActiveFruits = [];
  dDrag = null;

  // Build SVG dino
  dWrap.innerHTML = buildDinoSVG();

  // Give layout a frame, then start spawning fruit
  requestAnimationFrame(() => {
    for (let i = 0; i < 5; i++) setTimeout(spawnFruit, i * 200);
    dFruitInterval = setInterval(() => {
      if (dActiveFruits.length < 7) spawnFruit();
    }, 1800);
  });
}

function stopDino() {
  clearInterval(dFruitInterval);
  if (dFruitField) dFruitField.innerHTML = '';
  if (dWrap) dWrap.innerHTML = '';
  dActiveFruits = [];
  dDrag = null;
}

/* Front-facing friendly dinosaur drawn in inline SVG */
function buildDinoSVG() {
  const S = Math.min(window.innerWidth, window.innerHeight);
  const w = Math.round(S * 0.30);
  const h = Math.round(w * 1.2);
  // Chibi dino: giant head, huge open mouth = obvious drop target
  return `<svg viewBox="0 0 200 240" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <!-- Spines on top of head -->
    <polygon points="100,4 93,28 107,28"   fill="#2e7d32"/>
    <polygon points="76,10 68,33 82,33"    fill="#388e3c"/>
    <polygon points="124,10 118,33 132,33" fill="#388e3c"/>
    <!-- BIG round head — dominates the design -->
    <circle cx="100" cy="100" r="88" fill="#4caf50"/>
    <!-- Subtle highlight on head -->
    <ellipse cx="72" cy="62" rx="28" ry="18" fill="rgba(255,255,255,0.10)"/>
    <!-- Spots -->
    <circle cx="38"  cy="95" r=" 9" fill="#388e3c" opacity=".4"/>
    <circle cx="162" cy="90" r=" 8" fill="#388e3c" opacity=".4"/>
    <!-- Eyes — large and expressive -->
    <circle cx="68"  cy="76" r="24" fill="white"/>
    <circle cx="132" cy="76" r="24" fill="white"/>
    <circle cx="70"  cy="76" r="15" fill="#1976d2"/>
    <circle cx="134" cy="76" r="15" fill="#1976d2"/>
    <circle cx="72"  cy="76" r=" 9" fill="#111"/>
    <circle cx="136" cy="76" r=" 9" fill="#111"/>
    <circle cx="75"  cy="72" r=" 4" fill="white"/>
    <circle cx="139" cy="72" r=" 4" fill="white"/>
    <!-- Happy eyebrows -->
    <path d="M 50 56 Q 68 44 86 56"   fill="none" stroke="#2e7d32" stroke-width="5" stroke-linecap="round"/>
    <path d="M 114 56 Q 132 44 150 56" fill="none" stroke="#2e7d32" stroke-width="5" stroke-linecap="round"/>
    <!-- Nostrils -->
    <ellipse cx="89"  cy="105" rx="6" ry="5" fill="#388e3c"/>
    <ellipse cx="111" cy="105" rx="6" ry="5" fill="#388e3c"/>
    <!-- HUGE MOUTH — the drop target. Big dark red opening. -->
    <path d="M 28 118 Q 100 195 172 118 Z" fill="#b71c1c"/>
    <!-- Tongue -->
    <ellipse cx="100" cy="158" rx="38" ry="20" fill="#f06292"/>
    <!-- Top teeth row -->
    <rect x="42"  y="116" width="16" height="22" rx="6" fill="white"/>
    <rect x="63"  y="113" width="16" height="25" rx="6" fill="white"/>
    <rect x="84"  y="112" width="16" height="26" rx="6" fill="white"/>
    <rect x="105" y="112" width="16" height="26" rx="6" fill="white"/>
    <rect x="126" y="113" width="16" height="25" rx="6" fill="white"/>
    <rect x="147" y="116" width="14" height="22" rx="6" fill="white"/>
    <!-- Small body below head -->
    <ellipse cx="100" cy="218" rx="46" ry="30" fill="#4caf50"/>
    <!-- Belly -->
    <ellipse cx="100" cy="222" rx="30" ry="20" fill="#a5d6a7"/>
    <!-- Little arms -->
    <ellipse cx="56"  cy="210" rx="20" ry="11" fill="#388e3c" transform="rotate(-30,56,210)"/>
    <ellipse cx="144" cy="210" rx="20" ry="11" fill="#388e3c" transform="rotate(30,144,210)"/>
  </svg>`;
}

/* Mouth hit position in screen coords — recalculated when needed */
function getMouthTarget() {
  const wrap = document.getElementById('dino-wrap');
  if (!wrap) return null;
  const r = wrap.getBoundingClientRect();
  // Mouth centre: ~50% x, ~62% y in the new chibi SVG (240px tall, mouth at y≈155)
  return {
    x: r.left + r.width  * 0.50,
    y: r.top  + r.height * 0.62,
    radius: Math.max(r.width * 0.46, 80),   // generous hit target
  };
}

function spawnFruit() {
  if (currentGame !== 'dino' || !dFruitField) return;
  const emoji = FRUITS[Math.floor(Math.random() * FRUITS.length)];

  // Place fruit away from center (where dino is)
  const W = window.innerWidth, H = window.innerHeight;
  const cx = W/2, cy = H/2;
  let x, y, attempts = 0;
  do {
    const angle = Math.random() * Math.PI * 2;
    const r = W * 0.28 + Math.random() * Math.min(W, H) * 0.20;
    x = cx + Math.cos(angle) * r;
    y = cy + Math.sin(angle) * r;
    attempts++;
  } while ((Math.abs(x-cx) < 100 || Math.abs(y-cy) < 90) && attempts < 12);

  // Clamp to viewport
  x = Math.max(20, Math.min(W - 80, x));
  y = Math.max(80, Math.min(H - 80, y));

  const el = document.createElement('div');
  el.className = 'fruit';
  el.textContent = emoji;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';

  /* ── Pointer-based drag ──
     During drag the fruit is reparented to document.body with position:fixed
     so it always renders above the dino regardless of stacking contexts. */
  let ox, oy, startX, startY;

  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    // Snapshot current screen position before reparenting
    const rect = el.getBoundingClientRect();
    ox = rect.left; oy = rect.top;
    startX = e.clientX; startY = e.clientY;
    // Move to body so z-index is never blocked by dino stacking context
    el.style.position = 'fixed';
    el.style.left = ox + 'px';
    el.style.top  = oy + 'px';
    document.body.appendChild(el);
    el.classList.add('dragging');
  });

  el.addEventListener('pointermove', e => {
    if (!el.classList.contains('dragging')) return;
    el.style.left = (ox + e.clientX - startX) + 'px';
    el.style.top  = (oy + e.clientY - startY) + 'px';
  });

  el.addEventListener('pointerup', () => {
    if (!el.classList.contains('dragging')) return;
    el.classList.remove('dragging');

    const mouth = getMouthTarget();
    if (mouth) {
      const r  = el.getBoundingClientRect();
      const fx = r.left + r.width/2;
      const fy = r.top  + r.height/2;
      if (Math.hypot(fx - mouth.x, fy - mouth.y) < mouth.radius) {
        eatFruit(el, fx, fy);
        return;
      }
    }
    // Missed — put back in fruit-field at current position (absolute)
    el.style.position = 'absolute';
    dFruitField.appendChild(el);
  });

  dFruitField.appendChild(el);
  dActiveFruits.push(el);
}

function eatFruit(el, x, y) {
  el.classList.add('eaten');
  sfxYum();
  sparkles(x, y, 14);

  // Happy dino bounce
  const wrap = document.getElementById('dino-wrap');
  if (wrap) {
    wrap.style.animation = 'none';
    // Force reflow so re-adding animation works
    void wrap.offsetWidth;
    wrap.style.animation = 'dino-nom 0.5s ease-in-out, dino-idle 3s ease-in-out 0.5s infinite';
  }

  dActiveFruits = dActiveFruits.filter(f => f !== el);
  setTimeout(() => el.remove(), 320);
  // Spawn a fresh fruit after short delay
  setTimeout(() => { if (currentGame === 'dino') spawnFruit(); }, 600);
}


/* ════════════════════════════════════════════════════════════
   GAME 3 — CAR WASH
   ════════════════════════════════════════════════════════════ */
const CAR_COLORS = ['#e74c3c','#3498db','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4'];

let cwCanvas, cwCtx, cwBubbles;
let cwCar;        // { color, x, mudPatches: [{dx,dy,rx,ry,cleaned}] }
let cwState;      // 'washing' | 'celebrating' | 'leaving' | 'entering'
let cwPointerDown = false, cwPx = 0, cwPy = 0;
let cwAF, cwLastT;
let cwScrubTick = 0;
let cwW, cwH;     // canvas logical size

function initCarwash() {
  cwCanvas  = document.getElementById('cw-canvas');
  cwCtx     = cwCanvas.getContext('2d');
  cwBubbles = document.getElementById('cw-bubbles');
  cwBubbles.innerHTML = '';

  cwW = cwCanvas.width  = window.innerWidth;
  cwH = cwCanvas.height = window.innerHeight;

  cwCanvas.addEventListener('pointermove',  onCwMove);
  cwCanvas.addEventListener('pointerdown',  onCwDown);
  cwCanvas.addEventListener('pointerup',    onCwUp);
  cwCanvas.addEventListener('pointerleave', onCwUp);
  cwCanvas.addEventListener('pointercancel',onCwUp);

  setupNewCar(cwW / 2);   // car starts centered
  cwState  = 'washing';
  cwLastT  = performance.now();
  cwAF     = requestAnimationFrame(cwFrame);
}

function stopCarwash() {
  cancelAnimationFrame(cwAF);
  if (!cwCanvas) return;
  cwCanvas.removeEventListener('pointermove',   onCwMove);
  cwCanvas.removeEventListener('pointerdown',   onCwDown);
  cwCanvas.removeEventListener('pointerup',     onCwUp);
  cwCanvas.removeEventListener('pointerleave',  onCwUp);
  cwCanvas.removeEventListener('pointercancel', onCwUp);
  if (cwBubbles) cwBubbles.innerHTML = '';
}

function setupNewCar(centerX) {
  const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
  // Pre-defined positions spread across the whole car (as fractions of car half-size)
  // Each entry: [xFrac of carW/2, yFrac of carH/2]
  const grid = [
    [-0.70, 0.05], [-0.40, 0.10], [-0.10, 0.00], [ 0.20, 0.08], [ 0.55, 0.05],  // body row
    [-0.55, 0.35], [-0.20, 0.30], [ 0.15, 0.32], [ 0.50, 0.35],                  // lower body
    [-0.20,-0.45], [ 0.05,-0.42], [ 0.28,-0.48],                                  // roof/cabin
    [-0.62, 0.20], [ 0.62, 0.22],                                                  // far sides
  ];
  const patches = grid.map(([xf, yf]) => {
    const carW = Math.min(cwW * 0.60, 420);
    const carH = carW * 0.46;
    return {
      dx:  xf * (carW / 2) + (Math.random() - 0.5) * 22,
      dy:  yf * (carH / 2) + (Math.random() - 0.5) * 14,
      rx:  22 + Math.random() * 18,
      ry:  14 + Math.random() * 12,
      rot: Math.random() * Math.PI,
      cleaned: 0,
    };
  });
  cwCar = { color, x: centerX, patches };
}

/* Pointer handlers */
function onCwDown(e) {
  cwPointerDown = true;
  cwPx = e.clientX; cwPy = e.clientY;
}
function onCwMove(e) {
  cwPx = e.clientX; cwPy = e.clientY;
  if (cwPointerDown && cwState === 'washing') {
    doScrub(cwPx, cwPy);
    spawnBubble(cwPx, cwPy);
  }
}
function onCwUp() { cwPointerDown = false; }

function doScrub(px, py) {
  let anyProgress = false;
  for (const p of cwCar.patches) {
    if (p.cleaned >= 1) continue;
    const worldX = cwCar.x + p.dx;
    const worldY = cwH * 0.5 + p.dy;
    const d = Math.hypot(px - worldX, py - worldY);
    if (d < Math.max(p.rx, p.ry) + 30) {
      p.cleaned = Math.min(1, p.cleaned + 0.05);
      anyProgress = true;
    }
  }
  if (anyProgress) {
    cwScrubTick++;
    if (cwScrubTick % 4 === 0) sfxScrub();
  }
}

function spawnBubble(x, y) {
  if (!cwBubbles) return;
  const b    = document.createElement('div');
  b.className = 'bubble';
  const size  = 10 + Math.random() * 22;
  const dur   = 0.7 + Math.random() * 0.6;
  b.style.cssText = `
    left:${x - size/2}px; top:${y - size/2}px;
    width:${size}px; height:${size}px;
    animation-duration:${dur}s;
    --bx:${(Math.random()-0.5)*70}px;
    --by:${-35 - Math.random()*45}px;
  `;
  cwBubbles.appendChild(b);
  setTimeout(() => b.remove(), dur * 1000 + 50);
}

/* Main render loop */
function cwFrame(now) {
  const dt = Math.min((now - cwLastT) / 1000, 0.05);
  cwLastT  = now;

  cwCtx.clearRect(0, 0, cwW, cwH);

  const cy = cwH * 0.5;  // car vertical center

  // ── State machine ──
  if (cwState === 'washing') {
    const allClean = cwCar.patches.every(p => p.cleaned >= 1);
    if (allClean) {
      cwState = 'celebrating';
      sfxHonk();
      sfxWin();
      confettiBurst(cwCar.x, cy - 60, 90);
      sparkles(cwCar.x, cy, 20);
      setTimeout(() => { cwState = 'leaving'; }, 1200);
    }
  }

  if (cwState === 'leaving') {
    cwCar.x += cwW * 1.1 * dt;   // drive off right at ~screen-width/sec
    if (cwCar.x > cwW + 350) {
      setupNewCar(-350);          // new car enters from left
      cwState = 'entering';
    }
  }

  if (cwState === 'entering') {
    cwCar.x += cwW * 0.8 * dt;
    if (cwCar.x >= cwW / 2) {
      cwCar.x = cwW / 2;
      cwState = 'washing';
    }
  }

  // ── Draw car ──
  drawCar(cwCtx, cwCar.x, cy, cwCar.color);

  // ── Draw mud (washing state only) ──
  if (cwState === 'washing') {
    for (const p of cwCar.patches) {
      if (p.cleaned >= 1) continue;
      const alpha = (1 - p.cleaned) * 0.88;
      cwCtx.save();
      cwCtx.globalAlpha = alpha;
      cwCtx.translate(cwCar.x + p.dx, cy + p.dy);
      cwCtx.rotate(p.rot);
      // Main blob
      cwCtx.fillStyle = '#6b4f1e';
      cwCtx.beginPath();
      cwCtx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI*2);
      cwCtx.fill();
      // Texture: a couple of darker specks
      cwCtx.fillStyle = '#4a3510';
      cwCtx.globalAlpha = alpha * 0.55;
      for (let s = 0; s < 3; s++) {
        cwCtx.beginPath();
        cwCtx.ellipse((s-1)*p.rx*0.3, (s%2-.5)*p.ry*0.5, p.rx*0.18, p.ry*0.18, 0, 0, Math.PI*2);
        cwCtx.fill();
      }
      cwCtx.restore();
    }
  }

  // ── Shine stars when clean ──
  if (cwState === 'celebrating' || cwState === 'leaving') {
    const t   = now * 0.0028;
    const n   = 6;
    for (let i = 0; i < n; i++) {
      const a = t + i * (Math.PI * 2 / n);
      drawStar(cwCtx, cwCar.x + Math.cos(a)*130, cy + Math.sin(a)*60, 14 + Math.sin(t*2+i)*4);
    }
  }

  cwAF = requestAnimationFrame(cwFrame);
}

/* Emoji-style side-view cartoon car — simple, clean, recognisable */
function drawCar(ctx, cx, cy, color) {
  ctx.save();
  ctx.translate(cx, cy);

  const W = Math.min(cwW * 0.60, 420);  // car width
  const H = W * 0.46;                    // car height
  const w2 = W / 2, h2 = H / 2;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  ctx.beginPath(); ctx.ellipse(0, h2 + 14, w2 * 0.88, 13, 0, 0, Math.PI*2); ctx.fill();

  // ── Wheels (drawn first, behind body) ──
  const wR = H * 0.36;
  const wY = h2 - wR * 0.05;
  [-w2 * 0.55, w2 * 0.48].forEach(wx => {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(wx, wY, wR, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#d4d4d4';
    ctx.beginPath(); ctx.arc(wx, wY, wR * 0.58, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#999';
    ctx.beginPath(); ctx.arc(wx, wY, wR * 0.28, 0, Math.PI*2); ctx.fill();
    // 4 simple spokes
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = wR * 0.1; ctx.lineCap = 'round';
    for (let s = 0; s < 4; s++) {
      const a = s * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a)*wR*0.30, wY + Math.sin(a)*wR*0.30);
      ctx.lineTo(wx + Math.cos(a)*wR*0.54, wY + Math.sin(a)*wR*0.54);
      ctx.stroke();
    }
  });

  // ── Main body — wide rounded rectangle ──
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-w2, -h2 * 0.50, W, H * 0.76, H * 0.18); ctx.fill();
  // Body top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath(); ctx.roundRect(-w2, -h2*0.50, W, H*0.20, [H*0.18, H*0.18, 0, 0]); ctx.fill();

  // ── Bubble cabin / roof ──
  const cabX = -w2 * 0.42, cabW = W * 0.62, cabY = -h2 * 0.50 - H * 0.46, cabH = H * 0.52;
  ctx.fillStyle = darken(color, 0.12);
  ctx.beginPath(); ctx.roundRect(cabX, cabY, cabW, cabH, H * 0.20); ctx.fill();

  // ── Big panoramic window ──
  const winPad = 10;
  ctx.fillStyle = 'rgba(130,210,255,0.88)';
  ctx.beginPath(); ctx.roundRect(cabX + winPad, cabY + winPad, cabW - winPad*2, cabH - winPad*1.5, H*0.14); ctx.fill();
  // Window shine
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.roundRect(cabX + winPad + 8, cabY + winPad + 8, cabW * 0.32, cabH * 0.30, 6); ctx.fill();
  // Window centre pillar
  ctx.fillStyle = darken(color, 0.16);
  ctx.fillRect(cabX + cabW * 0.50 - 4, cabY + winPad, 8, cabH - winPad * 1.5);

  // ── Headlight (round, like emoji) ──
  ctx.fillStyle = '#fffde7';
  ctx.beginPath(); ctx.arc(-w2 + H*0.14, 0, H*0.13, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,200,0.3)';
  ctx.beginPath(); ctx.ellipse(-w2 + H*0.05, 0, H*0.20, H*0.12, 0, 0, Math.PI*2); ctx.fill();

  // ── Taillight (round, red) ──
  ctx.fillStyle = '#ff3333';
  ctx.beginPath(); ctx.arc(w2 - H*0.14, 0, H*0.13, 0, Math.PI*2); ctx.fill();

  // ── Door handle ──
  ctx.fillStyle = darken(color, 0.22);
  ctx.beginPath(); ctx.roundRect(-W*0.06, -H*0.08, W*0.14, H*0.14, 6); ctx.fill();

  ctx.restore();
}

/* 4-point star shape for shine effect */
function drawStar(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0,-s); ctx.lineTo(0,s);
  ctx.moveTo(-s,0); ctx.lineTo(s,0);
  ctx.moveTo(-s*.65,-s*.65); ctx.lineTo(s*.65,s*.65);
  ctx.moveTo(s*.65,-s*.65);  ctx.lineTo(-s*.65,s*.65);
  ctx.stroke();
  ctx.restore();
}

/* Darken a hex color by fraction (0–1) */
function darken(hex, frac) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, Math.round((n>>16)       * (1-frac)));
  const g = Math.max(0, Math.round(((n>>8)&0xff) * (1-frac)));
  const b = Math.max(0, Math.round((n&0xff)      * (1-frac)));
  return `rgb(${r},${g},${b})`;
}
