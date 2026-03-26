import { useCallback, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { importUsers } from "../api/import-users";
import type { ImportUsersResult } from "../types/user-management.type";

interface UseImportUsersResult {
  importCsv: (file: File) => Promise<ImportUsersResult>;
  isSubmitting: boolean;
}

export function useImportUsers(accessToken?: string): UseImportUsersResult {
  const [isSubmitting, setSubmitting] = useState(false);

  const importCsv = useCallback(
    async (file: File) => {
      setSubmitting(true);

      try {
        return await importUsers(file, accessToken);
      } catch (error) {
        if (error instanceof ApiError) {
          throw new Error(error.message);
        }

        throw new Error("Gagal import user");
      } finally {
        setSubmitting(false);
      }
    },
    [accessToken],
  );

  return {
    importCsv,
    isSubmitting,
  };
}
