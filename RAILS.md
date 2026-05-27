# stimulus_sheet + Rails / Hotwire-Native

How to install and use `stimulus_sheet_rails` in a Rails 7.1+ app that boots Stimulus through importmap and serves a mobile experience through Hotwire (optionally wrapped with TurboNative / Hotwire-Native).

## 1. Install

```bash
bundle add stimulus_sheet_rails
```

Pin the JS in your importmap:

```ruby
# config/importmap.rb
pin "stimulus_sheet", to: "stimulus_sheet.js", preload: true
```

(The gem's engine adds this pin automatically — the line above is only needed if you're using a fork or pre-built asset path.)

Add the stylesheet to the layout you serve to the mobile webview:

```erb
<%# app/views/layouts/mobile.html.erb %>
<%= stylesheet_link_tag "stimulus_sheet", "data-turbo-track": "reload" %>
```

Wire the controllers into your Stimulus boot:

```js
// app/javascript/controllers/index.js
import { Application } from "@hotwired/stimulus"
import { start as startSheet } from "stimulus_sheet"

const app = Application.start()
startSheet(app)
```

## 2. Render a sheet

```erb
<%= render_sheet(id: "jobActions", title: "Actions", initial_expanded: true) do %>
  <%= link_to edit_job_path(@job),
        class: "ss-item",
        data: { turbo_frame: "mobile-screen",
                action: "click->sheet#close" } do %>
    <svg viewBox="0 0 24 24"><path d="..."/></svg>
    Edit job
  <% end %>

  <button type="button" class="ss-item ss-item-destructive"
          data-action="click->sheet#close"
          data-controller="confirm-dialog-trigger"
          data-confirm-dialog-trigger-dialog-id-value="cancelJobConfirm">
    Cancel job
  </button>
<% end %>
```

Open it from a trigger:

```erb
<%= render_sheet_trigger(id: "jobActions", expanded: true, class: "more-btn") do %>
  <%= heroicon "ellipsis-horizontal" %>
<% end %>
```

Or imperatively from a Turbo Stream:

```erb
<turbo-stream action="append" target="body">
  <template><script>StimulusSheet.open("jobActions", { expanded: true })</script></template>
</turbo-stream>
```

## 3. Portal to body

If your sheet partial is rendered inside a transformed Turbo frame (e.g. `<turbo-frame id="mobile-screen">` with a slide-in animation), set `portal: true`:

```erb
<%= render_sheet(id: "jobActions", title: "Actions", portal: true) do %>
  …
<% end %>
```

The sheet's wrapper lifts to `<body>` on connect so `position: fixed` and z-index work relative to the viewport. On disconnect (e.g. when Turbo replaces the frame), the wrapper removes itself. The next render's wrapper portals in, evicting any stale body-level copy that shares the same id — so you never end up with two sheets fighting for the same slot.

## 4. Hotwire-Native shell

Drop a `bridge-sheet` button into a page. On a plain browser it opens the web sheet by id; on a Hotwire-Native shell it asks the native side to render a real `UIActionSheet`.

```erb
<button data-controller="bridge-sheet"
        data-bridge-sheet-id-value="jobActions"
        data-bridge-sheet-sections-value='<%= job_action_sections_json %>'
        data-bridge-sheet-expanded-value="true"
        data-action="click->bridge-sheet#show">
  More…
</button>
```

The native side listens for `document.addEventListener("hotwire-native:bridge", ...)`, inspects `event.detail.payload.sections`, and presents the matching native UI. If the user picks an option, the native side typically calls `Turbo.visit(url)` so the regular Rails routes handle the actual action.

## 5. Conventions for mobile partials

For ergonomics, mirror the layout that ships in struth2:

- Render sheets near the bottom of the page partial that owns them (`_job_action_sheet.html.erb`, `_quote_action_sheet.html.erb`, etc).
- One sheet per record/intent — don't try to share one sheet between records via JS swapping. Sheet partials are cheap; rendering two per page is fine.
- Use `data-action="click->sheet#close"` on rows that just dismiss, and `data-action="click->sheet-trigger#open"` on rows that pop another sheet.
- For "close A then open B" chains (e.g. "More" → "Reschedule"), prefer two separate sheets and let the user tap the second trigger inside the first — the controller will dismiss A on `#close` and B's own trigger will fire `#open` cleanly. No setTimeouts.

## 6. Testing your sheets

The Rails companion ships only view helpers — there is no model-side broadcast or audit log. Tests are unaware of the sheet machinery; system specs against the rendered HTML are the right place to verify the partial.

```ruby
# spec/system/job_action_sheet_spec.rb
visit mobile_job_path(@job)
find('[data-sheet-trigger-id-value="jobActions"]').click
expect(page).to have_css('.ss-sheet-full[data-sheet-target="sheet"]', visible: true)
```

For coverage of the JS itself, see the upstream repo's vitest + Playwright suites.

## 7. What's intentionally NOT in scope

- Server broadcasts. A bottom sheet's content is local UI; if you need live updates inside it, the sheet contains an ordinary Turbo Frame and the *frame* listens for streams.
- A Ruby DSL for sheet definitions. There isn't enough variation per sheet to justify one — a single ERB partial per record/intent is plenty.
- Native shell glue. The bridge component dispatches a documented event; the iOS/Android side is the host's responsibility (and varies enough between shells that prescribing it would be wrong).
