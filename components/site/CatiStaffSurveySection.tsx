import { CatiInterviewerWorkflow } from "@/components/site/CatiInterviewerWorkflow";
import { SurveyResponseForm } from "@/components/site/SurveyResponseForm";
import type { CatiContactOption } from "@/lib/cati-contact-types";
import type { PublicSurveyDetail } from "@/lib/survey-public";
import type { SurveyViewMode } from "@/lib/survey-view-mode";

type Props = {
  slug: string;
  survey: PublicSurveyDetail;
  isStaff: boolean;
  catiEnabled: boolean;
  contactOptions: CatiContactOption[];
  viewMode: SurveyViewMode;
};

export function CatiStaffSurveySection({
  slug,
  survey,
  isStaff,
  catiEnabled,
  contactOptions,
  viewMode,
}: Props) {
  if (!catiEnabled) {
    return <SurveyResponseForm survey={survey} isStaff={isStaff} viewMode={viewMode} />;
  }

  if (!isStaff) {
    return <SurveyResponseForm survey={survey} isStaff={false} viewMode={viewMode} />;
  }

  return (
    <CatiInterviewerWorkflow
      slug={slug}
      survey={survey}
      contactOptions={contactOptions}
      viewMode={viewMode}
    />
  );
}
