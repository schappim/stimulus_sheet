/* Tiny helpers for surviving Turbo / Hotwire Native page lifecycles.
 *
 * Why this file exists:
 *
 *   - DOMContentLoaded fires *once* per real page load. Turbo navigations
 *     (turbo:visit, frame renders) don't re-fire it, so anything wired
 *     on DOMContentLoaded won't run after a Turbo nav. We never wait for
 *     DOMContentLoaded; controllers do their work on Stimulus connect.
 *
 *   - Hotwire Native runs inside WKWebView with `body:has(...)` selectors
 *     known to crash under load. The sheet controller uses a marker
 *     class on <body> instead, toggled in JS — these helpers wrap the
 *     toggle so callers can't typo the class name. */

const BODY_OPEN_CLASS = 'ss-sheet-open';

export function markBodyOpen() {
  if (typeof document === 'undefined' || !document.body) return;
  document.body.classList.add(BODY_OPEN_CLASS);
}

export function markBodyClosed({ anyStillOpen } = {}) {
  if (typeof document === 'undefined' || !document.body) return;
  // We only clear the marker when no other sheet is open. Callers pass
  // the live "any other sheet open?" check via the option so this
  // module stays free of registry imports (avoids a cycle).
  if (!anyStillOpen) document.body.classList.remove(BODY_OPEN_CLASS);
}

export function isBodyOpen() {
  if (typeof document === 'undefined' || !document.body) return false;
  return document.body.classList.contains(BODY_OPEN_CLASS);
}

/* Schedule a callback on the next animation frame, with a setTimeout
 * fallback for environments without rAF (jsdom-without-rAF, some
 * pre-rendered Hotwire Native pages). Returns a cancel() function so
 * callers can revoke the schedule on disconnect. */
export function nextFrame(fn) {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(fn);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(fn, 16);
  return () => clearTimeout(id);
}
