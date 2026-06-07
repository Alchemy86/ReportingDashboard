import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LucideAngularModule],
})
export class ModalComponent {
  // ── Inputs ─────────────────────────────────────────────────────────────────

  /** Controls open/closed state. Parent owns this signal. */
  readonly isOpen = input.required<boolean>();

  /** Optional heading shown in the modal header. */
  readonly title = input<string>('');

  /**
   * Presentation mode for the modal container.
   * `center` keeps the current centered dialog behavior.
   * `side` renders a right-side slide-out drawer.
   */
  readonly variant = input<'center' | 'side'>('center');

  // ── Outputs ────────────────────────────────────────────────────────────────

  /**
   * Emitted whenever the modal closes — whether by the close button,
   * backdrop click, or the native Escape key.
   * Parent should set its `isOpen` signal to `false` in response.
   */
  readonly closed = output<undefined>();

  // ── Internal refs & icons ──────────────────────────────────────────────────

  protected readonly icons = { X };

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  // ── Effect: sync signal → native dialog state ──────────────────────────────

  constructor() {
    effect(() => {
      const dialog = this.dialogEl().nativeElement;
      if (this.isOpen()) {
        if (!dialog.open && typeof dialog.showModal === 'function') {
          dialog.showModal();
        }
      } else {
        if (dialog.open && typeof dialog.close === 'function') {
          dialog.close();
        }
      }
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Close via the header button. */
  close(): void {
    this.dialogEl().nativeElement.close();
    // `onNativeClose` will also fire but emitting twice is safe —
    // parent just sets signal to false.
  }

  // ── Template event handlers ────────────────────────────────────────────────

  /**
   * The native `(close)` event fires for ALL close paths
   * (Escape, `dialog.close()`, etc.) — single place to emit outward.
   */
  protected onNativeClose(): void {
    this.closed.emit(undefined);
  }

  /** Click on the `<dialog>` backdrop (outside `.modal__panel`). */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogEl().nativeElement) {
      this.close();
    }
  }

  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.target === this.dialogEl().nativeElement) {
      this.close();
    }
  }
}
