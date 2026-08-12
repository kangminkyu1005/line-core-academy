"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

type IconName = "arrow" | "book" | "brain" | "check" | "code" | "light" | "lock" | "map" | "mute" | "play" | "sound" | "target" | "terminal" | "user" | "x";

type LearningCheck = {
  badge: string;
  question: string;
  options: string[];
  answer: number;
  feedback: string;
  codeClue: string;
};

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
  connection: string; conceptBrief: string; activityKind: "route" | "memory" | "command" | "calibration" | "wave" | "motors";
  goal: string; reason: string; success: string[]; question: string;
  options: string[]; answer: number; hint: string; codeTitle: string;
  whyQuestion: string; whyOptions: string[]; whyAnswer: number; whyFeedback: string;
  conceptChecks: LearningCheck[];
  hintLevels: [string, string, string];
  codeHint: string; codeGuide: Array<[string, string]>; guidePatterns: string[]; starter: string; solution: string; recovered: string;
  tests: Array<[string, string]>;
};

function learningChecksFor(mission:Mission):LearningCheck[]{
  return [
    {badge:"CORE CONCEPT",question:mission.question,options:mission.options,answer:mission.answer,feedback:mission.hint,codeClue:mission.codeHint},
    ...mission.conceptChecks,
    {badge:"WHY & RESULT",question:mission.whyQuestion,options:mission.whyOptions,answer:mission.whyAnswer,feedback:mission.whyFeedback,codeClue:mission.reason},
  ];
}

const missions: Mission[] = [
  {
    chapter: "프롤로그", title: "사라진 라인 코어", short: "라인팔로잉의 작동 순서를 이해합니다.",
    story: "검정 바닥은 반사광이 낮고 흰 바닥은 높습니다. 루미는 검정 자체가 아니라 두 반사광의 중간값인 경계선을 기준으로 좌우를 판단해야 합니다.",
    speech: "검정색만 쫓으면 선 한가운데로 들어가 버려요. 검정과 흰색이 만나는 경계를 따라가야 한다는 뜻이군요!",
    connection: "라인 코어 복구를 시작할게요. 먼저 무엇을 따라가는지와 판단 기준을 세운 뒤, 반복되는 처리 순서를 연결해 봅시다.",
    conceptBrief: "검정의 반사광과 흰색의 반사광을 측정한 뒤 두 값의 평균을 기준값으로 사용해요. 센서값이 기준보다 어느 쪽에 있는지 계속 비교하면 경계선을 따라갈 수 있습니다.", activityKind: "route",
    goal: "검정·흰색 경계선과 기준값 공식을 이해하고 처리 순서를 정리합니다.", reason: "라인팔로잉이 검정색 자체가 아니라 경계선을 기준으로 오차를 반복 보정하는 과정임을 이해하기 위해 필요합니다.",
    success: ["경계선 개념 확인", "기준값 공식 이해", "처리 순서 기록"],
    question: "라인팔로잉 로봇이 실제로 따라가야 하는 곳은 어디일까요?",
    options: ["검정과 흰색이 만나는 경계선", "검정 영역의 한가운데", "흰색 영역의 한가운데", "센서가 가장 밝게 보이는 곳"], answer: 0,
    whyQuestion: "로봇이 방향을 한 번만 보정하고 멈추면 왜 라인을 계속 따라갈 수 없을까요?",
    whyOptions: ["움직이는 동안 센서값과 오차가 계속 달라지기 때문에", "모터는 한 번만 움직일 수 있기 때문에", "파이썬 변수는 한 번만 사용할 수 있기 때문에", "센서가 반복문 안에서는 작동하지 않기 때문에"], whyAnswer: 0,
    whyFeedback: "로봇의 위치는 매 순간 달라져요. 그래서 센서 확인부터 방향 보정까지를 빠르게 반복해야 합니다.",
    conceptChecks: [
      {badge:"REFERENCE VALUE",question:"검정 반사광이 20, 흰색 반사광이 80이라면 경계의 기준값은 얼마일까요?",options:["50", "20", "80", "100"],answer:0,feedback:"기준값은 (검정 반사광 + 흰색 반사광) ÷ 2이므로 (20 + 80) ÷ 2 = 50입니다.",codeClue:"target은 검정값과 흰색값을 더한 뒤 2로 나누는 식으로 만들 수 있어요."},
      {badge:"CONTROL LOOP",question:"경계선을 계속 따라가기 위한 올바른 처리 순서는 무엇일까요?",options:["센서 확인 → 오차 계산 → 방향 보정 → 반복", "방향 보정 → 센서 확인 → 정지 → 반복", "속도 증가 → 함수 종료 → 센서 확인", "오차 계산 → 전원 종료 → 반복"],answer:0,feedback:"현재 반사광을 읽고 기준값과의 오차를 계산한 다음 모터를 보정하는 과정을 반복합니다.",codeClue:"처리 순서를 네 줄의 파이썬 주석으로 먼저 설계해 보세요."},
    ],
    hint: "검정과 흰색이 만나는 지점에서는 센서값이 두 반사광의 중간에 가까워집니다.",
    codeTitle: "처리 과정을 파이썬 주석으로 기록하세요.", codeHint: "각 단계의 역할을 떠올려 네 줄의 주석을 완성해 보세요.",
    hintLevels: ["현재 상태를 먼저 확인한 뒤 기준과의 차이를 계산해요.", "차이를 계산한 다음 좌우 모터를 다르게 보정해요.", "마지막 단계는 멈춤이 아니라 같은 판단을 다시 수행하는 것입니다."],
    codeGuide: [["# 센서 확인", "현재 센서값을 먼저 읽어요."], ["# 오차 계산", "기준값과 센서값의 차이를 구해요."], ["# 방향 보정", "오차에 맞게 방향을 바꿔요."], ["# 반복", "이 과정을 계속 되풀이해요."]],
    guidePatterns: ["# 첫 번째 과정", "# 두 번째 과정", "# 세 번째 과정", "# 다시 수행할 과정"],
    starter: "# 현재 반사광을 읽는 과정\n\n# 기준값과 현재값의 차이를 구하는 과정\n\n# 좌우 모터의 방향을 바꾸는 과정\n\n# 위 과정을 계속 수행하는 과정\n", solution: "# 센서 확인\n# 오차 계산\n# 방향 보정\n# 반복",
    recovered: "라인팔로잉 처리 순서", tests: [["첫 과정", "센서 확인"], ["중간 과정", "오차 계산 · 방향 보정"], ["마지막 과정", "반복"]],
  },
  {
    chapter: "1장 · 기억 모듈", title: "필요한 값을 기억하라", short: "속도, 기준값, Kp, Kd를 변수에 저장합니다.",
    story: "루미는 측정한 반사광과 제어 설정을 계속 잊어버립니다. 값마다 역할이 보이는 이름을 붙이면 상황이 바뀌어도 한 곳에서 다시 조절할 수 있습니다.",
    speech: "기본 속도는 앞으로 가는 힘, target은 경계의 기준, Kp는 현재 오차 반응, Kd는 흔들림 변화 반응이군요.",
    connection: "프롤로그에서 경계의 기준값을 구했죠. 이제 검정·흰색 측정값과 제어 설정에 이름을 붙여 다음 모든 단계에서 다시 사용해요.",
    conceptBrief: "base_speed는 직진의 기본 힘, target은 검정·흰색 반사광의 평균, kp는 현재 오차에 반응하는 정도, kd는 오차 변화에 반응하는 정도입니다.", activityKind: "memory",
    goal: "각 변수의 역할을 설명하고 상황에 맞는 값과 기준값 계산식을 선언합니다.", reason: "숫자의 역할을 이름으로 드러내고 센서·바닥·로봇이 달라질 때 필요한 값만 쉽게 조정하기 위해 필요합니다.",
    success: ["네 변수 역할 설명", "기준값 공식 작성", "선택한 값 검증"],
    question: "기준 센서값을 저장하기에 가장 알맞은 변수 이름은 무엇일까요?", options: ["target", "while", "def", "left_motor"], answer: 0,
    whyQuestion: "코드 곳곳에 0.8과 0.3을 직접 쓰지 않고 kp와 kd 변수로 만드는 가장 큰 이유는 무엇일까요?",
    whyOptions: ["역할을 알아보기 쉽고 한 곳에서 값을 조정할 수 있어서", "숫자는 파이썬에서 사용할 수 없어서", "변수를 쓰면 센서가 더 정확해져서", "모터가 변수 이름을 직접 읽기 때문에"], whyAnswer: 0,
    whyFeedback: "의미 있는 이름을 붙이면 숫자의 역할이 보이고, 나중에 튜닝할 때 한 곳만 바꾸면 됩니다.",
    conceptChecks: [
      {badge:"BASE SPEED",question:"base_speed가 의미하는 값은 무엇일까요?",options:["보정이 없을 때 두 모터가 앞으로 가는 기본 속도", "검정색 반사광", "이전 오차", "센서가 읽는 현재값"],answer:0,feedback:"base_speed는 좌우 모터 출력의 출발점입니다. 이후 보정값을 더하거나 빼 방향을 바꿉니다.",codeClue:"base_speed에는 수업 로봇에 안전한 1~100 사이 속도를 직접 선택해 저장해요."},
      {badge:"P GAIN",question:"kp를 크게 하면 가장 먼저 달라지는 것은 무엇일까요?",options:["현재 오차에 대한 보정 반응이 커진다", "기준값이 자동으로 바뀐다", "반복문이 느려진다", "센서가 흰색만 읽는다"],answer:0,feedback:"Kp는 현재 오차에 얼마나 민감하게 반응할지 정합니다. 너무 크면 빠르지만 지나치며 흔들릴 수 있어요.",codeClue:"kp는 0보다 큰 수로 시작하고 주행 결과를 보며 조절해요."},
      {badge:"D GAIN",question:"kd의 주된 역할은 무엇일까요?",options:["오차가 빠르게 변할 때 추가로 반응해 흔들림을 줄인다", "로봇의 기본 속도를 저장한다", "검정과 흰색의 평균을 구한다", "함수 이름을 만든다"],answer:0,feedback:"Kd는 현재 오차의 크기보다 오차가 변하는 속도에 반응합니다.",codeClue:"kd는 0 이상으로 선택할 수 있고, 0이면 P 제어만 사용하는 상태가 됩니다."},
    ],
    hint: "변수 이름은 값의 역할을 드러내야 합니다. 따라가려는 목표값을 뜻하는 이름을 찾아보세요.",
    codeTitle: "측정값과 제어 변수를 직접 선언하세요.", codeHint: "퀴즈에서 익힌 역할을 주석으로 확인하며 값을 선택하세요. target은 숫자를 외우지 말고 두 반사광의 평균식으로 작성합니다.",
    hintLevels: ["변수는 이름 = 값 형태로 선언하며 오른쪽에는 숫자나 계산식이 올 수 있어요.", "검정 반사광은 흰색보다 작아야 하고 target은 두 값 사이에 있어야 해요.", "target에는 black_value와 white_value를 더한 뒤 2로 나누는 식이 필요해요."],
    codeGuide: [["black_value = 20", "검정 바닥에서 측정한 반사광"], ["white_value = 80", "흰 바닥에서 측정한 반사광"], ["base_speed = 60", "직진할 때의 기본 속도"], ["target = (black_value + white_value) / 2", "경계를 판단하는 센서 기준값"], ["kp = 0.8", "현재 오차에 반응하는 힘"], ["kd = 0.3", "급격한 흔들림을 줄이는 힘"]],
    guidePatterns: ["black_value = 측정값", "white_value = 측정값", "base_speed = 안전한 속도", "target = (검정값 + 흰색값) / 2", "kp = P 조절값", "kd = D 조절값"],
    starter: "# 검정 바닥에서 측정한 반사광을 저장해요 (0~100)\nblack_value = \n\n# 흰 바닥에서 측정한 반사광을 저장해요 (검정보다 큰 값)\nwhite_value = \n\n# 보정이 없을 때의 기본 속도를 정해요 (1~100)\nbase_speed = \n\n# 검정과 흰색의 경계값을 평균식으로 계산해요\ntarget = \n\n# 현재 오차와 오차 변화에 반응할 정도를 정해요\nkp = \nkd = ", solution: "black_value = 20\nwhite_value = 80\nbase_speed = 60\ntarget = (black_value + white_value) / 2\nkp = 0.8\nkd = 0.3",
    recovered: "속도와 제어 변수", tests: [["반사광 측정", "검정 < 흰색"], ["기준값", "두 반사광의 평균"], ["기본 속도", "1~100"], ["제어 계수", "Kp > 0 · Kd ≥ 0"]],
  },
  {
    chapter: "2장 · 명령 모듈", title: "하나의 명령으로 묶어라", short: "line_follow 함수와 반복 구조를 정의합니다.",
    story: "값은 준비됐지만 루미에게는 실행할 명령이 없습니다. 모든 판단을 담을 하나의 함수 틀을 복구해야 합니다.",
    speech: "여러 명령이 아니라 line_follow라는 하나의 명령으로 움직이고 싶어요.",
    connection: "1장에서 만든 base_speed, target, kp, kd 네 값을 이번에는 line_follow 명령에 전달해 볼게요.",
    conceptBrief: "def는 함수를 시작하고, 괄호 안 매개변수는 함수가 사용할 값을 받습니다. 들여쓰기 된 명령만 함수에 포함되며 while True는 센서 읽기와 보정을 계속 반복합니다.", activityKind: "command",
    goal: "매개변수와 반복문을 포함한 line_follow 함수의 틀을 만듭니다.", reason: "라인을 따라가는 모든 과정을 하나의 재사용 가능한 명령으로 묶기 위해 필요합니다.",
    success: ["함수 구조 선택", "들여쓰기 작성", "센서 읽기 확인"],
    question: "함수를 정의할 때 사용하는 파이썬 키워드는 무엇일까요?", options: ["def", "return", "print", "import"], answer: 0,
    whyQuestion: "센서 확인과 보정을 line_follow라는 호출 가능한 함수로 묶으면 어떤 점이 좋을까요?",
    whyOptions: ["필요할 때 같은 동작을 한 번의 명령으로 실행하고 다시 사용할 수 있어서", "함수 안에서는 들여쓰기가 필요 없어서", "모든 프로그램은 함수가 하나만 있어야 해서", "함수로 만들면 반복문이 자동으로 사라져서"], whyAnswer: 0,
    whyFeedback: "함수는 여러 동작을 의미 있는 하나의 명령으로 묶습니다. 필요하면 내부를 보조 함수로 나누는 것도 가능합니다.",
    conceptChecks: [
      {badge:"INDENTATION",question:"파이썬에서 line_follow 함수 안에 포함되는 코드를 나타내는 방법은 무엇일까요?",options:["함수 선언보다 안쪽으로 들여쓴다", "모든 줄을 대문자로 쓴다", "줄 끝에 세미콜론을 쓴다", "코드를 따옴표로 감싼다"],answer:0,feedback:"파이썬은 중괄호 대신 들여쓰기로 함수와 반복문의 범위를 구분합니다.",codeClue:"함수 안은 4칸, while 안은 다시 4칸 더 들여써요."},
      {badge:"LIVE SENSOR",question:"sensor_value에 반사광을 한 번만 저장하지 않고 반복해서 갱신해야 하는 이유는 무엇일까요?",options:["로봇이 움직일 때 바닥의 반사광이 계속 달라지기 때문에", "변수는 한 번 저장하면 삭제되기 때문에", "센서는 함수 밖에서만 작동하기 때문에", "모터 속도를 항상 0으로 만들기 위해"],answer:0,feedback:"로봇이 이동하면 센서가 보는 바닥도 달라집니다. 반복할 때마다 최신 반사광을 읽어야 현재 위치를 판단할 수 있어요.",codeClue:"while True 안에서 sensor_value에 color_sensor.reflection() 결과를 저장해요."},
      {badge:"LOOP",question:"라인을 따라가는 동안 판단 과정을 계속 반복하는 파이썬 구조는 무엇일까요?",options:["while True:", "if False:", "return", "print()"],answer:0,feedback:"while True는 조건이 참인 동안 내부 코드를 반복합니다. 실제 로봇에서는 정지 조건과 안전장치를 함께 사용합니다.",codeClue:"while True: 다음 줄부터 센서 읽기 코드를 한 단계 더 들여써요."},
    ],
    hint: "새로운 함수의 시작을 알리는 두 글자 키워드를 찾아보세요.",
    codeTitle: "line_follow 함수의 틀을 완성하세요.", codeHint: "아래 이름은 다음 미션이 연결되는 약속입니다. 대소문자와 밑줄까지 설계도와 같게 입력해 주세요.",
    hintLevels: ["함수는 def로 시작하고 이름 뒤 괄호 안에 전달받을 값을 적어요.", "함수 안의 코드는 4칸, while 안의 코드는 8칸 들여써요.", "센서 읽기 명령의 반환값을 sensor_value라는 변수에 저장해야 해요."],
    codeGuide: [["def line_follow(base_speed, target, kp, kd):", "네 값을 전달받는 함수의 시작"], ["previous_error = 0", "아직 이전 오차가 없으므로 0에서 시작"], ["while True:", "센서 확인과 보정을 계속 반복"], ["color_sensor.reflection()", "센서의 반사광 값을 읽는 명령"]],
    guidePatterns: ["def 함수이름(전달값):", "previous_error = 시작값", "while 반복조건:", "sensor_value = 센서 읽기"],
    starter: "# 네 설정값을 전달받는 line_follow 함수를 정의해요\n\n# 함수 안에서 이전 오차를 0으로 준비해요\n\n# 센서 확인과 보정을 계속 반복해요\n\n# 반복문 안에서 현재 반사광을 sensor_value에 저장해요\n",
    solution: "def line_follow(base_speed, target, kp, kd):\n    previous_error = 0\n\n    while True:\n        sensor_value = color_sensor.reflection()",
    recovered: "함수와 반복 구조", tests: [["함수 이름", "line_follow"], ["이전 오차", "0"], ["센서 읽기", "reflection()"]],
  },
  {
    chapter: "3장 · 판단 모듈", title: "현재 오차에 반응하라", short: "오차를 계산하고 P 제어값을 만듭니다.",
    story: "루미는 센서값을 읽지만 기준에서 얼마나 벗어났는지 알 수 없습니다. 현재 상태에 알맞은 반응 크기를 계산해야 합니다.",
    speech: "조금 벗어났을 때와 많이 벗어났을 때 똑같이 반응하면 안 될 것 같아요.",
    connection: "1장의 target과 2장에서 읽은 sensor_value를 비교하면 지금 얼마나 벗어났는지 알 수 있어요.",
    conceptBrief: "PD 제어는 경계에서 생긴 오차를 모터 보정값으로 바꾸는 방법입니다. P는 지금 오차가 클수록 크게 반응하고, D는 다음 장에서 오차가 변하는 속도를 살핍니다.", activityKind: "calibration",
    goal: "현재 오차를 계산하고 kp를 곱해 P 제어값을 만듭니다.", reason: "기준에서 멀리 벗어날수록 더 크게 방향을 보정하기 위해 필요합니다.",
    success: ["오차 부호 판단", "P 계산식 작성", "3개 입력 검사"],
    question: "target이 50이고 sensor_value가 40이라면 error는 얼마일까요?", options: ["10", "-10", "40", "90"], answer: 0,
    whyQuestion: "P 제어에서 error에 kp를 곱하는 이유는 무엇일까요?",
    whyOptions: ["오차가 클수록 더 크게, 작을수록 더 작게 반응하기 위해", "오차의 부호를 항상 양수로 만들기 위해", "센서값을 기준값으로 바꾸기 위해", "반복문을 종료하기 위해"], whyAnswer: 0,
    whyFeedback: "kp는 현재 오차에 얼마나 민감하게 반응할지 정합니다. 같은 kp라면 큰 오차가 더 큰 보정을 만듭니다.",
    conceptChecks: [
      {badge:"WHY PD",question:"라인에서 이탈하거나 오차가 생겼을 때 PD 제어가 필요한 이유는 무엇일까요?",options:["오차의 크기와 변화를 보정값으로 바꿔 다시 경계로 돌아오기 위해", "센서값을 무조건 0으로 만들기 위해", "모터를 같은 속도로만 움직이기 위해", "검정색 영역의 중앙으로 들어가기 위해"],answer:0,feedback:"PD 제어는 기준과 현재 센서값의 차이를 이용해 로봇이 경계로 돌아갈 방향과 반응 크기를 정합니다.",codeClue:"먼저 error에 기준값 target과 현재값 sensor_value의 차이를 저장해요."},
      {badge:"ERROR SIGN",question:"error = target - sensor_value일 때 센서값이 target보다 크면 error의 부호는 어떻게 될까요?",options:["음수", "양수", "항상 0", "계산할 수 없음"],answer:0,feedback:"현재 센서값이 기준보다 크면 target - sensor_value는 음수가 됩니다. 이 부호가 보정 방향을 구분합니다.",codeClue:"뺄셈 순서를 바꾸면 모터가 회전하는 방향도 반대로 바뀔 수 있어요."},
      {badge:"P RESPONSE",question:"같은 kp에서 error가 5에서 10으로 커지면 p_control은 어떻게 될까요?",options:["두 배로 커진다", "절반으로 줄어든다", "변하지 않는다", "항상 음수가 된다"],answer:0,feedback:"P는 비례 제어입니다. 같은 Kp에서는 오차가 두 배가 되면 P 보정도 두 배가 됩니다.",codeClue:"p_control에는 kp와 error를 곱한 결과를 저장해요."},
    ],
    hint: "error = target - sensor_value 순서로 50에서 40을 빼 보세요.",
    codeTitle: "오차와 P 제어 코드를 작성하세요.", codeHint: "설계도에 있는 변수 이름은 앞 단계와 연결됩니다. 식의 왼쪽과 오른쪽을 그대로 확인해 보세요.",
    hintLevels: ["오차는 목표값과 현재값의 차이이며 뺄셈 순서가 방향을 결정해요.", "P는 proportional의 약자로 현재 오차에 비례해요.", "p_control의 오른쪽에는 P 계수와 현재 오차가 모두 필요해요."],
    codeGuide: [["error = target - sensor_value", "목표값에서 현재 센서값을 빼요."], ["p_control = kp * error", "현재 오차에 Kp를 곱해 반응 크기를 정해요."]],
    guidePatterns: ["error = 기준값 - 현재 센서값", "p_control = P 계수 × 현재 오차"],
    starter: "# 경계 기준값과 현재 반사광의 차이를 error에 저장해요\n\n# 현재 오차에 Kp를 적용해 P 보정값을 만들어요\n", solution: "error = target - sensor_value\np_control = kp * error",
    recovered: "오차와 P 제어", tests: [["센서 40", "error 10"], ["센서 50", "error 0"], ["센서 65", "error -15"]],
  },
  {
    chapter: "4장 · 균형 모듈", title: "오차의 변화를 읽어라", short: "이전 오차와 비교해 D 제어값을 만듭니다.",
    story: "P 제어를 복구했지만 오차가 10, -8, 7, -6으로 빠르게 바뀝니다. 루미가 변화의 속도를 읽지 못해 흔들리고 있습니다.",
    speech: "지금 얼마나 벗어났는지는 알아요. 하지만 오차가 얼마나 빠르게 바뀌는지도 알고 싶어요.",
    connection: "3장에서 만든 error를 직전 반복의 previous_error와 비교해 흔들림의 변화를 읽어 볼게요.",
    conceptBrief: "현재 오차 하나만 보면 지금 얼마나 벗어났는지만 알 수 있습니다. 현재 오차에서 이전 오차를 빼면 변화량을 알 수 있고, D는 이 변화가 클수록 추가로 반응합니다.", activityKind: "wave",
    goal: "현재 오차와 이전 오차의 차이를 구하고 D 제어값을 계산합니다.", reason: "오차가 급격하게 변하는 상황에 대응하고 흔들림을 줄이기 위해 필요합니다.",
    success: ["변화량 이해", "D 계산식 작성", "이전값 비교 검사"],
    question: "현재 error가 8이고 previous_error가 3이라면 change는 얼마일까요?", options: ["5", "11", "-5", "24"], answer: 0,
    whyQuestion: "D 제어가 라인 주행의 흔들림을 줄이는 데 도움을 주는 이유는 무엇일까요?",
    whyOptions: ["오차가 빠르게 변할 때 그 변화를 감지해 추가로 대응하기 때문에", "항상 모터 출력을 0으로 만들기 때문에", "현재 오차를 무시하고 속도만 높이기 때문에", "센서값을 일정하게 고정하기 때문에"], whyAnswer: 0,
    whyFeedback: "D 제어는 현재 위치만 보지 않고 오차가 얼마나 빠르게 변하는지도 봅니다. 급격한 방향 변화를 일찍 감지할 수 있어요.",
    conceptChecks: [
      {badge:"TWO ERRORS",question:"현재 오차와 이전 오차를 모두 기억해야 하는 이유는 무엇일까요?",options:["두 값의 차이로 오차가 얼마나 변했는지 구하기 위해", "두 오차를 항상 같은 값으로 만들기 위해", "기본 속도를 두 배로 만들기 위해", "센서 읽기를 멈추기 위해"],answer:0,feedback:"현재값과 직전값이 있어야 시간에 따른 변화량을 계산할 수 있습니다.",codeClue:"change는 현재 error에서 previous_error를 뺀 값이에요."},
      {badge:"D RESPONSE",question:"change의 절댓값이 클다는 것은 어떤 뜻일까요?",options:["오차가 짧은 시간에 빠르게 변하고 있다", "로봇이 반드시 정지했다", "기준값이 잘못 저장됐다", "현재 오차가 항상 0이다"],answer:0,feedback:"변화량이 크면 로봇이 경계를 빠르게 지나치거나 방향을 급하게 바꾸는 중일 수 있습니다.",codeClue:"d_control은 변화량 change에 kd를 곱해 만들어요."},
      {badge:"UPDATE TIMING",question:"previous_error = error는 언제 실행해야 할까요?",options:["현재 반복의 P와 D 계산을 모두 마친 뒤", "현재 error를 계산하기 전", "함수를 정의하기 전", "센서를 읽지 않을 때만"],answer:0,feedback:"D 계산이 끝난 뒤 현재 오차를 저장해야 다음 반복에서 ‘이전 오차’로 사용할 수 있습니다.",codeClue:"이번 장에서는 두 오차를 비교하고, 최종장에서 계산이 끝난 뒤 previous_error를 갱신해요."},
    ],
    hint: "change는 현재 오차에서 이전 오차를 뺀 값입니다. 8 - 3을 계산해 보세요.",
    codeTitle: "변화량과 D 제어 코드를 작성하세요.", codeHint: "현재 오차와 직전 오차를 먼저 비교한 다음, 변화량에 Kd를 곱합니다.",
    hintLevels: ["변화량은 현재 오차와 직전 오차의 차이예요.", "뺄셈의 앞에는 현재값, 뒤에는 이전값이 와요.", "D 제어값에는 D 계수와 방금 구한 변화량이 모두 필요해요."],
    codeGuide: [["change = error - previous_error", "현재 오차가 직전보다 얼마나 변했는지 계산"], ["d_control = kd * change", "변화가 클수록 더 빠르게 균형을 잡아요."]],
    guidePatterns: ["change = 현재 오차 - 이전 오차", "d_control = D 계수 × 변화량"],
    starter: "# 현재 오차와 직전 오차의 차이를 change에 저장해요\n\n# 오차 변화량에 Kd를 적용해 D 보정값을 만들어요\n", solution: "change = error - previous_error\nd_control = kd * change",
    recovered: "변화량과 D 제어", tests: [["8과 3 비교", "change 5"], ["-2와 4 비교", "change -6"], ["변화 없음", "change 0"]],
  },
  {
    chapter: "최종장 · 중앙 코어", title: "라인팔로잉을 완성하라", short: "P와 D를 결합하고 좌우 출력을 결정합니다.",
    story: "모든 판단 모듈이 복구됐습니다. 보정값을 좌우 출력에 반대로 적용하고 다음 반복을 위해 오차를 기억하면 됩니다.",
    speech: "지금까지 만든 코드를 하나로 연결해 주세요. 그러면 line_follow 명령이 다시 완성돼요.",
    connection: "P의 현재 반응과 D의 변화 반응이 준비됐어요. 두 값을 합쳐 실제 좌우 모터의 속도로 연결합시다.",
    conceptBrief: "correction은 P와 D의 합입니다. 한쪽 모터에 더하고 다른 쪽에서 빼면 두 바퀴의 속도 차이로 회전이 생깁니다. 계산이 끝나면 현재 error를 저장해 다음 반복의 previous_error로 사용합니다.", activityKind: "motors",
    goal: "P와 D를 결합해 좌우 출력을 만들고 previous_error를 갱신합니다.", reason: "계산한 보정값을 실제 방향 변화로 연결하고 다음 계산을 준비하기 위해 필요합니다.",
    success: ["PD 결합", "좌우 출력 작성", "최종 검사 통과"],
    question: "한쪽 출력에 correction을 더했다면 반대쪽 출력에는 어떻게 해야 할까요?", options: ["correction을 뺀다", "같이 더한다", "항상 0으로 만든다", "previous_error를 더한다"], answer: 0,
    whyQuestion: "kp만 사용하고 kd를 0으로 만들면 로봇은 어떤 움직임을 보이기 쉬울까요?",
    whyOptions: ["현재 오차에는 반응하지만 선을 중심으로 좌우 흔들림이 커질 수 있다", "센서를 전혀 읽지 못한다", "항상 완벽한 직선으로만 달린다", "두 모터가 자동으로 멈춘다"], whyAnswer: 0,
    whyFeedback: "P만으로도 선을 향해 움직이지만 빠른 변화를 다듬지 못해 좌우로 지나치며 흔들릴 수 있습니다.",
    conceptChecks: [
      {badge:"PD COMBINE",question:"최종 보정값 correction은 어떻게 만들까요?",options:["p_control + d_control", "p_control - base_speed", "target + sensor_value", "previous_error + base_speed"],answer:0,feedback:"P의 현재 오차 반응과 D의 변화 반응을 더해 하나의 보정값으로 사용합니다.",codeClue:"correction에 p_control과 d_control의 합을 저장해요."},
      {badge:"TURN DIRECTION",question:"왼쪽 모터가 70, 오른쪽 모터가 50으로 움직이면 로봇은 어느 쪽으로 회전할까요?",options:["오른쪽", "왼쪽", "회전하지 않는다", "뒤로만 간다"],answer:0,feedback:"왼쪽 바퀴가 더 빠르면 로봇의 왼쪽이 더 멀리 나아가 몸체가 오른쪽으로 회전합니다.",codeClue:"양수 correction을 왼쪽에 더하고 오른쪽에서 빼면 오른쪽 회전이 생겨요."},
      {badge:"NEXT LOOP",question:"현재 반복이 끝난 뒤 error를 previous_error에 저장하는 이유는 무엇일까요?",options:["다음 반복에서 오차 변화량을 계산하기 위해", "기준값을 지우기 위해", "두 모터를 같은 속도로 만들기 위해", "while 반복을 종료하기 위해"],answer:0,feedback:"이번 error는 다음 반복에서 직전 error가 됩니다. 그래야 새로운 change를 계산할 수 있어요.",codeClue:"모터 출력까지 계산한 마지막에 previous_error = error를 작성해요."},
    ],
    hint: "방향을 바꾸려면 좌우 출력에 서로 반대되는 보정이 적용되어야 합니다.",
    codeTitle: "line_follow 함수의 마지막 부분을 완성하세요.", codeHint: "보정값을 좌우 출력에 반대로 적용한 뒤, 이번 오차를 다음 반복을 위해 저장합니다.",
    hintLevels: ["P와 D의 반응을 하나의 correction으로 합쳐요.", "방향을 바꾸려면 좌우 모터 출력 사이에 속도 차이가 필요해요.", "현재 반복의 모든 계산이 끝난 뒤 error를 다음 반복을 위해 기억해요."],
    codeGuide: [["correction = p_control + d_control", "P와 D 반응을 하나의 보정값으로 합쳐요."], ["left_power = base_speed + correction", "왼쪽 출력에는 보정값을 더해요."], ["right_power = base_speed - correction", "오른쪽 출력에는 보정값을 빼요."], ["previous_error = error", "이번 오차를 다음 반복의 이전 오차로 저장"]],
    guidePatterns: ["correction = P 반응 + D 반응", "left_power = 기본 속도 + 보정값", "right_power = 기본 속도 - 보정값", "previous_error = 현재 오차"],
    starter: "# P와 D의 반응을 correction으로 합쳐요\n\n# 같은 보정값을 좌우 기본 속도에 반대 부호로 적용해요\n\n# 계산한 출력을 실제 좌우 모터에 전달해요\nleft_motor.dc(left_power)\nright_motor.dc(right_power)\n\n# 이번 오차를 다음 반복의 이전 오차로 저장해요\n",
    solution: "correction = p_control + d_control\nleft_power = base_speed + correction\nright_power = base_speed - correction\n\nleft_motor.dc(left_power)\nright_motor.dc(right_power)\n\nprevious_error = error",
    recovered: "완성된 line_follow 함수", tests: [["PD 결합", "P + D"], ["왼쪽 출력", "속도 + 보정"], ["오른쪽 출력", "속도 - 보정"]],
  },
];

type ValidationResult = { passed: boolean; missing: string[] };

function expressionValue(expression: string, variables: Record<string, number>): number | null {
  const tokens = expression.match(/\d+(?:\.\d+)?|[A-Za-z_]\w*|[()+\-*/]/g);
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
    while(parsedTokens[cursor]==="*"||parsedTokens[cursor]==="/"){
      const operator=parsedTokens[cursor++];
      const right=parsePrimary();
      if(value===null||right===null)return null;
      if(operator==="/"&&right===0)return null;
      value=operator==="*"?value*right:value/right;
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
  if(id===0){
    const expected=["센서 확인","오차 계산","방향 보정","반복"];
    const comments=code.split("\n").map((line)=>line.match(/^\s*#\s*(.+?)\s*$/)?.[1]??"").filter(Boolean);
    const positions=expected.map((label)=>comments.findIndex((comment)=>comment===label));
    const inOrder=positions.every((position,index)=>position>=0&&(index===0||position>positions[index-1]));
    const missing=inOrder?[]:[attempt>1?"센서 확인 → 오차 계산 → 방향 보정 → 반복 순서로 네 역할 주석을 추가해 보세요.":"가이드 주석 아래에 네 처리 역할을 순서대로 직접 작성해 보세요."];
    return {passed:missing.length===0,missing};
  }

  if(id===1){
    const value=(name:string,variables:Record<string,number>={})=>{
      const expression=assignmentExpression(executable,name);
      return expression?expressionValue(expression,variables):null;
    };
    const black=value("black_value");
    const white=value("white_value");
    const baseSpeed=value("base_speed");
    const kp=value("kp");
    const kd=value("kd");
    const targetExpression=assignmentExpression(executable,"target");
    const sensorValues=black!==null&&white!==null?{black_value:black,white_value:white}:{};
    const target=targetExpression?expressionValue(targetExpression,sensorValues):null;
    const usesMeasurements=Boolean(targetExpression&&/\bblack_value\b/.test(targetExpression)&&/\bwhite_value\b/.test(targetExpression));
    const missing:string[]=[];
    if(black===null||white===null)missing.push("반사광 측정: black_value와 white_value에 0~100 사이 측정값을 저장해 보세요.");
    else if(black<0||white>100||black>=white)missing.push("반사광 측정: 검정값은 흰색값보다 작아야 하며 두 값 모두 0~100 범위여야 해요.");
    if(baseSpeed===null||baseSpeed<=0||baseSpeed>100)missing.push("기본 속도: base_speed에 로봇이 안전하게 움직일 1~100 사이 값을 선택해 보세요.");
    if(target===null||black===null||white===null||!usesMeasurements||Math.abs(target-(black+white)/2)>1e-8)missing.push("센서 기준값: target을 black_value와 white_value의 평균을 구하는 식으로 작성해 보세요.");
    if(kp===null||kp<=0||kp>3)missing.push("P 계수: kp에는 0보다 크고 3 이하인 조절값을 선택해 보세요.");
    if(kd===null||kd<0||kd>2)missing.push("D 계수: kd에는 0 이상 2 이하인 조절값을 선택해 보세요.");
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
  const expression=assignmentExpression(code,name);
  const value=expression?expressionValue(expression,{}):null;
  return value!==null&&Number.isFinite(value)?value:fallback;
}

function testResultsFor(id:number,code:string,fallback:Array<[string,string]>):Array<[string,string]>{
  if(id!==1)return fallback;
  const read=(name:string,variables:Record<string,number>={})=>{
    const expression=assignmentExpression(code,name);
    return expression?expressionValue(expression,variables):null;
  };
  const black=read("black_value");
  const white=read("white_value");
  const baseSpeed=read("base_speed");
  const kp=read("kp");
  const kd=read("kd");
  const target=black!==null&&white!==null?read("target",{black_value:black,white_value:white}):null;
  const show=(value:number|null)=>value===null?"확인 필요":Number(value.toFixed(2)).toString();
  return [
    ["내 반사광",`검정 ${show(black)} · 흰색 ${show(white)}`],
    ["내 기준값",`${show(target)} · 두 반사광의 평균`],
    ["내 기본 속도",show(baseSpeed)],
    ["내 제어 계수",`Kp ${show(kp)} · Kd ${show(kd)}`],
  ];
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
  const tone=(context:AudioContext,frequency:number,start:number,duration:number,volume:number,type:OscillatorType="sine",output:AudioNode=context.destination)=>{
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.018);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(gain);gain.connect(output);oscillator.start(start);oscillator.stop(start+duration+.03);
  };
  const play=(cue:SoundCue)=>{
    if(!enabled)return;
    const context=activate();
    const now=context.currentTime;
    if(cue==="type"){tone(context,520,now,.04,.018,"square");return;}
    if(cue==="click"){tone(context,360,now,.07,.025,"triangle");tone(context,520,now+.04,.09,.018,"triangle");return;}
    if(cue==="wrong"){tone(context,190,now,.15,.035,"sawtooth");tone(context,145,now+.11,.2,.025,"sawtooth");return;}
    const notes=cue==="clear"?[392,523.25,659.25,783.99]:[440,554.37,659.25];
    notes.forEach((note,index)=>tone(context,note,now+index*.085,cue==="clear"?.55:.3,cue==="clear"?.045:.03,"triangle"));
  };
  useEffect(()=>{
    const context=contextRef.current;
    if(!ready||!context)return;
    if(!enabled){void context.suspend();return;}
    let cancelled=false;
    const bgmBus=context.createGain();
    const busStart=context.currentTime;
    bgmBus.gain.setValueAtTime(.0001,busStart);
    bgmBus.gain.linearRampToValueAtTime(1,busStart+.32);
    bgmBus.connect(context.destination);
    void context.resume();
    const ambient=()=>{
      if(cancelled)return;
      const start=context.currentTime+.04;
      [261.63,293.66,329.63,392,329.63,293.66,246.94,293.66].forEach((note,index)=>{
        const noteStart=start+index*1.02;
        tone(context,note,noteStart,1.26,.032,"sine",bgmBus);
        tone(context,note/2,noteStart,1.3,.011,"triangle",bgmBus);
        if(index%2===0)tone(context,note*2,noteStart+.12,.82,.006,"sine",bgmBus);
      });
    };
    ambient();
    const timer=window.setInterval(ambient,8160);
    return ()=>{
      cancelled=true;
      window.clearInterval(timer);
      const stopAt=context.currentTime;
      bgmBus.gain.cancelScheduledValues(stopAt);
      bgmBus.gain.setValueAtTime(Math.max(.0001,bgmBus.gain.value),stopAt);
      bgmBus.gain.linearRampToValueAtTime(.0001,stopAt+.12);
      window.setTimeout(()=>bgmBus.disconnect(),150);
    };
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
  const [questionRound,setQuestionRound] = useState(0);
  const [choice,setChoice] = useState<number|null>(null);
  const [checked,setChecked] = useState(false);
  const [code,setCode] = useState(missions[0].starter);
  const [passed,setPassed] = useState(false);
  const [showClear,setShowClear] = useState(false);
  const [validationIssues,setValidationIssues] = useState<string[]>([]);
  const [attempts,setAttempts] = useState(0);
  const [hintLevel,setHintLevel] = useState(0);
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
  const [writingMode,setWritingMode] = useState<"guided"|"free">("guided");
  const [showLearningReview,setShowLearningReview] = useState(false);
  const audio=useGameAudio(soundOn);
  const mission = missions[active];
  const learningChecks=learningChecksFor(mission);
  const dialogue = [
    mission.connection,
    mission.speech,
    mission.conceptBrief,
    mission.story,
    `${name} 엔지니어님, 이번 임무에서 할 일은 다음과 같아요. ${mission.goal} 준비되면 퀘스트 내용을 확인해 주세요.`,
  ];
  const currentCheck=learningChecks[Math.min(questionRound,learningChecks.length-1)];
  const currentQuestion=currentCheck.question;
  const rawOptions=currentCheck.options;
  const rawAnswer=currentCheck.answer;
  const optionShift=(active*2+questionRound+1)%rawOptions.length;
  const currentOptions=[...rawOptions.slice(optionShift),...rawOptions.slice(0,optionShift)];
  const currentAnswer=(rawAnswer-optionShift+rawOptions.length)%rawOptions.length;
  const nextMission = missions.findIndex((_,i)=>!completed.includes(i));
  const stageNames = ["임무 확인","개념 학습","코드 작성","테스트"];
  const activityCopy={
    route:["ROUTE NAVIGATION","복구 경로를 연결해 주세요"],memory:["MEMORY CALIBRATION","기억 모듈을 설정해 주세요"],command:["COMMAND ASSEMBLY","명령 모듈을 조립해 주세요"],calibration:["SENSOR CALIBRATION","판단 회로를 보정해 주세요"],wave:["SIGNAL ANALYSIS","오차 파형을 분석해 주세요"],motors:["MOTOR LINK","좌우 출력을 연결해 주세요"],
  }[mission.activityKind];
  const finalProgram=useMemo(()=>buildStudentProgram(studentCodes),[studentCodes]);
  const testRows=testResultsFor(active,code,mission.tests);
  const studentKp=numberFromCode(studentCodes[1],"kp",.8);
  const studentKd=numberFromCode(studentCodes[1],"kd",.3);

  useEffect(()=>{
    const restoreSession = window.setTimeout(()=>{
      const savedName = localStorage.getItem("linecore-name");
      const storageVersion = localStorage.getItem("linecore-learning-version");
      const savedProgress = localStorage.getItem("linecore-progress");
      const savedCodes = localStorage.getItem("linecore-codes");
      const savedAssist = localStorage.getItem("linecore-assist");
      const savedSound = localStorage.getItem("linecore-sound");
      if(savedName) setName(savedName);
      if(storageVersion!=="2"){
        localStorage.removeItem("linecore-progress");
        localStorage.removeItem("linecore-codes");
        localStorage.removeItem("linecore-assist");
        localStorage.setItem("linecore-learning-version","2");
        if(savedSound!==null)setSoundOn(savedSound==="on");
        return;
      }
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
    setCompleted([]);localStorage.setItem("linecore-learning-version","2");localStorage.setItem("linecore-progress","[]");persistLearning(nextCodes,nextAssist);
    return {nextCodes,nextAssist};
  }
  function openMission(id:number,codes=studentCodes,assists=assistHistory){
    const assist=assists[id]??{hintLevel:0,usedSolution:false,attempts:0};
    const savedCode=codes[id]||missions[id].starter;
    setActive(id);setStep(0);setQuestionRound(0);setChoice(null);setChecked(false);setCode(savedCode);setPassed(false);setShowClear(false);setShowLearningReview(false);setValidationIssues([]);setAttempts(assist.attempts);setHintLevel(assist.hintLevel);setWritingMode(savedCode.includes("#")?"guided":"free");setDialogueIndex(0);setDialogueDone(false);setDialogueInstant(false);setBriefingReady(false);setScreen("mission");
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
  function changeWritingMode(next:"guided"|"free"){
    if(next===writingMode)return;
    const hasStudentWork=code.trim()&&code.trim()!==mission.starter.trim();
    if(hasStudentWork&&!window.confirm("작성 중인 코드를 지우고 입력 모드를 바꿀까요?"))return;
    audio.play("click");setWritingMode(next);setCode(next==="guided"?mission.starter:"");
  }
  function runCode(){
    const nextAttempt=attempts+1;
    const result=validate(active,code,nextAttempt);
    const nextCodes=studentCodes.map((item,index)=>index===active?code:item);
    const nextAssist=assistHistory.map((item,index)=>index===active?{...item,hintLevel,usedSolution:false,attempts:nextAttempt}:item);
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
    <button className="soundToggle titleSound" onClick={toggleSound} aria-pressed={soundOn} title="차분한 BGM과 타이핑 효과음"><Icon name={soundOn?"sound":"mute"} size={17}/><span>{soundOn?"BGM + 효과음 ON":"BGM + 효과음 OFF"}</span></button>
    <div className="titleModules"><span>VARIABLE</span><i/><span>FUNCTION</span><i/><span>P CONTROL</span><i/><span>D CONTROL</span></div>
  </main>{loading}</>;

  if(screen==="login") return <><main className="loginGame" aria-hidden={Boolean(loadingMessage)} inert={Boolean(loadingMessage)}>
    <button className="backTitle" onClick={()=>setScreen("title")}><Icon name="arrow" size={17}/> 타이틀로</button>
    <button className="soundToggle loginSound" onClick={toggleSound} aria-pressed={soundOn} title="차분한 BGM과 타이핑 효과음"><Icon name={soundOn?"sound":"mute"} size={17}/><span>{soundOn?"BGM + 효과음 ON":"BGM + 효과음 OFF"}</span></button>
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
    <button className="soundToggle endingSound" onClick={toggleSound} aria-pressed={soundOn} title="차분한 BGM과 타이핑 효과음"><Icon name={soundOn?"sound":"mute"} size={17}/><span>{soundOn?"BGM + 효과음 ON":"BGM + 효과음 OFF"}</span></button>
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
    <header className="gameHud" aria-hidden={showClear} inert={showClear}><img src="/assets/playwell-logo.png" alt="Playwell"/><div className="chapterInfo"><small>{mission.chapter}</small><b>{mission.title}</b></div><div className="chapterProgress"><span>CORE {active+1} / {missions.length}</span><div>{missions.map((_,i)=><i className={i<active?"done":i===active?"active":""} key={i}/>)}</div></div><div className="stageProgress"><small>{stageNames[step]}</small><div>{stageNames.map((s,i)=><i className={i<step?"done":i===step?"active":""} title={s} key={s}/>)}</div></div><div className="hudActions"><button className="soundToggle" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn?"BGM과 효과음 끄기":"BGM과 효과음 켜기"}><Icon name={soundOn?"sound":"mute"} size={16}/></button><button className="exitGame" onClick={()=>transition(()=>setScreen("title"),"게임을 안전하게 저장하는 중",500)}>게임 종료</button></div></header>
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
            <div><small>CONCEPT CHECK {questionRound+1} / {learningChecks.length}</small><b>{checked?(choice===currentAnswer?"CORE STABLE":"CHECK AGAIN"):choice!==null?"ANSWER LOCKED":"SCANNING"}</b></div>
          </div>
        </div>
        <div className="routeConsole">
          <div className="questionRounds" aria-label={`개념 문제 ${questionRound+1} / ${learningChecks.length}`}>{learningChecks.map((check,index)=><i className={index<=questionRound?"active":""} key={`${check.badge}-${index}`}>{index+1}</i>)}<b>{currentCheck.badge}</b></div>
          <div className="routePrompt"><span><Icon name={questionRound===0?"target":"brain"} size={23}/></span><div><small>{currentCheck.badge}</small><h2>{currentQuestion}</h2></div></div>
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
                {mission.activityKind==="route"&&option.includes(" → ")?<span className="routePath">{option.split(" → ").map((part,j)=><span className="routeNode" key={`${part}-${j}`}><b>{part}</b></span>)}</span>:<span className="conceptChoice"><i aria-hidden="true">{String.fromCharCode(65+i)}</i><b>{option}</b></span>}
              </button>;
            })}
          </div>
          <div className={`routeOutcome ${checked?(choice===currentAnswer?"success":"error"):"pending"}`} aria-live="polite">
            <span className="routeOutcomeIcon"><Icon name={checked?(choice===currentAnswer?"check":"terminal"):questionRound===0?"target":"brain"} size={20}/></span>
            <div><b>{checked?(choice===currentAnswer?questionRound===learningChecks.length-1?"코드 작성 준비 완료":`${questionRound+1}번째 개념 확인 완료`:"한 번 더 생각해 볼까요?"):choice!==null?"선택한 답을 확정하세요":"분석 입력 대기 중"}</b><p>{checked?(choice===currentAnswer?currentCheck.feedback:"루미의 설명에서 각 값의 역할과 실제 움직임을 다시 떠올려 보세요."):choice!==null?"선택한 이유를 마음속으로 설명해 보세요.":"정답을 고르기 전에 루미의 질문을 천천히 읽어 보세요."}</p></div>
          </div>
          <div className="routeActions">
            <button className="routeBack" onClick={()=>goToStep(0,"미션 브리핑으로 돌아가는 중")}>임무 확인</button>
            <button className={`routeConfirm ${checked&&choice===currentAnswer?"success":""}`} disabled={choice===null} onClick={checked&&choice===currentAnswer?questionRound<learningChecks.length-1?()=>{audio.play("correct");setQuestionRound((value)=>value+1);setChoice(null);setChecked(false)}:()=>goToStep(2,"복구 코드 편집기를 여는 중",true):checked?()=>{audio.play("click");setChoice(null);setChecked(false)}:()=>{setChecked(true);audio.play(choice===currentAnswer?"correct":"wrong")}}>
              <span><Icon name={checked&&choice===currentAnswer?questionRound<learningChecks.length-1?"brain":"code":"target"} size={18}/></span>{checked?(choice===currentAnswer?questionRound<learningChecks.length-1?"다음 개념":"코드로 구현":"다시 선택"):"답 확정"}<Icon name="arrow" size={20}/>
            </button>
          </div>
        </div>
      </section>}
      {step===2&&<section className="stagePanel codeStage" aria-hidden={showLearningReview} inert={showLearningReview}>
        <ActivityHead icon="code" label="STEP 3 · 코드 작성" title={mission.codeTitle} text={mission.codeHint}/>
        <section className="learningReason"><span><Icon name="brain" size={19}/></span><div><small>WHY THIS CODE?</small><b>왜 이 코드를 작성할까요?</b><p>{mission.reason}</p></div></section>
        {active>0&&<div className="coreAssemblyStrip" aria-label="지금까지 복구한 코드 모듈"><small>RECOVERED CORE</small>{missions.slice(1,active+1).map((item,index)=><span key={item.recovered}><Icon name="check" size={12}/>{index+1} · {item.recovered}</span>)}<i/><b>NOW · {mission.recovered}</b></div>}
        <section className="codeBlueprint" aria-label="이번 미션의 복구 설계도">
          <div className="blueprintTitle"><Icon name="book" size={18}/><span><small>ROLE BLUEPRINT</small><b>코드 역할 설계도</b></span><em>정답이 아닌 작성 패턴</em></div>
          <div className="blueprintItems">{mission.codeGuide.map(([snippet,role],index)=><article className="patternGuide" key={snippet}><small>CORE {String(index+1).padStart(2,"0")}</small><p>{role}</p><code>{mission.guidePatterns[index]}</code></article>)}</div>
        </section>
        <section className={`hintDock level${hintLevel}`} aria-live="polite">
          <div><span><Icon name="light" size={17}/></span><div><small>PROGRESSIVE HINT · {hintLevel} / 3</small><b>{hintLevel===0?"막히면 작은 단서부터 열어 보세요":hintLevel===3?"전체 설계도가 열렸어요":`${hintLevel}단계 단서를 사용 중이에요`}</b></div></div>
          {hintLevel>0&&<ol>{mission.hintLevels.slice(0,hintLevel).map((hint,index)=><li key={hint}><i>{index+1}</i><span>{hint}</span></li>)}</ol>}
          {hintLevel<3&&<button onClick={revealHint}><Icon name="light" size={14}/>{hintLevel+1}단계 힌트 열기</button>}
        </section>
        <div className="editor">
          <div className="editorTop"><span/><span/><span/><b>mission_{active+1}.py</b><em className={`writingBadge ${writingMode}`}><Icon name={writingMode==="guided"?"book":"code"} size={12}/>{writingMode==="guided"?"주석 가이드 모드":"자유 작성 모드"}</em><div className="editorTools"><button className={writingMode==="guided"?"active":""} onClick={()=>changeWritingMode("guided")}><Icon name="book" size={14}/> 주석 가이드</button><button className={writingMode==="free"?"active":""} onClick={()=>changeWritingMode("free")}><Icon name="code" size={14}/> 빈 화면 도전</button></div></div>
          <div><pre>{Array.from({length:Math.max(8,code.split("\n").length)},(_,i)=>`${i+1}\n`)}</pre><textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} aria-label="파이썬 코드 작성"/></div>
        </div>
        <Actions back={()=>{audio.play("click");setShowLearningReview(true)}} backLabel="배운 개념 다시보기" next={runCode} nextLabel="코드 검사하기"/>
      </section>}
      {showLearningReview&&<LearningReview mission={mission} checks={learningChecks} onClose={()=>{audio.play("click");setShowLearningReview(false)}}/>}
      {step===3&&<section className={`stagePanel testStage ${passed?"testPassed":""}`}><div className="testContent" aria-hidden={showClear} inert={showClear}><ActivityHead icon="terminal" label="STEP 4 · 코드 검사" title="코드가 의도대로 작동하는지 확인해요" text="하나의 정답 숫자가 아니라 선택한 값의 범위와 여러 입력에서의 계산 결과를 확인합니다."/>{passed?<div className="testCard"><div className="testTitle"><span><Icon name="check"/></span><div><small>ALL TESTS PASSED · TRY {attempts}</small><h2>작성한 코드가 모든 입력을 통과했어요</h2></div><em className={writingMode==="guided"?"assisted":"independent"}><Icon name={writingMode==="guided"?"book":"check"} size={14}/>{writingMode==="guided"?"주석 가이드로 작성":"빈 화면에서 작성"}</em></div><div className="testTable"><div className="testRow head"><b>검사 항목</b><b>실행 결과</b><b>상태</b></div>{testRows.map(([a,b])=><div className="testRow" key={a}><b>{a}</b><span>{b}</span><i><Icon name="check" size={15}/></i></div>)}</div><div className="interpret"><Icon name="brain"/><p><b>내 코드의 동작을 다시 연결해 볼까요?</b>방금 만든 코드는 {mission.reason}</p></div><button className="moduleCommit" onClick={()=>{audio.play("clear");setShowClear(true)}}><span><Icon name="code" size={18}/></span>이 코드를 라인 코어에 결합하기 <Icon name="arrow" size={19}/></button></div>:<div className="failed"><span className="bigIcon coral"><Icon name="code"/></span><p className="kicker">REPAIR REPORT · TRY {attempts}</p><h2>정답 대신 고칠 방향을 찾아볼게요</h2><ul>{validationIssues.slice(0,3).map((issue)=><li key={issue}><Icon name="target" size={15}/><span>{issue}</span></li>)}</ul>{validationIssues.length>3&&<p className="moreIssues">먼저 표시된 세 부분을 고친 뒤 다시 검사하면 다음 진단도 확인할 수 있어요.</p>}<div className="failedActions"><button className="primary" onClick={()=>goToStep(2,"코드 편집기로 돌아가는 중")}>코드 수정하기 <Icon name="arrow"/></button></div></div>}</div>
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
              <div className="clearTestCount"><span><Icon name="terminal" size={18}/></span><div><small>TEST RESULT</small><b>{testRows.length} / {testRows.length} 통과</b></div></div>
              <div className={`clearAssist ${writingMode==="guided"?"assisted":"independent"}`}><Icon name={writingMode==="guided"?"book":"check"} size={15}/><span>{writingMode==="guided"?"역할 주석을 따라 직접 작성했어요":"가이드 없이 빈 화면에서 작성했어요"}</span></div>
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

function LearningReview({mission,checks,onClose}:{mission:Mission;checks:LearningCheck[];onClose:()=>void}){
  return <div className="learningReviewOverlay" role="dialog" aria-modal="true" aria-labelledby="learning-review-title" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose()}}>
    <section className="learningReviewPanel">
      <header><span><Icon name="brain" size={22}/></span><div><small>LEARNING LOG</small><h2 id="learning-review-title">배운 개념을 코드와 다시 연결해요</h2></div><button onClick={onClose} aria-label="학습 노트 닫기"><Icon name="x" size={18}/></button></header>
      <div className="lumiRecall"><img src="/assets/lumi-guide.webp" alt="배운 내용을 설명하는 루미"/><div><small>루미의 핵심 설명</small><b>{mission.speech}</b><p>{mission.conceptBrief}</p></div></div>
      <div className="learningReviewList">{checks.map((check,index)=><article key={`${check.badge}-${index}`}><span>{String(index+1).padStart(2,"0")}</span><div><small>{check.badge}</small><h3>{check.question}</h3><p>{check.feedback}</p><code><Icon name="code" size={13}/>{check.codeClue}</code></div></article>)}</div>
      <footer><p><Icon name="light" size={16}/>이 노트를 닫아도 작성 중인 코드는 그대로 유지됩니다.</p><button onClick={onClose}>코드 계속 작성하기 <Icon name="arrow" size={18}/></button></footer>
    </section>
  </div>;
}

function Actions({back,next,nextLabel,backLabel="이전",disabled=false}:{back:()=>void;next:()=>void;nextLabel:string;backLabel?:string;disabled?:boolean}){return <div className="actions"><button className="secondary" onClick={back}>{backLabel}</button><button className="primary" onClick={next} disabled={disabled}>{nextLabel}<Icon name="arrow"/></button></div>}

function LoadingScreen({message}:{message:string}){return <div className="loadingScreen" role="status" aria-live="polite"><div className="loadingCore"><i/><i/><span><Icon name="code" size={30}/></span></div><p>LINE CORE SYSTEM</p><h2>{message}</h2><div className="loadingTrack"><i/></div></div>}
