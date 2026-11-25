// Sizzle & Serve — keyboard and mouse input. One clear job: turn key presses
// and clicks into the {mx, my, interactHeld, interactPressed} the world reads.
export function createInput() {
  return {
    keys: new Set(),
    mx: 0,
    my: 0,
    interactHeld: false,
    interactPressed: false,
    click: null, // {x, y} in view coordinates, consumed by main.js
    anyKey: false,
  };
}

const MOVE_KEYS = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

export function attachInput(input, canvas, toView) {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    input.keys.add(event.code);
    input.anyKey = true;
    if (event.code === 'KeyE' || event.code === 'Space') {
      input.interactHeld = true;
      input.interactPressed = true;
    }
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
    if (event.code === 'KeyE' || event.code === 'Space') input.interactHeld = false;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const point = toView(event.clientX - rect.left, event.clientY - rect.top);
    input.click = point;
    input.anyKey = true;
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.interactHeld = false;
  });
}

export function pollInput(input) {
  let mx = 0;
  let my = 0;
  for (const code of input.keys) {
    const move = MOVE_KEYS[code];
    if (move) {
      mx += move[0];
      my += move[1];
    }
  }
  input.mx = mx;
  input.my = my;
  const pressed = input.interactPressed;
  input.interactPressed = false;
  return { mx, my, interactHeld: input.interactHeld, interactPressed: pressed };
}
