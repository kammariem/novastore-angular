import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = {
    totalProducts: 0,
    availableProducts: 0,
    outOfStock: 0,
    promotions: 0,
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    totalClients: 0,
    totalCategories: 0
  };

  orders: Order[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getDashboardStats().subscribe(stats => this.stats = stats);
    this.adminService.getOrders().subscribe(orders => this.orders = orders);
  }
}
