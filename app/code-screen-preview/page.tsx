"use client";

import { KeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import styles from "./preview.module.css";

type IconName = "arrow" | "book" | "check" | "code" | "light" | "lock" | "refresh" | "terminal" | "x";
type BlankKind = "number" | "concept" | "self" | "library" | "text";
type BlankWidth = "small" | "medium" | "large" | "xlarge";
type BlankStatus = "idle" | "editing" | "valid" | "invalid";
type EditorMode = "guided" | "free";

type HintTier = { label: string; body: ReactNode };
type ValidationContext = {
  missionId: number;
  answers: AnswersByMission;
};
type BlankSpec = {
  id: string;
  label: string;
  placeholder: string;
  kind: BlankKind;
  width: BlankWidth;
  validate: (value: string, context: ValidationContext) => string | null;
  hintTiers?: HintTier[];
};
type CodePart =
  | { type: "text"; value: string; locked?: boolean }
  | { type: "blank"; blankId: string };
type CodeLineSpec = {
  indent: number;
  parts: CodePart[];
  locked?: boolean;
  note?: string;
};
type PreviewMission = {
  id: number;
  chapter: string;
  shortChapter: string;
  title: string;
  short: string;
  goal: string;
  codeTitle: string;
  codeHint: string;
  fileName: string;
  blanks: BlankSpec[];
  lines: CodeLineSpec[];
  tests: string[];
};
type BlankMeta = {
  status: BlankStatus;
  touched: boolean;
  wrongAttempts: number;
  hintTier: number;
  hintOpen: boolean;
  pulse: boolean;
  error: string | null;
};
type AnswersByMission = Record<string, Record<string, string>>;
type MetaByBlank = Record<string, BlankMeta>;
type CheckResult = { passed: boolean; issues: string[] };

const STORAGE_KEY = "line-core-code-screen-preview-v1";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    code: <><path d="m8 9-4 3 4 3m8-6 4 3-4 3M14 5l-4 14"/></>,
    light: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5C14.5 15.4 14 16.2 14 18h-4c0-1.8-.5-2.6-1.5-3.5Z"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    refresh: <><path d="M20 11a8 8 0 1 0 2 5"/><path d="M20 4v7h-7"/></>,
    terminal: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/></>,
    x: <><path d="M6 6l12 12"/><path d="M18 6 6 18"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function stripInlineComment(value: string) {
  return value.split("#", 1)[0].trim();
}

function normalizeCode(value: string) {
  return stripInlineComment(value).replace(/\s+/g, "");
}

function stripOuterParentheses(value: string) {
  let next = value.trim();
  while (next.startsWith("(") && next.endsWith(")")) {
    let depth = 0;
    let wrapsWholeExpression = true;
    for (let index = 0; index < next.length; index += 1) {
      const character = next[index];
      if (character === "(") depth += 1;
      if (character === ")") depth -= 1;
      if (depth === 0 && index < next.length - 1) {
        wrapsWholeExpression = false;
        break;
      }
    }
    if (!wrapsWholeExpression) break;
    next = next.slice(1, -1).trim();
  }
  return next;
}

function normalizedExpression(value: string) {
  return stripOuterParentheses(stripInlineComment(value)).replace(/\s+/g, "");
}

function exactExpression(expected: string, label: string) {
  return (value: string) => {
    if (!value.trim()) return `${label}을 입력해 주세요.`;
    return normalizedExpression(value) === expected ? null : `${label}의 변수 이름, 연산자와 순서를 다시 확인해 보세요.`;
  };
}

function numberInRange(min: number, max: number, label: string, includeMin = true) {
  return (value: string) => {
    const cleaned = stripInlineComment(value);
    if (!cleaned) return `${label}을 입력해 주세요.`;
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)) return `${label}에는 숫자를 입력해 주세요.`;
    const parsed = Number(cleaned);
    const lowerOk = includeMin ? parsed >= min : parsed > min;
    if (!Number.isFinite(parsed) || !lowerOk || parsed > max) {
      return `${label}은 ${includeMin ? min : `${min}보다 큰 값`}부터 ${max} 사이여야 해요.`;
    }
    return null;
  };
}

function normalizeKorean(value: string) {
  return value.replace(/^\s*#\s*/, "").replace(/[\s·.,!?→\-_/]/g, "").toLowerCase();
}

function semanticStepValidator(kind: "sensor" | "error" | "direction" | "repeat") {
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
    return passed ? null : "표현은 달라도 괜찮지만, 이 단계의 핵심 역할이 드러나야 해요.";
  };
}

function makeMissions(): PreviewMission[] {
  const conceptTargetHints: HintTier[] = [
    { label: "힌트 1/3", body: <>기준값은 검정과 흰색의 <b>중간</b>에 있어야 해요.</> },
    { label: "힌트 2/3", body: <>두 측정값을 먼저 더한 뒤 같은 비율로 나누는 <b>평균식</b>을 떠올려 보세요.</> },
    { label: "힌트 3/3", body: <><code>black_value</code>와 <code>white_value</code>를 더한 뒤 <b>2로 나누는 식</b>이 필요해요.</> },
  ];
  const librarySensorHints: HintTier[] = [
    { label: "후보 함수", body: <>컬러 센서에는 <b>.reflection()</b> · <b>.color()</b> · <b>.ambient()</b> · <b>.hsv()</b>가 있어요. 그중 반사광 세기를 읽는 함수를 사용합니다.</> },
    { label: "정확한 이름", body: <>센서 객체는 <b>color_sensor</b>, 반사광 함수는 <b>.reflection()</b>입니다. 직접 타이핑해 보세요.</> },
  ];
  return [
    {
      id: 0,
      chapter: "프롤로그 · 처리 순서",
      shortChapter: "PROLOGUE",
      title: "사라진 라인 코어",
      short: "라인팔로잉의 처리 순서를 자신의 말로 정리합니다.",
      goal: "센서 확인 → 오차 계산 → 방향 보정 → 반복의 흐름을 연결합니다.",
      codeTitle: "처리 과정을 네 줄의 파이썬 주석으로 기록하세요.",
      codeHint: "문장이 정확히 같지 않아도 핵심 역할과 순서가 맞으면 통과합니다.",
      fileName: "mission_01_route.py",
      blanks: [
        { id: "sensor", label: "센서 확인", placeholder: "현재 상태를 확인하는 과정", kind: "concept", width: "large", validate: semanticStepValidator("sensor"), hintTiers: [{ label: "생각할 점", body: <>로봇이 방향을 정하기 전에 바닥의 현재 상태를 먼저 알아야 해요.</> }] },
        { id: "error", label: "오차 계산", placeholder: "기준과의 차이를 구하는 과정", kind: "concept", width: "large", validate: semanticStepValidator("error"), hintTiers: [{ label: "생각할 점", body: <>현재 센서값과 목표 기준값 사이의 차이를 구하는 단계입니다.</> }] },
        { id: "direction", label: "방향 보정", placeholder: "좌우 움직임을 조절하는 과정", kind: "concept", width: "large", validate: semanticStepValidator("direction"), hintTiers: [{ label: "생각할 점", body: <>계산한 오차를 이용해 좌우 모터의 힘을 다르게 조절합니다.</> }] },
        { id: "repeat", label: "반복", placeholder: "처음부터 다시 수행하는 과정", kind: "concept", width: "large", validate: semanticStepValidator("repeat"), hintTiers: [{ label: "생각할 점", body: <>로봇은 움직이는 동안 같은 판단을 계속 다시 수행해야 해요.</> }] },
      ],
      lines: [
        { indent: 0, parts: [{ type: "text", value: "# ", locked: true }, { type: "blank", blankId: "sensor" }] },
        { indent: 0, parts: [{ type: "text", value: "# ", locked: true }, { type: "blank", blankId: "error" }] },
        { indent: 0, parts: [{ type: "text", value: "# ", locked: true }, { type: "blank", blankId: "direction" }] },
        { indent: 0, parts: [{ type: "text", value: "# ", locked: true }, { type: "blank", blankId: "repeat" }] },
      ],
      tests: ["역할 표현을 유연하게 판정", "처리 순서를 그대로 유지", "띄어쓰기와 조사 차이를 허용"],
    },
    {
      id: 1,
      chapter: "1장 · 기억 모듈",
      shortChapter: "MEMORY",
      title: "필요한 값을 기억하라",
      short: "속도, 반사광, 기준값, Kp와 Kd를 변수에 저장합니다.",
      goal: "각 변수의 역할에 맞는 숫자와 평균식을 직접 입력합니다.",
      codeTitle: "측정값과 제어 변수를 직접 선언하세요.",
      codeHint: "변수 이름과 등호는 주어지고, 오른쪽 값만 직접 판단해 입력합니다.",
      fileName: "mission_02_memory.py",
      blanks: [
        { id: "black_value", label: "검정 반사광", placeholder: "0~100 사이 값", kind: "number", width: "medium", validate: numberInRange(0, 100, "black_value") },
        { id: "white_value", label: "흰색 반사광", placeholder: "검정보다 큰 값", kind: "number", width: "medium", validate: numberInRange(0, 100, "white_value") },
        { id: "base_speed", label: "기본 속도", placeholder: "1~100 사이 값", kind: "number", width: "medium", validate: numberInRange(0, 100, "base_speed", false) },
        { id: "target", label: "센서 기준값", placeholder: "두 반사광의 평균식", kind: "concept", width: "xlarge", validate: exactExpression("(black_value+white_value)/2", "target 식"), hintTiers: conceptTargetHints },
        { id: "kp", label: "P 계수", placeholder: "0보다 크고 3 이하", kind: "number", width: "medium", validate: numberInRange(0, 3, "kp", false) },
        { id: "kd", label: "D 계수", placeholder: "0~2 사이 값", kind: "number", width: "medium", validate: numberInRange(0, 2, "kd") },
      ],
      lines: [
        { indent: 0, parts: [{ type: "text", value: "black_value = ", locked: true }, { type: "blank", blankId: "black_value" }] },
        { indent: 0, parts: [{ type: "text", value: "white_value = ", locked: true }, { type: "blank", blankId: "white_value" }] },
        { indent: 0, parts: [{ type: "text", value: "base_speed = ", locked: true }, { type: "blank", blankId: "base_speed" }] },
        { indent: 0, parts: [{ type: "text", value: "target = ", locked: true }, { type: "blank", blankId: "target" }] },
        { indent: 0, parts: [{ type: "text", value: "kp = ", locked: true }, { type: "blank", blankId: "kp" }] },
        { indent: 0, parts: [{ type: "text", value: "kd = ", locked: true }, { type: "blank", blankId: "kd" }] },
      ],
      tests: ["검정값 < 흰색값", "target은 두 값의 평균식", "Kp·Kd 허용 범위 확인"],
    },
    {
      id: 2,
      chapter: "2장 · 명령 모듈",
      shortChapter: "COMMAND",
      title: "하나의 명령으로 묶어라",
      short: "line_follow 함수와 반복 구조를 완성합니다.",
      goal: "이전 단계의 네 변수, 반복 조건, 센서 읽기 명령을 함수 구조에 연결합니다.",
      codeTitle: "line_follow 함수의 틀을 완성하세요.",
      codeHint: "문법 뼈대는 잠겨 있고, 개념적으로 중요한 세 위치만 직접 타이핑합니다.",
      fileName: "mission_03_command.py",
      blanks: [
        {
          id: "params", label: "매개변수 네 개", placeholder: "이전 장의 변수 이름을 순서대로", kind: "self", width: "xlarge",
          validate: (value) => normalizeCode(value) === "base_speed,target,kp,kd" ? null : "1장에서 사용한 네 변수 이름과 순서를 확인해 보세요.",
        },
        { id: "loop", label: "반복 조건", placeholder: "항상 참인 값", kind: "concept", width: "medium", validate: (value) => stripInlineComment(value) === "True" ? null : "파이썬의 참 값은 대문자 T로 시작하는 True입니다.", hintTiers: [{ label: "반복 조건", body: <>조건이 계속 참이어야 하므로 파이썬의 불리언 값 <b>True</b>를 사용합니다.</> }] },
        { id: "sensor", label: "센서 읽기", placeholder: "반사광을 읽는 명령", kind: "library", width: "xlarge", validate: (value) => normalizeCode(value) === "color_sensor.reflection()" ? null : "센서 객체와 반사광 함수의 정확한 이름을 확인해 보세요.", hintTiers: librarySensorHints },
      ],
      lines: [
        { indent: 0, parts: [{ type: "text", value: "def line_follow(", locked: true }, { type: "blank", blankId: "params" }, { type: "text", value: "):", locked: true }] },
        { indent: 1, locked: true, note: "주어짐", parts: [{ type: "text", value: "previous_error = 0", locked: true }] },
        { indent: 0, parts: [{ type: "text", value: "", locked: true }] },
        { indent: 1, parts: [{ type: "text", value: "while ", locked: true }, { type: "blank", blankId: "loop" }, { type: "text", value: ":", locked: true }] },
        { indent: 2, parts: [{ type: "text", value: "sensor_value = ", locked: true }, { type: "blank", blankId: "sensor" }] },
      ],
      tests: ["매개변수 순서 고정", "0과 0.0을 같은 초기값으로 인정", "인라인 주석을 채점에서 제외"],
    },
    {
      id: 3,
      chapter: "3장 · 판단 모듈",
      shortChapter: "P CONTROL",
      title: "현재 오차에 반응하라",
      short: "현재 오차와 P 제어값을 계산합니다.",
      goal: "뺄셈과 곱셈의 변수 순서를 지켜 두 개의 식을 완성합니다.",
      codeTitle: "오차와 P 제어 코드를 작성하세요.",
      codeHint: "왼쪽 변수는 주어지고, 오른쪽 계산식의 순서를 직접 입력합니다.",
      fileName: "mission_04_p_control.py",
      blanks: [
        { id: "error", label: "오차 계산", placeholder: "기준값 - 현재값", kind: "concept", width: "large", validate: exactExpression("target-sensor_value", "error 식"), hintTiers: [{ label: "힌트 1/2", body: <>오차는 목표 기준값에서 현재 센서값을 뺀 값입니다.</> }, { label: "힌트 2/2", body: <><code>target</code>에서 <code>sensor_value</code>를 빼는 순서를 사용합니다.</> }] },
        { id: "p_control", label: "P 제어", placeholder: "P 계수 × 현재 오차", kind: "concept", width: "large", validate: exactExpression("kp*error", "p_control 식"), hintTiers: [{ label: "힌트 1/2", body: <>P는 현재 오차에 비례하는 반응입니다.</> }, { label: "힌트 2/2", body: <><code>kp</code>와 <code>error</code>를 곱합니다.</> }] },
      ],
      lines: [
        { indent: 2, parts: [{ type: "text", value: "error = ", locked: true }, { type: "blank", blankId: "error" }] },
        { indent: 2, parts: [{ type: "text", value: "p_control = ", locked: true }, { type: "blank", blankId: "p_control" }] },
      ],
      tests: ["target - sensor_value 순서", "kp * error 순서", "공백·괄호·인라인 주석 정규화"],
    },
    {
      id: 4,
      chapter: "4장 · 균형 모듈",
      shortChapter: "D CONTROL",
      title: "오차의 변화를 읽어라",
      short: "이전 오차와 비교해 D 제어값을 만듭니다.",
      goal: "현재값과 이전값의 차이를 구하고 Kd를 적용합니다.",
      codeTitle: "변화량과 D 제어 코드를 작성하세요.",
      codeHint: "현재 오차를 먼저 쓰고 이전 오차를 뒤에 쓰는 순서를 유지합니다.",
      fileName: "mission_05_d_control.py",
      blanks: [
        { id: "change", label: "변화량", placeholder: "현재 오차 - 이전 오차", kind: "concept", width: "large", validate: exactExpression("error-previous_error", "change 식"), hintTiers: [{ label: "힌트 1/2", body: <>변화량은 지금 오차와 직전 오차의 차이입니다.</> }, { label: "힌트 2/2", body: <><code>error</code>에서 <code>previous_error</code>를 뺍니다.</> }] },
        { id: "d_control", label: "D 제어", placeholder: "D 계수 × 변화량", kind: "concept", width: "large", validate: exactExpression("kd*change", "d_control 식"), hintTiers: [{ label: "힌트 1/2", body: <>D는 오차 변화량에 반응합니다.</> }, { label: "힌트 2/2", body: <><code>kd</code>와 <code>change</code>를 곱합니다.</> }] },
      ],
      lines: [
        { indent: 2, parts: [{ type: "text", value: "change = ", locked: true }, { type: "blank", blankId: "change" }] },
        { indent: 2, parts: [{ type: "text", value: "d_control = ", locked: true }, { type: "blank", blankId: "d_control" }] },
      ],
      tests: ["error - previous_error 순서", "kd * change 순서", "의미가 다른 교환식은 통과하지 않음"],
    },
    {
      id: 5,
      chapter: "최종장 · 중앙 코어",
      shortChapter: "MOTOR LINK",
      title: "라인팔로잉을 완성하라",
      short: "P와 D를 합쳐 좌우 모터 출력으로 연결합니다.",
      goal: "PD 결합, 좌우 반대 부호, 이전 오차 저장을 한 흐름으로 완성합니다.",
      codeTitle: "line_follow 함수의 마지막 부분을 완성하세요.",
      codeHint: "마지막 장에서는 식 전체를 직접 입력하고 모터 호출은 읽기 전용으로 제공합니다.",
      fileName: "mission_06_motor_link.py",
      blanks: [
        { id: "correction", label: "PD 결합", placeholder: "P 반응 + D 반응", kind: "concept", width: "large", validate: exactExpression("p_control+d_control", "correction 식"), hintTiers: [{ label: "힌트", body: <>P와 D의 두 반응을 더해 하나의 보정값으로 만듭니다.</> }] },
        { id: "left_power", label: "왼쪽 출력", placeholder: "기본 속도 + 보정값", kind: "concept", width: "large", validate: exactExpression("base_speed+correction", "left_power 식"), hintTiers: [{ label: "힌트", body: <>왼쪽 출력에는 보정값을 더합니다.</> }] },
        { id: "right_power", label: "오른쪽 출력", placeholder: "기본 속도 - 보정값", kind: "concept", width: "large", validate: exactExpression("base_speed-correction", "right_power 식"), hintTiers: [{ label: "힌트", body: <>오른쪽 출력에는 같은 보정값을 뺍니다.</> }] },
        { id: "previous_error", label: "이전 오차 저장", placeholder: "이번 반복의 현재 오차", kind: "concept", width: "medium", validate: exactExpression("error", "previous_error 식"), hintTiers: [{ label: "힌트", body: <>이번 반복의 <code>error</code>가 다음 반복에서는 이전 오차가 됩니다.</> }] },
      ],
      lines: [
        { indent: 2, parts: [{ type: "text", value: "correction = ", locked: true }, { type: "blank", blankId: "correction" }] },
        { indent: 2, parts: [{ type: "text", value: "left_power = ", locked: true }, { type: "blank", blankId: "left_power" }] },
        { indent: 2, parts: [{ type: "text", value: "right_power = ", locked: true }, { type: "blank", blankId: "right_power" }] },
        { indent: 0, parts: [{ type: "text", value: "", locked: true }] },
        { indent: 2, locked: true, note: "주어짐", parts: [{ type: "text", value: "left_motor.dc(left_power)", locked: true }] },
        { indent: 2, locked: true, note: "주어짐", parts: [{ type: "text", value: "right_motor.dc(right_power)", locked: true }] },
        { indent: 0, parts: [{ type: "text", value: "", locked: true }] },
        { indent: 2, parts: [{ type: "text", value: "previous_error = ", locked: true }, { type: "blank", blankId: "previous_error" }] },
      ],
      tests: ["P + D 결합", "좌우 출력에 반대 부호", "모터 호출 및 이전 오차 저장"],
    },
  ];
}

const missions = makeMissions();

function blankKey(missionId: number, blankId: string) {
  return `${missionId}:${blankId}`;
}

function initialMeta(): MetaByBlank {
  const result: MetaByBlank = {};
  missions.forEach((mission) => mission.blanks.forEach((blank) => {
    result[blankKey(mission.id, blank.id)] = { status: "idle", touched: false, wrongAttempts: 0, hintTier: 0, hintOpen: false, pulse: false, error: null };
  }));
  return result;
}

function initialAnswers(): AnswersByMission {
  return Object.fromEntries(missions.map((mission) => [String(mission.id), Object.fromEntries(mission.blanks.map((blank) => [blank.id, ""]))]));
}

function buildGuidedCode(mission: PreviewMission, answers: Record<string, string>) {
  return mission.lines.map((line) => {
    const body = line.parts.map((part) => part.type === "text" ? part.value : (answers[part.blankId] ?? "")).join("");
    return `${"    ".repeat(line.indent)}${body}`;
  }).join("\n");
}

function assignmentExpression(code: string, name: string) {
  return code.match(new RegExp(`^\\s*${name}\\s*=\\s*([^#\\n]+)`, "m"))?.[1]?.trim() ?? null;
}

function validateFreeMission(mission: PreviewMission, code: string): CheckResult {
  const executableLines = code.split("\n").map((line) => line.replace(/#.*$/, "")).filter((line) => line.trim().length > 0);
  const executable = executableLines.join("\n");
  const issues: string[] = [];
  if (mission.id === 0) {
    const comments = code.split("\n").map((line) => line.match(/^\s*#\s*(.+?)\s*$/)?.[1] ?? "").filter(Boolean);
    const validators = [semanticStepValidator("sensor"), semanticStepValidator("error"), semanticStepValidator("direction"), semanticStepValidator("repeat")];
    validators.forEach((validator, index) => {
      const error = validator(comments[index] ?? "");
      if (error) issues.push(`${index + 1}번째 처리 역할: ${error}`);
    });
    return { passed: issues.length === 0, issues };
  }
  if (mission.id === 1) {
    const names = ["black_value", "white_value", "base_speed", "target", "kp", "kd"];
    const values = Object.fromEntries(names.map((name) => [name, assignmentExpression(executable, name) ?? ""]));
    mission.blanks.forEach((blank) => {
      const error = blank.validate(values[blank.id], { missionId: mission.id, answers: { [String(mission.id)]: values } });
      if (error) issues.push(`${blank.label}: ${error}`);
    });
    const black = Number(values.black_value);
    const white = Number(values.white_value);
    if (Number.isFinite(black) && Number.isFinite(white) && black >= white) issues.push("반사광 측정: 검정값은 흰색값보다 작아야 해요.");
    return { passed: issues.length === 0, issues };
  }
  if (mission.id === 2) {
    const lines = executableLines;
    const defIndex = lines.findIndex((line) => /^\s*def\s+line_follow\s*\(\s*base_speed\s*,\s*target\s*,\s*kp\s*,\s*kd\s*\)\s*:\s*$/.test(line));
    const previousIndex = lines.findIndex((line) => /^\s+previous_error\s*=\s*(?:0+(?:\.0*)?|\.0+)\s*$/.test(line));
    const whileIndex = lines.findIndex((line) => /^\s+while\s+True\s*:\s*$/.test(line));
    const sensorIndex = lines.findIndex((line) => /^\s+sensor_value\s*=\s*color_sensor\.reflection\(\)\s*$/.test(line));
    const indent = (index: number) => index < 0 ? 0 : (lines[index].match(/^\s*/)?.[0].replace(/\t/g, "    ").length ?? 0);
    if (defIndex < 0) issues.push("함수 선언: 매개변수 이름과 순서를 확인해 보세요.");
    if (!(previousIndex > defIndex && previousIndex < whileIndex && indent(previousIndex) > indent(defIndex))) issues.push("이전 오차 초기화: 0 또는 0.0으로 함수 안에서 준비해 주세요.");
    if (!(whileIndex > previousIndex && indent(whileIndex) > indent(defIndex))) issues.push("반복 구조: while True:와 함수 안쪽 들여쓰기를 확인해 주세요.");
    if (!(sensorIndex > whileIndex && indent(sensorIndex) > indent(whileIndex))) issues.push("센서 읽기: reflection() 결과를 반복문 안의 sensor_value에 저장해 주세요.");
    return { passed: issues.length === 0, issues };
  }
  const expectedByMission: Record<number, Record<string, string>> = {
    3: { error: "target-sensor_value", p_control: "kp*error" },
    4: { change: "error-previous_error", d_control: "kd*change" },
    5: { correction: "p_control+d_control", left_power: "base_speed+correction", right_power: "base_speed-correction", previous_error: "error" },
  };
  Object.entries(expectedByMission[mission.id]).forEach(([name, expected]) => {
    const expression = assignmentExpression(executable, name);
    if (!expression || normalizedExpression(expression) !== expected) issues.push(`${name}: 변수 이름, 연산자와 순서를 확인해 주세요.`);
  });
  if (mission.id === 5) {
    const compact = executable.replace(/\s+/g, "");
    if (!compact.includes("left_motor.dc(left_power)")) issues.push("왼쪽 모터: left_power를 dc()에 전달해 주세요.");
    if (!compact.includes("right_motor.dc(right_power)")) issues.push("오른쪽 모터: right_power를 dc()에 전달해 주세요.");
  }
  return { passed: issues.length === 0, issues };
}

function handleFreeEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>, onChange: (value: string) => void) {
  const target = event.currentTarget;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  const value = target.value;
  if (event.key === "Tab") {
    event.preventDefault();
    if (start !== end) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const selected = value.slice(lineStart, end);
      const lines = selected.split("\n");
      const transformed = event.shiftKey
        ? lines.map((line) => line.startsWith("    ") ? line.slice(4) : line.startsWith("\t") ? line.slice(1) : line).join("\n")
        : lines.map((line) => `    ${line}`).join("\n");
      const next = `${value.slice(0, lineStart)}${transformed}${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        target.selectionStart = lineStart;
        target.selectionEnd = lineStart + transformed.length;
      });
      return;
    }
    if (event.shiftKey) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const beforeCursor = value.slice(lineStart, start);
      const removable = beforeCursor.match(/(?: {1,4}|\t)$/)?.[0] ?? "";
      const next = `${value.slice(0, start - removable.length)}${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => target.setSelectionRange(start - removable.length, start - removable.length));
      return;
    }
    const next = `${value.slice(0, start)}    ${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => target.setSelectionRange(start + 4, start + 4));
    return;
  }
  if (event.key === "Enter") {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const currentLine = value.slice(lineStart, start);
    const currentIndent = currentLine.match(/^\s*/)?.[0].replace(/\t/g, "    ") ?? "";
    const nextIndent = currentLine.trimEnd().endsWith(":") ? `${currentIndent}    ` : currentIndent;
    event.preventDefault();
    const insertion = `\n${nextIndent}`;
    const next = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => target.setSelectionRange(start + insertion.length, start + insertion.length));
  }
}

export default function CodeScreenPreview() {
  const [activeMissionId, setActiveMissionId] = useState(1);
  const [mode, setMode] = useState<EditorMode>("guided");
  const [answers, setAnswers] = useState<AnswersByMission>(() => initialAnswers());
  const [meta, setMeta] = useState<MetaByBlank>(() => initialMeta());
  const [freeCodes, setFreeCodes] = useState<Record<string, string>>({});
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const mission = missions[activeMissionId];
  const missionAnswers = answers[String(activeMissionId)] ?? {};
  const currentBlank = mission.blanks.find((blank) => blank.id === activeBlankId) ?? null;
  const currentMeta = currentBlank ? meta[blankKey(activeMissionId, currentBlank.id)] : null;
  const generatedCode = useMemo<string>(() => buildGuidedCode(mission, missionAnswers), [mission, missionAnswers]);
  const completedCount = mission.blanks.filter((blank) => meta[blankKey(activeMissionId, blank.id)]?.status === "valid").length;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { answers?: AnswersByMission; freeCodes?: Record<string, string> };
        if (parsed.answers) setAnswers((current) => ({ ...current, ...parsed.answers }));
        if (parsed.freeCodes) setFreeCodes(parsed.freeCodes);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, freeCodes }));
  }, [answers, freeCodes, loaded]);

  useEffect(() => {
    setResult(null);
    setActiveBlankId(null);
  }, [activeMissionId, mode]);

  function getBlankMeta(blankId: string) {
    return meta[blankKey(activeMissionId, blankId)] ?? { status: "idle", touched: false, wrongAttempts: 0, hintTier: 0, hintOpen: false, pulse: false, error: null };
  }

  function setBlankMeta(blankId: string, updater: (current: BlankMeta) => BlankMeta) {
    const key = blankKey(activeMissionId, blankId);
    setMeta((current) => ({ ...current, [key]: updater(current[key] ?? getBlankMeta(blankId)) }));
  }

  function updateAnswer(blankId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [String(activeMissionId)]: { ...(current[String(activeMissionId)] ?? {}), [blankId]: value },
    }));
    setBlankMeta(blankId, (current) => ({ ...current, status: value.trim() ? "editing" : "idle", touched: true, error: null }));
    setResult(null);
  }

  function validateBlank(blank: BlankSpec, value = missionAnswers[blank.id] ?? "", reportWrong = false) {
    const error = blank.validate(value, { missionId: activeMissionId, answers });
    setBlankMeta(blank.id, (current) => {
      const wrongAttempts = error && reportWrong ? current.wrongAttempts + 1 : current.wrongAttempts;
      return {
        ...current,
        touched: true,
        status: error ? "invalid" : "valid",
        error,
        wrongAttempts,
        pulse: Boolean(error && wrongAttempts === 1 && blank.hintTiers?.length),
        hintOpen: Boolean(error && wrongAttempts >= 2 && blank.hintTiers?.length) || current.hintOpen,
        hintTier: error && wrongAttempts >= 2 && blank.hintTiers?.length && current.hintTier === 0 ? 1 : current.hintTier,
      };
    });
    return error;
  }

  function crossValidateGuided() {
    const issues: string[] = [];
    if (activeMissionId === 1) {
      const black = Number(stripInlineComment(missionAnswers.black_value ?? ""));
      const white = Number(stripInlineComment(missionAnswers.white_value ?? ""));
      if (Number.isFinite(black) && Number.isFinite(white) && black >= white) {
        issues.push("반사광 측정: 검정값은 흰색값보다 작아야 해요.");
        setBlankMeta("white_value", (current) => ({ ...current, status: "invalid", error: "흰색 반사광은 검정 반사광보다 큰 값이어야 해요." }));
      }
    }
    return issues;
  }

  function runCheck() {
    if (mode === "free") {
      const checked = validateFreeMission(mission, freeCodes[String(activeMissionId)] ?? "");
      setResult(checked);
      return;
    }
    const issues = mission.blanks.flatMap((blank) => {
      const error = validateBlank(blank, missionAnswers[blank.id] ?? "", true);
      return error ? [`${blank.label}: ${error}`] : [];
    });
    issues.push(...crossValidateGuided());
    setResult({ passed: issues.length === 0, issues });
  }

  function focusBlank(blankId: string) {
    setActiveBlankId(blankId);
    requestAnimationFrame(() => {
      const input = inputRefs.current[blankKey(activeMissionId, blankId)];
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }

  function moveBlank(blankId: string, direction: 1 | -1) {
    const index = mission.blanks.findIndex((blank) => blank.id === blankId);
    const next = mission.blanks[index + direction];
    if (next) focusBlank(next.id);
  }

  function toggleHint(blank: BlankSpec) {
    if (!blank.hintTiers?.length && blank.kind !== "self") return;
    setActiveBlankId(blank.id);
    setBlankMeta(blank.id, (current) => ({ ...current, hintOpen: !current.hintOpen, hintTier: current.hintTier || 1, pulse: false }));
  }

  function nextHint(blank: BlankSpec, tiers: HintTier[]) {
    setBlankMeta(blank.id, (current) => {
      if (current.hintTier >= tiers.length) return { ...current, hintOpen: false, hintTier: 0 };
      return { ...current, hintTier: current.hintTier + 1, hintOpen: true };
    });
  }

  function hintTiersFor(blank: BlankSpec): HintTier[] {
    if (blank.kind !== "self") return blank.hintTiers ?? [];
    const previous = answers["1"] ?? {};
    const code = ["black_value", "white_value", "base_speed", "target", "kp", "kd"]
      .map((name) => `${name} = ${previous[name]?.trim() || "?"}`)
      .join("\n");
    const ready = ["base_speed", "target", "kp", "kd"].every((name) => previous[name]?.trim());
    return [{
      label: "참고 · 1장에서 내가 쓴 코드",
      body: <><pre>{code}</pre><p>{ready ? "이 중 line_follow에 전달해야 하는 네 값의 이름만 순서대로 괄호 안에 넣어 보세요." : "아직 비어 있는 값이 있어요. 1장을 먼저 완성한 뒤 다시 참고해 주세요."}</p></>,
    }];
  }

  function resetMission() {
    setAnswers((current) => ({ ...current, [String(activeMissionId)]: Object.fromEntries(mission.blanks.map((blank) => [blank.id, ""])) }));
    setFreeCodes((current) => ({ ...current, [String(activeMissionId)]: "" }));
    setMeta((current) => {
      const next = { ...current };
      mission.blanks.forEach((blank) => { next[blankKey(activeMissionId, blank.id)] = { status: "idle", touched: false, wrongAttempts: 0, hintTier: 0, hintOpen: false, pulse: false, error: null }; });
      return next;
    });
    setResult(null);
    setActiveBlankId(null);
  }

  function changeMode(next: EditorMode) {
    if (next === mode) return;
    if (next === "free" && !(freeCodes[String(activeMissionId)] ?? "").trim()) {
      const hasGuidedWork = Object.values(missionAnswers).some((value) => value.trim());
      setFreeCodes((current) => ({ ...current, [String(activeMissionId)]: hasGuidedWork ? generatedCode : "" }));
    }
    setMode(next);
  }

  const activeHintTiers = currentBlank ? hintTiersFor(currentBlank) : [];
  const activeHint = currentBlank && currentMeta?.hintOpen && currentMeta.hintTier > 0 ? activeHintTiers[currentMeta.hintTier - 1] : null;

  return <main className={styles.page}>
    <div className={styles.backgroundGrid} aria-hidden="true"/>
    <header className={styles.hud}>
      <a className={styles.brand} href="/" aria-label="라인 코어 아카데미 홈">
        <img src="/assets/playwell-logo.png" alt="PLAYWELL"/>
        <span><small>USER TEST PREVIEW</small><b>CODE SCREEN REDESIGN</b></span>
      </a>
      <div className={styles.hudMission}><small>{mission.shortChapter}</small><b>{mission.chapter}</b><span>{activeMissionId + 1} / {missions.length}</span></div>
      <div className={styles.previewBadge}><Icon name="terminal" size={15}/><span>PREVIEW BRANCH</span></div>
    </header>

    <section className={styles.shell}>
      <nav className={styles.missionRail} aria-label="코드 작성 미션 선택">
        {missions.map((item) => <button key={item.id} className={`${styles.missionTab} ${item.id === activeMissionId ? styles.missionTabActive : ""}`} onClick={() => setActiveMissionId(item.id)}>
          <span>{String(item.id + 1).padStart(2, "0")}</span><div><small>{item.shortChapter}</small><b>{item.title}</b></div>
        </button>)}
      </nav>

      <section className={styles.stage}>
        <div className={styles.activityHead}>
          <span className={styles.activityIcon}><Icon name="code" size={23}/></span>
          <div><p>STEP 3 · 코드 작성</p><h1>{mission.codeTitle}</h1><span>{mission.codeHint}</span></div>
          <button className={styles.resetButton} onClick={resetMission}><Icon name="refresh" size={15}/>이 미션 초기화</button>
        </div>

        <div className={styles.learningReason}><span><Icon name="book" size={18}/></span><div><small>MISSION GOAL</small><b>{mission.goal}</b></div></div>

        <div className={styles.codeWorkspace}>
          <aside className={styles.checklist}>
            <header><small>WRITING ROUTE</small><b>작성 순서</b><span>{completedCount} / {mission.blanks.length}</span></header>
            <div className={styles.checklistProgress}><i style={{ width: `${mission.blanks.length ? (completedCount / mission.blanks.length) * 100 : 0}%` }}/></div>
            <div className={styles.checkItems}>
              {mission.blanks.map((blank, index) => {
                const itemMeta = getBlankMeta(blank.id);
                return <button key={blank.id} className={`${styles.checkItem} ${styles[`status_${itemMeta.status}`]} ${activeBlankId === blank.id ? styles.checkItemActive : ""}`} onClick={() => focusBlank(blank.id)}>
                  <span>{itemMeta.status === "valid" ? <Icon name="check" size={14}/> : String(index + 1).padStart(2, "0")}</span>
                  <div><small>{blank.kind === "number" ? "판단형" : blank.kind === "concept" ? "개념형" : blank.kind === "self" ? "자기참조" : blank.kind === "library" ? "라이브러리" : "입력"}</small><b>{blank.label}</b></div>
                  <em>{itemMeta.status === "valid" ? "완료" : itemMeta.status === "invalid" ? "확인" : itemMeta.status === "editing" ? "입력중" : "대기"}</em>
                </button>;
              })}
            </div>
            <div className={styles.legend}><span><i className={styles.legendDone}/>완료</span><span><i className={styles.legendWriting}/>입력중</span><span><i className={styles.legendWaiting}/>대기</span><span><Icon name="lock" size={11}/>주어짐</span></div>
          </aside>

          <section className={styles.editorPanel}>
            <div className={styles.editorTop}>
              <span/><span/><span/><b>{mission.fileName}</b>
              <div className={styles.modeTabs}><button className={mode === "guided" ? styles.modeActive : ""} onClick={() => changeMode("guided")}><Icon name="book" size={13}/>빈칸 가이드</button><button className={mode === "free" ? styles.modeActive : ""} onClick={() => changeMode("free")}><Icon name="code" size={13}/>자유 작성</button></div>
            </div>

            {mode === "guided" ? <div className={styles.guidedEditor}>
              <div className={styles.editorNotice}><span><Icon name="light" size={14}/>코드 흐름 안의 빈칸만 직접 타이핑하세요.</span><b>Tab · Shift+Tab으로 빈칸 이동</b></div>
              <div className={styles.codeLines}>
                {mission.lines.map((line, lineIndex) => <div key={`${lineIndex}-${line.indent}`} className={`${styles.codeLine} ${line.locked ? styles.lockedLine : ""}`}>
                  <span className={styles.lineNumber}>{lineIndex + 1}</span>
                  <div className={styles.lineBody} style={{ paddingLeft: `${16 + line.indent * 28}px` }}>
                    {line.parts.map((part, partIndex) => {
                      if (part.type === "text") return <span key={partIndex} className={part.locked && part.value.trim() ? styles.lockedText : ""}>{part.value}{part.locked && part.value.trim() && line.locked ? <Icon name="lock" size={10}/> : null}</span>;
                      const blank = mission.blanks.find((item) => item.id === part.blankId)!;
                      const itemMeta = getBlankMeta(blank.id);
                      const hasHint = blank.kind === "self" || Boolean(blank.hintTiers?.length);
                      return <span key={partIndex} className={styles.blankWrap}>
                        <input
                          ref={(node: HTMLInputElement | null) => { inputRefs.current[blankKey(activeMissionId, blank.id)] = node; }}
                          className={`${styles.blankInput} ${styles[`width_${blank.width}`]} ${styles[`input_${itemMeta.status}`]}`}
                          value={missionAnswers[blank.id] ?? ""}
                          placeholder={blank.placeholder}
                          aria-label={blank.label}
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          onFocus={() => { setActiveBlankId(blank.id); setBlankMeta(blank.id, (current) => ({ ...current, status: (missionAnswers[blank.id] ?? "").trim() ? "editing" : current.status })); }}
                          onChange={(event: { target: { value: string } }) => updateAnswer(blank.id, event.target.value)}
                          onBlur={() => { if ((missionAnswers[blank.id] ?? "").trim()) validateBlank(blank); }}
                          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                            if (event.key === "Tab") { event.preventDefault(); moveBlank(blank.id, event.shiftKey ? -1 : 1); }
                            if (event.key === "Enter") { event.preventDefault(); validateBlank(blank); moveBlank(blank.id, 1); }
                          }}
                        />
                        {hasHint ? <button className={`${styles.hintButton} ${itemMeta.pulse ? styles.hintPulse : ""} ${itemMeta.hintOpen ? styles.hintButtonOpen : ""}`} onMouseDown={(event: { preventDefault(): void }) => event.preventDefault()} onClick={() => toggleHint(blank)} aria-label={`${blank.label} 힌트`}>?</button> : null}
                      </span>;
                    })}
                    {line.note ? <em className={styles.givenBadge}><Icon name="lock" size={10}/>{line.note}</em> : null}
                  </div>
                </div>)}
              </div>

              {activeHint && currentBlank ? <section className={styles.hintPanel} aria-live="polite">
                <span><Icon name="light" size={18}/></span><div><small>{activeHint.label}</small><div>{activeHint.body}</div><button onClick={() => nextHint(currentBlank, activeHintTiers)}>{currentMeta && currentMeta.hintTier >= activeHintTiers.length ? "힌트 닫기" : `다음 힌트 보기 (${(currentMeta?.hintTier ?? 0) + 1}/${activeHintTiers.length})`} <Icon name="arrow" size={14}/></button></div>
              </section> : null}

              {currentBlank && currentMeta?.error ? <div className={styles.inlineError}><Icon name="x" size={14}/><span><b>{currentBlank.label}</b>{currentMeta.error}</span></div> : null}
            </div> : <div className={styles.freeEditor}>
              <div className={styles.editorNotice}><span><Icon name="terminal" size={14}/>가이드 없이 전체 코드를 직접 작성합니다.</span><b>Tab: 4칸 · 콜론 뒤 Enter: 자동 들여쓰기</b></div>
              <div className={styles.textareaFrame}>
                <pre aria-hidden="true">{Array.from({ length: Math.max(10, (freeCodes[String(activeMissionId)] ?? "").split("\n").length) }, (_, index) => `${index + 1}\n`)}</pre>
                <textarea
                  value={freeCodes[String(activeMissionId)] ?? ""}
                  onChange={(event: { target: { value: string } }) => { setFreeCodes((current) => ({ ...current, [String(activeMissionId)]: event.target.value })); setResult(null); }}
                  onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => handleFreeEditorKeyDown(event, (value) => {
                    setFreeCodes((current) => ({ ...current, [String(activeMissionId)]: value }));
                  })}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="파이썬 자유 코드 작성"
                />
              </div>
            </div>}
          </section>
        </div>

        <section className={styles.testStrip}>
          <div><small>VALIDATION POLICY</small><b>이번 화면에서 확인하는 기준</b></div>
          {mission.tests.map((test) => <span key={test}><Icon name="check" size={13}/>{test}</span>)}
        </section>

        {result ? <section className={`${styles.resultPanel} ${result.passed ? styles.resultSuccess : styles.resultError}`} aria-live="polite">
          <span>{result.passed ? <Icon name="check" size={22}/> : <Icon name="terminal" size={22}/>}</span>
          <div><small>{result.passed ? "ALL TESTS PASSED" : "REPAIR REPORT"}</small><h2>{result.passed ? "작성한 코드가 검사를 통과했습니다" : "고칠 위치를 확인해 주세요"}</h2>{result.passed ? <p>공백, 인라인 주석, 0과 0.0처럼 채점 대상이 아닌 차이는 정규화하고 핵심 구조와 순서는 그대로 확인했습니다.</p> : <ul>{result.issues.slice(0, 5).map((issue) => <li key={issue}>{issue}</li>)}</ul>}</div>
        </section> : null}

        <div className={styles.actions}>
          <button className={styles.secondaryAction} onClick={resetMission}><Icon name="refresh" size={16}/>현재 미션 다시 작성</button>
          <button className={styles.primaryAction} onClick={runCheck}><span><Icon name="terminal" size={17}/></span>코드 검사하기 <Icon name="arrow" size={18}/></button>
        </div>
      </section>
    </section>
  </main>;
}
