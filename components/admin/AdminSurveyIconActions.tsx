import Link from "next/link";
import { ExternalLink, GitBranch, PackageOpen, Pencil } from "lucide-react";
import type { SurveyStatus } from "@/lib/survey-list-types";

type Props = {
  slug: string;
  status: SurveyStatus;
};

const iconBtn =
  "inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand-900/10 bg-white text-brand-700 shadow-sm transition hover:border-accent-500/35 hover:bg-accent-500/10 hover:text-brand-900";

export function AdminSurveyIconActions({ slug, status }: Props) {
  return (
    <div className="flex items-center justify-end gap-1" role="group" aria-label="설문 작업">
      {status === "진행중" ? (
        <Link
          href={`/survey/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconBtn}
          title="참여 링크"
          aria-label="참여 링크 열기"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
      <Link
        href={{
          pathname: "/admin/surveys/distribute",
          query: { slug },
        }}
        className={`${iconBtn} hover:border-sky-300/60 hover:bg-sky-50 hover:text-sky-900`}
        title="배포 관리"
        aria-label="배포 관리"
      >
        <PackageOpen className="h-3.5 w-3.5" aria-hidden />
      </Link>
      <Link
        href={{
          pathname: "/admin/surveys/logic",
          query: { slug },
        }}
        className={`${iconBtn} hover:border-fuchsia-300/60 hover:bg-fuchsia-50 hover:text-fuchsia-900`}
        title="로직 확인"
        aria-label="로직 확인"
      >
        <GitBranch className="h-3.5 w-3.5" aria-hidden />
      </Link>
      <Link
        href={{
          pathname: "/admin/surveys/edit",
          query: { slug },
        }}
        className={iconBtn}
        title="편집"
        aria-label="설문 편집"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}

function statusBadgeClass(status: SurveyStatus): string {
  const base = "rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap";
  if (status === "진행중") {
    return `${base} border border-green-300 bg-green-100 text-green-900`;
  }
  if (status === "예정") {
    return `${base} border border-yellow-300 bg-yellow-100 text-yellow-950`;
  }
  return `${base} border border-brand-900/10 bg-brand-900/6 text-brand-800`;
}

export function AdminSurveyStatusBadge({ status }: { status: SurveyStatus }) {
  return <span className={statusBadgeClass(status)}>{status}</span>;
}
