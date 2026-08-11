import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { IAuthResponse } from '@nnaai/shared-types';
import { AuthService } from '@core/services/auth/auth.service';
import { TokenService } from '@core/services/auth/token.service';
import { environment } from '@environments/environment';

const SKIP_REFRESH_URLS = ['/auth/login', '/auth/register', '/auth/refresh'];

/** Shared in-flight refresh so parallel 401s wait for one refresh call */
let refreshInFlight$: Observable<string> | null = null;

function shouldSkipRefresh(url: string): boolean {
  return SKIP_REFRESH_URLS.some((path) => url.includes(path));
}

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const injector = inject(Injector);
  const httpBackend = inject(HttpBackend);

  const accessToken = tokenService.getAccessToken();
  const authReq = accessToken ? withBearer(req, accessToken) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || shouldSkipRefresh(req.url)) {
        return throwError(() => error);
      }

      return refreshAccessToken(tokenService, httpBackend, injector).pipe(
        switchMap((token) => next(withBearer(req, token))),
      );
    }),
  );
};

function refreshAccessToken(
  tokenService: TokenService,
  httpBackend: HttpBackend,
  injector: Injector,
): Observable<string> {
  if (refreshInFlight$) {
    return refreshInFlight$;
  }

  const refreshToken = tokenService.getRefreshToken();
  if (!refreshToken) {
    injector.get(AuthService).expireSession();
    return throwError(() => new Error('No refresh token'));
  }

  // HttpBackend bypasses interceptors — avoids recursive 401 → refresh loop
  const http = new HttpClient(httpBackend);

  refreshInFlight$ = http
    .post<IAuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
    .pipe(
      map((response) => {
        injector.get(AuthService).applySession(response);
        return response.accessToken;
      }),
      catchError((err) => {
        injector.get(AuthService).expireSession();
        return throwError(() => err);
      }),
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  return refreshInFlight$;
}
