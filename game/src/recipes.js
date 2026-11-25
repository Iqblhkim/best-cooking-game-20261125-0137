// Sizzle & Serve — ingredients and recipes. One clear job: what a dish is made
// of, what it is worth, and how an order is matched against a plate.
export const INGREDIENTS = {
  bun: { name: 'Bun', prep: 'none', color: '#e8b25c' },
  patty: { name: 'Patty', prep: 'grill', color: '#8a5a33' },
  tomato: { name: 'Tomato', prep: 'chop', color: '#e74c3c' },
  lettuce: { name: 'Lettuce', prep: 'chop', color: '#58b368' },
  cheese: { name: 'Cheese', prep: 'none', color: '#f5c542' },
  onion: { name: 'Onion', prep: 'chop', color: '#b388eb' },
};

// A recipe's `needs` are "kind:state" strings; a plate matches when its items
// are exactly the same multiset. `state` is 'raw' for no-prep ingredients,
// 'chopped' for chopped ones and 'cooked' for a grilled patty.
export const RECIPES = {
  salad: {
    name: 'Garden Salad', needs: ['tomato:chopped', 'lettuce:chopped'],
    base: 40, coins: 6, color: '#58b368',
  },
  burger: {
    name: 'Classic Burger', needs: ['bun:raw', 'patty:cooked', 'lettuce:chopped'],
    base: 60, coins: 8, color: '#e8b25c',
  },
  cheese: {
    name: 'Cheese Burger', needs: ['bun:raw', 'patty:cooked', 'cheese:raw', 'tomato:chopped'],
    base: 80, coins: 10, color: '#f5c542',
  },
  veggie: {
    name: 'Veggie Stack', needs: ['bun:raw', 'lettuce:chopped', 'tomato:chopped', 'cheese:raw'],
    base: 70, coins: 9, color: '#7bc96f',
  },
  double: {
    name: 'Double Trouble', needs: ['bun:raw', 'patty:cooked', 'patty:cooked', 'cheese:raw'],
    base: 100, coins: 13, color: '#c0392b',
  },
};

export function itemKey(item) {
  return `${item.kind}:${item.state}`;
}

export function plateKey(items) {
  return items.map(itemKey).sort().join('+');
}

export function recipeKey(recipeId) {
  return [...RECIPES[recipeId].needs].sort().join('+');
}

export function plateMatchesRecipe(items, recipeId) {
  return plateKey(items) === recipeKey(recipeId);
}

export function makeItem(kind, state = 'raw') {
  return { kind, state };
}

export function makePlate() {
  return { type: 'plate', items: [] };
}

export function isPlate(thing) {
  return thing !== null && typeof thing === 'object' && thing.type === 'plate';
}
