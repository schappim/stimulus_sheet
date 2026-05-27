/* Portal — move a sheet wrapper to <body>.
 *
 * A bottom sheet rendered inside a Turbo frame (or any element with a
 * transformed/isolated ancestor) is trapped inside that ancestor's
 * stacking context, so `position: fixed` + z-index can't lift it above
 * the rest of the chrome. Portaling the wrapper to <body> moves it to
 * the viewport's stacking context, where fixed positioning works as
 * documented and the sheet outlives the host frame's lifetime.
 *
 * The price you pay: when the host frame re-renders, the *new* sheet
 * wrapper is rendered back inside the frame; the *old* body-level copy
 * lingers until its Stimulus disconnect fires. We solve this by giving
 * each sheet a stable `slot` (its sheet-id) and evicting any prior
 * body-level wrapper with the same slot before lifting the fresh one.
 *
 * No Turbo lifecycle hooks here — portal()/unportal() are called by the
 * sheet controller in connect()/disconnect(). That's enough: Stimulus
 * re-connects a fresh controller when Turbo rebuilds the frame, and
 * the controller's connect calls portal() which evicts the stale copy.
 *
 * NOTE: this whole module is a no-op in environments without a
 * document (e.g. SSR / node tests that don't load jsdom). */

const SLOT_ATTR = 'data-ss-portal-slot';

export function portal(element, slot) {
  if (!element || !slot) return;
  if (typeof document === 'undefined') return;
  if (!document.body) return;

  element.setAttribute(SLOT_ATTR, slot);

  // Already at body, same slot — nothing to do (idempotent).
  if (element.parentElement === document.body) return;

  // Evict any prior body-level wrapper that owns this slot. Usually
  // this is the stale wrapper from a previous Turbo render — its
  // controller's disconnect hasn't fired yet. By removing it before
  // moving the fresh wrapper in we guarantee one body-level wrapper
  // per slot at all times.
  const stale = document.body.querySelector(
    `:scope > [${SLOT_ATTR}="${cssEscape(slot)}"]`
  );
  if (stale && stale !== element) stale.remove();

  document.body.appendChild(element);
}

export function unportal(element) {
  if (!element) return;
  if (typeof document === 'undefined') return;
  if (!document.body) return;
  // Only remove if we still own a body-level slot — host code may have
  // already moved or re-parented the element by the time disconnect
  // runs (e.g. a Turbo cache step). Being defensive here is cheap.
  if (element.parentElement === document.body && element.hasAttribute(SLOT_ATTR)) {
    element.remove();
  }
}

/* CSS.escape isn't universally available (older WKWebViews), so fall
 * back to a conservative ASCII escape for the slot id. We control the
 * input enough (sheet-ids are normally [a-zA-Z0-9_-]) that this is
 * sufficient — and avoids depending on a polyfill in the IIFE bundle. */
function cssEscape(s) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(s);
  }
  return String(s).replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}
