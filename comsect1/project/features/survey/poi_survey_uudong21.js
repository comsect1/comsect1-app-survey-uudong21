/**
 * poi_survey_uudong21.js
 * Poiesis layer for the survey feature.
 * Mechanical DOM production: renders screens, binds events,
 * executes transitions. No domain judgment.
 * Does not reference ida_survey — receives action callbacks via init().
 * Reads labels from cfg_survey_uudong21.
 * Content pack provided by ida_ (parsed by prx_).
 * Dependencies:
 *   CfgSurveyUudong21 (poi_ -> cfg_, Section 5.2.1)
 */

var PoiSurveyUudong21 = (function () {

  var _root = null;
  var _actions = null;
  var _contentPack = null;

  /**
   * @param {HTMLElement} rootElement
   * @param {Object} actions - callbacks wired by ida_ (ida_ -> own poi_)
   * @param {Function} actions.onStart
   * @param {Function} actions.onAnswer
   * @param {Function} actions.onPrev
   * @param {Function} actions.onReset
   * @param {Function} actions.onToggleChoice - multi-select toggle
   * @param {Function} actions.onConfirmChoices - multi-select confirm
   * @param {Function} actions.onGoToQuestion - jump to question by index (from review)
   * @param {Function} actions.onGoToResult - proceed from review to result
   * @param {Object} contentPack - parsed content pack (provided by ida_ via prx_)
   */
  function init(rootElement, actions, contentPack) {
    _root = rootElement;
    _actions = actions;
    _contentPack = contentPack;
  }

  // --- Element helpers ---

  function _el(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "className") {
          el.className = attrs[key];
        } else if (key === "textContent") {
          el.textContent = attrs[key];
        } else if (key === "innerHTML") {
          el.innerHTML = attrs[key];
        } else if (key.indexOf("on") === 0) {
          el.addEventListener(key.substring(2).toLowerCase(), attrs[key]);
        } else {
          el.setAttribute(key, attrs[key]);
        }
      });
    }
    if (children) {
      children.forEach(function (child) {
        if (typeof child === "string") {
          el.appendChild(document.createTextNode(child));
        } else if (child) {
          el.appendChild(child);
        }
      });
    }
    return el;
  }

  // --- Render dispatcher ---

  function render(state) {
    _root.innerHTML = "";

    if (state.phase === "intro") {
      _root.appendChild(_renderIntro());
    } else if (state.phase === "question") {
      _root.appendChild(_renderQuestion(state));
    } else if (state.phase === "review") {
      _root.appendChild(_renderReview(state));
    } else if (state.phase === "result") {
      _root.appendChild(_renderResult(state));
    }
  }

  // --- Intro screen ---

  function _renderIntro() {
    var pack = _contentPack;
    var wrapper = _el("div", { className: "survey-backdrop" }, [
      _el("div", { className: "survey-card" }, [
        _el("div", { className: "intro-section" }, [
          _el("img", {
            className: "intro-mascot",
            src: CfgSurveyUudong21.MASCOT_INTRO,
            alt: "마스코트"
          }),
          _el("h1", { className: "intro-title", textContent: pack.title }),
          _el("p", {
            className: "intro-message",
            textContent: pack.introMessage
          })
        ]),
        _el("button", {
          className: "btn-start",
          textContent: CfgSurveyUudong21.START_LABEL,
          onClick: function () {
            _actions.onStart();
          }
        })
      ])
    ]);
    return wrapper;
  }

  // --- Question screen ---

  function _renderQuestion(state) {
    var progressBar = _el("div", { className: "progress-track" }, [
      _el("div", {
        className: "progress-fill",
        style: "width:" + state.progressPercent + "%"
      })
    ]);

    var question = _contentPack.questions[state.currentQuestion];
    var choices = question ? question.choices : [];
    var isMulti = state.selectMode === "multi";

    var buttons = choices.map(function (choice, choiceIndex) {
      var isSelected = isMulti
        ? state.selectedValues.indexOf(choiceIndex) >= 0
        : state.selectedValues.indexOf(choice.value) >= 0;
      return _el("button", {
        className: "btn-answer" + (isSelected ? " btn-answer--selected" : ""),
        textContent: choice.label,
        onClick: function () {
          if (isMulti) {
            _actions.onToggleChoice(choiceIndex);
          } else {
            setTimeout(function () {
              _actions.onAnswer(choice.value);
            }, CfgSurveyUudong21.TRANSITION_DELAY_MS);
          }
        }
      });
    });

    var children = [
      _el("div", { className: "progress-header" }, [
        _el("span", {
          className: "progress-label",
          textContent:
            CfgSurveyUudong21.QUESTION_LABEL_PREFIX +
            (state.currentQuestion + 1) +
            "/" +
            state.totalQuestions
        }),
        _el("span", {
          className: "progress-percent",
          textContent: state.progressPercent + "%"
        })
      ]),
      progressBar,
      _el("div", { className: "question-section" }, [
        _el("h2", {
          className: "question-text",
          textContent: state.questionText
        })
      ]),
      _el("div", { className: "answer-group" }, buttons)
    ];

    if (isMulti) {
      var confirmAttrs = {
        className: "btn-confirm" + (state.canConfirm ? "" : " btn-confirm--disabled"),
        textContent: CfgSurveyUudong21.CONFIRM_LABEL,
        onClick: function () {
          if (state.canConfirm) {
            _actions.onConfirmChoices();
          }
        }
      };
      if (!state.canConfirm) {
        confirmAttrs.disabled = "disabled";
      }
      children.push(_el("button", confirmAttrs));
    }

    if (state.canGoPrev) {
      children.push(
        _el("button", {
          className: "btn-prev",
          textContent: state.returnToReview
            ? CfgSurveyUudong21.BACK_TO_REVIEW_LABEL
            : CfgSurveyUudong21.PREV_LABEL,
          onClick: function () {
            _actions.onPrev();
          }
        })
      );
    }

    return _el("div", { className: "survey-backdrop" }, [
      _el("div", { className: "survey-card" }, children)
    ]);
  }

  // --- Review screen ---

  function _renderReview(state) {
    var questions = _contentPack.questions;
    var answers = state.answers;

    var items = [];
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var a = answers[i];
      var answerText;

      if (a === undefined) {
        answerText = CfgSurveyUudong21.REVIEW_UNANSWERED;
      } else if (q.select === "multi" && Array.isArray(a)) {
        var labels = [];
        for (var j = 0; j < a.length; j++) {
          var choice = q.choices[a[j]];
          if (choice) labels.push(choice.label);
        }
        answerText = labels.join(", ");
      } else {
        for (var k = 0; k < q.choices.length; k++) {
          if (q.choices[k].value === a) {
            answerText = q.choices[k].label;
            break;
          }
        }
        if (!answerText) answerText = String(a);
      }

      var qIndex = i;
      items.push(
        _el("div", {
          className: "review-item",
          onClick: (function (idx) {
            return function () {
              _actions.onGoToQuestion(idx);
            };
          })(qIndex)
        }, [
          _el("div", { className: "review-question" }, [
            _el("span", { className: "review-number", textContent: (i + 1) + "." }),
            _el("span", { textContent: " " + q.text })
          ]),
          _el("div", { className: "review-answer", textContent: answerText })
        ])
      );
    }

    return _el("div", { className: "survey-backdrop" }, [
      _el("div", { className: "survey-card" }, [
        _el("h2", { className: "review-heading", textContent: CfgSurveyUudong21.REVIEW_HEADING }),
        _el("p", { className: "review-message", textContent: CfgSurveyUudong21.REVIEW_MESSAGE }),
        _el("div", { className: "review-list" }, items),
        _el("button", {
          className: "btn-start",
          textContent: CfgSurveyUudong21.REVIEW_SUBMIT_LABEL,
          onClick: function () {
            _actions.onGoToResult();
          }
        })
      ])
    ]);
  }

  // --- Result screen ---

  function _renderResult(state) {
    var result = state.result;
    var profile = result.profile;
    var pack = _contentPack;

    var messageBox = _el("div", {
      className: "result-message result-message--" + profile.cssModifier
    }, [
      _el("p", { className: "result-message-text", innerHTML: profile.message.replace(/\n/g, "<br>") })
    ]);

    var recCards = pack.recommendations.map(function (rec) {
      return _el("a", {
        className: "rec-card rec-card--" + rec.gradient,
        href: rec.url,
        target: "_blank",
        rel: "noopener noreferrer"
      }, [
        _el("div", { className: "rec-emoji", textContent: rec.emoji }),
        _el("h4", { className: "rec-title", textContent: rec.title }),
        _el("p", { className: "rec-desc", textContent: rec.description })
      ]);
    });

    var scoreEl = _el("div", { className: "result-score" });
    scoreEl.style.color = profile.color;
    scoreEl.textContent = result.score + pack.result.suffix;

    return _el("div", { className: "survey-backdrop" }, [
      _el("div", { className: "survey-card" }, [
        _el("div", { className: "result-header" }, [
          _el("img", {
            className: "result-mascot",
            src: CfgSurveyUudong21.MASCOT_RESULT,
            alt: "마스코트"
          }),
          _el("h2", {
            className: "result-title",
            textContent: pack.result.title
          }),
          scoreEl,
          _el("p", {
            className: "result-subtitle",
            textContent: pack.result.subtitle
          })
        ]),
        messageBox,
        _el("div", { className: "rec-section" }, [
          _el("h3", {
            className: "rec-heading",
            textContent: pack.result.recommendHeading || CfgSurveyUudong21.RECOMMEND_HEADING
          })
        ].concat(recCards)),
        _el("button", {
          className: "btn-reset",
          textContent: CfgSurveyUudong21.RESET_LABEL,
          onClick: function () {
            _actions.onReset();
          }
        })
      ])
    ]);
  }

  return { init: init, render: render };

})();
