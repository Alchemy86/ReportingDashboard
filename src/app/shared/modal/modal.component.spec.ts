import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ModalComponent } from './modal.component';

// ── jsdom shims ───────────────────────────────────────────────────────────────
// jsdom doesn't implement showModal / close on HTMLDialogElement.
// We shim them so we can test behaviour without a real browser.
function shimDialog(): void {
  if (!HTMLDialogElement.prototype.showModal) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      writable: true,
      value: function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
        this.dispatchEvent(new Event('open'));
      },
    });
  }
  if (!HTMLDialogElement.prototype.close) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      writable: true,
      value: function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      },
    });
  }
}

// ── Host helpers ──────────────────────────────────────────────────────────────

/** Wrapper that owns the `isOpen` signal so we can change it between tests. */
@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen()" [title]="title()" (closed)="onClosed()">
      <p id="body-content">Modal body</p>
      <div modal-footer><button id="footer-btn">OK</button></div>
    </app-modal>
  `,
})
class TestHostComponent {
  isOpen = signal(false);
  title = signal('Test Title');
  closedCount = 0;
  onClosed(): void {
    this.closedCount++;
    this.isOpen.set(false);
  }
}

async function createHost() {
  shimDialog();
  await TestBed.configureTestingModule({
    imports: [TestHostComponent],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
  return fixture;
}

function dialog(fixture: ComponentFixture<TestHostComponent>): HTMLDialogElement {
  return fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ModalComponent', () => {
  // ── Initial render ─────────────────────────────────────────────────────────

  describe('Initial render', () => {
    it('renders a <dialog> element', async () => {
      const fixture = await createHost();
      expect(dialog(fixture)).not.toBeNull();
    });

    it('is closed by default (no open attribute)', async () => {
      const fixture = await createHost();
      expect(dialog(fixture).hasAttribute('open')).toBe(false);
    });

    it('projects body content via ng-content', async () => {
      const fixture = await createHost();
      const body = fixture.nativeElement.querySelector('#body-content') as HTMLElement;
      expect(body).not.toBeNull();
      expect(body.textContent?.trim()).toBe('Modal body');
    });

    it('projects footer content via the modal-footer slot', async () => {
      const fixture = await createHost();
      const footerBtn = fixture.nativeElement.querySelector('#footer-btn') as HTMLElement;
      expect(footerBtn).not.toBeNull();
    });
  });

  // ── Open / close via isOpen input ──────────────────────────────────────────

  describe('isOpen signal', () => {
    it('calls showModal() when isOpen becomes true', async () => {
      const fixture = await createHost();
      const dlg = dialog(fixture);
      const spy = vi.spyOn(dlg, 'showModal');

      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledOnce();
      expect(dlg.hasAttribute('open')).toBe(true);
    });

    it('calls close() when isOpen becomes false after being open', async () => {
      const fixture = await createHost();
      const dlg = dialog(fixture);

      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const spy = vi.spyOn(dlg, 'close');
      fixture.componentInstance.isOpen.set(false);
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledOnce();
      expect(dlg.hasAttribute('open')).toBe(false);
    });

    it('does not call showModal() again when already open', async () => {
      const fixture = await createHost();
      const dlg = dialog(fixture);

      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const spy = vi.spyOn(dlg, 'showModal');
      fixture.componentInstance.isOpen.set(true); // set same value
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── Title ──────────────────────────────────────────────────────────────────

  describe('title input', () => {
    it('renders the title in the header', async () => {
      const fixture = await createHost();
      fixture.componentInstance.title.set('My Report');
      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const titleEl = fixture.nativeElement.querySelector('.modal__title') as HTMLElement;
      expect(titleEl.textContent?.trim()).toBe('My Report');
    });

    it('hides the title element when title is empty string', async () => {
      const fixture = await createHost();
      fixture.componentInstance.title.set('');
      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const titleEl = fixture.nativeElement.querySelector('.modal__title');
      expect(titleEl).toBeNull();
    });
  });

  // ── Close button ───────────────────────────────────────────────────────────

  describe('Close button', () => {
    it('renders a close button in the header', async () => {
      const fixture = await createHost();
      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.modal__close') as HTMLButtonElement;
      expect(btn).not.toBeNull();
    });

    it('closes the dialog when the close button is clicked', async () => {
      const fixture = await createHost();
      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.modal__close') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();

      expect(dialog(fixture).hasAttribute('open')).toBe(false);
    });

    it('emits closed output when the close button is clicked', async () => {
      const fixture = await createHost();
      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const before = fixture.componentInstance.closedCount;
      const btn = fixture.nativeElement.querySelector('.modal__close') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.closedCount).toBe(before + 1);
    });
  });

  // ── Native close event (Escape / programmatic) ─────────────────────────────

  describe('Native close event', () => {
    it('emits closed output when the dialog fires its native close event', async () => {
      const fixture = await createHost();
      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const dlg = dialog(fixture);
      const before = fixture.componentInstance.closedCount;

      // Simulate Escape key / external close
      dlg.dispatchEvent(new Event('close'));
      fixture.detectChanges();

      expect(fixture.componentInstance.closedCount).toBeGreaterThan(before);
    });
  });

  // ── Backdrop click ─────────────────────────────────────────────────────────

  describe('Backdrop click', () => {
    it('closes the dialog when the backdrop (dialog element itself) is clicked', async () => {
      const fixture = await createHost();
      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const dlg = dialog(fixture);
      const spy = vi.spyOn(dlg, 'close');

      // Simulate a click whose target IS the dialog (backdrop area)
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: dlg });
      dlg.dispatchEvent(event);
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
    });

    it('does NOT close when clicking inside the panel', async () => {
      const fixture = await createHost();
      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      const dlg = dialog(fixture);
      const panel = fixture.nativeElement.querySelector('.modal__panel') as HTMLElement;
      const spy = vi.spyOn(dlg, 'close');

      // Target is the inner panel, not the dialog backdrop
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: panel });
      dlg.dispatchEvent(event);
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('the close button has an aria-label', async () => {
      const fixture = await createHost();
      const btn = fixture.nativeElement.querySelector('.modal__close') as HTMLButtonElement;
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });

    it('the inner panel has role="document"', async () => {
      const fixture = await createHost();
      const panel = fixture.nativeElement.querySelector('.modal__panel') as HTMLElement;
      expect(panel.getAttribute('role')).toBe('document');
    });
  });
});
