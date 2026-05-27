/* sheet — the bottom-sheet controller.
 *
 * Lives on the wrapper element. Manages open/close/half/full state,
 * drag-to-dismiss, optional portal-to-body, and (de)registration so
 * `sheet-trigger` controllers and `window.StimulusSheet.open(id)`
 * can find it by id.
 *
 * Markup contract (rendered by ./demo/* and the Rails _sheet partial):
 *
 *   <div data-controller="sheet"
 *        data-sheet-id-value="myMenu"
 *        data-sheet-portal-value="true"        // optional, default false
 *        data-sheet-half-offset-value="55"     // optional, percent of sheet
 *        data-sheet-open-on-connect-value="false">
 *     <div class="ss-sheet-backdrop"
 *          data-sheet-target="backdrop"
 *          data-action="click->sheet#close"></div>
 *     <div class="ss-sheet" data-sheet-target="sheet">
 *       <div class="ss-sheet-handle" data-sheet-target="handle"></div>
 *       <div class="ss-sheet-scroll" data-sheet-target="scroll">
 *         <!-- content -->
 *       </div>
 *     </div>
 *   </div>
 *
 * Actions wired by the host:
 *   click->sheet#close       (rows that dismiss the sheet)
 *   click->sheet#expand      (rows that promote half → full)
 *   click->sheet#half        (rows that demote full → half)
 *   click->sheet#toggle      (used by the row that opens half/full toggles) */

import { Controller } from '@hotwired/stimulus';
import { registerSheet, unregisterSheet, listSheetIds, getSheet } from '../lib/registry.js';
import { portal } from '../lib/portal.js';
import { createDrag } from '../lib/drag.js';
import { markBodyOpen, markBodyClosed, nextFrame } from '../lib/turbo_safe.js';

const HIDE_AFTER_CLOSE_MS = 380;
const OPEN_TRANSITION = 'transform .35s cubic-bezier(.32,.72,0,1)';

export default class SheetController extends Controller {
  static targets = ['sheet', 'backdrop', 'handle', 'scroll'];
  static values = {
    id:              { type: String,  default: '' },
    portal:          { type: Boolean, default: false },
    halfOffset:      { type: Number,  default: 55 },     // percent of sheet height
    openOnConnect:   { type: Boolean, default: false },
    initialExpanded: { type: Boolean, default: false },
    dismissable:     { type: Boolean, default: true },   // false → backdrop click doesn't close
  };

  initialize() {
    this._state = 'closed';
    this._hideTimer = null;
    this._cancelOpenFrame = null;
    this._drag = null;
  }

  connect() {
    this.element.classList.add('ss-sheet-wrapper');

    if (this.hasSheetTarget) {
      this.sheetTarget.classList.add('ss-sheet');
      // Pin the closed position before we ever animate. Without this,
      // the first open animates from translate(0) → translate(0) and
      // looks like an instant pop-in.
      this._parkClosed(false);
    }
    if (this.hasBackdropTarget) this.backdropTarget.classList.add('ss-sheet-backdrop');
    if (this.hasHandleTarget)   this.handleTarget.classList.add('ss-sheet-handle');
    if (this.hasScrollTarget)   this.scrollTarget.classList.add('ss-sheet-scroll');

    if (this.portalValue) portal(this.element, this._slot());

    registerSheet(this._sheetId(), this);

    // Imperative API surface — host JS can grab `el.sheetApi` to drive
    // the sheet without going through Stimulus actions.
    this.element.sheetApi = this._buildApi();

    if (this.hasSheetTarget) {
      this._drag = createDrag({
        element:    this.element,
        sheetEl:    this.sheetTarget,
        handleEl:   this.hasHandleTarget   ? this.handleTarget   : null,
        scrollEl:   this.hasScrollTarget   ? this.scrollTarget   : null,
        backdropEl: this.hasBackdropTarget ? this.backdropTarget : null,
        getState:   () => this._state,
        onSnap:     (target) => this._snap(target),
      });
      this._drag.attach();
    }

    this._dispatch('connected');

    if (this.openOnConnectValue) {
      // Defer one frame so the closed parking position has time to
      // commit before the open transition starts.
      this._cancelOpenFrame = nextFrame(() => {
        this._cancelOpenFrame = null;
        this.open({ expanded: this.initialExpandedValue });
      });
    }
  }

  disconnect() {
    if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }
    if (this._cancelOpenFrame) { this._cancelOpenFrame(); this._cancelOpenFrame = null; }
    this._drag?.detach?.();
    this._drag = null;

    unregisterSheet(this._sheetId(), this);
    // NOTE: we deliberately do NOT call unportal() here. Moving an
    // element with appendChild() can trigger a disconnect/reconnect
    // pass under Stimulus's MutationObserver — if disconnect then
    // removed the element from body the controller would never come
    // back. The portal layer is already self-healing: when a fresh
    // wrapper portals on the next render it evicts the prior wrapper
    // sharing the same slot. The only thing left to handle is "host
    // code explicitly removed the wrapper from the DOM" — in which
    // case the element is already gone by the time disconnect runs,
    // so unportal would be a no-op anyway.

    // If this was the open sheet, drop the body marker (only when no
    // other sheet is left open).
    if (this._state !== 'closed') {
      markBodyClosed({ anyStillOpen: anyOtherSheetOpen(this) });
    }

    delete this.element.sheetApi;
    this._dispatch('disconnected');
  }

  /* ---------------- Stimulus actions ---------------- */

  open(eventOrOptions) {
    const expanded = readBoolOption(eventOrOptions, 'expanded', this.initialExpandedValue);
    this._openInternal({ expanded });
  }

  close() {
    if (this._state === 'closed') return;
    this._closeInternal();
  }

  expand()  { if (this._state !== 'closed') this._snap('full'); }
  half()    { if (this._state !== 'closed') this._snap('half'); }

  toggle(eventOrOptions) {
    if (this._state === 'closed') this.open(eventOrOptions);
    else this.close();
  }

  /* ---------------- internal state machine ---------------- */

  _openInternal({ expanded }) {
    if (!this.hasSheetTarget) return;

    // Cancel any pending hide-on-close so a quick re-open isn't reset
    // to invisible by a stale timer.
    if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }

    const sheet = this.sheetTarget;
    const sheetH = sheet.offsetHeight || window.innerHeight * 0.9;

    // Park (without a transition) at the off-screen position, so the
    // subsequent open animates from off-screen up — not from wherever
    // the previous render left it.
    sheet.style.transition = 'none';
    sheet.style.transform = `translateY(${sheetH + 40}px)`;
    sheet.style.visibility = 'visible';
    if (this.hasBackdropTarget) this.backdropTarget.style.visibility = 'visible';
    // Force reflow so the browser commits the parked frame before we
    // change the transition.
    void sheet.offsetHeight; // eslint-disable-line no-unused-expressions

    sheet.style.transition = OPEN_TRANSITION;
    if (expanded) {
      sheet.style.transform = 'translateY(0px)';
      sheet.classList.remove('ss-sheet-half');
      sheet.classList.add('ss-sheet-full');
      this._state = 'full';
    } else {
      sheet.style.transform = `translateY(${sheetH * (this.halfOffsetValue / 100)}px)`;
      sheet.classList.remove('ss-sheet-full');
      sheet.classList.add('ss-sheet-half');
      this._state = 'half';
    }
    if (this.hasBackdropTarget) this.backdropTarget.classList.add('ss-sheet-backdrop-visible');

    markBodyOpen();
    this._dispatch('opened', { state: this._state });
  }

  _closeInternal() {
    if (!this.hasSheetTarget) return;

    const sheet = this.sheetTarget;
    const sheetH = sheet.offsetHeight || window.innerHeight * 0.9;
    sheet.style.transition = OPEN_TRANSITION;
    // The +40px overshoot keeps the box-shadow's upward blur out of
    // the viewport once the sheet has closed.
    sheet.style.transform = `translateY(${sheetH + 40}px)`;
    if (this.hasBackdropTarget) this.backdropTarget.classList.remove('ss-sheet-backdrop-visible');

    this._state = 'closed';

    if (this._hideTimer) clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => {
      sheet.style.visibility = 'hidden';
      if (this.hasBackdropTarget) this.backdropTarget.style.visibility = 'hidden';
      this._hideTimer = null;
    }, HIDE_AFTER_CLOSE_MS);

    markBodyClosed({ anyStillOpen: anyOtherSheetOpen(this) });
    this._drag?.reset?.();
    this._dispatch('closed');
  }

  _snap(target) {
    if (!this.hasSheetTarget) return;
    if (target === 'closed') return this._closeInternal();
    const sheet = this.sheetTarget;
    sheet.style.transition = OPEN_TRANSITION;
    if (target === 'full') {
      sheet.style.transform = 'translateY(0px)';
      sheet.classList.add('ss-sheet-full');
      sheet.classList.remove('ss-sheet-half');
      this._state = 'full';
    } else {
      const sheetH = sheet.offsetHeight || window.innerHeight * 0.9;
      sheet.style.transform = `translateY(${sheetH * (this.halfOffsetValue / 100)}px)`;
      sheet.classList.add('ss-sheet-half');
      sheet.classList.remove('ss-sheet-full');
      this._state = 'half';
    }
    this._drag?.reset?.();
    this._dispatch('snap', { state: this._state });
  }

  _parkClosed(transition) {
    const sheet = this.sheetTarget;
    sheet.style.transition = transition ? OPEN_TRANSITION : 'none';
    sheet.style.transform = `translateY(120vh)`;
    sheet.style.visibility = 'hidden';
    if (this.hasBackdropTarget) this.backdropTarget.style.visibility = 'hidden';
  }

  /* ---------------- helpers ---------------- */

  _sheetId() {
    return this.idValue || this.element.id || '';
  }

  _slot() {
    return this._sheetId() || `ss-anon-${this.element.dataset.ssSlotSeq || (this.element.dataset.ssSlotSeq = Math.random().toString(36).slice(2, 9))}`;
  }

  _dispatch(name, detail = {}) {
    this.element.dispatchEvent(new CustomEvent(`sheet:${name}`, {
      bubbles: true,
      detail: { id: this._sheetId(), sheet: this, ...detail },
    }));
  }

  _buildApi() {
    return {
      open:    (opts) => this.open(opts),
      close:   () => this.close(),
      expand:  () => this.expand(),
      half:    () => this.half(),
      toggle:  (opts) => this.toggle(opts),
      state:   () => this._state,
      isOpen:  () => this._state !== 'closed',
      element: this.element,
      sheetElement: this.hasSheetTarget ? this.sheetTarget : null,
    };
  }
}

/* True if any sheet *other than* `self` is currently open. Used to
 * decide whether to clear the body `.ss-sheet-open` marker. Centralised
 * here so we don't fan registry lookups through three files. */
function anyOtherSheetOpen(self) {
  for (const id of listSheetIds()) {
    const ctrl = getSheet(id);
    if (!ctrl || ctrl === self) continue;
    if (ctrl._state && ctrl._state !== 'closed') return true;
  }
  return false;
}

function readBoolOption(eventOrOptions, key, fallback) {
  if (!eventOrOptions) return fallback;
  // Stimulus actions hand us a DOM event; the `params` API exposes the
  // associated data-sheet-*-param attributes on `event.params`.
  if (typeof Event !== 'undefined' && eventOrOptions instanceof Event) {
    const p = eventOrOptions.params || {};
    if (Object.prototype.hasOwnProperty.call(p, key)) return p[key] === true || p[key] === 'true';
    return fallback;
  }
  if (typeof eventOrOptions === 'object') {
    if (Object.prototype.hasOwnProperty.call(eventOrOptions, key)) return !!eventOrOptions[key];
  }
  return fallback;
}
