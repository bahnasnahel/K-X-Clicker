// Petit bus d'evenements pour decoupler les modules (taches, clients, succes...).
const handlers = {};
export const on = (name, fn) => { (handlers[name] ||= []).push(fn); };
export const emit = (name, data) => { (handlers[name] || []).forEach((fn) => fn(data)); };
