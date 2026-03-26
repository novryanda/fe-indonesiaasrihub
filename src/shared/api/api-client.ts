export interface ApiEnvelope<TData, TMeta = unknown> {
  success: boolean;
  data: TData;
  meta?: TMeta;
  message?: string;
  code?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type PrimitiveParam = string | number | boolean;

type RequestOptions = Omit<RequestInit, "body"> & {
  params?: Record<string, PrimitiveParam | null | undefined>;
  body?: unknown;
};

const API_PROXY_PREFIX = "/api/backend";

function buildUrl(path: string, params?: Record<string, PrimitiveParam | null | undefined>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_PROXY_PREFIX}${normalizedPath}`, "http://internal.local");

  if (!params) {
    return `${url.pathname}${url.search}`;
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return `${url.pathname}${url.search}`;
}

function resolveErrorMessage(payload: unknown, fallbackStatusText: string) {
  if (!payload || typeof payload !== "object") {
    return fallbackStatusText;
  }

  const payloadRecord = payload as Record<string, unknown>;

  const resolveValidationDetailMessage = (details: unknown): string | undefined => {
    if (!details || typeof details !== "object") {
      return undefined;
    }

    const detailsRecord = details as Record<string, unknown>;

    // Backend wraps zod payload as error.details.details via global exception filter.
    if (detailsRecord.details && typeof detailsRecord.details === "object") {
      const nested = resolveValidationDetailMessage(detailsRecord.details);
      if (nested) {
        return nested;
      }
    }

    if (Array.isArray(detailsRecord.formErrors)) {
      const firstFormError = detailsRecord.formErrors.find((item) => typeof item === "string");
      if (typeof firstFormError === "string") {
        return firstFormError;
      }
    }

    if (detailsRecord.fieldErrors && typeof detailsRecord.fieldErrors === "object") {
      const fieldErrors = detailsRecord.fieldErrors as Record<string, unknown>;
      for (const value of Object.values(fieldErrors)) {
        if (!Array.isArray(value)) {
          continue;
        }

        const firstFieldError = value.find((item) => typeof item === "string");
        if (typeof firstFieldError === "string") {
          return firstFieldError;
        }
      }
    }

    return undefined;
  };

  const errorRecord =
    payloadRecord.error && typeof payloadRecord.error === "object"
      ? (payloadRecord.error as Record<string, unknown>)
      : null;

  const detailMessage = resolveValidationDetailMessage(errorRecord?.details);
  if (typeof detailMessage === "string") {
    return detailMessage;
  }

  if (errorRecord && typeof errorRecord.message === "string") {
    return errorRecord.message;
  }

  if (errorRecord && Array.isArray(errorRecord.message) && errorRecord.message.length > 0) {
    const firstMessage = errorRecord.message[0];
    if (typeof firstMessage === "string") {
      return firstMessage;
    }
  }

  if (typeof payloadRecord.message === "string") {
    return payloadRecord.message;
  }

  if (typeof payloadRecord.error === "string") {
    return payloadRecord.error;
  }

  return fallbackStatusText;
}

function resolveErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const payloadRecord = payload as Record<string, unknown>;
  if (typeof payloadRecord.code === "string") {
    return payloadRecord.code;
  }

  if (payloadRecord.error && typeof payloadRecord.error === "object") {
    const errorRecord = payloadRecord.error as Record<string, unknown>;
    if (typeof errorRecord.code === "string") {
      return errorRecord.code;
    }
  }

  return undefined;
}

function resolveErrorDetails(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const payloadRecord = payload as Record<string, unknown>;
  if (payloadRecord.error && typeof payloadRecord.error === "object") {
    const errorRecord = payloadRecord.error as Record<string, unknown>;
    return errorRecord.details;
  }

  return undefined;
}

export async function apiClient<TData, TMeta = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<TData, TMeta>> {
  const { params, headers, body, ...requestInit } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(buildUrl(path, params), {
    ...requestInit,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<TData, TMeta> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      resolveErrorMessage(payload, response.statusText || "Request failed"),
      response.status,
      resolveErrorCode(payload),
      resolveErrorDetails(payload),
    );
  }

  return payload;
}
