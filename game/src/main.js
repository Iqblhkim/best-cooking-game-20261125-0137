// Sizzle & Serve — bootstrap and game loop. One clear job: own the screens
// (title, play, paused, over), feed input into the world on a fixed timestep,
// and draw the frame. The rules live in world.js, the pictures in render.js.
import { STATIONS, VIEW } from './config.js';
import { createWorld, resetWorld, step, STEP, EVENT_OVER } from './world.js';
import { attachInput, createInput, pollInput } from './input.js';
import { render, renderGameOver, renderTitle } from './render.js';
import { sfx, toggleMute } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
canvas.width = VIEW.w;
canvas.height = VIEW.h;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7') || 7;

const world = createWorld(seed);
const input = createInput();

function toView(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX / rect.width) * VIEW.w,
    y: (clientY / rect.height) * VIEW.h,
  };
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

// --- Screenshot mode: stage the scene, draw it once, and hold it. ---
if (shotName) {
  const staged = stageShot(shotName, world);
  world.screen = staged.screen;
  render(ctx, world);
  setStatus(`Sizzle & Serve — ${shotName} scene, score ${world.score}, ${world.orders.length} orders on the board.`);
  // Keep repainting the same frame so the canvas is never blank when the
  // screenshot lands, but never advance the world: the scene must not move.
  const repaint = () => {
    render(ctx, world);
    requestAnimationFrame(repaint);
  };
  requestAnimationFrame(repaint);
} else {
  attachInput(input, canvas, toView);
  let paused = false;
  let last = performance.now();
  let acc = 0;
  let prevScore = 0;
  let prevStrikes = 0;
  let prevCarrying = null;
  let chopTick = 0;

  function startShift() {
    resetWorld(world, (Math.random() * 1e9) | 0);
    world.screen = 'play';
    prevScore = 0;
    prevStrikes = 0;
    prevCarrying = null;
    sfx.click();
    setStatus('Shift started. Take an order, cook it, serve it before the timer runs out.');
  }

  function clickToMove(point) {
    // Clicking a station walks the chef to its front and uses it on arrival;
    // clicking open floor just walks there.
    const hit = findStationAt(point);
    if (hit) {
      const cx = hit.x + hit.w / 2;
      const frontY = hit.kind === 'serve' ? hit.y - 22 : hit.y + hit.h + 22;
      world.moveTarget = { x: cx, y: frontY };
      world.autoInteract = hit.id;
    } else {
      world.moveTarget = point;
      world.autoInteract = null;
    }
  }

  function findStationAt(point) {
    return STATIONS.find(
      (s) => point.x >= s.x - 6 && point.x <= s.x + s.w + 6 && point.y >= s.y - 6 && point.y <= s.y + s.h + 6,
    );
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' && world.screen === 'title') startShift();
    if (event.code === 'KeyR' && world.screen === 'over') startShift();
    if (event.code === 'KeyP' && world.screen === 'play') {
      paused = !paused;
      setStatus(paused ? 'Paused.' : 'Back to work, chef.');
    }
    if (event.code === 'KeyM') {
      const muted = toggleMute();
      setStatus(muted ? 'Sound off.' : 'Sound on.');
    }
  });

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    // Clicks: start / restart / walk.
    if (input.click) {
      const point = input.click;
      input.click = null;
      if (world.screen === 'title') startShift();
      else if (world.screen === 'over') startShift();
      else if (!paused) clickToMove(point);
    }
    if (input.anyKey) input.anyKey = false;

    if (world.screen === 'play' && !paused) {
      acc += dt;
      while (acc >= STEP) {
        acc -= STEP;
        const polled = pollInput(input);
        const ev = step(world, STEP, polled);
        if (ev & EVENT_OVER) {
          setStatus(`Shift over! Score ${world.score}, ${world.served} dishes served. Press R to cook again.`);
          break;
        }
      }
      // Little sounds for what just happened.
      if (world.score > prevScore) sfx.serve();
      if (world.strikes > prevStrikes) sfx.expire();
      if (world.player.carrying !== prevCarrying) {
        if (world.player.carrying) sfx.pickup();
        else sfx.place();
      }
      prevScore = world.score;
      prevStrikes = world.strikes;
      prevCarrying = world.player.carrying;
      if (input.interactHeld) {
        chopTick += dt;
        if (chopTick > 0.22) {
          chopTick = 0;
          sfx.chop();
        }
      }
    }

    if (world.screen === 'title') renderTitle(ctx, world);
    else if (world.screen === 'over') renderGameOver(ctx, world);
    else {
      render(ctx, world);
      if (paused) {
        ctx.fillStyle = 'rgba(20,28,36,0.6)';
        ctx.fillRect(0, 0, VIEW.w, VIEW.h);
        ctx.fillStyle = '#fff';
        ctx.font = '800 44px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED — press P to keep cooking', VIEW.w / 2, VIEW.h / 2);
      }
    }
  }
  requestAnimationFrame(frame);
}
