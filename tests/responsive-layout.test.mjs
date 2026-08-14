import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("the document declares a device-width viewport and safe-area support", () => {
  assert.match(layout, /export const viewport:Viewport=\{width:"device-width",initialScale:1,viewportFit:"cover"/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /env\(safe-area-inset-top\)/);
});

test("phone layouts scroll instead of shrinking the complete game into one fixed frame", () => {
  const mobile = styles.slice(styles.indexOf("V11: phone-first playability"));
  assert.match(mobile, /@media\(max-width:650px\)/);
  assert.match(mobile, /\.gameViewport[^}]*overflow-y:auto/);
  assert.match(mobile, /\.loginGame\{[^}]*overflow-y:auto/);
  assert.match(mobile, /\.endingScreen\{[^}]*overflow-x:hidden;overflow-y:auto/);
  assert.match(mobile, /@media\(max-width:900px\) and \(max-height:520px\)/);
});

test("mobile controls and the native code editor remain touch and keyboard friendly", () => {
  const mobile = styles.slice(styles.indexOf("V11: phone-first playability"));
  assert.match(mobile, /:where\(button,input,[^)]+\)\{min-height:44px\}/);
  assert.match(mobile, /\.codeStage \.editorBody>textarea\{[^}]*font-size:16px/);
  assert.match(mobile, /\.editorTop \.editorTools button\{[^}]*min-height:44px/);
  assert.match(mobile, /\.dictionaryArticle>footer\{[^}]*position:sticky/);
  assert.match(mobile, /\.codeStage>\.actions\{[^}]*position:sticky/);
});

test("every major game screen has an explicit phone layout", () => {
  const mobile = styles.slice(styles.indexOf("V11: phone-first playability"));
  for (const selector of [
    ".titleScreen",
    ".loginGame",
    ".gameHud",
    ".rpgScene",
    ".missionBoard",
    ".routeConsole",
    ".codeStage",
    ".testStage",
    ".missionClearOverlay",
    ".conceptDictionaryPanel",
    ".finalQuizScreen",
    ".learningReviewPanel",
    ".endingScreen",
    ".pdLab",
    ".finalCodePanel",
  ]) assert.ok(mobile.includes(selector), `missing mobile layout for ${selector}`);
});

test("the LINE CORE title never splits a word at desktop or tablet widths", () => {
  const finalPass = styles.slice(styles.indexOf("Final responsive HUD pass"));
  assert.match(finalPass, /\.titleMark h1\{[^}]*flex-wrap:nowrap;white-space:nowrap/);
  assert.match(finalPass, /@media\(min-width:901px\) and \(max-width:1180px\)/);
  assert.match(source, /<h1><span>LINE<\/span><b>CORE<\/b><\/h1>/);
});

test("the intermediate HUD keeps brand, chapter, progress, stage and actions in five bounded columns", () => {
  const finalPass = styles.slice(styles.indexOf("Final responsive HUD pass"));
  assert.match(finalPass, /@media\(min-width:901px\) and \(max-width:1180px\)[\s\S]*?\.gameHud\{grid-template-columns:90px minmax\(120px,1fr\) 128px 100px 294px/);
  assert.match(source, /<header className="gameHud"[\s\S]*?<img[\s\S]*?chapterInfo[\s\S]*?chapterProgress[\s\S]*?stageProgress[\s\S]*?hudActions/);
});

test("all full-screen audio controls expose the same persistent volume input", () => {
  assert.match(source, /const screenAudioControl=/);
  assert.match(source, /screenAudioControl\("titleAudioControl"\)/);
  assert.match(source, /screenAudioControl\("loginAudioControl"\)/);
  assert.match(source, /screenAudioControl\("endingAudioControl"\)/);
  assert.match(styles, /\.screenAudioControl input\{[^}]*accent-color:var\(--yellow\)/);
});
