# 베이스 학습 도구 시장 리서치 + BocchiMaster v2 개선 방향

> 작성일: 2026-04-29
> 목적: BocchiMaster v2의 다음 방향(현 보강 vs 부분/전체 갈아엎기) 결정에 필요한 외부 컨텍스트 + 페다고지 정리

---

## A. 시장 조사 — 경쟁/참고 도구

### A-1. Songsterr
- **포지션**: 베이스 탭 디지털 플레이어의 사실상 표준. 100만+ 곡, 멀티트랙(guitar/bass/drums), 슬로우다운, 루프, 솔로 모드.
- **데이터 소스**: 전통적으로 **사람이 만든 Guitar Pro 파일을 자체 포맷으로 임포트**. 2024년 이후 "Songsterr AI" 기능 추가 — YouTube 링크에서 자동 트랜스크립션, **프리미엄 한정 + 사용자 검수 후 게시**(자동 게시 X).
- **UX 패턴**: 마디 그리드 위에 탭 + 위쪽에 코드 심볼 + 박자 클릭(메트로놈). 재생 헤드가 마디를 따라 스크롤, 현재 위치 강조.
- **베이스 학습 핵심**: (1) 정확한 사람-검증 탭, (2) 트랙 솔로/뮤트, (3) 마디 단위 루프.
- **모방할 만한 부분**:
  - **마디 그리드 + 코드 심볼 헤더** — 우리의 ChordTimeline을 가변폭 박스에서 마디 단위로 양자화하면 비슷한 느낌이 나옴.
  - **트랙 솔로/뮤트** — 우리의 Stem Mixer가 이미 보유. 우위.
  - **AI 자동 탭은 신뢰도가 곡마다 다르고 사용자 검수가 필수** — 우리가 v1/v2 자동추출을 폐기한 결정과 일치. 완전 자동화는 아직 시기상조.

### A-2. Yousician
- **포지션**: 게임화된 1대1 튜터. 기타/베이스/우쿨렐레/피아노/보컬 통합. 마이크로 사용자 연주를 듣고 실시간 채점.
- **베이스 모드**: 풀 지원. **±15 cents 피치 + ±120ms 타이밍** 윈도우로 success/miss 판정.
- **UX 패턴**: 5선보 + 탭 콤보, 노트가 우측에서 좌측으로 흐르는 "기타히어로" 스크롤. 라이트 차임 효과음으로 success 피드백.
- **약점**: 디스토션 + 복잡한 코드일수록 false positive 다수. 베이스 저음 영역(E1~)에서 마이크 픽업이 약함.
- **모방할 만한 부분**:
  - **실시간 피치 감지 → 노트 단위 채점** — 기타히어로 패러다임. 우리가 구현하면 차별화 큼. WebMIDI는 이미 있고, Web Audio API + autocorrelation 또는 CREPE 모델로 마이크 입력도 가능.
  - **±cents/ms 윈도우 명시** — 사용자에게 정량적 피드백 제공.
  - **"노트가 흘러오는" 시각** — TabView를 정적 그리드에서 동적 스크롤로 바꾸는 방향.

### A-3. Rocksmith+
- **포지션**: Ubisoft 구독형($14.99/월). PC/iOS/Android/PS, 진도 동기화. 성인 학습자 진지한 코스워크 지향.
- **베이스 학습**: 슬랩/팝 등 기법별 챕터, 베이스 라인 분석 후 다음 곡 추천.
- **하드웨어**: 과거에는 Real Tone Cable(1/4" → USB) 필수였으나, Rocksmith+에서는 **모바일 마이크 픽업으로 대체 가능**.
- **UX 패턴**: 네크 시점 3D 프렛보드 + 노트 하이라이트. 비주얼이 학습자에게 "어디를 짚는지"를 직접 알려줌.
- **모방할 만한 부분**:
  - **3D 또는 사선 시점 프렛보드** — 우리의 평면 SVG보다 직관적. 다만 베이스는 4현이라 평면도 충분, 우선순위 낮음.
  - **기법별 커리큘럼** — 우리의 Curriculum 슬롯에 채워 넣을 콘텐츠. 슬랩/뮤트/고스트 노트/16비트.
  - **추천 시스템**(연주한 곡의 패턴 분석 → 비슷한 난이도/기법 다음 곡 제안) — 1인 사용자에게는 과잉. 후순위.

### A-4. Moises.ai
- **포지션**: "스템 분리"의 대명사. AnyKey, 코드 디텍션, 피치/속도 변경, 가사 트랜스크립션.
- **2026 업데이트**: Hi-Fi 2-stem 모델(Pro), 가사 트랜스크립션 5초 미만.
- **코드 디텍션**: easy/medium/advanced 3레벨 — easy는 메이저/마이너만, advanced는 9th/sus 등까지. 사용자 선택 가능.
- **베이스 실용성**: 베이스 사용자 사이에서 "복잡한 베이스 라인 학습 속도 3배" 인용이 많음. 단, 정확한 운지를 알려주진 않음 — 본인이 듣고 따라야 함.
- **모방할 만한 부분**:
  - **코드 디텍션 난이도 레벨** — 우리도 ChordTimeline에 "단순화 토글"을 두면 초보자에게 친숙. `A♯/3`을 `A♯`으로 합치거나, `Cmaj7`을 `C`로 단순화.
  - **피치 시프트 + 속도 변경** — Web Audio API의 `playbackRate`와 phase vocoder. YouTube 임베드는 자체 속도 조절(0.25/0.5/0.75/1/1.25/1.5/2x)을 이미 제공하므로 부분 충족. 피치 시프트는 별도.
  - **이미 우리가 위임한 영역**: AudioChord(Crema)가 코드 디텍션, Demucs가 스템 분리. 차별점은 우리가 *자체 학습 워크플로*에 통합한다는 점이고, Moises는 "도구 모음".

### A-5. Soundslice
- **포지션**: 음악 교사용 인터랙티브 악보 플랫폼. 텍스트 탭/Guitar Pro/MusicXML 임포트 → 웹 플레이어.
- **UX 패턴**: 5선보/탭/지법/가사/코드명 토글. 프렛보드 비주얼라이저(노트 점등). 마디 위에 코드 다이어그램.
- **차별점**: **코드 차트 뷰** — 노트/탭 숨기고 코드만 큰 글씨로. "송북" 모드.
- **모방할 만한 부분**:
  - **레이어 토글** — 사용자가 학습 단계에 따라 정보량을 조절. 초보는 코드만, 중급은 코드+루트 음, 상급은 풀 탭.
  - **코드 차트 뷰** — 우리 ChordTimeline이 이미 비슷한 컨셉. 더 크게/단순하게 만든 "Stage Mode 코드 전용" 분리하면 라이브 연주에 적합.

### A-6. Ultimate Guitar Pro
- **포지션**: 100만+ 탭 라이브러리, 사용자 투고. Pro 구독으로 인터랙티브 플레이어.
- **UX 패턴**: 탭/코드 토글, 멀티트랙, 트랜스포지션, 백킹 트랙(파트 솔로/뮤트), 무한 코드 변형 라이브러리.
- **모방할 만한 부분**:
  - **트랜스포지션** — 베이스 학습에 유용. 키 변경 슬라이더 1개만 달면 됨.
  - **무한 코드 변형** — 1코드에 5~10개 운지법. 우리는 현재 fretboard에 운지 표시 데이터가 비어있음. 향후 ChordTimeline 클릭 시 fretboard에 운지 표시 가능.

### A-7. 일본 베이스 앱 / 結束バンド 컨텐츠
- 일본 전용 "베이스 학습 앱"은 사실상 부재. 결속밴드 등 J-rock 베이스 탭은 모두 Songsterr / Ultimate Guitar에 사용자 투고로 존재.
- **시사점**: 일본 음악(애니/J-rock) 타깃은 **컨텐츠 차별점이 아님** — 글로벌 탭 사이트가 이미 커버. 우리가 이걸로 차별화하기 어려움. 대신 **사용자가 원하는 곡(YouTube)을 어떻게 빠르게 학습 콘텐츠로 변환하느냐**가 차별점.

### A-8. 페다고지 도구 (StudyBass, BassBuzz, TalkingBass, Fretonomy)
- **StudyBass.com**: 무료 인터랙티브 베이스 레슨. 텍스트 + 다이어그램 위주, 비디오 적음. 이론적 깊이가 가장 큼 — 모드, 인터벌, 펜타토닉 5포지션.
- **BassBuzz**: 비디오 코스 + 커뮤니티(포럼). "Beginner to Badass"가 대표. 60일 커리큘럼.
- **TalkingBass**: Mark Smith의 깊이 있는 코스. 펜타토닉 5포지션 + 워킹 베이스 + 시창.
- **Fretonomy / Fret Trainer / Bass Guitar Note Trainer**: 마이크/MIDI로 프렛 위치 인식 게임. 정량 측정. **베이스 4/5/6현 모두 지원**, 9가지 문제 유형.
- **모방할 만한 부분**:
  - **노트 인식 미니게임** — 우리 Drills 슬롯에 적합. WebMIDI 입력 받아서 "C 음을 5초 내 짚어라". 게이미피케이션 효과 큼.
  - **펜타토닉 5포지션 차트** — fretboard 오버레이로 추가 가능. 곡의 키에 따라 자동 표시.

---

## B. 베이스 학습 페다고지

### B-1. 초~중급 베이스 학습 순서 (전문가 합의)
1. **루트 노트 + 옥타브** — 음 이름과 프렛 위치 매핑. 한 줄(E or A 줄)부터 시작.
2. **메이저 스케일 + 리듬 베이스 라인** — 1-3-5-8 (루트-3rd-5th-옥타브) 패턴.
3. **펜타토닉 5포지션** — 마이너 펜타토닉 1번 박스(루트-단3-4-5-단7) → 메이저 펜타토닉 → 5포지션 연결.
4. **모드 / 코드톤 아르페지오** — 코드 진행 위에 어울리는 노트 선택.
5. **워킹 베이스 / 패턴 변주** — 코드 톤 + 통과음 + 크로마틱 어프로치.

### B-2. 청음 vs 탭 — 어느 쪽이 효과적인가
- 음악 인지 연구는 **청음 위주가 청각-운동 결합을 더 강화**한다고 봄. 하지만 학습자 의욕 유지에는 탭이 빠른 보상을 줌.
- 전문가 합의: **양쪽 모두 사용**. 초기에는 탭으로 진입 장벽 낮추고, 그 다음에 같은 곡을 청음으로 다시 따라치기.
- 베이스는 **리듬이 본질**이라 탭의 약점(리듬 표기 빈약)이 특히 큼. 5선보 또는 박자 그리드 + 탭 조합이 베이스에 적합.
- 우리의 ChordTimeline은 **리듬 정보를 시간으로 직접 보여주는** 강점이 있음 — 탭의 리듬 약점을 반대로 메우는 도구.

### B-3. "코드 진행만 보고 베이스 라인 만들기" 트레이닝 방법론
사용자가 결정한 피벗(자동 탭 폐기 → 코드만)은 페다고지적으로 **올바른 방향**. 표준 단계:

1. **루트 따라가기 (Stage 1)** — 각 코드의 루트만 1박씩 연주. `│ G - - - │ D - - - │ Em - - - │`
2. **루트 + 옥타브 (Stage 2)** — `│ G(low)-G(high) │ D-D │` 4박이면 1-1-옥타브-옥타브.
3. **루트 + 5도 (Stage 3)** — 컨트리/락 표준 패턴. `│ G-D-G-D │`
4. **아르페지오 (Stage 4)** — 1-3-5-8 패턴을 코드별로.
5. **코드 톤 + 통과음 (Stage 5)** — 다음 코드 루트로 향하는 크로마틱/스케일 통과음.
6. **자유 워킹 (Stage 6)** — 재즈 스탠다드 풍.

이 순서는 **현 ChordTimeline을 그대로 활용**하면서 단계만 위에 얹으면 됨. "이 곡을 Stage 2로 연주해" → 화면에 루트+옥타브 가이드 라인이 자동 생성.

---

## C. BocchiMaster v2 평가 (베이스 학습 관점)

### 강점
- **YouTube 임베드 + sync 슬라이더**: 사용자가 좋아하는 곡으로 즉시 학습. 컨텐츠 무한대.
- **Stem Mixer**: "베이스만 빼고 합주" 시나리오는 베이스 학습의 **킬러 기능**. Moises 유료 Pro 수준을 자체 인프라(AudioChord)로 무료 제공.
- **ChordTimeline**: 코드 진행을 시간축으로 직관 표시. 클릭 → seek는 **마디 루핑**의 기반.
- **키오스크 셸 + StageMode**: 헤르타 PC가 HDMI로 TV에 연결 = **베이스 안고 소파에 앉아 TV 보면서 연습**이라는 독특한 폼팩터. 다른 도구가 거의 못 하는 환경.
- **사용자 1인 운영**: UX/페다고지 결정이 빠름. A/B 테스트 부담 없음.

### 약점
- **자동 탭 추출 폐기**: 정확한 운지 가이드 부재. 사용자가 코드만 보고 알아서 베이스 라인을 구성해야 함 — 초보~중하급에게는 진입 장벽.
- **실시간 피드백 부재**: Yousician/Rocksmith의 "지금 연주가 맞나?" 채점 없음. WebMIDI는 있지만 활용 안 됨.
- **마디/박자 그리드 부재**: ChordTimeline은 시간폭 비례 박스 — 마디 단위 양자화가 안 되면 "이 코드를 4박 동안" 같은 학습 단위가 모호.
- **페다고지 단계 부재**: Curriculum 슬롯이 비어있음. 학습자가 어느 단계인지 시스템이 모름.
- **드릴/게이미피케이션 부재**: Drills 슬롯도 비어있음. 노트 인식, 인터벌 청음 등 5분짜리 미니게임이 없음.
- **운지 표시 부재**: ChordTimeline 코드를 클릭해도 fretboard에 추천 운지가 표시되지 않음.

### 핵심 진단
> **"코드만 출력해주는 게 낫다"는 사용자 결정은 옳다.** 자동 탭 추출은 정확도 한계로 시기상조. 대신 **"코드 진행 + 가이드 라인 + 청음 + 실시간 채점"** 4축으로 페다고지를 강화하는 게 현 자산을 살리면서 차별화하는 길.

---

## D. 개선 방향 권고

### 시나리오 비교

| 항목 | (1) 현 v2 보강 | (2) 부분 갈아엎기 | (3) 완전 갈아엎기 |
|---|---|---|---|
| **요지** | ChordTimeline + 마디 그리드 + 가이드 라인 + 청음 모드를 **추가**. 기존 코드 80% 유지 | ChordTimeline/Stem Mixer/Fretboard만 핵심으로 남기고 학습 페다고지에 맞춰 IA 재구조화. **Stages/Drills 시스템 신설** | 처음부터 "청음 우선 + 코드 캡차" 컨셉. YouTube + AudioChord 인프라만 재사용, UI/UX 백지부터 |
| **작업 규모** | 소~중 (2~3주, PR 5~7개) | 중~대 (4~6주, PR 10~15개) | 대 (2~3개월, 전면 재설계) |
| **학습 효과** | 보통 — 가이드 라인 추가로 초보 진입 장벽 ↓. 단, 페다고지 단계가 명시적이지 않으면 사용자가 어느 단계인지 모름 | 큼 — Stage 1~6이 명시되어 학습 진척도 가시화. WebMIDI 채점이 들어가면 Yousician 수준 도달 | 큼 (방향이 맞다면) — 단, 청음 우선은 호불호 큰 컨셉. 사용자가 진심으로 청음 학습을 원하는지 검증 필요 |
| **차별화 포인트** | "내 곡 + 스템 + 코드 + TV 키오스크" — 현 자산 그대로. 다만 신규성은 약함 | "Stages 시스템 + WebMIDI 채점" — Yousician/Rocksmith 베이스 모드와 정면 경쟁 가능. 무료 + 자기 곡 import는 강점 | "코드 캡차 / 가이드 라인 청음" — 시장에 거의 없는 컨셉. 페르소나가 1인이라 모험 가능. 단, 대중성은 낮을 수 있음 |
| **위험** | 낮음 — 기존 사용 흐름 깨지지 않음. 그러나 "그대로 유지하면 영원히 미완성" 위험 | 중간 — 기존 곡 데이터(13곡 메타데이터)는 살지만 IA 변경으로 사용자 재학습 부담. 1인 사용자라 큰 부담은 아님 | 큼 — 백지부터라 매몰비용. 한 번 더 피벗하면 의욕 소실. 단, Stitch v2 디자인 자산이 있다면 줄어듦 |
| **첫 출시까지** | 1주 (가이드 라인 + 마디 그리드만 우선) | 2주 (Stage 1~3만 우선) | 4주+ |

### 권고 (1줄)

> **시나리오 (2) 부분 갈아엎기 — Stages 시스템(루트→옥타브→5도→아르페지오) + 마디 그리드 + WebMIDI 채점**을 단계적으로 추가. 현 ChordTimeline/Stem Mixer/키오스크 셸은 그대로 유지.

근거:
- (1)은 안전하지만 차별점 약함. 1인 도구라도 "왜 이걸 만들었나" 동기 부여가 필요.
- (3)은 모험 비용이 너무 큼. 직전 두 번의 자동 탭 추출 폐기 후 또 한 번의 완전 피벗은 피로.
- (2)는 현 자산의 강점(스템 + 코드 + TV)을 살리면서 페다고지(Stages)와 게이미피케이션(채점)을 더하는 균형점.

---

## 첫 PR 단위 todo (5~7개, 의존성 순)

작업 권장 순서. 각 PR은 1~3일 분량으로 잡고, 사용자가 매 PR 후 실연습으로 검증.

- [ ] **PR-1: 마디 그리드 양자화** — AudioChord `/api/v1/analyze/beats`로 비트 추출 → BPM + 박자 시그너처 추정 → ChordTimeline의 가변폭 박스를 마디 단위로 재정렬. `│ A♯ │ F♯m │ ...` 형태. (Phase 2 이미 backlog에 있음, 이걸 1순위로)

- [ ] **PR-2: Stages 토글 (UI만)** — ChordTimeline 위에 Stage 1~6 토글 버튼. 선택 시 화면에 가이드 라인 텍스트만 변경 ("Stage 1: 각 마디 첫 박에 루트만"). 실제 베이스 라인 생성은 PR-3에서.

- [ ] **PR-3: 가이드 라인 자동 생성 (Stage 1~3)** — 각 마디의 코드 → 베이스 라인 노트 시퀀스 생성. Stage 1: 루트 4분음. Stage 2: 루트-옥타브-루트-옥타브. Stage 3: 루트-5도-루트-5도. 결과를 fretboard 위에 활성 노트로 표시 + TabView 마디 그리드에 탭 숫자 채움.

- [ ] **PR-4: 운지 추천 (코드 → 베이스 프렛)** — 각 코드 루트의 가장 합리적 프렛 선택(이전 마디 루트와 거리 최소화 = 휴먼리스틱). fretboard에 점등, 마우스 호버 시 다른 옵션 표시.

- [ ] **PR-5: WebMIDI 채점 (Stage 1만)** — 사용자가 베이스→오디오인터페이스→WebMIDI(또는 마이크 + autocorrelation) 입력. Stage 1 가이드 라인의 정답 노트와 비교 → ±50ms / 정확/근사/오답 3단계 시각 피드백. 곡 끝나면 "정확도 78%" 요약.

- [ ] **PR-6: Drills 슬롯 채우기 — 프렛 노트 인식 미니게임** — 키오스크 좌측 레일의 Drills 뷰에 "랜덤 노트 5초 안에 짚기" 게임. WebMIDI 입력. 베이스 4현 한정으로 시작. 스코어/스트릭 표시.

- [ ] **PR-7: Stage 4~6 + 사용자 진척도** — 아르페지오/통과음/워킹 추가. 곡별로 "Stage X 클리어" 마킹 → Curriculum 뷰에 진척도 표시. 곡 13개 × Stage 6 = 78개 미니 골.

---

### 메모: 작업 시 유의사항
- 새 기능 추가할 때마다 **Playwright 1440x900 + 1920x1080 두 해상도 모두** 검증 (현 v2 컨벤션).
- 로컬 컴포넌트 변경은 `vite preview`만으로 즉시 반영, 서비스 재시작 불필요 (CLAUDE.md 메모).
- Stage 가이드 라인 생성 로직은 클라이언트에서 처리 (코드 입력 → 노트 시퀀스). 서버 라운드트립 불필요.
- WebMIDI 채점은 1인 사용 환경에서 **헤르타 PC에 USB MIDI 인터페이스 연결** 가정. 마이크 fallback은 우선순위 낮음.

---

## Sources

### 시장 조사
- [Songsterr AI bass tab feature (TalkBass)](https://www.talkbass.com/threads/songsterr-recently-released-an-automated-ai-tab-writing-feature.1667303/)
- [Songsterr Bass Tabs](https://www.songsterr.com/?inst=bass)
- [Yousician Bass Mode](https://yousician.com/bass)
- [Yousician AI Music Learning](https://tools.aiformusic.org/knowledgebase/articles/yousician-interactive-ai-driven-music-learning-for-guitar-piano-ukulele-bass-voice)
- [Rocksmith+ Bass Lessons](https://www.ubisoft.com/en-us/game/rocksmith/plus/bass-lessons)
- [Rocksmith+ Hands-On Review (Rolling Stone)](https://www.rollingstone.com/product-recommendations/electronics/rocksmith-plus-ubisoft-pc-review-1234595472/)
- [Moises AI Review 2026 (StemSplit)](https://stemsplit.io/blog/moises-ai-review)
- [Moises AI Review 2026 (AISongCreator)](https://aisongcreator.pro/blog/moises-ai-review-2026)
- [Soundslice Features](https://www.soundslice.com/features/)
- [Soundslice Chord Chart View](https://www.soundslice.com/blog/21/new-chord-chart-view-and-more/)
- [Ultimate Guitar Pro](https://www.ultimate-guitar.com/pro/)
- [Ultimate Guitar Pro Review 2026 (GuitarChalk)](https://www.guitarchalk.com/ultimate-guitar-pro-review/)
- [Kessoku Band on Songsterr](https://www.songsterr.com/a/wsa/kessoku-band-distortion-bass-tab-s529885)
- [Kessoku Band on Ultimate Guitar](https://www.ultimate-guitar.com/artist/1860563)

### 베이스 페다고지
- [How To REALLY Learn PENTATONIC Scales on Bass (TalkingBass)](https://www.talkingbass.net/how-to-really-learn-pentatonic-scales-on-bass/)
- [5 Pentatonic Positions You NEED to Learn (TalkingBass)](https://www.talkingbass.net/5-pentatonic-positions-need-learn/)
- [4 Essential Bass Guitar Scales (Fender)](https://www.fender.com/articles/scales/bass-guitar-scales-for-beginners)
- [Pentatonic Scales for Bass (BassBuzz)](https://www.bassbuzz.com/lessons/bass-pentatonics)
- [One-Octave Major Pentatonic (StudyBass)](https://www.studybass.com/lessons/bass-scales/one-octave-major-pentatonic-scale/)
- [Notation vs Tab (StudyBass)](https://www.studybass.com/lessons/reading-music/notation-vs-tab/)
- [Learning bass by ear or theory (For Bass Players Only)](https://forbassplayersonly.com/learning-bass-by-ear-or-by-studying-theory/)
- [How to Write a Bass Line in 5 Steps (MasterClass)](https://www.masterclass.com/articles/how-to-write-a-bass-line)
- [How to Craft Bass Lines Over Chord Progressions (Online Bass Courses)](https://onlinebasscourses.com/bass-line-creation/how-to-craft-amazing-bass-lines-over-chord-progressions/)
- [Creating Bass Lines – Chord Tones (TalkingBass)](https://www.talkingbass.net/creating-bass-lines-2-chord-tones/)

### 청음/드릴 도구
- [Functional Ear Trainer](https://apps.apple.com/us/app/functional-ear-trainer/id1088761926)
- [Best Ear Training Apps for Bass 2026 (Posidovega)](https://posidovega.com/best-ear-training-apps)
- [Fretonomy](https://fretonomy.com/)
- [Bass Guitar Note Trainer (Google Play)](https://play.google.com/store/apps/details?id=com.punktumsoft.android.bassguitarnotetrainer)
- [FretMaster (Google Play)](https://play.google.com/store/apps/details?id=org.fretmaster)
