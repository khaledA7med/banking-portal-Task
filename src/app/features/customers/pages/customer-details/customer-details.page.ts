import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, shareReplay, switchMap, tap } from 'rxjs';
import { Customer } from '../../../../core/models/customer';
import { BankingDataService } from '../../../../core/data-access/banking-data.service';
import { Account } from '../../../../core/models/account';
import {
  DetailListComponent,
  DetailListItem,
  StatusBadgeComponent,
} from '../../../../shared';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

@Component({
  imports: [
    AsyncPipe,
    ButtonModule,
    CardModule,
    CurrencyPipe,
    DetailListComponent,
    StatusBadgeComponent,
    TableModule,
    RouterLink,
  ],
  selector: 'app-customer-details-page',
  templateUrl: './customer-details.page.html',
})
export class CustomerDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly bankingData = inject(BankingDataService);

  // Customer id changes drive both customer profile and account list data.
  private readonly customerId$ = this.route.paramMap.pipe(
    map((params) => params.get('customerId') ?? ''),
    distinctUntilChanged(),
    tap((customerId) => this.bankingData.selectCustomer(customerId)),
  );

  // Keeps the details page template bound to one route-aware stream.
  readonly vm$ = this.customerId$.pipe(
    switchMap((customerId) =>
      combineLatest({
        accounts: this.bankingData.getAccountsByCustomer(customerId),
        customer: this.bankingData.getCustomer(customerId),
      }),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // Maps the customer model to reusable detail-list rows.
  customerProfileDetails(customer: Customer): DetailListItem[] {
    return [
      { label: 'CIF', value: customer.CIF },
      { label: 'Email', value: customer.email },
      { label: 'Phone', value: customer.phone },
      { label: 'National ID', mask: 'nationalId', value: customer.nationalId },
    ];
  }

  // Shared avatar fallback for customers without profile images.
  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  // Summary metric used by the Quick Stats card.
  totalBalance(accounts: Account[]): number {
    return accounts.reduce((total, account) => total + account.balance, 0);
  }

  // Summary metric used by the Quick Stats card.
  activeAccounts(accounts: Account[]): number {
    return accounts.filter((account) => account.status === 'Active').length;
  }
}
