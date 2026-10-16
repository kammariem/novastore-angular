import { Injectable } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { ProductService } from './product.service';
import { OrderService } from './order.service';
import { ClientService } from './client.service';
import { CategoryService } from './category.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private clientService: ClientService,
    private categoryService: CategoryService
  ) {}

  getDashboardStats() {
    return combineLatest([
      this.productService.getAll(),
      this.orderService.getAll(),
      this.clientService.getAll(),
      this.categoryService.getAll()
    ]).pipe(
      map(([products, orders, clients, categories]) => {
        this.clientService.syncFromOrders(orders);

        return {
          totalProducts: products.length,
          availableProducts: products.filter(product => product.available).length,
          outOfStock: products.filter(product => product.stock === 0).length,
          promotions: products.filter(product => product.promotion).length,
          totalOrders: orders.length,
          pendingOrders: orders.filter(order => order.status === 'En attente').length,
          confirmedOrders: orders.filter(order => order.status === 'Confirmée').length,
          totalClients: clients.length,
          totalCategories: categories.length
        };
      })
    );
  }

  getOrders() {
    return this.orderService.getAll();
  }
}
