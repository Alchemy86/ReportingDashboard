import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DashboardStore } from '@core/dashboard.store';
import { DataTableComponent } from '@shared/data-table/data-table.component';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TableConfig,
} from '@shared/data-table/data-table.types';
import { ModalComponent } from '@shared/modal/modal.component';

interface Report {
  id: number;
  name: string;
  owner: string;
  status: 'Active' | 'Draft' | 'Archived';
  createdAt: string;
  records: number;
}

const STATUS_CLASSES: Record<Report['status'], string> = {
  Active: 'dt-badge dt-badge--green',
  Draft: 'dt-badge dt-badge--amber',
  Archived: 'dt-badge dt-badge--slate',
};

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [DataTableComponent, ModalComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly store = inject(DashboardStore);

  protected readonly isReportModalOpen = signal(false);
  protected readonly selectedReport = signal<Report | null>(null);

  protected readonly reports = signal<Report[]>([
    {
      id: 1,
      name: 'Q1 Sales Summary',
      owner: 'Alice Martin',
      status: 'Active',
      createdAt: '2026-01-15',
      records: 1240,
    },
    {
      id: 2,
      name: 'Customer Churn Analysis',
      owner: 'Bob Chen',
      status: 'Active',
      createdAt: '2026-02-03',
      records: 540,
    },
    {
      id: 3,
      name: 'Inventory Forecast',
      owner: 'Carol Davis',
      status: 'Draft',
      createdAt: '2026-02-18',
      records: 88,
    },
    {
      id: 4,
      name: 'HR Headcount FY26',
      owner: 'David Kim',
      status: 'Active',
      createdAt: '2026-03-01',
      records: 312,
    },
    {
      id: 5,
      name: 'NPS Tracker',
      owner: 'Eve Lopez',
      status: 'Archived',
      createdAt: '2025-11-20',
      records: 2010,
    },
    {
      id: 6,
      name: 'Support Ticket Volume',
      owner: 'Frank Nguyen',
      status: 'Active',
      createdAt: '2026-03-22',
      records: 760,
    },
    {
      id: 7,
      name: 'Regional Revenue',
      owner: 'Grace Park',
      status: 'Draft',
      createdAt: '2026-04-01',
      records: 430,
    },
    {
      id: 8,
      name: 'Product Usage Metrics',
      owner: 'Henry Adams',
      status: 'Active',
      createdAt: '2026-04-10',
      records: 5300,
    },
    {
      id: 9,
      name: 'Marketing ROI',
      owner: 'Iris Brown',
      status: 'Active',
      createdAt: '2026-04-25',
      records: 198,
    },
    {
      id: 10,
      name: 'Payroll Audit FY25',
      owner: 'Jack Wilson',
      status: 'Archived',
      createdAt: '2025-09-30',
      records: 120,
    },
    {
      id: 11,
      name: 'Cloud Cost Report',
      owner: 'Alice Martin',
      status: 'Active',
      createdAt: '2026-05-02',
      records: 67,
    },
    {
      id: 12,
      name: 'Security Incidents',
      owner: 'Carol Davis',
      status: 'Draft',
      createdAt: '2026-05-14',
      records: 14,
    },
  ]);

  protected readonly columns: TableColumn<Report>[] = [
    { key: 'id', title: '#', sortable: true, width: '60px', align: 'center' },
    { key: 'name', title: 'Report', sortable: true },
    { key: 'owner', title: 'Owner', sortable: true },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (val: Report['status']) => `<span class="${STATUS_CLASSES[val]}">${val}</span>`,
    },
    { key: 'createdAt', title: 'Created', sortable: true },
    {
      key: 'records',
      title: 'Records',
      sortable: true,
      align: 'right',
      render: (val: number) => val.toLocaleString(),
    },
  ];

  protected readonly actions: TableAction<Report>[] = [
    {
      id: 'view',
      label: 'View',
      imageSrc: '/icons/eye.svg',
      className: 'dt-action-btn',
    },
    {
      id: 'delete',
      label: 'Delete',
      imageSrc: '/icons/trash.svg',
      className: 'dt-action-btn dt-action-btn--danger',
      show: (row) => row.status !== 'Active',
    },
  ];

  protected readonly tableConfig: TableConfig = {
    pageSize: 5,
    pageSizeOptions: [5, 10, 25],
    searchPlaceholder: 'Search reports…',
  };

  protected readonly statusClass: Record<Report['status'], string> = {
    Active: 'modal-badge modal-badge--green',
    Draft: 'modal-badge modal-badge--amber',
    Archived: 'modal-badge modal-badge--slate',
  };

  protected onTableAction(event: TableActionEvent): void {
    if (event.actionId === 'view') {
      this.selectedReport.set(event.row as Report);
      this.isReportModalOpen.set(true);
    }
  }

  protected closeReportModal(): void {
    this.isReportModalOpen.set(false);
  }
}
