"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis-right", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis-left", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages] as const;
}

interface TablePaginationProps {
  summary: string;
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  summary,
  page,
  totalPages,
  disabled = false,
  onPageChange,
}: TablePaginationProps) {
  const pages = useMemo(() => getVisiblePages(page, Math.max(1, totalPages)), [page, totalPages]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">{summary}</p>

      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              Sebelumnya
            </Button>
          </PaginationItem>

          {pages.map((entry) => {
            if (typeof entry !== "number") {
              return (
                <PaginationItem key={entry}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            const isActive = entry === page;

            return (
              <PaginationItem key={entry}>
                <Button
                  type="button"
                  variant={isActive ? "outline" : "ghost"}
                  size="icon-sm"
                  aria-current={isActive ? "page" : undefined}
                  disabled={disabled}
                  className="rounded-xl"
                  onClick={() => onPageChange(entry)}
                >
                  {entry}
                </Button>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
              Berikutnya
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
