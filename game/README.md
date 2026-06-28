# game/ — Planet Pool Merge (HTML5 프로토타입)

세로형 **물리 머지** 프로토타입 — 풀 조준(슬링샷) + Suika식 합성. 설계 정본은 `../docs/`.

## 스택
Vite + TypeScript + **PixiJS**(2D 렌더) + **Matter.js**(2D 물리). 근거:
`../docs/60-implementation/tech-stack.md`.

## 실행
```
npm install
npm run dev       # http://localhost:5199
npm run build     # 정적 산출물 dist/
npm run preview   # dist/ 미리보기
```

## 플레이
하단 발사대 행성을 누르고 **뒤로 당겼다 놓으면**(슬링샷) 반대 방향으로 발사된다. 같은 행성끼리
충돌시키면 다음 단계로 합성된다(수성→화성→…→태양). 게임 오버는 없고 Score로 검증한다.

## 구조 (9 모듈, `src/`)
`GameScene` · `PhysicsWorld` · `PlanetFactory` · `Launcher` · `QueueSystem` · `MergeSystem` ·
`ScoreSystem` · `Hud` · `BoardRenderer`. 데이터(수치/행성 SSoT 미러): `src/data/{config,planets}.ts`.
Matter가 권위(위치/속도/충돌), Pixi는 매 프레임 바디를 읽어 그리는 단방향 렌더.

## 검증 (Playwright)
```
npx playwright test     # 14/14 통과 (desktop 1280×800 + mobile 390×844)
```
기준: `../docs/70-verification/index.md`(KPI 8 + 완료 체크리스트 16). 검증 스펙: `tests/play.spec.ts`.
