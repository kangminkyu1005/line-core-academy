import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

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
