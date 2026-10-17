import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  loading = true;
  errorMessage = '';

  private ordersSubscription?: Subscription;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.ordersSubscription = this.orderService.getAll().subscribe(orders => {
      this.orders = orders;
    });
    void this.loadOrders();
  }

  ngOnDestroy(): void {
    this.ordersSubscription?.unsubscribe();
  }

  async loadOrders(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      await this.orderService.reload();
    } catch {
      this.errorMessage = 'Impossible de charger vos commandes. Vérifiez la connexion puis réessayez.';
    } finally {
      this.loading = false;
    }
  }
}
