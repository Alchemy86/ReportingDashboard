import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, startWith } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  disabled?: boolean;
}

type BreadcrumbResolver =
  | string
  | ((data: Record<string, unknown>, route: ActivatedRouteSnapshot) => string | null | undefined);

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  readonly items = input<BreadcrumbItem[] | null>(null);
  readonly showHome = input(false);
  readonly homeLabel = input('Home');
  readonly homeUrl = input('/');
  readonly autoFromRouter = input(true);

  private readonly router = inject(Router);

  private readonly navEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
    ),
    { initialValue: null },
  );

  protected readonly breadcrumbs = computed(() => {
    this.navEnd();

    const inputItems = this.items();
    const source =
      inputItems && inputItems.length > 0
        ? inputItems
        : this.autoFromRouter()
          ? this.buildFromRouter(this.router.routerState.snapshot.root)
          : [];

    const clean = source.filter((item) => !!item?.label?.trim());

    if (!this.showHome()) {
      return clean;
    }

    const first = clean[0];
    const shouldAddHome = !first || first.label !== this.homeLabel();
    if (!shouldAddHome) {
      return clean;
    }

    return [{ label: this.homeLabel(), url: this.homeUrl() }, ...clean];
  });

  protected isLink(item: BreadcrumbItem, isLast: boolean): boolean {
    return !!item.url && !item.disabled && !isLast;
  }

  private buildFromRouter(root: ActivatedRouteSnapshot): BreadcrumbItem[] {
    const out: BreadcrumbItem[] = [];
    this.walkRoute(root, [], out);
    return out;
  }

  private walkRoute(
    route: ActivatedRouteSnapshot | null,
    parentSegments: string[],
    out: BreadcrumbItem[],
  ): void {
    if (!route) return;

    const ownSegments = route.url.map((u) => u.path).filter(Boolean);
    const segments = [...parentSegments, ...ownSegments];

    const label = this.resolveBreadcrumbLabel(route);
    if (label) {
      const url = '/' + segments.join('/');
      if (!out.some((item) => item.label === label && item.url === (url || '/'))) {
        out.push({ label, url: url || '/' });
      }
    } else if (ownSegments.length) {
      const url = '/' + segments.join('/');
      const fallbackLabel = this.titleize(ownSegments[ownSegments.length - 1]);
      if (!out.some((item) => item.label === fallbackLabel && item.url === url)) {
        out.push({ label: fallbackLabel, url });
      }
    }

    this.walkRoute(route.firstChild, segments, out);
  }

  private resolveBreadcrumbLabel(route: ActivatedRouteSnapshot): string | null {
    const raw = route.data?.['breadcrumb'] as BreadcrumbResolver | undefined;

    if (typeof raw === 'function') {
      const value = raw(route.data ?? {}, route);
      return typeof value === 'string' && value.trim() ? value.trim() : null;
    }

    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }

    return null;
  }

  private titleize(value: string): string {
    return value
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }
}
