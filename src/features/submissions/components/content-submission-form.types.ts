import type { ContentSubmissionFormValues } from "../schemas/content-submission.schema";

export type ContentSubmissionDraft = ContentSubmissionFormValues & {
  review_confirmation: boolean;
};

export type FormErrorState = Partial<Record<keyof ContentSubmissionDraft, string>>;
