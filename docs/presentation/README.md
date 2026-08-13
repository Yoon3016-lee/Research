# 발표용 구조·흐름도

PPT에 **PNG**를 삽입하세요 (16:9, 1920px 폭). SVG는 편집·재생성용입니다.

| 파일 | 슬라이드 용도 |
|------|---------------|
| `01-system-architecture.png` | 시스템 전체 구조 (계층) |
| `02-business-flows.png` | 관리자·응답자·면접원 업무 흐름 |
| `03-branching-logic.png` | 표시 조건 + 조사 종료 분기 |
| `04-data-and-modules.png` | 데이터 모델 · 코드 모듈 |
| `05-axi-how-it-works.png` | AXI가 답을 만드는 방법 (비전공자용) |
| `06-axi-home-vs-survey.png` | 홈 vs 설문 · KSIC 인식 (비전공자용) |
| `07-email-how-it-works.png` | 이메일 발송 방법 (비전공자용) |
| `08-email-safety-limits.png` | 이메일 안전 발송 규칙 (비전공자용) |
| `과업현황-슬라이드문장.md` | 개발 현황·잔여 과업 슬라이드 문구 (버전 A/B) |
| `chatgpt-pptx/` | ChatGPT용 전달 txt + 삽입 PNG 패키지 (버전 A/B PPTX) |

재생성(01–04): `node scripts/generate-presentation-diagrams.mjs`  
재생성(05–08): `node scripts/generate-axi-email-diagrams.mjs`
