import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import {
  MAX_SURVEY_OPTION_LABEL_LENGTH,
  MAX_SURVEY_OPTION_TEMPLATE_OPTIONS,
  MAX_SURVEY_OPTION_TEMPLATE_TITLE_LENGTH,
  parseBulkOptionText,
} from "@/lib/survey-option-bulk";
import type { SurveyOptionTemplateSummary } from "@/lib/survey-option-template-types";

export type { SurveyOptionTemplateSummary };

type Row = {
  id: string;
  title: string;
  options: unknown;
  sort_order: number;
};

function normalizeOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0)
    .slice(0, MAX_SURVEY_OPTION_TEMPLATE_OPTIONS);
}

function mapRow(row: Row): SurveyOptionTemplateSummary {
  return {
    id: row.id,
    title: row.title,
    options: normalizeOptions(row.options),
    sortOrder: row.sort_order,
  };
}

export async function listSurveyOptionTemplates(): Promise<SurveyOptionTemplateSummary[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("survey_option_templates")
    .select("id, title, options, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[listSurveyOptionTemplates]", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRow(row as Row));
}

export type CleanOptionTemplateInput =
  | { ok: true; title: string; options: string[] }
  | { ok: false; error: string };

/** FormData 또는 문자열에서 템플릿 입력 검증 */
export function cleanOptionTemplateInput(
  titleRaw: string,
  optionsRaw: string | string[],
): CleanOptionTemplateInput {
  const title = titleRaw.trim();
  if (!title) {
    return { ok: false, error: "템플릿 이름을 입력하세요." };
  }
  if (title.length > MAX_SURVEY_OPTION_TEMPLATE_TITLE_LENGTH) {
    return {
      ok: false,
      error: `템플릿 이름은 ${MAX_SURVEY_OPTION_TEMPLATE_TITLE_LENGTH}자 이하여야 합니다.`,
    };
  }

  const options =
    typeof optionsRaw === "string"
      ? parseBulkOptionText(optionsRaw)
      : optionsRaw.map((o) => o.trim()).filter(Boolean);

  if (options.length === 0) {
    return { ok: false, error: "보기를 한 줄에 하나씩 입력해 주세요." };
  }
  if (options.length > MAX_SURVEY_OPTION_TEMPLATE_OPTIONS) {
    return {
      ok: false,
      error: `보기는 최대 ${MAX_SURVEY_OPTION_TEMPLATE_OPTIONS}개까지 저장할 수 있습니다.`,
    };
  }
  if (options.some((o) => o.length > MAX_SURVEY_OPTION_LABEL_LENGTH)) {
    return {
      ok: false,
      error: `보기 문구는 ${MAX_SURVEY_OPTION_LABEL_LENGTH}자 이하여야 합니다.`,
    };
  }

  return { ok: true, title, options };
}
