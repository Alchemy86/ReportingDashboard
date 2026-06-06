import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

interface DashboardState {
  reportCount: number;
  refreshing: boolean;
}

const initialState: DashboardState = {
  reportCount: 0,
  refreshing: false,
};

/**
 * Example application-level SignalStore. Lives in `core` so any feature can inject it.
 * Demonstrates the @core/* path alias, OnPush + zoneless signal-driven change detection.
 */
export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ reportCount }) => ({
    hasReports: computed(() => reportCount() > 0),
  })),
  withMethods((store) => ({
    addReport(): void {
      patchState(store, { reportCount: store.reportCount() + 1 });
    },
    setRefreshing(refreshing: boolean): void {
      patchState(store, { refreshing });
    },
  })),
);
