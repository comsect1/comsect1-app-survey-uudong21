/**
 * prx_survey_uudong21.js
 * Praxis layer for the survey feature.
 * Translates external content pack text format into domain structures.
 * Externally-coupled interpretation: section headers -> domain objects.
 * Dependencies:
 *   DbSurveyUudong21PackTxt (prx_ -> db_, Section 5.2.1)
 *
 * Discriminator record:
 *   Feature: survey content pack parsing
 *   Q1 (external dep?): Yes — external text format (db_ pack)
 *   Q2 (separable judgment?): No — domain structure tied to format sections
 *   Q3 (inseparable coupling?): Yes — section headers map to domain objects
 *   Final layer assignment: prx_
 */

var PrxSurveyUudong21 = (function () {

  function _parsePackTxt(text) {
    var pack = {
      id: "",
      title: "",
      introMessage: "",
      introEmoji: "",
      questions: [],
      scoring: { method: "sum" },
      classification: { thresholds: [], profiles: {} },
      result: { title: "", suffix: "", subtitle: "" },
      recommendations: []
    };

    var lines = text.split("\n");
    var section = null;
    var sectionKey = null;
    var sectionData = {};
    var inQuestions = false;
    var questionBlocks = [];
    var currentBlock = [];

    function _flushSection() {
      if (!section) return;
      if (section === "meta") {
        pack.id = sectionData.id || "";
        pack.title = sectionData.title || "";
        pack.introMessage = sectionData.introMessage || "";
        pack.introEmoji = sectionData.introEmoji || "";
      } else if (section === "scoring") {
        pack.scoring = { method: sectionData.method || "sum" };
        if (sectionData.weights) {
          pack.scoring.weights = sectionData.weights.split(",").map(Number);
        }
      } else if (section === "threshold") {
        var profileKey = sectionKey;
        pack.classification.thresholds.push({
          min: parseInt(sectionData.min, 10) || 0,
          profileKey: profileKey
        });
        pack.classification.profiles[profileKey] = {
          emoji: sectionData.emoji || "",
          color: sectionData.color || "#000000",
          cssModifier: sectionData.cssModifier || "",
          message: (sectionData.message || "").replace(/\\n/g, "\n")
        };
      } else if (section === "result") {
        pack.result = {
          title: sectionData.title || "",
          suffix: sectionData.suffix || "",
          subtitle: sectionData.subtitle || "",
          recommendHeading: sectionData.recommendHeading || ""
        };
      } else if (section === "recommend") {
        pack.recommendations.push({
          emoji: sectionData.emoji || "",
          title: sectionData.title || "",
          description: sectionData.description || "",
          url: sectionData.url || "",
          gradient: sectionData.gradient || ""
        });
      }
      sectionData = {};
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();

      var headerMatch = trimmed.match(/^\[(\w+)(?::(.+))?\]$/);
      if (headerMatch && !inQuestions) {
        _flushSection();
        section = headerMatch[1];
        sectionKey = headerMatch[2] || null;
        if (section === "questions") {
          inQuestions = true;
          section = null;
        }
        continue;
      }

      if (inQuestions) {
        var qHeader = trimmed.match(/^\[(single|multi)\]$/);
        if (qHeader) {
          if (currentBlock.length > 0) {
            questionBlocks.push(currentBlock);
          }
          currentBlock = [trimmed];
          continue;
        }
        if (trimmed !== "") {
          currentBlock.push(trimmed);
        }
        continue;
      }

      if (trimmed === "" || !section) continue;
      var eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        var key = trimmed.substring(0, eqIdx);
        var val = trimmed.substring(eqIdx + 1);
        sectionData[key] = val;
      }
    }

    _flushSection();
    if (currentBlock.length > 0) {
      questionBlocks.push(currentBlock);
    }

    pack.classification.thresholds.sort(function (a, b) {
      return b.min - a.min;
    });

    for (var q = 0; q < questionBlocks.length; q++) {
      var block = questionBlocks[q];
      if (block.length < 3) continue;

      var modeMatch = block[0].match(/^\[(single|multi)\]$/);
      if (!modeMatch) continue;

      var select = modeMatch[1];
      var questionText = block[1];
      var choices = [];

      for (var c = 2; c < block.length; c++) {
        var cEqIdx = block[c].lastIndexOf("=");
        if (cEqIdx < 0) continue;
        var label = block[c].substring(0, cEqIdx);
        var value = parseInt(block[c].substring(cEqIdx + 1), 10);
        if (!isNaN(value)) {
          choices.push({ label: label, value: value });
        }
      }

      if (choices.length > 0) {
        pack.questions.push({ text: questionText, select: select, choices: choices });
      }
    }

    return pack;
  }

  /**
   * Parse the content pack from db_ and return the domain structure.
   * Dependency path: prx_ -> db_ (Section 5.2.1).
   */
  function loadContentPack() {
    return _parsePackTxt(DbSurveyUudong21PackTxt);
  }

  return { loadContentPack: loadContentPack };

})();
