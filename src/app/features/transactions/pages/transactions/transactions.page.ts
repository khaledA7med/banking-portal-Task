import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertService } from '../../../../core/alerts/alert.service';
import { Account } from '../../../../core/models/account';
import { Transaction, TransactionType } from '../../../../core/models/transaction';
import { BankingDataService } from '../../../../core/data-access/banking-data.service';
import {
  debitWithinBalanceValidator,
  FocusInvalidControlDirective,
  maxTransactionAmountValidator,
  notFutureDateValidator,
  positiveAmountValidator,
  twoDecimalPlacesValidator,
} from '../../../../shared';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

interface TransactionFilters {
  category: string;
  fromDate: Date | null;
  toDate: Date | null;
  type: TransactionType | '';
}

interface StatementSettings {
  count: number;
  month: string;
}

interface MonthOption {
  label: string;
  value: string;
}

interface MonthlyInsights {
  highestSpendingCategory: string;
  totalCredit: number;
  totalDebit: number;
}

@Component({
  imports: [
    AsyncPipe,
    ButtonModule,
    CardModule,
    CurrencyPipe,
    DatePickerModule,
    DatePipe,
    DialogModule,
    FocusInvalidControlDirective,
    InputNumberModule,
    InputTextModule,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    TableModule,
    TagModule,
  ],
  selector: 'app-transactions-page',
  templateUrl: './transactions.page.html',
})
export class TransactionsPage {
  private readonly alertService = inject(AlertService);
  private readonly bankingData = inject(BankingDataService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  // Updated when account data changes so the cross-field debit validator has fresh balance.
  private currentAccountBalance = 0;
  readonly showTransactionDialog = signal(false);

  // The route parameter drives account selection and the rest of the page view model.
  private readonly accountId$ = this.route.paramMap.pipe(
    map((params) => params.get('accountId') ?? ''),
    distinctUntilChanged(),
    tap((accountId) => this.bankingData.selectAccount(accountId)),
  );

  readonly filtersForm = this.formBuilder.nonNullable.group({
    category: [''],
    fromDate: [null as Date | null],
    toDate: [null as Date | null],
    type: ['' as TransactionType | ''],
  });

  readonly statementForm = this.formBuilder.nonNullable.group({
    count: [3],
    month: [''],
  });

  // Reactive form only: validators here cover both field rules and balance business rules.
  readonly transactionForm = this.formBuilder.nonNullable.group(
    {
      amount: [null as number | null, [
        Validators.required,
        positiveAmountValidator(),
        twoDecimalPlacesValidator(),
        maxTransactionAmountValidator(),
      ]],
      category: ['', Validators.required],
      date: [new Date(), [Validators.required, notFutureDateValidator()]],
      merchant: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      type: ['Debit' as TransactionType, Validators.required],
    },
    {
      validators: [debitWithinBalanceValidator(() => this.currentAccountBalance)],
    },
  );

  // Combines route, data, filters, and mini-statement settings into one template stream.
  readonly vm$ = this.accountId$.pipe(
    switchMap((accountId) =>
      combineLatest({
        account: this.bankingData.getAccount(accountId).pipe(
          tap((account) => {
            this.currentAccountBalance = account?.balance ?? 0;
            this.transactionForm.updateValueAndValidity({ emitEvent: false });
          }),
        ),
        categories: this.bankingData.getTransactionCategories(),
        filters: this.filtersForm.valueChanges.pipe(
          startWith(this.filtersForm.getRawValue()),
          debounceTime(100),
        ),
        statementSettings: this.statementForm.valueChanges.pipe(
          startWith(this.statementForm.getRawValue()),
          debounceTime(100),
        ),
        transactions: this.bankingData.getTransactionsByAccount(accountId),
        types: this.bankingData.getTransactionTypes(),
      }).pipe(
        map((vm) => {
          // Derived values stay in the stream so the template remains display-only.
          const sortedTransactions = this.sortTransactionsByDateDesc(vm.transactions);
          const monthOptions = this.getMonthOptions(vm.transactions);
          const statementSettings = vm.statementSettings as StatementSettings;
          const selectedMonth =
            statementSettings.month || monthOptions.at(0)?.value || '';
          const monthlyTransactions = this.filterTransactionsByMonth(
            vm.transactions,
            selectedMonth,
          );

          return {
            ...vm,
            filteredTransactions: this.sortTransactionsByDateDesc(
              this.filterTransactions(
                vm.transactions,
                vm.filters as TransactionFilters,
              ),
            ),
            miniStatement: sortedTransactions.slice(0, statementSettings.count),
            monthOptions,
            monthlyInsights: this.getMonthlyInsights(monthlyTransactions),
            selectedMonth,
            selectedMonthLabel: selectedMonth
              ? this.formatMonthLabel(selectedMonth)
              : 'All months',
          };
        }),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  get amountInvalid(): boolean {
    return this.isInvalid('amount');
  }

  get categoryInvalid(): boolean {
    return this.isInvalid('category');
  }

  get dateInvalid(): boolean {
    return this.isInvalid('date');
  }

  get merchantInvalid(): boolean {
    return this.isInvalid('merchant');
  }

  submit(account: Account): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    // On success the data service inserts the row and adjusts the balance immediately.
    const formValue = this.transactionForm.getRawValue();
    const date = formValue.date;

    this.bankingData.createTransaction({
      accountId: account.id,
      amount: formValue.amount ?? 0,
      category: formValue.category,
      date: this.formatDate(date),
      merchant: formValue.merchant.trim(),
      type: formValue.type,
    });

    this.transactionForm.reset({
      amount: null,
      category: '',
      date: new Date(),
      merchant: '',
      type: 'Debit',
    });
    this.showTransactionDialog.set(false);

    void this.alertService.success(
      'Transaction Created Successfully',
      'Your transaction has been added to the account and is now visible in the list.',
    );
  }

  openTransactionDialog(): void {
    this.showTransactionDialog.set(true);
  }

  scrollToSection(sectionId: string): void {
    // Button-based scrolling avoids Angular route changes caused by hash links.
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  resetFilters(): void {
    this.filtersForm.reset({
      category: '',
      fromDate: null,
      toDate: null,
      type: '',
    });
  }

  exportCsv(transactions: Transaction[], account: Account): void {
    if (transactions.length === 0) {
      void this.alertService.error('Export unavailable', 'There are no transactions to export.');
      return;
    }

    // Exports the currently filtered table, not the full account history.
    const headers = ['ID', 'Account ID', 'Date', 'Type', 'Amount', 'Merchant', 'Category'];
    const rows = transactions.map((transaction) => [
      transaction.id,
      transaction.accountId,
      transaction.date,
      transaction.type,
      transaction.amount.toFixed(2),
      transaction.merchant,
      transaction.category,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => this.escapeCsvCell(String(cell))).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${account.id}-transactions.csv`;
    link.click();
    URL.revokeObjectURL(url);

    void this.alertService.success('Export ready', 'The CSV file has been downloaded.');
  }

  private filterTransactions(
    transactions: Transaction[],
    filters: TransactionFilters,
  ): Transaction[] {
    // Normalizes dates to midnight so inclusive date-range filters behave predictably.
    return transactions.filter((transaction) => {
      const transactionDate = new Date(`${transaction.date}T00:00:00`);
      const matchesType = !filters.type || transaction.type === filters.type;
      const matchesCategory = !filters.category || transaction.category === filters.category;
      const matchesFrom = !filters.fromDate || transactionDate >= filters.fromDate;
      const matchesTo = !filters.toDate || transactionDate <= filters.toDate;

      return matchesType && matchesCategory && matchesFrom && matchesTo;
    });
  }

  private filterTransactionsByMonth(transactions: Transaction[], month: string): Transaction[] {
    if (!month) {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.date.startsWith(month));
  }

  // Builds the month dropdown from transaction dates, newest month first.
  private getMonthOptions(transactions: Transaction[]): MonthOption[] {
    const months = Array.from(
      new Set(transactions.map((transaction) => transaction.date.slice(0, 7))),
    ).sort((left, right) => right.localeCompare(left));

    return months.map((month) => ({
      label: this.formatMonthLabel(month),
      value: month,
    }));
  }

  // Aggregates the selected month for the Layer Three insight cards.
  private getMonthlyInsights(transactions: Transaction[]): MonthlyInsights {
    const totals = transactions.reduce(
      (summary, transaction) => {
        if (transaction.type === 'Credit') {
          summary.totalCredit += transaction.amount;
          return summary;
        }

        summary.totalDebit += transaction.amount;
        summary.categoryTotals[transaction.category] =
          (summary.categoryTotals[transaction.category] ?? 0) + transaction.amount;
        return summary;
      },
      {
        categoryTotals: {} as Record<string, number>,
        totalCredit: 0,
        totalDebit: 0,
      },
    );
    const highestSpendingCategory = Object.entries(totals.categoryTotals).sort(
      ([, leftAmount], [, rightAmount]) => rightAmount - leftAmount,
    )[0]?.[0];

    return {
      highestSpendingCategory: highestSpendingCategory ?? 'No debit spend',
      totalCredit: totals.totalCredit,
      totalDebit: totals.totalDebit,
    };
  }

  // Date sort is descending because banking users expect recent activity first.
  private sortTransactionsByDateDesc(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((left, right) => {
      const dateComparison = right.date.localeCompare(left.date);
      return dateComparison || right.id.localeCompare(left.id);
    });
  }

  // Converts YYYY-MM into a user-friendly month label.
  private formatMonthLabel(month: string): string {
    const [year, monthIndex] = month.split('-').map(Number);
    return new Intl.DateTimeFormat('en', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, monthIndex - 1, 1));
  }

  // Protects CSV structure when a merchant/category contains commas or quotes.
  private escapeCsvCell(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  }

  // Stores dates as YYYY-MM-DD to match the static JSON shape.
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Shared touched/dirty rule for showing inline validation messages.
  private isInvalid(controlName: keyof typeof this.transactionForm.controls): boolean {
    const control = this.transactionForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
