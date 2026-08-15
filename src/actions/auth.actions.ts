"use server";

import { redirect } from "next/navigation";
import { getSession, verifyPassword } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "Password is required." };
  }

  const valid = await verifyPassword(password);
  if (!valid) {
    return { error: "Incorrect password." };
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.lastActivity = Date.now();
  await session.save();

  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
