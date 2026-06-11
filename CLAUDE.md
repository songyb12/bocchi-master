# Bocchi-master — Guitar & Bass Practice Studio

## Overview
기타/베이스 연습 웹앱. React SPA + 옵션 Python 백엔드 (AI 코드 검색).

## Tech Stack
- **Frontend**: React 19 + TypeScript 5.9 + Tailwind 4 + Vite 7
- **Backend** (optional): FastAPI + Claude CLI (AI chord search)
- **Audio**: Web Audio API + WebMIDI API
- **Storage**: localStorage (no database)

## Quick Start
```bash
# Frontend
npm install
npm run dev          # -> http://localhost:3001

# Backend (optional, for AI chord search)
pip install -r server/requirements.txt
uvicorn main:app --app-dir server --host 0.0.0.0 --port 8081
```

## Project Structure
```
src/
  app/              # Shell: App (view router), AppRail, PracticeHome, BackToDashboard
  features/         # UI by feature
    songs/          # SongsViewV2, ChordTimeline, StemSeparator, StageMode, stages
    tab-view/       # Tab renderers (B/A mode) + playback controls + scoring overlays
    fretboard/      # SVG fretboard rendering
    curriculum/     # Guided learning system (lessons/drills)
    learn/          # Bass tone workshop (SVG visualizations)
    session/        # 30-min practice session harness
    vocal/          # Vocal technique guide
    routine/        # Daily routine templates (4 instruments)
    audio-input/    # Mic input panel
    settings/       # Settings UI
  contexts/         # PlaybackContext (track/status/bpm/loop)
  core/             # audio/ (engine, scheduler, pitch), note/ (tracks, loader), scoring/
  hooks/            # usePlayback, useYouTubePlayer, useScoring, useAudioInput, ...
  data/             # curriculum, scales, tunings, gamification
  lib/              # AudioChord typed client + handoff (+ generated types)
  types/ utils/ styles/ ui/
server/
  main.py           # Standalone FastAPI server (chord-search + GP tab parse) — 현재 프론트 미연결
  tab_parser.py     # Guitar Pro parser (PyGuitarPro)
```

## Key Features
- Fretboard SVG with multi-overlay (scale/voicing/pattern/chord-tone)
- Web Audio metronome (accent, subdivision, swing, pendulum)
- Song chord search (15 seed songs + AI search via Claude CLI)
- Live mode (metronome-synced auto chord progression)
- Beginner/Advanced UI mode
- MIDI input support
- Curriculum system with gamification

## Environment Variables
- `VITE_AC_API_KEY` — AudioChord X-AC-Key auth header (see `.env.example`)
- `VITE_AC_UI_URL` — Practice Home의 AudioChord UI 링크 (default: `http://100.111.55.55:8220/ui`)
- `CLAUDE_CLI_PATH` — Override Claude CLI binary path for the optional server (auto-detected)

## Origin
Extracted from UFS Master Core Ecosystem (`D:\Claude\01_UFS\frontend\bocchi-master\`).
71 commits of history available in the original repo.

## Current Status
- **2026-05-06 (후속2)**: **Vocal + Routine 탭 신규 (탭 5→7)**. 사용자 요청 "보컬 잘하는 방법 + 각 악기별 루틴 페이지". 웹 리서치 (Musicians Institute / Forbrain / School of Rock / Soundbrenner / TalkingBass / JustinGuitar 등) → 보컬 evidence-based 8섹션 + 4 악기 일일 루틴.
  - **Vocal 탭** (`src/features/vocal/`) — 좌측 레일 6번째 (마이크 아이콘). `VocalView.tsx` (~330L) 8 섹션: 호흡 / 워밍업 / 음역대 / 발성 / 자세 / 톤 / 관리 / 자기 평가. 시각화 3종:
    - `BreathingDiagram.tsx` — Chest vs Diaphragm 토글, 인체 SVG (배 / 가슴 영역 + 횡격막 라인 애니메이션)
    - `VocalRangeMap.tsx` — Chest/Mix/Head/Falsetto 4 영역 + passaggio (E4, A4) 마커 + log scale C2-C6 axis
    - `WarmupExercises.tsx` — 5종 운동 카드 (Lip trill / Siren / Straw / Humming / Vowel scales) + 14분 루틴 권장
    - 추가: 모음 5종(AH/EH/EE/OH/OO) 입 모양 카드, 자세 4팁, 장르 5종 톤 매핑, 일상 관리 6종, 자기 평가 5단계
  - **Routine 탭** (`src/features/routine/RoutineView.tsx` ~360L) — 좌측 레일 7번째 (체크리스트 아이콘). 4 악기 토글 (Bass 45min / Guitar 60min / Vocal 30min / Drum 45min). 각 악기당:
    - Description + Time-split 막대 (5블록 색깔 비율)
    - 5 블록 카드 (Warmup → 핵심 → 곡 → Cooldown)
    - Weekly Focus 7일 (Mon-Sun)
    - Sources
  - **AppRail + App.tsx wiring**: 'vocal' / 'routine' view 추가. 좌측 레일 7개 아이콘.
  - **빌드/검증**: 빌드 클린 (568KB JS / 172KB gzip, react-markdown 영향 + 신규). Playwright 1440x900 — Vocal 탭 호흡 다이어그램 토글(Diaphragm green) 정상, Routine 탭 4 악기 + Bass 5블록 + Weekly 7일 모두 렌더, 콘솔 에러 favicon 외 0.
  - **NotebookLM**: get_health 결과 authenticated=false (사용자 직접 setup_auth 필요) → 본 세션이 직접 작성. URL 발급 시 source 추가 가능 — 별 작업.
- **2026-05-06 (후속)**: **Session 하네스 신규 — 30분 evidence-based 연습 블록**. 사용자 요청 "학습법/베이스 학습 리서치 + 세션 하네스 구축". 웹 리서치 (Learning Scientists / Berklee / TalkingBass / 어썸뮤직 등) → 학습 과학 6원칙 (deliberate practice / spaced repetition / interleaving / retrieval / metacognition / chunking) + 베이스 학습 6우선순위 (매일 짧게 / 스케일→코드톤→곡 / 12-key 회전 / 메트로놈 / 녹음 / solid foundation). 종합해 5블록 세션 하네스 구축.
  - **`src/features/session/sessionEngine.ts`** (~210L): SessionPlan/Block 타입 + `buildSessionPlan(settings)` (5블록: warmup 17% / stage 23% / song 33% / retrieval 17% / metacog 10%) + localStorage `bocchi.session.{log,settings}` (streak / 누적 분 / per-kind dwell / 60 entries 캡 / 1일차 streak +1 자동 계산) + `recordSession(plan, doneBlocks)`로 영속. Settings: stage(R1 연결) / primarySong / altSong (interleaving partner) / totalMinutes 15-60 슬라이더.
  - **`src/features/session/SessionView.tsx`** (~360L): 좌측 레일 5번째 (시계 아이콘) → "Today's Practice" + STREAK/TOTAL/TODAY stats + ⚙ Tune 드로어 (stage/songs/duration). 5블록 카드 (icon + 번호 + KIND_LABEL amber + serif italic title + 분 + Mark/Done 토글 + ≈ principle + ▸ steps). Save Session → recordSession + UI 즉시 반영 (블록 녹색 전환 + STREAK +1 + TOTAL/TODAY 갱신). ByKindStats(누적 분 막대) + RecentEntries(최근 7일) + PRINCIPLES legend 푸터.
  - **AppRail.tsx + App.tsx wiring**: 'session' view 추가, 5번째 레일 아이콘.
  - **빌드/검증**: 빌드 클린 (517KB JS / 154KB gzip, react-markdown 영향 +11KB). Playwright 1440x900 — 5블록 모두 렌더 + 5 Mark 일괄 클릭 + Save 클릭 → STREAK 0→1, TOTAL 30min, 모든 블록 ✓ Done 녹색 전환 정상. 콘솔 에러 favicon 외 0. localStorage 영속 확인.
- **2026-05-06**: **베이스 중심 자가개선 라운드 (R1~R19, 14건 commit, 6건 skip)**. 사용자 "자가개선 20회 진행, 베이스 중심" 요청에 자율 진행.
  - **R1 StagesPanel 패턴 그리드** (`stages.ts`/`StagesPanel.tsx`): 6 Stage 각각에 `examplePattern`(chord+4-beat×4-string grid+note) 추가. Help 패널에서 베이스 4현 grid 시각화 (G/D/A/E top-down, fret 숫자 amber dot).
  - **R2 ChordTimeline root note** (`ChordTimeline.tsx`): `extractRoot(label)` 헬퍼. 모든 chord 셀(measures + continuous)에 amber-green `♭ A♯` root pill 표시 — Stage 1 학습자가 코드 → 베이스 root 즉시 매핑 가능.
  - **R3 BASS_CURRICULUM 첫 레슨 보강** (`curriculum.ts` bl1-01-finger-basics): theory.markdown에 표준 튜닝 4현 (G/D/A/E + Hz) 명시 + anchor 자세 + 5단계 연습 순서 + Stage 시스템 매핑 표(Stage 1·2·3과 핑거 피킹 관계).
  - **R4 Stem Mixer 1-click 토글** (`StemSeparator.tsx`): `🎸 Bass only` / `🎸 Bass off` / `All` 3 quick preset 버튼. 베이스 학습 시나리오(베이스만 듣기 / 베이스 빼고 합주) 즉시 토글.
  - **R5 Fretboard `bassRootHints` prop** (`Fretboard.tsx`): root 노트 이름 배열 받으면 12프렛 이내 모든 매칭 위치를 dashed green circle로 표시. ChordTimeline의 active root를 부모에서 받아 전달하면 베이스 학습 시 시각적 가이드 (현재 props만 추가, 부모 wiring은 별 작업).
  - **R6 Learn Section 03b — 베이스 음역대** (`BassFrequencyRange.tsx`): 4현 표준 튜닝 표 (Hz/MIDI/12fr 옥타브) + 25-500Hz log scale landmark axis (B0/E1/A1/E2/A2/G3/C4/A4) + 4현 베이스 영역 amber range bar + 5현 확장 영역 + 4 practice notes.
  - **R10 BPM ½×/1×/2× 토글** (`PlaybackControls.tsx`): half-time/double-time + 원본 BPM 복원. 베이스 그루브 슬로우다운 학습 / 박자 분할 학습 즉시 토글.
  - **R15 Stage별 추천 톤 매핑** (`stages.ts` STAGE_TONE_PRESETS): 6 Stage 각각에 `{name, recipe}` 매핑(roots=Warm thump, octaves=Round+clear, fifths=Punchy mid, arpeggios=Bright J-tone, passing=Growl, walking=Jazz upright). StagesPanel Help 패널에 녹색 박스로 표시 — Section 06 시그널 체인 레시피와 직접 연결.
  - **R16 BASS_CURRICULUM Stage 매핑 노트** (bl1-01 theory에 추가): Stage 1·2·3 패턴이 핑거 피킹 i-m 교대로 어떻게 적용되는지 표.
  - **R17 ChordTimeline 박자 셀** (`ChordTimeline.tsx`): measure 셀 안에 4-dot 박자 표시 (1박은 amber, 2-3-4박은 흰색 약). 박자감 + 코드 변화를 동시 시각화.
  - **R19 학습 진행률 추적** (`CurriculumScreen.tsx`): `loadProgress(instrument)` localStorage 헬퍼 + 헤더에 `XP {n} / {totalAvailable}` strip + green→amber gradient progress bar + lessons/drills count. 데이터 저장 wire는 별 작업(향후 drill 완료 시 dispatch).
  - **R7/R9/R11/R13/R14/R18 skip**: 메트로놈 4분음 표시 이미 존재 / 외부 audio 의존 / 큰 데이터 흐름 변경 / 실 검증 사용자 환경 필요 — 가치 대비 시간 비효율 판정.
  - **R20 통합 검증**: 빌드 75 modules / 506KB JS clean. Playwright PC 1440x900 — KICK BACK Stage Help 펼침(예시 grid + Warm thump tone preset 정상), ChordTimeline 첫 셀 `♭ A♯` + 4-dot 박자 표시, BPM ½×/1×/2× 버튼 정상, Curriculum bass 모드 XP 0/4395 progress bar + 4 레슨 + 6 레벨 모두 렌더, 콘솔 에러 favicon 외 0.
- **2026-05-05**: **Curriculum 뷰 Learn-스타일 재단장 + AudioChord X-AC-Key 전면 마이그**.
  - **CurriculumScreen.tsx 전면 재작성** (~470L). 기존 cyan/purple 톤 → Amplified Underground (amber #fbbc00 + serif italic + monospace 데이터). 헤더 `BOCCHI · CURRICULUM` + 큰 serif italic 제목. 레벨 카드: 큼지막 icon + 01/02 번호 + serif italic 이름 + nameEn dim + subtitle monospace + 4 LESSONS / XP 요구치 표시 + 펼침 시 amber glow border. 레슨 카드: 01/02 번호 + serif italic title + first ## heading 추출(theory 미리보기) + drill 수·총 시간·XP. 펼침 시 OBJECTIVES(◇ 체크리스트) + THEORY(react-markdown 풀 렌더, h2/h3/p/ul/ol/strong/em/code 모두 amber 톤 매핑) + DRILLS(상세 카드: type icon + 한국어 라벨 + description + passCriteria 포맷팅 + XP/minutes). 28개 레슨의 풍부한 theory.markdown이 200자 잘림 → 풀 렌더로 즉시 학습 가치 상승.
  - **react-markdown 10.1.0 의존성 추가**. 506KB JS / gzip 154KB (+124KB, vendor 분리 안 됨).
  - **AudioChord X-AC-Key 인증 마이그 (실 사용 단계)**: ChordTimeline.tsx + StemSeparator.tsx 기존 hand-rolled fetch 4곳에 `withAuth()` 헤더 주입. `audiochord.ts`의 `withAuth` 함수 export. `.env`에 `VITE_AC_API_KEY` 작성(헤르타 시스템 AC_API_KEY와 동일, gitignored). vite 빌드 시 inline 확인. AudioChord 401 에러 해결 — ingest+analyze 라이브 호출 정상 (思想犯 11.56s, 5곡 ~6s/each).
  - **요루시카 6곡 코드 분석 캐시 warmup**: 한본냥 `yRhiO4dfTlQ`(ただ君に晴れ) + `ttIYXlXjK6c`(春泥棒), 기타 fan/협업 채널 4곡 모두 사전 분석 → ChordTimeline 즉시 캐시 hit.
  - **빌드/검증**: tsc + vite 클린, Playwright 1440x900 검증. 기초 레벨 펼침 + 오픈 코드 기초 레슨 펼침 시 OBJECTIVES 3건 + THEORY (오픈 코드란? + 필수 5개 코드 list) + DRILLS 2건 모두 정상 렌더. Practice/Drills/Curriculum/Learn 4탭 회귀 0건, 콘솔 에러 favicon 404만.
- **2026-05-04**: **요루시카 J-Pop 트랙 5곡 추가**. 사용자 요청 "요루시카 위주 J-Pop 추가". `SongTracks.ts`에 `hanaNiBourei*` (花に亡霊, 90 BPM, E, MV `9lVPAWLWtWc`) / `haruDorobou*` (春泥棒, 155 BPM, E, MV `Sw1Flgub9s8`) / `haru*` (晴る, 100 BPM, Bm, MV `SbjcpFzPtZI`, Frieren OP2) / `dakaraBoku*` (だから僕は音楽を辞めた, 125 BPM, E, MV `KTZ-y85Erus`) / `shisouhan*` (思想犯, 138 BPM, Am, MV `ENcnYh79dUY`) 5쌍 (10 함수 / events: [], measures만 추정). ヨルシカ 카테고리에 12 트랙 + 6 SongEntry로 확장 (기존 ただ君に晴れ 1곡 → 6곡). 빌드 75 modules / 382KB JS (+2KB). Playwright 1440x900 검증: 좌측 리스트 6곡 모두 BPM/key 표시, 花に亡霊 클릭 시 헤더 NOW PRACTICING + BPM 90 + KEY E 정상. YouTube 임베드는 일부 곡이 외부 임베드 차단 표시 — 사용자 헤르타 IP에서 직접 검증 필요. 2 console errors는 YouTube 임베드 거부 메시지 (favicon 외 추가).
- **2026-05-03**: **15_AudioChord OpenAPI → TypeScript codegen + v1 bass dead code 제거 + 18_DashboardWeb 폴리시** (15h 자동 작업 일부).
  - **AudioChord client**: `src/api/audiochord.types.ts` (openapi-typescript 7.13.0 자동 생성, 764L) + `src/api/audiochord.ts` (~140L thin wrapper). 9 endpoints (ingest/youtube · analyze/{beats,chords,pitch-to-midi} · separate · library 4종). multipart/form-data + url-encoded 둘 다 처리. 추후 StemSeparator/ChordTimeline 마이그용 베이스. tree-shaking으로 미사용 시 번들 영향 0 (379.74KB 유지).
  - **v1 bass dead code 제거**: SongTracks.ts perl multiline regex로 13개 dead `const ev: NoteEvent[] = [...]` 블록 일괄 제거. 3417→971 lines (-2446), JS 425KB→380KB (-45KB). `.bak` 백업 유지.
  - **18_DashboardWeb 폴리시 (직접 수정)**: spatial nav (`useFocusNav`) + runtime ambient 튜닝 (`SettingsPanel`). 02_LGRemoteInput 위임 응답: PC→TV 출력 전용이라 TV→PC 입력 파이프 없음 → 보류. 18_DashboardWeb의 키보드 nav만으로도 사용 가능.
- **2026-04-30 (후속)**: **Learn 탭 Section 06 신규 — 실전 레시피 (FL Studio)**.
  - **신규 컴포넌트** `BassSignalChainRecipe.tsx` (~150L). FL Studio MCP 한계 조사 결과(MIDI 가상 포트만 지원, 플러그인 파라미터 제어 불가) → 자동화 대신 시각화 가이드 채택. 4단 시그널 체인 카드 그리드 (auto-fit minmax 260px): Compressor → NAM(Darkglass B7K) → Parametric EQ 2 → Limiter(optional). 각 카드는 plugin 이름 + 파라미터 표 (key/value/hint 3열) + 비유 문구. 헤더에 Audio device 메타 박스(Focusrite USB ASIO, 128 samples, ~3ms latency 환산). 푸터에 PRESET TIP (채널 우클릭 Save mixer track state as... 안내 + tonehunt.org NAM 캡처 다운로드). Limiter는 optional 회색 톤, 나머지 amber.
  - **LearnView 재구성**: Section 06 신규 삽입, 기존 시그니처 톤 06→07, 듣는 귀 훈련 07→08로 밀어냄.
  - **빌드/검증**: 75 modules (+1), 425KB JS / 18.7KB CSS. vite preview 4173 + Playwright 1440x900 검증, Section 06 렌더 정상 (4 카드 + 메타 + PRESET TIP), Section 07 시그니처 톤 자연 연속, 콘솔 에러 0. 스크린샷 learn-06/07.
- **2026-04-30**: **Learn 탭 신규 — Bass Tone Workshop**.
  - **신규 텍스트 보관소**: `docs/bass-tone-guide.md` (베이스 톤메이킹 7섹션 — 신호 체인 5단 / 톤 어휘 7개 / 주법 7종 / 픽업+P-J / EQ 8대역 / 컴프+오드/디스/퍼즈 / 시그니처 톤 5명 / 듣기 훈련 5팁). 웹 리서치 14개 소스 인용. UFS 엔지니어 관점(신호처리 비유 — LPF/HPF/임펄스/클리핑/콤필터/AGC).
  - **Learn 인터랙티브 뷰** (`src/features/learn/`, 8 컴포넌트, ~1100L): 키오스크 셸 좌측 레일 4번째 아이템 (BookOpen 아이콘) → `LearnView.tsx`(섹션 컨테이너 + 헤더). 시각화 컴포넌트 7종 모두 Pure SVG + React 상태, 외부 차트 라이브러리 의존성 0. Amplified Underground 테마(#fbbc00 amber, #0a0a0a bg, serif italic + monospace 데이터).
    - `SignalChainDiagram.tsx`: 5단 파이프라인 노드 → 화살표 → 클릭 시 amber glow + 우측 상세
    - `ToneVocabulary.tsx`: 7개 어휘 카드, 미니 LOW/MID/HIGH 3-bar 스펙트럼. Mud는 rose warning 컬러
    - `TechniqueWaveforms.tsx`: 6종 주법, 입력 시간 도메인 파형 SVG (가우시안/임펄스/슬랩+tanh클립/short decay/clean exp). 동적 polyline 생성
    - `PickupPositionDemo.tsx`: J-Bass 바디 SVG 일러스트 + 픽업 클릭/토글 (Neck/Both/Bridge), 활성 픽업 amber 펄스 애니메이션 + 우측 상세
    - `EQFrequencyMap.tsx`: 8개 대역 가로 로그 스케일 막대 (20Hz–12kHz) + 클릭 시 Boost/Cut 효과 + 시작 템플릿 (100Hz +3dB / 300Hz -3dB / 4–6kHz +2dB)
    - `ClippingComparison.tsx`: Clean/OD/Dist/Fuzz 4단 비선형 셰이핑 (tanh / hard clip / 강한 tanh) + 입력 사인 vs 출력 비교 SVG
    - `SignatureToneCards.tsx`: Jamerson / Jaco / Flea / Geddy / Cliff Burton 5명, 호버 글로우, RECIPE 카드 amber strip
  - **빌드/검증**: 74 modules (+12, +39KB JS), 420KB JS / 18KB CSS, tsc + vite build 클린. **시각 검증 (당일 후속) 완료**: SM이 spawn하는 모든 세션의 MCP 미노출 원인 픽스 후 (systemprofile/.claude.json → saos3/.claude.json SymbolicLink, 메타 세션 처리) Playwright/MemoryRAG/NotebookLM 즉시 노출. vite preview 4173에서 PC 1440x900 + TV 1920x1080 검증, 7섹션 + 4개 인터랙션(stage→[5] / pickup→bridge / EQ band→sizzle / clipping→Fuzz 사각파) 모두 정상. 발견 버그 1건 (`ToneVocabulary` 막대 height 0px — 자식이 부모 height의 % 사용했는데 부모가 content-based였음) → 라벨/막대 분리 구조로 수정 후 재검증 정상.
  - **부수 정리**: SongTracks.ts의 v1 베이스 잔재 unused `const ev` 13곳에 `// @ts-expect-error TS6133`로 빌드 차단 해소. Backlog "v1 bass 함수 정리"는 함수 본체 통째 제거 작업으로 별건 유지.
- **2026-04-28**: **베이스 탭 → 코드 타임라인 피벗** (사용자 결정: "예전에 추출했던 tab 악보는 기가막히게 다 틀려서 폐기").
  - **ChordTimeline 신규** (`src/features/songs/ChordTimeline.tsx`, ~270L): AudioChord(:8220) Crema 분석 결과를 가변폭 박스 row로 시각화. `GET /api/v1/library/{id}/file/chords.json` 캐시 hit 시 즉시 로드, 없으면 "Analyze chords" 버튼(ingest+analyze GPU). 라벨 정규화(`A#:maj`→`A♯`, `F#:min7`→`F♯m7`, `G#:maj/3`→`G♯/3`, `N`→"—"), 활성 segment 호박색 하이라이트 + 자동 가운데 스크롤, 클릭 시 YouTube seek. SongsViewV2에 TabView 직전 mount.
  - **v1 베이스 탭 폐기**: SongTracks.ts의 13개 `*Bass()` 함수 일괄 `events: ev` → `events: []` (auto-extracted bandpass+pYIN 데이터 제거, 메타데이터/measure는 유지). 베이스 탭 영역은 의도적으로 빈 캔버스 — 코드 타임라인이 대체.
  - **Stem Mixer 추가** (StemSeparator 확장, `src/features/songs/StemSeparator.tsx`): 4스템 동기 재생 + per-stem M/S/볼륨, master ref(첫 번째 가용 스템)가 time/duration 구동, 250ms 주기 drift 보정(>80ms threshold), solo가 mute 오버라이드. "베이스만 빼고 합주" / "베이스만 듣기" 시나리오용.
  - **빌드/E2E**: 63 modules, 381KB JS / 18KB CSS. Playwright로 PC 1440x900 KICK BACK 선택 → 캐시된 85 segments 즉시 렌더, 첫 코드 `A♯` 활성 + 라벨 정규화 작동 확인. 콘솔 에러 0 (favicon 404·YouTube postMessage 무해).
  - **인프라 메모**: `vite preview`는 dist/를 매 요청마다 읽으므로 빌드만 하면 라이브 반영, 서비스 재시작 불필요. 표준 포트 3001 라이브.
  - **미검증**: 실사용 (베이스 연습) — 사용자 검증 중. KICK BACK 외 12곡은 GPU 분석 대기 (사용자가 곡 선택 시 "Analyze chords" 버튼 → 약 10초 GPU 작업).
- **2026-04-26**: **UI 전면 재설계 — v2 SongsView + 키오스크 셸**.
  - **SongsView v2** (`src/features/songs/v2/SongsViewV2.tsx`, 623L): "Amplified Underground" 테마 (bg #0a0a0a, amber #fbbc00 primary, rose #ffb2be secondary, serif italic 브랜딩, monospace 데이터). 사이드바 카테고리별 곡 리스트 + 인스트루먼트 토글 + Now Practicing 카드 + YouTube 임베드 + sync 슬라이더 + TabView + Fretboard + StemSeparator. 기존 `SongsView.tsx`는 v2 re-export 3줄로 축소.
  - **StageMode** (`src/features/songs/StageMode.tsx`): 풀스크린 연주 뷰. 키보드 핸들러는 `{capture: true}` + `stopImmediatePropagation()`로 App.tsx의 window keydown과 충돌 방지.
  - **Fretboard NaN 가드**: `Number.isFinite` + `0 ≤ fret ≤ visibleFrets`, `0 ≤ string < stringCount` 필터로 SVG NaN 22건 해소.
  - **키오스크 셸** (`src/app/AppRail.tsx` 신규 + `App.tsx` 재구성): 상단 헤더/하단 푸터 완전 제거 → 좌측 64px 아이콘 레일 (Practice/Drills/Curriculum 3개, amber 활성 + glow), 하단 vertical "BocchiMaster" 워드마크. 디폴트 뷰 `songs`. Drills 뷰 셀렉터(neon-cyan/pink) → amber 톤 통일, 중복 "Songs →" 버튼 제거.
  - **빌드/E2E**: 62 modules, 372KB JS / 16KB CSS. Playwright로 PC 1440x900 · TV 1920x1080 렌더 검증, 3개 레일 뷰 클릭 전환 OK. 콘솔 에러 0 (favicon 404만).
  - **미검증**: 실사용 (베이스 연습) 미진행 — 사용자 테스트 대기.
- **2026-04-22**: **오디오 처리 전면 15_AudioChord(:8220) 위임**.
  - **StemSeparator**: 자체 Demucs → AudioChord `/api/v1/ingest/youtube` + `/api/v1/separate` (Nous GPU). Vite proxy로 CORS 우회(`/api/v1/*` → `localhost:8220`).
  - **Bass 추출 (`scripts/extract_bass_v2.py`)**: 로컬 Demucs+pYIN → AudioChord `/api/v1/analyze/pitch-to-midi` (Demucs + Basic Pitch GPU). MIDI 다운로드 후 mido로 파싱, 쿼런타이즈는 로컬 유지.
  - **Keep on bocchi backend**: `/api/chord-search/` (Claude CLI), `/api/parse/tab` (Guitar Pro 파서).
  - **제거**: `server/main.py`의 `/api/separate`, `/stems` 마운트, Demucs/torch 의존, `_run_separation` BG 태스크.
- **백엔드 포트**: bocchi `:8081` (chord-search + tab parse only), AudioChord `:8220`.
- **프론트엔드 포트**: 3001 좀비 프로세스(PID 7520, Service로 실행 중이라 kill 불가) → **3011**에서 개발 중.
- **베이스 트랙 데이터**: 13곡 모두 v1 auto-extracted 데이터 폐기 (`events: []`). 코드 타임라인이 베이스 탭 역할 대체.

## Backlog
### 즉시
- [x] **Learn 탭 시각 검증** — 2026-04-30 Playwright MCP 노출 후 vite preview 4173에서 e2e 검증 완료. PC 1440x900 + TV 1920x1080 모두 렌더 OK, 7섹션 + 4개 인터랙션(stage→[5] / pickup→bridge / EQ band→sizzle / clipping→Fuzz 사각파) 모두 정상 반응. 콘솔 에러 0 (favicon 404만). 발견된 단일 버그: `ToneVocabulary` 막대 height 계산 (자식이 부모 높이 0%) → 라벨/막대 분리 구조로 수정 후 재검증 정상.
- [ ] **ChordTimeline 코드 정확도 검증** — 사용자 검증 중. KICK BACK Crema 분석 (85 segments) 음악적으로 합리적인지 (인트로 A♭/F → 코러스 C♯m/F♯m7 등). 다른 곡들은 "Analyze chords" 버튼으로 trigger 후 비교.
- [-] **v2 UI 실사용 검증** — 2026-05-03 Playwright PC 1440x900 회귀 검증 (preview 4174). SongsView V2 / KICK BACK 트랙 (ChordTimeline 85 segments A♯ 활성 + StagesPanel + TabView + Fretboard + StemSeparator) / Drills (Practice·CAGED) / Curriculum (Guitar·Bass 6 레벨) / Learn (8섹션) 모두 정상 렌더, 콘솔 에러 0 (favicon 404만). 실사용(베이스 연습 1세션) 검증은 사용자 직접만 가능 — 별 backlog로 유지.
- [ ] **Stem Mixer 동기/드리프트 실사용 검증** — "베이스만 빼고 합주" 시나리오에서 250ms drift 보정 충분한지.
- [ ] AudioChord 기반 Stem Separator 품질 검증 (사용자 테스트)

### 단기
- [ ] **마디별 코드 정렬 (Phase 2)** — 현재 ChordTimeline은 시간폭 비례 박스. 사용자 요청 "마디마다 코드"를 위해 BPM+시그너처로 마디 그리드 양자화. AudioChord `/api/v1/analyze/beats`로 비트 추출 → 마디 단위 chord 도미넌트 결정 → `│ G │ D │ Em │ C │` 형태.
- [x] **v1 bass 함수 정리** — 2026-04-30 perl multiline regex로 13개 dead `const ev: NoteEvent[] = [...]` 블록 일괄 제거. SongTracks.ts 3417→971 lines (-2446), JS 번들 425KB→380KB (-45KB). `.bak` 백업 파일은 사용자 검증 후 삭제 예정. 함수 시그니처는 유지(`events: []` + `measures(N)`).
- [ ] GP 업로드 UI (프론트엔드) — tab_parser 결과 → Track loader 연결 (대안 경로)
- [ ] Songsterr API 또는 Guitar Pro 수동 수급 (정확한 탭 필요 시)
- [x] **15_AudioChord OpenAPI → TypeScript 자동 생성** — 2026-05-03 `src/api/audiochord.types.ts` + `src/api/audiochord.ts` 작성. openapi-typescript 7.13.0, 9 endpoints. StemSeparator/ChordTimeline 등 기존 consumer 마이그는 별 backlog로 두고, 새 코드만 type-safe client 사용.

### 나중에
- [ ] YouTube sync offset 자동 검출 (현재 수동 슬라이더)
- [ ] bocchi 백엔드 스크립트용 requirements (`requests`, `mido`) 정리 (현재 전역 venv 의존)
- [ ] **LG 리모콘 제어 어댑터** — 02_LGRemoteInput의 `/ws/remote` WebSocket 구독 (18_DashboardWeb과 동일 채널 공유). 어댑터: 리모콘 버튼 → 키보드 이벤트 매핑 (PLAY/PAUSE→Space, ▲▼→BPM ↑↓, ◀▶→loop nav, BACK→Esc, RED→mode 토글). 의존: 02_LGRemoteInput 측 `/ws/remote` 구현 선행 (현재 hub backlog/18_DashboardWeb 항목). UI 진입점은 키오스크 셸이라 별도 화면 없이 키보드 핸들러에 흡수 가능.
