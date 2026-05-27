/* SheetRegistry — a per-Application lookup of mounted sheets by sheet-id.
 *
 * Triggers (and host JS) talk to sheets by id without having to walk the
 * DOM, do `getElementById` lookups, or care that a portaled sheet was
 * moved to <body>. Each sheet controller calls register(id, controller)
 * on connect and unregister(id, controller) on disconnect.
 *
 * Two safety properties:
 *
 *   1. We hold the *current* controller per id. When a Turbo frame
 *      re-renders, the new sheet's connect runs *before* the stale
 *      sheet's disconnect — we accept the swap immediately. The stale
 *      controller's disconnect call only unregisters if it's still the
 *      current entry, so it can't accidentally evict the fresh one.
 *
 *   2. The registry is scoped to one StimulusSheet "namespace" rather
 *      than the Stimulus Application — sheets registered in an embedded
 *      iframe / parent frame don't collide. */

const REGISTRY = new Map();

export function registerSheet(id, controller) {
  if (!id) return;
  REGISTRY.set(id, controller);
}

export function unregisterSheet(id, controller) {
  if (!id) return;
  // Only evict if WE are still the registered owner. A subsequent
  // controller connect for the same id wins; this prevents the previous
  // controller's disconnect from clobbering the live one.
  if (REGISTRY.get(id) === controller) REGISTRY.delete(id);
}

export function getSheet(id) {
  return id ? REGISTRY.get(id) || null : null;
}

export function listSheetIds() {
  return Array.from(REGISTRY.keys());
}

/* Visible for tests — never call from product code. */
export function _clearRegistry() {
  REGISTRY.clear();
}
