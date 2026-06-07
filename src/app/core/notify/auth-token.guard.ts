import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ApiTokenService } from './api-token.service';

/**
 * Blocks access to data-backed routes until an API key is stored. Without one,
 * redirects to `/connect` carrying the attempted URL as `returnUrl`.
 */
export const authTokenGuard: CanActivateFn = (_route, state) => {
  const tokens = inject(ApiTokenService);
  const router = inject(Router);

  if (tokens.hasToken()) {
    return true;
  }

  return router.createUrlTree(['/connect'], {
    queryParams: { returnUrl: state.url },
  });
};
