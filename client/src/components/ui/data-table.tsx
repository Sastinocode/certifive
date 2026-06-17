import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export interface DataTableColumn<T> {
  /** Stable identifier for the column. */
  key: string;
  /** Header content — usually a short string. */
  header: ReactNode;
  /** Cell renderer for a given row. */
  cell: (row: T, index: number) => ReactNode;
  /** Text alignment for both header and cells. Defaults to "left". */
  align?: "left" | "right" | "center";
  /** Extra classes applied to the <td> of this column. */
  cellClassName?: string;
  /** Extra classes applied to the <th> of this column. */
  headClassName?: string;
  /**
   * Responsive visibility classes, e.g. "hidden md:table-cell".
   * Applied to both the header and the cells of this column.
   */
  responsive?: string;
}

interface DataTableEmpty {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Stable key for each row. */
  getRowKey: (row: T, index: number) => string | number;
  /** Makes rows clickable (adds cursor + click handler). */
  onRowClick?: (row: T) => void;
  /** Shown in place of the body when there are no rows. */
  empty?: DataTableEmpty | ReactNode;
  /** Wrapper className. */
  className?: string;
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

function isEmptyConfig(value: unknown): value is DataTableEmpty {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    "icon" in value
  );
}

/**
 * DataTable — base list table matching the panel-interno handoff
 * (see inmuebles.html / facturacion.html): an overflow wrapper, a muted
 * header row, hover-highlighted body rows, and a built-in empty state.
 *
 * Usage:
 *   <DataTable
 *     data={properties}
 *     getRowKey={(p) => p.id}
 *     onRowClick={(p) => setSelected(p)}
 *     columns={[
 *       { key: "address", header: "Inmueble", cell: (p) => p.address },
 *       { key: "rating",  header: "Letra",    cell: (p) => <EnergyChip rating={p.rating} /> },
 *     ]}
 *     empty={{ icon: <Home className="w-8 h-8" />, title: "Sin inmuebles" }}
 *   />
 */
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  empty,
  className,
}: DataTableProps<T>) {
  const isEmpty = data.length === 0;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {columns.map((col, i) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
                  i === 0 && "px-5",
                  ALIGN[col.align ?? "left"],
                  col.responsive,
                  col.headClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-0">
                {isEmptyConfig(empty) ? (
                  <EmptyState
                    size="compact"
                    icon={empty.icon}
                    title={empty.title}
                    description={empty.description}
                    action={empty.action}
                  />
                ) : (
                  empty
                )}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border hover:bg-muted/40 transition-colors",
                  onRowClick && "cursor-pointer",
                )}
              >
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-3 py-3",
                      i === 0 && "px-5",
                      ALIGN[col.align ?? "left"],
                      col.responsive,
                      col.cellClassName,
                    )}
                  >
                    {col.cell(row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
