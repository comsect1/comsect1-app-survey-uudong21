/**
 * app_uudong21.js
 * Public API anchor for the uudong21 survey application.
 * Entry point that initiates the core bootstrap sequence.
 * Dependency: IdaCoreUudong21 (api entry -> ida_core, Section 5.2.4 exception).
 */

var AppUudong21 = (function () {

  function init() {
    IdaCoreUudong21.init();
  }

  return { init: init };

})();
