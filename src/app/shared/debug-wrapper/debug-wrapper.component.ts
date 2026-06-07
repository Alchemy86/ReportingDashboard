import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DebugService } from '@shared/debug/debug.service';

@Component({
  selector: 'app-debug-wrapper',
  imports: [],
  templateUrl: './debug-wrapper.component.html',
  styleUrl: './debug-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebugWrapperComponent {
  readonly title = input('Debug Output');
  protected readonly debug = inject(DebugService);
}
