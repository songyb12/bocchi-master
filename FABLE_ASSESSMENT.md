# FABLE_ASSESSMENT — 14_BocchiMaster 완성도/품질 진단

- **일자**: 2026-06-11 · **브랜치**: v2 (HEAD fb016cc) · **방법**: CLAUDE.md/PRD/src 전체 정독 + 코드 교차 검증 (READ-ONLY)
- **규모**: src 67 파일 / 15,687줄 · server 2 파일(~590줄) · 테스트 0개
- **관점**: 기능 완성도 / UX / 테스트. 보안·성능은 발견 시에만 언급.

---

## 0. 종합 스코어카드

| 영역 | 점수 | 한 줄 평 |
|---|---|---|
| 곡 연습 (Songs/ChordTimeline/Stem) | **85** | 메인 동선. 마디 양자화·offset 영속·AudioChord handoff까지 견고. 진행률/에러 구분만 미흡 |
| 지식 콘텐츠 (Learn/Vocal/Routine) | **95** | 사실상 완성. 시각화 품질 높고 고립도 의도적 |
| 연주 판정 (play 뷰 + 마이크 채점) | **70** | 콤보/판정/결과 화면까지 배선 완료 — 실사용 검증만 미진행 |
| 학습 루프 (Curriculum/Session/XP) | **55** | 콘텐츠는 풍부(레슨 44·드릴 95)하나 **완료 추적이 없어 루프가 닫히지 않음** |
| 백엔드 (server/) | **30** | chord-search + GP 파서 완성품인데 **프론트 호출 0건 — 전체 고아** |
| 문서 정합성 (README/CLAUDE.md/PRD) | **50** | 구조 설명·포트·기능 목록이 현 코드와 어긋남 |
| 테스트 | **0** | 러너조차 없음. 순수 로직 후보는 풍부 |

**총평**: "보고 배우는" 축(Learn/Vocal/Routine/ChordTimeline)은 출하 품질. "성장을 기록하는" 축(커리큘럼↔드릴↔XP)은 부품은 다 있는데 벨트가 안 걸린 상태. 죽은 코드 1덩어리(gamification 385줄)와 고아 백엔드가 착시 완성도를 만들고 있음.

---

## 1. ① 미완·반쪽 기능

### A급 — 코어 흐름이 끊긴 것

**A1. server/ 백엔드 전체가 고아** 🔴
- `server/main.py`: `/api/chord-search/`(Claude CLI, rate limit 100/일), `/api/parse/tab`(PyGuitarPro, .gp3~.gpx) 모두 **구현 완료**.
- 그러나 src 전체에서 `chord-search`·`parse/tab`·`8081` 호출 **0건** (grep 확인). v2 UI 재설계 때 소비자가 사라짐.
- README는 여전히 "AI-powered search" 광고, 포트도 README(8080) vs CLAUDE.md(8081) vs `VITE_API_PORT` 기본값(8080) 불일치.
- **판단 필요**: GP 파서는 살릴 가치 큼(→ Top 2), chord-search는 폐기 후보 (15곡 시드 검색 UI 자체가 v2에서 사라짐).

**A2. 커리큘럼 드릴 완료가 기록되지 않음 — 학습 루프 미완결** 🔴
- 드릴 클릭 → `handleDrillSelect()`(`src/app/App.tsx:121`) → 트랙 변환 → play 뷰. **여기서 끝**. 완료/통과 판정이 `bocchi.progress.*`에 쓰이는 코드가 없음.
- `completedLessons`/`completedDrills`는 영원히 빈 배열. XP는 Session 저장 시 분(分)만 적립(`sessionEngine.ts:191` `awardCurriculumXP`) — 즉 진행률 바는 사실상 "연습 시간"이지 "커리큘럼 진도"가 아님.
- 마이크 채점(`useScoring`)과 drill `passCriteria`(`curriculum.ts`)가 둘 다 존재하는데 서로를 모름 — 판정 결과로 드릴 통과를 매길 재료는 이미 다 있음.

**A3. 기타 드릴이 베이스 트랙으로 변환되는 배선 버그** 🔴
- `App.tsx:36` `const [instrument] = useState<'guitar' | 'bass'>('bass')` — **setter 없는 고정값**.
- CurriculumScreen은 자체 토글(기본값 `'guitar'`, `CurriculumScreen.tsx:70`)로 기타 커리큘럼을 보여주는데, 드릴 선택 시 `onSelectDrill(drill, lesson)`(`:430`)에 악기를 안 넘김 → App이 `drillToTrack(drill, 'bass')`로 변환.
- **결과**: 기본 동선(기타 커리큘럼 → 드릴 클릭)에서 기타 드릴이 4현 베이스 튜닝으로 렌더됨. 시그니처에 instrument 한 칸 추가로 해결되는 1시간짜리 픽스.

**A4. gamification.ts 385줄 — 완전한 죽은 코드** 🟠
- 27레벨 칭호, 27개 업적, 일일 미션, `addXP`/`checkAchievements`까지 **정의 완성** — import하는 파일 **0개** (grep 확인). 내부 TODO도 있음(`gamification.ts:369`).
- `bocchi.progress.*`(커리큘럼)와 PlayerProfile(게이미피케이션)이라는 **XP 시스템 2벌**이 공존 중. 연결하거나 삭제하거나 — 방치가 최악.

**A5. XP 게이트가 표시만 있고 잠금이 없음** 🟠
- 레벨 카드에 `"${level.requiredXP} XP req"` 텍스트만 렌더(`CurriculumScreen.tsx:247`). 어떤 레벨이든 즉시 펼침 가능.
- 의도적 개방이라면 표기를 바꿔야 하고(잠금처럼 읽힘), 게이트가 의도라면 A2 완결이 선행 조건.

### B급 — 반쪽이거나 죽은 가지

**B6. "Bass-ready Tabs" 섹션 = 도달 불가 UI + 배지 오표기** 🟠
- 베이스 트랙 **19/19 전부 `events: []`** (regex 전수 확인; 전체 39 트랙 중 26개 빈 events — 기타도 7곡 빈 상태).
- `bassReadySongs`(`SongsViewV2.tsx:255`)는 베이스 events>0 필터 → **항상 빈 배열** → 섹션(`:809-827`) 영원히 미렌더.
- 부수 버그: 배지 로직(`:453-454`)이 현재 악기 트랙의 events 유무로 `'BASS TAB'`을 띄움 → **기타 모드에서 기타 탭 곡에 "BASS TAB" 배지**가 붙음.
- v1 탭 폐기는 의도된 결정(CLAUDE.md)이므로, 죽은 분기 정리 + 배지 라벨 수정이 맞는 처방.

**B7. StageMode가 sync 보정을 잃어버림** 🟠
- `StageMode.tsx:50-51` `const [syncEnabled] = useState(true)` / `const [offsetSec] = useState(0)` — **setter 없음, 0 고정**.
- SongsViewV2는 곡별 offset을 `bocchi.offset.{youtubeId}`에 영속(`SongsViewV2.tsx:202-220`)하는데 StageMode는 **읽지 않음** → 평소 화면에서 공들여 맞춘 싱크가 무대 모드 진입 순간 무효.

**B8. GPU 분석 대기 UX — 단계 텍스트뿐, 취소/진행률/에러 구분 없음** 🟡
- ChordTimeline: ingest(30s~2분)→analyze(~10s) 동안 pulse 텍스트만. 취소 불가, 타임아웃 안내 없음(`ChordTimeline.tsx:182-217`).
- 캐시 조회 실패 시 `catch { return false }` → **서버 다운·401·타임아웃이 전부 'unavailable'로 뭉개짐**. "서버 꺼짐(8220)"인지 "VITE_AC_API_KEY 오류"인지 사용자가 알 수 없음.
- StemSeparator도 동일 패턴 + 스템 `<audio>` 로드 실패 핸들러 부재.

**B9. PRD 미결 항목 — 구간 반복 UX는 사실 구현돼 있음** 🟢
- PRD에 `[ ] 구간 반복 UX`로 남아 있으나 TabView B모드에 two-click 마디 루프가 이미 구현(`TabView.tsx:10-18`). **PRD 갱신 + 발견성 문제만 남음** (화면 어디에도 "마디 두 번 클릭 = 루프" 안내 없음).
- 같은 맥락: CLAUDE.md의 "Fretboard `bassRootHints` 부모 wiring 별 작업"도 **이미 완료됨**(`SongsViewV2.tsx:1181-1185`) — 기록이 코드보다 뒤처짐.

**B10. 커밋 안 된 WIP** 🟡
- `ToneVocabulary.tsx`(+`LearnView.tsx`): 8번째 어휘 'Scooped' + 막대 수치 표시 — 동작하는 개선인데 워킹트리에 방치. 커밋 권장.

---

## 2. ② 큰 파일 분해

### SongsViewV2.tsx (실측 1,197줄) — 분해안

비대 원인은 로직이 아니라 **인라인 스타일 + 함수-내-렌더러**. 하위 위젯(ChordTimeline 등)은 이미 분리돼 있어 분해 난이도는 낮은 편. 동작 변화 0의 순수 JSX 추출로 진행 권장:

| 추출 대상 | 현재 위치 | 예상 줄수 | props 계약 |
|---|---|---|---|
| `SongListSidebar.tsx` | `:614-851` (악기 토글+Recent+카테고리 리스트) | ~300 | selectedSong, importedPractice, recent*, instrument, onSelectSong/Import/Instrument |
| `SongRow` / `ImportRow` 컴포넌트화 | `:383-542` (render 함수 2개) | ~170 | song/handoff, isActive, variant, onClick |
| `ImportSettingsBar.tsx` | `:899-980` (BPM/KEY/Apply/catalog) | ~85 | importedPractice, 입력 state, onApply |
| `SyncControlBar.tsx` | `:996-1079` (SYNC 토글+OFFSET+시간) | ~85 | syncEnabled, offsetSec, ytTime, currentBeat, setters |
| `recentStore.ts` | `:57-129` (localStorage 헬퍼 6종) | ~75 | 순수 함수 — **테스트 1호 후보** |
| `theme.ts` (색 토큰 `C`) | `:37-55` | ~20 | StageMode/ChordTimeline에 중복된 토큰 통합 |

**결과**: 본체 ~420줄(상태 12개 + sync 콜백 + 레이아웃 골격). PlaybackContext/로컬 state 이원화는 **건드리지 않는 것**을 권장 — sync 콜백의 `syncRef` 패턴(`:232`)이 stale closure 방지용으로 섬세해서, 상태 재배치는 회귀 위험 대비 이득이 없음.

### 그 외 큰 파일

| 파일 | 줄수 | 판단 |
|---|---|---|
| `data/curriculum.ts` | 2,456 | 코드가 아니라 데이터. `curriculum.guitar.ts`/`curriculum.bass.ts` + 타입 분리 정도면 충분. **우선순위 낮음** |
| `features/songs/ChordTimeline.tsx` | 569 | fetch 상태기계 + 2개 렌더 모드 혼재. `useChordAnalysis` 훅(phase/fetch) + `MeasureGrid`/`ContinuousRow` 분리 — **B8 UX 작업과 같은 PR에서** 하면 일석이조 |
| `core/note/SongTracks.ts` | 914 (+`.bak`) | 19곡×2 보일러플레이트. JSON 데이터화는 ROI 낮음. **`.bak`은 삭제 시점 지남** (4-30 이후 검증 완료) |
| `features/curriculum/CurriculumScreen.tsx` | 583 | 정적 렌더 위주. A2/A3 작업 시 자연스럽게 손대는 범위만 |

---

## 3. ③ UX 개선 (우선순위순)

| # | 항목 | 근거 | 비용 |
|---|---|---|---|
| U1 | **분석 대기 UX**: 경과 시간 표시 + 취소 버튼 + "서버 다운 vs 인증 오류 vs 타임아웃" 구분 메시지 | B8. 매일 쓰는 동선의 30s~2분 블랙박스 | 반나절 |
| U2 | **StageMode에서 저장된 offset 로드 + 리모컨 ±0.5s 조정** | B7. TV 시나리오(10-foot)가 이 앱의 차별점인데 싱크가 깨진 채 시작 | 2h |
| U3 | **드릴 → play 뷰 컨텍스트 표시**: 어느 레슨의 드릴인지, passCriteria(목표 BPM/정확도)를 헤더에 | 드릴 진입 후 "뭘 통과해야 하는지" 화면에 없음. A2 완결의 UI 절반 | 반나절 |
| U4 | **키보드 단축키 도움말** (Space/↑↓/M/L/R/Esc + "마디 2클릭=루프") — `?` 오버레이 또는 푸터 한 줄 | 전부 숨겨진 기능. B9 발견성 문제 포함 | 2h |
| U5 | **배지 정리**: 기타 모드 'BASS TAB'→'TAB', 베이스 모드는 'CHORDS'/'ROOTS' 의미 재정의 | B6 오표기 | 30m |
| U6 | **favicon + `<title>` + `lang="ko"`** | 모든 Playwright 검증에서 "콘솔 에러 favicon 외 0"이 반복 — 그 favicon 404를 없앨 때 | 15m |
| U7 | **PracticeHome AudioChord 버튼 IP env화** (`PracticeHome.tsx:148` 하드코딩 `100.111.55.55`) | 누스/외부에서 열면 죽는 링크 | 15m |
| U8 | iPad 터치 타깃: OffsetBtn 24px 등 44px 미만 다수 | PRD 타겟 디바이스에 iPad 명시 | 선택 |

참고(이미 잘된 것): 900px/560px 반응형 브레이크포인트 존재(`styles/index.css:397,418`), 빈 상태 처리(`Select a track to begin`), recent 목록 영속, AppRail aria-label/current.

---

## 4. ④ 테스트 공백

**현황**: 러너 없음(package.json에 test 스크립트 부재), src 내 테스트 파일 0. 지금까지 회귀 가드는 "빌드 클린 + Playwright 수동 확인"뿐 — 세션 로그/streak 같은 **누적 데이터 로직이 무방비**인 게 가장 아픔 (날짜 경계 버그 하나면 streak 신뢰가 무너짐).

**권장**: vitest (Vite 7 네이티브, 설정 ~10분). 우선순위:

| 순위 | 모듈 | 이유 | 난이도 |
|---|---|---|---|
| 1 | `features/session/sessionEngine.ts` | streak/날짜 경계/60-entry 캡/awardCurriculumXP 멱등성 — 사용자 데이터 직결 | 쉬움 (Date 주입만 처리) |
| 2 | `features/songs/chordQuantize.ts` | 마디 양자화 = 메인 화면 정확성. 경계값(마디 걸침, 무음 트림, ambiguous) | 쉬움 (순수 함수) |
| 3 | `lib/audiochordHandoff.ts` | 외부 입력(base64url) 파싱 — 깨진 payload 방어 | 쉬움 |
| 4 | `core/scoring/ScoringEngine.ts` | 판정 윈도/콤보 — A2(드릴 통과)와 직결될 로직 | 중간 |
| 5 | `utils/noteCalculator.ts`, `utils/scalePositions.ts` | MIDI↔음이름, 스케일 위치 | 쉬움 |
| 6 | `server/tab_parser.py` (pytest + .gp 픽스처) | Top 2 진행 시 필수 동반 | 중간 |

여기에 Playwright smoke 1본(앱 로드 → 곡 선택 → 타임라인 렌더 → 콘솔 에러 0)을 스크립트로 박제하면 지금 수동으로 반복하는 검증이 자동화됨.

---

## 5. ⑤ 완결 Top 3 + 퀵윈

### Top 3 (가치 × 위험 × 노력)

**🥇 Top 1 — 학습 루프 완결: "드릴을 깨면 진도가 쌓인다"**
- **내용**: (1) A3 instrument 전달 픽스 → (2) 드릴 완료 기록 — 1단계는 "플레이 완주 시 완료 마킹"만, 2단계에서 ScoringEngine 판정 연동 → (3) XP 게이트 결정(적용 or 'XP req' 표기 제거) → (4) gamification.ts 거취 결정(progress와 통합 or 삭제)
- **가치 ★★★★★**: PRD의 존재 이유("리듬게임처럼, 커리큘럼 따라가면 실력이 늘어야") 그 자체. 콘텐츠 44레슨/95드릴이 이미 있어 한계효용 최대
- **위험 ★☆☆☆☆**: localStorage 한정, 기존 화면 회귀 없음 / **노력**: 2~3일

**🥈 Top 2 — GP 업로드 UI ↔ tab parser 연결 (허브 백로그 명시 항목)**
- **내용**: Songs 사이드바에 업로드 드롭존 → `POST /api/parse/tab` → Track 변환(타입 호환 확인됨) → localStorage 라이브러리 저장 → TabView 재생
- **가치 ★★★★☆**: 베이스 events 19/19 공백을 사용자가 직접 메꿀 **유일한 경로**. 정확한 탭 확보 시 Rocksmith류 코어 경험(탭+프렛보드+판정) 부활. A1 고아 백엔드 절반 회생
- **위험 ★★★☆☆**: 서버 상시 기동 필요(Servy 등록 or "서버 꺼짐" 안내), Track 크기에 따른 localStorage 한도 / **노력**: 2~3일 (서버는 완성 상태)
- 부속 결정: chord-search 엔드포인트는 이 기회에 폐기 여부 확정

**🥉 Top 3 — AudioChord 일상 동선 마감 (U1+U2+에러 구분)**
- **내용**: 분석 경과 시간/취소, 401·다운·타임아웃 구분 메시지, StageMode offset 로드+조정
- **가치 ★★★★☆**: 매일 쓰는 메인 동선의 마찰 제거. 신기능 0, 마감 100
- **위험 ★☆☆☆☆** / **노력**: 1~1.5일 (ChordTimeline 훅 분리와 같은 PR 권장)

### 퀵윈 (각 ≤30분, 합쳐서 반나절)

1. **favicon + title + `lang="ko"`** (`index.html`) — 콘솔 404 박멸
2. **'BASS TAB' 배지 라벨 수정** (`SongsViewV2.tsx:454`)
3. **PracticeHome 하드코딩 IP → env** (`PracticeHome.tsx:148`)
4. **WIP 커밋** (ToneVocabulary 'Scooped' — 동작하는 개선이 워킹트리에 방치)
5. **`SongTracks.ts.bak` 삭제** (검증 유예 기간 경과)
6. **문서 동기화**: CLAUDE.md 구조 섹션(`src/components/*` → 실제 `src/features/*`), README의 죽은 기능(AI search/메트로놈 패널) 정리, 서버 포트 통일, PRD 루프 항목 체크, "bassRootHints wiring 별 작업" 기록 갱신
7. **CurriculumScreen 기본 악기 `'bass'`로** (`CurriculumScreen.tsx:70`) — 앱 정체성과 일치 + A3 증상 완화 (근본 픽스는 Top 1)

---

## 6. 요약

> **BocchiMaster는 "베이스 독학 키오스크"로서 보는 경험은 출하 품질, 성장하는 경험은 미완이다.**
>
> 1. 콘텐츠·시각화(Learn/Vocal/Routine/ChordTimeline)는 완성도 90%+ — 자가개선 라운드의 효과가 뚜렷함.
> 2. 반면 학습 루프는 부품(커리큘럼 95드릴, 마이크 판정, XP 엔진 2벌)이 전부 존재하는데 **드릴 완료가 기록되지 않아 벨트가 안 걸려 있고**, 기타 드릴이 베이스로 변환되는 배선 버그(App.tsx:36)까지 겹쳐 있다 — Top 1.
> 3. **server/는 완성된 고아**다. GP 파서를 업로드 UI로 살리면(Top 2) 베이스 탭 공백(19/19 빈 events)을 메꿀 유일한 경로가 열린다. chord-search는 폐기 결정만 남았다.
> 4. SongsViewV2(1,197줄)의 비대는 구조 문제가 아니라 인라인 스타일/렌더 함수 문제 — 6조각 순수 추출로 ~420줄까지 내려가며 위험도 낮다.
> 5. 테스트 0은 streak/양자화 같은 누적·정확성 로직에서 가장 위험 — vitest + sessionEngine/chordQuantize부터.
>
> **권장 순서**: 퀵윈 7건(반나절) → Top 1(학습 루프) → Top 3(AudioChord 마감, 분해 동반) → Top 2(GP 업로드). 이 네 步면 "잘 만든 데모"에서 "매일 쓰는 연습 도구"로 넘어간다.
