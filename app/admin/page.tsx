import { redirect } from "next/navigation";

export const metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  redirect("/admin/insights");
}
