import { FormControl, FormGroup } from '@angular/forms';
import {
  debitWithinBalanceValidator,
  maxTransactionAmountValidator,
  notFutureDateValidator,
  positiveAmountValidator,
  twoDecimalPlacesValidator,
} from './transaction.validators';

describe('transaction validators', () => {
  it('rejects debit amounts greater than the account balance', () => {
    const form = new FormGroup(
      {
        amount: new FormControl(200),
        type: new FormControl('Debit'),
      },
      { validators: [debitWithinBalanceValidator(() => 100)] },
    );

    expect(form.hasError('debitExceedsBalance')).toBe(true);
  });

  it('allows credits greater than the account balance', () => {
    const form = new FormGroup(
      {
        amount: new FormControl(200),
        type: new FormControl('Credit'),
      },
      { validators: [debitWithinBalanceValidator(() => 100)] },
    );

    expect(form.valid).toBe(true);
  });

  it('validates amount limits and date values', () => {
    expect(positiveAmountValidator()(new FormControl(0))).toEqual({ positiveAmount: true });
    expect(twoDecimalPlacesValidator()(new FormControl(10.123))).toEqual({
      twoDecimalPlaces: true,
    });
    expect(maxTransactionAmountValidator()(new FormControl(100001))).toEqual({
      maxTransactionAmount: true,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(notFutureDateValidator()(new FormControl(tomorrow))).toEqual({ futureDate: true });
  });
});
