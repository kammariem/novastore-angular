export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  active: boolean;
  createdAt: Date | string;
}
