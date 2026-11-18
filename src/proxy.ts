import {
  NextResponse,
  type NextFetchEvent,
  type NextMiddleware,
  type NextRequest,
} from "next/server";
import { auth } from "@/auth";
import { dashboardPaths, isUserRole } from "@/lib/roles";

const authenticatedProxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  const user = request.auth?.user;

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!isUserRole(user.role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const rolePath = dashboardPaths[user.role];
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(rolePath, request.url));
  }

  if (pathname !== rolePath && !pathname.startsWith(`${rolePath}/`)) {
    return NextResponse.redirect(new URL(rolePath, request.url));
  }

  return NextResponse.next();
});

function isNextMiddleware(handler: unknown): handler is NextMiddleware {
  return typeof handler === "function";
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const handler = await authenticatedProxy;
  if (!isNextMiddleware(handler)) {
    throw new Error("Auth.js did not initialize the dashboard Proxy handler.");
  }
  return handler(request, event);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
