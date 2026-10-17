import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('logs in against Express and maps the server administrator role', async () => {
    const login = service.login('admin@example.test', 'a-long-test-password');
    const request = http.expectOne(`${environment.apiUrl}/auth/login`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'admin@example.test',
      password: 'a-long-test-password'
    });
    request.flush({
      user: {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@example.test',
        role: 'ADMIN',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      token: 'access-token'
    });

    const result = await login;
    expect(result.user.role).toBe('admin');
    expect(service.getAccessToken()).toBe('access-token');
  });

  it('registers clients without sending a role and stores the Express session', async () => {
    const registration = service.registerClient(
      'client@example.test',
      'a-long-test-password',
      'Test Client',
      '55512345',
      'Test address'
    );
    const request = http.expectOne(`${environment.apiUrl}/auth/register`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Test Client',
      email: 'client@example.test',
      password: 'a-long-test-password',
      phone: '55512345',
      address: 'Test address'
    });
    request.flush({
      user: {
        id: 'client-1',
        name: 'Test Client',
        email: 'client@example.test',
        role: 'CLIENT',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      token: 'client-access-token'
    });

    const result = await registration;
    expect(result.user.role).toBe('client');
    expect(service.getAccessToken()).toBe('client-access-token');
  });
});
