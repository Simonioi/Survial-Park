// HP manager - Survival Park

const entities = new Map();
let nextId = 1;

function createEntity(name, maxHp) {
  if (maxHp < 1) maxHp = 1;
  const id = nextId++;
  entities.set(id, { id, name, maxHp, hp: maxHp, log: [] });
  return id;
}

function removeEntity(id) {
  entities.delete(id);
}

function damage(id, amount) {
  const e = _get(id);
  if (!e || e.hp === 0) return;
  amount = Math.max(0, amount);
  e.hp = Math.max(0, e.hp - amount);
  e.log.unshift(`-${amount} HP → ${e.hp}`);
  if (e.hp === 0) e.log.unshift('MORT');
}

function heal(id, amount) {
  const e = _get(id);
  if (!e || e.hp === 0) return;
  amount = Math.max(0, amount);
  e.hp = Math.min(e.maxHp, e.hp + amount);
  e.log.unshift(`+${amount} HP → ${e.hp}`);
}

function reset(id) {
  const e = _get(id);
  if (!e) return;
  e.hp = e.maxHp;
  e.log.unshift('Réinitialisation');
}

function getHp(id)     { return _get(id)?.hp ?? null; }
function getMaxHp(id)  { return _get(id)?.maxHp ?? null; }
function isDead(id)    { return _get(id)?.hp === 0; }
function getStatus(id) {
  const e = _get(id);
  if (!e) return null;
  const pct = e.hp / e.maxHp;
  if (pct === 0)    return 'dead';
  if (pct <= 0.25)  return 'danger';
  if (pct <= 0.50)  return 'warning';
  return 'healthy';
}
function getLog(id, limit = 10) {
  return _get(id)?.log.slice(0, limit) ?? [];
}
function getAll() {
  return [...entities.values()].map(e => ({ ...e, log: [...e.log] }));
}

function _get(id) { return entities.get(id) ?? null; }

// Expose as global for non-module scripts
if (typeof window !== 'undefined') {
  window.hp = {
    createEntity,
    removeEntity,
    damage,
    heal,
    reset,
    getHp,
    getMaxHp,
    isDead,
    getStatus,
    getLog,
    getAll
  };
}

// Export for ES6 modules (optional, for future use)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createEntity,
    removeEntity,
    damage,
    heal,
    reset,
    getHp,
    getMaxHp,
    isDead,
    getStatus,
    getLog,
    getAll
  };
}
