import { RegisterForm } from "./_components/register-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return <RegisterForm />;
}
