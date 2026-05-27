/* bridge-sheet — Hotwire Native bridge component.
 *
 * Opt-in. When mounted, this controller asks the native shell to show
 * a UIActionSheet / Android BottomSheet instead of the web sheet. If
 * the shell isn't present (web browser, non-native demo), it falls
 * through to the regular `sheet` controller's web rendering.
 *
 * The contract matches the BridgeComponent pattern used in
 * Hotwire-Native iOS / Android (see hotwired/hotwire-native-bridge).
 * We don't import from that package directly — it's an optional peer —
 * we just emit the document-level event the native shell listens for.
 * Hosts that want the typed BridgeComponent flavour can subclass this
 * controller and override `_send`.
 *
 * Markup:
 *   <button data-controller="bridge-sheet"
 *           data-bridge-sheet-id-value="myMenu"
 *           data-bridge-sheet-sections-value='[{"title":"Edit","url":"/edit"}]'
 *           data-action="click->bridge-sheet#show">
 *     Edit
 *   </button>
 */

import { Controller } from '@hotwired/stimulus';
import { getSheet } from '../lib/registry.js';

export default class BridgeSheetController extends Controller {
  static values = {
    id:       { type: String, default: '' },
    sections: { type: Array,  default: [] },
    expanded: { type: Boolean, default: false },
  };

  show(event) {
    if (this._isNative()) {
      // Hand the open over to the native shell. The shell is expected
      // to either navigate (window.Turbo.visit) or post back a result.
      this._send('show', {
        id:       this.idValue,
        sections: this.sectionsValue,
      });
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      return;
    }

    // Web fallback — open the matching web sheet, if any.
    const ctrl = getSheet(this.idValue);
    if (ctrl) ctrl.open({ expanded: this.expandedValue });
  }

  _isNative() {
    // Hotwire Native marks the document on boot. Be tolerant of older
    // shells that only set `window.webkit.messageHandlers`.
    if (typeof document === 'undefined') return false;
    if (document.documentElement.dataset.hotwireNative === 'true') return true;
    if (typeof window === 'undefined') return false;
    return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers['hotwire-native']);
  }

  _send(name, payload) {
    document.dispatchEvent(new CustomEvent('hotwire-native:bridge', {
      detail: { component: 'sheet', name, payload },
    }));
  }
}
