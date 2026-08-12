"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

type IconName = "arrow" | "book" | "brain" | "check" | "code" | "light" | "lock" | "map" | "mute" | "play" | "sound" | "target" | "terminal" | "user" | "x";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    brain: <><path d="M9.5 4.5A3 3 0 0 0 4 6a3 3 0 0 0 .5 5.5A3 3 0 0 0 6 17a3 3 0 0 0 3.5 2.5Z"/><path d="M14.5 4.5A3 3 0 0 1 20 6a3 3 0 0 1-.5 5.5A3 3 0 0 1 18 17a3 3 0 0 1-3.5 2.5Z"/><path d="M9.5 4.5v15m5-15v15M6.5 9h3m5 0h3m-11 6h3m5 0h3"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    code: <><path d="m8 9-4 3 4 3m8-6 4 3-4 3M14 5l-4 14"/></>,
    light: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5C14.5 15.4 14 16.2 14 18h-4c0-1.8-.5-2.6-1.5-3.5Z"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/></>,
    mute: <><path d="M11 5 6 9H2v6h4l5 4Z"/><path d="m19 9-6 6m0-6 6 6"/></>,
    play: <path d="m8 5 11 7-11 7Z"/>,
    sound: <><path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 5a9 9 0 0 1 0 14"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3m9 6h-3m-6 9v-3M3 12h3"/></>,
    terminal: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    x: <><path d="M6 6l12 12"/><path d="M18 6 6 18"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

type Mission = {
  chapter: string; title: string; short: string; story: string; speech: string;
  connection: string; activityKind: "route" | "memory" | "command" | "calibration" | "wave" | "motors";
  goal: string; reason: string; success: string[]; question: string;
  options: string[]; answer: number; hint: string; codeTitle: string;
  whyQuestion: string; whyOptions: string[]; whyAnswer: number; whyFeedback: string;
  hintLevels: [string, string, string];
  codeHint: string; codeGuide: Array<[string, string]>; starter: string; solution: string; recovered: string;
  tests: Array<[string, string]>;
};

const missions: Mission[] = [
  {
    chapter: "프롤로그", title: "사라진 라인 코어", short: "라인팔로잉의 작동 순서를 이해합니다.",
    story: "미래 도시의 안내 로봇 루미에게 단 하나뿐인 line_follow 명령이 사라졌습니다. 먼저 이 명령이 어떤 일을 해야 하는지 찾아야 합니다.",
    speech: "검은 선은 보이는데 다음에 무엇을 해야 할지 모르겠어요. 라인을 따라간다는 건 어떤 과정인가요?",
    connection: "라인 코어 복구 작전을 시작할게요. 먼저 로봇이 반복해서 판단하는 순서를 찾아봅시다.", activityKind: "route",
    goal: "라인팔로잉의 네 가지 과정을 올바른 순서로 정리합니다.", reason: "앞으로 작성할 각 코드가 전체 함수에서 어떤 역할을 하는지 이해하기 위해 필요합니다.",
    success: ["처리 순서 선택", "네 단계 주석 작성", "검사 통과"],
    question: "라인팔로잉의 올바른 처리 순서는 무엇일까요?",
    options: ["센서 확인 → 오차 계산 → 방향 보정 → 반복", "방향 보정 → 센서 확인 → 정지 → 반복", "속도 증가 → 함수 종료 → 센서 확인", "오차 계산 → 전원 종료 → 반복"], answer: 0,
    whyQuestion: "로봇이 방향을 한 번만 보정하고 멈추면 왜 라인을 계속 따라갈 수 없을까요?",
    whyOptions: ["움직이는 동안 센서값과 오차가 계속 달라지기 때문에", "모터는 한 번만 움직일 수 있기 때문에", "파이썬 변수는 한 번만 사용할 수 있기 때문에", "센서가 반복문 안에서는 작동하지 않기 때문에"], whyAnswer: 0,
    whyFeedback: "로봇의 위치는 매 순간 달라져요. 그래서 센서 확인부터 방향 보정까지를 빠르게 반복해야 합니다.",
    hint: "먼저 현재 상태를 확인하고, 차이를 계산한 뒤 방향을 수정해야 합니다.",
    codeTitle: "처리 과정을 파이썬 주석으로 기록하세요.", codeHint: "각 단계의 역할을 떠올려 네 줄의 주석을 완성해 보세요.",
    hintLevels: ["현재 상태를 먼저 확인한 뒤 차이를 계산해요.", "센서 → 오차 → 보정 → 반복의 흐름을 주석으로 표현해 보세요.", "# 센서 확인 → # 오차 계산 → # 방향 보정 → # 반복"],
    codeGuide: [["# 센서 확인", "현재 센서값을 먼저 읽어요."], ["# 오차 계산", "기준값과 센서값의 차이를 구해요."], ["# 방향 보정", "오차에 맞게 방향을 바꿔요."], ["# 반복", "이 과정을 계속 되풀이해요."]],
    starter: "# 1. \n# 2. \n# 3. \n# 4. ", solution: "# 센서 확인\n# 오차 계산\n# 방향 보정\n# 반복",
    recovered: "라인팔로잉 처리 순서", tests: [["첫 과정", "센서 확인"], ["중간 과정", "오차 계산 · 방향 보정"], ["마지막 과정", "반복"]],
  },
  {
    chapter: "1장 · 기억 모듈", title: "필요한 값을 기억하라", short: "속도, 기준값, Kp, Kd를 변수에 저장합니다.",
    story: "루미는 센서값을 읽을 수 있지만 기준값과 제어 설정을 계속 잊어버립니다. 이름을 붙여 값을 기억시켜 주세요.",
    speech: "기준값과 속도를 매번 새로 말하지 않아도 기억할 수 있게 해 주세요.",
    connection: "방금 정리한 첫 단계는 센서 확인이었죠. 비교할 기준과 속도를 먼저 이름 붙여 기억해 둘게요.", activityKind: "memory",
    goal: "라인팔로잉에 필요한 네 가지 변수를 직접 선언합니다.", reason: "함수에서 같은 값을 정확한 이름으로 다시 사용하기 위해 필요합니다.",
    success: ["변수 역할 구분", "네 변수 작성", "값 검사 통과"],
    question: "기준 센서값을 저장하기에 가장 알맞은 변수 이름은 무엇일까요?", options: ["target", "while", "def", "left_motor"], answer: 0,
    whyQuestion: "코드 곳곳에 0.8과 0.3을 직접 쓰지 않고 kp와 kd 변수로 만드는 가장 큰 이유는 무엇일까요?",
    whyOptions: ["역할을 알아보기 쉽고 한 곳에서 값을 조정할 수 있어서", "숫자는 파이썬에서 사용할 수 없어서", "변수를 쓰면 센서가 더 정확해져서", "모터가 변수 이름을 직접 읽기 때문에"], whyAnswer: 0,
    whyFeedback: "의미 있는 이름을 붙이면 숫자의 역할이 보이고, 나중에 튜닝할 때 한 곳만 바꾸면 됩니다.",
    hint: "변수 이름은 값의 역할을 드러내야 합니다. 따라가려는 목표값을 뜻하는 이름을 찾아보세요.",
    codeTitle: "루미의 기억값을 설정하세요.", codeHint: "이번 훈련 코어는 아래의 고정된 이름과 값을 사용해요. 이후 단계에서도 그대로 다시 사용합니다.",
    hintLevels: ["변수는 이름 = 값 형태로 선언해요.", "base_speed와 target은 정수, kp와 kd는 소수 값이에요.", "base_speed = 60, target = 50, kp = 0.8, kd = 0.3"],
    codeGuide: [["base_speed = 60", "직진할 때의 기준 속도"], ["target = 50", "선을 판단하는 센서 기준값"], ["kp = 0.8", "현재 오차에 반응하는 힘"], ["kd = 0.3", "급격한 흔들림을 줄이는 힘"]],
    starter: "base_speed = \ntarget = \nkp = \nkd = ", solution: "base_speed = 60\ntarget = 50\nkp = 0.8\nkd = 0.3",
    recovered: "속도와 제어 변수", tests: [["기본 속도", "60"], ["기준값", "50"], ["제어값", "Kp 0.8 · Kd 0.3"]],
  },
  {
    chapter: "2장 · 명령 모듈", title: "하나의 명령으로 묶어라", short: "line_follow 함수와 반복 구조를 정의합니다.",
    story: "값은 준비됐지만 루미에게는 실행할 명령이 없습니다. 모든 판단을 담을 하나의 함수 틀을 복구해야 합니다.",
    speech: "여러 명령이 아니라 line_follow라는 하나의 명령으로 움직이고 싶어요.",
    connection: "1장에서 만든 base_speed, target, kp, kd 네 값을 이번에는 line_follow 명령에 전달해 볼게요.", activityKind: "command",
    goal: "매개변수와 반복문을 포함한 line_follow 함수의 틀을 만듭니다.", reason: "라인을 따라가는 모든 과정을 하나의 재사용 가능한 명령으로 묶기 위해 필요합니다.",
    success: ["함수 구조 선택", "들여쓰기 작성", "센서 읽기 확인"],
    question: "함수를 정의할 때 사용하는 파이썬 키워드는 무엇일까요?", options: ["def", "return", "print", "import"], answer: 0,
    whyQuestion: "센서 확인과 보정을 line_follow라는 호출 가능한 함수로 묶으면 어떤 점이 좋을까요?",
    whyOptions: ["필요할 때 같은 동작을 한 번의 명령으로 실행하고 다시 사용할 수 있어서", "함수 안에서는 들여쓰기가 필요 없어서", "모든 프로그램은 함수가 하나만 있어야 해서", "함수로 만들면 반복문이 자동으로 사라져서"], whyAnswer: 0,
    whyFeedback: "함수는 여러 동작을 의미 있는 하나의 명령으로 묶습니다. 필요하면 내부를 보조 함수로 나누는 것도 가능합니다.",
    hint: "새로운 함수의 시작을 알리는 두 글자 키워드를 찾아보세요.",
    codeTitle: "line_follow 함수의 틀을 완성하세요.", codeHint: "아래 이름은 다음 미션이 연결되는 약속입니다. 대소문자와 밑줄까지 설계도와 같게 입력해 주세요.",
    hintLevels: ["함수는 def로 시작하고 이름 뒤 괄호 안에 전달받을 값을 적어요.", "while True: 아래에서 sensor_value에 센서 읽기 결과를 저장해요.", "def line_follow(base_speed, target, kp, kd): … sensor_value = color_sensor.reflection()"],
    codeGuide: [["def line_follow(base_speed, target, kp, kd):", "네 값을 전달받는 함수의 시작"], ["previous_error = 0", "아직 이전 오차가 없으므로 0에서 시작"], ["while True:", "센서 확인과 보정을 계속 반복"], ["color_sensor.reflection()", "센서의 반사광 값을 읽는 명령"]],
    starter: "def line_follow(base_speed, target, kp, kd):\n    previous_error = 0\n\n    while True:\n        sensor_value = ",
    solution: "def line_follow(base_speed, target, kp, kd):\n    previous_error = 0\n\n    while True:\n        sensor_value = color_sensor.reflection()",
    recovered: "함수와 반복 구조", tests: [["함수 이름", "line_follow"], ["이전 오차", "0"], ["센서 읽기", "reflection()"]],
  },
  {
    chapter: "3장 · 판단 모듈", title: "현재 오차에 반응하라", short: "오차를 계산하고 P 제어값을 만듭니다.",
    story: "루미는 센서값을 읽지만 기준에서 얼마나 벗어났는지 알 수 없습니다. 현재 상태에 알맞은 반응 크기를 계산해야 합니다.",
    speech: "조금 벗어났을 때와 많이 벗어났을 때 똑같이 반응하면 안 될 것 같아요.",
    connection: "1장의 target과 2장에서 읽은 sensor_value를 비교하면 지금 얼마나 벗어났는지 알 수 있어요.", activityKind: "calibration",
    goal: "현재 오차를 계산하고 kp를 곱해 P 제어값을 만듭니다.", reason: "기준에서 멀리 벗어날수록 더 크게 방향을 보정하기 위해 필요합니다.",
    success: ["오차 부호 판단", "P 계산식 작성", "3개 입력 검사"],
    question: "target이 50이고 sensor_value가 40이라면 error는 얼마일까요?", options: ["10", "-10", "40", "90"], answer: 0,
    whyQuestion: "P 제어에서 error에 kp를 곱하는 이유는 무엇일까요?",
    whyOptions: ["오차가 클수록 더 크게, 작을수록 더 작게 반응하기 위해", "오차의 부호를 항상 양수로 만들기 위해", "센서값을 기준값으로 바꾸기 위해", "반복문을 종료하기 위해"], whyAnswer: 0,
    whyFeedback: "kp는 현재 오차에 얼마나 민감하게 반응할지 정합니다. 같은 kp라면 큰 오차가 더 큰 보정을 만듭니다.",
    hint: "error = target - sensor_value 순서로 50에서 40을 빼 보세요.",
    codeTitle: "오차와 P 제어 코드를 작성하세요.", codeHint: "설계도에 있는 변수 이름은 앞 단계와 연결됩니다. 식의 왼쪽과 오른쪽을 그대로 확인해 보세요.",
    hintLevels: ["오차는 목표값과 현재값의 차이이며, P 제어에는 곱셈이 필요해요.", "error = target - sensor_value, p_control에는 kp와 error가 들어가요.", "error = target - sensor_value\np_control = kp * error"],
    codeGuide: [["error = target - sensor_value", "목표값에서 현재 센서값을 빼요."], ["p_control = kp * error", "현재 오차에 Kp를 곱해 반응 크기를 정해요."]],
    starter: "error = \np_control = ", solution: "error = target - sensor_value\np_control = kp * error",
    recovered: "오차와 P 제어", tests: [["센서 40", "error 10"], ["센서 50", "error 0"], ["센서 65", "error -15"]],
  },
  {
    chapter: "4장 · 균형 모듈", title: "오차의 변화를 읽어라", short: "이전 오차와 비교해 D 제어값을 만듭니다.",
    story: "P 제어를 복구했지만 오차가 10, -8, 7, -6으로 빠르게 바뀝니다. 루미가 변화의 속도를 읽지 못해 흔들리고 있습니다.",
    speech: "지금 얼마나 벗어났는지는 알아요. 하지만 오차가 얼마나 빠르게 바뀌는지도 알고 싶어요.",
    connection: "3장에서 만든 error를 직전 반복의 previous_error와 비교해 흔들림의 변화를 읽어 볼게요.", activityKind: "wave",
    goal: "현재 오차와 이전 오차의 차이를 구하고 D 제어값을 계산합니다.", reason: "오차가 급격하게 변하는 상황에 대응하고 흔들림을 줄이기 위해 필요합니다.",
    success: ["변화량 이해", "D 계산식 작성", "이전값 비교 검사"],
    question: "현재 error가 8이고 previous_error가 3이라면 change는 얼마일까요?", options: ["5", "11", "-5", "24"], answer: 0,
    whyQuestion: "D 제어가 라인 주행의 흔들림을 줄이는 데 도움을 주는 이유는 무엇일까요?",
    whyOptions: ["오차가 빠르게 변할 때 그 변화를 감지해 추가로 대응하기 때문에", "항상 모터 출력을 0으로 만들기 때문에", "현재 오차를 무시하고 속도만 높이기 때문에", "센서값을 일정하게 고정하기 때문에"], whyAnswer: 0,
    whyFeedback: "D 제어는 현재 위치만 보지 않고 오차가 얼마나 빠르게 변하는지도 봅니다. 급격한 방향 변화를 일찍 감지할 수 있어요.",
    hint: "change는 현재 오차에서 이전 오차를 뺀 값입니다. 8 - 3을 계산해 보세요.",
    codeTitle: "변화량과 D 제어 코드를 작성하세요.", codeHint: "현재 오차와 직전 오차를 먼저 비교한 다음, 변화량에 Kd를 곱합니다.",
    hintLevels: ["변화량은 현재 오차에서 이전 오차를 빼서 구해요.", "change에는 error와 previous_error, d_control에는 kd와 change가 들어가요.", "change = error - previous_error\nd_control = kd * change"],
    codeGuide: [["change = error - previous_error", "현재 오차가 직전보다 얼마나 변했는지 계산"], ["d_control = kd * change", "변화가 클수록 더 빠르게 균형을 잡아요."]],
    starter: "change = \nd_control = ", solution: "change = error - previous_error\nd_control = kd * change",
    recovered: "변화량과 D 제어", tests: [["8과 3 비교", "change 5"], ["-2와 4 비교", "change -6"], ["변화 없음", "change 0"]],
  },
  {
    chapter: "최종장 · 중앙 코어", title: "라인팔로잉을 완성하라", short: "P와 D를 결합하고 좌우 출력을 결정합니다.",
    story: "모든 판단 모듈이 복구됐습니다. 보정값을 좌우 출력에 반대로 적용하고 다음 반복을 위해 오차를 기억하면 됩니다.",
    speech: "지금까지 만든 코드를 하나로 연결해 주세요. 그러면 line_follow 명령이 다시 완성돼요.",
    connection: "P의 현재 반응과 D의 변화 반응이 준비됐어요. 두 값을 합쳐 실제 좌우 모터의 속도로 연결합시다.", activityKind: "motors",
    goal: "P와 D를 결합해 좌우 출력을 만들고 previous_error를 갱신합니다.", reason: "계산한 보정값을 실제 방향 변화로 연결하고 다음 계산을 준비하기 위해 필요합니다.",
    success: ["PD 결합", "좌우 출력 작성", "최종 검사 통과"],
    question: "한쪽 출력에 correction을 더했다면 반대쪽 출력에는 어떻게 해야 할까요?", options: ["correction을 뺀다", "같이 더한다", "항상 0으로 만든다", "previous_error를 더한다"], answer: 0,
    whyQuestion: "kp만 사용하고 kd를 0으로 만들면 로봇은 어떤 움직임을 보이기 쉬울까요?",
    whyOptions: ["현재 오차에는 반응하지만 선을 중심으로 좌우 흔들림이 커질 수 있다", "센서를 전혀 읽지 못한다", "항상 완벽한 직선으로만 달린다", "두 모터가 자동으로 멈춘다"], whyAnswer: 0,
    whyFeedback: "P만으로도 선을 향해 움직이지만 빠른 변화를 다듬지 못해 좌우로 지나치며 흔들릴 수 있습니다.",
    hint: "방향을 바꾸려면 좌우 출력에 서로 반대되는 보정이 적용되어야 합니다.",
    codeTitle: "line_follow 함수의 마지막 부분을 완성하세요.", codeHint: "보정값을 좌우 출력에 반대로 적용한 뒤, 이번 오차를 다음 반복을 위해 저장합니다.",
    hintLevels: ["P와 D는 더하고, 같은 correction을 좌우 모터에는 반대 부호로 적용해요.", "left_power에는 + correction, right_power에는 - correction이 들어가요.", "correction = p_control + d_control\nleft_power = base_speed + correction\nright_power = base_speed - correction\nprevious_error = error"],
    codeGuide: [["correction = p_control + d_control", "P와 D 반응을 하나의 보정값으로 합쳐요."], ["left_power = base_speed + correction", "왼쪽 출력에는 보정값을 더해요."], ["right_power = base_speed - correction", "오른쪽 출력에는 보정값을 빼요."], ["previous_error = error", "이번 오차를 다음 반복의 이전 오차로 저장"]],
    starter: "correction = \nleft_power = \nright_power = \n\nleft_motor.dc(left_power)\nright_motor.dc(right_power)\n\nprevious_error = ",
    solution: "correction = p_control + d_control\nleft_power = base_speed + correction\nright_power = base_speed - correction\n\nleft_motor.dc(left_power)\nright_motor.dc(right_power)\n\nprevious_error = error",
    recovered: "완성된 line_follow 함수", tests: [["PD 결합", "P + D"], ["왼쪽 출력", "속도 + 보정"], ["오른쪽 출력", "속도 - 보정"]],
  },
];

type ValidationResult = { passed: boolean; missing: string[] };

function expressionValue(expression: string, variables: Record<string, number>): number | null {
  const tokens = expression.match(/\d+(?:\.\d+)?|[A-Za-z_]\w*|[()+\-*]/g);
  if(!tokens || tokens.join("")!==expression.replace(/\s+/g,""))return null;
  const parsedTokens=tokens;
  let cursor=0;
  const parsePrimary=():number|null=>{
    const token=parsedTokens[cursor++];
    if(token===undefined)return null;
    if(token==="("){
      const value=parseAdditive();
      if(parsedTokens[cursor++]!==")")return null;
      return value;
    }
    if(token==="-"){
      const value=parsePrimary();
      return value===null?null:-value;
    }
    if(/^\d/.test(token))return Number(token);
    return Object.prototype.hasOwnProperty.call(variables,token)?variables[token]:null;
  };
  const parseMultiplicative=():number|null=>{
    let value=parsePrimary();
    while(parsedTokens[cursor]==="*"){
      cursor++;
      const right=parsePrimary();
      if(value===null||right===null)return null;
      value*=right;
    }
    return value;
  };
  function parseAdditive():number|null{
    let value=parseMultiplicative();
    while(parsedTokens[cursor]==="+"||parsedTokens[cursor]==="-"){
      const operator=parsedTokens[cursor++];
      const right=parseMultiplicative();
      if(value===null||right===null)return null;
      value=operator==="+"?value+right:value-right;
    }
    return value;
  }
  const value=parseAdditive();
  return cursor===parsedTokens.length?value:null;
}

function assignmentExpression(code:string,name:string){
  return code.match(new RegExp(`^\\s*${name}\\s*=\\s*([^#\\n]+)`,"m"))?.[1]?.trim()??null;
}

function expressionMatches(expression:string|null,expected:(values:Record<string,number>)=>number,samples:Record<string,number>[]){
  if(!expression)return false;
  return samples.every((values)=>{
    const actual=expressionValue(expression,values);
    return actual!==null&&Math.abs(actual-expected(values))<1e-8;
  });
}

function diagnoseExpression(
  code:string,
  name:string,
  label:string,
  expected:(values:Record<string,number>)=>number,
  samples:Record<string,number>[],
  attempt:number,
  targeted:string,
){
  const expression=assignmentExpression(code,name);
  if(!expression)return `${label}: ${name}에 계산 결과를 저장했는지 확인해 보세요.`;
  if(expressionValue(expression,samples[0])===null)return `${label}: 변수 이름의 철자와 괄호가 올바른지 살펴보세요.`;
  return attempt>1?`${label}: ${targeted}`:`${label}: 사용한 연산자와 값의 순서를 다시 생각해 보세요.`;
}

function validate(id: number, code: string, attempt=1): ValidationResult {
  const executable = code.split("\n").filter((line)=>!line.trimStart().startsWith("#")).join("\n");
  const compact = executable.replace(/\s+/g, "");
  const has = (snippet:string)=>compact.includes(snippet.replace(/\s+/g, ""));
  const hasNumber = (name:string, expected:number)=>{
    const match = executable.match(new RegExp(`^\\s*${name}\\s*=\\s*([^#\\n]+)`, "m"));
    if(!match)return false;
    const value = Number(match[1].trim());
    return Number.isFinite(value)&&Math.abs(value-expected)<1e-9;
  };

  if(id===0){
    const expected=["센서 확인","오차 계산","방향 보정","반복"];
    const comments=code.split("\n").map((line)=>line.match(/^\s*#\s*(.+?)\s*$/)?.[1]??"").filter(Boolean);
    const missing=expected.flatMap((label,index)=>comments[index]===label?[]:[attempt>1?`${index+1}번째 과정의 역할을 다시 확인해 보세요.`:"센서 확인부터 반복까지 처리 순서가 이어지는지 확인해 보세요."]);
    return {passed:missing.length===0,missing};
  }

  if(id===1){
    const checks:[string,()=>boolean][]=[["기본 속도",()=>hasNumber("base_speed",60)],["센서 기준값",()=>hasNumber("target",50)],["P 계수",()=>hasNumber("kp",.8)],["D 계수",()=>hasNumber("kd",.3)]];
    const missing=checks.filter(([,test])=>!test()).map(([label])=>`${label}: 변수 이름과 저장한 값의 종류를 확인해 보세요.`);
    return {passed:missing.length===0,missing};
  }
  if(id===2){
    const lines=executable.split("\n");
    const defIndex=lines.findIndex((line)=>/^\s*def\s+line_follow\s*\(\s*base_speed\s*,\s*target\s*,\s*kp\s*,\s*kd\s*\)\s*:\s*$/.test(line));
    const previousIndex=lines.findIndex((line)=>/^\s+previous_error\s*=\s*0\s*$/.test(line));
    const whileIndex=lines.findIndex((line)=>/^\s+while\s+True\s*:\s*$/.test(line));
    const sensorIndex=lines.findIndex((line)=>/^\s+sensor_value\s*=\s*color_sensor\.reflection\(\)\s*$/.test(line));
    const indent=(index:number)=>index<0?0:(lines[index].match(/^\s*/)?.[0].replace(/\t/g,"    ").length??0);
    const checks:[string,boolean,string][]=[
      ["함수 선언",defIndex>=0,"def, 함수 이름, 괄호 안 네 값, 마지막 콜론을 차례로 확인해 보세요."],
      ["이전 오차 초기화",previousIndex>defIndex&&previousIndex<whileIndex&&indent(previousIndex)>indent(defIndex),"첫 반복 전, 함수 안에서 previous_error를 0으로 시작했는지 확인해 보세요."],
      ["반복 구조",whileIndex>previousIndex&&indent(whileIndex)>indent(defIndex),"while True 뒤의 콜론과 함수 안쪽 들여쓰기를 확인해 보세요."],
      ["센서 읽기",sensorIndex>whileIndex&&indent(sensorIndex)>indent(whileIndex)&&has("color_sensor.reflection()"),"센서 읽기 결과가 sensor_value에 저장되고 반복문 안에 있는지 확인해 보세요."],
    ];
    const missing=checks.filter(([,passed])=>!passed).map(([label,,detail])=>`${label}: ${detail}`);
    return {passed:missing.length===0,missing};
  }
  const formulaChecks:Array<[string,string,(values:Record<string,number>)=>number,Record<string,number>[],string]> = id===3?[
    ["error","오차 계산",(v)=>v.target-v.sensor_value,[{target:50,sensor_value:40},{target:50,sensor_value:65}],"target에서 sensor_value를 빼는 순서인지 확인해 보세요."],
    ["p_control","P 제어",(v)=>v.kp*v.error,[{kp:.8,error:10},{kp:1.2,error:-4}],"kp와 error를 곱해 반응 크기를 만들었는지 확인해 보세요."],
  ]:id===4?[
    ["change","변화량",(v)=>v.error-v.previous_error,[{error:8,previous_error:3},{error:-2,previous_error:4}],"현재 error에서 previous_error를 빼는 순서인지 확인해 보세요."],
    ["d_control","D 제어",(v)=>v.kd*v.change,[{kd:.3,change:5},{kd:.5,change:-6}],"kd와 change를 곱했는지 확인해 보세요."],
  ]:[
    ["correction","PD 결합",(v)=>v.p_control+v.d_control,[{p_control:8,d_control:1.5},{p_control:-4,d_control:2}],"P와 D의 두 반응을 더했는지 확인해 보세요."],
    ["left_power","왼쪽 출력",(v)=>v.base_speed+v.correction,[{base_speed:60,correction:10},{base_speed:55,correction:-7}],"기준 속도에 correction을 더했는지 확인해 보세요."],
    ["right_power","오른쪽 출력",(v)=>v.base_speed-v.correction,[{base_speed:60,correction:10},{base_speed:55,correction:-7}],"왼쪽과 반대 부호로 correction을 적용했는지 확인해 보세요."],
    ["previous_error","이전 오차 저장",(v)=>v.error,[{error:7},{error:-3}],"이번 error를 다음 반복을 위해 저장했는지 확인해 보세요."],
  ];
  const missing=formulaChecks.filter(([name,,expected,samples])=>!expressionMatches(assignmentExpression(executable,name),expected,samples)).map(([name,label,expected,samples,targeted])=>diagnoseExpression(executable,name,label,expected,samples,attempt,targeted));
  if(id===5){
    if(!has("left_motor.dc(left_power)"))missing.push("왼쪽 모터 연결: 계산한 left_power가 왼쪽 모터에 전달되는지 확인해 보세요.");
    if(!has("right_motor.dc(right_power)"))missing.push("오른쪽 모터 연결: 계산한 right_power가 오른쪽 모터에 전달되는지 확인해 보세요.");
  }
  return {passed:missing.length===0,missing};
}

function numberFromCode(code:string,name:string,fallback:number){
  const value=Number(assignmentExpression(code,name));
  return Number.isFinite(value)?value:fallback;
}

function indentFragment(fragment:string,spaces=8){
  const indentation=" ".repeat(spaces);
  return fragment.split("\n").map((line)=>line.trim()?`${indentation}${line.trimStart()}`:"").join("\n");
}

function buildStudentProgram(codes:string[]){
  const variables=codes[1]||missions[1].solution;
  const frame=codes[2]||missions[2].solution;
  const pControl=codes[3]||missions[3].solution;
  const dControl=codes[4]||missions[4].solution;
  const motors=codes[5]||missions[5].solution;
  return `# ${"학생이 복구한 LINE CORE"}\n\n${variables}\n\n${frame}\n${indentFragment(pControl)}\n\n${indentFragment(dControl)}\n${indentFragment(motors)}`;
}

function TypewriterText({text,instant,onDone,onTick}:{text:string;instant:boolean;onDone:()=>void;onTick:()=>void}){
  const [length,setLength]=useState(0);
  const onDoneRef=useRef(onDone);const onTickRef=useRef(onTick);
  useEffect(()=>{onDoneRef.current=onDone;onTickRef.current=onTick},[onDone,onTick]);
  const finished=length>=text.length;
  useEffect(()=>{
    const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(instant||reduceMotion){
      const completion=window.setTimeout(()=>{setLength(text.length);onDoneRef.current()},0);
      return ()=>window.clearTimeout(completion);
    }
    let cursor=0;
    const timer=window.setInterval(()=>{
      cursor=Math.min(text.length,cursor+1);
      setLength(cursor);
      if(cursor%3===0)onTickRef.current();
      if(cursor===text.length){window.clearInterval(timer);onDoneRef.current();}
    },24);
    return ()=>window.clearInterval(timer);
  },[text,instant]);
  return <p className={`dialogueText typewriter ${finished?"finished":""}`}><span aria-hidden="true">{text.slice(0,length)}</span><span className="srOnly">{text}</span><i aria-hidden="true"/></p>;
}

type SoundCue="click"|"type"|"correct"|"wrong"|"clear";

function useGameAudio(enabled:boolean){
  const contextRef=useRef<AudioContext|null>(null);
  const [ready,setReady]=useState(false);
  const activate=()=>{
    if(!contextRef.current){
      contextRef.current=new AudioContext();
      setReady(true);
    }
    if(contextRef.current.state==="suspended")void contextRef.current.resume();
    return contextRef.current;
  };
  const tone=(context:AudioContext,frequency:number,start:number,duration:number,volume:number,type:OscillatorType="sine")=>{
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.018);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.03);
  };
  const play=(cue:SoundCue)=>{
    if(!enabled)return;
    const context=activate();
    const now=context.currentTime;
    if(cue==="type"){tone(context,540,now,.035,.007,"square");return;}
    if(cue==="click"){tone(context,360,now,.07,.025,"triangle");tone(context,520,now+.04,.09,.018,"triangle");return;}
    if(cue==="wrong"){tone(context,190,now,.15,.035,"sawtooth");tone(context,145,now+.11,.2,.025,"sawtooth");return;}
    const notes=cue==="clear"?[392,523.25,659.25,783.99]:[440,554.37,659.25];
    notes.forEach((note,index)=>tone(context,note,now+index*.085,cue==="clear"?.55:.3,cue==="clear"?.045:.03,"triangle"));
  };
  useEffect(()=>{
    const context=contextRef.current;
    if(!ready||!context)return;
    if(!enabled){void context.suspend();return;}
    void context.resume();
    const ambient=()=>{
      const start=context.currentTime+.04;
      [196,246.94,293.66,246.94].forEach((note,index)=>tone(context,note,start+index*.72,.82,.008,"sine"));
    };
    ambient();
    const timer=window.setInterval(ambient,3600);
    return ()=>window.clearInterval(timer);
  },[enabled,ready]);
  useEffect(()=>()=>{void contextRef.current?.close()},[]);
  return {activate,play};
}

type SimulationPoint={error:number;correction:number;left:number;right:number};

function createSimulation(kp:number,kd:number):SimulationPoint[]{
  let error=.92;
  let previous=error;
  let velocity=0;
  return Array.from({length:180},(_,index)=>{
    const change=error-previous;
    const correction=kp*error+kd*change*4.5;
    previous=error;
    velocity=(velocity-correction*.055)*.998;
    const disturbance=index===68?.34:index===122?-.27:0;
    error+=velocity+disturbance;
    return {error,correction,left:60+correction*18,right:60-correction*18};
  });
}

function PDSimulator({initialKp,initialKd}:{initialKp:number;initialKd:number}){
  const [kp,setKp]=useState(initialKp);
  const [kd,setKd]=useState(initialKd);
  const [running,setRunning]=useState(true);
  const [cursor,setCursor]=useState(0);
  const cursorRef=useRef(0);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const data=useMemo(()=>createSimulation(kp,kd),[kp,kd]);
  const current=data[Math.min(cursor,data.length-1)]??data[0];
  const stability=useMemo(()=>{
    const tail=data.slice(-35).reduce((sum,point)=>sum+Math.abs(point.error),0)/35;
    return tail<.05?"안정적으로 수렴":tail<.14?"조금씩 안정":"흔들림이 남음";
  },[data]);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const context=canvas.getContext("2d");if(!context)return;
    const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame=0;let animation=0;let last=performance.now();
    const draw=(limit:number)=>{
      const width=canvas.width,height=canvas.height;
      context.clearRect(0,0,width,height);
      const gradient=context.createLinearGradient(0,0,0,height);gradient.addColorStop(0,"#073d59");gradient.addColorStop(1,"#001e41");context.fillStyle=gradient;context.fillRect(0,0,width,height);
      context.strokeStyle="#8de5d429";context.lineWidth=1;
      for(let x=0;x<width;x+=52){context.beginPath();context.moveTo(x,0);context.lineTo(x,height);context.stroke();}
      const center=(index:number)=>126+28*Math.sin(index/21);
      context.lineCap="round";context.lineJoin="round";
      context.beginPath();data.forEach((_,index)=>{const x=24+index*(width-48)/(data.length-1),y=center(index);if(index)context.lineTo(x,y);else context.moveTo(x,y)});context.strokeStyle="#f8f1e4";context.lineWidth=48;context.stroke();
      context.beginPath();data.forEach((_,index)=>{const x=24+index*(width-48)/(data.length-1),y=center(index);if(index)context.lineTo(x,y);else context.moveTo(x,y)});context.strokeStyle="#07131f";context.lineWidth=8;context.stroke();
      context.beginPath();data.slice(0,limit+1).forEach((point,index)=>{const x=24+index*(width-48)/(data.length-1),y=center(index)+point.error*54;if(index)context.lineTo(x,y);else context.moveTo(x,y)});context.strokeStyle="#56bca7";context.lineWidth=4;context.stroke();
      const point=data[limit]??data[0];const robotX=24+limit*(width-48)/(data.length-1),robotY=center(limit)+point.error*54;
      context.save();context.translate(robotX,robotY);context.fillStyle="#fdcd34";context.shadowColor="#fdcd34";context.shadowBlur=15;context.beginPath();context.roundRect(-12,-9,24,18,6);context.fill();context.fillStyle="#001e41";context.fillRect(-14,-7,4,14);context.fillRect(10,-7,4,14);context.restore();
      const chartTop=235,chartHeight=72;
      context.fillStyle="#00182dbd";context.fillRect(14,chartTop-12,width-28,chartHeight+23);context.strokeStyle="#ffffff25";context.beginPath();context.moveTo(18,chartTop+chartHeight/2);context.lineTo(width-18,chartTop+chartHeight/2);context.stroke();
      context.beginPath();data.slice(0,limit+1).forEach((sample,index)=>{const x=18+index*(width-36)/(data.length-1),y=chartTop+chartHeight/2+sample.error*28;if(index)context.lineTo(x,y);else context.moveTo(x,y)});context.strokeStyle="#fd744d";context.lineWidth=2;context.stroke();
      context.fillStyle="#a9d8d5";context.font="700 11px sans-serif";context.fillText("ERROR TRACE",22,chartTop+4);
    };
    const tick=(time:number)=>{
      if(reduceMotion||!running){draw(reduceMotion?data.length-1:cursorRef.current);return;}
      if(time-last>32){frame=(frame+1)%data.length;last=time;cursorRef.current=frame;draw(frame);if(frame%4===0)setCursor(frame);}
      animation=requestAnimationFrame(tick);
    };
    draw(reduceMotion?data.length-1:0);animation=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(animation);
  },[data,running]);
  const resetCursor=()=>{cursorRef.current=0;setCursor(0)};
  const applyPreset=(nextKp:number,nextKd:number)=>{resetCursor();setKp(nextKp);setKd(nextKd);setRunning(true)};
  const same=(left:number,right:number)=>Math.abs(left-right)<.001;
  const simulationMessage=kd===0?"D가 0이면 오차 변화에 제동을 걸지 못해 중심선을 지나치며 좌우 흔들림이 남습니다.":stability==="안정적으로 수렴"?"D 제어가 급격한 오차 변화를 눌러 로봇이 중심선으로 부드럽게 돌아옵니다.":"Kp가 너무 크거나 Kd가 작으면 빠른 반응 뒤에 흔들림이 남을 수 있습니다.";
  return <section className="pdLab" aria-label="PD 제어 주행 실험실">
    <header><div><small>POST-MISSION LAB</small><h2>PD 주행 실험실</h2><p>계수를 바꾸며 선에서 벗어난 오차가 어떻게 줄어드는지 관찰하세요.</p></div><span className={`stability ${stability.includes("안정")?"stable":"wobble"}`}>{stability}</span></header>
    <div className="simViewport"><canvas ref={canvasRef} width={760} height={330} role="img" aria-label={`${stability}. 현재 오차 ${current.error.toFixed(2)}, 왼쪽 모터 ${Math.round(current.left)}, 오른쪽 모터 ${Math.round(current.right)}`}/><div className="motorTelemetry"><span><small>LEFT MOTOR</small><b>{Math.round(current.left)}</b><i style={{height:`${Math.max(8,Math.min(100,current.left))}%`}}/></span><span><small>RIGHT MOTOR</small><b>{Math.round(current.right)}</b><i style={{height:`${Math.max(8,Math.min(100,current.right))}%`}}/></span></div></div>
    <div className="simControls">
      <label><span><b>Kp</b><output>{kp.toFixed(1)}</output></span><input type="range" min="0" max="2" step="0.1" value={kp} onChange={(event)=>{resetCursor();setKp(Number(event.target.value))}}/></label>
      <label><span><b>Kd</b><output>{kd.toFixed(1)}</output></span><input type="range" min="0" max="1" step="0.1" value={kd} onChange={(event)=>{resetCursor();setKd(Number(event.target.value))}}/></label>
      <div className="simPresets"><button className={same(kp,initialKp)&&kd===0?"active":""} onClick={()=>applyPreset(initialKp,0)}>P만 사용</button><button className={same(kp,initialKp)&&same(kd,initialKd)?"active":""} onClick={()=>applyPreset(initialKp,initialKd)}>내 PD 값</button><button className={same(kp,1.7)&&same(kd,.1)?"active":""} onClick={()=>applyPreset(1.7,.1)}>강한 P</button><button onClick={()=>setRunning((value)=>!value)}>{running?"일시정지":"다시 재생"}</button></div>
    </div>
    <p className="simNote"><b>{kd===0?"P ONLY":"PD CONTROL"}</b>{simulationMessage} 같은 보정값을 좌우 모터에 반대 부호로 적용하면 회전이 생깁니다.</p>
  </section>;
}

export default function Home() {
  const [screen,setScreen] = useState<"title"|"login"|"mission"|"ending">("title");
  const [name,setName] = useState("");
  const [classCode,setClassCode] = useState("");
  const [completed,setCompleted] = useState<number[]>([]);
  const [active,setActive] = useState(0);
  const [step,setStep] = useState(0);
  const [questionRound,setQuestionRound] = useState<0|1>(0);
  const [choice,setChoice] = useState<number|null>(null);
  const [checked,setChecked] = useState(false);
  const [code,setCode] = useState(missions[0].starter);
  const [passed,setPassed] = useState(false);
  const [showClear,setShowClear] = useState(false);
  const [validationIssues,setValidationIssues] = useState<string[]>([]);
  const [attempts,setAttempts] = useState(0);
  const [hintLevel,setHintLevel] = useState(0);
  const [usedSolution,setUsedSolution] = useState(false);
  const [studentCodes,setStudentCodes] = useState(()=>missions.map((item)=>item.starter));
  const [assistHistory,setAssistHistory] = useState(()=>missions.map(()=>({hintLevel:0,usedSolution:false,attempts:0})));
  const [dialogueIndex,setDialogueIndex] = useState(0);
  const [dialogueDone,setDialogueDone] = useState(false);
  const [dialogueInstant,setDialogueInstant] = useState(false);
  const [briefingReady,setBriefingReady] = useState(false);
  const [loadingMessage,setLoadingMessage] = useState<string|null>(null);
  const [codeCopied,setCodeCopied] = useState(false);
  const [soundOn,setSoundOn] = useState(true);
  const [endingTab,setEndingTab] = useState<"code"|"lab">("lab");
  const audio=useGameAudio(soundOn);
  const mission = missions[active];
  const dialogue = [
    mission.connection,
    mission.speech,
    mission.story,
    `${name} 엔지니어님, 이번 임무에서 할 일은 다음과 같아요. ${mission.goal} 준비되면 퀘스트 내용을 확인해 주세요.`,
  ];
  const currentQuestion=questionRound===0?mission.question:mission.whyQuestion;
  const rawOptions=questionRound===0?mission.options:mission.whyOptions;
  const rawAnswer=questionRound===0?mission.answer:mission.whyAnswer;
  const optionShift=(active*2+questionRound+1)%rawOptions.length;
  const currentOptions=[...rawOptions.slice(optionShift),...rawOptions.slice(0,optionShift)];
  const currentAnswer=(rawAnswer-optionShift+rawOptions.length)%rawOptions.length;
  const nextMission = missions.findIndex((_,i)=>!completed.includes(i));
  const stageNames = ["임무 확인","생각하기","코드 작성","테스트"];
  const activityCopy={
    route:["ROUTE NAVIGATION","복구 경로를 연결해 주세요"],memory:["MEMORY CALIBRATION","기억 모듈을 설정해 주세요"],command:["COMMAND ASSEMBLY","명령 모듈을 조립해 주세요"],calibration:["SENSOR CALIBRATION","판단 회로를 보정해 주세요"],wave:["SIGNAL ANALYSIS","오차 파형을 분석해 주세요"],motors:["MOTOR LINK","좌우 출력을 연결해 주세요"],
  }[mission.activityKind];
  const finalProgram=useMemo(()=>buildStudentProgram(studentCodes),[studentCodes]);
  const studentKp=numberFromCode(studentCodes[1],"kp",.8);
  const studentKd=numberFromCode(studentCodes[1],"kd",.3);

  useEffect(()=>{
    const restoreSession = window.setTimeout(()=>{
      const savedName = localStorage.getItem("linecore-name");
      const savedProgress = localStorage.getItem("linecore-progress");
      const savedCodes = localStorage.getItem("linecore-codes");
      const savedAssist = localStorage.getItem("linecore-assist");
      const savedSound = localStorage.getItem("linecore-sound");
      if(savedName) setName(savedName);
      try{if(savedProgress)setCompleted(JSON.parse(savedProgress));}catch{localStorage.removeItem("linecore-progress")}
      try{if(savedCodes)setStudentCodes(JSON.parse(savedCodes));}catch{localStorage.removeItem("linecore-codes")}
      try{if(savedAssist)setAssistHistory(JSON.parse(savedAssist));}catch{localStorage.removeItem("linecore-assist")}
      if(savedSound!==null)setSoundOn(savedSound==="on");
    },0);
    return ()=>window.clearTimeout(restoreSession);
  },[]);

  useEffect(()=>{localStorage.setItem("linecore-sound",soundOn?"on":"off")},[soundOn]);

  function transition(action:()=>void,message:string,delay=650){
    if(loadingMessage)return;
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){action();return;}
    setLoadingMessage(message);
    window.setTimeout(()=>{action();setLoadingMessage(null)},delay);
  }
  function persistLearning(nextCodes:string[],nextAssist:typeof assistHistory){
    setStudentCodes(nextCodes);setAssistHistory(nextAssist);
    localStorage.setItem("linecore-codes",JSON.stringify(nextCodes));
    localStorage.setItem("linecore-assist",JSON.stringify(nextAssist));
  }
  function resetLearning(){
    const nextCodes=missions.map((item)=>item.starter);
    const nextAssist=missions.map(()=>({hintLevel:0,usedSolution:false,attempts:0}));
    setCompleted([]);localStorage.setItem("linecore-progress","[]");persistLearning(nextCodes,nextAssist);
    return {nextCodes,nextAssist};
  }
  function openMission(id:number,codes=studentCodes,assists=assistHistory){
    const assist=assists[id]??{hintLevel:0,usedSolution:false,attempts:0};
    setActive(id);setStep(0);setQuestionRound(0);setChoice(null);setChecked(false);setCode(codes[id]||missions[id].starter);setPassed(false);setShowClear(false);setValidationIssues([]);setAttempts(assist.attempts);setHintLevel(assist.hintLevel);setUsedSolution(assist.usedSolution);setDialogueIndex(0);setDialogueDone(false);setDialogueInstant(false);setBriefingReady(false);setScreen("mission");
  }
  function startGame(){
    audio.activate();audio.play("click");
    transition(()=>{
      if(!name.trim()){setScreen("login");return;}
      if(completed.length===missions.length){const fresh=resetLearning();openMission(0,fresh.nextCodes,fresh.nextAssist);return;}
      openMission(nextMission<0?0:nextMission);
    },name.trim()?"저장된 라인 코어에 연결하는 중":"엔지니어 등록 정보를 확인하는 중");
  }
  function login(e:FormEvent){
    e.preventDefault();
    if(!name.trim()||!classCode.trim())return;
    const previousName=localStorage.getItem("linecore-name");
    audio.activate();audio.play("click");
    const fresh=previousName&&previousName!==name.trim()?resetLearning():null;
    localStorage.setItem("linecore-name",name.trim());
    transition(()=>openMission(previousName===name.trim()&&nextMission>=0?nextMission:0,fresh?.nextCodes,fresh?.nextAssist),"라인 코어 세계를 불러오는 중");
  }
  function advanceDialogue(){
    audio.play("click");
    if(!dialogueDone){setDialogueInstant(true);return;}
    if(dialogueIndex<dialogue.length-1){setDialogueIndex(dialogueIndex+1);setDialogueDone(false);setDialogueInstant(false);}
    else transition(()=>setBriefingReady(true),"미션 정보를 불러오는 중",260);
  }
  function goToStep(next:number,message:string,meaningful=false){
    audio.play("click");
    if(meaningful)transition(()=>setStep(next),message,360);else setStep(next);
  }
  function revealHint(){
    audio.play("click");
    const next=Math.min(3,hintLevel+1);
    setHintLevel(next);
    const nextAssist=assistHistory.map((item,index)=>index===active?{...item,hintLevel:Math.max(item.hintLevel,next)}:item);
    persistLearning(studentCodes,nextAssist);
  }
  function fillSolution(){
    audio.play("click");setCode(mission.solution);setHintLevel(3);setUsedSolution(true);
    const nextCodes=studentCodes.map((item,index)=>index===active?mission.solution:item);
    const nextAssist=assistHistory.map((item,index)=>index===active?{...item,hintLevel:3,usedSolution:true}:item);
    persistLearning(nextCodes,nextAssist);
  }
  function runCode(){
    const nextAttempt=attempts+1;
    const result=validate(active,code,nextAttempt);
    const nextCodes=studentCodes.map((item,index)=>index===active?code:item);
    const nextAssist=assistHistory.map((item,index)=>index===active?{...item,hintLevel,usedSolution,attempts:nextAttempt}:item);
    persistLearning(nextCodes,nextAssist);setAttempts(nextAttempt);setPassed(result.passed);setShowClear(false);setValidationIssues(Array.from(new Set(result.missing)));
    audio.play(result.passed?"correct":"wrong");setStep(3);
  }
  function finishMission(){
    audio.play("clear");
    const list=Array.from(new Set([...completed,active])).sort();
    setCompleted(list);
    localStorage.setItem("linecore-progress",JSON.stringify(list));
    if(active<missions.length-1)transition(()=>openMission(active+1),`CHAPTER ${active+1} 복구 완료 · 다음 구역으로 이동 중`,850);
    else transition(()=>setScreen("ending"),"라인 코어 전체 시스템을 동기화하는 중",950);
  }

  function toggleSound(){
    const next=!soundOn;setSoundOn(next);
    if(next){audio.activate();window.setTimeout(()=>audio.play("correct"),0)}
  }

  const loading=loadingMessage?<LoadingScreen message={loadingMessage}/>:null;
  const startLabel=!name.trim()?"GAME START":completed.length===missions.length?"다시 시작":completed.length?"이어서 시작":"GAME START";

  if(screen==="title") return <><main className="titleScreen" aria-hidden={Boolean(loadingMessage)} inert={Boolean(loadingMessage)}>
    <img className="titleLogo" src="/assets/playwell-logo.png" alt="Playwell"/>
    <div className="titleSky" aria-hidden="true"><i/><i/><i/></div>
    <svg className="titleRoute" viewBox="0 0 1400 800" aria-hidden="true"><path d="M-80 820C290 635 360 730 590 575s274-263 520-157 218 221 392 80"/><path d="M-80 820C290 635 360 730 590 575s274-263 520-157 218 221 392 80"/></svg>
    <div className="titleBlocks" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <img className="titleCharacter" src="/assets/lumi-guide.webp" alt="검은 라인을 따라가는 안내 로봇 루미"/>
    <section className="titleMark">
      <p>PYTHON CODING ADVENTURE</p>
      <h1><span>LINE</span><b>CORE</b></h1>
      <div className="titleQuest" aria-label="프롤로그: 사라진 함수의 비밀. line_follow 함수를 복구하라">
        <div className="titleQuestCore">
          <span className="titleQuestLabel"><i aria-hidden="true"/><Icon name="target" size={14}/> PROLOGUE · EPISODE 01<i aria-hidden="true"/></span>
          <h2>사라진 함수의 비밀</h2>
          <p><code>line_follow()</code> 함수를 복구하라</p>
        </div>
      </div>
      <button className="gameStart" onClick={startGame}><span><Icon name="play" size={24}/></span>{startLabel}<Icon name="arrow"/></button>
    </section>
    {name.trim()&&<button className="changePlayer" onClick={()=>transition(()=>setScreen("login"),"학생 정보를 전환하는 중",450)}><Icon name="user" size={14}/> 학생 변경</button>}
    <button className="soundToggle titleSound" onClick={toggleSound} aria-pressed={soundOn}><Icon name={soundOn?"sound":"mute"} size={17}/><span>{soundOn?"사운드 ON":"사운드 OFF"}</span></button>
    <div className="titleModules"><span>VARIABLE</span><i/><span>FUNCTION</span><i/><span>P CONTROL</span><i/><span>D CONTROL</span></div>
  </main>{loading}</>;

  if(screen==="login") return <><main className="loginGame" aria-hidden={Boolean(loadingMessage)} inert={Boolean(loadingMessage)}>
    <button className="backTitle" onClick={()=>setScreen("title")}><Icon name="arrow" size={17}/> 타이틀로</button>
    <button className="soundToggle loginSound" onClick={toggleSound} aria-pressed={soundOn}><Icon name={soundOn?"sound":"mute"} size={17}/><span>{soundOn?"사운드 ON":"사운드 OFF"}</span></button>
    <img className="loginLogo" src="/assets/playwell-logo.png" alt="Playwell"/>
    <img className="loginCharacter" src="/assets/lumi-guide.webp" alt="학생을 기다리는 안내 로봇 루미"/>
    <form className="gameLoginCard" onSubmit={login}>
      <div className="loginBadge"><Icon name="user" size={25}/></div><p className="kicker">PLAYER ACCESS</p><h1>엔지니어 등록</h1><p>이름과 클래스 코드를 입력하면 바로 인트로가 시작됩니다.</p>
      <label>학생 이름<input value={name} onChange={e=>setName(e.target.value)} placeholder="이름을 입력하세요" autoFocus/></label>
      <label>클래스 코드<input value={classCode} onChange={e=>setClassCode(e.target.value)} placeholder="수업 코드를 입력하세요" inputMode="numeric"/></label>
      <button className="primary" disabled={!name.trim()||!classCode.trim()}>게임에 입장하기 <Icon name="arrow"/></button>
      <small><Icon name="lock" size={15}/> 진행 기록은 현재 기기에 자동 저장됩니다.</small>
    </form>
  </main>{loading}</>;

  if(screen==="ending") return <><main className="endingScreen" aria-hidden={Boolean(loadingMessage)} inert={Boolean(loadingMessage)}>
    <img className="endingLogo" src="/assets/playwell-logo.png" alt="Playwell"/>
    <img className="endingCharacter" src="/assets/lumi-clear.webp" alt="라인 코어를 복구한 루미"/>
    <button className="soundToggle endingSound" onClick={toggleSound} aria-pressed={soundOn}><Icon name={soundOn?"sound":"mute"} size={17}/><span>{soundOn?"사운드 ON":"사운드 OFF"}</span></button>
    <section className="endingPanel">
      <div className="endingSummary"><span className="endingCore"><Icon name="check" size={39}/></span><p className="kicker">LINE CORE RESTORED</p><h1>라인 코어<br/>복구 완료</h1><p>{name} 엔지니어가 직접 작성한 모듈이 하나의 <code>line_follow()</code> 함수로 연결됐습니다.</p><div className="endingModules"><span>변수 설정</span><span>함수 정의</span><span>P 제어</span><span>D 제어</span><span>좌우 출력</span></div><div className="endingActions"><button className={endingTab==="lab"?"active":""} onClick={()=>setEndingTab("lab")}><Icon name="target" size={16}/> 주행 실험</button><button className={endingTab==="code"?"active":""} onClick={()=>setEndingTab("code")}><Icon name="code" size={16}/> 내 전체 코드</button></div><button className="gameStart small" onClick={()=>transition(()=>setScreen("title"),"타이틀 화면으로 돌아가는 중",550)}>타이틀로 돌아가기 <Icon name="arrow"/></button></div>
      {endingTab==="lab"?<PDSimulator initialKp={studentKp} initialKd={studentKd}/>:<section className="finalCodePanel" aria-label="완성된 line_follow 전체 코드">
        <header><div><small>STUDENT RESTORED SOURCE</small><h2>내가 완성한 전체 코드</h2></div><button onClick={async()=>{try{await navigator.clipboard.writeText(finalProgram);setCodeCopied(true);window.setTimeout(()=>setCodeCopied(false),1600)}catch{return}}}><Icon name={codeCopied?"check":"code"} size={16}/>{codeCopied?"복사 완료":"전체 코드 복사"}</button></header>
        <pre><code className="finalCodeLines">{finalProgram.split("\n").map((line,index)=>{
          const trimmed=line.trimStart();
          const tone=trimmed.startsWith("#")?"isComment":/^(def|while)\b/.test(trimmed)?"isKeyword":"";
          return <span className={`finalCodeLine ${tone}`} key={`${index}-${line}`}><i aria-hidden="true">{String(index+1).padStart(2,"0")}</i><span className="finalCodeText">{line||" "}</span></span>;
        })}</code></pre>
        <p><Icon name="brain" size={16}/> 각 장에서 통과한 코드 조각을 연결했습니다. 서로 다른 올바른 수식도 그대로 보존됩니다.</p>
      </section>}
    </section>
  </main>{loading}</>;

  return <><main className="gameScreen" aria-hidden={Boolean(loadingMessage)} inert={Boolean(loadingMessage)}>
    <header className="gameHud" aria-hidden={showClear} inert={showClear}><img src="/assets/playwell-logo.png" alt="Playwell"/><div className="chapterInfo"><small>{mission.chapter}</small><b>{mission.title}</b></div><div className="chapterProgress"><span>CORE {active+1} / {missions.length}</span><div>{missions.map((_,i)=><i className={i<active?"done":i===active?"active":""} key={i}/>)}</div></div><div className="stageProgress"><small>{stageNames[step]}</small><div>{stageNames.map((s,i)=><i className={i<step?"done":i===step?"active":""} title={s} key={s}/>)}</div></div><div className="hudActions"><button className="soundToggle" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn?"사운드 끄기":"사운드 켜기"}><Icon name={soundOn?"sound":"mute"} size={16}/></button><button className="exitGame" onClick={()=>transition(()=>setScreen("title"),"게임을 안전하게 저장하는 중",500)}>게임 종료</button></div></header>
    <section className={`gameViewport stage${step}`}>
    <section className={`missionMain ${step===0?"introMode":""}`}>
      {step===0&&<section className={`rpgScene ${briefingReady?"missionReady":""}`} aria-label={`${mission.title} ${briefingReady?"미션 정보":"도입 대화"}`}>
        <div className="sceneHud"><span>{mission.chapter}</span><b>{mission.title}</b></div>
        {!briefingReady?<button className="skipDialogue" onClick={()=>{audio.play("click");setBriefingReady(true)}}>미션 바로 보기 <Icon name="arrow" size={16}/></button>:<button className="skipDialogue replayScene" onClick={()=>{audio.play("click");setDialogueIndex(0);setDialogueDone(false);setDialogueInstant(false);setBriefingReady(false)}}><Icon name="play" size={14}/> 대사 다시 보기</button>}
        <svg className="sceneMap" viewBox="0 0 800 520" aria-hidden="true">
          <path d="M-30 420C110 355 154 245 286 260s173 116 334 42 185-182 247-210"/>
          <path d="M-30 454C110 389 154 279 286 294s173 116 334 42 185-182 247-210"/>
          <circle cx="165" cy="330" r="9"/><circle cx="530" cy="325" r="9"/>
        </svg>
        <div className="sceneBuilding buildingOne"><i/><i/><i/></div>
        <div className="sceneBuilding buildingTwo"><i/><i/></div>
        <img className="sceneCharacter" src="/assets/lumi-guide.webp" alt="라인 코어 복구를 요청하는 안내 로봇 루미"/>
        {!briefingReady?<div className="dialogueBox">
          <span className="speakerName">안내 로봇 · 루미</span>
          <TypewriterText key={dialogueIndex} text={dialogue[dialogueIndex]} instant={dialogueInstant} onDone={()=>setDialogueDone(true)} onTick={()=>audio.play("type")}/>
          <div className="dialogueFooter"><span>{dialogueIndex+1} / {dialogue.length}</span><span className="dialogueDots" aria-hidden="true">{dialogue.map((_,i)=><i className={i===dialogueIndex?"active":""} key={i}/>)}</span><button onClick={advanceDialogue} aria-label={!dialogueDone?"대사 빠르게 표시":dialogueIndex===dialogue.length-1?"미션 확인하기":"다음 대화"}>{!dialogueDone?"빠르게 표시":dialogueIndex===dialogue.length-1?"미션 확인":"다음"}<Icon name="arrow"/></button></div>
        </div>:<section className="missionBoard" aria-label="게임 목표와 승리 조건">
          <div className="missionGoal">
            <span className="missionGoalIcon"><Icon name="target" size={25}/></span>
            <div><small>MISSION GOAL</small><b>게임 목표</b></div>
          </div>
          <h1>{mission.goal}</h1>
          <div className="missionConditions">
            <p><span>WIN CONDITION</span><b>승리 조건</b></p>
            <ol>{mission.success.map((s,i)=><li key={s}><span>{String(i+1).padStart(2,"0")}</span><b>{s}</b></li>)}</ol>
          </div>
          <button className="missionStart" autoFocus onClick={()=>goToStep(1,"첫 번째 문제를 준비하는 중",true)}><span><Icon name="play" size={18}/></span>미션 시작<Icon name="arrow" size={21}/></button>
        </section>}
      </section>}
      {step===1&&<section className={`stagePanel thinkingStage routeStage activity-${mission.activityKind} ${checked?(choice===currentAnswer?"routeSuccess":"routeError"):choice!==null?"routeLocked":"routeScanning"}`}>
        <div className="routeStageHead">
          <div className="routeGuide">
            <span><img src="/assets/lumi-guide.webp" alt="복구 경로를 안내하는 루미"/></span>
            <div><small>루미 · {activityCopy[0]}</small><h1>{activityCopy[1]}</h1></div>
          </div>
          <div className="routeSignal" aria-live="polite">
            <span><i/><i/><i/><i/></span>
            <div><small>THINK CHECK {questionRound+1} / 2</small><b>{checked?(choice===currentAnswer?"CORE STABLE":"CHECK AGAIN"):choice!==null?"ANSWER LOCKED":"SCANNING"}</b></div>
          </div>
        </div>
        <div className="routeConsole">
          <div className="questionRounds" aria-label="생각하기 진행"><i className="active">1</i><span/><i className={questionRound===1?"active":""}>2</i><b>{questionRound===0?"문법·계산 확인":"역할·결과 예측"}</b></div>
          <div className="routePrompt"><span><Icon name={questionRound===0?"target":"brain"} size={23}/></span><div><small>{questionRound===0?"SYSTEM CHECK":"WHY CHECK"}</small><h2>{currentQuestion}</h2></div></div>
          <div className={`routeOptions ${checked&&choice===currentAnswer?"resolved":""}`}>
            {currentOptions.map((option,i)=>{
              const selected=choice===i;
              const correct=checked&&selected&&i===currentAnswer;
              const wrong=checked&&selected&&i!==currentAnswer;
              const resolved=checked&&choice===currentAnswer;
              const locked=resolved&&!correct;
              return <button
                key={option}
                className={`routeCard ${selected?"selected":""} ${correct?"correct":""} ${wrong?"wrong":""} ${locked?"locked":""}`}
                aria-pressed={selected}
                disabled={resolved}
                aria-label={`선택지 ${String.fromCharCode(65+i)}: ${option}`}
                onMouseEnter={resolved?undefined:event=>event.currentTarget.focus()}
                onClick={()=>{if(resolved)return;audio.play("click");setChoice(i);setChecked(false)}}>
                <span className="routeCardSelector" aria-hidden="true">{wrong?<Icon name="x" size={17}/>:selected?<Icon name="check" size={17}/>:null}</span>
                <span className="routeCardTop"><b>{mission.activityKind.toUpperCase()} {String.fromCharCode(65+i)}</b><i>{correct?"VERIFIED":locked?"LOCKED":wrong?"RETRY":selected?"SELECTED":"STANDBY"}</i></span>
                {mission.activityKind==="route"&&questionRound===0?<span className="routePath">{option.split(" → ").map((part,j)=><span className="routeNode" key={`${part}-${j}`}><b>{part}</b></span>)}</span>:<span className="conceptChoice"><i aria-hidden="true">{String.fromCharCode(65+i)}</i><b>{option}</b></span>}
              </button>;
            })}
          </div>
          <div className={`routeOutcome ${checked?(choice===currentAnswer?"success":"error"):"pending"}`} aria-live="polite">
            <span className="routeOutcomeIcon"><Icon name={checked?(choice===currentAnswer?"check":"terminal"):questionRound===0?"target":"brain"} size={20}/></span>
            <div><b>{checked?(choice===currentAnswer?questionRound===0?"첫 번째 코어 확인 완료":"개념 연결 완료":"한 번 더 생각해 볼까요?"):choice!==null?"선택한 답을 확정하세요":"분석 입력 대기 중"}</b><p>{checked?(choice===currentAnswer?questionRound===0?"이제 이 코드가 왜 필요한지 확인해 볼게요.":mission.whyFeedback:questionRound===0?mission.hint:"결과가 실제 로봇 움직임에 어떤 영향을 주는지 떠올려 보세요."):choice!==null?"선택한 이유를 마음속으로 설명해 보세요.":"정답을 고르기 전에 루미의 질문을 천천히 읽어 보세요."}</p></div>
          </div>
          <div className="routeActions">
            <button className="routeBack" onClick={()=>goToStep(0,"미션 브리핑으로 돌아가는 중")}>임무 확인</button>
            <button className={`routeConfirm ${checked&&choice===currentAnswer?"success":""}`} disabled={choice===null} onClick={checked&&choice===currentAnswer?questionRound===0?()=>{audio.play("correct");setQuestionRound(1);setChoice(null);setChecked(false)}:()=>goToStep(2,"복구 코드 편집기를 여는 중",true):checked?()=>{audio.play("click");setChoice(null);setChecked(false)}:()=>{setChecked(true);audio.play(choice===currentAnswer?"correct":"wrong")}}>
              <span><Icon name={checked&&choice===currentAnswer?questionRound===0?"brain":"code":"target"} size={18}/></span>{checked?(choice===currentAnswer?questionRound===0?"왜 그런지 확인":"복구 코드 작성":"다시 선택"):"답 확정"}<Icon name="arrow" size={20}/>
            </button>
          </div>
        </div>
      </section>}
      {step===2&&<section className="stagePanel codeStage">
        <ActivityHead icon="code" label="STEP 3 · 코드 작성" title={mission.codeTitle} text={mission.codeHint}/>
        <section className="learningReason"><span><Icon name="brain" size={19}/></span><div><small>WHY THIS CODE?</small><b>왜 이 코드를 작성할까요?</b><p>{mission.reason}</p></div></section>
        {active>0&&<div className="coreAssemblyStrip" aria-label="지금까지 복구한 코드 모듈"><small>RECOVERED CORE</small>{missions.slice(1,active+1).map((item,index)=><span key={item.recovered}><Icon name="check" size={12}/>{index+1} · {item.recovered}</span>)}<i/><b>NOW · {mission.recovered}</b></div>}
        <section className="codeBlueprint" aria-label="이번 미션의 복구 설계도">
          <div className="blueprintTitle"><Icon name="book" size={18}/><span><small>ROLE BLUEPRINT</small><b>코드 역할 설계도</b></span><em>{hintLevel>=3?"전체 코드 공개":"코드는 아직 잠김"}</em></div>
          <div className="blueprintItems">{mission.codeGuide.map(([snippet,role],index)=><article className={hintLevel>=3?"revealed":"lockedGuide"} key={snippet}><small>CORE {String(index+1).padStart(2,"0")}</small><p>{role}</p>{hintLevel>=3?<code>{snippet}</code>:<span><Icon name="lock" size={12}/> 직접 구현</span>}</article>)}</div>
        </section>
        <section className={`hintDock level${hintLevel}`} aria-live="polite">
          <div><span><Icon name="light" size={17}/></span><div><small>PROGRESSIVE HINT · {hintLevel} / 3</small><b>{hintLevel===0?"막히면 작은 단서부터 열어 보세요":hintLevel===3?"전체 설계도가 열렸어요":`${hintLevel}단계 단서를 사용 중이에요`}</b></div></div>
          {hintLevel>0&&<ol>{mission.hintLevels.slice(0,hintLevel).map((hint,index)=><li key={hint}><i>{index+1}</i><span>{hint}</span></li>)}</ol>}
          {hintLevel<3&&<button onClick={revealHint}><Icon name="light" size={14}/>{hintLevel+1}단계 힌트 열기</button>}
        </section>
        <div className="editor">
          <div className="editorTop"><span/><span/><span/><b>mission_{active+1}.py</b>{usedSolution&&<em className="assistBadge"><Icon name="light" size={12}/> 전체 코드 도움 사용</em>}<div className="editorTools"><button onClick={()=>{audio.play("click");setCode(mission.starter)}}><Icon name="terminal" size={14}/> 초기 코드 복원</button><button onClick={fillSolution}><Icon name="book" size={14}/> 설계도대로 채우기</button></div></div>
          <div><pre>{Array.from({length:Math.max(8,code.split("\n").length)},(_,i)=>`${i+1}\n`)}</pre><textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} aria-label="파이썬 코드 작성"/></div>
        </div>
        <Actions back={()=>goToStep(1,"생각하기 화면으로 돌아가는 중")} backLabel="생각하기로" next={runCode} nextLabel="코드 검사하기"/>
      </section>}
      {step===3&&<section className={`stagePanel testStage ${passed?"testPassed":""}`}><div className="testContent" aria-hidden={showClear} inert={showClear}><ActivityHead icon="terminal" label="STEP 4 · 코드 검사" title="코드가 의도대로 작동하는지 확인해요" text="정답 문자열이 아니라 여러 입력값에서 계산 결과와 구조를 확인합니다."/>{passed?<div className="testCard"><div className="testTitle"><span><Icon name="check"/></span><div><small>ALL TESTS PASSED · TRY {attempts}</small><h2>작성한 코드가 모든 입력을 통과했어요</h2></div><em className={usedSolution?"assisted":"independent"}><Icon name={usedSolution||hintLevel?"light":"check"} size={14}/>{usedSolution?"전체 코드 도움 사용":hintLevel?`힌트 ${hintLevel}단계 사용`:"도움 없이 복구"}</em></div><div className="testTable"><div className="testRow head"><b>검사 항목</b><b>실행 결과</b><b>상태</b></div>{mission.tests.map(([a,b])=><div className="testRow" key={a}><b>{a}</b><span>{b}</span><i><Icon name="check" size={15}/></i></div>)}</div><div className="interpret"><Icon name="brain"/><p><b>내 코드의 동작을 다시 연결해 볼까요?</b>방금 만든 코드는 {mission.reason}</p></div><button className="moduleCommit" onClick={()=>{audio.play("clear");setShowClear(true)}}><span><Icon name="code" size={18}/></span>이 코드를 라인 코어에 결합하기 <Icon name="arrow" size={19}/></button></div>:<div className="failed"><span className="bigIcon coral"><Icon name="code"/></span><p className="kicker">REPAIR REPORT · TRY {attempts}</p><h2>정답 대신 고칠 방향을 찾아볼게요</h2><ul>{validationIssues.slice(0,3).map((issue)=><li key={issue}><Icon name="target" size={15}/><span>{issue}</span></li>)}</ul>{validationIssues.length>3&&<p className="moreIssues">먼저 표시된 세 부분을 고친 뒤 다시 검사하면 다음 진단도 확인할 수 있어요.</p>}<div className="failedActions"><button className="secondary" onClick={revealHint} disabled={hintLevel>=3}><Icon name="light" size={15}/>{hintLevel>=3?"모든 힌트 사용":`${hintLevel+1}단계 힌트 보기`}</button><button className="primary" onClick={()=>goToStep(2,"코드 편집기로 돌아가는 중")}>코드 수정하기 <Icon name="arrow"/></button></div></div>}</div>
        {showClear&&<div className="missionClearOverlay" role="dialog" aria-modal="true" aria-labelledby="mission-clear-title">
          <div className="clearFireworks" aria-hidden="true"><i/><i/><i/></div>
          <div className="clearParticles" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/></div>
          <section className="missionClearModal">
            <div className="clearRings" aria-hidden="true"><i/><i/><i/></div>
            <img className="clearCharacter" src="/assets/lumi-clear.webp" alt="두 팔을 들고 미션 성공을 축하하는 루미"/>
            <div className="clearCopy">
              <span className="clearVerified"><Icon name="check" size={17}/> SYSTEM VERIFIED</span>
              <small>{mission.chapter}</small>
              <h1 id="mission-clear-title">MISSION <b>CLEAR</b></h1>
              <p className="clearKorean">미션 클리어</p>
              <h2>{mission.recovered} 복구 완료</h2>
              <div className="clearTestCount"><span><Icon name="terminal" size={18}/></span><div><small>TEST RESULT</small><b>{mission.tests.length} / {mission.tests.length} 통과</b></div></div>
              <div className={`clearAssist ${usedSolution||hintLevel?"assisted":"independent"}`}><Icon name={usedSolution||hintLevel?"light":"check"} size={15}/><span>{usedSolution?"전체 코드 도움을 사용해 복구했어요":hintLevel?`힌트 ${hintLevel}단계와 함께 복구했어요`:"도움 없이 스스로 복구했어요"}</span></div>
              <button className="clearNext" autoFocus onClick={finishMission}><span><Icon name="play" size={18}/></span>{active===missions.length-1?"최종 결과로":"다음 단계로"}<Icon name="arrow" size={21}/></button>
            </div>
          </section>
        </div>}
      </section>}
    </section>
    </section>
  </main>{loading}</>;
}

function ActivityHead({icon,label,title,text}:{icon:IconName;label:string;title:string;text:string}){return <div className="activity"><span className="bigIcon"><Icon name={icon}/></span><div><p className="kicker">{label}</p><h1>{title}</h1><p>{text}</p></div></div>}

function Actions({back,next,nextLabel,backLabel="이전",disabled=false}:{back:()=>void;next:()=>void;nextLabel:string;backLabel?:string;disabled?:boolean}){return <div className="actions"><button className="secondary" onClick={back}>{backLabel}</button><button className="primary" onClick={next} disabled={disabled}>{nextLabel}<Icon name="arrow"/></button></div>}

function LoadingScreen({message}:{message:string}){return <div className="loadingScreen" role="status" aria-live="polite"><div className="loadingCore"><i/><i/><span><Icon name="code" size={30}/></span></div><p>LINE CORE SYSTEM</p><h2>{message}</h2><div className="loadingTrack"><i/></div></div>}
