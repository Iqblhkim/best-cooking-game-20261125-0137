// Sizzle & Serve — kitchen layout and tuning. One clear job: every number that
// shapes the kitchen, the shift and the difficulty lives here.
export const VIEW = { w: 1280, h: 720 };
export const HUD_H = 56;
export const BOARD_H = 92;
export const KITCHEN_TOP = HUD_H + BOARD_H; // 148 — the floor starts here
export const SHIFT_SECONDS = 180;
export const PLAYER_R = 22;
export const PLAYER_SPEED = 260;
export const INTERACT_RANGE = 52;
export const CHOP_SECONDS = 1.4;
export const GRILL_COOK_SECONDS = 6;
export const GRILL_BURN_SECONDS = 12;
export const MAX_ORDERS = 4;
export const MAX_STRIKES = 3;

// Stations. x/y/w/h are pixels in the 1280x720 view. The player walks the open
// floor and interacts with the station whose edge is nearest.
export const STATIONS = [
  // Ingredient crates along the top counter.
  { id: 'crate-bun', kind: 'crate', item: 'bun', x: 16, y: 160, w: 144, h: 64, label: 'BUN' },
  { id: 'crate-patty', kind: 'crate', item: 'patty', x: 176, y: 160, w: 144, h: 64, label: 'PATTY' },
  { id: 'crate-tomato', kind: 'crate', item: 'tomato', x: 336, y: 160, w: 144, h: 64, label: 'TOMATO' },
  { id: 'crate-lettuce', kind: 'crate', item: 'lettuce', x: 496, y: 160, w: 144, h: 64, label: 'LETTUCE' },
  { id: 'crate-cheese', kind: 'crate', item: 'cheese', x: 656, y: 160, w: 144, h: 64, label: 'CHEESE' },
  { id: 'crate-onion', kind: 'crate', item: 'onion', x: 816, y: 160, w: 144, h: 64, label: 'ONION' },
  { id: 'plates', kind: 'plates', x: 976, y: 160, w: 144, h: 64, label: 'PLATES' },
  { id: 'trash', kind: 'trash', x: 1136, y: 160, w: 128, h: 64, label: 'TRASH' },
  // Chopping boards (left island).
  { id: 'board-0', kind: 'board', index: 0, x: 200, y: 320, w: 100, h: 64, label: 'CHOP' },
  { id: 'board-1', kind: 'board', index: 1, x: 320, y: 320, w: 100, h: 64, label: 'CHOP' },
  // Grills (right island).
  { id: 'grill-0', kind: 'grill', index: 0, x: 860, y: 320, w: 100, h: 64, label: 'GRILL' },
  { id: 'grill-1', kind: 'grill', index: 1, x: 980, y: 320, w: 100, h: 64, label: 'GRILL' },
  // Assembly counter (centre) and sink (decorative, left).
  { id: 'assembly', kind: 'assembly', x: 480, y: 520, w: 320, h: 64, label: 'ASSEMBLY' },
  { id: 'sink', kind: 'sink', x: 16, y: 520, w: 128, h: 64, label: 'SINK' },
  // Serving window along the bottom edge.
  { id: 'serve', kind: 'serve', x: 480, y: 656, w: 320, h: 64, label: 'SERVE' },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

// Difficulty per level: how often a new order arrives, how patient customers
// are, and which recipes the board may ask for.
export const LEVELS = [
  { spawnEvery: 14, patience: 48, recipes: ['salad', 'burger'] },
  { spawnEvery: 11, patience: 42, recipes: ['salad', 'burger', 'cheese', 'veggie'] },
  { spawnEvery: 8, patience: 36, recipes: ['salad', 'burger', 'cheese', 'veggie', 'double'] },
];

export function levelFor(timeLeft) {
  const elapsed = SHIFT_SECONDS - timeLeft;
  if (elapsed < 60) return 1;
  if (elapsed < 120) return 2;
  return 3;
}

// Stars on the results screen, by score.
export function starsFor(score) {
  if (score >= 900) return 3;
  if (score >= 550) return 2;
  if (score >= 250) return 1;
  return 0;
}
