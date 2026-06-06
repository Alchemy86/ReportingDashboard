import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreadcrumbsComponent } from '@shared/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('reporting-dashboard');
}
