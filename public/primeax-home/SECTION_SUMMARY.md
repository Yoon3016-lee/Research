# 섹션 및 변경점 요약

## 유지된 섹션 ID

| ID | 영역 | 비고 |
| --- | --- | --- |
| `#top` | 움직이는 상단 배너 | 실시간 수치·AXI 모션 유지 |
| `#why` | End-to-End Research System | Human Insight 흐름 및 4단계 프로세스 유지 |
| `#services` | Research Services | 조사 설계·분석·리서치 파트너십 |
| `#engine` | RAG KSIC Engine | 클라이언트 JS 프로토타입 유지 |
| `#axi` | AXI Advisor Agent | `data-open-axi` 유지, 플랫폼 이벤트 연결 |
| `#proof` | Delivery Evidence | 수행영역 탭·주요 수행실적·현장 이미지 |
| `#contact` | Project Inquiry | 이메일 문의 버튼 |

## 변환 변경점

- Sites의 iframe/Next 래퍼를 제거하고 정적 파일로 분리했습니다.
- `body-fragment.html`에서 사이트 헤더, 글로벌 네비, 푸터를 제외했습니다.
- fragment에서 로컬 AXI 모달을 제외하고 `primeax:open-axi` 연결 이벤트를 추가했습니다.
- CSS 변수와 기본 타이포그래피를 `.primeax-embed`에 선언해 `:root`와 `body` 의존도를 줄였습니다.
- 기존 CSS는 시각 차이를 최소화하도록 `core.css`와 `overrides.css`로 보존하고 `styles.css`에서 로드합니다.
- JS는 문서와 ShadowRoot 양쪽에서 초기화할 수 있도록 `window.PrimeAX.init(root)` API를 제공합니다.
- 내부 해시 링크는 Shadow DOM 안의 동일 ID 요소를 찾아 스크롤하도록 보완했습니다.
- `prefers-reduced-motion` 접근성 설정을 반영했습니다.
- 이미지와 업로드 자산은 모두 `assets/`, `upload/` 상대경로를 유지했습니다.

