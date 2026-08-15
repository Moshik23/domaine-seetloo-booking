import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/actions/auth.actions";
import { BuilderCredit } from "@/components/layout/BuilderCredit";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/layout/Logo";
import { BUSINESS_NAME } from "@/lib/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already gates this route group, but a server-side
  // check here means the page never renders authenticated content without a valid session.
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b-2 border-rose-100 bg-white print:hidden dark:border-rose-900/50 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-wide text-rose-800 dark:text-rose-300">
            <Logo className="h-8 w-8" />
            {BUSINESS_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-neutral-600 hover:text-rose-700 dark:text-neutral-300 dark:hover:text-rose-400">
              Dashboard
            </Link>
            <Link href="/bookings" className="text-neutral-600 hover:text-rose-700 dark:text-neutral-300 dark:hover:text-rose-400">
              Bookings
            </Link>
            <Link href="/bookings/new" className="text-neutral-600 hover:text-rose-700 dark:text-neutral-300 dark:hover:text-rose-400">
              New Booking
            </Link>
            <Link href="/help" className="text-neutral-600 hover:text-rose-700 dark:text-neutral-300 dark:hover:text-rose-400">
              Help
            </Link>
            <form action={logout}>
              <button type="submit" className="text-neutral-600 hover:text-rose-700 dark:text-neutral-300 dark:hover:text-rose-400">
                Log out
              </button>
            </form>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t border-neutral-200 bg-white py-4 print:hidden dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <BuilderCredit />
        </div>
      </footer>
    </div>
  );
}
