"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save } from "lucide-react";
import {
  updatePublicHomeContentAction,
  type SiteHomepageActionState,
} from "@/app/actions/site-homepage";
import {
  DEFAULT_PUBLIC_HOME_CONTENT,
  type PublicHomeContent,
} from "@/lib/public-home-content";

const initial: SiteHomepageActionState = {};

type Props = {
  content: PublicHomeContent;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-zinc-800">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-brand-900/20 focus:ring-2";
const areaClass = `${inputClass} min-h-[5rem] font-mono text-[13px] leading-relaxed`;

export function PublicHomeManager({ content: initialContent }: Props) {
  const router = useRouter();
  const [content, setContent] = useState<PublicHomeContent>(initialContent);
  const [state, action, pending] = useActionState(updatePublicHomeContentAction, initial);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const jsonPayload = useMemo(() => JSON.stringify(content), [content]);

  const patch = <K extends keyof PublicHomeContent>(
    key: K,
    value: PublicHomeContent[K],
  ) => setContent((prev) => ({ ...prev, [key]: value }));

  return (
    <form action={action} className="space-y-8">
      <textarea name="public_home_json" value={jsonPayload} readOnly hidden aria-hidden />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-900">공개홈페이지 관리</h2>
          <p className="mt-1 text-sm text-brand-700/80">
            공개 사이트 메인(`/`) 랜딩 문구·연락처·섹션 표시를 수정합니다. 상단바·로고는「사이트
            설정」에서 관리합니다.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          공개 홈 미리보기
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">섹션 표시</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["intro", "회사 소개(01)"],
              ["services", "리서치 서비스(02)"],
              ["engine", "KSIC 엔진(03)"],
              ["axi", "AXI(04)"],
              ["evidence", "수행역량(05)"],
              ["milestone", "개발현황(06)"],
              ["contact", "문의(07)"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-800"
            >
              <input
                type="checkbox"
                checked={content.sections[key]}
                onChange={(e) =>
                  patch("sections", { ...content.sections, [key]: e.target.checked })
                }
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">히어로 배너</h3>
        <Field label="배너 이미지 URL" hint="비우지 마세요. 아래에서 새 이미지를 올리면 URL이 갱신됩니다.">
          <input
            className={inputClass}
            value={content.hero.bannerImageUrl}
            onChange={(e) => patch("hero", { ...content.hero, bannerImageUrl: e.target.value })}
          />
        </Field>
        <Field label="배너 이미지 교체 (JPG/PNG/WEBP)">
          <input
            type="file"
            name="hero_banner_file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-sm"
          />
        </Field>
        <Field label="배너 클릭(핫스팟) 링크" hint="예: #engine 또는 /surveys">
          <input
            className={inputClass}
            value={content.hero.engineHref}
            onChange={(e) => patch("hero", { ...content.hero, engineHref: e.target.value })}
          />
        </Field>
        {content.hero.bannerImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.hero.bannerImageUrl}
            alt="히어로 미리보기"
            className="max-h-40 w-full rounded-lg border border-zinc-200 object-cover object-center"
          />
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">01 소개</h3>
        <Field label="킥커">
          <input
            className={inputClass}
            value={content.intro.kicker}
            onChange={(e) => patch("intro", { ...content.intro, kicker: e.target.value })}
          />
        </Field>
        <Field label="제목 HTML" hint="&lt;br /&gt; &lt;em&gt; 사용 가능">
          <textarea
            className={areaClass}
            value={content.intro.titleHtml}
            onChange={(e) => patch("intro", { ...content.intro, titleHtml: e.target.value })}
          />
        </Field>
        <Field label="본문 HTML" hint="&lt;strong&gt; 사용 가능">
          <textarea
            className={areaClass}
            value={content.intro.leadHtml}
            onChange={(e) => patch("intro", { ...content.intro, leadHtml: e.target.value })}
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">02 리서치 서비스</h3>
        <Field label="킥커">
          <input
            className={inputClass}
            value={content.services.kicker}
            onChange={(e) => patch("services", { ...content.services, kicker: e.target.value })}
          />
        </Field>
        <Field label="제목 HTML">
          <textarea
            className={areaClass}
            value={content.services.titleHtml}
            onChange={(e) =>
              patch("services", { ...content.services, titleHtml: e.target.value })
            }
          />
        </Field>
        <Field label="설명">
          <textarea
            className={areaClass}
            value={content.services.lead}
            onChange={(e) => patch("services", { ...content.services, lead: e.target.value })}
          />
        </Field>
        {content.services.cards.map((card, index) => (
          <div key={index} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-600">카드 {index + 1}</p>
            <Field label="제목">
              <input
                className={inputClass}
                value={card.title}
                onChange={(e) => {
                  const cards = [...content.services.cards];
                  cards[index] = { ...card, title: e.target.value };
                  patch("services", { ...content.services, cards });
                }}
              />
            </Field>
            <Field label="설명">
              <textarea
                className={areaClass}
                value={card.description}
                onChange={(e) => {
                  const cards = [...content.services.cards];
                  cards[index] = { ...card, description: e.target.value };
                  patch("services", { ...content.services, cards });
                }}
              />
            </Field>
            <Field label="태그 (줄바꿈으로 구분)">
              <textarea
                className={areaClass}
                value={card.tags.join("\n")}
                onChange={(e) => {
                  const cards = [...content.services.cards];
                  cards[index] = {
                    ...card,
                    tags: e.target.value
                      .split("\n")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  };
                  patch("services", { ...content.services, cards });
                }}
              />
            </Field>
          </div>
        ))}
        <Field label="하단 문의 버튼 문구">
          <input
            className={inputClass}
            value={content.services.inquiryLabel}
            onChange={(e) =>
              patch("services", { ...content.services, inquiryLabel: e.target.value })
            }
          />
        </Field>
        <Field label="하단 문의 링크">
          <input
            className={inputClass}
            value={content.services.inquiryHref}
            onChange={(e) =>
              patch("services", { ...content.services, inquiryHref: e.target.value })
            }
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">03 KSIC 엔진 · 04 AXI</h3>
        <Field label="KSIC 킥커">
          <input
            className={inputClass}
            value={content.engine.kicker}
            onChange={(e) => patch("engine", { ...content.engine, kicker: e.target.value })}
          />
        </Field>
        <Field label="KSIC 제목 HTML">
          <textarea
            className={areaClass}
            value={content.engine.titleHtml}
            onChange={(e) => patch("engine", { ...content.engine, titleHtml: e.target.value })}
          />
        </Field>
        <Field label="KSIC 설명">
          <textarea
            className={areaClass}
            value={content.engine.lead}
            onChange={(e) => patch("engine", { ...content.engine, lead: e.target.value })}
          />
        </Field>
        <Field label="AXI 킥커">
          <input
            className={inputClass}
            value={content.axi.kicker}
            onChange={(e) => patch("axi", { ...content.axi, kicker: e.target.value })}
          />
        </Field>
        <Field label="AXI 제목 HTML">
          <textarea
            className={areaClass}
            value={content.axi.titleHtml}
            onChange={(e) => patch("axi", { ...content.axi, titleHtml: e.target.value })}
          />
        </Field>
        <Field label="AXI 본문">
          <textarea
            className={areaClass}
            value={content.axi.body}
            onChange={(e) => patch("axi", { ...content.axi, body: e.target.value })}
          />
        </Field>
        <Field label="AXI 버튼 문구">
          <input
            className={inputClass}
            value={content.axi.buttonLabel}
            onChange={(e) => patch("axi", { ...content.axi, buttonLabel: e.target.value })}
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">05 수행역량 · 현장 사진</h3>
        <Field label="킥커">
          <input
            className={inputClass}
            value={content.evidence.kicker}
            onChange={(e) => patch("evidence", { ...content.evidence, kicker: e.target.value })}
          />
        </Field>
        <Field label="제목 HTML">
          <textarea
            className={areaClass}
            value={content.evidence.titleHtml}
            onChange={(e) =>
              patch("evidence", { ...content.evidence, titleHtml: e.target.value })
            }
          />
        </Field>
        <Field label="설명">
          <textarea
            className={areaClass}
            value={content.evidence.lead}
            onChange={(e) => patch("evidence", { ...content.evidence, lead: e.target.value })}
          />
        </Field>
        <Field label="수행실적 제목">
          <input
            className={inputClass}
            value={content.evidence.recordsTitle}
            onChange={(e) =>
              patch("evidence", { ...content.evidence, recordsTitle: e.target.value })
            }
          />
        </Field>
        {content.evidence.records.map((rec, index) => (
          <div key={index} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-600">실적 {index + 1}</p>
            <Field label="카테고리">
              <input
                className={inputClass}
                value={rec.category}
                onChange={(e) => {
                  const records = [...content.evidence.records];
                  records[index] = { ...rec, category: e.target.value };
                  patch("evidence", { ...content.evidence, records });
                }}
              />
            </Field>
            <Field label="제목">
              <input
                className={inputClass}
                value={rec.title}
                onChange={(e) => {
                  const records = [...content.evidence.records];
                  records[index] = { ...rec, title: e.target.value };
                  patch("evidence", { ...content.evidence, records });
                }}
              />
            </Field>
            <Field label="본문 HTML">
              <textarea
                className={areaClass}
                value={rec.body}
                onChange={(e) => {
                  const records = [...content.evidence.records];
                  records[index] = { ...rec, body: e.target.value };
                  patch("evidence", { ...content.evidence, records });
                }}
              />
            </Field>
          </div>
        ))}
        <Field label="현장 이미지 URL">
          <input
            className={inputClass}
            value={content.evidence.opsImageUrl}
            onChange={(e) =>
              patch("evidence", { ...content.evidence, opsImageUrl: e.target.value })
            }
          />
        </Field>
        <Field label="현장 이미지 교체">
          <input
            type="file"
            name="ops_image_file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-sm"
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">06 개발 현황 · 07 문의</h3>
        <Field label="개발현황 제목 HTML">
          <textarea
            className={areaClass}
            value={content.milestone.titleHtml}
            onChange={(e) =>
              patch("milestone", { ...content.milestone, titleHtml: e.target.value })
            }
          />
        </Field>
        <Field label="개발현황 하단 노트 HTML">
          <textarea
            className={areaClass}
            value={content.milestone.noteHtml}
            onChange={(e) =>
              patch("milestone", { ...content.milestone, noteHtml: e.target.value })
            }
          />
        </Field>
        <Field label="문의 제목 HTML">
          <textarea
            className={areaClass}
            value={content.contact.titleHtml}
            onChange={(e) => patch("contact", { ...content.contact, titleHtml: e.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="이메일">
            <input
              className={inputClass}
              value={content.contact.email}
              onChange={(e) => patch("contact", { ...content.contact, email: e.target.value })}
            />
          </Field>
          <Field label="전화">
            <input
              className={inputClass}
              value={content.contact.phone}
              onChange={(e) => patch("contact", { ...content.contact, phone: e.target.value })}
            />
          </Field>
        </div>
        <Field label="주소 HTML">
          <textarea
            className={areaClass}
            value={content.contact.addressHtml}
            onChange={(e) =>
              patch("contact", { ...content.contact, addressHtml: e.target.value })
            }
          />
        </Field>
        <Field label="이메일 버튼 문구">
          <input
            className={inputClass}
            value={content.contact.emailButtonLabel}
            onChange={(e) =>
              patch("contact", { ...content.contact, emailButtonLabel: e.target.value })
            }
          />
        </Field>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden />
          {pending ? "저장 중…" : "공개 홈 저장"}
        </button>
        <button
          type="button"
          onClick={() => setContent(structuredClone(DEFAULT_PUBLIC_HOME_CONTENT))}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          기본값으로 되돌리기(저장 전)
        </button>
        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p className="text-sm text-emerald-700" role="status">
            저장되었습니다. 공개 홈에서 확인해 주세요.
          </p>
        ) : null}
      </div>
    </form>
  );
}
