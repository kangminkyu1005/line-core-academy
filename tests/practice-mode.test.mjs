import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page=await readFile(new URL("../app/practice/page.tsx",import.meta.url),"utf8");
const css=await readFile(new URL("../app/practice/practice.module.css",import.meta.url),"utf8");

test("practice route reuses canonical learning content and code validation",()=>{
  assert.match(page,/finalQuizQuestions/);
  assert.match(page,/glossaryTopics/);
  assert.match(page,/codePracticeMissions/);
  assert.match(page,/validateCode/);
});

test("practice route exposes two accessible state-preserving modes",()=>{
  assert.match(page,/role="tablist"/);
  assert.equal((page.match(/role="tab"/g)??[]).length,2);
  assert.match(page,/role="tabpanel"/);
  assert.match(page,/aria-selected/);
  assert.match(page,/linecore-practice-mode/);
  assert.match(page,/linecore-practice-quiz/);
  assert.match(page,/linecore-practice-code/);
  assert.match(page,/linecore-practice-status/);
});

test("continuous code editor contains all six inline validation sections",()=>{
  for(let section=1;section<=6;section+=1)assert.match(page,new RegExp(`data-qa="code-section-${section}"`));
  assert.match(page,/data-qa="full-validation"/);
  assert.match(page,/data-qa="completed-code"/);
  assert.match(page,/aria-invalid/);
});

test("responsive CSS includes required breakpoints, touch targets, and scoped header reset",()=>{
  assert.match(css,/@media\(max-width:1024px\)/);
  assert.match(css,/@media\(max-width:768px\)/);
  assert.match(css,/@media\(max-width:560px\)/);
  assert.match(css,/\.page :where\(header\)/);
  assert.match(css,/:global\(html\):has\(\.page\)/);
  assert.match(css,/\.gameLink\{min-height:46px\}/);
  assert.match(css,/\.inputRow input,.hintButton\{height:44px\}/);
});
