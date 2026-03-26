"use client";

import { useState } from "react";

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface HashtagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

function normalizeHashtag(value: string) {
  const trimmed = value.trim().replace(/\s+/g, "");
  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function HashtagInput({
  value,
  onChange,
  placeholder = "Ketik hashtag lalu tekan Enter",
  disabled = false,
}: HashtagInputProps) {
  const [draft, setDraft] = useState("");

  const addHashtag = () => {
    const normalized = normalizeHashtag(draft);
    if (!normalized || value.includes(normalized)) {
      setDraft("");
      return;
    }

    onChange([...value, normalized]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <Input
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addHashtag();
          }

          if (event.key === "Backspace" && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((hashtag) => (
            <Badge key={hashtag} variant="outline" className="h-8 gap-2 rounded-full px-3">
              {hashtag}
              <button
                type="button"
                aria-label={`Hapus ${hashtag}`}
                onClick={() => onChange(value.filter((item) => item !== hashtag))}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
