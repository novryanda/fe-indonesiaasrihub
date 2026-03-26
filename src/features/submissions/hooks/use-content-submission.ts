"use client";

import { useCallback, useState } from "react";

import { ApiError } from "@/shared/api/api-client";

import { createContentSubmission } from "../api/create-content-submission";
import { resubmitContent } from "../api/resubmit-content";
import { validateDriveLink } from "../api/validate-drive-link";
import type {
  ContentSubmissionPayload,
  CreateContentSubmissionResponse,
  ResubmitContentPayload,
  ResubmitContentResponse,
  ValidateDriveLinkResponse,
} from "../types/content-submission.type";

export function useContentSubmission(accessToken?: string) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [isValidatingDrive, setValidatingDrive] = useState(false);

  const submitContent = useCallback(
    async (payload: ContentSubmissionPayload): Promise<CreateContentSubmissionResponse> => {
      setSubmitting(true);

      try {
        const response = await createContentSubmission(payload, accessToken);
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal mengirim konten");
      } finally {
        setSubmitting(false);
      }
    },
    [accessToken],
  );

  const submitResubmission = useCallback(
    async (contentId: string, payload: ResubmitContentPayload): Promise<ResubmitContentResponse> => {
      setSubmitting(true);

      try {
        const response = await resubmitContent(contentId, payload, accessToken);
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal mengirim ulang konten");
      } finally {
        setSubmitting(false);
      }
    },
    [accessToken],
  );

  const runDriveValidation = useCallback(
    async (driveLink: string): Promise<ValidateDriveLinkResponse> => {
      setValidatingDrive(true);

      try {
        const response = await validateDriveLink(driveLink, accessToken);
        return response.data;
      } catch (errorValue) {
        if (errorValue instanceof ApiError) {
          throw new Error(errorValue.message);
        }

        throw new Error("Gagal memvalidasi link Google Drive");
      } finally {
        setValidatingDrive(false);
      }
    },
    [accessToken],
  );

  return {
    submitContent,
    submitResubmission,
    runDriveValidation,
    isSubmitting,
    isValidatingDrive,
  };
}
