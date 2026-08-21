import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const codeExperience = await readFile(new URL("../app/code-screen-preview/page.tsx", import.meta.url), "utf8");
const codeExperienceStyles = await readFile(new URL("../app/code-screen-preview/preview.module.css", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const validator = await readFile(new URL("../app/code-validation.js", import.meta.url), "utf8");
const learningContent = await readFile(new URL("../app/learning-content.ts", import.meta.url), "utf8");
const missionStarts = [...source.matchAll(/chapter: "([^"]+)"/g)];
const missionBlocks = new Map(
  missionStarts.map((match, index) => [
    match[1],
    source.slice(match.index, missionStarts[index + 1]?.index ?? source.indexOf("type ValidationResult")),
  ]),
);

const requiredKeywords = new Map([
  ["프롤로그", ["# 센서 확인", "# 오차 계산", "# 방향 보정", "# 반복"]],
  ["1장 · 기억 모듈", ["BLACK_VALUE", "WHITE_VALUE", "BASE_SPEED", "TARGET", "KP", "KD"]],
  ["2장 · 명령 모듈", ["line_follow", "base_speed", "target", "kp", "kd", "previous_error", "sensor_value", "color_sensor.reflection()"]],
  ["3장 · 판단 모듈", ["error", "target", "sensor_value", "p_control", "kp"]],
  ["4장 · 균형 모듈", ["change", "error", "previous_error", "d_control", "kd"]],
  ["최종장 · 중앙 코어", ["correction", "p_control", "d_control", "left_power", "right_power", "base_speed", "left_motor.dc(left_power)", "right_motor.dc(right_power)", "previous_error", "error"]],
]);

test("every direct-writing mission exposes the identifiers required by its checker", () => {
  assert.equal(missionBlocks.size, requiredKeywords.size);
  for (const [chapter, keywords] of requiredKeywords) {
    const block = missionBlocks.get(chapter);
    assert.ok(block, `${chapter} mission is missing`);
    assert.match(block, /gradingGuide:\s*\{/);
    assert.match(block, /exact:\s*\[/);
    assert.match(block, /sequence:\s*\[/);
    assert.match(block, /rule:/);
    for (const keyword of keywords) {
      assert.ok(block.includes(`"${keyword}"`), `${chapter} does not expose ${keyword}`);
    }
  }
});

test("the tested code experience is connected to the production mission flow", () => {
  assert.match(source, /import \{ CodeMissionExperience \} from "\.\/code-screen-preview\/page"/);
  assert.match(source, /<CodeMissionExperience[\s\S]*embedded[\s\S]*missionId=\{active\}/);
  assert.match(source, /savedCodes=\{studentCodes\.map/);
  assert.match(source, /onSubmit=\{\(nextCode\)=>runCode\(nextCode\)\}/);
  assert.match(source, /onReview=\{\(\)=>\{audio\.play\("click"\);setShowLearningReview\(true\)\}\}/);
  assert.match(codeExperience, /className=\{styles\.writingRoute\}/);
  assert.match(codeExperience, /className=\{styles\.editorPanel\}/);
  assert.match(codeExperienceStyles, /\.page\.embedded\{min-height:0;height:100%;overflow:hidden;background:transparent\}/);
  assert.doesNotMatch(source, /코드 역할 설계도|ROLE BLUEPRINT/);
});

test("P error validation varies target so a hard-coded 50 cannot pass", () => {
  assert.match(validator, /\{target:50,sensor_value:40\},\{target:42,sensor_value:65\}/);
});

test("the concept dictionary covers the requested learning map and is globally reachable", () => {
  for (const id of ["line-following","variable","reflection","target","error","pd","p-control","d-control","correction","function","parameters","loop","indentation","tuning"]) {
    assert.ok(learningContent.includes(`id:"${id}"`), `missing glossary topic ${id}`);
  }
  assert.doesNotMatch(learningContent, /title:"P란\?"|title:"D란\?"/);
  assert.match(learningContent, /title:"현재 오차에 반응하는 P 제어"/);
  assert.match(learningContent, /title:"오차 변화를 다듬는 D 제어"/);
  assert.match(learningContent, /매개변수의 이름과 순서는 파이썬 전체의 절대 규칙이 아닙니다/);
  assert.match(learningContent, /BASE_SPEED → base_speed · TARGET → target · KP → kp · KD → kd/);
  assert.match(source, /function ConceptDictionary/);
  assert.match(source, /`glossaryButton \$\{className\}`/);
  assert.match(source, /<GlossaryButton className="titleGlossary"/);
  assert.match(source, /<GlossaryButton className="loginGlossary"/);
  assert.match(source, /<GlossaryButton className="endingGlossary"/);
  assert.match(source, /<div className="hudActions"><GlossaryButton/);
});

test("the last mission leads to a 20-question final review", () => {
  const finalQuiz=learningContent.slice(learningContent.indexOf("export const finalQuizQuestions"));
  assert.equal(finalQuiz.match(/\{category:"(?:센서와 기준|PD 제어|파이썬 문법)"/g)?.length, 20);
  assert.match(source, /setScreen\("quiz"\)/);
  assert.match(source, /if\(screen==="quiz"\)/);
  assert.match(source, /종합 문제로/);
  assert.match(source, /20문제 다시 풀기/);
  assert.match(source, /개념 사전에서 보기/);
});

test("the completed program visibly calls line_follow with global settings", () => {
  assert.match(source, /line_follow\(BASE_SPEED, TARGET, KP, KD\)/);
  assert.match(source, /전역 설정값을 함수의 지역 매개변수로 전달해 실행해요/);
  assert.match(source, /function migrateGlobalSettingNames\(code:string\)/);
});

test("the temporary direct final-quiz test entry is hidden", () => {
  assert.doesNotMatch(source, /startQuizTest|quizTestStart|종합 문제 테스트|20문제 바로 풀기/);
});

test("D mission gives explicit entry locations and checks the D calculation", () => {
  const block = missionBlocks.get("4장 · 균형 모듈");
  assert.ok(block);
  assert.equal(block.match(/아래의 코드 입력/g)?.length, 2);
  assert.ok(block.includes("change가 6이고 kd가 0.5라면 d_control은 얼마일까요?"));
  assert.ok(block.includes('options:["3", "6.5", "5.5", "12"]'));
  assert.ok(block.includes("0.5 × 6 = 3"));
});

test("every guided starter comment tells students to enter code below it", () => {
  const starters = [...source.matchAll(/^ {4}starter:\s*("(?:\\.|[^"\\])*")/gm)].map((match)=>JSON.parse(match[1]));
  assert.equal(starters.length, requiredKeywords.size);
  for (const starter of starters) {
    const comments = starter.split("\n").filter((line)=>line.trimStart().startsWith("#"));
    assert.ok(comments.length > 0);
    for (const comment of comments) assert.ok(comment.endsWith("(아래의 코드 입력)"), comment);
  }
});

test("the live editor keeps visible text and caret in one native textarea", () => {
  assert.match(source, /function CodeEditor/);
  assert.doesNotMatch(source, /HighlightedCodeEditor|editorHighlight|commentLine/);
  assert.match(source, /<textarea[\s\S]*aria-label="파이썬 코드 작성"/);
  assert.doesNotMatch(styles, /-webkit-text-fill-color:\s*transparent/);
});

test("game start always confirms the student name without a class-code gate", () => {
  const startGame = source.slice(source.indexOf("function startGame()"), source.indexOf("function login("));
  const login = source.slice(source.indexOf('if(screen==="login")'), source.indexOf('if(screen==="ending")'));
  assert.match(startGame, /setScreen\("login"\)/);
  assert.match(login, /학생 이름/);
  assert.doesNotMatch(login, /클래스 코드|classCode/);
  assert.doesNotMatch(source, /className="changePlayer"/);
});

test("player entry reuses the title scene and Korean text does not split mid-word", () => {
  assert.match(source, /className="titleModules loginModules"/);
  assert.match(styles, /\.loginGame\{[^}]*academy-campus\.webp/);
  assert.match(styles, /\.gameLoginCard\{[^}]*border-left:4px solid var\(--yellow\)/);
  assert.match(source, /screenAudioControl\("loginAudioControl"\)/);
  assert.match(styles, /body\{word-break:keep-all;overflow-wrap:break-word;line-break:strict/);
  assert.match(styles, /\.gameViewport \.dialogueBox>p\{[^}]*max-width:none/);
  assert.match(styles, /\.gameViewport \.briefingHead p:not\(\.kicker\)\{max-width:none\}/);
});

test("dialogue highlights concepts and the supplied BGM has persistent volume control", () => {
  assert.match(source, /className="dialogueKeyword"/);
  assert.match(styles, /\.dialogueKeyword\{color:#ffd95c/);
  assert.match(source, /src="\/assets\/line-core-reboot\.mp3" loop preload="auto"/);
  assert.match(source, /aria-label="배경음 음량"/);
  assert.match(source, /linecore-bgm-volume/);
  assert.match(source, /if\(!soundOn\)\{bgm\.pause\(\);return;\}/);
  assert.match(source, /screenAudioControl\("titleAudioControl"\)/);
  assert.match(source, /screenAudioControl\("endingAudioControl"\)/);
});

test("passing code opens mission clear without an intermediate confirmation", () => {
  const runCode = source.slice(source.indexOf("function runCode(nextCode=code)"), source.indexOf("function finishMission()"));
  assert.match(runCode, /setShowClear\(result\.passed\)/);
  assert.match(runCode, /result\.passed\?"clear":"wrong"/);
  assert.match(runCode, /setStep\(3\)/);
});
