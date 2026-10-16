import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  UserCredential,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);

  readonly adminEmail = 'admin@wamastore.com';
  readonly clientEmail = 'client@wamastore.com';

  currentUser$: Observable<User | null> = authState(this.auth);

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  registerClient(email: string, password: string, displayName: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password).then(credential => {
      const name = displayName.trim();

      if (!name) {
        return credential;
      }

      return updateProfile(credential.user, { displayName: name }).then(() => credential);
    });
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  isAdminEmail(email: string | null | undefined): boolean {
    return (email || '').toLowerCase() === this.adminEmail;
  }

  isClientEmail(email: string | null | undefined): boolean {
    return (email || '').toLowerCase() === this.clientEmail;
  }

  getRoleByEmail(email: string | null | undefined): UserRole {
    if (this.isAdminEmail(email)) {
      return 'admin';
    }

    if (email) {
      return 'client';
    }

    return 'guest';
  }
}
