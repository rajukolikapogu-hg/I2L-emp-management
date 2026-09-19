import { redirect } from "next/navigation";
import { currentSessionId } from "@/server/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentSessionId()) redirect("/monthly");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold">Employee Management</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in to manage salary payments.</p>
        <LoginForm />
      </div>
    </main>
  );
}
