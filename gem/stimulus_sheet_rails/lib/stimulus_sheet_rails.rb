require "stimulus_sheet_rails/version"
require "stimulus_sheet_rails/engine"

# Rails companion for the stimulus_sheet JS package.
#
# Ships:
#   - importmap pin for `stimulus_sheet` (the upstream JS bundle);
#   - asset pipeline registration for stimulus_sheet.js / .css;
#   - view partials and helper for rendering sheets + triggers from
#     server-side templates (StimulusSheetRails::Helper).
#
# Mount in your importmap and Stimulus boot:
#
#   # config/importmap.rb
#   pin "stimulus_sheet", to: "stimulus_sheet.js", preload: true
#
#   # app/javascript/controllers/index.js
#   import { Application } from "@hotwired/stimulus"
#   import { start as startSheet } from "stimulus_sheet"
#   const app = Application.start()
#   startSheet(app)
#
# Then in views:
#
#   <%= render_sheet(id: "jobActions", title: "Actions") do %>
#     <button class="ss-item" data-action="click->sheet#close">Edit</button>
#   <% end %>
#
#   <%= render_sheet_trigger(id: "jobActions", expanded: true) { "More…" } %>
module StimulusSheetRails
end
