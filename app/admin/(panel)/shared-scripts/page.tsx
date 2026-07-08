import { redirect } from "next/navigation";

export default function AdminSharedScriptsRedirectPage() {
  redirect("/admin/surveys?scripts=open");
}
