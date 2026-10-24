// Sauvegarde locale (localStorage de l'iPhone). Aucune donnée ne quitte l'appareil.

import { upgrade } from './engine/game.js';

const KEYS = {
  game: 'culturisk.game.v1',
  settings: 'culturisk.settings.v1',
  seen: 'culturisk.seen.v1',
  lastSetup: 'culturisk.lastSetup.v1',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function loadGame() {
  const g = read(KEYS.game, null);
  if (!g || !g.teams) return null;
  return upgrade(g);
}
export const saveGame = (state) => write(KEYS.game, state);
export const clearGame = () => write(KEYS.game, null);

export const DEFAULT_SETTINGS = {
  sound: true,
  haptics: true,
  reduceMotion: false,
};
export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) });
export const saveSettings = (s) => write(KEYS.settings, s);

// Questions déjà posées lors des parties précédentes, pour varier les tirages.
export const loadSeen = () => read(KEYS.seen, []);
export function markSeen(id) {
  const seen = loadSeen();
  if (!seen.includes(id)) {
    seen.push(id);
    write(KEYS.seen, seen.slice(-2000));
  }
}
export const clearSeen = () => write(KEYS.seen, null);

export const loadLastSetup = () => read(KEYS.lastSetup, null);
export const saveLastSetup = (s) => write(KEYS.lastSetup, s);
