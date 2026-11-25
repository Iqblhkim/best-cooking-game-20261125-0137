// Sizzle & Serve — the world: kitchen state and every rule that moves it.
// Pure-ish on purpose: step(dt, input) advances the shift, and interact()
// answers one press of E / one click. The renderer only reads this state.
import {
  CHOP_SECONDS, GRILL_BURN_SECONDS, GRILL_COOK_SECONDS, INTERACT_RANGE,
  KITCHEN_TOP, LEVELS, MAX_ORDERS, MAX_STRIKES, PLAYER_R, PLAYER_SPEED,
  SHIFT_SECONDS, STATIONS, VIEW, levelFor, stationById,
} from './config.js';
import { INGREDIENTS, RECIPES, isPlate, makeItem, makePlate, plateMatchesRecipe } from './recipes.js';
import { mulberry32, pick } from './random.js';

export const STEP = 1 / 60;
export const EVENT_OVER = 1;

const CHOPPABLE = new Set(['tomato', 'lettuce', 'onion']);

function freshPlayer() {
  return { x: VIEW.w / 2, y: 430, dir: 1, moving: false, carrying: null, chopTarget: null };
}

export function createWorld(seed = 1) {
  const world = {
    seed,
    rng: mulberry32(seed),
    time: 0,
    timeLeft: SHIFT_SECONDS,
    level: 1,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expiredCount: 0,
    strikes: 0,
    orders: [],
    orderSeq: 0,
    spawnIn: 6,
    player: freshPlayer(),
    boards: [{ item: null, progress: 0 }, { item: null, progress: 0 }],
    grills: [{ item: null, progress: 0 }, { item: null, progress: 0 }],
    assembly: { plate: null },
    particles: [],
    floaters: [],
    screen: 'title',
    overReason: '',
    moveTarget: null,
    autoInteract: null,
  };
  return world;
}

export function resetWorld(world, seed = 1) {
  const fresh = createWorld(seed);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
}

function stationRects() {
  return STATIONS;
}

function collide(x, y) {
  // Keep the chef on the floor, out of the stations and inside the view.
  if (x < 16 + PLAYER_R || x > VIEW.w - 16 - PLAYER_R) return true;
  if (y < KITCHEN_TOP + 8 + PLAYER_R || y > VIEW.h - 8 - PLAYER_R) return true;
  for (const s of stationRects()) {
    if (x + PLAYER_R > s.x && x - PLAYER_R < s.x + s.w && y + PLAYER_R > s.y && y - PLAYER_R < s.y + s.h) return true;
  }
  return false;
}

function movePlayer(world, dx, dy, dt) {
  const p = world.player;
  const nx = p.x + dx * PLAYER_SPEED * dt;
  if (!collide(nx, p.y)) p.x = nx;
  const ny = p.y + dy * PLAYER_SPEED * dt;
  if (!collide(p.x, ny)) p.y = ny;
  p.moving = dx !== 0 || dy !== 0;
  if (dx !== 0) p.dir = dx > 0 ? 1 : -1;
}

function nearestStation(world, kind) {
  const p = world.player;
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    if (kind && s.kind !== kind) continue;
    const cx = Math.max(s.x, Math.min(p.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD <= INTERACT_RANGE + PLAYER_R ? { station: best, dist: bestD } : null;
}

function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color: color || '#fff', life: 1.4, max: 1.4 });
}

function burst(world, x, y, color, n = 10) {
  for (let i = 0; i < n; i += 1) {
    const a = world.rng() * Math.PI * 2;
    const sp = 40 + world.rng() * 90;
    world.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
      life: 0.5 + world.rng() * 0.5, max: 1, color, size: 3 + world.rng() * 4,
    });
  }
}

function spawnOrder(world, recipeId) {
  const level = LEVELS[world.level - 1];
  const id = recipeId || pick(world.rng, level.recipes);
  const patience = level.patience * (0.9 + world.rng() * 0.2);
  world.orders.push({ id: ++world.orderSeq, recipeId: id, patience, maxPatience: patience });
}

export function forceOrder(world, recipeId, patienceFrac = 1) {
  const level = LEVELS[world.level - 1];
  const patience = level.patience * patienceFrac;
  world.orders.push({ id: ++world.orderSeq, recipeId, patience, maxPatience: level.patience });
}

function servePlate(world) {
  const p = world.player;
  if (!isPlate(p.carrying)) return 'not-plate';
  const plate = p.carrying;
  const match = world.orders.find((o) => plateMatchesRecipe(plate.items, o.recipeId));
  const station = stationById('serve');
  if (!match) {
    addFloater(world, station.x + station.w / 2, station.y - 14, 'Wrong dish!', '#ff6b6b');
    return 'wrong';
  }
  const recipe = RECIPES[match.recipeId];
  const timeBonus = Math.round(20 * (match.patience / match.maxPatience));
  const mult = Math.min(2, 1 + 0.1 * world.combo);
  const points = Math.round((recipe.base + timeBonus) * mult);
  world.score += points;
  world.coins += recipe.coins;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.served += 1;
  world.orders = world.orders.filter((o) => o !== match);
  p.carrying = null;
  addFloater(world, station.x + station.w / 2, station.y - 14, `+${points}`, '#ffd93d');
  burst(world, station.x + station.w / 2, station.y, '#ffd93d', 16);
  return 'served';
}

// One press of E / one click on a station: the context action for whatever the
// chef is standing next to, holding, or has on a board or grill.
export function interact(world) {
  const p = world.player;
  const near = nearestStation(world);
  if (!near) return 'none';
  const s = near.station;
  if (s.kind === 'crate') {
    if (p.carrying) return 'hands-full';
    p.carrying = makeItem(s.item, 'raw');
    return 'pickup';
  }
  if (s.kind === 'plates') {
    if (p.carrying) return 'hands-full';
    p.carrying = makePlate();
    return 'pickup-plate';
  }
  if (s.kind === 'trash') {
    if (!p.carrying) return 'empty';
    p.carrying = null;
    return 'trash';
  }
  if (s.kind === 'board') {
    const board = world.boards[s.index];
    if (!board.item && p.carrying && !isPlate(p.carrying) && CHOPPABLE.has(p.carrying.kind) && p.carrying.state === 'raw') {
      board.item = p.carrying;
      board.progress = 0;
      p.carrying = null;
      return 'place-chop';
    }
    if (board.item && !p.carrying) {
      p.carrying = board.item;
      board.item = null;
      board.progress = 0;
      return 'take';
    }
    return 'none';
  }
  if (s.kind === 'grill') {
    const grill = world.grills[s.index];
    if (!grill.item && p.carrying && !isPlate(p.carrying) && p.carrying.kind === 'patty' && p.carrying.state === 'raw') {
      grill.item = p.carrying;
      grill.progress = 0;
      p.carrying = null;
      return 'place-grill';
    }
    if (grill.item && !p.carrying) {
      p.carrying = grill.item;
      grill.item = null;
      grill.progress = 0;
      return 'take';
    }
    return 'none';
  }
  if (s.kind === 'assembly') {
    if (world.assembly.plate && p.carrying && !isPlate(p.carrying)) {
      if (world.assembly.plate.items.length >= 5) return 'plate-full';
      world.assembly.plate.items.push(p.carrying);
      p.carrying = null;
      return 'add';
    }
    if (!world.assembly.plate && isPlate(p.carrying)) {
      world.assembly.plate = p.carrying;
      p.carrying = null;
      return 'place-plate';
    }
    if (world.assembly.plate && !p.carrying) {
      p.carrying = world.assembly.plate;
      world.assembly.plate = null;
      return 'take-plate';
    }
    return 'none';
  }
  if (s.kind === 'serve') {
    return servePlate(world);
  }
  return 'none';
}

function grillState(grill) {
  if (!grill.item) return 'empty';
  if (grill.progress >= GRILL_BURN_SECONDS) return 'burnt';
  if (grill.progress >= GRILL_COOK_SECONDS) return 'cooked';
  return 'cooking';
}

// Advance the shift by dt seconds. `input` is {mx, my, interactHeld,
// interactPressed}. Returns EVENT_OVER when the shift ends.
export function step(world, dt, input) {
  if (world.screen !== 'play') return 0;
  world.time += dt;
  world.timeLeft = Math.max(0, world.timeLeft - dt);
  world.level = levelFor(world.timeLeft);

  // Move: keyboard first, else the mouse's click-to-move target.
  let mx = input.mx || 0;
  let my = input.my || 0;
  if (mx === 0 && my === 0 && world.moveTarget) {
    const dx = world.moveTarget.x - world.player.x;
    const dy = world.moveTarget.y - world.player.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      world.moveTarget = null;
      if (world.autoInteract) {
        interact(world);
        world.autoInteract = null;
      }
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my) || 1;
    movePlayer(world, mx / len, my / len, dt);
  }

  if (input.interactPressed) interact(world);

  // Hold-to-chop: standing at a board with a raw item on it, holding E.
  const near = nearestStation(world, 'board');
  if (input.interactHeld && near) {
    const board = world.boards[near.station.index];
    if (board.item && board.item.state === 'raw') {
      board.progress += dt / CHOP_SECONDS;
      if (board.progress >= 1) {
        board.item.state = 'chopped';
        board.progress = 1;
        burst(world, near.station.x + near.station.w / 2, near.station.y, '#ffffff', 6);
      }
    }
  }

  // Grills cook on their own; a patty left too long burns.
  for (const grill of world.grills) {
    if (grill.item) {
      const before = grillState(grill);
      grill.progress += dt;
      if (grill.item) grill.item.state = grillState(grill) === 'burnt' ? 'burnt' : grillState(grill) === 'cooked' ? 'cooked' : 'raw';
      if (before === 'cooking' && grillState(grill) === 'cooked') {
        addFloater(world, 930, 300, 'Patty ready!', '#ffd93d');
      }
      if (grillState(grill) === 'burnt' && world.rng() < dt * 8) {
        world.particles.push({
          x: 910 + world.rng() * 120, y: 320, vx: (world.rng() - 0.5) * 10, vy: -40 - world.rng() * 30,
          life: 0.8, max: 0.8, color: '#888888', size: 5 + world.rng() * 4,
        });
      }
    }
  }

  // Orders arrive, wait, and walk out when their patience runs out.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < MAX_ORDERS) {
    spawnOrder(world);
    world.spawnIn = LEVELS[world.level - 1].spawnEvery * (0.85 + world.rng() * 0.3);
  }
  for (const order of [...world.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders = world.orders.filter((o) => o !== order);
      world.expiredCount += 1;
      world.strikes += 1;
      world.combo = 0;
      addFloater(world, VIEW.w / 2, 120, 'Order walked out!', '#ff6b6b');
      if (world.strikes >= MAX_STRIKES) {
        world.screen = 'over';
        world.overReason = 'Too many customers walked out!';
        return EVENT_OVER;
      }
    }
  }

  // Particles and score popups fade.
  for (const pt of world.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 60 * dt;
    pt.life -= dt;
  }
  world.particles = world.particles.filter((pt) => pt.life > 0);
  for (const f of world.floaters) {
    f.y -= 30 * dt;
    f.life -= dt;
  }
  world.floaters = world.floaters.filter((f) => f.life > 0);

  if (world.timeLeft <= 0) {
    world.screen = 'over';
    world.overReason = "Shift complete!";
    return EVENT_OVER;
  }
  return 0;
}

export { INGREDIENTS, RECIPES };
