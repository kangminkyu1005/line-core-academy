const ENTRY_PROMPT = " (아래의 코드 입력)";

export function expressionValue(expression, variables) {
  const numberPattern = "(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+\\-]?\\d+)?";
  const tokens = expression.match(new RegExp(numberPattern+"|[A-Za-z_]\\w*|\\*\\*|//|[()+\\-*/%]","g"));
  if(!tokens || tokens.join("")!==expression.replace(/\s+/g,""))return null;
  let cursor=0;
  const parsePrimary=()=>{
    const token=tokens[cursor++];
    if(token===undefined)return null;
    if(token==="("){
      const value=parseAdditive();
      if(tokens[cursor++]!==")")return null;
      return value;
    }
    if(token==="-"||token==="+"){
      const value=parsePrimary();
      return value===null?null:token==="-"?-value:value;
    }
    if(/^(?:\d|\.)/.test(token))return Number(token);
    return Object.prototype.hasOwnProperty.call(variables,token)?variables[token]:null;
  };
  const parsePower=()=>{
    let value=parsePrimary();
    if(tokens[cursor]==="**"){
      cursor++;
      const right=parsePower();
      if(value===null||right===null)return null;
      value=value**right;
    }
    return value;
  };
  const parseMultiplicative=()=>{
    let value=parsePower();
    while(["*","/","//","%"].includes(tokens[cursor])){
      const operator=tokens[cursor++];
      const right=parsePower();
      if(value===null||right===null||(["/","//","%"].includes(operator)&&right===0))return null;
      if(operator==="*")value*=right;
      else if(operator==="/")value/=right;
      else if(operator==="//")value=Math.floor(value/right);
      else value=((value%right)+right)%right;
    }
    return value;
  };
  function parseAdditive(){
    let value=parseMultiplicative();
    while(tokens[cursor]==="+"||tokens[cursor]==="-"){
      const operator=tokens[cursor++];
      const right=parseMultiplicative();
      if(value===null||right===null)return null;
      value=operator==="+"?value+right:value-right;
    }
    return value;
  }
  const value=parseAdditive();
  return cursor===tokens.length&&value!==null&&Number.isFinite(value)?value:null;
}

export function assignmentExpression(code,name){
  const escaped=name.replace(/[.*+?^{}$()|[\]\\]/g,"\\$&");
  return code.match(new RegExp("^[ \\t]*"+escaped+"(?:[ \\t]*:[^=#\\n]+)?[ \\t]*=[ \\t]*([^#\\n]+)","m"))?.[1]?.trim()??null;
}

function expressionMatches(expression,expected,samples){
  if(!expression)return false;
  return samples.every((values)=>{
    const actual=expressionValue(expression,values);
    return actual!==null&&Math.abs(actual-expected(values))<1e-8;
  });
}

function diagnoseExpression(code,name,label,samples,attempt,targeted){
  const expression=assignmentExpression(code,name);
  if(!expression)return label+": "+name+"에 계산 결과를 저장했는지 확인해 보세요.";
  if(expressionValue(expression,samples[0])===null)return label+": 변수 이름의 철자와 괄호가 올바른지 살펴보세요.";
  return attempt>1?label+": "+targeted:label+": 사용한 연산자와 값의 순서를 다시 생각해 보세요.";
}

function commentHasLabel(comment,label){
  const clean=comment.replace(" (아래 줄에 코드 입력)","").replace(ENTRY_PROMPT,"").trim();
  return clean===label||clean.startsWith(label+" ")||clean.startsWith(label+":")||clean.startsWith(label+"：")||clean.startsWith(label+" -")||clean.startsWith(label+" (");
}

export function validateCode(id,code,attempt=1){
  const executable=code.split("\n").filter((line)=>!line.trimStart().startsWith("#")).join("\n");
  const compact=executable.replace(/\s+/g,"");
  const has=(snippet)=>compact.includes(snippet.replace(/\s+/g,""));
  if(id===0){
    const expected=["센서 확인","오차 계산","방향 보정","반복"];
    const comments=code.split("\n").map((line)=>line.match(/^\s*#\s*(.+?)\s*$/)?.[1]??"").filter(Boolean);
    let commentCursor=-1;
    const inOrder=expected.every((label)=>{
      const next=comments.findIndex((comment,index)=>index>commentCursor&&commentHasLabel(comment,label));
      if(next<0)return false;
      commentCursor=next;
      return true;
    });
    const missing=inOrder?[]:[attempt>1?"미션 키워드의 # 센서 확인 → # 오차 계산 → # 방향 보정 → # 반복을 같은 순서로 작성해 보세요.":"미션 키워드에 제시된 네 역할 주석을 순서대로 작성해 보세요."];
    return {passed:missing.length===0,missing};
  }

  if(id===1){
    const value=(name,variables={})=>{
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
    const missing=[];
    if(black===null||white===null)missing.push("반사광 측정: black_value와 white_value에 0~100 사이 측정값을 저장해 보세요.");
    else if(black<0||black>100||white<0||white>100||black>=white)missing.push("반사광 측정: 검정값은 흰색값보다 작아야 하며 두 값 모두 0~100 범위여야 해요.");
    if(baseSpeed===null||baseSpeed<=0||baseSpeed>100)missing.push("기본 속도: base_speed에 로봇이 안전하게 움직일 1~100 사이 값을 선택해 보세요.");
    if(target===null||black===null||white===null||!usesMeasurements||Math.abs(target-(black+white)/2)>1e-8)missing.push("센서 기준값: target을 black_value와 white_value의 평균을 구하는 식으로 작성해 보세요.");
    if(kp===null||kp<=0||kp>3)missing.push("P 계수: kp에는 0보다 크고 3 이하인 조절값을 선택해 보세요.");
    if(kd===null||kd<0||kd>2)missing.push("D 계수: kd에는 0 이상 2 이하인 조절값을 선택해 보세요.");
    return {passed:missing.length===0,missing};
  }

  if(id===2){
    const lines=executable.split("\n");
    const functionLine=lines.findIndex((line)=>{
      const match=line.match(/^\s*def\s+line_follow\s*\((.*)\)\s*:\s*(?:#.*)?$/);
      if(!match)return false;
      const parameters=match[1].split(",").map((parameter)=>parameter.trim().split(/[:=]/,1)[0].trim());
      return parameters.join(",")==="base_speed,target,kp,kd";
    });
    const whileIndex=lines.findIndex((line)=>/^\s*while\s*\(?\s*True\s*\)?\s*:\s*(?:#.*)?$/.test(line));
    const previousIndex=lines.findIndex((line,index)=>index>functionLine&&index<whileIndex&&Math.abs(expressionValue(assignmentExpression(line,"previous_error")??"",{})??Infinity)<1e-8);
    const sensorIndex=lines.findIndex((line,index)=>index>whileIndex&&/^\s*sensor_value\s*=\s*color_sensor\s*\.\s*reflection\s*\(\s*\)\s*(?:#.*)?$/.test(line));
    const indent=(index)=>index<0?0:(lines[index].match(/^\s*/)?.[0].replace(/\t/g,"    ").length??0);
    const checks=[
      ["함수 선언",functionLine>=0,"미션 키워드의 line_follow 이름과 base_speed, target, kp, kd 매개변수 순서, 마지막 콜론을 확인해 보세요."],
      ["이전 오차 초기화",previousIndex>functionLine&&previousIndex<whileIndex&&indent(previousIndex)>indent(functionLine),"첫 반복 전, 함수 안에서 previous_error를 0으로 시작했는지 확인해 보세요."],
      ["반복 구조",whileIndex>previousIndex&&indent(whileIndex)>indent(functionLine),"while True 뒤의 콜론과 함수 안쪽 들여쓰기를 확인해 보세요."],
      ["센서 읽기",sensorIndex>whileIndex&&indent(sensorIndex)>indent(whileIndex)&&has("color_sensor.reflection()"),"센서 읽기 결과가 sensor_value에 저장되고 반복문 안에 있는지 확인해 보세요."],
    ];
    const missing=checks.filter(([,passed])=>!passed).map(([label,,detail])=>label+": "+detail);
    return {passed:missing.length===0,missing};
  }

  const formulaChecks=id===3?[
    ["error","오차 계산",(v)=>v.target-v.sensor_value,[{target:50,sensor_value:40},{target:42,sensor_value:65},{target:61,sensor_value:18}],"target에서 sensor_value를 빼는 순서인지 확인해 보세요."],
    ["p_control","P 제어",(v)=>v.kp*v.error,[{kp:.8,error:10},{kp:1.2,error:-4},{kp:.35,error:7}],"kp와 error를 곱해 반응 크기를 만들었는지 확인해 보세요."],
  ]:id===4?[
    ["change","변화량",(v)=>v.error-v.previous_error,[{error:8,previous_error:3},{error:-2,previous_error:4},{error:1,previous_error:-7}],"현재 error에서 previous_error를 빼는 순서인지 확인해 보세요."],
    ["d_control","D 제어",(v)=>v.kd*v.change,[{kd:.3,change:5},{kd:.5,change:-6},{kd:.15,change:9}],"kd와 change를 곱했는지 확인해 보세요."],
  ]:[
    ["correction","PD 결합",(v)=>v.p_control+v.d_control,[{p_control:8,d_control:1.5},{p_control:-4,d_control:2},{p_control:.5,d_control:-3}],"P와 D의 두 반응을 더했는지 확인해 보세요."],
    ["left_power","왼쪽 출력",(v)=>v.base_speed+v.correction,[{base_speed:60,correction:10},{base_speed:55,correction:-7},{base_speed:42,correction:3.5}],"기준 속도에 correction을 더했는지 확인해 보세요."],
    ["right_power","오른쪽 출력",(v)=>v.base_speed-v.correction,[{base_speed:60,correction:10},{base_speed:55,correction:-7},{base_speed:42,correction:3.5}],"왼쪽과 반대 부호로 correction을 적용했는지 확인해 보세요."],
    ["previous_error","이전 오차 저장",(v)=>v.error,[{error:7},{error:-3},{error:.5}],"이번 error를 다음 반복을 위해 저장했는지 확인해 보세요."],
  ];
  const missing=formulaChecks.filter(([name,,expected,samples])=>!expressionMatches(assignmentExpression(executable,name),expected,samples)).map(([name,label,,samples,targeted])=>diagnoseExpression(executable,name,label,samples,attempt,targeted));
  if(id===5){
    if(!has("left_motor.dc(left_power)"))missing.push("왼쪽 모터 연결: 계산한 left_power가 왼쪽 모터에 전달되는지 확인해 보세요.");
    if(!has("right_motor.dc(right_power)"))missing.push("오른쪽 모터 연결: 계산한 right_power가 오른쪽 모터에 전달되는지 확인해 보세요.");
  }
  return {passed:missing.length===0,missing};
}
