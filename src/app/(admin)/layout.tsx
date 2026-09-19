import { requireAdmin } from "@/server/auth";
import { logout } from "@/app/actions";
import { NavLink } from "@/components/NavLink";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold">Employee Management</span>
            <nav aria-label="Main" className="flex gap-1">
              <NavLink href="/monthly">Monthly view</NavLink>
              <NavLink href="/employees">Employees</NavLink>
            </nav>
          </div>
          <form action={logout}>
            <button type="submit" className="btn-secondary">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
