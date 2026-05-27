module StimulusSheetRails
  # View helpers for rendering sheets and triggers. Keeps view code from
  # having to spell out the full data-* contract on every call site.
  module Helper
    # Render a bottom sheet shell. Yields a block for the sheet's
    # contents (typically `.ss-section-title` / `.ss-item` rows).
    #
    #   <%= render_sheet(id: "jobActions", title: "Actions", portal: true) do %>
    #     <button class="ss-item" data-action="click->sheet#close">Edit</button>
    #   <% end %>
    def render_sheet(id:, title: nil, portal: false, initial_expanded: false, dismissable: true, &block)
      render(
        partial: "stimulus_sheet_rails/sheet",
        locals: {
          sheet_id:         id,
          sheet_title:      title,
          sheet_portal:     portal,
          initial_expanded: initial_expanded,
          dismissable:      dismissable,
          body:             capture(&block),
        }
      )
    end

    # Render a trigger button for an existing sheet by id.
    #
    #   <%= render_sheet_trigger(id: "jobActions", expanded: true) { "More…" } %>
    def render_sheet_trigger(id:, expanded: false, class: nil, &block)
      render(
        partial: "stimulus_sheet_rails/trigger",
        locals: {
          sheet_id:    id,
          expanded:    expanded,
          extra_class: binding.local_variable_get(:class),
          body:        capture(&block),
        }
      )
    end
  end
end
