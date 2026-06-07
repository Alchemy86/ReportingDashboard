import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { NotifyApiService } from './notify-api.service';
import {
  IncidentSimpleSummaryModel,
  IncidentStatisticsModel,
  PeriodReportedName,
} from './notify.models';

export interface ChartDatum {
  name: string;
  value: number;
}

interface IncidentsState {
  loading: boolean;
  error: string | null;
  loaded: boolean;
  selectedPeriod: PeriodReportedName;
  statistics: IncidentStatisticsModel | null;
  openIncidents: IncidentSimpleSummaryModel[];
}

const initialState: IncidentsState = {
  loading: false,
  error: null,
  loaded: false,
  selectedPeriod: 'Last90Days',
  statistics: null,
  openIncidents: [],
};

/** Display order for severities; anything unknown falls through to the end. */
const SEVERITY_ORDER = ['High', 'Medium', 'Low', 'NotSet'];

const PERIOD_LABELS: Record<PeriodReportedName, string> = {
  All: 'All Time',
  Last7Days: 'Last 7 Days',
  Last30Days: 'Last 30 Days',
  Last90Days: 'Last 90 Days',
  ThisMonth: 'This Month',
  LastCalendarMonth: 'Last Calendar Month',
  LastQuarter: 'Last Quarter',
  ThisCalendarYear: 'This Calendar Year',
  LastCalendarYear: 'Last Calendar Year',
  ThisFinancialYear: 'This Financial Year',
  LastFinancialYear: 'Last Financial Year',
  Rolling12Months: 'Rolling 12 Months',
};

/**
 * Loads and exposes the incident data backing the dashboard: open incidents
 * (with severity breakdown) and last-90-day statistics (by incident type).
 */
export const IncidentsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ openIncidents, selectedPeriod, statistics }) => ({
    /** Open incidents grouped by priority/severity, for the pie chart. */
    severityData: computed<ChartDatum[]>(() => {
      const counts = new Map<string, number>();
      for (const incident of openIncidents()) {
        const name = incident.priorityName || 'NotSet';
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => severityRank(a.name) - severityRank(b.name));
    }),

    /** Incident counts by type for the selected period, for the bar chart. */
    typeData: computed<ChartDatum[]>(() =>
      (statistics()?.summary ?? [])
        .map((row) => ({ name: row.incidentType || 'Unspecified', value: row.total }))
        .sort((a, b) => b.value - a.value),
    ),

    selectedPeriodLabel: computed(() => PERIOD_LABELS[selectedPeriod()]),

    /** Headline numbers for the stat cards. */
    cards: computed(() => {
      const stats = statistics();
      const open = openIncidents();
      return {
        openCount: open.length,
        openHighPriority: open.filter((i) => i.priorityName === 'High').length,
        selectedPeriodTotal: stats?.total ?? 0,
        reportableTotal: stats?.reportableTotal ?? 0,
      };
    }),
  })),
  withMethods((store) => {
    const api = inject(NotifyApiService);
    return {
      /** Fetch statistics + open incidents in parallel and populate state. */
      async load(): Promise<void> {
        if (store.loading()) {
          return;
        }
        const period = store.selectedPeriod();
        patchState(store, { loading: true, error: null });
        try {
          const [statistics, openIncidents] = await Promise.all([
            firstValueFrom(api.getStatistics(period)),
            firstValueFrom(api.getOpenIncidents(period)),
          ]);
          patchState(store, { statistics, openIncidents, loading: false, loaded: true });
        } catch (err) {
          patchState(store, {
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load incident data.',
          });
        }
      },

      async setPeriod(period: PeriodReportedName): Promise<void> {
        if (store.selectedPeriod() === period) {
          return;
        }
        patchState(store, { selectedPeriod: period, loaded: false });
        await this.load();
      },
    };
  }),
);

function severityRank(name: string): number {
  const idx = SEVERITY_ORDER.indexOf(name);
  return idx === -1 ? SEVERITY_ORDER.length : idx;
}
