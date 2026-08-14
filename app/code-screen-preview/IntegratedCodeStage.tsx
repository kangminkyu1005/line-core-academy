"use client";

import { Dispatch, KeyboardEvent, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import styles from "./preview.module.css";

type WritingMode = "guided" | "free";
type BlankStatus = "idle" | "editing" | "valid" | "invalid";
type BlankKind = "number" | "concept" | "self" | "library";
type BlankWidth = "medium" | "large" | "xlarge";
type MissionView = {
  chapter: string;
  title: string;
  goal: string;
  codeTitle: string;
  codeHint: string;
  hintLevels: [string, string, string];
  solution: string;
};
type Blank = {
  id: string;
  label: string;
  placeholder: string;
  kind: BlankKind;
  width: BlankWidth;
  validate: (value: string) => string | null;
  hints?: string[];
};
type Part = { type: "text"; value: string; locked?: boolean } | { type: "blank"; id: string };
type Line = { indent: number; parts: Part[]; locked?: boolean; note?: string };
type Spec = { blanks: Blank[]; lines: Line[]; tests: string[]; fileName: string };
type Meta = { status: BlankStatus; error: string | null; wrongAttempts: number; hintOpen: boolean; hintTier: number; pulse: boolean };

type Props = {
  active: number;
  mission: MissionView;
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
  writingMode: WritingMode;
  showLearningReview: boolean;
  onModeChange: (mode: WritingMode) => void;
  onBack: () => void;
  onCheck: () => void;
};

function stripComment(value: string) { return value.split("#", 1)[0].trim(); }
function compact(value: string) { return stripComment(value).replace(/\s+/g, ""); }
function expression(value: string) {
  let next = stripComment(value);
  while (next.startsWith("(") && next.endsWith(")")) {
    let depth = 0;
    let wraps = true;
    for (let index = 0; index < next.length; index += 1) {
      if (next[index] === "(") depth += 1;
      if (next[index] === ")") depth -= 1;
      if (depth === 0 && index < next.length - 1) { wraps = false; break; }
    }
    if (!wraps) break;
    next = next.slice(1, -1).trim();
  }
  return next.replace(/\s+/g, "");
}
function exact(expected: string, label: string) {
  return (value: string) => !value.trim() ? `${label}을 입력해 주세요.` : expression(value) === expected ? null : `${label}의 변수 이름, 연산자와 순서를 확인해 보세요.`;
}
function range(min: number, max: number, label: string, includeMin = true) {
  return (value: string) => {
    const cleaned = stripComment(value);
    if (!cleaned) return `${label}을 입력해 주세요.`;
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)) return `${label}에는 숫자를 입력해 주세요.`;
    const number = Number(cleaned);
    const lower = includeMin ? number >= min : number > min;
    return Number.isFinite(number) && lower && number <= max ? null : `${label}의 허용 범위를 확인해 보세요.`;
  };
}
function normalizeKorean(value: string) { return value.replace(/^\s*#\s*/, "").replace(/[\s·.,!?→\-_/]/g, "").toLowerCase(); }
function semantic(kind: "sensor" | "error" | "direction" | "repeat") {
  return (value: string) => {
    const normalized = normalizeKorean(value);
    if (!normalized) return "이 과정의 역할을 자신의 표현으로 적어 주세요.";
    const passed = kind === "sensor"
      ? ((normalized.includes("센서") || normalized.includes("반사광")) && ["확인", "읽", "측정"].some((token) => normalized.includes(token)))
      : kind === "error"
        ? ((normalized.includes("오차") || normalized.includes("차이")) && ["계산", "구", "확인"].some((token) => normalized.includes(token)))
        : kind === "direction"
          ? ((normalized.includes("방향") || normalized.includes("모터")) && ["보정", "조절", "수정", "제어"].some((token) => normalized.includes(token)))
          : normalized.includes("반복") || (normalized.includes("다시") && ["수행", "처리", "실행"].some((token) => normalized.includes(token)));
    return passed ? null : "표현은 달라도 괜찮지만 핵심 역할이 드러나야 해요.";
  };
}

function specs(mission: MissionView): Spec[] {
  return [
    {
      fileName: "mission_1.py",
      blanks: [
        { id: "sensor", label: "센서 확인", placeholder: "현재 상태를 확인하는 과정", kind: "concept", width: "large", validate: semantic("sensor"), hints: [mission.hintLevels[0]] },
        { id: "error", label: "오차 계산", placeholder: "기준과의 차이를 구하는 과정", kind: "concept", width: "large", validate: semantic("error"), hints: [mission.hintLevels[0]] },
        { id: "direction", label: "방향 보정", placeholder: "좌우 움직임을 조절하는 과정", kind: "concept", width: "large", validate: semantic("direction"), hints: [mission.hintLevels[1]] },
        { id: "repeat", label: "반복", placeholder: "처음부터 다시 수행하는 과정", kind: "concept", width: "large", validate: semantic("repeat"), hints: [mission.hintLevels[2]] },
      ],
      lines: [
        { indent: 0, parts: [{ type: "text", value: "# ", locked: true }, { type: "blank", id: "sensor" }] },
        { indent: 0, parts: [{ type: "text", value: "# ", locked: true }, { type: "blank", id: "error" }] },
        { indent: 0, parts: [{ type: "text", value: "# ", locked: true }, { type: "blank", id: "direction" }] },
        { indent: 0, parts: [{ type: "text", value: "# ", locked: true }, { type: "blank", id: "repeat" }] },
      ],
      tests: ["역할 표현을 유연하게 판정", "처리 순서 유지", "띄어쓰기 차이 허용"],
    },
    {
      fileName: "mission_2.py",
      blanks: [
        { id: "black_value", label: "검정 반사광", placeholder: "0~100 사이 값", kind: "number", width: "medium", validate: range(0, 100, "black_value") },
        { id: "white_value", label: "흰색 반사광", placeholder: "검정보다 큰 값", kind: "number", width: "medium", validate: range(0, 100, "white_value") },
        { id: "base_speed", label: "기본 속도", placeholder: "1~100 사이 값", kind: "number", width: "medium", validate: range(0, 100, "base_speed", false) },
        { id: "target", label: "센서 기준값", placeholder: "두 반사광의 평균식", kind: "concept", width: "xlarge", validate: exact("(black_value+white_value)/2", "target 식"), hints: mission.hintLevels },
        { id: "kp", label: "P 계수", placeholder: "0보다 크고 3 이하", kind: "number", width: "medium", validate: range(0, 3, "kp", false) },
        { id: "kd", label: "D 계수", placeholder: "0~2 사이 값", kind: "number", width: "medium", validate: range(0, 2, "kd") },
      ],
      lines: ["black_value", "white_value", "base_speed", "target", "kp", "kd"].map((id) => ({ indent: 0, parts: [{ type: "text", value: `${id} = `, locked: true }, { type: "blank", id }] })),
      tests: ["검정값 < 흰색값", "target은 평균식", "Kp·Kd 허용 범위"],
    },
    {
      fileName: "mission_3.py",
      blanks: [
        { id: "params", label: "매개변수 네 개", placeholder: "이전 장의 변수 이름을 순서대로", kind: "self", width: "xlarge", validate: (value) => compact(value) === "base_speed,target,kp,kd" ? null : "네 변수 이름과 순서를 확인해 보세요.", hints: ["1장에서 사용한 base_speed, target, kp, kd를 순서대로 적어 보세요."] },
        { id: "loop", label: "반복 조건", placeholder: "항상 참인 값", kind: "concept", width: "medium", validate: (value) => stripComment(value) === "True" ? null : "파이썬의 참 값 True를 입력해 주세요.", hints: ["조건이 계속 참이어야 하므로 True를 사용합니다."] },
        { id: "sensor", label: "센서 읽기", placeholder: "반사광을 읽는 명령", kind: "library", width: "xlarge", validate: (value) => compact(value) === "color_sensor.reflection()" ? null : "센서 객체와 반사광 함수 이름을 확인해 보세요.", hints: ["후보: .reflection() · .color() · .ambient() · .hsv()", "정확한 이름은 color_sensor.reflection()입니다."] },
      ],
      lines: [
        { indent: 0, parts: [{ type: "text", value: "def line_follow(", locked: true }, { type: "blank", id: "params" }, { type: "text", value: "):", locked: true }] },
        { indent: 1, locked: true, note: "주어짐", parts: [{ type: "text", value: "previous_error = 0", locked: true }] },
        { indent: 0, parts: [{ type: "text", value: "" }] },
        { indent: 1, parts: [{ type: "text", value: "while ", locked: true }, { type: "blank", id: "loop" }, { type: "text", value: ":", locked: true }] },
        { indent: 2, parts: [{ type: "text", value: "sensor_value = ", locked: true }, { type: "blank", id: "sensor" }] },
      ],
      tests: ["매개변수 순서", "0과 0.0 허용", "인라인 주석 제외"],
    },
    {
      fileName: "mission_4.py",
      blanks: [
        { id: "error", label: "오차 계산", placeholder: "기준값 - 현재값", kind: "concept", width: "large", validate: exact("target-sensor_value", "error 식"), hints: mission.hintLevels.slice(0, 2) },
        { id: "p_control", label: "P 제어", placeholder: "P 계수 × 현재 오차", kind: "concept", width: "large", validate: exact("kp*error", "p_control 식"), hints: mission.hintLevels.slice(1) },
      ],
      lines: [
        { indent: 2, parts: [{ type: "text", value: "error = ", locked: true }, { type: "blank", id: "error" }] },
        { indent: 2, parts: [{ type: "text", value: "p_control = ", locked: true }, { type: "blank", id: "p_control" }] },
      ],
      tests: ["target - sensor_value", "kp * error", "공백·괄호 정규화"],
    },
    {
      fileName: "mission_5.py",
      blanks: [
        { id: "change", label: "변화량", placeholder: "현재 오차 - 이전 오차", kind: "concept", width: "large", validate: exact("error-previous_error", "change 식"), hints: mission.hintLevels.slice(0, 2) },
        { id: "d_control", label: "D 제어", placeholder: "D 계수 × 변화량", kind: "concept", width: "large", validate: exact("kd*change", "d_control 식"), hints: mission.hintLevels.slice(1) },
      ],
      lines: [
        { indent: 2, parts: [{ type: "text", value: "change = ", locked: true }, { type: "blank", id: "change" }] },
        { indent: 2, parts: [{ type: "text", value: "d_control = ", locked: true }, { type: "blank", id: "d_control" }] },
      ],
      tests: ["error - previous_error", "kd * change", "순서 유지"],
    },
    {
      fileName: "mission_6.py",
      blanks: [
        { id: "correction", label: "PD 결합", placeholder: "P 반응 + D 반응", kind: "concept", width: "large", validate: exact("p_control+d_control", "correction 식"), hints: [mission.hintLevels[0]] },
        { id: "left_power", label: "왼쪽 출력", placeholder: "기본 속도 + 보정값", kind: "concept", width: "large", validate: exact("base_speed+correction", "left_power 식"), hints: [mission.hintLevels[1]] },
        { id: "right_power", label: "오른쪽 출력", placeholder: "기본 속도 - 보정값", kind: "concept", width: "large", validate: exact("base_speed-correction", "right_power 식"), hints: [mission.hintLevels[1]] },
        { id: "previous_error", label: "이전 오차 저장", placeholder: "이번 반복의 현재 오차", kind: "concept", width: "medium", validate: exact("error", "previous_error 식"), hints: [mission.hintLevels[2]] },
      ],
      lines: [
        { indent: 2, parts: [{ type: "text", value: "correction = ", locked: true }, { type: "blank", id: "correction" }] },
        { indent: 2, parts: [{ type: "text", value: "left_power = ", locked: true }, { type: "blank", id: "left_power" }] },
        { indent: 2, parts: [{ type: "text", value: "right_power = ", locked: true }, { type: "blank", id: "right_power" }] },
        { indent: 0, parts: [{ type: "text", value: "" }] },
        { indent: 2, locked: true, note: "주어짐", parts: [{ type: "text", value: "left_motor.dc(left_power)", locked: true }] },
        { indent: 2, locked: true, note: "주어짐", parts: [{ type: "text", value: "right_motor.dc(right_power)", locked: true }] },
        { indent: 0, parts: [{ type: "text", value: "" }] },
        { indent: 2, parts: [{ type: "text", value: "previous_error = ", locked: true }, { type: "blank", id: "previous_error" }] },
      ],
      tests: ["P + D 결합", "좌우 반대 부호", "이전 오차 저장"],
    },
  ];
}

function assignment(code: string, name: string) { return code.match(new RegExp(`^\\s*${name}\\s*=\\s*([^#\\n]+)`, "m"))?.[1]?.trim() ?? ""; }
function parse(active: number, spec: Spec, code: string) {
  const result = Object.fromEntries(spec.blanks.map((blank) => [blank.id, ""]));
  if (active === 0) {
    const comments = code.split("\n").map((line) => line.match(/^\s*#\s*(.+?)\s*$/)?.[1] ?? "").filter(Boolean);
    spec.blanks.forEach((blank, index) => { result[blank.id] = comments[index] ?? ""; });
  } else if (active === 2) {
    result.params = code.match(/def\s+line_follow\s*\(([^)]*)\)/)?.[1]?.trim() ?? "";
    result.loop = code.match(/while\s+([^:]+)\s*:/)?.[1]?.trim() ?? "";
    result.sensor = assignment(code, "sensor_value");
  } else {
    spec.blanks.forEach((blank) => { result[blank.id] = assignment(code, blank.id); });
  }
  return result;
}
function build(spec: Spec, values: Record<string, string>) {
  return spec.lines.map((line) => `${"    ".repeat(line.indent)}${line.parts.map((part) => part.type === "text" ? part.value : values[part.id] ?? "").join("")}`).join("\n");
}
function initialMeta(spec: Spec): Record<string, Meta> {
  return Object.fromEntries(spec.blanks.map((blank) => [blank.id, { status: "idle", error: null, wrongAttempts: 0, hintOpen: false, hintTier: 0, pulse: false }]));
}
function freeKey(event: KeyboardEvent<HTMLTextAreaElement>, setCode: Dispatch<SetStateAction<string>>) {
  const target = event.currentTarget;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  if (event.key === "Tab") {
    event.preventDefault();
    const insertion = event.shiftKey ? "" : "    ";
    setCode((current) => `${current.slice(0, start)}${insertion}${current.slice(end)}`);
    requestAnimationFrame(() => target.setSelectionRange(start + insertion.length, start + insertion.length));
  }
  if (event.key === "Enter") {
    const lineStart = target.value.lastIndexOf("\n", start - 1) + 1;
    const line = target.value.slice(lineStart, start);
    const indent = line.match(/^\s*/)?.[0].replace(/\t/g, "    ") ?? "";
    const nextIndent = line.trimEnd().endsWith(":") ? `${indent}    ` : indent;
    event.preventDefault();
    const insertion = `\n${nextIndent}`;
    setCode((current) => `${current.slice(0, start)}${insertion}${current.slice(end)}`);
    requestAnimationFrame(() => target.setSelectionRange(start + insertion.length, start + insertion.length));
  }
}

export default function IntegratedCodeStage({ active, mission, code, setCode, writingMode, showLearningReview, onModeChange, onBack, onCheck }: Props) {
  const spec = useMemo(() => specs(mission)[active], [active, mission]);
  const [values, setValues] = useState<Record<string, string>>(() => parse(active, spec, code));
  const [meta, setMeta] = useState<Record<string, Meta>>(() => initialMeta(spec));
  const [activeBlank, setActiveBlank] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setValues(parse(active, spec, code));
    setMeta(initialMeta(spec));
    setActiveBlank(null);
  }, [active, writingMode]);

  const completed = spec.blanks.filter((blank) => meta[blank.id]?.status === "valid").length;
  const update = (id: string, value: string) => {
    const next = { ...values, [id]: value };
    setValues(next);
    setMeta((current) => ({ ...current, [id]: { ...current[id], status: value.trim() ? "editing" : "idle", error: null } }));
    setCode(build(spec, next));
  };
  const validate = (blank: Blank, report = false) => {
    const error = blank.validate(values[blank.id] ?? "");
    setMeta((current) => {
      const before = current[blank.id];
      const wrongAttempts = error && report ? before.wrongAttempts + 1 : before.wrongAttempts;
      return { ...current, [blank.id]: { ...before, status: error ? "invalid" : "valid", error, wrongAttempts, pulse: Boolean(error && wrongAttempts === 1 && blank.hints?.length), hintOpen: before.hintOpen || Boolean(error && wrongAttempts >= 2 && blank.hints?.length), hintTier: error && wrongAttempts >= 2 && before.hintTier === 0 ? 1 : before.hintTier } };
    });
    return error;
  };
  const focus = (id: string) => {
    setActiveBlank(id);
    requestAnimationFrame(() => refs.current[id]?.focus());
  };
  const move = (id: string, direction: 1 | -1) => {
    const index = spec.blanks.findIndex((blank) => blank.id === id);
    const next = spec.blanks[index + direction];
    if (next) focus(next.id);
  };
  const check = () => {
    spec.blanks.forEach((blank) => validate(blank, true));
    onCheck();
  };

  return <section className={`${styles.stage} stagePanel codeStage`} aria-hidden={showLearningReview} inert={showLearningReview ? true : undefined}>
    <div className={styles.activityHead}>
      <span className={styles.activityIcon}>⌘</span>
      <div><p>STEP 3 · 코드 작성</p><h1>{mission.codeTitle}</h1><span>{mission.codeHint}</span></div>
    </div>
    <div className={styles.learningReason}><span>◎</span><div><small>MISSION GOAL</small><b>{mission.goal}</b></div></div>
    <div className={styles.codeWorkspace}>
      <aside className={styles.checklist}>
        <header><small>WRITING ROUTE</small><b>작성 순서</b><span>{completed} / {spec.blanks.length}</span></header>
        <div className={styles.checklistProgress}><i style={{ width: `${spec.blanks.length ? completed / spec.blanks.length * 100 : 0}%` }}/></div>
        <div className={styles.checkItems}>{spec.blanks.map((blank, index) => {
          const item = meta[blank.id];
          return <button key={blank.id} className={`${styles.checkItem} ${styles[`status_${item.status}`]} ${activeBlank === blank.id ? styles.checkItemActive : ""}`} onClick={() => focus(blank.id)}>
            <span>{item.status === "valid" ? "✓" : String(index + 1).padStart(2, "0")}</span><div><small>{blank.kind === "number" ? "판단형" : blank.kind === "concept" ? "개념형" : blank.kind === "self" ? "자기참조" : "라이브러리"}</small><b>{blank.label}</b></div><em>{item.status === "valid" ? "완료" : item.status === "invalid" ? "확인" : item.status === "editing" ? "입력중" : "대기"}</em>
          </button>;
        })}</div>
      </aside>
      <section className={styles.editorPanel}>
        <div className={styles.editorTop}><span/><span/><span/><b>{spec.fileName}</b><div className={styles.modeTabs}><button className={writingMode === "guided" ? styles.modeActive : ""} onClick={() => onModeChange("guided")}>빈칸 가이드</button><button className={writingMode === "free" ? styles.modeActive : ""} onClick={() => onModeChange("free")}>자유 작성</button></div></div>
        {writingMode === "guided" ? <div className={styles.guidedEditor}>
          <div className={styles.editorNotice}><span>코드 흐름 안의 빈칸만 직접 타이핑하세요.</span><b>Tab · Shift+Tab으로 이동</b></div>
          <div className={styles.codeLines}>{spec.lines.map((line, lineIndex) => <div className={`${styles.codeLine} ${line.locked ? styles.lockedLine : ""}`} key={`${lineIndex}-${line.indent}`}>
            <span className={styles.lineNumber}>{lineIndex + 1}</span><div className={styles.lineBody} style={{ paddingLeft: `${16 + line.indent * 28}px` }}>{line.parts.map((part, partIndex) => {
              if (part.type === "text") return <span key={partIndex} className={part.locked && part.value.trim() ? styles.lockedText : ""}>{part.value}</span>;
              const blank = spec.blanks.find((item) => item.id === part.id)!;
              const item = meta[blank.id];
              return <span className={styles.blankWrap} key={partIndex}><input ref={(node) => { refs.current[blank.id] = node; }} className={`${styles.blankInput} ${styles[`width_${blank.width}`]} ${styles[`input_${item.status}`]}`} value={values[blank.id] ?? ""} placeholder={blank.placeholder} autoCapitalize="none" autoCorrect="off" spellCheck={false} onFocus={() => setActiveBlank(blank.id)} onChange={(event) => update(blank.id, event.target.value)} onBlur={() => { if ((values[blank.id] ?? "").trim()) validate(blank); }} onKeyDown={(event) => { if (event.key === "Tab") { event.preventDefault(); move(blank.id, event.shiftKey ? -1 : 1); } if (event.key === "Enter") { event.preventDefault(); validate(blank); move(blank.id, 1); } }}/>{blank.hints?.length ? <button className={`${styles.hintButton} ${item.pulse ? styles.hintPulse : ""}`} onMouseDown={(event) => event.preventDefault()} onClick={() => setMeta((current) => ({ ...current, [blank.id]: { ...current[blank.id], hintOpen: !current[blank.id].hintOpen, hintTier: current[blank.id].hintTier || 1, pulse: false } }))}>?</button> : null}</span>;
            })}{line.note ? <em className={styles.givenBadge}>🔒 {line.note}</em> : null}</div>
          </div>)}</div>
          {activeBlank && meta[activeBlank]?.hintOpen ? <section className={styles.hintPanel}><span>?</span><div><small>HINT</small><div>{spec.blanks.find((blank) => blank.id === activeBlank)?.hints?.[Math.max(0, meta[activeBlank].hintTier - 1)]}</div></div></section> : null}
          {activeBlank && meta[activeBlank]?.error ? <div className={styles.inlineError}><span>!</span><b>{meta[activeBlank].error}</b></div> : null}
        </div> : <div className={styles.freeEditor}><div className={styles.editorNotice}><span>가이드 없이 전체 코드를 직접 작성합니다.</span><b>Tab: 4칸 · 콜론 뒤 Enter: 자동 들여쓰기</b></div><div className={styles.textareaFrame}><pre aria-hidden="true">{Array.from({ length: Math.max(8, code.split("\n").length) }, (_, index) => `${index + 1}\n`)}</pre><textarea value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event) => freeKey(event, setCode)} autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label="파이썬 코드 작성"/></div></div>}
      </section>
    </div>
    <section className={styles.testStrip}><div><small>VALIDATION POLICY</small><b>검사 기준</b></div>{spec.tests.map((test) => <span key={test}>✓ {test}</span>)}</section>
    <div className={styles.actions}><button className={styles.secondaryAction} onClick={onBack}>배운 개념 다시보기</button><button className={styles.primaryAction} onClick={check}><span>⌘</span>코드 검사하기 <b>→</b></button></div>
  </section>;
}
