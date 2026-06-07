import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { NotifyApiService } from '@core/notify/notify-api.service';
import { IncidentSimpleSummaryModel, PeriodReportedName } from '@core/notify/notify.models';
import { DataTableComponent } from '@shared/data-table/data-table.component';
import { TableColumn, TableConfig } from '@shared/data-table/data-table.types';
import {
  ActiveFilters,
  FilterFieldConfig,
  FilterPanelComponent,
} from '@shared/filter-panel/filter-panel.component';
import { ModalComponent } from '@shared/modal/modal.component';

@Component({
  selector: 'app-incidents-page',
  standalone: true,
  imports: [DataTableComponent, FilterPanelComponent, ModalComponent],
  templateUrl: './incidents-page.component.html',
  styleUrl: './incidents-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentsPageComponent {
  private readonly api = inject(NotifyApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly allIncidents = signal<IncidentSimpleSummaryModel[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedIncident = signal<IncidentSimpleSummaryModel | null>(null);
  protected readonly activeFilters = signal<ActiveFilters>({});

  protected readonly incidents = computed(() => {
    const rows = this.allIncidents();
    const filters = this.activeFilters();
    const statuses = filters['status'] ?? [];
    const priorities = filters['priority'] ?? [];
    const types = filters['type'] ?? [];
    const reportableOnly = filters['reportable'] ?? [];

    return rows.filter((incident) => {
      if (statuses.length > 0 && !statuses.includes(incident.statusName ?? 'Unknown')) return false;
      if (priorities.length > 0 && !priorities.includes(incident.priorityName ?? 'NotSet'))
        return false;
      if (types.length > 0 && !types.includes(incident.incidentType?.name ?? 'Unspecified'))
        return false;
      if (reportableOnly.includes('true') && !incident.isReportable) return false;
      return true;
    });
  });

  protected readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'period',
      label: 'Period',
      options: [
        { id: 'Last7Days', label: 'Last 7 Days' },
        { id: 'Last30Days', label: 'Last 30 Days' },
        { id: 'Last90Days', label: 'Last 90 Days' },
        { id: 'ThisMonth', label: 'This Month' },
        { id: 'LastCalendarMonth', label: 'Last Calendar Month' },
        { id: 'LastQuarter', label: 'Last Quarter' },
        { id: 'ThisCalendarYear', label: 'This Calendar Year' },
        { id: 'LastCalendarYear', label: 'Last Calendar Year' },
        { id: 'ThisFinancialYear', label: 'This Financial Year' },
        { id: 'LastFinancialYear', label: 'Last Financial Year' },
        { id: 'Rolling12Months', label: 'Rolling 12 Months' },
      ],
      singleSelect: true,
    },
    {
      key: 'status',
      label: 'Status',
      deriveOptions: (rows) =>
        this.uniqueOptions(
          (rows as IncidentSimpleSummaryModel[]).map((r) => r.statusName ?? 'Unknown'),
        ),
      singleSelect: true,
    },
    {
      key: 'priority',
      label: 'Priority',
      deriveOptions: (rows) =>
        this.uniqueOptions(
          (rows as IncidentSimpleSummaryModel[]).map((r) => r.priorityName ?? 'NotSet'),
        ),
      singleSelect: true,
    },
    {
      key: 'type',
      label: 'Incident Type',
      deriveOptions: (rows) =>
        this.uniqueOptions(
          (rows as IncidentSimpleSummaryModel[]).map((r) => r.incidentType?.name ?? 'Unspecified'),
        ),
      singleSelect: true,
    },
  ];

  protected readonly columns: TableColumn<IncidentSimpleSummaryModel>[] = [
    { key: 'incidentNumber', title: '#', sortable: true, width: '80px' },
    {
      key: 'incidentType.name',
      title: 'Type',
      sortable: true,
      render: (val: string | null) => val || 'Unspecified',
    },
    {
      key: 'priorityName',
      title: 'Priority',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (val: string | null) => this.renderPriorityBadge(val),
    },
    {
      key: 'statusName',
      title: 'Status',
      sortable: true,
      align: 'center',
      width: '100px',
    },
    {
      key: 'reportDateTime',
      title: 'Reported',
      sortable: true,
      render: (val: string) => new Date(val).toLocaleDateString(),
    },
    {
      key: 'assignedToFullName',
      title: 'Assignee',
      sortable: true,
      render: (val: string | null) => val || 'Unassigned',
    },
  ];

  protected readonly tableConfig: TableConfig = {
    pageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    searchPlaceholder: 'Search incidents…',
  };

  constructor() {
    this.loadIncidents();
  }

  protected onSelectIncident(incident: unknown): void {
    this.selectedIncident.set(incident as IncidentSimpleSummaryModel);
  }

  protected closeDetail(): void {
    this.selectedIncident.set(null);
  }

  protected onFiltersChanged(filters: ActiveFilters): void {
    const nextPeriod = this.getPeriodFromFilters(filters);
    const currentPeriod = this.getPeriodFromFilters(this.activeFilters());

    this.activeFilters.set({ ...filters, period: [nextPeriod] });
    this.selectedIncident.set(null);

    if (nextPeriod !== currentPeriod) {
      void this.loadIncidentsWithPeriod(nextPeriod);
    }
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  private async loadIncidents(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Read URL params to set initial filters
      const statusParam = this.route.snapshot.queryParamMap.get('status') as string | null;
      const typeParam = this.route.snapshot.queryParamMap.get('type') as string | null;
      const priorityParam = this.route.snapshot.queryParamMap.get('priority') as string | null;
      const reportableParam = this.route.snapshot.queryParamMap.get('reportable') as string | null;
      const periodParam = this.route.snapshot.queryParamMap.get('period') as string | null;
      const effectivePeriod = (periodParam as PeriodReportedName) ?? 'Last90Days';

      // Keep period in the URL so filter-panel state is URL-driven from first load.
      if (!periodParam) {
        await this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { period: effectivePeriod },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }

      // Set initial active filters from URL
      const initialFilters: ActiveFilters = {
        period: [effectivePeriod],
      };
      if (statusParam) initialFilters['status'] = [statusParam];
      if (typeParam) initialFilters['type'] = [typeParam];
      if (priorityParam) initialFilters['priority'] = [priorityParam];
      if (reportableParam) initialFilters['reportable'] = [reportableParam];

      this.activeFilters.set(initialFilters);

      const period = this.getPeriodFromFilters(initialFilters);
      this.activeFilters.set({ ...initialFilters, period: [period] });
      await this.loadIncidentsWithPeriod(period);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load incidents');
    }
  }

  private async loadIncidentsWithPeriod(period: PeriodReportedName): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await firstValueFrom(this.api.getIncidents({ period }));
      this.allIncidents.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      this.loading.set(false);
    }
  }

  private uniqueOptions(values: string[]): { id: string; label: string }[] {
    const unique = Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
    return unique.map((value) => ({ id: value, label: value }));
  }

  private getPeriodFromFilters(filters: ActiveFilters): PeriodReportedName {
    return ((filters['period'] ?? ['Last90Days'])[0] as PeriodReportedName) ?? 'Last90Days';
  }

  protected renderPriorityBadge(priority: string | null): string {
    const classes: Record<string, string> = {
      High: 'dt-badge dt-badge--red',
      Medium: 'dt-badge dt-badge--amber',
      Low: 'dt-badge dt-badge--green',
      NotSet: 'dt-badge dt-badge--slate',
    };
    const cls = classes[priority || 'NotSet'] || classes['NotSet'];
    return `<span class="${cls}">${priority || 'NotSet'}</span>`;
  }
}
