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
  for (let i = 0; i < 4; i++) setTimeout(spawnBalloon, i * 350);
  bInterval = setInterval(spawnBalloon, 1300);
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
  const duration = 7 + Math.random() * 7;             // seconds to cross screen
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
  const w = Math.round(S * 0.32);   // responsive width
  const h = Math.round(w * 1.35);
  return `<svg viewBox="0 0 200 270" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <!-- Tail (behind body) -->
    <ellipse cx="160" cy="230" rx="38" ry="16" fill="#388e3c" transform="rotate(25,160,230)"/>
    <ellipse cx="188" cy="246" rx="22" ry="10" fill="#2e7d32" transform="rotate(35,188,246)"/>
    <!-- Body -->
    <ellipse cx="100" cy="185" rx="68" ry="78" fill="#4caf50"/>
    <!-- Belly -->
    <ellipse cx="100" cy="192" rx="44" ry="55" fill="#a5d6a7"/>
    <!-- Spots -->
    <circle cx="76"  cy="175" r="11" fill="#388e3c" opacity=".45"/>
    <circle cx="124" cy="165" r=" 9" fill="#388e3c" opacity=".45"/>
    <circle cx="100" cy="210" r=" 7" fill="#388e3c" opacity=".45"/>
    <!-- Legs -->
    <ellipse cx="72"  cy="258" rx="22" ry="13" fill="#388e3c"/>
    <ellipse cx="128" cy="258" rx="22" ry="13" fill="#388e3c"/>
    <!-- Arms (little T-rex arms, cute) -->
    <ellipse cx="36"  cy="168" rx="18" ry="10" fill="#4caf50" transform="rotate(-35,36,168)"/>
    <ellipse cx="164" cy="168" rx="18" ry="10" fill="#4caf50" transform="rotate(35,164,168)"/>
    <!-- Neck -->
    <ellipse cx="100" cy="114" rx="32" ry="26" fill="#4caf50"/>
    <!-- Head -->
    <ellipse cx="100" cy="74" rx="62" ry="56" fill="#4caf50"/>
    <!-- Jaw / chin -->
    <ellipse cx="100" cy="100" rx="50" ry="24" fill="#388e3c"/>
    <!-- MOUTH OPENING — big and obvious, this is the target -->
    <ellipse cx="100" cy="106" rx="40" ry="19" fill="#b71c1c" id="dino-mouth"/>
    <!-- Tongue -->
    <ellipse cx="100" cy="116" rx="26" ry="11" fill="#e91e63"/>
    <!-- Teeth (top row) -->
    <rect x="68"  y="96" width="11" height="15" rx="4" fill="white"/>
    <rect x="84"  y="93" width="11" height="18" rx="4" fill="white"/>
    <rect x="100" y="93" width="11" height="18" rx="4" fill="white"/>
    <rect x="116" y="95" width="11" height="16" rx="4" fill="white"/>
    <!-- Eyes -->
    <circle cx="70"  cy="60" r="18" fill="white"/>
    <circle cx="130" cy="60" r="18" fill="white"/>
    <circle cx="72"  cy="60" r="11" fill="#1565c0"/>
    <circle cx="132" cy="60" r="11" fill="#1565c0"/>
    <circle cx="74"  cy="57" r=" 6" fill="#111"/>
    <circle cx="134" cy="57" r=" 6" fill="#111"/>
    <!-- Eye shine -->
    <circle cx="76"  cy="54" r="3" fill="white"/>
    <circle cx="136" cy="54" r="3" fill="white"/>
    <!-- Happy brow -->
    <path d="M 56 44 Q 70 34 84 42"  fill="none" stroke="#2e7d32" stroke-width="4" stroke-linecap="round"/>
    <path d="M 116 42 Q 130 34 144 44" fill="none" stroke="#2e7d32" stroke-width="4" stroke-linecap="round"/>
    <!-- Nostrils -->
    <ellipse cx="90"  cy="88" rx="5" ry="4" fill="#388e3c"/>
    <ellipse cx="110" cy="88" rx="5" ry="4" fill="#388e3c"/>
    <!-- Head spines -->
    <polygon points="100,18 92,38 108,38"  fill="#2e7d32"/>
    <polygon points="118,22 111,40 125,40" fill="#388e3c"/>
    <polygon points="82,22  74,40 88,40"   fill="#388e3c"/>
  </svg>`;
}

/* Mouth hit position in screen coords — recalculated when needed */
function getMouthTarget() {
  const wrap = document.getElementById('dino-wrap');
  if (!wrap) return null;
  const r = wrap.getBoundingClientRect();
  // Mouth is at ~50% x, ~40% y within the SVG bounding box
  return {
    x: r.left + r.width  * 0.50,
    y: r.top  + r.height * 0.38,
    radius: Math.max(r.width * 0.40, 72),   // generous hit target
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

  /* ── Pointer-based drag ── */
  let ox, oy, startX, startY;

  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    startX = e.clientX; startY = e.clientY;
    ox = parseFloat(el.style.left);
    oy = parseFloat(el.style.top);
  });

  el.addEventListener('pointermove', e => {
    if (!el.classList.contains('dragging')) return;
    el.style.left = (ox + e.clientX - startX) + 'px';
    el.style.top  = (oy + e.clientY - startY) + 'px';
  });

  el.addEventListener('pointerup', e => {
    if (!el.classList.contains('dragging')) return;
    el.classList.remove('dragging');

    const mouth = getMouthTarget();
    if (!mouth) return;

    const r  = el.getBoundingClientRect();
    const fx = r.left + r.width/2;
    const fy = r.top  + r.height/2;
    const d  = Math.hypot(fx - mouth.x, fy - mouth.y);

    if (d < mouth.radius) {
      eatFruit(el, fx, fy);
    }
    // If missed — fruit just stays where dropped, no punishment
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
  const patches = [];
  const count   = 8 + Math.floor(Math.random() * 5);
  // Mud patches stored as offset from car center
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r     = 20 + Math.random() * 110;
    patches.push({
      dx: Math.cos(angle) * r,
      dy: Math.sin(angle) * r * 0.45,  // car is wider than tall
      rx: 28 + Math.random() * 26,
      ry: 18 + Math.random() * 18,
      rot: Math.random() * Math.PI,
      cleaned: 0,
    });
  }
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

/* Side-view cartoon car drawn on canvas */
function drawCar(ctx, cx, cy, color) {
  ctx.save();
  ctx.translate(cx, cy);

  // Width/height responsive to screen
  const carW = Math.min(cwW * 0.65, 480);
  const carH = carW * 0.44;
  const cw2  = carW / 2;
  const ch2  = carH / 2;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(0, ch2 + 18, cw2 * 0.95, 18, 0, 0, Math.PI*2);
  ctx.fill();

  // Wheels
  const wR  = carH * 0.40;
  const wY  = ch2 + wR * 0.1;
  const wxL = -cw2 * 0.58;
  const wxR =  cw2 * 0.52;
  [wxL, wxR].forEach(wx => {
    // Tyre
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(wx, wY, wR, 0, Math.PI*2); ctx.fill();
    // Rim
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.arc(wx, wY, wR*0.52, 0, Math.PI*2); ctx.fill();
    // Hub
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(wx, wY, wR*0.24, 0, Math.PI*2); ctx.fill();
    // Lug bolts
    for (let b = 0; b < 5; b++) {
      const a = (b/5)*Math.PI*2;
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(wx + Math.cos(a)*wR*0.37, wY + Math.sin(a)*wR*0.37, wR*0.07, 0, Math.PI*2);
      ctx.fill();
    }
  });

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-cw2, -ch2 * 0.55, carW, carH, carH * 0.22);
  ctx.fill();
  // Body highlight top edge
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.roundRect(-cw2, -ch2*0.55, carW, carH*0.18, [carH*0.22, carH*0.22, 0, 0]);
  ctx.fill();

  // Roof / cabin
  const roofX = -cw2 * 0.55, roofW = carW * 0.65;
  const roofY = -ch2 * 0.55 - carH * 0.52, roofH = carH * 0.58;
  ctx.fillStyle = darken(color, 0.14);
  ctx.beginPath();
  ctx.roundRect(roofX, roofY, roofW, roofH, carH * 0.18);
  ctx.fill();

  // Windows (split into front + rear)
  ctx.fillStyle = 'rgba(160,225,255,0.82)';
  const winY = roofY + roofH*0.12, winH = roofH*0.72;
  const midX = roofX + roofW*0.5;
  // Front window
  ctx.beginPath();
  ctx.roundRect(midX + 4, winY, roofW*0.44 - 8, winH, 8);
  ctx.fill();
  // Rear window
  ctx.beginPath();
  ctx.roundRect(roofX + 8, winY, roofW*0.44 - 8, winH, 8);
  ctx.fill();
  // Pillar between windows
  ctx.fillStyle = darken(color, 0.2);
  ctx.fillRect(midX - 4, winY, 8, winH);

  // Window glare
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.roundRect(midX + 8, winY + winH*0.1, roofW*0.14, winH*0.35, 4);
  ctx.fill();

  // Headlight
  ctx.fillStyle = '#fffde7';
  ctx.beginPath();
  ctx.roundRect(-cw2 + 6, -6, carW*0.09, carH*0.28, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,150,0.35)';
  ctx.beginPath();
  ctx.ellipse(-cw2 + 6, 2, 22, 14, 0, 0, Math.PI*2);
  ctx.fill();

  // Taillight
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.roundRect(cw2 - carW*0.09 - 6, -6, carW*0.09, carH*0.28, 6);
  ctx.fill();

  // Bumpers
  ctx.fillStyle = darken(color, 0.08);
  ctx.beginPath(); ctx.roundRect(-cw2, ch2*0.32, carW*0.18, ch2*0.28, 6); ctx.fill();
  ctx.beginPath(); ctx.roundRect(cw2 - carW*0.18, ch2*0.32, carW*0.18, ch2*0.28, 6); ctx.fill();

  // Door line
  ctx.strokeStyle = darken(color, 0.18);
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(roofX + roofW*0.5, -ch2*0.5);
  ctx.lineTo(roofX + roofW*0.5,  ch2*0.5);
  ctx.stroke();

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
