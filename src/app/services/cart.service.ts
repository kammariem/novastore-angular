import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Product } from '../models/product.model';
import { OrderItem } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:3000/cart';
  private itemsSubject = new BehaviorSubject<OrderItem[]>([]);

  items$ = this.itemsSubject.asObservable();

  constructor(private http: HttpClient) {
    void this.reload();
  }

  getItems(): OrderItem[] {
    return this.itemsSubject.value;
  }

  async reload(): Promise<void> {
    const items = await firstValueFrom(this.http.get<OrderItem[]>(this.apiUrl));
    this.itemsSubject.next(items.map(item => this.prepareCartItem(item)));
  }

  async addToCart(product: Product, quantity = 1): Promise<void> {
    const items = [...this.getItems()];
    const existing = items.find(item => item.productId === product.id);

    if (existing) {
      const updatedItem = {
        ...existing,
        quantity: existing.quantity + quantity
      };

      const savedItem = await firstValueFrom(
        this.http.patch<OrderItem>(`${this.apiUrl}/${existing.id}`, updatedItem)
      );

      this.itemsSubject.next(items.map(item =>
        item.id === existing.id ? this.prepareCartItem(savedItem) : item
      ));
      return;
    }

    const newItem: OrderItem = {
      id: product.id || Date.now().toString(),
      productId: product.id || '',
      productName: product.name,
      image: product.imagesUri || product.image,
      quantity,
      price: product.price
    };

    const savedItem = await firstValueFrom(this.http.post<OrderItem>(this.apiUrl, newItem));
    this.itemsSubject.next([...items, this.prepareCartItem(savedItem)]);
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    const cleanQuantity = Math.max(Number(quantity) || 1, 1);
    const item = this.getItems().find(cartItem => cartItem.productId === productId);

    if (!item?.id) {
      return;
    }

    const savedItem = await firstValueFrom(
      this.http.patch<OrderItem>(`${this.apiUrl}/${item.id}`, { quantity: cleanQuantity })
    );

    this.itemsSubject.next(
      this.getItems().map(cartItem => cartItem.id === item.id ? this.prepareCartItem(savedItem) : cartItem)
    );
  }

  async remove(productId: string): Promise<void> {
    const item = this.getItems().find(cartItem => cartItem.productId === productId);

    if (!item?.id) {
      return;
    }

    await firstValueFrom(this.http.delete(`${this.apiUrl}/${item.id}`));
    this.itemsSubject.next(this.getItems().filter(cartItem => cartItem.id !== item.id));
  }

  async clear(): Promise<void> {
    const items = [...this.getItems()];

    for (const item of items) {
      if (item.id) {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${item.id}`));
      }
    }

    this.itemsSubject.next([]);
  }

  getTotal(): number {
    return this.getItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  private prepareCartItem(item: OrderItem): OrderItem {
    return {
      ...item,
      id: item.id == null ? String(item.productId) : String(item.id),
      productId: String(item.productId),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0
    };
  }
}
