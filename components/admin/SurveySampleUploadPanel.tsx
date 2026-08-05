"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  activateSurveySampleBatchAction,
  previewSurveySampleBatchAction,
  previewSurveySampleUploadAction,
  uploadSurveySampleBatchAction,
} from "@/app/actions/survey-samples";
import { formatColumnLabel } from "@/lib/survey-sample-columns";
import type {
  SurveySampleBatchDataPreview,
  SurveySampleBatchSummary,
  SurveySampleColumnInfo,
  SurveySampleColumnMapping,
  SurveySampleSpreadsheetPreview,
} from "@/lib/survey-sample-types";
import {
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  Upload,
  Users,
} from "lucide-react";

type Props = {
  slug: string;
  title: string;
  batches: SurveySampleBatchSummary[];
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ColumnSelect({
  label,
  value,
  columns,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  columns: SurveySampleColumnInfo[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-brand-800">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-brand-900/12 bg-white px-3 py-2.5 text-sm outline-none ring-accent-500/25 focus:ring-2 disabled:opacity-60"
      >
        <option value="">열 선택</option>
        {columns.map((col) => (
          <option key={col.letter} value={col.letter}>
            {col.letter}
          </option>
        ))}
      </select>
    </label>
  );
}

type PreviewColumn = {
  letter: string;
  title: string;
};

function buildPreviewColumns(
  mapping: SurveySampleColumnMapping,
  columns: SurveySampleColumnInfo[],
): PreviewColumn[] {
  const defs: { letter: string; role: string }[] = [];
  const add = (letter: string, role: string) => {
    if (!letter || defs.some((d) => d.letter === letter)) return;
    defs.push({ letter, role });
  };
  add(mapping.uidColumn, "UID");
  add(mapping.phoneColumn, "전화");
  add(mapping.outcomeColumn, "결과");

  return defs.map(({ letter, role }) => {
    const col = columns.find((c) => c.letter === letter);
    const base = formatColumnLabel(letter, col?.headerLabel);
    return { letter, title: `${base} · ${role}` };
  });
}

export function SurveySampleUploadPanel({ slug, title, batches }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SurveySampleSpreadsheetPreview | null>(null);
  const [mapping, setMapping] = useState<SurveySampleColumnMapping>({
    uidColumn: "",
    phoneColumn: "",
    outcomeColumn: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewPending, startPreview] = useTransition();
  const [uploadPending, startUpload] = useTransition();
  const [activatePending, startActivate] = useTransition();
  const [batchPreviewPending, startBatchPreview] = useTransition();
  const [batchPreview, setBatchPreview] = useState<SurveySampleBatchDataPreview | null>(
    null,
  );

  const activeBatch = batches.find((b) => b.isActive && b.status === "ready") ?? null;
  const previewColumns = useMemo(
    () => (preview ? buildPreviewColumns(mapping, preview.columns) : []),
    [preview, mapping],
  );

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setPreview(null);
    setError(null);
    setSuccess(null);
    setMapping({ uidColumn: "", phoneColumn: "", outcomeColumn: "" });
  };

  const handlePreview = () => {
    if (!file) {
      setError("엑셀 파일을 선택하세요.");
      return;
    }
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set("file", file);
    startPreview(async () => {
      const result = await previewSurveySampleUploadAction(fd);
      if (!result.ok) {
        setError(result.error);
        setPreview(null);
        return;
      }
      setPreview(result.preview);
      const suggested = result.preview.suggestedColumns;
      setMapping({
        uidColumn: suggested?.uidColumn ?? result.preview.columns[0]?.letter ?? "A",
        phoneColumn: suggested?.phoneColumn ?? result.preview.columns[6]?.letter ?? "G",
        outcomeColumn: suggested?.outcomeColumn ?? result.preview.columns[9]?.letter ?? "J",
      });
    });
  };

  const handleUpload = () => {
    if (!file) {
      setError("엑셀 파일을 선택하세요.");
      return;
    }
    if (!mapping.uidColumn || !mapping.phoneColumn || !mapping.outcomeColumn) {
      setError("UID·전화번호·결과 열을 모두 선택하세요.");
      return;
    }
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("file", file);
    fd.set("uid_column", mapping.uidColumn);
    fd.set("phone_column", mapping.phoneColumn);
    fd.set("outcome_column", mapping.outcomeColumn);
    startUpload(async () => {
      const result = await uploadSurveySampleBatchAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        `버전 ${result.versionNumber} 표본 ${result.rowCount.toLocaleString()}건이 업로드되었습니다.`,
      );
      handleFileChange(null);
      router.refresh();
    });
  };

  const handleActivate = (batchId: string) => {
    setError(null);
    setSuccess(null);
    startActivate(async () => {
      const result = await activateSurveySampleBatchAction(slug, batchId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess("선택한 표본 버전이 조사원에게 적용되도록 설정되었습니다.");
      router.refresh();
    });
  };

  const handleBatchPreview = (batchId: string) => {
    setError(null);
    startBatchPreview(async () => {
      const result = await previewSurveySampleBatchAction(slug, batchId);
      if (!result.ok) {
        setError(result.error);
        setBatchPreview(null);
        return;
      }
      setBatchPreview(result.preview);
    });
  };

  const downloadBatchUrl = (batchId: string) =>
    `/admin/surveys/samples/export?slug=${encodeURIComponent(slug)}&batchId=${encodeURIComponent(batchId)}`;

  const batchPreviewColumns = useMemo(() => {
    if (!batchPreview) return [];
    return [
      batchPreview.uidColumn,
      batchPreview.phoneColumn,
      batchPreview.outcomeColumn,
    ].map((letter) => {
      const role =
        letter === batchPreview.uidColumn
          ? "UID"
          : letter === batchPreview.phoneColumn
            ? "전화"
            : "결과";
      return {
        letter,
        title: `${formatColumnLabel(letter)} · ${role}`,
      };
    });
  }, [batchPreview]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="admin-card p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="site-eyebrow">CATI Samples</p>
            <h2 className="mt-1 text-lg font-semibold text-brand-900">{title}</h2>
            <p className="mt-1 text-sm text-brand-700/85">
              조사 대상 표본 엑셀을 업로드합니다. 기존 버전은 보존되며, 새 업로드는 새 버전으로
              추가됩니다.
            </p>
          </div>
        </div>

        {activeBatch ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  현재 적용 버전 · v{activeBatch.versionNumber} (
                  {activeBatch.rowCount.toLocaleString()}건)
                </p>
                <p className="mt-1 text-xs text-emerald-900/85">
                  UID 열: {activeBatch.uidColumn} · 전화: {activeBatch.phoneColumn} · 결과:{" "}
                  {activeBatch.outcomeColumn}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={batchPreviewPending}
                  onClick={() => handleBatchPreview(activeBatch.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-60"
                >
                  {batchPreviewPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                  )}
                  미리보기
                </button>
                <a
                  href={downloadBatchUrl(activeBatch.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-100"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  다운로드
                </a>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            적용된 표본이 없습니다. 엑셀을 업로드하면 조사원 CATI 화면에서 사용할 수 있습니다.
          </p>
        )}
      </section>

      <section className="admin-card p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-brand-900">
          <FileSpreadsheet className="h-4 w-4 text-emerald-700" aria-hidden />
          엑셀 업로드
        </h3>
        <p className="mt-1 text-sm text-brand-700/85">
          UID·전화번호·결과 열만 지정하면 됩니다. UID가 있는 행만 표본으로 저장되며, 빈 행과
          &quot;UID&quot; 라벨 행은 자동으로 건너뜁니다.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 text-sm">
            <span className="font-medium text-brand-800">파일</span>
            <input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              disabled={previewPending || uploadPending}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-brand-800 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-900/6 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-900"
            />
          </label>
          <button
            type="button"
            disabled={!file || previewPending || uploadPending}
            onClick={handlePreview}
            className="admin-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5"
          >
            {previewPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
            )}
            미리보기
          </button>
        </div>

        {preview ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-brand-700">
              스캔 <strong>{preview.totalRows.toLocaleString()}</strong>행 · 업로드 대상{" "}
              <strong>{preview.importableRows.toLocaleString()}</strong>건 · 미리보기 최대{" "}
              {preview.rows.length}건
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <ColumnSelect
                label="UID 열 *"
                value={mapping.uidColumn}
                columns={preview.columns}
                disabled={uploadPending}
                onChange={(uidColumn) => setMapping((prev) => ({ ...prev, uidColumn }))}
              />
              <ColumnSelect
                label="전화번호 열 *"
                value={mapping.phoneColumn}
                columns={preview.columns}
                disabled={uploadPending}
                onChange={(phoneColumn) => setMapping((prev) => ({ ...prev, phoneColumn }))}
              />
              <ColumnSelect
                label="결과 기록 열 *"
                value={mapping.outcomeColumn}
                columns={preview.columns}
                disabled={uploadPending}
                onChange={(outcomeColumn) => setMapping((prev) => ({ ...prev, outcomeColumn }))}
              />
            </div>

            <p className="text-xs text-brand-700/80">
              조사원이 UID를 입력하면 전화번호 열 값을 보여 주고, 통화 결과는 결과 기록 열에
              저장됩니다.
            </p>

            <div className="overflow-x-auto rounded-xl border border-brand-900/8">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-surface/90">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-brand-800">행</th>
                    {previewColumns.map((col) => (
                      <th key={col.letter} className="px-3 py-2 font-semibold text-brand-800">
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-900/6">
                  {preview.rows.map((row) => (
                    <tr key={row.rowIndex}>
                      <td className="px-3 py-2 tabular-nums text-brand-700">{row.rowIndex}</td>
                      {previewColumns.map((col) => (
                        <td key={col.letter} className="px-3 py-2 text-brand-900">
                          {row.cells[col.letter] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              disabled={uploadPending}
              onClick={handleUpload}
              className="admin-btn-primary inline-flex items-center gap-2 px-5 py-2.5"
            >
              {uploadPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              새 버전으로 업로드
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
            {success}
          </p>
        ) : null}
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b border-brand-900/8 px-4 py-3">
          <h3 className="text-sm font-semibold text-brand-900">표본 버전 이력</h3>
          <p className="mt-0.5 text-xs text-brand-700/80">
            이전 버전은 삭제되지 않습니다. 다른 버전을 「적용」하면 조사원이 사용하는 표본이
            바뀝니다.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-brand-900/8 bg-surface/80">
              <tr>
                <th className="px-4 py-3 font-semibold text-brand-800">버전</th>
                <th className="px-4 py-3 font-semibold text-brand-800">파일</th>
                <th className="px-4 py-3 font-semibold text-brand-800">건수</th>
                <th className="px-4 py-3 font-semibold text-brand-800">상태</th>
                <th className="px-4 py-3 font-semibold text-brand-800">업로드</th>
                <th className="px-4 py-3 font-semibold text-brand-800">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/6">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-brand-700">
                    업로드된 표본이 없습니다.
                  </td>
                </tr>
              ) : null}
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 font-mono text-brand-900">v{batch.versionNumber}</td>
                  <td className="px-4 py-3 text-brand-800">{batch.originalFilename}</td>
                  <td className="px-4 py-3 tabular-nums">{batch.rowCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {batch.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                        적용 중
                      </span>
                    ) : batch.status === "failed" ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        실패
                      </span>
                    ) : batch.status === "uploading" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        업로드 중
                      </span>
                    ) : (
                      <span className="rounded-full bg-brand-900/6 px-2 py-0.5 text-xs font-medium text-brand-800">
                        보관
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-700">
                    <p>{formatDate(batch.createdAt)}</p>
                    {batch.uploadedByEmail ? (
                      <p className="mt-0.5 text-brand-600">{batch.uploadedByEmail}</p>
                    ) : null}
                    {batch.errorMessage ? (
                      <p className="mt-1 text-red-700">{batch.errorMessage}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {batch.status === "ready" ? (
                        <>
                          <button
                            type="button"
                            disabled={batchPreviewPending}
                            onClick={() => handleBatchPreview(batch.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-900/12 bg-white px-2 py-1.5 text-xs font-medium text-brand-800 hover:bg-surface disabled:opacity-60"
                          >
                            <Eye className="h-3 w-3" aria-hidden />
                            미리보기
                          </button>
                          <a
                            href={downloadBatchUrl(batch.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-900/12 bg-white px-2 py-1.5 text-xs font-medium text-brand-800 hover:bg-surface"
                          >
                            <Download className="h-3 w-3" aria-hidden />
                            다운로드
                          </a>
                        </>
                      ) : null}
                      {batch.status === "ready" && !batch.isActive ? (
                        <button
                          type="button"
                          disabled={activatePending}
                          onClick={() => handleActivate(batch.id)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          적용
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {batchPreview ? (
        <section className="admin-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-900/8 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-brand-900">
                표본 미리보기 · v{batchPreview.versionNumber}
              </h3>
              <p className="mt-0.5 text-xs text-brand-700/80">
                {batchPreview.originalFilename} · 전체{" "}
                {batchPreview.totalRows.toLocaleString()}건 중 앞쪽{" "}
                {batchPreview.rows.length.toLocaleString()}건
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={downloadBatchUrl(batchPreview.batchId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-900/12 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-800 hover:bg-surface"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                엑셀 다운로드
              </a>
              <button
                type="button"
                onClick={() => setBatchPreview(null)}
                className="rounded-lg border border-brand-900/12 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-surface"
              >
                닫기
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface/90">
                <tr>
                  <th className="px-3 py-2 font-semibold text-brand-800">행</th>
                  {batchPreviewColumns.map((col) => (
                    <th key={col.letter} className="px-3 py-2 font-semibold text-brand-800">
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/6">
                {batchPreview.rows.map((row) => (
                  <tr key={row.rowIndex}>
                    <td className="px-3 py-2 tabular-nums text-brand-700">{row.rowIndex}</td>
                    {batchPreviewColumns.map((col) => (
                      <td key={col.letter} className="px-3 py-2 text-brand-900">
                        {row.cells[col.letter] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
