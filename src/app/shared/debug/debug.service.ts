import { Injectable, computed, isDevMode, signal } from '@angular/core';

declare global {
  interface Window {
    debugService?: DebugService;
    toggleDebug?: (state?: boolean) => boolean;
    setDebug?: (state: boolean) => boolean;
  }
}

@Injectable({ providedIn: 'root' })
export class DebugService {
  private readonly _isDevBuild = isDevMode();
  private readonly _showDebug = signal(false);

  readonly isDevBuild = this._isDevBuild;
  readonly showDebug = computed(() => this._isDevBuild && this._showDebug());

  constructor() {
    this.registerGlobalDebugApi();
  }

  toggle(state?: boolean): boolean {
    if (!this._isDevBuild) {
      return false;
    }

    const next = state ?? !this._showDebug();
    this._showDebug.set(next);
    return this.showDebug();
  }

  set(state: boolean): boolean {
    return this.toggle(state);
  }

  log(...message: unknown[]): void {
    if (this.showDebug()) {
      console.log(...message);
    }
  }

  warn(...message: unknown[]): void {
    if (this.showDebug()) {
      console.warn(...message);
    }
  }

  private registerGlobalDebugApi(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.debugService = this;
    window.toggleDebug = (state?: boolean) => this.toggle(state);
    window.setDebug = (state: boolean) => this.set(state);

    if (this._isDevBuild) {
      console.info('Debug API ready: use toggleDebug() or setDebug(true|false).');
    }
  }
}
