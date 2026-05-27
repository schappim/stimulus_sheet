import { Application } from '@hotwired/stimulus';
import './styles/stimulus_sheet.css';

import SheetController         from './controllers/sheet_controller.js';
import SheetTriggerController  from './controllers/sheet_trigger_controller.js';
import BridgeSheetController   from './controllers/bridge_sheet_controller.js';

import { getSheet, listSheetIds } from './lib/registry.js';

export {
  SheetController,
  SheetTriggerController,
  BridgeSheetController,
  getSheet,
  listSheetIds,
};

/* Register every controller on a Stimulus Application and return it.
 *
 *   StimulusSheet.start()              // boot a new Application
 *   StimulusSheet.start(myApp)         // attach to an existing one (Rails / importmap)
 *
 * Idempotent at the controller level — Stimulus will warn if you re-register
 * the same identifier, but the window-level guard at the bottom ensures the
 * IIFE bundle doesn't double-start when included on two script tags. */
export function start(app) {
  const application = app ?? Application.start();
  application.register('sheet',         SheetController);
  application.register('sheet-trigger', SheetTriggerController);
  application.register('bridge-sheet',  BridgeSheetController);
  return application;
}

/* Imperative API surface — handy for hosts that prefer JS over data-action.
 *
 *   StimulusSheet.open("myMenu", { expanded: true })
 *   StimulusSheet.close("myMenu")
 *   StimulusSheet.toggle("myMenu")
 */
export function open(id, options)  { getSheet(id)?.open(options); }
export function close(id)          { getSheet(id)?.close(); }
export function toggle(id, options){ getSheet(id)?.toggle(options); }
export function isOpen(id)         { const c = getSheet(id); return !!(c && c._state && c._state !== 'closed'); }

const StimulusSheet = {
  start,
  open,
  close,
  toggle,
  isOpen,
  getSheet,
  listSheetIds,
  SheetController,
  SheetTriggerController,
  BridgeSheetController,
};

export default StimulusSheet;

if (typeof window !== 'undefined' && !window.__stimulusSheetStarted) {
  window.__stimulusSheetStarted = true;
  window.StimulusSheet = StimulusSheet;
}
