import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { ApiTokenService } from './api-token.service';
import { NOTIFY_API_KEY_HEADER, NOTIFY_BASE_URL } from './notify.models';

/**
 * Add our API token to all outgoing requests on the Notify API.
 * Part of the strucutre so we dont need to think about it.
 */
export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(ApiTokenService).token();

  if (token && req.url.startsWith(NOTIFY_BASE_URL)) {
    return next(req.clone({ setHeaders: { [NOTIFY_API_KEY_HEADER]: token } }));
  }

  return next(req);
};
