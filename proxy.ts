import type { NextRequest } from "next/server";
import {
  isAdminPath,
  nextWithRequestContext,
} from "@/lib/request-context-middleware";
import { recordPageView } from "@/lib/page-views";
import {
  getRequestClientMeta,
  isLoggedPagePath,
} from "@/lib/request-client";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function maybeRecordPageView(request: NextRequest): void {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  if (request.method !== "GET") {
    return;
  }
  const { pathname } = request.nextUrl;
  if (!isLoggedPagePath(pathname)) {
    return;
  }
  void getRequestClientMeta(request)
    .then((meta) =>
      recordPageView({
        path: pathname,
        host: meta.host,
        ...(meta.userId ? { userId: meta.userId } : {}),
        ...(meta.userName ? { userName: meta.userName } : {}),
      }),
    )
    .catch(() => undefined);
}

export async function proxy(request: NextRequest) {
  maybeRecordPageView(request);
  return nextWithRequestContext(request, isAdminPath(request.nextUrl.pathname));
}
