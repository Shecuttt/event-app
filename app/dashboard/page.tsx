import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-2">Welcome, {session.user.name}!</h2>
        <p className="text-gray-600 dark:text-gray-300">
          You are logged in as a <span className="font-semibold capitalize">{session.user.role}</span>.
        </p>
      </div>
    </div>
  );
}
