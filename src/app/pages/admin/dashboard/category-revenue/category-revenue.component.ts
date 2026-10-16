import { Component, OnInit, OnDestroy } from "@angular/core";
import { Chart, registerables } from "chart.js";
import { OrderService } from '../../../../services/order.service';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { Subject, takeUntil } from 'rxjs';
import { Order } from '../../../../models/order.model';
import { Product } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';

Chart.register(...registerables);

@Component({
  selector: 'app-category-revenue',
  template: `
    <div class="chart-container">
      <h3>Revenus par catégorie</h3>
      <canvas id="revenueChart"></canvas>
      <div class="total-revenue">
        Total: {{ totalRevenue | number }} TND
      </div>
    </div>
  `
})
export class CategoryRevenueComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private chart: Chart | null = null;
  private orders: Order[] = [];
  private products: Product[] = [];
  private categories: Category[] = [];
  totalRevenue = 0;

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private categoryService: CategoryService
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

    this.categoryService.getAll().pipe(takeUntil(this.destroy$)).subscribe(categories => {
      this.categories = categories;
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
    if (this.orders.length === 0 || this.products.length === 0 || this.categories.length === 0) {
      return;
    }

    const categoryRevenue = new Map<string, number>();

    this.categories.forEach(category => {
      categoryRevenue.set(category.name, 0);
    });

    this.orders.forEach(order => {
      order.items.forEach(item => {
        const product = this.products.find(p => p.id === String(item.productId));
        if (product) {
          const currentTotal = categoryRevenue.get(product.categoryName) || 0;
          categoryRevenue.set(product.categoryName, currentTotal + (item.quantity * item.price));
        }
      });
    });

    this.totalRevenue = Array.from(categoryRevenue.values()).reduce((sum, val) => sum + val, 0);

    const labels = Array.from(categoryRevenue.keys());
    const data = Array.from(categoryRevenue.values());
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', 
      '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
    ];

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('revenueChart', {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' }
        },
        cutout: '65%'
      }
    });
  }
}