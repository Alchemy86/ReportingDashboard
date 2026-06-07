import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ApiTokenService } from '@core/notify/api-token.service';
import { BreadcrumbsComponent } from '@shared/breadcrumbs/breadcrumbs.component';
import { DebugService } from '@shared/debug/debug.service';
import { ModalComponent } from '@shared/modal/modal.component';
import { TokenFormComponent } from '@shared/token-form/token-form.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, BreadcrumbsComponent, ModalComponent, TokenFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('reporting-dashboard');
  protected readonly debug = inject(DebugService);
  protected readonly tokenService = inject(ApiTokenService);
  protected readonly router = inject(Router);
  protected readonly showTokenModal = signal(false);

  constructor() {
    afterNextRender(() => {
      if (!this.tokenService.hasToken()) {
        this.showTokenModal.set(true);
      }
    });
  }

  protected openTokenModal(): void {
    this.showTokenModal.set(true);
  }

  protected closeTokenModal(): void {
    this.showTokenModal.set(false);
  }

  protected onSaveToken(token: string): void {
    this.tokenService.setToken(token);
    this.closeTokenModal();
  }

  protected onClearToken(): void {
    this.tokenService.clear();
    this.closeTokenModal();
    this.router.navigate(['/connect']);
  }
}
