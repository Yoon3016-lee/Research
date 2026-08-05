export default function SurveyScriptPopupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-zinc-50 text-zinc-900 antialiased">
      {children}
    </div>
  );
}
