import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('authenticates the configured admin user', () => {
    const service = TestBed.inject(AuthService);

    const result = service.login({
      email: 'admin@portal.com',
      password: 'Admin@123',
    });

    expect(result).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('rejects invalid credentials', () => {
    const service = TestBed.inject(AuthService);

    const result = service.login({
      email: 'user@portal.com',
      password: 'Admin@123',
    });

    expect(result).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears authentication on logout', () => {
    const service = TestBed.inject(AuthService);

    service.login({
      email: 'admin@portal.com',
      password: 'Admin@123',
    });
    service.logout();

    expect(service.isAuthenticated()).toBe(false);
  });
});
