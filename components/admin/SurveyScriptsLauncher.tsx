"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { SurveyScriptsDialog } from "@/components/admin/SurveyScriptsDialog";
import type { SharedResponseScript } from "@/lib/shared-scripts";
import type { SurveyScriptAdminRow } from "@/lib/survey-scripts-admin";

type Props = {
  sharedScripts: SharedResponseScript[];
  surveyScripts: SurveyScriptAdminRow[];
  defaultOpen?: boolean;
};

export function SurveyScriptsLauncher({
  sharedScripts,
  surveyScripts,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
      >
        <FileText className="h-4 w-4" aria-hidden />
        스크립트 관리
      </button>
      <SurveyScriptsDialog
        open={open}
        onClose={() => setOpen(false)}
        sharedScripts={sharedScripts}
        surveyScripts={surveyScripts}
      />
    </>
  );
}
