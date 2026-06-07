import { Routes } from '@angular/router';
import { authTokenGuard } from '@core/notify/auth-token.guard';
import { ConnectPageComponent } from './pages/connect/connect-page.component';
import { DashboardHomeComponent } from './pages/dashboard/dashboard-home.component';
import { DashboardLayoutComponent } from './pages/dashboard/dashboard-layout.component';
import { IncidentsPageComponent } from './pages/incidents/incidents-page.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authTokenGuard],
    children: [
      {
        path: '',
        component: DashboardHomeComponent,
        data: {
          breadcrumb: 'Dashboard',
        },
      },
      {
        path: 'incidents',
        component: IncidentsPageComponent,
        data: {
          breadcrumb: 'Incidents',
        },
      },
    ],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'connect',
    component: ConnectPageComponent,
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
