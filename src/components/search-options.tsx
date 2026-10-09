"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SearchInput from "@/components/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrderTypes, SortTypes } from "@/lib/types";

const sortItems = [
  { value: "updatedAt", label: "Date" },
  { value: "likes", label: "Likes" },
];

const orderItems = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

type SearchOptionsProps = {
  q: string;
  sortBy: SortTypes;
  order: OrderTypes;
};

/**
 * Search box plus sort options. Updates the `q`, `sort_by` and `order` URL
 * search parameters so the page refetches with the new options.
 */
function SearchOptions({ q, sortBy, order }: SearchOptionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-4 mt-4 flex w-full flex-col justify-between gap-4 p-2 md:flex-row md:p-4">
      <SearchInput initialQ={q} />
      <div className="flex w-full flex-col items-start justify-end gap-4 sm:flex-row sm:items-center">
        <p className="shrink-0 text-sm font-semibold">Options:</p>
        <Select
          items={sortItems}
          value={sortBy}
          onValueChange={(value) => updateParam("sort_by", String(value))}
        >
          <SelectTrigger size="sm" className="w-full sm:w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={orderItems}
          value={order}
          onValueChange={(value) => updateParam("order", String(value))}
        >
          <SelectTrigger size="sm" className="w-full sm:w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default SearchOptions;
