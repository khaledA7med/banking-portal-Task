import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  combineLatest,
  debounceTime,
  map,
  shareReplay,
  startWith,
} from 'rxjs';
import { Account } from '../../../../core/models/account';
import { BankingDataService } from '../../../../core/data-access/banking-data.service';
import { Customer } from '../../../../core/models/customer';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

interface DashboardCustomer extends Customer {
  accountCount: number;
}

interface DashboardFilters {
  search: string;
  segment: string;
}

@Component({
  imports: [
    AsyncPipe,
    ButtonModule,
    CardModule,
    CurrencyPipe,
    InputTextModule,
    ReactiveFormsModule,
    SelectModule,
    TableModule,
  ],
  selector: 'app-dashboard-page',
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private readonly bankingData = inject(BankingDataService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    search: [''],
    segment: [''],
  });

  // Builds one dashboard view model from cached data plus reactive filter changes.
  readonly vm$ = combineLatest({
    accounts: this.bankingData.getAccounts(),
    customers: this.bankingData.getCustomers(),
    filters: this.filtersForm.valueChanges.pipe(
      startWith(this.filtersForm.getRawValue()),
      debounceTime(100),
    ),
  }).pipe(
    map(({ accounts, customers, filters }) => {
      const customerRows = customers.map((customer) => ({
        ...customer,
        accountCount: this.countCustomerAccounts(accounts, customer.CIF),
      }));
      const segmentOptions = Array.from(new Set(customers.map((customer) => customer.segment)));

      return {
        activeAccounts: accounts.filter((account) => account.status === 'Active').length,
        filteredCustomers: this.filterCustomers(customerRows, filters as DashboardFilters),
        segmentOptions,
        totalAccounts: accounts.length,
        totalBalance: this.totalBalance(accounts),
        totalCustomers: customers.length,
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // Saves selected customer state before routing to the detail screen.
  viewCustomer(customerId: string): void {
    this.bankingData.selectCustomer(customerId);
    void this.router.navigate(['/customers', customerId]);
  }

  // Initials keep mobile and table rows identifiable without image assets.
  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  // Keeps the account-count calculation near the dashboard aggregation logic.
  private countCustomerAccounts(accounts: Account[], customerId: string): number {
    return accounts.filter((account) => account.customerId === customerId).length;
  }

  // Applies both dashboard filters in one pass over the customer rows.
  private filterCustomers(
    customers: DashboardCustomer[],
    filters: DashboardFilters,
  ): DashboardCustomer[] {
    const searchTerm = filters.search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSegment = !filters.segment || customer.segment === filters.segment;
      const matchesSearch =
        !searchTerm ||
        [customer.CIF, customer.name, customer.email, customer.phone]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm);

      return matchesSegment && matchesSearch;
    });
  }

  // Sums balances for the dashboard metric card.
  private totalBalance(accounts: Account[]): number {
    return accounts.reduce((total, account) => total + account.balance, 0);
  }
}
