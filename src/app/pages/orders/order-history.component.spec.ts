import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureComponentTestBed } from '../../testing/component-test-bed';
import { OrderService } from '../../services/order.service';
import { OrderHistoryComponent } from './order-history.component';

describe('OrderHistoryComponent', () => {
  let component: OrderHistoryComponent;
  let fixture: ComponentFixture<OrderHistoryComponent>;

  beforeEach(() => {
    configureComponentTestBed(OrderHistoryComponent);
    fixture = TestBed.createComponent(OrderHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the authenticated order history', async () => {
    await fixture.whenStable();
    expect(component.loading).toBeFalse();
    expect(component.orders).toEqual([]);
  });

  it('shows an actionable error when the history request fails', async () => {
    const orderService = TestBed.inject(OrderService);
    spyOn(orderService, 'reload').and.returnValue(Promise.reject(new Error('API unavailable')));

    await component.loadOrders();

    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toContain('Impossible de charger vos commandes');
  });
});
