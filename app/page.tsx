"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

type IconName = "arrow" | "book" | "brain" | "check" | "code" | "lock" | "map" | "play" | "target" | "terminal" | "user" | "x";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    brain: <><path d="M9.5 4.5A3 3 0 0 0 4 6a3 3 0 0 0 .5 5.5A3 3 0 0 0 6 17a3 3 0 0 0 3.5 2.5Z"/><path d="M14.5 4.5A3 3 0 0 1 20 6a3 3 0 0 1-.5 5.5A3 3 0 0 1 18 17a3 3 0 0 1-3.5 2.5Z"/><path d="M9.5 4.5v15m5-15v15M6.5 9h3m5 0h3m-11 6h3m5 0h3"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    code: <><path d="m8 9-4 3 4 3m8-6 4 3-4 3M14 5l-4 14"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/></>,
    play: <path d="m8 5 11 7-11 7Z"/>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3m9 6h-3m-6 9v-3M3 12h3"/></>,
    terminal: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    x: <><path d="M6 6l12 12"/><path d="M18 6 6 18"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

type Mission = {
  chapter: string; title: string; short: string; story: string; speech: string;
  goal: string; reason: string; success: string[]; question: string;
  options: string[]; answer: number; hint: string; codeTitle: string;
  codeHint: string; codeGuide: Array<[string, string]>; starter: string; solution: string; recovered: string;
  tests: Array<[string, string]>;
};

const missions: Mission[] = [
  {
    chapter: "프롤로그", title: "사라진 라인 코어", short: "라인팔로잉의 작동 순서를 이해합니다.",
    story: "미래 도시의 안내 로봇 루미에게 단 하나뿐인 line_follow 명령이 사라졌습니다. 먼저 이 명령이 어떤 일을 해야 하는지 찾아야 합니다.",
    speech: "검은 선은 보이는데 다음에 무엇을 해야 할지 모르겠어요. 라인을 따라간다는 건 어떤 과정인가요?",
    goal: "라인팔로잉의 네 가지 과정을 올바른 순서로 정리합니다.", reason: "앞으로 작성할 각 코드가 전체 함수에서 어떤 역할을 하는지 이해하기 위해 필요합니다.",
    success: ["처리 순서 선택", "네 단계 주석 작성", "검사 통과"],
    question: "라인팔로잉의 올바른 처리 순서는 무엇일까요?",
    options: ["센서 확인 → 오차 계산 → 방향 보정 → 반복", "방향 보정 → 센서 확인 → 정지 → 반복", "속도 증가 → 함수 종료 → 센서 확인", "오차 계산 → 전원 종료 → 반복"], answer: 0,
    hint: "먼저 현재 상태를 확인하고, 차이를 계산한 뒤 방향을 수정해야 합니다.",
    codeTitle: "처리 과정을 파이썬 주석으로 기록하세요.", codeHint: "설계도에 적힌 네 문장을 같은 순서로 옮겨 적으면 됩니다.",
    codeGuide: [["# 센서 확인", "현재 센서값을 먼저 읽어요."], ["# 오차 계산", "기준값과 센서값의 차이를 구해요."], ["# 방향 보정", "오차에 맞게 방향을 바꿔요."], ["# 반복", "이 과정을 계속 되풀이해요."]],
    starter: "# 센서 확인\n# 오차 계산\n# 방향 보정\n# 반복", solution: "# 센서 확인\n# 오차 계산\n# 방향 보정\n# 반복",
    recovered: "라인팔로잉 처리 순서", tests: [["첫 과정", "센서 확인"], ["중간 과정", "오차 계산 · 방향 보정"], ["마지막 과정", "반복"]],
  },
  {
    chapter: "1장 · 기억 모듈", title: "필요한 값을 기억하라", short: "속도, 기준값, Kp, Kd를 변수에 저장합니다.",
    story: "루미는 센서값을 읽을 수 있지만 기준값과 제어 설정을 계속 잊어버립니다. 이름을 붙여 값을 기억시켜 주세요.",
    speech: "기준값과 속도를 매번 새로 말하지 않아도 기억할 수 있게 해 주세요.",
    goal: "라인팔로잉에 필요한 네 가지 변수를 직접 선언합니다.", reason: "함수에서 같은 값을 정확한 이름으로 다시 사용하기 위해 필요합니다.",
    success: ["변수 역할 구분", "네 변수 작성", "값 검사 통과"],
    question: "기준 센서값을 저장하기에 가장 알맞은 변수 이름은 무엇일까요?", options: ["target", "while", "def", "left_motor"], answer: 0,
    hint: "변수 이름은 값의 역할을 드러내야 합니다. 따라가려는 목표값을 뜻하는 이름을 찾아보세요.",
    codeTitle: "루미의 기억값을 설정하세요.", codeHint: "이번 훈련 코어는 아래의 고정된 이름과 값을 사용해요. 이후 단계에서도 그대로 다시 사용합니다.",
    codeGuide: [["base_speed = 60", "직진할 때의 기준 속도"], ["target = 50", "선을 판단하는 센서 기준값"], ["kp = 0.8", "현재 오차에 반응하는 힘"], ["kd = 0.3", "급격한 흔들림을 줄이는 힘"]],
    starter: "base_speed = \ntarget = \nkp = \nkd = ", solution: "base_speed = 60\ntarget = 50\nkp = 0.8\nkd = 0.3",
    recovered: "속도와 제어 변수", tests: [["기본 속도", "60"], ["기준값", "50"], ["제어값", "Kp 0.8 · Kd 0.3"]],
  },
  {
    chapter: "2장 · 명령 모듈", title: "하나의 명령으로 묶어라", short: "line_follow 함수와 반복 구조를 정의합니다.",
    story: "값은 준비됐지만 루미에게는 실행할 명령이 없습니다. 모든 판단을 담을 하나의 함수 틀을 복구해야 합니다.",
    speech: "여러 명령이 아니라 line_follow라는 하나의 명령으로 움직이고 싶어요.",
    goal: "매개변수와 반복문을 포함한 line_follow 함수의 틀을 만듭니다.", reason: "라인을 따라가는 모든 과정을 하나의 재사용 가능한 명령으로 묶기 위해 필요합니다.",
    success: ["함수 구조 선택", "들여쓰기 작성", "센서 읽기 확인"],
    question: "함수를 정의할 때 사용하는 파이썬 키워드는 무엇일까요?", options: ["def", "return", "print", "import"], answer: 0,
    hint: "새로운 함수의 시작을 알리는 두 글자 키워드를 찾아보세요.",
    codeTitle: "line_follow 함수의 틀을 완성하세요.", codeHint: "아래 이름은 다음 미션이 연결되는 약속입니다. 대소문자와 밑줄까지 설계도와 같게 입력해 주세요.",
    codeGuide: [["def line_follow(base_speed, target, kp, kd):", "네 값을 전달받는 함수의 시작"], ["previous_error = 0", "아직 이전 오차가 없으므로 0에서 시작"], ["while True:", "센서 확인과 보정을 계속 반복"], ["color_sensor.reflection()", "센서의 반사광 값을 읽는 명령"]],
    starter: "def line_follow(base_speed, target, kp, kd):\n    previous_error = 0\n\n    while True:\n        sensor_value = ",
    solution: "def line_follow(base_speed, target, kp, kd):\n    previous_error = 0\n\n    while True:\n        sensor_value = color_sensor.reflection()",
    recovered: "함수와 반복 구조", tests: [["함수 이름", "line_follow"], ["이전 오차", "0"], ["센서 읽기", "reflection()"]],
  },
  {
    chapter: "3장 · 판단 모듈", title: "현재 오차에 반응하라", short: "오차를 계산하고 P 제어값을 만듭니다.",
    story: "루미는 센서값을 읽지만 기준에서 얼마나 벗어났는지 알 수 없습니다. 현재 상태에 알맞은 반응 크기를 계산해야 합니다.",
    speech: "조금 벗어났을 때와 많이 벗어났을 때 똑같이 반응하면 안 될 것 같아요.",
    goal: "현재 오차를 계산하고 kp를 곱해 P 제어값을 만듭니다.", reason: "기준에서 멀리 벗어날수록 더 크게 방향을 보정하기 위해 필요합니다.",
    success: ["오차 부호 판단", "P 계산식 작성", "3개 입력 검사"],
    question: "target이 50이고 sensor_value가 40이라면 error는 얼마일까요?", options: ["10", "-10", "40", "90"], answer: 0,
    hint: "error = target - sensor_value 순서로 50에서 40을 빼 보세요.",
    codeTitle: "오차와 P 제어 코드를 작성하세요.", codeHint: "설계도에 있는 변수 이름은 앞 단계와 연결됩니다. 식의 왼쪽과 오른쪽을 그대로 확인해 보세요.",
    codeGuide: [["error = target - sensor_value", "목표값에서 현재 센서값을 빼요."], ["p_control = kp * error", "현재 오차에 Kp를 곱해 반응 크기를 정해요."]],
    starter: "error = \np_control = ", solution: "error = target - sensor_value\np_control = kp * error",
    recovered: "오차와 P 제어", tests: [["센서 40", "error 10"], ["센서 50", "error 0"], ["센서 65", "error -15"]],
  },
  {
    chapter: "4장 · 균형 모듈", title: "오차의 변화를 읽어라", short: "이전 오차와 비교해 D 제어값을 만듭니다.",
    story: "P 제어를 복구했지만 오차가 10, -8, 7, -6으로 빠르게 바뀝니다. 루미가 변화의 속도를 읽지 못해 흔들리고 있습니다.",
    speech: "지금 얼마나 벗어났는지는 알아요. 하지만 오차가 얼마나 빠르게 바뀌는지도 알고 싶어요.",
    goal: "현재 오차와 이전 오차의 차이를 구하고 D 제어값을 계산합니다.", reason: "오차가 급격하게 변하는 상황에 대응하고 흔들림을 줄이기 위해 필요합니다.",
    success: ["변화량 이해", "D 계산식 작성", "이전값 비교 검사"],
    question: "현재 error가 8이고 previous_error가 3이라면 change는 얼마일까요?", options: ["5", "11", "-5", "24"], answer: 0,
    hint: "change는 현재 오차에서 이전 오차를 뺀 값입니다. 8 - 3을 계산해 보세요.",
    codeTitle: "변화량과 D 제어 코드를 작성하세요.", codeHint: "현재 오차와 직전 오차를 먼저 비교한 다음, 변화량에 Kd를 곱합니다.",
    codeGuide: [["change = error - previous_error", "현재 오차가 직전보다 얼마나 변했는지 계산"], ["d_control = kd * change", "변화가 클수록 더 빠르게 균형을 잡아요."]],
    starter: "change = \nd_control = ", solution: "change = error - previous_error\nd_control = kd * change",
    recovered: "변화량과 D 제어", tests: [["8과 3 비교", "change 5"], ["-2와 4 비교", "change -6"], ["변화 없음", "change 0"]],
  },
  {
    chapter: "최종장 · 중앙 코어", title: "라인팔로잉을 완성하라", short: "P와 D를 결합하고 좌우 출력을 결정합니다.",
    story: "모든 판단 모듈이 복구됐습니다. 보정값을 좌우 출력에 반대로 적용하고 다음 반복을 위해 오차를 기억하면 됩니다.",
    speech: "지금까지 만든 코드를 하나로 연결해 주세요. 그러면 line_follow 명령이 다시 완성돼요.",
    goal: "P와 D를 결합해 좌우 출력을 만들고 previous_error를 갱신합니다.", reason: "계산한 보정값을 실제 방향 변화로 연결하고 다음 계산을 준비하기 위해 필요합니다.",
    success: ["PD 결합", "좌우 출력 작성", "최종 검사 통과"],
    question: "한쪽 출력에 correction을 더했다면 반대쪽 출력에는 어떻게 해야 할까요?", options: ["correction을 뺀다", "같이 더한다", "항상 0으로 만든다", "previous_error를 더한다"], answer: 0,
    hint: "방향을 바꾸려면 좌우 출력에 서로 반대되는 보정이 적용되어야 합니다.",
    codeTitle: "line_follow 함수의 마지막 부분을 완성하세요.", codeHint: "보정값을 좌우 출력에 반대로 적용한 뒤, 이번 오차를 다음 반복을 위해 저장합니다.",
    codeGuide: [["correction = p_control + d_control", "P와 D 반응을 하나의 보정값으로 합쳐요."], ["left_power = base_speed + correction", "왼쪽 출력에는 보정값을 더해요."], ["right_power = base_speed - correction", "오른쪽 출력에는 보정값을 빼요."], ["previous_error = error", "이번 오차를 다음 반복의 이전 오차로 저장"]],
    starter: "correction = \nleft_power = \nright_power = \n\nleft_motor.dc(left_power)\nright_motor.dc(right_power)\n\nprevious_error = ",
    solution: "correction = p_control + d_control\nleft_power = base_speed + correction\nright_power = base_speed - correction\n\nleft_motor.dc(left_power)\nright_motor.dc(right_power)\n\nprevious_error = error",
    recovered: "완성된 line_follow 함수", tests: [["PD 결합", "P + D"], ["왼쪽 출력", "속도 + 보정"], ["오른쪽 출력", "속도 - 보정"]],
  },
];

const FINAL_LINE_FOLLOW_CODE = `# 수업 환경에서 센서와 좌우 모터가 연결되어 있다고 가정합니다.

base_speed = 60
target = 50
kp = 0.8
kd = 0.3

def line_follow(base_speed, target, kp, kd):
    previous_error = 0

    while True:
        sensor_value = color_sensor.reflection()
        error = target - sensor_value
        p_control = kp * error

        change = error - previous_error
        d_control = kd * change
        correction = p_control + d_control

        left_power = base_speed + correction
        right_power = base_speed - correction
        left_motor.dc(left_power)
        right_motor.dc(right_power)

        previous_error = error`;

type ValidationResult = { passed: boolean; missing: string[] };

function validate(id: number, code: string): ValidationResult {
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
    const missing=expected.filter((label,index)=>comments[index]!==label).map((label,index)=>`${index+1}번째 주석: # ${label}`);
    return {passed:missing.length===0,missing};
  }

  const checks: Array<Array<[string, ()=>boolean]>> = [[],
    [["기본 속도: base_speed = 60",()=>hasNumber("base_speed",60)],["센서 기준값: target = 50",()=>hasNumber("target",50)],["P 계수: kp = 0.8",()=>hasNumber("kp",0.8)],["D 계수: kd = 0.3",()=>hasNumber("kd",0.3)]],
    [["함수 선언: def line_follow(base_speed, target, kp, kd):",()=>/^\s*def\s+line_follow\s*\(\s*base_speed\s*,\s*target\s*,\s*kp\s*,\s*kd\s*\)\s*:/m.test(executable)],["이전 오차 초기값: previous_error = 0",()=>hasNumber("previous_error",0)],["반복문: while True:",()=>/^\s*while\s+True\s*:/m.test(executable)],["센서 읽기: color_sensor.reflection()",()=>has("color_sensor.reflection()")]],
    [["오차 계산: error = target - sensor_value",()=>has("error=target-sensor_value")],["P 제어: p_control = kp * error",()=>has("p_control=kp*error")||has("p_control=error*kp")]],
    [["변화량: change = error - previous_error",()=>has("change=error-previous_error")],["D 제어: d_control = kd * change",()=>has("d_control=kd*change")||has("d_control=change*kd")]],
    [["PD 결합: correction = p_control + d_control",()=>has("correction=p_control+d_control")||has("correction=d_control+p_control")],["왼쪽 출력: left_power = base_speed + correction",()=>has("left_power=base_speed+correction")||has("left_power=correction+base_speed")],["오른쪽 출력: right_power = base_speed - correction",()=>has("right_power=base_speed-correction")],["왼쪽 모터 명령: left_motor.dc(left_power)",()=>has("left_motor.dc(left_power)")],["오른쪽 모터 명령: right_motor.dc(right_power)",()=>has("right_motor.dc(right_power)")],["이전 오차 저장: previous_error = error",()=>has("previous_error=error")]],
  ];
  const missing=checks[id].filter(([,test])=>!test()).map(([label])=>label);
  return {passed:missing.length===0,missing};
}

export default function Home() {
  const [screen,setScreen] = useState<"title"|"login"|"mission"|"ending">("title");
  const [name,setName] = useState("");
  const [classCode,setClassCode] = useState("");
  const [completed,setCompleted] = useState<number[]>([]);
  const [active,setActive] = useState(0);
  const [step,setStep] = useState(0);
  const [choice,setChoice] = useState<number|null>(null);
  const [checked,setChecked] = useState(false);
  const [code,setCode] = useState(missions[0].starter);
  const [passed,setPassed] = useState(false);
  const [validationIssues,setValidationIssues] = useState<string[]>([]);
  const [dialogueIndex,setDialogueIndex] = useState(0);
  const [briefingReady,setBriefingReady] = useState(false);
  const [loadingMessage,setLoadingMessage] = useState<string|null>(null);
  const [codeCopied,setCodeCopied] = useState(false);
  const mission = missions[active];
  const dialogue = [
    mission.speech,
    mission.story,
    `${name} 엔지니어님, 이번 임무에서 할 일은 다음과 같아요. ${mission.goal} 준비되면 퀘스트 내용을 확인해 주세요.`,
  ];
  const nextMission = missions.findIndex((_,i)=>!completed.includes(i));
  const stageNames = ["임무 확인","생각하기","코드 작성","테스트"];

  useEffect(()=>{
    const restoreSession = window.setTimeout(()=>{
      const savedName = localStorage.getItem("linecore-name");
      const savedProgress = localStorage.getItem("linecore-progress");
      if(savedName) setName(savedName);
      if(savedProgress) setCompleted(JSON.parse(savedProgress));
    },0);
    return ()=>window.clearTimeout(restoreSession);
  },[]);

  function transition(action:()=>void,message:string,delay=650){
    if(loadingMessage)return;
    setLoadingMessage(message);
    window.setTimeout(()=>{action();setLoadingMessage(null)},delay);
  }
  function openMission(id:number){setActive(id);setStep(0);setChoice(null);setChecked(false);setCode(missions[id].starter);setPassed(false);setValidationIssues([]);setDialogueIndex(0);setBriefingReady(false);setScreen("mission");}
  function startGame(){
    transition(()=>{
      if(!name.trim()){setScreen("login");return;}
      if(completed.length===missions.length){setCompleted([]);localStorage.setItem("linecore-progress","[]");openMission(0);return;}
      openMission(nextMission<0?0:nextMission);
    },name.trim()?"저장된 라인 코어에 연결하는 중":"엔지니어 등록 정보를 확인하는 중");
  }
  function login(e:FormEvent){
    e.preventDefault();
    if(!name.trim()||!classCode.trim())return;
    const previousName=localStorage.getItem("linecore-name");
    if(previousName&&previousName!==name.trim()){setCompleted([]);localStorage.setItem("linecore-progress","[]");}
    localStorage.setItem("linecore-name",name.trim());
    transition(()=>openMission(previousName===name.trim()&&nextMission>=0?nextMission:0),"라인 코어 세계를 불러오는 중");
  }
  function advanceDialogue(){if(dialogueIndex<dialogue.length-1)setDialogueIndex(dialogueIndex+1);else transition(()=>setBriefingReady(true),"미션 정보를 불러오는 중",500);}
  function goToStep(next:number,message:string){transition(()=>setStep(next),message,520);}
  function finishMission(){
    const list=Array.from(new Set([...completed,active])).sort();
    setCompleted(list);
    localStorage.setItem("linecore-progress",JSON.stringify(list));
    if(active<missions.length-1)transition(()=>openMission(active+1),`CHAPTER ${active+1} 복구 완료 · 다음 구역으로 이동 중`,850);
    else transition(()=>setScreen("ending"),"라인 코어 전체 시스템을 동기화하는 중",950);
  }

  const loading=loadingMessage?<LoadingScreen message={loadingMessage}/>:null;
  const startLabel=!name.trim()?"GAME START":completed.length===missions.length?"다시 시작":completed.length?"이어서 시작":"GAME START";

  if(screen==="title") return <><main className="titleScreen" aria-hidden={Boolean(loadingMessage)} inert={Boolean(loadingMessage)}>
    <img className="titleLogo" src="/assets/playwell-logo.png" alt="Playwell"/>
    <div className="titleSky" aria-hidden="true"><i/><i/><i/></div>
    <svg className="titleRoute" viewBox="0 0 1400 800" aria-hidden="true"><path d="M-80 820C290 635 360 730 590 575s274-263 520-157 218 221 392 80"/><path d="M-80 820C290 635 360 730 590 575s274-263 520-157 218 221 392 80"/></svg>
    <div className="titleBlocks" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <img className="titleCharacter" src="/assets/lumi-character.png" alt="검은 라인을 따라가는 안내 로봇 루미"/>
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
    <div className="titleModules"><span>VARIABLE</span><i/><span>FUNCTION</span><i/><span>P CONTROL</span><i/><span>D CONTROL</span></div>
  </main>{loading}</>;

  if(screen==="login") return <><main className="loginGame" aria-hidden={Boolean(loadingMessage)} inert={Boolean(loadingMessage)}>
    <button className="backTitle" onClick={()=>setScreen("title")}><Icon name="arrow" size={17}/> 타이틀로</button>
    <img className="loginLogo" src="/assets/playwell-logo.png" alt="Playwell"/>
    <img className="loginCharacter" src="/assets/lumi-character.png" alt="학생을 기다리는 안내 로봇 루미"/>
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
    <img className="endingCharacter" src="/assets/lumi-character.png" alt="라인 코어를 복구한 루미"/>
    <section className="endingPanel">
      <div className="endingSummary"><span className="endingCore"><Icon name="check" size={39}/></span><p className="kicker">LINE CORE RESTORED</p><h1>라인 코어<br/>복구 완료</h1><p>{name} 엔지니어가 하나의 <code>line_follow()</code> 함수 안에 모든 과정을 연결했습니다.</p><div className="endingModules"><span>변수 설정</span><span>함수 정의</span><span>P 제어</span><span>D 제어</span><span>좌우 출력</span></div><button className="gameStart small" onClick={()=>transition(()=>setScreen("title"),"타이틀 화면으로 돌아가는 중",550)}>타이틀로 돌아가기 <Icon name="arrow"/></button></div>
      <section className="finalCodePanel" aria-label="완성된 line_follow 전체 코드">
        <header><div><small>RESTORED SOURCE</small><h2>완성된 전체 코드</h2></div><button onClick={async()=>{try{await navigator.clipboard.writeText(FINAL_LINE_FOLLOW_CODE);setCodeCopied(true);window.setTimeout(()=>setCodeCopied(false),1600)}catch{return}}}><Icon name={codeCopied?"check":"code"} size={16}/>{codeCopied?"복사 완료":"전체 코드 복사"}</button></header>
        <pre><code>{FINAL_LINE_FOLLOW_CODE}</code></pre>
        <p><Icon name="brain" size={16}/> 별도 보조 함수 없이, 센서 확인부터 좌우 출력까지 하나의 <code>line_follow()</code> 함수에 담았습니다.</p>
      </section>
    </section>
  </main>{loading}</>;

  return <><main className="gameScreen" aria-hidden={Boolean(loadingMessage)} inert={Boolean(loadingMessage)}>
    <header className="gameHud" aria-hidden={passed} inert={passed}><img src="/assets/playwell-logo.png" alt="Playwell"/><div className="chapterInfo"><small>{mission.chapter}</small><b>{mission.title}</b></div><div className="chapterProgress"><span>CORE {active+1} / {missions.length}</span><div>{missions.map((_,i)=><i className={i<active?"done":i===active?"active":""} key={i}/>)}</div></div><div className="stageProgress"><small>{stageNames[step]}</small><div>{stageNames.map((s,i)=><i className={i<step?"done":i===step?"active":""} title={s} key={s}/>)}</div></div><button className="exitGame" onClick={()=>transition(()=>setScreen("title"),"게임을 안전하게 저장하는 중",500)}>게임 종료</button></header>
    <section className={`gameViewport stage${step}`}>
    <section className={`missionMain ${step===0?"introMode":""}`}>
      {step===0&&<section className={`rpgScene ${briefingReady?"missionReady":""}`} aria-label={`${mission.title} ${briefingReady?"미션 정보":"도입 대화"}`}>
        <div className="sceneHud"><span>{mission.chapter}</span><b>{mission.title}</b></div>
        {!briefingReady?<button className="skipDialogue" onClick={()=>transition(()=>setBriefingReady(true),"미션 정보를 불러오는 중",450)}>미션 바로 보기 <Icon name="arrow" size={16}/></button>:<button className="skipDialogue replayScene" onClick={()=>{setDialogueIndex(0);setBriefingReady(false)}}><Icon name="play" size={14}/> 대사 다시 보기</button>}
        <svg className="sceneMap" viewBox="0 0 800 520" aria-hidden="true">
          <path d="M-30 420C110 355 154 245 286 260s173 116 334 42 185-182 247-210"/>
          <path d="M-30 454C110 389 154 279 286 294s173 116 334 42 185-182 247-210"/>
          <circle cx="165" cy="330" r="9"/><circle cx="530" cy="325" r="9"/>
        </svg>
        <div className="sceneBuilding buildingOne"><i/><i/><i/></div>
        <div className="sceneBuilding buildingTwo"><i/><i/></div>
        <img className="sceneCharacter" src="/assets/lumi-character.png" alt="라인 코어 복구를 요청하는 안내 로봇 루미"/>
        {!briefingReady?<div className="dialogueBox">
          <span className="speakerName">안내 로봇 · 루미</span>
          <p className="dialogueText" key={dialogueIndex} aria-live="polite">{dialogue[dialogueIndex]}</p>
          <div className="dialogueFooter"><span>{dialogueIndex+1} / {dialogue.length}</span><span className="dialogueDots" aria-hidden="true">{dialogue.map((_,i)=><i className={i===dialogueIndex?"active":""} key={i}/>)}</span><button onClick={advanceDialogue} aria-label={dialogueIndex===dialogue.length-1?"미션 확인하기":"다음 대화"}>{dialogueIndex===dialogue.length-1?"미션 확인":"다음"}<Icon name="arrow"/></button></div>
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
          <button className="missionStart" autoFocus onClick={()=>goToStep(1,"첫 번째 문제를 준비하는 중")}><span><Icon name="play" size={18}/></span>미션 시작<Icon name="arrow" size={21}/></button>
        </section>}
      </section>}
      {step===1&&<section className={`stagePanel thinkingStage routeStage ${checked?(choice===mission.answer?"routeSuccess":"routeError"):choice!==null?"routeLocked":"routeScanning"}`}>
        <div className="routeStageHead">
          <div className="routeGuide">
            <span><img src="/assets/lumi-character.png" alt="복구 경로를 안내하는 루미"/></span>
            <div><small>루미 · 라인 네비게이터</small><h1>복구 경로를 선택해 주세요</h1></div>
          </div>
          <div className="routeSignal" aria-live="polite">
            <span><i/><i/><i/><i/></span>
            <div><small>ROUTE SIGNAL</small><b>{checked?(choice===mission.answer?"CORE STABLE":"ROUTE ERROR"):choice!==null?"ROUTE LOCKED":"SCANNING"}</b></div>
          </div>
        </div>
        <div className="routeConsole">
          <div className="routePrompt"><span><Icon name="target" size={23}/></span><div><small>CURRENT OBJECTIVE</small><h2>{mission.question}</h2></div></div>
          <div className={`routeOptions ${checked&&choice===mission.answer?"resolved":""}`}>
            {mission.options.map((option,i)=>{
              const selected=choice===i;
              const correct=checked&&selected&&i===mission.answer;
              const wrong=checked&&selected&&i!==mission.answer;
              const resolved=checked&&choice===mission.answer;
              const locked=resolved&&!correct;
              return <button
                key={option}
                className={`routeCard ${selected?"selected":""} ${correct?"correct":""} ${wrong?"wrong":""} ${locked?"locked":""}`}
                aria-pressed={selected}
                disabled={resolved}
                aria-label={`복구 경로 ${String.fromCharCode(65+i)}: ${option}`}
                onMouseEnter={resolved?undefined:event=>event.currentTarget.focus()}
                onClick={()=>{if(checked&&choice===mission.answer)return;setChoice(i);setChecked(false)}}>
                <span className="routeCardSelector" aria-hidden="true">{wrong?<Icon name="x" size={17}/>:selected?<Icon name="check" size={17}/>:null}</span>
                <span className="routeCardTop"><b>ROUTE {String.fromCharCode(65+i)}</b><i>{correct?"CONNECTED":locked?"LOCKED":wrong?"DISCONNECTED":selected?"SELECTED":"STANDBY"}</i></span>
                <span className="routePath">{option.split(" → ").map((part,j)=><span className="routeNode" key={`${part}-${j}`}><b>{part}</b></span>)}</span>
              </button>;
            })}
          </div>
          <div className={`routeOutcome ${checked?(choice===mission.answer?"success":"error"):"pending"}`} aria-live="polite">
            <span className="routeOutcomeIcon"><Icon name={checked?(choice===mission.answer?"check":"terminal"):"target"} size={20}/></span>
            <div><b>{checked?(choice===mission.answer?"경로 연결 성공":"경로 연결 실패"):choice!==null?"선택한 경로를 확정하세요":"복구 경로 대기 중"}</b><p>{checked?(choice===mission.answer?"라인 코어가 올바른 처리 순서를 확인했습니다.":mission.hint):choice!==null?"이 경로로 라인 코어를 복구합니다.":"경로 카드에 커서를 올리거나 키보드로 이동하세요."}</p></div>
          </div>
          <div className="routeActions">
            <button className="routeBack" onClick={()=>goToStep(0,"미션 브리핑으로 돌아가는 중")}>임무 확인</button>
            <button className={`routeConfirm ${checked&&choice===mission.answer?"success":""}`} disabled={choice===null} onClick={checked&&choice===mission.answer?()=>goToStep(2,"복구 코드 편집기를 여는 중"):checked?()=>{setChoice(null);setChecked(false)}:()=>setChecked(true)}>
              <span><Icon name={checked&&choice===mission.answer?"code":"target"} size={18}/></span>{checked?(choice===mission.answer?"복구 코드 작성":"경로 다시 선택"):"경로 확정"}<Icon name="arrow" size={20}/>
            </button>
          </div>
        </div>
      </section>}
      {step===2&&<section className="stagePanel codeStage">
        <ActivityHead icon="code" label="STEP 3 · 코드 작성" title={mission.codeTitle} text={mission.codeHint}/>
        <section className="codeBlueprint" aria-label="이번 미션의 복구 설계도">
          <div className="blueprintTitle"><Icon name="book" size={18}/><span><small>RESTORE BLUEPRINT</small><b>복구 설계도</b></span></div>
          <div className="blueprintItems">{mission.codeGuide.map(([snippet,role])=><article key={snippet}><code>{snippet}</code><p>{role}</p></article>)}</div>
        </section>
        <div className="editor">
          <div className="editorTop"><span/><span/><span/><b>mission_{active+1}.py</b><div className="editorTools"><button onClick={()=>setCode(mission.starter)}><Icon name="terminal" size={14}/> 초기 코드 복원</button><button onClick={()=>setCode(mission.solution)}><Icon name="book" size={14}/> 설계도대로 채우기</button></div></div>
          <div><pre>{Array.from({length:Math.max(8,code.split("\n").length)},(_,i)=>`${i+1}\n`)}</pre><textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} aria-label="파이썬 코드 작성"/></div>
        </div>
        <Actions back={()=>goToStep(1,"복구 경로 선택 화면으로 돌아가는 중")} backLabel="복구 경로로" next={()=>{const result=validate(active,code);setPassed(result.passed);setValidationIssues(result.missing);goToStep(3,"작성한 코드를 검사하는 중")}} nextLabel="코드 실행하기"/>
      </section>}
      {step===3&&<section className={`stagePanel testStage ${passed?"testPassed":""}`}><div className="testContent" aria-hidden={passed} inert={passed}><ActivityHead icon="terminal" label="STEP 4 · 테스트" title="코드가 의도대로 작동하는지 확인해요" text="검사 결과를 확인하고, 필요한 부분만 설계도와 다시 비교해 보세요."/>{passed?<div className="testCard"><div className="testTitle"><span><Icon name="check"/></span><div><small>ALL TESTS PASSED</small><h2>모든 테스트를 통과했어요</h2></div></div><div className="testTable"><div className="testRow head"><b>검사 항목</b><b>결과</b><b>상태</b></div>{mission.tests.map(([a,b])=><div className="testRow" key={a}><b>{a}</b><span>{b}</span><i><Icon name="check" size={15}/></i></div>)}</div><div className="interpret"><Icon name="brain"/><p><b>결과 해석</b>{mission.reason}</p></div></div>:<div className="failed"><span className="bigIcon coral"><Icon name="code"/></span><p className="kicker">REPAIR REPORT</p><h2>먼저 이 부분을 고쳐 볼까요?</h2><ul>{validationIssues.slice(0,3).map((issue)=><li key={issue}><Icon name="target" size={15}/><span>{issue}</span></li>)}</ul>{validationIssues.length>3&&<p className="moreIssues">이 세 곳을 고친 뒤 다시 검사하면 다음 항목도 확인할 수 있어요.</p>}<button className="primary" onClick={()=>goToStep(2,"코드 편집기로 돌아가는 중")}>코드 수정하기 <Icon name="arrow"/></button></div>}</div>
        {passed&&<div className="missionClearOverlay" role="dialog" aria-modal="true" aria-labelledby="mission-clear-title">
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
