import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ArrowDown, ArrowUp, ChevronsUpDown, LucideAngularModule, Search } from 'lucide-angular';
import { debounceTime } from 'rxjs/operators';

import {
  SortState,
  TableAction,
  TableActionEvent,
  TableColumn,
  TableConfig,
} from './data-table.types';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LucideAngularModule],
})
export class DataTableComponent {
  protected readonly icons = { Search, ArrowUp, ArrowDown, ChevronsUpDown };
  private static readonly EMPTY_RECORD: Record<string, unknown> = {};

  // ── Inputs ─────────────────────────────────────────────────────────────────

  /** Row data to display. */
  readonly data = input<unknown[]>([]);

  /** Column definitions. */
  readonly columns = input<TableColumn<unknown>[]>([]);

  /** Action button definitions rendered in the Actions column. */
  readonly actions = input<TableAction<unknown>[]>([]);

  /** Optional top-level configuration overrides. */
  readonly config = input<TableConfig>({});

  /**
   * Property key used to uniquely identify each row for change-tracking.
   * Default: `'id'`.
   */
  readonly rowKey = input<string>('id');

  // ── Outputs ────────────────────────────────────────────────────────────────

  /** Fires when any action button is clicked. */
  readonly actionEvent = output<TableActionEvent>();

  // ── Internal search state ──────────────────────────────────────────────────

  private readonly _searchRaw = signal('');

  /**
   * Debounced search query derived from the raw input signal.
   * Resets the current page whenever it changes.
   */
  readonly searchQuery = toSignal(toObservable(this._searchRaw).pipe(debounceTime(250)), {
    initialValue: '',
  });

  // ── Pagination & sort state ────────────────────────────────────────────────

  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly sortState = signal<SortState | null>(null);

  // ── Computed: config-derived helpers ──────────────────────────────────────

  readonly pageSizeOptions = computed(() => this.config().pageSizeOptions ?? [5, 10, 25, 50]);

  readonly hasActions = computed(() => this.actions().length > 0);

  readonly colSpan = computed(() => this.columns().length + (this.hasActions() ? 1 : 0));

  // ── Computed: data pipeline ────────────────────────────────────────────────

  /** Data after search filtering across all column values. */
  readonly filteredData = computed(() => {
    const query = (this.searchQuery() ?? '').toLowerCase().trim();
    const rows = this.data();

    if (!query) return rows;

    return rows.filter((row) =>
      this.columns().some((col) => {
        const val = this.getNestedValue(row, col.key);
        return String(val ?? '')
          .toLowerCase()
          .includes(query);
      }),
    );
  });

  /** Filtered data after applying the current sort. */
  readonly sortedData = computed(() => {
    const sort = this.sortState();
    const rows = [...this.filteredData()];

    if (!sort) return rows;

    return rows.sort((a, b) => {
      const aVal = this.getNestedValue(a, sort.column);
      const bVal = this.getNestedValue(b, sort.column);
      const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  });

  readonly totalItems = computed(() => this.filteredData().length);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  /** Slice of `sortedData` for the current page (always clamped within bounds). */
  readonly pagedData = computed(() => {
    const safePage = Math.min(this.currentPage(), this.totalPages());
    const size = this.pageSize();
    const start = (safePage - 1) * size;
    return this.sortedData().slice(start, start + size);
  });

  readonly pageStart = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalItems()),
  );

  /**
   * Page numbers to display in the pagination bar.
   * For > 7 pages a sliding window with `null` as an ellipsis placeholder is used.
   */
  readonly pageNumbers = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | null)[] = [1];

    if (current > 3) pages.push(null);

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push(null);

    pages.push(total);
    return pages;
  });

  // ── Effects: keep page in sync ─────────────────────────────────────────────

  constructor() {
    // Sync initial page size from config input.
    effect(() => {
      const size = this.config().pageSize;
      if (size != null) this.pageSize.set(size);
    });

    // Reset to page 1 whenever search or sort change.
    effect(() => {
      this.searchQuery();
      this.sortState();
      this.currentPage.set(1);
    });

    // Clamp page number if total pages shrinks (e.g. after filtering).
    effect(() => {
      const total = this.totalPages();
      if (this.currentPage() > total) this.currentPage.set(total);
    });
  }

  // ── Public methods ─────────────────────────────────────────────────────────

  onSearch(event: Event): void {
    this._searchRaw.set((event.target as HTMLInputElement).value);
  }

  sort(columnKey: string): void {
    const current = this.sortState();
    if (current?.column === columnKey) {
      this.sortState.set(
        current.direction === 'asc' ? { column: columnKey, direction: 'desc' } : null,
      );
    } else {
      this.sortState.set({ column: columnKey, direction: 'asc' });
    }
  }

  goToPage(page: number | null): void {
    if (page === null) return;
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  onPageSizeChange(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.currentPage.set(1);
  }

  onAction(actionId: string, row: unknown): void {
    this.actionEvent.emit({ actionId, row });
  }

  trackRow(row: unknown, index: number): unknown {
    const key = this.rowKey();
    if (row && typeof row === 'object') {
      const record = row as Record<string, unknown>;
      return record[key] ?? index;
    }
    return index;
  }

  /**
   * Returns the display value for a cell.
   * Delegates to `col.render` when defined, otherwise serialises the raw value.
   * Output is bound via `[innerHTML]` so Angular's built-in sanitizer applies.
   */
  getCellValue(row: unknown, col: TableColumn<unknown>): string {
    const value = this.getNestedValue(row, col.key);
    if (col.render) return col.render(value, row);
    return value == null ? '' : String(value);
  }

  /** Returns only the actions that should be visible for a given row. */
  getVisibleActions(row: unknown): TableAction<unknown>[] {
    return this.actions().filter((action) => {
      if (typeof action.show === 'function') return action.show(row);
      return action.show !== false;
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Resolves a dot-notation key path against an object, e.g. `'address.city'`. */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return DataTableComponent.EMPTY_RECORD[key];
    }, obj);
  }
}
