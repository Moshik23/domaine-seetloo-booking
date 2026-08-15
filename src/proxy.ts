import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData, INACTIVITY_TIMEOUT_MS } from "@/lib/auth";

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const now = Date.now();
  const timedOut =
    session.isLoggedIn &&
    session.lastActivity !== undefined &&
    now - session.lastActivity > INACTIVITY_TIMEOUT_MS;

  if (!session.isLoggedIn || timedOut) {
    if (timedOut) session.destroy();
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    // session.destroy()/save() above wrote their Set-Cookie header(s) onto `response`,
    // not the redirect we're actually returning — carry them over by hand.
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") redirectResponse.headers.append(key, value);
    });
    return redirectResponse;
  }

  session.lastActivity = now;
  await session.save();
  return response;
}
