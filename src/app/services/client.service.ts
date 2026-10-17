import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ClientProfile } from '../models/client.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/users`;
  private clientsSubject = new BehaviorSubject<ClientProfile[]>([]);
  constructor(private http: HttpClient) {
    void this.reload();
  }

  getAll(): Observable<ClientProfile[]> {
    return this.clientsSubject.asObservable();
  }

  async reload(): Promise<void> {
    const clients = await firstValueFrom(this.http.get<ClientProfile[]>(this.apiUrl));
    this.clientsSubject.next(clients.map(client => this.prepareClient(client)));
  }

  async update(id: string, client: Partial<ClientProfile>): Promise<void> {
    const currentClient = this.clientsSubject.value.find(item => item.id === id);

    if (!currentClient) {
      return;
    }

    const updatedClient = this.prepareClient({
      ...currentClient,
      ...client,
      id
    });

    const {
      id: _clientId,
      role: _role,
      email: _email,
      createdAt: _createdAt,
      ...payload
    } = updatedClient as ClientProfile & { role?: string };
    const savedClient = await firstValueFrom(this.http.patch<ClientProfile>(`${this.apiUrl}/${id}`, payload));
    const normalizedClient = this.prepareClient(savedClient);

    this.clientsSubject.next(
      this.clientsSubject.value.map(item => item.id === id ? normalizedClient : item)
    );
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    this.clientsSubject.next(this.clientsSubject.value.map(client =>
      client.id === id ? { ...client, active: false } : client
    ));
  }

  private prepareClient(client: ClientProfile): ClientProfile {
    return {
      ...client,
      id: String(client.id),
      phone: client.phone || '',
      address: client.address || '',
      active: client.active !== false,
      createdAt: client.createdAt || new Date().toISOString()
    };
  }
}
