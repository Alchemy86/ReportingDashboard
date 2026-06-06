type BivariantCallback<Args extends unknown[], R> = {
  bivarianceHack(...args: Args): R;
}['bivarianceHack'];

/**
 * Configuration for a single table column.
 *
 * @template T - The row data type.
 */
export interface TableColumn<T = unknown> {
  /** Property key on the row object. Supports dot-notation for nested values (e.g. `'user.name'`). */
  key: string;
  /** Header label displayed in `<thead>`. */
  title: string;
  /** Allow the column to be sorted. Default: false. */
  sortable?: boolean;
  /** Fixed width, e.g. `'120px'` or `'10%'`. */
  width?: string;
  /** Horizontal alignment of cell content. Default: `'left'`. */
  align?: 'left' | 'center' | 'right';
  /** Extra CSS class(es) applied to each `<td>` in this column. */
  className?: string;
  /**
   * Custom cell renderer. Return a plain string (text) or an HTML string.
   * Angular will sanitize the output when bound via `[innerHTML]`.
   */
  render?: BivariantCallback<[unknown, T], string>;
}

/**
 * An action button rendered in the Actions column of each row.
 *
 * @template T - The row data type.
 */
export interface TableAction<T = unknown> {
  /** Unique identifier emitted with the `actionEvent` output. */
  id: string;
  /** Accessible label; shown as a tooltip on icon-only buttons. */
  label: string;
  /**
   * Optional image source for the action icon.
   * This is the preferred modern action visual.
   */
  imageSrc?: string;
  /** Optional alt text for the action image. Defaults to `label` when omitted. */
  imageAlt?: string;
  /**
   * Icon CSS class(es), e.g. `'bi bi-pencil'`.
   * Kept for backward compatibility when `imageSrc` is not provided.
   */
  icon?: string;
  /**
   * Full CSS class string for the button element.
   * Defaults to `'dt-action-btn'` when omitted.
   */
  className?: string;
  /**
   * Controls visibility for a specific row.
   * - `true` / omitted → always visible.
   * - `false` → always hidden.
   * - function → evaluated per row.
   */
  show?: boolean | BivariantCallback<[T], boolean>;
}

/** Top-level configuration passed to `<app-data-table [config]="...">`. */
export interface TableConfig {
  /** Initial rows-per-page. Default: `10`. */
  pageSize?: number;
  /** Page-size selector options. Default: `[5, 10, 25, 50]`. */
  pageSizeOptions?: number[];
  /** Placeholder text for the search input. Default: `'Search…'`. */
  searchPlaceholder?: string;
  /** Message shown inside the table when there are no matching rows. Default: `'No records found.'` */
  emptyMessage?: string;
  /** Additional CSS class(es) applied directly to the `<table>` element. */
  tableClass?: string;
  /** Hide the search bar entirely. Default: `false`. */
  hideSearch?: boolean;
}

/** Payload emitted by the `actionEvent` output. */
export interface TableActionEvent<T = unknown> {
  /** The `id` of the `TableAction` that was clicked. */
  actionId: string;
  /** The full row data object for the row that was acted on. */
  row: T;
}

/** Internal sort state. */
export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}
