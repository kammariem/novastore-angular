import { Component, OnInit, OnDestroy } from "@angular/core";
import { Chart, registerables } from "chart.js";
import { OrderService } from '../../../../services/order.service';
import { Subject, takeUntil } from 'rxjs';
import { Order } from '../../../../models/order.model';

Chart.register(...registerables);

@Component({
  selector: 'app-order-status',
  template: `
    <div class="chart-container">
      <h3>Statut des commandes</h3>
      <canvas id="statusChart"></canvas>
    </div>
  `
})
export class OrderStatusComponent implements OnInit, OnDestroy {
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

    const statusCount = this.orders.reduce((acc: Record<string, number>, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(statusCount);
    const data = Object.values(statusCount);
    const colors = ['#FFA726', '#66BB6A', '#42A5F5'];

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('statusChart', {
      type: 'pie',
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
          legend: { position: 'bottom' }
        }
      }
    });
  }
}