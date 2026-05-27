/* sheet-trigger — generic "open this sheet" button.
 *
 * Usage:
 *   <button data-controller="sheet-trigger"
 *           data-sheet-trigger-id-value="myMenu"
 *           data-sheet-trigger-expanded-value="true"
 *           data-action="click->sheet-trigger#open">
 *     Open
 *   </button>
 *
 * The trigger looks the sheet up in the in-memory registry (set by the
 * sheet controller's connect). This means:
 *
 *   - the trigger works even when the sheet has been portaled to <body>
 *     (DOM-id lookup wouldn't because Turbo's frame replace leaves a
 *     stale body-level copy without the original id);
 *   - the trigger doesn't need to be a Stimulus outlet on the sheet
 *     (outlets break across portal moves);
 *   - it works across turbo-frame boundaries with no extra wiring. */

import { Controller } from '@hotwired/stimulus';
import { getSheet, listSheetIds } from '../lib/registry.js';

export default class SheetTriggerController extends Controller {
  static values = {
    id:        { type: String,  default: '' },
    expanded:  { type: Boolean, default: false },
  };

  open(event)   { this._invoke('open',   event); }
  close(event)  { this._invoke('close',  event); }
  toggle(event) { this._invoke('toggle', event); }

  _invoke(verb, event) {
    const id = this.idValue || this.element.dataset.sheetId || '';
    const ctrl = getSheet(id);
    if (!ctrl) {
      // Surface the miss so the host can debug — but don't throw. A
      // missing sheet is almost always a wiring bug (id typo, sheet
      // partial not rendered on this page) rather than a runtime
      // crash, and throwing here would break any other click handlers
      // on the same element.
      // eslint-disable-next-line no-console
      console.warn(`[stimulus_sheet] trigger could not find sheet id="${id}". Mounted ids:`, listSheetIds());
      return;
    }
    const opts = { expanded: this.expandedValue };
    if (verb === 'open')        ctrl.open(opts);
    else if (verb === 'close')  ctrl.close();
    else                        ctrl.toggle(opts);

    // Allow `data-action="click->sheet-trigger#open"` on an <a href>
    // without triggering navigation.
    if (event && typeof event.preventDefault === 'function' && this.element.tagName === 'A') {
      event.preventDefault();
    }
  }
}
