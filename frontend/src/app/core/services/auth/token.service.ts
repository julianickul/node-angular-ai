import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly document = inject(DOCUMENT);

  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private readonly accessTokenSignal = signal<string | null>(this.readFromStorage(this.ACCESS_TOKEN_KEY));
  private readonly refreshTokenSignal = signal<string | null>(this.readFromStorage(this.REFRESH_TOKEN_KEY));

  private get localStorage(): Storage | null {
    return this.document.defaultView?.localStorage ?? null;
  }

  private readFromStorage(key: string): string | null {
    return this.localStorage?.getItem(key) ?? null;
  }

  /**
   * Сохраняет токены в localStorage и обновляет сигналы
   */
  setTokens(accessToken: string, refreshToken: string): void {
    const storage = this.localStorage;
    if (storage) {
      storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    this.accessTokenSignal.set(accessToken);
    this.refreshTokenSignal.set(refreshToken);
  }

  /**
   * Возвращает access token или null, если токен отсутствует
   */
  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  /**
   * Возвращает refresh token или null, если токен отсутствует
   */
  getRefreshToken(): string | null {
    return this.refreshTokenSignal();
  }

  /**
   * Проверяет наличие access token (читает сигнал — для computed/guards)
   */
  hasAccessToken(): boolean {
    return this.accessTokenSignal() !== null;
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
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
  }

  /**
   * Обновляет только access token (для refresh-механизма)
   */
  updateAccessToken(accessToken: string): void {
    const storage = this.localStorage;
    if (storage) {
      storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    }
    this.accessTokenSignal.set(accessToken);
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
