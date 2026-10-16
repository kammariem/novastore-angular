import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ClientProfile } from '../models/client.model';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = 'http://localhost:3000/clients';
  private clientsSubject = new BehaviorSubject<ClientProfile[]>([]);
  private syncingFromOrders = false;

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

  async syncFromOrders(orders: Order[]): Promise<void> {
    if (this.syncingFromOrders) {
      return;
    }

    this.syncingFromOrders = true;

    try {
      const clients = [...this.clientsSubject.value];

      for (const order of orders) {
        const email = (order.clientEmail || '').trim().toLowerCase();
        const identifier = email || `client-${order.id}`;
        const exists = clients.some(client =>
          client.email.trim().toLowerCase() === email || client.id === identifier
        );

        if (!exists) {
          const savedClient = await this.add({
            id: identifier,
            name: order.clientName,
            email: order.clientEmail,
            phone: order.clientPhone,
            address: order.clientAddress,
            active: true,
            createdAt: order.createdAt || new Date().toISOString()
          });
          clients.unshift(savedClient);
        }
      }
    } finally {
      this.syncingFromOrders = false;
    }
  }

  async add(client: ClientProfile): Promise<ClientProfile> {
    const email = (client.email || '').trim().toLowerCase();
    const existingClient = this.clientsSubject.value.find(item =>
      item.email.trim().toLowerCase() === email || item.id === client.id
    );

    const preparedClient = this.prepareClient({
      ...client,
      email: client.email.trim(),
      active: true,
      createdAt: client.createdAt || new Date().toISOString()
    });

    if (existingClient) {
      const savedClient = await firstValueFrom(
        this.http.put<ClientProfile>(`${this.apiUrl}/${existingClient.id}`, {
          ...existingClient,
          ...preparedClient,
          id: existingClient.id
        })
      );

      const normalizedClient = this.prepareClient(savedClient);
      this.clientsSubject.next(
        this.clientsSubject.value.map(item => item.id === existingClient.id ? normalizedClient : item)
      );
      return normalizedClient;
    }

    const savedClient = await firstValueFrom(this.http.post<ClientProfile>(this.apiUrl, preparedClient));
    const normalizedClient = this.prepareClient(savedClient);
    this.clientsSubject.next([normalizedClient, ...this.clientsSubject.value]);
    return normalizedClient;
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

    const savedClient = await firstValueFrom(this.http.put<ClientProfile>(`${this.apiUrl}/${id}`, updatedClient));
    const normalizedClient = this.prepareClient(savedClient);

    this.clientsSubject.next(
      this.clientsSubject.value.map(item => item.id === id ? normalizedClient : item)
    );
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    this.clientsSubject.next(this.clientsSubject.value.filter(client => client.id !== id));
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
