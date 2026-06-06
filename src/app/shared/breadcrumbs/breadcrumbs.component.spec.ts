import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { BreadcrumbItem, BreadcrumbsComponent } from './breadcrumbs.component';

function textContentOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

@Component({
  standalone: true,
  imports: [BreadcrumbsComponent],
  template: `
    <app-breadcrumbs
      [items]="items()"
      [showHome]="showHome()"
      [homeLabel]="homeLabel()"
      [homeUrl]="homeUrl()"
      [autoFromRouter]="autoFromRouter()"
    />
  `,
})
class HostComponent {
  readonly items = signal<BreadcrumbItem[] | null>(null);
  readonly showHome = signal(false);
  readonly homeLabel = signal('Home');
  readonly homeUrl = signal('/');
  readonly autoFromRouter = signal(true);
}

@Component({ selector: 'app-test-shell', standalone: true, template: '<p>Shell</p>' })
class ShellComponent {
  readonly marker = true;
}

@Component({ selector: 'app-test-users', standalone: true, template: '<p>Users</p>' })
class UsersComponent {
  readonly marker = true;
}

@Component({ selector: 'app-test-user-detail', standalone: true, template: '<p>Detail</p>' })
class UserDetailComponent {
  readonly marker = true;
}

describe('BreadcrumbsComponent', () => {
  async function createFixture(): Promise<ComponentFixture<HostComponent>> {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {
            path: '',
            component: ShellComponent,
            children: [
              { path: 'users', component: UsersComponent, data: { breadcrumb: 'Users' } },
              {
                path: 'users/:id',
                component: UserDetailComponent,
                data: { breadcrumb: 'User Detail' },
              },
              { path: 'audit-log', component: UsersComponent },
            ],
          },
        ]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders manual items when provided', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.items.set([
      { label: 'Reports', url: '/reports' },
      { label: 'Detail', url: '/reports/1' },
    ]);
    fixture.componentInstance.autoFromRouter.set(false);
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.crumbs__item') as NodeListOf<Element>,
    ).map((n) => textContentOf(n));

    expect(labels[0]).toContain('Reports');
    expect(labels[1]).toContain('Detail');
  });

  it('can prepend home when showHome is true', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.items.set([{ label: 'Reports', url: '/reports' }]);
    fixture.componentInstance.autoFromRouter.set(false);
    fixture.componentInstance.showHome.set(true);
    fixture.detectChanges();

    const first = fixture.nativeElement.querySelector('.crumbs__item');
    expect(textContentOf(first)).toContain('Home');
  });

  it('renders router-derived breadcrumbs from route data', async () => {
    const fixture = await createFixture();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/users/42');
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.crumbs__item') as NodeListOf<Element>,
    ).map((n) => textContentOf(n));

    expect(labels).toEqual(expect.arrayContaining(['User Detail']));
  });

  it('falls back to titleized URL segment when breadcrumb data is missing', async () => {
    const fixture = await createFixture();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/audit-log');
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.crumbs__item') as NodeListOf<Element>,
    ).map((n) => textContentOf(n));

    expect(labels).toEqual(expect.arrayContaining(['Audit Log']));
  });

  it('renders only non-final items as links', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.items.set([
      { label: 'Reports', url: '/reports' },
      { label: 'Detail', url: '/reports/1' },
    ]);
    fixture.componentInstance.autoFromRouter.set(false);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a.crumbs__link');
    const current = fixture.nativeElement.querySelector('[aria-current="page"]');

    expect(links.length).toBe(1); // Reports only
    expect(textContentOf(current)).toBe('Detail');
  });
});
