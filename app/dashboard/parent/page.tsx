import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import ParentDashboard from "@/components/ParentDashboard";
import { authOptions } from "@/lib/auth";

export default async function ParentDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return <ParentDashboard />;
}
