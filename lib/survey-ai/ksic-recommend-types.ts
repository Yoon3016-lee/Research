/** 비정형 → KSIC 후보 추론 (클라이언트·서버 공용 타입) */

export type KsicRecommendCandidate = {
  code: string;
  name: string;
  levelName: string;
  pathKo: string;
  rationale: string;
  matchedExample?: string;
  /** 상세 패널용 */
  definition?: string;
  examples?: string[];
};

export type KsicRecommendUsageInfo = {
  used: number;
  limit: number;
  remaining: number;
};

export type KsicRecommendResult =
  | {
      status: "ok";
      candidates: KsicRecommendCandidate[];
      queriesUsed: string[];
      usage?: KsicRecommendUsageInfo;
    }
  | {
      status: "empty";
      message: string;
      queriesUsed: string[];
      usage?: KsicRecommendUsageInfo;
    }
  | { status: "error"; error: string; usage?: KsicRecommendUsageInfo }
  | {
      status: "unauthorized";
      message: string;
    }
  | {
      status: "limit_exceeded";
      message: string;
      usage: KsicRecommendUsageInfo;
    };
