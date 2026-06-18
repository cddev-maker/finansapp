"use client";

import * as React from "react";
import {
  type ColumnDef, type SortingState, type ColumnFiltersState,
  flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Skeleton } from "./skeleton";

interface DataTableProps<TData, TValue> {
  columns:     ColumnDef<TData, TValue>[];
  data:        TData[];
  loading?:    boolean;
  searchKey?:  string;
  searchPlaceholder?: string;
  pageSize?:   number;
  toolbar?:    React.ReactNode;
  emptyState?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns, data, loading, searchKey, searchPlaceholder = "Ara...", pageSize = 25, toolbar, emptyState,
}: DataTableProps<TData, TValue>) {
  const [sorting,       setSorting]       = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data, columns,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange:       setSorting,
    onColumnFiltersChange: setColumnFilters,
    initialState:          { pagination: { pageSize } },
    state:                 { sorting, columnFilters },
  });

  return (
    <div className="space-y-4">
      {(searchKey || toolbar) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
              className="max-w-xs"
            />
          )}
          {toolbar && <div className="flex items-center gap-2 ml-auto">{toolbar}</div>}
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn("flex items-center gap-1", header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground transition-colors")}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          header.column.getIsSorted() === "asc"  ? <ChevronUp className="h-3 w-3" /> :
                          header.column.getIsSorted() === "desc" ? <ChevronDown className="h-3 w-3" /> :
                          <ChevronsUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  {emptyState ?? <span className="text-muted-foreground text-sm">Kayıt bulunamadı</span>}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {table.getFilteredRowModel().rows.length} kayıt, sayfa {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Önceki</Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()}     disabled={!table.getCanNextPage()}>Sonraki</Button>
          </div>
        </div>
      )}
    </div>
  );
}
