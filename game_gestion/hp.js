// Gestionnaire de PV — Survival Park

const entities = new Map();
let nextId = 1;

export function createEntity(name, maxHp) {
  if (maxHp < 1) maxHp = 1;
  const id = nextId++;
  entities.set(id, { id, name, maxHp, hp: maxHp, log: [] });
  return id;
}

export function removeEntity(id) {
  entities.delete(id);
}

export function damage(id, amount) {
  const e = _get(id);
  if (!e || e.hp === 0) return;
  amount = Math.max(0, amount);
  e.hp = Math.max(0, e.hp - amount);
  e.log.unshift(`-${amount} HP → ${e.hp}`);
  if (e.hp === 0) e.log.unshift('MORT');
}

export function heal(id, amount) {
  const e = _get(id);
  if (!e || e.hp === 0) return;
  amount = Math.max(0, amount);
  e.hp = Math.min(e.maxHp, e.hp + amount);
  e.log.unshift(`+${amount} HP → ${e.hp}`);
}

export function reset(id) {
  const e = _get(id);
  if (!e) return;
  e.hp = e.maxHp;
  e.log.unshift('Réinitialisation');
}

export function getHp(id)     { return _get(id)?.hp ?? null; }
export function getMaxHp(id)  { return _get(id)?.maxHp ?? null; }
export function isDead(id)    { return _get(id)?.hp === 0; }
export function getStatus(id) {
  const e = _get(id);
  if (!e) return null;
  const pct = e.hp / e.maxHp;
  if (pct === 0)    return 'dead';
  if (pct <= 0.25)  return 'danger';
  if (pct <= 0.50)  return 'warning';
  return 'healthy';
}
export function getLog(id, limit = 10) {
  return _get(id)?.log.slice(0, limit) ?? [];
}
export function getAll() {
  return [...entities.values()].map(e => ({ ...e, log: [...e.log] }));
}

function _get(id) { return entities.get(id) ?? null; }
