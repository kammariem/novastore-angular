import { Component, OnInit, OnDestroy } from "@angular/core";
import { Chart, registerables } from "chart.js";
import { ProductService } from '../../../../services/product.service';
import { Subject, takeUntil } from 'rxjs';
import { Product } from '../../../../models/product.model';

Chart.register(...registerables);

@Component({
  selector: 'app-inventory-chart',
  template: `
    <div class="chart-container">
      <h3>État du stock</h3>
      <canvas id="inventoryChart"></canvas>
      <div class="chart-stats">
        <span>Stock total: {{ totalStock }}</span>
        <span>En rupture: {{ outOfStock }}</span>
      </div>
    </div>
  `
})
export class InventoryChartComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private chart: Chart | null = null;
  private products: Product[] = [];
  totalStock = 0;
  outOfStock = 0;

  constructor(private productService: ProductService) {}

  ngOnInit() {
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
    if (this.products.length === 0) {
      return;
    }

    const inStock = this.products.filter(p => p.stock > 0).reduce((sum, p) => sum + p.stock, 0);
    this.outOfStock = this.products.filter(p => p.stock === 0).length;
    this.totalStock = inStock;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('inventoryChart', {
      type: 'doughnut',
      data: {
        labels: ['En stock', 'Rupture de stock'],
        datasets: [{
          data: [inStock, this.outOfStock],
          backgroundColor: ['#4CAF50', '#FF5252'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}