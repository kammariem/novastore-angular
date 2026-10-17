import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppUser } from '../models/user.model';

interface AuthResponse {
  user: Omit<AppUser, 'role'> & { role: 'CLIENT' | 'ADMIN' };
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenStorageKey = 'novastore.accessToken';
  private readonly userStorageKey = 'novastore.user';
  private readonly currentUserSubject = new BehaviorSubject<AppUser | null>(this.restoreUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  async login(email: string, password: string): Promise<{ user: AppUser }> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
    );
    this.saveSession(response);
    const user = this.currentUserSubject.value;
    if (!user) throw new Error('The login response did not establish a user session.');
    return { user };
  }

  async registerClient(
    email: string,
    password: string,
    displayName: string,
    phone = '',
    address = ''
  ): Promise<{ user: AppUser }> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
        name: displayName,
        email,
        password,
        phone,
        address
      })
    );
    this.saveSession(response);
    const user = this.currentUserSubject.value;
    if (!user) throw new Error('The registration response did not establish a user session.');
    return { user };
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem(this.tokenStorageKey);
    sessionStorage.removeItem(this.userStorageKey);
    this.currentUserSubject.next(null);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.tokenStorageKey);
  }

  private saveSession(response: AuthResponse): void {
    const user: AppUser = {
      ...response.user,
      role: response.user.role === 'ADMIN' ? 'admin' : 'client',
      createdAt: response.user.createdAt
    };
    sessionStorage.setItem(this.tokenStorageKey, response.token);
    sessionStorage.setItem(this.userStorageKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private restoreUser(): AppUser | null {
    const token = sessionStorage.getItem(this.tokenStorageKey);
    const serializedUser = sessionStorage.getItem(this.userStorageKey);
    if (!token || !serializedUser) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      if (!payload.exp || payload.exp * 1000 <= Date.now()) {
        sessionStorage.removeItem(this.tokenStorageKey);
        sessionStorage.removeItem(this.userStorageKey);
        return null;
      }
      return JSON.parse(serializedUser) as AppUser;
    } catch {
      sessionStorage.removeItem(this.tokenStorageKey);
      sessionStorage.removeItem(this.userStorageKey);
      return null;
    }
  }
}
