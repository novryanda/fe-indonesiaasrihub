import type { NextRequest } from "next/server";

import { forwardRequestToBackend } from "@/server/backend-proxy";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function handleProxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequestToBackend(request, `/${path.join("/")}`);
}

export {
  handleProxy as GET,
  handleProxy as POST,
  handleProxy as PUT,
  handleProxy as PATCH,
  handleProxy as DELETE,
  handleProxy as OPTIONS,
};
