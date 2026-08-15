import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import bcrypt from "bcryptjs";

export interface SessionData {
  isLoggedIn: boolean;
  lastActivity?: number; // ms since epoch, refreshed on every authenticated request
}

const defaultSession: SessionData = { isLoggedIn: false };

/** Idle sessions are force-logged-out after this long, independent of the cookie's own 30-day ceiling. */
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export const sessionOptions: SessionOptions = {
  password: requireSessionSecret(),
  cookieName: "domaine-seetloo-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters");
  }
  return secret;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (session.isLoggedIn === undefined) {
    session.isLoggedIn = defaultSession.isLoggedIn;
  }
  return session;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) throw new Error("ADMIN_PASSWORD_HASH is not set");
  return bcrypt.compare(password, hash);
}
