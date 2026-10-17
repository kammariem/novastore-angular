import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';
import { OrderItem } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly storageKey = 'novastore.cart';
  private itemsSubject = new BehaviorSubject<OrderItem[]>(this.restoreItems());

  items$ = this.itemsSubject.asObservable();

  getItems(): OrderItem[] {
    return this.itemsSubject.value;
  }

  async reload(): Promise<void> {
    this.itemsSubject.next(this.restoreItems());
  }

  async addToCart(product: Product, quantity = 1): Promise<void> {
    const items = [...this.getItems()];
    const existing = items.find(item => item.productId === product.id);

    if (existing) {
      const updatedItem = {
        ...existing,
        quantity: existing.quantity + quantity
      };

      this.setItems(items.map(item =>
        item.id === existing.id ? this.prepareCartItem(updatedItem) : item
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

    this.setItems([...items, this.prepareCartItem(newItem)]);
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    const cleanQuantity = Math.max(Number(quantity) || 1, 1);
    const item = this.getItems().find(cartItem => cartItem.productId === productId);

    if (!item?.id) {
      return;
    }

    this.setItems(this.getItems().map(cartItem =>
      cartItem.id === item.id
        ? this.prepareCartItem({ ...cartItem, quantity: cleanQuantity })
        : cartItem
    ));
  }

  async remove(productId: string): Promise<void> {
    const item = this.getItems().find(cartItem => cartItem.productId === productId);

    if (!item?.id) {
      return;
    }

    this.setItems(this.getItems().filter(cartItem => cartItem.id !== item.id));
  }

  async clear(): Promise<void> {
    this.setItems([]);
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

  private restoreItems(): OrderItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const serialized = localStorage.getItem(this.storageKey);
      const items = serialized ? JSON.parse(serialized) : [];
      return Array.isArray(items)
        ? items.filter(item =>
          item &&
          typeof item === 'object' &&
          typeof item.productId === 'string' &&
          typeof item.productName === 'string' &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.price) &&
          item.price >= 0
        ).map(item => this.prepareCartItem(item))
        : [];
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  private setItems(items: OrderItem[]): void {
    this.itemsSubject.next(items);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    }
  }
}
