import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryChartComponent } from './inventory-chart.component';
import { configureComponentTestBed } from '../../../../testing/component-test-bed';

describe('InventoryChartComponent', () => {
  let component: InventoryChartComponent;
  let fixture: ComponentFixture<InventoryChartComponent>;

  beforeEach(() => {
    configureComponentTestBed(InventoryChartComponent);
    fixture = TestBed.createComponent(InventoryChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
