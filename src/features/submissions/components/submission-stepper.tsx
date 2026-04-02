"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type WizardStep = 1 | 2 | 3 | 4;

export const WIZARD_STEPS = [
  { step: 1 as const, title: "Info", description: "Judul, platform, dan jadwal." },
  { step: 2 as const, title: "Drive", description: "Link drive dan thumbnail." },
  { step: 3 as const, title: "Detail", description: "Caption dan kebutuhan review." },
  { step: 4 as const, title: "Review", description: "Periksa lagi sebelum submit." },
];

function SubmissionStepBadge({
  completed,
  current,
  label,
  stepNumber,
}: {
  completed: boolean;
  current: boolean;
  label: string;
  stepNumber: number;
}) {
  return (
    <div className="flex min-w-24 flex-col items-center gap-3 text-center">
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-full border font-semibold text-sm transition",
          completed
            ? "border-[color:var(--brand-hero)] bg-[color:var(--brand-hero)] text-white"
            : current
              ? "border-[color:var(--brand-hero)] bg-background text-[color:var(--brand-hero)] shadow-sm"
              : "border-border bg-background text-muted-foreground",
        )}
      >
        {completed ? <CheckCircle2 className="size-5" /> : stepNumber}
      </div>
      <p className={cn("font-medium text-sm", current || completed ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </p>
    </div>
  );
}

export function SubmissionStepper({ step }: { step: WizardStep }) {
  return (
    <div className="space-y-6">
      <div className="h-2 rounded-full bg-secondary/80">
        <div
          className="h-2 rounded-full bg-linear-to-r from-[color:var(--brand-hero)] to-[color:var(--brand-hero-strong)] transition-all"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        {WIZARD_STEPS.map((item, index) => (
          <div key={item.step} className="flex items-center gap-4">
            <SubmissionStepBadge
              completed={item.step < step}
              current={item.step === step}
              label={item.title}
              stepNumber={item.step}
            />
            {index < WIZARD_STEPS.length - 1 && <div className="hidden h-px w-10 bg-border xl:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}
