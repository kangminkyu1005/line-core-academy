const driveBaseSetup = `from pybricks.hubs import PrimeHub
from pybricks.parameters import Direction, Port
from pybricks.pupdevices import Motor
from pybricks.robotics import DriveBase
from pybricks.tools import wait


# 로봇 설정: 사용하는 로봇에 맞게 포트와 크기를 확인하세요.
hub = PrimeHub()

left_motor = Motor(
    Port.B,
    Direction.COUNTERCLOCKWISE
)

right_motor = Motor(
    Port.A,
    Direction.CLOCKWISE
)

drive_base = DriveBase(
    left_motor,
    right_motor,
    wheel_diameter=56,
    axle_track=160
)`;

const straightFunction = `def gyro_straight(speed, distance_cm):

    # 자이로 사용
    drive_base.use_gyro(True)

    # 학생 속도 100 = 실제 500mm/s
    drive_base.settings(
        straight_speed=abs(speed) * 5
    )

    # cm를 mm로 변환
    distance_mm = distance_cm * 10

    # 음수 속도이면 후진
    if speed < 0:
        distance_mm = -distance_mm

    # 이동
    drive_base.straight(distance_mm)
    wait(100)`;

const turnFunction = `def gyro_turn(speed, angle_deg):

    # 자이로 사용
    drive_base.use_gyro(True)

    # 학생 속도 100 = 실제 300deg/s
    drive_base.settings(
        turn_rate=abs(speed) * 3
    )

    # 음수 속도이면 왼쪽 회전
    if speed < 0:
        angle_deg = -angle_deg

    # 회전
    drive_base.turn(angle_deg)
    wait(100)`;

const lineSetup = `from pybricks.hubs import PrimeHub
from pybricks.parameters import Direction, Port
from pybricks.pupdevices import Motor, ColorSensor
from pybricks.robotics import DriveBase
from pybricks.tools import wait


# 로봇 설정: 사용하는 로봇에 맞게 포트와 크기를 확인하세요.
hub = PrimeHub()

left_motor = Motor(
    Port.B,
    Direction.COUNTERCLOCKWISE
)

right_motor = Motor(
    Port.A,
    Direction.CLOCKWISE
)

color_sensor = ColorSensor(Port.D)

drive_base = DriveBase(
    left_motor,
    right_motor,
    wheel_diameter=56,
    axle_track=160
)`;

const lineFunction = `def line_follow_pd(speed, distance_cm, line_side=1):

    # 라인 팔로잉에서는 자이로를 사용하지 않습니다.
    drive_base.use_gyro(False)

    # 이동 거리 초기화
    drive_base.reset()

    # 목표 반사광
    target = 50

    # PD 값
    kp = 1.0
    kd = 5.0

    # 처음 오차
    previous_error = (
        color_sensor.reflection() - target
    )

    # 목표 거리까지 반복
    while abs(drive_base.distance()) < distance_cm * 10:

        # 반사광 읽기
        reflection = color_sensor.reflection()

        # 오차 계산
        error = reflection - target

        # P 제어
        p = kp * error

        # D 제어
        d = kd * (
            error - previous_error
        )

        # 조향값
        correction = p + d
        correction = correction * -line_side

        # 후진하면 조향 방향 반전
        if speed < 0:
            correction = -correction

        # 너무 큰 회전값 제한
        correction = max(
            -180,
            min(180, correction)
        )

        # 학생 속도 100 = 실제 500mm/s
        drive_base.drive(
            speed * 5,
            correction
        )

        # 현재 오차 저장
        previous_error = error

        # 0.01초마다 반복
        wait(10)

    # 정지
    drive_base.brake()`;

export const functionReferences = {
  straight: {
    eyebrow: "GYRO STRAIGHT · READY TO COPY",
    title: "전진·후진 함수",
    description: "양수 속도는 전진, 음수 속도는 후진으로 이동하는 자이로 직진 함수입니다.",
    functionName: "gyro_straight",
    code: `${driveBaseSetup}\n\n\n# 자이로 직진 / 후진\n${straightFunction}\n\n\n# 사용 예시\n# gyro_straight(50, 100)\n# gyro_straight(-50, 50)`,
  },
  line: {
    eyebrow: "PD LINE FOLLOWING · READY TO COPY",
    title: "라인 함수",
    description: "컬러 센서의 반사광과 PD 제어를 이용해 지정한 거리만큼 라인을 따라갑니다.",
    functionName: "line_follow_pd",
    code: `${lineSetup}\n\n\n# PD 라인 팔로잉\n${lineFunction}\n\n\n# 사용 예시\n# line_follow_pd(50, 100)\n# line_follow_pd(50, 100, -1)`,
  },
  turn: {
    eyebrow: "GYRO TURN · READY TO COPY",
    title: "회전 함수",
    description: "양수 속도는 오른쪽, 음수 속도는 왼쪽으로 회전하는 자이로 회전 함수입니다.",
    functionName: "gyro_turn",
    code: `${driveBaseSetup}\n\n\n# 자이로 회전\n${turnFunction}\n\n\n# 사용 예시\n# gyro_turn(90, 90)\n# gyro_turn(-90, 90)`,
  },
};
