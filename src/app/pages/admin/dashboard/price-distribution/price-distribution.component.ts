import { Component, OnInit, OnDestroy } from "@angular/core";
import { Chart, registerables } from "chart.js";
import { ProductService } from '../../../../services/product.service';
import { Subject, takeUntil } from 'rxjs';
import { Product } from '../../../../models/product.model';

Chart.register(...registerables);

@Component({
  selector: 'app-price-distribution',
  template: `
    <div class="chart-container">
      <h3>Distribution des prix</h3>
      <canvas id="priceChart"></canvas>
      <div class="price-stats">
        <span>Prix moyen: {{ averagePrice | number }} TND</span>
        <span>Prix min: {{ minPrice }} TND</span>
        <span>Prix max: {{ maxPrice }} TND</span>
      </div>
    </div>
  `
})
export class PriceDistributionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private chart: Chart | null = null;
  private products: Product[] = [];
  averagePrice = 0;
  minPrice = 0;
  maxPrice = 0;

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

    const priceRanges = {
      '0-50': 0,
      '50-80': 0,
      '80-100': 0,
      '100+': 0
    };

    const prices = this.products.map(p => p.price);
    prices.forEach(price => {
      if (price <= 50) priceRanges['0-50']++;
      else if (price <= 80) priceRanges['50-80']++;
      else if (price <= 100) priceRanges['80-100']++;
      else priceRanges['100+']++;
    });

    this.averagePrice = prices.reduce((sum, val) => sum + val, 0) / prices.length;
    this.minPrice = Math.min(...prices);
    this.maxPrice = Math.max(...prices);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('priceChart', {
      type: 'bar',
      data: {
        labels: Object.keys(priceRanges),
        datasets: [{
          label: 'Nombre de produits',
          data: Object.values(priceRanges),
          backgroundColor: '#36A2EB',
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}