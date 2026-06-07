import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';

@Component({
  selector: 'app-token-form',
  standalone: true,
  templateUrl: './token-form.component.html',
  styleUrl: './token-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenFormComponent implements OnInit {
  /** Current token value (or null if none is set). */
  readonly value = input<string | null>(null);

  /** Emitted when the user clicks Save with a non-empty value. */
  readonly save = output<string>();

  /** Emitted when the user clicks Clear. */
  readonly clear = output();

  protected inputValue = '';
  protected showPassword = false;

  ngOnInit(): void {
    this.inputValue = this.value() ?? '';
  }

  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  protected onSave(): void {
    const trimmed = this.inputValue.trim();
    if (trimmed) {
      this.save.emit(trimmed);
    }
  }

  protected onClear(): void {
    this.inputValue = '';
    this.clear.emit();
  }
}
