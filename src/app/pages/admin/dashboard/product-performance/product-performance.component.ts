import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '../../../../services/order.service';
import { ProductService } from '../../../../services/product.service';
import { Subject, takeUntil } from 'rxjs';
import { Order } from '../../../../models/order.model';
import { Product } from '../../../../models/product.model';

Chart.register(...registerables);

@Component({
  selector: 'app-product-performance',
  template: `
    <div class="chart-container">
      <h3>Top produits vendus</h3>
      <canvas id="productChart"></canvas>
    </div>
  `
})
export class ProductPerformanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private chart: Chart | null = null;
  private orders: Order[] = [];
  private products: Product[] = [];

  constructor(
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.orderService.getAll().pipe(takeUntil(this.destroy$)).subscribe(orders => {
      this.orders = orders;
      this.updateChart();
    });

    this.productService.getAll().pipe(takeUntil(this.destroy$)).subscribe(products => {
      this.products = products;
      this.updateChart();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  updateChart() {
    if (this.orders.length === 0 || this.products.length === 0) {
      return;
    }

    const productSales = new Map<string, number>();

    this.orders.forEach(order => {
      order.items.forEach(item => {
        const product = this.products.find(p => p.id === String(item.productId));
        const productName = product ? product.name : item.productName;
        const currentQty = productSales.get(productName) || 0;
        productSales.set(productName, currentQty + item.quantity);
      });
    });

    const sorted = Array.from(productSales.entries()).sort((a, b) => b[1] - a[1]);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('productChart', {
      type: 'bar',
      data: {
        labels: sorted.map(([name]) => name),
        datasets: [{
          label: 'Quantité vendue',
          data: sorted.map(([, qty]) => qty),
          backgroundColor: '#FF6384',
          borderColor: '#FF6384',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}