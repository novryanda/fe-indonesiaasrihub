"use client";

import { useCallback, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { createUser } from "../api/create-user";
import type { CreateUserPayload } from "../types/user-management.type";

export function useCreateUser(accessToken?: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutate = useCallback(
    async (payload: CreateUserPayload) => {
      setIsSubmitting(true);

      try {
        const response = await createUser(payload, accessToken);
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw errorValue;
        }

        throw new Error("Gagal membuat user");
      } finally {
        setIsSubmitting(false);
      }
    },
    [accessToken],
  );

  return {
    create: mutate,
    isSubmitting,
  };
}
