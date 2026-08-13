export type GlossaryTopic = {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  summary: string;
  why: string;
  formulas: string[];
  examples: string[];
  remember: string;
};

export type FinalQuizQuestion = {
  category: "센서와 기준" | "PD 제어" | "파이썬 문법";
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  glossaryId: string;
};

export const glossaryTopics: GlossaryTopic[] = [
  {
    id:"line-following",number:"01",title:"경계선을 따라가는 라인 팔로잉",eyebrow:"LINE FOLLOWING",
    summary:"색상 센서로 바닥의 밝기를 계속 읽고, 검정과 흰색이 만나는 경계에서 벗어난 만큼 좌우 모터 속도를 바꾸어 선을 따라가는 주행 방법입니다.",
    why:"로봇이 움직이는 동안 센서가 보는 위치도 매 순간 바뀝니다. 따라서 센서 확인, 오차 계산, 방향 보정을 짧은 간격으로 되풀이해야 합니다.",
    formulas:["센서 확인 → 오차 계산 → P·D 계산 → 좌우 모터 보정 → 반복"],
    examples:["센서를 검정 한가운데가 아니라 검정과 흰색의 경계 가까이에 놓고 주행합니다.","센서가 경계에서 벗어나면 두 바퀴의 속도 차이로 방향을 바꾸어 다시 경계로 돌아옵니다."],
    remember:"라인 팔로잉은 선을 한 번 발견하고 끝나는 동작이 아니라, 현재 상태를 계속 확인하고 수정하는 피드백 제어입니다.",
  },
  {
    id:"variable",number:"02",title:"값의 역할을 보여 주는 변수",eyebrow:"VARIABLE",
    summary:"숫자나 계산 결과에 의미 있는 이름을 붙여 저장하는 공간입니다. 파이썬에서는 이름에 값을 대입하는 순간 변수가 만들어집니다.",
    why:"60 같은 숫자만 보면 무엇을 뜻하는지 알기 어렵지만 base_speed라고 쓰면 기본 속도임을 바로 알 수 있습니다. 값이 바뀌어도 사용하는 모든 코드를 다시 고칠 필요가 없습니다.",
    formulas:["변수이름 = 저장할 값","base_speed = 60","kp = 0.8"],
    examples:["base_speed = 60은 기본 속도 60을 base_speed라는 이름에 저장합니다.","target = 50은 따라갈 경계의 기준값을 저장합니다.","p_control = kp * error처럼 계산 결과도 변수에 저장할 수 있습니다."],
    remember:"왼쪽에는 변수 이름, 오른쪽에는 값이나 계산식을 씁니다. =는 값을 저장하고, ==는 두 값이 같은지 비교합니다.",
  },
  {
    id:"reflection",number:"03",title:"센서로 바닥을 읽는 반사광",eyebrow:"REFLECTION",
    summary:"색상 센서가 바닥에 빛을 비춘 뒤 되돌아온 빛의 밝기를 숫자로 나타낸 값입니다. 보통 검정은 빛을 적게 반사해 값이 낮고, 흰색은 많이 반사해 값이 높습니다.",
    why:"로봇은 색 이름을 직접 이해하지 못하므로 반사광 숫자로 검정과 흰색을 구분합니다. 현재 숫자를 기준값과 비교하면 경계에서 어느 쪽으로 벗어났는지 알 수 있습니다.",
    formulas:["black_value = 20","white_value = 80","sensor_value = color_sensor.reflection()"],
    examples:["color_sensor.reflection()이 현재 반사광을 읽고, 반환된 값을 sensor_value에 저장합니다.","검정에서 20, 흰색에서 80이 측정될 수 있지만 조명, 센서 높이, 바닥 재질이 달라지면 값도 달라집니다."],
    remember:"20과 80은 예시일 뿐 절대값이 아닙니다. 주행할 장소에서 검정과 흰색을 직접 측정한 값을 사용하세요.",
  },
  {
    id:"target",number:"04",title:"검정과 흰색 사이의 기준값",eyebrow:"REFERENCE VALUE",
    summary:"로봇이 따라가려는 검정·흰색 경계의 목표 반사광입니다. 이번 학습에서는 실제로 측정한 두 반사광의 평균을 기준값으로 사용합니다.",
    why:"현재 센서값과 비교할 목표가 있어야 센서가 검정 쪽인지 흰색 쪽인지, 목표에서 얼마나 벗어났는지 계산할 수 있습니다.",
    formulas:["target = (black_value + white_value) / 2"],
    examples:["검정값이 20이고 흰색값이 80이면 target = (20 + 80) / 2 = 50입니다.","현재 센서값 30은 기준값 50보다 낮고 검정값 20에 더 가까우므로 검정 쪽에 가깝습니다."],
    remember:"숫자 50을 외우는 것이 아니라 두 측정값의 평균을 구하는 원리를 기억하세요. 측정값이 바뀌면 기준값도 달라집니다.",
  },
  {
    id:"error",number:"05",title:"방향과 거리를 알려 주는 오차",eyebrow:"ERROR",
    summary:"목표인 기준값과 센서가 현재 읽은 값의 차이입니다. 오차의 부호는 벗어난 방향을, 절댓값은 목표에서 벗어난 정도를 나타냅니다.",
    why:"오차를 알아야 로봇이 어느 방향으로 돌아가야 하는지, 얼마나 강하게 보정해야 하는지 계산할 수 있습니다.",
    formulas:["error = target - sensor_value"],
    examples:["target이 50이고 sensor_value가 40이면 error = 50 - 40 = 10입니다.","target이 50이고 sensor_value가 65이면 error = 50 - 65 = -15입니다."],
    remember:"이번 미션의 연결 약속은 target에서 sensor_value를 빼는 순서입니다. 두 항의 순서를 바꾸면 부호와 회전 방향이 함께 바뀝니다.",
  },
  {
    id:"pd",number:"06",title:"현재와 변화를 함께 보는 PD 제어",eyebrow:"PD CONTROL",
    summary:"현재 오차에 반응하는 P 제어와 직전 오차에서 얼마나 달라졌는지 보는 D 제어를 함께 사용해 로봇의 방향을 보정하는 방법입니다.",
    why:"P는 선으로 돌아오게 하지만 반응이 강하면 경계를 지나쳐 흔들릴 수 있습니다. D는 오차가 급하게 변할 때 반응해 움직임을 다듬는 데 도움을 줍니다.",
    formulas:["correction = p_control + d_control"],
    examples:["P는 ‘지금 목표에서 얼마나 벗어났는가’를 봅니다.","D는 ‘직전보다 오차가 얼마나 달라졌는가’를 봅니다.","두 계산 결과를 합친 correction으로 좌우 바퀴 속도를 다르게 만듭니다."],
    remember:"P는 현재 오차, D는 오차 변화입니다. 두 역할을 구분하면 공식을 외우지 않아도 계산 순서를 이해할 수 있습니다.",
  },
  {
    id:"p-control",number:"06-1",title:"현재 오차에 반응하는 P 제어",eyebrow:"PROPORTIONAL CONTROL",
    summary:"현재 오차의 크기에 비례하여 보정하는 제어입니다. 목표에서 멀리 벗어날수록 큰 P 보정값을 만듭니다.",
    why:"선에서 멀리 벗어났을 때는 강하게, 경계 가까이에서는 약하게 방향을 바꾸어 로봇을 목표로 되돌립니다.",
    formulas:["p_control = kp * error"],
    examples:["kp가 0.8이고 error가 10이면 p_control = 0.8 × 10 = 8입니다.","같은 error에서도 kp가 커지면 P 반응이 커집니다. 반응은 빨라지지만 너무 크면 경계를 지나치며 흔들릴 수 있습니다."],
    remember:"kp는 P 반응의 세기를 조절하는 계수입니다. 로봇과 바닥에 따라 알맞은 값이 달라지므로 무조건 크게 설정하지 않습니다.",
  },
  {
    id:"d-control",number:"06-2",title:"오차 변화를 다듬는 D 제어",eyebrow:"DERIVATIVE CONTROL",
    summary:"현재 오차에서 직전 오차를 뺀 변화량에 반응하는 제어입니다. 이 프로그램에서는 시간에 따른 변화를 연속 미분하는 대신 반복 사이의 차이를 사용합니다.",
    why:"오차가 갑자기 커지거나 방향이 빠르게 바뀔 때 추가로 반응하여 경계를 지나치는 움직임과 흔들림을 줄이는 데 도움을 줍니다.",
    formulas:["change = error - previous_error","d_control = kd * change","previous_error = error"],
    examples:["error가 8이고 previous_error가 3이면 change = 8 - 3 = 5입니다.","kd가 0.4이면 d_control = 0.4 × 5 = 2입니다.","계산 뒤 previous_error = error를 실행해야 다음 반복에서 새 변화량을 구할 수 있습니다."],
    remember:"kd는 D 반응의 세기입니다. previous_error를 갱신하지 않으면 ‘직전 오차와의 차이’를 계산할 수 없습니다.",
  },
  {
    id:"correction",number:"07",title:"좌우 회전을 만드는 보정값",eyebrow:"CORRECTION",
    summary:"P와 D 계산 결과를 합친 최종 방향 조절값입니다. 기본 속도에 보정값을 더하거나 빼 좌우 모터의 속도 차이를 만듭니다.",
    why:"두 바퀴가 같은 속도면 직진하고 속도가 다르면 로봇이 회전합니다. 계산한 오차를 실제 회전 동작으로 바꾸는 값이 필요합니다.",
    formulas:["correction = p_control + d_control","left_power = base_speed + correction","right_power = base_speed - correction"],
    examples:["base_speed가 60이고 correction이 10이면 왼쪽 70, 오른쪽 50이 됩니다. 이번 로봇 연결 기준으로 오른쪽으로 회전합니다.","correction이 -10이면 왼쪽 50, 오른쪽 70이 되어 반대쪽으로 회전합니다."],
    remember:"이번 미션은 왼쪽에 더하고 오른쪽에서 빼는 연결 약속을 사용합니다. 모터 장착 방향이나 오차 공식을 바꾸면 실제 회전 방향도 달라질 수 있습니다.",
  },
  {
    id:"function",number:"08",title:"동작을 하나로 묶는 함수",eyebrow:"FUNCTION",
    summary:"관련된 여러 줄의 코드를 하나의 이름으로 묶어 필요할 때 호출하고 다시 사용할 수 있게 하는 파이썬 구조입니다.",
    why:"센서 확인, PD 계산, 모터 출력을 line_follow라는 하나의 동작으로 묶으면 코드의 목적이 잘 보이고 여러 곳에서 같은 로직을 재사용할 수 있습니다.",
    formulas:["def line_follow(base_speed, target, kp, kd):","    previous_error = 0","line_follow(60, 50, 0.8, 0.3)"],
    examples:["함수 선언은 def, 함수 이름, 괄호 안 매개변수, 콜론(:) 순서로 작성합니다.","함수 안에서 실행할 코드는 선언 줄보다 한 단계 들여씁니다.","함수는 선언만으로 실행되지 않으며 line_follow(...)처럼 호출해야 시작됩니다."],
    remember:"함수는 코드를 무조건 짧게 만드는 도구가 아니라, 하나의 역할을 이름으로 묶어 이해와 재사용을 돕는 도구입니다.",
  },
  {
    id:"parameters",number:"09",title:"함수에 값을 전달하는 매개변수",eyebrow:"PARAMETERS",
    summary:"매개변수는 함수가 실행될 때 밖에서 값을 전달받는 자리입니다. 호출할 때 넣는 실제 값은 인수라고 하며, 각 값은 이름 또는 위치와 연결됩니다.",
    why:"같은 line_follow 함수에 기본 속도, 기준값, Kp, Kd를 다르게 전달하면 코드를 다시 만들지 않고도 여러 환경에 맞게 사용할 수 있습니다.",
    formulas:["def line_follow(base_speed, target, kp, kd):","line_follow(60, 50, 0.8, 0.3)","line_follow(base_speed=60, target=50, kp=0.8, kd=0.3)"],
    examples:["위치 인수 60, 50, 0.8, 0.3은 선언된 순서대로 base_speed, target, kp, kd에 들어갑니다.","키워드 인수는 이름을 함께 써서 각 값의 역할을 더 분명하게 나타낼 수 있습니다.","이번 채점에서는 다른 코드와 정확히 연결하기 위해 base_speed, target, kp, kd 순서로 선언해야 합니다."],
    remember:"매개변수의 이름과 순서는 파이썬 전체의 절대 규칙이 아닙니다. 다만 이번 미션에서는 정확한 연결과 채점을 위한 프로그램의 약속이므로 안내된 이름과 순서를 사용하세요.",
  },
  {
    id:"loop",number:"10",title:"센서를 계속 확인하는 반복문",eyebrow:"LOOP",
    summary:"조건이 참인 동안 안쪽 코드를 계속 실행하는 구조입니다. 라인 팔로잉에서는 최신 센서값을 읽고 보정하는 과정을 반복하기 위해 사용합니다.",
    why:"로봇이 이동하면 센서값과 오차가 매 순간 달라지므로 판단과 보정을 한 번만 실행해서는 선을 계속 따라갈 수 없습니다.",
    formulas:["while True:","    sensor_value = color_sensor.reflection()"],
    examples:["while True:는 조건이 항상 참이므로 아래에 들여쓴 코드가 계속 반복됩니다.","센서 확인, 오차 계산, 모터 출력이 반복문 안에 있어야 매 순간 새로운 값으로 보정합니다.","실제 로봇 프로그램에는 필요에 따라 정지 조건과 안전장치를 함께 둡니다."],
    remember:"while 뒤의 조건, 마지막 콜론(:), 다음 줄의 들여쓰기가 모두 필요합니다. 반복할 코드가 어디까지인지 들여쓰기로 구분합니다.",
  },
  {
    id:"indentation",number:"11",title:"코드의 범위를 정하는 들여쓰기",eyebrow:"INDENTATION",
    summary:"파이썬은 줄 앞의 공백으로 함수와 반복문에 포함되는 코드 범위를 구분합니다. 같은 단계의 코드는 같은 칸만큼 들여써야 합니다.",
    why:"계산식이 맞아도 들여쓰기가 틀리면 함수나 반복문 밖에서 실행되거나 파이썬 문법 오류가 발생합니다.",
    formulas:["def line_follow(base_speed, target, kp, kd):","    while True:","        sensor_value = color_sensor.reflection()"],
    examples:["함수 안은 보통 공백 4칸, 그 안의 while 본문은 다시 4칸을 더해 총 8칸 들여씁니다.","같은 while 안의 error 계산과 모터 출력은 sensor_value를 읽는 줄과 같은 깊이에 놓습니다.","탭과 공백을 섞지 말고 편집기가 사용하는 한 가지 방식을 유지합니다."],
    remember:"들여쓰기는 보기 좋게 정렬하는 장식이 아니라 코드의 실행 범위를 결정하는 파이썬 문법입니다.",
  },
  {
    id:"tuning",number:"12",title:"기본 속도와 Kp·Kd 조절하기",eyebrow:"TUNING",
    summary:"기본 속도는 주행 속도의 출발점이고 Kp와 Kd는 각각 현재 오차와 오차 변화에 반응하는 세기를 정합니다. 알맞은 값은 로봇과 주행 환경에 따라 달라집니다.",
    why:"같은 코드라도 바닥 재질, 조명, 센서 높이, 모터 상태, 주행 속도가 달라지면 흔들림이나 이탈이 생길 수 있어 값을 관찰하며 조절해야 합니다.",
    formulas:["base_speed = 60","kp = 0.8","kd = 0.3"],
    examples:["먼저 안전한 낮은 기본 속도에서 시작하고, 한 번에 한 변수만 바꾸어 변화를 관찰합니다.","선으로 돌아오는 힘이 약하면 kp를 조금 높이고, 지나치며 흔들리면 kp 또는 속도를 낮추거나 kd를 조절해 봅니다.","60, 0.8, 0.3은 계산 예시이며 모든 로봇에 통하는 정답은 아닙니다."],
    remember:"수치 선택은 환경에 따라 달라질 수 있지만 변수 이름, 공식, 작성 순서는 이번 프로그램의 연결·채점 약속을 따라야 합니다.",
  },
];

export const finalQuizQuestions: FinalQuizQuestion[] = [
  {category:"파이썬 문법",question:"라인 팔로잉의 여러 숫자를 변수로 선언하는 가장 큰 이유는 무엇일까요?",options:["센서가 변수 이름을 직접 읽기 때문에","숫자의 역할을 알기 쉽고 한 곳에서 조절할 수 있어서","변수를 쓰면 들여쓰기가 필요 없어서","모든 숫자를 자동으로 같은 값으로 만들기 위해"],answer:1,explanation:"의미 있는 변수 이름을 쓰면 숫자의 역할이 보이고, 로봇이나 바닥이 달라질 때 필요한 값만 수정할 수 있습니다.",glossaryId:"variable"},
  {category:"파이썬 문법",question:"기본 속도 60을 변수에 저장하는 올바른 파이썬 문장은 무엇일까요?",options:["60 = base_speed","base_speed == 60","base_speed = 60","set base_speed 60"],answer:2,explanation:"파이썬 변수 선언은 왼쪽에 이름, 등호, 오른쪽에 저장할 값을 씁니다.",glossaryId:"variable"},
  {category:"센서와 기준",question:"base_speed가 의미하는 값은 무엇일까요?",options:["보정이 없을 때 두 모터가 움직이는 기본 속도","검정 바닥의 반사광","직전 반복의 오차","최종 보정값"],answer:0,explanation:"base_speed는 좌우 모터 출력의 출발점이며 correction을 더하거나 빼 방향을 바꿉니다.",glossaryId:"variable"},
  {category:"센서와 기준",question:"현재 반사광을 sensor_value에 저장하는 올바른 코드는 무엇일까요?",options:["sensor_value = target","reflection = sensor_value","color_sensor = reflection()","sensor_value = color_sensor.reflection()"],answer:3,explanation:"color_sensor.reflection()이 현재 반사광을 읽고 그 반환값을 sensor_value에 저장합니다.",glossaryId:"reflection"},
  {category:"센서와 기준",question:"이번 미션에서 오차 error를 구하는 올바른 공식은 무엇일까요?",options:["error = sensor_value + target","error = target - sensor_value","error = target * sensor_value","error = sensor_value - target"],answer:1,explanation:"이번 프로그램의 방향 약속은 target에서 현재 sensor_value를 빼는 것입니다.",glossaryId:"error"},
  {category:"센서와 기준",question:"target이 50이고 sensor_value가 65라면 error는 얼마일까요?",options:["15","115","-15","-115"],answer:2,explanation:"error = target - sensor_value이므로 50 - 65 = -15입니다.",glossaryId:"error"},
  {category:"PD 제어",question:"P 제어값을 구하는 올바른 공식은 무엇일까요?",options:["p_control = kp * error","p_control = kd * change","p_control = target - sensor_value","p_control = base_speed + error"],answer:0,explanation:"P는 현재 오차에 비례하므로 kp와 error를 곱합니다.",glossaryId:"p-control"},
  {category:"PD 제어",question:"error가 10이고 kp가 0.8이라면 p_control은 얼마일까요?",options:["0.08","12.5","18","8"],answer:3,explanation:"p_control = kp × error이므로 0.8 × 10 = 8입니다.",glossaryId:"p-control"},
  {category:"PD 제어",question:"오차 변화량 change를 구하는 올바른 공식은 무엇일까요?",options:["change = previous_error - target","change = error + previous_error","change = error - previous_error","change = kd * error"],answer:2,explanation:"현재 오차에서 직전 오차를 빼야 이번 반복에서 얼마나 변했는지 알 수 있습니다.",glossaryId:"d-control"},
  {category:"PD 제어",question:"error가 8, previous_error가 3, kd가 0.4라면 d_control은 얼마일까요?",options:["1.2","2","4.4","5"],answer:1,explanation:"change는 8 - 3 = 5이고, d_control은 0.4 × 5 = 2입니다.",glossaryId:"d-control"},
  {category:"PD 제어",question:"최종 보정값 correction을 선언하는 올바른 코드는 무엇일까요?",options:["correction = p_control + d_control","correction = base_speed - target","correction = kp + kd","correction = error - sensor_value"],answer:0,explanation:"현재 오차 반응 P와 변화 반응 D를 더해 최종 보정값을 만듭니다.",glossaryId:"correction"},
  {category:"PD 제어",question:"base_speed가 60, correction이 10일 때 왼쪽 70·오른쪽 50이라면 로봇은 어느 쪽으로 회전할까요?",options:["왼쪽","회전하지 않는다","오른쪽","뒤쪽"],answer:2,explanation:"왼쪽 바퀴가 더 빠르면 로봇 몸체는 오른쪽으로 회전합니다.",glossaryId:"correction"},
  {category:"PD 제어",question:"kp를 크게 했을 때 가장 먼저 나타나는 변화는 무엇일까요?",options:["기준값이 자동으로 낮아진다","현재 오차에 대한 반응이 커진다","반복문이 종료된다","센서가 흰색만 읽는다"],answer:1,explanation:"kp가 크면 같은 error에서도 P 보정이 커집니다. 너무 크면 빠르지만 지나치며 흔들릴 수 있습니다.",glossaryId:"p-control"},
  {category:"PD 제어",question:"kd가 로봇에 미치는 주된 영향은 무엇일까요?",options:["기본 속도를 저장한다","검정과 흰색의 평균을 만든다","함수 이름을 바꾼다","오차의 빠른 변화에 대응해 흔들림을 줄인다"],answer:3,explanation:"D는 오차 변화량에 반응해 급격한 방향 변화를 다듬습니다.",glossaryId:"d-control"},
  {category:"센서와 기준",question:"검정과 흰색의 경계 기준값을 선언하는 올바른 코드는 무엇일까요?",options:["target = (black_value + white_value) / 2","target = black_value - white_value","target = white_value * 2","target = sensor_value + error"],answer:0,explanation:"경계 기준값은 검정 반사광과 흰색 반사광의 평균으로 구합니다.",glossaryId:"target"},
  {category:"센서와 기준",question:"검정 반사광이 20, 흰색 반사광이 80이라면 target은 얼마일까요?",options:["20","80","50","100"],answer:2,explanation:"(20 + 80) / 2 = 50입니다.",glossaryId:"target"},
  {category:"센서와 기준",question:"검정 20·흰색 80·target 50일 때 센서값이 30이면 어느 색에 더 가까울까요?",options:["흰색","검정","두 색과 같은 거리","값만으로는 절대 알 수 없다"],answer:1,explanation:"30은 검정값 20과의 차이가 10이고 흰색값 80과의 차이가 50이므로 검정에 더 가깝습니다.",glossaryId:"target"},
  {category:"파이썬 문법",question:"센서 확인과 PD 계산을 함수로 선언하는 이유는 무엇일까요?",options:["함수 안에서는 콜론이 필요 없어서","모든 변수를 삭제하기 위해","여러 동작을 하나의 명령으로 묶어 다시 사용하기 위해","반복문을 한 번만 실행하기 위해"],answer:2,explanation:"함수는 관련 동작을 하나의 이름으로 묶어 필요할 때 호출하고 재사용하게 합니다.",glossaryId:"function"},
  {category:"파이썬 문법",question:"이번 미션의 line_follow 함수를 올바르게 선언한 것은 무엇일까요?",options:["def line_follow(base_speed, target, kp, kd):","function line_follow(base_speed, target, kp, kd)","def = line_follow(base_speed, target, kp, kd)","line_follow def:"],answer:0,explanation:"def, 함수 이름, 괄호 안 매개변수, 마지막 콜론 순서로 선언합니다.",glossaryId:"function"},
  {category:"파이썬 문법",question:"센서 확인과 보정을 계속 반복하는 올바른 파이썬 구조는 무엇일까요?",options:["while True\nsensor_value = color_sensor.reflection()","repeat True:\n    sensor_value = color_sensor.reflection()","while = True:\n    sensor_value = color_sensor.reflection()","while True:\n    sensor_value = color_sensor.reflection()"],answer:3,explanation:"while True: 뒤에는 콜론이 필요하고, 반복할 코드는 다음 줄에서 안쪽으로 들여씁니다.",glossaryId:"loop"},
];
