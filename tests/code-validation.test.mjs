import test from "node:test";
import assert from "node:assert/strict";
import { expressionValue, validateCode } from "../app/code-validation.js";

test("accepts common valid Python numeric forms",()=>{
  assert.equal(expressionValue(".8",{}),.8);
  assert.equal(expressionValue("3e-1",{}),.3);
  assert.equal(expressionValue("2 ** 3",{}),8);
  const result=validateCode(1,`black_value = 20\nwhite_value = 80\nbase_speed = 60\ntarget = (white_value + black_value) / 2\nkp = .8\nkd = 3e-1`);
  assert.equal(result.passed,true,result.missing.join("\n"));
});

test("accepts valid function and loop spelling variants",()=>{
  const result=validateCode(2,`def line_follow(base_speed, target, kp, kd):\n    previous_error = 0.0\n    while (True):\n        sensor_value = color_sensor.reflection( )`);
  assert.equal(result.passed,true,result.missing.join("\n"));
});

test("accepts role comments with student explanations",()=>{
  const result=validateCode(0,`# 센서 확인: 현재값 읽기\n# 오차 계산 - 기준과 비교\n# 방향 보정 (좌우 속도 변경)\n# 반복 다시 수행`);
  assert.equal(result.passed,true,result.missing.join("\n"));
});

test("accepts equivalent formulas but rejects reversed error",()=>{
  assert.equal(validateCode(3,`error = (target - sensor_value)\np_control = error * kp`).passed,true);
  assert.equal(validateCode(3,`error = sensor_value - target\np_control = kp * error`).passed,false);
});

test("checks both reflection values are inside 0 to 100",()=>{
  const result=validateCode(1,`black_value = 120\nwhite_value = 130\nbase_speed = 60\ntarget = (black_value + white_value) / 2\nkp = .8\nkd = .3`);
  assert.equal(result.passed,false);
  assert.match(result.missing.join(" "),/0~100/);
});
