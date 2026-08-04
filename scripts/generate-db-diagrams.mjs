/**
 * DB ER 다이어그램 SVG/PNG 생성
 * Run: node scripts/generate-db-diagrams.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Resvg } = require("@resvg/resvg-js");

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs", "db");
mkdirSync(outDir, { recursive: true });

const css = `
  .title { font: 700 30px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #0f172a; }
  .subtitle { font: 500 14px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #64748b; }
  .domain { font: 700 12px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
  .tbl { font: 700 12px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
  .col { font: 500 11px 'Consolas', 'Malgun Gothic', monospace; fill: #334155; }
  .pk { font: 600 11px 'Consolas', 'Malgun Gothic', monospace; fill: #1e3a5f; }
  .fk { font: 500 11px 'Consolas', 'Malgun Gothic', monospace; fill: #0f766e; }
  .note { font: 500 11px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #64748b; }
  .rel { font: 600 11px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #475569; }
  .foot { font: 500 11px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #64748b; }
`;

function tableBox(x, y, w, h, title, cols, headerColor) {
  const headerH = 30;
  const lines = cols
    .map((c, i) => {
      const cls = c.startsWith("PK ") ? "pk" : c.startsWith("FK ") ? "fk" : "col";
      return `<text x="${x + 12}" y="${y + headerH + 18 + i * 16}" class="${cls}">${escapeXml(c)}</text>`;
    })
    .join("\n");
  return `
  <g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" stroke="#cbd5e1"/>
    <rect x="${x}" y="${y}" width="${w}" height="${headerH}" rx="10" fill="${headerColor}"/>
    <rect x="${x}" y="${y + headerH - 10}" width="${w}" height="10" fill="${headerColor}"/>
    <text x="${x + 12}" y="${y + 20}" class="tbl">${escapeXml(title)}</text>
    ${lines}
  </g>`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function svgDoc(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <filter id="shadow" x="-4%" y="-4%" width="108%" height="116%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#64748b"/>
    </marker>
    <style>${css}</style>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  ${body}
</svg>`;
}

const core = svgDoc(`
  <text x="56" y="48" class="title">데이터베이스 구조 — 설문 코어</text>
  <text x="56" y="74" class="subtitle">surveys · questions · options · responses · CATI samples  ·  Supabase Postgres</text>

  ${tableBox(56, 110, 260, 210, "surveys", [
    "PK id uuid",
    "slug (unique)",
    "title · summary",
    "status 진행중|예정|종료",
    "period_start / period_end",
    "listed_public",
    "response_script",
    "target_count · response_count",
  ], "#1e3a5f")}

  ${tableBox(400, 110, 280, 230, "survey_questions", [
    "PK id",
    "FK survey_id → surveys",
    "order_index · prompt",
    "question_type (11종)",
    "allow_skip · staff_only",
    "visibility_rules jsonb",
    "max_selections · text_line_count",
    "info_body · media_url/path/type",
  ], "#0f766e")}

  ${tableBox(760, 110, 280, 180, "survey_question_options", [
    "PK id",
    "FK question_id → questions",
    "order_index · label",
    "is_other",
    "ends_survey ★",
  ], "#b45309")}

  ${tableBox(1120, 110, 420, 150, "question_type CHECK", [
    "mc_single · mc_multi · dropdown · rank",
    "text_single · text_multi",
    "likert_7 · likert_multi · star_rating",
    "info_media · contact_fields",
  ], "#475569")}

  <line x1="316" y1="200" x2="400" y2="200" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>
  <text x="340" y="190" class="rel">1:N</text>
  <line x1="680" y1="200" x2="760" y2="200" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>
  <text x="700" y="190" class="rel">1:N</text>

  ${tableBox(56, 380, 280, 170, "survey_responses", [
    "PK id",
    "FK survey_id → surveys",
    "FK respondent_user_id",
    "respondent_kind staff|guest",
    "FK sample_id (nullable)",
    "submitted_at",
  ], "#5b21b6")}

  ${tableBox(420, 380, 300, 150, "survey_response_answers", [
    "PK id",
    "FK response_id → responses",
    "FK question_id → questions",
    "UNIQUE (response_id, question_id)",
    "answer jsonb",
  ], "#6b21a8")}

  <line x1="196" y1="320" x2="196" y2="380" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>
  <text x="208" y="355" class="rel">1:N</text>
  <line x1="336" y1="450" x2="420" y2="450" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>
  <text x="360" y="440" class="rel">1:N</text>
  <path d="M540 340 V360 H570 V380" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="580" y="365" class="note">question_id</text>

  ${tableBox(800, 380, 300, 170, "survey_sample_batches", [
    "PK id",
    "FK survey_id → surveys",
    "version_number (unique/survey)",
    "column_headers jsonb",
    "status uploading|ready|failed",
    "is_active · uploaded_by",
  ], "#9a3412")}

  ${tableBox(1180, 380, 360, 190, "survey_samples", [
    "PK id",
    "FK batch_id → batches",
    "FK survey_id → surveys",
    "uid (unique/batch)",
    "row_data jsonb",
    "outcome_* (통화 결과)",
    "outcome_updated_by → profiles",
  ], "#c2410c")}

  <line x1="316" y1="280" x2="800" y2="420" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arr)"/>
  <line x1="1100" y1="450" x2="1180" y2="450" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>
  <text x="1120" y="440" class="rel">1:N</text>
  <line x1="196" y1="550" x2="196" y2="600" stroke="#94a3b8" stroke-width="1.5"/>
  <path d="M196 600 H1360 V570" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="900" y="595" class="note">sample_id (optional)</text>

  ${tableBox(56, 620, 300, 150, "survey_response_drafts", [
    "PK id",
    "FK survey_id · sample_id",
    "UNIQUE (sample_id)",
    "answers jsonb",
    "active_question_id",
    "updated_by → profiles",
  ], "#7c2d12")}

  ${tableBox(420, 620, 280, 130, "survey_contact_options", [
    "PK id",
    "FK survey_id → surveys",
    "position (unique/survey)",
    "label · is_success · is_active",
  ], "#9a3412")}

  ${tableBox(760, 620, 280, 130, "shared_response_scripts", [
    "PK id",
    "title · body",
    "sort_order",
    "(설문 FK 없음)",
  ], "#475569")}

  <rect x="1120" y="620" width="420" height="150" rx="12" fill="#fff" stroke="#cbd5e1" filter="url(#shadow)"/>
  <rect x="1120" y="620" width="420" height="36" rx="12" fill="#0f172a"/>
  <rect x="1120" y="644" width="420" height="12" fill="#0f172a"/>
  <text x="1136" y="644" class="domain">핵심 관계 요약</text>
  <text x="1136" y="680" class="col">surveys 1—N questions 1—N options</text>
  <text x="1136" y="700" class="col">surveys 1—N responses 1—N answers</text>
  <text x="1136" y="720" class="col">surveys 1—N batches 1—N samples</text>
  <text x="1136" y="740" class="col">samples 1—0..1 drafts · 0..N responses</text>

  <text x="56" y="860" class="note">jsonb: visibility_rules · answer · drafts.answers · column_headers · row_data</text>
  <text x="56" y="882" class="note">★ ends_survey: 보기 선택 시 조사 종료  ·  is_other: 기타 보기</text>
  <text x="56" y="960" class="foot">research-a · DB ER 01/02  ·  migrations 기준 · Postgres ENUM 없음 (text + CHECK)</text>
`);

const platform = svgDoc(`
  <text x="56" y="48" class="title">데이터베이스 구조 — 플랫폼 · CMS · KSIC</text>
  <text x="56" y="74" class="subtitle">auth/profiles · site CMS · CATI global · KSIC · Storage</text>

  <rect x="56" y="100" width="720" height="36" rx="8" fill="#1e3a5f"/>
  <text x="72" y="124" class="domain">Auth / 조직</text>

  ${tableBox(56, 150, 300, 150, "profiles", [
    "PK id → auth.users",
    "role: super_admin|sub_admin",
    "       team_lead|employee|guest",
    "survey_view_mode paged|scroll",
  ], "#1e40af")}

  ${tableBox(400, 150, 280, 120, "admin_settings", [
    "PK id (=1 singleton)",
    "signup_key",
  ], "#1e3a5f")}

  <text x="56" y="340" class="note">auth.users (Supabase Auth) 1 — 1 profiles</text>

  <rect x="800" y="100" width="744" height="36" rx="8" fill="#0f766e"/>
  <text x="816" y="124" class="domain">Site CMS</text>

  ${tableBox(800, 150, 280, 140, "site_settings", [
    "PK id (=1)",
    "site_name",
    "logo_url · logo_path",
    "site_name_font",
  ], "#0f766e")}

  ${tableBox(1120, 150, 200, 110, "site_nav_groups", [
    "PK key text",
    "label · sort_order",
    "guide_* media",
  ], "#134e4a")}

  ${tableBox(800, 320, 260, 130, "site_nav_items", [
    "PK id",
    "FK group_key → groups",
    "FK page_id → pages",
    "label · href · sort_order",
  ], "#0f766e")}

  ${tableBox(1100, 320, 220, 110, "site_pages", [
    "PK id",
    "slug (unique)",
    "title · body",
  ], "#115e59")}

  ${tableBox(1360, 320, 184, 130, "site_banners", [
    "PK id",
    "media_type image|pdf",
    "placement popup|top",
    "is_active · file_*",
  ], "#134e4a")}

  <line x1="1320" y1="200" x2="1320" y2="280" stroke="#64748b" stroke-width="1.5"/>
  <line x1="930" y1="280" x2="930" y2="320" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>
  <text x="942" y="305" class="rel">1:N</text>
  <line x1="1060" y1="380" x2="1100" y2="380" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>
  <text x="1068" y="370" class="rel">N:0..1</text>

  <rect x="56" y="480" width="720" height="36" rx="8" fill="#9a3412"/>
  <text x="72" y="504" class="domain">CATI 공통 · 표본 연계 (코어의 samples와 연결)</text>

  ${tableBox(56, 530, 320, 130, "cati_contact_options_global", [
    "PK id",
    "position (unique)",
    "label · is_success · is_active",
    "(설문 FK 없음 — 전역 기본)",
  ], "#9a3412")}

  <rect x="400" y="530" width="360" height="130" rx="12" fill="#fff7ed" stroke="#fdba74" filter="url(#shadow)"/>
  <text x="416" y="568" class="pk">설문별 옵션</text>
  <text x="416" y="592" class="col">survey_contact_options</text>
  <text x="416" y="612" class="note">survey_id FK · 코어 ER 01 참고</text>
  <text x="416" y="636" class="note">batches / samples / drafts도 01</text>

  <rect x="800" y="480" width="744" height="36" rx="8" fill="#5b21b6"/>
  <text x="816" y="504" class="domain">KSIC 산업분류</text>

  ${tableBox(800, 530, 300, 170, "ksic_codes", [
    "PK (revision, code)",
    "FK (revision, parent_code)",
    "name · path · level",
    "AI context fields",
  ], "#5b21b6")}

  ${tableBox(1140, 530, 380, 120, "ksic_detail_ai", [
    "PK (revision, detail_code)",
    "FK → ksic_codes",
    "survey AI context texts",
  ], "#6b21a8")}

  ${tableBox(800, 730, 300, 120, "ksic_external_sync_runs", [
    "PK id",
    "source · status",
    "diff_summary jsonb",
  ], "#4c1d95")}

  ${tableBox(1140, 730, 380, 120, "ksic_external_codes", [
    "PK (revision, source, code)",
    "FK sync_run_id → runs",
    "raw jsonb",
  ], "#5b21b6")}

  <line x1="1100" y1="600" x2="1140" y2="580" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr)"/>
  <line x1="1100" y1="780" x2="1140" y2="780" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>
  <text x="1108" y="770" class="rel">1:N</text>

  <rect x="56" y="700" width="700" height="150" rx="12" fill="#fff" stroke="#cbd5e1" filter="url(#shadow)"/>
  <rect x="56" y="700" width="700" height="36" rx="12" fill="#0f172a"/>
  <rect x="56" y="724" width="700" height="12" fill="#0f172a"/>
  <text x="72" y="724" class="domain">Storage buckets</text>
  <text x="72" y="768" class="col">site-page-assets — 공개 · 10MB · 이미지/PDF (CMS)</text>
  <text x="72" y="792" class="col">survey-question-media — 공개 · 50MB · 이미지/영상 (문항)</text>
  <text x="72" y="820" class="note">업로드는 Service Role · SELECT는 public 정책</text>

  <text x="56" y="960" class="foot">research-a · DB ER 02/02  ·  public 테이블 25개 · Storage 버킷 2개</text>
`);

const diagrams = {
  "01-er-core-survey": core,
  "02-er-platform": platform,
};

for (const [name, content] of Object.entries(diagrams)) {
  const svgPath = join(outDir, `${name}.svg`);
  writeFileSync(svgPath, content, "utf8");
  const resvg = new Resvg(Buffer.from(content, "utf8"), {
    fitTo: { mode: "width", value: 1920 },
    font: { loadSystemFonts: true, defaultFontFamily: "Malgun Gothic" },
  });
  const png = resvg.render().asPng();
  writeFileSync(join(outDir, `${name}.png`), png);
  console.log("OK", name, png.length);
}

writeFileSync(
  join(outDir, "README.md"),
  `# DB 구조도

마이그레이션(\`supabase/migrations\`) 기준 ER 다이어그램입니다.

| 파일 | 내용 |
|------|------|
| \`01-er-core-survey.png\` | 설문·문항·보기·응답·표본(CATI) 코어 |
| \`02-er-platform.png\` | Auth · CMS · KSIC · Storage |

재생성: \`node scripts/generate-db-diagrams.mjs\`
`,
  "utf8",
);

console.log("Done →", outDir);
