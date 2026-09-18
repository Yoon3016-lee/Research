import { sanitizeSurveyPromptHtml } from "@/lib/survey-prompt-html";

type Props = {
  html: string;
  className?: string;
  as?: "p" | "h3" | "div" | "span";
};

/** 살균된 문항 제목 HTML 렌더 */
export function SurveyPromptHtml({ html, className, as = "div" }: Props) {
  const safe = sanitizeSurveyPromptHtml(html);
  const Tag = as;

  if (!safe) {
    return <Tag className={className} />;
  }

  return (
    <Tag
      className={`survey-prompt-html ${className ?? ""}`.trim()}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
