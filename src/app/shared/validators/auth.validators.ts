import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const emailValidators: ValidatorFn[] = [Validators.required, Validators.email];

export const passwordValidators: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(6),
  noWhitespaceValidator(),
];

// Prevents blank passwords that technically pass a min-length check with spaces.
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    return control.value.trim().length === 0 ? { whitespace: true } : null;
  };
}
