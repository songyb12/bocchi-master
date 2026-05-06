# Bass Tone Making — 종합 가이드

> 베이스 소리를 카테고리로 이해하고, 주법 + 톤 세팅으로 원하는 소리를 만들기 위한 가이드.
> UFS 엔지니어 관점(신호처리 비유)으로 정리.

---

## 0. 큰 그림 — 신호 체인

베이스 소리는 **5단 직렬 파이프라인**. 각 단이 주파수 스펙트럼/엔벨로프를 변형.

```
[1] 손가락/픽 (입력 파형)
     ↓
[2] 현 + 프렛 + 우드 (1차 공명)
     ↓
[3] 픽업 위치 (어디서 샘플링하느냐 = 어느 하모닉이 잡히느냐)
     ↓
[4] 베이스 본체 EQ (능동/수동 회로)
     ↓
[5] 시그널 체인: 컴프 → 오드/디스토션 → 앰프 EQ → 캐비넷 → 마이크
```

귀가 약하면 **각 단에서 무엇이 바뀌는지 한 번에 하나씩만 바꾸면서** 듣는 게 정석. (디버깅의 변수 격리와 동일.)

---

## 1. 사운드 형용사 — 톤 어휘

| 용어 | 특징 | 주파수 분포 | 비유 |
|------|------|------------|------|
| **Warm** | 부드럽고 둥근 | 저역 강 + 고역 약 | LPF 걸린 사인파 |
| **Bright** | 밝고 또렷 | 저역 약 + 고역 강 | HPF 걸린 톱니파 |
| **Thump** | "퉁/둥" 펀치 | 저역 + 미드 약간 | 임펄스 응답 짧음 |
| **Growl** | "그르르" | 어퍼미드~고역 강조 | 살짝 클리핑 + 고차 하모닉 |
| **Grunt** | "그르엉" | 로우미드 + 약한 오버드라이브 | 비대칭 클리핑 |
| **Sizzle / Shimmer** | 반짝거림 | 8kHz↑ 하모닉 | 고차 오버톤 잔향 |
| **Mud** (피해야 할 것) | 답답 | 200~300Hz 과다 | 콤필터처럼 마스킹 |

**첫 미션**: 좋아하는 곡의 베이스에 위 어휘를 붙여보기.

---

## 2. 주법 (Technique) — 입력 파형이 결정됨

| 주법 | 어택 | 음색 | 적합 장르 |
|------|------|------|----------|
| **Fingerstyle (검지/중지)** | 부드러운 라운드 어택 | warm, round | 록, 팝, 재즈 일반 |
| **Pick (피크)** | 날카로운 트랜지언트 | aggressive, percussive, bright | 펑크록, 메탈, 모타운 |
| **Slap (엄지로 때림)** | 매우 날카롭게 "딱" | 저역 펀치 + 고역 어택 동시 | 펑크(funk), 퓨전 |
| **Pop (검지로 튕김)** | 매우 날카로운 고역 스파이크 | 메탈릭, 피크보다 강한 트랜지언트 | 슬랩과 세트 |
| **Palm mute** | 어택 후 즉시 감쇠 | thump, 짧은 sustain | 펑크록, 컨트리 |
| **Fingernail / Thumb** | 부드러운 어택 | 매우 warm, vintage | 모타운, 60s |
| **Tapping** | 양손 해머온 | 클린 + 노이즈 적음 | 프로그/퓨전 |

비유: 같은 함수에 **다른 입력 신호 형태**를 넣는 셈. fingerstyle = 가우시안 펄스, pick = 거의 디랙 델타, slap = 임펄스 + 클리핑.

---

## 3. 악기 자체 (Instrument)

### 3-1. 픽업 위치
현은 양 끝에서 고정되어 정상파를 만듦. 픽업은 **현의 특정 지점에서 진동을 측정**하므로 위치에 따라 **잡히는 하모닉이 다름**.

| 위치 | 음색 | 이유 |
|------|------|------|
| **Neck pickup (앞쪽)** | fat, warm, full | 현 진폭 최대 지점 → 기본 주파수 강함 |
| **Bridge pickup (뒤쪽)** | bright, thin, punchy | 진폭 작지만 고차 하모닉이 상대적으로 강함 |
| **Both blended** | 미드 스쿱 | 두 픽업 위상 간섭으로 미드 일부 상쇄 |

→ Jazz Bass 시그니처 사운드(스쿱된 미드)는 이 간섭에서 옴.

### 3-2. P-Bass vs J-Bass

| | Precision (P) | Jazz (J) |
|--|--------------|---------|
| 픽업 | 스플릿 코일 1개 | 싱글코일 2개 |
| 음색 | 굵고 단단, thump 중심 | 다재다능, growl 가능 |
| 대표 사운드 | 모타운, 펑크록 | 재즈, 퓨전, 록 전반 |
| 대표 연주자 | James Jamerson, Dee Dee Ramone | Jaco Pastorius, Geddy Lee, Marcus Miller |

### 3-3. 현 종류
- **Roundwound** — bright, growl, sustain 김. slap 적합.
- **Flatwound** — warm, thump, finger noise 적음. 모타운/재즈/레게.
- **Tapewound** — 더블베이스 흉내, 매우 둔탁.

비유: 같은 ADC라도 **샘플 윈도우 모양이 바뀌는 것** — 입력 스펙트럼이 처음부터 달라짐.

---

## 4. EQ — 주파수대별 역할

| 대역 | 역할 | 부스트하면 | 컷하면 |
|------|------|----------|--------|
| **20–40 Hz** | 서브 럼블 | 거의 안 들리는 진동 | 깔끔 (보통 HPF) |
| **40–80 Hz** | 펀더멘털 (E현 41Hz) | 무겁고 깊음 | 가벼움. 킥드럼 자리 양보 |
| **80–200 Hz** | 바디, 풀니스 | 두툼함 | 빈약 |
| **200–300 Hz** | **머디 영역 (조심!)** | 답답, 박스 사운드 | 명료해짐 |
| **500–1000 Hz** | 펀치, 그라인드 | growl, 어택감 | 부드러움 |
| **2 kHz** | 엣지, 클랭크 | 메탈릭, "딱딱" | 둥글어짐 |
| **4–6 kHz** | 프레즌스 | 손가락 디테일 | 멀어짐 |
| **6 kHz↑** | 핑거노이즈, 슬랩 sizzle | 슬랩 필수 | 클린 |

**시작 템플릿**:
- 100Hz +2~3dB (몸통)
- 300Hz -3dB (머디 컷)
- 800Hz +1dB (펀치)
- 4–6kHz +2dB (프레즌스)
- 7kHz↑ 롤오프

비유: EQ = **FIR/IIR 필터 뱅크**. 부스트는 게인, 컷은 어테뉴에이션.

**중요**: 베이스와 킥드럼은 같은 저역대를 두고 싸움. 둘 중 하나 80Hz, 다른 하나 60Hz로 자리를 나눠 줘야 마스킹이 안 생김.

---

## 5. 다이내믹스 + 디스토션

### 5-1. 컴프레서
- 어택 피크 누르고 sustain 끌어올림 → 음량 균일.
- 슬랩/핑거 어택 차이를 평탄화. 베이스에 거의 필수.
- 비유: AGC + soft-knee limiter.

### 5-2. 오버드라이브 / 디스토션 / 퍼즈
점진적으로 강해지는 비선형 왜곡:
- **Overdrive** (예: SansAmp): 미세한 클리핑, growl/grunt. 록의 90%가 살짝 묻힘.
- **Distortion**: 더 강한 클리핑, 고역 하모닉 강조.
- **Fuzz** (예: Big Muff): 거의 사각파로 깎음. Cliff Burton, Royal Blood.

비유: ADC 클리핑을 의도적으로. soft clip(tanh) → 짝수+홀수 하모닉, hard clip → 홀수 하모닉 위주(거칠어짐).

---

## 6. 시그니처 톤 케이스 스터디

| 연주자 | 베이스/세팅 | 핵심 톤 | 재현 레시피 |
|--------|-----------|--------|-----------|
| **James Jamerson** (모타운) | P-Bass + flatwound + 핑거 1개 | warm, thumpy, 단순 | P-Bass + flatwound + 100Hz 부스트 + 4kHz 롤오프 |
| **Jaco Pastorius** | 프렛리스 J-Bass + roundwound + Acoustic 360 미드 부스트 | 노래하는 horn-like growl | J-Bass 양 픽업 50:50 → 미드 700Hz +3dB → 살짝 코러스 |
| **Flea** (RHCP) | Modulus/Fender J-Bass + 슬랩 + 약한 오드 | funky 슬랩, 멜로딕 | J-Bass 브릿지 픽업 우세, 슬랩, 컴프 강하게 |
| **Geddy Lee** (Rush) | J-Bass + 피크 + Sansamp | aggressive, mid 강조 | 피크 + 미드 800Hz +4dB + Sansamp 살짝 |
| **Cliff Burton** (Metallica) | Rickenbacker + 와우 + 퍼즈 | 리드 베이스, 고역 디스토션 | 퍼즈 + 와우 + 브릿지 픽업 |

---

## 7. 듣는 귀 훈련 — 엔지니어식 접근

1. **A/B 토글 습관**: 한 번에 하나만 바꾸고 듣기. 변수 1개씩 격리.
2. **주파수 sweep 게임**: 패러메트릭 EQ로 좁은 Q 부스트 + sweep. 어느 주파수 = 어느 형용사인지 매핑.
3. **레퍼런스 트랙 라이브러리**: warm 한 곡, bright 한 곡, growl 한 곡, slap 한 곡 — 4~5곡으로 상시 비교.
4. **솔로 vs 믹스**: 솔로에선 미드 컷이 멋있어 보이지만, 믹스에선 미드가 있어야 살아남음.
5. **녹음해서 다시 듣기**: 다음 날 들으면 객관적으로 들림.

---

## Sources

- [Bass Tone 101 — Carvin Audio](https://carvinaudio.com/blogs/guitar-bass-education/bass-tone-101)
- [Bass Sounds Terminology — TalkBass](https://www.talkbass.com/threads/bass-sounds-terminology.1267728/)
- [10 Timeless Bass Tones — MusicRadar](https://www.musicradar.com/news/10-timeless-bass-guitar-tones-and-how-to-recreate-them)
- [Bass Guitar Techniques — Sweetwater](https://www.sweetwater.com/insync/bass-guitar-techniques-explained-fingerstyle-pick-slap/)
- [Slapping (music) — Wikipedia](https://en.wikipedia.org/wiki/Slapping_(music))
- [Bass Guitar EQ Guide — Music Guy Mixing](https://www.musicguymixing.com/bass-guitar-eq/)
- [How to EQ Bass Guitar — LedgerNote](https://ledgernote.com/columns/mixing-mastering/bass-guitar-eq/)
- [Bass Pickup Placement — StudyBass](https://www.studybass.com/gear/bass-guitar-buying-guide/bass-pickups-part-3/)
- [Jazz Bass Pickups — FatBassTone](https://fatbasstone.com/blogs/tips/what-makes-j-bass-pickups-so-special)
- [Jaco Pastorius — Wikipedia](https://en.wikipedia.org/wiki/Jaco_Pastorius)
- [Gear Rundown: Jaco Pastorius — Mixdown](https://mixdownmag.com.au/features/rig-rundown-jaco-pastorius/)
- [베이스 기타/주법 — 나무위키](https://namu.wiki/w/%EB%B2%A0%EC%9D%B4%EC%8A%A4%20%EA%B8%B0%ED%83%80/%EC%A3%BC%EB%B2%95)
