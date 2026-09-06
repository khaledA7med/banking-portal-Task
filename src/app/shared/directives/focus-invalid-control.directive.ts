import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: 'form[appFocusInvalidControl]',
})
export class FocusInvalidControlDirective {
  private readonly elementRef = inject<ElementRef<HTMLFormElement>>(ElementRef);

  @HostListener('submit')
  focusFirstInvalidControl(): void {
    const invalidControl = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '.ng-invalid[formControlName]',
    );

    invalidControl?.focus();
  }
}
