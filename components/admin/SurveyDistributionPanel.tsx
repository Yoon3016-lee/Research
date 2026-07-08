"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Check,
  Mail,
  MessageSquare,
  PackageOpen,
  Send,
  Users,
} from "lucide-react";
import type { SurveyStatus } from "@/lib/survey-list-types";
import { AdminSurveyStatusBadge } from "@/components/admin/AdminSurveyIconActions";

type Channel = "email" | "sms";

type Props = {
  slug: string;
  title: string;
  status: SurveyStatus;
  participateUrl: string;
  defaultMessage: string;
};

export function SurveyDistributionPanel({
  slug,
  title,
  status,
  participateUrl,
  defaultMessage,
}: Props) {
  const [channel, setChannel] = useState<Channel>("email");
  const [message, setMessage] = useState(defaultMessage);
  const [emailSubject, setEmailSubject] = useState(`[설문 안내] ${title}`);
  const [recipients, setRecipients] = useState("");
  const [copied, setCopied] = useState(false);

  const recipientHint = useMemo(() => {
    if (channel === "email") {
      return "이메일 주소를 줄바꿈 또는 쉼표로 구분해 입력하세요.";
    }
    return "휴대폰 번호를 줄바꿈 또는 쉼표로 구분해 입력하세요. (예: 010-1234-5678)";
  }, [channel]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(participateUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleInsertLink = () => {
    setMessage((prev) => {
      if (prev.includes(participateUrl)) return prev;
      const suffix = prev.trimEnd();
      return suffix ? `${suffix}\n\n링크: ${participateUrl}` : `링크: ${participateUrl}`;
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="admin-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="site-eyebrow">Distribution</p>
            <h2 className="mt-1 text-lg font-semibold text-brand-900">{title}</h2>
            <p className="mt-1 text-xs text-brand-700/80">
              slug · <code className="rounded bg-brand-900/6 px-1 font-mono">{slug}</code>
            </p>
          </div>
          <AdminSurveyStatusBadge status={status} />
        </div>

        <div className="mt-5 rounded-xl border border-brand-900/8 bg-surface/60 p-4">
          <p className="text-xs font-medium text-brand-700">참여 링크</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 text-sm text-brand-900">
              {participateUrl}
            </code>
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="admin-btn-secondary inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              {copied ? "복사됨" : "링크 복사"}
            </button>
          </div>
        </div>
      </section>

      <section className="admin-card p-6">
        <h3 className="text-sm font-semibold text-brand-900">발송 채널</h3>
        <p className="mt-1 text-sm text-brand-700/80">
          이메일·문자메시지 등으로 초대 문구를 보냅니다. (발송 API 연동은 준비 중입니다)
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ChannelButton
            active={channel === "email"}
            onClick={() => setChannel("email")}
            icon={Mail}
            label="이메일"
          />
          <ChannelButton
            active={channel === "sms"}
            onClick={() => setChannel("sms")}
            icon={MessageSquare}
            label="문자메시지"
          />
        </div>
      </section>

      <section className="admin-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-brand-900">발송 내용</h3>
          <button
            type="button"
            onClick={handleInsertLink}
            className="admin-btn-secondary px-3 py-1.5 text-xs"
          >
            링크 삽입
          </button>
        </div>

        {channel === "email" ? (
          <label className="mt-4 block">
            <span className="admin-label">이메일 제목</span>
            <input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="admin-input mt-1.5"
              placeholder="[설문 안내] 제목"
            />
          </label>
        ) : null}

        <label className="mt-4 block">
          <span className="admin-label">본문 *</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            className="admin-input mt-1.5 font-mono text-[13px] leading-relaxed"
            placeholder="조사에 참여해 주세요. 링크: https://..."
          />
          <span className="mt-1.5 block text-xs text-brand-700/70">
            설문 링크가 포함된 안내 문구를 작성하세요. 발송 시 아래 미리보기와 동일하게 전달됩니다.
          </span>
        </label>
      </section>

      <section className="admin-card p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
          <Users className="h-4 w-4 text-accent-600" aria-hidden />
          수신자
        </h3>
        <label className="mt-4 block">
          <span className="admin-label">
            {channel === "email" ? "수신 이메일" : "수신 번호"}
          </span>
          <textarea
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            rows={4}
            className="admin-input mt-1.5"
            placeholder={
              channel === "email"
                ? "name@company.com\nother@example.com"
                : "010-1234-5678\n010-9876-5432"
            }
          />
          <span className="mt-1.5 block text-xs text-brand-700/70">{recipientHint}</span>
        </label>
      </section>

      <section className="admin-card p-6">
        <h3 className="text-sm font-semibold text-brand-900">미리보기</h3>
        <div className="mt-4 rounded-xl border border-brand-900/8 bg-surface/50 p-4">
          {channel === "email" ? (
            <p className="text-xs font-medium text-brand-700">
              제목: <span className="text-brand-900">{emailSubject || "(제목 없음)"}</span>
            </p>
          ) : (
            <p className="text-xs font-medium text-brand-700">문자메시지 (SMS)</p>
          )}
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-900">
            {message || "(본문 없음)"}
          </pre>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-brand-900/8 pt-2">
        <button
          type="button"
          disabled
          className="admin-btn-primary inline-flex items-center gap-2 px-6 py-3 opacity-55"
          title="발송 API 연동 후 사용 가능합니다"
        >
          <Send className="h-4 w-4" aria-hidden />
          {channel === "email" ? "이메일 발송" : "문자 발송"}
        </button>
        <p className="flex items-center gap-1.5 text-sm text-brand-700/80">
          <PackageOpen className="h-4 w-4 shrink-0 text-accent-600" aria-hidden />
          발송 기능은 UI만 준비되어 있으며, 실제 전송은 다음 단계에서 연동됩니다.
        </p>
      </div>
    </div>
  );
}

function ChannelButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mail;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-accent-500/40 bg-accent-500/12 text-brand-900 shadow-sm"
          : "border-brand-900/10 bg-white text-brand-700 hover:border-accent-500/25 hover:bg-surface/80"
      }`}
      aria-pressed={active}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
