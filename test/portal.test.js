import { describe, it, expect, beforeEach } from 'vitest';
import { portal, unportal } from '../src/lib/portal.js';

describe('portal', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('moves an element to body and tags it with the slot', () => {
    const host = document.createElement('div');
    const el   = document.createElement('div');
    host.appendChild(el);
    document.body.appendChild(host);

    portal(el, 'mySlot');

    expect(el.parentElement).toBe(document.body);
    expect(el.getAttribute('data-ss-portal-slot')).toBe('mySlot');
  });

  it('is idempotent — re-portaling the same element is a no-op', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    portal(el, 'mySlot');
    portal(el, 'mySlot');
    // Only one body child.
    expect(document.body.children.length).toBe(1);
    expect(document.body.children[0]).toBe(el);
  });

  it('evicts a stale body-level wrapper that shares the same slot', () => {
    const stale = document.createElement('div');
    stale.id = 'stale';
    portal(stale, 'mySlot');
    expect(document.body.querySelector('#stale')).toBe(stale);

    const fresh = document.createElement('div');
    fresh.id = 'fresh';
    const host = document.createElement('section');
    host.appendChild(fresh);
    document.body.appendChild(host);

    portal(fresh, 'mySlot');

    // Stale is gone, fresh is at body.
    expect(document.body.querySelector('#stale')).toBeNull();
    expect(document.body.querySelector('#fresh')).toBe(fresh);
    expect(fresh.parentElement).toBe(document.body);
  });

  it('unportal removes the element only if it owns a slot at body', () => {
    const a = document.createElement('div');
    portal(a, 'slotA');
    unportal(a);
    expect(document.body.querySelector('[data-ss-portal-slot="slotA"]')).toBeNull();

    // Element that was never portaled is left alone.
    const b = document.createElement('div');
    document.body.appendChild(b);
    unportal(b);
    expect(b.parentElement).toBe(document.body);
  });
});
