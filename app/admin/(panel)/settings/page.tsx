import { redirect } from "next/navigation";

export default function AdminSettingsRedirectPage() {
  redirect("/admin/permissions#section-signup-key");
}
