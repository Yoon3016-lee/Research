# PRIME AX 공개 홈 시안 자산

ChatGPT Sites 정적 export를 Research Hub `/` 본문에 이식할 때 사용합니다.

## 구성

- `styles.css` — Shadow DOM 진입점 (`.primeax-embed` 변수 + `@import`)
- `core.css` — 원본 시안 기본 스타일
- `overrides.css` — 최신 레이아웃·반응형 보정
- `script.js` — `window.PrimeAX.init(root)` (KSIC 데모·탭·스크롤·`primeax:open-axi`)
- `body-fragment.html` / `fragment.html` — 헤더·푸터·AXI 모달 제외 본문 참고본
- `assets/` · `upload/` — 배너·로고·현장 이미지

상단바·로고·푸터는 앱의 `SiteHeader` / `SiteFooter`를 사용합니다.
실제 렌더는 `buildPublicHomeHtml()` + 관리자 **공개홈페이지 관리** CMS 값을 우선합니다.

## AXI

`data-open-axi` 클릭 시 `primeax:open-axi`(composed) → 플랫폼 AXI 패널.
