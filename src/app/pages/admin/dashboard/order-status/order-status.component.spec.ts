import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderStatusComponent } from './order-status.component';
import { configureComponentTestBed } from '../../../../testing/component-test-bed';

describe('OrderStatusComponent', () => {
  let component: OrderStatusComponent;
  let fixture: ComponentFixture<OrderStatusComponent>;

  beforeEach(() => {
    configureComponentTestBed(OrderStatusComponent);
    fixture = TestBed.createComponent(OrderStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
