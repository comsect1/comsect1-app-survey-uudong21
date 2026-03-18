/**
 * poi_core_uudong21.js
 * Core execution anchor for the uudong21 survey application.
 * Provides the DOM root element for feature rendering.
 * Dependencies: CfgCoreUudong21 (poi_core -> cfg_core, Section 5.1).
 */

var PoiCoreUudong21 = (function () {

  var _root = null;

  function init() {
    _root = document.getElementById(CfgCoreUudong21.ROOT_ELEMENT_ID);
  }

  function getRoot() {
    return _root;
  }

  return { init: init, getRoot: getRoot };

})();
