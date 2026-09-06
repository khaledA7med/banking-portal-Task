import { TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';
import { AlertService } from './alert.service';

describe('AlertService', () => {
  let fireSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
    });

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    fireSpy.mockRestore();
  });

  it('shows error alerts through SweetAlert2', async () => {
    const service = TestBed.inject(AlertService);

    await service.error('Login failed', 'Invalid credentials');

    expect(fireSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'error',
        text: 'Invalid credentials',
        title: 'Login failed',
      }),
    );
  });
});
