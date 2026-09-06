import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { filter, firstValueFrom } from 'rxjs';
import { Account } from '../models/account';
import { Transaction } from '../models/transaction';
import { BankingDataService } from './banking-data.service';

describe('BankingDataService', () => {
  let httpMock: HttpTestingController;
  let service: BankingDataService;

  const accounts: Account[] = [
    {
      balance: 1000,
      currency: 'EGP',
      customerId: 'C001',
      iban: 'EG380019000000000123456789',
      id: 'A1001',
      status: 'Active',
      type: 'Current',
    },
  ];

  const transactions: Transaction[] = [
    {
      accountId: 'A1001',
      amount: 250,
      category: 'Groceries',
      date: '2025-12-01',
      id: 'T9001',
      merchant: 'Carrefour',
      type: 'Debit',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(BankingDataService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('applies debit and credit transactions to account balance', async () => {
    const initialAccount = firstValueFrom(service.getAccount('A1001'));

    httpMock.expectOne('/assets/mock/accounts.json').flush(accounts);

    expect((await initialAccount)?.balance).toBe(1000);

    service.createTransaction({
      accountId: 'A1001',
      amount: 125,
      category: 'Bills',
      date: '2025-12-05',
      merchant: 'Vodafone',
      type: 'Debit',
    });

    expect(await thisAccountBalance(875)).toBe(875);

    service.createTransaction({
      accountId: 'A1001',
      amount: 500,
      category: 'Income',
      date: '2025-12-25',
      merchant: 'Company Salary',
      type: 'Credit',
    });

    expect(await thisAccountBalance(1375)).toBe(1375);
  });

  it('merges client-created transactions with cached mock transactions', async () => {
    service.createTransaction({
      accountId: 'A1001',
      amount: 100,
      category: 'Transfer',
      date: '2025-12-15',
      merchant: 'Mobile Transfer',
      type: 'Debit',
    });

    const accountTransactions = firstValueFrom(service.getTransactionsByAccount('A1001'));

    httpMock.expectOne('/assets/mock/transactions.json').flush(transactions);

    expect(await accountTransactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'T9001', merchant: 'Carrefour' }),
        expect.objectContaining({ merchant: 'Mobile Transfer', type: 'Debit' }),
      ]),
    );
  });
});

function thisAccountBalance(expectedBalance: number): Promise<number | undefined> {
  const service = TestBed.inject(BankingDataService);

  return firstValueFrom(
    service.getAccount('A1001').pipe(
      filter((account) => account?.balance === expectedBalance),
    ),
  ).then((account) => account?.balance);
}
