/**
 * ida_survey_uudong21.js
 * Idea layer for the survey feature.
 * Owns all domain logic: state management, score calculation,
 * result classification, and state transition decisions.
 * No external dependency — content acquired through own prx_ layer.
 * Dependencies:
 *   PrxSurveyUudong21 (ida_ -> own prx_, Section 5.2.1)
 *   PoiSurveyUudong21 (ida_ -> own poi_, Section 5.2.1)
 */

var IdaSurveyUudong21 = (function () {

  // --- Content (acquired from prx_ -> db_) ---
  var _content = null;

  // --- State ---
  var _currentQuestion = 0;
  var _answers = {};
  var _pendingSelections = [];
  var _phase = "intro"; // "intro" | "question" | "review" | "result"
  var _result = null;
  var _returnToReview = false;

  // --- Render notification ---

  function _notify() {
    PoiSurveyUudong21.render(getState());
  }

  // --- Helpers ---

  function _currentSelectMode() {
    var questions = _content ? _content.questions : [];
    var q = questions[_currentQuestion];
    return q ? q.select : "single";
  }

  function _resolveAnswerValue(val, questionIndex) {
    if (Array.isArray(val)) {
      var q = _content.questions[questionIndex];
      var choices = q ? q.choices : [];
      var sum = 0;
      for (var i = 0; i < val.length; i++) {
        var choice = choices[val[i]];
        sum += choice ? choice.value : 0;
      }
      return sum;
    }
    return typeof val === "number" ? val : 0;
  }

  // --- Init ---

  function init(rootElement) {
    // Acquire content through prx_ (ida_ -> prx_ -> db_).
    // ida_ cannot access db_ directly (Section 5.4).
    _content = PrxSurveyUudong21.loadContentPack();

    if (_content && _content.title) {
      document.title = _content.title;
    }

    _currentQuestion = 0;
    _answers = {};
    _pendingSelections = [];
    _phase = "intro";
    _result = null;
    _returnToReview = false;

    // Wire poi_ with action callbacks and content pack
    // (ida_ -> own poi_, Section 5.2.1).
    PoiSurveyUudong21.init(rootElement, {
      onStart: startSurvey,
      onAnswer: answer,
      onPrev: goToPrev,
      onReset: reset,
      onToggleChoice: toggleChoice,
      onConfirmChoices: confirmChoices,
      onGoToQuestion: goToQuestion,
      onGoToResult: goToResult
    }, _content);

    // Initial render.
    PoiSurveyUudong21.render(getState());
  }

  // --- State accessors ---

  function getState() {
    var questions = _content ? _content.questions : [];
    var total = questions.length;
    var q = questions[_currentQuestion];
    var selectMode = q ? q.select : "single";

    var selectedValues;
    if (selectMode === "multi") {
      selectedValues = _pendingSelections.slice();
    } else {
      var sv = _answers[_currentQuestion];
      selectedValues = sv !== undefined ? [sv] : [];
    }

    return {
      phase: _phase,
      currentQuestion: _currentQuestion,
      totalQuestions: total,
      answers: Object.assign({}, _answers),
      progress: total > 0 ? (_currentQuestion + 1) / total : 0,
      progressPercent: total > 0
        ? Math.round(((_currentQuestion + 1) / total) * 100)
        : 0,
      questionText: q ? q.text : "",
      selectMode: selectMode,
      selectedValues: selectedValues,
      canGoPrev: _currentQuestion > 0 || _returnToReview,
      returnToReview: _returnToReview,
      canConfirm: selectMode === "multi" && _pendingSelections.length > 0,
      result: _result
    };
  }

  // --- Scoring strategies ---

  var _scoringStrategies = {
    sum: function (answers) {
      return Object.keys(answers).reduce(function (acc, key) {
        var qIdx = parseInt(key, 10);
        return acc + _resolveAnswerValue(answers[key], qIdx);
      }, 0);
    },
    weighted_sum: function (answers) {
      return Object.keys(answers).reduce(function (acc, key) {
        var idx = parseInt(key, 10);
        var weights = _content.scoring.weights || [];
        var w = weights[idx] !== undefined ? weights[idx] : 1;
        return acc + _resolveAnswerValue(answers[key], idx) * w;
      }, 0);
    },
    average: function (answers) {
      var keys = Object.keys(answers);
      if (keys.length === 0) return 0;
      var total = keys.reduce(function (acc, key) {
        var qIdx = parseInt(key, 10);
        return acc + _resolveAnswerValue(answers[key], qIdx);
      }, 0);
      return total / keys.length;
    }
  };

  // --- Domain logic ---

  function calculateTotal() {
    var method = _content && _content.scoring
      ? _content.scoring.method
      : "sum";
    var strategy = _scoringStrategies[method] || _scoringStrategies.sum;
    return strategy(_answers);
  }

  function classifyResult() {
    var total = calculateTotal();
    var classification = _content.classification;
    var thresholds = classification.thresholds;
    var profileKey = thresholds[thresholds.length - 1].profileKey;

    for (var i = 0; i < thresholds.length; i++) {
      if (total >= thresholds[i].min) {
        profileKey = thresholds[i].profileKey;
        break;
      }
    }

    return {
      score: total,
      profileKey: profileKey,
      profile: classification.profiles[profileKey]
    };
  }

  // --- State transitions ---

  function startSurvey() {
    _phase = "question";
    _currentQuestion = 0;
    _pendingSelections = [];
    _notify();
  }

  function answer(value) {
    _answers[_currentQuestion] = value;
    _advanceQuestion();
  }

  function toggleChoice(value) {
    var idx = _pendingSelections.indexOf(value);
    if (idx >= 0) {
      _pendingSelections.splice(idx, 1);
    } else {
      _pendingSelections.push(value);
    }
    _notify();
  }

  function confirmChoices() {
    if (_pendingSelections.length === 0) return;
    _answers[_currentQuestion] = _pendingSelections.slice();
    _advanceQuestion();
  }

  function _advanceQuestion() {
    _returnToReview = false;
    var questions = _content ? _content.questions : [];
    if (_currentQuestion < questions.length - 1) {
      _currentQuestion += 1;
      _initPendingForCurrent();
      _notify();
    } else {
      _phase = "review";
      _notify();
    }
  }

  function goToQuestion(index) {
    _returnToReview = (_phase === "review");
    _currentQuestion = index;
    _phase = "question";
    _initPendingForCurrent();
    _notify();
  }

  function goToResult() {
    _result = classifyResult();
    _phase = "result";
    _notify();
  }

  function _initPendingForCurrent() {
    if (_currentSelectMode() === "multi") {
      var existing = _answers[_currentQuestion];
      _pendingSelections = Array.isArray(existing) ? existing.slice() : [];
    } else {
      _pendingSelections = [];
    }
  }

  function goToPrev() {
    if (_returnToReview) {
      _returnToReview = false;
      _phase = "review";
      _notify();
      return;
    }
    if (_currentQuestion > 0) {
      _currentQuestion -= 1;
      _initPendingForCurrent();
      _notify();
    }
  }

  function reset() {
    _currentQuestion = 0;
    _answers = {};
    _pendingSelections = [];
    _result = null;
    _returnToReview = false;
    _phase = "intro";
    _notify();
  }

  // --- Public API ---
  return {
    init: init,
    getState: getState,
    calculateTotal: calculateTotal,
    classifyResult: classifyResult,
    startSurvey: startSurvey,
    answer: answer,
    toggleChoice: toggleChoice,
    confirmChoices: confirmChoices,
    goToPrev: goToPrev,
    goToQuestion: goToQuestion,
    goToResult: goToResult,
    reset: reset
  };

})();
