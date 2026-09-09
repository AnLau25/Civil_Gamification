/**
 * storage.js — the only module that touches localStorage.
 * Every read has a default and every call is safe in private browsing.
 */

export function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;   // quota exceeded or storage disabled
  }
}

export function remove(key) {
  try { localStorage.removeItem(key); return true; }
  catch { return false; }
}
