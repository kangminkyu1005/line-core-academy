"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { codePracticeMissions } from "../code-screen-preview/page";
import { validateCode } from "../code-validation.js";
import { finalQuizQuestions, glossaryTopics } from "../learning-content";
import styles from "./practice.module.css";

type PracticeTab = "quiz" | "code";
type IconName = "arrow" | "book" | "check" | "code" | "light" | "refresh" | "terminal" | "x";
type CodeAnswers = Record<string, string>;
type ValidationView = { passed: boolean; fields: Record<string, string>; issues: string[] };

const MODE_KEY = "linecore-practice-mode";
const QUIZ_KEY = "linecore-practice-quiz";
const CODE_KEY = "linecore-practice-code";
const CODE_STATUS_KEY = "linecore-practice-status";

const sectionNames = ["처리 순서", "변수 설정", "함수 구조", "센서 + P 제어", "D 제어", "모터 제어"];
const sectionFieldKeys = [
  ["0.sensor", "0.error", "0.direction", "0.repeat"],
  ["1.black_value", "1.white_value", "1.base_speed", "1.target", "1.kp", "1.kd"],
  ["2.params", "2.previous_error", "2.loop"],
  ["2.sensor", "3.error", "3.p_control"],
  ["4.change", "4.d_control"],
  ["5.correction", "5.left_power", "5.right_power", "5.previous_error", "5.left_motor", "5.right_motor"],
];

const initialCodeAnswers: CodeAnswers = Object.fromEntries(sectionFieldKeys.flat().map((key) => [key, ""]));

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    code: <><path d="m8 9-4 3 4 3m8-6 4 3-4 3M14 5l-4 14"/></>,
    light: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5C14.5 15.4 14 16.2 14 18h-4c0-1.8-.5-2.6-1.5-3.5Z"/></>,
    refresh: <><path d="M20 11a8 8 0 1 0 2 5"/><path d="M20 4v7h-7"/></>,
    terminal: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/></>,
    x: <><path d="M6 6l12 12"/><path d="M18 6 6 18"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function missionBlank(missionId: number, blankId: string) {
  return codePracticeMissions[missionId].blanks.find((blank) => blank.id === blankId);
}

function PracticeInput({
  fieldKey,
  label,
  placeholder,
  value,
  error,
  hint,
  wide = false,
  onChange,
  onHint,
}: {
  fieldKey: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  hint?: ReactNode;
  wide?: boolean;
  onChange: (value: string) => void;
  onHint?: () => void;
}) {
  const errorId = `practice-error-${fieldKey.replace(".", "-")}`;
  const hintId = `practice-hint-${fieldKey.replace(".", "-")}`;
  return <span className={`${styles.inputUnit} ${wide ? styles.inputWide : ""}`}>
    <span className={styles.inputRow}>
      <input
        value={value}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={Boolean(error)}
        aria-describedby={[error ? errorId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
      {onHint ? <button type="button" className={`${styles.hintButton} ${hint ? styles.hintButtonOpen : ""}`} onClick={onHint} aria-label={`${label} 힌트`} aria-expanded={Boolean(hint)} aria-controls={hintId}>?</button> : null}
    </span>
    {error ? <small className={styles.fieldError} id={errorId} aria-live="polite">{error}</small> : null}
    {hint ? <span className={styles.inlineHint} id={hintId} aria-live="polite"><Icon name="light" size={15}/><span>{hint}</span></span> : null}
  </span>;
}

function ConceptDictionary({ index, onSelect, onClose }: { index: number; onSelect: (index: number) => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const topic = glossaryTopics[Math.min(Math.max(index, 0), glossaryTopics.length - 1)];
  useEffect(() => {
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className={styles.dictionaryLayer} role="dialog" aria-modal="true" aria-labelledby="practice-dictionary-title">
    <button className={styles.dictionaryBackdrop} onClick={onClose} aria-label="개념 사전 닫기"/>
    <section className={styles.dictionaryPanel}>
      <header><span><Icon name="book" size={22}/></span><div><small>LINE FOLLOWING CONCEPT DICTIONARY</small><h2 id="practice-dictionary-title">라인 팔로잉 개념 사전</h2></div><button ref={closeRef} onClick={onClose} aria-label="개념 사전 닫기"><Icon name="x" size={20}/></button></header>
      <div className={styles.dictionaryBody}>
        <nav aria-label="개념 목록">{glossaryTopics.map((item, itemIndex) => <button type="button" className={itemIndex === index ? styles.dictionaryActive : ""} key={item.id} onClick={() => onSelect(itemIndex)}><span>{item.number}</span><b>{item.title}</b></button>)}</nav>
        <article>
          <small>{topic.eyebrow}</small><h3>{topic.title}</h3><p>{topic.summary}</p>
          <section><b>왜 필요할까요?</b><p>{topic.why}</p></section>
          <section><b>코드와 공식</b>{topic.formulas.map((formula) => <code key={formula}>{formula}</code>)}</section>
          <section><b>예시</b><ul>{topic.examples.map((example) => <li key={example}>{example}</li>)}</ul></section>
          <aside><Icon name="light" size={17}/><p><b>기억하기</b>{topic.remember}</p></aside>
          <footer><button disabled={index === 0} onClick={() => onSelect(index - 1)}>이전 개념</button><span>{index + 1} / {glossaryTopics.length}</span><button disabled={index === glossaryTopics.length - 1} onClick={() => onSelect(index + 1)}>다음 개념</button></footer>
        </article>
      </div>
    </section>
  </div>;
}

function QuizMode({ openGlossary }: { openGlossary: (id?: string) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() => finalQuizQuestions.map(() => null));
  const [checked, setChecked] = useState<boolean[]>(() => finalQuizQuestions.map(() => false));
  const [complete, setComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(QUIZ_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.answers) && parsed.answers.length === finalQuizQuestions.length) setAnswers(parsed.answers);
          if (Array.isArray(parsed.checked) && parsed.checked.length === finalQuizQuestions.length) setChecked(parsed.checked);
          if (Number.isInteger(parsed.index)) setIndex(Math.min(Math.max(parsed.index, 0), finalQuizQuestions.length - 1));
          setComplete(Boolean(parsed.complete));
        }
      } catch { localStorage.removeItem(QUIZ_KEY); }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ index, answers, checked, complete }));
  }, [answers, checked, complete, index, loaded]);

  const score = answers.reduce((total, answer, questionIndex) => total + (answer === finalQuizQuestions[questionIndex].answer ? 1 : 0), 0);
  const categoryResults = ["센서와 기준", "PD 제어", "파이썬 문법"].map((category) => {
    const indexes = finalQuizQuestions.map((question, questionIndex) => question.category === category ? questionIndex : -1).filter((questionIndex) => questionIndex >= 0);
    return { category, total: indexes.length, correct: indexes.filter((questionIndex) => answers[questionIndex] === finalQuizQuestions[questionIndex].answer).length };
  });

  function resetQuiz() {
    setIndex(0); setAnswers(finalQuizQuestions.map(() => null)); setChecked(finalQuizQuestions.map(() => false)); setComplete(false);
  }

  if (complete) return <section className={styles.quizResult} data-qa="quiz-result">
    <header><span><Icon name="check" size={28}/></span><div><small>CONCEPT CHECK COMPLETE</small><h2>객관식 문제를 모두 완료했습니다</h2></div></header>
    <div className={styles.scoreHero} data-qa-value-group><strong>{score}</strong><span>/ {finalQuizQuestions.length}</span><p>점수는 평가의 끝이 아니라 다시 볼 개념을 찾는 안내입니다.</p></div>
    <div className={styles.categoryGrid}>{categoryResults.map((result) => <article key={result.category}><span>{result.category}</span><b>{result.correct} / {result.total}</b><i><em style={{ width: `${result.total ? (result.correct / result.total) * 100 : 0}%` }}/></i></article>)}</div>
    <section className={styles.reviewMap}><header><div><small>REVIEW MAP</small><h3>{score === finalQuizQuestions.length ? "모든 개념을 정확히 연결했어요" : "다시 보면 좋은 개념"}</h3></div><button onClick={() => openGlossary()}><Icon name="book" size={16}/> 개념 사전 열기</button></header>
      {score < finalQuizQuestions.length ? <div>{finalQuizQuestions.map((question, questionIndex) => answers[questionIndex] !== question.answer ? <button key={question.question} onClick={() => openGlossary(question.glossaryId)}><span>{String(questionIndex + 1).padStart(2, "0")}</span><div><b>{question.category}</b><p>{question.question}</p></div><Icon name="arrow" size={17}/></button> : null)}</div> : <p className={styles.perfectReview}><Icon name="check" size={18}/>필요할 때 개념 사전에서 공식과 예시를 다시 확인할 수 있어요.</p>}
    </section>
    <button className={styles.primaryButton} onClick={resetQuiz}><Icon name="refresh" size={17}/> 다시 풀기</button>
  </section>;

  const question = finalQuizQuestions[index];
  const selected = answers[index];
  const isChecked = checked[index];
  return <section className={styles.quizMode} data-qa="quiz-mode">
    <header className={styles.modeHeading}><div><small>20 QUESTIONS · CONCEPT CHECK</small><h2>라인 팔로잉 개념을 확인해요</h2><p>답을 고른 뒤 정답 확인을 눌러 해설과 관련 개념을 확인하세요.</p></div><button className={styles.dictionaryButton} onClick={() => openGlossary()}><Icon name="book" size={16}/> 개념 사전</button></header>
    <div className={styles.quizProgress}><span><b>{index + 1}</b> / {finalQuizQuestions.length}</span><i><em style={{ width: `${((index + 1) / finalQuizQuestions.length) * 100}%` }}/></i></div>
    <article className={styles.questionCard}>
      <header><span>{String(index + 1).padStart(2, "0")}</span><div><small>{question.category}</small><h3>{question.question}</h3></div></header>
      <div className={styles.quizOptions}>{question.options.map((option, optionIndex) => {
        const chosen = selected === optionIndex;
        const correct = isChecked && optionIndex === question.answer;
        const wrong = isChecked && chosen && optionIndex !== question.answer;
        return <button key={option} className={`${chosen ? styles.optionSelected : ""} ${correct ? styles.optionCorrect : ""} ${wrong ? styles.optionWrong : ""}`} aria-pressed={chosen} disabled={isChecked} onClick={() => setAnswers((current) => current.map((value, answerIndex) => answerIndex === index ? optionIndex : value))}><span>{String.fromCharCode(65 + optionIndex)}</span><b>{option}</b>{correct ? <Icon name="check" size={18}/> : wrong ? <Icon name="x" size={18}/> : null}</button>;
      })}</div>
      {isChecked ? <section className={`${styles.quizFeedback} ${selected === question.answer ? styles.feedbackCorrect : styles.feedbackWrong}`} aria-live="polite"><span><Icon name={selected === question.answer ? "check" : "x"} size={19}/></span><div><b>{selected === question.answer ? "정답입니다" : "다시 확인해 볼 개념이 있어요"}</b><p>{question.explanation}</p><button onClick={() => openGlossary(question.glossaryId)}><Icon name="book" size={15}/> 관련 개념 보기</button></div></section> : null}
      <footer><p><Icon name="light" size={15}/>정답을 확인한 뒤 다음 문제로 이동할 수 있습니다.</p>{!isChecked ? <button className={styles.primaryButton} disabled={selected === null} onClick={() => setChecked((current) => current.map((value, checkedIndex) => checkedIndex === index ? true : value))}>정답 확인 <Icon name="arrow" size={18}/></button> : <button className={styles.primaryButton} onClick={() => index === finalQuizQuestions.length - 1 ? setComplete(true) : setIndex((current) => current + 1)}>{index === finalQuizQuestions.length - 1 ? "결과 확인" : "다음 문제"} <Icon name="arrow" size={18}/></button>}</footer>
    </article>
  </section>;
}

function CodeMode({ openGlossary }: { openGlossary: (id?: string) => void }) {
  const [answers, setAnswers] = useState<CodeAnswers>(initialCodeAnswers);
  const [hints, setHints] = useState<Record<string, number>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sectionIssues, setSectionIssues] = useState<Record<number, string[]>>({});
  const [completed, setCompleted] = useState<boolean[]>(() => sectionNames.map(() => false));
  const [overallChecked, setOverallChecked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(CODE_KEY);
        const savedStatus = localStorage.getItem(CODE_STATUS_KEY);
        if (saved) setAnswers({ ...initialCodeAnswers, ...JSON.parse(saved) });
        if (savedStatus) {
          const parsed = JSON.parse(savedStatus);
          if (parsed.hints) setHints(parsed.hints);
          if (Array.isArray(parsed.completed) && parsed.completed.length === sectionNames.length) setCompleted(parsed.completed);
          setOverallChecked(Boolean(parsed.overallChecked));
        }
      } catch { localStorage.removeItem(CODE_KEY); localStorage.removeItem(CODE_STATUS_KEY); }
      setLoaded(true);
    });
  }, []);

  useEffect(() => { if (loaded) localStorage.setItem(CODE_KEY, JSON.stringify(answers)); }, [answers, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem(CODE_STATUS_KEY, JSON.stringify({ hints, completed, overallChecked })); }, [completed, hints, loaded, overallChecked]);

  const completedCount = completed.filter(Boolean).length;
  const allPassed = completedCount === sectionNames.length && overallChecked;

  const fullCode = useMemo(() => {
    const value = (key: string) => answers[key]?.trim() || "___";
    return [
      `# ${value("0.sensor")}`,
      `# ${value("0.error")}`,
      `# ${value("0.direction")}`,
      `# ${value("0.repeat")}`,
      "",
      `BLACK_VALUE = ${value("1.black_value")}`,
      `WHITE_VALUE = ${value("1.white_value")}`,
      `BASE_SPEED = ${value("1.base_speed")}`,
      `TARGET = ${value("1.target")}`,
      `KP = ${value("1.kp")}`,
      `KD = ${value("1.kd")}`,
      "",
      `def line_follow(${value("2.params")}):`,
      `    previous_error = ${value("2.previous_error")}`,
      `    while ${value("2.loop")}:`,
      `        sensor_value = ${value("2.sensor")}`,
      `        error = ${value("3.error")}`,
      `        p_control = ${value("3.p_control")}`,
      `        change = ${value("4.change")}`,
      `        d_control = ${value("4.d_control")}`,
      `        correction = ${value("5.correction")}`,
      `        left_power = ${value("5.left_power")}`,
      `        right_power = ${value("5.right_power")}`,
      `        previous_error = ${value("5.previous_error")}`,
      `        left_motor.dc(${value("5.left_motor")})`,
      `        right_motor.dc(${value("5.right_motor")})`,
      "",
      "line_follow(BASE_SPEED, TARGET, KP, KD)",
    ].join("\n");
  }, [answers]);

  function fieldSection(fieldKey: string) { return sectionFieldKeys.findIndex((keys) => keys.includes(fieldKey)); }

  function updateAnswer(fieldKey: string, value: string) {
    setAnswers((current) => ({ ...current, [fieldKey]: value }));
    setFieldErrors((current) => { const next = { ...current }; delete next[fieldKey]; return next; });
    const sectionIndex = fieldSection(fieldKey);
    if (sectionIndex >= 0) {
      setCompleted((current) => current.map((item, index) => index === sectionIndex ? false : item));
      setSectionIssues((current) => ({ ...current, [sectionIndex]: [] }));
    }
    setOverallChecked(false);
  }

  function hintTiers(fieldKey: string): Array<{ label: string; body: ReactNode }> {
    if (fieldKey === "2.params") return [
      { label: "힌트 1/2", body: <>함수에 전달되는 값은 기본 속도, 기준값, P 계수, D 계수 순서입니다.</> },
      { label: "힌트 2/2 · 변수명 확인", body: <>직접 입력할 값은 <code>base_speed, target, kp, kd</code>입니다.</> },
    ];
    if (fieldKey === "2.previous_error") return [
      { label: "힌트 1/2", body: <>첫 반복 전에는 아직 이전 오차가 없습니다.</> },
      { label: "힌트 2/2 · 초기값 확인", body: <>이전 오차는 <code>0</code> 또는 <code>0.0</code>으로 시작합니다.</> },
    ];
    if (fieldKey === "5.left_motor") return [{ label: "모터 인수", body: <>왼쪽 모터에는 방금 계산한 <code>left_power</code>를 전달합니다.</> }];
    if (fieldKey === "5.right_motor") return [{ label: "모터 인수", body: <>오른쪽 모터에는 방금 계산한 <code>right_power</code>를 전달합니다.</> }];
    const [missionIdText, blankId] = fieldKey.split(".");
    return missionBlank(Number(missionIdText), blankId)?.hintTiers ?? [];
  }

  function toggleHint(fieldKey: string) {
    const tiers = hintTiers(fieldKey);
    if (!tiers.length) return;
    setHints((current) => {
      const level = current[fieldKey] ?? 0;
      return { ...current, [fieldKey]: level >= tiers.length ? 0 : level + 1 };
    });
  }

  function issueMap(missionId: number, issues: string[]) {
    const fields: Record<string, string> = {};
    const remaining: string[] = [];
    const labels: Record<number, Array<[string, string[]]>> = {
      1: [
        ["1.white_value", ["반사광 측정"]], ["1.base_speed", ["기본 속도"]], ["1.target", ["센서 기준값"]], ["1.kp", ["P 계수"]], ["1.kd", ["D 계수"]],
      ],
      2: [["2.params", ["함수 선언"]], ["2.previous_error", ["이전 오차 초기화"]], ["2.loop", ["반복 구조"]], ["2.sensor", ["센서 읽기"]]],
      3: [["3.error", ["오차 계산"]], ["3.p_control", ["P 제어"]]],
      4: [["4.change", ["변화량"]], ["4.d_control", ["D 제어"]]],
      5: [["5.correction", ["PD 결합"]], ["5.left_power", ["왼쪽 출력"]], ["5.right_power", ["오른쪽 출력"]], ["5.previous_error", ["이전 오차 저장"]], ["5.left_motor", ["왼쪽 모터 연결"]], ["5.right_motor", ["오른쪽 모터 연결"]]],
    };
    issues.forEach((issue) => {
      const match = (labels[missionId] ?? []).find(([, prefixes]) => prefixes.some((prefix) => issue.startsWith(prefix)));
      if (match) fields[match[0]] = issue.replace(/^[^:]+:\s*/, ""); else remaining.push(issue);
    });
    if (missionId === 1 && fields["1.white_value"] && !answers["1.black_value"].trim()) fields["1.black_value"] = fields["1.white_value"];
    return { fields, remaining };
  }

  function resultFor(sectionIndex: number, overall = false): ValidationView {
    const v = (key: string, fallback = "") => answers[key]?.trim() || fallback;
    if (sectionIndex === 0) {
      const code = [`# ${v("0.sensor")}`, `# ${v("0.error")}`, `# ${v("0.direction")}`, `# ${v("0.repeat")}`].join("\n");
      const result = validateCode(0, code, 1);
      const fields: Record<string, string> = {};
      sectionFieldKeys[0].forEach((key) => { if (!v(key)) fields[key] = "이 과정의 역할을 자신의 표현으로 적어 주세요."; });
      return { passed: result.passed && Object.keys(fields).length === 0, fields, issues: result.missing };
    }
    if (sectionIndex === 1) {
      const code = [`BLACK_VALUE = ${v("1.black_value")}`, `WHITE_VALUE = ${v("1.white_value")}`, `BASE_SPEED = ${v("1.base_speed")}`, `TARGET = ${v("1.target")}`, `KP = ${v("1.kp")}`, `KD = ${v("1.kd")}`].join("\n");
      const result = validateCode(1, code, 1); const mapped = issueMap(1, result.missing);
      return { passed: result.passed, fields: mapped.fields, issues: mapped.remaining };
    }
    if (sectionIndex === 2) {
      const sensor = overall ? v("2.sensor") : "color_sensor.reflection()";
      const code = [`def line_follow(${v("2.params")}):`, `    previous_error = ${v("2.previous_error")}`, `    while ${v("2.loop")}:`, `        sensor_value = ${sensor}`].join("\n");
      const result = validateCode(2, code, 1); const mapped = issueMap(2, result.missing);
      if (!overall) delete mapped.fields["2.sensor"];
      return { passed: result.passed || (!overall && Object.keys(mapped.fields).length === 0 && mapped.remaining.length === 0), fields: mapped.fields, issues: mapped.remaining };
    }
    if (sectionIndex === 3) {
      const sensorCode = [`def line_follow(base_speed, target, kp, kd):`, `    previous_error = 0`, `    while True:`, `        sensor_value = ${v("2.sensor")}`].join("\n");
      const sensorResult = validateCode(2, sensorCode, 1); const sensorMapped = issueMap(2, sensorResult.missing);
      const formulaResult = validateCode(3, `error = ${v("3.error")}\np_control = ${v("3.p_control")}`, 1); const formulaMapped = issueMap(3, formulaResult.missing);
      return { passed: sensorResult.passed && formulaResult.passed, fields: { ...sensorMapped.fields, ...formulaMapped.fields }, issues: [...sensorMapped.remaining, ...formulaMapped.remaining] };
    }
    if (sectionIndex === 4) {
      const result = validateCode(4, `change = ${v("4.change")}\nd_control = ${v("4.d_control")}`, 1); const mapped = issueMap(4, result.missing);
      return { passed: result.passed, fields: mapped.fields, issues: mapped.remaining };
    }
    const code = [`correction = ${v("5.correction")}`, `left_power = ${v("5.left_power")}`, `right_power = ${v("5.right_power")}`, `previous_error = ${v("5.previous_error")}`, `left_motor.dc(${v("5.left_motor")})`, `right_motor.dc(${v("5.right_motor")})`].join("\n");
    const result = validateCode(5, code, 1); const mapped = issueMap(5, result.missing);
    return { passed: result.passed, fields: mapped.fields, issues: mapped.remaining };
  }

  function applySectionResult(sectionIndex: number, result: ValidationView) {
    const sectionKeys = sectionFieldKeys[sectionIndex];
    setFieldErrors((current) => {
      const next = { ...current };
      sectionKeys.forEach((key) => delete next[key]);
      return { ...next, ...result.fields };
    });
    setSectionIssues((current) => ({ ...current, [sectionIndex]: result.issues }));
    setCompleted((current) => current.map((value, index) => index === sectionIndex ? result.passed : value));
  }

  function checkSection(sectionIndex: number) {
    const result = resultFor(sectionIndex);
    applySectionResult(sectionIndex, result);
    if (!result.passed) requestAnimationFrame(() => sectionRefs.current[sectionIndex]?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function checkAll() {
    const results = sectionNames.map((_, sectionIndex) => resultFor(sectionIndex, sectionIndex === 2));
    results.forEach((result, sectionIndex) => applySectionResult(sectionIndex, result));
    const passed = results.every((result) => result.passed);
    setOverallChecked(passed);
    if (!passed) {
      const firstInvalid = results.findIndex((result) => !result.passed);
      requestAnimationFrame(() => sectionRefs.current[firstInvalid]?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
  }

  function resetCode() {
    setAnswers(initialCodeAnswers); setHints({}); setFieldErrors({}); setSectionIssues({}); setCompleted(sectionNames.map(() => false)); setOverallChecked(false);
  }

  function input(fieldKey: string, label: string, placeholder: string, wide = false) {
    const tiers = hintTiers(fieldKey);
    const level = hints[fieldKey] ?? 0;
    const activeHint = level > 0 ? tiers[Math.min(level, tiers.length) - 1] : null;
    return <PracticeInput fieldKey={fieldKey} label={label} placeholder={placeholder} value={answers[fieldKey] ?? ""} error={fieldErrors[fieldKey]} wide={wide} onChange={(value) => updateAnswer(fieldKey, value)} onHint={tiers.length ? () => toggleHint(fieldKey) : undefined} hint={activeHint ? <><b>{activeHint.label}</b>{activeHint.body}</> : undefined}/>;
  }

  return <section className={styles.codeMode} data-qa="code-mode">
    <header className={styles.modeHeading}><div><small>ONE PROGRAM · SIX STEPS</small><h2>전체 코드를 위에서 아래로 완성해요</h2><p>한 화면에서 작은 학습 단위를 순서대로 검사하며 하나의 line_follow() 함수를 만듭니다.</p></div><button className={styles.dictionaryButton} onClick={() => openGlossary()}><Icon name="book" size={16}/> 개념 사전</button></header>
    <section className={styles.codeProgress} data-qa="code-progress"><header><div><small>CODE PROGRESS</small><b>{completedCount} / {sectionNames.length} 완료</b></div><button onClick={resetCode}><Icon name="refresh" size={15}/> 전체 초기화</button></header><i><em style={{ width: `${(completedCount / sectionNames.length) * 100}%` }}/></i><nav aria-label="코드 작성 단계">{sectionNames.map((name, index) => <button key={name} className={completed[index] ? styles.stepDone : ""} onClick={() => sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" })}><span>{completed[index] ? <Icon name="check" size={13}/> : String(index + 1).padStart(2, "0")}</span><b>{name}</b></button>)}</nav></section>
    <section className={styles.codeEditor} aria-label="라인 팔로잉 전체 코드 작성">
      <header className={styles.editorTop}><span/><span/><span/><b>line_follow.py</b></header>
      <div className={styles.editorNotice}><Icon name="terminal" size={15}/><span>잠긴 코드는 읽고, 밝게 표시된 빈칸만 직접 입력하세요.</span><b>Python 들여쓰기 구조 유지</b></div>

      <section ref={(node) => { sectionRefs.current[0] = node; }} className={`${styles.codeSection} ${completed[0] ? styles.sectionComplete : ""}`} data-qa="code-section-1">
        <header><span>{completed[0] ? <Icon name="check" size={15}/> : "01"}</span><div><small>STEP 01</small><h3>처리 순서</h3></div><button onClick={() => checkSection(0)}>{completed[0] ? "다시 검사" : "STEP 검사"}</button></header>
        <div className={styles.codeLine}><span>1</span><code># </code>{input("0.sensor", "센서 확인", "현재 상태를 확인하는 과정", true)}</div>
        <div className={styles.codeLine}><span>2</span><code># </code>{input("0.error", "오차 계산", "기준과의 차이를 구하는 과정", true)}</div>
        <div className={styles.codeLine}><span>3</span><code># </code>{input("0.direction", "방향 보정", "좌우 움직임을 조절하는 과정", true)}</div>
        <div className={styles.codeLine}><span>4</span><code># </code>{input("0.repeat", "반복", "처음부터 다시 수행하는 과정", true)}</div>
        {(sectionIssues[0]?.length ?? 0) > 0 ? <div className={styles.sectionError} aria-live="polite">{sectionIssues[0].map((issue) => <p key={issue}>{issue}</p>)}</div> : null}
      </section>

      <section ref={(node) => { sectionRefs.current[1] = node; }} className={`${styles.codeSection} ${completed[1] ? styles.sectionComplete : ""}`} data-qa="code-section-2">
        <header><span>{completed[1] ? <Icon name="check" size={15}/> : "02"}</span><div><small>STEP 02</small><h3>변수 설정</h3></div><button onClick={() => checkSection(1)}>{completed[1] ? "다시 검사" : "STEP 검사"}</button></header>
        <div className={styles.codeLine}><span>6</span><code>BLACK_VALUE = </code>{input("1.black_value", "검정 반사광", "0~100")}</div>
        <div className={styles.codeLine}><span>7</span><code>WHITE_VALUE = </code>{input("1.white_value", "흰색 반사광", "검정보다 큰 값")}</div>
        <div className={styles.codeLine}><span>8</span><code>BASE_SPEED = </code>{input("1.base_speed", "기본 속도", "1~100")}</div>
        <div className={styles.codeLine}><span>9</span><code>TARGET = </code>{input("1.target", "센서 기준값", "두 반사광의 평균식", true)}</div>
        <div className={styles.codeLine}><span>10</span><code>KP = </code>{input("1.kp", "P 계수", "0보다 크고 3 이하")}</div>
        <div className={styles.codeLine}><span>11</span><code>KD = </code>{input("1.kd", "D 계수", "0~2")}</div>
        {(sectionIssues[1]?.length ?? 0) > 0 ? <div className={styles.sectionError} aria-live="polite">{sectionIssues[1].map((issue) => <p key={issue}>{issue}</p>)}</div> : null}
      </section>

      <section ref={(node) => { sectionRefs.current[2] = node; }} className={`${styles.codeSection} ${completed[2] ? styles.sectionComplete : ""}`} data-qa="code-section-3">
        <header><span>{completed[2] ? <Icon name="check" size={15}/> : "03"}</span><div><small>STEP 03</small><h3>함수 구조</h3></div><button onClick={() => checkSection(2)}>{completed[2] ? "다시 검사" : "STEP 검사"}</button></header>
        <div className={styles.codeLine}><span>13</span><code>def line_follow(</code>{input("2.params", "매개변수 네 개", "base_speed, target, kp, kd", true)}<code>):</code></div>
        <div className={`${styles.codeLine} ${styles.indentOne}`}><span>14</span><code>previous_error = </code>{input("2.previous_error", "이전 오차 초기값", "0")}</div>
        <div className={`${styles.codeLine} ${styles.indentOne}`}><span>15</span><code>while </code>{input("2.loop", "반복 조건", "True")}<code>:</code></div>
        {(sectionIssues[2]?.length ?? 0) > 0 ? <div className={styles.sectionError} aria-live="polite">{sectionIssues[2].map((issue) => <p key={issue}>{issue}</p>)}</div> : null}
      </section>

      <section ref={(node) => { sectionRefs.current[3] = node; }} className={`${styles.codeSection} ${completed[3] ? styles.sectionComplete : ""}`} data-qa="code-section-4">
        <header><span>{completed[3] ? <Icon name="check" size={15}/> : "04"}</span><div><small>STEP 04</small><h3>센서 + P 제어</h3></div><button onClick={() => checkSection(3)}>{completed[3] ? "다시 검사" : "STEP 검사"}</button></header>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>16</span><code>sensor_value = </code>{input("2.sensor", "센서 읽기", "color_sensor.reflection()", true)}</div>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>17</span><code>error = </code>{input("3.error", "오차 계산", "기준값 - 현재값", true)}</div>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>18</span><code>p_control = </code>{input("3.p_control", "P 제어", "P 계수 × 현재 오차", true)}</div>
        {(sectionIssues[3]?.length ?? 0) > 0 ? <div className={styles.sectionError} aria-live="polite">{sectionIssues[3].map((issue) => <p key={issue}>{issue}</p>)}</div> : null}
      </section>

      <section ref={(node) => { sectionRefs.current[4] = node; }} className={`${styles.codeSection} ${completed[4] ? styles.sectionComplete : ""}`} data-qa="code-section-5">
        <header><span>{completed[4] ? <Icon name="check" size={15}/> : "05"}</span><div><small>STEP 05</small><h3>D 제어</h3></div><button onClick={() => checkSection(4)}>{completed[4] ? "다시 검사" : "STEP 검사"}</button></header>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>19</span><code>change = </code>{input("4.change", "변화량", "현재 오차 - 이전 오차", true)}</div>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>20</span><code>d_control = </code>{input("4.d_control", "D 제어", "D 계수 × 변화량", true)}</div>
        {(sectionIssues[4]?.length ?? 0) > 0 ? <div className={styles.sectionError} aria-live="polite">{sectionIssues[4].map((issue) => <p key={issue}>{issue}</p>)}</div> : null}
      </section>

      <section ref={(node) => { sectionRefs.current[5] = node; }} className={`${styles.codeSection} ${completed[5] ? styles.sectionComplete : ""}`} data-qa="code-section-6">
        <header><span>{completed[5] ? <Icon name="check" size={15}/> : "06"}</span><div><small>STEP 06</small><h3>모터 제어</h3></div><button onClick={() => checkSection(5)}>{completed[5] ? "다시 검사" : "STEP 검사"}</button></header>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>21</span><code>correction = </code>{input("5.correction", "PD 결합", "P 반응 + D 반응", true)}</div>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>22</span><code>left_power = </code>{input("5.left_power", "왼쪽 출력", "기본 속도 + 보정값", true)}</div>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>23</span><code>right_power = </code>{input("5.right_power", "오른쪽 출력", "기본 속도 - 보정값", true)}</div>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>24</span><code>previous_error = </code>{input("5.previous_error", "이전 오차 저장", "이번 반복의 현재 오차", true)}</div>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>25</span><code>left_motor.dc(</code>{input("5.left_motor", "왼쪽 모터 출력", "left_power", true)}<code>)</code></div>
        <div className={`${styles.codeLine} ${styles.indentTwo}`}><span>26</span><code>right_motor.dc(</code>{input("5.right_motor", "오른쪽 모터 출력", "right_power", true)}<code>)</code></div>
        <div className={styles.lockedLine}><span>28</span><code>line_follow(BASE_SPEED, TARGET, KP, KD)</code><em>주어짐</em></div>
        {(sectionIssues[5]?.length ?? 0) > 0 ? <div className={styles.sectionError} aria-live="polite">{sectionIssues[5].map((issue) => <p key={issue}>{issue}</p>)}</div> : null}
      </section>
    </section>

    <section className={`${styles.fullValidation} ${allPassed ? styles.validationPassed : ""}`} aria-live="polite" data-qa="full-validation">
      <header><span><Icon name={allPassed ? "check" : "terminal"} size={23}/></span><div><small>FULL CODE VALIDATION</small><h2>{allPassed ? "ALL TESTS PASSED" : "전체 코드를 한 번에 확인해요"}</h2></div></header>
      <div>{sectionNames.map((name, index) => <button key={name} onClick={() => sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" })}><span>{completed[index] ? <Icon name="check" size={14}/> : "!"}</span><b>{name}</b><em>{completed[index] ? "통과" : "확인 필요"}</em></button>)}</div>
      <button className={styles.primaryButton} onClick={checkAll}><Icon name="terminal" size={17}/> 전체 코드 검사</button>
    </section>

    {allPassed ? <section className={styles.completedCode} data-qa="completed-code"><header><span><Icon name="check" size={24}/></span><div><small>LINE FOLLOWING CODE COMPLETE</small><h2>내가 완성한 전체 코드</h2></div></header><pre>{fullCode}</pre></section> : null}
  </section>;
}

export default function PracticePage() {
  const [tab, setTab] = useState<PracticeTab>("quiz");
  const [loaded, setLoaded] = useState(false);
  const [dictionaryIndex, setDictionaryIndex] = useState(0);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === "quiz" || saved === "code") setTab(saved);
      setLoaded(true);
    });
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(MODE_KEY, tab); }, [loaded, tab]);

  function openGlossary(topicId?: string) {
    if (topicId) {
      const found = glossaryTopics.findIndex((topic) => topic.id === topicId);
      if (found >= 0) setDictionaryIndex(found);
    }
    setDictionaryOpen(true);
  }

  return <><main className={styles.page} aria-hidden={dictionaryOpen || undefined} inert={dictionaryOpen || undefined}>
    <div className={styles.backgroundGrid} aria-hidden="true"/>
    <header className={styles.siteHeader}>
      <Link href="/" className={styles.brand} aria-label="기존 라인 코어 게임으로 돌아가기"><Image src="/assets/playwell-logo.png" alt="PLAYWELL" width={806} height={213} priority unoptimized/><span><small>LINE FOLLOWING</small><b>CONCEPT &amp; CODE PRACTICE</b></span></Link>
      <Link href="/" className={styles.gameLink}><Icon name="arrow" size={15}/> 기존 게임</Link>
    </header>
    <section className={styles.practiceShell}>
      <header className={styles.hero}><div><small>LINE CORE ACADEMY · CLASS PRACTICE</small><h1>개념 문제와 전체 코드를<br/>원하는 방식으로 연습해요</h1><p>객관식 20문제 또는 하나의 전체 Python 프로그램을 선택해 학습할 수 있습니다.</p></div><Image src="/assets/lumi-guide.webp" alt="두 가지 학습 모드를 안내하는 루미" width={800} height={800} priority unoptimized/></header>
      <nav className={styles.tabs} aria-label="학습 모드 선택" role="tablist">
        <button role="tab" id="quiz-tab" aria-selected={tab === "quiz"} aria-controls="quiz-panel" className={tab === "quiz" ? styles.activeTab : ""} onClick={() => setTab("quiz")}><span><Icon name="book" size={19}/></span><b>객관식 문제</b><small>20문제 개념 점검</small></button>
        <button role="tab" id="code-tab" aria-selected={tab === "code"} aria-controls="code-panel" className={tab === "code" ? styles.activeTab : ""} onClick={() => setTab("code")}><span><Icon name="code" size={19}/></span><b>코드 완성</b><small>전체 함수 작성</small></button>
      </nav>
      <section id={`${tab}-panel`} role="tabpanel" aria-labelledby={`${tab}-tab`} className={styles.tabPanel}>{tab === "quiz" ? <QuizMode openGlossary={openGlossary}/> : <CodeMode openGlossary={openGlossary}/>}</section>
    </section>
  </main>{dictionaryOpen ? <ConceptDictionary index={dictionaryIndex} onSelect={setDictionaryIndex} onClose={() => setDictionaryOpen(false)}/> : null}</>;
}
