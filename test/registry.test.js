import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerSheet, unregisterSheet, getSheet, listSheetIds, _clearRegistry,
} from '../src/lib/registry.js';

describe('registry', () => {
  beforeEach(() => _clearRegistry());

  it('registers and retrieves controllers by id', () => {
    const ctrl = { tag: 'A' };
    registerSheet('foo', ctrl);
    expect(getSheet('foo')).toBe(ctrl);
    expect(listSheetIds()).toEqual(['foo']);
  });

  it('returns null for unknown ids', () => {
    expect(getSheet('missing')).toBeNull();
  });

  it('a fresh controller replacing an older one wins immediately', () => {
    const oldCtrl = { tag: 'old' };
    const newCtrl = { tag: 'new' };
    registerSheet('foo', oldCtrl);
    registerSheet('foo', newCtrl);
    expect(getSheet('foo')).toBe(newCtrl);
  });

  it("a stale controller's disconnect cannot clobber the live one", () => {
    // This is the Turbo-frame-rerender race: new controller connects
    // first, then the old controller's disconnect runs.
    const oldCtrl = { tag: 'old' };
    const newCtrl = { tag: 'new' };
    registerSheet('foo', oldCtrl);
    registerSheet('foo', newCtrl);
    unregisterSheet('foo', oldCtrl);  // stale disconnect
    expect(getSheet('foo')).toBe(newCtrl);
  });

  it('unregisters when the live controller disconnects', () => {
    const ctrl = { tag: 'A' };
    registerSheet('foo', ctrl);
    unregisterSheet('foo', ctrl);
    expect(getSheet('foo')).toBeNull();
  });

  it('ignores empty ids on register/unregister/get', () => {
    registerSheet('', { tag: 'no' });
    unregisterSheet('', { tag: 'no' });
    expect(getSheet('')).toBeNull();
    expect(listSheetIds()).toEqual([]);
  });
});
