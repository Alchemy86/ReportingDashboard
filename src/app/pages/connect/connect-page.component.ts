import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiTokenService } from '@core/notify/api-token.service';
import { TokenFormComponent } from '@shared/token-form/token-form.component';

@Component({
  selector: 'app-connect-page',
  standalone: true,
  imports: [TokenFormComponent],
  templateUrl: './connect-page.component.html',
  styleUrl: './connect-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectPageComponent {
  private readonly tokenService = inject(ApiTokenService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly currentToken = this.tokenService.token;

  protected onSave(token: string): void {
    this.tokenService.setToken(token);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    this.router.navigateByUrl(returnUrl);
  }

  protected onClear(): void {
    this.tokenService.clear();
  }
}
