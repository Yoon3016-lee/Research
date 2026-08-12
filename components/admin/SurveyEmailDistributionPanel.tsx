"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Mail, Send } from "lucide-react";
import {
  previewSurveyEmailAction,
  sendSurveyEmailAction,
} from "@/app/actions/survey-email-distribute";
import { AdminSurveyStatusBadge } from "@/components/admin/AdminSurveyIconActions";
import type { EmailSampleRow } from "@/lib/survey-email-shared";
import { defaultEmailInviteTemplate } from "@/lib/survey-email-shared";
import type { SurveyStatus } from "@/lib/survey-list-types";

type Props = {
  slug: string;
  title: string;
  status: SurveyStatus;
  samplesLockedAt: string | null;
  rows: EmailSampleRow[];
};

const SEND_STATUS_LABELS: Record<EmailSampleRow["sendStatus"], string> = {
  pending: "미발송",
  sent: "발송완료",
  failed: "실패",
};

export function SurveyEmailDistributionPanel({
  slug,
  title,
  status,
  samplesLockedAt,
  rows,
}: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(`[설문 안내] ${title}`);
  const [template, setTemplate] = useState(defaultEmailInviteTemplate());
  const [previewSampleId, setPreviewSampleId] = useState(rows[0]?.id ?? "");
  const [previewBody, setPreviewBody] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewPending, startPreview] = useTransition();
  const [sendPending, startSend] = useTransition();

  const stats = useMemo(() => {
    const missingLink = rows.filter((r) => !r.inviteToken).length;
    const invalidEmail = rows.filter((r) => !r.email.trim() || !r.email.includes("@")).length;
    const duplicateEmailWarning = new Map<string, number>();
    for (const r of rows) {
      const e = r.email.trim().toLowerCase();
      if (!e) continue;
      duplicateEmailWarning.set(e, (duplicateEmailWarning.get(e) ?? 0) + 1);
    }
    const dupCount = [...duplicateEmailWarning.values()].filter((c) => c > 1).length;
    return { missingLink, invalidEmail, dupCount };
  }, [rows]);

  const handlePreview = () => {
    if (!previewSampleId) {
      setError("미리보기할 표본(UID)을 선택하세요.");
      return;
    }
    setError(null);
    startPreview(async () => {
      const result = await previewSurveyEmailAction(slug, template, previewSampleId);
      if (!result.ok) {
        setError(result.error);
        setPreviewBody(null);
        return;
      }
      setPreviewBody(result.body);
    });
  };

  const runSend = (kind: "test" | "bulk", confirmMissingLinks = false) => {
    setError(null);
    setMessage(null);
    if (kind === "test" && !previewSampleId) {
      setError("테스트 발송할 표본을 선택하세요.");
      return;
    }
    startSend(async () => {
      const result = await sendSurveyEmailAction({
        slug,
        subject,
        template,
        kind,
        testSampleId: kind === "test" ? previewSampleId : undefined,
        confirmMissingLinks,
      });
      if (!result.ok) {
        if (result.missingLinkCount && result.missingLinkCount > 0) {
          const ok = confirm(
            `${result.missingLinkCount}건의 링크가 없습니다. 그대로 전송하시겠습니까?`,
          );
          if (ok) runSend(kind, true);
          return;
        }
        setError(result.error);
        return;
      }
      setMessage(
        kind === "test"
          ? "테스트 메일을 발송했습니다."
          : `발송 완료: ${result.sent}건 · 실패 ${result.failed}건 · 링크 없음 ${result.skippedNoLink}건`,
      );
      router.refresh();
    });
  };

  const handleSend = (kind: "test" | "bulk") => runSend(kind);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="admin-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="site-eyebrow">Email distribution</p>
            <h2 className="mt-1 text-lg font-semibold text-brand-900">{title}</h2>
            <p className="mt-1 text-xs text-brand-700/80">
              이메일 형식 · 표본 {rows.length}건
              {samplesLockedAt ? " · 표본 잠김(본 발송 후)" : ""}
            </p>
          </div>
          <AdminSurveyStatusBadge status={status} />
        </div>
      </section>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          활성 표본이 없습니다.{" "}
          <a href={`/admin/surveys/samples?slug=${encodeURIComponent(slug)}`} className="underline">
            표본 관리
          </a>
          에서 UID·이메일 엑셀을 업로드하세요.
        </p>
      ) : null}

      {stats.dupCount > 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          주의: 서로 다른 UID에 동일 이메일 주소가 {stats.dupCount}건 있습니다. 업로드·발송은
          계속할 수 있습니다.
        </p>
      ) : null}

      <section className="admin-card p-6">
        <h3 className="text-sm font-semibold text-brand-900">메일 본문</h3>
        <p className="mt-1 text-xs text-brand-700/80">
          (OOO님) · {"{{이름}}"} · {"{{링크}}"} · {"{{열글자}}"}(Excel 열) 사용 가능. 제목에는 머지
          없음.
        </p>
        <label className="mt-4 block">
          <span className="admin-label">제목</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="admin-input mt-1.5"
          />
        </label>
        <label className="mt-4 block">
          <span className="admin-label">본문 (텍스트)</span>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={12}
            className="admin-input mt-1.5 font-mono text-[13px] leading-relaxed"
          />
        </label>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="font-medium text-brand-800">미리보기 UID</span>
            <select
              value={previewSampleId}
              onChange={(e) => setPreviewSampleId(e.target.value)}
              className="mt-1 w-full min-w-[12rem] rounded-xl border border-brand-900/12 bg-white px-3 py-2 text-sm"
            >
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.uid}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewPending || rows.length === 0}
            className="admin-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            {previewPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
            미리보기
          </button>
        </div>
        {previewBody ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-brand-900/8 bg-surface/50 p-4 text-sm">
            {previewBody}
          </pre>
        ) : null}
      </section>

      <section className="admin-card overflow-x-auto p-6">
        <h3 className="text-sm font-semibold text-brand-900">표본 목록</h3>
        <table className="mt-4 w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-900/10 text-xs text-brand-700">
              <th className="px-2 py-2">UID</th>
              <th className="px-2 py-2">이메일</th>
              <th className="px-2 py-2">발송결과</th>
              <th className="px-2 py-2">응답여부</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-brand-900/6">
                <td className="px-2 py-2 font-mono text-xs">{r.uid}</td>
                <td className="px-2 py-2">
                  {r.email || <span className="text-red-600">(없음)</span>}
                  {!r.email.includes("@") && r.email ? (
                    <span className="ml-1 text-xs text-red-600">형식 오류</span>
                  ) : null}
                </td>
                <td className="px-2 py-2">{SEND_STATUS_LABELS[r.sendStatus]}</td>
                <td className="px-2 py-2">{r.responded ? "응답완료" : "미응답"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={sendPending || rows.length === 0}
          onClick={() => handleSend("test")}
          className="admin-btn-secondary inline-flex items-center gap-2 px-5 py-3 text-sm"
        >
          <Mail className="h-4 w-4" aria-hidden />
          테스트 발송
        </button>
        <button
          type="button"
          disabled={sendPending || rows.length === 0}
          onClick={() => handleSend("bulk")}
          className="admin-btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm"
        >
          {sendPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          일괄 발송
        </button>
      </div>
      {stats.missingLink > 0 ? (
        <p className="text-xs text-amber-800">
          링크 없음 {stats.missingLink}건 — 표본 활성화·토큰 생성을 확인하세요.
        </p>
      ) : null}
    </div>
  );
}
