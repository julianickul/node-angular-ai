// token.service.ts
import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private document = inject(DOCUMENT);

  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private get localStorage(): Storage | null {
    return this.document.defaultView?.localStorage ?? null;
  }

  /**
   * Сохраняет токены в localStorage
   */
  setTokens(accessToken: string, refreshToken: string): void {
    const storage = this.localStorage;
    if (storage) {
      storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Возвращает access token или null, если токен отсутствует
   */
  getAccessToken(): string | null {
    const storage = this.localStorage;
    return storage ? storage.getItem(this.ACCESS_TOKEN_KEY) : null;
  }

  /**
   * Возвращает refresh token или null, если токен отсутствует
   */
  getRefreshToken(): string | null {
    const storage = this.localStorage;
    return storage ? storage.getItem(this.REFRESH_TOKEN_KEY) : null;
  }

  /**
   * Проверяет наличие access token
   */
  hasAccessToken(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Удаляет все токены из localStorage
   */
  clearTokens(): void {
    const storage = this.localStorage;
    if (storage) {
      storage.removeItem(this.ACCESS_TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Обновляет только access token (для refresh-механизма)
   */
  updateAccessToken(accessToken: string): void {
    const storage = this.localStorage;
    if (storage) {
      storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    }
  }

  /**
   * Возвращает все токены в виде объекта
   */
  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken(),
    };
  }
}