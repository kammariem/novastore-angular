import { Component } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { OrderItem } from '../../models/order.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {
  items: OrderItem[] = [];

  constructor(public cartService: CartService) {
    this.cartService.items$.subscribe(items => this.items = items);
  }

  updateQuantity(productId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cartService.updateQuantity(productId, Number(input.value));
  }

  remove(productId: string): void {
    this.cartService.remove(productId);
  }

  total(): number {
    return this.cartService.getTotal();
  }
}
