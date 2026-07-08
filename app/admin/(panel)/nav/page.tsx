import { redirect } from "next/navigation";

export default function AdminNavRedirectPage() {
  redirect("/admin/homepage#section-nav");
}
