import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, expand, map, reduce } from 'rxjs';

import {
  IncidentFilterStatus,
  IncidentSimpleSummaryModel,
  IncidentStatisticsModel,
  NOTIFY_BASE_URL,
  PeriodReportedName,
} from './notify.models';

/** Max rows per page accepted by the API. */
const PAGE_SIZE = 200;
/** Safety cap so a large dataset can't trigger an unbounded paging loop. */
const MAX_PAGES = 5;

/**
 * Thin wrapper around the Notify incident endpoints. The API key is added by
 * {@link apiKeyInterceptor}, so this service stays auth-agnostic.
 */
@Injectable({ providedIn: 'root' })
export class NotifyApiService {
  private readonly http = inject(HttpClient);

  /** Incident statistics for a reporting period (defaults to the last 90 days). */
  getStatistics(period: PeriodReportedName = 'Last90Days'): Observable<IncidentStatisticsModel> {
    const params = new HttpParams().set('PeriodReported', period);
    return this.http.get<IncidentStatisticsModel>(`${NOTIFY_BASE_URL}/Incidents/Statistics`, {
      params,
    });
  }

  /**
   * All currently-open incidents (summary form) for a reporting period,
   * paged transparently up to {@link MAX_PAGES} pages and concatenated into
   * a single array.
   */
  getOpenIncidents(
    period: PeriodReportedName = 'Last90Days',
  ): Observable<IncidentSimpleSummaryModel[]> {
    return this.getIncidents({ status: 'Open', period });
  }

  /**
   * Fetch incidents with optional filters, paged transparently up to
   * {@link MAX_PAGES} pages and concatenated into a single array.
   */
  getIncidents(filters?: {
    status?: IncidentFilterStatus;
    type?: string;
    priority?: string;
    period?: PeriodReportedName;
  }): Observable<IncidentSimpleSummaryModel[]> {
    let params = new HttpParams().set('PageSize', PAGE_SIZE);

    if (filters?.status) {
      params = params.set('Status', filters.status);
    }
    if (filters?.period) {
      params = params.set('PeriodReported', filters.period);
    }

    return this.fetchPage(1, params).pipe(
      expand((page, index) =>
        page.length === PAGE_SIZE && index + 1 < MAX_PAGES ? this.fetchPage(index + 2, params) : [],
      ),
      reduce((all, page) => all.concat(page), [] as IncidentSimpleSummaryModel[]),
    );
  }

  private fetchPage(
    pageNumber: number,
    params: HttpParams,
  ): Observable<IncidentSimpleSummaryModel[]> {
    const pageParams = params.set('PageNumber', pageNumber);
    return this.http
      .get<{
        data: IncidentSimpleSummaryModel[];
      }>(`${NOTIFY_BASE_URL}/Incidents/SimpleSummary`, { params: pageParams })
      .pipe(map((response) => response?.data ?? []));
  }
}
