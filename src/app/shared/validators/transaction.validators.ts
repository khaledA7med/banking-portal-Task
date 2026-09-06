import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const MAX_TRANSACTION_AMOUNT = 100000;

// Amount must be present and greater than zero.
export function positiveAmountValidator(): ValidatorFn {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const value = control.value;

    return value !== null && value > 0 ? null : { positiveAmount: true };
  };
}

// Enforces the business maximum from the task brief.
export function maxTransactionAmountValidator(): ValidatorFn {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const value = control.value;

    return value === null || value <= MAX_TRANSACTION_AMOUNT
      ? null
      : { maxTransactionAmount: true };
  };
}

// Allows cents while rejecting values with more than two decimal places.
export function twoDecimalPlacesValidator(): ValidatorFn {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const value = control.value;

    return value === null || Number.isInteger(value * 100) ? null : { twoDecimalPlaces: true };
  };
}

// Uses end-of-day so today's transactions remain valid all day.
export function notFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl<Date | null>): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return control.value <= today ? null : { futureDate: true };
  };
}

// Cross-field rule: only debit transactions are limited by the selected balance.
export function debitWithinBalanceValidator(getBalance: () => number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const type = control.get('type')?.value;
    const amount = control.get('amount')?.value;

    if (type !== 'Debit' || typeof amount !== 'number') {
      return null;
    }

    return amount <= getBalance() ? null : { debitExceedsBalance: true };
  };
}
