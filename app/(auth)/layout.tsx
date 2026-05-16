import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4 dark:bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Ivento
            </h1>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
