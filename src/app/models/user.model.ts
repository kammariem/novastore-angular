export type UserRole = 'admin' | 'client' | 'guest';

export interface AppUser {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  createdAt?: Date | string;
}
