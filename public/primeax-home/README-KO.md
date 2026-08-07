# PRIME AX 정적 이식 패키지

이 패키지는 ChatGPT Sites에서 제작한 PRIME AX 시안을 React/Next 컴포넌트 변환 없이 사용할 수 있도록 정적 HTML/CSS/JS로 분리한 결과물입니다.

## 파일 구성

- `index.html`: 헤더·글로벌 네비·푸터를 포함한 독립 실행 미리보기
- `body-fragment.html`: 플랫폼용 본문 fragment. 헤더·글로벌 네비·푸터 및 로컬 AXI 모달 제외
- `styles.css`: 스타일 진입점. Shadow DOM용 `.primeax-embed` 스코프와 기존 스타일을 로드
- `core.css`: 원본 시안 기본 스타일
- `overrides.css`: 최신 수정사항 및 반응형 보정 스타일
- `script.js`: KSIC 데모, 배너 수치, 수행영역 탭, 스크롤 효과, AXI 연결 이벤트
- `assets/`, `upload/`: 상대경로 이미지
- `SECTION_SUMMARY.md`: 섹션 ID와 변환 변경점

## 정적 미리보기

압축을 푼 뒤 정적 서버의 문서 루트에서 `index.html`을 여십시오. `file://` 직접 열기보다 정적 서버 사용을 권장합니다.

## Next.js + Shadow DOM 이식

1. 이 폴더의 `assets/`, `upload/`, `core.css`, `overrides.css`, `styles.css`, `script.js`를 같은 공개 경로에 둡니다.
2. 외부 폰트 링크를 플랫폼 문서 `<head>`에 유지합니다.
3. `body-fragment.html` 내용을 ShadowRoot에 삽입합니다.
4. ShadowRoot 안에서 `styles.css`를 로드합니다.
5. `script.js` 실행 후 필요하면 `window.PrimeAX.init(fragmentRoot)`를 호출합니다.

fragment의 이미지 주소는 `assets/...`, `upload/...` 상대경로입니다. Next.js 페이지가 `/primeax/`라면 파일도 `public/primeax/assets`, `public/primeax/upload`에 배치해야 주소가 그대로 맞습니다.

## AXI 연결 계약

버튼의 `data-open-axi` 속성은 유지되어 있습니다. 클릭 시 DOM 이벤트 `primeax:open-axi`가 `bubbles: true`, `composed: true`로 발생합니다.

```js
shadowHost.addEventListener('primeax:open-axi', event => {
  event.preventDefault();
  openPlatformAXI();
});
```

`index.html`에는 독립 미리보기용 AXI 모달이 남아 있습니다. `body-fragment.html`에는 모달을 넣지 않았으므로 실제 플랫폼 AXI와 중복되지 않습니다.

## KSIC 프로토타입

`#ksic-form`은 서버 호출 없는 클라이언트 JS 프로토타입입니다. 이차전지·교육·공공 CX·스마트제조 키워드에 따라 샘플 KSIC 후보와 근거를 표시합니다. 실제 엔진 API 연결 전까지 기존 시안과 동일한 체험 흐름을 제공합니다.

