import { computed, Injectable, signal } from '@angular/core';

const AUTH_STORAGE_KEY = 'banking-portal-auth';
const ADMIN_EMAIL = 'admin@portal.com';
const ADMIN_PASSWORD = 'Admin@123';

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Keeps the demo auth state reactive while surviving browser refreshes.
  private readonly authenticated = signal(this.readStoredAuth());

  readonly isAuthenticated = computed(() => this.authenticated());

  // Front-end-only credential check required by the task brief.
  login(credentials: LoginCredentials): boolean {
    const isValid =
      credentials.email.trim().toLowerCase() === ADMIN_EMAIL &&
      credentials.password === ADMIN_PASSWORD;

    if (isValid) {
      this.authenticated.set(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    }

    return isValid;
  }

  logout(): void {
    this.authenticated.set(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  // Local storage is enough here because the portal uses static mock data only.
  private readStoredAuth(): boolean {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  }
}
