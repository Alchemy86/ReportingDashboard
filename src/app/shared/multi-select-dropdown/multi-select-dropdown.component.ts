import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface MultiSelectOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-multi-select-dropdown',
  imports: [],
  templateUrl: './multi-select-dropdown.component.html',
  styleUrl: './multi-select-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class MultiSelectDropdownComponent {
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly options = input<MultiSelectOption[]>([]);
  readonly label = input('Select');
  readonly singleSelectMode = input(false);
  readonly selectedValues = input<string[]>([]);

  readonly selectedValuesChange = output<string[]>();

  protected readonly isOpen = signal(false);
  protected readonly filterText = signal('');
  protected readonly internalSelection = signal<string[]>([]);

  protected readonly selectedLabels = computed(() => {
    const selected = this.internalSelection();
    const lookup = new Map(this.options().map((option) => [option.id, option.label]));
    return selected.map((id) => lookup.get(id)).filter((label): label is string => Boolean(label));
  });

  protected readonly selectedChips = computed(() => {
    const selected = this.internalSelection();
    const lookup = new Map(this.options().map((option) => [option.id, option.label]));
    return selected
      .map((id) => {
        const label = lookup.get(id);
        return label ? { id, label } : null;
      })
      .filter((chip): chip is { id: string; label: string } => chip !== null);
  });

  protected readonly filteredOptions = computed(() => {
    const query = this.filterText().trim().toLowerCase();
    const options = this.options();

    if (!query) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(query));
  });

  constructor() {
    effect(() => {
      const incoming = this.selectedValues();
      this.internalSelection.set([...incoming]);
    });
  }

  protected toggleMenu(): void {
    this.isOpen.update((open) => !open);
    if (!this.isOpen()) {
      this.filterText.set('');
    }
  }

  protected closeMenu(): void {
    this.isOpen.set(false);
    this.filterText.set('');
  }

  protected onFilterInput(event: Event): void {
    this.filterText.set((event.target as HTMLInputElement).value);
  }

  protected toggleOption(optionId: string): void {
    if (this.singleSelectMode()) {
      const next = [optionId];
      this.internalSelection.set(next);
      this.selectedValuesChange.emit(next);
      this.closeMenu();
      return;
    }

    const next = [...this.internalSelection()];
    const existingIndex = next.indexOf(optionId);

    if (existingIndex >= 0) {
      next.splice(existingIndex, 1);
    } else {
      next.push(optionId);
    }

    this.internalSelection.set(next);
    this.selectedValuesChange.emit(next);
  }

  protected removeSelection(optionId: string, event: Event): void {
    event.stopPropagation();
    const next = this.internalSelection().filter((id) => id !== optionId);
    this.internalSelection.set(next);
    this.selectedValuesChange.emit(next);
  }

  protected isSelected(optionId: string): boolean {
    return this.internalSelection().includes(optionId);
  }

  protected onDocumentClick(event: Event): void {
    if (!this.isOpen()) {
      return;
    }

    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (!this.hostElement.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }
}
