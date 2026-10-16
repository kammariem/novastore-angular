// sales-trend.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '../../../../services/order.service';
import { Subject, takeUntil } from 'rxjs';
import { Order } from '../../../../models/order.model';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-trend',
  template: `
    <div class="chart-container">
      <h3>Tendance des ventes</h3>
      <canvas id="trendChart"></canvas>
    </div>
  `
})
export class SalesTrendComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private chart: Chart | null = null;
  private orders: Order[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.orderService.getAll().pipe(takeUntil(this.destroy$)).subscribe(orders => {
      this.orders = orders;
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
    if (this.orders.length === 0) {
      return;
    }

    // Group orders by date
    const dailySales: { [key: string]: number } = {};

    this.orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      const total = order.total || 0;
      
      dailySales[dateKey] = (dailySales[dateKey] || 0) + total;
    });

    // Sort dates chronologically
    const sortedDates = Object.keys(dailySales).sort();
    const sortedData = sortedDates.map(date => dailySales[date]);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('trendChart', {
      type: 'line',
      data: {
        labels: sortedDates,
        datasets: [{
          label: 'Ventes journalières (TND)',
          data: sortedData,
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
          fill: true,
          pointBackgroundColor: '#36A2EB',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Ventes: ${context.parsed.y} TND`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + ' TND';
              }
            }
          }
        }
      }
    });
  }
}