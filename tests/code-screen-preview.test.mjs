import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/code-screen-preview/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/code-screen-preview/preview.module.css", import.meta.url), "utf8");

test("every exact formula can be discovered from the preview hints", () => {
  for (const expression of [
    "(BLACK_VALUE + WHITE_VALUE) / 2",
    "target - sensor_value",
    "kp * error",
    "error - previous_error",
    "kd * change",
    "p_control + d_control",
    "base_speed + correction",
    "base_speed - correction",
  ]) assert.ok(source.includes(`<code>${expression}</code>`), `missing hint for ${expression}`);
  assert.match(source, /<code>base_speed, target, kp, kd<\/code>/);
  assert.match(source, /입력값은 <code>error<\/code>/);
});

test("saved answers restore their validation progress", () => {
  assert.match(source, /function restoredMeta\(restoredAnswers: AnswersByMission\)/);
  assert.match(source, /setMeta\(restoredMeta\(restoredAnswers\)\)/);
});

test("assignment restoration never consumes the following line", () => {
  const parser = source.slice(source.indexOf("function assignmentExpression"), source.indexOf("function validateFreeMission"));
  assert.ok(parser.includes("([^#\\\\n]*)"));
  assert.doesNotMatch(parser, /`\^\\s\*\$\{name\}\\s\*=\\s\*/);
});

test("desktop preview keeps actions in the viewport and scrolls long code internally", () => {
  const desktop = styles.slice(styles.indexOf("Desktop test view"));
  assert.match(desktop, /@media\(min-width:851px\)/);
  assert.match(desktop, /\.page\{height:100dvh;[^}]*overflow:hidden/);
  assert.match(desktop, /\.stage\{[^}]*grid-template-rows:auto auto minmax\(0,1fr\) auto auto;[^}]*overflow:hidden/);
  assert.match(desktop, /\.codeLines\{[^}]*overflow-y:auto/);
});

test("the focused preview removes duplicate navigation and validation chrome", () => {
  assert.doesNotMatch(source, /className=\{styles\.missionRail\}/);
  assert.doesNotMatch(source, /className=\{styles\.testStrip\}/);
  assert.match(source, /aria-label="이전 미션"/);
  assert.match(source, /aria-label="다음 미션"/);
  assert.match(styles, /\.brand img\{filter:none\}/);
  assert.match(styles, /\.shell\{grid-template-columns:minmax\(0,1fr\);gap:0\}/);
  assert.match(source, /priority unoptimized/);
});

test("the guided preview hides internal problem types and mode switches", () => {
  assert.doesNotMatch(source, /blank\.kind === "concept" \? "개념형"/);
  assert.doesNotMatch(source, /className=\{styles\.modeTabs\}/);
  assert.doesNotMatch(source, />빈칸 가이드<|>자유 작성</);
});

test("the attached background music loops with a low adjustable volume", () => {
  assert.match(source, /src="\/assets\/line-core-reboot\.mp3"/);
  assert.match(source, /loop preload="auto" autoPlay/);
  assert.match(source, /useState\(0\.18\)/);
  assert.match(source, /aria-label="배경음 음량"/);
  assert.match(source, /audioRef\.current\.volume = bgmVolume/);
});

test("the mission goal is replaced by a horizontal writing route", () => {
  assert.doesNotMatch(source, /MISSION GOAL/);
  assert.match(source, /className=\{styles\.writingRoute\}/);
  assert.match(source, /className=\{styles\.routeItems\}/);
  assert.match(styles, /\.routeItems\{grid-template-columns:repeat\(auto-fit,minmax\(96px,1fr\)\);justify-content:start\}/);
  assert.match(styles, /\.codeWorkspace\{display:block;min-height:0\}/);
});

test("the writing route header has no overlapping numeric counter", () => {
  assert.doesNotMatch(source, /<header>[^<]*.*completedCount.*mission\.blanks\.length.*<\/header>/s);
  assert.match(styles, /\.writingRoute header\{grid-template-columns:30px max-content;justify-content:start/);
});

test("the wide editor shell keeps actionable code at a readable width", () => {
  assert.match(styles, /\.codeLine\{grid-template-columns:38px minmax\(0,760px\) minmax\(0,1fr\)\}/);
  assert.match(styles, /\.lineBody\{width:100%;max-width:760px;box-sizing:border-box\}/);
  assert.match(styles, /\.givenBadge\{margin-left:8px;margin-right:0\}/);
});

test("line_follow exposes four independently addressable parameter inputs", () => {
  assert.match(source, /const PARAMETER_NAMES = \["base_speed", "target", "kp", "kd"\] as const/);
  assert.match(source, /PARAMETER_NAMES\.map\(\(expected, parameterIndex\) =>/);
  assert.match(source, /aria-label=\{`\$\{parameterIndex \+ 1\}번째 매개변수`\}/);
  assert.match(source, /className=\{styles\.paramComma\}/);
  assert.match(source, /focusParameter\(parameterIndex \+ 1\)/);
  assert.match(source, /values\[index\] = value\.replace\(\/,\/g, ""\)/);
});

test("previous mission code folds into one continuous line_follow file", () => {
  assert.match(source, /const \[expandedPrevious, setExpandedPrevious\]/);
  assert.match(source, /item\.id >= 1 && item\.id < activeMissionId/);
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /previousLineCount \+ lineIndex \+ 1/);
  assert.match(source, /answers\[String\(previousMission\.id\)\]/);
  assert.match(source, /activeMissionId === 0 \? mission\.fileName : "line_follow\.py"/);
  assert.match(source, /현재 미션/);
});

test("global settings and local parameters have visibly different names", () => {
  for (const name of ["BLACK_VALUE", "WHITE_VALUE", "BASE_SPEED", "TARGET", "KP", "KD"]) {
    assert.ok(source.includes(`value: "${name} = `), `missing uppercase setting ${name}`);
  }
  assert.match(source, /line_follow\(BASE_SPEED, TARGET, KP, KD\)/);
  assert.match(source, /대문자 설정값 <code>BASE_SPEED, TARGET, KP, KD<\/code>를 전달받을 매개변수/);
});

test("locked code uses only the unified given badge", () => {
  assert.doesNotMatch(source, /line\.locked \? <Icon name="lock"/);
  assert.doesNotMatch(source, /part\.locked && part\.value\.trim\(\) && line\.locked/);
  assert.match(source, /className=\{styles\.givenBadge\}><Icon name="lock" size=\{10\}\/\>\{line\.note\}/);
});
