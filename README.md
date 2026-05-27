# stimulus_sheet

[![CI](https://github.com/schappim/stimulus_sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/schappim/stimulus_sheet/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@ninjaai/stimulus_sheet?label=npm)](https://www.npmjs.com/package/@ninjaai/stimulus_sheet)
[![stimulus_sheet_rails gem](https://img.shields.io/gem/v/stimulus_sheet_rails?label=stimulus_sheet_rails)](https://rubygems.org/gems/stimulus_sheet_rails)

An **HTML-first bottom-sheet / action-sheet for [Stimulus.js](https://stimulus.hotwired.dev/) (Hotwire)**.

iOS-style half/full snap. Drag-to-dismiss. Portal-to-body so the sheet escapes a Turbo frame's stacking context. Optional Hotwire-Native bridge so a tap on a trigger opens a real native sheet on iOS / Android — and falls back to the web sheet on a browser. **Built to survive Turbo navigations and TurboNative WKWebView without crashing the web view.**

## What you get

- **iOS-style bottom sheet** — half and full snap states, rounded top corners, safe-area aware, drag handle.
- **Pointer-event drag** — single code path for touch / mouse / stylus, with a velocity-based snap and a `pull-down-from-the-top-of-the-scroll-area` close gesture.
- **Portal-to-body** — opt in to lift the sheet out of a transformed ancestor (e.g. a Turbo `<turbo-frame id="mobile-screen">`) so `position: fixed` and z-index work relative to the viewport. Stale portaled wrappers are evicted on the next render — no zombies.
- **Trigger registry** — `<button data-controller="sheet-trigger" data-sheet-trigger-id-value="X">` opens any sheet registered by id, anywhere in the DOM, without DOM-id lookups or Stimulus outlets.
- **Imperative API** — `StimulusSheet.open(id)` / `close(id)` / `toggle(id)` from any JS (Turbo Stream callback, console, third-party widget).
- **Events** — `sheet:opened`, `sheet:closed`, `sheet:snap`, `sheet:connected`, `sheet:disconnected` bubble off the wrapper. Detail carries `{ id, sheet, state }`.
- **Hotwire-Native bridge** — opt-in `bridge-sheet` controller dispatches a `hotwire-native:bridge` event the native shell can intercept to render `UIActionSheet` / Android `BottomSheet`. Falls through to the web sheet on a plain browser.
- **No `body:has(...)`** — a marker class on `<body>` is toggled in JS instead, so hosts can react to "any sheet open" without paying the cost of a `body:has(.ss-sheet-full)` selector that crashes WebKit under load.

## With Rails

Prefer a server-driven version with view helpers? The optional [`stimulus_sheet_rails`](gem/stimulus_sheet_rails) companion ships the JS + CSS bundle, an importmap pin, view partials, and a `render_sheet` / `render_sheet_trigger` helper. See [`RAILS.md`](RAILS.md) for the integration walkthrough.

---

## Install

**Option A — plain `<script>` (no bundler).** Self-contained IIFE bundle with Stimulus included.

```html
<link rel="stylesheet" href="https://unpkg.com/@ninjaai/stimulus_sheet/dist/stimulus_sheet.css" />
<script src="https://unpkg.com/@ninjaai/stimulus_sheet/dist/stimulus_sheet.js"></script>
<script> StimulusSheet.start() </script>
```

**Option B — npm + a bundler.** Stimulus is a peer dependency.

```bash
npm install @ninjaai/stimulus_sheet @hotwired/stimulus
```

```js
import { Application } from "@hotwired/stimulus"
import StimulusSheet from "@ninjaai/stimulus_sheet"
import "@ninjaai/stimulus_sheet/style.css"

const app = Application.start()
StimulusSheet.start(app)
```

`StimulusSheet.start(app?)` registers all controllers (`sheet`, `sheet-trigger`, `bridge-sheet`) on the given Stimulus `Application` (or starts a new one) and returns it.

**Option C — Rails / Hotwire (gem from RubyGems).**

```bash
bundle add stimulus_sheet_rails
```

Full setup (importmap, stylesheet, view helpers) is in [`RAILS.md`](RAILS.md).

---

## Quick start

```html
<link rel="stylesheet" href="dist/stimulus_sheet.css" />

<button data-controller="sheet-trigger"
        data-sheet-trigger-id-value="menu"
        data-action="click->sheet-trigger#open">
  Open menu
</button>

<div data-controller="sheet" data-sheet-id-value="menu">
  <div class="ss-sheet-backdrop"
       data-sheet-target="backdrop"
       data-action="click->sheet#close"></div>
  <div class="ss-sheet" data-sheet-target="sheet">
    <div class="ss-sheet-handle" data-sheet-target="handle"></div>
    <div class="ss-sheet-scroll" data-sheet-target="scroll">
      <div class="ss-section-title">Menu</div>
      <button class="ss-item" data-action="click->sheet#close">Edit</button>
      <button class="ss-item" data-action="click->sheet#close">Duplicate</button>
      <button class="ss-item ss-item-destructive" data-action="click->sheet#close">Delete</button>
    </div>
  </div>
</div>

<script src="dist/stimulus_sheet.js"></script>
<script>StimulusSheet.start()</script>
```

That's it. The sheet opens in half mode, drags up to full, drags down (or tap-backdrop) to close. Try the [`demo/`](demo) directory for portaling, multi-sheet, forms, events, and the Hotwire-Native bridge.

---

## Markup contract

### The sheet wrapper

```html
<div data-controller="sheet"
     data-sheet-id-value="myMenu"
     data-sheet-portal-value="false"
     data-sheet-half-offset-value="55"
     data-sheet-open-on-connect-value="false"
     data-sheet-initial-expanded-value="false">
  <div class="ss-sheet-backdrop"
       data-sheet-target="backdrop"
       data-action="click->sheet#close"></div>
  <div class="ss-sheet" data-sheet-target="sheet">
    <div class="ss-sheet-handle" data-sheet-target="handle"></div>
    <div class="ss-sheet-scroll" data-sheet-target="scroll">
      <!-- your content -->
    </div>
  </div>
</div>
```

| Value | Default | Meaning |
| --- | --- | --- |
| `data-sheet-id-value` | `""` | Lookup id for triggers and `StimulusSheet.open(id)`. |
| `data-sheet-portal-value` | `false` | Lift the wrapper to `<body>` on connect; remove on disconnect. |
| `data-sheet-half-offset-value` | `55` | Half-state offset (percent of sheet height). |
| `data-sheet-open-on-connect-value` | `false` | Open immediately after Stimulus connects (handy for Turbo Stream replies). |
| `data-sheet-initial-expanded-value` | `false` | When `open-on-connect` fires (or a trigger calls `#open` without an explicit `expanded`), start in full mode. |

### Targets

| Target | Required? | Notes |
| --- | --- | --- |
| `sheet` | yes | The container that animates. Receives `.ss-sheet`, `.ss-sheet-half`, `.ss-sheet-full`. |
| `backdrop` | recommended | Sits behind the sheet; wire `click->sheet#close` for outside-tap dismiss. |
| `handle` | recommended | Drag handle. The controller adds `.ss-sheet-handle`; `touch-action: none` is applied so pointer drags don't fight scroll. |
| `scroll` | recommended | The scrolling content region. Drag in full-mode is only honoured here when `scrollTop === 0`. |

### Triggers

```html
<button data-controller="sheet-trigger"
        data-sheet-trigger-id-value="myMenu"
        data-sheet-trigger-expanded-value="true"
        data-action="click->sheet-trigger#open">
  Open
</button>
```

`#open`, `#close`, and `#toggle` are all wired. The trigger looks the sheet up in the in-memory registry the `sheet` controller populates on connect — this works across portaling, multiple Turbo frames, and re-renders.

### Imperative API

```js
StimulusSheet.open("myMenu", { expanded: true })
StimulusSheet.close("myMenu")
StimulusSheet.toggle("myMenu")
StimulusSheet.isOpen("myMenu")          // → true | false
StimulusSheet.getSheet("myMenu")        // → the SheetController instance, or null
```

Each wrapper also exposes a `sheetApi` directly:

```js
const wrap = document.querySelector('[data-sheet-id-value="myMenu"]')
wrap.sheetApi.open({ expanded: true })
wrap.sheetApi.state()      // 'closed' | 'half' | 'full'
wrap.sheetApi.isOpen()
```

### Events

| Event | Detail |
| --- | --- |
| `sheet:opened` | `{ id, sheet, state }` |
| `sheet:closed` | `{ id, sheet }` |
| `sheet:snap` | `{ id, sheet, state }` |
| `sheet:connected` / `sheet:disconnected` | `{ id, sheet }` |

```js
document.addEventListener("sheet:opened", (ev) => {
  console.log("opened", ev.detail.id, ev.detail.state)
})
```

---

## TurboNative considerations

This library was extracted from a Hotwire-Native iOS/Android app. The following decisions are deliberate; if you're porting to another shell, keep them in mind:

- **Pointer events, not touch+mouse.** A single `pointerdown`/`pointermove`/`pointerup` handler runs everywhere. Registering both touch and mouse listeners on iOS WKWebView causes nondeterministic gesture state.
- **No `body:has(...)`.** Selectors like `body:has(.ss-sheet-full)` are re-evaluated on every reflow against the whole DOM — known to crash WKWebView under deep DOM. A marker class `body.ss-sheet-open` is toggled in JS instead. Hosts that want to react to "any sheet open" should target that class.
- **No `DOMContentLoaded`.** Controllers do their work on Stimulus connect. Turbo navigations don't re-fire `DOMContentLoaded`, so anything wired to it stops working after the first nav.
- **Per-sheet portaling.** Each sheet's controller portals its own wrapper on connect and removes its own copy on disconnect, evicting any stale wrapper sharing the same `data-ss-portal-slot` first. No global `turbo:before-frame-render` sweep that can race with concurrent renders.
- **Body marker is cleared safely.** When a sheet disconnects, the marker is only cleared when no *other* sheet is open — so a Turbo Stream that replaces sheet A with sheet B keeps `body.ss-sheet-open` set throughout.
- **Pointer capture is best-effort.** Older WKWebViews throw on `setPointerCapture` inside a passive handler; the call is `try`-wrapped so the drag still works.

---

## Theming

All visual properties are CSS custom properties on `.ss-sheet-wrapper`:

```css
.ss-sheet-wrapper {
  --ss-bg: #ffffff;
  --ss-radius: 16px;
  --ss-backdrop: rgba(0, 0, 0, 0.35);
  --ss-handle-bg: #d0d0d0;
  /* …see src/styles/stimulus_sheet.css for the full list */
}
```

Override on a specific wrapper for a one-off look, or on `:root` for a global re-theme. The library never writes inline colours.

---

## Tests

- `npm test` — vitest (registry, portal, controller wiring) in jsdom.
- `npm run test:e2e` — Playwright in WebKit + Chromium against the live demo pages. Closest analogue to the iOS WKWebView this library targets.

## Repo layout

```
src/
  controllers/  sheet, sheet-trigger, bridge-sheet
  lib/          registry, portal, drag, turbo_safe
  styles/       stimulus_sheet.css
demo/           hand-written HTML demos served by `npm run dev`
test/           vitest unit tests
e2e/            Playwright tests
gem/            stimulus_sheet_rails Rails companion
skills/         LLM-facing usage docs (stimulus-sheet-js, stimulus-sheet-rails)
bin/            sync-rails-assets (vendor built bundle into the gem)
```

## Licence

MIT.
