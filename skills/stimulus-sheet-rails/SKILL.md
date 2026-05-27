---
name: stimulus-sheet-rails
description: Use stimulus_sheet_rails, the Rails companion for the stimulus_sheet JS package. Apply when wiring an iOS-style bottom sheet / action sheet into a Hotwire / Turbo / importmap Rails 7.1+ app — especially mobile views served to a Hotwire-Native shell. Provides view helpers (render_sheet, render_sheet_trigger), bundled asset pipeline registration, and a Hotwire-Native bridge fallback. For the pure JS API + markup contract use the stimulus-sheet-js skill.
---

# Using stimulus_sheet_rails

## Install

```bash
bundle add stimulus_sheet_rails
```

The engine auto-pins `stimulus_sheet` in importmap and registers
`stimulus_sheet.js` + `stimulus_sheet.css` with the asset pipeline.

Add the stylesheet to the layout your mobile webview hits:

```erb
<%# app/views/layouts/mobile.html.erb %>
<%= stylesheet_link_tag "stimulus_sheet", "data-turbo-track": "reload" %>
```

Boot the controllers:

```js
// app/javascript/controllers/index.js
import { Application } from "@hotwired/stimulus"
import { start as startSheet } from "stimulus_sheet"

const app = Application.start()
startSheet(app)
```

## View helpers

```erb
<%= render_sheet(id: "jobActions", title: "Actions",
                 portal: true, initial_expanded: true) do %>
  <button class="ss-item" data-action="click->sheet#close">Edit</button>
  <button class="ss-item ss-item-destructive"
          data-action="click->sheet#close">Cancel job</button>
<% end %>

<%= render_sheet_trigger(id: "jobActions", expanded: true) { "More…" } %>
```

Or just inline the trigger:

```erb
<button data-controller="sheet-trigger"
        data-sheet-trigger-id-value="jobActions"
        data-sheet-trigger-expanded-value="true"
        data-action="click->sheet-trigger#open">
  More…
</button>
```

## Opening sheets from Turbo Streams

```erb
<turbo-stream action="append" target="body">
  <template><script>StimulusSheet.open("jobActions", { expanded: true })</script></template>
</turbo-stream>
```

## Conventions

- **One sheet partial per record/intent.** `_job_action_sheet.html.erb`,
  `_quote_action_sheet.html.erb`, etc. Render them inline at the bottom
  of the page partial they belong to.
- **Always set `portal: true`** when rendering inside a Turbo screen
  frame that uses a CSS `transform` or `isolation: isolate` — every
  other case can leave it off.
- **Use `click->sheet#close` on rows that dismiss.** For "navigate +
  dismiss", use `<a class="ss-item" href="..." data-action="click->sheet#close">`.
- **For "close A then open B" chains**, give B its own trigger inside A.
  The controller dismisses A on `#close` and the second trigger's
  `#open` fires cleanly — no `setTimeout` plumbing required.

## Hotwire-Native bridge

```erb
<button data-controller="bridge-sheet"
        data-bridge-sheet-id-value="jobActions"
        data-bridge-sheet-sections-value='<%= job_action_sections_json %>'
        data-bridge-sheet-expanded-value="true"
        data-action="click->bridge-sheet#show">
  More…
</button>
```

On a plain browser the click opens the web sheet by id. On
Hotwire-Native, the controller dispatches `hotwire-native:bridge`
with `{ component: "sheet", name: "show", payload: { id, sections } }`
— the native shell intercepts that and presents a real
`UIActionSheet` / Android `BottomSheet`.

## What's intentionally NOT in scope

- Server broadcasts. Sheet content is local UI. If you need live
  updates inside a sheet, embed a `<turbo-frame>` and let it stream
  normally.
- A Ruby DSL for sheets. One ERB partial per intent is plenty.
- Native shell glue. The bridge dispatches a documented event; the
  iOS/Android side is the host app's responsibility.
