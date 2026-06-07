import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  MultiSelectDropdownComponent,
  MultiSelectOption,
} from '@shared/multi-select-dropdown/multi-select-dropdown.component';

/** One filter row shown inside the panel. */
export interface FilterFieldConfig {
  /** Matches the URL query param key and the key in ActiveFilters. */
  key: string;
  /** Human-readable label shown above the dropdown. */
  label: string;
  /** Static list of options. Use this OR deriveOptions. */
  options?: MultiSelectOption[];
  /**
   * Dynamically derive options from the raw data input.
   * Runs inside a computed() so it re-evaluates when data changes.
   */
  deriveOptions?: (data: unknown[]) => MultiSelectOption[];
  /** Restrict to a single selection at a time. Default: false. */
  singleSelect?: boolean;
}

/** Map of field key → selected option ids. */
export type ActiveFilters = Record<string, string[]>;

@Component({
  selector: 'app-filter-panel',
  imports: [MultiSelectDropdownComponent],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closePanel()',
  },
})
export class FilterPanelComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  /** Field definitions for the filter panel. */
  readonly fields = input<FilterFieldConfig[]>([]);
  /**
   * Source rows. Passed to `deriveOptions` functions so options reflect
   * the actual loaded dataset.
   */
  readonly data = input<unknown[]>([]);

  /** Emitted when the user clicks Apply or Reset. */
  readonly filtersChange = output<ActiveFilters>();

  protected readonly isOpen = signal(false);
  private readonly _active = signal<ActiveFilters>({});
  private readonly _draft = signal<ActiveFilters>({});

  /** Resolved field list — options derived from data where applicable. */
  protected readonly resolvedFields = computed(() =>
    this.fields().map((field) => ({
      ...field,
      resolvedOptions: field.deriveOptions
        ? field.deriveOptions(this.data())
        : (field.options ?? []),
    })),
  );

  /** Number of filter keys that have at least one selection (for badge). */
  protected readonly activeCount = computed(
    () => Object.values(this._active()).filter((vals) => vals.length > 0).length,
  );

  /** Current draft state as a map — used in template bindings. */
  protected readonly draftMap = computed((): Record<string, string[] | undefined> => this._draft());

  ngOnInit(): void {
    this.syncFromUrl();
  }

  protected togglePanel(): void {
    const willOpen = !this.isOpen();
    this.isOpen.set(willOpen);
    if (willOpen) {
      // Copy committed state into draft whenever panel opens.
      this._draft.set({ ...this._active() });
    }
  }

  protected closePanel(): void {
    this.isOpen.set(false);
  }

  protected setDraft(key: string, values: string[]): void {
    this._draft.update((current) => ({ ...current, [key]: values }));
  }

  protected applyFilters(): void {
    const committed = { ...this._draft() };
    this._active.set(committed);
    this.updateUrl(committed);
    this.filtersChange.emit(committed);
    this.closePanel();
  }

  protected resetFilters(): void {
    const empty: ActiveFilters = {};
    this._active.set(empty);
    this._draft.set(empty);
    this.updateUrl(empty);
    this.filtersChange.emit(empty);
    this.closePanel();
  }

  protected onDocumentClick(event: Event): void {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.hostRef.nativeElement.contains(target)) {
      this.closePanel();
    }
  }

  private syncFromUrl(): void {
    const params = this.route.snapshot.queryParams as Record<string, string | string[]>;
    const fromUrl: ActiveFilters = {};

    for (const field of this.fields()) {
      const raw = params[field.key];
      if (raw != null) {
        fromUrl[field.key] = Array.isArray(raw) ? raw : [raw];
      }
    }

    if (Object.keys(fromUrl).length > 0) {
      this._active.set(fromUrl);
      this._draft.set({ ...fromUrl });
      this.filtersChange.emit(fromUrl);
    }
  }

  private updateUrl(filters: ActiveFilters): void {
    const queryParams: Record<string, string[] | null> = {};
    for (const field of this.fields()) {
      const vals = filters[field.key];
      queryParams[field.key] = vals && vals.length > 0 ? vals : null;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
