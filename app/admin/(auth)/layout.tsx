export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}
