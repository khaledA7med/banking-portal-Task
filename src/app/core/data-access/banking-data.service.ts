import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, Observable, of, shareReplay } from 'rxjs';
import { AlertService } from '../alerts/alert.service';
import { Account } from '../models/account';
import { Customer } from '../models/customer';
import { Transaction, TransactionTypeOption } from '../models/transaction';

@Injectable({
  providedIn: 'root',
})
export class BankingDataService {
  private readonly alertService = inject(AlertService);
  private readonly http = inject(HttpClient);
  private readonly mockPath = '/assets/mock';

  // Static JSON files are cached once and replayed to every feature that needs them.
  private readonly customersRequest$ = this.loadMock<Customer[]>('customers.json', []);

  private readonly accountsRequest$ = this.loadMock<Account[]>('accounts.json', []);

  private readonly transactionsRequest$ = this.loadMock<Transaction[]>('transactions.json', []);

  private readonly transactionTypesRequest$ = this.loadMock<TransactionTypeOption[]>(
    'transaction-types.json',
    [],
  );

  private readonly transactionCategoriesRequest$ = this.loadMock<string[]>(
    'transaction-categories.json',
    [],
  );

  // Client-created transactions live in memory and layer on top of the static JSON seed.
  private readonly balanceAdjustments = signal<Record<string, number>>({});
  private readonly localTransactions = signal<Transaction[]>([]);
  private readonly balanceAdjustments$ = toObservable(this.balanceAdjustments);
  private readonly localTransactions$ = toObservable(this.localTransactions);

  readonly selectedCustomerId = signal<string | null>(null);
  readonly selectedAccountId = signal<string | null>(null);
  readonly hasSelection = computed(
    () => Boolean(this.selectedCustomerId()) || Boolean(this.selectedAccountId()),
  );

  // Returns all customers for the dashboard table.
  getCustomers(): Observable<Customer[]> {
    return this.customersRequest$;
  }

  // Reads one customer by CIF for the details page.
  getCustomer(customerId: string): Observable<Customer | undefined> {
    return this.customersRequest$.pipe(
      map((customers) => customers.find((customer) => customer.CIF === customerId)),
    );
  }

  // Combines seed accounts with in-session balance updates from new transactions.
  getAccounts(): Observable<Account[]> {
    return combineLatest([this.accountsRequest$, this.balanceAdjustments$]).pipe(
      map(([accounts, balanceAdjustments]) =>
        accounts.map((account) => this.applyBalanceAdjustment(account, balanceAdjustments)),
      ),
    );
  }

  // Filters accounts for one customer while preserving any balance adjustments.
  getAccountsByCustomer(customerId: string): Observable<Account[]> {
    return combineLatest([this.accountsRequest$, this.balanceAdjustments$]).pipe(
      map(([accounts, balanceAdjustments]) =>
        accounts
          .filter((account) => account.customerId === customerId)
          .map((account) => this.applyBalanceAdjustment(account, balanceAdjustments)),
      ),
    );
  }

  // Looks up the selected account and applies the current in-memory balance.
  getAccount(accountId: string): Observable<Account | undefined> {
    return combineLatest([this.accountsRequest$, this.balanceAdjustments$]).pipe(
      map(([accounts, balanceAdjustments]) => {
        const account = accounts.find((item) => item.id === accountId);
        return account ? this.applyBalanceAdjustment(account, balanceAdjustments) : undefined;
      }),
    );
  }

  // Provides dropdown options from static JSON so options stay data-driven.
  getTransactionTypes(): Observable<TransactionTypeOption[]> {
    return this.transactionTypesRequest$;
  }

  // Provides category dropdown options from static JSON.
  getTransactionCategories(): Observable<string[]> {
    return this.transactionCategoriesRequest$;
  }

  // Merges original and newly-created transactions for the selected account.
  getTransactionsByAccount(accountId: string): Observable<Transaction[]> {
    return combineLatest([this.transactionsRequest$, this.localTransactions$]).pipe(
      map(([seedTransactions, localTransactions]) =>
        [...seedTransactions, ...localTransactions].filter(
          (transaction) => transaction.accountId === accountId,
        ),
      ),
    );
  }

  // Creates a transaction immediately in the UI and updates the account balance.
  createTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateTransactionId(),
    };

    this.localTransactions.update((transactions) => [newTransaction, ...transactions]);
    this.balanceAdjustments.update((adjustments) => {
      const currentAdjustment = adjustments[transaction.accountId] ?? 0;
      const signedAmount =
        transaction.type === 'Credit' ? transaction.amount : -transaction.amount;

      return {
        ...adjustments,
        [transaction.accountId]: currentAdjustment + signedAmount,
      };
    });

    return newTransaction;
  }

  // Stores the current customer selection for cross-feature context.
  selectCustomer(customerId: string): void {
    this.selectedCustomerId.set(customerId);
    this.selectedAccountId.set(null);
  }

  // Stores the current account selection for transaction-focused pages.
  selectAccount(accountId: string): void {
    this.selectedAccountId.set(accountId);
  }

  // Keeps account objects immutable when applying local balance changes.
  private applyBalanceAdjustment(
    account: Account,
    balanceAdjustments: Record<string, number>,
  ): Account {
    return {
      ...account,
      balance: account.balance + (balanceAdjustments[account.id] ?? 0),
    };
  }

  // Centralized JSON loader with fallback data and user-facing error feedback.
  private loadMock<T>(fileName: string, fallback: T): Observable<T> {
    return this.http.get<T>(`${this.mockPath}/${fileName}`).pipe(
      catchError(() => {
        void this.alertService.error(
          'Data loading failed',
          `Could not load ${fileName}. Showing an empty state instead.`,
        );
        return of(fallback);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  // Client-side IDs are acceptable for this mock portal and keep rows unique.
  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `T${timestamp}${suffix}`;
  }
}
