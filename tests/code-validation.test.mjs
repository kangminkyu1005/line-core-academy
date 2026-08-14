import test from "node:test";
import assert from "node:assert/strict";
import { expressionValue, validateCode } from "../app/code-validation.js";

test("accepts common valid Python numeric forms",()=>{
  assert.equal(expressionValue(".8",{}),.8);
  assert.equal(expressionValue("3e-1",{}),.3);
  assert.equal(expressionValue("2 ** 3",{}),8);
  const result=validateCode(1,`BLACK_VALUE = 20\nWHITE_VALUE = 80\nBASE_SPEED = 60\nTARGET = (WHITE_VALUE + BLACK_VALUE) / 2\nKP = .8\nKD = 3e-1`);
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

test("accepts the semantic Korean labels produced by the redesigned guide",()=>{
  const result=validateCode(0,`# 센서값 읽기\n# 오차 계산\n# 모터 방향 보정\n# 과정 반복`);
  assert.equal(result.passed,true,result.missing.join("\n"));
});

test("canonical generated code passes every one of the six mission validators",()=>{
  const programs=[
    `# 센서값 읽기\n# 오차 계산\n# 모터 방향 보정\n# 과정 반복`,
    `BLACK_VALUE = 20\nWHITE_VALUE = 80\nBASE_SPEED = 60\nTARGET = (BLACK_VALUE + WHITE_VALUE) / 2\nKP = 0.8\nKD = 0.3`,
    `def line_follow(base_speed, target, kp, kd):\n    previous_error = 0\n    while True:\n        sensor_value = color_sensor.reflection()`,
    `error = target - sensor_value\np_control = kp * error`,
    `change = error - previous_error\nd_control = kd * change`,
    `correction = p_control + d_control\nleft_power = base_speed + correction\nright_power = base_speed - correction\nleft_motor.dc(left_power)\nright_motor.dc(right_power)\nprevious_error = error`,
  ];
  programs.forEach((program,id)=>{
    const result=validateCode(id,program);
    assert.equal(result.passed,true,`mission ${id}: ${result.missing.join("\n")}`);
  });
});

test("accepts equivalent formulas but rejects reversed error",()=>{
  assert.equal(validateCode(3,`error = (target - sensor_value)\np_control = error * kp`).passed,true);
  assert.equal(validateCode(3,`error = sensor_value - target\np_control = kp * error`).passed,false);
});

test("checks both reflection values are inside 0 to 100",()=>{
  const result=validateCode(1,`BLACK_VALUE = 120\nWHITE_VALUE = 130\nBASE_SPEED = 60\nTARGET = (BLACK_VALUE + WHITE_VALUE) / 2\nKP = .8\nKD = .3`);
  assert.equal(result.passed,false);
  assert.match(result.missing.join(" "),/0~100/);
});
