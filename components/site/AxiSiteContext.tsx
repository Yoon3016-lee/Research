"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AxiFloatingLauncher } from "@/components/site/AxiFloatingLauncher";

export type AxiMode = "general" | "survey";

export type AxiPageContext = {
  mode: AxiMode;
  surveyTitle: string;
  scriptContext: string;
  ksicCode: string;
  ksicName: string;
};

const EMPTY_CONTEXT: AxiPageContext = {
  mode: "general",
  surveyTitle: "",
  scriptContext: "",
  ksicCode: "",
  ksicName: "",
};

type AxiSiteValue = {
  axiIconUrl: string | null;
  page: AxiPageContext;
  setSurveyContext: (ctx: Omit<AxiPageContext, "mode"> | null) => void;
};

const AxiSiteContext = createContext<AxiSiteValue | null>(null);

export function AxiSiteProvider({
  axiIconUrl,
  children,
}: {
  axiIconUrl: string | null;
  children: ReactNode;
}) {
  const [page, setPage] = useState<AxiPageContext>(EMPTY_CONTEXT);

  const setSurveyContext = useCallback((ctx: Omit<AxiPageContext, "mode"> | null) => {
    if (!ctx) {
      setPage(EMPTY_CONTEXT);
      return;
    }
    setPage({
      mode: "survey",
      surveyTitle: ctx.surveyTitle,
      scriptContext: ctx.scriptContext,
      ksicCode: ctx.ksicCode,
      ksicName: ctx.ksicName,
    });
  }, []);

  const value = useMemo(
    () => ({ axiIconUrl, page, setSurveyContext }),
    [axiIconUrl, page, setSurveyContext],
  );

  return <AxiSiteContext.Provider value={value}>{children}</AxiSiteContext.Provider>;
}

export function useAxiSite(): AxiSiteValue {
  const ctx = useContext(AxiSiteContext);
  if (!ctx) {
    throw new Error("useAxiSite must be used within AxiSiteProvider");
  }
  return ctx;
}

function useAxiSiteOptional(): AxiSiteValue | null {
  return useContext(AxiSiteContext);
}

/** 공개 사이트 전역 AXI (직원 전용). children을 Provider로 감싸 설문 페이지에서 맥락 주입 가능 */
function AxiReadyMarker() {
  useEffect(() => {
    document.documentElement.dataset.axiReady = "1";
    return () => {
      delete document.documentElement.dataset.axiReady;
    };
  }, []);
  return null;
}

export function AxiSiteHost({
  axiIconUrl,
  children,
}: {
  axiIconUrl: string | null;
  children: ReactNode;
}) {
  return (
    <AxiSiteProvider axiIconUrl={axiIconUrl}>
      <AxiReadyMarker />
      {children}
      <AxiFloatingLauncher />
    </AxiSiteProvider>
  );
}

/** 설문 참여 페이지에서 KSIC·스크립트 맥락을 AXI에 연결 */
export function AxiSurveyContextBridge({
  surveyTitle,
  scriptContext,
  ksicCode = "",
  ksicName = "",
}: {
  surveyTitle: string;
  scriptContext: string;
  ksicCode?: string;
  ksicName?: string;
}) {
  const site = useAxiSiteOptional();
  const setSurveyContext = site?.setSurveyContext;

  useEffect(() => {
    if (!setSurveyContext) return;
    setSurveyContext({
      surveyTitle,
      scriptContext,
      ksicCode,
      ksicName,
    });
    return () => setSurveyContext(null);
  }, [setSurveyContext, surveyTitle, scriptContext, ksicCode, ksicName]);

  return null;
}
