---
name: stimulus-sheet-js
description: Use stimulus_sheet, an HTML-first bottom-sheet / action-sheet for Stimulus.js (Hotwire). Apply when adding or editing an iOS-style bottom sheet, action sheet, modal drawer, or any "slides up from the bottom, half/full snap, drag-to-dismiss" UI in a Stimulus/Hotwire front end — especially when the page may also run inside a Hotwire-Native (TurboNative) WKWebView and must survive Turbo navigations. For the Rails server-driven version (view helpers, importmap pin, partial conventions) use the stimulus-sheet-rails skill instead.
---

# Using stimulus_sheet (the JS library)

stimulus_sheet is a client-side bottom-sheet built from three Stimulus
controllers. **The HTML is the configuration** — drop the wrapper +
targets, add `data-controller="sheet"`, and the sheet enhances itself.

## Setup

**Plain script (no bundler):** the IIFE bundle includes Stimulus.

```html
<link rel="stylesheet" href="/path/dist/stimulus_sheet.css" />
<script src="/path/dist/stimulus_sheet.js"></script>
<script>StimulusSheet.start()</script>
```

**ES module / importmap:** the ESM bundle externalises `@hotwired/stimulus`.

```js
import { Application } from "@hotwired/stimulus"
import StimulusSheet from "@ninjaai/stimulus_sheet"
import "@ninjaai/stimulus_sheet/style.css"
const app = Application.start()
StimulusSheet.start(app)
```

`StimulusSheet.start(app?)` registers the three controllers (`sheet`,
`sheet-trigger`, `bridge-sheet`) and returns the Application. Call it
once.

## Minimal sheet

```html
<button data-controller="sheet-trigger"
        data-sheet-trigger-id-value="menu"
        data-action="click->sheet-trigger#open">
  Open
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
      <button class="ss-item ss-item-destructive" data-action="click->sheet#close">Delete</button>
    </div>
  </div>
</div>
```

## Wrapper attributes

| `data-sheet-…-value` | Default | Notes |
| --- | --- | --- |
| `id` | `""` | Registry id; triggers and `StimulusSheet.open(id)` use this. |
| `portal` | `false` | Lift the wrapper to `<body>` on connect (escape transformed-ancestor traps). |
| `half-offset` | `55` | Half-state offset, percent of sheet height. |
| `open-on-connect` | `false` | Open as soon as Stimulus connects. |
| `initial-expanded` | `false` | When opened without an explicit `expanded`, start in full. |

## Trigger attributes

| `data-sheet-trigger-…-value` | Default | Notes |
| --- | --- | --- |
| `id` | `""` | Id of the sheet to open. |
| `expanded` | `false` | Open in full mode (skip half snap). |

Actions: `click->sheet-trigger#open` / `#close` / `#toggle`.

## Action menu inside a sheet

- Use `<button class="ss-item">` rows; wire `click->sheet#close` on each so the menu dismisses after the action.
- Use `<div class="ss-section-title">` between groups.
- Use the `ss-item-destructive` modifier for dangerous actions (sets stroke + colour to red).
- For "navigate then close", use an `<a class="ss-item" href="/path" data-action="click->sheet#close">`.

## Imperative API

```js
StimulusSheet.open("menu", { expanded: true })
StimulusSheet.close("menu")
StimulusSheet.toggle("menu")
StimulusSheet.isOpen("menu")
StimulusSheet.getSheet("menu")     // → SheetController instance

// Or per-wrapper:
document.querySelector('[data-sheet-id-value="menu"]').sheetApi.open()
```

## Events (bubble off the wrapper)

- `sheet:opened` → `{ id, sheet, state }`
- `sheet:snap` → `{ id, sheet, state }`
- `sheet:closed` → `{ id, sheet }`
- `sheet:connected` / `sheet:disconnected` → `{ id, sheet }`

## Portaling: when and why

A sheet rendered inside a transformed ancestor (e.g. a `<turbo-frame>`
with a slide-in animation, a CSS `transform`, or `isolation: isolate`)
is trapped inside that ancestor's stacking context — `position: fixed`
+ z-index can't lift it above the rest of the chrome.

Set `data-sheet-portal-value="true"` and the wrapper moves itself to
`<body>` on connect, evicting any stale wrapper that shares the same
slot first. On disconnect (e.g. when Turbo replaces the host frame),
the wrapper removes itself.

## Hotwire-Native bridge

Optional. The `bridge-sheet` controller dispatches a
`hotwire-native:bridge` document event on click. A native shell can
intercept it and render a `UIActionSheet` / `BottomSheet` instead. On
a plain browser, the controller falls back to opening the matching
web sheet by id.

```html
<button data-controller="bridge-sheet"
        data-bridge-sheet-id-value="menu"
        data-bridge-sheet-sections-value='[{"title":"Edit","url":"/edit"}]'
        data-action="click->bridge-sheet#show">
  More…
</button>
```

## TurboNative-safe details (why this library is shaped the way it is)

- **Pointer events** for drag (touch + mouse + stylus in one path). Mixed
  touch+mouse listeners are known to mis-fire on iOS WKWebView.
- **No `body:has(...)`** — the library toggles `body.ss-sheet-open`
  instead. The `body:has` selector is re-evaluated on every reflow and
  can crash WebKit under deep DOM. Host CSS should target the marker.
- **No `DOMContentLoaded`.** Controllers run on Stimulus connect.
- **Per-sheet portal lifecycle.** No global Turbo sweep; each sheet
  evicts its own stale body-level slot on connect.
- **Body marker cleared only when nothing else is open.** Two sheets
  rapidly swapping (e.g. Turbo Stream replace) doesn't blink the
  marker class.

## Reference demos

The repo's `demo/` directory ships 10 standalone HTML pages — basic,
half/full, action list, multiple sheets, imperative API, portaling,
events log, non-dismissable, form-in-sheet, Hotwire-Native bridge.
Run `npm run dev` and open `http://localhost:5173/demo/`.
