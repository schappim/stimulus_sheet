require_relative "lib/stimulus_sheet_rails/version"

Gem::Specification.new do |spec|
  spec.name        = "stimulus_sheet_rails"
  spec.version     = StimulusSheetRails::VERSION
  spec.authors     = ["Marcus Schappi"]
  spec.email       = ["marcus@chickcom.com"]

  spec.summary     = "Rails companion for the stimulus_sheet JS package."
  spec.description = "HTML-first bottom-sheet / action-sheet for Stimulus.js (Hotwire). " \
                     "Ships the JS + CSS asset bundle, an importmap pin, view helpers " \
                     "(render_sheet / render_sheet_trigger), and partials sized for " \
                     "Turbo + Hotwire-Native mobile webviews."
  spec.homepage    = "https://github.com/schappim/stimulus_sheet"
  spec.license     = "MIT"

  spec.required_ruby_version = ">= 3.1"

  spec.files = Dir[
    "{app,config,lib}/**/*",
    "MIT-LICENSE",
    "README.md",
  ]

  spec.add_dependency "rails",          ">= 7.1"
  spec.add_dependency "stimulus-rails", ">= 1.3"
  spec.add_dependency "importmap-rails",">= 2.0"
end
