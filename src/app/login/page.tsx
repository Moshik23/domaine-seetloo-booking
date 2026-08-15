"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/actions/auth.actions";
import { BUSINESS_NAME, BUSINESS_TAGLINE, BUILDER_CREDIT } from "@/lib/constants";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/layout/Logo";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-lg border-t-4 border-rose-600 bg-white p-8 shadow-sm dark:bg-neutral-900">
        <div className="flex justify-center">
          <Logo className="h-16 w-16 text-rose-700 dark:text-rose-300" />
        </div>
        <h1 className="mt-3 text-center text-xl font-semibold tracking-wide text-rose-800 dark:text-rose-300">
          {BUSINESS_NAME}
        </h1>
        <p className="mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">{BUSINESS_TAGLINE}</p>
        <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-300">Booking Portal — Staff Login</p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-800 disabled:opacity-50"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
      <p className="mt-6 text-xs text-neutral-400 dark:text-neutral-600">{BUILDER_CREDIT}</p>
    </div>
  );
}
