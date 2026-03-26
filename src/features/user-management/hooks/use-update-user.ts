"use client";

import { useCallback, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { updateUser } from "../api/update-user";
import type { UpdateUserPayload } from "../types/user-management.type";

export function useUpdateUser(accessToken?: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutate = useCallback(
    async (userId: string, payload: UpdateUserPayload) => {
      setIsSubmitting(true);

      try {
        const response = await updateUser(userId, payload, accessToken);
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw errorValue;
        }

        throw new Error("Gagal memperbarui user");
      } finally {
        setIsSubmitting(false);
      }
    },
    [accessToken],
  );

  return {
    update: mutate,
    isSubmitting,
  };
}
