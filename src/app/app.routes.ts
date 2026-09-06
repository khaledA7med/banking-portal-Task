import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canMatch: [loginGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((component) => component.LoginPage),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (component) => component.MainLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/customers/pages/dashboard/dashboard.page').then(
            (component) => component.DashboardPage,
          ),
      },
      { path: 'customers', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'customers/:customerId',
        loadComponent: () =>
          import('./features/customers/pages/customer-details/customer-details.page').then(
            (component) => component.CustomerDetailsPage,
          ),
      },
      {
        path: 'accounts/:accountId/transactions',
        loadComponent: () =>
          import('./features/transactions/pages/transactions/transactions.page').then(
            (component) => component.TransactionsPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
