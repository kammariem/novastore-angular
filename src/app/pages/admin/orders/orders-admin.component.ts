import { Component, OnInit } from '@angular/core';
import { Order, OrderStatus } from '../../../models/order.model';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-orders-admin',
  templateUrl: './orders-admin.component.html',
  styleUrls: ['./orders-admin.component.css']
})
export class OrdersAdminComponent implements OnInit {
  orders: Order[] = [];
  selectedOrderId: string | null = null;
  errorMessage = '';
  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getAll().subscribe(orders => this.orders = orders);
  }

  toggleDetails(order: Order): void {
    if (!order.id) {
      return;
    }

    this.selectedOrderId = this.selectedOrderId === order.id ? null : order.id;
  }

  isDetailsVisible(order: Order): boolean {
    return !!order.id && this.selectedOrderId === order.id;
  }

  async changeStatus(order: Order, status: OrderStatus): Promise<void> {
    if (!order.id || status === order.status) return;
    this.errorMessage = '';
    try {
      await this.orderService.updateStatus(order.id, status);
    } catch {
      this.errorMessage = 'Impossible de mettre à jour le statut de la commande.';
    }
  }

  availableStatuses(order: Order): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      'En attente': ['Confirmée', 'Annulée'],
      'Confirmée': ['En préparation', 'Annulée'],
      'En préparation': ['Livrée', 'Annulée'],
      'Livrée': [],
      'Annulée': []
    };
    return [order.status, ...transitions[order.status]];
  }

  canChangeStatus(order: Order, status: OrderStatus): boolean {
    return order.status !== status && this.availableStatuses(order).includes(status);
  }
}
