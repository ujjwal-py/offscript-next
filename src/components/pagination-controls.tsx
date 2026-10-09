"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import type { OrderTypes, SortTypes } from "@/lib/types";

type PaginationControlsProps = {
  currentPage: number;
  /** Total number of pages (the original used a fixed 10 pages) */
  totalPages?: number;
  /** Current feed options, preserved across page links */
  q?: string;
  sortBy: SortTypes;
  order: OrderTypes;
};

/**
 * Paginated navigation with prefetching enabled via the Next.js Link
 * component. Builds hrefs from the current search params.
 */
function PaginationControls({
  currentPage,
  totalPages = 10,
  q,
  sortBy,
  order,
}: PaginationControlsProps) {
  const pathname = usePathname();

  const pageHref = (page: number) => {
    const query: Record<string, string> = {
      sort_by: sortBy,
      order,
      page: String(page),
    };
    if (q) query.q = q;
    return { pathname, query };
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <Pagination className="mb-4 mt-8">
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            nativeButton={false}
            render={<Link href={pageHref(Math.max(currentPage - 1, 1))} />}
          >
            <ChevronLeftIcon data-icon="inline-start" />
            <span className="hidden sm:block">Previous</span>
          </Button>
        </PaginationItem>

        {pages.map((page) => (
          <PaginationItem key={page}>
            <Button
              variant={page === currentPage ? "outline" : "ghost"}
              size="icon-sm"
              aria-current={page === currentPage ? "page" : undefined}
              nativeButton={false}
              render={<Link href={pageHref(page)} />}
            >
              {page}
            </Button>
          </PaginationItem>
        ))}

        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            aria-disabled={currentPage >= totalPages}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            nativeButton={false}
            render={<Link href={pageHref(Math.min(currentPage + 1, totalPages))} />}
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default PaginationControls;
