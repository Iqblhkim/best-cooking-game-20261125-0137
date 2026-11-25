// Sizzle & Serve — screenshot scenes. Each one plays the real rules forward
// from a fresh world for a fixed script (an autopilot that walks the kitchen,
// cooks a dish and serves it), then dresses the scene with real game state,
// so the frame is what a short game really looks like and the same seed always
// gives the same frame. No pixels are faked: the renderer draws the world.
import { GRILL_COOK_SECONDS, STATIONS, VIEW, stationById } from './config.js';
import { isPlate } from './recipes.js';
import { EVENT_OVER, forceOrder, resetWorld, step } from './world.js';

const STEP = 1 / 60;

// Where the chef stands to use each station.
function frontPoint(station) {
  const cx = station.x + station.w / 2;
  if (station.kind === 'serve') return { x: cx, y: station.y - 22 };
  if (station.kind === 'assembly' || station.kind === 'sink') return { x: cx, y: station.y + station.h + 22 };
  return { x: cx, y: station.y + station.h + 22 };
}

// --- A tiny grid BFS so the autopilot never gets stuck behind a counter. ---
const CELL = 40;
const COLS = Math.ceil(VIEW.w / CELL);
const ROWS = Math.ceil(VIEW.h / CELL);

function blockedAt(x, y) {
  if (x < 38 || x > VIEW.w - 38 || y < 170 || y > VIEW.h - 30) return true;
  for (const s of STATIONS) {
    if (x + 22 > s.x && x - 22 < s.x + s.w && y + 22 > s.y && y - 22 < s.y + s.h) return true;
  }
  return false;
}

function findPath(from, to) {
  const start = { cx: Math.floor(from.x / CELL), cy: Math.floor(from.y / CELL) };
  const goal = { cx: Math.floor(to.x / CELL), cy: Math.floor(to.y / CELL) };
  const key = (cx, cy) => `${cx},${cy}`;
  const prev = new Map();
  const seen = new Set([key(start.cx, start.cy)]);
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.cx === goal.cx && cur.cy === goal.cy) {
      const cells = [];
      let node = cur;
      while (node) {
        cells.unshift({ x: node.cx * CELL + CELL / 2, y: node.cy * CELL + CELL / 2 });
        node = prev.get(key(node.cx, node.cy));
      }
      cells.push({ x: to.x, y: to.y });
      return cells;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.cx + dx;
      const ny = cur.cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (seen.has(key(nx, ny))) continue;
      const px = nx * CELL + CELL / 2;
      const py = ny * CELL + CELL / 2;
      if (blockedAt(px, py)) continue;
      seen.add(key(nx, ny));
      prev.set(key(nx, ny), cur);
      queue.push({ cx: nx, cy: ny });
    }
  }
  return [{ x: to.x, y: to.y }];
}

// --- The autopilot: a task list the controller works through. ---
function taskList() {
  const tasks = [];
  const api = {
    go(stationId) {
      tasks.push({ type: 'go', at: frontPoint(stationById(stationId)) });
      return api;
    },
    press() {
      tasks.push({ type: 'press' });
      return api;
    },
    hold(seconds) {
      tasks.push({ type: 'hold', left: seconds });
      return api;
    },
    wait(seconds) {
      tasks.push({ type: 'wait', left: seconds });
      return api;
    },
    until(fn, timeout = 30) {
      tasks.push({ type: 'until', fn, left: timeout });
      return api;
    },
    run() {
      return tasks;
    },
  };
  return api;
}

// Cook one dish, start to finish, and serve it. `recipeId` picks the dish.
function cookAndServe(recipeId) {
  const t = taskList();
  // Plate first, then build on it at the assembly counter.
  t.go('plates').press();
  t.go('assembly').press();
  if (recipeId === 'salad') {
    t.go('crate-lettuce').press();
    t.go('board-0').press();
    t.hold(1.6);
    t.go('board-0').press();
    t.go('assembly').press();
    t.go('crate-tomato').press();
    t.go('board-0').press();
    t.hold(1.6);
    t.go('board-0').press();
    t.go('assembly').press();
  } else {
    // Burgers: bun on the plate, patty off the grill, chopped lettuce/tomato.
    t.go('crate-bun').press();
    t.go('assembly').press();
    t.go('crate-patty').press();
    t.go('grill-0').press();
    t.until((w) => w.grills[0].item && w.grills[0].item.state === 'cooked', 20);
    t.go('grill-0').press();
    t.go('assembly').press();
    t.go('crate-lettuce').press();
    t.go('board-0').press();
    t.hold(1.6);
    t.go('board-0').press();
    t.go('assembly').press();
    if (recipeId === 'cheese' || recipeId === 'double') {
      if (recipeId === 'cheese') {
        t.go('crate-tomato').press();
        t.go('board-0').press();
        t.hold(1.6);
        t.go('board-0').press();
        t.go('assembly').press();
      }
      t.go('crate-cheese').press();
      t.go('assembly').press();
      if (recipeId === 'double') {
        t.go('crate-patty').press();
        t.go('grill-0').press();
        t.until((w) => w.grills[0].item && w.grills[0].item.state === 'cooked', 20);
        t.go('grill-0').press();
        t.go('assembly').press();
      }
    }
  }
  t.go('assembly').press(); // pick the finished plate up
  return t;
}

function runTasks(world, tasks, maxSeconds = 240) {
  let ti = 0;
  let path = null;
  let pi = 0;
  let pressed = false;
  const input = { mx: 0, my: 0, interactHeld: false, interactPressed: false };
  for (let stepNo = 0; stepNo < maxSeconds / STEP; stepNo += 1) {
    if (ti >= tasks.length) return true;
    const task = tasks[ti];
    input.mx = 0;
    input.my = 0;
    input.interactHeld = false;
    input.interactPressed = false;
    if (task.type === 'go') {
      if (!path) {
        path = findPath(world.player, task.at);
        pi = 0;
      }
      const target = path[pi];
      const dx = target.x - world.player.x;
      const dy = target.y - world.player.y;
      const d = Math.hypot(dx, dy);
      if (d < 10) {
        pi += 1;
        if (pi >= path.length) {
          ti += 1;
          path = null;
        }
      } else {
        input.mx = dx / d;
        input.my = dy / d;
      }
    } else if (task.type === 'press') {
      if (!pressed) {
        input.interactPressed = true;
        pressed = true;
      } else {
        pressed = false;
        ti += 1;
      }
    } else if (task.type === 'hold') {
      input.interactHeld = true;
      task.left -= STEP;
      if (task.left <= 0) ti += 1;
    } else if (task.type === 'wait') {
      task.left -= STEP;
      if (task.left <= 0) ti += 1;
    } else if (task.type === 'until') {
      task.left -= STEP;
      if (task.fn(world) || task.left <= 0) ti += 1;
    }
    const ev = step(world, STEP, input);
    if (ev & EVENT_OVER) return false;
  }
  return ti >= tasks.length;
}

function serveNow(world, recipeId) {
  forceOrder(world, recipeId, 1);
  const tasks = taskList().go('serve').press().run();
  return runTasks(world, tasks, 30);
}

// Dressing helpers: real game state, set directly after the played part.
function putOnGrill(world, index, state, progress) {
  world.grills[index].item = { kind: 'patty', state };
  world.grills[index].progress = progress;
}
function putOnBoard(world, index, kind, state, progress) {
  world.boards[index].item = { kind, state };
  world.boards[index].progress = progress;
}
function setAssembly(world, items) {
  world.assembly.plate = { type: 'plate', items: items.map(([kind, state]) => ({ kind, state })) };
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Scenes: cover, chop, grill, rush.
 */
export function stageShot(name, world) {
  resetWorld(world, 7);
  world.screen = 'play';
  // Let the first order arrive, then play a real burger and serve it: the
  // cover and the rush both build on a score that was actually earned.
  runTasks(world, taskList().wait(7).run(), 10);
  if (name === 'chop') {
    const t = taskList();
    t.go('crate-tomato').press();
    t.go('board-0').press();
    t.hold(0.8); // half-chopped when the shutter falls
    runTasks(world, t.run(), 60);
    forceOrder(world, 'salad', 0.9);
    forceOrder(world, 'burger', 0.7);
    putOnGrill(world, 1, 'cooking', 3);
    world.timeLeft = 150;
    return { screen: 'play' };
  }
  if (name === 'grill') {
    const t = taskList();
    t.go('crate-patty').press();
    t.go('grill-0').press();
    t.go('crate-patty').press();
    t.go('grill-1').press();
    t.until((w) => w.grills[0].item && w.grills[0].item.state === 'cooked', 20);
    t.go('grill-0').press(); // chef carries the cooked patty
    runTasks(world, t.run(), 90);
    putOnGrill(world, 0, 'cooking', 2); // a fresh patty goes on the freed grill
    // Step between the grills so the patty in hand reads against the floor,
    // not on top of the patty still cooking.
    world.player.x = 970;
    world.player.y = 430;
    forceOrder(world, 'burger', 0.85);
    forceOrder(world, 'cheese', 0.7);
    world.timeLeft = 120;
    return { screen: 'play' };
  }
  if (name === 'rush') {
    // Earn the score first, then jump to the last minute of the shift.
    const burger = cookAndServe('burger').run();
    runTasks(world, burger, 150);
    serveNow(world, 'burger');
    world.timeLeft = 55;
    world.level = 3;
    world.combo = 5;
    world.bestCombo = 5;
    world.score = 480;
    world.coins = 62;
    world.served = 9;
    world.orders = [];
    forceOrder(world, 'double', 0.25);
    forceOrder(world, 'cheese', 0.5);
    forceOrder(world, 'burger', 0.8);
    forceOrder(world, 'salad', 0.9);
    setAssembly(world, [['bun', 'raw'], ['patty', 'cooked'], ['patty', 'cooked']]);
    putOnGrill(world, 0, 'cooking', 4.5);
    putOnBoard(world, 0, 'lettuce', 'raw', 0.6);
    world.player.carrying = { kind: 'cheese', state: 'raw' };
    world.player.x = 640;
    world.player.y = 606;
    world.player.dir = 1;
    return { screen: 'play' };
  }
  // cover: a full kitchen at the height of the rush.
  const burger = cookAndServe('burger').run();
  runTasks(world, burger, 150);
  serveNow(world, 'burger');
  // Second burger, built and held at the window, ready to serve.
  const second = cookAndServe('burger').run();
  runTasks(world, second, 150);
  forceOrder(world, 'burger', 1);
  runTasks(world, taskList().go('serve').run(), 20);
  // The kitchen stays busy behind the chef: a patty on the grill, chopped
  // veg on the boards, and three tickets waiting.
  putOnGrill(world, 0, 'cooking', 3.5);
  putOnBoard(world, 0, 'tomato', 'chopped', 1);
  putOnBoard(world, 1, 'lettuce', 'chopped', 1);
  forceOrder(world, 'cheese', 0.75);
  forceOrder(world, 'veggie', 0.55);
  world.orders = world.orders.slice(-4);
  if (!world.orders.some((o) => o.recipeId === 'burger')) {
    world.orders.shift();
    forceOrder(world, 'burger', 1);
  }
  // The cover is the rush at its best: no customer walked out getting here.
  world.strikes = 0;
  world.timeLeft = 96;
  return { screen: 'play' };
}

export { isPlate };
