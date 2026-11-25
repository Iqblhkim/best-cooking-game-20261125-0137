// Sizzle & Serve — everything the player sees, drawn on one canvas with plain
// shapes: the kitchen, the order board, the chef, the food, the HUD and the
// title / results screens. No images, no fonts to download.
import { BOARD_H, HUD_H, KITCHEN_TOP, MAX_STRIKES, STATIONS, VIEW, starsFor } from './config.js';
import { INGREDIENTS, RECIPES, isPlate } from './recipes.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient, drawn from shapes so it reads at any size: a bun is a dome,
// a patty a brown disc, tomato a red disc with a green star, lettuce a wavy
// leaf, cheese a yellow wedge, onion purple rings.
export function drawIngredient(ctx, kind, state, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const burnt = state === 'burnt';
  if (kind === 'bun') {
    ctx.fillStyle = '#e8b25c';
    ctx.beginPath();
    ctx.arc(0, 2, s * 0.52, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d99a3d';
    ctx.fillRect(-s * 0.52, 0, s * 1.04, s * 0.16);
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(-s * 0.2, -s * 0.22, s * 0.05, 0, Math.PI * 2);
    ctx.arc(s * 0.15, -s * 0.3, s * 0.05, 0, Math.PI * 2);
    ctx.arc(s * 0.28, -s * 0.12, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'patty') {
    ctx.fillStyle = burnt ? '#2b2b2b' : state === 'cooked' ? '#6b4226' : '#a86a4a';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = burnt ? '#444' : '#7d4f30';
    ctx.beginPath();
    ctx.ellipse(-s * 0.15, -s * 0.08, s * 0.16, s * 0.08, 0, 0, Math.PI * 2);
    ctx.ellipse(s * 0.18, s * 0.1, s * 0.14, s * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    if (state === 'cooked') {
      ctx.strokeStyle = '#ffd93d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (kind === 'tomato') {
    ctx.fillStyle = state === 'chopped' ? '#ff8a7a' : '#e74c3c';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
    if (state === 'chopped') {
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, 0);
      ctx.lineTo(s * 0.4, 0);
      ctx.moveTo(0, -s * 0.4);
      ctx.lineTo(0, s * 0.4);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#2e8b57';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.5);
      ctx.lineTo(-s * 0.16, -s * 0.28);
      ctx.lineTo(0, -s * 0.36);
      ctx.lineTo(s * 0.16, -s * 0.28);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = state === 'chopped' ? '#7ed491' : '#58b368';
    ctx.beginPath();
    for (let i = 0; i <= 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const r = s * 0.5 * (i % 2 === 0 ? 1 : 0.78);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3d8b4f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.quadraticCurveTo(0, s * 0.15, s * 0.3, 0);
    ctx.stroke();
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.35);
    ctx.lineTo(s * 0.5, s * 0.35);
    ctx.lineTo(0, -s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d99a00';
    ctx.beginPath();
    ctx.arc(-s * 0.1, s * 0.1, s * 0.07, 0, Math.PI * 2);
    ctx.arc(s * 0.18, s * 0.18, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'onion') {
    ctx.fillStyle = '#c9a7eb';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8e6bbf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7ed491';
    ctx.fillRect(-s * 0.05, -s * 0.72, s * 0.1, s * 0.3);
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, s, items) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.62, s * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d7dee8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.62, s * 0.48, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (items) {
    const n = items.length;
    items.forEach((item, i) => {
      const ox = n === 1 ? 0 : (i - (n - 1) / 2) * s * 0.34;
      drawIngredient(ctx, item.kind, item.state, x + ox, y - 2, s * 0.52);
    });
  }
}

function drawHeart(ctx, x, y, s, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 20, s / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ff5b6a' : '#5a6b7a';
  ctx.fill();
  ctx.restore();
}

function drawFloor(ctx) {
  for (let ty = 0; ty < 9; ty += 1) {
    for (let tx = 0; tx < 20; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#f3e2b8' : '#ecd3a0';
      ctx.fillRect(tx * 64, KITCHEN_TOP + ty * 64, 64, 64);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, KITCHEN_TOP, VIEW.w, 4);
}

function drawDecor(ctx) {
  // Floor dressing only — nothing here collides, it just fills the empty
  // middle of the kitchen so the room reads as a room, not a grid.
  // Anti-fatigue mats in front of the work islands.
  ctx.fillStyle = '#d9c08a';
  rr(ctx, 190, 398, 240, 22, 6);
  ctx.fill();
  rr(ctx, 850, 398, 240, 22, 6);
  ctx.fill();
  // Rug in front of the serving window.
  ctx.fillStyle = '#c0392b';
  rr(ctx, 500, 596, 280, 42, 8);
  ctx.fill();
  ctx.strokeStyle = '#f5d76e';
  ctx.lineWidth = 2;
  rr(ctx, 508, 602, 264, 30, 6);
  ctx.stroke();
  // Potted plant, bottom-right corner.
  ctx.fillStyle = '#b0613a';
  ctx.beginPath();
  ctx.moveTo(1198, 652);
  ctx.lineTo(1232, 652);
  ctx.lineTo(1228, 676);
  ctx.lineTo(1202, 676);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#58b368';
  ctx.beginPath();
  ctx.arc(1206, 644, 12, 0, Math.PI * 2);
  ctx.arc(1224, 640, 13, 0, Math.PI * 2);
  ctx.arc(1215, 630, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawStation(ctx, world, s) {
  const { x, y, w, h } = s;
  ctx.save();
  if (s.kind === 'crate') {
    ctx.fillStyle = '#a9713f';
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#c98d54';
    rr(ctx, x + 4, y + 4, w - 8, h - 8, 6);
    ctx.fill();
    drawIngredient(ctx, s.item, 'raw', x + w / 2, y + h / 2 - 6, 34);
    text(ctx, s.label, x + w / 2, y + h - 13, 12, '#5b3a1a', 800, 'center');
  } else if (s.kind === 'plates') {
    ctx.fillStyle = '#8d9aa8';
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + 12 + i * 10, 34, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c8d2dc';
      ctx.stroke();
    }
    text(ctx, s.label, x + w / 2, y + h - 9, 12, '#fff', 800, 'center');
  } else if (s.kind === 'trash') {
    ctx.fillStyle = '#5a6b7a';
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#39434e';
    rr(ctx, x + 14, y + 10, w - 28, h - 26, 6);
    ctx.fill();
    text(ctx, s.label, x + w / 2, y + h - 10, 12, '#fff', 800, 'center');
  } else if (s.kind === 'board') {
    const board = world.boards[s.index];
    ctx.fillStyle = '#7a5a34';
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#e8c98f';
    rr(ctx, x + 6, y + 6, w - 12, h - 12, 6);
    ctx.fill();
    if (board.item) {
      drawIngredient(ctx, board.item.kind, board.item.state, x + w / 2, y + h / 2 - 4, 34);
      if (board.item.state === 'raw') {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        rr(ctx, x + 10, y + h - 14, w - 20, 7, 3);
        ctx.fill();
        ctx.fillStyle = '#ff9f1c';
        rr(ctx, x + 10, y + h - 14, (w - 20) * Math.min(1, board.progress), 7, 3);
        ctx.fill();
      }
    }
    text(ctx, s.label, x + w / 2, y - 10, 12, '#7a5a34', 800, 'center');
  } else if (s.kind === 'grill') {
    const grill = world.grills[s.index];
    ctx.fillStyle = '#3a3f47';
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#22262c';
    ctx.lineWidth = 3;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 8, y + (h / 4) * i);
      ctx.lineTo(x + w - 8, y + (h / 4) * i);
      ctx.stroke();
    }
    // Flames lick under a cooking patty.
    if (grill.item) {
      const t = world.time * 6;
      for (let i = 0; i < 3; i += 1) {
        const fx = x + 22 + i * 28;
        const fh = 10 + Math.sin(t + i * 2) * 4;
        ctx.fillStyle = i % 2 ? '#ff9f1c' : '#ff5b2e';
        ctx.beginPath();
        ctx.moveTo(fx - 8, y + h - 6);
        ctx.quadraticCurveTo(fx, y + h - 6 - fh, fx + 8, y + h - 6);
        ctx.closePath();
        ctx.fill();
      }
      drawIngredient(ctx, 'patty', grill.item.state, x + w / 2, y + h / 2 - 4, 36);
      const frac = grill.item.state === 'burnt' ? 1 : Math.min(1, grill.progress / 6);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      rr(ctx, x + 10, y + h - 12, w - 20, 6, 3);
      ctx.fill();
      ctx.fillStyle = grill.item.state === 'burnt' ? '#555' : '#ff9f1c';
      rr(ctx, x + 10, y + h - 12, (w - 20) * frac, 6, 3);
      ctx.fill();
    }
    text(ctx, s.label, x + w / 2, y - 10, 12, '#3a3f47', 800, 'center');
  } else if (s.kind === 'assembly') {
    ctx.fillStyle = '#b8c4d0';
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#dbe4ec';
    rr(ctx, x + 4, y + 4, w - 8, h - 8, 6);
    ctx.fill();
    if (world.assembly.plate) {
      drawPlate(ctx, x + w / 2, y + h / 2, 56, world.assembly.plate.items);
    } else {
      ctx.fillStyle = '#8d9aa8';
      ctx.font = `700 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('PLACE A PLATE, THEN ADD FOOD', x + w / 2, y + h / 2);
    }
    text(ctx, s.label, x + w / 2, y - 10, 12, '#5a6b7a', 800, 'center');
  } else if (s.kind === 'sink') {
    ctx.fillStyle = '#7fb3d5';
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#aed6f1';
    rr(ctx, x + 8, y + 8, w - 16, h - 16, 6);
    ctx.fill();
    text(ctx, s.label, x + w / 2, y + h - 10, 12, '#1a5276', 800, 'center');
  } else if (s.kind === 'serve') {
    ctx.fillStyle = '#c0392b';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    // Awning stripes.
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#c0392b';
      ctx.fillRect(x + 8 + i * ((w - 16) / 8), y + 4, (w - 16) / 8, 14);
    }
    text(ctx, 'SERVE  •  RING THE BELL', x + w / 2, y + h / 2 + 8, 18, '#ffffff', 800, 'center');
    // Bell.
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.arc(x + w - 26, y + h / 2 + 8, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + w - 28, y + h / 2 + 15, 4, 5);
  }
  ctx.restore();
}

function drawChef(ctx, world) {
  const p = world.player;
  const bob = p.moving ? Math.sin(world.time * 12) * 2 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: teal shirt, white apron.
  ctx.fillStyle = '#2e86ab';
  rr(ctx, -17, -8, 34, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  rr(ctx, -12, -4, 24, 26, 6);
  ctx.fill();
  ctx.strokeStyle = '#2e86ab';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.lineTo(-17, -16);
  ctx.moveTo(12, -4);
  ctx.lineTo(17, -16);
  ctx.stroke();
  // Head + hat.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -20, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  rr(ctx, -15, -38, 30, 12, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-8, -38, 7, Math.PI, 0);
  ctx.arc(0, -40, 8, Math.PI, 0);
  ctx.arc(8, -38, 7, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  // Eyes look where the chef walks.
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(p.dir * 3 - 4, -21, 1.8, 0, Math.PI * 2);
  ctx.arc(p.dir * 3 + 5, -21, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // What the chef carries, held high.
  if (p.carrying) {
    if (isPlate(p.carrying)) drawPlate(ctx, 0, -56, 44, p.carrying.items);
    else drawIngredient(ctx, p.carrying.kind, p.carrying.state, 0, -56, 36);
  }
  ctx.restore();
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = RECIPES[order.recipeId];
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.fillStyle = '#fffdf5';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = frac < 0.3 ? '#e74c3c' : '#d9c9a3';
  ctx.lineWidth = frac < 0.3 ? 3 : 2;
  rr(ctx, x, y, w, h, 10);
  ctx.stroke();
  text(ctx, `#${order.id} ${recipe.name}`, x + 12, y + 18, 14, '#333', 800);
  text(ctx, `+${recipe.base} pts  •  ${recipe.coins} coins`, x + w - 12, y + 18, 11, '#8a6d1a', 700, 'right');
  recipe.needs.forEach((need, i) => {
    const [kind, state] = need.split(':');
    drawIngredient(ctx, kind, state, x + 26 + i * 44, y + 48, 30);
  });
  // Patience bar.
  ctx.fillStyle = '#eee';
  rr(ctx, x + 12, y + h - 16, w - 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac < 0.3 ? '#e74c3c' : frac < 0.6 ? '#f5a623' : '#58b368';
  rr(ctx, x + 12, y + h - 16, (w - 24) * frac, 8, 4);
  ctx.fill();
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#22303c';
  ctx.fillRect(0, 0, VIEW.w, HUD_H);
  text(ctx, 'SIZZLE & SERVE', 16, HUD_H / 2, 22, '#ffd93d', 800);
  text(ctx, `SCORE ${world.score}`, 250, HUD_H / 2, 18, '#ffffff', 800);
  // Coins.
  ctx.fillStyle = '#ffd93d';
  ctx.beginPath();
  ctx.arc(392, HUD_H / 2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6d1a';
  ctx.font = `800 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¢', 392, HUD_H / 2 + 0.5);
  text(ctx, `${world.coins}`, 408, HUD_H / 2, 18, '#ffffff', 800);
  if (world.combo >= 2) {
    text(ctx, `COMBO x${world.combo}`, 480, HUD_H / 2, 16, '#ff9f1c', 800);
  }
  // Shift timer, centre-right.
  const t = Math.max(0, world.timeLeft);
  const mm = Math.floor(t / 60);
  const ss = String(Math.floor(t % 60)).padStart(2, '0');
  text(ctx, `LEVEL ${world.level}`, 640, HUD_H / 2 - 12, 13, '#9fb3c8', 700, 'center');
  text(ctx, `${mm}:${ss}`, 640, HUD_H / 2 + 12, 20, t < 30 ? '#ff6b6b' : '#ffffff', 800, 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  rr(ctx, 560, HUD_H - 8, 160, 4, 2);
  ctx.fill();
  ctx.fillStyle = '#58b368';
  rr(ctx, 560, HUD_H - 8, 160 * (t / 180), 4, 2);
  ctx.fill();
  // Strikes as hearts, right side.
  text(ctx, 'CUSTOMERS', 1000, HUD_H / 2 - 12, 11, '#9fb3c8', 700, 'center');
  for (let i = 0; i < MAX_STRIKES; i += 1) {
    drawHeart(ctx, 968 + i * 30, HUD_H / 2 + 10, 18, i < MAX_STRIKES - world.strikes);
  }
  text(ctx, `SERVED ${world.served}`, 1120, HUD_H / 2, 16, '#ffffff', 800);
}

function drawBoard(ctx, world) {
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(0, HUD_H, VIEW.w, BOARD_H);
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, HUD_H, VIEW.w, 6);
  text(ctx, 'ORDER BOARD', 16, HUD_H + 22, 13, '#ffd9a0', 800);
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', 150, HUD_H + BOARD_H / 2 + 6, 16, '#e8d5b0', 600);
  }
  world.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, 150 + i * 280, HUD_H + 8, 268, BOARD_H - 16);
  });
}

function drawParticles(ctx, world) {
  for (const pt of world.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    text(ctx, f.text, f.x, f.y, 20, f.color, 800, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawHint(ctx, world) {
  // Bottom-left, clear of the serving window the chef stands at.
  ctx.fillStyle = 'rgba(34,48,60,0.75)';
  rr(ctx, 16, VIEW.h - 34, 420, 26, 8);
  ctx.fill();
  text(ctx, 'WASD move  •  E use (hold to chop)  •  Click a station', 28, VIEW.h - 21, 12, '#ffffff', 600);
}

export function render(ctx, world) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawHud(ctx, world);
  drawBoard(ctx, world);
  drawFloor(ctx);
  drawDecor(ctx);
  for (const s of STATIONS) drawStation(ctx, world, s);
  drawParticles(ctx, world);
  drawChef(ctx, world);
  if (world.screen === 'play') drawHint(ctx, world);
}

export function renderTitle(ctx, world) {
  render(ctx, world);
  ctx.fillStyle = 'rgba(20,28,36,0.72)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#fffdf5';
  rr(ctx, VIEW.w / 2 - 380, 130, 760, 460, 18);
  ctx.fill();
  ctx.strokeStyle = '#ffd93d';
  ctx.lineWidth = 4;
  rr(ctx, VIEW.w / 2 - 380, 130, 760, 460, 18);
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', VIEW.w / 2, 190, 52, '#c0392b', 800, 'center');
  text(ctx, 'A tiny kitchen. A lunch rush. One very busy chef — you.', VIEW.w / 2, 236, 18, '#555', 600, 'center');
  const steps = [
    '1.  Grab ingredients from the crates up top.',
    '2.  Chop tomato, lettuce & onion on the boards (hold E).',
    '3.  Grill patties — take them off before they burn!',
    '4.  Stack it all on a plate at the assembly counter.',
    '5.  Serve at the window before the order walks out.',
  ];
  steps.forEach((s, i) => text(ctx, s, VIEW.w / 2, 286 + i * 30, 17, '#333', 600, 'center'));
  text(ctx, '3 strikes and the shift ends. 180 seconds. Good luck, chef!', VIEW.w / 2, 452, 16, '#c0392b', 700, 'center');
  ctx.fillStyle = '#58b368';
  rr(ctx, VIEW.w / 2 - 150, 486, 300, 56, 12);
  ctx.fill();
  text(ctx, 'START SHIFT  (Enter)', VIEW.w / 2, 515, 20, '#ffffff', 800, 'center');
  text(ctx, 'WASD / Arrows to move  •  E to use  •  Click a station to walk there', VIEW.w / 2, 566, 13, '#888', 600, 'center');
}

export function renderGameOver(ctx, world) {
  render(ctx, world);
  ctx.fillStyle = 'rgba(20,28,36,0.72)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#fffdf5';
  rr(ctx, VIEW.w / 2 - 340, 150, 680, 420, 18);
  ctx.fill();
  ctx.strokeStyle = '#ffd93d';
  ctx.lineWidth = 4;
  rr(ctx, VIEW.w / 2 - 340, 150, 680, 420, 18);
  ctx.stroke();
  text(ctx, world.overReason || 'Shift complete!', VIEW.w / 2, 205, 36, '#c0392b', 800, 'center');
  const stars = starsFor(world.score);
  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.translate(VIEW.w / 2 - 70 + i * 70, 265);
    ctx.scale(2.4, 2.4);
    ctx.beginPath();
    for (let k = 0; k < 10; k += 1) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const r = k % 2 === 0 ? 12 : 5;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = i < stars ? '#ffd93d' : '#d7dee8';
    ctx.fill();
    ctx.restore();
  }
  const rows = [
    ['Score', `${world.score}`],
    ['Coins earned', `${world.coins}`],
    ['Dishes served', `${world.served}`],
    ['Best combo', `x${world.bestCombo}`],
    ['Orders walked out', `${world.expiredCount}`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, VIEW.w / 2 - 200, 330 + i * 32, 18, '#555', 600);
    text(ctx, value, VIEW.w / 2 + 200, 330 + i * 32, 18, '#222', 800, 'right');
  });
  text(ctx, 'Press R to cook again', VIEW.w / 2, 520, 16, '#888', 600, 'center');
}
