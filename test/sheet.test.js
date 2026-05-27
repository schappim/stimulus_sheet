/* End-to-end controller wiring: mount a sheet + trigger, exercise
 * open / close / toggle through both the Stimulus actions and the
 * imperative API, check the registry + body marker stay coherent. */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import { start, open, close } from '../src/index.js';
import { _clearRegistry } from '../src/lib/registry.js';

function flush() {
  // Stimulus connects on a microtask; await one tick before asserting.
  return new Promise((resolve) => queueMicrotask(resolve));
}

async function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  start(app);
  await flush();
  return app;
}

describe('SheetController + SheetTriggerController', () => {
  let app;
  beforeEach(() => { _clearRegistry(); });
  afterEach(() => {
    app?.stop?.();
    document.body.innerHTML = '';
    document.body.className = '';
  });

  it('mounts, registers the sheet, and exposes sheetApi on the wrapper', async () => {
    app = await mount(`
      <div id="wrap" data-controller="sheet" data-sheet-id-value="t1">
        <div class="ss-sheet-backdrop" data-sheet-target="backdrop"></div>
        <div class="ss-sheet" data-sheet-target="sheet">
          <div class="ss-sheet-handle" data-sheet-target="handle"></div>
          <div class="ss-sheet-scroll" data-sheet-target="scroll"></div>
        </div>
      </div>
    `);

    const wrap = document.getElementById('wrap');
    expect(typeof wrap.sheetApi.open).toBe('function');
    expect(wrap.sheetApi.state()).toBe('closed');
    expect(document.body.classList.contains('ss-sheet-open')).toBe(false);
  });

  it('opens half by default, then snaps to full', async () => {
    app = await mount(`
      <div id="wrap" data-controller="sheet" data-sheet-id-value="t2">
        <div class="ss-sheet-backdrop" data-sheet-target="backdrop"></div>
        <div class="ss-sheet" data-sheet-target="sheet">
          <div class="ss-sheet-handle" data-sheet-target="handle"></div>
          <div class="ss-sheet-scroll" data-sheet-target="scroll"></div>
        </div>
      </div>
    `);

    const wrap = document.getElementById('wrap');
    wrap.sheetApi.open();
    expect(wrap.sheetApi.state()).toBe('half');
    expect(document.body.classList.contains('ss-sheet-open')).toBe(true);

    wrap.sheetApi.expand();
    expect(wrap.sheetApi.state()).toBe('full');

    wrap.sheetApi.half();
    expect(wrap.sheetApi.state()).toBe('half');
  });

  it('imperative open(id) drives the controller by id', async () => {
    app = await mount(`
      <div data-controller="sheet" data-sheet-id-value="byId">
        <div class="ss-sheet-backdrop" data-sheet-target="backdrop"></div>
        <div class="ss-sheet" data-sheet-target="sheet">
          <div class="ss-sheet-handle" data-sheet-target="handle"></div>
          <div class="ss-sheet-scroll" data-sheet-target="scroll"></div>
        </div>
      </div>
    `);

    open('byId', { expanded: true });
    const ctrl = app.getControllerForElementAndIdentifier(document.querySelector('[data-sheet-id-value="byId"]'), 'sheet');
    expect(ctrl._state).toBe('full');

    close('byId');
    expect(ctrl._state).toBe('closed');
  });

  it('the trigger controller calls open() on the registered sheet', async () => {
    app = await mount(`
      <button id="btn"
              data-controller="sheet-trigger"
              data-sheet-trigger-id-value="trig"
              data-sheet-trigger-expanded-value="true"
              data-action="click->sheet-trigger#open">Open</button>
      <div data-controller="sheet" data-sheet-id-value="trig">
        <div class="ss-sheet-backdrop" data-sheet-target="backdrop"></div>
        <div class="ss-sheet" data-sheet-target="sheet">
          <div class="ss-sheet-handle" data-sheet-target="handle"></div>
          <div class="ss-sheet-scroll" data-sheet-target="scroll"></div>
        </div>
      </div>
    `);
    document.getElementById('btn').click();

    const ctrl = app.getControllerForElementAndIdentifier(document.querySelector('[data-sheet-id-value="trig"]'), 'sheet');
    expect(ctrl._state).toBe('full');
  });

  it('emits sheet:opened and sheet:closed events with the id payload', async () => {
    app = await mount(`
      <div data-controller="sheet" data-sheet-id-value="ev">
        <div class="ss-sheet-backdrop" data-sheet-target="backdrop"></div>
        <div class="ss-sheet" data-sheet-target="sheet">
          <div class="ss-sheet-handle" data-sheet-target="handle"></div>
          <div class="ss-sheet-scroll" data-sheet-target="scroll"></div>
        </div>
      </div>
    `);

    const opened = vi.fn();
    const closed = vi.fn();
    document.addEventListener('sheet:opened', opened);
    document.addEventListener('sheet:closed', closed);

    open('ev');
    close('ev');

    expect(opened).toHaveBeenCalled();
    expect(opened.mock.calls[0][0].detail.id).toBe('ev');
    expect(closed).toHaveBeenCalled();
    expect(closed.mock.calls[0][0].detail.id).toBe('ev');
  });

  it("a trigger pointing at a missing id warns but doesn't throw", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    app = await mount(`
      <button id="btn"
              data-controller="sheet-trigger"
              data-sheet-trigger-id-value="absent"
              data-action="click->sheet-trigger#open">Open</button>
    `);
    expect(() => document.getElementById('btn').click()).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('disconnect drops the body marker if no other sheets are open', async () => {
    app = await mount(`
      <div id="wrap" data-controller="sheet" data-sheet-id-value="dc">
        <div class="ss-sheet-backdrop" data-sheet-target="backdrop"></div>
        <div class="ss-sheet" data-sheet-target="sheet">
          <div class="ss-sheet-handle" data-sheet-target="handle"></div>
          <div class="ss-sheet-scroll" data-sheet-target="scroll"></div>
        </div>
      </div>
    `);
    open('dc');
    expect(document.body.classList.contains('ss-sheet-open')).toBe(true);

    // Simulate a Turbo frame removing the sheet's host.
    document.getElementById('wrap').remove();
    await flush();
    expect(document.body.classList.contains('ss-sheet-open')).toBe(false);
  });

  it('portal lifts the wrapper to body on connect and tags the slot', async () => {
    app = await mount(`
      <section id="host">
        <div data-controller="sheet"
             data-sheet-id-value="po"
             data-sheet-portal-value="true">
          <div class="ss-sheet-backdrop" data-sheet-target="backdrop"></div>
          <div class="ss-sheet" data-sheet-target="sheet">
            <div class="ss-sheet-handle" data-sheet-target="handle"></div>
            <div class="ss-sheet-scroll" data-sheet-target="scroll"></div>
          </div>
        </div>
      </section>
    `);

    const wrap = document.querySelector('[data-sheet-id-value="po"]');
    expect(wrap).not.toBeNull();
    expect(wrap.parentElement).toBe(document.body);
    expect(wrap.getAttribute('data-ss-portal-slot')).toBe('po');
    // The original host is now empty — the wrap moved out.
    expect(document.getElementById('host').children.length).toBe(0);
  });

  it('a re-rendered sheet evicts the stale body-level copy that shares its slot', async () => {
    app = await mount(`
      <section id="host">
        <div data-controller="sheet"
             data-sheet-id-value="reflow"
             data-sheet-portal-value="true">
          <div class="ss-sheet-backdrop" data-sheet-target="backdrop"></div>
          <div class="ss-sheet" data-sheet-target="sheet">
            <div class="ss-sheet-handle" data-sheet-target="handle"></div>
            <div class="ss-sheet-scroll" data-sheet-target="scroll" data-version="A"></div>
          </div>
        </div>
      </section>
    `);

    expect(document.body.querySelectorAll('[data-ss-portal-slot="reflow"]').length).toBe(1);
    expect(document.querySelector('[data-version="A"]')).not.toBeNull();

    // Simulate a Turbo frame re-render: render a fresh wrap into host,
    // expect the prior body-level wrap to be evicted on the new one's
    // portal pass.
    const host = document.getElementById('host');
    host.innerHTML = `
      <div data-controller="sheet"
           data-sheet-id-value="reflow"
           data-sheet-portal-value="true">
        <div class="ss-sheet-backdrop" data-sheet-target="backdrop"></div>
        <div class="ss-sheet" data-sheet-target="sheet">
          <div class="ss-sheet-handle" data-sheet-target="handle"></div>
          <div class="ss-sheet-scroll" data-sheet-target="scroll" data-version="B"></div>
        </div>
      </div>
    `;
    await flush();

    // Exactly one wrapper for the slot; the old version A is gone.
    expect(document.body.querySelectorAll('[data-ss-portal-slot="reflow"]').length).toBe(1);
    expect(document.querySelector('[data-version="A"]')).toBeNull();
    expect(document.querySelector('[data-version="B"]')).not.toBeNull();
  });
});
