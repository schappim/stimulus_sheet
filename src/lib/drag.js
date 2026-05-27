/* Drag handler for the bottom sheet.
 *
 * Single code path via Pointer Events — covers touch (iOS Safari and
 * WKWebView), mouse (desktop demos), and stylus. The legacy "register
 * touchstart AND mousedown AND maintain shared state" pattern blows
 * up on Hotwire Native because the WebKit touch + simulated mouse
 * events interact unpredictably; pointer events are the only sane API.
 *
 * KEY RULES (the reason this file is long enough to deserve comments):
 *
 *   1. Never preventDefault on pointerdown. A plain tap inside the
 *      sheet must fall through to click handlers on rows / Cancel
 *      buttons. Only call preventDefault on pointermove *after* the
 *      gesture has crossed the drag threshold.
 *
 *   2. The threshold is 6px. Below it we're still in tap territory.
 *
 *   3. In `full` mode, only handle drags that originate from the drag
 *      handle, or from the scroll area while it's already scrolled to
 *      the top (pull-down-to-close). Otherwise the user can't scroll
 *      the sheet's content without dismissing it.
 *
 *   4. Velocity-based snapping: a fast flick down closes, a fast flick
 *      up expands to full. Slow drags snap to whichever third of the
 *      sheet they finish in.
 *
 *   5. Capture the pointer with setPointerCapture so the gesture
 *      keeps firing even when the pointer leaves the sheet. iOS
 *      WKWebView is *mostly* happy with this, but we tolerate failure
 *      — older WebViews throw on setPointerCapture inside a passive
 *      handler.
 *
 *   6. Cleanly tear down on disconnect, on close, and on the
 *      occasional pointercancel that fires when the OS hijacks the
 *      touch (system gesture, scroll-to-top tap, etc.). */

const DRAG_THRESHOLD = 6;             // px
const FLICK_VELOCITY = 0.4;           // px/ms
const HALF_OFFSET = 0.55;             // sheet sits this far below 0 in `half`
const CLOSE_OVERSHOOT = 40;           // px past full height when closing

export function createDrag(host) {
  /* host shape (provided by SheetController):
   *   element       – the wrapper (the controller's element)
   *   sheetEl       – the inner .ss-sheet
   *   handleEl      – the drag handle (may be null)
   *   scrollEl      – the scrolling content region
   *   backdropEl    – the backdrop
   *   getState()    – 'closed' | 'half' | 'full'
   *   onSnap('half'|'full'|'closed')  – snap callback
   */

  let dragging = false;
  let confirmed = false;
  let pointerId = null;
  let startY = 0;
  let startTranslateY = 0;
  let startTime = 0;
  let winH = 0;
  let scrollDragMode = false;
  let scrollDragCommitted = false;

  function reset() {
    dragging = false;
    confirmed = false;
    pointerId = null;
    scrollDragMode = false;
    scrollDragCommitted = false;
  }

  function currentTranslateY(el) {
    // DOMMatrix() on a transform: none string evaluates to identity
    // (m42 = 0), which is what we want. Older Safari versions don't
    // expose DOMMatrix in workers but always do on the main thread.
    const t = window.getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    try {
      return new DOMMatrix(t).m42;
    } catch {
      // Final fallback — pull the translateY pixels out of a transform
      // like "matrix(1, 0, 0, 1, 0, 120)" by hand.
      const m = t.match(/matrix\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([-\d.]+)\)/);
      return m ? Number(m[1]) : 0;
    }
  }

  function onPointerDown(ev) {
    if (host.getState() === 'closed') return;
    if (!host.sheetEl || !host.sheetEl.contains(ev.target)) return;
    // Ignore secondary buttons (right-click, middle-click).
    if (ev.button != null && ev.button !== 0) return;

    const isHandle = host.handleEl && host.handleEl.contains(ev.target);

    if (host.getState() === 'full' && !isHandle) {
      // In full mode, only allow drag from the scroll area when it's
      // scrolled to the top — that's the pull-down-to-close gesture.
      if (!host.scrollEl || host.scrollEl.scrollTop > 0) return;
      scrollDragMode = true;
    } else {
      scrollDragMode = false;
    }

    dragging = true;
    confirmed = false;
    pointerId = ev.pointerId;
    startY = ev.clientY;
    startTime = Date.now();
    startTranslateY = currentTranslateY(host.sheetEl);
    winH = window.innerHeight;

    // Do NOT setPointerCapture here. Pointer capture retargets the
    // subsequent click event from the original tap target to the
    // captured element, which means a tap on a row inside the sheet
    // would lose its click and the row's Stimulus action would never
    // fire. We promote to a captured drag only after confirming the
    // gesture has crossed the drag threshold (in onPointerMove).
    //
    // No preventDefault here either — we don't know yet if this is a
    // tap or a drag.
  }

  function onPointerMove(ev) {
    if (!dragging) return;
    if (pointerId != null && ev.pointerId !== pointerId) return;

    const dy = ev.clientY - startY;

    if (!confirmed && Math.abs(dy) < DRAG_THRESHOLD) return;

    if (scrollDragMode && !scrollDragCommitted) {
      if (dy < -5) {
        // Pulling up while in full+scrollTop=0 — abandon and let scroll
        // take over.
        reset();
        return;
      }
      if (dy > 8) scrollDragCommitted = true;
      else return;
    }

    if (!confirmed) {
      confirmed = true;
      host.sheetEl.style.transition = 'none';
      // Now that we know it's a drag (not a tap), capture the pointer
      // so the gesture keeps tracking even when the finger leaves the
      // sheet. Best-effort: older WKWebViews throw on
      // setPointerCapture inside an active handler, and we're happy to
      // continue without capture in that case.
      try { host.sheetEl.setPointerCapture(pointerId); } catch { /* noop */ }
    }

    let newTranslate = startTranslateY + dy;
    if (newTranslate < 0) newTranslate = 0;
    host.sheetEl.style.transform = `translateY(${newTranslate}px)`;

    if (host.backdropEl) {
      const sheetH = winH * 0.9;
      const visible = sheetH - newTranslate;
      const progress = Math.max(0, Math.min(1, visible / sheetH));
      host.backdropEl.style.background = `rgba(0,0,0,${progress * 0.35})`;
    }

    if (ev.cancelable) ev.preventDefault();
  }

  function onPointerEnd(ev) {
    if (!dragging) return;
    if (pointerId != null && ev.pointerId !== pointerId) return;

    try { host.sheetEl.releasePointerCapture?.(ev.pointerId); } catch { /* noop */ }

    if (!confirmed) {
      // Plain tap — let click handlers fire on the underlying element.
      reset();
      return;
    }

    const dy = ev.clientY - startY;
    const sheetH = winH * 0.9;
    const elapsed = Date.now() - (startTime || Date.now());
    const velocity = dy / Math.max(elapsed, 1);
    const currentY = currentTranslateY(host.sheetEl);
    const snapHalf = sheetH * HALF_OFFSET;

    if (velocity < -FLICK_VELOCITY) {
      host.onSnap('full');
    } else if (velocity > FLICK_VELOCITY) {
      host.onSnap(startTranslateY < snapHalf * 0.5 ? 'half' : 'closed');
    } else {
      const halfwayClose = sheetH * 0.5;
      if (currentY > halfwayClose)         host.onSnap('closed');
      else if (currentY > snapHalf * 0.5)  host.onSnap('half');
      else                                  host.onSnap('full');
    }

    if (host.backdropEl) host.backdropEl.style.background = '';

    reset();
  }

  function onPointerCancel(ev) {
    if (!dragging) return;
    if (pointerId != null && ev.pointerId !== pointerId) return;
    // OS hijacked the touch — abandon mid-gesture without snapping.
    if (host.backdropEl) host.backdropEl.style.background = '';
    reset();
  }

  function attach() {
    if (!host.sheetEl) return;
    // pointermove must be active (not passive) so we can preventDefault
    // once the gesture is confirmed as a drag — otherwise the page
    // scrolls behind the sheet on iOS.
    host.sheetEl.addEventListener('pointerdown',   onPointerDown,   { passive: true });
    host.sheetEl.addEventListener('pointermove',   onPointerMove,   { passive: false });
    host.sheetEl.addEventListener('pointerup',     onPointerEnd,    { passive: true });
    host.sheetEl.addEventListener('pointercancel', onPointerCancel, { passive: true });
  }

  function detach() {
    if (!host.sheetEl) return;
    host.sheetEl.removeEventListener('pointerdown',   onPointerDown);
    host.sheetEl.removeEventListener('pointermove',   onPointerMove);
    host.sheetEl.removeEventListener('pointerup',     onPointerEnd);
    host.sheetEl.removeEventListener('pointercancel', onPointerCancel);
    reset();
  }

  return { attach, detach, reset, HALF_OFFSET, CLOSE_OVERSHOOT };
}
