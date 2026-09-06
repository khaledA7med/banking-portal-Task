import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Bars } from '@primeicons/angular/bars';
import { BuildingColumns } from '@primeicons/angular/building-columns';
import { ChartBar } from '@primeicons/angular/chart-bar';
import { SignOut } from '@primeicons/angular/sign-out';
import { Users } from '@primeicons/angular/users';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  imports: [
    Bars,
    BuildingColumns,
    ChartBar,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SignOut,
    Users,
  ],
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  // Local UI state for the signed-in user dropdown.
  readonly userMenuOpen = signal(false);

  // Logout is opened from the user chip, not the sidebar.
  logout(): void {
    this.userMenuOpen.set(false);
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  // Keeps the template simple while preserving signal-based state updates.
  toggleUserMenu(): void {
    this.userMenuOpen.update((isOpen) => !isOpen);
  }
}
