"use client";

import { useActionState } from "react";
import { Archive, DatabaseBackup, Download, Loader2 } from "lucide-react";
import {
  createSurveyBackupAction,
  type BackupActionState,
} from "@/app/actions/survey-response-backup";
import type { SurveyBackupListItem, SurveyBackupSummary } from "@/lib/survey-response-backup";

const SOURCE_LABELS: Record<string, string> = {
  manual: "수동 백업",
  before_edit: "설문 수정 전",
  auto_submit: "자동",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

type Props = {
  summaries: SurveyBackupSummary[];
  backupsBySurvey: Record<string, SurveyBackupListItem[]>;
};

const initial: BackupActionState = {};

export function ResponseBackupsPanel({ summaries, backupsBySurvey }: Props) {
  const [state, formAction, pending] = useActionState(createSurveyBackupAction, initial);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 px-4 py-4 text-sm text-indigo-950">
        <p className="font-medium">백업이 두 가지로 동작합니다.</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-indigo-900/90">
          <li>
            <strong>제출 아카이브</strong> — 응답이 제출될 때마다 자동 저장(운영 DB에서
            삭제돼도 복구용 JSON 보존)
          </li>
          <li>
            <strong>전체 스냅샷</strong> — 수동 백업 또는 설문 수정 직전 자동 백업
          </li>
        </ul>
      </section>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          백업이 저장되었습니다.
        </p>
      ) : null}

      {summaries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center text-sm text-zinc-600">
          등록된 설문이 없습니다.
        </p>
      ) : (
        <ul className="space-y-4">
          {summaries.map((s) => {
            const backups = backupsBySurvey[s.surveyId] ?? [];
            return (
              <li
                key={s.surveyId}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900">{s.surveyTitle}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      slug · {s.surveySlug}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-800">
                      운영 응답 {s.liveResponseCount.toLocaleString()}건
                    </span>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 font-medium text-sky-900">
                      아카이브 {s.archiveCount.toLocaleString()}건
                    </span>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 font-medium text-violet-900">
                      스냅샷 {s.backupCount.toLocaleString()}건
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
                  <p>
                    <Archive className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                    최근 아카이브 · {formatDate(s.lastArchiveAt)}
                  </p>
                  <p>
                    <DatabaseBackup className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                    최근 스냅샷 · {formatDate(s.lastBackupAt)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`/admin/backups/archives?survey=${encodeURIComponent(s.surveySlug)}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    아카이브 JSON
                  </a>
                  <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
                    <input type="hidden" name="survey" value={s.surveySlug} />
                    <input
                      type="text"
                      name="label"
                      placeholder="백업 메모 (선택)"
                      className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800"
                    />
                    <button
                      type="submit"
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-60"
                    >
                      {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <DatabaseBackup className="h-3.5 w-3.5" aria-hidden />
                      )}
                      전체 스냅샷 백업
                    </button>
                  </form>
                </div>

                {backups.length > 0 ? (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">일시</th>
                          <th className="px-3 py-2 font-medium">구분</th>
                          <th className="px-3 py-2 font-medium">메모</th>
                          <th className="px-3 py-2 text-right font-medium">응답</th>
                          <th className="px-3 py-2 text-right font-medium">답변 행</th>
                          <th className="px-3 py-2 font-medium">다운로드</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {backups.map((b) => (
                          <tr key={b.id} className="hover:bg-zinc-50/50">
                            <td className="px-3 py-2 text-zinc-700">
                              {formatDate(b.createdAt)}
                            </td>
                            <td className="px-3 py-2 text-zinc-700">
                              {SOURCE_LABELS[b.source] ?? b.source}
                            </td>
                            <td className="px-3 py-2 text-zinc-600">
                              {b.label || b.createdByEmail || "—"}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-zinc-800">
                              {b.responseCount.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-zinc-800">
                              {b.answerRowCount.toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              <a
                                href={`/admin/backups/export?backup=${encodeURIComponent(b.id)}`}
                                className="text-xs font-medium text-indigo-700 hover:underline"
                              >
                                JSON
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
