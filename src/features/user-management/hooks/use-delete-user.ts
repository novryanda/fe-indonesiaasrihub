"use client";

import { useCallback, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { deleteUser } from "../api/delete-user";

export function useDeleteUser(accessToken?: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutate = useCallback(
    async (userId: string) => {
      setIsSubmitting(true);

      try {
        const response = await deleteUser(userId, accessToken);
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw errorValue;
        }

        throw new Error("Gagal menghapus user");
      } finally {
        setIsSubmitting(false);
      }
    },
    [accessToken],
  );

  return {
    remove: mutate,
    isSubmitting,
  };
}
