/**
 * Type definitions for the subset of the Notify Public API we consume.
 * Source: https://developer.notifytechnology.com/swagger (notify-swagger-1.0.12.json)
 */

/** Base URL of the Notify production API. The interceptor matches requests by this prefix. */
export const NOTIFY_BASE_URL = 'https://api.notifytechnology.com/v1';

/** Header the API expects the key in. */
export const NOTIFY_API_KEY_HEADER = 'X-API-KEY';

/** Human-readable incident priority (severity) names returned in `priorityName`. */
export type IncidentPriorityName = 'NotSet' | 'Low' | 'Medium' | 'High';

/** Status filter values accepted by the `Status` query parameter. */
export type IncidentFilterStatus =
  | 'Created'
  | 'Open'
  | 'Closed'
  | 'Cancelled'
  | 'Investigation'
  | 'IncidentsWithOutstandingActions';

/** Reporting period values accepted by the `PeriodReported` query parameter. */
export type PeriodReportedName =
  | 'All'
  | 'Last7Days'
  | 'Last30Days'
  | 'Last90Days'
  | 'ThisMonth'
  | 'LastCalendarMonth'
  | 'LastQuarter'
  | 'ThisCalendarYear'
  | 'LastCalendarYear'
  | 'ThisFinancialYear'
  | 'LastFinancialYear'
  | 'Rolling12Months';

/** One incident type bucket within the statistics summary. */
export interface IncidentStatisticsSummaryModel {
  incidentType: string | null;
  total: number;
  percentage: number;
}

/** Response shape of `GET /Incidents/Statistics`. */
export interface IncidentStatisticsModel {
  total: number;
  summary: IncidentStatisticsSummaryModel[] | null;
  highPriorityTotal: number;
  lostTimeTotal: number;
  reportableTotal: number;
  excludedTotal: number;
}

/** Incident type descriptor embedded in summary rows. */
export interface IncidentTypeModel {
  name: string | null;
  description: string | null;
}

/** Single row of `GET /Incidents/SimpleSummary` (only the fields the dashboard uses). */
export interface IncidentSimpleSummaryModel {
  id: string;
  incidentNumber: number;
  priorityName: string | null;
  statusName: string | null;
  isReportable: boolean;
  isLostTime: boolean;
  reportDateTime: string;
  incidentCategory: string | null;
  assignedToFullName: string | null;
  incidentType: IncidentTypeModel | null;
}
