import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Order, OrderItem, OrderStatus } from '../models/order.model';
import { environment } from '../../environments/environment';

export interface CreateOrderData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: OrderItem[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;
  private ordersSubject = new BehaviorSubject<Order[]>([]);

  constructor(private http: HttpClient) {
    void this.reload();
  }

  getAll(): Observable<Order[]> {
    return this.ordersSubject.asObservable();
  }

  async reload(): Promise<void> {
    const orders = await firstValueFrom(this.http.get<Order[]>(this.apiUrl));
    this.ordersSubject.next(
      orders
        .map(order => this.prepareOrder(order))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    );
  }

  async create(order: CreateOrderData): Promise<void> {
    const newOrder: Order = {
      ...order,
      status: 'En attente',
      currency: 'TND',
      createdAt: new Date().toISOString()
    };

    const savedOrder = await firstValueFrom(this.http.post<Order>(this.apiUrl, {
      clientName: newOrder.clientName,
      clientPhone: newOrder.clientPhone,
      clientAddress: newOrder.clientAddress,
      items: newOrder.items.map(item => ({
        productId: String(item.productId),
        quantity: item.quantity
      }))
    }));
    this.ordersSubject.next([this.prepareOrder(savedOrder), ...this.ordersSubject.value]);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    const currentOrder = this.ordersSubject.value.find(order => order.id === id);

    if (!currentOrder) {
      return;
    }

    const savedOrder = await firstValueFrom(
      this.http.patch<Order>(`${this.apiUrl}/${id}`, { status })
    );

    const normalizedOrder = this.prepareOrder({
      ...currentOrder,
      ...savedOrder
    });

    this.ordersSubject.next(
      this.ordersSubject.value.map(order => order.id === id ? normalizedOrder : order)
    );
  }

  private prepareOrder(order: Order): Order {
    return {
      ...order,
      id: order.id == null ? undefined : String(order.id),
      currency: 'TND',
      items: order.items || []
    };
  }
}
