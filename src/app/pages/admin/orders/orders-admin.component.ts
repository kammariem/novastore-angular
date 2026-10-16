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
  statuses: OrderStatus[] = [
    'En attente',
    'Confirmée',
    'En préparation',
    'Livrée',
    'Annulée'
  ];

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

  changeStatus(order: Order, status: OrderStatus): void {
    if (!order.id) {
      return;
    }

    this.orderService.updateStatus(order.id, status);
  }
}
