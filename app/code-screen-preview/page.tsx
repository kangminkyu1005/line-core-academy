"use client";

import { KeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./preview.module.css";

type IconName = "arrow" | "book" | "check" | "code" | "light" | "lock" | "refresh" | "terminal" | "volume" | "x";
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
export type CodeMissionExperienceProps = {
  embedded?: boolean;
  missionId?: number;
  savedCodes?: string[];
  onReview?: () => void;
  onSubmit?: (code: string) => void;
  onReset?: () => void;
};

const STORAGE_KEY = "line-core-code-screen-preview-v1";
const PARAMETER_NAMES = ["base_speed", "target", "kp", "kd"] as const;
const GLOBAL_SETTING_NAMES: Record<string, string> = {
  black_value: "BLACK_VALUE",
  white_value: "WHITE_VALUE",
  base_speed: "BASE_SPEED",
  target: "TARGET",
  kp: "KP",
  kd: "KD",
};

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
    volume: <><path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8.5 8.5 0 0 1 0 12"/></>,
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
    { label: "힌트 3/3 · 설정값 이름 확인", body: <>직접 입력할 식은 <code>(BLACK_VALUE + WHITE_VALUE) / 2</code>입니다.</> },
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
        { id: "black_value", label: "검정 반사광", placeholder: "0~100 사이 값", kind: "number", width: "medium", validate: numberInRange(0, 100, "BLACK_VALUE") },
        { id: "white_value", label: "흰색 반사광", placeholder: "검정보다 큰 값", kind: "number", width: "medium", validate: numberInRange(0, 100, "WHITE_VALUE") },
        { id: "base_speed", label: "기본 속도", placeholder: "1~100 사이 값", kind: "number", width: "medium", validate: numberInRange(0, 100, "BASE_SPEED", false) },
        { id: "target", label: "센서 기준값", placeholder: "두 반사광의 평균식", kind: "concept", width: "xlarge", validate: exactExpression("(BLACK_VALUE+WHITE_VALUE)/2", "TARGET 식"), hintTiers: conceptTargetHints },
        { id: "kp", label: "P 계수", placeholder: "0보다 크고 3 이하", kind: "number", width: "medium", validate: numberInRange(0, 3, "KP", false) },
        { id: "kd", label: "D 계수", placeholder: "0~2 사이 값", kind: "number", width: "medium", validate: numberInRange(0, 2, "KD") },
      ],
      lines: [
        { indent: 0, parts: [{ type: "text", value: "BLACK_VALUE = ", locked: true }, { type: "blank", blankId: "black_value" }] },
        { indent: 0, parts: [{ type: "text", value: "WHITE_VALUE = ", locked: true }, { type: "blank", blankId: "white_value" }] },
        { indent: 0, parts: [{ type: "text", value: "BASE_SPEED = ", locked: true }, { type: "blank", blankId: "base_speed" }] },
        { indent: 0, parts: [{ type: "text", value: "TARGET = ", locked: true }, { type: "blank", blankId: "target" }] },
        { indent: 0, parts: [{ type: "text", value: "KP = ", locked: true }, { type: "blank", blankId: "kp" }] },
        { indent: 0, parts: [{ type: "text", value: "KD = ", locked: true }, { type: "blank", blankId: "kd" }] },
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
          validate: (value) => {
            const values = value.split(",").map((item) => normalizeCode(item));
            const missingIndex = PARAMETER_NAMES.findIndex((_, index) => !values[index]);
            if (missingIndex >= 0) return `${missingIndex + 1}번째 매개변수를 입력해 주세요.`;
            const wrongIndex = PARAMETER_NAMES.findIndex((expected, index) => values[index] !== expected);
            return wrongIndex < 0 ? null : `${wrongIndex + 1}번째 매개변수 이름과 순서를 다시 확인해 보세요.`;
          },
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
        { id: "error", label: "오차 계산", placeholder: "기준값 - 현재값", kind: "concept", width: "large", validate: exactExpression("target-sensor_value", "error 식"), hintTiers: [{ label: "힌트 1/2", body: <>오차는 목표 기준값에서 현재 센서값을 뺀 값입니다.</> }, { label: "힌트 2/2 · 변수명 확인", body: <>직접 입력할 식은 <code>target - sensor_value</code>입니다.</> }] },
        { id: "p_control", label: "P 제어", placeholder: "P 계수 × 현재 오차", kind: "concept", width: "large", validate: exactExpression("kp*error", "p_control 식"), hintTiers: [{ label: "힌트 1/2", body: <>P는 현재 오차에 비례하는 반응입니다.</> }, { label: "힌트 2/2 · 변수명 확인", body: <>직접 입력할 식은 <code>kp * error</code>입니다.</> }] },
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
        { id: "change", label: "변화량", placeholder: "현재 오차 - 이전 오차", kind: "concept", width: "large", validate: exactExpression("error-previous_error", "change 식"), hintTiers: [{ label: "힌트 1/2", body: <>변화량은 지금 오차와 직전 오차의 차이입니다.</> }, { label: "힌트 2/2 · 변수명 확인", body: <>직접 입력할 식은 <code>error - previous_error</code>입니다.</> }] },
        { id: "d_control", label: "D 제어", placeholder: "D 계수 × 변화량", kind: "concept", width: "large", validate: exactExpression("kd*change", "d_control 식"), hintTiers: [{ label: "힌트 1/2", body: <>D는 오차 변화량에 반응합니다.</> }, { label: "힌트 2/2 · 변수명 확인", body: <>직접 입력할 식은 <code>kd * change</code>입니다.</> }] },
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
        { id: "correction", label: "PD 결합", placeholder: "P 반응 + D 반응", kind: "concept", width: "large", validate: exactExpression("p_control+d_control", "correction 식"), hintTiers: [{ label: "힌트 1/2", body: <>P와 D의 두 반응을 더해 하나의 보정값으로 만듭니다.</> }, { label: "힌트 2/2 · 변수명 확인", body: <>직접 입력할 식은 <code>p_control + d_control</code>입니다.</> }] },
        { id: "left_power", label: "왼쪽 출력", placeholder: "기본 속도 + 보정값", kind: "concept", width: "large", validate: exactExpression("base_speed+correction", "left_power 식"), hintTiers: [{ label: "힌트 1/2", body: <>왼쪽 출력에는 기본 속도에 보정값을 더합니다.</> }, { label: "힌트 2/2 · 변수명 확인", body: <>직접 입력할 식은 <code>base_speed + correction</code>입니다.</> }] },
        { id: "right_power", label: "오른쪽 출력", placeholder: "기본 속도 - 보정값", kind: "concept", width: "large", validate: exactExpression("base_speed-correction", "right_power 식"), hintTiers: [{ label: "힌트 1/2", body: <>오른쪽 출력에는 기본 속도에서 같은 보정값을 뺍니다.</> }, { label: "힌트 2/2 · 변수명 확인", body: <>직접 입력할 식은 <code>base_speed - correction</code>입니다.</> }] },
        { id: "previous_error", label: "이전 오차 저장", placeholder: "이번 반복의 현재 오차", kind: "concept", width: "medium", validate: exactExpression("error", "previous_error 식"), hintTiers: [{ label: "힌트 · 변수명 확인", body: <>이번 반복의 <code>error</code>가 다음 반복에서는 이전 오차가 됩니다. 입력값은 <code>error</code>입니다.</> }] },
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
        { indent: 0, parts: [{ type: "text", value: "", locked: true }] },
        { indent: 0, locked: true, note: "주어짐", parts: [{ type: "text", value: "line_follow(BASE_SPEED, TARGET, KP, KD)", locked: true }] },
      ],
      tests: ["P + D 결합", "좌우 출력에 반대 부호", "모터 호출·이전 오차 저장·함수 실행"],
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

function answersFromSavedCodes(codes: string[] = []): AnswersByMission {
  const result = initialAnswers();
  const expression = (code: string, name: string) => assignmentExpression(code, name) ?? "";

  const routeComments = (codes[0] ?? "")
    .split("\n")
    .map((line) => line.match(/^\s*#\s*(.+?)\s*$/)?.[1] ?? "")
    .filter((line) => line && !line.includes("아래의 코드 입력"));
  ["sensor", "error", "direction", "repeat"].forEach((name, index) => {
    result["0"][name] = routeComments[index] ?? "";
  });

  const settingsCode = codes[1] ?? "";
  Object.entries(GLOBAL_SETTING_NAMES).forEach(([blankId, settingName]) => {
    result["1"][blankId] = expression(settingsCode, settingName);
  });

  const functionCode = codes[2] ?? "";
  result["2"].params = functionCode.match(/def\s+line_follow\s*\(([^)]*)\)/)?.[1]?.trim() ?? "";
  result["2"].loop = functionCode.match(/^\s*while\s+([^:]+)\s*:/m)?.[1]?.trim() ?? "";
  result["2"].sensor = expression(functionCode, "sensor_value");

  result["3"].error = expression(codes[3] ?? "", "error");
  result["3"].p_control = expression(codes[3] ?? "", "p_control");
  result["4"].change = expression(codes[4] ?? "", "change");
  result["4"].d_control = expression(codes[4] ?? "", "d_control");
  result["5"].correction = expression(codes[5] ?? "", "correction");
  result["5"].left_power = expression(codes[5] ?? "", "left_power");
  result["5"].right_power = expression(codes[5] ?? "", "right_power");
  result["5"].previous_error = expression(codes[5] ?? "", "previous_error");
  return result;
}

function restoredMeta(restoredAnswers: AnswersByMission): MetaByBlank {
  const result = initialMeta();
  missions.forEach((mission) => {
    const missionAnswers = restoredAnswers[String(mission.id)] ?? {};
    mission.blanks.forEach((blank) => {
      const value = missionAnswers[blank.id] ?? "";
      if (!value.trim()) return;
      const error = blank.validate(value, { missionId: mission.id, answers: restoredAnswers });
      result[blankKey(mission.id, blank.id)] = {
        ...result[blankKey(mission.id, blank.id)],
        status: error ? "invalid" : "valid",
        touched: true,
        error,
      };
    });
    if (mission.id === 1) {
      const blackValue = stripInlineComment(missionAnswers.black_value ?? "");
      const whiteValue = stripInlineComment(missionAnswers.white_value ?? "");
      const black = Number(blackValue);
      const white = Number(whiteValue);
      if (blackValue && whiteValue && Number.isFinite(black) && Number.isFinite(white) && black >= white) {
        result[blankKey(1, "white_value")] = {
          ...result[blankKey(1, "white_value")],
          status: "invalid",
          touched: true,
          error: "흰색 반사광은 검정 반사광보다 큰 값이어야 해요.",
        };
      }
    }
  });
  return result;
}

function buildGuidedCode(mission: PreviewMission, answers: Record<string, string>) {
  return mission.lines.map((line) => {
    const body = line.parts.map((part) => part.type === "text" ? part.value : (answers[part.blankId] ?? "")).join("");
    return `${"    ".repeat(line.indent)}${body}`;
  }).join("\n");
}

function assignmentExpression(code: string, name: string) {
  return code.match(new RegExp(`^[ \\t]*${name}[ \\t]*=[ \\t]*([^#\\n]*)`, "m"))?.[1]?.trim() ?? null;
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
    const values = Object.fromEntries(mission.blanks.map((blank) => [blank.id, assignmentExpression(executable, GLOBAL_SETTING_NAMES[blank.id]) ?? ""]));
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

export function CodeMissionExperience({ embedded = false, missionId, savedCodes = [], onReview, onSubmit, onReset }: CodeMissionExperienceProps = {}) {
  const [previewMissionId, setPreviewMissionId] = useState(1);
  const activeMissionId = embedded && typeof missionId === "number" ? missionId : previewMissionId;
  const [mode] = useState<EditorMode>("guided");
  const [answers, setAnswers] = useState<AnswersByMission>(() => embedded ? answersFromSavedCodes(savedCodes) : initialAnswers());
  const [meta, setMeta] = useState<MetaByBlank>(() => embedded ? restoredMeta(answersFromSavedCodes(savedCodes)) : initialMeta());
  const [freeCodes, setFreeCodes] = useState<Record<string, string>>({});
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [helperPanelOpen, setHelperPanelOpen] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.18);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [expandedPrevious, setExpandedPrevious] = useState<Record<number, boolean>>({});
  const [loaded, setLoaded] = useState(embedded);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const suppressHelperReopenRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mission = missions[activeMissionId];
  const missionAnswers = useMemo(() => answers[String(activeMissionId)] ?? {}, [activeMissionId, answers]);
  const currentBlank = mission.blanks.find((blank) => blank.id === activeBlankId) ?? null;
  const currentMeta = currentBlank ? meta[blankKey(activeMissionId, currentBlank.id)] : null;
  const generatedCode = useMemo<string>(() => buildGuidedCode(mission, missionAnswers), [mission, missionAnswers]);
  const completedCount = mission.blanks.filter((blank) => meta[blankKey(activeMissionId, blank.id)]?.status === "valid").length;
  const previousMissions = missions.filter((item) => item.id >= 1 && item.id < activeMissionId);
  const previousLineCount = previousMissions.reduce((total, item) => total + item.lines.length, 0);

  useEffect(() => {
    if (embedded) return;
    let cancelled = false;
    const loadSavedState = window.setTimeout(() => {
      if (cancelled) return;
      let savedAnswers: AnswersByMission | undefined;
      let savedFreeCodes: Record<string, string> | undefined;
      let savedBgmVolume: number | undefined;
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { answers?: AnswersByMission; freeCodes?: Record<string, string>; bgmVolume?: number };
          savedAnswers = parsed.answers;
          savedFreeCodes = parsed.freeCodes;
          savedBgmVolume = parsed.bgmVolume;
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      if (savedAnswers) {
        const restoredAnswers = { ...initialAnswers(), ...savedAnswers };
        setAnswers(restoredAnswers);
        setMeta(restoredMeta(restoredAnswers));
      }
      if (savedFreeCodes) setFreeCodes(savedFreeCodes);
      if (typeof savedBgmVolume === "number" && savedBgmVolume >= 0 && savedBgmVolume <= 1) setBgmVolume(savedBgmVolume);
      setLoaded(true);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(loadSavedState);
    };
  }, [embedded]);

  useEffect(() => {
    if (!loaded || embedded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, freeCodes, bgmVolume }));
  }, [answers, bgmVolume, embedded, freeCodes, loaded]);

  useEffect(() => {
    if (embedded) return;
    if (audioRef.current) audioRef.current.volume = bgmVolume;
  }, [bgmVolume, embedded]);

  useEffect(() => {
    if (!loaded || embedded) return;
    const audio = audioRef.current;
    if (!audio) return;
    const startBgm = () => {
      if (audio.paused) void audio.play().then(() => setBgmPlaying(true)).catch(() => setBgmPlaying(false));
      else setBgmPlaying(true);
    };
    startBgm();
    window.addEventListener("pointerdown", startBgm, { once: true });
    window.addEventListener("keydown", startBgm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", startBgm);
      window.removeEventListener("keydown", startBgm);
    };
  }, [embedded, loaded]);

  useEffect(() => {
    if (!helperPanelOpen) return;
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setHelperPanelOpen(false);
      if (activeBlankId) {
        const key = blankKey(activeMissionId, activeBlankId);
        setMeta((current) => current[key] ? ({ ...current, [key]: { ...current[key], hintOpen: false } }) : current);
        requestAnimationFrame(() => {
          const input = inputRefs.current[key];
          if (!input) return;
          suppressHelperReopenRef.current = true;
          input.focus();
          requestAnimationFrame(() => { suppressHelperReopenRef.current = false; });
        });
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeBlankId, activeMissionId, helperPanelOpen]);

  function getBlankMeta(blankId: string) {
    return meta[blankKey(activeMissionId, blankId)] ?? { status: "idle", touched: false, wrongAttempts: 0, hintTier: 0, hintOpen: false, pulse: false, error: null };
  }

  function setBlankMeta(blankId: string, updater: (current: BlankMeta) => BlankMeta) {
    const key = blankKey(activeMissionId, blankId);
    setMeta((current) => ({ ...current, [key]: updater(current[key] ?? getBlankMeta(blankId)) }));
  }

  function updateAnswer(blankId: string, value: string) {
    const keepHintOpen = getBlankMeta(blankId).hintOpen;
    setAnswers((current) => ({
      ...current,
      [String(activeMissionId)]: { ...(current[String(activeMissionId)] ?? {}), [blankId]: value },
    }));
    setBlankMeta(blankId, (current) => ({ ...current, status: value.trim() ? "editing" : "idle", touched: true, error: null }));
    setResult(null);
    if (blankId === activeBlankId) setHelperPanelOpen(keepHintOpen);
  }

  function parameterValues() {
    const values = (missionAnswers.params ?? "").split(",");
    return PARAMETER_NAMES.map((_, index) => values[index]?.trim() ?? "");
  }

  function updateParameterAnswer(index: number, value: string) {
    const values = parameterValues();
    values[index] = value.replace(/,/g, "");
    updateAnswer("params", values.join(", "));
  }

  function focusParameter(index: number) {
    requestAnimationFrame(() => inputRefs.current[`${blankKey(activeMissionId, "params")}:${index}`]?.focus());
  }

  function validateBlank(blank: BlankSpec, value = missionAnswers[blank.id] ?? "", reportWrong = false) {
    const error = blank.validate(value, { missionId: activeMissionId, answers });
    const hasHints = blank.kind === "self" || Boolean(blank.hintTiers?.length);
    setBlankMeta(blank.id, (current) => {
      const wrongAttempts = error && reportWrong ? current.wrongAttempts + 1 : current.wrongAttempts;
      return {
        ...current,
        touched: true,
        status: error ? "invalid" : "valid",
        error,
        wrongAttempts,
        pulse: Boolean(error && wrongAttempts === 1 && hasHints),
        hintOpen: current.hintOpen,
        hintTier: current.hintTier,
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
      setHelperPanelOpen(false);
      if (checked.passed && embedded) onSubmit?.(freeCodes[String(activeMissionId)] ?? "");
      return;
    }
    const issues: string[] = [];
    let firstInvalidBlankId: string | null = null;
    mission.blanks.forEach((blank) => {
      const error = validateBlank(blank, missionAnswers[blank.id] ?? "", true);
      if (!error) return;
      if (!firstInvalidBlankId) firstInvalidBlankId = blank.id;
      issues.push(`${blank.label}: ${error}`);
    });
    const crossIssues = crossValidateGuided();
    issues.push(...crossIssues);
    if (!firstInvalidBlankId && crossIssues.length) firstInvalidBlankId = "white_value";
    const checked = { passed: issues.length === 0, issues };
    setResult(checked);
    setHelperPanelOpen(!checked.passed);
    if (firstInvalidBlankId) setActiveBlankId(firstInvalidBlankId);
    if (checked.passed && embedded) onSubmit?.(generatedCode);
  }

  function focusBlank(blankId: string) {
    setActiveBlankId(blankId);
    const targetMeta = getBlankMeta(blankId);
    setHelperPanelOpen(Boolean(targetMeta.error || targetMeta.hintOpen));
    requestAnimationFrame(() => {
      const input = inputRefs.current[blankKey(activeMissionId, blankId)];
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }

  function moveBlank(blankId: string, direction: 1 | -1) {
    const index = mission.blanks.findIndex((blank) => blank.id === blankId);
    const next = mission.blanks[index + direction];
    if (!next) return;
    if (activeMissionId === 2 && next.id === "params" && direction === -1) {
      focusParameter(PARAMETER_NAMES.length - 1);
      return;
    }
    focusBlank(next.id);
  }

  function toggleHint(blank: BlankSpec) {
    if (!blank.hintTiers?.length && blank.kind !== "self") return;
    const current = getBlankMeta(blank.id);
    const nextOpen = !current.hintOpen;
    setActiveBlankId(blank.id);
    setHelperPanelOpen(nextOpen || Boolean(current.error));
    setBlankMeta(blank.id, (item) => ({ ...item, hintOpen: nextOpen, hintTier: item.hintTier || 1, pulse: false }));
  }

  function nextHint(blank: BlankSpec, tiers: HintTier[]) {
    setBlankMeta(blank.id, (current) => {
      if (current.hintTier >= tiers.length) return { ...current, hintOpen: false, hintTier: 0 };
      return { ...current, hintTier: current.hintTier + 1, hintOpen: true };
    });
  }

  function closeHelperPanel() {
    setHelperPanelOpen(false);
    if (activeBlankId) {
      setBlankMeta(activeBlankId, (current) => ({ ...current, hintOpen: false }));
      requestAnimationFrame(() => {
        const input = inputRefs.current[blankKey(activeMissionId, activeBlankId)];
        if (!input) return;
        suppressHelperReopenRef.current = true;
        input.focus();
        requestAnimationFrame(() => { suppressHelperReopenRef.current = false; });
      });
    }
  }

  function hintTiersFor(blank: BlankSpec): HintTier[] {
    if (blank.kind !== "self") return blank.hintTiers ?? [];
    const previous = answers["1"] ?? {};
    const code = ["black_value", "white_value", "base_speed", "target", "kp", "kd"]
      .map((name) => `${GLOBAL_SETTING_NAMES[name]} = ${previous[name]?.trim() || "?"}`)
      .join("\n");
    const ready = ["base_speed", "target", "kp", "kd"].every((name) => previous[name]?.trim());
    const tiers: HintTier[] = [{
      label: "참고 · 1장에서 내가 쓴 코드",
      body: <><pre>{code}</pre><p>{ready ? "이 중 line_follow에 전달해야 하는 네 값의 이름만 순서대로 괄호 안에 넣어 보세요." : "아직 비어 있는 값이 있어요. 1장을 먼저 완성한 뒤 다시 참고해 주세요."}</p></>,
    }];
    if (ready) tiers.push({
      label: "마지막 힌트 · 순서 확인",
      body: <>대문자 설정값 <code>BASE_SPEED, TARGET, KP, KD</code>를 전달받을 매개변수는 <code>base_speed, target, kp, kd</code> 순서로 입력합니다.</>,
    });
    return tiers;
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
    setHelperPanelOpen(false);
    if (embedded) onReset?.();
  }

  function selectMission(nextMissionId: number) {
    if (nextMissionId === activeMissionId) return;
    setPreviewMissionId(nextMissionId);
    setResult(null);
    setActiveBlankId(null);
    setHelperPanelOpen(false);
  }

  function togglePreviousMission(missionId: number) {
    setExpandedPrevious((current) => ({ ...current, [missionId]: !current[missionId] }));
  }

  const activeHintTiers = currentBlank ? hintTiersFor(currentBlank) : [];
  const activeHint = currentBlank && currentMeta?.hintOpen && currentMeta.hintTier > 0 ? activeHintTiers[currentMeta.hintTier - 1] : null;
  const helperTitle = currentMeta?.error ? "오류와 힌트" : "힌트";
  const helperSummary = activeHint?.label ?? currentBlank?.label ?? "";
  const helperVisible = Boolean(helperPanelOpen && currentBlank && (currentMeta?.error || currentMeta?.hintOpen));

  function toggleBgm() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().then(() => setBgmPlaying(true)).catch(() => setBgmPlaying(false));
    else {
      audio.pause();
      setBgmPlaying(false);
    }
  }

  return <div className={`${styles.page} ${embedded ? styles.embedded : ""}`}>
    {!embedded ? <audio ref={audioRef} src="/assets/line-core-reboot.mp3" loop preload="auto" autoPlay onPlay={() => setBgmPlaying(true)} onPause={() => setBgmPlaying(false)}/> : null}
    {!embedded ? <div className={styles.backgroundGrid} aria-hidden="true"/> : null}
    {!embedded ? <header className={styles.hud}>
      <Link className={styles.brand} href="/" aria-label="라인 코어 아카데미 홈">
        <Image src="/assets/playwell-logo.png" alt="PLAYWELL" width={806} height={213} priority unoptimized/>
        <span><small>USER TEST PREVIEW</small><b>CODE SCREEN REDESIGN</b></span>
      </Link>
      <div className={styles.hudMission} aria-label="미션 이동">
        <button className={styles.missionBack} disabled={activeMissionId === 0} onClick={() => selectMission(activeMissionId - 1)} aria-label="이전 미션"><Icon name="arrow" size={13}/></button>
        <div><small>{mission.shortChapter}</small><b>{mission.chapter}</b></div>
        <span>{activeMissionId + 1} / {missions.length}</span>
        <button disabled={activeMissionId === missions.length - 1} onClick={() => selectMission(activeMissionId + 1)} aria-label="다음 미션"><Icon name="arrow" size={13}/></button>
      </div>
      <div className={styles.hudActions}>
        <div className={styles.bgmControl}>
          <button type="button" onClick={toggleBgm} aria-label={bgmPlaying ? "배경음 일시 정지" : "배경음 재생"} aria-pressed={bgmPlaying}><Icon name="volume" size={15}/><span>{bgmPlaying ? "BGM" : "BGM 꺼짐"}</span></button>
          <label><span>음량</span><input aria-label="배경음 음량" type="range" min="0" max="1" step="0.05" value={bgmVolume} onChange={(event: { target: { value: string } }) => setBgmVolume(Number(event.target.value))}/></label>
        </div>
        <Link className={styles.returnLink} href="/"><Icon name="arrow" size={14}/><span>기존 게임으로 돌아가기</span></Link>
        <div className={styles.previewBadge}><Icon name="terminal" size={15}/><span>개선안 테스트</span></div>
      </div>
    </header> : null}

    <section className={styles.shell}>
      <section className={styles.stage}>
        <div className={styles.activityHead}>
          <span className={styles.activityIcon}><Icon name="code" size={23}/></span>
          <div><p>STEP 3 · 코드 작성</p><h1>{mission.codeTitle}</h1><span>{mission.codeHint}</span></div>
          <button className={styles.resetButton} onClick={resetMission}><Icon name="refresh" size={15}/>이 미션 초기화</button>
        </div>

        <section className={styles.writingRoute} aria-label="작성 순서">
          <header><span><Icon name="book" size={17}/></span><b>작성 순서</b></header>
          <div className={styles.routeProgress}><i style={{ width: `${mission.blanks.length ? (completedCount / mission.blanks.length) * 100 : 0}%` }}/></div>
          <div className={styles.routeItems}>
            {mission.blanks.map((blank, index) => {
              const itemMeta = getBlankMeta(blank.id);
              return <button key={blank.id} className={`${styles.routeItem} ${styles[`status_${itemMeta.status}`]} ${activeBlankId === blank.id ? styles.routeItemActive : ""}`} onClick={() => focusBlank(blank.id)}>
                <span>{itemMeta.status === "valid" ? <Icon name="check" size={13}/> : String(index + 1).padStart(2, "0")}</span>
                <b>{blank.label}</b>
                <em>{itemMeta.status === "valid" ? "완료" : itemMeta.status === "invalid" ? "확인" : itemMeta.status === "editing" ? "입력중" : "대기"}</em>
              </button>;
            })}
          </div>
        </section>

        <div className={styles.codeWorkspace}>
          <section className={styles.editorPanel}>
            <div className={styles.editorTop}>
              <span/><span/><span/><b>{activeMissionId === 0 ? mission.fileName : "line_follow.py"}</b>
            </div>

            {mode === "guided" ? <div className={`${styles.guidedEditor} ${helperVisible ? styles.guidedEditorWithHelper : ""}`}>
              <div className={styles.editorNotice}><span><Icon name="light" size={14}/>이전 코드를 펼쳐 흐름을 확인하고, 현재 미션의 빈칸만 타이핑하세요.</span><b>Tab · Shift+Tab으로 빈칸 이동</b></div>
              <div className={styles.codeLines}>
                {previousMissions.map((previousMission, previousIndex) => {
                  const firstLine = previousMissions.slice(0, previousIndex).reduce((total, item) => total + item.lines.length, 0) + 1;
                  const isOpen = Boolean(expandedPrevious[previousMission.id]);
                  return <section key={previousMission.id} className={styles.previousMission}>
                    <button className={styles.previousToggle} onClick={() => togglePreviousMission(previousMission.id)} aria-expanded={isOpen} aria-controls={`previous-code-${previousMission.id}`}>
                      <span><Icon name="arrow" size={12}/></span><b>{previousMission.chapter}</b><em>{previousMission.lines.length}줄</em><small>{isOpen ? "접기" : "펼치기"}</small>
                    </button>
                    {isOpen ? <div id={`previous-code-${previousMission.id}`} className={styles.previousCodeLines}>
                      {previousMission.lines.map((line, lineIndex) => <div key={`${previousMission.id}-${lineIndex}`} className={`${styles.codeLine} ${styles.previousCodeLine} ${line.locked ? styles.lockedLine : ""}`}>
                        <span className={styles.lineNumber}>{firstLine + lineIndex}</span>
                        <div className={styles.lineBody} style={{ paddingLeft: `${16 + line.indent * 28}px` }}>
                          {line.parts.map((part, partIndex) => part.type === "text"
                            ? <span key={partIndex} className={part.value.trim() ? styles.lockedText : ""}>{part.value}</span>
                            : <span key={partIndex} className={styles.previousValue}>{answers[String(previousMission.id)]?.[part.blankId]?.trim() || "___"}</span>)}
                          {line.note ? <em className={styles.givenBadge}><Icon name="lock" size={10}/>{line.note}</em> : null}
                        </div>
                      </div>)}
                    </div> : null}
                  </section>;
                })}
                {previousMissions.length ? <div className={styles.currentCodeDivider}><span>현재 미션</span><b>{mission.chapter}</b></div> : null}
                {mission.lines.map((line, lineIndex) => <div key={`${lineIndex}-${line.indent}`} className={`${styles.codeLine} ${line.locked ? styles.lockedLine : ""}`}>
                  <span className={styles.lineNumber}>{previousLineCount + lineIndex + 1}</span>
                  <div className={styles.lineBody} style={{ paddingLeft: `${16 + line.indent * 28}px` }}>
                    {line.parts.map((part, partIndex) => {
                      if (part.type === "text") return <span key={partIndex} className={part.locked && part.value.trim() ? styles.lockedText : ""}>{part.value}</span>;
                      const blank = mission.blanks.find((item) => item.id === part.blankId)!;
                      const itemMeta = getBlankMeta(blank.id);
                      const hasHint = blank.kind === "self" || Boolean(blank.hintTiers?.length);
                      if (activeMissionId === 2 && blank.id === "params") {
                        const values = parameterValues();
                        return <span key={partIndex} className={`${styles.blankWrap} ${styles.paramGroup}`}>
                          {PARAMETER_NAMES.map((expected, parameterIndex) => {
                            const value = values[parameterIndex];
                            const segmentStatus: BlankStatus = !value ? "idle" : normalizeCode(value) === expected ? "valid" : itemMeta.status === "invalid" ? "invalid" : "editing";
                            return <span key={expected} className={styles.paramSlot}>
                              <input
                                ref={(node: HTMLInputElement | null) => {
                                  inputRefs.current[`${blankKey(activeMissionId, blank.id)}:${parameterIndex}`] = node;
                                  if (parameterIndex === 0) inputRefs.current[blankKey(activeMissionId, blank.id)] = node;
                                }}
                                className={`${styles.blankInput} ${styles.paramInput} ${styles[`input_${segmentStatus}`]}`}
                                value={value}
                                 placeholder={`${parameterIndex + 1}번째`}
                                 aria-label={`${parameterIndex + 1}번째 매개변수`}
                                 aria-invalid={Boolean(itemMeta.error)}
                                 aria-describedby={itemMeta.error ? `blank-error-${activeMissionId}-${blank.id}` : undefined}
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                 onFocus={() => { setActiveBlankId(blank.id); if (suppressHelperReopenRef.current) suppressHelperReopenRef.current = false; else setHelperPanelOpen(Boolean(itemMeta.error || itemMeta.hintOpen)); setBlankMeta(blank.id, (current) => ({ ...current, status: values.some(Boolean) ? "editing" : current.status })); }}
                                onChange={(event: { target: { value: string } }) => updateParameterAnswer(parameterIndex, event.target.value)}
                                onBlur={() => { if (parameterValues().every(Boolean)) validateBlank(blank); }}
                                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                  if (event.key === "Tab") {
                                    if (event.shiftKey && parameterIndex === 0) return;
                                    event.preventDefault();
                                    if (event.shiftKey) focusParameter(parameterIndex - 1);
                                    else if (parameterIndex < PARAMETER_NAMES.length - 1) focusParameter(parameterIndex + 1);
                                    else moveBlank(blank.id, 1);
                                  }
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    if (parameterIndex < PARAMETER_NAMES.length - 1) focusParameter(parameterIndex + 1);
                                    else { validateBlank(blank); moveBlank(blank.id, 1); }
                                  }
                                }}
                              />
                              {parameterIndex < PARAMETER_NAMES.length - 1 ? <span className={styles.paramComma}>,</span> : null}
                            </span>;
                           })}
                          {itemMeta.error ? <span className={styles.srOnly} id={`blank-error-${activeMissionId}-${blank.id}`}>{itemMeta.error}</span> : null}
                          {hasHint ? <button className={`${styles.hintButton} ${itemMeta.pulse ? styles.hintPulse : ""} ${itemMeta.hintOpen ? styles.hintButtonOpen : ""}`} onMouseDown={(event: { preventDefault(): void }) => event.preventDefault()} onClick={() => toggleHint(blank)} aria-label={`${blank.label} 힌트`} aria-expanded={itemMeta.hintOpen} aria-controls="code-helper-panel">?</button> : null}
                        </span>;
                      }
                      return <span key={partIndex} className={styles.blankWrap}>
                        <input
                          ref={(node: HTMLInputElement | null) => { inputRefs.current[blankKey(activeMissionId, blank.id)] = node; }}
                          className={`${styles.blankInput} ${styles[`width_${blank.width}`]} ${styles[`input_${itemMeta.status}`]}`}
                          value={missionAnswers[blank.id] ?? ""}
                          placeholder={blank.placeholder}
                          aria-label={blank.label}
                          aria-invalid={Boolean(itemMeta.error)}
                          aria-describedby={itemMeta.error ? `blank-error-${activeMissionId}-${blank.id}` : undefined}
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          onFocus={() => { setActiveBlankId(blank.id); if (suppressHelperReopenRef.current) suppressHelperReopenRef.current = false; else setHelperPanelOpen(Boolean(itemMeta.error || itemMeta.hintOpen)); setBlankMeta(blank.id, (current) => ({ ...current, status: (missionAnswers[blank.id] ?? "").trim() ? "editing" : current.status })); }}
                          onChange={(event: { target: { value: string } }) => updateAnswer(blank.id, event.target.value)}
                          onBlur={() => { if ((missionAnswers[blank.id] ?? "").trim()) validateBlank(blank); }}
                          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                            if (event.key === "Tab") { event.preventDefault(); moveBlank(blank.id, event.shiftKey ? -1 : 1); }
                            if (event.key === "Enter") { event.preventDefault(); validateBlank(blank); moveBlank(blank.id, 1); }
                          }}
                        />
                        {itemMeta.error ? <span className={styles.srOnly} id={`blank-error-${activeMissionId}-${blank.id}`}>{itemMeta.error}</span> : null}
                        {hasHint ? <button className={`${styles.hintButton} ${itemMeta.pulse ? styles.hintPulse : ""} ${itemMeta.hintOpen ? styles.hintButtonOpen : ""}`} onMouseDown={(event: { preventDefault(): void }) => event.preventDefault()} onClick={() => toggleHint(blank)} aria-label={`${blank.label} 힌트`} aria-expanded={itemMeta.hintOpen} aria-controls="code-helper-panel">?</button> : null}
                      </span>;
                    })}
                    {line.note ? <em className={styles.givenBadge}><Icon name="lock" size={10}/>{line.note}</em> : null}
                  </div>
                </div>)}
              </div>

              {helperVisible && currentBlank ? <aside id="code-helper-panel" className={styles.helperPanel} role="region" aria-labelledby="code-helper-title">
                <header className={styles.helperHeader}>
                  <div className={styles.helperHeading}><h2 id="code-helper-title">{helperTitle}</h2><span title={helperSummary}>{helperSummary}</span></div>
                  <button type="button" onClick={closeHelperPanel} aria-label="도움말 패널 닫기"><Icon name="x" size={18}/></button>
                </header>
                {currentMeta?.error ? <section className={styles.helperError} aria-live="polite" aria-atomic="true">
                  <span><Icon name="x" size={17}/></span><div><small>오류</small><b>{currentBlank.label}</b><p>{currentMeta.error}</p></div>
                </section> : null}
                {activeHintTiers.length ? <section className={styles.helperHint}>
                  <button type="button" className={styles.helperHintToggle} onClick={() => toggleHint(currentBlank)} aria-expanded={Boolean(activeHint)} aria-controls="active-hint-content">
                    <span><Icon name="light" size={16}/></span><b>{activeHint ? "힌트 접기" : "힌트 보기"}</b><Icon name="arrow" size={15}/>
                  </button>
                  {activeHint ? <div id="active-hint-content" className={styles.helperHintBody} aria-live="polite">
                    <div>{activeHint.body}</div><button type="button" onClick={() => currentMeta && currentMeta.hintTier >= activeHintTiers.length ? toggleHint(currentBlank) : nextHint(currentBlank, activeHintTiers)}>{currentMeta && currentMeta.hintTier >= activeHintTiers.length ? "힌트 접기" : `다음 힌트 보기 (${(currentMeta?.hintTier ?? 0) + 1}/${activeHintTiers.length})`} <Icon name="arrow" size={14}/></button>
                  </div> : null}
                </section> : null}
              </aside> : null}
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

        {result && (result.passed || mode === "free") ? <section className={`${styles.resultPanel} ${result.passed ? styles.resultSuccess : styles.resultError}`} aria-live="polite">
          <span>{result.passed ? <Icon name="check" size={22}/> : <Icon name="terminal" size={22}/>}</span>
          <div><small>{result.passed ? "ALL TESTS PASSED" : "REPAIR REPORT"}</small><h2>{result.passed ? "작성한 코드가 검사를 통과했습니다" : "고칠 위치를 확인해 주세요"}</h2>{result.passed ? <p>공백, 인라인 주석, 0과 0.0처럼 채점 대상이 아닌 차이는 정규화하고 핵심 구조와 순서는 그대로 확인했습니다.</p> : <ul>{result.issues.slice(0, 5).map((issue) => <li key={issue}>{issue}</li>)}</ul>}</div>
          <button type="button" className={styles.resultClose} onClick={() => setResult(null)} aria-label="검사 결과 닫기"><Icon name="x" size={17}/></button>
        </section> : null}

        <div className={styles.actions}>
          {embedded ? <button className={styles.secondaryAction} onClick={onReview}><Icon name="book" size={16}/>배운 개념 다시보기</button> : <button className={styles.secondaryAction} onClick={resetMission}><Icon name="refresh" size={16}/>현재 미션 다시 작성</button>}
          <button className={styles.primaryAction} onClick={runCheck}><span><Icon name="terminal" size={17}/></span>코드 검사하기 <Icon name="arrow" size={18}/></button>
        </div>
      </section>
    </section>
  </div>;
}

export default function CodeScreenPreview() {
  return <CodeMissionExperience/>;
}
