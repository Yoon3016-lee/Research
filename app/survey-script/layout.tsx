export default function SurveyScriptPopupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">{children}</div>
  );
}
