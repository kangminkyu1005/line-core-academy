import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page=await readFile(new URL("../app/practice/page.tsx",import.meta.url),"utf8");
const css=await readFile(new URL("../app/practice/practice.module.css",import.meta.url),"utf8");
const downloadCode=await readFile(new URL("../public/downloads/base_code.py",import.meta.url),"utf8");
const { functionReferences }=await import(new URL("../app/practice/function-snippets.js",import.meta.url));

test("practice route reuses canonical learning content and code validation",()=>{
  assert.match(page,/practiceQuizQuestions/);
  assert.match(page,/glossaryTopics/);
  assert.match(page,/codePracticeMissions/);
  assert.match(page,/validateCode/);
});

test("practice route exposes five accessible state-preserving tabs",()=>{
  assert.match(page,/role="tablist"/);
  assert.equal((page.match(/role="tab"/g)??[]).length,5);
  assert.match(page,/role="tabpanel"/);
  assert.match(page,/aria-selected/);
  assert.match(page,/linecore-practice-mode/);
  assert.match(page,/linecore-practice-quiz/);
  assert.match(page,/linecore-practice-code/);
  assert.match(page,/linecore-practice-status/);
  assert.match(page,/saved === "straight"/);
  assert.match(page,/saved === "line"/);
  assert.match(page,/saved === "turn"/);
});

test("continuous code editor starts with variables and contains five validation sections",()=>{
  for(let section=1;section<=5;section+=1)assert.match(page,new RegExp(`data-qa="code-section-${section}"`));
  assert.doesNotMatch(page,/data-qa="code-section-6"/);
  assert.doesNotMatch(page,/처리 순서/);
  assert.doesNotMatch(page,/0\.(sensor|error|direction|repeat)/);
  assert.match(page,/ONE PROGRAM · FIVE STEPS/);
  assert.match(page,/STEP 01<\/small><h3>변수 설정/);
  assert.match(page,/STEP 05<\/small><h3>모터 제어/);
  assert.match(page,/data-qa="full-validation"/);
  assert.match(page,/data-qa="completed-code"/);
  assert.match(page,/aria-invalid/);
});

test("practice quiz exposes the ten requested concepts in teaching order",async()=>{
  const learning=await readFile(new URL("../app/learning-content.ts",import.meta.url),"utf8");
  const quiz=learning.slice(learning.indexOf("export const practiceQuizQuestions"),learning.indexOf("export const finalQuizQuestions"));
  const entries=[...quiz.matchAll(/\{category:"([^"]+)",question:"([^"]+)",options:\[(.*?)\],answer:(\d),explanation:"([^"]+)",glossaryId:"([^"]+)"\}/g)];
  assert.equal(entries.length,10);
  for(const entry of entries){
    const options=JSON.parse(`[${entry[3]}]`);
    const answer=Number(entry[4]);
    assert.equal(options.length,4,`${entry[2]} must have four choices`);
    assert.ok(answer>=0&&answer<4,`${entry[2]} must have a valid answer`);
  }
  const concepts=[
    "P 보정값을 계산",
    "D 보정값을 구하는",
    "최종 보정값",
    "Kp 값을 지나치게 크게",
    "Kd 값을 지나치게 크게",
    "검은색과 흰색이 만나는 경계",
    "경계를 판단하는 기준값",
    "코드를 함수로 만드는",
    "line_follow라는 함수를 정의",
    "올바른 반복문",
  ];
  let cursor=-1;
  for(const concept of concepts){
    const next=quiz.indexOf(concept);
    assert.ok(next>cursor,`${concept} must appear in order`);
    cursor=next;
  }
  assert.match(page,/10 QUESTIONS · CONCEPT CHECK/);
  assert.match(page,/10문제 개념 점검/);
  assert.match(page,/코드 학습으로 이동/);
  assert.match(page,/const compatible = Array\.isArray\(parsed\.answers\)/);
});

test("practice header keeps logo navigation inside practice",()=>{
  assert.doesNotMatch(page,/className=\{styles\.gameLink\}/);
  assert.doesNotMatch(page,/> 기존 게임<\/Link>/);
  assert.match(page,/<Link href="\/practice" className=\{styles\.brand\} aria-label="Practice 홈으로 이동">/);
  assert.doesNotMatch(page,/<Link href="\/" className=\{styles\.brand\}/);
});

test("practice header provides the Pybricks source as a direct download",()=>{
  assert.match(page,/<a href="\/downloads\/base_code\.py" download="base_code\.py" className=\{styles\.downloadButton\} aria-label="Pybricks 기본 코드 다운로드">/);
  assert.match(page,/>코드 다운로드<\/span>/);
  assert.match(downloadCode,/def gyro_straight\(speed, distance_cm\):/);
  assert.match(downloadCode,/def line_follow_pd\(speed, distance_cm, line_side=1\):/);
});

test("three read-only function tabs copy canonical functions with required setup",()=>{
  const expectedFunctions={straight:"gyro_straight",line:"line_follow_pd",turn:"gyro_turn"};
  for(const [kind,functionName] of Object.entries(expectedFunctions)){
    assert.match(page,new RegExp(`id="${kind}-tab"`));
    const reference=functionReferences[kind];
    const start=downloadCode.indexOf(`def ${functionName}(`);
    const remaining=downloadCode.slice(start);
    const end=remaining.indexOf("\n\n\n# ============================================================");
    const canonicalFunction=(end>=0?remaining.slice(0,end):remaining).trim();
    assert.ok(start>=0,`${functionName} must exist in the download code`);
    assert.ok(reference.code.includes(canonicalFunction),`${functionName} must match the download code`);
    assert.match(reference.code,/from pybricks\.hubs import PrimeHub/);
    assert.match(reference.code,/left_motor = Motor\(/);
    assert.match(reference.code,/right_motor = Motor\(/);
    assert.match(reference.code,/wheel_diameter=56/);
    assert.match(reference.code,/axle_track=160/);
  }
  assert.match(functionReferences.line.code,/color_sensor = ColorSensor\(Port\.D\)/);
  assert.match(page,/navigator\.clipboard\?\.writeText/);
  assert.match(page,/설정 포함 코드 복사/);
  assert.doesNotMatch(page,/함수만 복사/);
  assert.match(page,/<pre className=\{styles\.referenceCode\} tabIndex=\{0\}/);
  assert.doesNotMatch(page,/contentEditable/);
});

test("responsive CSS includes required breakpoints, touch targets, and scoped header reset",()=>{
  assert.match(css,/@media\(max-width:1024px\)/);
  assert.match(css,/@media\(max-width:768px\)/);
  assert.match(css,/@media\(max-width:560px\)/);
  assert.match(css,/\.page :where\(header\)/);
  assert.match(css,/:global\(html\):has\(\.page\)/);
  assert.match(css,/\.inputRow input,.hintButton\{height:44px\}/);
});
