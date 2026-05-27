# Importmap pin exposed to host apps. Loaded by the engine initializer.
# The JS file is shipped from the gem's app/assets/javascripts/ so a host
# can `import "stimulus_sheet"` without touching npm.
pin "stimulus_sheet", to: "stimulus_sheet.js", preload: true
