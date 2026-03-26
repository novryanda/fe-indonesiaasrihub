import type { NextRequest } from "next/server";

import { forwardRequestToBackend } from "@/server/backend-proxy";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function handleAuthProxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequestToBackend(request, `/api/auth/${path.join("/")}`);
}

export {
  handleAuthProxy as GET,
  handleAuthProxy as POST,
  handleAuthProxy as PUT,
  handleAuthProxy as PATCH,
  handleAuthProxy as DELETE,
  handleAuthProxy as OPTIONS,
};
