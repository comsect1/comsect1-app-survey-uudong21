/**
 * ida_core_uudong21.js
 * Core policy anchor for the uudong21 survey application.
 * Registers features and initiates execution.
 * Dependencies:
 *   PoiCoreUudong21     (ida_core -> poi_core, Section 5.3)
 *   IdaSurveyUudong21   (ida_core -> ida_<feature>, Section 5.1)
 */

var IdaCoreUudong21 = (function () {

  function init() {
    // Initialize core execution anchor.
    PoiCoreUudong21.init();

    // Register survey feature (ida_core -> ida_<feature>).
    // ida_survey internally wires its own poi_ layer.
    IdaSurveyUudong21.init(PoiCoreUudong21.getRoot());
  }

  return { init: init };

})();
