import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IncidentsStore } from '@core/notify/incidents.store';
import { IncidentSimpleSummaryModel, PeriodReportedName } from '@core/notify/notify.models';
import { DataTableComponent } from '@shared/data-table/data-table.component';
import { TableColumn, TableConfig } from '@shared/data-table/data-table.types';
import { ModalComponent } from '@shared/modal/modal.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [DataTableComponent, NgxChartsModule, ModalComponent, FormsModule],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHomeComponent {
  protected readonly store = inject(IncidentsStore);
  private readonly router = inject(Router);
  protected readonly selectedIncident = signal<IncidentSimpleSummaryModel | null>(null);
  protected readonly selectedPeriod = signal<PeriodReportedName>(this.store.selectedPeriod());

  protected readonly periodOptions: readonly { value: PeriodReportedName; label: string }[] = [
    { value: 'Last7Days', label: 'Last 7 Days' },
    { value: 'Last30Days', label: 'Last 30 Days' },
    { value: 'Last90Days', label: 'Last 90 Days' },
    { value: 'ThisMonth', label: 'This Month' },
    { value: 'LastCalendarMonth', label: 'Last Calendar Month' },
    { value: 'LastQuarter', label: 'Last Quarter' },
    { value: 'ThisCalendarYear', label: 'This Calendar Year' },
    { value: 'LastCalendarYear', label: 'Last Calendar Year' },
    { value: 'ThisFinancialYear', label: 'This Financial Year' },
    { value: 'LastFinancialYear', label: 'Last Financial Year' },
    { value: 'Rolling12Months', label: 'Rolling 12 Months' },
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
    pageSizeOptions: [10, 25, 50],
    searchPlaceholder: 'Search incidents…',
  };

  constructor() {
    afterNextRender(() => {
      this.store.load();
    });
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

  protected formatTypeLabel(label: string): string {
    return label.length > 15 ? label.substring(0, 12) + '...' : label;
  }

  protected onSeverityClick(data: { name: string; value: number }): void {
    this.router.navigate(['/dashboard', 'incidents'], { queryParams: { priority: data.name } });
  }

  protected onTypeClick(data: { name: string; value: number }): void {
    this.router.navigate(['/dashboard', 'incidents'], { queryParams: { type: data.name } });
  }

  protected onOpenIncidentsClick(): void {
    this.router.navigate(['/dashboard', 'incidents'], { queryParams: { status: 'Open' } });
  }

  protected onHighPriorityClick(): void {
    this.router.navigate(['/dashboard', 'incidents'], {
      queryParams: { priority: 'High', status: 'Open' },
    });
  }

  protected onPeriodCardClick(): void {
    this.router.navigate(['/dashboard', 'incidents'], { queryParams: { status: 'Open' } });
  }

  protected onReportableClick(): void {
    this.router.navigate(['/dashboard', 'incidents'], {
      queryParams: { reportable: 'true', status: 'Open' },
    });
  }

  protected onPeriodChange(value: string): void {
    const period = value as PeriodReportedName;
    this.selectedPeriod.set(period);
    void this.store.setPeriod(period);
  }

  protected onSelectIncident(incident: unknown): void {
    this.selectedIncident.set(incident as IncidentSimpleSummaryModel);
  }

  protected closeDetail(): void {
    this.selectedIncident.set(null);
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
