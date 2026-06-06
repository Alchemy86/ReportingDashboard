import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { DataTableComponent } from './data-table.component';
import { TableAction, TableColumn, TableConfig } from './data-table.types';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  role: string;
  active: boolean;
}

const USERS: User[] = [
  { id: 1, name: 'Alice', role: 'Admin', active: true },
  { id: 2, name: 'Bob', role: 'Editor', active: false },
  { id: 3, name: 'Carol', role: 'Viewer', active: true },
  { id: 4, name: 'Dave', role: 'Editor', active: true },
  { id: 5, name: 'Eve', role: 'Admin', active: false },
];

const COLUMNS: TableColumn<User>[] = [
  { key: 'id', title: '#', sortable: true, align: 'center' },
  { key: 'name', title: 'Name', sortable: true },
  { key: 'role', title: 'Role', sortable: false },
];

const ACTIONS: TableAction<User>[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete', show: (row) => !row.active },
];

async function createFixture(
  data: User[] = USERS,
  columns: TableColumn<User>[] = COLUMNS,
  actions: TableAction<User>[] = [],
  config: TableConfig = {},
) {
  await TestBed.configureTestingModule({
    imports: [DataTableComponent],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(DataTableComponent);
  const component = fixture.componentRef;
  component.setInput('data', data);
  component.setInput('columns', columns);
  component.setInput('actions', actions);
  component.setInput('config', config);
  fixture.detectChanges();
  return fixture;
}

function query(fixture: ComponentFixture<DataTableComponent>, sel: string) {
  return fixture.nativeElement.querySelector(sel) as HTMLElement | null;
}

function queryAll(fixture: ComponentFixture<DataTableComponent>, sel: string) {
  return Array.from(fixture.nativeElement.querySelectorAll(sel)) as HTMLElement[];
}

interface DataTableTestApi {
  _searchRaw: { set(value: string): void };
  currentPage: () => number;
  sortState: () => unknown;
  rowKey: () => string;
}

function getApi(fixture: ComponentFixture<DataTableComponent>): DataTableTestApi {
  return fixture.componentInstance as unknown as DataTableTestApi;
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe('DataTableComponent', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the correct number of header cells', async () => {
      const fixture = await createFixture();
      const headers = queryAll(fixture, 'th.dt-th');
      expect(headers.length).toBe(COLUMNS.length);
    });

    it('renders column titles in the header', async () => {
      const fixture = await createFixture();
      const headers = queryAll(fixture, 'th.dt-th');
      expect(headers[0].textContent?.trim()).toContain('#');
      expect(headers[1].textContent?.trim()).toContain('Name');
      expect(headers[2].textContent?.trim()).toContain('Role');
    });

    it('adds an Actions column when actions are provided', async () => {
      const fixture = await createFixture(USERS, COLUMNS, ACTIONS);
      const headers = queryAll(fixture, 'th.dt-th');
      const last = headers.at(-1);
      expect(last).toBeDefined();
      expect(headers.length).toBe(COLUMNS.length + 1);
      expect(last?.textContent?.trim()).toBe('Actions');
    });

    it('does NOT add an Actions column when no actions are provided', async () => {
      const fixture = await createFixture(USERS, COLUMNS, []);
      const headers = queryAll(fixture, 'th.dt-th');
      expect(headers.length).toBe(COLUMNS.length);
    });

    it('shows the empty message when data is empty', async () => {
      const fixture = await createFixture([], COLUMNS, [], { emptyMessage: 'Nothing here.' });
      const empty = query(fixture, '.dt-empty');
      expect(empty).not.toBeNull();
      expect(empty?.textContent?.trim()).toBe('Nothing here.');
    });

    it('uses the default empty message when none is configured', async () => {
      const fixture = await createFixture([]);
      const empty = query(fixture, '.dt-empty');
      expect(empty?.textContent?.trim()).toBe('No records found.');
    });
  });

  // ── Pagination ─────────────────────────────────────────────────────────────

  describe('Pagination', () => {
    it('respects the pageSize config and shows only that many rows', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 2 });
      const rows = queryAll(fixture, 'tr.dt-row');
      expect(rows.length).toBe(2);
    });

    it('shows all rows when pageSize >= data length', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 50 });
      const rows = queryAll(fixture, 'tr.dt-row');
      expect(rows.length).toBe(USERS.length);
    });

    it('displays the correct row range in the footer info', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 2 });
      const info = query(fixture, '.dt-footer__info');
      expect(info?.textContent).toContain('1');
      expect(info?.textContent).toContain('2');
      expect(info?.textContent).toContain(String(USERS.length));
    });

    it('advances page when next button is clicked', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 2 });
      const nextBtn = query(fixture, 'button[aria-label="Next page"]') as HTMLButtonElement;
      nextBtn.click();
      fixture.detectChanges();
      const rows = queryAll(fixture, 'tr.dt-row');
      // page 2 → rows 3 & 4
      expect(rows[0].textContent).toContain('Carol');
    });

    it('disables the first/prev buttons on page 1', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 3 });
      const firstBtn = query(fixture, 'button[aria-label="First page"]') as HTMLButtonElement;
      const prevBtn = query(fixture, 'button[aria-label="Previous page"]') as HTMLButtonElement;
      expect(firstBtn.disabled).toBe(true);
      expect(prevBtn.disabled).toBe(true);
    });

    it('disables the last/next buttons on the last page', async () => {
      // pageSize === data.length means we are already on the last page
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 50 });
      const lastBtn = query(fixture, 'button[aria-label="Last page"]') as HTMLButtonElement;
      const nextBtn = query(fixture, 'button[aria-label="Next page"]') as HTMLButtonElement;
      expect(lastBtn.disabled).toBe(true);
      expect(nextBtn.disabled).toBe(true);
    });

    it('renders the pageSizeOptions in the select', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSizeOptions: [3, 6, 9] });
      const options = queryAll(fixture, '.dt-page-size__select option');
      expect(options.map((o) => Number((o as HTMLOptionElement).value))).toEqual([3, 6, 9]);
    });

    it('changes page size when the select changes', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], {
        pageSize: 2,
        pageSizeOptions: [2, 5],
      });
      const select = query(fixture, '.dt-page-size__select') as HTMLSelectElement;
      select.value = '5';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      const rows = queryAll(fixture, 'tr.dt-row');
      expect(rows.length).toBe(USERS.length);
    });
  });

  // ── Search ─────────────────────────────────────────────────────────────────

  describe('Search', () => {
    it('hides the search bar when hideSearch is true', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { hideSearch: true });
      expect(query(fixture, '.dt-search')).toBeNull();
    });

    it('shows the search bar by default', async () => {
      const fixture = await createFixture();
      expect(query(fixture, '.dt-search')).not.toBeNull();
    });

    it('uses the configured search placeholder', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { searchPlaceholder: 'Find…' });
      const input = query(fixture, '.dt-search__input') as HTMLInputElement;
      expect(input.placeholder).toBe('Find…');
    });

    it('filters rows by search query (case-insensitive)', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 50 });
      const component = getApi(fixture);
      // Bypass debounce by setting the signal directly
      component['_searchRaw'].set('alice');
      // Force the toSignal to update synchronously by calling tick
      fixture.detectChanges();
      await new Promise((r) => setTimeout(r, 300)); // wait for debounce
      fixture.detectChanges();
      const rows = queryAll(fixture, 'tr.dt-row');
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('Alice');
    });

    it('resets to page 1 when a new search is applied', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 2 });
      // Go to page 2 first
      const nextBtn = query(fixture, 'button[aria-label="Next page"]') as HTMLButtonElement;
      nextBtn.click();
      fixture.detectChanges();
      expect(getApi(fixture).currentPage()).toBe(2);

      // Now apply a search
      const component = getApi(fixture);
      component['_searchRaw'].set('alice');
      fixture.detectChanges();
      await new Promise((r) => setTimeout(r, 300));
      fixture.detectChanges();
      expect(getApi(fixture).currentPage()).toBe(1);
    });
  });

  // ── Sorting ────────────────────────────────────────────────────────────────

  describe('Sorting', () => {
    it('sorts ascending on first click of a sortable column', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 50 });
      const nameHeader = queryAll(fixture, 'th.dt-th')[1]; // 'Name' column
      nameHeader.click();
      fixture.detectChanges();
      const rows = queryAll(fixture, 'tr.dt-row');
      // Alice < Bob < Carol < Dave < Eve
      expect(rows[0].textContent).toContain('Alice');
      const last = rows.at(-1);
      expect(last).toBeDefined();
      expect(last?.textContent).toContain('Eve');
    });

    it('sorts descending on second click', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 50 });
      const nameHeader = queryAll(fixture, 'th.dt-th')[1];
      nameHeader.click();
      fixture.detectChanges();
      nameHeader.click();
      fixture.detectChanges();
      const rows = queryAll(fixture, 'tr.dt-row');
      expect(rows[0].textContent).toContain('Eve');
      const last = rows.at(-1);
      expect(last).toBeDefined();
      expect(last?.textContent).toContain('Alice');
    });

    it('clears sort on third click', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 50 });
      const nameHeader = queryAll(fixture, 'th.dt-th')[1];
      nameHeader.click();
      fixture.detectChanges();
      nameHeader.click();
      fixture.detectChanges();
      nameHeader.click();
      fixture.detectChanges();
      expect(getApi(fixture).sortState()).toBeNull();
    });

    it('does not sort when clicking a non-sortable column', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 50 });
      const roleHeader = queryAll(fixture, 'th.dt-th')[2]; // Role — sortable: false
      roleHeader.click();
      fixture.detectChanges();
      expect(getApi(fixture).sortState()).toBeNull();
    });

    it('applies the correct aria classes to sorted headers', async () => {
      const fixture = await createFixture(USERS, COLUMNS, [], { pageSize: 50 });
      const nameHeader = queryAll(fixture, 'th.dt-th')[1];
      nameHeader.click();
      fixture.detectChanges();
      expect(nameHeader.classList.contains('dt-th--sorted-asc')).toBe(true);
      expect(nameHeader.classList.contains('dt-th--sorted-desc')).toBe(false);
      nameHeader.click();
      fixture.detectChanges();
      expect(nameHeader.classList.contains('dt-th--sorted-asc')).toBe(false);
      expect(nameHeader.classList.contains('dt-th--sorted-desc')).toBe(true);
    });
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  describe('Actions', () => {
    it('emits actionEvent with the correct actionId and row', async () => {
      const fixture = await createFixture(USERS, COLUMNS, ACTIONS, { pageSize: 50 });
      const spy = vi.fn();
      fixture.componentInstance.actionEvent.subscribe(spy);

      const editBtns = queryAll(fixture, 'button[title="Edit"]');
      editBtns[0].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith({ actionId: 'edit', row: USERS[0] });
    });

    it('hides action buttons when show returns false', async () => {
      // 'Delete' is hidden for active users; active users: Alice, Carol, Dave (ids 1,3,4)
      const fixture = await createFixture(USERS, COLUMNS, ACTIONS, { pageSize: 50 });
      const deleteBtns = queryAll(fixture, 'button[title="Delete"]');
      // Only inactive users (Bob id=2, Eve id=5) should have Delete
      expect(deleteBtns.length).toBe(2);
    });

    it('always shows actions with show: undefined', async () => {
      const fixture = await createFixture(USERS, COLUMNS, ACTIONS, { pageSize: 50 });
      const editBtns = queryAll(fixture, 'button[title="Edit"]');
      expect(editBtns.length).toBe(USERS.length);
    });

    it('renders image-based actions with tooltip labels', async () => {
      const imageActions: TableAction<User>[] = [
        { id: 'view', label: 'View details', imageSrc: '/icons/eye.svg' },
      ];
      const fixture = await createFixture(USERS, COLUMNS, imageActions, { pageSize: 50 });
      const btn = query(fixture, 'button[title="View details"]');
      const img = query(fixture, '.dt-action-btn__img') as HTMLImageElement;

      expect(btn).not.toBeNull();
      expect(btn?.getAttribute('aria-label')).toBe('View details');
      expect(img).not.toBeNull();
      expect(img.getAttribute('src')).toContain('/icons/eye.svg');
    });
  });

  // ── Custom column render ───────────────────────────────────────────────────

  describe('Column render function', () => {
    it('uses the render function output as cell innerHTML', async () => {
      const columnsWithRender: TableColumn<User>[] = [
        ...COLUMNS,
        {
          key: 'active',
          title: 'Active',
          render: (val: boolean) =>
            val ? '<span class="yes">Yes</span>' : '<span class="no">No</span>',
        },
      ];
      const fixture = await createFixture(USERS, columnsWithRender, [], { pageSize: 50 });
      const yesBadges = queryAll(fixture, 'span.yes');
      const noBadges = queryAll(fixture, 'span.no');
      // 3 active users, 2 inactive
      expect(yesBadges.length).toBe(3);
      expect(noBadges.length).toBe(2);
    });
  });

  // ── rowKey ─────────────────────────────────────────────────────────────────

  describe('rowKey input', () => {
    it('uses id as the default rowKey', async () => {
      const fixture = await createFixture();
      expect(getApi(fixture).rowKey()).toBe('id');
    });

    it('accepts a custom rowKey', async () => {
      const fixture = await createFixture();
      fixture.componentRef.setInput('rowKey', 'name');
      fixture.detectChanges();
      expect(getApi(fixture).rowKey()).toBe('name');
    });
  });
});
