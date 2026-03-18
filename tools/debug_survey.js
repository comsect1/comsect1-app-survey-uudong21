/**
 * debug_survey.js
 * 브라우저 콘솔 디버깅 도구.
 * CfgProjectUudong21.DEBUG === false이면 비활성 상태.
 *
 * 활성화: cfg_project_uudong21.js에서 DEBUG: true로 변경.
 *
 * 사용법: index.html을 열고 브라우저 DevTools 콘솔(F12)에서
 *   DebugSurvey.runAll()        — 전체 검증
 *   DebugSurvey.checkParser()   — txt 파서 단독 검증
 *   DebugSurvey.checkState()    — 현재 상태 스냅샷
 *   DebugSurvey.checkScoring()  — scoring 검증
 *   DebugSurvey.checkMultiSelect() — multi-select 검증
 */

var DebugSurvey = (function () {

  function _disabled() {
    console.warn("[DebugSurvey] 비활성 상태입니다. cfg_project_uudong21.js에서 DEBUG: true로 변경하세요.");
  }

  if (!CfgProjectUudong21.DEBUG) {
    return {
      runAll: _disabled,
      checkParser: _disabled,
      checkState: _disabled,
      checkScoring: _disabled,
      checkNavigation: _disabled,
      checkMultiSelect: _disabled,
      checkBuild: _disabled
    };
  }

  var _pass = 0;
  var _fail = 0;

  function _assert(label, condition, detail) {
    if (condition) {
      _pass++;
      console.log("[PASS] " + label);
    } else {
      _fail++;
      console.error("[FAIL] " + label + (detail ? " — " + detail : ""));
    }
  }

  function _summary() {
    console.log("---");
    console.log("결과: " + _pass + " PASS, " + _fail + " FAIL");
    _pass = 0;
    _fail = 0;
  }

  // --- 1. txt 파서 검증 ---

  function checkParser() {
    console.log("=== 1. txt 파서 검증 ===");

    // 1-1. 글로벌 변수 존재
    _assert("DbSurveyUudong21QuestionsTxt 존재",
      typeof DbSurveyUudong21QuestionsTxt === "string" && DbSurveyUudong21QuestionsTxt.length > 0,
      "typeof=" + typeof DbSurveyUudong21QuestionsTxt
    );

    // 1-2. loadContentPack 결과
    var pack = PoiSurveyUudong21.loadContentPack();
    _assert("loadContentPack 반환값 존재", !!pack);
    _assert("questions 배열 존재", Array.isArray(pack.questions));
    _assert("questions 20개", pack.questions.length === 20,
      "실제=" + pack.questions.length
    );

    // 1-3. 질문 구조 검증 (첫 번째)
    if (pack.questions.length > 0) {
      var q0 = pack.questions[0];
      _assert("questions[0].text 존재", typeof q0.text === "string" && q0.text.length > 0);
      _assert("questions[0].select === 'single'", q0.select === "single",
        "실제=" + q0.select
      );
      _assert("questions[0].choices 배열", Array.isArray(q0.choices));
      _assert("questions[0].choices 2개", q0.choices.length === 2,
        "실제=" + q0.choices.length
      );
      if (q0.choices.length >= 2) {
        _assert("choices[0] = {label:'그렇다', value:1}",
          q0.choices[0].label === "그렇다" && q0.choices[0].value === 1,
          JSON.stringify(q0.choices[0])
        );
        _assert("choices[1] = {label:'아니다', value:0}",
          q0.choices[1].label === "아니다" && q0.choices[1].value === 0,
          JSON.stringify(q0.choices[1])
        );
      }
    }

    // 1-4. multi 파서 검증 (인라인 테스트 텍스트)
    var testTxt = ""
      + "[multi]\n"
      + "해당하는 증상을 모두 선택하세요.\n"
      + "두통=1\n"
      + "불면=2\n"
      + "식욕저하=3\n";

    // _parseQuestionsTxt는 private이므로 loadContentPack 경유 불가.
    // 대신 전체 txt에 테스트 블록을 붙여서 파싱 결과를 비교.
    var origTxt = DbSurveyUudong21QuestionsTxt;
    DbSurveyUudong21QuestionsTxt = testTxt;
    var testPack = PoiSurveyUudong21.loadContentPack();
    DbSurveyUudong21QuestionsTxt = origTxt;
    // 원복 후 다시 로드
    PoiSurveyUudong21.loadContentPack();

    _assert("multi 파서: 질문 1개 파싱", testPack.questions.length === 1,
      "실제=" + testPack.questions.length
    );
    if (testPack.questions.length === 1) {
      var mq = testPack.questions[0];
      _assert("multi 파서: select === 'multi'", mq.select === "multi");
      _assert("multi 파서: choices 3개", mq.choices.length === 3,
        "실제=" + mq.choices.length
      );
    }

    _summary();
  }

  // --- 2. 현재 상태 스냅샷 ---

  function checkState() {
    console.log("=== 2. 현재 상태 ===");
    var state = IdaSurveyUudong21.getState();
    console.table({
      phase: state.phase,
      currentQuestion: state.currentQuestion,
      totalQuestions: state.totalQuestions,
      selectMode: state.selectMode,
      questionText: state.questionText,
      selectedValues: JSON.stringify(state.selectedValues),
      canGoPrev: state.canGoPrev,
      canConfirm: state.canConfirm,
      progressPercent: state.progressPercent + "%"
    });
    console.log("answers:", state.answers);
    return state;
  }

  // --- 3. scoring 검증 ---

  function checkScoring() {
    console.log("=== 3. scoring 검증 ===");

    // 전부 '그렇다'(1) 선택 시 sum = 20
    IdaSurveyUudong21.startSurvey();
    for (var i = 0; i < 20; i++) {
      IdaSurveyUudong21.answer(1);
    }
    var state = IdaSurveyUudong21.getState();
    _assert("phase === 'result'", state.phase === "result", "실제=" + state.phase);

    var total = IdaSurveyUudong21.calculateTotal();
    _assert("전부 그렇다 → sum=20", total === 20, "실제=" + total);

    var result = IdaSurveyUudong21.classifyResult();
    _assert("score >= 10 → profileKey='high'", result.profileKey === "high",
      "실제=" + result.profileKey
    );

    // 전부 '아니다'(0) 선택 시 sum = 0
    IdaSurveyUudong21.reset();
    IdaSurveyUudong21.startSurvey();
    for (var j = 0; j < 20; j++) {
      IdaSurveyUudong21.answer(0);
    }
    var total2 = IdaSurveyUudong21.calculateTotal();
    _assert("전부 아니다 → sum=0", total2 === 0, "실제=" + total2);

    var result2 = IdaSurveyUudong21.classifyResult();
    _assert("score=0 → profileKey='low'", result2.profileKey === "low",
      "실제=" + result2.profileKey
    );

    IdaSurveyUudong21.reset();
    _summary();
  }

  // --- 4. goToPrev 검증 ---

  function checkNavigation() {
    console.log("=== 4. 네비게이션 검증 ===");

    IdaSurveyUudong21.startSurvey();
    var s0 = IdaSurveyUudong21.getState();
    _assert("시작 시 canGoPrev=false", s0.canGoPrev === false);
    _assert("시작 시 currentQuestion=0", s0.currentQuestion === 0);

    // 질문 0 답변 → 질문 1로 이동
    IdaSurveyUudong21.answer(1);
    var s1 = IdaSurveyUudong21.getState();
    _assert("답변 후 currentQuestion=1", s1.currentQuestion === 1);
    _assert("답변 후 canGoPrev=true", s1.canGoPrev === true);

    // 이전으로 돌아가기
    IdaSurveyUudong21.goToPrev();
    var s2 = IdaSurveyUudong21.getState();
    _assert("goToPrev 후 currentQuestion=0", s2.currentQuestion === 0);
    _assert("goToPrev 후 selectedValues=[1]", s2.selectedValues.length === 1 && s2.selectedValues[0] === 1,
      "실제=" + JSON.stringify(s2.selectedValues)
    );

    IdaSurveyUudong21.reset();
    _summary();
  }

  // --- 5. multi-select 시뮬레이션 (인라인 txt) ---

  function checkMultiSelect() {
    console.log("=== 5. multi-select 검증 ===");

    // 임시로 mixed 질문팩 주입
    var origTxt = DbSurveyUudong21QuestionsTxt;
    DbSurveyUudong21QuestionsTxt = ""
      + "[single]\n"
      + "단일 선택 질문\n"
      + "예=1\n"
      + "아니오=0\n"
      + "\n"
      + "[multi]\n"
      + "복수 선택 질문\n"
      + "A=10\n"
      + "B=20\n"
      + "C=30\n";

    // 재초기화
    IdaSurveyUudong21.init(document.getElementById("root"));

    // Q0: single
    IdaSurveyUudong21.startSurvey();
    var s0 = IdaSurveyUudong21.getState();
    _assert("Q0 selectMode='single'", s0.selectMode === "single");
    _assert("Q0 totalQuestions=2", s0.totalQuestions === 2, "실제=" + s0.totalQuestions);

    IdaSurveyUudong21.answer(1);

    // Q1: multi
    var s1 = IdaSurveyUudong21.getState();
    _assert("Q1 selectMode='multi'", s1.selectMode === "multi");
    _assert("Q1 canConfirm=false (아무것도 미선택)", s1.canConfirm === false);

    // 토글
    IdaSurveyUudong21.toggleChoice(10);
    var s2 = IdaSurveyUudong21.getState();
    _assert("토글 후 selectedValues=[10]",
      s2.selectedValues.length === 1 && s2.selectedValues[0] === 10,
      "실제=" + JSON.stringify(s2.selectedValues)
    );
    _assert("토글 후 canConfirm=true", s2.canConfirm === true);

    IdaSurveyUudong21.toggleChoice(30);
    var s3 = IdaSurveyUudong21.getState();
    _assert("두 번째 토글 후 selectedValues=[10,30]",
      s3.selectedValues.length === 2,
      "실제=" + JSON.stringify(s3.selectedValues)
    );

    // 토글 해제
    IdaSurveyUudong21.toggleChoice(10);
    var s4 = IdaSurveyUudong21.getState();
    _assert("토글 해제 후 selectedValues=[30]",
      s4.selectedValues.length === 1 && s4.selectedValues[0] === 30,
      "실제=" + JSON.stringify(s4.selectedValues)
    );

    // 다시 두 개 선택 후 확정
    IdaSurveyUudong21.toggleChoice(20);
    IdaSurveyUudong21.confirmChoices();
    var s5 = IdaSurveyUudong21.getState();
    _assert("confirmChoices 후 phase='result'", s5.phase === "result");

    // scoring: single(1) + multi(30+20=50) = 51
    var total = IdaSurveyUudong21.calculateTotal();
    _assert("mixed scoring: 1 + (30+20) = 51", total === 51, "실제=" + total);

    // goToPrev로 multi 질문 복귀 시 pending 복원
    // result에서는 goToPrev 불가하므로 reset 후 재진행
    IdaSurveyUudong21.reset();
    IdaSurveyUudong21.startSurvey();
    IdaSurveyUudong21.answer(1);
    IdaSurveyUudong21.toggleChoice(10);
    IdaSurveyUudong21.toggleChoice(20);
    IdaSurveyUudong21.confirmChoices(); // result로 이동 (2문항이므로)

    // result 상태에서 answers 확인
    var s6 = IdaSurveyUudong21.getState();
    var a1 = s6.answers[1];
    _assert("answers[1]은 배열 [10,20]",
      Array.isArray(a1) && a1.length === 2,
      "실제=" + JSON.stringify(a1)
    );

    // 원복
    DbSurveyUudong21QuestionsTxt = origTxt;
    IdaSurveyUudong21.init(document.getElementById("root"));

    _summary();
  }

  // --- 6. 빌드 스크립트 결과물 정합성 ---

  function checkBuild() {
    console.log("=== 6. 빌드 결과물 정합성 ===");
    _assert("DbSurveyUudong21QuestionsTxt는 string",
      typeof DbSurveyUudong21QuestionsTxt === "string"
    );
    _assert("빈 문자열 아님",
      DbSurveyUudong21QuestionsTxt.length > 100,
      "length=" + DbSurveyUudong21QuestionsTxt.length
    );
    _assert("[single] 포함",
      DbSurveyUudong21QuestionsTxt.indexOf("[single]") >= 0
    );
    _assert("그렇다=1 포함",
      DbSurveyUudong21QuestionsTxt.indexOf("그렇다=1") >= 0
    );
    _summary();
  }

  // --- 전체 실행 ---

  function runAll() {
    console.log("====== 디버깅 전체 검증 시작 ======\n");
    checkParser();
    checkBuild();
    checkNavigation();
    checkScoring();
    checkMultiSelect();
    console.log("\n====== 디버깅 전체 검증 완료 ======");
  }

  return {
    runAll: runAll,
    checkParser: checkParser,
    checkState: checkState,
    checkScoring: checkScoring,
    checkNavigation: checkNavigation,
    checkMultiSelect: checkMultiSelect,
    checkBuild: checkBuild
  };

})();
