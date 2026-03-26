"use client";

import { useCallback, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { deactivateUser } from "../api/deactivate-user";

export function useDeactivateUser(accessToken?: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutate = useCallback(
    async (userId: string) => {
      setIsSubmitting(true);

      try {
        const response = await deactivateUser(userId, accessToken);
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw errorValue;
        }

        throw new Error("Gagal menonaktifkan user");
      } finally {
        setIsSubmitting(false);
      }
    },
    [accessToken],
  );

  return {
    deactivate: mutate,
    isSubmitting,
  };
}
