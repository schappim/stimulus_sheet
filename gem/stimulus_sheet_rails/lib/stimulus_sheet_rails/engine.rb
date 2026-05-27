require "rails/engine"

module StimulusSheetRails
  class Engine < ::Rails::Engine
    isolate_namespace StimulusSheetRails

    initializer "stimulus_sheet_rails.assets" do |app|
      if app.config.respond_to?(:assets)
        app.config.assets.precompile += %w[
          stimulus_sheet.js
          stimulus_sheet.css
        ]
      end
    end

    initializer "stimulus_sheet_rails.importmap", before: "importmap" do |app|
      if app.config.respond_to?(:importmap)
        app.config.importmap.paths << Engine.root.join("config/importmap.rb")
        app.config.importmap.cache_sweepers << Engine.root.join("app/assets/javascripts")
      end
    end

    initializer "stimulus_sheet_rails.helpers" do
      ActiveSupport.on_load(:action_view) do
        require "stimulus_sheet_rails/helper"
        include StimulusSheetRails::Helper
      end
    end

    initializer "stimulus_sheet_rails.view_paths" do |app|
      ActiveSupport.on_load(:action_controller) do
        append_view_path StimulusSheetRails::Engine.root.join("app/views")
      end
    end
  end
end
