"use client";

import { useId, useRef, useState } from "react";

import { ImageIcon, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  value: File | null;
  onChange: (value: File | null) => void;
  accept?: string;
  title?: string;
  description?: string;
  disabled?: boolean;
}

export function FileDropzone({
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp",
  title = "Klik atau seret file ke sini",
  description = "JPG, PNG, atau WebP",
  disabled = false,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    onChange(files[0] ?? null);
  };

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "rounded-3xl border border-dashed p-4 transition",
        isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20",
        disabled && "cursor-not-allowed opacity-60",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) {
          handleFiles(event.dataTransfer.files);
        }
      }}
    >
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        {value ? (
          <>
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ImageIcon className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">{value.name}</p>
              <p className="text-muted-foreground text-xs">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  inputRef.current?.click();
                }}
              >
                Ganti File
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  onChange(null);
                }}
              >
                Hapus
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <UploadCloud className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-muted-foreground text-xs">{description}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.preventDefault();
                inputRef.current?.click();
              }}
              disabled={disabled}
            >
              Pilih File
            </Button>
          </>
        )}
      </div>
    </label>
  );
}
