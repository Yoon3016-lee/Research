"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import {
  cleanOptionTemplateInput,
} from "@/lib/survey-option-templates";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SurveyOptionTemplateActionState = {
  error?: string;
  ok?: boolean;
};

function revalidateOptionTemplatePaths() {
  revalidatePath("/admin/surveys/option-templates");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/surveys/new");
  revalidatePath("/admin/surveys/edit");
}

export async function createSurveyOptionTemplateAction(
  formData: FormData,
): Promise<SurveyOptionTemplateActionState> {
  await requireAdminPanelAccess();

  const cleaned = cleanOptionTemplateInput(
    String(formData.get("title") ?? ""),
    String(formData.get("optionsText") ?? ""),
  );
  if (!cleaned.ok) return { error: cleaned.error };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: maxRow } = await admin
    .from("survey_option_templates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder =
    typeof maxRow?.sort_order === "number" ? maxRow.sort_order + 1 : 0;

  const { error } = await admin.from("survey_option_templates").insert({
    title: cleaned.title,
    options: cleaned.options,
    sort_order: nextOrder,
  });

  if (error) {
    if (error.message.includes("survey_option_templates")) {
      return {
        error:
          "DB에 survey_option_templates 테이블이 없습니다. 마이그레이션을 실행하세요.",
      };
    }
    return { error: error.message };
  }

  revalidateOptionTemplatePaths();
  return { ok: true };
}

export async function updateSurveyOptionTemplateAction(
  formData: FormData,
): Promise<SurveyOptionTemplateActionState> {
  await requireAdminPanelAccess();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "템플릿 ID가 없습니다." };

  const cleaned = cleanOptionTemplateInput(
    String(formData.get("title") ?? ""),
    String(formData.get("optionsText") ?? ""),
  );
  if (!cleaned.ok) return { error: cleaned.error };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("survey_option_templates")
    .update({
      title: cleaned.title,
      options: cleaned.options,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateOptionTemplatePaths();
  return { ok: true };
}

export async function deleteSurveyOptionTemplateAction(
  formData: FormData,
): Promise<SurveyOptionTemplateActionState> {
  await requireAdminPanelAccess();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "템플릿 ID가 없습니다." };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin.from("survey_option_templates").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateOptionTemplatePaths();
  return { ok: true };
}
