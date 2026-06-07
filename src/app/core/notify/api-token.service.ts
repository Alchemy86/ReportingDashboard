import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'notify.apiKey';

/**
 * Holds the Notify API key and persists it to `localStorage` so it survives a
 * full page reload (F5). The key is read by {@link apiKeyInterceptor} and gates
 * the app via the auth-token guard.
 */
@Injectable({ providedIn: 'root' })
export class ApiTokenService {
  private readonly _token = signal<string | null>(this.read());

  readonly token = this._token.asReadonly();
  readonly hasToken = computed(() => !!this._token());

  setToken(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      this.clear();
      return;
    }
    this.write(trimmed);
    this._token.set(trimmed);
  }

  /** Remove the stored key. The next guarded navigation re-gates the app. */
  clear(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this._token.set(null);
  }

  private read(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(STORAGE_KEY);
  }

  private write(value: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value);
    }
  }
}
