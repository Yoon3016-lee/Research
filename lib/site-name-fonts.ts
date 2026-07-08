/** 홈페이지 이름에 적용 가능한 글꼴 (site_settings.site_name_font) */

export const SITE_NAME_FONT_KEYS = [
  "source-serif-4",
  "noto-sans-kr",
  "noto-serif-kr",
  "gowun-batang",
  "gowun-dodum",
  "nanum-gothic",
  "nanum-myeongjo",
  "gothic-a1",
  "ibm-plex-sans-kr",
  "black-han-sans",
  "do-hyeon",
  "jua",
  "gasoek-one",
  "bagel-fat-one",
  "sunflower",
  "dongle",
  "east-sea-dokdo",
  "poor-story",
] as const;

export type SiteNameFontKey = (typeof SITE_NAME_FONT_KEYS)[number];

export const DEFAULT_SITE_NAME_FONT: SiteNameFontKey = "source-serif-4";

export type SiteNameFontOption = {
  key: SiteNameFontKey;
  label: string;
  /** CSS font-family (공개 사이트 --font-site-name) */
  fontFamily: string;
  /** 추가 로드가 필요한 Google Fonts stylesheet URL */
  googleHref: string | null;
};

export const SITE_NAME_FONT_OPTIONS: SiteNameFontOption[] = [
  {
    key: "source-serif-4",
    label: "세리프 (기본)",
    fontFamily: 'var(--font-site-display), "Source Serif 4", Georgia, serif',
    googleHref: null,
  },
  {
    key: "noto-sans-kr",
    label: "고딕 (노토 산스)",
    fontFamily: 'var(--font-site-body), "Noto Sans KR", sans-serif',
    googleHref: null,
  },
  {
    key: "noto-serif-kr",
    label: "명조 (노토 세리프)",
    fontFamily: '"Noto Serif KR", serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600;700&display=swap",
  },
  {
    key: "gowun-batang",
    label: "바탕 (고운바탕)",
    fontFamily: '"Gowun Batang", serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&display=swap",
  },
  {
    key: "gowun-dodum",
    label: "고딕 (고운돋움)",
    fontFamily: '"Gowun Dodum", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap",
  },
  {
    key: "nanum-gothic",
    label: "고딕 (나눔고딕)",
    fontFamily: '"Nanum Gothic", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@700;800&display=swap",
  },
  {
    key: "nanum-myeongjo",
    label: "명조 (나눔명조)",
    fontFamily: '"Nanum Myeongjo", serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@700;800&display=swap",
  },
  {
    key: "gothic-a1",
    label: "고딕 (Gothic A1)",
    fontFamily: '"Gothic A1", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Gothic+A1:wght@500;600;700&display=swap",
  },
  {
    key: "ibm-plex-sans-kr",
    label: "고딕 (IBM Plex Sans)",
    fontFamily: '"IBM Plex Sans KR", sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@500;600;700&display=swap",
  },
  {
    key: "black-han-sans",
    label: "고딕 (검은고딕)",
    fontFamily: '"Black Han Sans", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap",
  },
  {
    key: "do-hyeon",
    label: "고딕 (도현)",
    fontFamily: '"Do Hyeon", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap",
  },
  {
    key: "jua",
    label: "고딕 (주아)",
    fontFamily: '"Jua", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Jua&display=swap",
  },
  {
    key: "gasoek-one",
    label: "디스플레이 (가석체)",
    fontFamily: '"Gasoek One", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Gasoek+One&display=swap",
  },
  {
    key: "bagel-fat-one",
    label: "디스플레이 (베이글 팻)",
    fontFamily: '"Bagel Fat One", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Bagel+Fat+One&display=swap",
  },
  {
    key: "sunflower",
    label: "디스플레이 (해바라기)",
    fontFamily: '"Sunflower", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Sunflower:wght@700&display=swap",
  },
  {
    key: "dongle",
    label: "둥근 고딕 (동글)",
    fontFamily: '"Dongle", sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Dongle:wght@700&display=swap",
  },
  {
    key: "east-sea-dokdo",
    label: "붓글씨 (동해 독도)",
    fontFamily: '"East Sea Dokdo", cursive',
    googleHref: "https://fonts.googleapis.com/css2?family=East+Sea+Dokdo&display=swap",
  },
  {
    key: "poor-story",
    label: "손글씨 (가난한 이야기)",
    fontFamily: '"Poor Story", cursive',
    googleHref: "https://fonts.googleapis.com/css2?family=Poor+Story&display=swap",
  },
];

const FONT_BY_KEY = new Map(SITE_NAME_FONT_OPTIONS.map((f) => [f.key, f]));

export function parseSiteNameFontKey(raw: unknown): SiteNameFontKey {
  const key = String(raw ?? "").trim() as SiteNameFontKey;
  if (FONT_BY_KEY.has(key)) return key;
  return DEFAULT_SITE_NAME_FONT;
}

export function getSiteNameFontOption(key: SiteNameFontKey): SiteNameFontOption {
  return FONT_BY_KEY.get(key) ?? FONT_BY_KEY.get(DEFAULT_SITE_NAME_FONT)!;
}
